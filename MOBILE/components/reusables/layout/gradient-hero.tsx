import type { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, type ColorValue, type ViewStyle } from "react-native";
import { spacing } from "@/constants/autodaddy";

type Props = { gradient: readonly string[]; children: ReactNode; paddingBottom?: number; style?: ViewStyle };

export function GradientHero({ gradient, children, paddingBottom = 28, style }: Props) {
  return (
    <LinearGradient colors={gradient as readonly [ColorValue, ColorValue, ...ColorValue[]]} style={[styles.wrap, { paddingBottom }, style]}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({ wrap: { paddingHorizontal: spacing.screenHorizontal } });
