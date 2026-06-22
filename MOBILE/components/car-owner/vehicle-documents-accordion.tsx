import { styles } from "@/components/car-owner/my-vehicles/my-vehicles-screen-styles";
import { colors, fontSizes } from "@/constants/autodaddy";
import type { VehicleDocumentFieldKey, VehicleDocumentFieldRow, VehicleDocumentsSection } from "@/lib/car-owner-documents";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

function VehicleDocumentsHeader({
  thumbUri,
  plate,
  subtitle,
  expanded,
  onToggle,
  onThumbPress,
}: {
  thumbUri: string | null;
  plate: string;
  subtitle: string;
  expanded: boolean;
  onToggle: () => void;
  onThumbPress?: () => void;
}) {
  const thumb = (
    <View style={styles.collapsedThumb}>
      {thumbUri ? (
        <Image source={{ uri: thumbUri }} style={styles.collapsedThumbImg} contentFit="cover" transition={120} />
      ) : (
        <Ionicons name="car-sport-outline" size={28} color={colors.textLight} />
      )}
    </View>
  );

  return (
    <View style={styles.collapsedRow}>
      {onThumbPress && thumbUri ? (
        <Pressable onPress={onThumbPress} accessibilityRole="imagebutton" accessibilityLabel="View vehicle photo">
          {thumb}
        </Pressable>
      ) : (
        thumb
      )}
      <Pressable
        onPress={onToggle}
        style={headerStyles.titlePress}
        android_ripple={{ color: "rgba(37,99,235,0.08)" }}
        accessibilityRole="button"
        accessibilityLabel={expanded ? `Collapse documents for ${plate}` : `Expand documents for ${plate}`}
      >
        <Text style={styles.collapsedPlate} numberOfLines={1}>
          {plate}
        </Text>
        {subtitle ? (
          <Text style={headerStyles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </Pressable>
      <Pressable
        onPress={onToggle}
        style={styles.collapsedChevBtn}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={expanded ? "Collapse vehicle documents" : "Expand vehicle documents"}
      >
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={colors.successDark} />
      </Pressable>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  titlePress: { flex: 1, gap: 2, justifyContent: "center", minHeight: 44 },
  subtitle: { fontSize: fontSizes.sm, fontWeight: "600", color: colors.textMuted, lineHeight: 18 },
});

function DocumentFieldRow({
  field,
  busy,
  disabled,
  onView,
  onUpload,
}: {
  field: VehicleDocumentFieldRow;
  busy: boolean;
  disabled: boolean;
  onView: () => void;
  onUpload: () => void;
}) {
  const hasImage = Boolean(field.uri);

  return (
    <View style={styles.pathRow}>
      <Pressable
        onPress={hasImage ? onView : onUpload}
        disabled={disabled || busy}
        style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}
        accessibilityRole="button"
        accessibilityLabel={hasImage ? `View ${field.label}` : `Upload ${field.label}`}
      >
        <View style={styles.collapsedThumb}>
          {field.uri ? (
            <Image source={{ uri: field.uri }} style={styles.collapsedThumbImg} contentFit="cover" transition={120} />
          ) : (
            <Ionicons name="document-outline" size={24} color={colors.textLight} />
          )}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.pathLabel}>{field.label}</Text>
          <Text style={[styles.pathValue, !hasImage && styles.detailBadgePlaceholder]}>
            {hasImage ? "Tap to view" : "Not uploaded"}
          </Text>
        </View>
      </Pressable>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <Pressable
          onPress={onUpload}
          disabled={disabled || busy}
          hitSlop={8}
          style={styles.footerIconBtn}
          accessibilityRole="button"
          accessibilityLabel={hasImage ? `Replace ${field.label}` : `Upload ${field.label}`}
        >
          {busy ? (
            <ActivityIndicator size="small" color={colors.successDark} />
          ) : (
            <Ionicons name={hasImage ? "create-outline" : "cloud-upload-outline"} size={22} color={colors.primary} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

export function VehicleDocumentsAccordion({
  section,
  expanded,
  onToggle,
  onOpenViewer,
  busyField,
  mutating,
  onUploadField,
}: {
  section: VehicleDocumentsSection;
  expanded: boolean;
  onToggle: () => void;
  onOpenViewer: (title: string, paths: (string | null | undefined)[]) => void;
  busyField: string | null;
  mutating: boolean;
  onUploadField: (field: VehicleDocumentFieldKey) => void;
}) {
  const plate = section.title.trim() || "—";
  const thumbPress = section.thumbUri
    ? () => onOpenViewer("Vehicle photo", [section.thumbUri])
    : undefined;

  if (!expanded) {
    return (
      <View style={styles.vehicleCard}>
        <VehicleDocumentsHeader
          thumbUri={section.thumbUri}
          plate={plate}
          subtitle=""
          expanded={false}
          onToggle={onToggle}
          onThumbPress={thumbPress}
        />
      </View>
    );
  }

  return (
    <View style={styles.vehicleCard}>
      <VehicleDocumentsHeader
        thumbUri={section.thumbUri}
        plate={plate}
        subtitle={section.subtitle}
        expanded
        onToggle={onToggle}
        onThumbPress={thumbPress}
      />

      <View style={[styles.cardBody, styles.expandWrap]}>
        <View style={styles.paths}>
          {section.fields.map((field) => {
            const fieldBusy = busyField === `${section.vehicleId}:${field.key}`;
            return (
              <DocumentFieldRow
                key={field.key}
                field={field}
                busy={fieldBusy}
                disabled={mutating && !fieldBusy}
                onView={() => onOpenViewer(field.label, [field.path])}
                onUpload={() => onUploadField(field.key)}
              />
            );
          })}
        </View>
      </View>

    </View>
  );
}
