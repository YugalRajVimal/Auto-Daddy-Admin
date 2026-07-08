import { SurfaceCard } from "@/components/reusables";
import { colors, fontSizes, radii, spacing, typography } from "@/constants/autodaddy";
import type { TeamMember } from "@/types/team-member";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type TeamMembersCardProps = {
  teamMembers: TeamMember[];
  teamMembersCount: number;
  onPress?: () => void;
};

export function TeamMembersCard({ teamMembersCount, onPress }: TeamMembersCardProps) {
  return (
    <SurfaceCard shadow="card">
      <View style={styles.teamHeader}>
        <View style={styles.titleRow}>
          <View style={styles.iconBubble}>
            <Ionicons name="people" size={18} color={colors.white} />
          </View>
          <Text style={typography.cardTitle}>Team Members</Text>
        </View>
      </View>
      <Pressable style={({ pressed }) => [styles.teamRow, pressed && styles.teamRowPressed]} onPress={onPress}>
        <View style={styles.teamIcon}>
          <Ionicons name="people" size={22} color={colors.white} />
        </View>
        <View style={styles.teamMid}>
          <Text style={styles.teamLabel}>Active Members</Text>
          <Text style={styles.teamValue}>{teamMembersCount}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
      </Pressable>
      {/* {teamMembersCount === 0 ? (
        <Text style={styles.placeholderMuted}>No team members added yet.</Text>
      ) : (
        <View style={styles.memberList}>
          {teamMembers.slice(0, 5).map((member, idx) => {
            const label = member.name?.trim() || `Member ${idx + 1}`;
            return (
              <View key={`${label}-${idx}`} style={styles.memberChip}>
                <Text style={styles.memberChipText}>{label}</Text>
              </View>
            );
          })}
        </View>
      )} */}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  placeholderMuted: { fontSize: fontSizes.md, color: colors.textMuted, paddingVertical: spacing.sm },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 2 },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  teamRowPressed: { opacity: 0.74 },
  teamIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  teamMid: { flex: 1 },
  teamLabel: { fontSize: fontSizes.sm, color: colors.textMuted },
  teamValue: { fontSize: fontSizes.hero, fontWeight: "800", color: colors.text },
  memberList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  memberChip: {
    backgroundColor: colors.primaryMutedBg,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: radii.round,
  },
  memberChipText: { color: colors.primaryDark, fontSize: fontSizes.sm, fontWeight: "600" },
});
