import { SectionHeader } from "@/components/reusables";
import { colors, fontSizes, gradients, radii, shadows, spacing } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

export function ThoughtOfTheDay({ quote = "Thought of the day here" }: { quote?: string }) {
  return (
    <>
      <SectionHeader title="Thought of the Day" />
      <LinearGradient
        colors={[...gradients.homeQuote]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.quoteCard, shadows.soft]}
      >
        <View style={styles.quoteTop}>
          <Ionicons name="bulb-outline" size={18} color={colors.primary} />
          <Text style={styles.quoteTag}>TODAY&apos;S THOUGHT</Text>
        </View>
        <Text style={styles.quote}>
          {quote}
        </Text>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  quoteCard: {
    borderRadius: radii.xxxl,
    padding: spacing.xl + 2,
    borderWidth: 1,
    borderColor: "#E3ECFF",
  },
  quoteTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    marginBottom: spacing.sm + 2,
  },
  quoteTag: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.8,
  },
  quote: {
    fontSize: fontSizes.xxl,
    fontStyle: "italic",
    color: colors.text,
    lineHeight: 30,
    fontWeight: "600",
  },
});
