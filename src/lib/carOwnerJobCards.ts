import { getJson } from "../api/mobileAuth";
import { digitsOnly, formatNationalPhoneDisplay } from "./carOwnerProfile";
import type { CarOwnerJobCard } from "../types/carOwnerJobCards";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function businessName(business: CarOwnerJobCard["business"]): string {
  if (!business || typeof business === "string") return "Auto shop";
  return business.businessName?.trim() || "Auto shop";
}

export function businessPhoneRaw(business: CarOwnerJobCard["business"]): string {
  if (!business || typeof business === "string") return "";
  return business.businessPhone?.trim() || business.phone?.trim() || "";
}

export function formatBusinessPhone(business: CarOwnerJobCard["business"]): string {
  const raw = businessPhoneRaw(business);
  if (!raw) return "";
  return formatNationalPhoneDisplay(digitsOnly(raw));
}

function jobCardServiceName(service: NonNullable<CarOwnerJobCard["services"]>[number]["service"]): string {
  if (typeof service === "string") return service.trim();
  const name = service?.name;
  return typeof name === "string" ? name.trim() : "";
}

export function resolveJobCardNo(jc: CarOwnerJobCard | Record<string, unknown>): string {
  const o = jc as Record<string, unknown>;
  return (
    asString(o.jobNo) ||
    asString(o.jobCardNo) ||
    asString(o.jobCardNumber) ||
    asString(o.jobNumber) ||
    ""
  );
}

export function resolveJobCardTotal(jc: CarOwnerJobCard | Record<string, unknown>): number {
  const o = jc as Record<string, unknown>;
  return (
    asFiniteNumber(o.totalPayableAmount) ??
    asFiniteNumber(o.totalAmount) ??
    asFiniteNumber(o.total) ??
    asFiniteNumber(o.grandTotal) ??
    asFiniteNumber(o.amount) ??
    0
  );
}

export function resolveInvoiceNo(jc: CarOwnerJobCard | Record<string, unknown>): string {
  const o = jc as Record<string, unknown>;
  return (
    asString(o.invoiceId) ||
    asString(o.invoiceNumber) ||
    asString(o.invoiceNo) ||
    asString(o.invoice_number) ||
    ""
  );
}

export function serviceTypeLabel(jc: CarOwnerJobCard): string {
  const fromServices = jc.services
    ?.map((s) => {
      const name = jobCardServiceName(s.service);
      if (name) return name;
      const line = s as { category?: string; desc?: string };
      return line.category?.trim() || line.desc?.trim() || "";
    })
    .filter((name): name is string => Boolean(name));
  if (fromServices?.length) {
    return [...new Set(fromServices)].join(", ");
  }
  const direct = jc.serviceType?.trim();
  if (direct) return direct;
  return resolveJobCardNo(jc) || "—";
}

export function jobChipLabel(jc: CarOwnerJobCard): string {
  const jobNo = resolveJobCardNo(jc);
  if (!jobNo) return "Job";
  return jobNo.toLowerCase().startsWith("job") ? jobNo : `Job # ${jobNo}`;
}

export function jobCardLicensePlate(jc: CarOwnerJobCard): string {
  const fromVehicle = jc.vehicleId?.licensePlateNo?.trim();
  if (fromVehicle) return fromVehicle.toUpperCase();
  const top = jc.licensePlateNo?.trim();
  if (top) return top.toUpperCase();
  return "—";
}

export function formatJobCardDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isPaidJobCard(jc: CarOwnerJobCard): boolean {
  if (jc.invoicePaid === true) return true;
  const payment = (jc.paymentStatus ?? "").trim().toLowerCase();
  if (payment === "paid") return true;
  const status = (jc.status ?? "").trim().toLowerCase().replace(/\s+/g, "");
  return status === "cashpaid";
}

/** True when the customer has accepted / approved the job card estimate. */
export function isCarOwnerJobCardAccepted(jc: CarOwnerJobCard): boolean {
  if (jc.approvedByCustomer === true) return true;
  const norm = (jc.status ?? "").trim().toLowerCase().replace(/\s+/g, "");
  return norm === "approved" || norm === "accepted" || norm === "convertedtoinvoice" || norm === "cashpaid";
}

/** True when the job card is still awaiting customer action. */
export function isCarOwnerJobCardPendingApproval(jc: CarOwnerJobCard): boolean {
  if (isCarOwnerJobCardAccepted(jc)) return false;
  const norm = (jc.status ?? "").trim().toLowerCase().replace(/\s+/g, "");
  if (norm === "rejected" || norm === "autorejected" || norm.includes("cancel")) return false;
  return norm === "pending" || !norm;
}

/** Display label — API keeps status "pending" after approval; prefer approvedByCustomer. */
export function carOwnerJobCardStatusLabel(jc: CarOwnerJobCard): string {
  const norm = (jc.status ?? "").trim().toLowerCase().replace(/\s+/g, "");
  if (norm === "convertedtoinvoice") {
    return isPaidJobCard(jc) ? "Invoice · Paid" : "Converted to Invoice";
  }
  if (norm === "cashpaid") return "Cash Paid";
  if (jc.approvedByCustomer === true || norm === "approved" || norm === "accepted") {
    return "Approved";
  }
  if (norm === "autorejected") return "Auto Rejected";
  if (norm === "rejected") return "Rejected";
  if (norm === "pending") return "Pending";
  const raw = (jc.status ?? "").trim();
  return raw || "—";
}

