// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHeader,
//   TableRow,
// } from "../../../components/ui/table";

// // --- ADD: XLSX FOR EXPORT ---
// import * as XLSX from "xlsx";

// // --- Types ---
// type TeamMember = {
//   name: string;
//   email?: string;
//   phone?: string;
//   designation?: string;
//   photo?: string;
//   _id: string;
// };

// type MapLocationType = {
//   lat: number;
//   lng: number;
//   _id: string;
// };

// type BusinessProfileType = {
//   _id: string;
//   businessName: string;
//   businessAddress?: string;
//   pincode?: string;
//   businessMapLocation?: MapLocationType;
//   businessPhone?: string;
//   businessEmail?: string;
//   businessHSTNumber?: string;
//   openHours?: string;
//   openDays?: string[];
//   businessLogo?: string;
//   teamMembers?: TeamMember[];
//   myDeals?: any[];
//   myServices?: any[];
//   createdAt?: string;
//   updatedAt?: string;
//   __v?: number;
//   city?: string;
//   businessWebsite?: string;
//   directionsUrl?: string;
//   rating?: number;
//   reviewCount?: number;
//   reviewDate?: string;
//   isFav?: boolean; // <-- added
// };

// type VehicleType = {
//   _id: string;
//   make?: { name?: string; model?: string };
//   year?: number;
//   vinNo?: string;
//   licensePlateNo?: string;
//   odometerReading?: number;
//   carImages?: string[];
//   licensePlateFrontImagePath?: string;
//   licensePlateBackImagePath?: string;
//   createdAt?: string;
//   updatedAt?: string;
//   [key: string]: any;
// };

// type JobCardTypePopulated = {
//   _id: string;
//   business: BusinessProfileType;
//   [key: string]: any;
// };

// type CarOwnerType = {
//   _id: string;
//   name: string;
//   email?: string;
//   countryCode?: string;
//   phone?: string;
//   address?: string;
//   pincode?: string;
//   isProfileComplete?: boolean;
//   isDisabled?: boolean;
//   myVehicles?: VehicleType[];
//   onboardedBy?: {
//     _id: string;
//     name?: string;
//     email?: string;
//   } | null;
//   favoriteAutoShops?: BusinessProfileType[];
//   autoshopsReceivedServiceFrom?: BusinessProfileType[];
//   jobCards?: JobCardTypePopulated[];
// };

// // --- Derive autoshopsReceivedServiceFrom from jobCards ---
// function getAutoshopsReceivedServiceFrom(owner: CarOwnerType): BusinessProfileType[] {
//   if (!owner.jobCards || owner.jobCards.length === 0) return [];
//   const seen = new Set<string>();
//   const shops: BusinessProfileType[] = [];
//   for (const card of owner.jobCards) {
//     if (card.business && card.business._id && !seen.has(card.business._id)) {
//       seen.add(card.business._id);
//       shops.push(card.business);
//     }
//   }
//   return shops;
// }

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
//       <div className="bg-white dark:bg-gray-900 rounded-xl max-w-3xl w-full shadow-lg relative">
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

// // --- Add: Send Notification Modal ---
// const SendNotificationModal: React.FC<{
//   isOpen: boolean;
//   onClose: () => void;
//   selectedOwnerIds: string[];
//   onNotificationSent: () => void;
// }> = ({ isOpen, onClose, selectedOwnerIds, onNotificationSent }) => {
//   const [title, setTitle] = useState("");
//   const [body, setBody] = useState("");
//   const [sending, setSending] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);

//   // Reset state on modal re-open
//   useEffect(() => {
//     if (isOpen) {
//       setTitle("");
//       setBody("");
//       setSending(false);
//       setError(null);
//       setSuccess(null);
//     }
//   }, [isOpen]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setSending(true);
//     setError(null);
//     setSuccess(null);

//     // Validate
//     if (!title.trim() || !body.trim()) {
//       setSending(false);
//       setError("Please enter both a title and a body for the notification.");
//       return;
//     }
//     if (!selectedOwnerIds || selectedOwnerIds.length === 0) {
//       setSending(false);
//       setError("No recipients selected.");
//       return;
//     }

//     try {
//       // API: POST /api/admin/send-custom-notification
//       const res = await axios.post(
//         `${import.meta.env.VITE_API_URL}/api/admin/notification/custom/send`,
//         {
//           userType: "carOwner",
//           userIds: selectedOwnerIds,
//           title,
//           message: body,
//         }
//       );
//       if (res.data && res.data.success) {
//         setSuccess("Notification sent successfully.");
//         setTimeout(() => {
//           onClose();
//           onNotificationSent();
//         }, 1000);
//       } else {
//         setError(res.data.message || "Failed to send notification.");
//       }
//     } catch (err: any) {
//       setError(
//         err?.response?.data?.message ||
//           "An error occurred while sending the notification."
//       );
//     } finally {
//       setSending(false);
//     }
//   };

//   return isOpen ? (
//     <Modal isOpen={isOpen} onClose={onClose} title="Send custom notification">
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div>
//           <label className="block text-sm font-medium mb-1">
//             Notification Title<span className="text-red-500">*</span>
//           </label>
//           <input
//             className="w-full border rounded px-3 py-2 text-sm"
//             value={title}
//             onChange={e => setTitle(e.target.value)}
//             maxLength={100}
//             required
//             disabled={sending}
//             placeholder="Title for push notification"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium mb-1">
//             Notification Body<span className="text-red-500">*</span>
//           </label>
//           <textarea
//             className="w-full border rounded px-3 py-2 text-sm resize-vertical"
//             value={body}
//             onChange={e => setBody(e.target.value)}
//             rows={4}
//             maxLength={1000}
//             required
//             disabled={sending}
//             placeholder="Notification message to send"
//           />
//         </div>
//         <div className="font-xs text-blue-800 mb-1">
//           <div>To: <span className="font-semibold">{selectedOwnerIds.length} car owners selected</span></div>
//         </div>
//         {error && (
//           <div className="text-red-500 text-xs font-medium">
//             {error}
//           </div>
//         )}
//         {success && (
//           <div className="text-green-600 text-xs font-medium">
//             {success}
//           </div>
//         )}
//         <div className="flex gap-2 justify-end">
//           <button
//             type="button"
//             className="bg-gray-200 px-4 py-2 rounded text-gray-700 text-xs font-medium hover:bg-gray-300"
//             onClick={onClose}
//             disabled={sending}
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             className="bg-green-600 text-white px-5 py-2 rounded text-xs font-semibold hover:bg-green-700 shadow disabled:opacity-60 disabled:cursor-not-allowed"
//             disabled={sending}
//           >
//             {sending ? "Sending..." : "Send Notification"}
//           </button>
//         </div>
//       </form>
//     </Modal>
//   ) : null;
// };

// // --- Utilities ---
// function processOpenDays(openDays: string[] | undefined): string {
//   if (!openDays) return "-";
//   try {
//     let val = openDays;
//     if (typeof val[0] === "string" && val[0].includes("["))
//       val = JSON.parse(openDays[0]);
//     if (Array.isArray(val) && typeof val[0] === "string" && val[0].includes("[")) {
//       val = JSON.parse(val[0]);
//     }
//     if (Array.isArray(val)) {
//       const flat = val.flat(Infinity).filter(Boolean);
//       return flat.join(", ");
//     }
//     return Array.isArray(val) ? (val as string[]).join(", ") : "-";
//   } catch (e) {
//     return Array.isArray(openDays) ? openDays.join(", ") : "-";
//   }
// }

// function toShopOverviewProps(shop: BusinessProfileType) {
//   const phone = shop.businessPhone ?? "289 274 8591";
//   const businessName = shop.businessName ?? "Auto 27 Car Garage";
//   const address = shop.businessAddress ?? "2 Fisherman Dr - Unit 9";
//   const city =
//     shop.pincode && shop.businessAddress
//       ? `${shop.businessAddress.includes("Brampton") ? "" : "Brampton, "}ON ${shop.pincode}`
//       : shop.city || "Brampton, ON L7A 1B5";
//   const openHours = shop.openHours ?? "9:00 AM - 6:00 PM";
//   const openDays = shop.openDays ? processOpenDays(shop.openDays) : "Mon - Sat";
//   const imageUrl = shop.businessLogo
//     ? shop.businessLogo.startsWith("http")
//       ? shop.businessLogo
//       : `${import.meta.env.VITE_UPLOADS_URL}/${shop.businessLogo.replace(/^\/+/, "")}`
//     : "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?q=80&w=1200&auto=format&fit=crop";
//   const rating = typeof shop.rating === "number" ? shop.rating : 4.8;
//   const reviewCount = typeof shop.reviewCount === "number" ? shop.reviewCount : 142;
//   const reviewDate = shop.reviewDate || "01 / 2026";
//   const websiteUrl = shop.businessWebsite || shop.businessEmail || "#";
//   const directionsUrl =
//     shop.directionsUrl ||
//     (shop.businessMapLocation
//       ? `https://www.google.com/maps?q=${shop.businessMapLocation.lat},${shop.businessMapLocation.lng}`
//       : "#");

