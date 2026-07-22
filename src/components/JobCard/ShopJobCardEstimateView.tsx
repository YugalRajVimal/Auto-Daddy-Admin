import { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiEdit2, FiPrinter } from "react-icons/fi";
import { toast } from "react-toastify";
import useAuth from "../../auth/useAuth";
import { useShopOwnerCallingCode } from "../../hooks/useShopOwnerCallingCode";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import { fetchJobCardRecord, jobCardRecordFromListRow } from "../../lib/shopOwnerJobCardsApi";
import {
  isJobCardEditable,
  isJobRecordEligibleForInvoiceConversion,
  jobCardRowFromRecord,
  pickJobCardInvoiceNumber,
  pickJobCardNoForApi,
} from "../../lib/shopOwnerJobCards";
import {
  fetchAutoshopJobCardPrefix,
  parseAutoshopJobCardPrefix,
  updateAutoshopJobCardStatus,
} from "../../lib/autoshopownerJobCardsApi";
import { ShopListSkeleton } from "../shop/ShopListSkeletons";
import { ShopErrorPanel } from "../shop/ShopPanels";
import {
  JOB_CARD_PREVIEW_THEME,
  resolveInvoiceTheme,
  type InvoiceThemeTokens,
} from "../shop/invoice-templates/invoiceTheme";
import { JobCardDocumentHeaderWave, JobCardDocumentWaves } from "./JobCardDocumentWaves";
import {
  buildBusinessBlock,
  buildCustomerBlock,
  currencyLabelFromCode,
  deriveJobCardPrefixFromDisplayId,
  estimateDocumentNo,
  estimateTotals,
  extractEstimateLines,
  formatEstimateDate,
  formatEstimateMoney,
  jobCardShowsInvoiceHst,
  pickBusinessHstNumber,
  pickInvoiceNoFromRecord,
  pickJobNoFromListRow,
  pickJobNoFromRecord,
} from "./shopJobCardEstimate";
import type { JobCardListRow } from "../../lib/shopOwnerJobCards";

const OUTLINE_BTN_CLASS =
  "inline-flex items-center gap-1.5 rounded border border-gray-400 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 hover:bg-gray-50 disabled:opacity-60";

const CONVERT_INVOICE_BTN_CLASS =
  "inline-flex items-center gap-1.5 rounded border border-ad-purple bg-white px-3 py-1.5 text-xs font-bold text-ad-purple hover:bg-[#f5cce8] disabled:cursor-not-allowed disabled:opacity-60";

const CASH_PAID_BTN_CLASS = CONVERT_INVOICE_BTN_CLASS;

export type JobCardActionPreview = "invoice" | "cash";

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
  hst,
  roundOff,
  total,
  totalLabel,
  showHst,
  labelColSpan,
  theme,
}: {
  subtotal: string;
  hst: string;
  roundOff?: string;
  total: string;
  totalLabel: string;
  showHst: boolean;
  labelColSpan: number;
  theme?: InvoiceThemeTokens | null;
}) {
  const labelClass =
    "border-0 bg-transparent px-2 py-1 text-right text-sm font-semibold text-gray-800";
  const valueClass =
    "border-0 bg-transparent px-2 py-1 text-right text-sm font-semibold tabular-nums text-gray-800";
  const totalStyle = theme
    ? { backgroundColor: theme.accent, color: theme.accentText }
    : { backgroundColor: "#f3f4f6", color: "#111827" };
  /** Match table header: `text-xs font-bold` + `px-2 py-2`. */
  const totalCellClass = "border-0 px-2 py-2 text-xs font-bold leading-none";

  return (
    <tfoot>
      <tr>
        <td colSpan={labelColSpan} className={`${labelClass} pt-3`}>
          Subtotal :
        </td>
        <td className={`${valueClass} pt-3`}>{subtotal}</td>
      </tr>
      {showHst ? (
        <tr>
          <td colSpan={labelColSpan} className={labelClass}>
            HST :
          </td>
          <td className={valueClass}>{hst}</td>
        </tr>
      ) : null}
      {roundOff ? (
        <tr>
          <td colSpan={labelColSpan} className={labelClass}>
            Round Off :
          </td>
          <td className={valueClass}>{roundOff}</td>
        </tr>
      ) : null}
      <tr aria-hidden>
        <td colSpan={labelColSpan + 1} className="border-0 bg-transparent p-0 h-2" />
      </tr>
      <tr>
        <td colSpan={labelColSpan} className="border-0 bg-transparent p-0">
          <div className="flex justify-end">
            <div className={`${totalCellClass} flex items-center`} style={totalStyle}>
              {totalLabel}
            </div>
          </div>
        </td>
        <td className={`${totalCellClass} text-right tabular-nums`} style={totalStyle}>
          {total}
        </td>
      </tr>
    </tfoot>
  );
}

