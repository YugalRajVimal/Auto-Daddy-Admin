import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import AdminPage from "../../../components/admin/AdminPage";

interface AdminDashboardJobCardsByDate {
  date: string;
  count: number;
}

interface AdminDashboardAPI {
  carOwnersCount: number;
  autoShopOwnersCount: number;
  jobCardsCount: number;
  jobCardsByDate?: AdminDashboardJobCardsByDate[];
  dealsCount: number;
  servicesCount: number;
  subServicesCount: number;
}

type SummaryRow = {
  id: string;
  metric: string;
  count: number;
};

const API_URL = import.meta.env.VITE_API_URL;

const statCardConfig = [
  { id: "car-owners", label: "Total Car Owners", getValue: (d: AdminDashboardAPI | null) => d?.carOwnersCount ?? 0 },
  { id: "auto-shop-owners", label: "Total Auto Shop Owners", getValue: (d: AdminDashboardAPI | null) => d?.autoShopOwnersCount ?? 0 },
  { id: "job-cards", label: "Total Job Cards", getValue: (d: AdminDashboardAPI | null) => d?.jobCardsCount ?? 0 },
  { id: "deals", label: "Total Deals", getValue: (d: AdminDashboardAPI | null) => d?.dealsCount ?? 0 },
  { id: "services", label: "Services", getValue: (d: AdminDashboardAPI | null) => d?.servicesCount ?? 0 },
  { id: "sub-services", label: "SubServices", getValue: (d: AdminDashboardAPI | null) => d?.subServicesCount ?? 0 },
];

export default function Reports() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [view, setView] = useState<"summary" | "job-cards">("summary");

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url = (API_URL?.replace(/\/+$/, "") ?? "") + "/api/admin/dashboard";
    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || "Failed to fetch dashboard data");
        }
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setDashboardData(json.data);
        } else {
          throw new Error(json.message || "Invalid dashboard response");
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!dashboardData?.jobCardsByDate?.length) return;
    const sortedDates = [...dashboardData.jobCardsByDate.map((item) => item.date)].sort();
    setFromDate((prev) => prev || sortedDates[0]);
    setToDate((prev) => prev || sortedDates[sortedDates.length - 1]);
  }, [dashboardData?.jobCardsByDate]);

  const summaryRows: SummaryRow[] = useMemo(
    () =>
      statCardConfig.map((card) => ({
        id: card.id,
        metric: card.label,
        count: card.getValue(dashboardData),
      })),
    [dashboardData]
  );

  const jobCardRows = useMemo(() => {
    if (!dashboardData?.jobCardsByDate) return [];
    return dashboardData.jobCardsByDate
      .filter(({ date }) => {
        if (fromDate && date < fromDate) return false;
        if (toDate && date > toDate) return false;
        return true;
      })
      .map((item) => ({ id: item.date, date: item.date, count: item.count }));
  }, [dashboardData?.jobCardsByDate, fromDate, toDate]);

  const activeRows = view === "summary" ? summaryRows : jobCardRows;

  const filtered = activeRows.filter((row) => {
    const q = search.toLowerCase();
    if (view === "summary") {
      const summary = row as SummaryRow;
      return summary.metric.toLowerCase().includes(q) || String(summary.count).includes(q);
    }
    const jobRow = row as { id: string; date: string; count: number };
    return jobRow.date.includes(q) || String(jobRow.count).includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
  const paged = filtered.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((n) => n.id)));
  };

  const switchView = (next: "summary" | "job-cards") => {
    setView(next);
    setSelected(new Set());
    setSearch("");
    setPage(1);
  };

  return (
    <AdminPage title="Reports" noPanel>
      {error && (
        <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
          {error}
        </div>
      )}

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
            Update
          </button>
          <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
            Shoot
          </button>
          <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
            Delete
          </button>
          <button type="button" className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark">
            Print
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-700">
            <span>View:</span>
            <select
              value={view}
              onChange={(e) => switchView(e.target.value as "summary" | "job-cards")}
              className="border border-gray-400 bg-white px-2 py-1 text-xs"
            >
              <option value="summary">System Summary</option>
              <option value="job-cards">Job Cards by Date</option>
            </select>
          </div>
          {view === "job-cards" && (
            <>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-400 bg-white px-2 py-1 text-xs"
              />
              <span className="text-xs text-gray-600">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-400 bg-white px-2 py-1 text-xs"
              />
            </>
          )}
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Live Search here"
            className="border border-gray-400 bg-white px-2 py-1 text-xs"
          />
          <button type="button" className="bg-gray-500 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600">
            Search
          </button>
        </div>
      </div>

      <div className="mb-2 flex items-center gap-2 text-xs text-gray-700">
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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-ad-purple text-white">
              <th className="border border-ad-purple-dark px-2 py-2 text-left">
                <input
                  type="checkbox"
                  checked={paged.length > 0 && selected.size === paged.length}
                  onChange={toggleSelectAll}
                  className="accent-white"
                />
              </th>
              {view === "summary" ? (
                <>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Metric</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Count</th>
                </>
              ) : (
                <>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Date</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Job Cards</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={3} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  No report data found.
                </td>
              </tr>
            ) : view === "summary" ? (
              (paged as SummaryRow[]).map((row, idx) => (
                <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      className="accent-ad-purple"
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <span className="text-blue-700">{row.metric}</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{row.count}</td>
                </tr>
              ))
            ) : (
              (paged as { id: string; date: string; count: number }[]).map((row, idx) => (
                <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      className="accent-ad-purple"
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <span className="text-blue-700">{row.date}</span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{row.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
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
        <Link to="#" className="text-sm text-blue-700 hover:underline">
          Deleted
        </Link>
      </div>
    </AdminPage>
  );
}
