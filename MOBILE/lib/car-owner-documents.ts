import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import type { UserDocumentsApiResponse, VehicleDocumentsRecord, VehicleDocumentsVehicle } from "@/types/user-documents";

export type VehicleDocumentFieldKey =
  | "carOwnershipCertificate"
  | "insuranceCertificate"
  | "drivingLicenseFront"
  | "drivingLicenseBack";

export const VEHICLE_DOCUMENT_FIELDS: ReadonlyArray<{ key: VehicleDocumentFieldKey; label: string }> = [
  { key: "carOwnershipCertificate", label: "Ownership certificate" },
  { key: "insuranceCertificate", label: "Insurance certificate" },
  { key: "drivingLicenseFront", label: "Driving license (front)" },
  { key: "drivingLicenseBack", label: "Driving license (back)" },
];

export type VehicleDocumentFieldRow = {
  key: VehicleDocumentFieldKey;
  label: string;
  path: string | null;
  uri: string | null;
};

export type VehicleDocumentsSection = {
  id: string;
  vehicleId: string;
  title: string;
  subtitle: string;
  thumbUri: string | null;
  fields: VehicleDocumentFieldRow[];
};

function normalizeVehicle(raw: unknown): VehicleDocumentsVehicle | null {
  if (!raw || typeof raw !== "object") return null;
  const x = raw as Record<string, unknown>;
  const id = typeof x._id === "string" ? x._id : "";
  if (!id) return null;
  const rawMake = x.make && typeof x.make === "object" ? (x.make as Record<string, unknown>) : null;
  return {
    _id: id,
    licensePlateNo: typeof x.licensePlateNo === "string" ? x.licensePlateNo : null,
    vinNo: typeof x.vinNo === "string" ? x.vinNo : null,
    make: rawMake
      ? {
          name: typeof rawMake.name === "string" ? rawMake.name : null,
          model: typeof rawMake.model === "string" ? rawMake.model : null,
        }
      : null,
    year: typeof x.year === "string" || typeof x.year === "number" ? x.year : null,
    odometerReading:
      typeof x.odometerReading === "string" || typeof x.odometerReading === "number" ? x.odometerReading : null,
    disabled: typeof x.disabled === "boolean" ? x.disabled : null,
    carImage:
      typeof x.carImage === "string"
        ? x.carImage
        : typeof x.vehicleImage === "string"
          ? x.vehicleImage
          : null,
  };
}

function normalizeRecord(raw: unknown): VehicleDocumentsRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const x = raw as Record<string, unknown>;
  const _id = typeof x._id === "string" ? x._id : "";
  const vehicleId = typeof x.vehicleId === "string" ? x.vehicleId : "";
  if (!_id || !vehicleId) return null;

  const pickPath = (key: VehicleDocumentFieldKey) =>
    typeof x[key] === "string" && x[key].trim().length > 0 ? (x[key] as string).trim() : null;

  return {
    _id,
    vehicleId,
    vehicle: normalizeVehicle(x.vehicle),
    carOwnershipCertificate: pickPath("carOwnershipCertificate"),
    insuranceCertificate: pickPath("insuranceCertificate"),
    drivingLicenseFront: pickPath("drivingLicenseFront"),
    drivingLicenseBack: pickPath("drivingLicenseBack"),
  };
}

export function normalizeVehicleDocumentsList(payload: UserDocumentsApiResponse | null | undefined): VehicleDocumentsRecord[] {
  if (!payload?.success) return [];
  const raw = Array.isArray(payload.documents) ? payload.documents : [];
  return raw.map(normalizeRecord).filter(Boolean) as VehicleDocumentsRecord[];
}

export function vehicleDocumentsTitle(vehicle: VehicleDocumentsVehicle | null | undefined, fallback: string): string {
  const plate = vehicle?.licensePlateNo?.trim();
  if (plate) return plate;
  const make = [vehicle?.make?.name, vehicle?.make?.model].filter(Boolean).join(" ").trim();
  if (make) return make;
  return fallback;
}

export function vehicleDocumentsSubtitle(vehicle: VehicleDocumentsVehicle | null | undefined): string {
  const parts: string[] = [];
  const make = [vehicle?.make?.name, vehicle?.make?.model].filter(Boolean).join(" ").trim();
  if (make) parts.push(make);
  if (vehicle?.year != null && String(vehicle.year).trim()) parts.push(String(vehicle.year));
  if (vehicle?.vinNo?.trim()) parts.push(`VIN ${vehicle.vinNo.trim()}`);
  return parts.join(" · ");
}

export function documentFieldsFromRecord(record: VehicleDocumentsRecord): VehicleDocumentFieldRow[] {
  return VEHICLE_DOCUMENT_FIELDS.map(({ key, label }) => {
    const path = record[key] ?? null;
    const uri = path ? normalizeMediaUrl(path) : null;
    return { key, label, path, uri };
  });
}

export function vehicleImageUri(vehicle: VehicleDocumentsVehicle | null | undefined): string | null {
  const path = vehicle?.carImage?.trim();
  return path ? normalizeMediaUrl(path) : null;
}

export function sectionThumbUri(
  vehicle: VehicleDocumentsVehicle | null | undefined,
  fields: VehicleDocumentFieldRow[]
): string | null {
  const fromVehicle = vehicleImageUri(vehicle);
  if (fromVehicle) return fromVehicle;
  return fields.find((f) => f.uri)?.uri ?? null;
}

export function vehicleDocumentSectionFromRecord(record: VehicleDocumentsRecord, index: number): VehicleDocumentsSection {
  const fields = documentFieldsFromRecord(record);
  return {
    id: record._id,
    vehicleId: record.vehicleId,
    title: vehicleDocumentsTitle(record.vehicle, `Vehicle ${index + 1}`),
    subtitle: vehicleDocumentsSubtitle(record.vehicle),
    thumbUri: sectionThumbUri(record.vehicle, fields),
    fields,
  };
}

export function vehicleDocumentSections(records: VehicleDocumentsRecord[]): VehicleDocumentsSection[] {
  return records.map(vehicleDocumentSectionFromRecord);
}

export function emptyDocumentRecordForVehicle(
  vehicleId: string,
  vehicle: VehicleDocumentsVehicle
): VehicleDocumentsRecord {
  return {
    _id: `vehicle-${vehicleId}`,
    vehicleId,
    vehicle,
    carOwnershipCertificate: null,
    insuranceCertificate: null,
    drivingLicenseFront: null,
    drivingLicenseBack: null,
  };
}

export function mergeVehicleDocumentRecords(
  vehicles: VehicleDocumentsVehicle[],
  records: VehicleDocumentsRecord[]
): VehicleDocumentsRecord[] {
  const byVehicleId = new Map(records.map((r) => [r.vehicleId, r]));
  return vehicles.map((vehicle) => {
    const existing = byVehicleId.get(vehicle._id);
    if (existing) {
      const mergedVehicle = existing.vehicle ?? vehicle;
      return {
        ...existing,
        vehicle: {
          ...vehicle,
          ...mergedVehicle,
          carImage: mergedVehicle.carImage ?? vehicle.carImage ?? null,
        },
      };
    }
    return emptyDocumentRecordForVehicle(vehicle._id, vehicle);
  });
}

export function busyFieldKey(vehicleId: string, field: VehicleDocumentFieldKey): string {
  return `${vehicleId}:${field}`;
}
