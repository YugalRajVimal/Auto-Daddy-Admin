
// import { useCallback, useEffect, useState } from "react";
// import { FiPaperclip } from "react-icons/fi";
// import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
// import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
// import AdminSearchCard, {
//   emptyAdminSearchValues,
//   searchEquals,
//   searchIncludes,
//   type AdminSearchField,
// } from "../../../components/admin/AdminSearchCard";
// import ClipImageHover from "../../../components/admin/ClipImageHover";
// import {
//   CompactAutoGrowTextarea,
//   CompactField,
//   CompactFormFooter,
//   CompactFormPanel,
//   CompactFormRow,
//   compactInputClass,
//   compactReadOnlyMultilineClass,
//   compactReadOnlyValueClass,
// } from "../../../components/admin/ContentPanel";
// import { adminNotify } from "../../../utils/adminNotify";
// import { printAdminTable } from "../../../utils/adminPrintTable";
// import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
// import { useAdminDeletedView } from "../../../hooks/useAdminDeletedView";
// import { useAdminCityOptions, withSelectedCity } from "../../../hooks/useAdminCityOptions";
// import {
//   createLead,
//   deleteLead,
//   fetchLeads,
//   updateLead,
//   type LeadApiRow,
//   type LeadApiStatus,
// } from "./leadsAPI";

// const ASSOCIATE_OPTIONS = [
//   "Sarah Mitchell",
//   "James Chen",
//   "Priya Sharma",
//   "Marcus Dubois",
//   "Emily Watson",
//   "David Okonkwo",
//   "Lisa Tremblay",
//   "Robert Singh",
// ];

// // UI-level status mirrors the backend enum exactly (lowercased for display).
// type LeadStatus = "pending" | "visited" | "completed";

// const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
//   // { value: "pending", label: "pending" },
//   { value: "visited", label: "visited" },
//   { value: "completed", label: "completed" },
// ];

// const LEAD_SEARCH_FIELDS: AdminSearchField[] = [
//   { key: "date", label: "Date", type: "date" },
//   { key: "name", label: "Name" },
//   { key: "phone", label: "Phone" },
//   { key: "city", label: "City" },
//   { key: "email", label: "Email" },
//   { key: "website", label: "Website" },
//   { key: "notes", label: "Notes" },
//   { key: "sentTo", label: "Sent To" },
//   {
//     key: "status",
//     label: "Status",
//     type: "select",
//     options: STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
//   },
// ];

// type LeadRow = {
//   id: string;
//   date: string;
//   name: string;
//   phone: string;
//   city: string;
//   email: string;
//   website: string;
//   sentTo: string | null;
//   personContacted?: string | null;
//   notes: string;
//   status: LeadStatus;
//   imageUrl?: string | null;
// };

// function formatLeadDate(value?: string | null): string {
//   if (!value) return "-";
//   const ymd = value.slice(0, 10);
//   if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd;
//   const parsed = new Date(value);
//   if (Number.isNaN(parsed.getTime())) return value;
//   return parsed.toISOString().slice(0, 10);
// }

// function getBackendImageUrl(path: string) {
//   if (/^https?:\/\//.test(path)) return path;
//   const base = import.meta.env.VITE_API_URL || "";
//   return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
// }

// // The backend has no image upload endpoint for leads. Any image attached
// // here stays client-side only (object URL) and is never sent to the API.
// function mapLeadFromApi(row: LeadApiRow): LeadRow {
//   const apiStatus = row.status;
//   const status: LeadStatus =
//     apiStatus === "Visited" ? "visited" : apiStatus === "Completed" ? "completed" : "pending";
//   return {
//     id: row._id,
//     date: row.date,
//     name: row.name,
//     phone: row.phone,
//     city: row.city,
//     email: row.email ?? "",
//     website: row.website ?? "",
//     sentTo: row.sentTo ?? null,
//     personContacted: status === "completed" ? row.sentTo ?? null : undefined,
//     notes: row.notes ?? "",
//     status,
//     imageUrl: row.image ? getBackendImageUrl(row.image) : null, // was: null
//   };
// }

// function uiStatusToApi(status: LeadStatus): LeadApiStatus {
//   if (status === "visited") return "Visited";
//   if (status === "completed") return "Completed";
//   return "Pending";
// }

// const DEFAULT_NOTES = "";

// type LeadSection = "all" | "visited" | "completed";

// function sectionToApiStatus(section: LeadSection): LeadApiStatus | undefined {
//   if (section === "visited") return "Visited";
//   if (section === "completed") return "Completed";
//   return "Pending";
// }

// type LeadsPageProps = {
//   initialShowForm?: boolean;
//   title?: string;
//   showAddNew?: boolean;
//   readOnly?: boolean;
//   section?: LeadSection;
// };

// export default function LeadsPage({
//   initialShowForm = false,
//   title = "Leads",
//   showAddNew = true,
//   readOnly = false,
//   section = "all",
// }: LeadsPageProps) {
//   const [leads, setLeads] = useState<LeadRow[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [selected, setSelected] = useState<Set<string>>(new Set());
//   const [search, setSearch] = useState("");
//   const [showSearchCard, setShowSearchCard] = useState(false);
//   const [searchDraft, setSearchDraft] = useState(() => emptyAdminSearchValues(LEAD_SEARCH_FIELDS));
//   const [searchFilters, setSearchFilters] = useState(() => emptyAdminSearchValues(LEAD_SEARCH_FIELDS));
//   const [page, setPage] = useState(1);
//   const [entriesPerPage, setEntriesPerPage] = useState(10);
//   const [showForm, setShowForm] = useState(initialShowForm);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [date, setDate] = useState("2026-06-16");
//   const [name, setName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [city, setCity] = useState("");
//   const cityOptions = useAdminCityOptions();
//   const citySelectOptions = withSelectedCity(cityOptions, city);
//   const [email, setEmail] = useState("");
//   const [website, setWebsite] = useState("");
//   const [notes, setNotes] = useState(DEFAULT_NOTES);
//   const [sentTo, setSentTo] = useState("");
//   const [status, setStatus] = useState<LeadStatus>("pending");
//   const [imageFile, setImageFile] = useState<File | null>(null);
//   const [viewingLead, setViewingLead] = useState<LeadRow | null>(null);
//   const [viewStatusDraft, setViewStatusDraft] = useState<LeadStatus | null>(null);
//   const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);
//   const [editingObjectUrl, setEditingObjectUrl] = useState<string | null>(null);
//   const [bulkStatus, setBulkStatus] = useState<LeadStatus>("visited");
//   const [bulkUpdating, setBulkUpdating] = useState(false);
//   const [removeExistingImage, setRemoveExistingImage] = useState(false);

//   const resetTableControls = () => {
//     setPage(1);
//     setSelected(new Set());
//     setSearch("");
//     const empty = emptyAdminSearchValues(LEAD_SEARCH_FIELDS);
//     setSearchDraft(empty);
//     setSearchFilters(empty);
//     setShowSearchCard(false);
//   };

//   const { viewMode, isDeletedView, toggleViewMode, deletedStash, stashDeleted, restoreStashed } =
//     useAdminDeletedView<LeadRow>({
//       onToggle: resetTableControls,
//       storageKey: "admin_deleted_view:leads",
//     });

