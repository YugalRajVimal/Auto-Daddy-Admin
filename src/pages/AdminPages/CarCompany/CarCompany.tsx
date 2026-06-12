// import React, { useState, useEffect, useRef, ChangeEvent } from "react";
// import axios from "axios";

// // --- Types and Initial States ---
// interface CarModel {
//   modelName: string;
//   years?: number[];
// }
// interface CarCompanyType {
//   _id: string;
//   companyName: string;
//   models: CarModel[];
//   brandLogo?: string | null;
// }
// type CarCompanyFormState = {
//   companyName: string;
//   models: {
//     modelName: string;
//     years?: string[];
//   }[];
//   brandLogoFile: File | null;
//   brandLogoPreviewUrl: string | null;
// };
// const EMPTY_FORM: CarCompanyFormState = {
//   companyName: "",
//   models: [{ modelName: "", years: undefined }],
//   brandLogoFile: null,
//   brandLogoPreviewUrl: null,
// };

// const CarCompany: React.FC = () => {
//   const [companies, setCompanies] = useState<CarCompanyType[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string>("");
//   const [successMsg, setSuccessMsg] = useState<string>("");

//   // Modal logic
//   const [showModal, setShowModal] = useState(false);
//   const [editingCompany, setEditingCompany] = useState<CarCompanyType | null>(null);
//   const [form, setForm] = useState<CarCompanyFormState>(EMPTY_FORM);
//   const [deletingId, setDeletingId] = useState<string | null>(null);
//   const [query, setQuery] = useState<string>("");

//   const nameInputRef = useRef<HTMLInputElement>(null);

//   // Utility
//   const clearAlerts = () => {
//     setError("");
//     setSuccessMsg("");
//   };

//   // Fetch data
//   const fetchCompanies = async (q: string = "") => {
//     setLoading(true);
//     clearAlerts();
//     try {
//       const API_BASE = import.meta.env.VITE_API_URL;
//       let url = `${API_BASE}/api/admin/car-company`;
//       if (q) {
//         url += `?companyName=${encodeURIComponent(q)}`;
//       }
//       const res = await axios.get(url);
//       setCompanies(res.data?.data ?? []);
//     } catch (err: any) {
//       setError(err?.response?.data?.message || "Error fetching companies");
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchCompanies();
//     // eslint-disable-next-line
//   }, []);

//   // Modal openers
//   const openAddModal = () => {
//     clearAlerts();
//     setEditingCompany(null);
//     setForm({ ...EMPTY_FORM });
//     setShowModal(true);
//     setTimeout(() => nameInputRef.current?.focus(), 150);
//   };

//   const openEditModal = (company: CarCompanyType) => {
//     clearAlerts();
//     setEditingCompany(company);
//     setForm({
//       companyName: company.companyName,
//       models: company.models.map((m) => ({
//         modelName: m.modelName,
//         years: m.years ? m.years.map((y) => y.toString()) : undefined,
//       })),
//       brandLogoFile: null,
//       brandLogoPreviewUrl: company.brandLogo
//         ? getBackendImageUrl(company.brandLogo)
//         : null,
//     });
//     setShowModal(true);
//     setTimeout(() => nameInputRef.current?.focus(), 150);
//   };

//   function getBackendImageUrl(path: string) {
//     if (/^https?:\/\//.test(path)) return path;
//     const API_BASE = import.meta.env.VITE_API_URL || "";
//     return path.startsWith("/")
//       ? `${API_BASE}${path}`
//       : `${API_BASE}/${path}`;
//   }

//   // Handlers
//   const updateFormField = (
//     field: keyof CarCompanyFormState,
//     value: any
//   ) => {
//     setForm((curr) => ({ ...curr, [field]: value }));
//   };

//   const updateModelName = (idx: number, value: string) => {
//     setForm((curr) => {
//       const models = [...curr.models];
//       models[idx].modelName = value;
//       return { ...curr, models };
//     });
//   };

//   const updateModelYear = (modelIdx: number, yearIdx: number, value: string) => {
//     setForm((curr) => {
//       const models = [...curr.models];
//       if (!models[modelIdx].years) {
//         models[modelIdx].years = [];
//       }
//       models[modelIdx].years![yearIdx] = value;
//       return { ...curr, models };
//     });
//   };

//   const addModel = () => {
//     setForm((curr) => ({
//       ...curr,
//       models: [...curr.models, { modelName: "", years: undefined }],
//     }));
//   };

