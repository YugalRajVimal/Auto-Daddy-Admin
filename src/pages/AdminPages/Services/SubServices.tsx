import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
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
import { useAdminDeletedView } from "../../../hooks/useAdminDeletedView";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";
import type { ShopType, Service } from "./Services";

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

type SubServiceStatus = "active" | "inactive";
type CreatedBy = "admin" | "shop";

interface SubService {
  name: string;
  status: SubServiceStatus;
  createdBy?: CreatedBy;
  shopkeeperName?: string;
  phone?: string;
}

type SubServiceRow = SubService & {
  categoryName: string;
  categoryId: string;
  shopType?: ShopType;
};

const normalizeCreatedBy = (value: unknown): CreatedBy => {
  const raw =
    typeof value === "string"
      ? value
      : value && typeof value === "object"
        ? String(
            (value as { type?: unknown; role?: unknown; createdBy?: unknown }).type ??
              (value as { role?: unknown }).role ??
              (value as { createdBy?: unknown }).createdBy ??
              ""
          )
        : "";
  const v = raw.trim().toLowerCase();
  if (v === "shop" || v === "shopkeeper" || v === "owner" || v === "business") return "shop";
  return "admin";
};

const pickShopkeeperName = (sub: Record<string, unknown>): string => {
  const nested =
    sub.shopkeeper && typeof sub.shopkeeper === "object"
      ? (sub.shopkeeper as Record<string, unknown>)
      : sub.createdBy && typeof sub.createdBy === "object"
        ? (sub.createdBy as Record<string, unknown>)
        : null;
  const value =
    sub.shopkeeperName ??
    sub.shopKeeperName ??
    sub.shopOwnerName ??
    sub.ownerName ??
    sub.businessName ??
    nested?.name ??
    nested?.businessName ??
    nested?.shopkeeperName ??
    "";
  return typeof value === "string" ? value.trim() : "";
};

const pickPhone = (sub: Record<string, unknown>): string => {
  const nested =
    sub.shopkeeper && typeof sub.shopkeeper === "object"
      ? (sub.shopkeeper as Record<string, unknown>)
      : sub.createdBy && typeof sub.createdBy === "object"
        ? (sub.createdBy as Record<string, unknown>)
        : null;
  const value =
    sub.phone ??
    sub.shopkeeperPhone ??
    sub.shopKeeperPhone ??
    sub.ownerPhone ??
    sub.businessPhone ??
    nested?.phone ??
    nested?.businessPhone ??
    "";
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
};

const mapApiSubService = (sub: Record<string, unknown> | SubService): SubService => ({
  name: String(sub.name ?? "").trim(),
  status: ((sub.status as SubServiceStatus) || "active"),
  createdBy: normalizeCreatedBy((sub as Record<string, unknown>).createdBy ?? (sub as Record<string, unknown>).created_by),
  shopkeeperName: pickShopkeeperName(sub as Record<string, unknown>) || undefined,
  phone: pickPhone(sub as Record<string, unknown>) || undefined,
});

const createdByLabel = (value?: CreatedBy) => (value === "shop" ? "Shop" : "Admin");

const SHOP_TYPE_OPTIONS: { value: ShopType; label: string }[] = [
  { value: "autoShop", label: "Auto Shop" },
  { value: "tyreShop", label: "Tyre Shop" },
  { value: "carWash", label: "Car Wash" },
  { value: "towTruck", label: "Tow Truck" },
];

