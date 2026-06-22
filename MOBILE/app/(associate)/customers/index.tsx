import { AssociatePlaceholderScreen } from "@/components/associate";
import { router } from "expo-router";

export default function AssociateCustomersPage() {
  return (
    <AssociatePlaceholderScreen
      title="My Customers"
      subtitle="Customer list — coming soon"
      showTabBar={false}
      leadingMode="back"
      onBackPress={() => router.replace("/(associate)/(tabs)/home")}
    />
  );
}
