import type { OwnerReportType } from "../components/owner/OwnerReportsSidebar";
import type { DummyInvoiceRow } from "./dummyOwnerReports";
import { formatJobCardDate, businessName, serviceTypeLabel, jobCardLicensePlate } from "./carOwnerJobCards";
import type { CarOwnerAutoShopListItem } from "../types/carOwnerAutoShops";
import type { CarOwnerJobCard } from "../types/carOwnerJobCards";
import { notificationDisplay, type CarOwnerNotification } from "../types/carOwnerNotifications";
import {
  formatLongDate,
  formatReportAmount,
  groupByLabel,
  type GroupBy,
} from "../pages/AdminPages/Reports/reportGrouping";

export type { GroupBy };

export type OwnerReportRow = {
  id: string;
  date: string;
  vendor: string;
  category: string;
  project: string;
  notes: string;
  amount: number;
};

export type OwnerReportGroup = {
  key: string;
  label: string;
  rows: OwnerReportRow[];
  total: number;
};

export function ownerReportTitle(report: OwnerReportType, groupBy: GroupBy): string {
  const names: Record<OwnerReportType, string> = {
    service: "Service Report",
    "job-card": "Job Card Report",
    invoice: "Invoice Report",
    "auto-shop": "Auto Shop Report",
    "ticket-raised": "Ticket Raised Report",
    "ticket-resolved": "Ticket Resolved Report",
  };
  const base = names[report];
  if (report === "auto-shop" || report === "ticket-raised" || report === "ticket-resolved") {
    return base;
  }
  return `${base} by ${groupByLabel(groupBy)}`;
}

export function sumOwnerAmounts(rows: OwnerReportRow[]) {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

function rowDate(iso: string): string {
  return iso.trim().slice(0, 10);
}

export function jobCardToReportRow(jc: CarOwnerJobCard): OwnerReportRow {
  return {
    id: jc._id,
    date: rowDate(jc.createdAt),
    vendor: businessName(jc.business),
    category: serviceTypeLabel(jc),
    project: jobCardLicensePlate(jc),
    notes: [jc.jobNo?.trim() ? `Job ${jc.jobNo.trim()}` : "", jc.status?.trim(), jc.paymentStatus?.trim()]
      .filter(Boolean)
      .join(" · "),
    amount: jc.totalPayableAmount ?? 0,
  };
}

export function invoiceToReportRow(row: DummyInvoiceRow): OwnerReportRow {
  return {
    id: row.id,
    date: rowDate(row.createdAt),
    vendor: row.shopName,
    category: row.category,
    project: row.plate,
    notes: [`Job ${row.jobNo}`, row.paymentStatus].filter(Boolean).join(" · "),
    amount: row.amount,
  };
}

export function shopToReportRow(shop: CarOwnerAutoShopListItem): OwnerReportRow {
  return {
    id: shop.id,
    date: "",
    vendor: shop.name,
    category: shop.mainServices.join(", ") || "—",
    project: shop.city || "—",
    notes: [shop.address, shop.phone].filter(Boolean).join(" · "),
    amount: shop.rating ?? 0,
  };
}

export function ticketToReportRow(item: CarOwnerNotification): OwnerReportRow {
  const { title, description } = notificationDisplay(item);
  const notes = [title, description].filter(Boolean).join(" — ");

  return {
    id: item.id,
    date: rowDate(item.time),
    vendor: "—",
    category: "—",
    project: "—",
    notes: notes || item.message,
    amount: 0,
  };
}

export function groupOwnerRows(rows: OwnerReportRow[], groupBy: GroupBy): OwnerReportGroup[] {
  const map = new Map<string, OwnerReportRow[]>();

  for (const row of rows) {
    const key =
      groupBy === "vendor"
        ? row.vendor.trim() || "—"
        : groupBy === "project"
          ? row.project.trim() || "—"
          : row.category.trim() || "—";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }

  return [...map.entries()]
    .map(([key, groupRows]) => {
      const sortedRows = [...groupRows].sort((a, b) => a.date.localeCompare(b.date) || a.vendor.localeCompare(b.vendor));
      return {
        key,
        label: groupBy === "vendor" ? key.toUpperCase() : key,
        rows: sortedRows,
        total: sumOwnerAmounts(sortedRows),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function tableHeadersForGroupBy(groupBy: GroupBy, vendorLabel = "Auto Shop") {
  if (groupBy === "category") return ["Date", vendorLabel, "Notes", "Amount"] as const;
  if (groupBy === "vendor") return ["Date", "Category", "Notes", "Amount"] as const;
  return [vendorLabel, "Category", "Notes", "Amount"] as const;
}

export function cellValueForHeader(row: OwnerReportRow, header: string, groupBy: GroupBy): string {
  switch (header) {
    case "Date":
      return row.date ? formatJobCardDate(row.date) : "—";
    case "Auto Shop":
    case "Vendor":
      return groupBy === "project" || groupBy === "category" ? row.vendor : row.vendor.toUpperCase();
    case "Category":
      return row.category;
    case "Notes":
      return row.notes;
    case "Amount":
      return formatReportAmount(row.amount);
    case "City":
      return row.project;
    case "Phone":
      return row.notes.split(" · ").pop() ?? "—";
    case "Services":
      return row.category;
    case "Rating":
      return row.amount ? `${row.amount} ★` : "—";
    case "Message":
      return row.notes;
    default:
      return "";
  }
}

export { formatLongDate, formatReportAmount };
