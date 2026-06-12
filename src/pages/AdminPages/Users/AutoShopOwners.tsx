// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHeader,
//   TableRow,
// } from "../../../components/ui/table";
// import Badge from "../../../components/ui/badge/Badge";

// // ====================
// // Types based on data sample for businessProfile with teamMembers and myDeals
// // (Unchanged Types)
// // ====================

// type SubService = {
//   subService: string;
// };

// type IndividualService = {
//   name: string;
//   desc?: string;
//   price?: number;
//   _id: string;
// };

// type Service = {
//   _id: string;
//   name?: string;
//   desc?: string;
//   services?: IndividualService[];
//   [k: string]: any;
// };

// type MyService = {
//   service: Service;
//   subServices?: SubService[];
//   [k: string]: any;
// };

// type TeamMemberType = {
//   _id: string;
//   name: string;
//   email?: string;
//   phone?: string;
//   designation?: string;
//   photo?: string;
// };

// type BusinessProfileType = {
//   _id: string;
//   businessName?: string;
//   businessAddress?: string;
//   pincode?: string;
//   city?: string;
//   businessPhone?: string;
//   businessEmail?: string;
//   businessHSTNumber?: string;
//   openHours?: string;
//   openDays?: string[];
//   businessLogo?: string;
//   myServices?: MyService[];
//   myDeals?: (string | DealType)[];
//   teamMembers?: TeamMemberType[];
//   businessMapLocation?: any;
//   isOpen?: boolean;
//   rating?: number;
//   reviewCount?: number;
//   reviewDate?: string;
//   websiteUrl?: string;
//   createdAt?: string;
//   updatedAt?: string;
//   [k: string]: any;
// };

// type CustomerType = {
//   _id: string;
//   name?: string;
//   email?: string;
//   phone?: string;
// };

// type DealType = {
//   _id: string;
//   name: string;
//   description?: string;
//   value: string;
//   percentageDiscount: number;
//   dealEnabled: boolean;
//   createdAt?: string;
//   endDate?: string;
//   couponCode?: string;
//   startDate?: string;
//   additionalDetails?: string;
//   valueId?: string;
//   createdBy?: string;
//   upto?: number;
//   updatedAt?: string;
// };

// type JobCardDealAppliedType = {
//   name: string;
//   percentageDiscount?: number;
//   dealCode?: string;
// };

// type JobCardServiceSubServiceType = {
//   id: string;
//   price?: number;
//   discountedPrice?: number;
//   discountAmount?: number;
// };

// type JobCardServiceType = {
//   id: string;
//   subServices: JobCardServiceSubServiceType[];
// };

// type JobCardType = {
//   _id: string;
//   jobNo: string;
//   business: string;
//   customerId: string;
//   vehicleId: string;
//   odometerReading: number;
//   issueDescription: string;
//   serviceType: string;
//   priorityLevel: string;
//   services: JobCardServiceType[];
//   additionalNotes?: string;
//   vehiclePhotos: string[];
//   dealApplied?: JobCardDealAppliedType;
//   totalPayableAmount: number;
//   paymentStatus: string;
//   technicalRemarks?: string;
//   createdAt?: string;
//   updatedAt?: string;
// };

// type AutoShopOwnerType = {
//   _id: string;
//   name: string;
//   email?: string;
//   countryCode?: string;
//   phone?: string;
//   pincode?: string;
//   address?: string;
//   isDisabled?: boolean;
//   isProfileComplete?: boolean;
//   isBusinessProfileCompleted?: boolean;
//   businessProfile?: BusinessProfileType | null;
//   myCustomers?: CustomerType[];
//   createdAt?: string;
//   deals?: DealType[];
//   jobCards?: JobCardType[];
// };

// // ShopOverviewCard, Modal, Badge helpers, etc.: unchanged

// const ShopOverviewCard: React.FC<{ shopData: BusinessProfileType }> = ({
//   shopData = {},
// }) => {
//   // Destructure with fallbacks
//   const {
//     businessPhone = "289 274 8591",
//     businessName = "Auto 27 Car Garage",
//     businessAddress = "2 Fisherman Dr - Unit 9",
//     city = shopData.city || "Brampton, ON L7A 1B5",
//     openHours = "9:00 AM - 6:00 PM",
//     openDays = shopData.openDays
//       ? Array.isArray(shopData.openDays)
//         ? shopData.openDays.length === 1 &&
//           typeof shopData.openDays[0] === "string" &&
//           shopData.openDays[0].trim().startsWith("[")
//           ? (() => {
//               try {
//                 return JSON.parse(shopData.openDays[0]).join(", ");
//               } catch {
//                 return shopData.openDays.join(", ");
//               }
//             })()
//           : shopData.openDays.join(", ")
//         : shopData.openDays
//       : "Mon - Sat",
//     isOpen = true,
//     myServices = [],
//     businessLogo,
//     businessEmail = "",
//     websiteUrl = "#",
//     businessMapLocation,
//     pincode,
//     rating = 4.8,
//     reviewCount = 142,
//     reviewDate = "01 / 2026",
//   } = shopData || {};

//   let services: string[] = [];
//   if (Array.isArray(myServices) && myServices.length > 0) {
//     // Gather service names, fall back if none
//     for (const item of myServices) {
//       if (item?.service?.name) {
//         services.push(item.service.name);
//       }
//     }
//   }
//   if (services.length === 0) {
//     services = [
//       "General Repair",
//       "Diagnose - Paccer",
//       "Diagnose - Communis",
//       "Safety On-line",
//       "Oil Change",
//       "Brake Service",
//     ];
//   }
//   const servicesToShow = services.slice(0, 6);

//   // Shop logo or fallback image
//   let imageUrl =
//     businessLogo && typeof businessLogo === "string"
//       ? businessLogo.startsWith("http")
//         ? businessLogo
//         : `${import.meta.env.VITE_IMAGE_URL ?? ""}/${businessLogo}`
//       : "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?q=80&w=1200&auto=format&fit=crop";

//   // Directions URL (use businessMapLocation if provided, or fallback)
//   let directionsUrl = "#";
//   if (businessMapLocation?.lat && businessMapLocation?.lng) {
//     directionsUrl = `https://www.google.com/maps/search/?api=1&query=${businessMapLocation.lat},${businessMapLocation.lng}`;
//   }

//   // Website url
//   let webUrl =
//     websiteUrl && websiteUrl !== "#"
//       ? websiteUrl
//       : businessEmail
//       ? `mailto:${businessEmail}`
//       : "#";

//   // Status open logic: You can adjust based on business hours, for now fallback true
//   const statusOpen = isOpen;

//   return (
//     // ...as in original code...
//     // (No changes made here)
//     <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] mb-7">
//       {/* Top action bar */}
//       <div
//         className="grid border-b border-slate-200"
//         style={{
//           gridTemplateColumns:
//             "minmax(0, 1.15fr) minmax(0, 0.72fr) minmax(0, 0.72fr) minmax(0, 1.65fr) minmax(52px, 0.55fr)",
//           minHeight: 48,
//         }}
//       >
//         <div className="flex items-center justify-center border-r border-slate-200 bg-emerald-50 px-2 py-2 text-center text-[13px] font-bold text-emerald-800">
//           <span className="truncate">📞 {businessPhone}</span>
//         </div>

//         <a
//           href={directionsUrl}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="flex items-center justify-center border-r border-slate-200 bg-sky-50 text-[13px] font-semibold text-blue-600 no-underline transition-colors hover:bg-sky-100"
//         >
//           Directions
//         </a>

//         <a
//           href={webUrl}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="flex items-center justify-center border-r border-slate-200 bg-slate-50 text-[13px] font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-100"
//         >
//           Website
//         </a>

//         <div className="flex min-w-0 items-center justify-between gap-2 border-r border-slate-200 bg-white px-3 py-2">
//           <div className="flex shrink-0 items-center gap-2">
//             <span
//               className={`h-2 w-2 shrink-0 rounded-full ${
//                 statusOpen ? "bg-emerald-500" : "bg-red-500"
//               }`}
//             />
//             <span
//               className={`whitespace-nowrap text-[12px] font-semibold ${
//                 statusOpen ? "text-emerald-700" : "text-red-600"
//               }`}
//             >
//               {statusOpen ? "OPEN NOW" : "CLOSED"}
//             </span>
//           </div>
//           <div className="text-right text-[11px] leading-snug text-slate-500">
//             <div className="whitespace-nowrap">{openDays}</div>
//             <div className="whitespace-nowrap">{openHours}</div>
//           </div>
//         </div>

//         <div className="flex items-center justify-center gap-1 bg-amber-50 text-[15px] font-bold text-slate-900">
//           <span className="text-amber-500">★</span>
//           {rating}
//         </div>
//       </div>

//       {/* Main content */}
//       <div
//         className="grid items-start gap-5 p-5"
//         style={{
//           gridTemplateColumns:
//             "minmax(120px, 150px) minmax(0, 1.25fr) minmax(0, 1.1fr) minmax(100px, 118px)",
//         }}
//       >
//         <img
//           src={imageUrl}
//           alt={businessName}
//           className="h-[108px] w-full rounded-lg object-cover"
//         />

//         <div className="min-w-0">
//           <h2 className="mb-1.5 text-xl font-bold leading-tight text-slate-900">
//             {businessName}
//           </h2>
//           <p className="mb-3 text-[13px] leading-relaxed text-slate-600">
//             {businessAddress}
//             <br />
//             {city}
//             {pincode && (
//               <>
//                 <br />
//                 Pincode: {pincode}
//               </>
//             )}
//           </p>
//           <div className="flex flex-wrap gap-2">
//             <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
//               {statusOpen ? "Open" : "Closed"}
//             </span>
//             <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] text-blue-700">
//               {openDays}
//             </span>
//             <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600">
//               {openHours}
//             </span>
//           </div>
//         </div>

//         <div className="min-w-0">
//           <p className="mb-2.5 text-[13px] font-bold text-slate-900">
//             Services
//           </p>
//           <ul
//             className="grid list-none gap-x-4 gap-y-1.5 p-0"
//             style={{
//               gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
//             }}
//           >
//             {servicesToShow.map((service, index) => (
//               <li
//                 key={`${service}-${index}`}
//                 className="flex min-w-0 items-start gap-1.5 text-[12px] leading-snug text-slate-600"
//               >
//                 <span className="mt-px shrink-0 font-bold text-emerald-500">
//                   ✓
//                 </span>
//                 <span className="min-w-0">{service}</span>
//               </li>
//             ))}
//           </ul>
//         </div>

//         <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-3 text-center">
//           <span className="text-[26px] font-bold leading-none text-slate-900">
//             {rating}
//           </span>
//           <span className="mt-1 text-[13px] tracking-wide text-amber-500">
//             ★★★★★
//           </span>
//           <span className="mt-1.5 text-[11px] text-slate-500">
//             {reviewCount} Reviews
//           </span>
//           <span className="mt-0.5 text-[10px] text-slate-400">{reviewDate}</span>
//         </div>
//       </div>