//   useEffect(() => {
//     if (!imagePreview) return;
//     const onKeyDown = (e: KeyboardEvent) => {
//       if (e.key === "Escape") setImagePreview(null);
//     };
//     window.addEventListener("keydown", onKeyDown);
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [imagePreview]);

//   useEffect(() => {
//     setBulkStatus(section === "visited" ? "completed" : section === "completed" ? "visited" : "visited");
//   }, [section]);

//   const loadLeads = useCallback(async () => {
//     setLoading(true);
//     try {
//       const rows = await fetchLeads({
//         status: sectionToApiStatus(section),
//         search: search || undefined,
//       });
//       setLeads(rows.map(mapLeadFromApi));
//     } catch (err: any) {
//       adminNotify.error(err?.message || "Failed to load leads.");
//     } finally {
//       setLoading(false);
//     }
//   }, [section, search]);

//   useEffect(() => {
//     loadLeads();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [section]);

//   // debounce search
//   useEffect(() => {
//     const t = setTimeout(() => {
//       setPage(1);
//       loadLeads();
//     }, 350);
//     return () => clearTimeout(t);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [search]);
  

//   // Section already reflects backend status filtering; use rows as-is.
//   const sectionLeads = isDeletedView ? deletedStash : leads;

//   const matchesLeadFilters = (lead: LeadRow) =>
//     searchIncludes(formatLeadDate(lead.date), searchFilters.date) &&
//     searchIncludes(lead.name, searchFilters.name) &&
//     searchIncludes(lead.phone, searchFilters.phone) &&
//     searchIncludes(lead.city, searchFilters.city) &&
//     searchIncludes(lead.email, searchFilters.email) &&
//     searchIncludes(lead.website, searchFilters.website) &&
//     searchIncludes(lead.notes, searchFilters.notes) &&
//     searchIncludes(lead.sentTo || "", searchFilters.sentTo) &&
//     searchEquals(lead.status, searchFilters.status);

//   const filtered = isDeletedView
//     ? sectionLeads.filter((lead) => {
//         const q = search.toLowerCase();
//         const live =
//           !q ||
//           lead.date.toLowerCase().includes(q) ||
//           lead.name.toLowerCase().includes(q) ||
//           lead.phone.toLowerCase().includes(q) ||
//           lead.city.toLowerCase().includes(q) ||
//           lead.email.toLowerCase().includes(q) ||
//           lead.website.toLowerCase().includes(q) ||
//           lead.notes.toLowerCase().includes(q) ||
//           (lead.sentTo || "").toLowerCase().includes(q) ||
//           lead.status.toLowerCase().includes(q);
//         if (!live) return false;
//         return matchesLeadFilters(lead);
//       })
//     : sectionLeads.filter(matchesLeadFilters);

//   const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
//   const paged = filtered.slice((page - 1) * entriesPerPage, page * entriesPerPage);

//   const toggleSelect = (id: string) => {
//     setSelected((prev) => {
//       const next = new Set(prev);
//       if (next.has(id)) next.delete(id);
//       else next.add(id);
//       return next;
//     });
//   };

//   const toggleSelectAll = () => {
//     if (selected.size === paged.length) setSelected(new Set());
//     else setSelected(new Set(paged.map((l) => l.id)));
//   };

//   const resetForm = () => {
//     setEditingId(null);
//     setDate("2026-06-16");
//     setName("");
//     setPhone("");
//     setCity("");
//     setEmail("");
//     setWebsite("");
//     setNotes(DEFAULT_NOTES);
//     setSentTo("");
//     setStatus("pending");
//     setImageFile(null);
//     if (editingObjectUrl) URL.revokeObjectURL(editingObjectUrl);
//     setEditingObjectUrl(null);
//     setRemoveExistingImage(false);
//   };

//   const openAdd = () => {
//     resetForm();
//     setViewingLead(null);
//     setShowSearchCard(false);
//     setShowForm(true);
//   };

//   const openView = (row: LeadRow) => {
//     setViewingLead(row);
//     setViewStatusDraft(row.status);
//     setShowForm(false);
//     setShowSearchCard(false);
//     resetForm();
//   };

//   const openEdit = (row: LeadRow) => {
//     if (readOnly) {
//       openView(row);
//       return;
//     }
//     setViewingLead(null);
//     setEditingId(row.id);
//     setDate(row.date?.slice(0, 10) || "");
//     setName(row.name);
//     setPhone(row.phone);
//     setCity(row.city);
//     setEmail(row.email);
//     setWebsite(row.website);
//     setNotes(row.notes);
//     setSentTo(row.sentTo || "");
//     setStatus(row.status);
//     setImageFile(null);
//     setShowSearchCard(false);
//     setShowForm(true);
//   };

//   const openSearchCard = () => {
//     setShowForm(false);
//     setViewingLead(null);
//     setSearchDraft({ ...searchFilters });
//     setShowSearchCard((open) => !open);
//   };

//   const handleSearchCardSearch = () => {
//     setSearchFilters({ ...searchDraft });
//     setPage(1);
//     setSelected(new Set());
//     void loadLeads();
//   };

//   const handleSearchCardReset = () => {
//     const empty = emptyAdminSearchValues(LEAD_SEARCH_FIELDS);
//     setSearchDraft(empty);
//     setSearchFilters(empty);
//     setPage(1);
//     setSelected(new Set());
//   };

//   const closeView = () => {
//     setViewingLead(null);
//     setViewStatusDraft(null);
//   };

//   const handleViewStatusUpdate = async () => {
//     if (!viewingLead || viewStatusDraft == null) return;
//     if (viewStatusDraft === viewingLead.status) return;

//     try {
//       await updateLead(viewingLead.id, { status: uiStatusToApi(viewStatusDraft) });
//       setViewingLead((prev) => (prev ? { ...prev, status: viewStatusDraft } : prev));
//       adminNotify.success(`Status updated to ${viewStatusDraft}.`);
//       await loadLeads();
//     } catch (err: any) {
//       adminNotify.error(err?.message || "Status update failed.");
//     }
//   };

//   const handleCancel = () => {
//     resetForm();
//     setShowForm(false);
//   };

//   const handleSave = async () => {
//     if (!date.trim() || !name.trim() || !phone.trim() || !city.trim()) {
//       adminNotify.error("Please fill Date, Name, Phone, and City.");
//       return;
//     }
  
//     const basePayload = {
//       date: date.trim(),
//       name: name.trim(),
//       phone: phone.trim(),
//       city: city.trim(),
//       email: email.trim() || undefined,
//       website: website.trim() || undefined,
//       notes: notes.trim() || undefined,
//       sentTo: sentTo || null,
//     };
  
//     setSaving(true);
//     try {
//       if (editingId != null) {
//         await updateLead(editingId, {
//           ...basePayload,
//           status: uiStatusToApi(status),
//           image: imageFile ?? undefined,
//           removeImage: removeExistingImage,
//         });
//         adminNotify.success("Lead updated.");
//       } else {
//         await createLead({
//           ...basePayload,
//           image: imageFile ?? undefined,
//         });
//         adminNotify.success("Lead created.");
//       }
//       resetForm();
//       setShowForm(false);
//       await loadLeads();
//     } catch (err: any) {
//       adminNotify.error(err?.message || "Save failed.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDeleteSelected = async () => {
//     if (selected.size === 0) return;
//     if (!window.confirm(`Delete ${selected.size} selected lead(s)?`)) return;
//     const toDelete = leads.filter((l) => selected.has(l.id));
//     try {
//       await Promise.all(Array.from(selected).map((id) => deleteLead(id)));
//       stashDeleted(toDelete);
//       adminNotify.success("Deleted.");
//       setSelected(new Set());
//       await loadLeads();
//     } catch (err: any) {
//       adminNotify.error(err?.message || "Delete failed.");
//     }
//   };

