

// const dealerImageUrl = (id: string) => `https://picsum.photos/seed/dealer-${id}/480/320`;

// const DEALERS_CONFIG: DummyUserListConfig = {
//   title: "Dealers",
//   deletedTitle: "Deleted Dealers",
//   addLabel: "New Dealer",
//   roleLabel: "dealer",
//   primaryFieldLabel: "Dealership",
//   regionFieldLabel: "Website URL",
//   imageFieldLabel: "Image",
//   fieldMode: "web",
//   countALabel: "Listings",
//   countBLabel: "Leads",
//   exportFilePrefix: "dealers",
//   columns: [
//     { key: "name", label: "Name" },
//     { key: "email", label: "Email" },
//     { key: "phone", label: "Phone" },
//     { key: "primary", label: "Dealership" },
//     { key: "city", label: "City" },
//     { key: "websiteUrl", label: "Website URL" },
//     { key: "image", label: "Image" },
//     { key: "date", label: "Date" },
//     { key: "countA", label: "Listings" },
//     { key: "countB", label: "Leads" },
//     { key: "status", label: "Status" },
//   ],
//   defaultVisible: ["name", "email", "phone", "primary", "city", "websiteUrl", "image", "date", "countA", "countB", "status"],
//   initialData: [
//     {
//       _id: "dealer-1",
//       name: "Michael Brooks",
//       email: "mbrooks@lakesidemotors.ca",
//       countryCode: "+1",
//       phone: "7059912200",
//       pincode: "P3A 4R5",
//       city: "Sudbury",
//       websiteUrl: "https://lakesidemotors.ca",
//       imageUrl: dealerImageUrl("dealer-1"),
//       createdAt: "2026-01-08T09:00:00.000Z",
//       isDisabled: false,
//       primaryLabel: "Lakeside Motors",
//       countA: 42,
//       countB: 16,
//     },
//     {
//       _id: "dealer-2",
//       name: "Angela Foster",
//       email: "a.foster@citywheels.ca",
//       countryCode: "+1",
//       phone: "4165550288",
//       pincode: "M4B 1B3",
//       city: "Toronto",
//       websiteUrl: "https://citywheels.ca",
//       imageUrl: dealerImageUrl("dealer-2"),
//       createdAt: "2026-01-20T11:30:00.000Z",
//       isDisabled: false,
//       primaryLabel: "City Wheels Auto Sales",
//       countA: 67,
//       countB: 28,
//     },
//     {
//       _id: "dealer-3",
//       name: "Kevin Lau",
//       email: "klau@pacificdrive.ca",
//       countryCode: "+1",
//       phone: "6045550299",
//       pincode: "V5Z 2M9",
//       city: "Burnaby",
//       websiteUrl: "https://pacificdrive.ca",
//       imageUrl: dealerImageUrl("dealer-3"),
//       createdAt: "2026-02-14T15:00:00.000Z",
//       isDisabled: false,
//       primaryLabel: "Pacific Drive Motors",
//       countA: 53,
//       countB: 21,
//     },
//     {
//       _id: "dealer-4",
//       name: "Sophie Martin",
//       email: "sophie@autostar.qc.ca",
//       countryCode: "+1",
//       phone: "5145550311",
//       pincode: "H1A 0A1",
//       city: "Montreal",
//       websiteUrl: "https://autostar.qc.ca",
//       imageUrl: dealerImageUrl("dealer-4"),
//       createdAt: "2026-03-01T10:15:00.000Z",
//       isDisabled: true,
//       primaryLabel: "AutoStar Quebec",
//       countA: 38,
//       countB: 12,
//     },
//     {
//       _id: "dealer-5",
//       name: "Thomas Reid",
//       email: "treid@prairiemotors.ca",
//       countryCode: "+1",
//       phone: "3065550333",
//       pincode: "S7K 3J5",
//       city: "Saskatoon",
//       websiteUrl: "https://prairiemotors.ca",
//       imageUrl: dealerImageUrl("dealer-5"),
//       createdAt: "2026-03-18T14:45:00.000Z",
//       isDisabled: false,
//       primaryLabel: "Prairie Motors Ltd",
//       countA: 29,
//       countB: 9,
//     },
//     {
//       _id: "dealer-6",
//       name: "Nadia Hassan",
//       email: "n.hassan@capitalcars.ca",
//       countryCode: "+1",
//       phone: "6135550344",
//       pincode: "K2P 0K1",
//       city: "Ottawa",
//       websiteUrl: "https://capitalcars.ca",
//       imageUrl: dealerImageUrl("dealer-6"),
//       createdAt: "2026-04-02T08:30:00.000Z",
//       isDisabled: false,
//       primaryLabel: "Capital Cars Ottawa",
//       countA: 45,
//       countB: 19,
//     },
//     {
//       _id: "dealer-7",
//       name: "Gregory Walsh",
//       email: "gwalsh@maritimemotors.ca",
//       countryCode: "+1",
//       phone: "9025550355",
//       pincode: "B3L 4P3",
//       city: "Halifax",
//       websiteUrl: "https://maritimemotors.ca",
//       imageUrl: dealerImageUrl("dealer-7"),
//       createdAt: "2026-04-19T12:00:00.000Z",
//       isDisabled: false,
//       primaryLabel: "Maritime Motors",
//       countA: 22,
//       countB: 8,
//     },
//     {
//       _id: "dealer-8",
//       name: "Jennifer Park",
//       email: "j.park@edmontonauto.ca",
//       countryCode: "+1",
//       phone: "7805550366",
//       pincode: "T5J 2R7",
//       city: "Edmonton",
//       websiteUrl: "https://edmontonauto.ca",
//       imageUrl: dealerImageUrl("dealer-8"),
//       createdAt: "2026-05-05T16:10:00.000Z",
//       isDisabled: false,
//       status: "deleted",
//       primaryLabel: "Edmonton Auto Centre",
//       countA: 15,
//       countB: 4,
//     },
//   ],
// };

// import React, { useEffect, useRef, useState } from "react";
// import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
// import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
// import ClipImageHover from "../../../components/admin/ClipImageHover";
// import {
//   CompactAutoGrowTextarea,
//   CompactField,
//   CompactFormFooter,
//   CompactFormPanel,
//   CompactFormRow,
//   compactFixedFieldWidth,
//   compactInputClass,
// } from "../../../components/admin/ContentPanel";
// import { adminNotify } from "../../../utils/adminNotify";

// export type DummyUserRow = {
//   _id: string;
//   name: string;
//   email: string;
//   countryCode: string;
//   phone: string;
//   pincode: string;
//   address?: string;
//   city: string;
//   createdAt: string;
//   isDisabled: boolean;
//   status?: string;
//   primaryLabel: string;
//   region?: string;
//   websiteUrl?: string;
//   imageUrl?: string;
//   countA: number;
//   countB: number;
// };

// type ColumnDef = { key: string; label: string };

// export type DummyUserListConfig = {
//   title: string;
//   deletedTitle: string;
//   addLabel: string;
//   roleLabel: string;
//   primaryFieldLabel: string;
//   regionFieldLabel: string;
//   imageFieldLabel?: string;
//   fieldMode?: "location" | "web";
//   countALabel: string;
//   countBLabel: string;
//   columns: ColumnDef[];
//   defaultVisible: string[];
//   initialData: DummyUserRow[];
//   exportFilePrefix: string;
// };

// const tdClass = "border border-gray-300 px-3 py-2 text-center text-sm text-gray-700";
// const thClass = "border border-ad-purple-dark px-3 py-2 text-center font-medium whitespace-nowrap";
// const linkClass = "text-blue-700 hover:underline bg-transparent border-0 p-0 text-sm cursor-pointer font-medium";

// const GREEN_CARD: React.CSSProperties = {
//   background: "#d4f5c4",
//   border: "1px solid #b2e0a0",
//   borderRadius: 14,
//   padding: "18px 22px",
//   marginBottom: 18,
//   boxShadow: "3px 4px 0 #c0d8b0",
// };
// const GC_LABEL: React.CSSProperties = { color: "#555", fontWeight: 600, fontSize: 13, minWidth: 120 };
// const GC_VAL: React.CSSProperties = { color: "#222", fontSize: 13 };

// function GCRow({ label, value }: { label: string; value?: React.ReactNode }) {
//   return (
//     <div style={{ display: "flex", gap: 8, marginBottom: 5 }}>
//       <span style={GC_LABEL}>{label}</span>
//       <span style={{ color: "#888", marginRight: 4 }}>:</span>
//       <span style={GC_VAL}>{value ?? "-"}</span>
//     </div>
//   );
// }

// function fmtDate(d?: string): string {
//   if (!d) return "-";
//   return new Date(d).toISOString().slice(0, 10);
// }

