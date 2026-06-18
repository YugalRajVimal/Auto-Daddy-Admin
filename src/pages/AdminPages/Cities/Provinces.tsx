import { useEffect, useState } from "react";
import { Link } from "react-router";
import axios, { AxiosError } from "axios";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../../../components/admin/ContentPanel";

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

type ProvinceStatus = "Active" | "Inactive";
type Country = "Canada" | "USA";

interface Province {
  _id: string;
  name: string;
  nickName?: string;
  country?: Country;
  status?: ProvinceStatus;
  cities: { name: string; status?: string }[];
  createdAt?: string;
}

type ProvincesPageProps = {
  initialShowForm?: boolean;
};

export default function Provinces({ initialShowForm = false }: ProvincesPageProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nickName, setNickName] = useState("");
  const [country, setCountry] = useState<Country>("Canada");
  const [status, setStatus] = useState<ProvinceStatus>("Active");

  useEffect(() => {
    fetchProvinces();
  }, []);

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

  const filtered = provinces.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.nickName || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.country || "Canada").toLowerCase().includes(search.toLowerCase())
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
    else setSelected(new Set(paged.map((p) => p._id)));
  };

  const resetForm = () => {
    setName("");
    setNickName("");
    setCountry("Canada");
    setStatus("Active");
    setEditingId(null);
    setError("");
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (province: Province) => {
    setName(province.name);
    setNickName(province.nickName || "");
    setCountry(province.country || "Canada");
    setStatus(province.status || "Active");
    setEditingId(province._id);
    setError("");
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Province name is required.");
      return;
    }
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      if (editingId) {
        await axios.patch(`${API_BASE}/admin/provinces/${editingId}`, {
          name: name.trim(),
          nickName: nickName.trim(),
          country,
          status,
        });
        setSuccessMsg("Province updated successfully.");
      } else {
        await axios.post(`${API_BASE}/admin/provinces`, {
          name: name.trim(),
          nickName: nickName.trim(),
          country,
          status,
        });
        setSuccessMsg("Province added successfully.");
      }
      resetForm();
      setShowForm(false);
      fetchProvinces();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(axErr?.response?.data?.message || axErr?.message || "Failed to save province");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (province: Province) => {
    if (!window.confirm(`Delete province "${province.name}"? All cities will also be deleted.`)) return;
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await axios.delete(`${API_BASE}/admin/provinces/${province._id}`);
      setSuccessMsg("Province deleted successfully.");
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(province._id);
        return next;
      });
      fetchProvinces();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(axErr?.response?.data?.message || axErr?.message || "Failed to delete province");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToolbarUpdate = () => {
    if (selected.size !== 1) return;
    const id = [...selected][0];
    const province = provinces.find((p) => p._id === id);
    if (province) openEdit(province);
  };

  const handleToolbarDelete = () => {
    if (selected.size !== 1) return;
    const id = [...selected][0];
    const province = provinces.find((p) => p._id === id);
    if (province) handleDelete(province);
  };

  const formMessage = editingId
    ? "You are updating a 'Province'"
    : "You are creating a 'Province'";

  return (
    <AdminPage
      title="Provinces"
      headerAction={!showForm ? <AddNewButton label="New Province" onClick={openAdd} /> : undefined}
      between={
        showForm ? (
          <CompactFormPanel
            footer={
              <CompactFormFooter
                message={formMessage}
                messageCenter
                actionLabel={actionLoading ? "Saving..." : "Save"}
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
              <CompactField label="Country" required>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value as Country)}
                  className={compactInputClass}
                >
                  <option value="Canada">Canada</option>
                  <option value="USA">USA</option>
                </select>
              </CompactField>
              <CompactField label="Province Name" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Nickname">
                <input
                  type="text"
                  value={nickName}
                  onChange={(e) => setNickName(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Status" required>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProvinceStatus)}
                  className={compactInputClass}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </CompactField>
            </CompactFormRow>
          </CompactFormPanel>
        ) : undefined
      }
    >
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

      {/* Toolbar */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={handleToolbarUpdate}
            disabled={selected.size !== 1}
            className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            Update
          </button>
          <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
            Shoot
          </button>
          <button
            type="button"
            onClick={handleToolbarDelete}
            disabled={selected.size !== 1 || actionLoading}
            className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            Delete
          </button>
          <button type="button" className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark">
            Print
          </button>
        </div>
        <div className="flex items-center gap-1">
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

      {/* Table */}
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
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Province Name</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Country</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Nickname</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Cities</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Status</th>
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
                  No provinces found.
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
                  <td className="border border-gray-300 px-3 py-2">{row.country || "Canada"}</td>
                  <td className="border border-gray-300 px-3 py-2 italic text-xs">
                    {row.nickName || "—"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{row.cities?.length ?? 0}</td>
                  <td className="border border-gray-300 px-3 py-2">{row.status || "Active"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
        <Link to="#" className="text-sm text-blue-700 hover:underline">
          Deleted
        </Link>
      </div>
    </AdminPage>
  );
}
