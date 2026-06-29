import { useCallback, useMemo, useState } from "react";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
} from "../../components/admin/ContentPanel";
import OwnerPageShell from "../../components/owner/OwnerPageShell";
import {
  OwnerFlatReportTable,
  OwnerGroupedReportTable,
} from "../../components/owner/OwnerReportTableView";
import type { OwnerReportType } from "../../components/owner/OwnerReportsSidebar";
import { useCarOwnerDashboard } from "../../hooks/useOwnerPortal";
import { useOwnerNavReset } from "../../hooks/useOwnerNavReset";
import {
  DUMMY_REPORT_INVOICES,
  DUMMY_REPORT_JOB_CARDS,
  DUMMY_REPORT_SHOPS,
  DUMMY_REPORT_TICKETS_RAISED,
  DUMMY_REPORT_TICKETS_RESOLVED,
} from "../../lib/dummyOwnerReports";
import {
  invoiceToReportRow,
  jobCardToReportRow,
  ownerReportTitle,
  shopToReportRow,
  ticketToReportRow,
  type GroupBy,
} from "../../lib/ownerReportGrouping";
import type { CarOwnerJobCard } from "../../types/carOwnerJobCards";
import { formatJobCardDate, serviceTypeLabel } from "../../lib/carOwnerJobCards";

type AppliedFilters = {
  fromDate: string;
  toDate: string;
  category: string;
  groupBy: GroupBy;
};

const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "category", label: "Category" },
  { value: "vendor", label: "Vendor" },
  { value: "project", label: "Project" },
];

const REPORT_SECTIONS: { id: OwnerReportType; label: string }[] = [
  { id: "service", label: "Service Reports" },
  { id: "job-card", label: "Job Card Reports" },
  { id: "invoice", label: "Invoice Reports" },
  { id: "auto-shop", label: "Auto Shop Reports" },
  { id: "ticket-raised", label: "Ticket Raised" },
  { id: "ticket-resolved", label: "Resolved" },
];

const REPORT_PAGE_HEADINGS: Record<OwnerReportType, string> = {
  service: "Service Reports",
  "job-card": "Job Card Reports",
  invoice: "Invoice Reports",
  "auto-shop": "Auto Shop Reports",
  "ticket-raised": "Ticket Raised",
  "ticket-resolved": "Resolved",
};

const SAMPLE_REPORT_CATEGORIES = [
  "General Repair",
  "Oil Change",
  "Brake Service",
  "Tire Service",
  "Engine Repair",
  "Transmission",
  "Battery & Electrical",
  "AC & Heating",
  "Detailing & Wash",
  "Inspection",
  "Body Work",
  "Towing",
] as const;

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function inDateRange(iso: string, fromDate: string, toDate: string): boolean {
  const value = iso.trim();
  if (!value) return false;
  const day = value.slice(0, 10);
  if (fromDate && day < fromDate) return false;
  if (toDate && day > toDate) return false;
  return true;
}

function jobCardCategory(jc: CarOwnerJobCard): string {
  return serviceTypeLabel(jc).trim() || "Uncategorized";
}

function filterJobCards(items: CarOwnerJobCard[], filters: AppliedFilters): CarOwnerJobCard[] {
  return items.filter((jc) => {
    if (!inDateRange(jc.createdAt, filters.fromDate, filters.toDate)) return false;
    if (filters.category) {
      const category = jobCardCategory(jc).toLowerCase();
      if (!category.includes(filters.category.toLowerCase())) return false;
    }
    return true;
  });
}

