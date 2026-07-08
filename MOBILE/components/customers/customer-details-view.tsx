import { cardFontSizes, colors, radii, shadows, spacing } from "@/constants/autodaddy";
import { formatPincodeDisplay } from "@/lib/validation";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export type CustomerDetailsVehicle = {
  licensePlateNo?: string;
  vinNo?: string;
  vehicleName?: string;
  model?: string;
  year?: string;
  odometerReading?: string;
  disabled?: boolean;
};

export type CustomerDetailsViewProps = {
  name: string;
  email?: string;
  phoneDisplay: string;
  address?: string;
  city?: string;
  pincode?: string;
  vehicles: CustomerDetailsVehicle[];
};

function avatarLetter(name: string) {
  const t = name.trim();
  return t ? t.charAt(0).toUpperCase() : "?";
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  if (!value.trim() || value.trim() === "—") {
    return null;
  }
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconWrap}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.detailTextBlock}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function VehicleDetailCard({ vehicle, index }: { vehicle: CustomerDetailsVehicle; index: number }) {
  const plate = vehicle.licensePlateNo?.trim() || "—";
  const make = vehicle.vehicleName?.trim() || "";
  const model = vehicle.model?.trim() || "";
  const title = [make, model].filter(Boolean).join(" ") || "Vehicle";
  const year = vehicle.year?.trim() || "";
  const vin = vehicle.vinNo?.trim() || "";
  const odo = vehicle.odometerReading?.trim() || "";
  const isDisabled = Boolean(vehicle.disabled);

  return (
    <View style={[styles.vehicleCard, isDisabled && styles.vehicleCardDisabled]}>
      <View style={styles.vehicleCardTop}>
        <View style={styles.plateBadge}>
          <Ionicons name="id-card-outline" size={14} color={colors.primaryDark} />
          <Text style={styles.plateText} numberOfLines={1}>
            {plate}
          </Text>
        </View>
        {year ? (
          <View style={styles.yearChip}>
            <Text style={styles.yearChipText}>{year}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.vehicleTitleRow}>
        <View style={styles.vehicleIcon}>
          <Ionicons name="car-sport-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.vehicleTitleBlock}>
          <Text style={[styles.vehicleTitle, isDisabled && styles.vehicleTitleDisabled]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.vehicleIndex}>Vehicle {index + 1}</Text>
        </View>
        {isDisabled ? (
          <View style={styles.disabledBadge}>
            <Ionicons name="ban-outline" size={12} color={colors.danger} />
            <Text style={styles.disabledBadgeText}>Disabled</Text>
          </View>
        ) : null}
      </View>
      {vin || odo ? (
        <View style={styles.vehicleMeta}>
          {vin ? (
            <View style={styles.metaPill}>
              <Ionicons name="barcode-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaPillText} numberOfLines={1}>
                {vin}
              </Text>
            </View>
          ) : null}
          {odo ? (
            <View style={styles.metaPill}>
              <Ionicons name="speedometer-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaPillText} numberOfLines={1}>
                {odo} km
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function CustomerDetailsView({
  name,
  email,
  phoneDisplay,
  address,
  city,
  pincode,
  vehicles,
}: CustomerDetailsViewProps) {
  const initial = avatarLetter(name);
  const vehicleCount = vehicles.length;
  const hasLocation = Boolean(address?.trim() || city?.trim() || pincode?.trim());

  return (
    <View style={styles.root}>
      <View style={[styles.heroCard, shadows.soft]}>
        <View style={styles.heroAccent} />
        <View style={styles.heroContent}>
          <View style={styles.heroTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroName} numberOfLines={2}>
                {name.trim() || "—"}
              </Text>
              <View style={styles.phonePill}>
                <Ionicons name="call-outline" size={14} color={colors.primary} />
                <Text style={styles.phoneText} numberOfLines={1}>
                  {phoneDisplay.trim() || "—"}
                </Text>
              </View>
            </View>
          </View>
          {email?.trim() ? (
            <View style={styles.emailRow}>
              <Ionicons name="mail-outline" size={16} color={colors.primary} />
              <Text style={styles.emailText} numberOfLines={2}>
                {email.trim()}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {hasLocation ? (
        <View style={[styles.sectionCard, shadows.soft]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          <View style={styles.sectionBody}>
            <DetailRow icon="home-outline" label="Address" value={address?.trim() || ""} />
            <DetailRow icon="map-outline" label="City" value={city?.trim() || ""} />
            <DetailRow
              icon="business-outline"
              label="Zip code"
              value={pincode?.trim() ? formatPincodeDisplay(pincode) : ""}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.vehiclesSection}>
        <View style={styles.vehiclesHeader}>
          <View style={styles.vehiclesHeaderLeft}>
            <Ionicons name="car-outline" size={18} color={colors.primary} />
            <Text style={styles.vehiclesTitle}>Vehicles</Text>
          </View>
          <Text style={styles.vehiclesCount}>
            {vehicleCount} {vehicleCount === 1 ? "vehicle" : "vehicles"}
          </Text>
        </View>
        {vehicleCount === 0 ? (
          <View style={styles.emptyVehicles}>
            <Ionicons name="car-outline" size={28} color={colors.textLight} />
            <Text style={styles.emptyVehiclesText}>No vehicles on file</Text>
          </View>
        ) : (
          vehicles.map((v, idx) => (
            <VehicleDetailCard key={`vd-${idx}-${v.licensePlateNo ?? v.vehicleName ?? ""}`} vehicle={v} index={idx} />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroAccent: {
    height: 4,
    backgroundColor: colors.primary,
  },
  heroContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.iconBlueTint,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: cardFontSizes.hero,
    fontWeight: "800",
    color: colors.primary,
  },
  heroText: { flex: 1, minWidth: 0, gap: spacing.sm },
  heroName: {
    fontSize: cardFontSizes.lg,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 24,
  },
  phonePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.round,
    backgroundColor: colors.primaryMutedBg,
    borderWidth: 1,
    borderColor: "#C7D9F5",
    maxWidth: "100%",
  },
  phoneText: {
    fontSize: cardFontSizes.sm,
    fontWeight: "700",
    color: colors.primaryDark,
    flexShrink: 1,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emailText: {
    flex: 1,
    fontSize: cardFontSizes.sm,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: cardFontSizes.md,
    fontWeight: "800",
    color: colors.text,
  },
  sectionBody: { gap: spacing.sm },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  detailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMutedBg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  detailTextBlock: { flex: 1, minWidth: 0 },
  detailLabel: {
    fontSize: cardFontSizes.xs,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: cardFontSizes.sm,
    fontWeight: "600",
    color: colors.text,
    marginTop: 2,
    lineHeight: 20,
  },
  vehiclesSection: { gap: spacing.sm },
  vehiclesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  vehiclesHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  vehiclesTitle: {
    fontSize: cardFontSizes.md,
    fontWeight: "800",
    color: colors.text,
  },
  vehiclesCount: {
    fontSize: cardFontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
  },
  emptyVehicles: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  emptyVehiclesText: {
    fontSize: cardFontSizes.sm,
    fontWeight: "600",
    color: colors.textLight,
  },
  vehicleCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#E6EEFF",
    gap: spacing.sm,
  },
  vehicleCardDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E4E4E7",
    opacity: 0.88,
  },
  vehicleCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  plateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMutedBg,
    borderWidth: 1,
    borderColor: "#C7D9F5",
    flexShrink: 1,
    maxWidth: "72%",
  },
  plateText: {
    fontSize: cardFontSizes.sm,
    fontWeight: "800",
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  yearChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
    backgroundColor: colors.segmentBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yearChipText: {
    fontSize: cardFontSizes.xs,
    fontWeight: "800",
    color: colors.textMuted,
  },
  vehicleTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  vehicleIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.iconBlueTint,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleTitleBlock: { flex: 1, minWidth: 0 },
  vehicleTitle: {
    fontSize: cardFontSizes.md,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 21,
  },
  vehicleTitleDisabled: { color: colors.textLight },
  vehicleIndex: {
    fontSize: cardFontSizes.xs,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: 2,
  },
  disabledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
  vehicleMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: 2,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: "100%",
  },
  metaPillText: {
    fontSize: cardFontSizes.xs,
    fontWeight: "600",
    color: colors.textMuted,
    flexShrink: 1,
  },
});
