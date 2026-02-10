import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiHash,
  FiCheckCircle,
  FiCalendar,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";

// API endpoint
const API_BASE = import.meta.env.VITE_API_URL;

function formatShortDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

// Group appointments by appointmentId
function groupByAppointmentId(appointments: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};
  appointments.forEach((app) => {
    if (!grouped[app.appointmentId]) {
      grouped[app.appointmentId] = [];
    }
    grouped[app.appointmentId].push(app);
  });
  return grouped;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

function useDebouncedValue<T>(value: T, delay = 400): T {
  // Custom hook for debouncing, so search box is not jittery with every keystroke
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const TherapistMyAppointments: React.FC = () => {
  // UI/search state
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebouncedValue(searchText, 500);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE_OPTIONS[0]);

  // Table data state
  const [appointments, setAppointments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let didCancel = false;
    const fetchAppointments = async () => {
      setLoading(true);
      setError("");
      try {
        const therapistToken = localStorage.getItem("therapist-token");
        const params: any = {
          page,
          limit,
        };
        if (debouncedSearch.trim().length > 0) {
          params.search = debouncedSearch.trim();
        }
        const response = await axios.get(
          `${API_BASE}/api/therapist/sessions`,
          {
            params,
            headers: {
              Authorization: therapistToken ? `${therapistToken}` : "",
            },
          }
        );
        if (!didCancel) {
          if (response.data && response.data.success) {
            setAppointments(Array.isArray(response.data.data) ? response.data.data : []);
            setTotal(response.data.total || 0);
          } else {
            setError("Failed to fetch appointments");
            setAppointments([]);
            setTotal(0);
          }
        }
      } catch (err: any) {
        if (!didCancel) {
          setError(err.response?.data?.message || "Error fetching appointments");
          setAppointments([]);
          setTotal(0);
        }
      } finally {
        if (!didCancel) setLoading(false);
      }
    };
    fetchAppointments();
    return () => {
      didCancel = true;
    };
    // Only fetch when real search (debounced) changes, or page/limit
  }, [debouncedSearch, page, limit]);

  // When search is changed, reset to page 1
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, limit]);

  // Pagination controls
  const totalPages = Math.ceil(total / limit);

  // Group by appointmentId for display
  const grouped = groupByAppointmentId(appointments);

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6 text-blue-800 flex items-center gap-2">
        <FiCalendar className="text-blue-400" /> My Sessions ({total})
      </h2>
      {/* --- Search and Pagination Controls --- */}
      <div className="mb-6 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
        {/* Search */}
        <div className="flex items-center bg-white rounded border px-2 py-1 gap-1 w-full sm:w-72 shadow-sm">
          <FiSearch className="opacity-50" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search by patient name, ID, or appointment ID..."
            className="grow bg-transparent outline-none py-2 px-2"
            spellCheck={false}
          />
        </div>
        {/* Pagination */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-slate-500">Rows / page:</span>
          <select
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            className="border px-2 py-1 rounded text-sm"
          >
            {PAGE_SIZE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <nav className="flex items-center gap-0.5 ml-1">
            <button
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
              disabled={page === 1}
              title="First page"
              onClick={() => setPage(1)}
              tabIndex={-1}
            >
              <FiChevronsLeft />
            </button>
            <button
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
              disabled={page === 1}
              title="Previous page"
              onClick={() => setPage(p => Math.max(1, p-1))}
              tabIndex={-1}
            >
              <FiChevronLeft />
            </button>
            <span className="px-2 text-sm text-slate-600 select-none">
              {page} <span className="text-xs text-slate-400">/ {Math.max(1, totalPages)}</span>
            </span>
            <button
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
              disabled={page === totalPages || totalPages === 0}
              title="Next page"
              onClick={() => setPage(p => Math.min(totalPages, p+1))}
              tabIndex={-1}
            >
              <FiChevronRight />
            </button>
            <button
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
              disabled={page === totalPages || totalPages === 0}
              title="Last page"
              onClick={() => setPage(totalPages)}
              tabIndex={-1}
            >
              <FiChevronsRight />
            </button>
          </nav>
        </div>
      </div>
      {/* --- Table and Data --- */}
      {loading ? (
        <div className="py-6">Loading sessions...</div>
      ) : error ? (
        <div className="py-6 text-red-600">{error}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-slate-600">No sessions found.</div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([appointmentId, records]) => {
            const first = records[0];
            const patient = first?.patient || {};
            return (
              <div key={appointmentId} className="border rounded-lg shadow bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FiHash className="text-blue-400" />
                  <span className="font-mono text-lg font-semibold text-blue-900">
                    {appointmentId}
                  </span>
                  <span className="ml-4 px-2 py-1 rounded bg-blue-50 text-blue-800 font-medium text-sm">
                    {patient.name || "-"}
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs ml-2">
                    ID: {patient.patientId || "-"}
                  </span>
                </div>
                {/* Session Table - focus */}
                <div className="overflow-x-auto">
                  <table className="min-w-[640px] w-full border-collapse text-base">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 border border-slate-200 bg-slate-100 font-semibold text-left">
                          #
                        </th>
                        <th className="px-4 py-3 border border-slate-200 bg-slate-100 font-semibold text-left">
                          Date
                        </th>
                        <th className="px-4 py-3 border border-slate-200 bg-slate-100 font-semibold text-left">
                          Time Slot
                        </th>
                        <th className="px-4 py-3 border border-slate-200 bg-slate-100 font-semibold text-left">
                          Therapy Type
                        </th>
                        <th className="px-4 py-3 border border-slate-200 bg-slate-100 font-semibold text-center">
                          Checked In
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((rec, idx) => (
                        <tr
                          key={
                            rec.session?._id ||
                            rec.session?.date + rec.session?.slotId ||
                            idx
                          }
                          className="hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 border border-slate-200 text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 border border-slate-200 text-blue-900 font-medium">
                            {formatShortDate(rec.session?.date)}
                          </td>
                          <td className="px-4 py-3 border border-slate-200 font-mono">
                            <span className="bg-slate-100 rounded px-2">
                              {rec.session?.slotId || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3 border border-slate-200">
                            {rec.therapyType?.name || "-"}
                          </td>
                          <td className="px-4 py-3 border border-slate-200 text-center">
                            {rec.session?.isCheckedIn ? (
                              <span className="flex items-center gap-1 text-green-600 justify-center font-medium">
                                <FiCheckCircle className="inline" /> Yes
                              </span>
                            ) : (
                              <span className="text-slate-400">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TherapistMyAppointments;