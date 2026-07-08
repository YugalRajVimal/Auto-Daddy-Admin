import { Fab, StackScreenFrame, SurfaceCard, useToast } from "@/components/reusables";
import { colors, fontSizes, radii, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useTeamMembers } from "@/hooks/profile/use-team-members";
import { resolveShopOwnerBackTo } from "@/lib/shop-owner-navigation";
import { useOncePress } from "@/hooks/use-once-press";
import type { TeamMember } from "@/types/team-member";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

function memberId(member: TeamMember) {
  return member._id ?? member.id ?? null;
}

function isActiveMember(member: TeamMember) {
  const raw = member as TeamMember & {
    isActive?: boolean;
    active?: boolean;
    status?: string;
  };
  if (typeof raw.isActive === "boolean") {
    return raw.isActive;
  }
  if (typeof raw.active === "boolean") {
    return raw.active;
  }
  if (typeof raw.status === "string") {
    return raw.status.toLowerCase() === "active";
  }
  return true;
}

function confirmDeleteTeamMember(member: TeamMember, deleteTeamMember: (m: TeamMember) => void) {
  const id = memberId(member);
  if (!id) {
    return;
  }
  const label = (member.name ?? member.phone ?? "this team member").trim() || "this team member";
  Alert.alert("Delete team member?", `Remove ${label} from your team? This cannot be undone.`, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: () => void deleteTeamMember(member) },
  ]);
}