// function getStatus(row: DummyUserRow): string {
//   const status = String(row.status ?? "").toLowerCase();
//   if (status === "deleted" || Boolean((row as any).isDeleted) || Boolean((row as any).deleted)) return "Deleted";
//   if (row.isDisabled) return "Suspended";
//   return "Active";
// }

// function getStatusColors(s: string): React.CSSProperties {
//   if (s === "Active") return { background: "#dff0d8", color: "#3c763d", border: "1px solid #d6e9c6" };
//   if (s === "Suspended") return { background: "#fcf8e3", color: "#8a6d3b", border: "1px solid #faebcc" };
//   if (s === "Deleted") return { background: "#f2dede", color: "#a94442", border: "1px solid #ebccd1" };
//   return { background: "#f2dede", color: "#a94442", border: "1px solid #ebccd1" };
// }

// const BaseModal: React.FC<{
//   isOpen: boolean;
//   onClose: () => void;
//   title: string;
//   children: React.ReactNode;
//   wide?: boolean;
// }> = ({ isOpen, onClose, title, children, wide }) => {
//   if (!isOpen) return null;
//   return (
//     <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-black/45 p-[30px_10px]">
//       <div
//         className="flex flex-col rounded bg-white shadow-[0_5px_24px_rgba(0,0,0,.35)]"
//         style={{ width: wide ? "min(860px,96vw)" : "min(720px,95vw)" }}
//       >
//         <div className="flex shrink-0 items-center justify-between rounded-t bg-[#9b308d] px-[18px] py-[11px] text-white">
//           <span className="text-[15px] font-bold">{title}</span>
//           <button type="button" onClick={onClose} className="cursor-pointer border-0 bg-transparent text-[22px] leading-none text-white">
//             ×
//           </button>
//         </div>
//         <div className="flex-1 overflow-y-auto p-[20px_22px]">{children}</div>
//       </div>
//     </div>
//   );
// };

// const CountModal: React.FC<{
//   row: DummyUserRow;
//   label: string;
//   count: number;
//   onClose: () => void;
// }> = ({ row, label, count, onClose }) => (
//   <BaseModal isOpen onClose={onClose} title={`${label} — ${row.name}`} wide>
//     {count === 0 ? (
//       <p className="text-center text-gray-400">No records found.</p>
//     ) : (
//       Array.from({ length: count }, (_, i) => (
//         <div key={i} style={GREEN_CARD}>
//           <GCRow label={`${label} #`} value={i + 1} />
//           <GCRow label="Status" value="Active" />
//         </div>
//       ))
//     )}
//   </BaseModal>
// );

// function isEmail(e: string) {
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
// }

// function isWebsiteUrl(url: string) {
//   const trimmed = url.trim();
//   if (!trimmed) return false;
//   try {
//     const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
//     return !!parsed.hostname;
//   } catch {
//     return false;
//   }
// }

// function formatWebsiteUrl(url?: string) {
//   if (!url?.trim()) return "-";
//   return url.trim().replace(/^https?:\/\//i, "");
// }

// const DummyUserAddEditForm: React.FC<{
//   row?: DummyUserRow | null;
//   config: DummyUserListConfig;
//   onCancel: () => void;
//   onSaved: (row: DummyUserRow) => void;
// }> = ({ row, config, onCancel, onSaved }) => {
//   const isEdit = !!row;
//   const isWebMode = config.fieldMode === "web";
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState("");
//   const [address, setAddress] = useState("");
//   const [city, setCity] = useState("");
//   const [primaryLabel, setPrimaryLabel] = useState("");
//   const [region, setRegion] = useState("");
//   const [websiteUrl, setWebsiteUrl] = useState("");
//   const [attachImage, setAttachImage] = useState(false);
//   const [imageFile, setImageFile] = useState<File | null>(null);
//   const [imageUrl, setImageUrl] = useState("");
//   const [attempted, setAttempted] = useState(false);

//   useEffect(() => {
//     setAttempted(false);
//     if (isEdit && row) {
//       setName(row.name);
//       setEmail(row.email);
//       setPhone(row.phone);
//       setAddress(row.address ?? "");
//       setCity(row.city);
//       setPrimaryLabel(row.primaryLabel);
//       setRegion(row.region ?? "");
//       setWebsiteUrl(row.websiteUrl ?? "");
//       setAttachImage(Boolean(row.imageUrl));
//       setImageFile(null);
//       setImageUrl(row.imageUrl ?? "");
//     } else {
//       setName("");
//       setEmail("");
//       setPhone("");
//       setAddress("");
//       setCity("");
//       setPrimaryLabel("");
//       setRegion("");
//       setWebsiteUrl("");
//       setAttachImage(false);
//       setImageFile(null);
//       setImageUrl("");
//     }
//   }, [isEdit, row]);

//   const isValid =
//     name.trim() &&
//     isEmail(email) &&
//     phone.replace(/\D/g, "").length === 10 &&
//     primaryLabel.trim() &&
//     (isWebMode ? isWebsiteUrl(websiteUrl) : address.trim() && region.trim());

//   const handleImageFileChange = (file: File | null) => {
//     setImageFile(file);
//     if (!file) {
//       setImageUrl("");
//       return;
//     }
//     if (!file.type.startsWith("image/")) {
//       adminNotify.error("Please select an image file.");
//       setImageFile(null);
//       return;
//     }
//     const reader = new FileReader();
//     reader.onload = () => setImageUrl(typeof reader.result === "string" ? reader.result : "");
//     reader.readAsDataURL(file);
//   };

//   const handleSave = () => {
//     setAttempted(true);
//     if (!isValid) {
//       adminNotify.error("Please fill all required fields.");
//       return;
//     }
//     const normalizedWebsiteUrl = websiteUrl.trim()
//       ? (websiteUrl.trim().startsWith("http") ? websiteUrl.trim() : `https://${websiteUrl.trim()}`)
//       : undefined;

//     onSaved({
//       _id: row ? row._id : `dummy-${Date.now()}`,
//       name: name.trim(),
//       email: email.trim(),
//       countryCode: "",
//       phone: phone.replace(/\D/g, ""),
//       pincode: row?.pincode ?? "",
//       address: isWebMode ? undefined : address.trim(),
//       city: city.trim() || "Toronto",
//       createdAt: row ? row.createdAt : new Date().toISOString(),
//       isDisabled: row ? row.isDisabled : false,
//       status: row ? row.status : undefined,
//       primaryLabel: primaryLabel.trim(),
//       region: isWebMode ? undefined : region.trim(),
//       websiteUrl: isWebMode ? normalizedWebsiteUrl : undefined,
//       imageUrl: isWebMode && attachImage ? imageUrl || undefined : undefined,
//       countA: row ? row.countA : 0,
//       countB: row ? row.countB : 0,
//     });
//   };

//   const formMessage = isEdit
//     ? `You are updating a '${config.title}'`
//     : `You are creating a '${config.title}'`;

//   return (
//     <CompactFormPanel
//       footer={
//         <CompactFormFooter
//           message={formMessage}
//           messageCenter
//           actionLabel={isEdit ? "Update" : "Save"}
//           onSave={handleSave}
//           onCancel={onCancel}
//         />
//       }
//     >
//       <CompactFormRow className="items-start">
//         <CompactField label="Full Name" required className={compactFixedFieldWidth}>
//           <input
//             type="text"
//             value={name}
//             onChange={(e) => setName(e.target.value.slice(0, 40))}
//             className={compactInputClass}
//           />
//         </CompactField>
//         <CompactField label="Email" required className={compactFixedFieldWidth}>
//           <input
//             type="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             className={compactInputClass}
//           />
//         </CompactField>
//         <CompactField label="Phone" required className={compactFixedFieldWidth}>
//           <input
//             type="tel"
//             value={phone}
//             onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
//             className={compactInputClass}
//           />
//         </CompactField>
//         <CompactField label="City" className={compactFixedFieldWidth}>
//           <input
//             type="text"
//             value={city}
//             onChange={(e) => setCity(e.target.value)}
//             className={compactInputClass}
//           />
//         </CompactField>
//         {isWebMode ? (
//           <AttachImageCheckbox
//             label={config.imageFieldLabel ?? "Attach Image"}
//             checked={attachImage}
//             onCheckedChange={(checked) => {
//               setAttachImage(checked);
//               if (!checked) {
//                 setImageFile(null);
//                 setImageUrl("");
//               }
//             }}
//             file={imageFile}
//             onFileChange={handleImageFileChange}
//             className={compactFixedFieldWidth}
//           />
//         ) : (
//           <CompactField label="Address" required className="min-w-0 flex-1">
//             <CompactAutoGrowTextarea
//               value={address}
//               onChange={(e) => setAddress(e.target.value.slice(0, 100))}
//               placeholder="Max 100 chars"
//             />
//           </CompactField>
//         )}
//         <CompactField label={config.primaryFieldLabel} required className={compactFixedFieldWidth}>
//           <input
//             type="text"
//             value={primaryLabel}
//             onChange={(e) => setPrimaryLabel(e.target.value)}
//             className={compactInputClass}
//           />
//         </CompactField>
//         {isWebMode ? (
//           <CompactField label={config.regionFieldLabel} required className={compactFixedFieldWidth}>
//             <input
//               type="url"
//               value={websiteUrl}
//               onChange={(e) => setWebsiteUrl(e.target.value.slice(0, 120))}
//               placeholder="https://example.com"
//               className={compactInputClass}
//             />
//           </CompactField>
//         ) : (
//           <CompactField label={config.regionFieldLabel} required className={compactFixedFieldWidth}>
//             <input
//               type="text"
//               value={region}
//               onChange={(e) => setRegion(e.target.value)}
//               className={compactInputClass}
//             />
//           </CompactField>
//         )}
//       </CompactFormRow>
//       {attempted && !isValid && (
//         <p className="text-xs font-semibold text-red-700">Please fill all required fields correctly.</p>
//       )}
//     </CompactFormPanel>
//   );
// };

