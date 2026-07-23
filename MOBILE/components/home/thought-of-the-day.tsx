import { SectionHeader } from "@/components/reusables";
import { colors, fontSizes, gradients, radii, shadows, spacing } from "@/constants/autodaddy";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Image, StyleSheet, Text } from "react-native";

type Props = {
  quote?: string;
  subject?: string;
  imageUri?: string | null;
};

export function ThoughtOfTheDay({
  quote = "Thought of the day here",
  subject,
  imageUri,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const title = subject?.trim() || "Thought of the Day";
  const showImage = Boolean(imageUri) && !imageFailed;

  return (
    <>
      <SectionHeader title={title} />
      <LinearGradient
        colors={[...gradients.homeQuote]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.quoteCard, shadows.soft]}
      >
        {showImage ? (
          <Image
            source={{ uri: imageUri ?? undefined }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : null}
        <Text style={styles.quote}>{quote}</Text>
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
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 140,
    borderRadius: radii.xl,
    marginBottom: spacing.md,
    backgroundColor: "#EEF2FF",
  },
  quote: {
    fontSize: fontSizes.xxl,
    fontStyle: "italic",
    color: colors.text,
    lineHeight: 30,
    fontWeight: "600",
  },
});
