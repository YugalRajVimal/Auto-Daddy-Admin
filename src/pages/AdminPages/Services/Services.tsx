import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
import { useAdminDeletedView } from "../../../hooks/useAdminDeletedView";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import AdminSearchCard, {
  emptyAdminSearchValues,
  searchEquals,
  searchIncludes,
  type AdminSearchField,
} from "../../../components/admin/AdminSearchCard";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

// Helper: Get admin-token for Authorization header (NO Bearer)
function getAdminAuthConfig() {
  const adminToken = localStorage.getItem("admin-token");
  return {
    headers: {
      Authorization: adminToken || undefined,
    },
  };
}

export type ShopType = "autoShop" | "tyreShop" | "carWash" | "towTruck";
type ServiceStatus = "Active" | "Inactive";

export interface Service {
  _id: string;
  name: string;
  status: ServiceStatus;
  shopType: ShopType;
  odoOutRequired?: boolean;
  subServices?: {
    name: string;
    status?: ServiceStatus | string;
    createdBy?: string;
    shopkeeperName?: string;
    phone?: string;
    [key: string]: unknown;
  }[];
}

const SHOP_TYPE_OPTIONS: { value: ShopType; label: string }[] = [
  { value: "autoShop", label: "Auto Shop" },
  { value: "tyreShop", label: "Tyre Shop" },
  { value: "carWash", label: "Car Wash" },
  { value: "towTruck", label: "Tow Truck" },
];