// const ColSelector: React.FC<{ columns: ColumnDef[]; visible: string[]; onChange: (v: string[]) => void }> = ({
//   columns,
//   visible,
//   onChange,
// }) => {
//   const [open, setOpen] = useState(false);
//   const ref = useRef<HTMLDivElement>(null);
//   useEffect(() => {
//     function h(e: MouseEvent) {
//       if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
//     }
//     document.addEventListener("mousedown", h);
//     return () => document.removeEventListener("mousedown", h);
//   }, []);
//   const toggle = (key: string) => onChange(visible.includes(key) ? visible.filter((k) => k !== key) : [...visible, key]);
//   return (
//     <div ref={ref} className="relative inline-block">
//       <button
//         type="button"
//         onClick={() => setOpen((o) => !o)}
//         className="flex cursor-pointer items-center gap-1 border-0 bg-gray-600 px-3.5 py-1.5 text-[13px] font-semibold text-white"
//       >
//         Select Heading <span className="text-[10px]">▼</span>
//       </button>
//       {open && (
//         <div className="absolute right-0 top-[110%] z-[200] min-w-[170px] rounded border border-gray-300 bg-white py-1.5 shadow-md">
//           {columns.map((col) => (
//             <label key={col.key} className="flex cursor-pointer items-center gap-2 px-3.5 py-1.5 text-[13px] text-gray-800 select-none">
//               <input
//                 type="checkbox"
//                 checked={visible.includes(col.key)}
//                 onChange={() => toggle(col.key)}
//                 className="h-3.5 w-3.5 cursor-pointer accent-[#0073b7]"
//               />
//               {col.label}
//             </label>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// function exportCsv(rows: DummyUserRow[], config: DummyUserListConfig, visibleCols: string[]) {
//   const colMap: Record<string, (r: DummyUserRow) => string> = {
//     name: (r) => r.name,
//     email: (r) => r.email,
//     phone: (r) => r.phone,
//     primary: (r) => r.primaryLabel,
//     city: (r) => r.city,
//     address: (r) => r.address ?? "-",
//     region: (r) => r.region ?? "-",
//     websiteUrl: (r) => formatWebsiteUrl(r.websiteUrl),
//     image: (r) => (r.imageUrl ? "Yes" : "-"),
//     date: (r) => fmtDate(r.createdAt),
//     countA: (r) => String(r.countA),
//     countB: (r) => String(r.countB),
//     status: (r) => getStatus(r),
//   };
//   const cols = config.columns.filter((c) => visibleCols.includes(c.key));
//   const esc = (v: string) => (/[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
//   const header = cols.map((c) => esc(c.label)).join(",");
//   const body = rows.map((r) => cols.map((c) => esc(colMap[c.key]?.(r) ?? "-")).join(",")).join("\n");
//   const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = `${config.exportFilePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
//   a.click();
//   setTimeout(() => URL.revokeObjectURL(url), 2000);
// }

// type DummyUserListPageProps = {
//   config: DummyUserListConfig;
// };
//  function DummyUserListPage({ config }: DummyUserListPageProps) {
//   const [allRows, setAllRows] = useState<DummyUserRow[]>(config.initialData);
//   const [search, setSearch] = useState("");
//   const [pageSize, setPageSize] = useState(10);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
//   const [visibleCols, setVisibleCols] = useState<string[]>(config.defaultVisible);
//   const [viewMode, setViewMode] = useState<"active" | "deleted">("active");

//   const [countAFor, setCountAFor] = useState<DummyUserRow | null>(null);
//   const [countBFor, setCountBFor] = useState<DummyUserRow | null>(null);
//   const [showForm, setShowForm] = useState(false);
//   const [editingRow, setEditingRow] = useState<DummyUserRow | null>(null);

//   const isRowDeleted = (r: DummyUserRow): boolean => {
//     const status = String(r.status ?? "").toLowerCase();
//     return status === "deleted" || Boolean((r as any).isDeleted) || Boolean((r as any).deleted);
//   };
//   const activeRows = allRows.filter((r) => !isRowDeleted(r));
//   const deletedRows = allRows.filter((r) => isRowDeleted(r));
//   const displayRows = viewMode === "deleted" ? deletedRows : activeRows;

//   const filtered = displayRows.filter((r) => {
//     const q = search.toLowerCase();
//     return (
//       r.name.toLowerCase().includes(q) ||
//       r.email.toLowerCase().includes(q) ||
//       r.phone.includes(q) ||
//       r.primaryLabel.toLowerCase().includes(q) ||
//       r.city.toLowerCase().includes(q) ||
//       (r.region ?? "").toLowerCase().includes(q) ||
//       (r.websiteUrl ?? "").toLowerCase().includes(q)
//     );
//   });

//   const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
//   const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
//   const selected = Array.from(selectedRows);
//   const selCount = selected.length;
//   const allPageSel = paginated.length > 0 && paginated.every((r) => selectedRows.has(r._id));

//   function toggleRow(id: string) {
//     setSelectedRows((prev) => {
//       const c = new Set(prev);
//       if (c.has(id)) c.delete(id);
//       else c.add(id);
//       return c;
//     });
//   }

//   function handleSaved(row: DummyUserRow) {
//     const isEdit = allRows.some((r) => r._id === row._id);
//     setAllRows((prev) => {
//       const exists = prev.some((r) => r._id === row._id);
//       return exists ? prev.map((r) => (r._id === row._id ? row : r)) : [row, ...prev];
//     });
//     adminNotify.success(isEdit ? "Updated." : "Added.");
//   }

//   function toggleSuspend(id: string, disable: boolean) {
//     setAllRows((prev) => prev.map((r) => (r._id === id ? { ...r, isDisabled: disable } : r)));
//     adminNotify.success(disable ? "Set to inactive." : "Activated.");
//   }

//   function deleteRow(id: string) {
//     if (!window.confirm(`Delete this ${config.title.toLowerCase()}? They can be restored later.`)) return;
//     setAllRows((prev) => prev.map((r) => (r._id === id ? { ...r, status: "deleted", isDisabled: true } : r)));
//     setSelectedRows((prev) => {
//       const c = new Set(prev);
//       c.delete(id);
//       return c;
//     });
//     adminNotify.success("Deleted.");
//   }

//   function reviveRow(id: string) {
//     setAllRows((prev) => prev.map((r) => (r._id === id ? { ...r, status: undefined, isDisabled: false } : r)));
//     adminNotify.success("Restored.");
//   }

//   const openAdd = () => {
//     setEditingRow(null);
//     setShowForm(true);
//   };

//   const openEdit = (row: DummyUserRow) => {
//     setEditingRow(row);
//     setShowForm(true);
//   };

//   const handleFormCancel = () => {
//     setEditingRow(null);
//     setShowForm(false);
//   };

//   const handleFormSaved = (saved: DummyUserRow) => {
//     handleSaved(saved);
//     setEditingRow(null);
//     setShowForm(false);
//   };

