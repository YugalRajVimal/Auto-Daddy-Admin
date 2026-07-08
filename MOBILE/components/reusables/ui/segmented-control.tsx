import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";

type Props<T extends string> = { options: readonly T[]; value: T; onChange: (next: T) => void };

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.track}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trackContent}
      >
        {options.map((opt, idx) => {
          const active = value === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              style={[styles.item, active && styles.itemActive, idx === options.length - 1 && styles.itemLast]}
            >
              <Text style={[styles.label, active && styles.labelActive]}>{opt}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: "100%", backgroundColor: colors.segmentBg, borderRadius: radii.lg, padding: spacing.xs },
  // flexGrow makes the content container at least as wide as the track,
  // so items can expand to fill the available width, but still scroll when minWidth forces overflow.
  trackContent: { flexDirection: "row", flexGrow: 1 },
  item: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: "center",
    marginRight: spacing.xs,
    minWidth: 84,
    flexGrow: 1,
    flexBasis: 0,
  },
  itemLast: { marginRight: 0 },
  itemActive: { backgroundColor: colors.primary },
  label: { fontSize: fontSizes.sm, fontWeight: "600", color: colors.textMuted },
  labelActive: { color: colors.white },
});
