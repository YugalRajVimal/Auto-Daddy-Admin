import {
  deleteJsonAutoshopowner,
  getJsonAutoshopowner,
  postJsonAutoshopowner,
  putJsonAutoshopowner,
} from "../api/autoshopownerHttp";
import type { ApiEnvelope } from "./autoshopownerApi";

export type JobCardFormCustomer = {
  _id: string;
  name?: string;
  phone?: string;
  countryCode?: string;
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
    year?: string | number;
    odometerReading?: string | number;
    dueOdometerReading?: string | number | null;
    make?: { name?: string; model?: string };
    brand?: string;
  }>;
};

export type AutoshopJobCardStatus =
  | "pending"
  | "rejected"
  | "autoRejected"
  | "convertedToInvoice"
  | "CashPaid";

export type AutoshopJobCardServiceInput = {
  serviceId: string;
  category: string;
  desc?: string;
  /** Catalog sub-service name — needed to rematch deals/lines on edit. */
  subServiceName?: string;
  unitCost: number;
  qty: number;
  odoOutReading?: number;
  /** Percent off when a matching service deal applies. */
  discountPercentage?: number;
  /** Line amount (unitCost × qty) before deal discount. */
  amountBeforeDiscount?: number;
  dealId?: string;
};

export type CreateAutoshopJobCardInput = {
  customerType: "registered" | "onboarded";
  customerId?: string;
  onboardedCustomerId?: string;
  vehicleId: string;
  odoIn: number;
  services: AutoshopJobCardServiceInput[];
  bankId?: string;
  labourCharge?: number;
  terms?: string;
  sendForApproval?: boolean;
};

export type UpdateAutoshopJobCardInput = Partial<{
  labourCharge: number;
  terms: string;
  odoIn: number;
  services: AutoshopJobCardServiceInput[];
  bankId: string;
}>;

export type AutoshopPageDetailsSubService = {
  serviceId: string;
  category: string;
  subServiceName: string;
  desc?: string;
  price?: number;
  quantity?: number;
  tax?: number;
  make?: string;
  model?: string;
  labourCost?: number;
  odoOutRequired?: boolean;
};

export type AutoshopPageDetailsBank = {
  _id: string;
  BankName?: string;
  AccountName?: string;
  assignToInvoice?: boolean;
};

export type AutoshopPageDetailsServiceDeal = {
  _id: string;
  serviceId: string;
  subServiceName?: string;
  discountPercentage?: number;
  offerEndsOnDate?: string;
  dealImage?: string | null;
  createdAt?: string;
};

export type AutoshopNextJobCard = {
  jobCardNo?: number;
  jobCardId?: string;
  prefixSet?: boolean;
  year?: number;
};

export type AutoshopJobCardPageDetails = {
  myCustomers: JobCardFormCustomer[];
  /** Display id from API (e.g. `"JBNO-7"`). */
  nextJobCardNo?: string;
  /** Numeric sequence used by PUT/DELETE path params. */
  nextJobCardNumber?: number;
  nextJobCard?: AutoshopNextJobCard;
  myAllSubServices: AutoshopPageDetailsSubService[];
  myAllBanks: AutoshopPageDetailsBank[];
  serviceDeals: AutoshopPageDetailsServiceDeal[];
};

function withQuery(path: string, query: Record<string, string | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v != null && String(v).trim() !== "") usp.append(k, String(v));
  }
  const s = usp.toString();
  return s ? `${path}?${s}` : path;
}

const BASE = "/api/autoshopowner/jobcards";

export function fetchAutoshopJobCardPageDetails(token: string) {
  return getJsonAutoshopowner<unknown>(`${BASE}/page-details`, token);
}

export function fetchAutoshopJobCards(
  token: string,
  query?: { search?: string; status?: AutoshopJobCardStatus },
) {
  return getJsonAutoshopowner<unknown>(
    withQuery(BASE, {
      search: query?.search,
      status: query?.status,
    }),
    token,
  );
}

export function fetchAutoshopPendingApprovalJobCards(token: string) {
  return getJsonAutoshopowner<unknown>(`${BASE}/pending-approval`, token);
}

/** Path param is numeric `jobCardNo` (e.g. `1`), not Mongo `_id`. */
export function fetchAutoshopJobCardById(token: string, jobCardNo: string | number) {
  return getJsonAutoshopowner<unknown>(`${BASE}/${encodeURIComponent(String(jobCardNo))}`, token);
}

