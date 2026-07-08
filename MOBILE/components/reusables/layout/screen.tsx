import type { ReactNode, RefObject } from "react";
import { StatusBar } from "expo-status-bar";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleProp, StyleSheet, TouchableWithoutFeedback, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/autodaddy";

const APP_STATUS_BAR_BG = colors.tabBarBg;
type Props = {
  children: ReactNode;
  backgroundColor?: string;
  /** Background color used behind the system status bar safe area (and Android status bar). */
  statusBarBackgroundColor?: string;
  safeTop?: boolean;
  safeBottom?: boolean;
  scroll?: boolean;
  scrollStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
  dismissKeyboardOnTouch?: boolean;
  /** When false, children are not wrapped in KeyboardAvoidingView (use an inner KAV around the form). */
  keyboardAvoiding?: boolean;
  /** Pass-through for ScrollView when `scroll` is true. */
  scrollRef?: RefObject<ScrollView | null>;
  /** When false, use manual keyboard padding instead of `automaticallyAdjustKeyboardInsets`. */
  adjustKeyboardInsets?: boolean;
};

export function Screen({
  children,
  backgroundColor = colors.bg,
  statusBarBackgroundColor = APP_STATUS_BAR_BG,
  safeTop = true,
  safeBottom = true,
  scroll = false,
  scrollStyle,
  contentContainerStyle,
  keyboardVerticalOffset = 0,
  dismissKeyboardOnTouch = true,
  keyboardAvoiding = true,
  scrollRef,
  adjustKeyboardInsets = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const body = (
    <>
      {dismissKeyboardOnTouch ? (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          {scroll ? (
            <ScrollView
              ref={scrollRef}
              style={[styles.flex, scrollStyle]}
              contentContainerStyle={contentContainerStyle}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              automaticallyAdjustKeyboardInsets={adjustKeyboardInsets}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.flex}>{children}</View>
          )}
        </TouchableWithoutFeedback>
      ) : scroll ? (
        <ScrollView
          ref={scrollRef}
          style={[styles.flex, scrollStyle]}
          contentContainerStyle={contentContainerStyle}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          automaticallyAdjustKeyboardInsets={adjustKeyboardInsets}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{children}</View>
      )}
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <StatusBar style="dark" translucent={false} backgroundColor={statusBarBackgroundColor} />
      {/* iOS status bar area sits outside layout flow; paint behind it to avoid a "cut" header. */}
      {safeTop && Platform.OS === "ios" ? (
        <View
          pointerEvents="none"
          style={[styles.iosStatusBarBg, { height: insets.top, backgroundColor: statusBarBackgroundColor }]}
        />
      ) : null}
      {safeTop ? <View style={{ height: insets.top, backgroundColor: statusBarBackgroundColor }} /> : null}
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
      {safeBottom ? <View style={{ height: insets.bottom, backgroundColor }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  iosStatusBarBg: { position: "absolute", top: 0, left: 0, right: 0 },
});
