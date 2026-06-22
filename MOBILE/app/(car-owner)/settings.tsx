import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";
import { colors, fontSizes, shadows, spacing, typography } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export default function CarOwnerSettings() {
  return (
    <CarOwnerStackScreenFrame title="Settings">
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.icon}>
            <Ionicons name="settings-outline" size={22} color={colors.successDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Preferences</Text>
            <Text style={styles.subtitle}>Coming soon.</Text>
          </View>
        </View>
      </View>
    </CarOwnerStackScreenFrame>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: spacing.md,
    ...shadows.card,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.successMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...typography.cardTitle, color: colors.text, fontSize: fontSizes.lg },
  subtitle: { ...typography.bodyMuted, marginTop: 2 },
});

