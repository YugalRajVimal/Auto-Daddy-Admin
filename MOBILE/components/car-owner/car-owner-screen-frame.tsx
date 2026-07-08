import { Screen } from "@/components/reusables/layout/screen";
import { colors, spacing, tabHeaderKeyboardOffset } from "@/constants/autodaddy";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { useCallback, useContext, useRef } from "react";
import { Platform, RefreshControl, ScrollView, StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  header: ReactNode;
  children: ReactNode;
  backgroundColor?: string;
  headerGradient?: readonly string[];
  headerStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  scrollStyle?: StyleProp<ViewStyle>;
  bottomInsetExtra?: number;
  /** When the OS tab bar is hidden, reserve space for a custom bottom bar. */
  customTabBarHeight?: number;
  floatingContent?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
};

/**
 * Car-owner-specific screen frame.
 * This is intentionally a copy of `TabScreenFrame` so we can tune scroll behavior
 * for the car-owner experience without impacting shop-owner screens.
 */
export function CarOwnerScreenFrame({
  header,
  children,
  backgroundColor = colors.bgProfile,
  headerGradient = [colors.successMuted, colors.successMuted, colors.successMuted],
  headerStyle,
  contentContainerStyle,
  scroll = true,
  scrollStyle,
  bottomInsetExtra = spacing.md,
  customTabBarHeight = 0,
  floatingContent,
  onRefresh,
  refreshing = false,
}: Props) {
  const tabBarFromContext = useContext(BottomTabBarHeightContext) ?? 0;
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const chromeBg = (headerGradient?.[0] ?? colors.successMuted) as string;

  const effectiveTabBarHeight =
    tabBarFromContext ||
    (customTabBarHeight + (Platform.OS === "android" ? Math.max(insets.bottom, spacing.md) : 0));
  const safeBottom = effectiveTabBarHeight + bottomInsetExtra;

  useFocusEffect(
    useCallback(() => {
      if (!scroll) return undefined;
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      return undefined;
    }, [scroll])
  );

  return (
    <Screen
      backgroundColor={backgroundColor}
      statusBarBackgroundColor={chromeBg}
      dismissKeyboardOnTouch={false}
      keyboardVerticalOffset={tabHeaderKeyboardOffset}
      // Screen paints a default blue statusbar inset; car-owner uses green chrome.
      safeTop={false}
      safeBottom={false}
    >
      <StatusBar
        style="dark"
        // Android uses this background; iOS uses it for the status bar area behind.
        backgroundColor={chromeBg}
      />
      {/* Paint behind the system status bar with car-owner chrome */}
      <View style={{ height: Math.max(insets.top, spacing.lg), backgroundColor: chromeBg }} />
      <LinearGradient
        colors={headerGradient as readonly [ColorValue, ColorValue, ...ColorValue[]]}
        style={[styles.headerWrap, { backgroundColor: chromeBg, borderBottomColor: "rgba(22,101,52,0.18)" }, headerStyle]}
      >
        {header}
      </LinearGradient>

      {scroll ? (
        <ScrollView
          ref={scrollRef}
          style={scrollStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          alwaysBounceVertical={Boolean(onRefresh)}
          {...(Platform.OS === "android" && onRefresh
            ? { overScrollMode: "never" as const, nestedScrollEnabled: false }
            : { nestedScrollEnabled: true })}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }
          contentContainerStyle={[
            contentContainerStyle,
            { paddingBottom: safeBottom },
            onRefresh ? { flexGrow: 1 } : undefined,
          ]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentContainerStyle]}>{children}</View>
      )}

      {floatingContent ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.floatingWrap,
            { right: spacing.screenHorizontal, bottom: effectiveTabBarHeight + spacing.sm },
          ]}
        >
          {floatingContent}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // Stack header chrome sizing (aligned with car-owner navigation chrome).
  headerWrap: {
    minHeight: 56,
    justifyContent: "center",
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  floatingWrap: { position: "absolute" },
});

