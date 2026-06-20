import { Fragment, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { FiPrinter } from "react-icons/fi";
import AdminPage from "../../../components/admin/AdminPage";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import {
  DUMMY_BANKS,
  DUMMY_EXPENSES,
  DUMMY_INCOME,
  formatDisplayDate,
  todayIso,
  type AccountReportTitle,
  type BankRow,
  type LedgerRow,
} from "../Accounts/accountData";
import {
  categoryLabel,
  cloneCategories,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type CategoryOption,
} from "../Accounts/ledgerCategories";
import {
  filterLedgerRows,
  formatLongDate,
  formatReportAmount,
  groupLedgerByCategory,
  groupLedgerByProject,
  groupLedgerByVendor,
  groupedReportTitle,
  sumAmounts,
  type GroupBy,
} from "./reportGrouping";

const REPORT_OPTIONS: { value: AccountReportTitle; label: string; description: string }[] = [
  {
    value: "expenses",
    label: "Expense Report",
    description: "View expenses grouped by category, vendor, or date.",
  },
  {
    value: "income",
    label: "Income Report",
    description: "View income grouped by category, vendor, or date.",
  },
  {
    value: "bank",
    label: "Bank Report",
    description: "View bank and wallet account balances.",
  },
];

const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "category", label: "Category" },
  { value: "vendor", label: "Vendor" },
  { value: "project", label: "Project" },
];

const dateRangeFieldWidth = "w-[296px] shrink-0 flex-none sm:w-[376px]";
const REPORT_COMPANY_NAME = "AutoDaddy";

type AppliedFilters = {
  fromDate: string;
  toDate: string;
  title: AccountReportTitle;
  category: string;
  groupBy: GroupBy;
};

function CategoryCell({
  categories,
  row,
}: {
  categories: CategoryOption[];
  row: LedgerRow;
}) {
  const labels = categoryLabel(categories, row.category, row.subcategory);
  return (
    <td className="border border-gray-300 px-3 py-2 align-top">
      <div className="font-bold leading-tight">{labels.category}</div>
      <div className="text-xs text-gray-600">{labels.subcategory}</div>
    </td>
  );
}

function GroupTotalRow({ colSpan, total }: { colSpan: number; total: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="border border-gray-300 px-3 py-2 text-right font-bold">
        Total : {formatReportAmount(total)}
      </td>
    </tr>
  );
}

