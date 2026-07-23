import { LoadingProgress, StackScreenFrame, useToast } from "@/components/reusables";
import { ModalKeyboardRoot } from "@/components/reusables/layout/modal-keyboard-root";
import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useMyShopServices } from "@/hooks/use-my-shop-services";
import { dealId, useMyDeals } from "@/hooks/use-my-deals";
import { dealCardImageAspectRatio, pickDealImageFromLibrary } from "@/lib/deal-card-image";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import { buildShopServiceDealOptions } from "@/lib/shop-service-deal-options";
import { formatAutoshopDealOfferEndDate as formatDealOfferEndDate } from "@/lib/autoshopowner-deals-api";
import type { DealFormFields } from "@/hooks/use-my-deals";
import { fetchVehicleTypesAndServices } from "@/lib/auto-shop-owner-api";
import { clampText } from "@/lib/validation";
import type { ShopDeal } from "@/types/auto-shop-owner-endpoints";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function DealEditorPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dealId?: string }>();
  const editId = typeof params.dealId === "string" ? params.dealId : undefined;
  const { token, meta } = useAuth();
  const { showToast } = useToast();
  const isOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";
  const { categories: myShopServices, load: loadMyShopServices } = useMyShopServices(token, isOwner, (m, o) =>
    showToast(m, o)
  );
  const { deals, loading: dealsLoading, loadDeals, createDeal, saveDeal } = useMyDeals(token, isOwner, (m, o) =>
    showToast(m, o)
  );

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [dealEnabled, setDealEnabled] = useState("true");
  const [offersEnd, setOffersEnd] = useState(new Date(Date.now() + 7 * 864e5));
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [dealImageMimeType, setDealImageMimeType] = useState<string | null>(null);
  const [dealImageFileName, setDealImageFileName] = useState<string | null>(null);
  const [hasExistingDealImage, setHasExistingDealImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    void loadMyShopServices();
  }, [loadMyShopServices]);

  useEffect(() => {
    void loadDeals();
  }, [loadDeals]);

  const resetDealForm = useCallback(() => {
    setProductName("");
    setDescription("");
    setPrice("");
    setDiscountedPrice("");
    setDealEnabled("true");
    setOffersEnd(new Date(Date.now() + 7 * 864e5));
    setShowEndPicker(false);
    setServiceId("");
    setImageUri(null);
    setDealImageMimeType(null);
    setDealImageFileName(null);
    setHasExistingDealImage(false);
    setPrefilled(false);
  }, []);

  const applyDeal = useCallback((d: ShopDeal) => {
    setProductName(d.productName ?? "");
    setDescription(d.description ?? "");
    setPrice(d.price != null ? String(d.price) : "");
    setDiscountedPrice(d.discountedPrice != null ? String(d.discountedPrice) : "");
    setDealEnabled(d.dealEnabled === false ? "false" : "true");
    if (d.offersEndOnDate) {
      const parsed = new Date(d.offersEndOnDate);
      if (!Number.isNaN(parsed.getTime())) {
        setOffersEnd(parsed);
      }
    }
    setServiceId(d.serviceId ?? "");
    const existingImage = d.dealImage?.trim() || d.productImage?.trim() || null;
    const normalized = normalizeMediaUrl(existingImage);
    setHasExistingDealImage(Boolean(normalized));
    setImageUri(normalized);
    setDealImageMimeType(null);
    setDealImageFileName(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!editId) {
        resetDealForm();
      }
      return undefined;
    }, [editId, resetDealForm])
  );

  useEffect(() => {
    if (!editId) {
      return;
    }
    setPrefilled(false);
  }, [editId]);

  useEffect(() => {
    if (!editId || prefilled || deals.length === 0) {
      return;
    }
    const found = deals.find((x) => dealId(x) === editId);
    if (found) {
      applyDeal(found);
      setPrefilled(true);
    }
  }, [applyDeal, deals, editId, prefilled]);

  const serviceOptions = useMemo(() => buildShopServiceDealOptions(myShopServices), [myShopServices]);

  const hasServices = myShopServices.length > 0;
  const dealsBackTo = "/(shop-owner)/deals";
  const showEditHydrating = Boolean(editId && !prefilled && dealsLoading);

  function promptSelectServicesFromProfile() {
    Alert.alert(
      "No services selected",
      "Select the services your shop offers from Profile before creating a deal.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Select services",
          onPress: () =>
            router.push({
              pathname: "/(shop-owner)/services-selection",
              params: { backTo: dealsBackTo },
            }),
        },
      ]
    );
  }

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast("Photo library permission is required.", { type: "error" });
      return;
    }
    const picked = await pickDealImageFromLibrary();
    if (!picked) {
      return;
    }
    setImageUri(picked.uri);
    setDealImageMimeType(picked.mimeType);
    setDealImageFileName(picked.fileName);
  }

  async function onSubmit() {
    if (!isOwner || !token) {
      showToast("Sign in as a shop owner to save deals.", { type: "error" });
      return;
    }
    const nextProductName = productName.trim().slice(0, 20);
    const nextDesc = description.trim().slice(0, 50);
    if (!hasServices && !editId) {
      promptSelectServicesFromProfile();
      return;
    }
    if (!nextProductName || !serviceId.trim()) {
      showToast("Product name and service are required.", { type: "error" });
      return;
    }
    const hasImage = Boolean(imageUri?.trim());
    if (!hasImage) {
      showToast("Product image is required.", { type: "error" });
      return;
    }
    const isNewLocalImage = imageUri!.startsWith("file:") || imageUri!.startsWith("content:");
    setSubmitting(true);
    try {
      const fields: DealFormFields = {
        dealType: "Service",
        productName: nextProductName,
        description: nextDesc,
        price: price.trim() || "0",
        discountedPrice: discountedPrice.trim() || "0",
        dealEnabled,
        offersEndOnDate: formatDealOfferEndDate(offersEnd),
        serviceId: serviceId.trim(),
        dealImageUri: isNewLocalImage ? imageUri : editId && hasExistingDealImage ? null : imageUri,
        dealImageMimeType: isNewLocalImage ? dealImageMimeType : null,
        dealImageFileName: isNewLocalImage ? dealImageFileName : null,
      };
      const ok = editId ? await saveDeal(editId, fields) : await createDeal(fields);
      if (ok) {
        router.back();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StackScreenFrame title={editId ? "Edit deal" : "New deal"} backgroundColor={colors.bgDeals} scroll={false}>
      {showEditHydrating ? (
        <View style={styles.hydrating}>
          <LoadingProgress />
        </View>
      ) : (
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Service *</Text>
        {!hasServices ? (
          <View style={styles.setupEmpty}>
            <Ionicons name="build-outline" size={48} color={colors.textLight} />
            <Text style={styles.setupEmptyTitle}>No services selected</Text>
            <Text style={styles.setupEmptyDesc}>
              Select the services your shop offers from Profile before creating a deal.
            </Text>
            <Pressable style={styles.setupEmptyCta} onPress={promptSelectServicesFromProfile}>
              <Ionicons name="person-outline" size={18} color={colors.white} />
              <Text style={styles.setupEmptyCtaText}>Select services from Profile</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.pickerShell}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {serviceOptions.map((o) => {
                const active = serviceId === o.value;
                return (
                  <Pressable key={o.value} onPress={() => setServiceId(o.value)} style={[styles.chip, active && styles.chipActive]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                      {o.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <Text style={styles.label}>Product name *</Text>
        <TextInput
          value={productName}
          onChangeText={(t) => setProductName(clampText(t, 20))}
          placeholder="e.g. Synthetic oil package"
          placeholderTextColor={colors.textLight}
          style={styles.input}
          maxLength={20}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={(t) => setDescription(clampText(t, 50))}
          placeholder="Short description"
          placeholderTextColor={colors.textLight}
          style={[styles.input, styles.inputTall]}
          multiline
          maxLength={50}
        />

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Price</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textLight}
              style={styles.input}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Discounted</Text>
            <TextInput
              value={discountedPrice}
              onChangeText={setDiscountedPrice}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textLight}
              style={styles.input}
            />
          </View>
        </View>

        <Text style={styles.label}>Deal enabled</Text>
        <View style={styles.toggleRow}>
          {(["true", "false"] as const).map((v) => {
            const active = dealEnabled === v;
            return (
              <Pressable key={v} onPress={() => setDealEnabled(v)} style={[styles.toggleBtn, active && styles.toggleBtnOn]}>
                <Text style={[styles.toggleText, active && styles.toggleTextOn]}>{v === "true" ? "On" : "Off"}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Offer ends</Text>
        <Pressable style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={styles.dateText}>{offersEnd.toLocaleString()}</Text>
        </Pressable>
        {showEndPicker ? (
          Platform.OS === "ios" ? (
            <Modal transparent visible animationType="fade" onRequestClose={() => setShowEndPicker(false)}>
              <ModalKeyboardRoot onBackdropPress={() => setShowEndPicker(false)} scrimColor="rgba(0,0,0,0.35)">
                <View style={styles.iosDateSheet}>
                  <View style={styles.iosDateHeader}>
                    <Pressable onPress={() => setShowEndPicker(false)} hitSlop={8}>
                      <Text style={styles.iosDateBtn}>Cancel</Text>
                    </Pressable>
                    <Text style={styles.iosDateTitle}>Offer end</Text>
                    <Pressable onPress={() => setShowEndPicker(false)} hitSlop={8}>
                      <Text style={[styles.iosDateBtn, styles.iosDateBtnPrimary]}>Done</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={offersEnd}
                    mode="datetime"
                    display="spinner"
                    onChange={(_, d) => {
                      if (d) setOffersEnd(d);
                    }}
                  />
                </View>
              </ModalKeyboardRoot>
            </Modal>
          ) : (
            <DateTimePicker
              value={offersEnd}
              mode="datetime"
              display="default"
              onChange={(_, d) => {
                setShowEndPicker(false);
                if (d) setOffersEnd(d);
              }}
            />
          )
        ) : null}

        <Text style={styles.label}>Product image *</Text>
        <Pressable style={styles.imgBtn} onPress={() => void pickImage()}>
          <Ionicons name="image-outline" size={22} color={colors.primary} />
          <Text style={styles.imgBtnText}>{imageUri ? "Change image" : "Choose image"}</Text>
        </Pressable>
        {imageUri ? (
          <View style={styles.dealImagePreviewWrap}>
            <Image
              source={{ uri: imageUri }}
              style={[styles.dealImagePreview, { aspectRatio: dealCardImageAspectRatio() }]}
              contentFit="cover"
            />
          </View>
        ) : null}

        <Pressable
          style={[styles.saveBtn, (submitting || (!hasServices && !editId)) && styles.saveBtnDisabled]}
          disabled={submitting || (!hasServices && !editId)}
          onPress={() => void onSubmit()}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveText}>{editId ? "Save changes" : "Create deal"}</Text>
          )}
        </Pressable>
      </ScrollView>
      )}
    </StackScreenFrame>
  );
}

const styles = StyleSheet.create({
  hydrating: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
  },
  content: {
    padding: spacing.screenHorizontal,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.sm,
  },
  label: { fontSize: fontSizes.sm, fontWeight: "700", color: colors.textMuted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === "ios" ? spacing.sm : spacing.xs,
    minHeight: 42,
    fontSize: fontSizes.sm,
    color: colors.text,
    backgroundColor: colors.white,
  },
  inputTall: { minHeight: 72, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: spacing.md },
  col: { flex: 1 },
  pickerShell: { gap: spacing.sm },
  hint: { fontSize: fontSizes.sm, color: colors.textLight },
  chipScroll: { maxHeight: 40 },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.white,
    maxWidth: 280,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: "#EEF2FF" },
  chipText: { fontSize: fontSizes.sm, color: colors.text },
  chipTextActive: { fontWeight: "700", color: colors.primary },
  toggleRow: { flexDirection: "row", gap: spacing.sm },
  toggleBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  toggleBtnOn: { borderColor: colors.primary, backgroundColor: "#EEF2FF" },
  toggleText: { fontWeight: "600", color: colors.text },
  toggleTextOn: { color: colors.primary },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  dateText: { fontSize: fontSizes.md, color: colors.text, fontWeight: "600" },
  iosDateSheet: {
    width: "100%",
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  iosDateHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iosDateTitle: { fontSize: fontSizes.md, fontWeight: "800", color: colors.text },
  iosDateBtn: { fontSize: fontSizes.md, fontWeight: "700", color: colors.textMuted },
  iosDateBtnPrimary: { color: colors.primary },
  imgBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  imgBtnText: { fontSize: fontSizes.md, color: colors.primary, fontWeight: "700" },
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
  saveBtn: {
    marginTop: spacing.md,
    minHeight: 44,
    borderRadius: radii.round,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveText: { color: colors.white, fontSize: fontSizes.lg, fontWeight: "800" },
  setupEmpty: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
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
});

