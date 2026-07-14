import { useCallback, useEffect, useMemo, useState } from "react";
import { FiBarChart2, FiSearch } from "react-icons/fi";
import { useLocation } from "react-router";
import OwnerPageShell, { ownerPageIntroClass } from "../../../components/owner/OwnerPageShell";
import {
  OwnerFlatReportTable,
  OwnerGroupedReportTable,
} from "../../../components/owner/OwnerReportTableView";
import type { OwnerReportType } from "../../../components/owner/OwnerReportsSidebar";
import {
  ownerVehicleFieldClass,
  ownerVehicleLabelClass,
  ownerVehicleSelectClass,
} from "../../../components/owner/ownerVehicleFormUtils";
import { useCarOwnerDashboard } from "../../../hooks/useOwnerPortal";
import { useOwnerNavReset } from "../../../hooks/useOwnerNavReset";
import {
  DUMMY_REPORT_INVOICES,
  DUMMY_REPORT_JOB_CARDS,
  DUMMY_REPORT_SHOPS,
  DUMMY_REPORT_TICKETS_RAISED,
  DUMMY_REPORT_TICKETS_RESOLVED,
} from "../../../lib/dummyOwnerReports";
import {
  invoiceToReportRow,
  jobCardToReportRow,
  ownerReportTitle,
  shopToReportRow,
  ticketToReportRow,
  type GroupBy,
} from "../../../lib/ownerReportGrouping";
import type { CarOwnerJobCard } from "../../../types/carOwnerJobCards";
import { formatJobCardDate, serviceTypeLabel } from "../../../lib/carOwnerJobCards";

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

const REPORT_BY_PATH: Record<string, OwnerReportType> = {
  "/owner/reports": "job-card",
  "/owner/reports/job-cards": "job-card",
  "/owner/reports/invoices": "invoice",
  "/owner/reports/auto-shops": "auto-shop",
  "/owner/reports/tickets-raised": "ticket-raised",
};

const REPORT_PAGE_HEADINGS: Record<OwnerReportType, string> = {
  service: "Service Reports",
  "job-card": "Job Card Reports",
  invoice: "Invoice Reports",
  "auto-shop": "Auto Shop Reports",
  "ticket-raised": "Ticket Raised",
  "ticket-resolved": "Resolved",
};

const REPORT_PAGE_SUBTITLES: Record<OwnerReportType, string> = {
  service: "Summaries of service activity across shops",
  "job-card": "Job card history grouped by category or shop",
  invoice: "Invoice spend and payment tallies",
  "auto-shop": "Shops you’ve used and how they rate",
  "ticket-raised": "Support tickets you’ve opened",
  "ticket-resolved": "Tickets that have been closed",
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
  const location = useLocation();
  const activeReport = REPORT_BY_PATH[location.pathname] ?? "job-card";

  const defaultToDate = todayIso();
  const defaultFromDate = `${defaultToDate.slice(0, 4)}-01-01`;

  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [category, setCategory] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("category");
  const [applied, setApplied] = useState<AppliedFilters | null>(null);

  useEffect(() => {
    setApplied(null);
  }, [activeReport]);

  const resetSidebar = useCallback(() => {
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

  const handleSearch = () => {
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
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ad-purple/20 bg-white/60 px-6 py-14 text-center shadow-sm backdrop-blur-sm">
          <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-ad-bg-purple text-ad-purple">
            <FiBarChart2 size={22} aria-hidden />
          </span>
          <p className="max-w-sm text-sm text-slate-600">
            Set your filters and click Search to generate {reportPrompt}.
          </p>
        </div>
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
      pageHeading=""
      metaTitle="Reports | AutoDaddy"
      metaDescription="Car owner reports"
      noPanel
    >
      <div className="flex flex-col gap-4">
        <header className={`${ownerPageIntroClass} space-y-1`}>
          <p className="text-sm text-slate-500">{REPORT_PAGE_SUBTITLES[activeReport]}</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {REPORT_PAGE_HEADINGS[activeReport]}
          </h1>
        </header>

        <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5 sm:p-5">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
              Report filters
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Choose a range, category, and grouping</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className={ownerVehicleLabelClass}>
                From date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
                className={ownerVehicleFieldClass}
                required
              />
            </div>
            <div>
              <label className={ownerVehicleLabelClass}>
                To date <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
                className={ownerVehicleFieldClass}
                required
              />
            </div>
            <div>
              <label className={ownerVehicleLabelClass}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={ownerVehicleSelectClass}
              >
                <option value="">All categories</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={ownerVehicleLabelClass}>Group by</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                className={ownerVehicleSelectClass}
              >
                {GROUP_BY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-ad-purple to-ad-purple-dark px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_14px_rgba(155,48,141,0.22)] transition hover:brightness-105"
            >
              <FiSearch size={14} aria-hidden />
              Search
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200/80 transition hover:bg-slate-200/70"
            >
              Reset
            </button>
          </div>
        </div>

        {renderResults()}
      </div>
    </OwnerPageShell>
  );
}
