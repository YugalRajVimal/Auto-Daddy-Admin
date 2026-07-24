import { getJson, postJson } from "@/lib/api";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import type {
  CarOwnerCustomerRequest,
  CarOwnerCustomerRequestPendingEdit,
  CarOwnerCustomerRequestsResponse,
  CarOwnerJobCardApprovalsResponse,
} from "@/types/car-owner-approvals";

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

function customerRequestActionPath(
  businessId: string,
  action: "approve" | "reject",
  customerId: string
) {
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

export function fetchCarOwnerCustomerRequests(authToken: string) {
  return getJson<CarOwnerCustomerRequestsResponse>(CUSTOMER_REQUESTS_BASE, { authToken });
}

export function approveCarOwnerCustomerRequest(
  authToken: string,
  businessId: string,
  customerId: string
) {
  return postJson<CarOwnerCustomerRequestsResponse>(
    customerRequestActionPath(businessId, "approve", customerId),
    {},
    { authToken }
  );
}

export function rejectCarOwnerCustomerRequest(
  authToken: string,
  businessId: string,
  customerId: string
) {
  return postJson<CarOwnerCustomerRequestsResponse>(
    customerRequestActionPath(businessId, "reject", customerId),
    {},
    { authToken }
  );
}

export function approveCarOwnerJobCard(authToken: string, jobCardId: string) {
  return postJson<CarOwnerJobCardApprovalsResponse>(
    `${JOBCARDS_BASE}/${encodeURIComponent(jobCardId)}/approve`,
    {},
    { authToken }
  );
}

export function rejectCarOwnerJobCard(authToken: string, jobCardId: string) {
  return postJson<CarOwnerJobCardApprovalsResponse>(
    `${JOBCARDS_BASE}/${encodeURIComponent(jobCardId)}/reject`,
    {},
    { authToken }
  );
}
