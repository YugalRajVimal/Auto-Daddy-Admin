// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";

// // ===================== CarOwners Export Column Config ========================
// const ALL_EXPORT_COLUMNS: { key: string; label: string }[] = [
//   { key: "name", label: "Name" },
//   { key: "email", label: "Email" },
//   { key: "phone", label: "Phone" },
//   { key: "countryCode", label: "Country Code" },
//   { key: "address", label: "Address" },
//   { key: "pincode", label: "Pincode" },
//   { key: "profileComplete", label: "Profile Complete" },
//   { key: "disabled", label: "Disabled" },
//   { key: "vehicles", label: "Vehicles" },
//   { key: "servicedAutoShops", label: "Serviced AutoShops" },
//   { key: "jobCards", label: "Job Cards" },
// ];

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
//   isFav?: boolean;
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
//   onboardedBy?: { _id: string; name?: string; email?: string } | null;
//   favoriteAutoShops?: BusinessProfileType[];
//   autoshopsReceivedServiceFrom?: BusinessProfileType[];
//   jobCards?: JobCardTypePopulated[];
// };

// // ===================== Vehicle form helpers ========================
// type VehicleFormRow = {
//   _id?: string;
//   licensePlateNo: string;
//   vinNo: string;
//   vehicleName: string;
//   model: string;
//   year: string;
//   odometerReading: string;
//   vehicleImageFile: File | null;
//   vehicleImagePreview: string;
//   isNew?: boolean;
// };

// function emptyVehicle(): VehicleFormRow {
//   return {
//     licensePlateNo: "",
//     vinNo: "",
//     vehicleName: "",
//     model: "",
//     year: "",
//     odometerReading: "",
//     vehicleImageFile: null,
//     vehicleImagePreview: "",
//     isNew: true,
//   };
// }

// // ===================== ADD/EDIT CAR OWNER MODAL ========================
// type AddEditCarOwnerModalProps = {
//   isOpen: boolean;
//   onClose: () => void;
//   onSaved: () => void;
//   owner?: CarOwnerType | null;
//   mode: "add" | "edit";
// };

// const CALLING_CODES = [
//   { id: "CA", flag: "🇨🇦", code: "+1" },
//   { id: "US", flag: "🇺🇸", code: "+1" },
//   { id: "GB", flag: "🇬🇧", code: "+44" },
//   { id: "IN", flag: "🇮🇳", code: "+91" },
//   { id: "AU", flag: "🇦🇺", code: "+61" },
// ];

// function isValidEmail(email: string): boolean {
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
// }

// function FieldError({ text }: { text?: string | null }) {
//   if (!text) return null;
//   return <p style={{ color: "#c0392b", fontSize: 11, margin: "3px 0 0", fontWeight: 600 }}>{text}</p>;
// }

// const inputStyle: React.CSSProperties = {
//   width: "100%",
//   border: "1px solid #d2d6de",
//   borderRadius: 3,
//   padding: "7px 10px",
//   fontSize: 13,
//   outline: "none",
//   boxSizing: "border-box",
//   color: "#333",
//   background: "#fff",
// };

// const labelStyle: React.CSSProperties = {
//   display: "block",
//   fontSize: 12,
//   fontWeight: 700,
//   marginBottom: 4,
//   color: "#555",
//   textTransform: "uppercase" as const,
//   letterSpacing: "0.04em",
// };

// function VehicleRow({
//   vehicle,
//   index,
//   attempted,
//   onChange,
//   onRemove,
//   canRemove,
// }: {
//   vehicle: VehicleFormRow;
//   index: number;
//   attempted: boolean;
//   onChange: (patch: Partial<VehicleFormRow>) => void;
//   onRemove: () => void;
//   canRemove: boolean;
// }) {
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   return (
//     <div
//       style={{
//         border: "1px solid #d2d6de",
//         borderRadius: 4,
//         padding: "14px 16px",
//         background: "#f9fafc",
//         marginBottom: 10,
//         position: "relative",
//       }}
//     >
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           marginBottom: 10,
//         }}
//       >
//         <span style={{ fontWeight: 700, fontSize: 13, color: "#3c8dbc" }}>
//           Vehicle #{index + 1}
//         </span>
//         {canRemove && (
//           <button
//             type="button"
//             onClick={onRemove}
//             style={{
//               background: "none",
//               border: "none",
//               color: "#e74c3c",
//               cursor: "pointer",
//               fontSize: 12,
//               fontWeight: 700,
//               padding: 0,
//             }}
//           >
//             ✕ Remove
//           </button>
//         )}
//       </div>

//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px" }}>
//         <div>
//           <label style={labelStyle}>
//             License Plate <span style={{ color: "#e73d3d" }}>*</span>
//           </label>
//           <input
//             style={inputStyle}
//             value={vehicle.licensePlateNo}
//             onChange={(e) => onChange({ licensePlateNo: e.target.value.slice(0, 14) })}
//             placeholder="e.g. ABC 1234"
//             maxLength={14}
//           />
//           <FieldError
//             text={attempted && !vehicle.licensePlateNo.trim() ? "License plate is required." : null}
//           />
//         </div>

//         <div>
//           <label style={labelStyle}>VIN No. (17 chars)</label>
//           <input
//             style={inputStyle}
//             value={vehicle.vinNo}
//             onChange={(e) => onChange({ vinNo: e.target.value.slice(0, 17).toUpperCase() })}
//             placeholder="17-character VIN"
//             maxLength={17}
//           />
//           <FieldError
//             text={
//               attempted && vehicle.vinNo && vehicle.vinNo.length !== 17
//                 ? "VIN must be exactly 17 characters."
//                 : null
//             }
//           />
//         </div>

//         <div>
//           <label style={labelStyle}>
//             Make / Brand <span style={{ color: "#e73d3d" }}>*</span>
//           </label>
//           <input
//             style={inputStyle}
//             value={vehicle.vehicleName}
//             onChange={(e) => onChange({ vehicleName: e.target.value })}
//             placeholder="e.g. Toyota"
//           />
//           <FieldError
//             text={attempted && !vehicle.vehicleName.trim() ? "Make is required." : null}
//           />
//         </div>

//         <div>
//           <label style={labelStyle}>
//             Model <span style={{ color: "#e73d3d" }}>*</span>
//           </label>
//           <input
//             style={inputStyle}
//             value={vehicle.model}
//             onChange={(e) => onChange({ model: e.target.value })}
//             placeholder="e.g. Camry"
//           />
//           <FieldError
//             text={attempted && !vehicle.model.trim() ? "Model is required." : null}
//           />
//         </div>

//         <div>
//           <label style={labelStyle}>
//             Year <span style={{ color: "#e73d3d" }}>*</span>
//           </label>
//           <input
//             style={inputStyle}
//             value={vehicle.year}
//             onChange={(e) => onChange({ year: e.target.value.replace(/\D/g, "").slice(0, 4) })}
//             placeholder="e.g. 2020"
//             maxLength={4}
//           />
//           <FieldError
//             text={
//               attempted && vehicle.year && !/^\d{4}$/.test(vehicle.year)
//                 ? "Enter a valid 4-digit year."
//                 : attempted && !vehicle.year.trim()
//                   ? "Year is required."
//                   : null
//             }
//           />
//         </div>

//         <div>
//           <label style={labelStyle}>Odometer (km)</label>
//           <input
//             style={inputStyle}
//             value={vehicle.odometerReading}
//             onChange={(e) => onChange({ odometerReading: e.target.value.replace(/\D/g, "") })}
//             placeholder="e.g. 45000"
//           />
//         </div>

//         <div style={{ gridColumn: "1 / -1" }}>
//           <label style={labelStyle}>Vehicle Image</label>
//           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//             {vehicle.vehicleImagePreview && (
//               <img
//                 src={vehicle.vehicleImagePreview}
//                 alt="vehicle"
//                 style={{
//                   width: 52,
//                   height: 52,
//                   objectFit: "cover",
//                   borderRadius: 3,
//                   border: "1px solid #d2d6de",
//                   flexShrink: 0,
//                 }}
//               />
//             )}
//             <input
//               ref={fileInputRef}
//               type="file"
//               accept="image/*"
//               style={{ display: "none" }}
//               onChange={(e) => {
//                 const file = e.target.files?.[0];
//                 if (!file) return;
//                 if (vehicle.vehicleImagePreview?.startsWith("blob:"))
//                   URL.revokeObjectURL(vehicle.vehicleImagePreview);
//                 onChange({
//                   vehicleImageFile: file,
//                   vehicleImagePreview: URL.createObjectURL(file),
//                 });
//               }}
//             />
//             <button
//               type="button"
//               onClick={() => fileInputRef.current?.click()}
//               style={{
//                 padding: "6px 14px",
//                 border: "1px solid #d2d6de",
//                 borderRadius: 3,
//                 background: "#fff",
//                 color: "#555",
//                 fontSize: 12,
//                 cursor: "pointer",
//               }}
//             >
//               {vehicle.vehicleImagePreview ? "Change Image" : "Upload Image"}
//             </button>
//             {vehicle.vehicleImagePreview && (
//               <button
//                 type="button"
//                 onClick={() => {
//                   if (vehicle.vehicleImagePreview?.startsWith("blob:"))
//                     URL.revokeObjectURL(vehicle.vehicleImagePreview);
//                   onChange({ vehicleImageFile: null, vehicleImagePreview: "" });
//                   if (fileInputRef.current) fileInputRef.current.value = "";
//                 }}
//                 style={{
//                   padding: "6px 10px",
//                   border: "1px solid #d2d6de",
//                   borderRadius: 3,
//                   background: "#fff",
//                   color: "#e74c3c",
//                   fontSize: 12,
//                   cursor: "pointer",
//                 }}
//               >
//                 Remove
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// const AddEditCarOwnerModal: React.FC<AddEditCarOwnerModalProps> = ({
//   isOpen,
//   onClose,
//   onSaved,
//   owner,
//   mode,
// }) => {
//   const isEdit = mode === "edit";

//   // Personal fields
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [dialCode, setDialCode] = useState("+1");
//   const [phone, setPhone] = useState("");
//   const [pincode, setPincode] = useState("");
//   const [address, setAddress] = useState("");
//   const [city, setCity] = useState("");
//   const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
//   const [profileImagePreview, setProfileImagePreview] = useState("");
//   const profileFileRef = useRef<HTMLInputElement>(null);

//   // Vehicles
//   const [vehicles, setVehicles] = useState<VehicleFormRow[]>([emptyVehicle()]);

//   // UI
//   const [submitting, setSubmitting] = useState(false);
//   const [attempted, setAttempted] = useState(false);
//   const [apiError, setApiError] = useState<string | null>(null);

//   // Populate on open for edit
//   useEffect(() => {
//     if (!isOpen) return;
//     setAttempted(false);
//     setApiError(null);

//     if (isEdit && owner) {
//       setName(owner.name || "");
//       setEmail(owner.email || "");
//       setDialCode(owner.countryCode || "+1");
//       setPhone(owner.phone || "");
//       setPincode(owner.pincode || "");
//       setAddress(owner.address || "");
//       setCity("");
//       setProfileImageFile(null);
//       setProfileImagePreview("");

//       const existingVehicles: VehicleFormRow[] = (owner.myVehicles || []).map((v) => ({
//         _id: v._id,
//         licensePlateNo: v.licensePlateNo || "",
//         vinNo: v.vinNo || "",
//         vehicleName:
//           typeof v.make === "object" && v.make ? v.make.name || "" : "",
//         model:
//           typeof v.make === "object" && v.make ? v.make.model || "" : "",
//         year: v.year ? String(v.year) : "",
//         odometerReading:
//           v.odometerReading !== undefined ? String(v.odometerReading) : "",
//         vehicleImageFile: null,
//         vehicleImagePreview:
//           Array.isArray(v.carImages) && v.carImages[0]
//             ? v.carImages[0].startsWith("http")
//               ? v.carImages[0]
//               : `${import.meta.env.VITE_UPLOADS_URL}/${v.carImages[0].replace(/^\/+/, "")}`
//             : "",
//       }));
//       setVehicles(existingVehicles.length ? existingVehicles : [emptyVehicle()]);
//     } else {
//       setName("");
//       setEmail("");
//       setDialCode("+1");
//       setPhone("");
//       setPincode("");
//       setAddress("");
//       setCity("");
//       setProfileImageFile(null);
//       setProfileImagePreview("");
//       setVehicles([emptyVehicle()]);
//     }
//   }, [isOpen, isEdit, owner]);

//   // Cleanup blob URLs on unmount
//   useEffect(() => {
//     return () => {
//       if (profileImagePreview?.startsWith("blob:"))
//         URL.revokeObjectURL(profileImagePreview);
//     };
//   }, [profileImagePreview]);

//   function updateVehicle(index: number, patch: Partial<VehicleFormRow>) {
//     setVehicles((prev) => {
//       const next = [...prev];
//       next[index] = { ...next[index], ...patch };
//       return next;
//     });
//   }

//   function removeVehicle(index: number) {
//     setVehicles((prev) => {
//       const current = prev[index];
//       if (current?.vehicleImagePreview?.startsWith("blob:"))
//         URL.revokeObjectURL(current.vehicleImagePreview);
//       return prev.filter((_, i) => i !== index);
//     });
//   }

//   function validate(): string | null {
//     if (!name.trim()) return "Name is required.";
//     if (name.trim().length > 20) return "Name must be at most 20 characters.";
//     if (!email.trim()) return "Email is required.";
//     if (!isValidEmail(email)) return "Enter a valid email address.";
//     if (!phone.trim()) return "Phone is required.";
//     const digits = phone.replace(/\D/g, "");
//     if (digits.length !== 10) return "Phone number must be 10 digits.";
//     if (!pincode.trim()) return "Zip code is required.";
//     if (address.trim().length > 50) return "Address must be at most 50 characters.";

//     for (const v of vehicles) {
//       const hasContent =
//         v.licensePlateNo.trim() ||
//         v.vehicleName.trim() ||
//         v.model.trim() ||
//         v.year.trim();
//       if (!hasContent) continue;
//       if (!v.licensePlateNo.trim()) return "Each vehicle needs a license plate.";
//       if (!v.vehicleName.trim()) return "Each vehicle needs a make/brand.";
//       if (!v.model.trim()) return "Each vehicle needs a model.";
//       if (!v.year.trim()) return "Each vehicle needs a year.";
//       if (!/^\d{4}$/.test(v.year)) return "Enter a valid 4-digit year.";
//       if (v.vinNo && v.vinNo.length !== 17) return "VIN must be exactly 17 characters.";
//     }
//     return null;
//   }


//   // Helpers for text/fields (could be moved outside)
//   function appendCustomerText(formData: FormData, key: string, value: any) {
//     if (value === undefined || value === null) return;
//     formData.append(key, String(value));
//   }

//   function isUploadableFile(file: any) {
//     return file && (file instanceof File || file instanceof Blob);
//   }

//   const MAX_ONBOARD_VEHICLES = 5; // You can change this as needed

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setAttempted(true);
//     const err = validate();
//     if (err) {
//       setApiError(err);
//       return;
//     }
//     setApiError(null);

//     // Prepare fields as per the new format
//     const filledVehicles = vehicles
//       .filter(
//         (v) =>
//           v.licensePlateNo.trim() ||
//           v.vehicleName.trim() ||
//           v.model.trim() ||
//           v.year.trim()
//       )
//       .map((v) => ({
//         ...(v._id ? { _id: v._id } : {}),
//         licensePlateNo: v.licensePlateNo.trim(),
//         vinNo: v.vinNo.trim(),
//         vehicleName: v.vehicleName.trim(),
//         model: v.model.trim(),
//         year: v.year.trim(),
//         odometerReading: v.odometerReading.trim(),
//       }));

//     // Compose a field object for easier handling with helpers
//     const fields: any = {
//       carOwnerId: isEdit && owner ? owner._id : undefined,
//       name: name.trim(),
//       email: email.trim(),
//       countryCode: dialCode,
//       phone: phone.replace(/\D/g, ""),
//       pincode: pincode.trim().replace(/\s/g, "").toUpperCase(),
//       address: address.trim().slice(0, 50),
//       city: city.trim() ? city.trim() : undefined,
//       role: !isEdit ? "carowner" : undefined,
//       vehicles: filledVehicles,
//     };

//     // Gather all vehicle image files in order
//     const vehicleImageFiles = vehicles.map((v) => v.vehicleImageFile);

//     const formData = new FormData();

//     if (fields.carOwnerId) appendCustomerText(formData, "carOwnerId", fields.carOwnerId);
//     appendCustomerText(formData, "name", fields.name);
//     appendCustomerText(formData, "email", fields.email);
//     appendCustomerText(formData, "countryCode", fields.countryCode);
//     appendCustomerText(formData, "phone", fields.phone);
//     appendCustomerText(formData, "pincode", fields.pincode);
//     appendCustomerText(formData, "address", fields.address);
//     if (fields.city) appendCustomerText(formData, "city", fields.city);
//     if (fields.role) appendCustomerText(formData, "role", fields.role);

//     const vehicleList = (fields.vehicles ?? []).slice(0, MAX_ONBOARD_VEHICLES);
//     formData.append("vehicles", JSON.stringify(vehicleList));

//     if (isUploadableFile(profileImageFile) && profileImageFile !== null) {
//       const imgName = profileImageFile.name || "profile-image.jpg";
//       formData.append("profilePhoto", profileImageFile, imgName);
//     }


//     for (let i = 0; i < vehicleList.length && i < MAX_ONBOARD_VEHICLES; i++) {
//       const file = vehicleImageFiles[i];
//       if (!isUploadableFile(file) || file === null) continue;
//       const imgName = file.name || `vehicle-image-${i}.jpg`;
//       formData.append(`carImage_${i}`, file as Blob, imgName);
//     }

//     setSubmitting(true);
//     try {
//       const token = localStorage.getItem("admin-token");
//       const headers: Record<string, string> = {};
//       if (token) headers["Authorization"] = token;

//       if (isEdit) {
//         await axios.put(
//           `${import.meta.env.VITE_API_URL}/api/admin/my-customers`,
//           formData,
//           { headers }
//         );
//       } else {
//         await axios.post(
//           `${import.meta.env.VITE_API_URL}/api/admin/onboard-carowner`,
//           formData,
//           { headers }
//         );
//       }
//       onSaved();
//       onClose();
//     } catch (err: any) {
//       setApiError(
//         err?.response?.data?.message ||
//           (isEdit ? "Could not update car owner." : "Could not add car owner.")
//       );
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   if (!isOpen) return null;

//   return (
//     <div
//       style={{
//         position: "fixed",
//         inset: 0,
//         zIndex: 1000,
//         display: "flex",
//         alignItems: "flex-start",
//         justifyContent: "center",
//         background: "rgba(0,0,0,0.48)",
//         overflowY: "auto",
//         padding: "30px 12px",
//       }}
//     >
//       <div
//         style={{
//           background: "#fff",
//           borderRadius: 4,
//           width: "min(960px, 96vw)",
//           boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
//           display: "flex",
//           flexDirection: "column",
//         }}
//       >
//         {/* Header */}
//         <div
//           style={{
//             background: "#3c8dbc",
//             color: "#fff",
//             padding: "13px 20px",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             borderRadius: "4px 4px 0 0",
//             flexShrink: 0,
//           }}
//         >
//           <span style={{ fontWeight: 700, fontSize: 16 }}>
//             {isEdit ? "✏️ Edit Car Owner" : "➕ Add New Car Owner"}
//           </span>
//           <button
//             onClick={onClose}
//             disabled={submitting}
//             type="button"
//             style={{
//               background: "none",
//               border: "none",
//               color: "#fff",
//               fontSize: 22,
//               cursor: "pointer",
//               padding: "0 4px",
//               lineHeight: 1,
//             }}
//           >
//             ×
//           </button>
//         </div>

//         {/* Body */}
//         <form onSubmit={handleSubmit} style={{ padding: "22px 24px" }}>
//           {/* ── Personal Info ── */}
//           <div
//             style={{
//               fontSize: 13,
//               fontWeight: 700,
//               color: "#3c8dbc",
//               borderBottom: "2px solid #3c8dbc",
//               paddingBottom: 6,
//               marginBottom: 16,
//               textTransform: "uppercase",
//               letterSpacing: "0.06em",
//             }}
//           >
//             Personal Information
//           </div>

//           {/* Profile photo row */}
//           <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
//             <div
//               style={{
//                 width: 60,
//                 height: 60,
//                 borderRadius: "50%",
//                 border: "2px solid #d2d6de",
//                 background: "#e3f2fd",
//                 overflow: "hidden",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 flexShrink: 0,
//               }}
//             >
//               {profileImagePreview ? (
//                 <img
//                   src={profileImagePreview}
//                   alt="profile"
//                   style={{ width: "100%", height: "100%", objectFit: "cover" }}
//                 />
//               ) : (
//                 <span style={{ fontSize: 22, color: "#90caf9", fontWeight: 700 }}>?</span>
//               )}
//             </div>
//             <div>
//               <label style={labelStyle}>Profile Photo</label>
//               <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
//                 <input
//                   ref={profileFileRef}
//                   type="file"
//                   accept="image/*"
//                   style={{ display: "none" }}
//                   onChange={(e) => {
//                     const file = e.target.files?.[0];
//                     if (!file) return;
//                     if (profileImagePreview?.startsWith("blob:"))
//                       URL.revokeObjectURL(profileImagePreview);
//                     setProfileImageFile(file);
//                     setProfileImagePreview(URL.createObjectURL(file));
//                   }}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => profileFileRef.current?.click()}
//                   style={{
//                     padding: "6px 14px",
//                     border: "1px solid #d2d6de",
//                     borderRadius: 3,
//                     background: "#fff",
//                     color: "#555",
//                     fontSize: 12,
//                     cursor: "pointer",
//                   }}
//                 >
//                   {profileImagePreview ? "Change Photo" : "Upload Photo"}
//                 </button>
//                 {profileImagePreview && (
//                   <button
//                     type="button"
//                     onClick={() => {
//                       if (profileImagePreview?.startsWith("blob:"))
//                         URL.revokeObjectURL(profileImagePreview);
//                       setProfileImageFile(null);
//                       setProfileImagePreview("");
//                       if (profileFileRef.current) profileFileRef.current.value = "";
//                     }}
//                     style={{
//                       padding: "6px 10px",
//                       border: "1px solid #d2d6de",
//                       borderRadius: 3,
//                       background: "#fff",
//                       color: "#e74c3c",
//                       fontSize: 12,
//                       cursor: "pointer",
//                     }}
//                   >
//                     Remove
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Field grid */}
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "1fr 1fr",
//               gap: "12px 20px",
//               marginBottom: 20,
//             }}
//           >
//             {/* Name */}
//             <div>
//               <label style={labelStyle}>
//                 Full Name <span style={{ color: "#e73d3d" }}>*</span>
//               </label>
//               <input
//                 style={inputStyle}
//                 value={name}
//                 onChange={(e) => setName(e.target.value.slice(0, 20))}
//                 placeholder="Enter full name"
//                 maxLength={20}
//               />
//               <FieldError text={attempted && !name.trim() ? "Name is required." : null} />
//             </div>

