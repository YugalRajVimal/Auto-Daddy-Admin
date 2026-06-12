
// import React, { useEffect, useState, useRef } from "react";
// import axios from "axios";

// // ---- Types ----

// interface BusinessProfile {
//   _id: string;
//   businessName?: string;
//   businessAddress?: string;
//   city?: string;
//   pincode?: string;
//   businessPhone?: string;
// }

// interface AutoShopOwner {
//   _id: string;
//   name?: string;
//   email?: string;
//   phone?: string;
//   countryCode?: string;
//   isDisabled?: boolean;
//   isProfileComplete?: boolean;
//   businessProfile?: BusinessProfile | null;
//   createdAt?: string;
// }

// interface Ad {
//   _id: string;
//   category: string;
//   websiteURL: string;
//   imageUpload: string;
//   createdAt: string;
//   updatedAt: string;
// }

// const CATEGORY_OPTIONS = [
//   { label: "Deals", value: "Deals" },
//   { label: "Ads", value: "Ads" },
//   { label: "Calendor", value: "Calendor" },
// ];

// const API_URL = import.meta.env.VITE_API_URL;

// // ---- Helpers ----

// function getOwnerStatus(owner: AutoShopOwner): { label: string; color: string } {
//   if (owner.isDisabled) return { label: "Suspended", color: "#ef4444" };
//   if (!owner.isProfileComplete) return { label: "Incomplete", color: "#f59e0b" };
//   if (!owner.businessProfile) return { label: "No Business", color: "#94a3b8" };
//   return { label: "Active", color: "#22c55e" };
// }

// // ---- Modal Component ----
// const AdsModal: React.FC<{
//   open: boolean;
//   onClose: () => void;
//   onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
//   form: {
//     category: string;
//     websiteURL: string;
//     imageUpload: File | null;
//   };
//   handleFormChange: (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => void;
//   formMode: "CREATE" | "EDIT";
//   imageInputRef: React.RefObject<HTMLInputElement>;
//   adsLoading: boolean;
//   adsError: string | null;
//   onCancel: () => void;
// }> = ({
//   open,
//   onClose,
//   onSubmit,
//   form,
//   handleFormChange,
//   formMode,
//   imageInputRef,
//   adsLoading,
//   adsError,
//   onCancel,
// }) => {
//   if (!open) return null;

//   // Prevent scrolling when modal is open
//   React.useEffect(() => {
//     document.body.style.overflow = "hidden";
//     return () => {
//       document.body.style.overflow = "";
//     };
//   }, []);

//   return (
//     <div
//       style={{
//         position: "fixed",
//         zIndex: 10000,
//         inset: 0,
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         background: "rgba(30,41,59,0.18)",
//         backdropFilter: "blur(6px)",
//         WebkitBackdropFilter: "blur(6px)",
//         transition: "background 0.15s",
//       }}
//       onClick={onClose}
//     >
//       <div
//         style={{
//           background: "linear-gradient(90deg,rgba(243,244,246,1) 94%,rgba(232,240,255,0.43) 100%)",
//           borderRadius: 13,
//           boxShadow: "0 8px 40px #22346b23",
//           padding: "40px 38px 34px 38px",
//           minWidth: 350,
//           maxWidth: 450,
//           width: "100%",
//           border: "1.5px solid #e5e7eb",
//           position: "relative",
//         }}
//         onClick={e => e.stopPropagation()}
//       >
//         <button
//           type="button"
//           aria-label="Close"
//           onClick={onClose}
//           style={{
//             position: "absolute",
//             top: 18,
//             right: 17,
//             fontWeight: 700,
//             fontSize: "1.4rem",
//             color: "#64748b",
//             background: "none",
//             border: "none",
//             cursor: "pointer",
//             opacity: 0.74,
//           }}
//         >
//           ×
//         </button>
//         <form onSubmit={onSubmit}>
//           <p style={{
//             margin: "0 0 17px 0",
//             fontWeight: 700,
//             fontSize: "1.09rem",
//             color: "#374151",
//             textAlign: "center",
//             letterSpacing: "-0.01em"
//           }}>
//             {formMode === "CREATE" ? "Add New Ad" : "Edit Ad"}
//           </p>
//           {/* Category */}
//           <div
//             style={{
//               display: "flex",
//               flexDirection: "column",
//               marginBottom: 15,
//             }}
//           >
//             <label
//               style={{
//                 fontWeight: 500,
//                 fontSize: "0.97rem",
//                 marginBottom: 4,
//                 color: "#374151",
//               }}
//             >
//               Category
//             </label>
//             <select
//               name="category"
//               value={form.category}
//               onChange={handleFormChange}
//               required
//               style={{
//                 padding: "9px 10px",
//                 fontSize: "0.97rem",
//                 border: "1.1px solid #d1d5db",
//                 borderRadius: 6,
//                 background: "#f9fafb",
//                 outline: "none",
//               }}
//             >
//               <option value="">Select Category</option>
//               {CATEGORY_OPTIONS.map((opt) => (
//                 <option key={opt.value} value={opt.value}>
//                   {opt.label}
//                 </option>
//               ))}
//             </select>
//           </div>
//           {/* Website URL */}
//           <div
//             style={{
//               display: "flex",
//               flexDirection: "column",
//               marginBottom: 15,
//             }}
//           >
//             <label
//               style={{
//                 fontWeight: 500,
//                 fontSize: "0.97rem",
//                 marginBottom: 4,
//                 color: "#374151",
//               }}
//             >
//               Website URL
//             </label>
//             <input
//               type="url"
//               name="websiteURL"
//               value={form.websiteURL}
//               onChange={handleFormChange}
//               required
//               placeholder="https://example.com"
//               style={{
//                 padding: "9px 10px",
//                 fontSize: "0.97rem",
//                 border: "1.1px solid #d1d5db",
//                 borderRadius: 6,
//                 background: "#f9fafb",
//                 outline: "none",
//               }}
//             />
//           </div>
//           {/* Image */}
//           <div
//             style={{
//               display: "flex",
//               flexDirection: "column",
//               marginBottom: 19,
//             }}
//           >
//             <label
//               style={{
//                 fontWeight: 500,
//                 fontSize: "0.97rem",
//                 marginBottom: 4,
//                 color: "#374151",
//               }}
//             >
//               {formMode === "CREATE"
//                 ? "Ad Image"
//                 : "Change Ad Image (optional)"}
//             </label>
//             <input
//               type="file"
//               name="adsImage"
//               accept="image/*"
//               onChange={handleFormChange}
//               ref={imageInputRef}
//               required={formMode === "CREATE"}
//             />
//             {form.imageUpload && (
//               <span
//                 style={{
//                   marginTop: 5,
//                   fontSize: "0.88rem",
//                   color: "#6366f1",
//                 }}
//               >
//                 {form.imageUpload.name}
//               </span>
//             )}
//           </div>
//           {/* Buttons */}
//           <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 7 }}>
//             <button
//               type="submit"
//               disabled={adsLoading}
//               style={{
//                 background: "linear-gradient(90deg,#2563eb,#6366f1)",
//                 color: "#fff",
//                 border: "none",
//                 borderRadius: 6,
//                 padding: "8px 22px",
//                 fontWeight: 700,
//                 fontSize: "0.97rem",
//                 cursor: adsLoading ? "not-allowed" : "pointer",
//                 opacity: adsLoading ? 0.65 : 1,
//               }}
//             >
//               {formMode === "CREATE" ? "Create Ad" : "Update Ad"}
//             </button>
//             <button
//               type="button"
//               onClick={onCancel}
//               disabled={adsLoading}
//               style={{
//                 background: "#f3f4f6",
//                 color: "#374151",
//                 border: "1px solid #e5e7eb",
//                 borderRadius: 6,
//                 padding: "8px 15px",
//                 fontWeight: 500,
//                 fontSize: "0.97rem",
//                 cursor: "pointer",
//               }}
//             >
//               Cancel
//             </button>
//           </div>
//           {adsError && (
//             <div
//               style={{
//                 color: "#dc2626",
//                 background: "#ffefef",
//                 padding: "9px 14px",
//                 borderRadius: 7,
//                 fontSize: "0.94rem",
//                 marginTop: 12,
//                 border: "1px solid #fecaca",
//                 textAlign: "center",
//               }}
//             >
//               {adsError}
//             </div>
//           )}
//         </form>
//       </div>
//     </div>
//   );
// };

