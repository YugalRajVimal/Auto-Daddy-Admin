import { AssociatePlaceholderScreen } from "@/components/associate";
import { router } from "expo-router";

export default function AssociateWalletPage() {
  return (
    <AssociatePlaceholderScreen
      title="Wallet"
      subtitle="Collections and wallet — coming soon"
      showTabBar={false}
      leadingMode="back"
      onBackPress={() => router.replace("/(associate)/(tabs)/home")}
    />
  );
}
