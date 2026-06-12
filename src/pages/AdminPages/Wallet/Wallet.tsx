// import React, { useEffect, useState } from "react";
// import axios from "axios";

// const API_URL = import.meta.env.VITE_API_URL;

// interface BusinessInfo {
//   _id: string;
//   businessName: string;
//   businessEmail?: string;
// }
// interface CustomerInfo {
//   _id: string;
//   name?: string;
//   email?: string;
//   phone?: string;
// }
// interface VehicleMakeInfo {
//   name?: string;
//   model?: string;
// }
// interface VehicleInfo {
//   _id: string;
//   licensePlateNo?: string;
//   vinNo?: string;
//   make?: VehicleMakeInfo;
//   year?: number;
//   odometerReading?: number;
//   dueOdometerReading?: number | null;
//   vehicleImage?: string | null;
//   disabled?: boolean;
// }
// interface DealApplied {
//   name?: string;
//   percentageDiscount?: number;
//   dealCode?: string;
// }
// interface JobCardPayment {
//   _id?: string;
//   paymentStatus: string;
//   paymentMethod: string;
//   totalPayableAmount: number;
//   dealApplied?: DealApplied;
//   unpaid?: boolean;
//   customer: CustomerInfo;
//   vehicle: VehicleInfo;
//   business: BusinessInfo;
//   jobNo: string;
//   createdAt: string;
//   updatedAt: string;
// }
// interface WalletFilter {
//   paymentStatus?: string;
//   paymentMethod?: string;
//   search?: string;
//   page?: number;
//   limit?: number;
//   fromDate?: string;
//   toDate?: string;
//   business?: string;
//   unpaid?: boolean;
// }

// const paymentStatusColors: Record<string, string> = {
//   Paid: "#22c55e",
//   Pending: "#E8910C",
//   Cancelled: "#ef4444",
// };

// const Wallet: React.FC = () => {
//   const [data, setData] = useState<JobCardPayment[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const [filter, setFilter] = useState<WalletFilter>({ page: 1, limit: 20 });
//   const [total, setTotal] = useState<number>(0);

//   // This ref tracks all filter values except search (including page, limit)
//   // const filterExceptSearch = {
//   //   paymentStatus: filter.paymentStatus,
//   //   paymentMethod: filter.paymentMethod,
//   //   fromDate: filter.fromDate,
//   //   toDate: filter.toDate,
//   //   business: filter.business,
//   //   unpaid: filter.unpaid,
//   //   page: filter.page,
//   //   limit: filter.limit
//   // };

//   // Debounced search filter
//   const [searchInput, setSearchInput] = useState(filter.search ?? "");
//   // const searchDebounceTimeout = useRef<NodeJS.Timeout | null>(null);

//   const fetchPayments = async (params: WalletFilter = filter) => {
//     setLoading(true);
//     setError(null);

//     try {
//       const urlParams = new URLSearchParams();
//       Object.entries(params).forEach(([key, value]) => {
//         if (value !== undefined && value !== null && value !== "") {
//           urlParams.append(key, String(value));
//         }
//       });

//       const res = await axios.get(
//         `${API_URL}/api/admin/job-cards/payments?${urlParams.toString()}`
//       );
//       setData(res.data.data || []);
//       setTotal(res.data.total || 0);
//     } catch (err: any) {
//       setError(
//         err?.response?.data?.message || "Failed to fetch job card payments"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Auto reload when filters except search change
//   useEffect(() => {
//     fetchPayments(filter);
//     // eslint-disable-next-line
//   }, [
//     filter.paymentStatus,
//     filter.paymentMethod,
//     filter.fromDate,
//     filter.toDate,
//     filter.business,
//     filter.unpaid,
//     filter.page,
//     filter.limit
//   ]);

//   // Debounce for search input field
//   useEffect(() => {
//     setSearchInput(filter.search ?? "");
//   }, [filter.search]);

//   // Only update filter.search via search button/form
//   const handleInputChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;
//     // If search, update local searchInput, don't update filter
//     if (name === "search") {
//       setSearchInput(value);
//     } else {
//       setFilter((prev) => ({
//         ...prev,
//         [name]: value,
//         page: 1,
//       }));
//     }
//   };