//   const handleRestore = async () => {
//     if (selected.size === 0) return;
//     const toRestore = deletedStash.filter((l) => selected.has(l.id));
//     if (toRestore.length === 0) return;
//     if (!window.confirm(`Restore ${toRestore.length} lead(s)?`)) return;
//     try {
//       for (const lead of toRestore) {
//         await createLead({
//           date: lead.date,
//           name: lead.name,
//           phone: lead.phone,
//           city: lead.city,
//           email: lead.email?.trim() || undefined,
//           website: lead.website?.trim() || undefined,
//           notes: lead.notes?.trim() || undefined,
//           sentTo: lead.sentTo,
//           status: uiStatusToApi(lead.status),
//         });
//       }
//       restoreStashed((item) => selected.has(item.id));
//       setSelected(new Set());
//       adminNotify.success("Lead(s) restored.");
//       await loadLeads();
//     } catch (err: any) {
//       adminNotify.error(err?.message || "Restore failed.");
//     }
//   };

//   const handleBulkStatusUpdate = async () => {
//     if (selected.size === 0) return;
//     setBulkUpdating(true);
//     try {
//       await Promise.all(
//         Array.from(selected).map((id) => updateLead(id, { status: uiStatusToApi(bulkStatus) }))
//       );
//       adminNotify.success(`${selected.size} lead(s) marked as ${bulkStatus}.`);
//       setSelected(new Set());
//       await loadLeads();
//     } catch (err: any) {
//       adminNotify.error(err?.message || "Status update failed.");
//     } finally {
//       setBulkUpdating(false);
//     }
//   };

//   const sentToLabel =
//     section === "visited" ? "Visited By" : section === "completed" ? "Completed By" : "Sent To";

//   const handleToolbarPrint = () => {
//     const headers = [
//       "Date",
//       "Name",
//       "Phone",
//       "City",
//       "Email",
//       "Website",
//       "Notes",
//       sentToLabel,
//       "Status",
//       "Image",
//     ];

//     printAdminTable({
//       title: isDeletedView ? `Deleted ${title}` : title,
//       headers,
//       rows: filtered.map((lead) => [
//           formatLeadDate(lead.date),
//           lead.name,
//           lead.phone,
//           lead.city,
//           lead.email || "-",
//           lead.website || "-",
//           lead.notes || "-",
//           lead.sentTo || "-",
//           lead.status || "-",
//           lead.imageUrl ? "Yes" : "—",
//         ]),
//     });
//   };

//   const viewDetailPanel = viewingLead ? (
//     <CompactFormPanel
//       footer={
//         <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-ad-form-border bg-ad-form-required-bg px-3 py-2.5">
//           <div />
//           <span className="text-center text-xs font-serif italic text-gray-800">
//             You are viewing a &apos;Lead&apos;
//           </span>
//           <div className="flex justify-end">
//             {!readOnly && (
//               <button
//                 type="button"
//                 onClick={() => openEdit(viewingLead)}
//                 className="mr-2 rounded border border-ad-green bg-ad-green px-4 py-1 text-sm font-medium text-white hover:bg-ad-green-dark"
//               >
//                 Edit
//               </button>
//             )}
//             <button
//               type="button"
//               onClick={closeView}
//               className="rounded border border-gray-400 bg-white px-4 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       }
//     >
//       <CompactFormRow className="w-full items-start" columns={4}>
//         <CompactField label="Date" className="w-full min-w-0">
//           <div className={compactReadOnlyValueClass}>{formatLeadDate(viewingLead.date)}</div>
//         </CompactField>
//         <CompactField label="Name" className="w-full min-w-0">
//           <div className={compactReadOnlyValueClass}>{viewingLead.name}</div>
//         </CompactField>
//         <CompactField label="Phone" className="w-full min-w-0">
//           <div className={compactReadOnlyValueClass}>{viewingLead.phone}</div>
//         </CompactField>
//         <CompactField label="City" className="w-full min-w-0">
//           <div className={compactReadOnlyValueClass}>{viewingLead.city}</div>
//         </CompactField>
//       </CompactFormRow>
//       <CompactFormRow className="w-full items-start" columns={4}>
//         <CompactField label="Email" className="w-full min-w-0">
//           <div className={compactReadOnlyValueClass}>{viewingLead.email}</div>
//         </CompactField>
//         <CompactField label="Website" className="w-full min-w-0">
//           <div className={compactReadOnlyValueClass}>{viewingLead.website}</div>
//         </CompactField>
//         <CompactField label="Notes" className="w-full min-w-0">
//           <div className={`${compactReadOnlyMultilineClass} whitespace-pre-wrap`}>{viewingLead.notes}</div>
//         </CompactField>
//         <CompactField label={sentToLabel} className="w-full min-w-0">
//           <div className={compactReadOnlyValueClass}>{viewingLead.sentTo || "-"}</div>
//         </CompactField>
//       </CompactFormRow>
//       <CompactFormRow className="w-full items-start" columns={4}>
//         <CompactField label="Image" className="w-full min-w-0 lg:col-span-3">
//           {viewingLead.imageUrl ? (
//             <button
//               type="button"
//               onClick={() =>
//                 setImagePreview({
//                   url: viewingLead.imageUrl!,
//                   title: `${viewingLead.name} — lead image`,
//                 })
//               }
//               className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
//             >
//               <FiPaperclip className="size-4" aria-hidden />
//               View
//             </button>
//           ) : (
//             <div className={compactReadOnlyValueClass}>-</div>
//           )}
//         </CompactField>
//         <CompactField label="Status" className="w-full min-w-0 lg:col-span-1">
//           {!readOnly ? (
//             <div className="flex items-center gap-2">
//               <select
//                 value={viewStatusDraft ?? viewingLead.status}
//                 onChange={(e) => setViewStatusDraft(e.target.value as LeadStatus)}
//                 className={compactInputClass}
//               >
//                 {STATUS_OPTIONS.map((opt) => (
//                   <option key={opt.value} value={opt.value}>
//                     {opt.label}
//                   </option>
//                 ))}
//               </select>
//               {viewStatusDraft != null && viewStatusDraft !== viewingLead.status && (
//                 <button
//                   type="button"
//                   onClick={handleViewStatusUpdate}
//                   className="shrink-0 rounded border border-ad-green bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark"
//                 >
//                   Update
//                 </button>
//               )}
//             </div>
//           ) : (
//             <div className={compactReadOnlyValueClass}>{viewingLead.status}</div>
//           )}
//         </CompactField>
//       </CompactFormRow>
//     </CompactFormPanel>
//   ) : undefined;

