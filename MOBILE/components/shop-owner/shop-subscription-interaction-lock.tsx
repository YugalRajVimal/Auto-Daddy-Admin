import { useShopSubscriptionGateOptional } from "@/context/shop-subscription-gate-context";
import { isShopPathAllowedWithoutSubscription } from "@/lib/shop-subscription-access";
import { usePathname } from "expo-router";
import { type ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  /** When true, intercept presses on children and prompt to subscribe. */
  active?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Soft-lock wrapper: content stays visible/scrollable, but a capture layer blocks
 * interaction when the current route is not allowed without a subscription.
 */
export function ShopSubscriptionInteractionLock({ active, children, style }: Props) {
  const gate = useShopSubscriptionGateOptional();
  const pathname = usePathname();
  const locked =
    (active ?? gate?.subscriptionLocked ?? false) &&
    !isShopPathAllowedWithoutSubscription(pathname);

  if (!locked) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={[styles.root, style]}>
      <View style={styles.content} pointerEvents="box-none">
        {children}
      </View>
      <Pressable
        style={styles.blocker}
        onPress={() => gate?.promptSubscribe()}
        accessibilityRole="button"
        accessibilityLabel="Subscription required"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  blocker: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
});