//   const removeModel = (idx: number) => {
//     setForm((curr) => {
//       const m = [...curr.models];
//       m.splice(idx, 1);
//       return { ...curr, models: m.length ? m : [{ modelName: "", years: undefined }] };
//     });
//   };

//   const addYearToModel = (modelIdx: number) => {
//     setForm((curr) => {
//       const models = [...curr.models];
//       if (!models[modelIdx].years) {
//         models[modelIdx].years = [""];
//       } else {
//         models[modelIdx].years.push("");
//       }
//       return { ...curr, models };
//     });
//   };

//   const removeYearFromModel = (modelIdx: number, yearIdx: number) => {
//     setForm((curr) => {
//       const models = [...curr.models];
//       if (models[modelIdx].years) {
//         models[modelIdx].years.splice(yearIdx, 1);
//         if (models[modelIdx].years.length === 0) {
//           models[modelIdx].years = undefined;
//         }
//       }
//       return { ...curr, models };
//     });
//   };

//   // BrandLogo Handler
//   const handleBrandLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files || e.target.files.length === 0) return;
//     const file = e.target.files[0];
//     setForm((curr) => {
//       if (curr.brandLogoPreviewUrl && curr.brandLogoPreviewUrl.startsWith("blob:")) {
//         URL.revokeObjectURL(curr.brandLogoPreviewUrl);
//       }
//       return {
//         ...curr,
//         brandLogoFile: file,
//         brandLogoPreviewUrl: URL.createObjectURL(file),
//       };
//     });
//   };

//   const handleRemoveBrandLogo = () => {
//     setForm((curr) => {
//       if (curr.brandLogoPreviewUrl && curr.brandLogoPreviewUrl.startsWith("blob:")) {
//         URL.revokeObjectURL(curr.brandLogoPreviewUrl);
//       }
//       return { ...curr, brandLogoFile: null, brandLogoPreviewUrl: null };
//     });
//   };

//   // Submit Logic
//   const handleFormSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     clearAlerts();

//     const invalid =
//       !form.companyName.trim() ||
//       !Array.isArray(form.models) ||
//       form.models.length === 0 ||
//       form.models.some(
//         (m) =>
//           !m.modelName.trim()
//       );
//     if (invalid) {
//       setError("Company name and model names are required.");
//       return;
//     }

//     for (let m of form.models) {
//       if (Array.isArray(m.years) && m.years.length) {
//         for (let y of m.years) {
//           if (y && (isNaN(Number(y)) || !y.trim())) {
//             setError("Provided years must be valid numbers.");
//             return;
//           }
//         }
//       }
//     }

//     setLoading(true);
//     try {
//       const API_BASE = import.meta.env.VITE_API_URL;

//       const formData = new FormData();
//       formData.append("companyName", form.companyName.trim());
//       formData.append(
//         "models",
//         JSON.stringify(
//           form.models.map((m) => ({
//             modelName: m.modelName.trim(),
//             ...(Array.isArray(m.years) && m.years.some(y => y.trim()) ? {
//               years: m.years.filter((y) => y.trim() !== "").map((y) => Number(y))
//             } : {})
//           }))
//         )
//       );
//       if (form.brandLogoFile) {
//         formData.append("brandLogo", form.brandLogoFile);
//       }

//       if (editingCompany) {
//         await axios.patch(
//           `${API_BASE}/api/admin/car-company/${editingCompany._id}`,
//           formData,
//           {
//             headers: { "Content-Type": "multipart/form-data" },
//           }
//         );
//         setSuccessMsg("Car company updated successfully.");
//       } else {
//         await axios.post(`${API_BASE}/api/admin/car-company`, formData, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//         setSuccessMsg("Car company added successfully.");
//       }
//       setShowModal(false);
//       setForm({ ...EMPTY_FORM });
//       setEditingCompany(null);
//       fetchCompanies(query);
//     } catch (err: any) {
//       setError(
//         err?.response?.data?.message ||
//           (editingCompany
//             ? "Failed to update car company"
//             : "Failed to add car company")
//       );
//     }
//     setLoading(false);
//   };

//   const handleDelete = async (id: string) => {
//     if (!window.confirm("Delete this car company?")) return;
//     setDeletingId(id);
//     setError("");
//     setSuccessMsg("");
//     try {
//       const API_BASE = import.meta.env.VITE_API_URL;
//       await axios.delete(`${API_BASE}/api/admin/car-company/${id}`);
//       setSuccessMsg("Car company deleted.");
//       fetchCompanies(query);
//     } catch (err: any) {
//       setError(err?.response?.data?.message || "Failed to delete car company");
//     }
//     setDeletingId(null);
//   };

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//     fetchCompanies(query);
//   };

