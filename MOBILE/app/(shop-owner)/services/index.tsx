import { ModalKeyboardRoot, StackScreenFrame, SurfaceCard, useToast } from "@/components/reusables";
import { cardFontSizes, colors, fontSizes, radii, shadows, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useKeyboardBottomInset } from "@/hooks/use-keyboard-bottom-inset";
import { useMyShopServices } from "@/hooks/use-my-shop-services";
import { useOncePress } from "@/hooks/use-once-press";
import { androidRefreshScrollProps } from "@/lib/refresh-scroll-props";
import { resolveShopOwnerBackTo } from "@/lib/shop-owner-navigation";
import type { MyServiceCategoryPayload } from "@/types/auto-shop-owner-endpoints";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  InteractionManager,
  Keyboard,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView as RNScrollView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type DraftLine = { id?: string; name: string; desc: string; price: number };
type DraftCategory = { id: string; name: string; subServices: DraftLine[] };

function SkeletonLine({ w }: { w: number | `${number}%` }) {
  return <View style={[styles.skeletonLine, { width: w }]} />;
}

function ServicesSkeleton() {
  return (
    <View style={styles.skeletonList} pointerEvents="none">
      <SurfaceCard shadow="card" style={styles.skeletonCard}>
        <View style={styles.skeletonHead}>
          <SkeletonLine w="42%" />
          <SkeletonLine w={64} />
        </View>
        <View style={styles.skeletonCardStack}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={styles.skeletonSubCard}>
              <View style={styles.skeletonSubCardTop}>
                <SkeletonLine w="55%" />
                <SkeletonLine w={72} />
              </View>
              <SkeletonLine w="88%" />
              <SkeletonLine w="62%" />
              <View style={styles.skeletonActions}>
                <View style={styles.skeletonDot} />
                <View style={styles.skeletonDot} />
              </View>
            </View>
          ))}
        </View>
      </SurfaceCard>
    </View>
  );
}

