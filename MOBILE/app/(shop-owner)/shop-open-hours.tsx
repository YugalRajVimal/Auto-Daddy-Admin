import {
  LoadingProgress,
  PerDayOpenHoursEditor,
  StackScreenFrame,
  SurfaceCard,
  TimeRangePicker,
  useToast,
} from "@/components/reusables";
import { colors, fontSizes, radii, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import {
  fetchOpenHours,
  updateWeeklyOpenHours,
  upsertSpecialOpenHours,
} from "@/lib/autoshopowner-api";
import { updateBusinessActiveStatus } from "@/lib/auto-shop-owner-api";
import { getAutoShopOwnerProfile, saveAutoShopOwnerProfile } from "@/lib/auth";
import {
  buildOpenHoursTableRows,
  createDefaultPerDaySchedule,
  formatLocalDateISO,
  formatOpenHoursTimeDisplay,
  formatPerDayScheduleDisplay,
  hasWeeklyScheduleInPayload,
  parseSpecialOpenHours,
  parseWeeklyOpenHoursFromPayload,
  perDayOpenHoursFromSchedule,
  resolvePerDaySchedule,
  shortDayLabel,
  validatePerDaySchedule,
  WEEK_DAYS,
  type PerDaySchedule,
  type ShopOpenHoursHistoryRow,
} from "@/lib/per-day-open-hours";
import { fetchAndMergeShopOwnerPortal } from "@/lib/shop-owner-portal-bootstrap";
import { resolveShopOwnerBackTo } from "@/lib/shop-owner-navigation";
import type { AutoShopOwnerProfileResponse } from "@/types/auto-shop-owner-profile";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

type FormMode = "add" | "edit" | null;

function apiMessage(data: unknown): string {
  if (data && typeof data === "object" && "message" in data) {
    return String((data as { message?: string }).message ?? "").trim();
  }
  return "";
}

function cloneSchedule(schedule: PerDaySchedule): PerDaySchedule {
  return WEEK_DAYS.reduce((acc, day) => {
    acc[day] = { ...schedule[day] };
    return acc;
  }, {} as PerDaySchedule);
}

export default function ShopOpenHoursPage() {
  const params = useLocalSearchParams<{ backTo?: string | string[]; from?: string | string[] }>();
  const backToParam = Array.isArray(params.backTo) ? params.backTo[0] : params.backTo;
  const fromParam = Array.isArray(params.from) ? params.from[0] : params.from;
  const backTo = resolveShopOwnerBackTo(backToParam, fromParam);

  const { token, refreshSession } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<PerDaySchedule>(createDefaultPerDaySchedule);
  const [tableRows, setTableRows] = useState<ShopOpenHoursHistoryRow[]>([]);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [formSchedule, setFormSchedule] = useState<PerDaySchedule>(createDefaultPerDaySchedule);
  const [editingDateISO, setEditingDateISO] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(true);
  const [formStart, setFormStart] = useState("09:00");
  const [formEnd, setFormEnd] = useState("20:00");
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [isBusinessActive, setIsBusinessActive] = useState<boolean | null>(null);
  const [updatingBusinessActive, setUpdatingBusinessActive] = useState(false);
  const [shopOpen, setShopOpen] = useState(true);

  const todayISO = formatLocalDateISO(new Date());
  const scheduleDisplay = useMemo(() => formatPerDayScheduleDisplay(schedule), [schedule]);
  const hasBulkSelection = selectedDates.size > 0;
  const showForm = formMode === "add" || formMode === "edit";

  const applyPayload = useCallback(
    (payload: unknown | null, perDayOpenHours?: unknown) => {
      const profileSchedule = resolvePerDaySchedule(
        perDayOpenHours != null ? { perDayOpenHours } : null
      );
      const finalSchedule =
        payload && hasWeeklyScheduleInPayload(payload)
          ? parseWeeklyOpenHoursFromPayload(payload)
          : profileSchedule;
      const specials = payload ? parseSpecialOpenHours(payload) : [];
      setSchedule(finalSchedule);
      setTableRows(buildOpenHoursTableRows(finalSchedule, specials));
    },
    []
  );

  const loadBusinessActive = useCallback(async () => {
    const saved = await getAutoShopOwnerProfile<AutoShopOwnerProfileResponse>();
    const active = saved?.data?.businessProfile?.isBusinessActive;
    if (typeof active === "boolean") {
      setIsBusinessActive(active);
      setShopOpen(active);
    } else {
      setIsBusinessActive(null);
    }
    return saved?.data?.businessProfile?.perDayOpenHours;
  }, []);

  const reloadHours = useCallback(async () => {
    if (!token) {
      applyPayload(null);
      setLoading(false);
      return;
    }
    const perDay = await loadBusinessActive();
    try {
      const res = await fetchOpenHours(token);
      if (res.ok) applyPayload(res.data, perDay);
      else applyPayload(null, perDay);
    } catch {
      applyPayload(null, perDay);
    } finally {
      setLoading(false);
    }
  }, [applyPayload, loadBusinessActive, token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void reloadHours();
      return undefined;
    }, [reloadHours])
  );

  useEffect(() => {
    if (updatingBusinessActive) return;
    if (typeof isBusinessActive !== "boolean") return;
    setShopOpen(isBusinessActive);
  }, [isBusinessActive, updatingBusinessActive]);

  const persistPortal = useCallback(async () => {
    if (!token) return;
    await refreshSession();
    const portal = await fetchAndMergeShopOwnerPortal(token);
    if (portal.profile) {
      await saveAutoShopOwnerProfile(portal.profile);
      const active = portal.profile.data?.businessProfile?.isBusinessActive;
      if (typeof active === "boolean") {
        setIsBusinessActive(active);
        setShopOpen(active);
      }
    }
  }, [refreshSession, token]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reloadHours();
    } finally {
      setRefreshing(false);
    }
  }, [reloadHours]);

  const openAddForm = () => {
    setSelectedDates(new Set());
    setEditingDateISO(null);
    setFormSchedule(cloneSchedule(schedule));
    setFormMode("add");
  };

  const openEditForm = (row: ShopOpenHoursHistoryRow) => {
    setSelectedDates(new Set());
    setEditingDateISO(row.dateISO);
    setFormOpen(row.enabled);
    setFormStart(row.start);
    setFormEnd(row.end);
    setFormMode("edit");
  };

  const closeForm = () => {
    setEditingDateISO(null);
    setFormMode(null);
  };

  const toggleDateSelection = (dateISO: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateISO)) next.delete(dateISO);
      else next.add(dateISO);
      return next;
    });
  };

  const handleBusinessActiveChange = async (next: boolean) => {
    if (!token) {
      showToast("Please log in again.", { type: "error" });
      return false;
    }
    if (updatingBusinessActive) return false;
    const prev = isBusinessActive;
    setUpdatingBusinessActive(true);
    setIsBusinessActive(next);
    try {
      const res = await updateBusinessActiveStatus(token, next);
      if (
        !res.ok ||
        (res.data &&
          typeof res.data === "object" &&
          "success" in res.data &&
          (res.data as { success?: boolean }).success === false)
      ) {
        setIsBusinessActive(prev);
        showToast(apiMessage(res.data) || "Could not update shop status.", { type: "error" });
        return false;
      }
      showToast(next ? "Shop marked as open." : "Shop marked as closed.", { type: "success" });
      await persistPortal();
      return true;
    } catch {
      setIsBusinessActive(prev);
      showToast("Network error while updating shop status.", { type: "error" });
      return false;
    } finally {
      setUpdatingBusinessActive(false);
    }
  };

  const handleSave = async () => {
    if (!token) {
      showToast("Sign in to save open hours.", { type: "error" });
      return;
    }
    setSaving(true);
    try {
      if (formMode === "add") {
        const scheduleError = validatePerDaySchedule(formSchedule);
        if (scheduleError) {
          showToast(scheduleError, { type: "error" });
          return;
        }
        const res = await updateWeeklyOpenHours(
          token,
          perDayOpenHoursFromSchedule(formSchedule)
        );
        if (!res.ok) {
          showToast(apiMessage(res.data) || "Could not save weekly hours.", { type: "error" });
          return;
        }
        setSchedule(cloneSchedule(formSchedule));
        showToast(apiMessage(res.data) || "Weekly default hours saved.", { type: "success" });
        await persistPortal();
        await reloadHours();
        closeForm();
        return;
      }

      if (!editingDateISO) {
        showToast("Select a date.", { type: "error" });
        return;
      }
      if (formOpen && formEnd <= formStart) {
        showToast("End time must be after start time.", { type: "error" });
        return;
      }

      const res = await upsertSpecialOpenHours(token, {
        date: editingDateISO,
        isClosed: !formOpen,
        open: formStart,
        close: formEnd,
      });
      if (!res.ok) {
        showToast(apiMessage(res.data) || "Could not update hours for this date.", {
          type: "error",
        });
        return;
      }
      showToast(apiMessage(res.data) || "Hours updated for this date.", { type: "success" });
      await persistPortal();
      await reloadHours();
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const applyBulkStatus = async (open: boolean) => {
    if (selectedDates.size === 0 || !token) return;
    setSaving(true);
    try {
      const dates = [...selectedDates];
      const results = await Promise.all(
        dates.map((dateISO) => {
          const row = tableRows.find((r) => r.dateISO === dateISO);
          return upsertSpecialOpenHours(token, {
            date: dateISO,
            isClosed: !open,
            open: row?.start ?? "09:00",
            close: row?.end ?? "20:00",
          });
        })
      );
      const failed = results.find((r) => !r.ok);
      if (failed) {
        showToast(apiMessage(failed.data) || "Could not update selected dates.", {
          type: "error",
        });
        return;
      }
      showToast(open ? "Selected dates opened." : "Selected dates closed.", { type: "success" });
      setSelectedDates(new Set());
      await persistPortal();
      await reloadHours();
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackScreenFrame
      title="Shop is Open"
      backgroundColor={colors.bgProfile}
      scroll={false}
      backTo={backTo}
      headerGradient={[colors.tabBarBg, colors.tabBarBg, colors.tabBarBg]}
    >
      <View style={styles.root}>
        {loading ? (
          <LoadingProgress />
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            <SurfaceCard shadow="card" style={styles.toggleCard}>
              <View
                style={[
                  styles.statusRow,
                  shopOpen ? styles.statusRowOpen : styles.statusRowClosed,
                ]}
              >
                <View style={styles.statusLeft}>
                  <View
                    style={[
                      styles.statusDot,
                      shopOpen ? styles.statusDotOpen : styles.statusDotClosed,
                    ]}
                  />
                  <Text style={[styles.statusLabel, !shopOpen && styles.statusLabelClosed]}>
                    {shopOpen ? "Shop is Open Today" : "Shop is Closed Today"}
                  </Text>
                </View>
                <Switch
                  value={shopOpen}
                  disabled={updatingBusinessActive || typeof isBusinessActive !== "boolean"}
                  onValueChange={async (next) => {
                    const prev = shopOpen;
                    setShopOpen(next);
                    try {
                      const okRaw = await handleBusinessActiveChange(next);
                      const ok = okRaw == null ? true : Boolean(okRaw);
                      if (!ok) setShopOpen(prev);
                    } catch {
                      setShopOpen(prev);
                    }
                  }}
                  trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
                  thumbColor={shopOpen ? colors.success : colors.danger}
                />
              </View>
            </SurfaceCard>

            {!showForm ? (
              <View style={styles.toolbar}>
                {hasBulkSelection ? (
                  <View style={styles.bulkRow}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.bulkBtn,
                        styles.bulkOpenBtn,
                        (saving || pressed) && styles.pressed,
                      ]}
                      disabled={saving}
                      onPress={() => void applyBulkStatus(true)}
                    >
                      <Text style={styles.bulkOpenText}>Open</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.bulkBtn,
                        styles.bulkCloseBtn,
                        (saving || pressed) && styles.pressed,
                      ]}
                      disabled={saving}
                      onPress={() => void applyBulkStatus(false)}
                    >
                      <Text style={styles.bulkCloseText}>Close</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.scheduleCaption} numberOfLines={2}>
                    Weekly: {scheduleDisplay}
                  </Text>
                )}
                <Pressable
                  style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
                  onPress={openAddForm}
                  disabled={saving}
                >
                  <Ionicons name="add" size={18} color={colors.white} />
                  <Text style={styles.addBtnText}>Add New</Text>
                </Pressable>
              </View>
            ) : null}

            {showForm ? (
              <SurfaceCard shadow="card" style={styles.formCard}>
                <Text style={styles.formTitle}>
                  {formMode === "add" ? "Weekly default hours" : `Edit ${editingDateISO}`}
                </Text>
                {formMode === "add" ? (
                  <PerDayOpenHoursEditor
                    schedule={formSchedule}
                    onChange={setFormSchedule}
                    label="Open hours"
                  />
                ) : (
                  <View style={styles.editFields}>
                    <View style={styles.statusField}>
                      <Text style={styles.fieldLabel}>Status</Text>
                      <View style={styles.statusToggleRow}>
                        <Text style={styles.statusToggleLabel}>
                          {formOpen ? "Open" : "Closed"}
                        </Text>
                        <Switch
                          value={formOpen}
                          onValueChange={setFormOpen}
                          trackColor={{
                            false: colors.switchTrackOff,
                            true: colors.switchTrackOn,
                          }}
                          thumbColor={formOpen ? colors.success : colors.danger}
                        />
                      </View>
                    </View>
                    {formOpen ? (
                      <TimeRangePicker
                        label="Hours"
                        startTime={formStart}
                        endTime={formEnd}
                        onChange={(start, end) => {
                          setFormStart(start);
                          setFormEnd(end);
                        }}
                      />
                    ) : null}
                  </View>
                )}
                <View style={styles.formActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.formBtn,
                      styles.cancelBtn,
                      (saving || pressed) && styles.pressed,
                    ]}
                    disabled={saving}
                    onPress={closeForm}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.formBtn,
                      styles.saveBtn,
                      (saving || pressed) && styles.pressed,
                    ]}
                    disabled={saving}
                    onPress={() => void handleSave()}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.saveBtnText}>Save</Text>
                    )}
                  </Pressable>
                </View>
              </SurfaceCard>
            ) : null}

            <SurfaceCard shadow="card" style={styles.listCard}>
              <Text style={typography.cardTitle}>Schedule</Text>
              {tableRows.length === 0 ? (
                <Text style={styles.emptyText}>
                  No open hours yet. Tap “+ Add New” to set weekly defaults.
                </Text>
              ) : (
                tableRows.map((row) => {
                  const selected = selectedDates.has(row.dateISO);
                  const isToday = row.dateISO === todayISO;
                  const isEditing = editingDateISO === row.dateISO;
                  return (
                    <View
                      key={row.dateISO}
                      style={[
                        styles.row,
                        isToday && styles.rowToday,
                        isEditing && styles.rowEditing,
                      ]}
                    >
                      <Pressable
                        style={styles.checkboxHit}
                        onPress={() => toggleDateSelection(row.dateISO)}
                        disabled={saving || showForm}
                        hitSlop={6}
                      >
                        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                          {selected ? (
                            <Ionicons name="checkmark" size={12} color={colors.white} />
                          ) : null}
                        </View>
                      </Pressable>
                      <Pressable
                        style={styles.rowBody}
                        onPress={() => openEditForm(row)}
                        disabled={saving || formMode === "add"}
                      >
                        <View style={styles.rowTop}>
                          <Text style={[styles.rowDate, !row.enabled && styles.rowClosedText]}>
                            {row.dateISO}
                            {isToday ? " (Today)" : ""}
                          </Text>
                          <View
                            style={[
                              styles.statusPill,
                              row.enabled ? styles.statusPillOpen : styles.statusPillClosed,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillText,
                                row.enabled
                                  ? styles.statusPillTextOpen
                                  : styles.statusPillTextClosed,
                              ]}
                            >
                              {row.enabled ? "Open" : "Closed"}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.rowMeta, !row.enabled && styles.rowClosedText]}>
                          {shortDayLabel(row.day)}
                          {row.enabled
                            ? ` · ${formatOpenHoursTimeDisplay(row.start)} – ${formatOpenHoursTimeDisplay(row.end)}`
                            : " · —"}
                          {row.isSpecial ? " · Special" : ""}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })
              )}
            </SurfaceCard>
          </ScrollView>
        )}
      </View>
    </StackScreenFrame>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  toggleCard: { padding: spacing.md },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
    borderWidth: 1,
  },
  statusRowOpen: {
    backgroundColor: "rgba(209,250,229,0.86)",
    borderColor: "rgba(16,185,129,0.2)",
  },
  statusRowClosed: {
    backgroundColor: "rgba(254,226,226,0.92)",
    borderColor: "rgba(239,68,68,0.25)",
  },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, paddingRight: 8 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  statusDotOpen: { backgroundColor: colors.success },
  statusDotClosed: { backgroundColor: colors.danger },
  statusLabel: { fontSize: fontSizes.md, fontWeight: "800", color: colors.text, flexShrink: 1 },
  statusLabelClosed: { color: colors.danger },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  scheduleCaption: {
    flex: 1,
    fontSize: fontSizes.xs,
    fontWeight: "600",
    color: colors.textMuted,
  },
  bulkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  bulkBtn: {
    minHeight: 36,
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  bulkOpenBtn: {
    backgroundColor: "rgba(209,250,229,0.9)",
    borderColor: "rgba(16,185,129,0.3)",
  },
  bulkCloseBtn: {
    backgroundColor: "rgba(254,226,226,0.95)",
    borderColor: "rgba(239,68,68,0.3)",
  },
  bulkOpenText: { fontWeight: "800", fontSize: fontSizes.sm, color: colors.success },
  bulkCloseText: { fontWeight: "800", fontSize: fontSizes.sm, color: colors.danger },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 36,
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
  },
  addBtnText: { color: colors.white, fontWeight: "800", fontSize: fontSizes.sm },
  formCard: { padding: spacing.lg, gap: spacing.md },
  formTitle: { fontSize: fontSizes.lg, fontWeight: "800", color: colors.text },
  editFields: { gap: spacing.md },
  statusField: { gap: spacing.xs },
  fieldLabel: { fontSize: fontSizes.sm, fontWeight: "700", color: colors.textMuted },
  statusToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgProfile,
  },
  statusToggleLabel: { fontSize: fontSizes.md, fontWeight: "800", color: colors.text },
  formActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
  formBtn: {
    minHeight: 40,
    minWidth: 88,
    borderRadius: radii.round,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  cancelBtn: { backgroundColor: colors.bgAlt },
  cancelBtnText: { color: colors.textMuted, fontWeight: "700", fontSize: fontSizes.sm },
  saveBtn: { backgroundColor: colors.primary },
  saveBtnText: { color: colors.white, fontWeight: "800", fontSize: fontSizes.sm },
  listCard: { padding: spacing.lg, gap: spacing.sm },
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  rowToday: { backgroundColor: colors.primaryMutedBg, borderColor: colors.primary },
  rowEditing: { borderColor: colors.purple },
  checkboxHit: { padding: 4 },
  checkbox: {
    width: 20,
    height: 20,
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
  rowBody: { flex: 1, gap: 2 },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  rowDate: { fontSize: fontSizes.sm, fontWeight: "800", color: colors.primaryBlue900 },
  rowMeta: { fontSize: fontSizes.xs, fontWeight: "600", color: colors.textMuted },
  rowClosedText: { color: colors.purple },
  statusPill: {
    borderRadius: radii.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusPillOpen: { backgroundColor: "rgba(209,250,229,0.9)" },
  statusPillClosed: { backgroundColor: "rgba(254,226,226,0.95)" },
  statusPillText: { fontSize: 11, fontWeight: "800" },
  statusPillTextOpen: { color: colors.success },
  statusPillTextClosed: { color: colors.danger },
  pressed: { opacity: 0.75 },
});
