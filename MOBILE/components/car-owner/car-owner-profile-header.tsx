import { colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  photoUri: string | null;
  /** Tap avatar FAB → pick & upload new photo (always direct). */
  onAvatarPhotoPress: () => void;
  isEditing?: boolean;
  actionsDisabled?: boolean;
  saving?: boolean;
  /** View mode: enter edit mode. */
  onEditPress: () => void;
  /** Edit mode: cancel changes. */
  onCancelPress?: () => void;
  /** Edit mode: save changes. */
  onSavePress?: () => void;
  onLogoutPress?: () => void;
};

/** Hero strip: avatar + side-by-side Edit profile / Log out (details live in the form below). */
export function CarOwnerProfileHeader({
  photoUri,
  onAvatarPhotoPress,
  isEditing,
  actionsDisabled,
  saving,
  onEditPress,
  onCancelPress,
  onSavePress,
  onLogoutPress,
}: Props) {
  return (
    <LinearGradient
      colors={["#8FCFA8", "#C5EDD4", "#E8FBF0", "#FFFFFF"]}
      locations={[0, 0.28, 0.62, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={[styles.heroBody, { marginHorizontal: -spacing.screenHorizontal }]}
    >
      <View style={styles.avatarCol}>
        <View style={styles.avatarOuter}>
          <View style={styles.avatarInner}>
            <View style={styles.avatar}>
              <LinearGradient
                colors={["rgba(255,255,255,0.35)", "transparent"]}
                style={styles.avatarSheen}
                pointerEvents="none"
              />
              <View style={styles.avatarPattern} pointerEvents="none">
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={styles.patternRow}>
                    {[0, 1, 2, 3].map((j) => (
                      <View key={j} style={styles.patternCell} />
                    ))}
                  </View>
                ))}
              </View>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImage} contentFit="cover" transition={150} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={46} color={colors.successDark} />
                </View>
              )}
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            disabled={actionsDisabled}
            onPress={onAvatarPhotoPress}
            style={({ pressed }) => [
              styles.photoFab,
              pressed && !actionsDisabled && styles.photoFabPressed,
              actionsDisabled && styles.actionDisabled,
            ]}
          >
            <LinearGradient
              colors={[colors.successDark, "#14532D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.photoFabFill}
            >
              <Ionicons name="camera" size={17} color={colors.white} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      <View style={styles.actionsRow}>
        {isEditing ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              disabled={actionsDisabled}
              onPress={onCancelPress}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionCancel,
                pressed && !actionsDisabled && styles.actionPressed,
                actionsDisabled && styles.actionDisabled,
              ]}
              android_ripple={{ color: "rgba(0,0,0,0.08)" }}
            >
              <Text style={styles.actionCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save"
              disabled={actionsDisabled}
              onPress={onSavePress}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionSave,
                pressed && !actionsDisabled && styles.actionPressed,
                actionsDisabled && styles.actionDisabled,
              ]}
              android_ripple={{ color: "rgba(255,255,255,0.2)" }}
            >
              <Text style={styles.actionSaveText}>{saving ? "Saving…" : "Save"}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              disabled={actionsDisabled}
              onPress={onEditPress}
              style={({ pressed, hovered }) => [
                styles.actionBtn,
                styles.actionEdit,
                Platform.OS === "web" && hovered ? styles.actionEditHover : null,
                pressed && !actionsDisabled && styles.actionPressed,
                actionsDisabled && styles.actionDisabled,
              ]}
              android_ripple={{ color: "rgba(22,101,52,0.12)" }}
            >
              <Ionicons name="create-outline" size={18} color={colors.successDark} />
              <Text style={styles.actionEditText}>Edit profile</Text>
            </Pressable>

            {onLogoutPress ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Log out"
                disabled={actionsDisabled}
                onPress={onLogoutPress}
                style={({ pressed, hovered }) => [
                  styles.actionBtn,
                  styles.actionLogout,
                  Platform.OS === "web" && hovered ? styles.actionLogoutHover : null,
                  pressed && !actionsDisabled && styles.actionPressed,
                  actionsDisabled && styles.actionDisabled,
                ]}
                android_ripple={{ color: "rgba(239,68,68,0.12)" }}
              >
                <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                <Text style={styles.actionLogoutText}>Log out</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const avatarLift = Platform.select({
  ios: {
    shadowColor: "#14532D",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
  },
  android: { elevation: 12 },
  default: {},
});

const styles = StyleSheet.create({
  heroBody: {
    marginTop: 0 - spacing.lg,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radii.hero + 6,
    borderBottomRightRadius: radii.hero + 6,
    alignItems: "center",
    overflow: "hidden",
  },
  avatarCol: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  avatarOuter: {
    position: "relative",
    paddingBottom: 4,
    ...avatarLift,
  },
  photoFab: {
    position: "absolute",
    right: -4,
    bottom: -2,
    borderRadius: 22,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  photoFabFill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
  },
  photoFabPressed: { opacity: 0.88, transform: [{ scale: 0.96 }] },
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
    backgroundColor: colors.successMuted,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSheen: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  avatarPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.38,
  },
  patternRow: { flexDirection: "row" },
  patternCell: {
    width: 29.5,
    height: 29.5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(22,101,52,0.18)",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 56,
  },
  avatarPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
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
    borderColor: colors.successDark,
    ...shadows.soft,
  },
  actionEditHover: {
    backgroundColor: colors.white,
    borderColor: colors.successDark,
  },
  actionEditText: {
    fontSize: fontSizes.sm,
    fontWeight: "900",
    color: colors.successDark,
  },
  actionLogout: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.danger,
    ...shadows.soft,
  },
  actionLogoutHover: {
    backgroundColor: colors.white,
    borderColor: colors.danger,
  },
  actionLogoutText: {
    fontSize: fontSizes.sm,
    fontWeight: "900",
    color: colors.danger,
  },
  actionCancel: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  actionCancelText: {
    fontSize: fontSizes.sm,
    fontWeight: "900",
    color: colors.text,
  },
  actionSave: {
    backgroundColor: colors.successDark,
    ...Platform.select({
      ios: {
        shadowColor: "#14532D",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  actionSaveText: {
    fontSize: fontSizes.sm,
    fontWeight: "900",
    color: colors.white,
  },
  actionPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  actionDisabled: {
    opacity: 0.5,
  },
});
