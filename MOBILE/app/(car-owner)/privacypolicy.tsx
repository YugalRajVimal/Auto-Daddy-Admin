import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";
import { LoadingProgress, SurfaceCard } from "@/components/reusables";
import { spacing, typography } from "@/constants/autodaddy";
import { useCarOwnerPrivacyDoc } from "@/hooks/use-car-owner-content";
import { ScrollView, StyleSheet, Text } from "react-native";

export default function CarOwnerPrivacyPolicyPage() {
  const { heading, description, loading, error } = useCarOwnerPrivacyDoc("privacy");

  return (
    <CarOwnerStackScreenFrame title="Privacy Policy">
      {loading ? (
        <LoadingProgress />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <SurfaceCard shadow="card" style={styles.card}>
            <Text style={styles.heading}>{heading}</Text>
            <Text style={styles.desc}>{description || "—"}</Text>
          </SurfaceCard>
        </ScrollView>
      )}
    </CarOwnerStackScreenFrame>
  );
}

const styles = StyleSheet.create({
  body: { paddingBottom: spacing.xl },
  card: { borderRadius: 18, padding: spacing.xl },
  heading: { ...typography.cardTitle, marginBottom: spacing.sm },
  desc: { ...typography.bodyMuted, lineHeight: 22 },
  error: { color: "#991B1B", textAlign: "center", marginTop: spacing.xl },
});
