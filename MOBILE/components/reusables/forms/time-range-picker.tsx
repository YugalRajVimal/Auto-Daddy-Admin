import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import { useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { ModalKeyboardRoot } from "../layout/modal-keyboard-root";

type PickerTarget = "start" | "end" | null;
type Props = { label?: string; startTime: string; endTime: string; onChange: (nextStart: string, nextEnd: string) => void };

function toDateFromTimeString(time: string) { const [h, m] = time.split(":"); const d = new Date(); d.setHours(Number(h || "0"), Number(m || "0"), 0, 0); return d; }
function toTimeString(date: Date) { return `${`${date.getHours()}`.padStart(2, "0")}:${`${date.getMinutes()}`.padStart(2, "0")}`; }
function toMinutes(time: string) { const [h, m] = time.split(":"); return Number(h || "0") * 60 + Number(m || "0"); }
function addMinutes(time: string, minutesToAdd: number) { const total = toMinutes(time) + minutesToAdd; const clamped = Math.min(Math.max(total, 0), 23 * 60 + 59); return `${`${Math.floor(clamped / 60)}`.padStart(2, "0")}:${`${clamped % 60}`.padStart(2, "0")}`; }

export function TimeRangePicker({ label = "Open Hours", startTime, endTime, onChange }: Props) {
  const [activePicker, setActivePicker] = useState<PickerTarget>(null);
  const [iosDraft, setIosDraft] = useState<Date | null>(null);
  const startDate = useMemo(() => toDateFromTimeString(startTime), [startTime]);
  const endDate = useMemo(() => toDateFromTimeString(endTime), [endTime]);
  function handleTimeChange(target: Exclude<PickerTarget, null>, event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === "android") setActivePicker(null);
    if (event.type === "dismissed" || !date) return;
    const next = toTimeString(date);
    if (target === "start") {
      const nextEnd = toMinutes(endTime) > toMinutes(next) ? endTime : addMinutes(next, 30);
      onChange(next, nextEnd);
      return;
    }
    const nextEnd = toMinutes(next) > toMinutes(startTime) ? next : addMinutes(startTime, 30);
    onChange(startTime, nextEnd);
  }
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable style={styles.timeBtn} onPress={() => setActivePicker("start")}><Text style={styles.timeLabel}>Start</Text><Text style={styles.timeValue}>{startTime}</Text></Pressable>
        <Text style={styles.separator}>to</Text>
        <Pressable style={styles.timeBtn} onPress={() => setActivePicker("end")}><Text style={styles.timeLabel}>End</Text><Text style={styles.timeValue}>{endTime}</Text></Pressable>
      </View>
      {Platform.OS === "android" ? (
        <>
          {activePicker === "start" ? (
            <DateTimePicker
              mode="time"
              display="default"
              value={startDate}
              onChange={(e, d) => handleTimeChange("start", e, d)}
              minuteInterval={30}
            />
          ) : null}
          {activePicker === "end" ? (
            <DateTimePicker
              mode="time"
              display="default"
              value={endDate}
              onChange={(e, d) => handleTimeChange("end", e, d)}
              minuteInterval={30}
            />
          ) : null}
        </>
      ) : (
        <Modal
          transparent
          visible={activePicker != null}
          animationType="fade"
          onRequestClose={() => setActivePicker(null)}
        >
          <ModalKeyboardRoot onBackdropPress={() => setActivePicker(null)} scrimColor="rgba(0,0,0,0.35)">
            <View style={styles.iosSheet}>
              <View style={styles.iosSheetHeader}>
                <Pressable onPress={() => setActivePicker(null)} hitSlop={8}>
                  <Text style={styles.iosSheetBtn}>Cancel</Text>
                </Pressable>
                <Text style={styles.iosSheetTitle}>{activePicker === "start" ? "Start time" : "End time"}</Text>
                <Pressable
                  onPress={() => {
                    const d = iosDraft ?? (activePicker === "start" ? startDate : endDate);
                    handleTimeChange(activePicker as "start" | "end", { type: "set" } as DateTimePickerEvent, d);
                    setIosDraft(null);
                    setActivePicker(null);
                  }}
                  hitSlop={8}
                >
                  <Text style={[styles.iosSheetBtn, styles.iosSheetBtnPrimary]}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                mode="time"
                display="spinner"
                value={iosDraft ?? (activePicker === "start" ? startDate : endDate)}
                onChange={(_, d) => {
                  if (d) setIosDraft(d);
                }}
                minuteInterval={30}
                themeVariant="light"
              />
            </View>
          </ModalKeyboardRoot>
        </Modal>
      )}
      <Text style={styles.preview}>{`${startTime}-${endTime}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.sm },
  label: { fontSize: fontSizes.sm, fontWeight: "700", color: colors.textMuted, marginBottom: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  timeBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, minHeight: 44, backgroundColor: colors.bgProfile, paddingHorizontal: spacing.md, justifyContent: "center", paddingVertical: spacing.xs },
  timeLabel: { fontSize: fontSizes.xs, color: colors.textMuted, fontWeight: "600" },
  timeValue: { marginTop: 2, fontSize: fontSizes.md, color: colors.text, fontWeight: "700" },
  separator: { fontSize: fontSizes.sm, color: colors.textMuted, fontWeight: "600" },
  preview: { marginTop: spacing.xs, color: colors.primaryBlue900, fontSize: fontSizes.sm, fontWeight: "700" },
  iosSheet: {
    width: "100%",
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  iosSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iosSheetTitle: { fontSize: fontSizes.md, fontWeight: "800", color: colors.text },
  iosSheetBtn: { fontSize: fontSizes.md, fontWeight: "700", color: colors.textMuted },
  iosSheetBtnPrimary: { color: colors.primary },
});
