import { vehicleSidebarLabel, type CarOwnerVehicle } from "../../lib/carOwnerVehicles";

type VehiclePickerPopupProps = {
  vehicles: CarOwnerVehicle[];
  onSelect: (vehicleId: string) => void;
};

export default function VehiclePickerPopup({ vehicles, onSelect }: VehiclePickerPopupProps) {
  if (vehicles.length === 0) {
    return (
      <div
        className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[220px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl lg:left-[calc(100%+8px)] lg:top-0 lg:mt-0 lg:w-max lg:min-w-[260px] lg:max-w-[320px]"
        role="menu"
      >
        <p className="px-4 py-2.5 text-sm text-gray-500">No vehicles on file.</p>
      </div>
    );
  }

  return (
    <div
      className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[220px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl lg:left-[calc(100%+8px)] lg:top-0 lg:mt-0 lg:w-max lg:min-w-[260px] lg:max-w-[320px]"
      role="menu"
    >
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
    </div>
  );
}
