import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

// --- TeamMember and Business/AutoShop/Vehicle Types ---
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

type DealAppliedType = {
  name?: string;
  percentageDiscount?: number;
  dealCode?: string;
};

type SubServiceTypePopulated = {
  id: string; // _id of subservice
  price: number;
  discountedPrice: number;
  discountAmount: number;
};

type ServiceDetailsType = {
  _id: string;
  name: string;
  desc?: string;
  services?: {
    _id: string;
    name: string;
    desc?: string;
    price?: number;
  }[];
  __v?: number;
};

type ServiceTypePopulated = {
  id: ServiceDetailsType;
  subServices: SubServiceTypePopulated[];
};

type UserSummaryType = {
  _id: string;
  name?: string;
  email?: string;
};

type PopulatedVehicleType = VehicleType;

type JobCardTypePopulated = {
  _id: string;
  business: BusinessProfileType;
  customerId: UserSummaryType;
  vehicleId: PopulatedVehicleType;
  odometerReading: number;
  issueDescription: string;
  serviceType: string;
  priorityLevel: string;
  services: ServiceTypePopulated[];
  additionalNotes?: string;
  vehiclePhotos?: string[];
  dealApplied?: DealAppliedType;
  totalPayableAmount: number;
  paymentStatus: string;
  technicalRemarks?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
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
  jobCards?: JobCardTypePopulated[];
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

function renderBusinessInfo(business: BusinessProfileType | undefined) {
  const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL;
  if (!business) return "-";
  return (
    <div className="space-y-1">
      <div>
        <span className="font-medium">Name:</span> {business.businessName}
      </div>
      <div>
        <span className="font-medium">Address:</span> {business.businessAddress || "-"}
      </div>
      <div>
        <span className="font-medium">Pincode:</span> {business.pincode || "-"}
      </div>
      <div>
        <span className="font-medium">Map Location:</span>{" "}
        {business.businessMapLocation
          ? `(${business.businessMapLocation.lat}, ${business.businessMapLocation.lng})`
          : "-"}
      </div>
      <div>
        <span className="font-medium">Phone:</span> {business.businessPhone || "-"}
      </div>
      <div>
        <span className="font-medium">Email:</span> {business.businessEmail || "-"}
      </div>
      <div>
        <span className="font-medium">HST Number:</span> {business.businessHSTNumber || "-"}
      </div>
      <div>
        <span className="font-medium">Open Hours:</span> {business.openHours || "-"}
      </div>
      <div>
        <span className="font-medium">Open Days:</span> {processOpenDays(business.openDays)}
      </div>
      {business.businessLogo && (
        <div className="pt-1">
          <img
            src={
              business.businessLogo.startsWith("http")
                ? business.businessLogo
                : `${UPLOADS_URL}/${business.businessLogo.replace(/^\/+/, "")}`
            }
            alt="Business Logo"
            className="w-14 h-14 object-cover rounded border"
          />
        </div>
      )}
      {business.teamMembers && business.teamMembers.length > 0 && (
        <div>
          <span className="font-medium">Team:</span>
          <ul className="ml-4 list-disc">
            {business.teamMembers.map((tm) => (
              <li key={tm._id}>
                {tm.name} {tm.designation && <>({tm.designation})</>}
                {tm.email && <> - {tm.email}</>}
                {tm.phone && <> - {tm.phone}</>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function renderVehicleInfo(vehicle: PopulatedVehicleType | undefined) {
  const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL;
  if (!vehicle) return "-";
  return (
    <div className="space-y-1">
      <div>
        <span className="font-medium">Plate No:</span> {vehicle.licensePlateNo || "-"}
      </div>
      <div>
        <span className="font-medium">VIN No:</span> {vehicle.vinNo || "-"}
      </div>
      <div>
        <span className="font-medium">Make:</span>{" "}
        {typeof vehicle.make === "object" && vehicle.make
          ? vehicle.make.name
          : typeof vehicle.make === "string"
            ? vehicle.make
            : "-"}
      </div>
      <div>
        <span className="font-medium">Model:</span>{" "}
        {typeof vehicle.make === "object" && vehicle.make
          ? vehicle.make.model
          : (vehicle as any).model || "-"}
      </div>
      <div>
        <span className="font-medium">Year:</span> {vehicle.year || "-"}
      </div>
      <div>
        <span className="font-medium">Odometer:</span> {vehicle.odometerReading ?? "-"}
      </div>
      <div>
        <span className="font-medium">Images:</span>{" "}
        {(vehicle.carImages && vehicle.carImages.length > 0) ||
        vehicle.licensePlateFrontImagePath ||
        vehicle.licensePlateBackImagePath ? (
          <div className="flex flex-wrap gap-2 mt-1">
            {vehicle.carImages &&
              vehicle.carImages.map((img, idx) => (
                <img
                  key={idx}
                  src={
                    typeof img === "string"
                      ? img.startsWith("http")
                        ? img
                        : `${UPLOADS_URL}/${img.replace(/^\/+/, "")}`
                      : ""
                  }
                  alt={`carimg-${idx}`}
                  className="w-12 h-12 object-cover rounded border"
                />
              ))}
            {vehicle.licensePlateFrontImagePath && (
              <img
                src={
                  vehicle.licensePlateFrontImagePath.startsWith("http")
                    ? vehicle.licensePlateFrontImagePath
                    : `${UPLOADS_URL}/${vehicle.licensePlateFrontImagePath.replace(/^\/+/, "")}`
                }
                alt="plate-front"
                className="w-12 h-12 object-cover rounded border"
              />
            )}
            {vehicle.licensePlateBackImagePath && (
              <img
                src={
                  vehicle.licensePlateBackImagePath.startsWith("http")
                    ? vehicle.licensePlateBackImagePath
                    : `${UPLOADS_URL}/${vehicle.licensePlateBackImagePath.replace(/^\/+/, "")}`
                }
                alt="plate-back"
                className="w-12 h-12 object-cover rounded border"
              />
            )}
          </div>
        ) : (
          <span>-</span>
        )}
      </div>
    </div>
  );
}

function renderCustomerSummary(customer: UserSummaryType | undefined) {
  return customer
    ? `${customer.name ?? "-"}${customer.email ? ` (${customer.email})` : ""}`
    : "-";
}

function renderServiceDetails(service: ServiceTypePopulated) {
  if (!service.id) return "-";
  const details = service.id;
  return (
    <div>
      <div>
        <span className="font-medium">Service:</span>{" "}
        {details.name}
      </div>
      {details.desc && (
        <div>
          <span className="font-medium text-xs">Desc:</span> {details.desc}
        </div>
      )}
    </div>
  );
}

function renderJobCardServices(services: ServiceTypePopulated[]) {
  if (!services || !services.length) return "-";
  return (
    <ul className="ml-1 space-y-3">
      {services.map((service, idx) => (
        <li key={service.id?._id ?? idx} className="border-b pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
          {renderServiceDetails(service)}
          {service.subServices && service.subServices.length > 0 && (
            <div className="ml-2">
              <span className="font-medium text-xs">Selected SubServices:</span>
              <ul className="ml-4 list-[circle] text-xs">
                {service.subServices.map((sub, j) => (
                  <li key={sub.id || j}>
                    <span>
                      {typeof sub.price === "number" && <>Price: ₹{sub.price}</>}
                      {typeof sub.discountedPrice === "number" && <> | Discounted: ₹{sub.discountedPrice}</>}
                      {typeof sub.discountAmount === "number" && <> | Discount: ₹{sub.discountAmount}</>}
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

// JobCardPanel can now be a controlled expandable/collapsible panel
const JobCardPanel: React.FC<{
  card: JobCardTypePopulated;
  idx: number;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ card, idx, isOpen, onToggle }) => {
  const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL;

  return (
    <div className="rounded-xl border bg-gray-50 dark:bg-gray-800 shadow w-full mx-auto">
      {/* Header section - clickable for expand/collapse */}
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
          <span className="font-bold text-lg text-blue-700 dark:text-blue-400">Job Card #{idx + 1}</span>
          <span className="rounded px-2 py-1 bg-blue-100 dark:bg-blue-950/50 text-xs font-semibold text-blue-700 dark:text-blue-200">
            {card.serviceType}
          </span>
          <span className="rounded px-2 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-xs font-semibold text-yellow-900 dark:text-yellow-200">
            {card.priorityLevel}
          </span>
         
        </div>
        <div className="flex justify-end items-center">

        <div className="flex flex-col items-end min-w-[160px] gap-0">
          <span className="block text-xs font-medium text-gray-600 dark:text-gray-300">
            Payment:{" "}
            <span
              className={`font-bold ${
                card.paymentStatus === "PAID"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {card.paymentStatus}
            </span>
          </span>
          <span className="block text-xs font-medium text-gray-600 dark:text-gray-300">
            Total Payable:{" "}
            <span className="font-bold text-gray-900 dark:text-gray-100">
              ₹{card.totalPayableAmount}
            </span>
          </span>
        
        </div>
        {isOpen ? (
            <span className="ml-3 text-xl text-gray-500 dark:text-gray-300 font-bold">&#9650;</span>
          ) : (
            <span className="ml-3 text-xl text-gray-300 dark:text-gray-600 font-bold">&#9660;</span>
          )}

        </div>
       
      </button>
      {/* Collapsed or expanded section */}
      {isOpen && (
        <div
          id={`jobcard-body-${card._id}-${idx}`}
          className="p-5 pt-0 animate-fadein"
        >
          <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-start">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400">
                {card.createdAt && (
                  <>
                    <span>
                      Created: {new Date(card.createdAt).toLocaleString()}
                    </span>
                  </>
                )}
                {card.updatedAt && (
                  <>
                    <span>
                      Updated: {new Date(card.updatedAt).toLocaleString()}
                    </span>
                  </>
                )}
              </div>
              <div className="mt-2">
                <span className="font-semibold text-sm">Business:</span>
                <div className="ml-2">{renderBusinessInfo(card.business)}</div>
              </div>
            </div>
            <div className="min-w-[180px] flex flex-col gap-2 items-end">
              <div className="text-right">
                <span className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-0.5">
                  Deal:{" "}
                  {card.dealApplied ? (
                    <span className="font-bold">
                      {card.dealApplied.name} ({card.dealApplied.dealCode} -{" "}
                      {card.dealApplied.percentageDiscount ?? "-"}%)
                    </span>
                  ) : (
                    "-"
                  )}
                </span>
              </div>
            </div>
          </div>
          {/* Grid Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <div className="font-medium text-sm mb-1">Vehicle Info</div>
              <div className="text-xs pl-2">{renderVehicleInfo(card.vehicleId)}</div>
              <div className="mt-3 text-xs space-y-1">
                <div>
                  <span className="font-medium">Customer:</span>{" "}
                  {renderCustomerSummary(card.customerId)}
                </div>
                <div>
                  <span className="font-medium">Odometer Reading:</span>{" "}
                  {card.odometerReading}
                </div>
                <div>
                  <span className="font-medium">Issue:</span> {card.issueDescription}
                </div>
                <div>
                  <span className="font-medium">Notes:</span> {card.additionalNotes || "-"}
                </div>
                <div>
                  <span className="font-medium">Technical Remarks:</span> {card.technicalRemarks || "-"}
                </div>
              </div>
            </div>
            {/* Services and Photos */}
            <div>
              <div className="font-medium text-sm mb-1">Services</div>
              {card.services && card.services.length > 0
                ? renderJobCardServices(card.services)
                : <span className="ml-2 text-gray-500">-</span>
              }
              <div className="mt-4">
                <span className="font-medium">Vehicle Photos:</span>
                {card.vehiclePhotos && card.vehiclePhotos.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {card.vehiclePhotos.map((photo, idx) => (
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

const RenderJobCardsModalContent: React.FC<{
  owner: CarOwnerType;
}> = ({ owner }) => {
  // Only one expanded at a time, keep state by index
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  // Reset expanded panel when modal closes/re-opens
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

const CarOwners: React.FC = () => {
  const [carOwners, setCarOwners] = useState<CarOwnerType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Modal states
  const [openVehiclesFor, setOpenVehiclesFor] = useState<CarOwnerType | null>(null);
  const [openFavShopsFor, setOpenFavShopsFor] = useState<CarOwnerType | null>(null);
  const [openJobCardsFor, setOpenJobCardsFor] = useState<CarOwnerType | null>(null);

  // Fetch car owners
  const fetchCarOwners = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/carowners`
      );
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

  useEffect(() => {
    fetchCarOwners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper for tolerant make/model (API sometimes string, sometimes object):
  function getMake(vehicle: VehicleType): string {
    if (!vehicle.make) return "-";
    if (typeof vehicle.make === "object" && vehicle.make !== null) {
      return vehicle.make.name || "-";
    }
    return typeof vehicle.make === "string" ? vehicle.make : "-";
  }
  function getModel(vehicle: VehicleType): string {
    if (!vehicle.make) return "-";
    if (typeof vehicle.make === "object" && vehicle.make !== null) {
      return vehicle.make.model || "-";
    }
    return (vehicle as any).model || "-";
  }

  // Vehicle Images: carImages and license plate images
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

  // Render Vehicles Modal Content (with all important details and images)
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
                {/* Removed line showing vehicle ID */}
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
                  <span className="font-medium">VIN No.:</span>{" "}
                  {vehicle.vinNo || "-"}
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

  // Render Fav AutoShops Modal Content (business profile)
  const renderFavShopsModalContent = (owner: CarOwnerType) => (
    <>
      {owner.favoriteAutoShops && owner.favoriteAutoShops.length > 0 ? (
        <ul className="space-y-3">
          {owner.favoriteAutoShops.map(shop => (
            <li key={shop._id} className="border rounded-lg px-4 py-3 bg-gray-50 dark:bg-gray-800">
              <div className="font-semibold text-base mb-1">{shop.businessName || "-"}</div>
              <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                <div>
                  <span className="font-medium">Address:</span>{" "}
                  {shop.businessAddress || "-"}
                </div>
                <div>
                  <span className="font-medium">Pincode:</span>{" "}
                  {shop.pincode || "-"}
                </div>
                <div>
                  <span className="font-medium">Email:</span>{" "}
                  {shop.businessEmail || "-"}
                </div>
                <div>
                  <span className="font-medium">Phone:</span>{" "}
                  {shop.businessPhone || "-"}
                </div>
                {shop.businessHSTNumber && (
                  <div>
                    <span className="font-medium">HST Number:</span>{" "}
                    {shop.businessHSTNumber}
                  </div>
                )}
                {shop.openHours && (
                  <div>
                    <span className="font-medium">Open Hours:</span>{" "}
                    {shop.openHours}
                  </div>
                )}
                {shop.openDays && shop.openDays.length > 0 && (
                  <div>
                    <span className="font-medium">Open Days:</span>{" "}
                    {processOpenDays(shop.openDays)}
                  </div>
                )}
                {shop.teamMembers && shop.teamMembers.length > 0 && (
                  <div>
                    <span className="font-medium">Team:</span>{" "}
                    <ul className="ml-4 list-disc">
                      {shop.teamMembers.map(tm => (
                        <li key={tm._id}>
                          {tm.name}
                          {tm.designation && <> ({tm.designation})</>}
                          {tm.email && <> - {tm.email}</>}
                          {tm.phone && <> - {tm.phone}</>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {shop.businessLogo && (
                <img
                  src={
                    shop.businessLogo.startsWith("http")
                      ? shop.businessLogo
                      : `${import.meta.env.VITE_UPLOADS_URL}/${shop.businessLogo.replace(/^\/+/, "")}`
                  }
                  alt="Business Logo"
                  className="w-16 h-16 object-cover rounded border mt-2"
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-gray-400 text-center">No favorite auto shops found.</div>
      )}
    </>
  );

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
      {openFavShopsFor && (
        <Modal
          isOpen={!!openFavShopsFor}
          onClose={() => setOpenFavShopsFor(null)}
          title={`Favorite Auto Shops for ${openFavShopsFor.name}`}
        >
          {renderFavShopsModalContent(openFavShopsFor)}
        </Modal>
      )}
      {/* Job Cards Modal */}
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
          <h2 className="text-xl font-semibold">Car Owners</h2>
        </div>
        {loading && (
          <div className="py-10 text-center font-medium text-gray-600">
            Loading car owners...
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
                    Country Code
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Address
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Pincode
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Onboarded By
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Profile Complete
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Disabled
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Vehicles
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Fav. AutoShops
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Job Cards
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {carOwners.length === 0 && (
                  <TableRow>
                    <TableCell className="text-center py-8 text-gray-400">
                      No car owners found.
                    </TableCell>
                  </TableRow>
                )}
                {carOwners.map((owner) => (
                  <TableRow key={owner._id}>
                    {/* Name */}
                    <TableCell className="px-5 py-3 text-gray-800 text-theme-sm dark:text-white/90">
                      {owner.name || "-"}
                    </TableCell>
                    {/* Email */}
                    <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {owner.email || "-"}
                    </TableCell>
                    {/* Phone */}
                    <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {owner.phone || "-"}
                    </TableCell>
                    {/* Country Code */}
                    <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {owner.countryCode || "-"}
                    </TableCell>
                    {/* Address */}
                    <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {owner.address || "-"}
                    </TableCell>
                    {/* Pincode */}
                    <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {owner.pincode || "-"}
                    </TableCell>
                    {/* Onboarded By */}
                    <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {owner.onboardedBy
                        ? (owner.onboardedBy.name
                          ? `${owner.onboardedBy.name}${owner.onboardedBy.email ? ` (${owner.onboardedBy.email})` : ""}`
                          : owner.onboardedBy.email)
                        : "-"}
                    </TableCell>
                    {/* Profile Complete */}
                    <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {owner.isProfileComplete ? "Yes" : "No"}
                    </TableCell>
                    {/* Disabled */}
                    <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {owner.isDisabled ? "Yes" : "No"}
                    </TableCell>
                    {/* Vehicles */}
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
                    {/* Favorite AutoShops */}
                    <TableCell className="px-5 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {owner.favoriteAutoShops && owner.favoriteAutoShops.length > 0 ? (
                        <button
                          className="underline text-blue-600 hover:text-blue-800 text-xs"
                          type="button"
                          onClick={() => setOpenFavShopsFor(owner)}
                        >
                          View All ({owner.favoriteAutoShops.length})
                        </button>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    {/* Job Cards */}
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
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
};

export default CarOwners;