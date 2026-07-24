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
import { useAndroidExitOnBack } from "@/hooks/use-android-exit-on-back";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import { getAutoShopOwnerProfile, getDashboardDetails, saveDashboardDetails } from "@/lib/auth";
import { fetchShopOwnerHome } from "@/lib/autoshopowner-api";
import { updateBusinessActiveStatus } from "@/lib/auto-shop-owner-api";
import { formatStoredNationalPhone } from "@/lib/dial-countries";
import {
  parseShopOwnerHome,
  shopOwnerThoughtToQuoteString,
  type ShopOwnerHomeView,
} from "@/lib/parse-shop-owner-home";
import type { AutoShopOwnerProfileResponse } from "@/types/auto-shop-owner-profile";
import type { DashboardDetailsResponse } from "@/types/dashboard-details";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

function mergeHomeIntoDashboardCache(
  cached: DashboardDetailsResponse | null,
  home: ShopOwnerHomeView
): DashboardDetailsResponse {
  const thought = shopOwnerThoughtToQuoteString(home.thoughtOfTheDay);
  if (cached?.success) {
    return {
      ...cached,
      businessName: home.businessName || cached.businessName,
      subscriptionDaysLeftCount: home.daysLeftInSubscription,
      thoughtOfTheDay: thought || cached.thoughtOfTheDay,
    };
  }
  return {
    success: true,
    businessName: home.businessName,
    businessContactNo: "",
    idBusinessActive: false,
    incomeOverview: {
      daily: { date: "", totalSale: 0, received: 0, pending: 0 },
    },
    subscriptionDaysLeftCount: home.daysLeftInSubscription,
    thoughtOfTheDay: thought,
    aboutUs: { heading: "", desc: "" },
    privacyPolicy: { heading: "", desc: "" },
    FAQs: { heading: "", desc: "" },
    Documents: { heading: "", desc: "" },
    Disclaimer: { heading: "", desc: "" },
    businessUserDetails: {
      name: home.autoShopOwnerName,
      email: "",
      countryCode: "",
      phone: "",
      pincode: "",
      address: "",
      profilePhoto: null,
      isDisabled: false,
      isProfileComplete: false,
    },
  };
}

export default function HomePage() {
  const { meta, refreshSession, token } = useAuth();
  useAndroidExitOnBack();
  const { hasUnread, syncUnreadFromApi } = useShopOwnerNotifications();
  const { showToast } = useToast();
  const [serverData, setServerData] =
    useState<AutoShopOwnerProfileResponse["data"] | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardDetailsResponse | null>(null);
  const [homeData, setHomeData] = useState<ShopOwnerHomeView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingBusinessActive, setUpdatingBusinessActive] = useState(false);

  const loadCachedShell = useCallback(async () => {
    const [savedProfile, savedDashboard] = await Promise.all([
      getAutoShopOwnerProfile<AutoShopOwnerProfileResponse>(),
      getDashboardDetails<DashboardDetailsResponse>(),
    ]);
    setServerData(savedProfile?.data ?? null);
    setDashboardData(savedDashboard);
    return savedDashboard;
  }, []);

  const loadHomeFromApi = useCallback(async () => {
    if (!token) return null;
    const res = await fetchShopOwnerHome(token);
    if (!res.ok) return null;
    const parsed = parseShopOwnerHome(res.data);
    if (!parsed) return null;
    setHomeData(parsed);
    return parsed;
  }, [token]);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      try {
        const cached = await loadCachedShell();
        if (!mounted) return;

        // Seed thought/subscription UI from cached dashboard while network loads.
        if (cached?.success) {
          setHomeData({
            autoShopOwnerName: cached.businessUserDetails?.name ?? "",
            businessName: cached.businessName ?? "",
            daysLeftInSubscription: cached.subscriptionDaysLeftCount ?? 0,
            thoughtOfTheDay: cached.thoughtOfTheDay
              ? {
                  subject: "",
                  text: cached.thoughtOfTheDay,
                  imageUri: null,
                  likes: 0,
                }
              : null,
          });
        }

        const home = await loadHomeFromApi();
        if (!mounted || !home) return;
        const nextDashboard = mergeHomeIntoDashboardCache(cached, home);
        setDashboardData(nextDashboard);
        await saveDashboardDetails(nextDashboard);
      } catch {
        // Keep cached shell; network failures are returned as ok:false from the API layer.
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    void bootstrap();
    return () => {
      mounted = false;
    };
  }, [loadCachedShell, loadHomeFromApi]);

  const business = serverData?.businessProfile;
  const isShopOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";
  const businessLogoUri = normalizeMediaUrl(business?.businessLogo);
  // Source of truth for the toggle: business profile details.
  const isBusinessActive =
    typeof business?.isBusinessActive === "boolean" ? business.isBusinessActive : null;

  const displayBusinessName =
    homeData?.businessName || dashboardData?.businessName || business?.businessName;
  const subscriptionDaysLeft =
    homeData?.daysLeftInSubscription ?? dashboardData?.subscriptionDaysLeftCount ?? 0;
  const thought = homeData?.thoughtOfTheDay;
  const thoughtQuote = thought?.text || dashboardData?.thoughtOfTheDay || undefined;

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
        await loadCachedShell();
        return true;
      } catch {
        showToast("Network error while updating shop status.", { type: "error" });
        return false;
      } finally {
        setUpdatingBusinessActive(false);
      }
    },
    [loadCachedShell, refreshSession, showToast, token, updatingBusinessActive]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshSession();
      const cached = await loadCachedShell();
      const home = await loadHomeFromApi();
      if (home) {
        const nextDashboard = mergeHomeIntoDashboardCache(cached, home);
        setDashboardData(nextDashboard);
        await saveDashboardDetails(nextDashboard);
      }
    } catch {
      showToast("Could not refresh. Check your connection.", { type: "error" });
    } finally {
      setRefreshing(false);
    }
  }, [loadCachedShell, loadHomeFromApi, refreshSession, showToast]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function syncFromStore() {
        const [savedProfile, savedDashboard] = await Promise.all([
          getAutoShopOwnerProfile<AutoShopOwnerProfileResponse>(),
          getDashboardDetails<DashboardDetailsResponse>(),
        ]);
        if (!active) return;
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
                <Text style={styles.alertNum}>{subscriptionDaysLeft} days left</Text>
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
                businessName={displayBusinessName}
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
              subscriptionDaysLeft={subscriptionDaysLeft}
            />
            <ThoughtOfTheDay
              quote={thoughtQuote}
              subject={thought?.subject}
              imageUri={thought?.imageUri}
            />
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
