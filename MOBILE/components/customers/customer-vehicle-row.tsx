import { SquareIconButton } from "@/components/reusables";
import { cardFontSizes, colors, radii, spacing } from "@/constants/autodaddy";
import type { CustomerVehicle } from "@/types/auto-shop-owner-endpoints";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

function formatVehicleLine(v: CustomerVehicle) {
  const parts = [v.vehicleName, v.model, v.licensePlateNo, v.year].filter(Boolean);
  return parts.join(" | ") || "Vehicle";
}

export type CustomerVehicleRowProps = {
  vehicle: CustomerVehicle;
  showActions?: boolean;
  canRemove?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
  /** Compact green action used on job-card customer pickers. */
  onCreateJobCard?: () => void;
};

export function CustomerVehicleRow({
  vehicle,
  showActions = false,
  canRemove = true,
  onEdit,
  onRemove,
  onCreateJobCard,
}: CustomerVehicleRowProps) {
  const isDisabled = Boolean(vehicle.disabled);
  return (
    <View style={[styles.wrap, isDisabled && styles.wrapDisabled]}>
      <View style={styles.mainRow}>
        <Ionicons name="car-outline" size={18} color={isDisabled ? colors.textLight : colors.textMuted} />
        <View style={styles.textBlock}>
          <Text style={[styles.line, isDisabled && styles.lineDisabled]} numberOfLines={2}>
            {formatVehicleLine(vehicle)}
          </Text>
          {isDisabled ? (
            <View style={styles.disabledBadge}>
              <Ionicons name="ban-outline" size={12} color={colors.danger} />
              <Text style={styles.disabledBadgeText}>Disabled</Text>
            </View>
          ) : null}
          {(vehicle.vinNo ?? "").trim() ? (
            <Text style={[styles.meta, isDisabled && styles.metaDisabled]} numberOfLines={1}>
              VIN: {vehicle.vinNo}
            </Text>
          ) : null}
          {(vehicle.odometerReading ?? "").trim() ? (
            <Text style={[styles.meta, isDisabled && styles.metaDisabled]} numberOfLines={1}>
              Odometer: {vehicle.odometerReading}
            </Text>
          ) : null}
          <Text style={[styles.meta, isDisabled && styles.metaDisabled]} numberOfLines={1}>
            Due odometer: {(vehicle.dueOdometerReading ?? "").trim() || "—"}
          </Text>
        </View>
        {onCreateJobCard ? (
          <Pressable
            style={[styles.createJobCardBtn, isDisabled && styles.createJobCardBtnDisabled]}
            onPress={onCreateJobCard}
            accessibilityRole="button"
            accessibilityLabel="Create job card"
          >
            <Ionicons name="add" size={20} color={colors.white} />
            <Text style={styles.createJobCardBtnText}>Create</Text>
            <Text style={styles.createJobCardBtnText}>Job Card</Text>
          </Pressable>
        ) : showActions ? (
          <View style={styles.actions}>
            {onEdit && !isDisabled ? <SquareIconButton name="create-outline" tone="primary" onPress={onEdit} /> : null}
            {onRemove && canRemove ? <SquareIconButton name="trash-outline" tone="danger" onPress={onRemove} /> : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: "#EEF2FF",
    backgroundColor: "#FAFBFF",
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  wrapDisabled: {
    backgroundColor: "#F4F4F5",
    borderColor: "#E4E4E7",
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  textBlock: { flex: 1, minWidth: 0 },
  line: { fontSize: cardFontSizes.sm, color: colors.text, fontWeight: "600" },
  lineDisabled: { color: colors.textLight, fontWeight: "500" },
  disabledBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.round,
    backgroundColor: colors.dangerMuted,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
  },
  disabledBadgeText: {
    fontSize: cardFontSizes.xs,
    fontWeight: "800",
    color: colors.danger,
  },
  meta: { fontSize: cardFontSizes.xs, color: colors.textMuted, marginTop: 2 },
  metaDisabled: { color: colors.textLight },
  actions: { flexDirection: "row", gap: spacing.xs, alignItems: "center", paddingLeft: spacing.xs },
  createJobCardBtn: {
    width: 58,
    minHeight: 58,
    borderRadius: 29,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    paddingHorizontal: 4,
    marginLeft: spacing.xs,
    flexShrink: 0,
  },
  createJobCardBtnDisabled: { opacity: 0.45 },
  createJobCardBtnText: {
    fontSize: 7,
    fontWeight: "800",
    color: colors.white,
    textAlign: "center",
    lineHeight: 8,
    letterSpacing: 0.1,
  },
});
