import { withPartsDealerDummyImages } from "./shopAdDummyImages";

export type PartsDealerCard = {
  name: string;
  phone: string;
  imageUrl?: string;
  city?: string;
  website?: string;
  specialty?: string;
};

export const FALLBACK_PARTS_DEALERS: PartsDealerCard[] = withPartsDealerDummyImages([
  {
    name: "Hindustan Agencies",
    phone: "289 763 5476",
    city: "Mississauga",
    specialty: "Aftermarket Spares Specialist",
  },
  {
    name: "Ram Singh & Sons",
    phone: "289 763 5476",
    city: "Brampton",
    specialty: "Auto Parts Dealer",
  },
  {
    name: "Metro Auto Supply",
    phone: "416 555 0192",
    city: "Toronto",
    specialty: "OEM & Aftermarket Parts",
  },
]);

function parseDealersFromPayload(payload: unknown): PartsDealerCard[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const raw =
    root.dealers ??
    root.partsDealers ??
    root.autoPartsDealers ??
    (root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>).dealers ??
        (root.data as Record<string, unknown>).partsDealers
      : null);
  if (!Array.isArray(raw)) return [];
  const out: PartsDealerCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = String(o.name ?? o.businessName ?? o.dealerName ?? "").trim();
    const phone = String(o.phone ?? o.contactNo ?? o.businessPhone ?? "").trim();
    const imageUrl = String(o.imageUrl ?? o.photo ?? o.image ?? o.logoUrl ?? "").trim();
    const city = String(o.city ?? o.location ?? "").trim();
    const website = String(o.website ?? o.businessWebsite ?? o.webUrl ?? "").trim();
    const specialty = String(o.specialty ?? o.shopType ?? o.category ?? "").trim();
    if (name) {
      out.push({
        name,
        phone,
        ...(imageUrl ? { imageUrl } : {}),
        ...(city ? { city } : {}),
        ...(website ? { website } : {}),
        ...(specialty ? { specialty } : {}),
      });
    }
  }
  return out;
}

/** Resolve sidebar ad dealers from a dashboard API payload (no network). */
export function resolvePartsDealersFromPayload(payload: unknown): PartsDealerCard[] {
  const parsed = parseDealersFromPayload(payload);
  const dealers = parsed.length > 0 ? parsed : FALLBACK_PARTS_DEALERS;
  return withPartsDealerDummyImages(dealers);
}
