import { CustomerCard } from "@/components/customers";
import { CustomerVehicleFields } from "@/components/customers/customer-vehicle-fields";
import { DatePeriodFilter, Fab, ModalKeyboardRoot, Pill, StackScreenFrame, SurfaceCard, useToast } from "@/components/reusables";
import { ShopOwnerCityPickerModal } from "@/components/shop-owner/shop-owner-city-picker-modal";
import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useCarCompanyCatalog } from "@/hooks/use-car-company-catalog";
import { useKeyboardBottomInset } from "@/hooks/use-keyboard-bottom-inset";
import { customerKey, hitKey, useMyCustomers } from "@/hooks/use-my-customers";
import { useOncePress } from "@/hooks/use-once-press";
import { toUpdateCustomerVehicleRows, type MyCustomersPeriod } from "@/lib/auto-shop-owner-api";
import type { DatePeriodTimeFilter } from "@/lib/date-period-labels";
import {
  loadCustomerCityForForm,
  optionalCityField,
  pickCustomerCity,
  userCityFromPick,
} from "@/lib/pick-customer-city";
import {
  formatPincodeDisplay,
  hasCanadianPostalCodeValidationError,
  isValidCanadianPostalCode,
  normalizePostalCodeForStorage,
  PINCODE_DISPLAY_MAX_LENGTH,
  POSTAL_CODE_ERROR_MESSAGE,
} from "@/lib/validation";
import type { CarOwnerSearchHit, CustomerVehicle, MyCustomer, UpdateMyCustomerVehiclePayload } from "@/types/auto-shop-owner-endpoints";
import type { UserCity } from "@/types/user-cities";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  InteractionManager,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

function isValidEmail(v: string) {
  const s = v.trim();
  if (!s) return true; // email is optional in this editor
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isValidYear(v: string) {
  const s = v.trim();
  if (!/^\d{4}$/.test(s)) return false;
  const y = Number(s);
  const current = new Date().getFullYear();
  return y >= 1900 && y <= current + 1;
}

/** Returns an error message for `showToast`, or null if valid. */
function vehiclesPayloadErrorMessage(
  vehicles: UpdateMyCustomerVehiclePayload[],
  opts?: { skipVinLengthCheck?: boolean }
): string | null {
  for (const v of vehicles) {
    if (!v.licensePlateNo || !v.vehicleName || !v.model || !v.year) {
      return "Each vehicle needs plate, name, model, and year.";
    }
    if (v.licensePlateNo.length > 14) {
      return "License plate must be at most 14 characters.";
    }
    if (!opts?.skipVinLengthCheck && v.vinNo && v.vinNo.length !== 17) {
      return "VIN number must be exactly 17 characters.";
    }
    if (!isValidYear(v.year)) {
      return "Enter a valid year (e.g. 2015).";
    }
  }
  return null;
}

function SkeletonLine({ w }: { w: number | `${number}%` }) {
  return <View style={[styles.skeletonLine, { width: w }]} />;
}

function CustomerSkeletonList() {
  return (
    <View style={styles.skeletonList} pointerEvents="none">
      {Array.from({ length: 7 }).map((_, i) => (
        <SurfaceCard key={i} shadow="soft" style={styles.skeletonCard}>
          <View style={styles.skeletonTopRow}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonTopText}>
              <SkeletonLine w="58%" />
              <SkeletonLine w="36%" />
            </View>
          </View>
          <View style={styles.skeletonMid}>
            <SkeletonLine w="84%" />
            <SkeletonLine w="66%" />
          </View>
        </SurfaceCard>
      ))}
    </View>
  );
}

function displayPhone(c: MyCustomer | CarOwnerSearchHit) {
  const cc = c.countryCode?.trim();
  const p = c.phone?.trim();
  if (cc && p) {
    return `${cc} ${p}`;
  }
  return p ?? "—";
}

type ListRow =
  | { kind: "mine"; customer: MyCustomer }
  | { kind: "hit"; hit: CarOwnerSearchHit };

