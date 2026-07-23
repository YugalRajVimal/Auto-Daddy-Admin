import { createBank, createExpense, fetchBanks, fetchExpenses } from "@/lib/shop-owner-accounts-api";
import { useCallback, useState } from "react";

export type ShopBankRow = {
  id: string;
  bankName: string;
  accountName?: string;
  accountNumber?: string;
  openingBalance?: number;
  totalBalance?: number;
  assignToInvoice?: boolean;
};

export type ShopExpenseRow = {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  subCategory: string;
  notes?: string;
  gst?: number | string;
  billNumber?: string;
  account?: string;
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

function toBank(raw: unknown): ShopBankRow | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = String(o._id ?? o.id ?? "").trim();
  if (!id) return null;
  return {
    id,
    bankName: String(o.BankName ?? o.bankName ?? o.label ?? "Bank").trim() || "Bank",
    accountName: String(o.AccountName ?? o.accountName ?? "").trim() || undefined,
    accountNumber: String(o.AccountNumber ?? o.accountNumber ?? "").trim() || undefined,
    openingBalance: Number(o.openingBalance ?? 0) || 0,
    totalBalance: Number(o.totalBalance ?? o.openingBalance ?? 0) || 0,
    assignToInvoice: Boolean(o.assignToInvoice),
  };
}

function toExpense(raw: unknown): ShopExpenseRow | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = String(o._id ?? o.id ?? "").trim();
  if (!id) return null;
  return {
    id,
    date: String(o.date ?? "").slice(0, 10),
    vendor: String(o.vendor ?? "—").trim() || "—",
    amount: Number(o.amount ?? 0) || 0,
    category: String(o.category ?? "").trim() || "other",
    subCategory: String(o.subCategory ?? o.subcategory ?? "").trim() || "misc",
    notes: String(o.notes ?? "").trim() || undefined,
    gst: o.gst as number | string | undefined,
    billNumber: String(o.billNumber ?? "").trim() || undefined,
    account: String(o.account ?? "").trim() || undefined,
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

  const refresh = useCallback(async () => {
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
        setExpenses(extractList(expensesRes.data).map(toExpense).filter(Boolean) as ShopExpenseRow[]);
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
  }, [enabled, showToast, token]);

  const addBank = useCallback(
    async (payload: { bankName: string; openingBalance: number; accountName?: string; accountNumber?: string }) => {
      if (!token) return false;
      const res = await createBank(token, payload);
      if (!res.ok) {
        showToast("Could not create bank.", { type: "error" });
        return false;
      }
      showToast("Bank added.", { type: "success" });
      await refresh();
      return true;
    },
    [refresh, showToast, token]
  );

  const addExpense = useCallback(
    async (payload: {
      date: string;
      vendor: string;
      amount: number;
      category: string;
      subCategory: string;
      notes?: string;
    }) => {
      if (!token) return false;
      const res = await createExpense(token, payload);
      if (!res.ok) {
        showToast("Could not create expense.", { type: "error" });
        return false;
      }
      showToast("Expense added.", { type: "success" });
      await refresh();
      return true;
    },
    [refresh, showToast, token]
  );

  return { banks, expenses, loading, refresh, addBank, addExpense };
}
