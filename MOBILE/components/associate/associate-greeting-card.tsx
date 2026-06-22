import { associateColors, associateGradients } from "@/constants/associate-theme";
import { colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import { getAssociateOnlineStatus, setAssociateOnlineStatus } from "@/lib/associate-online-status";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import { Image, StyleSheet, Switch, Text, View } from "react-native";

type Props = {
  displayName?: string;
  profilePhotoUri?: string | null;
};

export function AssociateGreetingCard({
  displayName = "Associate",
  profilePhotoUri,
}: Props) {
  const [online, setOnline] = useState(true);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const photoUri = normalizeMediaUrl(profilePhotoUri);
  const hasPhoto = Boolean(photoUri) && !logoLoadFailed;

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const stored = await getAssociateOnlineStatus();
      if (mounted) setOnline(stored);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onToggleOnline = useCallback(async (next: boolean) => {
    setOnline(next);
    await setAssociateOnlineStatus(next);
  }, []);

  return (
    <LinearGradient
      colors={[...associateGradients.profileHero]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, shadows.card]}
    >
      <View style={styles.top}>
        <View style={styles.avatarRing}>
          {hasPhoto ? (
            <Image
              source={{ uri: photoUri ?? undefined }}
              style={styles.avatarImage}
              onError={() => setLogoLoadFailed(true)}
            />
          ) : (
            <Ionicons name="person-outline" size={28} color={associateColors.primary} />
          )}
        </View>
        <View style={styles.textCol}>
          <Text style={styles.name}>{displayName}</Text>
          <View style={styles.badge}>
            <Ionicons name="briefcase-outline" size={14} color={associateColors.badgeText} />
            <Text style={styles.badgeText}>Business Associate</Text>
          </View>
        </View>
      </View>

      <View style={[styles.statusRow, online ? styles.statusRowOnline : styles.statusRowOffline]}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, online ? styles.dotOnline : styles.dotOffline]} />
          <Text style={styles.statusLabel}>{online ? "I am online" : "I am offline"}</Text>
        </View>
        <Switch
          value={online}
          onValueChange={(next) => void onToggleOnline(next)}
          trackColor={{ false: colors.switchTrackOff, true: associateColors.switchTrackOn }}
          thumbColor={online ? associateColors.switchThumbOn : associateColors.switchThumbOff}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xxl,
    padding: spacing.xl + 2,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
  },
  top: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  textCol: { flex: 1, marginLeft: spacing.sm },
  name: { fontSize: fontSizes.hero, fontWeight: "900", color: colors.text },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.round,
    backgroundColor: associateColors.badgeBg,
  },
  badgeText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: associateColors.badgeText,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
    borderWidth: 1,
  },
  statusRowOnline: {
    backgroundColor: associateColors.onlineRowBg,
    borderColor: associateColors.onlineRowBorder,
  },
  statusRowOffline: {
    backgroundColor: associateColors.offlineRowBg,
    borderColor: associateColors.offlineRowBorder,
  },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  dotOnline: { backgroundColor: associateColors.onlineDot },
  dotOffline: { backgroundColor: associateColors.offlineDot },
  statusLabel: { fontSize: fontSizes.xl, fontWeight: "800", color: colors.text },
});
