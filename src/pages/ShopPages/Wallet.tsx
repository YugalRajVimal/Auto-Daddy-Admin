import { useCallback, useEffect, useMemo, useRef, useState, type TextareaHTMLAttributes } from "react";
import { motion } from "framer-motion";
import AttachImageCheckbox from "../../components/admin/AttachImageCheckbox";
import ClipImageHover, { adminClipImageUrl } from "../../components/admin/ClipImageHover";
import { toast } from "react-toastify";
import ComboSelectWithEditor from "../../components/admin/ComboSelectWithEditor";
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
import ListEditorPopup from "../../components/admin/ListEditorPopup";
import { ShopReveal } from "../../components/shop/ShopAnimated";
import { shopAddNewButtonClass } from "../../components/shop/forms/ShopFormPage";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  shopCompactInputClass,
  shopCompactTextareaClass,
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
import { formatDisplayDate } from "../AdminPages/Accounts/accountData";
import {
  categoryLabel,
  cloneCategories,
  dedupeLabels,
  EXPENSE_CATEGORIES,
  slugifyLabel,
  type CategoryOption,
} from "../AdminPages/Accounts/ledgerCategories";
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

const SHOP_COMBO_EDIT_BUTTON_CLASS =
  "block w-full border-b-2 border-ad-purple-dark bg-ad-purple px-2 py-2 text-left text-sm font-bold tracking-wide text-white shadow-inner hover:bg-ad-purple-dark";
const SHOP_COMBO_ACTIVE_ITEM_CLASS = "bg-[#f5cce8] font-semibold text-ad-purple";
const SHOP_FORM_CHECKBOX_LABEL_CLASS = "mb-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-purple";
const SHOP_LIST_EDITOR_HEADER_CLASS = "bg-[#FDE4D0] px-4 py-2.5 text-center text-sm font-bold text-ad-purple";

function normalizeVendorLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function ShopCompactAutoGrowTextarea({
  value,
  onChange,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(26, el.scrollHeight)}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      rows={1}
      className={`${shopCompactTextareaClass} ${className}`}
      {...props}
    />
  );
}

