import {
  API_BASE_URL,
  deleteJson,
  getJson,
  logApiRequest,
  logApiResponse,
  logMultipartCurl,
  patchJson,
  postFormData,
  postJson,
  putFormData,
  putJson,
} from "@/lib/api";
import { localImageMultipartPart } from "@/lib/local-image-for-form";
import type {
  ApiEnvelope,
  CustomerVehicle,
  MyServiceCategoryPayload,
  MyServiceRemoveSubServicesPayload,
  OnboardCarOwnerBody,
  UpdateMyCustomerPayload,
  UpdateMyCustomerProfilePayload,
  UpdateMyCustomerVehiclePayload,
} from "@/types/auto-shop-owner-endpoints";
import type { MainCarCompaniesResponse, UpdateMyCarCompaniesResponse } from "@/types/car-company";
import { isCashfreeMerchantApiUrl } from "@/lib/cashfree-payment";
import type { BusinessSubscription } from "@/types/auto-shop-owner-profile";
import type {
  PurchaseWebsiteSubscriptionBody,
  PurchaseWebsiteSubscriptionResponse,
} from "@/types/website-subscription";

export function autoShopOwnerBaseUrl() {
  return API_BASE_URL.replace(/\/+$/, "");
}

export function withQuery(path: string, query: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v != null && v !== "") {
      usp.append(k, v);
    }
  }
  const s = usp.toString();
  return s ? `${path}?${s}` : path;
}

/** GET /api/auto-shop-owner/search-carowner?search= */
export function searchCarOwners(token: string, search: string) {
  const path = withQuery("/api/auto-shop-owner/search-carowner", { search });
  return getJson<unknown>(path, { authToken: token });
}

/** UI period for GET /api/auto-shop-owner/my-customers */
export type MyCustomersPeriod = {
  timeFilter: "All" | "Daily" | "Weekly" | "Monthly";
  anchorDate: Date;
};

/** API period strings: month 01–12, day 1–31 without a leading zero on single-digit days (e.g. 2026-03-9). */
function formatDateYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate());
  return `${y}-${m}-${day}`;
}

