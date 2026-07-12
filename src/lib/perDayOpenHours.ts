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
  /** True when this date has a one-off special override. */
  isSpecial?: boolean;
  reason?: string;
};

export type SpecialOpenHourOverride = {
  dateISO: string;
  enabled: boolean;
  start: string;
  end: string;
  reason?: string;
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

export function addDaysISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return formatLocalDateISO(date);
}

export function sortOpenHoursHistoryDesc(
  rows: ShopOpenHoursHistoryRow[]
): ShopOpenHoursHistoryRow[] {
  return [...rows].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
}

/**
 * Table order: next 7 days (today+7 … today+1), then today, then past history.
 */
export function sortOpenHoursTableRows(
  rows: ShopOpenHoursHistoryRow[],
  todayISO = formatLocalDateISO(new Date())
): ShopOpenHoursHistoryRow[] {
  const upcoming: ShopOpenHoursHistoryRow[] = [];
  const todayRows: ShopOpenHoursHistoryRow[] = [];
  const history: ShopOpenHoursHistoryRow[] = [];

  for (const row of rows) {
    if (row.dateISO > todayISO) upcoming.push(row);
    else if (row.dateISO === todayISO) todayRows.push(row);
    else history.push(row);
  }

  upcoming.sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  history.sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  return [...upcoming, ...todayRows, ...history];
}

function pickArray(...candidates: unknown[]): unknown[] | null {
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return null;
}

function unwrapOpenHoursPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const root = payload as Record<string, unknown>;
  const data = root.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return root;
}

/** Normalize API date values (`YYYY-MM-DD` or ISO datetime) to local calendar `YYYY-MM-DD`. */
export function normalizeOpenHoursDateISO(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  if (!text) return null;
  // Prefer the calendar date from the string when present (avoids UTC shift on midnight Z).
  const ymd = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (ymd) return ymd[1];
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatLocalDateISO(parsed);
}

/** Parse special date overrides from GET open-hours response. */
export function parseSpecialOpenHours(payload: unknown): SpecialOpenHourOverride[] {
  const root = unwrapOpenHoursPayload(payload);
  const arr =
    pickArray(
      root.specialDayOverrides,
      root.specialOpenHours,
      root.specialHours,
      root.specials,
      root.overrides,
      root.specialOpenHour,
      Array.isArray(root.data) ? root.data : null
    ) ?? [];

  const out: SpecialOpenHourOverride[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const dateISO = normalizeOpenHoursDateISO(obj.date ?? obj.dateISO ?? obj.specialDate);
    if (!dateISO) continue;
    const isClosed = Boolean(obj.isClosed ?? obj.closed);
    const open =
      typeof obj.open === "string"
        ? obj.open
        : typeof obj.start === "string"
          ? obj.start
          : DEFAULT_START;
    const close =
      typeof obj.close === "string"
        ? obj.close
        : typeof obj.end === "string"
          ? obj.end
          : DEFAULT_END;
    const reason = typeof obj.reason === "string" ? obj.reason : undefined;
    out.push({
      dateISO,
      enabled: !isClosed,
      start: open || DEFAULT_START,
      end: close || DEFAULT_END,
      reason,
    });
  }
  return out;
}

/** True when the open-hours payload includes an explicit weekly schedule array. */
export function hasWeeklyScheduleInPayload(payload: unknown): boolean {
  const root = unwrapOpenHoursPayload(payload);
  const arr =
    root.weeklySchedule ??
    root.perDayOpenHours ??
    root.weeklyOpenHours ??
    root.weekly ??
    root.schedule;
  return Array.isArray(arr) && arr.length > 0;
}

