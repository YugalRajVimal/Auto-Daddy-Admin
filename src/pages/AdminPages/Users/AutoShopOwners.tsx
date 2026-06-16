// // // import React, { useState, useEffect } from "react";
// // // import axios from "axios";
// // // import {
// // //   Table,
// // //   TableBody,
// // //   TableCell,
// // //   TableHeader,
// // //   TableRow,
// // // } from "../../../components/ui/table";
// // // import Badge from "../../../components/ui/badge/Badge";

// // // // ====================
// // // // Types based on data sample for businessProfile with teamMembers and myDeals
// // // // (Unchanged Types)
// // // // ====================

// // // type SubService = {
// // //   subService: string;
// // // };

// // // type IndividualService = {
// // //   name: string;
// // //   desc?: string;
// // //   price?: number;
// // //   _id: string;
// // // };

// // // type Service = {
// // //   _id: string;
// // //   name?: string;
// // //   desc?: string;
// // //   services?: IndividualService[];
// // //   [k: string]: any;
// // // };

// // // type MyService = {
// // //   service: Service;
// // //   subServices?: SubService[];
// // //   [k: string]: any;
// // // };

// // // type TeamMemberType = {
// // //   _id: string;
// // //   name: string;
// // //   email?: string;
// // //   phone?: string;
// // //   designation?: string;
// // //   photo?: string;
// // // };

// // // type BusinessProfileType = {
// // //   _id: string;
// // //   businessName?: string;
// // //   businessAddress?: string;
// // //   pincode?: string;
// // //   city?: string;
// // //   businessPhone?: string;
// // //   businessEmail?: string;
// // //   businessHSTNumber?: string;
// // //   openHours?: string;
// // //   openDays?: string[];
// // //   businessLogo?: string;
// // //   myServices?: MyService[];
// // //   myDeals?: (string | DealType)[];
// // //   teamMembers?: TeamMemberType[];
// // //   businessMapLocation?: any;
// // //   isOpen?: boolean;
// // //   rating?: number;
// // //   reviewCount?: number;
// // //   reviewDate?: string;
// // //   websiteUrl?: string;
// // //   createdAt?: string;
// // //   updatedAt?: string;
// // //   [k: string]: any;
// // // };

// // // type CustomerType = {
// // //   _id: string;
// // //   name?: string;
// // //   email?: string;
// // //   phone?: string;
// // // };

// // // type DealType = {
// // //   _id: string;
// // //   name: string;
// // //   description?: string;
// // //   value: string;
// // //   percentageDiscount: number;
// // //   dealEnabled: boolean;
// // //   createdAt?: string;
// // //   endDate?: string;
// // //   couponCode?: string;
// // //   startDate?: string;
// // //   additionalDetails?: string;
// // //   valueId?: string;
// // //   createdBy?: string;
// // //   upto?: number;
// // //   updatedAt?: string;
// // // };

// // // type JobCardDealAppliedType = {
// // //   name: string;
// // //   percentageDiscount?: number;
// // //   dealCode?: string;
// // // };

// // // type JobCardServiceSubServiceType = {
// // //   id: string;
// // //   price?: number;
// // //   discountedPrice?: number;
// // //   discountAmount?: number;
// // // };

// // // type JobCardServiceType = {
// // //   id: string;
// // //   subServices: JobCardServiceSubServiceType[];
// // // };

// // // type JobCardType = {
// // //   _id: string;
// // //   jobNo: string;
// // //   business: string;
// // //   customerId: string;
// // //   vehicleId: string;
// // //   odometerReading: number;
// // //   issueDescription: string;
// // //   serviceType: string;
// // //   priorityLevel: string;
// // //   services: JobCardServiceType[];
// // //   additionalNotes?: string;
// // //   vehiclePhotos: string[];
// // //   dealApplied?: JobCardDealAppliedType;
// // //   totalPayableAmount: number;
// // //   paymentStatus: string;
// // //   technicalRemarks?: string;
// // //   createdAt?: string;
// // //   updatedAt?: string;
// // // };

// // // type AutoShopOwnerType = {
// // //   _id: string;
// // //   name: string;
// // //   email?: string;
// // //   countryCode?: string;
// // //   phone?: string;
// // //   pincode?: string;
// // //   address?: string;
// // //   isDisabled?: boolean;
// // //   isProfileComplete?: boolean;
// // //   isBusinessProfileCompleted?: boolean;
// // //   businessProfile?: BusinessProfileType | null;
// // //   myCustomers?: CustomerType[];
// // //   createdAt?: string;
// // //   deals?: DealType[];
// // //   jobCards?: JobCardType[];
// // // };

// // // // ShopOverviewCard, Modal, Badge helpers, etc.: unchanged

// // // const ShopOverviewCard: React.FC<{ shopData: BusinessProfileType }> = ({
// // //   shopData = {},
// // // }) => {
// // //   // Destructure with fallbacks
// // //   const {
// // //     businessPhone = "289 274 8591",
// // //     businessName = "Auto 27 Car Garage",
// // //     businessAddress = "2 Fisherman Dr - Unit 9",
// // //     city = shopData.city || "Brampton, ON L7A 1B5",
// // //     openHours = "9:00 AM - 6:00 PM",
// // //     openDays = shopData.openDays
// // //       ? Array.isArray(shopData.openDays)
// // //         ? shopData.openDays.length === 1 &&
// // //           typeof shopData.openDays[0] === "string" &&
// // //           shopData.openDays[0].trim().startsWith("[")
// // //           ? (() => {
// // //               try {
// // //                 return JSON.parse(shopData.openDays[0]).join(", ");
// // //               } catch {
// // //                 return shopData.openDays.join(", ");
// // //               }
// // //             })()
// // //           : shopData.openDays.join(", ")
// // //         : shopData.openDays
// // //       : "Mon - Sat",
// // //     isOpen = true,
// // //     myServices = [],
// // //     businessLogo,
// // //     businessEmail = "",
// // //     websiteUrl = "#",
// // //     businessMapLocation,
// // //     pincode,
// // //     rating = 4.8,
// // //     reviewCount = 142,
// // //     reviewDate = "01 / 2026",
// // //   } = shopData || {};

// // //   let services: string[] = [];
// // //   if (Array.isArray(myServices) && myServices.length > 0) {
// // //     // Gather service names, fall back if none
// // //     for (const item of myServices) {
// // //       if (item?.service?.name) {
// // //         services.push(item.service.name);
// // //       }
// // //     }
// // //   }
// // //   if (services.length === 0) {
// // //     services = [
// // //       "General Repair",
// // //       "Diagnose - Paccer",
// // //       "Diagnose - Communis",
// // //       "Safety On-line",
// // //       "Oil Change",
// // //       "Brake Service",
// // //     ];
// // //   }
// // //   const servicesToShow = services.slice(0, 6);

// // //   // Shop logo or fallback image
// // //   let imageUrl =
// // //     businessLogo && typeof businessLogo === "string"
// // //       ? businessLogo.startsWith("http")
// // //         ? businessLogo
// // //         : `${import.meta.env.VITE_IMAGE_URL ?? ""}/${businessLogo}`
// // //       : "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?q=80&w=1200&auto=format&fit=crop";

// // //   // Directions URL (use businessMapLocation if provided, or fallback)
// // //   let directionsUrl = "#";
// // //   if (businessMapLocation?.lat && businessMapLocation?.lng) {
// // //     directionsUrl = `https://www.google.com/maps/search/?api=1&query=${businessMapLocation.lat},${businessMapLocation.lng}`;
// // //   }

// // //   // Website url
// // //   let webUrl =
// // //     websiteUrl && websiteUrl !== "#"
// // //       ? websiteUrl
// // //       : businessEmail
// // //       ? `mailto:${businessEmail}`
// // //       : "#";

// // //   // Status open logic: You can adjust based on business hours, for now fallback true
// // //   const statusOpen = isOpen;

// // //   return (
// // //     // ...as in original code...
// // //     // (No changes made here)
// // //     <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] mb-7">
// // //       {/* Top action bar */}
// // //       <div
// // //         className="grid border-b border-slate-200"
// // //         style={{
// // //           gridTemplateColumns:
// // //             "minmax(0, 1.15fr) minmax(0, 0.72fr) minmax(0, 0.72fr) minmax(0, 1.65fr) minmax(52px, 0.55fr)",
// // //           minHeight: 48,
// // //         }}
// // //       >
// // //         <div className="flex items-center justify-center border-r border-slate-200 bg-emerald-50 px-2 py-2 text-center text-[13px] font-bold text-emerald-800">
// // //           <span className="truncate">📞 {businessPhone}</span>
// // //         </div>

// // //         <a
// // //           href={directionsUrl}
// // //           target="_blank"
// // //           rel="noopener noreferrer"
// // //           className="flex items-center justify-center border-r border-slate-200 bg-sky-50 text-[13px] font-semibold text-blue-600 no-underline transition-colors hover:bg-sky-100"
// // //         >
// // //           Directions
// // //         </a>

// // //         <a
// // //           href={webUrl}
// // //           target="_blank"
// // //           rel="noopener noreferrer"
// // //           className="flex items-center justify-center border-r border-slate-200 bg-slate-50 text-[13px] font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-100"
// // //         >
// // //           Website
// // //         </a>

// // //         <div className="flex min-w-0 items-center justify-between gap-2 border-r border-slate-200 bg-white px-3 py-2">
// // //           <div className="flex shrink-0 items-center gap-2">
// // //             <span
// // //               className={`h-2 w-2 shrink-0 rounded-full ${
// // //                 statusOpen ? "bg-emerald-500" : "bg-red-500"
// // //               }`}
// // //             />
// // //             <span
// // //               className={`whitespace-nowrap text-[12px] font-semibold ${
// // //                 statusOpen ? "text-emerald-700" : "text-red-600"
// // //               }`}
// // //             >
// // //               {statusOpen ? "OPEN NOW" : "CLOSED"}
// // //             </span>
// // //           </div>
// // //           <div className="text-right text-[11px] leading-snug text-slate-500">
// // //             <div className="whitespace-nowrap">{openDays}</div>
// // //             <div className="whitespace-nowrap">{openHours}</div>
// // //           </div>
// // //         </div>

// // //         <div className="flex items-center justify-center gap-1 bg-amber-50 text-[15px] font-bold text-slate-900">
// // //           <span className="text-amber-500">★</span>
// // //           {rating}
// // //         </div>
// // //       </div>

// // //       {/* Main content */}
// // //       <div
// // //         className="grid items-start gap-5 p-5"
// // //         style={{
// // //           gridTemplateColumns:
// // //             "minmax(120px, 150px) minmax(0, 1.25fr) minmax(0, 1.1fr) minmax(100px, 118px)",
// // //         }}
// // //       >
// // //         <img
// // //           src={imageUrl}
// // //           alt={businessName}
// // //           className="h-[108px] w-full rounded-lg object-cover"
// // //         />

// // //         <div className="min-w-0">
// // //           <h2 className="mb-1.5 text-xl font-bold leading-tight text-slate-900">
// // //             {businessName}
// // //           </h2>
// // //           <p className="mb-3 text-[13px] leading-relaxed text-slate-600">
// // //             {businessAddress}
// // //             <br />
// // //             {city}
// // //             {pincode && (
// // //               <>
// // //                 <br />
// // //                 Pincode: {pincode}
// // //               </>
// // //             )}
// // //           </p>
// // //           <div className="flex flex-wrap gap-2">
// // //             <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
// // //               {statusOpen ? "Open" : "Closed"}
// // //             </span>
// // //             <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] text-blue-700">
// // //               {openDays}
// // //             </span>
// // //             <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600">
// // //               {openHours}
// // //             </span>
// // //           </div>
// // //         </div>

// // //         <div className="min-w-0">
// // //           <p className="mb-2.5 text-[13px] font-bold text-slate-900">
// // //             Services
// // //           </p>
// // //           <ul
// // //             className="grid list-none gap-x-4 gap-y-1.5 p-0"
// // //             style={{
// // //               gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
// // //             }}
// // //           >
// // //             {servicesToShow.map((service, index) => (
// // //               <li
// // //                 key={`${service}-${index}`}
// // //                 className="flex min-w-0 items-start gap-1.5 text-[12px] leading-snug text-slate-600"
// // //               >
// // //                 <span className="mt-px shrink-0 font-bold text-emerald-500">
// // //                   ✓
// // //                 </span>
// // //                 <span className="min-w-0">{service}</span>
// // //               </li>
// // //             ))}
// // //           </ul>
// // //         </div>

// // //         <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-3 text-center">
// // //           <span className="text-[26px] font-bold leading-none text-slate-900">
// // //             {rating}
// // //           </span>
// // //           <span className="mt-1 text-[13px] tracking-wide text-amber-500">
// // //             ★★★★★
// // //           </span>
// // //           <span className="mt-1.5 text-[11px] text-slate-500">
// // //             {reviewCount} Reviews
// // //           </span>
// // //           <span className="mt-0.5 text-[10px] text-slate-400">{reviewDate}</span>
// // //         </div>
// // //       </div>

// // //       {/* Footer */}
// // //       <div
// // //         className="grid items-center gap-2 bg-slate-900 px-4 py-2.5 text-[12px] text-white"
// // //         style={{
// // //           gridTemplateColumns:
// // //             "minmax(0, 1fr) minmax(0, 1.6fr) minmax(0, 1fr)",
// // //         }}
// // //       >
// // //         <span className="truncate font-medium">{businessName}</span>
// // //         <span className="truncate text-center text-slate-200">
// // //           {businessAddress} • {city}
// // //         </span>
// // //         <span className="truncate text-right text-slate-200">
// // //           {openDays} | {openHours}
// // //         </span>
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // type ModalProps = {
// // //   isOpen: boolean;
// // //   onClose: () => void;
// // //   title: string;
// // //   children: React.ReactNode;
// // // };
// // // const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
// // //   if (!isOpen) return null;
// // //   return (
// // //     <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
// // //       <div className="bg-white dark:bg-gray-900 rounded-xl max-w-7xl w-full shadow-lg relative mx-10">
// // //         <div className="flex items-center justify-between border-b px-6 py-4">
// // //           <h3 className="text-lg font-bold">{title}</h3>
// // //           <button
// // //             className="text-xl font-bold text-gray-500 hover:text-gray-800 px-2"
// // //             type="button"
// // //             aria-label="Close"
// // //             onClick={onClose}
// // //           >
// // //             ×
// // //           </button>
// // //         </div>
// // //         <div className="p-6 overflow-y-auto max-h-[80vh]">{children}</div>
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // // Helper badge/status functions: unchanged
// // // function getStatus(owner: AutoShopOwnerType) {
// // //   if (owner.isDisabled) return "Suspended";
// // //   if (
// // //     owner.isProfileComplete &&
// // //     (owner.isBusinessProfileCompleted ?? owner.businessProfile)
// // //   )
// // //     return "Active";
// // //   if (!owner.isProfileComplete) return "Incomplete Profile";
// // //   return "Unknown";
// // // }
// // // function getStatusColor(owner: AutoShopOwnerType) {
// // //   if (owner.isDisabled) return "warning";
// // //   if (
// // //     owner.isProfileComplete &&
// // //     (owner.isBusinessProfileCompleted ?? owner.businessProfile)
// // //   )
// // //     return "success";
// // //   if (!owner.isProfileComplete) return "error";
// // //   return "default";
// // // }

// // // // Export helpers: unchanged
// // // function toCsv(data: string[][], headers: string[]): string {
// // //   const escapeCsv = (val: any) => {
// // //     if (val == null) return "";
// // //     let s = String(val);
// // //     if (/[,\"\n]/.test(s)) {
// // //       s = '"' + s.replace(/"/g, '""') + '"';
// // //     }
// // //     return s;
// // //   };
// // //   return (
// // //     headers.map(escapeCsv).join(",") +
// // //     "\n" +
// // //     data.map((row) => row.map(escapeCsv).join(",")).join("\n")
// // //   );
// // // }
// // // function downloadAsFile(filename: string, content: string) {
// // //   const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
// // //   const url = URL.createObjectURL(blob);
// // //   const a = document.createElement("a");
// // //   a.href = url;
// // //   a.download = filename;
// // //   a.click();
// // //   setTimeout(() => URL.revokeObjectURL(url), 2000);
// // // }
// // // function autoShopOwnersToCsvRows(
// // //   owners: AutoShopOwnerType[]
// // // ): [string[], string[][]] {
// // //   const headers = [
// // //     "Name",
// // //     "Email",
// // //     "Phone",
// // //     "Shop Name",
// // //     "Shop Address",
// // //     "Shop City",
// // //     "Pincode",
// // //     "Status",
// // //     "Customers Count",
// // //     "Deals Count",
// // //     "JobCards Count",
// // //     "Created At",
// // //     "Profile Complete",
// // //     "Business Profile Complete",
// // //   ];
// // //   const rows = owners.map((owner) => [
// // //     owner.name ?? "",
// // //     owner.email ?? "",
// // //     (owner.countryCode ? owner.countryCode + " " : "") + (owner.phone ?? ""),
// // //     owner.businessProfile?.businessName ?? "",
// // //     owner.businessProfile?.businessAddress ?? "",
// // //     owner.businessProfile?.city ?? "",
// // //     owner.businessProfile?.pincode ?? "",
// // //     getStatus(owner),
// // //     owner.myCustomers ? owner.myCustomers.length.toString() : "0",
// // //     owner.deals ? owner.deals.length.toString() : "0",
// // //     owner.jobCards ? owner.jobCards.length.toString() : "0",
// // //     owner.createdAt ? new Date(owner.createdAt).toLocaleString() : "",
// // //     owner.isProfileComplete ? "Yes" : "No",
// // //     (owner.isBusinessProfileCompleted ?? !!owner.businessProfile) ? "Yes" : "No",
// // //   ]);
// // //   return [headers, rows];
// // // }

// // // // --- Send Custom Notification Modal ---
// // // const SendNotificationModal: React.FC<{
// // //   isOpen: boolean;
// // //   onClose: () => void;
// // //   selectedOwnerIds: string[];
// // //   onSuccess: () => void;
// // // }> = ({ isOpen, onClose, selectedOwnerIds, onSuccess }) => {
// // //   const [title, setTitle] = useState("");
// // //   const [body, setBody] = useState("");
// // //   const [sending, setSending] = useState(false);
// // //   const [error, setError] = useState<string | null>(null);
// // //   const [successMsg, setSuccessMsg] = useState<string | null>(null);

// // //   const ownersCount = selectedOwnerIds.length;

// // //   const resetForm = () => {
// // //     setTitle("");
// // //     setBody("");
// // //     setError(null);
// // //     setSuccessMsg(null);
// // //     setSending(false);
// // //   };

// // //   const handleClose = () => {
// // //     resetForm();
// // //     onClose();
// // //   };

// // //   const handleSend = async (e: React.FormEvent) => {
// // //     e.preventDefault();
// // //     setError(null);
// // //     setSuccessMsg(null);

// // //     if (!title.trim() || !body.trim()) {
// // //       setError("Please provide both title and message body");
// // //       return;
// // //     }
// // //     if (!Array.isArray(selectedOwnerIds) || selectedOwnerIds.length === 0) {
// // //       setError("No shop owners selected.");
// // //       return;
// // //     }
// // //     setSending(true);
// // //     try {
// // //       const res = await axios.post(
// // //         `${import.meta.env.VITE_API_URL}/api/admin/notification/custom/send`,
// // //         {
// // //           userType:"autoshopowner",
// // //           userIds: selectedOwnerIds,
// // //           title,
// // //           message: body,
// // //         }
// // //       );
// // //       if (res.data.success) {
// // //         setSuccessMsg("Notification sent successfully!");
// // //         onSuccess();
// // //         setTimeout(handleClose, 1500);
// // //       } else {
// // //         setError(res.data.message || "Failed to send notification");
// // //       }
// // //     } catch (err: any) {
// // //       setError(
// // //         err?.response?.data?.message ||
// // //           (err?.message || "Failed to send notification")
// // //       );
// // //     } finally {
// // //       setSending(false);
// // //     }
// // //   };

// // //   return (
// // //     <Modal isOpen={isOpen} onClose={handleClose} title="Send Custom Notification">
// // //       <form className="space-y-5 max-w-lg mx-auto" onSubmit={handleSend}>
// // //         <div>
// // //           <label className="block font-semibold mb-1" htmlFor="noti-title">
// // //             Notification Title
// // //           </label>
// // //           <input
// // //             id="noti-title"
// // //             type="text"
// // //             className="w-full border-gray-300 rounded px-3 py-2"
// // //             value={title}
// // //             disabled={sending}
// // //             onChange={e => setTitle(e.target.value)}
// // //             maxLength={80}
// // //             placeholder="Eg. Important update for your shop account"
// // //             required
// // //           />
// // //         </div>
// // //         <div>
// // //           <label className="block font-semibold mb-1" htmlFor="noti-body">
// // //             Notification Body
// // //           </label>
// // //           <textarea
// // //             id="noti-body"
// // //             className="w-full border-gray-300 rounded px-3 py-2 min-h-[92px]"
// // //             value={body}
// // //             onChange={e => setBody(e.target.value)}
// // //             disabled={sending}
// // //             maxLength={240}
// // //             placeholder="Write your message to send to selected shop owners..."
// // //             required
// // //           />
// // //         </div>
// // //         {error ? <div className="text-red-600 text-sm">{error}</div> : null}
// // //         {successMsg ? (
// // //           <div className="text-green-600 text-sm">{successMsg}</div>
// // //         ) : null}
// // //         <div className="flex items-center gap-4 justify-end mt-4">
// // //           <button
// // //             type="button"
// // //             onClick={handleClose}
// // //             disabled={sending}
// // //             className="px-4 py-2 rounded bg-slate-100 text-gray-850 hover:bg-slate-200 font-semibold"
// // //           >
// // //             Cancel
// // //           </button>
// // //           <button
// // //             type="submit"
// // //             disabled={sending}
// // //             className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-2"
// // //           >
// // //             {sending && (
// // //               <svg
// // //                 className="animate-spin mr-2 h-4 w-4 text-white"
// // //                 viewBox="0 0 24 24"
// // //                 fill="none"
// // //               >
// // //                 <circle
// // //                   className="opacity-25"
// // //                   cx="12"
// // //                   cy="12"
// // //                   r="10"
// // //                   stroke="currentColor"
// // //                   strokeWidth="4"
// // //                 />
// // //                 <path
// // //                   className="opacity-75"
// // //                   fill="currentColor"
// // //                   d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
// // //                 />
// // //               </svg>
// // //             )}
// // //             <span>
// // //               Send Notification to {ownersCount} shop owner
// // //               {ownersCount > 1 ? "s" : ""}
// // //             </span>
// // //           </button>
// // //         </div>
// // //       </form>
// // //     </Modal>
// // //   );
// // // };

// // // // New: Job Card Detail Modal
// // // const JobCardDetailModal: React.FC<{
// // //   isOpen: boolean;
// // //   onClose: () => void;
// // //   card: JobCardType | null;
// // //   owner: AutoShopOwnerType | null;
// // //   UPLOADS_URL: string;
// // // }> = ({ isOpen, onClose, card, owner, UPLOADS_URL }) => {
// // //   // ...unchanged... (as before)
// // //   if (!isOpen || !card || !owner) return null;
// // //   // ...rest of modal unchanged...
// // //   // ...omitted for brevity...
// // //   return (
// // //     <Modal isOpen={isOpen} onClose={onClose} title={`Job Card Details - ${card._id}`}>
// // //       <div className="space-y-2 text-sm text-gray-800 dark:text-white">
// // //         <div>
// // //           <span className="font-semibold">Job Card No.:</span>{" "}
// // //           {card._id}
// // //         </div>
// // //         <div>
// // //           <span className="font-semibold">Date:</span>{" "}
// // //           {card.createdAt ? new Date(card.createdAt).toLocaleString() : "-"}
// // //         </div>
// // //         <div>
// // //           <span className="font-semibold">Phone:</span>{" "}
// // //           {owner.countryCode ? owner.countryCode + " " : ""}
// // //           {owner.phone || "-"}
// // //         </div>
// // //         <div>
// // //           <span className="font-semibold">Name:</span>{" "}
// // //           {owner.name}
// // //         </div>
// // //         <div>
// // //           <span className="font-semibold">Business:</span> {card.business}
// // //         </div>
// // //         <div>
// // //           <span className="font-semibold">Vehicle ID:</span> {card.vehicleId}
// // //         </div>
// // //         <div>
// // //           <span className="font-semibold">Odometer Reading:</span> {card.odometerReading}
// // //         </div>
// // //         <div>
// // //           <span className="font-semibold">Issue:</span> {card.issueDescription}
// // //         </div>
// // //         <div>
// // //           <span className="font-semibold">Notes:</span> {card.additionalNotes || "-"}
// // //         </div>
// // //         <div>
// // //           <span className="font-semibold">Technical Remarks:</span> {card.technicalRemarks || "-"}
// // //         </div>
// // //         <div>
// // //           <span className="font-semibold">Deal Applied:</span>{" "}
// // //           {card.dealApplied
// // //             ? `${card.dealApplied.name} (${card.dealApplied.dealCode ?? ""}${
// // //                 card.dealApplied.percentageDiscount != null
// // //                   ? ` - ${card.dealApplied.percentageDiscount}%`
// // //                   : ""
// // //               })`
// // //             : "-"}
// // //         </div>
// // //         <div>
// // //           <span className="font-semibold">Total Payable:</span> ₹{card.totalPayableAmount}
// // //         </div>
// // //         <div>
// // //           <span className="font-semibold">Payment Status:</span> {card.paymentStatus}
// // //         </div>
// // //         <div>
// // //           <span className="font-semibold">Service Type:</span> {card.serviceType}
// // //         </div>
// // //         <div>
// // //           <span className="font-semibold">Priority:</span> {card.priorityLevel}
// // //         </div>
// // //         <div>
// // //           <span className="font-semibold">Created:</span>{" "}
// // //           {card.createdAt ? new Date(card.createdAt).toLocaleString() : "-"}
// // //         </div>
// // //         {/* Vehicle Photos */}
// // //         {card.vehiclePhotos && card.vehiclePhotos.length > 0 && (
// // //           <div className="pt-3">
// // //             <div className="font-semibold mb-1">Vehicle Photos</div>
// // //             <div className="flex flex-wrap gap-2 mb-2">
// // //               {card.vehiclePhotos.map((photoUrl, idx) => (
// // //                 <img
// // //                   key={idx}
// // //                   src={
// // //                     photoUrl.startsWith("http")
// // //                       ? photoUrl
// // //                       : `${UPLOADS_URL ?? ""}/${photoUrl.replace(
// // //                           /^\/+/,
// // //                           ""
// // //                         )}`
// // //                   }
// // //                   alt="Vehicle"
// // //                   className="w-20 h-20 object-cover rounded"
// // //                   loading="lazy"
// // //                 />
// // //               ))}
// // //             </div>
// // //           </div>
// // //         )}
// // //         {/* Services breakdown if present */}
// // //         {Array.isArray(card.services) && card.services.length > 0 && (
// // //           <div className="pt-2">
// // //             <div className="font-semibold mb-1">Services:</div>
// // //             <ul className="ml-3 list-disc">
// // //               {card.services.map((serv, sidx) => (
// // //                 <li key={serv.id + "-" + sidx}>
// // //                   <div>
// // //                     Service ID: <span className="font-mono">{serv.id}</span>
// // //                   </div>
// // //                   {Array.isArray(serv.subServices) && serv.subServices.length > 0 && (
// // //                     <ul className="ml-3 list-disc">
// // //                       {serv.subServices.map((ss, ssidx) => (
// // //                         <li key={ss.id + "-" + ssidx}>
// // //                           SubService ID: <span className="font-mono">{ss.id}</span>
// // //                           {typeof ss.price !== "undefined" && (
// // //                             <span> | ₹{ss.price}</span>
// // //                           )}
// // //                           {typeof ss.discountedPrice !== "undefined" &&
// // //                             ss.discountedPrice !== ss.price && (
// // //                               <span className="ml-2 text-green-700">
// // //                                 After Discount: ₹{ss.discountedPrice}
// // //                               </span>
// // //                             )}
// // //                           {typeof ss.discountAmount !== "undefined" &&
// // //                             ss.discountAmount > 0 && (
// // //                               <span className="ml-2 text-red-600">
// // //                                 (Discount: ₹{ss.discountAmount})
// // //                               </span>
// // //                             )}
// // //                         </li>
// // //                       ))}
// // //                     </ul>
// // //                   )}
// // //                 </li>
// // //               ))}
// // //             </ul>
// // //           </div>
// // //         )}
// // //       </div>
// // //     </Modal>
// // //   );
// // // };

