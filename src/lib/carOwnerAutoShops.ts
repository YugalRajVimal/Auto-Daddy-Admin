import { getJson } from "../api/mobileAuth";
import { normalizeMediaUrl } from "./normalizeMediaUrl";
import {
  enabledWeekdaysFromSchedule,
  closedWeekdaysFromSchedule,
  formatPerDayScheduleDisplay,
  resolvePerDaySchedule,
} from "./perDayOpenHours";
import { normalizeShopTypes } from "./shopTypes";
import type { CarOwnerAutoShopListItem } from "../types/carOwnerAutoShops";

function formatPincodeDisplay(input: string): string {
  const normalized = input.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
  if (normalized.length === 0) return "";
  if (normalized.length <= 3) return normalized;
  return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
}

function pickString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

function pickNumber(...vals: unknown[]): number {
  for (const v of vals) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = parseFloat(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return 0;
}

function isShopRecord(x: unknown): x is Record<string, unknown> {
  return x != null && typeof x === "object" && !Array.isArray(x);
}

function extractServices(raw: Record<string, unknown>): {
  mainServices: string[];
  mainServiceItems: { id: string; name: string }[];
  subServices: string[];
  serviceOfferings: {
    id: string;
    name: string;
    subServices: { id?: string; name: string }[];
  }[];
} {
  const serviceRoots =
    (Array.isArray(raw.myServices) && raw.myServices.length > 0 ? raw.myServices : null) ??
    (Array.isArray(raw.businessServices) && raw.businessServices.length > 0 ? raw.businessServices : null);

  const mainServices: string[] = [];
  const mainServiceItems: { id: string; name: string }[] = [];
  const subServices: string[] = [];
  const serviceOfferings: {
    id: string;
    name: string;
    subServices: { id?: string; name: string }[];
  }[] = [];
  const seenItems = new Set<string>();

  if (!serviceRoots) {
    return { mainServices, mainServiceItems, subServices, serviceOfferings };
  }

  for (const s of serviceRoots) {
    if (typeof s === "string") continue;
    if (!isShopRecord(s)) continue;

    const nestedService =
      s.service && isShopRecord(s.service) ? (s.service as Record<string, unknown>) : null;
    const serviceObj = nestedService ?? s;
    const mainId = pickString(
      nestedService?._id,
      nestedService?.id,
      s.serviceId,
      typeof s.service === "string" ? s.service : undefined
    );
    if (!mainId) continue;

    const mainName = pickString(
      serviceObj.name,
      serviceObj.title,
      (s as { serviceName?: unknown }).serviceName
    );

    const catalogSubs = Array.isArray((serviceObj as { services?: unknown }).services)
      ? ((serviceObj as { services: unknown[] }).services ?? [])
      : [];
    const selectedSubIds = new Set<string>();
    const offeringSubs: { id?: string; name: string }[] = [];
    const seenOfferingSub = new Set<string>();
    const selectedSubsRaw = (s.subServices ?? s.selectedSubServices) as unknown;
    if (Array.isArray(selectedSubsRaw)) {
      for (const sub of selectedSubsRaw) {
        if (typeof sub === "string") {
          const t = sub.trim();
          if (t) {
            selectedSubIds.add(t);
            const key = t.toLowerCase();
            if (!seenOfferingSub.has(key)) {
              seenOfferingSub.add(key);
              offeringSubs.push({ name: t });
            }
            subServices.push(t);
          }
          continue;
        }
        if (!isShopRecord(sub)) continue;
        const subId = pickString(sub.subService, sub._id, sub.id);
        if (subId) selectedSubIds.add(subId);
        const subName = pickString(sub.name, sub.title);
        if (subName) {
          subServices.push(subName);
          const key = (subId || subName).toLowerCase();
          if (!seenOfferingSub.has(key)) {
            seenOfferingSub.add(key);
            offeringSubs.push({ id: subId || undefined, name: subName });
          }
        }
      }
    }

    let addedOffered = false;
    if (selectedSubIds.size > 0 && catalogSubs.length > 0) {
      for (const catSub of catalogSubs) {
        if (!isShopRecord(catSub)) continue;
        const subId = pickString(catSub._id, catSub.id);
        if (!subId || !selectedSubIds.has(subId)) continue;
        const subName = pickString(catSub.name, catSub.title);
        if (!subName) continue;
        const key = `${mainId}:${subId}`;
        if (seenItems.has(key)) continue;
        seenItems.add(key);
        mainServiceItems.push({ id: mainId, name: subName });
        mainServices.push(subName);
        addedOffered = true;
      }
    }

    if (!addedOffered && mainName) {
      const key = `main:${mainId}`;
      if (!seenItems.has(key)) {
        seenItems.add(key);
        mainServiceItems.push({ id: mainId, name: mainName });
        mainServices.push(mainName);
      }
    }

    if (mainName) {
      serviceOfferings.push({
        id: mainId,
        name: mainName,
        subServices: offeringSubs,
      });
    }
  }

  return {
    mainServices: [...new Set(mainServices)],
    mainServiceItems,
    subServices: [...new Set(subServices)],
    serviceOfferings,
  };
}

function extractCarCompanies(raw: Record<string, unknown>): string[] {
  const roots = [
    raw.carCompanies,
    raw.myCarCompanies,
    raw.carBrands,
    raw.specialistCarBrands,
    raw.car_companies,
  ];
  const names: string[] = [];

  for (const root of roots) {
    if (!Array.isArray(root)) continue;
    for (const item of root) {
      if (typeof item === "string") {
        const t = item.trim();
        if (t) names.push(t);
        continue;
      }
      if (!isShopRecord(item)) continue;
      const nm = pickString(item.companyName, item.name, item.brandName, item.title);
      if (nm) names.push(nm);
    }
  }

  return [...new Set(names)];
}

/** Recursively JSON-parse strings / flatten arrays until we have leaf strings (handles double-encoded openDays). */
function jsonDeepParseToStrings(value: unknown, maxDepth: number): string[] {
  if (maxDepth <= 0) return [];
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return [];
    try {
      return jsonDeepParseToStrings(JSON.parse(t), maxDepth - 1);
    } catch {
      return [t];
    }
  }
  if (Array.isArray(value)) {
    return value.flatMap((x) => jsonDeepParseToStrings(x, maxDepth - 1));
  }
  return [];
}

