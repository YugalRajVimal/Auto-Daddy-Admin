import { colors } from "@/constants/autodaddy";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TouchableOpacity, View } from "react-native";
import { styles } from "./my-vehicles-screen-styles";
import type { Vehicle } from "./user-vehicles";
import { vehicleTitle } from "./user-vehicles";

function vehicleCarGalleryPaths(v: Vehicle): string[] {
  const raw: string[] = [];
  if (v.carImage) raw.push(String(v.carImage));
  for (const u of v.carImages ?? []) {
    if (u) raw.push(String(u));
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of raw) {
    const n = normalizeMediaUrl(p);
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(p);
    }
  }
  return out;
}

function DetailBadge({ text, placeholder, fullWidth }: { text: string; placeholder?: boolean; fullWidth?: boolean }) {
  return (
    <View style={[styles.detailBadge, fullWidth && styles.detailBadgeFull]}>
      <Text style={[styles.detailBadgeText, placeholder && styles.detailBadgePlaceholder]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function PathRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.pathRow}>
      <Text style={styles.pathLabel}>{label}</Text>
      <Text style={styles.pathValue}>{value}</Text>
      <Ionicons name="open-outline" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function VehicleTopCarousel({
  uris,
  onOpenViewer,
  viewerTitle,
  rawPathsForViewer,
}: {
  uris: string[];
  onOpenViewer: (title: string, paths: (string | null | undefined)[]) => void;
  viewerTitle: string;
  rawPathsForViewer: string[];
}) {
  const [slideWidth, setSlideWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      const idx = viewableItems?.[0]?.index;
      if (typeof idx === "number") setActiveIndex(idx);
    }
  ).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 85 }).current;

  const slideHeight = slideWidth > 0 ? Math.round(slideWidth * (9 / 16)) : 0;

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <Pressable
        onPress={() => onOpenViewer(viewerTitle, rawPathsForViewer)}
        style={[styles.vehicleGallerySlide, { width: slideWidth, height: slideHeight }]}
        accessibilityRole="imagebutton"
        accessibilityLabel="Open vehicle photos"
      >
        <Image source={{ uri: item }} style={styles.vehicleGalleryImg} contentFit="cover" transition={120} />
      </Pressable>
    ),
    [onOpenViewer, rawPathsForViewer, slideHeight, slideWidth, viewerTitle]
  );

  const keyExtractor = useCallback((item: string, i: number) => `${i}-${item}`, []);

  if (uris.length === 0) {
    return (
      <View style={styles.vehicleGalleryPlaceholder}>
        <Ionicons name="car-sport-outline" size={40} color={colors.textLight} />
      </View>
    );
  }

  return (
    <View style={styles.vehicleGalleryOuter}>
      <View
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - slideWidth) > 1) setSlideWidth(w);
        }}
      >
        {slideWidth > 0 && slideHeight > 0 ? (
          <FlatList
            data={uris}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: slideWidth,
              offset: slideWidth * index,
              index,
            })}
          />
        ) : null}
      </View>
      {uris.length > 1 ? (
        <View style={styles.vehicleGalleryDots}>
          {uris.map((_, i) => (
            <View key={`dot-${i}`} style={[styles.vehicleGalleryDot, i === activeIndex && styles.vehicleGalleryDotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function VehicleAccordion({
  vehicle: v,
  expanded,
  onToggle,
  onOpenViewer,
  onEdit,
  busyVehicleId,
  onRequestDisable,
}: {
  vehicle: Vehicle;
  expanded: boolean;
  onToggle: () => void;
  onOpenViewer: (title: string, paths: (string | null | undefined)[]) => void;
  onEdit: () => void;
  busyVehicleId: string | null;
  onRequestDisable: () => void;
}) {
  const title = vehicleTitle(v);
  const isBusy = busyVehicleId === v.id;
  const plate = v.licensePlateNo ? String(v.licensePlateNo).trim() : "";
  const makeName = (v.make?.name ?? "").toString().trim();
  const modelName = (v.make?.model ?? "").toString().trim();
  const year = v.year != null && String(v.year).trim() ? String(v.year).trim() : "";
  const odo = v.odometerReading != null && String(v.odometerReading).trim() ? String(v.odometerReading).trim() : "";
  const vin = v.vinNo ? String(v.vinNo).trim() : "";
  const carGalleryPaths = useMemo(() => vehicleCarGalleryPaths(v), [v]);
  const carGalleryUris = useMemo(
    () => carGalleryPaths.map((p) => normalizeMediaUrl(p)).filter(Boolean) as string[],
    [carGalleryPaths]
  );

  const thumbUri = carGalleryUris[0] ?? null;

  if (!expanded) {
    return (
      <View style={styles.vehicleCard}>
        <Pressable
          onPress={onToggle}
          style={styles.collapsedRow}
          android_ripple={{ color: "rgba(37,99,235,0.08)" }}
          accessibilityRole="button"
          accessibilityLabel={`Expand ${plate || title}`}
        >
          <View style={styles.collapsedThumb}>
            {thumbUri ? (
              <Image source={{ uri: thumbUri }} style={styles.collapsedThumbImg} contentFit="cover" transition={120} />
            ) : (
              <Ionicons name="car-sport-outline" size={28} color={colors.textLight} />
            )}
          </View>
          <Text style={styles.collapsedPlate} numberOfLines={1}>
            {plate || "—"}
          </Text>
          <View style={styles.collapsedChevBtn}>
            <Ionicons name="chevron-down" size={20} color={colors.successDark} />
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.vehicleCard}>
      <VehicleTopCarousel
        uris={carGalleryUris}
        rawPathsForViewer={carGalleryPaths}
        viewerTitle={title}
        onOpenViewer={onOpenViewer}
      />

      <View style={styles.plateBar}>
        <Text style={styles.plateText}>{plate || "—"}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.badgeGrid}>
          <DetailBadge text={makeName || "Make"} placeholder={!makeName} />
          <DetailBadge text={modelName || "Model"} placeholder={!modelName} />
          <DetailBadge text={year || "Year"} placeholder={!year} />
          <DetailBadge text={odo ? `${odo} km` : "Odometer"} placeholder={!odo} />
          <DetailBadge text={vin || "VIN"} placeholder={!vin} fullWidth />
        </View>

        <View style={styles.expandWrap}>
          <View style={styles.paths}>
            {v.licensePlateImagePath ? (
              <PathRow label="Plate image" value="View" onPress={() => onOpenViewer("Plate image", [v.licensePlateImagePath])} />
            ) : null}
            {v.licensePlateFrontImagePath ? (
              <PathRow label="Plate front" value="View" onPress={() => onOpenViewer("Plate front", [v.licensePlateFrontImagePath])} />
            ) : null}
            {v.licensePlateBackImagePath ? (
              <PathRow label="Plate back" value="View" onPress={() => onOpenViewer("Plate back", [v.licensePlateBackImagePath])} />
            ) : null}
            {v.carImage ? (
              <PathRow label="Car image" value="View" onPress={() => onOpenViewer("Car image", [v.carImage])} />
            ) : null}
            {(v.carImages?.length ?? 0) > 0 ? (
              <PathRow
                label="Car images"
                value={`${v.carImages?.length} images`}
                onPress={() => onOpenViewer("Car images", v.carImages ?? [])}
              />
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Pressable
          onPress={onToggle}
          style={styles.footerIconBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Collapse vehicle details"
        >
          <Ionicons name="chevron-up" size={22} color={colors.successDark} />
        </Pressable>
        <View style={styles.footerActions}>
          <Pressable
            style={styles.footerIconBtn}
            onPress={onEdit}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Edit vehicle"
          >
            <Ionicons name="create-outline" size={22} color={colors.primary} />
          </Pressable>
          <Pressable
            style={styles.footerIconBtn}
            disabled={isBusy}
            onPress={onRequestDisable}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Delete vehicle"
          >
            {isBusy ? (
              <ActivityIndicator size="small" color={colors.textMuted} />
            ) : (
              <Ionicons name="trash-outline" size={22} color={colors.textMuted} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
