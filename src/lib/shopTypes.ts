import type { OwnerShopType } from "./serviceCatalog";

export type ShopType = OwnerShopType;

/** Labels match Admin → Auto Shop Owners form. */
export const SHOP_TYPE_OPTIONS: { value: ShopType; label: string }[] = [
  { value: "autoShop", label: "Auto Shop" },
  { value: "tyreShop", label: "Tyre Shop" },
  { value: "carWash", label: "Car Wash" },
  { value: "towTruck", label: "Tow Truck" },
];

export function isShopType(value: unknown): value is ShopType {
  return value === "autoShop" || value === "tyreShop" || value === "carWash" || value === "towTruck";
}

export function normalizeShopType(value?: string | null): ShopType {
  return isShopType(value) ? value : "autoShop";
}

/** Accepts a single type, an array, or a JSON-encoded array string from the API. */
export function normalizeShopTypes(value?: string | string[] | null): ShopType[] {
  let raw: unknown[] = [];
  if (Array.isArray(value)) {
    raw = value;
  } else if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        raw = Array.isArray(parsed) ? parsed : [trimmed];
      } catch {
        raw = [trimmed];
      }
    } else {
      raw = [trimmed];
    }
  }

  const unique: ShopType[] = [];
  for (const item of raw) {
    if (!isShopType(item) || unique.includes(item)) continue;
    unique.push(item);
  }
  return unique.length > 0 ? unique : ["autoShop"];
}

export function getShopTypeLabel(value?: string | null): string {
  const shopType = normalizeShopType(value);
  return SHOP_TYPE_OPTIONS.find((option) => option.value === shopType)?.label ?? "Auto Shop";
}

export function getShopTypeLabels(value?: string | string[] | null): string {
  return normalizeShopTypes(value)
    .map((shopType) => getShopTypeLabel(shopType))
    .join(", ");
}

export function serviceMatchesShopType(
  service: { shopType?: string | null },
  shopType: ShopType
): boolean {
  return normalizeShopType(service.shopType) === normalizeShopType(shopType);
}

export function filterServicesByShopType<T extends { shopType?: string | null }>(
  services: T[],
  shopType: ShopType
): T[] {
  const normalized = normalizeShopType(shopType);
  return services.filter((service) => serviceMatchesShopType(service, normalized));
}
