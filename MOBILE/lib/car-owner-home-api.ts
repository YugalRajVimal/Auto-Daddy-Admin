import { getJson } from "@/lib/api";
import type {
  CarOwnerContentBlock,
  CarOwnerDashboardApiResponse,
  CarOwnerDashboardPayload,
  CarOwnerUserProfile,
} from "@/types/car-owner-dashboard";

export type CarOwnerFaqItem = {
  question: string;
  answer: string;
};

function withQuery(path: string, query: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v != null && String(v).trim() !== "") usp.append(k, String(v));
  }
  const s = usp.toString();
  return s ? `${path}?${s}` : path;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function unwrapList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = asRecord(payload);
  if (!root) return [];
  if (Array.isArray(root.data)) return root.data;
  if (Array.isArray(root.faqs)) return root.faqs;
  if (Array.isArray(root.features)) return root.features;
  if (Array.isArray(root.items)) return root.items;
  const nested = asRecord(root.data);
  if (nested) {
    if (Array.isArray(nested.data)) return nested.data;
    if (Array.isArray(nested.faqs)) return nested.faqs;
    if (Array.isArray(nested.features)) return nested.features;
    if (Array.isArray(nested.items)) return nested.items;
  }
  return [];
}

/** GET /api/carowner/home */
export function fetchCarOwnerHome(authToken: string) {
  return getJson<CarOwnerDashboardApiResponse>("/api/carowner/home", { authToken });
}

/** GET /api/carowner/common/faq?role=carowner */
export function fetchCarOwnerFaqs(authToken: string, role = "carowner") {
  return getJson<unknown>(withQuery("/api/carowner/common/faq", { role }), { authToken });
}

/** GET /api/carowner/common/privacy-and-disclaimer */
export function fetchCarOwnerPrivacy(
  authToken: string,
  query: { country?: string; type?: string } = {}
) {
  return getJson<unknown>(
    withQuery("/api/carowner/common/privacy-and-disclaimer", {
      country: query.country ?? "canada",
      type: query.type ?? "privacy",
    }),
    { authToken }
  );
}

/** GET /api/carowner/common/product-features */
export function fetchCarOwnerProductFeatures(
  authToken: string,
  query: { country?: string; role?: string } = {}
) {
  return getJson<unknown>(
    withQuery("/api/carowner/common/product-features", {
      country: query.country ?? "canada",
      role: query.role ?? "carowner",
    }),
    { authToken }
  );
}

export function parseCarOwnerFaqItems(payload: unknown): CarOwnerFaqItem[] {
  const out: CarOwnerFaqItem[] = [];
  for (const item of unwrapList(payload)) {
    const obj = asRecord(item);
    if (!obj) continue;
    const question = asString(obj.question ?? obj.heading ?? obj.title);
    const answer = asString(obj.answer ?? obj.desc ?? obj.description ?? obj.body);
    if (!question && !answer) continue;
    out.push({
      question: question || "Question",
      answer: answer || "—",
    });
  }
  return out;
}

export function parseCarOwnerPrivacy(payload: unknown): {
  heading: string;
  description: string;
} {
  const list = unwrapList(payload);
  const first =
    list.length > 0 ? asRecord(list[0]) : asRecord(payload) ?? asRecord(asRecord(payload)?.data);
  if (!first) return { heading: "Privacy Policy", description: "" };

  const type = asString(first.type);
  const heading =
    type.toLowerCase().includes("privacy") || !type ? "Privacy Policy" : type;
  const description = asString(first.description ?? first.desc ?? first.body ?? first.content);

  if (list.length > 1) {
    const joined = list
      .map((item) => {
        const obj = asRecord(item);
        if (!obj) return "";
        const title = asString(obj.type);
        const body = asString(obj.description ?? obj.desc ?? obj.body);
        if (title && body) return `${title}\n${body}`;
        return body || title;
      })
      .filter(Boolean)
      .join("\n\n");
    return { heading, description: joined || description };
  }

  return { heading, description };
}

export function parseCarOwnerProductFeatures(payload: unknown): CarOwnerContentBlock[] {
  const out: CarOwnerContentBlock[] = [];
  for (const item of unwrapList(payload)) {
    const obj = asRecord(item);
    if (!obj) continue;
    const featureText = asString(obj.feature ?? obj.desc ?? obj.description ?? obj.body);
    const heading = asString(obj.heading ?? obj.title ?? obj.name);
    if (!heading && !featureText) continue;
    const block: CarOwnerContentBlock = {
      heading: heading || featureText.slice(0, 48) || "Feature",
      desc: featureText || "",
    };
    const id = asString(obj._id ?? obj.id);
    if (id) block._id = id;
    out.push(block);
  }
  return out;
}

/** Normalize nested `/api/carowner/home` payload into the shape mobile home already expects. */
export function coalesceCarOwnerHomePayload(
  raw: CarOwnerDashboardApiResponse | null
): CarOwnerDashboardApiResponse | null {
  if (!raw || typeof raw !== "object") return null;

  const nested = raw.data && typeof raw.data === "object" ? raw.data : null;
  const nestedThought = nested?.thoughtOfTheDay;
  const likesFromThought =
    nestedThought &&
    typeof nestedThought === "object" &&
    typeof (nestedThought as { likes?: unknown }).likes === "number"
      ? (nestedThought as { likes: number }).likes
      : null;
  const nestedLike =
    typeof nested?.thoughtOfTheDayLike === "number" ? nested.thoughtOfTheDayLike : likesFromThought;

  const pick = (...vals: unknown[]) => {
    for (const v of vals) {
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
  };

  const carOwnerName = pick(nested?.name, nested?.carOwnerName, raw.userProfile?.name);
  const carOwnerCity = pick(nested?.city, raw.userProfile?.city);

  const dashboardFromNested =
    nestedThought != null || nestedLike != null
      ? {
          ...(typeof raw.dashboard === "object" && raw.dashboard ? raw.dashboard : {}),
          thoughtOfTheDay:
            (nestedThought as CarOwnerDashboardPayload["thoughtOfTheDay"]) ??
            raw.dashboard?.thoughtOfTheDay,
          thoughtOfTheDayLike:
            typeof nestedLike === "number" ? nestedLike : raw.dashboard?.thoughtOfTheDayLike,
        }
      : raw.dashboard;

  const profile = raw.userProfile
    ? {
        ...raw.userProfile,
        name: pick(raw.userProfile.name, carOwnerName) || raw.userProfile.name,
        city: pick(raw.userProfile.city, carOwnerCity) || raw.userProfile.city,
      }
    : carOwnerName || carOwnerCity
      ? ({ name: carOwnerName || undefined, city: carOwnerCity || undefined } as CarOwnerUserProfile)
      : raw.userProfile;

  return {
    ...raw,
    success: raw.success !== false,
    dashboard: dashboardFromNested ?? raw.dashboard ?? {},
    userProfile: profile,
    nextService: raw.nextService ?? null,
  };
}
