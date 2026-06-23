import { type ReactNode } from "react";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import type { CarOwnerVehicle } from "../../lib/carOwnerVehicles";

function vehicleImageUri(v: CarOwnerVehicle): string | null {
  const path =
    v.carImage ??
    v.carImages?.[0] ??
    v.licensePlateImagePath ??
    v.licensePlateFrontImagePath ??
    null;
  return normalizeMediaUrl(path);
}

function formatOdometer(value: string | number | null | undefined): string {
  if (value == null || !String(value).trim()) return "—";
  const n = Number(String(value).trim());
  if (Number.isFinite(n)) return `${n.toLocaleString()} km`;
  return `${String(value).trim()} km`;
}

function VehiclePill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex min-h-[2rem] items-center justify-center rounded-full bg-ad-green-light px-3 py-1 text-center text-sm font-semibold text-ad-green-dark ${className}`}
    >
      {children}
    </span>
  );
}

type OwnerVehicleSelectCardProps = {
  vehicle: CarOwnerVehicle;
  selected?: boolean;
  onSelect: () => void;
};

export default function OwnerVehicleSelectCard({ vehicle, selected = false, onSelect }: OwnerVehicleSelectCardProps) {
  const imageUri = vehicleImageUri(vehicle);
  const plate = vehicle.licensePlateNo?.trim().toUpperCase() || "—";
  const make = (vehicle.make?.name ?? "").trim() || "—";
  const model = (vehicle.make?.model ?? "").trim() || "—";
  const year = vehicle.year != null && String(vehicle.year).trim() ? String(vehicle.year).trim() : "—";
  const odometer = formatOdometer(vehicle.odometerReading);
  const vin = vehicle.vinNo?.trim() || "—";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full max-w-[220px] flex-col overflow-hidden rounded-xl border-2 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        selected ? "border-ad-purple ring-2 ring-ad-purple/30" : "border-gray-200 hover:border-ad-green"
      }`}
    >
      <div className="aspect-square w-full overflow-hidden bg-gray-100">
        {imageUri ? (
          <img src={imageUri} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-400">
            No image
          </div>
        )}
      </div>

      <div className="bg-ad-green-dark px-3 py-2 text-center text-sm font-bold tracking-wide text-white">
        {plate}
      </div>

      <div className="space-y-2 p-3">
        <div className="grid grid-cols-2 gap-2">
          <VehiclePill>{make}</VehiclePill>
          <VehiclePill>{model}</VehiclePill>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <VehiclePill>{year}</VehiclePill>
          <VehiclePill>{odometer}</VehiclePill>
        </div>
        <VehiclePill className="w-full truncate">{vin}</VehiclePill>
      </div>
    </button>
  );
}
