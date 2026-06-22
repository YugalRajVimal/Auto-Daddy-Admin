import { colors } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, Text, TextInput, View } from "react-native";
import type { PickedImage } from "./add-vehicle-helpers";
import { addVehicleFormStyles as styles } from "./add-vehicle-form-styles";

export function AddVehicleField({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  keyboardType = "default",
  autoCapitalize = "sentences",
  maxLength,
  errorText,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: "default" | "number-pad";
  autoCapitalize?: "none" | "characters" | "sentences" | "words";
  maxLength?: number;
  errorText?: string | null;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={18} color="#70A8CF" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          style={styles.input}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
        />
      </View>
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

export function AddVehicleSelectField({
  label,
  placeholder,
  value,
  onPress,
  icon,
  disabled = false,
  errorText,
}: {
  label: string;
  placeholder: string;
  value: string;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  errorText?: string | null;
}) {
  const display = value.trim() ? value.trim() : placeholder;
  const displayColor = value.trim() ? colors.text : colors.textLight;
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.inputWrap,
          disabled ? { opacity: 0.5 } : null,
          pressed && !disabled ? { opacity: 0.9 } : null,
        ]}
        android_ripple={disabled ? undefined : { color: "rgba(22,101,52,0.08)" }}
      >
        <Ionicons name={icon} size={18} color="#70A8CF" />
        <Text style={[styles.input, { color: displayColor, paddingVertical: 0 }]} numberOfLines={1}>
          {display}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textLight} />
      </Pressable>
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

export function AddVehicleImageButton({
  title,
  image,
  onPress,
  onRemove,
  disabled = false,
}: {
  title: string;
  image: PickedImage | null;
  onPress: () => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.imageRow}>
      <Pressable style={[styles.imagePickBtn, disabled ? { opacity: 0.5 } : null]} onPress={onPress} disabled={disabled}>
        <Ionicons name="image-outline" size={18} color={colors.successDark} />
        <View style={{ flex: 1 }}>
          <Text style={styles.imagePickTitle}>{title}</Text>
          <Text style={styles.imagePickSub} numberOfLines={1}>
            {image?.fileName || (image ? "Image selected" : "Optional")}
          </Text>
        </View>
      </Pressable>
      {image ? (
        <Pressable style={styles.removeImageBtn} onPress={onRemove} hitSlop={8}>
          <Ionicons name="close" size={16} color={colors.danger} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function AddVehicleExistingImageTile({ label, uri }: { label: string; uri: string }) {
  return (
    <View style={styles.existingImageTile}>
      <Image source={{ uri }} style={styles.existingImage} contentFit="cover" transition={150} />
      <View style={styles.existingImageLabel}>
        <Text style={styles.existingImageLabelText}>{label}</Text>
      </View>
    </View>
  );
}