//             {/* Email */}
//             <div>
//               <label style={labelStyle}>
//                 Email Address <span style={{ color: "#e73d3d" }}>*</span>
//               </label>
//               <input
//                 style={inputStyle}
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="Enter email address"
//               />
//               <FieldError
//                 text={
//                   attempted && !email.trim()
//                     ? "Email is required."
//                     : email.trim() && !isValidEmail(email)
//                       ? "Enter a valid email."
//                       : null
//                 }
//               />
//             </div>

//             {/* Phone */}
//             <div>
//               <label style={labelStyle}>
//                 Phone Number <span style={{ color: "#e73d3d" }}>*</span>
//               </label>
//               <div style={{ display: "flex", gap: 6 }}>
//                 <select
//                   value={dialCode}
//                   onChange={(e) => setDialCode(e.target.value)}
//                   style={{ ...inputStyle, width: 100, flexShrink: 0 }}
//                 >
//                   {CALLING_CODES.map((c) => (
//                     <option key={c.id + c.code} value={c.code}>
//                       {c.flag} {c.code}
//                     </option>
//                   ))}
//                 </select>
//                 <input
//                   style={{ ...inputStyle, flex: 1 }}
//                   type="tel"
//                   value={phone}
//                   onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
//                   placeholder="10-digit number"
//                   maxLength={10}
//                 />
//               </div>
//               <FieldError
//                 text={
//                   attempted && phone.replace(/\D/g, "").length !== 10
//                     ? "Phone must be 10 digits."
//                     : null
//                 }
//               />
//             </div>

//             {/* Zip Code */}
//             <div>
//               <label style={labelStyle}>
//                 Zip / Postal Code <span style={{ color: "#e73d3d" }}>*</span>
//               </label>
//               <input
//                 style={inputStyle}
//                 value={pincode}
//                 onChange={(e) => setPincode(e.target.value.slice(0, 10))}
//                 placeholder="e.g. A1A 1A1"
//               />
//               <FieldError text={attempted && !pincode.trim() ? "Zip code is required." : null} />
//             </div>

//             {/* City */}
//             <div>
//               <label style={labelStyle}>City</label>
//               <input
//                 style={inputStyle}
//                 value={city}
//                 onChange={(e) => setCity(e.target.value)}
//                 placeholder="Enter city"
//               />
//             </div>

//             {/* Role (read-only) */}
//             <div>
//               <label style={labelStyle}>Role</label>
//               <div
//                 style={{
//                   ...inputStyle,
//                   background: "#f5f6f8",
//                   color: "#888",
//                   fontWeight: 600,
//                   cursor: "default",
//                 }}
//               >
//                 carowner
//               </div>
//             </div>

//             {/* Address */}
//             <div style={{ gridColumn: "1 / -1" }}>
//               <label style={labelStyle}>Address</label>
//               <textarea
//                 style={{
//                   ...inputStyle,
//                   minHeight: 66,
//                   resize: "vertical",
//                   fontFamily: "inherit",
//                 }}
//                 value={address}
//                 onChange={(e) => setAddress(e.target.value.slice(0, 50))}
//                 placeholder="Enter full address (max 50 chars)"
//                 rows={2}
//                 maxLength={50}
//               />
//             </div>
//           </div>

//           {/* ── Vehicles ── */}
//           <div
//             style={{
//               fontSize: 13,
//               fontWeight: 700,
//               color: "#3c8dbc",
//               borderBottom: "2px solid #3c8dbc",
//               paddingBottom: 6,
//               marginBottom: 14,
//               textTransform: "uppercase",
//               letterSpacing: "0.06em",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "space-between",
//             }}
//           >
//             <span>Vehicles</span>
//             {vehicles.length < 5 && (
//               <button
//                 type="button"
//                 onClick={() => setVehicles((v) => [...v, emptyVehicle()])}
//                 style={{
//                   fontSize: 12,
//                   background: "#3c8dbc",
//                   color: "#fff",
//                   border: "none",
//                   borderRadius: 3,
//                   padding: "4px 12px",
//                   cursor: "pointer",
//                   fontWeight: 600,
//                   textTransform: "none",
//                   letterSpacing: 0,
//                 }}
//               >
//                 + Add Vehicle
//               </button>
//             )}
//           </div>

//           {vehicles.map((v, i) => (
//             <VehicleRow
//               key={i}
//               vehicle={v}
//               index={i}
//               attempted={attempted}
//               onChange={(patch) => updateVehicle(i, patch)}
//               onRemove={() => removeVehicle(i)}
//               canRemove={vehicles.length > 1}
//             />
//           ))}

//           {/* API Error */}
//           {apiError && (
//             <div
//               style={{
//                 marginTop: 12,
//                 padding: "9px 14px",
//                 background: "#fdf3f2",
//                 border: "1px solid #f5c6cb",
//                 borderRadius: 3,
//                 color: "#c0392b",
//                 fontSize: 13,
//               }}
//             >
//               {apiError}
//             </div>
//           )}

//           {/* Footer buttons */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "flex-end",
//               gap: 10,
//               marginTop: 20,
//               paddingTop: 16,
//               borderTop: "1px solid #f4f4f4",
//             }}
//           >
//             <button
//               type="button"
//               onClick={onClose}
//               disabled={submitting}
//               style={{
//                 padding: "8px 22px",
//                 borderRadius: 3,
//                 border: "1px solid #d2d6de",
//                 background: "#fff",
//                 color: "#555",
//                 fontSize: 14,
//                 cursor: submitting ? "not-allowed" : "pointer",
//               }}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={submitting}
//               style={{
//                 padding: "8px 26px",
//                 borderRadius: 3,
//                 border: "none",
//                 background: submitting ? "#aaa" : "#00a65a",
//                 color: "#fff",
//                 fontSize: 14,
//                 fontWeight: 700,
//                 cursor: submitting ? "not-allowed" : "pointer",
//               }}
//             >
//               {submitting
//                 ? "Saving…"
//                 : isEdit
//                   ? "Save Changes"
//                   : "Add Car Owner"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// // --- Derive autoshops from jobCards ---
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

// // --- Export helpers ---
// function vehicleDetailsString(vehicles?: VehicleType[]): string {
//   if (!vehicles || !vehicles.length) return "-";
//   return vehicles
//     .map(
//       (v) =>
//         `${v.licensePlateNo || "-"} (${
//           typeof v.make === "object" && v.make ? v.make.name || "-" : "-"
//         }, ${
//           typeof v.make === "object" && v.make ? v.make.model || "-" : "-"
//         }, ${v.year || "-"})`
//     )
//     .join("\n");
// }
// function shopsString(shops?: BusinessProfileType[]): string {
//   if (!shops || !shops.length) return "-";
//   return shops
//     .map(
//       (s) =>
//         `${s.businessName || "-"}${s.businessPhone ? " (" + s.businessPhone + ")" : ""}`
//     )
//     .join("\n");
// }
// function jobCardsString(jobCards?: JobCardTypePopulated[]): string {
//   if (!jobCards || !jobCards.length) return "-";
//   return jobCards
//     .map((jc) => ((jc as any).jobNo ? String((jc as any).jobNo) : jc._id))
//     .join("\n");
// }
// function getOwnerColValue(owner: CarOwnerType, key: string): string {
//   switch (key) {
//     case "name":        return owner.name || "-";
//     case "email":       return owner.email || "-";
//     case "phone":       return owner.phone || "-";
//     case "countryCode": return owner.countryCode || "-";
//     case "address":     return owner.address || "-";
//     case "pincode":     return owner.pincode || "-";
//     case "profileComplete": return owner.isProfileComplete ? "Yes" : "No";
//     case "disabled":    return owner.isDisabled ? "Yes" : "No";
//     case "vehicles":    return vehicleDetailsString(owner.myVehicles);
//     case "servicedAutoShops":
//       return shopsString(
//         owner.autoshopsReceivedServiceFrom ?? getAutoshopsReceivedServiceFrom(owner)
//       );
//     case "jobCards":    return jobCardsString(owner.jobCards);
//     default:            return "-";
//   }
// }
// function toCsv(data: string[][], headers: string[]): string {
//   const esc = (val: any) => {
//     if (val == null) return "";
//     let s = String(val);
//     if (/[,"\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
//     return s;
//   };
//   return (
//     headers.map(esc).join(",") +
//     "\n" +
//     data.map((row) => row.map(esc).join(",")).join("\n")
//   );
// }
// function downloadAsCsvFile(filename: string, content: string) {
//   const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   a.click();
//   setTimeout(() => URL.revokeObjectURL(url), 2000);
// }

