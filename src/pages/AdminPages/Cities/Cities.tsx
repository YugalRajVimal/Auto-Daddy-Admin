import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
import { useAdminDeletedView } from "../../../hooks/useAdminDeletedView";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

type CityStatus = "Active" | "Inactive";
type ProvinceStatus = "Active" | "Inactive";
type Country = "Canada" | "USA";

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
  country?: Country;
  status?: ProvinceStatus;
  cities: City[];
}

type CityRow = City & { provinceName: string; provinceId: string; country: Country };

const getCityRowId = (city: CityRow) => `${city.provinceId}-${city.name}`;

type CitiesPageProps = {
  initialShowForm?: boolean;
};

export default function Cities({ initialShowForm = false }: CitiesPageProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<"" | Country>("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [formName, setFormName] = useState("");
  const [formStatus, setFormStatus] = useState<CityStatus>("Active");
  const [formCountry, setFormCountry] = useState<Country>("Canada");
  const [formProvinceId, setFormProvinceId] = useState("");

  const resetTableControls = () => {
    setPage(1);
    setSelected(new Set());
    setSearch("");
  };

  const { viewMode, isDeletedView, toggleViewMode, deletedStash, stashDeleted } = useAdminDeletedView<CityRow>({
    onToggle: resetTableControls,
    storageKey: "admin_deleted_view:cities",
  });

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
      const __adminMsg = axErr?.response?.data?.message || axErr?.message || "Failed to fetch provinces";
      setError(__adminMsg);
      adminNotify.error(__adminMsg);
    } finally {
      setLoading(false);
    }
  };

  const provincesForCountry = (country: Country) =>
    provinces.filter((p) => (p.country || "Canada") === country);

  const allCities: CityRow[] = (selectedProvinceId
    ? (provinces.find((p) => p._id === selectedProvinceId)?.cities || []).map((c) => {
        const province = provinces.find((p) => p._id === selectedProvinceId);
        return {
          ...c,
          provinceName: province?.name || "",
          provinceId: selectedProvinceId,
          country: province?.country || "Canada",
        };
      })
    : provinces.flatMap((p) =>
        (p.cities || []).map((c) => ({
          ...c,
          provinceName: p.name,
          provinceId: p._id,
          country: p.country || "Canada",
        }))
      )
  ).filter((c) => !selectedCountry || c.country === selectedCountry);

  const displayCities = isDeletedView ? deletedStash : allCities;

  const filtered = displayCities.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.provinceName.toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
  const paged = filtered.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  const selectedProvince = provinces.find((p) => p._id === selectedProvinceId);

  const findCityById = (id: string) => allCities.find((c) => getCityRowId(c) === id);

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
    else setSelected(new Set(paged.map((c) => getCityRowId(c))));
  };

  const resetForm = () => {
    setFormName("");
    setFormStatus("Active");
    setFormCountry(selectedCountry || "Canada");
    setFormProvinceId(selectedProvinceId);
    setEditingCity(null);
    setError("");
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (city: CityRow) => {
    setEditingCity(city);
    setFormName(city.name);
    setFormStatus(city.status || "Active");
    setFormCountry(city.country);
    setFormProvinceId(city.provinceId);
    setError("");
    setShowForm(true);
  };

  const handleCountryChange = (value: Country) => {
    setFormCountry(value);
    const validProvince = provincesForCountry(value).some((p) => p._id === formProvinceId);
    if (!validProvince) setFormProvinceId("");
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      const __adminMsg = "City name is required.";
      setError(__adminMsg);
      adminNotify.error(__adminMsg);
      return;
    }
    if (!formProvinceId) {
      const __adminMsg = "Please select a province.";
      setError(__adminMsg);
      adminNotify.error(__adminMsg);
      return;
    }
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      if (editingCity) {
        await axios.patch(
          `${API_BASE}/admin/provinces/${formProvinceId}/cities/${encodeURIComponent(editingCity.name)}`,
          { name: formName.trim(), status: formStatus }
        );
        adminNotify.success("City updated successfully.");
      setSuccessMsg("City updated successfully.");
      } else {
        await axios.post(`${API_BASE}/admin/provinces/${formProvinceId}/cities`, {
          name: formName.trim(),
          status: formStatus,
        });
        adminNotify.success("City added successfully.");
      setSuccessMsg("City added successfully.");
      }
      resetForm();
      setShowForm(false);
      fetchProvinces();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      const __adminMsg = axErr?.response?.data?.message || axErr?.message || "Error saving city";
      setError(__adminMsg);
      adminNotify.error(__adminMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (city: CityRow) => {
    if (!window.confirm(`Delete city "${city.name}"?`)) return;
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await axios.delete(
        `${API_BASE}/admin/provinces/${city.provinceId}/cities/${encodeURIComponent(city.name)}`
      );
      stashDeleted(city);
      adminNotify.success("City deleted successfully.");
      setSuccessMsg("City deleted successfully.");
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(getCityRowId(city));
        return next;
      });
      fetchProvinces();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      const __adminMsg = axErr?.response?.data?.message || axErr?.message || "Failed to delete city";
      setError(__adminMsg);
      adminNotify.error(__adminMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToolbarDelete = () => {
    if (selected.size !== 1) return;
    const city = findCityById([...selected][0]);
    if (city) handleDelete(city);
  };

  const handleToolbarPrint = () => {
    printAdminTable({
      title: "Cities",
      headers: ["City", "Province", "Country", "Status"],
      rows: allCities
        .filter((city) => selected.has(getCityRowId(city)))
        .map((city) => [city.name, city.provinceName, city.country, city.status || "Active"]),
    });
  };

  const formMessage = editingCity ? "You are updating a 'City'" : "You are creating a 'City'";

  return (
    <AdminPage
      title={isDeletedView ? "Deleted Cities" : "Cities"}
      headerAction={!showForm ? <AddNewButton onClick={openAdd} /> : undefined}
      between={
        showForm ? (
          <CompactFormPanel
            footer={
              <CompactFormFooter
                message={formMessage}
                messageCenter
                actionLabel={
                  actionLoading
                    ? (editingCity ? "Updating..." : "Saving...")
                    : (editingCity ? "Update" : "Save")
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
              <CompactField label="Country" required>
                <select
                  value={formCountry}
                  onChange={(e) => handleCountryChange(e.target.value as Country)}
                  className={compactInputClass}
                >
                  <option value="Canada">Canada</option>
                  <option value="USA">USA</option>
                </select>
              </CompactField>
              <CompactField label="Province" required>
                <select
                  value={formProvinceId}
                  onChange={(e) => setFormProvinceId(e.target.value)}
                  className={compactInputClass}
                >
                  <option value="">Select Province</option>
                  {provincesForCountry(formCountry).map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                      {p.nickName ? ` (${p.nickName})` : ""}
                    </option>
                  ))}
                </select>
              </CompactField>
              <CompactField label="City" required>
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
                  onChange={(e) => setFormStatus(e.target.value as CityStatus)}
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
      {isDeletedView && <AdminDeletedBanner count={deletedStash.length} entityLabel="cities" />}
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
            onClick={handleToolbarDelete}
            disabled={selected.size === 0 || actionLoading}
            className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={handleToolbarPrint}
            disabled={selected.size === 0}
            className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Print
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-700">
            <span>Country:</span>
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value as "" | Country);
                setSelectedProvinceId("");
                setPage(1);
                setSelected(new Set());
              }}
              className="border border-gray-400 bg-white px-2 py-1 text-xs"
            >
              <option value="">All Countries</option>
              <option value="Canada">Canada</option>
              <option value="USA">USA</option>
            </select>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-700">
            <span>Province:</span>
            <select
              value={selectedProvinceId}
              onChange={(e) => {
                setSelectedProvinceId(e.target.value);
                setPage(1);
                setSelected(new Set());
              }}
              className="border border-gray-400 bg-white px-2 py-1 text-xs"
            >
              <option value="">All Provinces</option>
              {(selectedCountry ? provincesForCountry(selectedCountry) : provinces).map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                  {p.nickName ? ` (${p.nickName})` : ""}
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
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">City</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Province</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Country</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Status</th>
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
                  {isDeletedView
                    ? "No deleted cities found."
                    : (selectedProvinceId
                      ? `No cities found in ${selectedProvince?.name || "this province"}.`
                      : "No cities found.")}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => (
                <tr key={getCityRowId(row)} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(getCityRowId(row))}
                      onChange={() => toggleSelect(getCityRowId(row))}
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
                  <td className="border border-gray-300 px-3 py-2 text-xs font-medium uppercase tracking-wide">
                    {row.provinceName}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{row.country}</td>
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
        <AdminDeletedToggle viewMode={viewMode} onToggle={toggleViewMode} activeLabel="Active Cities" />
      </div>
    </AdminPage>
  );
}
