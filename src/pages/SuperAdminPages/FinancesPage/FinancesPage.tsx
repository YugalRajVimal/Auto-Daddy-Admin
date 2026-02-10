import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiDollarSign, FiArrowDownCircle, FiArrowUpCircle, FiDownload, FiSearch, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import axios from "axios";
// @ts-ignore
import * as XLSX from "xlsx";

// Finance log matches backend controller export structure
interface FinanceLog {
  Date: string;
  Description: string;
  Type: string;
  Amount: number;
  CreditDebitStatus?: string;
}

// The server returns an object matching finance.controller.js
interface FinanceDetailsResponse {
  success: boolean;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  logs: FinanceLog[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  message?: string;
  error?: string;
}

function downloadExcel(filename: string, rows: FinanceLog[]) {
  // Prepare data for Excel, ensure header order
  const worksheetRows = rows.map((row) => ({
    Date: row.Date ? new Date(row.Date).toLocaleDateString("en-GB") : "",
    Description: row.Description,
    Type: row.Type,
    Amount: row.Amount,
    CreditDebitStatus: row.CreditDebitStatus || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetRows, {
    header: ["Date", "Description", "Type", "Amount", "CreditDebitStatus"],
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Finances");
  XLSX.writeFile(workbook, filename);
}

export default function FinancesSuperAdminPage() {
  const [financeData, setFinanceData] = useState<FinanceDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // For Excel full export
  const [excelLoading, setExcelLoading] = useState(false);

  const fetchFinanceData = (pageNum: number, searchQuery: string) => {
    setLoading(true);
    const baseUrl = import.meta.env.VITE_API_URL || "";
    axios
      .get(`${baseUrl}/api/super-admin/finance/details`, {
        params: {
          page: pageNum,
          pageSize,
          search: searchQuery,
          sortField: "date",
          sortOrder: "desc"
        }
      })
      .then((response) => {
        setFinanceData(response.data);
        setLoading(false);
        setError(null);
      })
      .catch((e) => {
        setError(
          e.response?.data?.message ||
            e.message ||
            "Failed to fetch finance details"
        );
        setLoading(false);
        setFinanceData(null);
      });
  };

  useEffect(() => {
    fetchFinanceData(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize /* not using pageSize yet, but for reactivity */, search]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    fetchFinanceData(1, search);
  };

  const handleChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const goToPrevPage = () => {
    if (financeData && page > 1) setPage(page - 1);
  };

  const goToNextPage = () => {
    if (financeData && financeData.page < financeData.totalPages) setPage(page + 1);
  };

  // For full Excel export (all data, not just paginated)
  const handleExportExcel = async () => {
    if (!financeData) return;
    setExcelLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      // To fetch all records, set pageSize to a large number (or implement backend 'no pagination' param)
      const resp = await axios.get(`${baseUrl}/api/super-admin/finance/details`, {
        params: {
          page: 1,
          pageSize: 10000, // assuming never more than this, for safe Excel export
          search,
          sortField: "date",
          sortOrder: "desc"
        }
      });
      if (resp.data?.logs?.length > 0) {
        downloadExcel("finances.xlsx", resp.data.logs);
      }
    } catch (e: any) {
      setError(
        e.response?.data?.message ||
          e.message ||
          "Failed to export finance details"
      );
    } finally {
      setExcelLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Finances</h1>
        <div className="flex gap-3 items-center">
          <form onSubmit={handleSearch} className="flex items-center">
            <input
              value={search}
              onChange={handleChangeSearch}
              type="text"
              placeholder="Search (desc, type, status, amount, date)..."
              className="px-3 py-2 border rounded-l outline-none text-sm"
            />
            <button type="submit" className="bg-slate-100 px-3 py-2 rounded-r border-l border-slate-200 text-slate-600 hover:bg-slate-200">
              <FiSearch />
            </button>
          </form>
          <button
            className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-50"
            onClick={handleExportExcel}
            disabled={excelLoading || !financeData?.total}
          >
            {excelLoading ? (
              <span className="animate-spin w-4 h-4 border-2 border-slate-500 rounded-full border-t-transparent border-b-transparent"></span>
            ) : (
              <FiDownload />
            )} Export Excel
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-slate-600">Loading finances...</div>
      )}
      {error && (
        <div className="text-red-500 mb-4">Error: {error}</div>
      )}

      {!loading && !error && financeData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Total Income</span>
                <FiArrowUpCircle className="text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                ₹{Number(financeData.totalIncome ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Total Expenses</span>
                <FiArrowDownCircle className="text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-500">
                ₹{Number(financeData.totalExpenses ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Net Balance</span>
                <FiDollarSign className="text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-800">
                ₹{Number(financeData.netBalance ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Credit/Debit</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {financeData.logs && financeData.logs.length > 0 ? (
                  financeData.logs.map((log, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-3">
                        {log.Date
                          ? new Date(log.Date).toLocaleDateString("en-GB")
                          : "-"}
                      </td>
                      <td className="px-4 py-3">{log.Description}</td>
                      <td className="px-4 py-3">{log.Type}</td>
                      <td className="px-4 py-3">{log.CreditDebitStatus || "-"}</td>
                      <td
                        className={`px-4 py-3 text-right ${
                          log.Type === "Income"
                            ? "text-green-600"
                            : log.Type === "Expense"
                            ? "text-red-500"
                            : "text-slate-800"
                        }`}
                      >
                        ₹{Number(log.Amount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      No finance logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex items-center justify-between p-4 border-t bg-slate-50">
              <div className="text-xs text-slate-500">
                {financeData.logs && financeData.logs.length > 0 ? (
                  <>Showing page {financeData.page} of {financeData.totalPages} (Total: {financeData.total})</>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  className="p-2 rounded border bg-white disabled:opacity-50"
                  onClick={goToPrevPage}
                  disabled={financeData.page <= 1}
                >
                  <FiChevronLeft />
                </button>
                <button
                  className="p-2 rounded border bg-white disabled:opacity-50"
                  onClick={goToNextPage}
                  disabled={financeData.page >= financeData.totalPages}
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