// // // // -----------------------------
// // // // Main Component
// // // // -----------------------------
// // // const AutoShopOwners: React.FC = () => {
// // //   const [owners, setOwners] = useState<AutoShopOwnerType[]>([]);
// // //   const [loading, setLoading] = useState<boolean>(true);
// // //   const [error, setError] = useState<string>("");

// // //   // Modal state
// // //   const [customerModalOpen, setCustomerModalOpen] = useState<boolean>(false);
// // //   const [dealsModalOpen, setDealsModalOpen] = useState<boolean>(false);
// // //   const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
// // //   const [jobCardsModalOpen, setJobCardsModalOpen] = useState<boolean>(false);
// // //   const [modalOwner, setModalOwner] = useState<AutoShopOwnerType | null>(null);

// // //   // Job Card detail modal state
// // //   const [jobCardDetailModalOpen, setJobCardDetailModalOpen] =
// // //     useState<boolean>(false);
// // //   const [selectedJobCard, setSelectedJobCard] =
// // //     useState<JobCardType | null>(null);

// // //   // For disabling/enabling owners
// // //   const [actionLoadingMap, setActionLoadingMap] = useState<{
// // //     [ownerId: string]: boolean;
// // //   }>({});

// // //   const [exporting, setExporting] = useState(false); // Export UI state

// // //   // Selection state
// // //   const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);

// // //   // Notification modal state
// // //   const [notificationOpen, setNotificationOpen] = useState(false);

// // //   // Vehicle image base url from VITE_UPLOADS_URL
// // //   const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL;

// // //   // Fetch from admin API: admin/autoshopowners
// // //   const fetchOwners = async () => {
// // //     setLoading(true);
// // //     setError("");
// // //     try {
// // //       const res = await axios.get(
// // //         `${import.meta.env.VITE_API_URL}/api/admin/autoshopowners`
// // //       );
// // //       if (res.data.success && Array.isArray(res.data.data)) {
// // //         setOwners(res.data.data);
// // //       } else {
// // //         setError("Failed to fetch auto shop owners");
// // //       }
// // //     } catch (err: any) {
// // //       setError(err?.response?.data?.message || "Something went wrong");
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   // Enable/disable owner by ID (PATCH)
// // //   const changeAutoShopOwnerStatus = async (
// // //     ownerId: string,
// // //     action: "enable" | "disable"
// // //   ) => {
// // //     setActionLoadingMap((prev) => ({ ...prev, [ownerId]: true }));
// // //     try {
// // //       const disable = action === "disable";
// // //       const res = await axios.post(
// // //         `${import.meta.env.VITE_API_URL}/api/admin/autoshopowners/toggle-status`,
// // //         { userId: ownerId, disable }
// // //       );
// // //       if (res.data.success) {
// // //         await fetchOwners();
// // //       } else {
// // //         alert("Failed to update status");
// // //       }
// // //     } catch (err: any) {
// // //       alert(
// // //         err?.response?.data?.message ||
// // //           `Failed to ${action === "enable" ? "enable" : "suspend"} shop owner.`
// // //       );
// // //     } finally {
// // //       setActionLoadingMap((prev) => ({ ...prev, [ownerId]: false }));
// // //     }
// // //   };

// // //   // Export handler
// // //   const handleExport = async () => {
// // //     setExporting(true);
// // //     try {
// // //       let dataToExport: AutoShopOwnerType[] = [];
// // //       if (selectedOwnerIds.length > 0) {
// // //         dataToExport = owners.filter((owner) =>
// // //           selectedOwnerIds.includes(owner._id)
// // //         );
// // //       } else {
// // //         alert("Please select at least one row to export.");
// // //         setExporting(false);
// // //         return;
// // //       }
// // //       if (dataToExport.length === 0) {
// // //         alert("No owners selected.");
// // //         setExporting(false);
// // //         return;
// // //       }
// // //       const [headers, rows] = autoShopOwnersToCsvRows(dataToExport);
// // //       const csvString = toCsv(rows, headers);

// // //       downloadAsFile(
// // //         `autoshop-owners-${new Date().toISOString().slice(0, 10)}.csv`,
// // //         csvString
// // //       );
// // //     } catch (err: any) {
// // //       alert("Failed to export data.");
// // //     } finally {
// // //       setExporting(false);
// // //     }
// // //   };

// // //   // For bulk selection
// // //   const isAllSelected =
// // //     owners.length > 0 && selectedOwnerIds.length === owners.length;
// // //   const handleCheckAll = (event: React.ChangeEvent<HTMLInputElement>) => {
// // //     if (event.target.checked) {
// // //       setSelectedOwnerIds(owners.map((owner) => owner._id));
// // //     } else {
// // //       setSelectedOwnerIds([]);
// // //     }
// // //   };
// // //   const handleCheckRow = (ownerId: string, checked: boolean) => {
// // //     setSelectedOwnerIds((current) => {
// // //       if (checked) {
// // //         return [...current, ownerId];
// // //       } else {
// // //         return current.filter((id) => id !== ownerId);
// // //       }
// // //     });
// // //   };

// // //   useEffect(() => {
// // //     fetchOwners();
// // //     // eslint-disable-next-line react-hooks/exhaustive-deps
// // //   }, []);

// // //   // ...all modal render helpers unchanged...
// // //   // (code below is from original selection, not repeated here for brevity, stays the same)

// // //   // Previous code: renderBusinessProfileModal, renderCustomersModal, etc.
// // //   // ...start unchanged modal code...
// // //   const renderBusinessProfileModal = () => {
// // //     // ...unchanged...
// // //     if (!modalOwner || !modalOwner.businessProfile) return null;
// // //     const bp = modalOwner.businessProfile;

// // //     const renderNestedServices = () => {
// // //       if (!Array.isArray(bp.myServices) || bp.myServices.length === 0) {
// // //         return <div className="text-gray-400">No services listed</div>;
// // //       }
// // //       const serviceMap: {
// // //         [serviceId: string]: { service: Service; subServiceIds: string[] };
// // //       } = {};
// // //       bp.myServices.forEach((ms: MyService) => {
// // //         if (!ms.service || !ms.service._id) return;
// // //         if (!serviceMap[ms.service._id]) {
// // //           serviceMap[ms.service._id] = {
// // //             service: ms.service,
// // //             subServiceIds: [],
// // //           };
// // //         }
// // //         if (Array.isArray(ms.subServices)) {
// // //           serviceMap[ms.service._id].subServiceIds.push(
// // //             ...ms.subServices.map((ss) => ss.subService)
// // //           );
// // //         }
// // //       });
// // //       const grouped = Object.values(serviceMap);
// // //       return (
// // //         <ul className="space-y-4">
// // //           {grouped.map(({ service, subServiceIds }) => (
// // //             <li key={service._id}>
// // //               <div className="font-medium text-base text-gray-700 dark:text-white mb-1">
// // //                 {service.name || "-"}
// // //               </div>
// // //               <div className="pl-4">
// // //                 {service.services && service.services.length > 0 ? (
// // //                   <ul className="space-y-1 list-disc ml-4">
// // //                     {service.services
// // //                       .filter(
// // //                         (ss) =>
// // //                           subServiceIds.length === 0 ||
// // //                           subServiceIds.includes(ss._id)
// // //                       )
// // //                       .map((ss) => (
// // //                         <li key={ss._id}>
// // //                           <span className="font-normal">{ss.name}</span>
// // //                           {ss.desc && (
// // //                             <span className="ml-2 text-gray-400 text-xs">
// // //                               {ss.desc}
// // //                             </span>
// // //                           )}
// // //                         </li>
// // //                       ))}
// // //                     {service.services.filter(
// // //                       (ss) =>
// // //                         subServiceIds.length === 0 ||
// // //                         subServiceIds.includes(ss._id)
// // //                     ).length === 0 && (
// // //                       <li className="text-gray-400">-</li>
// // //                     )}
// // //                   </ul>
// // //                 ) : (
// // //                   <span className="text-gray-400">-</span>
// // //                 )}
// // //               </div>
// // //             </li>
// // //           ))}
// // //         </ul>
// // //       );
// // //     };

// // //     return (
// // //       <Modal
// // //         isOpen={profileModalOpen}
// // //         onClose={() => setProfileModalOpen(false)}
// // //         title={`Business Profile: ${bp.businessName || "-"}`}
// // //       >
// // //         {/* New Shop Overview Card at the top */}
// // //         <ShopOverviewCard shopData={bp} />

// // //         <div className="space-y-4 mt-8">
// // //           {/* Team Members */}
// // //           <div>
// // //             <div className="font-semibold mb-2">Team Members</div>
// // //             {Array.isArray(bp.teamMembers) && bp.teamMembers.length > 0 ? (
// // //               <div className="overflow-x-auto">
// // //                 <table className="min-w-full text-xs border">
// // //                   <thead>
// // //                     <tr>
// // //                       <th className="p-2 border-b font-semibold text-left">
// // //                         Photo
// // //                       </th>
// // //                       <th className="p-2 border-b font-semibold text-left">
// // //                         Name
// // //                       </th>
// // //                       <th className="p-2 border-b font-semibold text-left">
// // //                         Email
// // //                       </th>
// // //                       <th className="p-2 border-b font-semibold text-left">
// // //                         Phone
// // //                       </th>
// // //                       <th className="p-2 border-b font-semibold text-left">
// // //                         Designation
// // //                       </th>
// // //                     </tr>
// // //                   </thead>
// // //                   <tbody>
// // //                     {bp.teamMembers.map((tm: TeamMemberType) => (
// // //                       <tr key={tm._id}>
// // //                         <td className="p-2 border-b">
// // //                           {tm.photo ? (
// // //                             <img
// // //                               src={
// // //                                 tm.photo.startsWith("http")
// // //                                   ? tm.photo
// // //                                   : `${
// // //                                       import.meta.env.VITE_IMAGE_URL ?? ""
// // //                                     }/${tm.photo}`
// // //                               }
// // //                               alt="Team"
// // //                               className="w-8 h-8 rounded-full object-cover"
// // //                             />
// // //                           ) : (
// // //                             <span className="block bg-gray-200 w-8 h-8 rounded-full" />
// // //                           )}
// // //                         </td>
// // //                         <td className="p-2 border-b">{tm.name}</td>
// // //                         <td className="p-2 border-b">{tm.email || "-"}</td>
// // //                         <td className="p-2 border-b">{tm.phone || "-"}</td>
// // //                         <td className="p-2 border-b">
// // //                           {tm.designation || "-"}
// // //                         </td>
// // //                       </tr>
// // //                     ))}
// // //                   </tbody>
// // //                 </table>
// // //               </div>
// // //             ) : (
// // //               <div className="text-gray-400">No team members</div>
// // //             )}
// // //           </div>
// // //           {/* My Services: Nested Heading (Category), then subservice list */}
// // //           <div>
// // //             <div className="font-semibold mb-2">Services</div>
// // //             {renderNestedServices()}
// // //           </div>
// // //           {/* My Deals - display as detail table if possible */}
// // //           <div>
// // //             <div className="font-semibold mb-2">My Deals</div>
// // //             {Array.isArray(bp.myDeals) && bp.myDeals.length > 0 ? (
// // //               <div className="overflow-x-auto">
// // //                 <table className="min-w-full text-xs border">
// // //                   <thead>
// // //                     <tr>
// // //                       <th className="p-2 border-b font-semibold text-left">
// // //                         Name
// // //                       </th>
// // //                       <th className="p-2 border-b font-semibold text-left">
// // //                         Description
// // //                       </th>
// // //                       <th className="p-2 border-b font-semibold text-left">
// // //                         Discount %
// // //                       </th>
// // //                       <th className="p-2 border-b font-semibold text-left">
// // //                         Coupon
// // //                       </th>
// // //                       <th className="p-2 border-b font-semibold text-left">
// // //                         Enabled
// // //                       </th>
// // //                       <th className="p-2 border-b font-semibold text-left">
// // //                         Valid From
// // //                       </th>
// // //                       <th className="p-2 border-b font-semibold text-left">
// // //                         Ends
// // //                       </th>
// // //                     </tr>
// // //                   </thead>
// // //                   <tbody>
// // //                     {bp.myDeals.map((deal: any) => {
// // //                       if (typeof deal === "string") {
// // //                         return (
// // //                           <tr key={deal}>
// // //                             <td className="p-2 border-b" colSpan={7}>
// // //                               {deal}
// // //                             </td>
// // //                           </tr>
// // //                         );
// // //                       }
// // //                       return (
// // //                         <tr key={deal._id ?? deal.name ?? Math.random()}>
// // //                           <td className="p-2 border-b">
// // //                             {deal.name || "-"}
// // //                           </td>
// // //                           <td className="p-2 border-b max-w-xs whitespace-pre-wrap">
// // //                             {deal.description || "-"}
// // //                           </td>
// // //                           <td className="p-2 border-b">
// // //                             {deal.percentageDiscount ?? 0}%
// // //                           </td>
// // //                           <td className="p-2 border-b">
// // //                             {deal.couponCode || "-"}
// // //                           </td>
// // //                           <td className="p-2 border-b">
// // //                             {deal.dealEnabled ? (
// // //                               <span className="text-green-600 font-medium">
// // //                                 Yes
// // //                               </span>
// // //                             ) : (
// // //                               <span className="text-red-500 font-medium">
// // //                                 No
// // //                               </span>
// // //                             )}
// // //                           </td>
// // //                           <td className="p-2 border-b">
// // //                             {deal.startDate
// // //                               ? new Date(
// // //                                   deal.startDate
// // //                                 ).toLocaleDateString()
// // //                               : "-"}
// // //                           </td>
// // //                           <td className="p-2 border-b">
// // //                             {deal.endDate
// // //                               ? new Date(deal.endDate).toLocaleDateString()
// // //                               : "-"}
// // //                           </td>
// // //                         </tr>
// // //                       );
// // //                     })}
// // //                   </tbody>
// // //                 </table>
// // //               </div>
// // //             ) : (
// // //               <div className="text-gray-400">No shop deals linked</div>
// // //             )}
// // //           </div>
// // //         </div>
// // //       </Modal>
// // //     );
// // //   };

// // //   // Customers Modal unchanged
// // //   const renderCustomersModal = () => {
// // //     // ...unchanged...
// // //     if (!modalOwner) return null;
// // //     return (
// // //       <Modal
// // //         isOpen={customerModalOpen}
// // //         onClose={() => setCustomerModalOpen(false)}
// // //         title={`Customers of ${modalOwner.name}`}
// // //       >
// // //         {modalOwner.myCustomers && modalOwner.myCustomers.length > 0 ? (
// // //           <div>
// // //             <table className="min-w-full text-sm">
// // //               <thead>
// // //                 <tr>
// // //                   <th className="font-semibold text-left p-2 border-b border-gray-100">
// // //                     Name
// // //                   </th>
// // //                   <th className="font-semibold text-left p-2 border-b border-gray-100">
// // //                     Email
// // //                   </th>
// // //                   <th className="font-semibold text-left p-2 border-b border-gray-100">
// // //                     Phone
// // //                   </th>
// // //                 </tr>
// // //               </thead>
// // //               <tbody>
// // //                 {modalOwner.myCustomers.map((cust) => (
// // //                   <tr key={cust._id}>
// // //                     <td className="p-2 border-b border-gray-50">
// // //                       {cust.name || "-"}
// // //                     </td>
// // //                     <td className="p-2 border-b border-gray-50">
// // //                       {cust.email || "-"}
// // //                     </td>
// // //                     <td className="p-2 border-b border-gray-50">
// // //                       {cust.phone || "-"}
// // //                     </td>
// // //                   </tr>
// // //                 ))}
// // //               </tbody>
// // //             </table>
// // //           </div>
// // //         ) : (
// // //           <div className="py-4 text-gray-400">No customers found.</div>
// // //         )}
// // //       </Modal>
// // //     );
// // //   };

// // //   const renderDealsModal = () => {
// // //     // ...unchanged...
// // //     if (!modalOwner) return null;
// // //     return (
// // //       <Modal
// // //         isOpen={dealsModalOpen}
// // //         onClose={() => setDealsModalOpen(false)}
// // //         title={`Deals for ${modalOwner.name}`}
// // //       >
// // //         {modalOwner.deals && modalOwner.deals.length > 0 ? (
// // //           <div className="overflow-x-auto">
// // //             <table className="min-w-full text-sm border">
// // //               <thead>
// // //                 <tr>
// // //                   <th className="font-semibold text-left p-2 border-b border-gray-100">
// // //                     Name
// // //                   </th>
// // //                   <th className="font-semibold text-left p-2 border-b border-gray-100">
// // //                     Description
// // //                   </th>
// // //                   <th className="font-semibold text-left p-2 border-b border-gray-100">
// // //                     Discount %
// // //                   </th>
// // //                   <th className="font-semibold text-left p-2 border-b border-gray-100">
// // //                     Coupon
// // //                   </th>
// // //                   <th className="font-semibold text-left p-2 border-b border-gray-100">
// // //                     Enabled
// // //                   </th>
// // //                   <th className="font-semibold text-left p-2 border-b border-gray-100">
// // //                     Valid From
// // //                   </th>
// // //                   <th className="font-semibold text-left p-2 border-b border-gray-100">
// // //                     Ends
// // //                   </th>
// // //                   <th className="font-semibold text-left p-2 border-b border-gray-100">
// // //                     Details
// // //                   </th>
// // //                 </tr>
// // //               </thead>
// // //               <tbody>
// // //                 {modalOwner.deals.map((deal) => (
// // //                   <tr key={deal._id}>
// // //                     <td className="p-2 border-b border-gray-50">
// // //                       {deal.name}
// // //                     </td>
// // //                     <td className="p-2 border-b border-gray-50 max-w-xs whitespace-pre-wrap">
// // //                       {deal.description || "-"}
// // //                     </td>
// // //                     <td className="p-2 border-b border-gray-50">
// // //                       {deal.percentageDiscount ?? 0}%
// // //                     </td>
// // //                     <td className="p-2 border-b border-gray-50">
// // //                       {deal.couponCode || "-"}
// // //                     </td>
// // //                     <td className="p-2 border-b border-gray-50">
// // //                       {deal.dealEnabled ? (
// // //                         <span className="text-green-600 font-medium">
// // //                           Yes
// // //                         </span>
// // //                       ) : (
// // //                         <span className="text-red-500 font-medium">No</span>
// // //                       )}
// // //                     </td>
// // //                     <td className="p-2 border-b border-gray-50">
// // //                       {deal.startDate
// // //                         ? new Date(deal.startDate).toLocaleDateString()
// // //                         : "-"}
// // //                     </td>
// // //                     <td className="p-2 border-b border-gray-50">
// // //                       {deal.endDate
// // //                         ? new Date(deal.endDate).toLocaleDateString()
// // //                         : "-"}
// // //                     </td>
// // //                     <td className="p-2 border-b border-gray-50 max-w-xs whitespace-pre-wrap">
// // //                       {deal.additionalDetails || "-"}
// // //                     </td>
// // //                   </tr>
// // //                 ))}
// // //               </tbody>
// // //             </table>
// // //           </div>
// // //         ) : (
// // //           <div className="py-4 text-gray-400">No deals found.</div>
// // //         )}
// // //       </Modal>
// // //     );
// // //   };

// // //   const renderJobCardsModal = () => {
// // //     // ...unchanged...
// // //     if (!modalOwner) return null;
// // //     return (
// // //       <Modal
// // //         isOpen={jobCardsModalOpen}
// // //         onClose={() => setJobCardsModalOpen(false)}
// // //         title={`Job Cards for ${modalOwner.name}`}
// // //       >
// // //         {modalOwner.jobCards && modalOwner.jobCards.length > 0 ? (
// // //           <div className="overflow-x-auto">
// // //             <table className="min-w-full text-sm border">
// // //               <thead>
// // //                 <tr>
// // //                   <th className="p-2 border-b text-left font-semibold">Job Card No.</th>
// // //                   <th className="p-2 border-b text-left font-semibold">Date</th>
// // //                   <th className="p-2 border-b text-left font-semibold">Phone Number</th>
// // //                   <th className="p-2 border-b text-left font-semibold">Name</th>
// // //                 </tr>
// // //               </thead>
// // //               <tbody>
// // //                 {modalOwner.jobCards.map((card: JobCardType) => (
// // //                   <tr
// // //                     key={card._id}
// // //                     className="hover:bg-blue-50 cursor-pointer"
// // //                     onClick={() => {
// // //                       setSelectedJobCard(card);
// // //                       setJobCardDetailModalOpen(true);
// // //                     }}
// // //                   >
// // //                     <td className="p-2 border-b">{card.jobNo}</td>
// // //                     <td className="p-2 border-b">
// // //                       {card.createdAt
// // //                         ? new Date(card.createdAt).toLocaleString()
// // //                         : "-"}
// // //                     </td>
// // //                     <td className="p-2 border-b">
// // //                       {modalOwner.countryCode ? `${modalOwner.countryCode} ` : ""}
// // //                       {modalOwner.phone || "-"}
// // //                     </td>
// // //                     <td className="p-2 border-b">
// // //                       {modalOwner.name}
// // //                     </td>
// // //                   </tr>
// // //                 ))}
// // //               </tbody>
// // //             </table>
// // //             {/* Job Card Detail Modal */}
// // //             <JobCardDetailModal
// // //               isOpen={jobCardDetailModalOpen}
// // //               onClose={() => {
// // //                 setJobCardDetailModalOpen(false);
// // //                 setSelectedJobCard(null);
// // //               }}
// // //               card={selectedJobCard}
// // //               owner={modalOwner}
// // //               UPLOADS_URL={UPLOADS_URL}
// // //             />
// // //           </div>
// // //         ) : (
// // //           <div className="py-4 text-gray-400">No job cards found.</div>
// // //         )}
// // //       </Modal>
// // //     );
// // //   };

// // //   // --- END MODAL CODE ---

// // //   return (
// // //     <>
// // //       {/* Modals */}
// // //       {renderBusinessProfileModal()}
// // //       {renderCustomersModal()}
// // //       {renderDealsModal()}
// // //       {renderJobCardsModal()}

// // //       {/* Send Notification Modal */}
// // //       <SendNotificationModal
// // //         isOpen={notificationOpen}
// // //         onClose={() => setNotificationOpen(false)}
// // //         selectedOwnerIds={selectedOwnerIds}
// // //         onSuccess={() => {}}
// // //       />

