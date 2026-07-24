import { AssociatePlaceholderScreen } from "@/components/associate";
import { navigateToAppHome } from "@/lib/shop-owner-navigation";

export default function AssociateCustomersPage() {
  return (
    <AssociatePlaceholderScreen
      title="My Customers"
      subtitle="Customer list — coming soon"
      showTabBar={false}
      leadingMode="back"
      onBackPress={() => navigateToAppHome("/(associate)/(tabs)/home")}
    />
  );
}
