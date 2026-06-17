
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

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
  const totalPagesCurrent = Math.max(1, Math.ceil(filteredForTable.length / pageSize));
  const paginatedCurrent = filteredForTable.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const showingFromCurrent = filteredForTable.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingToCurrent = Math.min(currentPage * pageSize, filteredForTable.length);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-4 md:px-6 md:py-5 font-sans">
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

        {/* Table Controls */}
        <div className="flex items-center justify-between px-5 py-3 flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            Show
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            entries
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            Search:
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-44"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-16 gap-3">
            <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-blue-600 text-sm font-medium">Loading...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-16">
                    <span className="flex items-center gap-1">
                      ID <SortIcon />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    <span className="flex items-center gap-1">
                      Name <SortIcon />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-56">
                    <span className="flex items-center gap-1">
                      Category <SortIcon />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-40">
                    <span className="flex items-center gap-1">
                      Shop Type <SortIcon />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-32">
                    <span className="flex items-center gap-1">
                      Status <SortIcon />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-28">
                    <span className="flex items-center gap-1">
                      Actions <SortIcon />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedCurrent.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  paginatedCurrent.map((cat, idx) => (
                    <tr
                      key={`${cat.categoryId}-${idx}`}
                      className={`border-b border-gray-100 ${idx % 2 === 1 ? "bg-white" : "bg-[#f9f9f9]"}`}
                    >
                      <td className="px-4 py-3 text-gray-700">{showingFromCurrent + idx}</td>
                      <td className="px-4 py-3 text-gray-800">{cat.name}</td>
                      <td className="px-4 py-3 text-gray-700 uppercase text-xs font-medium tracking-wide">
                        {cat.categoryName}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs font-medium tracking-wide capitalize">
                        {
                          SHOP_TYPE_LIST.find((type) => type.value === cat.shopType)?.label ||
                          "-"
                        }
                      </td>
                      <td className="px-4 py-3">
                        <ToggleSwitch
                          active={cat.status === "active"}
                          onToggle={async () => {
                            const category = categories.find((c) => c._id === cat.categoryId);
                            if (!category) return;
                            const newStatus = cat.status === "active" ? "inactive" : "active";
                            const updatedSubs = (category.subServices || []).map((s) =>
                              s.name === cat.name
                                ? { ...s, status: newStatus as "active" | "inactive" }
                                : s
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
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedCategoryId(cat.categoryId);
                            const category = categories.find((c) => c._id === cat.categoryId);
                            const subIdx = (category?.subServices || []).findIndex((s) => s.name === cat.name);
                            if (subIdx !== -1) {
                              setEditingIndex(subIdx);
                              setSubCategoryForm({ name: cat.name, status: cat.status });
                              setShowModal(true);
                              setTimeout(() => inputRef.current?.focus(), 120);
                            }
                          }}
                          className="w-8 h-8 rounded flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                          aria-label={`Edit ${cat.name}`}
                        >
                          <EditIcon />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 text-sm text-gray-600">
          <span>
            {filteredForTable.length === 0
              ? "Showing 0 entries"
              : `Showing ${showingFromCurrent} to ${showingToCurrent} of ${filteredForTable.length} entries`}
          </span>
          <div className="flex items-center gap-1">
            <PaginationBtn label="Previous" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} />
            {Array.from({ length: totalPagesCurrent }, (_, i) => i + 1).map((p) => (
              <PaginationBtn key={p} label={String(p)} active={p === currentPage} onClick={() => setCurrentPage(p)} />
            ))}
            <PaginationBtn label="Next" disabled={currentPage === totalPagesCurrent} onClick={() => setCurrentPage((p) => p + 1)} />
          </div>
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

const SortIcon = () => (
  <svg className="w-3 h-3 text-gray-400 flex-shrink-0" viewBox="0 0 10 14" fill="currentColor">
    <path d="M5 0L9 5H1L5 0Z" />
    <path d="M5 14L1 9H9L5 14Z" />
  </svg>
);

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

const PaginationBtn: React.FC<{
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}> = ({ label, onClick, active, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1 text-sm rounded border transition-colors ${
      active
        ? "bg-blue-600 text-white border-blue-600"
        : disabled
        ? "text-gray-400 border-gray-200 cursor-not-allowed bg-white"
        : "text-gray-600 border-gray-300 bg-white hover:bg-gray-50"
    }`}
  >
    {label}
  </button>
);

export default CategoriesPage;