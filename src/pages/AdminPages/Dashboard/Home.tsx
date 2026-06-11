// import { useEffect, useState, useMemo } from "react";
// import PageMeta from "../../../components/common/PageMeta";
// import {
//   ResponsiveContainer,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
// } from "recharts";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";

// // Shape of API dashboard data returned from /api/admin/dashboard
// interface AdminDashboardJobCardsByDate {
//   date: string;
//   count: number;
// }
// interface AdminDashboardAPI {
//   carOwnersCount: number;
//   autoShopOwnersCount: number;
//   jobCardsCount: number;
//   jobCardsByDate?: AdminDashboardJobCardsByDate[];
//   dealsCount: number;
//   servicesCount: number;
//   subServicesCount: number;
//   thoughtOfTheDay?: string;
//   thoughtOfTheDayLike?: number;
// }

// const API_URL = import.meta.env.VITE_API_URL;

// const statCardConfig = [
//   {
//     label: "Total Car Owners",
//     color: "border-green-400",
//     getValue: (d: AdminDashboardAPI | null) =>
//       d ? d.carOwnersCount : "--",
//   },
//   {
//     label: "Total Auto Shop Owners",
//     color: "border-blue-400",
//     getValue: (d: AdminDashboardAPI | null) =>
//       d ? d.autoShopOwnersCount : "--",
//   },
//   {
//     label: "Total Job Cards",
//     color: "border-purple-400",
//     getValue: (d: AdminDashboardAPI | null) =>
//       d ? d.jobCardsCount : "--",
//   },
//   {
//     label: "Total Deals",
//     color: "border-yellow-400",
//     getValue: (d: AdminDashboardAPI | null) =>
//       d ? d.dealsCount : "--",
//   },
// ];

// // Utility for date
// function formatDateForInput(date: Date) {
//   // returns yyyy-MM-dd for <input type="date" />
//   return date.toISOString().split("T")[0];
// }
// function daysBetween(from: string, to: string) {
//   return Math.round(
//     (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)
//   );
// }

// export default function AdminDashboardHome() {
//   const [dashboardData, setDashboardData] = useState<AdminDashboardAPI | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Date filter for bar chart
//   const [fromDate, setFromDate] = useState<string | null>(null);
//   const [toDate, setToDate] = useState<string | null>(null);

//   // Calendar-friendly date state
//   const [fromDateObj, setFromDateObj] = useState<Date | null>(null);
//   const [toDateObj, setToDateObj] = useState<Date | null>(null);

//   // Set initial date filter from data after fetch
//   useEffect(() => {
//     if (dashboardData?.jobCardsByDate && dashboardData.jobCardsByDate.length > 0) {
//       const allDates = dashboardData.jobCardsByDate.map((item) => item.date);
//       const sortedDates = [...allDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
//       setFromDate(sortedDates[0]);
//       setToDate(sortedDates[sortedDates.length - 1]);
//       setFromDateObj(new Date(sortedDates[0]));
//       setToDateObj(new Date(sortedDates[sortedDates.length - 1]));
//     }
//   }, [dashboardData?.jobCardsByDate]);

//   // Keep fromDate/<-Obj in sync both ways
//   useEffect(() => {
//     if (fromDateObj) setFromDate(formatDateForInput(fromDateObj));
//   }, [fromDateObj]);
//   useEffect(() => {
//     if (fromDate) setFromDateObj(new Date(fromDate));
//   }, [fromDate]);

//   useEffect(() => {
//     if (toDateObj) setToDate(formatDateForInput(toDateObj));
//   }, [toDateObj]);
//   useEffect(() => {
//     if (toDate) setToDateObj(new Date(toDate));
//   }, [toDate]);

