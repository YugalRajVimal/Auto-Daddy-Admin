import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  ADMIN_PANEL_THEAD_ROW_CLASS,
  adminPanelRowClass,
  adminPanelTableClasses,
  type AdminPanelTableClasses,
} from "../../components/admin/adminPanelTableStyles";
import {
  CompactField,
  CompactFormPanel,
  CompactFormRow,
} from "../../components/admin/ContentPanel";
import { ShopReveal } from "../../components/shop/ShopAnimated";
import { shopAddNewButtonClass } from "../../components/shop/forms/ShopFormPage";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  shopCompactInputClass,
  shopProfileFormPanelClass,
  shopProfileFormPanelFooterClass,
} from "../../components/shop/shopLayoutStyles";
import { ShopSidebarButton } from "../../components/shop/ShopSidebar";
import { shopSidebarButtonStackClass } from "../../components/shop/shopSidebarStyles";
import { ShopListSkeleton } from "../../components/shop/ShopListSkeletons";
import { ShopErrorPanel, ShopListFooter } from "../../components/shop/ShopPanels";
import { useShopOwnerData } from "../../context/ShopOwnerDataProvider";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopWallet } from "../../hooks/useShopWallet";
import { formatCurrencyAmount } from "../../lib/currency";
import {
  DUMMY_SHOP_BANKS,
  DUMMY_SHOP_EXPENSES,
  USE_DUMMY_SHOP_WALLET,
  type ShopWalletBankRow,
  type ShopWalletExpenseRow,
} from "../../lib/dummyShopWallet";
import { useMockShopInvoiceLedger } from "../../lib/mockShopInvoiceLedger";
import { formatPhoneWithCountryCode } from "../../lib/phoneFormat";
import { collectJobCardPayment, resendJobCardNotification } from "../../lib/shopOwnerMutations";
import { pickJobCardInvoiceNumber, type JobCardListRow } from "../../lib/shopOwnerJobCards";
import {
  filterWalletInvoiceRows,
  getWalletLedgerTab,
  pickInvoiceUrl,
  shortJobBadgeCode,
} from "../../lib/shopOwnerWallet";
import useAuth from "../../auth/useAuth";

const PAGE_SIZE = 10;
const WALLET_SEARCH_INPUT_ID = "shop-wallet-search";

type WalletView = "paid" | "unpaid" | "expenses" | "banks";

const SECTION_HEADINGS: Record<WalletView, string> = {
  paid: "Paid Invoice",
  unpaid: "Un-Paid Invoice",
  expenses: "Expenses",
  banks: "Manage Banks",
};

const EMPTY_MESSAGES: Record<WalletView, string> = {
  paid: "No paid invoices in this category.",
  unpaid: "No unpaid invoices in this category.",
  expenses: "No expenses match your search.",
  banks: "No bank accounts match your search.",
};

const EXPENSE_CATEGORIES = Array.from(
  new Set(DUMMY_SHOP_EXPENSES.map((row) => row.category)),
).sort();

function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const SHOP_TABLE_BASE = adminPanelTableClasses(true);
const SHOP_TABLE: AdminPanelTableClasses = {
  ...SHOP_TABLE_BASE,
  th: SHOP_TABLE_BASE.th.replace("px-2", "px-4"),
  thCheckbox: SHOP_TABLE_BASE.thCheckbox.replace("px-2", "px-4"),
  td: SHOP_TABLE_BASE.td.replace("px-2", "px-4"),
  tdCheckbox: SHOP_TABLE_BASE.tdCheckbox.replace("px-2", "px-4"),
};

const SHOP_TABLE_HEAD_TH_CLASS = `${SHOP_TABLE.th} h-9 py-0 align-middle`;
const SHOP_TABLE_HEAD_TH_CHECKBOX_CLASS = `${SHOP_TABLE.thCheckbox} h-9 py-0 align-middle`;
const SHOP_TABLE_BODY_TD_CLASS = `${SHOP_TABLE.td} h-9 py-0 align-middle whitespace-nowrap`;
const SHOP_TABLE_BODY_TD_CHECKBOX_CLASS = `${SHOP_TABLE.tdCheckbox} h-9 py-0 align-middle`;
const SHOP_TABLE_CHECKBOX_CLASS = "h-3.5 w-3.5 accent-ad-purple";

const WALLET_BULK_BUTTON_CLASS =
  "rounded border border-ad-purple bg-white px-3 py-1 text-xs font-bold text-ad-purple hover:bg-[#f5cce8] disabled:cursor-not-allowed disabled:opacity-60";

