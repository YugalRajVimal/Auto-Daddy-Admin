import { colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import { useOncePress } from "@/hooks/use-once-press";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

type Props = {
  width: number | `${number}%`;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iconBackground: string;
  iconColor: string;
  borderColor?: string;
  pressedBackgroundColor?: string;
  onPress?: () => void;
};

export function QuickActionTile({
  width,
  icon,
  label,
  iconBackground,
  iconColor,
  borderColor = "#EEF2FF",
  pressedBackgroundColor = "#F8FAFF",
  onPress,
}: Props) {
  const guardedPress = useOncePress(onPress ? () => void onPress() : undefined);
  const { width: windowWidth } = useWindowDimensions();
  const compact = windowWidth < 360;
  return (
    <Pressable
      onPress={guardedPress}
      disabled={!onPress}
      style={({ pressed, hovered }) => [
        styles.card,
        { width, borderColor },
        shadows.soft,
        (pressed || hovered) && { backgroundColor: pressedBackgroundColor, transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={[styles.icon, compact && styles.iconCompact, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={compact ? 22 : 24} color={iconColor} />
      </View>
      <Text
        style={[styles.label, compact && styles.labelCompact]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    borderWidth: 1,
  },
  icon: { width: 60, height: 60, borderRadius: radii.xl, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  iconCompact: { width: 54, height: 54, marginBottom: spacing.sm },
  label: { fontSize: fontSizes.base, fontWeight: "800", color: colors.text, textAlign: "center" },
  labelCompact: { fontSize: fontSizes.sm },
});
