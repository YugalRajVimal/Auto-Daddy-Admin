import { SurfaceCard } from "@/components/reusables";
import { colors, fontSizes, spacing, typography } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type CarCompaniesCardProps = {
  totalCount: number;
  selectedCount: number;
  onPress?: () => void;
};

export function CarCompaniesCard({ totalCount, selectedCount, onPress }: CarCompaniesCardProps) {
  return (
    <SurfaceCard shadow="card">
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconBubble}>
            <Ionicons name="car-sport" size={18} color={colors.white} />
          </View>
          <Text style={typography.cardTitle}>Car Brand Specialist</Text>
        </View>
      </View>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
        <View style={styles.rowIcon}>
          <Ionicons name="business-outline" size={22} color={colors.white} />
        </View>
        <View style={styles.rowMid}>
          <Text style={styles.rowLabel}>Selected</Text>
          <Text style={styles.rowValue}>{selectedCount}</Text>
          {/* <Text style={styles.rowCaption}>
            {totalCount} total {totalCount === 1 ? "company" : "companies"}
          </Text> */}
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
      </Pressable>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 2 },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  rowPressed: { opacity: 0.74 },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  rowMid: { flex: 1 },
  rowLabel: { fontSize: fontSizes.sm, color: colors.textMuted },
  rowValue: { fontSize: fontSizes.hero, fontWeight: "800", color: colors.text },
  rowCaption: { fontSize: fontSizes.xs, fontWeight: "600", color: colors.textLight, marginTop: 2 },
});
