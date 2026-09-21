import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { putJson } from "../../api/mobileAuth";
import { useCarOwnerJobCards } from "../../hooks/useCarOwnerJobCards";
import { businessName } from "../../lib/carOwnerJobCards";
import {
  formatOdometerStatus,
  odometerToNumber,
  remainingKmNumber,
} from "../../lib/carOwnerOdometer";
import type { CarOwnerVehicle } from "../../lib/carOwnerVehicles";
import { fieldErrorClass } from "../../lib/validation/formUi";
import { odometerUpdateSchema } from "../../lib/validation/schemas/vehicle";
import OwnerOdometerVehiclePicker from "./OwnerOdometerVehiclePicker";
import { Skeleton } from "../common/Skeleton";
import { shopMainContentFillClass } from "../shop/shopLayoutStyles";
import {
  OwnerFormFooter,
  OwnerTitleBar,
  ownerFormInputClass as compactInputClass,
  ownerFormPanelClass,
} from "./ownerUi";

/** Fill parent height so the save footer is not clipped by nested layout chrome. */
const panelShellClass =
  "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg bg-white";

const readOnlyFieldClass =
  "flex h-10 w-full items-center justify-center rounded-md bg-white px-3 text-sm text-gray-800 shadow-sm";

type OwnerUpdateOdometerPanelProps = {
  vehicles: CarOwnerVehicle[];
  loading?: boolean;
  error?: string | null;
  token: string | null;
  onBack: () => void;
  onSaved?: () => void;
  /** « on the vehicle list (leave the odometer flow). */
  onExit?: () => void;
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

  const zodResult = odometerUpdateSchema.safeParse({ reading: value });
  const lowerThanCurrentError =
    parsed != null && currentNum != null && parsed < currentNum
      ? "New reading should not be lower than the current value."
      : null;
  const validationError = !zodResult.success
    ? (zodResult.error.issues[0]?.message ?? null)
    : lowerThanCurrentError;

  const canSave =
    !saving && zodResult.success && !lowerThanCurrentError && (currentNum == null || parsed !== currentNum);

  const handleSave = async () => {
    if (!token) {
      toast.error("Please log in again.");
      return;
    }
    if (!zodResult.success) {
      toast.error(zodResult.error.issues[0]?.message ?? "Enter a valid odometer reading.");
      return;
    }
    if (parsed == null) return;

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
    <div className={`${panelShellClass} ${shopMainContentFillClass}`}>
      <OwnerTitleBar title={`Update Odometer - ${plate}`} onPrev={onBack} />

      <div className="p-3 sm:p-5">
      <div className={ownerFormPanelClass}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="min-w-0">
            <label htmlFor="owner-odometer-current" className="mb-1.5 block text-sm font-medium text-gray-700">
              Current Odometer
            </label>
            <input
              id="owner-odometer-current"
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
              disabled={saving}
              className={fieldErrorClass(!!validationError, compactInputClass)}
            />
          </div>

          <div className="min-w-0">
            <label htmlFor="owner-odometer-due" className="mb-1.5 block text-sm font-medium text-gray-700">
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
            <p className="mb-1.5 text-sm font-medium text-gray-700">Status</p>
            <div className={`${readOnlyFieldClass} font-semibold text-blue-700 underline underline-offset-2`}>{statusText}</div>
          </div>

          <div className="min-w-0">
            <label htmlFor="owner-odometer-serviced-by" className="mb-1.5 block text-sm font-medium text-gray-700">
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

      <OwnerFormFooter
        note={`You are updating the odometer of ${plate}`}
        onSave={() => void handleSave()}
        saveLabel={saving ? "Updating…" : "Update"}
        saving={saving}
        disabled={!canSave}
        onCancel={onBack}
      />
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
  onExit,
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
      <div className={`${panelShellClass} ${shopMainContentFillClass} p-6`}>
        <Skeleton className="mb-4 h-10 w-full rounded" />
        <Skeleton className="h-32 w-full rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${panelShellClass} flex items-center justify-center p-6 text-sm text-gray-600`}>
        {error}
      </div>
    );
  }

  if (activeVehicles.length === 0) {
    return (
      <div className={`${panelShellClass} flex flex-col items-center justify-center gap-3 p-6 text-center`}>
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
        onBack={onExit}
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