//   function renderCell(row: DummyUserRow, key: string) {
//     switch (key) {
//       case "name":
//         return (
//           <td key={key} className={`${tdClass} text-center font-medium`}>
//             <button type="button" onClick={() => openEdit(row)} className="cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-blue-700 hover:underline">
//               {row.name}
//             </button>
//           </td>
//         );
//       case "email":
//         return (
//           <td key={key} className={tdClass}>
//             {row.email}
//           </td>
//         );
//       case "phone":
//         return (
//           <td key={key} className={tdClass}>
//             {row.phone}
//           </td>
//         );
//       case "primary":
//         return <td key={key} className={tdClass}>{row.primaryLabel}</td>;
//       case "city":
//         return <td key={key} className={tdClass}>{row.city}</td>;
//       case "address":
//         return (
//           <td key={key} className={`${tdClass} max-w-[180px] truncate`} title={row.address}>
//             {row.address || "-"}
//           </td>
//         );
//       case "region":
//         return <td key={key} className={tdClass}>{row.region ?? "-"}</td>;
//       case "websiteUrl":
//         return (
//           <td key={key} className={tdClass}>
//             {row.websiteUrl ? (
//               <a
//                 href={row.websiteUrl}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-blue-700 hover:underline"
//               >
//                 {formatWebsiteUrl(row.websiteUrl)}
//               </a>
//             ) : (
//               "-"
//             )}
//           </td>
//         );
//       case "image":
//         return (
//           <td key={key} className={`${tdClass} text-center`}>
//             {row.imageUrl ? (
//               <ClipImageHover
//                 imageUrl={row.imageUrl}
//                 alt={`Image for ${row.name}`}
//                 size={20}
//                 iconClassName="text-ad-purple"
//               />
//             ) : (
//               <span className="text-gray-500">--</span>
//             )}
//           </td>
//         );
//       case "date":
//         return <td key={key} className={tdClass}>{fmtDate(row.createdAt)}</td>;
//       case "countA":
//         return (
//           <td key={key} className={tdClass}>
//             <button type="button" onClick={() => setCountAFor(row)} className={linkClass}>
//               {row.countA}
//             </button>
//           </td>
//         );
//       case "countB":
//         return (
//           <td key={key} className={tdClass}>
//             <button type="button" onClick={() => setCountBFor(row)} className={linkClass}>
//               {row.countB}
//             </button>
//           </td>
//         );
//       case "status":
//         return (
//           <td key={key} className={tdClass}>
//             <span
//               style={{
//                 ...getStatusColors(getStatus(row)),
//                 display: "inline-block",
//                 padding: "2px 10px",
//                 borderRadius: 3,
//                 fontSize: 12,
//                 fontWeight: 600,
//               }}
//             >
//               {getStatus(row)}
//             </span>
//           </td>
//         );
//       default:
//         return (
//           <td key={key} className={tdClass}>
//             -
//           </td>
//         );
//     }
//   }

//   const toolbarBtnClass = (disabled = false) =>
//     `px-3 py-1 text-xs font-medium text-white whitespace-nowrap ${disabled ? "bg-gray-400 cursor-not-allowed" : "bg-gray-600 hover:bg-gray-700"}`;

//   const visibleColumns = config.columns.filter((c) =>
//     viewMode === "active" ? visibleCols.includes(c.key) : config.defaultVisible.includes(c.key)
//   );

//   return (
//     <>
//       {countAFor && (
//         <CountModal row={countAFor} label={config.countALabel} count={countAFor.countA} onClose={() => setCountAFor(null)} />
//       )}
//       {countBFor && (
//         <CountModal row={countBFor} label={config.countBLabel} count={countBFor.countB} onClose={() => setCountBFor(null)} />
//       )}
//       <AdminPage
//         title={viewMode === "deleted" ? config.deletedTitle : config.title}
//         headerAction={
//           viewMode === "active" && !showForm ? (
//             <AddNewButton onClick={openAdd} />
//           ) : undefined
//         }
//         between={
//           showForm ? (
//             <DummyUserAddEditForm
//               key={editingRow?._id ?? "new"}
//               row={editingRow}
//               config={config}
//               onCancel={handleFormCancel}
//               onSaved={handleFormSaved}
//             />
//           ) : undefined
//         }
//       >
//         {viewMode === "deleted" && (
//           <div className="mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
//             Showing deleted {config.title.toLowerCase()} ({deletedRows.length}) — select one and use Restore
//           </div>
//         )}

//         <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
//           <div className="flex flex-wrap gap-1">
//             {viewMode === "active" && (
//               <>
//                 <button
//                   type="button"
//                   disabled={selCount === 0}
//                   onClick={() => adminNotify.success("Notification sent (demo).")}
//                   className={toolbarBtnClass(selCount === 0)}
//                 >
//                   Send Notification
//                 </button>
//                 <button type="button" disabled={selCount === 0} className="bg-[#25d366] px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
//                   WhatsApp
//                 </button>
//                 <button
//                   type="button"
//                   disabled={selCount === 0}
//                   onClick={() =>
//                     exportCsv(
//                       allRows.filter((r) => selectedRows.has(r._id)),
//                       config,
//                       visibleCols
//                     )
//                   }
//                   className={toolbarBtnClass(selCount === 0)}
//                 >
//                   Export
//                 </button>
//                 <button type="button" disabled={selCount === 0} onClick={() => deleteRow(selected[0])} className={toolbarBtnClass(selCount === 0)}>
//                   Delete
//                 </button>
//               </>
//             )}
//             {viewMode === "deleted" && (
//               <button type="button" disabled={selCount === 0} onClick={() => reviveRow(selected[0])} className={toolbarBtnClass(selCount === 0)}>
//                 Restore
//               </button>
//             )}
//           </div>
//           <div className="flex flex-wrap items-center gap-2">
//             <input
//               type="text"
//               value={search}
//               onChange={(e) => {
//                 setSearch(e.target.value);
//                 setCurrentPage(1);
//               }}
//               placeholder="Live Search here"
//               className="border border-gray-400 bg-white px-2 py-1 text-xs"
//             />
//             {selCount > 0 && <span className="text-xs font-semibold text-gray-600">{selCount} selected</span>}
//             {viewMode === "active" && <ColSelector columns={config.columns} visible={visibleCols} onChange={setVisibleCols} />}
//             <button type="button" className="bg-gray-500 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600">
//               Search
//             </button>
//           </div>
//         </div>

//         <div className="mb-2 flex items-center gap-2 text-xs text-gray-700">
//           <span>Show</span>
//           <select
//             value={pageSize}
//             onChange={(e) => {
//               setPageSize(Number(e.target.value));
//               setCurrentPage(1);
//             }}
//             className="border border-gray-400 px-1 py-0.5"
//           >
//             {[10, 25, 50, 100].map((n) => (
//               <option key={n} value={n}>
//                 {n}
//               </option>
//             ))}
//           </select>
//           <span>entries</span>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full border-collapse text-sm whitespace-nowrap">
//             <thead>
//               <tr className="bg-ad-purple text-white">
//                 <th className="border border-ad-purple-dark px-2 py-2 text-center">
//                   <input
//                     type="checkbox"
//                     checked={allPageSel}
//                     onChange={(e) => {
//                       setSelectedRows((prev) => {
//                         const c = new Set(prev);
//                         paginated.forEach((r) => (e.target.checked ? c.add(r._id) : c.delete(r._id)));
//                         return c;
//                       });
//                     }}
//                     className="accent-white"
//                   />
//                 </th>
//                 {visibleColumns.map((c) => (
//                   <th key={c.key} className={thClass}>
//                     {c.label}
//                   </th>
//                 ))}
//                 {viewMode === "active" && <th className={thClass}>Action</th>}
//                 {viewMode === "deleted" && <th className={thClass}>Restore</th>}
//               </tr>
//             </thead>
//             <tbody>
//               {paginated.length === 0 ? (
//                 <tr>
//                   <td colSpan={visibleColumns.length + 2} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
//                     {viewMode === "deleted" ? `No deleted ${config.title.toLowerCase()}.` : `No ${config.title.toLowerCase()} found.`}
//                   </td>
//                 </tr>
//               ) : (
//                 paginated.map((row, idx) => {
//                   const isSuspended = !!row.isDisabled;
//                   return (
//                     <tr key={row._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
//                       <td className="border border-gray-300 px-2 py-2 text-center">
//                         <input
//                           type="checkbox"
//                           checked={selectedRows.has(row._id)}
//                           onChange={() => toggleRow(row._id)}
//                           className="accent-ad-purple"
//                         />
//                       </td>
//                       {visibleColumns.map((c) => renderCell(row, c.key))}
//                       {viewMode === "active" && (
//                         <td className={`${tdClass} text-center whitespace-nowrap`}>
//                           <div className="flex items-center gap-1">
//                             <button
//                               type="button"
//                               onClick={() => toggleSuspend(row._id, !isSuspended)}
//                               className="rounded px-2 py-0.5 text-xs font-semibold"
//                               style={{
//                                 background: isSuspended ? "#dff0d8" : "#fcf8e3",
//                                 color: isSuspended ? "#3c763d" : "#8a6d3b",
//                               }}
//                             >
//                               {isSuspended ? "Enable" : "Suspend"}
//                             </button>
//                             <button
//                               type="button"
//                               onClick={() => deleteRow(row._id)}
//                               className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800"
//                             >
//                               Delete
//                             </button>
//                           </div>
//                         </td>
//                       )}
//                       {viewMode === "deleted" && (
//                         <td className={tdClass}>
//                           <button
//                             type="button"
//                             onClick={() => reviveRow(row._id)}
//                             className="rounded bg-ad-green px-2 py-0.5 text-xs font-semibold text-white"
//                           >
//                             Restore
//                           </button>
//                         </td>
//                       )}
//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>

