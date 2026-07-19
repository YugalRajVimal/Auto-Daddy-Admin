// // src/pages/admin/Reports/reportApi.ts
// import type { LedgerRow, BankRow } from "../Accounts/accountData";

// const BASE_ADMIN = import.meta.env.VITE_BASE_ADMIN ?? "/admin";

// type ApiEnvelope<T> = { success: boolean; data: T; message?: string };

// async function apiGet<T>(path: string): Promise<T> {
//   const res = await fetch(`${BASE_ADMIN}${path}`);
//   const json: ApiEnvelope<T> = await res.json();
//   if (!res.ok || !json.success) {
//     throw new Error(json.message || `Request failed: ${path}`);
//   }
//   return json.data;
// }

// function buildQuery(params: Record<string, string | undefined>) {
//   const qs = new URLSearchParams();
//   Object.entries(params).forEach(([k, v]) => {
//     if (v) qs.set(k, v);
//   });
//   const str = qs.toString();
//   return str ? `?${str}` : "";
// }

// /* ---------- Raw API shapes (from your Mongoose schemas) ---------- */

// interface ExpenseApiRow {
//   _id: string;
//   date: string;
//   vendor: string;
//   amount: number;
//   category: string;
//   notes?: string;
//   gst?: number;
//   billNumber?: string;
//   byCheque: boolean;
//   account?: string;
//   imagePath?: string;
// }

// interface IncomeApiRow {
//   _id: string;
//   date: string;
//   vendor: string;
//   amount: number;
//   paymentMode: string;
//   bank?: string;
//   category: string;
//   notes?: string;
//   image?: string;
// }

// interface BankApiRow {
//   _id: string;
//   BankName: string;
//   status: "active" | "inactive";
//   openingBalance: number;
//   totalBalance: number;
//   AccountName?: string;
//   AccountNumber?: string;
//   Interac?: string;
// }

// /* ---------- Mappers: API row -> report row ---------- */

// function parseId(id: string): number {
//   // Try parsing numeric IDs; fallback to NaN if not a valid number.
//   const parsed = Number(id);
//   return isNaN(parsed) ? 0 : parsed;
// }

// function mapExpenseToLedgerRow(row: ExpenseApiRow): LedgerRow {
//   // Return type has to match LedgerRow, including byCheque and hasReceipt fields
//   return {
//     id: parseId(row._id),
//     date: row.date.slice(0, 10), // ISO -> yyyy-mm-dd
//     vendor: row.vendor,
//     amount: row.amount,
//     category: row.category,
//     subcategory: row.byCheque ? (row.account ?? "Cheque") : "Cash",
//     notes: row.notes ?? "",
//     gst: !!row.gst,
//     billNumber: row.billNumber ?? "",
//     byCheque: row.byCheque, // explicitly map
//     hasReceipt: !!row.imagePath, // or other logic depending on presence of receipt file
//   };
// }

// function mapIncomeToLedgerRow(row: IncomeApiRow): LedgerRow {
//   // Return type has to match LedgerRow, including byCheque, hasReceipt, billNumber, gst fields
//   return {
//     id: parseId(row._id),
//     date: row.date.slice(0, 10),
//     vendor: row.vendor,
//     amount: row.amount,
//     category: row.category,
//     subcategory: row.paymentMode,
//     notes: row.notes ?? "",
//     gst: false, // income schema has no gst field currently, set to false as per LedgerRow type
//     billNumber: "", // income row has no bill number
//     byCheque: row.paymentMode.toLowerCase() === "cheque", // best guess, or adjust as needed
//     hasReceipt: !!row.image, // or false if not applicable
//   };
// }

// function mapBankToBankRow(row: BankApiRow): BankRow {
//   // If BankRow requires more fields than present, fill with defaults as needed
//   return {
//     id: parseId(row._id),
//     // name: row.BankName, // Removed: 'name' does not exist in type 'BankRow'
//     status: row.status,
//     // Removed 'openingBalance': 'openingBalance' does not exist in type 'BankRow'
//     totalBalance: row.totalBalance,
//     accountName: row.AccountName ?? "",
//     accountNumber: row.AccountNumber ?? "",
//     label: row.BankName, // Fallback or map as needed (assume label duplicate of name)
//     assignToInvoice: false, // Fallback value, adjust as needed
//     interac: row.Interac ?? "", // Fallback or default, depending on your BankRow type
//   };
// }

