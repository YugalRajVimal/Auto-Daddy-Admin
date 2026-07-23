import { useRef } from "react";
import { motion } from "framer-motion";
import { ADMIN_PANEL_THEAD_ROW_CLASS, adminPanelRowClass } from "../admin/adminPanelTableStyles";
import {
  businessName,
  formatBusinessPhone,
  formatJobCardDate,
  isPaidJobCard,
  jobCardLicensePlate,
  jobChipLabel,
  resolveJobCardTotal,
  serviceTypeLabel,
} from "../../lib/carOwnerJobCards";
import { formatCurrencyAmount } from "../../lib/currency";
import { vehicleSidebarLabel, type CarOwnerVehicle } from "../../lib/carOwnerVehicles";
import { isPaidInvoiceRow, type CarOwnerInvoiceRow } from "../../hooks/useCarOwnerInvoices";
import type { CarOwnerAutoShopListItem } from "../../types/carOwnerAutoShops";
import type { CarOwnerCustomerRequest } from "../../types/carOwnerApprovals";
import type { CarOwnerJobCard } from "../../types/carOwnerJobCards";
import {
  notificationDisplay,
  type CarOwnerNotification,
} from "../../types/carOwnerNotifications";
import type { ServiceSubItem } from "../../hooks/useOwnerPortal";
import { formatCustomerRequestDate } from "../../lib/carOwnerApprovals";
import { isCarOwnerShopOpenToday } from "../../lib/carOwnerAutoShops";
import type { VehicleDocumentFieldKey } from "../../lib/carOwnerDocuments";
import type { DummyOwnerServiceRequest } from "../../lib/dummyOwnerMessages";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import {
  OWNER_PANEL_TABLE,
  OWNER_TABLE_BODY_TD_CLASS,
  OWNER_TABLE_HEAD_TH_CLASS,
  OWNER_TABLE_SURFACE_CLASS,
} from "./ownerPanelTableStyles";

type OwnerVehiclesPickerTableProps = {
  vehicles: CarOwnerVehicle[];
  selectedVehicleId?: string | null;
  onSelect: (vehicleId: string) => void;
};

