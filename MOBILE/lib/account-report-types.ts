export type LedgerRow = {
  id: number;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  subcategory: string;
  notes: string;
  gst: boolean;
  gstAmount?: string | null;
  billNumber: string | null;
  byCheque: boolean;
  chequeAccount?: string | null;
  hasReceipt: boolean;
  attachmentUrl?: string | null;
  /** Income-only fields (optional for backward compatibility). */
  paymentMode?: string;
  bank?: string;
  attachmentName?: string | null;
};
export type GstLedgerRow = LedgerRow & { ledgerType: "income" | "expenses" };

/** Estimate GST/HST portion when the amount includes 13% tax. */
export type BankRow = {
  id: number;
  label: string;
  assignToInvoice: boolean;
  status: string;
  totalBalance: number;
  accountName: string;
  accountNumber: string;
  interac: string;
};
