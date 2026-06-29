import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCopy, FiPrinter } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "react-toastify";
import useAuth from "../../auth/useAuth";
import { useShopOwnerCallingCode } from "../../hooks/useShopOwnerCallingCode";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import { fetchJobCardById, resendJobCardNotification } from "../../lib/shopOwnerMutations";
import { resolveJobCardFromApiResponse } from "../../lib/shopOwnerJobCardsApi";
import { ShopListSkeleton } from "../shop/ShopListSkeletons";
import { ShopErrorPanel } from "../shop/ShopPanels";
import {
  buildBusinessBlock,
  buildCustomerBlock,
  currencyLabelFromCode,
  estimateDocumentNo,
  estimateStatusRibbon,
  estimateTotals,
  extractEstimateLines,
  extractJobNoFromApiEnvelope,
  formatEstimateDate,
  formatEstimateMoney,
  pickBusinessHstNumber,
  pickJobNoFromListRow,
  pickJobNoFromRecord,
} from "./shopJobCardEstimate";
import type { JobCardListRow } from "../../lib/shopOwnerJobCards";

const OUTLINE_BTN_CLASS =
  "inline-flex items-center gap-1.5 rounded border border-gray-400 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 hover:bg-gray-50 disabled:opacity-60";

const WHATSAPP_BTN_CLASS =
  "inline-flex items-center gap-1.5 rounded border border-[#25D366] bg-white px-3 py-1.5 text-xs font-bold text-[#1a9e47] hover:bg-[#e8f8ee] disabled:opacity-60";

function EstimateMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[9.5rem_minmax(0,1fr)] items-baseline gap-x-2">
      <span className="text-right text-sm font-semibold text-gray-700">{label}</span>
      <span className="min-w-0 text-left text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function TotalsRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <>
      <span
        className={`text-right ${strong ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}
      >
        {label}
      </span>
      <span className={`text-right tabular-nums ${strong ? "font-bold text-gray-900" : "text-gray-800"}`}>
        {value}
      </span>
    </>
  );
}

function EstimateTotalsBlock({
  subtotal,
  hst,
  roundOff,
  total,
  totalLabel,
}: {
  subtotal: string;
  hst: string;
  roundOff?: string;
  total: string;
  totalLabel: string;
}) {
  return (
    <div className="ml-auto w-[19rem] text-sm sm:w-[21rem]">
      <div className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1">
        <TotalsRow label="Subtotal :" value={subtotal} />
        <TotalsRow label="HST :" value={hst} />
        {roundOff ? <TotalsRow label="Round Off :" value={roundOff} /> : null}
        <div className="col-span-2 grid grid-cols-subgrid gap-x-6 bg-gray-100 py-2 font-bold">
          <TotalsRow label={totalLabel} value={total} strong />
        </div>
      </div>
    </div>
  );
}

type ShopJobCardEstimateViewProps = {
  jobCardId: string;
  listRow?: JobCardListRow | null;
  jobNoHint?: string | null;
  onBack?: () => void;
};

function parseHstRate(business: ReturnType<typeof useShopOwnerPortal>["business"]) {
  const raw = business?.gstPercent;
  const n = typeof raw === "string" ? Number.parseFloat(raw) : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 13;
}

export default function ShopJobCardEstimateView({
  jobCardId,
  listRow = null,
  jobNoHint = null,
  onBack,
}: ShopJobCardEstimateViewProps) {
  const { token } = useAuth();
  const callingCode = useShopOwnerCallingCode();
  const { business } = useShopOwnerPortal();
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!token || !jobCardId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchJobCardById(token, jobCardId);
      if (!res.ok) throw new Error("Could not load job card.");
      const resolved = resolveJobCardFromApiResponse(res.data);
      if (!resolved) throw new Error("Could not load job card.");
      const listNo = listRow ? pickJobNoFromListRow(listRow) : undefined;
      const envelopeNo = extractJobNoFromApiEnvelope(res.data);
      const hintNo = jobNoHint?.trim() || undefined;
      const mergedNo = listNo ?? envelopeNo ?? hintNo;
      if (mergedNo && !pickJobNoFromRecord(resolved)) {
        resolved.jobNo = mergedNo;
      }
      setJob(resolved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load job card.");
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [token, jobCardId, listRow, jobNoHint]);

  useEffect(() => {
    void load();
  }, [load]);

  const hstRate = parseHstRate(business);
  const lines = useMemo(
    () => (job ? extractEstimateLines(job, hstRate) : []),
    [job, hstRate],
  );
  const totals = useMemo(
    () => (job ? estimateTotals(lines, hstRate, job) : { subtotal: 0, hst: 0, roundOff: 0, total: 0 }),
    [job, lines, hstRate],
  );

  const docNo = useMemo(
    () => estimateDocumentNo(job ?? {}, jobNoHint, listRow),
    [job, jobNoHint, listRow],
  );
  const currencyLabel = currencyLabelFromCode(callingCode);
  const businessBlock = buildBusinessBlock(business);
  const customerBlock = job ? buildCustomerBlock(job) : { name: "—", company: "", address: "" };
  const logoUrl = normalizeMediaUrl(business?.businessLogo);
  const hstNumber = pickBusinessHstNumber(business, job) || "—";

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    if (!job) return;
    const text = [
      `Job Card : ${docNo}`,
      `Date: ${formatEstimateDate(job.serviceDate ?? job.jobDate ?? job.createdAt)}`,
      `Customer: ${customerBlock.name}`,
      "",
      ...lines.map(
        (line, index) =>
          `${index + 1}. ${line.description}\t${formatEstimateMoney(line.price, callingCode)}`,
      ),
      "",
      `Subtotal: ${formatEstimateMoney(totals.subtotal, callingCode)}`,
      `HST: ${formatEstimateMoney(totals.hst, callingCode)}`,
      `Total: ${formatEstimateMoney(totals.total, callingCode)}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Estimate copied.");
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  const handleWhatsapp = async () => {
    if (!token || sending) return;
    setSending(true);
    try {
      const res = await resendJobCardNotification(token, jobCardId);
      if (!res.ok) {
        toast.error("Could not send on WhatsApp.");
        return;
      }
      toast.success("Sent on WhatsApp.");
    } finally {
      setSending(false);
    }
  };

  if (loading && !job) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="text-xs font-semibold text-blue-700 underline hover:text-blue-800"
              >
                Back
              </button>
            ) : null}
            <h2 className="truncate text-sm font-bold text-gray-900 sm:text-base">
              Job Card : {docNo}
            </h2>
          </div>
        </div>
        <ShopListSkeleton variant="profile-table" className="w-full" />
      </div>
    );
  }

  if (error || !job) {
    return <ShopErrorPanel message={error ?? "Could not load job card."} onRetry={() => void load()} />;
  }

  return (
    <div className="space-y-3 print:space-y-0">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex min-w-0 items-center gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-semibold text-blue-700 underline hover:text-blue-800"
            >
              Back
            </button>
          ) : null}
          <h2 className="truncate text-sm font-bold text-gray-900 sm:text-base">
            Job Card : {docNo}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleWhatsapp()}
            disabled={sending}
            className={WHATSAPP_BTN_CLASS}
          >
            <FaWhatsapp size={14} aria-hidden />
            Send on Whatsapp
          </button>
          <button type="button" onClick={() => void handleCopy()} className={OUTLINE_BTN_CLASS}>
            <FiCopy size={13} aria-hidden />
            Copy
          </button>
          <button type="button" onClick={handlePrint} className={OUTLINE_BTN_CLASS}>
            <FiPrinter size={13} aria-hidden />
            Print
          </button>
        </div>
      </div>

      <div
        id="shop-job-card-estimate-print"
        className="relative overflow-hidden rounded border border-gray-300 bg-white p-4 shadow-sm sm:p-6 print:border-0 print:p-0 print:shadow-none"
      >
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-16 w-16 overflow-hidden print:absolute">
          <div className="absolute -left-8 top-4 w-32 -rotate-45 bg-[#2e7d32] py-1 text-center text-[10px] font-bold uppercase tracking-wide text-white">
            {estimateStatusRibbon(job)}
          </div>
        </div>

        <div className="mb-4 flex justify-center">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-12 max-w-[8rem] object-contain" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded border border-gray-300 text-xs font-bold text-gray-500">
              ABC
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4 text-sm text-gray-800">
            <div>
              <p className="font-bold text-gray-900">{businessBlock.name}</p>
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
              <EstimateMetaRow label="Job Card No. :" value={docNo} />
              <EstimateMetaRow
                label="Date :"
                value={formatEstimateDate(job.serviceDate ?? job.jobDate ?? job.createdAt)}
              />
              <EstimateMetaRow label="HST No. :" value={hstNumber} />
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 text-left text-xs font-bold text-gray-800">
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
                  <tr key={`${line.description}-${index}`}>
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
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <EstimateTotalsBlock
            subtotal={formatEstimateMoney(totals.subtotal, callingCode)}
            hst={formatEstimateMoney(totals.hst, callingCode)}
            roundOff={
              totals.roundOff !== 0
                ? formatEstimateMoney(totals.roundOff, callingCode)
                : undefined
            }
            total={formatEstimateMoney(totals.total, callingCode)}
            totalLabel={`Total (${currencyLabel}) :`}
          />
        </div>

        <p className="mt-6 text-right text-[10px] text-gray-500 print:mt-4">
          This estimate was sent using AutoDaddy
        </p>
      </div>
    </div>
  );
}