//   let services: string[] = [];
//   if (
//     shop.myServices &&
//     Array.isArray(shop.myServices) &&
//     shop.myServices.length > 0
//   ) {
//     services = shop.myServices.map((s: any) => {
//       if (typeof s === "string") return s;
//       if (typeof s === "object") {
//         if (typeof s.serviceName === "string" && !!s.serviceName.trim()) {
//           return s.serviceName;
//         }
//         if (typeof s?.name === "string" && !!s.name.trim()) {
//           return s.name;
//         }
//         return "Unknown Service";
//       }
//       return "Unknown Service";
//     });
//   } else {
//     services = [
//       "General Repair",
//       "Diagnose - Paccer",
//       "Diagnose - Communis",
//       "Safety On-line",
//       "Oil Change",
//       "Brake Service",
//     ];
//   }
//   const isFav = typeof shop.isFav === "boolean" ? shop.isFav : false;
//   const isOpen = true;
//   return {
//     phone,
//     businessName,
//     address,
//     city,
//     openHours,
//     openDays,
//     isOpen,
//     services,
//     rating,
//     reviewCount,
//     reviewDate,
//     websiteUrl,
//     directionsUrl,
//     imageUrl,
//     isFav,
//   };
// }

// const HeartIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     viewBox="0 0 24 24"
//     width="20"
//     height="20"
//     aria-label={filled ? "Favourite" : "Not favourite"}
//     fill={filled ? "#ef4444" : "none"}
//     stroke={filled ? "#ef4444" : "#ef4444"}
//     strokeWidth={2}
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
//   </svg>
// );

// // ... ShopOverviewCard and other helpers unchanged ... (TRIM HERE FOR SPACE; see original)

// function ShopOverviewCard(shop: BusinessProfileType) {
//   const {
//     phone,
//     businessName,
//     address,
//     city,
//     openHours,
//     openDays,
//     isOpen,
//     services,
//     rating,
//     reviewCount,
//     reviewDate,
//     websiteUrl,
//     directionsUrl,
//     imageUrl,
//     isFav,
//   } = toShopOverviewProps(shop);

//   const displayServices =
//     services && services.length > 0
//       ? services
//       : [
//           "General Repair",
//           "Diagnose - Paccer",
//           "Diagnose - Communis",
//           "Safety On-line",
//           "Oil Change",
//           "Brake Service",
//         ];

//   const servicesToShow = displayServices.slice(0, 6);

//   // For brevity: keep as in original!
//   return (
//     <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] relative">
//       <div
//         className="grid border-b border-slate-200"
//         style={{
//           gridTemplateColumns:
//             "minmax(0, 1.15fr) minmax(0, 0.72fr) minmax(0, 0.72fr) minmax(0, 1.65fr) minmax(52px, 0.30fr)",
//           minHeight: 48,
//         }}
//       >
//         <div className="flex items-center justify-center border-r border-slate-200 bg-emerald-50 px-2 py-2 text-center text-[13px] font-bold text-emerald-800">
//           <span className="truncate">📞 {phone}</span>
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
//           href={websiteUrl}
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
//                 isOpen ? "bg-emerald-500" : "bg-red-500"
//               }`}
//             />
//             <span
//               className={`whitespace-nowrap text-[12px] font-semibold ${
//                 isOpen ? "text-emerald-700" : "text-red-600"
//               }`}
//             >
//               {isOpen ? "OPEN NOW" : "CLOSED"}
//             </span>
//           </div>
//           <div className="text-right text-[11px] leading-snug text-slate-500 ">
//             <div className="">{openDays}</div>
//             <div className="whitespace-nowrap">{openHours}</div>
//           </div>
//         </div>
//         <div className="flex items-center justify-center gap-1 bg-amber-50 text-[15px] font-bold text-slate-900">
//           <HeartIcon filled={isFav} />
//         </div>
//       </div>
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
//             {address}
//             <br />
//             {city}
//           </p>
//           <div className="flex flex-wrap gap-2">
//             <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
//               {isOpen ? "Open" : "Closed"}
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
//           <p className="mb-2.5 text-[13px] font-bold text-slate-900">Services</p>
//           <ul
//             className="grid list-none gap-x-4 gap-y-1.5 p-0"
//             style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}
//           >
//             {servicesToShow.map((service, index) => (
//               <li
//                 key={`${service}-${index}`}
//                 className="flex min-w-0 items-start gap-1.5 text-[12px] leading-snug text-slate-600"
//               >
//                 <span className="mt-px shrink-0 font-bold text-emerald-500">✓</span>
//                 <span className="min-w-0">{service}</span>
//               </li>
//             ))}
//           </ul>
//         </div>
//         <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-3 text-center">
//           <span className="text-[26px] font-bold leading-none text-slate-900">
//             {Number(rating).toFixed(1)}
//           </span>
//           <span className="mt-1 text-[13px] tracking-wide text-amber-500">★★★★★</span>
//           <span className="mt-1.5 text-[11px] text-slate-500">{reviewCount} Reviews</span>
//           <span className="mt-0.5 text-[10px] text-slate-400">{reviewDate}</span>
//         </div>
//       </div>
//       <div
//         className="grid items-center gap-2 bg-slate-900 px-4 py-2.5 text-[12px] text-white"
//         style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.6fr) minmax(0, 1fr)" }}
//       >
//         <span className="truncate font-medium">{businessName}</span>
//         <span className="truncate text-center text-slate-200">
//           {address} • {city}
//         </span>
//         <span className="truncate text-right text-slate-200">
//           {openDays} | {openHours}
//         </span>
//       </div>
//     </div>
//   );
// }

// // // --- AutoShops Received Service From Modal Content ---
// // const renderServicedShopsModalContent = (owner: CarOwnerType) => {
// //   const shops = getAutoshopsReceivedServiceFrom(owner);
// const renderServicedShopsModalContent = (owner: CarOwnerType) => {
//   const shops = owner.autoshopsReceivedServiceFrom ?? [];
//   return (
//     <>
//       <div className="mb-6">
//         <div className="flex flex-col gap-1 text-sm items-start">
//           <span className="text-gray-700 font-medium">
//             Owner Email:{" "}
//             <span className="font-normal text-gray-600">{owner.email || "-"}</span>
//           </span>
//           <span className="text-gray-700 font-medium">
//             Onboarded By:{" "}
//             <span className="font-normal text-gray-600">
//               {owner.onboardedBy
//                 ? owner.onboardedBy.name
//                   ? `${owner.onboardedBy.name}${owner.onboardedBy.email ? ` (${owner.onboardedBy.email})` : ""}`
//                   : owner.onboardedBy.email
//                 : "-"}
//             </span>
//           </span>
//         </div>
//       </div>
//       {shops.length > 0 ? (
//         <div className="flex flex-col gap-7">
//           {shops.map((shop) => (
//             <ShopOverviewCard key={shop._id} {...shop} />
//           ))}
//         </div>
//       ) : (
//         <div className="text-gray-400 text-center">No auto shops found for this owner.</div>
//       )}
//     </>
//   );
// };

// // --- Vehicles ---
// function renderVehicleImages(vehicle: VehicleType) {
//   const images: { src?: string; label: string }[] = [];
//   const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL;
//   if (Array.isArray(vehicle.carImages) && vehicle.carImages.length > 0) {
//     images.push(
//       ...vehicle.carImages.map((img) => ({
//         src:
//           typeof img === "string"
//             ? img.startsWith("http")
//               ? img
//               : `${UPLOADS_URL}/${img.replace(/^\/+/, "")}`
//             : undefined,
//         label: "Car Image",
//       }))
//     );
//   }
//   if (vehicle.licensePlateFrontImagePath) {
//     images.push({
//       src: vehicle.licensePlateFrontImagePath.startsWith("http")
//         ? vehicle.licensePlateFrontImagePath
//         : `${UPLOADS_URL}/${vehicle.licensePlateFrontImagePath.replace(/^\/+/, "")}`,
//       label: "Plate Front",
//     });
//   }
//   if (vehicle.licensePlateBackImagePath) {
//     images.push({
//       src: vehicle.licensePlateBackImagePath.startsWith("http")
//         ? vehicle.licensePlateBackImagePath
//         : `${UPLOADS_URL}/${vehicle.licensePlateBackImagePath.replace(/^\/+/, "")}`,
//       label: "Plate Back",
//     });
//   }
//   if (!images.length) {
//     return <div className="text-xs text-gray-400 italic">No images</div>;
//   }
//   return (
//     <div className="flex flex-wrap gap-2 mt-1">
//       {images.map((img, idx) =>
//         img.src ? (
//           <div className="flex flex-col items-center" key={idx}>
//             <img
//               src={img.src}
//               alt={img.label}
//               className="w-16 h-16 object-cover rounded border"
//               loading="lazy"
//             />
//             <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">{img.label}</span>
//           </div>
//         ) : null
//       )}
//     </div>
//   );
// }
// function getMake(vehicle: VehicleType): string {
//   if (!vehicle.make) return "-";
//   if (typeof vehicle.make === "object" && vehicle.make !== null) return vehicle.make.name || "-";
//   return typeof vehicle.make === "string" ? vehicle.make : "-";
// }
// function getModel(vehicle: VehicleType): string {
//   if (!vehicle.make) return "-";
//   if (typeof vehicle.make === "object" && vehicle.make !== null) return vehicle.make.model || "-";
//   return (vehicle as any).model || "-";
// }
// const renderVehiclesModalContent = (owner: CarOwnerType) => (
//   <>
//     {owner.myVehicles && owner.myVehicles.length > 0 ? (
//       <ul className="space-y-3">
//         {owner.myVehicles.map((vehicle) => (
//           <li
//             key={vehicle._id}
//             className="border rounded-lg px-4 py-3 bg-gray-50 dark:bg-gray-800"
//           >
//             <div className="flex flex-wrap justify-between items-center gap-4 mb-1">
//               <span className="font-semibold">
//                 {vehicle.year || "-"} {getMake(vehicle)} {getModel(vehicle)}
//               </span>
//             </div>
//             <div className="text-xs text-gray-700 dark:text-gray-300 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 mb-2">
//               <div>
//                 <span className="font-medium">License Plate:</span>{" "}
//                 {vehicle.licensePlateNo || "-"}
//               </div>
//               <div>
//                 <span className="font-medium">Odometer:</span>{" "}
//                 {vehicle.odometerReading !== undefined ? vehicle.odometerReading : "-"}
//               </div>
//               <div>
//                 <span className="font-medium">VIN No.:</span> {vehicle.vinNo || "-"}
//               </div>
//               <div>
//                 <span className="font-medium">Created At:</span>{" "}
//                 {vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleString() : "-"}
//               </div>
//               <div>
//                 <span className="font-medium">Updated At:</span>{" "}
//                 {vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleString() : "-"}
//               </div>
//             </div>
//             {renderVehicleImages(vehicle)}
//           </li>
//         ))}
//       </ul>
//     ) : (
//       <div className="text-gray-400 text-center">No vehicles found.</div>
//     )}
//   </>
// );

