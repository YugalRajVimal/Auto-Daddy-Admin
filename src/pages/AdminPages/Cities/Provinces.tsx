import React, { useEffect, useState, FormEvent, ChangeEvent } from "react";
import axios, { AxiosError } from "axios";

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

type ProvinceStatus = "Active" | "Inactive";

interface Province {
  _id: string;
  name: string;
  nickName?: string;
  status?: ProvinceStatus;
  cities: { name: string; status?: string }[];
  createdAt?: string;
}

/* ── Shared sub-components ── */
const SortIcon = () => (
  <svg className="w-3 h-3 text-gray-400 flex-shrink-0" viewBox="0 0 10 14" fill="currentColor">
    <path d="M5 0L9 5H1L5 0Z" />
    <path d="M5 14L1 9H9L5 14Z" />
  </svg>
);
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
const PaginationBtn: React.FC<{ label: string; onClick: () => void; active?: boolean; disabled?: boolean }> = ({ label, onClick, active, disabled }) => (
  <button onClick={onClick} disabled={disabled}
    className={`px-3 py-1 text-sm rounded border transition-colors ${active ? "bg-blue-600 text-white border-blue-600" : disabled ? "text-gray-400 border-gray-200 cursor-not-allowed bg-white" : "text-gray-600 border-gray-300 bg-white hover:bg-gray-50"}`}>
    {label}
  </button>
);

