import { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { motion } from "framer-motion";
import {
  ADMIN_PANEL_THEAD_ROW_CLASS,
  adminPanelRowClass,
  adminPanelTableClasses,
  type AdminPanelTableClasses,
} from "../../components/admin/adminPanelTableStyles";
import { shopAddNewButtonClass } from "../../components/shop/forms/ShopFormPage";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopSidebarButton } from "../../components/shop/ShopSidebar";
import { shopSidebarButtonClass, shopSidebarButtonStackClass } from "../../components/shop/shopSidebarStyles";
import { ShopListSkeleton } from "../../components/shop/ShopListSkeletons";
import { ShopErrorPanel, ShopListFooter } from "../../components/shop/ShopPanels";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopWallet } from "../../hooks/useShopWallet";
import { formatCurrencyAmount } from "../../lib/currency";
import {
  DUMMY_PAID_INVOICES,
  DUMMY_SHOP_BANKS,
  DUMMY_SHOP_EXPENSES,
  DUMMY_UNPAID_INVOICES,
  USE_DUMMY_SHOP_WALLET,
  type ShopWalletBankRow,
  type ShopWalletExpenseRow,
} from "../../lib/dummyShopWallet";
import { formatPhoneWithCountryCode } from "../../lib/phoneFormat";
import { getWalletLedgerTab, shortJobBadgeCode } from "../../lib/shopOwnerWallet";
import type { JobCardListRow } from "../../lib/shopOwnerJobCards";
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

const UNAVAILABLE_MESSAGES: Partial<Record<WalletView, string>> = {
  expenses: "Expenses are not available via API yet.",
  banks: "Bank account management is not available yet.",
};

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
  const haystack = [row.customerName, row.phone, row.vehiclePlate, row.jobNo]
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
                className={`flex h-8 min-w-8 items-center justify-center rounded-sm px-2 text-sm font-bold ${
                  isActive
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

function WalletSearchBar({
  value,
  onChange,
  trailing,
}: {
  value: string;
  onChange: (value: string) => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-between gap-2 py-1.5 sm:gap-3">
      <div className="flex flex-wrap items-center gap-2" />
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
  const { session } = useAuth();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [view, setView] = useState<WalletView>("paid");
  const [invoiceMenuOpen, setInvoiceMenuOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(() => new Set());
  const { paid: apiPaid, unpaid: apiUnpaid, loading, error, refresh } = useShopWallet();

  const paid = USE_DUMMY_SHOP_WALLET ? DUMMY_PAID_INVOICES : apiPaid;
  const unpaid = USE_DUMMY_SHOP_WALLET ? DUMMY_UNPAID_INVOICES : apiUnpaid;
  const expenses = USE_DUMMY_SHOP_WALLET ? DUMMY_SHOP_EXPENSES : [];
  const banks = USE_DUMMY_SHOP_WALLET ? DUMMY_SHOP_BANKS : [];
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

  const selectInvoiceView = (next: "paid" | "unpaid") => {
    setView(next);
    setInvoiceMenuOpen(true);
  };

  const selectionProps = {
    selectedIds: selectedRowIds,
    onToggleRow: toggleRowSelection,
    onTogglePage: togglePageSelection,
  };

  const unavailableMessage = !USE_DUMMY_SHOP_WALLET ? UNAVAILABLE_MESSAGES[view] : undefined;

  const renderListContent = () => {
    if (unavailableMessage) {
      return <p className="text-center text-sm text-gray-600">{unavailableMessage}</p>;
    }

    if (showLoading) {
      return <ShopListSkeleton variant="profile-table" className="w-full" />;
    }

    if (showError && (view === "paid" || view === "unpaid")) {
      return <ShopErrorPanel message={error ?? ""} onRetry={() => void refresh()} />;
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
      pageHeading={SECTION_HEADINGS[view]}
      metaTitle="Wallet | AutoDaddy"
      metaDescription="Auto shop wallet and invoices"
      sidebarVariant="nav"
      sidebarExtra={
        <div className={shopSidebarButtonStackClass}>
          <div>
            <ShopSidebarButton
              label="All Invoices"
              active={view === "paid" || view === "unpaid"}
              onClick={() => {
                if (view === "paid" || view === "unpaid") {
                  setInvoiceMenuOpen((open) => !open);
                } else {
                  setView("paid");
                  setInvoiceMenuOpen(true);
                }
              }}
              trailing={
                <FiChevronDown
                  className={`shrink-0 text-base transition-transform ${invoiceMenuOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              }
            />
            {invoiceMenuOpen ? (
              <div className={`mt-2 pl-3 ${shopSidebarButtonStackClass}`}>
                <button
                  type="button"
                  onClick={() => selectInvoiceView("paid")}
                  className={shopSidebarButtonClass(view === "paid", "text-xs")}
                >
                  <span className="min-w-0 flex-1 text-left">Paid Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectInvoiceView("unpaid")}
                  className={shopSidebarButtonClass(view === "unpaid", "text-xs")}
                >
                  <span className="min-w-0 flex-1 text-left">Un-Paid Invoice</span>
                </button>
              </div>
            ) : null}
          </div>

          <ShopSidebarButton
            label="Expenses"
            active={view === "expenses"}
            onClick={() => {
              setView("expenses");
              setInvoiceMenuOpen(false);
            }}
          />

          <ShopSidebarButton
            label="Manage Banks"
            active={view === "banks"}
            onClick={() => {
              setView("banks");
              setInvoiceMenuOpen(false);
            }}
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
        <WalletSearchBar
          value={search}
          onChange={setSearch}
          trailing={
            view === "expenses" ? (
              <button type="button" disabled className={`${shopAddNewButtonClass} opacity-60`}>
                + Add New
              </button>
            ) : null
          }
        />
        {renderListContent()}
      </div>
    </ShopPageShell>
  );
}
