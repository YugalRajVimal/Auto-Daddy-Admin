// import React, { useEffect, useState, useRef } from "react";
// import axios, { AxiosError } from "axios";

// // Types
// interface SectionData {
//   heading: string;
//   desc: string;
// }
// interface DashboardDataType {
//   thoughtOfTheDay?: string;
//   sections?: SectionData[];
// }

// // API Root
// const API_BASE: string =
//   typeof import.meta !== "undefined" && import.meta.env.VITE_API_URL
//     ? `${import.meta.env.VITE_API_URL}/api/admin`
//     : "/api/admin";

// type ModalSectionType = "all" | "thought" | number;

// const DashboardData: React.FC = () => {
//   const [dashboardData, setDashboardData] = useState<DashboardDataType | null>(
//     null
//   );
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string>("");
//   const [successMsg, setSuccessMsg] = useState<string>("");

//   // Modal and form state
//   const [showModal, setShowModal] = useState<boolean>(false);
//   const [modalSection, setModalSection] = useState<ModalSectionType>("all");
//   const [editData, setEditData] = useState<DashboardDataType>({});
//   const [submitting, setSubmitting] = useState<boolean>(false);
//   const [deleting, setDeleting] = useState<boolean>(false);
//   const firstInputRef =
//     useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

//   // Fetch dashboard data
//   const fetchDashboardData = async (): Promise<void> => {
//     setLoading(true);
//     setError("");
//     try {
//       const { data } = await axios.get(`${API_BASE}/dashboard-data`);
//       setDashboardData({
//         thoughtOfTheDay:
//           data.data?.thoughtOfTheDay ??
//           data.data?.thoughtoftheday ??
//           "",
//         sections: Array.isArray(data.data?.sections)
//           ? data.data.sections.map((s: any) => ({
//               heading: s.heading || "",
//               desc: s.desc || "",
//             }))
//           : [],
//       });
//     } catch (err) {
//       const axiosErr = err as AxiosError<any>;
//       setError(
//         axiosErr?.response?.data?.message ||
//           (axiosErr.message as string) ||
//           "Failed to fetch dashboard data"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDashboardData();
//   }, []);

//   // For modal focus
//   useEffect(() => {
//     if (showModal && firstInputRef.current) {
//       firstInputRef.current.focus();
//     }
//   }, [showModal, modalSection]);

//   const clearAlerts = () => {
//     setError("");
//     setSuccessMsg("");
//   };

//   // Modal open for edit
//   const openModal = (
//     section: ModalSectionType,
//     existing?: DashboardDataType | null,

//   ) => {
//     if (section === "all") {
//       setEditData(existing ? { ...existing } : { sections: [], thoughtOfTheDay: "" });
//       setModalSection("all");
//     } else if (section === "thought") {
//       setEditData({
//         thoughtOfTheDay: existing?.thoughtOfTheDay ?? "",
//       });
//       setModalSection("thought");
//     } else if (typeof section === "number") {
//       setEditData({
//         sections: [
//           existing && existing.sections && existing.sections[section]
//             ? { ...existing.sections[section] }
//             : { heading: "", desc: "" },
//         ],
//       });
//       setModalSection(section);
//     }
//     setShowModal(true);
//     setTimeout(() => {
//       if (firstInputRef.current) firstInputRef.current.focus();
//     }, 70);
//     clearAlerts();
//   };

//   const closeModal = () => {
//     setShowModal(false);
//     setEditData({});
//     setModalSection("all");
//     clearAlerts();
//   };

//   // Save/Update dashboard data (PATCH or POST)
//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setSubmitting(true);
//     clearAlerts();

