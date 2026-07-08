import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import {
  formatDatePeriodBarLabel,
  type DatePeriodTimeFilter,
} from "@/lib/date-period-labels";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const FILTERS: DatePeriodTimeFilter[] = ["All", "Daily", "Weekly", "Monthly"];

type Props = {
  timeFilter: DatePeriodTimeFilter;
  onTimeFilterChange: (next: DatePeriodTimeFilter) => void;
  anchorDate: Date;
  onStepPeriod: (direction: -1 | 1) => void;
  /** When true, pills and date bar are non-interactive and dimmed (e.g. search / alternate mode). */
  interactionDisabled?: boolean;
};

export function DatePeriodFilter({
  timeFilter,
  onTimeFilterChange,
  anchorDate,
  onStepPeriod,
  interactionDisabled = false,
}: Props) {
  const periodDisabled = interactionDisabled || timeFilter === "All";
  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={[styles.filterRow, interactionDisabled && styles.filterDimmed]}
      >
        {FILTERS.map((item, idx) => {
          const active = item === timeFilter;
          return (
            <Pressable
              key={item}
              onPress={() => {
                if (interactionDisabled) {
                  return;
                }
                onTimeFilterChange(item);
              }}
              style={[styles.filterBtn, active && styles.filterBtnActive, idx === FILTERS.length - 1 && styles.filterBtnLast]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.dateBar, periodDisabled && styles.filterDimmed]}>
        <Pressable
          onPress={() => !periodDisabled && onStepPeriod(-1)}
          hitSlop={12}
          disabled={periodDisabled}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.dateText} numberOfLines={2}>
          {formatDatePeriodBarLabel(timeFilter, anchorDate)}
        </Text>
        <Pressable
          onPress={() => !periodDisabled && onStepPeriod(1)}
          hitSlop={12}
          disabled={periodDisabled}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  filterScroll: {
    width: "100%",
  },
  filterRow: {
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: 0,
    flexDirection: "row",
    flexGrow: 1,
  },
  filterDimmed: { opacity: 0.45 },
  filterBtn: {
    height: 38,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#C2C9DA",
    backgroundColor: "#EEF1F8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
    minWidth: 78,
    flexGrow: 1,
    flexBasis: 0,
  },
  filterBtnLast: { marginRight: 0 },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { fontSize: fontSizes.lg, fontWeight: "700", color: colors.textMuted },
  filterTextActive: { color: colors.white },
  dateBar: {
    minHeight: 48,
    backgroundColor: "#F5EDF6",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  dateText: {
    flex: 1,
    textAlign: "center",
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.successDark,
  },
});