// function renderCustomerSummary(customer: any) {
//   return customer
//     ? `${customer.name ?? "-"}${customer.email ? ` (${customer.email})` : ""}`
//     : "-";
// }
// function renderJobCardServices(services: any[]) {
//   if (!services || !services.length) return "-";
//   return (
//     <ul className="ml-1 space-y-3">
//       {services.map((service, idx) => (
//         <li
//           key={service.id?._id ?? idx}
//           className="border-b pb-2 mb-2 last:border-0 last:pb-0 last:mb-0"
//         >
//           {service.id ? (
//             <div>
//               <div>
//                 <span className="font-medium">Service:</span> {service.id.name}
//               </div>
//               {service.id.desc && (
//                 <div>
//                   <span className="font-medium text-xs">Desc:</span> {service.id.desc}
//                 </div>
//               )}
//             </div>
//           ) : (
//             "-"
//           )}
//           {service.subServices && service.subServices.length > 0 && (
//             <div className="ml-2">
//               <span className="font-medium text-xs">Selected SubServices:</span>
//               <ul className="ml-4 list-[circle] text-xs">
//                 {service.subServices.map((sub: any, j: number) => (
//                   <li key={sub.id || j}>
//                     <span>
//                       {typeof sub.price === "number" && <>Price: ₹{sub.price}</>}
//                       {typeof sub.discountedPrice === "number" && (
//                         <> | Discounted: ₹{sub.discountedPrice}</>
//                       )}
//                       {typeof sub.discountAmount === "number" && (
//                         <> | Discount: ₹{sub.discountAmount}</>
//                       )}
//                     </span>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}
//         </li>
//       ))}
//     </ul>
//   );
// }

// const JobCardPanel: React.FC<{
//   card: JobCardTypePopulated;
//   idx: number;
//   isOpen: boolean;
//   onToggle: () => void;
// }> = ({ card, idx, isOpen, onToggle }) => {
//   const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL;
//   const cardServices = (card as any).services;
//   return (
//     <div className="rounded-xl border bg-gray-50 dark:bg-gray-800 shadow w-full mx-auto">
//       <button
//         onClick={onToggle}
//         className={`w-full flex justify-between items-center p-5 focus:outline-none focus-visible:ring text-left transition-colors ${
//           isOpen ? "border-b border-gray-200 dark:border-gray-700" : ""
//         }`}
//         aria-expanded={isOpen}
//         aria-controls={`jobcard-body-${card._id}-${idx}`}
//         type="button"
//       >
//         <div className="flex items-center gap-3">
//           <span className="font-bold text-lg text-blue-700 dark:text-blue-400">
//             Job Card #{idx + 1}
//           </span>
//         </div>
//         <div className="flex flex-col items-end min-w-[160px] gap-0">
//           <span className="block text-xs font-medium text-gray-600 dark:text-gray-300">
//             Payment:{" "}
//             <span
//               className={`font-bold ${
//                 (card as any).paymentStatus === "PAID" ? "text-green-600" : "text-red-600"
//               }`}
//             >
//               {(card as any).paymentStatus}
//             </span>
//           </span>
//           <span className="block text-xs font-medium text-gray-600 dark:text-gray-300">
//             Total Payable:{" "}
//             <span className="font-bold text-gray-900 dark:text-gray-100">
//               ₹{(card as any).totalPayableAmount}
//             </span>
//           </span>
//         </div>
//         {isOpen ? (
//           <span className="ml-3 text-xl text-gray-500 dark:text-gray-300 font-bold">&#9650;</span>
//         ) : (
//           <span className="ml-3 text-xl text-gray-300 dark:text-gray-600 font-bold">&#9660;</span>
//         )}
//       </button>
//       {isOpen && (
//         <div id={`jobcard-body-${card._id}-${idx}`} className="p-5 pt-0 animate-fadein">
//           <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-start">
//             <div className="flex-1 min-w-0 pr-4">
//               <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400">
//                 {(card as any).createdAt && (
//                   <span>Created: {new Date((card as any).createdAt).toLocaleString()}</span>
//                 )}
//                 {(card as any).updatedAt && (
//                   <span>Updated: {new Date((card as any).updatedAt).toLocaleString()}</span>
//                 )}
//               </div>
//               <div className="mt-2">
//                 <span className="font-semibold text-sm">Business:</span>
//                 <div className="ml-2">{card.business?.businessName ?? "-"}</div>
//               </div>
//             </div>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
//             <div>
//               <div className="font-medium text-sm mb-1">Vehicle Info</div>
//               <div className="text-xs pl-2">
//                 <div>
//                   <span className="font-medium">Plate No:</span>{" "}
//                   {(card as any).vehicleId?.licensePlateNo || "-"}
//                 </div>
//               </div>
//               <div className="mt-3 text-xs space-y-1">
//                 <div>
//                   <span className="font-medium">Customer:</span>{" "}
//                   {renderCustomerSummary((card as any).customerId)}
//                 </div>
//               </div>
//             </div>
//             <div>
//               <div className="font-medium text-sm mb-1">Services</div>
//               {Array.isArray(cardServices) && cardServices.length > 0
//                 ? renderJobCardServices(cardServices)
//                 : <span className="ml-2 text-gray-500">-</span>}
//               <div className="mt-4">
//                 <span className="font-medium">Vehicle Photos:</span>
//                 {(card as any).vehiclePhotos && (card as any).vehiclePhotos.length > 0 ? (
//                   <div className="flex flex-wrap gap-2 mt-1">
//                     {(card as any).vehiclePhotos.map((photo: string, idx: number) => (
//                       <img
//                         key={idx}
//                         src={
//                           typeof photo === "string"
//                             ? photo.startsWith("http")
//                               ? photo
//                               : `${UPLOADS_URL}/${photo.replace(/^\/+/, "")}`
//                             : ""
//                         }
//                         alt={`vehicle-photo-${idx + 1}`}
//                         className="w-16 h-16 object-cover rounded border"
//                       />
//                     ))}
//                   </div>
//                 ) : (
//                   <span className="ml-2 text-gray-400 italic">No photos</span>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// const RenderJobCardsModalContent: React.FC<{ owner: CarOwnerType }> = ({ owner }) => {
//   const [openIdx, setOpenIdx] = useState<number | null>(null);
//   React.useEffect(() => {
//     setOpenIdx(null);
//   }, [owner]);
//   if (!owner.jobCards || owner.jobCards.length < 1) {
//     return <div className="text-gray-400 text-center">No job cards found.</div>;
//   }
//   return (
//     <div className="flex flex-col gap-6">
//       {owner.jobCards.map((card, idx) => (
//         <JobCardPanel
//           key={card._id}
//           card={card}
//           idx={idx}
//           isOpen={openIdx === idx}
//           onToggle={() => setOpenIdx(openIdx === idx ? null : idx)}
//         />
//       ))}
//     </div>
//   );
// };

// // --- Main Component ---
// const CarOwners: React.FC = () => {
//   const [carOwners, setCarOwners] = useState<CarOwnerType[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string>("");

//   const [openVehiclesFor, setOpenVehiclesFor] = useState<CarOwnerType | null>(null);
//   const [openServicedShopsFor, setOpenServicedShopsFor] = useState<CarOwnerType | null>(null);
//   const [openJobCardsFor, setOpenJobCardsFor] = useState<CarOwnerType | null>(null);

//   // Added for notification modal
//   const [openNotificationModal, setOpenNotificationModal] = useState<boolean>(false);

//   // --- ADDED: selectedRows State ---
//   const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

//   const fetchCarOwners = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/carowners`);
//       if (res.data.success && Array.isArray(res.data.data)) {
//         setCarOwners(res.data.data);
//         // console.log(res.data);
//       } else {
//         setError("Failed to fetch car owners");
//       }
//     } catch (err: any) {
//       setError(err?.response?.data?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCarOwners();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // --- ADDED: Handlers for Selection & Export ---
//   const toggleRow = (id: string) => {
//     setSelectedRows((prev) => {
//       const copy = new Set(prev);
//       if (copy.has(id)) {
//         copy.delete(id);
//       } else {
//         copy.add(id);
//       }
//       return copy;
//     });
//   };

//   const isRowSelected = (id: string) => selectedRows.has(id);

//   const exportSelected = () => {
//     const ownersToExport = carOwners.filter(owner => selectedRows.has(owner._id));
//     if (ownersToExport.length === 0) {
//       alert("Please select at least one Car Owner to export.");
//       return;
//     }

