// // import { useEffect, useState } from "react";
// // import { FiPaperclip } from "react-icons/fi";
// // import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
// // import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
// // import ClipImageHover from "../../../components/admin/ClipImageHover";
// // import {
// //   CompactAutoGrowTextarea,
// //   CompactField,
// //   CompactFormFooter,
// //   CompactFormPanel,
// //   CompactFormRow,
// //   compactInputClass,
// //   compactReadOnlyMultilineClass,
// //   compactReadOnlyValueClass,
// // } from "../../../components/admin/ContentPanel";
// // import { adminNotify } from "../../../utils/adminNotify";
// // import { printAdminTable } from "../../../utils/adminPrintTable";

// // const ASSOCIATE_OPTIONS = [
// //   "Sarah Mitchell",
// //   "James Chen",
// //   "Priya Sharma",
// //   "Marcus Dubois",
// //   "Emily Watson",
// //   "David Okonkwo",
// //   "Lisa Tremblay",
// //   "Robert Singh",
// // ];

// // type LeadStatus = "visited" | "completed";

// // type LeadRow = {
// //   id: number;
// //   date: string;
// //   name: string;
// //   phone: string;
// //   city: string;
// //   email: string;
// //   website: string;
// //   sentTo: string | null;
// //   personContacted?: string | null;
// //   notes: string;
// //   status?: LeadStatus;
// //   imageUrl?: string | null;
// // };

// // const leadImageUrl = (id: number) => `https://picsum.photos/seed/lead-${id}/480/320`;

// // const DUMMY_LEADS: LeadRow[] = [
// //   { id: 1, date: "2026-06-16", name: "John Smith", phone: "705 991 3785", city: "Toronto", email: "john.s@email.com", website: "autodaddy.ca", sentTo: "Sarah Mitchell", notes: "Interested in oil change package", status: "visited", imageUrl: leadImageUrl(1) },
// //   { id: 2, date: "2026-06-15", name: "Maria Garcia", phone: "416 555 0192", city: "Brampton", email: "maria.g@email.com", website: "autoshop12.ca", sentTo: "James Chen", notes: "Referred by Auto Shop #12", status: "visited", imageUrl: leadImageUrl(2) },
// //   { id: 3, date: "2026-06-14", name: "David Chen", phone: "647 555 8821", city: "Mississauga", email: "d.chen@email.com", website: "fleetcare.com", sentTo: "Marcus Dubois", notes: "Fleet account inquiry — 5 vehicles", status: "visited", imageUrl: leadImageUrl(3) },
// //   { id: 4, date: "2026-06-13", name: "Sarah Johnson", phone: "905 555 4410", city: "Hamilton", email: "sarah.j@email.com", website: "autodaddy.ca", sentTo: "Emily Watson", personContacted: "Sarah Johnson", notes: "Brake inspection request", status: "completed", imageUrl: leadImageUrl(4) },
// //   { id: 5, date: "2026-06-12", name: "Michael Brown", phone: "519 555 7733", city: "London", email: "m.brown@email.com", website: "premium.autodaddy.ca", sentTo: "Robert Singh", personContacted: "Michael Brown", notes: "Signed up for premium plan", status: "completed", imageUrl: leadImageUrl(5) },
// //   { id: 6, date: "2026-06-11", name: "Emily Wilson", phone: "613 555 2299", city: "Ottawa", email: "emily.w@email.com", website: "autodaddy.ca", sentTo: "Lisa Tremblay", notes: "Follow up scheduled for Friday" },
// //   { id: 7, date: "2026-06-10", name: "James Taylor", phone: "312 555 8844", city: "Toronto", email: "j.taylor@email.com", website: "autodaddy.com", sentTo: "David Okonkwo", notes: "Tire rotation quote needed" },
// //   { id: 8, date: "2026-06-09", name: "Lisa Anderson", phone: "416 555 6611", city: "Markham", email: "l.anderson@email.com", website: "dealerpartners.ca", sentTo: "Sarah Mitchell", notes: "Dealer partnership interest" },
// //   { id: 9, date: "2026-06-08", name: "Robert Lee", phone: "705 555 3399", city: "Barrie", email: "r.lee@email.com", website: "autodaddy.ca", sentTo: "James Chen", notes: "Callback requested after 5 PM" },
// //   { id: 10, date: "2026-06-07", name: "Anna Martinez", phone: "647 555 1122", city: "Toronto", email: "a.martinez@email.com", website: "autodaddy.ca", sentTo: null, notes: "New car owner onboarding" },
// //   { id: 11, date: "2026-06-06", name: "Kevin Nguyen", phone: "905 555 9021", city: "Vaughan", email: "k.nguyen@email.com", website: "northside.auto", sentTo: "Priya Sharma", notes: "Site visit completed — requested winter tire quote", status: "visited", imageUrl: leadImageUrl(11) },
// //   { id: 12, date: "2026-06-05", name: "Olivia Park", phone: "416 555 7788", city: "Toronto", email: "olivia.p@email.com", website: "autodaddy.ca", sentTo: "Emily Watson", notes: "Walk-in visit for AC service estimate", status: "visited", imageUrl: leadImageUrl(12) },
// //   { id: 13, date: "2026-06-04", name: "Daniel Wright", phone: "519 555 4419", city: "Kitchener", email: "d.wright@email.com", website: "wrightfleet.ca", sentTo: "David Okonkwo", notes: "Visited showroom — comparing maintenance plans", status: "visited", imageUrl: leadImageUrl(13) },
// //   { id: 14, date: "2026-06-03", name: "Sophie Tremblay", phone: "613 555 3300", city: "Ottawa", email: "s.tremblay@email.com", website: "autodaddy.ca", sentTo: "Lisa Tremblay", personContacted: "Sophie Tremblay", notes: "Positive feedback after test drive booking", status: "completed", imageUrl: leadImageUrl(14) },
// //   { id: 15, date: "2026-06-02", name: "Marcus Allen", phone: "705 555 8820", city: "Barrie", email: "m.allen@email.com", website: "allenmotors.ca", sentTo: "Marcus Dubois", personContacted: "Marcus Allen", notes: "Marked positive — ready to sign service contract", status: "completed", imageUrl: leadImageUrl(15) },
// //   { id: 16, date: "2026-06-01", name: "Hannah Brooks", phone: "647 555 1190", city: "Toronto", email: "h.brooks@email.com", website: "premium.autodaddy.ca", sentTo: "Robert Singh", personContacted: "Hannah Brooks", notes: "Positive lead from referral campaign", status: "completed", imageUrl: leadImageUrl(16) },
// //   { id: 17, date: "2026-05-31", name: "Tyler Singh", phone: "905 555 6677", city: "Mississauga", email: "t.singh@email.com", website: "autodaddy.ca", sentTo: "James Chen", notes: "Second visit — confirmed interest in detailing package", status: "visited", imageUrl: leadImageUrl(17) },
// //   { id: 18, date: "2026-05-30", name: "Rachel Kim", phone: "416 555 9033", city: "Toronto", email: "r.kim@email.com", website: "kimautos.ca", sentTo: "Sarah Mitchell", personContacted: "Rachel Kim", notes: "Strong positive response to follow-up call", status: "completed", imageUrl: leadImageUrl(18) },
// // ];

