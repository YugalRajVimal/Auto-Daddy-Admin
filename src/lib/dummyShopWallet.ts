/** Flip to false once paid/unpaid invoice APIs fully replace mock ledger data. Expenses and banks still use dummy rows below. */
export const USE_DUMMY_SHOP_WALLET = false;

export type ShopWalletExpenseRow = {
  id: string;
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

export type ShopWalletBankRow = {
  id: string;
  label: string;
  accountName: string;
  accountNumber: string;
  balance: number;
  assignToInvoice: boolean;
};

export const DUMMY_SHOP_EXPENSES: ShopWalletExpenseRow[] = [
  { id: "exp-1", date: "2026-05-24", vendor: "ABHAY", amount: 100, category: "other-expenses", subcategory: "misc", notes: "", gst: false, billNumber: null, byCheque: false, hasReceipt: true },
  { id: "exp-2", date: "2026-05-23", vendor: "REMAN KAMBOJ", amount: 16000, category: "staff-contractors", subcategory: "salaries", notes: "", gst: false, billNumber: null, byCheque: false, hasReceipt: false },
  { id: "exp-3", date: "2026-05-22", vendor: "JASPREET SINGH", amount: 4200, category: "staff-contractors", subcategory: "wages", notes: "Weekly wages", gst: false, billNumber: null, byCheque: true, hasReceipt: false },
  { id: "exp-4", date: "2026-05-21", vendor: "SURBHI WEB DEV", amount: 350, category: "professional", subcategory: "software-charges", notes: "Website maintenance", gst: true, billNumber: "SWD-221", byCheque: false, hasReceipt: true },
  { id: "exp-5", date: "2026-05-20", vendor: "PAHADI-APP", amount: 500, category: "professional", subcategory: "software-charges", notes: "App subscription", gst: true, billNumber: null, byCheque: false, hasReceipt: true },
  { id: "exp-6", date: "2026-05-19", vendor: "MICROSOFT", amount: 189, category: "professional", subcategory: "software-charges", notes: "Office 365", gst: true, billNumber: "MS-8821", byCheque: false, hasReceipt: false },
  { id: "exp-7", date: "2026-05-18", vendor: "DETAIL PRO", amount: 275, category: "car-vehicle", subcategory: "detailing", notes: "Fleet vehicle detailing", gst: true, billNumber: null, byCheque: false, hasReceipt: true },
  { id: "exp-8", date: "2026-05-15", vendor: "TD BANK", amount: 45, category: "bank", subcategory: "bank-charges", notes: "Monthly service fee", gst: false, billNumber: null, byCheque: false, hasReceipt: false },
  { id: "exp-9", date: "2026-05-12", vendor: "BELL CANADA", amount: 89.99, category: "utilities", subcategory: "internet", notes: "Business internet", gst: true, billNumber: null, byCheque: false, hasReceipt: false },
  { id: "exp-10", date: "2026-05-10", vendor: "TORONTO HYDRO", amount: 320, category: "utilities", subcategory: "electricity", notes: "", gst: true, billNumber: "TH-99102", byCheque: false, hasReceipt: true },
  { id: "exp-11", date: "2026-05-08", vendor: "LANDLORD CORP", amount: 2500, category: "rent-lease", subcategory: "office-rent", notes: "Office rent — May", gst: false, billNumber: null, byCheque: true, hasReceipt: false },
  { id: "exp-12", date: "2026-05-05", vendor: "GOOGLE ADS", amount: 450, category: "advertising", subcategory: "online", notes: "May ad campaign", gst: true, billNumber: "GA-5521", byCheque: false, hasReceipt: false },
];

export const DUMMY_SHOP_BANKS: ShopWalletBankRow[] = [
  {
    id: "bank-1",
    label: "BUSINESS",
    accountName: "A.B Car Mechanic Inc.",
    accountNumber: "****4521",
    balance: 5420,
    assignToInvoice: true,
  },
  {
    id: "bank-2",
    label: "CASH ACCOUNT",
    accountName: "Shop Cash Drawer",
    accountNumber: "—",
    balance: 850,
    assignToInvoice: false,
  },
  {
    id: "bank-3",
    label: "CHECKING ACCOUNT",
    accountName: "Operating Chequing",
    accountNumber: "****8891",
    balance: 12400,
    assignToInvoice: false,
  },
  {
    id: "bank-4",
    label: "CREDIT CARD",
    accountName: "Visa Business",
    accountNumber: "****3310",
    balance: -1240,
    assignToInvoice: false,
  },
];
