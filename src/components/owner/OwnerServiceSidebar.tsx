import { useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { FiChevronDown } from "react-icons/fi";
import PortalSidebarButton from "../admin/PortalSidebarButton";
import PortalSidebarPopup from "../admin/PortalSidebarPopup";
import {
  portalSidebarPillClass,
  portalSidebarSectionHeaderClass,
} from "../admin/portalSidebarStyles";
import { OwnerFaqsButton, ownerPageSidebarFooterClass } from "./OwnerFaqsButton";
import { ownerPageSidebarClass } from "./OwnerPageShell";
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
      className={portalSidebarSectionHeaderClass(false, expanded)}
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
  anchorRef,
  subServices,
  selectedSubServiceId,
  onSelect,
}: {
  anchorRef: RefObject<HTMLDivElement | null>;
  subServices: ServiceSubItem[];
  selectedSubServiceId?: string | null;
  onSelect: (sub: ServiceSubItem) => void;
}) {
  return (
    <PortalSidebarPopup anchorRef={anchorRef}>
      {subServices.map((sub) => {
        const subKey = sub.id ?? sub.name;
        const selected = Boolean(selectedSubServiceId && subKey === selectedSubServiceId);

        return (
          <button
            key={subKey}
            type="button"
            role="menuitem"
            onClick={() => onSelect(sub)}
            className={`block w-full px-4 py-2.5 text-left text-sm leading-snug transition-colors ${selected
                ? "bg-blue-600 font-semibold text-white"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              }`}
          >
            {sub.name}
          </button>
        );
      })}
    </PortalSidebarPopup>
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
  const anchorRef = useRef<HTMLDivElement>(null);
  const hasSubs = item.subServices.length > 0;

  return (
    <div ref={anchorRef} className="relative">
      <PortalSidebarButton label={item.name} active={active} filled={popupOpen} onClick={onClick} />
      {hasSubs && popupOpen ? (
        <SubServicePopup
          anchorRef={anchorRef}
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
        const selected = Boolean(item.id && selectedServiceId === item.id);

        return (
          <ServiceItem
            key={key}
            item={item}
            active={selected}
            popupOpen={popupOpen}
            selectedSubServiceId={selected ? selectedSubServiceId : null}
            onClick={() => {
              const hasSubs = item.subServices.length > 0;

              if (hasSubs) {
                if (selected) {
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
    <aside ref={asideRef} className={ownerPageSidebarClass}>
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

      {onNextDueServiceClick || onFaqsClick ? (
        <div className={ownerPageSidebarFooterClass}>
          {onNextDueServiceClick ? (
            <button
              type="button"
              onClick={onNextDueServiceClick}
              className={`w-full text-center ${portalSidebarPillClass(nextDueServiceActive)}`}
            >
              Next Due Service
            </button>
          ) : null}
          {onFaqsClick ? <OwnerFaqsButton onClick={onFaqsClick} /> : null}
        </div>
      ) : null}
    </aside>
  );
}
