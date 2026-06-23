export type CarOwnerVehicle = {
  id: string;
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
};

export type UserVehiclesResponse = {
  success?: boolean;
  data?: unknown;
  message?: string;
} & Record<string, unknown>;

export function normalizeVehicleList(payload: UserVehiclesResponse): CarOwnerVehicle[] {
  const anyPayload = payload as Record<string, unknown>;
  const data = anyPayload?.data;
  const raw =
    (data && typeof data === "object" && (data as Record<string, unknown>).myVehicles) ??
    (data && typeof data === "object" && (data as Record<string, unknown>).vehicles) ??
    anyPayload?.vehicles ??
    anyPayload?.myVehicles ??
  data ??
    [];
  if (!Array.isArray(raw)) return [];

  return raw
    .map((x: unknown, idx: number): CarOwnerVehicle | null => {
      if (!x || typeof x !== "object") return null;
      const o = x as Record<string, unknown>;
      const id = String(o._id ?? o.id ?? o.vehicleId ?? o.vinNo ?? o.licensePlateNo ?? `vehicle-${idx}`);
      const rawMake = o.make && typeof o.make === "object" ? (o.make as Record<string, unknown>) : null;
      return {
        id,
        disabled: typeof o.disabled === "boolean" ? o.disabled : null,
        licensePlateNo: typeof o.licensePlateNo === "string" ? o.licensePlateNo : null,
        licensePlateImagePath: typeof o.licensePlateImagePath === "string" ? o.licensePlateImagePath : null,
        licensePlateFrontImagePath: typeof o.licensePlateFrontImagePath === "string" ? o.licensePlateFrontImagePath : null,
        licensePlateBackImagePath: typeof o.licensePlateBackImagePath === "string" ? o.licensePlateBackImagePath : null,
        vinNo: typeof o.vinNo === "string" ? o.vinNo : null,
        year: typeof o.year === "string" || typeof o.year === "number" ? o.year : null,
        odometerReading:
          typeof o.odometerReading === "string" || typeof o.odometerReading === "number" ? o.odometerReading : null,
        dueOdometerReading:
          typeof o.dueOdometerReading === "string" || typeof o.dueOdometerReading === "number"
            ? o.dueOdometerReading
            : null,
        make: {
          name: typeof rawMake?.name === "string" ? rawMake.name : typeof o.name === "string" ? o.name : null,
          model: typeof rawMake?.model === "string" ? rawMake.model : typeof o.model === "string" ? o.model : null,
        },
        carImage: typeof o.carImage === "string" ? o.carImage : typeof o.vehicleImage === "string" ? o.vehicleImage : null,
        carImages: Array.isArray(o.carImages) ? (o.carImages as string[]) : null,
      };
    })
    .filter(Boolean) as CarOwnerVehicle[];
}

export function vehicleTitle(v: CarOwnerVehicle): string {
  const makeName = v.make?.name ?? "";
  const model = v.make?.model ?? "";
  const parts = [makeName, model].map((s) => (s ?? "").toString().trim()).filter(Boolean);
  return parts.length ? parts.join(" - ") : "Vehicle";
}

export function vehicleSidebarLabel(v: CarOwnerVehicle): string {
  const makeName = (v.make?.name ?? "").trim();
  const model = (v.make?.model ?? "").trim();
  if (makeName && model) return `${makeName}-${model}`;
  return vehicleTitle(v);
}