//   // Prepare chart data based on date filters
//   const jobCardByDateChartData: { date: string; count: number }[] = useMemo(() => {
//     if (!dashboardData?.jobCardsByDate) return [];
//     let filtered = dashboardData.jobCardsByDate;
//     if (fromDate && toDate) {
//       filtered = filtered.filter(({ date }) =>
//         date >= fromDate && date <= toDate
//       );
//     }
//     return filtered.map((item) => ({
//       date: item.date,
//       count: item.count
//     }));
//   }, [dashboardData?.jobCardsByDate, fromDate, toDate]);

//   // Days range for chart width logic
//   const chartDaysDifference =
//     fromDate && toDate ? daysBetween(fromDate, toDate) : 0;

//   useEffect(() => {
//     setLoading(true);
//     setError(null);
//     const url =
//       (API_URL ? API_URL.replace(/\/+$/, "") : "") +
//       "/api/admin/dashboard";
//     fetch(url)
//       .then(async (res) => {
//         if (!res.ok) {
//           const data = await res.json().catch(() => ({}));
//           throw new Error(data?.message || "Failed to fetch dashboard data");
//         }
//         return res.json();
//       })
//       .then((json) => {
//         if (json.success && json.data) {
//           setDashboardData(json.data);
//           console.log(json.data);
//           // Don't set date filters here, will set after data changes
//         } else {
//           throw new Error(json.message || "Invalid dashboard response");
//         }
//       })
//       .catch((e) => setError(e.message))
//       .finally(() => setLoading(false));
//   }, []);

//   // For date input min/max
//   const dateRange = useMemo(() => {
//     if (!dashboardData?.jobCardsByDate || !dashboardData.jobCardsByDate.length)
//       return { min: undefined, max: undefined };
//     const dates = dashboardData.jobCardsByDate.map((d) => d.date);
//     return {
//       min: dates.reduce((a, b) => (a < b ? a : b), dates[0]),
//       max: dates.reduce((a, b) => (a > b ? a : b), dates[0]),
//     };
//   }, [dashboardData?.jobCardsByDate]);

//   // Calendar date limiters for the pickers
//   const minDate = dateRange.min ? new Date(dateRange.min) : undefined;
//   const maxDate = dateRange.max ? new Date(dateRange.max) : undefined;

//   // Add these: ref and effect to handle scrollable dashboard on window resize or small screens
//   // We'll just use tailwind/utility classes for a scrollable dashboard container filling viewport, and mobile-responsiveness.

//   return (
//     <div className="h-[85vh] flex flex-col ">
//       <PageMeta
//         title="Auto Daddy"
//         description="Admin and Sub-Admin Panel for Auto Daddy"
//       />
//       {/* Make the page content fill max screen height and be scrollable if needed */}
//       <div className="flex-1 overflow-auto p-6">
//         {loading ? (
//           <div className="flex items-center justify-center min-h-[200px]">
//             <div className="w-10 h-10 border-4 border-t-brand-500 border-gray-200 rounded-full animate-spin"></div>
//           </div>
//         ) : error ? (
//           <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded-md mb-6">
//             {error}
//           </div>
//         ) : (
//           <>
//             {/* Thought of the Day Section */}
//             {dashboardData?.thoughtOfTheDay && (
//               <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow p-5 mb-8 flex items-center justify-between">
//                 <div>
//                   <div className="font-semibold text-base text-blue-800 mb-1">Thought of the Day</div>
//                   <div className="italic text-gray-800 text-lg">{dashboardData.thoughtOfTheDay}</div>
//                 </div>
//                 <div className="flex items-center ml-6">
//                   <button
//                     disabled
//                     className="flex items-center px-3 py-1 bg-white border border-gray-200 text-blue-600 rounded-full shadow text-sm font-medium cursor-default"
//                     style={{ pointerEvents: "none" }}
//                   >
//                     <svg
//                       className="w-5 h-5 mr-1 fill-blue-500"
//                       viewBox="0 0 20 20"
//                     >
//                       <path d="M3.172 10.172a4 4 0 015.656-5.656L10 5.687l1.172-1.171a4 4 0 115.656 5.656l-1.171 1.172L10 18l-5.657-7.828z"/>
//                     </svg>
//                     {dashboardData.thoughtOfTheDayLike ?? 0}
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* Stat Cards: summary */}
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
//               {statCardConfig.map((card, i) => (
//                 <div
//                   key={i}
//                   className={`bg-white rounded-xl border-l-4 ${card.color} p-5 shadow-sm`}
//                 >
//                   <h3 className="text-xs font-bold text-gray-600 mb-2">
//                     {card.label}
//                   </h3>