//   // For date pickers, for correct min/max, always apply filter update directly
//   const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFilter((prev) => ({
//       ...prev,
//       [name]: value,
//       page: 1,
//     }));
//   };

//   // const handleUnpaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//   //   setFilter((prev) => ({
//   //     ...prev,
//   //     unpaid: e.target.checked ? true : undefined,
//   //     page: 1,
//   //   }));
//   // };

//   // Only search applies on submit, other fields auto-update filter
//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//     setFilter(prev => ({
//       ...prev,
//       search: searchInput,
//       page: 1,
//     }));
//   };

//   const handlePageChange = (newPage: number) => {
//     setFilter((prev) => ({
//       ...prev,
//       page: newPage,
//     }));
//   };

//   return (
//     <div className="wallet-page">
//       {/* Embedded CSS for modern look */}
//       <style>
//         {`
//           .wallet-page {
//             max-width: 1100px;
//             height:"full";
//             margin: 36px auto 36px auto;
//             background: #f8f9fb;
//             border-radius: 18px;
//             padding: 32px 24px 32px 24px;
//             box-shadow: 0 4px 18px 0 rgba(70,88,144,0.07), 0 .5px 1.5px 0 rgba(60,60,80,.06);
//           }
//           .wallet-page h2 {
//             font-weight: 800;
//             font-size: 2rem;
//             margin-bottom: 18px;
//             letter-spacing: -0.5px;
//             color: #23272F;
//           }
//           .wallet-filters {
//             display: flex;
//             flex-wrap: wrap;
//             gap: 18px;
//             margin-bottom: 26px;
//             align-items: center;
//             background: #f0f2f7;
//             border-radius: 12px;
//             padding: 24px 16px 10px 16px;
//             box-shadow: 0 0.5px 2.5px rgba(60,60,100,0.04);
//           }
//           .wallet-filters input,
//           .wallet-filters select {
//             padding: 8px 12px;
//             border-radius: 6px;
//             border: 1px solid #d1d5db;
//             background: #fff;
//             font-size: 15px;
//             transition: border 0.18s;
//           }
//           .wallet-filters input:focus,
//           .wallet-filters select:focus {
//             outline: none;
//             border: 1.7px solid #3742fa;
//           }
//           .wallet-filters label {
//             display: flex;
//             align-items: center;
//             gap: 6px;
//             font-size: 15px;
//           }
//           .wallet-filters button[type="submit"] {
//             padding: 9px 30px;
//             border-radius: 6px;
//             border: none;
//             font-weight: 700;
//             letter-spacing: 0.03em;
//             background: linear-gradient(90deg, #35469c 65%, #31bebb);
//             color: #fff;
//             font-size: 15.2px;
//             box-shadow: 0 1.5px 7px rgba(20,60,130,0.07);
//             cursor: pointer;
//             transition: background 0.15s, transform 0.09s;
//           }
//           .wallet-filters button[type="submit"]:hover {
//             background: linear-gradient(90deg, #253469 55%, #208bbf);
//             transform: translateY(-1px) scale(1.03);
//           }
//           .wallet-table-wrap {
//             overflow-x: auto;
//             overflow-y: auto;
//             max-height: 390px;
//             min-height: 110px;
//             border: none;
//             border-radius: 10px;
//             background: #fff;
//             box-shadow: 0 0.3px 3.5px rgba(60,60,100,0.06);
//             margin-bottom: 10px;
//           }
//           .wallet-table {
//             width: 100%;
//             border-collapse: separate !important;
//             border-spacing: 0;
//             background: #fff;
//             font-size: 15.2px;
//             min-width: 950px;
//           }
//           .wallet-table th, .wallet-table td {
//             padding: 9.5px 18px;
//             border-bottom: 1.5px solid #ECF0F8;
//             text-align: left;
//           }
//           .wallet-table th {
//             background: #f3f4f7;
//             color: #263257;
//             font-weight: 700;
//             font-size: 15.9px;
//             border-top: none;
//             letter-spacing: 0.003em;
//           }
//           .wallet-table tbody tr:hover {
//             background: #f1f8fe;
//             transition: background 0.14s;
//           }
//           .wallet-table td {
//             color: #23232f;
//             font-size: 15.2px;
//           }
//           .wallet-amount {
//             color: #3742fa;
//             font-weight: 800;
//             font-size: 16px;
//             letter-spacing: 0.2px;
//           }
//           .wallet-payment-status {
//             font-weight: 900;
//             border-radius: 16px;
//             padding: 3.5px 14px;
//             background: #f5faff;
//             display: inline-block;
//             font-size: 15px;
//             letter-spacing: 0.02em;
//           }
//           .wallet-unpaid-dot {
//             font-weight: bold;
//             font-size: 19px;
//             color: #ef4444;
//             vertical-align: middle;
//           }
//           .wallet-pagination {
//             margin-top: 17px;
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             gap: 20px;
//           }
//           .wallet-pagination-btn {
//             padding: 7px 20px;
//             border-radius: 6px;
//             background: #e3e9f9;
//             color: #27346a;
//             font-weight: 700;
//             border: none;
//             font-size: 15.6px;
//             letter-spacing: 0.02em;
//             cursor: pointer;
//             min-width: 74px;
//             transition: background .13s, color .13s;
//           }
//           .wallet-pagination-btn:disabled {
//             background: #f5f7fb;
//             color: #9ca3af;
//             cursor: not-allowed;
//           }
//           .wallet-pagination-current {
//             font-size: 16px;
//             font-weight: 800;
//             color: #222b48;
//           }
//           @media (max-width: 700px) {
//             .wallet-page {
//               padding: 12px 3vw 15px 3vw;
//               max-width: 98vw;
//               box-shadow: none;
//             }
//             .wallet-filters {
//               padding: 14px 4vw 5px 4vw;
//               gap: 8px;
//             }
//             .wallet-table th, .wallet-table td {
//               padding: 6.7px 7px;
//               font-size: 14.3px;
//             }
//             .wallet-table {
//               min-width: 620px;
//               font-size: 14px;
//             }
//           }
//         `}
//       </style>
//       <h2>
//         <span role="img" aria-label="wallet" style={{ marginRight: "9px" }}>💼</span>
//         Wallet <span style={{
//           background: "linear-gradient(90deg,#31bebb,#3742fa)",
//           WebkitBackgroundClip: "text",
//           color: "transparent",
//           fontSize: "0.87em",
//           fontWeight: 700,
//           marginLeft: 13,
//           verticalAlign: "top"
//         }}>(Job Card Payments)</span>
//       </h2>
//       <form className="wallet-filters" onSubmit={handleSearch} autoComplete="off">
//         <input
//           name="search"
//           placeholder="🔍 Search job, customer, business, vehicle..."
//           value={searchInput}
//           onChange={handleInputChange}
//         />
//         <select
//           name="paymentStatus"
//           value={filter.paymentStatus ?? ""}
//           onChange={handleInputChange}
//         >
//           <option value="">All Status</option>
//           <option value="Paid">Paid</option>
//           <option value="Pending">Pending</option>
//           <option value="Cancelled">Cancelled</option>
//         </select>
//         <select
//           name="paymentMethod"
//           value={filter.paymentMethod ?? ""}
//           onChange={handleInputChange}
//         >
//           <option value="">All Methods</option>
//           <option value="Cash">Cash</option>
//           <option value="Online">Online</option>
//         </select>
//         <input
//           type="date"
//           name="fromDate"
//           value={filter.fromDate ?? ""}
//           onChange={handleDateChange}
//           placeholder="From"
//           max={filter.toDate || undefined}
//           title="From date"
//         />
//         <input
//           type="date"
//           name="toDate"
//           value={filter.toDate ?? ""}
//           onChange={handleDateChange}
//           placeholder="To"
//           min={filter.fromDate || undefined}
//           title="To date"
//         />
//         {/* <label>
//           <input
//             type="checkbox"
//             checked={!!filter.unpaid}
//             onChange={handleUnpaidChange}
//             style={{ accentColor: "#ef4444" }}
//           />
//           <span>Unpaid Only</span>
//         </label> */}

