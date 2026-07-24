import {
  apiMessageFromEnvelope,
  createAutoshopJobCard,
  fetchAutoshopJobCardPageDetails,
  fetchAutoshopJobCards,
  fetchAutoshopPendingApprovalJobCards,
  pageDetailsSubServicesToCategories,
  parseAutoshopJobCardPageDetails,
  updateAutoshopJobCard,
  type AutoshopJobCardServiceInput,
  type AutoshopPageDetailsServiceDeal,
  type CreateAutoshopJobCardInput,
  type JobCardFormCustomer,
} from "./autoshopownerJobCardsApi";
import { parseJobCardsFromPagePayload, pickJobCardNoForApi } from "./shopOwnerJobCards";
import { MAX_JOB_CARD_VEHICLE_PHOTOS } from "./shopOwnerMutations";

export { MAX_JOB_CARD_VEHICLE_PHOTOS };
export type { JobCardFormCustomer };
export type { AutoshopPageDetailsServiceDeal };

export type SaveJobCardInput = {
  jobCardId?: string;
  /** Numeric job card number used by PUT/DELETE path params. */
  jobCardNo?: string | number;
  customerType?: "registered" | "onboarded";
  bankId?: string;
  terms?: string;
  sendForApproval?: boolean;
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
    additionalNotes?: string;
  };
  vehiclePhotoFiles: File[];
  existingVehiclePhotoUrls?: string[];
};

type ServiceCategory = {
  id: string;
  name?: string;
  odoOutRequired?: boolean;
  subServices: Array<{ name: string; desc?: string; price?: number; odoOutRequired?: boolean }>;
};

