/** Backend `shopType` values for autoshopowner service catalog queries. */
export type ShopOwnerShopType = "autoShop" | "tyreShop" | "carWash" | "towTruck";

export const SHOP_OWNER_SHOP_TYPES: ShopOwnerShopType[] = [
  "autoShop",
  "tyreShop",
  "carWash",
  "towTruck",
];

export function isShopOwnerShopType(value: unknown): value is ShopOwnerShopType {
  return (
    value === "autoShop" ||
    value === "tyreShop" ||
    value === "carWash" ||
    value === "towTruck"
  );
}

/** Accepts a single type, an array, or a JSON-encoded array string from the API. */
export function normalizeShopOwnerShopTypes(value?: string | string[] | null): ShopOwnerShopType[] {
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

  const unique: ShopOwnerShopType[] = [];
  for (const item of raw) {
    if (!isShopOwnerShopType(item) || unique.includes(item)) continue;
    unique.push(item);
  }
  return unique;
}

export function shopOwnerShopTypeLabel(value?: string | null): string {
  switch (value) {
    case "tyreShop":
      return "Tyre Shop";
    case "carWash":
      return "Car Wash";
    case "towTruck":
      return "Tow Truck";
    case "autoShop":
    default:
      return "Auto Shop";
  }
}
