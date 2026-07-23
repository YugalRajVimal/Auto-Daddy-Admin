import {
  ChevronLabelBar,
  Fab,
  ModalKeyboardRoot,
  Pill,
  StackScreenFrame,
  SurfaceCard,
  useToast,
} from "@/components/reusables";
import { ShopOwnerDealCard } from "@/components/shop-owner/shop-owner-deal-card";
import { cardFontSizes, cardTypography, colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useMyShopServices } from "@/hooks/use-my-shop-services";
import { useKeyboardBottomInset } from "@/hooks/use-keyboard-bottom-inset";
import { dealId, useMyDeals } from "@/hooks/use-my-deals";
import { useOncePress } from "@/hooks/use-once-press";
import { fetchVehicleTypesAndServices } from "@/lib/auto-shop-owner-api";
import { formatAutoshopDealOfferEndDate as formatDealOfferEndDate } from "@/lib/autoshopowner-deals-api";
import type { DealFormFields } from "@/hooks/use-my-deals";
import { dealCardImageAspectRatio, pickDealImageFromLibrary } from "@/lib/deal-card-image";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import { buildShopServiceDealOptions } from "@/lib/shop-service-deal-options";
import type { ShopDeal } from "@/types/auto-shop-owner-endpoints";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

function formatEnds(iso: string | undefined) {
  if (!iso) {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric", day: "numeric" });
}

type DealMode = "services" | "parts";
type Option = { label: string; value: string };

type VehicleTypesAndServices = {
  services?: Array<{ _id?: string; id?: string; name?: string; desc?: string }>;
  carDetails?: Array<{
    company?: string;
    id?: string;
    models?: Array<{ id?: string; name?: string; model?: string; year?: number | string }>;
  }>;
};

function SkeletonLine({ w }: { w: number | `${number}%` }) {
  return <View style={[styles.skeletonLine, { width: w }]} />;
}

function DealsSkeletonList() {
  return (
    <View style={styles.skeletonList} pointerEvents="none">
      {Array.from({ length: 5 }).map((_, i) => (
        <SurfaceCard key={i} shadow="card" style={styles.skeletonCard}>
          <View style={styles.skeletonTop}>
            <SkeletonLine w="44%" />
            <SkeletonLine w="62%" />
            <SkeletonLine w="80%" />
          </View>
          <View style={styles.skeletonBottom}>
            <SkeletonLine w={90} />
            <SkeletonLine w={120} />
          </View>
        </SurfaceCard>
      ))}
    </View>
  );
}

function SetupEmptyPrompt({
  icon,
  title,
  description,
  ctaLabel,
  onCta,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <View style={styles.setupEmpty}>
      <Ionicons name={icon} size={48} color={colors.textLight} />
      <Text style={styles.setupEmptyTitle}>{title}</Text>
      <Text style={styles.setupEmptyDesc}>{description}</Text>
      <Pressable style={styles.setupEmptyCta} onPress={onCta}>
        <Ionicons name="person-outline" size={18} color={colors.white} />
        <Text style={styles.setupEmptyCtaText}>{ctaLabel}</Text>
      </Pressable>
    </View>
  );
}

export default function DealsPage() {
  const router = useRouter();
  const { token, meta } = useAuth();
  const { showToast } = useToast();
  const isAutoShopOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";
  const { categories: myShopServices, load: loadMyShopServices } = useMyShopServices(token, isAutoShopOwner, showToast);
  const { deals, loading, loadDeals, removeDeal, createDeal, saveDeal } = useMyDeals(token, isAutoShopOwner, showToast);
  const [mode, setMode] = useState<DealMode>("services");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [modelYear, setModelYear] = useState("");
  const [partName, setPartName] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [description, setDescription] = useState("");
  const [offerEndDate, setOfferEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
  });
  const [showOfferDatePicker, setShowOfferDatePicker] = useState(false);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicleApi, setVehicleApi] = useState<VehicleTypesAndServices | null>(null);
  const [vehicleApiLoading, setVehicleApiLoading] = useState(false);
  const [vehicleApiError, setVehicleApiError] = useState<string | null>(null);
  const [selectedVehicleCompanyId, setSelectedVehicleCompanyId] = useState<string>("");
  const [selectedVehicleModel, setSelectedVehicleModel] = useState<string>("");
  const [selectedVehicleYear, setSelectedVehicleYear] = useState<string>("");
  const [dealImageUri, setDealImageUri] = useState<string | null>(null);
  const [dealImageMimeType, setDealImageMimeType] = useState<string | null>(null);
  const [dealImageFileName, setDealImageFileName] = useState<string | null>(null);
  const [hasExistingDealImage, setHasExistingDealImage] = useState(false);
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set());
  const keyboardBottom = useKeyboardBottomInset();
  const keyboardOpen = keyboardBottom > 0;

  const requestCloseSheet = useCallback(() => {
    // On Android, back/backdrop while a picker/dropdown is open can cause a visual "glitch".
    // Close transient UI first, then keyboard, then the sheet.
    if (showOfferDatePicker) {
      setShowOfferDatePicker(false);
      return;
    }
    if (serviceDropdownOpen || vehicleDropdownOpen || modelDropdownOpen) {
      setServiceDropdownOpen(false);
      setVehicleDropdownOpen(false);
      setModelDropdownOpen(false);
      return;
    }
    // Match Services sheet behavior: always dismiss keyboard first (keyboardOpen can lag),
    // then close the modal after a short delay to avoid flicker.
    Keyboard.dismiss();
    setTimeout(() => setSheetOpen(false), 140);
  }, [modelDropdownOpen, serviceDropdownOpen, showOfferDatePicker, vehicleDropdownOpen]);

  useFocusEffect(
    useCallback(() => {
      void loadMyShopServices();
      void loadDeals();
      if (token && isAutoShopOwner) {
        setVehicleApiLoading(true);
        setVehicleApiError(null);
        void fetchVehicleTypesAndServices(token)
          .then((res) => {
            if (!res.ok) {
              const msg =
                res.data && typeof res.data === "object" && "message" in res.data
                  ? String((res.data as { message?: string }).message ?? "")
                  : "";
              setVehicleApi(null);
              setVehicleApiError(msg || "Could not load vehicles.");
              return;
            }
            setVehicleApi(res.data as VehicleTypesAndServices);
          })
          .catch(() => {
            setVehicleApi(null);
            setVehicleApiError("Network error loading vehicles.");
          })
          .finally(() => setVehicleApiLoading(false));
      }
      return undefined;
    }, [isAutoShopOwner, loadDeals, loadMyShopServices, token])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    InteractionManager.runAfterInteractions(() =>
      void (async () => {
        try {
          await Promise.all([
            loadMyShopServices(),
            loadDeals(),
            token && isAutoShopOwner ? fetchVehicleTypesAndServices(token) : Promise.resolve(null),
          ]).then((vals) => {
            const last = vals[2] as any;
            if (last && typeof last === "object" && "ok" in last) {
              const res = last as { ok: boolean; data: unknown };
              if (res.ok) {
                setVehicleApi(res.data as VehicleTypesAndServices);
                setVehicleApiError(null);
              }
            }
          });
        } finally {
          setRefreshing(false);
        }
      })()
    );
  }, [isAutoShopOwner, loadDeals, loadMyShopServices, token]);

  const serviceOptions = useMemo<Option[]>(() => buildShopServiceDealOptions(myShopServices), [myShopServices]);

  const dealModeOf = useCallback((d: ShopDeal): DealMode => {
    const kind = (d.dealType ?? "").trim().toLowerCase();
    if (kind === "parts") {
      return "parts";
    }
    if (kind === "service") {
      return "services";
    }
    if (d.partName || d.selectedVehicle?.vehicleName || d.selectedVehicle?.name) {
      return "parts";
    }
    return "services";
  }, []);

  const visibleDeals = useMemo(() => deals.filter((d) => dealModeOf(d) === mode), [dealModeOf, deals, mode]);
  const barLabel = mode === "parts" ? "Parts Deals" : "Service Deals";

  const vehicleOptions = useMemo<Option[]>(() => {
    const list = vehicleApi?.carDetails;
    if (!Array.isArray(list)) return [];
    return list
      .map((c) => {
        const label = typeof c.company === "string" ? c.company.trim() : "";
        const value = typeof c.id === "string" ? c.id : label;
        return label ? { label, value } : null;
      })
      .filter(Boolean) as Option[];
  }, [vehicleApi?.carDetails]);

  const selectedVehicleCompany = useMemo(() => {
    const list = vehicleApi?.carDetails;
    if (!Array.isArray(list)) return null;
    return list.find((c) => (c.id || c.company) === selectedVehicleCompanyId) ?? null;
  }, [selectedVehicleCompanyId, vehicleApi?.carDetails]);

  const modelOptions = useMemo<Option[]>(() => {
    const models = selectedVehicleCompany?.models;
    if (!Array.isArray(models)) return [];
    return models
      .map((m) => {
        const model = typeof m.model === "string" ? m.model.trim() : "";
        const year = m.year != null ? String(m.year) : "";
        const label = model && year ? `${model} - ${year}` : model || year;
        const value = `${model}::${year}`;
        return label ? { label, value } : null;
      })
      .filter(Boolean) as Option[];
  }, [selectedVehicleCompany?.models]);

  const hasServices = myShopServices.length > 0;
  const hasVehicles = vehicleOptions.length > 0;
  const dealsBackTo = "/(shop-owner)/deals";

  const openServicesSelection = useOncePress(() => {
    router.push({
      pathname: "/(shop-owner)/services-selection",
      params: { backTo: dealsBackTo },
    });
  });

  const openCarCompanies = useOncePress(() => {
    router.push({
      pathname: "/(shop-owner)/car-companies",
      params: { backTo: dealsBackTo, from: "profile" },
    });
  });

  function promptSetupFromProfile(kind: "services" | "vehicles") {
    if (kind === "services") {
      Alert.alert(
        "No services selected",
        "Select the services your shop offers from Profile before creating a service deal.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Select services", onPress: () => openServicesSelection?.() },
        ]
      );
      return;
    }
    Alert.alert(
      "No vehicles selected",
      "Select the car companies your shop serves from Profile before creating a parts deal.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Select vehicles", onPress: () => openCarCompanies?.() },
      ]
    );
  }

  const toggleDealExpanded = useCallback((id: string) => {
    setExpandedDealId((cur) => (cur === id ? null : id));
  }, []);

  const confirmDelete = useCallback(
    (d: ShopDeal) => {
      const id = dealId(d);
      if (!id) {
        return;
      }
      Alert.alert("Delete deal?", "This cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeletingIds((prev) => new Set(prev).add(id));
              const ok = await removeDeal(id);
              setDeletingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
              });
              if (ok) {
                setExpandedDealId((cur) => (cur === id ? null : cur));
              }
            })();
          },
        },
      ]);
    },
    [removeDeal]
  );

  function cycleMode(delta: -1 | 1) {
    setMode((prev) => {
      if (delta === 1) {
        return prev === "services" ? "parts" : "services";
      }
      return prev === "services" ? "parts" : "services";
    });
  }

  function resetForm() {
    setServiceId("");
    setVehicleName("");
    setModelYear("");
    setSelectedVehicleCompanyId("");
    setSelectedVehicleModel("");
    setSelectedVehicleYear("");
    setPartName("");
    setDiscountedPrice("");
    setDescription("");
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    setOfferEndDate(d);
    setShowOfferDatePicker(false);
    setServiceDropdownOpen(false);
    setVehicleDropdownOpen(false);
    setModelDropdownOpen(false);
    setDealImageUri(null);
    setDealImageMimeType(null);
    setDealImageFileName(null);
    setHasExistingDealImage(false);
  }

  async function pickDealImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast("Photo library permission is required.", { type: "error" });
      return;
    }
    const picked = await pickDealImageFromLibrary();
    if (!picked) {
      return;
    }
    setDealImageUri(picked.uri);
    setDealImageMimeType(picked.mimeType);
    setDealImageFileName(picked.fileName);
  }

  const openCreate = useOncePress(() => {
    if (mode === "services" && !hasServices) {
      promptSetupFromProfile("services");
      return;
    }
    if (mode === "parts" && !vehicleApiLoading && !hasVehicles) {
      promptSetupFromProfile("vehicles");
      return;
    }
    setEditingId(null);
    resetForm();
    setSheetOpen(true);
  });

  const openEdit = useOncePress((d: ShopDeal) => {
    const id = dealId(d);
    if (!id) {
      return;
    }
    setEditingId(id);
    setServiceId(d.serviceId ?? "");
    setPartName(d.partName ?? d.productName ?? "");
    setDescription(d.description ?? "");
    setDiscountedPrice(d.discountedPrice != null ? String(d.discountedPrice) : "");
    if (d.offersEndOnDate) {
      const dt = new Date(d.offersEndOnDate);
      if (!Number.isNaN(dt.getTime())) {
        setOfferEndDate(dt);
      }
    }
    setMode(dealModeOf(d));
    const existingImage = d.dealImage?.trim() || d.productImage?.trim() || null;
    const normalized = normalizeMediaUrl(existingImage);
    setHasExistingDealImage(Boolean(normalized));
    setDealImageUri(normalized);
    setDealImageMimeType(null);
    setDealImageFileName(null);
    const v = d.selectedVehicle;
    const companyName = v?.vehicleName ?? v?.name ?? "";
    const companyId = d.vehicleId ?? v?.id ?? "";
    if (companyId) {
      setSelectedVehicleCompanyId(companyId);
      const match = vehicleOptions.find((o) => o.value === companyId);
      setVehicleName(match?.label ?? companyName);
    } else if (companyName) {
      setVehicleName(companyName);
      const match = vehicleOptions.find((o) => o.label === companyName);
      setSelectedVehicleCompanyId(match?.value ?? companyName);
    }
    if (v?.model || v?.year) {
      const yr = v.year ? String(v.year) : "";
      setSelectedVehicleModel(v.model ?? "");
      setSelectedVehicleYear(yr);
      setModelYear([v.model, yr].filter(Boolean).join(" - "));
    }
    setSheetOpen(true);
  });

  async function onSave() {
    if (!token || !isAutoShopOwner) {
      showToast("Sign in as auto shop owner.", { type: "error" });
      return;
    }
    if (!discountedPrice.trim()) {
      showToast("Discounted price is required.", { type: "error" });
      return;
    }
    if (mode === "parts" && !partName.trim()) {
      showToast("Enter part name.", { type: "error" });
      return;
    }
    if (mode === "parts" && !vehicleName.trim()) {
      showToast("Select vehicle.", { type: "error" });
      return;
    }
    if (mode === "parts" && !selectedVehicleModel.trim()) {
      showToast("Select vehicle model.", { type: "error" });
      return;
    }
    if (mode === "parts" && !selectedVehicleYear.trim()) {
      showToast("Select vehicle year.", { type: "error" });
      return;
    }
    if (!editingId && mode === "services" && !hasServices) {
      promptSetupFromProfile("services");
      return;
    }
    if (!editingId && mode === "parts" && !hasVehicles) {
      promptSetupFromProfile("vehicles");
      return;
    }
    const selectedServiceId = serviceId.trim();
    if (mode === "services" && !selectedServiceId) {
      showToast("Select a service.", { type: "error" });
      return;
    }
    if (!dealImageUri?.trim()) {
      showToast("Deal image is required.", { type: "error" });
      return;
    }
    const isNewLocalImage =
      dealImageUri.startsWith("file:") || dealImageUri.startsWith("content:");

    const payload: DealFormFields = {
      dealType: mode === "parts" ? "Parts" : "Service",
      description: description.trim(),
      discountedPrice: discountedPrice.trim(),
      offersEndOnDate: formatDealOfferEndDate(offerEndDate),
      dealImageUri: isNewLocalImage ? dealImageUri : editingId && hasExistingDealImage ? null : dealImageUri,
      dealImageMimeType: isNewLocalImage ? dealImageMimeType : null,
      dealImageFileName: isNewLocalImage ? dealImageFileName : null,
    };

    if (mode === "parts") {
      payload.partName = partName.trim();
      payload.vehicleId = selectedVehicleCompanyId.trim();
      payload.vehicleName = vehicleName.trim();
      payload.vehicleModel = selectedVehicleModel.trim();
      payload.vehicleYear = selectedVehicleYear.trim();
    } else {
      payload.serviceId = selectedServiceId;
      const selected = serviceOptions.find((s) => s.value === selectedServiceId);
      payload.productName = selected?.label.split(" — ").pop()?.trim() || selected?.label || "Service Deal";
      payload.price = discountedPrice.trim() || "0";
      payload.dealEnabled = "true";
    }

    setSaving(true);
    const ok = editingId ? await saveDeal(editingId, payload) : await createDeal(payload);
    setSaving(false);
    if (ok) {
      setSheetOpen(false);
      resetForm();
    }
  }

  function Dropdown({
    label,
    icon,
    value,
    placeholder,
    open,
    onToggle,
    options,
    onPick,
    green = false,
  }: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    value: string;
    placeholder: string;
    open: boolean;
    onToggle: () => void;
    options: Option[];
    onPick: (v: string) => void;
    green?: boolean;
  }) {
    return (
      <View style={styles.dropdownWrap}>
        <Pressable style={[styles.field, green && styles.fieldGreen]} onPress={onToggle}>
          <View style={[styles.fieldIcon, green ? styles.fieldIconGreen : styles.fieldIconBlue]}>
            <Ionicons name={icon} size={16} color={green ? "#2E7D32" : colors.white} />
          </View>
          <Text style={[styles.fieldText, !value && styles.fieldPlaceholder]} numberOfLines={1}>
            {value || placeholder}
          </Text>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={20} color={colors.text} />
        </Pressable>
        {open ? (
          <View style={styles.dropdownList}>
            {options.map((o) => (
              <Pressable
                key={o.value}
                style={styles.dropdownItem}
                onPress={() => {
                  onPick(o.value);
                  onToggle();
                }}
              >
                <Text style={styles.dropdownText}>{o.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <>
      <StackScreenFrame
        title="Deals"
        backgroundColor={colors.bgDeals}
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
        right={
          <Pill variant="white" style={shadows.soft}>
            <Ionicons name="pricetags-outline" size={16} color={colors.primary} />
            <Text style={styles.alertNum}>{loading ? "…" : visibleDeals.length}</Text>
          </Pill>
        }
        floatingContent={
          <Fab
            label="Add Deal"
            onPress={() => {
              if (!isAutoShopOwner) {
                showToast("Sign in as a shop owner to add deals.", { type: "error" });
                return;
              }
              if (mode === "services" && !hasServices) {
                promptSetupFromProfile("services");
                return;
              }
              if (mode === "parts" && !vehicleApiLoading && !hasVehicles) {
                promptSetupFromProfile("vehicles");
                return;
              }
              openCreate?.();
            }}
          />
        }
      >
        <View style={styles.categoryWrap}>
          <ChevronLabelBar
            label={barLabel}
            variant="services"
            style={styles.categoryChevronBar}
            onPrevious={() => cycleMode(-1)}
            onNext={() => cycleMode(1)}
          />
        </View>

        {loading && visibleDeals.length === 0 ? <DealsSkeletonList /> : null}

        <View style={styles.listContent}>
          {visibleDeals.map((deal, index) => {
            const id = dealId(deal);
            return (
              <ShopOwnerDealCard
                key={id || `deal-${index}`}
                deal={deal}
                expanded={expandedDealId === id}
                onToggleExpanded={() => id && toggleDealExpanded(id)}
                deleting={id ? deletingIds.has(id) : false}
                onEdit={() => openEdit?.(deal)}
                onDelete={() => confirmDelete(deal)}
              />
            );
          })}
          {!loading && visibleDeals.length === 0 ? (
            <SurfaceCard shadow="card" style={styles.emptyCard}>
              <Ionicons name="clipboard-outline" size={62} color="#9DB7E8" />
              <Text style={styles.emptyTitle}>No deals for this category</Text>
              <Text style={styles.emptyDesc}>Tap + to add your first deal</Text>
            </SurfaceCard>
          ) : null}
        </View>
      </StackScreenFrame>

      <Modal transparent visible={sheetOpen} animationType="slide" onRequestClose={requestCloseSheet}>
        <ModalKeyboardRoot onBackdropPress={requestCloseSheet} scrimColor="rgba(0,0,0,0.45)">
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTitleRow}>
              <View style={styles.sheetTitleGroup}>
                <Ionicons name="clipboard-outline" size={20} color={colors.primary} />
                <Text style={styles.sheetTitle}>{editingId ? "Edit Deal" : "Add New Deal"}</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={requestCloseSheet}>
                <Ionicons name="close" size={18} color="#D84D4D" />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              automaticallyAdjustKeyboardInsets
              showsVerticalScrollIndicator={false}
              style={styles.dealSheetScroll}
              contentContainerStyle={styles.dealSheetScrollContent}
            >
              <LinearGradient colors={["#CFE0FF", "#DCE7FF"]} style={styles.brandStrip}>
                <Text style={styles.brandText}>auto daddy</Text>
              </LinearGradient>

              <View style={styles.modeTabs}>
                <Pressable style={[styles.modeTab, mode === "services" && styles.modeTabActive]} onPress={() => setMode("services")}>
                  <Text style={[styles.modeTabText, mode === "services" && styles.modeTabTextActive]}>Services</Text>
                </Pressable>
                <Pressable style={[styles.modeTab, mode === "parts" && styles.modeTabActive]} onPress={() => setMode("parts")}>
                  <Text style={[styles.modeTabText, mode === "parts" && styles.modeTabTextActive]}>Parts</Text>
                </Pressable>
              </View>

              {mode === "services" ? (
                !hasServices ? (
                  <SetupEmptyPrompt
                    icon="build-outline"
                    title="No services selected"
                    description="Select the services your shop offers from Profile before creating a service deal."
                    ctaLabel="Select services from Profile"
                    onCta={() => {
                      setSheetOpen(false);
                      openServicesSelection?.();
                    }}
                  />
                ) : (
                  <Dropdown
                    label="Select Service"
                    icon="layers-outline"
                    value={serviceOptions.find((x) => x.value === serviceId)?.label || ""}
                    placeholder="Select Service"
                    open={serviceDropdownOpen}
                    onToggle={() => setServiceDropdownOpen((p) => !p)}
                    options={serviceOptions}
                    onPick={setServiceId}
                  />
                )
              ) : vehicleApiLoading ? (
                <View style={styles.setupLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.setupEmptyDesc}>Loading vehicles…</Text>
                </View>
              ) : !hasVehicles ? (
                <SetupEmptyPrompt
                  icon="car-outline"
                  title="No vehicles selected"
                  description="Select the car companies your shop serves from Profile before creating a parts deal."
                  ctaLabel="Select vehicles from Profile"
                  onCta={() => {
                    setSheetOpen(false);
                    openCarCompanies?.();
                  }}
                />
              ) : (
                <>
                  <Dropdown
                    label="Select Vehicle"
                    icon="layers-outline"
                    value={vehicleName}
                    placeholder="Select Vehicle"
                    open={vehicleDropdownOpen}
                    onToggle={() => setVehicleDropdownOpen((p) => !p)}
                    options={vehicleOptions}
                    onPick={(v) => {
                      const picked = vehicleOptions.find((x) => x.value === v);
                      setSelectedVehicleCompanyId(v);
                      setVehicleName(picked?.label || "");
                      setSelectedVehicleModel("");
                      setSelectedVehicleYear("");
                      setModelYear("");
                    }}
                  />
                  <Dropdown
                    label="Select Model + Year"
                    icon="checkmark-circle-outline"
                    value={modelYear}
                    placeholder="Select Model + Year"
                    open={modelDropdownOpen}
                    onToggle={() => setModelDropdownOpen((p) => !p)}
                    options={modelOptions}
                    onPick={(v) => {
                      const picked = modelOptions.find((x) => x.value === v);
                      setModelYear(picked?.label || "");
                      const [m, y] = String(v).split("::");
                      setSelectedVehicleModel(m || "");
                      setSelectedVehicleYear(y || "");
                    }}
                    green
                  />
                  <View style={styles.field}>
                    <View style={[styles.fieldIcon, styles.fieldIconBlue]}>
                      <Ionicons name="layers-outline" size={16} color={colors.white} />
                    </View>
                    <TextInput
                      value={partName}
                      onChangeText={setPartName}
                      style={styles.textInput}
                      placeholder="Enter part name (e.g., Brake Pads)"
                      placeholderTextColor={colors.textLight}
                    />
                  </View>
                </>
              )}

              <View style={styles.field}>
                <View style={[styles.fieldIcon, styles.fieldIconOrange]}>
                  <Ionicons name="time-outline" size={16} color={colors.white} />
                </View>
                <TextInput
                  value={discountedPrice}
                  onChangeText={setDiscountedPrice}
                  style={styles.textInput}
                  placeholder="Discounted Price"
                  placeholderTextColor={colors.textLight}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.field}>
                <View style={[styles.fieldIcon, styles.fieldIconOrange]}>
                  <Ionicons name="time-outline" size={16} color={colors.white} />
                </View>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  style={styles.textInput}
                  placeholder="Description"
                  placeholderTextColor={colors.textLight}
                />
              </View>

              <Pressable style={styles.field} onPress={() => setShowOfferDatePicker(true)}>
                <View style={[styles.fieldIcon, styles.fieldIconBlue]}>
                  <Ionicons name="calendar-outline" size={16} color={colors.white} />
                </View>
                <Text style={styles.fieldText}>{formatEnds(offerEndDate.toISOString())}</Text>
                <Ionicons name="chevron-down" size={20} color={colors.text} />
              </Pressable>
              {showOfferDatePicker ? (
                <DateTimePicker
                  value={offerEndDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, selected) => {
                    setShowOfferDatePicker(Platform.OS === "ios");
                    if (selected) {
                      setOfferEndDate(selected);
                    }
                  }}
                />
              ) : null}

              <Pressable style={styles.field} onPress={() => void pickDealImage()}>
                <View style={[styles.fieldIcon, styles.fieldIconBlue]}>
                  <Ionicons name="image-outline" size={16} color={colors.white} />
                </View>
                <Text style={[styles.fieldText, !dealImageUri && styles.fieldPlaceholder]}>
                  {dealImageUri ? "Change deal image" : "Add deal image *"}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </Pressable>
              {dealImageUri ? (
                <View style={styles.dealImagePreviewWrap}>
                  <Image
                    source={{ uri: dealImageUri }}
                    style={[styles.dealImagePreview, { aspectRatio: dealCardImageAspectRatio() }]}
                    contentFit="cover"
                  />
                </View>
              ) : null}
            </ScrollView>

            <Pressable
              style={[
                styles.saveBtn,
                (saving ||
                  (!editingId && mode === "services" && !hasServices) ||
                  (!editingId && mode === "parts" && !hasVehicles)) &&
                styles.saveBtnDisabled,
              ]}
              onPress={() => void onSave()}
              disabled={
                saving ||
                (!editingId && mode === "services" && !hasServices) ||
                (!editingId && mode === "parts" && !hasVehicles)
              }
            >
              {saving ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.saveBtnText}>SAVE DEAL</Text>}
            </Pressable>
          </View>
        </ModalKeyboardRoot>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: spacing.sm },
  loading: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.sm },
  loadingText: { color: colors.textMuted, fontSize: fontSizes.md },
  skeletonList: { paddingHorizontal: spacing.screenHorizontal, gap: spacing.lg, paddingTop: spacing.xs },
  skeletonCard: { padding: spacing.lg, borderRadius: spacing.lg, minHeight: 140 },
  skeletonTop: { gap: 10, marginBottom: spacing.lg },
  skeletonBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  skeletonLine: { height: 12, borderRadius: 8, backgroundColor: "#EDF2F7" },
  alertNum: { fontSize: cardFontSizes.md, fontWeight: "800", color: colors.text },
  categoryWrap: {
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md + 2,
  },
  categoryChevronBar: { marginHorizontal: 0 },
  listContent: {
    paddingHorizontal: spacing.screenHorizontal,
    gap: spacing.lg,
    paddingTop: spacing.xs,
  },
  emptyCard: { padding: spacing.xl, alignItems: "center", gap: spacing.sm },
  emptyTitle: { ...cardTypography.cardTitle, fontSize: cardFontSizes.hero },
  emptyDesc: { fontSize: cardFontSizes.md, color: colors.textMuted, textAlign: "center" },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    maxHeight: "92%",
    width: "100%",
  },
  dealSheetScroll: {
    flexGrow: 1,
    flexShrink: 1,
    maxHeight: 400,
    width: "100%",
  },
  dealSheetScrollContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 3,
    borderRadius: radii.round,
    backgroundColor: "#E4E7EF",
    marginBottom: spacing.xs,
  },
  sheetTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitleGroup: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sheetTitle: { fontSize: fontSizes.lg, fontWeight: "800", color: colors.text },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F0",
  },
  brandStrip: {
    height: 56,
    borderRadius: radii.lg,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  brandText: { fontSize: fontSizes.lg, fontWeight: "800", color: colors.primaryDark },
  modeTabs: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xs },
  modeTab: {
    flex: 1,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: "#EDF0F7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D7DBE7",
  },
  modeTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeTabText: { fontSize: fontSizes.sm, fontWeight: "700", color: colors.textMuted },
  modeTabTextActive: { color: colors.white },
  dropdownWrap: { zIndex: 4 },
  field: {
    minHeight: 44,
    borderRadius: radii.md,
    backgroundColor: "#F1F4FA",
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  fieldGreen: { backgroundColor: "#EAF6ED" },
  fieldIcon: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldIconBlue: { backgroundColor: "#3E8BFF" },
  fieldIconGreen: { backgroundColor: "#CFF0D5" },
  fieldIconOrange: { backgroundColor: "#F39C12" },
  fieldText: { flex: 1, fontSize: fontSizes.md, color: colors.text, fontWeight: "600" },
  dealImagePreviewWrap: {
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
  },
  dealImagePreview: {
    width: "100%",
  },
  fieldPlaceholder: { color: colors.textLight, fontWeight: "700" },
  textInput: { flex: 1, fontSize: fontSizes.md, color: colors.text, fontWeight: "600" },
  dropdownList: {
    marginTop: 4,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  dropdownItem: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  dropdownText: { fontSize: fontSizes.md, color: colors.text },
  saveBtn: {
    marginTop: spacing.xs,
    minHeight: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: { opacity: 0.75 },
  saveBtnText: { color: colors.white, fontSize: fontSizes.lg, fontWeight: "800" },
  setupEmpty: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  setupEmptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.textMuted,
    textAlign: "center",
  },
  setupEmptyDesc: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textLight,
    textAlign: "center",
    lineHeight: 20,
  },
  setupEmptyCta: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.round,
    backgroundColor: colors.primary,
  },
  setupEmptyCtaText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: "800",
  },
  setupLoading: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
});

