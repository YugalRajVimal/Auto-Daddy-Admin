import { Image } from "expo-image";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { clamp, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { styles } from "./my-vehicles-screen-styles";

export function VehicleGalleryZoomableImage({ uri }: { uri: string }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, 1, 4);
    })
    .onEnd(() => {
      if (scale.value <= 1.02) {
        scale.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
      }
    });

  const pan = Gesture.Pan()
    .onBegin(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    })
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      const bound = 240 * (scale.value - 1);
      tx.value = clamp(savedTx.value + e.translationX, -bound, bound);
      ty.value = clamp(savedTy.value + e.translationY, -bound, bound);
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        tx.value = withTiming(0);
        ty.value = withTiming(0);
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const next = scale.value > 1 ? 1 : 2.25;
      scale.value = withTiming(next);
      if (next === 1) {
        tx.value = withTiming(0);
        ty.value = withTiming(0);
      }
    });

  const gesture = Gesture.Simultaneous(doubleTap, Gesture.Simultaneous(pinch, pan));

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <View style={styles.viewerImageBox}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.viewerImageWrap, animStyle]}>
          <Image source={{ uri }} style={styles.viewerImage} contentFit="contain" transition={150} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