// // ---- Component ----

// const Ads: React.FC = () => {
//   // Owners state
//   const [owners, setOwners] = useState<AutoShopOwner[]>([]);
//   const [ownersLoading, setOwnersLoading] = useState(false);
//   const [ownersError, setOwnersError] = useState<string | null>(null);
//   const [selectedOwner, setSelectedOwner] = useState<AutoShopOwner | null>(null);
//   const [ownerSearch, setOwnerSearch] = useState("");

//   // Ads state
//   const [ads, setAds] = useState<Ad[]>([]);
//   const [adsLoading, setAdsLoading] = useState(false);
//   const [adsError, setAdsError] = useState<string | null>(null);

//   // Form state
//   const [form, setForm] = useState<{
//     category: string;
//     websiteURL: string;
//     imageUpload: File | null;
//   }>({ category: "", websiteURL: "", imageUpload: null });
//   const [formMode, setFormMode] = useState<"CREATE" | "EDIT" | null>(null);
//   const [editId, setEditId] = useState<string | null>(null);
//   const imageInputRef = useRef<HTMLInputElement | null>(null);
//   const adsSectionRef = useRef<HTMLDivElement | null>(null);

//   const businessId = selectedOwner?.businessProfile?._id;

//   // ---- Effects ----

//   useEffect(() => {
//     fetchOwners();
//   }, []);

//   useEffect(() => {
//     resetForm();
//     setAdsError(null);
//     if (businessId) {
//       fetchAds(businessId);
//     } else {
//       setAds([]);
//     }
//     // eslint-disable-next-line
//   }, [businessId]);

//   // ---- Fetch ----

//   const fetchOwners = async () => {
//     setOwnersLoading(true);
//     setOwnersError(null);
//     try {
//       const res = await axios.get(`${API_URL}/api/admin/autoshopowners`);
//       setOwners(res.data.data || []);
//     } catch (err: any) {
//       setOwnersError(err?.response?.data?.message || "Failed to fetch shop owners");
//     } finally {
//       setOwnersLoading(false);
//     }
//   };

//   const fetchAds = async (bId: string) => {
//     setAdsLoading(true);
//     setAdsError(null);
//     try {
//       const res = await axios.get(
//         `${API_URL}/api/admin/business-profiles/${bId}/ads`
//       );
//       setAds(res.data.data || []);
//     } catch (err: any) {
//       setAdsError(err?.response?.data?.message || "Failed to fetch ads");
//     } finally {
//       setAdsLoading(false);
//     }
//   };

//   // ---- Form helpers ----

//   const resetForm = () => {
//     setForm({ category: "", websiteURL: "", imageUpload: null });
//     setFormMode(null);
//     setEditId(null);
//     if (imageInputRef.current) imageInputRef.current.value = "";
//   };

//   const handleFormChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value, files } = e.target as any;
//     if (name === "adsImage") {
//       setForm((prev) => ({ ...prev, imageUpload: files?.[0] ?? null }));
//     } else {
//       setForm((prev) => ({ ...prev, [name]: value }));
//     }
//   };

//   const handleOpenCreate = () => {
//     resetForm();
//     setFormMode("CREATE");
//     setTimeout(
//       () => adsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
//       60
//     );
//   };

//   const handleEdit = (ad: Ad) => {
//     resetForm();
//     setFormMode("EDIT");
//     setEditId(ad._id);
//     setForm({ category: ad.category, websiteURL: ad.websiteURL, imageUpload: null });
//     setTimeout(
//       () => adsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
//       60
//     );
//   };

//   // ---- CRUD ----

