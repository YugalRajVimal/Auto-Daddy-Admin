import { ModalKeyboardRoot, StackScreenFrame, SurfaceCard, useToast } from "@/components/reusables";
import { cardFontSizes, colors, fontSizes, radii, shadows, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useCarCompanyCatalog } from "@/hooks/use-car-company-catalog";
import { useKeyboardBottomInset } from "@/hooks/use-keyboard-bottom-inset";
import { useMyShopServices } from "@/hooks/use-my-shop-services";
import { useOncePress } from "@/hooks/use-once-press";
import { androidRefreshScrollProps } from "@/lib/refresh-scroll-props";
import { resolveShopOwnerBackTo } from "@/lib/shop-owner-navigation";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
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

type QuantityType = "Unit" | "Days";

type DraftLine = {
  id?: string;
  name: string;
  desc: string;
  price: number;
  make?: string;
  model?: string;
  qty?: number;
  quantityType?: QuantityType;
  labourCost?: number;
  tax?: number;
};
type DraftCategory = { id: string; name: string; subServices: DraftLine[] };

const QUANTITY_TYPE_OPTIONS: QuantityType[] = ["Unit", "Days"];

function formatMoney(value: number): string {
  return Number.isFinite(value) ? (value % 1 === 0 ? String(value) : value.toFixed(2)) : "0";
}

function lineQty(line: DraftLine): number {
  return line.qty != null && line.qty > 0 ? line.qty : 1;
}

function lineLabourCost(line: DraftLine): number {
  return line.labourCost != null && Number.isFinite(line.labourCost) ? line.labourCost : 0;
}

