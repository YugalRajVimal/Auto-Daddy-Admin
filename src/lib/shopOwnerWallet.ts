import { formatCurrencyAmount } from "./currency";
import { parseJobCardsFromPagePayload, type JobCardListRow } from "./shopOwnerJobCards";

export type WalletLedgerTab = "cash" | "invoice";

/** GST/HST applies to Online (invoice) payments only — not cash. */
export function isOnlineInvoicePayment(paymentMethod: unknown): boolean {
  const method = typeof paymentMethod === "string" ? paymentMethod.trim().toLowerCase() : "";
  return method === "online" || method === "invoice";
}

function s(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim()) {
    return v.trim();
  }
  return undefined;
}

function nestedRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** `paymentMethod` / `payment_method` on the job card or nested `payment` object. */
function pickPaymentMethodString(o: Record<string, unknown>): string | undefined {
  const direct = s(o.paymentMethod) ?? s(o.payment_method);
  if (direct) {
    return direct;
  }
  const pay = nestedRecord(o.payment);
  if (pay) {
    return s(pay.paymentMethod) ?? s(pay.payment_method) ?? s(pay.method);
  }
  return undefined;
}

/**
 * Wallet **Cash** vs **Invoice** tabs from API `paymentMethod`:
 * - `cash` → Cash
 * - `online` → Invoice
 * Missing / other values → Cash (default).
 */
export function getWalletLedgerTab(raw: unknown): WalletLedgerTab {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return "cash";
  }
  const o = raw as Record<string, unknown>;
  const pm = pickPaymentMethodString(o);
  if (!pm) {
    return "cash";
  }
  const n = pm.trim().toLowerCase();
  if (n === "cash") {
    return "cash";
  }
  if (n === "online") {
    return "invoice";
  }
  return "cash";
}

/** `data` or `data.data` object holding wallet bucket arrays from the API. */
function walletBucketRoot(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }
  const r = data as Record<string, unknown>;
  const inner = r.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  return r;
}

function splitRowsByPaymentMethod(rows: JobCardListRow[]): {
  cash: JobCardListRow[];
  online: JobCardListRow[];
} {
  const cash: JobCardListRow[] = [];
  const online: JobCardListRow[] = [];
  for (const row of rows) {
    if (getWalletLedgerTab(row.raw) === "invoice") {
      online.push(row);
    } else {
      cash.push(row);
    }
  }
  return { cash, online };
}

/**
 * Paid job-cards response: `cashPayments` + `onlinePayments` (or snake_case).
 * Falls back to a flat list split by `paymentMethod` when buckets are absent.
 */
export function parsePaidWalletPayload(data: unknown): { cash: JobCardListRow[]; online: JobCardListRow[] } {
  const root = walletBucketRoot(data);
  if (root) {
    const c = root.cashPayments ?? root.cash_payments;
    const o = root.onlinePayments ?? root.online_payments;
    if (c != null || o != null) {
      return {
        cash: parseJobCardsFromPagePayload(c ?? []),
        online: parseJobCardsFromPagePayload(o ?? []),
      };
    }
  }
  return splitRowsByPaymentMethod(parseJobCardsFromPagePayload(data));
}

/**
 * Unpaid job-cards response: `cashUnpaid` + `onlineUnpaid` (or snake_case).
 * Falls back to a flat list split by `paymentMethod` when buckets are absent.
 */
export function parseUnpaidWalletPayload(data: unknown): { cash: JobCardListRow[]; online: JobCardListRow[] } {
  const root = walletBucketRoot(data);
  if (root) {
    const c = root.cashUnpaid ?? root.cash_unpaid;
    const o = root.onlineUnpaid ?? root.online_unpaid;
    if (c != null || o != null) {
      return {
        cash: parseJobCardsFromPagePayload(c ?? []),
        online: parseJobCardsFromPagePayload(o ?? []),
      };
    }
  }
  return splitRowsByPaymentMethod(parseJobCardsFromPagePayload(data));
}

export function shortJobBadgeCode(jobNo: string | undefined): string {
  const j = (jobNo ?? "").replace(/\s/g, "");
  if (!j) {
    return "—";
  }
  const tailDigits = j.match(/(\d{1,})$/);
  if (tailDigits && tailDigits[1].length >= 4) {
    return tailDigits[1].slice(-4);
  }
  return j.length > 5 ? j.slice(-4) : j;
}

export function formatWalletAmount(
  total: number | string | undefined,
  isPaid: boolean,
  countryCode?: string | null
): string {
  let n = 0;
  if (typeof total === "number" && Number.isFinite(total)) {
    n = total;
  } else if (total != null && String(total).trim()) {
    const p = parseFloat(String(total).replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(p)) {
      n = p;
    }
  }
  const sign = isPaid ? "+" : "-";
  return `${sign}${formatCurrencyAmount(Math.abs(n), countryCode, { fallback: "0.00" })}`;
}

export function pickInvoiceUrl(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  const o = raw as Record<string, unknown>;
  const u = s(o.invoiceUrl) ?? s(o.invoicePDF) ?? s(o.invoiceLink) ?? s(o.invoice_url) ?? s(o.invoice_pdf);
  if (u && /^https?:\/\//i.test(u)) {
    return u;
  }
  return undefined;
}

/** Normalize `7:17` or `12:20:00` to `HH:mm` for wallet list. */
function normalizeWalletTimeString(t: string): string {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (!m) {
    return t.trim();
  }
  const h = parseInt(m[1], 10);
  const min = m[2];
  if (!Number.isFinite(h)) {
    return t.trim();
  }
  return `${String(h).padStart(2, "0")}:${min}`;
}

/** Time HH:mm and calendar label DD/MM/YYYY for wallet cards. */
export function pickWalletWhen(row: JobCardListRow, raw: unknown): { time: string; dateLabel: string } {
  const pad = (x: number) => String(x).padStart(2, "0");

  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const apiDate = s(o.date);
    const apiTime = s(o.time);
    if (apiDate && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(apiDate)) {
      return {
        time: apiTime ? normalizeWalletTimeString(apiTime) : "—",
        dateLabel: apiDate,
      };
    }
  }

  let iso: string | undefined;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    iso =
      s(o.createdAt) ??
      s(o.updatedAt) ??
      s(o.completedAt) ??
      s(o.paidAt) ??
      s(o.serviceDate) ??
      s(o.jobDate);
  }
  const fallbackDate = row.date;

  const parseIso = (v: string | undefined): Date | null => {
    if (!v) {
      return null;
    }
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const d = parseIso(iso);
  if (d) {
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const dateLabel = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    return { time, dateLabel };
  }

  if (fallbackDate && /^\d{4}-\d{2}-\d{2}$/.test(fallbackDate)) {
    const [y, mo, da] = fallbackDate.split("-").map((x) => parseInt(x, 10));
    if (Number.isFinite(y) && Number.isFinite(mo) && Number.isFinite(da)) {
      return { time: "—", dateLabel: `${pad(da)}/${pad(mo)}/${y}` };
    }
  }

  if (fallbackDate && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fallbackDate)) {
    let timeOut = "—";
    if (raw && typeof raw === "object") {
      const apiTime = s((raw as Record<string, unknown>).time);
      if (apiTime) {
        timeOut = normalizeWalletTimeString(apiTime);
      }
    }
    return { time: timeOut, dateLabel: fallbackDate };
  }

  return { time: "—", dateLabel: row.date ?? "—" };
}
