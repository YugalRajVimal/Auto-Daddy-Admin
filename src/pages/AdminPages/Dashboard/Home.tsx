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

// Shape of API dashboard data returned from /api/admin/dashboard
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
  thoughtOfTheDay?: string;
  thoughtOfTheDayLike?: number;
}

const API_URL = import.meta.env.VITE_API_URL;

const statCardConfig = [
  {
    label: "Total Car Owners",
    color: "border-green-400",
    getValue: (d: AdminDashboardAPI | null) =>
      d ? d.carOwnersCount : "--",
  },
  {
    label: "Total Auto Shop Owners",
    color: "border-blue-400",
    getValue: (d: AdminDashboardAPI | null) =>
      d ? d.autoShopOwnersCount : "--",
  },
  {
    label: "Total Job Cards",
    color: "border-purple-400",
    getValue: (d: AdminDashboardAPI | null) =>
      d ? d.jobCardsCount : "--",
  },
  {
    label: "Total Deals",
    color: "border-yellow-400",
    getValue: (d: AdminDashboardAPI | null) =>
      d ? d.dealsCount : "--",
  },
];

// Utility for date
function formatDateForInput(date: Date) {
  // returns yyyy-MM-dd for <input type="date" />
  return date.toISOString().split("T")[0];
}
function daysBetween(from: string, to: string) {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function AdminDashboardHome() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date filter for bar chart
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);

  // Calendar-friendly date state
  const [fromDateObj, setFromDateObj] = useState<Date | null>(null);
  const [toDateObj, setToDateObj] = useState<Date | null>(null);

  // Set initial date filter from data after fetch
  useEffect(() => {
    if (dashboardData?.jobCardsByDate && dashboardData.jobCardsByDate.length > 0) {
      const allDates = dashboardData.jobCardsByDate.map((item) => item.date);
      const sortedDates = [...allDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      setFromDate(sortedDates[0]);
      setToDate(sortedDates[sortedDates.length - 1]);
      setFromDateObj(new Date(sortedDates[0]));
      setToDateObj(new Date(sortedDates[sortedDates.length - 1]));
    }
  }, [dashboardData?.jobCardsByDate]);

  // Keep fromDate/<-Obj in sync both ways
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

  // Prepare chart data based on date filters
  const jobCardByDateChartData: { date: string; count: number }[] = useMemo(() => {
    if (!dashboardData?.jobCardsByDate) return [];
    let filtered = dashboardData.jobCardsByDate;
    if (fromDate && toDate) {
      filtered = filtered.filter(({ date }) =>
        date >= fromDate && date <= toDate
      );
    }
    return filtered.map((item) => ({
      date: item.date,
      count: item.count
    }));
  }, [dashboardData?.jobCardsByDate, fromDate, toDate]);

  // Days range for chart width logic
  const chartDaysDifference =
    fromDate && toDate ? daysBetween(fromDate, toDate) : 0;

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url =
      (API_URL ? API_URL.replace(/\/+$/, "") : "") +
      "/api/admin/dashboard";
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
          console.log(json.data);
          // Don't set date filters here, will set after data changes
        } else {
          throw new Error(json.message || "Invalid dashboard response");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // For date input min/max
  const dateRange = useMemo(() => {
    if (!dashboardData?.jobCardsByDate || !dashboardData.jobCardsByDate.length)
      return { min: undefined, max: undefined };
    const dates = dashboardData.jobCardsByDate.map((d) => d.date);
    return {
      min: dates.reduce((a, b) => (a < b ? a : b), dates[0]),
      max: dates.reduce((a, b) => (a > b ? a : b), dates[0]),
    };
  }, [dashboardData?.jobCardsByDate]);

  // Calendar date limiters for the pickers
  const minDate = dateRange.min ? new Date(dateRange.min) : undefined;
  const maxDate = dateRange.max ? new Date(dateRange.max) : undefined;

  // Add these: ref and effect to handle scrollable dashboard on window resize or small screens
  // We'll just use tailwind/utility classes for a scrollable dashboard container filling viewport, and mobile-responsiveness.

  return (
    <div className="h-[85vh] flex flex-col ">
      <PageMeta
        title="Auto Daddy"
        description="Admin and Sub-Admin Panel for Auto Daddy"
      />
      {/* Make the page content fill max screen height and be scrollable if needed */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="w-10 h-10 border-4 border-t-brand-500 border-gray-200 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded-md mb-6">
            {error}
          </div>
        ) : (
          <>
            {/* Thought of the Day Section */}
            {dashboardData?.thoughtOfTheDay && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow p-5 mb-8 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-base text-blue-800 mb-1">Thought of the Day</div>
                  <div className="italic text-gray-800 text-lg">{dashboardData.thoughtOfTheDay}</div>
                </div>
                <div className="flex items-center ml-6">
                  <button
                    disabled
                    className="flex items-center px-3 py-1 bg-white border border-gray-200 text-blue-600 rounded-full shadow text-sm font-medium cursor-default"
                    style={{ pointerEvents: "none" }}
                  >
                    <svg
                      className="w-5 h-5 mr-1 fill-blue-500"
                      viewBox="0 0 20 20"
                    >
                      <path d="M3.172 10.172a4 4 0 015.656-5.656L10 5.687l1.172-1.171a4 4 0 115.656 5.656l-1.171 1.172L10 18l-5.657-7.828z"/>
                    </svg>
                    {dashboardData.thoughtOfTheDayLike ?? 0}
                  </button>
                </div>
              </div>
            )}

            {/* Stat Cards: summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
              {statCardConfig.map((card, i) => (
                <div
                  key={i}
                  className={`bg-white rounded-xl border-l-4 ${card.color} p-5 shadow-sm`}
                >
                  <h3 className="text-xs font-bold text-gray-600 mb-2">
                    {card.label}
                  </h3>

                  <div className="text-2xl font-bold text-gray-800">
                    {card.getValue(dashboardData)}
                  </div>
                </div>
              ))}
            </div>

            {/* Chart: Job Cards by Date, responsive for date span */}
            <div
              className={
                chartDaysDifference > 7
                  ? "grid grid-cols-1 gap-6 mb-8"
                  : "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
              }
            >
              <div
                className={
                  chartDaysDifference > 7
                    ? "bg-white rounded-xl border shadow p-5 col-span-1 w-full"
                    : "bg-white rounded-xl border shadow p-5 col-span-1"
                }
                style={
                  chartDaysDifference > 7
                    ? { minWidth: "0", width: "100%" }
                    : undefined
                }
              >
                <h2 className="font-semibold text-lg mb-1">
                  Job Cards Created by Date
                </h2>
                <p className="text-xs text-gray-500 mb-3">
                  Daily total of new job cards created
                </p>

                {/* Date Filter Controls */}
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <label className="flex items-center gap-1">
                    <span className="text-xs text-gray-700 mr-2 font-semibold">
                      From:
                    </span>
                    <DatePicker
                      selected={fromDateObj}
                      onChange={(date: Date | null) => setFromDateObj(date)}
                      selectsStart
                      startDate={fromDateObj}
                      endDate={toDateObj}
                      minDate={minDate}
                      maxDate={toDateObj || maxDate}
                      dateFormat="yyyy-MM-dd"
                      className="border rounded px-2 py-1 text-sm"
                      placeholderText="Select start date"
                      isClearable={false}
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    <span className="text-xs text-gray-700 mr-2 font-semibold">
                      To:
                    </span>
                    <DatePicker
                      selected={toDateObj}
                      onChange={(date: Date | null) => setToDateObj(date)}
                      selectsEnd
                      startDate={fromDateObj}
                      endDate={toDateObj}
                      minDate={fromDateObj || minDate}
                      maxDate={maxDate}
                      dateFormat="yyyy-MM-dd"
                      className="border rounded px-2 py-1 text-sm"
                      placeholderText="Select end date"
                      isClearable={false}
                    />
                  </label>
                  {(fromDate || toDate) && (
                    <button
                      type="button"
                      className="ml-2 text-blue-500 underline text-xs"
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
                  <span className="text-xs text-gray-500 ml-3">
                    {chartDaysDifference > 1 ? `(${chartDaysDifference + 1} days)` : ""}
                  </span>
                </div>

                <div
                  className={
                    chartDaysDifference > 7
                      ? "h-96 w-full"
                      : "h-72 w-full"
                  }
                >
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
                        interval={chartDaysDifference > 20 ? Math.floor(chartDaysDifference / 14) : 0}
                        tickFormatter={(date) => {
                          // Show MM-DD for brevity if date input is YYYY-MM-DD
                          if (!date) return "";
                          const parts = date.split("-");
                          if (parts.length === 3) {
                            return `${parts[1]}-${parts[2]}`;
                          }
                          return date;
                        }}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any) => value}
                        labelFormatter={(label: any) => `Date: ${label}`}
                      />
                      <Bar dataKey="count" fill="#38bdf8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Only show Quick Stats in right side if small range (<8 days). If large, chart is full-width */}
              {chartDaysDifference <= 7 && (
                <div className="bg-white rounded-xl border shadow p-5 col-span-1 flex flex-col justify-between">
                  <h2 className="font-semibold text-lg mb-4">Quick Stats</h2>
                  <div className="space-y-4">
                    {/* Top 4 cards details */}
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span>Total Car Owners</span>
                      <span className="font-bold text-green-600">
                        {dashboardData?.carOwnersCount ?? "--"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span>Total Auto Shop Owners</span>
                      <span className="font-bold text-blue-600">
                        {dashboardData?.autoShopOwnersCount ?? "--"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span>Total Job Cards</span>
                      <span className="font-bold text-purple-600">
                        {dashboardData?.jobCardsCount ?? "--"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span>Total Deals</span>
                      <span className="font-bold text-yellow-600">
                        {dashboardData?.dealsCount ?? "--"}
                      </span>
                    </div>
                    {/* Existing service details */}
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span>Services</span>
                      <span className="font-bold text-blue-600">
                        {dashboardData?.servicesCount ?? "--"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span>SubServices</span>
                      <span className="font-bold text-purple-600">
                        {dashboardData?.subServicesCount ?? "--"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* System Alerts Section */}
            <div className="bg-white rounded-xl border shadow p-5 mt-8">
              <h2 className="font-semibold text-lg mb-4">System Alerts</h2>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  All data shown is a count of system entities.
                </div>
                {/* Optionally (in future): highlight any metrics that are unusually low/high */}
                {/* Example: */}
                {/* 
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  ⚠ Number of deals is below 10. Consider adding more offers.
                </div>
                */}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
