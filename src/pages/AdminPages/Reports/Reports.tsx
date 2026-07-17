import { Fragment, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { FiPrinter } from "react-icons/fi";
import AdminPage from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import {
  estimateGstAmount,
  formatDisplayDate,
  LedgerRow,
  todayIso,
  type AccountReportTitle,
} from "../Accounts/accountData";
import {
  categoryLabel,
  cloneCategories,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type CategoryOption,
} from "../Accounts/ledgerCategories";
import {
  formatLongDate,
  formatReportAmount,
  groupLedgerByCategory,
  groupLedgerByProject,
  groupLedgerByVendor,
  groupedReportTitle,
  sumAmounts,
  type GroupBy,
} from "./reportGrouping";
import {
  fetchReportData,
  type ReportLedgerRow,
  type ReportGstRow,
  type ReportBankRow,
} from "./reportAPI";

const VALID_REPORT_TYPES: AccountReportTitle[] = ["expenses", "income", "bank", "gst"];

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
  {
    value: "gst",
    label: "GST Report",
    description: "View GST/HST on income and expenses for the selected period.",
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
  row: ReportLedgerRow;
}) {
  const labels = categoryLabel(categories, row.category, row.subcategory);
  return (
    <td className="border border-gray-300 px-3 py-2 text-center align-top">
      <div className="font-bold leading-tight">{labels.category}</div>
      <div className="text-xs text-gray-600">{labels.subcategory}</div>
    </td>
  );
}

function GroupTotalRow({ colSpan, total }: { colSpan: number; total: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="border border-gray-300 px-3 py-2 text-center font-bold">
        Total : {formatReportAmount(total)}
      </td>
    </tr>
  );
}

/**
 * Utility to convert a ReportLedgerRow to a LedgerRow with correct types for id and gst field,
 * and ensures billNumber is 'string | null' (not undefined) to match LedgerRow type.
 */
function toLedgerRowCoercingTypes(row: ReportLedgerRow): LedgerRow {
  return {
    ...row,
    id: typeof row.id === "string" ? parseInt(row.id, 10) : row.id,
    byCheque: false,
    hasReceipt: false,
    // LedgerRow expects gst as boolean, but ReportLedgerRow uses number:
    // For Reports, "gst" field is actually an amount (number), so for calculations
    // it is safer to set as false since sum logic does not rely on gst.
    gst: false,
    // Fixes property type mismatch per TS error: Ensures `billNumber` is null if undefined
    billNumber: row.billNumber !== undefined ? row.billNumber : null,
  };
}