// // //       <div className="overflow-y-auto h-full pb-20 rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-4">
// // //         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
// // //           <h2 className="text-xl font-semibold">Auto Shop Owners</h2>
// // //           <div className="ml-auto flex gap-2">
// // //             {/* Send Custom Notification button */}
// // //             <button
// // //               type="button"
// // //               onClick={() => {
// // //                 if (!selectedOwnerIds.length) {
// // //                   alert("Select at least one shop owner to send notification.");
// // //                   return;
// // //                 }
// // //                 setNotificationOpen(true);
// // //               }}
// // //               disabled={loading}
// // //               className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center space-x-2"
// // //             >
// // //               <svg
// // //                 className="h-5 w-5 mr-2"
// // //                 fill="none"
// // //                 stroke="currentColor"
// // //                 strokeWidth="2"
// // //                 viewBox="0 0 24 24"
// // //               >
// // //                 <path
// // //                   strokeLinecap="round"
// // //                   strokeLinejoin="round"
// // //                   d="M13 16h-1v-4h-1m0-4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
// // //                 />
// // //               </svg>
// // //               <span>
// // //                 Send Notification
// // //                 {selectedOwnerIds.length > 0
// // //                   ? ` (${selectedOwnerIds.length} selected)`
// // //                   : ""}
// // //               </span>
// // //             </button>
// // //             <button
// // //               type="button"
// // //               onClick={handleExport}
// // //               className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-2"
// // //               disabled={exporting || loading}
// // //             >
// // //               {exporting ? (
// // //                 <svg
// // //                   className="animate-spin mr-2 h-4 w-4 text-white"
// // //                   viewBox="0 0 24 24"
// // //                   fill="none"
// // //                 >
// // //                   <circle
// // //                     className="opacity-25"
// // //                     cx="12"
// // //                     cy="12"
// // //                     r="10"
// // //                     stroke="currentColor"
// // //                     strokeWidth="4"
// // //                   />
// // //                   <path
// // //                     className="opacity-75"
// // //                     fill="currentColor"
// // //                     d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
// // //                   />
// // //                 </svg>
// // //               ) : (
// // //                 <svg
// // //                   className="h-5 w-5 mr-2"
// // //                   fill="none"
// // //                   stroke="currentColor"
// // //                   strokeWidth="2"
// // //                   viewBox="0 0 24 24"
// // //                 >
// // //                   <path
// // //                     strokeLinecap="round"
// // //                     strokeLinejoin="round"
// // //                     d="M12 4v16m8-8H4"
// // //                   />
// // //                 </svg>
// // //               )}
// // //               <span>
// // //                 Export
// // //                 {selectedOwnerIds.length > 0
// // //                   ? ` (${selectedOwnerIds.length} selected)`
// // //                   : ""}
// // //                 (.csv)
// // //               </span>
// // //             </button>
// // //           </div>
// // //         </div>
// // //         {loading && (
// // //           <div className="py-10 text-center font-medium text-gray-600">
// // //             Loading shop owners...
// // //           </div>
// // //         )}
// // //         {error && (
// // //           <div className="py-10 text-center font-medium text-red-600">
// // //             Error: {error}
// // //           </div>
// // //         )}
// // //         {!loading && !error && (
// // //           <div className="max-w-full overflow-x-auto">
// // //             <Table>
// // //               <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
// // //                 <TableRow>
// // //                   <TableCell
// // //                     isHeader
// // //                     className="px-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
// // //                   >
// // //                     {/* Checkbox for select all */}
// // //                     <input
// // //                       type="checkbox"
// // //                       checked={isAllSelected}
// // //                       onChange={handleCheckAll}
// // //                       aria-label="Select all shop owners"
// // //                       data-testid="select-all-checkbox"
// // //                     />
// // //                   </TableCell>
// // //                   <TableCell
// // //                     isHeader
// // //                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
// // //                   >
// // //                     Name
// // //                   </TableCell>
// // //                   <TableCell
// // //                     isHeader
// // //                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
// // //                   >
// // //                     Email
// // //                   </TableCell>
// // //                   <TableCell
// // //                     isHeader
// // //                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
// // //                   >
// // //                     Phone
// // //                   </TableCell>
// // //                   <TableCell
// // //                     isHeader
// // //                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
// // //                   >
// // //                     Shop Name
// // //                   </TableCell>
// // //                   <TableCell
// // //                     isHeader
// // //                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
// // //                   >
// // //                     Shop Address
// // //                   </TableCell>
// // //                   <TableCell
// // //                     isHeader
// // //                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
// // //                   >
// // //                     Status
// // //                   </TableCell>
// // //                   <TableCell
// // //                     isHeader
// // //                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
// // //                   >
// // //                     Customers
// // //                   </TableCell>
// // //                   <TableCell
// // //                     isHeader
// // //                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
// // //                   >
// // //                     Deals
// // //                   </TableCell>
// // //                   <TableCell
// // //                     isHeader
// // //                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
// // //                   >
// // //                     Job Cards
// // //                   </TableCell>
// // //                   <TableCell
// // //                     isHeader
// // //                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
// // //                   >
// // //                     Created At
// // //                   </TableCell>
// // //                   <TableCell
// // //                     isHeader
// // //                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
// // //                   >
// // //                     Profile
// // //                   </TableCell>
// // //                   <TableCell
// // //                     isHeader
// // //                     className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
// // //                   >
// // //                     {/* New column for Enable/Suspend */}
// // //                     Action
// // //                   </TableCell>
// // //                 </TableRow>
// // //               </TableHeader>
// // //               <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
// // //                 {owners.length === 0 && (
// // //                   <TableRow>
// // //                     <TableCell
// // //                       className="text-center py-8 text-gray-400"
// // //                       isHeader={false}
// // //                     >
// // //                       No auto shop owners found.
// // //                     </TableCell>
// // //                   </TableRow>
// // //                 )}
// // //                 {owners.map((owner) => {
// // //                   const isSuspended = !!owner.isDisabled;
// // //                   const isLoading = !!actionLoadingMap[owner._id];
// // //                   const isChecked = selectedOwnerIds.includes(owner._id);
// // //                   return (
// // //                     <TableRow key={owner._id}>
// // //                       {/* Checkbox */}
// // //                       <TableCell className="px-3 py-3">
// // //                         <input
// // //                           type="checkbox"
// // //                           checked={isChecked}
// // //                           onChange={e =>
// // //                             handleCheckRow(owner._id, e.target.checked)
// // //                           }
// // //                           aria-label={`Select ${owner.name}`}
// // //                           data-testid={`select-owner-checkbox-${owner._id}`}
// // //                         />
// // //                       </TableCell>
// // //                       {/* Name */}
// // //                       <TableCell className="px-5 py-3 text-gray-800 text-theme-sm dark:text-white/90">
// // //                         <span className="block font-medium">{owner.name}</span>
// // //                       </TableCell>
// // //                       {/* Email */}
// // //                       <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
// // //                         {owner.email || "-"}
// // //                       </TableCell>
// // //                       {/* Phone */}
// // //                       <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
// // //                         {owner.countryCode ? `${owner.countryCode} ` : ""}
// // //                         {owner.phone || "-"}
// // //                       </TableCell>
// // //                       {/* Shop Name */}
// // //                       <TableCell className="px-5 py-3 text-gray-700 text-theme-sm dark:text-gray-200">
// // //                         {owner.businessProfile?.businessName || "-"}
// // //                       </TableCell>
// // //                       {/* Shop Address */}
// // //                       <TableCell className="px-5 py-3 text-gray-700 text-theme-sm dark:text-gray-200">
// // //                         {owner.businessProfile?.businessAddress || "-"}
// // //                       </TableCell>
// // //                       {/* Status: computed from fields */}
// // //                       <TableCell className="px-5 py-3 text-theme-sm">
// // //                         <Badge size="sm" color={getStatusColor(owner) as any}>
// // //                           {getStatus(owner)}
// // //                         </Badge>
// // //                       </TableCell>
// // //                       {/* My Customers: count (clickable for modal) */}
// // //                       <TableCell className="px-5 py-3 text-theme-sm">
// // //                         <button
// // //                           type="button"
// // //                           onClick={() => {
// // //                             setModalOwner(owner);
// // //                             setCustomerModalOpen(true);
// // //                           }}
// // //                           className="text-blue-600 hover:underline focus:outline-none font-medium"
// // //                           aria-label={`View customers for ${owner.name}`}
// // //                         >
// // //                           {owner.myCustomers && owner.myCustomers.length
// // //                             ? owner.myCustomers.length
// // //                             : "0"}
// // //                         </button>
// // //                       </TableCell>
// // //                       {/* Deals: count (clickable for modal) */}
// // //                       <TableCell className="px-5 py-3 text-theme-sm">
// // //                         <button
// // //                           type="button"
// // //                           onClick={() => {
// // //                             setModalOwner(owner);
// // //                             setDealsModalOpen(true);
// // //                           }}
// // //                           className="text-blue-600 hover:underline focus:outline-none font-medium"
// // //                           aria-label={`View deals for ${owner.name}`}
// // //                         >
// // //                           {owner.deals && owner.deals.length
// // //                             ? owner.deals.length
// // //                             : "0"}
// // //                         </button>
// // //                       </TableCell>
// // //                       {/* Job Cards: count (clickable for modal) */}
// // //                       <TableCell className="px-5 py-3 text-theme-sm">
// // //                         <button
// // //                           type="button"
// // //                           onClick={() => {
// // //                             setModalOwner(owner);
// // //                             setJobCardsModalOpen(true);
// // //                           }}
// // //                           className="text-blue-600 hover:underline focus:outline-none font-medium"
// // //                           aria-label={`View job cards for ${owner.name}`}
// // //                         >
// // //                           {owner.jobCards && owner.jobCards.length
// // //                             ? owner.jobCards.length
// // //                             : "0"}
// // //                         </button>
// // //                       </TableCell>
// // //                       {/* Created At */}
// // //                       <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
// // //                         {owner.createdAt
// // //                           ? new Date(owner.createdAt).toLocaleString()
// // //                           : "-"}
// // //                       </TableCell>
// // //                       {/* Profile/Team: button */}
// // //                       <TableCell className="px-5 py-3 text-theme-sm">
// // //                         <button
// // //                           type="button"
// // //                           onClick={() => {
// // //                             setModalOwner(owner);
// // //                             setProfileModalOpen(true);
// // //                           }}
// // //                           className="text-blue-600 hover:underline focus:outline-none font-medium"
// // //                           aria-label={`View business profile for ${owner.name}`}
// // //                         >
// // //                           View
// // //                         </button>
// // //                       </TableCell>
// // //                       {/* Enable/Suspend */}
// // //                       <TableCell className="px-5 py-3 text-theme-sm">
// // //                         <button
// // //                           type="button"
// // //                           disabled={isLoading}
// // //                           className={`inline-flex items-center space-x-2 font-medium rounded px-3 py-1 ${
// // //                             isSuspended
// // //                               ? "bg-green-100 text-green-700 hover:bg-green-200"
// // //                               : "bg-red-100 text-red-700 hover:bg-red-200"
// // //                           } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
// // //                           onClick={() =>
// // //                             changeAutoShopOwnerStatus(
// // //                               owner._id,
// // //                               isSuspended ? "enable" : "disable"
// // //                             )
// // //                           }
// // //                           aria-label={
// // //                             isSuspended
// // //                               ? `Enable ${owner.name}`
// // //                               : `Suspend ${owner.name}`
// // //                           }
// // //                         >
// // //                           {isLoading ? (
// // //                             <svg
// // //                               className="animate-spin h-4 w-4 mr-1 text-gray-500"
// // //                               viewBox="0 0 24 24"
// // //                             >
// // //                               <circle
// // //                                 className="opacity-30"
// // //                                 cx="12"
// // //                                 cy="12"
// // //                                 r="10"
// // //                                 stroke="currentColor"
// // //                                 strokeWidth="4"
// // //                                 fill="none"
// // //                               />
// // //                               <path
// // //                                 className="opacity-90"
// // //                                 fill="currentColor"
// // //                                 d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
// // //                               />
// // //                             </svg>
// // //                           ) : null}
// // //                           <span>
// // //                             {isSuspended ? "Enable" : "Suspend"}
// // //                           </span>
// // //                         </button>
                        
// // //                       </TableCell>
// // //                     </TableRow>
// // //                   );
// // //                 })}
// // //               </TableBody>
// // //             </Table>
// // //           </div>
// // //         )}
// // //       </div>
// // //     </>
// // //   );
// // // };

// // // export default AutoShopOwners;

// // import React, { useState, useEffect } from "react";
// // import axios from "axios";

// // // ====================
// // // Types
// // // ====================
// // type SubService = { subService: string };
// // type IndividualService = { name: string; desc?: string; price?: number; _id: string };
// // type Service = { _id: string; name?: string; desc?: string; services?: IndividualService[]; [k: string]: any };
// // type MyService = { service: Service; subServices?: SubService[]; [k: string]: any };
// // type TeamMemberType = { _id: string; name: string; email?: string; phone?: string; designation?: string; photo?: string };

// // type BusinessProfileType = {
// //   _id: string; businessName?: string; businessAddress?: string; pincode?: string; city?: string;
// //   businessPhone?: string; businessEmail?: string; businessHSTNumber?: string; openHours?: string;
// //   openDays?: string[]; businessLogo?: string; myServices?: MyService[]; myDeals?: (string | DealType)[];
// //   teamMembers?: TeamMemberType[]; businessMapLocation?: any; isOpen?: boolean; rating?: number;
// //   reviewCount?: number; reviewDate?: string; websiteUrl?: string; createdAt?: string; updatedAt?: string;
// //   [k: string]: any;
// // };

// // type CustomerType = { _id: string; name?: string; email?: string; phone?: string };

// // type DealType = {
// //   _id: string; name: string; description?: string; value: string; percentageDiscount: number;
// //   dealEnabled: boolean; createdAt?: string; endDate?: string; couponCode?: string; startDate?: string;
// //   additionalDetails?: string; valueId?: string; createdBy?: string; upto?: number; updatedAt?: string;
// // };

// // type JobCardDealAppliedType = { name: string; percentageDiscount?: number; dealCode?: string };
// // type JobCardServiceSubServiceType = { id: string; price?: number; discountedPrice?: number; discountAmount?: number };
// // type JobCardServiceType = { id: string; subServices: JobCardServiceSubServiceType[] };

// // type JobCardType = {
// //   _id: string; jobNo: string; business: string; customerId: string; vehicleId: string;
// //   odometerReading: number; issueDescription: string; serviceType: string; priorityLevel: string;
// //   services: JobCardServiceType[]; additionalNotes?: string; vehiclePhotos: string[];
// //   dealApplied?: JobCardDealAppliedType; totalPayableAmount: number; paymentStatus: string;
// //   technicalRemarks?: string; createdAt?: string; updatedAt?: string;
// // };

// // type AutoShopOwnerType = {
// //   _id: string; name: string; email?: string; countryCode?: string; phone?: string;
// //   pincode?: string; address?: string; isDisabled?: boolean; isProfileComplete?: boolean;
// //   isBusinessProfileCompleted?: boolean; businessProfile?: BusinessProfileType | null;
// //   myCustomers?: CustomerType[]; createdAt?: string; deals?: DealType[]; jobCards?: JobCardType[];
// // };

// // // ─── STATUS HELPERS ────────────────────────────────────────────────────────────
// // function getStatus(owner: AutoShopOwnerType) {
// //   if (owner.isDisabled) return "Suspended";
// //   if (owner.isProfileComplete && (owner.isBusinessProfileCompleted ?? owner.businessProfile)) return "Active";
// //   if (!owner.isProfileComplete) return "Incomplete";
// //   return "Unknown";
// // }
// // function getStatusStyle(owner: AutoShopOwnerType): React.CSSProperties {
// //   const s = getStatus(owner);
// //   if (s === "Suspended") return { background: "#fcf8e3", color: "#8a6d3b", border: "1px solid #faebcc" };
// //   if (s === "Active") return { background: "#dff0d8", color: "#3c763d", border: "1px solid #d6e9c6" };
// //   return { background: "#f2dede", color: "#a94442", border: "1px solid #ebccd1" };
// // }

// // // ─── EXPORT HELPERS ────────────────────────────────────────────────────────────
// // function toCsv(data: string[][], headers: string[]): string {
// //   const esc = (val: any) => { if (val == null) return ""; let s = String(val); if (/[,"\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"'; return s; };
// //   return headers.map(esc).join(",") + "\n" + data.map((row) => row.map(esc).join(",")).join("\n");
// // }
// // function downloadAsFile(filename: string, content: string) {
// //   const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
// //   const url = URL.createObjectURL(blob);
// //   const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
// //   setTimeout(() => URL.revokeObjectURL(url), 2000);
// // }
// // function autoShopOwnersToCsvRows(owners: AutoShopOwnerType[]): [string[], string[][]] {
// //   const headers = ["Name","Email","Phone","Shop Name","Shop Address","Shop City","Pincode","Status","Customers Count","Deals Count","JobCards Count","Created At","Profile Complete","Business Profile Complete"];
// //   const rows = owners.map((o) => [
// //     o.name ?? "", o.email ?? "",
// //     (o.countryCode ? o.countryCode + " " : "") + (o.phone ?? ""),
// //     o.businessProfile?.businessName ?? "", o.businessProfile?.businessAddress ?? "",
// //     o.businessProfile?.city ?? "", o.businessProfile?.pincode ?? "",
// //     getStatus(o),
// //     o.myCustomers ? o.myCustomers.length.toString() : "0",
// //     o.deals ? o.deals.length.toString() : "0",
// //     o.jobCards ? o.jobCards.length.toString() : "0",
// //     o.createdAt ? new Date(o.createdAt).toLocaleString() : "",
// //     o.isProfileComplete ? "Yes" : "No",
// //     (o.isBusinessProfileCompleted ?? !!o.businessProfile) ? "Yes" : "No",
// //   ]);
// //   return [headers, rows];
// // }

// // // ─── MODAL (AdminLTE style) ────────────────────────────────────────────────────
// // type ModalProps = { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean };
// // const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, wide }) => {
// //   if (!isOpen) return null;
// //   return (
// //     <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
// //       <div style={{ background: "#fff", borderRadius: 4, width: wide ? "min(1100px, 96vw)" : "min(760px, 94vw)", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 5px 15px rgba(0,0,0,.5)" }}>
// //         <div style={{ background: "#3c8dbc", color: "#fff", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "4px 4px 0 0", flexShrink: 0 }}>
// //           <span style={{ fontWeight: 600, fontSize: 16 }}>{title}</span>
// //           <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: 22, lineHeight: 1, cursor: "pointer", padding: "0 2px" }} aria-label="Close" type="button">×</button>
// //         </div>
// //         <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>{children}</div>
// //       </div>
// //     </div>
// //   );
// // };

// // // ─── SHOP OVERVIEW CARD (UNCHANGED) ───────────────────────────────────────────
// // const ShopOverviewCard: React.FC<{ shopData: BusinessProfileType }> = ({ shopData = {} as BusinessProfileType }) => {
// //   const { businessPhone = "289 274 8591", businessName = "Auto 27 Car Garage", businessAddress = "2 Fisherman Dr - Unit 9", openHours = "9:00 AM - 6:00 PM", isOpen = true, myServices = [], businessLogo, businessEmail = "", websiteUrl = "#", businessMapLocation, pincode, rating = 4.8, reviewCount = 142, reviewDate = "01 / 2026" } = shopData || {};
// //   const city = shopData.city || "Brampton, ON L7A 1B5";
// //   let openDays = "Mon - Sat";
// //   if (shopData.openDays) {
// //     if (Array.isArray(shopData.openDays)) {
// //       if (shopData.openDays.length === 1 && typeof shopData.openDays[0] === "string" && shopData.openDays[0].trim().startsWith("[")) {
// //         try { openDays = JSON.parse(shopData.openDays[0]).join(", "); } catch { openDays = shopData.openDays.join(", "); }
// //       } else { openDays = shopData.openDays.join(", "); }
// //     } else { openDays = shopData.openDays as any; }
// //   }
// //   let services: string[] = [];
// //   if (Array.isArray(myServices) && myServices.length > 0) {
// //     for (const item of myServices) { if (item?.service?.name) services.push(item.service.name); }
// //   }
// //   if (services.length === 0) services = ["General Repair","Diagnose - Paccer","Diagnose - Communis","Safety On-line","Oil Change","Brake Service"];
// //   const servicesToShow = services.slice(0, 6);
// //   let imageUrl = businessLogo && typeof businessLogo === "string" ? (businessLogo.startsWith("http") ? businessLogo : `${import.meta.env.VITE_IMAGE_URL ?? ""}/${businessLogo}`) : "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?q=80&w=1200&auto=format&fit=crop";
// //   let directionsUrl = "#";
// //   if (businessMapLocation?.lat && businessMapLocation?.lng) directionsUrl = `https://www.google.com/maps/search/?api=1&query=${businessMapLocation.lat},${businessMapLocation.lng}`;
// //   let webUrl = websiteUrl && websiteUrl !== "#" ? websiteUrl : businessEmail ? `mailto:${businessEmail}` : "#";

// //   return (
// //     <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] mb-7">
// //       <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: "minmax(0,1.15fr) minmax(0,0.72fr) minmax(0,0.72fr) minmax(0,1.65fr) minmax(52px,0.55fr)", minHeight: 48 }}>
// //         <div className="flex items-center justify-center border-r border-slate-200 bg-emerald-50 px-2 py-2 text-center text-[13px] font-bold text-emerald-800"><span className="truncate">📞 {businessPhone}</span></div>
// //         <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center border-r border-slate-200 bg-sky-50 text-[13px] font-semibold text-blue-600 no-underline transition-colors hover:bg-sky-100">Directions</a>
// //         <a href={webUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center border-r border-slate-200 bg-slate-50 text-[13px] font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-100">Website</a>
// //         <div className="flex min-w-0 items-center justify-between gap-2 border-r border-slate-200 bg-white px-3 py-2">
// //           <div className="flex shrink-0 items-center gap-2">
// //             <span className={`h-2 w-2 shrink-0 rounded-full ${isOpen ? "bg-emerald-500" : "bg-red-500"}`} />
// //             <span className={`whitespace-nowrap text-[12px] font-semibold ${isOpen ? "text-emerald-700" : "text-red-600"}`}>{isOpen ? "OPEN NOW" : "CLOSED"}</span>
// //           </div>
// //           <div className="text-right text-[11px] leading-snug text-slate-500"><div className="whitespace-nowrap">{openDays}</div><div className="whitespace-nowrap">{openHours}</div></div>
// //         </div>
// //         <div className="flex items-center justify-center gap-1 bg-amber-50 text-[15px] font-bold text-slate-900"><span className="text-amber-500">★</span>{rating}</div>
// //       </div>
// //       <div className="grid items-start gap-5 p-5" style={{ gridTemplateColumns: "minmax(120px,150px) minmax(0,1.25fr) minmax(0,1.1fr) minmax(100px,118px)" }}>
// //         <img src={imageUrl} alt={businessName} className="h-[108px] w-full rounded-lg object-cover" />
// //         <div className="min-w-0">
// //           <h2 className="mb-1.5 text-xl font-bold leading-tight text-slate-900">{businessName}</h2>
// //           <p className="mb-3 text-[13px] leading-relaxed text-slate-600">{businessAddress}<br />{city}{pincode && <><br />Pincode: {pincode}</>}</p>
// //           <div className="flex flex-wrap gap-2">
// //             <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">{isOpen ? "Open" : "Closed"}</span>
// //             <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] text-blue-700">{openDays}</span>
// //             <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600">{openHours}</span>
// //           </div>
// //         </div>
// //         <div className="min-w-0">
// //           <p className="mb-2.5 text-[13px] font-bold text-slate-900">Services</p>
// //           <ul className="grid list-none gap-x-4 gap-y-1.5 p-0" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
// //             {servicesToShow.map((service, index) => (
// //               <li key={`${service}-${index}`} className="flex min-w-0 items-start gap-1.5 text-[12px] leading-snug text-slate-600">
// //                 <span className="mt-px shrink-0 font-bold text-emerald-500">✓</span>
// //                 <span className="min-w-0">{service}</span>
// //               </li>
// //             ))}
// //           </ul>
// //         </div>
// //         <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-3 text-center">
// //           <span className="text-[26px] font-bold leading-none text-slate-900">{rating}</span>
// //           <span className="mt-1 text-[13px] tracking-wide text-amber-500">★★★★★</span>
// //           <span className="mt-1.5 text-[11px] text-slate-500">{reviewCount} Reviews</span>
// //           <span className="mt-0.5 text-[10px] text-slate-400">{reviewDate}</span>
// //         </div>
// //       </div>
// //       <div className="grid items-center gap-2 bg-slate-900 px-4 py-2.5 text-[12px] text-white" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1.6fr) minmax(0,1fr)" }}>
// //         <span className="truncate font-medium">{businessName}</span>
// //         <span className="truncate text-center text-slate-200">{businessAddress} • {city}</span>
// //         <span className="truncate text-right text-slate-200">{openDays} | {openHours}</span>
// //       </div>
// //     </div>
// //   );
// // };

// // // ─── SEND NOTIFICATION MODAL ──────────────────────────────────────────────────
// // const SendNotificationModal: React.FC<{
// //   isOpen: boolean; onClose: () => void; selectedOwnerIds: string[]; onSuccess: () => void;
// // }> = ({ isOpen, onClose, selectedOwnerIds, onSuccess }) => {
// //   const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [sending, setSending] = useState(false);
// //   const [error, setError] = useState<string | null>(null); const [successMsg, setSuccessMsg] = useState<string | null>(null);

// //   const resetForm = () => { setTitle(""); setBody(""); setError(null); setSuccessMsg(null); setSending(false); };
// //   const handleClose = () => { resetForm(); onClose(); };

// //   const handleSend = async (e: React.FormEvent) => {
// //     e.preventDefault(); setError(null); setSuccessMsg(null);
// //     if (!title.trim() || !body.trim()) { setError("Please provide both title and message body"); return; }
// //     if (!selectedOwnerIds.length) { setError("No shop owners selected."); return; }
// //     setSending(true);
// //     try {
// //       const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/notification/custom/send`, { userType: "autoshopowner", userIds: selectedOwnerIds, title, message: body });
// //       if (res.data.success) { setSuccessMsg("Notification sent successfully!"); onSuccess(); setTimeout(handleClose, 1500); }
// //       else setError(res.data.message || "Failed to send notification");
// //     } catch (err: any) { setError(err?.response?.data?.message || err?.message || "Failed to send notification"); }
// //     finally { setSending(false); }
// //   };

// //   if (!isOpen) return null;
// //   return (
// //     <Modal isOpen={isOpen} onClose={handleClose} title="Send Custom Notification">
// //       <form onSubmit={handleSend}>
// //         <div style={{ marginBottom: 14 }}>
// //           <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
// //             Notification Title <span style={{ color: "#e73d3d" }}>*</span>
// //           </label>
// //           <input style={{ width: "100%", border: "1px solid #d2d6de", borderRadius: 3, padding: "7px 10px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
// //             value={title} onChange={e => setTitle(e.target.value)} maxLength={80} required disabled={sending} placeholder="Eg. Important update for your shop account" />
// //         </div>
// //         <div style={{ marginBottom: 14 }}>
// //           <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
// //             Notification Body <span style={{ color: "#e73d3d" }}>*</span>
// //           </label>
// //           <textarea style={{ width: "100%", border: "1px solid #d2d6de", borderRadius: 3, padding: "7px 10px", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", minHeight: 90 }}
// //             value={body} onChange={e => setBody(e.target.value)} maxLength={240} required disabled={sending} placeholder="Write your message to send to selected shop owners..." />
// //         </div>
// //         <div style={{ fontSize: 13, color: "#2575c4", marginBottom: 10 }}>
// //           To: <strong>{selectedOwnerIds.length} shop owner{selectedOwnerIds.length !== 1 ? "s" : ""} selected</strong>
// //         </div>
// //         {error && <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 10, background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, padding: "7px 10px" }}>{error}</div>}
// //         {successMsg && <div style={{ color: "#27ae60", fontSize: 13, marginBottom: 10, background: "#f0fff4", border: "1px solid #c3e6cb", borderRadius: 3, padding: "7px 10px" }}>{successMsg}</div>}
// //         <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
// //           <button type="button" onClick={handleClose} disabled={sending} style={{ padding: "7px 18px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#444", fontSize: 13, cursor: "pointer" }}>Cancel</button>
// //           <button type="submit" disabled={sending} style={{ padding: "7px 20px", borderRadius: 3, border: "none", background: sending ? "#aaa" : "#00a65a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: sending ? "not-allowed" : "pointer" }}>
// //             {sending ? "Sending…" : `Send to ${selectedOwnerIds.length} owner${selectedOwnerIds.length !== 1 ? "s" : ""}`}
// //           </button>
// //         </div>
// //       </form>
// //     </Modal>
// //   );
// // };

