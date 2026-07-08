import { getJson, postJson } from "../api/mobileAuth";
import type {
  PurchaseWebsiteSubscriptionBody,
  PurchaseWebsiteSubscriptionResponse,
  SubscriptionCheckoutSession,
} from "../types/websiteSubscription";

export type BusinessSubscription = {
  days?: number;
  amount?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  invoiceNo?: string;
  referenceId?: string;
  stripeOrderId?: string;
  stripeSessionId?: string;
  stripeCheckoutUrl?: string;
  stripeClientSecret?: string;
  cashfreeOrderId?: string;
  cashfreePaymentSessionId?: string;
  cashfreePayload?: {
    order_id?: string;
    payment_session_id?: string;
    payments?: { url?: string };
  };
};

export type AutoShopOwnerProfileData = {
  businessProfile?: {
    subscriptions?: BusinessSubscription[];
    websiteTemplateId?: string;
  };
};

export type AutoShopOwnerProfileResponse = {
  success?: boolean;
  data?: AutoShopOwnerProfileData;
};

/** POST /api/auto-shop-owner/purchase-subscription */
export function purchaseWebsiteSubscription(
  token: string,
  body: PurchaseWebsiteSubscriptionBody
) {
  return postJson<PurchaseWebsiteSubscriptionResponse>(
    "/api/auto-shop-owner/purchase-subscription",
    body,
    token
  );
}

/** GET /api/auto-shop-owner/profile */
export function fetchAutoShopOwnerProfile(token: string) {
  return getJson<AutoShopOwnerProfileResponse>("/api/auto-shop-owner/profile", token);
}

function isStripeHostedCheckoutUrl(url: string): boolean {
  return /checkout\.stripe\.com/i.test(url);
}

export function formatPurchaseSubscriptionError(
  payload: PurchaseWebsiteSubscriptionResponse | null
): string {
  if (!payload) return "Could not start payment.";
  const base = payload.message?.trim();
  const stripeMsg = payload.stripeError?.message?.trim();
  const stripeCode = payload.stripeError?.code?.trim();
  if (stripeMsg && stripeCode) {
    return base ? `${base} (${stripeMsg})` : `${stripeMsg} (${stripeCode})`;
  }
  if (stripeMsg) {
    return base ? `${base} (${stripeMsg})` : stripeMsg;
  }
  const cf = payload.cashfreeError;
  const cfMsg = cf?.message?.trim();
  const cfCode = cf?.code?.trim();
  if (cfMsg && cfCode) {
    return base ? `${base} (${cfMsg})` : `${cfMsg} (${cfCode})`;
  }
  if (cfMsg) {
    return base ? `${base} (${cfMsg})` : cfMsg;
  }
  return base || "Could not start payment.";
}

export function extractPurchaseSubscriptionCheckoutSession(
  payload: PurchaseWebsiteSubscriptionResponse | null
): SubscriptionCheckoutSession | null {
  if (!payload) return null;

  const orderId =
    payload.order_id?.trim() ||
    payload.invoiceNo?.trim() ||
    payload.subDetails?.invoiceNo?.trim() ||
    payload.subDetails?.stripeOrderId?.trim() ||
    payload.subDetails?.cashfreeOrderId?.trim() ||
    payload.subDetails?.cashfreePayload?.order_id?.trim() ||
    "";

  const stripeSessionId =
    payload.stripeSessionId?.trim() ||
    payload.sessionId?.trim() ||
    payload.subDetails?.stripeSessionId?.trim() ||
    "";

  const checkoutUrlRaw =
    payload.stripeCheckoutUrl?.trim() ||
    payload.checkoutUrl?.trim() ||
    payload.paymentLink?.trim() ||
    payload.subDetails?.stripeCheckoutUrl?.trim() ||
    payload.subDetails?.cashfreePayload?.payments?.url?.trim() ||
    "";

  const checkoutUrl =
    checkoutUrlRaw && isStripeHostedCheckoutUrl(checkoutUrlRaw) ? checkoutUrlRaw : checkoutUrlRaw || undefined;

  const clientSecret =
    payload.clientSecret?.trim() ||
    payload.stripeClientSecret?.trim() ||
    payload.subDetails?.stripeClientSecret?.trim() ||
    "";

  if (!orderId) return null;
  if (!stripeSessionId && !checkoutUrl && !clientSecret) return null;

  return {
    orderId,
    stripeSessionId: stripeSessionId || undefined,
    checkoutUrl: checkoutUrl || undefined,
    clientSecret: clientSecret || undefined,
  };
}

export function isSubscriptionPaymentPaid(paymentStatus: string | undefined): boolean {
  const status = (paymentStatus ?? "").toLowerCase();
  return status === "paid" || status === "success" || status === "completed";
}

export function findSubscriptionByOrderId(
  subscriptions: BusinessSubscription[] | undefined,
  orderId: string
): BusinessSubscription | undefined {
  const id = orderId.trim();
  if (!id || !subscriptions?.length) return undefined;
  return subscriptions.find(
    (sub) =>
      sub.invoiceNo?.trim() === id ||
      sub.stripeOrderId?.trim() === id ||
      sub.cashfreeOrderId?.trim() === id ||
      sub.referenceId?.trim() === id
  );
}

/** Pending subscription on profile — resume checkout without a new order. */
export function extractPendingSubscriptionCheckout(
  businessProfile: { subscriptions?: BusinessSubscription[] } | null | undefined
): SubscriptionCheckoutSession | null {
  const subs = businessProfile?.subscriptions;
  if (!Array.isArray(subs)) return null;

  for (const sub of subs) {
    if ((sub.paymentStatus ?? "").toLowerCase() !== "pending") continue;
    if ((sub.paymentMethod ?? "").toLowerCase() === "cashfree") continue;

    const orderId =
      sub.stripeOrderId?.trim() ||
      sub.invoiceNo?.trim() ||
      sub.referenceId?.trim() ||
      "";

    const stripeSessionId = sub.stripeSessionId?.trim() || "";
    const checkoutUrl = sub.stripeCheckoutUrl?.trim() || "";
    const clientSecret = sub.stripeClientSecret?.trim() || "";

    if (!orderId) continue;
    if (!stripeSessionId && !checkoutUrl && !clientSecret) continue;

    return {
      orderId,
      stripeSessionId: stripeSessionId || undefined,
      checkoutUrl: checkoutUrl || undefined,
      clientSecret: clientSecret || undefined,
    };
  }
  return null;
}

export function buildSubscriptionReferenceId() {
  return `web-sub-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
