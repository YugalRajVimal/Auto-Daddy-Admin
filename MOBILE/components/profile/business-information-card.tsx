import { BannerPickerField, ExpandableCard, LogoPickerField, ProfileFieldRow } from "@/components/reusables";
import { colors, fontSizes, spacing } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { nationalPhoneDisplayFromKeystrokes, NATIONAL_PHONE_DISPLAY_MAX_LENGTH } from "@/lib/national-phone-format";
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
  onRequestDeviceLocation?: () => void;
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
  editBusinessLat: string;
  setEditBusinessLat: (value: string) => void;
  editBusinessLng: string;
  setEditBusinessLng: (value: string) => void;
  editBusinessHstNumber: string;
  setEditBusinessHstNumber: (value: string) => void;
  editBusinessGstPercent: string;
  setEditBusinessGstPercent: (value: string) => void;
  editBusinessLogoUri: string;
  onPickBusinessLogo: () => void;
  onRemoveBusinessLogo: () => void;
  editBusinessBannerUri: string;
  onPickBusinessBanner: () => void;
  onRemoveBusinessBanner: () => void;
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
    onRequestDeviceLocation,
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
    editBusinessLat,
    setEditBusinessLat,
    editBusinessLng,
    setEditBusinessLng,
    editBusinessHstNumber,
    setEditBusinessHstNumber,
    editBusinessGstPercent,
    setEditBusinessGstPercent,
    editBusinessLogoUri,
    onPickBusinessLogo,
    onRemoveBusinessLogo,
    editBusinessBannerUri,
    onPickBusinessBanner,
    onRemoveBusinessBanner,
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
            .filter(
              (row) =>
                row.label !== "Business Hours" &&
                row.label !== "Open Hours" &&
                row.label !== "Open Days" &&
                row.label !== "Business Logo"
            )
            .map((row, idx) => {
              const isName = row.label === "Business Name";
              const isEmail = row.label === "Business Email";
              const isPhone = row.label === "Business Phone";
              const isAddress = row.label === "Business Address";
              const isCity = row.label === "City";
              const isPincode = row.label === "Pincode" || row.label === "Zip Code";
              const isLat = row.label === "Latitude";
              const isLng = row.label === "Longitude";
              const isHstNumber = row.label === "Business HST Number";
              const isGst = row.label === "GST %";
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
                        <Pressable style={({ pressed }) => [styles.citySelect, pressed && styles.citySelectPressed]} onPress={onPickBusinessCity}>
                          <Text style={[styles.cityValue, !editBusinessCityName.trim() && styles.cityPlaceholder]} numberOfLines={1}>
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
                <View key={row.label}>
                  <ProfileFieldRow
                    icon={row.icon}
                    label={row.label === "Pincode" ? "Zip Code" : row.label}
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
                                : isLat
                                  ? editBusinessLat
                                  : isLng
                                    ? editBusinessLng
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
                                : isLat
                                  ? setEditBusinessLat
                                  : isLng
                                    ? setEditBusinessLng
                          : isGst
                            ? (t) => setEditBusinessGstPercent(clampDigits(t, 3))
                            : (t) => setEditBusinessHstNumber(clampText(t, 30))
                    }
                    keyboardType={
                      isEmail
                        ? "email-address"
                        : isPhone
                          ? "phone-pad"
                          : isLat || isLng || isGst
                            ? "number-pad"
                            : "default"
                    }
                    autoCapitalize={
                      isEmail ? "none" : isPincode || isHstNumber ? "characters" : "sentences"
                    }
                    multiline={false}
                    inputEditable={!isName}
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
                                ? 30
                                : isAddress
                                  ? 80
                                  : 50
                    }
                    errorText={
                      isEmail
                        ? editBusinessEmail.trim().length > 0 && !isValidEmail(editBusinessEmail)
                          ? "Enter a valid email."
                          : null
                        : isPhone
                          ? digitsOnly(editBusinessPhone).length > 0 && digitsOnly(editBusinessPhone).length !== 10
                            ? "Phone must be 10 digits."
                            : null
                          : isPincode
                            ? hasCanadianPostalCodeValidationError(editBusinessPincode)
                              ? POSTAL_CODE_ERROR_MESSAGE
                              : null
                        : isGst
                          ? editBusinessGstPercent.trim().length > 0 && Number(editBusinessGstPercent) > 100
                            ? "GST % must be 0–100."
                            : null
                            : null
                    }
                  />
                  {isLng && onRequestDeviceLocation ? (
                    <Pressable
                      style={({ pressed }) => [styles.locationBtn, pressed && styles.locationBtnPressed]}
                      onPress={onRequestDeviceLocation}
                    >
                      <Ionicons name="locate-outline" size={16} color={colors.primary} />
                      <Text style={styles.locationBtnText}>Use device GPS</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          <LogoPickerField logoUri={editBusinessLogoUri} onPick={onPickBusinessLogo} onRemove={onRemoveBusinessLogo} />
          <BannerPickerField
            bannerUri={editBusinessBannerUri}
            onPick={onPickBusinessBanner}
            onRemove={onRemoveBusinessBanner}
          />
        </>
      ) : (
        <>
          {businessFields.map((row, idx) => (
            <ProfileFieldRow
              key={row.label}
              icon={row.icon}
              label={row.label === "Pincode" ? "Zip Code" : row.label}
              value={row.value}
              showDivider={idx > 0}
              onPress={row.label === "Business Logo" && viewableBusinessLogoUri ? () => onViewLogo(viewableBusinessLogoUri) : undefined}
            />
          ))}
        </>
      )}
    </ExpandableCard>
  );
}

const styles = StyleSheet.create({
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  businessEditBlock: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  locationBtn: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryMutedBg,
  },
  locationBtnPressed: { opacity: 0.85 },
  locationBtnText: { fontSize: fontSizes.sm, fontWeight: "800", color: colors.primaryDark },
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
});
