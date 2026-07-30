import {
  deleteJsonAutoshopowner,
  getJsonAutoshopowner,
  postFormAutoshopowner,
  putFormAutoshopowner,
} from "../api/autoshopownerHttp";
import type { ApiEnvelope } from "./autoshopownerApi";

export type AutoshopDealType = "Service" | "Parts" | "Salvages";

export type AutoshopDealFormFields = {
  dealType?: AutoshopDealType;
  description?: string;
  originalPrice?: string;
  discountedPrice?: string;
  offersEndOnDate?: string;
  dealImage?: File | null;
  /** Additional deal images. First image may also be set via `dealImage`. Max 2 total. */
  dealImages?: File[];
  serviceId?: string;
  productName?: string;
  subServiceName?: string;
  partName?: string;
  vehicleId?: string;
  vehicleName?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  dealEnabled?: string;
  soldToCustomerId?: string;
  soldToCustomerName?: string;
};

const BASE = "/api/autoshopowner/autoshop-deals";

function appendText(fd: FormData, key: string, value: unknown) {
  if (value == null) return;
  const s = String(value).trim();
  if (s) fd.append(key, s);
}

/** API expects offer end dates as `YYYY-MM-DD`. */
export function formatAutoshopDealOfferEndDate(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    const trimmed = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    return trimmed;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function collectDealImageFiles(fields: AutoshopDealFormFields): File[] {
  const out: File[] = [];
  if (fields.dealImage) out.push(fields.dealImage);
  for (const file of fields.dealImages ?? []) {
    if (file && !out.includes(file)) out.push(file);
  }
  return out.slice(0, 2);
}

function appendDealImages(fd: FormData, fields: AutoshopDealFormFields) {
  // Omit entirely when no new files — edit keeps existing images.
  for (const image of collectDealImageFiles(fields)) {
    fd.append("dealImage", image);
  }
}

function appendCommonDealFields(fd: FormData, fields: AutoshopDealFormFields) {
  if (fields.dealType) fd.append("dealType", fields.dealType);
  appendText(fd, "description", fields.description);
  appendText(fd, "dealEnabled", fields.dealEnabled);
  appendText(fd, "soldToCustomerId", fields.soldToCustomerId);
  appendText(fd, "soldToCustomerName", fields.soldToCustomerName);
}

function appendPartsDealFields(fd: FormData, fields: AutoshopDealFormFields) {
  appendText(fd, "partName", fields.partName);
  appendText(fd, "vehicleId", fields.vehicleId);
  appendText(fd, "vehicleName", fields.vehicleName);
  appendText(fd, "vehicleModel", fields.vehicleModel);
  appendText(fd, "vehicleYear", fields.vehicleYear);
  appendText(fd, "originalPrice", fields.originalPrice);
  appendText(fd, "discountedPrice", fields.discountedPrice);
}

/**
 * Create payload:
 * - Service: productName, discountedPrice, offerEndsOnDate, dealImage×N
 * - Parts: partName, vehicle*, description, originalPrice, discountedPrice, offerEndsOnDate, dealImage×N
 */
function buildCreateAutoshopDealFormData(fields: AutoshopDealFormFields) {
  const fd = new FormData();
  appendDealImages(fd, fields);
  appendCommonDealFields(fd, fields);

  if (fields.offersEndOnDate) {
    fd.append("offerEndsOnDate", formatAutoshopDealOfferEndDate(fields.offersEndOnDate));
  }

  const dealType = fields.dealType ?? "Service";
  if (dealType === "Service") {
    appendText(fd, "serviceId", fields.serviceId);
    appendText(fd, "productName", fields.productName ?? fields.subServiceName);
    appendText(fd, "discountedPrice", fields.discountedPrice);
  } else {
    appendPartsDealFields(fd, fields);
  }
  return fd;
}

/**
 * Edit payload (field names differ from create):
 * - Service: subServiceName, discountPercentage, offerEndOn, optional dealImage×N
 * - Parts: same body fields as create, but offerEndOn instead of offerEndsOnDate
 * - Omit dealImage entirely when not replacing images
 */
function buildEditAutoshopDealFormData(fields: AutoshopDealFormFields) {
  const fd = new FormData();
  appendDealImages(fd, fields);
  appendCommonDealFields(fd, fields);

  if (fields.offersEndOnDate) {
    fd.append("offerEndOn", formatAutoshopDealOfferEndDate(fields.offersEndOnDate));
  }

  const dealType = fields.dealType ?? "Service";
  if (dealType === "Service") {
    appendText(fd, "serviceId", fields.serviceId);
    appendText(fd, "subServiceName", fields.subServiceName ?? fields.productName);
    appendText(fd, "discountPercentage", fields.discountedPrice);
  } else {
    appendPartsDealFields(fd, fields);
  }
  return fd;
}

export function fetchAutoshopMyDeals(token: string) {
  return getJsonAutoshopowner<unknown>(`${BASE}/my-deals`, token);
}

/** GET /api/autoshopowner/autoshop-deals/dealers — dealer ads for shop home sidebar. */
export function fetchAutoshopDealers(token: string) {
  return getJsonAutoshopowner<unknown>(`${BASE}/dealers`, token);
}

export function createAutoshopDeal(token: string, fields: AutoshopDealFormFields) {
  return postFormAutoshopowner<ApiEnvelope>(`${BASE}/create`, buildCreateAutoshopDealFormData(fields), token);
}

export function updateAutoshopDeal(token: string, dealId: string, fields: AutoshopDealFormFields) {
  return putFormAutoshopowner<ApiEnvelope>(
    `${BASE}/edit/${encodeURIComponent(dealId)}`,
    buildEditAutoshopDealFormData(fields),
    token,
  );
}

export function deleteAutoshopDeal(token: string, dealId: string) {
  return deleteJsonAutoshopowner<ApiEnvelope>(`${BASE}/delete/${encodeURIComponent(dealId)}`, token);
}

export function apiMessageFromEnvelope(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const msg = (data as ApiEnvelope).message;
  return typeof msg === "string" ? msg.trim() : "";
}
