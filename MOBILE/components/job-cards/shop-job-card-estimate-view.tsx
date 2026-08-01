import { LoadingProgress, useToast } from "@/components/reusables";
import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import {
  fetchInvoicePrefix,
  formatNextInvoiceNo,
  parseInvoicePrefix,
} from "@/lib/autoshopowner-api";
import {
  apiMessageFromEnvelope,
  fetchAutoshopJobCardPrefix,
  parseAutoshopJobCardPrefix,
  updateAutoshopJobCardStatus,
} from "@/lib/autoshopowner-job-cards-api";
import { JOB_CARD_PREVIEW_THEME, resolveInvoiceTheme } from "@/lib/invoice-theme";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import { getAutoShopOwnerProfile } from "@/lib/shop-owner-auth-cache";
import {
  isJobCardEditable,
  isJobRecordEligibleForInvoiceConversion,
  jobCardRowFromRecord,
  pickJobCardInvoiceNumber,
  pickJobCardNoForApi,
  type JobCardListRow,
} from "@/lib/shop-owner-job-cards";
import {
  fetchJobCardRecord,
  jobCardRecordFromListRow,
} from "@/lib/shop-owner-job-cards-api";
import {
  buildBusinessBlock,
  buildCustomerBlock,
  buildVehicleBlock,
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
} from "@/lib/shop-job-card-estimate";
import type { AutoShopOwnerProfileResponse } from "@/types/auto-shop-owner-profile";
import type { ShopProfileBusiness } from "@/types/shop-owner";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { A4_PAGE_PAD_PX, A4DocumentSheet } from "./a4-document-sheet";

export type JobCardActionPreview = "invoice" | "cash";

type ShopJobCardEstimateViewProps = {
  jobCardId: string;
  listRow?: JobCardListRow | null;
  jobNoHint?: string | null;
  initialActionPreview?: JobCardActionPreview | null;
  showPaymentActions?: boolean;
  onBack?: () => void;
  onEdit?: () => void;
  onConverted?: () => void;
  onCashPaid?: () => void;
  onActionPreviewChange?: (preview: JobCardActionPreview | null) => void;
};

function parseHstRate(business: ShopProfileBusiness | null | undefined): number {
  const raw = business?.gstPercent ?? (business as { gst?: unknown } | null | undefined)?.gst;
  const n = typeof raw === "string" ? Number.parseFloat(raw) : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 13;
}

function EstimateMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

