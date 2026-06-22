import { TimeRangePicker } from "@/components/reusables/forms/time-range-picker";
import {
  type PerDaySchedule,
  WEEK_DAYS,
  type WeekDay,
} from "@/lib/per-day-open-hours";
import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  schedule: PerDaySchedule;
  onChange: (next: PerDaySchedule) => void;
  label?: string;
};

function shortDayLabel(day: WeekDay) {
  return day.slice(0, 3);
}

export function PerDayOpenHoursEditor({ schedule, onChange, label = "Business Hours" }: Props) {
  function toggleDay(day: WeekDay) {
    onChange({
      ...schedule,
      [day]: { ...schedule[day], enabled: !schedule[day].enabled },
    });
  }

  function updateDayTimes(day: WeekDay, start: string, end: string) {
    onChange({
      ...schedule,
      [day]: { ...schedule[day], start, end },
    });
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.hint}>Choose open days and set hours for each day.</Text>
      {WEEK_DAYS.map((day) => {
        const entry = schedule[day];
        return (
          <View key={day} style={styles.dayBlock}>
            <Pressable
              style={({ pressed }) => [styles.dayToggle, pressed && styles.dayTogglePressed]}
              onPress={() => toggleDay(day)}
            >
              <View style={[styles.checkbox, entry.enabled && styles.checkboxSelected]}>
                {entry.enabled ? <Ionicons name="checkmark" size={12} color={colors.white} /> : null}
              </View>
              <Text style={[styles.dayName, entry.enabled && styles.dayNameSelected]}>{shortDayLabel(day)}</Text>
              <Text style={styles.fullDayName}>{day}</Text>
            </Pressable>
            {entry.enabled ? (
              <View style={styles.timeBlock}>
                <TimeRangePicker
                  label={`${day} hours`}
                  startTime={entry.start}
                  endTime={entry.end}
                  onChange={(start, end) => updateDayTimes(day, start, end)}
                />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textMuted,
  },
  hint: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: "600",
  },
  dayBlock: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.bgProfile,
    overflow: "hidden",
  },
  dayToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dayTogglePressed: {
    opacity: 0.85,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.textLight,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dayName: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.textMuted,
    width: 36,
  },
  dayNameSelected: {
    color: colors.primaryBlue900,
  },
  fullDayName: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.text,
  },
  timeBlock: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
});
