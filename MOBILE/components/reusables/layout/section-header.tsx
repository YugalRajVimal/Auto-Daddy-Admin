import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/constants/autodaddy";

type Props = { title: string; right?: ReactNode; accentColor?: string };

export function SectionHeader({ title, right, accentColor = colors.primary }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={[styles.accent, { backgroundColor: accentColor }]} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  left: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  accent: { width: 3, height: 16, borderRadius: 2 },
  title: { ...typography.section },
});