export function OwnerVehiclesPickerTable({
  vehicles,
  selectedVehicleId,
  onSelect,
}: OwnerVehiclesPickerTableProps) {
  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className={OWNER_TABLE_SURFACE_CLASS}
    >
      <div className="overflow-x-auto">
        <table className={OWNER_PANEL_TABLE.table}>
          <thead>
            <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>License Plate</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Make / Model</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Year</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Odometer</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle, index) => {
              const selected = selectedVehicleId === vehicle.id;
              return (
                <tr
                  key={vehicle.id}
                  className={`${adminPanelRowClass(index)} cursor-pointer ${selected ? "bg-[#f5cce8]/40" : "hover:bg-gray-50"}`}
                  onClick={() => onSelect(vehicle.id)}
                >
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>
                    <span className="font-semibold text-ad-purple">
                      {vehicle.licensePlateNo?.trim().toUpperCase() || "—"}
                    </span>
                  </td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{vehicleSidebarLabel(vehicle)}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{vehicle.year ?? "—"}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{vehicle.odometerReading ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

type OwnerJobCardsTableProps = {
  rows: CarOwnerJobCard[];
  countryCode?: string;
  onRowClick?: (jc: CarOwnerJobCard) => void;
};

export function OwnerJobCardsTable({ rows, countryCode, onRowClick }: OwnerJobCardsTableProps) {
  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className={OWNER_TABLE_SURFACE_CLASS}
    >
      <div className="overflow-x-auto">
        <table className={OWNER_PANEL_TABLE.table}>
          <thead>
            <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Job No.</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Auto Shop</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Phone</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Plate</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Service</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Total</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Date</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((jc, index) => {
              const paid = isPaidJobCard(jc);
              return (
                <tr
                  key={jc._id}
                  className={`${adminPanelRowClass(index)}${onRowClick ? " cursor-pointer hover:bg-gray-50" : ""}`}
                  onClick={onRowClick ? () => onRowClick(jc) : undefined}
                >
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>
                    <span className="font-semibold text-blue-700">{jobChipLabel(jc)}</span>
                  </td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{businessName(jc.business)}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{formatBusinessPhone(jc.business) || "—"}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{jobCardLicensePlate(jc)}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{serviceTypeLabel(jc)}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>
                    {formatCurrencyAmount(resolveJobCardTotal(jc), countryCode)}
                  </td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{formatJobCardDate(jc.createdAt)}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{paid ? "Paid" : "Unpaid"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

type OwnerInvoicesTableProps = {
  rows: CarOwnerInvoiceRow[];
  countryCode?: string;
  onRowClick?: (row: CarOwnerInvoiceRow) => void;
};

function invoiceNoLabel(row: CarOwnerInvoiceRow): string {
  const no = (row.invoiceNo || row.jobNo)?.trim();
  if (!no || no === "—") return "—";
  return no.toUpperCase().startsWith("INV") ? no : `Invoice #${no}`;
}

export function OwnerInvoicesTable({ rows, countryCode, onRowClick }: OwnerInvoicesTableProps) {
  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className={OWNER_TABLE_SURFACE_CLASS}
    >
      <div className="overflow-x-auto">
        <table className={OWNER_PANEL_TABLE.table}>
          <thead>
            <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Invoice</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Auto Shop</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Phone</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Plate</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Service</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Amount</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Date</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const paid = isPaidInvoiceRow(row);
              return (
                <tr
                  key={row.id}
                  className={`${adminPanelRowClass(index)}${onRowClick ? " cursor-pointer hover:bg-gray-50" : ""}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>
                    <span className="font-semibold text-blue-700">{invoiceNoLabel(row)}</span>
                  </td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{row.shopName}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{row.phone?.trim() || "—"}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{row.plate?.trim().toUpperCase() || "—"}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>
                    {row.service?.trim() || row.vehicle?.trim() || "—"}
                  </td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>
                    {formatCurrencyAmount(row.amount, countryCode)}
                  </td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{formatJobCardDate(row.createdAt)}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{paid ? "Paid" : "Unpaid"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

type OwnerSubServicesTableProps = {
  serviceName: string;
  subServices: ServiceSubItem[];
  selectedSubServiceId?: string | null;
  onSelect?: (sub: ServiceSubItem) => void;
};

export function OwnerSubServicesTable({
  serviceName,
  subServices,
  selectedSubServiceId,
  onSelect,
}: OwnerSubServicesTableProps) {
  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className={OWNER_TABLE_SURFACE_CLASS}
    >
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700">
        {serviceName}
      </div>
      <div className="overflow-x-auto">
        <table className={OWNER_PANEL_TABLE.table}>
          <thead>
            <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Sub-service</th>
            </tr>
          </thead>
          <tbody>
            {subServices.map((sub, index) => {
              const subKey = sub.id ?? sub.name;
              const selected = Boolean(selectedSubServiceId && subKey === selectedSubServiceId);
              return (
                <tr
                  key={subKey}
                  className={`${adminPanelRowClass(index)}${onSelect ? " cursor-pointer hover:bg-gray-50" : ""} ${selected ? "bg-[#f5cce8]/40" : ""}`}
                  onClick={onSelect ? () => onSelect(sub) : undefined}
                >
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{sub.name}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

const REQUEST_STATUS_LABELS: Record<DummyOwnerServiceRequest["status"], string> = {
  Pending: "Pending",
  Accepted: "Accepted",
  Declined: "Declined",
};

const REQUEST_STATUS_PILL: Record<DummyOwnerServiceRequest["status"], string> = {
  Pending: "bg-amber-50 text-amber-800 ring-amber-100",
  Accepted: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Declined: "bg-rose-50 text-rose-700 ring-rose-100",
};

function formatOwnerTableDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusPill({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${className}`}>
      {label}
    </span>
  );
}

function notificationStatusMeta(item: CarOwnerNotification): { label: string; className: string } {
  const title = item.title.toLowerCase();
  const message = item.message.toLowerCase();
  if (title.includes("accepted") || message.includes("accepted")) {
    return { label: "Accepted", className: "bg-emerald-50 text-emerald-700 ring-emerald-100" };
  }
  if (title.includes("declined") || message.includes("declined")) {
    return { label: "Declined", className: "bg-rose-50 text-rose-700 ring-rose-100" };
  }
  if (title.includes("approval") || message.includes("approval") || title.includes("job card") || message.includes("job card")) {
    return { label: "Approval", className: "bg-sky-50 text-sky-700 ring-sky-100" };
  }
  if (title.includes("invoice") || message.includes("invoice")) {
    return { label: "Invoice", className: "bg-violet-50 text-violet-700 ring-violet-100" };
  }
  return { label: "Unread", className: "bg-slate-100 text-slate-600 ring-slate-200" };
}

function DocumentUploadButton({
  vehicleId,
  fieldKey,
  uri,
  busy,
  disabled,
  onUpload,
}: {
  vehicleId: string;
  fieldKey: VehicleDocumentFieldKey;
  uri: string | null;
  busy: boolean;
  disabled: boolean;
  onUpload: (vehicleId: string, field: VehicleDocumentFieldKey, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onUpload(vehicleId, fieldKey, file);
        }}
      />
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        className="rounded border border-[#008000] bg-white px-3 py-1 text-xs font-semibold text-[#006600] hover:bg-[#CCFFCC] disabled:opacity-50"
      >
        {busy ? "Uploading…" : uri ? "Replace" : "Upload"}
      </button>
    </>
  );
}

type OwnerVehicleDocumentsTableProps = {
  vehicleId: string;
  licensePlate?: string;
  vehicleDetails?: string;
  fields: Array<{ key: VehicleDocumentFieldKey; label: string; uri: string | null }>;
  busyField: string | null;
  mutating: boolean;
  onUpload: (vehicleId: string, field: VehicleDocumentFieldKey, file: File) => void;
};

export function OwnerVehicleDocumentsTable({
  vehicleId,
  licensePlate,
  vehicleDetails,
  fields,
  busyField,
  mutating,
  onUpload,
}: OwnerVehicleDocumentsTableProps) {
  const plate = licensePlate?.trim().toUpperCase() || "—";

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className={OWNER_TABLE_SURFACE_CLASS}
    >
      <div className="overflow-x-auto">
        <table className={OWNER_PANEL_TABLE.table}>
          <thead>
            <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Document</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Preview</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Status</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Plate</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Vehicle</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Action</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              const fieldBusy = busyField === `${vehicleId}:${field.key}`;
              return (
                <tr key={field.key} className={adminPanelRowClass(index)}>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>
                    <span className="font-semibold text-[#006600]">{field.label}</span>
                  </td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>
                    {field.uri ? (
                      <a
                        href={field.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 w-14 items-center justify-center overflow-hidden rounded border border-gray-300 bg-gray-50"
                      >
                        <img src={field.uri} alt="" className="h-full w-full object-cover" />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">No file</span>
                    )}
                  </td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>
                    {field.uri ? "Uploaded" : "Not uploaded"}
                  </td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>
                    <span className="font-semibold text-ad-purple">{plate}</span>
                  </td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{vehicleDetails?.trim() || "—"}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>
                    <DocumentUploadButton
                      vehicleId={vehicleId}
                      fieldKey={field.key}
                      uri={field.uri}
                      busy={fieldBusy}
                      disabled={mutating && !fieldBusy}
                      onUpload={onUpload}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

type OwnerAutoShopsTableProps = {
  shops: CarOwnerAutoShopListItem[];
  onRowClick?: (shop: CarOwnerAutoShopListItem) => void;
};

export function OwnerAutoShopsTable({ shops, onRowClick }: OwnerAutoShopsTableProps) {
  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className={OWNER_TABLE_SURFACE_CLASS}
    >
      <div className="overflow-x-auto">
        <table className={OWNER_PANEL_TABLE.table}>
          <thead>
            <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Shop</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Phone</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>City</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Rating</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Status</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((shop, index) => {
              const openToday = isCarOwnerShopOpenToday(shop);
              const logoUri = normalizeMediaUrl(shop.logoUrl);
              const phone = shop.phone.trim() || "—";

              return (
                <tr
                  key={shop.id}
                  className={`${adminPanelRowClass(index)}${onRowClick ? " cursor-pointer hover:bg-gray-50" : ""}`}
                  onClick={onRowClick ? () => onRowClick(shop) : undefined}
                >
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-white">
                        {logoUri ? (
                          <img src={logoUri} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <span className="font-semibold text-gray-900">{shop.name}</span>
                    </div>
                  </td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{phone}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{shop.city.trim() || "—"}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{shop.rating.toFixed(1)}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>
                    {openToday ? "Open" : "Closed"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

type OwnerShopServicesTableProps = {
  shop: CarOwnerAutoShopListItem;
  connectingServiceKey: string | null;
  sentServiceKeys: Record<string, boolean>;
  onConnect: (serviceId: string, serviceName: string) => void;
};

function shopServiceRequestKey(shopId: string, serviceId: string, serviceName: string): string {
  return `${shopId}:${serviceId}:${serviceName}`;
}

export function OwnerShopServicesTable({
  shop,
  connectingServiceKey,
  sentServiceKeys,
  onConnect,
}: OwnerShopServicesTableProps) {
  const openToday = isCarOwnerShopOpenToday(shop);
  const services = shop.mainServiceItems;

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className={OWNER_TABLE_SURFACE_CLASS}
    >
      <div className="overflow-x-auto">
        <table className={OWNER_PANEL_TABLE.table}>
          <thead>
            <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Service</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Action</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr className={adminPanelRowClass(0)}>
                <td colSpan={2} className={`${OWNER_TABLE_BODY_TD_CLASS} text-center text-gray-500`}>
                  This shop has not listed any services yet.
                </td>
              </tr>
            ) : (
              services.map((service, index) => {
                const requestKey = shopServiceRequestKey(shop.id, service.id, service.name);
                const sent = Boolean(sentServiceKeys[requestKey]);
                const canConnect = openToday && Boolean(service.id);
                const busy = connectingServiceKey === requestKey;

                return (
                  <tr key={requestKey} className={adminPanelRowClass(index)}>
                    <td className={OWNER_TABLE_BODY_TD_CLASS}>{service.name}</td>
                    <td className={OWNER_TABLE_BODY_TD_CLASS}>
                      <button
                        type="button"
                        disabled={!canConnect || busy || sent}
                        onClick={() => onConnect(service.id, service.name)}
                        className={`rounded-full px-4 py-1 text-xs font-bold shadow-sm transition-all disabled:cursor-not-allowed ${
                          sent
                            ? "bg-gray-300 text-gray-600"
                            : "bg-ad-green text-white hover:bg-ad-green-dark disabled:opacity-50"
                        }`}
                      >
                        {sent ? "Request sent" : busy ? "Connecting…" : "Connect"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

type OwnerServiceRequestsTableProps = {
  rows: DummyOwnerServiceRequest[];
};

export function OwnerServiceRequestsTable({ rows }: OwnerServiceRequestsTableProps) {
  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className={OWNER_TABLE_SURFACE_CLASS}
    >
      <div className="overflow-x-auto">
        <table className={OWNER_PANEL_TABLE.table}>
          <thead>
            <tr className="bg-gradient-to-r from-ad-purple to-ad-purple-dark text-white">
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Date</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Subject</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Vehicle</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Auto Shop</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>City</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? "bg-white/90" : "bg-slate-50/80"}>
                <td className={OWNER_TABLE_BODY_TD_CLASS}>{formatOwnerTableDateTime(item.sentAt)}</td>
                <td className={OWNER_TABLE_BODY_TD_CLASS}>
                  <span className="font-semibold text-slate-900">{item.service}</span>
                </td>
                <td className={OWNER_TABLE_BODY_TD_CLASS}>{item.plate}</td>
                <td className={OWNER_TABLE_BODY_TD_CLASS}>{item.shopName}</td>
                <td className={OWNER_TABLE_BODY_TD_CLASS}>{item.shopCity}</td>
                <td className={OWNER_TABLE_BODY_TD_CLASS}>
                  <StatusPill
                    label={REQUEST_STATUS_LABELS[item.status]}
                    className={REQUEST_STATUS_PILL[item.status]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

type OwnerNotificationsTableProps = {
  rows: CarOwnerNotification[];
};

export function OwnerNotificationsTable({ rows }: OwnerNotificationsTableProps) {
  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className={OWNER_TABLE_SURFACE_CLASS}
    >
      <div className="overflow-x-auto">
        <table className={OWNER_PANEL_TABLE.table}>
          <thead>
            <tr className="bg-gradient-to-r from-ad-purple to-ad-purple-dark text-white">
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Date</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Title</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Description</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, index) => {
              const { title, description } = notificationDisplay(item);
              const status = notificationStatusMeta(item);
              return (
                <tr key={item.id} className={index % 2 === 0 ? "bg-white/90" : "bg-slate-50/80"}>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{formatOwnerTableDateTime(item.time)}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>
                    <span className="font-semibold text-slate-900">{title}</span>
                  </td>
                  <td className={`${OWNER_TABLE_BODY_TD_CLASS} max-w-md whitespace-normal text-slate-600`}>
                    {description || "—"}
                  </td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>
                    <StatusPill label={status.label} className={status.className} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

type OwnerCustomerRequestsTableProps = {
  rows: CarOwnerCustomerRequest[];
  actingId?: string | null;
  onApprove: (businessId: string) => void;
  onReject: (businessId: string) => void;
};

export function OwnerCustomerRequestsTable({
  rows,
  actingId,
  onApprove,
  onReject,
}: OwnerCustomerRequestsTableProps) {
  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className={OWNER_TABLE_SURFACE_CLASS}
    >
      <div className="overflow-x-auto">
        <table className={OWNER_PANEL_TABLE.table}>
          <thead>
            <tr className="bg-gradient-to-r from-ad-purple to-ad-purple-dark text-white">
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Shop</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>City</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Requested</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Name</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Email</th>
              <th className={OWNER_TABLE_HEAD_TH_CLASS}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const busy = actingId === row.businessId;
              const edit = row.pendingEdit;
              return (
                <tr key={row.businessId} className={index % 2 === 0 ? "bg-white/90" : "bg-slate-50/80"}>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                        {row.businessLogo ? (
                          <img src={row.businessLogo} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <span className="font-semibold text-slate-900">{row.businessName}</span>
                    </div>
                  </td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{row.city.trim() || "—"}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{formatCustomerRequestDate(row.addedAt)}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{edit?.name?.trim() || "—"}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>{edit?.email?.trim() || "—"}</td>
                  <td className={OWNER_TABLE_BODY_TD_CLASS}>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={Boolean(actingId)}
                        onClick={() => onApprove(row.businessId)}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {busy ? "…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(actingId)}
                        onClick={() => onReject(row.businessId)}
                        className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
