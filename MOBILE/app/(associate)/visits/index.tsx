import { AssociatePlaceholderScreen } from "@/components/associate";
import { navigateToAppHome } from "@/lib/shop-owner-navigation";

export default function AssociateVisitsPage() {
  return (
    <AssociatePlaceholderScreen
      title="My Visits"
      subtitle="Orders and visits — coming soon"
      showTabBar={false}
      leadingMode="back"
      onBackPress={() => navigateToAppHome("/(associate)/(tabs)/home")}
    />
  );
}
