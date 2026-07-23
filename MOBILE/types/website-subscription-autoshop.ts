/** Shop owner website subscription — /api/autoshopowner/subscription/* */

export type SubscriptionPlanId = "yearly" | "biweekly";

export type SubscriptionCheckoutBody = {
  planId: SubscriptionPlanId;
  successUrl: string;
  cancelUrl: string;
};

export type SubscriptionOfflinePurchaseBody = {
  planId: SubscriptionPlanId;
  paymentMethod: string;
  remarks?: string;
};

export type StripeApiError = {
  message?: string;
  code?: string;
  type?: string;
};

export type SubscriptionCheckoutResponse = {
  success?: boolean;
  message?: string;
  stripeError?: StripeApiError;
  checkoutUrl?: string;
  checkoutSessionId?: string;
  sessionId?: string;
  stripeSessionId?: string;
  invoiceNo?: string;
  order_id?: string;
  data?: {
    checkoutUrl?: string;
    checkoutSessionId?: string;
    sessionId?: string;
    stripeSessionId?: string;
    invoiceNo?: string;
  };
};

export type SubscriptionOfflinePurchaseResponse = {
  success?: boolean;
  message?: string;
  invoiceNo?: string;
  data?: {
    invoiceNo?: string;
    paymentStatus?: string;
  };
};

export type SubscriptionInvoiceStatusResponse = {
  success?: boolean;
  message?: string;
  paymentStatus?: string;
  status?: string;
  invoiceNo?: string;
  data?: {
    paymentStatus?: string;
    status?: string;
    invoiceNo?: string;
  };
};

export type SubscriptionCheckoutSession = {
  orderId: string;
  stripeSessionId?: string;
  checkoutUrl?: string;
  clientSecret?: string;
};
