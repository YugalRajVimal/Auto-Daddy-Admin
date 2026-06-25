import { type RefObject } from "react";
import PortalSidebarPopup from "../admin/PortalSidebarPopup";
import { vehicleSidebarLabel, type CarOwnerVehicle } from "../../lib/carOwnerVehicles";

type VehiclePickerPopupProps = {
  anchorRef: RefObject<HTMLElement | null>;
  vehicles: CarOwnerVehicle[];
  onSelect: (vehicleId: string) => void;
};

export default function VehiclePickerPopup({ anchorRef, vehicles, onSelect }: VehiclePickerPopupProps) {
  if (vehicles.length === 0) {
    return (
      <PortalSidebarPopup anchorRef={anchorRef}>
        <p className="px-4 py-2.5 text-sm text-gray-500">No vehicles on file.</p>
      </PortalSidebarPopup>
    );
  }

  return (
    <PortalSidebarPopup anchorRef={anchorRef}>
      {vehicles.map((vehicle) => (
        <button
          key={vehicle.id}
          type="button"
          role="menuitem"
          onClick={() => onSelect(vehicle.id)}
          className="block w-full px-4 py-2.5 text-left text-sm leading-snug text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
        >
          {vehicleSidebarLabel(vehicle)}
        </button>
      ))}
    </PortalSidebarPopup>
  );
}
