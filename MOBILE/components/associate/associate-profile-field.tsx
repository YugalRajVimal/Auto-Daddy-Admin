import { associateColors } from "@/constants/associate-theme";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { associateProfileStyles as styles } from "./associate-profile-styles";

export function AssociateProfileField({
  label,
  value,
  icon,
  multiline,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <View style={styles.fieldIcon}>
          <Ionicons name={icon} size={16} color={associateColors.primaryDark} />
        </View>
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <View style={[styles.readOnlyBox, multiline ? styles.readOnlyBoxMultiline : null]}>
        <Text style={styles.readOnlyText} numberOfLines={multiline ? 4 : 1}>
          {value || "—"}
        </Text>
      </View>
    </View>
  );
}
