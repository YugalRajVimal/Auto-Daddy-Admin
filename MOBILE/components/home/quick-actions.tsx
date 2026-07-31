import { QuickActionTile, SectionHeader, SurfaceCard } from "@/components/reusables";
import { colors, radii, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useShopSubscriptionGateOptional } from "@/context/shop-subscription-gate-context";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

export function QuickActions() {
  const { meta } = useAuth();
  const gate = useShopSubscriptionGateOptional();
  const role = (meta?.role ?? "").toLowerCase();
  const isCarOwner = role === "carowner" || role === "car-owner" || role === "car_owner";
  const base = isCarOwner ? "/(car-owner)" : "/(shop-owner)";

  const go = (run: () => void) => {
    if (!isCarOwner && gate && !gate.requireSubscription()) return;
    run();
  };

  return (
    <SurfaceCard shadow="card" style={styles.card}>
      <SectionHeader title="Quick Actions" />
      <View style={styles.grid}>
        <View style={styles.row}>
          <View style={[styles.cell, styles.cellLeft]}>
            <QuickActionTile
              width="100%"
              icon="document-text"
              label="Job Card"
              onPress={() => go(() => router.push(`${base}/job-cards?qa=1` as any))}
              iconBackground={colors.iconBlueTint}
              iconColor={colors.primary}
            />
          </View>
          <View style={styles.cell}>
            <QuickActionTile
              width="100%"
              icon="people"
              label="My Customers"
              onPress={() => go(() => router.push(`${base}/customers?qa=1` as any))}
              iconBackground={colors.successMuted}
              iconColor={colors.success}
            />
          </View>
        </View>

        <View style={[styles.row, styles.rowLast]}>
          <View style={[styles.cell, styles.cellLeft]}>
            <QuickActionTile
              width="100%"
              icon="wallet"
              label="Wallet"
              onPress={() => go(() => router.push(`${base}/wallet?qa=1` as any))}
              iconBackground={colors.warningMuted}
              iconColor={colors.warning}
            />
          </View>
          <View style={styles.cell}>
            <QuickActionTile
              width="100%"
              icon="flash"
              label="My Services"
              onPress={() =>
                go(() =>
                  router.push({
                    pathname: `${base}/services`,
                    params: { qa: "1", backTo: `${base}/(tabs)/home` },
                  } as any)
                )
              }
              iconBackground={colors.pillPurple}
              iconColor={colors.purple}
            />
          </View>
        </View>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xxxl,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: "#EEF2FF",
  },
  grid: {
    flexDirection: "column",
  },
  row: {
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  rowLast: {
    marginBottom: 0,
  },
  cell: {
    flex: 1,
    minWidth: 0,
  },
  cellLeft: {
    marginRight: spacing.lg,
  },
});
