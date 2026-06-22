import { digitsOnly, formatNationalPhoneDisplay } from "./carOwnerProfile";
import type { CarOwnerJobCard } from "../types/carOwnerJobCards";

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

export function serviceTypeLabel(jc: CarOwnerJobCard): string {
  const fromServices = jc.services
    ?.map((s) => jobCardServiceName(s.service))
    .filter((name): name is string => Boolean(name));
  if (fromServices?.length) return fromServices.join(", ");
  const direct = jc.serviceType?.trim();
  if (direct) return direct;
  return jc.jobNo?.trim() || "—";
}

export function jobChipLabel(jc: CarOwnerJobCard): string {
  const jobNo = jc.jobNo?.trim();
  if (!jobNo) return "Job";
  return jobNo.toLowerCase().startsWith("job") ? jobNo : `Job # ${jobNo}`;
}

export function formatJobCardDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

export function normalizeJobCardsPayload(payload: Record<string, unknown> | undefined): CarOwnerJobCard[] {
  if (!payload) return [];
  const pending = (Array.isArray(payload.pending) ? payload.pending : []).map((jc) => ({
    ...(jc as CarOwnerJobCard),
    status: (jc as CarOwnerJobCard).status?.trim() ? (jc as CarOwnerJobCard).status : "Pending",
  }));
  const approved = Array.isArray(payload.approved) ? (payload.approved as CarOwnerJobCard[]) : [];
  const rejected = Array.isArray(payload.rejected) ? (payload.rejected as CarOwnerJobCard[]) : [];
  const autoRejected = (Array.isArray(payload.autoRejected) ? payload.autoRejected : []).map((jc) => ({
    ...(jc as CarOwnerJobCard),
    status: (jc as CarOwnerJobCard).status?.trim() ? (jc as CarOwnerJobCard).status : "AutoRejected",
  }));
  return [...pending, ...approved, ...rejected, ...autoRejected];
}
