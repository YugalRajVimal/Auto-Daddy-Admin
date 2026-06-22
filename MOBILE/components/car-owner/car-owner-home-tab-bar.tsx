import { colors, spacing } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { carOwnerHomeStyles as styles } from "./car-owner-home-styles";

export const CAR_OWNER_TAB_BAR_OFFSET = 78;

export function CarOwnerHomeTabBar() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, spacing.md);

  function go(tab: "home" | "deals" | "documents" | "profile") {
    if (tab === "home") router.replace("/(car-owner)/(tabs)/home");
    else if (tab === "deals") router.push("/(car-owner)/deals");
    else if (tab === "documents") router.push("/(car-owner)/vehicle-documents");
    else router.push("/(car-owner)/profile");
  }

  return (
    <View style={[styles.bottomBar, { paddingBottom: bottomPad, height: CAR_OWNER_TAB_BAR_OFFSET + bottomPad }]}>
      <Pressable style={styles.bottomTab} onPress={() => go("home")} android_ripple={{ color: "rgba(22,101,52,0.12)" }}>
        <Ionicons name="home" size={26} color={colors.successDark} />
      </Pressable>
      <Pressable style={styles.bottomTab} onPress={() => go("deals")} android_ripple={{ color: "rgba(22,101,52,0.12)" }}>
        <Ionicons name="cash-outline" size={26} color={"rgba(22,101,52,0.55)"} />
      </Pressable>
      <Pressable style={styles.bottomTab} onPress={() => go("documents")} android_ripple={{ color: "rgba(22,101,52,0.12)" }}>
        <Ionicons name="document-text-outline" size={26} color={"rgba(22,101,52,0.55)"} />
      </Pressable>
      <Pressable style={styles.bottomTab} onPress={() => go("profile")} android_ripple={{ color: "rgba(22,101,52,0.12)" }}>
        <Ionicons name="person-outline" size={26} color={"rgba(22,101,52,0.55)"} />
      </Pressable>
    </View>
  );
}
