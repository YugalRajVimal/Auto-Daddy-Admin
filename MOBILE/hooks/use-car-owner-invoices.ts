import { useAuth } from "@/context/auth-provider";
import { getJson } from "@/lib/api";
import {
  businessName,
  carOwnerJobCardStatusLabel,
  isPaidJobCard,
  jobCardLicensePlate,
  resolveInvoiceNo,
  resolveJobCardNo,
  resolveJobCardTotal,
  serviceTypeLabel,
} from "@/lib/car-owner-job-cards";
import type {
  CarOwnerJobCard,
  CarOwnerJobCardsBuckets,
  CarOwnerJobCardsResponse,
} from "@/types/car-owner-job-cards";
import { useCallback, useEffect, useMemo, useState } from "react";

function resolveJobCardsBuckets(
  payload: CarOwnerJobCardsResponse | undefined
): CarOwnerJobCardsBuckets | undefined {
  if (!payload || typeof payload !== "object") return undefined;

  const hasBuckets = (obj: Record<string, unknown>) =>
    "pending" in obj || "approved" in obj || "rejected" in obj || "autoRejected" in obj;

  if (hasBuckets(payload as Record<string, unknown>)) {
    return payload as CarOwnerJobCardsBuckets;
  }

  const data = payload.data;
  if (data && typeof data === "object" && hasBuckets(data as Record<string, unknown>)) {
    return data;
  }

  return undefined;
}

function normalizeJobCardsPayload(payload: CarOwnerJobCardsBuckets | undefined): CarOwnerJobCard[] {
  if (!payload) return [];
  const pending = (Array.isArray(payload.pending) ? payload.pending : []).map((jc) => ({
    ...jc,
    status: jc.status?.trim() ? jc.status : "Pending",
  }));
  const approved = Array.isArray(payload.approved) ? payload.approved : [];
  const rejected = Array.isArray(payload.rejected) ? payload.rejected : [];
  const autoRejected = (Array.isArray(payload.autoRejected) ? payload.autoRejected : []).map(
    (jc) => ({
      ...jc,
      status: jc.status?.trim() ? jc.status : "AutoRejected",
    })
  );
  return [...pending, ...approved, ...rejected, ...autoRejected];
}

function isInvoiceEligible(jc: CarOwnerJobCard): boolean {
  const status = (jc.status ?? "").toLowerCase().replace(/\s+/g, "");
  if (status === "cashpaid" || status.includes("cashpaid")) return false;
  if (status.includes("reject") || status.includes("cancel") || status === "pending") return false;

  if (status.includes("convertedtoinvoice")) return true;
  if (jc.invoicePaid === true) return true;

  const payment = (jc.paymentStatus ?? "").trim().toLowerCase();
  return payment === "paid";
}

function vehicleLabel(jc: CarOwnerJobCard): string {
  const make = jc.vehicleId?.make?.name?.trim() ?? "";
  const model = jc.vehicleId?.make?.model?.trim() ?? "";
  return [make, model].filter(Boolean).join(" ");
}

export type CarOwnerInvoiceRow = {
  id: string;
  jobNo: string;
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
    service: serviceTypeLabel(jc),
  };
}

export function useCarOwnerInvoices() {
  const { token, sessionRevision } = useAuth();
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

    const res = await getJson<CarOwnerJobCardsResponse>("/api/user/job-cards", {
      authToken: token,
    });
    if (!res.ok || res.data?.success === false) {
      setItems([]);
      setLoading(false);
      setError("Could not load invoices.");
      return;
    }

    setItems(normalizeJobCardsPayload(resolveJobCardsBuckets(res.data ?? undefined)));
    setLoading(false);
    setError(null);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load, sessionRevision]);

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
    [invoiceRows]
  );

  const unpaidInvoices = useMemo(
    () => invoiceRows.filter((row) => !isPaidInvoiceRow(row)),
    [invoiceRows]
  );

  const findJobCardById = useCallback(
    (id: string) => items.find((jc) => jc._id === id) ?? null,
    [items]
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