export function createAutoshopJobCard(token: string, body: CreateAutoshopJobCardInput) {
  return postJsonAutoshopowner<ApiEnvelope>(BASE, body as unknown as Record<string, unknown>, token);
}

export function updateAutoshopJobCard(
  token: string,
  jobCardNo: string | number,
  body: UpdateAutoshopJobCardInput,
) {
  return putJsonAutoshopowner<ApiEnvelope>(
    `${BASE}/${encodeURIComponent(String(jobCardNo))}`,
    body as unknown as Record<string, unknown>,
    token,
  );
}

export function deleteAutoshopJobCard(token: string, jobCardNo: string | number) {
  return deleteJsonAutoshopowner<ApiEnvelope>(
    `${BASE}/${encodeURIComponent(String(jobCardNo))}`,
    token,
  );
}

export function updateAutoshopJobCardStatus(
  token: string,
  jobCardNo: string | number,
  status: AutoshopJobCardStatus,
) {
  return putJsonAutoshopowner<ApiEnvelope>(
    `${BASE}/${encodeURIComponent(String(jobCardNo))}/status`,
    { status },
    token,
  );
}

export function sendAutoshopJobCardForApproval(token: string, jobCardNo: string | number) {
  return postJsonAutoshopowner<ApiEnvelope>(
    `${BASE}/${encodeURIComponent(String(jobCardNo))}/send-for-approval`,
    {},
    token,
  );
}

/** Mark a converted invoice as paid. Path param is numeric `jobCardNo`, not Mongo `_id`. */
export function markAutoshopInvoicePaid(token: string, jobCardNo: string | number) {
  return postJsonAutoshopowner<ApiEnvelope>(
    `${BASE}/${encodeURIComponent(String(jobCardNo))}/markInvoicePaid`,
    {},
    token,
  );
}

/** Paid invoices for GST reports. Optional `startDate` / `endDate` (YYYY-MM-DD). */
export function fetchAutoshopGstReports(
  token: string,
  query?: { startDate?: string; endDate?: string },
) {
  return getJsonAutoshopowner<unknown>(
    withQuery(`${BASE}/gst-reports`, {
      startDate: query?.startDate,
      endDate: query?.endDate,
    }),
    token,
  );
}

/** Paid invoices + CashPaid income. Optional `startDate` / `endDate` (YYYY-MM-DD). */
export function fetchAutoshopIncomeReport(
  token: string,
  query?: { startDate?: string; endDate?: string },
) {
  return getJsonAutoshopowner<unknown>(
    withQuery(`${BASE}/income`, {
      startDate: query?.startDate,
      endDate: query?.endDate,
    }),
    token,
  );
}

/** Current year's job card / estimate prefix. */
export function fetchAutoshopJobCardPrefix(token: string) {
  return getJsonAutoshopowner<unknown>("/api/autoshopowner/jobcard-prefix", token);
}

/** Set the job card / estimate prefix for the current year. */
export function updateAutoshopJobCardPrefix(token: string, prefix: string) {
  return putJsonAutoshopowner<ApiEnvelope>(
    "/api/autoshopowner/jobcard-prefix",
    { prefix },
    token,
  );
}

/** Next estimate / job card number (does not increment). */
export function fetchAutoshopJobCardNextNumber(token: string) {
  return getJsonAutoshopowner<unknown>("/api/autoshopowner/jobcard-prefix/next", token);
}

/** Set the next estimate / job card sequence number. */
export function updateAutoshopJobCardSeq(
  token: string,
  body: { businessProfileId: string; newSeq: number },
) {
  return putJsonAutoshopowner<ApiEnvelope>(
    "/api/autoshopowner/jobcard-prefix/seq",
    body,
    token,
  );
}

export function parseAutoshopJobCardPrefix(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const root = payload as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root;
  const raw =
    data.prefix ??
    data.jobCardPrefix ??
    data.jobcardPrefix ??
    root.prefix ??
    root.jobCardPrefix ??
    root.jobcardPrefix;
  return typeof raw === "string" ? raw.trim() : raw != null ? String(raw).trim() : "";
}

