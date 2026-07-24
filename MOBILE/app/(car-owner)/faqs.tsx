import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";
import { LoadingProgress, SurfaceCard } from "@/components/reusables";
import { colors, spacing, typography } from "@/constants/autodaddy";
import { useCarOwnerFaqs } from "@/hooks/use-car-owner-content";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function CarOwnerFaqsPage() {
  const { items, loading, error } = useCarOwnerFaqs();
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <CarOwnerStackScreenFrame title="FAQs">
      {loading ? (
        <LoadingProgress />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : items.length === 0 ? (
        <Text style={styles.empty}>No FAQs available yet.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {items.map((item, index) => {
            const open = openIndex === index;
            return (
              <SurfaceCard key={`${item.question}-${index}`} shadow="card" style={styles.card}>
                <Pressable
                  onPress={() => setOpenIndex(open ? -1 : index)}
                  style={styles.row}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                >
                  <Text style={styles.question}>{item.question}</Text>
                  <Ionicons
                    name={open ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>
                {open ? <Text style={styles.answer}>{item.answer}</Text> : null}
              </SurfaceCard>
            );
          })}
        </ScrollView>
      )}
    </CarOwnerStackScreenFrame>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  card: { borderRadius: 18, padding: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  question: { ...typography.cardTitle, flex: 1, fontSize: 15 },
  answer: { ...typography.bodyMuted, lineHeight: 22, marginTop: spacing.sm },
  empty: { ...typography.bodyMuted, textAlign: "center", marginTop: spacing.xl },
  error: { color: "#991B1B", textAlign: "center", marginTop: spacing.xl },
});
