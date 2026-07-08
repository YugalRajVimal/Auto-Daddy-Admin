import {
  ASSOCIATE_TAB_BAR_OFFSET,
  associateColors,
} from "@/constants/associate-theme";
import { fontSizes, shadows, spacing } from "@/constants/autodaddy";
import { useOncePress } from "@/hooks/use-once-press";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter, useSegments } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export { ASSOCIATE_TAB_BAR_OFFSET };

type TabKey = "home" | "brochure" | "profile" | "website";

const BASE = "/(associate)";

function normalizePath(pathname: string) {
  return pathname.replace(/\/$/, "") || "/";
}

function resolveActiveTab(pathname: string, segments: readonly string[]): TabKey | null {
  const p = normalizePath(pathname);
  if (p.endsWith("/brochure")) return "brochure";
  if (p.endsWith("/profile")) return "profile";
  if (p.endsWith("/website")) return "website";
  if (p.endsWith("/home") || p.endsWith("/(tabs)") || p.endsWith("/(tabs)/home")) {
    return "home";
  }
  if (segments[0] === "(tabs)" && segments[1] === "home") {
    return "home";
  }
  return null;
}

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "home", label: "Home", icon: "home" },
  { key: "brochure", label: "Brochure", icon: "mail-outline" },
  { key: "profile", label: "Profile", icon: "person-outline" },
  { key: "website", label: "Website", icon: "globe-outline" },
];

export function AssociateTabBar() {
  const pathname = usePathname();
  const segments = useSegments();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const active = resolveActiveTab(pathname, segments);

  const toHome = useOncePress(() => router.replace(`${BASE}/(tabs)/home` as never));
  const toBrochure = useOncePress(() => router.push(`${BASE}/brochure` as never));
  const toProfile = useOncePress(() => router.push(`${BASE}/profile` as never));
  const toWebsite = useOncePress(() => router.push(`${BASE}/website` as never));

  return (
    <View
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
      pointerEvents="box-none"
    >
      {TABS.map((tab) => {
        const focused = active === tab.key;
        const color = focused ? associateColors.primary : associateColors.tabInactive;
        return (
          <Pressable
            key={tab.key}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={() => {
              if (tab.key === "home") toHome?.();
              else if (tab.key === "brochure") toBrochure?.();
              else if (tab.key === "profile") toProfile?.();
              else toWebsite?.();
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
    minHeight: ASSOCIATE_TAB_BAR_OFFSET,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    paddingTop: spacing.sm,
    backgroundColor: associateColors.tabBarBg,
    borderTopWidth: 1,
    borderTopColor: associateColors.tabBarBorder,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    ...shadows.tabBar,
  },
  item: {
    flex: 1,
    alignItems: "center",
    paddingTop: spacing.xs,
  },
  itemPressed: { opacity: 0.7 },
  iconWrap: { marginBottom: 2 },
  label: { fontSize: fontSizes.xs, fontWeight: "700" },
});
