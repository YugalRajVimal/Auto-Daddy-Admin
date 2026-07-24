import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";
import { LoadingProgress, SurfaceCard } from "@/components/reusables";
import { colors, spacing, typography } from "@/constants/autodaddy";
import { useCarOwnerProductFeatures } from "@/hooks/use-car-owner-content";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function CarOwnerAboutPage() {
  const { items, loading, error } = useCarOwnerProductFeatures();

  return (
    <CarOwnerStackScreenFrame title="Features">
      {loading ? (
        <LoadingProgress />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : items.length === 0 ? (
        <Text style={styles.empty}>No features available yet.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {items.map((item, index) => (
            <SurfaceCard
              key={item._id ?? `${item.heading}-${index}`}
              shadow="card"
              style={styles.card}
            >
              <View style={styles.row}>
                <View style={styles.iconWrap}>
                  <Ionicons name="star-outline" size={18} color={colors.successDark} />
                </View>
                <View style={styles.copy}>
                  <Text style={styles.heading}>{item.heading}</Text>
                  {item.desc?.trim() ? <Text style={styles.desc}>{item.desc.trim()}</Text> : null}
                </View>
              </View>
            </SurfaceCard>
          ))}
        </ScrollView>
      )}
    </CarOwnerStackScreenFrame>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  card: { borderRadius: 18, padding: spacing.md },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(22,101,52,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, minWidth: 0 },
  heading: { ...typography.cardTitle, fontSize: 15 },
  desc: { ...typography.bodyMuted, lineHeight: 22, marginTop: 4 },
  empty: { ...typography.bodyMuted, textAlign: "center", marginTop: spacing.xl },
  error: { color: "#991B1B", textAlign: "center", marginTop: spacing.xl },
});