//         {/* Search button only for the search field */}
//         <button type="submit">
//           <span role="img" aria-label="search">🔎</span>
//           &nbsp;Search
//         </button>
//       </form>

//       <div>
//         {loading && (
//           <p style={{
//             fontSize: 17,
//             color: "#2475df",
//             fontWeight: 700,
//             textAlign: "center",
//             letterSpacing: "0.1em",
//             margin: 45,
//           }}>
//             Loading...
//           </p>
//         )}
//         {error && (
//           <div style={{
//             color: "#ef4444",
//             marginBottom: 16,
//             background: "#fff6f7",
//             border: "1.8px solid #ffe4e6",
//             padding: "13px 22px",
//             borderRadius: 10,
//             fontSize: 15.6,
//             fontWeight: 600,
//             letterSpacing: "0.03em",
//           }}>{error}</div>
//         )}
//         {!loading && !error && (
//           <div>
//             <div style={{
//               marginBottom: 12,
//               fontWeight: 700,
//               fontSize: 15.6,
//               color: "#253469"
//             }}>
//               Showing <strong>{data.length}</strong> of <strong>{total}</strong> results
//             </div>
//             <div className="wallet-table-wrap">
//               <table className="wallet-table">
//                 <thead>
//                   <tr>
//                     <th>Job&nbsp;No</th>
//                     <th>Business</th>
//                     <th>Customer</th>
//                     <th>
//                       Vehicle
//                       <div style={{fontWeight: 400, fontSize: "0.92em", color: "#6a688b"}}>
//                         (Name / Model / License Plate)
//                       </div>
//                     </th>
//                     <th>Amount</th>
//                     <th>Status</th>
//                     <th>Method</th>
//                     <th>Created</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {data.length === 0 && (
//                     <tr>
//                       <td colSpan={8} style={{
//                         textAlign: "center",
//                         padding: "36px 0",
//                         fontSize: 17,
//                         color: "#767b91",
//                         background: "#f7fafc"
//                       }}>
//                         <span role="img" aria-label="empty">📭</span>&nbsp; No results found
//                       </td>
//                     </tr>
//                   )}
//                   {data.map((item, idx) => (
//                     <tr key={item.jobNo || idx}>
//                       <td>{item.jobNo}</td>
//                       <td>
//                         <span style={{
//                           fontWeight: 500,
//                           color: "#3742fa"
//                         }}>
//                           {item.business?.businessName ?? "-"}
//                         </span>
//                       </td>
//                       <td>
//                         <span style={{ color: "#0b3568" }}>
//                           {item.customer?.name || item.customer?.email || "-"}
//                         </span>
//                       </td>
//                       <td>
//                         <span style={{
//                           display: "inline-flex",
//                           flexDirection: "column"
//                         }}>
//                           <span style={{
//                             fontWeight: 700, color: "#3742fa", fontSize: "1em"
//                           }}>
//                             {item.vehicle?.make?.name ? item.vehicle.make.name : "-"}
//                           </span>
//                           <span style={{
//                             color: "#505097", fontWeight: 500, fontSize: "0.98em"
//                           }}>
//                             {item.vehicle?.make?.model ? item.vehicle.make.model : "-"}
//                           </span>
//                           <span style={{
//                             fontFamily: "monospace,mono",
//                             background: "#ecf4ff",
//                             borderRadius: 5,
//                             padding: "2.2px 8px",
//                             fontSize: "0.95em",
//                             color: "#263257",
//                             marginTop: 1
//                           }}>
//                             {item.vehicle?.licensePlateNo
//                               ? item.vehicle.licensePlateNo
//                               : "-"}
//                           </span>
//                         </span>
//                       </td>
//                       <td className="wallet-amount">
//                         ₹{item.totalPayableAmount?.toLocaleString?.() ?? "-"}
//                       </td>
//                       <td>
//                         <span
//                           className="wallet-payment-status"
//                           style={{
//                             color: paymentStatusColors[item.paymentStatus] ?? "#253469",
//                             background: (item.paymentStatus === "Paid" && "#e7ffee")
//                               || (item.paymentStatus === "Pending" && "#fff4dc")
//                               || (item.paymentStatus === "Cancelled" && "#fff4f4")
//                               || "#f6faff",
//                             border: `1.3px solid ${paymentStatusColors[item.paymentStatus] ?? "#d8dff8"}`,
//                           }}>
//                           {item.paymentStatus}
//                         </span>
//                       </td>
//                       <td style={{ fontWeight: 500 }}>{item.paymentMethod}</td>
//                       <td>
//                         <span style={{ color: "#555" }}>
//                           {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//             {/* Pagination */}
//             <div className="wallet-pagination">
//               <button
//                 className="wallet-pagination-btn"
//                 onClick={() => handlePageChange(filter.page ? filter.page - 1 : 1)}
//                 disabled={filter.page === 1}
//               >
//                 ⬅ Prev
//               </button>
//               <span className="wallet-pagination-current">
//                 Page {filter.page}
//               </span>
//               <button
//                 className="wallet-pagination-btn"
//                 onClick={() => handlePageChange((filter.page || 1) + 1)}
//                 disabled={data.length < (filter.limit || 20)}
//               >
//                 Next ➡
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Wallet;