function formatWalletPrice(
  total: number | string | undefined,
  countryCode: string | null | undefined,
): string {
  return formatCurrencyAmount(total, countryCode, { fallback: "—", includeSign: false });
}

function displayBillId(row: JobCardListRow, isPaid: boolean): string {
  const code = shortJobBadgeCode(row.jobNo);
  if (code === "—") return "—";
  const ledger = getWalletLedgerTab(row.raw);
  if (isPaid || ledger === "invoice") {
    return `B ${code}`;
  }
  return `J ${code}`;
}

function matchesSearch(row: JobCardListRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    row.customerName,
    row.phone,
    row.vehiclePlate,
    row.jobNo,
    pickJobCardInvoiceNumber(row),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function matchesExpenseSearch(row: ShopWalletExpenseRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [row.name, row.category, row.date].join(" ").toLowerCase().includes(q);
}

function walletRowsMatchingSelection(
  selectedIds: Set<string>,
  rows: JobCardListRow[],
): JobCardListRow[] {
  return rows.filter((row) => selectedIds.has(row.id));
}

function pickPaymentAmount(row: JobCardListRow): number {
  const isInvoice = getWalletLedgerTab(row.raw) === "invoice";
  const raw = row.raw;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const payable = o.payableAmounts;
    if (payable && typeof payable === "object") {
      const p = payable as Record<string, unknown>;
      if (isInvoice) {
        const online = Number(p.online ?? p.invoiceTotal);
        if (Number.isFinite(online) && online > 0) return online;
      } else {
        const cash = Number(p.cash);
        if (Number.isFinite(cash) && cash > 0) return cash;
      }
    }
    const total = Number(o.totalPayableAmount ?? o.total ?? row.total);
    if (Number.isFinite(total) && total > 0) return total;
  }
  const fromRow = Number(row.total);
  return Number.isFinite(fromRow) && fromRow > 0 ? fromRow : 0;
}

function paymentMethodForRow(row: JobCardListRow): "Cash" | "Online" {
  return getWalletLedgerTab(row.raw) === "invoice" ? "Online" : "Cash";
}