//   const handleDelete = async (id: string) => {
//     if (!businessId || !window.confirm("Delete this ad?")) return;
//     setAdsLoading(true);
//     setAdsError(null);
//     try {
//       await axios.delete(
//         `${API_URL}/api/admin/business-profiles/${businessId}/ads/${id}`
//       );
//       fetchAds(businessId);
//     } catch (err: any) {
//       setAdsError(err?.response?.data?.message || "Failed to delete ad");
//     } finally {
//       setAdsLoading(false);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!businessId) return;
//     if (!form.category || !form.websiteURL || (formMode === "CREATE" && !form.imageUpload)) {
//       setAdsError("All fields are required.");
//       return;
//     }
//     setAdsLoading(true);
//     setAdsError(null);
//     try {
//       const fd = new FormData();
//       fd.append("category", form.category);
//       fd.append("websiteURL", form.websiteURL);
//       if (form.imageUpload) fd.append("adsImage", form.imageUpload);

//       const headers = { "Content-Type": "multipart/form-data" };
//       if (formMode === "CREATE") {
//         await axios.post(
//           `${API_URL}/api/admin/business-profiles/${businessId}/ads`,
//           fd,
//           { headers }
//         );
//       } else if (formMode === "EDIT" && editId) {
//         await axios.patch(
//           `${API_URL}/api/admin/business-profiles/${businessId}/ads/${editId}`,
//           fd,
//           { headers }
//         );
//       }
//       resetForm();
//       fetchAds(businessId);
//     } catch (err: any) {
//       setAdsError(err?.response?.data?.message || "Failed to save ad");
//     } finally {
//       setAdsLoading(false);
//     }
//   };

//   // ---- Derived ----

//   const filteredOwners = owners.filter((o) => {
//     const q = ownerSearch.toLowerCase();
//     return (
//       o.name?.toLowerCase().includes(q) ||
//       o.businessProfile?.businessName?.toLowerCase().includes(q) ||
//       o.email?.toLowerCase().includes(q) ||
//       o.phone?.includes(q)
//     );
//   });

//   // ---- Render ----

//   return (
//     <div
//       style={{
//         padding: "32px 24px",
//         maxWidth: 1180,
//         margin: "0 auto",
//         fontFamily: "Inter, system-ui, sans-serif",
//         position: "relative",
//       }}
//     >
//       {/* Page title */}
//       <h1
//         style={{
//           fontWeight: 700,
//           fontSize: "2rem",
//           letterSpacing: "-0.03em",
//           color: "#111",
//           marginBottom: 24,
//         }}
//       >
//         Manage Ads
//       </h1>

//       {/* ═══════════════════════════════════
//           SECTION 1 — OWNERS TABLE
//       ═══════════════════════════════════ */}
//       <div
//         style={{
//           marginBottom: 28,
//           border: "1.5px solid #e5e7eb",
//           borderRadius: 13,
//           overflow: "hidden",
//           boxShadow: "0 2px 10px #00000009",
//         }}
//       >
//         {/* Section header */}
//         <div
//           style={{
//             padding: "13px 18px",
//             background: "#f8fafc",
//             borderBottom: "1.5px solid #e5e7eb",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             gap: 12,
//             flexWrap: "wrap",
//           }}
//         >
//           <div>
//             <span
//               style={{ fontWeight: 700, fontSize: "1.02rem", color: "#1e293b" }}
//             >
//               Auto Shop Owners
//             </span>
//             {!ownersLoading && (
//               <span
//                 style={{
//                   marginLeft: 8,
//                   fontSize: "0.84rem",
//                   color: "#94a3b8",
//                   fontWeight: 500,
//                 }}
//               >
//                 {filteredOwners.length} of {owners.length}
//               </span>
//             )}
//           </div>
//           <input
//             type="text"
//             placeholder="Search by name, shop or phone…"
//             value={ownerSearch}
//             onChange={(e) => setOwnerSearch(e.target.value)}
//             style={{
//               padding: "7px 13px",
//               fontSize: "0.91rem",
//               border: "1px solid #d1d5db",
//               borderRadius: 7,
//               outline: "none",
//               background: "#fff",
//               minWidth: 230,
//               color: "#374151",
//             }}
//           />
//         </div>

//         {/* Owners body */}
//         {ownersLoading && (
//           <div
//             style={{ padding: "28px", textAlign: "center", color: "#6366f1", fontSize: "0.97rem" }}
//           >
//             Loading shop owners…
//           </div>
//         )}
//         {ownersError && (
//           <div
//             style={{
//               padding: "14px 18px",
//               color: "#dc2626",
//               background: "#fee2e2",
//               fontSize: "0.95rem",
//             }}
//           >
//             {ownersError}
//           </div>
//         )}

