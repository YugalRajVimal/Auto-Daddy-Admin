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

export type LedgerRow = {
  id: number;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  subcategory: string;
  notes: string;
  gst: boolean;
  billNumber: string | null;
  byCheque: boolean;
  hasReceipt: boolean;
};

export type AccountReportTitle = "income" | "expenses" | "bank" | "gst";

export type GstLedgerRow = LedgerRow & { ledgerType: "income" | "expenses" };

/** Estimate GST/HST portion when the amount includes 13% tax. */
export function estimateGstAmount(amount: number) {
  return Math.round((amount - amount / 1.13) * 100) / 100;
}

export const DUMMY_BANKS: BankRow[] = [
  {
    id: 1,
    label: "BUSINESS",
    assignToInvoice: true,
    status: "active",
    totalBalance: -23980,
    accountName: "I6570569 CANADA INC",
    accountNumber: "",
    interac: "phulkiyan@gmail.com",
  },
  {
    id: 2,
    label: "CASH ACCOUNT",
    assignToInvoice: false,
    status: "active",
    totalBalance: -180,
    accountName: "",
    accountNumber: "",
    interac: "",
  },
  {
    id: 3,
    label: "CHECKING ACCOUNT",
    assignToInvoice: false,
    status: "active",
    totalBalance: 5420,
    accountName: "Operating Chequing",
    accountNumber: "****4521",
    interac: "",
  },
  {
    id: 4,
    label: "CASH",
    assignToInvoice: false,
    status: "active",
    totalBalance: 850,
    accountName: "",
    accountNumber: "",
    interac: "",
  },
  {
    id: 5,
    label: "CREDIT CARD",
    assignToInvoice: false,
    status: "active",
    totalBalance: -1240,
    accountName: "Visa Business",
    accountNumber: "****8891",
    interac: "",
  },
];

export const DUMMY_EXPENSES: LedgerRow[] = [
  { id: 1, date: "2026-05-24", vendor: "ABHAY", amount: 100, category: "other-expenses", subcategory: "misc", notes: "", gst: false, billNumber: null, byCheque: false, hasReceipt: true },
  { id: 2, date: "2026-05-23", vendor: "REMAN KAMBOJ", amount: 16000, category: "staff-contractors", subcategory: "salaries", notes: "", gst: false, billNumber: null, byCheque: false, hasReceipt: false },
  { id: 3, date: "2026-05-22", vendor: "JASPREET SINGH", amount: 4200, category: "staff-contractors", subcategory: "wages", notes: "Weekly wages", gst: false, billNumber: null, byCheque: true, hasReceipt: false },
  { id: 4, date: "2026-05-21", vendor: "SURBHI WEB DEV", amount: 350, category: "professional", subcategory: "software-charges", notes: "Website maintenance", gst: true, billNumber: "SWD-221", byCheque: false, hasReceipt: true },
  { id: 5, date: "2026-05-20", vendor: "PAHADI-APP", amount: 500, category: "professional", subcategory: "software-charges", notes: "App subscription", gst: true, billNumber: null, byCheque: false, hasReceipt: true },
  { id: 6, date: "2026-05-19", vendor: "MICROSOFT", amount: 189, category: "professional", subcategory: "software-charges", notes: "Office 365", gst: true, billNumber: "MS-8821", byCheque: false, hasReceipt: false },
  { id: 7, date: "2026-05-18", vendor: "DETAIL PRO", amount: 275, category: "car-vehicle", subcategory: "detailing", notes: "Fleet vehicle detailing", gst: true, billNumber: null, byCheque: false, hasReceipt: true },
  { id: 8, date: "2026-05-15", vendor: "TD BANK", amount: 45, category: "bank", subcategory: "bank-charges", notes: "Monthly service fee", gst: false, billNumber: null, byCheque: false, hasReceipt: false },
  { id: 9, date: "2026-05-12", vendor: "BELL CANADA", amount: 89.99, category: "utilities", subcategory: "internet", notes: "Business internet", gst: true, billNumber: null, byCheque: false, hasReceipt: false },
  { id: 10, date: "2026-05-10", vendor: "TORONTO HYDRO", amount: 320, category: "utilities", subcategory: "electricity", notes: "", gst: true, billNumber: "TH-99102", byCheque: false, hasReceipt: true },
  { id: 11, date: "2026-05-08", vendor: "LANDLORD CORP", amount: 2500, category: "rent-lease", subcategory: "office-rent", notes: "Office rent — May", gst: false, billNumber: null, byCheque: true, hasReceipt: false },
  { id: 12, date: "2026-05-05", vendor: "GOOGLE ADS", amount: 450, category: "advertising", subcategory: "online", notes: "May ad campaign", gst: true, billNumber: "GA-5521", byCheque: false, hasReceipt: false },
];

export const DUMMY_INCOME: LedgerRow[] = [
  { id: 1, date: "2026-05-24", vendor: "JOHN SMITH", amount: 450, category: "service-revenue", subcategory: "repairs", notes: "Brake pad replacement", gst: true, billNumber: "JOB-1001", byCheque: false, hasReceipt: false },
  { id: 2, date: "2026-05-23", vendor: "MARIA GARCIA", amount: 125, category: "service-revenue", subcategory: "maintenance", notes: "Oil change package", gst: true, billNumber: "JOB-1002", byCheque: false, hasReceipt: false },
  { id: 3, date: "2026-05-22", vendor: "FLEET CARE INC", amount: 3200, category: "service-revenue", subcategory: "maintenance", notes: "Fleet service contract — May", gst: true, billNumber: "INV-5501", byCheque: true, hasReceipt: false },
  { id: 4, date: "2026-05-20", vendor: "NORTHERN DEALERS", amount: 890, category: "product-sales", subcategory: "parts", notes: "Bulk parts order", gst: true, billNumber: "SO-8821", byCheque: false, hasReceipt: true },
  { id: 5, date: "2026-05-18", vendor: "DAVID CHEN", amount: 275, category: "service-revenue", subcategory: "detailing", notes: "Full detail package", gst: true, billNumber: null, byCheque: false, hasReceipt: false },
  { id: 6, date: "2026-05-15", vendor: "REFERRAL PARTNER", amount: 150, category: "other-income", subcategory: "referral", notes: "Referral commission", gst: false, billNumber: null, byCheque: false, hasReceipt: false },
  { id: 7, date: "2026-05-12", vendor: "QUICK LUBE EXPRESS", amount: 680, category: "service-revenue", subcategory: "maintenance", notes: "Partner shop revenue share", gst: true, billNumber: "REV-3310", byCheque: false, hasReceipt: false },
  { id: 8, date: "2026-05-10", vendor: "WALK-IN CUSTOMER", amount: 95, category: "product-sales", subcategory: "accessories", notes: "Floor mats and air fresheners", gst: true, billNumber: null, byCheque: false, hasReceipt: false },
  { id: 9, date: "2026-05-08", vendor: "TORONTO TIRE MASTERS", amount: 1100, category: "service-revenue", subcategory: "repairs", notes: "Tire installation — 4 vehicles", gst: true, billNumber: "JOB-1044", byCheque: true, hasReceipt: true },
  { id: 10, date: "2026-05-05", vendor: "INSURANCE PAYOUT", amount: 2400, category: "other-income", subcategory: "misc", notes: "Claim settlement", gst: false, billNumber: "CLM-9921", byCheque: true, hasReceipt: false },
];

export function formatDisplayDate(iso: string) {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