/** Map messy day tokens (incl. "Monda", JSON garbage) to canonical English weekday names. */
function toCanonicalWeekday(s: string): string | null {
  const cleaned = s.replace(/^["'[\]]+|["'[\]]+$/g, "").trim();
  if (!cleaned) return null;
  const lower = cleaned.toLowerCase().replace(/[^a-z]/g, "");
  if (lower.length < 3) return null;
  const rules: [RegExp, string][] = [
    [/^mon/, "Monday"],
    [/^tue/, "Tuesday"],
    [/^wed/, "Wednesday"],
    [/^thu/, "Thursday"],
    [/^fri/, "Friday"],
    [/^sat/, "Saturday"],
    [/^sun/, "Sunday"],
  ];
  for (const [re, name] of rules) {
    if (re.test(lower)) return name;
  }
  return null;
}

function normalizeWeekdayList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const days = new Set<string>();
  for (const el of raw) {
    for (const s of jsonDeepParseToStrings(el, 14)) {
      const c = toCanonicalWeekday(s);
      if (c) days.add(c);
    }
  }
  return sortCanonicalWeekdays(Array.from(days));
}

const WEEKDAYS_MON_FIRST = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const WEEKDAY_ABBR: Record<(typeof WEEKDAYS_MON_FIRST)[number], string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

function weekdayIndexMonFirst(day: string): number {
  return WEEKDAYS_MON_FIRST.indexOf(day as any);
}

function sortCanonicalWeekdays(days: string[]): string[] {
  return [...new Set(days)]
    .filter((d) => weekdayIndexMonFirst(d) >= 0)
    .sort((a, b) => weekdayIndexMonFirst(a) - weekdayIndexMonFirst(b));
}

function formatWeekdayRanges(days: string[]): string {
  const sorted = sortCanonicalWeekdays(days);
  if (!sorted.length) return "";
  const indices = sorted.map(weekdayIndexMonFirst);
  const ranges: Array<[number, number]> = [];
  let start = indices[0]!;
  let prev = indices[0]!;
  for (let i = 1; i < indices.length; i++) {
    const cur = indices[i]!;
    if (cur === prev + 1) {
      prev = cur;
      continue;
    }
    ranges.push([start, prev]);
    start = cur;
    prev = cur;
  }
  ranges.push([start, prev]);

  return ranges
    .map(([s, e]) => {
      const sName = WEEKDAYS_MON_FIRST[s]!;
      const eName = WEEKDAYS_MON_FIRST[e]!;
      const sAbbr = WEEKDAY_ABBR[sName];
      const eAbbr = WEEKDAY_ABBR[eName];
      return s === e ? sAbbr : `${sAbbr}–${eAbbr}`;
    })
    .join(", ");
}

function buildScheduleDisplay(
  raw: Record<string, unknown>,
  openDays: string[],
  closedDays: string[]
): { timing: string; openHoursText: string; openDaysText: string; closedScheduleText: string } {
  const openHours = pickString(raw.openHours);
  const openHoursText = openHours;
  const openDaysText = formatWeekdayRanges(openDays);
  const closedDaysText = formatWeekdayRanges(closedDays);
  const closedScheduleText = closedDaysText;

  if (!openDaysText && !openHoursText && !closedScheduleText) {
    const fallback = pickString(raw.timing, raw.hours, openHours) || "Hours not listed";
    return {
      timing: fallback,
      openHoursText: fallback,
      openDaysText: "",
      closedScheduleText: "",
    };
  }

  const timingParts: string[] = [];
  const openBits = [openDaysText, openHoursText].filter((x) => String(x).trim());
  const openScheduleText = openBits.join(" · ");
  if (openScheduleText) timingParts.push(`Open: ${openScheduleText}`);
  if (closedScheduleText) timingParts.push(`Closed: ${closedScheduleText}`);
  const timing =
    timingParts.join(" · ") || pickString(raw.timing, raw.hours, openHours) || "Hours not listed";

  return { timing, openHoursText, openDaysText, closedScheduleText };
}

const CALENDAR_WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/** Today’s weekday as "Monday", …, "Sunday" (device local calendar). */
export function canonicalWeekdayToday(): string {
  return CALENDAR_WEEKDAYS[new Date().getDay()];
}

/**
 * Uses API open/closed weekday lists. If only `closedWeekdays` is set, any day not listed stays eligible.
 * If `openWeekdays` is non-empty, today must be included. Unknown schedule (both empty) is treated as open.
 */
export function isCarOwnerShopOpenToday(shop: CarOwnerAutoShopListItem): boolean {
  const today = canonicalWeekdayToday();
  if (shop.closedWeekdays.includes(today)) return false;
  if (shop.openWeekdays.length > 0) return shop.openWeekdays.includes(today);
  return true;
}

/** Last closing time from hours text for open/closed pills (e.g. "6.00 PM"). */
export function formatEndTimeForOpenPill(openHoursText: string): string | null {
  const text = openHoursText.trim();
  if (!text) return null;

  const timeTokens = Array.from(text.matchAll(/(\d{1,2})(?:[.:](\d{2}))?\s*(AM|PM)?/gi));
  if (timeTokens.length === 0) return null;

  const last = timeTokens[timeTokens.length - 1]!;
  const hourRaw = Number(last[1]);
  const minuteRaw = last[2] ? Number(last[2]) : 0;
  const ampm = last[3]?.toUpperCase();

  if (!Number.isFinite(hourRaw) || !Number.isFinite(minuteRaw)) return null;

  const hour = hourRaw;
  const minute = minuteRaw >= 0 && minuteRaw < 60 ? minuteRaw : 0;

  let hour12: number;
  let ampmFinal: "AM" | "PM";

  if (ampm === "AM" || ampm === "PM") {
    ampmFinal = ampm;
    hour12 = hour % 12;
    if (hour12 === 0) hour12 = 12;
  } else {
    if (hour === 0) {
      hour12 = 12;
      ampmFinal = "AM";
    } else if (hour === 12) {
      hour12 = 12;
      ampmFinal = "PM";
    } else if (hour > 12) {
      hour12 = hour - 12;
      ampmFinal = "PM";
    } else {
      hour12 = hour;
      ampmFinal = "AM";
    }
  }

  const mm = String(minute).padStart(2, "0");
  return `${hour12}.${mm} ${ampmFinal}`;
}

function parseWgs84MapLocation(raw: Record<string, unknown>): { lat: number; lng: number } | null {
  const loc = raw.businessMapLocation;
  if (!isShopRecord(loc)) return null;
  const lat = pickNumber(loc.lat, loc.latitude);
  const lng = pickNumber(loc.lng, loc.long, loc.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

/** Pull an array of shop-like objects from common API envelope shapes. */
export function extractAutoShopsArray(payload: unknown): Record<string, unknown>[] {
  if (payload == null) return [];
  if (Array.isArray(payload)) {
    return payload.filter(isShopRecord);
  }
  if (!isShopRecord(payload)) return [];

  const keys = ["data", "autoShops", "shops", "results", "items", "list"] as const;
  for (const k of keys) {
    const v = payload[k];
    if (Array.isArray(v)) {
      return v.filter(isShopRecord);
    }
    if (isShopRecord(v)) {
      const nested = extractAutoShopsArray(v);
      if (nested.length) return nested;
    }
  }
  return [];
}

export function normalizeCarOwnerAutoShop(raw: Record<string, unknown>): CarOwnerAutoShopListItem | null {
  const id = pickString(raw._id, raw.id, raw.autoShopId);
  const name = pickString(raw.businessName, raw.name, raw.shopName, raw.title);
  if (!id || !name) return null;

  const daySchedule = resolvePerDaySchedule(raw);
  const openWeekdays = enabledWeekdaysFromSchedule(daySchedule);
  const closedWeekdays = closedWeekdaysFromSchedule(daySchedule);
  const perDayHoursText = formatPerDayScheduleDisplay(daySchedule);
  const schedule =
    perDayHoursText !== "Not provided"
      ? {
          timing: perDayHoursText,
          openHoursText: perDayHoursText,
          openDaysText: formatWeekdayRanges(openWeekdays),
          closedScheduleText: formatWeekdayRanges(closedWeekdays),
        }
      : buildScheduleDisplay(raw, normalizeWeekdayList(raw.openDays), normalizeWeekdayList(raw.closedDays));

  const pincode = pickString(raw.pincode, raw.postalCode, raw.zip);
  const pincodeForDisplay = formatPincodeDisplay(pincode) || pincode;
  const line1 = pickString(raw.businessAddress, raw.address, raw.fullAddress);
  const city = pickString(raw.city, (raw as any).cityName);
  let address =
    line1 && pincode && !line1.includes(pincode)
      ? `${line1}, ${pincodeForDisplay}`
      : pickString(line1, pincodeForDisplay) || "Address not available";
  if (city && !address.toLowerCase().includes(city.toLowerCase())) {
    address = `${address}, ${city}`;
  }

  const contact = raw.contactDetails;
  const phone = isShopRecord(contact)
    ? pickString(contact.phone, contact.mobile, contact.landline, raw.businessPhone, raw.phone, raw.mobile, raw.contactPhone)
    : pickString(raw.businessPhone, raw.phone, raw.mobile, raw.contactPhone);

  const websiteFromContact =
    isShopRecord(contact) && typeof contact["website"] === "string" ? contact["website"] : undefined;
  const website = pickString(raw.website, raw.businessWebsite, raw.webUrl, raw.url, websiteFromContact);

  const rating = Math.min(5, Math.max(0, pickNumber(raw.rating, raw.avgRating, raw.averageRating)));

  const logoRaw =
    raw.businessProfileImage ?? raw.businessLogo ?? raw.logo ?? raw.logoUrl ?? raw.image ?? raw.profilePhoto;
  const logoUrl = typeof logoRaw === "string" ? normalizeMediaUrl(logoRaw) : null;

  const services = extractServices(raw);
  const carCompanies = extractCarCompanies(raw);
  const coords = parseWgs84MapLocation(raw);
  // API may send `shopType` as a string ("autoShop") or array (["autoShop","carWash",…]).
  const shopTypes = normalizeShopTypes(
    (raw.shopTypes ?? raw.shopType ?? raw.shop_type ?? raw.type) as
      | string
      | string[]
      | null
      | undefined,
  );
  const shopType = shopTypes[0] ?? "autoShop";

  const favouriteRaw = raw.isFavourite ?? raw.isFavorite ?? raw.favourite ?? raw.favorite;

  return {
    id,
    name,
    rating,
    logoUrl,
    city,
    timing: schedule.timing,
    openHoursText: schedule.openHoursText,
    openDaysText: schedule.openDaysText,
    closedScheduleText: schedule.closedScheduleText,
    mainServices: services.mainServices,
    mainServiceItems: services.mainServiceItems,
    subServices: services.subServices,
    serviceOfferings: services.serviceOfferings,
    carCompanies,
    address,
    phone,
    website,
    mapLat: coords?.lat ?? null,
    mapLng: coords?.lng ?? null,
    openWeekdays,
    closedWeekdays,
    isFavorite: favouriteRaw === true || favouriteRaw === "true" || favouriteRaw === 1,
    shopType,
    shopTypes,
  };
}

export function normalizeCarOwnerAutoShopsPayload(data: unknown): CarOwnerAutoShopListItem[] {
  const rows = extractAutoShopsArray(data);
  const out: CarOwnerAutoShopListItem[] = [];
  for (const row of rows) {
    const item = normalizeCarOwnerAutoShop(row);
    if (item) out.push(item);
  }
  return out;
}

/**
 * Resolves one shop row from GET /api/user/auto-shops (no dedicated detail route in-app).
 */
export async function fetchCarOwnerAutoShopById(
  shopId: string,
  options: { authToken: string }
): Promise<{ ok: true; shop: CarOwnerAutoShopListItem } | { ok: false; error: string }> {
  const id = shopId.trim();
  if (!id) return { ok: false, error: "Missing shop id." };

  const res = await getJson<unknown>("/api/user/auto-shops", options.authToken);
  if (!res.ok) return { ok: false, error: "Could not load shop details." };

  const payload = res.data;
  if (payload && typeof payload === "object" && "success" in payload) {
    const success = (payload as { success?: boolean }).success;
    if (success === false) return { ok: false, error: "Could not load shop details." };
  }

  const shops = normalizeCarOwnerAutoShopsPayload(payload);
  const shop = shops.find((s) => s.id === id);
  if (!shop) return { ok: false, error: "Shop not found." };
  return { ok: true, shop };
}

/**
 * Extracts a Set of favorite shop ids from /api/user/favorite-auto-shops.
 * Tolerant of shapes: array of ids, array of shop objects, or envelope `{ data | favorites | favoriteAutoShops: [...] }`.
 */
export function extractFavoriteAutoShopIds(payload: unknown): Set<string> {
  const ids = new Set<string>();

  const collectFromList = (list: unknown): void => {
    if (!Array.isArray(list)) return;
    for (const entry of list) {
      if (typeof entry === "string") {
        const t = entry.trim();
        if (t) ids.add(t);
        continue;
      }
      if (isShopRecord(entry)) {
        const id = pickString(entry._id, entry.id, entry.autoShopId, entry.shopId);
        if (id) ids.add(id);
      }
    }
  };

  if (Array.isArray(payload)) {
    collectFromList(payload);
    return ids;
  }
  if (!isShopRecord(payload)) return ids;

  const keys = ["data", "favorites", "favoriteAutoShops", "favouriteAutoShops", "autoShops", "shops", "results", "items", "list"];
  for (const k of keys) {
    const v = payload[k];
    if (Array.isArray(v)) {
      collectFromList(v);
    } else if (isShopRecord(v)) {
      // recurse one level (envelope -> data -> favorites)
      const merged = extractFavoriteAutoShopIds(v);
      merged.forEach((id) => ids.add(id));
    }
  }
  return ids;
}
