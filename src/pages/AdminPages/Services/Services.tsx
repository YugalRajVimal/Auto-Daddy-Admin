import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// Service/subservice schemas
interface SubService {
  name: string;
  desc?: string;
}

interface Service {
  _id: string;
  name: string;
  desc?: string;
  services: SubService[];
}

const defaultSubService = (): SubService => ({
  name: "",
  desc: "",
});
const defaultService = (): Omit<Service, "_id"> => ({
  name: "",
  desc: "",
  services: [defaultSubService()],
});

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Modal and form state
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formValues, setFormValues] = useState<Omit<Service, "_id">>(defaultService());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // State to handle collapsible subservices: array of open service IDs
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line
  }, []);

  const clearAlerts = () => {
    setError("");
    setSuccessMsg("");
  };

  const fetchServices = async () => {
    setLoading(true);
    clearAlerts();
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${baseURL}/api/admin/services`);
      if (response.data.success) {
        setServices(response.data.data);
      } else {
        setError("Failed to fetch services.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error fetching services");
    }
    setLoading(false);
  };

  // Add or Edit
  const openAddModal = () => {
    clearAlerts();
    setEditingService(null);
    setFormValues(defaultService());
    setShowModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 150);
  };

  const openEditModal = (service: Service) => {
    clearAlerts();
    setEditingService(service);
    setFormValues({
      name: service.name,
      desc: service.desc,
      services: service.services.length
        ? service.services.map(sub => ({ ...sub }))
        : [defaultSubService()],
    });
    setShowModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 150);
  };

  const removeSubService = (idx: number) => {
    setFormValues(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== idx),
    }));
  };

  const updateFormField = (
    field: keyof Omit<Service, "_id" | "services">,
    value: string
  ) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateSubServiceField = (
    idx: number,
    field: keyof SubService,
    value: string
  ) => {
    setFormValues(prev => ({
      ...prev,
      services: prev.services.map((s, i) =>
        i === idx ? { ...s, [field]: value } : s
      ),
    }));
  };

  const addSubServiceRow = () => {
    setFormValues(prev => ({
      ...prev,
      services: [...prev.services, defaultSubService()],
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;
    try {
      if (editingService) {
        await axios.put(
          `${baseURL}/api/admin/services/${editingService._id}`,
          formValues
        );
        setSuccessMsg("Service updated successfully.");
      } else {
        await axios.post(`${baseURL}/api/admin/services`, formValues);
        setSuccessMsg("Service added successfully.");
      }
      setShowModal(false);
      fetchServices();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Error saving service"
      );
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    setDeletingId(id);
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;
    try {
      await axios.delete(`${baseURL}/api/admin/services/${id}`);
      setSuccessMsg("Service deleted.");
      fetchServices();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Error deleting service"
      );
    }
    setDeletingId(null);
  };

  // Handler to toggle subservices
  const toggleSubservices = (serviceId: string) => {
    setOpenRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  // Enhanced table row hover, card styled modal, and improved form layout
  return (
    <div className="min-h-[85vh] bg-gray-50 px-2 py-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
        <h2 className="text-2xl font-bold text-gray-700">All Services</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md shadow transition-colors duration-150"
          onClick={openAddModal}
        >
          + Add New Service
        </button>
      </div>
      {error && (
        <div className="mb-4 text-sm rounded bg-red-100 text-red-800 px-3 py-2 border border-red-200 shadow">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 text-sm rounded bg-green-100 text-green-800 px-3 py-2 border border-green-200 shadow">{successMsg}</div>
      )}
      {loading ? (
        <div className="mt-12 flex justify-center">
          <svg className="animate-spin h-7 w-7 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="ml-3 text-blue-600 font-medium">Loading services...</span>
        </div>
      ) : (
        <div className="overflow-x-auto mt-2">
          {services.length === 0 ? (
            <div className="text-center text-gray-500 text-lg py-8">No services found.</div>
          ) : (
            <table className="w-full border rounded overflow-hidden bg-white shadow-sm">
              <thead className="bg-gradient-to-br from-gray-100 to-gray-50">
                <tr>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Service Name</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Description</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Subservices</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map(service => {
                  const isOpen = openRows.has(service._id);
                  const hasSubs = service.services && service.services.length > 0;
                  return (
                    <React.Fragment key={service._id}>
                      <tr
                        className="transition hover:bg-blue-50 group border-b last:border-b-0"
                      >
                        <td className="px-3 py-3 whitespace-nowrap font-medium text-gray-900">
                          {service.name}
                        </td>
                        <td className="px-3 py-3 max-w-[240px] text-gray-700">
                          {service.desc || (
                            <span className="italic text-gray-400">No description</span>
                          )}
                        </td>
                        <td className="px-3 py-3 max-w-[340px]">
                          <button
                            type="button"
                            onClick={() => toggleSubservices(service._id)}
                            className={`flex items-center gap-2 px-2 py-1 rounded transition
                              border font-medium
                              ${
                                hasSubs
                                  ? isOpen
                                    ? "bg-blue-100 border-blue-200 text-blue-700"
                                    : "hover:bg-blue-50 border-gray-200 text-blue-600"
                                  : "border-gray-100 text-gray-300 cursor-not-allowed"
                              }
                            `}
                            disabled={!hasSubs}
                            aria-expanded={isOpen}
                            aria-controls={`subservices-row-${service._id}`}
                            tabIndex={0}
                          >
                            {hasSubs ? (
                              <>
                                <span>
                                  {isOpen ? "Hide" : "Show"}
                                </span>
                                <svg
                                  className={`w-3 h-3 transition-transform duration-200
                                    ${isOpen ? "rotate-90" : ""}
                                  `}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 12 12"
                                >
                                  <path d="M5 2v8m-3-3 3 3 3-3" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                              </>
                            ) : (
                              <span className="italic">No subservices</span>
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap flex gap-2 items-center">
                          <button
                            onClick={() => openEditModal(service)}
                            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3 py-1 rounded transition group-hover:scale-105 shadow-sm"
                            aria-label={`Edit ${service.name}`}
                          >
                            <svg viewBox="0 0 20 20" className="w-4 h-4 mr-1 inline-block" fill="none"><path d="M15.232 5.232l-.464-.464a2 2 0 0 0-2.828 0l-6.036 6.036a1 1 0 0 0-.263.493l-.732 2.928a.5.5 0 0 0 .605.605l2.929-.732a1 1 0 0 0 .492-.263l6.036-6.036a2 2 0 0 0 0-2.828zM17.414 2.586a4 4 0 0 0-5.656 0l-6.036 6.036a3 3 0 0 0-.79 1.477l-.732 2.929a2 2 0 0 0 2.41 2.41l2.928-.732a3 3 0 0 0 1.477-.79l6.036-6.036a4 4 0 0 0 0-5.656z" fill="currentColor"/></svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(service._id)}
                            className={`bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition group-hover:scale-105 shadow-sm disabled:opacity-60`}
                            disabled={!!deletingId}
                            aria-label={`Delete ${service.name}`}
                          >
                            <svg viewBox="0 0 20 20" className="w-4 h-4 mr-1 inline-block" fill="none"><path d="M6.5 4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7H3a1 1 0 1 1 0-2h4V4zm2 0v1h3V4h-3zm-3 3h9v10H5V7zm3 2a1 1 0 0 1 2 0v5a1 1 0 1 1-2 0V9z" fill="currentColor"/></svg>
                            Delete
                          </button>
                        </td>
                      </tr>
                      {isOpen && hasSubs && (
                        <tr id={`subservices-row-${service._id}`} className="bg-blue-50">
                          <td colSpan={4} className="py-1.5 px-4">
                            <div>
                              <div className="font-semibold text-gray-700 mb-1">Subservices:</div>
                              <ul className="ml-2 md:ml-8 pl-2 md:pl-6 border-l-2 border-blue-300 text-gray-900 text-[15px] space-y-0.5">
                                {service.services.map((sub, subIdx) => (
                                  <li key={subIdx} className="flex flex-col sm:flex-row gap-x-2">
                                    <span className="font-medium">{sub.name}</span>
                                    {sub.desc && (
                                      <span className="text-gray-500 sm:ml-2">– {sub.desc}</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Animated Modal */}
      {showModal && (
        <div
          className="fixed left-0 top-0 z-50 w-screen h-screen bg-black/35 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="rounded-lg shadow-2xl bg-white p-6 sm:p-9 max-w-lg w-[94vw] animate-fadein"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg sm:text-2xl text-gray-800">
                {editingService ? "Edit Service" : "Add New Service"}
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
            {error && <div className="mb-2 rounded bg-red-100 text-red-700 px-3 py-2 border border-red-200 shadow text-sm">{error}</div>}
            <form onSubmit={handleFormSubmit} autoComplete="off">
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Service Name</label>
                <input
                  type="text"
                  value={formValues.name}
                  ref={nameInputRef}
                  required
                  autoFocus
                  onChange={e => updateFormField("name", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="Enter service name"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Description</label>
                <textarea
                  value={formValues.desc || ""}
                  rows={2}
                  onChange={e => updateFormField("desc", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="Enter service description"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold text-gray-700">Subservices</label>
                <div className="rounded border bg-gray-50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-2 py-2 font-medium text-gray-700 text-left">Name</th>
                        <th className="px-2 py-2 font-medium text-gray-700 text-left">Description</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {formValues.services.map((sub, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={sub.name}
                              required
                              autoComplete="off"
                              onChange={e => updateSubServiceField(idx, "name", e.target.value)}
                              placeholder="Subservice name"
                              className="w-full px-2 py-1 border rounded focus:border-blue-400 focus:ring-1 focus:ring-blue-200 placeholder:text-gray-400"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={sub.desc || ""}
                              autoComplete="off"
                              onChange={e => updateSubServiceField(idx, "desc", e.target.value)}
                              placeholder="Subservice desc (optional)"
                              className="w-full px-2 py-1 border rounded focus:border-blue-400 focus:ring-1 focus:ring-blue-200 placeholder:text-gray-400"
                            />
                          </td>
                          <td className="py-2 px-1 text-center">
                            {formValues.services.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSubService(idx)}
                                title="Remove subservice"
                                className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 font-semibold rounded-full w-7 h-7 flex items-center justify-center transition"
                              >
                                <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
                                  <path d="M6 6l8 8M6 14L14 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={addSubServiceRow}
                  className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded font-semibold shadow transition-colors"
                >
                  + Add Subservice
                </button>
              </div>
              <div className="mt-7 flex gap-4 items-center justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition disabled:opacity-70"
                  disabled={loading}
                >
                  {editingService ? "Update" : "Add"}
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
    </div>
  );
};

export default Services;