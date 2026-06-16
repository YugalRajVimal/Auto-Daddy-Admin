// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";

// // Service schema
// export interface Service {
//   _id: string;
//   name: string;
//   status: "active" | "inactive";
// }

// type ServiceFormValues = Omit<Service, "_id">;

// const Services: React.FC = () => {
//   const [services, setServices] = useState<Service[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string>("");

//   // Modal and form state
//   const [showModal, setShowModal] = useState(false);
//   const [editingService, setEditingService] = useState<Service | null>(null);
//   const [formValues, setFormValues] = useState<ServiceFormValues>({
//     name: "",
//     status: "active",
//   });

//   const [deletingId, setDeletingId] = useState<string | null>(null);
//   const [successMsg, setSuccessMsg] = useState<string>("");
//   const nameInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     fetchServices();
//     // eslint-disable-next-line
//   }, []);

//   const clearAlerts = () => {
//     setError("");
//     setSuccessMsg("");
//   };

//   const fetchServices = async () => {
//     setLoading(true);
//     clearAlerts();
//     try {
//       const baseURL = import.meta.env.VITE_API_URL;
//       const response = await axios.get(`${baseURL}/api/admin/services`);
//       if (response.data.success) {
//         setServices(response.data.data);
//       } else {
//         setError("Failed to fetch services.");
//       }
//     } catch (err: any) {
//       setError(err?.response?.data?.message || "Error fetching services");
//     }
//     setLoading(false);
//   };

//   // Add or Edit
//   const openAddModal = () => {
//     clearAlerts();
//     setEditingService(null);
//     setFormValues({
//       name: "",
//       status: "active",
//     });
//     setShowModal(true);
//     setTimeout(() => nameInputRef.current?.focus(), 150);
//   };

//   const openEditModal = (service: Service) => {
//     clearAlerts();
//     setEditingService(service);
//     setFormValues({
//       name: service.name,
//       status: service.status || "active",
//     });
//     setShowModal(true);
//     setTimeout(() => nameInputRef.current?.focus(), 150);
//   };

//   const updateFormField = (
//     field: keyof Omit<Service, "_id">,
//     value: string
//   ) => {
//     setFormValues((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const handleFormSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     clearAlerts();
//     const baseURL = import.meta.env.VITE_API_URL;
//     const payload: Omit<Service, "_id"> = {
//       name: formValues.name,
//       status: formValues.status,
//     };

//     try {
//       if (editingService) {
//         await axios.put(
//           `${baseURL}/api/admin/services/${editingService._id}`,
//           payload
//         );
//         setSuccessMsg("Service updated successfully.");
//       } else {
//         await axios.post(`${baseURL}/api/admin/services`, payload);
//         setSuccessMsg("Service added successfully.");
//       }
//       setShowModal(false);
//       fetchServices();
//     } catch (err: any) {
//       setError(
//         err?.response?.data?.message ||
//           err?.response?.data?.error ||
//           "Error saving service"
//       );
//     }
//   };

//   // Delete
//   const handleDelete = async (id: string) => {
//     if (!window.confirm("Are you sure you want to delete this service?")) return;
//     setDeletingId(id);
//     clearAlerts();
//     const baseURL = import.meta.env.VITE_API_URL;
//     try {
//       await axios.delete(`${baseURL}/api/admin/services/${id}`);
//       setSuccessMsg("Service deleted.");
//       fetchServices();
//     } catch (err: any) {
//       setError(
//         err?.response?.data?.message ||
//           err?.response?.data?.error ||
//           "Error deleting service"
//       );
//     }
//     setDeletingId(null);
//   };

