import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";
import { Pill, SurfaceCard, useToast } from "@/components/reusables";
import { cardFontSizes, colors, fontSizes, radii, shadows, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useCarOwnerDeals } from "@/hooks/use-car-owner-deals";
import { formatCurrencyAmount } from "@/lib/currency";
import { dealCardImageAspectRatio } from "@/lib/deal-card-image";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import type { CarOwnerDeal } from "@/types/car-owner-deals";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function safeDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function dealKindLabel(dealType: string | undefined): "Service" | "Parts" {
  const v = (dealType ?? "").trim().toLowerCase();
  return v === "parts" ? "Parts" : "Service";
}

function dealTitle(d: CarOwnerDeal): string {
  const kind = dealKindLabel(d.dealType);
  if (kind === "Service") {
    return d.serviceId?.name?.trim() || "Service deal";
  }
  return d.partName?.trim() || "Parts deal";
}

function dealMetaLine(d: CarOwnerDeal): string {
  const shop = d.createdBy?.businessName?.trim() || "Auto shop";
  const city = d.createdBy?.city?.trim();
  const kind = dealKindLabel(d.dealType);
  const extra = kind === "Parts" ? d.selectedVehicle?.name?.trim() : undefined;
  return [shop, city, extra].filter(Boolean).join(" • ");
}

function isDealActive(d: CarOwnerDeal): boolean {
  const ends = Date.parse(d.offerEndsOnDate);
  return !Number.isFinite(ends) || ends >= Date.now();
}

function dealSubtitle(d: CarOwnerDeal): string | null {
  const kind = dealKindLabel(d.dealType);
  if (kind === "Parts" && d.selectedVehicle) {
    const parts = [d.selectedVehicle.name, d.selectedVehicle.model].filter(Boolean);
    if (parts.length) return parts.join("-");
  }
  const shop = d.createdBy?.businessName?.trim();
  const city = d.createdBy?.city?.trim();
  return [shop, city].filter(Boolean).join(" · ") || null;
}

function dealVehicleMakeLabel(vehicle: CarOwnerDeal["selectedVehicle"]): string {
  if (!vehicle) return "Vehicle";
  const parts = [vehicle.name?.trim(), vehicle.model?.trim(), vehicle.year?.trim()].filter(Boolean);
  return parts.length ? parts.join(" ") : "Vehicle";
}

function dealCollapsedLabels(d: CarOwnerDeal): { primary: string; secondary: string } {
  const kind = dealKindLabel(d.dealType);
  if (kind === "Parts") {
    const vehicle = dealVehicleMakeLabel(d.selectedVehicle);
    const part = d.partName?.trim() || "Parts deal";
    return { primary: vehicle, secondary: part };
  }
  const service = d.serviceId?.name?.trim() || "Service deal";
  const shop = d.createdBy?.businessName?.trim();
  return { primary: service, secondary: shop ?? "" };
}

function dealLeftTag(d: CarOwnerDeal): string {
  return dealKindLabel(d.dealType);
}

