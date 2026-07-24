import { Fab, Pill, StackScreenFrame, SurfaceCard, useToast } from "@/components/reusables";
import { ShopDealEditorForm, formModeForSection, formSectionForActive } from "@/components/shop-owner/shop-deal-editor-form";
import { ShopOwnerDealCard } from "@/components/shop-owner/shop-owner-deal-card";
import { cardFontSizes, cardTypography, colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { customerKey, parseMyCustomersFromApiPayload } from "@/hooks/use-my-customers";
import { dealId, useMyDeals } from "@/hooks/use-my-deals";
import { useOncePress } from "@/hooks/use-once-press";
import { fetchAddedCustomers } from "@/lib/autoshopowner-api";
import { updateAutoshopDeal } from "@/lib/autoshopowner-deals-api";
import {
  applyDealSales,
  isDealSold,
  removeDealSale,
  writeDealSale,
} from "@/lib/shop-deal-sales";
import { dealToFormFields, dealModeOf, type DealBoardSectionId } from "@/lib/shop-deal-form";
import { isSalvagesDeal } from "@/lib/shop-owner-parsers";
import type { MyCustomer, ShopDeal } from "@/types/auto-shop-owner-endpoints";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  InteractionManager,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type DealSectionId = DealBoardSectionId | "completed";

const DEAL_SECTIONS: { id: DealSectionId; label: string }[] = [
  { id: "parts", label: "Spare Parts" },
  { id: "service", label: "Service" },
  { id: "salvage", label: "Salvages" },
  { id: "completed", label: "Completed" },
];

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

function isSalvageDeal(deal: ShopDeal): boolean {
  if (isSalvagesDeal(deal)) return true;
  const haystack = [deal.productName, deal.partName, deal.description, deal.dealType, deal.service?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\bsalvage/i.test(haystack);
}

function customerDisplayName(customer: MyCustomer): string {
  return customer.name?.trim() || customer.phone?.trim() || "Customer";
}

export default function DealsPage() {
  const router = useRouter();
  const { token, meta } = useAuth();
  const { showToast } = useToast();
  const isAutoShopOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";
  const { deals: rawDeals, loading, loadDeals, removeDeal } = useMyDeals(
    token,
    isAutoShopOwner,
    showToast
  );

  const [activeId, setActiveId] = useState<DealSectionId>("parts");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<ShopDeal | null>(null);
  const [formMode, setFormMode] = useState<"service" | "parts">("parts");
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set());
  const [deactivatingIds, setDeactivatingIds] = useState<Set<string>>(() => new Set());
  const [customers, setCustomers] = useState<MyCustomer[]>([]);
  const [soldDraftIds, setSoldDraftIds] = useState<Record<string, string>>({});
  const [sellingDealId, setSellingDealId] = useState<string | null>(null);
  const [salesRevision, setSalesRevision] = useState(0);

  const formSection = formSectionForActive(activeId, editingDeal);

  const loadCustomers = useCallback(async () => {
    if (!token || !isAutoShopOwner) {
      setCustomers([]);
      return;
    }
    try {
      const res = await fetchAddedCustomers(token, "approved");
      if (!res.ok) {
        setCustomers([]);
        return;
      }
      setCustomers(parseMyCustomersFromApiPayload(res.data));
    } catch {
      setCustomers([]);
    }
  }, [isAutoShopOwner, token]);

  useFocusEffect(
    useCallback(() => {
      void loadDeals();
      void loadCustomers();
      return undefined;
    }, [loadCustomers, loadDeals])
  );

  useEffect(() => {
    setSheetOpen(false);
    setEditingDeal(null);
    setSoldDraftIds({});
    setExpandedDealId(null);
  }, [activeId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    InteractionManager.runAfterInteractions(() =>
      void (async () => {
        try {
          await Promise.all([loadDeals(), loadCustomers()]);
        } finally {
          setRefreshing(false);
        }
      })()
    );
  }, [loadCustomers, loadDeals]);

  const dealsWithSales = useMemo(
    () => applyDealSales(rawDeals as ShopDeal[]),
    // salesRevision forces re-apply of session-local sales
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawDeals, salesRevision]
  );

  const deals = useMemo(() => {
    if (activeId === "completed") return dealsWithSales.filter(isDealSold);
    const activeDeals = dealsWithSales.filter((deal) => !isDealSold(deal));
    if (activeId === "salvage") return activeDeals.filter(isSalvageDeal);
    if (activeId === "parts") {
      return activeDeals.filter((d) => dealModeOf(d) === "parts" && !isSalvageDeal(d));
    }
    return activeDeals.filter((d) => dealModeOf(d) === "service");
  }, [activeId, dealsWithSales]);

  const dealsBackTo = "/(shop-owner)/deals";
  const canAddNew = activeId !== "completed";
  const showSell = activeId === "parts" || activeId === "salvage" || activeId === "completed";

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

  const toggleDealExpanded = useCallback((id: string) => {
    setExpandedDealId((cur) => (cur === id ? null : id));
  }, []);

  const openCreate = useOncePress(() => {
    if (activeId === "completed") return;
    setEditingDeal(null);
    setFormMode(formModeForSection(activeId));
    setSheetOpen(true);
  });

  const openEdit = useOncePress((d: ShopDeal) => {
    setEditingDeal(d);
    setFormMode(dealModeOf(d));
    setSheetOpen(true);
  });

  const closeForm = useCallback(() => {
    setSheetOpen(false);
    setEditingDeal(null);
  }, []);

  const confirmDelete = useCallback(
    (d: ShopDeal) => {
      const id = dealId(d);
      if (!id) return;
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
                removeDealSale(id);
                setSalesRevision((n) => n + 1);
                setExpandedDealId((cur) => (cur === id ? null : cur));
              }
            })();
          },
        },
      ]);
    },
    [removeDeal]
  );

  const confirmDeactivate = useCallback(
    (d: ShopDeal) => {
      if (!token) return;
      const id = dealId(d);
      if (!id || d.dealEnabled === false) return;
      Alert.alert("Mark non-active?", "This deal will be marked as non-active.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Non-Active",
          onPress: () => {
            void (async () => {
              setDeactivatingIds((prev) => new Set(prev).add(id));
              try {
                const res = await updateAutoshopDeal(
                  token,
                  id,
                  dealToFormFields(d, { dealEnabled: "false" })
                );
                if (!res.ok) {
                  showToast("Could not mark deal non-active.", { type: "error" });
                  return;
                }
                showToast("Marked as non-active.", { type: "success" });
                await loadDeals();
              } catch {
                showToast("Network error.", { type: "error" });
              } finally {
                setDeactivatingIds((prev) => {
                  const next = new Set(prev);
                  next.delete(id);
                  return next;
                });
              }
            })();
          },
        },
      ]);
    },
    [loadDeals, showToast, token]
  );

  const handleSellDeal = useCallback(
    async (deal: ShopDeal) => {
      if (!token) return;
      const id = dealId(deal);
      const customerId = soldDraftIds[id]?.trim();
      if (!id || !customerId) {
        showToast("Select a customer before selling.", { type: "info" });
        return;
      }
      const customer = customers.find((row) => customerKey(row) === customerId);
      if (!customer) {
        showToast("Selected customer was not found.", { type: "error" });
        return;
      }
      const customerName = customerDisplayName(customer);
      Alert.alert("Mark as sold?", `Mark this deal as sold to ${customerName}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sell",
          onPress: () => {
            void (async () => {
              setSellingDealId(id);
              const soldAt = new Date().toISOString();
              const applyLocalSale = () => {
                writeDealSale(id, { customerId, customerName, soldAt });
                setSalesRevision((n) => n + 1);
                setSoldDraftIds((prev) => {
                  const next = { ...prev };
                  delete next[id];
                  return next;
                });
              };
              try {
                await updateAutoshopDeal(
                  token,
                  id,
                  dealToFormFields(deal, {
                    dealEnabled: "false",
                    soldToCustomerId: customerId,
                    soldToCustomerName: customerName,
                  })
                );
                applyLocalSale();
                await loadDeals();
                showToast(`Sold to ${customerName}.`, { type: "success" });
              } catch {
                applyLocalSale();
                await loadDeals();
                showToast(`Sold to ${customerName}.`, { type: "success" });
              } finally {
                setSellingDealId(null);
              }
            })();
          },
        },
      ]);
    },
    [customers, loadDeals, showToast, soldDraftIds, token]
  );

  const pageTitle =
    activeId === "completed"
      ? "Completed Deals"
      : activeId === "salvage"
        ? "Salvages"
        : activeId === "service"
          ? "Service Deals"
          : "Spare Part Deals";

  return (
    <>
      <StackScreenFrame
        title={pageTitle}
        backgroundColor={colors.bgDeals}
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
        right={
          <Pill variant="white" style={shadows.soft}>
            <Ionicons name="pricetags-outline" size={16} color={colors.primary} />
            <Text style={styles.alertNum}>{loading ? "…" : deals.length}</Text>
          </Pill>
        }
        floatingContent={
          canAddNew ? (
            <Fab
              label="Add Deal"
              onPress={() => {
                if (!isAutoShopOwner) {
                  showToast("Sign in as a shop owner to add deals.", { type: "error" });
                  return;
                }
                openCreate?.();
              }}
            />
          ) : null
        }
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionTabs}
          style={styles.sectionTabsScroll}
        >
          {DEAL_SECTIONS.map((tab) => {
            const active = activeId === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveId(tab.id)}
                style={[styles.sectionTab, active && styles.sectionTabActive]}
              >
                <Text style={[styles.sectionTabText, active && styles.sectionTabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading && deals.length === 0 ? <DealsSkeletonList /> : null}

        <View style={styles.listContent}>
          {deals.map((deal, index) => {
            const id = dealId(deal);
            return (
              <ShopOwnerDealCard
                key={id || `deal-${index}`}
                deal={deal}
                expanded={expandedDealId === id}
                onToggleExpanded={() => id && toggleDealExpanded(id)}
                deleting={id ? deletingIds.has(id) : false}
                deactivating={id ? deactivatingIds.has(id) : false}
                selling={sellingDealId === id}
                showSell={showSell}
                customers={customers}
                soldDraftCustomerId={id ? soldDraftIds[id] : undefined}
                onSoldDraftChange={(customerId) => {
                  if (!id) return;
                  setSoldDraftIds((prev) => {
                    const next = { ...prev };
                    if (!customerId) delete next[id];
                    else next[id] = customerId;
                    return next;
                  });
                }}
                onSell={() => void handleSellDeal(deal)}
                onEdit={() => openEdit?.(deal)}
                onDelete={() => confirmDelete(deal)}
                onDeactivate={
                  activeId !== "completed" ? () => confirmDeactivate(deal) : undefined
                }
              />
            );
          })}
          {!loading && deals.length === 0 ? (
            <SurfaceCard shadow="card" style={styles.emptyCard}>
              <Ionicons name="clipboard-outline" size={62} color="#9DB7E8" />
              <Text style={styles.emptyTitle}>No deals in this section</Text>
              <Text style={styles.emptyDesc}>
                {canAddNew ? "Tap + to add your first deal" : "Sold deals will appear here"}
              </Text>
            </SurfaceCard>
          ) : null}
        </View>
      </StackScreenFrame>

      <Modal transparent visible={sheetOpen} animationType="slide" onRequestClose={closeForm}>
        <ShopDealEditorForm
          mode={formMode}
          section={formSection}
          deal={editingDeal}
          onCancel={closeForm}
          onSaved={() => {
            void loadDeals();
          }}
          onNeedServices={() => {
            closeForm();
            openServicesSelection?.();
          }}
          onNeedVehicles={() => {
            closeForm();
            openCarCompanies?.();
          }}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: spacing.sm },
  skeletonList: { paddingHorizontal: spacing.screenHorizontal, gap: spacing.lg, paddingTop: spacing.xs },
  skeletonCard: { padding: spacing.lg, borderRadius: spacing.lg, minHeight: 140 },
  skeletonTop: { gap: 10, marginBottom: spacing.lg },
  skeletonBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  skeletonLine: { height: 12, borderRadius: 8, backgroundColor: "#EDF2F7" },
  alertNum: { fontSize: cardFontSizes.md, fontWeight: "800", color: colors.text },
  sectionTabsScroll: { flexGrow: 0, marginBottom: spacing.md },
  sectionTabs: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.screenHorizontal,
  },
  sectionTab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  sectionTabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMutedBg,
  },
  sectionTabText: { fontSize: fontSizes.sm, fontWeight: "700", color: colors.textMuted },
  sectionTabTextActive: { color: colors.primary },
  listContent: {
    paddingHorizontal: spacing.screenHorizontal,
    gap: spacing.lg,
    paddingTop: spacing.xs,
  },
  emptyCard: { padding: spacing.xl, alignItems: "center", gap: spacing.sm },
  emptyTitle: { ...cardTypography.cardTitle, fontSize: cardFontSizes.hero },
  emptyDesc: { fontSize: cardFontSizes.md, color: colors.textMuted, textAlign: "center" },
});
