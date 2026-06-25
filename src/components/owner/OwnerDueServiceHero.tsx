import { useEffect, useState } from "react";
import { Link } from "react-router";
import { FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import { vehicleSidebarLabel, type CarOwnerVehicle } from "../../lib/carOwnerVehicles";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";

function toNumber(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatKm(value: string | number | null | undefined): string {
  const n = toNumber(value);
  if (n == null) return "—";
  return `${n.toLocaleString()} km`;
}

function dueStatus(vehicle: CarOwnerVehicle): { label: string; overdue: boolean } {
  const current = toNumber(vehicle.odometerReading);
  const due = toNumber(vehicle.dueOdometerReading);
  if (due == null) return { label: "Not set", overdue: false };
  if (current == null) return { label: formatKm(due), overdue: false };
  const remaining = due - current;
  if (remaining > 0) return { label: `${remaining.toLocaleString()} km left`, overdue: false };
  if (remaining === 0) return { label: "Due now", overdue: true };
  return { label: `${Math.abs(remaining).toLocaleString()} km overdue`, overdue: true };
}

function VehicleDueCard({ vehicle }: { vehicle: CarOwnerVehicle }) {
  const imageUri = normalizeMediaUrl(vehicle.carImage ?? vehicle.carImages?.[0] ?? null);
  const status = dueStatus(vehicle);
  const plate = vehicle.licensePlateNo?.trim();

  return (
    <article className="p-1">
      <div className="flex items-start gap-3">
        {imageUri ? (
          <img
            src={imageUri}
            alt=""
            className="h-14 w-14 shrink-0 rounded-md object-cover shadow-sm ring-1 ring-white/60"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-white/50 text-xs font-bold text-gray-600 ring-1 ring-white/60">
            Car
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-900">{vehicleSidebarLabel(vehicle)}</p>
          {plate ? <p className="truncate text-xs text-gray-600">{plate}</p> : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-md border border-gray-200 bg-gray-50 px-2 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Current</p>
          <p className="text-sm font-bold text-gray-800">{formatKm(vehicle.odometerReading)}</p>
        </div>
        <div className="rounded-md border border-gray-200 bg-gray-50 px-2 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Service due</p>
          <p className="text-sm font-bold text-gray-800">{formatKm(vehicle.dueOdometerReading)}</p>
        </div>
      </div>

      <p
        className={`mt-2 text-center text-xs font-bold uppercase tracking-wide ${
          status.overdue ? "text-red-600" : "text-ad-purple"
        }`}
      >
        {status.label}
      </p>
    </article>
  );
}

type OwnerDueServiceHeroProps = {
  vehicles: CarOwnerVehicle[];
  loading?: boolean;
  error?: string | null;
  onClose?: () => void;
};

export default function OwnerDueServiceHero({ vehicles, loading, error, onClose }: OwnerDueServiceHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(vehicles.length - 1, 0)));
  }, [vehicles.length]);

  const hasMultiple = vehicles.length > 1;
  const activeVehicle = vehicles[activeIndex];

  const navButtonClass =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-ad-purple transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <div className="absolute inset-x-0 bottom-[8%] z-10 flex justify-center px-4 sm:bottom-[10%] sm:px-6">
      <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:p-5">
        <div className="mb-3 flex items-center justify-center">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ad-purple">Next due service</h2>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
              aria-label="Close next due service"
            >
              <FiX className="text-lg" aria-hidden />
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
          </div>
        ) : error ? (
          <p className="py-4 text-center text-sm text-red-600">{error}</p>
        ) : vehicles.length === 0 ? (
          <div className="space-y-3 py-2 text-center">
            <p className="text-sm text-gray-600">No vehicles on file yet.</p>
            <Link
              to="/owner/vehicles"
              className="inline-block rounded-full bg-ad-purple px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-ad-purple-dark"
            >
              Add vehicle
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {hasMultiple ? (
              <button
                type="button"
                onClick={() => setActiveIndex((index) => Math.max(index - 1, 0))}
                disabled={activeIndex === 0}
                aria-label="Previous vehicle"
                className={navButtonClass}
              >
                <FiChevronLeft className="text-2xl" aria-hidden />
              </button>
            ) : null}

            <div className="min-w-0 flex-1">
              {activeVehicle ? <VehicleDueCard vehicle={activeVehicle} /> : null}
              {hasMultiple ? (
                <p className="mt-1 text-center text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  {activeIndex + 1} of {vehicles.length}
                </p>
              ) : null}
            </div>

            {hasMultiple ? (
              <button
                type="button"
                onClick={() => setActiveIndex((index) => Math.min(index + 1, vehicles.length - 1))}
                disabled={activeIndex === vehicles.length - 1}
                aria-label="Next vehicle"
                className={navButtonClass}
              >
                <FiChevronRight className="text-2xl" aria-hidden />
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
