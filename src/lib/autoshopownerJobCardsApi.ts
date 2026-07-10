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
  unitCost: number;
  qty: number;
  odoOutReading?: number;
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
  odoOutRequired?: boolean;
};

export type AutoshopPageDetailsBank = {
  _id: string;
  BankName?: string;
  AccountName?: string;
  assignToInvoice?: boolean;
};

export type AutoshopJobCardPageDetails = {
  myCustomers: JobCardFormCustomer[];
  nextJobCardNo?: number;
  myAllSubServices: AutoshopPageDetailsSubService[];
  myAllBanks: AutoshopPageDetailsBank[];
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
  const nextJobCardNo =
    typeof data.nextJobCardNo === "number" && Number.isFinite(data.nextJobCardNo)
      ? data.nextJobCardNo
      : undefined;

  return { myCustomers, nextJobCardNo, myAllSubServices, myAllBanks };
}

export function pageDetailsSubServicesToCategories(subs: AutoshopPageDetailsSubService[]) {
  const byId = new Map<
    string,
    {
      id: string;
      name?: string;
      desc?: string;
      odoOutRequired?: boolean;
      subServices: Array<{ name: string; desc?: string; price?: number; odoOutRequired?: boolean }>;
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
    cat.subServices.push({
      name: sub.subServiceName,
      desc: sub.desc,
      price: sub.price,
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