// // const DEFAULT_NOTES = "Lead notes and follow-up details.";

// // type LeadSection = "all" | "visited" | "completed";

// // type LeadsPageProps = {
// //   initialShowForm?: boolean;
// //   title?: string;
// //   showAddNew?: boolean;
// //   readOnly?: boolean;
// //   section?: LeadSection;
// // };

// // export default function LeadsPage({
// //   initialShowForm = false,
// //   title = "Leads",
// //   showAddNew = true,
// //   readOnly = false,
// //   section = "all",
// // }: LeadsPageProps) {
// //   const [leads, setLeads] = useState(DUMMY_LEADS);
// //   const [selected, setSelected] = useState<Set<number>>(new Set());
// //   const [search, setSearch] = useState("");
// //   const [page, setPage] = useState(1);
// //   const [entriesPerPage, setEntriesPerPage] = useState(10);
// //   const [showForm, setShowForm] = useState(initialShowForm);
// //   const [editingId, setEditingId] = useState<number | null>(null);
// //   const [date, setDate] = useState("2026-06-16");
// //   const [name, setName] = useState("");
// //   const [phone, setPhone] = useState("");
// //   const [city, setCity] = useState("");
// //   const [email, setEmail] = useState("");
// //   const [website, setWebsite] = useState("");
// //   const [notes, setNotes] = useState(DEFAULT_NOTES);
// //   const [sentTo, setSentTo] = useState("");
// //   const [status, setStatus] = useState<LeadStatus>("visited");
// //   const [attachImage, setAttachImage] = useState(false);
// //   const [imageFile, setImageFile] = useState<File | null>(null);
// //   const [imageUrl, setImageUrl] = useState<string | null>(null);
// //   const [viewingLead, setViewingLead] = useState<LeadRow | null>(null);
// //   const [viewStatusDraft, setViewStatusDraft] = useState<LeadStatus | null>(null);
// //   const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);
// //   const [editingObjectUrl, setEditingObjectUrl] = useState<string | null>(null);

// //   useEffect(() => {
// //     if (!imagePreview) return;
// //     const onKeyDown = (e: KeyboardEvent) => {
// //       if (e.key === "Escape") setImagePreview(null);
// //     };
// //     window.addEventListener("keydown", onKeyDown);
// //     return () => window.removeEventListener("keydown", onKeyDown);
// //   }, [imagePreview]);

// //   const sectionLeads = leads.filter((l) => {
// //     if (section === "visited") return l.status === "visited";
// //     if (section === "completed") return l.status === "completed";
// //     return l.status !== "visited" && l.status !== "completed";
// //   });

// //   const filtered = sectionLeads.filter(
// //     (l) =>
// //       l.date.includes(search) ||
// //       l.name.toLowerCase().includes(search.toLowerCase()) ||
// //       l.phone.includes(search) ||
// //       l.city.toLowerCase().includes(search.toLowerCase()) ||
// //       l.email.toLowerCase().includes(search.toLowerCase()) ||
// //       l.notes.toLowerCase().includes(search.toLowerCase()) ||
// //       (l.sentTo?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
// //       (l.personContacted?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
// //       l.website.toLowerCase().includes(search.toLowerCase()) ||
// //       (l.status?.toLowerCase().includes(search.toLowerCase()) ?? false)
// //   );

// //   const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
// //   const paged = filtered.slice((page - 1) * entriesPerPage, page * entriesPerPage);

// //   const toggleSelect = (id: number) => {
// //     setSelected((prev) => {
// //       const next = new Set(prev);
// //       if (next.has(id)) next.delete(id);
// //       else next.add(id);
// //       return next;
// //     });
// //   };

// //   const toggleSelectAll = () => {
// //     if (selected.size === paged.length) setSelected(new Set());
// //     else setSelected(new Set(paged.map((l) => l.id)));
// //   };

// //   const resetForm = () => {
// //     setEditingId(null);
// //     setDate("2026-06-16");
// //     setName("");
// //     setPhone("");
// //     setCity("");
// //     setEmail("");
// //     setWebsite("");
// //     setNotes(DEFAULT_NOTES);
// //     setSentTo("");
// //     setStatus("visited");
// //     setAttachImage(false);
// //     setImageFile(null);
// //     setImageUrl(null);
// //     if (editingObjectUrl) URL.revokeObjectURL(editingObjectUrl);
// //     setEditingObjectUrl(null);
// //   };

// //   const openAdd = () => {
// //     resetForm();
// //     setViewingLead(null);
// //     setShowForm(true);
// //   };

// //   const openView = (row: LeadRow) => {
// //     setViewingLead(row);
// //     setViewStatusDraft(row.status ?? "visited");
// //     setShowForm(false);
// //     resetForm();
// //   };

// //   const openEdit = (row: LeadRow) => {
// //     if (readOnly || section === "completed") {
// //       openView(row);
// //       return;
// //     }
// //     setViewingLead(null);
// //     setEditingId(row.id);
// //     setDate(row.date);
// //     setName(row.name);
// //     setPhone(row.phone);
// //     setCity(row.city);
// //     setEmail(row.email);
// //     setWebsite(row.website);
// //     setNotes(row.notes);
// //     setSentTo(row.sentTo || "");
// //     // In "Visited Leads", allow changing visited -> completed (dropdown). In "Completed", status is fixed.
// //     setStatus(row.status ?? (section === "visited" ? "visited" : "completed"));
// //     setAttachImage(Boolean(row.imageUrl));
// //     setImageFile(null);
// //     setImageUrl(row.imageUrl ?? null);
// //     setShowForm(true);
// //   };

