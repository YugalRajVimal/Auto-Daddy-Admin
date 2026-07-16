import { normalizeMediaUrl } from "./normalizeMediaUrl";

export type PartsDealerCard = {
  name: string;
  phone: string;
  imageUrl?: string;
  city?: string;
  website?: string;
  specialty?: string;
};

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

function specialtyFromCategories(categories: unknown): string {
  if (Array.isArray(categories)) {
    return categories.map(asString).filter(Boolean).join(", ");
  }
  return asString(categories);
}

function unwrapDealerList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = asRecord(payload);
  if (!root) return [];
  if (Array.isArray(root.dealers)) return root.dealers;
  if (Array.isArray(root.partsDealers)) return root.partsDealers;
  if (Array.isArray(root.autoPartsDealers)) return root.autoPartsDealers;
  if (Array.isArray(root.data)) return root.data;
  const nested = asRecord(root.data);
  if (nested) {
    if (Array.isArray(nested.dealers)) return nested.dealers;
    if (Array.isArray(nested.partsDealers)) return nested.partsDealers;
    if (Array.isArray(nested.data)) return nested.data;
  }
  return [];
}

function parseDealerItem(item: unknown): PartsDealerCard | null {
  const o = asRecord(item);
  if (!o) return null;

  const name = asString(o.dealership ?? o.name ?? o.businessName ?? o.dealerName);
  if (!name) return null;

  const phone = asString(o.phone ?? o.contactNo ?? o.businessPhone);
  const rawImage = asString(o.dealerImage ?? o.imageUrl ?? o.photo ?? o.image ?? o.logoUrl);
  const imageUrl = normalizeMediaUrl(rawImage) ?? "";
  const city = asString(o.city ?? o.location);
  const website = asString(o.websiteUrl ?? o.website ?? o.businessWebsite ?? o.webUrl);
  const specialty = asString(
    o.specialty ?? o.shopType ?? o.category ?? specialtyFromCategories(o.categories),
  );

  return {
    name,
    phone,
    ...(imageUrl ? { imageUrl } : {}),
    ...(city ? { city } : {}),
    ...(website ? { website } : {}),
    ...(specialty ? { specialty } : {}),
  };
}

/** Parse dealer ads from `/autoshop-deals/dealers` or a dashboard-style payload. */
export function parsePartsDealersFromPayload(payload: unknown): PartsDealerCard[] {
  const out: PartsDealerCard[] = [];
  for (const item of unwrapDealerList(payload)) {
    const dealer = parseDealerItem(item);
    if (dealer) out.push(dealer);
  }
  return out;
}

/** Resolve sidebar ad dealers from a dealers / dashboard API payload. */
export function resolvePartsDealersFromPayload(payload: unknown): PartsDealerCard[] {
  return parsePartsDealersFromPayload(payload);
}

export function resolvePartsDealerLink(dealer: PartsDealerCard): string | null {
  const website = dealer.website?.trim();
  if (website) {
    return website.startsWith("http") ? website : `https://${website}`;
  }

  const phoneDigits = dealer.phone?.replace(/\D/g, "") ?? "";
  if (phoneDigits) return `tel:${phoneDigits}`;

  const city = dealer.city?.trim();
  if (city && city !== "—") {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(city)}`;
  }

  return null;
}

export function openPartsDealerLink(dealer: PartsDealerCard): void {
  const href = resolvePartsDealerLink(dealer);
  if (!href) return;

  if (href.startsWith("tel:")) {
    window.location.href = href;
    return;
  }

  window.open(href, "_blank", "noopener,noreferrer");
}
