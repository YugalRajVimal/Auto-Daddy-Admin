import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { nationalPhoneDisplayFromKeystrokes, NATIONAL_PHONE_DISPLAY_MAX_LENGTH } from "@/lib/national-phone-format";
import { clampText, digitsOnly, isValidEmail } from "@/lib/validation";

type TeamMemberEditorProps = {
  mode: "add" | "edit";
  photoUri?: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  active: boolean;
  submitting?: boolean;
  onPickPhoto: () => void;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onDesignationChange: (value: string) => void;
  onActiveChange: (value: boolean) => void;
  onSubmit: () => void;
};

export function TeamMemberEditor({
  mode,
  photoUri = "",
  name,
  email,
  phone,
  designation,
  active,
  submitting = false,
  onPickPhoto,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onDesignationChange,
  onActiveChange,
  onSubmit,
}: TeamMemberEditorProps) {
  const phoneDigits = digitsOnly(phone);
  const canSubmit =
    name.trim().length > 0 &&
    phoneDigits.length === 10 &&
    designation.trim().length > 0;

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.avatarWrap} onPress={onPickPhoto}>
        <View style={styles.avatarCircle}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImage} />
          ) : (
            <>
              <View style={styles.avatarPattern} />
              <Ionicons name="person" size={34} color={colors.primary} style={styles.avatarIcon} />
            </>
          )}
        </View>
        <View style={styles.avatarEditBtn}>
          <Ionicons name="pencil" size={14} color={colors.white} />
        </View>
        <Text style={styles.avatarHint}>Tap to change photo</Text>
      </Pressable>

      <View style={styles.formCard}>
        <Field
          label="Full Name *"
          value={name}
          onChangeText={(t) => onNameChange(clampText(t, 20))}
          placeholder="Enter full name"
          maxLength={20}
          errorText={name.trim().length === 0 ? "Name is required." : null}
        />
        <Field
          label="Phone Number *"
          value={phone}
          onChangeText={(t) => onPhoneChange(nationalPhoneDisplayFromKeystrokes(t))}
          placeholder="781 708 9765"
          keyboardType="phone-pad"
          maxLength={NATIONAL_PHONE_DISPLAY_MAX_LENGTH}
          errorText={phoneDigits.length > 0 && phoneDigits.length !== 10 ? "Phone must be 10 digits." : null}
        />
        <Field
          label="Email Address"
          value={email}
          onChangeText={(t) => onEmailChange(clampText(t, 80))}
          placeholder="Enter email address"
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={80}
          errorText={email.trim().length > 0 && !isValidEmail(email) ? "Enter a valid email." : null}
        />
        <Field
          label="Role / Designation *"
          value={designation}
          onChangeText={(t) => onDesignationChange(clampText(t, 30))}
          placeholder="e.g. Mechanic, Manager"
          maxLength={30}
          errorText={designation.trim().length === 0 ? "Designation is required." : null}
        />

        <View style={styles.statusRow}>
          <View>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.statusText}>Mark as Active</Text>
          </View>
          <Switch
            value={active}
            onValueChange={onActiveChange}
            trackColor={{ false: colors.switchTrackOff, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.submitBtn,
          (pressed || !canSubmit || submitting) && styles.submitBtnPressed,
        ]}
        onPress={onSubmit}
        disabled={!canSubmit || submitting}
      >
        <Text style={styles.submitBtnText}>
          {submitting ? "Saving..." : mode === "edit" ? "UPDATE MEMBER" : "SAVE MEMBER"}
        </Text>
      </Pressable>
    </View>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences";
  maxLength?: number;
  errorText?: string | null;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "sentences",
  maxLength,
  errorText,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
      />
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xxl * 2,
  },
  avatarWrap: {
    alignItems: "center",
    marginTop: spacing.xs,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryMutedBg,
    borderWidth: 3,
    borderColor: colors.primary,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarPattern: {
    flex: 1,
    backgroundColor: colors.primaryMutedBg,
  },
  avatarIcon: { position: "absolute" },
  avatarEditBtn: {
    position: "absolute",
    right: "36%",
    bottom: 22,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.warning,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarHint: {
    marginTop: spacing.sm,
    color: colors.textLight,
    fontSize: fontSizes.sm,
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    fontWeight: "600",
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.text,
    fontSize: fontSizes.md,
  },
  errorText: { marginTop: 4, color: colors.danger, fontSize: fontSizes.xs, fontWeight: "700" },
  statusRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusText: {
    marginTop: spacing.xs,
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
  submitBtn: {
    marginTop: spacing.sm,
    minHeight: 44,
    borderRadius: radii.round,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnPressed: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: fontSizes.lg,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
