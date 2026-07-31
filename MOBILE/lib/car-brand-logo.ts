import { normalizeMediaUrl } from "@/lib/normalize-media-url";

/** Normalize company / make names for case-insensitive logo lookup. */
export function normalizeCarBrandName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * PNG brand marks used when the car-companies API has no logo yet.
 * (Remote SVGs from worldvectorlogo are unreliable in React Native Image.)
 */
const FALLBACK_BRAND_LOGOS: Record<string, string> = {
  toyota: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/toyota.png",
  honda: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/honda.png",
  nissan: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/nissan.png",
  ford: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/ford.png",
  chevrolet: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/chevrolet.png",
  bmw: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/bmw.png",
  mercedes: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/mercedes-benz.png",
  mercedesbenz: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/mercedes-benz.png",
  hyundai: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/hyundai.png",
  kia: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/kia.png",
  mazda: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/mazda.png",
  subaru: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/subaru.png",
  volkswagen: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/volkswagen.png",
  tesla: "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/thumb/tesla.png",
};

export type CarBrandLogoSource = {
  companyName?: string | null;
  brandLogo?: string | null;
  logoUrl?: string | null;
};

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
    if (!uri) continue;
    map.set(normalizeCarBrandName(name), uri);
  }
  return map;
}

/**
 * Resolve a display logo for a vehicle make:
 * catalog / API logo first, then static brand fallbacks.
 */
export function resolveCarBrandLogoUri(
  makeName?: string | null,
  logoByMake?: Map<string, string> | null
): string | null {
  const name = (makeName ?? "").trim();
  if (!name) return null;
  const key = normalizeCarBrandName(name);

  const fromCatalog = logoByMake?.get(key);
  if (fromCatalog) return fromCatalog;

  return FALLBACK_BRAND_LOGOS[key] ?? null;
}