//   return (
//     <div className="h-[85vh] overflow-y-auto bg-gray-50 px-2 py-6 sm:px-8">
//       <div className="mb-6 flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
//         <h2 className="text-2xl font-bold text-gray-700">All Services</h2>
//         <button
//           className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md shadow transition-colors duration-150"
//           onClick={openAddModal}
//         >
//           + Add New Service
//         </button>
//       </div>
//       {error && (
//         <div className="mb-4 text-sm rounded bg-red-100 text-red-800 px-3 py-2 border border-red-200 shadow">{error}</div>
//       )}
//       {successMsg && (
//         <div className="mb-4 text-sm rounded bg-green-100 text-green-800 px-3 py-2 border border-green-200 shadow">{successMsg}</div>
//       )}
//       {loading ? (
//         <div className="mt-12 flex justify-center">
//           <svg className="animate-spin h-7 w-7 text-blue-500" viewBox="0 0 24 24">
//             <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//             <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
//           </svg>
//           <span className="ml-3 text-blue-600 font-medium">Loading services...</span>
//         </div>
//       ) : (
//         <div className="overflow-x-auto mt-2">
//           {services.length === 0 ? (
//             <div className="text-center text-gray-500 text-lg py-8">No services found.</div>
//           ) : (
//             <table className="w-full border rounded overflow-hidden bg-white shadow-sm">
//               <thead className="bg-gradient-to-br from-gray-100 to-gray-50">
//                 <tr>
//                   <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Service Name</th>
//                   <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Status</th>
//                   <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {services.map((service) => (
//                   <tr key={service._id} className="transition hover:bg-blue-50 group border-b last:border-b-0">
//                     <td className="px-3 py-3 whitespace-nowrap font-medium text-gray-900">
//                       {service.name}
//                     </td>
//                     <td className="px-3 py-3 whitespace-nowrap font-medium">
//                       <span
//                         className={`px-2 py-1 rounded text-xs font-semibold ${
//                           service.status === "active"
//                             ? "bg-green-100 text-green-700 border border-green-200"
//                             : "bg-gray-200 text-gray-600 border border-gray-300"
//                         }`}
//                       >
//                         {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
//                       </span>
//                     </td>
//                     <td className="px-3 py-3 whitespace-nowrap flex gap-2 items-center">
//                       <button
//                         onClick={() => openEditModal(service)}
//                         className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3 py-1 rounded transition group-hover:scale-105 shadow-sm"
//                         aria-label={`Edit ${service.name}`}
//                       >
//                         <svg viewBox="0 0 20 20" className="w-4 h-4 mr-1 inline-block" fill="none"><path d="M15.232 5.232l-.464-.464a2 2 0 0 0-2.828 0l-6.036 6.036a1 1 0 0 0-.263.493l-.732 2.928a.5.5 0 0 0 .605.605l2.929-.732a1 1 0 0 0 .492-.263l6.036-6.036a2 2 0 0 0 0-2.828zM17.414 2.586a4 4 0 0 0-5.656 0l-6.036 6.036a3 3 0 0 0-.79 1.477l-.732 2.929a2 2 0 0 0 2.41 2.41l2.928-.732a3 3 0 0 0 1.477-.79l6.036-6.036a4 4 0 0 0 0-5.656z" fill="currentColor"/></svg>
//                         Edit
//                       </button>
//                       <button
//                         onClick={() => handleDelete(service._id)}
//                         className={`bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition group-hover:scale-105 shadow-sm disabled:opacity-60`}
//                         disabled={!!deletingId}
//                         aria-label={`Delete ${service.name}`}
//                       >
//                         <svg viewBox="0 0 20 20" className="w-4 h-4 mr-1 inline-block" fill="none"><path d="M6.5 4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7H3a1 1 0 1 1 0-2h4V4zm2 0v1h3V4h-3zm-3 3h9v10H5V7zm3 2a1 1 0 0 1 2 0v5a1 1 0 1 1-2 0V9z" fill="currentColor"/></svg>
//                         Delete
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       )}

