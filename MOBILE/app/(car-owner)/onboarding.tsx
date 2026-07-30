import { CarOwnerProfileField } from "@/components/car-owner/car-owner-profile-field";
import {
  isValidEmail,
  parseUserProfilePayload,
  PROFILE_ADDRESS_MAX_LENGTH,
  PROFILE_NAME_MAX_LENGTH,
  type UserProfileResponse,
} from "@/components/car-owner/car-owner-profile-model";
import { carOwnerProfileStyles as profileStyles } from "@/components/car-owner/car-owner-profile-styles";
import { AppSplash, Screen, useToast } from "@/components/reusables";
import { colors, fontSizes, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useLogoutAction } from "@/hooks/use-logout-action";
import { getJson, putJson } from "@/lib/api";
import {
  formatPincodeDisplay,
  hasCanadianPostalCodeValidationError,
  normalizePostalCodeForStorage,
  PINCODE_DISPLAY_MAX_LENGTH,
  POSTAL_CODE_ERROR_MESSAGE,
} from "@/lib/validation";
import { Redirect, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type CompleteProfileResponse = {
  success?: boolean;
  message?: string;
  user?: {
    name?: string;
    email?: string;
    isProfileComplete?: boolean;
  };
};

function isAlreadyCompletedMessage(message: string | undefined) {
  return (message ?? "").toLowerCase().includes("already completed");
}

export default function CarOwnerOnboarding() {
  const { token, meta, updateSessionMeta } = useAuth();
  const { showToast } = useToast();
  const handleLogout = useLogoutAction();

  const [name, setName] = useState(meta?.name ?? "");
  const [email, setEmail] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    pincode?: string;
    address?: string;
  }>({});

  const finishOnboarding = useCallback(
    async (nextName?: string) => {
      // Match web: set the flag locally — GET /api/user/profile often omits isProfileComplete,
      // so refreshSession alone cannot clear the onboarding gate.
      await updateSessionMeta({
        isProfileComplete: true,
        ...(nextName?.trim() ? { name: nextName.trim() } : {}),
      });
      router.replace("/(car-owner)/(tabs)/home");
    },
    [updateSessionMeta]
  );

  useEffect(() => {
    if (!token) {
      setProfileLoading(false);
      return;
    }
    if (meta?.isProfileComplete === true) {
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      setProfileLoading(true);
      try {
        const res = await getJson<UserProfileResponse>("/api/user/profile", { authToken: token });
        if (cancelled) return;
        const parsed = parseUserProfilePayload(res.data);
        if (!parsed) return;

        const nextName = parsed.name?.trim() ?? "";
        const nextEmail = parsed.email?.trim() ?? "";
        const nextPincode = parsed.pincode?.trim() ?? "";
        const nextAddress = parsed.address?.trim() ?? "";

        if (nextName) setName(nextName);
        if (nextEmail) setEmail(nextEmail);
        if (nextPincode) setPincode(formatPincodeDisplay(nextPincode));
        if (nextAddress) setAddress(nextAddress);

        // Unstick sessions where the backend already completed the profile but local meta is stale.
        const profileFlag = (res.data as UserProfileResponse)?.data?.isProfileComplete;
        const alreadyFilled = Boolean(nextName && nextEmail && nextPincode && nextAddress);
        if (profileFlag === true || alreadyFilled) {
          await finishOnboarding(nextName);
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, meta?.isProfileComplete, finishOnboarding]);

  if (profileLoading) {
    return <AppSplash />;
  }

  if (meta?.isProfileComplete === true) {
    return <Redirect href="/(car-owner)/(tabs)/home" />;
  }

  const clearError = (key: keyof typeof fieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!token) {
      showToast("You are not authenticated. Please log in again.", { type: "error" });
      return;
    }

    const nextName = name.trim().slice(0, PROFILE_NAME_MAX_LENGTH);
    const nextEmail = email.trim();
    const nextPincode = normalizePostalCodeForStorage(pincode);
    const nextAddress = address.trim().slice(0, PROFILE_ADDRESS_MAX_LENGTH);

    const errors: typeof fieldErrors = {};
    if (!nextName) errors.name = "Name is required.";
    if (!nextEmail) errors.email = "Email is required.";
    else if (!isValidEmail(nextEmail)) errors.email = "Enter a valid email address.";
    if (!nextPincode) errors.pincode = "Postal code is required.";
    else if (hasCanadianPostalCodeValidationError(pincode)) errors.pincode = POSTAL_CODE_ERROR_MESSAGE;
    if (!nextAddress) errors.address = "Address is required.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast("Please fix the errors below.", { type: "error" });
      return;
    }
    setFieldErrors({});

    setSaving(true);
    try {
      const res = await putJson<CompleteProfileResponse>(
        "/api/user/complete-profile",
        {
          name: nextName,
          email: nextEmail,
          pincode: nextPincode,
          role: "carowner",
          address: nextAddress,
        },
        { authToken: token }
      );

      const alreadyDone = !res.ok && isAlreadyCompletedMessage(res.data?.message);
      if (!res.ok && !alreadyDone) {
        showToast(res.data?.message ?? "Could not complete profile.", { type: "error" });
        return;
      }

      showToast(
        alreadyDone ? "Profile already completed." : res.data?.message ?? "Profile completed.",
        { type: "success" }
      );
      await finishOnboarding(res.data?.user?.name ?? nextName);
    } catch {
      showToast("Network error while completing profile.", { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      scroll
      backgroundColor={colors.bg}
      contentContainerStyle={styles.content}
      keyboardVerticalOffset={24}
    >
      <View style={styles.hero}>
        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.subtitle}>
          Tell us a bit about yourself to finish setting up your AutoDaddy account.
        </Text>
      </View>

      <View style={profileStyles.card}>
        {saving ? (
          <View style={profileStyles.cardSavingRow}>
            <ActivityIndicator size="small" color={colors.successDark} />
          </View>
        ) : null}

        <CarOwnerProfileField
          label="Full name"
          value={name}
          editable={!saving}
          onChangeText={(t) => {
            setName(t);
            clearError("name");
          }}
          icon="person-outline"
          placeholder="Your name"
          errorText={fieldErrors.name}
          maxLength={PROFILE_NAME_MAX_LENGTH}
          autoCapitalize="words"
        />
        <CarOwnerProfileField
          label="Email"
          value={email}
          editable={!saving}
          onChangeText={(t) => {
            setEmail(t);
            clearError("email");
          }}
          icon="mail-outline"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          errorText={fieldErrors.email}
        />
        <CarOwnerProfileField
          label="Postal code"
          value={pincode}
          editable={!saving}
          onChangeText={(t) => {
            setPincode(formatPincodeDisplay(t));
            clearError("pincode");
          }}
          icon="location-outline"
          placeholder="A1A 1A1"
          autoCapitalize="characters"
          maxLength={PINCODE_DISPLAY_MAX_LENGTH}
          errorText={fieldErrors.pincode}
        />
        <CarOwnerProfileField
          label="Address"
          value={address}
          editable={!saving}
          onChangeText={(t) => {
            setAddress(t);
            clearError("address");
          }}
          icon="home-outline"
          placeholder="Street address"
          maxLength={PROFILE_ADDRESS_MAX_LENGTH}
          errorText={fieldErrors.address}
        />

        <View style={profileStyles.saveActionsRow}>
          <Pressable
            style={[profileStyles.cancelBtn, saving ? styles.btnDisabled : null]}
            onPress={() => void handleLogout()}
            disabled={saving}
          >
            <Text style={profileStyles.cancelBtnText}>Sign out</Text>
          </Pressable>
          <Pressable
            style={[profileStyles.saveBtn, saving ? styles.btnDisabled : null]}
            onPress={() => void handleSubmit()}
            disabled={saving}
          >
            <Text style={profileStyles.saveBtnText}>{saving ? "Saving…" : "Continue"}</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.footerHint}>First-time car owner setup</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  hero: { alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.sm },
  title: {
    ...typography.screenTitle,
    fontSize: fontSizes.xl,
    textAlign: "center",
    color: colors.text,
  },
  subtitle: {
    ...typography.bodyMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  footerHint: {
    ...typography.bodyMuted,
    textAlign: "center",
    fontSize: fontSizes.xs,
    fontWeight: "700",
  },
  btnDisabled: { opacity: 0.55 },
});
