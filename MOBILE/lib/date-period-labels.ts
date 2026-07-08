import { mondayOfWeekContaining, sundayOfWeekContaining } from "@/lib/auto-shop-owner-api";

export type DatePeriodTimeFilter = "All" | "Daily" | "Weekly" | "Monthly";

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDailyLabel(anchor: Date) {
  const day = anchor.getDate();
  const mon = MONTHS_SHORT[anchor.getMonth()];
  const y = anchor.getFullYear();
  return `${day} ${mon} ${y}`;
}

/** Mon–Sun range for the week that contains `anchor`. */
function formatWeeklyLabel(anchor: Date) {
  const mon = mondayOfWeekContaining(anchor);
  const sun = sundayOfWeekContaining(anchor);
  const d1 = mon.getDate();
  const m1 = MONTHS_SHORT[mon.getMonth()];
  const y1 = mon.getFullYear();
  const d2 = sun.getDate();
  const m2 = MONTHS_SHORT[sun.getMonth()];
  const y2 = sun.getFullYear();
  if (y1 === y2) {
    return `${d1} ${m1} - ${d2} ${m2} ${y2}`;
  }
  return `${d1} ${m1} ${y1} - ${d2} ${m2} ${y2}`;
}

function formatMonthlyLabel(anchor: Date) {
  return `${MONTHS_SHORT[anchor.getMonth()]} ${anchor.getFullYear()}`;
}

export function formatDatePeriodBarLabel(timeFilter: DatePeriodTimeFilter, anchor: Date) {
  if (timeFilter === "All") {
    return "All time";
  }
  if (timeFilter === "Daily") {
    return formatDailyLabel(anchor);
  }
  if (timeFilter === "Weekly") {
    return formatWeeklyLabel(anchor);
  }
  return formatMonthlyLabel(anchor);
}
