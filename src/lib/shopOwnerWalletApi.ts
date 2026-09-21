// // import { getJsonAutoshopowner, postJsonAutoshopowner } from "./"; // adjust to your actual fetch helpers/module name

// import { getJsonAutoshopowner,postJsonAutoshopowner } from "../api/autoshopownerHttp";

// const BASE = "/api/autoshopowner/wallet";

// export type WalletStatus = {
//   balance: number;
//   currency: string;
//   trialActive: boolean;
//   trialDaysRemaining: number;
//   trialExpiresAt: string;
//   perJobCardCharge: number;
//   minWalletRechargeAmount: number;
// };

// export type WalletTransaction = {
//   _id: string;
//   type: "recharge" | "debit" | "refund" | "adjustment";
//   amount: number;
//   balanceAfter: number;
//   reason?: string;
//   jobCardNo?: number;
//   paymentMethod?: string;
//   createdAt: string;
// };

// function asRecord(value: unknown): Record<string, unknown> | null {
//   return value && typeof value === "object" && !Array.isArray(value)
//     ? (value as Record<string, unknown>)
//     : null;
// }

// export function fetchWalletStatus(token: string) {
//   return getJsonAutoshopowner<unknown>(`${BASE}/status`, token);
// }

// export function parseWalletStatus(payload: unknown): WalletStatus | null {
//   const root = asRecord(payload);
//   // New: dig for root.data.data as per instruction
//   const data =
//     root && root.data && asRecord(root.data) && (asRecord((root.data as Record<string, unknown>).data) ?? asRecord(root.data))
//       ? (asRecord((root.data as Record<string, unknown>).data) ?? asRecord(root.data))
//       : root;
//   if (!data) return null;
//   return {
//     balance: Number(data.balance) || 0,
//     currency: (data.currency as string) || "CAD",
//     trialActive: Boolean(data.trialActive),
//     trialDaysRemaining: Number(data.trialDaysRemaining) || 0,
//     trialExpiresAt: (data.trialExpiresAt as string) || "",
//     perJobCardCharge: Number(data.perJobCardCharge) || 1,
//     minWalletRechargeAmount: Number(data.minWalletRechargeAmount) || 100,
//   };
// }

// export function fetchWalletHistory(token: string, page = 1, limit = 20) {
//   return getJsonAutoshopowner<unknown>(`${BASE}/history?page=${page}&limit=${limit}`, token);
// }

// export function parseWalletHistory(payload: unknown): WalletTransaction[] {
//   const root = asRecord(payload);
//   const list = root?.data;
//   return Array.isArray(list) ? (list as WalletTransaction[]) : [];
// }

// export function rechargeWallet(
//   token: string,
//   body: { amount: number; paymentMethod?: string; referenceId?: string; remarks?: string },
// ) {
//   return postJsonAutoshopowner<unknown>(`${BASE}/recharge`, body as unknown as Record<string, unknown>, token);
// }
import { getJsonAutoshopowner, postJsonAutoshopowner } from "../api/autoshopownerHttp";
import type {
  WalletCheckoutBody,
  WalletCheckoutResponse,
  WalletCheckoutSession,
  WalletCheckoutStatusResponse,
} from "../types/Softwarewallet";

const BASE = "/api/autoshopowner/wallet";

export type WalletStatus = {
  balance: number;
  currency: string;
  trialActive: boolean;
  trialDaysRemaining: number;
  trialExpiresAt: string;
  perJobCardCharge: number;
  minWalletRechargeAmount: number;
};

export type WalletTransaction = {
  _id: string;
  type: "recharge" | "debit" | "refund" | "adjustment";
  amount: number;
  balanceAfter: number;
  reason?: string;
  jobCardNo?: number;
  paymentMethod?: string;
  paymentStatus?: "Paid" | "Pending" | "Failed";
  createdAt: string;
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

export function fetchWalletStatus(token: string) {
  return getJsonAutoshopowner<unknown>(`${BASE}/status`, token);
}

export function parseWalletStatus(payload: unknown): WalletStatus | null {
  const root = asRecord(payload);
  // New: dig for root.data.data as per instruction
  const data =
    root && root.data && asRecord(root.data) && (asRecord((root.data as Record<string, unknown>).data) ?? asRecord(root.data))
      ? (asRecord((root.data as Record<string, unknown>).data) ?? asRecord(root.data))
      : root;
  if (!data) return null;
  return {
    balance: Number(data.balance) || 0,
    currency: (data.currency as string) || "CAD",
    trialActive: Boolean(data.trialActive),
    trialDaysRemaining: Number(data.trialDaysRemaining) || 0,
    trialExpiresAt: (data.trialExpiresAt as string) || "",
    perJobCardCharge: Number(data.perJobCardCharge) || 1,
    minWalletRechargeAmount: Number(data.minWalletRechargeAmount) || 100,
  };
}

export function fetchWalletHistory(token: string, page = 1, limit = 20) {
  return getJsonAutoshopowner<unknown>(`${BASE}/history?page=${page}&limit=${limit}`, token);
}

export function parseWalletHistory(payload: unknown): WalletTransaction[] {
  const root = asRecord(payload);
  const list = root?.data;
  return Array.isArray(list) ? (list as WalletTransaction[]) : [];
}

/** POST /api/autoshopowner/wallet/checkout — creates a Stripe Checkout Session for a top-up. */
export function createWalletCheckout(token: string, body: WalletCheckoutBody) {
  return postJsonAutoshopowner<WalletCheckoutResponse>(
    `${BASE}/checkout`,
    body as unknown as Record<string, unknown>,
    token,
  );
}

/** GET /api/autoshopowner/wallet/checkout/:sessionId/status — self-heal poll after redirect back. */
export function fetchWalletCheckoutStatus(token: string, sessionId: string) {
  return getJsonAutoshopowner<WalletCheckoutStatusResponse>(
    `${BASE}/checkout/${encodeURIComponent(sessionId)}/status`,
    token,
  );
}

export function formatWalletApiError(
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

export function extractWalletCheckoutSession(
  payload: WalletCheckoutResponse | null,
): WalletCheckoutSession | null {
  if (!payload) return null;
  const nested = asRecord(payload.data);

  const transactionId =
    asString(payload.transactionId) || asString(nested?.transactionId);

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

  if (!checkoutUrl && !stripeSessionId) return null;

  return {
    orderId: transactionId || stripeSessionId || "checkout",
    checkoutUrl,
    stripeSessionId,
  };
}

export function parseWalletCheckoutStatus(
  payload: WalletCheckoutStatusResponse | null,
): { paymentStatus: string; balance: number | null; paid: boolean } | null {
  if (!payload) return null;
  const nested = asRecord(payload.data);
  const paymentStatus =
    asString(payload.paymentStatus) || asString(nested?.paymentStatus);
  const balanceRaw = payload.balance ?? (nested?.balance as number | undefined);
  const balance = typeof balanceRaw === "number" && Number.isFinite(balanceRaw) ? balanceRaw : null;
  if (!paymentStatus) return null;
  return {
    paymentStatus,
    balance,
    paid: paymentStatus.toLowerCase() === "paid",
  };
}

/** Build success/cancel URLs for Stripe Checkout redirects back to the wallet panel. */
export function buildWalletReturnUrls(): { successUrl: string; cancelUrl: string } {
  const origin = window.location.origin;
  const path = "/shop/wallet";
  const base = `${origin}${path}`;
  return {
    successUrl: `${base}?walletPayment=success`,
    cancelUrl: `${base}?walletPayment=cancel`,
  };
}