const Provinces: React.FC = () => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Add form
  const [newName, setNewName] = useState("");
  const [newNick, setNewNick] = useState("");
  const [newStatus, setNewStatus] = useState<ProvinceStatus>("Active");

  // Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingProvince, setEditingProvince] = useState<Province | null>(null);
  const [editName, setEditName] = useState("");
  const [editNick, setEditNick] = useState("");
  const [editStatus, setEditStatus] = useState<ProvinceStatus>("Active");

  // Table controls
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { fetchProvinces(); }, []);

  const fetchProvinces = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get<{ data: Province[] }>(`${API_BASE}/admin/provinces`);
      setProvinces(res.data.data || []);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(axErr?.response?.data?.message || axErr?.message || "Failed to fetch provinces");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvince = async (e: FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(""); setSuccessMsg("");
    try {
      await axios.post(`${API_BASE}/admin/provinces`, { name: newName.trim(), nickName: newNick.trim(), status: newStatus });
      setSuccessMsg("Province added successfully.");
      setNewName(""); setNewNick(""); setNewStatus("Active");
      fetchProvinces();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(axErr?.response?.data?.message || axErr?.message || "Failed to add province");
    } finally { setActionLoading(false); }
  };

  const openEditModal = (province: Province) => {
    setEditingProvince(province);
    setEditName(province.name);
    setEditNick(province.nickName || "");
    setEditStatus(province.status || "Active");
    setError(""); setSuccessMsg("");
    setShowModal(true);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProvince) return;
    setActionLoading(true);
    setError(""); setSuccessMsg("");
    try {
      await axios.patch(`${API_BASE}/admin/provinces/${editingProvince._id}`, { name: editName.trim(), nickName: editNick.trim(), status: editStatus });
      setSuccessMsg("Province updated successfully.");
      setShowModal(false);
      fetchProvinces();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(axErr?.response?.data?.message || axErr?.message || "Failed to update province");
    } finally { setActionLoading(false); }
  };

  const handleToggleStatus = async (province: Province) => {
    const newStatus: ProvinceStatus = province.status === "Active" ? "Inactive" : "Active";
    try {
      await axios.patch(`${API_BASE}/admin/provinces/${province._id}`, { ...province, status: newStatus });
      fetchProvinces();
    } catch { setError("Error updating status"); }
  };

  const handleDelete = async (province: Province) => {
    if (!window.confirm(`Delete province "${province.name}"? All cities will also be deleted.`)) return;
    setActionLoading(true);
    setError(""); setSuccessMsg("");
    try {
      await axios.delete(`${API_BASE}/admin/provinces/${province._id}`);
      setSuccessMsg("Province deleted successfully.");
      fetchProvinces();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(axErr?.response?.data?.message || axErr?.message || "Failed to delete province");
    } finally { setActionLoading(false); }
  };

  // Filtered + paginated
  const filtered = provinces.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.nickName || "").toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const showingFrom = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, filtered.length);

  return (
<div
        // You may use Tailwind class if setup, or fallback to CSS below.
        className="h-[92vh] overflow-y-auto bg-[#f0f0f0] px-6 py-5 font-sans"
      
      >
      {/* Page Header */}
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Province Management</h1>
        <div className="text-sm text-right">
          <span className="text-blue-600 hover:underline cursor-pointer">Dashboard</span>
          <span className="text-gray-500"> / Provinces</span>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="mb-3 text-sm rounded bg-red-100 text-red-800 px-3 py-2 border border-red-200">{error}</div>}
      {successMsg && <div className="mb-3 text-sm rounded bg-green-100 text-green-800 px-3 py-2 border border-green-200">{successMsg}</div>}

      {/* Card */}
      <div className="mb-10 bg-white rounded shadow-sm">
        {/* Card Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <span className="text-base font-medium text-gray-700">Province List</span>
          <button
            onClick={() => { setEditingProvince(null); setEditName(""); setEditNick(""); setEditStatus("Active"); setError(""); setShowModal(true); }}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
          >
            <span className="text-lg leading-none">+</span> Add Province
          </button>
        </div>

        {/* Table Controls */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            Show
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400">
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            entries
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            Search:
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-44" />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-16 gap-3">
            <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-blue-600 text-sm font-medium">Loading provinces...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-16"><span className="flex items-center gap-1">ID <SortIcon /></span></th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700"><span className="flex items-center gap-1">Province Name <SortIcon /></span></th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-40"><span className="flex items-center gap-1">Nickname <SortIcon /></span></th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-24"><span className="flex items-center gap-1">Cities <SortIcon /></span></th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-32"><span className="flex items-center gap-1">Status <SortIcon /></span></th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-28"><span className="flex items-center gap-1">Actions <SortIcon /></span></th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">No provinces found.</td></tr>
                ) : (
                  paginated.map((province, idx) => (
                    <tr key={province._id} className={`border-b border-gray-100 ${idx % 2 === 1 ? "bg-white" : "bg-[#f9f9f9]"}`}>
                      <td className="px-4 py-3 text-gray-700">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{province.name}</td>
                      <td className="px-4 py-3 text-gray-500 italic text-xs">{province.nickName || "—"}</td>
                      <td className="px-4 py-3 text-gray-700">{province.cities?.length ?? 0}</td>
                      <td className="px-4 py-3">
                        <ToggleSwitch active={province.status !== "Inactive"} onToggle={() => handleToggleStatus(province)} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditModal(province)}
                            className="w-8 h-8 rounded flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                            aria-label={`Edit ${province.name}`}>
                            <EditIcon />
                          </button>
                          <button onClick={() => handleDelete(province)} disabled={actionLoading}
                            className="w-8 h-8 rounded flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                            aria-label={`Delete ${province.name}`}>
                            <DeleteIcon />
                          </button>
                        </div>
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
          <span>{filtered.length === 0 ? "Showing 0 entries" : `Showing ${showingFrom} to ${showingTo} of ${filtered.length} entries`}</span>
          <div className="flex items-center gap-1">
            <PaginationBtn label="Previous" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationBtn key={p} label={String(p)} active={p === currentPage} onClick={() => setCurrentPage(p)} />
            ))}
            <PaginationBtn label="Next" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} />
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded shadow-xl w-full max-w-md mx-4 animate-fadein" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <h3 className="text-lg font-semibold text-gray-800">{editingProvince ? "Edit Province" : "Add New Province"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800 text-xl leading-none">×</button>
            </div>
            <hr className="border-gray-200" />
            <div className="px-6 py-5 bg-blue-50/40">
              {error && <div className="mb-3 text-sm rounded bg-red-100 text-red-700 px-3 py-2 border border-red-200">{error}</div>}
              <form onSubmit={editingProvince ? handleEditSubmit : handleAddProvince} autoComplete="off">
                <div className="mb-4">
                  <label className="block mb-1.5 font-semibold text-gray-800 text-sm">Province Name</label>
                  <input type="text" required
                    value={editingProvince ? editName : newName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => editingProvince ? setEditName(e.target.value) : setNewName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400 bg-white placeholder:text-gray-400"
                    placeholder="Enter province name" autoFocus />
                </div>
                <div className="mb-4">
                  <label className="block mb-1.5 font-semibold text-gray-800 text-sm">Nickname <span className="font-normal text-gray-400">(optional)</span></label>
                  <input type="text"
                    value={editingProvince ? editNick : newNick}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => editingProvince ? setEditNick(e.target.value) : setNewNick(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400 bg-white placeholder:text-gray-400"
                    placeholder="Enter nickname" />
                </div>
                <div className="mb-4">
                  <label className="block mb-1.5 font-semibold text-gray-800 text-sm">Status</label>
                  <select
                    value={editingProvince ? editStatus : newStatus}
                    onChange={(e) => editingProvince ? setEditStatus(e.target.value as ProvinceStatus) : setNewStatus(e.target.value as ProvinceStatus)}
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
                    {actionLoading ? "Saving..." : editingProvince ? "Update Province" : "Add Province"}
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

export default Provinces;