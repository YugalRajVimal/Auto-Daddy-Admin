import { colors } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { FlatList, Modal, Pressable, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./my-vehicles-screen-styles";
import { VehicleGalleryZoomableImage } from "./vehicle-gallery-zoomable-image";

type ViewerState = { title: string; uris: string[] } | null;

export function VehicleImageViewerModal({
  viewer,
  onRequestClose,
}: {
  viewer: ViewerState;
  onRequestClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const [viewerIndex, setViewerIndex] = useState(0);
  const viewerListRef = useRef<FlatList<string> | null>(null);
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      const idx = viewableItems?.[0]?.index;
      if (typeof idx === "number") setViewerIndex(idx);
    }
  ).current;
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 65 }).current;

  useEffect(() => {
    if (viewer) setViewerIndex(0);
  }, [viewer]);

  const viewerCount = viewer?.uris.length ?? 0;
  const canGoPrev = viewerIndex > 0;
  const canGoNext = viewerIndex < viewerCount - 1;
  const goToViewerIndex = (idx: number) => {
    if (!viewerListRef.current) return;
    if (idx < 0 || idx >= (viewer?.uris.length ?? 0)) return;
    viewerListRef.current.scrollToIndex({ index: idx, animated: true });
  };

  return (
    <Modal visible={viewer != null} transparent animationType="slide" onRequestClose={onRequestClose}>
      <View style={styles.viewerBackdrop}>
        <SafeAreaView style={[styles.viewerSheet, { height: Math.min(height * 0.92, 760) }]}>
          <LinearGradient
            colors={[colors.successDark, "#0B1220", "#050A14"]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.viewerSheetBg}
          >
            <View style={styles.viewerHandleWrap}>
              <View style={styles.viewerHandle} />
            </View>

            <View style={styles.viewerTopBar}>
              <Text style={styles.viewerTitle} numberOfLines={1}>
                {viewer?.title ?? "Image"}
              </Text>
              <View style={styles.viewerTopActions}>
                <Pressable onPress={onRequestClose} hitSlop={10} style={styles.viewerClose}>
                  <Ionicons name="close" size={20} color={colors.white} />
                </Pressable>
              </View>
            </View>

            <FlatList
              style={styles.viewerList}
              ref={(r) => {
                viewerListRef.current = r;
              }}
              data={viewer?.uris ?? []}
              keyExtractor={(u, idx) => `${u}-${idx}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
              renderItem={({ item }) => (
                <View style={[styles.viewerPage, { width, height: Math.min(height * 0.72, 520) }]}>
                  <VehicleGalleryZoomableImage uri={item} />
                </View>
              )}
            />

            {viewerCount > 1 ? (
              <LinearGradient
                colors={["rgba(5,10,20,0.0)", "rgba(5,10,20,0.88)", "rgba(5,10,20,0.95)"]}
                locations={[0, 0.55, 1]}
                style={styles.viewerBottomBar}
                pointerEvents="box-none"
              >
                <View style={styles.viewerBottomRow}>
                  <Pressable
                    onPress={() => goToViewerIndex(viewerIndex - 1)}
                    hitSlop={10}
                    disabled={!canGoPrev}
                    style={[styles.viewerIconBtn, !canGoPrev && styles.viewerIconBtnDisabled]}
                  >
                    <Ionicons name="chevron-back" size={22} color={colors.white} />
                  </Pressable>

                  <View style={styles.viewerIndexPill}>
                    <Text style={styles.viewerIndexPillText}>
                      {viewerIndex + 1}/{viewerCount}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => goToViewerIndex(viewerIndex + 1)}
                    hitSlop={10}
                    disabled={!canGoNext}
                    style={[styles.viewerIconBtn, !canGoNext && styles.viewerIconBtnDisabled]}
                  >
                    <Ionicons name="chevron-forward" size={22} color={colors.white} />
                  </Pressable>
                </View>
              </LinearGradient>
            ) : null}
          </LinearGradient>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