//       {/* Footer */}
//       <div
//         className="grid items-center gap-2 bg-slate-900 px-4 py-2.5 text-[12px] text-white"
//         style={{
//           gridTemplateColumns:
//             "minmax(0, 1fr) minmax(0, 1.6fr) minmax(0, 1fr)",
//         }}
//       >
//         <span className="truncate font-medium">{businessName}</span>
//         <span className="truncate text-center text-slate-200">
//           {businessAddress} • {city}
//         </span>
//         <span className="truncate text-right text-slate-200">
//           {openDays} | {openHours}
//         </span>
//       </div>
//     </div>
//   );
// };

// type ModalProps = {
//   isOpen: boolean;
//   onClose: () => void;
//   title: string;
//   children: React.ReactNode;
// };
// const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
//   if (!isOpen) return null;
//   return (
//     <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
//       <div className="bg-white dark:bg-gray-900 rounded-xl max-w-7xl w-full shadow-lg relative mx-10">
//         <div className="flex items-center justify-between border-b px-6 py-4">
//           <h3 className="text-lg font-bold">{title}</h3>
//           <button
//             className="text-xl font-bold text-gray-500 hover:text-gray-800 px-2"
//             type="button"
//             aria-label="Close"
//             onClick={onClose}
//           >
//             ×
//           </button>
//         </div>
//         <div className="p-6 overflow-y-auto max-h-[80vh]">{children}</div>
//       </div>
//     </div>
//   );
// };

// // Helper badge/status functions: unchanged
// function getStatus(owner: AutoShopOwnerType) {
//   if (owner.isDisabled) return "Suspended";
//   if (
//     owner.isProfileComplete &&
//     (owner.isBusinessProfileCompleted ?? owner.businessProfile)
//   )
//     return "Active";
//   if (!owner.isProfileComplete) return "Incomplete Profile";
//   return "Unknown";
// }
// function getStatusColor(owner: AutoShopOwnerType) {
//   if (owner.isDisabled) return "warning";
//   if (
//     owner.isProfileComplete &&
//     (owner.isBusinessProfileCompleted ?? owner.businessProfile)
//   )
//     return "success";
//   if (!owner.isProfileComplete) return "error";
//   return "default";
// }

// // Export helpers: unchanged
// function toCsv(data: string[][], headers: string[]): string {
//   const escapeCsv = (val: any) => {
//     if (val == null) return "";
//     let s = String(val);
//     if (/[,\"\n]/.test(s)) {
//       s = '"' + s.replace(/"/g, '""') + '"';
//     }
//     return s;
//   };
//   return (
//     headers.map(escapeCsv).join(",") +
//     "\n" +
//     data.map((row) => row.map(escapeCsv).join(",")).join("\n")
//   );
// }
// function downloadAsFile(filename: string, content: string) {
//   const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   a.click();
//   setTimeout(() => URL.revokeObjectURL(url), 2000);
// }
// function autoShopOwnersToCsvRows(
//   owners: AutoShopOwnerType[]
// ): [string[], string[][]] {
//   const headers = [
//     "Name",
//     "Email",
//     "Phone",
//     "Shop Name",
//     "Shop Address",
//     "Shop City",
//     "Pincode",
//     "Status",
//     "Customers Count",
//     "Deals Count",
//     "JobCards Count",
//     "Created At",
//     "Profile Complete",
//     "Business Profile Complete",
//   ];
//   const rows = owners.map((owner) => [
//     owner.name ?? "",
//     owner.email ?? "",
//     (owner.countryCode ? owner.countryCode + " " : "") + (owner.phone ?? ""),
//     owner.businessProfile?.businessName ?? "",
//     owner.businessProfile?.businessAddress ?? "",
//     owner.businessProfile?.city ?? "",
//     owner.businessProfile?.pincode ?? "",
//     getStatus(owner),
//     owner.myCustomers ? owner.myCustomers.length.toString() : "0",
//     owner.deals ? owner.deals.length.toString() : "0",
//     owner.jobCards ? owner.jobCards.length.toString() : "0",
//     owner.createdAt ? new Date(owner.createdAt).toLocaleString() : "",
//     owner.isProfileComplete ? "Yes" : "No",
//     (owner.isBusinessProfileCompleted ?? !!owner.businessProfile) ? "Yes" : "No",
//   ]);
//   return [headers, rows];
// }

// // --- Send Custom Notification Modal ---
// const SendNotificationModal: React.FC<{
//   isOpen: boolean;
//   onClose: () => void;
//   selectedOwnerIds: string[];
//   onSuccess: () => void;
// }> = ({ isOpen, onClose, selectedOwnerIds, onSuccess }) => {
//   const [title, setTitle] = useState("");
//   const [body, setBody] = useState("");
//   const [sending, setSending] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [successMsg, setSuccessMsg] = useState<string | null>(null);

//   const ownersCount = selectedOwnerIds.length;

//   const resetForm = () => {
//     setTitle("");
//     setBody("");
//     setError(null);
//     setSuccessMsg(null);
//     setSending(false);
//   };

//   const handleClose = () => {
//     resetForm();
//     onClose();
//   };

//   const handleSend = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setSuccessMsg(null);

//     if (!title.trim() || !body.trim()) {
//       setError("Please provide both title and message body");
//       return;
//     }
//     if (!Array.isArray(selectedOwnerIds) || selectedOwnerIds.length === 0) {
//       setError("No shop owners selected.");
//       return;
//     }
//     setSending(true);
//     try {
//       const res = await axios.post(
//         `${import.meta.env.VITE_API_URL}/api/admin/notification/custom/send`,
//         {
//           userType:"autoshopowner",
//           userIds: selectedOwnerIds,
//           title,
//           message: body,
//         }
//       );
//       if (res.data.success) {
//         setSuccessMsg("Notification sent successfully!");
//         onSuccess();
//         setTimeout(handleClose, 1500);
//       } else {
//         setError(res.data.message || "Failed to send notification");
//       }
//     } catch (err: any) {
//       setError(
//         err?.response?.data?.message ||
//           (err?.message || "Failed to send notification")
//       );
//     } finally {
//       setSending(false);
//     }
//   };

//   return (
//     <Modal isOpen={isOpen} onClose={handleClose} title="Send Custom Notification">
//       <form className="space-y-5 max-w-lg mx-auto" onSubmit={handleSend}>
//         <div>
//           <label className="block font-semibold mb-1" htmlFor="noti-title">
//             Notification Title
//           </label>
//           <input
//             id="noti-title"
//             type="text"
//             className="w-full border-gray-300 rounded px-3 py-2"
//             value={title}
//             disabled={sending}
//             onChange={e => setTitle(e.target.value)}
//             maxLength={80}
//             placeholder="Eg. Important update for your shop account"
//             required
//           />
//         </div>
//         <div>
//           <label className="block font-semibold mb-1" htmlFor="noti-body">
//             Notification Body
//           </label>
//           <textarea
//             id="noti-body"
//             className="w-full border-gray-300 rounded px-3 py-2 min-h-[92px]"
//             value={body}
//             onChange={e => setBody(e.target.value)}
//             disabled={sending}
//             maxLength={240}
//             placeholder="Write your message to send to selected shop owners..."
//             required
//           />
//         </div>
//         {error ? <div className="text-red-600 text-sm">{error}</div> : null}
//         {successMsg ? (
//           <div className="text-green-600 text-sm">{successMsg}</div>
//         ) : null}
//         <div className="flex items-center gap-4 justify-end mt-4">
//           <button
//             type="button"
//             onClick={handleClose}
//             disabled={sending}
//             className="px-4 py-2 rounded bg-slate-100 text-gray-850 hover:bg-slate-200 font-semibold"
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             disabled={sending}
//             className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-2"
//           >
//             {sending && (
//               <svg
//                 className="animate-spin mr-2 h-4 w-4 text-white"
//                 viewBox="0 0 24 24"
//                 fill="none"
//               >
//                 <circle
//                   className="opacity-25"
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                 />
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//                 />
//               </svg>
//             )}
//             <span>
//               Send Notification to {ownersCount} shop owner
//               {ownersCount > 1 ? "s" : ""}
//             </span>
//           </button>
//         </div>
//       </form>
//     </Modal>
//   );
// };

// // New: Job Card Detail Modal
// const JobCardDetailModal: React.FC<{
//   isOpen: boolean;
//   onClose: () => void;
//   card: JobCardType | null;
//   owner: AutoShopOwnerType | null;
//   UPLOADS_URL: string;
// }> = ({ isOpen, onClose, card, owner, UPLOADS_URL }) => {
//   // ...unchanged... (as before)
//   if (!isOpen || !card || !owner) return null;
//   // ...rest of modal unchanged...
//   // ...omitted for brevity...
//   return (
//     <Modal isOpen={isOpen} onClose={onClose} title={`Job Card Details - ${card._id}`}>
//       <div className="space-y-2 text-sm text-gray-800 dark:text-white">
//         <div>
//           <span className="font-semibold">Job Card No.:</span>{" "}
//           {card._id}
//         </div>
//         <div>
//           <span className="font-semibold">Date:</span>{" "}
//           {card.createdAt ? new Date(card.createdAt).toLocaleString() : "-"}
//         </div>
//         <div>
//           <span className="font-semibold">Phone:</span>{" "}
//           {owner.countryCode ? owner.countryCode + " " : ""}
//           {owner.phone || "-"}
//         </div>
//         <div>
//           <span className="font-semibold">Name:</span>{" "}
//           {owner.name}
//         </div>
//         <div>
//           <span className="font-semibold">Business:</span> {card.business}
//         </div>
//         <div>
//           <span className="font-semibold">Vehicle ID:</span> {card.vehicleId}
//         </div>
//         <div>
//           <span className="font-semibold">Odometer Reading:</span> {card.odometerReading}
//         </div>
//         <div>
//           <span className="font-semibold">Issue:</span> {card.issueDescription}
//         </div>
//         <div>
//           <span className="font-semibold">Notes:</span> {card.additionalNotes || "-"}
//         </div>
//         <div>
//           <span className="font-semibold">Technical Remarks:</span> {card.technicalRemarks || "-"}
//         </div>
//         <div>
//           <span className="font-semibold">Deal Applied:</span>{" "}
//           {card.dealApplied
//             ? `${card.dealApplied.name} (${card.dealApplied.dealCode ?? ""}${
//                 card.dealApplied.percentageDiscount != null
//                   ? ` - ${card.dealApplied.percentageDiscount}%`
//                   : ""
//               })`
//             : "-"}
//         </div>
//         <div>
//           <span className="font-semibold">Total Payable:</span> ₹{card.totalPayableAmount}
//         </div>
//         <div>
//           <span className="font-semibold">Payment Status:</span> {card.paymentStatus}
//         </div>
//         <div>
//           <span className="font-semibold">Service Type:</span> {card.serviceType}
//         </div>
//         <div>
//           <span className="font-semibold">Priority:</span> {card.priorityLevel}
//         </div>
//         <div>
//           <span className="font-semibold">Created:</span>{" "}
//           {card.createdAt ? new Date(card.createdAt).toLocaleString() : "-"}
//         </div>
//         {/* Vehicle Photos */}
//         {card.vehiclePhotos && card.vehiclePhotos.length > 0 && (
//           <div className="pt-3">
//             <div className="font-semibold mb-1">Vehicle Photos</div>
//             <div className="flex flex-wrap gap-2 mb-2">
//               {card.vehiclePhotos.map((photoUrl, idx) => (
//                 <img
//                   key={idx}
//                   src={
//                     photoUrl.startsWith("http")
//                       ? photoUrl
//                       : `${UPLOADS_URL ?? ""}/${photoUrl.replace(
//                           /^\/+/,
//                           ""
//                         )}`
//                   }
//                   alt="Vehicle"
//                   className="w-20 h-20 object-cover rounded"
//                   loading="lazy"
//                 />
//               ))}
//             </div>
//           </div>
//         )}
//         {/* Services breakdown if present */}
//         {Array.isArray(card.services) && card.services.length > 0 && (
//           <div className="pt-2">
//             <div className="font-semibold mb-1">Services:</div>
//             <ul className="ml-3 list-disc">
//               {card.services.map((serv, sidx) => (
//                 <li key={serv.id + "-" + sidx}>
//                   <div>
//                     Service ID: <span className="font-mono">{serv.id}</span>
//                   </div>
//                   {Array.isArray(serv.subServices) && serv.subServices.length > 0 && (
//                     <ul className="ml-3 list-disc">
//                       {serv.subServices.map((ss, ssidx) => (
//                         <li key={ss.id + "-" + ssidx}>
//                           SubService ID: <span className="font-mono">{ss.id}</span>
//                           {typeof ss.price !== "undefined" && (
//                             <span> | ₹{ss.price}</span>
//                           )}
//                           {typeof ss.discountedPrice !== "undefined" &&
//                             ss.discountedPrice !== ss.price && (
//                               <span className="ml-2 text-green-700">
//                                 After Discount: ₹{ss.discountedPrice}
//                               </span>
//                             )}
//                           {typeof ss.discountAmount !== "undefined" &&
//                             ss.discountAmount > 0 && (
//                               <span className="ml-2 text-red-600">
//                                 (Discount: ₹{ss.discountAmount})
//                               </span>
//                             )}
//                         </li>
//                       ))}
//                     </ul>
//                   )}
//                 </li>
//               ))}
//             </ul>
//           </div>
//         )}
//       </div>
//     </Modal>
//   );
// };

