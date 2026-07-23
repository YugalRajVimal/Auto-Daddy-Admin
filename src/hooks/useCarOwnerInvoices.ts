import { useCallback, useEffect, useMemo, useState } from "react";
import { getJson } from "../api/mobileAuth";
import {
  businessName,
  carOwnerJobCardStatusLabel,
  formatBusinessPhone,
  isPaidJobCard,
  jobCardLicensePlate,
  normalizeJobCardsPayload,
  resolveInvoiceNo,
  resolveJobCardNo,
  resolveJobCardTotal,
  resolveJobCardsBuckets,
  serviceTypeLabel,
} from "../lib/carOwnerJobCards";
import type { CarOwnerJobCard, CarOwnerJobCardsResponse } from "../types/carOwnerJobCards";
import { useAuth } from "../auth";

function vehicleLabel(jc: CarOwnerJobCard): string {
  const make = jc.vehicleId?.make?.name?.trim() ?? "";
  const model = jc.vehicleId?.make?.model?.trim() ?? "";
  return [make, model].filter(Boolean).join(" ");
}

function isInvoiceEligible(jc: CarOwnerJobCard): boolean {
  const status = (jc.status ?? "").toLowerCase().replace(/\s+/g, "");
  // Invoices list is for online/invoice flow only — never Cash Paid.
  if (status === "cashpaid" || status.includes("cashpaid")) return false;
  if (status.includes("reject") || status.includes("cancel") || status === "pending") return false;

  if (status.includes("convertedtoinvoice")) return true;
  if (jc.invoicePaid === true) return true;

  const payment = (jc.paymentStatus ?? "").trim().toLowerCase();
  return payment === "paid";
}

export type CarOwnerInvoiceRow = {
  id: string;
  /** Job card number (e..g. "12"). */
  jobNo: string;
  /** Invoice id from API (e.g. "INV-4"). */
  invoiceNo: string;
  shopName: string;
  plate: string;
  vehicle: string;
  amount: number;
  createdAt: string;
  paymentStatus: string;
  approvalStatus: string;
  paymentMethod?: string;
  phone?: string;
  service?: string;
};

export function isPaidInvoiceRow(row: CarOwnerInvoiceRow): boolean {
  return row.paymentStatus.trim().toLowerCase() === "paid";
}

function toInvoiceRow(jc: CarOwnerJobCard): CarOwnerInvoiceRow {
  const phone = formatBusinessPhone(jc.business);
  const invoiceNo = resolveInvoiceNo(jc);
  const jobNo = resolveJobCardNo(jc);
  const paid = isPaidJobCard(jc);
  return {
    id: jc._id,
    jobNo: jobNo || "—",
    invoiceNo: invoiceNo || "—",
    shopName: businessName(jc.business),
    plate: jobCardLicensePlate(jc) === "—" ? "" : jobCardLicensePlate(jc),
    vehicle: vehicleLabel(jc),
    amount: resolveJobCardTotal(jc),
    createdAt: jc.createdAt || jc.date || "",
    paymentStatus: paid ? "Paid" : "Unpaid",
    approvalStatus: carOwnerJobCardStatusLabel(jc),
    paymentMethod: jc.paymentMethod || jc.bankName,
    phone: phone || undefined,
    service: serviceTypeLabel(jc),
  };
}

export type InvoiceTab = "paid" | "unpaid";

export function useCarOwnerInvoices() {
  const { token } = useAuth();
  const [items, setItems] = useState<CarOwnerJobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await getJson<CarOwnerJobCardsResponse>("/api/user/job-cards", token);
    if (!res.ok || !res.data?.success) {
      setItems([]);
      setLoading(false);
      setError("Could not load invoices.");
      return;
    }

    const next = normalizeJobCardsPayload(
      resolveJobCardsBuckets(res.data as unknown as Record<string, unknown>),
    );
    setItems(next);
    setLoading(false);
    setError(null);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const invoiceRows = useMemo(() => {
    return items
      .filter(isInvoiceEligible)
      .filter((jc) => Boolean(resolveInvoiceNo(jc)))
      .map(toInvoiceRow)
      .sort((a, b) => {
        const at = Date.parse(a.createdAt);
        const bt = Date.parse(b.createdAt);
        if (Number.isFinite(at) && Number.isFinite(bt)) return bt - at;
        return String(b.createdAt).localeCompare(String(a.createdAt));
      });
  }, [items]);

  const paidInvoices = useMemo(
    () => invoiceRows.filter((row) => isPaidInvoiceRow(row)),
    [invoiceRows],
  );

  const unpaidInvoices = useMemo(
    () => invoiceRows.filter((row) => !isPaidInvoiceRow(row)),
    [invoiceRows],
  );

  const findJobCardById = useCallback(
    (id: string) => items.find((jc) => jc._id === id) ?? null,
    [items],
  );

  return {
    loading,
    error,
    refresh: load,
    invoiceRows,
    paidInvoices,
    unpaidInvoices,
    findJobCardById,
  };
}