// /* ---------- Public fetchers, used by ReportViewer ---------- */

// export async function fetchExpenseReport(fromDate: string, toDate: string): Promise<LedgerRow[]> {
//   const data = await apiGet<ExpenseApiRow[]>(
//     `/accounts/expenses${buildQuery({ from: fromDate, to: toDate })}`
//   );
//   return data.map(mapExpenseToLedgerRow);
// }

// export async function fetchIncomeReport(fromDate: string, toDate: string): Promise<LedgerRow[]> {
//   const data = await apiGet<IncomeApiRow[]>(
//     `/accounts/income${buildQuery({ from: fromDate, to: toDate })}`
//   );
//   return data.map(mapIncomeToLedgerRow);
// }

// export async function fetchBankReport(): Promise<BankRow[]> {
//   // Bank has no date-range filter server-side (no created transaction date param) — fetch all.
//   const data = await apiGet<BankApiRow[]>(`/accounts/banks`);
//   return data.map(mapBankToBankRow);
// }

// /**
//  * GST report has no dedicated backend endpoint — it's derived client-side
//  * from expense.gst / (income currently has no gst field).
//  * We reuse fetchExpenseReport and filter for gst > 0 in the component,
//  * same as buildGstRows() already does.
//  */
// export async function fetchGstSourceRows(fromDate: string, toDate: string) {
//   const [expenses, income] = await Promise.all([
//     fetchExpenseReport(fromDate, toDate),
//     fetchIncomeReport(fromDate, toDate),
//   ]);
//   return { expenses, income };
// }

// src/pages/admin/Reports/reportApi.ts

const BASE_ADMIN = (import.meta.env.VITE_API_URL ?? "/admin") + "/api/admin";

type ApiEnvelope<T> = { success: boolean; data: T; message?: string };

// Utility to get the admin token from localStorage or cookie/etc.
function getAdminToken(): string | null {
  // You might want to enhance this if your token is stored elsewhere
  // (e.g. a secure cookie, session storage, etc). Here we check localStorage:
  return localStorage.getItem("admin-token");
}