//   return (
//     <AdminPage
//       title={isDeletedView ? `Deleted ${title}` : title}
//       noPanel={!showAddNew}
//       headerAction={
//         showAddNew && !showForm && !showSearchCard && !viewingLead && !isDeletedView ? (
//           <AddNewButton onClick={openAdd} />
//         ) : undefined
//       }
//       between={
//         showSearchCard ? (
//           <AdminSearchCard
//             fields={LEAD_SEARCH_FIELDS.map((field) =>
//               field.key === "sentTo" ? { ...field, label: sentToLabel } : field
//             )}
//             values={searchDraft}
//             onChange={setSearchDraft}
//             onSearch={handleSearchCardSearch}
//             onReset={handleSearchCardReset}
//             onClose={() => setShowSearchCard(false)}
//           />
//         ) : (
//           viewDetailPanel ??
//           (!readOnly && showForm ? (
//             <CompactFormPanel
//               footer={
//                 <CompactFormFooter
//                   message={editingId != null ? "You are editing a 'Lead'" : "You are creating a 'Lead'"}
//                   messageCenter
//                   actionLabel={saving ? "Saving…" : editingId != null ? "Update" : "Save"}
//                   onSave={saving ? () => {} : handleSave}
//                   onCancel={handleCancel}
//                 />
//               }
//             >
//               <CompactFormRow className="w-full items-start" columns={4}>
//                 <CompactField label="Date" required className="w-full min-w-0">
//                   <input
//                     type="date"
//                     value={date}
//                     onChange={(e) => setDate(e.target.value)}
//                     className={compactInputClass}
//                   />
//                 </CompactField>
//                 <CompactField label="Name" required className="w-full min-w-0">
//                   <input
//                     type="text"
//                     value={name}
//                     onChange={(e) => setName(e.target.value)}
//                     className={compactInputClass}
//                   />
//                 </CompactField>
//                 <CompactField label="Phone" required className="w-full min-w-0">
//                   <input
//                     type="text"
//                     value={phone}
//                     onChange={(e) => setPhone(e.target.value)}
//                     className={compactInputClass}
//                   />
//                 </CompactField>
//                 <CompactField label="City" required className="w-full min-w-0">
//                   <select value={city} onChange={(e) => setCity(e.target.value)} className={compactInputClass}>
//                     <option value="">Select city</option>
//                     {citySelectOptions.map((cityName) => (
//                       <option key={cityName} value={cityName}>
//                         {cityName}
//                       </option>
//                     ))}
//                   </select>
//                 </CompactField>
//               </CompactFormRow>
//             <CompactFormRow className="w-full items-start" columns={4}>
//               <CompactField label="Email" className="w-full min-w-0">
//                 <input
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className={compactInputClass}
//                 />
//               </CompactField>
//               <CompactField label="Website" className="w-full min-w-0">
//                 <input
//                   type="text"
//                   value={website}
//                   onChange={(e) => setWebsite(e.target.value)}
//                   className={compactInputClass}
//                 />
//               </CompactField>
//               <CompactField label="Notes" className="w-full min-w-0">
//                 <CompactAutoGrowTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
//               </CompactField>
//               <CompactField label={sentToLabel} className="w-full min-w-0">
//                 <select
//                   value={sentTo}
//                   onChange={(e) => setSentTo(e.target.value)}
//                   className={compactInputClass}
//                   disabled={editingId != null}
//                 >
//                   <option value="">-</option>
//                   {ASSOCIATE_OPTIONS.map((associate) => (
//                     <option key={associate} value={associate}>
//                       {associate}
//                     </option>
//                   ))}
//                 </select>
//               </CompactField>
//             </CompactFormRow>
//             {/* Add this as a NEW CompactFormRow, right after the existing
//    <CompactFormRow className="w-full items-start" columns={4}>
//      Email / Website / Notes / Sent To
//    </CompactFormRow>
//    Only shown while editing an existing lead — new leads default to
//    "pending", which isn't a selectable STATUS_OPTIONS value. */}

// {editingId != null && (
//   <CompactFormRow className="w-full items-start" columns={4}>
//     <CompactField label="Status" className="w-full min-w-0">
//       <select
//         value={status}
//         onChange={(e) => setStatus(e.target.value as LeadStatus)}
//         className={compactInputClass}
//       >
//         {STATUS_OPTIONS.map((opt) => (
//           <option key={opt.value} value={opt.value}>
//             {opt.label}
//           </option>
//         ))}
//       </select>
//     </CompactField>
//   </CompactFormRow>
// )}
//           </CompactFormPanel>
//         ) : undefined)
//         )
//       }
//     >
//       {isDeletedView && (
//         <AdminDeletedBanner count={deletedStash.length} entityLabel="leads" />
//       )}
//       <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
//         <div className="flex flex-wrap items-center gap-1">
//           {!readOnly && (
//             <>
//               {!isDeletedView ? (
//                 <button
//                   type="button"
//                   disabled={selected.size === 0}
//                   onClick={handleDeleteSelected}
//                   className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
//                 >
//                   Delete
//                 </button>
//               ) : (
//                 <button
//                   type="button"
//                   disabled={selected.size === 0}
//                   onClick={handleRestore}
//                   className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
//                 >
//                   Restore
//                 </button>
//               )}
//               {!isDeletedView && selected.size > 0 && (
//                 <div className="flex items-center gap-1 rounded border border-gray-400 bg-white px-1.5 py-0.5">
//                   <span className="text-xs font-semibold text-gray-600">{selected.size} selected</span>
//                   <select
//                     value={bulkStatus}
//                     onChange={(e) => setBulkStatus(e.target.value as LeadStatus)}
//                     className="border border-gray-300 px-1 py-0.5 text-xs"
//                     disabled={bulkUpdating}
//                   >
//                     {STATUS_OPTIONS.map((opt) => (
//                       <option key={opt.value} value={opt.value}>
//                         {opt.label}
//                       </option>
//                     ))}
//                   </select>
//                   <button
//                     type="button"
//                     onClick={handleBulkStatusUpdate}
//                     disabled={bulkUpdating}
//                     className="rounded bg-ad-green px-2 py-0.5 text-xs font-semibold text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
//                   >
//                     {bulkUpdating ? "Updating…" : "Update Status"}
//                   </button>
//                 </div>
//               )}
//             </>
//           )}
//           <button
//             type="button"
//             onClick={handleToolbarPrint}
//             className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark"
//           >
//             Print
//           </button>
//         </div>
//         <div className="flex items-center gap-1">
//           <input
//             type="text"
//             value={search}
//             onChange={(e) => {
//               setSearch(e.target.value);
//               setPage(1);
//             }}
//             placeholder="Live Search here"
//             className="border border-gray-400 bg-white px-2 py-1 text-xs"
//           />
//           <button
//             type="button"
//             onClick={openSearchCard}
//             className={`px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 ${
//               showSearchCard ? "bg-gray-700" : "bg-gray-500"
//             }`}
//           >
//             Filters
//           </button>
//         </div>
//       </div>

//       <div className="mb-2 flex items-center gap-2 text-xs text-gray-700">
//         <span>Show</span>
//         <select
//           value={entriesPerPage}
//           onChange={(e) => {
//             setEntriesPerPage(Number(e.target.value));
//             setPage(1);
//           }}
//           className="border border-gray-400 px-1 py-0.5"
//         >
//           <option value={10}>10</option>
//           <option value={25}>25</option>
//           <option value={50}>50</option>
//         </select>
//         <span>entries</span>
//       </div>

