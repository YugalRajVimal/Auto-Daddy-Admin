import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";

const DEFAULT_WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

type OpenDaysSelectorProps = {
  selectedDays: string[];
  onToggleDay: (day: string) => void;
  days?: readonly string[];
  label?: string;
  compact?: boolean;
};

function shortDayLabel(day: string) {
  const d = day.trim().toLowerCase();
  if (d.startsWith("mon")) return "Mon";
  if (d.startsWith("tue")) return "Tue";
  if (d.startsWith("wed")) return "Wed";
  if (d.startsWith("thu")) return "Thu";
  if (d.startsWith("fri")) return "Fri";
  if (d.startsWith("sat")) return "Sat";
  if (d.startsWith("sun")) return "Sun";
  return day.slice(0, 3);
}

export function OpenDaysSelector({
  selectedDays,
  onToggleDay,
  days = DEFAULT_WEEK_DAYS,
  label = "Open Days",
  compact = true,
}: OpenDaysSelectorProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.daysWrap}>
        {days.map((day) => {
          const selected = selectedDays.includes(day);
          return (
            <Pressable
              key={day}
              style={({ pressed }) => [
                styles.dayChip,
                selected && styles.dayChipSelected,
                pressed && styles.dayChipPressed,
              ]}
              onPress={() => onToggleDay(day)}
            >
              <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                {selected ? <Ionicons name="checkmark" size={12} color={colors.white} /> : null}
              </View>
              <Text style={[styles.dayText, selected && styles.dayTextSelected]}>{compact ? shortDayLabel(day) : day}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  daysWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  dayChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.bgProfile,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  dayChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMutedBg,
  },
  dayChipPressed: {
    opacity: 0.78,
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
  dayText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontWeight: "600",
  },
  dayTextSelected: {
    color: colors.primaryBlue900,
  },
});
