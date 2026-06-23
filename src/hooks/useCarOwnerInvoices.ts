import { useCallback, useEffect, useMemo, useState } from "react";
import { getJson } from "../api/mobileAuth";
import type {
  CarOwnerJobCard,
  CarOwnerJobCardsBuckets,
  CarOwnerJobCardsResponse,
} from "../types/carOwnerJobCards";
import { useAuth } from "../auth";

function resolveJobCardsBuckets(payload: CarOwnerJobCardsResponse | undefined): CarOwnerJobCardsBuckets | undefined {
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
  const autoRejected = (Array.isArray(payload.autoRejected) ? payload.autoRejected : []).map((jc) => ({
    ...jc,
    status: jc.status?.trim() ? jc.status : "AutoRejected",
  }));
  return [...pending, ...approved, ...rejected, ...autoRejected];
}

function isApprovedInvoice(jc: CarOwnerJobCard): boolean {
  const status = (jc.status ?? "").toLowerCase();
  if (status.includes("reject") || status.includes("cancel") || status.includes("pending")) return false;
  return status.includes("approve") || status.includes("complete") || status.includes("done");
}

function isPaidInvoice(jc: CarOwnerJobCard): boolean {
  return (jc.paymentStatus ?? "").trim().toLowerCase() === "paid";
}

function businessName(business: CarOwnerJobCard["business"]): string {
  if (!business || typeof business === "string") return "Auto shop";
  return business.businessName?.trim() || "Auto shop";
}

function vehiclePlate(jc: CarOwnerJobCard): string {
  return jc.vehicleId?.licensePlateNo?.trim().toUpperCase() || "";
}

function vehicleLabel(jc: CarOwnerJobCard): string {
  const make = jc.vehicleId?.make?.name?.trim() ?? "";
  const model = jc.vehicleId?.make?.model?.trim() ?? "";
  return [make, model].filter(Boolean).join(" ");
}

export type CarOwnerInvoiceRow = {
  id: string;
  jobNo: string;
  shopName: string;
  plate: string;
  vehicle: string;
  amount: number;
  createdAt: string;
  paymentStatus: string;
  paymentMethod?: string;
  phone?: string;
  service?: string;
};

export function isPaidInvoiceRow(row: CarOwnerInvoiceRow): boolean {
  return row.paymentStatus.trim().toLowerCase() === "paid";
}

function toInvoiceRow(jc: CarOwnerJobCard): CarOwnerInvoiceRow {
  return {
    id: jc._id,
    jobNo: jc.jobNo?.trim() || "—",
    shopName: businessName(jc.business),
    plate: vehiclePlate(jc),
    vehicle: vehicleLabel(jc),
    amount: jc.totalPayableAmount ?? 0,
    createdAt: jc.createdAt,
    paymentStatus: jc.paymentStatus ?? "",
    paymentMethod: jc.paymentMethod,
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

    const next = normalizeJobCardsPayload(resolveJobCardsBuckets(res.data));
    setItems(next);
    setLoading(false);
    setError(null);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const invoiceRows = useMemo(() => {
    const approved = items.filter(isApprovedInvoice);
    return approved.map(toInvoiceRow).sort((a, b) => {
      const at = Date.parse(a.createdAt);
      const bt = Date.parse(b.createdAt);
      if (Number.isFinite(at) && Number.isFinite(bt)) return bt - at;
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
  }, [items]);

  const paidInvoices = useMemo(
    () => invoiceRows.filter((row) => items.some((jc) => jc._id === row.id && isPaidInvoice(jc))),
    [invoiceRows, items]
  );

  const unpaidInvoices = useMemo(
    () => invoiceRows.filter((row) => items.some((jc) => jc._id === row.id && !isPaidInvoice(jc))),
    [invoiceRows, items]
  );

  return {
    loading,
    error,
    refresh: load,
    paidInvoices,
    unpaidInvoices,
  };
}
