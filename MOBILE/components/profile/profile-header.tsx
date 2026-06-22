import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ColorValue, Image, Pressable, StyleSheet, Text, View } from "react-native";

type ProfileHeaderProps = {
  name: string;
  isAutoShopOwner: boolean;
  onEditPress: () => void;
  gradient: readonly string[];
  businessLogoUri?: string | null;
  bannerUri?: string | null;
  /** Shown below the name for shop owners (e.g. business name). */
  badgeLabel?: string;
};

export function ProfileHeader({
  name,
  isAutoShopOwner,
  onEditPress,
  gradient,
  businessLogoUri,
  bannerUri,
  badgeLabel,
}: ProfileHeaderProps) {
  return (
    <View style={styles.heroWrap}>
      {bannerUri ? (
        <Image source={{ uri: bannerUri }} style={styles.bannerImage} resizeMode="cover" />
      ) : null}
      <LinearGradient colors={gradient as readonly [ColorValue, ColorValue, ...ColorValue[]]} style={styles.heroBody}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <View style={styles.avatarPattern}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.patternRow}>
                  {[0, 1, 2, 3].map((j) => (
                    <View key={j} style={styles.patternCell} />
                  ))}
                </View>
              ))}
            </View>
            {businessLogoUri ? (
              <Image source={{ uri: businessLogoUri }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Ionicons name="person" size={48} color={colors.primaryDark} style={styles.avatarIcon} />
            )}
          </View>
          <Pressable style={({ pressed }) => [styles.editAvatar, pressed && styles.editAvatarPressed]} onPress={onEditPress}>
            <Ionicons name="pencil" size={16} color={colors.white} />
          </Pressable>
        </View>
      </View>
      <Text style={styles.name}>{name}</Text>
      {isAutoShopOwner && badgeLabel ? (
        <View style={styles.roleBadge}>
          {/* <Ionicons name="checkmark-circle" size={16} color={colors.white} /> */}
          <Text style={styles.roleText}>{badgeLabel}</Text>
        </View>
      ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    overflow: "hidden",
  },
  bannerImage: {
    width: "100%",
    height: 128,
    backgroundColor: colors.bgAlt,
  },
  heroBody: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    alignItems: "center",
  },
  avatarWrap: { alignItems: "center", marginBottom: spacing.md },
  avatarContainer: { width: 112, height: 112, position: "relative" },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: colors.white,
    backgroundColor: colors.primaryMutedBg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 56,
  },
  patternRow: { flexDirection: "row" },
  patternCell: {
    width: 28,
    height: 28,
    borderWidth: 0.5,
    borderColor: "rgba(37,99,235,0.18)",
  },
  avatarIcon: { position: "absolute" },
  editAvatar: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.orangeAccent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
  },
  editAvatarPressed: { opacity: 0.78 },
  name: { fontSize: fontSizes.hero, fontWeight: "800", color: colors.primaryBlue900, marginBottom: spacing.sm },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radii.round,
  },
  roleText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: fontSizes.lg,
    letterSpacing: 0.5,
  },
});
