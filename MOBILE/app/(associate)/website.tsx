import {
  AssociateScrollScreenFrame,
  AssociateWebsitePreviewCard,
} from "@/components/associate";
import { colors, fontSizes, spacing, typography } from "@/constants/autodaddy";
import { DUMMY_ASSOCIATE_WEBSITES } from "@/lib/associate-dummy-data";
import { StyleSheet, Text, View } from "react-native";

export default function AssociateWebsitePage() {
  return (
    <AssociateScrollScreenFrame title="Website">
      <Text style={styles.intro}>
        Website templates your shops can use. Previews are sample links for demo purposes.
      </Text>

      {DUMMY_ASSOCIATE_WEBSITES.map((site) => (
        <AssociateWebsitePreviewCard key={site.id} website={site} />
      ))}

      <View style={styles.footerSpacer} />
    </AssociateScrollScreenFrame>
  );
}

const styles = StyleSheet.create({
  intro: {
    ...typography.bodyMuted,
    fontSize: fontSizes.base,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  footerSpacer: { height: spacing.sm },
});
