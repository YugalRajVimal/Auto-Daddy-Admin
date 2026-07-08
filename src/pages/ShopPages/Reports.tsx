import { Fragment, useEffect, useMemo, useState } from "react";
import { FiPrinter } from "react-icons/fi";
import {
  ADMIN_PANEL_TABLE_CLASS,
  ADMIN_PANEL_TD_CLASS,
  ADMIN_PANEL_TH_CLASS,
  ADMIN_PANEL_THEAD_ROW_CLASS,
  adminPanelRowClass,
} from "../../components/admin/adminPanelTableStyles";
import {
  CompactField,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
} from "../../components/admin/ContentPanel";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopListFooter } from "../../components/shop/ShopPanels";
import {
  shopCompactInputClass,
  shopProfileFormPanelClass,
  shopProfileFormPanelFooterClass,
} from "../../components/shop/shopLayoutStyles";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import {
  DUMMY_BANKS,
  DUMMY_EXPENSES,
  DUMMY_INCOME,
  estimateGstAmount,
  formatDisplayDate,
  todayIso,
  type AccountReportTitle,
  type BankRow,
  type GstLedgerRow,
  type LedgerRow,
} from "../AdminPages/Accounts/accountData";
import {
  categoryLabel,
  cloneCategories,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type CategoryOption,
} from "../AdminPages/Accounts/ledgerCategories";
import {
  buildGstRows,
  filterGstRows,
  filterLedgerRows,
  formatLongDate,
  formatReportAmount,
  groupLedgerByCategory,
  groupLedgerByProject,
  groupLedgerByVendor,
  groupedReportTitle,
  sumAmounts,
  type GroupBy,
} from "../AdminPages/Reports/reportGrouping";

type AppliedFilters = {
  fromDate: string;
  toDate: string;
  title: AccountReportTitle;
  category: string;
  groupBy: GroupBy;
};

const REPORT_SECTIONS: { id: AccountReportTitle; label: string }[] = [
  { id: "expenses", label: "Expense Report" },
  { id: "income", label: "Income Report" },
  { id: "bank", label: "Bank Report" },
  { id: "gst", label: "GST Report" },
];

const SECTION_HEADINGS: Record<AccountReportTitle, string> = {
  expenses: "Expense Report",
  income: "Income Report",
  bank: "Bank Report",
  gst: "GST Report",
};

const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "category", label: "Category" },
  { value: "vendor", label: "Vendor" },
  { value: "project", label: "Project" },
];

const dateRangeFieldWidth = "w-[296px] shrink-0 flex-none sm:w-[376px]";

function GroupTotalRow({ colSpan, total }: { colSpan: number; total: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className={`${ADMIN_PANEL_TD_CLASS} text-right font-bold`}>
        Total : {formatReportAmount(total)}
      </td>
    </tr>
  );
}

function CategoryCell({
  categories,
  row,
}: {
  categories: CategoryOption[];
  row: LedgerRow;
}) {
  const labels = categoryLabel(categories, row.category, row.subcategory);
  return (
    <td className={`${ADMIN_PANEL_TD_CLASS} align-top`}>
      <div className="font-bold leading-tight text-gray-800">{labels.category}</div>
      <div className="text-xs text-gray-500">{labels.subcategory}</div>
    </td>
  );
}

