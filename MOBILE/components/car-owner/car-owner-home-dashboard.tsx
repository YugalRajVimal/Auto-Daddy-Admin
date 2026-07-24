import { CarOwnerOdometerCarousel } from "@/components/car-owner/car-owner-odometer-carousel";
import { colors } from "@/constants/autodaddy";
import type { CarOwnerThoughtOfTheDayView } from "@/lib/normalize-car-owner-thought-of-the-day";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import type { CarOwnerOdometerReading } from "@/types/car-owner-odometer";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { carOwnerHomeStyles as styles } from "./car-owner-home-styles";
import { CAR_OWNER_SHOP_TYPE_SCREENS } from "@/lib/car-owner-shop-types";

const ActionTile = memo(function ActionTile({
  icon,
  label,
  href,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  href: string;
}) {
  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.actionTile,
        hovered ? styles.pressableHover : null,
        pressed ? styles.pressablePressed : null,
      ]}
      android_ripple={{ color: "rgba(27,94,32,0.10)" }}
      {...({ delayPressIn: 80, pressRetentionOffset: 12 } as any)}
      onPress={() => router.push(href as any)}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={24} color="#1B5E20" />
      </View>
      <Text style={styles.actionLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
});

function ThoughtOfTheDayCard({
  thought,
  onToggleThoughtLike,
}: {
  thought: CarOwnerThoughtOfTheDayView;
  onToggleThoughtLike: () => Promise<boolean>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [localLiked, setLocalLiked] = useState(thought.liked);
  const [localCount, setLocalCount] = useState(thought.likedCount);
  const [toggling, setToggling] = useState(false);

  useFocusEffect(useCallback(() => {
    setExpanded(false);
  }, []));

  useEffect(() => {
    setLocalLiked(thought.liked);
    setLocalCount(thought.likedCount);
  }, [thought.liked, thought.likedCount, thought.text]);

  const runToggleTowardLiked = async (targetLiked: boolean) => {
    if (toggling) return;
    if (targetLiked === localLiked) return;
    const prevLiked = localLiked;
    const prevCount = localCount;
    setToggling(true);
    setLocalLiked(targetLiked);
    setLocalCount((c) => Math.max(0, targetLiked ? c + 1 : c - 1));
    const ok = await onToggleThoughtLike();
    if (!ok) {
      setLocalLiked(prevLiked);
      setLocalCount(prevCount);
    }
    setToggling(false);
  };

  const likeLabel = localLiked ? "Unlike (thumbs up)" : "Like (thumbs up)";
  const dislikeLabel = localLiked ? "Unlike (thumbs down)" : "Dislike not available";

  return (
    <View style={styles.thoughtCard}>
      <View style={styles.thoughtCardInner}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thought of the day"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((open) => !open)}
          style={({ pressed }) => [pressed ? styles.pressablePressed : null]}
          android_ripple={{ color: "rgba(22,101,52,0.08)" }}
        >
          <View style={styles.thoughtCardHeaderRow}>
            <Ionicons name="sparkles-outline" size={22} color={colors.successDark} />
            <Text style={styles.thoughtCardTitle}>Thought of the day</Text>
            {/* <Text style={styles.thoughtCardHeaderCount} numberOfLines={1}>
              {localCount === 1 ? "1 like" : `${localCount} likes`}
            </Text> */}
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={22} color={colors.textMuted} />
          </View>
        </Pressable>
        {expanded ? (
          <>
            <Text style={styles.thoughtCardQuote}>“{thought.text}”</Text>
            <View style={styles.thoughtCardFooter}>
              <View style={styles.thoughtLikeActions}>
                <Pressable
                  accessibilityLabel={likeLabel}
                  accessibilityRole="button"
                  accessibilityState={{ selected: localLiked, disabled: toggling }}
                  hitSlop={6}
                  disabled={toggling}
                  onPress={() => {
                    void runToggleTowardLiked(!localLiked);
                  }}
                  style={({ pressed }) => [
                    styles.thoughtLikeBtn,
                    localLiked ? styles.thoughtLikeBtnActive : null,
                    toggling ? styles.thoughtLikeBtnDisabled : null,
                    pressed ? styles.pressablePressed : null,
                  ]}
                  android_ripple={{ color: "rgba(22,101,52,0.12)" }}
                >
                  <Ionicons
                    name={localLiked ? "thumbs-up" : "thumbs-up-outline"}
                    size={22}
                    color={colors.successDark}
                  />
                </Pressable>
                {/* <Pressable
                  accessibilityLabel={dislikeLabel}
                  accessibilityRole="button"
                  accessibilityState={{ selected: !localLiked, disabled: toggling || !localLiked }}
                  hitSlop={6}
                  disabled={toggling || !localLiked}
                  onPress={() => {
                    void runToggleTowardLiked(false);
                  }}
                  style={({ pressed }) => [
                    styles.thoughtLikeBtn,
                    !localLiked ? styles.thoughtLikeBtnDisabled : null,
                    pressed ? styles.pressablePressed : null,
                  ]}
                  android_ripple={{ color: "rgba(22,101,52,0.12)" }}
                >
                  <Ionicons
                    name={localLiked ? "thumbs-down" : "thumbs-down-outline"}
                    size={22}
                    color={localLiked ? colors.successDark : colors.textLight}
                  />
                </Pressable> */}
              </View>
              {/* <Text style={styles.thoughtLikeCount} numberOfLines={1}>
                {localCount === 1 ? "1 like" : `${localCount} likes`}
              </Text> */}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

export function CarOwnerHomeDashboard({
  displayName,
  photoUri,
  thoughtOfTheDay,
  onToggleThoughtLike,
  odometerReadings,
  odometerLoading,
  odometerError,
  onEditOdometer,
  onAddVehicle,
}: {
  displayName: string;
  photoUri: string | null;
  thoughtOfTheDay: CarOwnerThoughtOfTheDayView | null;
  onToggleThoughtLike: () => Promise<boolean>;
  odometerReadings: CarOwnerOdometerReading[];
  odometerLoading: boolean;
  odometerError: string | null;
  onEditOdometer: (reading: CarOwnerOdometerReading) => void;
  onAddVehicle: () => void;
}) {
  const avatarUri = useMemo(() => normalizeMediaUrl(photoUri), [photoUri]);

  return (
    <>
      <LinearGradient
        colors={[colors.successMuted, "#EAFBEF", colors.bgProfile]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.welcomeRow}>
          <View style={styles.welcomeTextCol}>
            {/* <Text style={styles.welcomeSmall}>Welcome,</Text> */}
            <Text style={styles.welcomeName}>{displayName}</Text>
          </View>
          <View style={styles.avatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Ionicons name="person" size={24} color={colors.successDark} />
            )}
          </View>
        </View>

        {thoughtOfTheDay ? (
          <ThoughtOfTheDayCard thought={thoughtOfTheDay} onToggleThoughtLike={onToggleThoughtLike} />
        ) : null}
      </LinearGradient>

      <View style={styles.contentPad}>
        <View style={styles.section}>
          {/* <Text style={styles.sectionTitle}>Quick actions</Text> */}
          <View style={styles.actionGrid}>
            <View style={styles.actionRow}>
              <View style={styles.actionCell}>
                <ActionTile icon="car-outline" label="My Vehicles" href="/(car-owner)/my-vehicles" />
              </View>
              <View style={styles.actionCell}>
                <ActionTile
                  icon="calendar-outline"
                  label="Auto Shops Nearby"
                  href={CAR_OWNER_SHOP_TYPE_SCREENS.autoShop.href}
                />
              </View>
              <View style={styles.actionCell}>
                <ActionTile icon="time-outline" label="Expenses" href="/(car-owner)/service-history" />
              </View>
            </View>
            <View style={styles.actionRow}>
              <View style={styles.actionCell}>
                <ActionTile
                  icon="disc-outline"
                  label="Tyre Shop"
                  href={CAR_OWNER_SHOP_TYPE_SCREENS.tyreShop.href}
                />
              </View>
              <View style={styles.actionCell}>
                <ActionTile
                  icon="water-outline"
                  label="Car Wash"
                  href={CAR_OWNER_SHOP_TYPE_SCREENS.carWash.href}
                />
              </View>
              <View style={styles.actionCell}>
                <ActionTile
                  icon="bus-outline"
                  label="Tow Truck"
                  href={CAR_OWNER_SHOP_TYPE_SCREENS.towTruck.href}
                />
              </View>
            </View>
          </View>
        </View>

        <CarOwnerOdometerCarousel
          readings={odometerReadings}
          loading={odometerLoading}
          error={odometerError}
          onEditReading={onEditOdometer}
          onAddVehicle={onAddVehicle}
        />
      </View>
    </>
  );
}
