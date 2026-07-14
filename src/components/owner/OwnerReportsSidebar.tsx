import { useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { ShopSidebarButton } from "../shop/ShopSidebar";
import { ownerSidebarButtonStackClass } from "../shop/shopSidebarStyles";
import { OwnerFaqsButton, ownerPageSidebarFooterClass } from "./OwnerFaqsButton";
import { ownerPageSidebarClass } from "./ownerLayoutStyles";

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
    <ShopSidebarButton
      label="Ticket Reports"
      active={active || expanded}
      ownerStyle
      onClick={onToggle}
      trailing={
        <FiChevronDown
          className={`shrink-0 text-base transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        />
      }
    />
  );
}

export default function OwnerReportsSidebar({
  activeReport,
  onSelect,
  onFaqsClick,
}: OwnerReportsSidebarProps) {
  const [ticketOpen, setTicketOpen] = useState(
    activeReport === "ticket-raised" || activeReport === "ticket-resolved",
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
    <aside ref={asideRef} className={`${ownerPageSidebarClass} lg:!h-auto lg:!max-h-none`}>
      <div
        className={`min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/70 bg-white/45 p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-xl lg:pr-2.5 ${ownerSidebarButtonStackClass}`}
      >
        {PRIMARY_REPORTS.map((item) => (
          <ShopSidebarButton
            key={item.id}
            label={item.label}
            active={activeReport === item.id}
            ownerStyle
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
            <div className={`mt-2 ${ownerSidebarButtonStackClass}`}>
              {TICKET_REPORTS.map((item) => (
                <ShopSidebarButton
                  key={item.id}
                  label={item.label}
                  active={activeReport === item.id}
                  ownerStyle
                  onClick={() => onSelect(item.id)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {onFaqsClick ? (
        <div className={ownerPageSidebarFooterClass}>
          <OwnerFaqsButton onClick={onFaqsClick} />
        </div>
      ) : null}
    </aside>
  );
}
