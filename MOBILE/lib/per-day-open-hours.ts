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

/** Parse API `perDayOpenHours` or legacy JSON `openHours` arrays. */
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

/**
 * List APIs return `currentWeekTimings` (Mon–Sun with date, open/close, isClosed).
 * Prefer that over weekly defaults so date overrides are reflected.
 */
function parseCurrentWeekTimings(raw: unknown): PerDayOpenHourEntry[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const entries: PerDayOpenHourEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const day = typeof row.day === "string" ? normalizeWeekdayName(row.day) : null;
    if (!day) continue;
    const isClosed = Boolean(row.isClosed ?? row.closed);
    const open =
      typeof row.open === "string" && row.open.trim() ? row.open.trim() : DEFAULT_START;
    const close =
      typeof row.close === "string" && row.close.trim() ? row.close.trim() : DEFAULT_END;
    entries.push({ day, open, close, isClosed });
  }
  return entries.length > 0 ? entries : null;
}

export function formatLocalDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today's row from `currentWeekTimings` (by date, then weekday). */
export function pickCurrentWeekTimingForToday(
  businessProfile: Record<string, unknown> | null | undefined,
  now = new Date()
): { day: WeekDay; isClosed: boolean; open: string | null; close: string | null } | null {
  if (!businessProfile || typeof businessProfile !== "object") return null;
  const raw = businessProfile.currentWeekTimings ?? businessProfile.currentWeekHours;
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const todayISO = formatLocalDateISO(now);
  const todayDay = WEEK_DAYS[(now.getDay() + 6) % 7]!;

  let match: Record<string, unknown> | null = null;
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.date === "string" && row.date.trim() === todayISO) {
      match = row;
      break;
    }
  }
  if (!match) {
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const day = typeof row.day === "string" ? normalizeWeekdayName(row.day) : null;
      if (day === todayDay) {
        match = row;
        break;
      }
    }
  }
  if (!match) return null;

  const day =
    (typeof match.day === "string" ? normalizeWeekdayName(match.day) : null) ?? todayDay;
  const isClosed = Boolean(match.isClosed ?? match.closed);
  const open =
    typeof match.open === "string" && match.open.trim() ? match.open.trim() : null;
  const close =
    typeof match.close === "string" && match.close.trim() ? match.close.trim() : null;
  return { day, isClosed, open, close };
}

/** True when `now` is within [open, close] on a 24h clock (same-day windows). */
export function isNowWithinOpenClose(open: string, close: string, now = new Date()): boolean {
  const toMinutes = (hhmm: string): number | null => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (!Number.isFinite(h) || !Number.isFinite(min) || h > 23 || min > 59) return null;
    return h * 60 + min;
  };
  const start = toMinutes(open);
  const end = toMinutes(close);
  if (start == null || end == null) return true;
  const current = now.getHours() * 60 + now.getMinutes();
  if (end <= start) {
    // Overnight window (e.g. 22:00–06:00)
    return current >= start || current <= end;
  }
  return current >= start && current <= end;
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

export function formatOpenHoursRangeDisplay(start: string, end: string): string {
  return `${formatOpenHoursTimeDisplay(start)} - ${formatOpenHoursTimeDisplay(end)}`;
}

/** Resolve editable schedule from a business profile, preferring `currentWeekTimings`. */
export function resolvePerDaySchedule(businessProfile: Record<string, unknown> | null | undefined): PerDaySchedule {
  if (!businessProfile || typeof businessProfile !== "object") {
    return createDefaultPerDaySchedule();
  }

  // Car-owner list payload: date-aware week (includes override open/close).
  const currentWeek = parseCurrentWeekTimings(
    businessProfile.currentWeekTimings ?? businessProfile.currentWeekHours
  );
  if (currentWeek?.length) {
    return scheduleFromPerDayEntries(currentWeek);
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

export function validatePerDaySchedule(schedule: PerDaySchedule): string | null {
  const enabledDays = WEEK_DAYS.filter((day) => schedule[day]?.enabled);
  if (enabledDays.length === 0) {
    return "Please enable at least one open day.";
  }
  for (const day of enabledDays) {
    const { start, end } = schedule[day];
    if (end <= start) {
      return `${day}: end time must be after start time.`;
    }
  }
  return null;
}

function shortDayLabel(day: WeekDay) {
  return day.slice(0, 3);
}

/** Human-readable summary for profile display. */
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

export function formatPerDayOpenHoursDisplay(entries: PerDayOpenHourEntry[] | null | undefined): string {
  if (!entries?.length) {
    return "Not provided";
  }
  return formatPerDayScheduleDisplay(scheduleFromPerDayEntries(entries));
}

export function enabledWeekdaysFromSchedule(schedule: PerDaySchedule): WeekDay[] {
  return WEEK_DAYS.filter((day) => schedule[day]?.enabled);
}

export function closedWeekdaysFromSchedule(schedule: PerDaySchedule): WeekDay[] {
  return WEEK_DAYS.filter((day) => !schedule[day]?.enabled);
}
