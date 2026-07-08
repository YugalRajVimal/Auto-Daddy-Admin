import { colors, fontSizes, spacing } from "@/constants/autodaddy";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";

export function AppSplash() {
  return (
    <View style={styles.root}>
      <Image
        source={require("@/assets/images/logo-rectangle.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={colors.successDark} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.successMuted,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  logo: {
    width: "82%",
    maxWidth: 360,
    height: 120,
    marginBottom: spacing.xxl,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSizes.lg,
    fontWeight: "600",
    color: colors.textMuted,
  },
});