/** Monday 00:00 local time of the week that contains `d` (Mon–Sun week; UI labels use Mon–Sun range). */
export function mondayOfWeekContaining(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

/** Sunday of the same Mon–Sun week as `d` (end of week for UI range). */
export function sundayOfWeekContaining(d: Date) {
  const mon = mondayOfWeekContaining(d);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return sun;
}

/** Query string: ?dateType=daily&date=… | weekly&week=… (week = Sunday end of Mon–Sun block) | monthly&month=&year= */
export function buildMyCustomersQuery(period: MyCustomersPeriod): Record<string, string> {
  const anchor = new Date(period.anchorDate);
  anchor.setHours(0, 0, 0, 0);

  if (period.timeFilter === "All") {
    return {};
  }
  if (period.timeFilter === "Daily") {
    return {
      dateType: "daily",
      date: formatDateYMD(anchor),
    };
  }
  if (period.timeFilter === "Weekly") {
    const sun = sundayOfWeekContaining(anchor);
    return {
      dateType: "weekly",
      week: formatDateYMD(sun),
    };
  }
  return {
    dateType: "monthly",
    month: String(anchor.getMonth() + 1).padStart(2, "0"),
    year: String(anchor.getFullYear()),
  };
}

/** GET /api/auto-shop-owner/my-customers — optional server-side period filter */
export function fetchMyCustomers(token: string, query?: Record<string, string>) {
  const path =
    !query || Object.keys(query).length === 0
      ? "/api/auto-shop-owner/my-customers"
      : withQuery(
          "/api/auto-shop-owner/my-customers",
          query as Record<string, string | undefined>
        );
  if (__DEV__) {
    console.log("[my-customers] GET", `${autoShopOwnerBaseUrl()}${path}`);
  }
  return getJson<unknown>(path, { authToken: token });
}

/** GET /api/auto-shop-owner/website-templates */
export function fetchWebsiteTemplates(token: string) {
  return getJson<unknown>("/api/auto-shop-owner/website-templates", { authToken: token });
}

/** POST /api/auto-shop-owner/purchase-subscription — Cashfree website subscription checkout */
export function purchaseWebsiteSubscription(token: string, body: PurchaseWebsiteSubscriptionBody) {
  return postJson<PurchaseWebsiteSubscriptionResponse>(
    "/api/auto-shop-owner/purchase-subscription",
    body,
    { authToken: token }
  );
}

export function extractPurchaseSubscriptionPaymentLink(
  payload: PurchaseWebsiteSubscriptionResponse | null
): string | null {
  if (!payload) return null;
  const direct = payload.paymentLink?.trim();
  if (direct) return direct;
  const nested = payload.subDetails?.cashfreePayload?.payments?.url?.trim();
  return nested || null;
}

export function formatPurchaseSubscriptionError(
  payload: PurchaseWebsiteSubscriptionResponse | null
): string {
  if (!payload) return "Could not start payment.";
  const base = payload.message?.trim();
  const cf = payload.cashfreeError;
  const cfMsg = cf?.message?.trim();
  const cfCode = cf?.code?.trim();
  if (cfMsg && cfCode) {
    return base ? `${base} (${cfMsg})` : `${cfMsg} (${cfCode})`;
  }
  if (cfMsg) {
    return base ? `${base} (${cfMsg})` : cfMsg;
  }
  return base || "Could not start payment.";
}

export function extractPurchaseSubscriptionCashfreeSession(
  payload: PurchaseWebsiteSubscriptionResponse | null
): { paymentSessionId: string; orderId: string } | null {
  if (!payload) return null;
  const paymentSessionId =
    payload.sessionId?.trim() ||
    payload.subDetails?.cashfreePaymentSessionId?.trim() ||
    payload.subDetails?.cashfreePayload?.payment_session_id?.trim() ||
    "";
  const orderId =
    payload.order_id?.trim() ||
    payload.invoiceNo?.trim() ||
    payload.subDetails?.cashfreeOrderId?.trim() ||
    payload.subDetails?.invoiceNo?.trim() ||
    payload.subDetails?.cashfreePayload?.order_id?.trim() ||
    "";
  if (!paymentSessionId || !orderId) return null;
  return { paymentSessionId, orderId };
}

/**
 * Legacy paymentLink from API is a merchant PG endpoint (/orders/{id}/payments), not a customer URL.
 * Returns null so the app uses payment_session_id + Cashfree SDK instead.
 */
export function resolvePurchaseSubscriptionCheckoutUrl(
  payload: PurchaseWebsiteSubscriptionResponse | null
): string | null {
  const link = extractPurchaseSubscriptionPaymentLink(payload);
  if (link && !isCashfreeMerchantApiUrl(link)) {
    return link;
  }
  return null;
}

export function isSubscriptionPaymentPaid(paymentStatus: string | undefined): boolean {
  const status = (paymentStatus ?? "").toLowerCase();
  return status === "paid" || status === "success" || status === "completed";
}

export function findSubscriptionByOrderId(
  subscriptions: BusinessSubscription[] | undefined,
  orderId: string
): BusinessSubscription | undefined {
  const id = orderId.trim();
  if (!id || !subscriptions?.length) return undefined;
  return subscriptions.find(
    (sub) =>
      sub.invoiceNo?.trim() === id ||
      sub.cashfreeOrderId?.trim() === id ||
      sub.referenceId?.trim() === id
  );
}

/** Pending Cashfree subscription on profile — resume checkout without a new order. */
export function extractPendingSubscriptionCheckout(
  businessProfile: { subscriptions?: BusinessSubscription[] } | null | undefined
): {
  paymentUrl: string;
  session: { paymentSessionId: string; orderId: string };
} | null {
  const subs = businessProfile?.subscriptions;
  if (!Array.isArray(subs)) return null;

  for (const sub of subs) {
    if ((sub.paymentStatus ?? "").toLowerCase() !== "pending") continue;

    const orderId =
      sub.cashfreeOrderId?.trim() ||
      sub.invoiceNo?.trim() ||
      sub.cashfreePayload?.order_id?.trim() ||
      "";
    const paymentSessionId =
      sub.cashfreePaymentSessionId?.trim() ||
      sub.cashfreePayload?.payment_session_id?.trim() ||
      "";
    const apiUrl = sub.cashfreePayload?.payments?.url?.trim() || "";
    const paymentUrl = isCashfreeMerchantApiUrl(apiUrl) ? "" : apiUrl;
    if (!orderId || !paymentSessionId) continue;

    return {
      paymentUrl,
      session: { paymentSessionId, orderId },
    };
  }
  return null;
}

/** POST /api/auto-shop-owner/my-customers */
export function addCarOwnerToMyCustomers(token: string, carOwnerId: string) {
  return postJson<ApiEnvelope>("/api/auto-shop-owner/my-customers", { carOwnerId }, { authToken: token });
}

export function pickCustomerVehicleApiId(v: {
  vId?: string;
  _id?: string;
  id?: string;
}): string | undefined {
  for (const c of [v.vId, v._id, v.id]) {
    if (typeof c === "string" && c.trim()) {
      return c.trim();
    }
  }
  return undefined;
}

/** Maps UI vehicle rows to PUT /api/auto-shop-owner/my-customers `vehicles` array. */
export function toUpdateCustomerVehicleRows(
  vehicles: Array<CustomerVehicle & { isNew?: boolean }>
): UpdateMyCustomerVehiclePayload[] {
  return vehicles.map((v) => {
    const vId = v.isNew ? undefined : pickCustomerVehicleApiId(v);
    return {
      ...(vId ? { vId } : {}),
      licensePlateNo: (v.licensePlateNo?.trim() || "").slice(0, 14),
      vinNo: v.vinNo?.trim().slice(0, 17) || undefined,
      vehicleName: v.vehicleName?.trim() || "",
      model: v.model?.trim() || "",
      year: v.year?.trim() || "",
      odometerReading: v.odometerReading?.trim() || undefined,
    };
  });
}

/** Optional image picks for onboard / update customer multipart requests. */
export type CustomerImageUploads = {
  profileImage?: { uri: string; mimeType?: string | null; fileName?: string | null } | null;
  vehicleImages?: Array<{ uri: string; mimeType?: string | null; fileName?: string | null } | null | undefined>;
};

function appendCustomerText(formData: FormData, key: string, value: unknown) {
  if (value == null) return;
  formData.append(key, String(value).trim());
}

function appendCustomerImage(
  formData: FormData,
  key: string,
  image: { uri: string; mimeType?: string | null; fileName?: string | null },
  fallbackBase: string
) {
  const part = localImageMultipartPart(image.uri, {
    mimeType: image.mimeType,
    fileName: image.fileName,
    fallbackBase,
  });
  formData.append(key, { uri: part.uri, name: part.name, type: part.type } as never);
}

export function buildCustomerFormData(
  fields: OnboardCarOwnerBody | (UpdateMyCustomerProfilePayload & { vehicles?: UpdateMyCustomerVehiclePayload[] }),
  uploads?: CustomerImageUploads
) {
  const formData = new FormData();
  const body = fields as Record<string, unknown>;

  if (typeof body.carOwnerId === "string" && body.carOwnerId.trim()) {
    appendCustomerText(formData, "carOwnerId", body.carOwnerId);
  }
  appendCustomerText(formData, "name", body.name);
  appendCustomerText(formData, "email", body.email);
  appendCustomerText(formData, "countryCode", body.countryCode);
  appendCustomerText(formData, "phone", body.phone);
  appendCustomerText(formData, "pincode", body.pincode);
  appendCustomerText(formData, "address", body.address);
  if (typeof body.city === "string" && body.city.trim()) {
    appendCustomerText(formData, "city", body.city);
  }
  if (typeof body.role === "string" && body.role.trim()) {
    appendCustomerText(formData, "role", body.role);
  }

  const vehicles = Array.isArray(body.vehicles) ? body.vehicles : [];
  formData.append("vehicles", JSON.stringify(vehicles));

  if (uploads?.profileImage?.uri) {
    // Backend rejects unknown file fields ("Unexpected field"), so send only the expected keys.
    appendCustomerImage(formData, "profilePhoto", uploads.profileImage, "profile");
  }

  const vehicleCount = vehicles.length;
  for (let i = 0; i < vehicleCount; i++) {
    const image = uploads?.vehicleImages?.[i];
    if (!image?.uri) continue;
    appendCustomerImage(formData, `carImage_${i}`, image, `vehicle-${i}`);
  }

  return formData;
}

/** PUT /api/auto-shop-owner/my-customers — profile only, or profile + `vehicles` for vehicle edits. */
export function updateMyCustomer(
  token: string,
  body: UpdateMyCustomerProfilePayload | UpdateMyCustomerPayload,
  uploads?: CustomerImageUploads
) {
  const formData = buildCustomerFormData(body, uploads);
  if (__DEV__) {
    logMultipartCurl("PUT", `${autoShopOwnerBaseUrl()}/api/auto-shop-owner/my-customers`, formData, token);
  }
  return putFormData<ApiEnvelope>("/api/auto-shop-owner/my-customers", formData, { authToken: token });
}

/** POST /api/auto-shop-owner/onboard-carowner */
export function onboardCarOwner(token: string, body: OnboardCarOwnerBody, uploads?: CustomerImageUploads) {
  const formData = buildCustomerFormData(body, uploads);
  if (__DEV__) {
    logMultipartCurl("POST", `${autoShopOwnerBaseUrl()}/api/auto-shop-owner/onboard-carowner`, formData, token);
  }
  return postFormData<ApiEnvelope>("/api/auto-shop-owner/onboard-carowner", formData, { authToken: token });
}

/** DELETE /api/auto-shop-owner/my-customers — query + JSON body (RN/Android often drops DELETE bodies). */
export function removeCarOwnerFromMyCustomers(token: string, carOwnerId: string) {
  const path = withQuery("/api/auto-shop-owner/my-customers", { carOwnerId });
  return deleteJson<ApiEnvelope>(path, {
    authToken: token,
    body: { carOwnerId },
  });
}

/** POST /api/auto-shop-owner/verify-onboarded-carowner */
export function verifyOnboardedCarOwner(
  token: string,
  body: { phone: string; countryCode: string; otp: string }
) {
  return postJson<ApiEnvelope>(
    "/api/auto-shop-owner/verify-onboarded-carowner",
    body,
    { authToken: token }
  );
}

/** GET/POST/PUT /api/auto-shop-owner/my-services */
export function fetchMyServices(token: string) {
  return getJson<unknown>("/api/auto-shop-owner/my-services", { authToken: token });
}

export function saveMyServices(token: string, services: MyServiceCategoryPayload[]) {
  return postJson<ApiEnvelope>(
    "/api/auto-shop-owner/my-services",
    { services } as unknown as Record<string, unknown>,
    { authToken: token }
  );
}

export function updateMyServices(token: string, services: MyServiceCategoryPayload[]) {
  return putJson<ApiEnvelope>(
    "/api/auto-shop-owner/my-services",
    { services } as unknown as Record<string, unknown>,
    { authToken: token }
  );
}

/** PUT /api/auto-shop-owner/my-services — delete specific sub-services by name. */
export function removeMyServiceSubServices(
  token: string,
  payload: MyServiceRemoveSubServicesPayload
) {
  return putJson<ApiEnvelope>(
    "/api/auto-shop-owner/my-services",
    { services: [payload] } as unknown as Record<string, unknown>,
    { authToken: token }
  );
}

/** PUT /api/auto-shop-owner/update-business-active-status */
export function updateBusinessActiveStatus(token: string, isBusinessActive: boolean) {
  return putJson<ApiEnvelope>(
    "/api/auto-shop-owner/update-business-active-status",
    { isBusinessActive },
    { authToken: token }
  );
}

/** POST /api/auto-shop-owner/submit-enquiry — voice note + selected service. */
export function submitEnquiry(
  token: string,
  opts: { serviceId: string; serviceName: string; audioUri: string }
) {
  const formData = new FormData();
  formData.append("serviceId", opts.serviceId);
  if (opts.serviceName) formData.append("serviceName", opts.serviceName);
  const isM4a = opts.audioUri.toLowerCase().endsWith(".m4a");
  formData.append("voiceNote", {
    uri: opts.audioUri,
    name: isM4a ? "enquiry.m4a" : "enquiry.3gp",
    type: isM4a ? "audio/m4a" : "audio/3gpp",
  } as unknown as Blob);
  if (__DEV__) {
    logMultipartCurl("POST", `${autoShopOwnerBaseUrl()}/api/auto-shop-owner/submit-enquiry`, formData, token);
  }
  return postFormData<ApiEnvelope>("/api/auto-shop-owner/submit-enquiry", formData, { authToken: token });
}

/** GET /api/auto-shop-owner/main-car-companies */
export function fetchMainCarCompanies(token: string) {
  return getJson<MainCarCompaniesResponse>("/api/auto-shop-owner/main-car-companies", { authToken: token });
}

/**
 * PUT /api/auto-shop-owner/edit-business-profile — update only the
 * `serviceWeWorkWith` field (JSON-stringified array of service category IDs).
 *
 * Mirrors the multipart format used in `complete-business-profile`.
 */
/** PUT /api/auto-shop-owner/edit-business-profile — open hours only (mirrors web Activity tab). */
export async function updateBusinessOpenHours(token: string, openHoursJson: string) {
  const base = autoShopOwnerBaseUrl();
  const body = new FormData();
  body.append("perDayOpenHours", openHoursJson);
  const url = `${base}/api/auto-shop-owner/edit-business-profile`;
  logApiRequest("PUT", url, body);
  const response = await fetch(url, {
    method: "PUT",
    headers: { Authorization: token },
    body,
  });
  const data = (await response.json().catch(() => null)) as ApiEnvelope | null;
  logApiResponse("PUT", url, response.status, response.ok, data);
  return { ok: response.ok, status: response.status, data };
}

export async function updateServiceWeWorkWith(token: string, serviceIds: string[]) {
  const base = autoShopOwnerBaseUrl();
  const body = new FormData();
  body.append("serviceWeWorkWith", JSON.stringify(serviceIds));
  const url = `${base}/api/auto-shop-owner/edit-business-profile`;
  logApiRequest("PUT", url, body);
  const response = await fetch(url, {
    method: "PUT",
    headers: { Authorization: token },
    body,
  });
  const data = (await response.json().catch(() => null)) as ApiEnvelope | null;
  logApiResponse("PUT", url, response.status, response.ok, data);
  return { ok: response.ok, status: response.status, data };
}

/** PATCH /api/auto-shop-owner/my-car-companies */
export function addMyCarCompanies(token: string, carCompanyIds: string[]) {
  return patchJson<UpdateMyCarCompaniesResponse>(
    "/api/auto-shop-owner/my-car-companies",
    { carCompanyIds },
    { authToken: token }
  );
}

/** DELETE /api/auto-shop-owner/my-car-companies */
export function removeMyCarCompanies(token: string, carCompanyIds: string[]) {
  return deleteJson<UpdateMyCarCompaniesResponse>("/api/auto-shop-owner/my-car-companies", {
    authToken: token,
    body: { carCompanyIds },
  });
}

/** GET /api/auto-shop-owner/my-deals */
export function fetchMyDeals(token: string) {
  return getJson<unknown>("/api/auto-shop-owner/my-deals", { authToken: token });
}

/** GET /api/auto-shop-owner/vehicle-types-and-services */
export function fetchVehicleTypesAndServices(token: string) {
  return getJson<unknown>("/api/auto-shop-owner/vehicle-types-and-services", { authToken: token });
}

/** GET /api/auto-shop-owner/job-cards — optional `buildMyCustomersQuery`-style period filter (same as my-customers) */
export function fetchJobCards(token: string, query?: Record<string, string>) {
  const path =
    !query || Object.keys(query).length === 0
      ? "/api/auto-shop-owner/job-cards"
      : withQuery(
          "/api/auto-shop-owner/job-cards",
          query as Record<string, string | undefined>
        );
  if (__DEV__) {
    console.log("[job-cards] GET", `${autoShopOwnerBaseUrl()}${path}`);
  }
  return getJson<unknown>(path, { authToken: token });
}

/** GET /api/auto-shop-owner/payments */
export function fetchPayments(token: string) {
  return getJson<unknown>("/api/auto-shop-owner/payments", { authToken: token });
}

/** GET /api/auto-shop-owner/job-cards/paid */
export function fetchPaidJobCards(token: string) {
  return getJson<unknown>("/api/auto-shop-owner/job-cards/paid", { authToken: token });
}

/** GET /api/auto-shop-owner/job-cards/unpaid */
export function fetchUnpaidJobCards(token: string) {
  return getJson<unknown>("/api/auto-shop-owner/job-cards/unpaid", { authToken: token });
}

/** GET /api/auto-shop-owner/job-cards/:id */
export function fetchJobCardById(token: string, jobCardId: string) {
  const path = `/api/auto-shop-owner/job-cards/${jobCardId}`;
  return getJson<unknown>(path, { authToken: token });
}

/** GET /api/auto-shop-owner/job-cards/search?q= */
export function searchJobCards(token: string, q: string) {
  const path = withQuery("/api/auto-shop-owner/job-cards/search", { q });
  return getJson<unknown>(path, { authToken: token });
}

/** POST …/mark-payment-status */
export function markJobCardPaymentStatus(
  token: string,
  jobCardId: string,
  body: { paymentStatus: string }
) {
  return postJson<ApiEnvelope>(
    `/api/auto-shop-owner/job-cards/${jobCardId}/mark-payment-status`,
    body,
    { authToken: token }
  );
}

/** POST …/mark-job-status */
export function markJobCardJobStatus(token: string, jobCardId: string, body: { status: string }) {
  return postJson<ApiEnvelope>(`/api/auto-shop-owner/job-cards/${jobCardId}/mark-job-status`, body, {
    authToken: token,
  });
}

/** POST …/resend-notification */
export function resendJobCardNotification(token: string, jobCardId: string) {
  return postJson<ApiEnvelope>(`/api/auto-shop-owner/job-cards/${jobCardId}/resend-notification`, {}, {
    authToken: token,
  });
}

/** POST /api/auto-shop-owner/job-cards/collect-payment */
export function collectJobCardPayment(
  token: string,
  body: { jobCardId: string; paymentMethod: "Cash" | "Online"; remark?: string; amount: number }
) {
  return postJson<ApiEnvelope>("/api/auto-shop-owner/job-cards/collect-payment", body as unknown as Record<string, unknown>, {
    authToken: token,
  });
}

/** POST /api/auto-shop-owner/job-cards/mark-payment-invoice (convert cash → online/invoice). */
export function markJobCardPaymentInvoice(token: string, jobCardId: string) {
  return postJson<ApiEnvelope>(
    "/api/auto-shop-owner/job-cards/mark-payment-invoice",
    { jobCardId } as unknown as Record<string, unknown>,
    { authToken: token }
  );
}

/** DELETE /api/auto-shop-owner/job-cards/:id */
export function deleteJobCard(token: string, jobCardId: string) {
  return deleteJson<ApiEnvelope>(`/api/auto-shop-owner/job-cards/${jobCardId}`, { authToken: token });
}

/** DELETE /api/auto-shop-owner/my-deals/:id */
export function deleteDeal(token: string, dealId: string) {
  return deleteJson<ApiEnvelope>(`/api/auto-shop-owner/my-deals/${dealId}`, { authToken: token });
}

export type DealFormFields = {
  description?: string;
  productName?: string;
  /** Required when `dealType` is "Parts". */
  partName?: string;
  vehicleId?: string;
  vehicleName?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  price?: string;
  discountedPrice?: string;
  dealEnabled?: string;
  /** ISO date or `YYYY-MM-DD`; sent as `offerEndsOnDate`. */
  offersEndOnDate?: string;
  serviceId?: string;
  dealType?: "Service" | "Parts";
  dealImageUri?: string | null;
  /** From expo-image-picker asset when available (helps MIME/filename for content:// URIs). */
  dealImageMimeType?: string | null;
  dealImageFileName?: string | null;
};

/** Backend expects `offerEndsOnDate` as `YYYY-MM-DD` (see shop-owner my-deals multipart API). */
export function formatDealOfferEndDate(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    const trimmed = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
    return trimmed;
  }
  return formatDateYMD(d);
}

