import { CarOwnerHomeDashboard } from "@/components/car-owner/car-owner-home-dashboard";
import { CAR_OWNER_TAB_BAR_OFFSET, CarOwnerHomeTabBar } from "@/components/car-owner/car-owner-home-tab-bar";
import { carOwnerHomeStyles as styles } from "@/components/car-owner/car-owner-home-styles";
import { CarOwnerOdometerEditModal } from "@/components/car-owner/car-owner-odometer-edit-modal";
import { CarOwnerScreenFrame } from "@/components/car-owner/car-owner-screen-frame";
import { LoadingProgress, NetworkStatusStrip, useToast } from "@/components/reusables";
import { colors, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useCarOwnerNotifications } from "@/context/car-owner-notifications-provider";
import { useAndroidExitOnBack } from "@/hooks/use-android-exit-on-back";
import { isCarOwnerRole } from "@/lib/car-owner-notification-read-state";
import { useCarOwnerDashboard } from "@/hooks/use-car-owner-dashboard";
import { useCarOwnerOdometerReadings } from "@/hooks/use-car-owner-odometer-readings";
import { postToggleThoughtOfTheDayLike } from "@/lib/car-owner-thought-of-the-day-api";
import { normalizeCarOwnerThoughtOfTheDay } from "@/lib/normalize-car-owner-thought-of-the-day";
import type { CarOwnerOdometerReading } from "@/types/car-owner-odometer";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { router, useNavigation } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function CarOwnerHome() {
  const { meta, token } = useAuth();
  useAndroidExitOnBack();
  const { hasUnread, syncUnreadFromApi } = useCarOwnerNotifications();
  const isCarOwner = isCarOwnerRole(meta?.role ?? null);
  const { data, loading, refresh } = useCarOwnerDashboard();
  const {
    readings: odometerReadings,
    loading: odometerLoading,
    error: odometerError,
    refresh: refreshOdometer,
  } = useCarOwnerOdometerReadings();
  const navigation = useNavigation();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<CarOwnerOdometerReading | null>(null);

  const thoughtOfTheDayView = useMemo(() => {
    const base = normalizeCarOwnerThoughtOfTheDay(data?.dashboard?.thoughtOfTheDay);
    if (!base) return null;

    const liked =
      data?.userProfile?.thoughtOfTheDayLiked ??
      data?.thoughtOfTheDayLiked ??
      base.liked;

    const rawCount = data?.dashboard?.thoughtOfTheDayLike;
    const likedCount =
      typeof rawCount === "number" && Number.isFinite(rawCount) && rawCount >= 0
        ? Math.floor(rawCount)
        : base.likedCount;

    return { ...base, liked, likedCount };
  }, [
    data?.dashboard?.thoughtOfTheDay,
    data?.dashboard?.thoughtOfTheDayLike,
    data?.thoughtOfTheDayLiked,
    data?.userProfile?.thoughtOfTheDayLiked,
  ]);

  const onToggleThoughtLike = useCallback(async (): Promise<boolean> => {
    if (!token) {
      showToast("Please sign in again.", { type: "error" });
      return false;
    }
    const res = await postToggleThoughtOfTheDayLike(token);
    const envelopeOk = res.data == null || res.data.success !== false;
    if (!res.ok || !envelopeOk) {
      showToast(res.data?.message ?? "Could not update like.", { type: "error" });
      return false;
    }
    await refresh();
    return true;
  }, [refresh, showToast, token]);

  const displayName =
    data?.userProfile?.name?.trim() || meta?.name?.trim() || "David";
  const photoUri =
    data?.userProfile?.profilePhoto ?? meta?.profilePhoto ?? null;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refresh(), refreshOdometer()]);
    } finally {
      setRefreshing(false);
    }
  }, [refresh, refreshOdometer]);

  const onEditOdometer = useCallback((reading: CarOwnerOdometerReading) => {
    setEditing(reading);
  }, []);

  const onAddVehicle = useCallback(() => {
    router.push("/(car-owner)/my-vehicles/add-vehicle" as never);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isCarOwner && token) {
        void syncUnreadFromApi();
      }
    }, [isCarOwner, syncUnreadFromApi, token])
  );

  return (
    <View style={styles.shell}>
      <CarOwnerScreenFrame
        backgroundColor={colors.bgProfile}
        headerGradient={[colors.successMuted, colors.successMuted, colors.successMuted]}
        contentContainerStyle={styles.scrollContent}
        bottomInsetExtra={spacing.lg}
        customTabBarHeight={CAR_OWNER_TAB_BAR_OFFSET}
        onRefresh={onRefresh}
        refreshing={refreshing}
        header={
          <View style={styles.headerBlock}>
            <View style={styles.headerRow}>
              <Pressable
                hitSlop={10}
                onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
                style={styles.headerIconBtn}
                android_ripple={{ color: "rgba(22,101,52,0.10)" }}
              >
                <Ionicons name="menu" size={22} color={colors.successDark} />
              </Pressable>
              <Text style={styles.headerTitle}>Dashboard</Text>
              <Pressable
                hitSlop={10}
                onPress={() => router.push("/(car-owner)/notifications" as never)}
                style={styles.headerIconBtn}
                accessibilityLabel="Notifications"
                android_ripple={{ color: "rgba(22,101,52,0.10)" }}
              >
                <Ionicons name="notifications-outline" size={22} color={colors.successDark} />
                {hasUnread ? <View style={styles.unreadDot} /> : null}
              </Pressable>
            </View>
          </View>
        }
      >
        <NetworkStatusStrip style={styles.contentNetworkStrip} />
        {loading && !data ? (
          <LoadingProgress />
        ) : (
          <CarOwnerHomeDashboard
            displayName={displayName}
            photoUri={photoUri}
            thoughtOfTheDay={thoughtOfTheDayView}
            onToggleThoughtLike={onToggleThoughtLike}
            odometerReadings={odometerReadings}
            odometerLoading={odometerLoading}
            odometerError={odometerError}
            onEditOdometer={onEditOdometer}
            onAddVehicle={onAddVehicle}
          />
        )}
      </CarOwnerScreenFrame>

      <CarOwnerHomeTabBar />

      <CarOwnerOdometerEditModal
        visible={editing != null}
        reading={editing}
        onClose={() => setEditing(null)}
        onSaved={refreshOdometer}
      />
    </View>
  );
}
