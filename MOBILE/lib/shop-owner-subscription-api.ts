import {
  getJsonAutoshopowner,
  patchJsonAutoshopowner,
  postJsonAutoshopowner,
} from "@/lib/autoshopowner-http";
import type { ApiEnvelope } from "@/lib/autoshopowner-api";
import type {
  SubscriptionCheckoutBody,
  SubscriptionCheckoutResponse,
  SubscriptionCheckoutSession,
  SubscriptionInvoiceStatusResponse,
  SubscriptionOfflinePurchaseBody,
  SubscriptionOfflinePurchaseResponse,
  SubscriptionPlanId,
} from "@/types/website-subscription-autoshop";

const BASE = "/api/autoshopowner/subscription";

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  title: string;
  amount: number;
  days: number;
  hst: number;
  description?: string;
  features?: { label: string; note: string }[];
  invoiceRows?: { service: string; description: string; amount: number }[];
};

export type SubscriptionStatus = {
  active: boolean;
  planId: SubscriptionPlanId | null;
  planLabel: string;
  daysLeft: number | null;
  paymentStatus: string;
  invoiceNo: string;
  expiresAt: string;
};

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

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asPlanId(value: unknown): SubscriptionPlanId | null {
  const id = asString(value).toLowerCase();
  if (id === "yearly" || id === "year" || id === "annual") return "yearly";
  if (id === "biweekly" || id === "bi-weekly" || id === "fortnightly") return "biweekly";
  return null;
}

function extractList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = asRecord(payload);
  if (!root) return [];
  const nested = asRecord(root.data);
  for (const key of ["plans", "data", "items", "rows", "list", "results", "history"]) {
    if (Array.isArray(root[key])) return root[key] as unknown[];
    if (nested && Array.isArray(nested[key])) return nested[key] as unknown[];
  }
  if (Array.isArray(root.data)) return root.data;
  return [];
}

function normalizeFeature(raw: unknown): { label: string; note: string } | null {
  if (typeof raw === "string") {
    const label = raw.trim();
    return label ? { label, note: "" } : null;
  }
  const o = asRecord(raw);
  if (!o) return null;
  const label = asString(o.label ?? o.name ?? o.title ?? o.feature);
  if (!label) return null;
  return {
    label,
    note: asString(o.note ?? o.description ?? o.desc ?? o.detail),
  };
}

function normalizeInvoiceRow(
  raw: unknown,
): { service: string; description: string; amount: number } | null {
  const o = asRecord(raw);
  if (!o) return null;
  const service = asString(o.service ?? o.name ?? o.title);
  const amount = asNumber(o.amount ?? o.price ?? o.total) ?? 0;
  if (!service && amount <= 0) return null;
  return {
    service: service || "Service",
    description: asString(o.description ?? o.desc ?? o.note),
    amount,
  };
}

function normalizePlan(raw: unknown): SubscriptionPlan | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = asPlanId(o.planId ?? o.id ?? o.slug ?? o.code ?? o.name);
  if (!id) return null;

  const amount =
    asNumber(o.amount ?? o.price ?? o.total ?? o.baseAmount) ??
    (id === "yearly" ? 365 : 390);
  const days =
    asNumber(o.days ?? o.durationDays ?? o.periodDays ?? o.validityDays) ??
    (id === "yearly" ? 365 : 14);
  const hst =
    asNumber(o.hst ?? o.hstAmount ?? o.tax ?? o.taxAmount) ??
    (id === "yearly" ? 49 : 51);

  const title =
    asString(o.title ?? o.name ?? o.label) ||
    (id === "yearly" ? `$ ${amount} Yearly plan` : `$ 15 Bi-weekly plan`);

  const featuresRaw = o.features ?? o.benefits ?? o.items;
  const features = Array.isArray(featuresRaw)
    ? (featuresRaw.map(normalizeFeature).filter(Boolean) as { label: string; note: string }[])
    : undefined;

  const rowsRaw = o.invoiceRows ?? o.lineItems ?? o.services;
  const invoiceRows = Array.isArray(rowsRaw)
    ? (rowsRaw
        .map(normalizeInvoiceRow)
        .filter(Boolean) as { service: string; description: string; amount: number }[])
    : undefined;

  return {
    id,
    title,
    amount,
    days,
    hst,
    description: asString(o.description ?? o.desc) || undefined,
    features: features?.length ? features : undefined,
    invoiceRows: invoiceRows?.length ? invoiceRows : undefined,
  };
}

