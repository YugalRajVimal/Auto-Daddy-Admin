/** Shop owner Software Wallet recharge — /api/autoshopowner/wallet/* */

export type WalletCheckoutBody = {
    amount: number;
    successUrl: string;
    cancelUrl: string;
  };
  
  export type StripeApiError = {
    message?: string;
    code?: string;
    type?: string;
  };
  
  export type WalletCheckoutResponse = {
    success?: boolean;
    message?: string;
    stripeError?: StripeApiError;
    checkoutUrl?: string;
    checkoutSessionId?: string;
    sessionId?: string;
    stripeSessionId?: string;
    transactionId?: string;
    data?: {
      checkoutUrl?: string;
      checkoutSessionId?: string;
      sessionId?: string;
      stripeSessionId?: string;
      transactionId?: string;
      amount?: number;
      currency?: string;
    };
  };
  
  export type WalletCheckoutStatusResponse = {
    success?: boolean;
    message?: string;
    paymentStatus?: string;
    balance?: number;
    data?: {
      transactionId?: string;
      paymentStatus?: string;
      balance?: number;
      reconciled?: boolean;
    };
  };
  
  /** Reuses the same shape lib/stripe.ts's redirectToStripeCheckout() expects. */
  export type WalletCheckoutSession = {
    orderId: string;
    stripeSessionId?: string;
    checkoutUrl?: string;
    clientSecret?: string;
  };