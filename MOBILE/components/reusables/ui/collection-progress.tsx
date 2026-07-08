import { cardFontSizes, colors, gradients, radii, spacing } from "@/constants/autodaddy";
import { LinearGradient } from "expo-linear-gradient";
import { type DimensionValue, StyleSheet, Text, View } from "react-native";

type Props = { label: string; percent: number };

export function ProgressBar({ label, percent }: Props) {
  const widthPct = `${Math.min(100, Math.max(0, percent))}%`;
  return (
    <View>
      <Text style={styles.rateLabel}>{label}</Text>
      <View style={styles.rateRow}>
        <Text style={styles.rateValue}>{percent}%</Text>
      </View>
      <View style={styles.track}>
        <LinearGradient colors={[...gradients.progress]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: widthPct as DimensionValue }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rateLabel: { fontSize: cardFontSizes.xs, fontWeight: "bold", color: colors.textMuted, marginTop: spacing.sm, marginBottom: -10 },
  rateRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 6 },
  rateValue: { fontSize: cardFontSizes.lg, fontWeight: "800", color: colors.text },
  track: { height: 10, borderRadius: radii.round, backgroundColor: colors.trackBg, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radii.round },
});