function appendDealImage(body: FormData, fields: DealFormFields) {
  if (!fields.dealImageUri) {
    return;
  }
  const part = localImageMultipartPart(fields.dealImageUri, {
    mimeType: fields.dealImageMimeType,
    fileName: fields.dealImageFileName,
    fallbackBase: "deal-image",
  });
  body.append("dealImage", { uri: part.uri, name: part.name, type: part.type } as never);
}

function appendDealText(body: FormData, key: string, value: string | undefined) {
  if (value == null) {
    return;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }
  body.append(key, trimmed);
}

/** Backend accepts both keys; send the same id for compatibility. */
function appendDealServiceIds(body: FormData, serviceId: string | undefined) {
  appendDealText(body, "serviceId", serviceId);
  appendDealText(body, "servicesId", serviceId);
}

function buildCreateDealBody(fields: DealFormFields) {
  const body = new FormData();
  appendDealImage(body, fields);
  if (fields.dealType) {
    body.append("dealType", fields.dealType);
  }
  appendDealText(body, "description", fields.description);
  appendDealText(body, "discountedPrice", fields.discountedPrice);
  if (fields.offersEndOnDate) {
    body.append("offerEndsOnDate", formatDealOfferEndDate(fields.offersEndOnDate));
  }

  const isParts = fields.dealType === "Parts";
  if (isParts) {
    appendDealText(body, "partName", fields.partName);
    appendDealText(body, "vehicleId", fields.vehicleId);
    appendDealText(body, "vehicleName", fields.vehicleName);
    appendDealText(body, "vehicleModel", fields.vehicleModel);
    appendDealText(body, "vehicleYear", fields.vehicleYear);
  } else {
    appendDealServiceIds(body, fields.serviceId);
    appendDealText(body, "productName", fields.productName);
    appendDealText(body, "price", fields.price);
    appendDealText(body, "dealEnabled", fields.dealEnabled);
  }
  return body;
}

