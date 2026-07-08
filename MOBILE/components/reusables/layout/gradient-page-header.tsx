import type { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, type ColorValue } from "react-native";
import { PageTopBar } from "./page-top-bar";
import { spacing } from "@/constants/autodaddy";

type Props = {
  gradient: readonly string[];
  title: string;
  left?: ReactNode;
  right?: ReactNode;
  paddingBottom?: number;
  titleColor?: string;
  titleAlign?: "left" | "center";
};

export function GradientPageHeader({
  gradient,
  title,
  left,
  right,
  paddingBottom = 10,
  titleColor,
  titleAlign,
}: Props) {
  return (
    <LinearGradient colors={gradient as readonly [ColorValue, ColorValue, ...ColorValue[]]} style={[styles.wrap, { paddingBottom }]}>
      <PageTopBar title={title} left={left} right={right} titleColor={titleColor} titleAlign={titleAlign} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({ wrap: { paddingHorizontal: spacing.screenHorizontal } });
