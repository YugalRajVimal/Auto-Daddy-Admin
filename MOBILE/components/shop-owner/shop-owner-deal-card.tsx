import { SurfaceCard } from "@/components/reusables";
import { cardFontSizes, colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { formatCurrencyAmount } from "@/lib/currency";
import { dealCardImageAspectRatio } from "@/lib/deal-card-image";
import { isDealSold } from "@/lib/shop-deal-sales";
import {
  isPartsDeal,
  isSalvagesDeal,
  shopDealDiscountLabel,
} from "@/lib/shop-owner-parsers";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import type { MyCustomer } from "@/types/auto-shop-owner-endpoints";
import type { ShopDeal } from "@/types/auto-shop-owner-endpoints";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

function safeDateLabel(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function dealModeOf(d: ShopDeal): "Service" | "Parts" | "Salvages" {
  if (isSalvagesDeal(d)) return "Salvages";
  if (isPartsDeal(d)) return "Parts";
  const kind = (d.dealType ?? "").trim().toLowerCase();
  if (kind === "parts") return "Parts";
  if (d.partName || d.selectedVehicle?.vehicleName || d.selectedVehicle?.name) return "Parts";
  return "Service";
}

function dealTitle(d: ShopDeal): string {
  const kind = dealModeOf(d);
  if (kind === "Parts" || kind === "Salvages") {
    return d.partName?.trim() || d.productName?.trim() || "Parts deal";
  }
  return (
    d.subServiceName?.trim() ||
    d.productName?.trim() ||
    d.description?.trim() ||
    d.service?.name?.trim() ||
    "Service deal"
  );
}

function dealSubtitle(d: ShopDeal): string | null {
  const kind = dealModeOf(d);
  if ((kind === "Parts" || kind === "Salvages") && d.selectedVehicle) {
    const parts = [
      d.selectedVehicle.name ?? d.selectedVehicle.vehicleName,
      d.selectedVehicle.model,
      d.selectedVehicle.year,
    ].filter(Boolean);
    if (parts.length) return parts.join(" · ");
  }
  return d.description?.trim() || null;
}

function dealVehicleMakeLabel(vehicle: ShopDeal["selectedVehicle"]): string {
  if (!vehicle) return "Vehicle";
  const parts = [
    vehicle.name?.trim() ?? vehicle.vehicleName?.trim(),
    vehicle.model?.trim(),
    vehicle.year?.trim(),
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : "Vehicle";
}

function dealCollapsedLabels(d: ShopDeal): { primary: string; secondary: string } {
  const kind = dealModeOf(d);
  if (kind === "Parts" || kind === "Salvages") {
    const vehicle = dealVehicleMakeLabel(d.selectedVehicle);
    const part = d.partName?.trim() || d.productName?.trim() || "Parts deal";
    return { primary: vehicle, secondary: part };
  }
  const service =
    d.subServiceName?.trim() || d.service?.name?.trim() || d.productName?.trim() || "Service deal";
  const desc = d.description?.trim();
  return { primary: service, secondary: desc ?? "" };
}

function dealStatusLabel(d: ShopDeal): string {
  if (isDealSold(d)) return "Sold";
  return d.dealEnabled === false ? "Non-Active" : "Active";
}

function dealImageUri(d: ShopDeal): string | null {
  const raw = d.dealImage?.trim() || d.productImage?.trim() || null;
  return normalizeMediaUrl(raw);
}

function CornerRibbon({ label, tone }: { label: string; tone: "active" | "ended" | "sold" }) {
  const foldStyle =
    tone === "sold" ? styles.ribbonFoldSold : tone === "active" ? styles.ribbonFoldActive : styles.ribbonFoldEnded;
  const ribbonStyle =
    tone === "sold" ? styles.ribbonSold : tone === "active" ? styles.ribbonActive : styles.ribbonEnded;
  return (
    <View style={styles.ribbonWrap} pointerEvents="none">
      <View style={[styles.ribbonFold, foldStyle]} />
      <View style={[styles.ribbon, ribbonStyle]}>
        <Text style={styles.ribbonText}>{label}</Text>
      </View>
    </View>
  );
}

function DealCollapsedThumb({
  imageUri,
  placeholderIcon,
}: {
  imageUri: string | null;
  placeholderIcon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.collapsedThumb}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.collapsedThumbImg} contentFit="cover" transition={120} />
      ) : (
        <Ionicons name={placeholderIcon} size={28} color={colors.textLight} />
      )}
    </View>
  );
}