//       {/* Animated Modal */}
//       {showModal && (
//         <div
//           className="fixed left-0 top-0 z-50 w-screen h-screen bg-black/35 flex items-center justify-center backdrop-blur-sm"
//           onClick={() => setShowModal(false)}
//         >
//           <div
//             className="rounded-lg shadow-2xl bg-white p-6 sm:p-9 max-w-lg w-[94vw] animate-fadein"
//             onClick={e => e.stopPropagation()}
//           >
//             <div className="flex items-center justify-between mb-1">
//               <h3 className="font-semibold text-lg sm:text-2xl text-gray-800">
//                 {editingService ? "Edit Service" : "Add New Service"}
//               </h3>
//               <button
//                 type="button"
//                 aria-label="Close"
//                 onClick={() => setShowModal(false)}
//                 className="text-gray-400 hover:text-gray-700 transition p-1 rounded"
//                 tabIndex={0}
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
//                 </svg>
//               </button>
//             </div>
//             {error && <div className="mb-2 rounded bg-red-100 text-red-700 px-3 py-2 border border-red-200 shadow text-sm">{error}</div>}
//             <form onSubmit={handleFormSubmit} autoComplete="off">
//               <div className="mb-4">
//                 <label className="block mb-1 font-semibold text-gray-700">Service Name</label>
//                 <input
//                   type="text"
//                   value={formValues.name}
//                   ref={nameInputRef}
//                   required
//                   autoFocus
//                   onChange={e => updateFormField("name", e.target.value)}
//                   className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
//                   placeholder="Enter service name"
//                 />
//               </div>
//               <div className="mb-4">
//                 <label className="block mb-1 font-semibold text-gray-700">Status</label>
//                 <select
//                   value={formValues.status}
//                   onChange={(e) => updateFormField("status", e.target.value)}
//                   className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition"
//                   required
//                 >
//                   <option value="active">Active</option>
//                   <option value="inactive">Inactive</option>
//                 </select>
//               </div>
//               <div className="mt-7 flex gap-4 items-center justify-end">
//                 <button
//                   type="submit"
//                   className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition disabled:opacity-70"
//                   disabled={loading}
//                 >
//                   {editingService ? "Update" : "Add"}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setShowModal(false)}
//                   className="bg-gray-200 text-gray-700 font-medium px-5 py-2 rounded hover:bg-gray-300 transition"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Tailwind Animations */}
//       <style>
//         {`
//         @keyframes fadein {
//           from { opacity: 0; transform: translateY(30px) scale(0.97); }
//           to   { opacity: 1; transform: none; }
//         }
//         .animate-fadein { animation: fadein .24s cubic-bezier(.4,1,.6,1) both; }
//         `}
//       </style>
//     </div>
//   );
// };

// export default Services;


import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// Keep backend as-is (Service object, API endpoints), 
// but on the UI use "Category" instead of "Service"
// (i.e., use "Category" in all labels, titles, placeholders, etc.)
// Add shopType - all / autoShop / tyreShop / carWash / towTruck
// Also add filter - shopType

export type ShopType = "autoShop" | "tyreShop" | "carWash" | "towTruck";

export interface Service {
  _id: string;
  name: string;
  status: "active" | "inactive";
  shopType: ShopType;
}

type ServiceFormValues = Omit<Service, "_id">;