// // // ─── JOB CARD DETAIL MODAL ────────────────────────────────────────────────────
// // const JobCardDetailModal: React.FC<{
// //   isOpen: boolean; onClose: () => void; card: JobCardType | null; owner: AutoShopOwnerType | null; UPLOADS_URL: string;
// // }> = ({ isOpen, onClose, card, owner, UPLOADS_URL }) => {
// //   if (!isOpen || !card || !owner) return null;
// //   return (
// //     <Modal isOpen={isOpen} onClose={onClose} title={`Job Card — ${card.jobNo || card._id}`}>
// //       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, marginBottom: 16 }}>
// //         {[
// //           ["Job No.", card.jobNo || card._id],
// //           ["Date", card.createdAt ? new Date(card.createdAt).toLocaleString() : "-"],
// //           ["Owner", owner.name],
// //           ["Phone", (owner.countryCode ? owner.countryCode + " " : "") + (owner.phone || "-")],
// //           ["Business", card.business],
// //           ["Vehicle ID", card.vehicleId],
// //           ["Odometer", card.odometerReading],
// //           ["Service Type", card.serviceType],
// //           ["Priority", card.priorityLevel],
// //           ["Payment Status", card.paymentStatus],
// //           ["Total Payable", `₹${card.totalPayableAmount}`],
// //           ["Issue", card.issueDescription],
// //           ["Notes", card.additionalNotes || "-"],
// //           ["Technical Remarks", card.technicalRemarks || "-"],
// //           ["Deal Applied", card.dealApplied ? `${card.dealApplied.name} (${card.dealApplied.dealCode ?? ""}${card.dealApplied.percentageDiscount != null ? ` - ${card.dealApplied.percentageDiscount}%` : ""})` : "-"],
// //         ].map(([label, value]) => (
// //           <div key={label as string} style={{ borderBottom: "1px solid #f4f4f4", paddingBottom: 6 }}>
// //             <span style={{ fontWeight: 600 }}>{label}:</span>{" "}
// //             <span style={{ color: "#555" }}>{value as string}</span>
// //           </div>
// //         ))}
// //       </div>
// //       {/* Vehicle Photos */}
// //       {card.vehiclePhotos && card.vehiclePhotos.length > 0 && (
// //         <div style={{ marginBottom: 16 }}>
// //           <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Vehicle Photos</div>
// //           <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
// //             {card.vehiclePhotos.map((photoUrl, idx) => (
// //               <img key={idx} src={photoUrl.startsWith("http") ? photoUrl : `${UPLOADS_URL ?? ""}/${photoUrl.replace(/^\/+/, "")}`} alt="Vehicle" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 3, border: "1px solid #d2d6de" }} loading="lazy" />
// //             ))}
// //           </div>
// //         </div>
// //       )}
// //       {/* Services */}
// //       {Array.isArray(card.services) && card.services.length > 0 && (
// //         <div>
// //           <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Services</div>
// //           <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12 }}>
// //             {card.services.map((serv, sidx) => (
// //               <li key={serv.id + "-" + sidx} style={{ marginBottom: 6 }}>
// //                 <div>Service ID: <span style={{ fontFamily: "monospace" }}>{serv.id}</span></div>
// //                 {Array.isArray(serv.subServices) && serv.subServices.length > 0 && (
// //                   <ul style={{ paddingLeft: 16, margin: "4px 0 0" }}>
// //                     {serv.subServices.map((ss, ssidx) => (
// //                       <li key={ss.id + "-" + ssidx}>
// //                         SubService: <span style={{ fontFamily: "monospace" }}>{ss.id}</span>
// //                         {typeof ss.price !== "undefined" && <span> | ₹{ss.price}</span>}
// //                         {typeof ss.discountedPrice !== "undefined" && ss.discountedPrice !== ss.price && <span style={{ color: "#27ae60", marginLeft: 6 }}>After Discount: ₹{ss.discountedPrice}</span>}
// //                         {typeof ss.discountAmount !== "undefined" && ss.discountAmount > 0 && <span style={{ color: "#e74c3c", marginLeft: 6 }}>(Discount: ₹{ss.discountAmount})</span>}
// //                       </li>
// //                     ))}
// //                   </ul>
// //                 )}
// //               </li>
// //             ))}
// //           </ul>
// //         </div>
// //       )}
// //     </Modal>
// //   );
// // };

// // // ─── SHARED TABLE STYLES ──────────────────────────────────────────────────────
// // const thStyle: React.CSSProperties = { border: "1px solid #d2d6de", background: "#f9fafc", padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 13, color: "#333", whiteSpace: "nowrap" };
// // const tdStyle: React.CSSProperties = { border: "1px solid #d2d6de", padding: "10px 12px", fontSize: 13, color: "#555", verticalAlign: "middle" };
// // const linkBtnStyle: React.CSSProperties = { background: "none", border: "none", color: "#0073b7", cursor: "pointer", padding: 0, fontSize: 12, textDecoration: "underline", fontWeight: 500 };
// // const pageBtn = (active: boolean, disabled: boolean): React.CSSProperties => ({ border: "1px solid", borderColor: active ? "#0073b7" : "#ddd", background: active ? "#0073b7" : "#fff", color: active ? "#fff" : disabled ? "#bbb" : "#777", padding: "6px 13px", fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", marginLeft: -1 });

// // // ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// // const AutoShopOwners: React.FC = () => {
// //   const [owners, setOwners] = useState<AutoShopOwnerType[]>([]);
// //   const [loading, setLoading] = useState<boolean>(true);
// //   const [error, setError] = useState<string>("");
// //   const [search, setSearch] = useState("");
// //   const [pageSize, setPageSize] = useState(10);
// //   const [currentPage, setCurrentPage] = useState(1);

// //   // Modal state
// //   const [customerModalOpen, setCustomerModalOpen] = useState(false);
// //   const [dealsModalOpen, setDealsModalOpen] = useState(false);
// //   const [profileModalOpen, setProfileModalOpen] = useState(false);
// //   const [jobCardsModalOpen, setJobCardsModalOpen] = useState(false);
// //   const [modalOwner, setModalOwner] = useState<AutoShopOwnerType | null>(null);
// //   const [jobCardDetailModalOpen, setJobCardDetailModalOpen] = useState(false);
// //   const [selectedJobCard, setSelectedJobCard] = useState<JobCardType | null>(null);

// //   // Actions
// //   const [actionLoadingMap, setActionLoadingMap] = useState<{ [id: string]: boolean }>({});
// //   const [exporting, setExporting] = useState(false);
// //   const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
// //   const [notificationOpen, setNotificationOpen] = useState(false);

// //   const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL;

// //   const fetchOwners = async () => {
// //     setLoading(true); setError("");
// //     try {
// //       const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/autoshopowners`);
// //       if (res.data.success && Array.isArray(res.data.data)) setOwners(res.data.data);
// //       else setError("Failed to fetch auto shop owners");
// //     } catch (err: any) { setError(err?.response?.data?.message || "Something went wrong"); }
// //     finally { setLoading(false); }
// //   };

// //   const changeAutoShopOwnerStatus = async (ownerId: string, action: "enable" | "disable") => {
// //     setActionLoadingMap((prev) => ({ ...prev, [ownerId]: true }));
// //     try {
// //       const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/autoshopowners/toggle-status`, { userId: ownerId, disable: action === "disable" });
// //       if (res.data.success) await fetchOwners();
// //       else alert("Failed to update status");
// //     } catch (err: any) { alert(err?.response?.data?.message || `Failed to ${action} shop owner.`); }
// //     finally { setActionLoadingMap((prev) => ({ ...prev, [ownerId]: false })); }
// //   };

// //   const handleExport = async () => {
// //     if (!selectedOwnerIds.length) { alert("Please select at least one row to export."); return; }
// //     setExporting(true);
// //     try {
// //       const dataToExport = owners.filter((o) => selectedOwnerIds.includes(o._id));
// //       const [headers, rows] = autoShopOwnersToCsvRows(dataToExport);
// //       downloadAsFile(`autoshop-owners-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, headers));
// //     } catch { alert("Failed to export data."); }
// //     finally { setExporting(false); }
// //   };

// //   // Selection helpers
// //   const isAllPageSelected = (paginated: AutoShopOwnerType[]) => paginated.length > 0 && paginated.every((o) => selectedOwnerIds.includes(o._id));
// //   const handleCheckAll = (paginated: AutoShopOwnerType[], checked: boolean) => {
// //     setSelectedOwnerIds((prev) => {
// //       const ids = paginated.map((o) => o._id);
// //       if (checked) return Array.from(new Set([...prev, ...ids]));
// //       return prev.filter((id) => !ids.includes(id));
// //     });
// //   };
// //   const handleCheckRow = (ownerId: string, checked: boolean) => {
// //     setSelectedOwnerIds((prev) => checked ? [...prev, ownerId] : prev.filter((id) => id !== ownerId));
// //   };

// //   useEffect(() => { fetchOwners(); }, []);

// //   // Filtering + pagination
// //   const filtered = owners.filter((o) => {
// //     const q = search.toLowerCase();
// //     return (o.name || "").toLowerCase().includes(q) || (o.email || "").toLowerCase().includes(q) || (o.phone || "").toLowerCase().includes(q) || (o.businessProfile?.businessName || "").toLowerCase().includes(q) || (o.businessProfile?.businessAddress || "").toLowerCase().includes(q);
// //   });
// //   const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
// //   const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

// //   // ─── BUSINESS PROFILE MODAL ────────────────────────────────────────────────
// //   const renderBusinessProfileModal = () => {
// //     if (!modalOwner || !modalOwner.businessProfile) return null;
// //     const bp = modalOwner.businessProfile;

// //     const renderNestedServices = () => {
// //       if (!Array.isArray(bp.myServices) || bp.myServices.length === 0) return <div style={{ color: "#aaa", fontSize: 13 }}>No services listed</div>;
// //       const serviceMap: { [id: string]: { service: Service; subServiceIds: string[] } } = {};
// //       bp.myServices.forEach((ms: MyService) => {
// //         if (!ms.service || !ms.service._id) return;
// //         if (!serviceMap[ms.service._id]) serviceMap[ms.service._id] = { service: ms.service, subServiceIds: [] };
// //         if (Array.isArray(ms.subServices)) serviceMap[ms.service._id].subServiceIds.push(...ms.subServices.map((ss) => ss.subService));
// //       });
// //       return (
// //         <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
// //           {Object.values(serviceMap).map(({ service, subServiceIds }) => (
// //             <li key={service._id} style={{ marginBottom: 12 }}>
// //               <div style={{ fontWeight: 600, fontSize: 13, color: "#333", marginBottom: 4 }}>{service.name || "-"}</div>
// //               <div style={{ paddingLeft: 14 }}>
// //                 {service.services && service.services.length > 0 ? (
// //                   <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12 }}>
// //                     {service.services.filter((ss) => subServiceIds.length === 0 || subServiceIds.includes(ss._id)).map((ss) => (
// //                       <li key={ss._id}>{ss.name}{ss.desc && <span style={{ color: "#888", marginLeft: 6 }}>{ss.desc}</span>}</li>
// //                     ))}
// //                   </ul>
// //                 ) : <span style={{ color: "#aaa", fontSize: 12 }}>-</span>}
// //               </div>
// //             </li>
// //           ))}
// //         </ul>
// //       );
// //     };

// //     return (
// //       <Modal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} title={`Business Profile — ${bp.businessName || "-"}`} wide>
// //         <ShopOverviewCard shopData={bp} />
// //         <div style={{ marginTop: 20 }}>
// //           {/* Team Members */}
// //           <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom: "2px solid #3c8dbc", paddingBottom: 6, color: "#3c8dbc" }}>Team Members</div>
// //           {Array.isArray(bp.teamMembers) && bp.teamMembers.length > 0 ? (
// //             <div style={{ overflowX: "auto", marginBottom: 20 }}>
// //               <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
// //                 <thead>
// //                   <tr>
// //                     {["Photo","Name","Email","Phone","Designation"].map((h) => <th key={h} style={thStyle}>{h}</th>)}
// //                   </tr>
// //                 </thead>
// //                 <tbody>
// //                   {bp.teamMembers.map((tm: TeamMemberType) => (
// //                     <tr key={tm._id}>
// //                       <td style={tdStyle}>{tm.photo ? <img src={tm.photo.startsWith("http") ? tm.photo : `${import.meta.env.VITE_IMAGE_URL ?? ""}/${tm.photo}`} alt="Team" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} /> : <span style={{ display: "block", width: 36, height: 36, borderRadius: "50%", background: "#ddd" }} />}</td>
// //                       <td style={tdStyle}>{tm.name}</td>
// //                       <td style={tdStyle}>{tm.email || "-"}</td>
// //                       <td style={tdStyle}>{tm.phone || "-"}</td>
// //                       <td style={tdStyle}>{tm.designation || "-"}</td>
// //                     </tr>
// //                   ))}
// //                 </tbody>
// //               </table>
// //             </div>
// //           ) : <div style={{ color: "#aaa", fontSize: 13, marginBottom: 20 }}>No team members</div>}

// //           {/* Services */}
// //           <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom: "2px solid #3c8dbc", paddingBottom: 6, color: "#3c8dbc" }}>Services</div>
// //           <div style={{ marginBottom: 20 }}>{renderNestedServices()}</div>

// //           {/* Deals */}
// //           <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom: "2px solid #3c8dbc", paddingBottom: 6, color: "#3c8dbc" }}>My Deals</div>
// //           {Array.isArray(bp.myDeals) && bp.myDeals.length > 0 ? (
// //             <div style={{ overflowX: "auto" }}>
// //               <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
// //                 <thead>
// //                   <tr>{["Name","Description","Discount %","Coupon","Enabled","Valid From","Ends"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
// //                 </thead>
// //                 <tbody>
// //                   {bp.myDeals.map((deal: any) => {
// //                     if (typeof deal === "string") return <tr key={deal}><td style={tdStyle} colSpan={7}>{deal}</td></tr>;
// //                     return (
// //                       <tr key={deal._id ?? deal.name}>
// //                         <td style={tdStyle}>{deal.name || "-"}</td>
// //                         <td style={{ ...tdStyle, maxWidth: 200 }}>{deal.description || "-"}</td>
// //                         <td style={tdStyle}>{deal.percentageDiscount ?? 0}%</td>
// //                         <td style={tdStyle}>{deal.couponCode || "-"}</td>
// //                         <td style={tdStyle}><span style={{ fontWeight: 600, color: deal.dealEnabled ? "#27ae60" : "#e74c3c" }}>{deal.dealEnabled ? "Yes" : "No"}</span></td>
// //                         <td style={tdStyle}>{deal.startDate ? new Date(deal.startDate).toLocaleDateString() : "-"}</td>
// //                         <td style={tdStyle}>{deal.endDate ? new Date(deal.endDate).toLocaleDateString() : "-"}</td>
// //                       </tr>
// //                     );
// //                   })}
// //                 </tbody>
// //               </table>
// //             </div>
// //           ) : <div style={{ color: "#aaa", fontSize: 13 }}>No shop deals linked</div>}
// //         </div>
// //       </Modal>
// //     );
// //   };

// //   // ─── CUSTOMERS MODAL ──────────────────────────────────────────────────────
// //   const renderCustomersModal = () => {
// //     if (!modalOwner) return null;
// //     return (
// //       <Modal isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} title={`Customers — ${modalOwner.name}`}>
// //         {modalOwner.myCustomers && modalOwner.myCustomers.length > 0 ? (
// //           <div style={{ overflowX: "auto" }}>
// //             <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
// //               <thead><tr>{["Name","Email","Phone"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
// //               <tbody>
// //                 {modalOwner.myCustomers.map((cust) => (
// //                   <tr key={cust._id}>
// //                     <td style={tdStyle}>{cust.name || "-"}</td>
// //                     <td style={tdStyle}>{cust.email || "-"}</td>
// //                     <td style={tdStyle}>{cust.phone || "-"}</td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           </div>
// //         ) : <div style={{ textAlign: "center", color: "#aaa", padding: "30px 0" }}>No customers found.</div>}
// //       </Modal>
// //     );
// //   };

// //   // ─── DEALS MODAL ──────────────────────────────────────────────────────────
// //   const renderDealsModal = () => {
// //     if (!modalOwner) return null;
// //     return (
// //       <Modal isOpen={dealsModalOpen} onClose={() => setDealsModalOpen(false)} title={`Deals — ${modalOwner.name}`} wide>
// //         {modalOwner.deals && modalOwner.deals.length > 0 ? (
// //           <div style={{ overflowX: "auto" }}>
// //             <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
// //               <thead><tr>{["Name","Description","Discount %","Coupon","Enabled","Valid From","Ends","Details"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
// //               <tbody>
// //                 {modalOwner.deals.map((deal) => (
// //                   <tr key={deal._id}>
// //                     <td style={tdStyle}>{deal.name}</td>
// //                     <td style={{ ...tdStyle, maxWidth: 180 }}>{deal.description || "-"}</td>
// //                     <td style={tdStyle}>{deal.percentageDiscount ?? 0}%</td>
// //                     <td style={tdStyle}>{deal.couponCode || "-"}</td>
// //                     <td style={tdStyle}><span style={{ fontWeight: 600, color: deal.dealEnabled ? "#27ae60" : "#e74c3c" }}>{deal.dealEnabled ? "Yes" : "No"}</span></td>
// //                     <td style={tdStyle}>{deal.startDate ? new Date(deal.startDate).toLocaleDateString() : "-"}</td>
// //                     <td style={tdStyle}>{deal.endDate ? new Date(deal.endDate).toLocaleDateString() : "-"}</td>
// //                     <td style={{ ...tdStyle, maxWidth: 160 }}>{deal.additionalDetails || "-"}</td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           </div>
// //         ) : <div style={{ textAlign: "center", color: "#aaa", padding: "30px 0" }}>No deals found.</div>}
// //       </Modal>
// //     );
// //   };

// //   // ─── JOB CARDS MODAL ──────────────────────────────────────────────────────
// //   const renderJobCardsModal = () => {
// //     if (!modalOwner) return null;
// //     return (
// //       <Modal isOpen={jobCardsModalOpen} onClose={() => setJobCardsModalOpen(false)} title={`Job Cards — ${modalOwner.name}`} wide>
// //         {modalOwner.jobCards && modalOwner.jobCards.length > 0 ? (
// //           <div style={{ overflowX: "auto" }}>
// //             <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
// //               <thead>
// //                 <tr>{["Job Card No.","Date","Phone Number","Name"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
// //               </thead>
// //               <tbody>
// //                 {modalOwner.jobCards.map((card: JobCardType) => (
// //                   <tr key={card._id} style={{ cursor: "pointer" }}
// //                     onClick={() => { setSelectedJobCard(card); setJobCardDetailModalOpen(true); }}
// //                     onMouseEnter={e => (e.currentTarget.style.background = "#f0f7ff")}
// //                     onMouseLeave={e => (e.currentTarget.style.background = "")}
// //                   >
// //                     <td style={{ ...tdStyle, color: "#0073b7", fontWeight: 600 }}>{card.jobNo}</td>
// //                     <td style={tdStyle}>{card.createdAt ? new Date(card.createdAt).toLocaleString() : "-"}</td>
// //                     <td style={tdStyle}>{modalOwner.countryCode ? `${modalOwner.countryCode} ` : ""}{modalOwner.phone || "-"}</td>
// //                     <td style={tdStyle}>{modalOwner.name}</td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //             <JobCardDetailModal isOpen={jobCardDetailModalOpen} onClose={() => { setJobCardDetailModalOpen(false); setSelectedJobCard(null); }} card={selectedJobCard} owner={modalOwner} UPLOADS_URL={UPLOADS_URL} />
// //           </div>
// //         ) : <div style={{ textAlign: "center", color: "#aaa", padding: "30px 0" }}>No job cards found.</div>}
// //       </Modal>
// //     );
// //   };

// //   // ─── RENDER ───────────────────────────────────────────────────────────────
// //   return (
// //     <>
// //       {/* Modals */}
// //       {renderBusinessProfileModal()}
// //       {renderCustomersModal()}
// //       {renderDealsModal()}
// //       {renderJobCardsModal()}
// //       <SendNotificationModal isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} selectedOwnerIds={selectedOwnerIds} onSuccess={() => {}} />

// //       {/* Page */}
// //       <div
// //         // You may use Tailwind class if setup, or fallback to CSS below.
// //         className="h-[92vh] overflow-y-auto bg-[#f0f0f0] px-6 py-5 font-sans"
      
// //       >
// //         {/* Heading */}
// //         <h1 style={{ fontSize: 34, fontWeight: 300, color: "#333", marginBottom: 20, marginTop: 0 }}>
// //           Auto Shop Owners
// //         </h1>

// //         {/* Card */}
// //         <div className="mb-10" style={{ background: "#fff", border: "1px solid #d2d6de", borderRadius: 3, boxShadow: "0 1px 1px rgba(0,0,0,.1)" }}>

// //           {/* Card Header */}
// //           <div style={{ padding: "10px 16px", borderBottom: "1px solid #f4f4f4", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
// //             <h3 style={{ margin: 0, fontSize: 17, fontWeight: 400, color: "#444" }}>Shop Owner List</h3>
// //             <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
// //               {selectedOwnerIds.length > 0 && (
// //                 <span style={{ fontSize: 12, color: "#777" }}>{selectedOwnerIds.length} selected</span>
// //               )}
// //               <button
// //                 type="button"
// //                 onClick={() => { if (!selectedOwnerIds.length) { alert("Select at least one shop owner to send notification."); return; } setNotificationOpen(true); }}
// //                 style={{ padding: "6px 14px", borderRadius: 3, border: "none", fontSize: 13, background: "#0073b7", color: "#fff", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
// //               >
// //                 ✉ Send Notification
// //               </button>
// //               <button
// //                 type="button"
// //                 onClick={handleExport}
// //                 disabled={exporting}
// //                 style={{ padding: "6px 14px", borderRadius: 3, border: "none", fontSize: 13, background: exporting ? "#aaa" : "#00a65a", color: "#fff", fontWeight: 600, cursor: exporting ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
// //               >
// //                 ↓ Export (.csv)
// //               </button>
// //             </div>
// //           </div>

// //           {/* Card Body */}
// //           <div style={{ padding: 20 }}>

// //             {/* Top Controls */}
// //             <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
// //               <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#333" }}>
// //                 <span>Show</span>
// //                 <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
// //                   style={{ height: 34, border: "1px solid #d2d6de", borderRadius: 3, padding: "0 10px", fontSize: 14, outline: "none" }}>
// //                   {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
// //                 </select>
// //                 <span>entries</span>
// //               </div>
// //               <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#333" }}>
// //                 <span>Search:</span>
// //                 <input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
// //                   style={{ height: 34, width: 190, border: "1px solid #d2d6de", borderRadius: 3, padding: "0 10px", fontSize: 14, outline: "none" }} />
// //               </div>
// //             </div>

// //             {/* States */}
// //             {loading && <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontSize: 14 }}>Loading shop owners…</div>}
// //             {error && <div style={{ textAlign: "center", padding: "30px 0", color: "#c0392b", fontSize: 14 }}>Error: {error}</div>}

// //             {/* Table */}
// //             {!loading && !error && (
// //               <div style={{ overflowX: "auto" }}>
// //                 <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
// //                   <thead>
// //                     <tr>
// //                       <th style={thStyle}>
// //                         <input type="checkbox" checked={isAllPageSelected(paginated)} onChange={(e) => handleCheckAll(paginated, e.target.checked)} aria-label="Select all" />
// //                       </th>
// //                       {["Name","Email","Phone","Shop Name","Shop Address","Status","Customers","Deals","Job Cards","Created At","Profile","Action"].map((h) => (
// //                         <th key={h} style={thStyle}>{h}</th>
// //                       ))}
// //                     </tr>
// //                   </thead>
// //                   <tbody>
// //                     {paginated.length === 0 && (
// //                       <tr><td colSpan={13} style={{ ...tdStyle, textAlign: "center", color: "#aaa", padding: "36px 0" }}>No auto shop owners found.</td></tr>
// //                     )}
// //                     {paginated.map((owner) => {
// //                       const isSuspended = !!owner.isDisabled;
// //                       const isLoading = !!actionLoadingMap[owner._id];
// //                       const isChecked = selectedOwnerIds.includes(owner._id);
// //                       return (
// //                         <tr key={owner._id} style={{ background: isChecked ? "#f0f7ff" : undefined }}>
// //                           <td style={tdStyle}>
// //                             <input type="checkbox" checked={isChecked} onChange={(e) => handleCheckRow(owner._id, e.target.checked)} aria-label={`Select ${owner.name}`} />
// //                           </td>
// //                           <td style={{ ...tdStyle, fontWeight: 500 }}>{owner.name}</td>
// //                           <td style={tdStyle}>{owner.email || "-"}</td>
// //                           <td style={tdStyle}>{owner.countryCode ? `${owner.countryCode} ` : ""}{owner.phone || "-"}</td>
// //                           <td style={tdStyle}>{owner.businessProfile?.businessName || "-"}</td>
// //                           <td style={tdStyle}>{owner.businessProfile?.businessAddress || "-"}</td>
// //                           <td style={tdStyle}>
// //                             <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 3, fontSize: 12, fontWeight: 600, ...getStatusStyle(owner) }}>
// //                               {getStatus(owner)}
// //                             </span>
// //                           </td>
// //                           <td style={tdStyle}>
// //                             <button type="button" onClick={() => { setModalOwner(owner); setCustomerModalOpen(true); }} style={linkBtnStyle}>
// //                               {owner.myCustomers?.length ?? 0}
// //                             </button>
// //                           </td>
// //                           <td style={tdStyle}>
// //                             <button type="button" onClick={() => { setModalOwner(owner); setDealsModalOpen(true); }} style={linkBtnStyle}>
// //                               {owner.deals?.length ?? 0}
// //                             </button>
// //                           </td>
// //                           <td style={tdStyle}>
// //                             <button type="button" onClick={() => { setModalOwner(owner); setJobCardsModalOpen(true); }} style={linkBtnStyle}>
// //                               {owner.jobCards?.length ?? 0}
// //                             </button>
// //                           </td>
// //                           <td style={tdStyle}>{owner.createdAt ? new Date(owner.createdAt).toLocaleString() : "-"}</td>
// //                           <td style={tdStyle}>
// //                             <button type="button" onClick={() => { setModalOwner(owner); setProfileModalOpen(true); }} style={linkBtnStyle}>View</button>
// //                           </td>
// //                           <td style={tdStyle}>
// //                             <button
// //                               type="button"
// //                               disabled={isLoading}
// //                               onClick={() => changeAutoShopOwnerStatus(owner._id, isSuspended ? "enable" : "disable")}
// //                               style={{
// //                                 padding: "4px 12px", borderRadius: 3, border: "none", fontSize: 12, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer",
// //                                 background: isSuspended ? "#dff0d8" : "#f2dede",
// //                                 color: isSuspended ? "#3c763d" : "#a94442",
// //                                 opacity: isLoading ? 0.6 : 1,
// //                               }}
// //                               aria-label={isSuspended ? `Enable ${owner.name}` : `Suspend ${owner.name}`}
// //                             >
// //                               {isLoading ? "…" : isSuspended ? "Enable" : "Suspend"}
// //                             </button>
// //                           </td>
// //                         </tr>
// //                       );
// //                     })}
// //                   </tbody>
// //                 </table>
// //               </div>
// //             )}

