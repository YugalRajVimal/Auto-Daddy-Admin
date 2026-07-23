import { ModalKeyboardRoot, useToast } from "@/components/reusables";
import { colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import {
  apiMessageFromEnvelope,
  fetchAutoshopJobCardNextNumber,
  fetchAutoshopJobCardPrefix,
  parseAutoshopJobCardNextNumber,
  parseAutoshopJobCardPrefix,
  updateAutoshopJobCardPrefix,
  updateAutoshopJobCardSeq,
} from "@/lib/autoshopowner-job-cards-api";
import { getAutoShopOwnerProfile } from "@/lib/auth";
import type { AutoShopOwnerProfileResponse } from "@/types/auto-shop-owner-profile";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  authToken: string | null | undefined;
  onClose: () => void;
  onSaved?: (prefix: string) => void;
};

async function resolveBusinessProfileId(): Promise<string> {
  const profile = await getAutoShopOwnerProfile<AutoShopOwnerProfileResponse>();
  const business = profile?.data?.businessProfile as
    | (AutoShopOwnerProfileResponse["data"]["businessProfile"] & { id?: string })
    | null
    | undefined;
  return String(business?._id ?? business?.id ?? "").trim();
}

export function ManageEstimatesModal({ visible, authToken, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [code, setCode] = useState("");
  const [number, setNumber] = useState("1");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSaving(false);
      return;
    }
    if (!authToken) {
      setCode("");
      setNumber("1");
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const [prefixRes, nextRes] = await Promise.all([
          fetchAutoshopJobCardPrefix(authToken),
          fetchAutoshopJobCardNextNumber(authToken),
        ]);
        if (cancelled) return;
        const fromNext = nextRes.ok
          ? parseAutoshopJobCardNextNumber(nextRes.data)
          : { nextNumber: "1", prefix: "" };
        const prefix = prefixRes.ok
          ? parseAutoshopJobCardPrefix(prefixRes.data) || fromNext.prefix
          : fromNext.prefix;
        setCode(prefix);
        setNumber(fromNext.nextNumber || "1");
        if (!prefixRes.ok && !nextRes.ok) {
          showToast("Could not load estimate numbering.", { type: "error" });
        }
      } catch {
        if (!cancelled) showToast("Could not load estimate numbering.", { type: "error" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authToken, showToast, visible]);

  const handleUpdate = async () => {
    if (!authToken) {
      showToast("Sign in to update estimate numbering.", { type: "error" });
      return;
    }
    const trimmedNumber = number.trim();
    if (!trimmedNumber) {
      showToast("Estimate Number is required.", { type: "error" });
      return;
    }
    const newSeq = Number.parseInt(trimmedNumber, 10);
    if (!Number.isInteger(newSeq) || newSeq < 1) {
      showToast("Estimate Number must be a positive whole number.", { type: "error" });
      return;
    }

    setSaving(true);
    try {
      const businessProfileId = await resolveBusinessProfileId();
      if (!businessProfileId) {
        showToast("Business profile not loaded. Try again in a moment.", { type: "error" });
        return;
      }

      const prefix = code.trim();
      const [prefixRes, seqRes] = await Promise.all([
        updateAutoshopJobCardPrefix(authToken, prefix),
        updateAutoshopJobCardSeq(authToken, { businessProfileId, newSeq }),
      ]);

      if (!prefixRes.ok) {
        showToast(apiMessageFromEnvelope(prefixRes.data) || "Could not update estimate code.", {
          type: "error",
        });
        return;
      }
      if (!seqRes.ok) {
        showToast(apiMessageFromEnvelope(seqRes.data) || "Could not update estimate number.", {
          type: "error",
        });
        return;
      }

      showToast("Estimate settings updated.", { type: "success" });
      onSaved?.(prefix);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <ModalKeyboardRoot onBackdropPress={saving ? undefined : onClose} scrimColor="rgba(0,0,0,0.42)">
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.handle} />

          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <Ionicons name="settings-outline" size={20} color={colors.successDark} />
            </View>
            <Text style={styles.title}>Manage Estimate</Text>
            <Pressable
              onPress={onClose}
              disabled={saving}
              style={styles.closeBtn}
              accessibilityLabel="Close manage estimate"
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : (
            <>
              <Text style={styles.fieldLabel}>Estimate Code</Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                editable={!saving}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="e.g. EST"
                placeholderTextColor={colors.textLight}
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>Estimate Number</Text>
              <TextInput
                value={number}
                onChangeText={setNumber}
                editable={!saving}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor={colors.textLight}
                style={styles.input}
              />
            </>
          )}

          <View style={styles.actionsRow}>
            <Pressable
              onPress={onClose}
              disabled={saving}
              style={({ pressed }) => [
                styles.secondaryBtn,
                saving ? styles.btnDisabled : null,
                pressed && !saving ? styles.pressed : null,
              ]}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => void handleUpdate()}
              disabled={saving || loading}
              style={({ pressed }) => [
                styles.primaryBtn,
                saving || loading ? styles.btnDisabled : null,
                pressed && !saving && !loading ? styles.pressed : null,
              ]}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Update</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ModalKeyboardRoot>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    ...shadows.card,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  titleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryMutedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgAlt,
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    fontWeight: "600",
  },
  fieldLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: "600",
    backgroundColor: colors.bgAlt,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  secondaryBtnText: {
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: colors.textMuted,
  },
  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  primaryBtnText: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.white,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.82,
  },
});
