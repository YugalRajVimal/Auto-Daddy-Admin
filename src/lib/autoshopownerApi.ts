import {
  deleteJsonAutoshopowner,
  getJsonAutoshopowner,
  patchJsonAutoshopowner,
  postJsonAutoshopowner,
  putFormAutoshopowner,
  putJsonAutoshopowner,
} from "../api/autoshopownerHttp";

export type ApiEnvelope = { success?: boolean; message?: string };

function withQuery(path: string, query: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v != null && String(v).trim() !== "") usp.append(k, String(v));
  }
  const s = usp.toString();
  return s ? `${path}?${s}` : path;
}

// ---- Home / Dashboard ----
export function fetchShopOwnerHome(token: string) {
  return getJsonAutoshopowner<unknown>("/api/autoshopowner/home", token);
}

// ---- Profile ----
export function fetchPersonalProfile(token: string) {
  return getJsonAutoshopowner<unknown>("/api/autoshopowner/profile/personal", token);
}

export function updatePersonalProfile(token: string, fields: { name?: string; city?: string; profilePhoto?: File | null }) {
  // Backend accepts name, city, profilePhoto only (phone & email are locked).
  const fd = new FormData();
  if (fields.name != null) fd.append("name", fields.name);
  if (fields.city != null) fd.append("city", fields.city);
  if (fields.profilePhoto) fd.append("profilePhoto", fields.profilePhoto);
  return putFormAutoshopowner<ApiEnvelope>("/api/autoshopowner/profile/personal", fd, token);
}

export function fetchBusinessProfile(token: string) {
  return getJsonAutoshopowner<unknown>("/api/autoshopowner/profile/business", token);
}

export type BusinessProfileFields = {
  businessName?: string;
  businessPhone?: string;
  city?: string;
  businessAddress?: string;
  pincode?: string;
  businessHSTNumber?: string;
  gst?: string | number;
  businessEmail?: string;
  shopTypes?: string[]; // sent as JSON string (matches curl examples)
  businessLogo?: File | null;
};

export function updateBusinessProfile(token: string, fields: BusinessProfileFields) {
  const fd = new FormData();
  const append = (k: string, v: unknown) => {
    if (v == null) return;
    const s = String(v).trim();
    if (!s) return;
    fd.append(k, s);
  };

  append("businessName", fields.businessName);
  append("businessPhone", fields.businessPhone);
  append("city", fields.city);
  append("businessAddress", fields.businessAddress);
  append("pincode", fields.pincode);
  append("businessHSTNumber", fields.businessHSTNumber);
  append("gst", fields.gst);
  append("businessEmail", fields.businessEmail);
  if (Array.isArray(fields.shopTypes)) {
    fd.append("shopTypes", JSON.stringify(fields.shopTypes));
  }
  if (fields.businessLogo) fd.append("businessLogo", fields.businessLogo);
  return putFormAutoshopowner<ApiEnvelope>("/api/autoshopowner/profile/business", fd, token);
}

export type TemplateSlugsFields = {
  invoiceTemplateSlug?: string;
  jobCardTemplateSlug?: string;
};

/** PATCH /api/autoshopowner/profile/business/template-slugs — partial body supported. */
export function updateTemplateSlugs(token: string, fields: TemplateSlugsFields) {
  const body: Record<string, string> = {};
  const invoice = fields.invoiceTemplateSlug?.trim();
  const jobCard = fields.jobCardTemplateSlug?.trim();
  if (invoice) body.invoiceTemplateSlug = invoice;
  if (jobCard) body.jobCardTemplateSlug = jobCard;
  return patchJsonAutoshopowner<ApiEnvelope>(
    "/api/autoshopowner/profile/business/template-slugs",
    body,
    token,
  );
}

// ---- Services ----
export function fetchAdminServices(token: string, query: { shopType?: string; services?: string }) {
  return getJsonAutoshopowner<unknown>(
    withQuery("/api/autoshopowner/services", {
      shopType: query.shopType,
      services: query.services,
    }),
    token,
  );
}

export function addMyService(token: string, body: { serviceId: string; status: string; date: string }) {
  return putJsonAutoshopowner<ApiEnvelope>("/api/autoshopowner/services/add", body, token);
}

export type SubServiceInput = {
  name: string;
  desc?: string;
  price?: number;
  quantity?: number;
  tax?: number;
};

export function addSubServices(token: string, body: { serviceId: string; subServices: SubServiceInput[] }) {
  return postJsonAutoshopowner<ApiEnvelope>("/api/autoshopowner/services/subservices/add", body, token);
}

export function editSubService(
  token: string,
  body: { serviceId: string; subServiceIndex: number; update: Partial<Pick<SubServiceInput, "price" | "quantity" | "tax" | "name" | "desc">> },
) {
  return putJsonAutoshopowner<ApiEnvelope>("/api/autoshopowner/services/subservices/edit", body, token);
}

export function deleteSubService(token: string, body: { serviceId: string; subServiceIndex: number }) {
  return deleteJsonAutoshopowner<ApiEnvelope>("/api/autoshopowner/services/subservices/delete", token, body);
}

// ---- Customers ----
export function onboardCustomer(token: string, body: { name: string; email: string; phone: string; city?: string }) {
  return postJsonAutoshopowner<ApiEnvelope>("/api/autoshopowner/customer/onboard", body, token);
}

export function fetchOnboardedCustomers(token: string) {
  return getJsonAutoshopowner<unknown>("/api/autoshopowner/customer/onboarded", token);
}

export function editOnboardedCustomer(
  token: string,
  customerId: string,
  patch: Record<string, unknown>,
) {
  return putJsonAutoshopowner<ApiEnvelope>(`/api/autoshopowner/customer/onboarded/${encodeURIComponent(customerId)}`, patch, token);
}

export function addVehicleToOnboardedCustomer(
  token: string,
  customerId: string,
  body: Record<string, unknown>,
) {
  return postJsonAutoshopowner<ApiEnvelope>(
    `/api/autoshopowner/customer/onboarded/${encodeURIComponent(customerId)}/vehicles`,
    body,
    token,
  );
}

export function searchCustomers(token: string, search: string) {
  return getJsonAutoshopowner<unknown>(
    withQuery("/api/autoshopowner/customer/search", { search }),
    token,
  );
}

export function addExistingCustomer(token: string, body: { customerId: string; edits?: Record<string, unknown> }) {
  return postJsonAutoshopowner<ApiEnvelope>("/api/autoshopowner/customer/add", body, token);
}

export function fetchAddedCustomers(token: string, status?: string) {
  return getJsonAutoshopowner<unknown>(
    withQuery("/api/autoshopowner/customer/added", { status }),
    token,
  );
}

export function deleteAddedCustomer(token: string, customerId: string) {
  return deleteJsonAutoshopowner<ApiEnvelope>(
    `/api/autoshopowner/customer/added/${encodeURIComponent(customerId)}`,
    token,
  );
}