/** Parse weekly schedule from GET open-hours (or business profile) payload. */
export function parseWeeklyOpenHoursFromPayload(payload: unknown): PerDaySchedule {
  const root = unwrapOpenHoursPayload(payload);
  const fromPerDay = parsePerDayOpenHoursArray(
    root.weeklySchedule ??
      root.perDayOpenHours ??
      root.weeklyOpenHours ??
      root.weekly ??
      root.schedule
  );
  if (fromPerDay?.length) return scheduleFromPerDayEntries(fromPerDay);
  return resolvePerDaySchedule(root);
}

/** Parse optional effectiveSchedule array from a date-range GET response. */
export function parseEffectiveOpenHoursSchedule(
  payload: unknown
): ShopOpenHoursHistoryRow[] | null {
  const root = unwrapOpenHoursPayload(payload);
  const arr = root.effectiveSchedule;
  if (!Array.isArray(arr) || arr.length === 0) return null;

  const rows: ShopOpenHoursHistoryRow[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const dateISO = normalizeOpenHoursDateISO(obj.date ?? obj.dateISO);
    if (!dateISO) continue;
    const day =
      typeof obj.day === "string"
        ? normalizeWeekdayName(obj.day) ?? weekDayFromDateISO(dateISO)
        : weekDayFromDateISO(dateISO);
    const isClosed = Boolean(obj.isClosed ?? obj.closed);
    const open =
      typeof obj.open === "string"
        ? obj.open
        : typeof obj.start === "string"
          ? obj.start
          : DEFAULT_START;
    const close =
      typeof obj.close === "string"
        ? obj.close
        : typeof obj.end === "string"
          ? obj.end
          : DEFAULT_END;
    rows.push({
      dateISO,
      day,
      enabled: !isClosed,
      start: open || DEFAULT_START,
      end: close || DEFAULT_END,
      isSpecial: Boolean(obj.isSpecial ?? obj.isOverride),
      reason: typeof obj.reason === "string" ? obj.reason : undefined,
    });
  }
  return rows.length > 0 ? rows : null;
}

export function effectiveHoursForDate(
  dateISO: string,
  schedule: PerDaySchedule,
  specialsByDate: Map<string, SpecialOpenHourOverride>
): ShopOpenHoursHistoryRow {
  const day = weekDayFromDateISO(dateISO);
  const special = specialsByDate.get(dateISO);
  if (special) {
    return {
      dateISO,
      day,
      enabled: special.enabled,
      start: special.start,
      end: special.end,
      isSpecial: true,
      reason: special.reason,
    };
  }
  const entry = schedule[day];
  return {
    dateISO,
    day,
    enabled: entry.enabled,
    start: entry.start,
    end: entry.end,
    isSpecial: false,
  };
}

/**
 * Build table rows: next 7 days (today+7 … today+1) above today,
 * then history below today from past special overrides only.
 * Weekly default changes must not rewrite older dates — history never
 * synthesizes past days from the current weekly schedule.
 */
export function buildOpenHoursTableRows(
  schedule: PerDaySchedule,
  specials: SpecialOpenHourOverride[],
  now = new Date()
): ShopOpenHoursHistoryRow[] {
  const todayISO = formatLocalDateISO(now);
  const specialsByDate = new Map(specials.map((s) => [s.dateISO, s]));
  const upcoming: ShopOpenHoursHistoryRow[] = [];
  const seen = new Set<string>();

  // Next 7 days above today (weekly defaults + specials)
  for (let offset = 7; offset >= 1; offset--) {
    const dateISO = addDaysISO(todayISO, offset);
    upcoming.push(effectiveHoursForDate(dateISO, schedule, specialsByDate));
    seen.add(dateISO);
  }

  const todayRow = effectiveHoursForDate(todayISO, schedule, specialsByDate);
  seen.add(todayISO);

  // History: past special overrides only (weekly updates never rewrite these)
  const history = specials
    .filter((s) => s.dateISO < todayISO && !seen.has(s.dateISO))
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
    .map((s) => effectiveHoursForDate(s.dateISO, schedule, specialsByDate));

  return [...upcoming, todayRow, ...history];
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