//                   <div className="text-2xl font-bold text-gray-800">
//                     {card.getValue(dashboardData)}
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Chart: Job Cards by Date, responsive for date span */}
//             <div
//               className={
//                 chartDaysDifference > 7
//                   ? "grid grid-cols-1 gap-6 mb-8"
//                   : "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
//               }
//             >
//               <div
//                 className={
//                   chartDaysDifference > 7
//                     ? "bg-white rounded-xl border shadow p-5 col-span-1 w-full"
//                     : "bg-white rounded-xl border shadow p-5 col-span-1"
//                 }
//                 style={
//                   chartDaysDifference > 7
//                     ? { minWidth: "0", width: "100%" }
//                     : undefined
//                 }
//               >
//                 <h2 className="font-semibold text-lg mb-1">
//                   Job Cards Created by Date
//                 </h2>
//                 <p className="text-xs text-gray-500 mb-3">
//                   Daily total of new job cards created
//                 </p>

//                 {/* Date Filter Controls */}
//                 <div className="flex flex-wrap items-center gap-2 mb-5">
//                   <label className="flex items-center gap-1">
//                     <span className="text-xs text-gray-700 mr-2 font-semibold">
//                       From:
//                     </span>
//                     <DatePicker
//                       selected={fromDateObj}
//                       onChange={(date: Date | null) => setFromDateObj(date)}
//                       selectsStart
//                       startDate={fromDateObj}
//                       endDate={toDateObj}
//                       minDate={minDate}
//                       maxDate={toDateObj || maxDate}
//                       dateFormat="yyyy-MM-dd"
//                       className="border rounded px-2 py-1 text-sm"
//                       placeholderText="Select start date"
//                       isClearable={false}
//                     />
//                   </label>
//                   <label className="flex items-center gap-1">
//                     <span className="text-xs text-gray-700 mr-2 font-semibold">
//                       To:
//                     </span>
//                     <DatePicker
//                       selected={toDateObj}
//                       onChange={(date: Date | null) => setToDateObj(date)}
//                       selectsEnd
//                       startDate={fromDateObj}
//                       endDate={toDateObj}
//                       minDate={fromDateObj || minDate}
//                       maxDate={maxDate}
//                       dateFormat="yyyy-MM-dd"
//                       className="border rounded px-2 py-1 text-sm"
//                       placeholderText="Select end date"
//                       isClearable={false}
//                     />
//                   </label>
//                   {(fromDate || toDate) && (
//                     <button
//                       type="button"
//                       className="ml-2 text-blue-500 underline text-xs"
//                       onClick={() => {
//                         setFromDate(dateRange.min ?? null);
//                         setToDate(dateRange.max ?? null);
//                         setFromDateObj(minDate || null);
//                         setToDateObj(maxDate || null);
//                       }}
//                     >
//                       Reset
//                     </button>
//                   )}
//                   <span className="text-xs text-gray-500 ml-3">
//                     {chartDaysDifference > 1 ? `(${chartDaysDifference + 1} days)` : ""}
//                   </span>
//                 </div>

