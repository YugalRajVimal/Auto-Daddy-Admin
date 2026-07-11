export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];

export type PerDayOpenHourEntry = {
  day: string;
  open: string;
  close: string;
  isClosed?: boolean;
};

export type DayScheduleEntry = {
  enabled: boolean;
  start: string;
  end: string;
};

export type PerDaySchedule = Record<WeekDay, DayScheduleEntry>;

const DEFAULT_START = "09:00";
const DEFAULT_END = "18:00";

export function createDefaultPerDaySchedule(): PerDaySchedule {
  return WEEK_DAYS.reduce((acc, day) => {
    acc[day] = { enabled: false, start: DEFAULT_START, end: DEFAULT_END };
    return acc;
  }, {} as PerDaySchedule);
}

/** When true, ignore API and use a fixed demo schedule. */
export const USE_DUMMY_SHOP_OPEN_HOURS = false;

export function createDummyPerDaySchedule(): PerDaySchedule {
  const schedule = createDefaultPerDaySchedule();
  for (const day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as WeekDay[]) {
    schedule[day] = { enabled: true, start: "09:00", end: "20:00" };
  }
  schedule.Saturday = { enabled: true, start: "09:00", end: "18:00" };
  return schedule;
}

export function resolveShopOpenHoursSchedule(perDayOpenHours?: string | null): PerDaySchedule {
  if (USE_DUMMY_SHOP_OPEN_HOURS) {
    return createDummyPerDaySchedule();
  }
  return resolvePerDaySchedule(perDayOpenHours ? { perDayOpenHours } : null);
}

function splitLegacyOpenHours(openHours: string | null | undefined) {
  const fallback = { start: "08:00", end: "20:00" };
  if (!openHours || !openHours.includes("-")) {
    return fallback;
  }
  const [start, end] = openHours.split("-");
  if (!start || !end) {
    return fallback;
  }
  return { start: start.trim(), end: end.trim() };
}

function normalizeWeekdayName(day: string): WeekDay | null {
  const text = day.trim().toLowerCase();
  const match = WEEK_DAYS.find((d) => d.toLowerCase() === text || d.toLowerCase().startsWith(text.slice(0, 3)));
  return match ?? null;
}

export function parsePerDayOpenHoursArray(raw: unknown): PerDayOpenHourEntry[] | null {
  if (Array.isArray(raw)) {
    return raw
      .filter((item) => item && typeof item === "object" && typeof (item as PerDayOpenHourEntry).day === "string")
      .map((item) => {
        const entry = item as PerDayOpenHourEntry;
        return {
          day: entry.day,
          open: entry.open || DEFAULT_START,
          close: entry.close || DEFAULT_END,
          isClosed: Boolean(entry.isClosed),
        };
      });
  }
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text.startsWith("[")) {
      return null;
    }
    try {
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) {
        return parsePerDayOpenHoursArray(parsed);
      }
    } catch {
      return null;
    }
  }
  return null;
}

function scheduleFromPerDayEntries(entries: PerDayOpenHourEntry[]): PerDaySchedule {
  const schedule = createDefaultPerDaySchedule();
  for (const entry of entries) {
    const day = normalizeWeekdayName(entry.day);
    if (!day) continue;
    schedule[day] = {
      enabled: !entry.isClosed,
      start: entry.open || DEFAULT_START,
      end: entry.close || DEFAULT_END,
    };
  }
  return schedule;
}

function scheduleFromLegacyFields(
  openHours: string | null | undefined,
  openDays: string[] | null | undefined
): PerDaySchedule {
  const schedule = createDefaultPerDaySchedule();
  const window = splitLegacyOpenHours(openHours);
  const openSet = new Set((openDays ?? []).map((d) => normalizeWeekdayName(d)).filter(Boolean) as WeekDay[]);
  for (const day of WEEK_DAYS) {
    schedule[day] = {
      enabled: openSet.has(day),
      start: window.start,
      end: window.end,
    };
  }
  return schedule;
}

export function resolvePerDaySchedule(businessProfile: Record<string, unknown> | null | undefined): PerDaySchedule {
  if (!businessProfile || typeof businessProfile !== "object") {
    return createDefaultPerDaySchedule();
  }

  const perDay = parsePerDayOpenHoursArray(businessProfile.perDayOpenHours);
  if (perDay?.length) {
    return scheduleFromPerDayEntries(perDay);
  }

  const openHoursArray = parsePerDayOpenHoursArray(businessProfile.openHours);
  if (openHoursArray?.length) {
    return scheduleFromPerDayEntries(
      openHoursArray.map((entry) => ({
        ...entry,
        isClosed: entry.isClosed ?? false,
      }))
    );
  }

  const openDays = Array.isArray(businessProfile.openDays)
    ? businessProfile.openDays.filter((d): d is string => typeof d === "string")
    : [];
  if (typeof businessProfile.openHours === "string" && openDays.length > 0) {
    return scheduleFromLegacyFields(businessProfile.openHours, openDays);
  }

  return createDefaultPerDaySchedule();
}

export function shortDayLabel(day: WeekDay) {
  return day.slice(0, 3);
}

