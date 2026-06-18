


import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { AdminDataTable, tableCell } from "../../../components/admin/AdminDataTable";

// Keep backend as-is (Service object, API endpoints), 
// but on the UI use "Category" instead of "Service"
// (i.e., use "Category" in all labels, titles, placeholders, etc.)
// Add shopType - all / autoShop / tyreShop / carWash / towTruck
// Also add filter - shopType

export type ShopType = "autoShop" | "tyreShop" | "carWash" | "towTruck";

export interface Service {
  _id: string;
  name: string;
  status: "active" | "inactive";
  shopType: ShopType;
}

type ServiceFormValues = Omit<Service, "_id">;

const SHOP_TYPE_OPTIONS: { value: ShopType; label: string }[] = [
  { value: "autoShop", label: "Auto Shop" },
  { value: "tyreShop", label: "Tyre Shop" },
  { value: "carWash", label: "Car Wash" },
  { value: "towTruck", label: "Tow Truck" },
];

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formValues, setFormValues] = useState<ServiceFormValues>({ name: "", status: "active", shopType: "autoShop" });
  const [successMsg, setSuccessMsg] = useState<string>("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Table controls
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCols, setVisibleCols] = useState(["name", "shopType", "status"]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // shop type filter
  const [filterShopType, setFilterShopType] = useState<"all" | ShopType>("all");

  useEffect(() => {
    fetchServices();
  }, [filterShopType]);

  const clearAlerts = () => { setError(""); setSuccessMsg(""); };

  // Fetch categories with optional shopType filter
  const fetchServices = async () => {
    setLoading(true);
    clearAlerts();
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      let url = `${baseURL}/api/admin/services`;
      if (filterShopType !== "all") url += `?shopType=${filterShopType}`;
      const response = await axios.get(url);
      if (response.data.success) setServices(response.data.data);
      else setError("Failed to fetch categories.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error fetching categories");
    }
    setLoading(false);
  };

  const openAddModal = () => {
    clearAlerts();
    setEditingService(null);
    setFormValues({ name: "", status: "active", shopType: "autoShop" });
    setShowModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 150);
  };

  const openEditModal = (service: Service) => {
    clearAlerts();
    setEditingService(service);
    setFormValues({ name: service.name, status: service.status || "active", shopType: service.shopType });
    setShowModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 150);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;
    try {
      if (editingService) {
        await axios.put(`${baseURL}/api/admin/services/${editingService._id}`, formValues);
        setSuccessMsg("Category updated successfully.");
      } else {
        await axios.post(`${baseURL}/api/admin/services`, formValues);
        setSuccessMsg("Category added successfully.");
      }
      setShowModal(false);
      fetchServices();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Error saving category");
    }
  };

  const handleToggleStatus = async (service: Service) => {
    const newStatus = service.status === "active" ? "inactive" : "active";
    const baseURL = import.meta.env.VITE_API_URL;
    try {
      await axios.put(`${baseURL}/api/admin/services/${service._id}`, { ...service, status: newStatus });
      fetchServices();
    } catch (err: any) {
      setError("Error updating status");
    }
  };

  // Filtered + paginated by name and filterShopType
  const filtered = services.filter((s) => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  const tableColumns = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        render: (service: Service) => tableCell(<span style={{ fontWeight: 500 }}>{service.name}</span>),
        exportValue: (service: Service) => service.name,
      },
      {
        key: "shopType",
        label: "Shop Type",
        render: (service: Service) =>
          tableCell(SHOP_TYPE_OPTIONS.find((opt) => opt.value === service.shopType)?.label || service.shopType),
        exportValue: (service: Service) =>
          SHOP_TYPE_OPTIONS.find((opt) => opt.value === service.shopType)?.label || service.shopType,
      },
      {
        key: "status",
        label: "Status",
        render: (service: Service) =>
          tableCell(
            <ToggleSwitch active={service.status === "active"} onToggle={() => handleToggleStatus(service)} />
          ),
        exportValue: (service: Service) => service.status,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [services]
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-ad-app-bg py-4 md:py-5 font-sans">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Category Management</h1>
        <div className="text-sm text-right">
          <span className="text-blue-600 hover:underline cursor-pointer">Dashboard</span>
          <span className="text-gray-500"> / Categories</span>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="mb-3 text-sm rounded bg-red-100 text-red-800 px-3 py-2 border border-red-200">{error}</div>}
      {successMsg && <div className="mb-3 text-sm rounded bg-green-100 text-green-800 px-3 py-2 border border-green-200">{successMsg}</div>}

      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <span className="text-base font-medium text-gray-700">Category List</span>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Shop type:</span>
            <select
              value={filterShopType}
              onChange={(e) => { setFilterShopType(e.target.value as ShopType | "all"); setCurrentPage(1); }}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="all">All</option>
              {SHOP_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={openAddModal}
            style={{ background: "#00a65a", color: "#fff", padding: "8px 18px", borderRadius: 4, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            + Add Category
          </button>
        </div>
      </div>

      <div className="mb-10">
        <AdminDataTable
          items={filtered}
          columns={tableColumns}
          getRowId={(s) => s._id}
          loading={loading}
          error={error || null}
          emptyMessage="No categories found."
          search={search}
          onSearchChange={setSearch}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          currentPage={currentPage}
          onCurrentPageChange={setCurrentPage}
          visibleColumnKeys={visibleCols}
          onVisibleColumnKeysChange={setVisibleCols}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          exportFilename="categories"
          totalBeforeFilter={services.length}
          extraToolbarActions={[
            {
              label: "✏️ Update",
              color: "#0073b7",
              minSelected: 1,
              maxSelected: 1,
              onClick: (ids) => {
                const service = services.find((s) => s._id === ids[0]);
                if (service) openEditModal(service);
              },
            },
          ]}
          renderActions={(service) => (
            <button
              onClick={() => openEditModal(service)}
              className="w-8 h-8 rounded flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white transition-colors"
              aria-label={`Edit ${service.name}`}
              type="button"
            >
              <EditIcon />
            </button>
          )}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded shadow-xl w-full max-w-md mx-4 animate-fadein"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingService ? "Edit Category" : "Add New Category"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-800 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <hr className="border-gray-200" />

            {/* Modal Body */}
            <div className="px-6 py-5 bg-blue-50/40">
              {error && <div className="mb-3 text-sm rounded bg-red-100 text-red-700 px-3 py-2 border border-red-200">{error}</div>}
              <form onSubmit={handleFormSubmit} autoComplete="off">
                <div className="mb-4">
                  <label className="block mb-1.5 font-semibold text-gray-800 text-sm">Category Name</label>
                  <input
                    type="text"
                    ref={nameInputRef}
                    value={formValues.name}
                    required
                    onChange={(e) => setFormValues((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400 bg-white placeholder:text-gray-400"
                    placeholder="Enter category name"
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1.5 font-semibold text-gray-800 text-sm">Shop Type</label>
                  <select
                    value={formValues.shopType}
                    onChange={e => setFormValues((p) => ({ ...p, shopType: e.target.value as ShopType }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400 bg-white"
                    required
                  >
                    {SHOP_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                  >
                    {editingService ? "Update Category" : "Add Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: none; }
        }
        .animate-fadein { animation: fadein .2s cubic-bezier(.4,1,.6,1) both; }
      `}</style>
    </div>
  );
};

/* ── Shared sub-components ── */


const EditIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
    <path
      d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
      fill="currentColor"
    />
  </svg>
);

const ToggleSwitch: React.FC<{ active: boolean; onToggle: () => void }> = ({ active, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={active ? "Set inactive" : "Set active"}
    className="flex items-center gap-0 focus:outline-none"
  >
    <span
      className={`flex items-center px-2 py-0.5 rounded-l text-xs font-bold leading-5 min-w-[34px] justify-center transition-colors ${
        active ? "bg-green-500 text-white" : "bg-gray-300 text-gray-500"
      }`}
    >
      ON
    </span>
    <span className="w-5 h-6 bg-white border border-gray-300 rounded-r flex items-center justify-center">
      <span
        className={`w-2.5 h-2.5 rounded-full border-2 transition-colors ${
          active ? "border-green-500 bg-green-500" : "border-gray-400 bg-gray-300"
        }`}
      />
    </span>
  </button>
);

export default Services;