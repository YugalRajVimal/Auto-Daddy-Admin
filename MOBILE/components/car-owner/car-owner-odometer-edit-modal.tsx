import { ModalKeyboardRoot, useToast } from "@/components/reusables";
import { colors, fontSizes, radii, shadows, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import {
  formatOdometerKm,
  odometerVehicleTitle,
  updateCarOwnerOdometerReading,
} from "@/lib/car-owner-odometer";
import type { CarOwnerOdometerReading } from "@/types/car-owner-odometer";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
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

const MAX_ODOMETER_DIGITS = 12;

type Props = {
  visible: boolean;
  reading: CarOwnerOdometerReading | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
};

export function CarOwnerOdometerEditModal({ visible, reading, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { showToast } = useToast();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible && reading) {
      setValue(
        reading.odometerReading != null && Number.isFinite(reading.odometerReading)
          ? String(reading.odometerReading)
          : ""
      );
    } else if (!visible) {
      setValue("");
      setSaving(false);
    }
  }, [reading, visible]);

  useEffect(() => {
    if (!visible || !reading) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, [reading?.vehicleId, visible]);

  const parsed = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }, [value]);

  const current = reading?.odometerReading ?? null;
  const canSave =
    !saving &&
    parsed != null &&
    parsed >= 0 &&
    (current == null || parsed !== current);

  const error =
    parsed != null && current != null && parsed < current
      ? "New reading should not be lower than the current value."
      : null;

  const onSave = async () => {
    if (!reading || !token) return;
    if (parsed == null) {
      showToast("Enter a valid odometer reading.", { type: "error" });
      return;
    }
    setSaving(true);
    const res = await updateCarOwnerOdometerReading(token, reading.vehicleId, parsed);
    const envelopeOk = res.data == null || res.data.success !== false;
    if (!res.ok || !envelopeOk) {
      setSaving(false);
      showToast(res.data?.message ?? "Could not update odometer.", { type: "error" });
      return;
    }
    showToast("Odometer updated.", { type: "success" });
    await onSaved();
    setSaving(false);
    onClose();
  };

  const titleText = reading ? odometerVehicleTitle(reading) : "Update odometer";
  const plate = reading?.licensePlateNo?.trim() ?? "";

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <ModalKeyboardRoot onBackdropPress={saving ? undefined : onClose} scrimColor="rgba(0,0,0,0.42)">
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.handle} />

          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <Ionicons name="speedometer-outline" size={20} color={colors.successDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                Update odometer
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {titleText}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              disabled={saving}
              style={styles.closeBtn}
              accessibilityLabel="Close odometer editor"
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {plate ? (
            <View style={styles.plateChip}>
              <Ionicons name="car-outline" size={14} color={colors.successDark} />
              <Text style={styles.plateChipText} numberOfLines={1}>
                {plate}
              </Text>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Current</Text>
              <Text style={styles.metaValue}>{formatOdometerKm(current)}</Text>
            </View>
            {reading?.dueOdometerReading != null ? (
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Service due</Text>
                <Text style={styles.metaValue}>{formatOdometerKm(reading.dueOdometerReading)}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.fieldLabel}>New odometer reading (km)</Text>
          <View style={[styles.inputWrap, error ? styles.inputWrapError : null]}>
            <Ionicons name="speedometer-outline" size={18} color={colors.successDark} />
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={(t) => setValue(t.replace(/[^\d]/g, ""))}
              placeholder="e.g. 45000"
              placeholderTextColor={colors.textLight}
              keyboardType="number-pad"
              maxLength={MAX_ODOMETER_DIGITS}
              editable={!saving}
              selectTextOnFocus
              style={styles.input}
            />
            <Text style={styles.unit}>km</Text>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actionsRow}>
            <Pressable
              onPress={onClose}
              disabled={saving}
              style={({ pressed }) => [
                styles.secondaryBtn,
                saving ? styles.btnDisabled : null,
                pressed && !saving ? styles.pressed : null,
              ]}
              android_ripple={{ color: "rgba(22,101,52,0.08)" }}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              disabled={!canSave}
              style={({ pressed }) => [
                styles.primaryBtn,
                !canSave ? styles.btnDisabled : null,
                pressed && canSave ? styles.pressed : null,
              ]}
              android_ripple={{ color: "rgba(255,255,255,0.18)" }}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.white} />
                  <Text style={styles.primaryBtnText}>Save</Text>
                </>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.md,
    ...shadows.card,
  },
  handle: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.trackBg,
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: colors.successMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: fontSizes.lg, fontWeight: "900", color: colors.text },
  subtitle: { marginTop: 2, ...typography.bodyMuted, fontSize: fontSizes.sm, fontWeight: "700" },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgAlt,
  },
  plateChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.round,
    backgroundColor: colors.successMuted,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.18)",
  },
  plateChipText: {
    fontSize: fontSizes.xs,
    fontWeight: "900",
    color: colors.successDark,
    letterSpacing: 0.4,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  metaCol: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: "#F8FBFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaLabel: {
    fontSize: fontSizes.xs,
    fontWeight: "900",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    marginTop: 4,
    fontSize: fontSizes.md,
    fontWeight: "900",
    color: colors.text,
  },
  fieldLabel: {
    fontSize: fontSizes.xs,
    fontWeight: "900",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrap: {
    borderWidth: 2,
    borderColor: 'red',
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  inputWrapError: { borderColor: colors.danger },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.text,
  },
  unit: {
    fontSize: fontSizes.sm,
    fontWeight: "900",
    color: colors.textMuted,
  },
  errorText: {
    marginTop: -spacing.sm,
    fontSize: fontSizes.xs,
    fontWeight: "800",
    color: colors.danger,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.successMuted,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.18)",
  },
  secondaryBtnText: {
    color: colors.successDark,
    fontSize: fontSizes.sm,
    fontWeight: "900",
  },
  primaryBtn: {
    flex: 1.2,
    minHeight: 46,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.successDark,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: fontSizes.sm,
    fontWeight: "900",
  },
  btnDisabled: { opacity: 0.55 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
});