export function ShopOwnerDealCard({
  deal: d,
  expanded,
  onToggleExpanded,
  deleting,
  deactivating,
  selling,
  showSell,
  customers,
  soldDraftCustomerId,
  onSoldDraftChange,
  onSell,
  onEdit,
  onDelete,
  onDeactivate,
}: {
  deal: ShopDeal;
  expanded: boolean;
  onToggleExpanded: () => void;
  deleting?: boolean;
  deactivating?: boolean;
  selling?: boolean;
  showSell?: boolean;
  customers?: MyCustomer[];
  soldDraftCustomerId?: string;
  onSoldDraftChange?: (customerId: string) => void;
  onSell?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDeactivate?: () => void;
}) {
  const { meta } = useAuth();
  const [customerListOpen, setCustomerListOpen] = useState(false);
  const kind = dealModeOf(d);
  const imageUri = dealImageUri(d);
  const description = d.description?.trim();
  const sold = isDealSold(d);
  const status = dealStatusLabel(d);
  const subtitle = dealSubtitle(d);
  const collapsedLabels = dealCollapsedLabels(d);
  const placeholderIcon =
    kind === "Salvages" ? "car-sport-outline" : kind === "Parts" ? "settings-outline" : "construct-outline";
  const imageAspect = dealCardImageAspectRatio();
  const discountLabel = shopDealDiscountLabel(d);
  const priceDisplay =
    kind === "Service"
      ? discountLabel
      : formatCurrencyAmount(d.discountedPrice ?? d.price, meta?.countryCode, { fallback: discountLabel });
  const ribbonTone = sold ? "sold" : status === "Active" ? "active" : "ended";
  const canSell = Boolean(showSell && !sold && soldDraftCustomerId && !selling);

  const customerOptions = useMemo(() => {
    const rows: { id: string; label: string }[] = [];
    for (const customer of customers ?? []) {
      const cid = (customer.carOwnerId ?? customer.id ?? customer._id ?? "").trim();
      if (!cid) continue;
      rows.push({
        id: cid,
        label: customer.name?.trim() || customer.phone?.trim() || "Customer",
      });
    }
    return rows;
  }, [customers]);

  const selectedCustomerLabel =
    customerOptions.find((c) => c.id === soldDraftCustomerId)?.label || "None";

  if (!expanded) {
    return (
      <SurfaceCard shadow="card" style={styles.card}>
        <View style={styles.collapsedRow}>
          <DealCollapsedThumb imageUri={imageUri} placeholderIcon={placeholderIcon} />
          <Pressable
            onPress={onToggleExpanded}
            style={styles.collapsedTitlePress}
            android_ripple={{ color: "rgba(37,99,235,0.08)" }}
            accessibilityRole="button"
            accessibilityLabel={`Expand deal for ${collapsedLabels.primary}`}
          >
            <Text style={styles.collapsedPrimary} numberOfLines={1}>
              {collapsedLabels.primary}
            </Text>
            {collapsedLabels.secondary ? (
              <Text style={styles.collapsedSecondary} numberOfLines={2}>
                {collapsedLabels.secondary}
              </Text>
            ) : null}
            <Text style={styles.collapsedStatus} numberOfLines={1}>
              {status}
              {sold && d.soldToCustomerName ? ` · ${d.soldToCustomerName}` : ""}
            </Text>
          </Pressable>
          <Pressable
            onPress={onToggleExpanded}
            style={styles.collapsedChevBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Expand deal"
          >
            <Ionicons name="chevron-down" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard shadow="card" style={styles.card}>
      <View style={[styles.collapsedRow, styles.expandedHeaderRow]}>
        <Pressable
          onPress={onToggleExpanded}
          style={styles.collapsedTitlePress}
          android_ripple={{ color: "rgba(37,99,235,0.08)" }}
          accessibilityRole="button"
          accessibilityLabel={`Collapse deal for ${collapsedLabels.primary}`}
        >
          <Text style={styles.collapsedPrimary} numberOfLines={1}>
            {collapsedLabels.primary}
          </Text>
          {collapsedLabels.secondary ? (
            <Text style={styles.collapsedSecondary} numberOfLines={2}>
              {collapsedLabels.secondary}
            </Text>
          ) : null}
        </Pressable>
        <Pressable
          onPress={onToggleExpanded}
          style={styles.collapsedChevBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Collapse deal"
        >
          <Ionicons name="chevron-up" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.cardImageSection}>
        <CornerRibbon label={status} tone={ribbonTone} />
        {imageUri ? (
          <View style={[styles.cardImageFrame, { aspectRatio: imageAspect }]}>
            <Image source={{ uri: imageUri }} style={styles.cardImage} contentFit="cover" transition={180} />
          </View>
        ) : (
          <View style={[styles.cardImageFallback, { aspectRatio: imageAspect }]}>
            <Ionicons name={placeholderIcon} size={48} color={colors.primary} />
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {dealTitle(d)}
            </Text>
            {subtitle ? (
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
            {d.offersEndOnDate ? (
              <Text style={styles.cardMeta}>Ends {safeDateLabel(d.offersEndOnDate)}</Text>
            ) : null}
          </View>
          <Text style={styles.cardPrice}>{priceDisplay}</Text>
        </View>

        <View style={styles.descBox}>
          {description ? (
            <Text style={styles.descBoxText} numberOfLines={3}>
              {description}
            </Text>
          ) : (
            <Text style={styles.descBoxPlaceholder}>Description</Text>
          )}
        </View>

        <View style={styles.tagRow}>
          <View style={styles.tagBox}>
            <Text style={styles.tagBoxText}>{kind}</Text>
          </View>
          <View style={styles.tagBox}>
            <Text style={styles.tagBoxText}>{status}</Text>
          </View>
        </View>

        {showSell ? (
          <View style={styles.sellBlock}>
            <Text style={styles.sellLabel}>Sold to</Text>
            {sold ? (
              <Text style={styles.soldToText}>{d.soldToCustomerName?.trim() || "—"}</Text>
            ) : (
              <>
                <View style={styles.soldToRow}>
                  <View style={styles.customerListWrap}>
                    <Pressable
                      style={styles.customerListBox}
                      onPress={() => setCustomerListOpen((open) => !open)}
                      accessibilityRole="button"
                      accessibilityLabel="Select sold-to customer"
                    >
                      <Text
                        style={[
                          styles.customerListValue,
                          !soldDraftCustomerId && styles.customerListPlaceholder,
                        ]}
                        numberOfLines={1}
                      >
                        {selectedCustomerLabel}
                      </Text>
                      <Ionicons
                        name={customerListOpen ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={colors.textMuted}
                      />
                    </Pressable>
                    {customerListOpen ? (
                      <View style={styles.customerListDropdown}>
                        <ScrollView
                          nestedScrollEnabled
                          keyboardShouldPersistTaps="handled"
                          style={styles.customerListScroll}
                        >
                          <Pressable
                            style={[
                              styles.customerListItem,
                              !soldDraftCustomerId && styles.customerListItemActive,
                            ]}
                            onPress={() => {
                              onSoldDraftChange?.("");
                              setCustomerListOpen(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.customerListItemText,
                                !soldDraftCustomerId && styles.customerListItemTextActive,
                              ]}
                            >
                              None
                            </Text>
                          </Pressable>
                          {customerOptions.map((customer) => {
                            const active = soldDraftCustomerId === customer.id;
                            return (
                              <Pressable
                                key={customer.id}
                                style={[
                                  styles.customerListItem,
                                  active && styles.customerListItemActive,
                                ]}
                                onPress={() => {
                                  onSoldDraftChange?.(customer.id);
                                  setCustomerListOpen(false);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.customerListItemText,
                                    active && styles.customerListItemTextActive,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {customer.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      </View>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={onSell}
                    disabled={!canSell}
                    style={[styles.sellBtn, !canSell && styles.sellBtnDisabled]}
                  >
                    {selling ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Text style={styles.sellBtnText}>Sell</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        ) : null}

        {!sold ? (
          <View style={styles.actionRow}>
            <Pressable
              onPress={onEdit}
              style={({ pressed }) => [styles.editBtn, pressed && styles.actionBtnPressed]}
              android_ripple={{ color: "rgba(37,99,235,0.12)" }}
            >
              <Ionicons name="pencil-outline" size={17} color={colors.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
            {onDeactivate && d.dealEnabled !== false ? (
              <Pressable
                onPress={onDeactivate}
                disabled={deactivating}
                style={({ pressed }) => [
                  styles.deactivateBtn,
                  deactivating && styles.deleteBtnDisabled,
                  pressed && !deactivating && styles.actionBtnPressed,
                ]}
              >
                {deactivating ? (
                  <ActivityIndicator color={colors.textMuted} size="small" />
                ) : (
                  <>
                    <Ionicons name="pause-circle-outline" size={17} color={colors.textMuted} />
                    <Text style={styles.deactivateBtnText}>Non-Active</Text>
                  </>
                )}
              </Pressable>
            ) : null}
            <Pressable
              onPress={onDelete}
              disabled={deleting}
              style={({ pressed }) => [
                styles.deleteBtn,
                deleting && styles.deleteBtnDisabled,
                pressed && !deleting && styles.actionBtnPressed,
              ]}
              android_ripple={{ color: "rgba(239,68,68,0.12)" }}
            >
              {deleting ? (
                <ActivityIndicator color={colors.danger} size="small" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={17} color={colors.danger} />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : null}
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.hero,
    padding: 0,
    overflow: "hidden",
  },
  collapsedRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    gap: spacing.md,
    minHeight: 76,
    backgroundColor: colors.white,
  },
  expandedHeaderRow: {
    minHeight: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  collapsedThumb: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  collapsedThumbImg: {
    width: "100%",
    height: "100%",
  },
  collapsedTitlePress: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    justifyContent: "center",
    minHeight: 44,
  },
  collapsedPrimary: {
    fontSize: fontSizes.lg,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: 0.2,
  },
  collapsedSecondary: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
    lineHeight: 18,
  },
  collapsedStatus: {
    marginTop: 2,
    fontSize: cardFontSizes.sm,
    fontWeight: "700",
    color: colors.primary,
  },
  collapsedChevBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryMutedBg,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.18)",
  },
  cardImageSection: {
    backgroundColor: colors.white,
    alignItems: "stretch",
    justifyContent: "center",
    overflow: "hidden",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardImageFrame: {
    width: "100%",
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.bgAlt,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardImageFallback: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgAlt,
    borderRadius: radii.lg,
  },
  ribbonWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 88,
    height: 88,
    zIndex: 2,
    overflow: "hidden",
  },
  ribbonFold: {
    position: "absolute",
    top: 10,
    left: -2,
    width: 14,
    height: 52,
    transform: [{ rotate: "-45deg" }],
  },
  ribbonFoldActive: { backgroundColor: colors.primaryDark },
  ribbonFoldEnded: { backgroundColor: colors.textMuted },
  ribbonFoldSold: { backgroundColor: "#1B7A3D" },
  ribbon: {
    position: "absolute",
    top: 14,
    left: -30,
    width: 120,
    paddingVertical: 6,
    alignItems: "center",
    transform: [{ rotate: "-45deg" }],
  },
  ribbonActive: { backgroundColor: colors.primary },
  ribbonEnded: { backgroundColor: colors.textLight },
  ribbonSold: { backgroundColor: "#2E9B57" },
  ribbonText: {
    fontSize: cardFontSizes.sm,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: 0.4,
  },
  cardBody: {
    backgroundColor: colors.bgDeals,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  cardHeaderLeft: { flex: 1, minWidth: 0, gap: 4 },
  cardTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "900",
    color: colors.text,
    lineHeight: 24,
  },
  cardSubtitle: {
    fontSize: cardFontSizes.md,
    fontWeight: "600",
    color: colors.textMuted,
  },
  cardMeta: {
    fontSize: cardFontSizes.sm,
    fontWeight: "600",
    color: colors.textLight,
  },
  cardPrice: {
    fontSize: fontSizes.lg,
    fontWeight: "900",
    color: colors.primary,
    flexShrink: 0,
    paddingTop: 2,
  },
  descBox: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    minHeight: 44,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  descBoxText: {
    width: "100%",
    fontSize: cardFontSizes.md,
    fontWeight: "600",
    color: colors.textMuted,
    lineHeight: 21,
    textAlign: "center",
  },
  descBoxPlaceholder: {
    fontSize: cardFontSizes.md,
    fontWeight: "700",
    color: colors.textLight,
    textAlign: "center",
  },
  tagRow: { flexDirection: "row", gap: spacing.sm },
  tagBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagBoxText: {
    fontSize: cardFontSizes.md,
    fontWeight: "700",
    color: colors.textMuted,
    textAlign: "center",
  },
  sellBlock: {
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sellLabel: {
    fontSize: cardFontSizes.sm,
    fontWeight: "800",
    color: colors.textMuted,
  },
  soldToText: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.text,
  },
  soldToRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  customerListWrap: {
    flex: 1,
    minWidth: 0,
    zIndex: 4,
  },
  customerListBox: {
    minHeight: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  customerListValue: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.text,
  },
  customerListPlaceholder: {
    color: colors.textLight,
  },
  customerListDropdown: {
    marginTop: 4,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  customerListScroll: {
    maxHeight: 180,
  },
  customerListItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  customerListItemActive: {
    backgroundColor: colors.primaryMutedBg,
  },
  customerListItemText: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.text,
  },
  customerListItemTextActive: {
    color: colors.primary,
    fontWeight: "800",
  },
  sellBtn: {
    minHeight: 40,
    minWidth: 72,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "#2E9B57",
    alignItems: "center",
    justifyContent: "center",
  },
  sellBtnDisabled: { opacity: 0.55 },
  sellBtnText: {
    color: colors.white,
    fontSize: cardFontSizes.md,
    fontWeight: "900",
  },
  actionRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  editBtn: {
    flexGrow: 1,
    flexBasis: "30%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.round,
    backgroundColor: colors.primaryMutedBg,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.22)",
    minHeight: 44,
  },
  editBtnText: {
    fontSize: cardFontSizes.md,
    fontWeight: "900",
    color: colors.primary,
  },
  deactivateBtn: {
    flexGrow: 1,
    flexBasis: "30%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.round,
    backgroundColor: "#F1F4FA",
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  deactivateBtnText: {
    fontSize: cardFontSizes.md,
    fontWeight: "900",
    color: colors.textMuted,
  },
  deleteBtn: {
    flexGrow: 1,
    flexBasis: "30%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.round,
    backgroundColor: colors.dangerMuted,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.22)",
    minHeight: 44,
  },
  deleteBtnDisabled: { opacity: 0.65 },
  deleteBtnText: {
    fontSize: cardFontSizes.md,
    fontWeight: "900",
    color: colors.danger,
  },
  actionBtnPressed: { opacity: 0.88 },
});
