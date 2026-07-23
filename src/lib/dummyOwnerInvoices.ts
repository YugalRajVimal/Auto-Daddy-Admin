import type { CarOwnerInvoiceRow } from "../hooks/useCarOwnerInvoices";

/** Placeholder invoices for UI development — remove when API data is wired. */
export const DUMMY_OWNER_INVOICES: CarOwnerInvoiceRow[] = [
  {
    id: "dummy-invoice-paid",
    jobNo: "1256",
    invoiceNo: "INV-1",
    shopName: "A.B Auto shop",
    plate: "GVTY 884",
    vehicle: "",
    amount: 185,
    createdAt: "2026-06-14T12:00:00.000Z",
    paymentStatus: "Paid",
    approvalStatus: "Approved",
    phone: "999 999 9914",
    service: "Safety",
  },
  {
    id: "dummy-invoice-unpaid",
    jobNo: "1256",
    invoiceNo: "INV-2",
    shopName: "A.B Auto shop",
    plate: "GVTY 884",
    vehicle: "",
    amount: 185,
    createdAt: "2026-06-14T12:00:00.000Z",
    paymentStatus: "Unpaid",
    approvalStatus: "Pending",
    phone: "999 999 9914",
    service: "Safety",
  },
];