export function parseAutoshopJobCardNextNumber(payload: unknown): {
  nextNumber: string;
  prefix: string;
} {
  if (!payload || typeof payload !== "object") return { nextNumber: "1", prefix: "" };
  const root = payload as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root;
  const rawNext =
    data.nextNumber ?? data.newSeq ?? data.seq ?? data.jobCardNo ?? root.nextNumber ?? root.newSeq ?? root.jobCardNo;
  let nextNumber = "1";
  if (typeof rawNext === "number" && Number.isFinite(rawNext) && rawNext > 0) {
    nextNumber = String(Math.trunc(rawNext));
  } else if (typeof rawNext === "string" && rawNext.trim()) {
    const digits = rawNext.replace(/[^\d]/g, "");
    if (digits) nextNumber = String(Number(digits) || 1);
  }
  const prefix = parseAutoshopJobCardPrefix(payload);
  return { nextNumber, prefix };
}

export function parseAutoshopJobCardPageDetails(payload: unknown): AutoshopJobCardPageDetails | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root;

  const myCustomers = Array.isArray(data.myCustomers)
    ? (data.myCustomers as JobCardFormCustomer[])
    : [];
  const myAllSubServices = Array.isArray(data.myAllSubServices)
    ? (data.myAllSubServices as AutoshopPageDetailsSubService[])
    : [];
  const myAllBanks = Array.isArray(data.myAllBanks)
    ? (data.myAllBanks as AutoshopPageDetailsBank[])
    : [];
  const serviceDealsRaw = Array.isArray(data.serviceDeals) ? data.serviceDeals : [];
  const serviceDeals: AutoshopPageDetailsServiceDeal[] = [];
  for (const raw of serviceDealsRaw) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const id = typeof o._id === "string" ? o._id.trim() : "";
    const serviceId = typeof o.serviceId === "string" ? o.serviceId.trim() : "";
    if (!id || !serviceId) continue;
    const pctRaw = o.discountPercentage;
    const discountPercentage =
      typeof pctRaw === "number"
        ? pctRaw
        : typeof pctRaw === "string" && pctRaw.trim()
          ? Number(pctRaw)
          : undefined;
    const subServiceName =
      typeof o.subServiceName === "string" && o.subServiceName.trim()
        ? o.subServiceName.trim()
        : undefined;
    const offerEndsOnDate =
      typeof o.offerEndsOnDate === "string"
        ? o.offerEndsOnDate
        : typeof o.offersEndOnDate === "string"
          ? o.offersEndOnDate
          : undefined;
    serviceDeals.push({
      _id: id,
      serviceId,
      ...(subServiceName ? { subServiceName } : {}),
      ...(typeof discountPercentage === "number" && Number.isFinite(discountPercentage)
        ? { discountPercentage }
        : {}),
      ...(offerEndsOnDate ? { offerEndsOnDate } : {}),
      dealImage: (o.dealImage as string | null | undefined) ?? null,
      createdAt: typeof o.createdAt === "string" ? o.createdAt : undefined,
    });
  }
  const nextJobCardObj =
    data.nextJobCard && typeof data.nextJobCard === "object"
      ? (data.nextJobCard as Record<string, unknown>)
      : null;

  const fromObjId =
    nextJobCardObj && typeof nextJobCardObj.jobCardId === "string"
      ? nextJobCardObj.jobCardId.trim()
      : "";
  const fromObjNo =
    nextJobCardObj && typeof nextJobCardObj.jobCardNo === "number" && Number.isFinite(nextJobCardObj.jobCardNo)
      ? nextJobCardObj.jobCardNo
      : undefined;

  const nextJobCardNoRaw = data.nextJobCardNo ?? data.nextJobNo ?? data.nextJobCardNumber;
  let nextJobCardNo: string | undefined;
  let nextJobCardNumber: number | undefined = fromObjNo;

  if (fromObjId) {
    nextJobCardNo = fromObjId;
  } else if (typeof nextJobCardNoRaw === "string" && nextJobCardNoRaw.trim()) {
    nextJobCardNo = nextJobCardNoRaw.trim();
    const digits = nextJobCardNoRaw.replace(/[^\d]/g, "");
    if (digits && nextJobCardNumber == null) {
      const n = Number(digits);
      if (Number.isFinite(n) && n > 0) nextJobCardNumber = n;
    }
  } else if (typeof nextJobCardNoRaw === "number" && Number.isFinite(nextJobCardNoRaw)) {
    nextJobCardNo = String(nextJobCardNoRaw);
    nextJobCardNumber = nextJobCardNoRaw;
  }

  const nextJobCard: AutoshopNextJobCard | undefined = nextJobCardObj
    ? {
        jobCardNo: fromObjNo,
        jobCardId: fromObjId || undefined,
        prefixSet: typeof nextJobCardObj.prefixSet === "boolean" ? nextJobCardObj.prefixSet : undefined,
        year:
          typeof nextJobCardObj.year === "number" && Number.isFinite(nextJobCardObj.year)
            ? nextJobCardObj.year
            : undefined,
      }
    : undefined;

  return {
    myCustomers,
    nextJobCardNo,
    nextJobCardNumber,
    nextJobCard,
    myAllSubServices,
    myAllBanks,
    serviceDeals,
  };
}

