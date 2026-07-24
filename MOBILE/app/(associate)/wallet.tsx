import { AssociatePlaceholderScreen } from "@/components/associate";
import { navigateToAppHome } from "@/lib/shop-owner-navigation";

export default function AssociateWalletPage() {
  return (
    <AssociatePlaceholderScreen
      title="Wallet"
      subtitle="Collections and wallet — coming soon"
      showTabBar={false}
      leadingMode="back"
      onBackPress={() => navigateToAppHome("/(associate)/(tabs)/home")}
    />
  );
}
