import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

// --- ADD: XLSX FOR EXPORT ---
import * as XLSX from "xlsx";

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
  isFav?: boolean; // <-- added
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
  onboardedBy?: {
    _id: string;
    name?: string;
    email?: string;
  } | null;
  favoriteAutoShops?: BusinessProfileType[];
  autoshopsReceivedServiceFrom?: BusinessProfileType[];
  jobCards?: JobCardTypePopulated[];
};

// --- Derive autoshopsReceivedServiceFrom from jobCards ---
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
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-3xl w-full shadow-lg relative">
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

// --- Utilities ---
function processOpenDays(openDays: string[] | undefined): string {
  if (!openDays) return "-";
  try {
    let val = openDays;
    if (typeof val[0] === "string" && val[0].includes("["))
      val = JSON.parse(openDays[0]);
    if (Array.isArray(val) && typeof val[0] === "string" && val[0].includes("[")) {
      val = JSON.parse(val[0]);
    }
    if (Array.isArray(val)) {
      const flat = val.flat(Infinity).filter(Boolean);
      return flat.join(", ");
    }
    return Array.isArray(val) ? (val as string[]).join(", ") : "-";
  } catch (e) {
    return Array.isArray(openDays) ? openDays.join(", ") : "-";
  }
}

function toShopOverviewProps(shop: BusinessProfileType) {
  const phone = shop.businessPhone ?? "289 274 8591";
  const businessName = shop.businessName ?? "Auto 27 Car Garage";
  const address = shop.businessAddress ?? "2 Fisherman Dr - Unit 9";
  const city =
    shop.pincode && shop.businessAddress
      ? `${shop.businessAddress.includes("Brampton") ? "" : "Brampton, "}ON ${shop.pincode}`
      : shop.city || "Brampton, ON L7A 1B5";
  const openHours = shop.openHours ?? "9:00 AM - 6:00 PM";
  const openDays = shop.openDays ? processOpenDays(shop.openDays) : "Mon - Sat";
  const imageUrl = shop.businessLogo
    ? shop.businessLogo.startsWith("http")
      ? shop.businessLogo
      : `${import.meta.env.VITE_UPLOADS_URL}/${shop.businessLogo.replace(/^\/+/, "")}`
    : "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?q=80&w=1200&auto=format&fit=crop";
  const rating = typeof shop.rating === "number" ? shop.rating : 4.8;
  const reviewCount = typeof shop.reviewCount === "number" ? shop.reviewCount : 142;
  const reviewDate = shop.reviewDate || "01 / 2026";
  const websiteUrl = shop.businessWebsite || shop.businessEmail || "#";
  const directionsUrl =
    shop.directionsUrl ||
    (shop.businessMapLocation
      ? `https://www.google.com/maps?q=${shop.businessMapLocation.lat},${shop.businessMapLocation.lng}`
      : "#");

  let services: string[] = [];
  if (
    shop.myServices &&
    Array.isArray(shop.myServices) &&
    shop.myServices.length > 0
  ) {
    services = shop.myServices.map((s: any) => {
      if (typeof s === "string") return s;
      if (typeof s === "object") {
        if (typeof s.serviceName === "string" && !!s.serviceName.trim()) {
          return s.serviceName;
        }
        if (typeof s?.name === "string" && !!s.name.trim()) {
          return s.name;
        }
        return "Unknown Service";
      }
      return "Unknown Service";
    });
  } else {
    services = [
      "General Repair",
      "Diagnose - Paccer",
      "Diagnose - Communis",
      "Safety On-line",
      "Oil Change",
      "Brake Service",
    ];
  }
  const isFav = typeof shop.isFav === "boolean" ? shop.isFav : false;
  const isOpen = true;
  return {
    phone,
    businessName,
    address,
    city,
    openHours,
    openDays,
    isOpen,
    services,
    rating,
    reviewCount,
    reviewDate,
    websiteUrl,
    directionsUrl,
    imageUrl,
    isFav,
  };
}

const HeartIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    aria-label={filled ? "Favourite" : "Not favourite"}
    fill={filled ? "#ef4444" : "none"}
    stroke={filled ? "#ef4444" : "#ef4444"}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

