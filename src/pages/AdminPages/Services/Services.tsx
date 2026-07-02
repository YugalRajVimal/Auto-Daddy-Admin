import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
import { useAdminDeletedView } from "../../../hooks/useAdminDeletedView";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

export type ShopType = "autoShop" | "tyreShop" | "carWash" | "towTruck";
type ServiceStatus = "active" | "inactive";

export interface Service {
  _id: string;
  name: string;
  status: ServiceStatus;
  shopType: ShopType;
  subServices?: { name: string; status?: ServiceStatus }[];
}

const SHOP_TYPE_OPTIONS: { value: ShopType; label: string }[] = [
  { value: "autoShop", label: "Auto Shop" },
  { value: "tyreShop", label: "Tyre Shop" },
  { value: "carWash", label: "Car Wash" },
  { value: "towTruck", label: "Tow Truck" },
];

type ServicesPageProps = {
  initialShowForm?: boolean;
};

export default function Services({ initialShowForm = false }: ServicesPageProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [filterShopType, setFilterShopType] = useState<"all" | ShopType>("all");
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [shopType, setShopType] = useState<ShopType>("autoShop");
  const [status, setStatus] = useState<ServiceStatus>("active");

  const resetTableControls = () => {
    setPage(1);
    setSelected(new Set());
    setSearch("");
  };

  const {
    viewMode,
    isDeletedView,
    toggleViewMode,
    deletedStash,
    stashDeleted,
    restoreStashed,
  } = useAdminDeletedView<Service>({ onToggle: resetTableControls, storageKey: "admin_deleted_view:services" });

  useEffect(() => {
    fetchServices();
  }, [filterShopType]);

  const fetchServices = async () => {
    setLoading(true);
    setError("");
    try {
      let url = `${API_BASE}/admin/services`;
      if (filterShopType !== "all") url += `?shopType=${filterShopType}`;
      const res = await axios.get<{ success: boolean; data: Service[] }>(url);
      if (res.data.success) setServices(res.data.data || []);
      else {
        const msg = "Failed to fetch services.";
        setError(msg);
        adminNotify.error(msg);
      }
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      const __adminMsg = axErr?.response?.data?.message || axErr?.message || "Error fetching services";
      setError(__adminMsg);
      adminNotify.error(__adminMsg);
    } finally {
      setLoading(false);
    }
  };

  const displayServices = isDeletedView ? deletedStash : services;

  const filtered = displayServices.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    SHOP_TYPE_OPTIONS.find((o) => o.value === s.shopType)?.label.toLowerCase().includes(search.toLowerCase()) ||
    s.status.toLowerCase().includes(search.toLowerCase())
  );

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
    else setSelected(new Set(paged.map((s) => s._id)));
  };

  const resetForm = () => {
    setName("");
    setShopType("autoShop");
    setStatus("active");
    setEditingId(null);
    setError("");
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (service: Service) => {
    setName(service.name);
    setShopType(service.shopType);
    setStatus(service.status || "active");
    setEditingId(service._id);
    setError("");
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      const __adminMsg = "Service name is required.";
      setError(__adminMsg);
      adminNotify.error(__adminMsg);
      return;
    }
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const payload = { name: name.trim(), shopType, status };
      if (editingId) {
        await axios.put(`${API_BASE}/admin/services/${editingId}`, payload);
        adminNotify.success("Service updated successfully.");
      setSuccessMsg("Service updated successfully.");
      } else {
        await axios.post(`${API_BASE}/admin/services`, payload);
        adminNotify.success("Service added successfully.");
      setSuccessMsg("Service added successfully.");
      }
      resetForm();
      setShowForm(false);
      fetchServices();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string; error?: string }>;
      const __adminMsg = axErr?.response?.data?.message || axErr?.response?.data?.error || "Error saving service";
      setError(__adminMsg);
      adminNotify.error(__adminMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (service: Service) => {
    if (!window.confirm(`Delete service "${service.name}"?`)) return;
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await axios.delete(`${API_BASE}/admin/services/${service._id}`);
      stashDeleted(service);
      adminNotify.success("Service deleted successfully.");
      setSuccessMsg("Service deleted successfully.");
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(service._id);
        return next;
      });
      fetchServices();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      const __adminMsg = axErr?.response?.data?.message || axErr?.message || "Failed to delete service";
      setError(__adminMsg);
      adminNotify.error(__adminMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToolbarDelete = () => {
    if (selected.size !== 1) return;
    const service = services.find((s) => s._id === [...selected][0]);
    if (service) handleDelete(service);
  };

  const handleRestore = async () => {
    if (selected.size !== 1) return;
    const service = deletedStash.find((s) => s._id === [...selected][0]);
    if (!service) return;
    if (!window.confirm(`Restore service "${service.name}"?`)) return;
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await axios.post(`${API_BASE}/admin/services`, {
        name: service.name,
        shopType: service.shopType,
        status: service.status || "active",
      });
      restoreStashed((item) => item._id === service._id);
      adminNotify.success("Service restored.");
      setSuccessMsg("Service restored.");
      setSelected(new Set());
      fetchServices();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      const __adminMsg = axErr?.response?.data?.message || axErr?.message || "Failed to restore service";
      setError(__adminMsg);
      adminNotify.error(__adminMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToolbarPrint = () => {
    printAdminTable({
      title: "Services",
      headers: ["Name", "Shop Type", "Sub Services", "Status"],
      rows: services
        .filter((service) => selected.has(service._id))
        .map((service) => [
          service.name,
          shopTypeLabel(service.shopType),
          String(service.subServices?.length ?? 0),
          service.status || "active",
        ]),
    });
  };

  const shopTypeLabel = (value: ShopType) =>
    SHOP_TYPE_OPTIONS.find((o) => o.value === value)?.label || value;

  const formMessage = editingId ? "You are updating a 'Service'" : "You are creating a 'Service'";

  return (
    <AdminPage
      title={isDeletedView ? "Deleted Services" : "Services"}
      headerAction={!showForm && !isDeletedView ? <AddNewButton onClick={openAdd} /> : undefined}
      between={
        showForm ? (
          <CompactFormPanel
            footer={
              <CompactFormFooter
                message={formMessage}
                messageCenter
                actionLabel={
                  actionLoading
                    ? (editingId ? "Updating..." : "Saving...")
                    : (editingId ? "Update" : "Save")
                }
                onSave={handleSave}
                onCancel={handleCancel}
              />
            }
          >
            {error && (
              <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
                {error}
              </div>
            )}
            <CompactFormRow className="items-start">
              <CompactField label="Service Name" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Shop Type" required>
                <select
                  value={shopType}
                  onChange={(e) => setShopType(e.target.value as ShopType)}
                  className={compactInputClass}
                >
                  {SHOP_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </CompactField>
              <CompactField label="Status" required>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                  className={compactInputClass}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </CompactField>
            </CompactFormRow>
          </CompactFormPanel>
        ) : undefined
      }
    >
      {isDeletedView && (
        <AdminDeletedBanner count={deletedStash.length} entityLabel="services" />
      )}
      {successMsg && !showForm && (
        <div className="mb-2 rounded border border-green-200 bg-green-100 px-3 py-2 text-xs text-green-800">
          {successMsg}
        </div>
      )}
      {error && !showForm && (
        <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
          {error}
        </div>
      )}

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {!isDeletedView ? (
            <button
              type="button"
              onClick={handleToolbarDelete}
              disabled={selected.size === 0 || actionLoading}
              className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRestore}
              disabled={selected.size === 0 || actionLoading}
              className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Restore
            </button>
          )}
          <button
            type="button"
            onClick={handleToolbarPrint}
            disabled={selected.size === 0}
            className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Print
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-700">
            <span>Shop Type:</span>
            <select
              value={filterShopType}
              onChange={(e) => {
                setFilterShopType(e.target.value as "all" | ShopType);
                setPage(1);
                setSelected(new Set());
              }}
              className="border border-gray-400 bg-white px-2 py-1 text-xs"
            >
              <option value="all">All</option>
              {SHOP_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
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
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Name</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Shop Type</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Sub Services</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={5} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  {isDeletedView ? "No deleted services found." : "No services found."}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => (
                <tr key={row._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(row._id)}
                      onChange={() => toggleSelect(row._id)}
                      className="accent-ad-purple"
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="text-blue-700 hover:underline"
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{shopTypeLabel(row.shopType)}</td>
                  <td className="border border-gray-300 px-3 py-2">{row.subServices?.length ?? 0}</td>
                  <td className="border border-gray-300 px-3 py-2 capitalize">{row.status || "active"}</td>
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
        <AdminDeletedToggle viewMode={viewMode} onToggle={toggleViewMode} activeLabel="Active Services" />
      </div>
    </AdminPage>
  );
}
