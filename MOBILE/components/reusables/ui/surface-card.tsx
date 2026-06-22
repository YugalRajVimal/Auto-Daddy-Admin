import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { colors, radii, shadows } from "@/constants/autodaddy";

type Shadow = "card" | "soft" | "none";
type Props = { children: ReactNode; style?: ViewStyle; shadow?: Shadow };

export function SurfaceCard({ children, style, shadow = "card" }: Props) {
  const shadowStyle = shadow === "card" ? shadows.card : shadow === "soft" ? shadows.soft : null;
  return <View style={[styles.base, shadowStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
});
