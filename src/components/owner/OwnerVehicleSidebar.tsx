import { FiCheck } from "react-icons/fi";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import { vehicleSidebarLabel, type CarOwnerVehicle } from "../../lib/carOwnerVehicles";

type OwnerVehicleSidebarProps = {
  vehicles: CarOwnerVehicle[];
  selectedVehicleId: string | null;
  loading?: boolean;
  onSelect: (vehicleId: string | null) => void;
  onFaqsClick?: () => void;
};

function vehicleImageUri(v: CarOwnerVehicle): string | null {
  const path = v.carImage ?? v.carImages?.[0] ?? null;
  return normalizeMediaUrl(path);
}

function VehicleRow({
  vehicle,
  selected,
  onSelect,
}: {
  vehicle: CarOwnerVehicle;
  selected: boolean;
  onSelect: () => void;
}) {
  const imageUri = vehicleImageUri(vehicle);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full flex-col items-center gap-2 rounded-md p-2 text-center transition-colors hover:bg-gray-50"
    >
      <p className="text-sm font-bold text-gray-800">{vehicleSidebarLabel(vehicle)}</p>
      <div
        className={`relative flex h-24 w-full max-w-[140px] items-center justify-center overflow-hidden rounded-sm border-2 ${
          selected ? "border-gray-400 bg-gray-300" : "border-[#008000] bg-white"
        }`}
      >
        {imageUri ? (
          <img src={imageUri} alt="" className="h-full w-full object-cover" />
        ) : null}
        {selected ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
            <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-white shadow-sm">
              <FiCheck className="text-xl text-gray-900" aria-hidden />
            </span>
          </span>
        ) : null}
      </div>
    </button>
  );
}

export default function OwnerVehicleSidebar({
  vehicles,
  selectedVehicleId,
  loading,
  onSelect,
  onFaqsClick,
}: OwnerVehicleSidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-[220px] xl:w-[240px]">
      <div className="flex flex-col gap-4">
        {loading ? (
          <p className="px-1 text-xs text-gray-500">Loading vehicles…</p>
        ) : vehicles.length === 0 ? (
          <p className="px-1 text-xs text-gray-500">No vehicles on file.</p>
        ) : (
          vehicles.map((vehicle) => (
            <VehicleRow
              key={vehicle.id}
              vehicle={vehicle}
              selected={selectedVehicleId === vehicle.id}
              onSelect={() => onSelect(selectedVehicleId === vehicle.id ? null : vehicle.id)}
            />
          ))
        )}
      </div>

      <button
        type="button"
        onClick={onFaqsClick}
        className="mt-auto rounded-md bg-ad-purple px-4 py-3 text-sm font-bold text-white hover:bg-ad-purple-dark"
      >
        FAQs
      </button>
    </aside>
  );
}
