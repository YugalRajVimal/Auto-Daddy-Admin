import { associateColors } from "@/constants/associate-theme";
import { colors, fontSizes, radii, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { isAssociateRole } from "@/lib/associate-roles";
import { isCarOwnerRole } from "@/lib/car-owner-notification-read-state";
import { useLogoutAction } from "@/hooks/use-logout-action";
import { useOncePress } from "@/hooks/use-once-press";
import { useSidebarUser } from "@/hooks/use-sidebar-user";
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { router, usePathname } from "expo-router";
import { useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DrawerRoute = string;

const CAR_OWNER_ITEMS = [
  { label: "Dashboard", icon: "home-outline", tone: "#16A34A", route: "/(car-owner)/(tabs)/home" },
  { label: "My Vehicles", icon: "car-outline", tone: "#166534", route: "/(car-owner)/my-vehicles" },
  { label: "Schedule Service", icon: "calendar-outline", tone: "#22C55E", route: "/(car-owner)/schedule-service" },
  { label: "Expenses", icon: "time-outline", tone: "#0EA5E9", route: "/(car-owner)/service-history" },
  { label: "Settings", icon: "settings-outline", tone: "#64748B", route: "/(car-owner)/settings" },
] as const;

const GENERAL_ITEMS = [
  { label: "About Us", icon: "information-circle-outline", tone: "#F59E0B", route: "/about" },
  { label: "Privacy Policy", icon: "shield-checkmark-outline", tone: "#3B82F6", route: "/privacypolicy" },
  { label: "FAQs", icon: "help-circle-outline", tone: "#8B5CF6", route: "/faqs" },
  { label: "Documents", icon: "document-text-outline", tone: "#7C3AED", route: "/documents" },
] as const;

const LEGAL_ITEMS = [
  { label: "Disclaimer", icon: "warning-outline", tone: "#64748B", route: "/disclaimer" },
] as const;

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const { meta } = useAuth();
  const pathname = usePathname();
  const sidebarUser = useSidebarUser();
  const handleLogout = useLogoutAction({
    onLoggedOut: () => props.navigation.closeDrawer(),
  });
  const role = (meta?.role ?? "").toLowerCase();
  const isCarOwner = isCarOwnerRole(meta?.role);
  const isAssociate = isAssociateRole(meta?.role);
  const profileRoute: DrawerRoute = isAssociate
    ? "/(associate)/profile"
    : isCarOwner
      ? "/(car-owner)/profile"
      : "/profile";
  const generalItems = isCarOwner
    ? ([
      { label: "Features", icon: "information-circle-outline", tone: "#F59E0B", route: "/(car-owner)/about" },
      { label: "Privacy Policy", icon: "shield-checkmark-outline", tone: "#3B82F6", route: "/(car-owner)/privacypolicy" },
      { label: "FAQs", icon: "help-circle-outline", tone: "#8B5CF6", route: "/(car-owner)/faqs" },
      { label: "Documents", icon: "document-text-outline", tone: "#7C3AED", route: "/(car-owner)/documents" },
    ] as const)
    : GENERAL_ITEMS;
  const legalItems = isCarOwner
    ? ([{ label: "Disclaimer", icon: "warning-outline", tone: "#64748B", route: "/(car-owner)/disclaimer" }] as const)
    : LEGAL_ITEMS;

  useEffect(() => {
    // DrawerContentComponentProps.navigation typing doesn't expose addListener,
    // but the runtime navigation object supports it.
    const navigation = props.navigation as unknown as {
      addListener?: (event: string, cb: () => void) => () => void;
    };
    const unsub =
      navigation.addListener?.("drawerOpen", () => {
        void sidebarUser.refresh?.();
      }) ?? (() => { });
    return unsub;
  }, [props.navigation, sidebarUser.refresh]);

  const goGuarded = useOncePress((route: DrawerRoute) => {
    props.navigation.closeDrawer();
    router.push(route as any);
  });
  function go(route: DrawerRoute) {
    goGuarded?.(route);
  }

  function isActiveRoute(route: string) {
    if (!route) return false;
    if (pathname === route) return true;
    // Treat nested routes as active (e.g. /documents/...).
    return pathname.startsWith(`${route}/`);
  }

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.top,
          isCarOwner ? styles.topCarOwner : null,
          isAssociate ? styles.topAssociate : null,
          { paddingTop: insets.top },
        ]}
      >
        <View style={styles.topRow}>
          <View>
            <Text
              style={[
                styles.brandTop,
                isCarOwner ? styles.brandTopCarOwner : null,
                isAssociate ? styles.brandTopAssociate : null,
              ]}
            >
              Auto
            </Text>
            <Text
              style={[
                styles.brandBottom,
                isCarOwner ? styles.brandBottomCarOwner : null,
                isAssociate ? styles.brandBottomAssociate : null,
              ]}
            >
              Daddy
            </Text>
          </View>
          <Pressable onPress={() => props.navigation.closeDrawer()} style={styles.closeBtn}>
            <Ionicons
              name="close"
              size={18}
              color={
                isAssociate
                  ? associateColors.primaryDark
                  : isCarOwner
                    ? colors.successDark
                    : colors.primaryBlue900
              }
            />
          </Pressable>
        </View>

        <Pressable style={styles.profileRow} onPress={() => go(profileRoute)}>
          <View style={styles.avatar}>
            {sidebarUser.userPhotoUri ? (
              <Image source={{ uri: sidebarUser.userPhotoUri }} style={styles.avatarImage} resizeMode="cover" />
            ) : sidebarUser.businessLogoUri ? (
              <Image
                source={{ uri: sidebarUser.businessLogoUri }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person-outline" size={24} color={colors.text} />
            )}
          </View>
          <View style={styles.profileText}>
            <Text
              style={[
                styles.name,
                isCarOwner ? styles.nameCarOwner : null,
                isAssociate ? styles.nameAssociate : null,
              ]}
            >
              {sidebarUser.userName}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons name="call-outline" size={12} color={colors.text} />
              <Text style={styles.meta}>
                {sidebarUser.countryCode} {sidebarUser.userPhone}
              </Text>
            </View>
            {sidebarUser.userEmail?.trim() ? (
              <View style={styles.metaRow}>
                <Ionicons name="mail-outline" size={12} color={colors.text} />
                <Text style={styles.meta}>{formatSidebarEmail(sidebarUser.userEmail)}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </View>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={[
          styles.menuContent,
          { paddingBottom: spacing.xl + Math.max(insets.bottom, spacing.md) },
        ]}
      >

        {/* {isCarOwner ? (
          <>
            <Text style={[styles.sectionLabel, styles.sectionSpacing]}>CAR OWNER</Text>
            {CAR_OWNER_ITEMS.map((item) => (
              <MenuRow
                key={item.label}
                label={item.label}
                icon={item.icon}
                tone={item.tone}
                active={isActiveRoute(item.route)}
                onPress={() => go(item.route)}
              />
            ))}
          </>
        ) : null} */}

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>GENERAL</Text>
        {generalItems.map((item) => (
          <MenuRow
            key={item.label}
            label={item.label}
            icon={item.icon}
            tone={item.tone}
            active={isActiveRoute(item.route)}
            onPress={() => go(item.route)}
          />
        ))}

        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>LEGAL</Text>
        {legalItems.map((item) => (
          <MenuRow
            key={item.label}
            label={item.label}
            icon={item.icon}
            tone={item.tone}
            active={isActiveRoute(item.route)}
            onPress={() => go(item.route)}
          />
        ))}

        <Pressable style={({ pressed }) => [styles.logout, pressed && styles.itemPressed]} onPress={handleLogout}>
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          </View>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </DrawerContentScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Text style={styles.footerBrand}>AutoDaddy</Text>
        <Text style={styles.footerVersion}>Version 1.0.0</Text>
      </View>
    </View>
  );
}

/** Prefer breaks at @ and . so long emails do not split mid-word in the drawer. */
function formatSidebarEmail(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return trimmed;

  const withDotBreaks = (value: string) => value.replace(/\./g, "\u200B.");

  const withChunkBreaks = (value: string, chunkSize = 14) => {
    if (value.length <= chunkSize) return value;
    const parts: string[] = [];
    for (let i = 0; i < value.length; i += chunkSize) {
      parts.push(value.slice(i, i + chunkSize));
    }
    return parts.join("\u200B");
  };

  const at = trimmed.indexOf("@");
  if (at <= 0) return withDotBreaks(withChunkBreaks(trimmed));

  const local = withChunkBreaks(trimmed.slice(0, at));
  const domain = withDotBreaks(trimmed.slice(at));

  if (trimmed.length <= 26) return `${local}${domain}`;

  return `${local}\n${domain}`;
}

function MenuRow({
  label,
  icon,
  tone,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && styles.itemPressed]} onPress={onPress}>
      <View style={[styles.itemIcon, { backgroundColor: active ? `${tone}33` : `${tone}22` }]}>
        <Ionicons name={icon} size={18} color={tone} />
      </View>
      <Text style={[styles.itemText, active && styles.itemTextActive]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  top: {
    backgroundColor: colors.tabBarBg,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.tabBarBorder,
  },
  topCarOwner: {
    backgroundColor: colors.successMuted,
    borderBottomColor: "rgba(22,101,52,0.18)",
  },
  topAssociate: {
    backgroundColor: associateColors.tabBarBg,
    borderBottomColor: associateColors.tabBarBorder,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  brandTop: { color: colors.primaryBlue900, fontSize: fontSizes.lg, fontWeight: "700" },
  brandBottom: { color: colors.primaryBlue900, fontSize: fontSizes.xxl, fontWeight: "900", marginTop: -4 },
  brandTopCarOwner: { color: colors.successDark },
  brandBottomCarOwner: { color: colors.successDark },
  brandTopAssociate: { color: associateColors.primaryDark },
  brandBottomAssociate: { color: associateColors.primaryDark },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(30,58,138,0.25)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  profileRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  profileText: { flex: 1 },
  name: { color: colors.primaryBlue900, fontSize: fontSizes.xl, fontWeight: "800" },
  nameCarOwner: { color: colors.successDark },
  nameAssociate: { color: associateColors.primaryDark },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  meta: { flex: 1, color: colors.text, fontSize: fontSizes.md, fontWeight: "500" },
  menuContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.primaryBlue900,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  sectionSpacing: { marginTop: spacing.lg },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  itemPressed: { backgroundColor: "rgba(255,255,255,0.5)" },
  itemActive: { backgroundColor: "rgba(22,101,52,0.08)" },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  itemText: {
    flex: 1,
    fontSize: fontSizes.xl,
    fontWeight: "600",
    color: colors.primaryBlue900,
  },
  itemTextActive: { color: colors.successDark, fontWeight: "900" },
  logout: {
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(30,58,138,0.15)",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
  },
  logoutIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.dangerMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  logoutText: {
    fontSize: fontSizes.hero,
    fontWeight: "700",
    color: colors.danger,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(30,58,138,0.15)",
    paddingTop: spacing.md,
    alignItems: "center",
  },
  footerBrand: { color: colors.primaryBlue900, fontSize: fontSizes.md, fontWeight: "700" },
  footerVersion: { color: colors.textMuted, fontSize: fontSizes.xs, marginTop: 2 },
});
