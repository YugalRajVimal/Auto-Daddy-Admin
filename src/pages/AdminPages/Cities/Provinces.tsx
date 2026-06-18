import React, { useEffect, useState, useMemo, FormEvent, ChangeEvent } from "react";
import axios, { AxiosError } from "axios";
import { AdminDataTable, tableCell } from "../../../components/admin/AdminDataTable";

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
  const [visibleCols, setVisibleCols] = useState(["name", "nickName", "cities", "status"]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const openAddModal = () => {
    setEditingProvince(null);
    setEditName("");
    setEditNick("");
    setEditStatus("Active");
    setError("");
    setSuccessMsg("");
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
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(province._id);
        return next;
      });
      fetchProvinces();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(axErr?.response?.data?.message || axErr?.message || "Failed to delete province");
    } finally { setActionLoading(false); }
  };

  const filtered = provinces.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.nickName || "").toLowerCase().includes(search.toLowerCase())
  );

  const tableColumns = useMemo(
    () => [
      {
        key: "name",
        label: "Province Name",
        render: (province: Province) => tableCell(<span style={{ fontWeight: 500 }}>{province.name}</span>),
        exportValue: (province: Province) => province.name,
      },
      {
        key: "nickName",
        label: "Nickname",
        render: (province: Province) =>
          tableCell(<span className="italic text-xs">{province.nickName || "—"}</span>),
        exportValue: (province: Province) => province.nickName || "—",
      },
      {
        key: "cities",
        label: "Cities",
        render: (province: Province) => tableCell(province.cities?.length ?? 0),
        exportValue: (province: Province) => String(province.cities?.length ?? 0),
      },
      {
        key: "status",
        label: "Status",
        render: (province: Province) =>
          tableCell(
            <ToggleSwitch active={province.status !== "Inactive"} onToggle={() => handleToggleStatus(province)} />
          ),
        exportValue: (province: Province) => province.status || "Active",
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provinces]
  );

  return (
<div
        className="min-h-0 flex-1 overflow-y-auto bg-ad-app-bg py-4 md:py-5 font-sans"
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

      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <span className="text-base font-medium text-gray-700">Province List</span>
        <button
          onClick={openAddModal}
          style={{ background: "#00a65a", color: "#fff", padding: "8px 18px", borderRadius: 4, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          + Add Province
        </button>
      </div>

      <div className="mb-10">
        <AdminDataTable
          items={filtered}
          columns={tableColumns}
          getRowId={(p) => p._id}
          loading={loading}
          emptyMessage="No provinces found."
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
          exportFilename="provinces"
          totalBeforeFilter={provinces.length}
          extraToolbarActions={[
            {
              label: "✏️ Update",
              color: "#0073b7",
              minSelected: 1,
              maxSelected: 1,
              onClick: (ids) => {
                const province = provinces.find((p) => p._id === ids[0]);
                if (province) openEditModal(province);
              },
            },
            {
              label: "🗑 Delete",
              color: "#e74c3c",
              minSelected: 1,
              maxSelected: 1,
              onClick: (ids) => {
                const province = provinces.find((p) => p._id === ids[0]);
                if (province) handleDelete(province);
              },
            },
          ]}
          renderActions={(province) => (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openEditModal(province)}
                className="w-8 h-8 rounded flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                aria-label={`Edit ${province.name}`}
                type="button"
              >
                <EditIcon />
              </button>
              <button
                onClick={() => handleDelete(province)}
                disabled={actionLoading}
                className="w-8 h-8 rounded flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                aria-label={`Delete ${province.name}`}
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
