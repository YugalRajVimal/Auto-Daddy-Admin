import { cardFontSizes, colors, radii, spacing } from "@/constants/autodaddy";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

/** Muted green for disabled chevrons on success-themed bars (matches services picker). */
const SUCCESS_CHEVRON_DISABLED = "#A8CDAE";
const SUCCESS_BORDER_SOFT = "rgba(22,101,52,0.22)";

type Props = {
  label: string;
  /** Matches the green bordered picker on the Services catalog screen. */
  variant?: "default" | "services";
  bordered?: boolean;
  edgeAligned?: boolean;
  style?: ViewStyle;
  onPrevious?: () => void;
  onNext?: () => void;
  onPressLabel?: () => void;
};

export function ChevronLabelBar({
  label,
  variant = "default",
  bordered,
  edgeAligned,
  style,
  onPrevious,
  onNext,
  onPressLabel,
}: Props) {
  const isServices = variant === "services";
  const useEdgeLayout = isServices || edgeAligned || bordered;
  const chevronColor = isServices || bordered ? colors.successDark : colors.success;
  const chevronDisabledColor = isServices || bordered ? SUCCESS_CHEVRON_DISABLED : colors.textLight;
  const chevronSize = isServices ? 24 : 18;

  const labelEl = onPressLabel ? (
    <Pressable onPress={onPressLabel} hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}>
      <Text style={[styles.text, isServices && styles.textServices, bordered && styles.textBordered]}>{label}</Text>
    </Pressable>
  ) : (
    <Text style={[styles.text, isServices && styles.textServices, bordered && styles.textBordered]}>{label}</Text>
  );

  const chevronBtnStyle = bordered && !isServices ? styles.chevronBtn : undefined;
  const chevronBtnDisabledStyle = bordered && !isServices ? styles.chevronBtnDisabled : undefined;

  return (
    <View
      style={[
        styles.bar,
        isServices && styles.barServices,
        bordered && !isServices && styles.bordered,
        useEdgeLayout && styles.barEdgeAligned,
        isServices && styles.barServicesEdge,
        style,
      ]}
    >
      <Pressable
        onPress={onPrevious}
        hitSlop={8}
        disabled={!onPrevious}
        style={[useEdgeLayout && styles.edgeBtn, chevronBtnStyle, !onPrevious && chevronBtnDisabledStyle]}
      >
        <Ionicons name="chevron-back" size={chevronSize} color={onPrevious ? chevronColor : chevronDisabledColor} />
      </Pressable>
      {useEdgeLayout ? <View style={styles.labelCenter}>{labelEl}</View> : labelEl}
      <Pressable
        onPress={onNext}
        hitSlop={8}
        disabled={!onNext}
        style={[useEdgeLayout && styles.edgeBtn, chevronBtnStyle, !onNext && chevronBtnDisabledStyle]}
      >
        <Ionicons name="chevron-forward" size={chevronSize} color={onNext ? chevronColor : chevronDisabledColor} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.successMuted,
    borderRadius: radii.lg,
  },
  barEdgeAligned: {
    justifyContent: "space-between",
    gap: 0,
    paddingHorizontal: spacing.lg,
  },
  edgeBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  chevronBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: SUCCESS_BORDER_SOFT,
    backgroundColor: colors.white,
  },
  chevronBtnDisabled: {
    borderColor: "rgba(22,101,52,0.12)",
    opacity: 0.65,
  },
  labelCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bordered: { borderWidth: 1, borderColor: colors.success, marginHorizontal: spacing.screenHorizontal },
  barServices: {
    borderWidth: 1.5,
    borderColor: colors.success,
    borderRadius: radii.xl,
    backgroundColor: "#EEF8EE",
    paddingVertical: 0,
    minHeight: 42,
  },
  barServicesEdge: {
    paddingHorizontal: spacing.md,
  },
  text: { fontSize: cardFontSizes.lg, fontWeight: "700", color: colors.text },
  textBordered: { color: colors.successDark },
  textServices: { fontWeight: "800", color: colors.successDark },
});
