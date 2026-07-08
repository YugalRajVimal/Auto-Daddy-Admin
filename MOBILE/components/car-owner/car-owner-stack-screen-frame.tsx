import { Screen, useToast } from "@/components/reusables";
import { colors, fontSizes, spacing, stackHeaderKeyboardOffset } from "@/constants/autodaddy";
import { androidRefreshScrollProps } from "@/lib/refresh-scroll-props";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions, useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { useCallback } from "react";
import { BackHandler, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  title: string;
  children: ReactNode;
  /** Renders below the title row inside the green header (does not scroll with body). */
  headerExtension?: ReactNode;
  backTo?: string;
  onBack?: () => void;
  right?: ReactNode;
  showBackButton?: boolean;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
  screenKeyboardAvoiding?: boolean;
  /** Pull-to-refresh callback for the inner ScrollView. Only used when `scroll = true`. */
  onRefresh?: () => void;
  /** Spinner state for `onRefresh`. Ignored when `onRefresh` is undefined. */
  refreshing?: boolean;
};

export function CarOwnerStackScreenFrame({
  title,
  children,
  headerExtension,
  backTo,
  onBack,
  right,
  showBackButton = true,
  scroll = true,
  contentContainerStyle,
  bodyStyle,
  keyboardVerticalOffset = stackHeaderKeyboardOffset,
  screenKeyboardAvoiding = false,
  onRefresh,
  refreshing = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ backTo?: string }>();
  const { showToast } = useToast();
  const resolvedBackTo = backTo ?? (typeof params.backTo === "string" ? params.backTo : undefined);

  const goBack = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace((resolvedBackTo ?? "/(car-owner)/(tabs)/home") as never);
  }, [navigation, onBack, resolvedBackTo]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") {
        return undefined;
      }
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        goBack();
        return true;
      });
      return () => sub.remove();
    }, [goBack])
  );

  return (
    <Screen
      backgroundColor={colors.bgProfile}
      statusBarBackgroundColor={colors.successMuted}
      safeTop={false}
      safeBottom={false}
      scroll={false}
      dismissKeyboardOnTouch={false}
      keyboardVerticalOffset={keyboardVerticalOffset}
      keyboardAvoiding={screenKeyboardAvoiding}
    >
      <StatusBar style="dark" backgroundColor={colors.successMuted} />
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, spacing.lg) },
          headerExtension ? styles.headerWithExtension : null,
        ]}
      >
        <View style={styles.headerTopRow}>
          {showBackButton ? (
            <Pressable hitSlop={10} onPress={goBack} style={styles.headerIconBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.successDark} />
            </Pressable>
          ) : (
            <Pressable
              hitSlop={10}
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
              style={styles.headerIconBtn}
            >
              <Ionicons name="menu" size={22} color={colors.successDark} />
            </Pressable>
          )}
          <Text style={styles.headerTitle}>{title}</Text>
          {right ?? (
            <Pressable
              hitSlop={10}
              onPress={() => showToast("Notifications coming soon.", { type: "info" })}
              style={styles.headerIconBtn}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.successDark} />
            </Pressable>
          )}
        </View>
        {headerExtension ? <View style={styles.headerExtension}>{headerExtension}</View> : null}
      </View>
      {scroll ? (
        <ScrollView
          style={[styles.body, bodyStyle]}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          automaticallyAdjustKeyboardInsets
          alwaysBounceVertical={Boolean(onRefresh)}
          {...androidRefreshScrollProps(onRefresh)}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.successDark}
                colors={[colors.successDark]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.body, styles.content, bodyStyle, contentContainerStyle]}>{children}</View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.sm,
    backgroundColor: colors.successMuted,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(22,101,52,0.18)",
  },
  headerTopRow: {
    minHeight: 56,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.18)",
  },
  headerTitle: { flex: 1, textAlign: "center", fontSize: fontSizes.xl, fontWeight: "900", color: colors.successDark },
  headerWithExtension: {
    paddingBottom: spacing.md,
  },
  headerExtension: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  body: { flex: 1, backgroundColor: colors.bgProfile },
  content: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.screenHorizontal,
  },
});
