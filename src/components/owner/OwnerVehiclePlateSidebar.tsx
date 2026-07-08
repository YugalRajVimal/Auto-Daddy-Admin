import { ShopSidebarButton } from "../shop/ShopSidebar";
import { vehicleSidebarLabel, type CarOwnerVehicle } from "../../lib/carOwnerVehicles";

type OwnerVehiclePlateSidebarProps = {
  vehicles: CarOwnerVehicle[];
  selectedVehicleId: string | null;
  loading?: boolean;
  onSelect: (vehicleId: string) => void;
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
}: OwnerVehiclePlateSidebarProps) {
  if (loading) {
    return <p className="px-1 text-xs text-gray-500">Loading vehicles…</p>;
  }
  if (vehicles.length === 0) {
    return <p className="px-1 text-xs text-gray-500">No vehicles on file.</p>;
  }

  return (
    <>
      {vehicles.map((vehicle) => (
        <ShopSidebarButton
          key={vehicle.id}
          label={vehiclePlateLabel(vehicle)}
          active={selectedVehicleId === vehicle.id}
          onClick={() => onSelect(vehicle.id)}
        />
      ))}
    </>
  );
}
