import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";

type Props = { label: string; onPress?: () => void; style?: ViewStyle };

export function LogoutButton({ label, onPress, style }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, pressed && styles.pressed, style]}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { marginTop: spacing.sm, backgroundColor: colors.danger, borderRadius: radii.xl, paddingVertical: spacing.lg, alignItems: "center" },
  pressed: { opacity: 0.92 },
  text: { color: colors.white, fontWeight: "800", fontSize: fontSizes.lg, letterSpacing: 1 },
});
