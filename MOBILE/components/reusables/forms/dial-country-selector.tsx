import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import {
  DIAL_COUNTRY_OPTIONS,
  type DialCountryId,
  getDialCountryOption,
} from "@/lib/dial-countries";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DialCountrySelectorProps = {
  valueId: DialCountryId;
  onChange: (id: DialCountryId) => void;
  disabled?: boolean;
  /** Tighter layout for inline profile rows. */
  compact?: boolean;
  /** Optional width for the trigger (default: compact ? 108 : 120). */
  triggerMinWidth?: number;
  /** `success` matches login green chrome; `neutral` matches profile / forms. */
  variant?: "success" | "neutral";
};

export function DialCountrySelector({
  valueId,
  onChange,
  disabled = false,
  compact = false,
  triggerMinWidth,
  variant = "neutral",
}: DialCountrySelectorProps) {
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const selected = getDialCountryOption(valueId);
  const minW = triggerMinWidth ?? (compact ? 108 : 120);
  const isSuccess = variant === "success";
  const chevronColor = disabled
    ? colors.textLight
    : isSuccess
      ? colors.successDark
      : colors.textMuted;

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <Pressable
        onPress={() => {
          if (!disabled) {
            setOpen(true);
          }
        }}
        disabled={disabled}
        style={({ pressed }) => [
          styles.trigger,
          isSuccess && styles.triggerSuccess,
          !isSuccess && styles.triggerNeutral,
          compact && styles.triggerCompact,
          { minWidth: minW },
          disabled && styles.triggerDisabled,
          pressed && !disabled && styles.triggerPressed,
        ]}
        hitSlop={compact ? 4 : 8}
      >
        <Text style={[styles.triggerFlag, compact && styles.triggerFlagCompact]} numberOfLines={1}>
          {selected.flag}
        </Text>
        <Text style={[styles.triggerCode, compact && styles.triggerCodeCompact]} numberOfLines={1}>
          {selected.callingCode}
        </Text>
        <Ionicons name="chevron-down" size={compact ? 12 : 14} color={chevronColor} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable
            style={[
              styles.sheet,
              {
                maxHeight: Math.min(windowH * 0.55, 360),
                paddingBottom: Math.max(insets.bottom, spacing.md),
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.sheetTitle}>Country / region</Text>
            <FlatList
              data={[...DIAL_COUNTRY_OPTIONS]}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const active = item.id === valueId;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.row,
                      active && styles.rowActive,
                      pressed && styles.rowPressed,
                    ]}
                    onPress={() => {
                      onChange(item.id);
                      close();
                    }}
                  >
                    <Text style={styles.rowFlag}>{item.flag}</Text>
                    <View style={styles.rowMid}>
                      <Text style={styles.rowLabel}>{item.label}</Text>
                      <Text style={styles.rowSub}>{item.callingCode}</Text>
                    </View>
                    {active ? <Ionicons name="checkmark-circle" size={20} color={colors.success} /> : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 1,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  triggerSuccess: {
    backgroundColor: "#E6FFEF",
    borderColor: "rgba(22,101,52,0.16)",
  },
  triggerNeutral: {
    backgroundColor: "#F1F4FA",
    borderColor: "#D9DFEA",
  },
  triggerCompact: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: spacing.xs,
    gap: 2,
  },
  triggerDisabled: {
    opacity: 0.55,
  },
  triggerPressed: {
    opacity: 0.85,
  },
  triggerFlag: { fontSize: fontSizes.md },
  triggerFlagCompact: { fontSize: fontSizes.sm },
  triggerCode: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.text,
    flexShrink: 0,
  },
  triggerCodeCompact: { fontSize: fontSizes.sm },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  sheetTitle: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
  },
  rowActive: {
    backgroundColor: colors.successMuted,
  },
  rowPressed: {
    opacity: 0.88,
  },
  rowFlag: { fontSize: fontSizes.xl },
  rowMid: { flex: 1 },
  rowLabel: { fontSize: fontSizes.md, fontWeight: "700", color: colors.text },
  rowSub: { fontSize: fontSizes.sm, color: colors.textMuted, fontWeight: "600", marginTop: 2 },
});