const SHOP_TYPE_OPTIONS: { value: ShopType; label: string }[] = [
  { value: "autoShop", label: "Auto Shop" },
  { value: "tyreShop", label: "Tyre Shop" },
  { value: "carWash", label: "Car Wash" },
  { value: "towTruck", label: "Tow Truck" },
];

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formValues, setFormValues] = useState<ServiceFormValues>({ name: "", status: "active", shopType: "autoShop" });
  const [successMsg, setSuccessMsg] = useState<string>("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Table controls
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // shop type filter
  const [filterShopType, setFilterShopType] = useState<"all" | ShopType>("all");

  useEffect(() => {
    fetchServices();
  }, [filterShopType]);

  const clearAlerts = () => { setError(""); setSuccessMsg(""); };

  // Fetch categories with optional shopType filter
  const fetchServices = async () => {
    setLoading(true);
    clearAlerts();
    try {
      const baseURL = import.meta.env.VITE_API_URL;
      let url = `${baseURL}/api/admin/services`;
      if (filterShopType !== "all") url += `?shopType=${filterShopType}`;
      const response = await axios.get(url);
      if (response.data.success) setServices(response.data.data);
      else setError("Failed to fetch categories.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error fetching categories");
    }
    setLoading(false);
  };

  const openAddModal = () => {
    clearAlerts();
    setEditingService(null);
    setFormValues({ name: "", status: "active", shopType: "autoShop" });
    setShowModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 150);
  };

  const openEditModal = (service: Service) => {
    clearAlerts();
    setEditingService(service);
    setFormValues({ name: service.name, status: service.status || "active", shopType: service.shopType });
    setShowModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 150);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    const baseURL = import.meta.env.VITE_API_URL;
    try {
      if (editingService) {
        await axios.put(`${baseURL}/api/admin/services/${editingService._id}`, formValues);
        setSuccessMsg("Category updated successfully.");
      } else {
        await axios.post(`${baseURL}/api/admin/services`, formValues);
        setSuccessMsg("Category added successfully.");
      }
      setShowModal(false);
      fetchServices();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Error saving category");
    }
  };

  const handleToggleStatus = async (service: Service) => {
    const newStatus = service.status === "active" ? "inactive" : "active";
    const baseURL = import.meta.env.VITE_API_URL;
    try {
      await axios.put(`${baseURL}/api/admin/services/${service._id}`, { ...service, status: newStatus });
      fetchServices();
    } catch (err: any) {
      setError("Error updating status");
    }
  };

  // Filtered + paginated by name and filterShopType
  const filtered = services.filter((s) => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const showingFrom = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, filtered.length);

  return (
    <div className="h-[92vh] overflow-y-auto bg-[#f0f0f0] px-6 py-5 font-sans">
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
        {/* Card Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <span className="text-base font-medium text-gray-700">Category List</span>
          <div className="flex gap-2 ">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Shop type:</span>
            <select
              value={filterShopType}
              onChange={e => { setFilterShopType(e.target.value as any); setCurrentPage(1); }}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="all">All</option>
              {SHOP_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
          >
            <span className="text-lg leading-none">+</span> Add Category
          </button>
          </div>
        
        </div>

        {/* Table Controls */}
        <div className="flex items-center justify-between px-5 py-3 flex-wrap gap-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            Show
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
            >
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            entries
          </div>

     
          <div className="flex items-center gap-2 text-sm text-gray-600">
            Search:
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
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
            <span className="text-blue-600 text-sm font-medium">Loading categories...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-16">
                    <span className="flex items-center gap-1">ID <SortIcon /></span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    <span className="flex items-center gap-1">Name <SortIcon /></span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-36">
                    <span className="flex items-center gap-1">Shop Type <SortIcon /></span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-32">
                    <span className="flex items-center gap-1">Status <SortIcon /></span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-28">
                    <span className="flex items-center gap-1">Actions <SortIcon /></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400">No categories found.</td>
                  </tr>
                ) : (
                  paginated.map((service, idx) => (
                    <tr key={service._id} className={`border-b border-gray-100 ${idx % 2 === 1 ? "bg-white" : "bg-[#f9f9f9]"}`}>
                      <td className="px-4 py-3 text-gray-700">{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{service.name}</td>
                      <td className="px-4 py-3 text-gray-800">
                        {SHOP_TYPE_OPTIONS.find(opt => opt.value === service.shopType)?.label || service.shopType}
                      </td>
                      <td className="px-4 py-3">
                        <ToggleSwitch
                          active={service.status === "active"}
                          onToggle={() => handleToggleStatus(service)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEditModal(service)}
                          className="w-8 h-8 rounded flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                          aria-label={`Edit ${service.name}`}
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
            {filtered.length === 0
              ? "Showing 0 entries"
              : `Showing ${showingFrom} to ${showingTo} of ${filtered.length} entries`}
          </span>
          <div className="flex items-center gap-1">
            <PaginationBtn label="Previous" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationBtn key={p} label={String(p)} active={p === currentPage} onClick={() => setCurrentPage(p)} />
            ))}
            <PaginationBtn label="Next" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} />
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
                {editingService ? "Edit Category" : "Add New Category"}
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
              {error && <div className="mb-3 text-sm rounded bg-red-100 text-red-700 px-3 py-2 border border-red-200">{error}</div>}
              <form onSubmit={handleFormSubmit} autoComplete="off">
                <div className="mb-4">
                  <label className="block mb-1.5 font-semibold text-gray-800 text-sm">Category Name</label>
                  <input
                    type="text"
                    ref={nameInputRef}
                    value={formValues.name}
                    required
                    onChange={(e) => setFormValues((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400 bg-white placeholder:text-gray-400"
                    placeholder="Enter category name"
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1.5 font-semibold text-gray-800 text-sm">Shop Type</label>
                  <select
                    value={formValues.shopType}
                    onChange={e => setFormValues((p) => ({ ...p, shopType: e.target.value as ShopType }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400 bg-white"
                    required
                  >
                    {SHOP_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
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
                    {editingService ? "Update Category" : "Add Category"}
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
    className="flex items-center gap-0 focus:outline-none"
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

export default Services;