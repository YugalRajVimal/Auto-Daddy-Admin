/** Normalized row for car-owner shop listings (GET /api/user/auto-shops). */
export type CarOwnerAutoShopListItem = {
  id: string;
  name: string;
  rating: number;
  logoUrl: string | null;
  /** City name (if provided by backend). */
  city: string;
  /** Combined schedule string (search + fallback display). */
  timing: string;
  /** Open hours (08:00-20:00). Empty when unknown. */
  openHoursText: string;
  /** Open weekdays compacted (Mon–Wed, Fri). Empty when unknown. */
  openDaysText: string;
  /** Closed weekdays for UI (second line); empty if none. */
  closedScheduleText: string;
  /** Top-level service names (e.g. "Car Wash"). */
  mainServices: string[];
  /** Top-level services with ids for connect / scheduling actions. */
  mainServiceItems: { id: string; name: string }[];
  /** Nested service names (e.g. "Interior detailing"). */
  subServices: string[];
  address: string;
  phone: string;
  website: string;
  /** WGS84 when backend sends sane coordinates; otherwise null (use address for maps). */
  mapLat: number | null;
  mapLng: number | null;
  /** Canonical weekday names (Monday…) from API `openDays`, for “open today” filtering. */
  openWeekdays: string[];
  /** Canonical weekday names from API `closedDays`. */
  closedWeekdays: string[];
  /** True when the current car-owner has favorited this shop (overlaid from /api/user/favorite-auto-shops). */
  isFavorite: boolean;
  /** Backend shop category (tyreShop, carWash, towTruck, autoShop, …). */
  shopType: string;
};