//         {!ownersLoading && !ownersError && (
//           <div style={{ maxHeight: 290, overflowY: "auto" }}>
//             <table
//               style={{
//                 width: "100%",
//                 borderCollapse: "collapse",
//                 fontSize: "0.92rem",
//               }}
//             >
//               <thead>
//                 <tr
//                   style={{
//                     background: "#f1f5f9",
//                     position: "sticky",
//                     top: 0,
//                     zIndex: 1,
//                   }}
//                 >
//                   {[
//                     "Owner Name",
//                     "Shop Name",
//                     "Address / City",
//                     "Phone",
//                     "Status",
//                   ].map((h) => (
//                     <th
//                       key={h}
//                       style={{
//                         padding: "10px 14px",
//                         fontWeight: 600,
//                         color: "#475569",
//                         textAlign: "left",
//                         borderBottom: "1.5px solid #e2e8f0",
//                         whiteSpace: "nowrap",
//                         fontSize: "0.85rem",
//                         letterSpacing: "0.01em",
//                       }}
//                     >
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredOwners.length === 0 && (
//                   <tr>
//                     <td
//                       colSpan={5}
//                       style={{
//                         padding: "32px",
//                         textAlign: "center",
//                         color: "#94a3b8",
//                         fontSize: "0.97rem",
//                       }}
//                     >
//                       No owners found.
//                     </td>
//                   </tr>
//                 )}
//                 {filteredOwners.map((owner) => {
//                   const isSelected = selectedOwner?._id === owner._id;
//                   const canSelect = !!owner.businessProfile?._id;
//                   const status = getOwnerStatus(owner);

//                   return (
//                     <tr
//                       key={owner._id}
//                       onClick={() => canSelect && setSelectedOwner(owner)}
//                       title={
//                         !canSelect
//                           ? "This owner has no business profile — ads unavailable"
//                           : undefined
//                       }
//                       style={{
//                         background: isSelected ? "#eff6ff" : "#fff",
//                         borderLeft: isSelected
//                           ? "3px solid #3b82f6"
//                           : "3px solid transparent",
//                         cursor: canSelect ? "pointer" : "not-allowed",
//                         opacity: canSelect ? 1 : 0.5,
//                         transition: "background 0.1s",
//                         borderBottom: "1px solid #f1f5f9",
//                       }}
//                       onMouseOver={(e) => {
//                         if (canSelect && !isSelected)
//                           e.currentTarget.style.background = "#f8fafc";
//                       }}
//                       onMouseOut={(e) => {
//                         if (!isSelected)
//                           e.currentTarget.style.background = "#fff";
//                       }}
//                     >
//                       <td
//                         style={{
//                           padding: "10px 14px",
//                           fontWeight: isSelected ? 600 : 400,
//                           color: "#1e293b",
//                         }}
//                       >
//                         {isSelected && (
//                           <span
//                             style={{
//                               display: "inline-block",
//                               width: 7,
//                               height: 7,
//                               borderRadius: "50%",
//                               background: "#3b82f6",
//                               marginRight: 7,
//                               verticalAlign: "middle",
//                               marginBottom: 1,
//                             }}
//                           />
//                         )}
//                         {owner.name || "—"}
//                       </td>
//                       <td style={{ padding: "10px 14px", color: "#374151" }}>
//                         {owner.businessProfile?.businessName || (
//                           <span
//                             style={{ color: "#cbd5e1", fontStyle: "italic" }}
//                           >
//                             No business profile
//                           </span>
//                         )}
//                       </td>
//                       <td
//                         style={{
//                           padding: "10px 14px",
//                           color: "#64748b",
//                           maxWidth: 220,
//                           overflow: "hidden",
//                           textOverflow: "ellipsis",
//                           whiteSpace: "nowrap",
//                         }}
//                       >
//                         {[
//                           owner.businessProfile?.businessAddress,
//                           owner.businessProfile?.city,
//                         ]
//                           .filter(Boolean)
//                           .join(", ") || "—"}
//                       </td>
//                       <td style={{ padding: "10px 14px", color: "#64748b" }}>
//                         {owner.countryCode ? `${owner.countryCode} ` : ""}
//                         {owner.phone || "—"}
//                       </td>
//                       <td style={{ padding: "10px 14px" }}>
//                         <span
//                           style={{
//                             display: "inline-flex",
//                             alignItems: "center",
//                             gap: 5,
//                             padding: "2px 10px",
//                             borderRadius: 20,
//                             fontSize: "0.8rem",
//                             fontWeight: 600,
//                             background: status.color + "1a",
//                             color: status.color,
//                           }}
//                         >
//                           <span
//                             style={{
//                               width: 6,
//                               height: 6,
//                               borderRadius: "50%",
//                               background: status.color,
//                               flexShrink: 0,
//                             }}
//                           />
//                           {status.label}
//                         </span>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* ═══════════════════════════════════
//           SECTION 2 — ADS MANAGEMENT
//       ═══════════════════════════════════ */}
//       {!selectedOwner ? (
//         /* Empty state */
//         <div
//           style={{
//             textAlign: "center",
//             padding: "60px 24px",
//             border: "2px dashed #e2e8f0",
//             borderRadius: 14,
//           }}
//         >
//           <div style={{ fontSize: "2.4rem", marginBottom: 10 }}>🗂️</div>
//           <div
//             style={{
//               fontWeight: 600,
//               color: "#475569",
//               fontSize: "1.05rem",
//               marginBottom: 6,
//             }}
//           >
//             No shop owner selected
//           </div>
//           <div style={{ color: "#94a3b8", fontSize: "0.95rem" }}>
//             Click a row in the table above to view and manage their ads
//           </div>
//         </div>
//       ) : (
//         <div ref={adsSectionRef}>
//           {/* ── Selected owner info bar ── */}
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "space-between",
//               flexWrap: "wrap",
//               gap: 12,
//               background: "linear-gradient(90deg,#eff6ff,#f0fdf4)",
//               border: "1.5px solid #bfdbfe",
//               borderRadius: 11,
//               padding: "12px 18px",
//               marginBottom: 22,
//             }}
//           >
//             <div style={{ minWidth: 0 }}>
//               <span
//                 style={{
//                   fontWeight: 700,
//                   color: "#1d4ed8",
//                   fontSize: "1.05rem",
//                 }}
//               >
//                 {selectedOwner.businessProfile?.businessName ||
//                   selectedOwner.name}
//               </span>
//               <span
//                 style={{
//                   color: "#64748b",
//                   marginLeft: 10,
//                   fontSize: "0.91rem",
//                 }}
//               >
//                 {selectedOwner.name}
//                 {selectedOwner.businessProfile?.businessAddress
//                   ? ` · ${selectedOwner.businessProfile.businessAddress}`
//                   : ""}
//               </span>
//             </div>
//             <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
//               <button
//                 onClick={handleOpenCreate}
//                 style={{
//                   padding: "8px 20px",
//                   background: "linear-gradient(90deg,#3B82F6,#6366F1)",
//                   color: "#fff",
//                   border: "none",
//                   borderRadius: 7,
//                   fontWeight: 600,
//                   fontSize: "0.95rem",
//                   cursor: "pointer",
//                   boxShadow: "0 2px 6px #6366f120",
//                 }}
//               >
//                 + Add Ad
//               </button>
//               <button
//                 onClick={() => {
//                   setSelectedOwner(null);
//                   setAds([]);
//                   resetForm();
//                 }}
//                 style={{
//                   padding: "8px 14px",
//                   background: "#f1f5f9",
//                   color: "#64748b",
//                   border: "1px solid #e2e8f0",
//                   borderRadius: 7,
//                   fontWeight: 500,
//                   fontSize: "0.91rem",
//                   cursor: "pointer",
//                 }}
//               >
//                 ✕ Clear
//               </button>
//             </div>
//           </div>

//           {/* ---- MODAL for Create/Edit ---- */}
//           <AdsModal
//             open={formMode === "CREATE" || formMode === "EDIT"}
//             onClose={resetForm}
//             onSubmit={handleSubmit}
//             form={form}
//             handleFormChange={handleFormChange}
//             formMode={formMode as "CREATE" | "EDIT"}
//             imageInputRef={imageInputRef as React.RefObject<HTMLInputElement>}
//             adsLoading={adsLoading}
//             adsError={adsError}
//             onCancel={resetForm}
//           />
    
//           {/* Loading indicator */}
//           {adsLoading && (
//             <div
//               style={{
//                 margin: "14px 0",
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 8,
//                 color: "#6366f1",
//                 fontWeight: 500,
//                 fontSize: "0.97rem",
//               }}
//             >
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 width="18"
//                 height="18"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="#6366f1"
//                   strokeWidth="4"
//                   opacity="0.3"
//                 />
//                 <path
//                   d="M22 12a10 10 0 0 0-10-10"
//                   stroke="#6366f1"
//                   strokeWidth="4"
//                   strokeLinecap="round"
//                   style={{
//                     transformOrigin: "center",
//                     animation: "adspin 0.8s linear infinite",
//                   }}
//                 />
//                 <style>{`@keyframes adspin{100%{transform:rotate(360deg)}}`}</style>
//               </svg>
//               Loading…
//             </div>
//           )}

//           {/* Global error (outside form) */}
//           {adsError && !formMode && (
//             <div
//               style={{
//                 background: "#fee2e2",
//                 border: "1px solid #fecaca",
//                 borderRadius: 8,
//                 color: "#dc2626",
//                 padding: "12px 16px",
//                 fontWeight: 500,
//                 marginBottom: 16,
//                 fontSize: "0.95rem",
//               }}
//             >
//               {adsError}
//             </div>
//           )}

//           {/* ── Ads Table ── */}
//           <div
//             style={{
//               borderRadius: 13,
//               overflow: "hidden",
//               boxShadow: "0 2px 12px #5a81fa14",
//             }}
//           >
//             <table
//               style={{
//                 borderCollapse: "separate",
//                 borderSpacing: 0,
//                 width: "100%",
//                 minWidth: 620,
//                 background: "#fff",
//                 fontSize: "0.96rem",
//               }}
//             >
//               <thead>
//                 <tr
//                   style={{
//                     background:
//                       "linear-gradient(90deg,#ddeafe 90%,#e0e7ff 100%)",
//                     color: "#2d2b67",
//                   }}
//                 >
//                   {["Image", "Category", "Website URL", "Created", "Actions"].map(
//                     (h, i) => (
//                       <th
//                         key={h}
//                         style={{
//                           padding: "12px 10px",
//                           fontWeight: 700,
//                           fontSize: "0.92rem",
//                           textAlign: i === 4 ? "center" : "left",
//                           borderBottom: "2px solid #e0e7ff",
//                           whiteSpace: "nowrap",
//                         }}
//                       >
//                         {h}
//                       </th>
//                     )
//                   )}
//                 </tr>
//               </thead>
//               <tbody>
//                 {ads.length === 0 && !adsLoading && (
//                   <tr>
//                     <td
//                       colSpan={5}
//                       style={{
//                         textAlign: "center",
//                         color: "#94a3b8",
//                         padding: "44px 0",
//                         fontSize: "0.98rem",
//                       }}
//                     >
//                       No ads yet for this shop.{" "}
//                       <button
//                         onClick={handleOpenCreate}
//                         style={{
//                           color: "#6366f1",
//                           background: "none",
//                           border: "none",
//                           cursor: "pointer",
//                           fontWeight: 600,
//                           textDecoration: "underline",
//                           fontSize: "inherit",
//                         }}
//                       >
//                         Add the first one →
//                       </button>
//                     </td>
//                   </tr>
//                 )}
//                 {ads.map((ad) => (
//                   <tr
//                     key={ad._id}
//                     style={{
//                       borderBottom: "1.5px solid #eef2f8",
//                       background: "#fff",
//                       transition: "background 0.1s",
//                     }}
//                     onMouseOver={(e) =>
//                       (e.currentTarget.style.background = "#f8faff")
//                     }
//                     onMouseOut={(e) =>
//                       (e.currentTarget.style.background = "#fff")
//                     }
//                   >
//                     <td style={{ padding: "10px 10px" }}>
//                       {ad.imageUpload ? (
//                         <img
//                           src={
//                             ad.imageUpload.startsWith("http")
//                               ? ad.imageUpload
//                               : `${API_URL}/${ad.imageUpload.replace(
//                                   /^\.?\/?/,
//                                   ""
//                                 )}`
//                           }
//                           alt={ad.category}
//                           style={{
//                             width: 78,
//                             height: 56,
//                             objectFit: "cover",
//                             borderRadius: 9,
//                             border: "1.5px solid #f1f5f9",
//                             background: "#f3f4f6",
//                           }}
//                         />
//                       ) : (
//                         <span
//                           style={{
//                             fontSize: "0.88rem",
//                             color: "#cbd5e1",
//                             fontStyle: "italic",
//                           }}
//                         >
//                           No Image
//                         </span>
//                       )}
//                     </td>
//                     <td style={{ padding: "10px 10px" }}>
//                       <span
//                         style={{
//                           background: "#6366f120",
//                           color: "#475569",
//                           borderRadius: 6,
//                           fontWeight: 500,
//                           padding: "3px 10px",
//                           fontSize: "0.88rem",
//                         }}
//                       >
//                         {ad.category}
//                       </span>
//                     </td>
//                     <td style={{ padding: "10px 10px" }}>
//                       <a
//                         href={ad.websiteURL}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         style={{
//                           color: "#2563eb",
//                           fontWeight: 500,
//                           textDecoration: "underline dotted",
//                           fontSize: "0.93rem",
//                           wordBreak: "break-all",
//                         }}
//                       >
//                         {ad.websiteURL}
//                       </a>
//                     </td>
//                     <td style={{ padding: "10px 10px", fontSize: "0.9rem" }}>
//                       <span style={{ color: "#6b7280", fontWeight: 500 }}>
//                         {new Date(ad.createdAt).toLocaleString(undefined, {
//                           year: "numeric",
//                           month: "short",
//                           day: "numeric",
//                           hour: "2-digit",
//                           minute: "2-digit",
//                         })}
//                       </span>
//                     </td>
//                     <td style={{ padding: "10px 10px", textAlign: "center" }}>
//                       <button
//                         onClick={() => handleEdit(ad)}
//                         style={{
//                           padding: "6px 16px",
//                           fontWeight: 600,
//                           fontSize: "0.88rem",
//                           background:
//                             "linear-gradient(90deg,#38bdf8 10%,#818cf8 90%)",
//                           color: "white",
//                           border: "none",
//                           borderRadius: 6,
//                           marginRight: 6,
//                           cursor: "pointer",
//                         }}
//                       >
//                         Edit
//                       </button>
//                       <button
//                         onClick={() => handleDelete(ad._id)}
//                         style={{
//                           padding: "6px 14px",
//                           fontWeight: 600,
//                           fontSize: "0.88rem",
//                           background:
//                             "linear-gradient(90deg,#ef4444 10%,#f87171 100%)",
//                           color: "#fff",
//                           border: "none",
//                           borderRadius: 6,
//                           cursor: "pointer",
//                         }}
//                       >
//                         Delete
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Ads;

// Ads.tsx


import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

// ---- Types ----
interface BusinessProfile {
  _id: string; businessName?: string; businessAddress?: string; city?: string; pincode?: string; businessPhone?: string;
}
interface AutoShopOwner {
  _id: string; name?: string; email?: string; phone?: string; countryCode?: string;
  isDisabled?: boolean; isProfileComplete?: boolean; businessProfile?: BusinessProfile | null; createdAt?: string;
}
interface Ad {
  _id: string; category: string; websiteURL: string; imageUpload: string; createdAt: string; updatedAt: string;
}

const CATEGORY_OPTIONS = [
  { label: "Deals", value: "Deals" },
  { label: "Ads", value: "Ads" },
  { label: "Calendor", value: "Calendor" },
];

const API_URL = import.meta.env.VITE_API_URL;

function getOwnerStatus(owner: AutoShopOwner): { label: string; color: string } {
  if (owner.isDisabled) return { label: "Suspended", color: "#dc3545" };
  if (!owner.isProfileComplete) return { label: "Incomplete", color: "#ffc107" };
  if (!owner.businessProfile) return { label: "No Business", color: "#999" };
  return { label: "Active", color: "#28a745" };
}

// ---- Modal for Viewing & Managing Ads for each Shop Owner ----
const OwnerAdsModal: React.FC<{
  open: boolean;
  onClose: () => void;
  owner: AutoShopOwner | null;
  ads: Ad[];
  adsLoading: boolean;
  adsError: string | null;
  onAdd: () => void;
  onEdit: (ad: Ad) => void;
  onDelete: (adId: string) => void;
}> = ({
  open,
  onClose,
  owner,
  ads,
  adsLoading,
  adsError,
  onAdd,
  onEdit,
  onDelete,
}) => {
  if (!open || !owner) return null;

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded border border-[#d2d6de] bg-white shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#f4f4f4] px-6 py-4">
          <div>
            <span className="font-bold text-[#007bff] text-lg">
              {owner.businessProfile?.businessName || owner.name}
            </span>
            <span className="ml-3 text-[#777] text-sm">
              {owner.name}
              {owner.businessProfile?.businessAddress ? ` · ${owner.businessProfile.businessAddress}` : ""}
            </span>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="text-2xl text-[#999] hover:text-[#555]"
          >
            ×
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-auto">
          <div className="flex justify-between mb-5">
            <h3 className="text-[18px] font-bold text-[#333]">Ads List</h3>
            <button
              onClick={onAdd}
              className="rounded bg-[#007bff] px-5 py-2 font-bold text-white hover:bg-[#0069d9] text-sm"
            >
              + Add Ad
            </button>
          </div>
          {adsLoading && (
            <div className="text-center text-[#007bff] font-bold mb-5">Loading Ads…</div>
          )}
          {adsError && (
            <div className="rounded border border-[#f5c6cb] bg-[#f8d7da] px-4 py-2 text-[#721c24] mb-5">
              {adsError}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Image", "Category", "Website URL", "Created", "Actions"].map((h, i) => (
                    <th
                      key={h}
                      className={`border border-[#d2d6de] bg-[#f9fafc] px-4 py-3 font-bold whitespace-nowrap ${i === 4 ? "text-center" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ads.length === 0 && !adsLoading && (
                  <tr>
                    <td colSpan={5} className="border border-[#d2d6de] px-4 py-10 text-center text-[#999]">
                      No ads yet for this shop.
                    </td>
                  </tr>
                )}
                {ads.map((ad) => (
                  <tr key={ad._id} className="hover:bg-[#f9fafc]">
                    <td className="border border-[#d2d6de] px-4 py-4">
                      {ad.imageUpload ? (
                        <img
                          src={ad.imageUpload.startsWith("http") ? ad.imageUpload : `${API_URL}/${ad.imageUpload.replace(/^\.?\/?/, "")}`}
                          alt={ad.category}
                          className="h-14 w-20 rounded object-cover border border-[#f1f5f9] bg-[#f3f4f6]"
                        />
                      ) : (
                        <span className="italic text-[#bbb]">No Image</span>
                      )}
                    </td>
                    <td className="border border-[#d2d6de] px-4 py-4">
                      <span className="rounded bg-[#f4f4f4] px-3 py-1 text-xs font-bold text-[#555]">
                        {ad.category}
                      </span>
                    </td>
                    <td className="border border-[#d2d6de] px-4 py-4">
                      <a href={ad.websiteURL} target="_blank" rel="noopener noreferrer" className="text-[#007bff] underline break-all">
                        {ad.websiteURL}
                      </a>
                    </td>
                    <td className="border border-[#d2d6de] px-4 py-4 text-[#777]">
                      {new Date(ad.createdAt).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="border border-[#d2d6de] h-full px-4 py-4 text-center">
                      <button
                        onClick={() => onEdit(ad)}
                        className="mr-2 my-2 rounded bg-[#17a2b8] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(ad._id)}
                        className="rounded bg-[#dc3545] my-2 px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Modal for Add/Edit Ad ----
const AdFormModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  form: { category: string; websiteURL: string; imageUpload: File | null };
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  formMode: "CREATE" | "EDIT";
  imageInputRef: React.RefObject<HTMLInputElement>;
  adsLoading: boolean;
  adsError: string | null;
  onCancel: () => void;
}> = ({ open, onClose, onSubmit, form, handleFormChange, formMode, imageInputRef, adsLoading, adsError, onCancel }) => {
  if (!open) return null;

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[450px] rounded border border-[#d2d6de] bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#f4f4f4] px-6 py-4 flex items-center justify-between">
          <h3 className="text-[18px] font-normal text-[#444]">
            {formMode === "CREATE" ? "Add New Ad" : "Edit Ad"}
          </h3>
          <button type="button" aria-label="Close" onClick={onClose} className="text-2xl text-[#999] hover:text-[#555]">
            ×
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6">
          <div className="mb-4">
            <label className="mb-1 block text-[14px] font-bold text-[#333]">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleFormChange}
              required
              className="h-9 w-full rounded border border-[#d2d6de] px-3 outline-none"
            >
              <option value="">Select Category</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-[14px] font-bold text-[#333]">Website URL</label>
            <input
              type="url"
              name="websiteURL"
              value={form.websiteURL}
              onChange={handleFormChange}
              required
              placeholder="https://example.com"
              className="h-9 w-full rounded border border-[#d2d6de] px-3 outline-none"
            />
          </div>

          <div className="mb-5">
            <label className="mb-1 block text-[14px] font-bold text-[#333]">
              {formMode === "CREATE" ? "Ad Image" : "Change Ad Image (optional)"}
            </label>
            <input
              type="file"
              name="adsImage"
              accept="image/*"
              onChange={handleFormChange}
              ref={imageInputRef}
              required={formMode === "CREATE"}
              className="block w-full text-[14px]"
            />
            {form.imageUpload && (
              <span className="mt-1 block text-[13px] text-[#007bff]">{form.imageUpload.name}</span>
            )}
          </div>

          <div className="flex justify-center gap-3">
            <button
              type="submit"
              disabled={adsLoading}
              className="h-9 rounded bg-[#007bff] px-6 font-bold text-white hover:bg-[#0069d9] disabled:opacity-60"
            >
              {formMode === "CREATE" ? "Create Ad" : "Update Ad"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={adsLoading}
              className="h-9 rounded border border-[#d2d6de] bg-white px-5 font-bold text-[#555] hover:bg-[#f4f4f4]"
            >
              Cancel
            </button>
          </div>

          {adsError && (
            <div className="mt-4 rounded border border-[#f5c6cb] bg-[#f8d7da] px-4 py-2 text-center text-[#721c24]">
              {adsError}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};


// ---- Main Component ----
const Ads: React.FC = () => {
  const [owners, setOwners] = useState<AutoShopOwner[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [ownersError, setOwnersError] = useState<string | null>(null);

  // For modal handling:
  const [selectedOwnerForModal, setSelectedOwnerForModal] = useState<AutoShopOwner | null>(null);

  // For showing/hiding modals:
  const [showOwnerAdsModal, setShowOwnerAdsModal] = useState(false);
  const [showAdFormModal, setShowAdFormModal] = useState(false);

  // For ads list inside modal:
  const [ads, setAds] = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adsError, setAdsError] = useState<string | null>(null);

  // For add/edit form:
  const [form, setForm] = useState<{ category: string; websiteURL: string; imageUpload: File | null }>({
    category: "", websiteURL: "", imageUpload: null,
  });
  const [formMode, setFormMode] = useState<"CREATE" | "EDIT" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Owner filtering:
  const [ownerSearch, setOwnerSearch] = useState("");

  useEffect(() => { fetchOwners(); }, []);

  const fetchOwners = async () => {
    setOwnersLoading(true);
    setOwnersError(null);
    try {
      const res = await axios.get(`${API_URL}/api/admin/autoshopowners`);
      setOwners(res.data.data || []);
    } catch (err: any) {
      setOwnersError(err?.response?.data?.message || "Failed to fetch shop owners");
    } finally {
      setOwnersLoading(false);
    }
  };

  const fetchAds = async (owner: AutoShopOwner) => {
    setAdsLoading(true);
    setAdsError(null);
    setAds([]);
    try {
      const businessId = owner.businessProfile?._id;
      if (!businessId) {
        setAds([]);
        setAdsLoading(false);
        return;
      }
      const res = await axios.get(`${API_URL}/api/admin/business-profiles/${businessId}/ads`);
      setAds(res.data.data || []);
    } catch (err: any) {
      setAdsError(err?.response?.data?.message || "Failed to fetch ads");
    } finally {
      setAdsLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, files } = e.target as any;
    if (name === "adsImage") {
      setForm((prev) => ({ ...prev, imageUpload: files?.[0] ?? null }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setForm({ category: "", websiteURL: "", imageUpload: null });
    setFormMode(null);
    setEditId(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // Open owner ads modal and fetch ads for that owner
  const handleOpenOwnerAdsModal = async (owner: AutoShopOwner) => {
    setSelectedOwnerForModal(owner);
    setShowOwnerAdsModal(true);
    setAds([]);
    setAdsError(null);
    setFormMode(null);
    resetForm();
    await fetchAds(owner);
  };

  // Close owner ads modal and reset
  const handleCloseOwnerAdsModal = () => {
    setShowOwnerAdsModal(false);
    setSelectedOwnerForModal(null);
    setAds([]);
    setFormMode(null);
    resetForm();
  };

  // Open form modal for add
  const handleOpenAddAd = () => {
    setFormMode("CREATE");
    resetForm();
    setShowAdFormModal(true);
  };

  // Open form modal for edit
  const handleEdit = (ad: Ad) => {
    setFormMode("EDIT");
    setEditId(ad._id);
    setForm({ category: ad.category, websiteURL: ad.websiteURL, imageUpload: null });
    setShowAdFormModal(true);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // Close ad form modal
  const handleCloseAdFormModal = () => {
    setFormMode(null);
    setShowAdFormModal(false);
    resetForm();
  };

  const handleDelete = async (adId: string) => {
    if (!selectedOwnerForModal?.businessProfile?._id || !window.confirm("Delete this ad?")) return;
    setAdsLoading(true);
    setAdsError(null);
    try {
      await axios.delete(`${API_URL}/api/admin/business-profiles/${selectedOwnerForModal.businessProfile._id}/ads/${adId}`);
      await fetchAds(selectedOwnerForModal);
    } catch (err: any) {
      setAdsError(err?.response?.data?.message || "Failed to delete ad");
    } finally {
      setAdsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOwnerForModal?.businessProfile?._id) return;
    const businessId = selectedOwnerForModal.businessProfile._id;
    if (!form.category || !form.websiteURL || (formMode === "CREATE" && !form.imageUpload)) {
      setAdsError("All fields are required.");
      return;
    }
    setAdsLoading(true);
    setAdsError(null);
    try {
      const fd = new FormData();
      fd.append("category", form.category);
      fd.append("websiteURL", form.websiteURL);
      if (form.imageUpload) fd.append("adsImage", form.imageUpload);

      const headers = { "Content-Type": "multipart/form-data" };
      if (formMode === "CREATE") {
        await axios.post(`${API_URL}/api/admin/business-profiles/${businessId}/ads`, fd, { headers });
      } else if (formMode === "EDIT" && editId) {
        await axios.patch(`${API_URL}/api/admin/business-profiles/${businessId}/ads/${editId}`, fd, { headers });
      }
      handleCloseAdFormModal();
      await fetchAds(selectedOwnerForModal);
    } catch (err: any) {
      setAdsError(err?.response?.data?.message || "Failed to save ad");
    } finally {
      setAdsLoading(false);
    }
  };

  const filteredOwners = owners.filter((o) => {
    const q = ownerSearch.toLowerCase();
    return (
      o.name?.toLowerCase().includes(q) ||
      o.businessProfile?.businessName?.toLowerCase().includes(q) ||
      o.email?.toLowerCase().includes(q) ||
      o.phone?.includes(q)
    );
  });

  return (
    <div className="h-[92vh] overflow-y-auto bg-[#f0f0f0] px-6 py-5 font-sans">
      {/* Heading */}
      <h1 className="mb-6 text-[52px] font-light text-[#333]">Manage Ads</h1>

      {/* ── SECTION 1: Owners ── */}
      <div className="mb-6 overflow-hidden rounded border border-[#d2d6de] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f4f4f4] px-6 py-4">
          <div>
            <h3 className="inline text-[18px] font-normal text-[#444]">Auto Shop Owners</h3>
            {!ownersLoading && (
              <span className="ml-2 text-[13px] text-[#999]">
                {filteredOwners.length} of {owners.length}
              </span>
            )}
          </div>
          <input
            type="text"
            placeholder="Search by name, shop or phone…"
            value={ownerSearch}
            onChange={(e) => setOwnerSearch(e.target.value)}
            className="h-9 w-[260px] rounded border border-[#d2d6de] px-3 outline-none"
          />
        </div>

        <div className="p-6">
          {ownersLoading && (
            <div className="py-8 text-center text-[15px] font-bold text-[#007bff]">Loading shop owners…</div>
          )}
          {ownersError && (
            <div className="rounded border border-[#f5c6cb] bg-[#f8d7da] px-4 py-3 text-[#721c24]">
              {ownersError}
            </div>
          )}

          {!ownersLoading && !ownersError && (
            <div className="max-h-[320px] overflow-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Owner Name", "Shop Name", "Address / City", "Phone", "Status", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="sticky top-0 border border-[#d2d6de] bg-[#f9fafc] px-4 py-4 text-left font-bold whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOwners.length === 0 && (
                    <tr>
                      <td colSpan={6} className="border border-[#d2d6de] px-4 py-10 text-center text-[#999]">
                        No owners found.
                      </td>
                    </tr>
                  )}
                  {filteredOwners.map((owner) => {
                    const canSelect = !!owner.businessProfile?._id;
                    const status = getOwnerStatus(owner);

                    return (
                      <tr
                        key={owner._id}
                        className={`${canSelect ? "bg-white hover:bg-[#f9fafc]" : "cursor-not-allowed opacity-50"}`}
                      >
                        <td className="border border-[#d2d6de] px-4 py-5 font-medium text-[#333]">
                          {owner.name || "—"}
                        </td>
                        <td className="border border-[#d2d6de] px-4 py-5">
                          {owner.businessProfile?.businessName || (
                            <span className="italic text-[#bbb]">No business profile</span>
                          )}
                        </td>
                        <td className="border border-[#d2d6de] px-4 py-5 text-[#777] max-w-[220px] overflow-hidden truncate">
                          {[owner.businessProfile?.businessAddress, owner.businessProfile?.city].filter(Boolean).join(", ") || "—"}
                        </td>
                        <td className="border border-[#d2d6de] px-4 py-5 text-[#777]">
                          {owner.countryCode ? `${owner.countryCode} ` : ""}{owner.phone || "—"}
                        </td>
                        <td className="border border-[#d2d6de] px-4 py-5">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
                            style={{ background: status.color + "1a", color: status.color }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.color }} />
                            {status.label}
                          </span>
                        </td>
                        <td className="border border-[#d2d6de] px-4 py-5">
                          <button
                            disabled={!canSelect}
                            title={
                              !canSelect
                                ? "This owner has no business profile — ads unavailable"
                                : "Show Ads"
                            }
                            onClick={() => canSelect && handleOpenOwnerAdsModal(owner)}
                            className={`rounded px-4 py-1 text-sm font-semibold text-white ${
                              canSelect
                                ? "bg-[#10b981] hover:bg-[#059669] cursor-pointer"
                                : "bg-[#ddd] cursor-not-allowed"
                            }`}
                          >
                            View Ads
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Owner Ads Modal */}
      <OwnerAdsModal
        open={showOwnerAdsModal}
        onClose={handleCloseOwnerAdsModal}
        owner={selectedOwnerForModal}
        ads={ads}
        adsLoading={adsLoading}
        adsError={adsError}
        onAdd={handleOpenAddAd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Ad Form Modal */}
      <AdFormModal
        open={showAdFormModal}
        onClose={handleCloseAdFormModal}
        onSubmit={handleSubmit}
        form={form}
        handleFormChange={handleFormChange}
        formMode={formMode as "CREATE" | "EDIT"}
        imageInputRef={imageInputRef as React.RefObject<HTMLInputElement>}
        adsLoading={adsLoading}
        adsError={adsError}
        onCancel={handleCloseAdFormModal}
      />
    </div>
  );
};

export default Ads;