function dealRightTag(d: CarOwnerDeal, active: boolean): string {
  if (!active) return "Ended";
  if (d.offerEndsOnDate) {
    const label = safeDateLabel(d.offerEndsOnDate);
    return label ? `Ends ${label}` : "Active";
  }
  return "Active";
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

function DealCard({
  deal: d,
  expanded,
  onToggleExpanded,
  discarding,
  onContact,
  onDiscard,
}: {
  deal: CarOwnerDeal;
  expanded: boolean;
  onToggleExpanded: () => void;
  discarding: boolean;
  onContact: () => void;
  onDiscard: () => void;
}) {
  const { meta } = useAuth();
  const kind = dealKindLabel(d.dealType);
  const imageUri = normalizeMediaUrl(d.imagePath?.trim() || null);
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
            android_ripple={{ color: "rgba(22,101,52,0.08)" }}
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
            <Ionicons name="chevron-down" size={20} color={colors.successDark} />
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
          android_ripple={{ color: "rgba(22,101,52,0.08)" }}
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
          <Ionicons name="chevron-up" size={20} color={colors.successDark} />
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
            <Ionicons name={placeholderIcon} size={48} color={colors.successDark} />
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
            {formatCurrencyAmount(d.discountedPrice, meta?.countryCode, { fallback: "—" })}
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
            onPress={onContact}
            style={({ pressed }) => [styles.contactBtn, pressed && styles.actionBtnPressed]}
            android_ripple={{ color: "rgba(22,101,52,0.12)" }}
          >
            <Ionicons name="call-outline" size={17} color={colors.successDark} />
            <Text style={styles.contactBtnText}>Contact Seller</Text>
          </Pressable>
          <Pressable
            onPress={onDiscard}
            disabled={discarding}
            style={({ pressed }) => [
              styles.discardBtn,
              discarding && styles.discardBtnDisabled,
              pressed && !discarding && styles.actionBtnPressed,
            ]}
            android_ripple={{ color: "rgba(239,68,68,0.12)" }}
          >
            {discarding ? (
              <ActivityIndicator color={colors.danger} size="small" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
                <Text style={styles.discardBtnText}>Discard</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </SurfaceCard>
  );
}

type DealsFilter = "All" | "Service" | "Parts";
type DealsSort = "Newest" | "Ending soon" | "Price ↑" | "Price ↓";

function sortDeals(list: CarOwnerDeal[], sort: DealsSort): CarOwnerDeal[] {
  const withTs = list.map((d) => ({
    d,
    createdAt: Date.parse(d.createdAt),
    endsAt: Date.parse(d.offerEndsOnDate),
    price: typeof d.discountedPrice === "number" ? d.discountedPrice : Number(d.discountedPrice ?? 0),
  }));

  const safeNum = (x: number) => (Number.isFinite(x) ? x : Number.POSITIVE_INFINITY);
  const safeNumNeg = (x: number) => (Number.isFinite(x) ? x : Number.NEGATIVE_INFINITY);

  if (sort === "Ending soon") {
    withTs.sort((a, b) => safeNum(a.endsAt) - safeNum(b.endsAt));
  } else if (sort === "Price ↑") {
    withTs.sort((a, b) => safeNum(a.price) - safeNum(b.price));
  } else if (sort === "Price ↓") {
    withTs.sort((a, b) => safeNum(b.price) - safeNum(a.price));
  } else {
    withTs.sort((a, b) => safeNumNeg(b.createdAt) - safeNumNeg(a.createdAt));
  }
  return withTs.map((x) => x.d);
}

export default function Deals() {
  const { deals, loading, error, refresh, discardDeal } = useCarOwnerDeals();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<DealsFilter>("All");
  const [sort, setSort] = useState<DealsSort>("Newest");
  const [query, setQuery] = useState("");
  const [discardingIds, setDiscardingIds] = useState<Set<string>>(() => new Set());
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);

  const toggleDealExpanded = useCallback((dealId: string) => {
    setExpandedDealId((cur) => (cur === dealId ? null : dealId));
  }, []);

  const DEALS_ROUTE = "/(car-owner)/deals";

  const onOpenDealSellerShop = useCallback(
    (d: CarOwnerDeal) => {
      const id = d.createdBy?._id?.trim();
      if (!id) {
        showToast("This seller is missing a shop profile link.", { type: "info" });
        return;
      }
      router.push({
        pathname: "/(car-owner)/schedule-service/[shopId]",
        params: { shopId: id, backTo: DEALS_ROUTE },
      } as never);
    },
    [showToast]
  );

  const onDiscardDeal = useCallback(
    async (dealId: string) => {
      setDiscardingIds((prev) => new Set(prev).add(dealId));
      const result = await discardDeal(dealId);
      setDiscardingIds((prev) => {
        const next = new Set(prev);
        next.delete(dealId);
        return next;
      });
      if (result.ok) {
        setExpandedDealId((cur) => (cur === dealId ? null : cur));
        showToast("Deal discarded.", { type: "success" });
        return;
      }
      showToast(result.error, { type: "error" });
    },
    [discardDeal, showToast]
  );

  const visibleDeals = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = deals.filter((d) => {
      const kind = dealKindLabel(d.dealType);
      if (filter !== "All" && kind !== filter) return false;
      if (!q) return true;
      const title = dealTitle(d).toLowerCase();
      const meta = dealMetaLine(d).toLowerCase();
      const desc = (d.description ?? "").toLowerCase();
      return title.includes(q) || meta.includes(q) || desc.includes(q);
    });
    return sortDeals(filtered, sort);
  }, [deals, filter, query, sort]);

  return (
    <CarOwnerStackScreenFrame
      title="Deals"
      scroll={false}
      bodyStyle={styles.frameBodyNoPadding}
      contentContainerStyle={styles.frameBodyNoPadding}
      right={
        <Pressable hitSlop={10} onPress={refresh} style={styles.headerIconBtn}>
          <Ionicons name="refresh" size={20} color={colors.successDark} />
        </Pressable>
      }
    >
      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.successDark} />}
      >
        <View style={styles.controls}>
          <View style={styles.searchRow}>
            <View style={styles.searchIconBox}>
              <Ionicons name="search" size={18} color={colors.successDark} />
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search deals, shops, city…"
              placeholderTextColor={colors.textLight}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {query.trim() ? (
              <Pressable hitSlop={8} onPress={() => setQuery("")} style={styles.clearBtn} android_ripple={{ color: "rgba(15,23,42,0.06)" }}>
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {/* <SegmentedControl options={["All", "Service", "Parts"] as const} value={filter} onChange={setFilter} />
          <SegmentedControl options={["Newest", "Ending soon", "Price ↑", "Price ↓"] as const} value={sort} onChange={setSort} /> */}

          <View style={styles.controlsMetaRow}>
            <Pill variant="white" style={styles.countPill}>
              <Ionicons name="pricetags-outline" size={16} color={colors.successDark} />
              <Text style={styles.countText}>{loading && deals.length === 0 ? "…" : visibleDeals.length}</Text>
            </Pill>
            {filter !== "All" || query.trim() || sort !== "Newest" ? (
              <Pressable
                onPress={() => {
                  setFilter("All");
                  setSort("Newest");
                  setQuery("");
                }}
                style={styles.resetBtn}
                android_ripple={{ color: "rgba(22,101,52,0.10)" }}
              >
                <Ionicons name="refresh-outline" size={16} color={colors.successDark} />
                <Text style={styles.resetBtnText}>Reset</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {error ? (
          <View style={styles.centerBlock}>
            <Ionicons name="cloud-offline-outline" size={44} color={colors.textLight} />
            <Text style={styles.emptyTitle}>Couldn’t load deals</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
            <Pressable onPress={refresh} style={styles.retryBtn} android_ripple={{ color: "rgba(22,101,52,0.12)" }}>
              <Ionicons name="refresh-outline" size={18} color={colors.successDark} />
              <Text style={styles.retryBtnText}>Try again</Text>
            </Pressable>
          </View>
        ) : loading && deals.length === 0 ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator color={colors.successDark} />
            <Text style={styles.emptySubtitle}>Loading deals…</Text>
          </View>
        ) : deals.length === 0 ? (
          <View style={styles.centerBlock}>
            <Ionicons name="pricetags-outline" size={44} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No deals right now</Text>
            <Text style={styles.emptySubtitle}>When shops publish offers, they’ll show up here.</Text>
          </View>
        ) : visibleDeals.length === 0 ? (
          <View style={styles.centerBlock}>
            <Ionicons name="search-outline" size={44} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptySubtitle}>Try changing filters or clearing your search.</Text>
            <Pressable
              onPress={() => {
                setFilter("All");
                setSort("Newest");
                setQuery("");
              }}
              style={styles.retryBtn}
              android_ripple={{ color: "rgba(22,101,52,0.12)" }}
            >
              <Ionicons name="refresh-outline" size={18} color={colors.successDark} />
              <Text style={styles.retryBtnText}>Clear filters</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.dealList}>
            {visibleDeals.map((d) => (
              <DealCard
                key={d._id}
                deal={d}
                expanded={expandedDealId === d._id}
                onToggleExpanded={() => toggleDealExpanded(d._id)}
                discarding={discardingIds.has(d._id)}
                onContact={() => onOpenDealSellerShop(d)}
                onDiscard={() => void onDiscardDeal(d._id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </CarOwnerStackScreenFrame>
  );
}

const styles = StyleSheet.create({
  frameBodyNoPadding: {
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  body: { flex: 1, backgroundColor: colors.bgProfile },
  content: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xxl,
  },
  screenIntro: {
    ...typography.bodyMuted,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.18)",
  },

  centerBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
    gap: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
  },
  emptySubtitle: {
    ...typography.bodyMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.round,
    backgroundColor: colors.successMuted,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.2)",
  },
  retryBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.successDark,
  },

  controls: { gap: spacing.sm, marginBottom: spacing.lg },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    ...shadows.soft,
  },
  searchIconBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.successMuted,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: { flex: 1, fontSize: fontSizes.md, fontWeight: "700", color: colors.text },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.06)",
  },
  controlsMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  countPill: { ...shadows.soft },
  countText: { fontSize: cardFontSizes.md, fontWeight: "900", color: colors.text },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.round,
    backgroundColor: colors.successMuted,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.18)",
  },
  resetBtnText: { fontSize: cardFontSizes.sm, fontWeight: "900", color: colors.successDark },

  dealList: { gap: spacing.xl, paddingBottom: spacing.sm },

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
    backgroundColor: colors.successMuted,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.14)",
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
  ribbonFoldActive: { backgroundColor: colors.successDark },
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
  ribbonActive: { backgroundColor: colors.success },
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
    color: colors.successDark,
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
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.round,
    backgroundColor: colors.successMuted,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.2)",
    minHeight: 44,
  },
  contactBtnText: {
    fontSize: cardFontSizes.md,
    fontWeight: "900",
    color: colors.successDark,
  },
  discardBtn: {
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
  discardBtnDisabled: { opacity: 0.65 },
  discardBtnText: {
    fontSize: cardFontSizes.md,
    fontWeight: "900",
    color: colors.danger,
  },
  actionBtnPressed: { opacity: 0.88 },
});