function GroupedLedgerReport({
  rows,
  groupBy,
  categories,
  reportType,
  fromDate,
  toDate,
}: {
  rows: ReportLedgerRow[];
  groupBy: GroupBy;
  categories: CategoryOption[];
  reportType: "income" | "expenses";
  fromDate: string;
  toDate: string;
}) {
  const vendorColumnLabel = reportType === "expenses" ? "Vendor" : "Source";

  // Convert ReportLedgerRow[] to LedgerRow[] for sum/grouping, ensuring id is a number and gst is boolean
  const rowsAsLedgerForSum: LedgerRow[] = rows.map(toLedgerRowCoercingTypes);
  const grandTotal = sumAmounts(rowsAsLedgerForSum);

  const rowsAsLedger: LedgerRow[] = rowsAsLedgerForSum;

  const categoryGroups = useMemo(
    () =>
      groupBy === "category"
        ? groupLedgerByCategory(rowsAsLedger, categories)
        : [],
    [rowsAsLedger, groupBy, categories]
  );

  const vendorGroups = useMemo(
    () =>
      groupBy === "vendor"
        ? groupLedgerByVendor(rowsAsLedger)
        : [],
    [rowsAsLedger, groupBy]
  );
  const projectGroups = useMemo(
    () =>
      groupBy === "project"
        ? groupLedgerByProject(rowsAsLedger)
        : [],
    [rowsAsLedger, groupBy]
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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-ad-purple text-white">
              {tableHeaders.map((header) => (
                <th
                  key={header}
                  className="border border-ad-purple-dark px-3 py-2 text-center font-medium"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={tableHeaders.length}
                  className="border border-gray-300 px-3 py-6 text-center text-gray-500"
                >
                  No records found for the selected filters.
                </td>
              </tr>
            ) : (
              <>
                {groupBy === "category" &&
                  categoryGroups.map((group) => (
                    <Fragment key={`cat-${group.key}`}>
                      <tr className="bg-gray-300">
                        <td colSpan={4} className="border border-gray-300 px-3 py-2 text-center font-bold uppercase">
                          {group.label}
                        </td>
                      </tr>
                      {group.subcategories.map((sub) => (
                        <Fragment key={`sub-${group.key}-${sub.key}`}>
                          <tr>
                            <td colSpan={4} className="border border-gray-300 px-3 py-2 text-center font-bold uppercase">
                              {sub.label}
                            </td>
                          </tr>
                          {sub.rows.map((row) => (
                            <tr key={row.id}>
                              <td className="border border-gray-300 px-3 py-2 text-center">{formatDisplayDate(row.date)}</td>
                              <td className="border border-gray-300 px-3 py-2 text-center uppercase">{row.vendor}</td>
                              <td className="border border-gray-300 px-3 py-2 text-left align-top whitespace-normal break-words min-w-[200px]">{row.notes || ""}</td>
                              <td className="border border-gray-300 px-3 py-2 text-center">
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
                        <td colSpan={4} className="border border-gray-300 px-3 py-2 text-center font-bold uppercase">
                          {group.label}
                        </td>
                      </tr>
                      {group.rows.map((row) => (
                        <tr key={row.id}>
                          <td className="border border-gray-300 px-3 py-2 text-center">{formatDisplayDate(row.date)}</td>
                          <CategoryCell categories={categories} row={row as unknown as ReportLedgerRow} />
                          <td className="border border-gray-300 px-3 py-2 text-left align-top whitespace-normal break-words min-w-[200px]">{row.notes || ""}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
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
                        <td colSpan={4} className="border border-gray-300 px-3 py-2 text-center font-bold">
                          {group.label}
                        </td>
                      </tr>
                      {group.rows.map((row) => (
                        <tr key={row.id}>
                          <td className="border border-gray-300 px-3 py-2 text-center uppercase">{row.vendor}</td>
                          <CategoryCell categories={categories} row={row as unknown as ReportLedgerRow} />
                          <td className="border border-gray-300 px-3 py-2 text-left align-top whitespace-normal break-words min-w-[200px]">{row.notes || ""}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            {formatReportAmount(row.amount)}
                          </td>
                        </tr>
                      ))}
                      <GroupTotalRow colSpan={4} total={group.total} />
                    </Fragment>
                  ))}

                <tr className="bg-gray-100">
                  <td colSpan={3} className="border border-gray-300 px-3 py-2 text-center font-bold">
                    Grand Total
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-bold">
                    {formatReportAmount(grandTotal)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GstReportView({
  rows,
  fromDate,
  toDate,
  expenseCategories,
  incomeCategories,
}: {
  rows: ReportGstRow[];
  fromDate: string;
  toDate: string;
  expenseCategories: CategoryOption[];
  incomeCategories: CategoryOption[];
}) {
  const incomeRows = rows.filter((row) => row.ledgerType === "income");
  const expenseRows = rows.filter((row) => row.ledgerType === "expenses");
  const incomeGstTotal = incomeRows.reduce((sum, row) => sum + estimateGstAmount(row.amount), 0);
  const expenseGstTotal = expenseRows.reduce((sum, row) => sum + estimateGstAmount(row.amount), 0);
  const netGst = incomeGstTotal - expenseGstTotal;

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
        <h3 className="text-xl font-bold text-gray-900">GST Report</h3>
        <p className="mt-1 text-sm font-semibold text-gray-800">{REPORT_COMPANY_NAME}</p>
        <p className="mt-1 text-sm text-gray-700">
          Between {formatLongDate(fromDate)} and {formatLongDate(toDate)}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded border border-gray-300 bg-gray-50 px-4 py-3 text-center">
          <p className="text-xs font-semibold uppercase text-gray-600">GST Collected</p>
          <p className="mt-1 text-lg font-bold text-ad-green-dark">{formatReportAmount(incomeGstTotal)}</p>
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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-ad-purple text-white">
              {["Date", "Type", "Vendor / Source", "Category", "Amount", "GST", "Notes"].map((header) => (
                <th
                  key={header}
                  className="border border-ad-purple-dark px-3 py-2 text-center font-medium"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-gray-300 px-3 py-6 text-center text-gray-500">
                  No GST records found for the selected date range.
                </td>
              </tr>
            ) : (
              <>
                {rows.map((row) => {
                  const categories = row.ledgerType === "expenses" ? expenseCategories : incomeCategories;
                  const labels = categoryLabel(categories, row.category, row.subcategory);
                  const gstAmount = estimateGstAmount(row.amount);
                  return (
                    <tr key={`${row.ledgerType}-${row.id}`}>
                      <td className="border border-gray-300 px-3 py-2 text-center">{formatDisplayDate(row.date)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center capitalize">
                        {row.ledgerType === "expenses" ? "Expense" : "Income"}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center uppercase">{row.vendor}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <div className="font-bold leading-tight">{labels.category}</div>
                        <div className="text-xs text-gray-600">{labels.subcategory}</div>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {formatReportAmount(row.amount)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {formatReportAmount(gstAmount)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-left align-top whitespace-normal break-words min-w-[200px]">{row.notes || ""}</td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-100">
                  <td colSpan={5} className="border border-gray-300 px-3 py-2 text-center font-bold">
                    Net GST
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-bold">
                    {formatReportAmount(netGst)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center" />
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportTypePicker({ onSelect }: { onSelect: (report: AccountReportTitle) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
  const navigate = useNavigate();
  const location = useLocation();
  const { reportType: reportTypeParam } = useParams<{ reportType?: string }>();
  const navResetToken = (location.state as { navReset?: number } | null)?.navReset;

  const selectedReport = VALID_REPORT_TYPES.includes(reportTypeParam as AccountReportTitle)
    ? (reportTypeParam as AccountReportTitle)
    : null;

  const defaultToDate = todayIso();
  const defaultFromDate = `${defaultToDate.slice(0, 4)}-01-01`;

  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [category, setCategory] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("category");
  const [applied, setApplied] = useState<AppliedFilters | null>(null);
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // New state for fetched data
  const [rows, setRows] = useState<ReportLedgerRow[] | ReportGstRow[]>([]);
  const [banks, setBanks] = useState<ReportBankRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // We'll use only dummy data for bank list (for select, not results)
  const DUMMY_BANKS = [
    // Only for account select dropdown; NOT for report rows!
    // Put at top-level for window open/close perf, not per-render.
    { id: 1, label: "RBC Primary" },
    { id: 2, label: "TD Business" },
    { id: 3, label: "Cash" },
  ];

  const bankAccountOptions = useMemo(
    () => DUMMY_BANKS.map((bank) => ({ value: String(bank.id), label: bank.label })),
    []
  );

  const activeCategories =
    selectedReport === "expenses"
      ? expenseCategories
      : selectedReport === "income"
        ? incomeCategories
        : selectedReport === "gst"
          ? allCategories
          : [];

  useEffect(() => {
    if (reportTypeParam && !selectedReport) {
      navigate("/admin/reports", { replace: true });
    }
  }, [reportTypeParam, selectedReport, navigate]);

  useEffect(() => {
    if (!navResetToken) return;
    navigate("/admin/reports", { replace: true });
  }, [navResetToken, navigate]);

  useEffect(() => {
    setCategory("");
    setGroupBy("category");
    setApplied(null);
    setPage(1);
  }, [selectedReport]);

  // --- Fetched data loading effect ---
  useEffect(() => {
    if (!applied) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchReportData(applied.title, applied.fromDate, applied.toDate)
      .then(({ rows, banks }) => {
        if (cancelled) return;
        setRows(rows);
        setBanks(banks);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load report");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applied]);

  const handleSelectReport = (report: AccountReportTitle) => {
    navigate(`/admin/reports/${report}`);
  };

  const handleBackToReportTypes = () => {
    navigate("/admin/reports");
  };

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
    setRows([]);
    setBanks([]);
    setError(null);
  };

  // Computed/pagination derived from fetched data instead of dummy data
  const filteredRows =
    applied && applied.category
      ? rows.filter((row: any) => row.category === applied.category)
      : rows;

  const filteredBanks =
    applied && applied.category
      ? banks.filter((bank) => String(bank.id) === applied.category)
      : banks;

  const isBankReport = applied?.title === "bank";
  const isLedgerReport = applied?.title === "income" || applied?.title === "expenses";
  const isGstReport = applied?.title === "gst";

  const activeRows = isBankReport ? filteredBanks : filteredRows;
  const totalPages = Math.max(1, Math.ceil(activeRows.length / entriesPerPage));
  const pagedBanks = filteredBanks.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  const bankTotal = filteredBanks.reduce((sum, row) => sum + (row.totalBalance || 0), 0);

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
      <CompactFormRow className="w-full items-end">
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
        <CompactField
          label={selectedReport === "bank" ? "Account" : "Category"}
          className={compactFixedFieldWidth}
        >
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={compactInputClass}
          >
            {selectedReport === "bank" ? (
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
            className={compactInputClass}
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
  ) : null;

  const showReportTypePicker = !selectedReport;

  return (
    <AdminPage
      title="Reports"
      noPanel
      onTitleClick={selectedReport ? handleBackToReportTypes : undefined}
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

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading report...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">Error: {error}</div>
          ) : isBankReport ? (
            <>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <span>
                    {formatDisplayDate(applied.fromDate)} to {formatDisplayDate(applied.toDate)}
                  </span>
                  <span className="text-gray-400">|</span>
                  <span>{filteredBanks.length} record(s)</span>
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
                <table className="w-full border-collapse text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-ad-purple text-white">
                      <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Bank / Wallet</th>
                      <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Status</th>
                      <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Total Balance</th>
                      <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Account Name</th>
                      <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Account Number</th>
                      <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Interac</th>
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
                      pagedBanks.map((row: ReportBankRow, idx) => (
                        <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                          <td className="border border-gray-300 px-3 py-2 text-center font-bold uppercase">{row.label}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center capitalize">{row.status}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">{row.totalBalance}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">{row.accountName || "—"}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">{row.accountNumber || "—"}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">{row.interac || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredBanks.length > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <TableEntriesSummary total={filteredBanks.length} page={page} pageSize={entriesPerPage} />
                  <div className="flex gap-1">
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
                </div>
              )}
            </>
          ) : isLedgerReport ? (
            <GroupedLedgerReport
              rows={filteredRows as ReportLedgerRow[]}
              groupBy={applied.groupBy}
              categories={ledgerCategories}
              reportType={applied.title === "income" || applied.title === "expenses" ? applied.title : "income"}
              fromDate={applied.fromDate}
              toDate={applied.toDate}
            />
          ) : isGstReport ? (
            <GstReportView
              rows={filteredRows as ReportGstRow[]}
              fromDate={applied.fromDate}
              toDate={applied.toDate}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
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