/** GET /api/autoshopowner/subscription/plans */
export function fetchSubscriptionPlans(token: string) {
  return getJsonAutoshopowner<unknown>(`${BASE}/plans`, token);
}

export function parseSubscriptionPlans(payload: unknown): SubscriptionPlan[] {
  const out: SubscriptionPlan[] = [];
  const seen = new Set<SubscriptionPlanId>();
  for (const item of extractList(payload)) {
    const plan = normalizePlan(item);
    if (!plan || seen.has(plan.id)) continue;
    seen.add(plan.id);
    out.push(plan);
  }
  return out;
}

/** GET /api/autoshopowner/subscription/status */
export function fetchSubscriptionStatus(token: string) {
  return getJsonAutoshopowner<unknown>(`${BASE}/status`, token);
}

export function parseSubscriptionStatus(payload: unknown): SubscriptionStatus | null {
  const root = asRecord(payload);
  if (!root) return null;
  const data = asRecord(root.data) ?? root;

  const planId = asPlanId(
    data.planId ?? data.plan ?? data.currentPlanId ?? data.subscriptionPlan,
  );
  const paymentStatus = asString(
    data.paymentStatus ?? data.status ?? data.subscriptionStatus,
  );
  const daysLeft = asNumber(data.daysLeft ?? data.daysRemaining ?? data.remainingDays);
  const active =
    typeof data.active === "boolean"
      ? data.active
      : typeof data.isActive === "boolean"
        ? data.isActive
        : isSubscriptionPaymentPaid(paymentStatus) ||
          ["active", "subscribed"].includes(paymentStatus.toLowerCase());

  const planLabel =
    asString(data.planLabel ?? data.planName ?? data.currentPlan ?? data.label) ||
    (planId === "yearly"
      ? "a day payment for 365 accumulative days"
      : planId === "biweekly"
        ? "26 void cheques of CAD 15 (bi-weekly)"
        : active
          ? "Active subscription"
          : "No active plan");

  return {
    active,
    planId,
    planLabel,
    daysLeft,
    paymentStatus,
    invoiceNo: asString(data.invoiceNo ?? data.invoiceNumber),
    expiresAt: asString(data.expiresAt ?? data.expiryDate ?? data.validUntil),
  };
}

/** POST /api/autoshopowner/subscription/checkout */
export function createSubscriptionCheckout(token: string, body: SubscriptionCheckoutBody) {
  return postJsonAutoshopowner<SubscriptionCheckoutResponse>(
    `${BASE}/checkout`,
    body as unknown as Record<string, unknown>,
    token,
  );
}

/** POST /api/autoshopowner/subscription/purchase */
export function purchaseSubscriptionOffline(
  token: string,
  body: SubscriptionOfflinePurchaseBody,
) {
  return postJsonAutoshopowner<SubscriptionOfflinePurchaseResponse>(
    `${BASE}/purchase`,
    body as unknown as Record<string, unknown>,
    token,
  );
}

/** GET /api/autoshopowner/subscription/:invoiceNo/status */
export function fetchSubscriptionInvoiceStatus(token: string, invoiceNo: string) {
  return getJsonAutoshopowner<SubscriptionInvoiceStatusResponse>(
    `${BASE}/${encodeURIComponent(invoiceNo)}/status`,
    token,
  );
}

