import * as WebBrowser from "expo-web-browser";
import type { SubscriptionCheckoutSession } from "@/types/website-subscription";

export function getStripePublishableKey(): string | null {
  const key = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  return key || null;
}

/** Opens Stripe hosted checkout in the system browser (recommended on mobile). */
export async function openStripeCheckoutInBrowser(
  session: SubscriptionCheckoutSession
): Promise<{ opened: boolean; error?: string }> {
  const url = session.checkoutUrl?.trim();
  if (!url) {
    return { opened: false, error: "Checkout URL not returned from server." };
  }

  try {
    await WebBrowser.openBrowserAsync(url, {
      dismissButtonStyle: "close",
      enableBarCollapsing: true,
      showInRecents: true,
    });
    return { opened: true };
  } catch {
    return { opened: false, error: "Could not open Stripe checkout." };
  }
}

export function canOpenStripeCheckout(session: SubscriptionCheckoutSession): boolean {
  return Boolean(session.checkoutUrl?.trim() || session.stripeSessionId?.trim() || session.clientSecret?.trim());
}
