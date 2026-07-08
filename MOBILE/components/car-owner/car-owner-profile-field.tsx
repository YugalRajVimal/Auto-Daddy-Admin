import { colors } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Text, TextInput, View } from "react-native";
import { carOwnerProfileStyles as styles } from "./car-owner-profile-styles";

export function CarOwnerProfileField({
  label,
  value,
  editable,
  onChangeText,
  icon,
  placeholder,
  keyboardType,
  autoCapitalize,
  multiline,
  errorText,
  maxLength,
  leadingSlot,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChangeText: (t: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  errorText?: string | null;
  maxLength?: number;
  leadingSlot?: ReactNode;
}) {
  const showError = Boolean(errorText);
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
          {leadingSlot ? (
            <View style={[styles.inputRowWrap, showError ? styles.inputRowWrapError : null]}>
              {leadingSlot}
              <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.textLight}
                style={[styles.inputRowField, multiline ? styles.inputMultiline : null]}
                keyboardType={keyboardType ?? "default"}
                autoCapitalize={autoCapitalize ?? "sentences"}
                multiline={multiline}
                maxLength={maxLength}
                editable
                underlineColorAndroid="transparent"
              />
            </View>
          ) : (
            <TextInput
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={colors.textLight}
              style={[styles.input, multiline ? styles.inputMultiline : null, showError ? styles.inputError : null]}
              keyboardType={keyboardType ?? "default"}
              autoCapitalize={autoCapitalize ?? "sentences"}
              multiline={multiline}
              maxLength={maxLength}
              editable
              underlineColorAndroid="transparent"
            />
          )}
          {showError ? <Text style={styles.fieldErrorText}>{errorText}</Text> : null}
        </>
      ) : (
        <View style={[styles.readOnlyBox, multiline ? styles.readOnlyBoxMultiline : null]}>
          <Text style={styles.readOnlyText} numberOfLines={multiline ? 3 : 1}>
            {value || "—"}
          </Text>
        </View>
      )}
    </View>
  );
}
