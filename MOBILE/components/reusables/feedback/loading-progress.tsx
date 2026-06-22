import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Easing, StyleSheet, View } from "react-native";
import { colors, radii, spacing } from "@/constants/autodaddy";

export function LoadingProgress() {
  const translate = useRef(new Animated.Value(-140)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.timing(translate, { toValue: 280, duration: 1200, easing: Easing.linear, useNativeDriver: true }));
    animation.start();
    return () => animation.stop();
  }, [translate]);
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="small" color={colors.primary} />
      <View style={styles.track}>
        <Animated.View style={[styles.bar, { transform: [{ translateX: translate }] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", paddingVertical: spacing.xxl, gap: spacing.sm },
  track: { width: "76%", height: 6, backgroundColor: colors.border, borderRadius: radii.round, overflow: "hidden" },
  bar: { width: 120, height: 6, borderRadius: radii.round, backgroundColor: colors.primary },
});