//         <div className="mt-4 flex items-center justify-between">
//           <div className="flex gap-1">
//             {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
//               <button
//                 key={p}
//                 type="button"
//                 onClick={() => setCurrentPage(p)}
//                 className={`h-7 w-7 border text-xs font-medium ${
//                   currentPage === p ? "border-ad-green bg-ad-green text-white" : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
//                 }`}
//               >
//                 {p}
//               </button>
//             ))}
//           </div>
//           <button
//             type="button"
//             onClick={() => {
//               setViewMode((v) => (v === "active" ? "deleted" : "active"));
//               setSelectedRows(new Set());
//               setSearch("");
//               setCurrentPage(1);
//             }}
//             className="text-sm text-blue-700 hover:underline"
//           >
//             {viewMode === "active" ? "Deleted" : `Active ${config.title}`}
//           </button>
//         </div>
//       </AdminPage>
//     </>
//   );
// }


// export default function Dealers() {
//   return <DummyUserListPage config={DEALERS_CONFIG} />;
// }


import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import AdminSearchCard, {
  emptyAdminSearchValues,
  searchEquals,
  searchIncludes,
  type AdminSearchField,
  type AdminSearchValues,
} from "../../../components/admin/AdminSearchCard";
import ClipImageHover from "../../../components/admin/ClipImageHover";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import { useAdminCityOptions, withSelectedCity } from "../../../hooks/useAdminCityOptions";
import { adminNotify } from "../../../utils/adminNotify";
import {
  createDealer,
  deleteDealer,
  fetchDealers,
  mapDealerToRow,
  updateDealer,
} from "./dealersapi";

export type DummyUserRow = {
  _id: string;
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  pincode: string;
  address?: string;
  city: string;
  createdAt: string;
  isDisabled: boolean;
  status?: string;
  primaryLabel: string;
  region?: string;
  websiteUrl?: string;
  imageUrl?: string;
  countA: number;
  countB: number;
};

type ColumnDef = { key: string; label: string };

// Optional API adapter. When present, DummyUserListPage talks to a real
// backend instead of using config.initialData as in-memory state.
export type DummyUserListApi = {
  list: (params: { search: string; viewMode: "active" | "deleted" }) => Promise<DummyUserRow[]>;
  create: (form: DummyUserFormValues) => Promise<DummyUserRow>;
  update: (id: string, form: Partial<DummyUserFormValues>) => Promise<DummyUserRow>;
  remove: (id: string) => Promise<void>;
};

export type DummyUserFormValues = {
  name: string;
  email: string;
  phone: string;
  city: string;
  address?: string;
  primaryLabel: string;
  region?: string;
  websiteUrl?: string;
  imageFile?: File | null;
  removeImage?: boolean;
  status?: string;
};

export type DummyUserListConfig = {
  title: string;
  deletedTitle: string;
  addLabel: string;
  roleLabel: string;
  primaryFieldLabel: string;
  regionFieldLabel: string;
  imageFieldLabel?: string;
  fieldMode?: "location" | "web";
  /** Show address field even in web mode (e.g. Dealers). */
  showAddress?: boolean;
  countALabel: string;
  countBLabel: string;
  columns: ColumnDef[];
  defaultVisible: string[];
  initialData: DummyUserRow[];
  exportFilePrefix: string;
  api?: DummyUserListApi;
};

const tdClass = "border border-gray-300 px-3 py-2 text-center text-sm text-gray-700";
const thClass = "border border-ad-purple-dark px-3 py-2 text-center font-medium whitespace-nowrap";
const linkClass = "text-blue-700 hover:underline bg-transparent border-0 p-0 text-sm cursor-pointer font-medium";

const GREEN_CARD: React.CSSProperties = {
  background: "#d4f5c4",
  border: "1px solid #b2e0a0",
  borderRadius: 14,
  padding: "18px 22px",
  marginBottom: 18,
  boxShadow: "3px 4px 0 #c0d8b0",
};
const GC_LABEL: React.CSSProperties = { color: "#555", fontWeight: 600, fontSize: 13, minWidth: 120 };
const GC_VAL: React.CSSProperties = { color: "#222", fontSize: 13 };

function GCRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 5 }}>
      <span style={GC_LABEL}>{label}</span>
      <span style={{ color: "#888", marginRight: 4 }}>:</span>
      <span style={GC_VAL}>{value ?? "-"}</span>
    </div>
  );
}

function fmtDate(d?: string): string {
  if (!d) return "-";
  return new Date(d).toISOString().slice(0, 10);
}

function getStatus(row: DummyUserRow): string {
  const status = String(row.status ?? "").toLowerCase();
  if (status === "deleted" || Boolean((row as any).isDeleted) || Boolean((row as any).deleted)) return "Deleted";
  if (row.isDisabled) return "Suspended";
  return "Active";
}

function getStatusColors(s: string): React.CSSProperties {
  if (s === "Active") return { background: "#dff0d8", color: "#3c763d", border: "1px solid #d6e9c6" };
  if (s === "Suspended") return { background: "#fcf8e3", color: "#8a6d3b", border: "1px solid #faebcc" };
  if (s === "Deleted") return { background: "#f2dede", color: "#a94442", border: "1px solid #ebccd1" };
  return { background: "#f2dede", color: "#a94442", border: "1px solid #ebccd1" };
}

const BaseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}> = ({ isOpen, onClose, title, children, wide }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-black/45 p-[30px_10px]">
      <div
        className="flex flex-col rounded bg-white shadow-[0_5px_24px_rgba(0,0,0,.35)]"
        style={{ width: wide ? "min(860px,96vw)" : "min(720px,95vw)" }}
      >
        <div className="flex shrink-0 items-center justify-between rounded-t bg-[#9b308d] px-[18px] py-[11px] text-white">
          <span className="text-[15px] font-bold">{title}</span>
          <button type="button" onClick={onClose} className="cursor-pointer border-0 bg-transparent text-[22px] leading-none text-white">
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-[20px_22px]">{children}</div>
      </div>
    </div>
  );
};

const CountModal: React.FC<{
  row: DummyUserRow;
  label: string;
  count: number;
  onClose: () => void;
}> = ({ row, label, count, onClose }) => (
  <BaseModal isOpen onClose={onClose} title={`${label} — ${row.name}`} wide>
    {count === 0 ? (
      <p className="text-center text-gray-400">No records found.</p>
    ) : (
      Array.from({ length: count }, (_, i) => (
        <div key={i} style={GREEN_CARD}>
          <GCRow label={`${label} #`} value={i + 1} />
          <GCRow label="Status" value="Active" />
        </div>
      ))
    )}
  </BaseModal>
);

function isEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

function isWebsiteUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    return !!parsed.hostname;
  } catch {
    return false;
  }
}