//     try {
//       let body: DashboardDataType = {};
//       if (modalSection === "all") {
//         body = {
//           thoughtOfTheDay: editData.thoughtOfTheDay ?? "",
//           sections: editData.sections ?? [],
//         };
//       } else if (modalSection === "thought") {
//         body = { thoughtOfTheDay: editData.thoughtOfTheDay ?? "" };
//       } else if (typeof modalSection === "number") {
//         // update a single section index
//         if (
//           editData.sections &&
//           editData.sections.length === 1 &&
//           dashboardData?.sections
//         ) {
//           const idx = modalSection;
//           const updatedSections = [...dashboardData.sections];
//           updatedSections[idx] = { ...editData.sections[0] };
//           body = {
//             thoughtOfTheDay: dashboardData.thoughtOfTheDay ?? "",
//             sections: updatedSections,
//           };
//         }
//       }
//       const method =
//         dashboardData && typeof dashboardData === "object"
//           ? axios.patch
//           : axios.post;
//       const { data } = await method(`${API_BASE}/dashboard-data`, body);
//       setDashboardData({
//         thoughtOfTheDay: data.data?.thoughtOfTheDay ?? "",
//         sections: Array.isArray(data.data?.sections)
//           ? data.data.sections.map((s: any) => ({
//               heading: s.heading || "",
//               desc: s.desc || "",
//             }))
//           : [],
//       });
//       setSuccessMsg(
//         dashboardData
//           ? "Dashboard data updated."
//           : "Dashboard data created."
//       );
//       setShowModal(false);
//       setEditData({});
//       setModalSection("all");
//     } catch (err) {
//       const axiosErr = err as AxiosError<any>;
//       setError(
//         axiosErr?.response?.data?.message ||
//           (axiosErr.message as string) ||
//           "Failed to save dashboard data"
//       );
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Delete dashboard data
//   const handleDelete = async () => {
//     if (
//       !window.confirm(
//         "Are you sure you want to delete all dashboard data? This cannot be undone."
//       )
//     )
//       return;
//     setDeleting(true);
//     clearAlerts();
//     try {
//       await axios.delete(`${API_BASE}/dashboard-data`);
//       setDashboardData(null);
//       setSuccessMsg("Dashboard data deleted.");
//       setShowModal(false);
//       setEditData({});
//       setModalSection("all");
//     } catch (err) {
//       const axiosErr = err as AxiosError<any>;
//       setError(
//         axiosErr?.response?.data?.message ||
//           (axiosErr.message as string) ||
//           "Failed to delete dashboard data"
//       );
//     } finally {
//       setDeleting(false);
//     }
//   };

//   // Form field change
//   function updateEditField(
//     which: "thought" | number | "all",
//     field: "heading" | "desc" | "thoughtOfTheDay",
//     value: string,
//     idx?: number
//   ) {
//     setEditData((prev: DashboardDataType) => {
//       if (which === "thought" || (which === "all" && field === "thoughtOfTheDay")) {
//         return { ...prev, thoughtOfTheDay: value };
//       }
//       // Section update:
//       if (which === "all") {
//         if (typeof idx === "number") {
//           const sections = prev.sections ? [...prev.sections] : [];
//           sections[idx] = { ...sections[idx], [field]: value };
//           return { ...prev, sections };
//         }
//       } else if (typeof which === "number") {
//         // editing single section modal
//         return {
//           ...prev,
//           sections: [
//             {
//               ...((prev.sections && prev.sections[0]) || { heading: "", desc: "" }),
//               [field]: value,
//             },
//           ],
//         };
//       }
//       return prev;
//     });
//   }

//   // Add a new dynamic section in "edit all" mode
//   function handleAddSection() {
//     setEditData((prev: DashboardDataType) => ({
//       ...prev,
//       sections: [...(prev.sections ?? []), { heading: "", desc: "" }],
//     }));
//     setTimeout(() => {
//       // focus the new heading input
//       const inputEls = document.querySelectorAll<HTMLInputElement>(
//         '[data-sectioninput="heading"]'
//       );
//       if (inputEls.length) {
//         inputEls[inputEls.length - 1].focus();
//       }
//     }, 120);
//   }

//   function handleRemoveSection(idx: number) {
//     setEditData((prev: DashboardDataType) => {
//       const sections = prev.sections ? [...prev.sections] : [];
//       sections.splice(idx, 1);
//       return { ...prev, sections };
//     });
//   }

