
import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { AdminDataTable, tableCell } from "../../../components/admin/AdminDataTable";

export type ShopType = "all" | "autoShop" | "tyreShop" | "carWash" | "towTruck";

export interface SubService {
  _id?: string;
  name: string;
  status: "active" | "inactive";
  // Optionally, you could also add shopType to subService if backend supports
}
export interface Service {
  _id: string;
  name: string;
  status: "active" | "inactive";
  shopType?: ShopType; // add shopType to service
  subServices?: SubService[];
}

const SHOP_TYPE_LIST: { value: ShopType; label: string }[] = [
  { value: "all", label: "All Shop Types" },
  { value: "autoShop", label: "Auto Shop" },
  { value: "tyreShop", label: "Tyre Shop" },
  { value: "carWash", label: "Car Wash" },
  { value: "towTruck", label: "Tow Truck" },
];

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Service[]>([]);
  // "" means "All Categories"
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [subCategories, setSubCategories] = useState<SubService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [subCategoryForm, setSubCategoryForm] = useState<SubService>({ name: "", status: "active" });
  const inputRef = useRef<HTMLInputElement>(null);

  // Table controls
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCols, setVisibleCols] = useState(["name", "categoryName", "shopType", "status"]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Shop type filter
  const [shopType, setShopType] = useState<ShopType>("all");

  useEffect(() => {
    fetchCategories();
  }, [shopType]);

  useEffect(() => {
    if (selectedCategoryId) {
      const category = categories.find((s) => s._id === selectedCategoryId);
      setSubCategories(category?.subServices || []);
      setCurrentPage(1);
    } else {
      setSubCategories([]);
      setCurrentPage(1);
    }
  }, [selectedCategoryId, categories]);

  const clearAlerts = () => {
    setError("");
    setSuccessMsg("");
  };

  const fetchCategories = async () => {
    setLoading(true);
    clearAlerts();
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      // Pass shopType as filter if not "all"
      let url = `${baseURL}/api/admin/services`;
      if (shopType && shopType !== "all") {
        url += `?shopType=${shopType}`;
      }
      const response = await axios.get(url);
      if (response.data.success) setCategories(response.data.data);
      else setError("Failed to fetch categories.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error fetching categories");
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setShowModal(true);
    setEditingIndex(null);
    setSubCategoryForm({ name: "", status: "active" });
    setTimeout(() => inputRef.current?.focus(), 120);
  };

  const saveSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId) {
      setError("Please select a category first.");
      return;
    }
    clearAlerts();
    const updated =
      editingIndex !== null
        ? subCategories.map((s, i) => (i === editingIndex ? { ...s, ...subCategoryForm } : s))
        : [...subCategories, { ...subCategoryForm }];
    try {
      setLoading(true);
      const baseURL = import.meta.env.VITE_API_URL;
      // Note: backend route/prop is still "services" and "subServices"
      await axios.put(`${baseURL}/api/admin/services/${selectedCategoryId}`, { subServices: updated });
      setSuccessMsg(editingIndex !== null ? "Category updated." : "Category added.");
      setShowModal(false);
      await fetchCategories();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error saving category.");
    }
    setLoading(false);
  };

  // -- Filtering logic for "All Categories" or filtered by one category, also filter by shopType --
  // If selectedCategoryId is set, show only subcategories under that category, else show all
  const allCategories = categories.flatMap((cat) =>
    (cat.subServices || []).map((sub) => ({
      ...sub,
      categoryName: cat.name,
      categoryId: cat._id,
      shopType: cat.shopType,
    }))
  );

  // Filtering for table
  const filterCategoriesForTable = () => {
    let filtered: (SubService & { categoryName: string; categoryId: string; shopType?: ShopType })[] = [];

    if (selectedCategoryId) {
      // Only subCategories for selected category
      const cat = categories.find((s) => s._id === selectedCategoryId);
      const subs = (cat?.subServices || []).map((sub) => ({
        ...sub,
        categoryName: cat?.name || "",
        categoryId: cat?._id || "",
        shopType: cat?.shopType,
      }));
      filtered = subs;
    } else {
      // "All Categories"
      filtered = allCategories;
    }

    // ShopType filter is already handled server side, but if in the future the backend sends all, filter here as fallback
    if (shopType !== "all") {
      filtered = filtered.filter((c) => c.shopType === shopType);
    }

    // Search filtering
    return filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.categoryName.toLowerCase().includes(search.toLowerCase()) ||
        (c.shopType && SHOP_TYPE_LIST.find((t) => t.value === c.shopType)?.label.toLowerCase().includes(search.toLowerCase()))
    );
  };

  const filteredForTable = filterCategoriesForTable();

  type TableRow = SubService & { categoryName: string; categoryId: string; shopType?: ShopType };
  const getRowId = (row: TableRow) => `${row.categoryId}::${row.name}`;

  const openEditFromRow = (cat: TableRow) => {
    setSelectedCategoryId(cat.categoryId);
    const category = categories.find((c) => c._id === cat.categoryId);
    const subIdx = (category?.subServices || []).findIndex((s) => s.name === cat.name);
    if (subIdx !== -1) {
      setEditingIndex(subIdx);
      setSubCategoryForm({ name: cat.name, status: cat.status });
      setShowModal(true);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  };

  const tableColumns = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        render: (cat: TableRow) => tableCell(<span style={{ fontWeight: 500 }}>{cat.name}</span>),
        exportValue: (cat: TableRow) => cat.name,
      },
      {
        key: "categoryName",
        label: "Category",
        render: (cat: TableRow) =>
          tableCell(<span style={{ textTransform: "uppercase", fontSize: 12, fontWeight: 600 }}>{cat.categoryName}</span>),
        exportValue: (cat: TableRow) => cat.categoryName,
      },
      {
        key: "shopType",
        label: "Shop Type",
        render: (cat: TableRow) =>
          tableCell(SHOP_TYPE_LIST.find((type) => type.value === cat.shopType)?.label || "-"),
        exportValue: (cat: TableRow) =>
          SHOP_TYPE_LIST.find((type) => type.value === cat.shopType)?.label || "-",
      },
      {
        key: "status",
        label: "Status",
        render: (cat: TableRow) =>
          tableCell(
            <ToggleSwitch
              active={cat.status === "active"}
              onToggle={async () => {
                const category = categories.find((c) => c._id === cat.categoryId);
                if (!category) return;
                const newStatus = cat.status === "active" ? "inactive" : "active";
                const updatedSubs = (category.subServices || []).map((s) =>
                  s.name === cat.name ? { ...s, status: newStatus as "active" | "inactive" } : s
                );
                try {
                  const baseURL = import.meta.env.VITE_API_URL;
                  await axios.put(`${baseURL}/api/admin/services/${category._id}`, { subServices: updatedSubs });
                  await fetchCategories();
                } catch {
                  setError("Error updating status");
                }
              }}
            />
          ),
        exportValue: (cat: TableRow) => cat.status,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categories]
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white py-4 md:py-5 font-sans">
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

      {/* Card */}
      <div className="mb-10 bg-white rounded shadow-sm">
        {/* Card Header with Category dropdown and shopType filter */}
        <div className="flex flex-wrap items-center justify-between px-5 py-4 border-b border-gray-200 gap-3">
          <span className="text-base font-medium text-gray-700 flex items-center gap-3">
            Category List
         
          </span>

          <div className="flex gap-2 ">
    {/* Add ShopType filter dropdown */}
    <div className="flex items-center gap-2">
            <label htmlFor="shopTypeFilter" className="text-sm font-medium text-gray-700">Shop Type:</label>
            <select
              id="shopTypeFilter"
              value={shopType}
              onChange={(e) => {
                setShopType(e.target.value as ShopType);
                setSelectedCategoryId("");
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
              style={{ minWidth: 145 }}
            >
              {SHOP_TYPE_LIST.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setCurrentPage(1);
              }}
              className="ml-3 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
              style={{ minWidth: 170 }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          <button

            onClick={openAddModal}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
          >
            <span className="text-lg leading-none">+</span> Add Category
          </button>
          </div>
      
        </div>

        <div className="px-5 pb-5">
          <AdminDataTable
            items={filteredForTable}
            columns={tableColumns}
            getRowId={getRowId}
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
            exportFilename="sub-categories"
            totalBeforeFilter={allCategories.length}
            extraToolbarActions={[
              {
                label: "✏️ Update",
                color: "#0073b7",
                minSelected: 1,
                maxSelected: 1,
                onClick: (ids) => {
                  const row = filteredForTable.find((c) => getRowId(c) === ids[0]);
                  if (row) openEditFromRow(row);
                },
              },
            ]}
            renderActions={(cat) => (
              <button
                onClick={() => openEditFromRow(cat)}
                className="w-8 h-8 rounded flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                aria-label={`Edit ${cat.name}`}
                type="button"
              >
                <EditIcon />
              </button>
            )}
          />
        </div>
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
                {editingIndex !== null ? "Edit Category" : "Add New Category"}
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
              {error && (
                <div className="mb-3 text-sm rounded bg-red-100 text-red-700 px-3 py-2 border border-red-200">
                  {error}
                </div>
              )}
              <form onSubmit={saveSubCategory} autoComplete="off">
                <div className="mb-4">
                  <label className="block mb-1.5 font-semibold text-gray-800 text-sm">
                    Category Name
                  </label>
                  <input
                    type="text"
                    ref={inputRef}
                    value={subCategoryForm.name}
                    required
                    onChange={(e) =>
                      setSubCategoryForm((p) => ({
                        ...p,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400 bg-white placeholder:text-gray-400"
                    placeholder="Enter category name"
                  />
                </div>

                <div className="mb-4">
                  <label className="block mb-1.5 font-semibold text-gray-800 text-sm">Select Category</label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400 bg-white text-gray-600"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block mb-1.5 font-semibold text-gray-800 text-sm">
                    Shop Type
                  </label>
                  <div className="text-xs text-gray-700 mt-1">
                    {SHOP_TYPE_LIST.find((t) => t.value === shopType)?.label || ""}
                  </div>
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
                    {editingIndex !== null ? "Update Category" : "Add Category"}
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
    className="flex items-center focus:outline-none"
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

export default CategoriesPage;