import type { CarOwnerOdometerReading } from "../types/carOwnerOdometer";
import type { CarOwnerVehicle } from "./carOwnerVehicles";

export function odometerToNumber(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

export function remainingKmNumber(due: number | null, reading: number | null): number | null {
  if (due == null || reading == null) return null;
  return due - reading;
}

export function formatOdometerStatus(remaining: number | null): string {
  if (remaining == null) return "—";
  if (remaining > 0) return `${remaining.toLocaleString()} Kms left`;
  if (remaining === 0) return "Service due now";
  return `${Math.abs(remaining).toLocaleString()} Kms overdue`;
}

function pickMake(raw: unknown): { name: string; model: string } {
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    return {
      name: typeof o.name === "string" ? o.name : "",
      model: typeof o.model === "string" ? o.model : "",
    };
  }
  if (typeof raw === "string" && raw.trim()) {
    return { name: raw.trim(), model: "" };
  }
  return { name: "", model: "" };
}

/** Normalize GET `/api/user/odometer-readings` payload. */
export function normalizeOdometerReadingsPayload(payload: unknown): CarOwnerOdometerReading[] {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  const raw =
    root?.vehicles ??
    (root?.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>).vehicles
      : null);
  if (!Array.isArray(raw)) return [];

  const out: CarOwnerOdometerReading[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const o = entry as Record<string, unknown>;
    const vehicleId = String(o._id ?? o.id ?? o.vehicleId ?? "").trim();
    if (!vehicleId) continue;
    const make = pickMake(o.make);
    out.push({
      vehicleId,
      licensePlateNo: typeof o.licensePlateNo === "string" ? o.licensePlateNo : "",
      make,
      year: typeof o.year === "string" || typeof o.year === "number" ? o.year : null,
      carImage:
        typeof o.vehicleImage === "string"
          ? o.vehicleImage
          : typeof o.carImage === "string"
            ? o.carImage
            : null,
      odometerReading: odometerToNumber(o.odometerReading as string | number | null | undefined),
      dueOdometerReading: odometerToNumber(o.dueOdometerReading as string | number | null | undefined),
      autoShopName: typeof o.autoShopName === "string" ? o.autoShopName : null,
    });
  }
  return out;
}

/** Overlay odometer-readings due/current values onto vehicle list rows. */
export function mergeVehiclesWithOdometerReadings(
  vehicles: CarOwnerVehicle[],
  readings: CarOwnerOdometerReading[]
): CarOwnerVehicle[] {
  if (readings.length === 0) return vehicles;
  const byId = new Map(readings.map((r) => [r.vehicleId, r]));
  return vehicles.map((v) => {
    const reading = byId.get(v.id);
    if (!reading) return v;
    return {
      ...v,
      odometerReading: reading.odometerReading ?? v.odometerReading,
      dueOdometerReading: reading.dueOdometerReading ?? v.dueOdometerReading,
    };
  });
}
