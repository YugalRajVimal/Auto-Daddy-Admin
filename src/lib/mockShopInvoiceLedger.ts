import { useMemo, useSyncExternalStore } from "react";
import { isJobCardPaid, type JobCardListRow } from "./shopOwnerJobCards";
import { getWalletLedgerTab } from "./shopOwnerWallet";

const CUSTOMERS = [
  { name: "Name Customer", phone: "7059913785", plate: "GVTY 884" },
  { name: "Raj Singh", phone: "4165550192", plate: "BRAM 221" },
  { name: "Maria Lopez", phone: "9055554433", plate: "ONPK 902" },
  { name: "James Chen", phone: "6475558821", plate: "GTAA 441" },
  { name: "Priya Patel", phone: "2895557710", plate: "MISS 118" },
  { name: "David Miller", phone: "5195553399", plate: "KWEL 552" },
];

function jobCardRow(
  id: string,
  jobNo: string,
  customerIndex: number,
  amount: number,
  date: string,
  options: {
    listBucket?: JobCardListRow["listBucket"];
    status: string;
    paymentStatus: "Paid" | "Unpaid";
    paymentMethod: "Cash" | "Online";
  },
): JobCardListRow {
  const customer = CUSTOMERS[customerIndex % CUSTOMERS.length];
  const unpaid = options.paymentStatus !== "Paid";
  return {
    id,
    listBucket: options.listBucket,
    raw: { paymentMethod: options.paymentMethod, paymentStatus: options.paymentStatus },
    customerName: customer.name,
    jobNo,
    vehiclePlate: customer.plate,
    phone: customer.phone,
    date,
    total: amount,
    status: options.status,
    paymentStatus: options.paymentStatus,
    unpaid,
  };
}

/** Approved cash job cards that can be converted to invoice from Job Cards. */
const INITIAL_JOB_CARDS: JobCardListRow[] = [
  jobCardRow("jc-1001", "1254", 0, 185, "2026-06-14", {
    listBucket: "pending",
    status: "Pending",
    paymentStatus: "Unpaid",
    paymentMethod: "Cash",
  }),
  jobCardRow("jc-1002", "1253", 1, 240, "2026-06-13", {
    listBucket: "pending",
    status: "Pending",
    paymentStatus: "Unpaid",
    paymentMethod: "Cash",
  }),
  jobCardRow("jc-1003", "1252", 2, 310, "2026-06-12", {
    listBucket: "approved",
    status: "Approved",
    paymentStatus: "Unpaid",
    paymentMethod: "Cash",
  }),
  jobCardRow("jc-1004", "1251", 3, 420, "2026-06-11", {
    listBucket: "approved",
    status: "Approved",
    paymentStatus: "Unpaid",
    paymentMethod: "Cash",
  }),
  jobCardRow("jc-1005", "1250", 4, 175, "2026-06-10", {
    listBucket: "approved",
    status: "Approved",
    paymentStatus: "Unpaid",
    paymentMethod: "Cash",
  }),
  jobCardRow("jc-1006", "1249", 5, 560, "2026-06-09", {
    listBucket: "approved",
    status: "Approved",
    paymentStatus: "Unpaid",
    paymentMethod: "Cash",
  }),
  jobCardRow("inv-unpaid-1", "1248", 0, 225, "2026-06-08", {
    listBucket: "approved",
    status: "Approved",
    paymentStatus: "Unpaid",
    paymentMethod: "Online",
  }),
  jobCardRow("inv-unpaid-2", "1247", 1, 390, "2026-06-07", {
    listBucket: "approved",
    status: "Approved",
    paymentStatus: "Unpaid",
    paymentMethod: "Online",
  }),
  jobCardRow("inv-unpaid-3", "1246", 2, 145, "2026-06-06", {
    listBucket: "approved",
    status: "Approved",
    paymentStatus: "Unpaid",
    paymentMethod: "Online",
  }),
];

