import { colors, shadows, spacing, stackHeaderKeyboardOffset } from "@/constants/autodaddy";
import { useOncePress } from "@/hooks/use-once-press";
import { androidRefreshScrollProps } from "@/lib/refresh-scroll-props";
import { navigateBackTarget, SHOP_OWNER_HOME } from "@/lib/shop-owner-navigation";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import type { ReactNode } from "react";
import { BackHandler, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { GradientPageHeader } from "./gradient-page-header";
import { Screen } from "./screen";

type Props = {
  title: string;
  children: ReactNode;
  backgroundColor?: string;
  headerGradient?: readonly string[];
  right?: ReactNode;
  showBackButton?: boolean;
  scroll?: boolean;
  keyboardVerticalOffset?: number;
  /** When false, Screen does not wrap in KeyboardAvoidingView (use an inner KAV on long forms). */
  screenKeyboardAvoiding?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  /** Optional floating UI (FAB, sticky CTA) positioned above the bottom safe area. */
  floatingContent?: ReactNode;
  /** Pull-to-refresh callback for the inner ScrollView. Only used when `scroll = true`. */
  onRefresh?: () => void;
  /** Spinner state for `onRefresh`. Ignored when `onRefresh` is undefined. */
  refreshing?: boolean;
  titleColor?: string;
  titleAlign?: "left" | "center";
  /** White circular back button (e.g. green job-card header). */
  headerNavCircle?: boolean;
};

type BackAwareProps = Props & { backTo?: string };

export function StackScreenFrame({
  title,
  children,
  backgroundColor = colors.bg,
  headerGradient = [colors.tabBarBg, colors.tabBarBg, colors.tabBarBg],
  right,
  showBackButton = true,
  scroll = true,
  keyboardVerticalOffset = stackHeaderKeyboardOffset,
  screenKeyboardAvoiding = true,
  contentContainerStyle,
  bodyStyle,
  floatingContent,
  onRefresh,
  refreshing = false,
  titleColor,
  titleAlign,
  headerNavCircle = false,
  backTo,
}: BackAwareProps) {
  const params = useLocalSearchParams<{ backTo?: string }>();
  const resolvedBackTo = backTo ?? (typeof params.backTo === "string" ? params.backTo : undefined);
  const insets = useSafeAreaInsets();

  const handleBackPress = useOncePress(() => {
    navigateBackTarget(resolvedBackTo, SHOP_OWNER_HOME);
  });

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") {
        return undefined;
      }
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        handleBackPress?.();
        return true;
      });
      return () => sub.remove();
    }, [handleBackPress])
  );

  return (
    <Screen
      backgroundColor={backgroundColor}
      dismissKeyboardOnTouch={false}
      keyboardVerticalOffset={keyboardVerticalOffset}
      keyboardAvoiding={screenKeyboardAvoiding}
    >
      <GradientPageHeader
        gradient={headerGradient}
        title={title}
        titleColor={titleColor}
        titleAlign={titleAlign}
        left={
          showBackButton ? (
            <Pressable
              style={headerNavCircle ? styles.navBtnCircle : styles.navBtn}
              onPress={() => handleBackPress?.()}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={headerNavCircle ? colors.successDark : colors.text}
              />
            </Pressable>
          ) : (
            <View style={styles.sideSpacer} />
          )
        }
        right={right ?? <View style={styles.sideSpacer} />}
      />
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          alwaysBounceVertical={Boolean(onRefresh)}
          {...androidRefreshScrollProps(onRefresh)}
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
          style={[styles.flex, bodyStyle]}
          contentContainerStyle={contentContainerStyle}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, bodyStyle]}>{children}</View>
      )}
      {floatingContent ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.floatingWrap,
            {
              right: spacing.screenHorizontal,
              // On Android, the system nav bar can cover the very bottom; keep the FAB above it.
              bottom: (Platform.OS === "android" ? insets.bottom : 0) + spacing.sm,
            },
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
  navBtn: { width: 40, padding: spacing.xs },
  navBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  sideSpacer: { width: 40 },
  floatingWrap: { position: "absolute" },
});