// // ─── MODAL (AdminLTE style) ───────────────────────────────────────────────────
// type ModalProps = {
//   isOpen: boolean;
//   onClose: () => void;
//   title: string;
//   children: React.ReactNode;
//   wide?: boolean;
// };

// const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, wide }) => {
//   if (!isOpen) return null;
//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center"
//       style={{ background: "rgba(0,0,0,0.45)" }}
//     >
//       <div
//         style={{
//           background: "#fff",
//           borderRadius: 4,
//           width: wide ? "min(900px, 96vw)" : "min(720px, 94vw)",
//           maxHeight: "88vh",
//           display: "flex",
//           flexDirection: "column",
//           boxShadow: "0 5px 15px rgba(0,0,0,.5)",
//         }}
//       >
//         <div
//           style={{
//             background: "#3c8dbc",
//             color: "#fff",
//             padding: "10px 16px",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             borderRadius: "4px 4px 0 0",
//             flexShrink: 0,
//           }}
//         >
//           <span style={{ fontWeight: 600, fontSize: 16 }}>{title}</span>
//           <button
//             onClick={onClose}
//             style={{
//               background: "none",
//               border: "none",
//               color: "#fff",
//               fontSize: 22,
//               lineHeight: 1,
//               cursor: "pointer",
//               padding: "0 2px",
//             }}
//             aria-label="Close"
//             type="button"
//           >
//             ×
//           </button>
//         </div>
//         <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
//           {children}
//         </div>
//       </div>
//     </div>
//   );
// };

// // ─── EXPORT COLUMNS MODAL ────────────────────────────────────────────────────
// const ExportColumnsModal: React.FC<{
//   isOpen: boolean;
//   onClose: () => void;
//   selectedOwnerIds: string[];
//   owners: CarOwnerType[];
// }> = ({ isOpen, onClose, selectedOwnerIds, owners }) => {
//   const [selectedCols, setSelectedCols] = useState<string[]>(
//     ALL_EXPORT_COLUMNS.map((c) => c.key)
//   );
//   useEffect(() => {
//     if (isOpen) setSelectedCols(ALL_EXPORT_COLUMNS.map((c) => c.key));
//   }, [isOpen]);
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
//     if (!selectedCols.length) {
//       alert("Please select at least one column.");
//       return;
//     }
//     const orderedCols = ALL_EXPORT_COLUMNS.filter((c) => selectedCols.includes(c.key));
//     const headers = orderedCols.map((c) => c.label);
//     const dataToExport = owners.filter((o) => selectedOwnerIds.includes(o._id));
//     const rows = dataToExport.map((owner) =>
//       orderedCols.map((c) => getOwnerColValue(owner, c.key))
//     );
//     downloadAsCsvFile(
//       `car-owners-${new Date().toISOString().slice(0, 10)}.csv`,
//       toCsv(rows, headers)
//     );
//     onClose();
//   };
//   if (!isOpen) return null;
//   return (
//     <Modal isOpen={isOpen} onClose={onClose} title="Select Columns to Export">
//       <div style={{ marginBottom: 14 }}>
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             marginBottom: 10,
//           }}
//         >
//           <span style={{ fontSize: 13, color: "#555" }}>
//             Exporting <strong>{selectedOwnerIds.length}</strong> row
//             {selectedOwnerIds.length !== 1 ? "s" : ""}
//           </span>
//           <button
//             type="button"
//             onClick={toggleAll}
//             style={{
//               fontSize: 12,
//               color: "#0073b7",
//               background: "none",
//               border: "none",
//               cursor: "pointer",
//               textDecoration: "underline",
//               padding: 0,
//             }}
//           >
//             {allSelected ? "Deselect All" : "Select All"}
//           </button>
//         </div>
//         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
//           {ALL_EXPORT_COLUMNS.map((col) => (
//             <label
//               key={col.key}
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 8,
//                 cursor: "pointer",
//                 fontSize: 13,
//                 color: "#333",
//                 padding: "6px 10px",
//                 borderRadius: 3,
//                 background: selectedCols.includes(col.key) ? "#f0f7ff" : "#fafafa",
//                 border: `1px solid ${selectedCols.includes(col.key) ? "#0073b7" : "#d2d6de"}`,
//                 transition: "all 0.15s",
//               }}
//             >
//               <input
//                 type="checkbox"
//                 checked={selectedCols.includes(col.key)}
//                 onChange={() => toggleCol(col.key)}
//                 style={{
//                   accentColor: "#0073b7",
//                   width: 14,
//                   height: 14,
//                   cursor: "pointer",
//                   flexShrink: 0,
//                 }}
//               />
//               {col.label}
//             </label>
//           ))}
//         </div>
//       </div>
//       {selectedCols.length === 0 && (
//         <div
//           style={{
//             color: "#c0392b",
//             fontSize: 12,
//             marginBottom: 10,
//             background: "#fdf3f2",
//             border: "1px solid #f5c6cb",
//             borderRadius: 3,
//             padding: "6px 10px",
//           }}
//         >
//           Please select at least one column to export.
//         </div>
//       )}
//       <div
//         style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}
//       >
//         <button
//           type="button"
//           onClick={onClose}
//           style={{
//             padding: "7px 18px",
//             borderRadius: 3,
//             border: "1px solid #d2d6de",
//             background: "#fff",
//             color: "#444",
//             fontSize: 13,
//             cursor: "pointer",
//           }}
//         >
//           Cancel
//         </button>
//         <button
//           type="button"
//           onClick={handleExport}
//           disabled={selectedCols.length === 0}
//           style={{
//             padding: "7px 20px",
//             borderRadius: 3,
//             border: "none",
//             background: selectedCols.length === 0 ? "#aaa" : "#00a65a",
//             color: "#fff",
//             fontSize: 13,
//             fontWeight: 600,
//             cursor: selectedCols.length === 0 ? "not-allowed" : "pointer",
//           }}
//         >
//           ↓ Export {selectedCols.length} Column{selectedCols.length !== 1 ? "s" : ""}
//         </button>
//       </div>
//     </Modal>
//   );
// };

// // ─── SEND NOTIFICATION MODAL ──────────────────────────────────────────────────
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
//       const res = await axios.post(
//         `${import.meta.env.VITE_API_URL}/api/admin/notification/custom/send`,
//         { userType: "carOwner", userIds: selectedOwnerIds, title, message: body }
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
//   if (!isOpen) return null;
//   return (
//     <Modal isOpen={isOpen} onClose={onClose} title="Send Custom Notification">
//       <form onSubmit={handleSubmit}>
//         <div style={{ marginBottom: 14 }}>
//           <label
//             style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}
//           >
//             Notification Title <span style={{ color: "#e73d3d" }}>*</span>
//           </label>
//           <input
//             style={{
//               width: "100%",
//               border: "1px solid #d2d6de",
//               borderRadius: 3,
//               padding: "7px 10px",
//               fontSize: 14,
//               outline: "none",
//               boxSizing: "border-box",
//             }}
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//             maxLength={100}
//             required
//             disabled={sending}
//             placeholder="Title for push notification"
//           />
//         </div>
//         <div style={{ marginBottom: 14 }}>
//           <label
//             style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}
//           >
//             Notification Body <span style={{ color: "#e73d3d" }}>*</span>
//           </label>
//           <textarea
//             style={{
//               width: "100%",
//               border: "1px solid #d2d6de",
//               borderRadius: 3,
//               padding: "7px 10px",
//               fontSize: 14,
//               outline: "none",
//               resize: "vertical",
//               boxSizing: "border-box",
//               minHeight: 90,
//             }}
//             value={body}
//             onChange={(e) => setBody(e.target.value)}
//             rows={4}
//             maxLength={1000}
//             required
//             disabled={sending}
//             placeholder="Notification message to send"
//           />
//         </div>
//         <div style={{ fontSize: 13, color: "#2575c4", marginBottom: 10 }}>
//           To:{" "}
//           <strong>
//             {selectedOwnerIds.length} car owner
//             {selectedOwnerIds.length !== 1 ? "s" : ""} selected
//           </strong>
//         </div>
//         {error && (
//           <div
//             style={{
//               color: "#c0392b",
//               fontSize: 13,
//               marginBottom: 10,
//               background: "#fdf3f2",
//               border: "1px solid #f5c6cb",
//               borderRadius: 3,
//               padding: "7px 10px",
//             }}
//           >
//             {error}
//           </div>
//         )}
//         {success && (
//           <div
//             style={{
//               color: "#27ae60",
//               fontSize: 13,
//               marginBottom: 10,
//               background: "#f0fff4",
//               border: "1px solid #c3e6cb",
//               borderRadius: 3,
//               padding: "7px 10px",
//             }}
//           >
//             {success}
//           </div>
//         )}
//         <div
//           style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}
//         >
//           <button
//             type="button"
//             onClick={onClose}
//             disabled={sending}
//             style={{
//               padding: "7px 18px",
//               borderRadius: 3,
//               border: "1px solid #d2d6de",
//               background: "#fff",
//               color: "#444",
//               fontSize: 13,
//               cursor: "pointer",
//             }}
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             disabled={sending}
//             style={{
//               padding: "7px 20px",
//               borderRadius: 3,
//               border: "none",
//               background: sending ? "#aaa" : "#00a65a",
//               color: "#fff",
//               fontSize: 13,
//               fontWeight: 600,
//               cursor: sending ? "not-allowed" : "pointer",
//             }}
//           >
//             {sending ? "Sending…" : "Send Notification"}
//           </button>
//         </div>
//       </form>
//     </Modal>
//   );
// };

// // --- Shop helpers (unchanged) ---
// function processOpenDays(openDays: string[] | undefined): string {
//   if (!openDays) return "-";
//   try {
//     let val = openDays;
//     if (typeof val[0] === "string" && val[0].includes("["))
//       val = JSON.parse(openDays[0]);
//     if (
//       Array.isArray(val) &&
//       typeof val[0] === "string" &&
//       (val[0] as string).includes("[")
//     )
//       val = JSON.parse(val[0]);
//     if (Array.isArray(val)) {
//       const flat = (val as any[]).flat(Infinity).filter(Boolean);
//       return flat.join(", ");
//     }
//     return Array.isArray(val) ? (val as string[]).join(", ") : "-";
//   } catch {
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
//   if (shop.myServices && Array.isArray(shop.myServices) && shop.myServices.length > 0) {
//     services = shop.myServices.map((s: any) => {
//       if (typeof s === "string") return s;
//       if (typeof s === "object") {
//         if (typeof s.serviceName === "string" && !!s.serviceName.trim())
//           return s.serviceName;
//         if (typeof s?.name === "string" && !!s.name.trim()) return s.name;
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
//     phone, businessName, address, city, openHours, openDays, isOpen,
//     services, rating, reviewCount, reviewDate, websiteUrl, directionsUrl, imageUrl, isFav,
//   };
// }

// const HeartIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     viewBox="0 0 24 24"
//     width="20"
//     height="20"
//     fill={filled ? "#ef4444" : "none"}
//     stroke="#ef4444"
//     strokeWidth={2}
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
//   </svg>
// );

// function ShopOverviewCard(shop: BusinessProfileType) {
//   const {
//     phone, businessName, address, city, openHours, openDays, isOpen,
//     services, rating, reviewCount, reviewDate, websiteUrl, directionsUrl, imageUrl, isFav,
//   } = toShopOverviewProps(shop);
//   const servicesToShow = (
//     services && services.length > 0
//       ? services
//       : [
//           "General Repair",
//           "Diagnose - Paccer",
//           "Diagnose - Communis",
//           "Safety On-line",
//           "Oil Change",
//           "Brake Service",
//         ]
//   ).slice(0, 6);
//   return (
//     <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] relative">
//       <div
//         className="grid border-b border-slate-200"
//         style={{
//           gridTemplateColumns:
//             "minmax(0,1.15fr) minmax(0,0.72fr) minmax(0,0.72fr) minmax(0,1.65fr) minmax(52px,0.30fr)",
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
//               className={`h-2 w-2 shrink-0 rounded-full ${isOpen ? "bg-emerald-500" : "bg-red-500"}`}
//             />
//             <span
//               className={`whitespace-nowrap text-[12px] font-semibold ${isOpen ? "text-emerald-700" : "text-red-600"}`}
//             >
//               {isOpen ? "OPEN NOW" : "CLOSED"}
//             </span>
//           </div>
//           <div className="text-right text-[11px] leading-snug text-slate-500">
//             <div>{openDays}</div>
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
//             "minmax(120px,150px) minmax(0,1.25fr) minmax(0,1.1fr) minmax(100px,118px)",
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
//             style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}
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
//         style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1.6fr) minmax(0,1fr)" }}
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

// const renderServicedShopsModalContent = (owner: CarOwnerType) => {
//   const shops = owner.autoshopsReceivedServiceFrom ?? [];
//   return (
//     <>
//       <div
//         style={{
//           marginBottom: 16,
//           padding: "10px 14px",
//           background: "#f8f9fa",
//           border: "1px solid #d2d6de",
//           borderRadius: 3,
//         }}
//       >
//         <div style={{ fontSize: 13 }}>
//           <span style={{ fontWeight: 600 }}>Owner Email:</span>{" "}
//           <span style={{ color: "#555" }}>{owner.email || "-"}</span>
//         </div>
//         <div style={{ fontSize: 13, marginTop: 4 }}>
//           <span style={{ fontWeight: 600 }}>Onboarded By:</span>{" "}
//           <span style={{ color: "#555" }}>
//             {owner.onboardedBy
//               ? owner.onboardedBy.name
//                 ? `${owner.onboardedBy.name}${
//                     owner.onboardedBy.email ? ` (${owner.onboardedBy.email})` : ""
//                   }`
//                 : owner.onboardedBy.email
//               : "-"}
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
//         <div style={{ textAlign: "center", color: "#aaa", padding: "30px 0" }}>
//           No auto shops found for this owner.
//         </div>
//       )}
//     </>
//   );
// };

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
//   if (!images.length)
//     return (
//       <div style={{ fontSize: 12, color: "#aaa", fontStyle: "italic" }}>No images</div>
//     );
//   return (
//     <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
//       {images.map((img, idx) =>
//         img.src ? (
//           <div
//             key={idx}
//             style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
//           >
//             <img
//               src={img.src}
//               alt={img.label}
//               style={{
//                 width: 64,
//                 height: 64,
//                 objectFit: "cover",
//                 borderRadius: 3,
//                 border: "1px solid #d2d6de",
//               }}
//               loading="lazy"
//             />
//             <span style={{ fontSize: 11, marginTop: 3, color: "#888" }}>{img.label}</span>
//           </div>
//         ) : null
//       )}
//     </div>
//   );
// }

// function getMake(vehicle: VehicleType): string {
//   if (!vehicle.make) return "-";
//   if (typeof vehicle.make === "object" && vehicle.make !== null)
//     return vehicle.make.name || "-";
//   return typeof vehicle.make === "string" ? vehicle.make : "-";
// }
// function getModel(vehicle: VehicleType): string {
//   if (!vehicle.make) return "-";
//   if (typeof vehicle.make === "object" && vehicle.make !== null)
//     return vehicle.make.model || "-";
//   return (vehicle as any).model || "-";
// }

