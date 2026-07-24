import { ExpandableCard, LogoPickerField, ProfileFieldRow } from "@/components/reusables";
import { colors, fontSizes, spacing } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { nationalPhoneDisplayFromKeystrokes, NATIONAL_PHONE_DISPLAY_MAX_LENGTH } from "@/lib/national-phone-format";
import {
  SHOP_OWNER_SHOP_TYPE_OPTIONS,
  type ShopOwnerShopType,
} from "@/lib/shop-owner-shop-types";
import {
  clampDigits,
  clampText,
  digitsOnly,
  formatPincodeDisplay,
  hasCanadianPostalCodeValidationError,
  isValidEmail,
  PINCODE_DISPLAY_MAX_LENGTH,
  POSTAL_CODE_ERROR_MESSAGE,
} from "@/lib/validation";

type Row = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type BusinessInformationCardProps = {
  expanded: boolean;
  editing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  businessFields: Row[];
  viewableBusinessLogoUri: string | null;
  onViewLogo: (uri: string) => void;
  editBusinessName: string;
  setEditBusinessName: (value: string) => void;
  editBusinessEmail: string;
  setEditBusinessEmail: (value: string) => void;
  editBusinessPhone: string;
  setEditBusinessPhone: (value: string) => void;
  editBusinessAddress: string;
  setEditBusinessAddress: (value: string) => void;
  editBusinessCityName: string;
  onPickBusinessCity: () => void;
  editBusinessPincode: string;
  setEditBusinessPincode: (value: string) => void;
  editBusinessHstNumber: string;
  setEditBusinessHstNumber: (value: string) => void;
  editBusinessGstPercent: string;
  setEditBusinessGstPercent: (value: string) => void;
  editShopTypes: ShopOwnerShopType[];
  onToggleShopType: (value: ShopOwnerShopType) => void;
  editBusinessLogoUri: string;
  onPickBusinessLogo: () => void;
  onRemoveBusinessLogo: () => void;
};

