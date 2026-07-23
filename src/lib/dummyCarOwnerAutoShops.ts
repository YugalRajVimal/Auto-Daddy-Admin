import type { CarOwnerAutoShopListItem } from "../types/carOwnerAutoShops";

function todayWeekday(): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()]!;
}

function makeShop(
  id: string,
  name: string,
  phone: string,
  city: string,
  shopType: string,
  serviceItems: { id: string; name: string }[]
): CarOwnerAutoShopListItem {
  const today = todayWeekday();
  return {
    id,
    name,
    rating: 5,
    logoUrl: null,
    city,
    timing: "Mon–Sat · 9.00 AM – 6.00 PM",
    openHoursText: "9.00 AM – 6.00 PM",
    openDaysText: "Mon–Sat",
    closedScheduleText: "Sun",
    mainServices: serviceItems.map((s) => s.name),
    mainServiceItems: serviceItems,
    subServices: [],
    carCompanies: ["Toyota", "Honda", "Ford", "Hyundai"],
    carCompanyIds: [],
    address: "Unit 9, Rutherford, Brampton",
    phone,
    email: "",
    website: "autodaddy.ca",
    mapLat: 43.7315,
    mapLng: -79.7624,
    openWeekdays: [today, "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].filter(
      (v, i, a) => a.indexOf(v) === i
    ),
    closedWeekdays: ["Sunday"],
    isFavorite: false,
    shopType,
    shopTypes: [shopType],
    serviceOfferings: serviceItems.map((s) => ({
      id: s.id,
      name: s.name,
      subServices: [],
    })),
  };
}

export function getDummyCarOwnerAutoShops(filters: { shopType?: string | null; serviceIds: readonly string[] }) {
  const serviceId = filters.serviceIds[0] ?? "dummy-service";
  const serviceName = "Service";
  const serviceItems = [{ id: serviceId, name: serviceName }];

  const shops: CarOwnerAutoShopListItem[] = [
    makeShop("dummy-shop-1", "A.B Auto shop", "999 999 9914", "Brampton", String(filters.shopType ?? "autoShop"), serviceItems),
    makeShop("dummy-shop-2", "City Auto Care", "987 654 3221", "Brampton", String(filters.shopType ?? "autoShop"), serviceItems),
    makeShop("dummy-shop-3", "Prime Motors", "905 555 1020", "Brampton", String(filters.shopType ?? "autoShop"), serviceItems),
    makeShop("dummy-shop-4", "Northside Garage", "905 555 3344", "Brampton", String(filters.shopType ?? "autoShop"), serviceItems),
    makeShop("dummy-shop-5", "Green Line Auto", "416 555 7788", "Brampton", String(filters.shopType ?? "autoShop"), serviceItems),
    makeShop("dummy-shop-6", "SpeedFix Auto", "289 555 1212", "Brampton", String(filters.shopType ?? "autoShop"), serviceItems),
    makeShop("dummy-shop-7", "Brampton Service Hub", "647 555 9090", "Brampton", String(filters.shopType ?? "autoShop"), serviceItems),
  ];

  // Keep it simple: if shopType filter exists, match it (supports "autoShops" too).
  const type = (filters.shopType ?? "").toString().trim();
  if (!type) return shops;
  if (type === "autoShops") {
    return shops.map((s) => ({ ...s, shopType: "autoShop", shopTypes: ["autoShop"] }));
  }
  return shops.map((s) => ({ ...s, shopType: type, shopTypes: [type] }));
}