export default function TeamsPage() {
  const params = useLocalSearchParams<{ backTo?: string | string[]; from?: string | string[] }>();
  const backToParam = Array.isArray(params.backTo) ? params.backTo[0] : params.backTo;
  const fromParam = Array.isArray(params.from) ? params.from[0] : params.from;
  const backTo = resolveShopOwnerBackTo(backToParam, fromParam);
  const { token, meta } = useAuth();
  const { showToast } = useToast();
  const isAutoShopOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";

  const teamToast = useCallback(
    (message: string, type: "error" | "success") => showToast(message, { type }),
    [showToast]
  );

  const {
    teamMembers,
    teamMembersCount,
    submitting,
    isFetching,
    fetchTeamMembers,
    deleteTeamMember,
  } = useTeamMembers([], token, isAutoShopOwner, teamToast);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTeamMembers();
    } finally {
      setRefreshing(false);
    }
  }, [fetchTeamMembers]);

  useFocusEffect(
    useCallback(() => {
      void fetchTeamMembers();
      return undefined;
    }, [fetchTeamMembers])
  );

  const activeMembersCount = useMemo(
    () => teamMembers.filter((member) => isActiveMember(member)).length,
    [teamMembers]
  );

  const handleOpenAdd = useOncePress(() => {
    router.push({
      pathname: "/(shop-owner)/team-member",
      params: { mode: "add", backTo: "/(shop-owner)/teams" },
    });
  });

  const handleOpenEdit = useOncePress((member: TeamMember) => {
    const id = memberId(member);
    if (!id) {
      return;
    }
    router.push({
      pathname: "/(shop-owner)/team-member",
      params: {
        mode: "edit",
        backTo: "/(shop-owner)/teams",
        id,
        name: member.name ?? "",
        phone: member.phone ?? "",
        email: member.email ?? "",
        designation: member.designation ?? "",
        photo: member.profilePhoto ?? "",
        active: String(isActiveMember(member)),
      },
    });
  });

  return (
    <StackScreenFrame
      title="Team Members"
      backgroundColor={colors.bgProfile}
      scroll={false}
      backTo={backTo}
      headerGradient={[colors.tabBarBg, colors.tabBarBg, colors.tabBarBg]}
      floatingContent={<Fab label="Add Member" icon="people-outline" onPress={() => handleOpenAdd?.()} />}
    >
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <View style={styles.statsRow}>
            <SurfaceCard shadow="card" style={styles.statTile}>
              <View style={styles.statIconBlue}>
                <Ionicons name="people-outline" size={20} color={colors.white} />
              </View>
              <Text style={styles.statCount}>{teamMembersCount}</Text>
              <Text style={styles.statCaption}>Total</Text>
            </SurfaceCard>

            <SurfaceCard shadow="card" style={styles.statTile}>
              <View style={styles.statIconGreen}>
                <Ionicons name="people-outline" size={20} color={colors.white} />
              </View>
              <Text style={styles.statCount}>{activeMembersCount}</Text>
              <Text style={styles.statCaption}>Active</Text>
            </SurfaceCard>
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>All Members</Text>
            <Pressable
              style={({ pressed }) => [styles.refreshMini, pressed && { opacity: 0.8 }]}
              onPress={() => void fetchTeamMembers()}
              hitSlop={8}
            >
              {isFetching ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="refresh" size={18} color={colors.primary} />
              )}
            </Pressable>
          </View>

          {isFetching && teamMembers.length === 0 ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : teamMembers.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={62} color={colors.textLight} />
              </View>
              <Text style={styles.emptyTitle}>No team members yet</Text>
              <Text style={styles.emptySub}>Tap + to add your first member</Text>
            </View>
          ) : (
            <View style={styles.memberRows}>
              {teamMembers.map((member, idx) => {
                const id = memberId(member);
                const name = member.name?.trim() || `Member ${idx + 1}`;
                const photoUri = normalizeMediaUrl(member.profilePhoto ?? null);
                return (
                  <SurfaceCard key={`${id ?? name}-${idx}`} shadow="soft" style={styles.memberRow}>
                    <View style={styles.memberLeft}>
                      <View style={styles.memberAvatar}>
                        {photoUri ? (
                          <Image source={{ uri: photoUri }} style={styles.memberAvatarImg} />
                        ) : (
                          <Ionicons name="person" size={16} color={colors.primary} />
                        )}
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{name}</Text>
                        <Text style={styles.memberMeta} numberOfLines={1}>
                          {(member.designation ?? "No designation").trim()} • {(member.phone ?? "No phone").trim()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.memberActions}>
                      <View style={[styles.statusPill, isActiveMember(member) ? styles.statusPillActive : styles.statusPillInactive]}>
                        <Text style={[styles.statusPillText, isActiveMember(member) ? styles.statusPillTextActive : styles.statusPillTextInactive]}>
                          {isActiveMember(member) ? "Active" : "Inactive"}
                        </Text>
                      </View>
                      <Pressable
                        style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
                        onPress={() => handleOpenEdit?.(member)}
                      >
                        <Ionicons name="create-outline" size={16} color={colors.primaryDark} />
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.actionBtn, styles.deleteBtn, pressed && styles.actionBtnPressed]}
                        onPress={() => confirmDeleteTeamMember(member, deleteTeamMember)}
                        disabled={!id || submitting}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      </Pressable>
                    </View>
                  </SurfaceCard>
                );
              })}
            </View>
          )}
        </ScrollView>

      </View>
    </StackScreenFrame>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: 140,
    gap: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statTile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
  },
  statIconBlue: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  statIconGreen: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  statCount: { fontSize: fontSizes.display, fontWeight: "900", color: colors.text },
  statCaption: { fontSize: fontSizes.sm, fontWeight: "700", color: colors.textMuted, marginTop: 2 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm },
  sectionTitle: { ...typography.section },
  refreshMini: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  loadingText: { color: colors.textMuted, fontSize: fontSizes.md },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: { marginBottom: spacing.sm },
  emptyTitle: { fontSize: fontSizes.lg, fontWeight: "900", color: colors.textMuted, marginTop: spacing.sm },
  emptySub: { fontSize: fontSizes.sm, fontWeight: "700", color: colors.textLight },
  memberRows: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  memberRow: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  memberAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryMutedBg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  memberAvatarImg: { width: "100%", height: "100%" },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: "700",
  },
  memberMeta: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
  },
  memberMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.round,
  },
  statusPillActive: {
    backgroundColor: colors.successMuted,
  },
  statusPillInactive: {
    backgroundColor: colors.dangerMuted,
  },
  statusPillText: {
    fontSize: fontSizes.xs,
    fontWeight: "700",
  },
  statusPillTextActive: {
    color: colors.successDark,
  },
  statusPillTextInactive: {
    color: colors.danger,
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgAlt,
  },
  deleteBtn: { backgroundColor: colors.dangerMuted },
  actionBtnPressed: { opacity: 0.74 },

  // addBtn removed: now using StackScreenFrame `floatingContent`
});
