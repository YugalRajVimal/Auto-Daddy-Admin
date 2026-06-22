import { ShopOwnerNotificationList } from "@/components/shop-owner/shop-owner-notification-list";
import { StackScreenFrame } from "@/components/reusables";
import { colors, gradients } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { StyleSheet, View } from "react-native";

export default function ShopOwnerNotificationsPage() {
  const { token } = useAuth();

  return (
    <StackScreenFrame
      title="Notifications"
      backgroundColor={colors.bgProfile}
      headerGradient={[...gradients.dealsHeader]}
      scroll={false}
      backTo="/(shop-owner)/(tabs)/home"
    >
      <View style={styles.body}>
        <ShopOwnerNotificationList authToken={token} enabled />
      </View>
    </StackScreenFrame>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
});
