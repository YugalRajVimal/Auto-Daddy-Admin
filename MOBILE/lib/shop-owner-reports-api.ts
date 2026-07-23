import {
  fetchAutoshopGstReports,
  fetchAutoshopIncomeReport,
  apiMessageFromEnvelope,
} from "@/lib/autoshopowner-job-cards-api";
import { fetchBanks, fetchExpenses } from "@/lib/shop-owner-accounts-api";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import type { BankRow, GstLedgerRow, LedgerRow } from "@/lib/account-report-types";
import { slugifyLabel } from "@/lib/ledger-categories";

export type ShopReportLedgerRow = Omit<LedgerRow, "id"> & { id: string };
export type ShopReportGstRow = ShopReportLedgerRow & { ledgerType: "income" | "expenses" };
export type ShopReportBankRow = Omit<BankRow, "id"> & { id: string };

type JobCardReportService = {
  service?: string;
  category?: string;
  desc?: string;
  unitCost?: number;
  qty?: number;
  amount?: number;
};

type JobCardReportItem = {
  _id?: string;
  jobCardNo?: number | string;
  customerName?: string;
  licensePlateNo?: string;
  date?: string;
  createdAt?: string;
  totalAmount?: number;
  labourCharge?: number;
  bankName?: string;
  status?: string;
  invoicePaid?: boolean;
  services?: JobCardReportService[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function parseJobCardList(payload: unknown): JobCardReportItem[] {
  const root = asRecord(payload);
  if (!root) return [];
  const data = root.data;
  if (Array.isArray(data)) return data as JobCardReportItem[];
  const nested = asRecord(data);
  if (nested && Array.isArray(nested.data)) return nested.data as JobCardReportItem[];
  return [];
}

function isoDateOnly(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function mapJobCardToLedgerRow(item: JobCardReportItem): ShopReportLedgerRow {
  const services = Array.isArray(item.services) ? item.services : [];
  const first = services[0];
  const categoryLabel = String(first?.category ?? "Service Revenue").trim() || "Service Revenue";
  const subcategoryLabel = String(first?.desc ?? "Repairs").trim() || "Repairs";
  const plate = String(item.licensePlateNo ?? "").trim();
  const jobNo = item.jobCardNo != null ? String(item.jobCardNo) : "";
  const serviceNotes = services
    .map((s) => String(s.desc ?? s.category ?? "").trim())
    .filter(Boolean)
    .join(", ");

  return {
    id: String(item._id ?? `jc-${jobNo || Date.now()}`),
    date: isoDateOnly(item.date ?? item.createdAt),
    vendor: String(item.customerName ?? "—").trim() || "—",
    amount: Number(item.totalAmount ?? 0) || 0,
    category: slugifyLabel(categoryLabel) || "service-revenue",
    subcategory: slugifyLabel(subcategoryLabel) || "repairs",
    notes: [plate && `Plate ${plate}`, jobNo && `JC#${jobNo}`, serviceNotes]
      .filter(Boolean)
      .join(" · "),
    gst: true,
    billNumber: jobNo || null,
    byCheque: false,
    hasReceipt: false,
    bank: item.bankName ? String(item.bankName) : undefined,
    paymentMode: item.status ? String(item.status) : undefined,
  };
}

function mapExpenseToLedgerRow(raw: Record<string, unknown>): ShopReportLedgerRow {
  const category = String(raw.category ?? raw.Category ?? "other-expenses").trim() || "other-expenses";
  const subcategory = String(
    raw.subCategory ?? raw.subcategory ?? raw.SubCategory ?? "misc",
  ).trim() || "misc";
  const gstRaw = raw.gst;
  const gst =
    typeof gstRaw === "boolean"
      ? gstRaw
      : typeof gstRaw === "number"
        ? gstRaw > 0
        : Boolean(gstRaw);

  return {
    id: String(raw._id ?? raw.id ?? `exp-${Date.now()}`),
    date: isoDateOnly(raw.date),
    vendor: String(raw.vendor ?? "").trim() || "—",
    amount: Number(raw.amount ?? 0) || 0,
    category: slugifyLabel(category) || category,
    subcategory: slugifyLabel(subcategory) || subcategory,
    notes: String(raw.notes ?? ""),
    gst,
    gstAmount: gstRaw != null && gstRaw !== "" && typeof gstRaw !== "boolean" ? String(gstRaw) : null,
    billNumber: raw.billNumber != null ? String(raw.billNumber) : null,
    byCheque: Boolean(raw.byCheque),
    hasReceipt: Boolean(raw.expenseImage ?? raw.hasReceipt ?? raw.imagePath),
    attachmentUrl: normalizeMediaUrl(
      raw.expenseImage != null
        ? String(raw.expenseImage)
        : raw.imagePath != null
          ? String(raw.imagePath)
          : null,
    ),
  };
}

function mapBankToReportRow(raw: Record<string, unknown>): ShopReportBankRow {
  return {
    id: String(raw._id ?? raw.id ?? ""),
    label: String(raw.BankName ?? raw.bankName ?? "BANK").toUpperCase(),
    assignToInvoice: Boolean(raw.assignToInvoice),
    status: "active",
    totalBalance: Number(raw.totalBalance ?? raw.openingBalance ?? 0) || 0,
    accountName: String(raw.AccountName ?? raw.accountName ?? "") || "",
    accountNumber: String(raw.AccountNumber ?? raw.accountNumber ?? "") || "",
    interac: String(raw.interac ?? raw.Interac ?? "") || "",
  };
}

function failMessage(payload: unknown, fallback: string) {
  return apiMessageFromEnvelope(payload) || fallback;
}

export async function loadShopIncomeReport(
  token: string,
  fromDate: string,
  toDate: string,
): Promise<{ rows: ShopReportLedgerRow[]; totalIncome: number }> {
  const res = await fetchAutoshopIncomeReport(token, {
    startDate: fromDate || undefined,
    endDate: toDate || undefined,
  });
  if (!res.ok) {
    throw new Error(failMessage(res.data, "Failed to load income report"));
  }
  const root = asRecord(res.data);
  const rows = parseJobCardList(res.data).map(mapJobCardToLedgerRow);
  const totalIncome =
    typeof root?.totalIncome === "number" && Number.isFinite(root.totalIncome)
      ? root.totalIncome
      : rows.reduce((sum, row) => sum + row.amount, 0);
  return { rows, totalIncome };
}

export async function loadShopGstReport(
  token: string,
  fromDate: string,
  toDate: string,
): Promise<ShopReportGstRow[]> {
  const [gstRes, expensesRes] = await Promise.all([
    fetchAutoshopGstReports(token, {
      startDate: fromDate || undefined,
      endDate: toDate || undefined,
    }),
    fetchExpenses(token),
  ]);

  if (!gstRes.ok) {
    throw new Error(failMessage(gstRes.data, "Failed to load GST report"));
  }

  const incomeRows: ShopReportGstRow[] = parseJobCardList(gstRes.data).map((item) => ({
    ...mapJobCardToLedgerRow(item),
    ledgerType: "income" as const,
  }));

  let expenseRows: ShopReportGstRow[] = [];
  if (expensesRes.ok) {
    const data = asRecord(expensesRes.data)?.data;
    const list = Array.isArray(data) ? data : [];
    expenseRows = list
      .map((item) => mapExpenseToLedgerRow(asRecord(item) ?? {}))
      .filter((row) => row.gst)
      .filter((row) => {
        if (fromDate && row.date && row.date < fromDate) return false;
        if (toDate && row.date && row.date > toDate) return false;
        return true;
      })
      .map((row) => ({ ...row, ledgerType: "expenses" as const }));
  }

  return [...expenseRows, ...incomeRows].sort(
    (a, b) => a.date.localeCompare(b.date) || a.vendor.localeCompare(b.vendor),
  );
}

export async function loadShopExpenseReport(
  token: string,
  fromDate: string,
  toDate: string,
): Promise<ShopReportLedgerRow[]> {
  const res = await fetchExpenses(token);
  if (!res.ok) {
    throw new Error(failMessage(res.data, "Failed to load expense report"));
  }
  const data = asRecord(res.data)?.data;
  const list = Array.isArray(data) ? data : [];
  return list
    .map((item) => mapExpenseToLedgerRow(asRecord(item) ?? {}))
    .filter((row) => {
      if (fromDate && row.date && row.date < fromDate) return false;
      if (toDate && row.date && row.date > toDate) return false;
      return true;
    });
}

export async function loadShopBankReport(token: string): Promise<ShopReportBankRow[]> {
  const res = await fetchBanks(token);
  if (!res.ok) {
    throw new Error(failMessage(res.data, "Failed to load bank report"));
  }
  const data = asRecord(res.data)?.data;
  const list = Array.isArray(data) ? data : [];
  return list
    .map((item) => mapBankToReportRow(asRecord(item) ?? {}))
    .filter((row) => row.id);
}

/** Narrow GstLedgerRow helpers to accept shop string ids. */
export function asGroupingLedgerRows(rows: ShopReportLedgerRow[]): LedgerRow[] {
  return rows as unknown as LedgerRow[];
}

export function asGroupingGstRows(rows: ShopReportGstRow[]): GstLedgerRow[] {
  return rows as unknown as GstLedgerRow[];
}
