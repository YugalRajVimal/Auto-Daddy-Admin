import type { CarOwnerJobCard } from "@/types/car-owner-job-cards";
import { getJson } from "@/lib/api";

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
  return (
    norm === "approved" ||
    norm === "accepted" ||
    norm === "convertedtoinvoice" ||
    norm === "cashpaid"
  );
}

/** True when the job card is still awaiting customer action. */
export function isCarOwnerJobCardPendingApproval(jc: CarOwnerJobCard): boolean {
  if (isCarOwnerJobCardAccepted(jc)) return false;
  const norm = (jc.status ?? "").trim().toLowerCase().replace(/\s+/g, "");
  if (norm === "rejected" || norm === "autorejected" || norm.includes("cancel")) return false;
  return norm === "pending" || !norm;
}

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

export function businessName(business: CarOwnerJobCard["business"]): string {
  if (!business || typeof business === "string") return "Auto shop";
  return business.businessName?.trim() || "Auto shop";
}

export function jobCardLicensePlate(jc: CarOwnerJobCard): string {
  const fromVehicle = jc.vehicleId?.licensePlateNo?.trim();
  if (fromVehicle) return fromVehicle.toUpperCase();
  const top = jc.licensePlateNo?.trim();
  if (top) return top.toUpperCase();
  return "—";
}

function jobCardServiceName(
  service: NonNullable<CarOwnerJobCard["services"]>[number]["service"]
): string {
  if (typeof service === "string") return service.trim();
  const name = service?.name;
  return typeof name === "string" ? name.trim() : "";
}

export function serviceTypeLabel(jc: CarOwnerJobCard): string {
  const fromServices = jc.services
    ?.map((s) => {
      const name = jobCardServiceName(s.service);
      if (name) return name;
      return "";
    })
    .filter((name): name is string => Boolean(name));
  if (fromServices?.length) {
    return [...new Set(fromServices)].join(", ");
  }
  const direct = jc.serviceType?.trim();
  if (direct) return direct;
  return resolveJobCardNo(jc) || "—";
}

export function fetchCarOwnerJobCardById(authToken: string, jobCardId: string) {
  return getJson<unknown>(`/api/user/job-cards/${encodeURIComponent(jobCardId)}`, {
    authToken,
  });
}

export function resolveCarOwnerJobCardForViewer(
  payload: unknown,
  fallback: CarOwnerJobCard | null
): CarOwnerJobCard | null {
  const root = asRecord(payload);
  if (!root) return fallback;

  const candidate =
    asRecord(root.data) ??
    asRecord(root.jobCard) ??
    asRecord(root.jobcard) ??
    (root._id ? root : null);

  if (!candidate) return fallback;
  const id = asString(candidate._id ?? candidate.id);
  if (!id) return fallback;

  return {
    ...(fallback ?? ({} as CarOwnerJobCard)),
    ...(candidate as unknown as CarOwnerJobCard),
    _id: id,
  };
}