// // -----------------------------
// // Main Component
// // -----------------------------
// const AutoShopOwners: React.FC = () => {
//   const [owners, setOwners] = useState<AutoShopOwnerType[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string>("");

//   // Modal state
//   const [customerModalOpen, setCustomerModalOpen] = useState<boolean>(false);
//   const [dealsModalOpen, setDealsModalOpen] = useState<boolean>(false);
//   const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
//   const [jobCardsModalOpen, setJobCardsModalOpen] = useState<boolean>(false);
//   const [modalOwner, setModalOwner] = useState<AutoShopOwnerType | null>(null);

//   // Job Card detail modal state
//   const [jobCardDetailModalOpen, setJobCardDetailModalOpen] =
//     useState<boolean>(false);
//   const [selectedJobCard, setSelectedJobCard] =
//     useState<JobCardType | null>(null);

//   // For disabling/enabling owners
//   const [actionLoadingMap, setActionLoadingMap] = useState<{
//     [ownerId: string]: boolean;
//   }>({});

//   const [exporting, setExporting] = useState(false); // Export UI state

//   // Selection state
//   const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);

//   // Notification modal state
//   const [notificationOpen, setNotificationOpen] = useState(false);

//   // Vehicle image base url from VITE_UPLOADS_URL
//   const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL;

//   // Fetch from admin API: admin/autoshopowners
//   const fetchOwners = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await axios.get(
//         `${import.meta.env.VITE_API_URL}/api/admin/autoshopowners`
//       );
//       if (res.data.success && Array.isArray(res.data.data)) {
//         setOwners(res.data.data);
//       } else {
//         setError("Failed to fetch auto shop owners");
//       }
//     } catch (err: any) {
//       setError(err?.response?.data?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Enable/disable owner by ID (PATCH)
//   const changeAutoShopOwnerStatus = async (
//     ownerId: string,
//     action: "enable" | "disable"
//   ) => {
//     setActionLoadingMap((prev) => ({ ...prev, [ownerId]: true }));
//     try {
//       const disable = action === "disable";
//       const res = await axios.post(
//         `${import.meta.env.VITE_API_URL}/api/admin/autoshopowners/toggle-status`,
//         { userId: ownerId, disable }
//       );
//       if (res.data.success) {
//         await fetchOwners();
//       } else {
//         alert("Failed to update status");
//       }
//     } catch (err: any) {
//       alert(
//         err?.response?.data?.message ||
//           `Failed to ${action === "enable" ? "enable" : "suspend"} shop owner.`
//       );
//     } finally {
//       setActionLoadingMap((prev) => ({ ...prev, [ownerId]: false }));
//     }
//   };

//   // Export handler
//   const handleExport = async () => {
//     setExporting(true);
//     try {
//       let dataToExport: AutoShopOwnerType[] = [];
//       if (selectedOwnerIds.length > 0) {
//         dataToExport = owners.filter((owner) =>
//           selectedOwnerIds.includes(owner._id)
//         );
//       } else {
//         alert("Please select at least one row to export.");
//         setExporting(false);
//         return;
//       }
//       if (dataToExport.length === 0) {
//         alert("No owners selected.");
//         setExporting(false);
//         return;
//       }
//       const [headers, rows] = autoShopOwnersToCsvRows(dataToExport);
//       const csvString = toCsv(rows, headers);

//       downloadAsFile(
//         `autoshop-owners-${new Date().toISOString().slice(0, 10)}.csv`,
//         csvString
//       );
//     } catch (err: any) {
//       alert("Failed to export data.");
//     } finally {
//       setExporting(false);
//     }
//   };

//   // For bulk selection
//   const isAllSelected =
//     owners.length > 0 && selectedOwnerIds.length === owners.length;
//   const handleCheckAll = (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (event.target.checked) {
//       setSelectedOwnerIds(owners.map((owner) => owner._id));
//     } else {
//       setSelectedOwnerIds([]);
//     }
//   };
//   const handleCheckRow = (ownerId: string, checked: boolean) => {
//     setSelectedOwnerIds((current) => {
//       if (checked) {
//         return [...current, ownerId];
//       } else {
//         return current.filter((id) => id !== ownerId);
//       }
//     });
//   };

//   useEffect(() => {
//     fetchOwners();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // ...all modal render helpers unchanged...
//   // (code below is from original selection, not repeated here for brevity, stays the same)

//   // Previous code: renderBusinessProfileModal, renderCustomersModal, etc.
//   // ...start unchanged modal code...
//   const renderBusinessProfileModal = () => {
//     // ...unchanged...
//     if (!modalOwner || !modalOwner.businessProfile) return null;
//     const bp = modalOwner.businessProfile;

//     const renderNestedServices = () => {
//       if (!Array.isArray(bp.myServices) || bp.myServices.length === 0) {
//         return <div className="text-gray-400">No services listed</div>;
//       }
//       const serviceMap: {
//         [serviceId: string]: { service: Service; subServiceIds: string[] };
//       } = {};
//       bp.myServices.forEach((ms: MyService) => {
//         if (!ms.service || !ms.service._id) return;
//         if (!serviceMap[ms.service._id]) {
//           serviceMap[ms.service._id] = {
//             service: ms.service,
//             subServiceIds: [],
//           };
//         }
//         if (Array.isArray(ms.subServices)) {
//           serviceMap[ms.service._id].subServiceIds.push(
//             ...ms.subServices.map((ss) => ss.subService)
//           );
//         }
//       });
//       const grouped = Object.values(serviceMap);
//       return (
//         <ul className="space-y-4">
//           {grouped.map(({ service, subServiceIds }) => (
//             <li key={service._id}>
//               <div className="font-medium text-base text-gray-700 dark:text-white mb-1">
//                 {service.name || "-"}
//               </div>
//               <div className="pl-4">
//                 {service.services && service.services.length > 0 ? (
//                   <ul className="space-y-1 list-disc ml-4">
//                     {service.services
//                       .filter(
//                         (ss) =>
//                           subServiceIds.length === 0 ||
//                           subServiceIds.includes(ss._id)
//                       )
//                       .map((ss) => (
//                         <li key={ss._id}>
//                           <span className="font-normal">{ss.name}</span>
//                           {ss.desc && (
//                             <span className="ml-2 text-gray-400 text-xs">
//                               {ss.desc}
//                             </span>
//                           )}
//                         </li>
//                       ))}
//                     {service.services.filter(
//                       (ss) =>
//                         subServiceIds.length === 0 ||
//                         subServiceIds.includes(ss._id)
//                     ).length === 0 && (
//                       <li className="text-gray-400">-</li>
//                     )}
//                   </ul>
//                 ) : (
//                   <span className="text-gray-400">-</span>
//                 )}
//               </div>
//             </li>
//           ))}
//         </ul>
//       );
//     };

//     return (
//       <Modal
//         isOpen={profileModalOpen}
//         onClose={() => setProfileModalOpen(false)}
//         title={`Business Profile: ${bp.businessName || "-"}`}
//       >
//         {/* New Shop Overview Card at the top */}
//         <ShopOverviewCard shopData={bp} />