function buildUpdateDealBody(fields: DealFormFields) {
  const body = new FormData();
  appendDealImage(body, fields);
  if (fields.dealType) {
    body.append("dealType", fields.dealType);
  }
  appendDealText(body, "description", fields.description);
  appendDealText(body, "discountedPrice", fields.discountedPrice);
  if (fields.offersEndOnDate) {
    body.append("offerEndsOnDate", formatDealOfferEndDate(fields.offersEndOnDate));
  }

  const isParts = fields.dealType === "Parts";
  if (isParts) {
    appendDealText(body, "partName", fields.partName);
    appendDealText(body, "vehicleId", fields.vehicleId);
    appendDealText(body, "vehicleName", fields.vehicleName);
    appendDealText(body, "vehicleModel", fields.vehicleModel);
    appendDealText(body, "vehicleYear", fields.vehicleYear);
  } else {
    appendDealServiceIds(body, fields.serviceId);
    appendDealText(body, "productName", fields.productName);
    appendDealText(body, "price", fields.price);
    appendDealText(body, "dealEnabled", fields.dealEnabled);
  }
  return body;
}

export async function createDealMultipart(token: string, fields: DealFormFields) {
  const base = autoShopOwnerBaseUrl();
  const body = buildCreateDealBody(fields);
  const url = `${base}/api/auto-shop-owner/my-deals`;
  logApiRequest("POST", url, body);
  logMultipartCurl("POST", url, body, token);
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: token },
    body,
  });
  const data = (await response.json().catch(() => null)) as ApiEnvelope | null;
  logApiResponse("POST", url, response.status, response.ok, data);
  return { ok: response.ok, status: response.status, data };
}