function ShopOverviewCard(shop: BusinessProfileType) {
  const {
    phone,
    businessName,
    address,
    city,
    openHours,
    openDays,
    isOpen,
    services,
    rating,
    reviewCount,
    reviewDate,
    websiteUrl,
    directionsUrl,
    imageUrl,
    isFav,
  } = toShopOverviewProps(shop);

  const displayServices =
    services && services.length > 0
      ? services
      : [
          "General Repair",
          "Diagnose - Paccer",
          "Diagnose - Communis",
          "Safety On-line",
          "Oil Change",
          "Brake Service",
        ];

  const servicesToShow = displayServices.slice(0, 6);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] relative">
      <div
        className="grid border-b border-slate-200"
        style={{
          gridTemplateColumns:
            "minmax(0, 1.15fr) minmax(0, 0.72fr) minmax(0, 0.72fr) minmax(0, 1.65fr) minmax(52px, 0.30fr)",
          minHeight: 48,
        }}
      >
        <div className="flex items-center justify-center border-r border-slate-200 bg-emerald-50 px-2 py-2 text-center text-[13px] font-bold text-emerald-800">
          <span className="truncate">📞 {phone}</span>
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
          href={websiteUrl}
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
                isOpen ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            <span
              className={`whitespace-nowrap text-[12px] font-semibold ${
                isOpen ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {isOpen ? "OPEN NOW" : "CLOSED"}
            </span>
          </div>
          <div className="text-right text-[11px] leading-snug text-slate-500 ">
            <div className="">{openDays}</div>
            <div className="whitespace-nowrap">{openHours}</div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 bg-amber-50 text-[15px] font-bold text-slate-900">
          <HeartIcon filled={isFav} />
        </div>
      </div>
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
            {address}
            <br />
            {city}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              {isOpen ? "Open" : "Closed"}
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
          <p className="mb-2.5 text-[13px] font-bold text-slate-900">Services</p>
          <ul
            className="grid list-none gap-x-4 gap-y-1.5 p-0"
            style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}
          >
            {servicesToShow.map((service, index) => (
              <li
                key={`${service}-${index}`}
                className="flex min-w-0 items-start gap-1.5 text-[12px] leading-snug text-slate-600"
              >
                <span className="mt-px shrink-0 font-bold text-emerald-500">✓</span>
                <span className="min-w-0">{service}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-3 text-center">
          <span className="text-[26px] font-bold leading-none text-slate-900">
            {Number(rating).toFixed(1)}
          </span>
          <span className="mt-1 text-[13px] tracking-wide text-amber-500">★★★★★</span>
          <span className="mt-1.5 text-[11px] text-slate-500">{reviewCount} Reviews</span>
          <span className="mt-0.5 text-[10px] text-slate-400">{reviewDate}</span>
        </div>
      </div>
      <div
        className="grid items-center gap-2 bg-slate-900 px-4 py-2.5 text-[12px] text-white"
        style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.6fr) minmax(0, 1fr)" }}
      >
        <span className="truncate font-medium">{businessName}</span>
        <span className="truncate text-center text-slate-200">
          {address} • {city}
        </span>
        <span className="truncate text-right text-slate-200">
          {openDays} | {openHours}
        </span>
      </div>
    </div>
  );
}

// // --- AutoShops Received Service From Modal Content ---
// const renderServicedShopsModalContent = (owner: CarOwnerType) => {
//   const shops = getAutoshopsReceivedServiceFrom(owner);
const renderServicedShopsModalContent = (owner: CarOwnerType) => {
  const shops = owner.autoshopsReceivedServiceFrom ?? [];
  return (
    <>
      <div className="mb-6">
        <div className="flex flex-col gap-1 text-sm items-start">
          <span className="text-gray-700 font-medium">
            Owner Email:{" "}
            <span className="font-normal text-gray-600">{owner.email || "-"}</span>
          </span>
          <span className="text-gray-700 font-medium">
            Onboarded By:{" "}
            <span className="font-normal text-gray-600">
              {owner.onboardedBy
                ? owner.onboardedBy.name
                  ? `${owner.onboardedBy.name}${owner.onboardedBy.email ? ` (${owner.onboardedBy.email})` : ""}`
                  : owner.onboardedBy.email
                : "-"}
            </span>
          </span>
        </div>
      </div>
      {shops.length > 0 ? (
        <div className="flex flex-col gap-7">
          {shops.map((shop) => (
            <ShopOverviewCard key={shop._id} {...shop} />
          ))}
        </div>
      ) : (
        <div className="text-gray-400 text-center">No auto shops found for this owner.</div>
      )}
    </>
  );
};

// --- Vehicles ---
function renderVehicleImages(vehicle: VehicleType) {
  const images: { src?: string; label: string }[] = [];
  const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL;
  if (Array.isArray(vehicle.carImages) && vehicle.carImages.length > 0) {
    images.push(
      ...vehicle.carImages.map((img) => ({
        src:
          typeof img === "string"
            ? img.startsWith("http")
              ? img
              : `${UPLOADS_URL}/${img.replace(/^\/+/, "")}`
            : undefined,
        label: "Car Image",
      }))
    );
  }
  if (vehicle.licensePlateFrontImagePath) {
    images.push({
      src: vehicle.licensePlateFrontImagePath.startsWith("http")
        ? vehicle.licensePlateFrontImagePath
        : `${UPLOADS_URL}/${vehicle.licensePlateFrontImagePath.replace(/^\/+/, "")}`,
      label: "Plate Front",
    });
  }
  if (vehicle.licensePlateBackImagePath) {
    images.push({
      src: vehicle.licensePlateBackImagePath.startsWith("http")
        ? vehicle.licensePlateBackImagePath
        : `${UPLOADS_URL}/${vehicle.licensePlateBackImagePath.replace(/^\/+/, "")}`,
      label: "Plate Back",
    });
  }
  if (!images.length) {
    return <div className="text-xs text-gray-400 italic">No images</div>;
  }
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {images.map((img, idx) =>
        img.src ? (
          <div className="flex flex-col items-center" key={idx}>
            <img
              src={img.src}
              alt={img.label}
              className="w-16 h-16 object-cover rounded border"
              loading="lazy"
            />
            <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">{img.label}</span>
          </div>
        ) : null
      )}
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
      <ul className="space-y-3">
        {owner.myVehicles.map((vehicle) => (
          <li
            key={vehicle._id}
            className="border rounded-lg px-4 py-3 bg-gray-50 dark:bg-gray-800"
          >
            <div className="flex flex-wrap justify-between items-center gap-4 mb-1">
              <span className="font-semibold">
                {vehicle.year || "-"} {getMake(vehicle)} {getModel(vehicle)}
              </span>
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-300 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 mb-2">
              <div>
                <span className="font-medium">License Plate:</span>{" "}
                {vehicle.licensePlateNo || "-"}
              </div>
              <div>
                <span className="font-medium">Odometer:</span>{" "}
                {vehicle.odometerReading !== undefined ? vehicle.odometerReading : "-"}
              </div>
              <div>
                <span className="font-medium">VIN No.:</span> {vehicle.vinNo || "-"}
              </div>
              <div>
                <span className="font-medium">Created At:</span>{" "}
                {vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleString() : "-"}
              </div>
              <div>
                <span className="font-medium">Updated At:</span>{" "}
                {vehicle.updatedAt ? new Date(vehicle.updatedAt).toLocaleString() : "-"}
              </div>
            </div>
            {renderVehicleImages(vehicle)}
          </li>
        ))}
      </ul>
    ) : (
      <div className="text-gray-400 text-center">No vehicles found.</div>
    )}
  </>
);

function renderCustomerSummary(customer: any) {
  return customer
    ? `${customer.name ?? "-"}${customer.email ? ` (${customer.email})` : ""}`
    : "-";
}
function renderJobCardServices(services: any[]) {
  if (!services || !services.length) return "-";
  return (
    <ul className="ml-1 space-y-3">
      {services.map((service, idx) => (
        <li
          key={service.id?._id ?? idx}
          className="border-b pb-2 mb-2 last:border-0 last:pb-0 last:mb-0"
        >
          {service.id ? (
            <div>
              <div>
                <span className="font-medium">Service:</span> {service.id.name}
              </div>
              {service.id.desc && (
                <div>
                  <span className="font-medium text-xs">Desc:</span> {service.id.desc}
                </div>
              )}
            </div>
          ) : (
            "-"
          )}
          {service.subServices && service.subServices.length > 0 && (
            <div className="ml-2">
              <span className="font-medium text-xs">Selected SubServices:</span>
              <ul className="ml-4 list-[circle] text-xs">
                {service.subServices.map((sub: any, j: number) => (
                  <li key={sub.id || j}>
                    <span>
                      {typeof sub.price === "number" && <>Price: ₹{sub.price}</>}
                      {typeof sub.discountedPrice === "number" && (
                        <> | Discounted: ₹{sub.discountedPrice}</>
                      )}
                      {typeof sub.discountAmount === "number" && (
                        <> | Discount: ₹{sub.discountAmount}</>
                      )}
                    </span>
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
  card: JobCardTypePopulated;
  idx: number;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ card, idx, isOpen, onToggle }) => {
  const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL;
  const cardServices = (card as any).services;
  return (
    <div className="rounded-xl border bg-gray-50 dark:bg-gray-800 shadow w-full mx-auto">
      <button
        onClick={onToggle}
        className={`w-full flex justify-between items-center p-5 focus:outline-none focus-visible:ring text-left transition-colors ${
          isOpen ? "border-b border-gray-200 dark:border-gray-700" : ""
        }`}
        aria-expanded={isOpen}
        aria-controls={`jobcard-body-${card._id}-${idx}`}
        type="button"
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-blue-700 dark:text-blue-400">
            Job Card #{idx + 1}
          </span>
        </div>
        <div className="flex flex-col items-end min-w-[160px] gap-0">
          <span className="block text-xs font-medium text-gray-600 dark:text-gray-300">
            Payment:{" "}
            <span
              className={`font-bold ${
                (card as any).paymentStatus === "PAID" ? "text-green-600" : "text-red-600"
              }`}
            >
              {(card as any).paymentStatus}
            </span>
          </span>
          <span className="block text-xs font-medium text-gray-600 dark:text-gray-300">
            Total Payable:{" "}
            <span className="font-bold text-gray-900 dark:text-gray-100">
              ₹{(card as any).totalPayableAmount}
            </span>
          </span>
        </div>
        {isOpen ? (
          <span className="ml-3 text-xl text-gray-500 dark:text-gray-300 font-bold">&#9650;</span>
        ) : (
          <span className="ml-3 text-xl text-gray-300 dark:text-gray-600 font-bold">&#9660;</span>
        )}
      </button>
      {isOpen && (
        <div id={`jobcard-body-${card._id}-${idx}`} className="p-5 pt-0 animate-fadein">
          <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-start">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400">
                {(card as any).createdAt && (
                  <span>Created: {new Date((card as any).createdAt).toLocaleString()}</span>
                )}
                {(card as any).updatedAt && (
                  <span>Updated: {new Date((card as any).updatedAt).toLocaleString()}</span>
                )}
              </div>
              <div className="mt-2">
                <span className="font-semibold text-sm">Business:</span>
                <div className="ml-2">{card.business?.businessName ?? "-"}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <div className="font-medium text-sm mb-1">Vehicle Info</div>
              <div className="text-xs pl-2">
                <div>
                  <span className="font-medium">Plate No:</span>{" "}
                  {(card as any).vehicleId?.licensePlateNo || "-"}
                </div>
              </div>
              <div className="mt-3 text-xs space-y-1">
                <div>
                  <span className="font-medium">Customer:</span>{" "}
                  {renderCustomerSummary((card as any).customerId)}
                </div>
              </div>
            </div>
            <div>
              <div className="font-medium text-sm mb-1">Services</div>
              {Array.isArray(cardServices) && cardServices.length > 0
                ? renderJobCardServices(cardServices)
                : <span className="ml-2 text-gray-500">-</span>}
              <div className="mt-4">
                <span className="font-medium">Vehicle Photos:</span>
                {(card as any).vehiclePhotos && (card as any).vehiclePhotos.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(card as any).vehiclePhotos.map((photo: string, idx: number) => (
                      <img
                        key={idx}
                        src={
                          typeof photo === "string"
                            ? photo.startsWith("http")
                              ? photo
                              : `${UPLOADS_URL}/${photo.replace(/^\/+/, "")}`
                            : ""
                        }
                        alt={`vehicle-photo-${idx + 1}`}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ))}
                  </div>
                ) : (
                  <span className="ml-2 text-gray-400 italic">No photos</span>
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
  React.useEffect(() => {
    setOpenIdx(null);
  }, [owner]);
  if (!owner.jobCards || owner.jobCards.length < 1) {
    return <div className="text-gray-400 text-center">No job cards found.</div>;
  }
  return (
    <div className="flex flex-col gap-6">
      {owner.jobCards.map((card, idx) => (
        <JobCardPanel
          key={card._id}
          card={card}
          idx={idx}
          isOpen={openIdx === idx}
          onToggle={() => setOpenIdx(openIdx === idx ? null : idx)}
        />
      ))}
    </div>
  );
};

// --- Main Component ---
const CarOwners: React.FC = () => {
  const [carOwners, setCarOwners] = useState<CarOwnerType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [openVehiclesFor, setOpenVehiclesFor] = useState<CarOwnerType | null>(null);
  const [openServicedShopsFor, setOpenServicedShopsFor] = useState<CarOwnerType | null>(null);
  const [openJobCardsFor, setOpenJobCardsFor] = useState<CarOwnerType | null>(null);

  // --- ADDED: selectedRows State ---
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const fetchCarOwners = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/carowners`);
      if (res.data.success && Array.isArray(res.data.data)) {
        setCarOwners(res.data.data);
        console.log(res.data);
      } else {
        setError("Failed to fetch car owners");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarOwners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- ADDED: Handlers for Selection & Export ---
  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) {
        copy.delete(id);
      } else {
        copy.add(id);
      }
      return copy;
    });
  };

  const isRowSelected = (id: string) => selectedRows.has(id);

  const exportSelected = () => {
    const ownersToExport = carOwners.filter(owner => selectedRows.has(owner._id));
    if (ownersToExport.length === 0) {
      alert("Please select at least one Car Owner to export.");
      return;
    }

    // Utility for Vehicle Details in one cell
    function vehicleDetailsString(vehicles?: VehicleType[]): string {
      if (!vehicles || vehicles.length === 0) return "-";
      return vehicles.map(v => {
        return `${v.licensePlateNo ? v.licensePlateNo : "-"}` +
          ` (${typeof v.make === "object" && v.make ? (v.make.name || "-") : "-"}` +
          `, ${typeof v.make === "object" && v.make ? (v.make.model || "-") : "-"}` +
          `, ${v.year || "-"})`;
      }).join('\n');
    }

    // Utility for Serviced AutoShops
    function shopsString(shops?: BusinessProfileType[]): string {
      if (!shops || shops.length === 0) return "-";
      return shops.map(s =>
        `${s.businessName || "-"}${s.businessPhone ? " (" + s.businessPhone + ")" : ""}`
      ).join('\n');
    }

    // Utility for JobCard Numbers (IDs)
    function jobCardsString(jobCards?: JobCardTypePopulated[]): string {
      console.log(jobCards);
      if (!jobCards || jobCards.length === 0) return "-";
      // If JobCards have a jobCardNumber property use that, else use _id or an increment number
      return jobCards.map((jc) =>
        (jc as any).jobNo
          ? String((jc as any).jobNo)
          : jc._id
      ).join('\n');
 
    }

    // Compose Excel rows
    const data = ownersToExport.map(owner => {
      const shops = owner.autoshopsReceivedServiceFrom ?? getAutoshopsReceivedServiceFrom(owner);

      return {
        "Name": owner.name || "-",
        "Phone": owner.phone || "-",
        "Country Code": owner.countryCode || "-",
        "Address": owner.address || "-",
        "Pincode": owner.pincode || "-",
        "Profile Complete": owner.isProfileComplete ? "Yes" : "No",
        "Disabled": owner.isDisabled ? "Yes" : "No",
        "Vehicles": vehicleDetailsString(owner.myVehicles),
        "Serviced AutoShops": shopsString(shops),
        "Job Cards": jobCardsString(owner.jobCards)
      };
    });

    // Sheet and Download
    const ws = XLSX.utils.json_to_sheet(data, { skipHeader: false });

    // Style: row height for newline in cells
    // not part of core XLSX, but Excel displays line breaks from "\n" in plain cells

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Car Owners");
    XLSX.writeFile(wb, "car-owners.xlsx");
  };

  // --- ADD: Toolbar for Export ---
  return (
    <>
      {openVehiclesFor && (
        <Modal
          isOpen={!!openVehiclesFor}
          onClose={() => setOpenVehiclesFor(null)}
          title={`Vehicles for ${openVehiclesFor.name}`}
        >
          {renderVehiclesModalContent(openVehiclesFor)}
        </Modal>
      )}
      {openServicedShopsFor && (
        <Modal
          isOpen={!!openServicedShopsFor}
          onClose={() => setOpenServicedShopsFor(null)}
          title={`Auto Shops (Received Service) for ${openServicedShopsFor.name}`}
        >
          {renderServicedShopsModalContent(openServicedShopsFor)}
        </Modal>
      )}
      {openJobCardsFor && (
        <Modal
          isOpen={!!openJobCardsFor}
          onClose={() => setOpenJobCardsFor(null)}
          title={`Job Cards for ${openJobCardsFor.name}`}
        >
          <RenderJobCardsModalContent owner={openJobCardsFor} />
        </Modal>
      )}

      <div className="overflow-y-auto h-full pb-20 rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-4">
        {/* Export & Selection toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
          <h2 className="text-xl font-semibold">Car Owners</h2>
          <div className="flex items-center gap-3">
            <button
              className="text-white bg-blue-600 hover:bg-blue-700 text-xs font-semibold px-4 py-2 rounded shadow disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ whiteSpace: "nowrap" }}
              onClick={exportSelected}
              disabled={selectedRows.size === 0}
              title="Export selected Car Owners as Excel"
              type="button"
            >
              Export to Excel
            </button>
            <span className="text-xs text-gray-500">
              {selectedRows.size > 0
                ? `Selected: ${selectedRows.size}`
                : "Select rows to export"}
            </span>
          </div>
        </div>
        {loading && (
          <div className="py-10 text-center font-medium text-gray-600">
            Loading car owners...
          </div>
        )}
        {error && (
          <div className="py-10 text-center font-medium text-red-600">Error: {error}</div>
        )}
        {!loading && !error && (
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-3 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={
                        carOwners.length > 0 && selectedRows.size === carOwners.length
                      }
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedRows(new Set(carOwners.map(o => o._id)));
                        } else {
                          setSelectedRows(new Set());
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Name
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Phone
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Country Code
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Address
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Pincode
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Profile Complete
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Disabled
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Vehicles
                  </TableCell>
                  {/* Renamed from Fav. AutoShops → Serviced AutoShops */}
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Serviced AutoShops
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Job Cards
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {carOwners.length === 0 && (
                  <TableRow>
                    <TableCell className="text-center py-8 text-gray-400" >
                      No car owners found.
                    </TableCell>
                  </TableRow>
                )}
                {carOwners.map((owner) => {
                  const servicedShops = owner.autoshopsReceivedServiceFrom ?? [];
                  return (
                    <TableRow key={owner._id}>
                      <TableCell className="px-3 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                        <input
                          type="checkbox"
                          aria-label="Select row"
                          checked={isRowSelected(owner._id)}
                          onChange={() => toggleRow(owner._id)}
                        />
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                        {owner.name || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {owner.phone || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {owner.countryCode || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {owner.address || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {owner.pincode || "-"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {owner.isProfileComplete ? "Yes" : "No"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {owner.isDisabled ? "Yes" : "No"}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {owner.myVehicles && owner.myVehicles.length > 0 ? (
                          <button
                            className="underline text-blue-600 hover:text-blue-800 text-xs"
                            type="button"
                            onClick={() => setOpenVehiclesFor(owner)}
                          >
                            View All ({owner.myVehicles.length})
                          </button>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      {/* Serviced AutoShops — derived from jobCards */}
                      <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {servicedShops.length > 0 ? (
                          <button
                            className="underline text-blue-600 hover:text-blue-800 text-xs"
                            type="button"
                            onClick={() => setOpenServicedShopsFor(owner)}
                          >
                            View All ({servicedShops.length})
                          </button>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {owner.jobCards && owner.jobCards.length > 0 ? (
                          <button
                            className="underline text-blue-600 hover:text-blue-800 text-xs"
                            type="button"
                            onClick={() => setOpenJobCardsFor(owner)}
                          >
                            View All ({owner.jobCards.length})
                          </button>
                        ) : (
                          "-"
                        )}
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

export default CarOwners;