export function formatOpenHoursTimeDisplay(time24: string): string {
  const [hStr, mStr = "0"] = time24.split(":");
  const hour = Number(hStr);
  const minute = Number(mStr);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return time24;

  const mm = String(minute).padStart(2, "0");
  let hour12: number;
  let ampm: "Am" | "Pm";

  if (hour === 0) {
    hour12 = 12;
    ampm = "Am";
  } else if (hour === 12) {
    hour12 = 12;
    ampm = "Pm";
  } else if (hour > 12) {
    hour12 = hour - 12;
    ampm = "Pm";
  } else {
    hour12 = hour;
    ampm = "Am";
  }

  return `${hour12}.${mm} ${ampm}`;
}

/** Table column time (e.g. `9.00`). */
export function formatOpenHoursTimeTable(time24: string): string {
  const [hStr, mStr = "0"] = time24.split(":");
  const hour = Number(hStr);
  const minute = Number(mStr);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return time24;

  const mm = String(minute).padStart(2, "0");
  let hour12 = hour % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}.${mm}`;
}

export function formatLocalDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Next calendar date for a weekday, formatted `YYYY-MM-DD`. */
export function nextWeekdayDateISO(day: WeekDay): string {
  const targetIndex = WEEK_DAYS.indexOf(day);
  const today = new Date();
  const todayIndex = (today.getDay() + 6) % 7;
  let diff = targetIndex - todayIndex;
  if (diff < 0) diff += 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return formatLocalDateISO(next);
}

export type ShopOpenHoursHistoryRow = {
  dateISO: string;
  day: WeekDay;
  enabled: boolean;
  start: string;
  end: string;
};

export type CurrentWeekOpenHoursRow = {
  day: WeekDay;
  dateISO: string;
  entry: DayScheduleEntry;
};

export function weekDayFromDateISO(dateISO: string): WeekDay {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
  return WEEK_DAYS[(date.getDay() + 6) % 7];
}

export function sortOpenHoursHistoryDesc(
  rows: ShopOpenHoursHistoryRow[]
): ShopOpenHoursHistoryRow[] {
  return [...rows].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
}

/**
 * Current week (Mon–Sun) open/closed rows with calendar dates,
 * sorted descending so the week's last date (Sunday) is first.
 */
export function currentWeekOpenHoursRows(
  schedule: PerDaySchedule,
  now = new Date()
): CurrentWeekOpenHoursRow[] {
  const todayIndex = (now.getDay() + 6) % 7; // Mon=0 … Sun=6
  const monday = new Date(now);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(now.getDate() - todayIndex);

  const rows = WEEK_DAYS.map((day, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return {
      day,
      dateISO: formatLocalDateISO(date),
      entry: schedule[day],
    };
  });

  return rows.reverse();
}

/** Demo open/closed history for the current week (newest date first). */
export function createDummyShopOpenHoursHistory(
  now = new Date()
): ShopOpenHoursHistoryRow[] {
  const schedule = createDummyPerDaySchedule();
  return currentWeekOpenHoursRows(schedule, now).map(({ day, dateISO, entry }) => ({
    dateISO,
    day,
    enabled: entry.enabled,
    start: entry.start,
    end: entry.end,
  }));
}

export function formatOpenHoursRangeDisplay(start: string, end: string): string {
  return `${formatOpenHoursTimeDisplay(start)} - ${formatOpenHoursTimeDisplay(end)}`;
}

export function formatPerDayScheduleDisplay(schedule: PerDaySchedule): string {
  const enabled = WEEK_DAYS.filter((day) => schedule[day]?.enabled);
  if (enabled.length === 0) {
    return "Not provided";
  }

  type Group = { days: WeekDay[]; start: string; end: string };
  const groups: Group[] = [];

  for (const day of enabled) {
    const { start, end } = schedule[day];
    const last = groups[groups.length - 1];
    if (last && last.start === start && last.end === end) {
      const prevDay = last.days[last.days.length - 1];
      const prevIdx = WEEK_DAYS.indexOf(prevDay);
      const curIdx = WEEK_DAYS.indexOf(day);
      if (curIdx === prevIdx + 1) {
        last.days.push(day);
        continue;
      }
    }
    groups.push({ days: [day], start, end });
  }

  return groups
    .map(({ days, start, end }) => {
      const dayLabel =
        days.length === 1
          ? shortDayLabel(days[0])
          : `${shortDayLabel(days[0])}–${shortDayLabel(days[days.length - 1])}`;
      return `${dayLabel} ${start}–${end}`;
    })
    .join("; ");
}

export function enabledWeekdaysFromSchedule(schedule: PerDaySchedule): WeekDay[] {
  return WEEK_DAYS.filter((day) => schedule[day]?.enabled);
}

export function closedWeekdaysFromSchedule(schedule: PerDaySchedule): WeekDay[] {
  return WEEK_DAYS.filter((day) => !schedule[day]?.enabled);
}

export function perDayOpenHoursFromSchedule(schedule: PerDaySchedule): PerDayOpenHourEntry[] {
  return WEEK_DAYS.map((day) => ({
    day,
    open: schedule[day].start,
    close: schedule[day].end,
    isClosed: !schedule[day].enabled,
  }));
}

export function serializePerDayOpenHoursForApi(schedule: PerDaySchedule): string {
  return JSON.stringify(perDayOpenHoursFromSchedule(schedule));
}
