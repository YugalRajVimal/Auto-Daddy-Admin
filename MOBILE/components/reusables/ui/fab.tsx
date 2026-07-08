import { colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import { useOncePress } from "@/hooks/use-once-press";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";

type Props = { label: string; onPress?: () => void; icon?: keyof typeof Ionicons.glyphMap; style?: ViewStyle };

export function Fab({ label, onPress, icon = "add", style }: Props) {
  const guardedPress = useOncePress(onPress ? () => void onPress() : undefined);
  return (
    <Pressable
      onPress={guardedPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.fab, shadows.card, pressed && styles.pressed, style]}
    >
      <Ionicons name={icon} size={22} color={colors.white} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md + 2, borderRadius: radii.round },
  pressed: { opacity: 0.92 },
  label: { color: colors.white, fontSize: fontSizes.lg, fontWeight: "800" },
});