// //             {/* Footer: count + pagination */}
// //             {!loading && !error && (
// //               <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
// //                 <p style={{ margin: 0, fontSize: 14, color: "#333" }}>
// //                   {filtered.length === 0 ? "No entries" : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} entries${search ? ` (filtered from ${owners.length} total)` : ""}`}
// //                 </p>
// //                 <div style={{ display: "flex" }}>
// //                   <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={pageBtn(false, currentPage === 1)}>Previous</button>
// //                   {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
// //                     <button key={pg} onClick={() => setCurrentPage(pg)} style={pageBtn(pg === currentPage, false)}>{pg}</button>
// //                   ))}
// //                   <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={pageBtn(false, currentPage === totalPages)}>Next</button>
// //                 </div>
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     </>
// //   );
// // };

// // export default AutoShopOwners;


// import React, { useState, useEffect } from "react";
// import axios from "axios";

// // ====================
// // Types
// // ====================
// type SubService = { subService: string };
// type IndividualService = { name: string; desc?: string; price?: number; _id: string };
// type Service = { _id: string; name?: string; desc?: string; services?: IndividualService[]; [k: string]: any };
// type MyService = { service: Service; subServices?: SubService[]; [k: string]: any };
// type TeamMemberType = { _id: string; name: string; email?: string; phone?: string; designation?: string; photo?: string };

// type BusinessProfileType = {
//   _id: string; businessName?: string; businessAddress?: string; pincode?: string; city?: string;
//   businessPhone?: string; businessEmail?: string; businessHSTNumber?: string; openHours?: string;
//   openDays?: string[]; businessLogo?: string; myServices?: MyService[]; myDeals?: (string | DealType)[];
//   teamMembers?: TeamMemberType[]; businessMapLocation?: any; isOpen?: boolean; rating?: number;
//   reviewCount?: number; reviewDate?: string; websiteUrl?: string; createdAt?: string; updatedAt?: string;
//   [k: string]: any;
// };

// type CustomerType = { _id: string; name?: string; email?: string; phone?: string };

// type DealType = {
//   _id: string; name: string; description?: string; value: string; percentageDiscount: number;
//   dealEnabled: boolean; createdAt?: string; endDate?: string; couponCode?: string; startDate?: string;
//   additionalDetails?: string; valueId?: string; createdBy?: string; upto?: number; updatedAt?: string;
// };

// type JobCardDealAppliedType = { name: string; percentageDiscount?: number; dealCode?: string };
// type JobCardServiceSubServiceType = { id: string; price?: number; discountedPrice?: number; discountAmount?: number };
// type JobCardServiceType = { id: string; subServices: JobCardServiceSubServiceType[] };

// type JobCardType = {
//   _id: string; jobNo: string; business: string; customerId: string; vehicleId: string;
//   odometerReading: number; issueDescription: string; serviceType: string; priorityLevel: string;
//   services: JobCardServiceType[]; additionalNotes?: string; vehiclePhotos: string[];
//   dealApplied?: JobCardDealAppliedType; totalPayableAmount: number; paymentStatus: string;
//   technicalRemarks?: string; createdAt?: string; updatedAt?: string;
// };

// type AutoShopOwnerType = {
//   _id: string; name: string; email?: string; countryCode?: string; phone?: string;
//   pincode?: string; address?: string; isDisabled?: boolean; isProfileComplete?: boolean;
//   isBusinessProfileCompleted?: boolean; businessProfile?: BusinessProfileType | null;
//   myCustomers?: CustomerType[]; createdAt?: string; deals?: DealType[]; jobCards?: JobCardType[];
// };

// // ─── ALL EXPORT COLUMNS ────────────────────────────────────────────────────────
// const ALL_EXPORT_COLUMNS: { key: string; label: string }[] = [
//   { key: "name", label: "Name" },
//   { key: "email", label: "Email" },
//   { key: "phone", label: "Phone" },
//   { key: "shopName", label: "Shop Name" },
//   { key: "shopAddress", label: "Shop Address" },
//   { key: "shopCity", label: "Shop City" },
//   { key: "pincode", label: "Pincode" },
//   { key: "status", label: "Status" },
//   { key: "customersCount", label: "Customers Count" },
//   { key: "dealsCount", label: "Deals Count" },
//   { key: "jobCardsCount", label: "Job Cards Count" },
//   { key: "createdAt", label: "Created At" },
//   { key: "profileComplete", label: "Profile Complete" },
//   { key: "businessProfileComplete", label: "Business Profile Complete" },
// ];

// // ─── STATUS HELPERS ────────────────────────────────────────────────────────────
// function getStatus(owner: AutoShopOwnerType) {
//   if (owner.isDisabled) return "Suspended";
//   if (owner.isProfileComplete && (owner.isBusinessProfileCompleted ?? owner.businessProfile)) return "Active";
//   if (!owner.isProfileComplete) return "Incomplete";
//   return "Unknown";
// }
// function getStatusStyle(owner: AutoShopOwnerType): React.CSSProperties {
//   const s = getStatus(owner);
//   if (s === "Suspended") return { background: "#fcf8e3", color: "#8a6d3b", border: "1px solid #faebcc" };
//   if (s === "Active") return { background: "#dff0d8", color: "#3c763d", border: "1px solid #d6e9c6" };
//   return { background: "#f2dede", color: "#a94442", border: "1px solid #ebccd1" };
// }

// // ─── EXPORT HELPERS ────────────────────────────────────────────────────────────
// function getOwnerRowValue(owner: AutoShopOwnerType, key: string): string {
//   switch (key) {
//     case "name": return owner.name ?? "";
//     case "email": return owner.email ?? "";
//     case "phone": return (owner.countryCode ? owner.countryCode + " " : "") + (owner.phone ?? "");
//     case "shopName": return owner.businessProfile?.businessName ?? "";
//     case "shopAddress": return owner.businessProfile?.businessAddress ?? "";
//     case "shopCity": return owner.businessProfile?.city ?? "";
//     case "pincode": return owner.businessProfile?.pincode ?? "";
//     case "status": return getStatus(owner);
//     case "customersCount": return owner.myCustomers ? owner.myCustomers.length.toString() : "0";
//     case "dealsCount": return owner.deals ? owner.deals.length.toString() : "0";
//     case "jobCardsCount": return owner.jobCards ? owner.jobCards.length.toString() : "0";
//     case "createdAt": return owner.createdAt ? new Date(owner.createdAt).toLocaleString() : "";
//     case "profileComplete": return owner.isProfileComplete ? "Yes" : "No";
//     case "businessProfileComplete": return (owner.isBusinessProfileCompleted ?? !!owner.businessProfile) ? "Yes" : "No";
//     default: return "";
//   }
// }

// function toCsv(data: string[][], headers: string[]): string {
//   const esc = (val: any) => { if (val == null) return ""; let s = String(val); if (/[,"\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"'; return s; };
//   return headers.map(esc).join(",") + "\n" + data.map((row) => row.map(esc).join(",")).join("\n");
// }
// function downloadAsFile(filename: string, content: string) {
//   const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
//   setTimeout(() => URL.revokeObjectURL(url), 2000);
// }

// // ─── MODAL (AdminLTE style) ────────────────────────────────────────────────────
// type ModalProps = { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean };
// const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, wide }) => {
//   if (!isOpen) return null;
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
//       <div style={{ background: "#fff", borderRadius: 4, width: wide ? "min(1100px, 96vw)" : "min(760px, 94vw)", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 5px 15px rgba(0,0,0,.5)" }}>
//         <div style={{ background: "#3c8dbc", color: "#fff", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "4px 4px 0 0", flexShrink: 0 }}>
//           <span style={{ fontWeight: 600, fontSize: 16 }}>{title}</span>
//           <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: 22, lineHeight: 1, cursor: "pointer", padding: "0 2px" }} aria-label="Close" type="button">×</button>
//         </div>
//         <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>{children}</div>
//       </div>
//     </div>
//   );
// };

// // ─── COLUMN SELECTOR EXPORT MODAL ─────────────────────────────────────────────
// const ExportColumnsModal: React.FC<{
//   isOpen: boolean;
//   onClose: () => void;
//   selectedOwnerIds: string[];
//   owners: AutoShopOwnerType[];
// }> = ({ isOpen, onClose, selectedOwnerIds, owners }) => {
//   const [selectedCols, setSelectedCols] = useState<string[]>(ALL_EXPORT_COLUMNS.map((c) => c.key));

//   const toggleCol = (key: string) => {
//     setSelectedCols((prev) =>
//       prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
//     );
//   };

//   const allSelected = selectedCols.length === ALL_EXPORT_COLUMNS.length;
//   const toggleAll = () => {
//     setSelectedCols(allSelected ? [] : ALL_EXPORT_COLUMNS.map((c) => c.key));
//   };

//   const handleExport = () => {
//     if (!selectedCols.length) { alert("Please select at least one column."); return; }
//     const orderedCols = ALL_EXPORT_COLUMNS.filter((c) => selectedCols.includes(c.key));
//     const headers = orderedCols.map((c) => c.label);
//     const dataToExport = owners.filter((o) => selectedOwnerIds.includes(o._id));
//     const rows = dataToExport.map((owner) => orderedCols.map((c) => getOwnerRowValue(owner, c.key)));
//     downloadAsFile(`autoshop-owners-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, headers));
//     onClose();
//   };

//   if (!isOpen) return null;
//   return (
//     <Modal isOpen={isOpen} onClose={onClose} title="Select Columns to Export">
//       <div style={{ marginBottom: 14 }}>
//         <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
//           <span style={{ fontSize: 13, color: "#555" }}>
//             Exporting <strong>{selectedOwnerIds.length}</strong> row{selectedOwnerIds.length !== 1 ? "s" : ""}
//           </span>
//           <button
//             type="button"
//             onClick={toggleAll}
//             style={{ fontSize: 12, color: "#0073b7", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
//           >
//             {allSelected ? "Deselect All" : "Select All"}
//           </button>
//         </div>
//         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
//           {ALL_EXPORT_COLUMNS.map((col) => (
//             <label
//               key={col.key}
//               style={{
//                 display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
//                 fontSize: 13, color: "#333", padding: "6px 10px", borderRadius: 3,
//                 background: selectedCols.includes(col.key) ? "#f0f7ff" : "#fafafa",
//                 border: `1px solid ${selectedCols.includes(col.key) ? "#0073b7" : "#d2d6de"}`,
//                 transition: "all 0.15s",
//               }}
//             >
//               <input
//                 type="checkbox"
//                 checked={selectedCols.includes(col.key)}
//                 onChange={() => toggleCol(col.key)}
//                 style={{ accentColor: "#0073b7", width: 14, height: 14, cursor: "pointer", flexShrink: 0 }}
//               />
//               {col.label}
//             </label>
//           ))}
//         </div>
//       </div>

//       {selectedCols.length === 0 && (
//         <div style={{ color: "#c0392b", fontSize: 12, marginBottom: 10, background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, padding: "6px 10px" }}>
//           Please select at least one column to export.
//         </div>
//       )}

//       <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
//         <button
//           type="button"
//           onClick={onClose}
//           style={{ padding: "7px 18px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#444", fontSize: 13, cursor: "pointer" }}
//         >
//           Cancel
//         </button>
//         <button
//           type="button"
//           onClick={handleExport}
//           disabled={selectedCols.length === 0}
//           style={{
//             padding: "7px 20px", borderRadius: 3, border: "none",
//             background: selectedCols.length === 0 ? "#aaa" : "#00a65a",
//             color: "#fff", fontSize: 13, fontWeight: 600,
//             cursor: selectedCols.length === 0 ? "not-allowed" : "pointer",
//           }}
//         >
//           ↓ Export {selectedCols.length} Column{selectedCols.length !== 1 ? "s" : ""}
//         </button>
//       </div>
//     </Modal>
//   );
// };

// // ─── SHOP OVERVIEW CARD (UNCHANGED) ───────────────────────────────────────────
// const ShopOverviewCard: React.FC<{ shopData: BusinessProfileType }> = ({ shopData = {} as BusinessProfileType }) => {
//   const { businessPhone = "289 274 8591", businessName = "Auto 27 Car Garage", businessAddress = "2 Fisherman Dr - Unit 9", openHours = "9:00 AM - 6:00 PM", isOpen = true, myServices = [], businessLogo, businessEmail = "", websiteUrl = "#", businessMapLocation, pincode, rating = 4.8, reviewCount = 142, reviewDate = "01 / 2026" } = shopData || {};
//   const city = shopData.city || "Brampton, ON L7A 1B5";
//   let openDays = "Mon - Sat";
//   if (shopData.openDays) {
//     if (Array.isArray(shopData.openDays)) {
//       if (shopData.openDays.length === 1 && typeof shopData.openDays[0] === "string" && shopData.openDays[0].trim().startsWith("[")) {
//         try { openDays = JSON.parse(shopData.openDays[0]).join(", "); } catch { openDays = shopData.openDays.join(", "); }
//       } else { openDays = shopData.openDays.join(", "); }
//     } else { openDays = shopData.openDays as any; }
//   }
//   let services: string[] = [];
//   if (Array.isArray(myServices) && myServices.length > 0) {
//     for (const item of myServices) { if (item?.service?.name) services.push(item.service.name); }
//   }
//   if (services.length === 0) services = ["General Repair","Diagnose - Paccer","Diagnose - Communis","Safety On-line","Oil Change","Brake Service"];
//   const servicesToShow = services.slice(0, 6);
//   let imageUrl = businessLogo && typeof businessLogo === "string" ? (businessLogo.startsWith("http") ? businessLogo : `${import.meta.env.VITE_IMAGE_URL ?? ""}/${businessLogo}`) : "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?q=80&w=1200&auto=format&fit=crop";
//   let directionsUrl = "#";
//   if (businessMapLocation?.lat && businessMapLocation?.lng) directionsUrl = `https://www.google.com/maps/search/?api=1&query=${businessMapLocation.lat},${businessMapLocation.lng}`;
//   let webUrl = websiteUrl && websiteUrl !== "#" ? websiteUrl : businessEmail ? `mailto:${businessEmail}` : "#";

//   return (
//     <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] mb-7">
//       <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: "minmax(0,1.15fr) minmax(0,0.72fr) minmax(0,0.72fr) minmax(0,1.65fr) minmax(52px,0.55fr)", minHeight: 48 }}>
//         <div className="flex items-center justify-center border-r border-slate-200 bg-emerald-50 px-2 py-2 text-center text-[13px] font-bold text-emerald-800"><span className="truncate">📞 {businessPhone}</span></div>
//         <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center border-r border-slate-200 bg-sky-50 text-[13px] font-semibold text-blue-600 no-underline transition-colors hover:bg-sky-100">Directions</a>
//         <a href={webUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center border-r border-slate-200 bg-slate-50 text-[13px] font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-100">Website</a>
//         <div className="flex min-w-0 items-center justify-between gap-2 border-r border-slate-200 bg-white px-3 py-2">
//           <div className="flex shrink-0 items-center gap-2">
//             <span className={`h-2 w-2 shrink-0 rounded-full ${isOpen ? "bg-emerald-500" : "bg-red-500"}`} />
//             <span className={`whitespace-nowrap text-[12px] font-semibold ${isOpen ? "text-emerald-700" : "text-red-600"}`}>{isOpen ? "OPEN NOW" : "CLOSED"}</span>
//           </div>
//           <div className="text-right text-[11px] leading-snug text-slate-500"><div className="whitespace-nowrap">{openDays}</div><div className="whitespace-nowrap">{openHours}</div></div>
//         </div>
//         <div className="flex items-center justify-center gap-1 bg-amber-50 text-[15px] font-bold text-slate-900"><span className="text-amber-500">★</span>{rating}</div>
//       </div>
//       <div className="grid items-start gap-5 p-5" style={{ gridTemplateColumns: "minmax(120px,150px) minmax(0,1.25fr) minmax(0,1.1fr) minmax(100px,118px)" }}>
//         <img src={imageUrl} alt={businessName} className="h-[108px] w-full rounded-lg object-cover" />
//         <div className="min-w-0">
//           <h2 className="mb-1.5 text-xl font-bold leading-tight text-slate-900">{businessName}</h2>
//           <p className="mb-3 text-[13px] leading-relaxed text-slate-600">{businessAddress}<br />{city}{pincode && <><br />Pincode: {pincode}</>}</p>
//           <div className="flex flex-wrap gap-2">
//             <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">{isOpen ? "Open" : "Closed"}</span>
//             <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] text-blue-700">{openDays}</span>
//             <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600">{openHours}</span>
//           </div>
//         </div>
//         <div className="min-w-0">
//           <p className="mb-2.5 text-[13px] font-bold text-slate-900">Services</p>
//           <ul className="grid list-none gap-x-4 gap-y-1.5 p-0" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
//             {servicesToShow.map((service, index) => (
//               <li key={`${service}-${index}`} className="flex min-w-0 items-start gap-1.5 text-[12px] leading-snug text-slate-600">
//                 <span className="mt-px shrink-0 font-bold text-emerald-500">✓</span>
//                 <span className="min-w-0">{service}</span>
//               </li>
//             ))}
//           </ul>
//         </div>
//         <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-3 text-center">
//           <span className="text-[26px] font-bold leading-none text-slate-900">{rating}</span>
//           <span className="mt-1 text-[13px] tracking-wide text-amber-500">★★★★★</span>
//           <span className="mt-1.5 text-[11px] text-slate-500">{reviewCount} Reviews</span>
//           <span className="mt-0.5 text-[10px] text-slate-400">{reviewDate}</span>
//         </div>
//       </div>
//       <div className="grid items-center gap-2 bg-slate-900 px-4 py-2.5 text-[12px] text-white" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1.6fr) minmax(0,1fr)" }}>
//         <span className="truncate font-medium">{businessName}</span>
//         <span className="truncate text-center text-slate-200">{businessAddress} • {city}</span>
//         <span className="truncate text-right text-slate-200">{openDays} | {openHours}</span>
//       </div>
//     </div>
//   );
// };

// // ─── SEND NOTIFICATION MODAL ──────────────────────────────────────────────────
// const SendNotificationModal: React.FC<{
//   isOpen: boolean; onClose: () => void; selectedOwnerIds: string[]; onSuccess: () => void;
// }> = ({ isOpen, onClose, selectedOwnerIds, onSuccess }) => {
//   const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [sending, setSending] = useState(false);
//   const [error, setError] = useState<string | null>(null); const [successMsg, setSuccessMsg] = useState<string | null>(null);

//   const resetForm = () => { setTitle(""); setBody(""); setError(null); setSuccessMsg(null); setSending(false); };
//   const handleClose = () => { resetForm(); onClose(); };

//   const handleSend = async (e: React.FormEvent) => {
//     e.preventDefault(); setError(null); setSuccessMsg(null);
//     if (!title.trim() || !body.trim()) { setError("Please provide both title and message body"); return; }
//     if (!selectedOwnerIds.length) { setError("No shop owners selected."); return; }
//     setSending(true);
//     try {
//       const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/notification/custom/send`, { userType: "autoshopowner", userIds: selectedOwnerIds, title, message: body });
//       if (res.data.success) { setSuccessMsg("Notification sent successfully!"); onSuccess(); setTimeout(handleClose, 1500); }
//       else setError(res.data.message || "Failed to send notification");
//     } catch (err: any) { setError(err?.response?.data?.message || err?.message || "Failed to send notification"); }
//     finally { setSending(false); }
//   };

//   if (!isOpen) return null;
//   return (
//     <Modal isOpen={isOpen} onClose={handleClose} title="Send Custom Notification">
//       <form onSubmit={handleSend}>
//         <div style={{ marginBottom: 14 }}>
//           <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
//             Notification Title <span style={{ color: "#e73d3d" }}>*</span>
//           </label>
//           <input style={{ width: "100%", border: "1px solid #d2d6de", borderRadius: 3, padding: "7px 10px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
//             value={title} onChange={e => setTitle(e.target.value)} maxLength={80} required disabled={sending} placeholder="Eg. Important update for your shop account" />
//         </div>
//         <div style={{ marginBottom: 14 }}>
//           <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
//             Notification Body <span style={{ color: "#e73d3d" }}>*</span>
//           </label>
//           <textarea style={{ width: "100%", border: "1px solid #d2d6de", borderRadius: 3, padding: "7px 10px", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", minHeight: 90 }}
//             value={body} onChange={e => setBody(e.target.value)} maxLength={240} required disabled={sending} placeholder="Write your message to send to selected shop owners..." />
//         </div>
//         <div style={{ fontSize: 13, color: "#2575c4", marginBottom: 10 }}>
//           To: <strong>{selectedOwnerIds.length} shop owner{selectedOwnerIds.length !== 1 ? "s" : ""} selected</strong>
//         </div>
//         {error && <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 10, background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, padding: "7px 10px" }}>{error}</div>}
//         {successMsg && <div style={{ color: "#27ae60", fontSize: 13, marginBottom: 10, background: "#f0fff4", border: "1px solid #c3e6cb", borderRadius: 3, padding: "7px 10px" }}>{successMsg}</div>}
//         <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
//           <button type="button" onClick={handleClose} disabled={sending} style={{ padding: "7px 18px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#444", fontSize: 13, cursor: "pointer" }}>Cancel</button>
//           <button type="submit" disabled={sending} style={{ padding: "7px 20px", borderRadius: 3, border: "none", background: sending ? "#aaa" : "#00a65a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: sending ? "not-allowed" : "pointer" }}>
//             {sending ? "Sending…" : `Send to ${selectedOwnerIds.length} owner${selectedOwnerIds.length !== 1 ? "s" : ""}`}
//           </button>
//         </div>
//       </form>
//     </Modal>
//   );
// };

// // ─── JOB CARD DETAIL MODAL ────────────────────────────────────────────────────
// const JobCardDetailModal: React.FC<{
//   isOpen: boolean; onClose: () => void; card: JobCardType | null; owner: AutoShopOwnerType | null; UPLOADS_URL: string;
// }> = ({ isOpen, onClose, card, owner, UPLOADS_URL }) => {
//   if (!isOpen || !card || !owner) return null;
//   return (
//     <Modal isOpen={isOpen} onClose={onClose} title={`Job Card — ${card.jobNo || card._id}`}>
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, marginBottom: 16 }}>
//         {[
//           ["Job No.", card.jobNo || card._id],
//           ["Date", card.createdAt ? new Date(card.createdAt).toLocaleString() : "-"],
//           ["Owner", owner.name],
//           ["Phone", (owner.countryCode ? owner.countryCode + " " : "") + (owner.phone || "-")],
//           ["Business", card.business],
//           ["Vehicle ID", card.vehicleId],
//           ["Odometer", card.odometerReading],
//           ["Service Type", card.serviceType],
//           ["Priority", card.priorityLevel],
//           ["Payment Status", card.paymentStatus],
//           ["Total Payable", `₹${card.totalPayableAmount}`],
//           ["Issue", card.issueDescription],
//           ["Notes", card.additionalNotes || "-"],
//           ["Technical Remarks", card.technicalRemarks || "-"],
//           ["Deal Applied", card.dealApplied ? `${card.dealApplied.name} (${card.dealApplied.dealCode ?? ""}${card.dealApplied.percentageDiscount != null ? ` - ${card.dealApplied.percentageDiscount}%` : ""})` : "-"],
//         ].map(([label, value]) => (
//           <div key={label as string} style={{ borderBottom: "1px solid #f4f4f4", paddingBottom: 6 }}>
//             <span style={{ fontWeight: 600 }}>{label}:</span>{" "}
//             <span style={{ color: "#555" }}>{value as string}</span>
//           </div>
//         ))}
//       </div>
//       {card.vehiclePhotos && card.vehiclePhotos.length > 0 && (
//         <div style={{ marginBottom: 16 }}>
//           <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Vehicle Photos</div>
//           <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
//             {card.vehiclePhotos.map((photoUrl, idx) => (
//               <img key={idx} src={photoUrl.startsWith("http") ? photoUrl : `${UPLOADS_URL ?? ""}/${photoUrl.replace(/^\/+/, "")}`} alt="Vehicle" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 3, border: "1px solid #d2d6de" }} loading="lazy" />
//             ))}
//           </div>
//         </div>
//       )}
//       {Array.isArray(card.services) && card.services.length > 0 && (
//         <div>
//           <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Services</div>
//           <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12 }}>
//             {card.services.map((serv, sidx) => (
//               <li key={serv.id + "-" + sidx} style={{ marginBottom: 6 }}>
//                 <div>Service ID: <span style={{ fontFamily: "monospace" }}>{serv.id}</span></div>
//                 {Array.isArray(serv.subServices) && serv.subServices.length > 0 && (
//                   <ul style={{ paddingLeft: 16, margin: "4px 0 0" }}>
//                     {serv.subServices.map((ss, ssidx) => (
//                       <li key={ss.id + "-" + ssidx}>
//                         SubService: <span style={{ fontFamily: "monospace" }}>{ss.id}</span>
//                         {typeof ss.price !== "undefined" && <span> | ₹{ss.price}</span>}
//                         {typeof ss.discountedPrice !== "undefined" && ss.discountedPrice !== ss.price && <span style={{ color: "#27ae60", marginLeft: 6 }}>After Discount: ₹{ss.discountedPrice}</span>}
//                         {typeof ss.discountAmount !== "undefined" && ss.discountAmount > 0 && <span style={{ color: "#e74c3c", marginLeft: 6 }}>(Discount: ₹{ss.discountAmount})</span>}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </Modal>
//   );
// };