//         <div className="space-y-4 mt-8">
//           {/* Team Members */}
//           <div>
//             <div className="font-semibold mb-2">Team Members</div>
//             {Array.isArray(bp.teamMembers) && bp.teamMembers.length > 0 ? (
//               <div className="overflow-x-auto">
//                 <table className="min-w-full text-xs border">
//                   <thead>
//                     <tr>
//                       <th className="p-2 border-b font-semibold text-left">
//                         Photo
//                       </th>
//                       <th className="p-2 border-b font-semibold text-left">
//                         Name
//                       </th>
//                       <th className="p-2 border-b font-semibold text-left">
//                         Email
//                       </th>
//                       <th className="p-2 border-b font-semibold text-left">
//                         Phone
//                       </th>
//                       <th className="p-2 border-b font-semibold text-left">
//                         Designation
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {bp.teamMembers.map((tm: TeamMemberType) => (
//                       <tr key={tm._id}>
//                         <td className="p-2 border-b">
//                           {tm.photo ? (
//                             <img
//                               src={
//                                 tm.photo.startsWith("http")
//                                   ? tm.photo
//                                   : `${
//                                       import.meta.env.VITE_IMAGE_URL ?? ""
//                                     }/${tm.photo}`
//                               }
//                               alt="Team"
//                               className="w-8 h-8 rounded-full object-cover"
//                             />
//                           ) : (
//                             <span className="block bg-gray-200 w-8 h-8 rounded-full" />
//                           )}
//                         </td>
//                         <td className="p-2 border-b">{tm.name}</td>
//                         <td className="p-2 border-b">{tm.email || "-"}</td>
//                         <td className="p-2 border-b">{tm.phone || "-"}</td>
//                         <td className="p-2 border-b">
//                           {tm.designation || "-"}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             ) : (
//               <div className="text-gray-400">No team members</div>
//             )}
//           </div>
//           {/* My Services: Nested Heading (Category), then subservice list */}
//           <div>
//             <div className="font-semibold mb-2">Services</div>
//             {renderNestedServices()}
//           </div>
//           {/* My Deals - display as detail table if possible */}
//           <div>
//             <div className="font-semibold mb-2">My Deals</div>
//             {Array.isArray(bp.myDeals) && bp.myDeals.length > 0 ? (
//               <div className="overflow-x-auto">
//                 <table className="min-w-full text-xs border">
//                   <thead>
//                     <tr>
//                       <th className="p-2 border-b font-semibold text-left">
//                         Name
//                       </th>
//                       <th className="p-2 border-b font-semibold text-left">
//                         Description
//                       </th>
//                       <th className="p-2 border-b font-semibold text-left">
//                         Discount %
//                       </th>
//                       <th className="p-2 border-b font-semibold text-left">
//                         Coupon
//                       </th>
//                       <th className="p-2 border-b font-semibold text-left">
//                         Enabled
//                       </th>
//                       <th className="p-2 border-b font-semibold text-left">
//                         Valid From
//                       </th>
//                       <th className="p-2 border-b font-semibold text-left">
//                         Ends
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {bp.myDeals.map((deal: any) => {
//                       if (typeof deal === "string") {
//                         return (
//                           <tr key={deal}>
//                             <td className="p-2 border-b" colSpan={7}>
//                               {deal}
//                             </td>
//                           </tr>
//                         );
//                       }
//                       return (
//                         <tr key={deal._id ?? deal.name ?? Math.random()}>
//                           <td className="p-2 border-b">
//                             {deal.name || "-"}
//                           </td>
//                           <td className="p-2 border-b max-w-xs whitespace-pre-wrap">
//                             {deal.description || "-"}
//                           </td>
//                           <td className="p-2 border-b">
//                             {deal.percentageDiscount ?? 0}%
//                           </td>
//                           <td className="p-2 border-b">
//                             {deal.couponCode || "-"}
//                           </td>
//                           <td className="p-2 border-b">
//                             {deal.dealEnabled ? (
//                               <span className="text-green-600 font-medium">
//                                 Yes
//                               </span>
//                             ) : (
//                               <span className="text-red-500 font-medium">
//                                 No
//                               </span>
//                             )}
//                           </td>
//                           <td className="p-2 border-b">
//                             {deal.startDate
//                               ? new Date(
//                                   deal.startDate
//                                 ).toLocaleDateString()
//                               : "-"}
//                           </td>
//                           <td className="p-2 border-b">
//                             {deal.endDate
//                               ? new Date(deal.endDate).toLocaleDateString()
//                               : "-"}
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             ) : (
//               <div className="text-gray-400">No shop deals linked</div>
//             )}
//           </div>
//         </div>
//       </Modal>
//     );
//   };

//   // Customers Modal unchanged
//   const renderCustomersModal = () => {
//     // ...unchanged...
//     if (!modalOwner) return null;
//     return (
//       <Modal
//         isOpen={customerModalOpen}
//         onClose={() => setCustomerModalOpen(false)}
//         title={`Customers of ${modalOwner.name}`}
//       >
//         {modalOwner.myCustomers && modalOwner.myCustomers.length > 0 ? (
//           <div>
//             <table className="min-w-full text-sm">
//               <thead>
//                 <tr>
//                   <th className="font-semibold text-left p-2 border-b border-gray-100">
//                     Name
//                   </th>
//                   <th className="font-semibold text-left p-2 border-b border-gray-100">
//                     Email
//                   </th>
//                   <th className="font-semibold text-left p-2 border-b border-gray-100">
//                     Phone
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {modalOwner.myCustomers.map((cust) => (
//                   <tr key={cust._id}>
//                     <td className="p-2 border-b border-gray-50">
//                       {cust.name || "-"}
//                     </td>
//                     <td className="p-2 border-b border-gray-50">
//                       {cust.email || "-"}
//                     </td>
//                     <td className="p-2 border-b border-gray-50">
//                       {cust.phone || "-"}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <div className="py-4 text-gray-400">No customers found.</div>
//         )}
//       </Modal>
//     );
//   };

//   const renderDealsModal = () => {
//     // ...unchanged...
//     if (!modalOwner) return null;
//     return (
//       <Modal
//         isOpen={dealsModalOpen}
//         onClose={() => setDealsModalOpen(false)}
//         title={`Deals for ${modalOwner.name}`}
//       >
//         {modalOwner.deals && modalOwner.deals.length > 0 ? (
//           <div className="overflow-x-auto">
//             <table className="min-w-full text-sm border">
//               <thead>
//                 <tr>
//                   <th className="font-semibold text-left p-2 border-b border-gray-100">
//                     Name
//                   </th>
//                   <th className="font-semibold text-left p-2 border-b border-gray-100">
//                     Description
//                   </th>
//                   <th className="font-semibold text-left p-2 border-b border-gray-100">
//                     Discount %
//                   </th>
//                   <th className="font-semibold text-left p-2 border-b border-gray-100">
//                     Coupon
//                   </th>
//                   <th className="font-semibold text-left p-2 border-b border-gray-100">
//                     Enabled
//                   </th>
//                   <th className="font-semibold text-left p-2 border-b border-gray-100">
//                     Valid From
//                   </th>
//                   <th className="font-semibold text-left p-2 border-b border-gray-100">
//                     Ends
//                   </th>
//                   <th className="font-semibold text-left p-2 border-b border-gray-100">
//                     Details
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {modalOwner.deals.map((deal) => (
//                   <tr key={deal._id}>
//                     <td className="p-2 border-b border-gray-50">
//                       {deal.name}
//                     </td>
//                     <td className="p-2 border-b border-gray-50 max-w-xs whitespace-pre-wrap">
//                       {deal.description || "-"}
//                     </td>
//                     <td className="p-2 border-b border-gray-50">
//                       {deal.percentageDiscount ?? 0}%
//                     </td>
//                     <td className="p-2 border-b border-gray-50">
//                       {deal.couponCode || "-"}
//                     </td>
//                     <td className="p-2 border-b border-gray-50">
//                       {deal.dealEnabled ? (
//                         <span className="text-green-600 font-medium">
//                           Yes
//                         </span>
//                       ) : (
//                         <span className="text-red-500 font-medium">No</span>
//                       )}
//                     </td>
//                     <td className="p-2 border-b border-gray-50">
//                       {deal.startDate
//                         ? new Date(deal.startDate).toLocaleDateString()
//                         : "-"}
//                     </td>
//                     <td className="p-2 border-b border-gray-50">
//                       {deal.endDate
//                         ? new Date(deal.endDate).toLocaleDateString()
//                         : "-"}
//                     </td>
//                     <td className="p-2 border-b border-gray-50 max-w-xs whitespace-pre-wrap">
//                       {deal.additionalDetails || "-"}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <div className="py-4 text-gray-400">No deals found.</div>
//         )}
//       </Modal>
//     );
//   };

//   const renderJobCardsModal = () => {
//     // ...unchanged...
//     if (!modalOwner) return null;
//     return (
//       <Modal
//         isOpen={jobCardsModalOpen}
//         onClose={() => setJobCardsModalOpen(false)}
//         title={`Job Cards for ${modalOwner.name}`}
//       >
//         {modalOwner.jobCards && modalOwner.jobCards.length > 0 ? (
//           <div className="overflow-x-auto">
//             <table className="min-w-full text-sm border">
//               <thead>
//                 <tr>
//                   <th className="p-2 border-b text-left font-semibold">Job Card No.</th>
//                   <th className="p-2 border-b text-left font-semibold">Date</th>
//                   <th className="p-2 border-b text-left font-semibold">Phone Number</th>
//                   <th className="p-2 border-b text-left font-semibold">Name</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {modalOwner.jobCards.map((card: JobCardType) => (
//                   <tr
//                     key={card._id}
//                     className="hover:bg-blue-50 cursor-pointer"
//                     onClick={() => {
//                       setSelectedJobCard(card);
//                       setJobCardDetailModalOpen(true);
//                     }}
//                   >
//                     <td className="p-2 border-b">{card.jobNo}</td>
//                     <td className="p-2 border-b">
//                       {card.createdAt
//                         ? new Date(card.createdAt).toLocaleString()
//                         : "-"}
//                     </td>
//                     <td className="p-2 border-b">
//                       {modalOwner.countryCode ? `${modalOwner.countryCode} ` : ""}
//                       {modalOwner.phone || "-"}
//                     </td>
//                     <td className="p-2 border-b">
//                       {modalOwner.name}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             {/* Job Card Detail Modal */}
//             <JobCardDetailModal
//               isOpen={jobCardDetailModalOpen}
//               onClose={() => {
//                 setJobCardDetailModalOpen(false);
//                 setSelectedJobCard(null);
//               }}
//               card={selectedJobCard}
//               owner={modalOwner}
//               UPLOADS_URL={UPLOADS_URL}
//             />
//           </div>
//         ) : (
//           <div className="py-4 text-gray-400">No job cards found.</div>
//         )}
//       </Modal>
//     );
//   };

//   // --- END MODAL CODE ---

//   return (
//     <>
//       {/* Modals */}
//       {renderBusinessProfileModal()}
//       {renderCustomersModal()}
//       {renderDealsModal()}
//       {renderJobCardsModal()}

//       {/* Send Notification Modal */}
//       <SendNotificationModal
//         isOpen={notificationOpen}
//         onClose={() => setNotificationOpen(false)}
//         selectedOwnerIds={selectedOwnerIds}
//         onSuccess={() => {}}
//       />

//       <div className="overflow-y-auto h-full pb-20 rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-4">
//         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
//           <h2 className="text-xl font-semibold">Auto Shop Owners</h2>
//           <div className="ml-auto flex gap-2">
//             {/* Send Custom Notification button */}
//             <button
//               type="button"
//               onClick={() => {
//                 if (!selectedOwnerIds.length) {
//                   alert("Select at least one shop owner to send notification.");
//                   return;
//                 }
//                 setNotificationOpen(true);
//               }}
//               disabled={loading}
//               className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center space-x-2"
//             >
//               <svg
//                 className="h-5 w-5 mr-2"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="2"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   d="M13 16h-1v-4h-1m0-4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
//                 />
//               </svg>
//               <span>
//                 Send Notification
//                 {selectedOwnerIds.length > 0
//                   ? ` (${selectedOwnerIds.length} selected)`
//                   : ""}
//               </span>
//             </button>
//             <button
//               type="button"
//               onClick={handleExport}
//               className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-2"
//               disabled={exporting || loading}
//             >
//               {exporting ? (
//                 <svg
//                   className="animate-spin mr-2 h-4 w-4 text-white"
//                   viewBox="0 0 24 24"
//                   fill="none"
//                 >
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//                   />
//                 </svg>
//               ) : (
//                 <svg
//                   className="h-5 w-5 mr-2"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M12 4v16m8-8H4"
//                   />
//                 </svg>
//               )}
//               <span>
//                 Export
//                 {selectedOwnerIds.length > 0
//                   ? ` (${selectedOwnerIds.length} selected)`
//                   : ""}
//                 (.csv)
//               </span>
//             </button>
//           </div>
//         </div>
//         {loading && (
//           <div className="py-10 text-center font-medium text-gray-600">
//             Loading shop owners...
//           </div>
//         )}
//         {error && (
//           <div className="py-10 text-center font-medium text-red-600">
//             Error: {error}
//           </div>
//         )}
//         {!loading && !error && (
//           <div className="max-w-full overflow-x-auto">
//             <Table>
//               <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
//                 <TableRow>
//                   <TableCell
//                     isHeader
//                     className="px-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
//                   >
//                     {/* Checkbox for select all */}
//                     <input
//                       type="checkbox"
//                       checked={isAllSelected}
//                       onChange={handleCheckAll}
//                       aria-label="Select all shop owners"
//                       data-testid="select-all-checkbox"
//                     />
//                   </TableCell>
//                   <TableCell
//                     isHeader
//                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
//                   >
//                     Name
//                   </TableCell>
//                   <TableCell
//                     isHeader
//                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
//                   >
//                     Email
//                   </TableCell>
//                   <TableCell
//                     isHeader
//                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
//                   >
//                     Phone
//                   </TableCell>
//                   <TableCell
//                     isHeader
//                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
//                   >
//                     Shop Name
//                   </TableCell>
//                   <TableCell
//                     isHeader
//                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
//                   >
//                     Shop Address
//                   </TableCell>
//                   <TableCell
//                     isHeader
//                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
//                   >
//                     Status
//                   </TableCell>
//                   <TableCell
//                     isHeader
//                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
//                   >
//                     Customers
//                   </TableCell>
//                   <TableCell
//                     isHeader
//                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
//                   >
//                     Deals
//                   </TableCell>
//                   <TableCell
//                     isHeader
//                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
//                   >
//                     Job Cards
//                   </TableCell>
//                   <TableCell
//                     isHeader
//                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
//                   >
//                     Created At
//                   </TableCell>
//                   <TableCell
//                     isHeader
//                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
//                   >
//                     Profile
//                   </TableCell>
//                   <TableCell
//                     isHeader
//                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
//                   >
//                     {/* New column for Enable/Suspend */}
//                     Action
//                   </TableCell>
//                 </TableRow>
//               </TableHeader>
//               <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
//                 {owners.length === 0 && (
//                   <TableRow>
//                     <TableCell
//                       className="text-center py-8 text-gray-400"
//                       isHeader={false}
//                     >
//                       No auto shop owners found.
//                     </TableCell>
//                   </TableRow>
//                 )}
//                 {owners.map((owner) => {
//                   const isSuspended = !!owner.isDisabled;
//                   const isLoading = !!actionLoadingMap[owner._id];
//                   const isChecked = selectedOwnerIds.includes(owner._id);
//                   return (
//                     <TableRow key={owner._id}>
//                       {/* Checkbox */}
//                       <TableCell className="px-3 py-3">
//                         <input
//                           type="checkbox"
//                           checked={isChecked}
//                           onChange={e =>
//                             handleCheckRow(owner._id, e.target.checked)
//                           }
//                           aria-label={`Select ${owner.name}`}
//                           data-testid={`select-owner-checkbox-${owner._id}`}
//                         />
//                       </TableCell>
//                       {/* Name */}
//                       <TableCell className="px-5 py-3 text-gray-800 text-theme-sm dark:text-white/90">
//                         <span className="block font-medium">{owner.name}</span>
//                       </TableCell>
//                       {/* Email */}
//                       <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
//                         {owner.email || "-"}
//                       </TableCell>
//                       {/* Phone */}
//                       <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
//                         {owner.countryCode ? `${owner.countryCode} ` : ""}
//                         {owner.phone || "-"}
//                       </TableCell>
//                       {/* Shop Name */}
//                       <TableCell className="px-5 py-3 text-gray-700 text-theme-sm dark:text-gray-200">
//                         {owner.businessProfile?.businessName || "-"}
//                       </TableCell>
//                       {/* Shop Address */}
//                       <TableCell className="px-5 py-3 text-gray-700 text-theme-sm dark:text-gray-200">
//                         {owner.businessProfile?.businessAddress || "-"}
//                       </TableCell>
//                       {/* Status: computed from fields */}
//                       <TableCell className="px-5 py-3 text-theme-sm">
//                         <Badge size="sm" color={getStatusColor(owner) as any}>
//                           {getStatus(owner)}
//                         </Badge>
//                       </TableCell>
//                       {/* My Customers: count (clickable for modal) */}
//                       <TableCell className="px-5 py-3 text-theme-sm">
//                         <button
//                           type="button"
//                           onClick={() => {
//                             setModalOwner(owner);
//                             setCustomerModalOpen(true);
//                           }}
//                           className="text-blue-600 hover:underline focus:outline-none font-medium"
//                           aria-label={`View customers for ${owner.name}`}
//                         >
//                           {owner.myCustomers && owner.myCustomers.length
//                             ? owner.myCustomers.length
//                             : "0"}
//                         </button>
//                       </TableCell>
//                       {/* Deals: count (clickable for modal) */}
//                       <TableCell className="px-5 py-3 text-theme-sm">
//                         <button
//                           type="button"
//                           onClick={() => {
//                             setModalOwner(owner);
//                             setDealsModalOpen(true);
//                           }}
//                           className="text-blue-600 hover:underline focus:outline-none font-medium"
//                           aria-label={`View deals for ${owner.name}`}
//                         >
//                           {owner.deals && owner.deals.length
//                             ? owner.deals.length
//                             : "0"}
//                         </button>
//                       </TableCell>
//                       {/* Job Cards: count (clickable for modal) */}
//                       <TableCell className="px-5 py-3 text-theme-sm">
//                         <button
//                           type="button"
//                           onClick={() => {
//                             setModalOwner(owner);
//                             setJobCardsModalOpen(true);
//                           }}
//                           className="text-blue-600 hover:underline focus:outline-none font-medium"
//                           aria-label={`View job cards for ${owner.name}`}
//                         >
//                           {owner.jobCards && owner.jobCards.length
//                             ? owner.jobCards.length
//                             : "0"}
//                         </button>
//                       </TableCell>
//                       {/* Created At */}
//                       <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
//                         {owner.createdAt
//                           ? new Date(owner.createdAt).toLocaleString()
//                           : "-"}
//                       </TableCell>
//                       {/* Profile/Team: button */}
//                       <TableCell className="px-5 py-3 text-theme-sm">
//                         <button
//                           type="button"
//                           onClick={() => {
//                             setModalOwner(owner);
//                             setProfileModalOpen(true);
//                           }}
//                           className="text-blue-600 hover:underline focus:outline-none font-medium"
//                           aria-label={`View business profile for ${owner.name}`}
//                         >
//                           View
//                         </button>
//                       </TableCell>
//                       {/* Enable/Suspend */}
//                       <TableCell className="px-5 py-3 text-theme-sm">
//                         <button
//                           type="button"
//                           disabled={isLoading}
//                           className={`inline-flex items-center space-x-2 font-medium rounded px-3 py-1 ${
//                             isSuspended
//                               ? "bg-green-100 text-green-700 hover:bg-green-200"
//                               : "bg-red-100 text-red-700 hover:bg-red-200"
//                           } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
//                           onClick={() =>
//                             changeAutoShopOwnerStatus(
//                               owner._id,
//                               isSuspended ? "enable" : "disable"
//                             )
//                           }
//                           aria-label={
//                             isSuspended
//                               ? `Enable ${owner.name}`
//                               : `Suspend ${owner.name}`
//                           }
//                         >
//                           {isLoading ? (
//                             <svg
//                               className="animate-spin h-4 w-4 mr-1 text-gray-500"
//                               viewBox="0 0 24 24"
//                             >
//                               <circle
//                                 className="opacity-30"
//                                 cx="12"
//                                 cy="12"
//                                 r="10"
//                                 stroke="currentColor"
//                                 strokeWidth="4"
//                                 fill="none"
//                               />
//                               <path
//                                 className="opacity-90"
//                                 fill="currentColor"
//                                 d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
//                               />
//                             </svg>
//                           ) : null}
//                           <span>
//                             {isSuspended ? "Enable" : "Suspend"}
//                           </span>
//                         </button>
                        
//                       </TableCell>
//                     </TableRow>
//                   );
//                 })}
//               </TableBody>
//             </Table>
//           </div>
//         )}
//       </div>
//     </>
//   );
// };

// export default AutoShopOwners;

import React, { useState, useEffect } from "react";
import axios from "axios";

// ====================
// Types
// ====================
type SubService = { subService: string };
type IndividualService = { name: string; desc?: string; price?: number; _id: string };
type Service = { _id: string; name?: string; desc?: string; services?: IndividualService[]; [k: string]: any };
type MyService = { service: Service; subServices?: SubService[]; [k: string]: any };
type TeamMemberType = { _id: string; name: string; email?: string; phone?: string; designation?: string; photo?: string };

type BusinessProfileType = {
  _id: string; businessName?: string; businessAddress?: string; pincode?: string; city?: string;
  businessPhone?: string; businessEmail?: string; businessHSTNumber?: string; openHours?: string;
  openDays?: string[]; businessLogo?: string; myServices?: MyService[]; myDeals?: (string | DealType)[];
  teamMembers?: TeamMemberType[]; businessMapLocation?: any; isOpen?: boolean; rating?: number;
  reviewCount?: number; reviewDate?: string; websiteUrl?: string; createdAt?: string; updatedAt?: string;
  [k: string]: any;
};

type CustomerType = { _id: string; name?: string; email?: string; phone?: string };

type DealType = {
  _id: string; name: string; description?: string; value: string; percentageDiscount: number;
  dealEnabled: boolean; createdAt?: string; endDate?: string; couponCode?: string; startDate?: string;
  additionalDetails?: string; valueId?: string; createdBy?: string; upto?: number; updatedAt?: string;
};

type JobCardDealAppliedType = { name: string; percentageDiscount?: number; dealCode?: string };
type JobCardServiceSubServiceType = { id: string; price?: number; discountedPrice?: number; discountAmount?: number };
type JobCardServiceType = { id: string; subServices: JobCardServiceSubServiceType[] };

type JobCardType = {
  _id: string; jobNo: string; business: string; customerId: string; vehicleId: string;
  odometerReading: number; issueDescription: string; serviceType: string; priorityLevel: string;
  services: JobCardServiceType[]; additionalNotes?: string; vehiclePhotos: string[];
  dealApplied?: JobCardDealAppliedType; totalPayableAmount: number; paymentStatus: string;
  technicalRemarks?: string; createdAt?: string; updatedAt?: string;
};

type AutoShopOwnerType = {
  _id: string; name: string; email?: string; countryCode?: string; phone?: string;
  pincode?: string; address?: string; isDisabled?: boolean; isProfileComplete?: boolean;
  isBusinessProfileCompleted?: boolean; businessProfile?: BusinessProfileType | null;
  myCustomers?: CustomerType[]; createdAt?: string; deals?: DealType[]; jobCards?: JobCardType[];
};

// ─── STATUS HELPERS ────────────────────────────────────────────────────────────
function getStatus(owner: AutoShopOwnerType) {
  if (owner.isDisabled) return "Suspended";
  if (owner.isProfileComplete && (owner.isBusinessProfileCompleted ?? owner.businessProfile)) return "Active";
  if (!owner.isProfileComplete) return "Incomplete";
  return "Unknown";
}
function getStatusStyle(owner: AutoShopOwnerType): React.CSSProperties {
  const s = getStatus(owner);
  if (s === "Suspended") return { background: "#fcf8e3", color: "#8a6d3b", border: "1px solid #faebcc" };
  if (s === "Active") return { background: "#dff0d8", color: "#3c763d", border: "1px solid #d6e9c6" };
  return { background: "#f2dede", color: "#a94442", border: "1px solid #ebccd1" };
}

// ─── EXPORT HELPERS ────────────────────────────────────────────────────────────
function toCsv(data: string[][], headers: string[]): string {
  const esc = (val: any) => { if (val == null) return ""; let s = String(val); if (/[,"\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"'; return s; };
  return headers.map(esc).join(",") + "\n" + data.map((row) => row.map(esc).join(",")).join("\n");
}
function downloadAsFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function autoShopOwnersToCsvRows(owners: AutoShopOwnerType[]): [string[], string[][]] {
  const headers = ["Name","Email","Phone","Shop Name","Shop Address","Shop City","Pincode","Status","Customers Count","Deals Count","JobCards Count","Created At","Profile Complete","Business Profile Complete"];
  const rows = owners.map((o) => [
    o.name ?? "", o.email ?? "",
    (o.countryCode ? o.countryCode + " " : "") + (o.phone ?? ""),
    o.businessProfile?.businessName ?? "", o.businessProfile?.businessAddress ?? "",
    o.businessProfile?.city ?? "", o.businessProfile?.pincode ?? "",
    getStatus(o),
    o.myCustomers ? o.myCustomers.length.toString() : "0",
    o.deals ? o.deals.length.toString() : "0",
    o.jobCards ? o.jobCards.length.toString() : "0",
    o.createdAt ? new Date(o.createdAt).toLocaleString() : "",
    o.isProfileComplete ? "Yes" : "No",
    (o.isBusinessProfileCompleted ?? !!o.businessProfile) ? "Yes" : "No",
  ]);
  return [headers, rows];
}

// ─── MODAL (AdminLTE style) ────────────────────────────────────────────────────
type ModalProps = { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean };
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, wide }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div style={{ background: "#fff", borderRadius: 4, width: wide ? "min(1100px, 96vw)" : "min(760px, 94vw)", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 5px 15px rgba(0,0,0,.5)" }}>
        <div style={{ background: "#3c8dbc", color: "#fff", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "4px 4px 0 0", flexShrink: 0 }}>
          <span style={{ fontWeight: 600, fontSize: 16 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: 22, lineHeight: 1, cursor: "pointer", padding: "0 2px" }} aria-label="Close" type="button">×</button>
        </div>
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
};

// ─── SHOP OVERVIEW CARD (UNCHANGED) ───────────────────────────────────────────
const ShopOverviewCard: React.FC<{ shopData: BusinessProfileType }> = ({ shopData = {} as BusinessProfileType }) => {
  const { businessPhone = "289 274 8591", businessName = "Auto 27 Car Garage", businessAddress = "2 Fisherman Dr - Unit 9", openHours = "9:00 AM - 6:00 PM", isOpen = true, myServices = [], businessLogo, businessEmail = "", websiteUrl = "#", businessMapLocation, pincode, rating = 4.8, reviewCount = 142, reviewDate = "01 / 2026" } = shopData || {};
  const city = shopData.city || "Brampton, ON L7A 1B5";
  let openDays = "Mon - Sat";
  if (shopData.openDays) {
    if (Array.isArray(shopData.openDays)) {
      if (shopData.openDays.length === 1 && typeof shopData.openDays[0] === "string" && shopData.openDays[0].trim().startsWith("[")) {
        try { openDays = JSON.parse(shopData.openDays[0]).join(", "); } catch { openDays = shopData.openDays.join(", "); }
      } else { openDays = shopData.openDays.join(", "); }
    } else { openDays = shopData.openDays as any; }
  }
  let services: string[] = [];
  if (Array.isArray(myServices) && myServices.length > 0) {
    for (const item of myServices) { if (item?.service?.name) services.push(item.service.name); }
  }
  if (services.length === 0) services = ["General Repair","Diagnose - Paccer","Diagnose - Communis","Safety On-line","Oil Change","Brake Service"];
  const servicesToShow = services.slice(0, 6);
  let imageUrl = businessLogo && typeof businessLogo === "string" ? (businessLogo.startsWith("http") ? businessLogo : `${import.meta.env.VITE_IMAGE_URL ?? ""}/${businessLogo}`) : "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?q=80&w=1200&auto=format&fit=crop";
  let directionsUrl = "#";
  if (businessMapLocation?.lat && businessMapLocation?.lng) directionsUrl = `https://www.google.com/maps/search/?api=1&query=${businessMapLocation.lat},${businessMapLocation.lng}`;
  let webUrl = websiteUrl && websiteUrl !== "#" ? websiteUrl : businessEmail ? `mailto:${businessEmail}` : "#";

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] mb-7">
      <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: "minmax(0,1.15fr) minmax(0,0.72fr) minmax(0,0.72fr) minmax(0,1.65fr) minmax(52px,0.55fr)", minHeight: 48 }}>
        <div className="flex items-center justify-center border-r border-slate-200 bg-emerald-50 px-2 py-2 text-center text-[13px] font-bold text-emerald-800"><span className="truncate">📞 {businessPhone}</span></div>
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center border-r border-slate-200 bg-sky-50 text-[13px] font-semibold text-blue-600 no-underline transition-colors hover:bg-sky-100">Directions</a>
        <a href={webUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center border-r border-slate-200 bg-slate-50 text-[13px] font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-100">Website</a>
        <div className="flex min-w-0 items-center justify-between gap-2 border-r border-slate-200 bg-white px-3 py-2">
          <div className="flex shrink-0 items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${isOpen ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className={`whitespace-nowrap text-[12px] font-semibold ${isOpen ? "text-emerald-700" : "text-red-600"}`}>{isOpen ? "OPEN NOW" : "CLOSED"}</span>
          </div>
          <div className="text-right text-[11px] leading-snug text-slate-500"><div className="whitespace-nowrap">{openDays}</div><div className="whitespace-nowrap">{openHours}</div></div>
        </div>
        <div className="flex items-center justify-center gap-1 bg-amber-50 text-[15px] font-bold text-slate-900"><span className="text-amber-500">★</span>{rating}</div>
      </div>
      <div className="grid items-start gap-5 p-5" style={{ gridTemplateColumns: "minmax(120px,150px) minmax(0,1.25fr) minmax(0,1.1fr) minmax(100px,118px)" }}>
        <img src={imageUrl} alt={businessName} className="h-[108px] w-full rounded-lg object-cover" />
        <div className="min-w-0">
          <h2 className="mb-1.5 text-xl font-bold leading-tight text-slate-900">{businessName}</h2>
          <p className="mb-3 text-[13px] leading-relaxed text-slate-600">{businessAddress}<br />{city}{pincode && <><br />Pincode: {pincode}</>}</p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">{isOpen ? "Open" : "Closed"}</span>
            <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] text-blue-700">{openDays}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600">{openHours}</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="mb-2.5 text-[13px] font-bold text-slate-900">Services</p>
          <ul className="grid list-none gap-x-4 gap-y-1.5 p-0" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
            {servicesToShow.map((service, index) => (
              <li key={`${service}-${index}`} className="flex min-w-0 items-start gap-1.5 text-[12px] leading-snug text-slate-600">
                <span className="mt-px shrink-0 font-bold text-emerald-500">✓</span>
                <span className="min-w-0">{service}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-3 text-center">
          <span className="text-[26px] font-bold leading-none text-slate-900">{rating}</span>
          <span className="mt-1 text-[13px] tracking-wide text-amber-500">★★★★★</span>
          <span className="mt-1.5 text-[11px] text-slate-500">{reviewCount} Reviews</span>
          <span className="mt-0.5 text-[10px] text-slate-400">{reviewDate}</span>
        </div>
      </div>
      <div className="grid items-center gap-2 bg-slate-900 px-4 py-2.5 text-[12px] text-white" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1.6fr) minmax(0,1fr)" }}>
        <span className="truncate font-medium">{businessName}</span>
        <span className="truncate text-center text-slate-200">{businessAddress} • {city}</span>
        <span className="truncate text-right text-slate-200">{openDays} | {openHours}</span>
      </div>
    </div>
  );
};

// ─── SEND NOTIFICATION MODAL ──────────────────────────────────────────────────
const SendNotificationModal: React.FC<{
  isOpen: boolean; onClose: () => void; selectedOwnerIds: string[]; onSuccess: () => void;
}> = ({ isOpen, onClose, selectedOwnerIds, onSuccess }) => {
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null); const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => { setTitle(""); setBody(""); setError(null); setSuccessMsg(null); setSending(false); };
  const handleClose = () => { resetForm(); onClose(); };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setSuccessMsg(null);
    if (!title.trim() || !body.trim()) { setError("Please provide both title and message body"); return; }
    if (!selectedOwnerIds.length) { setError("No shop owners selected."); return; }
    setSending(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/notification/custom/send`, { userType: "autoshopowner", userIds: selectedOwnerIds, title, message: body });
      if (res.data.success) { setSuccessMsg("Notification sent successfully!"); onSuccess(); setTimeout(handleClose, 1500); }
      else setError(res.data.message || "Failed to send notification");
    } catch (err: any) { setError(err?.response?.data?.message || err?.message || "Failed to send notification"); }
    finally { setSending(false); }
  };

  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send Custom Notification">
      <form onSubmit={handleSend}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Notification Title <span style={{ color: "#e73d3d" }}>*</span>
          </label>
          <input style={{ width: "100%", border: "1px solid #d2d6de", borderRadius: 3, padding: "7px 10px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            value={title} onChange={e => setTitle(e.target.value)} maxLength={80} required disabled={sending} placeholder="Eg. Important update for your shop account" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Notification Body <span style={{ color: "#e73d3d" }}>*</span>
          </label>
          <textarea style={{ width: "100%", border: "1px solid #d2d6de", borderRadius: 3, padding: "7px 10px", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", minHeight: 90 }}
            value={body} onChange={e => setBody(e.target.value)} maxLength={240} required disabled={sending} placeholder="Write your message to send to selected shop owners..." />
        </div>
        <div style={{ fontSize: 13, color: "#2575c4", marginBottom: 10 }}>
          To: <strong>{selectedOwnerIds.length} shop owner{selectedOwnerIds.length !== 1 ? "s" : ""} selected</strong>
        </div>
        {error && <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 10, background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, padding: "7px 10px" }}>{error}</div>}
        {successMsg && <div style={{ color: "#27ae60", fontSize: 13, marginBottom: 10, background: "#f0fff4", border: "1px solid #c3e6cb", borderRadius: 3, padding: "7px 10px" }}>{successMsg}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
          <button type="button" onClick={handleClose} disabled={sending} style={{ padding: "7px 18px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#444", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button type="submit" disabled={sending} style={{ padding: "7px 20px", borderRadius: 3, border: "none", background: sending ? "#aaa" : "#00a65a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: sending ? "not-allowed" : "pointer" }}>
            {sending ? "Sending…" : `Send to ${selectedOwnerIds.length} owner${selectedOwnerIds.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── JOB CARD DETAIL MODAL ────────────────────────────────────────────────────
const JobCardDetailModal: React.FC<{
  isOpen: boolean; onClose: () => void; card: JobCardType | null; owner: AutoShopOwnerType | null; UPLOADS_URL: string;
}> = ({ isOpen, onClose, card, owner, UPLOADS_URL }) => {
  if (!isOpen || !card || !owner) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Job Card — ${card.jobNo || card._id}`}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, marginBottom: 16 }}>
        {[
          ["Job No.", card.jobNo || card._id],
          ["Date", card.createdAt ? new Date(card.createdAt).toLocaleString() : "-"],
          ["Owner", owner.name],
          ["Phone", (owner.countryCode ? owner.countryCode + " " : "") + (owner.phone || "-")],
          ["Business", card.business],
          ["Vehicle ID", card.vehicleId],
          ["Odometer", card.odometerReading],
          ["Service Type", card.serviceType],
          ["Priority", card.priorityLevel],
          ["Payment Status", card.paymentStatus],
          ["Total Payable", `₹${card.totalPayableAmount}`],
          ["Issue", card.issueDescription],
          ["Notes", card.additionalNotes || "-"],
          ["Technical Remarks", card.technicalRemarks || "-"],
          ["Deal Applied", card.dealApplied ? `${card.dealApplied.name} (${card.dealApplied.dealCode ?? ""}${card.dealApplied.percentageDiscount != null ? ` - ${card.dealApplied.percentageDiscount}%` : ""})` : "-"],
        ].map(([label, value]) => (
          <div key={label as string} style={{ borderBottom: "1px solid #f4f4f4", paddingBottom: 6 }}>
            <span style={{ fontWeight: 600 }}>{label}:</span>{" "}
            <span style={{ color: "#555" }}>{value as string}</span>
          </div>
        ))}
      </div>
      {/* Vehicle Photos */}
      {card.vehiclePhotos && card.vehiclePhotos.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Vehicle Photos</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {card.vehiclePhotos.map((photoUrl, idx) => (
              <img key={idx} src={photoUrl.startsWith("http") ? photoUrl : `${UPLOADS_URL ?? ""}/${photoUrl.replace(/^\/+/, "")}`} alt="Vehicle" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 3, border: "1px solid #d2d6de" }} loading="lazy" />
            ))}
          </div>
        </div>
      )}
      {/* Services */}
      {Array.isArray(card.services) && card.services.length > 0 && (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Services</div>
          <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12 }}>
            {card.services.map((serv, sidx) => (
              <li key={serv.id + "-" + sidx} style={{ marginBottom: 6 }}>
                <div>Service ID: <span style={{ fontFamily: "monospace" }}>{serv.id}</span></div>
                {Array.isArray(serv.subServices) && serv.subServices.length > 0 && (
                  <ul style={{ paddingLeft: 16, margin: "4px 0 0" }}>
                    {serv.subServices.map((ss, ssidx) => (
                      <li key={ss.id + "-" + ssidx}>
                        SubService: <span style={{ fontFamily: "monospace" }}>{ss.id}</span>
                        {typeof ss.price !== "undefined" && <span> | ₹{ss.price}</span>}
                        {typeof ss.discountedPrice !== "undefined" && ss.discountedPrice !== ss.price && <span style={{ color: "#27ae60", marginLeft: 6 }}>After Discount: ₹{ss.discountedPrice}</span>}
                        {typeof ss.discountAmount !== "undefined" && ss.discountAmount > 0 && <span style={{ color: "#e74c3c", marginLeft: 6 }}>(Discount: ₹{ss.discountAmount})</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
};

// ─── SHARED TABLE STYLES ──────────────────────────────────────────────────────
const thStyle: React.CSSProperties = { border: "1px solid #d2d6de", background: "#f9fafc", padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 13, color: "#333", whiteSpace: "nowrap" };
const tdStyle: React.CSSProperties = { border: "1px solid #d2d6de", padding: "10px 12px", fontSize: 13, color: "#555", verticalAlign: "middle" };
const linkBtnStyle: React.CSSProperties = { background: "none", border: "none", color: "#0073b7", cursor: "pointer", padding: 0, fontSize: 12, textDecoration: "underline", fontWeight: 500 };
const pageBtn = (active: boolean, disabled: boolean): React.CSSProperties => ({ border: "1px solid", borderColor: active ? "#0073b7" : "#ddd", background: active ? "#0073b7" : "#fff", color: active ? "#fff" : disabled ? "#bbb" : "#777", padding: "6px 13px", fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", marginLeft: -1 });

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const AutoShopOwners: React.FC = () => {
  const [owners, setOwners] = useState<AutoShopOwnerType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [dealsModalOpen, setDealsModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [jobCardsModalOpen, setJobCardsModalOpen] = useState(false);
  const [modalOwner, setModalOwner] = useState<AutoShopOwnerType | null>(null);
  const [jobCardDetailModalOpen, setJobCardDetailModalOpen] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState<JobCardType | null>(null);

  // Actions
  const [actionLoadingMap, setActionLoadingMap] = useState<{ [id: string]: boolean }>({});
  const [exporting, setExporting] = useState(false);
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL;

  const fetchOwners = async () => {
    setLoading(true); setError("");
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/autoshopowners`);
      if (res.data.success && Array.isArray(res.data.data)) setOwners(res.data.data);
      else setError("Failed to fetch auto shop owners");
    } catch (err: any) { setError(err?.response?.data?.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  const changeAutoShopOwnerStatus = async (ownerId: string, action: "enable" | "disable") => {
    setActionLoadingMap((prev) => ({ ...prev, [ownerId]: true }));
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/autoshopowners/toggle-status`, { userId: ownerId, disable: action === "disable" });
      if (res.data.success) await fetchOwners();
      else alert("Failed to update status");
    } catch (err: any) { alert(err?.response?.data?.message || `Failed to ${action} shop owner.`); }
    finally { setActionLoadingMap((prev) => ({ ...prev, [ownerId]: false })); }
  };

  const handleExport = async () => {
    if (!selectedOwnerIds.length) { alert("Please select at least one row to export."); return; }
    setExporting(true);
    try {
      const dataToExport = owners.filter((o) => selectedOwnerIds.includes(o._id));
      const [headers, rows] = autoShopOwnersToCsvRows(dataToExport);
      downloadAsFile(`autoshop-owners-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, headers));
    } catch { alert("Failed to export data."); }
    finally { setExporting(false); }
  };

  // Selection helpers
  const isAllPageSelected = (paginated: AutoShopOwnerType[]) => paginated.length > 0 && paginated.every((o) => selectedOwnerIds.includes(o._id));
  const handleCheckAll = (paginated: AutoShopOwnerType[], checked: boolean) => {
    setSelectedOwnerIds((prev) => {
      const ids = paginated.map((o) => o._id);
      if (checked) return Array.from(new Set([...prev, ...ids]));
      return prev.filter((id) => !ids.includes(id));
    });
  };
  const handleCheckRow = (ownerId: string, checked: boolean) => {
    setSelectedOwnerIds((prev) => checked ? [...prev, ownerId] : prev.filter((id) => id !== ownerId));
  };

  useEffect(() => { fetchOwners(); }, []);

  // Filtering + pagination
  const filtered = owners.filter((o) => {
    const q = search.toLowerCase();
    return (o.name || "").toLowerCase().includes(q) || (o.email || "").toLowerCase().includes(q) || (o.phone || "").toLowerCase().includes(q) || (o.businessProfile?.businessName || "").toLowerCase().includes(q) || (o.businessProfile?.businessAddress || "").toLowerCase().includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ─── BUSINESS PROFILE MODAL ────────────────────────────────────────────────
  const renderBusinessProfileModal = () => {
    if (!modalOwner || !modalOwner.businessProfile) return null;
    const bp = modalOwner.businessProfile;

    const renderNestedServices = () => {
      if (!Array.isArray(bp.myServices) || bp.myServices.length === 0) return <div style={{ color: "#aaa", fontSize: 13 }}>No services listed</div>;
      const serviceMap: { [id: string]: { service: Service; subServiceIds: string[] } } = {};
      bp.myServices.forEach((ms: MyService) => {
        if (!ms.service || !ms.service._id) return;
        if (!serviceMap[ms.service._id]) serviceMap[ms.service._id] = { service: ms.service, subServiceIds: [] };
        if (Array.isArray(ms.subServices)) serviceMap[ms.service._id].subServiceIds.push(...ms.subServices.map((ss) => ss.subService));
      });
      return (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {Object.values(serviceMap).map(({ service, subServiceIds }) => (
            <li key={service._id} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#333", marginBottom: 4 }}>{service.name || "-"}</div>
              <div style={{ paddingLeft: 14 }}>
                {service.services && service.services.length > 0 ? (
                  <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12 }}>
                    {service.services.filter((ss) => subServiceIds.length === 0 || subServiceIds.includes(ss._id)).map((ss) => (
                      <li key={ss._id}>{ss.name}{ss.desc && <span style={{ color: "#888", marginLeft: 6 }}>{ss.desc}</span>}</li>
                    ))}
                  </ul>
                ) : <span style={{ color: "#aaa", fontSize: 12 }}>-</span>}
              </div>
            </li>
          ))}
        </ul>
      );
    };

    return (
      <Modal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} title={`Business Profile — ${bp.businessName || "-"}`} wide>
        <ShopOverviewCard shopData={bp} />
        <div style={{ marginTop: 20 }}>
          {/* Team Members */}
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom: "2px solid #3c8dbc", paddingBottom: 6, color: "#3c8dbc" }}>Team Members</div>
          {Array.isArray(bp.teamMembers) && bp.teamMembers.length > 0 ? (
            <div style={{ overflowX: "auto", marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Photo","Name","Email","Phone","Designation"].map((h) => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {bp.teamMembers.map((tm: TeamMemberType) => (
                    <tr key={tm._id}>
                      <td style={tdStyle}>{tm.photo ? <img src={tm.photo.startsWith("http") ? tm.photo : `${import.meta.env.VITE_IMAGE_URL ?? ""}/${tm.photo}`} alt="Team" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} /> : <span style={{ display: "block", width: 36, height: 36, borderRadius: "50%", background: "#ddd" }} />}</td>
                      <td style={tdStyle}>{tm.name}</td>
                      <td style={tdStyle}>{tm.email || "-"}</td>
                      <td style={tdStyle}>{tm.phone || "-"}</td>
                      <td style={tdStyle}>{tm.designation || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div style={{ color: "#aaa", fontSize: 13, marginBottom: 20 }}>No team members</div>}

          {/* Services */}
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom: "2px solid #3c8dbc", paddingBottom: 6, color: "#3c8dbc" }}>Services</div>
          <div style={{ marginBottom: 20 }}>{renderNestedServices()}</div>

          {/* Deals */}
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom: "2px solid #3c8dbc", paddingBottom: 6, color: "#3c8dbc" }}>My Deals</div>
          {Array.isArray(bp.myDeals) && bp.myDeals.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>{["Name","Description","Discount %","Coupon","Enabled","Valid From","Ends"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {bp.myDeals.map((deal: any) => {
                    if (typeof deal === "string") return <tr key={deal}><td style={tdStyle} colSpan={7}>{deal}</td></tr>;
                    return (
                      <tr key={deal._id ?? deal.name}>
                        <td style={tdStyle}>{deal.name || "-"}</td>
                        <td style={{ ...tdStyle, maxWidth: 200 }}>{deal.description || "-"}</td>
                        <td style={tdStyle}>{deal.percentageDiscount ?? 0}%</td>
                        <td style={tdStyle}>{deal.couponCode || "-"}</td>
                        <td style={tdStyle}><span style={{ fontWeight: 600, color: deal.dealEnabled ? "#27ae60" : "#e74c3c" }}>{deal.dealEnabled ? "Yes" : "No"}</span></td>
                        <td style={tdStyle}>{deal.startDate ? new Date(deal.startDate).toLocaleDateString() : "-"}</td>
                        <td style={tdStyle}>{deal.endDate ? new Date(deal.endDate).toLocaleDateString() : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <div style={{ color: "#aaa", fontSize: 13 }}>No shop deals linked</div>}
        </div>
      </Modal>
    );
  };

  // ─── CUSTOMERS MODAL ──────────────────────────────────────────────────────
  const renderCustomersModal = () => {
    if (!modalOwner) return null;
    return (
      <Modal isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} title={`Customers — ${modalOwner.name}`}>
        {modalOwner.myCustomers && modalOwner.myCustomers.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr>{["Name","Email","Phone"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {modalOwner.myCustomers.map((cust) => (
                  <tr key={cust._id}>
                    <td style={tdStyle}>{cust.name || "-"}</td>
                    <td style={tdStyle}>{cust.email || "-"}</td>
                    <td style={tdStyle}>{cust.phone || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div style={{ textAlign: "center", color: "#aaa", padding: "30px 0" }}>No customers found.</div>}
      </Modal>
    );
  };

  // ─── DEALS MODAL ──────────────────────────────────────────────────────────
  const renderDealsModal = () => {
    if (!modalOwner) return null;
    return (
      <Modal isOpen={dealsModalOpen} onClose={() => setDealsModalOpen(false)} title={`Deals — ${modalOwner.name}`} wide>
        {modalOwner.deals && modalOwner.deals.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr>{["Name","Description","Discount %","Coupon","Enabled","Valid From","Ends","Details"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {modalOwner.deals.map((deal) => (
                  <tr key={deal._id}>
                    <td style={tdStyle}>{deal.name}</td>
                    <td style={{ ...tdStyle, maxWidth: 180 }}>{deal.description || "-"}</td>
                    <td style={tdStyle}>{deal.percentageDiscount ?? 0}%</td>
                    <td style={tdStyle}>{deal.couponCode || "-"}</td>
                    <td style={tdStyle}><span style={{ fontWeight: 600, color: deal.dealEnabled ? "#27ae60" : "#e74c3c" }}>{deal.dealEnabled ? "Yes" : "No"}</span></td>
                    <td style={tdStyle}>{deal.startDate ? new Date(deal.startDate).toLocaleDateString() : "-"}</td>
                    <td style={tdStyle}>{deal.endDate ? new Date(deal.endDate).toLocaleDateString() : "-"}</td>
                    <td style={{ ...tdStyle, maxWidth: 160 }}>{deal.additionalDetails || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div style={{ textAlign: "center", color: "#aaa", padding: "30px 0" }}>No deals found.</div>}
      </Modal>
    );
  };

  // ─── JOB CARDS MODAL ──────────────────────────────────────────────────────
  const renderJobCardsModal = () => {
    if (!modalOwner) return null;
    return (
      <Modal isOpen={jobCardsModalOpen} onClose={() => setJobCardsModalOpen(false)} title={`Job Cards — ${modalOwner.name}`} wide>
        {modalOwner.jobCards && modalOwner.jobCards.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>{["Job Card No.","Date","Phone Number","Name"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {modalOwner.jobCards.map((card: JobCardType) => (
                  <tr key={card._id} style={{ cursor: "pointer" }}
                    onClick={() => { setSelectedJobCard(card); setJobCardDetailModalOpen(true); }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f0f7ff")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                  >
                    <td style={{ ...tdStyle, color: "#0073b7", fontWeight: 600 }}>{card.jobNo}</td>
                    <td style={tdStyle}>{card.createdAt ? new Date(card.createdAt).toLocaleString() : "-"}</td>
                    <td style={tdStyle}>{modalOwner.countryCode ? `${modalOwner.countryCode} ` : ""}{modalOwner.phone || "-"}</td>
                    <td style={tdStyle}>{modalOwner.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <JobCardDetailModal isOpen={jobCardDetailModalOpen} onClose={() => { setJobCardDetailModalOpen(false); setSelectedJobCard(null); }} card={selectedJobCard} owner={modalOwner} UPLOADS_URL={UPLOADS_URL} />
          </div>
        ) : <div style={{ textAlign: "center", color: "#aaa", padding: "30px 0" }}>No job cards found.</div>}
      </Modal>
    );
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Modals */}
      {renderBusinessProfileModal()}
      {renderCustomersModal()}
      {renderDealsModal()}
      {renderJobCardsModal()}
      <SendNotificationModal isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} selectedOwnerIds={selectedOwnerIds} onSuccess={() => {}} />

      {/* Page */}
      <div
        // You may use Tailwind class if setup, or fallback to CSS below.
        className="h-[92vh] overflow-y-auto bg-[#f0f0f0] px-6 py-5 font-sans"
      
      >
        {/* Heading */}
        <h1 style={{ fontSize: 34, fontWeight: 300, color: "#333", marginBottom: 20, marginTop: 0 }}>
          Auto Shop Owners
        </h1>

        {/* Card */}
        <div className="mb-10" style={{ background: "#fff", border: "1px solid #d2d6de", borderRadius: 3, boxShadow: "0 1px 1px rgba(0,0,0,.1)" }}>

          {/* Card Header */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #f4f4f4", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 400, color: "#444" }}>Shop Owner List</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {selectedOwnerIds.length > 0 && (
                <span style={{ fontSize: 12, color: "#777" }}>{selectedOwnerIds.length} selected</span>
              )}
              <button
                type="button"
                onClick={() => { if (!selectedOwnerIds.length) { alert("Select at least one shop owner to send notification."); return; } setNotificationOpen(true); }}
                style={{ padding: "6px 14px", borderRadius: 3, border: "none", fontSize: 13, background: "#0073b7", color: "#fff", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                ✉ Send Notification
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                style={{ padding: "6px 14px", borderRadius: 3, border: "none", fontSize: 13, background: exporting ? "#aaa" : "#00a65a", color: "#fff", fontWeight: 600, cursor: exporting ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
              >
                ↓ Export (.csv)
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div style={{ padding: 20 }}>

            {/* Top Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#333" }}>
                <span>Show</span>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  style={{ height: 34, border: "1px solid #d2d6de", borderRadius: 3, padding: "0 10px", fontSize: 14, outline: "none" }}>
                  {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>entries</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#333" }}>
                <span>Search:</span>
                <input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  style={{ height: 34, width: 190, border: "1px solid #d2d6de", borderRadius: 3, padding: "0 10px", fontSize: 14, outline: "none" }} />
              </div>
            </div>

            {/* States */}
            {loading && <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontSize: 14 }}>Loading shop owners…</div>}
            {error && <div style={{ textAlign: "center", padding: "30px 0", color: "#c0392b", fontSize: 14 }}>Error: {error}</div>}

            {/* Table */}
            {!loading && !error && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>
                        <input type="checkbox" checked={isAllPageSelected(paginated)} onChange={(e) => handleCheckAll(paginated, e.target.checked)} aria-label="Select all" />
                      </th>
                      {["Name","Email","Phone","Shop Name","Shop Address","Status","Customers","Deals","Job Cards","Created At","Profile","Action"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 && (
                      <tr><td colSpan={13} style={{ ...tdStyle, textAlign: "center", color: "#aaa", padding: "36px 0" }}>No auto shop owners found.</td></tr>
                    )}
                    {paginated.map((owner) => {
                      const isSuspended = !!owner.isDisabled;
                      const isLoading = !!actionLoadingMap[owner._id];
                      const isChecked = selectedOwnerIds.includes(owner._id);
                      return (
                        <tr key={owner._id} style={{ background: isChecked ? "#f0f7ff" : undefined }}>
                          <td style={tdStyle}>
                            <input type="checkbox" checked={isChecked} onChange={(e) => handleCheckRow(owner._id, e.target.checked)} aria-label={`Select ${owner.name}`} />
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 500 }}>{owner.name}</td>
                          <td style={tdStyle}>{owner.email || "-"}</td>
                          <td style={tdStyle}>{owner.countryCode ? `${owner.countryCode} ` : ""}{owner.phone || "-"}</td>
                          <td style={tdStyle}>{owner.businessProfile?.businessName || "-"}</td>
                          <td style={tdStyle}>{owner.businessProfile?.businessAddress || "-"}</td>
                          <td style={tdStyle}>
                            <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 3, fontSize: 12, fontWeight: 600, ...getStatusStyle(owner) }}>
                              {getStatus(owner)}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <button type="button" onClick={() => { setModalOwner(owner); setCustomerModalOpen(true); }} style={linkBtnStyle}>
                              {owner.myCustomers?.length ?? 0}
                            </button>
                          </td>
                          <td style={tdStyle}>
                            <button type="button" onClick={() => { setModalOwner(owner); setDealsModalOpen(true); }} style={linkBtnStyle}>
                              {owner.deals?.length ?? 0}
                            </button>
                          </td>
                          <td style={tdStyle}>
                            <button type="button" onClick={() => { setModalOwner(owner); setJobCardsModalOpen(true); }} style={linkBtnStyle}>
                              {owner.jobCards?.length ?? 0}
                            </button>
                          </td>
                          <td style={tdStyle}>{owner.createdAt ? new Date(owner.createdAt).toLocaleString() : "-"}</td>
                          <td style={tdStyle}>
                            <button type="button" onClick={() => { setModalOwner(owner); setProfileModalOpen(true); }} style={linkBtnStyle}>View</button>
                          </td>
                          <td style={tdStyle}>
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => changeAutoShopOwnerStatus(owner._id, isSuspended ? "enable" : "disable")}
                              style={{
                                padding: "4px 12px", borderRadius: 3, border: "none", fontSize: 12, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer",
                                background: isSuspended ? "#dff0d8" : "#f2dede",
                                color: isSuspended ? "#3c763d" : "#a94442",
                                opacity: isLoading ? 0.6 : 1,
                              }}
                              aria-label={isSuspended ? `Enable ${owner.name}` : `Suspend ${owner.name}`}
                            >
                              {isLoading ? "…" : isSuspended ? "Enable" : "Suspend"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer: count + pagination */}
            {!loading && !error && (
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <p style={{ margin: 0, fontSize: 14, color: "#333" }}>
                  {filtered.length === 0 ? "No entries" : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} entries${search ? ` (filtered from ${owners.length} total)` : ""}`}
                </p>
                <div style={{ display: "flex" }}>
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={pageBtn(false, currentPage === 1)}>Previous</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button key={pg} onClick={() => setCurrentPage(pg)} style={pageBtn(pg === currentPage, false)}>{pg}</button>
                  ))}
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={pageBtn(false, currentPage === totalPages)}>Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AutoShopOwners;