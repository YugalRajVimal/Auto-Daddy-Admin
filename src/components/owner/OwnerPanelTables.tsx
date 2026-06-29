import { motion } from "framer-motion";
import { ADMIN_PANEL_THEAD_ROW_CLASS, adminPanelRowClass } from "../admin/adminPanelTableStyles";
import {
  businessName,
  formatBusinessPhone,
  formatJobCardDate,
  isPaidJobCard,
  jobCardLicensePlate,
  jobChipLabel,
  serviceTypeLabel,
} from "../../lib/carOwnerJobCards";
import { formatCurrencyAmount } from "../../lib/currency";
import { vehicleSidebarLabel, type CarOwnerVehicle } from "../../lib/carOwnerVehicles";
import { isPaidInvoiceRow, type CarOwnerInvoiceRow } from "../../hooks/useCarOwnerInvoices";
import type { CarOwnerJobCard } from "../../types/carOwnerJobCards";
import type { ServiceSubItem } from "../../hooks/useOwnerPortal";
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
                    {formatCurrencyAmount(jc.totalPayableAmount, countryCode)}
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
  const no = row.jobNo?.trim();
  if (!no) return "—";
  return no.toLowerCase().startsWith("invoice") ? no : `Invoice #${no}`;
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
