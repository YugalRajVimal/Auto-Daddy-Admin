import { loadStripe, type Stripe } from "@stripe/stripe-js";
import type { SubscriptionCheckoutSession } from "../types/websiteSubscription";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripePublishableKey(): string | null {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();
  return key || null;
}

/** Loads Stripe.js — required for future embedded checkout; hosted checkout uses checkoutUrl. */
export function getStripe(): Promise<Stripe | null> {
  const key = getStripePublishableKey();
  if (!key) return Promise.resolve(null);
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

export async function redirectToStripeCheckout(
  session: SubscriptionCheckoutSession
): Promise<{ error?: string }> {
  if (session.checkoutUrl) {
    window.location.assign(session.checkoutUrl);
    return {};
  }

  if (session.stripeSessionId) {
    const stripe = await getStripe();
    if (!stripe) {
      return {
        error:
          "Stripe is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY in .env, or have the API return checkoutUrl.",
      };
    }
    return {
      error:
        "Checkout URL missing from server. Configure the backend to return stripeCheckoutUrl from the Stripe Checkout Session.",
    };
  }

  return { error: "Payment session not returned from server." };
}