// //   const closeView = () => {
// //     setViewingLead(null);
// //     setViewStatusDraft(null);
// //   };

// //   const handleViewStatusUpdate = () => {
// //     if (!viewingLead || viewStatusDraft == null) return;
// //     const savedStatus = viewingLead.status ?? "visited";
// //     if (viewStatusDraft === savedStatus) return;

// //     setLeads((prev) =>
// //       prev.map((lead) =>
// //         lead.id === viewingLead.id ? { ...lead, status: viewStatusDraft } : lead
// //       )
// //     );
// //     setViewingLead((prev) => (prev ? { ...prev, status: viewStatusDraft } : prev));
// //     adminNotify.success(
// //       viewStatusDraft === "completed" ? "Marked as completed." : "Marked as visited."
// //     );
// //   };

// //   const handleCancel = () => {
// //     resetForm();
// //     setShowForm(false);
// //   };

// //   const handleSave = () => {
// //     const payload = {
// //       date,
// //       name,
// //       phone,
// //       city,
// //       email,
// //       website,
// //       notes,
// //       sentTo: sentTo || null,
// //       ...(editingId != null ? { status, imageUrl: attachImage ? imageUrl : null } : {}),
// //     };

// //     if (editingId != null) {
// //       setLeads((prev) =>
// //         prev.map((lead) => (lead.id === editingId ? { ...lead, ...payload } : lead))
// //       );
// //     } else {
// //       setLeads((prev) => [
// //         ...prev,
// //         {
// //           id: Math.max(0, ...prev.map((lead) => lead.id)) + 1,
// //           ...payload,
// //         },
// //       ]);
// //     }

// //     adminNotify.success(editingId != null ? "Lead updated." : "Lead created.");
// //     resetForm();
// //     setShowForm(false);
// //   };

// //   const sentToLabel =
// //     section === "visited" ? "Visited By" : section === "completed" ? "Completed By" : "Sent To";

// //   const handleToolbarPrint = () => {
// //     const headers = [
// //       "Date",
// //       "Name",
// //       "Phone",
// //       "City",
// //       "Email",
// //       "Website",
// //       "Notes",
// //       sentToLabel,
// //       "Status",
// //       "Image",
// //     ];

// //     printAdminTable({
// //       title: "Leads",
// //       headers,
// //       rows: filtered.map((lead) => [
// //           lead.date,
// //           lead.name,
// //           lead.phone,
// //           lead.city,
// //           lead.email,
// //           lead.website,
// //           lead.notes,
// //           lead.sentTo || "-",
// //           lead.status || "-",
// //           lead.imageUrl ? "Yes" : "—",
// //         ]),
// //     });
// //   };

// //   const viewDetailPanel = viewingLead ? (
// //     <CompactFormPanel
// //       footer={
// //         <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-ad-form-border bg-ad-form-required-bg px-3 py-2.5">
// //           <div />
// //           <span className="text-center text-xs font-serif italic text-gray-800">
// //             You are viewing a &apos;Lead&apos;
// //           </span>
// //           <div className="flex justify-end">
// //             {!readOnly && section !== "completed" && (
// //               <button
// //                 type="button"
// //                 onClick={() => openEdit(viewingLead)}
// //                 className="mr-2 rounded border border-ad-green bg-ad-green px-4 py-1 text-sm font-medium text-white hover:bg-ad-green-dark"
// //               >
// //                 Edit
// //               </button>
// //             )}
// //             <button
// //               type="button"
// //               onClick={closeView}
// //               className="rounded border border-gray-400 bg-white px-4 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
// //             >
// //               Close
// //             </button>
// //           </div>
// //         </div>
// //       }
// //     >
// //       <CompactFormRow className="w-full items-start" columns={4}>
// //         <CompactField label="Date" className="w-full min-w-0">
// //           <div className={compactReadOnlyValueClass}>{viewingLead.date}</div>
// //         </CompactField>
// //         <CompactField label="Name" className="w-full min-w-0">
// //           <div className={compactReadOnlyValueClass}>{viewingLead.name}</div>
// //         </CompactField>
// //         <CompactField label="Phone" className="w-full min-w-0">
// //           <div className={compactReadOnlyValueClass}>{viewingLead.phone}</div>
// //         </CompactField>
// //         <CompactField label="City" className="w-full min-w-0">
// //           <div className={compactReadOnlyValueClass}>{viewingLead.city}</div>
// //         </CompactField>
// //       </CompactFormRow>
// //       <CompactFormRow className="w-full items-start" columns={4}>
// //         <CompactField label="Email" className="w-full min-w-0">
// //           <div className={compactReadOnlyValueClass}>{viewingLead.email}</div>
// //         </CompactField>
// //         <CompactField label="Website" className="w-full min-w-0">
// //           <div className={compactReadOnlyValueClass}>{viewingLead.website}</div>
// //         </CompactField>
// //         <CompactField label="Notes" className="w-full min-w-0">
// //           <div className={`${compactReadOnlyMultilineClass} whitespace-pre-wrap`}>{viewingLead.notes}</div>
// //         </CompactField>
// //         <CompactField label={sentToLabel} className="w-full min-w-0">
// //           <div className={compactReadOnlyValueClass}>{viewingLead.sentTo || "-"}</div>
// //         </CompactField>
// //       </CompactFormRow>
// //       <CompactFormRow className="w-full items-start" columns={4}>
// //         <CompactField label="Image" className="w-full min-w-0 lg:col-span-3">
// //           {viewingLead.imageUrl ? (
// //             <button
// //               type="button"
// //               onClick={() =>
// //                 setImagePreview({
// //                   url: viewingLead.imageUrl!,
// //                   title: `${viewingLead.name} — lead image`,
// //                 })
// //               }
// //               className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
// //             >
// //               <FiPaperclip className="size-4" aria-hidden />
// //               View
// //             </button>
// //           ) : (
// //             <div className={compactReadOnlyValueClass}>-</div>
// //           )}
// //         </CompactField>
// //         <CompactField label="Status" className="w-full min-w-0 lg:col-span-1">
// //           {section === "visited" ? (
// //             <div className="flex items-center gap-2">
// //               <select
// //                 value={viewStatusDraft ?? viewingLead.status ?? "visited"}
// //                 onChange={(e) => setViewStatusDraft(e.target.value as LeadStatus)}
// //                 className={compactInputClass}
// //               >
// //                 <option value="visited">visited</option>
// //                 <option value="completed">completed</option>
// //               </select>
// //               {viewStatusDraft != null &&
// //                 viewStatusDraft !== (viewingLead.status ?? "visited") && (
// //                   <button
// //                     type="button"
// //                     onClick={handleViewStatusUpdate}
// //                     className="shrink-0 rounded border border-ad-green bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark"
// //                   >
// //                     Update
// //                   </button>
// //                 )}
// //             </div>
// //           ) : (
// //             <div className={compactReadOnlyValueClass}>{viewingLead.status || "-"}</div>
// //           )}
// //         </CompactField>
// //       </CompactFormRow>
// //     </CompactFormPanel>
// //   ) : undefined;

