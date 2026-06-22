import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { cardFontSizes, colors, radii, spacing } from "@/constants/autodaddy";

type Props = { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; iconBackground: string; iconColor: string; rowBackground: string };

export function OverviewStatRow({ icon, label, value, iconBackground, iconColor, rowBackground }: Props) {
  return (
    <View style={[styles.row, { backgroundColor: rowBackground }]}>
      <View style={[styles.icon, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.sm, gap: spacing.sm + 2 },
  icon: { width: 42, height: 42, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  label: { flex: 1, fontSize: cardFontSizes.lg, fontWeight: "700", color: colors.text },
  value: { fontSize: cardFontSizes.lg, fontWeight: "800", color: colors.text },
});
