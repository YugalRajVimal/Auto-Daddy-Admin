import { associateColors } from "@/constants/associate-theme";
import { colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import { StyleSheet } from "react-native";

export const associateProfileStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: spacing.md,
    ...shadows.card,
  },
  field: { marginTop: spacing.md },
  fieldLabelRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  fieldIcon: {
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: associateColors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: { fontSize: fontSizes.sm, fontWeight: "900", color: colors.textMuted },
  readOnlyBox: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readOnlyBoxMultiline: { minHeight: 80 },
  readOnlyText: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.text,
  },
  demoBadge: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.round,
    backgroundColor: associateColors.primaryMuted,
  },
  demoBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: "800",
    color: associateColors.badgeText,
  },
});