// //   return (
// //     <AdminPage
// //       title={title}
// //       noPanel={!showAddNew}
// //       headerAction={showAddNew && !showForm && !viewingLead ? <AddNewButton onClick={openAdd} /> : undefined}
// //       between={
// //         viewDetailPanel ??
// //         (!readOnly && showForm ? (
// //           <CompactFormPanel
// //             footer={
// //               <CompactFormFooter
// //                 message={editingId != null ? "You are editing a 'Lead'" : "You are creating a 'Lead'"}
// //                 messageCenter
// //                 actionLabel={editingId != null ? "Update" : "Save"}
// //                 onSave={handleSave}
// //                 onCancel={handleCancel}
// //               />
// //             }
// //           >
// //             <CompactFormRow className="w-full items-start" columns={4}>
// //               <CompactField label="Date" required className="w-full min-w-0">
// //                 <input
// //                   type="date"
// //                   value={date}
// //                   onChange={(e) => setDate(e.target.value)}
// //                   className={compactInputClass}
// //                 />
// //               </CompactField>
// //               <CompactField label="Name" required className="w-full min-w-0">
// //                 <input
// //                   type="text"
// //                   value={name}
// //                   onChange={(e) => setName(e.target.value)}
// //                   className={compactInputClass}
// //                 />
// //               </CompactField>
// //               <CompactField label="Phone" required className="w-full min-w-0">
// //                 <input
// //                   type="text"
// //                   value={phone}
// //                   onChange={(e) => setPhone(e.target.value)}
// //                   className={compactInputClass}
// //                 />
// //               </CompactField>
// //               <CompactField label="City" required className="w-full min-w-0">
// //                 <input
// //                   type="text"
// //                   value={city}
// //                   onChange={(e) => setCity(e.target.value)}
// //                   className={compactInputClass}
// //                 />
// //               </CompactField>
// //             </CompactFormRow>
// //             <CompactFormRow className="w-full items-start" columns={4}>
// //               <CompactField label="Email" required className="w-full min-w-0">
// //                 <input
// //                   type="email"
// //                   value={email}
// //                   onChange={(e) => setEmail(e.target.value)}
// //                   className={compactInputClass}
// //                 />
// //               </CompactField>
// //               <CompactField label="Website" required className="w-full min-w-0">
// //                 <input
// //                   type="text"
// //                   value={website}
// //                   onChange={(e) => setWebsite(e.target.value)}
// //                   className={compactInputClass}
// //                 />
// //               </CompactField>
// //               <CompactField label="Notes" required className="w-full min-w-0">
// //                 <CompactAutoGrowTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
// //               </CompactField>
// //               <CompactField label={sentToLabel} className="w-full min-w-0">
// //                 <select
// //                   value={sentTo}
// //                   onChange={(e) => setSentTo(e.target.value)}
// //                   className={compactInputClass}
// //                   disabled={editingId != null}
// //                 >
// //                   <option value="">-</option>
// //                   {ASSOCIATE_OPTIONS.map((associate) => (
// //                     <option key={associate} value={associate}>
// //                       {associate}
// //                     </option>
// //                   ))}
// //                 </select>
// //               </CompactField>
// //             </CompactFormRow>
// //             {editingId != null && (
// //               <CompactFormRow className="w-full items-start" columns={4}>
// //                 <div className="w-full min-w-0 lg:col-span-3">
// //                   <AttachImageCheckbox
// //                     checked={attachImage}
// //                     onCheckedChange={(checked) => {
// //                       setAttachImage(checked);
// //                       if (!checked) {
// //                         if (editingObjectUrl) URL.revokeObjectURL(editingObjectUrl);
// //                         setEditingObjectUrl(null);
// //                         setImageFile(null);
// //                         setImageUrl(null);
// //                       }
// //                     }}
// //                     file={imageFile}
// //                     onFileChange={(file) => {
// //                       setImageFile(file);
// //                       if (!file) return;
// //                       if (editingObjectUrl) URL.revokeObjectURL(editingObjectUrl);
// //                       const url = URL.createObjectURL(file);
// //                       setEditingObjectUrl(url);
// //                       setImageUrl(url);
// //                     }}
// //                   />
// //                   {imageUrl && attachImage ? (
// //                     <div className="mt-2 flex items-center gap-2">
// //                       <button
// //                         type="button"
// //                         onClick={() => setImagePreview({ url: imageUrl, title: `${name || "Lead"} — lead image` })}
// //                         className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
// //                       >
// //                         <FiPaperclip className="size-4" aria-hidden />
// //                         Preview
// //                       </button>
// //                     </div>
// //                   ) : null}
// //                 </div>
// //                 <CompactField label="Status" className="w-full min-w-0 lg:col-span-1">
// //                   <select
// //                     value={status}
// //                     onChange={(e) => setStatus(e.target.value as LeadStatus)}
// //                     className={compactInputClass}
// //                     disabled={section === "completed"}
// //                   >
// //                     {section === "completed" ? (
// //                       <option value="completed">completed</option>
// //                     ) : section === "visited" ? (
// //                       <>
// //                         <option value="visited">visited</option>
// //                         <option value="completed">completed</option>
// //                       </>
// //                     ) : (
// //                       <>
// //                         <option value="visited">visited</option>
// //                         <option value="completed">completed</option>
// //                       </>
// //                     )}
// //                   </select>
// //                 </CompactField>
// //               </CompactFormRow>
// //             )}
// //           </CompactFormPanel>
// //         ) : undefined)
// //       }
// //     >
// //       <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
// //         <div className="flex flex-wrap gap-1">
// //           {!readOnly && (
// //             <>
// //               <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
// //                 Delete
// //               </button>
// //             </>
// //           )}
// //           <button
// //             type="button"
// //             onClick={handleToolbarPrint}
// //             className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark"
// //           >
// //             Print
// //           </button>
// //         </div>
// //         <div className="flex items-center gap-1">
// //           <input
// //             type="text"
// //             value={search}
// //             onChange={(e) => {
// //               setSearch(e.target.value);
// //               setPage(1);
// //             }}
// //             placeholder="Live Search here"
// //             className="border border-gray-400 bg-white px-2 py-1 text-xs"
// //           />
// //           <button type="button" className="bg-gray-500 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600">
// //             Search
// //           </button>
// //         </div>
// //       </div>

