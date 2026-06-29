import { formatCurrencyAmount } from "../../lib/currency";
import { formatPhoneDisplay, phoneDigits } from "../../lib/phoneFormat";
import { resolveJobCardFromApiResponse } from "../../lib/shopOwnerJobCardsApi";
import type { ShopProfileBusiness } from "../../types/shopOwner";

function s(v: unknown): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function nonEmpty(v: unknown): string | undefined {
  const value = s(v);
  return value || undefined;
}

function nested(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function parseNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function extractSavedJobCardId(data: unknown, fallbackId?: string | null): string | undefined {
  const job = resolveJobCardFromApiResponse(data) ?? nested(data);
  const fromJob = job ? s(job._id ?? job.id) : "";
  if (fromJob) return fromJob;
  if (!data || typeof data !== "object") return fallbackId ?? undefined;
  const root = data as Record<string, unknown>;
  const direct = s(root._id ?? root.id ?? root.jobCardId);
  return direct || fallbackId || undefined;
}

export function formatEstimateDate(value: unknown): string {
  const raw = s(value);
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const [y, m, day] = raw.slice(0, 10).split("-");
      return `${day}/${m}/${y}`;
    }
    return raw;
  }
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export type EstimateLine = {
  description: string;
  unitCost: number;
  qty: number;
  hstRate: number;
  price: number;
};

export function extractEstimateLines(job: Record<string, unknown>, hstRate: number): EstimateLine[] {
  const lines: EstimateLine[] = [];
  const services = job.services;
  if (!Array.isArray(services)) return lines;

  for (const svc of services) {
    const block = nested(svc);
    if (!block) continue;
    const subs = block.subServices ?? block.selectedSubServices;
    if (!Array.isArray(subs)) continue;
    for (const subRaw of subs) {
      const sub = nested(subRaw);
      if (!sub) continue;
      const unitCost = parseNum(sub.unitPrice ?? sub.price);
      const qty = parseNum(sub.qty ?? sub.unit ?? sub.labourDuration ?? 1) || 1;
      const labour = parseNum(sub.labourCost ?? sub.labourCharge);
      const rawPrice = parseNum(sub.price);
      const price = rawPrice > 0 ? rawPrice : unitCost * qty + labour;
      const desc = [s(sub.name), s(sub.desc)].filter(Boolean).join(" — ") || "Service";
      lines.push({
        description: desc,
        unitCost: unitCost > 0 ? unitCost : Math.max(0, (price - labour) / qty),
        qty,
        hstRate,
        price,
      });
    }
  }
  return lines;
}

export function formatEstimateMoney(
  amount: number | string | null | undefined,
  countryCode: string | null | undefined,
): string {
  return formatCurrencyAmount(amount, countryCode, { fallback: "—", includeSign: false });
}

export function estimateStatusRibbon(job: Record<string, unknown>): string {
  const payment = s(job.paymentStatus).toLowerCase();
  if (payment.includes("paid") || payment.includes("invoice")) return "Invoiced";
  const status = s(job.status ?? job.jobStatus).toLowerCase();
  if (status.includes("approved")) return "Approved";
  if (status.includes("reject")) return "Rejected";
  if (status.includes("pending")) return "Pending";
  return payment ? s(job.paymentStatus) : "Estimate";
}

export function pickJobNoFromRecord(record: Record<string, unknown> | null | undefined): string | undefined {
  if (!record) return undefined;
  const direct =
    nonEmpty(record.jobCardNumber) ??
    nonEmpty(record.jobNo) ??
    nonEmpty(record.jobNumber) ??
    nonEmpty(record.jobCode) ??
    nonEmpty(record.displayJobNo) ??
    nonEmpty(record.invoiceNumber) ??
    nonEmpty(record.jobCardNo);
  if (direct) return direct;

  for (const [key, value] of Object.entries(record)) {
    if (!/job.*no|card.*num/i.test(key)) continue;
    const picked = nonEmpty(value);
    if (picked) return picked;
  }
  return undefined;
}

export function pickJobNoFromListRow(row: {
  jobNo?: string;
  raw?: unknown;
  id?: string;
}): string | undefined {
  const direct = row.jobNo?.trim();
  if (direct) return direct;
  if (row.raw && typeof row.raw === "object") {
    const fromRaw = pickJobNoFromRecord(row.raw as Record<string, unknown>);
    if (fromRaw) return fromRaw;
  }
  return undefined;
}

