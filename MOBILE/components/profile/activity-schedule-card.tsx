import { ExpandableCard, PerDayOpenHoursEditor, ProfileFieldRow } from "@/components/reusables";
import { colors, fontSizes, spacing } from "@/constants/autodaddy";
import type { PerDaySchedule } from "@/lib/per-day-open-hours";
import { StyleSheet, Text, View } from "react-native";

type ActivityScheduleCardProps = {
  expanded: boolean;
  editing: boolean;
  saving?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  scheduleDisplay: string;
  editSchedule: PerDaySchedule;
  setEditSchedule: (value: PerDaySchedule) => void;
};

export function ActivityScheduleCard({
  expanded,
  editing,
  saving = false,
  onToggle,
  onEdit,
  onSave,
  onCancel,
  scheduleDisplay,
  editSchedule,
  setEditSchedule,
}: ActivityScheduleCardProps) {
  return (
    <ExpandableCard
      title="Activity"
      headerIcon="calendar"
      expanded={expanded}
      onToggle={onToggle}
      onEdit={editing ? undefined : onEdit}
      editing={editing}
      onSave={onSave}
      onCancel={onCancel}
      saving={saving}
    >
      {editing ? (
        <View style={styles.editBody}>
          <Text style={styles.intro}>
            Choose which days you are active and set a time range for each enabled day.
          </Text>
          <PerDayOpenHoursEditor
            schedule={editSchedule}
            onChange={setEditSchedule}
            label="Open hours"
          />
        </View>
      ) : (
        <ProfileFieldRow icon="time-outline" label="Schedule" value={scheduleDisplay} showDivider={false} />
      )}
    </ExpandableCard>
  );
}

const styles = StyleSheet.create({
  editBody: {
    gap: spacing.sm,
  },
  intro: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
});
