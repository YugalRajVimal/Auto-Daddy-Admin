import type { OwnerShopType } from "./serviceCatalog";

export type ShopType = OwnerShopType;

/** Labels match Admin → Auto Shop Owners form. */
export const SHOP_TYPE_OPTIONS: { value: ShopType; label: string }[] = [
  { value: "autoShop", label: "Mechanic Shop" },
  { value: "carWash", label: "Car Washing" },
  { value: "tyreShop", label: "Tire Master" },
  { value: "towTruck", label: "Tow Truck" },
];

export function normalizeShopType(value?: string | null): ShopType {
  if (value === "autoShop" || value === "tyreShop" || value === "carWash" || value === "towTruck") {
    return value;
  }
  return "autoShop";
}

export function getShopTypeLabel(value?: string | null): string {
  const shopType = normalizeShopType(value);
  return SHOP_TYPE_OPTIONS.find((option) => option.value === shopType)?.label ?? "Mechanic Shop";
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
