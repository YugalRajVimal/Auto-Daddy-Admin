import { SquareIconButton } from "@/components/reusables";
import { cardFontSizes, colors, radii, spacing } from "@/constants/autodaddy";
import { formatPincodeDisplay } from "@/lib/validation";
import type { CustomerVehicle } from "@/types/auto-shop-owner-endpoints";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { CustomerVehicleRow } from "./customer-vehicle-row";

function avatarLetter(name: string) {
  const t = name.trim();
  return t ? t.charAt(0).toUpperCase() : "?";
}

export type CustomerCardProps = {
  variant: "directory" | "mine";
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  pincode?: string;
  vehicles: CustomerVehicle[];
  recentJobCard?: {
    subServices?: string[];
    date?: string;
    time?: string;
    vehicleNumberPlate?: string;
  } | null;
  footerTime?: string;
  expanded: boolean;
  onToggleExpand: () => void;
  showAddButton?: boolean;
  addLabelInList?: string;
  onAddToMine?: () => void;
  addingToMine?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Per-vehicle actions (e.g. shop-owner “mine” list). */
  onEditVehicle?: (vehicleIndex: number) => void;
  onRemoveVehicle?: (vehicleIndex: number) => void;
  /** Opens add-vehicle flow for this customer (shop-owner “mine” list). */
  onAddVehicle?: () => void;
  /** Hides footer actions (e.g. job-card customer picker). */
  hideFooter?: boolean;
  /** Shown when `vehicles` is empty (defaults to “No vehicles on file.”). */
  vehiclesEmptyMessage?: string;
  /** Per-vehicle create job card (job-card add flow). */
  onCreateJobCardForVehicle?: (vehicleIndex: number) => void;
};

