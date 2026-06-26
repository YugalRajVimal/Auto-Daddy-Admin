import { getJson } from "../api/mobileAuth";

export type PartsDealerCard = {
  name: string;
  phone: string;
  imageUrl?: string;
  city?: string;
  website?: string;
  specialty?: string;
};

function dealerPlaceholderImage(name: string, index = 0): string {
  const seed =
    name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || `dealer-${index}`;
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/400`;
}

export function withPlaceholderImages(dealers: PartsDealerCard[]): PartsDealerCard[] {
  return dealers.map((dealer, index) => ({
    ...dealer,
    imageUrl: dealer.imageUrl?.trim() || dealerPlaceholderImage(dealer.name, index),
  }));
}

export const FALLBACK_PARTS_DEALERS: PartsDealerCard[] = withPlaceholderImages([
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

export async function fetchPartsDealers(token: string): Promise<PartsDealerCard[]> {
  const res = await getJson<unknown>("/api/auto-shop-owner/dashboard-details-new", token);
  const parsed = res.ok && res.data ? parseDealersFromPayload(res.data) : [];
  return parsed.length > 0 ? withPlaceholderImages(parsed) : FALLBACK_PARTS_DEALERS;
}
