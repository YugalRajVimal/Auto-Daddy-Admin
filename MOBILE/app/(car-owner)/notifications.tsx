import { CarOwnerNotificationList } from "@/components/car-owner/car-owner-notification-list";
import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";
import { useAuth } from "@/context/auth-provider";
import { StyleSheet, View } from "react-native";

export default function CarOwnerNotificationsPage() {
  const { token } = useAuth();

  return (
    <CarOwnerStackScreenFrame title="Notifications" scroll={false} backTo="/(car-owner)/(tabs)/home">
      <View style={styles.body}>
        <CarOwnerNotificationList authToken={token} enabled />
      </View>
    </CarOwnerStackScreenFrame>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
});
