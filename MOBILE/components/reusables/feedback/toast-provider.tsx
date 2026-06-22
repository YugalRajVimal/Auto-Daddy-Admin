import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View, type TextStyle, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, shadows, spacing } from "@/constants/autodaddy";

type ToastType = "success" | "error" | "info";
type ToastOptions = { type?: ToastType; durationMs?: number };
type ToastPayload = { message: string; type: ToastType; durationMs: number };
type ToastContextType = { showToast: (message: string, options?: ToastOptions) => void };
const ToastContext = createContext<ToastContextType | null>(null);
const DEFAULT_TOAST_DURATION_MS = 2200;
const TOAST_MAX_LINES = 3;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearHideTimer = useCallback(() => { if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; } }, []);
  const hideToast = useCallback(() => {
    clearHideTimer();
    Animated.parallel([Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }), Animated.timing(translateY, { toValue: -8, duration: 180, useNativeDriver: true })]).start(() => setToast(null));
  }, [clearHideTimer, opacity, translateY]);
  const showToast = useCallback((message: string, options?: ToastOptions) => {
    clearHideTimer();
    const nextToast: ToastPayload = { message, type: options?.type ?? "info", durationMs: options?.durationMs ?? DEFAULT_TOAST_DURATION_MS };
    setToast(nextToast);
    opacity.setValue(0);
    translateY.setValue(-8);
    Animated.parallel([Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }), Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true })]).start();
    hideTimer.current = setTimeout(hideToast, nextToast.durationMs);
  }, [clearHideTimer, hideToast, opacity, translateY]);
  useEffect(() => () => clearHideTimer(), [clearHideTimer]);
  const contextValue = useMemo<ToastContextType>(() => ({ showToast }), [showToast]);
  const toneStyle = toast ? stylesByType[toast.type] : stylesByType.info;

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={styles.overlay}>
          <Animated.View
            style={[
              styles.toast,
              toneStyle.container,
              { marginTop: insets.top + spacing.sm, opacity, transform: [{ translateY }] },
            ]}
          >
            <Text
              numberOfLines={TOAST_MAX_LINES}
              ellipsizeMode="tail"
              style={[styles.message, toneStyle.text]}
            >
              {toast.message}
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

const stylesByType: Record<ToastType, { container: ViewStyle; text: TextStyle }> = {
  success: { container: { backgroundColor: colors.successMuted, borderColor: colors.success }, text: { color: colors.successDark } },
  error: { container: { backgroundColor: colors.dangerMuted, borderColor: colors.danger }, text: { color: colors.danger } },
  info: { container: { backgroundColor: colors.primaryMutedBg, borderColor: colors.primary }, text: { color: colors.primaryDark } },
};
const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, alignItems: "center", paddingHorizontal: spacing.screenHorizontal, zIndex: 1000 },
  toast: { width: "100%", borderRadius: radii.xl, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, ...shadows.soft },
  message: { fontSize: 14, fontWeight: "700", textAlign: "center" },
});
