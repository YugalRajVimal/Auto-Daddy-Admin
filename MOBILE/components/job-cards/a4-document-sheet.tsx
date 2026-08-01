import { colors, spacing } from "@/constants/autodaddy";
import { useEffect, useState, type ReactNode } from "react";
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

/** A4 at 96dpi — matches CSS `210mm` / `297mm` for layout math. */
export const A4_WIDTH_PX = (210 * 96) / 25.4;
export const A4_HEIGHT_PX = (297 * 96) / 25.4;

/** ~14mm page margin used by the web print preview. */
export const A4_PAGE_PAD_PX = (14 * 96) / 25.4;

const STAGE_PAD_PX = spacing.md;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const DOUBLE_TAP_ZOOM = 2;

type A4DocumentSheetProps = {
  children: ReactNode;
  /** Extra styles on the white paper sheet. */
  style?: StyleProp<ViewStyle>;
  /** Extra styles on the stage container. */
  stageStyle?: StyleProp<ViewStyle>;
  /** Unused — kept for API compatibility with earlier scroll-based version. */
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * Renders children on an on-screen A4 sheet (210×297mm).
 * Fits to stage width; pinch / double-tap zoom; drag pans both axes.
 */
export function A4DocumentSheet({
  children,
  style,
  stageStyle,
}: A4DocumentSheetProps) {
  const [stageWidth, setStageWidth] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(A4_HEIGHT_PX);

  const zoom = useSharedValue(1);
  const savedZoom = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const fitScaleSV = useSharedValue(1);
  const fittedWSV = useSharedValue(A4_WIDTH_PX);
  const fittedHSV = useSharedValue(A4_HEIGHT_PX);
  const viewWSV = useSharedValue(0);
  const viewHSV = useSharedValue(0);

  const onStageLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    const viewW = Math.max(0, w - STAGE_PAD_PX * 2);
    const viewH = Math.max(0, h - STAGE_PAD_PX * 2);
    if (w > 0 && Math.abs(w - stageWidth) > 0.5) setStageWidth(w);
    viewWSV.value = viewW;
    viewHSV.value = viewH;
  };

  const onSheetLayout = (e: LayoutChangeEvent) => {
    const h = Math.max(e.nativeEvent.layout.height, A4_HEIGHT_PX);
    if (Math.abs(h - sheetHeight) > 0.5) setSheetHeight(h);
  };

  const availableW = Math.max(0, stageWidth - STAGE_PAD_PX * 2);
  const fitScale = availableW > 0 ? Math.max(0.35, Math.min(1, availableW / A4_WIDTH_PX)) : 1;
  const fittedW = A4_WIDTH_PX * fitScale;
  const fittedH = sheetHeight * fitScale;

  useEffect(() => {
    fitScaleSV.value = fitScale;
    fittedWSV.value = fittedW;
    fittedHSV.value = fittedH;
  }, [fitScale, fittedW, fittedH, fitScaleSV, fittedWSV, fittedHSV]);

  const clampTranslation = (x: number, y: number, z: number) => {
    "worklet";
    const scaledW = fittedWSV.value * z;
    const scaledH = fittedHSV.value * z;
    const viewW = viewWSV.value;
    const viewH = viewHSV.value;
    // Top-left origin: 0 shows top/left; negative reveals right/bottom overflow.
    const minX = Math.min(0, viewW - scaledW);
    const minY = Math.min(0, viewH - scaledH);
    return {
      x: clamp(x, minX, 0),
      y: clamp(y, minY, 0),
    };
  };

  const settleTranslation = (z: number) => {
    "worklet";
    const next = clampTranslation(tx.value, ty.value, z);
    tx.value = withTiming(next.x, { duration: 160 });
    ty.value = withTiming(next.y, { duration: 160 });
  };

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      savedZoom.value = zoom.value;
    })
    .onUpdate((e) => {
      zoom.value = clamp(savedZoom.value * e.scale, MIN_ZOOM, MAX_ZOOM);
      const next = clampTranslation(tx.value, ty.value, zoom.value);
      tx.value = next.x;
      ty.value = next.y;
    })
    .onEnd(() => {
      const nextZ = zoom.value <= 1.02 ? 1 : zoom.value;
      zoom.value = withTiming(nextZ, { duration: 160 });
      settleTranslation(nextZ);
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .minPointers(1)
    .maxPointers(2)
    .onBegin(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    })
    .onUpdate((e) => {
      const next = clampTranslation(
        savedTx.value + e.translationX,
        savedTy.value + e.translationY,
        zoom.value,
      );
      tx.value = next.x;
      ty.value = next.y;
    })
    .onEnd(() => {
      settleTranslation(zoom.value);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const nextZ = zoom.value > 1.05 ? 1 : DOUBLE_TAP_ZOOM;
      zoom.value = withTiming(nextZ, { duration: 180 });
      if (nextZ === 1) {
        tx.value = withTiming(0, { duration: 180 });
        ty.value = withTiming(0, { duration: 180 });
      } else {
        settleTranslation(nextZ);
      }
    });

  const gesture = Gesture.Simultaneous(doubleTap, Gesture.Simultaneous(pinch, pan));

  const paperAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: fitScaleSV.value * zoom.value },
    ],
  }));

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={[styles.stage, stageStyle]} onLayout={onStageLayout}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={styles.stageInner}>
            <Animated.View
              style={[
                styles.sheet,
                {
                  width: A4_WIDTH_PX,
                  minHeight: A4_HEIGHT_PX,
                },
                paperAnimStyle,
                style,
              ]}
              onLayout={onSheetLayout}
            >
              {children}
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stage: {
    flex: 1,
    backgroundColor: colors.bg,
    overflow: "hidden",
  },
  stageInner: {
    flex: 1,
    padding: STAGE_PAD_PX,
  },
  sheet: {
    backgroundColor: colors.white,
    overflow: "hidden",
    flexDirection: "column",
    transformOrigin: "top left",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
});
