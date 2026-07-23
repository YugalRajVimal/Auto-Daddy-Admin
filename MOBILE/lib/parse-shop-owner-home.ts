import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import type { ShopOwnerHomeApiResponse, ShopOwnerHomeData } from "@/types/shop-owner-home";

export type ShopOwnerThoughtOfTheDayView = {
  subject: string;
  text: string;
  imageUri: string | null;
  likes: number;
};

export type ShopOwnerHomeView = {
  autoShopOwnerName: string;
  businessName: string;
  daysLeftInSubscription: number;
  thoughtOfTheDay: ShopOwnerThoughtOfTheDayView | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string") {
      const s = v.trim();
      if (s) return s;
    }
  }
  return "";
}

function pickNumber(...vals: unknown[]): number {
  for (const v of vals) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

/** Unwrap `{ success, data }` or nested `{ data: { data } }` envelopes. */
export function unwrapShopOwnerHomePayload(payload: unknown): ShopOwnerHomeData | null {
  const root = asRecord(payload);
  if (!root) return null;

  const nested = asRecord(root.data);
  if (nested) {
    // `{ success, data: { thoughtOfTheDay, businessName, ... } }`
    if (
      "businessName" in nested ||
      "daysLeftInSubscription" in nested ||
      "thoughtOfTheDay" in nested ||
      "autoShopOwnerName" in nested
    ) {
      return nested as unknown as ShopOwnerHomeData;
    }
    // Extra nest: `{ data: { data: { ... } } }`
    const deep = asRecord(nested.data);
    if (deep) return deep as unknown as ShopOwnerHomeData;
  }

  if (
    "businessName" in root ||
    "daysLeftInSubscription" in root ||
    "thoughtOfTheDay" in root
  ) {
    return root as unknown as ShopOwnerHomeData;
  }

  return null;
}

export function parseShopOwnerThoughtOfTheDay(
  raw: ShopOwnerHomeData["thoughtOfTheDay"] | unknown
): ShopOwnerThoughtOfTheDayView | null {
  if (raw == null) return null;

  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return null;
    return { subject: "", text, imageUri: null, likes: 0 };
  }

  const obj = asRecord(raw);
  if (!obj) return null;

  const text = pickString(obj.notes, obj.description, obj.desc, obj.text, obj.quote);
  const subject = pickString(obj.subject, obj.title, obj.heading);
  if (!text && !subject) return null;

  return {
    subject,
    text: text || subject,
    imageUri: normalizeMediaUrl(typeof obj.image === "string" ? obj.image : null),
    likes: pickNumber(obj.likes),
  };
}

export function parseShopOwnerHome(payload: unknown): ShopOwnerHomeView | null {
  const data = unwrapShopOwnerHomePayload(payload);
  if (!data) return null;

  return {
    autoShopOwnerName: pickString(data.autoShopOwnerName),
    businessName: pickString(data.businessName),
    daysLeftInSubscription: Math.max(0, pickNumber(data.daysLeftInSubscription)),
    thoughtOfTheDay: parseShopOwnerThoughtOfTheDay(data.thoughtOfTheDay),
  };
}

/** Quote string for legacy dashboard cache / simple ThoughtOfTheDay consumers. */
export function shopOwnerThoughtToQuoteString(
  thought: ShopOwnerThoughtOfTheDayView | null | undefined
): string {
  if (!thought) return "";
  if (thought.subject && thought.text && thought.subject !== thought.text) {
    return `${thought.subject}\n${thought.text}`;
  }
  return thought.text || thought.subject;
}

export function isShopOwnerHomeApiSuccess(payload: unknown): payload is ShopOwnerHomeApiResponse {
  const root = asRecord(payload);
  if (!root) return false;
  if (root.success === false) return false;
  return unwrapShopOwnerHomePayload(payload) != null;
}
