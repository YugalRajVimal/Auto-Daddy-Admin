import { QuickActionTile, SectionHeader, SurfaceCard } from "@/components/reusables";
import { colors, radii, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

export function QuickActions() {
  const { meta } = useAuth();
  const role = (meta?.role ?? "").toLowerCase();
  const base = role === "carowner" || role === "car-owner" || role === "car_owner" ? "/(car-owner)" : "/(shop-owner)";

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
              onPress={() => router.push(`${base}/job-cards?qa=1` as any)}
              iconBackground={colors.iconBlueTint}
              iconColor={colors.primary}
            />
          </View>
          <View style={styles.cell}>
            <QuickActionTile
              width="100%"
              icon="people"
              label="My Customers"
              onPress={() => router.push(`${base}/customers?qa=1` as any)}
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
              onPress={() => router.push(`${base}/wallet?qa=1` as any)}
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
                router.push({
                  pathname: `${base}/services`,
                  params: { qa: "1", backTo: `${base}/(tabs)/home` },
                } as any)
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