export default function ServicesCatalogPage() {
  const params = useLocalSearchParams<{ backTo?: string | string[]; qa?: string | string[] }>();
  const backTo = resolveShopOwnerBackTo(params.backTo);
  const fromQuickAction = params.qa === "1" || params.qa === "true";
  const { token, meta } = useAuth();
  const { showToast } = useToast();
  const isAutoShopOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";

  const { categories: myShopCategories, loading: myShopLoading, load: loadMyShopServices, save, removeSubServiceByName } = useMyShopServices(
    token,
    isAutoShopOwner,
    showToast
  );
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
  const [draftCategories, setDraftCategories] = useState<DraftCategory[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const keyboardBottom = useKeyboardBottomInset();
  const keyboardOpen = keyboardBottom > 0;

  const requestCloseSheet = useCallback(() => {
    // Avoid modal "glitch" when closing while an input is focused (Android/iOS).
    if (keyboardOpen) {
      Keyboard.dismiss();
      setTimeout(() => setSheetOpen(false), 80);
      return;
    }
    setSheetOpen(false);
  }, [keyboardOpen]);

  useFocusEffect(
    useCallback(() => {
      if (fromQuickAction) {
        setSelectedServiceIndex(0);
        setSheetOpen(false);
        setEditingLineIndex(null);
        setFormName("");
        setFormPrice("");
        setFormDesc("");
        router.setParams(backTo ? { qa: undefined, backTo } : { qa: undefined });
      }
      void loadMyShopServices();
      return undefined;
    }, [backTo, fromQuickAction, loadMyShopServices])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    InteractionManager.runAfterInteractions(() => {
      void loadMyShopServices().finally(() => setRefreshing(false));
    });
  }, [loadMyShopServices]);

  const serviceOptions = useMemo(() => {
    const out: { id: string; name: string }[] = [];
    for (let i = 0; i < myShopCategories.length; i += 1) {
      const cat = myShopCategories[i];
      out.push({ id: cat.id, name: cat.name?.trim() || `Service ${i + 1}` });
    }
    return out;
  }, [myShopCategories]);

  useEffect(() => {
    if (serviceOptions.length === 0) {
      setSelectedServiceIndex(0);
      return;
    }
    if (selectedServiceIndex >= serviceOptions.length) {
      setSelectedServiceIndex(serviceOptions.length - 1);
    }
  }, [selectedServiceIndex, serviceOptions.length]);

  useEffect(() => {
    const merged: DraftCategory[] = myShopCategories.map((cat, index) => ({
      id: cat.id,
      name: cat.name?.trim() || `Service ${index + 1}`,
      subServices: cat.subServices.map((s) => ({
        id: s.id,
        name: s.name,
        desc: s.desc,
        price: s.price,
      })),
    }));
    setDraftCategories(merged);
  }, [myShopCategories]);

  const hasServices = serviceOptions.length > 0;
  const servicesSelectionBackTo = `/(shop-owner)/services?backTo=${encodeURIComponent(backTo)}`;

  const openServicesSelection = useOncePress(() => {
    router.push({
      pathname: "/(shop-owner)/services-selection",
      params: { backTo: servicesSelectionBackTo },
    });
  });

  const selectedService = serviceOptions[selectedServiceIndex];
  const selectedDraft = selectedService ? draftCategories.find((x) => x.id === selectedService.id) : null;
  const selectedRows = selectedDraft?.subServices ?? [];
  const visibleRows = useMemo(() => {
    const selectedName = selectedService?.name?.trim().toLowerCase();
    return selectedRows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => {
        if (!selectedName) {
          return true;
        }
        return row.name.trim().toLowerCase() !== selectedName;
      });
  }, [selectedRows, selectedService?.name]);

  const openAddSheet = useOncePress(() => {
    if (!hasServices) {
      return;
    }
    setEditingLineIndex(null);
    setFormName("");
    setFormPrice("");
    setFormDesc("");
    setSheetOpen(true);
  });

  const openEditSheet = useOncePress((index: number) => {
    const row = selectedRows[index];
    if (!row) {
      return;
    }
    setEditingLineIndex(index);
    setFormName(row.name);
    setFormPrice(String(row.price));
    setFormDesc(row.desc);
    setSheetOpen(true);
  });

  async function persist(nextDraft: DraftCategory[]) {
    const payload: MyServiceCategoryPayload[] = nextDraft.map((cat) => ({
      id: cat.id,
      subServices: cat.subServices.map((line) => {
        const base = {
          name: line.name.trim(),
          desc: line.desc.trim(),
          price: Number.isFinite(line.price) ? line.price : 0,
        };
        const sid = line.id?.trim();
        return sid ? { id: sid, ...base } : base;
      }),
    }));
    setSaving(true);
    const mode = myShopCategories.length > 0 ? "update" : "create";
    const ok = await save(payload, mode);
    if (ok) {
      setDraftCategories(nextDraft);
    }
    setSaving(false);
    return ok;
  }

  async function onSaveSheet() {
    if (!selectedService) {
      return;
    }
    const name = formName.trim();
    if (!name) {
      showToast("Subcategory name is required.", { type: "error" });
      return;
    }
    const parsed = Number.parseFloat(formPrice.trim());
    if (!Number.isFinite(parsed)) {
      showToast("Please enter a valid price.", { type: "error" });
      return;
    }

    const next = draftCategories.map((cat) => {
      if (cat.id !== selectedService.id) {
        return cat;
      }
      const rows = [...cat.subServices];
      const prevId = editingLineIndex != null ? rows[editingLineIndex]?.id : undefined;
      const line: DraftLine = { id: prevId, name, desc: formDesc.trim(), price: parsed };
      if (editingLineIndex == null) {
        rows.push(line);
      } else {
        rows[editingLineIndex] = line;
      }
      return { ...cat, subServices: rows };
    });
    const ok = await persist(next);
    if (ok) {
      setSheetOpen(false);
    }
  }

  async function onDeleteRow(index: number) {
    if (!selectedService) {
      return;
    }
    const row = selectedRows[index];
    if (!row) {
      return;
    }
    setSaving(true);
    const ok = await removeSubServiceByName(selectedService.id, row.name);
    setSaving(false);
    if (!ok) {
      return;
    }
    // Optimistic UI: remove from draft immediately (load() will reconcile anyway).
    setDraftCategories((prev) =>
      prev.map((cat) =>
        cat.id !== selectedService.id
          ? cat
          : { ...cat, subServices: cat.subServices.filter((_, i) => i !== index) }
      )
    );
  }

  function confirmDeleteRow(index: number, lineName: string) {
    const label = lineName.trim() || "this subcategory";
    Alert.alert("Delete subcategory?", `Remove "${label}" from ${selectedService?.name ?? "this service"}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void onDeleteRow(index) },
    ]);
  }

  return (
    <StackScreenFrame
      title="Services"
      backgroundColor={colors.bgDeals}
      scroll={false}
      backTo={backTo}
    >
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          alwaysBounceVertical
          {...androidRefreshScrollProps(onRefresh)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {hasServices ? (
            <View style={styles.serviceSwitchWrap}>
              <Pressable
                hitSlop={8}
                disabled={selectedServiceIndex <= 0}
                onPress={() => setSelectedServiceIndex((p) => Math.max(0, p - 1))}
              >
                <Ionicons name="chevron-back" size={24} color={selectedServiceIndex <= 0 ? "#A8CDAE" : colors.successDark} />
              </Pressable>
              <Text style={styles.serviceSwitchText}>{selectedService?.name ?? "Service"}</Text>
              <Pressable
                hitSlop={8}
                disabled={selectedServiceIndex >= serviceOptions.length - 1}
                onPress={() => setSelectedServiceIndex((p) => Math.min(serviceOptions.length - 1, p + 1))}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={selectedServiceIndex >= serviceOptions.length - 1 ? "#A8CDAE" : colors.successDark}
                />
              </Pressable>
            </View>
          ) : null}

          {myShopLoading && !hasServices ? (
            <ServicesSkeleton />
          ) : !hasServices ? (
            <SurfaceCard shadow="card" style={styles.emptyCard}>
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="build-outline" size={56} color={colors.textLight} />
                </View>
                <Text style={styles.emptyTitle}>No services selected</Text>
                <Text style={styles.emptySub}>
                  Select the services your shop offers from Profile before adding subcategories.
                </Text>
                <Pressable style={styles.emptyCta} onPress={() => openServicesSelection?.()}>
                  <Ionicons name="person-outline" size={18} color={colors.white} />
                  <Text style={styles.emptyCtaText}>Select services from Profile</Text>
                </Pressable>
              </View>
            </SurfaceCard>
          ) : (
            <SurfaceCard shadow="card" style={styles.tableCard}>
              <View style={styles.tableCardHead}>
                <View style={styles.tableTitleWrap}>
                  <Ionicons name="build-outline" size={16} color={colors.primary} />
                  <Text style={styles.tableTitle}>{selectedService?.name ?? "Service"}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{visibleRows.length} items</Text>
                </View>
              </View>

              {visibleRows.length === 0 ? (
                <Text style={styles.emptyRows}>No subcategories yet.</Text>
              ) : (
                <View style={styles.subServiceCardList}>
                  {visibleRows.map(({ row: line, index: rowIndex }) => (
                    <View
                      key={line.id?.trim() ? line.id : `${line.name}-${rowIndex}`}
                      style={styles.subServiceCard}
                    >
                      <View style={styles.subServiceCardTop}>
                        <Text style={styles.subServiceName} numberOfLines={2}>
                          {line.name}
                        </Text>
                        <Text style={styles.subServicePrice}>₹{line.price}</Text>
                      </View>
                      <Text style={styles.subServiceDesc} numberOfLines={4}>
                        {line.desc?.trim() ? line.desc : "No description"}
                      </Text>
                      <View style={styles.subServiceActions}>
                        <Pressable
                          style={styles.iconBtn}
                          onPress={() => openEditSheet?.(rowIndex)}
                          hitSlop={6}
                        >
                          <Ionicons name="create-outline" size={16} color={colors.primary} />
                        </Pressable>
                        <Pressable
                          style={[styles.iconBtn, styles.iconBtnDanger]}
                          onPress={() => confirmDeleteRow(rowIndex, line.name)}
                          hitSlop={6}
                        >
                          <Ionicons name="trash-outline" size={16} color="#D84D4D" />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <Pressable style={styles.addRowBtn} onPress={() => openAddSheet?.()}>
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={styles.addRowText}>Add New Subcategory</Text>
              </Pressable>
            </SurfaceCard>
          )}


        </ScrollView>
      </View>

      <Modal transparent visible={sheetOpen} animationType="slide" onRequestClose={requestCloseSheet}>
        <ModalKeyboardRoot onBackdropPress={requestCloseSheet} scrimColor="rgba(0,0,0,0.38)">
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTitleRow}>
              <View style={styles.tableTitleWrap}>
                <Ionicons name="build-outline" size={18} color={colors.primary} />
                <Text style={styles.sheetTitle}>{editingLineIndex == null ? "Add Sub Category" : "Edit Sub Category"}</Text>
              </View>
              <Pressable style={styles.sheetClose} onPress={requestCloseSheet}>
                <Ionicons name="close" size={18} color="#D84D4D" />
              </Pressable>
            </View>
            <RNScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              automaticallyAdjustKeyboardInsets
              showsVerticalScrollIndicator={false}
              bounces={false}
              style={styles.sheetFormScroll}
              contentContainerStyle={styles.sheetFormScrollContent}
            >
              <View style={styles.badgeInSheet}>
                <Text style={styles.badgeText}>{selectedService?.name ?? "Service"}</Text>
              </View>

              <Text style={styles.inputLabel}>Subcategory Name *</Text>
              <TextInput value={formName} onChangeText={setFormName} style={styles.input} placeholder="Subcategory name" />

              <Text style={styles.inputLabel}>Price *</Text>
              <TextInput
                value={formPrice}
                onChangeText={setFormPrice}
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                value={formDesc}
                onChangeText={setFormDesc}
                style={[styles.input, styles.descInput]}
                placeholder="Description"
                multiline
              />

              <Pressable
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={() => void onSaveSheet()}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Subcategory"}</Text>
              </Pressable>
            </RNScrollView>
          </View>
        </ModalKeyboardRoot>
      </Modal>
    </StackScreenFrame>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },
  loadingWrap: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: { color: colors.textMuted, fontSize: fontSizes.md },
  skeletonList: { paddingTop: spacing.sm },
  skeletonCard: { borderRadius: radii.xxl, padding: spacing.lg, borderWidth: 1, borderColor: "#EEF2FF" },
  skeletonHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  skeletonCardStack: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  skeletonSubCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.sm,
  },
  skeletonSubCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  skeletonActions: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs },
  skeletonDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#EDF2F7" },
  skeletonLine: { height: 12, borderRadius: 8, backgroundColor: "#EDF2F7" },
  serviceSwitchWrap: {
    borderWidth: 1.5,
    borderColor: colors.success,
    borderRadius: radii.xl,
    backgroundColor: "#EEF8EE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    minHeight: 42,
  },
  serviceSwitchText: {
    fontSize: cardFontSizes.lg,
    fontWeight: "800",
    color: colors.successDark,
  },
  tableCard: {
    padding: 0,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  tableCardHead: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F4F8FF",
  },
  tableTitleWrap: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  tableTitle: {
    ...typography.cardTitle,
    color: colors.primary,
    fontSize: cardFontSizes.xl,
  },
  badge: {
    backgroundColor: "#E6F1FF",
    borderRadius: radii.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeInSheet: {
    alignSelf: "flex-start",
    marginBottom: spacing.md,
    backgroundColor: "#E6F1FF",
    borderRadius: radii.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: { color: colors.primary, fontWeight: "700", fontSize: cardFontSizes.sm },
  subServiceCardList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subServiceCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    backgroundColor: colors.white,
    padding: spacing.md,
    ...shadows.soft,
  },
  subServiceCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  subServiceName: {
    flex: 1,
    fontSize: cardFontSizes.lg,
    fontWeight: "800",
    color: colors.text,
  },
  subServicePrice: {
    fontSize: cardFontSizes.xl,
    fontWeight: "800",
    color: colors.primary,
  },
  subServiceDesc: {
    fontSize: cardFontSizes.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  subServiceActions: {
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "flex-end",
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF5FF",
  },
  iconBtnDanger: { backgroundColor: "#FFF0F0" },
  emptyCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyIcon: { marginBottom: spacing.xs },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "900",
    color: colors.textMuted,
    textAlign: "center",
  },
  emptySub: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textLight,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  emptyCta: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.round,
    backgroundColor: colors.primary,
  },
  emptyCtaText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: "800",
  },
  emptyRows: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    fontSize: cardFontSizes.sm,
    color: colors.textMuted,
  },
  addRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  addRowText: { color: colors.primary, fontSize: cardFontSizes.xl, fontWeight: "800" },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    maxHeight: "88%",
    width: "100%",
    ...shadows.card,
  },
  sheetFormScroll: {
    flexGrow: 0,
    flexShrink: 1,
    maxHeight: 360,
  },
  sheetFormScrollContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 3,
    borderRadius: radii.round,
    backgroundColor: "#E6E8EF",
    marginBottom: spacing.xs,
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: { ...typography.cardTitle, color: colors.text },
  sheetClose: {
    width: 28,
    height: 28,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F0",
  },
  inputLabel: { fontSize: fontSizes.sm, color: colors.textMuted, fontWeight: "700", marginTop: spacing.xs },
  input: {
    minHeight: 42,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFF",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  descInput: { minHeight: 72, paddingTop: spacing.xs, textAlignVertical: "top" },
  saveBtn: {
    marginTop: spacing.sm,
    minHeight: 44,
    borderRadius: radii.lg,
    backgroundColor: "#5A50C8",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: { opacity: 0.75 },
  saveBtnText: { color: colors.white, fontSize: fontSizes.lg, fontWeight: "800" },
});
