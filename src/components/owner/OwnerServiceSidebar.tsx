import { useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import type { ServiceCategory } from "../../hooks/useOwnerPortal";

type OwnerServiceSidebarProps = {
  indoor: ServiceCategory[];
  outdoor: ServiceCategory[];
  loading?: boolean;
  onFaqsClick?: () => void;
  selectedServiceId?: string | null;
  onServiceSelect?: (service: ServiceCategory) => void;
};

function SectionHeader({
  label,
  variant,
  expanded,
  onToggle,
}: {
  label: string;
  variant: "indoor" | "outdoor";
  expanded: boolean;
  onToggle: () => void;
}) {
  const styles =
    variant === "indoor"
      ? "bg-[#008000] hover:bg-[#006600]"
      : "bg-[#2563eb] hover:bg-[#1d4ed8]";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm font-bold text-white transition-colors ${styles}`}
    >
      <span>{label}</span>
      <FiChevronDown
        className={`shrink-0 text-base transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        aria-hidden
      />
    </button>
  );
}

function ServiceButton({
  name,
  active,
  onClick,
}: {
  name: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-left text-sm font-bold transition-colors ${
        active
          ? "border-ad-purple bg-white text-ad-purple ring-2 ring-ad-purple"
          : "border-ad-purple bg-[#FDE4D0] text-ad-purple hover:bg-[#f5c9a8]"
      }`}
    >
      <span>{name}</span>
      <FiChevronRight className="shrink-0 text-base" aria-hidden />
    </button>
  );
}

export default function OwnerServiceSidebar({
  indoor,
  outdoor,
  loading,
  onFaqsClick,
  selectedServiceId,
  onServiceSelect,
}: OwnerServiceSidebarProps) {
  const [indoorOpen, setIndoorOpen] = useState(false);
  const [outdoorOpen, setOutdoorOpen] = useState(true);

  return (
    <aside className="flex w-full shrink-0 flex-col gap-2 lg:w-[220px] xl:w-[240px] lg:min-h-[calc(100vh-220px)]">
      <div className="flex flex-col gap-2">
        <SectionHeader
          label="Indoor Services"
          variant="indoor"
          expanded={indoorOpen}
          onToggle={() => setIndoorOpen((open) => !open)}
        />
        {indoorOpen ? (
          <div className="flex flex-col gap-2">
            {loading ? (
              <p className="px-1 text-xs text-gray-500">Loading…</p>
            ) : indoor.length === 0 ? (
              <p className="px-1 text-xs text-gray-500">No services available</p>
            ) : (
              indoor.map((item) => (
                <ServiceButton
                  key={item.id ?? item.name}
                  name={item.name}
                  active={Boolean(item.id && selectedServiceId === item.id)}
                  onClick={() => onServiceSelect?.(item)}
                />
              ))
            )}
          </div>
        ) : null}

        <SectionHeader
          label="Out Door Services"
          variant="outdoor"
          expanded={outdoorOpen}
          onToggle={() => setOutdoorOpen((open) => !open)}
        />
        {outdoorOpen ? (
          <div className="flex flex-col gap-2">
            {loading ? (
              <p className="px-1 text-xs text-gray-500">Loading…</p>
            ) : outdoor.length === 0 ? (
              <p className="px-1 text-xs text-gray-500">No services available</p>
            ) : (
              outdoor.map((item) => (
                <ServiceButton
                  key={item.id ?? item.name}
                  name={item.name}
                  active={Boolean(item.id && selectedServiceId === item.id)}
                  onClick={() => onServiceSelect?.(item)}
                />
              ))
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={onFaqsClick}
          className="w-full rounded-md bg-ad-purple px-3 py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-ad-purple-dark"
        >
          FAQs
        </button>
      </div>
    </aside>
  );
}
