import { localImageMultipartPart } from "@/lib/local-image-for-form";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";

export type ApiEnvelope = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

export type PickedImage = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

export type EditableVehicle = {
  id?: string;
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

export type UserVehiclesEditableResponse = {
  success?: boolean;
  data?: unknown;
  message?: string;
} & Record<string, unknown>;

export const currentYear = new Date().getFullYear();
export const MAX_CAR_IMAGES = 4;

export function isValidYear(value: string) {
  const year = Number(value);
  return /^\d{4}$/.test(value) && year >= 1900 && year <= currentYear + 1;
}

export function trimMessage(payload: ApiEnvelope | null) {
  return typeof payload?.message === "string" ? payload.message.trim() : "";
}

export function parseVehicleParam(value?: string): EditableVehicle | null {
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value)) as EditableVehicle;
  } catch {
    return null;
  }
}

export function textValue(value: unknown) {
  return value == null ? "" : String(value);
}

function pickVehicleId(raw: Record<string, unknown>, fallback = "") {
  return String(raw._id ?? raw.id ?? raw.vehicleId ?? raw.vinNo ?? raw.licensePlateNo ?? fallback);
}

function normalizeEditableVehicle(raw: unknown, fallbackIndex = 0): EditableVehicle | null {
  if (!raw || typeof raw !== "object") return null;
  const x = raw as Record<string, unknown>;
  const rawMake = x.make && typeof x.make === "object" ? (x.make as Record<string, unknown>) : null;
  return {
    id: pickVehicleId(x, `vehicle-${fallbackIndex}`),
    licensePlateNo: typeof x.licensePlateNo === "string" ? x.licensePlateNo : null,
    licensePlateImagePath: typeof x.licensePlateImagePath === "string" ? x.licensePlateImagePath : null,
    licensePlateFrontImagePath: typeof x.licensePlateFrontImagePath === "string" ? x.licensePlateFrontImagePath : null,
    licensePlateBackImagePath: typeof x.licensePlateBackImagePath === "string" ? x.licensePlateBackImagePath : null,
    vinNo: typeof x.vinNo === "string" ? x.vinNo : null,
    year: typeof x.year === "string" || typeof x.year === "number" ? x.year : null,
    odometerReading: typeof x.odometerReading === "string" || typeof x.odometerReading === "number" ? x.odometerReading : null,
    dueOdometerReading:
      typeof x.dueOdometerReading === "string" || typeof x.dueOdometerReading === "number" ? x.dueOdometerReading : null,
    make: {
      name: typeof rawMake?.name === "string" ? rawMake.name : typeof x.name === "string" ? x.name : null,
      model: typeof rawMake?.model === "string" ? rawMake.model : typeof x.model === "string" ? x.model : null,
    },
    carImage:
      typeof x.carImage === "string"
        ? x.carImage
        : typeof x.vehicleImage === "string"
          ? x.vehicleImage
          : null,
    carImages: Array.isArray(x.carImages) ? x.carImages.filter((item): item is string => typeof item === "string") : null,
  };
}

export function extractEditableVehicleList(payload: UserVehiclesEditableResponse | null): EditableVehicle[] {
  const anyPayload = payload as any;
  const raw =
    anyPayload?.data?.myVehicles ??
    anyPayload?.data?.vehicles ??
    anyPayload?.vehicles ??
    anyPayload?.myVehicles ??
    anyPayload?.data ??
    [];
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeEditableVehicle).filter(Boolean) as EditableVehicle[];
}

export function existingImageItems(vehicle: EditableVehicle | null): Array<{ label: string; uri: string }> {
  if (!vehicle) return [];
  const items: Array<{ label: string; path?: string | null }> = [
    { label: "Plate", path: vehicle.licensePlateImagePath },
    { label: "Plate front", path: vehicle.licensePlateFrontImagePath },
    { label: "Plate back", path: vehicle.licensePlateBackImagePath },
    { label: "Car", path: vehicle.carImage },
    ...(vehicle.carImages ?? []).map((path, index) => ({ label: `Car ${index + 1}`, path })),
  ];
  return items
    .map((item) => ({ label: item.label, uri: normalizeMediaUrl(item.path) }))
    .filter((item): item is { label: string; uri: string } => Boolean(item.uri));
}

export function appendImage(body: FormData, key: string, image: PickedImage, fallbackBase: string) {
  const part = localImageMultipartPart(image.uri, {
    mimeType: image.mimeType,
    fileName: image.fileName,
    fallbackBase,
  });
  body.append(key, { uri: part.uri, name: part.name, type: part.type } as never);
}

export function buildAddVehicleFormData(fields: {
  licensePlateNo: string;
  vinNo: string;
  name: string;
  model: string;
  year: string;
  odometerReading: string;
  dueOdometerReading: string;
  vehicleImage?: PickedImage | null;
}): FormData {
  const body = new FormData();
  body.append("licensePlateNo", fields.licensePlateNo);
  body.append("vinNo", fields.vinNo);
  body.append("name", fields.name);
  body.append("model", fields.model);
  body.append("year", fields.year);
  body.append("odometerReading", fields.odometerReading);
  body.append("dueOdometerReading", fields.dueOdometerReading);
  if (fields.vehicleImage) {
    appendImage(body, "vehicleImage", fields.vehicleImage, "vehicle");
  }
  return body;
}

export function buildVehicleImageFormData(image: PickedImage): FormData {
  const body = new FormData();
  appendImage(body, "vehicleImage", image, "vehicle");
  return body;
}
