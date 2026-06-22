import { colors, fontSizes, radii, shadows, spacing, typography } from "@/constants/autodaddy";
import {
  formatOdometerKm,
  odometerVehicleTitle,
} from "@/lib/car-owner-odometer";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import type { CarOwnerOdometerReading } from "@/types/car-owner-odometer";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

const CARD_HORIZONTAL_GUTTER = spacing.screenHorizontal;
const CARD_SPACING = spacing.md;
const SHELL_INSET = spacing.md * 2;

type Props = {
  readings: CarOwnerOdometerReading[];
  loading: boolean;
  error: string | null;
  onEditReading: (reading: CarOwnerOdometerReading) => void;
  onAddVehicle?: () => void;
};

export function CarOwnerOdometerCarousel({
  readings,
  loading,
  error,
  onEditReading,
  onAddVehicle,
}: Props) {
  const { width } = useWindowDimensions();
  const cardWidth = useMemo(
    () => Math.min(360, width - CARD_HORIZONTAL_GUTTER * 2 - SHELL_INSET),
    [width]
  );
  const snapInterval = cardWidth + CARD_SPACING;

  const listRef = useRef<FlatList<CarOwnerOdometerReading> | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      const idx = viewableItems?.[0]?.index;
      if (typeof idx === "number") setActiveIndex(idx);
    }
  ).current;
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  const onPressEditReading = useCallback(
    (reading: CarOwnerOdometerReading) => {
      onEditReading(reading);
    },
    [onEditReading]
  );

  const renderItem = useCallback(
    ({ item }: { item: CarOwnerOdometerReading }) => (
      <OdometerCard
        reading={item}
        width={cardWidth}
        onPressEdit={onPressEditReading}
      />
    ),
    [cardWidth, onPressEditReading]
  );

  const itemSeparator = useCallback(() => <View style={{ width: CARD_SPACING }} />, []);

  const goToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(readings.length - 1, index));
      listRef.current?.scrollToOffset({ offset: snapInterval * clamped, animated: true });
    },
    [readings.length, snapInterval]
  );

  const hasReadings = readings.length > 0;
  const showCarouselNav = readings.length > 1;
  const canGoBack = activeIndex > 0;
  const canGoForward = activeIndex < readings.length - 1;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Update your odometer</Text>
      </View>

      {loading && !hasReadings ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.successDark} />
          <Text style={styles.stateText}>Loading vehicles...</Text>
        </View>
      ) : error && !hasReadings ? (
        <View style={styles.stateCard}>
          <Ionicons name="alert-circle-outline" size={22} color={colors.danger} />
          <Text style={styles.stateText}>{error}</Text>
        </View>
      ) : !hasReadings ? (
        <View style={styles.stateCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="speedometer-outline" size={26} color={colors.successDark} />
          </View>
          <Text style={styles.emptyTitle}>No vehicles yet</Text>
          <Text style={styles.emptySub}>
            Add a vehicle to track odometer readings and service due.
          </Text>
          {onAddVehicle ? (
            <Pressable
              onPress={onAddVehicle}
              style={({ pressed }) => [styles.emptyBtn, pressed ? styles.pressed : null]}
              android_ripple={{ color: "rgba(255,255,255,0.18)" }}
            >
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.emptyBtnText}>Add Vehicle</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.carouselShell}>
          <FlatList
            ref={(r) => {
              listRef.current = r;
            }}
            data={readings}
            keyExtractor={(item) => item.vehicleId}
            renderItem={renderItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={snapInterval}
            snapToAlignment="start"
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={itemSeparator}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: snapInterval,
              offset: snapInterval * index,
              index,
            })}
          />
          {showCarouselNav ? (
            <View
              style={styles.carouselFooter}
              accessibilityLabel={`Vehicle ${activeIndex + 1} of ${readings.length}`}
            >
              <View style={styles.carouselFooterSide}>
                {canGoBack ? (
                  <Pressable
                    onPress={() => goToIndex(activeIndex - 1)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Previous vehicle"
                    style={({ pressed }) => [styles.carouselFooterBtn, pressed ? styles.carouselFooterBtnPressed : null]}
                  >
                    <Ionicons name="chevron-back" size={20} color={colors.successDark} />
                  </Pressable>
                ) : (
                  <View style={styles.carouselFooterSpacer} />
                )}
              </View>
              <View style={styles.carouselFooterCenter}>
                <View style={styles.carouselDots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  {readings.map((reading, idx) => (
                    <View
                      key={reading.vehicleId}
                      style={[styles.carouselDot, idx === activeIndex ? styles.carouselDotActive : null]}
                    />
                  ))}
                </View>
                <Text style={styles.carouselFooterCount}>
                  <Text style={styles.carouselFooterCountCurrent}>{activeIndex + 1}</Text>
                  <Text style={styles.carouselFooterCountSep}> / </Text>
                  <Text style={styles.carouselFooterCountTotal}>{readings.length}</Text>
                </Text>
              </View>
              <View style={styles.carouselFooterSide}>
                {canGoForward ? (
                  <Pressable
                    onPress={() => goToIndex(activeIndex + 1)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Next vehicle"
                    style={({ pressed }) => [styles.carouselFooterBtn, pressed ? styles.carouselFooterBtnPressed : null]}
                  >
                    <Ionicons name="chevron-forward" size={20} color={colors.successDark} />
                  </Pressable>
                ) : (
                  <View style={styles.carouselFooterSpacer} />
                )}
              </View>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const OdometerCard = memo(function OdometerCard({
  reading,
  width,
  onPressEdit,
}: {
  reading: CarOwnerOdometerReading;
  width: number;
  onPressEdit: (reading: CarOwnerOdometerReading) => void;
}) {
  const imageUri = useMemo(() => normalizeMediaUrl(reading.carImage), [reading.carImage]);
  const title = odometerVehicleTitle(reading);
  const plate = reading.licensePlateNo?.trim() ?? "";
  const odoText = formatOdometerKm(reading.odometerReading);
  const dueText =
    reading.dueOdometerReading != null ? formatOdometerKm(reading.dueOdometerReading) : null;

  const remaining =
    reading.dueOdometerReading != null && reading.odometerReading != null
      ? reading.dueOdometerReading - reading.odometerReading
      : null;

  const remainingLabel =
    remaining == null
      ? null
      : remaining > 0
        ? `${remaining.toLocaleString()} km left`
        : remaining === 0
          ? "Due now"
          : `${Math.abs(remaining).toLocaleString()} km`;
  const isOverdue = remaining != null && remaining < 0;

  const onEdit = useCallback(() => {
    onPressEdit(reading);
  }, [onPressEdit, reading]);

  return (
    <View style={[styles.card, { width }]}>
      <View style={styles.cardTopRow}>
        {imageUri ? (
          <View style={styles.cardThumb}>
            <Image source={{ uri: imageUri }} style={styles.cardThumbImage} contentFit="cover" />
          </View>
        ) : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          {plate ? (
            <Text style={styles.cardPlate} numberOfLines={1}>
              {plate}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.bigOdometerWrap}>
        <View style={styles.bigIcon}>
          <Ionicons name="speedometer-outline" size={20} color={colors.successDark} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.bigLabel}>Current odometer</Text>
          <Text style={styles.bigValue} numberOfLines={1}>
            {odoText}
          </Text>
        </View>
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [styles.bigEditBtn, pressed ? styles.pressed : null]}
          android_ripple={{ color: "rgba(255,255,255,0.18)" }}
        >
          <Text style={styles.bigEditBtnText}>Update</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Service due</Text>
          <Text style={styles.statValue} numberOfLines={1}>
            {dueText ?? "—"}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Status</Text>
          {isOverdue ? (
            <View style={styles.statusCol}>
              <View style={styles.overdueChip}>
                <Text style={styles.overdueChipText}>Overdue</Text>
              </View>
              {/* <Text style={[styles.statValue, styles.statusValue, styles.statValueWarn]} numberOfLines={1}>
                {remainingLabel ?? "Not set"}
              </Text> */}
            </View>
          ) : (
            <Text style={[styles.statValue, styles.statusValue]} numberOfLines={1}>
              {remainingLabel ?? "Not set"}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.cardTitle,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  sectionSub: {
    marginTop: 2,
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: colors.textMuted,
  },
  carouselShell: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
    overflow: "hidden",
    ...shadows.soft,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },

  card: {
    backgroundColor: "transparent",
    borderRadius: 0,
    padding: 0,
    gap: spacing.md,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cardThumb: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.successMuted,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardThumbImage: { width: 50, height: 50, borderRadius: 16 },
  cardTitle: { fontSize: 20, fontWeight: "900", color: colors.text },
  cardPlate: {
    marginTop: 2,
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.successMuted,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.18)",
  },

  bigOdometerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.successMuted,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.18)",
  },
  bigIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  bigLabel: {
    fontSize: fontSizes.xs,
    fontWeight: "900",
    color: colors.successDark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bigValue: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
  },
  bigEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.round,
    backgroundColor: colors.successDark,
  },
  bigEditBtnText: { color: colors.white, fontSize: fontSizes.xs, fontWeight: "900" },

  statsRow: { flexDirection: "row", gap: spacing.md },
  statBox: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: "#F8FBFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    fontWeight: "900",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    marginTop: 4,
    fontSize: fontSizes.sm,
    fontWeight: "900",
    color: colors.text,
  },
  statValueWarn: { color: colors.danger },
  statusCol: {
    marginTop: 6,
    gap: 6,
    minWidth: 0,
  },
  statusValue: {
    marginTop: 0,
    flexShrink: 1,
  },
  overdueChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.round,
    backgroundColor: "rgba(220,38,38,0.10)",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.25)",
    alignSelf: "flex-start",
  },
  overdueChipText: {
    fontSize: fontSizes.xs,
    fontWeight: "900",
    color: colors.danger,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  carouselFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(15,23,42,0.06)",
    backgroundColor: "#F4FBF6",
  },
  carouselFooterSide: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  carouselFooterSpacer: {
    width: 32,
    height: 32,
  },
  carouselFooterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.12)",
  },
  carouselFooterBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  carouselFooterCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  carouselDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  carouselDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(22,101,52,0.18)",
  },
  carouselDotActive: {
    width: 18,
    backgroundColor: colors.successDark,
  },
  carouselFooterCount: {
    fontSize: fontSizes.sm,
    fontWeight: "900",
  },
  carouselFooterCountCurrent: {
    color: colors.successDark,
    fontSize: fontSizes.md,
    fontWeight: "900",
  },
  carouselFooterCountSep: {
    color: colors.textLight,
    fontWeight: "700",
  },
  carouselFooterCountTotal: {
    color: colors.textMuted,
    fontWeight: "800",
  },

  stateCard: {
    minHeight: 140,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stateText: { fontSize: fontSizes.sm, fontWeight: "800", color: colors.textMuted },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 22,
    backgroundColor: colors.successMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: fontSizes.lg, fontWeight: "900", color: colors.text },
  emptySub: {
    ...typography.bodyMuted,
    textAlign: "center",
    fontSize: fontSizes.sm,
    fontWeight: "700",
  },
  emptyBtn: {
    marginTop: spacing.xs,
    minHeight: 42,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.successDark,
  },
  emptyBtnText: { color: colors.white, fontSize: fontSizes.sm, fontWeight: "900" },

  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
});