/** PATCH /api/autoshopowner/subscription/:invoiceNo/mark-paid */
export function markSubscriptionPaid(token: string, invoiceNo: string) {
  return patchJsonAutoshopowner<ApiEnvelope>(
    `${BASE}/${encodeURIComponent(invoiceNo)}/mark-paid`,
    {},
    token,
  );
}

/** GET /api/autoshopowner/subscription/history */
export function fetchSubscriptionHistory(
  token: string,
  query?: { page?: number; limit?: number },
) {
  const usp = new URLSearchParams();
  if (query?.page != null) usp.set("page", String(query.page));
  if (query?.limit != null) usp.set("limit", String(query.limit));
  const qs = usp.toString();
  return getJsonAutoshopowner<unknown>(`${BASE}/history${qs ? `?${qs}` : ""}`, token);
}

export function formatSubscriptionApiError(
  payload: { message?: string; stripeError?: { message?: string; code?: string } } | null,
  fallback = "Could not start payment.",
): string {
  if (!payload) return fallback;
  const base = payload.message?.trim();
  const stripeMsg = payload.stripeError?.message?.trim();
  const stripeCode = payload.stripeError?.code?.trim();
  if (stripeMsg && stripeCode) {
    return base ? `${base} (${stripeMsg})` : `${stripeMsg} (${stripeCode})`;
  }
  if (stripeMsg) {
    return base ? `${base} (${stripeMsg})` : stripeMsg;
  }
  return base || fallback;
}

export function extractCheckoutSession(
  payload: SubscriptionCheckoutResponse | null,
): SubscriptionCheckoutSession | null {
  if (!payload) return null;
  const nested = asRecord(payload.data);

  const invoiceNo =
    asString(payload.invoiceNo) ||
    asString(payload.order_id) ||
    asString(nested?.invoiceNo) ||
    asString(nested?.order_id);

  const checkoutUrl =
    asString(payload.checkoutUrl) || asString(nested?.checkoutUrl) || undefined;

  const stripeSessionId =
    asString(payload.checkoutSessionId) ||
    asString(payload.stripeSessionId) ||
    asString(payload.sessionId) ||
    asString(nested?.checkoutSessionId) ||
    asString(nested?.stripeSessionId) ||
    asString(nested?.sessionId) ||
    undefined;

  if (!invoiceNo && !checkoutUrl && !stripeSessionId) return null;
  if (!checkoutUrl && !stripeSessionId) return null;

  return {
    orderId: invoiceNo || stripeSessionId || "checkout",
    checkoutUrl,
    stripeSessionId,
  };
}

export function parseInvoicePaymentStatus(
  payload: SubscriptionInvoiceStatusResponse | null,
): { invoiceNo: string; paymentStatus: string; paid: boolean } | null {
  if (!payload) return null;
  const nested = asRecord(payload.data);
  const paymentStatus =
    asString(payload.paymentStatus) ||
    asString(payload.status) ||
    asString(nested?.paymentStatus) ||
    asString(nested?.status);
  const invoiceNo =
    asString(payload.invoiceNo) || asString(nested?.invoiceNo);
  if (!paymentStatus && !invoiceNo) return null;
  return {
    invoiceNo,
    paymentStatus,
    paid: isSubscriptionPaymentPaid(paymentStatus),
  };
}

export function isSubscriptionPaymentPaid(paymentStatus: string | undefined): boolean {
  const status = (paymentStatus ?? "").toLowerCase();
  return (
    status === "paid" ||
    status === "success" ||
    status === "completed" ||
    status === "active"
  );
}

/** Build success/cancel URLs for Stripe Checkout redirects back to My Website. */
export function buildSubscriptionReturnUrls(planId: SubscriptionPlanId): {
  successUrl: string;
  cancelUrl: string;
} {
  const origin = window.location.origin;
  const path = "/shop/my-website";
  const base = `${origin}${path}`;
  return {
    successUrl: `${base}?payment=success&plan=${encodeURIComponent(planId)}`,
    cancelUrl: `${base}?payment=cancel&plan=${encodeURIComponent(planId)}`,
  };
}
