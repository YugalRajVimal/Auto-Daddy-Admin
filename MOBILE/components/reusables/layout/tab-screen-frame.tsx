import { colors, spacing, tabHeaderKeyboardOffset } from "@/constants/autodaddy";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { useCallback, useContext, useRef } from "react";
import { Platform, RefreshControl, StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from "react-native";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "./screen";

type Props = {
  header: ReactNode;
  children: ReactNode;
  backgroundColor?: string;
  /** System status bar / top safe-area chrome (defaults to shop-owner tab bar blue). */
  statusBarBackgroundColor?: string;
  headerGradient?: readonly string[];
  refreshTintColor?: string;
  headerStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  scrollStyle?: StyleProp<ViewStyle>;
  bottomInsetExtra?: number;
  /** When the OS tab bar is hidden, reserve space for a custom bottom bar (e.g. MainTabBar). */
  customTabBarHeight?: number;
  floatingContent?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
};

export function TabScreenFrame({
  header,
  children,
  backgroundColor = colors.bg,
  statusBarBackgroundColor = colors.tabBarBg,
  headerGradient = [colors.tabBarBg, colors.tabBarBg, colors.tabBarBg],
  refreshTintColor = colors.primary,
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

  // `tabBarFromContext` (React Navigation) already includes safe-area.
  // For our `MainTabBar`, `customTabBarHeight` is set to `MAIN_TAB_BAR_OFFSET` which already
  // includes the home-indicator padding on iOS in its visual height.
  // On Android, the system nav bar height varies and must be reserved explicitly.
  const effectiveTabBarHeight =
    tabBarFromContext ||
    (customTabBarHeight + (Platform.OS === "android" ? Math.max(insets.bottom, spacing.md) : 0));
  const safeBottom = effectiveTabBarHeight + bottomInsetExtra;

  useFocusEffect(
    useCallback(() => {
      if (!scroll) {
        return undefined;
      }
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      return undefined;
    }, [scroll])
  );

  return (
    <Screen
      backgroundColor={backgroundColor}
      statusBarBackgroundColor={statusBarBackgroundColor}
      dismissKeyboardOnTouch={false}
      keyboardVerticalOffset={tabHeaderKeyboardOffset}
      safeBottom={false}
    >
      <LinearGradient colors={headerGradient as readonly [ColorValue, ColorValue, ...ColorValue[]]} style={[styles.headerWrap, headerStyle]}>{header}</LinearGradient>
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
                tintColor={refreshTintColor}
                colors={[refreshTintColor]}
              />
            ) : undefined
          }
          contentContainerStyle={[contentContainerStyle, { paddingBottom: safeBottom }, onRefresh ? { flexGrow: 1 } : undefined]}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentContainerStyle]}>{children}</View>
      )}
      {floatingContent ? (
        <View
          pointerEvents="box-none"
          style={[styles.floatingWrap, { right: spacing.screenHorizontal, bottom: effectiveTabBarHeight + spacing.sm }]}
        >
          {floatingContent}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerWrap: { paddingHorizontal: spacing.screenHorizontal, minHeight: 48, justifyContent: "center" },
  floatingWrap: { position: "absolute" },
});