function formatWebsiteUrl(url?: string) {
  if (!url?.trim()) return "-";
  return url.trim().replace(/^https?:\/\//i, "");
}

const NON_SEARCHABLE_COLUMN_KEYS = new Set(["image", "photo", "profilePhoto", "action", "checkbox"]);

function buildDummyUserSearchFields(columns: ColumnDef[]): AdminSearchField[] {
  return columns
    .filter((col) => !NON_SEARCHABLE_COLUMN_KEYS.has(col.key))
    .map((col) => {
      if (col.key === "status") {
        return {
          key: col.key,
          label: col.label,
          type: "select" as const,
          options: [
            { value: "Active", label: "Active" },
            { value: "Suspended", label: "Suspended" },
            { value: "Deleted", label: "Deleted" },
          ],
        };
      }
      if (col.key === "date") {
        return { key: col.key, label: col.label, type: "date" as const };
      }
      return { key: col.key, label: col.label };
    });
}

function dummyUserValueByKey(row: DummyUserRow, key: string): string {
  switch (key) {
    case "name":
      return row.name;
    case "email":
      return row.email;
    case "phone":
      return row.phone;
    case "primary":
      return row.primaryLabel;
    case "city":
      return row.city;
    case "address":
      return row.address ?? "";
    case "region":
      return row.region ?? "";
    case "websiteUrl":
      return formatWebsiteUrl(row.websiteUrl);
    case "date":
      return fmtDate(row.createdAt);
    case "countA":
      return String(row.countA);
    case "countB":
      return String(row.countB);
    case "status":
      return getStatus(row);
    // "categories" removed
    default:
      return String((row as Record<string, unknown>)[key] ?? "");
  }
}

function matchesDummyUserSearchFilters(row: DummyUserRow, filters: AdminSearchValues, fields: AdminSearchField[]) {
  return fields.every((field) => {
    if (field.type === "range") return true;
    const needle = filters[field.key] ?? "";
    if (!needle.trim()) return true;
    const value = dummyUserValueByKey(row, field.key);
    return field.key === "status" ? searchEquals(value, needle) : searchIncludes(value, needle);
  });
}

const DummyUserAddEditForm: React.FC<{
  row?: DummyUserRow | null;
  config: DummyUserListConfig;
  onCancel: () => void;
  onSaved: (form: DummyUserFormValues, existingId?: string) => void;
  saving?: boolean;
}> = ({ row, config, onCancel, onSaved, saving }) => {
  const isEdit = !!row;
  const isWebMode = config.fieldMode === "web";
  const showAddress = !isWebMode || Boolean(config.showAddress);
  // Removed all categoryOptions code
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [primaryLabel, setPrimaryLabel] = useState("");
  const [region, setRegion] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [attachImage, setAttachImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  // const [ setImagePreviewUrl] = useState("");
  const [attempted, setAttempted] = useState(false);
  const cityOptions = useAdminCityOptions();
  const citySelectOptions = withSelectedCity(cityOptions, city);

  useEffect(() => {
    setAttempted(false);
    if (isEdit && row) {
      setName(row.name);
      setEmail(row.email);
      setPhone(row.phone);
      setAddress(row.address ?? "");
      setCity(row.city);
      setPrimaryLabel(row.primaryLabel);
      setRegion(row.region ?? "");
      setWebsiteUrl(row.websiteUrl ?? "");
      setAttachImage(Boolean(row.imageUrl));
      setImageFile(null);
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setCity("");
      setPrimaryLabel("");
      setRegion("");
      setWebsiteUrl("");
      setAttachImage(false);
      setImageFile(null);
    }
  }, [isEdit, row]);

  const isValid =
    name.trim() &&
    isEmail(email) &&
    phone.replace(/\D/g, "").length === 10 &&
    primaryLabel.trim() &&
    (isWebMode ? isWebsiteUrl(websiteUrl) : address.trim() && region.trim());

  const handleImageFileChange = (file: File | null) => {
    if (!file) {
      setImageFile(null);

      return;
    }
    if (!file.type.startsWith("image/")) {
      adminNotify.error("Please select an image file.");
      return;
    }
    setImageFile(file);

  };

  const handleSave = () => {
    setAttempted(true);
    if (!isValid) {
      adminNotify.error("Please fill all required fields.");
      return;
    }
    const normalizedWebsiteUrl = websiteUrl.trim()
      ? websiteUrl.trim().startsWith("http")
        ? websiteUrl.trim()
        : `https://${websiteUrl.trim()}`
      : undefined;

    onSaved(
      {
        name: name.trim(),
        email: email.trim(),
        phone: phone.replace(/\D/g, ""),
        address: showAddress ? address.trim() : undefined,
        city: city.trim() || "Toronto",
        primaryLabel: primaryLabel.trim(),
        region: isWebMode ? undefined : region.trim(),
        websiteUrl: isWebMode ? normalizedWebsiteUrl : undefined,
        imageFile: isWebMode && attachImage ? imageFile : undefined,
        removeImage: isWebMode && !attachImage && isEdit && Boolean(row?.imageUrl),
      },
      row?._id
    );
  };

  const formMessage = isEdit ? `You are updating a '${config.title}'` : `You are creating a '${config.title}'`;

  return (
    <CompactFormPanel
      footer={
        <CompactFormFooter
          message={formMessage}
          messageCenter
          actionLabel={saving ? "Saving…" : isEdit ? "Update" : "Save"}
          onSave={saving ? () => {} : handleSave}
          onCancel={onCancel}
        />
      }
    >
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 items-start sm:grid-cols-5">
        <CompactField label="Full Name" required className="min-w-0">
          <input type="text" value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} className={compactInputClass} />
        </CompactField>
        <CompactField label="Email" required className="min-w-0">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={compactInputClass} />
        </CompactField>
        <CompactField label="Phone" required className="min-w-0">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            className={compactInputClass}
          />
        </CompactField>
        <CompactField label={config.primaryFieldLabel} required className="min-w-0">
          <input type="text" value={primaryLabel} onChange={(e) => setPrimaryLabel(e.target.value)} className={compactInputClass} />
        </CompactField>
        <CompactField label="City" className="min-w-0">
          <select value={city} onChange={(e) => setCity(e.target.value)} className={compactInputClass}>
            <option value="">Select city</option>
            {citySelectOptions.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
        </CompactField>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 items-start sm:grid-cols-5">
        {showAddress && (
          <CompactField label="Address" required={!isWebMode} className="min-w-0">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value.slice(0, 200))}
              placeholder="Street / Area"
              className={compactInputClass}
            />
          </CompactField>
        )}
        {isWebMode ? (
          <CompactField label={config.regionFieldLabel} required className="min-w-0">
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value.slice(0, 120))}
              placeholder="https://example.com"
              className={compactInputClass}
            />
          </CompactField>
        ) : (
          <CompactField label={config.regionFieldLabel} required className="min-w-0">
            <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} className={compactInputClass} />
          </CompactField>
        )}
        {isWebMode && (
          <AttachImageCheckbox
            label={config.imageFieldLabel ?? "Attach Image"}
            checked={attachImage}
            onCheckedChange={(checked) => {
              setAttachImage(checked);
              if (!checked) {
                setImageFile(null);
              }
            }}
            file={imageFile}
            onFileChange={handleImageFileChange}
            className="min-w-0 sm:col-start-5"
          />
        )}
      </div>
      {attempted && !isValid && <p className="text-xs font-semibold text-red-700">Please fill all required fields correctly.</p>}
    </CompactFormPanel>
  );
};

