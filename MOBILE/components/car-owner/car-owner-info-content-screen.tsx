import { spacing, typography } from "@/constants/autodaddy";
import { getCarOwnerDashboardDetails } from "@/lib/auth";
import type { CarOwnerDashboardApiResponse } from "@/types/car-owner-dashboard";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LoadingProgress, SurfaceCard } from "@/components/reusables";

type ContentPayload = { heading?: string | null; desc?: string | null };

type CarOwnerInfoContentScreenProps = {
  fallbackHeading: string;
  fallbackDesc: string;
  selectContent: (dashboard: CarOwnerDashboardApiResponse | null) => ContentPayload | null | undefined;
};

export function CarOwnerInfoContentScreen({
  fallbackHeading,
  fallbackDesc,
  selectContent,
}: CarOwnerInfoContentScreenProps) {
  const [dashboard, setDashboard] = useState<CarOwnerDashboardApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        try {
          const saved = await getCarOwnerDashboardDetails<CarOwnerDashboardApiResponse>();
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
  );
}

const styles = StyleSheet.create({
  // Parent screens (e.g. `CarOwnerStackScreenFrame`) already apply consistent
  // horizontal + top padding. Keep this component padding-free to avoid
  // double-padding across car-owner pages.
  body: { flex: 1 },
  card: { borderRadius: 18, padding: spacing.xl },
  heading: { ...typography.cardTitle, marginBottom: spacing.sm },
  desc: { ...typography.bodyMuted, lineHeight: 22 },
});
