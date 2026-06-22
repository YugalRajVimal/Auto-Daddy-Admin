import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, type ViewStyle } from "react-native";
import { colors, radii } from "@/constants/autodaddy";

type Tone = "primary" | "danger";
const toneBg: Record<Tone, string> = { primary: colors.iconBlueTint, danger: colors.dangerMuted };
const toneIcon: Record<Tone, string> = { primary: colors.primary, danger: colors.danger };
type Props = { name: keyof typeof Ionicons.glyphMap; tone?: Tone; onPress?: () => void; style?: ViewStyle };

export function SquareIconButton({ name, tone = "primary", onPress, style }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, { backgroundColor: toneBg[tone] }, pressed && styles.pressed, style]}>
      <Ionicons name={name} size={18} color={toneIcon[tone]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 40, height: 40, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.85 },
});
