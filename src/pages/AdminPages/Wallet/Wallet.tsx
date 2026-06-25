import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AdminPage from "../../../components/admin/AdminPage";
import { AdminDataTable, tableCell } from "../../../components/admin/AdminDataTable";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols] = useState([
    "jobNo", "business", "customer", "vehicle", "amount", "status", "method", "created",
  ]);

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
  }, [filter.paymentStatus, filter.paymentMethod, filter.fromDate, filter.toDate, filter.business, filter.unpaid, filter.page, filter.limit, filter.search]);

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

  const getRowId = (item: JobCardPayment) => item._id || item.jobNo;

  const tableColumns = useMemo(
    () => [
      {
        key: "jobNo",
        label: "Job No",
        render: (item: JobCardPayment) => tableCell(item.jobNo),
        exportValue: (item: JobCardPayment) => item.jobNo,
      },
      {
        key: "business",
        label: "Business",
        render: (item: JobCardPayment) =>
          tableCell(<span style={{ fontWeight: 500 }}>{item.business?.businessName ?? "-"}</span>),
        exportValue: (item: JobCardPayment) => item.business?.businessName ?? "-",
      },
      {
        key: "customer",
        label: "Customer",
        render: (item: JobCardPayment) =>
          tableCell(item.customer?.name || item.customer?.email || "-"),
        exportValue: (item: JobCardPayment) => item.customer?.name || item.customer?.email || "-",
      },
      {
        key: "vehicle",
        label: "Vehicle (Name / Model / Plate)",
        render: (item: JobCardPayment) =>
          tableCell(
            <div>
              <div style={{ fontWeight: 700 }}>{item.vehicle?.make?.name || "-"}</div>
              <div style={{ color: "#777" }}>{item.vehicle?.make?.model || "-"}</div>
              <span
                style={{
                  display: "inline-block",
                  marginTop: 4,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: "#f4f4f4",
                  fontFamily: "monospace",
                  fontSize: 12,
                }}
              >
                {item.vehicle?.licensePlateNo || "-"}
              </span>
            </div>
          ),
        exportValue: (item: JobCardPayment) =>
          `${item.vehicle?.make?.name || "-"} / ${item.vehicle?.make?.model || "-"} / ${item.vehicle?.licensePlateNo || "-"}`,
      },
      {
        key: "amount",
        label: "Amount",
        render: (item: JobCardPayment) =>
          tableCell(
            <span style={{ fontWeight: 700 }}>
              ₹{item.totalPayableAmount?.toLocaleString?.() ?? "-"}
            </span>
          ),
        exportValue: (item: JobCardPayment) => String(item.totalPayableAmount ?? "-"),
      },
      {
        key: "status",
        label: "Status",
        render: (item: JobCardPayment) =>
          tableCell(
            <span
              className={`inline-block rounded px-3 py-1 text-xs font-bold ${statusBadge[item.paymentStatus] || "bg-[#777] text-white"}`}
            >
              {item.paymentStatus}
            </span>
          ),
        exportValue: (item: JobCardPayment) => item.paymentStatus,
      },
      {
        key: "method",
        label: "Method",
        render: (item: JobCardPayment) => tableCell(item.paymentMethod),
        exportValue: (item: JobCardPayment) => item.paymentMethod,
      },
      {
        key: "created",
        label: "Created",
        render: (item: JobCardPayment) =>
          tableCell(item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"),
        exportValue: (item: JobCardPayment) =>
          item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
      },
    ],
    []
  );

  const filterForm = (
    <form onSubmit={handleSearch} autoComplete="off" style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "12px 20px", borderBottom: "1px solid #f4f4f4" }}>
      <input
        name="search"
        placeholder="Search job, customer, business, vehicle..."
        value={searchInput}
        onChange={handleInputChange}
        style={{ height: 30, width: 220, border: "1px solid #d2d6de", borderRadius: 2, padding: "0 10px", fontSize: 13 }}
      />
      <select
        name="paymentStatus"
        value={filter.paymentStatus ?? ""}
        onChange={handleInputChange}
        style={{ height: 30, border: "1px solid #d2d6de", borderRadius: 2, padding: "0 8px", fontSize: 13 }}
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
        style={{ height: 30, border: "1px solid #d2d6de", borderRadius: 2, padding: "0 8px", fontSize: 13 }}
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
        style={{ height: 30, border: "1px solid #d2d6de", borderRadius: 2, padding: "0 8px", fontSize: 13 }}
      />
      <input
        type="date"
        name="toDate"
        value={filter.toDate ?? ""}
        onChange={handleDateChange}
        min={filter.fromDate || undefined}
        title="To date"
        style={{ height: 30, border: "1px solid #d2d6de", borderRadius: 2, padding: "0 8px", fontSize: 13 }}
      />
      <button
        type="submit"
        style={{ height: 30, padding: "0 16px", borderRadius: 2, border: "none", background: "#0073b7", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
      >
        Search
      </button>
    </form>
  );

  return (
    <AdminPage title="Wallet (Job Card Payments)" noPanel>
      <div className="mb-10">
        {filterForm}
        <AdminDataTable
          items={data}
          columns={tableColumns}
          getRowId={getRowId}
          loading={loading}
          error={error}
          emptyMessage="No results found."
          showSearch={false}
          serverPaginated
          totalItemCount={total}
          currentPage={filter.page || 1}
          onCurrentPageChange={(p) => setFilter((prev) => ({ ...prev, page: p }))}
          pageSize={filter.limit || 20}
          onPageSizeChange={(n) => setFilter((prev) => ({ ...prev, limit: n, page: 1 }))}
          visibleColumnKeys={visibleCols}
          onVisibleColumnKeysChange={setVisibleCols}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          exportFilename="wallet-payments"
        />
      </div>
    </AdminPage>
  );
};

export default Wallet;