//   // Cleanup object URL when modal closes
//   useEffect(() => {
//     return () => {
//       if (form.brandLogoPreviewUrl && form.brandLogoPreviewUrl.startsWith("blob:")) {
//         URL.revokeObjectURL(form.brandLogoPreviewUrl);
//       }
//     };
//     // eslint-disable-next-line
//   }, [showModal]);

//   return (
//     <div className="max-w-3xl mx-auto px-3 py-8">
//       <div className="flex items-center justify-between mb-5">
//         <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
//           Car Companies
//         </h1>
//         <button
//           type="button"
//           onClick={openAddModal}
//           className="bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow hover:bg-blue-800 transition"
//         >
//           + Add New
//         </button>
//       </div>
//       <div className="mb-7">
//         <form onSubmit={handleSearch} className="flex gap-2 items-center flex-wrap">
//           <input
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             className="border rounded px-3 py-2 w-72 max-w-full"
//             type="text"
//             placeholder="Search by company name..."
//           />
//           <button
//             type="submit"
//             className="px-4 py-2 bg-blue-700 text-white rounded font-semibold"
//           >
//             Search
//           </button>
//           <button
//             type="button"
//             className="px-4 py-2 bg-gray-200 rounded font-semibold"
//             onClick={() => {
//               setQuery("");
//               fetchCompanies("");
//             }}
//           >
//             Clear
//           </button>
//         </form>
//       </div>

//       {/* Alerts */}
//       {(error || successMsg) && (
//         <div
//           className={`mb-4 px-4 py-2 rounded shadow text-sm ${
//             error
//               ? "bg-red-100 text-red-700 border border-red-200"
//               : "bg-green-100 text-green-700 border border-green-200"
//           }`}
//         >
//           {error || successMsg}
//         </div>
//       )}

//       {/* Table */}
//       <div className="bg-white rounded-xl shadow overflow-x-auto">
//         <table className="w-full text-sm min-w-[560px]">
//           <thead>
//             <tr className="bg-gray-50 border-b">
//               <th className="px-3 py-2 text-left">Company Name</th>
//               <th className="px-3 py-2 text-left">Models</th>
//               <th className="px-3 py-2 text-left">Brand Logo</th>
//               <th className="px-3 py-2 text-left w-28">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td colSpan={4} className="text-center py-10">
//                   Loading...
//                 </td>
//               </tr>
//             ) : companies.length === 0 ? (
//               <tr>
//                 <td colSpan={4} className="text-center text-gray-500 py-12">
//                   No car companies found.
//                 </td>
//               </tr>
//             ) : (
//               companies.map((company) => (
//                 <tr key={company._id} className="border-b">
//                   <td className="px-3 py-2">{company.companyName}</td>
//                   <td className="px-3 py-2">
//                     {company.models.map((m, idx) => (
//                       <div key={idx}>
//                         {m.modelName}
//                         {Array.isArray(m.years) && m.years.length > 0
//                           ? `: ${m.years.join(", ")}`
//                           : ""}
//                       </div>
//                     ))}
//                   </td>

//                   <td className="px-3 py-2">
//                     {company.brandLogo ? (
//                       <img
//                         src={getBackendImageUrl(company.brandLogo)}
//                         alt="Brand Logo"
//                         className="h-10 w-auto max-w-[72px] object-contain rounded border bg-white"
//                         loading="lazy"
//                       />
//                     ) : (
//                       <span className="text-gray-400 italic text-xs">No logo</span>
//                     )}
//                   </td>