// Wallet.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

interface BusinessInfo { _id: string; businessName: string; businessEmail?: string; }
interface CustomerInfo { _id: string; name?: string; email?: string; phone?: string; }
interface VehicleMakeInfo { name?: string; model?: string; }
interface VehicleInfo {
  _id: string; licensePlateNo?: string; vinNo?: string; make?: VehicleMakeInfo;
  year?: number; odometerReading?: number; dueOdometerReading?: number | null;
  vehicleImage?: string | null; disabled?: boolean;
}
interface DealApplied { name?: string; percentageDiscount?: number; dealCode?: string; }
interface JobCardPayment {
  _id?: string; paymentStatus: string; paymentMethod: string; totalPayableAmount: number;
  dealApplied?: DealApplied; unpaid?: boolean; customer: CustomerInfo; vehicle: VehicleInfo;
  business: BusinessInfo; jobNo: string; createdAt: string; updatedAt: string;
}
interface WalletFilter {
  paymentStatus?: string; paymentMethod?: string; search?: string; page?: number; limit?: number;
  fromDate?: string; toDate?: string; business?: string; unpaid?: boolean;
}

const statusBadge: Record<string, string> = {
  Paid: "bg-[#28a745] text-white",
  Pending: "bg-[#ffc107] text-white",
  Cancelled: "bg-[#dc3545] text-white",
};

