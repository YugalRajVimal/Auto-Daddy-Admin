import PortalSidebarButton from "../admin/PortalSidebarButton";
import { OwnerFaqsButton } from "./OwnerFaqsButton";
import { vehicleSidebarLabel, type CarOwnerVehicle } from "../../lib/carOwnerVehicles";

type OwnerVehiclePlateSidebarProps = {
  vehicles: CarOwnerVehicle[];
  selectedVehicleId: string | null;
  loading?: boolean;
  onSelect: (vehicleId: string) => void;
  onFaqsClick?: () => void;
};

function vehiclePlateLabel(vehicle: CarOwnerVehicle): string {
  const plate = vehicle.licensePlateNo?.trim().toUpperCase();
  if (plate) return plate;
  return vehicleSidebarLabel(vehicle);
}

export default function OwnerVehiclePlateSidebar({
  vehicles,
  selectedVehicleId,
  loading,
  onSelect,
  onFaqsClick,
}: OwnerVehiclePlateSidebarProps) {
  return (
    <div className="flex flex-col gap-3">
      {loading ? (
        <p className="px-1 text-xs text-gray-500">Loading vehicles…</p>
      ) : vehicles.length === 0 ? (
        <p className="px-1 text-xs text-gray-500">No vehicles on file.</p>
      ) : (
        vehicles.map((vehicle) => (
          <PortalSidebarButton
            key={vehicle.id}
            label={vehiclePlateLabel(vehicle)}
            active={selectedVehicleId === vehicle.id}
            onClick={() => onSelect(vehicle.id)}
          />
        ))
      )}

      {onFaqsClick ? <OwnerFaqsButton onClick={onFaqsClick} /> : null}
    </div>
  );
}
