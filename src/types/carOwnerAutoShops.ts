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
  address: string;
  phone: string;
  website: string;
  mapLat: number | null;
  mapLng: number | null;
  openWeekdays: string[];
  closedWeekdays: string[];
  isFavorite: boolean;
  shopType: string;
};