//     // Utility for Vehicle Details in one cell
//     function vehicleDetailsString(vehicles?: VehicleType[]): string {
//       if (!vehicles || vehicles.length === 0) return "-";
//       return vehicles.map(v => {
//         return `${v.licensePlateNo ? v.licensePlateNo : "-"}` +
//           ` (${typeof v.make === "object" && v.make ? (v.make.name || "-") : "-"}` +
//           `, ${typeof v.make === "object" && v.make ? (v.make.model || "-") : "-"}` +
//           `, ${v.year || "-"})`;
//       }).join('\n');
//     }

//     // Utility for Serviced AutoShops
//     function shopsString(shops?: BusinessProfileType[]): string {
//       if (!shops || shops.length === 0) return "-";
//       return shops.map(s =>
//         `${s.businessName || "-"}${s.businessPhone ? " (" + s.businessPhone + ")" : ""}`
//       ).join('\n');
//     }

//     // Utility for JobCard Numbers (IDs)
//     function jobCardsString(jobCards?: JobCardTypePopulated[]): string {
//       // console.log(jobCards);
//       if (!jobCards || jobCards.length === 0) return "-";
//       // If JobCards have a jobCardNumber property use that, else use _id or an increment number
//       return jobCards.map((jc) =>
//         (jc as any).jobNo
//           ? String((jc as any).jobNo)
//           : jc._id
//       ).join('\n');

//     }

//     // Compose Excel rows
//     const data = ownersToExport.map(owner => {
//       const shops = owner.autoshopsReceivedServiceFrom ?? getAutoshopsReceivedServiceFrom(owner);

//       return {
//         "Name": owner.name || "-",
//         "Phone": owner.phone || "-",
//         "Country Code": owner.countryCode || "-",
//         "Address": owner.address || "-",
//         "Pincode": owner.pincode || "-",
//         "Profile Complete": owner.isProfileComplete ? "Yes" : "No",
//         "Disabled": owner.isDisabled ? "Yes" : "No",
//         "Vehicles": vehicleDetailsString(owner.myVehicles),
//         "Serviced AutoShops": shopsString(shops),
//         "Job Cards": jobCardsString(owner.jobCards)
//       };
//     });

//     // Sheet and Download
//     const ws = XLSX.utils.json_to_sheet(data, { skipHeader: false });

//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Car Owners");
//     XLSX.writeFile(wb, "car-owners.xlsx");
//   };

//   // --- ADD: Toolbar for Export & Send Notification ---
//   return (
//     <>
//       {/* NOTIFICATION MODAL */}
//       <SendNotificationModal
//         isOpen={openNotificationModal}
//         onClose={() => setOpenNotificationModal(false)}
//         selectedOwnerIds={Array.from(selectedRows)}
//         onNotificationSent={() => {
//           // Optionally re-fetch data or show toast
//         }}
//       />

//       {openVehiclesFor && (
//         <Modal
//           isOpen={!!openVehiclesFor}
//           onClose={() => setOpenVehiclesFor(null)}
//           title={`Vehicles for ${openVehiclesFor.name}`}
//         >
//           {renderVehiclesModalContent(openVehiclesFor)}
//         </Modal>
//       )}
//       {openServicedShopsFor && (
//         <Modal
//           isOpen={!!openServicedShopsFor}
//           onClose={() => setOpenServicedShopsFor(null)}
//           title={`Auto Shops (Received Service) for ${openServicedShopsFor.name}`}
//         >
//           {renderServicedShopsModalContent(openServicedShopsFor)}
//         </Modal>
//       )}
//       {openJobCardsFor && (
//         <Modal
//           isOpen={!!openJobCardsFor}
//           onClose={() => setOpenJobCardsFor(null)}
//           title={`Job Cards for ${openJobCardsFor.name}`}
//         >
//           <RenderJobCardsModalContent owner={openJobCardsFor} />
//         </Modal>
//       )}

//       <div className="overflow-y-auto h-full pb-20 rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-4">
//         {/* Export, Selection, Send Notification toolbar */}
//         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
//           <h2 className="text-xl font-semibold">Car Owners</h2>
//           <div className="flex items-center gap-3">
//             {/* Send Notification Button */}
//             <button
//               className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded shadow disabled:opacity-50 disabled:cursor-not-allowed"
//               onClick={() => setOpenNotificationModal(true)}
//               disabled={selectedRows.size === 0}
//               title="Send custom notification to selected car owners"
//               type="button"
//               style={{ whiteSpace: "nowrap" }}
//             >
//               Send Notification
//             </button>
//             <button
//               className="text-white bg-blue-600 hover:bg-blue-700 text-xs font-semibold px-4 py-2 rounded shadow disabled:opacity-50 disabled:cursor-not-allowed"
//               style={{ whiteSpace: "nowrap" }}
//               onClick={exportSelected}
//               disabled={selectedRows.size === 0}
//               title="Export selected Car Owners as Excel"
//               type="button"
//             >
//               Export to Excel
//             </button>
//             <span className="text-xs text-gray-500">
//               {selectedRows.size > 0
//                 ? `Selected: ${selectedRows.size}`
//                 : "Select rows to export or notify"}
//             </span>
//           </div>
//         </div>
//         {loading && (
//           <div className="py-10 text-center font-medium text-gray-600">
//             Loading car owners...
//           </div>
//         )}
//         {error && (
//           <div className="py-10 text-center font-medium text-red-600">Error: {error}</div>
//         )}
//         {!loading && !error && (
//           <div className="max-w-full overflow-x-auto">
//             <Table>
//               <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
//                 <TableRow>
//                   <TableCell isHeader className="px-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
//                     <input
//                       type="checkbox"
//                       aria-label="Select all"
//                       checked={
//                         carOwners.length > 0 && selectedRows.size === carOwners.length
//                       }
//                       onChange={e => {
//                         if (e.target.checked) {
//                           setSelectedRows(new Set(carOwners.map(o => o._id)));
//                         } else {
//                           setSelectedRows(new Set());
//                         }
//                       }}
//                     />
//                   </TableCell>
//                   <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
//                     Name
//                   </TableCell>
//                   <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
//                     Phone
//                   </TableCell>
//                   <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
//                     Country Code
//                   </TableCell>
//                   <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
//                     Address
//                   </TableCell>
//                   <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
//                     Pincode
//                   </TableCell>
//                   <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
//                     Profile Complete
//                   </TableCell>
//                   <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
//                     Disabled
//                   </TableCell>
//                   <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
//                     Vehicles
//                   </TableCell>
//                   {/* Renamed from Fav. AutoShops → Serviced AutoShops */}
//                   <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
//                     Serviced AutoShops
//                   </TableCell>
//                   <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
//                     Job Cards
//                   </TableCell>
//                 </TableRow>
//               </TableHeader>
//               <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
//                 {carOwners.length === 0 && (
//                   <TableRow>
//                     <TableCell className="text-center py-8 text-gray-400" >
//                       No car owners found.
//                     </TableCell>
//                   </TableRow>
//                 )}
//                 {carOwners.map((owner) => {
//                   const servicedShops = owner.autoshopsReceivedServiceFrom ?? [];
//                   return (
//                     <TableRow key={owner._id}>
//                       <TableCell className="px-3 py-3 text-gray-800 text-theme-sm dark:text-white/90">
//                         <input
//                           type="checkbox"
//                           aria-label="Select row"
//                           checked={isRowSelected(owner._id)}
//                           onChange={() => toggleRow(owner._id)}
//                         />
//                       </TableCell>
//                       <TableCell className="px-5 py-3 text-gray-800 text-theme-sm dark:text-white/90">
//                         {owner.name || "-"}
//                       </TableCell>
//                       <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
//                         {owner.phone || "-"}
//                       </TableCell>
//                       <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
//                         {owner.countryCode || "-"}
//                       </TableCell>
//                       <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
//                         {owner.address || "-"}
//                       </TableCell>
//                       <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
//                         {owner.pincode || "-"}
//                       </TableCell>
//                       <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
//                         {owner.isProfileComplete ? "Yes" : "No"}
//                       </TableCell>
//                       <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
//                         {owner.isDisabled ? "Yes" : "No"}
//                       </TableCell>
//                       <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
//                         {owner.myVehicles && owner.myVehicles.length > 0 ? (
//                           <button
//                             className="underline text-blue-600 hover:text-blue-800 text-xs"
//                             type="button"
//                             onClick={() => setOpenVehiclesFor(owner)}
//                           >
//                             View All ({owner.myVehicles.length})
//                           </button>
//                         ) : (
//                           "-"
//                         )}
//                       </TableCell>
//                       {/* Serviced AutoShops — derived from jobCards */}
//                       <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
//                         {servicedShops.length > 0 ? (
//                           <button
//                             className="underline text-blue-600 hover:text-blue-800 text-xs"
//                             type="button"
//                             onClick={() => setOpenServicedShopsFor(owner)}
//                           >
//                             View All ({servicedShops.length})
//                           </button>
//                         ) : (
//                           "-"
//                         )}
//                       </TableCell>
//                       <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
//                         {owner.jobCards && owner.jobCards.length > 0 ? (
//                           <button
//                             className="underline text-blue-600 hover:text-blue-800 text-xs"
//                             type="button"
//                             onClick={() => setOpenJobCardsFor(owner)}
//                           >
//                             View All ({owner.jobCards.length})
//                           </button>
//                         ) : (
//                           "-"
//                         )}
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

// export default CarOwners;

import React, { useState, useEffect } from "react";
import axios from "axios";