type ShopJobCardEstimateViewProps = {
  jobCardId: string;
  listRow?: JobCardListRow | null;
  jobNoHint?: string | null;
  /** When set, open directly in that action preview (before confirm). */
  initialActionPreview?: JobCardActionPreview | null;
  /** Hide convert / cash-paid confirm actions (e.g. wallet invoice preview). */
  showPaymentActions?: boolean;
  onBack?: () => void;
  onEdit?: () => void;
  onConverted?: () => void;
  onCashPaid?: () => void;
  /** Called when action preview mode is entered or left. */
  onActionPreviewChange?: (preview: JobCardActionPreview | null) => void;
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
  initialActionPreview = null,
  showPaymentActions = true,
  onBack,
  onEdit,
  onConverted,
  onCashPaid,
  onActionPreviewChange,
}: ShopJobCardEstimateViewProps) {
  const { token } = useAuth();
  const callingCode = useShopOwnerCallingCode();
  const { business } = useShopOwnerPortal();
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobCardPrefix, setJobCardPrefix] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionPreview, setActionPreview] = useState<JobCardActionPreview | null>(
    initialActionPreview,
  );

  useEffect(() => {
    setActionPreview(initialActionPreview);
  }, [initialActionPreview, jobCardId]);

  useEffect(() => {
    onActionPreviewChange?.(actionPreview);
  }, [actionPreview, onActionPreviewChange]);

  useEffect(() => {
    if (!token) {
      setJobCardPrefix("");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetchAutoshopJobCardPrefix(token);
        if (cancelled || !res.ok) return;
        const prefix = parseAutoshopJobCardPrefix(res.data);
        if (prefix) setJobCardPrefix(prefix);
      } catch {
        /* keep empty; display falls back */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const load = useCallback(async () => {
    if (!jobCardId) return;
    setLoading(true);
    setError(null);

    const mergeJobNo = (record: Record<string, unknown>) => {
      const listNo = listRow ? pickJobNoFromListRow(listRow) : undefined;
      const hintNo = jobNoHint?.trim() || undefined;
      const mergedNo = listNo ?? hintNo;
      if (mergedNo && !pickJobNoFromRecord(record)) {
        record.jobNo = mergedNo;
      }
      return record;
    };

    const bootstrap = jobCardRecordFromListRow(listRow, jobCardId);
    if (bootstrap) {
      setJob(mergeJobNo(bootstrap));
      setLoading(false);
      return;
    }

    // No GET-by-id API — only list/search. Prefer held list row; otherwise resolve via search/list.
    if (!token) {
      setLoading(false);
      setError("Could not load job card.");
      return;
    }

    try {
      const { record } = await fetchJobCardRecord(token, jobCardId, {
        jobCardNo: listRow ? pickJobNoFromListRow(listRow) : jobNoHint,
      });
      setJob(mergeJobNo(record));
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

  const invoicePreview = actionPreview === "invoice";
  const cashPreview = actionPreview === "cash";
  const showHst = job ? jobCardShowsInvoiceHst(job) || invoicePreview : false;
  const hstRate = parseHstRate(business);
  const effectiveHstRate = showHst ? hstRate : 0;
  const lines = useMemo(
    () => (job ? extractEstimateLines(job, effectiveHstRate) : []),
    [job, effectiveHstRate],
  );
  const totals = useMemo(
    () =>
      job
        ? estimateTotals(lines, effectiveHstRate, job, { includeHst: showHst })
        : { subtotal: 0, hst: 0, roundOff: 0, total: 0 },
    [job, lines, effectiveHstRate, showHst],
  );

  const resolvedPrefix = useMemo(() => {
    if (jobCardPrefix.trim()) return jobCardPrefix.trim();
    const fromJob = job
      ? deriveJobCardPrefixFromDisplayId(
          pickJobNoFromRecord(job) ??
            (typeof job.jobCardId === "string" ? job.jobCardId : undefined),
        )
      : "";
    if (fromJob) return fromJob;
    return listRow ? deriveJobCardPrefixFromDisplayId(pickJobNoFromListRow(listRow)) : "";
  }, [jobCardPrefix, job, listRow]);

  const alreadyInvoiced = job ? jobCardShowsInvoiceHst(job) : false;
  const showInvoiceDocumentNo = alreadyInvoiced || invoicePreview;

  const docNo = useMemo(() => {
    if (showInvoiceDocumentNo) {
      const invoiceNo =
        pickInvoiceNoFromRecord(job) ||
        (listRow ? pickJobCardInvoiceNumber(listRow) : "");
      if (invoiceNo) return invoiceNo;
    }
    return estimateDocumentNo(job ?? {}, jobNoHint, listRow, resolvedPrefix);
  }, [job, jobNoHint, listRow, resolvedPrefix, showInvoiceDocumentNo]);
  const currencyLabel = currencyLabelFromCode(callingCode);
  const businessBlock = buildBusinessBlock(business);
  const customerBlock = job ? buildCustomerBlock(job) : { name: "—", company: "", address: "" };
  const logoUrl = normalizeMediaUrl(business?.businessLogo);
  const hstNumber = pickBusinessHstNumber(business, job) || "—";
  const documentNoLabel = showInvoiceDocumentNo ? "Invoice No. :" : "Job Card No. :";
  const footerNote = invoicePreview && !alreadyInvoiced
    ? "Invoice preview — confirm to convert this job card"
    : cashPreview
      ? "Job card preview — confirm to mark as paid by cash"
      : "This estimate was sent using AutoDaddy";
  /** Invoices use the saved Profile template theme; job cards use the viewer-inspired blue. */
  const isInvoiceDocument =
    alreadyInvoiced || invoicePreview || showPaymentActions === false;
  const theme: InvoiceThemeTokens = isInvoiceDocument
    ? resolveInvoiceTheme(business?.invoiceTemplateSlug)
    : JOB_CARD_PREVIEW_THEME;
  const documentHeading = isInvoiceDocument ? "Invoice" : "Job Card";

  const canConvertToInvoice = useMemo(
    () => (job ? isJobRecordEligibleForInvoiceConversion(job, listRow) : false),
    [job, listRow],
  );
  const canMarkPaidByCash = canConvertToInvoice;
  const canEdit = useMemo(() => {
    if (!job && !listRow) return false;
    const row = listRow ?? (job ? jobCardRowFromRecord(job, listRow) : null);
    return row ? isJobCardEditable(row) : false;
  }, [job, listRow]);

  const handlePrint = () => {
    window.print();
  };

  const exitActionPreview = () => {
    setActionPreview(null);
  };

  const handleConfirmConvertToInvoice = async () => {
    if (!token || actionBusy || !canConvertToInvoice) return;
    const jobCardNo = pickJobCardNoForApi(listRow) ?? pickJobCardNoForApi(job);
    if (!jobCardNo) {
      toast.error("Could not convert to invoice.");
      return;
    }
    setActionBusy(true);
    try {
      const res = await updateAutoshopJobCardStatus(token, jobCardNo, "convertedToInvoice");
      if (!res.ok) {
        toast.error("Could not convert to invoice.");
        return;
      }
      toast.success("Converted to invoice.");
      setActionPreview(null);
      await load();
      onConverted?.();
    } finally {
      setActionBusy(false);
    }
  };

  const handleConfirmPaidByCash = async () => {
    if (!token || actionBusy || !canMarkPaidByCash) return;
    const jobCardNo = pickJobCardNoForApi(listRow) ?? pickJobCardNoForApi(job);
    if (!jobCardNo) {
      toast.error("Could not mark as paid by cash.");
      return;
    }
    setActionBusy(true);
    try {
      const res = await updateAutoshopJobCardStatus(token, jobCardNo, "CashPaid");
      if (!res.ok) {
        toast.error("Could not mark as paid by cash.");
        return;
      }
      toast.success("Marked as paid by cash.");
      setActionPreview(null);
      await load();
      onCashPaid?.();
    } finally {
      setActionBusy(false);
    }
  };

  if (loading && !job) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {onBack ? (
            <button type="button" onClick={onBack} className={OUTLINE_BTN_CLASS}>
              <FiArrowLeft size={13} aria-hidden />
              Back
            </button>
          ) : null}
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
        {onBack ? (
          <button type="button" onClick={onBack} className={OUTLINE_BTN_CLASS}>
            <FiArrowLeft size={13} aria-hidden />
            Back
          </button>
        ) : null}
        <div className={`flex flex-wrap items-center gap-2 ${onBack ? "" : "ml-auto"}`}>
          {showPaymentActions && invoicePreview && !alreadyInvoiced ? (
            <>
              <button
                type="button"
                onClick={exitActionPreview}
                disabled={actionBusy}
                className={OUTLINE_BTN_CLASS}
              >
                Cancel Preview
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmConvertToInvoice()}
                disabled={!canConvertToInvoice || actionBusy}
                className={CONVERT_INVOICE_BTN_CLASS}
              >
                {actionBusy ? "Converting…" : "Confirm Convert"}
              </button>
            </>
          ) : null}
          {showPaymentActions && cashPreview ? (
            <>
              {onEdit ? (
                <button
                  type="button"
                  onClick={onEdit}
                  disabled={actionBusy}
                  className={OUTLINE_BTN_CLASS}
                >
                  <FiEdit2 size={13} aria-hidden />
                  Edit
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void handleConfirmPaidByCash()}
                disabled={!canMarkPaidByCash || actionBusy}
                className={CASH_PAID_BTN_CLASS}
              >
                {actionBusy ? "Marking…" : "Confirm Paid by Cash"}
              </button>
            </>
          ) : null}
          {onEdit && canEdit && !actionPreview ? (
            <button type="button" onClick={onEdit} className={OUTLINE_BTN_CLASS}>
              <FiEdit2 size={13} aria-hidden />
              Edit
            </button>
          ) : null}
          <button type="button" onClick={handlePrint} className={OUTLINE_BTN_CLASS}>
            <FiPrinter size={13} aria-hidden />
            Print
          </button>
        </div>
      </div>

      <div
        id="shop-job-card-estimate-print"
        className="relative overflow-hidden rounded border bg-white p-4 shadow-sm sm:p-6 print:border-0 print:p-0 print:shadow-none"
        style={{ borderColor: theme.border }}
      >
        {isInvoiceDocument ? (
          <div className="mb-4 h-1.5 -mx-4 -mt-4 sm:-mx-6 sm:-mt-6" style={{ backgroundColor: theme.accent }} />
        ) : (
          <>
            <div className="pointer-events-none absolute -inset-x-4 -top-4 sm:-inset-x-6 sm:-top-6">
              <JobCardDocumentHeaderWave />
            </div>
            <div className="-mt-4 mb-2 h-16 shrink-0 sm:h-20" aria-hidden />
          </>
        )}

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
            {documentHeading}
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
              <EstimateMetaRow label={documentNoLabel} value={docNo} />
              <EstimateMetaRow
                label="Date :"
                value={formatEstimateDate(job.date ?? job.serviceDate ?? job.jobDate ?? job.createdAt)}
              />
              {showHst ? <EstimateMetaRow label="HST No. :" value={hstNumber} /> : null}
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
                {showHst ? (
                  <th className="border border-gray-300 px-2 py-2 text-right">HST</th>
                ) : null}
                <th className="border border-gray-300 px-2 py-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td
                    colSpan={showHst ? 6 : 5}
                    className="border border-gray-300 px-2 py-4 text-center text-gray-500"
                  >
                    No line items
                  </td>
                </tr>
              ) : (
                lines.map((line, index) => (
                  <tr
                    key={`${line.description}-${index}`}
                    style={
                      index % 2 === 1 ? { backgroundColor: theme.stripe } : undefined
                    }
                  >
                    <td className="border border-gray-300 px-2 py-2 align-top">{index + 1}.</td>
                    <td className="border border-gray-300 px-2 py-2 align-top">{line.description}</td>
                    <td className="border border-gray-300 px-2 py-2 text-right align-top tabular-nums">
                      {formatEstimateMoney(line.unitCost, callingCode)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center align-top tabular-nums">
                      {line.qty}
                    </td>
                    {showHst ? (
                      <td className="border border-gray-300 px-2 py-2 text-right align-top tabular-nums">
                        {line.hstRate > 0 ? `${line.hstRate}%` : "—"}
                      </td>
                    ) : null}
                    <td className="border border-gray-300 px-2 py-2 text-right align-top tabular-nums">
                      {formatEstimateMoney(line.price, callingCode)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <EstimateTotalsFooter
              subtotal={formatEstimateMoney(totals.subtotal, callingCode)}
              hst={formatEstimateMoney(totals.hst, callingCode)}
              roundOff={
                totals.roundOff !== 0
                  ? formatEstimateMoney(totals.roundOff, callingCode)
                  : undefined
              }
              total={formatEstimateMoney(totals.total, callingCode)}
              totalLabel={`Total (${currencyLabel}) :`}
              showHst={showHst}
              labelColSpan={showHst ? 5 : 4}
              theme={theme}
            />
          </table>
        </div>

        <p className="relative z-10 mt-6 text-right text-[10px] text-gray-500 print:mt-4">
          {footerNote}
        </p>

        {isInvoiceDocument ? (
          <div className="mt-4 h-1.5 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6" style={{ backgroundColor: theme.accent }} />
        ) : (
          <>
            <div className="-mb-4 mt-6 h-[7.5rem] shrink-0 sm:h-[9rem]" aria-hidden />
            <div className="pointer-events-none absolute -inset-x-4 -bottom-4 sm:-inset-x-6 sm:-bottom-6">
              <JobCardDocumentWaves />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
