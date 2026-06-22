/** POST /api/auto-shop-owner/purchase-subscription */

export type PurchaseWebsiteSubscriptionBody = {
  amount: number;
  days: number;
  paymentMethod: "cashfree";
  referenceId: string;
  year: string;
};

export type CashfreeApiError = {
  message?: string;
  code?: string;
  type?: string;
};

export type PurchaseWebsiteSubscriptionResponse = {
  success?: boolean;
  message?: string;
  cashfreeError?: CashfreeApiError;
  invoiceNo?: string;
  order_id?: string;
  /** Merchant PG API URL — not for browser/WebView. Use sessionId for checkout. */
  paymentLink?: string;
  /** Cashfree payment_session_id — required for mobile/web checkout SDK. */
  sessionId?: string;
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
    cashfreePaymentSessionId?: string;
    cashfreeOrderId?: string;
    cashfreePayload?: {
      order_id?: string;
      payment_session_id?: string;
      payments?: { url?: string };
    };
  };
};