//   // Render Modal Fields
//   const renderModalFields = (): React.ReactNode => {
//     if (modalSection === "thought") {
//       // Thought of the Day only
//       return (
//         <div>
//           <label className="block font-medium mb-1">Thought of the Day</label>
//           <textarea
//             ref={firstInputRef as React.RefObject<HTMLTextAreaElement>}
//             value={editData.thoughtOfTheDay || ""}
//             rows={2}
//             onChange={e =>
//               updateEditField("thought", "thoughtOfTheDay", e.target.value)
//             }
//             required
//             className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
//             placeholder="Enter thought of the day"
//           />
//         </div>
//       );
//     } else if (typeof modalSection === "number") {
//       // Editing a single section
//       return (
//         <div>
//           <label className="block font-medium mb-1">Heading</label>
//           <input
//             ref={firstInputRef as React.RefObject<HTMLInputElement>}
//             type="text"
//             value={editData.sections?.[0]?.heading || ""}
//             onChange={e => updateEditField(modalSection, "heading", e.target.value)}
//             className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
//             placeholder="Enter heading"
//             required
//             data-sectioninput="heading"
//           />
//           <label className="block font-medium mb-1 mt-3">Description</label>
//           <textarea
//             value={editData.sections?.[0]?.desc || ""}
//             onChange={e => updateEditField(modalSection, "desc", e.target.value)}
//             className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
//             placeholder="Enter description"
//             required
//             rows={2}
//           />
//         </div>
//       );
//     } else if (modalSection === "all") {
//       // Editing all data (thought + sections)
//       return (
//         <div className="overflow-y-auto max-h-[60vh] sm:max-h-[65vh] pr-2">
//           <div className="mb-7">
//             <label className="block font-medium mb-1">Thought of the Day</label>
//             <textarea
//               ref={firstInputRef as React.RefObject<HTMLTextAreaElement>}
//               value={editData.thoughtOfTheDay || ""}
//               rows={2}
//               onChange={e =>
//                 updateEditField("all", "thoughtOfTheDay", e.target.value)
//               }
//               required
//               className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
//               placeholder="Enter thought of the day"
//             />
//           </div>
//           <div className="mb-1 flex justify-between items-center">
//             <span className="font-semibold">Additional Sections</span>
//             <button
//               type="button"
//               className="px-3 py-1 bg-blue-200 text-blue-800 rounded hover:bg-blue-300 shadow text-xs font-semibold"
//               onClick={handleAddSection}
//             >
//               + Add Section
//             </button>
//           </div>
//           {(editData.sections ?? []).length === 0 && (
//             <div className="text-gray-400 mb-3">No sections. Add one!</div>
//           )}
//           {(editData.sections ?? []).map((sec, idx) => (
//             <div key={idx} className="mb-5 p-4 border rounded bg-gray-50 relative">
//               <div className="mb-2">
//                 <label className="block text-gray-600 font-medium mb-0.5">
//                   Heading
//                 </label>
//                 <input
//                   type="text"
//                   data-sectioninput="heading"
//                   ref={
//                     idx === 0
//                       ? (firstInputRef as React.RefObject<HTMLInputElement>)
//                       : undefined
//                   }
//                   value={sec.heading}
//                   onChange={e =>
//                     updateEditField("all", "heading", e.target.value, idx)
//                   }
//                   className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
//                   placeholder="Enter heading"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-gray-600 font-medium mb-0.5">
//                   Description
//                 </label>
//                 <textarea
//                   value={sec.desc}
//                   onChange={e =>
//                     updateEditField("all", "desc", e.target.value, idx)
//                   }
//                   className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
//                   placeholder="Enter description"
//                   rows={2}
//                   required
//                 />
//               </div>
//               <button
//                 type="button"
//                 onClick={() => handleRemoveSection(idx)}
//                 className="absolute top-1 right-2 text-red-500 hover:text-red-700 text-lg font-bold"
//                 tabIndex={-1}
//                 title="Remove Section"
//               >
//                 ×
//               </button>
//             </div>
//           ))}
//         </div>
//       );
//     }
//     return null;
//   };