function ShopReportShell({
  title,
  companyName,
  fromDate,
  toDate,
  children,
}: {
  title: string;
  companyName?: string;
  fromDate: string;
  toDate: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id="report-print-area"
      className="shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white p-4 shadow-sm"
    >
      <div className="mb-4 flex items-start justify-between gap-3 print:hidden">
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded border border-ad-purple bg-white px-3 py-1.5 text-xs font-semibold text-ad-purple hover:bg-[#f5cce8]"
        >
          <FiPrinter size={14} aria-hidden />
          Print Report
        </button>
      </div>

      <div className="mb-4 text-center">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        {companyName ? <p className="mt-1 text-sm font-semibold text-ad-purple">{companyName}</p> : null}
        <p className="mt-1 text-sm text-gray-700">
          Between {formatLongDate(fromDate)} and {formatLongDate(toDate)}
        </p>
      </div>

      {children}
    </div>
  );
}

function ShopGroupedLedgerReport({
  rows,
  groupBy,
  categories,
  reportType,
  fromDate,
  toDate,
  companyName,
}: {
  rows: LedgerRow[];
  groupBy: GroupBy;
  categories: CategoryOption[];
  reportType: "income" | "expenses";
  fromDate: string;
  toDate: string;
  companyName?: string;
}) {
  const vendorColumnLabel = reportType === "expenses" ? "Vendor" : "Source";
  const grandTotal = sumAmounts(rows);

  const categoryGroups = useMemo(
    () => (groupBy === "category" ? groupLedgerByCategory(rows, categories) : []),
    [rows, groupBy, categories],
  );
  const vendorGroups = useMemo(
    () => (groupBy === "vendor" ? groupLedgerByVendor(rows) : []),
    [rows, groupBy],
  );
  const projectGroups = useMemo(
    () => (groupBy === "project" ? groupLedgerByProject(rows) : []),
    [rows, groupBy],
  );

  const tableHeaders =
    groupBy === "category"
      ? ["Date", vendorColumnLabel, "Notes", "Amount"]
      : groupBy === "vendor"
        ? ["Date", "Category", "Notes", "Amount"]
        : [vendorColumnLabel, "Category", "Notes", "Amount"];

  return (
    <ShopReportShell
      title={groupedReportTitle(reportType, groupBy)}
      companyName={companyName}
      fromDate={fromDate}
      toDate={toDate}
    >
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-600">
          No records found for the selected filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className={ADMIN_PANEL_TABLE_CLASS}>
            <thead>
              <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
                {tableHeaders.map((header) => (
                  <th
                    key={header}
                    className={`${ADMIN_PANEL_TH_CLASS} ${header === "Amount" ? "text-right" : "text-left"}`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupBy === "category" &&
                categoryGroups.map((group) => (
                  <Fragment key={`cat-${group.key}`}>
                    <tr className="bg-gray-300">
                      <td colSpan={4} className={`${ADMIN_PANEL_TD_CLASS} font-bold uppercase`}>
                        {group.label}
                      </td>
                    </tr>
                    {group.subcategories.map((sub) => (
                      <Fragment key={`sub-${group.key}-${sub.key}`}>
                        <tr>
                          <td colSpan={4} className={`${ADMIN_PANEL_TD_CLASS} font-bold uppercase`}>
                            {sub.label}
                          </td>
                        </tr>
                        {sub.rows.map((row, idx) => (
                          <tr key={row.id} className={adminPanelRowClass(idx)}>
                            <td className={ADMIN_PANEL_TD_CLASS}>{formatDisplayDate(row.date)}</td>
                            <td className={`${ADMIN_PANEL_TD_CLASS} uppercase`}>{row.vendor}</td>
                            <td className={ADMIN_PANEL_TD_CLASS}>{row.notes || ""}</td>
                            <td className={`${ADMIN_PANEL_TD_CLASS} text-right`}>
                              {formatReportAmount(row.amount)}
                            </td>
                          </tr>
                        ))}
                        <GroupTotalRow colSpan={4} total={sub.total} />
                      </Fragment>
                    ))}
                  </Fragment>
                ))}

              {groupBy === "vendor" &&
                vendorGroups.map((group) => (
                  <Fragment key={`vendor-${group.key}`}>
                    <tr className="bg-gray-300">
                      <td colSpan={4} className={`${ADMIN_PANEL_TD_CLASS} font-bold uppercase`}>
                        {group.label}
                      </td>
                    </tr>
                    {group.rows.map((row, idx) => (
                      <tr key={row.id} className={adminPanelRowClass(idx)}>
                        <td className={ADMIN_PANEL_TD_CLASS}>{formatDisplayDate(row.date)}</td>
                        <CategoryCell categories={categories} row={row} />
                        <td className={ADMIN_PANEL_TD_CLASS}>{row.notes || ""}</td>
                        <td className={`${ADMIN_PANEL_TD_CLASS} text-right`}>
                          {formatReportAmount(row.amount)}
                        </td>
                      </tr>
                    ))}
                    <GroupTotalRow colSpan={4} total={group.total} />
                  </Fragment>
                ))}

              {groupBy === "project" &&
                projectGroups.map((group) => (
                  <Fragment key={`project-${group.key}`}>
                    <tr className="bg-gray-300">
                      <td colSpan={4} className={`${ADMIN_PANEL_TD_CLASS} font-bold`}>
                        {group.label}
                      </td>
                    </tr>
                    {group.rows.map((row, idx) => (
                      <tr key={row.id} className={adminPanelRowClass(idx)}>
                        <td className={`${ADMIN_PANEL_TD_CLASS} uppercase`}>{row.vendor}</td>
                        <CategoryCell categories={categories} row={row} />
                        <td className={ADMIN_PANEL_TD_CLASS}>{row.notes || ""}</td>
                        <td className={`${ADMIN_PANEL_TD_CLASS} text-right`}>
                          {formatReportAmount(row.amount)}
                        </td>
                      </tr>
                    ))}
                    <GroupTotalRow colSpan={4} total={group.total} />
                  </Fragment>
                ))}

              <tr className="bg-gray-100">
                <td colSpan={3} className={`${ADMIN_PANEL_TD_CLASS} text-right font-bold`}>
                  Grand Total
                </td>
                <td className={`${ADMIN_PANEL_TD_CLASS} text-right font-bold`}>
                  {formatReportAmount(grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </ShopReportShell>
  );
}

function ShopGstReportView({
  rows,
  fromDate,
  toDate,
  expenseCategories,
  incomeCategories,
  companyName,
}: {
  rows: GstLedgerRow[];
  fromDate: string;
  toDate: string;
  expenseCategories: CategoryOption[];
  incomeCategories: CategoryOption[];
  companyName?: string;
}) {
  const incomeRows = rows.filter((row) => row.ledgerType === "income");
  const expenseRows = rows.filter((row) => row.ledgerType === "expenses");
  const incomeGstTotal = incomeRows.reduce((sum, row) => sum + estimateGstAmount(row.amount), 0);
  const expenseGstTotal = expenseRows.reduce((sum, row) => sum + estimateGstAmount(row.amount), 0);
  const netGst = incomeGstTotal - expenseGstTotal;

  return (
    <ShopReportShell title="GST Report" companyName={companyName} fromDate={fromDate} toDate={toDate}>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded border border-gray-300 bg-[#FDE4D0] px-4 py-3 text-center">
          <p className="text-xs font-semibold uppercase text-ad-purple">GST Collected</p>
          <p className="mt-1 text-lg font-bold text-ad-purple">{formatReportAmount(incomeGstTotal)}</p>
        </div>
        <div className="rounded border border-gray-300 bg-gray-50 px-4 py-3 text-center">
          <p className="text-xs font-semibold uppercase text-gray-600">GST Paid</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{formatReportAmount(expenseGstTotal)}</p>
        </div>
        <div className="rounded border border-gray-300 bg-gray-50 px-4 py-3 text-center">
          <p className="text-xs font-semibold uppercase text-gray-600">Net GST</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{formatReportAmount(netGst)}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-600">
          No GST records found for the selected date range.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className={ADMIN_PANEL_TABLE_CLASS}>
            <thead>
              <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
                {["Date", "Type", "Vendor / Source", "Category", "Amount", "GST", "Notes"].map((header) => (
                  <th
                    key={header}
                    className={`${ADMIN_PANEL_TH_CLASS} ${
                      header === "Amount" || header === "GST" ? "text-right" : "text-left"
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const categories = row.ledgerType === "expenses" ? expenseCategories : incomeCategories;
                const labels = categoryLabel(categories, row.category, row.subcategory);
                const gstAmount = estimateGstAmount(row.amount);
                return (
                  <tr key={`${row.ledgerType}-${row.id}`} className={adminPanelRowClass(idx)}>
                    <td className={ADMIN_PANEL_TD_CLASS}>{formatDisplayDate(row.date)}</td>
                    <td className={`${ADMIN_PANEL_TD_CLASS} capitalize`}>
                      {row.ledgerType === "expenses" ? "Expense" : "Income"}
                    </td>
                    <td className={`${ADMIN_PANEL_TD_CLASS} uppercase`}>{row.vendor}</td>
                    <td className={ADMIN_PANEL_TD_CLASS}>
                      <div className="font-bold leading-tight text-gray-800">{labels.category}</div>
                      <div className="text-xs text-gray-500">{labels.subcategory}</div>
                    </td>
                    <td className={`${ADMIN_PANEL_TD_CLASS} text-right`}>
                      {formatReportAmount(row.amount)}
                    </td>
                    <td className={`${ADMIN_PANEL_TD_CLASS} text-right`}>
                      {formatReportAmount(gstAmount)}
                    </td>
                    <td className={ADMIN_PANEL_TD_CLASS}>{row.notes || ""}</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-100">
                <td colSpan={5} className={`${ADMIN_PANEL_TD_CLASS} text-right font-bold`}>
                  Net GST
                </td>
                <td className={`${ADMIN_PANEL_TD_CLASS} text-right font-bold`}>
                  {formatReportAmount(netGst)}
                </td>
                <td className={ADMIN_PANEL_TD_CLASS} />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </ShopReportShell>
  );
}

export default function ShopReportsPage() {
  const { faqsHeading, faqsDescription, displayName } = useShopOwnerPortal();
  const [activeReport, setActiveReport] = useState<AccountReportTitle>("expenses");
  const [faqsOpen, setFaqsOpen] = useState(false);

  const defaultToDate = todayIso();
  const defaultFromDate = `${defaultToDate.slice(0, 4)}-01-01`;

  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [category, setCategory] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("category");
  const [applied, setApplied] = useState<AppliedFilters | null>(null);
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const expenseCategories = useMemo(() => cloneCategories(EXPENSE_CATEGORIES), []);
  const incomeCategories = useMemo(() => cloneCategories(INCOME_CATEGORIES), []);
  const allCategories = useMemo(() => {
    const seen = new Set<string>();
    return [...expenseCategories, ...incomeCategories].filter((cat) => {
      if (seen.has(cat.value)) return false;
      seen.add(cat.value);
      return true;
    });
  }, [expenseCategories, incomeCategories]);

  const bankAccountOptions = useMemo(
    () => DUMMY_BANKS.map((bank) => ({ value: String(bank.id), label: bank.label })),
    [],
  );

  const activeCategories =
    activeReport === "expenses"
      ? expenseCategories
      : activeReport === "income"
        ? incomeCategories
        : activeReport === "gst"
          ? allCategories
          : [];

  const companyName = displayName || "AutoDaddy";

  useEffect(() => {
    setCategory("");
    setGroupBy("category");
    setApplied(null);
    setPage(1);
  }, [activeReport]);

  const handleSearch = () => {
    if (!fromDate || !toDate) return;
    setApplied({
      fromDate,
      toDate,
      title: activeReport,
      category,
      groupBy,
    });
    setPage(1);
  };

  const handleReset = () => {
    const today = todayIso();
    setFromDate(`${today.slice(0, 4)}-01-01`);
    setToDate(today);
    setCategory("");
    setGroupBy("category");
    setApplied(null);
    setPage(1);
  };

  const ledgerRows = useMemo(() => {
    if (!applied || applied.title === "bank" || applied.title === "gst") return [];
    const source = applied.title === "expenses" ? DUMMY_EXPENSES : DUMMY_INCOME;
    return filterLedgerRows(source, applied.fromDate, applied.toDate, applied.category);
  }, [applied]);

  const gstRows = useMemo(() => {
    if (applied?.title !== "gst") return [];
    return filterGstRows(
      buildGstRows(DUMMY_EXPENSES, DUMMY_INCOME),
      applied.fromDate,
      applied.toDate,
      applied.category,
    );
  }, [applied]);

  const bankRows = useMemo(() => {
    if (applied?.title !== "bank") return [];
    if (!applied.category) return DUMMY_BANKS;
    return DUMMY_BANKS.filter((bank) => String(bank.id) === applied.category);
  }, [applied]);

  const bankTotal = bankRows.reduce((sum, row) => sum + row.totalBalance, 0);
  const totalPages = Math.max(1, Math.ceil(bankRows.length / entriesPerPage));
  const safePage = Math.min(page, totalPages);
  const pagedBanks = bankRows.slice((safePage - 1) * entriesPerPage, safePage * entriesPerPage);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const ledgerCategories = applied?.title === "expenses" ? expenseCategories : incomeCategories;

  const renderResults = () => {
    if (!applied) {
      return (
        <p className="shop-hero-surface rounded border border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-600 shadow-sm">
          Set your filters and click Search to generate the {SECTION_HEADINGS[activeReport].toLowerCase()}.
        </p>
      );
    }

    if (applied.title === "bank") {
      return (
        <div className="space-y-3">
          <div className="shop-hero-surface rounded border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span>
                {formatDisplayDate(applied.fromDate)} to {formatDisplayDate(applied.toDate)}
              </span>
              <span className="text-gray-400">|</span>
              <span>{bankRows.length} record(s)</span>
              <span className="text-gray-400">|</span>
              <span className="font-semibold text-ad-purple">
                Combined balance: {formatReportAmount(bankTotal)} CAD
              </span>
            </div>
          </div>

          <div className="shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className={ADMIN_PANEL_TABLE_CLASS}>
                <thead>
                  <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
                    {["Bank / Wallet", "Status", "Total Balance", "Account Name", "Account Number", "Interac"].map(
                      (header) => (
                        <th key={header} className={ADMIN_PANEL_TH_CLASS}>
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pagedBanks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={`${ADMIN_PANEL_TD_CLASS} py-4 text-center text-gray-500`}>
                        No bank records found.
                      </td>
                    </tr>
                  ) : (
                    pagedBanks.map((row: BankRow, idx) => (
                      <tr key={row.id} className={adminPanelRowClass(idx)}>
                        <td className={`${ADMIN_PANEL_TD_CLASS} font-bold uppercase text-blue-700`}>
                          {row.label}
                        </td>
                        <td className={`${ADMIN_PANEL_TD_CLASS} capitalize`}>{row.status}</td>
                        <td className={ADMIN_PANEL_TD_CLASS}>{row.totalBalance}</td>
                        <td className={ADMIN_PANEL_TD_CLASS}>{row.accountName || "—"}</td>
                        <td className={ADMIN_PANEL_TD_CLASS}>{row.accountNumber || "—"}</td>
                        <td className={ADMIN_PANEL_TD_CLASS}>{row.interac || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {bankRows.length > 0 ? (
            <ShopListFooter className="text-sm font-semibold text-gray-600">
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <span>Show</span>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className={`${shopCompactInputClass} w-auto`}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>entries</span>
              </div>
              {totalPages > 1 ? (
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
                    const isActive = pageNumber === safePage;
                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
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
              ) : (
                <p>{bankRows.length} Entries</p>
              )}
            </ShopListFooter>
          ) : null}
        </div>
      );
    }

    if (applied.title === "income" || applied.title === "expenses") {
      return (
        <ShopGroupedLedgerReport
          rows={ledgerRows}
          groupBy={applied.groupBy}
          categories={ledgerCategories}
          reportType={applied.title}
          fromDate={applied.fromDate}
          toDate={applied.toDate}
          companyName={companyName}
        />
      );
    }

    if (applied.title === "gst") {
      return (
        <ShopGstReportView
          rows={gstRows}
          fromDate={applied.fromDate}
          toDate={applied.toDate}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          companyName={companyName}
        />
      );
    }

    return null;
  };

  return (
    <ShopPageShell
      title="Reports"
      pageHeading={SECTION_HEADINGS[activeReport]}
      metaTitle="Reports | AutoDaddy"
      metaDescription="Auto shop reports"
      sidebarVariant="nav"
      sidebarItems={REPORT_SECTIONS}
      activeSidebarId={activeReport}
      onSidebarSelect={(id) => setActiveReport(id as AccountReportTitle)}
      heroBackgroundImage={false}
      contentTopOffset
      heroCardFlush
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <div className="space-y-4">
        <CompactFormPanel
          className={`${shopProfileFormPanelClass} !mb-0`}
          showBottomBorder={false}
          footer={
            <div
              className={`flex flex-wrap items-center justify-between gap-2 px-4 py-1 ${shopProfileFormPanelFooterClass}`}
            >
              <div className="flex min-w-[180px] flex-1 items-center text-xs font-serif italic text-gray-800">
                Set filters, then search to generate your report
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded bg-ad-form-save px-5 py-1 text-sm font-bold text-white hover:brightness-95"
                >
                  Search
                </button>
                <span className="text-xs text-gray-700">
                  or{" "}
                  <button
                    type="button"
                    onClick={handleReset}
                    className="font-medium text-blue-600 underline hover:text-blue-700"
                  >
                    Reset
                  </button>
                </span>
              </div>
            </div>
          }
        >
          <CompactFormRow className="w-full items-end">
            <CompactField label="Date Range" required className={dateRangeFieldWidth}>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => setFromDate(e.target.value)}
                  className={`${shopCompactInputClass} min-w-0 flex-1`}
                  required
                />
                <span className="shrink-0 text-xs text-gray-700">to</span>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => setToDate(e.target.value)}
                  className={`${shopCompactInputClass} min-w-0 flex-1`}
                  required
                />
              </div>
            </CompactField>
            <CompactField
              label={activeReport === "bank" ? "Account" : "Category"}
              className={compactFixedFieldWidth}
            >
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={shopCompactInputClass}
              >
                {activeReport === "bank" ? (
                  <>
                    <option value="">All Accounts</option>
                    {bankAccountOptions.map((bank) => (
                      <option key={bank.value} value={bank.value}>
                        {bank.label}
                      </option>
                    ))}
                  </>
                ) : (
                  <>
                    <option value="">All Categories</option>
                    {activeCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </CompactField>
            <CompactField label="Group By" className={compactFixedFieldWidth}>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                className={shopCompactInputClass}
              >
                {GROUP_BY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </CompactField>
          </CompactFormRow>
        </CompactFormPanel>

        {renderResults()}
      </div>
    </ShopPageShell>
  );
}
