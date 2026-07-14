import { useEffect, useState } from "react";
import { ShopSidebarButton } from "../shop/ShopSidebar";
import {
  OwnerCollapsibleSidebarItem,
  OwnerCollapsibleSidebarList,
} from "./OwnerCollapsibleSidebar";
import { vehicleSidebarLabel, type CarOwnerVehicle } from "../../lib/carOwnerVehicles";

export type VehiclePanelSection =
  | "vehicle-details"
  | "job-cards"
  | "invoices"
  | "documents"
  | "update-odometer";

type VehicleSection = { id: VehiclePanelSection; label: string };

type OwnerVehicleSectionsSidebarProps = {
  sections: VehicleSection[];
  vehicles: CarOwnerVehicle[];
  loading?: boolean;
  activeSection: VehiclePanelSection | null;
  selectedVehicleId: string | null;
  onSectionSelect: (id: VehiclePanelSection) => void;
  onVehicleSelect: (vehicleId: string) => void;
};

function vehiclePlateLabel(vehicle: CarOwnerVehicle): string {
  const plate = vehicle.licensePlateNo?.trim().toUpperCase();
  if (plate) return plate;
  return vehicleSidebarLabel(vehicle);
}

function sectionNeedsVehicle(section: VehiclePanelSection): boolean {
  return section !== "invoices";
}

export default function OwnerVehicleSectionsSidebar({
  sections,
  vehicles,
  loading,
  activeSection,
  selectedVehicleId,
  onSectionSelect,
  onVehicleSelect,
}: OwnerVehicleSectionsSidebarProps) {
  const [expandedSection, setExpandedSection] = useState<VehiclePanelSection | null>(activeSection);

  useEffect(() => {
    if (activeSection) {
      setExpandedSection(activeSection);
    }
  }, [activeSection]);

  if (loading) {
    return <p className="px-1 text-xs text-gray-500">Loading…</p>;
  }

  return (
    <OwnerCollapsibleSidebarList>
      {sections.map((section) => {
        const hasVehicleList = sectionNeedsVehicle(section.id) && vehicles.length > 1;
        const expanded = expandedSection === section.id;
        const active = activeSection === section.id;

        return (
          <OwnerCollapsibleSidebarItem
            key={section.id}
            label={section.label}
            expanded={hasVehicleList ? expanded : false}
            active={active}
            collapsible={hasVehicleList}
            onToggle={() => {
              if (hasVehicleList) {
                const nextExpanded = expanded ? null : section.id;
                setExpandedSection(nextExpanded);
                if (nextExpanded) {
                  onSectionSelect(section.id);
                  if (vehicles[0]) {
                    onVehicleSelect(vehicles[0].id);
                  }
                }
                return;
              }
              setExpandedSection(section.id);
              onSectionSelect(section.id);
            }}
          >
            {hasVehicleList
              ? vehicles.map((vehicle) => (
                  <ShopSidebarButton
                    key={vehicle.id}
                    label={vehiclePlateLabel(vehicle)}
                    active={selectedVehicleId === vehicle.id}
                    ownerStyle
                    onClick={() => onVehicleSelect(vehicle.id)}
                  />
                ))
              : undefined}
          </OwnerCollapsibleSidebarItem>
        );
      })}
    </OwnerCollapsibleSidebarList>
  );
}