function WalletListFooter({
  totalEntries,
  page,
  totalPages,
  onPageChange,
}: {
  totalEntries: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <ShopListFooter className="text-sm font-semibold text-gray-600">
      <p>{totalEntries} Entries</p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
            const isActive = pageNumber === page;
            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={`flex h-8 min-w-8 items-center justify-center rounded-sm px-2 text-sm font-bold ${isActive
                    ? "bg-gray-500 text-white"
                    : "border border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                aria-current={isActive ? "page" : undefined}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>
      ) : null}
    </ShopListFooter>
  );
}

function AddNewButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={shopAddNewButtonClass}>
      + Add New
    </button>
  );
}

function WalletExpenseForm({
  date,
  name,
  category,
  amount,
  onDateChange,
  onNameChange,
  onCategoryChange,
  onAmountChange,
  onSave,
  onCancel,
}: {
  date: string;
  name: string;
  category: string;
  amount: string;
  onDateChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <CompactFormPanel
      className={shopProfileFormPanelClass}
      showBottomBorder={false}
      focusOnMount
      footer={
        <div
          className={`flex flex-wrap items-center justify-between gap-2 px-4 py-1 ${shopProfileFormPanelFooterClass}`}
        >
          <div className="flex min-w-[180px] flex-1 items-center text-xs font-serif italic text-gray-800">
            You are adding a new expense
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              className="inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded bg-ad-form-save px-5 py-1 text-sm font-bold text-white hover:brightness-95"
            >
              Save
            </button>
            <span className="text-xs text-gray-700">
              or{" "}
              <button
                type="button"
                onClick={onCancel}
                className="font-medium text-blue-600 underline hover:text-blue-700"
              >
                Cancel
              </button>
            </span>
          </div>
        </div>
      }
    >
      <CompactFormRow className="flex-nowrap items-end gap-x-3 overflow-x-auto">
        <CompactField label="Date" required className="w-[9.5rem] shrink-0">
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className={shopCompactInputClass}
          />
        </CompactField>
        <CompactField label="Name" required className="min-w-[12rem] flex-1">
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Vendor or payee"
            className={shopCompactInputClass}
          />
        </CompactField>
        <CompactField label="Category" required className="w-[10.5rem] shrink-0">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={shopCompactInputClass}
          >
            <option value="">Select category</option>
            {EXPENSE_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </CompactField>
        <CompactField label="Amount" required className="w-[8.5rem] shrink-0">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.00"
            className={shopCompactInputClass}
          />
        </CompactField>
      </CompactFormRow>
    </CompactFormPanel>
  );
}

function WalletBankForm({
  mode,
  label,
  accountName,
  accountNumber,
  balance,
  assignToInvoice,
  onLabelChange,
  onAccountNameChange,
  onAccountNumberChange,
  onBalanceChange,
  onAssignToInvoiceChange,
  onSave,
  onCancel,
}: {
  mode: "add" | "edit";
  label: string;
  accountName: string;
  accountNumber: string;
  balance: string;
  assignToInvoice: boolean;
  onLabelChange: (value: string) => void;
  onAccountNameChange: (value: string) => void;
  onAccountNumberChange: (value: string) => void;
  onBalanceChange: (value: string) => void;
  onAssignToInvoiceChange: (value: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const isEdit = mode === "edit";

  return (
    <CompactFormPanel
      className={shopProfileFormPanelClass}
      showBottomBorder={false}
      focusOnMount
      footer={
        <div
          className={`flex flex-wrap items-center justify-between gap-2 px-4 py-1 ${shopProfileFormPanelFooterClass}`}
        >
          <div className="flex min-w-[180px] flex-1 items-center text-xs font-serif italic text-gray-800">
            {isEdit ? "You are editing a bank account" : "You are adding a new bank account"}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              className="inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded bg-ad-form-save px-5 py-1 text-sm font-bold text-white hover:brightness-95"
            >
              {isEdit ? "Update" : "Save"}
            </button>
            <span className="text-xs text-gray-700">
              or{" "}
              <button
                type="button"
                onClick={onCancel}
                className="font-medium text-blue-600 underline hover:text-blue-700"
              >
                Cancel
              </button>
            </span>
          </div>
        </div>
      }
    >
      <CompactFormRow className="flex-nowrap items-end gap-x-3 overflow-x-auto">
        <CompactField label="Bank / Wallet Label" required className="min-w-[11rem] flex-1">
          <input
            type="text"
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            placeholder="e.g. Business Chequing"
            className={shopCompactInputClass}
          />
        </CompactField>
        <CompactField label="Account Name" className="min-w-[11rem] flex-1">
          <input
            type="text"
            value={accountName}
            onChange={(e) => onAccountNameChange(e.target.value)}
            placeholder="Account holder name"
            className={shopCompactInputClass}
          />
        </CompactField>
        <CompactField label="Account Number" className="w-[10.5rem] shrink-0">
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => onAccountNumberChange(e.target.value)}
            placeholder="****1234"
            className={shopCompactInputClass}
          />
        </CompactField>
        <CompactField label="Balance" required className="w-[8.5rem] shrink-0">
          <input
            type="text"
            inputMode="decimal"
            value={balance}
            onChange={(e) => onBalanceChange(e.target.value)}
            placeholder="0.00"
            className={shopCompactInputClass}
          />
        </CompactField>
        <CompactField label="Invoice" className="w-[9.5rem] shrink-0">
          <label className="flex h-[30px] cursor-pointer items-center gap-2 text-sm font-semibold text-gray-800">
            <input
              type="checkbox"
              checked={assignToInvoice}
              onChange={(e) => onAssignToInvoiceChange(e.target.checked)}
              className="h-3.5 w-3.5 accent-ad-purple"
            />
            Assign to invoice
          </label>
        </CompactField>
      </CompactFormRow>
    </CompactFormPanel>
  );
}

function WalletSearchBar({
  value,
  onChange,
  leading,
  trailing,
}: {
  value: string;
  onChange: (value: string) => void;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-between gap-2 py-1.5 sm:gap-3">
      <div className="flex flex-wrap items-center gap-2">{leading}</div>
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <input
          id={WALLET_SEARCH_INPUT_ID}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search"
          aria-label="Search"
          className="h-[26px] min-w-[9rem] border border-gray-400 bg-white px-2 text-sm text-gray-800 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
        />
        {trailing}
      </div>
    </div>
  );
}

function WalletInvoiceTable({
  rows,
  isPaid,
  countryCode,
  selectedIds,
  onToggleRow,
  onTogglePage,
}: {
  rows: JobCardListRow[];
  isPaid: boolean;
  countryCode: string | null | undefined;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onTogglePage: (ids: string[], checked: boolean) => void;
}) {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const idHeader = isPaid ? "Bill No." : "Job No.";
  const pageRowIds = rows.map((row) => row.id);
  const allPageSelected = rows.length > 0 && pageRowIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageRowIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className="shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className={SHOP_TABLE.table}>
          <thead>
            <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
              <th className={SHOP_TABLE_HEAD_TH_CHECKBOX_CLASS}>
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={(e) => onTogglePage(pageRowIds, e.target.checked)}
                  aria-label="Select all invoices on this page"
                  className={SHOP_TABLE_CHECKBOX_CLASS}
                />
              </th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>{idHeader}</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Customer</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Phone</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Plate</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Total</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const customerName = row.customerName?.trim() || "—";
              return (
                <tr key={row.id} className={adminPanelRowClass(index)}>
                  <td className={SHOP_TABLE_BODY_TD_CHECKBOX_CLASS}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => onToggleRow(row.id)}
                      aria-label={`Select ${displayBillId(row, isPaid)}`}
                      className={SHOP_TABLE_CHECKBOX_CLASS}
                    />
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>
                    {displayBillId(row, isPaid)}
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>
                    {customerName}
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                    {formatPhoneWithCountryCode(
                      row.phone,
                      row.phoneCountryCode ?? countryCode,
                    )}
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                    {row.vehiclePlate?.trim() || "—"}
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                    {formatWalletPrice(row.total, countryCode)}
                  </td>
                  <td className={SHOP_TABLE_BODY_TD_CLASS}>{row.date ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function WalletExpenseTable({
  rows,
  countryCode,
  selectedIds,
  onToggleRow,
  onTogglePage,
}: {
  rows: ShopWalletExpenseRow[];
  countryCode: string | null | undefined;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onTogglePage: (ids: string[], checked: boolean) => void;
}) {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const pageRowIds = rows.map((row) => row.id);
  const allPageSelected = rows.length > 0 && pageRowIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageRowIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className="shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className={SHOP_TABLE.table}>
          <thead>
            <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
              <th className={SHOP_TABLE_HEAD_TH_CHECKBOX_CLASS}>
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={(e) => onTogglePage(pageRowIds, e.target.checked)}
                  aria-label="Select all expenses on this page"
                  className={SHOP_TABLE_CHECKBOX_CLASS}
                />
              </th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Date</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Name</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Category</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className={adminPanelRowClass(index)}>
                <td className={SHOP_TABLE_BODY_TD_CHECKBOX_CLASS}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={() => onToggleRow(row.id)}
                    aria-label={`Select expense ${row.name}`}
                    className={SHOP_TABLE_CHECKBOX_CLASS}
                  />
                </td>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>
                  {row.date}
                </td>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                  {row.name}
                </td>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                  {row.category}
                </td>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                  {formatWalletPrice(row.amount, countryCode)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function WalletBankTable({
  rows,
  countryCode,
  selectedIds,
  onToggleRow,
  onTogglePage,
}: {
  rows: ShopWalletBankRow[];
  countryCode: string | null | undefined;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onTogglePage: (ids: string[], checked: boolean) => void;
}) {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const pageRowIds = rows.map((row) => row.id);
  const allPageSelected = rows.length > 0 && pageRowIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageRowIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className="shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className={SHOP_TABLE.table}>
          <thead>
            <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
              <th className={SHOP_TABLE_HEAD_TH_CHECKBOX_CLASS}>
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={(e) => onTogglePage(pageRowIds, e.target.checked)}
                  aria-label="Select all bank accounts on this page"
                  className={SHOP_TABLE_CHECKBOX_CLASS}
                />
              </th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Label</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Account Name</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Account Number</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Balance</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className={adminPanelRowClass(index)}>
                <td className={SHOP_TABLE_BODY_TD_CHECKBOX_CLASS}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={() => onToggleRow(row.id)}
                    aria-label={`Select bank account ${row.label}`}
                    className={SHOP_TABLE_CHECKBOX_CLASS}
                  />
                </td>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>
                  {row.label}
                </td>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                  {row.accountName}
                </td>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>
                  {row.accountNumber}
                </td>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                  {formatWalletPrice(row.balance, countryCode)}
                </td>
                <td className={SHOP_TABLE_BODY_TD_CLASS}>
                  {row.assignToInvoice ? (
                    <span className="font-semibold text-ad-purple">Assigned to invoice</span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default function ShopWalletPage() {
  const { session, token } = useAuth();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [view, setView] = useState<WalletView>("paid");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(() => new Set());
  const [expenses, setExpenses] = useState<ShopWalletExpenseRow[]>(() => [...DUMMY_SHOP_EXPENSES]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseDate, setExpenseDate] = useState(todayYMD);
  const [expenseName, setExpenseName] = useState("");
  const [expenseCategory, setExpenseCategory] = useState(EXPENSE_CATEGORIES[0] ?? "");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [banks, setBanks] = useState<ShopWalletBankRow[]>(() => [...DUMMY_SHOP_BANKS]);
  const [showBankForm, setShowBankForm] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankLabel, setBankLabel] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankBalance, setBankBalance] = useState("");
  const [bankAssignToInvoice, setBankAssignToInvoice] = useState(false);
  const { refreshSection } = useShopOwnerData();
  const {
    paid: apiPaidAll,
    unpaid: apiUnpaidAll,
    paidOnline: apiPaidOnline,
    unpaidOnline: apiUnpaidOnline,
    loading,
    error,
  } = useShopWallet();
  const mockLedger = useMockShopInvoiceLedger();

  const syncLedgerData = useCallback(async () => {
    await Promise.all([refreshSection("wallet"), refreshSection("jobCards")]);
  }, [refreshSection]);

  const paid = USE_DUMMY_SHOP_WALLET
    ? mockLedger.paid
    : apiPaidOnline.length > 0
      ? apiPaidOnline
      : filterWalletInvoiceRows(apiPaidAll, { paid: true });
  const unpaid = USE_DUMMY_SHOP_WALLET
    ? mockLedger.unpaid
    : apiUnpaidOnline.length > 0
      ? apiUnpaidOnline
      : filterWalletInvoiceRows(apiUnpaidAll, { paid: false });
  const showLoading = !USE_DUMMY_SHOP_WALLET && loading;
  const showError = !USE_DUMMY_SHOP_WALLET && error;

  const invoiceList = view === "paid" ? paid : view === "unpaid" ? unpaid : [];
  const filteredList = useMemo(
    () => invoiceList.filter((row) => matchesSearch(row, search)),
    [invoiceList, search],
  );
  const filteredExpenses = useMemo(
    () => expenses.filter((row) => matchesExpenseSearch(row, search)),
    [expenses, search],
  );
  const filteredBanks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter((row) =>
      [row.label, row.accountName, row.accountNumber].join(" ").toLowerCase().includes(q),
    );
  }, [banks, search]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const expenseTotalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const bankTotalPages = Math.max(1, Math.ceil(filteredBanks.length / PAGE_SIZE));
  const activeTotalPages =
    view === "expenses" ? expenseTotalPages : view === "banks" ? bankTotalPages : totalPages;
  const activeEntryCount =
    view === "expenses"
      ? filteredExpenses.length
      : view === "banks"
        ? filteredBanks.length
        : filteredList.length;

  const safePage = Math.min(page, activeTotalPages);
  const paginatedList = useMemo(
    () => filteredList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredList, safePage],
  );
  const paginatedExpenses = useMemo(
    () => filteredExpenses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredExpenses, safePage],
  );
  const paginatedBanks = useMemo(
    () => filteredBanks.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredBanks, safePage],
  );

  const openExpenseForm = useCallback(() => {
    setExpenseDate(todayYMD());
    setExpenseName("");
    setExpenseCategory(EXPENSE_CATEGORIES[0] ?? "");
    setExpenseAmount("");
    setShowExpenseForm(true);
  }, []);

  const closeExpenseForm = useCallback(() => {
    setShowExpenseForm(false);
  }, []);

  const openAddBankForm = useCallback(() => {
    setEditingBankId(null);
    setBankLabel("");
    setBankAccountName("");
    setBankAccountNumber("");
    setBankBalance("");
    setBankAssignToInvoice(banks.length === 0);
    setShowBankForm(true);
  }, [banks.length]);

  const openEditBankForm = useCallback(() => {
    const row = banks.find((bank) => selectedRowIds.has(bank.id));
    if (!row) {
      toast.info("Select one bank account to edit.");
      return;
    }
    setEditingBankId(row.id);
    setBankLabel(row.label);
    setBankAccountName(row.accountName === "—" ? "" : row.accountName);
    setBankAccountNumber(row.accountNumber === "—" ? "" : row.accountNumber);
    setBankBalance(String(row.balance));
    setBankAssignToInvoice(row.assignToInvoice);
    setShowBankForm(true);
  }, [banks, selectedRowIds]);

  const closeBankForm = useCallback(() => {
    setShowBankForm(false);
    setEditingBankId(null);
  }, []);

  const handleSaveBank = () => {
    const trimmedLabel = bankLabel.trim();
    if (!trimmedLabel) {
      toast.error("Enter a bank or wallet label.");
      return;
    }
    const balance = Number(bankBalance);
    if (!Number.isFinite(balance)) {
      toast.error("Enter a valid balance.");
      return;
    }

    const bankId = editingBankId ?? `bank-${Date.now()}`;
    const nextRow: ShopWalletBankRow = {
      id: bankId,
      label: trimmedLabel.toUpperCase(),
      accountName: bankAccountName.trim() || "—",
      accountNumber: bankAccountNumber.trim() || "—",
      balance,
      assignToInvoice: bankAssignToInvoice,
    };

    setBanks((prev) => {
      const updated = editingBankId
        ? prev.map((row) => (row.id === editingBankId ? nextRow : row))
        : [nextRow, ...prev];
      if (!nextRow.assignToInvoice) return updated;
      return updated.map((row) => ({
        ...row,
        assignToInvoice: row.id === bankId,
      }));
    });
    setPage(1);
    setSelectedRowIds(new Set());
    toast.success(editingBankId ? "Bank account updated." : "Bank account added.");
    closeBankForm();
  };

  const handleSaveExpense = () => {
    const trimmedName = expenseName.trim();
    if (!trimmedName) {
      toast.error("Enter an expense name.");
      return;
    }
    if (!expenseCategory.trim()) {
      toast.error("Choose a category.");
      return;
    }
    const amount = Number(expenseAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }

    setExpenses((prev) => [
      {
        id: `exp-${Date.now()}`,
        date: expenseDate,
        name: trimmedName,
        category: expenseCategory,
        amount,
      },
      ...prev,
    ]);
    setPage(1);
    toast.success("Expense added.");
    closeExpenseForm();
  };

  useEffect(() => {
    setShowExpenseForm(false);
    setShowBankForm(false);
    setEditingBankId(null);
  }, [view]);

  useEffect(() => {
    setPage(1);
  }, [search, view]);

  useEffect(() => {
    setSelectedRowIds(new Set());
  }, [search, view, page]);

  useEffect(() => {
    if (page > activeTotalPages) {
      setPage(activeTotalPages);
    }
  }, [page, activeTotalPages]);

  const toggleRowSelection = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePageSelection = (ids: string[], checked: boolean) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const selectionProps = {
    selectedIds: selectedRowIds,
    onToggleRow: toggleRowSelection,
    onTogglePage: togglePageSelection,
  };

  const selectedUnpaidRows = useMemo(
    () => (view === "unpaid" ? walletRowsMatchingSelection(selectedRowIds, filteredList) : []),
    [view, selectedRowIds, filteredList],
  );

  const selectedPaidRows = useMemo(
    () => (view === "paid" ? walletRowsMatchingSelection(selectedRowIds, filteredList) : []),
    [view, selectedRowIds, filteredList],
  );

  const selectedBankRows = useMemo(
    () => (view === "banks" ? banks.filter((row) => selectedRowIds.has(row.id)) : []),
    [view, selectedRowIds, banks],
  );

  const hasUnpaidSelection = selectedUnpaidRows.length > 0;
  const hasSingleBankSelection = selectedBankRows.length === 1;
  const invoiceUrlRows = useMemo(
    () => selectedUnpaidRows.filter((row) => pickInvoiceUrl(row.raw)),
    [selectedUnpaidRows],
  );
  const paidInvoiceUrlRows = useMemo(
    () => selectedPaidRows.filter((row) => pickInvoiceUrl(row.raw)),
    [selectedPaidRows],
  );

  const runCollectPayment = async (rows: JobCardListRow[], label: string) => {
    if (rows.length === 0 || bulkBusy) return;
    if (!USE_DUMMY_SHOP_WALLET && !token) return;

    const count = rows.length;
    if (!window.confirm(`Mark ${count} invoice${count === 1 ? "" : "s"} as paid?`)) return;

    setBulkBusy(true);
    let failed = 0;
    try {
      if (USE_DUMMY_SHOP_WALLET) {
        mockLedger.markAsPaid(rows.map((row) => row.id));
        toast.success(`Marked ${count} invoice${count === 1 ? "" : "s"} as paid.`);
      } else {
        for (const row of rows) {
          const res = await collectJobCardPayment(token!, {
            jobCardId: row.id,
            paymentMethod: paymentMethodForRow(row),
            remark: "",
            amount: pickPaymentAmount(row),
          });
          if (!res.ok) failed += 1;
        }
        await syncLedgerData();
        if (failed > 0) {
          toast.error(`${label} failed for ${failed} invoice${failed === 1 ? "" : "s"}.`);
        } else {
          toast.success(`${label} completed for ${count} invoice${count === 1 ? "" : "s"}.`);
        }
      }
      setSelectedRowIds(new Set());
    } finally {
      setBulkBusy(false);
    }
  };

  const handleMarkAsPaid = async () => {
    const rows = selectedUnpaidRows;
    if (rows.length === 0) {
      toast.info("Select one or more unpaid invoices first.");
      return;
    }
    await runCollectPayment(rows, "Mark as paid");
  };

  const handleSendNotification = async (rows: JobCardListRow[], successLabel: string) => {
    if (rows.length === 0 || bulkBusy) return;
    if (!USE_DUMMY_SHOP_WALLET && !token) return;

    setBulkBusy(true);
    let failed = 0;
    try {
      if (USE_DUMMY_SHOP_WALLET) {
        toast.success(`${successLabel} sent for ${rows.length} invoice${rows.length === 1 ? "" : "s"}.`);
      } else {
        for (const row of rows) {
          const res = await resendJobCardNotification(token!, row.id);
          if (!res.ok) failed += 1;
        }
        if (failed > 0) {
          toast.error(`${successLabel} failed for ${failed} invoice${failed === 1 ? "" : "s"}.`);
        } else {
          toast.success(`${successLabel} sent for ${rows.length} invoice${rows.length === 1 ? "" : "s"}.`);
        }
      }
      setSelectedRowIds(new Set());
    } finally {
      setBulkBusy(false);
    }
  };

  const handleSendReminder = () => void handleSendNotification(selectedUnpaidRows, "Reminder");

  const handleViewInvoice = (rows: JobCardListRow[]) => {
    const withUrl = rows.filter((row) => pickInvoiceUrl(row.raw));
    if (withUrl.length === 0) {
      toast.info("No invoice PDF is available for the selected row(s).");
      return;
    }
    const url = pickInvoiceUrl(withUrl[0].raw);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    if (withUrl.length > 1) {
      toast.info("Opened the first selected invoice. Select one row to open a specific invoice.");
    }
  };

  const handleClearSelection = () => setSelectedRowIds(new Set());

  const walletFormOpen =
    (showExpenseForm && view === "expenses") || (showBankForm && view === "banks");
  const pageHeading =
    showExpenseForm && view === "expenses"
      ? "Add Expense"
      : showBankForm && view === "banks"
        ? editingBankId
          ? "Edit Bank Account"
          : "Add Bank Account"
        : SECTION_HEADINGS[view];

  const renderListContent = () => {
    if (showLoading) {
      return <ShopListSkeleton variant="profile-table" className="w-full" />;
    }

    if (showError && (view === "paid" || view === "unpaid")) {
      return <ShopErrorPanel message={error ?? ""} onRetry={() => void syncLedgerData()} />;
    }

    if (view === "expenses") {
      if (filteredExpenses.length === 0) {
        return <p className="text-center text-sm text-gray-600">{EMPTY_MESSAGES.expenses}</p>;
      }
      return (
        <>
          <WalletExpenseTable
            rows={paginatedExpenses}
            countryCode={session?.meta?.countryCode}
            {...selectionProps}
          />
          <WalletListFooter
            totalEntries={activeEntryCount}
            page={safePage}
            totalPages={activeTotalPages}
            onPageChange={setPage}
          />
        </>
      );
    }

    if (view === "banks") {
      if (filteredBanks.length === 0) {
        return <p className="text-center text-sm text-gray-600">{EMPTY_MESSAGES.banks}</p>;
      }
      return (
        <>
          <WalletBankTable
            rows={paginatedBanks}
            countryCode={session?.meta?.countryCode}
            {...selectionProps}
          />
          <WalletListFooter
            totalEntries={activeEntryCount}
            page={safePage}
            totalPages={activeTotalPages}
            onPageChange={setPage}
          />
        </>
      );
    }

    if (filteredList.length === 0) {
      return <p className="text-center text-sm text-gray-600">{EMPTY_MESSAGES[view]}</p>;
    }

    return (
      <>
        <WalletInvoiceTable
          rows={paginatedList}
          isPaid={view === "paid"}
          countryCode={session?.meta?.countryCode}
          {...selectionProps}
        />
        <WalletListFooter
          totalEntries={activeEntryCount}
          page={safePage}
          totalPages={activeTotalPages}
          onPageChange={setPage}
        />
      </>
    );
  };

  return (
    <ShopPageShell
      title="Wallet"
      pageHeading={pageHeading}
      metaTitle="Wallet | AutoDaddy"
      metaDescription="Auto shop wallet and invoices"
      sidebarVariant="nav"
      sidebarExtra={
        <div className={shopSidebarButtonStackClass}>
          <ShopSidebarButton
            label="Paid Invoice"
            active={view === "paid"}
            onClick={() => setView("paid")}
          />

          <ShopSidebarButton
            label="Un-Paid Invoice"
            active={view === "unpaid"}
            onClick={() => setView("unpaid")}
          />

          <ShopSidebarButton
            label="Expenses"
            active={view === "expenses"}
            onClick={() => setView("expenses")}
          />

          <ShopSidebarButton
            label="Manage Banks"
            active={view === "banks"}
            onClick={() => setView("banks")}
          />
        </div>
      }
      heroBackgroundImage={false}
      contentTopOffset
      heroCardFlush
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <div className="space-y-1">
        <ShopReveal show={showExpenseForm && view === "expenses"}>
          <WalletExpenseForm
            date={expenseDate}
            name={expenseName}
            category={expenseCategory}
            amount={expenseAmount}
            onDateChange={setExpenseDate}
            onNameChange={setExpenseName}
            onCategoryChange={setExpenseCategory}
            onAmountChange={setExpenseAmount}
            onSave={handleSaveExpense}
            onCancel={closeExpenseForm}
          />
        </ShopReveal>

        <ShopReveal show={showBankForm && view === "banks"}>
          <WalletBankForm
            mode={editingBankId ? "edit" : "add"}
            label={bankLabel}
            accountName={bankAccountName}
            accountNumber={bankAccountNumber}
            balance={bankBalance}
            assignToInvoice={bankAssignToInvoice}
            onLabelChange={setBankLabel}
            onAccountNameChange={setBankAccountName}
            onAccountNumberChange={setBankAccountNumber}
            onBalanceChange={setBankBalance}
            onAssignToInvoiceChange={setBankAssignToInvoice}
            onSave={handleSaveBank}
            onCancel={closeBankForm}
          />
        </ShopReveal>

        {!walletFormOpen ? (
          <>
            <WalletSearchBar
              value={search}
              onChange={setSearch}
              leading={
            view === "unpaid" ? (
              <>
                <button
                  type="button"
                  onClick={() => void handleMarkAsPaid()}
                  disabled={!hasUnpaidSelection || bulkBusy}
                  className={WALLET_BULK_BUTTON_CLASS}
                >
                  Mark as Paid
                </button>
                <button
                  type="button"
                  onClick={handleSendReminder}
                  disabled={!hasUnpaidSelection || bulkBusy}
                  className={WALLET_BULK_BUTTON_CLASS}
                >
                  Send Reminder
                </button>
                <button
                  type="button"
                  onClick={() => handleViewInvoice(selectedUnpaidRows)}
                  disabled={invoiceUrlRows.length === 0 || bulkBusy}
                  className={WALLET_BULK_BUTTON_CLASS}
                >
                  View Invoice
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  disabled={!hasUnpaidSelection || bulkBusy}
                  className={WALLET_BULK_BUTTON_CLASS}
                >
                  Clear Selection
                </button>
              </>
            ) : view === "paid" ? (
              <>
                <button
                  type="button"
                  onClick={() => handleViewInvoice(selectedPaidRows)}
                  disabled={paidInvoiceUrlRows.length === 0 || bulkBusy}
                  className={WALLET_BULK_BUTTON_CLASS}
                >
                  View Invoice
                </button>
                <button
                  type="button"
                  onClick={() => void handleSendNotification(selectedPaidRows, "Receipt")}
                  disabled={selectedPaidRows.length === 0 || bulkBusy}
                  className={WALLET_BULK_BUTTON_CLASS}
                >
                  Send Receipt
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  disabled={selectedPaidRows.length === 0 || bulkBusy}
                  className={WALLET_BULK_BUTTON_CLASS}
                >
                  Clear Selection
                </button>
              </>
            ) : view === "banks" ? (
              <>
                <button
                  type="button"
                  onClick={openEditBankForm}
                  disabled={!hasSingleBankSelection}
                  className={WALLET_BULK_BUTTON_CLASS}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  disabled={selectedBankRows.length === 0}
                  className={WALLET_BULK_BUTTON_CLASS}
                >
                  Clear Selection
                </button>
              </>
            ) : null
          }
              trailing={
                view === "expenses" ? (
                  <AddNewButton onClick={openExpenseForm} />
                ) : view === "banks" ? (
                  <AddNewButton onClick={openAddBankForm} />
                ) : null
              }
            />
            {renderListContent()}
          </>
        ) : null}
      </div>
    </ShopPageShell>
  );
}