// // ─── SHARED TABLE STYLES ──────────────────────────────────────────────────────
// const thStyle: React.CSSProperties = { border: "1px solid #d2d6de", background: "#f9fafc", padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 13, color: "#333", whiteSpace: "nowrap" };
// const tdStyle: React.CSSProperties = { border: "1px solid #d2d6de", padding: "10px 12px", fontSize: 13, color: "#555", verticalAlign: "middle" };
// const linkBtnStyle: React.CSSProperties = { background: "none", border: "none", color: "#0073b7", cursor: "pointer", padding: 0, fontSize: 12, textDecoration: "underline", fontWeight: 500 };
// const pageBtn = (active: boolean, disabled: boolean): React.CSSProperties => ({ border: "1px solid", borderColor: active ? "#0073b7" : "#ddd", background: active ? "#0073b7" : "#fff", color: active ? "#fff" : disabled ? "#bbb" : "#777", padding: "6px 13px", fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", marginLeft: -1 });

// // ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// const AutoShopOwners: React.FC = () => {
//   const [owners, setOwners] = useState<AutoShopOwnerType[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string>("");
//   const [search, setSearch] = useState("");
//   const [pageSize, setPageSize] = useState(10);
//   const [currentPage, setCurrentPage] = useState(1);

//   // Modal state
//   const [customerModalOpen, setCustomerModalOpen] = useState(false);
//   const [dealsModalOpen, setDealsModalOpen] = useState(false);
//   const [profileModalOpen, setProfileModalOpen] = useState(false);
//   const [jobCardsModalOpen, setJobCardsModalOpen] = useState(false);
//   const [modalOwner, setModalOwner] = useState<AutoShopOwnerType | null>(null);
//   const [jobCardDetailModalOpen, setJobCardDetailModalOpen] = useState(false);
//   const [selectedJobCard, setSelectedJobCard] = useState<JobCardType | null>(null);

//   // Actions
//   const [actionLoadingMap, setActionLoadingMap] = useState<{ [id: string]: boolean }>({});
//   const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
//   const [notificationOpen, setNotificationOpen] = useState(false);
//   const [exportModalOpen, setExportModalOpen] = useState(false);

//   const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL;

//   const fetchOwners = async () => {
//     setLoading(true); setError("");
//     try {
//       const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/autoshopowners`);
//       if (res.data.success && Array.isArray(res.data.data)) setOwners(res.data.data);
//       else setError("Failed to fetch auto shop owners");
//     } catch (err: any) { setError(err?.response?.data?.message || "Something went wrong"); }
//     finally { setLoading(false); }
//   };

//   const changeAutoShopOwnerStatus = async (ownerId: string, action: "enable" | "disable") => {
//     setActionLoadingMap((prev) => ({ ...prev, [ownerId]: true }));
//     try {
//       const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/autoshopowners/toggle-status`, { userId: ownerId, disable: action === "disable" });
//       if (res.data.success) await fetchOwners();
//       else alert("Failed to update status");
//     } catch (err: any) { alert(err?.response?.data?.message || `Failed to ${action} shop owner.`); }
//     finally { setActionLoadingMap((prev) => ({ ...prev, [ownerId]: false })); }
//   };

//   const handleExportClick = () => {
//     if (!selectedOwnerIds.length) { alert("Please select at least one row to export."); return; }
//     setExportModalOpen(true);
//   };

//   // Selection helpers
//   const isAllPageSelected = (paginated: AutoShopOwnerType[]) => paginated.length > 0 && paginated.every((o) => selectedOwnerIds.includes(o._id));
//   const handleCheckAll = (paginated: AutoShopOwnerType[], checked: boolean) => {
//     setSelectedOwnerIds((prev) => {
//       const ids = paginated.map((o) => o._id);
//       if (checked) return Array.from(new Set([...prev, ...ids]));
//       return prev.filter((id) => !ids.includes(id));
//     });
//   };
//   const handleCheckRow = (ownerId: string, checked: boolean) => {
//     setSelectedOwnerIds((prev) => checked ? [...prev, ownerId] : prev.filter((id) => id !== ownerId));
//   };

//   useEffect(() => { fetchOwners(); }, []);

//   // Filtering + pagination
//   const filtered = owners.filter((o) => {
//     const q = search.toLowerCase();
//     return (o.name || "").toLowerCase().includes(q) || (o.email || "").toLowerCase().includes(q) || (o.phone || "").toLowerCase().includes(q) || (o.businessProfile?.businessName || "").toLowerCase().includes(q) || (o.businessProfile?.businessAddress || "").toLowerCase().includes(q);
//   });
//   const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
//   const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

//   // ─── BUSINESS PROFILE MODAL ────────────────────────────────────────────────
//   const renderBusinessProfileModal = () => {
//     if (!modalOwner || !modalOwner.businessProfile) return null;
//     const bp = modalOwner.businessProfile;

//     const renderNestedServices = () => {
//       if (!Array.isArray(bp.myServices) || bp.myServices.length === 0) return <div style={{ color: "#aaa", fontSize: 13 }}>No services listed</div>;
//       const serviceMap: { [id: string]: { service: Service; subServiceIds: string[] } } = {};
//       bp.myServices.forEach((ms: MyService) => {
//         if (!ms.service || !ms.service._id) return;
//         if (!serviceMap[ms.service._id]) serviceMap[ms.service._id] = { service: ms.service, subServiceIds: [] };
//         if (Array.isArray(ms.subServices)) serviceMap[ms.service._id].subServiceIds.push(...ms.subServices.map((ss) => ss.subService));
//       });
//       return (
//         <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
//           {Object.values(serviceMap).map(({ service, subServiceIds }) => (
//             <li key={service._id} style={{ marginBottom: 12 }}>
//               <div style={{ fontWeight: 600, fontSize: 13, color: "#333", marginBottom: 4 }}>{service.name || "-"}</div>
//               <div style={{ paddingLeft: 14 }}>
//                 {service.services && service.services.length > 0 ? (
//                   <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12 }}>
//                     {service.services.filter((ss) => subServiceIds.length === 0 || subServiceIds.includes(ss._id)).map((ss) => (
//                       <li key={ss._id}>{ss.name}{ss.desc && <span style={{ color: "#888", marginLeft: 6 }}>{ss.desc}</span>}</li>
//                     ))}
//                   </ul>
//                 ) : <span style={{ color: "#aaa", fontSize: 12 }}>-</span>}
//               </div>
//             </li>
//           ))}
//         </ul>
//       );
//     };

//     return (
//       <Modal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} title={`Business Profile — ${bp.businessName || "-"}`} wide>
//         <ShopOverviewCard shopData={bp} />
//         <div style={{ marginTop: 20 }}>
//           <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom: "2px solid #3c8dbc", paddingBottom: 6, color: "#3c8dbc" }}>Team Members</div>
//           {Array.isArray(bp.teamMembers) && bp.teamMembers.length > 0 ? (
//             <div style={{ overflowX: "auto", marginBottom: 20 }}>
//               <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
//                 <thead>
//                   <tr>{["Photo","Name","Email","Phone","Designation"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
//                 </thead>
//                 <tbody>
//                   {bp.teamMembers.map((tm: TeamMemberType) => (
//                     <tr key={tm._id}>
//                       <td style={tdStyle}>{tm.photo ? <img src={tm.photo.startsWith("http") ? tm.photo : `${import.meta.env.VITE_IMAGE_URL ?? ""}/${tm.photo}`} alt="Team" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} /> : <span style={{ display: "block", width: 36, height: 36, borderRadius: "50%", background: "#ddd" }} />}</td>
//                       <td style={tdStyle}>{tm.name}</td>
//                       <td style={tdStyle}>{tm.email || "-"}</td>
//                       <td style={tdStyle}>{tm.phone || "-"}</td>
//                       <td style={tdStyle}>{tm.designation || "-"}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           ) : <div style={{ color: "#aaa", fontSize: 13, marginBottom: 20 }}>No team members</div>}

//           <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom: "2px solid #3c8dbc", paddingBottom: 6, color: "#3c8dbc" }}>Services</div>
//           <div style={{ marginBottom: 20 }}>{renderNestedServices()}</div>

//           <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom: "2px solid #3c8dbc", paddingBottom: 6, color: "#3c8dbc" }}>My Deals</div>
//           {Array.isArray(bp.myDeals) && bp.myDeals.length > 0 ? (
//             <div style={{ overflowX: "auto" }}>
//               <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
//                 <thead>
//                   <tr>{["Name","Description","Discount %","Coupon","Enabled","Valid From","Ends"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
//                 </thead>
//                 <tbody>
//                   {bp.myDeals.map((deal: any) => {
//                     if (typeof deal === "string") return <tr key={deal}><td style={tdStyle} colSpan={7}>{deal}</td></tr>;
//                     return (
//                       <tr key={deal._id ?? deal.name}>
//                         <td style={tdStyle}>{deal.name || "-"}</td>
//                         <td style={{ ...tdStyle, maxWidth: 200 }}>{deal.description || "-"}</td>
//                         <td style={tdStyle}>{deal.percentageDiscount ?? 0}%</td>
//                         <td style={tdStyle}>{deal.couponCode || "-"}</td>
//                         <td style={tdStyle}><span style={{ fontWeight: 600, color: deal.dealEnabled ? "#27ae60" : "#e74c3c" }}>{deal.dealEnabled ? "Yes" : "No"}</span></td>
//                         <td style={tdStyle}>{deal.startDate ? new Date(deal.startDate).toLocaleDateString() : "-"}</td>
//                         <td style={tdStyle}>{deal.endDate ? new Date(deal.endDate).toLocaleDateString() : "-"}</td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           ) : <div style={{ color: "#aaa", fontSize: 13 }}>No shop deals linked</div>}
//         </div>
//       </Modal>
//     );
//   };

//   const renderCustomersModal = () => {
//     if (!modalOwner) return null;
//     return (
//       <Modal isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} title={`Customers — ${modalOwner.name}`}>
//         {modalOwner.myCustomers && modalOwner.myCustomers.length > 0 ? (
//           <div style={{ overflowX: "auto" }}>
//             <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
//               <thead><tr>{["Name","Email","Phone"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
//               <tbody>
//                 {modalOwner.myCustomers.map((cust) => (
//                   <tr key={cust._id}>
//                     <td style={tdStyle}>{cust.name || "-"}</td>
//                     <td style={tdStyle}>{cust.email || "-"}</td>
//                     <td style={tdStyle}>{cust.phone || "-"}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ) : <div style={{ textAlign: "center", color: "#aaa", padding: "30px 0" }}>No customers found.</div>}
//       </Modal>
//     );
//   };

//   const renderDealsModal = () => {
//     if (!modalOwner) return null;
//     return (
//       <Modal isOpen={dealsModalOpen} onClose={() => setDealsModalOpen(false)} title={`Deals — ${modalOwner.name}`} wide>
//         {modalOwner.deals && modalOwner.deals.length > 0 ? (
//           <div style={{ overflowX: "auto" }}>
//             <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
//               <thead><tr>{["Name","Description","Discount %","Coupon","Enabled","Valid From","Ends","Details"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
//               <tbody>
//                 {modalOwner.deals.map((deal) => (
//                   <tr key={deal._id}>
//                     <td style={tdStyle}>{deal.name}</td>
//                     <td style={{ ...tdStyle, maxWidth: 180 }}>{deal.description || "-"}</td>
//                     <td style={tdStyle}>{deal.percentageDiscount ?? 0}%</td>
//                     <td style={tdStyle}>{deal.couponCode || "-"}</td>
//                     <td style={tdStyle}><span style={{ fontWeight: 600, color: deal.dealEnabled ? "#27ae60" : "#e74c3c" }}>{deal.dealEnabled ? "Yes" : "No"}</span></td>
//                     <td style={tdStyle}>{deal.startDate ? new Date(deal.startDate).toLocaleDateString() : "-"}</td>
//                     <td style={tdStyle}>{deal.endDate ? new Date(deal.endDate).toLocaleDateString() : "-"}</td>
//                     <td style={{ ...tdStyle, maxWidth: 160 }}>{deal.additionalDetails || "-"}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ) : <div style={{ textAlign: "center", color: "#aaa", padding: "30px 0" }}>No deals found.</div>}
//       </Modal>
//     );
//   };

//   const renderJobCardsModal = () => {
//     if (!modalOwner) return null;
//     return (
//       <Modal isOpen={jobCardsModalOpen} onClose={() => setJobCardsModalOpen(false)} title={`Job Cards — ${modalOwner.name}`} wide>
//         {modalOwner.jobCards && modalOwner.jobCards.length > 0 ? (
//           <div style={{ overflowX: "auto" }}>
//             <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
//               <thead>
//                 <tr>{["Job Card No.","Date","Phone Number","Name"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
//               </thead>
//               <tbody>
//                 {modalOwner.jobCards.map((card: JobCardType) => (
//                   <tr key={card._id} style={{ cursor: "pointer" }}
//                     onClick={() => { setSelectedJobCard(card); setJobCardDetailModalOpen(true); }}
//                     onMouseEnter={e => (e.currentTarget.style.background = "#f0f7ff")}
//                     onMouseLeave={e => (e.currentTarget.style.background = "")}
//                   >
//                     <td style={{ ...tdStyle, color: "#0073b7", fontWeight: 600 }}>{card.jobNo}</td>
//                     <td style={tdStyle}>{card.createdAt ? new Date(card.createdAt).toLocaleString() : "-"}</td>
//                     <td style={tdStyle}>{modalOwner.countryCode ? `${modalOwner.countryCode} ` : ""}{modalOwner.phone || "-"}</td>
//                     <td style={tdStyle}>{modalOwner.name}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             <JobCardDetailModal isOpen={jobCardDetailModalOpen} onClose={() => { setJobCardDetailModalOpen(false); setSelectedJobCard(null); }} card={selectedJobCard} owner={modalOwner} UPLOADS_URL={UPLOADS_URL} />
//           </div>
//         ) : <div style={{ textAlign: "center", color: "#aaa", padding: "30px 0" }}>No job cards found.</div>}
//       </Modal>
//     );
//   };

//   // ─── RENDER ───────────────────────────────────────────────────────────────
//   return (
//     <>
//       {renderBusinessProfileModal()}
//       {renderCustomersModal()}
//       {renderDealsModal()}
//       {renderJobCardsModal()}
//       <SendNotificationModal isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} selectedOwnerIds={selectedOwnerIds} onSuccess={() => {}} />
//       <ExportColumnsModal
//         isOpen={exportModalOpen}
//         onClose={() => setExportModalOpen(false)}
//         selectedOwnerIds={selectedOwnerIds}
//         owners={owners}
//       />

//       <div className="h-[92vh] overflow-y-auto bg-[#f0f0f0] px-6 py-5 font-sans">
//         <h1 style={{ fontSize: 34, fontWeight: 300, color: "#333", marginBottom: 20, marginTop: 0 }}>
//           Auto Shop Owners
//         </h1>

//         <div className="mb-10" style={{ background: "#fff", border: "1px solid #d2d6de", borderRadius: 3, boxShadow: "0 1px 1px rgba(0,0,0,.1)" }}>
//           {/* Card Header */}
//           <div style={{ padding: "10px 16px", borderBottom: "1px solid #f4f4f4", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
//             <h3 style={{ margin: 0, fontSize: 17, fontWeight: 400, color: "#444" }}>Shop Owner List</h3>
//             <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
//               {selectedOwnerIds.length > 0 && (
//                 <span style={{ fontSize: 12, color: "#777" }}>{selectedOwnerIds.length} selected</span>
//               )}
//               <button
//                 type="button"
//                 onClick={() => { if (!selectedOwnerIds.length) { alert("Select at least one shop owner to send notification."); return; } setNotificationOpen(true); }}
//                 style={{ padding: "6px 14px", borderRadius: 3, border: "none", fontSize: 13, background: "#0073b7", color: "#fff", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
//               >
//                 ✉ Send Notification
//               </button>
//               <button
//                 type="button"
//                 onClick={handleExportClick}
//                 style={{ padding: "6px 14px", borderRadius: 3, border: "none", fontSize: 13, background: "#00a65a", color: "#fff", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
//               >
//                 ↓ Export (.csv)
//               </button>
//             </div>
//           </div>

//           {/* Card Body */}
//           <div style={{ padding: 20 }}>
//             <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
//               <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#333" }}>
//                 <span>Show</span>
//                 <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
//                   style={{ height: 34, border: "1px solid #d2d6de", borderRadius: 3, padding: "0 10px", fontSize: 14, outline: "none" }}>
//                   {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
//                 </select>
//                 <span>entries</span>
//               </div>
//               <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#333" }}>
//                 <span>Search:</span>
//                 <input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
//                   style={{ height: 34, width: 190, border: "1px solid #d2d6de", borderRadius: 3, padding: "0 10px", fontSize: 14, outline: "none" }} />
//               </div>
//             </div>

//             {loading && <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontSize: 14 }}>Loading shop owners…</div>}
//             {error && <div style={{ textAlign: "center", padding: "30px 0", color: "#c0392b", fontSize: 14 }}>Error: {error}</div>}

//             {!loading && !error && (
//               <div style={{ overflowX: "auto" }}>
//                 <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
//                   <thead>
//                     <tr>
//                       <th style={thStyle}>
//                         <input type="checkbox" checked={isAllPageSelected(paginated)} onChange={(e) => handleCheckAll(paginated, e.target.checked)} aria-label="Select all" />
//                       </th>
//                       {["Name","Email","Phone","Shop Name","Shop Address","Status","Customers","Deals","Job Cards","Created At","Profile","Action"].map((h) => (
//                         <th key={h} style={thStyle}>{h}</th>
//                       ))}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {paginated.length === 0 && (
//                       <tr><td colSpan={13} style={{ ...tdStyle, textAlign: "center", color: "#aaa", padding: "36px 0" }}>No auto shop owners found.</td></tr>
//                     )}
//                     {paginated.map((owner) => {
//                       const isSuspended = !!owner.isDisabled;
//                       const isLoading = !!actionLoadingMap[owner._id];
//                       const isChecked = selectedOwnerIds.includes(owner._id);
//                       return (
//                         <tr key={owner._id} style={{ background: isChecked ? "#f0f7ff" : undefined }}>
//                           <td style={tdStyle}>
//                             <input type="checkbox" checked={isChecked} onChange={(e) => handleCheckRow(owner._id, e.target.checked)} aria-label={`Select ${owner.name}`} />
//                           </td>
//                           <td style={{ ...tdStyle, fontWeight: 500 }}>{owner.name}</td>
//                           <td style={tdStyle}>{owner.email || "-"}</td>
//                           <td style={tdStyle}>{owner.countryCode ? `${owner.countryCode} ` : ""}{owner.phone || "-"}</td>
//                           <td style={tdStyle}>{owner.businessProfile?.businessName || "-"}</td>
//                           <td style={tdStyle}>{owner.businessProfile?.businessAddress || "-"}</td>
//                           <td style={tdStyle}>
//                             <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 3, fontSize: 12, fontWeight: 600, ...getStatusStyle(owner) }}>
//                               {getStatus(owner)}
//                             </span>
//                           </td>
//                           <td style={tdStyle}>
//                             <button type="button" onClick={() => { setModalOwner(owner); setCustomerModalOpen(true); }} style={linkBtnStyle}>
//                               {owner.myCustomers?.length ?? 0}
//                             </button>
//                           </td>
//                           <td style={tdStyle}>
//                             <button type="button" onClick={() => { setModalOwner(owner); setDealsModalOpen(true); }} style={linkBtnStyle}>
//                               {owner.deals?.length ?? 0}
//                             </button>
//                           </td>
//                           <td style={tdStyle}>
//                             <button type="button" onClick={() => { setModalOwner(owner); setJobCardsModalOpen(true); }} style={linkBtnStyle}>
//                               {owner.jobCards?.length ?? 0}
//                             </button>
//                           </td>
//                           <td style={tdStyle}>{owner.createdAt ? new Date(owner.createdAt).toLocaleString() : "-"}</td>
//                           <td style={tdStyle}>
//                             <button type="button" onClick={() => { setModalOwner(owner); setProfileModalOpen(true); }} style={linkBtnStyle}>View</button>
//                           </td>
//                           <td style={tdStyle}>
//                             <button
//                               type="button"
//                               disabled={isLoading}
//                               onClick={() => changeAutoShopOwnerStatus(owner._id, isSuspended ? "enable" : "disable")}
//                               style={{
//                                 padding: "4px 12px", borderRadius: 3, border: "none", fontSize: 12, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer",
//                                 background: isSuspended ? "#dff0d8" : "#f2dede",
//                                 color: isSuspended ? "#3c763d" : "#a94442",
//                                 opacity: isLoading ? 0.6 : 1,
//                               }}
//                               aria-label={isSuspended ? `Enable ${owner.name}` : `Suspend ${owner.name}`}
//                             >
//                               {isLoading ? "…" : isSuspended ? "Enable" : "Suspend"}
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             )}

//             {!loading && !error && (
//               <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
//                 <p style={{ margin: 0, fontSize: 14, color: "#333" }}>
//                   {filtered.length === 0 ? "No entries" : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} entries${search ? ` (filtered from ${owners.length} total)` : ""}`}
//                 </p>
//                 <div style={{ display: "flex" }}>
//                   <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={pageBtn(false, currentPage === 1)}>Previous</button>
//                   {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
//                     <button key={pg} onClick={() => setCurrentPage(pg)} style={pageBtn(pg === currentPage, false)}>{pg}</button>
//                   ))}
//                   <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={pageBtn(false, currentPage === totalPages)}>Next</button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default AutoShopOwners;

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────
type TeamMemberType = { _id: string; name: string; email?: string; phone?: string; designation?: string; photo?: string };
type IndividualService = { name: string; desc?: string; price?: number; _id: string };
type Service = { _id: string; name?: string; desc?: string; services?: IndividualService[]; [k: string]: any };
type MyService = { service: Service; subServices?: { subService: string }[]; serviceName?: string; serviceId?: string; [k: string]: any };
type BusinessProfileType = {
  _id: string; businessName?: string; businessAddress?: string; pincode?: string; city?: string;
  businessPhone?: string; businessEmail?: string; businessHSTNumber?: string; openHours?: string;
  openDays?: string[]; perDayOpenHours?: any[]; businessLogo?: string; myServices?: MyService[];
  myDeals?: any[]; teamMembers?: TeamMemberType[]; businessMapLocation?: any; isOpen?: boolean;
  rating?: number; reviewCount?: number; reviewDate?: string; websiteUrl?: string;
  createdAt?: string; updatedAt?: string; ads?: any[]; [k: string]: any;
};
type CustomerType = { _id: string; name?: string; email?: string; phone?: string };
type DealType = {
  _id: string; name?: string; description?: string; discountedPrice?: number;
  percentageDiscount?: number; dealEnabled?: boolean; dealType?: string; offerEndsOnDate?: string;
  couponCode?: string; startDate?: string; endDate?: string; additionalDetails?: string; dealImage?: string;
};
type JobCardType = {
  _id: string; jobNo?: string; business?: string; customerId?: string; vehicleId?: string;
  odometerReading?: number; issueDescription?: string; serviceType?: string; priorityLevel?: string;
  services?: any[]; additionalNotes?: string; vehiclePhotos?: string[];
  dealApplied?: { name?: string; percentageDiscount?: number; dealCode?: string };
  totalPayableAmount?: number; paymentStatus?: string; technicalRemarks?: string;
  createdAt?: string; updatedAt?: string; status?: string; [k: string]: any;
};
type ShopType = "autoShop" | "tyreShop" | "carWash" | "towTruck";
type AutoShopOwnerType = {
  _id: string;
  name: string;
  email?: string;
  countryCode?: string;
  phone?: string;
  pincode?: string;
  address?: string;
  isDisabled?: boolean;
  isProfileComplete?: boolean;
  isBusinessProfileCompleted?: boolean;
  businessProfile?: BusinessProfileType | null;
  myCustomers?: CustomerType[];
  createdAt?: string;
  deals?: DealType[];
  jobCards?: JobCardType[];
  status?: string;
  shopType?: ShopType; // ADDED shopType
};

// ─── Column Config ────────────────────────────────────────────────────────────
const ALL_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "shopName", label: "Shop Name" },
  { key: "shopType", label: "Shop Type" }, // ADDED Shop Type Column
  { key: "city", label: "City" },
  { key: "date", label: "Date" },
  { key: "customers", label: "Customers" },
  { key: "deals", label: "Deals" },
  { key: "jobCards", label: "Job Cards" },
  { key: "status", label: "Status" },
];
const DEFAULT_VISIBLE = ["name", "phone", "shopName", "shopType", "city", "date", "customers", "deals", "jobCards", "status"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const API = () => (import.meta.env.VITE_API_URL as string) || "";
const UPLOADS = () => (import.meta.env.VITE_UPLOADS_URL as string) || "";
const IMAGE_URL = () => (import.meta.env.VITE_IMAGE_URL as string) || "";
function mediaUrl(path?: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${UPLOADS()}/${path.replace(/^\/+/, "")}`;
}
function imgUrl(path?: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${IMAGE_URL()}/${path.replace(/^\/+/, "")}`;
}
function fmtDate(d?: string): string {
  if (!d) return "-";
  return new Date(d).toISOString().slice(0, 10);
}
function getToken(): Record<string, string> {
  const t = localStorage.getItem("admin-token");
  return t ? { Authorization: t } : {};
}
function getStatus(owner: AutoShopOwnerType): string {
  if (owner.status === "deleted") return "Deleted";
  if (owner.isDisabled) return "Suspended";
  if (owner.isProfileComplete && (owner.isBusinessProfileCompleted ?? owner.businessProfile)) return "Active";
  if (!owner.isProfileComplete) return "Incomplete";
  return "Unknown";
}
function getStatusColors(s: string): React.CSSProperties {
  if (s === "Active") return { background: "#dff0d8", color: "#3c763d", border: "1px solid #d6e9c6" };
  if (s === "Suspended") return { background: "#fcf8e3", color: "#8a6d3b", border: "1px solid #faebcc" };
  if (s === "Deleted") return { background: "#f2dede", color: "#a94442", border: "1px solid #ebccd1" };
  return { background: "#f2dede", color: "#a94442", border: "1px solid #ebccd1" };
}

// ─── Green Card Styles ────────────────────────────────────────────────────────
const GREEN_CARD: React.CSSProperties = {
  background: "#d4f5c4", border: "1px solid #b2e0a0", borderRadius: 14,
  padding: "18px 22px", marginBottom: 18, boxShadow: "3px 4px 0 #c0d8b0", position: "relative",
};
const GC_LABEL: React.CSSProperties = { color: "#555", fontWeight: 600, fontSize: 13, minWidth: 120 };
const GC_VAL: React.CSSProperties = { color: "#222", fontSize: 13 };
function GCRow({ label, value }: { label: string; value?: any }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 5 }}>
      <span style={GC_LABEL}>{label}</span>
      <span style={{ color: "#888", marginRight: 4 }}>:</span>
      <span style={GC_VAL}>{value ?? "-"}</span>
    </div>
  );
}