// //       <div className="mb-2 flex items-center gap-2 text-xs text-gray-700">
// //         <span>Show</span>
// //         <select
// //           value={entriesPerPage}
// //           onChange={(e) => {
// //             setEntriesPerPage(Number(e.target.value));
// //             setPage(1);
// //           }}
// //           className="border border-gray-400 px-1 py-0.5"
// //         >
// //           <option value={10}>10</option>
// //           <option value={25}>25</option>
// //           <option value={50}>50</option>
// //         </select>
// //         <span>entries</span>
// //       </div>

// //       <div className="overflow-x-auto">
// //         <table className="w-full border-collapse text-sm whitespace-nowrap">
// //           <thead>
// //             <tr className="bg-ad-purple text-white">
// //               <th className="border border-ad-purple-dark px-2 py-2 text-center">
// //                 <input
// //                   type="checkbox"
// //                   checked={paged.length > 0 && selected.size === paged.length}
// //                   onChange={toggleSelectAll}
// //                   className="accent-white"
// //                 />
// //               </th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Date</th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Name</th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Phone</th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">City</th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Email</th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Website</th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Notes</th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">{sentToLabel}</th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Status</th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">View Image</th>
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {paged.map((row, idx) => (
// //               <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
// //                 <td className="border border-gray-300 px-2 py-2 text-center">
// //                   <input
// //                     type="checkbox"
// //                     checked={selected.has(row.id)}
// //                     onChange={() => toggleSelect(row.id)}
// //                     className="accent-ad-purple"
// //                   />
// //                 </td>
// //                 <td className="border border-gray-300 px-3 py-2 text-center">
// //                   <button
// //                     type="button"
// //                     onClick={() => (readOnly || section === "completed" ? openView(row) : openEdit(row))}
// //                     className="text-blue-700 hover:underline"
// //                   >
// //                     {row.date}
// //                   </button>
// //                 </td>
// //                 <td className="border border-gray-300 px-3 py-2 text-center">{row.name}</td>
// //                 <td className="border border-gray-300 px-3 py-2 text-center">{row.phone}</td>
// //                 <td className="border border-gray-300 px-3 py-2 text-center">{row.city}</td>
// //                 <td className="border border-gray-300 px-3 py-2 text-center">{row.email}</td>
// //                 <td className="border border-gray-300 px-3 py-2 text-center">{row.website}</td>
// //                 <td className="border border-gray-300 px-3 py-2 text-center">{row.notes}</td>
// //                 <td className="border border-gray-300 px-3 py-2 text-center">{row.sentTo || "-"}</td>
// //                 <td className="border border-gray-300 px-3 py-2 text-center capitalize">{row.status || "-"}</td>
// //                 <td className="border border-gray-300 px-3 py-2 text-center">
// //                   {row.imageUrl ? (
// //                     <ClipImageHover
// //                       imageUrl={row.imageUrl}
// //                       alt={`Image for ${row.name}`}
// //                       size={20}
// //                       iconClassName="text-ad-purple"
// //                     />
// //                   ) : (
// //                     <span className="text-gray-500">--</span>
// //                   )}
// //                 </td>
// //               </tr>
// //             ))}
// //           </tbody>
// //         </table>
// //       </div>

// //       <div className="mt-4 flex items-center justify-between">
// //         <div className="flex gap-1">
// //           {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
// //             <button
// //               key={p}
// //               type="button"
// //               onClick={() => setPage(p)}
// //               className={`h-7 w-7 border text-xs font-medium ${page === p
// //                 ? "border-ad-green bg-ad-green text-white"
// //                 : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
// //                 }`}
// //             >
// //               {p}
// //             </button>
// //           ))}
// //         </div>
// //       </div>

// //       {imagePreview && (
// //         <div
// //           className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
// //           onClick={() => setImagePreview(null)}
// //         >
// //           <div
// //             className="relative max-h-[90vh] max-w-[min(90vw,480px)] rounded border border-gray-300 bg-white p-4 shadow-lg"
// //             onClick={(e) => e.stopPropagation()}
// //           >
// //             <button
// //               type="button"
// //               onClick={() => setImagePreview(null)}
// //               className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-700 text-sm text-white hover:bg-gray-900"
// //               aria-label="Close"
// //             >
// //               ×
// //             </button>
// //             <p className="mb-3 text-center text-sm font-semibold text-ad-green-dark">{imagePreview.title}</p>
// //             <img
// //               src={imagePreview.url}
// //               alt={imagePreview.title}
// //               className="mx-auto max-h-[70vh] max-w-full object-contain"
// //             />
// //           </div>
// //         </div>
// //       )}
// //     </AdminPage>
// //   );
// // }
// import { useCallback, useEffect, useState } from "react";
// import { FiPaperclip } from "react-icons/fi";
// import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
// import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
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
// import {
//   createLead,
//   deleteLead,
//   fetchLeads,
//   updateLead,
//   type LeadApiRow,
//   type LeadApiStatus,
//   LEAD_STATUS_OPTIONS,
//   LEAD_STATUS_DEFAULT,
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

// // Frontend enum matching backend for easier mapping.
// type LeadStatus = "pending" | "visited" | "completed";

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

// function mapLeadFromApi(row: LeadApiRow): LeadRow {
//   // Normalize backend ("Pending"|"Visited"|"Completed") to frontend ("pending"|"visited"|"completed")
//   let status: LeadStatus =
//     row.status === "Visited"
//       ? "visited"
//       : row.status === "Completed"
//       ? "completed"
//       : "pending";
//   return {
//     id: row._id,
//     date: row.date,
//     name: row.name,
//     phone: row.phone,
//     city: row.city,
//     email: row.email,
//     website: row.website ?? "",
//     sentTo: row.sentTo ?? null,
//     personContacted: status === "completed" ? row.sentTo ?? null : undefined,
//     notes: row.notes ?? "",
//     status,
//     imageUrl: null,
//   };
// }

// // Map frontend status to backend status
// function uiStatusToApi(status: LeadStatus): LeadApiStatus {
//   if (status === "pending") return "Pending";
//   if (status === "visited") return "Visited";
//   return "Completed";
// }

// function apiStatusToUi(status: LeadApiStatus): LeadStatus {
//   if (status === "Visited") return "visited";
//   if (status === "Completed") return "completed";
//   return "pending";
// }

// const DEFAULT_NOTES = "Lead notes and follow-up details.";

// type LeadSection = "all" | "pending" | "visited" | "completed";

// function sectionToApiStatus(section: LeadSection): LeadApiStatus | undefined {
//   if (section === "visited") return "Visited";
//   if (section === "completed") return "Completed";
//   if (section === "pending") return "Pending";
//   return undefined;
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
//   const [page, setPage] = useState(1);
//   const [entriesPerPage, setEntriesPerPage] = useState(10);
//   const [showForm, setShowForm] = useState(initialShowForm);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [date, setDate] = useState("2026-06-16");
//   const [name, setName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [city, setCity] = useState("");
//   const [email, setEmail] = useState("");
//   const [website, setWebsite] = useState("");
//   const [notes, setNotes] = useState(DEFAULT_NOTES);
//   const [sentTo, setSentTo] = useState("");
//   const [status, setStatus] = useState<LeadStatus>("pending");
//   const [attachImage, setAttachImage] = useState(false);
//   const [imageFile, setImageFile] = useState<File | null>(null);
//   const [imageUrl, setImageUrl] = useState<string | null>(null);
//   const [viewingLead, setViewingLead] = useState<LeadRow | null>(null);
//   const [viewStatusDraft, setViewStatusDraft] = useState<LeadStatus | null>(null);
//   const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);
//   const [editingObjectUrl, setEditingObjectUrl] = useState<string | null>(null);

//   useEffect(() => {
//     if (!imagePreview) return;
//     const onKeyDown = (e: KeyboardEvent) => {
//       if (e.key === "Escape") setImagePreview(null);
//     };
//     window.addEventListener("keydown", onKeyDown);
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [imagePreview]);

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

//   // No need to transform further: section already sends exact backend status filter at API level.
//   const sectionLeads = leads;

//   const filtered = sectionLeads;

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
//     setAttachImage(false);
//     setImageFile(null);
//     setImageUrl(null);
//     if (editingObjectUrl) URL.revokeObjectURL(editingObjectUrl);
//     setEditingObjectUrl(null);
//   };

//   const openAdd = () => {
//     resetForm();
//     setViewingLead(null);
//     setShowForm(true);
//   };

//   const openView = (row: LeadRow) => {
//     setViewingLead(row);
//     setViewStatusDraft(row.status ?? "pending");
//     setShowForm(false);
//     resetForm();
//   };

//   const openEdit = (row: LeadRow) => {
//     if (readOnly || row.status === "completed" || section === "completed") {
//       openView(row);
//       return;
//     }
//     setViewingLead(null);
//     setEditingId(row.id);
//     setDate(row.date);
//     setName(row.name);
//     setPhone(row.phone);
//     setCity(row.city);
//     setEmail(row.email);
//     setWebsite(row.website);
//     setNotes(row.notes);
//     setSentTo(row.sentTo || "");
//     setStatus(row.status ?? "pending");
//     setAttachImage(Boolean(row.imageUrl));
//     setImageFile(null);
//     setImageUrl(row.imageUrl ?? null);
//     setShowForm(true);
//   };

//   const closeView = () => {
//     setViewingLead(null);
//     setViewStatusDraft(null);
//   };

//   const handleViewStatusUpdate = async () => {
//     if (!viewingLead || viewStatusDraft == null) return;
//     const savedStatus = viewingLead.status ?? "pending";
//     if (viewStatusDraft === savedStatus) return;

//     try {
//       await updateLead(viewingLead.id, { status: uiStatusToApi(viewStatusDraft) });
//       setViewingLead((prev) => (prev ? { ...prev, status: viewStatusDraft } : prev));
//       adminNotify.success(viewStatusDraft === "completed" ? "Marked as completed." : viewStatusDraft === "visited" ? "Marked as visited." : "Marked as pending.");
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
//     const basePayload = {
//       date,
//       name,
//       phone,
//       city,
//       email,
//       website,
//       notes,
//       sentTo: sentTo || null,
//       status: uiStatusToApi(status),
//     };

//     setSaving(true);
//     try {
//       if (editingId != null) {
//         await updateLead(editingId, { ...basePayload });
//         adminNotify.success("Lead updated.");
//       } else {
//         await createLead(basePayload);
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
//     try {
//       await Promise.all(Array.from(selected).map((id) => deleteLead(id)));
//       adminNotify.success("Deleted.");
//       setSelected(new Set());
//       await loadLeads();
//     } catch (err: any) {
//       adminNotify.error(err?.message || "Delete failed.");
//     }
//   };

//   // Handles status section labels (matches ALL, PENDING, VISITED, COMPLETED)
//   const sentToLabel =
//     section === "visited"
//       ? "Visited By"
//       : section === "completed"
//       ? "Completed By"
//       : section === "pending"
//       ? "Sent To"
//       : "Sent To";

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
//       title: "Leads",
//       headers,
//       rows: filtered.map((lead) => [
//         lead.date,
//         lead.name,
//         lead.phone,
//         lead.city,
//         lead.email,
//         lead.website,
//         lead.notes,
//         lead.sentTo || "-",
//         lead.status,
//         lead.imageUrl ? "Yes" : "—",
//       ]),
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
//             {!readOnly && viewingLead.status !== "completed" && (
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
//           <div className={compactReadOnlyValueClass}>{viewingLead.date}</div>
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
//           {viewingLead.status === "visited" ? (
//             <div className="flex items-center gap-2">
//               <select
//                 value={viewStatusDraft ?? viewingLead.status ?? "pending"}
//                 onChange={(e) => setViewStatusDraft(e.target.value as LeadStatus)}
//                 className={compactInputClass}
//               >
//                 <option value="pending">pending</option>
//                 <option value="visited">visited</option>
//                 <option value="completed">completed</option>
//               </select>
//               {viewStatusDraft != null &&
//                 viewStatusDraft !== (viewingLead.status ?? "pending") && (
//                   <button
//                     type="button"
//                     onClick={handleViewStatusUpdate}
//                     className="shrink-0 rounded border border-ad-green bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark"
//                   >
//                     Update
//                   </button>
//                 )}
//             </div>
//           ) : viewingLead.status === "pending" ? (
//             <div className={compactReadOnlyValueClass}>pending</div>
//           ) : (
//             <div className={compactReadOnlyValueClass}>{viewingLead.status}</div>
//           )}
//         </CompactField>
//       </CompactFormRow>
//     </CompactFormPanel>
//   ) : undefined;

//   return (
//     <AdminPage
//       title={title}
//       noPanel={!showAddNew}
//       headerAction={showAddNew && !showForm && !viewingLead ? <AddNewButton onClick={openAdd} /> : undefined}
//       between={
//         viewDetailPanel ??
//         (!readOnly && showForm ? (
//           <CompactFormPanel
//             footer={
//               <CompactFormFooter
//                 message={editingId != null ? "You are editing a 'Lead'" : "You are creating a 'Lead'"}
//                 messageCenter
//                 actionLabel={saving ? "Saving…" : editingId != null ? "Update" : "Save"}
//                 onSave={saving ? () => {} : handleSave}
//                 onCancel={handleCancel}
//               />
//             }
//           >
//             <CompactFormRow className="w-full items-start" columns={4}>
//               <CompactField label="Date" required className="w-full min-w-0">
//                 <input
//                   type="date"
//                   value={date}
//                   onChange={(e) => setDate(e.target.value)}
//                   className={compactInputClass}
//                 />
//               </CompactField>
//               <CompactField label="Name" required className="w-full min-w-0">
//                 <input
//                   type="text"
//                   value={name}
//                   onChange={(e) => setName(e.target.value)}
//                   className={compactInputClass}
//                 />
//               </CompactField>
//               <CompactField label="Phone" required className="w-full min-w-0">
//                 <input
//                   type="text"
//                   value={phone}
//                   onChange={(e) => setPhone(e.target.value)}
//                   className={compactInputClass}
//                 />
//               </CompactField>
//               <CompactField label="City" required className="w-full min-w-0">
//                 <input
//                   type="text"
//                   value={city}
//                   onChange={(e) => setCity(e.target.value)}
//                   className={compactInputClass}
//                 />
//               </CompactField>
//             </CompactFormRow>
//             <CompactFormRow className="w-full items-start" columns={4}>
//               <CompactField label="Email" required className="w-full min-w-0">
//                 <input
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className={compactInputClass}
//                 />
//               </CompactField>
//               <CompactField label="Website" required className="w-full min-w-0">
//                 <input
//                   type="text"
//                   value={website}
//                   onChange={(e) => setWebsite(e.target.value)}
//                   className={compactInputClass}
//                 />
//               </CompactField>
//               <CompactField label="Notes" required className="w-full min-w-0">
//                 <CompactAutoGrowTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
//               </CompactField>
//               <CompactField label={sentToLabel} className="w-full min-w-0">
//                 <select
//                   value={sentTo}
//                   onChange={(e) => setSentTo(e.target.value)}
//                   className={compactInputClass}
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
//             <CompactFormRow className="w-full items-start" columns={4}>
//               <CompactField label="Status" className="w-full min-w-0 lg:col-span-1">
//                 <select
//                   value={status}
//                   onChange={(e) => setStatus(e.target.value as LeadStatus)}
//                   className={compactInputClass}
//                   disabled={section === "completed"}
//                 >
//                   {LEAD_STATUS_OPTIONS.map((apiStatus) => (
//                     <option key={apiStatus} value={apiStatus.toLowerCase()}>
//                       {apiStatus.toLowerCase()}
//                     </option>
//                   ))}
//                 </select>
//               </CompactField>
//               <div className="w-full min-w-0 lg:col-span-3">
//                 <AttachImageCheckbox
//                   checked={attachImage}
//                   onCheckedChange={(checked) => {
//                     setAttachImage(checked);
//                     if (!checked) {
//                       if (editingObjectUrl) URL.revokeObjectURL(editingObjectUrl);
//                       setEditingObjectUrl(null);
//                       setImageFile(null);
//                       setImageUrl(null);
//                     }
//                   }}
//                   file={imageFile}
//                   onFileChange={(file) => {
//                     setImageFile(file);
//                     if (!file) return;
//                     if (editingObjectUrl) URL.revokeObjectURL(editingObjectUrl);
//                     const url = URL.createObjectURL(file);
//                     setEditingObjectUrl(url);
//                     setImageUrl(url);
//                   }}
//                 />
//                 {imageUrl && attachImage ? (
//                   <div className="mt-2 flex items-center gap-2">
//                     <button
//                       type="button"
//                       onClick={() => setImagePreview({ url: imageUrl, title: `${name || "Lead"} — lead image` })}
//                       className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
//                     >
//                       <FiPaperclip className="size-4" aria-hidden />
//                       Preview
//                     </button>
//                   </div>
//                 ) : null}
//               </div>
//             </CompactFormRow>
//           </CompactFormPanel>
//         ) : undefined)
//       }
//     >
//       <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
//         <div className="flex flex-wrap gap-1">
//           {!readOnly && (
//             <>
//               <button
//                 type="button"
//                 disabled={selected.size === 0}
//                 onClick={handleDeleteSelected}
//                 className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
//               >
//                 Delete
//               </button>
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
//           <button type="button" onClick={() => loadLeads()} className="bg-gray-500 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600">
//             Search
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
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">View Image</th>
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
//                   No leads found.
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
//                       onClick={() => (readOnly || row.status === "completed" || section === "completed" ? openView(row) : openEdit(row))}
//                       className="text-blue-700 hover:underline"
//                     >
//                       {row.date}
//                     </button>
//                   </td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">{row.name}</td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">{row.phone}</td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">{row.city}</td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">{row.email}</td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">{row.website}</td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">{row.notes}</td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">{row.sentTo || "-"}</td>
//                   <td className="border border-gray-300 px-3 py-2 text-center capitalize">{row.status}</td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">
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
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       <div className="mt-4 flex items-center justify-between">
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
import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
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
import {
  createLead,
  deleteLead,
  fetchLeads,
  updateLead,
  type LeadApiRow,
  type LeadApiStatus,
} from "./leadsAPI";

const ASSOCIATE_OPTIONS = [
  "Sarah Mitchell",
  "James Chen",
  "Priya Sharma",
  "Marcus Dubois",
  "Emily Watson",
  "David Okonkwo",
  "Lisa Tremblay",
  "Robert Singh",
];

// UI-level status mirrors the backend enum exactly (lowercased for display).
type LeadStatus = "pending" | "visited" | "completed";

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "pending", label: "pending" },
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
  sentTo: string | null;
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

// The backend has no image upload endpoint for leads. Any image attached
// here stays client-side only (object URL) and is never sent to the API.
function mapLeadFromApi(row: LeadApiRow): LeadRow {
  const apiStatus = row.status;
  const status: LeadStatus =
    apiStatus === "Visited" ? "visited" : apiStatus === "Completed" ? "completed" : "pending";
  return {
    id: row._id,
    date: row.date,
    name: row.name,
    phone: row.phone,
    city: row.city,
    email: row.email ?? "",
    website: row.website ?? "",
    sentTo: row.sentTo ?? null,
    personContacted: status === "completed" ? row.sentTo ?? null : undefined,
    notes: row.notes ?? "",
    status,
    imageUrl: null,
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
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [sentTo, setSentTo] = useState("");
  const [status, setStatus] = useState<LeadStatus>("pending");
  const [attachImage, setAttachImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [viewingLead, setViewingLead] = useState<LeadRow | null>(null);
  const [viewStatusDraft, setViewStatusDraft] = useState<LeadStatus | null>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);
  const [editingObjectUrl, setEditingObjectUrl] = useState<string | null>(null);
  const [bulkStatus, setBulkStatus] = useState<LeadStatus>("visited");
  const [bulkUpdating, setBulkUpdating] = useState(false);

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
    searchIncludes(lead.sentTo || "", searchFilters.sentTo) &&
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
          (lead.sentTo || "").toLowerCase().includes(q) ||
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
    setAttachImage(false);
    setImageFile(null);
    setImageUrl(null);
    if (editingObjectUrl) URL.revokeObjectURL(editingObjectUrl);
    setEditingObjectUrl(null);
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
    setSentTo(row.sentTo || "");
    setStatus(row.status);
    setAttachImage(Boolean(row.imageUrl));
    setImageFile(null);
    setImageUrl(row.imageUrl ?? null);
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
      sentTo: sentTo || null,
    };

    setSaving(true);
    try {
      if (editingId != null) {
        await updateLead(editingId, { ...basePayload, status: uiStatusToApi(status) });
        adminNotify.success("Lead updated.");
      } else {
        await createLead(basePayload);
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
          sentTo: lead.sentTo,
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
          lead.sentTo || "-",
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
          <div className={compactReadOnlyValueClass}>{viewingLead.sentTo || "-"}</div>
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
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={compactInputClass}
                  />
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
                  disabled={editingId != null}
                >
                  <option value="">-</option>
                  {ASSOCIATE_OPTIONS.map((associate) => (
                    <option key={associate} value={associate}>
                      {associate}
                    </option>
                  ))}
                </select>
              </CompactField>
            </CompactFormRow>
            {editingId != null && (
              <CompactFormRow className="w-full items-start" columns={4}>
                <div className="w-full min-w-0 lg:col-span-3">
                  <AttachImageCheckbox
                    checked={attachImage}
                    onCheckedChange={(checked) => {
                      setAttachImage(checked);
                      if (!checked) {
                        if (editingObjectUrl) URL.revokeObjectURL(editingObjectUrl);
                        setEditingObjectUrl(null);
                        setImageFile(null);
                        setImageUrl(null);
                      }
                    }}
                    file={imageFile}
                    onFileChange={(file) => {
                      setImageFile(file);
                      if (!file) return;
                      if (editingObjectUrl) URL.revokeObjectURL(editingObjectUrl);
                      const url = URL.createObjectURL(file);
                      setEditingObjectUrl(url);
                      setImageUrl(url);
                    }}
                  />
                  {imageUrl && attachImage ? (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setImagePreview({ url: imageUrl, title: `${name || "Lead"} — lead image` })}
                        className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        <FiPaperclip className="size-4" aria-hidden />
                        Preview
                      </button>
                    </div>
                  ) : null}
                </div>
                <CompactField label="Status" className="w-full min-w-0 lg:col-span-1">
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
      {isDeletedView && (
        <AdminDeletedBanner count={deletedStash.length} entityLabel="leads" />
      )}
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
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">View Image</th>
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
                  <td className="border border-gray-300 px-3 py-2 text-left align-top whitespace-normal break-words min-w-[240px]">{row.notes}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.sentTo || "-"}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center capitalize">{row.status || "-"}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {row.imageUrl ? (
                      <ClipImageHover
                        imageUrl={row.imageUrl}
                        alt={`Image for ${row.name}`}
                        size={20}
                        iconClassName="text-ad-purple"
                      />
                    ) : (
                      <span className="text-gray-500">--</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`h-7 w-7 border text-xs font-medium ${page === p
                ? "border-ad-green bg-ad-green text-white"
                : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
                }`}
            >
              {p}
            </button>
          ))}
        </div>
        <AdminDeletedToggle
          viewMode={viewMode}
          onToggle={toggleViewMode}
          activeLabel="Active Leads"
        />
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