import { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiPrinter } from "react-icons/fi";
import { toast } from "react-toastify";
import { Skeleton } from "../common/Skeleton";
import {
  buildBusinessBlock,
  buildCustomerBlock,
  currencyLabelFromCode,
  estimateTotals,
  extractEstimateLines,
  formatEstimateDate,
  formatEstimateMoney,
  pickBusinessHstNumber,
  pickInvoiceNoFromRecord,
  pickJobNoFromRecord,
} from "../JobCard/shopJobCardEstimate";
import { resolveInvoiceTheme } from "../shop/invoice-templates/invoiceTheme";
import { fetchCarOwnerJobCardById, resolveCarOwnerJobCardForViewer } from "../../lib/carOwnerJobCards";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import { printDomElement } from "../../utils/printDomElement";
import type { CarOwnerJobCard, CarOwnerJobCardBusiness } from "../../types/carOwnerJobCards";
import type { ShopProfileBusiness } from "../../types/shopOwner";

const OUTLINE_BTN_CLASS =
  "inline-flex items-center gap-1.5 rounded border border-gray-400 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 hover:bg-gray-50 disabled:opacity-60";

/** Match Wallet invoice preview (magenta / modern template). */
const OWNER_INVOICE_THEME = resolveInvoiceTheme("modern-invoice-v2");

function nested(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function asShopBusiness(business: CarOwnerJobCard["business"] | null | undefined): ShopProfileBusiness | null {
  if (!business || typeof business === "string") return null;
  const b = business as CarOwnerJobCardBusiness;
  return {
    _id: b._id,
    businessName: b.businessName,
    businessPhone: b.businessPhone ?? b.phone,
    city: b.cityName ?? b.city,
    address: b.businessAddress ?? b.address,
    businessAddress: b.businessAddress ?? b.address,
    pincode: b.pincode,
    businessLogo: b.businessLogo,
    businessHSTNumber: b.businessHSTNumber,
    gstPercent: b.gst,
    invoiceTemplateSlug: "modern-invoice-v2",
  };
}

function parseHstRate(job: Record<string, unknown>, business: ShopProfileBusiness | null): number {
  const payable = nested(job.payableAmounts);
  const fromPayable = Number(payable?.gstRate);
  if (Number.isFinite(fromPayable) && fromPayable > 0) return fromPayable;
  const fromBusiness = Number(business?.gstPercent);
  if (Number.isFinite(fromBusiness) && fromBusiness > 0) return fromBusiness;
  const fromJobBusiness = nested(job.business);
  const embeddedGst = Number(fromJobBusiness?.gst ?? fromJobBusiness?.gstPercent);
  if (Number.isFinite(embeddedGst) && embeddedGst > 0) return embeddedGst;
  return 13;
}

function EstimateMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9.5rem_minmax(0,1fr)] items-baseline gap-x-2">
      <span className="text-right text-sm font-semibold text-gray-700">{label}</span>
      <span className="min-w-0 text-left text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function EstimateTotalsFooter({
  subtotal,
  discount,
  hst,
  roundOff,
  total,
  totalLabel,
  labelColSpan,
}: {
  subtotal: string;
  discount?: string;
  hst: string;
  roundOff?: string;
  total: string;
  totalLabel: string;
  labelColSpan: number;
}) {
  const labelClass =
    "border-0 bg-transparent px-2 py-1 text-right text-sm font-semibold text-gray-800";
  const valueClass =
    "border-0 bg-transparent px-2 py-1 text-right text-sm font-semibold tabular-nums text-gray-800";
  const totalStyle = {
    backgroundColor: OWNER_INVOICE_THEME.accent,
    color: OWNER_INVOICE_THEME.accentText,
  };
  const totalCellClass = "border-0 px-2 py-2 text-xs font-bold leading-none";

  return (
    <tfoot>
      <tr>
        <td colSpan={labelColSpan} className={`${labelClass} pt-3`}>
          Subtotal :
        </td>
        <td className={`${valueClass} pt-3`}>{subtotal}</td>
      </tr>
      {discount ? (
        <tr>
          <td colSpan={labelColSpan} className={labelClass}>
            Discount :
          </td>
          <td className={`${valueClass} text-emerald-700`}>−{discount}</td>
        </tr>
      ) : null}
      <tr>
        <td colSpan={labelColSpan} className={labelClass}>
          HST :
        </td>
        <td className={valueClass}>{hst}</td>
      </tr>
      {roundOff ? (
        <tr>
          <td colSpan={labelColSpan} className={labelClass}>
            Round off :
          </td>
          <td className={valueClass}>{roundOff}</td>
        </tr>
      ) : null}
      <tr>
        <td colSpan={labelColSpan} className={`${totalCellClass} text-right`} style={totalStyle}>
          {totalLabel}
        </td>
        <td className={`${totalCellClass} text-right tabular-nums`} style={totalStyle}>
          {total}
        </td>
      </tr>
    </tfoot>
  );
}