//                   <td className="px-3 py-2 flex gap-2">
//                     <button
//                       className="text-blue-700 font-semibold text-sm"
//                       onClick={() => openEditModal(company)}
//                       tabIndex={0}
//                     >
//                       Edit
//                     </button>
//                     <button
//                       className="text-red-600 font-semibold text-sm"
//                       disabled={deletingId === company._id}
//                       onClick={() => handleDelete(company._id)}
//                       tabIndex={0}
//                     >
//                       {deletingId === company._id ? "Deleting..." : "Delete"}
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Modal */}
//       {showModal && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-40 pt-40 z-30 flex items-center justify-center"
//           tabIndex={-1}
//           onClick={() => setShowModal(false)}
//         >
//           <div
//             className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-auto p-0 animate-fadein relative flex pb-20 flex-col"
//             style={{
//               maxHeight: "95vh",
//               minHeight: "0",
//               display: "flex",
//               overflow: "hidden"
//             }}
//             tabIndex={0}
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div
//               className="flex-1 overflow-y-auto p-7"
//               style={{
//                 minHeight: 0
//               }}
//             >
//               <div className="flex items-center justify-between mb-1">
//                 <h3 className="font-semibold text-lg sm:text-2xl text-gray-800">
//                   {editingCompany ? "Edit Car Company" : "Add New Car Company"}
//                 </h3>
//                 <button
//                   type="button"
//                   aria-label="Close"
//                   onClick={() => setShowModal(false)}
//                   className="text-gray-400 hover:text-gray-700 transition p-1 rounded"
//                   tabIndex={0}
//                 >
//                   <svg
//                     className="w-6 h-6"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeWidth={2}
//                       d="M6 18L18 6M6 6l12 12"
//                     />
//                   </svg>
//                 </button>
//               </div>
//               {error && (
//                 <div className="mb-2 rounded bg-red-100 text-red-700 px-3 py-2 border border-red-200 shadow text-sm">
//                   {error}
//                 </div>
//               )}
//               <form onSubmit={handleFormSubmit} autoComplete="off" encType="multipart/form-data">
//                 <div className="mb-4">
//                   <label className="block mb-1 font-semibold text-gray-700">
//                     Company Name
//                   </label>
//                   <input
//                     type="text"
//                     value={form.companyName}
//                     ref={nameInputRef}
//                     required
//                     autoFocus
//                     onChange={(e) => updateFormField("companyName", e.target.value)}
//                     className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
//                     placeholder="Enter company name"
//                   />
//                 </div>
//                 <div className="mb-4">
//                   <label className="block mb-1 font-semibold text-gray-700">
//                     Brand Logo (optional)
//                   </label>
//                   <div className="flex gap-3 items-center flex-wrap">
//                     {form.brandLogoPreviewUrl ? (
//                       <div className="relative h-14 w-20">
//                         <img
//                           src={form.brandLogoPreviewUrl}
//                           alt="Logo Preview"
//                           className="h-14 w-20 object-contain border rounded bg-white"
//                         />
//                         <button
//                           type="button"
//                           className="absolute -top-2 -right-2 text-white bg-black bg-opacity-60 rounded-full p-[2px] hover:bg-opacity-90"
//                           aria-label="Remove logo"
//                           tabIndex={0}
//                           onClick={handleRemoveBrandLogo}
//                           style={{
//                             minWidth: 0,
//                             minHeight: 0,
//                             width: "20px",
//                             height: "20px",
//                             fontSize: "1rem",
//                           }}
//                         >
//                           ×
//                         </button>
//                       </div>
//                     ) : (
//                       <span className="flex items-center text-gray-500 text-xs italic">
//                         No logo selected
//                       </span>
//                     )}
//                     <label
//                       className="px-3 py-1 border text-blue-700 border-blue-700 rounded cursor-pointer hover:bg-blue-50 text-xs font-semibold"
//                     >
//                       <input
//                         type="file"
//                         accept="image/*"
//                         style={{ display: "none" }}
//                         onChange={handleBrandLogoChange}
//                         tabIndex={0}
//                       />
//                       {form.brandLogoPreviewUrl ? "Change" : "Upload"}
//                     </label>
//                   </div>
//                 </div>
//                 <div className="mb-4">
//                   <label className="block mb-1 font-semibold text-gray-700">
//                     Car Models and Years
//                   </label>
//                   {form.models.map((model, modelIdx) => (
//                     <div key={modelIdx} className="mb-4 p-3 border rounded">
//                       <div className="flex gap-2 items-end mb-2 flex-wrap">
//                         <input
//                           type="text"
//                           value={model.modelName}
//                           placeholder="Model Name"
//                           required
//                           onChange={(e) => updateModelName(modelIdx, e.target.value)}
//                           className="flex-1 px-2 py-1 border rounded shadow-sm min-w-[120px]"
//                         />
//                         <button
//                           type="button"
//                           onClick={() => removeModel(modelIdx)}
//                           className="text-red-500 px-1 py-1 text-xs rounded font-medium"
//                           disabled={form.models.length === 1}
//                         >
//                           Remove
//                         </button>
//                       </div>
//                       <div className="flex gap-2 flex-wrap">
//                         {Array.isArray(model.years) &&
//                           model.years.map((year, yearIdx) => (
//                             <div key={yearIdx} className="flex gap-1 items-center">
//                               <input
//                                 type="number"
//                                 value={year}
//                                 min="1900"
//                                 max={new Date().getFullYear() + 2}
//                                 placeholder="Year"
//                                 onChange={(e) =>
//                                   updateModelYear(modelIdx, yearIdx, e.target.value)
//                                 }
//                                 className="px-2 py-1 border rounded shadow-sm w-24"
//                               />
//                               <button
//                                 type="button"
//                                 className="text-red-500 px-1 rounded"
//                                 disabled={!Array.isArray(model.years) || model.years.length === 1}
//                                 onClick={() => removeYearFromModel(modelIdx, yearIdx)}
//                               >
//                                 ×
//                               </button>
                         
