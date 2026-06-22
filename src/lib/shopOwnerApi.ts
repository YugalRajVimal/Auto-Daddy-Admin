import { getJson, putJson } from "../api/mobileAuth";

export type MyCustomersPeriod = {
  timeFilter: "All" | "Daily" | "Weekly" | "Monthly";
  anchorDate: Date;
};

function withQuery(path: string, query: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v != null && v !== "") usp.append(k, v);
  }
  const s = usp.toString();
  return s ? `${path}?${s}` : path;
}

function formatDateYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate());
  return `${y}-${m}-${day}`;
}

export function mondayOfWeekContaining(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

export function sundayOfWeekContaining(d: Date) {
  const mon = mondayOfWeekContaining(d);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return sun;
}

export function buildMyCustomersQuery(period: MyCustomersPeriod): Record<string, string> {
  const anchor = new Date(period.anchorDate);
  anchor.setHours(0, 0, 0, 0);
  if (period.timeFilter === "All") return {};
  if (period.timeFilter === "Daily") {
    return { dateType: "daily", date: formatDateYMD(anchor) };
  }
  if (period.timeFilter === "Weekly") {
    return { dateType: "weekly", week: formatDateYMD(sundayOfWeekContaining(anchor)) };
  }
  return {
    dateType: "monthly",
    month: String(anchor.getMonth() + 1).padStart(2, "0"),
    year: String(anchor.getFullYear()),
  };
}

export function fetchMyCustomers(token: string, query?: Record<string, string>) {
  const path =
    !query || Object.keys(query).length === 0
      ? "/api/auto-shop-owner/my-customers"
      : withQuery("/api/auto-shop-owner/my-customers", query);
  return getJson<unknown>(path, token);
}

export function searchCarOwners(token: string, search: string) {
  return getJson<unknown>(withQuery("/api/auto-shop-owner/search-carowner", { search }), token);
}

export function fetchJobCards(token: string, query?: Record<string, string>) {
  const path =
    !query || Object.keys(query).length === 0
      ? "/api/auto-shop-owner/job-cards"
      : withQuery("/api/auto-shop-owner/job-cards", query);
  return getJson<unknown>(path, token);
}

export function searchJobCards(token: string, q: string) {
  return getJson<unknown>(withQuery("/api/auto-shop-owner/job-cards/search", { q }), token);
}

export function fetchPaidJobCards(token: string) {
  return getJson<unknown>("/api/auto-shop-owner/job-cards/paid", token);
}

export function fetchUnpaidJobCards(token: string) {
  return getJson<unknown>("/api/auto-shop-owner/job-cards/unpaid", token);
}

export function fetchMyDeals(token: string) {
  return getJson<unknown>("/api/auto-shop-owner/my-deals", token);
}

export function fetchMyServices(token: string) {
  return getJson<unknown>("/api/auto-shop-owner/my-services", token);
}

export function fetchPayments(token: string) {
  return getJson<unknown>("/api/auto-shop-owner/payments", token);
}

export function fetchShopNotifications(token: string, page: number, limit: number) {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  return getJson<unknown>(`/api/auto-shop-owner/get-notifications?${q}`, token);
}

export function updateBusinessActiveStatus(token: string, isBusinessActive: boolean) {
  return putJson("/api/auto-shop-owner/update-business-active-status", { isBusinessActive }, token);
}