export const MAX_JOB_CARD_VEHICLE_PHOTOS = 5;

export type JobCardVehiclePhotoUpload = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

export type CreateJobCardFormFields = {
  customerId: string;
  vehicleId: string;
  odometerReading: string;
  dueOdometerReading: string;
  issueDescription: string;
  serviceType: string;
  priorityLevel: string;
  /** JSON string: `[{ "service": "<id>", "subServices": [...] }]` */
  servicesJson: string;
  additionalNotes?: string;
  technicalRemarks?: string;
  /** Sum of per-line labour costs (mirrors web `labourSubTotal`). */
  labourCharge?: number | string;
  /** Discount text/amount (mirrors web `form.discount` → `labourDuration`). */
  labourDuration?: string;
  vehiclePhotos?: JobCardVehiclePhotoUpload[];
};

function appendJobCardVehiclePhotos(body: FormData, photos: JobCardVehiclePhotoUpload[] | undefined) {
  if (!photos?.length) {
    return;
  }
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const part = localImageMultipartPart(photo.uri, {
      mimeType: photo.mimeType,
      fileName: photo.fileName,
      fallbackBase: `vehicle-photo-${i + 1}`,
    });
    body.append("vehiclePhotos", { uri: part.uri, name: part.name, type: part.type } as never);
  }
}