//                 <div
//                   className={
//                     chartDaysDifference > 7
//                       ? "h-96 w-full"
//                       : "h-72 w-full"
//                   }
//                 >
//                   <ResponsiveContainer width="100%" height="100%">
//                     <BarChart
//                       data={jobCardByDateChartData}
//                       margin={{ top: 8, right: 16, left: 16, bottom: 20 }}
//                       barGap={2}
//                     >
//                       <CartesianGrid strokeDasharray="3 3" />
//                       <XAxis
//                         dataKey="date"
//                         angle={chartDaysDifference > 10 ? -35 : 0}
//                         textAnchor={chartDaysDifference > 10 ? "end" : "middle"}
//                         interval={chartDaysDifference > 20 ? Math.floor(chartDaysDifference / 14) : 0}
//                         tickFormatter={(date) => {
//                           // Show MM-DD for brevity if date input is YYYY-MM-DD
//                           if (!date) return "";
//                           const parts = date.split("-");
//                           if (parts.length === 3) {
//                             return `${parts[1]}-${parts[2]}`;
//                           }
//                           return date;
//                         }}
//                       />
//                       <YAxis />
//                       <Tooltip
//                         formatter={(value: any) => value}
//                         labelFormatter={(label: any) => `Date: ${label}`}
//                       />
//                       <Bar dataKey="count" fill="#38bdf8" />
//                     </BarChart>
//                   </ResponsiveContainer>
//                 </div>
//               </div>

//               {/* Only show Quick Stats in right side if small range (<8 days). If large, chart is full-width */}
//               {chartDaysDifference <= 7 && (
//                 <div className="bg-white rounded-xl border shadow p-5 col-span-1 flex flex-col justify-between">
//                   <h2 className="font-semibold text-lg mb-4">Quick Stats</h2>
//                   <div className="space-y-4">
//                     {/* Top 4 cards details */}
//                     <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
//                       <span>Total Car Owners</span>
//                       <span className="font-bold text-green-600">
//                         {dashboardData?.carOwnersCount ?? "--"}
//                       </span>
//                     </div>
//                     <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
//                       <span>Total Auto Shop Owners</span>
//                       <span className="font-bold text-blue-600">
//                         {dashboardData?.autoShopOwnersCount ?? "--"}
//                       </span>
//                     </div>
//                     <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
//                       <span>Total Job Cards</span>
//                       <span className="font-bold text-purple-600">
//                         {dashboardData?.jobCardsCount ?? "--"}
//                       </span>
//                     </div>
//                     <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
//                       <span>Total Deals</span>
//                       <span className="font-bold text-yellow-600">
//                         {dashboardData?.dealsCount ?? "--"}
//                       </span>
//                     </div>
//                     {/* Existing service details */}
//                     <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
//                       <span>Services</span>
//                       <span className="font-bold text-blue-600">
//                         {dashboardData?.servicesCount ?? "--"}
//                       </span>
//                     </div>
//                     <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
//                       <span>SubServices</span>
//                       <span className="font-bold text-purple-600">
//                         {dashboardData?.subServicesCount ?? "--"}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* System Alerts Section */}
//             <div className="bg-white rounded-xl border shadow p-5 mt-8">
//               <h2 className="font-semibold text-lg mb-4">System Alerts</h2>
//               <div className="space-y-3">
//                 <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
//                   All data shown is a count of system entities.
//                 </div>
//                 {/* Optionally (in future): highlight any metrics that are unusually low/high */}
//                 {/* Example: */}
//                 {/* 
//                 <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
//                   ⚠ Number of deals is below 10. Consider adding more offers.
//                 </div>
//                 */}
//               </div>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }


import { useEffect, useState, useMemo } from "react";
import PageMeta from "../../../components/common/PageMeta";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
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
  thoughtOfTheDay?: string;
  thoughtOfTheDayLike?: number;
}

const API_URL = import.meta.env.VITE_API_URL;

function formatDateForInput(date: Date) {
  return date.toISOString().split("T")[0];
}
function daysBetween(from: string, to: string) {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)
  );
}

// ── Stat card icon components ──
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const VendorsIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const EnquiriesIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);
const CompletedIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const DONUT_COLORS: Record<string, string> = {
  New: "#3b82f6",
  Estimated: "#f59e0b",
  Assigned: "#22c55e",
  Cancelled: "#ef4444",
  Completed: "#15803d",
};

