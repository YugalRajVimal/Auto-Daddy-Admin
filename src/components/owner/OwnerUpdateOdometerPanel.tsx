import { useEffect, useState } from "react";
import { FiChevronLeft } from "react-icons/fi";
import { toast } from "react-toastify";
import { putJson } from "../../api/mobileAuth";
import { compactInputClass } from "../admin/ContentPanel";
import { useCarOwnerJobCards } from "../../hooks/useCarOwnerJobCards";
import { businessName } from "../../lib/carOwnerJobCards";
import {
  formatOdometerStatus,
  odometerToNumber,
  remainingKmNumber,
} from "../../lib/carOwnerOdometer";
import type { CarOwnerVehicle } from "../../lib/carOwnerVehicles";
import OwnerOdometerVehiclePicker from "./OwnerOdometerVehiclePicker";
import { Skeleton } from "../common/Skeleton";
import { shopMainContentFillClass, shopMainContentShellClass } from "../shop/shopLayoutStyles";

const readOnlyFieldClass =
  "flex h-[30px] w-full items-center border border-gray-400 bg-white px-2 text-sm text-gray-800";

type OwnerUpdateOdometerPanelProps = {
  vehicles: CarOwnerVehicle[];
  loading?: boolean;
  error?: string | null;
  token: string | null;
  onBack: () => void;
  onSaved?: () => void;
  /** When true, opens the update form directly (e.g. Vehicles page). */
  skipVehiclePicker?: boolean;
};

function vehiclePlateLabel(vehicle: CarOwnerVehicle): string {
  const plate = vehicle.licensePlateNo?.trim().toUpperCase();
  if (plate) return plate;
  const make = vehicle.make?.name?.trim() ?? "";
  const model = vehicle.make?.model?.trim() ?? "";
  const label = [make, model].filter(Boolean).join(" ");
  return label || "Vehicle";
}

function OdometerVehicleForm({
  vehicle,
  token,
  onBack,
  onSaved,
}: {
  vehicle: CarOwnerVehicle;
  token: string | null;
  onBack: () => void;
  onSaved?: () => void;
}) {
  const { items: jobCards } = useCarOwnerJobCards(vehicle.id);
  const serviceBy = jobCards[0] ? businessName(jobCards[0].business) : null;

  const current =
    vehicle.odometerReading != null && String(vehicle.odometerReading).trim()
      ? String(vehicle.odometerReading).trim()
      : "";
  const dueNum = odometerToNumber(vehicle.dueOdometerReading);
  const dueDisplay = dueNum != null ? dueNum.toLocaleString() : "";

  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(current);
  }, [vehicle.id, current]);

  const parsed = value.trim() ? Number(value.trim()) : null;
  const currentNum = current ? Number(current) : null;
  const readingForRemaining = parsed != null && Number.isFinite(parsed) ? parsed : currentNum;
  const remainingNum = remainingKmNumber(dueNum, readingForRemaining);
  const statusText = formatOdometerStatus(remainingNum);
  const serviceByDisplay = serviceBy?.trim() || "";

  const canSave =
    !saving &&
    parsed != null &&
    Number.isFinite(parsed) &&
    parsed >= 0 &&
    (currentNum == null || parsed !== currentNum);
  const validationError =
    parsed != null && currentNum != null && parsed < currentNum
      ? "New reading should not be lower than the current value."
      : null;

  const handleSave = async () => {
    if (!token || parsed == null) {
      toast.error("Please log in again.");
      return;
    }

    setSaving(true);
    try {
      const res = await putJson<{ success?: boolean; message?: string }>(
        "/api/user/odometer",
        { vehicleId: vehicle.id, odometerReading: parsed },
        token
      );
      const message = typeof res.data?.message === "string" ? res.data.message.trim() : "";
      if (!res.ok || res.data?.success === false) {
        toast.error(message || "Could not update odometer.");
        return;
      }
      toast.success(message || "Odometer updated.");
      onSaved?.();
    } catch {
      toast.error("Network error while updating odometer.");
    } finally {
      setSaving(false);
    }
  };

  const plate = vehiclePlateLabel(vehicle);

  return (
    <div className={`flex flex-col overflow-hidden ${shopMainContentShellClass} ${shopMainContentFillClass}`}>
      <div className="bg-ad-purple px-4 py-2.5 text-center">
        <h2 className="font-serif text-base font-bold text-white md:text-lg">Update Odometer - {plate}</h2>
      </div>

      <div className="flex items-center justify-end border-b border-gray-200 bg-white px-4 py-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <FiChevronLeft className="text-gray-500" aria-hidden />
          Back
        </button>
      </div>

      <div className="bg-ad-form-bg px-4 py-4 md:px-6 md:py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0">
            <label htmlFor="owner-odometer-current" className="mb-1 block text-sm font-semibold text-gray-900">
              Current Odometer
            </label>
            <input
              id="owner-odometer-current"
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
              disabled={saving}
              className={compactInputClass}
            />
          </div>

          <div className="min-w-0">
            <label htmlFor="owner-odometer-due" className="mb-1 block text-sm font-semibold text-gray-900">
              Due on Kms
            </label>
            <input
              id="owner-odometer-due"
              type="text"
              readOnly
              value={dueDisplay}
              tabIndex={-1}
              className={`${compactInputClass} cursor-default bg-white`}
            />
          </div>

          <div className="min-w-0">
            <p className="mb-1 text-sm font-semibold text-gray-900">Status</p>
            <div className={`${readOnlyFieldClass} font-semibold text-blue-600`}>{statusText}</div>
          </div>

          <div className="min-w-0">
            <label htmlFor="owner-odometer-serviced-by" className="mb-1 block text-sm font-semibold text-gray-900">
              Serviced by
            </label>
            <input
              id="owner-odometer-serviced-by"
              type="text"
              readOnly
              value={serviceByDisplay}
              tabIndex={-1}
              className={`${compactInputClass} cursor-default bg-white`}
            />
          </div>
        </div>

        {validationError ? <p className="mt-3 text-xs text-red-600">{validationError}</p> : null}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-ad-form-border bg-ad-form-required-bg px-4 py-2.5 md:px-6">
        <button
          type="button"
          disabled={!canSave}
          onClick={() => void handleSave()}
          className="rounded bg-ad-form-save px-6 py-1 text-sm font-bold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Updating…" : "Update"}
        </button>
        <span className="text-sm text-gray-700">
          or{" "}
          <button
            type="button"
            disabled={saving}
            onClick={onBack}
            className="font-medium text-blue-600 underline hover:text-blue-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </span>
      </div>
    </div>
  );
}