// ─── Shared input styles ──────────────────────────────────────────────────────
const iStyle: React.CSSProperties = {
  width: "100%", border: "1px solid #d2d6de", borderRadius: 3,
  padding: "7px 10px", fontSize: 13, outline: "none", boxSizing: "border-box", color: "#333", background: "#fff",
};
const lStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4,
  color: "#555", textTransform: "uppercase", letterSpacing: "0.04em",
};

// Shop Type Options
const SHOP_TYPE_OPTIONS: { value: ShopType; label: string }[] = [
  { value: "autoShop", label: "Auto Shop" },
  { value: "tyreShop", label: "Tyre Shop" },
  { value: "carWash", label: "Car Wash" },
  { value: "towTruck", label: "Tow Truck" },
];

// ─── BASE MODAL ───────────────────────────────────────────────────────────────
const BaseModal: React.FC<{
  isOpen: boolean; onClose: () => void; title: string;
  children: React.ReactNode; wide?: boolean; maxW?: string;
}> = ({ isOpen, onClose, title, children, wide, maxW }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "30px 10px" }}>
      <div style={{ background: "#fff", borderRadius: 4, width: maxW ?? (wide ? "min(980px,96vw)" : "min(720px,95vw)"), boxShadow: "0 5px 24px rgba(0,0,0,.35)", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#3c8dbc", color: "#fff", padding: "11px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "4px 4px 0 0", flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
          <button onClick={onClose} type="button" style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
};

// ─── Open Days helper ─────────────────────────────────────────────────────────
function parseOpenDays(openDays?: string[]): string {
  if (!openDays || !openDays.length) return "-";
  if (openDays.length === 1 && typeof openDays[0] === "string" && openDays[0].trim().startsWith("[")) {
    try { return JSON.parse(openDays[0]).join(", "); } catch { return openDays.join(", "); }
  }
  return openDays.join(", ");
}

// ─── ADD / EDIT MODAL ────────────────────────────────────────────────────────
const CALLING_CODES = [
  { id: "CA", flag: "🇨🇦", code: "+1" }, { id: "US", flag: "🇺🇸", code: "+1" },
  { id: "GB", flag: "🇬🇧", code: "+44" }, { id: "IN", flag: "🇮🇳", code: "+91" },
  { id: "AU", flag: "🇦🇺", code: "+61" },
];
function isEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }

