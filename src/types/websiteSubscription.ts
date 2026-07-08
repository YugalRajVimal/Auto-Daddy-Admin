/** POST /api/auto-shop-owner/purchase-subscription */

export type PurchaseWebsiteSubscriptionBody = {
  amount: number;
  days: number;
  paymentMethod: "stripe" | "cashfree";
  referenceId: string;
  year: string;
  websiteTemplateId: string;
};

export type StripeApiError = {
  message?: string;
  code?: string;
  type?: string;
};

export type PurchaseWebsiteSubscriptionResponse = {
  success?: boolean;
  message?: string;
  stripeError?: StripeApiError;
  cashfreeError?: StripeApiError;
  invoiceNo?: string;
  order_id?: string;
  /** Hosted Stripe Checkout page — safe to open in browser. */
  checkoutUrl?: string;
  stripeCheckoutUrl?: string;
  /** Stripe Checkout Session id — use with @stripe/stripe-js redirectToCheckout. */
  stripeSessionId?: string;
  sessionId?: string;
  /** PaymentIntent client secret — optional embedded / Payment Sheet flow. */
  clientSecret?: string;
  stripeClientSecret?: string;
  paymentLink?: string;
  order_status?: string;
  subDetails?: {
    days?: number;
    amount?: number;
    subTotal?: number;
    hst?: number;
    hstAmount?: number;
    total?: number;
    invoiceNo?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    stripeSessionId?: string;
    stripeCheckoutUrl?: string;
    stripeClientSecret?: string;
    stripeOrderId?: string;
    cashfreePaymentSessionId?: string;
    cashfreeOrderId?: string;
    cashfreePayload?: {
      order_id?: string;
      payment_session_id?: string;
      payments?: { url?: string };
    };
  };
};

export type SubscriptionCheckoutSession = {
  orderId: string;
  stripeSessionId?: string;
  checkoutUrl?: string;
  clientSecret?: string;
};