const buildSubServiceSearchFields = (services: Service[] = []): AdminSearchField[] => [
  { key: "name", label: "Name" },
  {
    key: "service",
    label: "Service",
    type: "select",
    options: services.map((s) => ({ value: s._id, label: s.name })),
  },
  {
    key: "shopType",
    label: "Shop Type",
    type: "select",
    options: SHOP_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
  {
    key: "createdBy",
    label: "Created By",
    type: "select",
    options: [
      { value: "admin", label: "Admin" },
      { value: "shop", label: "Shop" },
    ],
  },
  { key: "shopkeeperName", label: "Shopkeeper Name" },
  { key: "phone", label: "Phone" },
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
  const [showSearchCard, setShowSearchCard] = useState(false);
  const [searchDraft, setSearchDraft] = useState(() => emptyAdminSearchValues(buildSubServiceSearchFields()));
  const [searchFilters, setSearchFilters] = useState(() => emptyAdminSearchValues(buildSubServiceSearchFields()));
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingRow, setEditingRow] = useState<SubServiceRow | null>(null);
  const [formName, setFormName] = useState("");
  const [formStatus, setFormStatus] = useState<SubServiceStatus>("active");
  const [formServiceId, setFormServiceId] = useState("");

  const searchFields = buildSubServiceSearchFields(services);

  const resetTableControls = () => {
    setPage(1);
    setSelected(new Set());
    setSearch("");
    const empty = emptyAdminSearchValues(searchFields);
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
  } = useAdminDeletedView<SubServiceRow>({
    onToggle: resetTableControls,
    storageKey: "admin_deleted_view:sub-services",
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get<{ success: boolean; data: Service[] }>(`${API_BASE}/admin/services`);
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
    (svc.subServices || []).map((sub) => {
      const mapped = mapApiSubService(sub as Record<string, unknown>);
      return {
        ...mapped,
        categoryName: svc.name,
        categoryId: svc._id,
        shopType: svc.shopType,
      };
    })
  );

  const displayRows = isDeletedView ? deletedStash : allRows;

  const tableRows = displayRows.filter((r) => {
    const q = search.toLowerCase();
    const live =
      !search.trim() ||
      r.name.toLowerCase().includes(q) ||
      r.categoryName.toLowerCase().includes(q) ||
      SHOP_TYPE_OPTIONS.find((o) => o.value === r.shopType)?.label.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q) ||
      createdByLabel(r.createdBy).toLowerCase().includes(q) ||
      (r.shopkeeperName || "").toLowerCase().includes(q) ||
      (r.phone || "").toLowerCase().includes(q);
    if (!live) return false;
    return (
      searchIncludes(r.name, searchFilters.name) &&
      searchEquals(r.categoryId, searchFilters.service) &&
      searchEquals(r.shopType, searchFilters.shopType) &&
      searchEquals(r.status || "active", searchFilters.status) &&
      searchEquals(r.createdBy || "admin", searchFilters.createdBy) &&
      searchIncludes(r.shopkeeperName, searchFilters.shopkeeperName) &&
      searchIncludes(r.phone, searchFilters.phone)
    );
  });

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
    setFormServiceId("");
    setEditingRow(null);
    setError("");
  };

  const openAdd = () => {
    resetForm();
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openEdit = (row: SubServiceRow) => {
    setFormName(row.name);
    setFormStatus(row.status || "active");
    setFormServiceId(row.categoryId);
    setEditingRow(row);
    setError("");
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openSearchCard = () => {
    setShowForm(false);
    setEditingRow(null);
    setSearchDraft({ ...searchFilters });
    setShowSearchCard((open) => !open);
  };

  const handleSearchCardSearch = () => {
    setSearchFilters({ ...searchDraft });
    setPage(1);
    setSelected(new Set());
  };

  const handleSearchCardReset = () => {
    const empty = emptyAdminSearchValues(searchFields);
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
      const existing: SubService[] = (parent.subServices || []).map((s) =>
        mapApiSubService(s as Record<string, unknown>)
      );
      let updated: SubService[];
      if (editingRow) {
        updated = existing.map((s) =>
          s.name === editingRow.name
            ? {
                ...s,
                name: formName.trim(),
                status: formStatus,
                createdBy: editingRow.createdBy || s.createdBy || "admin",
                shopkeeperName: editingRow.shopkeeperName || s.shopkeeperName,
                phone: editingRow.phone || s.phone,
              }
            : s
        );
      } else {
        updated = [
          ...existing,
          { name: formName.trim(), status: formStatus, createdBy: "admin" },
        ];
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
      const existing: SubService[] = (parent.subServices || []).map((s) =>
        mapApiSubService(s as Record<string, unknown>)
      );
      const updated = [
        ...existing,
        {
          name: row.name,
          status: row.status || "active",
          createdBy: row.createdBy || "admin",
          shopkeeperName: row.shopkeeperName,
          phone: row.phone,
        },
      ];
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
      headers: ["Name", "Service", "Shop Type", "Status", "Created By", "Shopkeeper Name", "Phone"],
      rows: tableRows.map((row) => [
          row.name,
          row.categoryName,
          shopTypeLabel(row.shopType),
          row.status || "active",
          createdByLabel(row.createdBy),
          row.shopkeeperName || "—",
          row.phone || "—",
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
      headerAction={!showForm && !showSearchCard && !isDeletedView ? <AddNewButton onClick={openAdd} /> : undefined}
      between={
        showSearchCard ? (
          <AdminSearchCard
            fields={searchFields}
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
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Service</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Shop Type</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Status</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Created By</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium" style={{ width: "14%" }}>Shopkeeper Name</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium" style={{ width: "14%" }}>Phone</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
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
                  <td className="border border-gray-300 px-3 py-2 text-center capitalize">
                    {createdByLabel(row.createdBy)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center" style={{ width: "14%" }}>
                    {row.shopkeeperName || "—"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center" style={{ width: "14%" }}>{row.phone || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <TableEntriesSummary total={tableRows.length} page={page} pageSize={entriesPerPage} />
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
