import { useEffect, useMemo, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopEmptyPanel,
  ShopErrorPanel,
  ShopListPanel,
  ShopLoadingPanel,
} from "../../components/shop/ShopPanels";
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
import { getWalletLedgerTab, shortJobBadgeCode } from "../../lib/shopOwnerWallet";
import type { JobCardListRow } from "../../lib/shopOwnerJobCards";
import useAuth from "../../auth/useAuth";

const PAGE_SIZE = 10;

type WalletView = "paid" | "unpaid" | "expenses" | "banks";

function walletNavBtn(active: boolean) {
  return `flex w-full items-center justify-between rounded-full px-4 py-2.5 text-sm font-bold shadow-sm transition-colors ${
    active
      ? "bg-[#008000] text-white"
      : "border border-[#008000] bg-white text-[#008000] hover:bg-[#d4ffd4]"
  }`;
}

function displayPhone(phone: string | undefined): string {
  const p = (phone ?? "").trim();
  if (!p) return "—";
  const digits = p.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return p;
}

function formatWalletPrice(total: number | string | undefined, countryCode: string | null | undefined): string {
  const formatted = formatCurrencyAmount(total, countryCode, { fallback: "—" });
  if (formatted === "—") return formatted;
  const match = /^([^\d]+)(.+)$/.exec(formatted);
  if (match) {
    return `${match[1].trim()} ${match[2].trim()}`;
  }
  return formatted;
}

