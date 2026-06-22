import { colors, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { isAssociateRole } from "@/lib/associate-roles";
import { useOncePress } from "@/hooks/use-once-press";
import { navigateBackTarget } from "@/lib/shop-owner-navigation";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import type { ReactNode } from "react";
import { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  /** Drawer menu (default) or back navigation for stack-style screens */
  leadingMode?: "menu" | "back";
  onMenuPress?: () => void;
  onBackPress?: () => void;
  right?: ReactNode;
  showMenu?: boolean;
};

export function AppBar({
  title,
  leadingMode = "menu",
  onMenuPress,
  onBackPress,
  right,
  showMenu = true,
}: Props) {
  const navigation = useNavigation();
  const { meta } = useAuth();
  const role = (meta?.role ?? "").toLowerCase();
  const isCarOwner = role === "carowner" || role === "car-owner" || role === "car_owner";
  const defaultHome = isAssociateRole(meta?.role)
    ? "/(associate)/(tabs)/home"
    : isCarOwner
      ? "/(car-owner)/(tabs)/home"
      : "/(shop-owner)/(tabs)/home";
  const onBackPressRef = useRef(onBackPress);
  onBackPressRef.current = onBackPress;
  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
      return;
    }
    navigation.dispatch(DrawerActions.toggleDrawer());
  };
  const handleBackPress = useOncePress(() => {
    if (onBackPressRef.current) {
      onBackPressRef.current();
      return;
    }
    navigateBackTarget(undefined, defaultHome);
  });

  const left =
    leadingMode === "back" ? (
      <Pressable hitSlop={12} style={styles.leadBtn} onPress={() => handleBackPress?.()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
    ) : showMenu ? (
      <Pressable hitSlop={12} style={styles.leadBtn} onPress={handleMenuPress}>
        <Ionicons name="menu" size={24} color={colors.text} />
      </Pressable>
    ) : (
      <View style={styles.leadBtn} />
    );

  return (
    <View style={styles.row}>
      <View style={styles.leftCluster}>
        {left}
        <Text style={styles.title}>{title}</Text>
      </View>
      {right ?? <View style={styles.sideSpacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  leftCluster: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  leadBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { ...typography.screenTitle },
  sideSpacer: { width: 40 },
});