function GroupedLedgerReport({
  rows,
  groupBy,
  categories,
  reportType,
  fromDate,
  toDate,
}: {
  rows: LedgerRow[];
  groupBy: GroupBy;
  categories: CategoryOption[];
  reportType: "income" | "expenses";
  fromDate: string;
  toDate: string;
}) {
  const vendorColumnLabel = reportType === "expenses" ? "Vendor" : "Source";
  const grandTotal = sumAmounts(rows);

  const categoryGroups = useMemo(
    () => (groupBy === "category" ? groupLedgerByCategory(rows, categories) : []),
    [rows, groupBy, categories]
  );
  const vendorGroups = useMemo(
    () => (groupBy === "vendor" ? groupLedgerByVendor(rows) : []),
    [rows, groupBy]
  );
  const projectGroups = useMemo(
    () => (groupBy === "project" ? groupLedgerByProject(rows) : []),
    [rows, groupBy]
  );

  const tableHeaders =
    groupBy === "category"
      ? ["Date", vendorColumnLabel, "Notes", "Amount"]
      : groupBy === "vendor"
        ? ["Date", "Category", "Notes", "Amount"]
        : [vendorColumnLabel, "Category", "Notes", "Amount"];

  return (
    <div id="report-print-area" className="rounded border border-gray-300 bg-white p-4">
      <div className="mb-4 flex items-start justify-between gap-3 print:hidden">
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded border border-gray-400 bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-300"
        >
          <FiPrinter size={14} aria-hidden />
          Print Report
        </button>
      </div>

      <div className="mb-4 text-center">
        <h3 className="text-xl font-bold text-gray-900">{groupedReportTitle(reportType, groupBy)}</h3>
        <p className="mt-1 text-sm font-semibold text-gray-800">{REPORT_COMPANY_NAME}</p>
        <p className="mt-1 text-sm text-gray-700">
          Between {formatLongDate(fromDate)} and {formatLongDate(toDate)}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-600">
          No records found for the selected filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-ad-purple text-white">
                {tableHeaders.map((header) => (
                  <th
                    key={header}
                    className={`border border-ad-purple-dark px-3 py-2 font-medium ${
                      header === "Amount" ? "text-right" : "text-left"
                    }`}
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
                      <td colSpan={4} className="border border-gray-300 px-3 py-2 font-bold uppercase">
                        {group.label}
                      </td>
                    </tr>
                    {group.subcategories.map((sub) => (
                      <Fragment key={`sub-${group.key}-${sub.key}`}>
                        <tr>
                          <td colSpan={4} className="border border-gray-300 px-3 py-2 font-bold uppercase">
                            {sub.label}
                          </td>
                        </tr>
                        {sub.rows.map((row) => (
                          <tr key={row.id}>
                            <td className="border border-gray-300 px-3 py-2">{formatDisplayDate(row.date)}</td>
                            <td className="border border-gray-300 px-3 py-2 uppercase">{row.vendor}</td>
                            <td className="border border-gray-300 px-3 py-2">{row.notes || ""}</td>
                            <td className="border border-gray-300 px-3 py-2 text-right">
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
                      <td colSpan={4} className="border border-gray-300 px-3 py-2 font-bold uppercase">
                        {group.label}
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.id}>
                        <td className="border border-gray-300 px-3 py-2">{formatDisplayDate(row.date)}</td>
                        <CategoryCell categories={categories} row={row} />
                        <td className="border border-gray-300 px-3 py-2">{row.notes || ""}</td>
                        <td className="border border-gray-300 px-3 py-2 text-right">
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
                      <td colSpan={4} className="border border-gray-300 px-3 py-2 font-bold">
                        {group.label}
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.id}>
                        <td className="border border-gray-300 px-3 py-2 uppercase">{row.vendor}</td>
                        <CategoryCell categories={categories} row={row} />
                        <td className="border border-gray-300 px-3 py-2">{row.notes || ""}</td>
                        <td className="border border-gray-300 px-3 py-2 text-right">
                          {formatReportAmount(row.amount)}
                        </td>
                      </tr>
                    ))}
                    <GroupTotalRow colSpan={4} total={group.total} />
                  </Fragment>
                ))}

              <tr className="bg-gray-100">
                <td colSpan={3} className="border border-gray-300 px-3 py-2 text-right font-bold">
                  Grand Total
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right font-bold">
                  {formatReportAmount(grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReportTypePicker({ onSelect }: { onSelect: (report: AccountReportTitle) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {REPORT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className="rounded border border-gray-300 bg-white px-4 py-6 text-left shadow-sm transition hover:border-ad-green hover:bg-ad-green/5"
        >
          <span className="block text-base font-bold text-ad-green-dark">{option.label}</span>
          <span className="mt-2 block text-sm text-gray-600">{option.description}</span>
        </button>
      ))}
    </div>
  );
}

export default function Reports() {
  const location = useLocation();
  const navResetToken = (location.state as { navReset?: number } | null)?.navReset;

  const defaultToDate = todayIso();
  const defaultFromDate = `${defaultToDate.slice(0, 4)}-01-01`;

  const [selectedReport, setSelectedReport] = useState<AccountReportTitle | null>(null);
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [category, setCategory] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("category");
  const [applied, setApplied] = useState<AppliedFilters | null>(null);
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const expenseCategories = useMemo(() => cloneCategories(EXPENSE_CATEGORIES), []);
  const incomeCategories = useMemo(() => cloneCategories(INCOME_CATEGORIES), []);

  const isLedgerReport = selectedReport === "income" || selectedReport === "expenses";
  const activeCategories =
    selectedReport === "expenses" ? expenseCategories : selectedReport === "income" ? incomeCategories : [];

  const handleSelectReport = (report: AccountReportTitle) => {
    setSelectedReport(report);
    setCategory("");
    setGroupBy("category");
    setApplied(null);
    setPage(1);
  };

  const handleBackToReportTypes = () => {
    setSelectedReport(null);
    setCategory("");
    setGroupBy("category");
    setApplied(null);
    setPage(1);
  };

  useEffect(() => {
    if (!navResetToken) return;
    setSelectedReport(null);
    setCategory("");
    setGroupBy("category");
    setApplied(null);
    setPage(1);
  }, [navResetToken]);

  const handleSearch = () => {
    if (!fromDate || !toDate || !selectedReport) return;
    setApplied({
      fromDate,
      toDate,
      title: selectedReport,
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
    if (!applied || applied.title === "bank") return [];
    const source = applied.title === "expenses" ? DUMMY_EXPENSES : DUMMY_INCOME;
    return filterLedgerRows(source, applied.fromDate, applied.toDate, applied.category);
  }, [applied]);

  const bankRows = useMemo(() => {
    if (applied?.title !== "bank") return [];
    return DUMMY_BANKS;
  }, [applied]);

  const activeRows = applied?.title === "bank" ? bankRows : ledgerRows;
  const totalPages = Math.max(1, Math.ceil(activeRows.length / entriesPerPage));
  const pagedBanks = bankRows.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  const bankTotal = bankRows.reduce((sum, row) => sum + row.totalBalance, 0);

  const reportHeading =
    REPORT_OPTIONS.find((option) => option.value === (applied?.title ?? selectedReport))?.label ?? "Reports";

  const ledgerCategories = applied?.title === "expenses" ? expenseCategories : incomeCategories;

  const searchPanel = selectedReport ? (
    <CompactFormPanel
      className="mb-4 print:hidden"
      footer={
        <CompactFormFooter
          actionLabel="Search"
          cancelLabel="Reset"
          onSave={handleSearch}
          onCancel={handleReset}
        />
      }
    >
      <CompactFormRow className="w-full flex-nowrap items-end overflow-x-auto">
        <CompactField label="Date Range" required className={dateRangeFieldWidth}>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => setFromDate(e.target.value)}
              className={`${compactInputClass} min-w-0 flex-1`}
              required
            />
            <span className="shrink-0 text-xs text-gray-700">to</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
              className={`${compactInputClass} min-w-0 flex-1`}
              required
            />
          </div>
        </CompactField>
        {isLedgerReport && (
          <CompactField label="Category" className={compactFixedFieldWidth}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={compactInputClass}
            >
              <option value="">All Categories</option>
              {activeCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </CompactField>
        )}
        {isLedgerReport && (
          <CompactField label="Group By" className={`${compactFixedFieldWidth} ml-auto shrink-0`}>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className={compactInputClass}
            >
              {GROUP_BY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </CompactField>
        )}
      </CompactFormRow>
    </CompactFormPanel>
  ) : null;

  const showReportTypePicker = !selectedReport;

  return (
    <AdminPage
      title="Reports"
      noPanel
      onTitleClick={handleBackToReportTypes}
      between={
        <>
          {showReportTypePicker && <ReportTypePicker onSelect={handleSelectReport} />}
          {!showReportTypePicker && searchPanel}
        </>
      }
    >
      {!showReportTypePicker && applied ? (
        <>
          <h2 className="mb-3 text-lg font-bold text-ad-green-dark">{reportHeading}</h2>

          {applied.title === "bank" ? (
            <>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <span>
                    {formatDisplayDate(applied.fromDate)} to {formatDisplayDate(applied.toDate)}
                  </span>
                  <span className="text-gray-400">|</span>
                  <span>{bankRows.length} record(s)</span>
                  <span className="text-gray-400">|</span>
                  <span className="font-semibold">Combined balance: {bankTotal} CAD</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Show</span>
                  <select
                    value={entriesPerPage}
                    onChange={(e) => {
                      setEntriesPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="border border-gray-400 px-1 py-0.5"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span>entries</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-ad-purple text-white">
                      <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Bank / Wallet</th>
                      <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Status</th>
                      <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Total Balance</th>
                      <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Account Name</th>
                      <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Account Number</th>
                      <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Interac</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedBanks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                          No bank records found.
                        </td>
                      </tr>
                    ) : (
                      pagedBanks.map((row: BankRow, idx) => (
                        <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                          <td className="border border-gray-300 px-3 py-2 font-bold uppercase">{row.label}</td>
                          <td className="border border-gray-300 px-3 py-2 capitalize">{row.status}</td>
                          <td className="border border-gray-300 px-3 py-2">{row.totalBalance}</td>
                          <td className="border border-gray-300 px-3 py-2">{row.accountName || "—"}</td>
                          <td className="border border-gray-300 px-3 py-2">{row.accountNumber || "—"}</td>
                          <td className="border border-gray-300 px-3 py-2">{row.interac || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {bankRows.length > 0 && (
                <div className="mt-4 flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`h-7 w-7 border text-xs font-medium ${
                        page === p
                          ? "border-ad-green bg-ad-green text-white"
                          : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : applied.title === "income" || applied.title === "expenses" ? (
            <GroupedLedgerReport
              rows={ledgerRows}
              groupBy={applied.groupBy}
              categories={ledgerCategories}
              reportType={applied.title}
              fromDate={applied.fromDate}
              toDate={applied.toDate}
            />
          ) : null}
        </>
      ) : !showReportTypePicker && selectedReport ? (
        <>
          <h2 className="mb-3 text-lg font-bold text-ad-green-dark">{reportHeading}</h2>
          <p className="rounded border border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-600">
            Set your filters and click Search to generate the {reportHeading.toLowerCase()}.
          </p>
        </>
      ) : null}
    </AdminPage>
  );
}
