import { ModalKeyboardRoot, useToast } from "@/components/reusables";
import { colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import {
  fetchInvoicePrefix,
  parseInvoicePrefix,
  updateInvoicePrefix,
} from "@/lib/autoshopowner-api";
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
};

export function ManageInvoicesModal({ visible, authToken, onClose }: Props) {
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
    void fetchInvoicePrefix(authToken)
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          showToast("Could not load invoice prefix.", { type: "error" });
          return;
        }
        const { prefix } = parseInvoicePrefix(res.data);
        setCode(prefix);
      })
      .catch(() => {
        if (!cancelled) showToast("Could not load invoice prefix.", { type: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authToken, showToast, visible]);

  const handleUpdate = async () => {
    if (!authToken) {
      showToast("Sign in to update invoice prefix.", { type: "error" });
      return;
    }
    const trimmedNumber = number.trim();
    if (!trimmedNumber) {
      showToast("Invoice Number is required.", { type: "error" });
      return;
    }

    setSaving(true);
    try {
      const res = await updateInvoicePrefix(authToken, code.trim());
      if (!res.ok) {
        const message =
          res.data && typeof res.data === "object" && "message" in res.data
            ? String((res.data as { message?: string }).message ?? "")
            : "";
        showToast(message || "Could not update invoice prefix.", { type: "error" });
        return;
      }
      showToast("Invoice settings updated.", { type: "success" });
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
            <Text style={styles.title}>Manage Invoice</Text>
            <Pressable
              onPress={onClose}
              disabled={saving}
              style={styles.closeBtn}
              accessibilityLabel="Close manage invoice"
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
              <Text style={styles.fieldLabel}>Invoice Code</Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                editable={!saving}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="e.g. INV"
                placeholderTextColor={colors.textLight}
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>Invoice Number</Text>
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
