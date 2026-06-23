import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { FiChevronDown } from "react-icons/fi";
import PortalSidebarButton from "../admin/PortalSidebarButton";
import type { ServiceCategory, ServiceSubItem } from "../../hooks/useOwnerPortal";

type OwnerServiceSidebarProps = {
  indoor: ServiceCategory[];
  outdoor: ServiceCategory[];
  loading?: boolean;
  onFaqsClick?: () => void;
  onNextDueServiceClick?: () => void;
  nextDueServiceActive?: boolean;
  selectedServiceId?: string | null;
  selectedSubServiceId?: string | null;
  onServiceSelect?: (service: ServiceCategory) => void;
  onSubServiceSelect?: (service: ServiceCategory, subService: ServiceSubItem) => void;
};

function SectionHeader({
  label,
  expanded,
  onToggle,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="flex w-full items-center justify-between rounded-full border border-blue-600 bg-blue-100 px-4 py-2.5 text-left text-sm font-bold uppercase tracking-wide text-blue-700 transition-colors hover:bg-blue-200/80"
    >
      <span className="min-w-0 flex-1">{label}</span>
      <FiChevronDown
        className={`shrink-0 text-base transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        aria-hidden
      />
    </button>
  );
}

function SubServicePopup({
  subServices,
  selectedSubServiceId,
  onSelect,
}: {
  subServices: ServiceSubItem[];
  selectedSubServiceId?: string | null;
  onSelect: (sub: ServiceSubItem) => void;
}) {
  return (
    <div
      className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[220px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl lg:left-[calc(100%+8px)] lg:top-0 lg:mt-0 lg:w-max lg:min-w-[260px] lg:max-w-[320px]"
      role="menu"
    >
      {subServices.map((sub) => {
        const subKey = sub.id ?? sub.name;
        const selected = Boolean(selectedSubServiceId && subKey === selectedSubServiceId);

        return (
          <button
            key={subKey}
            type="button"
            role="menuitem"
            onClick={() => onSelect(sub)}
            className={`block w-full px-4 py-2.5 text-left text-sm leading-snug transition-colors ${
              selected
                ? "bg-blue-600 font-semibold text-white"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            {sub.name}
          </button>
        );
      })}
    </div>
  );
}

function ServiceItem({
  item,
  active,
  popupOpen,
  selectedSubServiceId,
  onClick,
  onSubSelect,
}: {
  item: ServiceCategory;
  active: boolean;
  popupOpen: boolean;
  selectedSubServiceId?: string | null;
  onClick: () => void;
  onSubSelect: (sub: ServiceSubItem) => void;
}) {
  const hasSubs = item.subServices.length > 0;

  return (
    <div className="relative">
      <PortalSidebarButton label={item.name} active={active} onClick={onClick} />
      {hasSubs && popupOpen ? (
        <SubServicePopup
          subServices={item.subServices}
          selectedSubServiceId={selectedSubServiceId}
          onSelect={onSubSelect}
        />
      ) : null}
    </div>
  );
}

function ServiceList({
  items,
  loading,
  selectedServiceId,
  selectedSubServiceId,
  popupServiceKey,
  onServiceSelect,
  onSubServiceSelect,
  setPopupServiceKey,
}: {
  items: ServiceCategory[];
  loading?: boolean;
  selectedServiceId?: string | null;
  selectedSubServiceId?: string | null;
  popupServiceKey: string | null;
  onServiceSelect?: (service: ServiceCategory) => void;
  onSubServiceSelect?: (service: ServiceCategory, sub: ServiceSubItem) => void;
  setPopupServiceKey: Dispatch<SetStateAction<string | null>>;
}) {
  if (loading) {
    return <p className="px-1 text-xs text-gray-500">Loading…</p>;
  }
  if (items.length === 0) {
    return <p className="px-1 text-xs text-gray-500">No services available</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const key = item.id ?? item.name;
        const popupOpen = popupServiceKey === key;
        const active = Boolean(item.id && selectedServiceId === item.id);

        return (
          <ServiceItem
            key={key}
            item={item}
            active={active}
            popupOpen={popupOpen}
            selectedSubServiceId={active ? selectedSubServiceId : null}
            onClick={() => {
              const hasSubs = item.subServices.length > 0;

              if (hasSubs) {
                if (active) {
                  setPopupServiceKey(popupOpen ? null : key);
                  return;
                }
                onServiceSelect?.(item);
                setPopupServiceKey(key);
                return;
              }

              onServiceSelect?.(item);
              setPopupServiceKey(null);
            }}
            onSubSelect={(sub) => {
              onSubServiceSelect?.(item, sub);
              setPopupServiceKey(null);
            }}
          />
        );
      })}
    </div>
  );
}

type ServiceSection = "indoor" | "outdoor" | null;

export default function OwnerServiceSidebar({
  indoor,
  outdoor,
  loading,
  onFaqsClick,
  onNextDueServiceClick,
  nextDueServiceActive = false,
  selectedServiceId,
  selectedSubServiceId,
  onServiceSelect,
  onSubServiceSelect,
}: OwnerServiceSidebarProps) {
  const [openSection, setOpenSection] = useState<ServiceSection>(null);
  const [popupServiceKey, setPopupServiceKey] = useState<string | null>(null);
  const asideRef = useRef<HTMLElement>(null);

  const toggleSection = (section: Exclude<ServiceSection, null>) => {
    setOpenSection((current) => (current === section ? null : section));
    setPopupServiceKey(null);
  };

  const indoorOpen = openSection === "indoor";
  const outdoorOpen = openSection === "outdoor";

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!asideRef.current?.contains(event.target as Node)) {
        setPopupServiceKey(null);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const listProps = {
    loading,
    selectedServiceId,
    selectedSubServiceId,
    popupServiceKey,
    onServiceSelect,
    onSubServiceSelect,
    setPopupServiceKey,
  };

  return (
    <aside
      ref={asideRef}
      className="relative flex w-full shrink-0 flex-col gap-3 overflow-visible lg:w-[220px] xl:w-[260px] lg:min-h-[calc(100vh-220px)]"
    >
      <div className="flex flex-col gap-3">
        <SectionHeader
          label="Indoor Services"
          expanded={indoorOpen}
          onToggle={() => toggleSection("indoor")}
        />
        {indoorOpen ? <ServiceList items={indoor} {...listProps} /> : null}

        <SectionHeader
          label="Out Door Services"
          expanded={outdoorOpen}
          onToggle={() => toggleSection("outdoor")}
        />
        {outdoorOpen ? <ServiceList items={outdoor} {...listProps} /> : null}
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-6">
        {onNextDueServiceClick ? (
          <button
            type="button"
            onClick={onNextDueServiceClick}
            className={`w-full rounded-full border px-4 py-2.5 text-center text-sm font-bold uppercase tracking-wide transition-colors ${nextDueServiceActive
                ? "border-blue-700 bg-blue-600 text-white shadow-md"
                : "border-blue-600 bg-white/70 text-blue-600 hover:bg-white"
              }`}
          >
            Next Due Service
          </button>
        ) : null}
        {onFaqsClick ? (
          <button
            type="button"
            onClick={onFaqsClick}
            className="w-full rounded-full border border-red-700 bg-red-600 px-4 py-2.5 text-center text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-red-700"
          >
            FAQs
          </button>
        ) : null}
      </div>

    </aside>
  );
}
