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
  // Keep `autoShops` as a route alias, but always hit the API with canonical `autoShop`.
  autoShops: {
    shopType: "autoShop",
    title: "Auto Shops",
    href: "/(car-owner)/schedule-service?shopType=autoShop",
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

/** Canonical value accepted by GET /api/user/auto-shops?shopType= */
export function carOwnerShopTypeApiValue(shopType: CarOwnerShopType | null | undefined): string | null {
  if (!shopType) return null;
  if (shopType === "autoShops" || shopType === "autoShop") return "autoShop";
  return shopType;
}

export function parseCarOwnerShopTypeParam(raw: unknown): CarOwnerShopType | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return null;
  if (value in CAR_OWNER_SHOP_TYPE_SCREENS) {
    // Normalize legacy `autoShops` deep links to the canonical API value.
    return value === "autoShops" ? "autoShop" : (value as CarOwnerShopType);
  }
  return null;
}

export function carOwnerShopTypeScreenTitle(shopType: CarOwnerShopType | null): string {
  if (!shopType) return "Auto Shops";
  return CAR_OWNER_SHOP_TYPE_SCREENS[shopType]?.title ?? "Auto Shops";
}

export function carOwnerShopTypeMatches(
  shopShopType: string | null | undefined,
  filterShopType: CarOwnerShopType | null,
  shopShopTypes?: readonly string[] | null
): boolean {
  if (!filterShopType) return true;

  const candidates = [
    ...(Array.isArray(shopShopTypes) ? shopShopTypes : []),
    ...(shopShopType ? [shopShopType] : []),
  ]
    .map((t) => t.trim())
    .filter(Boolean);

  // Backend / admin default missing type to autoShop.
  const types = candidates.length > 0 ? candidates : ["autoShop"];
  const aliases = SHOP_TYPE_ALIASES[filterShopType];

  return types.some((normalized) => {
    if (aliases) {
      return aliases.includes(normalized as CarOwnerShopType);
    }
    return normalized === filterShopType;
  });
}

export function scheduleServiceListHref(shopType: CarOwnerShopType | null): string {
  if (!shopType) return "/(car-owner)/schedule-service";
  return CAR_OWNER_SHOP_TYPE_SCREENS[shopType]?.href ?? "/(car-owner)/schedule-service";
}