async function apiGet<T>(path: string): Promise<T> {
  const adminToken = getAdminToken();
  const headers: HeadersInit = {};
  if (adminToken) {
    headers["Authorization"] = adminToken;
  }
  const res = await fetch(`${BASE_ADMIN}${path}`, { headers });
  let json: ApiEnvelope<T>;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Invalid response from ${path}`);
  }
  if (!res.ok || !json.success) {
    throw new Error(json.message || `Request failed: ${path} (${res.status})`);
  }
  return json.data;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  const str = qs.toString();
  return str ? `?${str}` : "";
}

/* ==================== Raw API shapes (mirrors Mongoose schemas exactly) ==================== */

export interface ExpenseApiRow {
  _id: string;
  date: string; // ISO string from Mongo
  vendor: string;
  amount: number;
  category: string;
  notes?: string;
  gst?: number;
  billNumber?: string;
  byCheque: boolean;
  account?: string;
  imagePath?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IncomeApiRow {
  _id: string;
  date: string;
  vendor: string;
  amount: number;
  paymentMode: string;
  bank?: string;
  category: string;
  notes?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BankApiRow {
  _id: string;
  BankName: string;
  status: "active" | "inactive";
  openingBalance: number;
  totalBalance: number;
  AccountName?: string;
  AccountNumber?: string;
  Interac?: string;
  createdAt?: string;
  updatedAt?: string;
}

/* ==================== Report row shapes (used by the UI) ====================
   These are intentionally generic/flexible so they don't collide with
   whatever accountData.ts already defines. If you want to use your
   existing LedgerRow / BankRow types instead, swap the return types
   below and adjust the field names to match your types exactly.
*/

export interface ReportLedgerRow {
  id: string;
  date: string;         // yyyy-mm-dd
  vendor: string;
  amount: number;
  category: string;
  subcategory: string;  // expenses: "Cash" | account name; income: paymentMode
  notes: string;
  gst: number;
  billNumber?: string;
  source: "expense" | "income";
}

export interface ReportGstRow extends ReportLedgerRow {
  ledgerType: "expenses" | "income";
}

export interface ReportBankRow {
  id: string;
  name: string;
  label: string; // Added to accommodate usage as in the error message
  status: "active" | "inactive";
  openingBalance: number;
  totalBalance: number;
  accountName: string;
  accountNumber: string;
  interac: string;
}

/* ==================== Mappers ==================== */

function mapExpenseToReportRow(row: ExpenseApiRow): ReportLedgerRow {
  return {
    id: row._id,
    date: row.date.slice(0, 10),
    vendor: row.vendor,
    amount: row.amount,
    category: row.category,
    subcategory: row.byCheque ? (row.account ?? "Cheque") : "Cash",
    notes: row.notes ?? "",
    gst: row.gst ?? 0,
    billNumber: row.billNumber ?? "",
    source: "expense",
  };
}

function mapIncomeToReportRow(row: IncomeApiRow): ReportLedgerRow {
  return {
    id: row._id,
    date: row.date.slice(0, 10),
    vendor: row.vendor,
    amount: row.amount,
    category: row.category,
    subcategory: row.paymentMode,
    notes: row.notes ?? "",
    gst: 0, // income schema currently has no gst field
    source: "income",
  };
}

function mapBankToReportRow(row: BankApiRow): ReportBankRow {
  return {
    id: row._id,
    name: row.BankName,
    label: row.BankName, // Provide 'label' property, here just reuse BankName (could adjust as preferred)
    status: row.status,
    openingBalance: row.openingBalance,
    totalBalance: row.totalBalance,
    accountName: row.AccountName ?? "",
    accountNumber: row.AccountNumber ?? "",
    interac: row.Interac ?? "",
  };
}

/* ==================== Public fetchers ==================== */

export async function fetchExpenseReport(fromDate?: string, toDate?: string): Promise<ReportLedgerRow[]> {
  const data = await apiGet<ExpenseApiRow[]>(
    `/accounts/expenses${buildQuery({ from: fromDate, to: toDate })}`
  );
  return data.map(mapExpenseToReportRow);
}

export async function fetchIncomeReport(fromDate?: string, toDate?: string): Promise<ReportLedgerRow[]> {
  const data = await apiGet<IncomeApiRow[]>(
    `/accounts/income${buildQuery({ from: fromDate, to: toDate })}`
  );
  return data.map(mapIncomeToReportRow);
}

export async function fetchBankReport(): Promise<ReportBankRow[]> {
  // NOTE: getBanks has no date-range filter server-side, so fromDate/toDate are ignored here.
  const data = await apiGet<BankApiRow[]>(`/accounts/banks`);
  return data.map(mapBankToReportRow);
}

/**
 * GST rows are derived client-side (no dedicated backend endpoint).
 * Only expense rows currently carry a gst value — income schema has none.
 */
export async function fetchGstReport(fromDate?: string, toDate?: string): Promise<ReportGstRow[]> {
  const [expenses, income] = await Promise.all([
    fetchExpenseReport(fromDate, toDate),
    fetchIncomeReport(fromDate, toDate),
  ]);

  const gstRows: ReportGstRow[] = [
    ...expenses.filter((r) => r.gst > 0).map((r) => ({ ...r, ledgerType: "expenses" as const })),
    ...income.filter((r) => r.gst > 0).map((r) => ({ ...r, ledgerType: "income" as const })),
  ];

  return gstRows.sort((a, b) => a.date.localeCompare(b.date) || a.vendor.localeCompare(b.vendor));
}

/**
 * Single entry point the report page can call based on the active tab.
 */
export async function fetchReportData(
  title: "expenses" | "income" | "bank" | "gst",
  fromDate?: string,
  toDate?: string
): Promise<{ rows: ReportLedgerRow[] | ReportGstRow[]; banks: ReportBankRow[] }> {
  switch (title) {
    case "expenses":
      return { rows: await fetchExpenseReport(fromDate, toDate), banks: [] };
    case "income":
      return { rows: await fetchIncomeReport(fromDate, toDate), banks: [] };
    case "gst":
      return { rows: await fetchGstReport(fromDate, toDate), banks: [] };
    case "bank":
      return { rows: [], banks: await fetchBankReport() };
    default:
      return { rows: [], banks: [] };
  }
}