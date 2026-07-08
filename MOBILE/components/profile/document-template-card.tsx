import { SurfaceCard } from "@/components/reusables";
import { colors, fontSizes, spacing, typography } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type DocumentTemplateCardProps = {
  title: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  rowIcon: ComponentProps<typeof Ionicons>["name"];
  rowLabel: string;
  rowValue: string;
  onPress?: () => void;
};

export function DocumentTemplateCard({
  title,
  icon,
  rowIcon,
  rowLabel,
  rowValue,
  onPress,
}: DocumentTemplateCardProps) {
  return (
    <SurfaceCard shadow="card">
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconBubble}>
            <Ionicons name={icon} size={18} color={colors.white} />
          </View>
          <Text style={typography.cardTitle}>{title}</Text>
        </View>
      </View>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
        <View style={styles.rowIconWrap}>
          <Ionicons name={rowIcon} size={22} color={colors.white} />
        </View>
        <View style={styles.rowMid}>
          <Text style={styles.rowLabel}>{rowLabel}</Text>
          <Text style={styles.rowValue} numberOfLines={2}>
            {rowValue}
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
  rowIconWrap: {
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
