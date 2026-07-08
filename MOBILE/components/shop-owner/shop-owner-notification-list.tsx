import { Pill, SurfaceCard } from "@/components/reusables";
import { cardFontSizes, colors, fontSizes, gradients, radii, shadows, spacing, typography } from "@/constants/autodaddy";
import { useShopOwnerNotifications } from "@/context/shop-owner-notifications-provider";
import { usePaginatedShopOwnerNotifications } from "@/hooks/use-paginated-shop-owner-notifications";
import { parseShopOwnerNotificationMessage } from "@/lib/parse-shop-owner-notification-message";
import { latestShopOwnerNotificationTime } from "@/lib/shop-owner-notification-read-state";
import type { ShopOwnerNotification } from "@/types/shop-owner-notifications";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ColorValue,
} from "react-native";

type Props = {
  authToken: string | null;
  enabled: boolean;
};

type NotificationVisual = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  accent: string;
  label: string;
};

type ListEntry =
  | { kind: "header"; key: string; title: string }
  | { kind: "item"; key: string; item: ShopOwnerNotification; recent: boolean };

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sectionTitleForDate(d: Date, now = new Date()): string {
  const day = startOfDay(d).getTime();
  const today = startOfDay(now).getTime();
  const yesterday = today - 86_400_000;
  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function formatRelativeWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr${diffHr === 1 ? "" : "s"} ago`;

  const day = startOfDay(d).getTime();
  const today = startOfDay(new Date()).getTime();
  if (day === today - 86_400_000) return "Yesterday";

  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function notificationVisual(message: string): NotificationVisual {
  const m = message.toLowerCase();
  if (/customer|owner|vehicle|car|plate/.test(m)) {
    return {
      icon: "person-outline",
      iconBg: colors.successMuted,
      iconColor: colors.successDark,
      accent: colors.success,
      label: "Customer",
    };
  }
  if (/job|service|repair|work|card/.test(m)) {
    return {
      icon: "construct-outline",
      iconBg: colors.primaryMutedBg,
      iconColor: colors.primary,
      accent: colors.primary,
      label: "Job",
    };
  }
  if (/team|member|staff/.test(m)) {
    return {
      icon: "people-outline",
      iconBg: colors.pillPurple,
      iconColor: colors.purple,
      accent: colors.purple,
      label: "Team",
    };
  }
  if (/payment|wallet|invoice|bill|subscription/.test(m)) {
    return {
      icon: "wallet-outline",
      iconBg: colors.warningMuted,
      iconColor: colors.orangeAccent,
      accent: colors.orangeAccent,
      label: "Billing",
    };
  }
  return {
    icon: "notifications-outline",
    iconBg: colors.iconBlueTint,
    iconColor: colors.primaryDark,
    accent: colors.primary,
    label: "Update",
  };
}

function buildListEntries(items: ShopOwnerNotification[]): ListEntry[] {
  const entries: ListEntry[] = [];
  let lastSection = "";

  for (const item of items) {
    const d = new Date(item.time);
    const section = Number.isNaN(d.getTime()) ? "Updates" : sectionTitleForDate(d);
    if (section !== lastSection) {
      entries.push({ kind: "header", key: `header-${section}`, title: section });
      lastSection = section;
    }
    const recent = !Number.isNaN(d.getTime()) && Date.now() - d.getTime() < 86_400_000;
    entries.push({ kind: "item", key: item.id, item, recent });
  }

  return entries;
}

function SkeletonLine({ w }: { w: number | `${number}%` }) {
  return <View style={[styles.skeletonLine, { width: w }]} />;
}

function NotificationSkeletonList() {
  return (
    <View style={styles.skeletonList} pointerEvents="none">
      {Array.from({ length: 5 }).map((_, i) => (
        <SurfaceCard
          key={i}
          shadow="card"
          style={StyleSheet.flatten([styles.skeletonCard, styles.rowWrap])}
        >
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonBody}>
              <SkeletonLine w="34%" />
              <SkeletonLine w="92%" />
              <SkeletonLine w="72%" />
              <SkeletonLine w="40%" />
            </View>
          </View>
        </SurfaceCard>
      ))}
    </View>
  );
}

function NotificationHero({ total }: { total: number | null }) {
  const countLabel =
    typeof total === "number"
      ? `${total} alert${total === 1 ? "" : "s"}`
      : "Shop updates";

  return (
    <LinearGradient
      colors={[...gradients.profileHero] as readonly [ColorValue, ColorValue, ...ColorValue[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroCard}
    >
      <View style={styles.heroTop}>
        <View style={styles.heroIconWrap}>
          <Ionicons name="notifications" size={24} color={colors.primary} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Stay in the loop</Text>
          <Text style={styles.heroSub}>Customer, job, and shop activity in one place.</Text>
        </View>
      </View>
      <Pill variant="white" style={styles.heroPill}>
        <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
        <Text style={styles.heroPillText}>{countLabel}</Text>
      </Pill>
    </LinearGradient>
  );
}

function NotificationRow({
  item,
  recent,
  onDismiss,
}: {
  item: ShopOwnerNotification;
  recent: boolean;
  onDismiss: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const visual = notificationVisual(item.message);
  const when = formatRelativeWhen(item.time);
  const summary = useMemo(() => parseShopOwnerNotificationMessage(item.message), [item.message]);

  return (
    <View style={styles.rowWrap}>
      <SurfaceCard
        shadow="card"
        style={StyleSheet.flatten([
          styles.rowCard,
          recent ? styles.rowCardRecent : null,
          expanded ? styles.rowCardExpanded : null,
        ])}
      >
        <Pressable
          onPress={() => setExpanded((prev) => !prev)}
          android_ripple={{ color: colors.primaryMutedBg }}
          style={({ pressed }) => [styles.rowPressable, pressed && styles.rowPressed]}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={summary.collapsedText}
        >
          <View style={[styles.rowAccent, { backgroundColor: visual.accent }]} />
          <View style={styles.rowInner}>
            <View style={[styles.iconWrap, { backgroundColor: visual.iconBg }]}>
              <Ionicons name={visual.icon} size={18} color={visual.iconColor} />
            </View>
            <View style={styles.rowBody}>
              <View style={styles.rowTop}>
                <View style={[styles.typePill, { backgroundColor: visual.iconBg }]}>
                  <Text style={[styles.typeLabel, { color: visual.iconColor }]}>{visual.label}</Text>
                </View>
                <View style={styles.rowTopRight}>
                  {when ? <Text style={styles.whenInline}>{when}</Text> : null}
                  <Pressable
                    onPress={() => onDismiss(item.id)}
                    style={({ pressed }) => [styles.dismissBtn, pressed && styles.dismissBtnPressed]}
                    hitSlop={8}
                    accessibilityLabel="Remove notification"
                  >
                    <Ionicons name="close" size={15} color={colors.textMuted} />
                  </Pressable>
                </View>
              </View>

              <Text style={styles.serviceText} numberOfLines={expanded ? undefined : 2}>
                {summary.serviceText}
              </Text>

              {summary.phoneText ? (
                <View style={styles.phonePill}>
                  <Ionicons name="call-outline" size={14} color={colors.primary} />
                  <Text style={styles.phoneBy}>by</Text>
                  <Text style={styles.phoneText} numberOfLines={1}>
                    {summary.phoneText}
                  </Text>
                </View>
              ) : null}

              {expanded ? (
                <View style={styles.messageBox}>
                  <Text style={styles.messageBoxLabel}>Full details</Text>
                  <Text style={styles.message}>{item.message}</Text>
                </View>
              ) : null}

              <View style={[styles.expandChip, expanded && styles.expandChipActive]}>
                <Text style={[styles.expandHint, expanded && styles.expandHintActive]}>
                  {expanded ? "Collapse" : "View details"}
                </Text>
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={15}
                  color={expanded ? colors.primary : colors.textMuted}
                />
              </View>
            </View>
          </View>
          {recent ? <View style={[styles.recentBadge, { backgroundColor: visual.accent }]} /> : null}
        </Pressable>
      </SurfaceCard>
    </View>
  );
}

function NotificationEmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <LinearGradient
        colors={[colors.primaryMutedBg, colors.white] as readonly [ColorValue, ColorValue, ...ColorValue[]]}
        style={styles.emptyIconRing}
      >
        <Ionicons name="notifications-off-outline" size={42} color={colors.primary} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>All caught up</Text>
      <Text style={styles.emptySub}>
        When customers book services or your shop gets updates, they will show up here.
      </Text>
    </View>
  );
}

export function ShopOwnerNotificationList({ authToken, enabled }: Props) {
  const { markRead } = useShopOwnerNotifications();
  const { items, totalNotifications, loading, loadingMore, hasMore, loadMore, refresh } =
    usePaginatedShopOwnerNotifications(authToken, enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());

  const visibleItems = useMemo(
    () => items.filter((item) => !dismissedIds.has(item.id)),
    [dismissedIds, items]
  );
  const listEntries = useMemo(() => buildListEntries(visibleItems), [visibleItems]);

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const markLatestAsRead = useCallback(
    async (pageItems: ShopOwnerNotification[]) => {
      const latest = latestShopOwnerNotificationTime(pageItems);
      await markRead(latest ?? new Date().toISOString());
    },
    [markRead]
  );

  useFocusEffect(
    useCallback(() => {
      if (!enabled || !authToken) return;
      void (async () => {
        const pageItems = await refresh();
        await markLatestAsRead(pageItems);
      })();
    }, [authToken, enabled, markLatestAsRead, refresh])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const pageItems = await refresh();
      await markLatestAsRead(pageItems);
    } finally {
      setRefreshing(false);
    }
  }, [markLatestAsRead, refresh]);

  if (loading && items.length === 0) {
    return (
      <View style={styles.page}>
        {/* <NotificationHero total={null} /> */}
        <NotificationSkeletonList />
      </View>
    );
  }

  if (!loading && visibleItems.length === 0) {
    return (
      <View style={styles.page}>
        {/* <NotificationHero total={0} /> */}
        <NotificationEmptyState />
      </View>
    );
  }

  return (
    <FlatList
      data={listEntries}
      keyExtractor={(entry) => entry.key}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      ListHeaderComponent={
        <View style={styles.listHeader}>
          {/* <NotificationHero total={totalNotifications} /> */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            {typeof totalNotifications === "number" ? (
              <Text style={styles.sectionCount}>
                {totalNotifications} total
              </Text>
            ) : null}
          </View>
        </View>
      }
      renderItem={({ item: entry }) => {
        if (entry.kind === "header") {
          return (
            <View style={styles.groupHeaderWrap}>
              <Text style={styles.groupLabel}>{entry.title}</Text>
            </View>
          );
        }
        return (
          <NotificationRow item={entry.item} recent={entry.recent} onDismiss={handleDismiss} />
        );
      }}
      onEndReached={() => {
        if (hasMore && !loading && !loadingMore) loadMore();
      }}
      onEndReachedThreshold={0.35}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  listHeader: {
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  heroCard: {
    borderRadius: radii.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
    ...shadows.card,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: { flex: 1, gap: 4 },
  heroTitle: {
    fontSize: fontSizes.hero,
    fontWeight: "900",
    color: colors.text,
  },
  heroSub: {
    ...typography.bodyMuted,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  heroPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroPillText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { ...typography.section, fontSize: fontSizes.md },
  sectionCount: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textMuted,
  },
  groupHeaderWrap: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  groupLabel: {
    fontSize: cardFontSizes.xs,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  rowWrap: {
    marginBottom: spacing.md,
  },
  rowCard: {
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowCardRecent: {
    borderColor: "rgba(37,99,235,0.22)",
  },
  rowCardExpanded: {
    borderColor: "rgba(37,99,235,0.35)",
  },
  rowPressable: {
    position: "relative",
  },
  rowPressed: {
    backgroundColor: colors.bgAlt,
  },
  rowAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    paddingLeft: spacing.lg,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  rowBody: { flex: 1, gap: spacing.sm, minWidth: 0 },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  rowTopRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
  },
  typePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.round,
  },
  typeLabel: {
    fontSize: cardFontSizes.xs,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  whenInline: {
    fontSize: cardFontSizes.xs,
    fontWeight: "600",
    color: colors.textMuted,
  },
  dismissBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dismissBtnPressed: {
    opacity: 0.75,
    backgroundColor: colors.trackBg,
  },
  serviceText: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 21,
  },
  phonePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.round,
    backgroundColor: colors.primaryMutedBg,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.12)",
    maxWidth: "100%",
  },
  phoneBy: {
    fontSize: cardFontSizes.xs,
    fontWeight: "700",
    color: colors.textMuted,
  },
  phoneText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.primaryDark,
    flexShrink: 1,
  },
  messageBox: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageBoxLabel: {
    fontSize: cardFontSizes.xs,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  message: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 20,
  },
  expandChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.round,
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expandChipActive: {
    backgroundColor: colors.primaryMutedBg,
    borderColor: "rgba(37,99,235,0.18)",
  },
  expandHint: {
    fontSize: cardFontSizes.xs,
    fontWeight: "700",
    color: colors.textMuted,
  },
  expandHintActive: {
    color: colors.primary,
  },
  recentBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  skeletonList: { gap: spacing.md },
  skeletonCard: {
    borderRadius: radii.lg,
    padding: spacing.sm,
  },
  skeletonRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  skeletonIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.trackBg,
  },
  skeletonBody: {
    flex: 1,
    gap: spacing.sm,
  },
  skeletonLine: {
    height: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.trackBg,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.sm,
  },
  emptyIconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "900",
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptySub: {
    ...typography.bodyMuted,
    textAlign: "center",
    fontSize: fontSizes.sm,
    lineHeight: 21,
    maxWidth: 280,
  },
  footer: { paddingVertical: spacing.md, alignItems: "center" },
});
