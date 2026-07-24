import { ModalKeyboardRoot, useToast } from "@/components/reusables";
import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useMyShopServices } from "@/hooks/use-my-shop-services";
import { fetchVehicleTypesAndServices } from "@/lib/auto-shop-owner-api";
import {
  apiMessageFromEnvelope,
  createAutoshopDeal,
  formatAutoshopDealOfferEndDate,
  updateAutoshopDeal,
} from "@/lib/autoshopowner-deals-api";
import { dealCardImageAspectRatio, pickDealImageFromLibrary } from "@/lib/deal-card-image";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import {
  buildShopDealSaveFields,
  dealModeOf,
  parseVehicleCatalog,
  shopDealRecordId,
  type DealBoardSectionId,
  type DealFormMode,
  type VehicleCatalogEntry,
} from "@/lib/shop-deal-form";
import { buildShopServiceDealOptions } from "@/lib/shop-service-deal-options";
import type { UploadPart } from "@/lib/upload-part";
import type { ShopDeal } from "@/types/shop-owner";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Option = { label: string; value: string };

function defaultOfferEndDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d;
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

function Dropdown({
  value,
  placeholder,
  open,
  onToggle,
  options,
  onPick,
  green = false,
  icon = "layers-outline",
}: {
  value: string;
  placeholder: string;
  open: boolean;
  onToggle: () => void;
  options: Option[];
  onPick: (v: string) => void;
  green?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
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
          <ScrollView style={styles.dropdownScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
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
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Add/Edit deal form — same API payload & validation as web ShopDealFormDialog.
 */
export function ShopDealEditorForm({
  mode,
  section = "parts",
  deal = null,
  onCancel,
  onSaved,
  onNeedServices,
  onNeedVehicles,
  embedded = false,
}: {
  mode: DealFormMode;
  section?: DealBoardSectionId;
  deal?: ShopDeal | null;
  onCancel: () => void;
  onSaved: () => void;
  onNeedServices?: () => void;
  onNeedVehicles?: () => void;
  /** When true, omit outer sheet chrome (used inside a parent Modal). */
  embedded?: boolean;
}) {
  const { token, meta } = useAuth();
  const { showToast } = useToast();
  const isOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";
  const { categories, load: loadServices } = useMyShopServices(token, isOwner, showToast);

  const [serviceOptionValue, setServiceOptionValue] = useState("");
  const [partName, setPartName] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [description, setDescription] = useState("");
  const [offerEndDate, setOfferEndDate] = useState(defaultOfferEndDate);
  const [showOfferDatePicker, setShowOfferDatePicker] = useState(false);
  const [attachDealImage, setAttachDealImage] = useState(false);
  const [dealImage, setDealImage] = useState<UploadPart | null>(null);
  const [existingImageUri, setExistingImageUri] = useState<string | null>(null);
  const [vehicleCatalog, setVehicleCatalog] = useState<VehicleCatalogEntry[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  const serviceOptions = useMemo(() => buildShopServiceDealOptions(categories), [categories]);
  const selectedVehicle = vehicleCatalog.find((v) => v.id === vehicleId);
  const selectedServiceOption = serviceOptions.find((o) => o.value === serviceOptionValue);
  const imageRequired = section === "salvage";

  const vehicleOptions = useMemo<Option[]>(
    () => vehicleCatalog.map((v) => ({ label: v.name, value: v.id })),
    [vehicleCatalog]
  );

  const modelOptions = useMemo<Option[]>(() => {
    const models = selectedVehicle?.models ?? [];
    return models.map((m) => ({ label: m.name, value: m.name }));
  }, [selectedVehicle?.models]);

  const yearOptions = useMemo<Option[]>(() => {
    const model = (selectedVehicle?.models ?? []).find((m) => m.name === vehicleModel);
    const years = model?.years ?? [];
    if (years.length === 0) return [];
    return years.map((y) => ({ label: y, value: y }));
  }, [selectedVehicle?.models, vehicleModel]);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  useEffect(() => {
    if (!token || mode !== "parts") return;
    setVehicleLoading(true);
    void fetchVehicleTypesAndServices(token)
      .then((res) => {
        if (!res.ok) {
          setVehicleCatalog([]);
          return;
        }
        setVehicleCatalog(parseVehicleCatalog(res.data));
      })
      .catch(() => setVehicleCatalog([]))
      .finally(() => setVehicleLoading(false));
  }, [mode, token]);

  useEffect(() => {
    setServiceOptionValue("");
    setPartName(deal?.partName ?? "");
    setDescription(deal?.description ?? "");
    setOfferEndDate(
      deal?.offersEndOnDate ? new Date(deal.offersEndOnDate) : defaultOfferEndDate()
    );
    setDealImage(null);
    const existing = deal?.dealImage?.trim() || deal?.productImage?.trim() || null;
    const normalized = normalizeMediaUrl(existing);
    setExistingImageUri(normalized);
    setAttachDealImage(mode === "parts" && Boolean(normalized));

    if (mode === "service" && deal) {
      if (deal.discountPercentage != null) {
        setDiscountedPrice(String(deal.discountPercentage));
      } else {
        const discounted = Number(deal.discountedPrice);
        const original = Number(deal.price);
        if (
          Number.isFinite(original) &&
          original > 0 &&
          Number.isFinite(discounted) &&
          discounted >= 0 &&
          discounted < original
        ) {
          const pct = Math.round((1 - discounted / original) * 100);
          setDiscountedPrice(String(pct > 0 ? pct : 1));
        } else {
          setDiscountedPrice(deal.discountedPrice != null ? String(deal.discountedPrice) : "");
        }
      }
    } else {
      setDiscountedPrice(deal?.discountedPrice != null ? String(deal.discountedPrice) : "");
    }

    if (mode === "parts" && deal) {
      setVehicleId(deal.vehicleId ?? deal.selectedVehicle?.id ?? "");
      setVehicleModel(deal.selectedVehicle?.model ?? "");
      setVehicleYear(deal.selectedVehicle?.year ?? "");
    } else if (!deal) {
      setVehicleId("");
      setVehicleModel("");
      setVehicleYear("");
    }
  }, [deal, mode]);

  useEffect(() => {
    if (mode !== "service" || serviceOptions.length === 0) return;
    const dealServiceId = deal?.serviceId ?? deal?.service?.id ?? "";
    const dealSubName =
      deal?.subServiceName?.trim() ||
      deal?.productName?.trim() ||
      deal?.description?.trim() ||
      "";
    setServiceOptionValue((current) => {
      if (current && serviceOptions.some((o) => o.value === current)) return current;
      const bySubName = dealSubName
        ? serviceOptions.find((o) => o.subName.toLowerCase() === dealSubName.toLowerCase())
        : undefined;
      if (bySubName) return bySubName.value;
      const bySubId = dealServiceId
        ? serviceOptions.find((o) => o.value === dealServiceId)
        : undefined;
      if (bySubId) return bySubId.value;
      if (dealServiceId && !dealSubName) {
        const underCategory = serviceOptions.find(
          (o) => o.serviceId === dealServiceId || o.value.startsWith(`${dealServiceId}::`)
        );
        if (underCategory) return underCategory.value;
      }
      return current;
    });
  }, [deal, mode, serviceOptions]);

  async function pickDealImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast("Photo library permission is required.", { type: "error" });
      return;
    }
    const picked = await pickDealImageFromLibrary();
    if (!picked) return;
    setDealImage({
      uri: picked.uri,
      name: picked.fileName ?? "deal.jpg",
      type: picked.mimeType ?? "image/jpeg",
    });
    setAttachDealImage(true);
    setExistingImageUri(picked.uri);
  }

  async function handleSave() {
    if (!token || !isOwner) {
      showToast("Sign in as auto shop owner.", { type: "error" });
      return;
    }
    if (mode === "service" && categories.length === 0 && !deal) {
      onNeedServices?.();
      return;
    }
    if (mode === "parts" && vehicleCatalog.length === 0 && !deal) {
      onNeedVehicles?.();
      return;
    }

    const built = buildShopDealSaveFields({
      mode,
      section,
      deal,
      discountedPrice,
      description,
      offersEndOnDate: offerEndDate,
      serviceOption: selectedServiceOption
        ? { serviceId: selectedServiceOption.serviceId, subName: selectedServiceOption.subName }
        : null,
      partName,
      vehicleId,
      vehicleName: selectedVehicle?.name,
      vehicleModel,
      vehicleYear,
      originalPrice: discountedPrice,
      dealImage,
      attachDealImage: attachDealImage && Boolean(dealImage?.uri || existingImageUri),
    });

    if (!built.ok) {
      showToast(built.error, { type: "error" });
      return;
    }

    // Only upload a newly picked local image (matches web: File | null).
    const fields = {
      ...built.fields,
      offersEndOnDate: formatAutoshopDealOfferEndDate(built.fields.offersEndOnDate ?? offerEndDate),
      dealImage:
        mode === "parts" && attachDealImage && dealImage?.uri ? dealImage : null,
    };

    setSaving(true);
    try {
      const id = deal ? shopDealRecordId(deal) : "";
      const res = id
        ? await updateAutoshopDeal(token, id, fields)
        : await createAutoshopDeal(token, fields);
      if (!res.ok) {
        showToast(apiMessageFromEnvelope(res.data) || "Could not save deal.", { type: "error" });
        return;
      }
      showToast(apiMessageFromEnvelope(res.data) || "Deal saved.", { type: "success" });
      onSaved();
      onCancel();
    } catch {
      showToast("Network error.", { type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const hasServices = categories.length > 0;
  const hasVehicles = vehicleCatalog.length > 0;
  const title = `${deal ? "Edit" : "Add"} ${mode === "parts" ? "Parts" : "Service"} Deal`;
  const previewUri = dealImage?.uri || existingImageUri;

  const body = (
    <>
      {!embedded ? (
        <View style={styles.sheetTitleRow}>
          <View style={styles.sheetTitleGroup}>
            <Ionicons name="clipboard-outline" size={20} color={colors.primary} />
            <Text style={styles.sheetTitle}>{title}</Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onCancel}>
            <Ionicons name="close" size={18} color="#D84D4D" />
          </Pressable>
        </View>
      ) : (
        <Text style={styles.embeddedTitle}>{title}</Text>
      )}

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {mode === "service" ? (
          !hasServices ? (
            <SetupEmptyPrompt
              icon="build-outline"
              title="No services selected"
              description="Select the services your shop offers from Profile before creating a service deal."
              ctaLabel="Select services from Profile"
              onCta={() => onNeedServices?.()}
            />
          ) : (
            <Dropdown
              value={selectedServiceOption?.label || ""}
              placeholder="Select Subservice"
              open={serviceDropdownOpen}
              onToggle={() => {
                setServiceDropdownOpen((p) => !p);
                setVehicleDropdownOpen(false);
                setModelDropdownOpen(false);
                setYearDropdownOpen(false);
              }}
              options={serviceOptions.map((o) => ({ label: o.label, value: o.value }))}
              onPick={setServiceOptionValue}
            />
          )
        ) : vehicleLoading ? (
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
            onCta={() => onNeedVehicles?.()}
          />
        ) : (
          <>
            <View style={styles.field}>
              <View style={[styles.fieldIcon, styles.fieldIconBlue]}>
                <Ionicons name="layers-outline" size={16} color={colors.white} />
              </View>
              <TextInput
                value={partName}
                onChangeText={setPartName}
                style={styles.textInput}
                placeholder="Part name"
                placeholderTextColor={colors.textLight}
                editable={!saving}
              />
            </View>
            <Dropdown
              value={selectedVehicle?.name || ""}
              placeholder="Vehicle company"
              open={vehicleDropdownOpen}
              onToggle={() => {
                setVehicleDropdownOpen((p) => !p);
                setServiceDropdownOpen(false);
                setModelDropdownOpen(false);
                setYearDropdownOpen(false);
              }}
              options={vehicleOptions}
              onPick={(v) => {
                setVehicleId(v);
                setVehicleModel("");
                setVehicleYear("");
              }}
            />
            <Dropdown
              value={vehicleModel}
              placeholder="Model"
              open={modelDropdownOpen}
              onToggle={() => {
                setModelDropdownOpen((p) => !p);
                setServiceDropdownOpen(false);
                setVehicleDropdownOpen(false);
                setYearDropdownOpen(false);
              }}
              options={modelOptions}
              onPick={(nextModel) => {
                setVehicleModel(nextModel);
                const match = (selectedVehicle?.models ?? []).find((m) => m.name === nextModel);
                if (match?.years?.[0]) setVehicleYear(match.years[0]);
                else setVehicleYear("");
              }}
              green
            />
            <Dropdown
              value={vehicleYear}
              placeholder="Year"
              open={yearDropdownOpen}
              onToggle={() => {
                setYearDropdownOpen((p) => !p);
                setServiceDropdownOpen(false);
                setVehicleDropdownOpen(false);
                setModelDropdownOpen(false);
              }}
              options={yearOptions}
              onPick={setVehicleYear}
              green
              icon="calendar-outline"
            />
          </>
        )}

        <View style={styles.field}>
          <View style={[styles.fieldIcon, styles.fieldIconOrange]}>
            <Ionicons name="pricetag-outline" size={16} color={colors.white} />
          </View>
          <TextInput
            value={discountedPrice}
            onChangeText={(t) => {
              if (mode === "service") {
                let v = t.replace(/[^0-9.]/g, "");
                if (v) {
                  const n = parseFloat(v);
                  if (Number.isNaN(n)) v = "";
                  else if (n > 100) v = "100";
                  else if (n < 0) v = "0";
                  else v = String(n);
                }
                setDiscountedPrice(v);
                return;
              }
              setDiscountedPrice(t);
            }}
            style={styles.textInput}
            placeholder={mode === "service" ? "Discount (%)" : "Discounted price"}
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
            editable={!saving}
          />
        </View>

        {mode === "parts" ? (
          <View style={styles.field}>
            <View style={[styles.fieldIcon, styles.fieldIconOrange]}>
              <Ionicons name="document-text-outline" size={16} color={colors.white} />
            </View>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={styles.textInput}
              placeholder="Description"
              placeholderTextColor={colors.textLight}
              editable={!saving}
            />
          </View>
        ) : null}

        <Pressable style={styles.field} onPress={() => setShowOfferDatePicker(true)} disabled={saving}>
          <View style={[styles.fieldIcon, styles.fieldIconBlue]}>
            <Ionicons name="calendar-outline" size={16} color={colors.white} />
          </View>
          <Text style={styles.fieldText}>
            {offerEndDate.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.text} />
        </Pressable>
        {showOfferDatePicker ? (
          <DateTimePicker
            value={offerEndDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={(() => {
              const d = new Date();
              d.setHours(0, 0, 0, 0);
              d.setDate(d.getDate() + 1);
              return d;
            })()}
            onChange={(_, selected) => {
              setShowOfferDatePicker(Platform.OS === "ios");
              if (selected) setOfferEndDate(selected);
            }}
          />
        ) : null}

        {mode === "parts" ? (
          <>
            <Pressable
              style={styles.field}
              onPress={() => {
                if (attachDealImage) {
                  void pickDealImage();
                } else {
                  setAttachDealImage(true);
                  void pickDealImage();
                }
              }}
              disabled={saving}
            >
              <View style={[styles.fieldIcon, styles.fieldIconBlue]}>
                <Ionicons name="image-outline" size={16} color={colors.white} />
              </View>
              <Text style={[styles.fieldText, !previewUri && styles.fieldPlaceholder]}>
                {previewUri
                  ? "Change deal image"
                  : imageRequired
                    ? "Attach image *"
                    : "Attach image"}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </Pressable>
            {previewUri ? (
              <View style={styles.dealImagePreviewWrap}>
                <Image
                  source={{ uri: previewUri }}
                  style={[styles.dealImagePreview, { aspectRatio: dealCardImageAspectRatio() }]}
                  contentFit="cover"
                />
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <Pressable
        style={[
          styles.saveBtn,
          (saving ||
            (!deal && mode === "service" && !hasServices) ||
            (!deal && mode === "parts" && !hasVehicles)) &&
            styles.saveBtnDisabled,
        ]}
        onPress={() => void handleSave()}
        disabled={
          saving ||
          (!deal && mode === "service" && !hasServices) ||
          (!deal && mode === "parts" && !hasVehicles)
        }
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Text style={styles.saveBtnText}>{deal ? "UPDATE DEAL" : "SAVE DEAL"}</Text>
        )}
      </Pressable>
    </>
  );

  if (embedded) {
    return <View style={styles.embedded}>{body}</View>;
  }

  return (
    <ModalKeyboardRoot onBackdropPress={onCancel} scrimColor="rgba(0,0,0,0.45)">
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        {body}
      </View>
    </ModalKeyboardRoot>
  );
}

export function formModeForSection(section: DealBoardSectionId | "completed"): DealFormMode {
  return section === "service" ? "service" : "parts";
}

export function formSectionForActive(
  activeId: DealBoardSectionId | "completed",
  deal?: ShopDeal | null
): DealBoardSectionId {
  if (activeId === "completed") {
    if (!deal) return "parts";
    const t = (deal.dealType ?? "").toLowerCase();
    if (t.includes("salvage")) return "salvage";
    return dealModeOf(deal) === "parts" ? "parts" : "service";
  }
  return activeId;
}

const styles = StyleSheet.create({
  embedded: { width: "100%", gap: spacing.sm },
  embeddedTitle: { fontSize: fontSizes.lg, fontWeight: "800", color: colors.text, marginBottom: spacing.xs },
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
  scroll: { flexGrow: 1, flexShrink: 1, maxHeight: 420, width: "100%" },
  scrollContent: { gap: spacing.sm, paddingBottom: spacing.sm },
  dropdownWrap: { zIndex: 4 },
  dropdownScroll: { maxHeight: 180 },
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
  dealImagePreviewWrap: {
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
  },
  dealImagePreview: { width: "100%" },
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
