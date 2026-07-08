import { spacing, typography } from "@/constants/autodaddy";
import { getDashboardDetails } from "@/lib/auth";
import type { DashboardDetailsResponse } from "@/types/dashboard-details";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LoadingProgress } from "../feedback/loading-progress";
import { SurfaceCard } from "../ui/surface-card";

type ContentPayload = { heading?: string | null; desc?: string | null };
type InfoContentScreenProps = {
  title: string;
  fallbackHeading: string;
  fallbackDesc: string;
  selectContent: (dashboard: DashboardDetailsResponse | null) => ContentPayload | null | undefined;
};

export function InfoContentScreen({
  title,
  fallbackHeading,
  fallbackDesc,
  selectContent,
}: InfoContentScreenProps) {
  const [dashboard, setDashboard] = useState<DashboardDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        try {
          const saved = await getDashboardDetails<DashboardDetailsResponse>();
          if (!cancelled) {
            setDashboard(saved);
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const content = selectContent(dashboard);
  const heading = content?.heading ?? fallbackHeading;
  const desc = content?.desc ?? fallbackDesc;
  return (
    // <StackScreenFrame title={title} backgroundColor={colors.bg}>
    <View style={styles.body}>
      {isLoading ? (
        <LoadingProgress />
      ) : (
        <SurfaceCard shadow="card" style={styles.card}>
          <Text style={styles.heading}>{heading}</Text>
          <Text style={styles.desc}>{desc}</Text>
        </SurfaceCard>
      )}
    </View>
    // </StackScreenFrame>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  card: { borderRadius: 18, padding: spacing.xl },
  heading: { ...typography.cardTitle, marginBottom: spacing.sm },
  desc: { ...typography.bodyMuted, lineHeight: 22 },
});
