import {
  deleteJsonAutoshopowner as deleteJson,
  getJsonAutoshopowner as getJson,
  postFormAutoshopowner as postFormData,
  postJsonAutoshopowner as postJson,
  putFormAutoshopowner as putFormData,
  putJsonAutoshopowner as putJson,
} from "@/lib/autoshopowner-http";
import { appendUploadPart, type UploadPart } from "@/lib/upload-part";

export type ApiEnvelope = { success?: boolean; message?: string; data?: unknown };

export type BankAccountPayload = {
  bankName: string;
  openingBalance: number | string;
  accountName?: string;
  accountNumber?: string;
  assignToInvoice?: boolean;
};

export type ExpensePayload = {
  date: string;
  vendor: string;
  amount: number | string;
  category: string;
  subCategory: string;
  notes?: string;
  gst?: number | string;
  billNumber?: string;
  account?: string;
  expenseImage?: UploadPart | null;
};

function appendText(fd: FormData, key: string, value: unknown) {
  if (value == null) return;
  const s = String(value).trim();
  if (s) fd.append(key, s);
}

export function fetchBanks(token: string) {
  return getJson<ApiEnvelope>("/api/autoshopowner/account/bank", token);
}

export function createBank(token: string, payload: BankAccountPayload) {
  // Backend expects BankName/openingBalance/etc (capitalization) as per controller.
  return postJson<ApiEnvelope>(
    "/api/autoshopowner/account/bank",
    {
      BankName: payload.bankName,
      openingBalance: typeof payload.openingBalance === "string" ? parseFloat(payload.openingBalance) : payload.openingBalance,
      AccountName: payload.accountName,
      AccountNumber: payload.accountNumber,
      assignToInvoice: payload.assignToInvoice ?? false,
    },
    token,
  );
}

export function updateBank(token: string, bankId: string, payload: BankAccountPayload & { totalBalance?: number | string }) {
  return putJson<ApiEnvelope>(
    `/api/autoshopowner/account/bank/${encodeURIComponent(bankId)}`,
    {
      BankName: payload.bankName,
      openingBalance: payload.openingBalance,
      totalBalance: payload.totalBalance,
      AccountName: payload.accountName,
      AccountNumber: payload.accountNumber,
      assignToInvoice: payload.assignToInvoice,
    },
    token,
  );
}

export function fetchExpenses(token: string) {
  return getJson<ApiEnvelope>("/api/autoshopowner/account/expenses", token);
}

export function createExpense(token: string, payload: ExpensePayload) {
  const fd = new FormData();
  appendText(fd, "date", payload.date);
  appendText(fd, "vendor", payload.vendor);
  appendText(fd, "amount", payload.amount);
  appendText(fd, "category", payload.category);
  appendText(fd, "subCategory", payload.subCategory);
  appendText(fd, "notes", payload.notes);
  appendText(fd, "gst", payload.gst);
  appendText(fd, "billNumber", payload.billNumber);
  appendText(fd, "account", payload.account);
  appendUploadPart(fd, "expenseImage", payload.expenseImage);
  return postFormData<ApiEnvelope>("/api/autoshopowner/account/expenses", fd, token);
}

export function updateExpense(token: string, expenseId: string, payload: ExpensePayload) {
  const fd = new FormData();
  appendText(fd, "date", payload.date);
  appendText(fd, "vendor", payload.vendor);
  appendText(fd, "amount", payload.amount);
  appendText(fd, "category", payload.category);
  appendText(fd, "subCategory", payload.subCategory);
  appendText(fd, "notes", payload.notes);
  appendText(fd, "gst", payload.gst);
  appendText(fd, "billNumber", payload.billNumber);
  appendText(fd, "account", payload.account);
  appendUploadPart(fd, "expenseImage", payload.expenseImage);
  return putFormData<ApiEnvelope>(`/api/autoshopowner/account/expenses/${encodeURIComponent(expenseId)}`, fd, token);
}

export function deleteExpense(token: string, expenseId: string) {
  // No DELETE endpoint in the new router; keep the function for parity but route is missing.
  return deleteJson<ApiEnvelope>(`/api/autoshopowner/account/expenses/${encodeURIComponent(expenseId)}`, token);
}