// ===================== CarOwners Export Column Config ========================
const ALL_EXPORT_COLUMNS: { key: string; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "countryCode", label: "Country Code" },
  { key: "address", label: "Address" },
  { key: "pincode", label: "Pincode" },
  { key: "profileComplete", label: "Profile Complete" },
  { key: "disabled", label: "Disabled" },
  { key: "vehicles", label: "Vehicles" },
  { key: "servicedAutoShops", label: "Serviced AutoShops" },
  { key: "jobCards", label: "Job Cards" },
];

// --- Types ---
type TeamMember = {
  name: string;
  email?: string;
  phone?: string;
  designation?: string;
  photo?: string;
  _id: string;
};

type MapLocationType = {
  lat: number;
  lng: number;
  _id: string;
};

type BusinessProfileType = {
  _id: string;
  businessName: string;
  businessAddress?: string;
  pincode?: string;
  businessMapLocation?: MapLocationType;
  businessPhone?: string;
  businessEmail?: string;
  businessHSTNumber?: string;
  openHours?: string;
  openDays?: string[];
  businessLogo?: string;
  teamMembers?: TeamMember[];
  myDeals?: any[];
  myServices?: any[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  city?: string;
  businessWebsite?: string;
  directionsUrl?: string;
  rating?: number;
  reviewCount?: number;
  reviewDate?: string;
  isFav?: boolean;
};

type VehicleType = {
  _id: string;
  make?: { name?: string; model?: string };
  year?: number;
  vinNo?: string;
  licensePlateNo?: string;
  odometerReading?: number;
  carImages?: string[];
  licensePlateFrontImagePath?: string;
  licensePlateBackImagePath?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

type JobCardTypePopulated = {
  _id: string;
  business: BusinessProfileType;
  [key: string]: any;
};
type CarOwnerType = {
  _id: string;
  name: string;
  email?: string;
  countryCode?: string;
  phone?: string;
  address?: string;
  pincode?: string;
  isProfileComplete?: boolean;
  isDisabled?: boolean;
  myVehicles?: VehicleType[];
  onboardedBy?: { _id: string; name?: string; email?: string } | null;
  favoriteAutoShops?: BusinessProfileType[];
  autoshopsReceivedServiceFrom?: BusinessProfileType[];
  jobCards?: JobCardTypePopulated[];
};

// --- Derive autoshops from jobCards ---
function getAutoshopsReceivedServiceFrom(owner: CarOwnerType): BusinessProfileType[] {
  if (!owner.jobCards || owner.jobCards.length === 0) return [];
  const seen = new Set<string>();
  const shops: BusinessProfileType[] = [];
  for (const card of owner.jobCards) {
    if (card.business && card.business._id && !seen.has(card.business._id)) {
      seen.add(card.business._id);
      shops.push(card.business);
    }
  }
  return shops;
}

// --- Export helpers ---
function vehicleDetailsString(vehicles?: VehicleType[]): string {
  if (!vehicles || !vehicles.length) return "-";
  return vehicles
    .map(
      (v) =>
        `${v.licensePlateNo || "-"} (${typeof v.make === "object" && v.make ? v.make.name || "-" : "-"}, ${
          typeof v.make === "object" && v.make ? v.make.model || "-" : "-"
        }, ${v.year || "-"})`
    )
    .join("\n");
}
function shopsString(shops?: BusinessProfileType[]): string {
  if (!shops || !shops.length) return "-";
  return shops.map((s) => `${s.businessName || "-"}${s.businessPhone ? " (" + s.businessPhone + ")" : ""}`).join("\n");
}
function jobCardsString(jobCards?: JobCardTypePopulated[]): string {
  if (!jobCards || !jobCards.length) return "-";
  return jobCards.map((jc) => (jc as any).jobNo ? String((jc as any).jobNo) : jc._id).join("\n");
}
function getOwnerColValue(owner: CarOwnerType, key: string): string {
  switch (key) {
    case "name":
      return owner.name || "-";
    case "email":
      return owner.email || "-";
    case "phone":
      return owner.phone || "-";
    case "countryCode":
      return owner.countryCode || "-";
    case "address":
      return owner.address || "-";
    case "pincode":
      return owner.pincode || "-";
    case "profileComplete":
      return owner.isProfileComplete ? "Yes" : "No";
    case "disabled":
      return owner.isDisabled ? "Yes" : "No";
    case "vehicles":
      return vehicleDetailsString(owner.myVehicles);
    case "servicedAutoShops":
      return shopsString(owner.autoshopsReceivedServiceFrom ?? getAutoshopsReceivedServiceFrom(owner));
    case "jobCards":
      return jobCardsString(owner.jobCards);
    default:
      return "-";
  }
}
function toCsv(data: string[][], headers: string[]): string {
  const esc = (val: any) => {
    if (val == null) return "";
    let s = String(val);
    if (/[,"\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  return headers.map(esc).join(",") + "\n" + data.map((row) => row.map(esc).join(",")).join("\n");
}
function downloadAsCsvFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ─── MODAL (AdminLTE style) ───────────────────────────────────────────────────
type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, wide }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 4,
          width: wide ? "min(900px, 96vw)" : "min(720px, 94vw)",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 5px 15px rgba(0,0,0,.5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#3c8dbc",
            color: "#fff",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: "4px 4px 0 0",
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 16 }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 22,
              lineHeight: 1,
              cursor: "pointer",
              padding: "0 2px",
            }}
            aria-label="Close"
            type="button"
          >
            ×
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ─── EXPORT COLUMNS MODAL ────────────────────────────────────────────────────
const ExportColumnsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  selectedOwnerIds: string[];
  owners: CarOwnerType[];
}> = ({ isOpen, onClose, selectedOwnerIds, owners }) => {
  const [selectedCols, setSelectedCols] = useState<string[]>(ALL_EXPORT_COLUMNS.map((c) => c.key));
  useEffect(() => {
    if (isOpen) setSelectedCols(ALL_EXPORT_COLUMNS.map((c) => c.key));
  }, [isOpen]);
  const toggleCol = (key: string) => {
    setSelectedCols((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };
  const allSelected = selectedCols.length === ALL_EXPORT_COLUMNS.length;
  const toggleAll = () => {
    setSelectedCols(allSelected ? [] : ALL_EXPORT_COLUMNS.map((c) => c.key));
  };
  const handleExport = () => {
    if (!selectedCols.length) {
      alert("Please select at least one column.");
      return;
    }
    const orderedCols = ALL_EXPORT_COLUMNS.filter((c) => selectedCols.includes(c.key));
    const headers = orderedCols.map((c) => c.label);
    const dataToExport = owners.filter((o) => selectedOwnerIds.includes(o._id));
    const rows = dataToExport.map((owner) => orderedCols.map((c) => getOwnerColValue(owner, c.key)));
    downloadAsCsvFile(`car-owners-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, headers));
    onClose();
  };
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Columns to Export">
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: "#555" }}>
            Exporting <strong>{selectedOwnerIds.length}</strong> row{selectedOwnerIds.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={toggleAll}
            style={{ fontSize: 12, color: "#0073b7", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
          >
            {allSelected ? "Deselect All" : "Select All"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
          {ALL_EXPORT_COLUMNS.map((col) => (
            <label
              key={col.key}
              style={{
                display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                fontSize: 13, color: "#333", padding: "6px 10px", borderRadius: 3,
                background: selectedCols.includes(col.key) ? "#f0f7ff" : "#fafafa",
                border: `1px solid ${selectedCols.includes(col.key) ? "#0073b7" : "#d2d6de"}`,
                transition: "all 0.15s",
              }}
            >
              <input
                type="checkbox"
                checked={selectedCols.includes(col.key)}
                onChange={() => toggleCol(col.key)}
                style={{ accentColor: "#0073b7", width: 14, height: 14, cursor: "pointer", flexShrink: 0 }}
              />
              {col.label}
            </label>
          ))}
        </div>
      </div>
      {selectedCols.length === 0 && (
        <div style={{ color: "#c0392b", fontSize: 12, marginBottom: 10, background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, padding: "6px 10px" }}>
          Please select at least one column to export.
        </div>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
        <button
          type="button"
          onClick={onClose}
          style={{ padding: "7px 18px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#444", fontSize: 13, cursor: "pointer" }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={selectedCols.length === 0}
          style={{
            padding: "7px 20px", borderRadius: 3, border: "none",
            background: selectedCols.length === 0 ? "#aaa" : "#00a65a",
            color: "#fff", fontSize: 13, fontWeight: 600,
            cursor: selectedCols.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          ↓ Export {selectedCols.length} Column{selectedCols.length !== 1 ? "s" : ""}
        </button>
      </div>
    </Modal>
  );
};

// ─── SEND NOTIFICATION MODAL ──────────────────────────────────────────────────
// (no changes - same as in your code)
const SendNotificationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  selectedOwnerIds: string[];
  onNotificationSent: () => void;
}> = ({ isOpen, onClose, selectedOwnerIds, onNotificationSent }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  useEffect(() => {
    if (isOpen) {
      setTitle(""); setBody(""); setSending(false); setError(null); setSuccess(null);
    }
  }, [isOpen]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true); setError(null); setSuccess(null);
    if (!title.trim() || !body.trim()) {
      setSending(false);
      setError("Please enter both a title and a body for the notification.");
      return;
    }
    if (!selectedOwnerIds || selectedOwnerIds.length === 0) {
      setSending(false); setError("No recipients selected."); return;
    }
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/notification/custom/send`,
        { userType: "carOwner", userIds: selectedOwnerIds, title, message: body }
      );
      if (res.data && res.data.success) {
        setSuccess("Notification sent successfully.");
        setTimeout(() => { onClose(); onNotificationSent(); }, 1000);
      } else {
        setError(res.data.message || "Failed to send notification.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "An error occurred while sending the notification.");
    } finally {
      setSending(false);
    }
  };
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Custom Notification">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Notification Title <span style={{ color: "#e73d3d" }}>*</span>
          </label>
          <input
            style={{
              width: "100%", border: "1px solid #d2d6de", borderRadius: 3,
              padding: "7px 10px", fontSize: 14, outline: "none", boxSizing: "border-box",
            }}
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={100}
            required
            disabled={sending}
            placeholder="Title for push notification"
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            Notification Body <span style={{ color: "#e73d3d" }}>*</span>
          </label>
          <textarea
            style={{
              width: "100%", border: "1px solid #d2d6de", borderRadius: 3,
              padding: "7px 10px", fontSize: 14, outline: "none", resize: "vertical",
              boxSizing: "border-box", minHeight: 90,
            }}
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={4}
            maxLength={1000}
            required
            disabled={sending}
            placeholder="Notification message to send"
          />
        </div>
        <div style={{ fontSize: 13, color: "#2575c4", marginBottom: 10 }}>
          To: <strong>{selectedOwnerIds.length} car owner{selectedOwnerIds.length !== 1 ? "s" : ""} selected</strong>
        </div>
        {error && (
          <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 10, background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, padding: "7px 10px" }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ color: "#27ae60", fontSize: 13, marginBottom: 10, background: "#f0fff4", border: "1px solid #c3e6cb", borderRadius: 3, padding: "7px 10px" }}>
            {success}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            style={{
              padding: "7px 18px", borderRadius: 3, border: "1px solid #d2d6de",
              background: "#fff", color: "#444", fontSize: 13, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={sending}
            style={{
              padding: "7px 20px", borderRadius: 3, border: "none",
              background: sending ? "#aaa" : "#00a65a", color: "#fff",
              fontSize: 13, fontWeight: 600, cursor: sending ? "not-allowed" : "pointer",
            }}
          >
            {sending ? "Sending…" : "Send Notification"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// --- Shop Card, Serviced Shops, Vehicles, JobCards and their helpers ---
// (all unchanged from your code)
function processOpenDays(openDays: string[] | undefined): string {
  if (!openDays) return "-";
  try {
    let val = openDays;
    if (typeof val[0] === "string" && val[0].includes("[")) val = JSON.parse(openDays[0]);
    if (Array.isArray(val) && typeof val[0] === "string" && (val[0] as string).includes("[")) val = JSON.parse(val[0]);
    if (Array.isArray(val)) { const flat = (val as any[]).flat(Infinity).filter(Boolean); return flat.join(", "); }
    return Array.isArray(val) ? (val as string[]).join(", ") : "-";
  } catch { return Array.isArray(openDays) ? openDays.join(", ") : "-"; }
}

function toShopOverviewProps(shop: BusinessProfileType) {
  const phone = shop.businessPhone ?? "289 274 8591";
  const businessName = shop.businessName ?? "Auto 27 Car Garage";
  const address = shop.businessAddress ?? "2 Fisherman Dr - Unit 9";
  const city = shop.pincode && shop.businessAddress
    ? `${shop.businessAddress.includes("Brampton") ? "" : "Brampton, "}ON ${shop.pincode}`
    : shop.city || "Brampton, ON L7A 1B5";
  const openHours = shop.openHours ?? "9:00 AM - 6:00 PM";
  const openDays = shop.openDays ? processOpenDays(shop.openDays) : "Mon - Sat";
  const imageUrl = shop.businessLogo
    ? shop.businessLogo.startsWith("http") ? shop.businessLogo : `${import.meta.env.VITE_UPLOADS_URL}/${shop.businessLogo.replace(/^\/+/, "")}`
    : "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?q=80&w=1200&auto=format&fit=crop";
  const rating = typeof shop.rating === "number" ? shop.rating : 4.8;
  const reviewCount = typeof shop.reviewCount === "number" ? shop.reviewCount : 142;
  const reviewDate = shop.reviewDate || "01 / 2026";
  const websiteUrl = shop.businessWebsite || shop.businessEmail || "#";
  const directionsUrl = shop.directionsUrl || (shop.businessMapLocation ? `https://www.google.com/maps?q=${shop.businessMapLocation.lat},${shop.businessMapLocation.lng}` : "#");
  let services: string[] = [];
  if (shop.myServices && Array.isArray(shop.myServices) && shop.myServices.length > 0) {
    services = shop.myServices.map((s: any) => {
      if (typeof s === "string") return s;
      if (typeof s === "object") { if (typeof s.serviceName === "string" && !!s.serviceName.trim()) return s.serviceName; if (typeof s?.name === "string" && !!s.name.trim()) return s.name; return "Unknown Service"; }
      return "Unknown Service";
    });
  } else {
    services = ["General Repair", "Diagnose - Paccer", "Diagnose - Communis", "Safety On-line", "Oil Change", "Brake Service"];
  }
  const isFav = typeof shop.isFav === "boolean" ? shop.isFav : false;
  const isOpen = true;
  return { phone, businessName, address, city, openHours, openDays, isOpen, services, rating, reviewCount, reviewDate, websiteUrl, directionsUrl, imageUrl, isFav };
}

const HeartIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill={filled ? "#ef4444" : "none"} stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

function ShopOverviewCard(shop: BusinessProfileType) {
  const { phone, businessName, address, city, openHours, openDays, isOpen, services, rating, reviewCount, reviewDate, websiteUrl, directionsUrl, imageUrl, isFav } = toShopOverviewProps(shop);
  const servicesToShow = (services && services.length > 0 ? services : ["General Repair", "Diagnose - Paccer", "Diagnose - Communis", "Safety On-line", "Oil Change", "Brake Service"]).slice(0, 6);
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] relative">
      <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: "minmax(0,1.15fr) minmax(0,0.72fr) minmax(0,0.72fr) minmax(0,1.65fr) minmax(52px,0.30fr)", minHeight: 48 }}>
        <div className="flex items-center justify-center border-r border-slate-200 bg-emerald-50 px-2 py-2 text-center text-[13px] font-bold text-emerald-800"><span className="truncate">📞 {phone}</span></div>
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center border-r border-slate-200 bg-sky-50 text-[13px] font-semibold text-blue-600 no-underline transition-colors hover:bg-sky-100">Directions</a>
        <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center border-r border-slate-200 bg-slate-50 text-[13px] font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-100">Website</a>
        <div className="flex min-w-0 items-center justify-between gap-2 border-r border-slate-200 bg-white px-3 py-2">
          <div className="flex shrink-0 items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${isOpen ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className={`whitespace-nowrap text-[12px] font-semibold ${isOpen ? "text-emerald-700" : "text-red-600"}`}>{isOpen ? "OPEN NOW" : "CLOSED"}</span>
          </div>
          <div className="text-right text-[11px] leading-snug text-slate-500"><div>{openDays}</div><div className="whitespace-nowrap">{openHours}</div></div>
        </div>
        <div className="flex items-center justify-center gap-1 bg-amber-50 text-[15px] font-bold text-slate-900"><HeartIcon filled={isFav} /></div>
      </div>
      <div className="grid items-start gap-5 p-5" style={{ gridTemplateColumns: "minmax(120px,150px) minmax(0,1.25fr) minmax(0,1.1fr) minmax(100px,118px)" }}>
        <img src={imageUrl} alt={businessName} className="h-[108px] w-full rounded-lg object-cover" />
        <div className="min-w-0">
          <h2 className="mb-1.5 text-xl font-bold leading-tight text-slate-900">{businessName}</h2>
          <p className="mb-3 text-[13px] leading-relaxed text-slate-600">{address}<br />{city}</p>
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
          <span className="text-[26px] font-bold leading-none text-slate-900">{Number(rating).toFixed(1)}</span>
          <span className="mt-1 text-[13px] tracking-wide text-amber-500">★★★★★</span>
          <span className="mt-1.5 text-[11px] text-slate-500">{reviewCount} Reviews</span>
          <span className="mt-0.5 text-[10px] text-slate-400">{reviewDate}</span>
        </div>
      </div>
      <div className="grid items-center gap-2 bg-slate-900 px-4 py-2.5 text-[12px] text-white" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1.6fr) minmax(0,1fr)" }}>
        <span className="truncate font-medium">{businessName}</span>
        <span className="truncate text-center text-slate-200">{address} • {city}</span>
        <span className="truncate text-right text-slate-200">{openDays} | {openHours}</span>
      </div>
    </div>
  );
}

// ─── SERVICED SHOPS MODAL CONTENT ─────────────────────────────────────────────
const renderServicedShopsModalContent = (owner: CarOwnerType) => {
  const shops = owner.autoshopsReceivedServiceFrom ?? [];
  return (
    <>
      <div style={{ marginBottom: 16, padding: "10px 14px", background: "#f8f9fa", border: "1px solid #d2d6de", borderRadius: 3 }}>
        <div style={{ fontSize: 13 }}>
          <span style={{ fontWeight: 600 }}>Owner Email:</span>{" "}
          <span style={{ color: "#555" }}>{owner.email || "-"}</span>
        </div>
        <div style={{ fontSize: 13, marginTop: 4 }}>
          <span style={{ fontWeight: 600 }}>Onboarded By:</span>{" "}
          <span style={{ color: "#555" }}>
            {owner.onboardedBy
              ? owner.onboardedBy.name
                ? `${owner.onboardedBy.name}${owner.onboardedBy.email ? ` (${owner.onboardedBy.email})` : ""}`
                : owner.onboardedBy.email
              : "-"}
          </span>
        </div>
      </div>
      {shops.length > 0 ? (
        <div className="flex flex-col gap-7">
          {shops.map((shop) => <ShopOverviewCard key={shop._id} {...shop} />)}
        </div>
      ) : (
        <div style={{ textAlign: "center", color: "#aaa", padding: "30px 0" }}>No auto shops found for this owner.</div>
      )}
    </>
  );
};

// ─── VEHICLES MODAL CONTENT ───────────────────────────────────────────────────
function renderVehicleImages(vehicle: VehicleType) {
  const images: { src?: string; label: string }[] = [];
  const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL;
  if (Array.isArray(vehicle.carImages) && vehicle.carImages.length > 0) {
    images.push(...vehicle.carImages.map((img) => ({ src: typeof img === "string" ? (img.startsWith("http") ? img : `${UPLOADS_URL}/${img.replace(/^\/+/, "")}`) : undefined, label: "Car Image" })));
  }
  if (vehicle.licensePlateFrontImagePath) {
    images.push({ src: vehicle.licensePlateFrontImagePath.startsWith("http") ? vehicle.licensePlateFrontImagePath : `${UPLOADS_URL}/${vehicle.licensePlateFrontImagePath.replace(/^\/+/, "")}`, label: "Plate Front" });
  }
  if (vehicle.licensePlateBackImagePath) {
    images.push({ src: vehicle.licensePlateBackImagePath.startsWith("http") ? vehicle.licensePlateBackImagePath : `${UPLOADS_URL}/${vehicle.licensePlateBackImagePath.replace(/^\/+/, "")}`, label: "Plate Back" });
  }
  if (!images.length) return <div style={{ fontSize: 12, color: "#aaa", fontStyle: "italic" }}>No images</div>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
      {images.map((img, idx) => img.src ? (
        <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src={img.src} alt={img.label} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 3, border: "1px solid #d2d6de" }} loading="lazy" />
          <span style={{ fontSize: 11, marginTop: 3, color: "#888" }}>{img.label}</span>
        </div>
      ) : null)}
    </div>
  );
}
function getMake(vehicle: VehicleType): string {
  if (!vehicle.make) return "-";
  if (typeof vehicle.make === "object" && vehicle.make !== null) return vehicle.make.name || "-";
  return typeof vehicle.make === "string" ? vehicle.make : "-";
}
function getModel(vehicle: VehicleType): string {
  if (!vehicle.make) return "-";
  if (typeof vehicle.make === "object" && vehicle.make !== null) return vehicle.make.model || "-";
  return (vehicle as any).model || "-";
}