//   return (
//     <div className="max-w-5xl mx-auto px-5 py-8 h-[85vh] overflow-y-auto bg-gray-50 px-2 py-6 sm:px-8">
//       <div className="mb-7 flex items-center justify-between">
//         <h2 className="text-2xl font-bold">Dashboard Data</h2>
//         <button
//           className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded shadow font-semibold text-sm transition"
//           onClick={() => openModal("all", dashboardData)}
//         >
//           {dashboardData ? "Edit All" : "Create"}
//         </button>
//       </div>
//       {loading && (
//         <div className="text-gray-500 mb-4">Loading dashboard data...</div>
//       )}
//       {error && (
//         <div className="mb-4 text-red-600 bg-red-50 rounded px-3 py-2">{error}</div>
//       )}
//       {successMsg && (
//         <div className="mb-4 text-green-700 bg-green-50 rounded px-3 py-2">
//           {successMsg}
//         </div>
//       )}

//       {!loading && !dashboardData && (
//         <div className="p-5 rounded bg-gray-50 text-gray-500 shadow mb-10">
//           No dashboard data configured in backend.
//         </div>
//       )}
//       {dashboardData && (
//         <div className="bg-white rounded shadow px-5 py-6">
//           {/* Thought of the Day */}
//           <div className="mb-6 border-b border-gray-100 pb-6">
//             <div className="flex justify-between items-center mb-2">
//               <div className="font-medium text-gray-700">Thought of the Day</div>
//               <button
//                 className="bg-blue-200 hover:bg-blue-300 text-blue-900 px-3 py-1 rounded text-xs font-semibold"
//                 onClick={() => openModal("thought", dashboardData)}
//               >
//                 Edit
//               </button>
//             </div>
//             <blockquote className="italic text-gray-900 min-h-[1.7em] mt-1">
//               {dashboardData.thoughtOfTheDay ? (
//                 dashboardData.thoughtOfTheDay
//               ) : (
//                 <span className="text-gray-400">Not set</span>
//               )}
//             </blockquote>
//           </div>
//           {/* Dynamic Sections */}
//           {(dashboardData.sections ?? []).map((sec, idx) => (
//             <div key={idx} className="mb-6 border-b border-gray-100 pb-6">
//               <div className="flex justify-between items-center mb-2">
//                 <div className="font-semibold">Section {idx + 1}</div>
//                 <button
//                   className="bg-blue-200 hover:bg-blue-300 text-blue-900 px-3 py-1 rounded text-xs font-semibold"
//                   onClick={() => openModal(idx, dashboardData)}
//                 >
//                   Edit
//                 </button>
//               </div>
//               <div className="mt-1 ml-2">
//                 <div className="text-gray-900 font-medium">
//                   {sec.heading || (
//                     <span className="text-gray-400">No heading</span>
//                   )}
//                 </div>
//                 <div className="text-gray-700 whitespace-pre-line min-h-[1.7em] mt-0.5">
//                   {sec.desc || (
//                     <span className="text-gray-400">No description set.</span>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ))}

//           <div className="flex justify-end gap-4 mt-6">
//             <button
//               onClick={() => openModal("all", dashboardData)}
//               className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition"
//             >
//               Edit All
//             </button>
//             <button
//               type="button"
//               onClick={handleDelete}
//               className="bg-red-100 text-red-700 font-medium px-5 py-2 rounded hover:bg-red-200 transition"
//               disabled={deleting}
//             >
//               {deleting ? "Deleting..." : "Delete"}
//             </button>
//           </div>
//         </div>
//       )}