function appendJobCardFormFields(body: FormData, fields: CreateJobCardFormFields) {
  body.append("customerId", fields.customerId);
  body.append("vehicleId", fields.vehicleId);
  body.append("odometerReading", fields.odometerReading);
  body.append("dueOdometerReading", fields.dueOdometerReading);
  body.append("issueDescription", fields.issueDescription);
  body.append("serviceType", fields.serviceType);
  body.append("priorityLevel", fields.priorityLevel);
  body.append("services", fields.servicesJson);
  if (fields.labourCharge != null && fields.labourCharge !== "") {
    body.append("labourCharge", String(fields.labourCharge));
  }
  body.append("labourDuration", String(fields.labourDuration ?? "0"));
  if (fields.additionalNotes != null) {
    body.append("additionalNotes", fields.additionalNotes);
  }
  if (fields.technicalRemarks != null) {
    body.append("technicalRemarks", fields.technicalRemarks);
  }
  appendJobCardVehiclePhotos(body, fields.vehiclePhotos);
}

export async function createJobCardMultipart(token: string, fields: CreateJobCardFormFields) {
  const base = autoShopOwnerBaseUrl();
  const body = new FormData();
  appendJobCardFormFields(body, fields);

  const url = `${base}/api/auto-shop-owner/job-cards`;
  logApiRequest("POST", url, body);
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: token },
    body,
  });
  const data = (await response.json().catch(() => null)) as ApiEnvelope | null;
  logApiResponse("POST", url, response.status, response.ok, data);
  return { ok: response.ok, status: response.status, data };
}

export async function updateJobCardMultipart(token: string, jobCardId: string, fields: CreateJobCardFormFields) {
  const base = autoShopOwnerBaseUrl();
  const body = new FormData();
  appendJobCardFormFields(body, fields);

  const url = `${base}/api/auto-shop-owner/job-cards/${jobCardId}`;
  logApiRequest("PUT", url, body);
  const response = await fetch(url, {
    method: "PUT",
    headers: { Authorization: token },
    body,
  });
  const data = (await response.json().catch(() => null)) as ApiEnvelope | null;
  logApiResponse("PUT", url, response.status, response.ok, data);
  return { ok: response.ok, status: response.status, data };
}

export async function updateDealMultipart(token: string, dealId: string, fields: DealFormFields) {
  const base = autoShopOwnerBaseUrl();
  const body = buildUpdateDealBody(fields);
  const url = `${base}/api/auto-shop-owner/my-deals/${dealId}`;
  logApiRequest("PUT", url, body);
  const response = await fetch(url, {
    method: "PUT",
    headers: { Authorization: token },
    body,
  });
  const data = (await response.json().catch(() => null)) as ApiEnvelope | null;
  logApiResponse("PUT", url, response.status, response.ok, data);
  return { ok: response.ok, status: response.status, data };
}
