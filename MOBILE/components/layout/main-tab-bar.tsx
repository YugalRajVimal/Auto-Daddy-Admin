import { colors, fontSizes, shadows, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useOncePress } from "@/hooks/use-once-press";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter, useSegments } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Reserve space above the home indicator; matches former Tabs bar footprint */
export const MAIN_TAB_BAR_OFFSET = 78;

type TabKey = "home" | "deals" | "profile" | "website" | "invite-help";

function normalizePath(pathname: string) {
  return pathname.replace(/\/$/, "") || "/";
}

function resolveActiveTab(pathname: string, segments: readonly string[]): TabKey | null {
  const p = normalizePath(pathname);
  if (p.endsWith("/deals") || p.includes("/deals/")) {
    return "deals";
  }
  if (p.endsWith("/profile")) {
    return "profile";
  }
  if (p.endsWith("/website")) {
    return "website";
  }
  if (p.endsWith("/invite-help")) {
    return "invite-help";
  }
  if (p.endsWith("/home") || p.endsWith("/(tabs)") || p.endsWith("/(tabs)/home")) {
    return "home";
  }
  if (segments[0] === "(tabs)" && segments[1] === "home") {
    return "home";
  }
  return null;
}

export function MainTabBar() {
  const { meta } = useAuth();
  const role = (meta?.role ?? "").toLowerCase();
  const base = role === "carowner" || role === "car-owner" || role === "car_owner" ? "/(car-owner)" : "/(shop-owner)";
  const pathname = usePathname();
  const segments = useSegments();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const active = resolveActiveTab(pathname, segments);
  const toHome = useOncePress(() => {
    router.replace(`${base}/(tabs)/home` as any);
  });
  const toDeals = useOncePress(() => {
    router.push(`${base}/deals` as any);
  });
  const toProfile = useOncePress(() => {
    router.push(`${base}/profile` as any);
  });
  const toWebsite = useOncePress(() => {
    router.push(`${base}/website` as any);
  });
  const toInviteHelp = useOncePress(() => {
    router.push(`${base}/invite-help` as any);
  });

  const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "home", label: "Home", icon: "home" },
    { key: "deals", label: "Deals", icon: "pricetags-outline" },
    { key: "profile", label: "Profile", icon: "person-outline" },
    { key: "website", label: "Website", icon: "globe-outline" },
    { key: "invite-help", label: "Invite Help", icon: "headset-outline" },
  ];

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]} pointerEvents="box-none">
      {TABS.map((tab) => {
        const focused = active === tab.key;
        const color = focused ? colors.primary : colors.tabInactive;
        return (
          <Pressable
            key={tab.key}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={() => {
              if (tab.key === "home") {
                toHome?.();
                return;
              }
              if (tab.key === "deals") {
                toDeals?.();
                return;
              }
              if (tab.key === "profile") {
                toProfile?.();
                return;
              }
              if (tab.key === "website") {
                toWebsite?.();
                return;
              }
              toInviteHelp?.();
            }}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={tab.icon} size={22} color={color} />
            </View>
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: MAIN_TAB_BAR_OFFSET,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    paddingTop: spacing.sm,
    backgroundColor: colors.tabBarBg,
    borderTopWidth: 1,
    borderTopColor: colors.tabBarBorder,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    ...shadows.tabBar,
    zIndex: 200,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs - 1,
    paddingVertical: spacing.xs,
  },
  itemPressed: { opacity: 0.72 },
  iconWrap: { alignItems: "center", justifyContent: "center" },
  label: {
    fontSize: fontSizes.xs - 1,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});
