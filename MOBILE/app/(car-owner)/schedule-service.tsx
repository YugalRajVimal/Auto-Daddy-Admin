import { CarOwnerCityPickerModal } from "@/components/car-owner/car-owner-city-picker-modal";
import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";
import { useToast } from "@/components/reusables";
import { cardFontSizes, colors, fontSizes, radii, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { parseServiceCatalogResponse } from "@/hooks/use-auto-shop-services-catalog";
import { useCarOwnerAutoShops } from "@/hooks/use-car-owner-auto-shops";
import { useCarOwnerFavoriteShops } from "@/hooks/use-car-owner-favorite-shops";
import { useCarOwnerCustomerRequests } from "@/hooks/use-car-owner-customer-requests";
import { getJson, putJson } from "@/lib/api";
import { formatCustomerRequestDate } from "@/lib/car-owner-approvals";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import { isCarOwnerShopOpenToday } from "@/lib/car-owner-auto-shops";
import {
  carOwnerShopTypeScreenTitle,
  parseCarOwnerShopTypeParam,
  scheduleServiceListHref,
  type CarOwnerShopType,
} from "@/lib/car-owner-shop-types";
import type { CarOwnerAutoShopListItem } from "@/types/car-owner-auto-shops";
import type { UserCity } from "@/types/user-cities";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ShopsListTab = "all" | "favorites";

type FilterOption = { id: string; label: string; imageUrl?: string | null };

function BrandLogoThumb({
  uri,
  size = 28,
  style,
}: {
  uri: string;
  size?: number;
  style?: object;
}) {
  return (
    <Image
      source={{ uri }}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
      transition={150}
    />
  );
}

function formatFilterSummary(selectedId: string | null, options: FilterOption[]): string {
  if (!selectedId) {
    return "Any";
  }
  const match = options.find((o) => o.id === selectedId);
  return match?.label?.trim() || "Selected";
}

type AutoShopCardProps = {
  shop: CarOwnerAutoShopListItem;
  isFavorite: boolean;
  onToggleFavorite: (shopId: string) => void;
  shopTypeFilter: CarOwnerShopType | null;
};

const AutoShopCard = memo(function AutoShopCard({
  shop,
  isFavorite,
  onToggleFavorite,
  shopTypeFilter,
}: AutoShopCardProps) {
  const openNow = isCarOwnerShopOpenToday(shop);
  const openPillText = openNow ? "Shop is Open" : "Closed";
  const todayHoursText = shop.todayHoursText?.trim() || "";

  const onViewShop = useCallback(() => {
    router.push({
      pathname: "/(car-owner)/schedule-service/[shopId]",
      params: {
        shopId: shop.id,
        shop: JSON.stringify(shop),
        backTo: scheduleServiceListHref(shopTypeFilter),
      },
    } as any);
  }, [shop, shopTypeFilter]);

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onViewShop}
        accessibilityRole="button"
        accessibilityLabel={`View ${shop.name}`}
        android_ripple={{ color: "rgba(22,101,52,0.06)" }}
        style={({ pressed }) => [pressed && styles.cardBodyPressed]}
      >
        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <View style={styles.logoThumb}>
              {shop.logoUrl ? (
                <Image
                  source={{ uri: shop.logoUrl }}
                  style={styles.logoThumbImage}
                  contentFit="cover"
                  transition={150}
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
              <View style={styles.statusBlock}>
                <View style={[styles.openPill, openNow ? styles.openPillOpen : styles.openPillClosed]}>
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
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onToggleFavorite(shop.id);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
              style={({ pressed }) => [
                styles.favBtn,
                isFavorite && styles.favBtnActive,
                pressed && styles.favBtnPressed,
              ]}
              android_ripple={{ color: "rgba(239,68,68,0.18)", borderless: true, radius: 22 }}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? colors.danger : colors.textMuted}
              />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </View>
  );
});

