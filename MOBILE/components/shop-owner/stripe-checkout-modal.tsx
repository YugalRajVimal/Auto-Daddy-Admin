import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import { openStripeCheckoutInBrowser } from "@/lib/stripe-payment";
import type { SubscriptionCheckoutSession } from "@/types/website-subscription";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type StripeCheckoutModalProps = {
  visible: boolean;
  session: SubscriptionCheckoutSession | null;
  onClose: () => void;
  onComplete: () => void;
  onError: (message: string) => void;
};

/** Prompts user to open Stripe hosted checkout in the system browser. */
export function StripeCheckoutModal({
  visible,
  session,
  onClose,
  onComplete,
  onError,
}: StripeCheckoutModalProps) {
  const insets = useSafeAreaInsets();
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!visible || !session?.checkoutUrl) return;
    let cancelled = false;

    void (async () => {
      setOpening(true);
      const result = await openStripeCheckoutInBrowser(session);
      if (cancelled) return;
      setOpening(false);
      if (result.opened) {
        onComplete();
        return;
      }
      onError(result.error ?? "Could not open Stripe checkout.");
    })();

    return () => {
      cancelled = true;
    };
  }, [onComplete, onError, session, visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="card-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>Secure Stripe Checkout</Text>
          <Text style={styles.body}>
            {opening
              ? "Opening secure payment page…"
              : session?.checkoutUrl
                ? "Complete payment in your browser, then return here and pull to refresh."
                : "No checkout URL was returned. Contact support if this persists."}
          </Text>
          {opening ? (
            <ActivityIndicator color={colors.primary} style={styles.spinner} />
          ) : (
            <View style={styles.actions}>
              {session?.checkoutUrl ? (
                <Pressable
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                  onPress={() => {
                    if (!session) return;
                    void openStripeCheckoutInBrowser(session).then((result) => {
                      if (result.opened) {
                        onComplete();
                        return;
                      }
                      onError(result.error ?? "Could not open Stripe checkout.");
                    });
                  }}
                >
                  <Text style={styles.primaryBtnText}>Open payment page</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                onPress={onClose}
              >
                <Text style={styles.secondaryBtnText}>Close</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radii.hero,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryMutedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  body: {
    fontSize: fontSizes.sm,
    fontWeight: "500",
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  spinner: {
    marginTop: spacing.sm,
  },
  actions: {
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.xxl,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: fontSizes.base,
    fontWeight: "800",
    color: colors.white,
  },
  secondaryBtn: {
    borderRadius: radii.xxl,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: {
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.textMuted,
  },
  pressed: { opacity: 0.9 },
});
