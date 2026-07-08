import { DialCountrySelector } from "@/components/reusables/forms/dial-country-selector";
import { NetworkStatusStrip, Screen, useToast } from "@/components/reusables";
import { associateColors } from "@/constants/associate-theme";
import {
  colors,
  fontSizes,
  radii,
  shadows,
  spacing,
  typography,
} from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useNetworkConnectivity } from "@/hooks/use-network-connectivity";
import { useKeyboardBottomInset } from "@/hooks/use-keyboard-bottom-inset";
import { useOncePress } from "@/hooks/use-once-press";
import { OFFLINE_TOAST_MESSAGE } from "@/lib/network-connectivity";
import { getPostAuthRoute } from "@/lib/auth";
import {
  defaultDialCountryId,
  type DialCountryId,
  getDialCountryOption,
} from "@/lib/dial-countries";
import {
  digitsFromNationalPhoneDisplay,
  formatNationalPhoneDisplay,
  nationalPhoneDisplayFromKeystrokes,
  NATIONAL_PHONE_DISPLAY_MAX_LENGTH,
} from "@/lib/national-phone-format";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  type ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputKeyPressEventData,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OTP_LENGTH = 6;

export default function LoginPage() {
  const { sendOtp, verifyOtp, refreshSession, enterDevAssociateSession } = useAuth();
  const { showToast } = useToast();
  const { isOffline } = useNetworkConnectivity();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dialCountryId, setDialCountryId] = useState<DialCountryId>(defaultDialCountryId());
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(Array.from({ length: OTP_LENGTH }, () => ""));
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [loadingReason, setLoadingReason] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const keyboardBottom = useKeyboardBottomInset();
  const keyboardOpen = keyboardBottom > 0;

  const dialOption = useMemo(() => getDialCountryOption(dialCountryId), [dialCountryId]);

  const handleEnterAsAssociate = useOncePress(async () => {
    try {
      await enterDevAssociateSession();
      router.replace("/(associate)/(tabs)/home");
    } catch {
      showToast("Could not start associate preview.", { type: "error" });
    }
  });

  const handlePhoneChange = useCallback((next: string) => {
    setPhoneNumber(nationalPhoneDisplayFromKeystrokes(next));
  }, []);

  const resetLogin = useCallback(() => {
    setPhoneNumber("");
    setDialCountryId(defaultDialCountryId());
    setOtpSent(false);
    setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
    setSendingOtp(false);
    setResendingOtp(false);
    setVerifyingOtp(false);
    setLoadingReason(null);
    setOtpError(null);
    otpRefs.current = [];
  }, []);

  // Login screen can stay mounted; always reset when opened (eg. after logout).
  useFocusEffect(
    useCallback(() => {
      resetLogin();
      return undefined;
    }, [resetLogin])
  );

  const isValidPhone = useMemo(() => {
    const digits = digitsFromNationalPhoneDisplay(phoneNumber);
    if (!digits) {
      return false;
    }
    // App-wide expectation is a 10-digit national number (displayed as `xxx xxx xxxx`).
    // Do not rely on libphonenumber validation here because some regions can treat shorter
    // national numbers as "valid", which enables the CTA too early.
    return digits.length === 10;
  }, [phoneNumber]);
  const isValidOtp = useMemo(() => otp.every((digit) => digit.length === 1), [otp]);

  const handleContinue = useOncePress(async () => {
    if (!isValidPhone) {
      return;
    }
    if (isOffline) {
      showToast(OFFLINE_TOAST_MESSAGE, { type: "error" });
      return;
    }

    setSendingOtp(true);
    setOtpError(null);

    try {
      const response = await sendOtp(phoneNumber, dialOption.callingCode);
      const payload = response.data;
      console.log("sign-up-log-in response:", payload);

      if (!response.ok) {
        const errorMessage =
          typeof payload?.message === "string"
            ? payload.message
            : "Failed to send OTP. Please try again.";
        setOtpError(errorMessage);
        showToast(errorMessage, { type: "error" });
        return;
      }

      if (typeof payload?.message === "string" && payload.message.length > 0) {
        showToast(payload.message, { type: "success" });
      } else {
        showToast("OTP sent successfully.", { type: "success" });
      }
      setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
      setOtpSent(true);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("[login] sendOtp failed", e);
      const isTimeout =
        typeof e === "object" &&
        e != null &&
        "name" in e &&
        (e as { name?: unknown }).name === "AbortError";
      const message = isTimeout
        ? "Request timed out while sending OTP. Please try again."
        : "Network error while sending OTP. Please try again.";
      setOtpError(message);
      showToast(message, { type: "error" });
    } finally {
      setSendingOtp(false);
    }
  });

  const handleVerifyOtp = useOncePress(async () => {
    if (!isValidOtp) {
      return;
    }
    if (isOffline) {
      showToast(OFFLINE_TOAST_MESSAGE, { type: "error" });
      return;
    }

    setVerifyingOtp(true);
    setOtpError(null);
    setLoadingReason("Verifying OTP");

    try {
      const response = await verifyOtp(phoneNumber, dialOption.callingCode, otp.join(""));
      const payload = response.data;

      console.log("verify-otp response:", payload);

      if (!response.ok) {
        const errorMessage =
          typeof payload?.message === "string"
            ? payload.message
            : "OTP verification failed. Please try again.";
        setOtpError(errorMessage);
        showToast(errorMessage, { type: "error" });
        return;
      }

      // Ensure downstream screens have the latest profile/dashboard cached before navigation.
      try {
        let invalidSessionMessage: string | null = null;
        await refreshSession({
          onProgress: (label) => setLoadingReason(label),
          onInvalidSession: (message) => {
            if (typeof message === "string" && message.trim().length > 0) {
              invalidSessionMessage = message;
            }
          },
        });

        if (invalidSessionMessage) {
          setOtpError(invalidSessionMessage);
          showToast(invalidSessionMessage, { type: "error" });
          return;
        }
      } catch {
        // If refresh fails, continue with minimal meta from verifyOtp.
      }

      const successMessage =
        typeof payload?.message === "string" && payload.message.length > 0
          ? payload.message
          : "Account verified successfully";

      showToast(successMessage, { type: "success" });

      const nextRoute = getPostAuthRoute({
        isProfileComplete: payload?.isProfileComplete ?? null,
        isAutoShopBusinessProfileComplete: payload?.isAutoShopBusinessProfileComplete ?? null,
        role: payload?.role ?? null,
      });

      router.replace(nextRoute);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("[login] verifyOtp failed", e);
      const isTimeout =
        typeof e === "object" &&
        e != null &&
        "name" in e &&
        (e as { name?: unknown }).name === "AbortError";
      const message = isTimeout
        ? "Request timed out while verifying OTP. Please try again."
        : "Network error while verifying OTP. Please try again.";
      setOtpError(message);
      showToast(message, { type: "error" });
    } finally {
      setVerifyingOtp(false);
      setLoadingReason(null);
    }
  });

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyPress(index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  const otpInfoDigits = digitsFromNationalPhoneDisplay(phoneNumber);
  const otpInfoNational = formatNationalPhoneDisplay(otpInfoDigits);

  const scrollToForm = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const handleResendOtp = useOncePress(async () => {
    if (!isValidPhone || resendingOtp || sendingOtp) {
      return;
    }
    if (isOffline) {
      showToast(OFFLINE_TOAST_MESSAGE, { type: "error" });
      return;
    }
    setResendingOtp(true);
    setOtpError(null);
    try {
      const response = await sendOtp(phoneNumber, dialOption.callingCode);
      const payload = response.data;
      if (!response.ok) {
        const errorMessage =
          typeof payload?.message === "string"
            ? payload.message
            : "Failed to resend OTP. Please try again.";
        setOtpError(errorMessage);
        showToast(errorMessage, { type: "error" });
        return;
      }
      const msg =
        typeof payload?.message === "string" && payload.message.length > 0
          ? payload.message
          : "OTP resent successfully.";
      showToast(msg, { type: "success" });
      setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
      otpRefs.current[0]?.focus();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("[login] resendOtp failed", e);
      const isTimeout =
        typeof e === "object" &&
        e != null &&
        "name" in e &&
        (e as { name?: unknown }).name === "AbortError";
      const message = isTimeout
        ? "Request timed out while resending OTP. Please try again."
        : "Network error while resending OTP. Please try again.";
      setOtpError(message);
      showToast(message, { type: "error" });
    } finally {
      setResendingOtp(false);
    }
  });

  const contentContainerStyle = useMemo(
    () => [
      styles.content,
      keyboardOpen ? styles.contentWithKeyboard : null,
      {
        paddingBottom:
          spacing.xl +
          Math.max(insets.bottom, spacing.md) +
          keyboardBottom +
          (Platform.OS === "android" ? 24 : 16),
      },
    ],
    [insets.bottom, keyboardBottom, keyboardOpen]
  );

  return (
    <Screen
      backgroundColor={colors.successMuted}
      statusBarBackgroundColor={colors.successMuted}
      scroll
      scrollRef={scrollRef}
      adjustKeyboardInsets={false}
      keyboardAvoiding={false}
      contentContainerStyle={contentContainerStyle}
    >
      <View style={styles.logoWrap}>
        <Image source={require("../assets/images/logo-rectangle.png")} style={styles.logoStandalone} />
      </View>

      <View style={styles.panel}>
        <NetworkStatusStrip style={styles.networkStrip} />
        <Text style={styles.heroTitle}>{otpSent ? "Verify OTP" : "Login"}</Text>
        <Text style={styles.heroSubtitle}>
          {otpSent
            ? "Enter the 6-digit OTP sent to your mobile number"
            : "Sign in with your mobile number to continue"}
        </Text>

        {otpSent ? (
          <>
            <View style={styles.infoPill}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.successDark} />
              <Text style={styles.infoPillText}>
                Code sent to {dialOption.callingCode} {otpInfoNational}
              </Text>
            </View>

            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    otpRefs.current[index] = ref;
                  }}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(index, value)}
                  onKeyPress={(e) => handleOtpKeyPress(index, e)}
                  onFocus={scrollToForm}
                  style={[styles.otpInput, digit ? styles.otpInputFilled : undefined]}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                />
              ))}
            </View>

            <Pressable
              style={[styles.ctaButton, (!isValidOtp || verifyingOtp) && styles.ctaButtonDisabled]}
              onPress={() => void handleVerifyOtp?.()}
              disabled={!isValidOtp || verifyingOtp}
            >
              <View style={styles.ctaInner}>
                {verifyingOtp ? <ActivityIndicator color={colors.white} /> : null}
                <Text style={styles.ctaLabel}>{verifyingOtp ? "Verifying..." : "Verify OTP"}</Text>
              </View>
            </Pressable>
            {verifyingOtp && loadingReason ? (
              <Text style={styles.loadingReasonText}>{loadingReason}</Text>
            ) : null}
            {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

            <Pressable
              onPress={() => void handleResendOtp?.()}
              style={[styles.linkWrap, (resendingOtp || sendingOtp) && styles.linkWrapDisabled]}
              disabled={resendingOtp || sendingOtp}
            >
              <Text style={styles.linkText}>{resendingOtp ? "Resending..." : "Resend OTP"}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputRow}>
              <DialCountrySelector
                valueId={dialCountryId}
                onChange={setDialCountryId}
                variant="success"
              />
              <View style={styles.separator} />
              <TextInput
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                onFocus={scrollToForm}
                style={styles.input}
                placeholder="781 708 9765"
                placeholderTextColor={colors.textLight}
                keyboardType="number-pad"
                maxLength={NATIONAL_PHONE_DISPLAY_MAX_LENGTH}
              />
            </View>

            <Pressable
              style={[styles.ctaButton, (!isValidPhone || sendingOtp) && styles.ctaButtonDisabled]}
              onPress={() => void handleContinue?.()}
              disabled={!isValidPhone || sendingOtp}
            >
              <View style={styles.ctaInner}>
                {sendingOtp ? <ActivityIndicator color={colors.white} /> : null}
                <Text style={styles.ctaLabel}>{sendingOtp ? "Sending..." : "Get OTP"}</Text>
              </View>
            </Pressable>
            {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
          </>
        )}
      </View>

      {otpSent ? (
        <Pressable onPress={() => setOtpSent(false)} style={styles.backWrap}>
          <Ionicons name="arrow-back" size={16} color={colors.successDark} />
          <Text style={styles.backText}>Back to number entry</Text>
        </Pressable>
      ) : (
        <>
          <Pressable style={styles.devAssociateBtn} onPress={() => void handleEnterAsAssociate?.()}>
            <Ionicons name="briefcase-outline" size={18} color={associateColors.primaryDark} />
            <Text style={styles.devAssociateLabel}>Enter as Business Associate (preview)</Text>
          </Pressable>
          <Text style={styles.termsText}>
            By continuing, you agree to our Terms and Privacy Policy
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.xl,
    justifyContent: "center",
  },
  contentWithKeyboard: {
    justifyContent: "flex-start",
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  logoStandalone: {
    width: "100%",
    height: 60,
    resizeMode: "contain",
  },
  panel: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    ...shadows.card,
  },
  networkStrip: {
    marginBottom: spacing.sm,
  },
  heroTitle: {
    ...typography.heroTitle,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.bodyMuted,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  inputRow: {
    minHeight: 48,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.16)",
    backgroundColor: "#F4FBF6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(22,101,52,0.16)",
    marginHorizontal: 6,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.xl,
    color: colors.text,
    paddingVertical: 0,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.round,
    marginBottom: spacing.lg,
    alignSelf: "flex-start",
  },
  infoPillText: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.successDark,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  otpInput: {
    flex: 1,
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.16)",
    backgroundColor: "#F4FBF6",
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: "700",
  },
  otpInputFilled: {
    borderColor: colors.success,
    backgroundColor: colors.successMuted,
  },
  ctaButton: {
    marginTop: spacing.sm,
    minHeight: 44,
    borderRadius: radii.round,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  ctaButtonDisabled: {
    opacity: 0.45,
  },
  ctaLabel: {
    color: colors.white,
    fontSize: fontSizes.lg,
    fontWeight: "700",
  },
  loadingReasonText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    textAlign: "center",
  },
  devAssociateBtn: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.round,
    borderWidth: 1,
    borderColor: associateColors.tabBarBorder,
    backgroundColor: associateColors.primaryMutedBg,
  },
  devAssociateLabel: {
    color: associateColors.primaryDark,
    fontSize: fontSizes.md,
    fontWeight: "700",
  },
  termsText: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  linkWrap: {
    alignItems: "center",
    marginTop: spacing.md,
  },
  linkWrapDisabled: {
    opacity: 0.55,
  },
  linkText: {
    color: colors.successDark,
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
  backWrap: {
    marginTop: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  backText: {
    color: colors.successDark,
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
  errorText: {
    marginTop: spacing.sm,
    color: colors.danger,
    fontSize: fontSizes.sm,
    textAlign: "center",
  },
});