//       {showModal && (
//         <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm transition">
//           <div
//             className={
//               "bg-white rounded-xl shadow-lg max-w-lg w-full px-0 sm:px-8 py-0 sm:py-8 animate-fadein relative flex flex-col" +
//               (modalSection === "all"
//                 ? " min-h-[65vh] max-h-[95vh] justify-start"
//                 : " px-8 py-8")
//             }
//             style={
//               modalSection === "all"
//                 ? { maxHeight: "95vh", minHeight: "60vh", width: "100%", padding: 0 }
//                 : undefined
//             }
//           >
//             <div className="px-8 pt-8 mb-7 flex items-center justify-between flex-shrink-0">
//               <div className="text-xl font-bold">
//                 {modalSection === "all"
//                   ? dashboardData
//                     ? "Edit All Dashboard Data"
//                     : "Create Dashboard Data"
//                   : modalSection === "thought"
//                   ? "Edit Thought of the Day"
//                   : `Edit Section ${typeof modalSection === "number" ? modalSection + 1 : ""}`}
//               </div>
//             </div>
//             {error && (
//               <div className="px-8 mb-4 text-red-600 bg-red-50 rounded px-3 py-2">
//                 {error}
//               </div>
//             )}
//             <form
//               onSubmit={handleSubmit}
//               autoComplete="off"
//               className={
//                 modalSection === "all"
//                   ? "flex flex-col flex-1 min-h-0"
//                   : undefined
//               }
//               style={
//                 modalSection === "all"
//                   ? { minHeight: 0, flex: "1 1 0%" }
//                   : undefined
//               }
//             >
//               {/* Fields */}
//               <div
//                 className={
//                   modalSection === "all"
//                     ? "flex-1 min-h-0 px-8 pb-2"
//                     : undefined
//                 }
//                 style={modalSection === "all" ? { minHeight: 0 } : undefined}
//               >
//                 {renderModalFields()}
//               </div>
//               <div className="px-8 mt-7 flex gap-4 items-center justify-end bg-white flex-shrink-0">
//                 <button
//                   type="submit"
//                   className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition disabled:opacity-70"
//                   disabled={submitting}
//                 >
//                   {submitting
//                     ? dashboardData
//                       ? modalSection === "all"
//                         ? "Saving All..."
//                         : "Saving..."
//                       : modalSection === "all"
//                         ? "Creating All..."
//                         : "Creating..."
//                     : dashboardData
//                       ? modalSection === "all"
//                         ? "Save All"
//                         : "Save"
//                       : modalSection === "all"
//                         ? "Create All"
//                         : "Create"}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={closeModal}
//                   className="bg-gray-200 text-gray-700 font-medium px-5 py-2 rounded hover:bg-gray-300 transition"
//                   disabled={submitting}
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//           <style>
//             {`
//               @keyframes fadein {
//                 from { opacity: 0; transform: translateY(30px) scale(0.97); }
//                 to   { opacity: 1; transform: none; }
//               }
//               .animate-fadein { animation: fadein .24s cubic-bezier(.4,1,.6,1) both; }
//               @media (max-width: 640px) {
//                 .max-w-lg { max-width: 98vw !important; }
//               }
//             `}
//           </style>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DashboardData;

// DashboardData.tsx
import React, { useEffect, useState, useRef } from "react";
import axios, { AxiosError } from "axios";

interface SectionData { heading: string; desc: string; }
interface DashboardDataType { thoughtOfTheDay?: string; sections?: SectionData[]; }

