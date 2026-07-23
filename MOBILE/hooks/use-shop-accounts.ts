import {
  createBank,
  createExpense,
  fetchBanks,
  fetchExpenses,
  updateBank,
  updateExpense,
  type BankAccountPayload,
  type ExpensePayload,
} from "@/lib/shop-owner-accounts-api";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import {
  resolveCategoryValue,
  resolveSubcategoryValue,
  type CategoryOption,
} from "@/lib/expense-categories";
import { useCallback, useState } from "react";

export type ShopBankRow = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  openingBalance: number;
  totalBalance: number;
  assignToInvoice: boolean;
};

export type ShopExpenseRow = {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  subCategory: string;
  notes: string;
  gst: boolean;
  gstAmount: number;
  billNumber: string | null;
  account: string | null;
  byCheque: boolean;
  hasReceipt: boolean;
  attachmentUrl: string | null;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function extractList(payload: unknown): unknown[] {
  const root = asRecord(payload);
  if (!root) return Array.isArray(payload) ? payload : [];
  if (Array.isArray(root.data)) return root.data;
  const nested = asRecord(root.data);
  if (nested) {
    for (const key of ["banks", "expenses", "data", "items", "rows", "list"]) {
      if (Array.isArray(nested[key])) return nested[key] as unknown[];
    }
  }
  for (const key of ["banks", "expenses", "data", "items", "rows", "list"]) {
    if (Array.isArray(root[key])) return root[key] as unknown[];
  }
  return [];
}

function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toBank(raw: unknown): ShopBankRow | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = String(o._id ?? o.id ?? "").trim();
  if (!id) return null;
  return {
    id,
    bankName: String(o.BankName ?? o.bankName ?? o.label ?? "Bank").trim() || "Bank",
    accountName: String(o.AccountName ?? o.accountName ?? "").trim() || "—",
    accountNumber: String(o.AccountNumber ?? o.accountNumber ?? "").trim() || "—",
    openingBalance: Number(o.openingBalance ?? 0) || 0,
    totalBalance: Number(o.totalBalance ?? o.openingBalance ?? 0) || 0,
    assignToInvoice: Boolean(o.assignToInvoice),
  };
}

function toExpense(raw: unknown, categories: CategoryOption[]): ShopExpenseRow | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = String(o._id ?? o.id ?? "").trim();
  if (!id) return null;

  const rawCategory = o.category ?? o.Category ?? o.expenseCategory ?? o.expense_category;
  const category = resolveCategoryValue(categories, rawCategory);
  const cat = categories.find((c) => c.value === category);
  const rawSub =
    o.subCategory ??
    o.subcategory ??
    o.SubCategory ??
    o.sub_category ??
    o.expenseSubCategory ??
    o.expense_subcategory;
  const subCategory = resolveSubcategoryValue(cat, rawSub);
  const gstRaw = o.gst;
  const gstNum = typeof gstRaw === "number" ? gstRaw : Number(gstRaw);
  const gstOn = Boolean(gstRaw) && !(typeof gstRaw === "number" && gstRaw === 0);

  const imagePath =
    o.imagePath != null && String(o.imagePath).trim() ? String(o.imagePath).trim() : null;
  const account = String(o.account ?? "").trim() || null;

  return {
    id,
    date: String(o.date ?? "").slice(0, 10) || todayYMD(),
    vendor: String(o.vendor ?? "").trim(),
    amount: Number(o.amount ?? 0) || 0,
    category,
    subCategory,
    notes: String(o.notes ?? "").trim(),
    gst: gstOn,
    gstAmount: Number.isFinite(gstNum) ? gstNum : 0,
    billNumber: o.billNumber != null && String(o.billNumber).trim() ? String(o.billNumber).trim() : null,
    account,
    byCheque: Boolean(account),
    hasReceipt: Boolean(imagePath),
    attachmentUrl: normalizeMediaUrl(imagePath),
  };
}

export function useShopAccounts(
  token: string | null,
  enabled: boolean,
  showToast: (message: string, options?: { type?: "error" | "success" | "info" }) => void
) {
  const [banks, setBanks] = useState<ShopBankRow[]>([]);
  const [expenses, setExpenses] = useState<ShopExpenseRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(
    async (categories?: CategoryOption[]) => {
      if (!token || !enabled) return;
      setLoading(true);
      try {
        const [banksRes, expensesRes] = await Promise.all([fetchBanks(token), fetchExpenses(token)]);
        if (banksRes.ok) {
          setBanks(extractList(banksRes.data).map(toBank).filter(Boolean) as ShopBankRow[]);
        } else {
          setBanks([]);
        }
        if (expensesRes.ok) {
          const cats = categories ?? [];
          setExpenses(
            extractList(expensesRes.data)
              .map((row) => toExpense(row, cats))
              .filter(Boolean) as ShopExpenseRow[]
          );
        } else {
          setExpenses([]);
        }
        if (!banksRes.ok && !expensesRes.ok) {
          showToast("Could not load banks/expenses.", { type: "error" });
        }
      } catch {
        showToast("Network error.", { type: "error" });
      } finally {
        setLoading(false);
      }
    },
    [enabled, showToast, token]
  );

  const saveBank = useCallback(
    async (
      payload: BankAccountPayload & { totalBalance?: number | string },
      editingId?: string | null
    ) => {
      if (!token) return false;
      const res = editingId
        ? await updateBank(token, editingId, payload)
        : await createBank(token, payload);
      if (!res.ok) {
        showToast(editingId ? "Could not update bank." : "Could not add bank.", { type: "error" });
        return false;
      }
      showToast(editingId ? "Bank account updated." : "Bank account added.", { type: "success" });
      return true;
    },
    [showToast, token]
  );

  const saveExpense = useCallback(
    async (payload: ExpensePayload, editingId?: string | null) => {
      if (!token) return false;
      const res = editingId
        ? await updateExpense(token, editingId, payload)
        : await createExpense(token, payload);
      if (!res.ok) {
        showToast(editingId ? "Could not update expense." : "Could not add expense.", {
          type: "error",
        });
        return false;
      }
      showToast(editingId ? "Expense updated." : "Expense added.", { type: "success" });
      return true;
    },
    [showToast, token]
  );

  return { banks, expenses, loading, refresh, saveBank, saveExpense };
}
