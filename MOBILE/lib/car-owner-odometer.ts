import { getJson, putJson, type ApiResponse } from "@/lib/api";
import type {
  CarOwnerOdometerReading,
  CarOwnerOdometerReadingsResponse,
  CarOwnerUpdateOdometerResponse,
} from "@/types/car-owner-odometer";

function toNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toStringOrEmpty(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function firstCarImagePath(vehicleNode: Record<string, unknown>, row: Record<string, unknown>): string | null {
  const single = toStringOrEmpty(
    vehicleNode.carImage ?? row.carImage ?? vehicleNode.vehicleImage ?? row.vehicleImage
  );
  if (single) return single;
  const images = vehicleNode.carImages ?? row.carImages;
  if (!Array.isArray(images)) return null;
  for (const img of images) {
    const path = toStringOrEmpty(img);
    if (path) return path;
  }
  return null;
}

/**
 * Normalizes the GET `/api/user/odometer-readings` payload into UI rows.
 * Tolerant of envelope shapes seen in this codebase
 * (`{ data: [...] }`, `{ odometerReadings: [...] }`, plain arrays, or vehicle-wrapped rows).
 */
export function normalizeOdometerReadings(
  payload: CarOwnerOdometerReadingsResponse | null | undefined
): CarOwnerOdometerReading[] {
  const anyPayload = payload as any;
  const raw =
    anyPayload?.data?.odometerReadings ??
    anyPayload?.data?.readings ??
    anyPayload?.data?.vehicles ??
    anyPayload?.data?.myVehicles ??
    anyPayload?.odometerReadings ??
    anyPayload?.readings ??
    anyPayload?.vehicles ??
    anyPayload?.myVehicles ??
    anyPayload?.data ??
    [];
  if (!Array.isArray(raw)) return [];

  return raw
    .map((row: any, idx: number): CarOwnerOdometerReading | null => {
      if (!row || typeof row !== "object") return null;
      const vehicleNode = row.vehicle && typeof row.vehicle === "object" ? row.vehicle : row;
      const vehicleId = String(
        row.vehicleId ?? vehicleNode._id ?? vehicleNode.id ?? row._id ?? row.id ?? `vehicle-${idx}`
      );
      const make = (vehicleNode.make ?? row.make ?? {}) as {
        name?: string | null;
        model?: string | null;
      };

      return {
        vehicleId,
        licensePlateNo: toStringOrEmpty(vehicleNode.licensePlateNo ?? row.licensePlateNo),
        make: {
          name: toStringOrEmpty(make?.name),
          model: toStringOrEmpty(make?.model),
        },
        year: vehicleNode.year ?? row.year ?? null,
        carImage: firstCarImagePath(vehicleNode, row),
        odometerReading: toNumberOrNull(row.odometerReading ?? vehicleNode.odometerReading),
        dueOdometerReading: toNumberOrNull(row.dueOdometerReading ?? vehicleNode.dueOdometerReading),
      };
    })
    .filter(Boolean) as CarOwnerOdometerReading[];
}

export function getCarOwnerOdometerReadings(
  authToken: string
): Promise<ApiResponse<CarOwnerOdometerReadingsResponse>> {
  return getJson<CarOwnerOdometerReadingsResponse>("/api/user/odometer-readings", {
    authToken,
  });
}

export function updateCarOwnerOdometerReading(
  authToken: string,
  vehicleId: string,
  odometerReading: number
): Promise<ApiResponse<CarOwnerUpdateOdometerResponse>> {
  return putJson<CarOwnerUpdateOdometerResponse>(
    "/api/user/odometer",
    { vehicleId, odometerReading },
    { authToken }
  );
}

/** Human-readable vehicle title (make + model, falling back to plate). */
export function odometerVehicleTitle(reading: CarOwnerOdometerReading): string {
  const parts = [reading.make.name, reading.make.model]
    .map((s) => (s ?? "").trim())
    .filter(Boolean);
  if (parts.length) {
    return reading.year ? `${parts.join(" ")} · ${reading.year}` : parts.join(" ");
  }
  return reading.licensePlateNo || "Vehicle";
}

export function formatOdometerKm(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${Number(value).toLocaleString()} km`;
}
