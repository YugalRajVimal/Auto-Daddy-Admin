import { StackScreenFrame, SurfaceCard, useToast } from "@/components/reusables";
import { colors, fontSizes, radii, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useShopOwnerServices } from "@/hooks/use-shop-owner-services";
import { resolveShopOwnerBackTo } from "@/lib/shop-owner-navigation";
import { shopOwnerShopTypeLabel } from "@/lib/shop-owner-shop-types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function sortedIdsKey(ids: string[]) {
  return [...ids].sort().join("|");
}

export default function ServicesSelectionPage() {
  const params = useLocalSearchParams<{ backTo?: string | string[]; from?: string | string[] }>();
  const backToParam = Array.isArray(params.backTo) ? params.backTo[0] : params.backTo;
  const fromParam = Array.isArray(params.from) ? params.from[0] : params.from;
  const backTo = resolveShopOwnerBackTo(backToParam, fromParam);

  const { token, refreshSession } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const services = useShopOwnerServices({
    showErrorToast: (m) => showToast(m, { type: "error" }),
    showSuccessToast: (m) => showToast(m, { type: "success" }),
    onChanged: async () => {
      await refreshSession();
    },
  });

  const [refreshing, setRefreshing] = useState(false);
  const [draftIds, setDraftIds] = useState<string[]>([]);

  const serverIds = services.myServiceIds;
  const serverIdsKey = useMemo(() => sortedIdsKey(serverIds), [serverIds]);
  const draftIdsKey = useMemo(() => sortedIdsKey(draftIds), [draftIds]);
  const dirty = serverIdsKey !== draftIdsKey;

  // Keep the local draft in sync with the server selection whenever it changes
  // (initial load, manual refresh, post-save). Local edits override until the
  // server selection itself moves to a new value.
  useEffect(() => {
    setDraftIds(serverIds);
  }, [serverIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await services.refresh();
    } finally {
      setRefreshing(false);
    }
  }, [services]);

  const refreshServices = services.refresh;
  useFocusEffect(
    useCallback(() => {
      if (token) {
        void refreshServices();
      }
      return undefined;
    }, [refreshServices, token])
  );

  const totalCount = services.allServices.length;
  const selectedCount = draftIds.length;

  const toggleSelected = useCallback((id: string) => {
    if (!id) return;
    setDraftIds((prev) => {
      const set = new Set(prev);
      if (set.has(id)) {
        set.delete(id);
      } else {
        set.add(id);
      }
      return Array.from(set);
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!dirty || services.saving) {
      return;
    }
    await services.saveServiceWeWorkWith(draftIds);
  }, [dirty, draftIds, services]);

  const saveDisabled = !dirty || services.saving;

  return (
    <StackScreenFrame
      title="Operational Services"
      backgroundColor={colors.bgProfile}
      scroll={false}
      backTo={backTo}
      headerGradient={[colors.tabBarBg, colors.tabBarBg, colors.tabBarBg]}
    >
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 96 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <View style={styles.statsRow}>
            <SurfaceCard shadow="card" style={styles.statTile}>
              <View style={styles.statIconBlue}>
                <Ionicons name="build-outline" size={20} color={colors.white} />
              </View>
              <Text style={styles.statCount}>{totalCount}</Text>
              <Text style={styles.statCaption}>Total</Text>
            </SurfaceCard>

            <SurfaceCard shadow="card" style={styles.statTile}>
              <View style={styles.statIconGreen}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
              </View>
              <Text style={styles.statCount}>{selectedCount}</Text>
              <Text style={styles.statCaption}>Selected</Text>
            </SurfaceCard>
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Operational services</Text>
            {services.loading && totalCount === 0 ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          </View>

          {services.loading && totalCount === 0 ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : totalCount === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="build-outline" size={62} color={colors.textLight} />
              </View>
              <Text style={styles.emptyTitle}>No services listed</Text>
              <Text style={styles.emptySub}>Check back later or pull to refresh</Text>
            </View>
          ) : (
            <View style={styles.rows}>
              {services.allServices.map((c) => {
                const id = c.id?.trim() ?? "";
                const selected = id ? draftIds.includes(id) : false;
                const disabled = !id || services.saving;
                const typeLabel = c.shopType ? shopOwnerShopTypeLabel(c.shopType) : "";
                const subtitle = [typeLabel, c.desc?.trim()].filter(Boolean).join(" · ");
                return (
                  <Pressable
                    key={id || c.name}
                    onPress={() => toggleSelected(id)}
                    disabled={disabled}
                    style={({ pressed }) => [pressed && !disabled && styles.rowPressed]}
                  >
                    <SurfaceCard shadow="soft" style={styles.row}>
                      <View style={styles.rowLeft}>
                        <View style={styles.rowIcon}>
                          <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
                        </View>
                        <View style={styles.rowText}>
                          <Text style={styles.rowTitle} numberOfLines={2}>
                            {c.name}
                          </Text>
                          {subtitle ? (
                            <Text style={styles.rowSub} numberOfLines={2}>
                              {subtitle}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <Ionicons
                        name={selected ? "checkbox" : "square-outline"}
                        size={26}
                        color={selected ? colors.primary : colors.textMuted}
                      />
                    </SurfaceCard>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, spacing.md) },
          ]}
        >
          <Pressable
            onPress={() => void handleSave()}
            disabled={saveDisabled}
            style={({ pressed }) => [
              styles.saveBtn,
              saveDisabled && styles.saveBtnDisabled,
              pressed && !saveDisabled && styles.saveBtnPressed,
            ]}
          >
            {services.saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color={colors.white} />
                <Text style={styles.saveBtnText}>
                  {dirty ? `Save (${selectedCount})` : "Saved"}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </StackScreenFrame>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.screenHorizontal,
    gap: spacing.md,
  },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statTile: { flex: 1, alignItems: "center", paddingVertical: spacing.lg, borderRadius: radii.xl },
  statIconBlue: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  statIconGreen: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  statCount: { fontSize: fontSizes.display, fontWeight: "900", color: colors.text },
  statCaption: { fontSize: fontSizes.sm, fontWeight: "700", color: colors.textMuted, marginTop: 2 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm },
  sectionTitle: { ...typography.section },
  loadingWrap: { alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.lg },
  loadingText: { color: colors.textMuted, fontSize: fontSizes.md },
  emptyWrap: { alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.xxl * 2 },
  emptyIcon: { marginBottom: spacing.sm },
  emptyTitle: { fontSize: fontSizes.lg, fontWeight: "900", color: colors.textMuted, marginTop: spacing.sm },
  emptySub: { fontSize: fontSizes.sm, fontWeight: "700", color: colors.textLight },
  rows: { gap: spacing.sm, paddingBottom: spacing.xl },
  rowPressed: { opacity: 0.85 },
  row: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1, minWidth: 0 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryMutedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: fontSizes.md, fontWeight: "800", color: colors.text },
  rowSub: { fontSize: fontSizes.xs, fontWeight: "700", color: colors.textMuted, marginTop: 2 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.sm,
    backgroundColor: colors.bgProfile,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  saveBtn: {
    minHeight: 48,
    borderRadius: radii.round,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
  },
  saveBtnDisabled: {
    backgroundColor: colors.textLight,
    opacity: 0.6,
  },
  saveBtnPressed: {
    opacity: 0.85,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: "800",
  },
});