//       <div className="overflow-x-auto">
//         <table className="w-full border-collapse text-sm whitespace-nowrap">
//           <thead>
//             <tr className="bg-ad-purple text-white">
//               <th className="border border-ad-purple-dark px-2 py-2 text-center">
//                 <input
//                   type="checkbox"
//                   checked={paged.length > 0 && selected.size === paged.length}
//                   onChange={toggleSelectAll}
//                   className="accent-white"
//                 />
//               </th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Date</th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Name</th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Phone</th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">City</th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Email</th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Website</th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Notes</th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">{sentToLabel}</th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Status</th>
//               {section === "completed" && <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">View Image</th>}
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td colSpan={11} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
//                   Loading…
//                 </td>
//               </tr>
//             ) : paged.length === 0 ? (
//               <tr>
//                 <td colSpan={11} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
//                   {isDeletedView ? "No deleted leads found." : "No leads found."}
//                 </td>
//               </tr>
//             ) : (
//               paged.map((row, idx) => (
//                 <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
//                   <td className="border border-gray-300 px-2 py-2 text-center">
//                     <input
//                       type="checkbox"
//                       checked={selected.has(row.id)}
//                       onChange={() => toggleSelect(row.id)}
//                       className="accent-ad-purple"
//                     />
//                   </td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">
//                     <button
//                       type="button"
//                       onClick={() => (readOnly ? openView(row) : openEdit(row))}
//                       className="text-blue-700 hover:underline"
//                     >
//                       {formatLeadDate(row.date)}
//                     </button>
//                   </td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">{row.name}</td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">{row.phone}</td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">{row.city}</td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">{row.email}</td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">{row.website}</td>
//                   <td className="border border-gray-300 px-3 py-2 text-left align-top whitespace-normal break-words min-w-[240px]">{row.notes}</td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">{row.sentTo || "-"}</td>
//                   <td className="border border-gray-300 px-3 py-2 text-center capitalize">{row.status || "-"}</td>
//                   {/* {section === "completed" && (
//                     <td className="border border-gray-300 px-3 py-2 text-center">
//                     {row.imageUrl ? (
//                       <ClipImageHover
//                         imageUrl={row.imageUrl}
//                         alt={`Image for ${row.name}`}
//                         size={20}
//                         iconClassName="text-ad-purple"
//                       />
//                     ) : (
//                       <span className="text-gray-500">--</span>
//                     )}
//                   </td>
//                   )} */}
//      {section === "completed" && (
//   <td className="border border-gray-300 px-3 py-2 text-center">
//     {row.imageUrl ? (
//       <div className="flex flex-col items-center gap-1">
//         <ClipImageHover
//           imageUrl={row.imageUrl}
//           alt={`Image for ${row.name}`}
//           size={20}
//           iconClassName="text-ad-purple"
//         />
//         <button
//           type="button"
//           onClick={() =>
//             setImagePreview({ url: row.imageUrl!, title: `${row.name} — lead image` })
//           }
//           className="text-xs text-blue-700 underline hover:text-blue-900 p-0 rounded-none"
//           style={{ margin: 0, padding: 0, border: "none", background: "none" }}
//         >
//           Preview
//         </button>
//       </div>
//     ) : (
//       <span className="text-gray-500">--</span>
//     )}
//   </td>
// )}
                  
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       <div className="mt-4 flex items-center justify-between">
//         <TableEntriesSummary total={filtered.length} page={page} pageSize={entriesPerPage} />
//         <div className="flex gap-1">
//           {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
//             <button
//               key={p}
//               type="button"
//               onClick={() => setPage(p)}
//               className={`h-7 w-7 border text-xs font-medium ${page === p
//                 ? "border-ad-green bg-ad-green text-white"
//                 : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
//                 }`}
//             >
//               {p}
//             </button>
//           ))}
//         </div>
//         <AdminDeletedToggle
//           viewMode={viewMode}
//           onToggle={toggleViewMode}
//           activeLabel="Active Leads"
//         />
//       </div>

//       {imagePreview && (
//         <div
//           className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
//           onClick={() => setImagePreview(null)}
//         >
//           <div
//             className="relative max-h-[90vh] max-w-[min(90vw,480px)] rounded border border-gray-300 bg-white p-4 shadow-lg"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <button
//               type="button"
//               onClick={() => setImagePreview(null)}
//               className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-700 text-sm text-white hover:bg-gray-900"
//               aria-label="Close"
//             >
//               ×
//             </button>
//             <p className="mb-3 text-center text-sm font-semibold text-ad-green-dark">{imagePreview.title}</p>
//             <img
//               src={imagePreview.url}
//               alt={imagePreview.title}
//               className="mx-auto max-h-[70vh] max-w-full object-contain"
//             />
//           </div>
//         </div>
//       )}
//     </AdminPage>
//   );
// }

import { useCallback, useEffect, useState } from "react";
import { FiPaperclip } from "react-icons/fi";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import AdminSearchCard, {
  emptyAdminSearchValues,
  searchEquals,
  searchIncludes,
  type AdminSearchField,
} from "../../../components/admin/AdminSearchCard";
import ClipImageHover from "../../../components/admin/ClipImageHover";
import {
  CompactAutoGrowTextarea,
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
  compactReadOnlyMultilineClass,
  compactReadOnlyValueClass,
} from "../../../components/admin/ContentPanel";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
import { useAdminDeletedView } from "../../../hooks/useAdminDeletedView";
import { useAdminCityOptions, withSelectedCity } from "../../../hooks/useAdminCityOptions";
import {
  createLead,
  deleteLead,
  fetchAssociates,
  fetchLeads,
  updateLead,
  type AssociateApiRow,
  type LeadApiRow,
  type LeadApiStatus,
} from "./leadsAPI";

// UI-level status mirrors the backend enum exactly (lowercased for display).
type LeadStatus = "pending" | "visited" | "completed";

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  // { value: "pending", label: "pending" },
  { value: "visited", label: "visited" },
  { value: "completed", label: "completed" },
];

const LEAD_SEARCH_FIELDS: AdminSearchField[] = [
  { key: "date", label: "Date", type: "date" },
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "city", label: "City" },
  { key: "email", label: "Email" },
  { key: "website", label: "Website" },
  { key: "notes", label: "Notes" },
  { key: "sentTo", label: "Sent To" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  },
];

type LeadRow = {
  id: string;
  date: string;
  name: string;
  phone: string;
  city: string;
  email: string;
  website: string;
  sentToId: string | null;
  sentToName: string;
  personContacted?: string | null;
  notes: string;
  status: LeadStatus;
  imageUrl?: string | null;
};

function formatLeadDate(value?: string | null): string {
  if (!value) return "-";
  const ymd = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
}

function getBackendImageUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  const base = import.meta.env.VITE_API_URL || "";
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

