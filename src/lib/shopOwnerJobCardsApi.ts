import { postFormData, putFormData } from "../api/mobileAuth";
import { buildMyCustomersQuery, fetchMyCustomers, fetchMyServices } from "./shopOwnerApi";
import {
  apiMessage,
  fetchJobCardById,
  MAX_JOB_CARD_VEHICLE_PHOTOS,
  type ApiEnvelope,
  type JobCardFormFields,
} from "./shopOwnerMutations";
import { parseMyCustomers, parseMyServices } from "./shopOwnerParsers";
import type { MyCustomer, ShopServiceCategory } from "../types/shopOwner";

export { MAX_JOB_CARD_VEHICLE_PHOTOS };

export type JobCardFormCustomer = {
  _id: string;
  name?: string;
  phone?: string;
  city?: string;
  myVehicles: Array<{
    _id?: string;
    vId?: string;
    licensePlateNo?: string;
    regNo?: string;
    vinNo?: string;
    vin?: string;
    vehicleName?: string;
    model?: string;
    year?: string;
    odometerReading?: string;
    dueOdometerReading?: string;
    make?: { name?: string; model?: string };
    brand?: string;
  }>;
};

export type SaveJobCardInput = {
  jobCardId?: string;
  form: {
    customerId: string;
    vehicleId: string;
    odometerReading: string;
    dueOdometerReading: string;
    issueDescription: string;
    serviceType: string;
    priorityLevel: string;
    services: unknown[];
    labourCharge?: string;
    labourDuration?: string;
    technicalRemarks?: string;
    discount?: string;
  };
  vehiclePhotoFiles: File[];
  existingVehiclePhotoUrls?: string[];
};

function toFormCustomer(c: MyCustomer): JobCardFormCustomer {
  const id = (c.carOwnerId ?? c.id ?? c._id ?? "").trim();
  return {
    _id: id,
    name: c.name,
    phone: c.phone,
    city: c.city,
    myVehicles: (c.vehicles ?? []).map((v) => ({
      ...v,
      _id: (v._id ?? v.vId ?? "").trim(),
    })),
  };
}

function toFormServices(categories: ShopServiceCategory[]) {
  return categories.map((svc) => ({
    id: svc.id,
    name: svc.name,
    desc: svc.desc,
    subServices: svc.subServices,
  }));
}

export async function fetchJobCardFormData(token: string) {
  const [custRes, svcRes] = await Promise.all([
    fetchMyCustomers(token, buildMyCustomersQuery({ timeFilter: "All", anchorDate: new Date() })),
    fetchMyServices(token),
  ]);
  if (!custRes.ok) throw new Error("Could not load customers.");
  if (!svcRes.ok) throw new Error("Could not load services.");
  return {
    myCustomers: parseMyCustomers(custRes.data).map(toFormCustomer).filter((c) => c._id),
    myServices: toFormServices(parseMyServices(svcRes.data)),
  };
}

export async function fetchJobCardByIdForForm(token: string, jobCardId: string) {
  const res = await fetchJobCardById(token, jobCardId);
  if (!res.ok) throw new Error("Could not load job card.");
  return res.data;
}

export function resolveJobCardFromApiResponse(resp: unknown): Record<string, unknown> | null {
  if (!resp || typeof resp !== "object") return null;
  const root = resp as Record<string, unknown>;
  const nested = root.data;
  if (nested && typeof nested === "object") {
    const data = nested as Record<string, unknown>;
    const job = data.jobCard ?? data.card ?? data;
    if (job && typeof job === "object") return job as Record<string, unknown>;
  }
  const job = root.jobCard ?? root.card ?? root;
  return job && typeof job === "object" ? (job as Record<string, unknown>) : null;
}

export function normalizeJobCardServiceBlocks(job: Record<string, unknown>): unknown[] {
  const services = job.services;
  return Array.isArray(services) ? services : [];
}

function buildSaveFormData(input: SaveJobCardInput): FormData {
  const { form, vehiclePhotoFiles, existingVehiclePhotoUrls = [] } = input;
  const fields: JobCardFormFields = {
    customerId: form.customerId,
    vehicleId: form.vehicleId,
    odometerReading: String(form.odometerReading || "0"),
    dueOdometerReading: String(form.dueOdometerReading || "0"),
    issueDescription: form.issueDescription || "Walk-in / scheduled service",
    serviceType: form.serviceType || "Repair",
    priorityLevel: form.priorityLevel || "Normal",
    servicesJson: JSON.stringify(form.services ?? []),
    labourCharge: form.labourCharge ?? "0",
    labourDuration: form.labourDuration ?? "0",
    technicalRemarks: form.technicalRemarks ?? "",
    vehiclePhotos: vehiclePhotoFiles,
  };

  const fd = new FormData();
  fd.append("customerId", fields.customerId);
  fd.append("vehicleId", fields.vehicleId);
  fd.append("odometerReading", fields.odometerReading);
  fd.append("dueOdometerReading", fields.dueOdometerReading);
  fd.append("issueDescription", fields.issueDescription);
  fd.append("serviceType", fields.serviceType);
  fd.append("priorityLevel", fields.priorityLevel);
  fd.append("services", fields.servicesJson);
  fd.append("labourCharge", fields.labourCharge ?? "0");
  fd.append("labourDuration", fields.labourDuration ?? "0");
  if (fields.technicalRemarks) fd.append("technicalRemarks", fields.technicalRemarks);
  for (const photo of fields.vehiclePhotos ?? []) {
    fd.append("vehiclePhotos", photo);
  }
  if (existingVehiclePhotoUrls.length > 0) {
    fd.append("existingVehiclePhotos", JSON.stringify(existingVehiclePhotoUrls));
  }
  return fd;
}

export async function saveJobCard(token: string, input: SaveJobCardInput) {
  const fd = buildSaveFormData(input);
  const res = input.jobCardId
    ? await putFormData(`/api/auto-shop-owner/job-cards/${input.jobCardId}`, fd, token)
    : await postFormData("/api/auto-shop-owner/job-cards", fd, token);
  if (!res.ok) {
    throw new Error(apiMessage(res.data as ApiEnvelope | null) || "Error saving job card");
  }
  return res;
}
