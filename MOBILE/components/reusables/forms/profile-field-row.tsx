import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fontSizes, spacing, typography } from "@/constants/autodaddy";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  showDivider?: boolean;
  onPress?: () => void;
  editable?: boolean;
  inputValue?: string;
  onChangeText?: (value: string) => void;
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  inputEditable?: boolean;
  leftAddon?: React.ReactNode;
  maxLength?: number;
  errorText?: string | null;
};

export function ProfileFieldRow({ icon, label, value, showDivider, onPress, editable = false, inputValue, onChangeText, keyboardType = "default", autoCapitalize = "sentences", multiline = false, inputEditable = true, leftAddon, maxLength, errorText }: Props) {
  return (
    <View>
      {showDivider ? <View style={styles.divider} /> : null}
      <Pressable
        style={({ pressed }) => [
          styles.fieldRow,
          editable && styles.fieldRowEditing,
          !editable && pressed && styles.fieldRowPressed,
        ]}
        onPress={onPress ?? (() => {})}
        disabled={editable}
      >
        <View style={styles.fieldIcon}><Ionicons name={icon} size={16} color={colors.primary} /></View>
        <View style={styles.fieldText}>
          <Text style={typography.label}>{label}</Text>
          {editable ? (
            <View style={styles.inputWrap}>
              {leftAddon ? <View style={styles.leftAddon}>{leftAddon}</View> : null}
              <View style={{ flex: 1 }}>
                <TextInput
                  value={inputValue ?? value}
                  onChangeText={onChangeText}
                  style={[
                    styles.inlineInput,
                    !inputEditable && styles.inlineInputDisabled,
                    multiline && styles.inlineInputMultiline,
                  ]}
                  keyboardType={keyboardType}
                  autoCapitalize={autoCapitalize}
                  multiline={multiline}
                  editable={inputEditable}
                  maxLength={maxLength}
                  placeholder={inputEditable ? undefined : "Not editable"}
                  placeholderTextColor={colors.textLight}
                />
                {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
              </View>
            </View>
          ) : (
            <Text style={styles.value}>{value}</Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  fieldRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  fieldRowEditing: {
    backgroundColor: colors.bgAlt,
    borderRadius: 10,
  },
  fieldRowPressed: { opacity: 0.72 },
  fieldIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryMutedBg, alignItems: "center", justifyContent: "center" },
  fieldText: { flex: 1 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  leftAddon: { alignSelf: "stretch", justifyContent: "center" },
  inlineInput: {
    flex: 1,
    minHeight: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginTop: 1,
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.text,
    backgroundColor: "transparent",
  },
  inlineInputMultiline: { minHeight: 44, textAlignVertical: "top" },
  inlineInputDisabled: {
    color: colors.textLight,
    borderBottomColor: "#D0D7E2",
  },
  errorText: { marginTop: 4, color: colors.danger, fontSize: fontSizes.xs, fontWeight: "700" },
  value: { fontSize: fontSizes.base, fontWeight: "700", color: colors.text },
});
