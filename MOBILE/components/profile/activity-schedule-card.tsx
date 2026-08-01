import { SurfaceCard } from "@/components/reusables";
import { colors, fontSizes, radii, spacing, typography } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

type ActivityScheduleCardProps = {
  isBusinessActive?: boolean | null;
  updatingBusinessActive?: boolean;
  onBusinessActiveChange?: (next: boolean) => Promise<boolean> | boolean;
  scheduleDisplay: string;
  onManagePress?: () => void;
};

export function ActivityScheduleCard({
  isBusinessActive = null,
  updatingBusinessActive = false,
  onBusinessActiveChange,
  scheduleDisplay,
  onManagePress,
}: ActivityScheduleCardProps) {
  const [shopOpen, setShopOpen] = useState(isBusinessActive ?? true);

  useEffect(() => {
    if (updatingBusinessActive) return;
    if (typeof isBusinessActive !== "boolean") return;
    setShopOpen(isBusinessActive);
  }, [isBusinessActive, updatingBusinessActive]);

  return (
    <SurfaceCard shadow="card">
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconBubble}>
            <Ionicons name="calendar" size={18} color={colors.white} />
          </View>
          <Text style={typography.cardTitle}>Shop is Open</Text>
        </View>
      </View>

      <View
        style={[styles.statusRow, shopOpen ? styles.statusRowOpen : styles.statusRowClosed]}
      >
        <View style={styles.statusLeft}>
          <View
            style={[styles.statusDot, shopOpen ? styles.statusDotOpen : styles.statusDotClosed]}
          />
          <Text style={[styles.statusLabel, !shopOpen && styles.statusLabelClosed]}>
            {shopOpen ? "Shop is Open Today" : "Shop is Closed Today"}
          </Text>
        </View>
        <Switch
          value={shopOpen}
          disabled={updatingBusinessActive || typeof isBusinessActive !== "boolean"}
          onValueChange={async (next) => {
            const prev = shopOpen;
            setShopOpen(next);
            try {
              const okRaw = await onBusinessActiveChange?.(next);
              const ok = okRaw == null ? true : Boolean(okRaw);
              if (!ok) setShopOpen(prev);
            } catch {
              setShopOpen(prev);
            }
          }}
          trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
          thumbColor={shopOpen ? colors.success : colors.danger}
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={onManagePress}
      >
        <View style={styles.rowIcon}>
          <Ionicons name="time-outline" size={22} color={colors.white} />
        </View>
        <View style={styles.rowMid}>
          <Text style={styles.rowLabel}>Open Hours</Text>
          <Text style={styles.rowValue} numberOfLines={2}>
            {scheduleDisplay}
          </Text>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
    borderWidth: 1,
  },
  statusRowOpen: {
    backgroundColor: "rgba(209,250,229,0.86)",
    borderColor: "rgba(16,185,129,0.2)",
  },
  statusRowClosed: {
    backgroundColor: "rgba(254,226,226,0.92)",
    borderColor: "rgba(239,68,68,0.25)",
  },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, paddingRight: 8 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  statusDotOpen: { backgroundColor: colors.success },
  statusDotClosed: { backgroundColor: colors.danger },
  statusLabel: { fontSize: fontSizes.md, fontWeight: "800", color: colors.text, flexShrink: 1 },
  statusLabelClosed: { color: colors.danger },
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
  rowValue: { fontSize: fontSizes.lg, fontWeight: "800", color: colors.text },
});
