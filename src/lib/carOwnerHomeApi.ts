import { getJson } from "../api/mobileAuth";
import type { CarOwnerContentBlock, CarOwnerDashboardData } from "../hooks/useOwnerPortal";
import type { DummyFaqItem } from "./dummyOwnerHomeProfile";

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
export function fetchCarOwnerHome(token: string) {
  return getJson<CarOwnerDashboardData>("/api/carowner/home", token);
}

/** GET /api/carowner/common/faq?role=carowner */
export function fetchCarOwnerFaqs(token: string, role = "carowner") {
  return getJson<unknown>(
    withQuery("/api/carowner/common/faq", { role }),
    token,
  );
}

/** GET /api/carowner/common/privacy-and-disclaimer */
export function fetchCarOwnerPrivacy(
  token: string,
  query: { country?: string; type?: string } = {},
) {
  return getJson<unknown>(
    withQuery("/api/carowner/common/privacy-and-disclaimer", {
      country: query.country ?? "canada",
      type: query.type ?? "privacy",
    }),
    token,
  );
}

/** GET /api/carowner/common/product-features */
export function fetchCarOwnerProductFeatures(
  token: string,
  query: { country?: string; role?: string } = {},
) {
  return getJson<unknown>(
    withQuery("/api/carowner/common/product-features", {
      country: query.country ?? "canada",
      role: query.role ?? "carowner",
    }),
    token,
  );
}

export function parseCarOwnerFaqItems(payload: unknown): DummyFaqItem[] {
  const out: DummyFaqItem[] = [];
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
  const first = list.length > 0 ? asRecord(list[0]) : asRecord(payload) ?? asRecord(asRecord(payload)?.data);
  if (!first) return { heading: "Privacy Policy", description: "" };

  const type = asString(first.type);
  const heading =
    type.toLowerCase().includes("privacy") || !type
      ? "Privacy Policy"
      : type;
  const description = asString(
    first.description ?? first.desc ?? first.body ?? first.content,
  );

  // If multiple entries, join descriptions for the document view.
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
