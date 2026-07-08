import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import { useNetworkConnectivity } from "@/hooks/use-network-connectivity";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";

type Props = {
  style?: ViewStyle;
};

export function NetworkStatusStrip({ style }: Props) {
  const { isOffline } = useNetworkConnectivity();

  if (!isOffline) {
    return null;
  }

  return (
    <View style={[styles.strip, style]} accessibilityRole="text" accessibilityLiveRegion="polite">
      <Ionicons name="cloud-offline-outline" size={13} color={colors.danger} />
      <Text style={styles.label} numberOfLines={1}>
        No internet connection
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.md,
    backgroundColor: colors.dangerMuted,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.22)",
  },
  label: {
    flex: 1,
    fontSize: fontSizes.xs,
    fontWeight: "600",
    color: colors.danger,
  },
});
