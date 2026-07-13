import type { ShopCarCompany } from "../components/shop/forms/ShopProfileEditors";
import { normalizeMediaUrl } from "./normalizeMediaUrl";

const WVL = "https://cdn.worldvectorlogo.com/logos";

/** Placeholder catalog until main-car-companies API is fully populated. */
export const DUMMY_CAR_BRANDS: ShopCarCompany[] = [
  { _id: "dummy-toyota", companyName: "Toyota", brandLogo: `${WVL}/toyota-1.svg` },
  { _id: "dummy-honda", companyName: "Honda", brandLogo: `${WVL}/honda-2.svg` },
  { _id: "dummy-nissan", companyName: "Nissan", brandLogo: `${WVL}/nissan-6.svg` },
  { _id: "dummy-ford", companyName: "Ford", brandLogo: `${WVL}/ford-8.svg` },
  { _id: "dummy-chevrolet", companyName: "Chevrolet", brandLogo: `${WVL}/chevrolet-1.svg` },
  { _id: "dummy-bmw", companyName: "BMW", brandLogo: `${WVL}/bmw-2.svg` },
  { _id: "dummy-mercedes", companyName: "Mercedes-Benz", brandLogo: `${WVL}/mercedes-benz-9.svg` },
  { _id: "dummy-hyundai", companyName: "Hyundai", brandLogo: `${WVL}/hyundai-3.svg` },
  { _id: "dummy-kia", companyName: "Kia", brandLogo: `${WVL}/kia-motors-1.svg` },
  { _id: "dummy-mazda", companyName: "Mazda", brandLogo: `${WVL}/mazda-6.svg` },
  { _id: "dummy-subaru", companyName: "Subaru", brandLogo: `${WVL}/subaru-2.svg` },
  { _id: "dummy-volkswagen", companyName: "Volkswagen", brandLogo: `${WVL}/volkswagen-9.svg` },
  { _id: "dummy-tesla", companyName: "Tesla", brandLogo: `${WVL}/tesla-9.svg` },
];

/** Sample brands shown on the shop profile for demo purposes. */
export const DUMMY_SELECTED_CAR_BRAND_IDS = ["dummy-toyota", "dummy-honda", "dummy-nissan"];

const DUMMY_LOGO_BY_NAME = new Map(
  DUMMY_CAR_BRANDS.map((brand) => [normalizeBrandName(getCarBrandName(brand)), brand.brandLogo ?? ""])
);

export function getCarBrandId(company: ShopCarCompany): string {
  return String(company._id ?? company.id ?? "");
}

export function getCarBrandName(company: ShopCarCompany): string {
  return (company.name ?? company.companyName ?? "").trim() || "—";
}

function normalizeBrandName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function findDummyBrandByName(name: string): ShopCarCompany | undefined {
  const key = normalizeBrandName(name);
  return DUMMY_CAR_BRANDS.find((brand) => normalizeBrandName(getCarBrandName(brand)) === key);
}

function letterFallback(name: string): string {
  const label = encodeURIComponent(name || "Car");
  return `https://ui-avatars.com/api/?name=${label}&background=f3f4f6&color=374151&size=128&bold=true`;
}

/** Resolve a display logo — API logo first, then dummy catalog match, then generated placeholder. */
export function resolveCarBrandLogo(company?: ShopCarCompany | null): string {
  const name = company ? getCarBrandName(company) : "";
  const apiLogo = normalizeMediaUrl(company?.brandLogo ?? company?.logoUrl ?? null);
  if (apiLogo && !apiLogo.includes("wikimedia.org")) return apiLogo;

  const dummyLogo = DUMMY_LOGO_BY_NAME.get(normalizeBrandName(name));
  if (dummyLogo) return dummyLogo;

  return letterFallback(name);
}

/** Merge API brands with dummy catalog and attach fallback logos. */
export function mergeCarBrandCatalog(apiBrands: ShopCarCompany[]): ShopCarCompany[] {
  const merged = new Map<string, ShopCarCompany>();

  for (const dummy of DUMMY_CAR_BRANDS) {
    merged.set(normalizeBrandName(getCarBrandName(dummy)), { ...dummy });
  }

  for (const apiBrand of apiBrands) {
    const key = normalizeBrandName(getCarBrandName(apiBrand));
    const dummy = merged.get(key) ?? findDummyBrandByName(getCarBrandName(apiBrand));
    const apiLogo = apiBrand.brandLogo ?? apiBrand.logoUrl;
    const useApiLogo = apiLogo && !String(apiLogo).includes("wikimedia.org");
    merged.set(key, {
      ...dummy,
      ...apiBrand,
      brandLogo: useApiLogo ? apiLogo : dummy?.brandLogo ?? null,
    });
  }

  return [...merged.values()];
}

export function buildSelectedBrandIds(
  catalog: ShopCarCompany[],
  apiSelectedIds: Iterable<string>
): Set<string> {
  const selectedNames = new Set(
    DUMMY_CAR_BRANDS.filter((brand) => DUMMY_SELECTED_CAR_BRAND_IDS.includes(getCarBrandId(brand))).map((brand) =>
      normalizeBrandName(getCarBrandName(brand))
    )
  );

  for (const id of apiSelectedIds) {
    const match = catalog.find((brand) => getCarBrandId(brand) === id);
    if (match) selectedNames.add(normalizeBrandName(getCarBrandName(match)));
  }

  const ids = new Set<string>();
  for (const brand of catalog) {
    if (selectedNames.has(normalizeBrandName(getCarBrandName(brand)))) {
      ids.add(getCarBrandId(brand));
    }
  }
  return ids;
}

export function getSelectedCarBrands(catalog: ShopCarCompany[], selectedIds: Set<string>): ShopCarCompany[] {
  const selectedNames = new Set<string>();
  for (const brand of catalog) {
    if (selectedIds.has(getCarBrandId(brand))) {
      selectedNames.add(normalizeBrandName(getCarBrandName(brand)));
    }
  }

  return catalog.filter((brand) => selectedNames.has(normalizeBrandName(getCarBrandName(brand))));
}

export function isDummyCarBrandId(id: string): boolean {
  return id.startsWith("dummy-");
}
