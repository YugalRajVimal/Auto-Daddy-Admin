import { AppBar, Pill } from "@/components/reusables";
import { colors, fontSizes, gradients, radii, shadows, spacing } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Switch, Text, View } from "react-native";

type Props = {
  onMenuPress?: () => void;
  showAppBar?: boolean;
  showProfileCard?: boolean;
};

type GreetingCardProps = {
  businessName?: string;
  businessContactNo?: string;
  isBusinessActive?: boolean | null;
  businessLogoUri?: string | null;
  onBusinessActiveChange?: (next: boolean) => Promise<boolean> | boolean;
  updatingBusinessActive?: boolean;
  onNotificationsPress?: () => void;
  showNotificationUnreadDot?: boolean;
};

export function HomeAppBar({
  onMenuPress,
  subscriptionDaysLeftCount = 13,
}: Pick<Props, "onMenuPress"> & { subscriptionDaysLeftCount?: number }) {
  return (
    <AppBar
      title="AutoDaddy"
      onMenuPress={onMenuPress}
      right={
        <Pill variant="purple">
          <Ionicons name="time-outline" size={16} color={colors.purple} />
          <Text style={styles.daysText}>{subscriptionDaysLeftCount} days left</Text>
        </Pill>
      }
    />
  );
}

export function GreetingCard({
  businessName = "ABCD 1234 Shop",
  businessContactNo = "9999991111",
  isBusinessActive = null,
  businessLogoUri,
  onBusinessActiveChange,
  updatingBusinessActive = false,
  onNotificationsPress,
  showNotificationUnreadDot = false,
}: GreetingCardProps) {
  const [shopOpen, setShopOpen] = useState(isBusinessActive ?? true);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const hasLogo = Boolean(businessLogoUri) && !logoLoadFailed;
  useEffect(() => {
    if (updatingBusinessActive) {
      return;
    }
    if (typeof isBusinessActive !== "boolean") {
      return;
    }
    setShopOpen(isBusinessActive);
  }, [isBusinessActive, updatingBusinessActive]);

  return (
    <LinearGradient
      colors={[...gradients.profileHero]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.profileCard, shadows.card]}
    >
      <View style={styles.profileTop}>
        <View style={styles.avatarRing}>
          {hasLogo ? (
            <Image
              source={{ uri: businessLogoUri ?? undefined }}
              style={styles.avatarImage}
              onError={() => setLogoLoadFailed(true)}
            />
          ) : (
            <Ionicons name="storefront-outline" size={24} color={colors.primary} />
          )}
        </View>
        <View style={styles.profileText}>
          <Text style={styles.shopName}>{businessName}</Text>
        </View>
        <Pressable
          style={styles.bellBtn}
          onPress={onNotificationsPress}
          disabled={!onNotificationsPress}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {showNotificationUnreadDot ? <View style={styles.unreadDot} /> : null}
        </Pressable>
      </View>
      <View style={[styles.statusRow, shopOpen ? styles.statusRowOpen : styles.statusRowClosed]}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, shopOpen ? styles.statusDotOpen : styles.statusDotClosed]} />
          <Text style={[styles.statusLabel, !shopOpen && styles.statusLabelClosed]}>
            {shopOpen ? "Shop is Open" : "Shop is Closed"}
          </Text>
        </View>
        <Switch
          value={shopOpen}
          disabled={updatingBusinessActive || typeof isBusinessActive !== "boolean"}
          onValueChange={async (next) => {
            const prev = shopOpen;
            setShopOpen(next);
            try {
              const okRaw = await onBusinessActiveChange?.(next);
              const ok = okRaw == null ? true : Boolean(okRaw);
              if (!ok) {
                setShopOpen(prev);
              }
            } catch {
              setShopOpen(prev);
            }
          }}
          trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
          thumbColor={shopOpen ? colors.success : colors.danger}
        />
      </View>
    </LinearGradient>
  );
}

export function Greeting({ onMenuPress, showAppBar = true, showProfileCard = true }: Props) {
  return (
    <>
      {showAppBar ? <HomeAppBar onMenuPress={onMenuPress} /> : null}
      {showProfileCard ? <GreetingCard /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  daysText: { fontSize: fontSizes.md, fontWeight: "800", color: colors.purple },
  profileCard: {
    borderRadius: radii.xxl,
    padding: spacing.xl + 2,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
  },
  profileTop: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  profileText: { flex: 1, marginLeft: spacing.sm },
  welcome: { fontSize: fontSizes.xl, color: colors.textMuted, fontWeight: "800" },
  shopName: { fontSize: fontSizes.hero, fontWeight: "900", color: colors.text, marginTop: 2 },
  shopSub: { fontSize: fontSizes.base, color: colors.textMuted, marginTop: 2, fontWeight: "700" },
  bellBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.white,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
    borderWidth: 1,
  },
  statusRowOpen: {
    backgroundColor: "rgba(209,250,229,0.86)",
    borderColor: "rgba(16,185,129,0.2)",
  },
  statusRowClosed: {
    backgroundColor: "rgba(254,226,226,0.92)",
    borderColor: "rgba(239,68,68,0.25)",
  },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  statusDotOpen: { backgroundColor: colors.success },
  statusDotClosed: { backgroundColor: colors.danger },
  statusLabel: { fontSize: fontSizes.xl, fontWeight: "800", color: colors.text },
  statusLabelClosed: { color: colors.danger },
});
