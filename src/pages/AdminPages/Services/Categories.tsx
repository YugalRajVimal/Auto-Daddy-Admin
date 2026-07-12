import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import { useAdminDeletedView } from "../../../hooks/useAdminDeletedView";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";
import type { ShopType, Service } from "./Services";

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

type SubServiceStatus = "active" | "inactive";

interface SubService {
  name: string;
  status: SubServiceStatus;
}

type SubServiceRow = SubService & {
  categoryName: string;
  categoryId: string;
  shopType?: ShopType;
};

const SHOP_TYPE_OPTIONS: { value: ShopType; label: string }[] = [
  { value: "autoShop", label: "Auto Shop" },
  { value: "tyreShop", label: "Tyre Shop" },
  { value: "carWash", label: "Car Wash" },
  { value: "towTruck", label: "Tow Truck" },
];

const getRowId = (row: SubServiceRow) => `${row.categoryId}::${row.name}`;

type SubServicesPageProps = {
  initialShowForm?: boolean;
};

export default function SubServicesPage({ initialShowForm = false }: SubServicesPageProps) {
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
  const [filterServiceId, setFilterServiceId] = useState("");
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingRow, setEditingRow] = useState<SubServiceRow | null>(null);
  const [formName, setFormName] = useState("");
  const [formStatus, setFormStatus] = useState<SubServiceStatus>("active");
  const [formServiceId, setFormServiceId] = useState("");

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
  } = useAdminDeletedView<SubServiceRow>({
    onToggle: resetTableControls,
    storageKey: "admin_deleted_view:categories",
  });

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
        const msg = "Failed to fetch sub services.";
        setError(msg);
        adminNotify.error(msg);
      }
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      const __adminMsg = axErr?.response?.data?.message || axErr?.message || "Error fetching sub services";
      setError(__adminMsg);
      adminNotify.error(__adminMsg);
    } finally {
      setLoading(false);
    }
  };

  const allRows: SubServiceRow[] = services.flatMap((svc) =>
    (svc.subServices || []).map((sub) => ({
      name: sub.name,
      status: (sub.status as SubServiceStatus) || "active",
      categoryName: svc.name,
      categoryId: svc._id,
      shopType: svc.shopType,
    }))
  );

  const displayRows = isDeletedView ? deletedStash : allRows;

  const tableRows = (filterServiceId
    ? displayRows.filter((r) => r.categoryId === filterServiceId)
    : displayRows
  ).filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.categoryName.toLowerCase().includes(search.toLowerCase()) ||
      SHOP_TYPE_OPTIONS.find((o) => o.value === r.shopType)?.label.toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(tableRows.length / entriesPerPage));
  const paged = tableRows.slice((page - 1) * entriesPerPage, page * entriesPerPage);

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
    else setSelected(new Set(paged.map((r) => getRowId(r))));
  };

  const resetForm = () => {
    setFormName("");
    setFormStatus("active");
    setFormServiceId(filterServiceId);
    setEditingRow(null);
    setError("");
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: SubServiceRow) => {
    setFormName(row.name);
    setFormStatus(row.status || "active");
    setFormServiceId(row.categoryId);
    setEditingRow(row);
    setError("");
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      const __adminMsg = "Sub service name is required.";
      setError(__adminMsg);
      adminNotify.error(__adminMsg);
      return;
    }
    if (!formServiceId) {
      const __adminMsg = "Please select a service.";
      setError(__adminMsg);
      adminNotify.error(__adminMsg);
      return;
    }
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const parent = services.find((s) => s._id === formServiceId);
      if (!parent) {
        const __adminMsg = "Selected service not found.";
      setError(__adminMsg);
      adminNotify.error(__adminMsg);
        return;
      }
      const existing: SubService[] = (parent.subServices || []).map((s) => ({
        name: s.name,
        status: (s.status as SubServiceStatus) || "active",
      }));
      let updated: SubService[];
      if (editingRow) {
        updated = existing.map((s) =>
          s.name === editingRow.name
            ? { name: formName.trim(), status: formStatus }
            : s
        );
      } else {
        updated = [...existing, { name: formName.trim(), status: formStatus }];
      }
      await axios.put(`${API_BASE}/admin/services/${formServiceId}`, { subServices: updated });
      adminNotify.success(editingRow ? "Sub service updated." : "Sub service added.");
      setSuccessMsg(editingRow ? "Sub service updated." : "Sub service added.");
      resetForm();
      setShowForm(false);
      fetchServices();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      const __adminMsg = axErr?.response?.data?.message || axErr?.message || "Error saving sub service";
      setError(__adminMsg);
      adminNotify.error(__adminMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (row: SubServiceRow) => {
    if (!window.confirm(`Delete sub service "${row.name}"?`)) return;
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const parent = services.find((s) => s._id === row.categoryId);
      if (!parent) return;
      const updated = (parent.subServices || []).filter((s) => s.name !== row.name);
      await axios.put(`${API_BASE}/admin/services/${row.categoryId}`, { subServices: updated });
      stashDeleted(row);
      adminNotify.success("Sub service deleted successfully.");
      setSuccessMsg("Sub service deleted successfully.");
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(getRowId(row));
        return next;
      });
      fetchServices();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      const __adminMsg = axErr?.response?.data?.message || axErr?.message || "Failed to delete sub service";
      setError(__adminMsg);
      adminNotify.error(__adminMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const findRowById = (id: string) =>
    (isDeletedView ? deletedStash : allRows).find((r) => getRowId(r) === id);

  const handleToolbarDelete = () => {
    if (selected.size !== 1) return;
    const row = findRowById([...selected][0]);
    if (row) handleDelete(row);
  };

  const handleRestore = async () => {
    if (selected.size !== 1) return;
    const row = deletedStash.find((r) => getRowId(r) === [...selected][0]);
    if (!row) return;
    if (!window.confirm(`Restore sub service "${row.name}"?`)) return;
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const parent = services.find((s) => s._id === row.categoryId);
      if (!parent) {
        const __adminMsg = "Parent service not found.";
        setError(__adminMsg);
        adminNotify.error(__adminMsg);
        return;
      }
      const existing: SubService[] = (parent.subServices || []).map((s) => ({
        name: s.name,
        status: (s.status as SubServiceStatus) || "active",
      }));
      const updated = [...existing, { name: row.name, status: row.status || "active" }];
      await axios.put(`${API_BASE}/admin/services/${row.categoryId}`, { subServices: updated });
      restoreStashed((item) => getRowId(item) === getRowId(row));
      adminNotify.success("Sub service restored.");
      setSuccessMsg("Sub service restored.");
      setSelected(new Set());
      fetchServices();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      const __adminMsg = axErr?.response?.data?.message || axErr?.message || "Failed to restore sub service";
      setError(__adminMsg);
      adminNotify.error(__adminMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToolbarPrint = () => {
    printAdminTable({
      title: isDeletedView ? "Deleted Sub Services" : "Sub Services",
      headers: ["Name", "Service", "Shop Type", "Status"],
      rows: tableRows.map((row) => [
          row.name,
          row.categoryName,
          shopTypeLabel(row.shopType),
          row.status || "active",
        ]),
    });
  };

  const shopTypeLabel = (value?: ShopType) =>
    SHOP_TYPE_OPTIONS.find((o) => o.value === value)?.label || "—";

  const formMessage = editingRow
    ? "You are updating a 'Sub Service'"
    : "You are creating a 'Sub Service'";

  return (
    <AdminPage
      title={isDeletedView ? "Deleted Sub Services" : "Sub Services"}
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
                    ? (editingRow ? "Updating..." : "Saving...")
                    : (editingRow ? "Update" : "Save")
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
              <CompactField label="Service" required>
                <select
                  value={formServiceId}
                  onChange={(e) => setFormServiceId(e.target.value)}
                  className={compactInputClass}
                >
                  <option value="">Select Service</option>
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </CompactField>
              <CompactField label="Sub Service Name" required>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Status" required>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as SubServiceStatus)}
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
        <AdminDeletedBanner count={deletedStash.length} entityLabel="sub services" />
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
                setFilterServiceId("");
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
          <div className="flex items-center gap-1 text-xs text-gray-700">
            <span>Service:</span>
            <select
              value={filterServiceId}
              onChange={(e) => {
                setFilterServiceId(e.target.value);
                setPage(1);
                setSelected(new Set());
              }}
              className="border border-gray-400 bg-white px-2 py-1 text-xs"
            >
              <option value="">All Services</option>
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
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
              <th className="border border-ad-purple-dark px-2 py-2 text-center">
                <input
                  type="checkbox"
                  checked={paged.length > 0 && selected.size === paged.length}
                  onChange={toggleSelectAll}
                  className="accent-white"
                />
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Name</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Service</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Shop Type</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Status</th>
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
                  {isDeletedView ? "No deleted sub services found." : "No sub services found."}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => (
                <tr key={getRowId(row)} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(getRowId(row))}
                      onChange={() => toggleSelect(getRowId(row))}
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
                  <td className="border border-gray-300 px-3 py-2 text-center text-xs font-medium uppercase tracking-wide">
                    {row.categoryName}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{shopTypeLabel(row.shopType)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center capitalize">{row.status || "active"}</td>
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
        <AdminDeletedToggle viewMode={viewMode} onToggle={toggleViewMode} activeLabel="Active Sub Services" />
      </div>
    </AdminPage>
  );
}