const SERVICE_SEARCH_FIELDS: AdminSearchField[] = [
  { key: "name", label: "Name" },
  {
    key: "shopType",
    label: "Shop Type",
    type: "select",
    options: SHOP_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  },
  { key: "subServices", label: "Sub Services" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" },
    ],
  },
  {
    key: "odoOutRequired",
    label: "Odo Out Required",
    type: "select",
    options: [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
    ],
  },
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
  const [showSearchCard, setShowSearchCard] = useState(false);
  const [searchDraft, setSearchDraft] = useState(() => emptyAdminSearchValues(SERVICE_SEARCH_FIELDS));
  const [searchFilters, setSearchFilters] = useState(() => emptyAdminSearchValues(SERVICE_SEARCH_FIELDS));
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [filterShopType, setFilterShopType] = useState<"all" | ShopType>("all");
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [shopType, setShopType] = useState<ShopType>("autoShop");
  const [status, setStatus] = useState<ServiceStatus>("Active");
  const [odoOutRequired, setOdoOutRequired] = useState(false);

  const resetTableControls = () => {
    setPage(1);
    setSelected(new Set());
    setSearch("");
    const empty = emptyAdminSearchValues(SERVICE_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setShowSearchCard(false);
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
    // eslint-disable-next-line
  }, [filterShopType]);

  const fetchServices = async () => {
    setLoading(true);
    setError("");
    try {
      let url = `${API_BASE}/admin/services`;
      if (filterShopType !== "all") url += `?shopType=${filterShopType}`;
      const res = await axios.get<{ success: boolean; data: Service[] }>(
        url,
        getAdminAuthConfig()
      );
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

  const filtered = displayServices.filter((s) => {
    const live =
      !search.trim() ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      SHOP_TYPE_OPTIONS.find((o) => o.value === s.shopType)?.label.toLowerCase().includes(search.toLowerCase()) ||
      (s.status as string).toLowerCase().includes(search.toLowerCase());
    if (!live) return false;
    return (
      searchIncludes(s.name, searchFilters.name) &&
      searchEquals(s.shopType, searchFilters.shopType) &&
      searchIncludes(s.subServices?.length ?? 0, searchFilters.subServices) &&
      searchEquals(s.status || "Active", searchFilters.status) &&
      searchEquals(s.odoOutRequired ? "Yes" : "No", searchFilters.odoOutRequired)
    );
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
    else setSelected(new Set(paged.map((s) => s._id)));
  };

  const resetForm = () => {
    setName("");
    setShopType("autoShop");
    setStatus("Active");
    setOdoOutRequired(false);
    setEditingId(null);
    setError("");
  };

  const openAdd = () => {
    resetForm();
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openEdit = (service: Service) => {
    setName(service.name);
    setShopType(service.shopType);
    setStatus(service.status || "Active");
    setOdoOutRequired(Boolean(service.odoOutRequired));
    setEditingId(service._id);
    setError("");
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openSearchCard = () => {
    setShowForm(false);
    setEditingId(null);
    setSearchDraft({ ...searchFilters });
    setShowSearchCard((open) => !open);
  };

  const handleSearchCardSearch = () => {
    setSearchFilters({ ...searchDraft });
    setPage(1);
    setSelected(new Set());
  };

  const handleSearchCardReset = () => {
    const empty = emptyAdminSearchValues(SERVICE_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setPage(1);
    setSelected(new Set());
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
      const payload = { name: name.trim(), shopType, status, odoOutRequired };
      if (editingId) {
        await axios.put(
          `${API_BASE}/admin/services/${editingId}`,
          payload,
          getAdminAuthConfig()
        );
        adminNotify.success("Service updated successfully.");
        setSuccessMsg("Service updated successfully.");
      } else {
        await axios.post(
          `${API_BASE}/admin/services`,
          payload,
          getAdminAuthConfig()
        );
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
      await axios.delete(
        `${API_BASE}/admin/services/${service._id}`,
        getAdminAuthConfig()
      );
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
      await axios.post(
        `${API_BASE}/admin/services`,
        {
          name: service.name,
          shopType: service.shopType,
          status: service.status || "Active",
          odoOutRequired: Boolean(service.odoOutRequired),
        },
        getAdminAuthConfig()
      );
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
      headers: ["Name", "Shop Type", "Sub Services", "Status", "Odo Out Required"],
      rows: filtered.map((service) => [
        service.name,
        shopTypeLabel(service.shopType),
        String(service.subServices?.length ?? 0),
        service.status || "Active",
        service.odoOutRequired ? "Yes" : "No",
      ]),
    });
  };

  const shopTypeLabel = (value: ShopType) =>
    SHOP_TYPE_OPTIONS.find((o) => o.value === value)?.label || value;

  const formMessage = editingId ? "You are updating a 'Service'" : "You are creating a 'Service'";

  return (
    <AdminPage
      title={isDeletedView ? "Deleted Services" : "Services"}
      headerAction={!showForm && !showSearchCard && !isDeletedView ? <AddNewButton onClick={openAdd} /> : undefined}
      between={
        showSearchCard ? (
          <AdminSearchCard
            fields={SERVICE_SEARCH_FIELDS}
            values={searchDraft}
            onChange={setSearchDraft}
            onSearch={handleSearchCardSearch}
            onReset={handleSearchCardReset}
            onClose={() => setShowSearchCard(false)}
          />
        ) : showForm ? (
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
            <CompactFormRow className="items-start" columns={4}>
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
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </CompactField>
              <CompactField label="Odo Out Required?">
                <label className="inline-flex h-[30px] cursor-pointer items-center gap-1.5 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={odoOutRequired}
                    onChange={(e) => setOdoOutRequired(e.target.checked)}
                    className="h-3.5 w-3.5 accent-ad-green"
                  />
                  Yes
                </label>
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
            className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark"
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
          <button
            type="button"
            onClick={openSearchCard}
            className={`px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 ${
              showSearchCard ? "bg-gray-700" : "bg-gray-500"
            }`}
          >
            Filters
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
        <table className="w-full border-collapse text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-ad-purple text-white">
              <th className="border border-ad-purple-dark px-2 py-2 text-center">
                <input
                  type="checkbox"
                  checked={paged.length > 0 && selected.size === paged.length}
                  onChange={toggleSelectAll}
                  className="accent-white"
                />
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Name</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Shop Type</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Sub Services</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Status</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Odo Out Required</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  {isDeletedView ? "No deleted services found." : "No services found."}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => (
                <tr key={row._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(row._id)}
                      onChange={() => toggleSelect(row._id)}
                      className="accent-ad-purple"
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="text-blue-700 hover:underline"
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{shopTypeLabel(row.shopType)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.subServices?.length ?? 0}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.status || "Active"}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.odoOutRequired ? "Yes" : "No"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <TableEntriesSummary total={filtered.length} page={page} pageSize={entriesPerPage} />
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
