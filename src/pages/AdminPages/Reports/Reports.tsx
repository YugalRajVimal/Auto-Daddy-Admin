import { useMemo, useState } from "react";
import { FiPaperclip } from "react-icons/fi";
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
} from "../Accounts/ledgerCategories";

const TITLE_OPTIONS: { value: AccountReportTitle; label: string }[] = [
  { value: "income", label: "Income" },
  { value: "expenses", label: "Expenses" },
  { value: "bank", label: "Bank" },
];

const dateRangeFieldWidth = "w-[296px] shrink-0 flex-none sm:w-[376px]";

type AppliedFilters = {
  fromDate: string;
  toDate: string;
  title: AccountReportTitle | "";
};

function filterLedgerRows(rows: LedgerRow[], fromDate: string, toDate: string) {
  return rows.filter((row) => {
    if (fromDate && row.date < fromDate) return false;
    if (toDate && row.date > toDate) return false;
    return true;
  });
}

function formatAmount(amount: number) {
  return amount % 1 === 0 ? `${amount} CAD` : `${amount.toFixed(2)} CAD`;
}

export default function Reports() {
  const defaultDate = todayIso();

  const [fromDate, setFromDate] = useState(defaultDate);
  const [toDate, setToDate] = useState(defaultDate);
  const [title, setTitle] = useState<AccountReportTitle | "">("");
  const [applied, setApplied] = useState<AppliedFilters | null>(null);
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const expenseCategories = useMemo(() => cloneCategories(EXPENSE_CATEGORIES), []);
  const incomeCategories = useMemo(() => cloneCategories(INCOME_CATEGORIES), []);

  const handleSearch = () => {
    if (!fromDate || !toDate) return;
    setApplied({ fromDate, toDate, title });
    setPage(1);
  };

  const handleReset = () => {
    const today = todayIso();
    setFromDate(today);
    setToDate(today);
    setTitle("");
    setApplied(null);
    setPage(1);
  };

  const ledgerRows = useMemo(() => {
    if (!applied?.title || applied.title === "bank") return [];
    const source = applied.title === "expenses" ? DUMMY_EXPENSES : DUMMY_INCOME;
    return filterLedgerRows(source, applied.fromDate, applied.toDate);
  }, [applied]);

  const bankRows = useMemo(() => {
    if (applied?.title !== "bank") return [];
    return DUMMY_BANKS;
  }, [applied]);

  const activeRows = applied?.title === "bank" ? bankRows : ledgerRows;
  const totalPages = Math.max(1, Math.ceil(activeRows.length / entriesPerPage));
  const pagedLedger = ledgerRows.slice((page - 1) * entriesPerPage, page * entriesPerPage);
  const pagedBanks = bankRows.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  const ledgerTotal = ledgerRows.reduce((sum, row) => sum + row.amount, 0);
  const bankTotal = bankRows.reduce((sum, row) => sum + row.totalBalance, 0);

  const reportHeading = applied?.title
    ? `${TITLE_OPTIONS.find((option) => option.value === applied.title)?.label ?? ""} Report`
    : "Account Report";

  const vendorColumnLabel = applied?.title === "expenses" ? "Vendor" : "Source";

  const searchPanel = (
    <CompactFormPanel
      className="mb-4"
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
        <CompactField label="Title" className={compactFixedFieldWidth}>
          <select
            id="report-title"
            value={title}
            onChange={(e) => setTitle(e.target.value as AccountReportTitle | "")}
            className={compactInputClass}
          >
            <option value="">Nothing selected</option>
            {TITLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </CompactField>
      </CompactFormRow>
    </CompactFormPanel>
  );

  return (
    <AdminPage title="Reports" noPanel between={searchPanel}>
      {applied ? (
        <>
          <h2 className="mb-3 text-lg font-bold text-ad-green-dark">{reportHeading}</h2>

          {applied.title === "" ? (
            <p className="rounded border border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-600">
              Select a title (Income, Expenses, or Bank) and click Search to view the report.
            </p>
          ) : (
            <>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <span>
                    {formatDisplayDate(applied.fromDate)} to {formatDisplayDate(applied.toDate)}
                  </span>
                  <span className="text-gray-400">|</span>
                  <span>{activeRows.length} record(s)</span>
                  {applied.title !== "bank" && (
                    <>
                      <span className="text-gray-400">|</span>
                      <span className="font-semibold">Total: {formatAmount(ledgerTotal)}</span>
                    </>
                  )}
                  {applied.title === "bank" && (
                    <>
                      <span className="text-gray-400">|</span>
                      <span className="font-semibold">Combined balance: {bankTotal} CAD</span>
                    </>
                  )}
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
                {applied.title === "bank" ? (
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
                ) : (
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-ad-purple text-white">
                        <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Date</th>
                        <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">{vendorColumnLabel}</th>
                        <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Amount</th>
                        <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Category</th>
                        <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Notes</th>
                        <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Clip</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedLedger.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                            No records found for the selected date range.
                          </td>
                        </tr>
                      ) : (
                        pagedLedger.map((row, idx) => {
                          const categories = applied.title === "expenses" ? expenseCategories : incomeCategories;
                          const labels = categoryLabel(categories, row.category, row.subcategory);
                          return (
                            <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                              <td className="border border-gray-300 px-3 py-2">{formatDisplayDate(row.date)}</td>
                              <td className="border border-gray-300 px-3 py-2 uppercase">{row.vendor}</td>
                              <td className="border border-gray-300 px-3 py-2">{formatAmount(row.amount)}</td>
                              <td className="border border-gray-300 px-3 py-2">
                                <div>
                                  <div className="font-bold leading-tight">{labels.category}</div>
                                  <div className="text-xs text-gray-500">{labels.subcategory}</div>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-3 py-2">{row.notes || ""}</td>
                              <td className="border border-gray-300 px-3 py-2 text-center">
                                {row.hasReceipt ? (
                                  <FiPaperclip className="inline text-blue-600" size={16} aria-hidden />
                                ) : (
                                  <span className="text-gray-500">--</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {activeRows.length > 0 && (
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
          )}
        </>
      ) : (
        <p className="rounded border border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-600">
          Use the filters above and click Search to generate an account report.
        </p>
      )}
    </AdminPage>
  );
}
