import { useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import PortalSidebarButton from "../admin/PortalSidebarButton";
import { OwnerSidebarFaqsSlot } from "./OwnerFaqsButton";

export type OwnerReportType =
  | "service"
  | "job-card"
  | "invoice"
  | "auto-shop"
  | "ticket-raised"
  | "ticket-resolved";

type OwnerReportsSidebarProps = {
  activeReport: OwnerReportType;
  onSelect: (report: OwnerReportType) => void;
  onFaqsClick?: () => void;
};

const PRIMARY_REPORTS: { id: OwnerReportType; label: string }[] = [
  { id: "service", label: "Service Reports" },
  { id: "job-card", label: "Job Card Reports" },
  { id: "invoice", label: "Invoice Reports" },
  { id: "auto-shop", label: "Auto Shop Reports" },
];

const TICKET_REPORTS: { id: OwnerReportType; label: string }[] = [
  { id: "ticket-raised", label: "Ticket Raised" },
  { id: "ticket-resolved", label: "Resolved" },
];

function TicketSectionHeader({
  expanded,
  active,
  onToggle,
}: {
  expanded: boolean;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={`flex w-full items-center justify-between rounded-full border px-4 py-2.5 text-left text-sm font-bold uppercase tracking-wide transition-colors ${
        active
          ? "border-blue-700 bg-blue-600 text-white shadow-md"
          : "border-blue-600 bg-blue-100 text-blue-700 hover:bg-blue-200/80"
      }`}
    >
      <span className="min-w-0 flex-1">Ticket Reports</span>
      <FiChevronDown
        className={`shrink-0 text-base transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        aria-hidden
      />
    </button>
  );
}

export default function OwnerReportsSidebar({
  activeReport,
  onSelect,
  onFaqsClick,
}: OwnerReportsSidebarProps) {
  const [ticketOpen, setTicketOpen] = useState(
    activeReport === "ticket-raised" || activeReport === "ticket-resolved"
  );
  const asideRef = useRef<HTMLElement>(null);

  const ticketActive = activeReport === "ticket-raised" || activeReport === "ticket-resolved";

  useEffect(() => {
    if (ticketActive) setTicketOpen(true);
  }, [ticketActive]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!asideRef.current?.contains(event.target as Node)) {
        if (!ticketActive) setTicketOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [ticketActive]);

  return (
    <aside
      ref={asideRef}
      className="relative flex w-full shrink-0 flex-col gap-3 overflow-visible lg:w-[220px] xl:w-[260px] lg:min-h-[calc(100vh-220px)]"
    >
      <div className="flex flex-col gap-3">
        {PRIMARY_REPORTS.map((item) => (
          <PortalSidebarButton
            key={item.id}
            label={item.label}
            active={activeReport === item.id}
            onClick={() => onSelect(item.id)}
          />
        ))}

        <div>
          <TicketSectionHeader
            expanded={ticketOpen}
            active={ticketActive}
            onToggle={() => {
              setTicketOpen((open) => !open);
              if (!ticketActive) onSelect("ticket-raised");
            }}
          />
          {ticketOpen ? (
            <div className="mt-3 flex flex-col gap-3">
              {TICKET_REPORTS.map((item) => (
                <PortalSidebarButton
                  key={item.id}
                  label={item.label}
                  active={activeReport === item.id}
                  onClick={() => onSelect(item.id)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {onFaqsClick ? <OwnerSidebarFaqsSlot onClick={onFaqsClick} /> : null}
    </aside>
  );
}
