import { associateColors, associateGradients } from "@/constants/associate-theme";
import { colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  photoUri: string | null;
  onEditPress: () => void;
  onLogoutPress: () => void;
};

export function AssociateProfileHeader({ photoUri, onEditPress, onLogoutPress }: Props) {
  return (
    <LinearGradient
      colors={[...associateGradients.profileHero, "#FFFFFF"]}
      locations={[0, 0.35, 0.72, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[styles.heroBody, { marginHorizontal: -spacing.screenHorizontal }]}
    >
      <View style={styles.avatarCol}>
        <View style={styles.avatarOuter}>
          <View style={styles.avatarInner}>
            <View style={styles.avatar}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImage} contentFit="cover" transition={150} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={46} color={associateColors.primaryDark} />
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          onPress={onEditPress}
          style={({ pressed, hovered }) => [
            styles.actionBtn,
            styles.actionEdit,
            Platform.OS === "web" && hovered ? styles.actionEditHover : null,
            pressed && styles.actionPressed,
          ]}
        >
          <Ionicons name="create-outline" size={18} color={associateColors.primaryDark} />
          <Text style={styles.actionEditText}>Edit profile</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out"
          onPress={onLogoutPress}
          style={({ pressed, hovered }) => [
            styles.actionBtn,
            styles.actionLogout,
            Platform.OS === "web" && hovered ? styles.actionLogoutHover : null,
            pressed && styles.actionPressed,
          ]}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.actionLogoutText}>Log out</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const avatarLift = Platform.select({
  ios: {
    shadowColor: associateColors.primaryDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
  },
  android: { elevation: 12 },
  default: {},
});

const styles = StyleSheet.create({
  heroBody: {
    marginTop: -spacing.sm,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radii.hero + 6,
    borderBottomRightRadius: radii.hero + 6,
    alignItems: "center",
    overflow: "hidden",
  },
  avatarCol: { alignItems: "center", marginBottom: spacing.lg },
  avatarOuter: { position: "relative", paddingBottom: 4, ...avatarLift },
  avatarInner: {
    borderRadius: 62,
    padding: 3,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  avatar: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: associateColors.primaryMuted,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 56 },
  avatarPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.sm,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  actionBtn: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
  },
  actionEdit: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: associateColors.primaryDark,
    ...shadows.soft,
  },
  actionEditHover: { backgroundColor: colors.white },
  actionEditText: {
    fontSize: fontSizes.sm,
    fontWeight: "900",
    color: associateColors.primaryDark,
  },
  actionLogout: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.danger,
    ...shadows.soft,
  },
  actionLogoutHover: { backgroundColor: colors.white },
  actionLogoutText: {
    fontSize: fontSizes.sm,
    fontWeight: "900",
    color: colors.danger,
  },
  actionPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
});