export function ShopJobCardEstimateView({
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
  const { token, meta } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const countryCode = meta?.countryCode ?? null;

  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobCardPrefix, setJobCardPrefix] = useState("");
  const [nextInvoiceNo, setNextInvoiceNo] = useState("");
  const [business, setBusiness] = useState<ShopProfileBusiness | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionPreview, setActionPreview] = useState<JobCardActionPreview | null>(
    initialActionPreview,
  );
  const onActionPreviewChangeRef = useRef(onActionPreviewChange);
  onActionPreviewChangeRef.current = onActionPreviewChange;

  useEffect(() => {
    setActionPreview((prev) => (prev === initialActionPreview ? prev : initialActionPreview));
  }, [initialActionPreview, jobCardId]);

  useEffect(() => {
    onActionPreviewChangeRef.current?.(actionPreview);
  }, [actionPreview]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const cached = await getAutoShopOwnerProfile<AutoShopOwnerProfileResponse>();
        const bp = cached?.data?.businessProfile;
        if (!cancelled && bp) {
          setBusiness({
            businessName: bp.businessName,
            businessPhone: bp.businessPhone,
            city: bp.city,
            businessLogo: bp.businessLogo ?? undefined,
            address: bp.businessAddress,
            businessAddress: bp.businessAddress,
            pincode: bp.pincode,
            email: bp.businessEmail,
            hstNumber: bp.businessHSTNumber,
            businessHSTNumber: bp.businessHSTNumber,
            gstPercent: bp.gst ?? undefined,
            invoiceTemplateSlug: (bp as { invoiceTemplateSlug?: string }).invoiceTemplateSlug,
          });
        }
      } catch {
        /* keep null; document still renders from job payload */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setJobCardPrefix("");
      return;
    }
    let cancelled = false;
    void fetchAutoshopJobCardPrefix(token)
      .then((res) => {
        if (cancelled || !res.ok) return;
        const prefix = parseAutoshopJobCardPrefix(res.data);
        if (prefix) setJobCardPrefix(prefix);
      })
      .catch(() => {
        /* display falls back */
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const invoicePreview = actionPreview === "invoice";

  useEffect(() => {
    if (!token || !invoicePreview) {
      setNextInvoiceNo("");
      return;
    }
    let cancelled = false;
    void fetchInvoicePrefix(token)
      .then((res) => {
        if (cancelled || !res.ok) return;
        const { prefix, invoiceCounter } = parseInvoicePrefix(res.data);
        const formatted = formatNextInvoiceNo(prefix, invoiceCounter);
        if (formatted) setNextInvoiceNo(formatted);
      })
      .catch(() => {
        /* display falls back */
      });
    return () => {
      cancelled = true;
    };
  }, [token, invoicePreview]);

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

  const cashPreview = actionPreview === "cash";
  const alreadyInvoiced = job ? jobCardShowsInvoiceHst(job) : false;
  const isInvoiceDocument = invoicePreview || showPaymentActions === false;
  const showHst = isInvoiceDocument;
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
        : { subtotal: 0, discount: 0, hst: 0, roundOff: 0, total: 0 },
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

  const showInvoiceDocumentNo = isInvoiceDocument;
  const docNo = useMemo(() => {
    if (showInvoiceDocumentNo) {
      const invoiceNo =
        pickInvoiceNoFromRecord(job) || (listRow ? pickJobCardInvoiceNumber(listRow) : "");
      if (invoiceNo) return invoiceNo;
      if (nextInvoiceNo.trim()) return nextInvoiceNo.trim();
    }
    return estimateDocumentNo(job ?? {}, jobNoHint, listRow, resolvedPrefix);
  }, [job, jobNoHint, listRow, nextInvoiceNo, resolvedPrefix, showInvoiceDocumentNo]);

  const currencyLabel = currencyLabelFromCode(countryCode);
  const businessBlock = buildBusinessBlock(business);
  const customerBlock = job ? buildCustomerBlock(job) : { name: "—", company: "", address: "" };
  const vehicleBlock = job
    ? buildVehicleBlock(job)
    : { plate: "", name: "", vin: "", cin: "", odometer: "" };
  const hasVehicleBlock =
    Boolean(vehicleBlock.plate) ||
    Boolean(vehicleBlock.name) ||
    Boolean(vehicleBlock.vin) ||
    Boolean(vehicleBlock.cin) ||
    Boolean(vehicleBlock.odometer);
  const logoUrl = normalizeMediaUrl(business?.businessLogo ?? null);
  const hstNumber = pickBusinessHstNumber(business, job) || "—";
  const documentNoLabel = showInvoiceDocumentNo ? "Invoice No. :" : "Job Card No. :";
  const footerNote =
    invoicePreview && !alreadyInvoiced
      ? "Invoice preview — confirm to convert this job card"
      : cashPreview
        ? "Job card preview — confirm to mark as paid by cash"
        : "This estimate was sent using AutoDaddy";
  const theme = isInvoiceDocument
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

  const exitActionPreview = () => setActionPreview(null);

  const handleConfirmConvertToInvoice = async () => {
    if (!token || actionBusy || !canConvertToInvoice) return;
    const jobCardNo = pickJobCardNoForApi(listRow) ?? pickJobCardNoForApi(job);
    if (!jobCardNo) {
      showToast("Could not convert to invoice.");
      return;
    }
    setActionBusy(true);
    try {
      const res = await updateAutoshopJobCardStatus(token, jobCardNo, "convertedToInvoice");
      const msg = apiMessageFromEnvelope(res.data) ?? "";
      if (!res.ok) {
        showToast(msg || "Could not convert to invoice.");
        return;
      }
      showToast(msg || "Converted to invoice.");
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
      showToast("Could not mark as paid by cash.");
      return;
    }
    setActionBusy(true);
    try {
      const res = await updateAutoshopJobCardStatus(token, jobCardNo, "CashPaid");
      const msg = apiMessageFromEnvelope(res.data) ?? "";
      if (!res.ok) {
        showToast(msg || "Could not mark as paid by cash.");
        return;
      }
      showToast(msg || "Marked as paid by cash.");
      setActionPreview(null);
      await load();
      onCashPaid?.();
    } finally {
      setActionBusy(false);
    }
  };

  if (loading && !job) {
    return (
      <View style={[styles.root, styles.rootPlain, { paddingBottom: insets.bottom }]}>
        <View style={styles.chrome}>
          <View style={styles.handle} />
          <View style={styles.toolbar}>
            {onBack ? (
              <Pressable style={styles.navBtn} onPress={onBack} hitSlop={8}>
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </Pressable>
            ) : (
              <View style={styles.navBtnSpacer} />
            )}
            <Text style={styles.toolbarTitle} numberOfLines={1}>
              Preview
            </Text>
            <View style={styles.navBtnSpacer} />
          </View>
        </View>
        <View style={styles.loadingBox}>
          <LoadingProgress />
        </View>
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={[styles.root, styles.rootPlain, { paddingBottom: insets.bottom }]}>
        <View style={styles.chrome}>
          <View style={styles.handle} />
          <View style={styles.toolbar}>
            {onBack ? (
              <Pressable style={styles.navBtn} onPress={onBack} hitSlop={8}>
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </Pressable>
            ) : (
              <View style={styles.navBtnSpacer} />
            )}
            <Text style={styles.toolbarTitle} numberOfLines={1}>
              Preview
            </Text>
            <View style={styles.navBtnSpacer} />
          </View>
        </View>
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error ?? "Could not load job card."}</Text>
          <Pressable style={styles.secondaryBtn} onPress={() => void load()}>
            <Text style={styles.secondaryBtnText}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.chrome}>
        <View style={styles.handle} />
        <View style={styles.toolbar}>
          {onBack ? (
            <Pressable style={styles.navBtn} onPress={onBack} hitSlop={8}>
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </Pressable>
          ) : (
            <View style={styles.navBtnSpacer} />
          )}
          <Text style={styles.toolbarTitle} numberOfLines={1}>
            {documentHeading} Preview
          </Text>
          <View style={styles.navBtnSpacer} />
        </View>

        {(showPaymentActions && invoicePreview && !alreadyInvoiced) ||
        (showPaymentActions && cashPreview) ||
        (onEdit && canEdit && !actionPreview) ||
        (alreadyInvoiced && showPaymentActions) ? (
          <View style={styles.actionRow}>
            {showPaymentActions && invoicePreview && !alreadyInvoiced ? (
              <>
                <Pressable
                  style={styles.secondaryBtn}
                  disabled={actionBusy}
                  onPress={exitActionPreview}
                >
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.primaryBtn, (!canConvertToInvoice || actionBusy) && styles.btnDisabled]}
                  disabled={!canConvertToInvoice || actionBusy}
                  onPress={() => void handleConfirmConvertToInvoice()}
                >
                  {actionBusy ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Confirm Convert</Text>
                  )}
                </Pressable>
              </>
            ) : null}

            {showPaymentActions && cashPreview ? (
              <>
                {onEdit ? (
                  <Pressable style={styles.secondaryBtn} disabled={actionBusy} onPress={onEdit}>
                    <Ionicons name="create-outline" size={16} color={colors.text} />
                    <Text style={styles.secondaryBtnText}>Edit</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={[styles.primaryBtn, (!canMarkPaidByCash || actionBusy) && styles.btnDisabled]}
                  disabled={!canMarkPaidByCash || actionBusy}
                  onPress={() => void handleConfirmPaidByCash()}
                >
                  {actionBusy ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Confirm Paid by Cash</Text>
                  )}
                </Pressable>
              </>
            ) : null}

            {onEdit && canEdit && !actionPreview ? (
              <Pressable style={styles.secondaryBtn} onPress={onEdit}>
                <Ionicons name="create-outline" size={16} color={colors.text} />
                <Text style={styles.secondaryBtnText}>Edit</Text>
              </Pressable>
            ) : null}

            {alreadyInvoiced && showPaymentActions ? (
              invoicePreview ? (
                <Pressable style={styles.secondaryBtn} onPress={exitActionPreview}>
                  <Text style={styles.secondaryBtnText}>View Job Card</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.secondaryBtn} onPress={() => setActionPreview("invoice")}>
                  <Text style={styles.secondaryBtnText}>View Invoice</Text>
                </Pressable>
              )
            ) : null}
          </View>
        ) : null}
      </View>

      <A4DocumentSheet>
        {isInvoiceDocument ? (
          <View style={[styles.docBar, { backgroundColor: theme.accent }]} />
        ) : (
          <View style={[styles.docWaveTop, { backgroundColor: theme.panel }]} />
        )}

        <View style={styles.docBody}>
          <View style={styles.docHeader}>
            <View style={styles.docBrand}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.logo} contentFit="contain" />
              ) : (
                <View style={[styles.logoFallback, { backgroundColor: theme.accent }]}>
                  <Text style={[styles.logoFallbackText, { color: theme.accentText }]}>AD</Text>
                </View>
              )}
              <Text style={[styles.businessName, { color: theme.title }]} numberOfLines={2}>
                {businessBlock.name}
              </Text>
            </View>
            <Text style={[styles.docHeading, { color: theme.title }]}>{documentHeading}</Text>
          </View>

          <View style={styles.docMetaGrid}>
            <View style={styles.docMetaLeft}>
              {businessBlock.address ? (
                <Text style={styles.docBodyText}>{businessBlock.address}</Text>
              ) : null}
              {businessBlock.phone ? (
                <Text style={styles.docBodyText}>{businessBlock.phone}</Text>
              ) : null}
              <View style={styles.toBlock}>
                <Text style={styles.toLabel}>To</Text>
                <Text style={styles.toName}>{customerBlock.name}</Text>
                {customerBlock.company ? (
                  <Text style={styles.docBodyText}>{customerBlock.company}</Text>
                ) : null}
                {customerBlock.address ? (
                  <Text style={styles.docBodyText}>{customerBlock.address}</Text>
                ) : null}
              </View>
            </View>
            <View style={styles.docMetaRight}>
              <EstimateMetaRow label={documentNoLabel} value={docNo} />
              <EstimateMetaRow
                label="Date :"
                value={formatEstimateDate(job.date ?? job.serviceDate ?? job.jobDate ?? job.createdAt)}
              />
              {showHst ? <EstimateMetaRow label="HST No. :" value={hstNumber} /> : null}
            </View>
          </View>

          {hasVehicleBlock ? (
            <View style={styles.vehicleBlock}>
              <Text style={styles.toLabel}>Vehicle</Text>
              {vehicleBlock.plate ? (
                <Text style={styles.toName}>{vehicleBlock.plate}</Text>
              ) : null}
              {vehicleBlock.name ? (
                <Text style={styles.docBodyText}>{vehicleBlock.name}</Text>
              ) : null}
              {vehicleBlock.vin ? (
                <Text style={styles.docBodyText}>VIN: {vehicleBlock.vin}</Text>
              ) : null}
              {vehicleBlock.cin ? (
                <Text style={styles.docBodyText}>CIN: {vehicleBlock.cin}</Text>
              ) : null}
              {vehicleBlock.odometer ? (
                <Text style={styles.docBodyText}>{vehicleBlock.odometer}</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.table}>
            <View style={[styles.tableHead, { backgroundColor: theme.accent }]}>
              <Text style={[styles.th, styles.colSno, { color: theme.accentText }]}>S. No.</Text>
              <Text style={[styles.th, styles.colDesc, { color: theme.accentText }]}>Description</Text>
              <Text style={[styles.th, styles.colUnit, { color: theme.accentText }]}>Unit Cost</Text>
              <Text style={[styles.th, styles.colQty, { color: theme.accentText }]}>Qty</Text>
              {showHst ? (
                <Text style={[styles.th, styles.colHst, { color: theme.accentText }]}>HST</Text>
              ) : null}
              <Text style={[styles.th, styles.colPrice, { color: theme.accentText }]}>Price</Text>
            </View>

            {lines.length === 0 ? (
              <View style={styles.tableEmpty}>
                <Text style={styles.tableEmptyText}>No line items</Text>
              </View>
            ) : (
              lines.map((line, index) => (
                <View
                  key={`${line.description}-${index}`}
                  style={[
                    styles.tableRow,
                    index % 2 === 1 ? { backgroundColor: theme.stripe } : null,
                  ]}
                >
                  <Text style={[styles.td, styles.colSno]}>{index + 1}.</Text>
                  <Text style={[styles.td, styles.colDesc]}>{line.description}</Text>
                  <Text style={[styles.tdRight, styles.colUnit]}>
                    {formatEstimateMoney(line.unitCost, countryCode)}
                  </Text>
                  <Text style={[styles.tdCenter, styles.colQty]}>{line.qty}</Text>
                  {showHst ? (
                    <Text style={[styles.tdRight, styles.colHst]}>
                      {line.hstRate > 0 ? `${line.hstRate}%` : "—"}
                    </Text>
                  ) : null}
                  <Text style={[styles.tdRight, styles.colPrice]}>
                    {formatEstimateMoney(line.price, countryCode)}
                  </Text>
                </View>
              ))
            )}

            <View style={styles.totalsBlock}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal :</Text>
                <Text style={styles.totalValue}>
                  {formatEstimateMoney(totals.subtotal, countryCode)}
                </Text>
              </View>
              {totals.discount > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Discount :</Text>
                  <Text style={[styles.totalValue, styles.discountValue]}>
                    −{formatEstimateMoney(totals.discount, countryCode)}
                  </Text>
                </View>
              ) : null}
              {showHst ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>HST :</Text>
                  <Text style={styles.totalValue}>
                    {formatEstimateMoney(totals.hst, countryCode)}
                  </Text>
                </View>
              ) : null}
              {totals.roundOff !== 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Round Off :</Text>
                  <Text style={styles.totalValue}>
                    {formatEstimateMoney(totals.roundOff, countryCode)}
                  </Text>
                </View>
              ) : null}
              <View style={styles.grandTotalRow}>
                <View style={[styles.grandTotalLabel, { backgroundColor: theme.accent }]}>
                  <Text style={[styles.grandTotalLabelText, { color: theme.accentText }]}>
                    {`Total (${currencyLabel}) :`}
                  </Text>
                </View>
                <View style={[styles.grandTotalValue, { backgroundColor: theme.accent }]}>
                  <Text style={[styles.grandTotalValueText, { color: theme.accentText }]}>
                    {formatEstimateMoney(totals.total, countryCode)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.footerSpacer} />
          <Text style={styles.footerNote}>{footerNote}</Text>
        </View>

        {isInvoiceDocument ? (
          <View style={[styles.docBarBottom, { backgroundColor: theme.accent }]} />
        ) : (
          <View style={[styles.docWaveBottom, { backgroundColor: theme.panel }]} />
        )}
      </A4DocumentSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, backgroundColor: colors.bg },
  rootPlain: { backgroundColor: colors.white },
  chrome: {
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgAlt,
  },
  navBtnSpacer: { width: 36, height: 36 },
  toolbarTitle: {
    flex: 1,
    minWidth: 0,
    textAlign: "center",
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.text,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.round,
    backgroundColor: colors.bgAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  secondaryBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.text,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.round,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    minWidth: 120,
  },
  primaryBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.white,
  },
  btnDisabled: { opacity: 0.55 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  errorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  errorText: { color: colors.danger, fontSize: fontSizes.md, fontWeight: "700", textAlign: "center" },
  docBody: {
    flexGrow: 1,
    paddingHorizontal: A4_PAGE_PAD_PX,
    paddingBottom: A4_PAGE_PAD_PX,
  },
  docBar: { height: 8 },
  docBarBottom: { height: 8 },
  docWaveTop: { height: 72 },
  docWaveBottom: { height: 120 },
  footerSpacer: { flexGrow: 1, minHeight: spacing.xxl },
  docHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.xl,
    paddingTop: spacing.md,
    marginBottom: spacing.xl,
  },
  docBrand: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md, minWidth: 0 },
  logo: { width: 56, height: 56 },
  logoFallback: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  logoFallbackText: { fontSize: fontSizes.sm, fontWeight: "900" },
  businessName: { flex: 1, fontSize: fontSizes.base, fontWeight: "800" },
  docHeading: {
    fontSize: 28,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  docMetaGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.xxl,
  },
  docMetaLeft: { flex: 1, gap: 3, minWidth: 0 },
  docMetaRight: { width: 280, gap: 6, flexShrink: 0 },
  docBodyText: { fontSize: 13, fontWeight: "600", color: colors.text, lineHeight: 20 },
  toBlock: { marginTop: spacing.md, gap: 2 },
  vehicleBlock: { marginTop: spacing.lg, marginBottom: spacing.sm, gap: 2 },
  toLabel: { fontSize: 13, fontWeight: "900", color: colors.text },
  toName: { fontSize: 13, fontWeight: "800", color: colors.text },
  metaRow: { flexDirection: "row", gap: spacing.sm, alignItems: "baseline" },
  metaLabel: {
    width: 108,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
  },
  metaValue: { flex: 1, fontSize: 13, fontWeight: "800", color: colors.text },
  table: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    overflow: "hidden",
  },
  tableHead: { flexDirection: "row", alignItems: "center" },
  th: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: "900",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(255,255,255,0.25)",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#D1D5DB",
  },
  td: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#E5E7EB",
  },
  tdRight: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    textAlign: "right",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#E5E7EB",
  },
  tdCenter: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#E5E7EB",
  },
  colSno: { width: 64 },
  colDesc: { flex: 1, minWidth: 0 },
  colUnit: { width: 100 },
  colQty: { width: 56 },
  colHst: { width: 64 },
  colPrice: { width: 100, borderRightWidth: 0 },
  tableEmpty: { padding: spacing.xl, alignItems: "center" },
  tableEmptyText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  totalsBlock: { paddingTop: spacing.md, paddingBottom: spacing.md, gap: 6 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  totalLabel: { fontSize: 13, fontWeight: "700", color: colors.text },
  totalValue: {
    minWidth: 88,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  discountValue: {
    color: "#047857",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.md,
  },
  grandTotalLabel: { paddingHorizontal: spacing.md, paddingVertical: 10 },
  grandTotalLabelText: { fontSize: 13, fontWeight: "900" },
  grandTotalValue: { paddingHorizontal: spacing.md, paddingVertical: 10, minWidth: 88 },
  grandTotalValueText: { fontSize: 13, fontWeight: "900", textAlign: "right" },
  footerNote: {
    textAlign: "right",
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
  },
});
