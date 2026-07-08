import { API_BASE_URL } from "@/lib/api";
import { CFEnvironment, CFSession } from "cashfree-pg-api-contract";
import { CFPaymentGatewayService } from "react-native-cashfree-pg-sdk";
import { NativeModules } from "react-native";

const CASHFREE_PG_API_VERSION = "2023-08-01";

export type CashfreeCheckoutSession = {
  paymentSessionId: string;
  orderId: string;
};

/** True when the native Cashfree module is linked (dev build / prebuild), not Expo Go. */
export function isCashfreeNativeAvailable(): boolean {
  return Boolean(NativeModules.CashfreePgApi);
}

export function isCashfreeSandboxPaymentLink(paymentLink?: string | null): boolean {
  return Boolean(paymentLink?.includes("sandbox.cashfree.com"));
}

/** API-only URL from create-order — not for WebView/browser (returns authentication_error). */
export function isCashfreeMerchantApiUrl(url?: string | null): boolean {
  if (!url?.trim()) return false;
  return /\/pg\/orders\/[^/]+\/payments\/?$/i.test(url.trim());
}

export function cashfreePgBaseUrl(sandbox: boolean): string {
  return sandbox ? "https://sandbox.cashfree.com/pg" : "https://api.cashfree.com/pg";
}

/** Sandbox vs production — override with EXPO_PUBLIC_CASHFREE_ENV=sandbox|production */
export function resolveCashfreeSandbox(paymentLink?: string | null): boolean {
  const explicit = process.env.EXPO_PUBLIC_CASHFREE_ENV?.trim().toLowerCase();
  if (explicit === "production" || explicit === "prod") {
    return false;
  }
  if (explicit === "sandbox") {
    return true;
  }
  if (isCashfreeSandboxPaymentLink(paymentLink)) {
    return true;
  }
  const apiUrl = API_BASE_URL.toLowerCase();
  if (apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1")) {
    return true;
  }
  return true;
}

export function resolveCashfreeEnvironment(paymentLink?: string | null): CFEnvironment {
  return resolveCashfreeSandbox(paymentLink)
    ? CFEnvironment.SANDBOX
    : CFEnvironment.PRODUCTION;
}

/**
 * Customer checkout URL via Order Pay API (safe to open in browser).
 * Do not open paymentLink from purchase-subscription — that path requires merchant auth.
 */
export async function fetchCashfreeCustomerCheckoutUrl(
  paymentSessionId: string,
  sandbox: boolean
): Promise<string | null> {
  const session = paymentSessionId.trim();
  if (!session) return null;

  const base = cashfreePgBaseUrl(sandbox);
  const bodyVariants = [
    { payment_session_id: session, payment_method: { upi: { channel: "link" } } },
    { payment_session_id: session, payment_method: { card: { channel: "link" } } },
  ];

  for (const body of bodyVariants) {
    try {
      const res = await fetch(`${base}/orders/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-version": CASHFREE_PG_API_VERSION,
        },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      if (!json) continue;
      const data = json.data as Record<string, unknown> | undefined;
      const url =
        (typeof data?.url === "string" && data.url) ||
        (typeof json.url === "string" && json.url) ||
        null;
      if (url && !isCashfreeMerchantApiUrl(url)) {
        return url;
      }
    } catch {
      // try next variant
    }
  }
  return null;
}

export function startCashfreeWebCheckout(
  session: CashfreeCheckoutSession,
  options?: { paymentLink?: string | null }
): void {
  if (!isCashfreeNativeAvailable()) {
    throw new Error("Cashfree native SDK is not linked. Rebuild the app with expo prebuild.");
  }
  const environment = resolveCashfreeEnvironment(options?.paymentLink);
  const cfSession = new CFSession(session.paymentSessionId, session.orderId, environment);
  CFPaymentGatewayService.doWebPayment(cfSession);
}
