import { SurfaceCard } from "@/components/reusables";
import { cardFontSizes, colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { formatCurrencyAmount } from "@/lib/currency";
import { dealCardImageAspectRatio } from "@/lib/deal-card-image";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import type { ShopDeal } from "@/types/auto-shop-owner-endpoints";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Pressable,
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

function dealKindLabel(dealType: string | undefined): "Service" | "Parts" {
  const v = (dealType ?? "").trim().toLowerCase();
  return v === "parts" ? "Parts" : "Service";
}

function dealModeOf(d: ShopDeal): "Service" | "Parts" {
  const kind = (d.dealType ?? "").trim().toLowerCase();
  if (kind === "parts") return "Parts";
  if (kind === "service") return "Service";
  if (d.partName || d.selectedVehicle?.vehicleName || d.selectedVehicle?.name) return "Parts";
  return "Service";
}

function dealTitle(d: ShopDeal): string {
  const kind = dealModeOf(d);
  if (kind === "Parts") {
    return d.partName?.trim() || d.productName?.trim() || "Parts deal";
  }
  return d.service?.name?.trim() || d.productName?.trim() || "Service deal";
}

function dealSubtitle(d: ShopDeal): string | null {
  const kind = dealModeOf(d);
  if (kind === "Parts" && d.selectedVehicle) {
    const parts = [
      d.selectedVehicle.name ?? d.selectedVehicle.vehicleName,
      d.selectedVehicle.model,
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
  if (kind === "Parts") {
    const vehicle = dealVehicleMakeLabel(d.selectedVehicle);
    const part = d.partName?.trim() || d.productName?.trim() || "Parts deal";
    return { primary: vehicle, secondary: part };
  }
  const service = d.service?.name?.trim() || d.productName?.trim() || "Service deal";
  const desc = d.description?.trim();
  return { primary: service, secondary: desc ?? "" };
}

function dealLeftTag(d: ShopDeal): string {
  return dealKindLabel(d.dealType);
}

function isDealActive(d: ShopDeal): boolean {
  const ends = Date.parse(d.offersEndOnDate ?? "");
  return !Number.isFinite(ends) || ends >= Date.now();
}

function dealRightTag(d: ShopDeal, active: boolean): string {
  if (!active) return "Ended";
  if (d.offersEndOnDate) {
    const label = safeDateLabel(d.offersEndOnDate);
    return label ? `Ends ${label}` : "Active";
  }
  return d.dealEnabled === false ? "Disabled" : "Active";
}

function dealImageUri(d: ShopDeal): string | null {
  const raw = d.dealImage?.trim() || d.productImage?.trim() || null;
  return normalizeMediaUrl(raw);
}

function CornerRibbon({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={styles.ribbonWrap} pointerEvents="none">
      <View style={[styles.ribbonFold, active ? styles.ribbonFoldActive : styles.ribbonFoldEnded]} />
      <View style={[styles.ribbon, active ? styles.ribbonActive : styles.ribbonEnded]}>
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
  onEdit,
  onDelete,
}: {
  deal: ShopDeal;
  expanded: boolean;
  onToggleExpanded: () => void;
  deleting?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { meta } = useAuth();
  const kind = dealModeOf(d);
  const imageUri = dealImageUri(d);
  const description = d.description?.trim();
  const active = isDealActive(d);
  const subtitle = dealSubtitle(d);
  const collapsedLabels = dealCollapsedLabels(d);
  const placeholderIcon = kind === "Parts" ? "settings-outline" : "construct-outline";
  const imageAspect = dealCardImageAspectRatio();

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
        <CornerRibbon label={active ? "Active" : "Ended"} active={active} />
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
          </View>
          <Text style={styles.cardPrice}>
            {formatCurrencyAmount(d.discountedPrice ?? d.price, meta?.countryCode, { fallback: "—" })}
          </Text>
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
            <Text style={styles.tagBoxText}>{dealLeftTag(d)}</Text>
          </View>
          <View style={styles.tagBox}>
            <Text style={styles.tagBoxText}>{dealRightTag(d, active)}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={onEdit}
            style={({ pressed }) => [styles.editBtn, pressed && styles.actionBtnPressed]}
            android_ripple={{ color: "rgba(37,99,235,0.12)" }}
          >
            <Ionicons name="pencil-outline" size={17} color={colors.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
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
  actionRow: { flexDirection: "row", gap: spacing.sm },
  editBtn: {
    flex: 1,
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
  deleteBtn: {
    flex: 1,
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