const AddEditModal: React.FC<{
  isOpen: boolean; onClose: () => void; onSaved: () => void;
  owner?: AutoShopOwnerType | null; mode: "add" | "edit";
}> = ({ isOpen, onClose, onSaved, owner, mode }) => {
  const isEdit = mode === "edit";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dialCode, setDialCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  // SHOP TYPE handling
  const [shopType, setShopType] = useState<ShopType>("autoShop");
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setAttempted(false); setApiError(null);
    if (isEdit && owner) {
      setName(owner.name || ""); setEmail(owner.email || "");
      setDialCode(owner.countryCode || "+1"); setPhone(owner.phone || "");
      setPincode(owner.pincode || ""); setAddress(owner.address || "");
      setShopType((owner.shopType as ShopType) || "autoShop");
    } else {
      setName(""); setEmail(""); setDialCode("+1"); setPhone(""); setPincode(""); setAddress("");
      setShopType("autoShop");
    }
  }, [isOpen, isEdit, owner]);

  function validate(): string | null {
    if (!name.trim()) return "Name is required.";
    if (!email.trim() || !isEmail(email)) return "Valid email required.";
    if (phone.replace(/\D/g, "").length !== 10) return "Phone must be 10 digits.";
    if (!pincode.trim()) return "Zip / Postal code is required.";
    if (!shopType) return "Shop type required.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setAttempted(true);
    const err = validate(); if (err) { setApiError(err); return; }
    setApiError(null);
    const payload = {
      name: name.trim(), email: email.trim(), countryCode: dialCode,
      phone: phone.replace(/\D/g, ""), pincode: pincode.trim(),
      address: address.trim(), role: "autoshopowner",
      shopType,
    };
    setSubmitting(true);
    try {
      if (isEdit && owner) {
        await axios.put(`${API()}/api/admin/autoshopowners/${owner._id}`, payload, { headers: getToken() });
      } else {
        await axios.post(`${API()}/api/admin/autoshopowners`, payload, { headers: getToken() });
      }
      onSaved(); onClose();
    } catch (err: any) {
      setApiError(err?.response?.data?.message || (isEdit ? "Could not update." : "Could not add."));
    } finally { setSubmitting(false); }
  }

  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", background: "rgba(0,0,0,0.48)", overflowY: "auto", padding: "30px 12px" }}>
      <div style={{ background: "#fff", borderRadius: 4, width: "min(680px,96vw)", boxShadow: "0 8px 32px rgba(0,0,0,0.22)" }}>
        <div style={{ background: "#3c8dbc", color: "#fff", padding: "13px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "4px 4px 0 0" }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{isEdit ? "✏️ Edit Auto Shop Owner" : "➕ Add Auto Shop Owner"}</span>
          <button onClick={onClose} disabled={submitting} type="button" style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "22px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#3c8dbc", borderBottom: "2px solid #3c8dbc", paddingBottom: 6, marginBottom: 18, textTransform: "uppercase" }}>Owner Information</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
            <div>
              <label style={lStyle}>Full Name <span style={{ color: "#e73d3d" }}>*</span></label>
              <input style={iStyle} value={name} onChange={e => setName(e.target.value.slice(0, 40))} placeholder="Enter full name" maxLength={40} />
              {attempted && !name.trim() && <p style={{ color: "#c0392b", fontSize: 11, margin: "3px 0 0", fontWeight: 600 }}>Required</p>}
            </div>
            <div>
              <label style={lStyle}>Email Address <span style={{ color: "#e73d3d" }}>*</span></label>
              <input style={iStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email" />
              {attempted && !isEmail(email) && <p style={{ color: "#c0392b", fontSize: 11, margin: "3px 0 0", fontWeight: 600 }}>Valid email required</p>}
            </div>
            <div>
              <label style={lStyle}>Phone Number <span style={{ color: "#e73d3d" }}>*</span></label>
              <div style={{ display: "flex", gap: 6 }}>
                <select value={dialCode} onChange={e => setDialCode(e.target.value)} style={{ ...iStyle, width: 100, flexShrink: 0 }}>
                  {CALLING_CODES.map(c => <option key={c.id + c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <input style={{ ...iStyle, flex: 1 }} type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" />
              </div>
              {attempted && phone.replace(/\D/g, "").length !== 10 && <p style={{ color: "#c0392b", fontSize: 11, margin: "3px 0 0", fontWeight: 600 }}>Must be 10 digits</p>}
            </div>
            <div>
              <label style={lStyle}>Zip / Postal Code <span style={{ color: "#e73d3d" }}>*</span></label>
              <input style={iStyle} value={pincode} onChange={e => setPincode(e.target.value.slice(0, 10))} placeholder="e.g. A1A 1A1" />
              {attempted && !pincode.trim() && <p style={{ color: "#c0392b", fontSize: 11, margin: "3px 0 0", fontWeight: 600 }}>Required</p>}
            </div>
            <div>
              <label style={lStyle}>Role</label>
              <div style={{ ...iStyle, background: "#f5f6f8", color: "#888", fontWeight: 600, cursor: "default" }}>autoshopowner</div>
            </div>
            {/* ADD SHOP TYPE */}
            <div>
              <label style={lStyle}>Shop Type <span style={{ color: "#e73d3d" }}>*</span></label>
              <select
                style={iStyle}
                value={shopType}
                onChange={e => setShopType(e.target.value as ShopType)}
              >
                {SHOP_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {attempted && !shopType && (
                <p style={{ color: "#c0392b", fontSize: 11, margin: "3px 0 0", fontWeight: 600 }}>Required</p>
              )}
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lStyle}>Address</label>
              <textarea style={{ ...iStyle, minHeight: 60, resize: "vertical", fontFamily: "inherit" }} value={address} onChange={e => setAddress(e.target.value.slice(0, 100))} placeholder="Enter address (max 100 chars)" rows={2} maxLength={100} />
            </div>
          </div>
          {apiError && (
            <div style={{ marginTop: 12, padding: "9px 14px", background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, color: "#c0392b", fontSize: 13 }}>{apiError}</div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid #f4f4f4" }}>
            <button type="button" onClick={onClose} disabled={submitting} style={{ padding: "8px 22px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#555", fontSize: 14, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ padding: "8px 26px", borderRadius: 3, border: "none", background: submitting ? "#aaa" : "#00a65a", color: "#fff", fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer" }}>
              {submitting ? "Saving…" : isEdit ? "Save Changes" : "Add Owner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── SHOP OVERVIEW CARD ───────────────────────────────────────────────────────
const ShopOverviewCard: React.FC<{ bp: BusinessProfileType }> = ({ bp }) => {
  const services: string[] = [];
  if (Array.isArray(bp.myServices)) {
    for (const ms of bp.myServices) {
      const n = ms.serviceName || ms.service?.name;
      if (n) services.push(n);
    }
  }
  if (!services.length) services.push(...["General Repair", "Oil Change", "Brake Service"]);
  const logoUrl = bp.businessLogo ? imgUrl(bp.businessLogo) : "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?q=80&w=400&auto=format&fit=crop";
  const openDays = parseOpenDays(bp.openDays);
  const directionsUrl = bp.businessMapLocation?.lat ? `https://www.google.com/maps/search/?api=1&query=${bp.businessMapLocation.lat},${bp.businessMapLocation.lng}` : "#";
  const webUrl = (bp.websiteUrl && bp.websiteUrl !== "#") ? bp.websiteUrl : bp.businessEmail ? `mailto:${bp.businessEmail}` : "#";
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] mb-7">
      <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: "minmax(0,1.15fr) minmax(0,0.72fr) minmax(0,0.72fr) minmax(0,1.65fr) minmax(52px,0.55fr)", minHeight: 48 }}>
        <div className="flex items-center justify-center border-r border-slate-200 bg-emerald-50 px-2 py-2 text-center text-[13px] font-bold text-emerald-800"><span className="truncate">📞 {bp.businessPhone || "-"}</span></div>
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center border-r border-slate-200 bg-sky-50 text-[13px] font-semibold text-blue-600 no-underline hover:bg-sky-100">Directions</a>
        <a href={webUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center border-r border-slate-200 bg-slate-50 text-[13px] font-semibold text-slate-700 no-underline hover:bg-slate-100">Website</a>
        <div className="flex min-w-0 items-center justify-between gap-2 border-r border-slate-200 bg-white px-3 py-2">
          <div className="flex shrink-0 items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${bp.isOpen ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className={`whitespace-nowrap text-[12px] font-semibold ${bp.isOpen ? "text-emerald-700" : "text-red-600"}`}>{bp.isOpen ? "OPEN NOW" : "CLOSED"}</span>
          </div>
          <div className="text-right text-[11px] leading-snug text-slate-500"><div>{openDays}</div><div className="whitespace-nowrap">{bp.openHours || "-"}</div></div>
        </div>
        <div className="flex items-center justify-center gap-1 bg-amber-50 text-[15px] font-bold text-slate-900"><span className="text-amber-500">★</span>{bp.rating ?? 4.8}</div>
      </div>
      <div className="grid items-start gap-5 p-5" style={{ gridTemplateColumns: "minmax(120px,150px) minmax(0,1.25fr) minmax(0,1.1fr) minmax(100px,118px)" }}>
        <img src={logoUrl} alt={bp.businessName} className="h-[108px] w-full rounded-lg object-cover" />
        <div className="min-w-0">
          <h2 className="mb-1.5 text-xl font-bold leading-tight text-slate-900">{bp.businessName || "-"}</h2>
          <p className="mb-3 text-[13px] leading-relaxed text-slate-600">{bp.businessAddress}<br />{bp.city}{bp.pincode && <>, {bp.pincode}</>}</p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">{bp.isOpen ? "Open" : "Closed"}</span>
            <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] text-blue-700">{openDays}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600">{bp.openHours || "-"}</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="mb-2.5 text-[13px] font-bold text-slate-900">Services</p>
          <ul className="grid list-none gap-x-4 gap-y-1.5 p-0" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
            {services.slice(0, 6).map((s, i) => (
              <li key={i} className="flex min-w-0 items-start gap-1.5 text-[12px] leading-snug text-slate-600">
                <span className="mt-px shrink-0 font-bold text-emerald-500">✓</span>
                <span className="min-w-0">{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-3 text-center">
          <span className="text-[26px] font-bold leading-none text-slate-900">{bp.rating ?? 4.8}</span>
          <span className="mt-1 text-[13px] tracking-wide text-amber-500">★★★★★</span>
          <span className="mt-1.5 text-[11px] text-slate-500">{bp.reviewCount ?? 0} Reviews</span>
        </div>
      </div>
      <div className="grid items-center gap-2 bg-slate-900 px-4 py-2.5 text-[12px] text-white" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1.6fr) minmax(0,1fr)" }}>
        <span className="truncate font-medium">{bp.businessName}</span>
        <span className="truncate text-center text-slate-200">{bp.businessAddress} • {bp.city}</span>
        <span className="truncate text-right text-slate-200">{openDays} | {bp.openHours || "-"}</span>
      </div>
    </div>
  );
};

// ─── PROFILE MODAL ────────────────────────────────────────────────────────────
const ProfileModal: React.FC<{ owner: AutoShopOwnerType; onClose: () => void; onEdit: () => void }> = ({ owner, onClose, onEdit }) => {
  const bp = owner.businessProfile;
  const customers = owner.myCustomers ?? [];
  const deals = owner.deals ?? [];
  const cards = owner.jobCards ?? [];
  const logoSrc = bp?.businessLogo ? imgUrl(bp.businessLogo) : "";
  return (
    <BaseModal isOpen wide onClose={onClose} title={`Profile — ${owner.name}`} maxW="min(860px,96vw)">
      {bp && <ShopOverviewCard bp={bp} />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, border: "1px solid #c8e6b0", borderRadius: 14, overflow: "hidden", marginTop: 8 }}>
        <div style={{ background: "#d4f5c4", padding: "22px 26px", borderRight: "1px solid #c8e6b0" }}>
          <GCRow label="Name" value={owner.name} />
          <GCRow label="E-mail" value={<a href={`mailto:${owner.email}`} style={{ color: "#0073b7" }}>{owner.email}</a>} />
          <GCRow label="Phone" value={`${owner.countryCode ?? ""} ${owner.phone ?? ""}`.trim() || undefined} />
          <GCRow label="Shop Name" value={bp?.businessName} />
          <GCRow label="City" value={bp?.city} />
          <GCRow label="Address" value={bp?.businessAddress} />
          <GCRow label="Zip Code" value={bp?.pincode} />
          <div style={{ margin: "10px 0 4px", display: "flex", gap: 8 }}>
            <span style={GC_LABEL}>Customers</span><span style={{ color: "#888", marginRight: 4 }}>:</span>
            <div>{customers.length > 0 ? customers.map(c => <div key={c._id} style={GC_VAL}>{c.name || c.email || "-"}</div>) : <span style={GC_VAL}>—</span>}</div>
          </div>
          <div style={{ margin: "10px 0 4px", display: "flex", gap: 8 }}>
            <span style={GC_LABEL}>Deals</span><span style={{ color: "#888", marginRight: 4 }}>:</span>
            <div>{deals.length > 0 ? deals.map(d => <div key={d._id} style={GC_VAL}>{d.name || d.dealType || "-"}</div>) : <span style={GC_VAL}>—</span>}</div>
          </div>
          <div style={{ margin: "10px 0 4px", display: "flex", gap: 8 }}>
            <span style={GC_LABEL}>Job Cards</span><span style={{ color: "#888", marginRight: 4 }}>:</span>
            <div>{cards.length > 0 ? cards.map(c => <div key={c._id} style={GC_VAL}># {c.jobNo || c._id.slice(-5)}</div>) : <span style={GC_VAL}>—</span>}</div>
          </div>
        </div>
        <div style={{ background: "#d4f5c4", padding: "22px 26px" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Shop Account Info</div>
          <GCRow label="Mobile" value={owner.phone} />
          <GCRow label="Status" value={getStatus(owner)} />
          <GCRow label="Joining Date" value={fmtDate(owner.createdAt)} />
          <GCRow label="HST Number" value={bp?.businessHSTNumber} />
          <GCRow label="Email" value={bp?.businessEmail} />
          <div style={{ marginTop: 14 }}>
            <span style={GC_LABEL}>Shop Logo</span>
            <div style={{ display: "inline-flex", marginLeft: 18, border: "1px solid #bbb", background: "#fff", width: 120, height: 120, borderRadius: 6, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
              {logoSrc ? <img src={logoSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <button type="button" onClick={onEdit} style={{ background: "#1a6e1a", color: "#fff", border: "none", borderRadius: 4, padding: "8px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Update</button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

// ─── CUSTOMERS MODAL ──────────────────────────────────────────────────────────
const CustomersModal: React.FC<{ owner: AutoShopOwnerType; onClose: () => void }> = ({ owner, onClose }) => (
  <BaseModal isOpen onClose={onClose} title={`Customers — ${owner.name}`} wide>
    {!owner.myCustomers?.length
      ? <p style={{ textAlign: "center", color: "#aaa" }}>No customers found.</p>
      : owner.myCustomers.map(c => (
        <div key={c._id} style={GREEN_CARD}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <GCRow label="Name" value={c.name} />
            <GCRow label="Email" value={c.email} />
            <GCRow label="Phone" value={c.phone} />
          </div>
        </div>
      ))}
  </BaseModal>
);

// ─── DEALS MODAL ─────────────────────────────────────────────────────────────
const DealsModal: React.FC<{ owner: AutoShopOwnerType; onClose: () => void }> = ({ owner, onClose }) => (
  <BaseModal isOpen wide onClose={onClose} title={`Deals — ${owner.name}`}>
    {!owner.deals?.length
      ? <p style={{ textAlign: "center", color: "#aaa" }}>No deals found.</p>
      : owner.deals.map(deal => (
        <div key={deal._id} style={GREEN_CARD}>
          <h3 style={{ fontFamily: "serif", fontWeight: 700, fontSize: 16, marginBottom: 10 }}>{deal.name || deal.dealType || "Deal"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <GCRow label="Type" value={deal.dealType} />
            <GCRow label="Description" value={deal.description} />
            <GCRow label="Discount" value={deal.discountedPrice != null ? `$${deal.discountedPrice}` : deal.percentageDiscount != null ? `${deal.percentageDiscount}%` : undefined} />
            <GCRow label="Coupon" value={deal.couponCode} />
            <GCRow label="Ends On" value={deal.offerEndsOnDate ? fmtDate(deal.offerEndsOnDate) : deal.endDate ? fmtDate(deal.endDate) : undefined} />
            <GCRow label="Status" value={deal.dealEnabled ? "Enabled" : "Disabled"} />
          </div>
          {deal.dealImage && <div style={{ marginTop: 10 }}><img src={mediaUrl(deal.dealImage)} alt="deal" style={{ maxWidth: 160, maxHeight: 90, objectFit: "cover", borderRadius: 6, border: "1px solid #b2e0a0" }} /></div>}
        </div>
      ))}
  </BaseModal>
);

// ─── JOB CARDS MODAL ─────────────────────────────────────────────────────────
const JobCardsModal: React.FC<{ owner: AutoShopOwnerType; onClose: () => void }> = ({ owner, onClose }) => {
  const [detailCard, setDetailCard] = useState<JobCardType | null>(null);
  const cards = owner.jobCards ?? [];
  if (detailCard) {
    return (
      <BaseModal isOpen wide onClose={() => setDetailCard(null)} title={`Job Card — ${detailCard.jobNo || detailCard._id}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {([
            ["Job No.", detailCard.jobNo], ["Date", fmtDate(detailCard.createdAt)],
            ["Service Type", detailCard.serviceType], ["Priority", detailCard.priorityLevel],
            ["Payment Status", detailCard.paymentStatus], ["Total", detailCard.totalPayableAmount != null ? `$${detailCard.totalPayableAmount}` : "-"],
            ["Issue", detailCard.issueDescription], ["Notes", detailCard.additionalNotes],
            ["Technical Remarks", detailCard.technicalRemarks],
            ["Deal", detailCard.dealApplied ? `${detailCard.dealApplied.name ?? ""} ${detailCard.dealApplied.dealCode ? `(${detailCard.dealApplied.dealCode})` : ""}` : "-"],
          ] as [string, any][]).map(([l, v]) => (
            <div key={l} style={{ borderBottom: "1px solid #f4f4f4", paddingBottom: 6, fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>{l}:</span> <span style={{ color: "#555" }}>{v || "-"}</span>
            </div>
          ))}
        </div>
        {Array.isArray(detailCard.vehiclePhotos) && detailCard.vehiclePhotos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Vehicle Photos</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {detailCard.vehiclePhotos.map((p, i) => <img key={i} src={mediaUrl(p)} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 3, border: "1px solid #d2d6de" }} />)}
            </div>
          </div>
        )}
        <button type="button" onClick={() => setDetailCard(null)} style={{ padding: "7px 18px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#444", fontSize: 13, cursor: "pointer" }}>← Back</button>
      </BaseModal>
    );
  }
  return (
    <BaseModal isOpen wide onClose={onClose} title={`Job Cards — ${owner.name}`}>
      {!cards.length
        ? <p style={{ textAlign: "center", color: "#aaa" }}>No job cards found.</p>
        : cards.map(card => (
          <div key={card._id} style={GREEN_CARD}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <GCRow label="Job Card No" value={card.jobNo ? `#${card.jobNo}` : undefined} />
              <GCRow label="Service type" value={card.serviceType} />
              <GCRow label="Created on" value={fmtDate(card.createdAt)} />
              <GCRow label="Status" value={card.paymentStatus} />
            </div>
            <button type="button" onClick={() => setDetailCard(card)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", fontSize: 26, color: "#1a8a1a", cursor: "pointer", lineHeight: 1 }}>+</button>
          </div>
        ))}
    </BaseModal>
  );
};

// ─── BUSINESS PROFILE MODAL ───────────────────────────────────────────────────
const BusinessProfileModal: React.FC<{ owner: AutoShopOwnerType; onClose: () => void }> = ({ owner, onClose }) => {
  const bp = owner.businessProfile;
  if (!bp) return (
    <BaseModal isOpen onClose={onClose} title="Business Profile">
      <p style={{ textAlign: "center", color: "#aaa" }}>No business profile found.</p>
    </BaseModal>
  );
  const serviceMap: Record<string, { service: Service; subServices: IndividualService[] }> = {};
  (bp.myServices ?? []).forEach((ms: MyService) => {
    const svc = ms.service; if (!svc?._id) return;
    if (!serviceMap[svc._id]) serviceMap[svc._id] = { service: svc, subServices: [] };
    const subIds = (ms.subServices ?? []).map(s => s.subService);
    if (Array.isArray(svc.services)) {
      const matched = subIds.length ? svc.services.filter(ss => subIds.includes(ss._id)) : svc.services;
      serviceMap[svc._id].subServices.push(...matched);
    }
  });
  return (
    <BaseModal isOpen wide onClose={onClose} title={`Business Profile — ${bp.businessName || "-"}`}>
      <ShopOverviewCard bp={bp} />
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom: "2px solid #3c8dbc", paddingBottom: 6, color: "#3c8dbc", marginTop: 16 }}>Team Members</div>
      {Array.isArray(bp.teamMembers) && bp.teamMembers.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          {bp.teamMembers.map((tm: TeamMemberType) => (
            <div key={tm._id} style={GREEN_CARD}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#c8e6b0", border: "2px solid #1a6e1a", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {tm.photo ? <img src={imgUrl(tm.photo)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 18, color: "#1a6e1a" }}>👤</span>}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{tm.name}</div>
                  <div style={{ fontSize: 12, color: "#555" }}>{tm.designation || "-"}</div>
                  <div style={{ fontSize: 12, color: "#555" }}>{tm.email || ""} {tm.phone || ""}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <div style={{ color: "#aaa", fontSize: 13, marginBottom: 20 }}>No team members.</div>}
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom: "2px solid #3c8dbc", paddingBottom: 6, color: "#3c8dbc" }}>Services</div>
      {Object.keys(serviceMap).length > 0 ? (
        <div style={{ marginBottom: 20 }}>
          {Object.values(serviceMap).map(({ service, subServices }) => (
            <div key={service._id} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#333", marginBottom: 4 }}>{service.name || "-"}</div>
              {subServices.length > 0 && <ul style={{ paddingLeft: 18, margin: "0 0 4px", fontSize: 12, color: "#555" }}>{subServices.map(ss => <li key={ss._id}>{ss.name}{ss.desc ? ` — ${ss.desc}` : ""}</li>)}</ul>}
            </div>
          ))}
        </div>
      ) : <div style={{ color: "#aaa", fontSize: 13, marginBottom: 20 }}>No services listed.</div>}
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom: "2px solid #3c8dbc", paddingBottom: 6, color: "#3c8dbc" }}>My Deals</div>
      {Array.isArray(bp.myDeals) && bp.myDeals.length > 0 ? (
        <div style={{ overflowX: "auto", marginBottom: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["Name", "Type", "Discount", "Ends On"].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {bp.myDeals.map((deal: any, i: number) => {
                if (typeof deal === "string") return <tr key={i}><td style={tdS} colSpan={4}>{deal}</td></tr>;
                return (
                  <tr key={deal._id ?? i}>
                    <td style={tdS}>{deal.name || "-"}</td>
                    <td style={tdS}>{deal.dealType || "-"}</td>
                    <td style={tdS}>{deal.discountedPrice != null ? `$${deal.discountedPrice}` : deal.percentageDiscount != null ? `${deal.percentageDiscount}%` : "-"}</td>
                    <td style={tdS}>{deal.offerEndsOnDate ? fmtDate(deal.offerEndsOnDate) : deal.endDate ? fmtDate(deal.endDate) : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <div style={{ color: "#aaa", fontSize: 13 }}>No deals linked.</div>}
    </BaseModal>
  );
};

// ─── PRINT PAGE ───────────────────────────────────────────────────────────────
function printOwner(owner: AutoShopOwnerType) {
  const bp = owner.businessProfile;
  const customers = owner.myCustomers ?? [];
  const deals = owner.deals ?? [];
  const cards = owner.jobCards ?? [];
  const logoSrc = bp?.businessLogo ? imgUrl(bp.businessLogo) : "";
  const services: string[] = [];
  if (Array.isArray(bp?.myServices)) for (const ms of bp!.myServices!) { const n = ms.serviceName || ms.service?.name; if (n) services.push(n); }
  const row = (label: string, value: string) => `<tr><td style="font-weight:600;padding:4px 12px 4px 0;width:130px;vertical-align:top">${label}</td><td style="padding:4px 0;color:#333">: ${value || "—"}</td></tr>`;
  const custRows = customers.map(c => `<tr><td></td><td style="padding:2px 0">: ${c.name || ""} ${c.email ? `(${c.email})` : ""}</td></tr>`).join("");
  const dealRows = deals.map(d => `<tr><td></td><td style="padding:2px 0">: ${d.name || d.dealType || "-"}</td></tr>`).join("");
  const cardRows = cards.map(c => `<tr><td></td><td style="padding:2px 0">: # ${c.jobNo || c._id.slice(-5)}</td></tr>`).join("");
  const html = `<!DOCTYPE html><html><head><title>Print - ${owner.name}</title>
<style>body{font-family:sans-serif;padding:30px}h2{font-weight:700;margin-bottom:16px}
.card{background:#d4f5c4;border-radius:14px;padding:22px 28px;display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #b2e0a0}
.left{border-right:1px solid #b2e0a0;padding-right:24px}.right{padding-left:24px}
table{border-collapse:collapse;font-size:14px}
.btn{background:#1a6e1a;color:#fff;border:none;border-radius:4px;padding:8px 24px;font-size:14px;font-weight:700;cursor:pointer;margin-right:8px}
.btn-xl{background:#0073b7}@media print{.noprint{display:none}}</style></head><body>
<h2>Print Page</h2>
<div class="card">
  <div class="left">
    <table>
      ${row("Name", owner.name)}${row("E-mail", owner.email ?? "")}${row("Phone", `${owner.countryCode ?? ""} ${owner.phone ?? ""}`.trim())}
      ${row("Shop Name", bp?.businessName ?? "")}${row("City", bp?.city ?? "")}${row("Address", bp?.businessAddress ?? "")}${row("Zip Code", bp?.pincode ?? "")}
      ${row("Status", getStatus(owner))}${row("HST No.", bp?.businessHSTNumber ?? "")}
      <tr><td style="font-weight:600;padding:4px 12px 4px 0;vertical-align:top">Services</td><td style="padding:4px 0">${services.join(", ") || "—"}</td></tr>
      <tr><td style="font-weight:600;padding:4px 12px 4px 0;vertical-align:top">Customers</td><td></td></tr>${custRows || `<tr><td></td><td>: —</td></tr>`}
      <tr><td style="font-weight:600;padding:4px 12px 4px 0;vertical-align:top">Deals</td><td></td></tr>${dealRows || `<tr><td></td><td>: —</td></tr>`}
      <tr><td style="font-weight:600;padding:4px 12px 4px 0;vertical-align:top">Job Cards</td><td></td></tr>${cardRows || `<tr><td></td><td>: —</td></tr>`}
    </table>
  </div>
  <div class="right">
    <div style="font-weight:700;font-size:16px;margin-bottom:14px">Shop Account Info</div>
    <table>${row("Mobile", owner.phone ?? "")}${row("Status", getStatus(owner))}${row("Joining Date", fmtDate(owner.createdAt))}${row("Email", bp?.businessEmail ?? "")}</table>
    <div style="margin-top:14px;font-weight:600;font-size:13px">Shop Logo :</div>
    <div style="margin-top:6px;background:#fff;border:1px solid #ccc;width:140px;height:140px;border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center">
      ${logoSrc ? `<img src="${logoSrc}" style="width:100%;height:100%;object-fit:cover"/>` : ""}
    </div>
    <div style="margin-top:24px" class="noprint">
      <button class="btn" onclick="window.print()">Print</button>
      <button class="btn btn-xl" onclick="exportXL()">Export XL</button>
    </div>
  </div>
</div>
<script>
function exportXL(){
  const d=${JSON.stringify({ Name:owner.name,Email:owner.email,Phone:`${owner.countryCode??""} ${owner.phone??""}`.trim(),ShopName:bp?.businessName,City:bp?.city,Address:bp?.businessAddress,Pincode:bp?.pincode,Status:getStatus(owner),Customers:customers.length,Deals:deals.length,JobCards:cards.length })};
  const rows=[Object.keys(d),Object.values(d)];
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\\n");
  const a=document.createElement("a");a.href="data:text/csv,"+encodeURIComponent(csv);a.download="autoshop-${owner.name.replace(/\s+/g,"-")}.csv";a.click();
}
</script></body></html>`;
  const w = window.open("", "_blank"); if (w) { w.document.write(html); w.document.close(); }
}

// ─── SEND NOTIFICATION MODAL ──────────────────────────────────────────────────
const SendNotifModal: React.FC<{ isOpen: boolean; onClose: () => void; ids: string[]; onDone: () => void }> = ({ isOpen, onClose, ids, onDone }) => {
  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [sending, setSending] = useState(false); const [err, setErr] = useState<string | null>(null); const [ok, setOk] = useState<string | null>(null);
  useEffect(() => { if (isOpen) { setTitle(""); setBody(""); setSending(false); setErr(null); setOk(null); } }, [isOpen]);
  if (!isOpen) return null;
  return (
    <BaseModal isOpen onClose={onClose} title="Send Custom Notification">
      <form onSubmit={async e => {
        e.preventDefault(); if (!title.trim() || !body.trim()) { setErr("Title and body required."); return; }
        setSending(true); setErr(null);
        try {
          const res = await axios.post(`${API()}/api/admin/notification/custom/send`, { userType: "autoshopowner", userIds: ids, title, message: body });
          if (res.data?.success) { setOk("Sent!"); setTimeout(() => { onClose(); onDone(); }, 900); }
          else setErr(res.data?.message || "Failed.");
        } catch (e: any) { setErr(e?.response?.data?.message || "Error."); } finally { setSending(false); }
      }}>
        <div style={{ marginBottom: 12 }}><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Title *</label><input style={{ width: "100%", border: "1px solid #d2d6de", borderRadius: 3, padding: "7px 10px", fontSize: 14, outline: "none", boxSizing: "border-box" }} value={title} onChange={e => setTitle(e.target.value)} disabled={sending} placeholder="Notification title" /></div>
        <div style={{ marginBottom: 12 }}><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Body *</label><textarea style={{ width: "100%", border: "1px solid #d2d6de", borderRadius: 3, padding: "7px 10px", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", minHeight: 80, fontFamily: "inherit" }} value={body} onChange={e => setBody(e.target.value)} rows={3} disabled={sending} placeholder="Notification message" /></div>
        <p style={{ fontSize: 13, color: "#2575c4", marginBottom: 10 }}>To: <strong>{ids.length} owner{ids.length !== 1 ? "s" : ""}</strong></p>
        {err && <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 8, background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, padding: "7px 10px" }}>{err}</div>}
        {ok && <div style={{ color: "#27ae60", fontSize: 13, marginBottom: 8, background: "#f0fff4", border: "1px solid #c3e6cb", borderRadius: 3, padding: "7px 10px" }}>{ok}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} disabled={sending} style={{ padding: "7px 18px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#444", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button type="submit" disabled={sending} style={{ padding: "7px 20px", borderRadius: 3, border: "none", background: sending ? "#aaa" : "#00a65a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: sending ? "not-allowed" : "pointer" }}>{sending ? "Sending…" : "Send"}</button>
        </div>
      </form>
    </BaseModal>
  );
};

// ─── COLUMN SELECTOR ─────────────────────────────────────────────────────────
const ColSelector: React.FC<{ visible: string[]; onChange: (v: string[]) => void }> = ({ visible, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = (key: string) => onChange(visible.includes(key) ? visible.filter(k => k !== key) : [...visible, key]);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{ padding: "6px 14px", background: "#555", color: "#fff", border: "none", borderRadius: 3, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
        Select Heading <span style={{ fontSize: 10 }}>▼</span>
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "110%", background: "#fff", border: "1px solid #d2d6de", borderRadius: 3, boxShadow: "0 3px 10px rgba(0,0,0,.15)", zIndex: 200, minWidth: 170, padding: "6px 0" }}>
          {ALL_COLUMNS.map(col => (
            <label key={col.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, color: "#333", userSelect: "none" }}>
              <input type="checkbox" checked={visible.includes(col.key)} onChange={() => toggle(col.key)} style={{ accentColor: "#0073b7", width: 14, height: 14, cursor: "pointer" }} />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── EXPORT CSV ───────────────────────────────────────────────────────────────
function exportCsv(owners: AutoShopOwnerType[], visibleCols: string[]) {
  const colMap: Record<string, (o: AutoShopOwnerType) => string> = {
    name: o => o.name || "-",
    phone: o => `${o.countryCode ?? ""} ${o.phone ?? ""}`.trim() || "-",
    shopName: o => o.businessProfile?.businessName || "-",
    shopType: o => o.shopType ? SHOP_TYPE_OPTIONS.find(x => x.value === o.shopType)?.label || o.shopType : "-",
    city: o => o.businessProfile?.city || "-",
    date: o => fmtDate(o.createdAt),
    customers: o => String(o.myCustomers?.length ?? 0),
    deals: o => String(o.deals?.length ?? 0),
    jobCards: o => String(o.jobCards?.length ?? 0),
    status: o => getStatus(o),
  };
  const cols = ALL_COLUMNS.filter(c => visibleCols.includes(c.key));
  const esc = (v: string) => /[,"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  const header = cols.map(c => esc(c.label)).join(",");
  const rows = owners.map(o => cols.map(c => esc(colMap[c.key]?.(o) ?? "-")).join(",")).join("\n");
  const blob = new Blob([header + "\n" + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `autoshop-owners-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ─── STYLE CONSTANTS ──────────────────────────────────────────────────────────
const thS: React.CSSProperties = { border: "1px solid #d2d6de", background: "#f9fafc", padding: "9px 12px", textAlign: "left", fontWeight: 700, fontSize: 13, color: "#333", whiteSpace: "nowrap" };
const tdS: React.CSSProperties = { border: "1px solid #d2d6de", padding: "9px 12px", fontSize: 13, color: "#555", verticalAlign: "middle" };
const linkBtn: React.CSSProperties = { background: "none", border: "none", color: "#0073b7", cursor: "pointer", padding: 0, fontSize: 12, textDecoration: "underline", fontWeight: 500 };
const pageBtn = (active: boolean, disabled: boolean): React.CSSProperties => ({ border: "1px solid", borderColor: active ? "#0073b7" : "#ddd", background: active ? "#0073b7" : "#fff", color: active ? "#fff" : disabled ? "#bbb" : "#777", padding: "6px 13px", fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", marginLeft: -1 });

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const AutoShopOwners: React.FC = () => {
  const [allOwners, setAllOwners] = useState<AutoShopOwnerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_VISIBLE);
  const [actionBusy, setActionBusy] = useState<Record<string, boolean>>({});

  // ── View toggle: "active" shows active/suspended, "deleted" shows deleted ──
  const [viewMode, setViewMode] = useState<"active" | "deleted">("active");

  // Modals
  const [profileFor, setProfileFor] = useState<AutoShopOwnerType | null>(null);
  const [businessFor, setBusinessFor] = useState<AutoShopOwnerType | null>(null);
  const [customersFor, setCustomersFor] = useState<AutoShopOwnerType | null>(null);
  const [dealsFor, setDealsFor] = useState<AutoShopOwnerType | null>(null);
  const [jobCardsFor, setJobCardsFor] = useState<AutoShopOwnerType | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [addEdit, setAddEdit] = useState<{ open: boolean; mode: "add" | "edit"; owner: AutoShopOwnerType | null }>({ open: false, mode: "add", owner: null });

  const fetchOwners = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await axios.get(`${API()}/api/admin/autoshopowners`, { headers: getToken() });
      if (res.data?.success && Array.isArray(res.data.data)) setAllOwners(res.data.data);
      else setError("Failed to fetch auto shop owners");
    } catch (e: any) { setError(e?.response?.data?.message || "Something went wrong"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOwners(); }, [fetchOwners]);

  // Split owners by deleted status
  const activeOwners = allOwners.filter(o => o.status !== "deleted");
  const deletedOwners = allOwners.filter(o => o.status === "deleted");
  const displayOwners = viewMode === "deleted" ? deletedOwners : activeOwners;

  const filtered = displayOwners.filter(o => {
    const q = search.toLowerCase();
    return (o.name || "").toLowerCase().includes(q)
      || (o.email || "").toLowerCase().includes(q)
      || (o.phone || "").toLowerCase().includes(q)
      || (o.businessProfile?.businessName || "").toLowerCase().includes(q)
      || (o.businessProfile?.city || "").toLowerCase().includes(q)
      || (o.shopType || "").toLowerCase().includes(q); // search on shopType as well
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = Array.from(selectedRows);
  const selCount = selected.length;
  const allPageSel = paginated.length > 0 && paginated.every(o => selectedRows.has(o._id));

  function toggleRow(id: string) {
    setSelectedRows(prev => { const c = new Set(prev); c.has(id) ? c.delete(id) : c.add(id); return c; });
  }

  async function toggleSuspend(ownerId: string, disable: boolean) {
    setActionBusy(prev => ({ ...prev, [ownerId]: true }));
    try {
      await axios.post(`${API()}/api/admin/autoshopowners/toggle-status`, { userId: ownerId, disable }, { headers: getToken() });
      await fetchOwners();
    } catch (e: any) { alert(e?.response?.data?.message || "Error updating status."); }
    finally { setActionBusy(prev => ({ ...prev, [ownerId]: false })); }
  }

  async function deleteOwner(ownerId: string) {
    if (!window.confirm("Delete this auto shop owner? They can be restore later.")) return;
    setActionBusy(prev => ({ ...prev, [ownerId]: true }));
    try {
      await axios.delete(`${API()}/api/admin/autoshopowners/${ownerId}`, { headers: getToken() });
      setAllOwners(prev => prev.map(o => o._id === ownerId ? { ...o, status: "deleted", isDisabled: true } : o));
      setSelectedRows(prev => { const c = new Set(prev); c.delete(ownerId); return c; });
      await fetchOwners();
    } catch (e: any) { alert(e?.response?.data?.message || "Error deleting."); }
    finally { setActionBusy(prev => ({ ...prev, [ownerId]: false })); }
  }

  async function reviveOwner(ownerId: string) {
    setActionBusy(prev => ({ ...prev, [ownerId]: true }));
    try {
      await axios.put(`${API()}/api/admin/autoshopowners/${ownerId}/revive`, {}, { headers: getToken() });
      await fetchOwners();
    } catch (e: any) { alert(e?.response?.data?.message || "Error restoring."); }
    finally { setActionBusy(prev => ({ ...prev, [ownerId]: false })); }
  }

  function renderCell(owner: AutoShopOwnerType, key: string) {
    switch (key) {
      case "name":
        return (
          <td key={key} style={{ ...tdS, fontWeight: 500 }}>
            <button type="button" onClick={() => setProfileFor(owner)} style={{ ...linkBtn, color: "#8a00d4", fontWeight: 600, fontSize: 13 }}>
              {owner.name}
            </button>
          </td>
        );
      case "phone":
        return <td key={key} style={tdS}>{owner.countryCode ? `${owner.countryCode} ` : ""}{owner.phone || "-"}</td>;
      case "shopName":
        return <td key={key} style={tdS}><button type="button" onClick={() => setBusinessFor(owner)} style={linkBtn}>{owner.businessProfile?.businessName || "-"}</button></td>;
      case "shopType":
        return (
          <td key={key} style={tdS}>
            {(owner.shopType && SHOP_TYPE_OPTIONS.find(x => x.value === owner.shopType)?.label) || "-"}
          </td>
        );
      case "city":
        return <td key={key} style={tdS}>{owner.businessProfile?.city || "-"}</td>;
      case "date":
        return <td key={key} style={tdS}>{fmtDate(owner.createdAt)}</td>;
      case "customers":
        return <td key={key} style={tdS}><button type="button" onClick={() => setCustomersFor(owner)} style={linkBtn}>{owner.myCustomers?.length ?? 0}</button></td>;
      case "deals":
        return <td key={key} style={tdS}><button type="button" onClick={() => setDealsFor(owner)} style={linkBtn}>{owner.deals?.length ?? 0}</button></td>;
      case "jobCards":
        return <td key={key} style={tdS}><button type="button" onClick={() => setJobCardsFor(owner)} style={linkBtn}>{owner.jobCards?.length ?? 0}</button></td>;
      case "status":
        return <td key={key} style={tdS}><span style={{ ...getStatusColors(getStatus(owner)), display: "inline-block", padding: "2px 10px", borderRadius: 3, fontSize: 12, fontWeight: 600 }}>{getStatus(owner)}</span></td>;
      default:
        return <td key={key} style={tdS}>-</td>;
    }
  }

  const tbBtn = (label: string, bg: string, onClick: () => void, disabled = false) => (
    <button type="button" onClick={onClick} disabled={disabled} style={{ padding: "6px 14px", borderRadius: 2, border: "1px solid rgba(0,0,0,0.2)", fontSize: 13, background: disabled ? "#bbb" : bg, color: "#fff", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );

  return (
    <>
      {/* ── MODALS ── */}
      {/* unchanged, same as previous code for modals... */}
      {profileFor && (
        <ProfileModal
          owner={profileFor}
          onClose={() => setProfileFor(null)}
          onEdit={() => { setAddEdit({ open: true, mode: "edit", owner: profileFor }); setProfileFor(null); }}
        />
      )}
      {businessFor && <BusinessProfileModal owner={businessFor} onClose={() => setBusinessFor(null)} />}
      {customersFor && <CustomersModal owner={customersFor} onClose={() => setCustomersFor(null)} />}
      {dealsFor && <DealsModal owner={dealsFor} onClose={() => setDealsFor(null)} />}
      {jobCardsFor && <JobCardsModal owner={jobCardsFor} onClose={() => setJobCardsFor(null)} />}
      <SendNotifModal isOpen={notifOpen} onClose={() => setNotifOpen(false)} ids={selected} onDone={() => {}} />
      <AddEditModal
        isOpen={addEdit.open}
        onClose={() => setAddEdit(s => ({ ...s, open: false }))}
        onSaved={() => { setAddEdit(s => ({ ...s, open: false })); fetchOwners(); }}
        owner={addEdit.owner}
        mode={addEdit.mode}
      />

      {/* ── PAGE ── */}
      <div className="h-[92vh] overflow-y-auto bg-[#f0f0f0] px-6 py-5 font-sans">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1 style={{ fontSize: 34, fontWeight: 300, color: "#333", margin: 0 }}>Auto Shop Owners</h1>
          <button
            onClick={() => setAddEdit({ open: true, mode: "add", owner: null })}
            style={{ background: "#00a65a", color: "#fff", padding: "8px 18px", borderRadius: 4, border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer" }}
          >
            + Add New
          </button>
        </div>

        <div className="mb-4" style={{ background: "#fff", border: "1px solid #d2d6de", borderRadius: 3, boxShadow: "0 1px 1px rgba(0,0,0,.1)" }}>
          {/* ── Toolbar ── */}
          <div style={{ padding: "8px 14px", background: "#d2d6de", borderBottom: "1px solid #bbb", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {viewMode === "active" ? (
              <>
                {tbBtn("✉ Send Notification", "#555", () => { if (!selCount) { alert("Select at least one."); return; } setNotifOpen(true); })}
                {tbBtn("WhatsApp", "#25d366", () => {})}
                {tbBtn("↓ Export XL", "#555", () => { if (!selCount) { alert("Select at least one."); return; } exportCsv(allOwners.filter(o => selectedRows.has(o._id)), visibleCols); })}
                {selCount === 1 && tbBtn("✏️ Update", "#0073b7", () => { const o = allOwners.find(x => x._id === selected[0]); if (o) setAddEdit({ open: true, mode: "edit", owner: o }); })}
                {selCount === 1 && tbBtn("🗑 Delete", "#e74c3c", () => deleteOwner(selected[0]))}
                {selCount === 1 && tbBtn("🖨 Print", "#00c0ef", () => { const o = allOwners.find(x => x._id === selected[0]); if (o) printOwner(o); })}
              </>
            ) : (
              <>
                {selCount === 1 && tbBtn("♻️ Restore Active", "#27ae60", () => reviveOwner(selected[0]))}
              </>
            )}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} style={{ height: 30, width: 170, border: "1px solid #bbb", borderRadius: 2, padding: "0 10px", fontSize: 13, outline: "none" }} placeholder="Live Search here" />
              {selCount > 0 && <span style={{ fontSize: 12, color: "#555", fontWeight: 600, whiteSpace: "nowrap" }}>{selCount} selected</span>}
              {viewMode === "active" && <ColSelector visible={visibleCols} onChange={setVisibleCols} />}
            </div>
          </div>

          {/* ── View Mode Banner ── */}
          {viewMode === "deleted" && (
            <div style={{ background: "#fdf3f2", borderBottom: "1px solid #f5c6cb", padding: "8px 20px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: "#a94442", fontWeight: 600 }}>🗑️ Showing Deleted Auto Shop Owners ({deletedOwners.length})</span>
              <span style={{ fontSize: 12, color: "#888" }}>— Select a deleted owner and click restore to set active</span>
            </div>
          )}

          {/* Card Body */}
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#333", marginBottom: 14 }}>
              <span>Show</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ height: 32, border: "1px solid #d2d6de", borderRadius: 3, padding: "0 8px", fontSize: 14, outline: "none" }}>
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>entries</span>
            </div>

            {loading && <div style={{ textAlign: "center", padding: "40px 0", color: "#888" }}>Loading shop owners…</div>}
            {error && <div style={{ textAlign: "center", padding: "30px 0", color: "#c0392b" }}>Error: {error}</div>}

            {!loading && !error && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr>
                      <th style={thS}>
                        <input type="checkbox" checked={allPageSel} onChange={e => {
                          setSelectedRows(prev => { const c = new Set(prev); paginated.forEach(o => e.target.checked ? c.add(o._id) : c.delete(o._id)); return c; });
                        }} />
                      </th>
                      {ALL_COLUMNS.filter(c => viewMode === "active" ? visibleCols.includes(c.key) : DEFAULT_VISIBLE.includes(c.key)).map(c => <th key={c.key} style={thS}>{c.label}</th>)}
                      {viewMode === "active" && <th style={thS}>Action</th>}
                      {viewMode === "deleted" && <th style={thS}>Restore Active</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 && (
                      <tr><td colSpan={visibleCols.length + 2} style={{ ...tdS, textAlign: "center", color: "#aaa", padding: "36px 0" }}>
                        {viewMode === "deleted" ? "No deleted auto shop owners." : "No auto shop owners found."}
                      </td></tr>
                    )}
                    {paginated.map(owner => {
                      const isSuspended = !!owner.isDisabled;
                      const busy = !!actionBusy[owner._id];
                      const cols = ALL_COLUMNS.filter(c => viewMode === "active" ? visibleCols.includes(c.key) : DEFAULT_VISIBLE.includes(c.key));
                      return (
                        <tr key={owner._id} style={{ background: selectedRows.has(owner._id) ? (viewMode === "deleted" ? "#fdf3f2" : "#f0f7ff") : undefined }}>
                          <td style={tdS}><input type="checkbox" checked={selectedRows.has(owner._id)} onChange={() => toggleRow(owner._id)} /></td>
                          {cols.map(c => renderCell(owner, c.key))}
                          {viewMode === "active" && (
                            <td style={{ ...tdS, whiteSpace: "nowrap" }}>
                              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                <button type="button" disabled={busy} onClick={() => toggleSuspend(owner._id, !isSuspended)} style={{ padding: "4px 10px", borderRadius: 3, border: "none", fontSize: 12, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", background: isSuspended ? "#dff0d8" : "#fcf8e3", color: isSuspended ? "#3c763d" : "#8a6d3b", opacity: busy ? 0.6 : 1 }}>
                                  {busy ? "…" : isSuspended ? "Enable" : "Suspend"}
                                </button>
                                <button type="button" disabled={busy} onClick={() => deleteOwner(owner._id)} style={{ padding: "4px 10px", borderRadius: 3, border: "none", fontSize: 12, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", background: "#f2dede", color: "#a94442", opacity: busy ? 0.6 : 1 }}>
                                  {busy ? "…" : "Delete"}
                                </button>
                              </div>
                            </td>
                          )}
                          {viewMode === "deleted" && (
                            <td style={tdS}>
                              <button type="button" disabled={busy} onClick={() => reviveOwner(owner._id)} style={{ padding: "4px 12px", borderRadius: 3, border: "none", background: busy ? "#aaa" : "#27ae60", color: "#fff", fontSize: 12, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer" }}>
                                {busy ? "…" : "♻️ Restore Active"}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !error && (
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <p style={{ margin: 0, fontSize: 14, color: "#333" }}>
                  {filtered.length === 0 ? "No entries" : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} entries${search ? ` (filtered from ${displayOwners.length} total)` : ""}`}
                </p>
                <div style={{ display: "flex" }}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={pageBtn(false, currentPage === 1)}>Previous</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(pg => <button key={pg} onClick={() => setCurrentPage(pg)} style={pageBtn(pg === currentPage, false)}>{pg}</button>)}
                  {totalPages > 7 && <span style={{ padding: "6px 8px", fontSize: 13 }}>…</span>}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={pageBtn(false, currentPage === totalPages)}>Next</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom Right Toggle Button ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, marginBottom: 40 }}>
          <button
            type="button"
            onClick={() => {
              setViewMode(v => v === "active" ? "deleted" : "active");
              setSelectedRows(new Set());
              setSearch("");
              setCurrentPage(1);
            }}
            style={{
              padding: "9px 22px", borderRadius: 4, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer",
              background: viewMode === "active" ? "#e74c3c" : "#27ae60",
              color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            {viewMode === "active"
              ? <>🗑️ Deleted <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 10, padding: "1px 8px", fontSize: 12 }}>{deletedOwners.length}</span></>
              : <>✅ Active Owners</>
            }
          </button>
        </div>
      </div>
    </>
  );
};

export default AutoShopOwners;