import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import { resolveInvoiceTheme } from "@/lib/invoice-theme";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import {
  DEFAULT_INVOICE_PREVIEW,
  calcInvoiceTotals,
  formatInvoiceMoney,
  type InvoicePreviewData,
} from "@/lib/sample-invoice-data";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

const THUMB_SCALE = 0.38;

type InvoiceTemplatePreviewProps = {
  templateId: string;
  data?: InvoicePreviewData;
  mode?: "thumbnail" | "full";
};

function EstimateStyleInvoice({
  data,
  templateId,
  compact = false,
}: {
  data: InvoicePreviewData;
  templateId: string;
  compact?: boolean;
}) {
  const theme = resolveInvoiceTheme(templateId);
  const { subTotal, tax, total } = calcInvoiceTotals(data);
  const { shop, customer, items, currency } = data;
  const logoUrl = normalizeMediaUrl(shop.logoUrl ?? null);
  const pad = compact ? spacing.sm + 2 : spacing.md + 2;
  const cellPad = compact ? 4 : 6;
  const titleSize = compact ? fontSizes.md : fontSizes.xl;
  const bodySize = compact ? 10 : fontSizes.sm;
  const headSize = compact ? 9 : fontSizes.xs;

  return (
    <View style={styles.invoice}>
      <View style={[styles.accentBar, { backgroundColor: theme.accent }]} />
      <View style={{ padding: pad }}>
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logo} contentFit="contain" />
            ) : (
              <View style={[styles.logoFallback, { backgroundColor: theme.accent }]}>
                <Text style={[styles.logoFallbackText, { color: theme.accentText }]}>AD</Text>
              </View>
            )}
            <Text style={[styles.shopName, { color: theme.title, fontSize: bodySize }]} numberOfLines={2}>
              {shop.name}
            </Text>
          </View>
          <Text style={[styles.docTitle, { color: theme.title, fontSize: titleSize }]}>Invoice</Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaCol}>
            {shop.address ? (
              <Text style={[styles.metaText, { fontSize: bodySize }]}>{shop.address}</Text>
            ) : null}
            {shop.phone ? (
              <Text style={[styles.metaText, { fontSize: bodySize }]}>{shop.phone}</Text>
            ) : null}
            <Text style={[styles.toLabel, { fontSize: bodySize }]}>To</Text>
            <Text style={[styles.toName, { fontSize: bodySize }]}>{customer.name}</Text>
            {customer.title ? (
              <Text style={[styles.metaText, { fontSize: bodySize }]}>{customer.title}</Text>
            ) : null}
            {customer.address ? (
              <Text style={[styles.metaText, { fontSize: bodySize }]}>{customer.address}</Text>
            ) : null}
          </View>
          <View style={styles.metaColRight}>
            <MetaLine label="Invoice No. :" value={data.invoiceNo} size={bodySize} />
            <MetaLine label="Date :" value={data.invoiceDate} size={bodySize} />
            <MetaLine label="HST No. :" value={data.accountId} size={bodySize} />
          </View>
        </View>

        <View style={[styles.table, { borderColor: theme.border }]}>
          <View style={[styles.tableHead, { backgroundColor: theme.accent }]}>
            <Text style={[styles.th, styles.colSn, { color: theme.accentText, fontSize: headSize }]}>
              S. No.
            </Text>
            <Text style={[styles.th, styles.colDesc, { color: theme.accentText, fontSize: headSize }]}>
              Description
            </Text>
            {!compact ? (
              <Text style={[styles.th, styles.colNum, { color: theme.accentText, fontSize: headSize }]}>
                Unit Cost
              </Text>
            ) : null}
            <Text style={[styles.th, styles.colQty, { color: theme.accentText, fontSize: headSize }]}>
              Qty
            </Text>
            {!compact ? (
              <Text style={[styles.th, styles.colNum, { color: theme.accentText, fontSize: headSize }]}>
                HST
              </Text>
            ) : null}
            <Text style={[styles.th, styles.colNum, { color: theme.accentText, fontSize: headSize }]}>
              Price
            </Text>
          </View>

          {items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.tableRow,
                { paddingVertical: cellPad },
                index % 2 === 1 ? { backgroundColor: theme.stripe } : null,
              ]}
            >
              <Text style={[styles.td, styles.colSn, { fontSize: bodySize }]}>{index + 1}.</Text>
              <Text style={[styles.td, styles.colDesc, { fontSize: bodySize }]} numberOfLines={compact ? 2 : 3}>
                {item.name}
                {item.description ? ` — ${item.description}` : ""}
              </Text>
              {!compact ? (
                <Text style={[styles.td, styles.colNum, { fontSize: bodySize }]}>
                  {formatInvoiceMoney(item.price, currency)}
                </Text>
              ) : null}
              <Text style={[styles.td, styles.colQty, { fontSize: bodySize }]}>{item.quantity}</Text>
              {!compact ? (
                <Text style={[styles.td, styles.colNum, { fontSize: bodySize }]}>{data.taxPercent}%</Text>
              ) : null}
              <Text style={[styles.td, styles.colNum, { fontSize: bodySize }]}>
                {formatInvoiceMoney(item.price * item.quantity, currency)}
              </Text>
            </View>
          ))}

          <View style={[styles.totalsRow, { borderColor: theme.border }]}>
            <Text style={[styles.totalsLabel, { fontSize: bodySize }]}>Subtotal :</Text>
            <Text style={[styles.totalsValue, { fontSize: bodySize }]}>
              {formatInvoiceMoney(subTotal, currency)}
            </Text>
          </View>
          <View style={[styles.totalsRow, { borderColor: theme.border }]}>
            <Text style={[styles.totalsLabel, { fontSize: bodySize }]}>HST :</Text>
            <Text style={[styles.totalsValue, { fontSize: bodySize }]}>
              {formatInvoiceMoney(tax, currency)}
            </Text>
          </View>
          <View
            style={[
              styles.totalsRow,
              styles.totalsTotal,
              { backgroundColor: theme.accent, borderColor: theme.accent },
            ]}
          >
            <Text style={[styles.totalsLabel, { color: theme.accentText, fontSize: bodySize }]}>
              Total ({currency}) :
            </Text>
            <Text style={[styles.totalsValue, { color: theme.accentText, fontSize: bodySize }]}>
              {formatInvoiceMoney(total, currency)}
            </Text>
          </View>
        </View>

        <Text style={[styles.footerNote, { fontSize: compact ? 8 : 10 }]}>
          This estimate was sent using AutoDaddy
        </Text>
      </View>
      <View style={[styles.accentBar, { backgroundColor: theme.accent }]} />
    </View>
  );
}

