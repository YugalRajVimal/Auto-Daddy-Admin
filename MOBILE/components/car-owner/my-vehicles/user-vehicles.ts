export type Vehicle = {
  id: string;
  /** When true, vehicle is inactive for bookings until re-enabled. */
  disabled?: boolean | null;
  licensePlateNo?: string | null;
  licensePlateImagePath?: string | null;
  licensePlateFrontImagePath?: string | null;
  licensePlateBackImagePath?: string | null;
  vinNo?: string | null;
  year?: string | number | null;
  odometerReading?: string | number | null;
  dueOdometerReading?: string | number | null;
  make?: { name?: string | null; model?: string | null } | null;
  carImage?: string | null;
  carImages?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type UserVehiclesResponse = {
  success?: boolean;
  data?: unknown;
  message?: string;
} & Record<string, unknown>;

export function normalizeVehicleList(payload: UserVehiclesResponse): Vehicle[] {
  const anyPayload = payload as any;
  const raw =
    anyPayload?.data?.myVehicles ??
    anyPayload?.data?.vehicles ??
    anyPayload?.vehicles ??
    anyPayload?.myVehicles ??
    anyPayload?.vehicles ??
    anyPayload?.data ??
    [];
  if (!Array.isArray(raw)) return [];

  return raw
    .map((x: any, idx: number): Vehicle | null => {
      if (!x || typeof x !== "object") return null;
      const id = String(
        x._id ?? x.id ?? x.vehicleId ?? x.vinNo ?? x.licensePlateNo ?? `vehicle-${idx}`
      );
      return {
        id,
        disabled: typeof x.disabled === "boolean" ? x.disabled : null,
        licensePlateNo: x.licensePlateNo ?? null,
        licensePlateImagePath: x.licensePlateImagePath ?? null,
        licensePlateFrontImagePath: x.licensePlateFrontImagePath ?? null,
        licensePlateBackImagePath: x.licensePlateBackImagePath ?? null,
        vinNo: x.vinNo ?? null,
        year: x.year ?? null,
        odometerReading: x.odometerReading ?? null,
        dueOdometerReading: x.dueOdometerReading ?? null,
        make: x.make ?? null,
        carImage: x.carImage ?? x.vehicleImage ?? null,
        carImages: Array.isArray(x.carImages) ? x.carImages : null,
        createdAt: x.createdAt ?? null,
        updatedAt: x.updatedAt ?? null,
      };
    })
    .filter(Boolean) as Vehicle[];
}

export function vehicleTitle(v: Vehicle) {
  const makeName = v.make?.name ?? "";
  const model = v.make?.model ?? "";
  const parts = [makeName, model].map((s) => (s ?? "").toString().trim()).filter(Boolean);
  return parts.length ? parts.join(" ") : "Vehicle";
}
