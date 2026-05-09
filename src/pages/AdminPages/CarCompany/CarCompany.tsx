import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// --- Types and Initial States ---
interface CarModel {
  modelName: string;
  years: number[]; // We'll store as numbers on API, strings in form
}
interface CarCompanyType {
  _id: string;
  companyName: string;
  models: CarModel[];
}
type CarCompanyFormState = {
  companyName: string;
  models: {
    modelName: string;
    years: string[];
  }[];
};
const EMPTY_FORM: CarCompanyFormState = {
  companyName: "",
  models: [{ modelName: "", years: [""] }],
};

const CarCompany: React.FC = () => {
  const [companies, setCompanies] = useState<CarCompanyType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Modal logic
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CarCompanyType | null>(null);
  const [form, setForm] = useState<CarCompanyFormState>(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Utility
  const clearAlerts = () => {
    setError("");
    setSuccessMsg("");
  };

  // Fetch data
  const fetchCompanies = async (q: string = "") => {
    setLoading(true);
    clearAlerts();
    try {
      const API_BASE = import.meta.env.VITE_API_URL;
      let url = `${API_BASE}/api/admin/car-company`;
      if (q) {
        url += `?companyName=${encodeURIComponent(q)}`;
      }
      const res = await axios.get(url);
      setCompanies(res.data?.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error fetching companies");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line
  }, []);

  // Modal openers
  const openAddModal = () => {
    clearAlerts();
    setEditingCompany(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 150);
  };

  const openEditModal = (company: CarCompanyType) => {
    clearAlerts();
    setEditingCompany(company);
    setForm({
      companyName: company.companyName,
      models: company.models.map((m) => ({
        modelName: m.modelName,
        years: m.years.map((y) => y.toString()),
      })),
    });
    setShowModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 150);
  };

  // Form field handlers
  const updateFormField = (
    field: keyof CarCompanyFormState,
    value: any
  ) => {
    setForm((curr) => ({ ...curr, [field]: value }));
  };

  const updateModelName = (idx: number, value: string) => {
    setForm((curr) => {
      const models = [...curr.models];
      models[idx].modelName = value;
      return { ...curr, models };
    });
  };

  const updateModelYear = (modelIdx: number, yearIdx: number, value: string) => {
    setForm((curr) => {
      const models = [...curr.models];
      models[modelIdx].years[yearIdx] = value;
      return { ...curr, models };
    });
  };

  const addModel = () => {
    setForm((curr) => ({
      ...curr,
      models: [...curr.models, { modelName: "", years: [""] }],
    }));
  };

  const removeModel = (idx: number) => {
    setForm((curr) => {
      const m = [...curr.models];
      m.splice(idx, 1);
      return { ...curr, models: m.length ? m : [{ modelName: "", years: [""] }] };
    });
  };

  const addYearToModel = (modelIdx: number) => {
    setForm((curr) => {
      const models = [...curr.models];
      models[modelIdx].years.push("");
      return { ...curr, models };
    });
  };

  const removeYearFromModel = (modelIdx: number, yearIdx: number) => {
    setForm((curr) => {
      const models = [...curr.models];
      models[modelIdx].years.splice(yearIdx, 1);
      if (models[modelIdx].years.length === 0) models[modelIdx].years = [""];
      return { ...curr, models };
    });
  };

  // Submit Logic
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    // Validation
    const invalid =
      !form.companyName.trim() ||
      !Array.isArray(form.models) ||
      form.models.length === 0 ||
      form.models.some(
        (m) =>
          !m.modelName.trim() ||
          !Array.isArray(m.years) ||
          m.years.length === 0 ||
          m.years.some((y) => !y.trim() || isNaN(Number(y)))
      );
    if (invalid) {
      setError("Company name, model names, and valid years are all required.");
      return;
    }

    const companyPayload = {
      companyName: form.companyName.trim(),
      models: form.models.map((m) => ({
        modelName: m.modelName.trim(),
        years: m.years.map((y) => Number(y)),
      })),
    };

    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL;
      if (editingCompany) {
        await axios.patch(`${API_BASE}/api/admin/car-company/${editingCompany._id}`, companyPayload);
        setSuccessMsg("Car company updated successfully.");
      } else {
        await axios.post(`${API_BASE}/api/admin/car-company`, companyPayload);
        setSuccessMsg("Car company added successfully.");
      }
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditingCompany(null);
      fetchCompanies(query);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          (editingCompany
            ? "Failed to update car company"
            : "Failed to add car company")
      );
    }
    setLoading(false);
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this car company?")) return;
    setDeletingId(id);
    setError("");
    setSuccessMsg("");
    try {
      const API_BASE = import.meta.env.VITE_API_URL;
      await axios.delete(`${API_BASE}/api/admin/car-company/${id}`);
      setSuccessMsg("Car company deleted.");
      fetchCompanies(query);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete car company");
    }
    setDeletingId(null);
  };

  // Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies(query);
  };

  return (
    <div className="max-w-3xl mx-auto px-3 py-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Car Companies
        </h1>
        <button
          type="button"
          onClick={openAddModal}
          className="bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow hover:bg-blue-800 transition"
        >
          + Add New
        </button>
      </div>
      <div className="mb-7">
        <form onSubmit={handleSearch} className="flex gap-2 items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border rounded px-3 py-2 w-72"
            type="text"
            placeholder="Search by company name..."
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-700 text-white rounded font-semibold"
          >
            Search
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 rounded font-semibold"
            onClick={() => {
              setQuery("");
              fetchCompanies("");
            }}
          >
            Clear
          </button>
        </form>
      </div>

      {/* Alerts */}
      {(error || successMsg) && (
        <div
          className={`mb-4 px-4 py-2 rounded shadow text-sm ${
            error ? "bg-red-100 text-red-700 border border-red-200" : "bg-green-100 text-green-700 border border-green-200"
          }`}
        >
          {error || successMsg}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-3 py-2 text-left">Company Name</th>
              <th className="px-3 py-2 text-left">Models</th>
              <th className="px-3 py-2 text-left w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="text-center py-10">Loading...</td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-gray-500 py-12">No car companies found.</td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company._id} className="border-b">
                  <td className="px-3 py-2">{company.companyName}</td>
                  <td className="px-3 py-2">
                    {company.models.map((m, idx) => (
                      <div key={idx}>
                        {m.modelName}: {Array.isArray(m.years) ? m.years.join(", ") : ""}
                      </div>
                    ))}
                  </td>
             
                  <td className="px-3 py-2 flex gap-2">
                    <button
                      className="text-blue-700 font-semibold text-sm"
                      onClick={() => openEditModal(company)}
                      tabIndex={0}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 font-semibold text-sm"
                      disabled={deletingId === company._id}
                      onClick={() => handleDelete(company._id)}
                      tabIndex={0}
                    >
                      {deletingId === company._id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 flex items-center justify-center"
          tabIndex={-1}
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-auto p-7 animate-fadein relative"
            tabIndex={0}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg sm:text-2xl text-gray-800">
                {editingCompany ? "Edit Car Company" : "Add New Car Company"}
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700 transition p-1 rounded"
                tabIndex={0}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            {error && (
              <div className="mb-2 rounded bg-red-100 text-red-700 px-3 py-2 border border-red-200 shadow text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleFormSubmit} autoComplete="off">
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Company Name
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  ref={nameInputRef}
                  required
                  autoFocus
                  onChange={e => updateFormField("companyName", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="Enter company name"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Car Models and Years
                </label>
                {form.models.map((model, modelIdx) => (
                  <div key={modelIdx} className="mb-4 p-3 border rounded">
                    <div className="flex gap-2 items-end mb-2">
                      <input
                        type="text"
                        value={model.modelName}
                        placeholder="Model Name"
                        required
                        onChange={e => updateModelName(modelIdx, e.target.value)}
                        className="flex-1 px-2 py-1 border rounded shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeModel(modelIdx)}
                        className="text-red-500 px-1 py-1 text-xs rounded font-medium"
                        disabled={form.models.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {model.years.map((year, yearIdx) => (
                        <div key={yearIdx} className="flex gap-1 items-center">
                          <input
                            type="number"
                            value={year}
                            min="1900"
                            max={new Date().getFullYear() + 2}
                            placeholder="Year"
                            required
                            onChange={e => updateModelYear(modelIdx, yearIdx, e.target.value)}
                            className="px-2 py-1 border rounded shadow-sm w-24"
                          />
                          <button
                            type="button"
                            className="text-red-500 px-1 rounded"
                            disabled={model.years.length === 1}
                            onClick={() => removeYearFromModel(modelIdx, yearIdx)}
                          >×</button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="text-blue-700 px-2 py-1 text-xs border border-blue-700 rounded ml-2"
                        onClick={() => addYearToModel(modelIdx)}
                      >
                        + Year
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="px-3 py-1 border border-blue-700 text-blue-700 rounded font-semibold text-sm"
                  onClick={addModel}
                >
                  + Model
                </button>
              </div>
              <div className="mt-7 flex gap-4 items-center justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition disabled:opacity-70"
                  disabled={loading}
                >
                  {editingCompany ? "Update" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-200 text-gray-700 font-medium px-5 py-2 rounded hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fade Animation */}
      <style>
        {`
          @keyframes fadein {
            from { opacity: 0; transform: translateY(30px) scale(0.97); }
            to   { opacity: 1; transform: none; }
          }
          .animate-fadein { animation: fadein .24s cubic-bezier(.4,1,.6,1) both; }
        `}
      </style>
    </div>
  );
};

export default CarCompany;