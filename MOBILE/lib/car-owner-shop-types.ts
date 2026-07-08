/** Backend `shopType` values returned by GET /api/user/auto-shops. */
export type CarOwnerShopType = "tyreShop" | "carWash" | "towTruck" | "autoShop" | "autoShops";

export type CarOwnerShopTypeScreenConfig = {
  shopType: CarOwnerShopType;
  /** Screen header title (e.g. "Tyre Shops"). */
  title: string;
  /** Path segment for schedule-service with shopType query. */
  href: string;
};

export const CAR_OWNER_SHOP_TYPE_SCREENS: Record<CarOwnerShopType, CarOwnerShopTypeScreenConfig> = {
  autoShops: {
    shopType: "autoShops",
    title: "Auto Shops",
    href: "/(car-owner)/schedule-service?shopType=autoShops",
  },
  autoShop: {
    shopType: "autoShop",
    title: "Auto Shops",
    href: "/(car-owner)/schedule-service?shopType=autoShop",
  },
  tyreShop: {
    shopType: "tyreShop",
    title: "Tyre Shops",
    href: "/(car-owner)/schedule-service?shopType=tyreShop",
  },
  carWash: {
    shopType: "carWash",
    title: "Car Wash",
    href: "/(car-owner)/schedule-service?shopType=carWash",
  },
  towTruck: {
    shopType: "towTruck",
    title: "Tow Trucks",
    href: "/(car-owner)/schedule-service?shopType=towTruck",
  },
};

const SHOP_TYPE_ALIASES: Record<string, CarOwnerShopType[]> = {
  autoShops: ["autoShops", "autoShop"],
  autoShop: ["autoShops", "autoShop"],
};

export function parseCarOwnerShopTypeParam(raw: unknown): CarOwnerShopType | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return null;
  if (value in CAR_OWNER_SHOP_TYPE_SCREENS) {
    return value as CarOwnerShopType;
  }
  return null;
}

export function carOwnerShopTypeScreenTitle(shopType: CarOwnerShopType | null): string {
  if (!shopType) return "Auto Shops";
  return CAR_OWNER_SHOP_TYPE_SCREENS[shopType]?.title ?? "Auto Shops";
}

export function carOwnerShopTypeMatches(
  shopShopType: string | null | undefined,
  filterShopType: CarOwnerShopType | null
): boolean {
  if (!filterShopType) return true;
  const normalized = (shopShopType ?? "").trim();
  if (!normalized) return false;
  const aliases = SHOP_TYPE_ALIASES[filterShopType];
  if (aliases) {
    return aliases.includes(normalized as CarOwnerShopType);
  }
  return normalized === filterShopType;
}

export function scheduleServiceListHref(shopType: CarOwnerShopType | null): string {
  if (!shopType) return "/(car-owner)/schedule-service";
  return CAR_OWNER_SHOP_TYPE_SCREENS[shopType]?.href ?? "/(car-owner)/schedule-service";
}
