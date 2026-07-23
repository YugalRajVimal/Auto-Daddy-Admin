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
  serviceId?: string;
  productName?: string;
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

export function formatAutoshopDealOfferEndDate(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    const trimmed = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return `${trimmed.slice(0, 10)}T00:00:00.000Z`;
    }
    return trimmed;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}T00:00:00.000Z`;
}

function buildAutoshopDealFormData(fields: AutoshopDealFormFields) {
  const fd = new FormData();
  if (fields.dealImage) fd.append("dealImage", fields.dealImage);
  if (fields.dealType) fd.append("dealType", fields.dealType);
  appendText(fd, "description", fields.description);
  appendText(fd, "originalPrice", fields.originalPrice);
  appendText(fd, "discountedPrice", fields.discountedPrice);
  if (fields.offersEndOnDate) {
    fd.append("offerEndsOnDate", formatAutoshopDealOfferEndDate(fields.offersEndOnDate));
  }
  appendText(fd, "dealEnabled", fields.dealEnabled);
  appendText(fd, "soldToCustomerId", fields.soldToCustomerId);
  appendText(fd, "soldToCustomerName", fields.soldToCustomerName);

  const dealType = fields.dealType ?? "Service";
  if (dealType === "Service") {
    appendText(fd, "serviceId", fields.serviceId);
    appendText(fd, "productName", fields.productName);
  } else {
    appendText(fd, "partName", fields.partName);
    appendText(fd, "vehicleId", fields.vehicleId);
    appendText(fd, "vehicleName", fields.vehicleName);
    appendText(fd, "vehicleModel", fields.vehicleModel);
    appendText(fd, "vehicleYear", fields.vehicleYear);
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
  return postFormAutoshopowner<ApiEnvelope>(`${BASE}/create`, buildAutoshopDealFormData(fields), token);
}

export function updateAutoshopDeal(token: string, dealId: string, fields: AutoshopDealFormFields) {
  return putFormAutoshopowner<ApiEnvelope>(
    `${BASE}/edit/${encodeURIComponent(dealId)}`,
    buildAutoshopDealFormData(fields),
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