const Wallet: React.FC = () => {
  const [data, setData] = useState<JobCardPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<WalletFilter>({ page: 1, limit: 20 });
  const [total, setTotal] = useState<number>(0);
  const [searchInput, setSearchInput] = useState(filter.search ?? "");

  const fetchPayments = async (params: WalletFilter = filter) => {
    setLoading(true);
    setError(null);
    try {
      const urlParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          urlParams.append(key, String(value));
        }
      });
      const res = await axios.get(`${API_URL}/api/admin/job-cards/payments?${urlParams.toString()}`);
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch job card payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(filter);
    // eslint-disable-next-line
  }, [filter.paymentStatus, filter.paymentMethod, filter.fromDate, filter.toDate, filter.business, filter.unpaid, filter.page, filter.limit]);

  useEffect(() => {
    setSearchInput(filter.search ?? "");
  }, [filter.search]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "search") {
      setSearchInput(value);
    } else {
      setFilter((prev) => ({ ...prev, [name]: value, page: 1 }));
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilter((prev) => ({ ...prev, page: newPage }));
  };

  const totalPages = Math.max(1, Math.ceil(total / (filter.limit || 20)));

  return (
<div
        // You may use Tailwind class if setup, or fallback to CSS below.
        className="h-[92vh] overflow-y-auto bg-[#f0f0f0] px-6 py-5 font-sans"
      
      >
      {/* Heading */}
      <h1 className="mb-6 text-[52px] font-light text-[#333]">
        Wallet <span className="text-[28px] text-[#999]">(Job Card Payments)</span>
      </h1>

      {/* Card */}
      <div className="mb-10 overflow-hidden rounded border border-[#d2d6de] bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-[#f4f4f4] px-6 py-4">
          <h3 className="text-[18px] font-normal text-[#444]">Payments List</h3>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Filters */}
          <form onSubmit={handleSearch} autoComplete="off" className="mb-5 flex flex-wrap items-center gap-3">
            <input
              name="search"
              placeholder="Search job, customer, business, vehicle..."
              value={searchInput}
              onChange={handleInputChange}
              className="h-9 w-[260px] rounded border border-[#d2d6de] px-3 outline-none"
            />
            <select
              name="paymentStatus"
              value={filter.paymentStatus ?? ""}
              onChange={handleInputChange}
              className="h-9 rounded border border-[#d2d6de] px-3 outline-none"
            >
              <option value="">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select
              name="paymentMethod"
              value={filter.paymentMethod ?? ""}
              onChange={handleInputChange}
              className="h-9 rounded border border-[#d2d6de] px-3 outline-none"
            >
              <option value="">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Online">Online</option>
            </select>
            <input
              type="date"
              name="fromDate"
              value={filter.fromDate ?? ""}
              onChange={handleDateChange}
              max={filter.toDate || undefined}
              title="From date"
              className="h-9 rounded border border-[#d2d6de] px-3 outline-none"
            />
            <input
              type="date"
              name="toDate"
              value={filter.toDate ?? ""}
              onChange={handleDateChange}
              min={filter.fromDate || undefined}
              title="To date"
              className="h-9 rounded border border-[#d2d6de] px-3 outline-none"
            />
            <button
              type="submit"
              className="h-9 rounded bg-[#007bff] px-5 font-bold text-white hover:bg-[#0069d9]"
            >
              Search
            </button>
          </form>

          {/* States */}
          {loading && (
            <p className="py-8 text-center text-[15px] font-bold text-[#007bff]">Loading...</p>
          )}
          {error && (
            <div className="mb-4 rounded border border-[#f5c6cb] bg-[#f8d7da] px-4 py-3 text-[#721c24]">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <p className="mb-3 text-[15px] text-[#333]">
                Showing <strong>{data.length}</strong> of <strong>{total}</strong> results
              </p>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["Job No", "Business", "Customer", "Vehicle (Name / Model / Plate)", "Amount", "Status", "Method", "Created"].map((h) => (
                        <th key={h} className="border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 && (
                      <tr>
                        <td colSpan={8} className="border border-[#d2d6de] px-4 py-10 text-center text-[#777]">
                          No results found
                        </td>
                      </tr>
                    )}
                    {data.map((item, idx) => (
                      <tr key={item.jobNo || idx}>
                        <td className="border border-[#d2d6de] px-4 py-5">{item.jobNo}</td>
                        <td className="border border-[#d2d6de] px-4 py-5 font-medium text-[#333]">
                          {item.business?.businessName ?? "-"}
                        </td>
                        <td className="border border-[#d2d6de] px-4 py-5">
                          {item.customer?.name || item.customer?.email || "-"}
                        </td>
                        <td className="border border-[#d2d6de] px-4 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#333]">
                              {item.vehicle?.make?.name || "-"}
                            </span>
                            <span className="text-[#777]">
                              {item.vehicle?.make?.model || "-"}
                            </span>
                            <span className="mt-1 inline-block w-fit rounded bg-[#f4f4f4] px-2 py-0.5 font-mono text-[13px] text-[#333]">
                              {item.vehicle?.licensePlateNo || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="border border-[#d2d6de] px-4 py-5 font-bold text-[#333]">
                          ₹{item.totalPayableAmount?.toLocaleString?.() ?? "-"}
                        </td>
                        <td className="border border-[#d2d6de] px-4 py-5">
                          <span className={`inline-block rounded px-3 py-1 text-xs font-bold ${statusBadge[item.paymentStatus] || "bg-[#777] text-white"}`}>
                            {item.paymentStatus}
                          </span>
                        </td>
                        <td className="border border-[#d2d6de] px-4 py-5">{item.paymentMethod}</td>
                        <td className="border border-[#d2d6de] px-4 py-5 text-[#555]">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-[15px] text-[#333]">
                  Page {filter.page} of {totalPages}
                </p>
                <div className="flex">
                  <button
                    onClick={() => handlePageChange(filter.page ? filter.page - 1 : 1)}
                    disabled={filter.page === 1}
                    className="border border-[#ddd] bg-white px-4 py-2 text-[#777] disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button className="border border-[#007bff] bg-[#007bff] px-4 py-2 text-white">
                    {filter.page}
                  </button>
                  <button
                    onClick={() => handlePageChange((filter.page || 1) + 1)}
                    disabled={data.length < (filter.limit || 20)}
                    className="border border-[#ddd] bg-white px-4 py-2 text-[#777] disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;