function displayBillId(row: JobCardListRow, isPaid: boolean): { label: string; id: string } {
  const code = shortJobBadgeCode(row.jobNo);
  const ledger = getWalletLedgerTab(row.raw);
  if (isPaid || ledger === "invoice") {
    return { label: "Bill no.", id: code === "—" ? "—" : `B ${code}` };
  }
  return { label: "Job no.", id: code === "—" ? "—" : `J ${code}` };
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

function WalletExpenseRow({
  row,
  countryCode,
}: {
  row: ShopWalletExpenseRow;
  countryCode: string | null | undefined;
}) {
  return (
    <article className="flex items-center justify-between gap-4 rounded-md bg-[#d9ffd9] px-4 py-3 sm:px-6">
      <p className="shrink-0 text-sm font-semibold text-blue-700">{row.date}</p>
      <p className="min-w-0 flex-1 truncate text-sm font-bold text-[#008000]">{row.name}</p>
      <p className="hidden min-w-0 truncate text-sm font-semibold text-[#008000] sm:block sm:max-w-[28%]">
        {row.category}
      </p>
      <p className="shrink-0 text-sm font-bold text-[#008000]">
        {formatWalletPrice(row.amount, countryCode)}
      </p>
    </article>
  );
}

function WalletBankRow({
  row,
  countryCode,
}: {
  row: ShopWalletBankRow;
  countryCode: string | null | undefined;
}) {
  return (
    <article className="flex items-center justify-between gap-4 rounded-md border border-[#008000] bg-[#d4ffd4] px-4 py-3 sm:px-6">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#008000]">{row.label}</p>
        <p className="truncate text-sm text-gray-800">{row.accountName}</p>
        <p className="text-xs font-semibold text-blue-700">{row.accountNumber}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-[#008000]">{formatWalletPrice(row.balance, countryCode)}</p>
        {row.assignToInvoice ? (
          <p className="text-xs font-semibold text-ad-purple">Assigned to invoice</p>
        ) : null}
      </div>
    </article>
  );
}

function WalletInvoiceRow({
  row,
  isPaid,
  countryCode,
}: {
  row: JobCardListRow;
  isPaid: boolean;
  countryCode: string | null | undefined;
}) {
  const bill = displayBillId(row, isPaid);

  return (
    <article className="flex items-stretch rounded-sm">
      <div className="flex w-[76px] shrink-0 flex-col items-center justify-center border border-[#008000] bg-white px-2 py-3 text-center sm:w-[88px]">
        <p className="text-[11px] font-semibold leading-tight text-gray-800">{bill.label}</p>
        <p className="mt-0.5 text-sm font-bold leading-tight text-blue-700">{bill.id}</p>
      </div>
      <div
        className={`flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-5 ${
          isPaid ? "bg-[#c6efce]" : "bg-[#ffeBD6]"
        }`}
      >
        <div className="min-w-0 shrink-0 sm:max-w-[34%]">
          <p className="truncate text-sm font-bold text-[#008000]">{row.customerName ?? "—"}</p>
          {row.phone ? (
            <a
              href={`tel:${row.phone.replace(/\s/g, "")}`}
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              {displayPhone(row.phone)}
            </a>
          ) : (
            <p className="text-sm font-semibold text-blue-700">—</p>
          )}
        </div>
        <p className="min-w-0 flex-1 truncate text-center text-lg font-bold tracking-wide text-gray-900 sm:text-xl">
          {row.vehiclePlate?.trim() || "—"}
        </p>
        <div className="shrink-0 text-right sm:max-w-[28%]">
          <p className={`text-sm font-bold ${isPaid ? "text-[#008000]" : "text-ad-purple"}`}>
            {formatWalletPrice(row.total, countryCode)}
          </p>
          <p className="text-sm font-semibold text-blue-700">{row.date ?? "—"}</p>
        </div>
      </div>
    </article>
  );
}

function WalletPagination({
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
    <footer className="mt-3 flex items-center justify-between gap-3 pt-2">
      <p className="text-sm font-semibold text-blue-700">{totalEntries} Entries</p>
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
                    ? "bg-[#008000] text-white"
                    : "border border-[#008000] bg-white text-[#008000] hover:bg-[#d4ffd4]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>
      ) : null}
    </footer>
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
    if (page > activeTotalPages) {
      setPage(activeTotalPages);
    }
  }, [page, activeTotalPages]);

  const selectInvoiceView = (next: "paid" | "unpaid") => {
    setView(next);
    setInvoiceMenuOpen(true);
  };

  const contentTitle =
    view === "paid"
      ? "Paid Invoice"
      : view === "unpaid"
        ? "Un-Paid Invoice"
        : view === "expenses"
          ? "Expenses"
          : "Manage Banks";

  const titleClassName =
    view === "unpaid"
      ? "text-base font-bold text-ad-purple sm:text-lg"
      : "text-base font-bold text-blue-700 sm:text-lg";

  return (
    <ShopPageShell
      metaTitle="Wallet | AutoDaddy"
      metaDescription="Auto shop wallet and invoices"
      sidebarHeading="Wallet"
      sidebarHeadingClassName="font-serif text-2xl font-bold text-gray-600"
      searchPlaceholder="Search Customer"
      searchValue={search}
      onSearchChange={setSearch}
      sidebarExtra={
        <div className="flex flex-col gap-3">
          <div>
            <button
              type="button"
              onClick={() => {
                if (view === "paid" || view === "unpaid") {
                  setInvoiceMenuOpen((open) => !open);
                } else {
                  setView("paid");
                  setInvoiceMenuOpen(true);
                }
              }}
              className={walletNavBtn(view === "paid" || view === "unpaid")}
            >
              <span>All Invoices</span>
              <FiChevronDown
                className={`shrink-0 text-base transition-transform ${invoiceMenuOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {invoiceMenuOpen ? (
              <div className="mt-2 flex flex-col gap-2 pl-1">
                <button
                  type="button"
                  onClick={() => selectInvoiceView("paid")}
                  className={`rounded-full px-4 py-2 text-left text-xs font-bold ${
                    view === "paid"
                      ? "bg-[#d4ffd4] text-[#008000]"
                      : "text-[#008000] hover:bg-[#d4ffd4]/60"
                  }`}
                >
                  Paid Invoice
                </button>
                <button
                  type="button"
                  onClick={() => selectInvoiceView("unpaid")}
                  className={`rounded-full px-4 py-2 text-left text-xs font-bold ${
                    view === "unpaid"
                      ? "bg-[#ffeBD6] text-ad-purple"
                      : "text-ad-purple hover:bg-[#ffeBD6]/60"
                  }`}
                >
                  Un-Paid Invoice
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              setView("expenses");
              setInvoiceMenuOpen(false);
            }}
            className={walletNavBtn(view === "expenses")}
          >
            Expenses
          </button>

          <button
            type="button"
            onClick={() => {
              setView("banks");
              setInvoiceMenuOpen(false);
            }}
            className={walletNavBtn(view === "banks")}
          >
            Manage Banks
          </button>
        </div>
      }
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <div className="flex min-h-[420px] flex-1 flex-col lg:min-h-[calc(100vh-220px)]">
        <div
          className={`mb-4 flex items-center gap-3 ${
            view === "expenses" ? "justify-between" : "justify-center"
          }`}
        >
          {view === "expenses" ? (
            <h1 className="font-serif text-2xl font-bold text-gray-600 md:text-3xl">Wallet</h1>
          ) : null}
          <h2 className={view === "expenses" ? "text-base font-bold text-blue-700 sm:text-lg" : titleClassName}>
            {contentTitle}
          </h2>
          {view === "expenses" ? (
            <button
              type="button"
              disabled
              className="shrink-0 rounded-md bg-[#008000] px-4 py-2 text-sm font-bold text-white opacity-60"
            >
              + Add New
            </button>
          ) : null}
        </div>

        {view === "expenses" ? (
          !USE_DUMMY_SHOP_WALLET ? (
            <ShopEmptyPanel className="min-h-0 flex-1" message="Expenses are not available via API yet." />
          ) : showLoading ? (
            <ShopLoadingPanel className="min-h-0 flex-1" />
          ) : filteredExpenses.length === 0 ? (
            <ShopEmptyPanel className="min-h-0 flex-1" message="No expenses match your search." />
          ) : (
            <>
              <ShopListPanel className="min-h-0 flex-1">
                {paginatedExpenses.map((row) => (
                  <WalletExpenseRow key={row.id} row={row} countryCode={session?.meta?.countryCode} />
                ))}
              </ShopListPanel>
              <WalletPagination
                totalEntries={activeEntryCount}
                page={safePage}
                totalPages={activeTotalPages}
                onPageChange={setPage}
              />
            </>
          )
        ) : view === "banks" ? (
          !USE_DUMMY_SHOP_WALLET ? (
            <ShopEmptyPanel className="min-h-0 flex-1" message="Bank account management is not available yet." />
          ) : showLoading ? (
            <ShopLoadingPanel className="min-h-0 flex-1" />
          ) : filteredBanks.length === 0 ? (
            <ShopEmptyPanel className="min-h-0 flex-1" message="No bank accounts match your search." />
          ) : (
            <>
              <ShopListPanel className="min-h-0 flex-1">
                {paginatedBanks.map((row) => (
                  <WalletBankRow key={row.id} row={row} countryCode={session?.meta?.countryCode} />
                ))}
              </ShopListPanel>
              <WalletPagination
                totalEntries={activeEntryCount}
                page={safePage}
                totalPages={activeTotalPages}
                onPageChange={setPage}
              />
            </>
          )
        ) : showLoading ? (
          <ShopLoadingPanel className="min-h-0 flex-1" />
        ) : showError ? (
          <ShopErrorPanel className="min-h-0 flex-1" message={error ?? ""} onRetry={() => void refresh()} />
        ) : filteredList.length === 0 ? (
          <ShopEmptyPanel
            className="min-h-0 flex-1"
            message={`No ${view === "paid" ? "paid" : "unpaid"} invoices in this category.`}
          />
        ) : (
          <>
            <ShopListPanel className="min-h-0 flex-1">
              {paginatedList.map((row) => (
                <WalletInvoiceRow
                  key={row.id}
                  row={row}
                  isPaid={view === "paid"}
                  countryCode={session?.meta?.countryCode}
                />
              ))}
            </ShopListPanel>

            <WalletPagination
              totalEntries={activeEntryCount}
              page={safePage}
              totalPages={activeTotalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </ShopPageShell>
  );
}
