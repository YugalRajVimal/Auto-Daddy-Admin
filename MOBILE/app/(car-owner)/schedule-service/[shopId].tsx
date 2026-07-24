import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";
import { ExpandableCard, useToast } from "@/components/reusables";
import { colors, fontSizes, radii, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { postJson } from "@/lib/api";
import { fetchCarOwnerAutoShopById, isCarOwnerShopOpenToday } from "@/lib/car-owner-auto-shops";
import type { CarOwnerAutoShopListItem } from "@/types/car-owner-auto-shops";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type RateResponse = { success?: boolean; message?: string };
type ConnectResponse = { success?: boolean; message?: string };

const STAR_COLOR = colors.warning;

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  const clamped = Math.min(5, Math.max(0, rating));
  const roundedHalf = Math.round(clamped * 2) / 2;
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => {
        const name =
          roundedHalf >= i ? "star" : roundedHalf >= i - 0.5 ? "star-half" : "star-outline";
        return <Ionicons key={i} name={name} size={size} color={STAR_COLOR} />;
      })}
      <Text style={styles.ratingNum}>{clamped > 0 ? clamped.toFixed(1) : "—"}</Text>
    </View>
  );
}

function InteractiveStarRow({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.interactiveStars}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        return (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            disabled={disabled}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${star} out of 5 stars`}
            style={({ pressed }) => [pressed && !disabled && styles.interactiveStarPressed]}
          >
            <Ionicons name={filled ? "star" : "star-outline"} size={40} color={STAR_COLOR} />
          </Pressable>
        );
      })}
    </View>
  );
}

function actionOpenUrl(
  url: string,
  failMessage: string,
  showToast: (m: string, o?: { type?: "error" | "success" | "info" }) => void
) {
  Linking.openURL(url).catch(() => showToast(failMessage, { type: "error" }));
}

function paramString(value: string | string[] | undefined): string | null {
  if (value === undefined) return null;
  const s = Array.isArray(value) ? value[0] : value;
  if (typeof s !== "string") return null;
  const t = s.trim();
  return t.length > 0 ? t : null;
}

export default function AutoShopDetailScreen() {
  const { showToast } = useToast();
  const { token } = useAuth();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ shopId?: string; shop?: string; backTo?: string | string[] }>();
  const [rateOpen, setRateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [connectingServiceId, setConnectingServiceId] = useState<string | null>(null);
  const [picked, setPicked] = useState<number>(0);
  const [hoursOpen, setHoursOpen] = useState(true);

  const defaultBackRoute = "/(car-owner)/schedule-service";
  const explicitBackTo = paramString(params.backTo);
  const resolvedBackTo = explicitBackTo ?? defaultBackRoute;

  const shopId = typeof params.shopId === "string" ? params.shopId.trim() : "";

  const shopFromParams: CarOwnerAutoShopListItem | null = useMemo(() => {
    const raw = params.shop;
    if (!raw || typeof raw !== "string") return null;
    try {
      const parsed = JSON.parse(raw) as CarOwnerAutoShopListItem;
      if (!parsed || typeof parsed !== "object") return null;
      return {
        ...parsed,
        mainServiceItems:
          parsed.mainServiceItems ??
          parsed.mainServices.map((name) => ({ id: "", name })),
      };
    } catch {
      return null;
    }
  }, [params.shop]);

  const [shop, setShop] = useState<CarOwnerAutoShopListItem | null>(shopFromParams);
  const [shopLoadError, setShopLoadError] = useState<string | null>(null);
  const [shopLoading, setShopLoading] = useState<boolean>(() => !shopFromParams && Boolean(shopId));

  useEffect(() => {
    setShop(shopFromParams);
  }, [shopFromParams]);

  useEffect(() => {
    if (shopFromParams || !shopId) {
      setShopLoading(false);
      setShopLoadError(null);
      return;
    }
    if (!token) {
      setShop(null);
      setShopLoadError("You are not signed in.");
      setShopLoading(false);
      return;
    }

    let cancelled = false;
    setShopLoading(true);
    setShopLoadError(null);
    void (async () => {
      const result = await fetchCarOwnerAutoShopById(shopId, { authToken: token });
      if (cancelled) return;
      if (result.ok) {
        setShop(result.shop);
        setShopLoadError(null);
      } else {
        setShop(null);
        setShopLoadError(result.error);
      }
      setShopLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [shopFromParams, shopId, token]);

  const openToday = shop ? isCarOwnerShopOpenToday(shop) : false;
  const openPillText = shop ? (openToday ? "Shop is Open" : "Closed") : "";
  const todayHoursText = shop?.todayHoursText?.trim() || "";

  const hasPhone = Boolean(shop?.phone?.trim());
  const hasWebsite = Boolean(shop?.website?.trim());
  const canCall = openToday && hasPhone;
  const canDirections = openToday;
  const canWebsite = openToday && hasWebsite;

  const onCall = () => {
    if (!shop) return;
    if (!openToday) {
      showToast("This shop is closed.", { type: "info" });
      return;
    }
    const tel = shop.phone.replace(/\s/g, "");
    if (!tel) {
      showToast("No phone number on file.", { type: "info" });
      return;
    }
    actionOpenUrl(`tel:${tel}`, "Could not start a call.", showToast);
  };

  const onWebsite = () => {
    if (!shop) return;
    if (!openToday) {
      showToast("This shop is closed.", { type: "info" });
      return;
    }
    let url = shop.website.trim();
    if (!url) {
      showToast("No website on file.", { type: "info" });
      return;
    }
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    actionOpenUrl(url, "Could not open the website.", showToast);
  };

  async function onConnectService(serviceId: string, serviceName: string) {
    if (!openToday) {
      showToast("This shop is closed.", { type: "info" });
      return;
    }
    if (!token) {
      showToast("You are not authenticated. Please log in again.", { type: "error" });
      return;
    }
    if (!shopId) {
      showToast("Shop is missing an id.", { type: "error" });
      return;
    }
    if (!serviceId) {
      showToast(`Could not connect about ${serviceName}. Service id is missing.`, { type: "error" });
      return;
    }
    setConnectingServiceId(serviceId);
    try {
      const res = await postJson<ConnectResponse>(
        "/api/user/connect-autoshopowner",
        { businessId: shopId, serviceId },
        { authToken: token }
      );
      if (!res.ok || res.data?.success === false) {
        showToast(res.data?.message ?? `Could not connect about ${serviceName}.`, { type: "error" });
        return;
      }
      showToast(res.data?.message ?? `Connected about ${serviceName}!`, { type: "success" });
    } catch {
      showToast("Network error while connecting.", { type: "error" });
    } finally {
      setConnectingServiceId(null);
    }
  }

  const onDirections = () => {
    if (!shop) return;
    if (!openToday) {
      showToast("This shop is closed.", { type: "info" });
      return;
    }
    if (shop.mapLat != null && shop.mapLng != null) {
      const url =
        Platform.OS === "ios"
          ? `maps:${shop.mapLat},${shop.mapLng}?q=${encodeURIComponent(shop.name)}`
          : `geo:${shop.mapLat},${shop.mapLng}?q=${shop.mapLat},${shop.mapLng}(${encodeURIComponent(shop.name)})`;
      actionOpenUrl(url, "Could not open maps.", showToast);
      return;
    }
    const addr = shop.address.trim();
    if (!addr) {
      showToast("No address on file.", { type: "info" });
      return;
    }
    const q = encodeURIComponent(addr);
    const url = Platform.OS === "ios" ? `maps:0,0?q=${q}` : `geo:0,0?q=${q}`;
    actionOpenUrl(url, "Could not open maps.", showToast);
  };

  async function submitRating() {
    if (!token) {
      showToast("You are not authenticated. Please log in again.", { type: "error" });
      return;
    }
    if (!shopId) {
      showToast("Shop is missing an id.", { type: "error" });
      return;
    }
    if (picked < 1 || picked > 5) {
      showToast("Please choose a rating from 1 to 5 stars.", { type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await postJson<RateResponse>(
        "/api/user/rate-auto-shop",
        { autoShopId: shopId, rating: picked },
        { authToken: token }
      );
      if (!res.ok || res.data?.success === false) {
        showToast(res.data?.message ?? "Could not submit rating.", { type: "error" });
        return;
      }
      showToast(res.data?.message ?? "Thanks for your rating!", { type: "success" });
      setRateOpen(false);
    } catch {
      showToast("Network error while submitting rating.", { type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  const goBack = useCallback(() => {
    // Prefer explicit `backTo` from the screen that opened us. With a root Drawer, the nearest
    // navigator's goBack() can skip intermediate screens (e.g. Deals) and land on Home.
    if (explicitBackTo) {
      router.replace(explicitBackTo as never);
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    router.replace(resolvedBackTo as never);
  }, [explicitBackTo, navigation, resolvedBackTo]);

  return (
    <CarOwnerStackScreenFrame
      title={shop?.name ?? "Auto Shop"}
      scroll={false}
      backTo={resolvedBackTo}
      onBack={goBack}
    >
      {shopLoading ? (
        <View style={styles.centerBlock}>
          <ActivityIndicator color={colors.successDark} size="large" />
          <Text style={styles.emptySubtitle}>Loading shop…</Text>
        </View>
      ) : !shop ? (
        <View style={styles.centerBlock}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.textLight} />
          <Text style={styles.emptyTitle}>Shop not found</Text>
          <Text style={styles.emptySubtitle}>{shopLoadError ?? "Please go back and open the shop again."}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.shopHeaderCard}>
            <View style={styles.titleRow}>
              <View style={styles.logoThumb}>
                {shop.logoUrl ? (
                  <Image
                    source={{ uri: shop.logoUrl }}
                    style={styles.logoThumbImage}
                    contentFit="cover"
                    transition={180}
                  />
                ) : (
                  <View style={styles.logoThumbFallback}>
                    <Ionicons name="storefront-outline" size={22} color={colors.successDark} />
                  </View>
                )}
              </View>
              <View style={styles.titleTextWrap}>
                <Text style={styles.shopName} numberOfLines={2}>
                  {shop.name}
                </Text>
                <StarRow rating={shop.rating} />
                <View style={styles.statusBlock}>
                  <View style={[styles.openPill, openToday ? styles.openPillOpen : styles.openPillClosed]}>
                    <Text style={styles.openPillText} numberOfLines={1}>
                      {openPillText}
                    </Text>
                  </View>
                  {todayHoursText ? (
                    <Text style={styles.todayHoursText} numberOfLines={1}>
                      {todayHoursText}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            {shop.mainServiceItems.length > 0 || shop.mainServices.length > 0 ? (
              <View style={styles.serviceList}>
                {(shop.mainServiceItems.length > 0
                  ? shop.mainServiceItems
                  : shop.mainServices.map((name) => ({ id: "", name }))
                ).map((service) => {
                  const connecting = connectingServiceId === service.id;
                  const canConnect = Boolean(service.id) && openToday;
                  return (
                    <View key={service.id || service.name} style={styles.serviceCard}>
                      <View style={styles.serviceCardBody}>
                        <View style={styles.serviceIconWrap}>
                          <Ionicons name="construct-outline" size={18} color={colors.successDark} />
                        </View>
                        <Text style={styles.serviceName} numberOfLines={2}>
                          {service.name}
                        </Text>
                      </View>
                      <Pressable
                        style={({ pressed }) => [
                          styles.connectBtn,
                          (!canConnect || connecting) && styles.connectBtnDisabled,
                          pressed && canConnect && !connecting && styles.connectBtnPressed,
                        ]}
                        onPress={() => void onConnectService(service.id, service.name)}
                        disabled={!canConnect || connecting}
                        accessibilityRole="button"
                        accessibilityLabel={`Connect about ${service.name}`}
                        android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                      >
                        {connecting ? (
                          <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                          <Ionicons name="link-outline" size={14} color={colors.white} />
                        )}
                        <Text style={styles.connectBtnText}>{connecting ? "Connecting…" : "Connect"}</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptySubtitle}>Services not listed.</Text>
            )}
          </View>

          <ExpandableCard
            title="Open Hours"
            headerIcon="time"
            expanded={hoursOpen}
            onToggle={() => setHoursOpen((v) => !v)}
          >
            <View style={{ gap: spacing.sm }}>
              {todayHoursText ? (
                <Text style={styles.hoursLine}>Today: {todayHoursText}</Text>
              ) : null}
              <Text style={todayHoursText ? styles.hoursMuted : styles.hoursLine}>
                {shop.openHoursText?.trim() ? shop.openHoursText : shop.timing}
              </Text>
              {shop.openDaysText?.trim() ? <Text style={styles.hoursMuted}>{shop.openDaysText}</Text> : null}
              {shop.closedScheduleText?.trim() ? (
                <Text style={styles.hoursMuted}>Closed: {shop.closedScheduleText}</Text>
              ) : null}
            </View>
          </ExpandableCard>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <Text style={styles.contactLine}>{shop.address}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                !canCall && styles.actionBtnDisabled,
                pressed && canCall && styles.actionBtnPressed,
              ]}
              onPress={onCall}
              disabled={!canCall}
              android_ripple={{ color: "rgba(22,101,52,0.08)" }}
            >
              <Ionicons name="call-outline" size={18} color={canCall ? colors.successDark : colors.textLight} />
              <Text style={[styles.actionLabel, !canCall && styles.actionLabelDisabled]}>Call</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                !canDirections && styles.actionBtnDisabled,
                pressed && canDirections && styles.actionBtnPressed,
              ]}
              onPress={onDirections}
              disabled={!canDirections}
              android_ripple={{ color: "rgba(22,101,52,0.08)" }}
            >
              <Ionicons name="navigate-outline" size={18} color={canDirections ? colors.successDark : colors.textLight} />
              <Text style={[styles.actionLabel, !canDirections && styles.actionLabelDisabled]}>Directions</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                !canWebsite && styles.actionBtnDisabled,
                pressed && canWebsite && styles.actionBtnPressed,
              ]}
              onPress={onWebsite}
              disabled={!canWebsite}
              android_ripple={{ color: "rgba(22,101,52,0.08)" }}
            >
              <Ionicons name="globe-outline" size={18} color={canWebsite ? colors.successDark : colors.textLight} />
              <Text style={[styles.actionLabel, !canWebsite && styles.actionLabelDisabled]}>Website</Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.rateBtn, pressed && styles.rateBtnPressed]}
            onPress={() => {
              setPicked(0);
              setRateOpen(true);
            }}
            android_ripple={{ color: "rgba(37,99,235,0.12)" }}
          >
            <Ionicons name="star-outline" size={18} color={colors.primary} />
            <Text style={styles.rateBtnText}>Rate this shop</Text>
          </Pressable>
        </ScrollView>
      )}

      <Modal visible={rateOpen} transparent animationType="fade" onRequestClose={() => setRateOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your rating</Text>
              <Pressable onPress={() => setRateOpen(false)} hitSlop={8} disabled={submitting}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>Tap a star to rate this shop</Text>
            <InteractiveStarRow value={picked} onChange={setPicked} disabled={submitting} />
            {picked > 0 ? (
              <Text style={styles.pickedRatingLabel}>
                {picked} {picked === 1 ? "star" : "stars"}
              </Text>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                (submitting || picked < 1) && styles.submitBtnDisabled,
                pressed && styles.submitBtnPressed,
              ]}
              onPress={() => void submitRating()}
              disabled={submitting || picked < 1}
            >
              <Text style={styles.submitBtnText}>{submitting ? "Submitting…" : "Submit rating"}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </CarOwnerStackScreenFrame>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.screenHorizontal, gap: spacing.md },
  centerBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
    gap: spacing.lg,
  },
  emptyTitle: { ...typography.cardTitle, fontSize: fontSizes.lg, textAlign: "center" },
  emptySubtitle: { ...typography.bodyMuted, textAlign: "center" },
  shopHeaderCard: {
    marginTop: spacing.sm,
    borderRadius: radii.xxl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  logoThumb: {
    width: 120,
    height: 80,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: "rgba(245, 237, 220, 0.95)",
  },
  logoThumbImage: { width: "100%", height: "100%" },
  logoThumbFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245, 237, 220, 0.95)",
  },
  titleTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  shopName: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.successDark,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  statusBlock: {
    marginTop: 2,
    gap: 4,
    alignItems: "flex-start",
  },
  openPill: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
    justifyContent: "center",
    alignItems: "center",
  },
  openPillOpen: { backgroundColor: colors.successDark },
  openPillClosed: { backgroundColor: "rgba(148,163,184,0.85)" },
  openPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 0.2,
  },
  todayHoursText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
  },
  stars: { flexDirection: "row", alignItems: "center", gap: 2 },
  ratingNum: { marginLeft: 6, fontSize: fontSizes.sm, fontWeight: "800", color: colors.text },
  interactiveStars: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  interactiveStarPressed: { opacity: 0.75, transform: [{ scale: 0.94 }] },
  pickedRatingLabel: {
    textAlign: "center",
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.textMuted,
  },
  section: { backgroundColor: colors.white, borderRadius: radii.xxl, borderWidth: 1, borderColor: "rgba(15,23,42,0.06)", padding: spacing.lg, gap: spacing.sm },
  sectionTitle: { ...typography.cardTitle, fontSize: fontSizes.lg },
  serviceList: { gap: spacing.sm },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
  },
  serviceCardBody: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, minWidth: 0 },
  serviceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(22,101,52,0.10)",
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.14)",
  },
  serviceName: { flex: 1, fontSize: fontSizes.sm, fontWeight: "800", color: colors.text, lineHeight: 20 },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.successDark,
  },
  connectBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  connectBtnDisabled: { opacity: 0.55 },
  connectBtnText: { fontSize: 12, fontWeight: "900", color: colors.white },
  hoursLine: { fontSize: fontSizes.md, fontWeight: "800", color: colors.text },
  hoursMuted: { ...typography.bodyMuted, fontWeight: "700" },
  contactLine: { fontSize: fontSizes.md, fontWeight: "700", color: colors.textMuted, lineHeight: 20 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.20)",
  },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  actionLabel: { fontSize: 12, fontWeight: "900", color: colors.successDark },
  actionLabelDisabled: { color: colors.textLight },
  rateBtn: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 46,
    borderRadius: 999,
    backgroundColor: colors.primaryMutedBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rateBtnPressed: { opacity: 0.85 },
  rateBtnText: { fontSize: fontSizes.sm, fontWeight: "900", color: colors.primaryDark },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.55)", alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg },
  modalCard: { width: "100%", maxWidth: 420, backgroundColor: colors.white, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.md },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontSize: fontSizes.lg, fontWeight: "900", color: colors.text },
  modalSubtitle: { ...typography.bodyMuted, fontWeight: "700", textAlign: "center" },
  submitBtn: { minHeight: 46, borderRadius: 999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnPressed: { opacity: 0.9 },
  submitBtnText: { color: colors.white, fontSize: fontSizes.md, fontWeight: "900" },
});