//                             </div>
//                           ))}
//                         <button
//                           type="button"
//                           className="text-blue-700 px-2 py-1 text-xs border border-blue-700 rounded ml-2"
//                           onClick={() => addYearToModel(modelIdx)}
//                         >
//                           + Year
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                   <button
//                     type="button"
//                     className="px-3 py-1 border border-blue-700 text-blue-700 rounded font-semibold text-sm"
//                     onClick={addModel}
//                   >
//                     + Model
//                   </button>
//                 </div>
//                 <div className="mt-7 flex gap-4 items-center justify-end flex-wrap">
//                   <button
//                     type="submit"
//                     className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition disabled:opacity-70"
//                     disabled={loading}
//                   >
//                     {editingCompany ? "Update" : "Add"}
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => setShowModal(false)}
//                     className="bg-gray-200 text-gray-700 font-medium px-5 py-2 rounded hover:bg-gray-300 transition"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Fade Animation & Responsive extra styling */}
//       <style>
//         {`
//           @keyframes fadein {
//             from { opacity: 0; transform: translateY(30px) scale(0.97); }
//             to   { opacity: 1; transform: none; }
//           }
//           .animate-fadein { animation: fadein .24s cubic-bezier(.4,1,.6,1) both; }
//           @media (max-width: 640px) {
//             .max-w-3xl { max-width: 100vw!important; }
//             .max-w-lg { max-width: 98vw!important; }
//             .p-7 { padding: 1rem!important; }
//           }
//         `}
//       </style>
//     </div>
//   );
// };

// export default CarCompany;

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import axios from "axios";

// --- Types ---
interface CarModel { modelName: string; years?: number[] }
interface CarCompanyType { _id: string; companyName: string; models: CarModel[]; brandLogo?: string | null }
type CarCompanyFormState = {
  companyName: string;
  models: { modelName: string; years?: string[] }[];
  brandLogoFile: File | null;
  brandLogoPreviewUrl: string | null;
};
const EMPTY_FORM: CarCompanyFormState = { companyName: "", models: [{ modelName: "", years: undefined }], brandLogoFile: null, brandLogoPreviewUrl: null };

// ─── STYLE HELPERS ─────────────────────────────────────────────────────────────
const thStyle: React.CSSProperties = { border: "1px solid #d2d6de", background: "#f9fafc", padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 13, color: "#333", whiteSpace: "nowrap" };
const tdStyle: React.CSSProperties = { border: "1px solid #d2d6de", padding: "10px 12px", fontSize: 13, color: "#555", verticalAlign: "middle" };