// const renderVehiclesModalContent = (owner: CarOwnerType) => (
//   <>
//     {owner.myVehicles && owner.myVehicles.length > 0 ? (
//       <ul
//         style={{
//           listStyle: "none",
//           padding: 0,
//           margin: 0,
//           display: "flex",
//           flexDirection: "column",
//           gap: 12,
//         }}
//       >
//         {owner.myVehicles.map((vehicle) => (
//           <li
//             key={vehicle._id}
//             style={{
//               border: "1px solid #d2d6de",
//               borderRadius: 3,
//               padding: "12px 16px",
//               background: "#f8f9fa",
//             }}
//           >
//             <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
//               {vehicle.year || "-"} {getMake(vehicle)} {getModel(vehicle)}
//             </div>
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
//                 gap: "6px 16px",
//                 fontSize: 12,
//                 color: "#555",
//                 marginBottom: 8,
//               }}
//             >
//               <div>
//                 <span style={{ fontWeight: 600 }}>License Plate:</span>{" "}
//                 {vehicle.licensePlateNo || "-"}
//               </div>
//               <div>
//                 <span style={{ fontWeight: 600 }}>Odometer:</span>{" "}
//                 {vehicle.odometerReading !== undefined ? vehicle.odometerReading : "-"}
//               </div>
//               <div>
//                 <span style={{ fontWeight: 600 }}>VIN No.:</span> {vehicle.vinNo || "-"}
//               </div>
//               <div>
//                 <span style={{ fontWeight: 600 }}>Created:</span>{" "}
//                 {vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleString() : "-"}
//               </div>
//               <div>
//                 <span style={{ fontWeight: 600 }}>Updated:</span>{" "}
//                 {vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleString() : "-"}
//               </div>
//             </div>
//             {renderVehicleImages(vehicle)}
//           </li>
//         ))}
//       </ul>
//     ) : (
//       <div style={{ textAlign: "center", color: "#aaa", padding: "30px 0" }}>
//         No vehicles found.
//       </div>
//     )}
//   </>
// );

// function renderCustomerSummary(customer: any) {
//   return customer
//     ? `${customer.name ?? "-"}${customer.email ? ` (${customer.email})` : ""}`
//     : "-";
// }

// function renderJobCardServices(services: any[]) {
//   if (!services || !services.length)
//     return <span style={{ color: "#aaa" }}>-</span>;
//   return (
//     <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
//       {services.map((service, idx) => (
//         <li
//           key={service.id?._id ?? idx}
//           style={{
//             borderBottom: "1px solid #eee",
//             paddingBottom: 8,
//             marginBottom: 8,
//             fontSize: 12,
//           }}
//         >
//           {service.id ? (
//             <div>
//               <div>
//                 <span style={{ fontWeight: 600 }}>Service:</span> {service.id.name}
//               </div>
//               {service.id.desc && <div style={{ color: "#777" }}>{service.id.desc}</div>}
//             </div>
//           ) : (
//             "-"
//           )}
//           {service.subServices && service.subServices.length > 0 && (
//             <div style={{ marginLeft: 10, marginTop: 4 }}>
//               <span style={{ fontWeight: 600, fontSize: 11 }}>Sub-Services:</span>
//               <ul style={{ listStyleType: "circle", marginLeft: 16, fontSize: 11 }}>
//                 {service.subServices.map((sub: any, j: number) => (
//                   <li key={sub.id || j}>
//                     {typeof sub.price === "number" && <>Price: ₹{sub.price}</>}
//                     {typeof sub.discountedPrice === "number" && (
//                       <> | Discounted: ₹{sub.discountedPrice}</>
//                     )}
//                     {typeof sub.discountAmount === "number" && (
//                       <> | Discount: ₹{sub.discountAmount}</>
//                     )}
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
//     <div
//       style={{
//         border: "1px solid #d2d6de",
//         borderRadius: 3,
//         overflow: "hidden",
//         background: "#fff",
//       }}
//     >
//       <button
//         onClick={onToggle}
//         type="button"
//         aria-expanded={isOpen}
//         style={{
//           width: "100%",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           padding: "12px 16px",
//           background: isOpen ? "#3c8dbc" : "#f4f4f4",
//           color: isOpen ? "#fff" : "#333",
//           border: "none",
//           cursor: "pointer",
//           borderBottom: isOpen ? "1px solid #d2d6de" : "none",
//           textAlign: "left",
//         }}
//       >
//         <span style={{ fontWeight: 700, fontSize: 14 }}>Job Card #{idx + 1}</span>
//         <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
//           <span style={{ fontSize: 12 }}>
//             Payment:{" "}
//             <span
//               style={{
//                 fontWeight: 700,
//                 color: isOpen
//                   ? "#fff"
//                   : (card as any).paymentStatus === "PAID"
//                     ? "#27ae60"
//                     : "#e74c3c",
//               }}
//             >
//               {(card as any).paymentStatus}
//             </span>
//           </span>
//           <span style={{ fontSize: 12 }}>
//             Total:{" "}
//             <span style={{ fontWeight: 700 }}>₹{(card as any).totalPayableAmount}</span>
//           </span>
//           <span style={{ fontSize: 16, fontWeight: 700 }}>{isOpen ? "▲" : "▼"}</span>
//         </div>
//       </button>
//       {isOpen && (
//         <div style={{ padding: "16px" }}>
//           <div
//             style={{
//               display: "flex",
//               flexWrap: "wrap",
//               gap: 8,
//               fontSize: 12,
//               color: "#888",
//               marginBottom: 10,
//             }}
//           >
//             {(card as any).createdAt && (
//               <span>Created: {new Date((card as any).createdAt).toLocaleString()}</span>
//             )}
//             {(card as any).updatedAt && (
//               <span>Updated: {new Date((card as any).updatedAt).toLocaleString()}</span>
//             )}
//           </div>
//           <div style={{ fontSize: 13, marginBottom: 12 }}>
//             <span style={{ fontWeight: 600 }}>Business:</span>{" "}
//             {card.business?.businessName ?? "-"}
//           </div>
//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
//             <div>
//               <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
//                 Vehicle Info
//               </div>
//               <div style={{ fontSize: 12, paddingLeft: 8 }}>
//                 <div>
//                   <span style={{ fontWeight: 600 }}>Plate No:</span>{" "}
//                   {(card as any).vehicleId?.licensePlateNo || "-"}
//                 </div>
//                 <div style={{ marginTop: 8 }}>
//                   <span style={{ fontWeight: 600 }}>Customer:</span>{" "}
//                   {renderCustomerSummary((card as any).customerId)}
//                 </div>
//               </div>
//             </div>
//             <div>
//               <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
//                 Services
//               </div>
//               {Array.isArray(cardServices) && cardServices.length > 0 ? (
//                 renderJobCardServices(cardServices)
//               ) : (
//                 <span style={{ color: "#aaa", paddingLeft: 8 }}>-</span>
//               )}
//               <div style={{ marginTop: 12 }}>
//                 <span style={{ fontWeight: 600, fontSize: 12 }}>Vehicle Photos:</span>
//                 {(card as any).vehiclePhotos && (card as any).vehiclePhotos.length > 0 ? (
//                   <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
//                     {(card as any).vehiclePhotos.map((photo: string, i: number) => (
//                       <img
//                         key={i}
//                         src={
//                           typeof photo === "string"
//                             ? photo.startsWith("http")
//                               ? photo
//                               : `${UPLOADS_URL}/${photo.replace(/^\/+/, "")}`
//                             : ""
//                         }
//                         alt={`vehicle-photo-${i + 1}`}
//                         style={{
//                           width: 64,
//                           height: 64,
//                           objectFit: "cover",
//                           borderRadius: 3,
//                           border: "1px solid #d2d6de",
//                         }}
//                       />
//                     ))}
//                   </div>
//                 ) : (
//                   <span
//                     style={{
//                       marginLeft: 8,
//                       color: "#aaa",
//                       fontStyle: "italic",
//                       fontSize: 12,
//                     }}
//                   >
//                     No photos
//                   </span>
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
//     return (
//       <div style={{ textAlign: "center", color: "#aaa", padding: "30px 0" }}>
//         No job cards found.
//       </div>
//     );
//   }
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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

// // ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// const CarOwners: React.FC = () => {
//   const [carOwners, setCarOwners] = useState<CarOwnerType[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string>("");
//   const [search, setSearch] = useState("");
//   const [pageSize, setPageSize] = useState(10);
//   const [currentPage, setCurrentPage] = useState(1);

//   // Detail modals
//   const [openVehiclesFor, setOpenVehiclesFor] = useState<CarOwnerType | null>(null);
//   const [openServicedShopsFor, setOpenServicedShopsFor] = useState<CarOwnerType | null>(null);
//   const [openJobCardsFor, setOpenJobCardsFor] = useState<CarOwnerType | null>(null);
//   const [openNotificationModal, setOpenNotificationModal] = useState<boolean>(false);
//   const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
//   const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

//   // Add / Edit modal
//   const [addEditModal, setAddEditModal] = useState<{
//     open: boolean;
//     mode: "add" | "edit";
//     owner: CarOwnerType | null;
//   }>({ open: false, mode: "add", owner: null });

//   const fetchCarOwners = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const token = localStorage.getItem("admin-token");
//       const res = await axios.get(
//         `${import.meta.env.VITE_API_URL}/api/admin/carowners`,
//         { headers: { Authorization: token ? token : "" } }
//       );
//       if (res.data.success && Array.isArray(res.data.data)) {
//         setCarOwners(res.data.data);
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
//   }, []);

//   // Filter + paginate
//   const filtered = carOwners.filter((o) => {
//     const q = search.toLowerCase();
//     return (
//       (o.name || "").toLowerCase().includes(q) ||
//       (o.phone || "").toLowerCase().includes(q) ||
//       (o.email || "").toLowerCase().includes(q) ||
//       (o.address || "").toLowerCase().includes(q)
//     );
//   });
//   const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
//   const paginated = filtered.slice(
//     (currentPage - 1) * pageSize,
//     currentPage * pageSize
//   );

//   // Selection
//   const toggleRow = (id: string) => {
//     setSelectedRows((prev) => {
//       const copy = new Set(prev);
//       copy.has(id) ? copy.delete(id) : copy.add(id);
//       return copy;
//     });
//   };
//   const isRowSelected = (id: string) => selectedRows.has(id);
//   const allPageSelected =
//     paginated.length > 0 && paginated.every((o) => selectedRows.has(o._id));

//   const openExportModal = () => {
//     if (!selectedRows.size) {
//       alert("Please select at least one Car Owner to export.");
//       return;
//     }
//     setExportModalOpen(true);
//   };

//   function openAdd() {
//     setAddEditModal({ open: true, mode: "add", owner: null });
//   }

//   function openEdit(owner: CarOwnerType) {
//     setAddEditModal({ open: true, mode: "edit", owner });
//   }

//   function closeAddEdit() {
//     setAddEditModal((s) => ({ ...s, open: false }));
//   }

//   return (
//     <>
//       {/* ── Modals ── */}
//       <AddEditCarOwnerModal
//         isOpen={addEditModal.open}
//         onClose={closeAddEdit}
//         onSaved={() => { closeAddEdit(); fetchCarOwners(); }}
//         owner={addEditModal.owner}
//         mode={addEditModal.mode}
//       />

//       <SendNotificationModal
//         isOpen={openNotificationModal}
//         onClose={() => setOpenNotificationModal(false)}
//         selectedOwnerIds={Array.from(selectedRows)}
//         onNotificationSent={() => {}}
//       />
//       <ExportColumnsModal
//         isOpen={exportModalOpen}
//         onClose={() => setExportModalOpen(false)}
//         selectedOwnerIds={Array.from(selectedRows)}
//         owners={carOwners}
//       />
//       {openVehiclesFor && (
//         <Modal
//           isOpen
//           wide
//           onClose={() => setOpenVehiclesFor(null)}
//           title={`Vehicles — ${openVehiclesFor.name}`}
//         >
//           {renderVehiclesModalContent(openVehiclesFor)}
//         </Modal>
//       )}
//       {openServicedShopsFor && (
//         <Modal
//           isOpen
//           wide
//           onClose={() => setOpenServicedShopsFor(null)}
//           title={`Serviced Auto Shops — ${openServicedShopsFor.name}`}
//         >
//           {renderServicedShopsModalContent(openServicedShopsFor)}
//         </Modal>
//       )}
//       {openJobCardsFor && (
//         <Modal
//           isOpen
//           wide
//           onClose={() => setOpenJobCardsFor(null)}
//           title={`Job Cards — ${openJobCardsFor.name}`}
//         >
//           <RenderJobCardsModalContent owner={openJobCardsFor} />
//         </Modal>
//       )}

//       {/* ── Page ── */}
//       <div className="h-[92vh] overflow-y-auto bg-[#f0f0f0] px-6 py-5 font-sans">
//         {/* Heading row */}
//         <div className="w-full flex justify-between items-center">
//           <h1
//             style={{
//               fontSize: 34,
//               fontWeight: 300,
//               color: "#333",
//               marginBottom: 20,
//               marginTop: 0,
//             }}
//           >
//             Car Owners
//           </h1>
//           <button
//             onClick={openAdd}
//             style={{
//               background: "#00a65a",
//               color: "#fff",
//               padding: "8px 18px",
//               borderRadius: 4,
//               border: "none",
//               fontSize: 16,
//               fontWeight: 600,
//               cursor: "pointer",
//               boxShadow: "0 1px 1px rgba(0,0,0,.06)",
//               letterSpacing: 0.2,
//             }}
//             type="button"
//           >
//             + Add New
//           </button>
//         </div>

//         {/* Card */}
//         <div
//           className="mb-10"
//           style={{
//             background: "#fff",
//             border: "1px solid #d2d6de",
//             borderRadius: 3,
//             boxShadow: "0 1px 1px rgba(0,0,0,.1)",
//           }}
//         >
//           {/* Card Header */}
//           <div
//             style={{
//               padding: "10px 16px",
//               borderBottom: "1px solid #f4f4f4",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "space-between",
//               flexWrap: "wrap",
//               gap: 10,
//             }}
//           >
//             <h3 style={{ margin: 0, fontSize: 17, fontWeight: 400, color: "#444" }}>
//               Car Owner List
//             </h3>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 8,
//                 flexWrap: "wrap",
//               }}
//             >
//               {selectedRows.size > 0 && (
//                 <span style={{ fontSize: 12, color: "#777", marginRight: 4 }}>
//                   {selectedRows.size} selected
//                 </span>
//               )}
//               <button
//                 onClick={() => setOpenNotificationModal(true)}
//                 disabled={selectedRows.size === 0}
//                 type="button"
//                 style={{
//                   padding: "6px 14px",
//                   borderRadius: 3,
//                   border: "none",
//                   fontSize: 13,
//                   background: selectedRows.size === 0 ? "#aaa" : "#00a65a",
//                   color: "#fff",
//                   fontWeight: 600,
//                   cursor: selectedRows.size === 0 ? "not-allowed" : "pointer",
//                   whiteSpace: "nowrap",
//                 }}
//               >
//                 ✉ Send Notification
//               </button>
//               <button
//                 onClick={openExportModal}
//                 disabled={selectedRows.size === 0}
//                 type="button"
//                 style={{
//                   padding: "6px 14px",
//                   borderRadius: 3,
//                   border: "none",
//                   fontSize: 13,
//                   background: selectedRows.size === 0 ? "#aaa" : "#0073b7",
//                   color: "#fff",
//                   fontWeight: 600,
//                   cursor: selectedRows.size === 0 ? "not-allowed" : "pointer",
//                   whiteSpace: "nowrap",
//                 }}
//               >
//                 ↓ Export (.csv)
//               </button>
//             </div>
//           </div>

//           {/* Card Body */}
//           <div style={{ padding: 20 }}>
//             {/* Top Controls */}
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 marginBottom: 16,
//                 flexWrap: "wrap",
//                 gap: 10,
//               }}
//             >
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 6,
//                   fontSize: 14,
//                   color: "#333",
//                 }}
//               >
//                 <span>Show</span>
//                 <select
//                   value={pageSize}
//                   onChange={(e) => {
//                     setPageSize(Number(e.target.value));
//                     setCurrentPage(1);
//                   }}
//                   style={{
//                     height: 34,
//                     border: "1px solid #d2d6de",
//                     borderRadius: 3,
//                     padding: "0 10px",
//                     fontSize: 14,
//                     outline: "none",
//                   }}
//                 >
//                   {[10, 25, 50, 100].map((n) => (
//                     <option key={n} value={n}>
//                       {n}
//                     </option>
//                   ))}
//                 </select>
//                 <span>entries</span>
//               </div>
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 8,
//                   fontSize: 14,
//                   color: "#333",
//                 }}
//               >
//                 <span>Search:</span>
//                 <input
//                   value={search}
//                   onChange={(e) => {
//                     setSearch(e.target.value);
//                     setCurrentPage(1);
//                   }}
//                   style={{
//                     height: 34,
//                     width: 190,
//                     border: "1px solid #d2d6de",
//                     borderRadius: 3,
//                     padding: "0 10px",
//                     fontSize: 14,
//                     outline: "none",
//                   }}
//                   placeholder=""
//                 />
//               </div>
//             </div>

//             {/* States */}
//             {loading && (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "40px 0",
//                   color: "#888",
//                   fontSize: 14,
//                 }}
//               >
//                 Loading car owners…
//               </div>
//             )}
//             {error && (
//               <div
//                 style={{
//                   textAlign: "center",
//                   padding: "30px 0",
//                   color: "#c0392b",
//                   fontSize: 14,
//                 }}
//               >
//                 Error: {error}
//               </div>
//             )}

//             {/* Table */}
//             {!loading && !error && (
//               <div style={{ overflowX: "auto" }}>
//                 <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
//                   <thead>
//                     <tr>
//                       <th style={thStyle}>
//                         <input
//                           type="checkbox"
//                           checked={allPageSelected}
//                           onChange={(e) => {
//                             if (e.target.checked) {
//                               setSelectedRows((prev) => {
//                                 const copy = new Set(prev);
//                                 paginated.forEach((o) => copy.add(o._id));
//                                 return copy;
//                               });
//                             } else {
//                               setSelectedRows((prev) => {
//                                 const copy = new Set(prev);
//                                 paginated.forEach((o) => copy.delete(o._id));
//                                 return copy;
//                               });
//                             }
//                           }}
//                         />
//                       </th>
//                       <th style={thStyle}>Name</th>
//                       <th style={thStyle}>Phone</th>
//                       <th style={thStyle}>Country Code</th>
//                       <th style={thStyle}>Address</th>
//                       <th style={thStyle}>Pincode</th>
//                       <th style={thStyle}>Profile Complete</th>
//                       <th style={thStyle}>Disabled</th>
//                       <th style={thStyle}>Vehicle</th>
//                       <th style={thStyle}>Auto Shop</th>
//                       <th style={thStyle}>Job Card</th>
//                       <th style={thStyle}>Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {paginated.length === 0 && (
//                       <tr>
//                         <td
//                           colSpan={12}
//                           style={{
//                             ...tdStyle,
//                             textAlign: "center",
//                             color: "#aaa",
//                             padding: "36px 0",
//                           }}
//                         >
//                           No car owners found.
//                         </td>
//                       </tr>
//                     )}
//                     {paginated.map((owner) => {
//                       const servicedShops = owner.autoshopsReceivedServiceFrom ?? [];
//                       const selected = isRowSelected(owner._id);
//                       return (
//                         <tr
//                           key={owner._id}
//                           style={{ background: selected ? "#f0f7ff" : undefined }}
//                         >
//                           <td style={tdStyle}>
//                             <input
//                               type="checkbox"
//                               checked={selected}
//                               onChange={() => toggleRow(owner._id)}
//                             />
//                           </td>
//                           <td style={{ ...tdStyle, fontWeight: 500 }}>
//                             {owner.name || "-"}
//                           </td>
//                           <td style={tdStyle}>{owner.phone || "-"}</td>
//                           <td style={tdStyle}>{owner.countryCode || "-"}</td>
//                           <td style={tdStyle}>{owner.address || "-"}</td>
//                           <td style={tdStyle}>{owner.pincode || "-"}</td>
//                           <td style={tdStyle}>
//                             <span
//                               style={{
//                                 display: "inline-block",
//                                 padding: "2px 10px",
//                                 borderRadius: 3,
//                                 fontSize: 12,
//                                 fontWeight: 600,
//                                 background: owner.isProfileComplete
//                                   ? "#dff0d8"
//                                   : "#f2dede",
//                                 color: owner.isProfileComplete ? "#3c763d" : "#a94442",
//                                 border: `1px solid ${
//                                   owner.isProfileComplete ? "#d6e9c6" : "#ebccd1"
//                                 }`,
//                               }}
//                             >
//                               {owner.isProfileComplete ? "Yes" : "No"}
//                             </span>
//                           </td>
//                           <td style={tdStyle}>
//                             <span
//                               style={{
//                                 display: "inline-block",
//                                 padding: "2px 10px",
//                                 borderRadius: 3,
//                                 fontSize: 12,
//                                 fontWeight: 600,
//                                 background: owner.isDisabled ? "#f2dede" : "#dff0d8",
//                                 color: owner.isDisabled ? "#a94442" : "#3c763d",
//                                 border: `1px solid ${
//                                   owner.isDisabled ? "#ebccd1" : "#d6e9c6"
//                                 }`,
//                               }}
//                             >
//                               {owner.isDisabled ? "Yes" : "No"}
//                             </span>
//                           </td>
//                           <td style={tdStyle}>
//                             {owner.myVehicles && owner.myVehicles.length > 0 ? (
//                               <button
//                                 onClick={() => setOpenVehiclesFor(owner)}
//                                 type="button"
//                                 style={linkBtnStyle}
//                               >
//                                 {owner.myVehicles.length}
//                               </button>
//                             ) : (
//                               "-"
//                             )}
//                           </td>
//                           <td style={tdStyle}>
//                             {servicedShops.length > 0 ? (
//                               <button
//                                 onClick={() => setOpenServicedShopsFor(owner)}
//                                 type="button"
//                                 style={linkBtnStyle}
//                               >
//                                 {servicedShops.length}
//                               </button>
//                             ) : (
//                               "-"
//                             )}
//                           </td>
//                           <td style={tdStyle}>
//                             {owner.jobCards && owner.jobCards.length > 0 ? (
//                               <button
//                                 onClick={() => setOpenJobCardsFor(owner)}
//                                 type="button"
//                                 style={linkBtnStyle}
//                               >
//                                 {owner.jobCards.length}
//                               </button>
//                             ) : (
//                               "-"
//                             )}
//                           </td>
//                           {/* ── Actions column ── */}
//                           <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
//                             <button
//                               type="button"
//                               onClick={() => openEdit(owner)}
//                               style={{
//                                 padding: "4px 12px",
//                                 borderRadius: 3,
//                                 border: "1px solid #d2d6de",
//                                 background: "#fff",
//                                 color: "#0073b7",
//                                 fontSize: 12,
//                                 fontWeight: 600,
//                                 cursor: "pointer",
//                                 display: "inline-flex",
//                                 alignItems: "center",
//                                 gap: 4,
//                               }}
//                             >
//                               ✏️ Edit
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             )}

//             {/* Footer */}
//             {!loading && !error && (
//               <div
//                 style={{
//                   marginTop: 16,
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "space-between",
//                   flexWrap: "wrap",
//                   gap: 10,
//                 }}
//               >
//                 <p style={{ margin: 0, fontSize: 14, color: "#333" }}>
//                   {filtered.length === 0
//                     ? "No entries"
//                     : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(
//                         currentPage * pageSize,
//                         filtered.length
//                       )} of ${filtered.length} entries${
//                         search ? ` (filtered from ${carOwners.length} total)` : ""
//                       }`}
//                 </p>
//                 <div style={{ display: "flex" }}>
//                   <button
//                     onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//                     disabled={currentPage === 1}
//                     style={pageBtn(false, currentPage === 1)}
//                   >
//                     Previous
//                   </button>
//                   {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
//                     <button
//                       key={pg}
//                       onClick={() => setCurrentPage(pg)}
//                       style={pageBtn(pg === currentPage, false)}
//                     >
//                       {pg}
//                     </button>
//                   ))}
//                   <button
//                     onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
//                     disabled={currentPage === totalPages}
//                     style={pageBtn(false, currentPage === totalPages)}
//                   >
//                     Next
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// // ─── Style helpers ────────────────────────────────────────────────────────────
// const thStyle: React.CSSProperties = {
//   border: "1px solid #d2d6de",
//   background: "#f9fafc",
//   padding: "10px 12px",
//   textAlign: "left",
//   fontWeight: 700,
//   fontSize: 13,
//   color: "#333",
//   whiteSpace: "nowrap",
// };

// const tdStyle: React.CSSProperties = {
//   border: "1px solid #d2d6de",
//   padding: "10px 12px",
//   fontSize: 13,
//   color: "#555",
//   verticalAlign: "middle",
// };

// const linkBtnStyle: React.CSSProperties = {
//   background: "none",
//   border: "none",
//   color: "#0073b7",
//   cursor: "pointer",
//   padding: 0,
//   fontSize: 12,
//   textDecoration: "underline",
//   fontWeight: 500,
// };

// const pageBtn = (active: boolean, disabled: boolean): React.CSSProperties => ({
//   border: "1px solid",
//   borderColor: active ? "#0073b7" : "#ddd",
//   background: active ? "#0073b7" : "#fff",
//   color: active ? "#fff" : disabled ? "#bbb" : "#777",
//   padding: "6px 13px",
//   fontSize: 13,
//   cursor: disabled ? "not-allowed" : "pointer",
//   marginLeft: -1,
// });

// export default CarOwners;





import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

// ─── Types ───────────────────────────────────────────────────────────────────
type BusinessProfileType = {
  _id: string; businessName: string; businessAddress?: string; pincode?: string;
  businessPhone?: string; businessEmail?: string; openHours?: string; openDays?: string[];
  businessLogo?: string; myServices?: any[]; city?: string; businessWebsite?: string;
  directionsUrl?: string; rating?: number; reviewCount?: number; isFav?: boolean;
  businessMapLocation?: { lat: number; lng: number; _id: string };
  createdAt?: string; updatedAt?: string;
};
type VehicleType = {
  _id: string; make?: { name?: string; model?: string }; year?: number; vinNo?: string;
  licensePlateNo?: string; odometerReading?: number; carImages?: string[];
  licensePlateFrontImagePath?: string; licensePlateBackImagePath?: string;
  createdAt?: string; updatedAt?: string; status?: string; [key: string]: any;
};
type JobCardType = {
  _id: string; business: BusinessProfileType; jobNo?: string | number;
  paymentStatus?: string; totalPayableAmount?: number; services?: any[];
  vehicleId?: { licensePlateNo?: string }; customerId?: any;
  vehiclePhotos?: string[]; createdAt?: string; updatedAt?: string; [key: string]: any;
};
type CarOwnerType = {
  _id: string; name: string; email?: string; countryCode?: string; phone?: string;
  address?: string; pincode?: string; city?: string; status?: string;
  isProfileComplete?: boolean; isDisabled?: boolean; myVehicles?: VehicleType[];
  onboardedBy?: { _id: string; name?: string; email?: string } | null;
  favoriteAutoShops?: BusinessProfileType[];
  autoshopsReceivedServiceFrom?: BusinessProfileType[];
  jobCards?: JobCardType[]; profilePhoto?: string; profileImage?: string;
  createdAt?: string;
};

// ─── Column Config ───────────────────────────────────────────────────────────
const ALL_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "city", label: "City" },
  { key: "date", label: "Date" },
  { key: "vehicle", label: "Vehicle" },
  { key: "autoShops", label: "Auto Shops" },
  { key: "jobCard", label: "Job Card" },
  { key: "invoice", label: "Invoice" },
  { key: "status", label: "Status" },
];
const DEFAULT_VISIBLE = ["name", "phone", "city", "date", "vehicle", "autoShops", "jobCard", "status"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const API = () => import.meta.env.VITE_API_URL || "";
const UPLOADS = () => import.meta.env.VITE_UPLOADS_URL || "";
function mediaUrl(path?: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${UPLOADS()}/${path.replace(/^\/+/, "")}`;
}
function ownerProfileImg(o: CarOwnerType): string {
  return mediaUrl(o.profilePhoto ?? o.profileImage ?? "");
}
function fmtDate(d?: string): string {
  if (!d) return "-";
  return new Date(d).toISOString().slice(0, 10);
}
function getMakeName(v: VehicleType): string {
  if (!v.make) return "-";
  if (typeof v.make === "object") return v.make.name || "-";
  return String(v.make);
}
function getMakeModel(v: VehicleType): string {
  if (!v.make) return "-";
  if (typeof v.make === "object") return v.make.model || "-";
  return "-";
}
function getToken(): Record<string, string> {
  const t = localStorage.getItem("admin-token");
  return t ? { Authorization: t } : {};
}

// ─── Green Card Styles ───────────────────────────────────────────────────────
const GREEN_CARD: React.CSSProperties = {
  background: "#d4f5c4", border: "1px solid #b2e0a0", borderRadius: 14,
  padding: "18px 22px", marginBottom: 18, boxShadow: "3px 4px 0 #c0d8b0",
  position: "relative",
};
const GC_LABEL: React.CSSProperties = { color: "#555", fontWeight: 600, fontSize: 13, minWidth: 110 };
const GC_VAL: React.CSSProperties = { color: "#222", fontSize: 13 };
function GCRow({ label, value }: { label: string; value?: any }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
      <span style={GC_LABEL}>{label}</span>
      <span style={{ color: "#888", marginRight: 4 }}>:</span>
      <span style={GC_VAL}>{value ?? "-"}</span>
    </div>
  );
}

// ─── BASE MODAL ───────────────────────────────────────────────────────────────
const BaseModal: React.FC<{
  isOpen: boolean; onClose: () => void; title: string;
  children: React.ReactNode; wide?: boolean; maxW?: string;
}> = ({ isOpen, onClose, title, children, wide, maxW }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "30px 10px" }}>
      <div style={{ background: "#fff", borderRadius: 4, width: maxW ?? (wide ? "min(920px,96vw)" : "min(720px,95vw)"), boxShadow: "0 5px 24px rgba(0,0,0,.35)", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#3c8dbc", color: "#fff", padding: "11px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "4px 4px 0 0", flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
          <button onClick={onClose} type="button" style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
};

// ─── VEHICLES MODAL ──────────────────────────────────────────────────────────
const VehiclesModal: React.FC<{ owner: CarOwnerType; onClose: () => void }> = ({ owner, onClose }) => {
  const vehicles = owner.myVehicles ?? [];
  return (
    <BaseModal isOpen wide onClose={onClose} title={`Vehicles — ${owner.name}`}>
      {vehicles.length === 0
        ? <p style={{ textAlign: "center", color: "#aaa" }}>No vehicles found.</p>
        : vehicles.map((v) => (
          <div key={v._id}>
            <h3 style={{ fontFamily: "serif", fontWeight: 700, fontSize: 18, marginBottom: 10 }}>
              {getMakeName(v)} - {getMakeModel(v)}
            </h3>
            <div style={GREEN_CARD}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(150px,220px) 1fr", gap: 16 }}>
                <div>
                  <div style={{ background: "#fff", border: "1px solid #ccc", borderRadius: 6, width: "100%", paddingBottom: "75%", position: "relative", overflow: "hidden", marginBottom: 6 }}>
                    {Array.isArray(v.carImages) && v.carImages[0]
                      ? <img src={mediaUrl(v.carImages[0])} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      : null}
                  </div>
                  <div style={{ background: "#1a6e1a", color: "#fff", fontWeight: 700, fontSize: 14, textAlign: "center", borderRadius: 4, padding: "4px 8px", letterSpacing: 1 }}>
                    {v.licensePlateNo || "—"}
                  </div>
                </div>
                <div style={{ paddingTop: 8 }}>
                  <GCRow label="VIN" value={v.vinNo} />
                  <GCRow label="Year" value={v.year} />
                  <GCRow label="Odo" value={v.odometerReading !== undefined ? `${v.odometerReading}` : undefined} />
                  <GCRow label="Created on" value={fmtDate(v.createdAt)} />
                  <GCRow label="Updated" value={fmtDate(v.updatedAt)} />
                  <GCRow label="Status" value={v.status ?? "Active"} />
                </div>
              </div>
            </div>
          </div>
        ))}
    </BaseModal>
  );
};

// ─── AUTO SHOPS MODAL ─────────────────────────────────────────────────────────
const AutoShopsModal: React.FC<{ owner: CarOwnerType; onClose: () => void }> = ({ owner, onClose }) => {
  const shops = owner.autoshopsReceivedServiceFrom ?? [];
  const favIds = new Set((owner.favoriteAutoShops ?? []).map(f => f._id));
  return (
    <BaseModal isOpen wide onClose={onClose} title={`Auto Shops — ${owner.name}`}>
      {shops.length === 0
        ? <p style={{ textAlign: "center", color: "#aaa" }}>No auto shops found.</p>
        : shops.map((s) => {
          const services = (s.myServices ?? []).map((sv: any) =>
            typeof sv === "string" ? sv : (sv.serviceName || sv.name || "Service")
          );
          return (
            <div key={s._id}>
              <h3 style={{ fontFamily: "serif", fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{s.businessName}</h3>
              <div style={GREEN_CARD}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(150px,200px) 1fr auto", gap: 16, alignItems: "start" }}>
                  <div>
                    <div style={{ background: "#fff", border: "1px solid #ccc", borderRadius: 6, width: "100%", paddingBottom: "75%", position: "relative", overflow: "hidden", marginBottom: 6 }}>
                      {s.businessLogo
                        ? <img src={mediaUrl(s.businessLogo)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                        : null}
                    </div>
                    <div style={{ background: "#1a6e1a", color: "#fff", fontWeight: 700, fontSize: 12, textAlign: "center", borderRadius: 4, padding: "4px 8px" }}>
                      {s.businessPhone || "—"}
                    </div>
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <GCRow label="Address" value={s.businessAddress} />
                    <GCRow label="City" value={s.city} />
                    <GCRow label="Zip Code" value={s.pincode} />
                    <GCRow label="Updated" value={fmtDate(s.updatedAt)} />
                    <GCRow label="Service" value={services[0]} />
                    {services.slice(1).map((sv: string, i: number) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                        <span style={{ minWidth: 110 }}></span>
                        <span style={{ color: "#888", marginRight: 4 }}>:</span>
                        <span style={GC_VAL}>{sv}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 4 }}>
                    {favIds.has(s._id) && <span style={{ fontSize: 22 }}>❤️</span>}
                    {s.directionsUrl || s.businessMapLocation
                      ? <a href={s.directionsUrl || (s.businessMapLocation ? `https://maps.google.com?q=${s.businessMapLocation.lat},${s.businessMapLocation.lng}` : "#")} target="_blank" rel="noreferrer" style={{ color: "#0073b7", fontSize: 13, fontWeight: 600 }}>Directions</a>
                      : null}
                    {s.businessWebsite && <a href={s.businessWebsite} target="_blank" rel="noreferrer" style={{ color: "#0073b7", fontSize: 13, fontWeight: 600 }}>Website</a>}
                    {s.businessEmail && <a href={`mailto:${s.businessEmail}`} style={{ color: "#0073b7", fontSize: 13, fontWeight: 600 }}>Email</a>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </BaseModal>
  );
};

// ─── JOB CARDS MODAL ──────────────────────────────────────────────────────────
const JobCardsModal: React.FC<{ owner: CarOwnerType; onClose: () => void }> = ({ owner, onClose }) => {
  const cards = owner.jobCards ?? [];
  const grouped: Record<string, JobCardType[]> = {};
  for (const c of cards) {
    const plate = c.vehicleId?.licensePlateNo ?? "Unknown";
    if (!grouped[plate]) grouped[plate] = [];
    grouped[plate].push(c);
  }
  return (
    <BaseModal isOpen wide onClose={onClose} title={`Job Cards — ${owner.name}`}>
      {cards.length === 0
        ? <p style={{ textAlign: "center", color: "#aaa" }}>No job cards found.</p>
        : Object.entries(grouped).map(([plate, groupCards]) => (
          <div key={plate}>
            <h3 style={{ fontFamily: "serif", fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{plate}</h3>
            {groupCards.map((c) => {
              const services = (c.services ?? []).map((s: any) =>
                s?.id?.name ?? s?.name ?? "Service"
              );
              return (
                <div key={c._id} style={GREEN_CARD}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                    <GCRow label="Job Card No" value={c.jobNo ? `#${c.jobNo}` : undefined} />
                    <GCRow label="Service type" value={services[0]} />
                    <GCRow label="Created on" value={fmtDate(c.createdAt)} />
                    <GCRow label="Auto Shop" value={c.business?.businessName} />
                  </div>
                  <button
                    type="button"
                    style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", fontSize: 26, color: "#1a8a1a", cursor: "pointer", lineHeight: 1 }}
                    title="View details"
                  >+</button>
                </div>
              );
            })}
          </div>
        ))}
    </BaseModal>
  );
};

// ─── PROFILE MODAL ─────────────────────────────────────────────────────────────
const ProfileModal: React.FC<{
  owner: CarOwnerType;
  onClose: () => void;
  onEdit: () => void;
  toggleStatus: (id: string, newStatus: string) => Promise<void>;
}> = ({ owner, onClose, onEdit, toggleStatus }) => {
  const vehicles = owner.myVehicles ?? [];
  const shops = owner.autoshopsReceivedServiceFrom ?? [];
  const cards = owner.jobCards ?? [];
  const favIds = new Set((owner.favoriteAutoShops ?? []).map(f => f._id));
  const imgSrc = ownerProfileImg(owner);

  function getStatusDisplay(status: string | undefined): string {
    if (!status || status === "active") return "Active";
    if (status === "suspended" || status === "inactive") return "Inactive";
    if (status === "deleted") return "Deleted";
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  const [statusLoading, setStatusLoading] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState(owner.status ?? "active");

  React.useEffect(() => {
    setCurrentStatus(owner.status ?? "active");
  }, [owner.status]);

  async function handleToggleStatus() {
    if (!owner._id) return;
    setStatusLoading(true);
    try {
      if (currentStatus === "deleted") { setStatusLoading(false); return; }
      const newStatus = currentStatus === "suspended" || currentStatus === "inactive" ? "active" : "suspended";
      await toggleStatus(owner._id, newStatus);
      setCurrentStatus(newStatus);
      setStatusLoading(false);
    } catch (e) {
      setStatusLoading(false);
      alert("Failed to update status.");
    }
  }

  const isDeleted = currentStatus === "deleted";

  return (
    <BaseModal isOpen wide onClose={onClose} title={`Profile — ${owner.name}`} maxW="min(820px,96vw)">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, border: "1px solid #c8e6b0", borderRadius: 14, overflow: "hidden" }}>
        {/* Left */}
        <div style={{ background: "#d4f5c4", padding: "24px 28px", borderRight: "1px solid #c8e6b0" }}>
          <GCRow label="Name" value={owner.name} />
          <GCRow label="E-mail" value={<a href={`mailto:${owner.email}`} style={{ color: "#0073b7" }}>{owner.email}</a>} />
          <GCRow label="Phone" value={`${owner.countryCode ?? ""} ${owner.phone ?? ""}`.trim() || undefined} />
          <GCRow label="City" value={owner.city} />
          <GCRow label="Address" value={owner.address} />
          <GCRow label="Zip Code" value={owner.pincode} />
          <div style={{ margin: "10px 0 4px", display: "flex", gap: 8 }}>
            <span style={GC_LABEL}>Vehicles</span>
            <span style={{ color: "#888", marginRight: 4 }}>:</span>
            <div>
              {vehicles.map((v) => (
                <div key={v._id} style={GC_VAL}>{getMakeName(v)}- {getMakeModel(v)}  - {v.year}</div>
              ))}
              {vehicles.length === 0 && <span style={GC_VAL}>—</span>}
            </div>
          </div>
          <div style={{ margin: "10px 0 4px", display: "flex", gap: 8 }}>
            <span style={GC_LABEL}>Auto Shop</span>
            <span style={{ color: "#888", marginRight: 4 }}>:</span>
            <div>
              {shops.map((s) => (
                <div key={s._id} style={{ ...GC_VAL, display: "flex", gap: 6, alignItems: "center" }}>
                  {s.businessName} - {s.city}
                  {favIds.has(s._id) && <span>❤️</span>}
                </div>
              ))}
              {shops.length === 0 && <span style={GC_VAL}>—</span>}
            </div>
          </div>
          <div style={{ margin: "10px 0 4px", display: "flex", gap: 8 }}>
            <span style={GC_LABEL}>Job Cards</span>
            <span style={{ color: "#888", marginRight: 4 }}>:</span>
            <div>
              {cards.map((c) => (
                <div key={c._id} style={GC_VAL}># {c.jobNo ?? c._id.slice(-5)}</div>
              ))}
              {cards.length === 0 && <span style={GC_VAL}>—</span>}
            </div>
          </div>
        </div>
        {/* Right */}
        <div style={{ background: "#d4f5c4", padding: "24px 28px" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>User account Login with</div>
          <GCRow label="Mobile" value={owner.phone} />
          <GCRow
            label="Status"
            value={
              <span style={{
                color: currentStatus === "active" ? "#1A6E1A" : currentStatus === "suspended" || currentStatus === "inactive" ? "#c77f0d" : currentStatus === "deleted" ? "#b71818" : "#222",
                fontWeight: 600, textTransform: "capitalize",
              }}>
                {getStatusDisplay(currentStatus)}
              </span>
            }
          />
          <GCRow label="Joining Date" value={fmtDate(owner.createdAt)} />
          <GCRow label="URL" value={
            <a 
              href={`https://autodaddy.ca/user`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: "#0073b7", textDecoration: "underline" }}
            >
              https://autodaddy.ca/user
            </a>
          } />
     
          <div style={{ marginTop: 14 }}>
            <span style={GC_LABEL}>Image</span>
            <div style={{ display: "inline-flex", marginLeft: 18, border: "1px solid #bbb", background: "#fff", width: 120, height: 120, borderRadius: 6, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
              {imgSrc ? <img src={imgSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
            </div>
          </div>
          <div style={{ marginTop: 24, display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" onClick={onEdit} style={{ background: "#1a6e1a", color: "#fff", border: "none", borderRadius: 4, padding: "8px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer", marginRight: 10 }} disabled={statusLoading}>
              Update
            </button>
            <button
              type="button"
              onClick={handleToggleStatus}
              style={{
                background: isDeleted ? "#888" : currentStatus === "suspended" || currentStatus === "inactive" ? "#1a6e1a" : "#d32f2f",
                color: "#fff", border: "none", borderRadius: 4, padding: "8px 24px", fontWeight: 700, fontSize: 14,
                cursor: isDeleted ? "not-allowed" : statusLoading ? "not-allowed" : "pointer",
                opacity: statusLoading || isDeleted ? 0.7 : 1,
              }}
              disabled={statusLoading || isDeleted}
            >
              {isDeleted ? "Deleted" : statusLoading ? "Updating..." : currentStatus === "suspended" || currentStatus === "inactive" ? "Set Active" : "Set Inactive"}
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

// ─── PRINT PAGE ───────────────────────────────────────────────────────────────
function printOwner(owner: CarOwnerType) {
  const vehicles = owner.myVehicles ?? [];
  const shops = owner.autoshopsReceivedServiceFrom ?? [];
  const cards = owner.jobCards ?? [];
  const favIds = new Set((owner.favoriteAutoShops ?? []).map(f => f._id));
  const imgSrc = ownerProfileImg(owner);

  const row = (label: string, value: string) =>
    `<tr><td style="font-weight:600;padding:4px 12px 4px 0;width:120px;vertical-align:top">${label}</td><td style="padding:4px 0;color:#333">: ${value || "—"}</td></tr>`;

  const vehicleRows = vehicles.map(v => `<tr><td></td><td style="padding:2px 0">: ${getMakeName(v)}- ${getMakeModel(v)}  - ${v.year ?? ""}</td></tr>`).join("");
  const shopRows = shops.map(s => `<tr><td></td><td style="padding:2px 0">: ${s.businessName} - ${s.city ?? ""}${favIds.has(s._id) ? " ❤️" : ""}</td></tr>`).join("");
  const cardRows = cards.map(c => `<tr><td></td><td style="padding:2px 0">: # ${c.jobNo ?? c._id.slice(-5)}</td></tr>`).join("");

  const html = `<!DOCTYPE html><html><head><title>Print - ${owner.name}</title>
<style>body{font-family:sans-serif;padding:30px}h2{font-weight:700;margin-bottom:16px}
.card{background:#d4f5c4;border-radius:14px;padding:22px 28px;display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #b2e0a0}
.left{border-right:1px solid #b2e0a0;padding-right:24px}.right{padding-left:24px}
table{border-collapse:collapse;font-size:14px}a{color:#0073b7}
.btn{background:#1a6e1a;color:#fff;border:none;border-radius:4px;padding:8px 24px;font-size:14px;font-weight:700;cursor:pointer;margin-right:8px}
.btn-xl{background:#0073b7}img{border:1px solid #ccc;border-radius:4px}
@media print{.noprint{display:none}}
</style></head><body>
<h2>Print Page</h2>
<div class="card">
  <div class="left">
    <table>
      ${row("Name", owner.name)}
      ${row("E-mail", `<a href="mailto:${owner.email}">${owner.email ?? ""}</a>`)}
      ${row("Phone", `${owner.countryCode ?? ""} ${owner.phone ?? ""}`.trim())}
      ${row("City", `${owner.city ?? ""}`)}
      ${row("Address", owner.address ?? "")}
      ${row("Zip Code", owner.pincode ?? "")}
      <tr><td style="font-weight:600;padding:4px 12px 4px 0;vertical-align:top">Vehicles</td><td></td></tr>
      ${vehicleRows}
      <tr><td style="font-weight:600;padding:4px 12px 4px 0;vertical-align:top">Auto Shop</td><td></td></tr>
      ${shopRows}
      <tr><td style="font-weight:600;padding:4px 12px 4px 0;vertical-align:top">Job Cards</td><td></td></tr>
      ${cardRows}
    </table>
  </div>
  <div class="right">
    <div style="font-weight:700;font-size:16px;margin-bottom:14px">User account Login with</div>
    <table>
      ${row("Mobile", owner.phone ?? "")}
      ${row("Status", owner.status ?? "Active")}
      ${row("Joining Date", fmtDate(owner.createdAt))}
      ${row("URL", "https://autodaddy.ca/user/")}
    </table>
    <div style="margin-top:14px;font-weight:600;font-size:13px">Image :</div>
    <div style="margin-top:6px;background:#fff;border:1px solid #ccc;width:140px;height:140px;border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center">
      ${imgSrc ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover" />` : ""}
    </div>
    <div style="margin-top:24px" class="noprint">
      <button class="btn" onclick="window.print()">Print</button>
      <button class="btn btn-xl" onclick="exportXL()">Export XL</button>
    </div>
  </div>
</div>
<script>
function exportXL() {
  const data = ${JSON.stringify({
    Name: owner.name, Email: owner.email, Phone: `${owner.countryCode ?? ""} ${owner.phone ?? ""}`.trim(),
    City: owner.city, Address: owner.address, Pincode: owner.pincode, Status: owner.status ?? "Active",
    Vehicles: vehicles.map(v => `${getMakeName(v)} ${getMakeModel(v)} ${v.year ?? ""}`).join("; "),
    AutoShops: shops.map(s => s.businessName).join("; "),
    JobCards: cards.map(c => `#${c.jobNo ?? c._id.slice(-5)}`).join("; "),
  })};
  const rows = [Object.keys(data), Object.values(data)];
  const csv = rows.map(r => r.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\\n");
  const a = document.createElement("a"); a.href = "data:text/csv," + encodeURIComponent(csv);
  a.download = "carowner-${owner.name.replace(/\s+/g, "-")}.csv"; a.click();
}
</script>
</body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

// ─── ADD/EDIT MODAL ───────────────────────────────────────────────────────────
type VehicleFormRow = {
  _id?: string; licensePlateNo: string; vinNo: string; vehicleName: string;
  model: string; year: string; odometerReading: string;
  vehicleImageFile: File | null; vehicleImagePreview: string;
};
function emptyVehicle(): VehicleFormRow {
  return { licensePlateNo: "", vinNo: "", vehicleName: "", model: "", year: "", odometerReading: "", vehicleImageFile: null, vehicleImagePreview: "" };
}
const CALLING_CODES = [
  { id: "CA", flag: "🇨🇦", code: "+1" }, { id: "US", flag: "🇺🇸", code: "+1" },
  { id: "GB", flag: "🇬🇧", code: "+44" }, { id: "IN", flag: "🇮🇳", code: "+91" }, { id: "AU", flag: "🇦🇺", code: "+61" },
];
function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }
const iStyle: React.CSSProperties = { width: "100%", border: "1px solid #d2d6de", borderRadius: 3, padding: "7px 10px", fontSize: 13, outline: "none", boxSizing: "border-box", color: "#333", background: "#fff" };
const lStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#555", textTransform: "uppercase", letterSpacing: "0.04em" };

function VehicleRowForm({ v, i, attempted, onChange, onRemove, canRemove }: {
  v: VehicleFormRow; i: number; attempted: boolean;
  onChange: (p: Partial<VehicleFormRow>) => void; onRemove: () => void; canRemove: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div style={{ border: "1px solid #d2d6de", borderRadius: 4, padding: "12px 14px", background: "#f9fafc", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#3c8dbc" }}>Vehicle #{i + 1}</span>
        {canRemove && <button type="button" onClick={onRemove} style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✕ Remove</button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px" }}>
        <div>
          <label style={lStyle}>License Plate *</label>
          <input style={iStyle} value={v.licensePlateNo} onChange={e => onChange({ licensePlateNo: e.target.value.slice(0, 14) })} placeholder="e.g. ABC 1234" />
          {attempted && !v.licensePlateNo.trim() && <p style={{ color: "#c0392b", fontSize: 11, margin: "2px 0 0", fontWeight: 600 }}>Required</p>}
        </div>
        <div>
          <label style={lStyle}>VIN (17 chars)</label>
          <input style={iStyle} value={v.vinNo} onChange={e => onChange({ vinNo: e.target.value.slice(0, 17).toUpperCase() })} placeholder="17-char VIN" maxLength={17} />
          {attempted && v.vinNo && v.vinNo.length !== 17 && <p style={{ color: "#c0392b", fontSize: 11, margin: "2px 0 0", fontWeight: 600 }}>Must be 17 chars</p>}
        </div>
        <div>
          <label style={lStyle}>Make *</label>
          <input style={iStyle} value={v.vehicleName} onChange={e => onChange({ vehicleName: e.target.value })} placeholder="e.g. Toyota" />
        </div>
        <div>
          <label style={lStyle}>Model *</label>
          <input style={iStyle} value={v.model} onChange={e => onChange({ model: e.target.value })} placeholder="e.g. Camry" />
        </div>
        <div>
          <label style={lStyle}>Year *</label>
          <input style={iStyle} value={v.year} onChange={e => onChange({ year: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="e.g. 2020" maxLength={4} />
        </div>
        <div>
          <label style={lStyle}>Odometer (km)</label>
          <input style={iStyle} value={v.odometerReading} onChange={e => onChange({ odometerReading: e.target.value.replace(/\D/g, "") })} placeholder="e.g. 45000" />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={lStyle}>Vehicle Image</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {v.vehicleImagePreview && <img src={v.vehicleImagePreview} alt="" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 3, border: "1px solid #d2d6de" }} />}
            <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
              const file = e.target.files?.[0]; if (!file) return;
              if (v.vehicleImagePreview?.startsWith("blob:")) URL.revokeObjectURL(v.vehicleImagePreview);
              onChange({ vehicleImageFile: file, vehicleImagePreview: URL.createObjectURL(file) });
            }} />
            <button type="button" onClick={() => ref.current?.click()} style={{ padding: "6px 14px", border: "1px solid #d2d6de", borderRadius: 3, background: "#fff", color: "#555", fontSize: 12, cursor: "pointer" }}>
              {v.vehicleImagePreview ? "Change" : "Upload"}
            </button>
            {v.vehicleImagePreview && (
              <button type="button" onClick={() => { if (v.vehicleImagePreview?.startsWith("blob:")) URL.revokeObjectURL(v.vehicleImagePreview); onChange({ vehicleImageFile: null, vehicleImagePreview: "" }); if (ref.current) ref.current.value = ""; }} style={{ padding: "6px 10px", border: "1px solid #d2d6de", borderRadius: 3, background: "#fff", color: "#e74c3c", fontSize: 12, cursor: "pointer" }}>Remove</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const AddEditModal: React.FC<{ isOpen: boolean; onClose: () => void; onSaved: () => void; owner?: CarOwnerType | null; mode: "add" | "edit" }> = ({ isOpen, onClose, onSaved, owner, mode }) => {
  const isEdit = mode === "edit";
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [dialCode, setDialCode] = useState("+1"); const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState(""); const [address, setAddress] = useState("");
  const [city, setCity] = useState(""); const [vehicles, setVehicles] = useState<VehicleFormRow[]>([emptyVehicle()]);
  const [profileFile, setProfileFile] = useState<File | null>(null); const [profilePreview, setProfilePreview] = useState("");
  const [submitting, setSubmitting] = useState(false); const [attempted, setAttempted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const pRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setAttempted(false); setApiError(null);
    if (isEdit && owner) {
      setName(owner.name || ""); setEmail(owner.email || ""); setDialCode(owner.countryCode || "+1");
      setPhone(owner.phone || ""); setPincode(owner.pincode || ""); setAddress(owner.address || "");
      setCity(owner.city || ""); setProfileFile(null); setProfilePreview(ownerProfileImg(owner));
      setVehicles((owner.myVehicles ?? []).map(v => ({
        _id: v._id, licensePlateNo: v.licensePlateNo || "", vinNo: v.vinNo || "",
        vehicleName: getMakeName(v) === "-" ? "" : getMakeName(v),
        model: getMakeModel(v) === "-" ? "" : getMakeModel(v),
        year: v.year ? String(v.year) : "", odometerReading: v.odometerReading != null ? String(v.odometerReading) : "",
        vehicleImageFile: null, vehicleImagePreview: Array.isArray(v.carImages) && v.carImages[0] ? mediaUrl(v.carImages[0]) : "",
      })) || [emptyVehicle()]);
    } else {
      setName(""); setEmail(""); setDialCode("+1"); setPhone(""); setPincode(""); setAddress(""); setCity("");
      setProfileFile(null); setProfilePreview(""); setVehicles([emptyVehicle()]);
    }
  }, [isOpen, isEdit, owner]);

  function validate(): string | null {
    if (!name.trim()) return "Name is required.";
    if (!email.trim() || !isValidEmail(email)) return "Valid email required.";
    if (phone.replace(/\D/g, "").length !== 10) return "Phone must be 10 digits.";
    if (!pincode.trim()) return "Zip code required.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setAttempted(true);
    const err = validate(); if (err) { setApiError(err); return; }
    setApiError(null);
    const filled = vehicles.filter(v => v.licensePlateNo.trim() || v.vehicleName.trim());
    const fd = new FormData();
    if (isEdit && owner) fd.append("carOwnerId", owner._id);
    fd.append("name", name.trim()); fd.append("email", email.trim());
    fd.append("countryCode", dialCode); fd.append("phone", phone.replace(/\D/g, ""));
    fd.append("pincode", pincode.trim().replace(/\s/g, "").toUpperCase());
    fd.append("address", address.trim().slice(0, 50));
    if (city.trim()) fd.append("city", city.trim());
    if (!isEdit) fd.append("role", "carowner");
    fd.append("vehicles", JSON.stringify(filled.map(v => ({ ...(v._id ? { _id: v._id } : {}), licensePlateNo: v.licensePlateNo.trim(), vinNo: v.vinNo.trim(), vehicleName: v.vehicleName.trim(), model: v.model.trim(), year: v.year.trim(), odometerReading: v.odometerReading.trim() }))));
    if (profileFile) fd.append("profilePhoto", profileFile, profileFile.name);
    filled.forEach((v, idx) => { if (v.vehicleImageFile) fd.append(`carImage_${idx}`, v.vehicleImageFile, v.vehicleImageFile.name); });
    setSubmitting(true);
    try {
      if (isEdit) await axios.put(`${API()}/api/admin/my-customers`, fd, { headers: getToken() });
      else await axios.post(`${API()}/api/admin/onboard-carowner`, fd, { headers: getToken() });
      onSaved(); onClose();
    } catch (err: any) {
      setApiError(err?.response?.data?.message || (isEdit ? "Could not update." : "Could not add."));
    } finally { setSubmitting(false); }
  }

  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", background: "rgba(0,0,0,0.48)", overflowY: "auto", padding: "30px 12px" }}>
      <div style={{ background: "#fff", borderRadius: 4, width: "min(960px,96vw)", boxShadow: "0 8px 32px rgba(0,0,0,0.22)" }}>
        <div style={{ background: "#3c8dbc", color: "#fff", padding: "13px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "4px 4px 0 0" }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{isEdit ? "✏️ Edit Car Owner" : "➕ Add New Car Owner"}</span>
          <button onClick={onClose} disabled={submitting} type="button" style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "22px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#3c8dbc", borderBottom: "2px solid #3c8dbc", paddingBottom: 6, marginBottom: 16, textTransform: "uppercase" }}>Personal Information</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid #d2d6de", background: "#e3f2fd", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {profilePreview ? <img src={profilePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 20, color: "#90caf9", fontWeight: 700 }}>?</span>}
            </div>
            <div>
              <label style={lStyle}>Profile Photo</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input ref={pRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (!f) return; if (profilePreview?.startsWith("blob:")) URL.revokeObjectURL(profilePreview); setProfileFile(f); setProfilePreview(URL.createObjectURL(f)); }} />
                <button type="button" onClick={() => pRef.current?.click()} style={{ padding: "6px 14px", border: "1px solid #d2d6de", borderRadius: 3, background: "#fff", color: "#555", fontSize: 12, cursor: "pointer" }}>{profilePreview ? "Change" : "Upload"}</button>
                {profilePreview && <button type="button" onClick={() => { if (profilePreview?.startsWith("blob:")) URL.revokeObjectURL(profilePreview); setProfileFile(null); setProfilePreview(""); if (pRef.current) pRef.current.value = ""; }} style={{ padding: "6px 10px", border: "1px solid #d2d6de", borderRadius: 3, background: "#fff", color: "#e74c3c", fontSize: 12, cursor: "pointer" }}>Remove</button>}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", marginBottom: 20 }}>
            <div><label style={lStyle}>Full Name *</label><input style={iStyle} value={name} onChange={e => setName(e.target.value.slice(0, 20))} placeholder="Enter full name" />{attempted && !name.trim() && <p style={{ color: "#c0392b", fontSize: 11, margin: "2px 0 0", fontWeight: 600 }}>Required</p>}</div>
            <div><label style={lStyle}>Email *</label><input style={iStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email" />{attempted && !isValidEmail(email) && <p style={{ color: "#c0392b", fontSize: 11, margin: "2px 0 0", fontWeight: 600 }}>Valid email required</p>}</div>
            <div><label style={lStyle}>Phone *</label><div style={{ display: "flex", gap: 6 }}><select value={dialCode} onChange={e => setDialCode(e.target.value)} style={{ ...iStyle, width: 100, flexShrink: 0 }}>{CALLING_CODES.map(c => <option key={c.id + c.code} value={c.code}>{c.flag} {c.code}</option>)}</select><input style={{ ...iStyle, flex: 1 }} type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" /></div>{attempted && phone.replace(/\D/g, "").length !== 10 && <p style={{ color: "#c0392b", fontSize: 11, margin: "2px 0 0", fontWeight: 600 }}>Must be 10 digits</p>}</div>
            <div><label style={lStyle}>Zip / Postal Code *</label><input style={iStyle} value={pincode} onChange={e => setPincode(e.target.value.slice(0, 10))} placeholder="e.g. A1A 1A1" />{attempted && !pincode.trim() && <p style={{ color: "#c0392b", fontSize: 11, margin: "2px 0 0", fontWeight: 600 }}>Required</p>}</div>
            <div><label style={lStyle}>City</label><input style={iStyle} value={city} onChange={e => setCity(e.target.value)} placeholder="Enter city" /></div>
            <div><label style={lStyle}>Role</label><div style={{ ...iStyle, background: "#f5f6f8", color: "#888", fontWeight: 600, cursor: "default" }}>carowner</div></div>
            <div style={{ gridColumn: "1/-1" }}><label style={lStyle}>Address</label><textarea style={{ ...iStyle, minHeight: 60, resize: "vertical", fontFamily: "inherit" }} value={address} onChange={e => setAddress(e.target.value.slice(0, 50))} placeholder="Max 50 chars" rows={2} /></div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#3c8dbc", borderBottom: "2px solid #3c8dbc", paddingBottom: 6, marginBottom: 14, textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Vehicles</span>
            {vehicles.length < 5 && <button type="button" onClick={() => setVehicles(v => [...v, emptyVehicle()])} style={{ fontSize: 12, background: "#3c8dbc", color: "#fff", border: "none", borderRadius: 3, padding: "4px 12px", cursor: "pointer", fontWeight: 600 }}>+ Add Vehicle</button>}
          </div>
          {vehicles.map((v, i) => (
            <VehicleRowForm key={i} v={v} i={i} attempted={attempted} onChange={patch => setVehicles(prev => { const n = [...prev]; n[i] = { ...n[i], ...patch }; return n; })} onRemove={() => setVehicles(prev => prev.filter((_, idx) => idx !== i))} canRemove={vehicles.length > 1} />
          ))}
          {apiError && <div style={{ marginTop: 10, padding: "9px 14px", background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, color: "#c0392b", fontSize: 13 }}>{apiError}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid #f4f4f4" }}>
            <button type="button" onClick={onClose} disabled={submitting} style={{ padding: "8px 22px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#555", fontSize: 14, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ padding: "8px 26px", borderRadius: 3, border: "none", background: submitting ? "#aaa" : "#00a65a", color: "#fff", fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer" }}>{submitting ? "Saving…" : isEdit ? "Save Changes" : "Add Car Owner"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── SEND NOTIFICATION ────────────────────────────────────────────────────────
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
          const res = await axios.post(`${API()}/api/admin/notification/custom/send`, { userType: "carOwner", userIds: ids, title, message: body });
          if (res.data?.success) { setOk("Sent!"); setTimeout(() => { onClose(); onDone(); }, 900); }
          else setErr(res.data?.message || "Failed.");
        } catch (e: any) { setErr(e?.response?.data?.message || "Error."); } finally { setSending(false); }
      }}>
        <div style={{ marginBottom: 12 }}><label style={lStyle}>Title *</label><input style={iStyle} value={title} onChange={e => setTitle(e.target.value)} maxLength={100} disabled={sending} /></div>
        <div style={{ marginBottom: 12 }}><label style={lStyle}>Body *</label><textarea style={{ ...iStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }} value={body} onChange={e => setBody(e.target.value)} rows={3} disabled={sending} /></div>
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

// ─── COLUMN SELECTOR DROPDOWN ─────────────────────────────────────────────────
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
        <div style={{ position: "absolute", right: 0, top: "110%", background: "#fff", border: "1px solid #d2d6de", borderRadius: 3, boxShadow: "0 3px 10px rgba(0,0,0,.15)", zIndex: 200, minWidth: 160, padding: "6px 0" }}>
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

// ─── EXPORT CSV ──────────────────────────────────────────────────────────────
function exportCsv(owners: CarOwnerType[], visibleCols: string[]) {
  const colMap: Record<string, (o: CarOwnerType) => string> = {
    name: o => o.name || "-",
    phone: o => o.phone || "-",
    city: o => o.city || "-",
    date: o => fmtDate(o.createdAt),
    vehicle: o => (o.myVehicles ?? []).map(v => `${getMakeName(v)} ${getMakeModel(v)} ${v.year ?? ""}`).join("; ") || "-",
    autoShops: o => (o.autoshopsReceivedServiceFrom ?? []).map(s => s.businessName).join("; ") || "-",
    jobCard: o => (o.jobCards ?? []).map(c => `#${c.jobNo ?? c._id.slice(-5)}`).join("; ") || "-",
    invoice: () => "-",
    status: o => o.status ?? "Active",
  };
  const cols = ALL_COLUMNS.filter(c => visibleCols.includes(c.key));
  const esc = (v: string) => /[,"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  const header = cols.map(c => esc(c.label)).join(",");
  const rows = owners.map(o => cols.map(c => esc(colMap[c.key]?.(o) ?? "-")).join(",")).join("\n");
  const blob = new Blob([header + "\n" + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `car-owners-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ─── STYLE CONSTANTS ──────────────────────────────────────────────────────────
const thS: React.CSSProperties = { border: "1px solid #d2d6de", background: "#f9fafc", padding: "9px 12px", textAlign: "left", fontWeight: 700, fontSize: 13, color: "#333", whiteSpace: "nowrap" };
const tdS: React.CSSProperties = { border: "1px solid #d2d6de", padding: "9px 12px", fontSize: 13, color: "#555", verticalAlign: "middle" };
const linkBtn: React.CSSProperties = { background: "none", border: "none", color: "#0073b7", cursor: "pointer", padding: 0, fontSize: 12, textDecoration: "underline", fontWeight: 500 };
const pageBtn = (active: boolean, disabled: boolean): React.CSSProperties => ({ border: "1px solid", borderColor: active ? "#0073b7" : "#ddd", background: active ? "#0073b7" : "#fff", color: active ? "#fff" : disabled ? "#bbb" : "#777", padding: "6px 13px", fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", marginLeft: -1 });

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const CarOwners: React.FC = () => {
  const [allOwners, setAllOwners] = useState<CarOwnerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_VISIBLE);

  // ── NEW: toggle between active/inactive view and deleted view ──
  const [showDeleted, setShowDeleted] = useState(false);

  // Modal states
  const [vehiclesFor, setVehiclesFor] = useState<CarOwnerType | null>(null);
  const [shopsFor, setShopsFor] = useState<CarOwnerType | null>(null);
  const [jobCardsFor, setJobCardsFor] = useState<CarOwnerType | null>(null);
  const [profileFor, setProfileFor] = useState<CarOwnerType | null>(null);
  const [addEdit, setAddEdit] = useState<{ open: boolean; mode: "add" | "edit"; owner: CarOwnerType | null }>({ open: false, mode: "add", owner: null });
  const [notifOpen, setNotifOpen] = useState(false);

  const fetchOwners = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await axios.get(`${API()}/api/admin/carowners`, { headers: getToken() });
      console.log(res.data.data);
      if (res.data?.success && Array.isArray(res.data.data)) setAllOwners(res.data.data);
      else setError("Failed to fetch car owners");
    } catch (e: any) { setError(e?.response?.data?.message || "Something went wrong"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOwners(); }, [fetchOwners]);

  const activeOwners = allOwners.filter(o => o.status !== "deleted");
  const deletedOwners = allOwners.filter(o => o.status === "deleted");

  // ── Use the right pool based on showDeleted toggle ──
  const displayOwners = showDeleted ? deletedOwners : activeOwners;

  const filtered = displayOwners.filter(o => {
    const q = search.toLowerCase();
    return (o.name || "").toLowerCase().includes(q) || (o.phone || "").toLowerCase().includes(q) || (o.email || "").toLowerCase().includes(q) || (o.city || "").toLowerCase().includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = Array.from(selectedRows);
  const selCount = selected.length;
  const allPageSel = paginated.length > 0 && paginated.every(o => selectedRows.has(o._id));

  function toggleRow(id: string) { setSelectedRows(prev => { const c = new Set(prev); c.has(id) ? c.delete(id) : c.add(id); return c; }); }

  async function toggleStatus(userId: string, status: "active" | "suspended" | "deleted") {
    try {
      await axios.put(
        `${API()}/api/admin/car-owner/${userId}/status/toggle`,
        { status },
        { headers: getToken() }
      );
      await fetchOwners();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Error toggling status.");
    }
  }

  // Column cell renderer
  function renderCell(owner: CarOwnerType, key: string) {
    const shops = owner.autoshopsReceivedServiceFrom ?? [];
    switch (key) {
      case "name": return <td key={key} style={{ ...tdS, fontWeight: 500 }}><button type="button" onClick={() => setProfileFor(owner)} style={{ ...linkBtn, color: "#8a00d4", fontWeight: 600, fontSize: 13 }}>{owner.name || "-"}</button></td>;
      case "phone": return <td key={key} style={tdS}>{owner.phone || "-"}</td>;
      case "city": return <td key={key} style={tdS}>{owner.city || "-"}</td>;
      case "date": return <td key={key} style={tdS}>{fmtDate(owner.createdAt)}</td>;
      case "vehicle": return <td key={key} style={tdS}>{owner.myVehicles && owner.myVehicles.length > 0 ? <button type="button" onClick={() => setVehiclesFor(owner)} style={linkBtn}>{owner.myVehicles.length}</button> : "-"}</td>;
      case "autoShops": return <td key={key} style={tdS}>{shops.length > 0 ? <button type="button" onClick={() => setShopsFor(owner)} style={linkBtn}>{shops.length}</button> : "-"}</td>;
      case "jobCard": return <td key={key} style={tdS}>{owner.jobCards && owner.jobCards.length > 0 ? <button type="button" onClick={() => setJobCardsFor(owner)} style={linkBtn}>{owner.jobCards.length}</button> : "-"}</td>;
      case "invoice": return <td key={key} style={tdS}>{owner.jobCards && owner.jobCards.length > 0 ? <button type="button" style={linkBtn}>{owner.jobCards.length}</button> : "0"}</td>;
      case "status": {
        let status = (owner.status ?? "active").toLowerCase();
        let bg = "#dff0d8", color = "#3c763d", border = "1px solid #d6e9c6", label = "Active";
        if (status === "suspended") {
          bg = "#ffe7ba"; color = "#b97b16"; border = "1px solid #ffe3bb"; label = "Inactive";
        } else if (status === "deleted") {
          bg = "#f2dede"; color = "#a94442"; border = "1px solid #ebcccc"; label = "Deleted";
        }
        return (
          <td key={key} style={tdS}>
            <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 3, fontSize: 12, fontWeight: 600, background: bg, color, border }}>
              {label}
            </span>
          </td>
        );
      }
      default: return <td key={key} style={tdS}>-</td>;
    }
  }

  const toolbarBtn = (label: string, bg: string, onClick: () => void, disabled = false) => (
    <button type="button" onClick={onClick} disabled={disabled} style={{ padding: "6px 14px", borderRadius: 2, border: "1px solid rgba(0,0,0,0.2)", fontSize: 13, background: disabled ? "#bbb" : bg, color: "#fff", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );

  return (
    <>
      {/* ── MODALS ── */}
      {vehiclesFor && <VehiclesModal owner={vehiclesFor} onClose={() => setVehiclesFor(null)} />}
      {shopsFor && <AutoShopsModal owner={shopsFor} onClose={() => setShopsFor(null)} />}
      {jobCardsFor && <JobCardsModal owner={jobCardsFor} onClose={() => setJobCardsFor(null)} />}
      {profileFor && (
        <ProfileModal
          owner={profileFor}
          onClose={() => setProfileFor(null)}
          onEdit={() => { setAddEdit({ open: true, mode: "edit", owner: profileFor }); setProfileFor(null); }}
          toggleStatus={(id, newStatus) =>
            toggleStatus(id, newStatus as "active" | "suspended" | "deleted")
          }
        />
      )}


      <AddEditModal isOpen={addEdit.open} onClose={() => setAddEdit(s => ({ ...s, open: false }))} onSaved={() => { setAddEdit(s => ({ ...s, open: false })); fetchOwners(); }} owner={addEdit.owner} mode={addEdit.mode} />
      <SendNotifModal isOpen={notifOpen} onClose={() => setNotifOpen(false)} ids={selected} onDone={() => {}} />

      {/* ── PAGE ── */}
      <div className="h-[92vh] overflow-y-auto bg-[#f0f0f0] px-6 py-5 font-sans">

        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1 style={{ fontSize: 34, fontWeight: 300, color: "#333", margin: 0 }}>
            {showDeleted ? "Deleted Car Owners" : "Car Owners"}
          </h1>
          {/* Only show Add New button when not in deleted view */}
          {!showDeleted && (
            <button
              onClick={() => setAddEdit({ open: true, mode: "add", owner: null })}
              style={{ background: "#00a65a", color: "#fff", padding: "8px 18px", borderRadius: 4, border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer" }}
            >
              + Add New
            </button>
          )}
        </div>

        <div className="mb-4" style={{ background: "#fff", border: "1px solid #d2d6de", borderRadius: 3, boxShadow: "0 1px 1px rgba(0,0,0,.1)" }}>
          {/* ── Toolbar ── */}
          <div style={{ padding: "8px 14px", background: "#d2d6de", borderBottom: "1px solid #bbb", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {/* Always visible */}
            {toolbarBtn("✉ Send Notification", "#555", () => { if (!selCount) { alert("Select at least one."); return; } setNotifOpen(true); }, false)}
            {toolbarBtn("WhatsApp", "#25d366", () => {}, false)}
            {toolbarBtn("↓ Export XL", "#555", () => { if (!selCount) { alert("Select at least one."); return; } exportCsv(allOwners.filter(o => selectedRows.has(o._id)), visibleCols); }, false)}

            {/* Active/Inactive view actions — hidden in deleted view */}
            {!showDeleted && selCount === 1 && toolbarBtn("Update", "#555", () => { const o = allOwners.find(x => x._id === selected[0]); if (o) setAddEdit({ open: true, mode: "edit", owner: o }); })}
            {!showDeleted && selCount === 1 && toolbarBtn("🗑 Delete", "#e74c3c", async () => {
              const owner = allOwners.find(o => o._id === selected[0]);
              if (!owner) return;
              if (window.confirm(`Delete ${owner.name}?`)) {
                await toggleStatus(selected[0], "deleted");
                setSelectedRows(new Set());
              }
            })}
            {!showDeleted && selCount === 1 && (() => {
              const owner = allOwners.find(o => o._id === selected[0]);
              if (!owner) return null;
              if (owner.status === "suspended") {
                return toolbarBtn("▶ Set Active", "#27ae60", async () => {
                  if (window.confirm(`Set ${owner.name} as Active?`)) {
                    await toggleStatus(selected[0], "active");
                    setSelectedRows(new Set());
                  }
                });
              } else {
                return toolbarBtn("⏸ Set Inactive", "#b97b16", async () => {
                  if (window.confirm(`Set ${owner.name} as Inactive?`)) {
                    await toggleStatus(selected[0], "suspended");
                    setSelectedRows(new Set());
                  }
                });
              }
            })()}
       
            {!showDeleted && selCount === 1 && toolbarBtn("🖨 Print", "#00c0ef", () => { const o = allOwners.find(x => x._id === selected[0]); if (o) printOwner(o); })}

            {/* Deleted view action — restore */}
            {showDeleted && selCount === 1 && toolbarBtn("♻️ Restore Active", "#27ae60", async () => {
              const owner = allOwners.find(o => o._id === selected[0]);
              if (!owner) return;
              if (window.confirm(`Restore ${owner.name} as Active?`)) {
                await toggleStatus(selected[0], "active");
                setSelectedRows(new Set());
              }
            })}

            {/* Live search */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                style={{ height: 30, width: 170, border: "1px solid #bbb", borderRadius: 2, padding: "0 10px", fontSize: 13, outline: "none" }}
                placeholder="Live Search here"
              />
              {selCount > 0 && <span style={{ fontSize: 12, color: "#555", fontWeight: 600, whiteSpace: "nowrap" }}>{selCount} selected</span>}
              <ColSelector visible={visibleCols} onChange={setVisibleCols} />
            </div>
          </div>

          {/* Card Body */}
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#333", marginBottom: 14 }}>
              <span>Show</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ height: 32, border: "1px solid #d2d6de", borderRadius: 3, padding: "0 8px", fontSize: 14, outline: "none" }}>
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>entries</span>
            </div>

            {loading && <div style={{ textAlign: "center", padding: "40px 0", color: "#888" }}>Loading car owners…</div>}
            {error && <div style={{ textAlign: "center", padding: "30px 0", color: "#c0392b" }}>Error: {error}</div>}

            {!loading && !error && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr>
                      <th style={thS}>
                        <input
                          type="checkbox"
                          checked={allPageSel}
                          onChange={e => {
                            setSelectedRows(prev => {
                              const c = new Set(prev);
                              paginated.forEach(o => e.target.checked ? c.add(o._id) : c.delete(o._id));
                              return c;
                            });
                          }}
                        />
                      </th>
                      {ALL_COLUMNS.filter(c => visibleCols.includes(c.key)).map(c => <th key={c.key} style={thS}>{c.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={visibleCols.length + 1} style={{ ...tdS, textAlign: "center", color: "#aaa", padding: "36px 0" }}>
                          {showDeleted ? "No deleted car owners found." : "No car owners found."}
                        </td>
                      </tr>
                    )}
                    {paginated.map(owner => (
                      <tr key={owner._id} style={{ background: selectedRows.has(owner._id) ? "#f0f7ff" : undefined }}>
                        <td style={tdS}><input type="checkbox" checked={selectedRows.has(owner._id)} onChange={() => toggleRow(owner._id)} /></td>
                        {ALL_COLUMNS.filter(c => visibleCols.includes(c.key)).map(c => renderCell(owner, c.key))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !error && (
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <p style={{ margin: 0, fontSize: 14, color: "#333" }}>
                  {filtered.length === 0
                    ? "No entries"
                    : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} entries${search ? ` (filtered from ${displayOwners.length} total)` : ""}`}
                </p>
                <div style={{ display: "flex" }}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={pageBtn(false, currentPage === 1)}>Previous</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(pg => (
                    <button key={pg} onClick={() => setCurrentPage(pg)} style={pageBtn(pg === currentPage, false)}>{pg}</button>
                  ))}
                  {totalPages > 7 && <span style={{ padding: "6px 8px", fontSize: 13 }}>…</span>}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={pageBtn(false, currentPage === totalPages)}>Next</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Toggle View Button (bottom right) ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => {
              setShowDeleted(prev => !prev);
              setCurrentPage(1);
              setSelectedRows(new Set());
              setSearch("");
            }}
            style={{
              padding: "10px 24px",
              borderRadius: 4,
              border: "none",
              background: showDeleted ? "#00a65a" : "#e74c3c",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "background 0.2s",
            }}
          >
            {showDeleted ? (
              <>
                👥 Active / Inactive Users
                <span style={{
                  background: "#fff",
                  color: "#00a65a",
                  borderRadius: "50%",
                  width: 24,
                  height: 24,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                }}>
                  {activeOwners.length}
                </span>
              </>
            ) : (
              <>
                🗑️ Deleted Car Owners
                {deletedOwners.length > 0 && (
                  <span style={{
                    background: "#fff",
                    color: "#e74c3c",
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}>
                    {deletedOwners.length}
                  </span>
                )}
              </>
            )}
          </button>
        </div>

      </div>
    </>
  );
};

export default CarOwners;
