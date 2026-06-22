import { Ionicons } from "@expo/vector-icons";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";

type LogoPickerFieldProps = {
  label?: string;
  logoUri: string;
  onPick: () => void;
  onRemove: () => void;
  emptyText?: string;
  pickerText?: string;
};

export function LogoPickerField({
  label = "Business logo",
  logoUri,
  onPick,
  onRemove,
  emptyText = "Default logo",
  pickerText = "Select Image",
}: LogoPickerFieldProps) {
  const placeholder = require("../../../assets/images/logo-rectangle.png");
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.logoPickerBtn} onPress={onPick}>
        <Ionicons name="image-outline" size={16} color={colors.primary} />
        <Text style={styles.logoPickerBtnText}>{pickerText}</Text>
      </Pressable>
      <View style={styles.logoPreviewWrap}>
        <Image source={logoUri ? { uri: logoUri } : placeholder} style={styles.logoPreview} resizeMode="contain" />
      </View>
      {logoUri ? (
        <>
          <Pressable
            style={styles.logoRemoveBtn}
            onPress={() => {
              Alert.alert("Remove logo?", "The selected logo will be cleared.", [
                { text: "Cancel", style: "cancel" },
                { text: "Remove", style: "destructive", onPress: onRemove },
              ]);
            }}
          >
            <Ionicons name="trash-outline" size={14} color={colors.danger} />
            <Text style={styles.logoRemoveBtnText}>Remove Logo</Text>
          </Pressable>
        </>
      ) : (
        <Text style={styles.logoPathText}>{emptyText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textMuted,
  },
  logoPickerBtn: {
    minHeight: 42,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primaryMutedBg,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  logoPickerBtnText: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontWeight: "700",
  },
  logoPathText: {
    color: colors.textLight,
    fontSize: fontSizes.xs,
  },
  logoRemoveBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radii.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.dangerMuted,
  },
  logoRemoveBtnText: {
    color: colors.danger,
    fontSize: fontSizes.xs,
    fontWeight: "700",
  },
  logoPreviewWrap: {
    alignItems: "center",
    marginVertical: spacing.sm,
  },
  logoPreview: {
    width: "100%",
    height: 120,
    borderRadius: radii.md,
    backgroundColor: colors.bgAlt,
  },
});
