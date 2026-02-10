import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  FiDollarSign,
  FiPackage,
  FiCalendar,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiX,
} from "react-icons/fi";
import axios from "axios";
// @ts-ignore
import * as XLSX from "xlsx";

// Data structure for TherapistProfile earnings array per user.schema.js
interface TherapistEarningEntry {
  _id: string;
  amount: number;
  type: "salary" | "contract";
  fromDate: string;
  toDate: string;
  remark?: string;
  paidOn?: string;
}

interface TherapistEarningsResponse {
  success: boolean;
  data: {
    totalEarnings: number;
    totalBookings: number;
    page: number;
    pageSize: number;
    totalPages: number;
    details: TherapistEarningEntry[];
  };
  error?: string;
  message?: string;
}

function downloadExcel(filename: string, rows: TherapistEarningEntry[]) {
  const worksheetRows = rows.map((row) => ({
    "Paid On":
      row.paidOn || row.fromDate
        ? new Date(row.paidOn || row.fromDate).toLocaleDateString("en-GB")
        : "",
    "Amount": typeof row.amount === "number" ? row.amount : "",
    "Type": row.type,
    "From Date": row.fromDate
      ? new Date(row.fromDate).toLocaleDateString("en-GB")
      : "",
    "To Date": row.toDate
      ? new Date(row.toDate).toLocaleDateString("en-GB")
      : "",
    "Remark": row.remark || "",
  }));
  const worksheet = XLSX.utils.json_to_sheet(worksheetRows, {
    header: ["Paid On", "Amount", "Type", "From Date", "To Date", "Remark"],
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Earnings");
  XLSX.writeFile(workbook, filename);
}

const PAGE_SIZE = 15;

export default function MyEarningsTherapist() {
  // Search and pagination state (should NOT reset when table refreshes)
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Only pagination, table data, loading/error
  const [earnings, setEarnings] = useState<TherapistEarningsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // This is used to ensure if API is slower, we only update for last search submitted
  const searchRequestRef = useRef(0);

  // "Summary" stats: totals/ranges (kept stable even when table reloads)
  const [stats, setStats] = useState<{
    totalEarnings?: number;
    totalBookings?: number;
    details?: TherapistEarningEntry[];
  } | null>(null);

  // First fetch for summary (without filters)
  useEffect(() => {
    let ignore = false;
    async function fetchSummary() {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || "";
        const token = localStorage.getItem("therapist-token");
        const res = await axios.get(`${baseUrl}/api/therapist/earnings`, {
          headers: {
            Authorization: token ? `${token}` : "",
          },
          params: {
            // Only fetch page 1, but with a large pageSize to get display range
            page: 1,
            limit: 1000,
          },
        });
        if (!ignore) {
          if (res.data && res.data.success) {
            setStats({
              totalEarnings: res.data.data.totalEarnings,
              totalBookings: res.data.data.totalBookings,
              details: res.data.data.details,
            });
          } else {
            setStats(null);
          }
        }
      } catch {
        if (!ignore) setStats(null);
      }
    }
    fetchSummary();
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch paged data depending on search and page
  useEffect(() => {
    let ignore = false;
    async function fetchEarnings() {
      setLoading(true);
      setError(null);
      const requestId = ++searchRequestRef.current;
      try {
        const baseUrl = import.meta.env.VITE_API_URL || "";
        const token = localStorage.getItem("therapist-token");
        const res = await axios.get(`${baseUrl}/api/therapist/earnings`, {
          headers: {
            Authorization: token ? `${token}` : "",
          },
          params: {
            search: searchQuery.trim(),
            page,
            limit: PAGE_SIZE,
          },
        });
        if (ignore) return;
        // Only update for latest search
        if (requestId !== searchRequestRef.current) return;
        if (res.data && res.data.success) {
          setEarnings(res.data.data);
        } else {
          setError(res.data?.message || "Failed to fetch earnings");
          setEarnings(null);
        }
      } catch (e: any) {
        if (!ignore) {
          setError(
            e?.response?.data?.message ||
              e?.message ||
              "Failed to fetch earnings"
          );
          setEarnings(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchEarnings();
    return () => {
      ignore = true;
    };
  }, [searchQuery, page]);

  // Export current paginated table
  const handleExportExcel = () => {
    if (earnings?.details && earnings.details.length > 0) {
      downloadExcel("my-earnings.xlsx", earnings.details);
    }
  };

  // Export all (unfiltered) range
  const handleExportAllExcel = () => {
    if (stats?.details && stats.details.length > 0) {
      downloadExcel("my-earnings-all.xlsx", stats.details);
    }
  };

  // To keep search box state independent from table reload,
  // use a separate input state and "submit" on search
  const [pendingQuery, setPendingQuery] = useState("");
  // For typing a search, do not reset page on every keystroke; reset manually on search
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    setSearchQuery(pendingQuery.trim());
  };

  // Clear filter button
  const handleClearSearch = () => {
    setPendingQuery("");
    setSearchQuery("");
    setPage(1);
  };

  // Pagination controls
  const totalPages = earnings?.totalPages || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-8"
    >
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-slate-800">My Earnings</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-50"
            onClick={handleExportExcel}
            disabled={!earnings?.details?.length}
            title="Export current page"
          >
            <FiDownload /> Export Excel
          </button>
          <button
            className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-50"
            onClick={handleExportAllExcel}
            disabled={!stats?.details?.length}
            title="Export all (unfiltered)"
          >
            <FiDownload /> Export All
          </button>
        </div>
      </div>

      {/* Search Bar (kept outside table, independent of refresh) */}
      <form
        className="flex items-center gap-2 mb-4 w-full max-w-lg"
        onSubmit={handleSearch}
      >
        <div className="flex border rounded-lg bg-white px-3 py-2 items-center w-full">
          <FiSearch className="mr-2 text-slate-400" />
          <input
            type="text"
            placeholder="Search remarks, date, type, amount..."
            value={pendingQuery}
            onChange={(e) => setPendingQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            disabled={loading}
            spellCheck={false}
          />
          {pendingQuery.length > 0 && (
            <button
              type="button"
              aria-label="Clear search"
              className="ml-2 text-slate-300 hover:text-slate-500"
              onClick={handleClearSearch}
              tabIndex={0}
            >
              <FiX />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="ml-2 px-4 py-2 border rounded text-sm font-medium hover:bg-slate-100 bg-white text-slate-700 disabled:opacity-50"
          disabled={loading}
        >
          Search
        </button>
      </form>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Total Earnings</span>
            <FiDollarSign className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            ₹{Number(stats?.totalEarnings ?? 0).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Total Payouts</span>
            <FiPackage className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {stats?.totalBookings ?? 0}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Paid Month Range</span>
            <FiCalendar className="text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-800">
            {(() => {
              if (!stats?.details || stats.details.length === 0) return "-";
              const allDates = stats.details.flatMap((e) =>
                [e.paidOn, e.fromDate, e.toDate].filter(Boolean)
              );
              if (allDates.length === 0) return "-";
              const asObj = allDates.map((d) => new Date(d!));
              const min = new Date(Math.min(...asObj.map((d) => d.valueOf())));
              const max = new Date(Math.max(...asObj.map((d) => d.valueOf())));
              return (
                `${min.toLocaleDateString("en-GB", {
                  month: "short",
                  year: "numeric",
                })}` +
                (min.getMonth() === max.getMonth() &&
                min.getFullYear() === max.getFullYear()
                  ? ""
                  : ` - ${max.toLocaleDateString("en-GB", {
                      month: "short",
                      year: "numeric",
                    })}`)
              );
            })()}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Paid On</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">From Date</th>
              <th className="px-4 py-3 text-left">To Date</th>
              <th className="px-4 py-3 text-left">Remark</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Loading earnings...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-red-500">
                  Error: {error}
                </td>
              </tr>
            ) : earnings?.details && earnings.details.length > 0 ? (
              earnings.details.map((entry, idx) => (
                <tr key={entry._id || idx} className="border-t">
                  <td className="px-4 py-3">
                    {(entry.paidOn || entry.fromDate)
                      ? new Date(entry.paidOn || entry.fromDate).toLocaleDateString("en-GB")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {typeof entry.amount === "number"
                      ? `₹${Number(entry.amount).toLocaleString("en-IN")}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3">{entry.type}</td>
                  <td className="px-4 py-3">
                    {entry.fromDate
                      ? new Date(entry.fromDate).toLocaleDateString("en-GB")
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {entry.toDate
                      ? new Date(entry.toDate).toLocaleDateString("en-GB")
                      : "-"}
                  </td>
                  <td className="px-4 py-3">{entry.remark || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No payout records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between py-6">
        <div>
          {earnings?.details && earnings.details.length > 0 && earnings?.page && (
            <span className="text-slate-500 text-sm px-2">
              Showing page {earnings.page} of {totalPages}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border rounded-lg flex items-center justify-center disabled:opacity-50"
            disabled={page <= 1 || loading}
            onClick={() => setPage((prev) => (prev > 1 ? prev - 1 : 1))}
            aria-label="Previous page"
          >
            <FiChevronLeft /> Prev
          </button>
          <span className="text-slate-500 text-sm px-1">
            {page}
          </span>
          <button
            className="px-3 py-1 border rounded-lg flex items-center justify-center disabled:opacity-50"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((prev) => (prev < totalPages ? prev + 1 : prev))}
            aria-label="Next page"
          >
            Next <FiChevronRight />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