const INITIAL_PAID_INVOICES: JobCardListRow[] = [
  jobCardRow("inv-paid-1", "1245", 3, 275, "2026-06-05", {
    status: "Approved",
    paymentStatus: "Paid",
    paymentMethod: "Online",
  }),
  jobCardRow("inv-paid-2", "1244", 4, 88, "2026-06-04", {
    status: "Approved",
    paymentStatus: "Paid",
    paymentMethod: "Online",
  }),
];

function isConvertedUnpaidInvoice(row: JobCardListRow): boolean {
  return getWalletLedgerTab(row.raw) === "invoice" && !isJobCardPaid(row);
}

function cloneRowAsConvertedInvoice(row: JobCardListRow): JobCardListRow {
  const rawBase =
    row.raw && typeof row.raw === "object" ? { ...(row.raw as Record<string, unknown>) } : {};
  return {
    ...row,
    paymentStatus: "Unpaid",
    unpaid: true,
    raw: { ...rawBase, paymentMethod: "Online", paymentStatus: "Unpaid" },
  };
}

function cloneRowAsPaidInvoice(row: JobCardListRow): JobCardListRow {
  const rawBase =
    row.raw && typeof row.raw === "object" ? { ...(row.raw as Record<string, unknown>) } : {};
  return {
    ...row,
    paymentStatus: "Paid",
    unpaid: false,
    raw: { ...rawBase, paymentMethod: "Online", paymentStatus: "Paid" },
  };
}

let mockJobCards: JobCardListRow[] = [...INITIAL_JOB_CARDS];
let mockUnpaid: JobCardListRow[] = INITIAL_JOB_CARDS.filter(isConvertedUnpaidInvoice).map(
  (row) => ({ ...row }),
);
let mockPaid: JobCardListRow[] = [...INITIAL_PAID_INVOICES];
let revision = 0;

const listeners = new Set<() => void>();

function notify() {
  revision += 1;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getRevision() {
  return revision;
}

export function getMockJobCards(): JobCardListRow[] {
  return mockJobCards;
}

export function getMockWalletUnpaid(): JobCardListRow[] {
  return mockUnpaid;
}

export function getMockWalletPaid(): JobCardListRow[] {
  return mockPaid;
}

export function convertJobCardsToMockInvoices(rows: JobCardListRow[]): number {
  let converted = 0;
  for (const row of rows) {
    const convertedRow = cloneRowAsConvertedInvoice(row);
    mockJobCards = mockJobCards.map((card) => (card.id === row.id ? convertedRow : card));
    const existingIdx = mockUnpaid.findIndex((invoice) => invoice.id === row.id);
    if (existingIdx >= 0) {
      mockUnpaid[existingIdx] = convertedRow;
    } else {
      mockUnpaid = [convertedRow, ...mockUnpaid];
    }
    converted += 1;
  }
  notify();
  return converted;
}

export function markMockInvoicesAsPaid(ids: string[]): number {
  let marked = 0;
  for (const id of ids) {
    const unpaidIdx = mockUnpaid.findIndex((row) => row.id === id);
    if (unpaidIdx < 0) continue;
    const paidRow = cloneRowAsPaidInvoice(mockUnpaid[unpaidIdx]);
    mockUnpaid = mockUnpaid.filter((row) => row.id !== id);
    mockPaid = [paidRow, ...mockPaid.filter((row) => row.id !== id)];
    mockJobCards = mockJobCards.map((card) => (card.id === id ? paidRow : card));
    marked += 1;
  }
  notify();
  return marked;
}

export function useMockShopInvoiceLedger() {
  const version = useSyncExternalStore(subscribe, getRevision, getRevision);
  return useMemo(
    () => ({
      jobCards: getMockJobCards(),
      unpaid: getMockWalletUnpaid(),
      paid: getMockWalletPaid(),
      convertToInvoice: convertJobCardsToMockInvoices,
      markAsPaid: markMockInvoicesAsPaid,
    }),
    [version],
  );
}