/** True when a service deal still applies (has % off and offer end date not past). */
export function isAutoshopServiceDealApplicable(
  deal: Pick<AutoshopPageDetailsServiceDeal, "discountPercentage" | "offerEndsOnDate">,
  asOf: Date = new Date(),
): boolean {
  const pct = Number(deal.discountPercentage);
  if (!Number.isFinite(pct) || pct <= 0) return false;
  if (!deal.offerEndsOnDate) return true;
  const end = new Date(deal.offerEndsOnDate);
  if (!Number.isFinite(end.getTime())) return true;
  const endOfDay = new Date(end);
  endOfDay.setHours(23, 59, 59, 999);
  return asOf <= endOfDay;
}

/** Match an active deal for a sub-service (serviceId + subServiceName). */
export function findAutoshopServiceDealForSub(
  deals: AutoshopPageDetailsServiceDeal[],
  serviceId: string,
  subServiceName: string,
): AutoshopPageDetailsServiceDeal | null {
  const sid = String(serviceId ?? "").trim();
  const name = String(subServiceName ?? "").trim().toLowerCase();
  if (!sid || !name) return null;
  const matches = deals.filter(
    (d) =>
      d.serviceId === sid &&
      String(d.subServiceName ?? "")
        .trim()
        .toLowerCase() === name &&
      isAutoshopServiceDealApplicable(d),
  );
  if (matches.length === 0) return null;
  // Prefer the highest discount when multiple deals match the same sub-service.
  return matches.reduce((best, cur) =>
    Number(cur.discountPercentage) > Number(best.discountPercentage) ? cur : best,
  );
}

export function pageDetailsSubServicesToCategories(subs: AutoshopPageDetailsSubService[]) {
  const byId = new Map<
    string,
    {
      id: string;
      name?: string;
      desc?: string;
      odoOutRequired?: boolean;
      subServices: Array<{
        name: string;
        desc?: string;
        price?: number;
        qty?: number;
        make?: string;
        model?: string;
        labourCost?: number;
        odoOutRequired?: boolean;
      }>;
    }
  >();

  for (const sub of subs) {
    const id = String(sub.serviceId ?? "").trim();
    if (!id) continue;
    let cat = byId.get(id);
    if (!cat) {
      cat = {
        id,
        name: sub.category,
        odoOutRequired: Boolean(sub.odoOutRequired),
        subServices: [],
      };
      byId.set(id, cat);
    }
    if (sub.odoOutRequired) cat.odoOutRequired = true;
    const make = typeof sub.make === "string" ? sub.make.trim() : "";
    const model = typeof sub.model === "string" ? sub.model.trim() : "";
    const qty =
      typeof sub.quantity === "number" && Number.isFinite(sub.quantity) && sub.quantity > 0
        ? sub.quantity
        : undefined;
    const labourCost =
      typeof sub.labourCost === "number" && Number.isFinite(sub.labourCost) ? sub.labourCost : undefined;
    cat.subServices.push({
      name: sub.subServiceName,
      desc: sub.desc,
      price: sub.price,
      ...(qty != null ? { qty } : {}),
      ...(make ? { make } : {}),
      ...(model ? { model } : {}),
      ...(labourCost != null ? { labourCost } : {}),
      odoOutRequired: Boolean(sub.odoOutRequired),
    });
  }

  return [...byId.values()];
}

export function defaultBankIdFromPageDetails(banks: AutoshopPageDetailsBank[]): string {
  const assigned = banks.find((b) => b.assignToInvoice);
  return assigned?._id ?? banks[0]?._id ?? "";
}

export function apiMessageFromEnvelope(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const msg = (data as ApiEnvelope).message;
  return typeof msg === "string" && msg.trim() ? msg.trim() : undefined;
}
