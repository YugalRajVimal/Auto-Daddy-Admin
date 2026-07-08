import type { CarOwnerVehicle } from "../../lib/carOwnerVehicles";
import { resolveCarBrandLogo } from "../../lib/dummyCarBrands";
import { shopMainContentFillClass, shopMainContentShellClass } from "../shop/shopLayoutStyles";

function formatUpdatedOn(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    return null;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function vehiclePlate(vehicle: CarOwnerVehicle): string {
  return vehicle.licensePlateNo?.trim().toUpperCase() || "—";
}

type OwnerOdometerVehiclePickerProps = {
  vehicles: CarOwnerVehicle[];
  onSelect: (vehicle: CarOwnerVehicle) => void;
};

function VehiclePickerRow({
  vehicle,
  onSelect,
}: {
  vehicle: CarOwnerVehicle;
  onSelect: () => void;
}) {
  const makeName = (vehicle.make?.name ?? "").trim();
  const logo = resolveCarBrandLogo(makeName ? { companyName: makeName } : null);
  const plate = vehiclePlate(vehicle);
  const updatedOn = formatUpdatedOn(vehicle.updatedAt);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full overflow-hidden border border-gray-300 bg-white text-left transition-opacity hover:opacity-95"
    >
      <div className="flex w-[88px] shrink-0 items-center justify-center bg-gray-900 p-3 sm:w-[100px]">
        <img src={logo} alt="" className="max-h-12 w-full object-contain" />
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-3 bg-ad-form-bg px-4 py-3 sm:px-6 sm:py-4">
        <span className="min-w-0 flex-1 text-center font-serif text-xl font-bold tracking-wide text-ad-purple sm:text-2xl md:text-3xl">
          {plate}
        </span>
        {updatedOn ? (
          <span className="shrink-0 text-right text-xs font-medium text-blue-600 sm:text-sm">
            Updated on
            <br />
            {updatedOn}
          </span>
        ) : null}
      </div>
    </button>
  );
}

export default function OwnerOdometerVehiclePicker({
  vehicles,
  onSelect,
}: OwnerOdometerVehiclePickerProps) {
  const activeVehicles = vehicles.filter((v) => !v.disabled);

  return (
    <div className={`flex flex-col overflow-hidden ${shopMainContentShellClass} ${shopMainContentFillClass}`}>
      <div className="bg-ad-purple px-4 py-3 text-center">
        <h2 className="font-serif text-base font-bold text-white md:text-lg">
          Update Odometer of Your Vehicle
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white p-3 sm:p-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {activeVehicles.map((vehicle) => (
            <VehiclePickerRow
              key={vehicle.id}
              vehicle={vehicle}
              onSelect={() => onSelect(vehicle)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