function ShopVendorComboField({
  label,
  required,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (next: string) => void;
  options: string[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = normalizeVendorLabel(value).toLowerCase();
    const base = options
      .map(normalizeVendorLabel)
      .filter(Boolean)
      .filter((opt, idx, arr) => arr.findIndex((v) => v.toLowerCase() === opt.toLowerCase()) === idx);
    if (!q) return base.slice(0, 25);
    return base.filter((opt) => opt.toLowerCase().includes(q)).slice(0, 25);
  }, [value, options]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [value, open]);

  const listboxId = `shop-vendor-listbox-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <CompactField label={label} required={required} className={className}>
      <div ref={rootRef} className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              setOpen(true);
              return;
            }
            if (!open) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(0, i - 1));
            } else if (e.key === "Enter") {
              const hit = filtered[activeIndex];
              if (hit) {
                e.preventDefault();
                onChange(hit);
                setOpen(false);
              }
            }
          }}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          className={shopCompactInputClass}
          autoComplete="off"
        />

        {open && filtered.length > 0 ? (
          <div
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 z-50 mt-0.5 max-h-52 overflow-y-auto rounded border border-gray-400 bg-white shadow-lg"
          >
            {filtered.map((opt, idx) => {
              const active = idx === activeIndex;
              return (
                <button
                  key={`${opt}-${idx}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`block w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100 ${
                    active ? SHOP_COMBO_ACTIVE_ITEM_CLASS : "text-gray-900"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </CompactField>
  );
}

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

function matchesExpenseSearch(
  row: ShopWalletExpenseRow,
  query: string,
  categories: CategoryOption[],
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const labels = categoryLabel(categories, row.category, row.subcategory);
  const haystack = [
    row.date,
    formatDisplayDate(row.date),
    row.vendor,
    String(row.amount),
    labels.category,
    labels.subcategory,
    row.notes,
    row.billNumber ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
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
  mode,
  amount,
  date,
  vendor,
  category,
  notes,
  gst,
  gstAmount,
  hasBillNumber,
  billNumber,
  byCheque,
  chequeAccount,
  attachReceipt,
  receiptFile,
  categoryLabels,
  subcategoryLabels,
  selectedCategoryLabel,
  selectedSubcategoryLabel,
  chequeAccountOptions,
  vendorOptions,
  onAmountChange,
  onDateChange,
  onVendorChange,
  onCategoryChange,
  onSubcategoryChange,
  onNotesChange,
  onGstChange,
  onGstAmountChange,
  onHasBillNumberChange,
  onBillNumberChange,
  onByChequeChange,
  onChequeAccountChange,
  onAttachReceiptChange,
  onReceiptFileChange,
  onOpenCategoriesPopup,
  onOpenSubcategoriesPopup,
  onSave,
  onCancel,
}: {
  mode: "add" | "edit";
  amount: string;
  date: string;
  vendor: string;
  category: string;
  notes: string;
  gst: boolean;
  gstAmount: string;
  hasBillNumber: boolean;
  billNumber: string;
  byCheque: boolean;
  chequeAccount: string;
  attachReceipt: boolean;
  receiptFile: File | null;
  categoryLabels: string[];
  subcategoryLabels: string[];
  selectedCategoryLabel: string;
  selectedSubcategoryLabel: string;
  chequeAccountOptions: string[];
  vendorOptions: string[];
  onAmountChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onVendorChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onGstChange: (value: boolean) => void;
  onGstAmountChange: (value: string) => void;
  onHasBillNumberChange: (value: boolean) => void;
  onBillNumberChange: (value: string) => void;
  onByChequeChange: (value: boolean) => void;
  onChequeAccountChange: (value: string) => void;
  onAttachReceiptChange: (value: boolean) => void;
  onReceiptFileChange: (file: File | null) => void;
  onOpenCategoriesPopup: () => void;
  onOpenSubcategoriesPopup: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const isEdit = mode === "edit";

  return (
    <CompactFormPanel
      className={`${shopProfileFormPanelClass} !mb-4`}
      showBottomBorder={false}
      focusOnMount
      footer={
        <div
          className={`flex flex-wrap items-center justify-between gap-2 px-4 py-1 ${shopProfileFormPanelFooterClass}`}
        >
          <div className="flex min-w-[180px] flex-1 items-center text-xs font-serif italic text-gray-800">
            {isEdit ? "You are editing an expense" : "You are adding a new expense"}
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
      <CompactFormRow className="flex-nowrap items-start gap-x-3 overflow-x-auto">
        <CompactField label="Amount" required className="min-w-0 flex-1">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            className={shopCompactInputClass}
          />
        </CompactField>
        <CompactField label="Date" required className="min-w-0 flex-1">
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className={shopCompactInputClass}
          />
        </CompactField>
        <ShopVendorComboField
          label="Vendor"
          required
          value={vendor}
          onChange={onVendorChange}
          options={vendorOptions}
          className="min-w-0 flex-1"
        />
        <ComboSelectWithEditor
          label="Category"
          required
          value={selectedCategoryLabel}
          placeholder="Select category"
          options={categoryLabels}
          onChange={onCategoryChange}
          onEditAddNew={onOpenCategoriesPopup}
          className="min-w-0 flex-1"
          inputClassName={shopCompactInputClass}
          editButtonClassName={SHOP_COMBO_EDIT_BUTTON_CLASS}
          activeItemClassName={SHOP_COMBO_ACTIVE_ITEM_CLASS}
        />
        <ComboSelectWithEditor
          label="Subcategory"
          required
          value={selectedSubcategoryLabel}
          placeholder="Select subcategory"
          options={subcategoryLabels}
          disabled={!category}
          onChange={onSubcategoryChange}
          onEditAddNew={onOpenSubcategoriesPopup}
          className="min-w-0 flex-1"
          inputClassName={shopCompactInputClass}
          editButtonClassName={SHOP_COMBO_EDIT_BUTTON_CLASS}
          activeItemClassName={SHOP_COMBO_ACTIVE_ITEM_CLASS}
        />
      </CompactFormRow>
      <CompactFormRow className="flex-nowrap items-start gap-x-3 overflow-x-auto">
        <CompactField label="Notes" className="min-w-0 flex-1">
          <ShopCompactAutoGrowTextarea value={notes} onChange={(e) => onNotesChange(e.target.value)} />
        </CompactField>
        <div className="min-w-0 flex-1">
          <AttachImageCheckbox
            label="Attach Image of Receipt"
            checked={attachReceipt}
            onCheckedChange={onAttachReceiptChange}
            file={receiptFile}
            onFileChange={onReceiptFileChange}
          />
        </div>
        <div className="min-w-0 flex-1">
          <label className={SHOP_FORM_CHECKBOX_LABEL_CLASS}>
            <input
              type="checkbox"
              checked={hasBillNumber}
              onChange={(e) => {
                const checked = e.target.checked;
                onHasBillNumberChange(checked);
                if (!checked) onBillNumberChange("");
              }}
              className="h-3.5 w-3.5 accent-ad-purple"
            />
            Bill Number
          </label>
          {hasBillNumber ? (
            <input
              type="text"
              value={billNumber}
              onChange={(e) => onBillNumberChange(e.target.value)}
              className={shopCompactInputClass}
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <label className={SHOP_FORM_CHECKBOX_LABEL_CLASS}>
            <input
              type="checkbox"
              checked={byCheque}
              onChange={(e) => {
                const checked = e.target.checked;
                onByChequeChange(checked);
                if (!checked) onChequeAccountChange("");
              }}
              className="h-3.5 w-3.5 accent-ad-purple"
            />
            By Cheque
          </label>
          {byCheque ? (
            <select
              value={chequeAccount}
              onChange={(e) => onChequeAccountChange(e.target.value)}
              className={shopCompactInputClass}
            >
              <option value="">Select account</option>
              {chequeAccountOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <label className={SHOP_FORM_CHECKBOX_LABEL_CLASS}>
            <input
              type="checkbox"
              checked={gst}
              onChange={(e) => {
                const checked = e.target.checked;
                onGstChange(checked);
                if (!checked) onGstAmountChange("");
              }}
              className="h-3.5 w-3.5 accent-ad-purple"
            />
            GST
          </label>
          {gst ? (
            <input
              type="text"
              inputMode="decimal"
              value={gstAmount}
              onChange={(e) => onGstAmountChange(e.target.value)}
              placeholder="GST amount"
              className={shopCompactInputClass}
            />
          ) : null}
        </div>
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
      className={`${shopProfileFormPanelClass} !mb-4`}
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
  categories,
  countryCode,
  selectedIds,
  onToggleRow,
  onTogglePage,
  onEditRow,
}: {
  rows: ShopWalletExpenseRow[];
  categories: CategoryOption[];
  countryCode: string | null | undefined;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onTogglePage: (ids: string[], checked: boolean) => void;
  onEditRow: (row: ShopWalletExpenseRow) => void;
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
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Vendor</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Amount</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Category</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Notes</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Clip</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const labels = categoryLabel(categories, row.category, row.subcategory);
              return (
                <tr key={row.id} className={adminPanelRowClass(index)}>
                  <td className={SHOP_TABLE_BODY_TD_CHECKBOX_CLASS}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => onToggleRow(row.id)}
                      aria-label={`Select expense ${row.vendor}`}
                      className={SHOP_TABLE_CHECKBOX_CLASS}
                    />
                  </td>
                  <td className={SHOP_TABLE_BODY_TD_CLASS}>
                    <button
                      type="button"
                      onClick={() => onEditRow(row)}
                      className="font-semibold text-blue-700 hover:underline"
                    >
                      {formatDisplayDate(row.date)}
                    </button>
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold uppercase text-gray-800`}>
                    {row.vendor}
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                    {formatWalletPrice(row.amount, countryCode)}
                  </td>
                  <td className={SHOP_TABLE_BODY_TD_CLASS}>
                    <div>
                      <div className="font-bold leading-tight text-gray-800">{labels.category}</div>
                      <div className="text-xs text-gray-500">{labels.subcategory}</div>
                    </div>
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} text-gray-800`}>{row.notes || ""}</td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} text-center`}>
                    {row.attachmentUrl ? (
                      <ClipImageHover
                        imageUrl={row.attachmentUrl}
                        alt={`Receipt for ${row.vendor}`}
                        iconClassName="inline text-blue-600"
                      />
                    ) : (
                      <span className="text-gray-500">--</span>
                    )}
                  </td>
                </tr>
              );
            })}
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
  const [expenseCategories, setExpenseCategories] = useState<CategoryOption[]>(() =>
    cloneCategories(EXPENSE_CATEGORIES),
  );
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayYMD);
  const [expenseVendor, setExpenseVendor] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseSubcategory, setExpenseSubcategory] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [expenseGst, setExpenseGst] = useState(false);
  const [expenseGstAmount, setExpenseGstAmount] = useState("");
  const [expenseHasBillNumber, setExpenseHasBillNumber] = useState(false);
  const [expenseBillNumber, setExpenseBillNumber] = useState("");
  const [expenseByCheque, setExpenseByCheque] = useState(false);
  const [expenseChequeAccount, setExpenseChequeAccount] = useState("");
  const [expenseAttachReceipt, setExpenseAttachReceipt] = useState(false);
  const [expenseReceiptFile, setExpenseReceiptFile] = useState<File | null>(null);
  const [categoriesPopupOpen, setCategoriesPopupOpen] = useState(false);
  const [subcategoriesPopupOpen, setSubcategoriesPopupOpen] = useState(false);
  const [categoriesDraft, setCategoriesDraft] = useState<string[]>([""]);
  const [subcategoriesDraft, setSubcategoriesDraft] = useState<string[]>([""]);
  const categoriesSnapshotRef = useRef<CategoryOption[]>([]);
  const subcategoriesSnapshotRef = useRef<{ value: string; label: string }[]>([]);
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
    () => expenses.filter((row) => matchesExpenseSearch(row, search, expenseCategories)),
    [expenses, search, expenseCategories],
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

  const expenseCategoryLabels = useMemo(
    () => expenseCategories.map((cat) => cat.label),
    [expenseCategories],
  );
  const selectedExpenseCategory = useMemo(
    () => expenseCategories.find((cat) => cat.value === expenseCategory),
    [expenseCategories, expenseCategory],
  );
  const expenseSubcategoryLabels = useMemo(
    () => selectedExpenseCategory?.subcategories.map((sub) => sub.label) ?? [],
    [selectedExpenseCategory],
  );
  const selectedExpenseCategoryLabel = selectedExpenseCategory?.label ?? "";
  const selectedExpenseSubcategoryLabel =
    selectedExpenseCategory?.subcategories.find((sub) => sub.value === expenseSubcategory)?.label ?? "";
  const expenseSubcategoryOptions = useMemo(
    () => selectedExpenseCategory?.subcategories ?? [],
    [selectedExpenseCategory],
  );
  const expenseVendorOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of expenses) {
      const normalized = normalizeVendorLabel(row.vendor);
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      if (!seen.has(key)) seen.set(key, normalized);
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  }, [expenses]);
  const chequeAccountOptions = useMemo(
    () => banks.map((bank) => bank.label).filter(Boolean),
    [banks],
  );

  const resetExpenseForm = useCallback(() => {
    setEditingExpenseId(null);
    setExpenseAmount("");
    setExpenseDate(todayYMD());
    setExpenseVendor("");
    setExpenseCategory("");
    setExpenseSubcategory("");
    setExpenseNotes("");
    setExpenseGst(false);
    setExpenseGstAmount("");
    setExpenseHasBillNumber(false);
    setExpenseBillNumber("");
    setExpenseByCheque(false);
    setExpenseChequeAccount("");
    setExpenseAttachReceipt(false);
    setExpenseReceiptFile(null);
  }, []);

  const handleExpenseCategoryChange = useCallback(
    (nextCategoryLabel: string) => {
      if (!nextCategoryLabel) {
        setExpenseCategory("");
        setExpenseSubcategory("");
        return;
      }
      const match = expenseCategories.find((cat) => cat.label === nextCategoryLabel);
      setExpenseCategory(match?.value ?? slugifyLabel(nextCategoryLabel));
      setExpenseSubcategory("");
    },
    [expenseCategories],
  );

  const handleExpenseSubcategoryChange = useCallback(
    (nextSubcategoryLabel: string) => {
      if (!nextSubcategoryLabel) {
        setExpenseSubcategory("");
        return;
      }
      const match = expenseSubcategoryOptions.find((sub) => sub.label === nextSubcategoryLabel);
      setExpenseSubcategory(match?.value ?? slugifyLabel(nextSubcategoryLabel));
    },
    [expenseSubcategoryOptions],
  );

  const openCategoriesPopup = useCallback(() => {
    categoriesSnapshotRef.current = cloneCategories(expenseCategories);
    setCategoriesDraft(expenseCategoryLabels.length ? [...expenseCategoryLabels] : [""]);
    setCategoriesPopupOpen(true);
  }, [expenseCategories, expenseCategoryLabels]);

  const saveCategoriesPopup = useCallback(() => {
    const labels = dedupeLabels(categoriesDraft);
    const previousLabels = new Set(expenseCategoryLabels.map((label) => label.toLowerCase()));
    const newlyAdded = labels.filter((label) => !previousLabels.has(label.toLowerCase()));

    const nextCategories = labels.map((label) => {
      const existing = expenseCategories.find((cat) => cat.label.toLowerCase() === label.toLowerCase());
      if (existing) return { ...existing, label };
      let value = slugifyLabel(label);
      if (expenseCategories.some((cat) => cat.value === value)) {
        value = `${value}-${Date.now()}`;
      }
      return { value, label, subcategories: [] };
    });

    setExpenseCategories(nextCategories);

    if (newlyAdded.length > 0) {
      const lastAdded = newlyAdded[newlyAdded.length - 1];
      const match = nextCategories.find((cat) => cat.label.toLowerCase() === lastAdded.toLowerCase());
      if (match) handleExpenseCategoryChange(match.label);
    } else if (expenseCategory && !nextCategories.some((cat) => cat.value === expenseCategory)) {
      handleExpenseCategoryChange(nextCategories[0]?.label ?? "");
    }

    setCategoriesPopupOpen(false);
  }, [
    categoriesDraft,
    expenseCategory,
    expenseCategoryLabels,
    expenseCategories,
    handleExpenseCategoryChange,
  ]);

  const cancelCategoriesPopup = useCallback(() => {
    setExpenseCategories(categoriesSnapshotRef.current);
    setCategoriesPopupOpen(false);
  }, []);

  const openSubcategoriesPopup = useCallback(() => {
    if (!expenseCategory) return;
    subcategoriesSnapshotRef.current = [...expenseSubcategoryOptions];
    setSubcategoriesDraft(expenseSubcategoryLabels.length ? [...expenseSubcategoryLabels] : [""]);
    setSubcategoriesPopupOpen(true);
  }, [expenseCategory, expenseSubcategoryLabels, expenseSubcategoryOptions]);

  const saveSubcategoriesPopup = useCallback(() => {
    if (!expenseCategory) return;
    const labels = dedupeLabels(subcategoriesDraft);
    const previousLabels = new Set(expenseSubcategoryLabels.map((label) => label.toLowerCase()));
    const newlyAdded = labels.filter((label) => !previousLabels.has(label.toLowerCase()));

    const nextSubcategories = labels.map((label) => {
      const existing = expenseSubcategoryOptions.find((sub) => sub.label.toLowerCase() === label.toLowerCase());
      if (existing) return { ...existing, label };
      let value = slugifyLabel(label);
      if (expenseSubcategoryOptions.some((sub) => sub.value === value)) {
        value = `${value}-${Date.now()}`;
      }
      return { value, label };
    });

    setExpenseCategories((prev) =>
      prev.map((cat) => (cat.value === expenseCategory ? { ...cat, subcategories: nextSubcategories } : cat)),
    );

    if (newlyAdded.length > 0) {
      const lastAdded = newlyAdded[newlyAdded.length - 1];
      const match = nextSubcategories.find((sub) => sub.label.toLowerCase() === lastAdded.toLowerCase());
      if (match) setExpenseSubcategory(match.value);
    } else if (expenseSubcategory && !nextSubcategories.some((sub) => sub.value === expenseSubcategory)) {
      setExpenseSubcategory(nextSubcategories[0]?.value ?? "");
    }

    setSubcategoriesPopupOpen(false);
  }, [
    expenseCategory,
    expenseSubcategory,
    expenseSubcategoryLabels,
    expenseSubcategoryOptions,
    subcategoriesDraft,
  ]);

  const cancelSubcategoriesPopup = useCallback(() => {
    if (!expenseCategory) return;
    setExpenseCategories((prev) =>
      prev.map((cat) =>
        cat.value === expenseCategory ? { ...cat, subcategories: [...subcategoriesSnapshotRef.current] } : cat,
      ),
    );
    setSubcategoriesPopupOpen(false);
  }, [expenseCategory]);

  useEffect(() => {
    if (expenseSubcategory && !expenseSubcategoryOptions.some((sub) => sub.value === expenseSubcategory)) {
      setExpenseSubcategory("");
    }
  }, [expenseSubcategory, expenseSubcategoryOptions]);

  const openExpenseForm = useCallback(() => {
    resetExpenseForm();
    setShowExpenseForm(true);
  }, [resetExpenseForm]);

  const openEditExpenseForm = useCallback((row: ShopWalletExpenseRow) => {
    setEditingExpenseId(row.id);
    setExpenseAmount(String(row.amount));
    setExpenseDate(row.date);
    setExpenseVendor(row.vendor);
    setExpenseCategory(row.category);
    setExpenseSubcategory(row.subcategory);
    setExpenseNotes(row.notes);
    setExpenseGst(row.gst);
    setExpenseHasBillNumber(Boolean(row.billNumber));
    setExpenseBillNumber(row.billNumber ?? "");
    setExpenseByCheque(row.byCheque);
    setExpenseAttachReceipt(row.hasReceipt);
    setExpenseReceiptFile(null);
    setShowExpenseForm(true);
  }, []);

  const closeExpenseForm = useCallback(() => {
    resetExpenseForm();
    setShowExpenseForm(false);
  }, [resetExpenseForm]);

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
    const trimmedVendor = expenseVendor.trim();
    const parsedAmount = Number.parseFloat(expenseAmount);

    if (!expenseAmount.trim() || !Number.isFinite(parsedAmount)) {
      toast.error("Amount is required.");
      return;
    }
    if (!expenseDate) {
      toast.error("Date is required.");
      return;
    }
    if (!trimmedVendor) {
      toast.error("Vendor is required.");
      return;
    }
    if (!expenseCategory) {
      toast.error("Category is required.");
      return;
    }
    if (!expenseSubcategory) {
      toast.error("Subcategory is required.");
      return;
    }

    const existingExpense = editingExpenseId
      ? expenses.find((row) => row.id === editingExpenseId)
      : undefined;
    const nextAttachmentUrl = expenseAttachReceipt
      ? expenseReceiptFile
        ? URL.createObjectURL(expenseReceiptFile)
        : existingExpense?.attachmentUrl ?? adminClipImageUrl(editingExpenseId ?? `exp-${Date.now()}`)
      : null;

    const payload: Omit<ShopWalletExpenseRow, "id"> = {
      date: expenseDate,
      vendor: trimmedVendor,
      amount: parsedAmount || 0,
      category: expenseCategory,
      subcategory: expenseSubcategory,
      notes: expenseNotes,
      gst: expenseGst,
      billNumber: expenseHasBillNumber && expenseBillNumber.trim() ? expenseBillNumber.trim() : null,
      byCheque: expenseByCheque,
      hasReceipt: expenseAttachReceipt,
      attachmentUrl: nextAttachmentUrl,
    };

    if (editingExpenseId) {
      setExpenses((prev) =>
        prev.map((row) => (row.id === editingExpenseId ? { ...row, ...payload } : row)),
      );
      toast.success("Expense updated.");
    } else {
      setExpenses((prev) => [
        {
          id: `exp-${Date.now()}`,
          ...payload,
        },
        ...prev,
      ]);
      toast.success("Expense added.");
    }

    setPage(1);
    closeExpenseForm();
  };

  useEffect(() => {
    setShowExpenseForm(false);
    setShowBankForm(false);
    setEditingBankId(null);
    resetExpenseForm();
  }, [view, resetExpenseForm]);

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

  const pageHeading =
    showExpenseForm && view === "expenses"
      ? editingExpenseId
        ? "Edit Expense"
        : "Add Expense"
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
            categories={expenseCategories}
            countryCode={session?.meta?.countryCode}
            onEditRow={openEditExpenseForm}
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
      <div className="space-y-3">
        <ShopReveal show={showExpenseForm && view === "expenses"} clipOverflow={false}>
          <WalletExpenseForm
            mode={editingExpenseId ? "edit" : "add"}
            amount={expenseAmount}
            date={expenseDate}
            vendor={expenseVendor}
            category={expenseCategory}
            notes={expenseNotes}
            gst={expenseGst}
            gstAmount={expenseGstAmount}
            hasBillNumber={expenseHasBillNumber}
            billNumber={expenseBillNumber}
            byCheque={expenseByCheque}
            chequeAccount={expenseChequeAccount}
            attachReceipt={expenseAttachReceipt}
            receiptFile={expenseReceiptFile}
            categoryLabels={expenseCategoryLabels}
            subcategoryLabels={expenseSubcategoryLabels}
            selectedCategoryLabel={selectedExpenseCategoryLabel}
            selectedSubcategoryLabel={selectedExpenseSubcategoryLabel}
            chequeAccountOptions={chequeAccountOptions}
            vendorOptions={expenseVendorOptions}
            onAmountChange={setExpenseAmount}
            onDateChange={setExpenseDate}
            onVendorChange={setExpenseVendor}
            onCategoryChange={handleExpenseCategoryChange}
            onSubcategoryChange={handleExpenseSubcategoryChange}
            onNotesChange={setExpenseNotes}
            onGstChange={setExpenseGst}
            onGstAmountChange={setExpenseGstAmount}
            onHasBillNumberChange={setExpenseHasBillNumber}
            onBillNumberChange={setExpenseBillNumber}
            onByChequeChange={setExpenseByCheque}
            onChequeAccountChange={setExpenseChequeAccount}
            onAttachReceiptChange={setExpenseAttachReceipt}
            onReceiptFileChange={setExpenseReceiptFile}
            onOpenCategoriesPopup={openCategoriesPopup}
            onOpenSubcategoriesPopup={openSubcategoriesPopup}
            onSave={handleSaveExpense}
            onCancel={closeExpenseForm}
          />
          {categoriesPopupOpen ? (
            <ListEditorPopup
              title="Edit / Add Categories"
              items={categoriesDraft}
              onChange={setCategoriesDraft}
              onSave={saveCategoriesPopup}
              onCancel={cancelCategoriesPopup}
              placeholder="Category name"
              headerClassName={SHOP_LIST_EDITOR_HEADER_CLASS}
            />
          ) : null}
          {subcategoriesPopupOpen ? (
            <ListEditorPopup
              title={`Edit / Add Subcategories${selectedExpenseCategoryLabel ? ` — ${selectedExpenseCategoryLabel}` : ""}`}
              items={subcategoriesDraft}
              onChange={setSubcategoriesDraft}
              onSave={saveSubcategoriesPopup}
              onCancel={cancelSubcategoriesPopup}
              placeholder="Subcategory name"
              headerClassName={SHOP_LIST_EDITOR_HEADER_CLASS}
            />
          ) : null}
        </ShopReveal>

        <ShopReveal show={showBankForm && view === "banks"} clipOverflow={false}>
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
            view === "expenses" && !showExpenseForm ? (
              <AddNewButton onClick={openExpenseForm} />
            ) : view === "banks" && !showBankForm ? (
              <AddNewButton onClick={openAddBankForm} />
            ) : null
          }
        />
        {renderListContent()}
      </div>
    </ShopPageShell>
  );
}