function parseNumber(v: unknown): number {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function subRequiresOdoOut(cat: ServiceCategory | undefined, subName: string): boolean {
  if (!cat) return false;
  if (cat.odoOutRequired) return true;
  const sub = cat.subServices.find((s) => s.name === subName);
  return Boolean(sub?.odoOutRequired);
}

function legacyBlocksToAutoshopServices(
  blocks: unknown[],
  categories: ServiceCategory[],
): AutoshopJobCardServiceInput[] {
  const out: AutoshopJobCardServiceInput[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const b = block as { service?: string; subServices?: Array<Record<string, unknown>> };
    const serviceId = String(b.service ?? "").trim();
    if (!serviceId) continue;
    const cat = categories.find((c) => c.id === serviceId);
    const category = cat?.name ?? "Service";
    for (const ss of b.subServices ?? []) {
      const subName = String(ss.name ?? "").trim();
      const desc = String(ss.desc ?? subName).trim();
      const qty = parseNumber(ss.qty ?? ss.unit ?? 1) || 1;
      const unitCost = parseNumber(ss.unitPrice ?? ss.price) || parseNumber(cat?.subServices[0]?.price);
      const odoOutReading = parseNumber(ss.dueOdometerReading ?? ss.odoOut ?? ss.odoOutReading);
      const item: AutoshopJobCardServiceInput = {
        serviceId,
        category,
        desc,
        unitCost,
        qty,
      };
      if (subName) item.subServiceName = subName;
      if (subRequiresOdoOut(cat, subName) || odoOutReading > 0) {
        item.odoOutReading = odoOutReading;
      }
      const discountPercentage = parseNumber(ss.discountPercentage);
      const dealId = String(ss.dealId ?? "").trim();
      if (dealId && discountPercentage > 0) {
        const amountBeforeDiscount =
          parseNumber(ss.amountBeforeDiscount) || unitCost * qty;
        item.discountPercentage = discountPercentage;
        item.amountBeforeDiscount = amountBeforeDiscount;
        item.dealId = dealId;
      }
      out.push(item);
    }
  }
  return out;
}

function flatServicesToAutoshopServices(services: unknown[]): AutoshopJobCardServiceInput[] {
  const out: AutoshopJobCardServiceInput[] = [];
  for (const raw of services) {
    if (!raw || typeof raw !== "object") continue;
    const s = raw as Record<string, unknown>;
    const serviceId = String(s.service ?? s.serviceId ?? "").trim();
    if (!serviceId) continue;
    const qty = parseNumber(s.qty ?? 1) || 1;
    const unitCost = parseNumber(s.unitCost) || 0;
    const item: AutoshopJobCardServiceInput = {
      serviceId,
      category: String(s.category ?? "Service"),
      desc: String(s.desc ?? "").trim() || undefined,
      unitCost,
      qty,
    };
    const subServiceName = String(s.subServiceName ?? s.name ?? "").trim();
    if (subServiceName) item.subServiceName = subServiceName;
    const odo = parseNumber(s.odoOutReading);
    if (odo > 0) item.odoOutReading = odo;
    const discountPercentage = parseNumber(s.discountPercentage);
    const dealId = String(s.dealId ?? "").trim();
    if (dealId && discountPercentage > 0) {
      const amountBeforeDiscount =
        parseNumber(s.amountBeforeDiscount) || unitCost * qty;
      item.discountPercentage = discountPercentage;
      item.amountBeforeDiscount = amountBeforeDiscount;
      item.dealId = dealId;
    }
    out.push(item);
  }
  return out;
}

function buildCreateBody(
  input: SaveJobCardInput,
  categories: ServiceCategory[],
): CreateAutoshopJobCardInput {
  const { form } = input;
  const servicesFromBlocks = legacyBlocksToAutoshopServices(
    Array.isArray(form.services) ? form.services : [],
    categories,
  );
  const services =
    servicesFromBlocks.length > 0
      ? servicesFromBlocks
      : flatServicesToAutoshopServices(Array.isArray(form.services) ? form.services : []);

  const customerType = input.customerType ?? "registered";
  const body: CreateAutoshopJobCardInput = {
    customerType,
    vehicleId: form.vehicleId,
    odoIn: parseNumber(form.odometerReading),
    services,
    labourCharge: parseNumber(form.labourCharge),
    terms: input.terms ?? form.additionalNotes?.trim() ?? undefined,
    sendForApproval: input.sendForApproval ?? true,
  };

  if (input.bankId) body.bankId = input.bankId;
  if (customerType === "onboarded") {
    body.onboardedCustomerId = form.customerId;
  } else {
    body.customerId = form.customerId;
  }

  return body;
}

export async function fetchJobCardFormData(token: string) {
  const res = await fetchAutoshopJobCardPageDetails(token);
  if (!res.ok) throw new Error("Could not load job card form data.");
  const parsed = parseAutoshopJobCardPageDetails(res.data);
  if (!parsed) throw new Error("Could not load job card form data.");
  return {
    myCustomers: parsed.myCustomers.filter((c) => c._id),
    myServices: pageDetailsSubServicesToCategories(parsed.myAllSubServices),
    myBanks: parsed.myAllBanks,
    serviceDeals: parsed.serviceDeals,
    nextJobCardNo: parsed.nextJobCardNo,
    nextJobCardNumber: parsed.nextJobCardNumber,
    nextJobCard: parsed.nextJobCard,
  };
}

async function findJobCardListRow(
  token: string,
  jobCardId: string,
  jobCardNoHint?: string | number | null,
) {
  const searchHint =
    jobCardNoHint != null && String(jobCardNoHint).trim() !== ""
      ? String(jobCardNoHint).trim()
      : pickJobCardNoForApi({ jobNo: jobCardId });

  const listSources = [
    ...(searchHint ? [fetchAutoshopJobCards(token, { search: searchHint })] : []),
    fetchAutoshopJobCards(token),
    fetchAutoshopPendingApprovalJobCards(token),
    fetchAutoshopJobCards(token, { status: "convertedToInvoice" }),
    fetchAutoshopJobCards(token, { status: "CashPaid" }),
  ];

  for (const promise of listSources) {
    const res = await promise;
    if (!res.ok) continue;
    const rows = parseJobCardsFromPagePayload(res.data);
    const row =
      rows.find((item) => item.id === jobCardId) ??
      (searchHint
        ? rows.find((item) => pickJobCardNoForApi(item) === pickJobCardNoForApi({ jobNo: searchHint }))
        : undefined);
    if (row) return row;
  }
  return null;
}

/**
 * There is no GET-by-id for a single job card.
 * Detail/edit must use list/search payload rows (or an already-held list row).
 */
export async function fetchJobCardByIdForForm(
  token: string,
  jobCardId: string,
  jobCardNoHint?: string | number | null,
) {
  const row = await findJobCardListRow(token, jobCardId, jobCardNoHint);
  if (!row?.raw || typeof row.raw !== "object") {
    throw new Error("Could not load job card.");
  }
  return { success: true, data: row.raw };
}

export function isJobCardPreviewPayload(raw: unknown): raw is Record<string, unknown> {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  return (
    Array.isArray(o.services) ||
    o.totalAmount != null ||
    o.customerName != null ||
    o.labourCharge != null ||
    o.jobCardNo != null ||
    o._id != null ||
    o.id != null
  );
}

export function jobCardRecordFromListRow(
  listRow: { raw?: unknown } | null | undefined,
  jobCardId: string,
): Record<string, unknown> | null {
  const raw = listRow?.raw;
  if (!raw || typeof raw !== "object") return null;
  const record = { ...(raw as Record<string, unknown>) };
  if (!record._id && !record.id) record._id = jobCardId;
  return record;
}

/** Load a job card record from list/search only — no GET `/jobcards/:id`. */
export async function fetchJobCardRecord(
  token: string,
  jobCardId: string,
  options?: { jobCardNo?: string | number | null },
) {
  const row = await findJobCardListRow(token, jobCardId, options?.jobCardNo);
  if (!row?.raw || typeof row.raw !== "object") {
    throw new Error("Could not load job card.");
  }
  const record = { ...(row.raw as Record<string, unknown>) };
  if (!record._id && !record.id) record._id = jobCardId;
  return { record, envelope: { success: true, data: [row.raw] } };
}

export function resolveJobCardFromApiResponse(resp: unknown): Record<string, unknown> | null {
  if (!resp || typeof resp !== "object") return null;
  const root = resp as Record<string, unknown>;
  const nested = root.data;
  if (nested && typeof nested === "object") {
    const data = nested as Record<string, unknown>;
    if (Array.isArray(data)) {
      const first = data[0];
      return first && typeof first === "object" ? (first as Record<string, unknown>) : null;
    }
    const job = data.jobCard ?? data.card ?? data;
    if (job && typeof job === "object") return job as Record<string, unknown>;
  }
  const job = root.jobCard ?? root.card ?? root;
  return job && typeof job === "object" ? (job as Record<string, unknown>) : null;
}

export function normalizeJobCardServiceBlocks(job: Record<string, unknown>): unknown[] {
  const services = job.services;
  if (!Array.isArray(services)) return [];

  const first = services[0];
  if (!first || typeof first !== "object") return [];

  // Legacy nested shape: { service, subServices: [...] }
  if (Array.isArray((first as { subServices?: unknown }).subServices)) {
    return services;
  }

  // Flat API shape: { service, category, desc, unitCost, qty, amount, odoOutReading }
  const byService = new Map<string, Array<Record<string, unknown>>>();
  for (const raw of services) {
    if (!raw || typeof raw !== "object") continue;
    const s = raw as Record<string, unknown>;
    const serviceId = String(s.service ?? s.serviceId ?? "").trim();
    if (!serviceId) continue;
    const bucket = byService.get(serviceId) ?? [];
    const subName = String(s.subServiceName ?? s.name ?? "").trim();
    const desc = String(s.desc ?? "").trim();
    bucket.push({
      name: subName || desc,
      desc,
      qty: s.qty ?? 1,
      unitPrice: s.unitCost ?? s.unitPrice ?? s.amount,
      price: s.amount ?? s.unitCost,
      labourCost: s.labourCost ?? s.labourCharge,
      labourCharge: s.labourCharge ?? s.labourCost,
      dueOdometerReading: s.odoOutReading ?? s.dueOdometerReading ?? s.odoOut,
      odoOut: s.odoOutReading ?? s.odoOut,
      odoOutReading: s.odoOutReading,
      discountPercentage: s.discountPercentage,
      amountBeforeDiscount: s.amountBeforeDiscount,
      dealId: s.dealId,
    });
    byService.set(serviceId, bucket);
  }
  return [...byService.entries()].map(([service, subServices]) => ({ service, subServices }));
}

export async function saveJobCard(
  token: string,
  input: SaveJobCardInput,
  categories: ServiceCategory[] = [],
) {
  const jobCardNo =
    input.jobCardNo != null && String(input.jobCardNo).trim() !== ""
      ? pickJobCardNoForApi({ jobNo: String(input.jobCardNo) })
      : null;

  if (input.jobCardId || jobCardNo) {
    if (!jobCardNo) {
      throw new Error("Missing job card number for update.");
    }
    const res = await updateAutoshopJobCard(token, jobCardNo, {
      labourCharge: parseNumber(input.form.labourCharge),
      terms: input.terms ?? input.form.additionalNotes?.trim(),
      odoIn: parseNumber(input.form.odometerReading),
      bankId: input.bankId,
      services: buildCreateBody(input, categories).services,
    });
    if (!res.ok) {
      throw new Error(apiMessageFromEnvelope(res.data) || "Error saving job card");
    }
    return res;
  }

  const res = await createAutoshopJobCard(token, buildCreateBody(input, categories));
  if (!res.ok) {
    throw new Error(apiMessageFromEnvelope(res.data) || "Error saving job card");
  }
  return res;
}