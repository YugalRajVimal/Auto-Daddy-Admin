import { QuickActionTile, SectionHeader } from "@/components/reusables";
import { associateColors } from "@/constants/associate-theme";
import { colors, spacing } from "@/constants/autodaddy";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

const BASE = "/(associate)";

const tileTheme = {
  borderColor: associateColors.quickActionBorder,
  pressedBackgroundColor: associateColors.quickActionPressedBg,
};

export function AssociateQuickActions() {
  return (
    <View style={styles.section}>
      <SectionHeader title="Quick Actions" accentColor={associateColors.primary} />
      <View style={styles.grid}>
        <View style={styles.row}>
          <View style={[styles.cell, styles.cellLeft]}>
            <QuickActionTile
              width="100%"
              icon="people-outline"
              label="My Leads"
              onPress={() => router.push(`${BASE}/leads` as never)}
              iconBackground={associateColors.primaryMuted}
              iconColor={associateColors.primary}
              {...tileTheme}
            />
          </View>
          <View style={styles.cell}>
            <QuickActionTile
              width="100%"
              icon="map-outline"
              label="My Visits"
              onPress={() => router.push(`${BASE}/visits` as never)}
              iconBackground={colors.pillPurple}
              iconColor={colors.purple}
              {...tileTheme}
            />
          </View>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <View style={[styles.cell, styles.cellLeft]}>
            <QuickActionTile
              width="100%"
              icon="wallet"
              label="Wallet"
              onPress={() => router.push(`${BASE}/wallet` as never)}
              iconBackground={colors.warningMuted}
              iconColor={colors.warning}
              {...tileTheme}
            />
          </View>
          <View style={styles.cell}>
            <QuickActionTile
              width="100%"
              icon="person"
              label="My Customers"
              onPress={() => router.push(`${BASE}/customers` as never)}
              iconBackground={colors.successMuted}
              iconColor={colors.success}
              {...tileTheme}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xxl },
  grid: { flexDirection: "column" },
  row: { flexDirection: "row", marginBottom: spacing.lg },
  rowLast: { marginBottom: 0 },
  cell: { flex: 1, minWidth: 0 },
  cellLeft: { marginRight: spacing.lg },
});