// The backend has no image upload endpoint for leads. Any image attached
// here stays client-side only (object URL) and is never sent to the API.
function mapLeadFromApi(row: LeadApiRow): LeadRow {
  const apiStatus = row.status;
  const status: LeadStatus =
    apiStatus === "Visited" ? "visited" : apiStatus === "Completed" ? "completed" : "pending";
  const sentToId = row.sentTo?._id ?? null;
  const sentToName = row.sentTo?.name ?? "";
  return {
    id: row._id,
    date: row.date,
    name: row.name,
    phone: row.phone,
    city: row.city,
    email: row.email ?? "",
    website: row.website ?? "",
    sentToId,
    sentToName,
    personContacted: status === "completed" ? sentToName || null : undefined,
    notes: row.notes ?? "",
    status,
    imageUrl: row.image ? getBackendImageUrl(row.image) : null,
  };
}

function uiStatusToApi(status: LeadStatus): LeadApiStatus {
  if (status === "visited") return "Visited";
  if (status === "completed") return "Completed";
  return "Pending";
}

const DEFAULT_NOTES = "";

type LeadSection = "all" | "visited" | "completed";

function sectionToApiStatus(section: LeadSection): LeadApiStatus | undefined {
  if (section === "visited") return "Visited";
  if (section === "completed") return "Completed";
  return "Pending";
}

type LeadsPageProps = {
  initialShowForm?: boolean;
  title?: string;
  showAddNew?: boolean;
  readOnly?: boolean;
  section?: LeadSection;
};