const API_BASE: string =
  typeof import.meta !== "undefined" && import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/admin`
    : "/api/admin";

type ModalSectionType = "all" | "thought" | number;

const DashboardData: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardDataType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalSection, setModalSection] = useState<ModalSectionType>("all");
  const [editData, setEditData] = useState<DashboardDataType>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const fetchDashboardData = async (): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_BASE}/dashboard-data`);
      setDashboardData({
        thoughtOfTheDay: data.data?.thoughtOfTheDay ?? data.data?.thoughtoftheday ?? "",
        sections: Array.isArray(data.data?.sections)
          ? data.data.sections.map((s: any) => ({ heading: s.heading || "", desc: s.desc || "" }))
          : [],
      });
    } catch (err) {
      const axiosErr = err as AxiosError<any>;
      setError(axiosErr?.response?.data?.message || (axiosErr.message as string) || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  useEffect(() => {
    if (showModal && firstInputRef.current) firstInputRef.current.focus();
  }, [showModal, modalSection]);

  const clearAlerts = () => { setError(""); setSuccessMsg(""); };

  const openModal = (section: ModalSectionType, existing?: DashboardDataType | null) => {
    if (section === "all") {
      setEditData(existing ? { ...existing } : { sections: [], thoughtOfTheDay: "" });
      setModalSection("all");
    } else if (section === "thought") {
      setEditData({ thoughtOfTheDay: existing?.thoughtOfTheDay ?? "" });
      setModalSection("thought");
    } else if (typeof section === "number") {
      setEditData({
        sections: [
          existing && existing.sections && existing.sections[section]
            ? { ...existing.sections[section] }
            : { heading: "", desc: "" },
        ],
      });
      setModalSection(section);
    }
    setShowModal(true);
    setTimeout(() => { if (firstInputRef.current) firstInputRef.current.focus(); }, 70);
    clearAlerts();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditData({});
    setModalSection("all");
    clearAlerts();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    clearAlerts();

    try {
      let body: DashboardDataType = {};
      if (modalSection === "all") {
        body = { thoughtOfTheDay: editData.thoughtOfTheDay ?? "", sections: editData.sections ?? [] };
      } else if (modalSection === "thought") {
        body = { thoughtOfTheDay: editData.thoughtOfTheDay ?? "" };
      } else if (typeof modalSection === "number") {
        if (editData.sections && editData.sections.length === 1 && dashboardData?.sections) {
          const idx = modalSection;
          const updatedSections = [...dashboardData.sections];
          updatedSections[idx] = { ...editData.sections[0] };
          body = { thoughtOfTheDay: dashboardData.thoughtOfTheDay ?? "", sections: updatedSections };
        }
      }
      const method = dashboardData && typeof dashboardData === "object" ? axios.patch : axios.post;
      const { data } = await method(`${API_BASE}/dashboard-data`, body);
      setDashboardData({
        thoughtOfTheDay: data.data?.thoughtOfTheDay ?? "",
        sections: Array.isArray(data.data?.sections)
          ? data.data.sections.map((s: any) => ({ heading: s.heading || "", desc: s.desc || "" }))
          : [],
      });
      setSuccessMsg(dashboardData ? "Dashboard data updated." : "Dashboard data created.");
      setShowModal(false);
      setEditData({});
      setModalSection("all");
    } catch (err) {
      const axiosErr = err as AxiosError<any>;
      setError(axiosErr?.response?.data?.message || (axiosErr.message as string) || "Failed to save dashboard data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete all dashboard data? This cannot be undone.")) return;
    setDeleting(true);
    clearAlerts();
    try {
      await axios.delete(`${API_BASE}/dashboard-data`);
      setDashboardData(null);
      setSuccessMsg("Dashboard data deleted.");
      setShowModal(false);
      setEditData({});
      setModalSection("all");
    } catch (err) {
      const axiosErr = err as AxiosError<any>;
      setError(axiosErr?.response?.data?.message || (axiosErr.message as string) || "Failed to delete dashboard data");
    } finally {
      setDeleting(false);
    }
  };

  function updateEditField(which: "thought" | number | "all", field: "heading" | "desc" | "thoughtOfTheDay", value: string, idx?: number) {
    setEditData((prev: DashboardDataType) => {
      if (which === "thought" || (which === "all" && field === "thoughtOfTheDay")) {
        return { ...prev, thoughtOfTheDay: value };
      }
      if (which === "all") {
        if (typeof idx === "number") {
          const sections = prev.sections ? [...prev.sections] : [];
          sections[idx] = { ...sections[idx], [field]: value };
          return { ...prev, sections };
        }
      } else if (typeof which === "number") {
        return {
          ...prev,
          sections: [{ ...((prev.sections && prev.sections[0]) || { heading: "", desc: "" }), [field]: value }],
        };
      }
      return prev;
    });
  }

  function handleAddSection() {
    setEditData((prev: DashboardDataType) => ({ ...prev, sections: [...(prev.sections ?? []), { heading: "", desc: "" }] }));
    setTimeout(() => {
      const inputEls = document.querySelectorAll<HTMLInputElement>('[data-sectioninput="heading"]');
      if (inputEls.length) inputEls[inputEls.length - 1].focus();
    }, 120);
  }

  function handleRemoveSection(idx: number) {
    setEditData((prev: DashboardDataType) => {
      const sections = prev.sections ? [...prev.sections] : [];
      sections.splice(idx, 1);
      return { ...prev, sections };
    });
  }

  const inputCls = "h-9 w-full rounded border border-[#d2d6de] px-3 outline-none focus:border-[#3c8dbc]";
  const textareaCls = "w-full rounded border border-[#d2d6de] px-3 py-2 outline-none focus:border-[#3c8dbc]";

  const renderModalFields = (): React.ReactNode => {
    if (modalSection === "thought") {
      return (
        <div>
          <label className="mb-1 block text-[14px] font-bold text-[#333]">Thought of the Day</label>
          <textarea
            ref={firstInputRef as React.RefObject<HTMLTextAreaElement>}
            value={editData.thoughtOfTheDay || ""}
            rows={2}
            onChange={(e) => updateEditField("thought", "thoughtOfTheDay", e.target.value)}
            required
            className={textareaCls}
            placeholder="Enter thought of the day"
          />
        </div>
      );
    } else if (typeof modalSection === "number") {
      return (
        <div>
          <label className="mb-1 block text-[14px] font-bold text-[#333]">Heading</label>
          <input
            ref={firstInputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editData.sections?.[0]?.heading || ""}
            onChange={(e) => updateEditField(modalSection, "heading", e.target.value)}
            className={inputCls}
            placeholder="Enter heading"
            required
            data-sectioninput="heading"
          />
          <label className="mb-1 mt-3 block text-[14px] font-bold text-[#333]">Description</label>
          <textarea
            value={editData.sections?.[0]?.desc || ""}
            onChange={(e) => updateEditField(modalSection, "desc", e.target.value)}
            className={textareaCls}
            placeholder="Enter description"
            required
            rows={2}
          />
        </div>
      );
    } else if (modalSection === "all") {
      return (
        <div className="max-h-[60vh] overflow-y-auto pr-2 sm:max-h-[65vh]">
          <div className="mb-7">
            <label className="mb-1 block text-[14px] font-bold text-[#333]">Thought of the Day</label>
            <textarea
              ref={firstInputRef as React.RefObject<HTMLTextAreaElement>}
              value={editData.thoughtOfTheDay || ""}
              rows={2}
              onChange={(e) => updateEditField("all", "thoughtOfTheDay", e.target.value)}
              required
              className={textareaCls}
              placeholder="Enter thought of the day"
            />
          </div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[15px] font-bold text-[#444]">Additional Sections</span>
            <button
              type="button"
              className="rounded bg-[#007bff] px-3 py-1 text-xs font-bold text-white hover:bg-[#0069d9]"
              onClick={handleAddSection}
            >
              + Add Section
            </button>
          </div>
          {(editData.sections ?? []).length === 0 && (
            <div className="mb-3 text-[#999]">No sections. Add one!</div>
          )}
          {(editData.sections ?? []).map((sec, idx) => (
            <div key={idx} className="relative mb-4 rounded border border-[#d2d6de] bg-[#f9fafc] p-4">
              <div className="mb-2">
                <label className="mb-0.5 block text-[13px] font-bold text-[#777]">Heading</label>
                <input
                  type="text"
                  data-sectioninput="heading"
                  ref={idx === 0 ? (firstInputRef as React.RefObject<HTMLInputElement>) : undefined}
                  value={sec.heading}
                  onChange={(e) => updateEditField("all", "heading", e.target.value, idx)}
                  className={inputCls}
                  placeholder="Enter heading"
                  required
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[13px] font-bold text-[#777]">Description</label>
                <textarea
                  value={sec.desc}
                  onChange={(e) => updateEditField("all", "desc", e.target.value, idx)}
                  className={textareaCls}
                  placeholder="Enter description"
                  rows={2}
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveSection(idx)}
                className="absolute right-2 top-1 text-lg font-bold text-[#dc3545] hover:text-[#a71d2a]"
                tabIndex={-1}
                title="Remove Section"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
<div
        // You may use Tailwind class if setup, or fallback to CSS below.
        className="h-[92vh] overflow-y-auto bg-[#f0f0f0] px-6 py-5 font-sans"
      
      >
      {/* Heading */}
      <h1 className="mb-6 text-[52px] font-light text-[#333]">Dashboard Data</h1>

      {/* Card */}
      <div className="mb-10 overflow-hidden rounded border border-[#d2d6de] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#f4f4f4] px-6 py-4">
          <h3 className="text-[18px] font-normal text-[#444]">Dashboard Content</h3>
          <button
            className="h-9 rounded bg-[#007bff] px-5 font-bold text-white hover:bg-[#0069d9]"
            onClick={() => openModal("all", dashboardData)}
          >
            {dashboardData ? "Edit All" : "Create"}
          </button>
        </div>

        <div className="p-6">
          {loading && <div className="mb-4 text-[15px] font-bold text-[#007bff]">Loading dashboard data...</div>}
          {error && (
            <div className="mb-4 rounded border border-[#f5c6cb] bg-[#f8d7da] px-4 py-3 text-[#721c24]">{error}</div>
          )}
          {successMsg && (
            <div className="mb-4 rounded border border-[#c3e6cb] bg-[#d4edda] px-4 py-3 text-[#155724]">{successMsg}</div>
          )}

          {!loading && !dashboardData && (
            <div className="rounded border border-[#d2d6de] bg-[#f9fafc] p-6 text-[#777]">
              No dashboard data configured in backend.
            </div>
          )}

          {dashboardData && (
            <div>
              {/* Thought of the Day */}
              <div className="mb-6 border-b border-[#f4f4f4] pb-6">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[15px] font-bold text-[#444]">Thought of the Day</div>
                  <button
                    className="rounded bg-[#17a2b8] px-3 py-1 text-xs font-bold text-white hover:opacity-90"
                    onClick={() => openModal("thought", dashboardData)}
                  >
                    Edit
                  </button>
                </div>
                <blockquote className="min-h-[1.7em] border-l-4 border-[#d2d6de] pl-4 italic text-[#555]">
                  {dashboardData.thoughtOfTheDay ? dashboardData.thoughtOfTheDay : <span className="text-[#bbb]">Not set</span>}
                </blockquote>
              </div>

              {/* Dynamic Sections */}
              {(dashboardData.sections ?? []).map((sec, idx) => (
                <div key={idx} className="mb-6 border-b border-[#f4f4f4] pb-6">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-[15px] font-bold text-[#444]">Section {idx + 1}</div>
                    <button
                      className="rounded bg-[#17a2b8] px-3 py-1 text-xs font-bold text-white hover:opacity-90"
                      onClick={() => openModal(idx, dashboardData)}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="ml-2 mt-1">
                    <div className="font-bold text-[#333]">
                      {sec.heading || <span className="text-[#bbb]">No heading</span>}
                    </div>
                    <div className="mt-0.5 min-h-[1.7em] whitespace-pre-line text-[#555]">
                      {sec.desc || <span className="text-[#bbb]">No description set.</span>}
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => openModal("all", dashboardData)}
                  className="h-9 rounded bg-[#007bff] px-5 font-bold text-white hover:bg-[#0069d9]"
                >
                  Edit All
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="h-9 rounded bg-[#dc3545] px-5 font-bold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="flex w-full max-w-lg max-h-[95vh] min-h-[60vh] flex-col rounded border border-[#d2d6de] bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-[#f4f4f4] px-6 py-4">
              <h3 className="text-[18px] font-normal text-[#444]">
                {modalSection === "all"
                  ? (dashboardData ? "Edit All Dashboard Data" : "Create Dashboard Data")
                  : modalSection === "thought"
                  ? "Edit Thought of the Day"
                  : `Edit Section ${typeof modalSection === "number" ? modalSection + 1 : ""}`}
              </h3>
              <button type="button" onClick={closeModal} className="text-2xl text-[#999] hover:text-[#555]">×</button>
            </div>

            {error && (
              <div className="mx-6 mt-4 rounded border border-[#f5c6cb] bg-[#f8d7da] px-4 py-3 text-[#721c24]">{error}</div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off" className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 px-6 pb-2 pt-4">{renderModalFields()}</div>
              <div className="flex items-center justify-end gap-3 border-t border-[#f4f4f4] px-6 py-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 rounded bg-[#007bff] px-5 font-bold text-white hover:bg-[#0069d9] disabled:opacity-70"
                >
                  {submitting
                    ? dashboardData
                      ? (modalSection === "all" ? "Saving All..." : "Saving...")
                      : (modalSection === "all" ? "Creating All..." : "Creating...")
                    : dashboardData
                      ? (modalSection === "all" ? "Save All" : "Save")
                      : (modalSection === "all" ? "Create All" : "Create")}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="h-9 rounded border border-[#d2d6de] bg-white px-5 font-bold text-[#555] hover:bg-[#f4f4f4]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardData;