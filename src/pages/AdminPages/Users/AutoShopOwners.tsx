import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import Badge from "../../../components/ui/badge/Badge";

// ====================
// Types based on data sample for businessProfile with teamMembers and myDeals
// (Unchanged Types)
// ====================

type SubService = {
  subService: string;
};

type IndividualService = {
  name: string;
  desc?: string;
  price?: number;
  _id: string;
};

type Service = {
  _id: string;
  name?: string;
  desc?: string;
  services?: IndividualService[];
  [k: string]: any;
};

type MyService = {
  service: Service;
  subServices?: SubService[];
  [k: string]: any;
};

type TeamMemberType = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  designation?: string;
  photo?: string;
};

type BusinessProfileType = {
  _id: string;
  businessName?: string;
  businessAddress?: string;
  pincode?: string;
  city?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessHSTNumber?: string;
  openHours?: string;
  openDays?: string[];
  businessLogo?: string;
  myServices?: MyService[];
  myDeals?: (string | DealType)[];
  teamMembers?: TeamMemberType[];
  businessMapLocation?: any;
  isOpen?: boolean;
  rating?: number;
  reviewCount?: number;
  reviewDate?: string;
  websiteUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: any;
};

type CustomerType = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
};

type DealType = {
  _id: string;
  name: string;
  description?: string;
  value: string;
  percentageDiscount: number;
  dealEnabled: boolean;
  createdAt?: string;
  endDate?: string;
  couponCode?: string;
  startDate?: string;
  additionalDetails?: string;
  valueId?: string;
  createdBy?: string;
  upto?: number;
  updatedAt?: string;
};

type JobCardDealAppliedType = {
  name: string;
  percentageDiscount?: number;
  dealCode?: string;
};

type JobCardServiceSubServiceType = {
  id: string;
  price?: number;
  discountedPrice?: number;
  discountAmount?: number;
};

type JobCardServiceType = {
  id: string;
  subServices: JobCardServiceSubServiceType[];
};

type JobCardType = {
  _id: string;
  jobNo: string;
  business: string;
  customerId: string;
  vehicleId: string;
  odometerReading: number;
  issueDescription: string;
  serviceType: string;
  priorityLevel: string;
  services: JobCardServiceType[];
  additionalNotes?: string;
  vehiclePhotos: string[];
  dealApplied?: JobCardDealAppliedType;
  totalPayableAmount: number;
  paymentStatus: string;
  technicalRemarks?: string;
  createdAt?: string;
  updatedAt?: string;
};

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
};

// ShopOverviewCard, Modal, Badge helpers, etc.: unchanged

const ShopOverviewCard: React.FC<{ shopData: BusinessProfileType }> = ({
  shopData = {},
}) => {
  // Destructure with fallbacks
  const {
    businessPhone = "289 274 8591",
    businessName = "Auto 27 Car Garage",
    businessAddress = "2 Fisherman Dr - Unit 9",
    city = shopData.city || "Brampton, ON L7A 1B5",
    openHours = "9:00 AM - 6:00 PM",
    openDays = shopData.openDays
      ? Array.isArray(shopData.openDays)
        ? shopData.openDays.length === 1 &&
          typeof shopData.openDays[0] === "string" &&
          shopData.openDays[0].trim().startsWith("[")
          ? (() => {
              try {
                return JSON.parse(shopData.openDays[0]).join(", ");
              } catch {
                return shopData.openDays.join(", ");
              }
            })()
          : shopData.openDays.join(", ")
        : shopData.openDays
      : "Mon - Sat",
    isOpen = true,
    myServices = [],
    businessLogo,
    businessEmail = "",
    websiteUrl = "#",
    businessMapLocation,
    pincode,
    rating = 4.8,
    reviewCount = 142,
    reviewDate = "01 / 2026",
  } = shopData || {};

  let services: string[] = [];
  if (Array.isArray(myServices) && myServices.length > 0) {
    // Gather service names, fall back if none
    for (const item of myServices) {
      if (item?.service?.name) {
        services.push(item.service.name);
      }
    }
  }
  if (services.length === 0) {
    services = [
      "General Repair",
      "Diagnose - Paccer",
      "Diagnose - Communis",
      "Safety On-line",
      "Oil Change",
      "Brake Service",
    ];
  }
  const servicesToShow = services.slice(0, 6);

  // Shop logo or fallback image
  let imageUrl =
    businessLogo && typeof businessLogo === "string"
      ? businessLogo.startsWith("http")
        ? businessLogo
        : `${import.meta.env.VITE_IMAGE_URL ?? ""}/${businessLogo}`
      : "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?q=80&w=1200&auto=format&fit=crop";

  // Directions URL (use businessMapLocation if provided, or fallback)
  let directionsUrl = "#";
  if (businessMapLocation?.lat && businessMapLocation?.lng) {
    directionsUrl = `https://www.google.com/maps/search/?api=1&query=${businessMapLocation.lat},${businessMapLocation.lng}`;
  }

  // Website url
  let webUrl =
    websiteUrl && websiteUrl !== "#"
      ? websiteUrl
      : businessEmail
      ? `mailto:${businessEmail}`
      : "#";

  // Status open logic: You can adjust based on business hours, for now fallback true
  const statusOpen = isOpen;

  return (
    // ...as in original code...
    // (No changes made here)
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] mb-7">
      {/* Top action bar */}
      <div
        className="grid border-b border-slate-200"
        style={{
          gridTemplateColumns:
            "minmax(0, 1.15fr) minmax(0, 0.72fr) minmax(0, 0.72fr) minmax(0, 1.65fr) minmax(52px, 0.55fr)",
          minHeight: 48,
        }}
      >
        <div className="flex items-center justify-center border-r border-slate-200 bg-emerald-50 px-2 py-2 text-center text-[13px] font-bold text-emerald-800">
          <span className="truncate">📞 {businessPhone}</span>
        </div>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center border-r border-slate-200 bg-sky-50 text-[13px] font-semibold text-blue-600 no-underline transition-colors hover:bg-sky-100"
        >
          Directions
        </a>

        <a
          href={webUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center border-r border-slate-200 bg-slate-50 text-[13px] font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-100"
        >
          Website
        </a>

        <div className="flex min-w-0 items-center justify-between gap-2 border-r border-slate-200 bg-white px-3 py-2">
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                statusOpen ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            <span
              className={`whitespace-nowrap text-[12px] font-semibold ${
                statusOpen ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {statusOpen ? "OPEN NOW" : "CLOSED"}
            </span>
          </div>
          <div className="text-right text-[11px] leading-snug text-slate-500">
            <div className="whitespace-nowrap">{openDays}</div>
            <div className="whitespace-nowrap">{openHours}</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 bg-amber-50 text-[15px] font-bold text-slate-900">
          <span className="text-amber-500">★</span>
          {rating}
        </div>
      </div>

      {/* Main content */}
      <div
        className="grid items-start gap-5 p-5"
        style={{
          gridTemplateColumns:
            "minmax(120px, 150px) minmax(0, 1.25fr) minmax(0, 1.1fr) minmax(100px, 118px)",
        }}
      >
        <img
          src={imageUrl}
          alt={businessName}
          className="h-[108px] w-full rounded-lg object-cover"
        />

        <div className="min-w-0">
          <h2 className="mb-1.5 text-xl font-bold leading-tight text-slate-900">
            {businessName}
          </h2>
          <p className="mb-3 text-[13px] leading-relaxed text-slate-600">
            {businessAddress}
            <br />
            {city}
            {pincode && (
              <>
                <br />
                Pincode: {pincode}
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              {statusOpen ? "Open" : "Closed"}
            </span>
            <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] text-blue-700">
              {openDays}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600">
              {openHours}
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="mb-2.5 text-[13px] font-bold text-slate-900">
            Services
          </p>
          <ul
            className="grid list-none gap-x-4 gap-y-1.5 p-0"
            style={{
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            }}
          >
            {servicesToShow.map((service, index) => (
              <li
                key={`${service}-${index}`}
                className="flex min-w-0 items-start gap-1.5 text-[12px] leading-snug text-slate-600"
              >
                <span className="mt-px shrink-0 font-bold text-emerald-500">
                  ✓
                </span>
                <span className="min-w-0">{service}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-3 text-center">
          <span className="text-[26px] font-bold leading-none text-slate-900">
            {rating}
          </span>
          <span className="mt-1 text-[13px] tracking-wide text-amber-500">
            ★★★★★
          </span>
          <span className="mt-1.5 text-[11px] text-slate-500">
            {reviewCount} Reviews
          </span>
          <span className="mt-0.5 text-[10px] text-slate-400">{reviewDate}</span>
        </div>
      </div>

      {/* Footer */}
      <div
        className="grid items-center gap-2 bg-slate-900 px-4 py-2.5 text-[12px] text-white"
        style={{
          gridTemplateColumns:
            "minmax(0, 1fr) minmax(0, 1.6fr) minmax(0, 1fr)",
        }}
      >
        <span className="truncate font-medium">{businessName}</span>
        <span className="truncate text-center text-slate-200">
          {businessAddress} • {city}
        </span>
        <span className="truncate text-right text-slate-200">
          {openDays} | {openHours}
        </span>
      </div>
    </div>
  );
};

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-7xl w-full shadow-lg relative mx-10">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            className="text-xl font-bold text-gray-500 hover:text-gray-800 px-2"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  );
};

// Helper badge/status functions: unchanged
function getStatus(owner: AutoShopOwnerType) {
  if (owner.isDisabled) return "Suspended";
  if (
    owner.isProfileComplete &&
    (owner.isBusinessProfileCompleted ?? owner.businessProfile)
  )
    return "Active";
  if (!owner.isProfileComplete) return "Incomplete Profile";
  return "Unknown";
}
function getStatusColor(owner: AutoShopOwnerType) {
  if (owner.isDisabled) return "warning";
  if (
    owner.isProfileComplete &&
    (owner.isBusinessProfileCompleted ?? owner.businessProfile)
  )
    return "success";
  if (!owner.isProfileComplete) return "error";
  return "default";
}

// Export helpers: unchanged
function toCsv(data: string[][], headers: string[]): string {
  const escapeCsv = (val: any) => {
    if (val == null) return "";
    let s = String(val);
    if (/[,\"\n]/.test(s)) {
      s = '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  return (
    headers.map(escapeCsv).join(",") +
    "\n" +
    data.map((row) => row.map(escapeCsv).join(",")).join("\n")
  );
}
function downloadAsFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function autoShopOwnersToCsvRows(
  owners: AutoShopOwnerType[]
): [string[], string[][]] {
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Shop Name",
    "Shop Address",
    "Shop City",
    "Pincode",
    "Status",
    "Customers Count",
    "Deals Count",
    "JobCards Count",
    "Created At",
    "Profile Complete",
    "Business Profile Complete",
  ];
  const rows = owners.map((owner) => [
    owner.name ?? "",
    owner.email ?? "",
    (owner.countryCode ? owner.countryCode + " " : "") + (owner.phone ?? ""),
    owner.businessProfile?.businessName ?? "",
    owner.businessProfile?.businessAddress ?? "",
    owner.businessProfile?.city ?? "",
    owner.businessProfile?.pincode ?? "",
    getStatus(owner),
    owner.myCustomers ? owner.myCustomers.length.toString() : "0",
    owner.deals ? owner.deals.length.toString() : "0",
    owner.jobCards ? owner.jobCards.length.toString() : "0",
    owner.createdAt ? new Date(owner.createdAt).toLocaleString() : "",
    owner.isProfileComplete ? "Yes" : "No",
    (owner.isBusinessProfileCompleted ?? !!owner.businessProfile) ? "Yes" : "No",
  ]);
  return [headers, rows];
}

// --- Send Custom Notification Modal ---
const SendNotificationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  selectedOwnerIds: string[];
  onSuccess: () => void;
}> = ({ isOpen, onClose, selectedOwnerIds, onSuccess }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const ownersCount = selectedOwnerIds.length;

  const resetForm = () => {
    setTitle("");
    setBody("");
    setError(null);
    setSuccessMsg(null);
    setSending(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!title.trim() || !body.trim()) {
      setError("Please provide both title and message body");
      return;
    }
    if (!Array.isArray(selectedOwnerIds) || selectedOwnerIds.length === 0) {
      setError("No shop owners selected.");
      return;
    }
    setSending(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/notification/custom/send`,
        {
          userType:"autoshopowner",
          userIds: selectedOwnerIds,
          title,
          message: body,
        }
      );
      if (res.data.success) {
        setSuccessMsg("Notification sent successfully!");
        onSuccess();
        setTimeout(handleClose, 1500);
      } else {
        setError(res.data.message || "Failed to send notification");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          (err?.message || "Failed to send notification")
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send Custom Notification">
      <form className="space-y-5 max-w-lg mx-auto" onSubmit={handleSend}>
        <div>
          <label className="block font-semibold mb-1" htmlFor="noti-title">
            Notification Title
          </label>
          <input
            id="noti-title"
            type="text"
            className="w-full border-gray-300 rounded px-3 py-2"
            value={title}
            disabled={sending}
            onChange={e => setTitle(e.target.value)}
            maxLength={80}
            placeholder="Eg. Important update for your shop account"
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1" htmlFor="noti-body">
            Notification Body
          </label>
          <textarea
            id="noti-body"
            className="w-full border-gray-300 rounded px-3 py-2 min-h-[92px]"
            value={body}
            onChange={e => setBody(e.target.value)}
            disabled={sending}
            maxLength={240}
            placeholder="Write your message to send to selected shop owners..."
            required
          />
        </div>
        {error ? <div className="text-red-600 text-sm">{error}</div> : null}
        {successMsg ? (
          <div className="text-green-600 text-sm">{successMsg}</div>
        ) : null}
        <div className="flex items-center gap-4 justify-end mt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={sending}
            className="px-4 py-2 rounded bg-slate-100 text-gray-850 hover:bg-slate-200 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={sending}
            className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-2"
          >
            {sending && (
              <svg
                className="animate-spin mr-2 h-4 w-4 text-white"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            <span>
              Send Notification to {ownersCount} shop owner
              {ownersCount > 1 ? "s" : ""}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

// New: Job Card Detail Modal
const JobCardDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  card: JobCardType | null;
  owner: AutoShopOwnerType | null;
  UPLOADS_URL: string;
}> = ({ isOpen, onClose, card, owner, UPLOADS_URL }) => {
  // ...unchanged... (as before)
  if (!isOpen || !card || !owner) return null;
  // ...rest of modal unchanged...
  // ...omitted for brevity...
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Job Card Details - ${card._id}`}>
      <div className="space-y-2 text-sm text-gray-800 dark:text-white">
        <div>
          <span className="font-semibold">Job Card No.:</span>{" "}
          {card._id}
        </div>
        <div>
          <span className="font-semibold">Date:</span>{" "}
          {card.createdAt ? new Date(card.createdAt).toLocaleString() : "-"}
        </div>
        <div>
          <span className="font-semibold">Phone:</span>{" "}
          {owner.countryCode ? owner.countryCode + " " : ""}
          {owner.phone || "-"}
        </div>
        <div>
          <span className="font-semibold">Name:</span>{" "}
          {owner.name}
        </div>
        <div>
          <span className="font-semibold">Business:</span> {card.business}
        </div>
        <div>
          <span className="font-semibold">Vehicle ID:</span> {card.vehicleId}
        </div>
        <div>
          <span className="font-semibold">Odometer Reading:</span> {card.odometerReading}
        </div>
        <div>
          <span className="font-semibold">Issue:</span> {card.issueDescription}
        </div>
        <div>
          <span className="font-semibold">Notes:</span> {card.additionalNotes || "-"}
        </div>
        <div>
          <span className="font-semibold">Technical Remarks:</span> {card.technicalRemarks || "-"}
        </div>
        <div>
          <span className="font-semibold">Deal Applied:</span>{" "}
          {card.dealApplied
            ? `${card.dealApplied.name} (${card.dealApplied.dealCode ?? ""}${
                card.dealApplied.percentageDiscount != null
                  ? ` - ${card.dealApplied.percentageDiscount}%`
                  : ""
              })`
            : "-"}
        </div>
        <div>
          <span className="font-semibold">Total Payable:</span> ₹{card.totalPayableAmount}
        </div>
        <div>
          <span className="font-semibold">Payment Status:</span> {card.paymentStatus}
        </div>
        <div>
          <span className="font-semibold">Service Type:</span> {card.serviceType}
        </div>
        <div>
          <span className="font-semibold">Priority:</span> {card.priorityLevel}
        </div>
        <div>
          <span className="font-semibold">Created:</span>{" "}
          {card.createdAt ? new Date(card.createdAt).toLocaleString() : "-"}
        </div>
        {/* Vehicle Photos */}
        {card.vehiclePhotos && card.vehiclePhotos.length > 0 && (
          <div className="pt-3">
            <div className="font-semibold mb-1">Vehicle Photos</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {card.vehiclePhotos.map((photoUrl, idx) => (
                <img
                  key={idx}
                  src={
                    photoUrl.startsWith("http")
                      ? photoUrl
                      : `${UPLOADS_URL ?? ""}/${photoUrl.replace(
                          /^\/+/,
                          ""
                        )}`
                  }
                  alt="Vehicle"
                  className="w-20 h-20 object-cover rounded"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        )}
        {/* Services breakdown if present */}
        {Array.isArray(card.services) && card.services.length > 0 && (
          <div className="pt-2">
            <div className="font-semibold mb-1">Services:</div>
            <ul className="ml-3 list-disc">
              {card.services.map((serv, sidx) => (
                <li key={serv.id + "-" + sidx}>
                  <div>
                    Service ID: <span className="font-mono">{serv.id}</span>
                  </div>
                  {Array.isArray(serv.subServices) && serv.subServices.length > 0 && (
                    <ul className="ml-3 list-disc">
                      {serv.subServices.map((ss, ssidx) => (
                        <li key={ss.id + "-" + ssidx}>
                          SubService ID: <span className="font-mono">{ss.id}</span>
                          {typeof ss.price !== "undefined" && (
                            <span> | ₹{ss.price}</span>
                          )}
                          {typeof ss.discountedPrice !== "undefined" &&
                            ss.discountedPrice !== ss.price && (
                              <span className="ml-2 text-green-700">
                                After Discount: ₹{ss.discountedPrice}
                              </span>
                            )}
                          {typeof ss.discountAmount !== "undefined" &&
                            ss.discountAmount > 0 && (
                              <span className="ml-2 text-red-600">
                                (Discount: ₹{ss.discountAmount})
                              </span>
                            )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
};

// -----------------------------
// Main Component
// -----------------------------
const AutoShopOwners: React.FC = () => {
  const [owners, setOwners] = useState<AutoShopOwnerType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Modal state
  const [customerModalOpen, setCustomerModalOpen] = useState<boolean>(false);
  const [dealsModalOpen, setDealsModalOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [jobCardsModalOpen, setJobCardsModalOpen] = useState<boolean>(false);
  const [modalOwner, setModalOwner] = useState<AutoShopOwnerType | null>(null);

  // Job Card detail modal state
  const [jobCardDetailModalOpen, setJobCardDetailModalOpen] =
    useState<boolean>(false);
  const [selectedJobCard, setSelectedJobCard] =
    useState<JobCardType | null>(null);

  // For disabling/enabling owners
  const [actionLoadingMap, setActionLoadingMap] = useState<{
    [ownerId: string]: boolean;
  }>({});

  const [exporting, setExporting] = useState(false); // Export UI state

  // Selection state
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);

  // Notification modal state
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Vehicle image base url from VITE_UPLOADS_URL
  const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL;

  // Fetch from admin API: admin/autoshopowners
  const fetchOwners = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/autoshopowners`
      );
      if (res.data.success && Array.isArray(res.data.data)) {
        setOwners(res.data.data);
      } else {
        setError("Failed to fetch auto shop owners");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Enable/disable owner by ID (PATCH)
  const changeAutoShopOwnerStatus = async (
    ownerId: string,
    action: "enable" | "disable"
  ) => {
    setActionLoadingMap((prev) => ({ ...prev, [ownerId]: true }));
    try {
      const disable = action === "disable";
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/autoshopowners/toggle-status`,
        { userId: ownerId, disable }
      );
      if (res.data.success) {
        await fetchOwners();
      } else {
        alert("Failed to update status");
      }
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          `Failed to ${action === "enable" ? "enable" : "suspend"} shop owner.`
      );
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [ownerId]: false }));
    }
  };

  // Export handler
  const handleExport = async () => {
    setExporting(true);
    try {
      let dataToExport: AutoShopOwnerType[] = [];
      if (selectedOwnerIds.length > 0) {
        dataToExport = owners.filter((owner) =>
          selectedOwnerIds.includes(owner._id)
        );
      } else {
        alert("Please select at least one row to export.");
        setExporting(false);
        return;
      }
      if (dataToExport.length === 0) {
        alert("No owners selected.");
        setExporting(false);
        return;
      }
      const [headers, rows] = autoShopOwnersToCsvRows(dataToExport);
      const csvString = toCsv(rows, headers);

      downloadAsFile(
        `autoshop-owners-${new Date().toISOString().slice(0, 10)}.csv`,
        csvString
      );
    } catch (err: any) {
      alert("Failed to export data.");
    } finally {
      setExporting(false);
    }
  };

  // For bulk selection
  const isAllSelected =
    owners.length > 0 && selectedOwnerIds.length === owners.length;
  const handleCheckAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedOwnerIds(owners.map((owner) => owner._id));
    } else {
      setSelectedOwnerIds([]);
    }
  };
  const handleCheckRow = (ownerId: string, checked: boolean) => {
    setSelectedOwnerIds((current) => {
      if (checked) {
        return [...current, ownerId];
      } else {
        return current.filter((id) => id !== ownerId);
      }
    });
  };

  useEffect(() => {
    fetchOwners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ...all modal render helpers unchanged...
  // (code below is from original selection, not repeated here for brevity, stays the same)

  // Previous code: renderBusinessProfileModal, renderCustomersModal, etc.
  // ...start unchanged modal code...
  const renderBusinessProfileModal = () => {
    // ...unchanged...
    if (!modalOwner || !modalOwner.businessProfile) return null;
    const bp = modalOwner.businessProfile;

    const renderNestedServices = () => {
      if (!Array.isArray(bp.myServices) || bp.myServices.length === 0) {
        return <div className="text-gray-400">No services listed</div>;
      }
      const serviceMap: {
        [serviceId: string]: { service: Service; subServiceIds: string[] };
      } = {};
      bp.myServices.forEach((ms: MyService) => {
        if (!ms.service || !ms.service._id) return;
        if (!serviceMap[ms.service._id]) {
          serviceMap[ms.service._id] = {
            service: ms.service,
            subServiceIds: [],
          };
        }
        if (Array.isArray(ms.subServices)) {
          serviceMap[ms.service._id].subServiceIds.push(
            ...ms.subServices.map((ss) => ss.subService)
          );
        }
      });
      const grouped = Object.values(serviceMap);
      return (
        <ul className="space-y-4">
          {grouped.map(({ service, subServiceIds }) => (
            <li key={service._id}>
              <div className="font-medium text-base text-gray-700 dark:text-white mb-1">
                {service.name || "-"}
              </div>
              <div className="pl-4">
                {service.services && service.services.length > 0 ? (
                  <ul className="space-y-1 list-disc ml-4">
                    {service.services
                      .filter(
                        (ss) =>
                          subServiceIds.length === 0 ||
                          subServiceIds.includes(ss._id)
                      )
                      .map((ss) => (
                        <li key={ss._id}>
                          <span className="font-normal">{ss.name}</span>
                          {ss.desc && (
                            <span className="ml-2 text-gray-400 text-xs">
                              {ss.desc}
                            </span>
                          )}
                        </li>
                      ))}
                    {service.services.filter(
                      (ss) =>
                        subServiceIds.length === 0 ||
                        subServiceIds.includes(ss._id)
                    ).length === 0 && (
                      <li className="text-gray-400">-</li>
                    )}
                  </ul>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      );
    };

    return (
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title={`Business Profile: ${bp.businessName || "-"}`}
      >
        {/* New Shop Overview Card at the top */}
        <ShopOverviewCard shopData={bp} />

        <div className="space-y-4 mt-8">
          {/* Team Members */}
          <div>
            <div className="font-semibold mb-2">Team Members</div>
            {Array.isArray(bp.teamMembers) && bp.teamMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border">
                  <thead>
                    <tr>
                      <th className="p-2 border-b font-semibold text-left">
                        Photo
                      </th>
                      <th className="p-2 border-b font-semibold text-left">
                        Name
                      </th>
                      <th className="p-2 border-b font-semibold text-left">
                        Email
                      </th>
                      <th className="p-2 border-b font-semibold text-left">
                        Phone
                      </th>
                      <th className="p-2 border-b font-semibold text-left">
                        Designation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bp.teamMembers.map((tm: TeamMemberType) => (
                      <tr key={tm._id}>
                        <td className="p-2 border-b">
                          {tm.photo ? (
                            <img
                              src={
                                tm.photo.startsWith("http")
                                  ? tm.photo
                                  : `${
                                      import.meta.env.VITE_IMAGE_URL ?? ""
                                    }/${tm.photo}`
                              }
                              alt="Team"
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="block bg-gray-200 w-8 h-8 rounded-full" />
                          )}
                        </td>
                        <td className="p-2 border-b">{tm.name}</td>
                        <td className="p-2 border-b">{tm.email || "-"}</td>
                        <td className="p-2 border-b">{tm.phone || "-"}</td>
                        <td className="p-2 border-b">
                          {tm.designation || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-400">No team members</div>
            )}
          </div>
          {/* My Services: Nested Heading (Category), then subservice list */}
          <div>
            <div className="font-semibold mb-2">Services</div>
            {renderNestedServices()}
          </div>
          {/* My Deals - display as detail table if possible */}
          <div>
            <div className="font-semibold mb-2">My Deals</div>
            {Array.isArray(bp.myDeals) && bp.myDeals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border">
                  <thead>
                    <tr>
                      <th className="p-2 border-b font-semibold text-left">
                        Name
                      </th>
                      <th className="p-2 border-b font-semibold text-left">
                        Description
                      </th>
                      <th className="p-2 border-b font-semibold text-left">
                        Discount %
                      </th>
                      <th className="p-2 border-b font-semibold text-left">
                        Coupon
                      </th>
                      <th className="p-2 border-b font-semibold text-left">
                        Enabled
                      </th>
                      <th className="p-2 border-b font-semibold text-left">
                        Valid From
                      </th>
                      <th className="p-2 border-b font-semibold text-left">
                        Ends
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bp.myDeals.map((deal: any) => {
                      if (typeof deal === "string") {
                        return (
                          <tr key={deal}>
                            <td className="p-2 border-b" colSpan={7}>
                              {deal}
                            </td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={deal._id ?? deal.name ?? Math.random()}>
                          <td className="p-2 border-b">
                            {deal.name || "-"}
                          </td>
                          <td className="p-2 border-b max-w-xs whitespace-pre-wrap">
                            {deal.description || "-"}
                          </td>
                          <td className="p-2 border-b">
                            {deal.percentageDiscount ?? 0}%
                          </td>
                          <td className="p-2 border-b">
                            {deal.couponCode || "-"}
                          </td>
                          <td className="p-2 border-b">
                            {deal.dealEnabled ? (
                              <span className="text-green-600 font-medium">
                                Yes
                              </span>
                            ) : (
                              <span className="text-red-500 font-medium">
                                No
                              </span>
                            )}
                          </td>
                          <td className="p-2 border-b">
                            {deal.startDate
                              ? new Date(
                                  deal.startDate
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="p-2 border-b">
                            {deal.endDate
                              ? new Date(deal.endDate).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-400">No shop deals linked</div>
            )}
          </div>
        </div>
      </Modal>
    );
  };

  // Customers Modal unchanged
  const renderCustomersModal = () => {
    // ...unchanged...
    if (!modalOwner) return null;
    return (
      <Modal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title={`Customers of ${modalOwner.name}`}
      >
        {modalOwner.myCustomers && modalOwner.myCustomers.length > 0 ? (
          <div>
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">
                    Name
                  </th>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">
                    Email
                  </th>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">
                    Phone
                  </th>
                </tr>
              </thead>
              <tbody>
                {modalOwner.myCustomers.map((cust) => (
                  <tr key={cust._id}>
                    <td className="p-2 border-b border-gray-50">
                      {cust.name || "-"}
                    </td>
                    <td className="p-2 border-b border-gray-50">
                      {cust.email || "-"}
                    </td>
                    <td className="p-2 border-b border-gray-50">
                      {cust.phone || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-4 text-gray-400">No customers found.</div>
        )}
      </Modal>
    );
  };

  const renderDealsModal = () => {
    // ...unchanged...
    if (!modalOwner) return null;
    return (
      <Modal
        isOpen={dealsModalOpen}
        onClose={() => setDealsModalOpen(false)}
        title={`Deals for ${modalOwner.name}`}
      >
        {modalOwner.deals && modalOwner.deals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">
                    Name
                  </th>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">
                    Description
                  </th>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">
                    Discount %
                  </th>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">
                    Coupon
                  </th>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">
                    Enabled
                  </th>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">
                    Valid From
                  </th>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">
                    Ends
                  </th>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {modalOwner.deals.map((deal) => (
                  <tr key={deal._id}>
                    <td className="p-2 border-b border-gray-50">
                      {deal.name}
                    </td>
                    <td className="p-2 border-b border-gray-50 max-w-xs whitespace-pre-wrap">
                      {deal.description || "-"}
                    </td>
                    <td className="p-2 border-b border-gray-50">
                      {deal.percentageDiscount ?? 0}%
                    </td>
                    <td className="p-2 border-b border-gray-50">
                      {deal.couponCode || "-"}
                    </td>
                    <td className="p-2 border-b border-gray-50">
                      {deal.dealEnabled ? (
                        <span className="text-green-600 font-medium">
                          Yes
                        </span>
                      ) : (
                        <span className="text-red-500 font-medium">No</span>
                      )}
                    </td>
                    <td className="p-2 border-b border-gray-50">
                      {deal.startDate
                        ? new Date(deal.startDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="p-2 border-b border-gray-50">
                      {deal.endDate
                        ? new Date(deal.endDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="p-2 border-b border-gray-50 max-w-xs whitespace-pre-wrap">
                      {deal.additionalDetails || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-4 text-gray-400">No deals found.</div>
        )}
      </Modal>
    );
  };

  const renderJobCardsModal = () => {
    // ...unchanged...
    if (!modalOwner) return null;
    return (
      <Modal
        isOpen={jobCardsModalOpen}
        onClose={() => setJobCardsModalOpen(false)}
        title={`Job Cards for ${modalOwner.name}`}
      >
        {modalOwner.jobCards && modalOwner.jobCards.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr>
                  <th className="p-2 border-b text-left font-semibold">Job Card No.</th>
                  <th className="p-2 border-b text-left font-semibold">Date</th>
                  <th className="p-2 border-b text-left font-semibold">Phone Number</th>
                  <th className="p-2 border-b text-left font-semibold">Name</th>
                </tr>
              </thead>
              <tbody>
                {modalOwner.jobCards.map((card: JobCardType) => (
                  <tr
                    key={card._id}
                    className="hover:bg-blue-50 cursor-pointer"
                    onClick={() => {
                      setSelectedJobCard(card);
                      setJobCardDetailModalOpen(true);
                    }}
                  >
                    <td className="p-2 border-b">{card.jobNo}</td>
                    <td className="p-2 border-b">
                      {card.createdAt
                        ? new Date(card.createdAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="p-2 border-b">
                      {modalOwner.countryCode ? `${modalOwner.countryCode} ` : ""}
                      {modalOwner.phone || "-"}
                    </td>
                    <td className="p-2 border-b">
                      {modalOwner.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Job Card Detail Modal */}
            <JobCardDetailModal
              isOpen={jobCardDetailModalOpen}
              onClose={() => {
                setJobCardDetailModalOpen(false);
                setSelectedJobCard(null);
              }}
              card={selectedJobCard}
              owner={modalOwner}
              UPLOADS_URL={UPLOADS_URL}
            />
          </div>
        ) : (
          <div className="py-4 text-gray-400">No job cards found.</div>
        )}
      </Modal>
    );
  };

  // --- END MODAL CODE ---

  return (
    <>
      {/* Modals */}
      {renderBusinessProfileModal()}
      {renderCustomersModal()}
      {renderDealsModal()}
      {renderJobCardsModal()}

      {/* Send Notification Modal */}
      <SendNotificationModal
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        selectedOwnerIds={selectedOwnerIds}
        onSuccess={() => {}}
      />

      <div className="overflow-y-auto h-full pb-20 rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
          <h2 className="text-xl font-semibold">Auto Shop Owners</h2>
          <div className="ml-auto flex gap-2">
            {/* Send Custom Notification button */}
            <button
              type="button"
              onClick={() => {
                if (!selectedOwnerIds.length) {
                  alert("Select at least one shop owner to send notification.");
                  return;
                }
                setNotificationOpen(true);
              }}
              disabled={loading}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center space-x-2"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m0-4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
                />
              </svg>
              <span>
                Send Notification
                {selectedOwnerIds.length > 0
                  ? ` (${selectedOwnerIds.length} selected)`
                  : ""}
              </span>
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-2"
              disabled={exporting || loading}
            >
              {exporting ? (
                <svg
                  className="animate-spin mr-2 h-4 w-4 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              )}
              <span>
                Export
                {selectedOwnerIds.length > 0
                  ? ` (${selectedOwnerIds.length} selected)`
                  : ""}
                (.csv)
              </span>
            </button>
          </div>
        </div>
        {loading && (
          <div className="py-10 text-center font-medium text-gray-600">
            Loading shop owners...
          </div>
        )}
        {error && (
          <div className="py-10 text-center font-medium text-red-600">
            Error: {error}
          </div>
        )}
        {!loading && !error && (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    {/* Checkbox for select all */}
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleCheckAll}
                      aria-label="Select all shop owners"
                      data-testid="select-all-checkbox"
                    />
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Email
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Phone
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Shop Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Shop Address
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Customers
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Deals
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Job Cards
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Created At
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Profile
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    {/* New column for Enable/Suspend */}
                    Action
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {owners.length === 0 && (
                  <TableRow>
                    <TableCell
                      className="text-center py-8 text-gray-400"
                      isHeader={false}
                    >
                      No auto shop owners found.
                    </TableCell>
                  </TableRow>
                )}
                {owners.map((owner) => {
                  const isSuspended = !!owner.isDisabled;
                  const isLoading = !!actionLoadingMap[owner._id];
                  const isChecked = selectedOwnerIds.includes(owner._id);
                  return (
                    <TableRow key={owner._id}>
                      {/* Checkbox */}
                      <TableCell className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e =>
                            handleCheckRow(owner._id, e.target.checked)
                          }
                          aria-label={`Select ${owner.name}`}
                          data-testid={`select-owner-checkbox-${owner._id}`}
                        />
                      </TableCell>
                      {/* Name */}
                      <TableCell className="px-5 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                        <span className="block font-medium">{owner.name}</span>
                      </TableCell>
                      {/* Email */}
                      <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {owner.email || "-"}
                      </TableCell>
                      {/* Phone */}
                      <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {owner.countryCode ? `${owner.countryCode} ` : ""}
                        {owner.phone || "-"}
                      </TableCell>
                      {/* Shop Name */}
                      <TableCell className="px-5 py-3 text-gray-700 text-theme-sm dark:text-gray-200">
                        {owner.businessProfile?.businessName || "-"}
                      </TableCell>
                      {/* Shop Address */}
                      <TableCell className="px-5 py-3 text-gray-700 text-theme-sm dark:text-gray-200">
                        {owner.businessProfile?.businessAddress || "-"}
                      </TableCell>
                      {/* Status: computed from fields */}
                      <TableCell className="px-5 py-3 text-theme-sm">
                        <Badge size="sm" color={getStatusColor(owner) as any}>
                          {getStatus(owner)}
                        </Badge>
                      </TableCell>
                      {/* My Customers: count (clickable for modal) */}
                      <TableCell className="px-5 py-3 text-theme-sm">
                        <button
                          type="button"
                          onClick={() => {
                            setModalOwner(owner);
                            setCustomerModalOpen(true);
                          }}
                          className="text-blue-600 hover:underline focus:outline-none font-medium"
                          aria-label={`View customers for ${owner.name}`}
                        >
                          {owner.myCustomers && owner.myCustomers.length
                            ? owner.myCustomers.length
                            : "0"}
                        </button>
                      </TableCell>
                      {/* Deals: count (clickable for modal) */}
                      <TableCell className="px-5 py-3 text-theme-sm">
                        <button
                          type="button"
                          onClick={() => {
                            setModalOwner(owner);
                            setDealsModalOpen(true);
                          }}
                          className="text-blue-600 hover:underline focus:outline-none font-medium"
                          aria-label={`View deals for ${owner.name}`}
                        >
                          {owner.deals && owner.deals.length
                            ? owner.deals.length
                            : "0"}
                        </button>
                      </TableCell>
                      {/* Job Cards: count (clickable for modal) */}
                      <TableCell className="px-5 py-3 text-theme-sm">
                        <button
                          type="button"
                          onClick={() => {
                            setModalOwner(owner);
                            setJobCardsModalOpen(true);
                          }}
                          className="text-blue-600 hover:underline focus:outline-none font-medium"
                          aria-label={`View job cards for ${owner.name}`}
                        >
                          {owner.jobCards && owner.jobCards.length
                            ? owner.jobCards.length
                            : "0"}
                        </button>
                      </TableCell>
                      {/* Created At */}
                      <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {owner.createdAt
                          ? new Date(owner.createdAt).toLocaleString()
                          : "-"}
                      </TableCell>
                      {/* Profile/Team: button */}
                      <TableCell className="px-5 py-3 text-theme-sm">
                        <button
                          type="button"
                          onClick={() => {
                            setModalOwner(owner);
                            setProfileModalOpen(true);
                          }}
                          className="text-blue-600 hover:underline focus:outline-none font-medium"
                          aria-label={`View business profile for ${owner.name}`}
                        >
                          View
                        </button>
                      </TableCell>
                      {/* Enable/Suspend */}
                      <TableCell className="px-5 py-3 text-theme-sm">
                        <button
                          type="button"
                          disabled={isLoading}
                          className={`inline-flex items-center space-x-2 font-medium rounded px-3 py-1 ${
                            isSuspended
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                          onClick={() =>
                            changeAutoShopOwnerStatus(
                              owner._id,
                              isSuspended ? "enable" : "disable"
                            )
                          }
                          aria-label={
                            isSuspended
                              ? `Enable ${owner.name}`
                              : `Suspend ${owner.name}`
                          }
                        >
                          {isLoading ? (
                            <svg
                              className="animate-spin h-4 w-4 mr-1 text-gray-500"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-30"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-90"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              />
                            </svg>
                          ) : null}
                          <span>
                            {isSuspended ? "Enable" : "Suspend"}
                          </span>
                        </button>
                        
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
};

export default AutoShopOwners;