export default function LeadsPage({
  initialShowForm = false,
  title = "Leads",
  showAddNew = true,
  readOnly = false,
  section = "all",
}: LeadsPageProps) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [showSearchCard, setShowSearchCard] = useState(false);
  const [searchDraft, setSearchDraft] = useState(() => emptyAdminSearchValues(LEAD_SEARCH_FIELDS));
  const [searchFilters, setSearchFilters] = useState(() => emptyAdminSearchValues(LEAD_SEARCH_FIELDS));
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState("2026-06-16");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const cityOptions = useAdminCityOptions();
  const citySelectOptions = withSelectedCity(cityOptions, city);
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  // Holds the selected associate's _id (or "" for none).
  const [sentTo, setSentTo] = useState("");
  const [status, setStatus] = useState<LeadStatus>("pending");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [viewingLead, setViewingLead] = useState<LeadRow | null>(null);
  const [viewStatusDraft, setViewStatusDraft] = useState<LeadStatus | null>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);
  const [editingObjectUrl, setEditingObjectUrl] = useState<string | null>(null);
  const [bulkStatus, setBulkStatus] = useState<LeadStatus>("visited");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [associates, setAssociates] = useState<AssociateApiRow[]>([]);
  const [associatesLoading, setAssociatesLoading] = useState(true);

  const resetTableControls = () => {
    setPage(1);
    setSelected(new Set());
    setSearch("");
    const empty = emptyAdminSearchValues(LEAD_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setShowSearchCard(false);
  };

  const { viewMode, isDeletedView, toggleViewMode, deletedStash, stashDeleted, restoreStashed } =
    useAdminDeletedView<LeadRow>({
      onToggle: resetTableControls,
      storageKey: "admin_deleted_view:leads",
    });

  useEffect(() => {
    if (!imagePreview) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setImagePreview(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [imagePreview]);

  useEffect(() => {
    setBulkStatus(section === "visited" ? "completed" : section === "completed" ? "visited" : "visited");
  }, [section]);

  // Load associates once for the "Sent To" dropdown.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAssociatesLoading(true);
      try {
        const rows = await fetchAssociates();
        if (!cancelled) setAssociates(rows);
      } catch (err: any) {
        if (!cancelled) adminNotify.error(err?.message || "Failed to load associates.");
      } finally {
        if (!cancelled) setAssociatesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Resolves an associate's display name from an id, falling back to a stored name if the associate list hasn't loaded (e.g. deactivated staff). */
  const associateNameById = useCallback(
    (id: string | null, fallbackName?: string) => {
      if (!id) return fallbackName || "";
      return associates.find((a) => a._id === id)?.name ?? fallbackName ?? "";
    },
    [associates]
  );

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchLeads({
        status: sectionToApiStatus(section),
        search: search || undefined,
      });
      setLeads(rows.map(mapLeadFromApi));
    } catch (err: any) {
      adminNotify.error(err?.message || "Failed to load leads.");
    } finally {
      setLoading(false);
    }
  }, [section, search]);

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadLeads();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Section already reflects backend status filtering; use rows as-is.
  const sectionLeads = isDeletedView ? deletedStash : leads;

  const matchesLeadFilters = (lead: LeadRow) =>
    searchIncludes(formatLeadDate(lead.date), searchFilters.date) &&
    searchIncludes(lead.name, searchFilters.name) &&
    searchIncludes(lead.phone, searchFilters.phone) &&
    searchIncludes(lead.city, searchFilters.city) &&
    searchIncludes(lead.email, searchFilters.email) &&
    searchIncludes(lead.website, searchFilters.website) &&
    searchIncludes(lead.notes, searchFilters.notes) &&
    searchIncludes(lead.sentToName || "", searchFilters.sentTo) &&
    searchEquals(lead.status, searchFilters.status);

  const filtered = isDeletedView
    ? sectionLeads.filter((lead) => {
        const q = search.toLowerCase();
        const live =
          !q ||
          lead.date.toLowerCase().includes(q) ||
          lead.name.toLowerCase().includes(q) ||
          lead.phone.toLowerCase().includes(q) ||
          lead.city.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q) ||
          lead.website.toLowerCase().includes(q) ||
          lead.notes.toLowerCase().includes(q) ||
          (lead.sentToName || "").toLowerCase().includes(q) ||
          lead.status.toLowerCase().includes(q);
        if (!live) return false;
        return matchesLeadFilters(lead);
      })
    : sectionLeads.filter(matchesLeadFilters);

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
    else setSelected(new Set(paged.map((l) => l.id)));
  };

  const resetForm = () => {
    setEditingId(null);
    setDate("2026-06-16");
    setName("");
    setPhone("");
    setCity("");
    setEmail("");
    setWebsite("");
    setNotes(DEFAULT_NOTES);
    setSentTo("");
    setStatus("pending");
    setImageFile(null);
    if (editingObjectUrl) URL.revokeObjectURL(editingObjectUrl);
    setEditingObjectUrl(null);
    setRemoveExistingImage(false);
  };

  const openAdd = () => {
    resetForm();
    setViewingLead(null);
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openView = (row: LeadRow) => {
    setViewingLead(row);
    setViewStatusDraft(row.status);
    setShowForm(false);
    setShowSearchCard(false);
    resetForm();
  };

  const openEdit = (row: LeadRow) => {
    if (readOnly) {
      openView(row);
      return;
    }
    setViewingLead(null);
    setEditingId(row.id);
    setDate(row.date?.slice(0, 10) || "");
    setName(row.name);
    setPhone(row.phone);
    setCity(row.city);
    setEmail(row.email);
    setWebsite(row.website);
    setNotes(row.notes);
    setSentTo(row.sentToId || "");
    setStatus(row.status);
    setImageFile(null);
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openSearchCard = () => {
    setShowForm(false);
    setViewingLead(null);
    setSearchDraft({ ...searchFilters });
    setShowSearchCard((open) => !open);
  };

  const handleSearchCardSearch = () => {
    setSearchFilters({ ...searchDraft });
    setPage(1);
    setSelected(new Set());
    void loadLeads();
  };

  const handleSearchCardReset = () => {
    const empty = emptyAdminSearchValues(LEAD_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setPage(1);
    setSelected(new Set());
  };

  const closeView = () => {
    setViewingLead(null);
    setViewStatusDraft(null);
  };

  const handleViewStatusUpdate = async () => {
    if (!viewingLead || viewStatusDraft == null) return;
    if (viewStatusDraft === viewingLead.status) return;

    try {
      await updateLead(viewingLead.id, { status: uiStatusToApi(viewStatusDraft) });
      setViewingLead((prev) => (prev ? { ...prev, status: viewStatusDraft } : prev));
      adminNotify.success(`Status updated to ${viewStatusDraft}.`);
      await loadLeads();
    } catch (err: any) {
      adminNotify.error(err?.message || "Status update failed.");
    }
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!date.trim() || !name.trim() || !phone.trim() || !city.trim()) {
      adminNotify.error("Please fill Date, Name, Phone, and City.");
      return;
    }

    const basePayload = {
      date: date.trim(),
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim(),
      email: email.trim() || undefined,
      website: website.trim() || undefined,
      notes: notes.trim() || undefined,
      // sentTo is now the associate's ObjectId string (or null to clear).
      sentTo: sentTo || null,
    };

    setSaving(true);
    try {
      if (editingId != null) {
        await updateLead(editingId, {
          ...basePayload,
          status: uiStatusToApi(status),
          image: imageFile ?? undefined,
          removeImage: removeExistingImage,
        });
        adminNotify.success("Lead updated.");
      } else {
        await createLead({
          ...basePayload,
          image: imageFile ?? undefined,
        });
        adminNotify.success("Lead created.");
      }
      resetForm();
      setShowForm(false);
      await loadLeads();
    } catch (err: any) {
      adminNotify.error(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected lead(s)?`)) return;
    const toDelete = leads.filter((l) => selected.has(l.id));
    try {
      await Promise.all(Array.from(selected).map((id) => deleteLead(id)));
      stashDeleted(toDelete);
      adminNotify.success("Deleted.");
      setSelected(new Set());
      await loadLeads();
    } catch (err: any) {
      adminNotify.error(err?.message || "Delete failed.");
    }
  };

  const handleRestore = async () => {
    if (selected.size === 0) return;
    const toRestore = deletedStash.filter((l) => selected.has(l.id));
    if (toRestore.length === 0) return;
    if (!window.confirm(`Restore ${toRestore.length} lead(s)?`)) return;
    try {
      for (const lead of toRestore) {
        await createLead({
          date: lead.date,
          name: lead.name,
          phone: lead.phone,
          city: lead.city,
          email: lead.email?.trim() || undefined,
          website: lead.website?.trim() || undefined,
          notes: lead.notes?.trim() || undefined,
          sentTo: lead.sentToId,
          status: uiStatusToApi(lead.status),
        });
      }
      restoreStashed((item) => selected.has(item.id));
      setSelected(new Set());
      adminNotify.success("Lead(s) restored.");
      await loadLeads();
    } catch (err: any) {
      adminNotify.error(err?.message || "Restore failed.");
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selected.size === 0) return;
    setBulkUpdating(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) => updateLead(id, { status: uiStatusToApi(bulkStatus) }))
      );
      adminNotify.success(`${selected.size} lead(s) marked as ${bulkStatus}.`);
      setSelected(new Set());
      await loadLeads();
    } catch (err: any) {
      adminNotify.error(err?.message || "Status update failed.");
    } finally {
      setBulkUpdating(false);
    }
  };

  const sentToLabel =
    section === "visited" ? "Visited By" : section === "completed" ? "Completed By" : "Sent To";

  const handleToolbarPrint = () => {
    const headers = [
      "Date",
      "Name",
      "Phone",
      "City",
      "Email",
      "Website",
      "Notes",
      sentToLabel,
      "Status",
      "Image",
    ];

    printAdminTable({
      title: isDeletedView ? `Deleted ${title}` : title,
      headers,
      rows: filtered.map((lead) => [
        formatLeadDate(lead.date),
        lead.name,
        lead.phone,
        lead.city,
        lead.email || "-",
        lead.website || "-",
        lead.notes || "-",
        lead.sentToName || "-",
        lead.status || "-",
        lead.imageUrl ? "Yes" : "—",
      ]),
    });
  };

  const viewDetailPanel = viewingLead ? (
    <CompactFormPanel
      footer={
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-ad-form-border bg-ad-form-required-bg px-3 py-2.5">
          <div />
          <span className="text-center text-xs font-serif italic text-gray-800">
            You are viewing a &apos;Lead&apos;
          </span>
          <div className="flex justify-end">
            {!readOnly && (
              <button
                type="button"
                onClick={() => openEdit(viewingLead)}
                className="mr-2 rounded border border-ad-green bg-ad-green px-4 py-1 text-sm font-medium text-white hover:bg-ad-green-dark"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={closeView}
              className="rounded border border-gray-400 bg-white px-4 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <CompactFormRow className="w-full items-start" columns={4}>
        <CompactField label="Date" className="w-full min-w-0">
          <div className={compactReadOnlyValueClass}>{formatLeadDate(viewingLead.date)}</div>
        </CompactField>
        <CompactField label="Name" className="w-full min-w-0">
          <div className={compactReadOnlyValueClass}>{viewingLead.name}</div>
        </CompactField>
        <CompactField label="Phone" className="w-full min-w-0">
          <div className={compactReadOnlyValueClass}>{viewingLead.phone}</div>
        </CompactField>
        <CompactField label="City" className="w-full min-w-0">
          <div className={compactReadOnlyValueClass}>{viewingLead.city}</div>
        </CompactField>
      </CompactFormRow>
      <CompactFormRow className="w-full items-start" columns={4}>
        <CompactField label="Email" className="w-full min-w-0">
          <div className={compactReadOnlyValueClass}>{viewingLead.email}</div>
        </CompactField>
        <CompactField label="Website" className="w-full min-w-0">
          <div className={compactReadOnlyValueClass}>{viewingLead.website}</div>
        </CompactField>
        <CompactField label="Notes" className="w-full min-w-0">
          <div className={`${compactReadOnlyMultilineClass} whitespace-pre-wrap`}>{viewingLead.notes}</div>
        </CompactField>
        <CompactField label={sentToLabel} className="w-full min-w-0">
          <div className={compactReadOnlyValueClass}>
            {associateNameById(viewingLead.sentToId, viewingLead.sentToName) || "-"}
          </div>
        </CompactField>
      </CompactFormRow>
      <CompactFormRow className="w-full items-start" columns={4}>
        <CompactField label="Image" className="w-full min-w-0 lg:col-span-3">
          {viewingLead.imageUrl ? (
            <button
              type="button"
              onClick={() =>
                setImagePreview({
                  url: viewingLead.imageUrl!,
                  title: `${viewingLead.name} — lead image`,
                })
              }
              className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
            >
              <FiPaperclip className="size-4" aria-hidden />
              View
            </button>
          ) : (
            <div className={compactReadOnlyValueClass}>-</div>
          )}
        </CompactField>
        <CompactField label="Status" className="w-full min-w-0 lg:col-span-1">
          {!readOnly ? (
            <div className="flex items-center gap-2">
              <select
                value={viewStatusDraft ?? viewingLead.status}
                onChange={(e) => setViewStatusDraft(e.target.value as LeadStatus)}
                className={compactInputClass}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {viewStatusDraft != null && viewStatusDraft !== viewingLead.status && (
                <button
                  type="button"
                  onClick={handleViewStatusUpdate}
                  className="shrink-0 rounded border border-ad-green bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark"
                >
                  Update
                </button>
              )}
            </div>
          ) : (
            <div className={compactReadOnlyValueClass}>{viewingLead.status}</div>
          )}
        </CompactField>
      </CompactFormRow>
    </CompactFormPanel>
  ) : undefined;

  return (
    <AdminPage
      title={isDeletedView ? `Deleted ${title}` : title}
      noPanel={!showAddNew}
      headerAction={
        showAddNew && !showForm && !showSearchCard && !viewingLead && !isDeletedView ? (
          <AddNewButton onClick={openAdd} />
        ) : undefined
      }
      between={
        showSearchCard ? (
          <AdminSearchCard
            fields={LEAD_SEARCH_FIELDS.map((field) =>
              field.key === "sentTo" ? { ...field, label: sentToLabel } : field
            )}
            values={searchDraft}
            onChange={setSearchDraft}
            onSearch={handleSearchCardSearch}
            onReset={handleSearchCardReset}
            onClose={() => setShowSearchCard(false)}
          />
        ) : (
          viewDetailPanel ??
          (!readOnly && showForm ? (
            <CompactFormPanel
              footer={
                <CompactFormFooter
                  message={editingId != null ? "You are editing a 'Lead'" : "You are creating a 'Lead'"}
                  messageCenter
                  actionLabel={saving ? "Saving…" : editingId != null ? "Update" : "Save"}
                  onSave={saving ? () => {} : handleSave}
                  onCancel={handleCancel}
                />
              }
            >
              <CompactFormRow className="w-full items-start" columns={4}>
                <CompactField label="Date" required className="w-full min-w-0">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label="Name" required className="w-full min-w-0">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label="Phone" required className="w-full min-w-0">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label="City" required className="w-full min-w-0">
                  <select value={city} onChange={(e) => setCity(e.target.value)} className={compactInputClass}>
                    <option value="">Select city</option>
                    {citySelectOptions.map((cityName) => (
                      <option key={cityName} value={cityName}>
                        {cityName}
                      </option>
                    ))}
                  </select>
                </CompactField>
              </CompactFormRow>
              <CompactFormRow className="w-full items-start" columns={4}>
                <CompactField label="Email" className="w-full min-w-0">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label="Website" className="w-full min-w-0">
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label="Notes" className="w-full min-w-0">
                  <CompactAutoGrowTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                </CompactField>
                <CompactField label={sentToLabel} className="w-full min-w-0">
                  <select
                    value={sentTo}
                    onChange={(e) => setSentTo(e.target.value)}
                    className={compactInputClass}
                    disabled={editingId != null || associatesLoading}
                  >
                    <option value="">{associatesLoading ? "Loading…" : "-"}</option>
                    {associates.map((associate) => (
                      <option key={associate._id} value={associate._id}>
                        {associate.name}
                      </option>
                    ))}
                    {/* Preserve a stale/deactivated associate reference so it's still visible while editing. */}
                    {editingId != null &&
                      sentTo &&
                      !associates.some((a) => a._id === sentTo) && (
                        <option value={sentTo}>{associateNameById(sentTo) || "Unknown associate"}</option>
                      )}
                  </select>
                </CompactField>
              </CompactFormRow>
              {editingId != null && (
                <CompactFormRow className="w-full items-start" columns={4}>
                  <CompactField label="Status" className="w-full min-w-0">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as LeadStatus)}
                      className={compactInputClass}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </CompactField>
                </CompactFormRow>
              )}
            </CompactFormPanel>
          ) : undefined)
        )
      }
    >
      {isDeletedView && <AdminDeletedBanner count={deletedStash.length} entityLabel="leads" />}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1">
          {!readOnly && (
            <>
              {!isDeletedView ? (
                <button
                  type="button"
                  disabled={selected.size === 0}
                  onClick={handleDeleteSelected}
                  className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete
                </button>
              ) : (
                <button
                  type="button"
                  disabled={selected.size === 0}
                  onClick={handleRestore}
                  className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Restore
                </button>
              )}
              {!isDeletedView && selected.size > 0 && (
                <div className="flex items-center gap-1 rounded border border-gray-400 bg-white px-1.5 py-0.5">
                  <span className="text-xs font-semibold text-gray-600">{selected.size} selected</span>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value as LeadStatus)}
                    className="border border-gray-300 px-1 py-0.5 text-xs"
                    disabled={bulkUpdating}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleBulkStatusUpdate}
                    disabled={bulkUpdating}
                    className="rounded bg-ad-green px-2 py-0.5 text-xs font-semibold text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {bulkUpdating ? "Updating…" : "Update Status"}
                  </button>
                </div>
              )}
            </>
          )}
          <button
            type="button"
            onClick={handleToolbarPrint}
            className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark"
          >
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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-ad-purple text-white">
              <th className="border border-ad-purple-dark px-2 py-2 text-center">
                <input
                  type="checkbox"
                  checked={paged.length > 0 && selected.size === paged.length}
                  onChange={toggleSelectAll}
                  className="accent-white"
                />
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Date</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Name</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Phone</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">City</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Email</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Website</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Notes</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">{sentToLabel}</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Status</th>
              {section === "completed" && (
                <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">View Image</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={11} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                  {isDeletedView ? "No deleted leads found." : "No leads found."}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => (
                <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      className="accent-ad-purple"
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => (readOnly ? openView(row) : openEdit(row))}
                      className="text-blue-700 hover:underline"
                    >
                      {formatLeadDate(row.date)}
                    </button>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.name}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.phone}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.city}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.email}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.website}</td>
                  <td className="border border-gray-300 px-3 py-2 text-left align-top whitespace-normal break-words min-w-[240px]">
                    {row.notes}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.sentToName || "-"}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center capitalize">{row.status || "-"}</td>
                  {section === "completed" && (
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {row.imageUrl ? (
                        <div className="flex flex-col items-center gap-1">
                          <ClipImageHover
                            imageUrl={row.imageUrl}
                            alt={`Image for ${row.name}`}
                            size={20}
                            iconClassName="text-ad-purple"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setImagePreview({ url: row.imageUrl!, title: `${row.name} — lead image` })
                            }
                            className="text-xs text-blue-700 underline hover:text-blue-900 p-0 rounded-none"
                            style={{ margin: 0, padding: 0, border: "none", background: "none" }}
                          >
                            Preview
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500">--</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
        <AdminDeletedToggle viewMode={viewMode} onToggle={toggleViewMode} activeLabel="Active Leads" />
      </div>

      {imagePreview && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setImagePreview(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[min(90vw,480px)] rounded border border-gray-300 bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-700 text-sm text-white hover:bg-gray-900"
              aria-label="Close"
            >
              ×
            </button>
            <p className="mb-3 text-center text-sm font-semibold text-ad-green-dark">{imagePreview.title}</p>
            <img
              src={imagePreview.url}
              alt={imagePreview.title}
              className="mx-auto max-h-[70vh] max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </AdminPage>
  );
}