export function resolveJobCardsBuckets(payload: Record<string, unknown> | undefined) {
  if (!payload || typeof payload !== "object") return undefined;

  const hasBuckets = (obj: Record<string, unknown>) =>
    "pending" in obj || "approved" in obj || "rejected" in obj || "autoRejected" in obj;

  if (hasBuckets(payload)) return payload;

  const data = payload.data;
  if (data && typeof data === "object" && hasBuckets(data as Record<string, unknown>)) {
    return data as Record<string, unknown>;
  }

  return undefined;
}

/** Map mixed API field names onto the shape the owner UI expects. */
export function canonicalizeCarOwnerJobCard(raw: unknown): CarOwnerJobCard | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const id = asString(obj._id ?? obj.id);
  if (!id) return null;

  const jobNo = resolveJobCardNo(obj);
  const total = resolveJobCardTotal(obj);
  const invoiceNo = resolveInvoiceNo(obj);
  const invoicePaid = obj.invoicePaid === true;
  const status = asString(obj.status) || "Pending";
  const paymentFromApi = asString(obj.paymentStatus);
  const paymentStatus =
    paymentFromApi ||
    (invoicePaid || status.toLowerCase().replace(/\s+/g, "") === "cashpaid" ? "Paid" : "Unpaid");

  const vehicleRaw = obj.vehicleId ?? obj.vehicle;
  const vehicle =
    vehicleRaw && typeof vehicleRaw === "object" && !Array.isArray(vehicleRaw)
      ? (vehicleRaw as CarOwnerJobCard["vehicleId"])
      : null;

  return {
    ...(obj as unknown as CarOwnerJobCard),
    _id: id,
    jobNo,
    jobCardNo: (obj.jobCardNo as CarOwnerJobCard["jobCardNo"]) ?? (jobNo || undefined),
    totalPayableAmount: total,
    totalAmount: asFiniteNumber(obj.totalAmount) ?? total,
    invoiceId: invoiceNo || null,
    invoiceNumber: invoiceNo || undefined,
    invoicePaid,
    paymentStatus,
    status,
    approvedByCustomer: obj.approvedByCustomer === true,
    licensePlateNo: asString(obj.licensePlateNo) || vehicle?.licensePlateNo || undefined,
    vehicleId: vehicle,
    createdAt: asString(obj.createdAt ?? obj.date) || asString(obj.updatedAt),
    updatedAt: asString(obj.updatedAt) || asString(obj.createdAt ?? obj.date),
    date: asString(obj.date) || undefined,
    labourCharge: asFiniteNumber(obj.labourCharge) ?? undefined,
  };
}

export function normalizeJobCardsPayload(payload: Record<string, unknown> | undefined): CarOwnerJobCard[] {
  if (!payload) return [];

  const mapBucket = (list: unknown[], defaults: Partial<CarOwnerJobCard>): CarOwnerJobCard[] => {
    const out: CarOwnerJobCard[] = [];
    for (const item of list) {
      const next = canonicalizeCarOwnerJobCard(item);
      if (!next) continue;
      out.push({
        ...next,
        ...defaults,
        status: defaults.status
          ? next.status?.trim()
            ? next.status
            : String(defaults.status)
          : next.status,
        approvedByCustomer:
          defaults.approvedByCustomer !== undefined
            ? defaults.approvedByCustomer
            : next.approvedByCustomer,
      });
    }
    return out;
  };

  const pending = mapBucket(Array.isArray(payload.pending) ? payload.pending : [], {
    status: "Pending",
    approvedByCustomer: false,
  });
  const approved = mapBucket(Array.isArray(payload.approved) ? payload.approved : [], {
    approvedByCustomer: true,
  });
  const rejected = mapBucket(Array.isArray(payload.rejected) ? payload.rejected : [], {});
  const autoRejected = mapBucket(Array.isArray(payload.autoRejected) ? payload.autoRejected : [], {
    status: "AutoRejected",
  });

  return [...pending, ...approved, ...rejected, ...autoRejected];
}

/** GET /api/user/job-cards/:id — full job card for invoice / job card viewer. */
export function fetchCarOwnerJobCardById(token: string, jobCardId: string) {
  const id = jobCardId.trim();
  if (!id) {
    return Promise.resolve({ ok: false, status: 400, data: null });
  }
  return getJson<unknown>(`/api/user/job-cards/${encodeURIComponent(id)}`, token);
}

/** Unwrap list/detail API envelopes into a canonical job card for the document viewer. */
export function resolveCarOwnerJobCardForViewer(payload: unknown): CarOwnerJobCard | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;

  const direct = canonicalizeCarOwnerJobCard(root);
  if (direct) return direct;

  const data = asRecord(root.data);
  if (data) {
    const nestedCard = asRecord(data.jobCard) ?? asRecord(data.card) ?? data;
    return canonicalizeCarOwnerJobCard(nestedCard);
  }

  return null;
}