/** Matches the job no column in the job cards table. */
export function formatJobCardTableNo(jobNo: string | undefined): string {
  const raw = (jobNo ?? "").trim().replace(/^#/, "");
  if (!raw) return "";
  const stripped = raw.replace(/^job\s*#?\s*/i, "").trim();
  if (!stripped) return "";
  if (/^j/i.test(stripped)) {
    return stripped.replace(/^j/i, "J ");
  }
  return `J ${stripped}`;
}

export function resolveJobCardDisplayNo(
  listRow: { jobNo?: string; raw?: unknown; id?: string } | null | undefined,
  job?: Record<string, unknown> | null,
): string {
  const fromList = listRow ? pickJobNoFromListRow(listRow) : undefined;
  const fromJob = job ? pickJobNoFromRecord(job) : undefined;
  const raw = fromList ?? fromJob;
  if (!raw) return "—";

  const documentNo = formatJobCardDocumentNo(raw);
  if (documentNo) return documentNo;

  const tableNo = formatJobCardTableNo(raw);
  if (tableNo) return tableNo;

  return raw;
}

export function pickBusinessHstNumber(
  business: ShopProfileBusiness | null | undefined,
  job?: Record<string, unknown> | null,
): string {
  const profile = business as (ShopProfileBusiness & { businessHSTNumber?: string; gstNumber?: string }) | null;
  const fromProfile =
    profile?.hstNumber?.trim() ||
    profile?.businessHSTNumber?.trim() ||
    profile?.gstNumber?.trim();
  if (fromProfile) return fromProfile;

  const embedded =
    nested(job?.business) ??
    nested(job?.businessProfile) ??
    nested(job?.shop);
  if (embedded) {
    return (
      s(embedded.businessHSTNumber) ??
      s(embedded.hstNumber) ??
      s(embedded.gstNumber) ??
      ""
    );
  }
  return "";
}

export function formatJobCardDocumentNo(jobNo: string | undefined): string {
  const raw = (jobNo ?? "").trim().replace(/^#/, "");
  if (!raw) return "";
  const stripped = raw.replace(/^job\s*#?\s*/i, "").trim();
  if (!stripped) return "";
  if (/^j\s*#?/i.test(stripped)) {
    return stripped.replace(/^j\s*#?\s*/i, "J # ");
  }
  return `J # ${stripped}`;
}

export function estimateDocumentNo(
  job: Record<string, unknown>,
  fallbackJobNo?: string | null,
  listRow?: { jobNo?: string; raw?: unknown; id?: string } | null,
): string {
  return resolveJobCardDisplayNo(listRow, {
    ...job,
    ...(fallbackJobNo && !pickJobNoFromRecord(job) ? { jobNo: fallbackJobNo } : {}),
  });
}

export function buildBusinessBlock(business: ShopProfileBusiness | null | undefined) {
  const name = s(business?.businessName) || "Auto Shop";
  const address = [s(business?.address), s(business?.city)].filter(Boolean).join(", ");
  const phone = phoneDigits(business?.businessPhone);
  return { name, address, phone: phone ? formatPhoneDisplay(phone) : "" };
}

export function buildCustomerBlock(job: Record<string, unknown>) {
  const customer =
    nested(job.customerId) ?? nested(job.customer) ?? nested(job.carOwner);
  const name = s(customer?.name) || "—";
  const company = s(customer?.businessName ?? customer?.companyName);
  const address = [
    s(customer?.address),
    [s(customer?.city), s(customer?.pincode)].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  return { name, company, address };
}

export function estimateTotals(lines: EstimateLine[], hstRate: number, job: Record<string, unknown>) {
  const subtotal = lines.reduce((sum, line) => sum + line.price, 0);
  const payable = nested(job.payableAmounts);
  const gstAmount = parseNum(payable?.gstAmount);
  const roundOff = parseNum(payable?.roundOff);
  const hst =
    gstAmount > 0 ? gstAmount : hstRate > 0 ? (subtotal * hstRate) / 100 : 0;
  const computedTotal = subtotal + hst + roundOff;
  const apiTotal =
    parseNum(job.totalPayableAmount) ||
    parseNum(payable?.cash) ||
    parseNum(payable?.online) ||
    parseNum(payable?.invoiceTotal) ||
    parseNum(payable?.total);
  const total =
    apiTotal > 0 && Math.abs(apiTotal - computedTotal) < 0.01
      ? apiTotal
      : computedTotal > 0
        ? computedTotal
        : apiTotal;
  return { subtotal, hst, roundOff, total };
}

export function extractJobNoFromApiEnvelope(resp: unknown): string | undefined {
  if (!resp || typeof resp !== "object") return undefined;
  const root = resp as Record<string, unknown>;
  const fromRoot = pickJobNoFromRecord(root);
  if (fromRoot) return fromRoot;
  const data = nested(root.data);
  if (!data) return undefined;
  return pickJobNoFromRecord(data) ?? pickJobNoFromRecord(nested(data.jobCard));
}

export function currencyLabelFromCode(countryCode: string | null | undefined): string {
  if (countryCode === "+91") return "Rs.";
  return "CAD";
}