const ColSelector: React.FC<{ columns: ColumnDef[]; visible: string[]; onChange: (v: string[]) => void }> = ({
  columns,
  visible,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = (key: string) => onChange(visible.includes(key) ? visible.filter((k) => k !== key) : [...visible, key]);
  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-1 border-0 bg-gray-600 px-3.5 py-1.5 text-[13px] font-semibold text-white"
      >
        Select Heading <span className="text-[10px]">▼</span>
      </button>
      {open && (
        <div className="absolute right-0 top-[110%] z-[200] min-w-[170px] rounded border border-gray-300 bg-white py-1.5 shadow-md">
          {columns.map((col) => (
            <label key={col.key} className="flex cursor-pointer items-center gap-2 px-3.5 py-1.5 text-[13px] text-gray-800 select-none">
              <input type="checkbox" checked={visible.includes(col.key)} onChange={() => toggle(col.key)} className="h-3.5 w-3.5 cursor-pointer accent-[#0073b7]" />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

function exportCsv(rows: DummyUserRow[], config: DummyUserListConfig, visibleCols: string[]) {
  const colMap: Record<string, (r: DummyUserRow) => string> = {
    name: (r) => r.name,
    email: (r) => r.email,
    phone: (r) => r.phone,
    primary: (r) => r.primaryLabel,
    city: (r) => r.city,
    address: (r) => r.address ?? "-",
    region: (r) => r.region ?? "-",
    websiteUrl: (r) => formatWebsiteUrl(r.websiteUrl),
    image: (r) => (r.imageUrl ? "Yes" : "-"),
    date: (r) => fmtDate(r.createdAt),
    countA: (r) => String(r.countA),
    countB: (r) => String(r.countB),
    status: (r) => getStatus(r),
    // "categories" removed
  };
  const cols = config.columns.filter((c) => visibleCols.includes(c.key));
  const esc = (v: string) => (/[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const header = cols.map((c) => esc(c.label)).join(",");
  const body = rows.map((r) => cols.map((c) => esc(colMap[c.key]?.(r) ?? "-")).join(",")).join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${config.exportFilePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

type DummyUserListPageProps = {
  config: DummyUserListConfig;
};

function DummyUserListPage({ config }: DummyUserListPageProps) {
  const hasApi = Boolean(config.api);
  const [allRows, setAllRows] = useState<DummyUserRow[]>(hasApi ? [] : config.initialData);
  const [loading, setLoading] = useState(hasApi);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const searchFields = useMemo(() => buildDummyUserSearchFields(config.columns), [config.columns]);
  const [showSearchCard, setShowSearchCard] = useState(false);
  const [searchDraft, setSearchDraft] = useState(() => emptyAdminSearchValues(buildDummyUserSearchFields(config.columns)));
  const [searchFilters, setSearchFilters] = useState(() => emptyAdminSearchValues(buildDummyUserSearchFields(config.columns)));
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols] = useState<string[]>(config.defaultVisible);
  const [viewMode, setViewMode] = useState<"active" | "deleted">("active");

  const [countAFor, setCountAFor] = useState<DummyUserRow | null>(null);
  const [countBFor, setCountBFor] = useState<DummyUserRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<DummyUserRow | null>(null);

  const loadRows = useCallback(async () => {
    if (!config.api) return;
    setLoading(true);
    try {
      const rows = await config.api.list({ search, viewMode });
      setAllRows(rows);
    } catch (err: any) {
      adminNotify.error(err?.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [config.api, search, viewMode]);

  useEffect(() => {
    if (hasApi) loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasApi, viewMode]);

  // debounce search when API-backed
  useEffect(() => {
    if (!hasApi) return;
    const t = setTimeout(() => {
      setCurrentPage(1);
      loadRows();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const isRowDeleted = (r: DummyUserRow): boolean => {
    const status = String(r.status ?? "").toLowerCase();
    return status === "deleted" || Boolean((r as any).isDeleted) || Boolean((r as any).deleted);
  };
  const activeRowsLocal = allRows.filter((r) => !isRowDeleted(r));
  const deletedRowsLocal = allRows.filter((r) => isRowDeleted(r));
  // When API-backed, the server already filters by viewMode; otherwise filter client-side.
  const displayRows = hasApi ? allRows : viewMode === "deleted" ? deletedRowsLocal : activeRowsLocal;
  const deletedCount = hasApi ? allRows.length : deletedRowsLocal.length;

  const filtered = (hasApi
    ? displayRows
    : displayRows.filter((r) => {
        const q = search.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          r.primaryLabel.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q) ||
          (r.address ?? "").toLowerCase().includes(q) ||
          (r.region ?? "").toLowerCase().includes(q) ||
          (r.websiteUrl ?? "").toLowerCase().includes(q)
        );
      })
  ).filter((r) => matchesDummyUserSearchFilters(r, searchFilters, searchFields));

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = Array.from(selectedRows);
  const selCount = selected.length;
  const allPageSel = paginated.length > 0 && paginated.every((r) => selectedRows.has(r._id));

  function toggleRow(id: string) {
    setSelectedRows((prev) => {
      const c = new Set(prev);
      if (c.has(id)) c.delete(id);
      else c.add(id);
      return c;
    });
  }

  async function handleFormSaved(form: DummyUserFormValues, existingId?: string) {
    if (!config.api) {
      // fallback: local-only mode (no backend configured)
      const row: DummyUserRow = {
        _id: existingId ?? `dummy-${Date.now()}`,
        name: form.name,
        email: form.email,
        countryCode: "",
        phone: form.phone,
        pincode: "",
        address: form.address,
        city: form.city,
        createdAt: existingId ? allRows.find((r) => r._id === existingId)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
        isDisabled: existingId ? allRows.find((r) => r._id === existingId)?.isDisabled ?? false : false,
        status: existingId ? allRows.find((r) => r._id === existingId)?.status : undefined,
        primaryLabel: form.primaryLabel,
        region: form.region,
        websiteUrl: form.websiteUrl,
        imageUrl: form.imageFile ? URL.createObjectURL(form.imageFile) : existingId ? allRows.find((r) => r._id === existingId)?.imageUrl : undefined,
        countA: existingId ? allRows.find((r) => r._id === existingId)?.countA ?? 0 : 0,
        countB: existingId ? allRows.find((r) => r._id === existingId)?.countB ?? 0 : 0,
      };
      setAllRows((prev) => (existingId ? prev.map((r) => (r._id === existingId ? row : r)) : [row, ...prev]));
      adminNotify.success(existingId ? "Updated." : "Added.");
      setEditingRow(null);
      setShowForm(false);
      return;
    }

    setSaving(true);
    try {
      if (existingId) {
        await config.api.update(existingId, form);
        adminNotify.success("Updated.");
      } else {
        await config.api.create(form);
        adminNotify.success("Added.");
      }
      setEditingRow(null);
      setShowForm(false);
      await loadRows();
    } catch (err: any) {
      adminNotify.error(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSuspend(id: string, disable: boolean) {
    if (!config.api) {
      setAllRows((prev) => prev.map((r) => (r._id === id ? { ...r, isDisabled: disable } : r)));
      adminNotify.success(disable ? "Set to inactive." : "Activated.");
      return;
    }
    try {
      await config.api.update(id, { status: disable ? "Suspended" : "Active" } as Partial<DummyUserFormValues>);
      adminNotify.success(disable ? "Set to inactive." : "Activated.");
      await loadRows();
    } catch (err: any) {
      adminNotify.error(err?.message || "Update failed.");
    }
  }

  async function deleteRow(id: string) {
    if (!window.confirm(`Delete this ${config.title.toLowerCase()}? They can be restored later.`)) return;
    if (!config.api) {
      setAllRows((prev) => prev.map((r) => (r._id === id ? { ...r, status: "deleted", isDisabled: true } : r)));
      setSelectedRows((prev) => {
        const c = new Set(prev);
        c.delete(id);
        return c;
      });
      adminNotify.success("Deleted.");
      return;
    }
    try {
      await config.api.remove(id);
      setSelectedRows((prev) => {
        const c = new Set(prev);
        c.delete(id);
        return c;
      });
      adminNotify.success("Deleted.");
      await loadRows();
    } catch (err: any) {
      adminNotify.error(err?.message || "Delete failed.");
    }
  }

  async function reviveRow(id: string) {
    if (!config.api) {
      setAllRows((prev) => prev.map((r) => (r._id === id ? { ...r, status: undefined, isDisabled: false } : r)));
      adminNotify.success("Restored.");
      return;
    }
    try {
      await config.api.update(id, { status: "Active" } as Partial<DummyUserFormValues>);
      adminNotify.success("Restored.");
      await loadRows();
    } catch (err: any) {
      adminNotify.error(err?.message || "Restore failed.");
    }
  }

  const openAdd = () => {
    setEditingRow(null);
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openEdit = (row: DummyUserRow) => {
    setEditingRow(row);
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openSearchCard = () => {
    setShowForm(false);
    setEditingRow(null);
    setSearchDraft({ ...searchFilters });
    setShowSearchCard((open) => !open);
  };

  const handleSearchCardSearch = () => {
    setSearchFilters({ ...searchDraft });
    setCurrentPage(1);
    setSelectedRows(new Set());
    if (hasApi) void loadRows();
  };

  const handleSearchCardReset = () => {
    const empty = emptyAdminSearchValues(searchFields);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setCurrentPage(1);
    setSelectedRows(new Set());
  };

  const handleFormCancel = () => {
    setEditingRow(null);
    setShowForm(false);
  };

  function renderCell(row: DummyUserRow, key: string) {
    switch (key) {
      case "name":
        return (
          <td key={key} className={`${tdClass} text-center font-medium`}>
            <button type="button" onClick={() => openEdit(row)} className="cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-blue-700 hover:underline">
              {row.name}
            </button>
          </td>
        );
      case "email":
        return <td key={key} className={tdClass}>{row.email}</td>;
      case "phone":
        return <td key={key} className={tdClass}>{row.phone}</td>;
      case "primary":
        return <td key={key} className={tdClass}>{row.primaryLabel}</td>;
      case "city":
        return <td key={key} className={tdClass}>{row.city}</td>;
      case "address":
        return (
          <td key={key} className={`${tdClass} whitespace-normal break-words text-left align-top min-w-[240px]`}>
            {row.address || "-"}
          </td>
        );
      // Remove categories cell rendering
      case "region":
        return <td key={key} className={tdClass}>{row.region ?? "-"}</td>;
      case "websiteUrl":
        return (
          <td key={key} className={tdClass}>
            {row.websiteUrl ? (
              <a href={row.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                {formatWebsiteUrl(row.websiteUrl)}
              </a>
            ) : (
              "-"
            )}
          </td>
        );
      case "image":
        return (
          <td key={key} className={`${tdClass} text-center`}>
            {row.imageUrl ? (
              <ClipImageHover imageUrl={row.imageUrl} alt={`Image for ${row.name}`} size={20} iconClassName="text-ad-purple" />
            ) : (
              <span className="text-gray-500">--</span>
            )}
          </td>
        );
      case "date":
        return <td key={key} className={tdClass}>{fmtDate(row.createdAt)}</td>;
      case "countA":
        return (
          <td key={key} className={tdClass}>
            <button type="button" onClick={() => setCountAFor(row)} className={linkClass}>
              {row.countA}
            </button>
          </td>
        );
      case "countB":
        return (
          <td key={key} className={tdClass}>
            <button type="button" onClick={() => setCountBFor(row)} className={linkClass}>
              {row.countB}
            </button>
          </td>
        );
      case "status":
        return (
          <td key={key} className={tdClass}>
            <span
              style={{
                ...getStatusColors(getStatus(row)),
                display: "inline-block",
                padding: "2px 10px",
                borderRadius: 3,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {getStatus(row)}
            </span>
          </td>
        );
      default:
        return <td key={key} className={tdClass}>-</td>;
    }
  }

  const toolbarBtnClass = (disabled = false) =>
    `px-3 py-1 text-xs font-medium text-white whitespace-nowrap ${disabled ? "bg-gray-400 cursor-not-allowed" : "bg-gray-600 hover:bg-gray-700"}`;

  // Strip "categories" columns from lists
  const visibleColumns = config.columns.filter(
    (c) => (viewMode === "active" ? visibleCols.includes(c.key) : config.defaultVisible.includes(c.key)) && c.key !== "categories"
  );

  return (
    <>
      {countAFor && <CountModal row={countAFor} label={config.countALabel} count={countAFor.countA} onClose={() => setCountAFor(null)} />}
      {countBFor && <CountModal row={countBFor} label={config.countBLabel} count={countBFor.countB} onClose={() => setCountBFor(null)} />}
      <AdminPage
        title={viewMode === "deleted" ? config.deletedTitle : config.title}
        headerAction={viewMode === "active" && !showForm && !showSearchCard ? <AddNewButton onClick={openAdd} /> : undefined}
        between={
          showSearchCard ? (
            <AdminSearchCard
              fields={searchFields}
              values={searchDraft}
              onChange={setSearchDraft}
              onSearch={handleSearchCardSearch}
              onReset={handleSearchCardReset}
              onClose={() => setShowSearchCard(false)}
            />
          ) : showForm ? (
            <DummyUserAddEditForm
              key={editingRow?._id ?? "new"}
              row={editingRow}
              config={config}
              onCancel={handleFormCancel}
              onSaved={handleFormSaved}
              saving={saving}
            />
          ) : undefined
        }
      >
        {viewMode === "deleted" && (
          <div className="mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            Showing deleted {config.title.toLowerCase()} ({deletedCount}) — select one and use Restore
          </div>
        )}

        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {viewMode === "active" && (
              <>
                <button type="button" disabled={selCount === 0} onClick={() => adminNotify.success("Notification sent (demo).")} className={toolbarBtnClass(selCount === 0)}>
                  Send Notification
                </button>
                <button type="button" disabled={selCount === 0} className="bg-[#25d366] px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                  WhatsApp
                </button>
                <button
                  type="button"
                  disabled={selCount === 0}
                  onClick={() => exportCsv(allRows.filter((r) => selectedRows.has(r._id)), config, visibleCols)}
                  className={toolbarBtnClass(selCount === 0)}
                >
                  Export
                </button>
                <button type="button" disabled={selCount === 0} onClick={() => deleteRow(selected[0])} className={toolbarBtnClass(selCount === 0)}>
                  Delete
                </button>
              </>
            )}
            {viewMode === "deleted" && (
              <button type="button" disabled={selCount === 0} onClick={() => reviveRow(selected[0])} className={toolbarBtnClass(selCount === 0)}>
                Restore
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Live Search here"
              className="border border-gray-400 bg-white px-2 py-1 text-xs"
            />
            {selCount > 0 && <span className="text-xs font-semibold text-gray-600">{selCount} selected</span>}
            {viewMode === "active" && <ColSelector columns={config.columns.filter(c=>c.key!=="categories")} visible={visibleCols.filter(k=>k!=="categories")} onChange={setVisibleCols} />}
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
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-400 px-1 py-0.5"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
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
                    checked={allPageSel}
                    onChange={(e) => {
                      setSelectedRows((prev) => {
                        const c = new Set(prev);
                        paginated.forEach((r) => (e.target.checked ? c.add(r._id) : c.delete(r._id)));
                        return c;
                      });
                    }}
                    className="accent-white"
                  />
                </th>
                {visibleColumns.map((c) => (
                  <th key={c.key} className={thClass}>
                    {c.label}
                  </th>
                ))}
                {viewMode === "active" && <th className={thClass}>Action</th>}
                {viewMode === "deleted" && <th className={thClass}>Restore</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                    {viewMode === "deleted" ? `No deleted ${config.title.toLowerCase()}.` : `No ${config.title.toLowerCase()} found.`}
                  </td>
                </tr>
              ) : (
                paginated.map((row, idx) => {
                  const isSuspended = !!row.isDisabled;
                  return (
                    <tr key={row._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                      <td className="border border-gray-300 px-2 py-2 text-center">
                        <input type="checkbox" checked={selectedRows.has(row._id)} onChange={() => toggleRow(row._id)} className="accent-ad-purple" />
                      </td>
                      {visibleColumns.map((c) => renderCell(row, c.key))}
                      {viewMode === "active" && (
                        <td className={`${tdClass} text-center whitespace-nowrap`}>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => toggleSuspend(row._id, !isSuspended)}
                              className="rounded px-2 py-0.5 text-xs font-semibold"
                              style={{
                                background: isSuspended ? "#dff0d8" : "#fcf8e3",
                                color: isSuspended ? "#3c763d" : "#8a6d3b",
                              }}
                            >
                              {isSuspended ? "Enable" : "Suspend"}
                            </button>
                            <button type="button" onClick={() => deleteRow(row._id)} className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                      {viewMode === "deleted" && (
                        <td className={tdClass}>
                          <button type="button" onClick={() => reviveRow(row._id)} className="rounded bg-ad-green px-2 py-0.5 text-xs font-semibold text-white">
                            Restore
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <TableEntriesSummary total={filtered.length} page={currentPage} pageSize={pageSize} />
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`h-7 w-7 border text-xs font-medium ${
                  currentPage === p ? "border-ad-green bg-ad-green text-white" : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setViewMode((v) => (v === "active" ? "deleted" : "active"));
              setSelectedRows(new Set());
              setSearch("");
              const empty = emptyAdminSearchValues(searchFields);
              setSearchDraft(empty);
              setSearchFilters(empty);
              setShowSearchCard(false);
              setCurrentPage(1);
            }}
            className="text-sm text-blue-700 hover:underline"
          >
            {viewMode === "active" ? "Deleted" : `Active ${config.title}`}
          </button>
        </div>
      </AdminPage>
    </>
  );
}

// ---------- Dealers config wired to the live API ----------

const DEALERS_CONFIG: DummyUserListConfig = {
  title: "Dealers",
  deletedTitle: "Deleted Dealers",
  addLabel: "New Dealer",
  roleLabel: "dealer",
  primaryFieldLabel: "Dealership",
  regionFieldLabel: "Website URL",
  imageFieldLabel: "Image",
  fieldMode: "web",
  showAddress: true,
  // categoryOptions removed
  countALabel: "Listings",
  countBLabel: "Leads",
  exportFilePrefix: "dealers",
  columns: [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "primary", label: "Dealership" },
    { key: "city", label: "City" },
    { key: "address", label: "Address" },
    // { key: "categories", label: "Categories" }, // removed
    { key: "websiteUrl", label: "Website URL" },
    { key: "image", label: "Image" },
    { key: "date", label: "Date" },
    { key: "countA", label: "Listings" },
    { key: "countB", label: "Leads" },
    { key: "status", label: "Status" },
  ],
  defaultVisible: [
    "name",
    "email",
    "phone",
    "primary",
    "city",
    "address",
    // "categories", // removed
    "websiteUrl",
    "image",
    "date",
    "countA",
    "countB",
    "status",
  ],
  initialData: [], // unused when `api` is set
  api: {
    list: async ({ search, viewMode }) => {
      const apiRows = await fetchDealers({
        name: search || undefined,
        status: viewMode === "deleted" ? "Deleted" : undefined,
      });
      return apiRows.map(mapDealerToRow);
    },
    create: async (form) => {
      const created = await createDealer({
        name: form.name,
        email: form.email,
        phone: form.phone,
        dealership: form.primaryLabel,
        city: form.city,
        address: form.address,
        // categories: form.categories, // removed
        websiteUrl: form.websiteUrl,
        dealerImage: form.imageFile ?? null,
      });
      return mapDealerToRow(created);
    },
    update: async (id, form) => {
      const updated = await updateDealer(id, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        dealership: form.primaryLabel,
        city: form.city,
        address: form.address,
        // categories: form.categories, // removed
        websiteUrl: form.websiteUrl,
        status: form.status,
        dealerImage: form.imageFile ?? undefined,
      });
      return mapDealerToRow(updated);
    },
    remove: async (id) => {
      await deleteDealer(id);
    },
  },
};

export default function Dealers() {
  return <DummyUserListPage config={DEALERS_CONFIG} />;
}