import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";
import {
  normalizeVehicleList,
  vehicleTitle,
  type UserVehiclesResponse,
  type Vehicle,
} from "@/components/car-owner/my-vehicles/user-vehicles";
import { VehicleImageViewerModal } from "@/components/car-owner/my-vehicles/vehicle-image-viewer-modal";
import { ChevronLabelBar, useToast } from "@/components/reusables";
import { cardFontSizes, colors, fontSizes, radii, shadows, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useCarOwnerJobCards } from "@/hooks/use-car-owner-job-cards";
import { useCarOwnerJobCardApprovals } from "@/hooks/use-car-owner-job-card-approvals";
import { useCarOwnerInvoices, type CarOwnerInvoiceRow } from "@/hooks/use-car-owner-invoices";
import { useSidebarUser } from "@/hooks/use-sidebar-user";
import { getJson } from "@/lib/api";
import {
  fetchCarOwnerJobCardById,
  isCarOwnerJobCardPendingApproval,
  resolveCarOwnerJobCardForViewer,
} from "@/lib/car-owner-job-cards";
import { formatCurrencyAmount } from "@/lib/currency";
import { formatStoredNationalPhone } from "@/lib/dial-countries";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import type { CarOwnerJobCard } from "@/types/car-owner-job-cards";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatMoneyDecimal(amount: unknown, countryCode: string | null | undefined): string {
  return formatCurrencyAmount(amount as number | string | null | undefined, countryCode, {
    fallback: "—",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatMoneyPlain(amount: unknown, countryCode: string | null | undefined): string {
  return formatCurrencyAmount(amount as number | string | null | undefined, countryCode, { fallback: "—" });
}

function businessLocationLabel(business: CarOwnerJobCard["business"] | undefined): string {
  if (!business || typeof business === "string") return "";
  const city =
    typeof business.city === "string"
      ? business.city
      : typeof business.cityName === "string"
        ? business.cityName
        : "";
  return city.trim();
}

function jobChipLabel(jc: CarOwnerJobCard): string {
  const jobNo = jc.jobNo?.trim();
  if (!jobNo) return "Job";
  return jobNo.toLowerCase().startsWith("job") ? jobNo : `Job #${jobNo}`;
}

function resolveCustomerInfo(
  jc: CarOwnerJobCard,
  fallbackName: string,
  fallbackPhone: string
): { name: string; phone: string; location: string } {
  const raw = jc.customerId as unknown;
  if (raw && typeof raw === "object") {
    const c = raw as Record<string, unknown>;
    const name = typeof c.name === "string" ? c.name.trim() : fallbackName;
    const phoneRaw = typeof c.phone === "string" ? c.phone.trim() : fallbackPhone;
    const phone = phoneRaw ? formatStoredNationalPhone(phoneRaw) || phoneRaw : "";
    const location =
      (typeof c.city === "string" ? c.city.trim() : "") ||
      (typeof c.address === "string" ? c.address.trim() : "");
    return { name: name || "—", phone, location };
  }
  return {
    name: fallbackName || "—",
    phone: fallbackPhone ? formatStoredNationalPhone(fallbackPhone) || fallbackPhone : "",
    location: "",
  };
}

function safeDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function jobCardNoLabel(jc: CarOwnerJobCard): string {
  const no = jc.jobNo?.trim();
  if (no) return no;
  return "—";
}

function jobCardServiceName(service: CarOwnerJobCard["services"][number]["service"]): string {
  if (typeof service === "string") return service.trim();
  const name = service?.name;
  return typeof name === "string" ? name.trim() : "";
}

function serviceTypeLabel(jc: CarOwnerJobCard): string {
  const fromServices = jc.services
    ?.map((s) => jobCardServiceName(s.service))
    .filter((name): name is string => Boolean(name));
  if (fromServices?.length) return fromServices.join(", ");
  const direct = jc.serviceType?.trim();
  if (direct) return direct;
  return jobCardNoLabel(jc);
}

function vehicleBarLabel(v: Vehicle | null): string {
  if (!v) return "All";
  const plate = v.licensePlateNo?.trim();
  if (plate) return plate.toUpperCase();
  return vehicleTitle(v);
}

function jobCardPlateLabel(jc: CarOwnerJobCard): string {
  const plate = jc.vehicleId?.licensePlateNo?.trim();
  return plate ? plate.toUpperCase() : "";
}

function jobCardImagePaths(jc: CarOwnerJobCard): string[] {
  const raw: string[] = [];
  for (const p of jc.vehiclePhotos ?? []) {
    if (typeof p === "string" && p.trim()) raw.push(p.trim());
  }
  for (const p of jc.images ?? []) {
    if (typeof p === "string" && p.trim()) raw.push(p.trim());
  }
  for (const p of jc.vehicleId?.carImages ?? []) {
    if (typeof p === "string" && p.trim()) raw.push(p.trim());
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of raw) {
    if (!seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
  }
  return out;
}

function jobCardImageUris(jc: CarOwnerJobCard): string[] {
  return jobCardImagePaths(jc)
    .map((p) => normalizeMediaUrl(p))
    .filter((uri): uri is string => Boolean(uri));
}

function isPendingEstimate(jc: CarOwnerJobCard): boolean {
  return isCarOwnerJobCardPendingApproval(jc);
}

function businessPhoneRaw(business: CarOwnerJobCard["business"] | undefined): string {
  if (!business || typeof business === "string") return "";
  return business.businessPhone?.trim() || business.phone?.trim() || "";
}

function vehicleMakeModelLabel(vehicle: CarOwnerJobCard["vehicleId"] | undefined): string {
  if (!vehicle?.make) return "";
  const make = vehicle.make.name?.trim() ?? "";
  const model = vehicle.make.model?.trim() ?? "";
  return [make, model].filter(Boolean).join(" ");
}

function formatKm(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(n)) return "0";
  return Math.round(n).toLocaleString();
}

function parseLabourHours(jc: CarOwnerJobCard): number | undefined {
  const raw = jc as Record<string, unknown>;
  const direct = raw.labourHours ?? raw.labourHour ?? raw.labourDuration ?? raw.laborDuration;
  if (typeof direct === "number" && direct > 0) return direct;
  if (typeof direct === "string") {
    const n = Number(direct);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const notes = `${jc.additionalNotes ?? ""} ${jc.technicalRemarks ?? ""}`;
  const match = /labour:\s*(\d+(?:\.\d+)?)\s*hr/i.exec(notes);
  if (match) {
    const n = Number(match[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
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

function monthSectionLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Older";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
}

function vehicleFilterLabel(v: Vehicle): string {
  const title = vehicleTitle(v);
  const plate = v.licensePlateNo?.trim();
  if (plate) return `${title} · ${plate}`;
  return title;
}

const ALL_VEHICLES_ID = "__all__";
const COLLAPSED_ROW_HEIGHT = 96;
const COLLAPSED_THUMB_WIDTH = 88;

function JobCardThumb({ uri, onPress }: { uri: string | null; onPress?: () => void }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(uri) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const content = (
    <>
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={120}
          onError={() => setFailed(true)}
        />
      ) : (
        <Ionicons name="car-sport-outline" size={26} color={colors.successDark} />
      )}
    </>
  );

  if (showImage && onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={styles.collapsedThumb}
        accessibilityRole="imagebutton"
        accessibilityLabel="View vehicle photos"
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.collapsedThumb}>{content}</View>;
}

export default function CarOwnerServiceHistory() {
  const { showToast } = useToast();
  const { token, meta } = useAuth();
  const { userName, userPhone } = useSidebarUser();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false);

  const { items, loading, error, refresh, approveJobCard, rejectJobCard } =
    useCarOwnerJobCards(selectedVehicleId);
  const { acting, approveMany, rejectMany } = useCarOwnerJobCardApprovals();
  const {
    loading: invoicesLoading,
    error: invoicesError,
    refresh: refreshInvoices,
    invoiceRows,
    paidInvoices,
    unpaidInvoices,
    findJobCardById,
  } = useCarOwnerInvoices();
  const insets = useSafeAreaInsets();
  const [mainSegment, setMainSegment] = useState<"jobcards" | "invoices">("jobcards");
  const [invoicePaidTab, setInvoicePaidTab] = useState<"paid" | "unpaid">("unpaid");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadVehicles = useCallback(async () => {
    if (!token) {
      setVehicles([]);
      setVehiclesLoading(false);
      return;
    }
    setVehiclesLoading(true);
    const res = await getJson<UserVehiclesResponse>("/api/user/vehicles", { authToken: token });
    if (!res.ok || !res.data) {
      setVehicles([]);
      setVehiclesLoading(false);
      return;
    }
    setVehicles(normalizeVehicleList(res.data).filter((v) => !v.disabled));
    setVehiclesLoading(false);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setViewerJob(null);
        setActionById({});
        setActionErrorById({});
      };
    }, [])
  );

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const vehicleOptions = useMemo(
    () => vehicles.map((v) => ({ id: v.id, label: vehicleFilterLabel(v) })),
    [vehicles]
  );

  const vehicleCarouselItems = useMemo(
    () => [
      { id: null as string | null, label: "All" },
      ...vehicles.map((v) => ({ id: v.id, label: vehicleBarLabel(v) })),
    ],
    [vehicles]
  );

  const vehicleCarouselIndex = useMemo(() => {
    if (!selectedVehicleId) return 0;
    const idx = vehicleCarouselItems.findIndex((item) => item.id === selectedVehicleId);
    return idx >= 0 ? idx : 0;
  }, [selectedVehicleId, vehicleCarouselItems]);

  const currentVehicleBarLabel = vehiclesLoading
    ? "Loading…"
    : (vehicleCarouselItems[vehicleCarouselIndex]?.label ?? "All");

  const canCycleVehicles = vehicleCarouselItems.length > 1;

  const cycleVehicle = useCallback(
    (delta: number) => {
      if (!canCycleVehicles) return;
      const next =
        (vehicleCarouselIndex + delta + vehicleCarouselItems.length) % vehicleCarouselItems.length;
      setSelectedVehicleId(vehicleCarouselItems[next]?.id ?? null);
    },
    [canCycleVehicles, vehicleCarouselIndex, vehicleCarouselItems]
  );

  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [viewerJob, setViewerJob] = useState<CarOwnerJobCard | null>(null);
  const [actionById, setActionById] = useState<Record<string, "approve" | "reject" | null>>({});
  const [actionErrorById, setActionErrorById] = useState<Record<string, string | null>>({});
  const [imageViewer, setImageViewer] = useState<{ title: string; uris: string[] } | null>(null);

  const openJobCardImages = useCallback((title: string, uris: string[]) => {
    if (uris.length === 0) return;
    setImageViewer({ title, uris });
  }, []);

  const closeViewer = useCallback(() => {
    setViewerJob(null);
  }, []);

  const openViewer = useCallback(
    async (jc: CarOwnerJobCard) => {
      setActionErrorById((prev) => ({ ...prev, [jc._id]: null }));
      setViewerJob(jc);
      if (!token) return;
      try {
        const res = await fetchCarOwnerJobCardById(token, jc._id);
        if (res.ok) {
          const detailed = resolveCarOwnerJobCardForViewer(res.data, jc);
          if (detailed) setViewerJob(detailed);
        }
      } catch {
        // Keep list payload if detail fetch fails.
      }
    },
    [token]
  );

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const pendingSelectedIds = useMemo(
    () =>
      selectedIds.filter((id) => {
        const jc = items.find((row) => row._id === id);
        return jc ? isPendingEstimate(jc) : false;
      }),
    [items, selectedIds]
  );

  const onBatchApprove = useCallback(async () => {
    if (pendingSelectedIds.length === 0) {
      showToast("Select pending estimates to approve.", { type: "info" });
      return;
    }
    const result = await approveMany(pendingSelectedIds);
    showToast(result.message, { type: result.ok ? "success" : "error" });
    if (result.ok) {
      setSelectedIds([]);
      await refresh();
      await refreshInvoices();
    }
  }, [approveMany, pendingSelectedIds, refresh, refreshInvoices, showToast]);

  const onBatchDiscard = useCallback(async () => {
    if (pendingSelectedIds.length === 0) {
      showToast("Select pending estimates to discard.", { type: "info" });
      return;
    }
    const result = await rejectMany(pendingSelectedIds);
    showToast(result.message, { type: result.ok ? "success" : "error" });
    if (result.ok) {
      setSelectedIds([]);
      await refresh();
      await refreshInvoices();
    }
  }, [pendingSelectedIds, refresh, refreshInvoices, rejectMany, showToast]);

  const openInvoiceViewer = useCallback(
    async (row: CarOwnerInvoiceRow) => {
      const fromList = findJobCardById(row.id);
      if (fromList) {
        await openViewer(fromList);
        return;
      }
      if (!token) return;
      try {
        const res = await fetchCarOwnerJobCardById(token, row.id);
        if (res.ok) {
          const detailed = resolveCarOwnerJobCardForViewer(res.data, null);
          if (detailed) setViewerJob(detailed);
        }
      } catch {
        // Ignore detail fetch failures for invoice rows without cache.
      }
    },
    [findJobCardById, openViewer, token]
  );

  const onCallShop = useCallback(
    (jc: CarOwnerJobCard) => {
      const raw = businessPhoneRaw(jc.business);
      if (!raw) {
        showToast("No phone number on file.", { type: "info" });
        return;
      }
      const tel = raw.replace(/\s/g, "");
      Linking.openURL(`tel:${tel}`).catch(() => showToast("Could not start a call.", { type: "error" }));
    },
    [showToast]
  );

  const filteredItems = items.filter((jc) => {
    if (activeTab === "all") return true;
    const v = (jc.status ?? "").toLowerCase();
    if (activeTab === "rejected") return v.includes("reject") || v.includes("cancel");
    if (activeTab === "approved") return v.includes("approve") || v.includes("complete") || v.includes("done");
    return !v.includes("reject") && !v.includes("cancel") && !v.includes("approve") && !v.includes("complete") && !v.includes("done");
  });

  const sortedForUi = [...filteredItems].sort((a, b) => {
    const at = Date.parse(a.createdAt);
    const bt = Date.parse(b.createdAt);
    if (Number.isFinite(at) && Number.isFinite(bt)) return bt - at;
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });

  const sections = sortedForUi.reduce<Record<string, typeof items>>((acc, jc) => {
    const key = monthSectionLabel(jc.createdAt);
    acc[key] = acc[key] ? [...acc[key], jc] : [jc];
    return acc;
  }, {});

  const visibleInvoiceRows = invoicePaidTab === "paid" ? paidInvoices : unpaidInvoices;

  const sectionKeys = Object.keys(sections);

  return (
    <CarOwnerStackScreenFrame
      title="Expenses"
      scroll={false}
      bodyStyle={styles.frameBodyNoPadding}
      contentContainerStyle={styles.frameBodyNoPadding}
      right={
        <Pressable
          hitSlop={10}
          onPress={() => {
            void loadVehicles();
            void refresh();
            void refreshInvoices();
          }}
          style={styles.headerIconBtn}
        >
          <Ionicons name="refresh" size={20} color={colors.successDark} />
        </Pressable>
      }
    >
      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading || vehiclesLoading || invoicesLoading}
            onRefresh={() => {
              void loadVehicles();
              void refresh();
              void refreshInvoices();
            }}
            tintColor={colors.successDark}
          />
        }
      >
        <View style={styles.segmentRow}>
          {([
            { id: "jobcards" as const, label: "Job cards" },
            { id: "invoices" as const, label: "Invoices" },
          ]).map((seg) => {
            const active = mainSegment === seg.id;
            return (
              <Pressable
                key={seg.id}
                onPress={() => setMainSegment(seg.id)}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{seg.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {mainSegment === "jobcards" ? (
          <>
            <ChevronLabelBar
              label={currentVehicleBarLabel}
              bordered
              edgeAligned
              style={styles.vehicleChevronBar}
              onPrevious={canCycleVehicles ? () => cycleVehicle(-1) : undefined}
              onNext={canCycleVehicles ? () => cycleVehicle(1) : undefined}
              onPressLabel={() => setVehiclePickerOpen(true)}
            />

            {pendingSelectedIds.length > 0 ? (
              <View style={styles.batchBar}>
                <Text style={styles.batchBarText}>{pendingSelectedIds.length} selected</Text>
                <View style={styles.batchBarActions}>
                  <Pressable
                    disabled={acting}
                    onPress={() => void onBatchApprove()}
                    style={[styles.batchApproveBtn, acting && styles.actionBtnDisabled]}
                  >
                    <Text style={styles.batchBtnText}>Approve</Text>
                  </Pressable>
                  <Pressable
                    disabled={acting}
                    onPress={() => void onBatchDiscard()}
                    style={[styles.batchDiscardBtn, acting && styles.actionBtnDisabled]}
                  >
                    <Text style={styles.batchBtnText}>Discard</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {error ? (
              <View style={styles.centerBlock}>
                <Ionicons name="cloud-offline-outline" size={44} color={colors.textLight} />
                <Text style={styles.emptyTitle}>Couldn’t load job cards</Text>
                <Text style={styles.emptySubtitle}>{error}</Text>
                <Pressable onPress={refresh} style={styles.retryBtn} android_ripple={{ color: "rgba(22,101,52,0.12)" }}>
                  <Ionicons name="refresh-outline" size={18} color={colors.successDark} />
                  <Text style={styles.retryBtnText}>Try again</Text>
                </Pressable>
              </View>
            ) : loading && items.length === 0 ? (
              <View style={styles.centerBlock}>
                <ActivityIndicator color={colors.successDark} />
                <Text style={styles.emptySubtitle}>Loading your job cards…</Text>
              </View>
            ) : items.length === 0 ? (
              <View style={styles.centerBlock}>
                <Ionicons name="time-outline" size={44} color={colors.textLight} />
                <Text style={styles.emptyTitle}>
                  {selectedVehicleId ? "No job cards for this vehicle" : "No job cards yet"}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {selectedVehicleId
                    ? "Try another vehicle or view all vehicles."
                    : "Pending and completed job cards will show up here."}
                </Text>
              </View>
            ) : sortedForUi.length === 0 ? (
              <View style={styles.centerBlock}>
                <Ionicons name="document-text-outline" size={44} color={colors.textLight} />
                <Text style={styles.emptyTitle}>No {activeTab} services</Text>
                <Text style={styles.emptySubtitle}>There are no services in this category.</Text>
              </View>
            ) : (
              <View style={{ gap: spacing.lg }}>
                {sectionKeys.map((key) => (
                  <View key={key} style={{ gap: spacing.md }}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionHeader}>{key}</Text>
                      <View style={styles.sectionHeaderRule} />
                    </View>

                    {sections[key]?.map((jc) => {
                      const isPending = isPendingEstimate(jc);
                      const serviceLabel = serviceTypeLabel(jc);
                      const dateLabel = safeDateLabel(jc.createdAt);
                      const plateLabel = jobCardPlateLabel(jc);
                      const imageUris = jobCardImageUris(jc);
                      const thumbUri = imageUris[0] ?? null;
                      const imageViewerTitle = plateLabel || serviceLabel;
                      const openImages = () => openJobCardImages(imageViewerTitle, imageUris);
                      const selected = selectedIds.includes(jc._id);

                      return (
                        <View key={jc._id} style={styles.jobCard}>
                          {isPending ? (
                            <View style={styles.pendingEstimateTag} accessibilityRole="text">
                              <Text style={styles.pendingEstimateTagText}>Pending</Text>
                            </View>
                          ) : null}
                          <View style={styles.collapsedRow}>
                            {isPending ? (
                              <Pressable
                                onPress={() => toggleSelected(jc._id)}
                                hitSlop={8}
                                style={styles.selectHit}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: selected }}
                              >
                                <Ionicons
                                  name={selected ? "checkbox" : "square-outline"}
                                  size={22}
                                  color={colors.successDark}
                                />
                              </Pressable>
                            ) : (
                              <View style={styles.selectHitSpacer} />
                            )}
                            <Pressable
                              onPress={() => void openViewer(jc)}
                              style={({ pressed }) => [
                                styles.collapsedSummary,
                                pressed && styles.collapsedSummaryPressed,
                              ]}
                              accessibilityRole="button"
                              accessibilityLabel="View estimate details"
                            >
                              <JobCardThumb
                                uri={thumbUri}
                                onPress={imageUris.length > 0 ? openImages : undefined}
                              />
                              <View style={styles.collapsedMain}>
                                <View style={styles.serviceTypePill}>
                                  <Text style={styles.serviceTypePillText} numberOfLines={2}>
                                    {serviceLabel}
                                  </Text>
                                </View>
                                {plateLabel ? (
                                  <Text style={styles.collapsedPlate} numberOfLines={1}>
                                    {plateLabel}
                                  </Text>
                                ) : null}
                                {dateLabel ? (
                                  <Text style={styles.collapsedDate} numberOfLines={1}>
                                    {dateLabel}
                                  </Text>
                                ) : null}
                              </View>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.segmentRow}>
              {([
                { id: "unpaid" as const, label: `Unpaid (${unpaidInvoices.length})` },
                { id: "paid" as const, label: `Paid (${paidInvoices.length})` },
              ]).map((tab) => {
                const active = invoicePaidTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setInvoicePaidTab(tab.id)}
                    style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{tab.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {invoicesError ? (
              <View style={styles.centerBlock}>
                <Text style={styles.emptyTitle}>Couldn’t load invoices</Text>
                <Text style={styles.emptySubtitle}>{invoicesError}</Text>
                <Pressable
                  onPress={() => void refreshInvoices()}
                  style={styles.retryBtn}
                  android_ripple={{ color: "rgba(22,101,52,0.12)" }}
                >
                  <Text style={styles.retryBtnText}>Try again</Text>
                </Pressable>
              </View>
            ) : invoicesLoading && invoiceRows.length === 0 ? (
              <View style={styles.centerBlock}>
                <ActivityIndicator color={colors.successDark} />
                <Text style={styles.emptySubtitle}>Loading invoices…</Text>
              </View>
            ) : visibleInvoiceRows.length === 0 ? (
              <View style={styles.centerBlock}>
                <Ionicons name="receipt-outline" size={44} color={colors.textLight} />
                <Text style={styles.emptyTitle}>No {invoicePaidTab} invoices</Text>
                <Text style={styles.emptySubtitle}>Invoices converted from job cards will appear here.</Text>
              </View>
            ) : (
              <View style={{ gap: spacing.md }}>
                {visibleInvoiceRows.map((row) => (
                  <Pressable
                    key={row.id}
                    onPress={() => void openInvoiceViewer(row)}
                    style={({ pressed }) => [styles.invoiceRowCard, pressed && styles.collapsedSummaryPressed]}
                  >
                    <View style={styles.invoiceRowTop}>
                      <Text style={styles.invoiceRowNo}>{row.invoiceNo}</Text>
                      <Text style={styles.invoiceRowAmount}>
                        {formatMoneyPlain(row.amount, meta?.countryCode)}
                      </Text>
                    </View>
                    <Text style={styles.invoiceRowMeta} numberOfLines={1}>
                      {[row.shopName, row.vehicle, row.plate].filter(Boolean).join(" · ")}
                    </Text>
                    <Text style={styles.invoiceRowMeta} numberOfLines={1}>
                      Job {row.jobNo}
                      {row.createdAt ? ` · ${safeDateLabel(row.createdAt)}` : ""}
                      {` · ${row.paymentStatus}`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={vehiclePickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setVehiclePickerOpen(false)}
      >
        <Pressable style={styles.vehicleModalBackdrop} onPress={() => setVehiclePickerOpen(false)}>
          <Pressable
            style={[styles.vehicleModalSheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.vehicleModalHeader}>
              <Text style={styles.vehicleModalTitle}>Filter by vehicle</Text>
              <Pressable onPress={() => setVehiclePickerOpen(false)} hitSlop={8} accessibilityLabel="Close">
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            {vehiclesLoading ? (
              <View style={styles.vehicleModalLoading}>
                <ActivityIndicator size="small" color={colors.successDark} />
                <Text style={styles.vehicleModalLoadingText}>Loading vehicles…</Text>
              </View>
            ) : (
              <FlatList
                data={[{ id: ALL_VEHICLES_ID, label: "All vehicles" }, ...vehicleOptions]}
                keyExtractor={(item) => item.id}
                style={styles.vehicleModalList}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const selected =
                    item.id === ALL_VEHICLES_ID ? selectedVehicleId === null : selectedVehicleId === item.id;
                  return (
                    <Pressable
                      onPress={() => {
                        setSelectedVehicleId(item.id === ALL_VEHICLES_ID ? null : item.id);
                        setVehiclePickerOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.vehicleModalRow,
                        selected && styles.vehicleModalRowSelected,
                        pressed && styles.vehicleModalRowPressed,
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <Text style={styles.vehicleModalRowLabel} numberOfLines={2}>
                        {item.label.toUpperCase()}
                      </Text>
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
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={viewerJob != null} transparent animationType="fade" onRequestClose={closeViewer}>
        <View style={styles.viewerBackdrop}>
          <Pressable style={styles.viewerBackdropPress} onPress={closeViewer} />
          {viewerJob ? (
            <View style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <View style={styles.invoiceHeaderLeft}>
                  <Text style={styles.invoiceHeaderTitle}>
                    {typeof viewerJob.business === "string"
                      ? viewerJob.business.trim() || "Auto shop"
                      : viewerJob.business?.businessName?.trim() || "Auto shop"}
                  </Text>
                  <Text style={styles.invoiceHeaderSub}>
                    {businessLocationLabel(viewerJob.business) || "—"}
                  </Text>
                </View>
                <Pressable hitSlop={8} onPress={closeViewer} style={styles.invoiceClose}>
                  <Ionicons name="close" size={18} color={colors.white} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.viewerScroll}
                contentContainerStyle={styles.invoiceContent}
                showsVerticalScrollIndicator={false}
              >
                {(() => {
                  const jc = viewerJob;
                  const customer = resolveCustomerInfo(jc, meta?.name ?? userName ?? "", userPhone ?? "");
                  const dateLabel = safeDateLabel(jc.createdAt);
                  const plate = jobCardPlateLabel(jc);
                  const make = vehicleMakeModelLabel(jc.vehicleId) || "—";
                  const odo = formatKm(jc.odometerReading);
                  const due =
                    Number(jc.dueOdometerReading) > 0 ? formatKm(jc.dueOdometerReading) : "";
                  const totalAmount = jc.totalPayableAmount;
                  const serviceRows = (jc.services ?? []).flatMap((svc, si) =>
                    (svc.subServices ?? []).map((sub, sj) => ({
                      key: `${si}-${sj}`,
                      name: sub.name?.trim() || "—",
                      desc: sub.desc?.trim() ?? "",
                      price: Number(sub.price) || 0,
                    }))
                  );
                  const labourCharge = Number(jc.labourCharge) || 0;
                  const labourHours = parseLabourHours(jc);

                  return (
                    <>
                      <View style={styles.invoiceMetaRow}>
                        <View style={styles.invoiceChip}>
                          <Text style={styles.invoiceChipText}>{jobChipLabel(jc)}</Text>
                        </View>
                        {dateLabel ? (
                          <View style={styles.invoiceChipMuted}>
                            <Text style={styles.invoiceChipMutedText}>{dateLabel}</Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.invoiceInfoGrid}>
                        <View style={styles.invoiceInfoCard}>
                          <Text style={styles.invoiceInfoTitle}>CUSTOMER</Text>
                          <Text style={styles.invoiceInfoMain}>{customer.name}</Text>
                          {customer.phone ? (
                            <Text style={styles.invoiceInfoSub}>{customer.phone}</Text>
                          ) : null}
                          {customer.location ? (
                            <Text style={styles.invoiceInfoSub} numberOfLines={2}>
                              {customer.location}
                            </Text>
                          ) : null}
                        </View>
                        <View style={styles.invoiceInfoCard}>
                          <Text style={styles.invoiceInfoTitle}>VEHICLE</Text>
                          <Text style={styles.invoiceInfoMain}>{make}</Text>
                          {plate ? <Text style={styles.invoiceInfoSub}>{plate}</Text> : null}
                          <View style={styles.invoiceOdoRow}>
                            <View style={styles.invoiceOdoCol}>
                              <Text style={styles.invoiceOdoLabel}>ODO IN</Text>
                              <Text style={styles.invoiceOdoValue}>{odo ? `${odo} km` : "—"}</Text>
                            </View>
                            <View style={styles.invoiceOdoCol}>
                              <Text style={styles.invoiceOdoLabel}>DUE ODO</Text>
                              <Text style={[styles.invoiceOdoValue, styles.invoiceOdoDue]}>
                                {due ? `${due} km` : "—"}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      <View style={styles.invoiceSection}>
                        <Text style={styles.invoiceSectionTitle}>SERVICES</Text>
                        <View style={styles.invoiceTableHead}>
                          <Text style={styles.invoiceThLeft}>Description</Text>
                          <Text style={styles.invoiceThRight}>Amount</Text>
                        </View>
                        <View style={styles.invoiceTableBody}>
                          {serviceRows.length === 0 && labourCharge <= 0 ? (
                            <Text style={styles.invoiceHint}>—</Text>
                          ) : (
                            <>
                              {serviceRows.map((row) => (
                                <View key={row.key} style={styles.invoiceLine}>
                                  <View style={styles.invoiceLineLeft}>
                                    <Text style={styles.invoiceLineName}>{row.name}</Text>
                                    {row.desc ? (
                                      <Text style={styles.invoiceLineDesc}>{row.desc}</Text>
                                    ) : null}
                                  </View>
                                  <Text style={styles.invoiceLineAmt}>{formatMoneyDecimal(row.price, meta?.countryCode)}</Text>
                                </View>
                              ))}
                              {labourCharge > 0 ? (
                                <View style={styles.invoiceLine}>
                                  <View style={styles.invoiceLineLeft}>
                                    <Text style={styles.invoiceLineName}>Labour</Text>
                                    {labourHours ? (
                                      <Text style={styles.invoiceLineDesc}>{labourHours} hr</Text>
                                    ) : null}
                                  </View>
                                  <Text style={styles.invoiceLineAmt}>{formatMoneyDecimal(labourCharge, meta?.countryCode)}</Text>
                                </View>
                              ) : null}
                            </>
                          )}
                        </View>
                      </View>

                      <View style={styles.invoiceTotals}>
                        <View style={styles.invoiceTotalRow}>
                          <Text style={styles.invoiceTotalStrongLabel}>Subtotal Amount</Text>
                          <Text style={styles.invoiceTotalStrongValue}>{formatMoneyPlain(totalAmount, meta?.countryCode)}</Text>
                        </View>
                      </View>
                    </>
                  );
                })()}
              </ScrollView>

              <View style={styles.invoiceFooter}>
                {businessPhoneRaw(viewerJob.business) ? (
                  <Pressable
                    onPress={() => onCallShop(viewerJob)}
                    style={({ pressed }) => [styles.invoiceCallBtn, pressed && styles.actionBtnPressed]}
                    android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                  >
                    <Ionicons name="call-outline" size={18} color={colors.white} />
                    <Text style={styles.invoiceCallBtnText}>Call shop</Text>
                  </Pressable>
                ) : null}

                {isPendingEstimate(viewerJob) ? (
                  <View style={styles.invoiceActionsRow}>
                    <Pressable
                      disabled={Boolean(actionById[viewerJob._id])}
                      onPress={async () => {
                        const id = viewerJob._id;
                        setActionById((prev) => ({ ...prev, [id]: "approve" }));
                        setActionErrorById((prev) => ({ ...prev, [id]: null }));
                        const r = await approveJobCard(id);
                        setActionById((prev) => ({ ...prev, [id]: null }));
                        if (!r.ok) {
                          setActionErrorById((prev) => ({
                            ...prev,
                            [id]: r.error ?? "Could not approve.",
                          }));
                          return;
                        }
                        await refreshInvoices();
                        closeViewer();
                      }}
                      style={({ pressed }) => [
                        styles.pendingActionBtn,
                        styles.pendingApproveBtn,
                        pressed ? styles.actionBtnPressed : null,
                        actionById[viewerJob._id] ? styles.actionBtnDisabled : null,
                      ]}
                      android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                    >
                      <Text style={styles.pendingActionBtnText}>Approve</Text>
                    </Pressable>

                    <Pressable
                      disabled={Boolean(actionById[viewerJob._id])}
                      onPress={async () => {
                        const id = viewerJob._id;
                        setActionById((prev) => ({ ...prev, [id]: "reject" }));
                        setActionErrorById((prev) => ({ ...prev, [id]: null }));
                        const r = await rejectJobCard(id);
                        setActionById((prev) => ({ ...prev, [id]: null }));
                        if (!r.ok) {
                          setActionErrorById((prev) => ({
                            ...prev,
                            [id]: r.error ?? "Could not discard.",
                          }));
                          return;
                        }
                        await refreshInvoices();
                        closeViewer();
                      }}
                      style={({ pressed }) => [
                        styles.pendingActionBtn,
                        styles.pendingDiscardBtn,
                        pressed ? styles.actionBtnPressed : null,
                        actionById[viewerJob._id] ? styles.actionBtnDisabled : null,
                      ]}
                      android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                    >
                      <Text style={styles.pendingActionBtnText}>Discard</Text>
                    </Pressable>
                  </View>
                ) : null}

                {actionErrorById[viewerJob._id] ? (
                  <View style={styles.inlineErrorRow}>
                    <Ionicons name="alert-circle-outline" size={16} color="#991B1B" />
                    <Text style={styles.inlineErrorText}>{actionErrorById[viewerJob._id]}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      </Modal>

      <VehicleImageViewerModal viewer={imageViewer} onRequestClose={() => setImageViewer(null)} />
    </CarOwnerStackScreenFrame>
  );
}

const styles = StyleSheet.create({
  frameBodyNoPadding: {
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  body: { flex: 1, backgroundColor: colors.bgProfile },
  content: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xxl,
  },
  segmentRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.16)",
  },
  segmentBtnActive: {
    backgroundColor: colors.successDark,
    borderColor: colors.successDark,
  },
  segmentText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.successDark,
  },
  segmentTextActive: { color: colors.white },
  batchBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: "rgba(22,101,52,0.08)",
  },
  batchBarText: { fontSize: fontSizes.sm, fontWeight: "800", color: colors.successDark },
  batchBarActions: { flexDirection: "row", gap: spacing.sm },
  batchApproveBtn: {
    backgroundColor: colors.successDark,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  batchDiscardBtn: {
    backgroundColor: "#991B1B",
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  batchBtnText: { color: colors.white, fontWeight: "800", fontSize: fontSizes.sm },
  collapsedRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  selectHit: { paddingHorizontal: 2, paddingVertical: 8 },
  selectHitSpacer: { width: 26 },
  invoiceRowCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.12)",
    gap: 4,
  },
  invoiceRowTop: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  invoiceRowNo: { fontWeight: "900", color: colors.text, fontSize: fontSizes.md },
  invoiceRowAmount: { fontWeight: "900", color: colors.successDark, fontSize: fontSizes.md },
  invoiceRowMeta: { fontSize: fontSizes.xs, fontWeight: "700", color: colors.textMuted },
  vehicleChevronBar: {
    backgroundColor: colors.white,
    marginHorizontal: 0,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.18)",
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
  },
  vehicleModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
  },
  vehicleModalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.hero,
    borderTopRightRadius: radii.hero,
    maxHeight: "78%",
  },
  vehicleModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,23,42,0.08)",
  },
  vehicleModalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.text,
  },
  vehicleModalLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  vehicleModalLoadingText: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textMuted,
  },
  vehicleModalList: {
    maxHeight: 360,
  },
  vehicleModalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,23,42,0.06)",
  },
  vehicleModalRowSelected: {
    backgroundColor: colors.successMuted,
  },
  vehicleModalRowPressed: { opacity: 0.9 },
  vehicleModalRowLabel: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.text,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(15,23,42,0.04)",
    padding: 4,
    borderRadius: radii.xl,
    gap: 4,
    minWidth: "100%",
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    borderRadius: radii.lg,
  },
  tabActive: {
    backgroundColor: colors.white,
    ...shadows.soft,
  },
  tabActivePending: {
    backgroundColor: colors.primaryMutedBg,
  },
  tabActiveApproved: {
    backgroundColor: colors.successMuted,
  },
  tabActiveRejected: {
    backgroundColor: colors.dangerMuted,
  },
  tabText: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.text,
  },
  tabTextActivePending: {
    color: colors.primaryDark,
  },
  tabTextActiveApproved: {
    color: colors.successDark,
  },
  tabTextActiveRejected: {
    color: "#991B1B",
  },
  screenIntro: {
    ...typography.bodyMuted,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.18)",
  },

  centerBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
    gap: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
  },
  emptySubtitle: {
    ...typography.bodyMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.round,
    backgroundColor: colors.successMuted,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.2)",
  },
  retryBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.successDark,
  },

  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  sectionHeader: {
    fontSize: cardFontSizes.xs,
    fontWeight: "900",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionHeaderRule: { flex: 1, height: 1, backgroundColor: "rgba(15,23,42,0.08)" },

  jobCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    ...cardChrome,
  },
  pendingEstimateTag: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 2,
    backgroundColor: colors.warningMuted,
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  pendingEstimateTagText: {
    fontSize: cardFontSizes.tiny,
    fontWeight: "800",
    color: "#9A5B11",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  collapsedSummary: {
    flexDirection: "row",
    height: COLLAPSED_ROW_HEIGHT,
    alignItems: "stretch",
  },
  collapsedSummaryPressed: {
    opacity: 0.96,
  },
  collapsedThumb: {
    width: COLLAPSED_THUMB_WIDTH,
    height: COLLAPSED_ROW_HEIGHT,
    overflow: "hidden",
    backgroundColor: colors.successMuted,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(22,101,52,0.12)",
  },
  collapsedMain: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  serviceTypePill: {
    backgroundColor: colors.successDark,
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.round,
    maxWidth: "100%",
    alignSelf: "center",
  },
  serviceTypePillText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  collapsedDate: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
  },
  collapsedPlate: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.successDark,
    letterSpacing: 0.4,
    textAlign: "center",
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.screenHorizontal,
  },
  viewerBackdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  invoiceCard: {
    width: "100%",
    height: "88%",
    minHeight: 260,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    overflow: "hidden",
    ...shadows.card,
  },
  invoiceHeader: {
    backgroundColor: colors.successDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  invoiceHeaderLeft: { flex: 1, minWidth: 0 },
  invoiceHeaderTitle: { color: colors.white, fontSize: fontSizes.xl, fontWeight: "900" },
  invoiceHeaderSub: { color: "rgba(255,255,255,0.9)", fontSize: fontSizes.sm, fontWeight: "800", marginTop: 2 },
  invoiceClose: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  viewerScroll: { flex: 1 },
  invoiceContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },
  invoiceMetaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  invoiceChip: {
    backgroundColor: colors.successDark,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.round,
  },
  invoiceChipText: { color: colors.white, fontSize: fontSizes.sm, fontWeight: "900" },
  invoiceChipMuted: {
    backgroundColor: colors.successMuted,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.14)",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.round,
  },
  invoiceChipMutedText: { color: colors.successDark, fontSize: fontSizes.sm, fontWeight: "800" },
  invoiceInfoGrid: { flexDirection: "row", gap: spacing.sm },
  invoiceInfoCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.14)",
    padding: spacing.md,
    gap: 4,
  },
  invoiceInfoTitle: { fontSize: 11, fontWeight: "900", color: colors.successDark, letterSpacing: 0.5 },
  invoiceInfoMain: { fontSize: fontSizes.md, fontWeight: "900", color: colors.text },
  invoiceInfoSub: { fontSize: fontSizes.xs, fontWeight: "700", color: colors.textMuted },
  invoiceOdoRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  invoiceOdoCol: { gap: 2 },
  invoiceOdoLabel: { fontSize: 10, fontWeight: "900", color: colors.textMuted, letterSpacing: 0.4 },
  invoiceOdoValue: { fontSize: fontSizes.sm, fontWeight: "900", color: colors.text },
  invoiceOdoDue: { color: colors.warning },
  invoiceSection: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.14)",
    overflow: "hidden",
  },
  invoiceSectionTitle: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    fontSize: fontSizes.sm,
    fontWeight: "900",
    color: colors.textMuted,
  },
  invoiceTableHead: {
    flexDirection: "row",
    backgroundColor: colors.successDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  invoiceThLeft: { flex: 1, color: colors.white, fontSize: fontSizes.sm, fontWeight: "900" },
  invoiceThRight: { width: 110, textAlign: "right", color: colors.white, fontSize: fontSizes.sm, fontWeight: "900" },
  invoiceTableBody: { padding: spacing.md, gap: spacing.sm },
  invoiceHint: { fontSize: fontSizes.xs, color: colors.textMuted, fontWeight: "700" },
  invoiceLine: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  invoiceLineLeft: { flex: 1, minWidth: 0, gap: 2 },
  invoiceLineName: { fontSize: fontSizes.sm, fontWeight: "900", color: colors.text },
  invoiceLineDesc: { fontSize: fontSizes.xs, fontWeight: "700", color: colors.textMuted },
  invoiceLineAmt: { width: 110, textAlign: "right", fontSize: fontSizes.sm, fontWeight: "900", color: colors.text },
  invoiceTotals: {
    backgroundColor: colors.successMuted,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(22,101,52,0.18)",
    padding: spacing.md,
  },
  invoiceTotalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  invoiceTotalStrongLabel: { color: colors.successDark, fontSize: fontSizes.md, fontWeight: "900" },
  invoiceTotalStrongValue: { color: colors.successDark, fontSize: fontSizes.lg, fontWeight: "900" },
  invoiceFooter: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(22,101,52,0.14)",
    backgroundColor: colors.white,
  },
  invoiceCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radii.xl,
    backgroundColor: colors.successDark,
  },
  invoiceCallBtnText: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 0.2,
  },
  invoiceActionsRow: { flexDirection: "row", gap: spacing.md },
  pendingActionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: radii.xl,
  },
  pendingApproveBtn: {
    backgroundColor: colors.successDark,
  },
  pendingDiscardBtn: {
    backgroundColor: colors.danger,
  },
  pendingActionBtnText: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 0.2,
  },
  actionBtnPressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  actionBtnDisabled: { opacity: 0.55 },
  inlineErrorRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.sm },
  inlineErrorText: { fontSize: cardFontSizes.sm, fontWeight: "800", color: "#991B1B", flex: 1, lineHeight: 18 },
});

