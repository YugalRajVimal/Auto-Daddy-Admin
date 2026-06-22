import { colors } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View } from "react-native";
import { styles } from "./my-vehicles-screen-styles";

export function MyVehiclesHero({
  subtitle,
  onRefresh,
  onAddVehicle,
}: {
  subtitle: string;
  onRefresh: () => void;
  onAddVehicle: () => void;
}) {
  return (
    <LinearGradient
      colors={["#E7FBEF", "#F8FFFB", colors.white]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerCard}
    >
      <View style={styles.heroTopRow}>
        <View style={styles.icon}>
          <Ionicons name="car-sport-outline" size={24} color={colors.successDark} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.title}>{subtitle}</Text>
        </View>
        <Pressable onPress={onRefresh} hitSlop={10} style={styles.refreshBtn} android_ripple={{ color: "rgba(15,23,42,0.08)" }}>
          <Ionicons name="refresh" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
      <Pressable onPress={onAddVehicle} style={styles.addHeroBtn} android_ripple={{ color: "rgba(255,255,255,0.18)" }}>
        <Ionicons name="add-circle" size={20} color={colors.white} />
        <Text style={styles.addHeroText}>Add a vehicle</Text>
      </Pressable>
    </LinearGradient>
  );
}