const FilterPickerModal = memo(function FilterPickerModal({
  visible,
  title,
  options,
  selectedId,
  loading,
  onClose,
  onApply,
}: {
  visible: boolean;
  title: string;
  options: FilterOption[];
  selectedId: string | null;
  loading: boolean;
  onClose: () => void;
  onApply: (id: string | null) => void;
}) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDraft(selectedId);
    }
  }, [visible, selectedId]);

  const selectOption = useCallback((id: string) => {
    setDraft((prev) => (prev === id ? null : id));
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.filterModalBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.filterModalSheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.filterModalLoading}>
              <ActivityIndicator size="small" color={colors.successDark} />
              <Text style={styles.filterModalLoadingText}>Loading…</Text>
            </View>
          ) : options.length === 0 ? (
            <Text style={styles.filterModalEmpty}>No options available.</Text>
          ) : (
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              style={styles.filterModalList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selected = draft === item.id;
                return (
                  <Pressable
                    onPress={() => selectOption(item.id)}
                    style={({ pressed }) => [
                      styles.filterModalRow,
                      selected && styles.filterModalRowSelected,
                      pressed && styles.filterModalRowPressed,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={item.label}
                  >
                    <View style={styles.filterModalRowMain}>
                      {item.imageUrl ? (
                        <BrandLogoThumb uri={item.imageUrl} size={32} style={styles.filterModalRowLogo} />
                      ) : null}
                      <Text style={styles.filterModalRowLabel} numberOfLines={2}>
                        {item.label}
                      </Text>
                    </View>
                    <Ionicons
                      name={selected ? "radio-button-on" : "radio-button-off"}
                      size={22}
                      color={selected ? colors.successDark : colors.textLight}
                    />
                  </Pressable>
                );
              }}
            />
          )}

          <View style={styles.filterModalActions}>
            <Pressable
              onPress={() => setDraft(null)}
              style={({ pressed }) => [styles.filterModalSecondaryBtn, pressed && styles.filterModalBtnPressed]}
            >
              <Text style={styles.filterModalSecondaryText}>Clear</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onApply(draft);
                onClose();
              }}
              style={({ pressed }) => [styles.filterModalPrimaryBtn, pressed && styles.filterModalBtnPressed]}
            >
              <Text style={styles.filterModalPrimaryText}>Apply</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const HeaderTabsAndFilters = memo(function HeaderTabsAndFilters({
  myCityName,
  onEditCity,
  listTab,
  onSelectAll,
  onSelectFavorites,
  favoriteCount,
  showFilters,
  serviceSummary,
  selectedCarCompany,
  hasActiveFilters,
  onOpenServiceFilter,
  onOpenCarCompanyFilter,
  onClearFilters,
}: {
  myCityName: string;
  onEditCity: () => void;
  listTab: ShopsListTab;
  onSelectAll: () => void;
  onSelectFavorites: () => void;
  favoriteCount: number;
  showFilters: boolean;
  serviceSummary: string;
  selectedCarCompany: { imageUrl: string | null; label: string } | null;
  hasActiveFilters: boolean;
  onOpenServiceFilter: () => void;
  onOpenCarCompanyFilter: () => void;
  onClearFilters: () => void;
}) {
  return (
    <>
      <View style={styles.cityCompanyRow}>
        <Pressable
          onPress={onEditCity}
          style={({ pressed }) => [
            styles.cityField,
            !showFilters && styles.cityFieldFull,
            pressed && styles.filterFieldPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Edit city"
        >
          <Ionicons name="location-outline" size={16} color={colors.textMuted} />
          <Text style={styles.myCityValue} numberOfLines={1}>
            {myCityName.trim() || "Not set"}
          </Text>
          {/* <Ionicons name="pencil" size={14} color={colors.successDark} /> */}
        </Pressable>

        {showFilters ? (
          <Pressable
            onPress={onOpenCarCompanyFilter}
            style={({ pressed }) => [styles.carCompanyField, pressed && styles.filterFieldPressed]}
            accessibilityRole="button"
            accessibilityLabel={
              selectedCarCompany
                ? `Filter by make, ${selectedCarCompany.label}`
                : "Filter by make, any"
            }
          >
            <Text style={styles.filterFieldLabel} numberOfLines={1}>
              Make
            </Text>
            <View style={styles.filterFieldValueRow}>
              <View style={styles.makeFieldValue}>
                {selectedCarCompany?.imageUrl ? (
                  <BrandLogoThumb uri={selectedCarCompany.imageUrl} size={24} />
                ) : null}
                <Text style={styles.filterFieldValue} numberOfLines={1}>
                  {selectedCarCompany?.label ?? "Any"}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </View>
          </Pressable>
        ) : null}
      </View>

      {/* <View style={styles.listTabBar}>
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={onSelectAll}
          style={styles.listTabHit}
          accessibilityRole="button"
          accessibilityState={{ selected: listTab === "all" }}
        >
          <View
            style={[
              styles.listTabBtn,
              listTab === "all" ? styles.listTabBtnSelected : styles.listTabBtnIdle,
            ]}
          >
            <Text
              style={[
                styles.listTabLabel,
                listTab === "all" ? styles.listTabLabelSelected : styles.listTabLabelIdle,
              ]}
            >
              All
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.92}
          onPress={onSelectFavorites}
          style={styles.listTabHit}
          accessibilityRole="button"
          accessibilityState={{ selected: listTab === "favorites" }}
        >
          <View
            style={[
              styles.listTabBtn,
              listTab === "favorites" ? styles.listTabBtnSelected : styles.listTabBtnIdle,
            ]}
          >
            <Text
              style={[
                styles.listTabLabel,
                listTab === "favorites" ? styles.listTabLabelSelected : styles.listTabLabelIdle,
              ]}
            >
              Favourites
            </Text>
            {favoriteCount > 0 ? (
              <View
                style={[
                  styles.listTabBadge,
                  listTab === "favorites" ? styles.listTabBadgeSelected : styles.listTabBadgeIdle,
                ]}
              >
                <Text
                  style={[
                    styles.listTabBadgeText,
                    listTab === "favorites"
                      ? styles.listTabBadgeTextSelected
                      : styles.listTabBadgeTextIdle,
                  ]}
                >
                  {favoriteCount}
                </Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </View> */}

      {showFilters ? (
        <View style={styles.filtersBlock}>
          <Pressable
            onPress={onOpenServiceFilter}
            style={({ pressed }) => [styles.filterField, pressed && styles.filterFieldPressed]}
            accessibilityRole="button"
            accessibilityLabel="Filter by service"
          >
            <Text style={styles.filterFieldLabel}>Service you need</Text>
            <View style={styles.filterFieldValueRow}>
              <Text style={styles.filterFieldValue} numberOfLines={1}>
                {serviceSummary}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </View>
          </Pressable>

          {hasActiveFilters ? (
            <Pressable
              onPress={onClearFilters}
              hitSlop={8}
              style={({ pressed }) => [styles.clearFiltersBtn, pressed && styles.filterFieldPressed]}
              accessibilityLabel="Clear filters"
            >
              <Ionicons name="close-circle-outline" size={18} color={colors.successDark} />
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </>
  );
});

const ShopsList = memo(function ShopsList({
  loading,
  error,
  shops,
  listTab,
  favoriteIds,
  isFavorite,
  onToggleFavorite,
  onSelectAllTab,
  hasActiveFilters,
  shopTypeFilter,
  emptyTitle,
}: {
  loading: boolean;
  error: string | null;
  shops: CarOwnerAutoShopListItem[];
  listTab: ShopsListTab;
  favoriteIds: ReadonlySet<string>;
  isFavorite: (shopId: string) => boolean;
  onToggleFavorite: (shopId: string) => void;
  onSelectAllTab: () => void;
  hasActiveFilters: boolean;
  shopTypeFilter: CarOwnerShopType | null;
  emptyTitle: string;
}) {
  const baseShops = useMemo(() => {
    if (listTab !== "favorites") return shops;
    return shops.filter((s) => favoriteIds.has(s.id));
  }, [favoriteIds, listTab, shops]);

  const favoritesUnavailable = listTab === "favorites" && favoriteIds.size > 0 && baseShops.length === 0 && !loading;

  if (error) {
    return (
      <View style={styles.centerBlock}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!loading && shops.length === 0) {
    return (
      <View style={styles.centerBlock}>
        <Ionicons name="car-outline" size={40} color={colors.textLight} />
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptySubtitle}>
          {hasActiveFilters
            ? "No shops match your filters. Try clearing filters or check back later."
            : shopTypeFilter
              ? `No ${emptyTitle.toLowerCase()} in your area yet. Check back later.`
              : "Check back later for garages in your area."}
        </Text>
      </View>
    );
  }

  return (
    <>
      {loading ? (
        <View style={styles.inlineLoadingRow}>
          <ActivityIndicator size="small" color={colors.successDark} />
          <Text style={styles.inlineLoadingText}>Loading shops…</Text>
        </View>
      ) : null}

      {listTab === "favorites" && favoriteIds.size === 0 ? (
        <View style={styles.centerBlock}>
          <Ionicons name="heart-outline" size={40} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No favourites yet</Text>
          <Text style={styles.emptySubtitle}>
            Browse all shops and tap the heart on a garage to save it here.
          </Text>
          <Pressable style={styles.resetBtn} onPress={onSelectAllTab} android_ripple={{ color: "rgba(22,101,52,0.12)" }}>
            <Text style={styles.resetBtnText}>Browse all shops</Text>
          </Pressable>
        </View>
      ) : favoritesUnavailable ? (
        <View style={styles.centerBlock}>
          <Ionicons name="heart-dislike-outline" size={40} color={colors.textLight} />
          <Text style={styles.emptyTitle}>Saved shops unavailable</Text>
          <Text style={styles.emptySubtitle}>
            None of your favourite shops are in the current list. Try All or check back later.
          </Text>
          <Pressable style={styles.resetBtn} onPress={onSelectAllTab} android_ripple={{ color: "rgba(22,101,52,0.12)" }}>
            <Text style={styles.resetBtnText}>View all shops</Text>
          </Pressable>
        </View>
      ) : (
        baseShops.map((shop) => (
          <AutoShopCard
            key={shop.id}
            shop={shop}
            isFavorite={isFavorite(shop.id)}
            onToggleFavorite={onToggleFavorite}
            shopTypeFilter={shopTypeFilter}
          />
        ))
      )}
    </>
  );
});

export default function CarOwnerScheduleService() {
  const { showToast } = useToast();
  const { token } = useAuth();
  const { shopType: shopTypeParam } = useLocalSearchParams<{ shopType?: string | string[] }>();
  const shopTypeFilter = useMemo(() => {
    const raw = Array.isArray(shopTypeParam) ? shopTypeParam[0] : shopTypeParam;
    return parseCarOwnerShopTypeParam(raw);
  }, [shopTypeParam]);
  const screenTitle = useMemo(() => carOwnerShopTypeScreenTitle(shopTypeFilter), [shopTypeFilter]);
  const emptyTitle = useMemo(
    () => (shopTypeFilter ? `No ${screenTitle.toLowerCase()} yet` : "No shops yet"),
    [screenTitle, shopTypeFilter]
  );
  const [myCityId, setMyCityId] = useState<string | null>(null);
  const [myCityName, setMyCityName] = useState<string>("");
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedCarCompanyId, setSelectedCarCompanyId] = useState<string | null>(null);
  const [serviceFilterOpen, setServiceFilterOpen] = useState(false);
  const [carCompanyFilterOpen, setCarCompanyFilterOpen] = useState(false);
  const [serviceOptions, setServiceOptions] = useState<FilterOption[]>([]);
  const [carCompanyOptions, setCarCompanyOptions] = useState<FilterOption[]>([]);
  const [servicesCatalogLoading, setServicesCatalogLoading] = useState(false);
  const [carCompaniesLoading, setCarCompaniesLoading] = useState(false);

  const shopFilters = useMemo(
    () => ({
      serviceIds: selectedServiceId ? [selectedServiceId] : [],
      carCompanyIds: selectedCarCompanyId ? [selectedCarCompanyId] : [],
      shopType: shopTypeFilter,
    }),
    [selectedCarCompanyId, selectedServiceId, shopTypeFilter]
  );

  const { shops, loading, error, refresh } = useCarOwnerAutoShops(shopFilters);
  const { favoriteIds, isFavorite, toggleFavorite, refresh: refreshFavorites } = useCarOwnerFavoriteShops();
  const {
    items: customerRequests,
    loading: requestsLoading,
    error: requestsError,
    actingId,
    refresh: refreshRequests,
    approve: approveRequest,
    reject: rejectRequest,
  } = useCarOwnerCustomerRequests();
  const [listTab, setListTab] = useState<ShopsListTab>(shopTypeFilter ? "all" : "favorites");
  const [mainSection, setMainSection] = useState<"shops" | "approvals">("shops");
  const [browsingAllWithoutFilters, setBrowsingAllWithoutFilters] = useState(() => Boolean(shopTypeFilter));
  const [refreshing, setRefreshing] = useState(false);

  const loadFilterOptions = useCallback(async () => {
    if (!token) {
      setServiceOptions([]);
      setCarCompanyOptions([]);
      return;
    }
    const authToken = token;
    setServicesCatalogLoading(true);
    setCarCompaniesLoading(true);
    try {
      const [servicesRes, companiesRes] = await Promise.all([
        getJson<unknown>("/api/auto-shop-owner/services", { authToken }),
        getJson<{
          data?: Array<{
            _id: string;
            companyName: string;
            brandLogo?: string | null;
            logoUrl?: string | null;
          }>;
        }>("/api/user/car-companies", { authToken }),
      ]);

      if (servicesRes.ok) {
        const categories = parseServiceCatalogResponse(servicesRes.data);
        setServiceOptions(
          categories
            .filter((c) => c.id)
            .map((c) => ({ id: c.id as string, label: c.name }))
        );
      } else {
        setServiceOptions([]);
      }

      if (companiesRes.ok) {
        const rows = Array.isArray(companiesRes.data?.data) ? companiesRes.data?.data ?? [] : [];
        setCarCompanyOptions(
          rows
            .filter((c) => typeof c._id === "string" && c._id.trim())
            .map((c) => {
              const label = (c.companyName ?? "").trim() || "Unknown";
              const rawLogo =
                (typeof c.brandLogo === "string" ? c.brandLogo : null) ??
                (typeof c.logoUrl === "string" ? c.logoUrl : null);
              return {
                id: c._id.trim(),
                label,
                imageUrl: rawLogo?.trim() ? normalizeMediaUrl(rawLogo.trim()) : null,
              };
            })
        );
      } else {
        setCarCompanyOptions([]);
      }
    } finally {
      setServicesCatalogLoading(false);
      setCarCompaniesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadFilterOptions();
  }, [loadFilterOptions]);

  const loadMyCity = useCallback(async () => {
    if (!token) {
      setMyCityId(null);
      setMyCityName("");
      return;
    }
    const res = await getJson<unknown>("/api/user/profile", { authToken: token });
    const payload = res.data;
    const src =
      payload && typeof payload === "object" && (payload as any).data && typeof (payload as any).data === "object"
        ? ((payload as any).data as Record<string, unknown>)
        : (payload as Record<string, unknown> | null);
    const city = typeof src?.city === "string" ? src.city : "";
    const cityId = typeof src?.cityId === "string" ? src.cityId : "";
    setMyCityName(city?.trim() || "");
    setMyCityId(cityId?.trim() || null);
  }, [token]);

  useEffect(() => {
    void loadMyCity();
  }, [loadMyCity]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refresh(),
        refreshFavorites(),
        refreshRequests(),
        loadMyCity(),
        loadFilterOptions(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadFilterOptions, loadMyCity, refresh, refreshFavorites, refreshRequests]);

  const handleToggleFavorite = useCallback(
    async (shopId: string) => {
      const result = await toggleFavorite(shopId);
      if (!result.ok) {
        showToast(result.error ?? "Could not update favorite.", { type: "error" });
        return;
      }
      showToast(result.isFavorite ? "Added to favorites." : "Removed from favorites.", {
        type: "success",
      });
    },
    [showToast, toggleFavorite]
  );

  const hasActiveFilters = Boolean(selectedServiceId || selectedCarCompanyId);

  useEffect(() => {
    if (hasActiveFilters) {
      setListTab("all");
      return;
    }
    if (!browsingAllWithoutFilters) {
      setListTab("favorites");
    }
  }, [browsingAllWithoutFilters, hasActiveFilters]);

  const showShopListChrome = !error && (shops.length > 0 || loading || hasActiveFilters);
  const showHeaderFilters =
    showShopListChrome && !(listTab === "favorites" && favoriteIds.size === 0);
  const serviceSummary = formatFilterSummary(selectedServiceId, serviceOptions);
  const selectedCarCompany = useMemo(() => {
    if (!selectedCarCompanyId) {
      return null;
    }
    const match = carCompanyOptions.find((o) => o.id === selectedCarCompanyId);
    if (!match) {
      return { imageUrl: null, label: "Selected" };
    }
    return {
      imageUrl: match.imageUrl ?? null,
      label: match.label.trim() || "Unknown",
    };
  }, [carCompanyOptions, selectedCarCompanyId]);

  const openCityPicker = useCallback(() => setCityPickerOpen(true), []);
  const selectAll = useCallback(() => {
    setBrowsingAllWithoutFilters(true);
    setListTab("all");
  }, []);
  const selectFavorites = useCallback(() => {
    setBrowsingAllWithoutFilters(false);
    setListTab("favorites");
  }, []);
  const clearFilters = useCallback(() => {
    setSelectedServiceId(null);
    setSelectedCarCompanyId(null);
    setBrowsingAllWithoutFilters(false);
  }, []);

  const headerTabsAndFilters = useMemo(() => {
    if (mainSection !== "shops" || !showShopListChrome) return undefined;
    return (
      <HeaderTabsAndFilters
        myCityName={myCityName}
        onEditCity={openCityPicker}
        listTab={listTab}
        onSelectAll={selectAll}
        onSelectFavorites={selectFavorites}
        favoriteCount={favoriteIds.size}
        showFilters={showHeaderFilters}
        serviceSummary={serviceSummary}
        selectedCarCompany={selectedCarCompany}
        hasActiveFilters={hasActiveFilters}
        onOpenServiceFilter={() => setServiceFilterOpen(true)}
        onOpenCarCompanyFilter={() => setCarCompanyFilterOpen(true)}
        onClearFilters={clearFilters}
      />
    );
  }, [
    selectedCarCompany,
    clearFilters,
    favoriteIds.size,
    hasActiveFilters,
    listTab,
    mainSection,
    myCityName,
    openCityPicker,
    selectAll,
    selectFavorites,
    serviceSummary,
    showHeaderFilters,
    showShopListChrome,
  ]);

  const onApproveRequest = useCallback(
    async (businessId: string) => {
      const result = await approveRequest(businessId);
      showToast(result.message, { type: result.ok ? "success" : "error" });
    },
    [approveRequest, showToast]
  );

  const onRejectRequest = useCallback(
    async (businessId: string) => {
      const result = await rejectRequest(businessId);
      showToast(result.message, { type: result.ok ? "success" : "error" });
    },
    [rejectRequest, showToast]
  );

  return (
    <CarOwnerStackScreenFrame
      title={screenTitle}
      headerExtension={headerTabsAndFilters}
      onRefresh={handleRefresh}
      refreshing={refreshing}
    >
      <View style={styles.sectionTabs}>
        {([
          { id: "shops" as const, label: "Shops" },
          {
            id: "approvals" as const,
            label: customerRequests.length > 0 ? `Approvals (${customerRequests.length})` : "Approvals",
          },
        ]).map((tab) => {
          const active = mainSection === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setMainSection(tab.id)}
              style={[styles.sectionTabBtn, active && styles.sectionTabBtnActive]}
            >
              <Text style={[styles.sectionTabText, active && styles.sectionTabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {mainSection === "shops" ? (
        <ShopsList
          loading={loading}
          error={error}
          shops={shops}
          listTab={listTab}
          favoriteIds={favoriteIds}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
          onSelectAllTab={selectAll}
          hasActiveFilters={hasActiveFilters}
          shopTypeFilter={shopTypeFilter}
          emptyTitle={emptyTitle}
        />
      ) : requestsLoading && customerRequests.length === 0 ? (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="small" color={colors.successDark} />
          <Text style={styles.emptySubtitle}>Loading approvals…</Text>
        </View>
      ) : requestsError ? (
        <View style={styles.centerBlock}>
          <Text style={styles.errorText}>{requestsError}</Text>
          <Pressable style={styles.resetBtn} onPress={() => void refreshRequests()}>
            <Text style={styles.resetBtnText}>Try again</Text>
          </Pressable>
        </View>
      ) : customerRequests.length === 0 ? (
        <View style={styles.centerBlock}>
          <Ionicons name="checkmark-done-outline" size={40} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No pending approvals</Text>
          <Text style={styles.emptySubtitle}>
            Shops that ask to add you as a customer will show up here.
          </Text>
        </View>
      ) : (
        <View style={styles.approvalsList}>
          {customerRequests.map((req) => {
            const busy = actingId === req.businessId;
            return (
              <View key={req.businessId} style={styles.approvalCard}>
                <View style={styles.approvalCardTop}>
                  <View style={styles.approvalLogo}>
                    {req.businessLogo ? (
                      <Image
                        source={{ uri: req.businessLogo }}
                        style={styles.approvalLogoImage}
                        contentFit="cover"
                      />
                    ) : (
                      <Ionicons name="storefront-outline" size={22} color={colors.successDark} />
                    )}
                  </View>
                  <View style={styles.approvalCopy}>
                    <Text style={styles.approvalName}>{req.businessName}</Text>
                    <Text style={styles.approvalMeta}>
                      {[req.city, formatCustomerRequestDate(req.addedAt)].filter(Boolean).join(" · ")}
                    </Text>
                    {req.pendingEdit?.name || req.pendingEdit?.email ? (
                      <Text style={styles.approvalMeta}>
                        Requested as {[req.pendingEdit?.name, req.pendingEdit?.email]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.approvalActions}>
                  <Pressable
                    disabled={busy}
                    onPress={() => void onApproveRequest(req.businessId)}
                    style={[styles.approvalApproveBtn, busy && styles.filterModalBtnPressed]}
                  >
                    <Text style={styles.approvalActionText}>Approve</Text>
                  </Pressable>
                  <Pressable
                    disabled={busy}
                    onPress={() => void onRejectRequest(req.businessId)}
                    style={[styles.approvalRejectBtn, busy && styles.filterModalBtnPressed]}
                  >
                    <Text style={styles.approvalActionText}>Reject</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <FilterPickerModal
        visible={serviceFilterOpen}
        title="Filter by Service"
        options={serviceOptions}
        selectedId={selectedServiceId}
        loading={servicesCatalogLoading}
        onClose={() => setServiceFilterOpen(false)}
        onApply={setSelectedServiceId}
      />
      <FilterPickerModal
        visible={carCompanyFilterOpen}
        title="Filter by Make"
        options={carCompanyOptions}
        selectedId={selectedCarCompanyId}
        loading={carCompaniesLoading}
        onClose={() => setCarCompanyFilterOpen(false)}
        onApply={setSelectedCarCompanyId}
      />

      <CarOwnerCityPickerModal
        visible={cityPickerOpen}
        onClose={() => setCityPickerOpen(false)}
        authToken={token}
        selectedId={myCityId}
        onSelect={async (city: UserCity) => {
          setMyCityId(city.id);
          setMyCityName(city.name);
          setCityPickerOpen(false);
          if (!token) return;
          const res = await putJson<any>(
            "/api/user/edit-profile",
            { cityId: city.id, city: city.name } as Record<string, unknown>,
            { authToken: token }
          );
          if (!res.ok || res.data?.success === false) {
            showToast(res.data?.message ?? "Could not update city.", { type: "error" });
            void loadMyCity();
            return;
          }
          showToast(res.data?.message ?? "City updated.", { type: "success" });
        }}
      />
    </CarOwnerStackScreenFrame>
  );
}

const cardChrome = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  android: { elevation: 4 },
  default: {},
});

const styles = StyleSheet.create({
  sectionTabs: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTabBtn: {
    flex: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.16)",
  },
  sectionTabBtnActive: {
    backgroundColor: colors.successDark,
    borderColor: colors.successDark,
  },
  sectionTabText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.successDark,
  },
  sectionTabTextActive: { color: colors.white },
  approvalsList: { gap: spacing.md, paddingBottom: spacing.xl },
  approvalCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.12)",
    gap: spacing.sm,
  },
  approvalCardTop: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  approvalLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(22,101,52,0.08)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  approvalLogoImage: { width: 44, height: 44 },
  approvalCopy: { flex: 1, minWidth: 0, gap: 2 },
  approvalName: { fontSize: fontSizes.md, fontWeight: "900", color: colors.text },
  approvalMeta: { fontSize: fontSizes.xs, fontWeight: "700", color: colors.textMuted },
  approvalActions: { flexDirection: "row", gap: spacing.sm },
  approvalApproveBtn: {
    flex: 1,
    backgroundColor: colors.successDark,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  approvalRejectBtn: {
    flex: 1,
    backgroundColor: "#991B1B",
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  approvalActionText: { color: colors.white, fontWeight: "800", fontSize: fontSizes.sm },
  screenIntro: {
    ...typography.bodyMuted,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  listTabBar: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.14)",
    padding: 4,
    gap: 4,
    overflow: "hidden",
  },
  listTabHit: {
    flex: 1,
    minWidth: 0,
  },
  listTabBtn: {
    width: "100%",
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  listTabBtnIdle: {
    backgroundColor: colors.white,
  },
  listTabBtnSelected: {
    backgroundColor: colors.successDark,
  },
  listTabLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    flexShrink: 0,
  },
  listTabLabelIdle: {
    color: colors.textMuted,
  },
  listTabLabelSelected: { color: colors.white },
  listTabBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  listTabBadgeIdle: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
  },
  listTabBadgeSelected: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  listTabBadgeText: {
    fontSize: cardFontSizes.xs,
    fontWeight: "800",
  },
  listTabBadgeTextIdle: {
    color: colors.textMuted,
  },
  listTabBadgeTextSelected: { color: colors.white },
  filtersBlock: {
    gap: spacing.sm,
  },
  filterField: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.14)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  filterFieldPressed: { opacity: 0.92 },
  filterFieldLabel: {
    fontSize: cardFontSizes.xs,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  filterFieldValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  filterFieldValue: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.text,
  },
  makeFieldValue: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 0,
  },
  clearFiltersBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.xs,
  },
  clearFiltersText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.successDark,
  },
  filterModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
  },
  filterModalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.hero,
    borderTopRightRadius: radii.hero,
    maxHeight: "78%",
  },
  filterModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,23,42,0.08)",
  },
  filterModalTitle: {
    ...typography.cardTitle,
    fontSize: fontSizes.lg,
  },
  filterModalLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  filterModalLoadingText: {
    ...typography.bodyMuted,
    fontWeight: "700",
  },
  filterModalEmpty: {
    ...typography.bodyMuted,
    textAlign: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  filterModalList: {
    maxHeight: 360,
  },
  filterModalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,23,42,0.06)",
  },
  filterModalRowSelected: {
    backgroundColor: "rgba(220,252,231,0.35)",
  },
  filterModalRowPressed: { opacity: 0.9 },
  filterModalRowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 0,
  },
  filterModalRowLabel: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.text,
  },
  filterModalRowLogo: {
    flexShrink: 0,
  },
  filterModalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  filterModalSecondaryBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.round,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.22)",
    backgroundColor: colors.white,
  },
  filterModalSecondaryText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.successDark,
  },
  filterModalPrimaryBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.round,
    alignItems: "center",
    backgroundColor: colors.successDark,
  },
  filterModalPrimaryText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.white,
  },
  filterModalBtnPressed: { opacity: 0.9 },
  cityCompanyRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.sm,
  },
  cityField: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.14)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cityFieldFull: {
    flex: 1,
  },
  carCompanyField: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.14)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  myCityValue: {
    ...typography.body,
    fontWeight: "800",
    flex: 1,
    flexShrink: 1,
    textDecorationLine: "underline",
    textDecorationColor: colors.text,
  },
  resetBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.round,
    backgroundColor: colors.successMuted,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.2)",
  },
  resetBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.successDark,
  },
  centerBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
    gap: spacing.lg,
  },
  inlineLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  inlineLoadingText: {
    ...typography.bodyMuted,
    fontWeight: "700",
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: "center",
  },
  retryBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.round,
    backgroundColor: colors.primaryMutedBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  emptyTitle: {
    ...typography.cardTitle,
    fontSize: fontSizes.lg,
    textAlign: "center",
  },
  emptySubtitle: {
    ...typography.bodyMuted,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.hero,
    overflow: "hidden",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
    ...cardChrome,
  },
  heroBlock: {
    height: 150,
    backgroundColor: colors.bg,
    overflow: "hidden",
  },
  heroImage: { width: "100%", height: "100%" },
  heroFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,245,249,0.9)",
  },
  cardBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  cardBodyPressed: { opacity: 0.95 },
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
    backgroundColor: "rgba(220,252,231,0.65)",
    borderWidth: 0,
  },
  logoThumbImage: {
    width: "100%",
    height: "100%",
  },
  logoThumbFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(220,252,231,0.65)",
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
    marginTop: 4,
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
  favBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  favBtnActive: {
    backgroundColor: "rgba(239,68,68,0.08)",
    borderColor: "transparent",
  },
  favBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  ratingLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  ratingValue: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.text,
    marginRight: 2,
  },
  stars: { flexDirection: "row", alignItems: "center", gap: 1 },
  ratingMeta: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
  },
  ratingMetaMuted: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
  },
  statusLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  openDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  openDotOpen: { backgroundColor: colors.successDark },
  openDotClosed: { backgroundColor: colors.textMuted },
  statusOpen: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    borderBottomWidth: 1,
    borderBottomColor: colors.successDark,
  },
  statusOpenOpen: { color: colors.successDark },
  statusOpenClosed: { color: colors.textMuted },
  statusDot: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  statusMeta: {
    flexShrink: 1,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
  },
  expandToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(22,101,52,0.14)",
    backgroundColor: "rgba(220,252,231,0.65)",
  },
  expandToggleText: {
    fontSize: cardFontSizes.xs,
    fontWeight: "800",
    color: colors.successDark,
    letterSpacing: 0.3,
  },
});