function MetaLine({ label, value, size }: { label: string; value: string; size: number }) {
  return (
    <View style={styles.metaLine}>
      <Text style={[styles.metaLineLabel, { fontSize: size }]}>{label}</Text>
      <Text style={[styles.metaLineValue, { fontSize: size }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function InvoiceTemplatePreview({
  templateId,
  data = DEFAULT_INVOICE_PREVIEW,
  mode = "full",
}: InvoiceTemplatePreviewProps) {
  const [contentH, setContentH] = useState(0);
  const [containerW, setContainerW] = useState(0);

  if (mode === "thumbnail") {
    const onContainerLayout = (e: LayoutChangeEvent) => {
      setContainerW(e.nativeEvent.layout.width);
    };
    const onContentLayout = (e: LayoutChangeEvent) => {
      setContentH(e.nativeEvent.layout.height);
    };
    const scaledH = contentH > 0 ? contentH * THUMB_SCALE : 168;

    return (
      <View
        style={[styles.thumbClip, { height: scaledH }]}
        onLayout={onContainerLayout}
        pointerEvents="none"
      >
        {containerW > 0 ? (
          <View
            // Expo 54 / RN 0.81+: scale from top-left so thumbnail fills the card width.
            style={{
              width: containerW / THUMB_SCALE,
              transform: [{ scale: THUMB_SCALE }],
              // @ts-expect-error transformOrigin is supported at runtime on modern RN
              transformOrigin: "top left",
            }}
            onLayout={onContentLayout}
          >
            <EstimateStyleInvoice data={data} templateId={templateId} compact />
          </View>
        ) : null}
      </View>
    );
  }

  return <EstimateStyleInvoice data={data} templateId={templateId} />;
}

const styles = StyleSheet.create({
  invoice: {
    backgroundColor: colors.white,
  },
  accentBar: {
    height: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  brandRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 0,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
  },
  logoFallback: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  logoFallbackText: {
    fontSize: fontSizes.xs,
    fontWeight: "800",
  },
  shopName: {
    flex: 1,
    fontWeight: "700",
  },
  docTitle: {
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metaGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metaCol: {
    flex: 1,
    gap: 2,
  },
  metaColRight: {
    flex: 1,
    gap: 4,
  },
  metaText: {
    color: colors.textMuted,
  },
  toLabel: {
    marginTop: spacing.sm,
    fontWeight: "800",
    color: colors.text,
  },
  toName: {
    fontWeight: "700",
    color: colors.text,
  },
  metaLine: {
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "flex-end",
  },
  metaLineLabel: {
    fontWeight: "600",
    color: colors.textMuted,
  },
  metaLineValue: {
    fontWeight: "700",
    color: colors.text,
    maxWidth: "55%",
  },
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.sm,
    overflow: "hidden",
  },
  tableHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  th: {
    fontWeight: "800",
  },
  td: {
    color: colors.text,
  },
  colSn: { width: "12%" },
  colDesc: { flex: 1, paddingRight: 4 },
  colQty: { width: "10%", textAlign: "center" },
  colNum: { width: "16%", textAlign: "right" },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalsTotal: {
    borderTopWidth: 0,
  },
  totalsLabel: {
    fontWeight: "700",
    color: colors.text,
  },
  totalsValue: {
    fontWeight: "700",
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  footerNote: {
    marginTop: spacing.md,
    textAlign: "right",
    color: colors.textLight,
  },
  thumbClip: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: colors.white,
  },
});