function lineAmount(line: DraftLine): number {
  return line.price * lineQty(line) + lineLabourCost(line);
}

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

  const {
    categories: myShopCategories,
    loading: myShopLoading,
    load: loadMyShopServices,
    addSubServiceLine,
    editSubServiceLine,
    removeSubServiceByName,
  } = useMyShopServices(token, isAutoShopOwner, showToast);
  const carCatalog = useCarCompanyCatalog(token, isAutoShopOwner);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
  const [draftCategories, setDraftCategories] = useState<DraftCategory[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formMake, setFormMake] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formQty, setFormQty] = useState("1");
  const [formQuantityType, setFormQuantityType] = useState<QuantityType>("Unit");
  const [formLabourCost, setFormLabourCost] = useState("0");
  const [vehiclePicker, setVehiclePicker] = useState<null | "make" | "model" | "qtyType">(null);
  const [refreshing, setRefreshing] = useState(false);
  const keyboardBottom = useKeyboardBottomInset();
  const keyboardOpen = keyboardBottom > 0;

  const requestCloseSheet = useCallback(() => {
    // Avoid modal "glitch" when closing while an input is focused (Android/iOS).
    setVehiclePicker(null);
    if (keyboardOpen) {
      Keyboard.dismiss();
      setTimeout(() => setSheetOpen(false), 80);
      return;
    }
    setSheetOpen(false);
  }, [keyboardOpen]);

  const makeOptions = useMemo(() => {
    const names = carCatalog.companies.map((c) => c.companyName.trim()).filter(Boolean);
    const current = formMake.trim();
    if (current && !names.some((n) => n === current)) {
      return [current, ...names];
    }
    return names;
  }, [carCatalog.companies, formMake]);

  const modelOptions = useMemo(() => {
    const models = carCatalog.modelOptionsFor(formMake).map((m) => m.modelName.trim()).filter(Boolean);
    const current = formModel.trim();
    if (current && !models.some((n) => n === current)) {
      return [current, ...models];
    }
    return models;
  }, [carCatalog, formMake, formModel]);

  const vehiclePickerItems =
    vehiclePicker === "make"
      ? makeOptions
      : vehiclePicker === "model"
        ? modelOptions
        : QUANTITY_TYPE_OPTIONS;

  const resetFormFields = useCallback(() => {
    setFormName("");
    setFormPrice("");
    setFormDesc("");
    setFormMake("");
    setFormModel("");
    setFormQty("1");
    setFormQuantityType("Unit");
    setFormLabourCost("0");
    setVehiclePicker(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (fromQuickAction) {
        setSelectedServiceIndex(0);
        setSheetOpen(false);
        setEditingLineIndex(null);
        resetFormFields();
        router.setParams(backTo ? { qa: undefined, backTo } : { qa: undefined });
      }
      void loadMyShopServices();
      return undefined;
    }, [backTo, fromQuickAction, loadMyShopServices, resetFormFields])
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
        make: s.make,
        model: s.model,
        qty: s.qty,
        quantityType: s.quantityType,
        labourCost: s.labourCost,
        tax: s.tax,
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
    resetFormFields();
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
    setFormMake(row.make?.trim() ?? "");
    setFormModel(row.model?.trim() ?? "");
    setFormQty(String(lineQty(row)));
    setFormQuantityType(row.quantityType === "Days" ? "Days" : "Unit");
    setFormLabourCost(String(lineLabourCost(row)));
    setVehiclePicker(null);
    setSheetOpen(true);
  });

  async function onSaveSheet() {
    if (!selectedService) {
      return;
    }
    const name = formName.trim();
    if (!name) {
      showToast("Category name is required.", { type: "error" });
      return;
    }
    const priceNum = Number.parseFloat(formPrice.trim());
    if (!Number.isFinite(priceNum)) {
      showToast("Enter a valid unit cost.", { type: "error" });
      return;
    }
    const qtyNum = Number.parseFloat(formQty.trim());
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      showToast("Enter a valid quantity.", { type: "error" });
      return;
    }
    const labourCostNum = Number.parseFloat(formLabourCost.trim());
    if (!Number.isFinite(labourCostNum) || labourCostNum < 0) {
      showToast("Enter a valid labor cost.", { type: "error" });
      return;
    }
    const payload = {
      name,
      desc: formDesc.trim(),
      price: priceNum,
      make: formMake.trim() || undefined,
      model: formModel.trim() || undefined,
      quantity: qtyNum,
      quantityType: formQuantityType,
      labourCost: labourCostNum,
    };

    setSaving(true);
    const ok =
      editingLineIndex == null
        ? await addSubServiceLine(selectedService.id, payload)
        : await editSubServiceLine(selectedService.id, editingLineIndex, payload);
    setSaving(false);
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
                  {visibleRows.map(({ row: line, index: rowIndex }) => {
                    const makeModel = [line.make?.trim(), line.model?.trim()].filter(Boolean).join(" · ");
                    const qtyType = line.quantityType === "Days" ? "Days" : "Unit";
                    const labour = lineLabourCost(line);
                    const amount = lineAmount(line);
                    const metaBits = [
                      `Qty ${lineQty(line)} ${qtyType}`,
                      labour > 0 ? `Labor ${formatMoney(labour)}` : null,
                      `Amount ${formatMoney(amount)}`,
                    ].filter(Boolean);
                    return (
                      <View
                        key={line.id?.trim() ? line.id : `${line.name}-${rowIndex}`}
                        style={styles.subServiceCard}
                      >
                        <View style={styles.subServiceCardTop}>
                          <Text style={styles.subServiceName} numberOfLines={2}>
                            {line.name}
                          </Text>
                          <Text style={styles.subServicePrice}>{formatMoney(line.price)}</Text>
                        </View>
                        {makeModel ? (
                          <Text style={styles.subServiceMeta} numberOfLines={1}>
                            {makeModel}
                          </Text>
                        ) : null}
                        <Text style={styles.subServiceDesc} numberOfLines={4}>
                          {line.desc?.trim() ? line.desc : "—"}
                        </Text>
                        <Text style={styles.subServiceMeta}>{metaBits.join(" · ")}</Text>
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
                    );
                  })}
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

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Make</Text>
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      setVehiclePicker("make");
                    }}
                    disabled={saving || carCatalog.loading}
                    style={({ pressed }) => [
                      styles.selectInput,
                      (saving || carCatalog.loading) && styles.selectInputDisabled,
                      pressed && styles.selectInputPressed,
                    ]}
                  >
                    <Text
                      style={[styles.selectInputText, !formMake.trim() && styles.selectInputPlaceholder]}
                      numberOfLines={1}
                    >
                      {carCatalog.loading
                        ? "Loading..."
                        : formMake.trim() || "Select make"}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Model</Text>
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      setVehiclePicker("model");
                    }}
                    disabled={saving || !formMake.trim()}
                    style={({ pressed }) => [
                      styles.selectInput,
                      (saving || !formMake.trim()) && styles.selectInputDisabled,
                      pressed && styles.selectInputPressed,
                    ]}
                  >
                    <Text
                      style={[styles.selectInputText, !formModel.trim() && styles.selectInputPlaceholder]}
                      numberOfLines={1}
                    >
                      {!formMake.trim()
                        ? "Select make first"
                        : formModel.trim() || "Select model"}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              </View>

              <Text style={styles.inputLabel}>Name Category *</Text>
              <TextInput
                value={formName}
                onChangeText={setFormName}
                style={styles.input}
                placeholder="Name category"
                editable={!saving}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                value={formDesc}
                onChangeText={setFormDesc}
                style={styles.input}
                placeholder="Description"
                editable={!saving}
              />

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Unit Cost *</Text>
                  <TextInput
                    value={formPrice}
                    onChangeText={setFormPrice}
                    style={styles.input}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    editable={!saving}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Qty</Text>
                  <TextInput
                    value={formQty}
                    onChangeText={setFormQty}
                    style={styles.input}
                    placeholder="1"
                    keyboardType="decimal-pad"
                    editable={!saving}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Qty Type</Text>
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      setVehiclePicker("qtyType");
                    }}
                    disabled={saving}
                    style={({ pressed }) => [
                      styles.selectInput,
                      saving && styles.selectInputDisabled,
                      pressed && styles.selectInputPressed,
                    ]}
                  >
                    <Text style={styles.selectInputText} numberOfLines={1}>
                      {formQuantityType}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Labor Cost</Text>
                  <TextInput
                    value={formLabourCost}
                    onChangeText={setFormLabourCost}
                    style={styles.input}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    editable={!saving}
                  />
                </View>
              </View>

              <Pressable
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={() => void onSaveSheet()}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving
                    ? editingLineIndex == null
                      ? "Saving..."
                      : "Updating..."
                    : editingLineIndex == null
                      ? "Save"
                      : "Update"}
                </Text>
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={requestCloseSheet} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </RNScrollView>
          </View>
        </ModalKeyboardRoot>
      </Modal>

      <Modal
        transparent
        visible={vehiclePicker != null}
        animationType="slide"
        onRequestClose={() => setVehiclePicker(null)}
      >
        <ModalKeyboardRoot onBackdropPress={() => setVehiclePicker(null)} scrimColor="rgba(0,0,0,0.42)">
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                {vehiclePicker === "make"
                  ? "Select make"
                  : vehiclePicker === "model"
                    ? "Select model"
                    : "Select qty type"}
              </Text>
              <Pressable onPress={() => setVehiclePicker(null)} hitSlop={10} accessibilityLabel="Close picker">
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>
            <FlatList
              data={vehiclePickerItems}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.pickerList}
              ListHeaderComponent={
                vehiclePicker === "make" || vehiclePicker === "model" ? (
                  <Pressable
                    style={({ pressed }) => [styles.pickerRow, pressed && styles.pickerRowPressed]}
                    onPress={() => {
                      if (vehiclePicker === "make") {
                        setFormMake("");
                        setFormModel("");
                      } else {
                        setFormModel("");
                      }
                      setVehiclePicker(null);
                    }}
                  >
                    <Text style={[styles.pickerRowText, styles.selectInputPlaceholder]} numberOfLines={1}>
                      {vehiclePicker === "make" ? "Select make" : "Select model"}
                    </Text>
                  </Pressable>
                ) : null
              }
              renderItem={({ item }) => {
                const selected =
                  vehiclePicker === "make"
                    ? item === formMake.trim()
                    : vehiclePicker === "model"
                      ? item === formModel.trim()
                      : item === formQuantityType;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.pickerRow,
                      pressed && styles.pickerRowPressed,
                      selected && styles.pickerRowSelected,
                    ]}
                    onPress={() => {
                      if (vehiclePicker === "make") {
                        setFormMake(item);
                        setFormModel("");
                      } else if (vehiclePicker === "model") {
                        setFormModel(item);
                      } else {
                        setFormQuantityType(item as QuantityType);
                      }
                      setVehiclePicker(null);
                    }}
                  >
                    <Text style={[styles.pickerRowText, selected && styles.pickerRowTextSelected]} numberOfLines={2}>
                      {item}
                    </Text>
                    {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={styles.pickerEmpty}>
                  <Text style={styles.pickerEmptyTitle}>No options</Text>
                  <Text style={styles.pickerEmptySub}>
                    {vehiclePicker === "model" ? "Select a make first." : "Car companies are unavailable."}
                  </Text>
                </View>
              }
            />
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
  subServiceMeta: {
    fontSize: cardFontSizes.sm,
    color: colors.textLight,
    fontWeight: "700",
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
    maxHeight: 420,
  },
  sheetFormScrollContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  formRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  formCol: {
    flex: 1,
    minWidth: 0,
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
  selectInput: {
    minHeight: 42,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFF",
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  selectInputDisabled: { opacity: 0.55 },
  selectInputPressed: { opacity: 0.88 },
  selectInputText: {
    flex: 1,
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: colors.text,
  },
  selectInputPlaceholder: {
    color: colors.textLight,
    fontWeight: "600",
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
  cancelBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  cancelBtnText: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  pickerSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    maxHeight: "80%",
    width: "100%",
    ...shadows.card,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.sm,
  },
  pickerTitle: { fontSize: fontSizes.lg, fontWeight: "900", color: colors.text },
  pickerList: { paddingBottom: spacing.md },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  pickerRowPressed: { opacity: 0.85 },
  pickerRowSelected: {
    backgroundColor: colors.primaryMutedBg,
    marginHorizontal: -spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  pickerRowText: { flex: 1, fontSize: fontSizes.md, fontWeight: "700", color: colors.text },
  pickerRowTextSelected: { color: colors.primary },
  pickerEmpty: { paddingVertical: spacing.xl, alignItems: "center", gap: spacing.xs },
  pickerEmptyTitle: { fontSize: fontSizes.md, fontWeight: "900", color: colors.text },
  pickerEmptySub: { fontSize: fontSizes.sm, fontWeight: "700", color: colors.textMuted, textAlign: "center" },
});