export function CustomerCard({
  variant,
  name,
  phone,
  email,
  address,
  city,
  pincode,
  vehicles,
  recentJobCard,
  footerTime,
  expanded,
  onToggleExpand,
  showAddButton,
  addLabelInList,
  onAddToMine,
  addingToMine = false,
  onView,
  onEdit,
  onDelete,
  onEditVehicle,
  onRemoveVehicle,
  onAddVehicle,
  hideFooter = false,
  vehiclesEmptyMessage,
  onCreateJobCardForVehicle,
}: CustomerCardProps) {
  const initial = avatarLetter(name);
  const vehicleCount = vehicles.length;
  const hasRecentJobCard =
    Boolean(recentJobCard) &&
    (Boolean(recentJobCard?.vehicleNumberPlate) ||
      Boolean(recentJobCard?.date) ||
      Boolean(recentJobCard?.time) ||
      Boolean(recentJobCard?.subServices?.length));

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Pressable style={styles.topMain} onPress={onToggleExpand}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">
              {name || "—"}
            </Text>
            <Text style={styles.phone} numberOfLines={2} ellipsizeMode="tail">
              {phone}
            </Text>
            {variant === "directory" && showAddButton && onAddToMine ? (
              <Pressable
                style={[styles.addOutline, addingToMine && styles.addOutlineDisabled]}
                onPress={onAddToMine}
                disabled={addingToMine}
              >
                {addingToMine ? (
                  <View style={styles.addOutlineLoadingRow}>
                    <ActivityIndicator size="small" color={colors.successDark} />
                    <Text style={styles.addOutlineText}>Adding…</Text>
                  </View>
                ) : (
                  <Text style={styles.addOutlineText}>+ Add To My Customer</Text>
                )}
              </Pressable>
            ) : null}
            {variant === "directory" && addLabelInList ? (
              <View style={styles.inListBadge}>
                <Text style={styles.inListText}>{addLabelInList}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>

        <Pressable onPress={onToggleExpand} hitSlop={10} style={styles.chevBtn}>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={22} color={colors.textMuted} />
        </Pressable>
      </View>

      {expanded ? (
        <View style={styles.body}>
          {hasRecentJobCard ? (
            <View style={styles.recentBlock}>
              <View style={styles.recentHeader}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={styles.recentTitle}>Recent Job Card</Text>
              </View>
              <View style={styles.recentRow}>
                <Ionicons name="car-outline" size={16} color={colors.textMuted} />
                <Text style={styles.recentText} numberOfLines={2}>
                  {recentJobCard?.vehicleNumberPlate ?? "—"}
                </Text>
              </View>
              <View style={styles.recentRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                <Text style={styles.recentText} numberOfLines={2}>
                  {`${recentJobCard?.date ?? "—"}${recentJobCard?.time ? ` · ${recentJobCard.time}` : ""}`}
                </Text>
              </View>
              {recentJobCard?.subServices?.length ? (
                <View style={styles.servicesBlock}>
                  <View style={styles.servicesLabelRow}>
                    <Ionicons name="construct-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.servicesLabel}>SERVICES</Text>
                  </View>
                  <Text style={styles.servicesBody}>
                    {recentJobCard.subServices.map((s) => s.trim()).filter(Boolean).join("\n")}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
          {address ? (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={18} color={colors.primary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{address}</Text>
            </View>
          ) : null}
          {city ? (
            <View style={styles.detailRow}>
              <Ionicons name="map-outline" size={18} color={colors.primary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{city}</Text>
            </View>
          ) : null}
          {pincode ? (
            <View style={styles.detailRow}>
              <Ionicons name="business-outline" size={18} color={colors.primary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{formatPincodeDisplay(pincode)}</Text>
            </View>
          ) : null}
          {email ? (
            <View style={styles.detailRow}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{email}</Text>
            </View>
          ) : null}

          <View style={styles.vehiclesHeader}>
            <Text style={styles.vehiclesTitle}>Vehicles</Text>
            <Text style={styles.vehiclesCount}>
              {vehicleCount} vehicle{vehicleCount === 1 ? "" : "s"}
            </Text>
          </View>
          {vehicles.length === 0 ? (
            <Text style={styles.noVehicles}>{vehiclesEmptyMessage ?? "No vehicles on file."}</Text>
          ) : (
            vehicles.map((v, idx) => (
              <CustomerVehicleRow
                key={v._id ?? `v-${idx}-${v.licensePlateNo ?? v.vehicleName ?? ""}`}
                vehicle={v}
                showActions={
                  !onCreateJobCardForVehicle && variant === "mine" && Boolean(onEditVehicle || onRemoveVehicle)
                }
                canRemove={vehicles.length > 1}
                onEdit={onEditVehicle ? () => onEditVehicle(idx) : undefined}
                onRemove={onRemoveVehicle ? () => onRemoveVehicle(idx) : undefined}
                onCreateJobCard={
                  onCreateJobCardForVehicle ? () => onCreateJobCardForVehicle(idx) : undefined
                }
              />
            ))
          )}
          {variant === "mine" && onAddVehicle ? (
            <Pressable style={styles.addVehicleOutline} onPress={onAddVehicle}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.addVehicleOutlineText}>Add vehicle</Text>
            </Pressable>
          ) : null}

          {!hideFooter ? (
            <View style={styles.footer}>
              {footerTime ? (
                <View style={styles.timeRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.timeText} numberOfLines={1}>
                    {footerTime}
                  </Text>
                </View>
              ) : (
                <View style={styles.timeRow} />
              )}
              <View style={styles.actions}>
                {onView ? <SquareIconButton name="eye-outline" tone="primary" onPress={onView} /> : null}
                {variant === "mine" && onEdit ? (
                  <SquareIconButton name="create-outline" tone="primary" onPress={onEdit} />
                ) : null}
                {/* {variant === "mine" && onDelete ? (
                <SquareIconButton name="trash-outline" tone="danger" onPress={onDelete} />
              ) : null} */}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  topMain: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.iconBlueTint,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  avatarText: {
    fontSize: cardFontSizes.hero,
    fontWeight: "800",
    color: colors.primary,
  },
  titleBlock: { flex: 1, minWidth: 0, justifyContent: "center" },
  name: { fontSize: cardFontSizes.md, fontWeight: "800", color: colors.text },
  phone: { fontSize: cardFontSizes.sm, color: colors.textMuted, marginTop: 2, marginBottom: 4 },
  addOutline: {
    borderWidth: 1.5,
    borderColor: colors.success,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm - 2,
    maxWidth: 200,
    flexShrink: 1,
    alignSelf: "flex-start",
    marginTop: 2,
    marginBottom: 2,
  },
  addOutlineText: {
    fontSize: cardFontSizes.xs,
    fontWeight: "700",
    color: colors.success,
  },
  addOutlineDisabled: { opacity: 0.7 },
  addOutlineLoadingRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  inListBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.successMuted,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  inListText: { fontSize: cardFontSizes.xs, fontWeight: "700", color: colors.successDark },
  chevBtn: { padding: spacing.xs, marginLeft: 2, alignSelf: "flex-start" },
  body: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  recentBlock: {
    borderWidth: 1,
    borderColor: "#E6EEFF",
    backgroundColor: "#F7FAFF",
    borderRadius: radii.lg,
    padding: spacing.sm + 2,
    gap: spacing.xs,
  },
  recentHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  recentTitle: { fontSize: cardFontSizes.sm, fontWeight: "800", color: colors.text },
  recentRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  recentText: { flex: 1, fontSize: cardFontSizes.sm, color: colors.text, fontWeight: "600" },
  servicesBlock: {
    marginTop: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#EEF2FF",
    padding: spacing.sm,
    gap: spacing.xs,
  },
  servicesLabelRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  servicesLabel: { fontSize: cardFontSizes.xs, fontWeight: "900", color: colors.textMuted, letterSpacing: 0.6 },
  servicesBody: { fontSize: cardFontSizes.sm, color: colors.text, fontWeight: "700", lineHeight: 19 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  detailIcon: { marginTop: 2 },
  detailText: { flex: 1, fontSize: cardFontSizes.sm, color: colors.text, lineHeight: 19 },
  vehiclesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  vehiclesTitle: { fontSize: cardFontSizes.md, fontWeight: "800", color: colors.text },
  vehiclesCount: { fontSize: cardFontSizes.sm, fontWeight: "600", color: colors.textMuted },
  noVehicles: { fontSize: cardFontSizes.sm, color: colors.textLight, fontStyle: "italic" },
  addVehicleOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingVertical: spacing.sm - 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.iconBlueTint,
  },
  addVehicleOutlineText: {
    fontSize: cardFontSizes.sm,
    fontWeight: "700",
    color: colors.primary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingRight: spacing.sm },
  timeText: { flex: 1, fontSize: cardFontSizes.xs, color: colors.textMuted },
  actions: { flexDirection: "row", gap: spacing.sm + 2 },
});
