import { colors } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { carOwnerProfileStyles as styles } from "./car-owner-profile-styles";

export function CarOwnerProfileSelectField({
  label,
  value,
  placeholder,
  editable,
  onPress,
  icon,
  errorText,
  disabled,
}: {
  label: string;
  value: string;
  placeholder?: string;
  editable: boolean;
  onPress?: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  errorText?: string | null;
  disabled?: boolean;
}) {
  const showError = Boolean(errorText);
  const display = value.trim() ? value : "";
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <View style={styles.fieldIcon}>
          <Ionicons name={icon} size={16} color={colors.successDark} />
        </View>
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {editable ? (
        <>
          <Pressable
            onPress={disabled ? undefined : onPress}
            disabled={disabled || !onPress}
            style={({ pressed }) => [
              styles.selectRow,
              showError ? styles.inputError : null,
              pressed && !disabled ? styles.selectRowPressed : null,
              disabled ? styles.selectRowDisabled : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <Text
              style={[styles.selectRowText, !display ? styles.selectRowPlaceholder : null]}
              numberOfLines={1}
            >
              {display || placeholder || "Choose…"}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </Pressable>
          {showError ? <Text style={styles.fieldErrorText}>{errorText}</Text> : null}
        </>
      ) : (
        <View style={styles.readOnlyBox}>
          <Text style={styles.readOnlyText} numberOfLines={1}>
            {display || "—"}
          </Text>
        </View>
      )}
    </View>
  );
}