export function BusinessInformationCard(props: BusinessInformationCardProps) {
  const {
    expanded,
    editing,
    onToggle,
    onEdit,
    onSave,
    onCancel,
    saving = false,
    businessFields,
    viewableBusinessLogoUri,
    onViewLogo,
    editBusinessName,
    setEditBusinessName,
    editBusinessEmail,
    setEditBusinessEmail,
    editBusinessPhone,
    setEditBusinessPhone,
    editBusinessAddress,
    setEditBusinessAddress,
    editBusinessCityName,
    onPickBusinessCity,
    editBusinessPincode,
    setEditBusinessPincode,
    editBusinessHstNumber,
    setEditBusinessHstNumber,
    editBusinessGstPercent,
    setEditBusinessGstPercent,
    editShopTypes,
    onToggleShopType,
    editBusinessLogoUri,
    onPickBusinessLogo,
    onRemoveBusinessLogo,
  } = props;

  return (
    <ExpandableCard
      title="Business Profile"
      headerIcon="storefront"
      expanded={expanded}
      onToggle={onToggle}
      onEdit={editing ? undefined : onEdit}
      editing={editing}
      onSave={onSave}
      onCancel={onCancel}
      saving={saving}
    >
      {editing ? (
        <>
          {businessFields
            .filter((row) => row.label !== "Upload Logo" && row.label !== "Business Types")
            .map((row, idx) => {
              const isName = row.label === "Business Name";
              const isEmail = row.label === "E mail" || row.label === "Email";
              const isPhone = row.label === "Business Phone";
              const isAddress = row.label === "Address";
              const isCity = row.label === "City";
              const isPincode = row.label === "Zip Code";
              const isHstNumber = row.label === "TAX ID No";
              const isGst = row.label === "Tax %";

              if (isCity) {
                return (
                  <View key={row.label}>
                    {idx > 0 ? <View style={styles.divider} /> : null}
                    <View style={styles.cityRow}>
                      <View style={styles.cityIcon}>
                        <Ionicons name={row.icon} size={16} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cityLabel}>{row.label}</Text>
                        <Pressable
                          style={({ pressed }) => [styles.citySelect, pressed && styles.citySelectPressed]}
                          onPress={onPickBusinessCity}
                        >
                          <Text
                            style={[styles.cityValue, !editBusinessCityName.trim() && styles.cityPlaceholder]}
                            numberOfLines={1}
                          >
                            {editBusinessCityName.trim() || "Select city…"}
                          </Text>
                          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              }

              return (
                <ProfileFieldRow
                  key={row.label}
                  icon={row.icon}
                  label={row.label}
                  value={row.value}
                  showDivider={idx > 0}
                  editable
                  inputValue={
                    isName
                      ? editBusinessName
                      : isEmail
                        ? editBusinessEmail
                        : isPhone
                          ? editBusinessPhone
                          : isAddress
                            ? editBusinessAddress
                            : isPincode
                              ? editBusinessPincode
                              : isGst
                                ? editBusinessGstPercent
                                : editBusinessHstNumber
                  }
                  onChangeText={
                    isName
                      ? (t) => setEditBusinessName(clampText(t, 50))
                      : isEmail
                        ? (t) => setEditBusinessEmail(clampText(t, 80))
                        : isPhone
                          ? (t) => setEditBusinessPhone(nationalPhoneDisplayFromKeystrokes(t))
                          : isAddress
                            ? (t) => setEditBusinessAddress(clampText(t, 80))
                            : isPincode
                              ? (t) => setEditBusinessPincode(formatPincodeDisplay(t))
                              : isGst
                                ? (t) => setEditBusinessGstPercent(clampDigits(t, 3))
                                : (t) =>
                                    setEditBusinessHstNumber(
                                      t.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 17)
                                    )
                  }
                  keyboardType={
                    isEmail
                      ? "email-address"
                      : isPhone || isGst
                        ? "number-pad"
                        : "default"
                  }
                  autoCapitalize={
                    isEmail ? "none" : isPincode || isHstNumber ? "characters" : "sentences"
                  }
                  multiline={false}
                  inputEditable
                  maxLength={
                    isEmail
                      ? 80
                      : isPhone
                        ? NATIONAL_PHONE_DISPLAY_MAX_LENGTH
                        : isPincode
                          ? PINCODE_DISPLAY_MAX_LENGTH
                          : isGst
                            ? 3
                            : isHstNumber
                              ? 17
                              : isAddress
                                ? 80
                                : 50
                  }
                  errorText={
                    isEmail
                      ? !editBusinessEmail.trim() || !isValidEmail(editBusinessEmail)
                        ? "Enter a valid email address."
                        : null
                      : isPhone
                        ? digitsOnly(editBusinessPhone).length < 10
                          ? "Enter a valid phone number (10-15 digits)."
                          : null
                        : isPincode
                          ? hasCanadianPostalCodeValidationError(editBusinessPincode)
                            ? POSTAL_CODE_ERROR_MESSAGE
                            : null
                          : isGst
                            ? editBusinessGstPercent.trim().length > 0 && Number(editBusinessGstPercent) > 50
                              ? "Enter a valid tax percentage (0 - 50)."
                              : null
                            : isHstNumber
                              ? editBusinessHstNumber.trim().length > 0 &&
                                editBusinessHstNumber.trim().length !== 17
                                ? "Enter a valid TAX ID No (17 uppercase alphanumeric characters)."
                                : null
                              : null
                  }
                />
              );
            })}

          <LogoPickerField
            label="Upload Logo"
            logoUri={editBusinessLogoUri}
            onPick={onPickBusinessLogo}
            onRemove={onRemoveBusinessLogo}
            emptyText="No logo uploaded"
            pickerText="Select Image"
          />

          <View style={styles.shopTypesBlock}>
            <Text style={styles.shopTypesLabel}>Business Types</Text>
            {SHOP_OWNER_SHOP_TYPE_OPTIONS.map((option) => {
              const checked = editShopTypes.includes(option.value);
              const locked = checked && editShopTypes.length === 1;
              return (
                <Pressable
                  key={option.value}
                  style={({ pressed }) => [
                    styles.shopTypeRow,
                    pressed && !locked && styles.shopTypeRowPressed,
                  ]}
                  disabled={locked}
                  onPress={() => onToggleShopType(option.value)}
                >
                  <Ionicons
                    name={checked ? "checkbox" : "square-outline"}
                    size={18}
                    color={locked ? colors.textLight : colors.primary}
                  />
                  <Text style={[styles.shopTypeText, locked && styles.shopTypeTextLocked]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : (
        <>
          {businessFields.map((row, idx) => (
            <ProfileFieldRow
              key={row.label}
              icon={row.icon}
              label={row.label}
              value={row.value}
              showDivider={idx > 0}
              onPress={
                row.label === "Upload Logo" && viewableBusinessLogoUri
                  ? () => onViewLogo(viewableBusinessLogoUri)
                  : undefined
              }
            />
          ))}
        </>
      )}
    </ExpandableCard>
  );
}

const styles = StyleSheet.create({
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  cityRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, paddingVertical: 4 },
  cityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryMutedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  cityLabel: { fontSize: fontSizes.sm, color: colors.textMuted, fontWeight: "700" },
  citySelect: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  citySelectPressed: { opacity: 0.85 },
  cityValue: { flex: 1, fontSize: fontSizes.base, fontWeight: "700", color: colors.text },
  cityPlaceholder: { color: colors.textLight },
  shopTypesBlock: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  shopTypesLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  shopTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  shopTypeRowPressed: { opacity: 0.85 },
  shopTypeText: {
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.text,
  },
  shopTypeTextLocked: {
    color: colors.textLight,
  },
});
