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
        className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-4 md:px-6 md:py-5 font-sans"
      
      >
      {/* Heading */}
      <h1 className="mb-6 text-xl md:text-2xl font-bold text-ad-green mb-4">
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