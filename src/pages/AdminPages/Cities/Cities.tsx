import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
import { useAdminDeletedView } from "../../../hooks/useAdminDeletedView";
import {
  compactInputClass,
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
} from "../../../components/admin/ContentPanel";
import AdminSearchCard, {
  emptyAdminSearchValues,
  searchEquals,
  searchIncludes,
  type AdminSearchField,
} from "../../../components/admin/AdminSearchCard";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";
import { citySchema, type CitySchemaInput, type CitySchemaValues } from "../../../lib/validation/schemas/catalog";
import { FormFieldError, fieldErrorClass, toastValidationSummary } from "../../../lib/validation/formUi";

const CITY_SEARCH_FIELDS: AdminSearchField[] = [
  { key: "city", label: "City" },
  { key: "province", label: "Province" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" },
    ],
  },
];

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const getAdminAuthHeader = () => {
  const token = localStorage.getItem("admin-token");
  if (!token) return {};
  return {
    headers: {
      Authorization: token,
    },
  };
};

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

type CitiesPageProps = {
  initialShowForm?: boolean;
};

export default function Cities({ initialShowForm = false }: CitiesPageProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [showSearchCard, setShowSearchCard] = useState(false);
  const [searchDraft, setSearchDraft] = useState(() => emptyAdminSearchValues(CITY_SEARCH_FIELDS));
  const [searchFilters, setSearchFilters] = useState(() => emptyAdminSearchValues(CITY_SEARCH_FIELDS));
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingCity, setEditingCity] = useState<City | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors },
  } = useForm<CitySchemaInput, unknown, CitySchemaValues>({
    resolver: zodResolver(citySchema),
    mode: "onSubmit",
    defaultValues: { name: "", province: "", status: "Active" },
  });

  const resetTableControls = () => {
    setPage(1);
    setSelected(new Set());
    setSearch("");
    const empty = emptyAdminSearchValues(CITY_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setShowSearchCard(false);
  };

  const { viewMode, isDeletedView, toggleViewMode, deletedStash, stashDeleted, restoreStashed } =
    useAdminDeletedView<CityRow>({
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
      const res = await axios.get<{ data: Province[] }>(
        `${API_BASE}/admin/provinces`,
        getAdminAuthHeader()
      );
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

  // Sort provinces by name, alphabetical order
  const sortedProvinces = [...provinces].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  // Helper for sorting cities alphabetically by name
  function sortCitiesAlphabetically<T extends { name: string }>(array: T[]): T[] {
    return [...array].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }

  // Compose allCities using sorted province and sorted city lists
  const allCities: CityRow[] = selectedProvinceId
    ? sortCitiesAlphabetically(
        (provinces.find((p) => p._id === selectedProvinceId)?.cities || [])
      ).map((c) => {
        const province = provinces.find((p) => p._id === selectedProvinceId);
        return {
          ...c,
          provinceName: province?.name || "",
          provinceId: selectedProvinceId,
        };
      })
    : sortedProvinces.flatMap((p) =>
        sortCitiesAlphabetically(p.cities || []).map((c) => ({
          ...c,
          provinceName: p.name,
          provinceId: p._id,
        }))
      );

  const displayCities = isDeletedView ? deletedStash : allCities;

  // Always present alphabetical order in UI table: cities in name order
  const filtered = sortCitiesAlphabetically(
    displayCities.filter((c) => {
      const live =
        !search.trim() ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.provinceName.toLowerCase().includes(search.toLowerCase());
      if (!live) return false;
      return (
        searchIncludes(c.name, searchFilters.city) &&
        searchIncludes(c.provinceName, searchFilters.province) &&
        searchEquals(c.status || "Active", searchFilters.status)
      );
    })
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
    reset({ name: "", province: selectedProvinceId, status: "Active" });
    setEditingCity(null);
    setError("");
  };

  const openAdd = () => {
    resetForm();
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openEdit = (city: CityRow) => {
    setEditingCity(city);
    reset({ name: city.name, province: city.provinceId, status: city.status || "Active" });
    setError("");
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openSearchCard = () => {
    setShowForm(false);
    setEditingCity(null);
    setSearchDraft({ ...searchFilters });
    setShowSearchCard((open) => !open);
  };

  const handleSearchCardSearch = () => {
    setSearchFilters({ ...searchDraft });
    setPage(1);
    setSelected(new Set());
  };

  const handleSearchCardReset = () => {
    const empty = emptyAdminSearchValues(CITY_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setPage(1);
    setSelected(new Set());
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = handleSubmit(
    async (values) => {
      setActionLoading(true);
      setError("");
      setSuccessMsg("");
      try {
        if (editingCity) {
          await axios.patch(
            `${API_BASE}/admin/provinces/${values.province}/cities/${encodeURIComponent(editingCity.name)}`,
            { name: values.name, status: values.status },
            getAdminAuthHeader()
          );
          adminNotify.success("City updated successfully.");
          setSuccessMsg("City updated successfully.");
        } else {
          await axios.post(
            `${API_BASE}/admin/provinces/${values.province}/cities`,
            {
              name: values.name,
              status: values.status,
            },
            getAdminAuthHeader()
          );
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
    },
    (errs) => toastValidationSummary(adminNotify.error, errs as never),
  );

  const handleDelete = async (city: CityRow) => {
    if (!window.confirm(`Delete city "${city.name}"?`)) return;
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await axios.delete(
        `${API_BASE}/admin/provinces/${city.provinceId}/cities/${encodeURIComponent(city.name)}`,
        getAdminAuthHeader()
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

  const handleRestore = async () => {
    if (selected.size !== 1) return;
    const id = [...selected][0];
    const city = deletedStash.find((c) => getCityRowId(c) === id);
    if (!city) return;
    if (!window.confirm(`Restore city "${city.name}"?`)) return;
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await axios.post(
        `${API_BASE}/admin/provinces/${city.provinceId}/cities`,
        {
          name: city.name,
          status: city.status || "Active",
        },
        getAdminAuthHeader()
      );
      restoreStashed((item) => getCityRowId(item) === id);
      adminNotify.success("City restored.");
      setSuccessMsg("City restored.");
      setSelected(new Set());
      fetchProvinces();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      const __adminMsg = axErr?.response?.data?.message || axErr?.message || "Failed to restore city";
      setError(__adminMsg);
      adminNotify.error(__adminMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToolbarPrint = () => {
    printAdminTable({
      title: isDeletedView ? "Deleted Cities" : "Cities",
      headers: ["City", "Province", "Status"],
      rows: filtered.map((city) => [city.name, city.provinceName, city.status || "Active"]),
    });
  };

  const formMessage = editingCity ? "You are updating a 'City'" : "You are creating a 'City'";

  return (
    <AdminPage
      title={isDeletedView ? "Deleted Cities" : "Cities"}
      headerAction={!showForm && !showSearchCard && !isDeletedView ? <AddNewButton onClick={openAdd} /> : undefined}
      between={
        showSearchCard ? (
          <AdminSearchCard
            fields={CITY_SEARCH_FIELDS}
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
                    ? (editingCity ? "Updating..." : "Saving...")
                    : (editingCity ? "Update" : "Save")
                }
                onSave={() => void handleSave()}
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
              <CompactField label="Province" required>
                <select
                  className={fieldErrorClass(Boolean(formErrors.province), compactInputClass)}
                  {...register("province")}
                >
                  <option value="">Select Province</option>
                  {sortedProvinces.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                      {p.nickName ? ` (${p.nickName})` : ""}
                    </option>
                  ))}
                </select>
                <FormFieldError message={formErrors.province?.message} />
              </CompactField>
              <CompactField label="City" required>
                <input
                  type="text"
                  className={fieldErrorClass(Boolean(formErrors.name), compactInputClass)}
                  {...register("name")}
                />
                <FormFieldError message={formErrors.name?.message} />
              </CompactField>
              <CompactField label="Status" required>
                <select
                  className={fieldErrorClass(Boolean(formErrors.status), compactInputClass)}
                  {...register("status")}
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
              {sortedProvinces.map((p) => (
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm whitespace-nowrap">
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
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="border border-gray-300 px-3 py-4 text-left text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={4} className="border border-gray-300 px-3 py-4 text-left text-gray-500">
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
                  <td className="border border-gray-300 px-2 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={selected.has(getCityRowId(row))}
                      onChange={() => toggleSelect(getCityRowId(row))}
                      className="accent-ad-purple"
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-left">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="text-blue-700 hover:underline"
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide">
                    {row.provinceName}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-left">{row.status || "Active"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <TableEntriesSummary total={filtered.length} page={page} pageSize={entriesPerPage} />
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
