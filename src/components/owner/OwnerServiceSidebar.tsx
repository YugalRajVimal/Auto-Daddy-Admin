import { useState } from "react";
import { ShopSidebarButton } from "../shop/ShopSidebar";
import {
  OwnerCollapsibleSidebarItem,
  OwnerCollapsibleSidebarList,
} from "./OwnerCollapsibleSidebar";
import type { ServiceCategory, ServiceSubItem } from "../../hooks/useOwnerPortal";
import { isOutdoorServiceCategory } from "../../lib/serviceCatalog";

type OwnerServiceSidebarProps = {
  indoor: ServiceCategory[];
  outdoor: ServiceCategory[];
  loading?: boolean;
  selectedServiceId?: string | null;
  selectedSubServiceId?: string | null;
  onServiceSelect?: (service: ServiceCategory) => void;
  onSubServiceSelect?: (sub: ServiceSubItem) => void;
  /** Flat home dashboard list — no indoor/outdoor grouping. */
  flat?: boolean;
};

type ServiceSection = "indoor" | "outdoor" | null;

function ServiceList({
  items,
  loading,
  selectedServiceId,
  selectedSubServiceId,
  expandedServiceKey,
  onServiceSelect,
  onSubServiceSelect,
  onExpandService,
}: {
  items: ServiceCategory[];
  loading?: boolean;
  selectedServiceId?: string | null;
  selectedSubServiceId?: string | null;
  expandedServiceKey: string | null;
  onServiceSelect?: (service: ServiceCategory) => void;
  onSubServiceSelect?: (sub: ServiceSubItem) => void;
  onExpandService: (key: string | null) => void;
}) {
  if (loading) {
    return <p className="px-1 text-xs text-gray-500">Loading…</p>;
  }
  if (items.length === 0) {
    return <p className="px-1 text-xs text-gray-500">No services available</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const key = item.id ?? item.name;
        const hasSubs = item.subServices.length > 0;
        const expanded = expandedServiceKey === key;
        const selected = Boolean(selectedServiceId && selectedServiceId === key);

        return (
          <OwnerCollapsibleSidebarItem
            key={key}
            label={item.name}
            expanded={hasSubs && expanded}
            active={selected}
            collapsible={hasSubs}
            onToggle={() => {
              onServiceSelect?.(item);
              if (hasSubs) {
                if (expanded) {
                  onExpandService(null);
                } else {
                  onExpandService(key);
                  const firstSub = item.subServices[0];
                  if (firstSub) {
                    onSubServiceSelect?.(firstSub);
                  }
                }
              } else {
                onExpandService(null);
              }
            }}
          >
            {hasSubs
              ? item.subServices.map((sub) => {
                  const subKey = sub.id ?? sub.name;
                  const subSelected = Boolean(selectedSubServiceId && subKey === selectedSubServiceId);

                  return (
                    <ShopSidebarButton
                      key={subKey}
                      label={sub.name}
                      active={subSelected}
                      onClick={() => onSubServiceSelect?.(sub)}
                    />
                  );
                })
              : undefined}
          </OwnerCollapsibleSidebarItem>
        );
      })}
    </div>
  );
}

export default function OwnerServiceSidebar({
  indoor,
  outdoor,
  loading,
  selectedServiceId,
  selectedSubServiceId,
  onServiceSelect,
  onSubServiceSelect,
  flat = false,
}: OwnerServiceSidebarProps) {
  const [openSection, setOpenSection] = useState<ServiceSection>(null);
  const [expandedServiceKey, setExpandedServiceKey] = useState<string | null>(null);

  if (flat) {
    const allServices = [...indoor, ...outdoor];

    if (loading) {
      return <p className="px-1 text-xs text-gray-500">Loading…</p>;
    }
    if (allServices.length === 0) {
      return <p className="px-1 text-xs text-gray-500">No services available</p>;
    }

    return (
      <div className="flex flex-col gap-2">
        {allServices.map((item) => {
          const key = item.id ?? item.name;
          const outdoor = isOutdoorServiceCategory(item);
          const selected = Boolean(selectedServiceId && selectedServiceId === key);

          return (
            <ShopSidebarButton
              key={key}
              label={item.name}
              active={selected}
              outdoor={outdoor}
              onClick={() => onServiceSelect?.(item)}
            />
          );
        })}
      </div>
    );
  }

  const toggleSection = (section: Exclude<ServiceSection, null>) => {
    const isCurrentlyOpen = openSection === section;
    setOpenSection(isCurrentlyOpen ? null : section);
    setExpandedServiceKey(null);

    if (!isCurrentlyOpen) {
      const items = section === "indoor" ? indoor : outdoor;
      const first = items[0];
      if (!first) return;

      onServiceSelect?.(first);
      if (first.subServices.length > 0) {
        const key = first.id ?? first.name;
        setExpandedServiceKey(key);
        const firstSub = first.subServices[0];
        if (firstSub) {
          onSubServiceSelect?.(firstSub);
        }
      }
    }
  };

  const indoorOpen = openSection === "indoor";
  const outdoorOpen = openSection === "outdoor";

  const listProps = {
    loading,
    selectedServiceId,
    selectedSubServiceId,
    expandedServiceKey,
    onServiceSelect,
    onSubServiceSelect,
    onExpandService: setExpandedServiceKey,
  };

  return (
    <OwnerCollapsibleSidebarList>
      <OwnerCollapsibleSidebarItem
        label="Indoor Services"
        expanded={indoorOpen}
        onToggle={() => toggleSection("indoor")}
      >
        <ServiceList items={indoor} {...listProps} />
      </OwnerCollapsibleSidebarItem>

      <OwnerCollapsibleSidebarItem
        label="Out Door Services"
        expanded={outdoorOpen}
        onToggle={() => toggleSection("outdoor")}
      >
        <ServiceList items={outdoor} {...listProps} />
      </OwnerCollapsibleSidebarItem>
    </OwnerCollapsibleSidebarList>
  );
}