export type OwnerInvoiceEstimateViewProps = {
  jobCardId: string;
  token: string | null;
  /** Cached list card used while detail loads / as fallback. */
  cachedJobCard?: CarOwnerJobCard | null;
  invoiceNoHint?: string | null;
  callingCode?: string;
  onBack?: () => void;
  /** Hide Back/Print toolbar (e.g. when the dialog chrome already has actions). */
  hideToolbar?: boolean;
};

export default function OwnerInvoiceEstimateView({
  jobCardId,
  token,
  cachedJobCard = null,
  invoiceNoHint = null,
  callingCode = "+1",
  onBack,
  hideToolbar = false,
}: OwnerInvoiceEstimateViewProps) {
  const [job, setJob] = useState<Record<string, unknown> | null>(
    cachedJobCard ? ({ ...cachedJobCard } as Record<string, unknown>) : null,
  );
  const [loading, setLoading] = useState(!cachedJobCard);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!jobCardId) return;
    setLoading(true);
    setError(null);

    if (cachedJobCard && cachedJobCard._id === jobCardId) {
      setJob({ ...cachedJobCard } as Record<string, unknown>);
    }

    if (!token) {
      if (!cachedJobCard) {
        setError("Please log in again.");
        setJob(null);
      }
      setLoading(false);
      return;
    }

    try {
      const res = await fetchCarOwnerJobCardById(token, jobCardId);
      if (res.ok && res.data) {
        const resolved = resolveCarOwnerJobCardForViewer(res.data);
        if (resolved) {
          setJob({ ...resolved } as Record<string, unknown>);
          setLoading(false);
          return;
        }
      }
      if (cachedJobCard && cachedJobCard._id === jobCardId) {
        setJob({ ...cachedJobCard } as Record<string, unknown>);
        setLoading(false);
        return;
      }
      setError("Could not load invoice.");
      setJob(null);
    } catch (err) {
      if (cachedJobCard && cachedJobCard._id === jobCardId) {
        setJob({ ...cachedJobCard } as Record<string, unknown>);
      } else {
        setError(err instanceof Error ? err.message : "Could not load invoice.");
        setJob(null);
      }
    } finally {
      setLoading(false);
    }
  }, [token, jobCardId, cachedJobCard]);

  useEffect(() => {
    void load();
  }, [load]);

  const business = useMemo(
    () => asShopBusiness((job?.business as CarOwnerJobCard["business"]) ?? cachedJobCard?.business),
    [job, cachedJobCard],
  );
  const hstRate = job ? parseHstRate(job, business) : 13;
  const lines = useMemo(
    () => (job ? extractEstimateLines(job, hstRate) : []),
    [job, hstRate],
  );
  const totals = useMemo(
    () =>
      job
        ? estimateTotals(lines, hstRate, job, { includeHst: true })
        : { subtotal: 0, discount: 0, hst: 0, roundOff: 0, total: 0 },
    [job, lines, hstRate],
  );

  const docNo = useMemo(() => {
    const fromJob = pickInvoiceNoFromRecord(job);
    if (fromJob) return fromJob;
    const hint = invoiceNoHint?.trim();
    if (hint && hint !== "—") return hint;
    return pickJobNoFromRecord(job) || "—";
  }, [job, invoiceNoHint]);

  const currencyLabel = currencyLabelFromCode(callingCode);
  const businessBlock = buildBusinessBlock(business);
  const customerBlock = job ? buildCustomerBlock(job) : { name: "—", company: "", address: "" };
  const logoUrl = normalizeMediaUrl(business?.businessLogo);
  const hstNumber = pickBusinessHstNumber(business, job) || "—";
  const theme = OWNER_INVOICE_THEME;

  const handlePrint = () => {
    const node = document.getElementById("owner-invoice-estimate-print");
    if (!(node instanceof HTMLElement)) {
      toast.error("Nothing to print.");
      return;
    }
    printDomElement(node, "Invoice");
  };

  if (loading && !job) {
    return (
      <div className="space-y-3">
        {!hideToolbar && onBack ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={onBack} className={OUTLINE_BTN_CLASS}>
              <FiArrowLeft size={13} aria-hidden />
              Back
            </button>
          </div>
        ) : null}
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-3">
        {!hideToolbar && onBack ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={onBack} className={OUTLINE_BTN_CLASS}>
              <FiArrowLeft size={13} aria-hidden />
              Back
            </button>
          </div>
        ) : null}
        <div className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-8 text-center text-sm text-rose-800">
          <p className="font-semibold">{error ?? "Could not load invoice."}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 rounded-xl bg-ad-purple px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 print:space-y-0">
      {!hideToolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
          {onBack ? (
            <button type="button" onClick={onBack} className={OUTLINE_BTN_CLASS}>
              <FiArrowLeft size={13} aria-hidden />
              Back
            </button>
          ) : null}
          <div className={`flex flex-wrap items-center gap-2 ${onBack ? "" : "ml-auto"}`}>
            <button type="button" onClick={handlePrint} className={OUTLINE_BTN_CLASS}>
              <FiPrinter size={13} aria-hidden />
              Print
            </button>
          </div>
        </div>
      ) : null}

      <div
        id="owner-invoice-estimate-print"
        className="relative overflow-hidden rounded border bg-white p-4 shadow-sm sm:p-6 print:border-0 print:p-0 print:shadow-none"
        style={{ borderColor: theme.border }}
      >
        <div className="mb-4 h-1.5 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6" style={{ backgroundColor: theme.accent }} />

        <div className="relative z-10 mb-4 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-12 max-w-[8rem] object-contain" />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded text-xs font-bold"
                style={{ backgroundColor: theme.accent, color: theme.accentText }}
              >
                AD
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold" style={{ color: theme.title }}>
                {businessBlock.name}
              </p>
            </div>
          </div>
          <h2
            className="shrink-0 text-2xl font-bold uppercase tracking-wide"
            style={{ color: theme.title }}
          >
            Invoice
          </h2>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4 text-sm text-gray-800">
            <div>
              {businessBlock.address ? <p>{businessBlock.address}</p> : null}
              {businessBlock.phone ? <p>{businessBlock.phone}</p> : null}
            </div>
            <div>
              <p className="font-bold text-gray-900">To</p>
              <p className="font-semibold">{customerBlock.name}</p>
              {customerBlock.company ? <p>{customerBlock.company}</p> : null}
              {customerBlock.address ? <p>{customerBlock.address}</p> : null}
            </div>
          </div>

          <div className="text-sm lg:ml-auto lg:justify-self-end">
            <div className="w-full min-w-[18rem] max-w-[20rem] space-y-1">
              <EstimateMetaRow label="Invoice No. :" value={docNo} />
              <EstimateMetaRow
                label="Date :"
                value={formatEstimateDate(job.date ?? job.serviceDate ?? job.jobDate ?? job.createdAt)}
              />
              <EstimateMetaRow label="HST No. :" value={hstNumber} />
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-5 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr
                className="text-left text-xs font-bold"
                style={{ backgroundColor: theme.accent, color: theme.accentText }}
              >
                <th className="border border-gray-300 px-2 py-2">S. No.</th>
                <th className="border border-gray-300 px-2 py-2">Description</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Unit Cost</th>
                <th className="border border-gray-300 px-2 py-2 text-center">Qty</th>
                <th className="border border-gray-300 px-2 py-2 text-right">HST</th>
                <th className="border border-gray-300 px-2 py-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-gray-300 px-2 py-4 text-center text-gray-500">
                    No line items
                  </td>
                </tr>
              ) : (
                lines.map((line, index) => (
                  <tr
                    key={`${line.description}-${index}`}
                    style={index % 2 === 1 ? { backgroundColor: theme.stripe } : undefined}
                  >
                    <td className="border border-gray-300 px-2 py-2 align-top">{index + 1}.</td>
                    <td className="border border-gray-300 px-2 py-2 align-top">{line.description}</td>
                    <td className="border border-gray-300 px-2 py-2 text-right align-top tabular-nums">
                      {formatEstimateMoney(line.unitCost, callingCode)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-top tabular-nums">
                      {line.qty}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right align-top tabular-nums">
                      {line.hstRate > 0 ? `${line.hstRate}%` : "—"}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right align-top tabular-nums">
                      {formatEstimateMoney(line.price, callingCode)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <EstimateTotalsFooter
              subtotal={formatEstimateMoney(totals.subtotal, callingCode)}
              discount={
                totals.discount > 0
                  ? formatEstimateMoney(totals.discount, callingCode)
                  : undefined
              }
              hst={formatEstimateMoney(totals.hst, callingCode)}
              roundOff={
                totals.roundOff !== 0
                  ? formatEstimateMoney(totals.roundOff, callingCode)
                  : undefined
              }
              total={formatEstimateMoney(totals.total, callingCode)}
              totalLabel={`Total (${currencyLabel}) :`}
              labelColSpan={5}
            />
          </table>
        </div>

        <p className="relative z-10 mt-6 text-right text-[10px] text-gray-500 print:mt-4">
          This estimate was sent using AutoDaddy
        </p>

        <div className="mt-4 h-1.5 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6" style={{ backgroundColor: theme.accent }} />
      </div>
    </div>
  );
}