export default function CustomersPage() {
  const { qa: qaParam } = useLocalSearchParams<{ qa?: string }>();
  const fromQuickAction = qaParam === "1" || qaParam === "true";
  const { token, meta } = useAuth();
  const { showToast } = useToast();
  const isOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";

  const [searchText, setSearchText] = useState("");
  const [timeFilter, setTimeFilter] = useState<DatePeriodTimeFilter>("All");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const anchorRef = useRef<Date>(anchorDate);
  useEffect(() => {
    anchorRef.current = anchorDate;
  }, [anchorDate]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<MyCustomer | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorEditable, setEditorEditable] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorSaveAttempted, setEditorSaveAttempted] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [editCity, setEditCity] = useState<UserCity | null>(null);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [editAddress, setEditAddress] = useState("");
  const [editVehicles, setEditVehicles] = useState<CustomerVehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const keyboardBottom = useKeyboardBottomInset();
  const keyboardOpen = keyboardBottom > 0;
  const carCompanyCatalog = useCarCompanyCatalog(token, editorOpen);

  const requestCloseEditor = useCallback(() => {
    if (keyboardOpen) {
      Keyboard.dismiss();
      setTimeout(() => setEditorOpen(false), 80);
      return;
    }
    setEditorOpen(false);
  }, [keyboardOpen]);

  useEffect(() => {
    if (!editorOpen) {
      setEditorSaveAttempted(false);
    }
  }, [editorOpen]);

  useEffect(() => {
    if (!editorOpen || !selectedCustomer || !token) {
      return;
    }
    let cancelled = false;
    void loadCustomerCityForForm(token, selectedCustomer as Record<string, unknown>).then((city) => {
      if (!cancelled) {
        setEditCity(city);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [editorOpen, selectedCustomer, token]);

  const listPeriod = useMemo<MyCustomersPeriod>(
    () => ({
      timeFilter,
      anchorDate,
    }),
    [timeFilter, anchorDate]
  );
  const periodKey = `${timeFilter}:${anchorDate.getTime()}`;
  const loadedPeriodRef = useRef<string>("");
  const [periodSwitchKey, setPeriodSwitchKey] = useState<string | null>(null);
  const sawLoadingForSwitchRef = useRef(false);

  const {
    customers,
    searchHits,
    loading,
    searching,
    loadCustomers,
    runSearch,
    addCustomer,
    removeCustomer,
    updateCustomer,
    setSearchHits,
  } = useMyCustomers(token, isOwner, showToast, listPeriod);

  const addCustomerGuarded = useOncePress(async (id: string) => {
    if (!id || addingId) {
      return;
    }
    setAddingId(id);
    try {
      await addCustomer(id);
    } finally {
      setAddingId(null);
    }
  });

  useEffect(() => {
    if (!loading) {
      loadedPeriodRef.current = periodKey;
    }
  }, [loading, periodKey]);

  const isDirectoryMode = searchText.trim().length > 0;
  useEffect(() => {
    if (!periodSwitchKey || periodSwitchKey !== periodKey) {
      return;
    }
    if (loading) {
      sawLoadingForSwitchRef.current = true;
      return;
    }
    if (sawLoadingForSwitchRef.current) {
      setPeriodSwitchKey(null);
      sawLoadingForSwitchRef.current = false;
    }
  }, [loading, periodKey, periodSwitchKey]);
  const showPeriodSkeleton =
    !isDirectoryMode &&
    ((periodSwitchKey === periodKey && periodSwitchKey != null) || (loading && loadedPeriodRef.current !== periodKey));

  useEffect(() => {
    const t = setTimeout(() => {
      if (!searchText.trim()) {
        setSearchHits([]);
        return;
      }
      void runSearch(searchText);
    }, 450);
    return () => clearTimeout(t);
  }, [searchText, runSearch, setSearchHits]);

  useFocusEffect(
    useCallback(() => {
      if (fromQuickAction) {
        const nextAnchor = new Date();
        setPeriodSwitchKey(`All:${nextAnchor.getTime()}`);
        sawLoadingForSwitchRef.current = false;
        setTimeFilter("All");
        setAnchorDate(nextAnchor);
        setSearchText("");
        setSearchHits([]);
        setExpandedId(null);
        setEditorOpen(false);
        setSelectedCustomer(null);
        router.setParams({ qa: undefined });
        return undefined;
      }
      void loadCustomers();
      return undefined;
    }, [fromQuickAction, loadCustomers, setSearchHits])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    InteractionManager.runAfterInteractions(() => {
      void loadCustomers().finally(() => setRefreshing(false));
    });
  }, [loadCustomers]);

  const openAddCustomer = useOncePress(() => {
    router.push({
      pathname: "/(shop-owner)/customers/add",
      params: { mode: "add", backTo: "/(shop-owner)/customers" },
    });
  });
  const openCustomerForm = useOncePress(
    (mode: "view" | "edit", customer: MyCustomer, vehicleIndex?: number) => {
      router.push({
        pathname: "/(shop-owner)/customers/add",
        params: {
          mode,
          customer: encodeURIComponent(JSON.stringify(customer)),
          backTo: "/(shop-owner)/customers",
          ...(typeof vehicleIndex === "number" && Number.isFinite(vehicleIndex) && vehicleIndex >= 0
            ? { vehicleIndex: String(vehicleIndex) }
            : {}),
        },
      });
    }
  );

  const openAddVehicleForCustomer = useOncePress((customer: MyCustomer) => {
    router.push({
      pathname: "/(shop-owner)/customers/add",
      params: {
        mode: "edit",
        customer: encodeURIComponent(JSON.stringify(customer)),
        backTo: "/(shop-owner)/customers",
        addVehicle: "1",
      },
    });
  });

  /** Server-filtered list for the selected Daily / Weekly / Monthly period. */
  const filteredMine = useMemo(() => customers, [customers]);

  const myIds = useMemo(() => {
    const s = new Set<string>();
    for (const c of customers) {
      const id = customerKey(c);
      if (id) {
        s.add(id);
      }
    }
    return s;
  }, [customers]);

  const rows: ListRow[] = useMemo(() => {
    if (isDirectoryMode) {
      return searchHits.map((hit) => ({ kind: "hit" as const, hit }));
    }
    return filteredMine.map((customer) => ({ kind: "mine" as const, customer }));
  }, [isDirectoryMode, searchHits, filteredMine]);

  const headerCount = isDirectoryMode ? searchHits.length : filteredMine.length;

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function openCustomerEditor(customer: MyCustomer, editable: boolean) {
    setSelectedCustomer(customer);
    setEditorOpen(true);
    setEditorEditable(editable);
    setEditName(customer.name ?? "");
    setEditEmail(customer.email ?? "");
    setEditPhone(customer.phone ?? "");
    setEditPincode(formatPincodeDisplay(customer.pincode ?? ""));
    setEditCity(userCityFromPick(pickCustomerCity(customer as Record<string, unknown>)));
    setEditAddress(customer.address ?? "");
    setEditVehicles((customer.vehicles ?? []).map((v) => ({ ...v })));
  }

  function updateVehicleField(index: number, patch: Partial<CustomerVehicle>) {
    setEditVehicles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function addVehicleRow() {
    setEditVehicles((prev) => [
      ...prev,
      {
        licensePlateNo: "",
        vinNo: "",
        vehicleName: "",
        model: "",
        year: "",
        odometerReading: "",
        isNew: true,
      },
    ]);
  }

  function removeVehicleRow(index: number) {
    setEditVehicles((prev) => prev.filter((_, i) => i !== index));
  }

  function confirmRemoveVehicleRow(index: number) {
    Alert.alert("Remove vehicle?", "This vehicle will be removed from the customer when you save.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeVehicleRow(index) },
    ]);
  }

  async function saveCustomerEdits() {
    setEditorSaveAttempted(true);
    const c = selectedCustomer;
    if (!c) {
      return;
    }
    const carOwnerId = customerKey(c);
    if (!carOwnerId) {
      showToast("Could not update customer (missing id).", { type: "error" });
      return;
    }
    if (!editName.trim() || !editPhone.trim()) {
      showToast("Name and phone are required.", { type: "error" });
      return;
    }
    if (editName.trim().length > 20) {
      showToast("Name must be at most 20 characters.", { type: "error" });
      return;
    }
    if (!isValidEmail(editEmail)) {
      showToast("Enter a valid email address.", { type: "error" });
      return;
    }
    const phoneDigits = editPhone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      showToast("Phone number must be 10 digits.", { type: "error" });
      return;
    }
    const pinDigits = normalizePostalCodeForStorage(editPincode);
    if (editPincode.trim() && !isValidCanadianPostalCode(editPincode)) {
      showToast(POSTAL_CODE_ERROR_MESSAGE, { type: "error" });
      return;
    }
    if (editAddress.trim().length > 50) {
      showToast("Address must be at most 50 characters.", { type: "error" });
      return;
    }
    const vehicles = toUpdateCustomerVehicleRows(editVehicles);
    const vehiclesErr = vehiclesPayloadErrorMessage(vehicles);
    if (vehiclesErr) {
      showToast(vehiclesErr, { type: "error" });
      return;
    }

    setEditorSaving(true);
    const ok = await updateCustomer({
      carOwnerId,
      name: editName.trim(),
      email: editEmail.trim(),
      countryCode: "+1",
      phone: phoneDigits,
      pincode: pinDigits,
      address: editAddress.trim().slice(0, 50),
      ...optionalCityField(editCity?.name),
      vehicles,
    });
    setEditorSaving(false);
    if (ok) {
      setEditorOpen(false);
      setSelectedCustomer(null);
    }
  }

  const removeVehicleFromCustomer = useCallback(
    async (customer: MyCustomer, vehicleIndex: number) => {
      const carOwnerId = customerKey(customer);
      if (!carOwnerId) {
        showToast("Could not update customer (missing id).", { type: "error" });
        return;
      }
      const list = customer.vehicles ?? [];
      if (list.length <= 1) {
        showToast("Keep at least one vehicle on file.", { type: "error" });
        return;
      }
      const nextVehicles = list.filter((_, i) => i !== vehicleIndex);
      const vehicles = toUpdateCustomerVehicleRows(nextVehicles);
      const vehiclesErr = vehiclesPayloadErrorMessage(vehicles, { skipVinLengthCheck: true });
      if (vehiclesErr) {
        showToast(vehiclesErr, { type: "error" });
        return;
      }
      const phoneDigits = (customer.phone ?? "").replace(/\D/g, "");
      if (!customer.name?.trim() || phoneDigits.length !== 10) {
        showToast("Fix customer name and phone before editing vehicles.", { type: "error" });
        return;
      }
      const pinDigits = normalizePostalCodeForStorage(customer.pincode ?? "");
      if (customer.pincode?.trim() && !isValidCanadianPostalCode(customer.pincode)) {
        showToast(POSTAL_CODE_ERROR_MESSAGE, { type: "error" });
        return;
      }
      if ((customer.email ?? "").trim() && !isValidEmail(customer.email ?? "")) {
        showToast("Enter a valid email address on the customer before editing vehicles.", { type: "error" });
        return;
      }
      await updateCustomer({
        carOwnerId,
        name: customer.name.trim(),
        email: (customer.email ?? "").trim(),
        countryCode: (customer.countryCode ?? "").trim(),
        phone: phoneDigits,
        pincode: pinDigits,
        address: (customer.address ?? "").trim().slice(0, 50),
        ...optionalCityField(customer.city),
        vehicles,
      });
    },
    [showToast, updateCustomer]
  );

  const confirmRemoveCustomerVehicle = useCallback(
    (customer: MyCustomer, vehicleIndex: number) => {
      Alert.alert("Remove vehicle?", "This vehicle will be removed from the customer.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => void removeVehicleFromCustomer(customer, vehicleIndex),
        },
      ]);
    },
    [removeVehicleFromCustomer]
  );

  /** Daily: ±1 day · Weekly: ±7 days (Mon–Sun blocks) · Monthly: ±1 calendar month */
  function stepPeriod(direction: -1 | 1) {
    const base = new Date(anchorRef.current);
    if (timeFilter === "Daily") {
      base.setDate(base.getDate() + direction);
    } else if (timeFilter === "Weekly") {
      base.setDate(base.getDate() + direction * 7);
    } else {
      base.setMonth(base.getMonth() + direction);
    }
    setPeriodSwitchKey(`${timeFilter}:${base.getTime()}`);
    sawLoadingForSwitchRef.current = false;
    setAnchorDate(base);
  }

  const listHeader = (
    <View style={styles.stickyHeader}>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color={colors.primary} />
        <TextInput
          placeholder="Search by name/phone/email/vehicle no.. plate"
          placeholderTextColor={colors.textLight}
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searching ? <View style={styles.searchingDot} /> : null}
        <Pressable
          onPress={() => {
            setSearchText("");
            setSearchHits([]);
          }}
          hitSlop={8}
        >
          <Ionicons name="close" size={20} color={colors.textLight} />
        </Pressable>
      </View>

      <DatePeriodFilter
        timeFilter={timeFilter}
        onTimeFilterChange={(item) => {
          const nextAnchor = new Date();
          setPeriodSwitchKey(`${item}:${nextAnchor.getTime()}`);
          sawLoadingForSwitchRef.current = false;
          setTimeFilter(item);
          setAnchorDate(nextAnchor);
        }}
        anchorDate={anchorDate}
        onStepPeriod={stepPeriod}
        interactionDisabled={isDirectoryMode}
      />
    </View>
  );

  const showEmpty =
    !loading &&
    (isDirectoryMode
      ? !searching && searchHits.length === 0
      : filteredMine.length === 0);

  const showSearchLoading = isDirectoryMode && searching && searchHits.length === 0;
  const showSkeleton = !isDirectoryMode && loading && rows.length === 0;

  return (
    <StackScreenFrame
      title="Customers"
      backgroundColor={colors.bgProfile}
      scroll={false}
      right={
        <Pill variant="white" style={styles.countWrap}>
          <Ionicons name="people-outline" size={16} color={colors.text} />
          <Text style={styles.countText}>
            {loading && !isDirectoryMode ? "…" : headerCount}
          </Text>
        </Pill>
      }
      floatingContent={
        expandedId == null ? (
          <Fab label="Add Customer" icon="person-add" onPress={() => openAddCustomer?.()} />
        ) : undefined
      }
    >
      <View style={styles.listWrap}>
        {showPeriodSkeleton ? (
          <View style={{ flex: 1 }}>
            {listHeader}
            <CustomerSkeletonList />
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(row, index) =>
              row.kind === "mine"
                ? customerKey(row.customer) || `m-${index}`
                : hitKey(row.hit) || `h-${index}`
            }
            style={styles.flexList}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            alwaysBounceVertical
            nestedScrollEnabled
            {...(Platform.OS === "android" ? { overScrollMode: "always" as const } : {})}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListHeaderComponent={listHeader}
            stickyHeaderIndices={[0]}
            ListEmptyComponent={
              showSearchLoading ? (
                <View style={styles.centerEmpty}>
                  <Text style={styles.emptySub}>Searching…</Text>
                </View>
              ) : showSkeleton ? (
                <CustomerSkeletonList />
              ) : showEmpty ? (
                <View style={styles.emptyWrap}>
                  <Ionicons name="people-outline" size={62} color="#9DB7E8" />
                  <Text style={styles.emptyText}>No customers found</Text>
                </View>
              ) : loading ? (
                <View style={styles.centerEmpty}>
                  <CustomerSkeletonList />
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              if (item.kind === "mine") {
                const c = item.customer;
                const id = customerKey(c);
                const rowKey = id || c.name || "row";
                const expanded = (id || rowKey) === expandedId;
                const toggle = () => toggleExpanded(id || rowKey);
                return (
                  <CustomerCard
                    variant="mine"
                    name={c.name?.trim() || "—"}
                    phone={displayPhone(c)}
                    email={c.email}
                    address={c.address}
                    city={c.city}
                    pincode={c.pincode}
                    vehicles={c.vehicles ?? []}
                    footerTime={c.updatedAt ?? c.createdAt}
                    expanded={expanded}
                    onToggleExpand={toggle}
                    onView={() => openCustomerForm?.("view", c)}
                    onEdit={() => openCustomerForm?.("edit", c)}
                    onDelete={() => {
                      if (!id) {
                        return;
                      }
                      Alert.alert("Remove customer?", "They will be removed from your shop list.", [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Remove",
                          style: "destructive",
                          onPress: () => void removeCustomer(id),
                        },
                      ]);
                    }}
                    onEditVehicle={(vehicleIndex) => openCustomerForm?.("edit", c, vehicleIndex)}
                    onRemoveVehicle={(vehicleIndex) => confirmRemoveCustomerVehicle(c, vehicleIndex)}
                    onAddVehicle={() => openAddVehicleForCustomer?.(c)}
                  />
                );
              }

              const h = item.hit;
              const hid = hitKey(h);
              const rowKey = hid || h.name || "hit";
              const expanded = (hid || rowKey) === expandedId;
              const toggle = () => toggleExpanded(hid || rowKey);
              const inList = Boolean(hid && myIds.has(hid));
              return (
                <CustomerCard
                  variant="directory"
                  name={h.name?.trim() || "—"}
                  phone={displayPhone(h)}
                  email={h.email}
                  address={h.address}
                  city={h.city}
                  pincode={h.pincode}
                  vehicles={h.vehicles ?? []}
                  footerTime={h.updatedAt ?? h.createdAt}
                  expanded={expanded}
                  onToggleExpand={toggle}
                  showAddButton={Boolean(hid) && !inList}
                  addLabelInList={inList ? "In your list" : undefined}
                  addingToMine={Boolean(hid && addingId === hid)}
                  onAddToMine={hid ? () => addCustomerGuarded?.(hid) : undefined}
                  onView={() => {
                    if (!expanded) {
                      toggle();
                    }
                  }}
                />
              );
            }}
          />
        )}
        {loading && !refreshing && !isDirectoryMode && rows.length > 0 ? (
          <View style={styles.listLoadingOverlay} pointerEvents="auto">
            <View style={styles.miniSkeletonOverlay}>
              <View style={styles.miniSkeletonBar} />
              <View style={[styles.miniSkeletonBar, { width: "72%" }]} />
            </View>
          </View>
        ) : null}
      </View>

      <Modal visible={editorOpen} transparent animationType="slide" onRequestClose={requestCloseEditor}>
        <ModalKeyboardRoot onBackdropPress={requestCloseEditor} scrimColor="rgba(0,0,0,0.35)">
          <View style={styles.editorSheet}>
            <View style={styles.editorHandle} />
            <View style={styles.editorHeader}>
              <Text style={styles.editorTitle}>{editorEditable ? "Edit Customer" : "Customer Details"}</Text>
              {!editorEditable ? (
                <Pressable
                  style={styles.editorTopBtn}
                  onPress={() => {
                    setEditorEditable(true);
                  }}
                >
                  <Text style={styles.editorTopBtnText}>Edit</Text>
                </Pressable>
              ) : null}
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              automaticallyAdjustKeyboardInsets
              showsVerticalScrollIndicator={false}
              style={styles.editorScroll}
              contentContainerStyle={styles.editorBody}
            >
              <TextInput
                value={editName}
                onChangeText={(t) => setEditName(t.slice(0, 20))}
                style={styles.editorInput}
                editable={editorEditable}
                placeholder="Name"
                maxLength={20}
              />
              {editorEditable && editorSaveAttempted && !editName.trim() ? (
                <Text style={styles.editorErrorText}>Name is required.</Text>
              ) : null}
              <TextInput
                value={editEmail}
                onChangeText={(t) => setEditEmail(t.slice(0, 80))}
                style={styles.editorInput}
                editable={editorEditable}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                maxLength={80}
              />
              {editorEditable && editEmail.trim() && !isValidEmail(editEmail) ? (
                <Text style={styles.editorErrorText}>Enter a valid email address.</Text>
              ) : null}
              <TextInput
                value={editPhone}
                onChangeText={(t) => setEditPhone(t.replace(/\D/g, "").slice(0, 10))}
                style={styles.editorInput}
                editable={editorEditable}
                placeholder="Phone"
                keyboardType="number-pad"
                maxLength={10}
              />
              {editorEditable && editorSaveAttempted && editPhone.replace(/\D/g, "").length !== 10 ? (
                <Text style={styles.editorErrorText}>Phone number must be 10 digits.</Text>
              ) : null}
              <TextInput
                value={editPincode}
                onChangeText={(t) => setEditPincode(formatPincodeDisplay(t))}
                style={styles.editorInput}
                editable={editorEditable}
                placeholder="A1A 1A1"
                autoCapitalize="characters"
                maxLength={PINCODE_DISPLAY_MAX_LENGTH}
              />
              {editorEditable && hasCanadianPostalCodeValidationError(editPincode) ? (
                <Text style={styles.editorErrorText}>{POSTAL_CODE_ERROR_MESSAGE}</Text>
              ) : null}
              <Pressable
                style={[styles.editorInput, styles.editorCityRow, !editorEditable && styles.editorCityDisabled]}
                onPress={() => editorEditable && setCityPickerOpen(true)}
                disabled={!editorEditable}
              >
                <Text style={[styles.editorCityText, !editCity?.name?.trim() && styles.editorCityPlaceholder]}>
                  {editCity?.name?.trim() || "Select city…"}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textLight} />
              </Pressable>
              <TextInput
                value={editAddress}
                onChangeText={(t) => setEditAddress(t.slice(0, 50))}
                style={[styles.editorInput, styles.editorAddress]}
                editable={editorEditable}
                placeholder="Address"
                multiline
                maxLength={50}
              />
              {editorEditable && editAddress.trim().length > 50 ? (
                <Text style={styles.editorErrorText}>Address must be at most 50 characters.</Text>
              ) : null}
              <View style={styles.editorVehicleHead}>
                <Text style={styles.editorVehicleMeta}>Vehicles on file: {editVehicles.length}</Text>
                {editorEditable ? (
                  <Pressable style={styles.addVehicleMiniBtn} onPress={addVehicleRow}>
                    <Ionicons name="add" size={14} color={colors.white} />
                    <Text style={styles.addVehicleMiniText}>Add Vehicle</Text>
                  </Pressable>
                ) : null}
              </View>
              {editVehicles.length === 0 ? (
                <Text style={styles.noVehicleText}>No vehicles added.</Text>
              ) : (
                editVehicles.map((v, idx) => (
                  <View
                    key={v._id ?? `ev-${idx}`}
                    style={[styles.vehicleEditorCard, v.disabled && styles.vehicleEditorCardDisabled]}
                  >
                    <View style={styles.vehicleEditorTop}>
                      <View style={styles.vehicleEditorTitleRow}>
                        <Text style={styles.vehicleEditorTitle}>Vehicle {idx + 1}</Text>
                        {v.disabled ? (
                          <View style={styles.vehicleDisabledBadge}>
                            <Ionicons name="ban-outline" size={12} color={colors.danger} />
                            <Text style={styles.vehicleDisabledBadgeText}>Disabled</Text>
                          </View>
                        ) : null}
                      </View>
                      {editorEditable && editVehicles.length > 1 ? (
                        <Pressable onPress={() => confirmRemoveVehicleRow(idx)}>
                          <Text style={styles.vehicleRemoveText}>Remove</Text>
                        </Pressable>
                      ) : null}
                    </View>
                    {editorEditable ? (
                      <CustomerVehicleFields
                        vehicle={{
                          licensePlateNo: v.licensePlateNo ?? "",
                          vinNo: v.vinNo ?? "",
                          vehicleName: v.vehicleName ?? "",
                          model: v.model ?? "",
                          year: v.year ?? "",
                          odometerReading: v.odometerReading ?? "",
                        }}
                        onChange={(patch) => updateVehicleField(idx, patch)}
                        catalog={carCompanyCatalog}
                        attemptedSave={editorSaveAttempted}
                      />
                    ) : (
                      <View style={styles.vehicleReadOnly}>
                        <Text style={styles.vehicleReadOnlyText}>Plate: {v.licensePlateNo || "—"}</Text>
                        <Text style={styles.vehicleReadOnlyText}>Name: {v.vehicleName || "—"}</Text>
                        <Text style={styles.vehicleReadOnlyText}>Model: {v.model || "—"}</Text>
                        <Text style={styles.vehicleReadOnlyText}>Year: {v.year || "—"}</Text>
                        <Text style={styles.vehicleReadOnlyText}>VIN: {v.vinNo || "—"}</Text>
                        <Text style={styles.vehicleReadOnlyText}>Odometer: {v.odometerReading || "—"}</Text>
                        <Text style={styles.vehicleReadOnlyText}>Due odometer: {v.dueOdometerReading || "—"}</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
            <View style={styles.editorFooter}>
              <Pressable style={styles.editorCancel} onPress={() => setEditorOpen(false)}>
                <Text style={styles.editorCancelText}>Close</Text>
              </Pressable>
              {editorEditable ? (
                <Pressable style={styles.editorSave} onPress={() => void saveCustomerEdits()} disabled={editorSaving}>
                  <Text style={styles.editorSaveText}>{editorSaving ? "Saving..." : "Save"}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </ModalKeyboardRoot>
      </Modal>

      <ShopOwnerCityPickerModal
        visible={cityPickerOpen}
        onClose={() => setCityPickerOpen(false)}
        authToken={token}
        selectedId={editCity?.id ?? null}
        onSelect={(city) => {
          setEditCity(city);
          setCityPickerOpen(false);
        }}
      />
    </StackScreenFrame>
  );
}

const styles = StyleSheet.create({
  listWrap: { flex: 1, position: "relative" },
  stickyHeader: {
    backgroundColor: colors.bgProfile,
    paddingTop: spacing.sm,
  },
  listLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(243, 247, 253, 0.82)",
  },
  flexList: { flex: 1 },
  countWrap: {
    minWidth: 58,
    justifyContent: "center",
  },
  countText: { fontSize: fontSizes.md, fontWeight: "700", color: colors.text },
  searchWrap: {
    height: 44,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: "#ECF7EE",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: spacing.sm,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  listContent: { flexGrow: 1, paddingBottom: 120 },
  centerEmpty: { paddingVertical: spacing.xxl, alignItems: "center", gap: spacing.sm },
  emptySub: { color: colors.textMuted, fontSize: fontSizes.md },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: spacing.xxl },
  emptyText: { marginTop: spacing.sm, fontSize: fontSizes.hero, color: colors.textLight },
  // Floating add button now comes from StackScreenFrame `floatingContent` (consistent placement).
  editorSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    maxHeight: "92%",
    width: "100%",
  },
  editorScroll: {
    flexGrow: 0,
    flexShrink: 1,
    minHeight: 100,
    maxHeight: 400,
  },
  editorHandle: {
    width: 40,
    height: 3,
    borderRadius: radii.round,
    backgroundColor: colors.border,
    alignSelf: "center",
  },
  editorHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  editorTitle: { fontSize: fontSizes.xl, fontWeight: "800", color: colors.text },
  editorTopBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.lg,
    backgroundColor: colors.iconBlueTint,
  },
  editorTopBtnText: { color: colors.primary, fontWeight: "700" },
  editorBody: { gap: spacing.sm },
  editorInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 40,
    fontSize: fontSizes.sm,
    color: colors.text,
    backgroundColor: colors.white,
  },
  editorAddress: { minHeight: 64, textAlignVertical: "top" },
  editorCityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 40,
  },
  editorCityDisabled: { opacity: 0.55 },
  editorCityText: { flex: 1, fontSize: fontSizes.sm, fontWeight: "700", color: colors.text },
  editorCityPlaceholder: { color: colors.textLight, fontWeight: "600" },
  editorVehicleMeta: { color: colors.textMuted, fontSize: fontSizes.sm, marginTop: spacing.xs },
  editorVehicleHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xs },
  addVehicleMiniBtn: {
    height: 28,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  addVehicleMiniText: { color: colors.white, fontSize: fontSizes.xs, fontWeight: "700" },
  noVehicleText: { color: colors.textLight, fontSize: fontSizes.sm, fontStyle: "italic" },
  vehicleEditorCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.xs,
    gap: spacing.xs,
    backgroundColor: "#FAFBFF",
  },
  vehicleEditorCardDisabled: {
    opacity: 0.62,
    backgroundColor: "#F4F4F5",
    borderColor: "#E4E4E7",
  },
  vehicleEditorTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  vehicleEditorTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  vehicleEditorTitle: { fontSize: fontSizes.md, fontWeight: "800", color: colors.text },
  vehicleDisabledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.round,
    backgroundColor: colors.dangerMuted,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
  },
  vehicleDisabledBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: "800",
    color: colors.danger,
  },
  vehicleRemoveText: { color: colors.danger, fontWeight: "700", fontSize: fontSizes.sm },
  vehicleTwoCols: { flexDirection: "row", gap: spacing.sm },
  vehicleCol: { flex: 1 },
  vehicleReadOnly: { gap: spacing.xs },
  vehicleReadOnlyText: { fontSize: fontSizes.sm, color: colors.text },
  editorFooter: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.xs, marginTop: spacing.xs },
  editorCancel: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  editorCancelText: { color: colors.textMuted, fontWeight: "700" },
  editorSave: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary,
    minWidth: 90,
    alignItems: "center",
  },
  editorSaveText: { color: colors.white, fontWeight: "800" },
  editorErrorText: { marginTop: -4, color: colors.danger, fontSize: fontSizes.xs, fontWeight: "700" },
  searchingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#EDF2F7" },
  miniSkeletonOverlay: { width: "88%", maxWidth: 320, gap: 10 },
  miniSkeletonBar: { height: 12, borderRadius: 8, backgroundColor: "#EDF2F7", width: "86%" },
  skeletonList: { paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.md, gap: spacing.md },
  skeletonCard: { borderRadius: radii.xxl, padding: spacing.lg, borderWidth: 1, borderColor: "#EEF2FF" },
  skeletonTopRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  skeletonAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#EDF2F7" },
  skeletonTopText: { flex: 1, gap: 8 },
  skeletonLine: { height: 12, borderRadius: 8, backgroundColor: "#EDF2F7" },
  skeletonMid: { gap: 10 },
});
