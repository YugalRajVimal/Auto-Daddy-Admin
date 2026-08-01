import { normalizeMediaUrl } from "@/lib/normalize-media-url";

/** Normalize company / make names for case-insensitive logo lookup. */
export function normalizeCarBrandName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * PNG brand marks used when the car-companies API has no logo yet,
 * or when the uploaded logo URL 404s.
 * (Remote SVGs are unreliable in React Native Image.)
 */
const FALLBACK_BRAND_LOGOS: Record<string, string> = {
  acura: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/acura.png",
  audi: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/audi.png",
  bmw: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/bmw.png",
  buick: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/buick.png",
  cadillac: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/cadillac.png",
  chevrolet: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/chevrolet.png",
  chrysler: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/chrysler.png",
  dodge: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/dodge.png",
  ford: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/ford.png",
  gmc: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/gmc.png",
  honda: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/honda.png",
  hyundai: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/hyundai.png",
  infiniti: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/infiniti.png",
  jeep: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/jeep.png",
  kia: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/kia.png",
  lexus: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/lexus.png",
  lincoln: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/lincoln.png",
  mazda: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/mazda.png",
  mercedes: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/mercedes-benz.png",
  mercedesbenz: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/mercedes-benz.png",
  mitsubishi: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/mitsubishi.png",
  nissan: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/nissan.png",
  porsche: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/porsche.png",
  ram: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/ram.png",
  subaru: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/subaru.png",
  tesla: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/tesla.png",
  toyota: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/toyota.png",
  volkswagen: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/volkswagen.png",
  volvo: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/volvo.png",
};

export type CarBrandLogoSource = {
  companyName?: string | null;
  brandLogo?: string | null;
  logoUrl?: string | null;
};

function isSvgUrl(uri: string): boolean {
  return /\.svg(\?|#|$)/i.test(uri);
}

function letterAvatarUri(name: string): string {
  const label = encodeURIComponent(name.trim() || "Car");
  return `https://ui-avatars.com/api/?name=${label}&background=f1f5f9&color=166534&size=256&bold=true&format=png`;
}

/** Build a make-name → absolute logo URL map from the car-companies catalog. */
export function buildCarBrandLogoByName(companies: CarBrandLogoSource[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of companies) {
    const name = (c.companyName ?? "").trim();
    if (!name) continue;
    const raw =
      (typeof c.brandLogo === "string" ? c.brandLogo : null) ??
      (typeof c.logoUrl === "string" ? c.logoUrl : null);
    const uri = raw?.trim() ? normalizeMediaUrl(raw.trim()) : null;
    if (!uri || isSvgUrl(uri)) continue;
    map.set(normalizeCarBrandName(name), uri);
  }
  return map;
}

/**
 * Ordered logo candidates for a vehicle make:
 * static PNG (reliable in RN) → catalog upload → letter avatar.
 * Callers should advance on Image `onError` so broken uploads still show a brand mark.
 */
export function resolveCarBrandLogoCandidates(
  makeName?: string | null,
  logoByMake?: Map<string, string> | null
): string[] {
  const name = (makeName ?? "").trim();
  if (!name) return [];

  const key = normalizeCarBrandName(name);
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (uri: string | null | undefined) => {
    const u = uri?.trim();
    if (!u || seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };

  // Prefer dataset PNGs first — many catalog `Uploads/...` paths currently 404.
  push(FALLBACK_BRAND_LOGOS[key]);
  push(logoByMake?.get(key));
  push(letterAvatarUri(name));

  return out;
}

/**
 * Resolve a display logo for a vehicle make:
 * static brand PNG first, then catalog / API logo, then letter avatar.
 */
export function resolveCarBrandLogoUri(
  makeName?: string | null,
  logoByMake?: Map<string, string> | null
): string | null {
  return resolveCarBrandLogoCandidates(makeName, logoByMake)[0] ?? null;
}