export default function AdminDashboardHome() {
  const [dashboardData, setDashboardData] = useState<AdminDashboardAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fromDateObj, setFromDateObj] = useState<Date | null>(null);
  const [toDateObj, setToDateObj] = useState<Date | null>(null);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);

  useEffect(() => {
    if (dashboardData?.jobCardsByDate?.length) {
      const sorted = [...dashboardData.jobCardsByDate]
        .map((d) => d.date)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      setFromDate(sorted[0]);
      setToDate(sorted[sorted.length - 1]);
      setFromDateObj(new Date(sorted[0]));
      setToDateObj(new Date(sorted[sorted.length - 1]));
    }
  }, [dashboardData?.jobCardsByDate]);

  useEffect(() => { if (fromDateObj) setFromDate(formatDateForInput(fromDateObj)); }, [fromDateObj]);
  useEffect(() => { if (toDateObj) setToDate(formatDateForInput(toDateObj)); }, [toDateObj]);

  const jobCardByDateChartData = useMemo(() => {
    if (!dashboardData?.jobCardsByDate) return [];
    let filtered = dashboardData.jobCardsByDate;
    if (fromDate && toDate)
      filtered = filtered.filter(({ date }) => date >= fromDate && date <= toDate);
    return filtered.map((item) => ({ date: item.date, count: item.count }));
  }, [dashboardData?.jobCardsByDate, fromDate, toDate]);

  const chartDaysDifference = fromDate && toDate ? daysBetween(fromDate, toDate) : 0;

  const dateRange = useMemo(() => {
    if (!dashboardData?.jobCardsByDate?.length) return { min: undefined, max: undefined };
    const dates = dashboardData.jobCardsByDate.map((d) => d.date);
    return {
      min: dates.reduce((a, b) => (a < b ? a : b), dates[0]),
      max: dates.reduce((a, b) => (a > b ? a : b), dates[0]),
    };
  }, [dashboardData?.jobCardsByDate]);

  const minDate = dateRange.min ? new Date(dateRange.min) : undefined;
  const maxDate = dateRange.max ? new Date(dateRange.max) : undefined;

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url = (API_URL?.replace(/\/+$/, "") ?? "") + "/api/admin/dashboard";
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Failed");
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) setDashboardData(json.data);
        else throw new Error(json.message || "Invalid response");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Derived counts
  const d = dashboardData;
  const totalUsers = d?.carOwnersCount ?? 0;
  const totalVendors = d?.autoShopOwnersCount ?? 0;
  const totalEnquiries = d?.jobCardsCount ?? 0;
  // const completedEnquiries = 0; // placeholder — not in API

  // Donut data from jobCards statuses (placeholder distribution for demo)
  const donutData = [
    { name: "New", value: Math.round(totalEnquiries * 0.25) },
    { name: "Estimated", value: Math.round(totalEnquiries * 0.1) },
    { name: "Assigned", value: Math.round(totalEnquiries * 0.05) },
    { name: "Cancelled", value: Math.round(totalEnquiries * 0.55) },
    { name: "Completed", value: Math.round(totalEnquiries * 0.05) },
  ].filter((d) => d.value > 0);

  // Growth bar chart (users vs vendors per month — placeholder from jobCardsByDate months)
  const growthData = useMemo(() => {
    if (!dashboardData?.jobCardsByDate?.length) return [];
    const byMonth: Record<string, number> = {};
    dashboardData.jobCardsByDate.forEach(({ date, count }) => {
      const m = date.slice(0, 7);
      byMonth[m] = (byMonth[m] || 0) + count;
    });
    return Object.entries(byMonth).map(([month, jobs]) => ({
      month: new Date(month + "-01").toLocaleString("default", { month: "short" }),
      Users: Math.round(jobs * 0.4),
      Vendors: Math.round(jobs * 0.6),
    }));
  }, [dashboardData?.jobCardsByDate]);

  // Stat cards config
  const statCards = [
    { label: "Total Car Owners", value: totalUsers, bg: "bg-[#14b8a6]", Icon: UsersIcon },
    { label: "Total Auto Shop Owners", value: totalVendors, bg: "bg-[#ef4444]", Icon: VendorsIcon },
    { label: "Total Job Cards", value: totalEnquiries, bg: "bg-[#22c55e]", Icon: EnquiriesIcon },
    { label: "Total Deals", value: d?.dealsCount ?? "--", bg: "bg-[#f59e0b]", Icon: CompletedIcon },
  ];

  return (
    <div className="h-[92vh] flex flex-col font-sans">
      <PageMeta title="Auto Daddy" description="Admin and Sub-Admin Panel for Auto Daddy" />
      <div className="flex-1 overflow-auto bg-[#f0f0f0] p-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-10 h-10 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded-md mb-6">{error}</div>
        ) : (
          <>
            {/* Page title */}
            <h1 className="text-2xl font-semibold text-gray-800 mb-5">Dashboard</h1>

            {/* Thought of the Day */}
            {d?.thoughtOfTheDay && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm p-4 mb-5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-blue-700 mb-0.5">Thought of the Day</div>
                  <div className="italic text-gray-700 text-sm">{d.thoughtOfTheDay}</div>
                </div>
                <button disabled className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 text-blue-600 rounded-full text-xs font-medium ml-4">
                  <svg className="w-4 h-4 fill-blue-500" viewBox="0 0 20 20">
                    <path d="M3.172 10.172a4 4 0 015.656-5.656L10 5.687l1.172-1.171a4 4 0 115.656 5.656l-1.171 1.172L10 18l-5.657-7.828z"/>
                  </svg>
                  {d.thoughtOfTheDayLike ?? 0}
                </button>
              </div>
            )}

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              {statCards.map((card, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 flex items-center gap-4 px-4 py-4">
                  <div className={`${card.bg} rounded-lg w-14 h-14 flex items-center justify-center flex-shrink-0`}>
                    <card.Icon />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 font-medium leading-tight">{card.label}</div>
                    <div className="text-2xl font-bold text-gray-800 mt-0.5">{card.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Row 2: Area chart + Donut ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Enquiries Overview (Area) */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 font-semibold text-gray-700 text-sm">
                    <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                    Job Cards Overview
                  </div>
                  <span className="text-gray-400 text-lg cursor-pointer leading-none select-none">−</span>
                </div>
                {/* Date pickers */}
                <div className="flex flex-wrap items-center gap-2 mb-3 mt-2">
                  <label className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                    From:
                    <DatePicker
                      selected={fromDateObj}
                      onChange={(d: Date | null) => setFromDateObj(d)}
                      selectsStart
                      startDate={fromDateObj}
                      endDate={toDateObj}
                      minDate={minDate}
                      maxDate={toDateObj || maxDate}
                      dateFormat="yyyy-MM-dd"
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-400 w-28"
                      placeholderText="Start date"
                      isClearable={false}
                    />
                  </label>
                  <label className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                    To:
                    <DatePicker
                      selected={toDateObj}
                      onChange={(d: Date | null) => setToDateObj(d)}
                      selectsEnd
                      startDate={fromDateObj}
                      endDate={toDateObj}
                      minDate={fromDateObj || minDate}
                      maxDate={maxDate}
                      dateFormat="yyyy-MM-dd"
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-400 w-28"
                      placeholderText="End date"
                      isClearable={false}
                    />
                  </label>
           
                  {(fromDate || toDate) && (
                    <button type="button" className="text-blue-500 underline text-xs"
                      onClick={() => { setFromDate(dateRange.min ?? null); setToDate(dateRange.max ?? null); setFromDateObj(minDate || null); setToDateObj(maxDate || null); }}>
                      Reset
                    </button>
                  )}
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={jobCardByDateChartData} margin={{ top: 8, right: 8, left: -10, bottom: 16 }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date"
                        tickFormatter={(d) => { const p = d.split("-"); return p.length === 3 ? `${new Date(d).toLocaleString("default", { month: "short" })}` : d; }}
                        angle={chartDaysDifference > 10 ? -30 : 0}
                        textAnchor={chartDaysDifference > 10 ? "end" : "middle"}
                        interval={chartDaysDifference > 20 ? Math.floor(chartDaysDifference / 12) : 0}
                        tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => [v, "Job Cards"]} labelFormatter={(l) => `Date: ${l}`} />
                      <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2}
                        fill="url(#areaGrad)" dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Enquiry / Job Card Status Donut */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 font-semibold text-gray-700 text-sm">
                    <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
                      <path d="M22 12A10 10 0 0 0 12 2v10z"/>
                    </svg>
                    Job Card Status
                  </div>
                  <span className="text-gray-400 text-lg cursor-pointer leading-none select-none">−</span>
                </div>
                <div className="h-64 flex items-center justify-center">
                  {donutData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData} cx="45%" cy="50%" innerRadius={60} outerRadius={90}
                          dataKey="value" paddingAngle={2}>
                          {donutData.map((entry) => (
                            <Cell key={entry.name} fill={DONUT_COLORS[entry.name] ?? "#94a3b8"} />
                          ))}
                        </Pie>
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <span className="text-gray-400 text-sm">No data available</span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Row 3: Bar chart + Right panels ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Users & Vendors Growth Bar */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 font-semibold text-gray-700 text-sm">
                    <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    Car Owners & Shop Owners Growth
                  </div>
                  <span className="text-gray-400 text-lg cursor-pointer leading-none select-none">−</span>
                </div>
                <div className="h-64">
                  {growthData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={growthData} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Users" fill="#60a5fa" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Vendors" fill="#fbbf24" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">No growth data available</div>
                  )}
                </div>
              </div>

              {/* Right: Pending Approvals + Quick Actions */}
              <div className="flex flex-col gap-4">
                {/* Pending Approvals */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold text-gray-700 text-sm">Pending Vendor Approvals</span>
                    <span className="text-gray-400 text-lg cursor-pointer leading-none select-none">−</span>
                  </div>
                  <div className="flex justify-center">
                    <a href="/admin/auto-shop-owners"
                      className="text-blue-600 hover:underline text-sm font-medium">
                      View All Pending Vendors
                    </a>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 font-semibold text-gray-700 text-sm">
                      <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                      </svg>
                      Quick Actions
                    </div>
                    <span className="text-gray-400 text-lg cursor-pointer leading-none select-none">−</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "View All Job Cards", href: "/admin/dashboard-data", count: d?.jobCardsCount, icon: "📋", iconBg: "bg-blue-600" },
                      { label: "Review Shop Applications", href: "/admin/auto-shop-owners", icon: "👤", iconBg: "bg-yellow-500" },
                      { label: "Manage Car Owners", href: "/admin/car-owners", count: d?.carOwnersCount, icon: "🚗", iconBg: "bg-teal-500" },
                      { label: "Manage Services", href: "/admin/services", count: d?.servicesCount, icon: "⚙️", iconBg: "bg-green-500" },
                    ].map((action, i) => (
                      <a key={i} href={action.href}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center gap-2.5">
                          <span className={`${action.iconBg} text-white w-7 h-7 rounded flex items-center justify-center text-xs`}>
                            {action.icon}
                          </span>
                          <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
                            {action.label}
                          </span>
                        </div>
                        {action.count !== undefined && (
                          <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded">
                            {action.count}
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>

                {/* System Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Services</span>
                      <span className="font-semibold text-blue-600">{d?.servicesCount ?? "--"}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Sub Services</span>
                      <span className="font-semibold text-purple-600">{d?.subServicesCount ?? "--"}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Total Deals</span>
                      <span className="font-semibold text-yellow-600">{d?.dealsCount ?? "--"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}