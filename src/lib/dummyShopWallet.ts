import type { JobCardListRow } from "./shopOwnerJobCards";

/** Flip to false once wallet, expenses, and bank APIs are wired on the shop portal. */
export const USE_DUMMY_SHOP_WALLET = true;

export type ShopWalletExpenseRow = {
  id: string;
  date: string;
  name: string;
  category: string;
  amount: number;
};

export type ShopWalletBankRow = {
  id: string;
  label: string;
  accountName: string;
  accountNumber: string;
  balance: number;
  assignToInvoice: boolean;
};

function invoiceRow(
  id: string,
  jobNo: string,
  customerName: string,
  phone: string,
  plate: string,
  amount: number,
  date: string,
  paymentStatus: "Paid" | "Unpaid",
  paymentMethod: "Cash" | "Online",
): JobCardListRow {
  return {
    id,
    raw: { paymentMethod },
    customerName,
    jobNo,
    vehiclePlate: plate,
    phone,
    date,
    total: amount,
    paymentStatus,
  };
}

const CUSTOMERS = [
  { name: "Name Customer", phone: "7059913785", plate: "GVTY 884" },
  { name: "Raj Singh", phone: "4165550192", plate: "BRAM 221" },
  { name: "Maria Lopez", phone: "9055554433", plate: "ONPK 902" },
  { name: "James Chen", phone: "6475558821", plate: "GTAA 441" },
  { name: "Priya Patel", phone: "2895557710", plate: "MISS 118" },
  { name: "David Miller", phone: "5195553399", plate: "KWEL 552" },
];

function buildInvoices(paymentStatus: "Paid" | "Unpaid", prefix: string): JobCardListRow[] {
  const amounts = [185, 240, 95, 420, 310, 175, 560, 88, 225, 390, 145, 275];
  const dates = [
    "2026-06-14",
    "2026-06-13",
    "2026-06-12",
    "2026-06-11",
    "2026-06-10",
    "2026-06-09",
    "2026-06-08",
    "2026-06-07",
    "2026-06-06",
    "2026-06-05",
    "2026-06-04",
    "2026-06-03",
  ];

  return amounts.map((amount, index) => {
    const customer = CUSTOMERS[index % CUSTOMERS.length];
    const jobNo = String(1254 - index);
    return invoiceRow(
      `${prefix}-${index + 1}`,
      jobNo,
      customer.name,
      customer.phone,
      customer.plate,
      amount,
      dates[index],
      paymentStatus,
      index % 2 === 0 ? "Online" : "Cash",
    );
  });
}

export const DUMMY_PAID_INVOICES: JobCardListRow[] = buildInvoices("Paid", "dummy-paid");
export const DUMMY_UNPAID_INVOICES: JobCardListRow[] = buildInvoices("Unpaid", "dummy-unpaid");

export const DUMMY_SHOP_EXPENSES: ShopWalletExpenseRow[] = [
  { id: "exp-1", date: "2026-06-14", name: "Parts Supply Co.", category: "Parts", amount: 185 },
  { id: "exp-2", date: "2026-06-13", name: "Tool Depot", category: "Equipment", amount: 420 },
  { id: "exp-3", date: "2026-06-12", name: "City Utilities", category: "Utilities", amount: 310 },
  { id: "exp-4", date: "2026-06-11", name: "Staff Payroll", category: "Wages", amount: 2400 },
  { id: "exp-5", date: "2026-06-10", name: "Oil Wholesale", category: "Inventory", amount: 560 },
  { id: "exp-6", date: "2026-06-09", name: "Shop Rent", category: "Rent", amount: 1800 },
  { id: "exp-7", date: "2026-06-08", name: "Google Ads", category: "Marketing", amount: 275 },
  { id: "exp-8", date: "2026-06-07", name: "Waste Disposal", category: "Operations", amount: 95 },
  { id: "exp-9", date: "2026-06-06", name: "Insurance Premium", category: "Insurance", amount: 390 },
  { id: "exp-10", date: "2026-06-05", name: "Coffee & Supplies", category: "Office", amount: 45 },
  { id: "exp-11", date: "2026-06-04", name: "Tire Supplier", category: "Parts", amount: 880 },
  { id: "exp-12", date: "2026-06-03", name: "Equipment Lease", category: "Equipment", amount: 650 },
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
