import { colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  open: boolean;
  onSubscribe: () => void;
  onLater: () => void;
};

export function ShopSubscriptionRequiredDialog({ open, onSubscribe, onLater }: Props) {
  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onLater}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onLater} />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Subscription required</Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.message}>
              Purchase an active subscription to use this feature. You can still update your profile
              and buy a plan from Website.
            </Text>
          </View>
          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              onPress={onLater}
            >
              <Text style={styles.secondaryLabel}>Not now</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              onPress={onSubscribe}
            >
              <Text style={styles.primaryLabel}>View plans</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  panel: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.purple,
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  message: {
    fontSize: fontSizes.sm,
    lineHeight: 22,
    color: colors.textMuted,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  secondaryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  secondaryLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textMuted,
  },
  primaryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  primaryLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.white,
  },
  pressed: { opacity: 0.85 },
});
