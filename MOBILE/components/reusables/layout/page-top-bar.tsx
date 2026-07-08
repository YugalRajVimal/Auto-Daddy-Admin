import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { typography } from "@/constants/autodaddy";

const SIDE = 40;
type Props = {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
  titleColor?: string;
  titleAlign?: "left" | "center";
};

export function PageTopBar({ title, left, right, titleColor, titleAlign = "left" }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.side}>{left ?? <View style={styles.spacer} />}</View>
      <Text
        style={[styles.title, titleColor ? { color: titleColor } : null, titleAlign === "center" ? styles.titleCenter : null]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={[styles.side, styles.sideRight]}>{right ?? <View style={styles.spacer} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  side: { width: SIDE, alignItems: "flex-start", justifyContent: "center" },
  sideRight: { alignItems: "flex-end" },
  spacer: { width: SIDE, height: 1 },
  title: { ...typography.navTitle, flex: 1, textAlign: "left" },
  titleCenter: { textAlign: "center" },
});
