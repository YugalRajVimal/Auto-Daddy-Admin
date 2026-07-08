import { SurfaceCard } from "@/components/reusables";
import { cardFontSizes, colors, fontSizes, radii, shadows, spacing, typography } from "@/constants/autodaddy";
import { useCarOwnerNotifications } from "@/context/car-owner-notifications-provider";
import { usePaginatedCarOwnerNotifications } from "@/hooks/use-paginated-car-owner-notifications";
import { latestCarOwnerNotificationTime } from "@/lib/car-owner-notification-read-state";
import type { CarOwnerNotification } from "@/types/car-owner-notifications";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
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
  | { kind: "item"; key: string; item: CarOwnerNotification; recent: boolean };

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
  if (/deal|offer|discount|promo/.test(m)) {
    return {
      icon: "pricetag-outline",
      iconBg: colors.warningMuted,
      iconColor: colors.orangeAccent,
      accent: colors.orangeAccent,
      label: "Deal",
    };
  }
  if (/shop|garage|service center|auto shop/.test(m)) {
    return {
      icon: "storefront-outline",
      iconBg: colors.successMuted,
      iconColor: colors.successDark,
      accent: colors.success,
      label: "Shop",
    };
  }
  if (/job|service|repair|work|card|appointment|schedule/.test(m)) {
    return {
      icon: "construct-outline",
      iconBg: colors.primaryMutedBg,
      iconColor: colors.primary,
      accent: colors.primary,
      label: "Service",
    };
  }
  if (/vehicle|car|plate|odometer/.test(m)) {
    return {
      icon: "car-outline",
      iconBg: colors.iconBlueTint,
      iconColor: colors.primaryDark,
      accent: colors.primaryDark,
      label: "Vehicle",
    };
  }
  return {
    icon: "notifications-outline",
    iconBg: colors.successMuted,
    iconColor: colors.successDark,
    accent: colors.success,
    label: "Update",
  };
}

function buildListEntries(items: CarOwnerNotification[]): ListEntry[] {
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
        <SurfaceCard key={i} shadow="soft" style={styles.skeletonCard}>
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

function NotificationRow({ item, recent }: { item: CarOwnerNotification; recent: boolean }) {
  const visual = notificationVisual(item.message);
  const when = formatRelativeWhen(item.time);

  return (
    <SurfaceCard shadow="soft" style={styles.rowCard}>
      <View style={[styles.rowAccent, { backgroundColor: visual.accent }]} />
      <View style={styles.rowInner}>
        <View style={[styles.iconWrap, { backgroundColor: visual.iconBg }]}>
          <Ionicons name={visual.icon} size={20} color={visual.iconColor} />
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowMeta}>
            <View style={[styles.typePill, { backgroundColor: visual.iconBg }]}>
              <Text style={[styles.typePillText, { color: visual.iconColor }]}>{visual.label}</Text>
            </View>
            {recent ? (
              <View style={styles.recentDotWrap}>
                <View style={styles.recentDot} />
                <Text style={styles.recentLabel}>Recent</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.message}>{item.message}</Text>
          {when ? (
            <View style={styles.whenRow}>
              <Ionicons name="time-outline" size={13} color={colors.textLight} />
              <Text style={styles.when}>{when}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </SurfaceCard>
  );
}

function NotificationEmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconRing}>
        <Ionicons name="notifications-off-outline" size={42} color={colors.successDark} />
      </View>
      <Text style={styles.emptyTitle}>All caught up</Text>
      <Text style={styles.emptySub}>
        When your shop sends job updates, deals, or service reminders, they will show up here.
      </Text>
    </View>
  );
}

export function CarOwnerNotificationList({ authToken, enabled }: Props) {
  const { markRead } = useCarOwnerNotifications();
  const { items, totalNotifications, loading, loadingMore, hasMore, loadMore, refresh } =
    usePaginatedCarOwnerNotifications(authToken, enabled);
  const [refreshing, setRefreshing] = useState(false);

  const listEntries = useMemo(() => buildListEntries(items), [items]);

  const markLatestAsRead = useCallback(
    async (pageItems: CarOwnerNotification[]) => {
      const latest = latestCarOwnerNotificationTime(pageItems);
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
        <NotificationSkeletonList />
      </View>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <View style={styles.page}>
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
          tintColor={colors.success}
          colors={[colors.success]}
        />
      }
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            {typeof totalNotifications === "number" ? (
              <Text style={styles.sectionCount}>{totalNotifications} total</Text>
            ) : null}
          </View>
        </View>
      }
      renderItem={({ item: entry }) => {
        if (entry.kind === "header") {
          return <Text style={styles.groupLabel}>{entry.title}</Text>;
        }
        return <NotificationRow item={entry.item} recent={entry.recent} />;
      }}
      onEndReached={() => {
        if (hasMore && !loading && !loadingMore) loadMore();
      }}
      onEndReachedThreshold={0.35}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={colors.success} />
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
    gap: spacing.sm,
  },
  listHeader: {
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { ...typography.section, fontSize: fontSizes.lg, color: colors.successDark },
  sectionCount: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textMuted,
  },
  groupLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: 2,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  rowCard: {
    borderRadius: radii.xl,
    overflow: "hidden",
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
    padding: spacing.md,
    paddingLeft: spacing.lg,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, gap: spacing.sm },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  typePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.round,
  },
  typePillText: {
    fontSize: cardFontSizes.xs,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  recentDotWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recentDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  recentLabel: {
    fontSize: cardFontSizes.xs,
    fontWeight: "700",
    color: colors.successDark,
  },
  message: {
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 22,
  },
  whenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  when: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
  },
  skeletonList: { gap: spacing.sm },
  skeletonCard: {
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  skeletonRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  skeletonIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    borderColor: "rgba(22,101,52,0.18)",
    backgroundColor: colors.successMuted,
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
