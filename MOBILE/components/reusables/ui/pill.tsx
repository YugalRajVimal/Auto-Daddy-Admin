import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { colors, radii, spacing } from "@/constants/autodaddy";

type Variant = "purple" | "primaryMuted" | "white" | "successOutline";
const variantBg: Record<Variant, string> = { purple: colors.pillPurple, primaryMuted: colors.primaryMutedBg, white: colors.white, successOutline: colors.successMuted };
type Props = { children: ReactNode; variant?: Variant; style?: ViewStyle };

export function Pill({ children, variant = "purple", style }: Props) {
  return <View style={[styles.wrap, { backgroundColor: variantBg[variant] }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm - 2, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.round },
});
