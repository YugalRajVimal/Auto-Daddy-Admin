import { getJson } from "@/lib/api";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import {
  enabledWeekdaysFromSchedule,
  closedWeekdaysFromSchedule,
  formatPerDayScheduleDisplay,
  resolvePerDaySchedule,
} from "@/lib/per-day-open-hours";
import { formatPincodeDisplay } from "@/lib/validation";
import type { CarOwnerAutoShopListItem } from "@/types/car-owner-auto-shops";

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

function normalizeStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const el of raw) {
    if (typeof el === "string") {
      const t = el.trim();
      if (t) out.push(t);
      continue;
    }
    if (isShopRecord(el)) {
      const name = pickString(el.name, (el.service as any)?.name, (el.serviceName as any));
      if (name) out.push(name);
    }
  }
  return [...new Set(out)];
}

function extractServices(raw: Record<string, unknown>): {
  mainServices: string[];
  mainServiceItems: { id: string; name: string }[];
  subServices: string[];
} {
  const serviceRoots =
    (Array.isArray(raw.myServices) ? raw.myServices : null) ??
    (Array.isArray(raw.services) ? raw.services : null) ??
    (Array.isArray(raw.service) ? raw.service : null) ??
    (Array.isArray(raw.businessServices) ? raw.businessServices : null) ??
    null;

  const mainServices: string[] = [];
  const mainServiceItems: { id: string; name: string }[] = [];
  const subServices: string[] = [];

  if (!serviceRoots) {
    return { mainServices, mainServiceItems, subServices };
  }

  for (const s of serviceRoots) {
    if (typeof s === "string") {
      const t = s.trim();
      if (t) mainServices.push(t);
      continue;
    }
    if (!isShopRecord(s)) continue;

    const nestedService =
      s.service && isShopRecord(s.service) ? (s.service as Record<string, unknown>) : null;
    const serviceObj = nestedService ?? s;
    const mainId = pickString(
      s._id,
      s.id,
      s.serviceId,
      typeof s.service === "string" ? s.service : undefined,
      nestedService?._id,
      nestedService?.id
    );
    const mainName = pickString(serviceObj.name, serviceObj.title, (s as { serviceName?: unknown }).serviceName);
    if (mainName) mainServices.push(mainName);
    if (mainId && mainName) mainServiceItems.push({ id: mainId, name: mainName });

    const nested = (serviceObj.subServices ?? s.subServices ?? s.selectedSubServices) as unknown;
    if (Array.isArray(nested)) {
      for (const sub of nested) {
        if (typeof sub === "string") {
          const t = sub.trim();
          if (t) subServices.push(t);
          continue;
        }
        if (!isShopRecord(sub)) continue;
        const nm = pickString(sub.name, sub.title);
        if (nm) subServices.push(nm);
      }
    }
  }

  const dedupedItems: { id: string; name: string }[] = [];
  const seenIds = new Set<string>();
  for (const item of mainServiceItems) {
    if (seenIds.has(item.id)) continue;
    seenIds.add(item.id);
    dedupedItems.push(item);
  }

  return {
    mainServices: [...new Set(mainServices)],
    mainServiceItems: dedupedItems,
    subServices: [...new Set(subServices)],
  };
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
  const coords = parseWgs84MapLocation(raw);
  const shopType = pickString(raw.shopType, raw.shop_type, raw.type);

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
    address,
    phone,
    website,
    mapLat: coords?.lat ?? null,
    mapLng: coords?.lng ?? null,
    openWeekdays,
    closedWeekdays,
    isFavorite: false,
    shopType,
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

  const res = await getJson<unknown>("/api/user/auto-shops", { authToken: options.authToken });
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
