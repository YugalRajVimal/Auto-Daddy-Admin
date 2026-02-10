import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FiDownload,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";
import axios from "axios";
import * as XLSX from "xlsx";
import clsx from "clsx";

// Interface for each payment detail coming from backend
interface PaymentDetail {
  InvoiceId: string;
  date: string;
  patientName: string;
  patientId: string;
  amount: number;
  status: string;
}

// Response interface from backend for payments
interface PaymentsResponse {
  success: boolean;
  payments: PaymentDetail[];
  total: number;
  page: number;
  limit: number;
  message?: string;
  error?: string;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

function downloadExcel(filename: string, rows: PaymentDetail[]) {
  const worksheetData = [
    ["InvoiceId", "Date", "Patient Id", "Patient Name", "Amount", "Status"],
    ...rows.map((row) => [
      row.InvoiceId,
      row.date ? new Date(row.date).toLocaleDateString("en-GB") : "",
      row.patientId,
      row.patientName,
      row.amount,
      row.status,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices & Payments");
  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : filename + ".xlsx");
}

// Debounce helper
function useDebouncedValue<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function InvoiveAndPaymentsPage() {
  // Table state
  const [paymentsData, setPaymentsData] = useState<PaymentsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Pagination UI state (controlled separately)
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebouncedValue(searchText, 500);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // For preventing state reset when table data refreshes
  const pageSizeRef = useRef(pageSize);

  // Fetch payments data
  useEffect(() => {
    setLoading(true);
    setError(null);
    const baseUrl = import.meta.env.VITE_API_URL || "";
    const token = localStorage.getItem("patient-token");
    const params = new URLSearchParams();
    params.append("page", String(currentPage));
    params.append("limit", String(pageSize));
    if (debouncedSearchText.trim().length > 0) {
      params.append("search", debouncedSearchText.trim());
    }

    axios
      .get(`${baseUrl}/api/parent/invoice-and-payment?${params.toString()}`, {
        headers: {
          Authorization: token ? token : undefined,
        },
      })
      .then((response) => {
        setPaymentsData(response.data);
        setLoading(false);
      })
      .catch((e) => {
        setError(
          e.response?.data?.message ||
            e.message ||
            "Failed to fetch payment details"
        );
        setPaymentsData(null);
        setLoading(false);
      });
  }, [debouncedSearchText, currentPage, pageSize]);

  // --- Pagination controls ---
  const totalCount = paymentsData?.total || 0;
  const numPages =
    paymentsData && paymentsData.limit > 0
      ? Math.ceil(totalCount / paymentsData.limit)
      : 1;

  const goToPage = (page: number) => {
    if (page < 1 || (numPages && page > numPages)) return;
    setCurrentPage(page);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    pageSizeRef.current = newSize;
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // --- Search bar controls ---
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  };

  // For excel, gather all rows on screen only.
  const displayedRows = paymentsData?.payments || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Invoices & Payments
        </h1>
        {!loading && !error && paymentsData?.payments?.length ? (
          <button
            onClick={() => downloadExcel("invoices-payments", paymentsData.payments)}
            className="flex items-center gap-2 px-3 py-2 border rounded text-sm text-slate-700 hover:bg-slate-100 transition"
          >
            <FiDownload /> Download Excel
          </button>
        ) : null}
      </div>

      {/* --- SEARCH + PAGE SIZE + PAGINATION above table --- */}
      <div className="flex flex-col md:flex-row md:items-center md:gap-8 gap-3 mb-4">
        {/* SEARCH */}
        <div className="flex-1 flex items-center gap-2 bg-white border rounded px-2 py-1">
          <FiSearch className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, Patient Id or Invoice ID"
            value={searchText}
            onChange={handleSearchInputChange}
            className="outline-none flex-1 px-1 py-2 bg-transparent text-slate-800 placeholder:text-slate-400"
          />
        </div>
        {/* PAGE SIZE */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Rows per page</span>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={pageSize}
            onChange={handlePageSizeChange}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        {/* PAGINATION */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            className={clsx("px-1 py-1", currentPage <= 1 && "opacity-50 pointer-events-none")}
            onClick={() => goToPage(1)}
            aria-label="First page"
          >
            <FiChevronsLeft size={18} />
          </button>
          <button
            className={clsx("px-1 py-1", currentPage <= 1 && "opacity-50 pointer-events-none")}
            onClick={() => goToPage(currentPage - 1)}
            aria-label="Previous page"
          >
            <FiChevronLeft size={18} />
          </button>
          <span className="px-2 text-slate-700 text-sm font-semibold select-none">
            Page {currentPage} / {numPages || 1}
          </span>
          <button
            className={clsx("px-1 py-1", currentPage >= numPages && "opacity-50 pointer-events-none")}
            onClick={() => goToPage(currentPage + 1)}
            aria-label="Next page"
          >
            <FiChevronRight size={18} />
          </button>
          <button
            className={clsx("px-1 py-1", currentPage >= numPages && "opacity-50 pointer-events-none")}
            onClick={() => goToPage(numPages)}
            aria-label="Last page"
          >
            <FiChevronsRight size={18} />
          </button>
        </div>
      </div>
      {/* --- end search/paging bar --- */}

      {loading && (
        <div className="text-slate-600">Loading payment details...</div>
      )}
      {error && (
        <div className="text-red-500 mb-4">Error: {error}</div>
      )}

      {!loading && !error && paymentsData && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Invoice ID</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Patient Name & Id</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedRows && displayedRows.length > 0 ? (
                displayedRows.map((payment, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-3 font-mono">{payment.InvoiceId}</td>
                    <td className="px-4 py-3">
                      {payment.date
                        ? new Date(payment.date).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {payment.patientName}
                      <span className="px-1"></span>
                      ({payment.patientId})
                    </td>
                    <td className="px-4 py-3 text-right">
                      ₹{Number(payment.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={
                          payment.status === "paid"
                            ? "text-green-600 font-semibold"
                            : payment.status === "pending"
                            ? "text-yellow-600 font-semibold"
                            : "text-slate-800"
                        }
                      >
                        {payment.status?.charAt(0).toUpperCase() +
                          payment.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Display total summary/pagination below table if desired */}
      <div className="flex flex-row flex-wrap items-center justify-between gap-2 mt-4">
        <div className="text-sm text-slate-500">
          Showing {(currentPage - 1) * pageSize + 1}
          -
          {Math.min((currentPage - 1) * pageSize + (paymentsData?.payments?.length || 0), totalCount)}
          {" "}of {totalCount} record{totalCount !== 1 ? "s" : ""}
        </div>
        <div>
          {/* Duplicate pagination controls below if desired */}
        </div>
      </div>
    </motion.div>
  );
}
