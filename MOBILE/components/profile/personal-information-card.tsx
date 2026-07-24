import { ExpandableCard, LogoPickerField, ProfileFieldRow } from "@/components/reusables";
import { colors, fontSizes, spacing } from "@/constants/autodaddy";
import { clampText, isValidEmail } from "@/lib/validation";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Row = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type PersonalInformationCardProps = {
  expanded: boolean;
  editing: boolean;
  saving?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  personalFields: Row[];
  editName: string;
  setEditName: (value: string) => void;
  editEmail: string;
  setEditEmail: (value: string) => void;
  editPhone: string;
  editCityName: string;
  onPickCity: () => void;
  editProfilePhotoUri: string;
  onPickProfilePhoto: () => void;
  onRemoveProfilePhoto: () => void;
};

export function PersonalInformationCard({
  expanded,
  editing,
  saving = false,
  onToggle,
  onEdit,
  onSave,
  onCancel,
  personalFields,
  editName,
  setEditName,
  editEmail,
  setEditEmail,
  editPhone,
  editCityName,
  onPickCity,
  editProfilePhotoUri,
  onPickProfilePhoto,
  onRemoveProfilePhoto,
}: PersonalInformationCardProps) {
  return (
    <ExpandableCard
      title="Personal Profile"
      headerIcon="person"
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
          {personalFields
            .filter((row) => row.label !== "Upload Image")
            .map((row, idx) => {
              const isName = row.label === "Name";
              const isEmail = row.label === "Email";
              const isPhone = row.label === "Phone";
              const isCity = row.label === "City";

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
                          onPress={onPickCity}
                        >
                          <Text
                            style={[styles.cityValue, !editCityName.trim() && styles.cityPlaceholder]}
                            numberOfLines={1}
                          >
                            {editCityName.trim() || "Select city…"}
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
                  inputValue={isName ? editName : isEmail ? editEmail : editPhone}
                  onChangeText={
                    isName
                      ? (t) => setEditName(clampText(t, 60))
                      : isEmail
                        ? (t) => setEditEmail(clampText(t, 80))
                        : () => undefined
                  }
                  keyboardType={isEmail ? "email-address" : "default"}
                  autoCapitalize={isEmail ? "none" : "sentences"}
                  multiline={false}
                  inputEditable={isName || isEmail}
                  maxLength={isName ? 60 : isEmail ? 80 : undefined}
                  errorText={
                    isName
                      ? editName.trim().length === 0
                        ? "Name is required."
                        : null
                      : isEmail
                        ? editEmail.trim().length > 0 && !isValidEmail(editEmail)
                          ? "Enter a valid email."
                          : null
                        : isCity && !editCityName.trim()
                          ? "City is required."
                          : null
                  }
                />
              );
            })}
          <LogoPickerField
            label="Upload Image"
            logoUri={editProfilePhotoUri}
            onPick={onPickProfilePhoto}
            onRemove={onRemoveProfilePhoto}
            emptyText="No image uploaded"
            pickerText="Select Image"
          />
        </>
      ) : (
        <>
          {personalFields.map((row, idx) => (
            <ProfileFieldRow
              key={row.label}
              icon={row.icon}
              label={row.label}
              value={row.value}
              showDivider={idx > 0}
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
});
