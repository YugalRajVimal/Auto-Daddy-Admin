import { LoadingProgress } from "@/components/reusables";
import { colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import {
  fetchCarOwnerJobCardById,
  resolveCarOwnerJobCardForViewer,
} from "@/lib/car-owner-job-cards";
import { JOB_CARD_PREVIEW_THEME, resolveInvoiceTheme } from "@/lib/invoice-theme";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
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
} from "@/lib/shop-job-card-estimate";
import type { CarOwnerJobCard, CarOwnerJobCardBusiness } from "@/types/car-owner-job-cards";
import type { ShopProfileBusiness } from "@/types/shop-owner";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type CarOwnerEstimatePreviewVariant = "jobcard" | "invoice";

type CarOwnerEstimatePreviewProps = {
  jobCardId: string;
  variant: CarOwnerEstimatePreviewVariant;
  cachedJobCard?: CarOwnerJobCard | null;
  invoiceNoHint?: string | null;
  callingCode?: string | null;
};

function nested(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function asShopBusiness(
  business: CarOwnerJobCard["business"] | null | undefined,
  forceInvoiceTheme: boolean
): ShopProfileBusiness | null {
  if (!business || typeof business === "string") return null;
  const b = business as CarOwnerJobCardBusiness & Record<string, unknown>;
  return {
    _id: b._id,
    businessName: b.businessName,
    businessPhone: b.businessPhone ?? b.phone,
    city: b.cityName ?? b.city,
    address: (b.businessAddress as string | undefined) ?? (b.address as string | undefined),
    businessAddress: (b.businessAddress as string | undefined) ?? (b.address as string | undefined),
    pincode: b.pincode as string | undefined,
    businessLogo: b.businessLogo as string | undefined,
    businessHSTNumber: b.businessHSTNumber as string | undefined,
    gstPercent: (b.gst as number | undefined) ?? (b.gstPercent as number | undefined),
    invoiceTemplateSlug: forceInvoiceTheme ? "modern-invoice-v2" : undefined,
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
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function vehicleSummary(job: Record<string, unknown>): {
  plate: string;
  makeModel: string;
  odoIn: string;
  odoOut: string;
} {
  const vehicle = nested(job.vehicleId) ?? nested(job.vehicle);
  const make = nested(vehicle?.make);
  const plate =
    String(vehicle?.licensePlateNo ?? job.licensePlateNo ?? "")
      .trim()
      .toUpperCase() || "—";
  const makeModel = [make?.name, make?.model].map((x) => String(x ?? "").trim()).filter(Boolean).join(" ") || "—";
  const odoInRaw = job.odometerReading ?? job.odoIn ?? vehicle?.odometerReading;
  const odoOutRaw = job.dueOdometerReading ?? job.odoOut;
  const fmt = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? `${Math.round(n).toLocaleString()} km` : "—";
  };
  return { plate, makeModel, odoIn: fmt(odoInRaw), odoOut: fmt(odoOutRaw) };
}

/**
 * Car-owner Expenses preview — matches OwnerPages Expenses dialogs:
 * - jobcard: blue viewer theme (OwnerJobCardViewerDialog)
 * - invoice: magenta modern invoice (OwnerInvoiceEstimateDialog)
 */
export function CarOwnerEstimatePreview({
  jobCardId,
  variant,
  cachedJobCard = null,
  invoiceNoHint = null,
  callingCode = null,
}: CarOwnerEstimatePreviewProps) {
  const { token, meta } = useAuth();
  const countryCode = callingCode ?? meta?.countryCode ?? null;
  const isInvoice = variant === "invoice";

  const [job, setJob] = useState<Record<string, unknown> | null>(
    cachedJobCard ? ({ ...cachedJobCard } as Record<string, unknown>) : null
  );
  const [loading, setLoading] = useState(!cachedJobCard);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !jobCardId) {
      setError("Missing job card.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCarOwnerJobCardById(token, jobCardId);
      if (res.ok) {
        const resolved = resolveCarOwnerJobCardForViewer(res.data, cachedJobCard);
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
      setError(isInvoice ? "Could not load invoice." : "Could not load job card.");
      setJob(null);
    } catch (err) {
      if (cachedJobCard && cachedJobCard._id === jobCardId) {
        setJob({ ...cachedJobCard } as Record<string, unknown>);
      } else {
        setError(err instanceof Error ? err.message : "Could not load preview.");
        setJob(null);
      }
    } finally {
      setLoading(false);
    }
  }, [token, jobCardId, cachedJobCard, isInvoice]);

  useEffect(() => {
    void load();
  }, [load]);

  const business = useMemo(
    () =>
      asShopBusiness(
        (job?.business as CarOwnerJobCard["business"]) ?? cachedJobCard?.business,
        isInvoice
      ),
    [job, cachedJobCard, isInvoice]
  );

  const theme = isInvoice ? resolveInvoiceTheme("modern-invoice-v2") : JOB_CARD_PREVIEW_THEME;
  const hstRate = job ? parseHstRate(job, business) : 13;
  const showHst = isInvoice;
  const lines = useMemo(
    () => (job ? extractEstimateLines(job, showHst ? hstRate : 0) : []),
    [job, hstRate, showHst]
  );
  const totals = useMemo(
    () =>
      job
        ? estimateTotals(lines, hstRate, job, { includeHst: showHst })
        : { subtotal: 0, discount: 0, hst: 0, roundOff: 0, total: 0 },
    [job, lines, hstRate, showHst]
  );

  const docNo = useMemo(() => {
    if (isInvoice) {
      const fromJob = pickInvoiceNoFromRecord(job);
      if (fromJob) return fromJob;
      const hint = invoiceNoHint?.trim();
      if (hint && hint !== "—") return hint;
      return pickJobNoFromRecord(job) || "—";
    }
    return pickJobNoFromRecord(job) || "—";
  }, [job, isInvoice, invoiceNoHint]);

  const currencyLabel = currencyLabelFromCode(countryCode);
  const businessBlock = buildBusinessBlock(business);
  const customerBlock = job ? buildCustomerBlock(job) : { name: "—", company: "", address: "" };
  const logoUrl = normalizeMediaUrl(business?.businessLogo);
  const hstNumber = pickBusinessHstNumber(business, job) || "—";
  const vehicle = job ? vehicleSummary(job) : null;

  if (loading && !job) {
    return (
      <View style={styles.loadingBox}>
        <LoadingProgress />
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>{error ?? "Could not load preview."}</Text>
        <Pressable style={styles.retryBtn} onPress={() => void load()}>
          <Text style={styles.retryBtnText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.scrollContent}>
      <View style={[styles.document, { borderColor: theme.border }]}>
        {isInvoice ? (
          <View style={[styles.docBar, { backgroundColor: theme.accent }]} />
        ) : (
          <View style={[styles.docWaveTop, { backgroundColor: theme.panel }]} />
        )}

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
          <Text style={[styles.docHeading, { color: theme.title }]}>
            {isInvoice ? "Invoice" : "Job Card"}
          </Text>
        </View>

        <View style={styles.docMetaGrid}>
          <View style={styles.docMetaLeft}>
            {businessBlock.address ? (
              <Text style={styles.docBodyText}>{businessBlock.address}</Text>
            ) : null}
            {businessBlock.phone ? <Text style={styles.docBodyText}>{businessBlock.phone}</Text> : null}

            <View style={styles.toBlock}>
              <Text style={styles.toLabel}>{isInvoice ? "To" : "Customer"}</Text>
              <Text style={styles.toName}>{customerBlock.name}</Text>
              {customerBlock.company ? (
                <Text style={styles.docBodyText}>{customerBlock.company}</Text>
              ) : null}
              {customerBlock.address ? (
                <Text style={styles.docBodyText}>{customerBlock.address}</Text>
              ) : null}
            </View>

            {!isInvoice && vehicle ? (
              <View style={styles.vehicleBlock}>
                <Text style={styles.toLabel}>Customer&apos;s Vehicle</Text>
                <Text style={styles.docBodyText}>Plate: {vehicle.plate}</Text>
                <Text style={styles.docBodyText}>{vehicle.makeModel}</Text>
                <Text style={styles.docBodyText}>
                  Odo In: {vehicle.odoIn} · Due: {vehicle.odoOut}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.docMetaRight}>
            <EstimateMetaRow
              label={isInvoice ? "Invoice No. :" : "Job Card No. :"}
              value={docNo}
            />
            <EstimateMetaRow
              label="Date :"
              value={formatEstimateDate(
                job.date ?? job.serviceDate ?? job.jobDate ?? job.createdAt
              )}
            />
            {showHst ? <EstimateMetaRow label="HST No. :" value={hstNumber} /> : null}
            {!isInvoice ? (
              <EstimateMetaRow
                label={`Total (${currencyLabel}) :`}
                value={formatEstimateMoney(totals.total, countryCode)}
              />
            ) : null}
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableHead, { backgroundColor: theme.accent }]}>
            <Text style={[styles.th, styles.colSno, { color: theme.accentText }]}>S. No.</Text>
            <Text style={[styles.th, styles.colDesc, { color: theme.accentText }]}>Description</Text>
            <Text style={[styles.th, styles.colUnit, { color: theme.accentText }]}>Unit</Text>
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
                  {isInvoice ? `Total (${currencyLabel}) :` : `Job Total (${currencyLabel}) :`}
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

        <Text style={styles.footerNote}>This estimate was sent using AutoDaddy</Text>

        {isInvoice ? (
          <View style={[styles.docBarBottom, { backgroundColor: theme.accent }]} />
        ) : (
          <View style={[styles.docWaveBottom, { backgroundColor: theme.panel }]} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingBox: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  errorBox: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSizes.md,
    fontWeight: "700",
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: colors.successDark,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryBtnText: { color: colors.white, fontWeight: "800", fontSize: fontSizes.sm },
  scrollContent: { paddingBottom: spacing.md },
  document: {
    borderWidth: 1,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    overflow: "hidden",
    ...shadows.soft,
  },
  docBar: { height: 6 },
  docBarBottom: { height: 6, marginTop: spacing.md },
  docWaveTop: { height: 28 },
  docWaveBottom: { height: 36, marginTop: spacing.lg },
  docHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  docBrand: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, minWidth: 0 },
  logo: { width: 48, height: 48 },
  logoFallback: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  logoFallbackText: { fontSize: fontSizes.xs, fontWeight: "900" },
  businessName: { flex: 1, fontSize: fontSizes.sm, fontWeight: "800" },
  docHeading: {
    fontSize: fontSizes.xl,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  docMetaGrid: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  docMetaLeft: { gap: 2 },
  docMetaRight: { gap: 4 },
  docBodyText: { fontSize: fontSizes.sm, fontWeight: "600", color: colors.text, lineHeight: 18 },
  toBlock: { marginTop: spacing.sm, gap: 2 },
  vehicleBlock: { marginTop: spacing.sm, gap: 2 },
  toLabel: { fontSize: fontSizes.sm, fontWeight: "900", color: colors.text },
  toName: { fontSize: fontSizes.sm, fontWeight: "800", color: colors.text },
  metaRow: { flexDirection: "row", gap: spacing.sm, alignItems: "baseline" },
  metaLabel: {
    width: 118,
    textAlign: "right",
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textMuted,
  },
  metaValue: { flex: 1, fontSize: fontSizes.sm, fontWeight: "800", color: colors.text },
  table: {
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    overflow: "hidden",
  },
  tableHead: { flexDirection: "row", alignItems: "center" },
  th: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 10,
    fontWeight: "900",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  td: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 11,
    fontWeight: "600",
    color: colors.text,
  },
  tdRight: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
    textAlign: "right",
  },
  tdCenter: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  colSno: { width: 36 },
  colDesc: { flex: 1.4, minWidth: 0 },
  colUnit: { width: 52 },
  colQty: { width: 34 },
  colHst: { width: 40 },
  colPrice: { width: 56 },
  tableEmpty: { padding: spacing.md, alignItems: "center" },
  tableEmptyText: { fontSize: fontSizes.sm, fontWeight: "600", color: colors.textMuted },
  totalsBlock: { paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: 4 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  totalLabel: { fontSize: fontSizes.sm, fontWeight: "700", color: colors.text },
  totalValue: {
    minWidth: 64,
    textAlign: "right",
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.text,
  },
  discountValue: { color: "#047857" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.sm,
  },
  grandTotalLabel: { paddingHorizontal: spacing.sm, paddingVertical: 8 },
  grandTotalLabelText: { fontSize: 11, fontWeight: "900" },
  grandTotalValue: { paddingHorizontal: spacing.sm, paddingVertical: 8, minWidth: 64 },
  grandTotalValueText: { fontSize: 11, fontWeight: "900", textAlign: "right" },
  footerNote: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    textAlign: "right",
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
  },
});
