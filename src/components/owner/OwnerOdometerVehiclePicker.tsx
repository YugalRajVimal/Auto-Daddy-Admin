import type { CarOwnerVehicle } from "../../lib/carOwnerVehicles";
import { resolveCarBrandLogo } from "../../lib/dummyCarBrands";
import { shopMainContentFillClass } from "../shop/shopLayoutStyles";
import { OwnerTitleBar, ownerGreenRowClass } from "./ownerUi";

const panelShellClass =
  "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg bg-white";

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
  onBack?: () => void;
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
      className={`group flex w-full overflow-hidden rounded-xl ${ownerGreenRowClass} text-left shadow-sm ring-1 ring-green-200 transition-all hover:-translate-y-px hover:shadow-md`}
    >
      <div className="flex w-[100px] shrink-0 items-center justify-center bg-gradient-to-br from-gray-800 to-gray-950 p-3 sm:w-[136px]">
        <img src={logo} alt="" className="max-h-14 w-full object-contain" />
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <span className="min-w-0 flex-1 text-center text-2xl font-bold tracking-wide text-ad-purple sm:text-3xl">
          {plate}
        </span>
        {updatedOn ? (
          <span className="shrink-0 text-center text-xs text-gray-600 sm:text-sm">
            Updated on
            <br />
            <span className="font-medium text-blue-700">{updatedOn}</span>
          </span>
        ) : null}
      </div>
    </button>
  );
}

export default function OwnerOdometerVehiclePicker({
  vehicles,
  onSelect,
  onBack,
}: OwnerOdometerVehiclePickerProps) {
  const activeVehicles = vehicles.filter((v) => !v.disabled);

  return (
    <div className={`${panelShellClass} ${shopMainContentFillClass}`}>
      <OwnerTitleBar title="Update Odometer of Your Vehicle" onPrev={onBack} />

      <div className="min-h-0 flex-1 overflow-y-auto bg-white p-3 sm:p-4">
        <div className="flex flex-col gap-3">
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