export default function OwnerUpdateOdometerPanel({
  vehicles,
  loading,
  error,
  token,
  onBack,
  onSaved,
  skipVehiclePicker = false,
}: OwnerUpdateOdometerPanelProps) {
  const activeVehicles = vehicles.filter((v) => !v.disabled);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    skipVehiclePicker ? (activeVehicles[0]?.id ?? null) : null
  );

  useEffect(() => {
    if (!skipVehiclePicker) return;
    setSelectedVehicleId(activeVehicles[0]?.id ?? null);
  }, [skipVehiclePicker, vehicles]);

  const selectedVehicle = activeVehicles.find((v) => v.id === selectedVehicleId) ?? null;

  if (loading) {
    return (
      <div className={`${shopMainContentShellClass} ${shopMainContentFillClass} p-6`}>
        <Skeleton className="mb-4 h-10 w-full rounded" />
        <Skeleton className="h-32 w-full rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${shopMainContentShellClass} flex items-center justify-center p-6 text-sm text-gray-600`}>
        {error}
      </div>
    );
  }

  if (activeVehicles.length === 0) {
    return (
      <div className={`${shopMainContentShellClass} flex flex-col items-center justify-center gap-3 p-6 text-center`}>
        <p className="text-sm text-gray-600">Add a vehicle before updating the odometer.</p>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-blue-600 underline hover:text-blue-700"
        >
          Back
        </button>
      </div>
    );
  }

  if (!selectedVehicle) {
    return (
      <OwnerOdometerVehiclePicker
        vehicles={activeVehicles}
        onSelect={(vehicle) => setSelectedVehicleId(vehicle.id)}
      />
    );
  }

  return (
    <OdometerVehicleForm
      key={selectedVehicle.id}
      vehicle={selectedVehicle}
      token={token}
      onBack={() => {
        if (skipVehiclePicker) {
          onBack();
          return;
        }
        setSelectedVehicleId(null);
      }}
      onSaved={onSaved}
    />
  );
}
