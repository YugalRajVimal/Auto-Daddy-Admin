import { LogoutButton } from "@/components/reusables";
import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ProfileFooterProps = {
  onLogout: () => void;
  showDevTokenButton: boolean;
  onPrintAuthToken: () => void;
};

export function ProfileFooter({ onLogout, showDevTokenButton, onPrintAuthToken }: ProfileFooterProps) {
  return (
    <View>
      <LogoutButton label="LOG OUT" onPress={onLogout} />
      {showDevTokenButton ? (
        <Pressable style={({ pressed }) => [styles.devTokenBtn, pressed && styles.devTokenBtnPressed]} onPress={onPrintAuthToken}>
          <Ionicons name="key-outline" size={16} color={colors.primaryDark} />
          <Text style={styles.devTokenBtnText}>Print Auth Token (Dev)</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  devTokenBtn: {
    marginTop: spacing.sm,
    height: 44,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  devTokenBtnPressed: { opacity: 0.8 },
  devTokenBtnText: {
    color: colors.primaryDark,
    fontSize: fontSizes.sm,
    fontWeight: "700",
  },
});
