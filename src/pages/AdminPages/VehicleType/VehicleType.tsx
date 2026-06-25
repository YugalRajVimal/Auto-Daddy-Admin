import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { authHeaders } from "../../../api/client";
import { AdminDataTable, tableCell } from "../../../components/admin/AdminDataTable";

// Representation according to CarDetails.schema.js (companyName, models)
interface CarModel {
  modelName: string;
  years: (number | string)[];
}
interface CarDetailsItem {
  _id: string;
  companyName: string;
  models: CarModel[];
  createdAt?: string;
  updatedAt?: string;
}

const getToken = () => authHeaders().Authorization || "";

const VehicleType: React.FC = () => {
  const [carDetails, setCarDetails] = useState<CarDetailsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Modal and form state
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState<CarDetailsItem | null>(null);

  // These states hold the modal form fields
  const [companyName, setCompanyName] = useState<string>("");
  const [models, setModels] = useState<CarModel[]>([
    { modelName: "", years: [] },
  ]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCols, setVisibleCols] = useState(["companyName", "models"]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const companyNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCarDetails();
    // eslint-disable-next-line
  }, []);

  const clearAlerts = () => {
    setError("");
    setSuccessMsg("");
  };

  const fetchCarDetails = async () => {
    setLoading(true);
    clearAlerts();
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      const token = getToken();
      const response = await axios.get(
        `${baseURL}/api/auto-shop-owner/car-details`,
        {
          headers: {
            Authorization: `${token}`
          }
        }
      );
      if (response.data.success) {
        setCarDetails(response.data.data);
      } else {
        setError("Failed to fetch car details.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error fetching car details");
    }
    setLoading(false);
  };

  // Modal openers
  const openAddModal = () => {
    clearAlerts();
    setEditingCar(null);
    setCompanyName("");
    setModels([{ modelName: "", years: [] }]);
    setShowModal(true);
    setTimeout(() => companyNameInputRef.current?.focus(), 150);
  };

  const openEditModal = (car: CarDetailsItem) => {
    clearAlerts();
    setEditingCar(car);
    setCompanyName(car.companyName);
    // Copy models deeply
    setModels(
      car.models.map((m) => ({
        modelName: m.modelName,
        years: [...m.years],
      }))
    );
    setShowModal(true);
    setTimeout(() => companyNameInputRef.current?.focus(), 150);
  };

  // Model/form helpers
  const handleCompanyNameChange = (val: string) => setCompanyName(val);

  /**
   * For the "years" field,
   * - the field value is used as a string in the input (user may include commas)
   * - store the string in CarModel.years as a single element array
   * - upon submit, process those model.years arrays to flat string, split on commas, convert to numbers if possible or leave as string if not numeric
   */
  const handleModelChange = (
    idx: number,
    key: "modelName" | "years",
    val: string
  ) => {
    setModels((ms) =>
      ms.map((m, i) =>
        idx !== i
          ? m
          : key === "modelName"
          ? { ...m, modelName: val }
          : {
              ...m,
              years: [val], // Store the whole user input as a single string
            }
      )
    );
  };

  const addModelRow = () =>
    setModels([...models, { modelName: "", years: [] }]);
  const removeModelRow = (idx: number) =>
    setModels((models) => models.filter((_, i) => i !== idx));

  // Helper to process years fields just before sending to API
  const getProcessedModels = () => {
    // Accept comma in numbers string: e.g. `2012,2013,2020`
    // But if user enters value with comma in a number (not likely), leave as is
    // Accept any string, number, even "1989, 1990,SL, 2020a, 2019-2020"
    return models.map((m) => ({
      modelName: m.modelName.trim(),
      years: Array.isArray(m.years) && m.years.length === 1 && typeof m.years[0] === 'string'
        ? m.years[0]
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [],
    }));
  };

  const validateModels = () => {
    // Must have at least 1 model with a name and at least one valid "years" entry
    if (
      models.length === 0 ||
      models.some(
        (m) =>
          !m.modelName.trim() ||
          !Array.isArray(m.years) ||
          m.years.length === 0 ||
          (typeof m.years[0] === "string"
            ? m.years[0].split(",").map((s:string)=>s.trim()).filter(Boolean).length === 0
            : true)
      )
    ) {
      setError(
        "Each model must have a name and at least one year entry (comma allowed)."
      );
      return false;
    }
    return true;
  };

  const handleModalFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;
    const trimmedCompany = companyName.trim();
    const token = getToken();

    if (!trimmedCompany) {
      setError("Company name is required.");
      return;
    }
    if (!validateModels()) {
      return;
    }

    const processedModels = getProcessedModels();

    try {
      if (editingCar) {
        // PATCH update by id
        await axios.patch(
          `${baseURL}/api/auto-shop-owner/car-details/${editingCar._id}`,
          {
            companyName: trimmedCompany,
            models: processedModels,
          },
          {
            headers: {
              Authorization: `${token}`
            }
          }
        );
        setSuccessMsg("Car details updated successfully.");
      } else {
        await axios.post(
          `${baseURL}/api/auto-shop-owner/car-details`,
          {
            companyName: trimmedCompany,
            models: processedModels,
          },
          {
            headers: {
              Authorization: `${token}`
            }
          }
        );
        setSuccessMsg("Car details added successfully.");
      }
      setShowModal(false);
      fetchCarDetails();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Error saving car details"
      );
    }
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this company and its models?"
      )
    )
      return;
    setDeletingId(id);
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;
    const token = getToken();
    try {
      await axios.delete(
        `${baseURL}/api/auto-shop-owner/car-details/${id}`,
        {
          headers: {
            Authorization: `${token}`
          }
        }
      );
      setSuccessMsg("Car details entry deleted.");
      fetchCarDetails();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Error deleting car details"
      );
    }
    setDeletingId(null);
  };

  const filtered = carDetails.filter((cd) => {
    const q = search.toLowerCase();
    return (
      cd.companyName.toLowerCase().includes(q) ||
      cd.models.some(
        (m) =>
          m.modelName.toLowerCase().includes(q) ||
          (Array.isArray(m.years) ? m.years.join(", ") : String(m.years)).toLowerCase().includes(q)
      )
    );
  });

  const tableColumns = useMemo(
    () => [
      {
        key: "companyName",
        label: "Company",
        render: (cd: CarDetailsItem) =>
          tableCell(<span style={{ fontWeight: 500 }}>{cd.companyName}</span>),
        exportValue: (cd: CarDetailsItem) => cd.companyName,
      },
      {
        key: "models",
        label: "Models",
        render: (cd: CarDetailsItem) =>
          tableCell(
            cd.models.length === 0 ? (
              <span style={{ color: "#aaa", fontStyle: "italic" }}>No models</span>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cd.models.map((m, idx) => (
                  <div key={m.modelName + idx}>
                    <span style={{ fontWeight: 600 }}>{m.modelName}</span>
                    {m.years && m.years.length > 0 && (
                      <span style={{ color: "#666", fontSize: 12, marginLeft: 8 }}>
                        (Years: {Array.isArray(m.years) ? m.years.join(", ") : m.years})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )
          ),
        exportValue: (cd: CarDetailsItem) =>
          cd.models
            .map((m) => `${m.modelName}${m.years?.length ? ` (${m.years.join(", ")})` : ""}`)
            .join("; "),
      },
    ],
    []
  );

  return (
    <AdminPage
      title="Car Companies & Models"
      noPanel
      headerAction={<AddNewButton onClick={openAddModal} />}
    >
      {error && (
        <div className="mb-4 text-sm rounded bg-red-100 text-red-800 px-3 py-2 border border-red-200 shadow">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 text-sm rounded bg-green-100 text-green-800 px-3 py-2 border border-green-200 shadow">
          {successMsg}
        </div>
      )}

      <div className="mb-10">
        <AdminDataTable
          items={filtered}
          columns={tableColumns}
          getRowId={(cd) => cd._id}
          loading={loading}
          error={error || null}
          emptyMessage="No car companies found."
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
          exportFilename="vehicle-types"
          totalBeforeFilter={carDetails.length}
          extraToolbarActions={[
            {
              label: "✏️ Update",
              color: "#0073b7",
              minSelected: 1,
              maxSelected: 1,
              onClick: (ids) => {
                const car = carDetails.find((c) => c._id === ids[0]);
                if (car) openEditModal(car);
              },
            },
          ]}
          renderActions={(cd) => (
            <div className="flex gap-2 items-center">
              <button
                onClick={() => openEditModal(cd)}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3 py-1 rounded transition shadow-sm"
                aria-label={`Edit ${cd.companyName}`}
                type="button"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(cd._id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition shadow-sm disabled:opacity-60"
                disabled={!!deletingId}
                aria-label={`Delete ${cd.companyName}`}
                type="button"
              >
                Delete
              </button>
            </div>
          )}
        />
      </div>

      {/* Modal for add/edit company and models */}
      {showModal && (
        <div
          className="fixed left-0 top-0 z-50 w-screen h-screen bg-black/35 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="rounded-lg shadow-2xl bg-white p-6 sm:p-9 max-w-lg w-[94vw] animate-fadein"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg sm:text-2xl text-gray-800">
                {editingCar
                  ? "Edit Car Company & Models"
                  : "Add Car Company & Models"}
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700 transition p-1 rounded"
                tabIndex={0}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {error && (
              <div className="mb-2 rounded bg-red-100 text-red-700 px-3 py-2 border border-red-200 shadow text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleModalFormSubmit} autoComplete="off">
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  ref={companyNameInputRef}
                  required
                  autoFocus
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="Enter car company name"
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-semibold text-gray-700">
                  Models
                </label>
                <div className="flex flex-col gap-2">
                  {models.map((model, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={model.modelName}
                        required
                        onChange={(e) =>
                          handleModelChange(idx, "modelName", e.target.value)
                        }
                        className="flex-1 px-3 py-1.5 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition outline-none"
                        placeholder="Model Name"
                      />
                      <input
                        type="text"
                        value={
                          Array.isArray(model.years) && typeof model.years[0] === "string"
                            ? model.years[0]
                            : (model.years as (number | string)[]).join(", ")
                        }
                        required
                        onChange={(e) =>
                          handleModelChange(idx, "years", e.target.value)
                        }
                        className="w-48 px-3 py-1.5 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition"
                        placeholder="Years (e.g. 2019,2020)"
                      />
                      {models.length > 1 && (
                        <button
                          type="button"
                          className="text-red-600 hover:bg-red-100 rounded px-2 py-1 transition"
                          aria-label="Remove Model"
                          onClick={() => removeModelRow(idx)}
                          tabIndex={0}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-blue-700 hover:bg-blue-50 rounded px-3 py-1 mt-2 transition text-sm font-semibold border border-blue-100"
                    onClick={addModelRow}
                  >
                    Add more model
                  </button>
                </div>
              </div>
              <div className="mt-7 flex gap-4 items-center justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition disabled:opacity-70"
                  disabled={loading}
                >
                  {editingCar ? "Update" : "Add"}
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
      {/* Tailwind Animations */}
      <style>
        {`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to   { opacity: 1; transform: none; }
        }
        .animate-fadein { animation: fadein .24s cubic-bezier(.4,1,.6,1) both; }
        `}
      </style>
    </AdminPage>
  );
};

export default VehicleType;