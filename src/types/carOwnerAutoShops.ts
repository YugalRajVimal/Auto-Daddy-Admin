/** One service a shop offers, with optional shop-specific sub-services (from `myServices`). */
export type CarOwnerShopServiceOffering = {
  id: string;
  name: string;
  subServices: { id?: string; name: string }[];
};

/** Normalized row for car-owner shop listings (GET /api/user/auto-shops). */
export type CarOwnerAutoShopListItem = {
  id: string;
  name: string;
  rating: number;
  logoUrl: string | null;
  city: string;
  timing: string;
  openHoursText: string;
  openDaysText: string;
  closedScheduleText: string;
  mainServices: string[];
  mainServiceItems: { id: string; name: string }[];
  subServices: string[];
  /** Hierarchical services from `myServices` (preferred for filters). */
  serviceOfferings: CarOwnerShopServiceOffering[];
  /** Car company / brand names the shop specializes in. */
  carCompanies: string[];
  address: string;
  phone: string;
  website: string;
  mapLat: number | null;
  mapLng: number | null;
  openWeekdays: string[];
  closedWeekdays: string[];
  isFavorite: boolean;
  /** Primary / first shop type (backward compatible). */
  shopType: string;
  /** All shop types from API — can be a string or array like `["autoShop","carWash"]`. */
  shopTypes: string[];
};
