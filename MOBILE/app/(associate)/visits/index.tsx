import { AssociatePlaceholderScreen } from "@/components/associate";
import { router } from "expo-router";

export default function AssociateVisitsPage() {
  return (
    <AssociatePlaceholderScreen
      title="My Visits"
      subtitle="Orders and visits — coming soon"
      showTabBar={false}
      leadingMode="back"
      onBackPress={() => router.replace("/(associate)/(tabs)/home")}
    />
  );
}