const CarCompany: React.FC = () => {
  const [companies, setCompanies] = useState<CarCompanyType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CarCompanyType | null>(null);
  const [form, setForm] = useState<CarCompanyFormState>(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const clearAlerts = () => { setError(""); setSuccessMsg(""); };

  const fetchCompanies = async (q: string = "") => {
    setLoading(true); clearAlerts();
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/admin/car-company`;
      if (q) url += `?companyName=${encodeURIComponent(q)}`;
      const res = await axios.get(url);
      setCompanies(res.data?.data ?? []);
    } catch (err: any) { setError(err?.response?.data?.message || "Error fetching companies"); }
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, []);

  function getBackendImageUrl(path: string) {
    if (/^https?:\/\//.test(path)) return path;
    const base = import.meta.env.VITE_API_URL || "";
    return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  }

  const openAddModal = () => {
    clearAlerts(); setEditingCompany(null); setForm({ ...EMPTY_FORM }); setShowModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 150);
  };
  const openEditModal = (company: CarCompanyType) => {
    clearAlerts(); setEditingCompany(company);
    setForm({ companyName: company.companyName, models: company.models.map((m) => ({ modelName: m.modelName, years: m.years ? m.years.map((y) => y.toString()) : undefined })), brandLogoFile: null, brandLogoPreviewUrl: company.brandLogo ? getBackendImageUrl(company.brandLogo) : null });
    setShowModal(true); setTimeout(() => nameInputRef.current?.focus(), 150);
  };

  const updateFormField = (field: keyof CarCompanyFormState, value: any) => setForm((curr) => ({ ...curr, [field]: value }));
  const updateModelName = (idx: number, value: string) => setForm((curr) => { const models = [...curr.models]; models[idx].modelName = value; return { ...curr, models }; });
  const updateModelYear = (modelIdx: number, yearIdx: number, value: string) => setForm((curr) => { const models = [...curr.models]; if (!models[modelIdx].years) models[modelIdx].years = []; models[modelIdx].years![yearIdx] = value; return { ...curr, models }; });
  const addModel = () => setForm((curr) => ({ ...curr, models: [...curr.models, { modelName: "", years: undefined }] }));
  const removeModel = (idx: number) => setForm((curr) => { const m = [...curr.models]; m.splice(idx, 1); return { ...curr, models: m.length ? m : [{ modelName: "", years: undefined }] }; });
  const addYearToModel = (modelIdx: number) => setForm((curr) => { const models = [...curr.models]; if (!models[modelIdx].years) models[modelIdx].years = [""]; else models[modelIdx].years!.push(""); return { ...curr, models }; });
  const removeYearFromModel = (modelIdx: number, yearIdx: number) => setForm((curr) => { const models = [...curr.models]; if (models[modelIdx].years) { models[modelIdx].years!.splice(yearIdx, 1); if (models[modelIdx].years!.length === 0) models[modelIdx].years = undefined; } return { ...curr, models }; });

  const handleBrandLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    const file = e.target.files[0];
    setForm((curr) => { if (curr.brandLogoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(curr.brandLogoPreviewUrl); return { ...curr, brandLogoFile: file, brandLogoPreviewUrl: URL.createObjectURL(file) }; });
  };
  const handleRemoveBrandLogo = () => setForm((curr) => { if (curr.brandLogoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(curr.brandLogoPreviewUrl); return { ...curr, brandLogoFile: null, brandLogoPreviewUrl: null }; });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); clearAlerts();
    if (!form.companyName.trim() || !form.models.length || form.models.some((m) => !m.modelName.trim())) { setError("Company name and model names are required."); return; }
    for (const m of form.models) { if (Array.isArray(m.years) && m.years.length) { for (const y of m.years) { if (y && (isNaN(Number(y)) || !y.trim())) { setError("Provided years must be valid numbers."); return; } } } }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("companyName", form.companyName.trim());
      formData.append("models", JSON.stringify(form.models.map((m) => ({ modelName: m.modelName.trim(), ...(Array.isArray(m.years) && m.years.some((y) => y.trim()) ? { years: m.years.filter((y) => y.trim() !== "").map((y) => Number(y)) } : {}) }))));
      if (form.brandLogoFile) formData.append("brandLogo", form.brandLogoFile);
      if (editingCompany) { await axios.patch(`${import.meta.env.VITE_API_URL}/api/admin/car-company/${editingCompany._id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }); setSuccessMsg("Car company updated successfully."); }
      else { await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/car-company`, formData, { headers: { "Content-Type": "multipart/form-data" } }); setSuccessMsg("Car company added successfully."); }
      setShowModal(false); setForm({ ...EMPTY_FORM }); setEditingCompany(null); fetchCompanies(query);
    } catch (err: any) { setError(err?.response?.data?.message || (editingCompany ? "Failed to update" : "Failed to add") + " car company"); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this car company?")) return;
    setDeletingId(id); setError(""); setSuccessMsg("");
    try { await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/car-company/${id}`); setSuccessMsg("Car company deleted."); fetchCompanies(query); }
    catch (err: any) { setError(err?.response?.data?.message || "Failed to delete car company"); }
    setDeletingId(null);
  };

  useEffect(() => { return () => { if (form.brandLogoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(form.brandLogoPreviewUrl); }; }, [showModal]);

  return (
    <>
      {/* ── Add/Edit Modal ────────────────────────────────────────────────── */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 4, width: "min(560px, 96vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 5px 15px rgba(0,0,0,.5)" }}
          >
            {/* Modal Header */}
            <div style={{ background: "#3c8dbc", color: "#fff", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "4px 4px 0 0", flexShrink: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>{editingCompany ? "Edit Car Company" : "Add New Car Company"}</span>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 22, lineHeight: 1, cursor: "pointer" }} type="button">×</button>
            </div>
            {/* Modal Body */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
              {error && <div style={{ marginBottom: 12, padding: "8px 12px", background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, color: "#c0392b", fontSize: 13 }}>{error}</div>}
              <form onSubmit={handleFormSubmit} autoComplete="off" encType="multipart/form-data">

                {/* Company Name */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 5 }}>Company Name <span style={{ color: "#e73d3d" }}>*</span></label>
                  <input ref={nameInputRef} type="text" value={form.companyName} required autoFocus
                    onChange={(e) => updateFormField("companyName", e.target.value)}
                    style={{ width: "100%", border: "1px solid #d2d6de", borderRadius: 3, padding: "7px 10px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    placeholder="Enter company name" />
                </div>

                {/* Brand Logo */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 5 }}>Brand Logo <span style={{ color: "#888", fontWeight: 400 }}>(optional)</span></label>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {form.brandLogoPreviewUrl ? (
                      <div style={{ position: "relative", width: 72, height: 56 }}>
                        <img src={form.brandLogoPreviewUrl} alt="Logo Preview" style={{ width: 72, height: 56, objectFit: "contain", border: "1px solid #d2d6de", borderRadius: 3, background: "#fafafa" }} />
                        <button type="button" onClick={handleRemoveBrandLogo}
                          style={{ position: "absolute", top: -8, right: -8, width: 20, height: 20, borderRadius: "50%", background: "#555", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "#aaa", fontStyle: "italic" }}>No logo selected</span>
                    )}
                    <label style={{ padding: "5px 12px", border: "1px solid #0073b7", borderRadius: 3, color: "#0073b7", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleBrandLogoChange} />
                      {form.brandLogoPreviewUrl ? "Change" : "Upload"}
                    </label>
                  </div>
                </div>

                {/* Models */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Car Models & Years <span style={{ color: "#e73d3d" }}>*</span></label>
                  {form.models.map((model, modelIdx) => (
                    <div key={modelIdx} style={{ border: "1px solid #d2d6de", borderRadius: 3, padding: "12px 14px", marginBottom: 10, background: "#f9fafc" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                        <input type="text" value={model.modelName} placeholder="Model Name" required
                          onChange={(e) => updateModelName(modelIdx, e.target.value)}
                          style={{ flex: 1, border: "1px solid #d2d6de", borderRadius: 3, padding: "6px 10px", fontSize: 13, outline: "none" }} />
                        <button type="button" onClick={() => removeModel(modelIdx)} disabled={form.models.length === 1}
                          style={{ padding: "5px 10px", border: "1px solid #d2d6de", borderRadius: 3, background: form.models.length === 1 ? "#f4f4f4" : "#f2dede", color: form.models.length === 1 ? "#aaa" : "#a94442", fontSize: 12, cursor: form.models.length === 1 ? "not-allowed" : "pointer" }}>
                          Remove
                        </button>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {Array.isArray(model.years) && model.years.map((year, yearIdx) => (
                          <div key={yearIdx} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <input type="number" value={year} min="1900" max={new Date().getFullYear() + 2} placeholder="Year"
                              onChange={(e) => updateModelYear(modelIdx, yearIdx, e.target.value)}
                              style={{ width: 90, border: "1px solid #d2d6de", borderRadius: 3, padding: "5px 8px", fontSize: 13, outline: "none" }} />
                            <button type="button" onClick={() => removeYearFromModel(modelIdx, yearIdx)}
                              style={{ background: "none", border: "none", color: "#a94442", fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>×</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addYearToModel(modelIdx)}
                          style={{ padding: "4px 10px", border: "1px solid #0073b7", borderRadius: 3, color: "#0073b7", fontSize: 12, cursor: "pointer", background: "#fff" }}>+ Year</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addModel}
                    style={{ padding: "6px 14px", border: "1px solid #0073b7", borderRadius: 3, color: "#0073b7", fontSize: 13, fontWeight: 600, cursor: "pointer", background: "#fff" }}>+ Add Model</button>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
                  <button type="button" onClick={() => setShowModal(false)}
                    style={{ padding: "7px 18px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#444", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" disabled={loading}
                    style={{ padding: "7px 20px", borderRadius: 3, border: "none", background: loading ? "#aaa" : "#0073b7", color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                    {editingCompany ? "Update" : "Add Company"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Page ──────────────────────────────────────────────────────────── */}
      <div
        // You may use Tailwind class if setup, or fallback to CSS below.
        className="h-[92vh] overflow-y-auto bg-[#f0f0f0] px-6 py-5 font-sans"
      
      >

        {/* Heading */}
        <h1 style={{ fontSize: 34, fontWeight: 300, color: "#333", marginBottom: 20, marginTop: 0 }}>Car Companies</h1>

        {/* Card */}
        <div className="mb-10" style={{ background: "#fff", border: "1px solid #d2d6de", borderRadius: 3, boxShadow: "0 1px 1px rgba(0,0,0,.1)" }}>

          {/* Card Header */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #f4f4f4", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 400, color: "#444" }}>Company List</h3>
            <button type="button" onClick={openAddModal}
              style={{ padding: "6px 16px", borderRadius: 3, border: "none", background: "#0073b7", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              + Add New
            </button>
          </div>

          {/* Card Body */}
          <div style={{ padding: 20 }}>

            {/* Search Bar */}
            <div style={{ marginBottom: 16 }}>
              <form onSubmit={(e) => { e.preventDefault(); fetchCompanies(query); }} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input value={query} onChange={(e) => setQuery(e.target.value)} type="text" placeholder="Search by company name…"
                  style={{ height: 34, width: 260, border: "1px solid #d2d6de", borderRadius: 3, padding: "0 10px", fontSize: 14, outline: "none" }} />
                <button type="submit" style={{ padding: "6px 14px", borderRadius: 3, border: "none", background: "#0073b7", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Search</button>
                <button type="button" onClick={() => { setQuery(""); fetchCompanies(""); }}
                  style={{ padding: "6px 14px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#555", fontSize: 13, cursor: "pointer" }}>Clear</button>
              </form>
            </div>

            {/* Alerts */}
            {error && <div style={{ marginBottom: 14, padding: "8px 14px", background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, color: "#c0392b", fontSize: 13 }}>{error}</div>}
            {successMsg && <div style={{ marginBottom: 14, padding: "8px 14px", background: "#f0fff4", border: "1px solid #c3e6cb", borderRadius: 3, color: "#27ae60", fontSize: 13 }}>{successMsg}</div>}

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Company Name</th>
                    <th style={thStyle}>Models</th>
                    <th style={thStyle}>Brand Logo</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} style={{ ...tdStyle, textAlign: "center", color: "#888", padding: "40px 0" }}>Loading…</td></tr>
                  ) : companies.length === 0 ? (
                    <tr><td colSpan={4} style={{ ...tdStyle, textAlign: "center", color: "#aaa", padding: "40px 0" }}>No car companies found.</td></tr>
                  ) : (
                    companies.map((company) => (
                      <tr key={company._id}>
                        <td style={{ ...tdStyle, fontWeight: 500 }}>{company.companyName}</td>
                        <td style={tdStyle}>
                          {company.models.map((m, idx) => (
                            <div key={idx} style={{ fontSize: 12, lineHeight: "1.7" }}>
                              <span style={{ fontWeight: 600 }}>{m.modelName}</span>
                              {Array.isArray(m.years) && m.years.length > 0 && (
                                <span style={{ color: "#777" }}>: {m.years.join(", ")}</span>
                              )}
                            </div>
                          ))}
                        </td>
                        <td style={tdStyle}>
                          {company.brandLogo ? (
                            <img src={getBackendImageUrl(company.brandLogo)} alt="Brand Logo"
                              style={{ height: 40, maxWidth: 72, objectFit: "contain", border: "1px solid #d2d6de", borderRadius: 3, background: "#fafafa" }} loading="lazy" />
                          ) : (
                            <span style={{ fontSize: 12, color: "#aaa", fontStyle: "italic" }}>No logo</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button type="button" onClick={() => openEditModal(company)}
                              style={{ padding: "4px 12px", borderRadius: 3, border: "1px solid #0073b7", background: "#fff", color: "#0073b7", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                              Edit
                            </button>
                            <button type="button" disabled={deletingId === company._id} onClick={() => handleDelete(company._id)}
                              style={{ padding: "4px 12px", borderRadius: 3, border: "1px solid #d2d6de", background: deletingId === company._id ? "#f4f4f4" : "#f2dede", color: deletingId === company._id ? "#aaa" : "#a94442", fontSize: 12, fontWeight: 600, cursor: deletingId === company._id ? "not-allowed" : "pointer" }}>
                              {deletingId === company._id ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CarCompany;