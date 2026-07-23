import { getJson, postJson } from "../api/mobileAuth";
import { canonicalizeCarOwnerJobCard, normalizeJobCardsPayload, resolveJobCardsBuckets } from "./carOwnerJobCards";
import { normalizeMediaUrl } from "./normalizeMediaUrl";
import type {
  CarOwnerCustomerRequest,
  CarOwnerCustomerRequestPendingEdit,
  CarOwnerCustomerRequestsResponse,
  CarOwnerJobCardApprovalsResponse,
} from "../types/carOwnerApprovals";
import type { CarOwnerJobCard } from "../types/carOwnerJobCards";

const CUSTOMER_REQUESTS_BASE = "/api/carowner/approvals/customer-requests";
const JOBCARDS_BASE = "/api/carowner/approvals/jobcards";

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

/** Decode JWT payload (unsigned) — auth token carries `{ id, role }`. */
export function userIdFromAuthToken(token: string): string {
  try {
    const part = token.split(".")[1];
    if (!part) return "";
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
    return asString(payload.id ?? payload._id ?? payload.userId);
  } catch {
    return "";
  }
}

function customerRequestActionPath(businessId: string, action: "approve" | "reject", customerId: string) {
  const qs = `?customerId=${encodeURIComponent(customerId)}`;
  return `${CUSTOMER_REQUESTS_BASE}/${encodeURIComponent(businessId)}/${action}${qs}`;
}

function pickPendingEdit(raw: unknown): CarOwnerCustomerRequestPendingEdit | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  return {
    name: asString(obj.name) || undefined,
    email: asString(obj.email) || undefined,
    city: asString(obj.city) || undefined,
  };
}

export function normalizeCarOwnerCustomerRequest(raw: unknown): CarOwnerCustomerRequest | null {
  const obj = asRecord(raw);
  if (!obj) return null;

  const businessId = asString(obj.businessId ?? obj._id ?? obj.id);
  if (!businessId) return null;

  const logoRaw = asString(obj.businessLogo ?? obj.logo ?? obj.logoUrl);
  return {
    businessId,
    businessName: asString(obj.businessName ?? obj.name ?? obj.shopName) || "Auto Shop",
    businessLogo: logoRaw ? normalizeMediaUrl(logoRaw) : null,
    city: asString(obj.city),
    addedAt: asString(obj.addedAt ?? obj.createdAt),
    pendingEdit: pickPendingEdit(obj.pendingEdit),
  };
}

export function normalizeCarOwnerCustomerRequestsPayload(payload: unknown): CarOwnerCustomerRequest[] {
  const root = asRecord(payload);
  const listCandidate =
    (root && Array.isArray(root.data) ? root.data : null) ??
    (root && Array.isArray(root.requests) ? root.requests : null) ??
    (Array.isArray(payload) ? payload : null);

  if (!listCandidate) return [];

  const out: CarOwnerCustomerRequest[] = [];
  const seen = new Set<string>();
  for (const item of listCandidate) {
    const next = normalizeCarOwnerCustomerRequest(item);
    if (!next || seen.has(next.businessId)) continue;
    seen.add(next.businessId);
    out.push(next);
  }
  return out;
}

export function formatCustomerRequestDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function fetchCarOwnerCustomerRequests(token: string) {
  return getJson<CarOwnerCustomerRequestsResponse>(CUSTOMER_REQUESTS_BASE, token);
}

export function approveCarOwnerCustomerRequest(token: string, businessId: string, customerId: string) {
  return postJson<CarOwnerCustomerRequestsResponse>(
    customerRequestActionPath(businessId, "approve", customerId),
    {},
    token,
  );
}

export function rejectCarOwnerCustomerRequest(token: string, businessId: string, customerId: string) {
  return postJson<CarOwnerCustomerRequestsResponse>(
    customerRequestActionPath(businessId, "reject", customerId),
    {},
    token,
  );
}

function asJobCard(raw: unknown): CarOwnerJobCard | null {
  return canonicalizeCarOwnerJobCard(raw);
}

export function normalizeCarOwnerJobCardApprovalsPayload(payload: unknown): CarOwnerJobCard[] {
  const root = asRecord(payload);
  if (!root) return [];

  const buckets = resolveJobCardsBuckets(root);
  if (buckets) {
    return normalizeJobCardsPayload(buckets).map((jc) => asJobCard(jc) ?? jc);
  }

  const dataObj = asRecord(root.data);
  const listCandidate =
    (Array.isArray(root.data) ? root.data : null) ??
    (Array.isArray(root.jobCards) ? root.jobCards : null) ??
    (Array.isArray(root.jobcards) ? root.jobcards : null) ??
    (dataObj && Array.isArray(dataObj.jobCards) ? dataObj.jobCards : null) ??
    (dataObj && Array.isArray(dataObj.jobcards) ? dataObj.jobcards : null);

  if (!listCandidate) return [];

  const out: CarOwnerJobCard[] = [];
  const seen = new Set<string>();
  for (const item of listCandidate) {
    const next = asJobCard(item);
    if (!next || seen.has(next._id)) continue;
    seen.add(next._id);
    out.push(next);
  }
  return out;
}

export function fetchCarOwnerJobCardApprovals(token: string) {
  return getJson<CarOwnerJobCardApprovalsResponse>(JOBCARDS_BASE, token);
}

export function approveCarOwnerJobCard(token: string, jobCardId: string) {
  return postJson<CarOwnerJobCardApprovalsResponse>(
    `${JOBCARDS_BASE}/${encodeURIComponent(jobCardId)}/approve`,
    {},
    token,
  );
}

export function rejectCarOwnerJobCard(token: string, jobCardId: string) {
  return postJson<CarOwnerJobCardApprovalsResponse>(
    `${JOBCARDS_BASE}/${encodeURIComponent(jobCardId)}/reject`,
    {},
    token,
  );
}
