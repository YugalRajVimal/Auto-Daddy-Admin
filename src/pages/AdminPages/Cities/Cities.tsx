
import React, { useEffect, useState, useMemo, FormEvent, ChangeEvent } from "react";
import axios, { AxiosError } from "axios";
import { AdminDataTable, tableCell } from "../../../components/admin/AdminDataTable";

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

type CityStatus = "Active" | "Inactive";
type ProvinceStatus = "Active" | "Inactive";

interface City {
  name: string;
  _id?: string;
  status?: CityStatus;
  createdAt?: string;
}

interface Province {
  _id: string;
  name: string;
  nickName?: string;
  status?: ProvinceStatus;
  cities: City[];
}

type CityRow = City & { provinceName: string; provinceId: string };

const getCityRowId = (city: CityRow) => `${city.provinceId}-${city.name}`;

/* ── Shared sub-components ── */
const EditIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" fill="currentColor" />
  </svg>
);
const DeleteIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
    <path d="M6.5 4a1 1 0 011-1h5a1 1 0 011 1v1h4a1 1 0 110 2h-1v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 110-2h4V4zm2 0v1h3V4h-3zm-3 3h9v10H5V7zm3 2a1 1 0 012 0v5a1 1 0 11-2 0V9z" fill="currentColor" />
  </svg>
);
const ToggleSwitch: React.FC<{ active: boolean; onToggle: () => void }> = ({ active, onToggle }) => (
  <button type="button" onClick={onToggle} className="flex items-center focus:outline-none">
    <span className={`flex items-center px-2 py-0.5 rounded-l text-xs font-bold leading-5 min-w-[34px] justify-center transition-colors ${active ? "bg-green-500 text-white" : "bg-gray-300 text-gray-500"}`}>
      ON
    </span>
    <span className="w-5 h-6 bg-white border border-gray-300 rounded-r flex items-center justify-center">
      <span className={`w-2.5 h-2.5 rounded-full border-2 transition-colors ${active ? "border-green-500 bg-green-500" : "border-gray-400 bg-gray-300"}`} />
    </span>
  </button>
);

