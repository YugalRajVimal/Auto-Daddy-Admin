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
// ====================

type SubService = {
  subService: string;
  // Additional fields?
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

// Simple Modal Component
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

// Utilities for color badges:
function getStatus(owner: AutoShopOwnerType) {
  if (owner.isDisabled) return "Suspended";
  if (owner.isProfileComplete && (owner.isBusinessProfileCompleted ?? owner.businessProfile)) return "Active";
  if (!owner.isProfileComplete) return "Incomplete Profile";
  return "Unknown";
}
function getStatusColor(owner: AutoShopOwnerType) {
  if (owner.isDisabled) return "warning";
  if (owner.isProfileComplete && (owner.isBusinessProfileCompleted ?? owner.businessProfile)) return "success";
  if (!owner.isProfileComplete) return "error";
  return "default";
}

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

  useEffect(() => {
    fetchOwners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modal for team members + business profile full info (unchanged)
  const renderBusinessProfileModal = () => {
    if (!modalOwner || !modalOwner.businessProfile) return null;
    const bp = modalOwner.businessProfile;

    const renderNestedServices = () => {
      if (!Array.isArray(bp.myServices) || bp.myServices.length === 0) {
        return <div className="text-gray-400">No services listed</div>;
      }
      const serviceMap: { [serviceId: string]: { service: Service; subServiceIds: string[] } } = {};
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
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {bp.businessLogo && (
              <img
                src={
                  bp.businessLogo.startsWith("http")
                    ? bp.businessLogo
                    : `${import.meta.env.VITE_IMAGE_URL ?? ""}/${bp.businessLogo}`
                }
                alt="Shop Logo"
                className="w-16 h-16 rounded"
              />
            )}
            <div>
              <div className="font-semibold text-lg">{bp.businessName}</div>
              <div className="text-gray-500">{bp.businessAddress}</div>
              {bp.pincode && (
                <div className="text-gray-400 text-xs">Pincode: {bp.pincode}</div>
              )}
              {bp.businessPhone && (
                <div className="text-gray-400 text-xs">
                  Phone: {bp.businessPhone}
                </div>
              )}
              {bp.businessEmail && (
                <div className="text-gray-400 text-xs">
                  Email: {bp.businessEmail}
                </div>
              )}
              {bp.businessHSTNumber && (
                <div className="text-gray-400 text-xs">
                  HST#: {bp.businessHSTNumber}
                </div>
              )}
              {bp.openHours && (
                <div className="text-gray-400 text-xs">
                  Open Hours: {bp.openHours}
                </div>
              )}
              {bp.openDays && (
                <div className="text-gray-400 text-xs">
                  Open Days:{" "}
                  {(() => {
                    if (
                      bp.openDays.length === 1 &&
                      typeof bp.openDays[0] === "string" &&
                      bp.openDays[0].trim().startsWith("[")
                    ) {
                      try {
                        return JSON.parse(bp.openDays[0]).join(", ");
                      } catch {
                        return bp.openDays.join(", ");
                      }
                    }
                    return bp.openDays.join(", ");
                  })()}
                </div>
              )}
              <div className="text-gray-400 text-xs">
                Created:{" "}
                {bp.createdAt
                  ? new Date(bp.createdAt).toLocaleString()
                  : "-"}
              </div>
              {"updatedAt" in bp && (
                <div className="text-gray-400 text-xs">
                  Updated:{" "}
                  {bp.updatedAt
                    ? new Date(bp.updatedAt).toLocaleString()
                    : "-"}
                </div>
              )}
            </div>
          </div>
          {/* Team Members */}
          <div>
            <div className="font-semibold mb-2">Team Members</div>
            {Array.isArray(bp.teamMembers) && bp.teamMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border">
                  <thead>
                    <tr>
                      <th className="p-2 border-b font-semibold text-left">Photo</th>
                      <th className="p-2 border-b font-semibold text-left">Name</th>
                      <th className="p-2 border-b font-semibold text-left">Email</th>
                      <th className="p-2 border-b font-semibold text-left">Phone</th>
                      <th className="p-2 border-b font-semibold text-left">Designation</th>
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
                                  : `${import.meta.env.VITE_IMAGE_URL ?? ""}/${tm.photo}`
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
                        <td className="p-2 border-b">{tm.designation || "-"}</td>
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
                      <th className="p-2 border-b font-semibold text-left">Name</th>
                      <th className="p-2 border-b font-semibold text-left">Description</th>
                      <th className="p-2 border-b font-semibold text-left">Discount %</th>
                      <th className="p-2 border-b font-semibold text-left">Coupon</th>
                      <th className="p-2 border-b font-semibold text-left">Enabled</th>
                      <th className="p-2 border-b font-semibold text-left">Valid From</th>
                      <th className="p-2 border-b font-semibold text-left">Ends</th>
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
                          <td className="p-2 border-b">{deal.name || "-"}</td>
                          <td className="p-2 border-b max-w-xs whitespace-pre-wrap">{deal.description || "-"}</td>
                          <td className="p-2 border-b">{deal.percentageDiscount ?? 0}%</td>
                          <td className="p-2 border-b">{deal.couponCode || "-"}</td>
                          <td className="p-2 border-b">
                            {deal.dealEnabled ? (
                              <span className="text-green-600 font-medium">Yes</span>
                            ) : (
                              <span className="text-red-500 font-medium">No</span>
                            )}
                          </td>
                          <td className="p-2 border-b">
                            {deal.startDate
                              ? new Date(deal.startDate).toLocaleDateString()
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

  // Customers Modal
  const renderCustomersModal = () => {
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
                  <th className="font-semibold text-left p-2 border-b border-gray-100">Name</th>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">Email</th>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">Phone</th>
                </tr>
              </thead>
              <tbody>
                {modalOwner.myCustomers.map((cust) => (
                  <tr key={cust._id}>
                    <td className="p-2 border-b border-gray-50">{cust.name || "-"}</td>
                    <td className="p-2 border-b border-gray-50">{cust.email || "-"}</td>
                    <td className="p-2 border-b border-gray-50">{cust.phone || "-"}</td>
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

  // Deals Modal
  const renderDealsModal = () => {
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
                  <th className="font-semibold text-left p-2 border-b border-gray-100">Name</th>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">Description</th>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">Discount %</th>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">Coupon</th>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">Enabled</th>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">Valid From</th>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">Ends</th>
                  <th className="font-semibold text-left p-2 border-b border-gray-100">Details</th>
                </tr>
              </thead>
              <tbody>
                {modalOwner.deals.map((deal) => (
                  <tr key={deal._id}>
                    <td className="p-2 border-b border-gray-50">{deal.name}</td>
                    <td className="p-2 border-b border-gray-50 max-w-xs whitespace-pre-wrap">{deal.description || "-"}</td>
                    <td className="p-2 border-b border-gray-50">{deal.percentageDiscount ?? 0}%</td>
                    <td className="p-2 border-b border-gray-50">
                      {deal.couponCode || "-"}
                    </td>
                    <td className="p-2 border-b border-gray-50">
                      {deal.dealEnabled ? (
                        <span className="text-green-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-red-500 font-medium">No</span>
                      )}
                    </td>
                    <td className="p-2 border-b border-gray-50">
                      {deal.startDate ? new Date(deal.startDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-2 border-b border-gray-50">
                      {deal.endDate ? new Date(deal.endDate).toLocaleDateString() : "-"}
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

  // Job Cards Modal - similar to CarOwners, but use VITE_UPLOADS_URL (not VITE_IMAGE_URL) for vehicle photos
  const renderJobCardsModal = () => {
    if (!modalOwner) return null;
    return (
      <Modal
        isOpen={jobCardsModalOpen}
        onClose={() => setJobCardsModalOpen(false)}
        title={`Job Cards for ${modalOwner.name}`}
      >
        {modalOwner.jobCards && modalOwner.jobCards.length > 0 ? (
          <ul className="space-y-3">
            {modalOwner.jobCards.map((card: JobCardType) => (
              <li key={card._id} className="border rounded-lg px-4 py-3 bg-gray-50 dark:bg-gray-800">
                <div className="font-semibold mb-1 flex justify-between items-center">
                  <span>Job Card ID: {card._id}</span>
                  <span className="rounded px-2 py-1 bg-gray-200 dark:bg-gray-700 text-xs">
                    {card.serviceType} - {card.priorityLevel}
                  </span>
                </div>
                <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1 mb-2">
                  <div>
                    <span className="font-medium">Business:</span>{" "}
                    {card.business}
                  </div>
                  <div>
                    <span className="font-medium">Vehicle ID:</span>{" "}
                    {card.vehicleId}
                  </div>
                  <div>
                    <span className="font-medium">Odometer Reading:</span>{" "}
                    {card.odometerReading}
                  </div>
                  <div>
                    <span className="font-medium">Issue:</span>{" "}
                    {card.issueDescription}
                  </div>
                  <div>
                    <span className="font-medium">Notes:</span>{" "}
                    {card.additionalNotes || "-"}
                  </div>
                  <div>
                    <span className="font-medium">Technical Remarks:</span>{" "}
                    {card.technicalRemarks || "-"}
                  </div>
                  <div>
                    <span className="font-medium">Deal Applied:</span>{" "}
                    {card.dealApplied
                      ? `${card.dealApplied.name} (${card.dealApplied.dealCode ?? ""}${card.dealApplied.percentageDiscount != null ? ` - ${card.dealApplied.percentageDiscount}%` : ""})`
                      : "-"}
                  </div>
                  <div>
                    <span className="font-medium">Total Payable:</span> ₹{card.totalPayableAmount}
                  </div>
                  <div>
                    <span className="font-medium">Payment Status:</span> {card.paymentStatus}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {card.createdAt ? new Date(card.createdAt).toLocaleString() : "-"}
                  </div>
                </div>
                {/* Vehicle Photos */}
                {card.vehiclePhotos && card.vehiclePhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {card.vehiclePhotos.map((photoUrl, idx) => (
                      <img
                        key={idx}
                        src={
                          photoUrl.startsWith("http")
                            ? photoUrl
                            : `${UPLOADS_URL ?? ""}/${photoUrl.replace(/^\/+/, "")}`
                        }
                        alt="Vehicle"
                        className="w-20 h-20 object-cover rounded"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
                {/* Services breakdown if present */}
                {Array.isArray(card.services) && card.services.length > 0 && (
                  <div className="mt-2">
                    <div className="font-medium">Services:</div>
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
                                      <span className="ml-2 text-green-700">After Discount: ₹{ss.discountedPrice}</span>
                                    )
                                  }
                                  {typeof ss.discountAmount !== "undefined" &&
                                    ss.discountAmount > 0 && (
                                      <span className="ml-2 text-red-600">
                                        (Discount: ₹{ss.discountAmount})
                                      </span>
                                    )
                                  }
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-4 text-gray-400">No job cards found.</div>
        )}
      </Modal>
    );
  };

  return (
    <>
      {/* Modals */}
      {renderBusinessProfileModal()}
      {renderCustomersModal()}
      {renderDealsModal()}
      {renderJobCardsModal()}

      <div className="overflow-y-auto h-full pb-20 rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
          <h2 className="text-xl font-semibold">Auto Shop Owners</h2>
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
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {owners.length === 0 && (
                  <TableRow>
                    <TableCell className="text-center py-8 text-gray-400" isHeader={false} >
                      No auto shop owners found.
                    </TableCell>
                  </TableRow>
                )}
                {owners.map((owner) => (
                  <TableRow key={owner._id}>
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

export default AutoShopOwners;