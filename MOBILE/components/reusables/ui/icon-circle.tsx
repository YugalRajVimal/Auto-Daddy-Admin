import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { colors } from "@/constants/autodaddy";

type Props = { children: ReactNode; size?: number; backgroundColor?: string; style?: ViewStyle };

export function IconCircle({ children, size = 80, backgroundColor = colors.primaryMutedBg, style }: Props) {
  const r = size / 2;
  return <View style={[styles.circle, { width: size, height: size, borderRadius: r, backgroundColor }, style]}>{children}</View>;
}

const styles = StyleSheet.create({ circle: { alignItems: "center", justifyContent: "center" } });
