import type { ReactNode } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";
import { useKeyboardBottomInset } from "@/hooks/use-keyboard-bottom-inset";
import { useEffect, useMemo } from "react";
import { BackHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "@/constants/autodaddy";

type Props = {
  children: ReactNode;
  onBackdropPress?: () => void;
  /** Scrim tint; keep alpha so touches pass planning is only on Pressable. */
  scrimColor?: string;
};

/**
 * Full-screen transparent modal body: absolute scrim + keyboard-safe bottom-aligned content.
 * Keeps `KeyboardAvoidingView` from competing with an `absoluteFill` scrim (fixes Android + iOS sheets).
 */
export function ModalKeyboardRoot({ children, onBackdropPress, scrimColor = "rgba(0,0,0,0.4)" }: Props) {
  const keyboardBottom = useKeyboardBottomInset();
  const keyboardOpen = keyboardBottom > 0;
  const insets = useSafeAreaInsets();

  const dismiss = useMemo(() => {
    if (!onBackdropPress) {
      return undefined;
    }
    return () => {
      // Avoid modal "glitch" when closing while an input is focused:
      // Always attempt to dismiss keyboard first (keyboardOpen can lag on Android),
      // then close the modal on the next tick.
      Keyboard.dismiss();
      setTimeout(() => onBackdropPress(), 120);
    };
  }, [onBackdropPress]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      // If a modal is open and the keyboard is visible, closing the keyboard without
      // closing the modal can create a "bounce" loop with Android back gestures.
      // Always dismiss the keyboard first; if we can dismiss the modal, do it next.
      if (dismiss) {
        Keyboard.dismiss();
        setTimeout(() => dismiss(), 120);
        return true;
      }
      if (keyboardOpen) {
        Keyboard.dismiss();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [dismiss, keyboardOpen]);

  const safePad = {
    paddingTop: insets.top + spacing.md,
    paddingBottom: insets.bottom + spacing.md,
    paddingLeft: spacing.screenHorizontal,
    paddingRight: spacing.screenHorizontal,
  } as const;
  return (
    <View style={styles.root} pointerEvents="box-none">
      {dismiss ? (
        <Pressable
          style={[styles.scrim, { backgroundColor: scrimColor }]}
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />
      ) : null}
      {Platform.OS === "ios" ? (
        <KeyboardAvoidingView
          style={styles.avoider}
          behavior="padding"
          keyboardVerticalOffset={0}
        >
          <View style={[styles.bottomAlign, safePad]} pointerEvents="box-none">
            {children}
          </View>
        </KeyboardAvoidingView>
      ) : (
        // On Android, KeyboardAvoidingView ("height") + bottom sheets + scroll views can cause
        // a visible up/down "jitter" loop while the keyboard is open. Instead, pad content by
        // the keyboard height and let the sheet layout remain stable.
        <View style={[styles.bottomAlign, safePad, { paddingBottom: safePad.paddingBottom + keyboardBottom }]} pointerEvents="box-none">
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrim: { ...StyleSheet.absoluteFillObject },
  avoider: { flex: 1 },
  bottomAlign: { flex: 1, justifyContent: "flex-end" },
});