const renderVehiclesModalContent = (owner: CarOwnerType) => (
  <>
    {owner.myVehicles && owner.myVehicles.length > 0 ? (
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {owner.myVehicles.map((vehicle) => (
          <li key={vehicle._id} style={{ border: "1px solid #d2d6de", borderRadius: 3, padding: "12px 16px", background: "#f8f9fa" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
              {vehicle.year || "-"} {getMake(vehicle)} {getModel(vehicle)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "6px 16px", fontSize: 12, color: "#555", marginBottom: 8 }}>
              <div><span style={{ fontWeight: 600 }}>License Plate:</span> {vehicle.licensePlateNo || "-"}</div>
              <div><span style={{ fontWeight: 600 }}>Odometer:</span> {vehicle.odometerReading !== undefined ? vehicle.odometerReading : "-"}</div>
              <div><span style={{ fontWeight: 600 }}>VIN No.:</span> {vehicle.vinNo || "-"}</div>
              <div><span style={{ fontWeight: 600 }}>Created:</span> {vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleString() : "-"}</div>
              <div><span style={{ fontWeight: 600 }}>Updated:</span> {vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleString() : "-"}</div>
            </div>
            {renderVehicleImages(vehicle)}
          </li>
        ))}
      </ul>
    ) : (
      <div style={{ textAlign: "center", color: "#aaa", padding: "30px 0" }}>No vehicles found.</div>
    )}
  </>
);

// --- Job cards (unchanged)
//... (copied from your code, no changes) ...
function renderCustomerSummary(customer: any) {
  return customer ? `${customer.name ?? "-"}${customer.email ? ` (${customer.email})` : ""}` : "-";
}

function renderJobCardServices(services: any[]) {
  if (!services || !services.length) return <span style={{ color: "#aaa" }}>-</span>;
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {services.map((service, idx) => (
        <li key={service.id?._id ?? idx} style={{ borderBottom: "1px solid #eee", paddingBottom: 8, marginBottom: 8, fontSize: 12 }}>
          {service.id ? (
            <div>
              <div><span style={{ fontWeight: 600 }}>Service:</span> {service.id.name}</div>
              {service.id.desc && <div style={{ color: "#777" }}>{service.id.desc}</div>}
            </div>
          ) : "-"}
          {service.subServices && service.subServices.length > 0 && (
            <div style={{ marginLeft: 10, marginTop: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 11 }}>Sub-Services:</span>
              <ul style={{ listStyleType: "circle", marginLeft: 16, fontSize: 11 }}>
                {service.subServices.map((sub: any, j: number) => (
                  <li key={sub.id || j}>
                    {typeof sub.price === "number" && <>Price: ₹{sub.price}</>}
                    {typeof sub.discountedPrice === "number" && <> | Discounted: ₹{sub.discountedPrice}</>}
                    {typeof sub.discountAmount === "number" && <> | Discount: ₹{sub.discountAmount}</>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

const JobCardPanel: React.FC<{
  card: JobCardTypePopulated; idx: number; isOpen: boolean; onToggle: () => void;
}> = ({ card, idx, isOpen, onToggle }) => {
  const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL;
  const cardServices = (card as any).services;
  return (
    <div style={{ border: "1px solid #d2d6de", borderRadius: 3, overflow: "hidden", background: "#fff" }}>
      {/* Accordion Header */}
      <button
        onClick={onToggle}
        type="button"
        aria-expanded={isOpen}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", background: isOpen ? "#3c8dbc" : "#f4f4f4",
          color: isOpen ? "#fff" : "#333", border: "none", cursor: "pointer",
          borderBottom: isOpen ? "1px solid #d2d6de" : "none", textAlign: "left",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14 }}>Job Card #{idx + 1}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12 }}>
            Payment:{" "}
            <span style={{ fontWeight: 700, color: isOpen ? "#fff" : ((card as any).paymentStatus === "PAID" ? "#27ae60" : "#e74c3c") }}>
              {(card as any).paymentStatus}
            </span>
          </span>
          <span style={{ fontSize: 12 }}>
            Total: <span style={{ fontWeight: 700 }}>₹{(card as any).totalPayableAmount}</span>
          </span>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{isOpen ? "▲" : "▼"}</span>
        </div>
      </button>
      {/* Accordion Body */}
      {isOpen && (
        <div style={{ padding: "16px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12, color: "#888", marginBottom: 10 }}>
            {(card as any).createdAt && <span>Created: {new Date((card as any).createdAt).toLocaleString()}</span>}
            {(card as any).updatedAt && <span>Updated: {new Date((card as any).updatedAt).toLocaleString()}</span>}
          </div>
          <div style={{ fontSize: 13, marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>Business:</span>{" "}
            {card.business?.businessName ?? "-"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Vehicle Info</div>
              <div style={{ fontSize: 12, paddingLeft: 8 }}>
                <div><span style={{ fontWeight: 600 }}>Plate No:</span> {(card as any).vehicleId?.licensePlateNo || "-"}</div>
                <div style={{ marginTop: 8 }}><span style={{ fontWeight: 600 }}>Customer:</span> {renderCustomerSummary((card as any).customerId)}</div>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Services</div>
              {Array.isArray(cardServices) && cardServices.length > 0
                ? renderJobCardServices(cardServices)
                : <span style={{ color: "#aaa", paddingLeft: 8 }}>-</span>}
              <div style={{ marginTop: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 12 }}>Vehicle Photos:</span>
                {(card as any).vehiclePhotos && (card as any).vehiclePhotos.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    {(card as any).vehiclePhotos.map((photo: string, i: number) => (
                      <img key={i} src={typeof photo === "string" ? (photo.startsWith("http") ? photo : `${UPLOADS_URL}/${photo.replace(/^\/+/, "")}`) : ""} alt={`vehicle-photo-${i + 1}`} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 3, border: "1px solid #d2d6de" }} />
                    ))}
                  </div>
                ) : (
                  <span style={{ marginLeft: 8, color: "#aaa", fontStyle: "italic", fontSize: 12 }}>No photos</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RenderJobCardsModalContent: React.FC<{ owner: CarOwnerType }> = ({ owner }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  React.useEffect(() => { setOpenIdx(null); }, [owner]);
  if (!owner.jobCards || owner.jobCards.length < 1) {
    return <div style={{ textAlign: "center", color: "#aaa", padding: "30px 0" }}>No job cards found.</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {owner.jobCards.map((card, idx) => (
        <JobCardPanel key={card._id} card={card} idx={idx} isOpen={openIdx === idx} onToggle={() => setOpenIdx(openIdx === idx ? null : idx)} />
      ))}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const CarOwners: React.FC = () => {
  const [carOwners, setCarOwners] = useState<CarOwnerType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [openVehiclesFor, setOpenVehiclesFor] = useState<CarOwnerType | null>(null);
  const [openServicedShopsFor, setOpenServicedShopsFor] = useState<CarOwnerType | null>(null);
  const [openJobCardsFor, setOpenJobCardsFor] = useState<CarOwnerType | null>(null);
  const [openNotificationModal, setOpenNotificationModal] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  const fetchCarOwners = async () => {
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("admin-token");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/carowners`, {
        headers: {
          Authorization: token ? token : "",
        },
      });
      if (res.data.success && Array.isArray(res.data.data)) {
        setCarOwners(res.data.data);
      } else {
        setError("Failed to fetch car owners");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCarOwners(); }, []);

  // Filter + paginate
  const filtered = carOwners.filter((o) => {
    const q = search.toLowerCase();
    return (
      (o.name || "").toLowerCase().includes(q) ||
      (o.phone || "").toLowerCase().includes(q) ||
      (o.email || "").toLowerCase().includes(q) ||
      (o.address || "").toLowerCase().includes(q)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Selection
  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };
  const isRowSelected = (id: string) => selectedRows.has(id);
  const allPageSelected = paginated.length > 0 && paginated.every((o) => selectedRows.has(o._id));

  // Export modal open handler
  const openExportModal = () => {
    if (!selectedRows.size) {
      alert("Please select at least one Car Owner to export.");
      return;
    }
    setExportModalOpen(true);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Modals */}
      <SendNotificationModal
        isOpen={openNotificationModal}
        onClose={() => setOpenNotificationModal(false)}
        selectedOwnerIds={Array.from(selectedRows)}
        onNotificationSent={() => {}}
      />
      <ExportColumnsModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        selectedOwnerIds={Array.from(selectedRows)}
        owners={carOwners}
      />
      {openVehiclesFor && (
        <Modal isOpen wide onClose={() => setOpenVehiclesFor(null)} title={`Vehicles — ${openVehiclesFor.name}`}>
          {renderVehiclesModalContent(openVehiclesFor)}
        </Modal>
      )}
      {openServicedShopsFor && (
        <Modal isOpen wide onClose={() => setOpenServicedShopsFor(null)} title={`Serviced Auto Shops — ${openServicedShopsFor.name}`}>
          {renderServicedShopsModalContent(openServicedShopsFor)}
        </Modal>
      )}
      {openJobCardsFor && (
        <Modal isOpen wide onClose={() => setOpenJobCardsFor(null)} title={`Job Cards — ${openJobCardsFor.name}`}>
          <RenderJobCardsModalContent owner={openJobCardsFor} />
        </Modal>
      )}

      {/* ── Page ── */}
      {/* Add h-[92vh] and scroll behavior on overflow (tailwind and fallback inline style) */}
      <div
        className="h-[92vh] overflow-y-auto bg-[#f0f0f0] px-6 py-5 font-sans"
      >
        {/* Page Heading */}
        <h1 style={{ fontSize: 34, fontWeight: 300, color: "#333", marginBottom: 20, marginTop: 0 }}>
          Car Owners
        </h1>

        {/* Card */}
        <div className="mb-10" style={{ background: "#fff", border: "1px solid #d2d6de", borderRadius: 3, boxShadow: "0 1px 1px rgba(0,0,0,.1)" }}>
          {/* Card Header */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #f4f4f4", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 400, color: "#444" }}>
              Car Owner List
            </h3>
            {/* Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {selectedRows.size > 0 && (
                <span style={{ fontSize: 12, color: "#777", marginRight: 4 }}>
                  {selectedRows.size} selected
                </span>
              )}
              <button
                onClick={() => setOpenNotificationModal(true)}
                disabled={selectedRows.size === 0}
                type="button"
                style={{
                  padding: "6px 14px", borderRadius: 3, border: "none", fontSize: 13,
                  background: selectedRows.size === 0 ? "#aaa" : "#00a65a",
                  color: "#fff", fontWeight: 600, cursor: selectedRows.size === 0 ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                ✉ Send Notification
              </button>
              <button
                onClick={openExportModal}
                disabled={selectedRows.size === 0}
                type="button"
                style={{
                  padding: "6px 14px", borderRadius: 3, border: "none", fontSize: 13,
                  background: selectedRows.size === 0 ? "#aaa" : "#0073b7",
                  color: "#fff", fontWeight: 600, cursor: selectedRows.size === 0 ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                }}
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
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  style={{ height: 34, border: "1px solid #d2d6de", borderRadius: 3, padding: "0 10px", fontSize: 14, outline: "none" }}
                >
                  {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>entries</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#333" }}>
                <span>Search:</span>
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  style={{ height: 34, width: 190, border: "1px solid #d2d6de", borderRadius: 3, padding: "0 10px", fontSize: 14, outline: "none" }}
                  placeholder=""
                />
              </div>
            </div>

            {/* States */}
            {loading && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontSize: 14 }}>Loading car owners…</div>
            )}
            {error && (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#c0392b", fontSize: 14 }}>Error: {error}</div>
            )}

            {/* Table */}
            {!loading && !error && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr>
                      {/* Select-all checkbox */}
                      <th style={thStyle}>
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows((prev) => {
                                const copy = new Set(prev);
                                paginated.forEach((o) => copy.add(o._id));
                                return copy;
                              });
                            } else {
                              setSelectedRows((prev) => {
                                const copy = new Set(prev);
                                paginated.forEach((o) => copy.delete(o._id));
                                return copy;
                              });
                            }
                          }}
                        />
                      </th>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Phone</th>
                      <th style={thStyle}>Country Code</th>
                      <th style={thStyle}>Address</th>
                      <th style={thStyle}>Pincode</th>
                      <th style={thStyle}>Profile Complete</th>
                      <th style={thStyle}>Disabled</th>
                      <th style={thStyle}>Vehicles</th>
                      <th style={thStyle}>Serviced AutoShops</th>
                      <th style={thStyle}>Job Cards</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={11} style={{ ...tdStyle, textAlign: "center", color: "#aaa", padding: "36px 0" }}>
                          No car owners found.
                        </td>
                      </tr>
                    )}
                    {paginated.map((owner) => {
                      const servicedShops = owner.autoshopsReceivedServiceFrom ?? [];
                      const selected = isRowSelected(owner._id);
                      return (
                        <tr key={owner._id} style={{ background: selected ? "#f0f7ff" : undefined }}>
                          <td style={tdStyle}>
                            <input type="checkbox" checked={selected} onChange={() => toggleRow(owner._id)} />
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 500 }}>{owner.name || "-"}</td>
                          <td style={tdStyle}>{owner.phone || "-"}</td>
                          <td style={tdStyle}>{owner.countryCode || "-"}</td>
                          <td style={tdStyle}>{owner.address || "-"}</td>
                          <td style={tdStyle}>{owner.pincode || "-"}</td>
                          <td style={tdStyle}>
                            <span style={{
                              display: "inline-block", padding: "2px 10px", borderRadius: 3, fontSize: 12, fontWeight: 600,
                              background: owner.isProfileComplete ? "#dff0d8" : "#f2dede",
                              color: owner.isProfileComplete ? "#3c763d" : "#a94442",
                              border: `1px solid ${owner.isProfileComplete ? "#d6e9c6" : "#ebccd1"}`,
                            }}>
                              {owner.isProfileComplete ? "Yes" : "No"}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span style={{
                              display: "inline-block", padding: "2px 10px", borderRadius: 3, fontSize: 12, fontWeight: 600,
                              background: owner.isDisabled ? "#f2dede" : "#dff0d8",
                              color: owner.isDisabled ? "#a94442" : "#3c763d",
                              border: `1px solid ${owner.isDisabled ? "#ebccd1" : "#d6e9c6"}`,
                            }}>
                              {owner.isDisabled ? "Yes" : "No"}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            {owner.myVehicles && owner.myVehicles.length > 0 ? (
                              <button onClick={() => setOpenVehiclesFor(owner)} type="button" style={linkBtnStyle}>
                                View All ({owner.myVehicles.length})
                              </button>
                            ) : "-"}
                          </td>
                          <td style={tdStyle}>
                            {servicedShops.length > 0 ? (
                              <button onClick={() => setOpenServicedShopsFor(owner)} type="button" style={linkBtnStyle}>
                                View All ({servicedShops.length})
                              </button>
                            ) : "-"}
                          </td>
                          <td style={tdStyle}>
                            {owner.jobCards && owner.jobCards.length > 0 ? (
                              <button onClick={() => setOpenJobCardsFor(owner)} type="button" style={linkBtnStyle}>
                                View All ({owner.jobCards.length})
                              </button>
                            ) : "-"}
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
                  {filtered.length === 0
                    ? "No entries"
                    : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} entries${search ? ` (filtered from ${carOwners.length} total)` : ""}`}
                </p>
                <div style={{ display: "flex" }}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={pageBtn(false, currentPage === 1)}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      style={pageBtn(pg === currentPage, false)}
                    >
                      {pg}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={pageBtn(false, currentPage === totalPages)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Style helpers ────────────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  border: "1px solid #d2d6de",
  background: "#f9fafc",
  padding: "10px 12px",
  textAlign: "left",
  fontWeight: 700,
  fontSize: 13,
  color: "#333",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #d2d6de",
  padding: "10px 12px",
  fontSize: 13,
  color: "#555",
  verticalAlign: "middle",
};

const linkBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#0073b7",
  cursor: "pointer",
  padding: 0,
  fontSize: 12,
  textDecoration: "underline",
  fontWeight: 500,
};

const pageBtn = (active: boolean, disabled: boolean): React.CSSProperties => ({
  border: "1px solid",
  borderColor: active ? "#0073b7" : "#ddd",
  background: active ? "#0073b7" : "#fff",
  color: active ? "#fff" : disabled ? "#bbb" : "#777",
  padding: "6px 13px",
  fontSize: 13,
  cursor: disabled ? "not-allowed" : "pointer",
  marginLeft: -1,
});

export default CarOwners;