import { useEffect, useState, useMemo } from "react";
import PageMeta from "../../../components/common/PageMeta";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

const API_URL = import.meta.env.VITE_API_URL;

const statCardConfig = [
  {
    label: "Total Car Owners",
    color: "border-green-400",
    getValue: (d: AdminDashboardAPI | null) => (d ? d.carOwnersCount : "—"),
  },
  {
    label: "Total Auto Shop Owners",
    color: "border-blue-400",
    getValue: (d: AdminDashboardAPI | null) => (d ? d.autoShopOwnersCount : "—"),
  },
  {
    label: "Total Job Cards",
    color: "border-purple-400",
    getValue: (d: AdminDashboardAPI | null) => (d ? d.jobCardsCount : "—"),
  },
  {
    label: "Total Deals",
    color: "border-yellow-400",
    getValue: (d: AdminDashboardAPI | null) => (d ? d.dealsCount : "—"),
  },
];

function formatDateForInput(date: Date) {
  return date.toISOString().split("T")[0];
}

function daysBetween(from: string, to: string) {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function Reports() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [fromDateObj, setFromDateObj] = useState<Date | null>(null);
  const [toDateObj, setToDateObj] = useState<Date | null>(null);

  useEffect(() => {
    if (dashboardData?.jobCardsByDate && dashboardData.jobCardsByDate.length > 0) {
      const sortedDates = [...dashboardData.jobCardsByDate.map((item) => item.date)].sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );
      setFromDate(sortedDates[0]);
      setToDate(sortedDates[sortedDates.length - 1]);
      setFromDateObj(new Date(sortedDates[0]));
      setToDateObj(new Date(sortedDates[sortedDates.length - 1]));
    }
  }, [dashboardData?.jobCardsByDate]);

  useEffect(() => {
    if (fromDateObj) setFromDate(formatDateForInput(fromDateObj));
  }, [fromDateObj]);

  useEffect(() => {
    if (fromDate) setFromDateObj(new Date(fromDate));
  }, [fromDate]);

  useEffect(() => {
    if (toDateObj) setToDate(formatDateForInput(toDateObj));
  }, [toDateObj]);

  useEffect(() => {
    if (toDate) setToDateObj(new Date(toDate));
  }, [toDate]);

  const jobCardByDateChartData = useMemo(() => {
    if (!dashboardData?.jobCardsByDate) return [];
    let filtered = dashboardData.jobCardsByDate;
    if (fromDate && toDate) {
      filtered = filtered.filter(({ date }) => date >= fromDate && date <= toDate);
    }
    return filtered.map((item) => ({ date: item.date, count: item.count }));
  }, [dashboardData?.jobCardsByDate, fromDate, toDate]);

  const chartDaysDifference = fromDate && toDate ? daysBetween(fromDate, toDate) : 0;

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
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const dateRange = useMemo(() => {
    if (!dashboardData?.jobCardsByDate?.length) {
      return { min: undefined, max: undefined };
    }
    const dates = dashboardData.jobCardsByDate.map((d) => d.date);
    return {
      min: dates.reduce((a, b) => (a < b ? a : b), dates[0]),
      max: dates.reduce((a, b) => (a > b ? a : b), dates[0]),
    };
  }, [dashboardData?.jobCardsByDate]);

  const minDate = dateRange.min ? new Date(dateRange.min) : undefined;
  const maxDate = dateRange.max ? new Date(dateRange.max) : undefined;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-ad-app-bg py-4 md:py-5">
      <PageMeta title="Reports | AutoDaddy Admin" description="Admin reports and analytics" />

      <h1 className="mb-4 text-xl font-bold text-ad-green md:text-2xl">Reports</h1>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
        </div>
      ) : error ? (
        <div className="rounded border border-red-300 bg-red-100 p-4 text-red-700">{error}</div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
            {statCardConfig.map((card) => (
              <div
                key={card.label}
                className={`rounded-xl border-l-4 bg-white p-5 shadow-sm ${card.color}`}
              >
                <h3 className="mb-2 text-xs font-bold text-gray-600">{card.label}</h3>
                <div className="text-2xl font-bold text-gray-800">
                  {card.getValue(dashboardData)}
                </div>
              </div>
            ))}
          </div>

          <div
            className={
              chartDaysDifference > 7
                ? "mb-8 grid grid-cols-1 gap-6"
                : "mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2"
            }
          >
            <div
              className={
                chartDaysDifference > 7
                  ? "col-span-1 w-full rounded-xl border bg-white p-5 shadow"
                  : "col-span-1 rounded-xl border bg-white p-5 shadow"
              }
            >
              <h2 className="mb-1 text-lg font-semibold">Job Cards Created by Date</h2>
              <p className="mb-3 text-xs text-gray-500">
                Daily total of new job cards created
              </p>

              <div className="mb-5 flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1">
                  <span className="mr-2 text-xs font-semibold text-gray-700">From:</span>
                  <DatePicker
                    selected={fromDateObj}
                    onChange={(date: Date | null) => setFromDateObj(date)}
                    selectsStart
                    startDate={fromDateObj}
                    endDate={toDateObj}
                    minDate={minDate}
                    maxDate={toDateObj || maxDate}
                    dateFormat="yyyy-MM-dd"
                    className="rounded border px-2 py-1 text-sm"
                    placeholderText="Select start date"
                    isClearable={false}
                  />
                </label>
                <label className="flex items-center gap-1">
                  <span className="mr-2 text-xs font-semibold text-gray-700">To:</span>
                  <DatePicker
                    selected={toDateObj}
                    onChange={(date: Date | null) => setToDateObj(date)}
                    selectsEnd
                    startDate={fromDateObj}
                    endDate={toDateObj}
                    minDate={fromDateObj || minDate}
                    maxDate={maxDate}
                    dateFormat="yyyy-MM-dd"
                    className="rounded border px-2 py-1 text-sm"
                    placeholderText="Select end date"
                    isClearable={false}
                  />
                </label>
                {(fromDate || toDate) && (
                  <button
                    type="button"
                    className="ml-2 text-xs text-blue-500 underline"
                    onClick={() => {
                      setFromDate(dateRange.min ?? null);
                      setToDate(dateRange.max ?? null);
                      setFromDateObj(minDate || null);
                      setToDateObj(maxDate || null);
                    }}
                  >
                    Reset
                  </button>
                )}
                <span className="ml-3 text-xs text-gray-500">
                  {chartDaysDifference > 1 ? `(${chartDaysDifference + 1} days)` : ""}
                </span>
              </div>

              <div className={chartDaysDifference > 7 ? "h-96 w-full" : "h-72 w-full"}>
                {jobCardByDateChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={jobCardByDateChartData}
                      margin={{ top: 8, right: 16, left: 16, bottom: 20 }}
                      barGap={2}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        angle={chartDaysDifference > 10 ? -35 : 0}
                        textAnchor={chartDaysDifference > 10 ? "end" : "middle"}
                        interval={
                          chartDaysDifference > 20
                            ? Math.floor(chartDaysDifference / 14)
                            : 0
                        }
                        tickFormatter={(date) => {
                          if (!date) return "";
                          const parts = date.split("-");
                          if (parts.length === 3) return `${parts[1]}-${parts[2]}`;
                          return date;
                        }}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => value}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Bar dataKey="count" fill="#38bdf8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    No job card data for the selected date range.
                  </div>
                )}
              </div>
            </div>

            {chartDaysDifference <= 7 && (
              <div className="col-span-1 flex flex-col justify-between rounded-xl border bg-white p-5 shadow">
                <h2 className="mb-4 text-lg font-semibold">Quick Stats</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                    <span>Total Car Owners</span>
                    <span className="font-bold text-green-600">
                      {dashboardData?.carOwnersCount ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                    <span>Total Auto Shop Owners</span>
                    <span className="font-bold text-blue-600">
                      {dashboardData?.autoShopOwnersCount ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-purple-50 p-3">
                    <span>Total Job Cards</span>
                    <span className="font-bold text-purple-600">
                      {dashboardData?.jobCardsCount ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-3">
                    <span>Total Deals</span>
                    <span className="font-bold text-yellow-600">
                      {dashboardData?.dealsCount ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                    <span>Services</span>
                    <span className="font-bold text-blue-600">
                      {dashboardData?.servicesCount ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-purple-50 p-3">
                    <span>SubServices</span>
                    <span className="font-bold text-purple-600">
                      {dashboardData?.subServicesCount ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-white p-5 shadow">
            <h2 className="mb-4 text-lg font-semibold">System Alerts</h2>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              All data shown is a count of system entities.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