export default function OwnerReportsPage() {
  const { displayName } = useCarOwnerDashboard();

  const defaultToDate = todayIso();
  const defaultFromDate = `${defaultToDate.slice(0, 4)}-01-01`;

  const [activeReport, setActiveReport] = useState<OwnerReportType>(REPORT_SECTIONS[0].id);
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [category, setCategory] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("category");
  const [applied, setApplied] = useState<AppliedFilters | null>(null);

  const resetSidebar = useCallback(() => {
    setActiveReport(REPORT_SECTIONS[0].id);
    setFromDate(defaultFromDate);
    setToDate(defaultToDate);
    setCategory("");
    setGroupBy("category");
    setApplied(null);
  }, [defaultFromDate, defaultToDate]);

  useOwnerNavReset(resetSidebar);

  const categoryOptions = useMemo(() => {
    const names = new Set<string>(SAMPLE_REPORT_CATEGORIES);
    for (const jc of DUMMY_REPORT_JOB_CARDS) {
      const label = jobCardCategory(jc);
      if (label) names.add(label);
    }
    for (const inv of DUMMY_REPORT_INVOICES) {
      if (inv.category) names.add(inv.category);
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, []);

  const handleSave = () => {
    if (!fromDate || !toDate) return;
    setApplied({ fromDate, toDate, category, groupBy });
  };

  const handleReset = () => {
    const today = todayIso();
    setFromDate(`${today.slice(0, 4)}-01-01`);
    setToDate(today);
    setCategory("");
    setGroupBy("category");
    setApplied(null);
  };

  const filteredJobCards = useMemo(() => {
    if (!applied) return [];
    return filterJobCards(DUMMY_REPORT_JOB_CARDS, applied);
  }, [applied]);

  const filteredInvoices = useMemo(() => {
    if (!applied) return [];
    return DUMMY_REPORT_INVOICES.filter((row) => {
      if (!inDateRange(row.createdAt, applied.fromDate, applied.toDate)) return false;
      if (applied.category) {
        const haystack = `${row.shopName} ${row.plate} ${row.jobNo} ${row.category}`.toLowerCase();
        if (!haystack.includes(applied.category.toLowerCase())) return false;
      }
      return true;
    });
  }, [applied]);

  const filteredShops = useMemo(() => {
    if (!applied) return [];
    if (!applied.category.trim()) return DUMMY_REPORT_SHOPS;
    const needle = applied.category.toLowerCase();
    return DUMMY_REPORT_SHOPS.filter((shop) => {
      const services = shop.mainServices.join(" ");
      const haystack = `${shop.name} ${shop.city} ${shop.address} ${services}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [applied]);

  const filteredTickets = useMemo(() => {
    if (!applied) return [];
    const source =
      activeReport === "ticket-resolved"
        ? DUMMY_REPORT_TICKETS_RESOLVED
        : DUMMY_REPORT_TICKETS_RAISED;
    return source.filter((item) => {
      if (!inDateRange(item.time, applied.fromDate, applied.toDate)) return false;
      if (applied.category) {
        const haystack = `${item.title} ${item.message}`.toLowerCase();
        if (!haystack.includes(applied.category.toLowerCase())) return false;
      }
      return true;
    });
  }, [activeReport, applied]);

  const reportPrompt = (() => {
    switch (activeReport) {
      case "service":
        return "service reports";
      case "job-card":
        return "job card reports";
      case "invoice":
        return "invoice reports";
      case "auto-shop":
        return "auto shop reports";
      case "ticket-raised":
        return "raised ticket reports";
      case "ticket-resolved":
        return "resolved ticket reports";
      default:
        return "reports";
    }
  })();

  const renderResults = () => {
    if (!applied) {
      return (
        <p className="rounded-md border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-600">
          Set your filters and click Save to generate {reportPrompt}.
        </p>
      );
    }

    const title = ownerReportTitle(activeReport, applied.groupBy);
    const ownerName = displayName || undefined;
    const { fromDate: reportFrom, toDate: reportTo, groupBy: reportGroupBy } = applied;

    if (activeReport === "invoice") {
      const rows = filteredInvoices.map(invoiceToReportRow);
      return (
        <OwnerGroupedReportTable
          title={title}
          ownerName={ownerName}
          fromDate={reportFrom}
          toDate={reportTo}
          groupBy={reportGroupBy}
          rows={rows}
        />
      );
    }

    if (activeReport === "auto-shop") {
      const rows = filteredShops.map(shopToReportRow);
      return (
        <OwnerFlatReportTable
          title={title}
          ownerName={ownerName}
          fromDate={reportFrom}
          toDate={reportTo}
          headers={["Auto Shop", "City", "Phone", "Services", "Rating"]}
          rows={rows}
          renderCell={(row, header) => {
            switch (header) {
              case "Auto Shop":
                return row.vendor;
              case "City":
                return row.project;
              case "Phone": {
                const parts = row.notes.split(" · ");
                return parts[parts.length - 1] ?? "—";
              }
              case "Services":
                return row.category;
              case "Rating":
                return row.amount ? `${row.amount} ★` : "—";
              default:
                return "—";
            }
          }}
        />
      );
    }

    if (activeReport === "ticket-raised" || activeReport === "ticket-resolved") {
      const rows = filteredTickets.map(ticketToReportRow);
      return (
        <OwnerFlatReportTable
          title={title}
          ownerName={ownerName}
          fromDate={reportFrom}
          toDate={reportTo}
          headers={["Date", "Message"]}
          rows={rows}
          renderCell={(row, header) => {
            if (header === "Date") return row.date ? formatJobCardDate(row.date) : "—";
            return row.notes;
          }}
        />
      );
    }

    const rows = filteredJobCards.map(jobCardToReportRow);
    return (
      <OwnerGroupedReportTable
        title={title}
        ownerName={ownerName}
        fromDate={reportFrom}
        toDate={reportTo}
        groupBy={reportGroupBy}
        rows={rows}
        vendorColumnLabel="Auto Shop"
      />
    );
  };

  return (
    <OwnerPageShell
      pageHeading={REPORT_PAGE_HEADINGS[activeReport]}
      metaTitle="Reports | AutoDaddy"
      metaDescription="Car owner reports"
      sidebarItems={REPORT_SECTIONS.map((item) => ({
        id: item.id,
        label: item.label,
        variant: "primary" as const,
      }))}
      activeSidebarId={activeReport}
      onSidebarSelect={(id) => {
        setActiveReport(id as OwnerReportType);
        setApplied(null);
      }}
      heroCardFlush
      contentTopOffset
    >
      <div className="space-y-4">
        <CompactFormPanel
          footer={
            <CompactFormFooter
              actionLabel="Save"
              cancelLabel="Reset"
              onSave={handleSave}
              onCancel={handleReset}
              messageCenter
              message=""
            />
          }
        >
          <CompactFormRow className="w-full flex-nowrap items-end overflow-x-auto">
            <CompactField label="Date Range" required className={compactFixedFieldWidth}>
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
                className={compactInputClass}
                required
              />
            </CompactField>
            <CompactField label="To Date" required className={compactFixedFieldWidth}>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
                className={compactInputClass}
                required
              />
            </CompactField>
            <CompactField label="Category" className={compactFixedFieldWidth}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={compactInputClass}
              >
                <option value="">Categories</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </CompactField>
            <CompactField label="Group By" className={compactFixedFieldWidth}>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                className={compactInputClass}
              >
                {GROUP_BY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </CompactField>
          </CompactFormRow>
        </CompactFormPanel>

        {renderResults()}
      </div>
    </OwnerPageShell>
  );
}
