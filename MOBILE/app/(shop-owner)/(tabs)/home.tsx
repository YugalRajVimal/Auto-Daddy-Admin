import {
  AppBar,
  LoadingProgress,
  NetworkStatusStrip,
  Pill,
  TabScreenFrame,
  useToast,
} from "@/components/reusables";
import { GreetingCard, Overview, QuickActions, ThoughtOfTheDay } from "@/components/home";
import { MainTabBar, MAIN_TAB_BAR_OFFSET } from "@/components/layout/main-tab-bar";
import { colors, fontSizes, shadows, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useShopOwnerNotifications } from "@/context/shop-owner-notifications-provider";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import { getAutoShopOwnerProfile, getDashboardDetails } from "@/lib/auth";
import { updateBusinessActiveStatus } from "@/lib/auto-shop-owner-api";
import { formatStoredNationalPhone } from "@/lib/dial-countries";
import type { AutoShopOwnerProfileResponse } from "@/types/auto-shop-owner-profile";
import type { DashboardDetailsResponse } from "@/types/dashboard-details";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function HomePage() {
  const { meta, refreshSession, token } = useAuth();
  const { hasUnread, syncUnreadFromApi } = useShopOwnerNotifications();
  const { showToast } = useToast();
  const [serverData, setServerData] =
    useState<AutoShopOwnerProfileResponse["data"] | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingBusinessActive, setUpdatingBusinessActive] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadSavedData() {
      try {
        const [savedProfile, savedDashboard] = await Promise.all([
          getAutoShopOwnerProfile<AutoShopOwnerProfileResponse>(),
          getDashboardDetails<DashboardDetailsResponse>(),
        ]);
        if (!mounted) {
          return;
        }
        setServerData(savedProfile?.data ?? null);
        setDashboardData(savedDashboard);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    void loadSavedData();

    return () => {
      mounted = false;
    };
  }, []);

  const business = serverData?.businessProfile;
  const isShopOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";
  const businessLogoUri = normalizeMediaUrl(business?.businessLogo);
  // Source of truth for the toggle: business profile details.
  const isBusinessActive =
    typeof business?.isBusinessActive === "boolean" ? business.isBusinessActive : null;

  const handleBusinessActiveChange = useCallback(
    async (next: boolean) => {
      if (!token) {
        showToast("Please log in again.", { type: "error" });
        return false;
      }
      if (updatingBusinessActive) {
        return false;
      }
      setUpdatingBusinessActive(true);
      // Optimistic: immediately reflect next value in UI source-of-truth.
      setServerData((prev) => {
        if (!prev?.businessProfile) {
          return prev;
        }
        return {
          ...prev,
          businessProfile: { ...prev.businessProfile, isBusinessActive: next },
        };
      });
      try {
        const res = await updateBusinessActiveStatus(token, next);
        if (!res.ok || (res.data && typeof res.data === "object" && "success" in res.data && (res.data as any).success === false)) {
          const msg =
            res.data && typeof res.data === "object" && "message" in res.data
              ? String((res.data as { message?: string }).message ?? "")
              : "";
          showToast(msg || "Could not update shop status.", { type: "error" });
          return false;
        }
        showToast(next ? "Shop marked as open." : "Shop marked as closed.", { type: "success" });
        await refreshSession();
        // Pull the freshly saved business profile from storage so the toggle
        // doesn't "snap back" to stale state while the screen is mounted.
        const [savedProfile, savedDashboard] = await Promise.all([
          getAutoShopOwnerProfile<AutoShopOwnerProfileResponse>(),
          getDashboardDetails<DashboardDetailsResponse>(),
        ]);
        setServerData(savedProfile?.data ?? null);
        setDashboardData(savedDashboard);
        return true;
      } catch {
        showToast("Network error while updating shop status.", { type: "error" });
        return false;
      } finally {
        setUpdatingBusinessActive(false);
      }
    },
    [refreshSession, showToast, token, updatingBusinessActive]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshSession();
      const [savedProfile, savedDashboard] = await Promise.all([
        getAutoShopOwnerProfile<AutoShopOwnerProfileResponse>(),
        getDashboardDetails<DashboardDetailsResponse>(),
      ]);
      setServerData(savedProfile?.data ?? null);
      setDashboardData(savedDashboard);
    } finally {
      setRefreshing(false);
    }
  }, [refreshSession]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function syncFromStore() {
        const [savedProfile, savedDashboard] = await Promise.all([
          getAutoShopOwnerProfile<AutoShopOwnerProfileResponse>(),
          getDashboardDetails<DashboardDetailsResponse>(),
        ]);
        if (!active) {
          return;
        }
        setServerData(savedProfile?.data ?? null);
        setDashboardData(savedDashboard);
      }
      void syncFromStore();
      if (isShopOwner && token) {
        void syncUnreadFromApi();
      }
      return () => {
        active = false;
      };
    }, [isShopOwner, syncUnreadFromApi, token])
  );

  return (
    <View style={styles.shell}>
      <TabScreenFrame
        // backgroundColor={colors.bg}
        contentContainerStyle={styles.scrollContent}
        bottomInsetExtra={spacing.lg}
        customTabBarHeight={MAIN_TAB_BAR_OFFSET}
        onRefresh={isLoading ? undefined : handleRefresh}
        refreshing={refreshing}
        header={
          <AppBar
            title="AutoDaddy"
            right={
              <Pill variant="white" style={shadows.soft}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={styles.alertNum}>{dashboardData?.subscriptionDaysLeftCount} days left</Text>
              </Pill>
            }
          />
        }
      >
        <NetworkStatusStrip style={styles.networkStrip} />
        {isLoading ? (
          <LoadingProgress />
        ) : (
          <>
            {isShopOwner ? (
              <GreetingCard
                businessName={dashboardData?.businessName ?? business?.businessName}
                businessContactNo={formatStoredNationalPhone(
                  dashboardData?.businessContactNo ?? business?.businessPhone ?? ""
                )}
                isBusinessActive={isBusinessActive}
                businessLogoUri={businessLogoUri}
                updatingBusinessActive={updatingBusinessActive}
                onBusinessActiveChange={handleBusinessActiveChange}
                onNotificationsPress={() => router.push("/(shop-owner)/notifications")}
                showNotificationUnreadDot={hasUnread}
              />
            ) : null}

            <QuickActions />
            <Overview
              incomeOverview={dashboardData?.incomeOverview ?? null}
              subscriptionDaysLeft={dashboardData?.subscriptionDaysLeftCount ?? null}
            />
            <ThoughtOfTheDay quote={dashboardData?.thoughtOfTheDay} />
            <View style={styles.bottomSpacer} />
          </>
        )}
      </TabScreenFrame>
      <MainTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  alertNum: { fontSize: fontSizes.md, fontWeight: "800", color: colors.text },
  fixedHeader: {
    paddingBottom: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.sm,
  },
  networkStrip: {
    marginBottom: spacing.sm,
  },
  bottomSpacer: { height: spacing.sm },
});

