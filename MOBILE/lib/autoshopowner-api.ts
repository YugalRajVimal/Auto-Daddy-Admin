import {
  deleteJsonAutoshopowner,
  getJsonAutoshopowner,
  patchJsonAutoshopowner,
  postJsonAutoshopowner,
  putFormAutoshopowner,
  putJsonAutoshopowner,
} from "@/lib/autoshopowner-http";
import { appendUploadPart, type UploadPart } from "@/lib/upload-part";
import type { ShopOwnerHomeApiResponse } from "@/types/shop-owner-home";

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
  return getJsonAutoshopowner<ShopOwnerHomeApiResponse>("/api/autoshopowner/home", token);
}

// ---- Profile ----
export function fetchPersonalProfile(token: string) {
  return getJsonAutoshopowner<unknown>("/api/autoshopowner/profile/personal", token);
}

export function updatePersonalProfile(token: string, fields: { name?: string; city?: string; profilePhoto?: UploadPart | null }) {
  // Backend accepts name, city, profilePhoto only (phone & email are locked).
  const fd = new FormData();
  if (fields.name != null) fd.append("name", fields.name);
  if (fields.city != null) fd.append("city", fields.city);
  appendUploadPart(fd, "profilePhoto", fields.profilePhoto);
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
  businessLogo?: UploadPart | null;
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
  appendUploadPart(fd, "businessLogo", fields.businessLogo);
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

// ---- Invoice prefix ----
export type InvoicePrefixEntry = {
  prefix: string;
  year: number | null;
};

/** GET /api/autoshopowner/invoice-prefix — current year, or `?year=` for a specific year. */
export function fetchInvoicePrefix(token: string, year?: number) {
  return getJsonAutoshopowner<ApiEnvelope>(
    withQuery("/api/autoshopowner/invoice-prefix", {
      year: year != null ? String(year) : undefined,
    }),
    token,
  );
}

/** GET /api/autoshopowner/invoice-prefix/all — full prefix history. */
export function fetchInvoicePrefixHistory(token: string) {
  return getJsonAutoshopowner<unknown>("/api/autoshopowner/invoice-prefix/all", token);
}

/**
 * PUT /api/autoshopowner/invoice-prefix — set/update prefix.
 * Omit `year` to apply to the current year.
 */
export function updateInvoicePrefix(token: string, prefix: string, year?: number) {
  const body: Record<string, unknown> = { prefix };
  if (year != null) body.year = year;
  return putJsonAutoshopowner<ApiEnvelope>("/api/autoshopowner/invoice-prefix", body, token);
}

function readPrefixYear(obj: Record<string, unknown>): number | null {
  const raw = obj.year ?? obj.Year;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function readPrefixString(obj: Record<string, unknown>): string {
  const raw =
    obj.prefix ??
    obj.invoicePrefix ??
    obj.invoice_prefix;
  return typeof raw === "string" ? raw.trim() : raw != null ? String(raw).trim() : "";
}

export function parseInvoicePrefix(payload: unknown): InvoicePrefixEntry {
  if (!payload || typeof payload !== "object") return { prefix: "", year: null };
  const root = payload as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;
  return {
    prefix: readPrefixString(data) || readPrefixString(root),
    year: readPrefixYear(data) ?? readPrefixYear(root),
  };
}

export function parseInvoicePrefixHistory(payload: unknown): InvoicePrefixEntry[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const raw = root.data ?? root.prefixes ?? root.history ?? root;
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as Record<string, unknown>).prefixes)
      ? ((raw as Record<string, unknown>).prefixes as unknown[])
      : [];
  return arr
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const prefix = readPrefixString(obj);
      if (!prefix) return null;
      return { prefix, year: readPrefixYear(obj) };
    })
    .filter((entry): entry is InvoicePrefixEntry => entry != null);
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
  make?: string;
  model?: string;
  name: string;
  desc?: string;
  price?: number;
  quantity?: number;
  quantityType?: "Unit" | "Days";
  labourCost?: number;
  tax?: number;
};

export function addSubServices(token: string, body: { serviceId: string; subServices: SubServiceInput[] }) {
  return postJsonAutoshopowner<ApiEnvelope>("/api/autoshopowner/services/subservices/add", body, token);
}

export function editSubService(
  token: string,
  body: {
    serviceId: string;
    subServiceIndex: number;
    update: Partial<
      Pick<
        SubServiceInput,
        "make" | "model" | "price" | "quantity" | "quantityType" | "labourCost" | "tax" | "name" | "desc"
      >
    >;
  },
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

/** Body for POST …/onboarded/:id/vehicles — matches web People.tsx. */
export type OnboardedCustomerVehicleBody = {
  carCompanyId: string;
  make: string;
  model: string;
  year: number;
  licensePlateNo: string;
  vinNo: string;
  odometerReading: number;
};

export function buildOnboardedVehicleBody(input: {
  carCompanyId: string;
  make: string;
  model: string;
  year: string | number;
  licensePlateNo: string;
  vinNo?: string;
  odometerReading?: string | number;
}): OnboardedCustomerVehicleBody {
  const odoRaw = input.odometerReading;
  const odoNum =
    typeof odoRaw === "number"
      ? odoRaw
      : Number(String(odoRaw ?? "").trim().replace(/[^\d.]/g, "")) || 0;
  return {
    carCompanyId: input.carCompanyId.trim(),
    make: input.make.trim(),
    model: input.model.trim(),
    year: Number(String(input.year).trim()),
    licensePlateNo: input.licensePlateNo.trim().slice(0, 14),
    vinNo: (input.vinNo ?? "").trim(),
    odometerReading: odoNum,
  };
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

// ---- Open hours ----
export type WeeklyOpenHourEntry = {
  day: string;
  open?: string;
  close?: string;
  isClosed?: boolean;
};

export type SpecialOpenHourEntry = {
  date: string;
  open?: string;
  close?: string;
  isClosed?: boolean;
  reason?: string;
};

/** GET /api/autoshopowner/profile/business/open-hours — weekly + specials (optional date range). */
export function fetchOpenHours(
  token: string,
  query?: { startDate?: string; endDate?: string },
) {
  return getJsonAutoshopowner<unknown>(
    withQuery("/api/autoshopowner/profile/business/open-hours", {
      startDate: query?.startDate,
      endDate: query?.endDate,
    }),
    token,
  );
}

/** PUT weekly default schedule (full replace). */
export function updateWeeklyOpenHours(token: string, perDayOpenHours: WeeklyOpenHourEntry[]) {
  return putJsonAutoshopowner<ApiEnvelope>(
    "/api/autoshopowner/profile/business/open-hours/weekly",
    { perDayOpenHours },
    token,
  );
}

/** PUT one-off override for a specific date (upsert). */
export function upsertSpecialOpenHours(token: string, entry: SpecialOpenHourEntry) {
  const body: Record<string, unknown> = { date: entry.date };
  if (entry.isClosed) {
    body.isClosed = true;
    if (entry.reason?.trim()) body.reason = entry.reason.trim();
  } else {
    body.open = entry.open;
    body.close = entry.close;
    if (entry.reason?.trim()) body.reason = entry.reason.trim();
  }
  return putJsonAutoshopowner<ApiEnvelope>(
    "/api/autoshopowner/profile/business/open-hours/special",
    body,
    token,
  );
}

/** DELETE special override — reverts that date to weekly schedule. */
export function deleteSpecialOpenHours(token: string, dateISO: string) {
  return deleteJsonAutoshopowner<ApiEnvelope>(
    `/api/autoshopowner/profile/business/open-hours/special/${encodeURIComponent(dateISO)}`,
    token,
  );
}

