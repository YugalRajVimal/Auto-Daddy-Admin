import { StackScreenFrame, SurfaceCard, useToast } from "@/components/reusables";
import { colors, fontSizes, radii, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useShopOwnerCarCompanies } from "@/hooks/use-shop-owner-car-companies";
import { resolveShopOwnerBackTo } from "@/lib/shop-owner-navigation";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

export default function CarCompaniesPage() {
  const params = useLocalSearchParams<{ backTo?: string | string[]; from?: string | string[] }>();
  const backToParam = Array.isArray(params.backTo) ? params.backTo[0] : params.backTo;
  const fromParam = Array.isArray(params.from) ? params.from[0] : params.from;
  const backTo = resolveShopOwnerBackTo(backToParam, fromParam);

  const { token, refreshSession } = useAuth();
  const { showToast } = useToast();

  const {
    allCompanies,
    myCompanyIds,
    myCompanyIdSet,
    loading,
    updatingId,
    refresh,
    toggle,
  } = useShopOwnerCarCompanies({
    showErrorToast: (m) => showToast(m, { type: "error" }),
    showSuccessToast: (m) => showToast(m, { type: "success" }),
    onChanged: async () => {
      await refreshSession();
    },
  });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void refresh();
      }
      return undefined;
    }, [token, refresh])
  );

  const totalCount = allCompanies.length;
  const selectedCount = myCompanyIds.length;

  return (
    <StackScreenFrame
      title="Car Companies"
      backgroundColor={colors.bgProfile}
      scroll={false}
      backTo={backTo}
      headerGradient={[colors.tabBarBg, colors.tabBarBg, colors.tabBarBg]}
    >
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
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
                <Ionicons name="car-outline" size={20} color={colors.white} />
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
            <Text style={styles.sectionTitle}>All companies</Text>
            {loading && totalCount === 0 ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : null}
          </View>

          {loading && totalCount === 0 ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : totalCount === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="car-outline" size={62} color={colors.textLight} />
              </View>
              <Text style={styles.emptyTitle}>No companies listed</Text>
              <Text style={styles.emptySub}>Check back later or pull to refresh</Text>
            </View>
          ) : (
            <View style={styles.rows}>
              {allCompanies.map((c) => {
                const selected = myCompanyIdSet.has(c._id);
                const disabled = updatingId === c._id;
                return (
                  <SurfaceCard key={c._id} shadow="soft" style={styles.companyRow}>
                    <View style={styles.companyRowLeft}>
                      <View style={styles.companyRowIcon}>
                        <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
                      </View>
                      <Text style={styles.companyName} numberOfLines={2}>
                        {c.companyName}
                      </Text>
                    </View>
                    <Switch
                      value={selected}
                      disabled={disabled}
                      onValueChange={(next) => void toggle(c._id, next)}
                      trackColor={{ false: colors.border, true: colors.primaryMutedBg }}
                      thumbColor={selected ? colors.primary : colors.textMuted}
                      ios_backgroundColor={colors.border}
                    />
                  </SurfaceCard>
                );
              })}
            </View>
          )}
        </ScrollView>
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
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statTile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
  },
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
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  loadingText: { color: colors.textMuted, fontSize: fontSizes.md },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: { marginBottom: spacing.sm },
  emptyTitle: { fontSize: fontSizes.lg, fontWeight: "900", color: colors.textMuted, marginTop: spacing.sm },
  emptySub: { fontSize: fontSizes.sm, fontWeight: "700", color: colors.textLight },
  rows: { gap: spacing.sm, paddingBottom: spacing.xl },
  companyRow: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  companyRowLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1, minWidth: 0 },
  companyRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryMutedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  companyName: { fontSize: fontSizes.md, fontWeight: "800", color: colors.text, flex: 1 },
});