const Cities: React.FC = () => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [formName, setFormName] = useState("");
  const [formStatus, setFormStatus] = useState<CityStatus>("Active");
  const [formProvinceId, setFormProvinceId] = useState<string>("");

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCols, setVisibleCols] = useState(["name", "provinceName", "status"]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => { fetchProvinces(); }, []);

  const fetchProvinces = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get<{ data: Province[] }>(`${API_BASE}/admin/provinces`);
      const data = res.data.data || [];
      setProvinces(data);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(axErr?.response?.data?.message || axErr?.message || "Failed to fetch provinces");
    } finally { setLoading(false); }
  };

  const openAddModal = () => {
    setEditingCity(null);
    setFormName("");
    setFormStatus("Active");
    setFormProvinceId(selectedProvinceId);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (city: City, provinceId: string) => {
    setEditingCity(city);
    setFormName(city.name);
    setFormStatus(city.status || "Active");
    setFormProvinceId(provinceId);
    setError("");
    setShowModal(true);
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formProvinceId) { setError("Please select a province."); return; }
    setActionLoading(true);
    setError(""); setSuccessMsg("");
    try {
      if (editingCity) {
        await axios.patch(
          `${API_BASE}/admin/provinces/${formProvinceId}/cities/${encodeURIComponent(editingCity.name)}`,
          { name: formName.trim(), status: formStatus }
        );
        setSuccessMsg("City updated successfully.");
      } else {
        await axios.post(`${API_BASE}/admin/provinces/${formProvinceId}/cities`, { name: formName.trim(), status: formStatus });
        setSuccessMsg("City added successfully.");
      }
      setShowModal(false);
      fetchProvinces();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(axErr?.response?.data?.message || axErr?.message || "Error saving city");
    } finally { setActionLoading(false); }
  };

  const handleToggleStatus = async (city: City, provinceId: string) => {
    const newStatus: CityStatus = city.status === "Active" ? "Inactive" : "Active";
    try {
      await axios.patch(
        `${API_BASE}/admin/provinces/${provinceId}/cities/${encodeURIComponent(city.name)}`,
        { name: city.name, status: newStatus }
      );
      fetchProvinces();
    } catch { setError("Error updating status"); }
  };

  const handleDelete = async (city: City, provinceId: string) => {
    if (!window.confirm(`Delete city "${city.name}"?`)) return;
    setActionLoading(true);
    setError(""); setSuccessMsg("");
    try {
      await axios.delete(`${API_BASE}/admin/provinces/${provinceId}/cities/${encodeURIComponent(city.name)}`);
      setSuccessMsg("City deleted successfully.");
      fetchProvinces();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(axErr?.response?.data?.message || axErr?.message || "Failed to delete city");
    } finally { setActionLoading(false); }
  };

  const allCities: CityRow[] = selectedProvinceId
    ? (provinces.find((p) => p._id === selectedProvinceId)?.cities || []).map((c) => ({
        ...c,
        provinceName: provinces.find((p) => p._id === selectedProvinceId)?.name || "",
        provinceId: selectedProvinceId,
      }))
    : provinces.flatMap((p) => (p.cities || []).map((c) => ({ ...c, provinceName: p.name, provinceId: p._id })));

  const filtered = allCities.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.provinceName.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProvince = provinces.find((p) => p._id === selectedProvinceId);

  const findCityById = (id: string) => allCities.find((c) => getCityRowId(c) === id);

  const tableColumns = useMemo(
    () => [
      {
        key: "name",
        label: "City Name",
        render: (city: CityRow) => tableCell(<span style={{ fontWeight: 500 }}>{city.name}</span>),
        exportValue: (city: CityRow) => city.name,
      },
      {
        key: "provinceName",
        label: "Province",
        render: (city: CityRow) =>
          tableCell(
            <span style={{ textTransform: "uppercase", fontSize: 12, fontWeight: 500, letterSpacing: "0.04em" }}>
              {city.provinceName}
            </span>
          ),
        exportValue: (city: CityRow) => city.provinceName,
      },
      {
        key: "status",
        label: "Status",
        render: (city: CityRow) =>
          tableCell(
            <ToggleSwitch active={city.status !== "Inactive"} onToggle={() => handleToggleStatus(city, city.provinceId)} />
          ),
        exportValue: (city: CityRow) => city.status || "Active",
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provinces]
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-ad-app-bg py-4 md:py-5 font-sans">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">City Management</h1>
        <div className="text-sm text-right">
          <span className="text-blue-600 hover:underline cursor-pointer">Dashboard</span>
          <span className="text-gray-500"> / Cities</span>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="mb-3 text-sm rounded bg-red-100 text-red-800 px-3 py-2 border border-red-200">{error}</div>}
      {successMsg && <div className="mb-3 text-sm rounded bg-green-100 text-green-800 px-3 py-2 border border-green-200">{successMsg}</div>}

      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <span className="text-base font-medium text-gray-700">City List</span>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Province:</span>
            <select
              value={selectedProvinceId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => { setSelectedProvinceId(e.target.value); setCurrentPage(1); }}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 bg-white text-gray-700 min-w-[180px]"
            >
              <option value="">All Provinces</option>
              {provinces.map((p) => (
                <option key={p._id} value={p._id}>{p.name}{p.nickName ? ` (${p.nickName})` : ""}</option>
              ))}
            </select>
          </div>
          <button
            onClick={openAddModal}
            style={{ background: "#00a65a", color: "#fff", padding: "8px 18px", borderRadius: 4, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            + Add City
          </button>
        </div>
      </div>

      <div className="mb-10">
        <AdminDataTable
          items={filtered}
          columns={tableColumns}
          getRowId={getCityRowId}
          loading={loading}
          emptyMessage={
            selectedProvinceId
              ? `No cities found in ${selectedProvince?.name || "this province"}.`
              : "No cities found."
          }
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
          exportFilename="cities"
          totalBeforeFilter={allCities.length}
          extraToolbarActions={[
            {
              label: "✏️ Update",
              color: "#0073b7",
              minSelected: 1,
              maxSelected: 1,
              onClick: (ids) => {
                const city = findCityById(ids[0]);
                if (city) openEditModal(city, city.provinceId);
              },
            },
            {
              label: "🗑 Delete",
              color: "#e74c3c",
              minSelected: 1,
              maxSelected: 1,
              onClick: (ids) => {
                const city = findCityById(ids[0]);
                if (city) handleDelete(city, city.provinceId);
              },
            },
          ]}
          renderActions={(city) => (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openEditModal(city, city.provinceId)}
                className="w-8 h-8 rounded flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                aria-label={`Edit ${city.name}`}
                type="button"
              >
                <EditIcon />
              </button>
              <button
                onClick={() => handleDelete(city, city.provinceId)}
                disabled={actionLoading}
                className="w-8 h-8 rounded flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                aria-label={`Delete ${city.name}`}
                type="button"
              >
                <DeleteIcon />
              </button>
            </div>
          )}
        />
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded shadow-xl w-full max-w-md mx-4 animate-fadein" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <h3 className="text-lg font-semibold text-gray-800">{editingCity ? "Edit City" : "Add New City"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800 text-xl leading-none">×</button>
            </div>
            <hr className="border-gray-200" />
            <div className="px-6 py-5 bg-blue-50/40">
              {error && <div className="mb-3 text-sm rounded bg-red-100 text-red-700 px-3 py-2 border border-red-200">{error}</div>}
              <form onSubmit={handleFormSubmit} autoComplete="off">
                <div className="mb-4">
                  <label className="block mb-1.5 font-semibold text-gray-800 text-sm">City Name</label>
                  <input type="text" required autoFocus
                    value={formName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400 bg-white placeholder:text-gray-400"
                    placeholder="Enter city name" />
                </div>
                <div className="mb-4">
                  <label className="block mb-1.5 font-semibold text-gray-800 text-sm">Select Province</label>
                  <select required
                    value={formProvinceId}
                    onChange={(e) => setFormProvinceId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400 bg-white text-gray-600">
                    <option value="">Select Province</option>
                    {provinces.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}{p.nickName ? ` (${p.nickName})` : ""}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block mb-1.5 font-semibold text-gray-800 text-sm">Status</label>
                  <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as CityStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400 bg-white">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="px-5 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition">
                    Close
                  </button>
                  <button type="submit" disabled={actionLoading}
                    className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:opacity-70">
                    {actionLoading ? "Saving..." : editingCity ? "Update City" : "Add City"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadein { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: none; } }
        .animate-fadein { animation: fadein .2s cubic-bezier(.4,1,.6,1) both; }
      `}</style>
    </div>
  );
};

export default Cities;
