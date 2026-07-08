import { Ionicons } from "@expo/vector-icons";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";

type BannerPickerFieldProps = {
  label?: string;
  bannerUri: string;
  onPick: () => void;
  onRemove: () => void;
  emptyText?: string;
  pickerText?: string;
};

export function BannerPickerField({
  label = "Banner image",
  bannerUri,
  onPick,
  onRemove,
  emptyText = "No banner uploaded",
  pickerText = "Select Image",
}: BannerPickerFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.pickerBtn} onPress={onPick}>
        <Ionicons name="image-outline" size={16} color={colors.primary} />
        <Text style={styles.pickerBtnText}>{pickerText}</Text>
      </Pressable>
      <View style={styles.previewWrap}>
        {bannerUri ? (
          <Image source={{ uri: bannerUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Ionicons name="images-outline" size={28} color={colors.textLight} />
            <Text style={styles.placeholderText}>{emptyText}</Text>
          </View>
        )}
      </View>
      {bannerUri ? (
        <Pressable
          style={styles.removeBtn}
          onPress={() => {
            Alert.alert("Remove banner?", "The banner image will be cleared.", [
              { text: "Cancel", style: "cancel" },
              { text: "Remove", style: "destructive", onPress: onRemove },
            ]);
          }}
        >
          <Ionicons name="trash-outline" size={14} color={colors.danger} />
          <Text style={styles.removeBtnText}>Remove Banner</Text>
        </Pressable>
      ) : null}
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
  pickerBtn: {
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
  pickerBtnText: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontWeight: "700",
  },
  previewWrap: {
    marginVertical: spacing.sm,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.bgAlt,
  },
  preview: {
    width: "100%",
    height: 140,
  },
  previewPlaceholder: {
    width: "100%",
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  placeholderText: {
    color: colors.textLight,
    fontSize: fontSizes.xs,
    fontWeight: "600",
  },
  removeBtn: {
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
  removeBtnText: {
    color: colors.danger,
    fontSize: fontSizes.xs,
    fontWeight: "700",
  },
});
