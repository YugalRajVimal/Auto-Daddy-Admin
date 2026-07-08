import { LoadingProgress, StackScreenFrame, SurfaceCard, useToast } from "@/components/reusables";
import { cardFontSizes, cardTypography, colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useOncePress } from "@/hooks/use-once-press";
import { useKeyboardBottomInset } from "@/hooks/use-keyboard-bottom-inset";
import { useShopWallet } from "@/hooks/use-shop-wallet";
import { getAnchoredMenuStyle, type MenuAnchorRect } from "@/lib/anchored-menu-position";
import { collectJobCardPayment, fetchJobCardById, markJobCardPaymentInvoice, markJobCardPaymentStatus } from "@/lib/auto-shop-owner-api";
import type { JobCardListRow } from "@/lib/parse-job-card-page";
import {
  formatWalletAmount,
  isOnlineInvoicePayment,
  pickWalletWhen,
  shortJobBadgeCode,
  type WalletLedgerTab,
} from "@/lib/wallet-helpers";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { androidRefreshScrollProps } from "@/lib/refresh-scroll-props";
import { formatCurrencyAmount } from "@/lib/currency";
import {
  Alert,
  InteractionManager,
  Keyboard,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { ScrollView } from "react-native";

function SkeletonLine({ w }: { w: number | `${number}%` }) {
  return <View style={[styles.skeletonLine, { width: w }]} />;
}

function WalletSkeletonList() {
  return (
    <View style={styles.skeletonList} pointerEvents="none">
      {Array.from({ length: 6 }).map((_, i) => (
        <SurfaceCard key={i} shadow="card" style={styles.skeletonCard}>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonBadge} />
            <View style={styles.skeletonTextCol}>
              <SkeletonLine w="56%" />
              <SkeletonLine w="42%" />
              <SkeletonLine w="70%" />
            </View>
            <View style={styles.skeletonRight}>
              <SkeletonLine w={72} />
              <View style={styles.skeletonDot} />
            </View>
          </View>
        </SurfaceCard>
      ))}
    </View>
  );
}

const STATUS_ORDER = ["Paid", "Unpaid"] as const;
type WalletStatusLabel = (typeof STATUS_ORDER)[number];

type WalletMenuState = {
  row: JobCardListRow;
  isPaid: boolean;
  ledger: WalletLedgerTab;
} | null;

type JobCardViewerState = {
  open: boolean;
  row: JobCardListRow | null;
  loading: boolean;
  payload: unknown | null;
  error: string | null;
};

type InvoiceViewerState = {
  open: boolean;
  row: JobCardListRow | null;
  loading: boolean;
  payload: unknown | null;
  error: string | null;
};

type BillingViewerState = {
  open: boolean;
  row: JobCardListRow | null;
  loading: boolean;
  payload: unknown | null;
  error: string | null;
};

function s(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function obj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function pickJobCardFromPayload(payload: unknown): Record<string, unknown> | null {
  const root = obj(payload);
  if (!root) return null;
  const data = obj(root.data);
  const direct = obj(root.jobCard) ?? obj(root.card);
  if (direct) return direct;
  if (data) {
    return obj(data.jobCard) ?? obj(data.card) ?? (data as Record<string, unknown>);
  }
  return root;
}

function getNested(o: Record<string, unknown> | null, key: string): Record<string, unknown> | null {
  if (!o) return null;
  const v = o[key];
  return obj(v);
}

export default function WalletPage() {
  const { qa: qaParam } = useLocalSearchParams<{ qa?: string }>();
  const fromQuickAction = qaParam === "1" || qaParam === "true";
  const { width: windowWidth } = useWindowDimensions();
  const menuBtnRefs = useRef<Record<string, View | null>>({});
  const { token, meta } = useAuth();
  const { showToast } = useToast();
  const isOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";
  const { paidCash, paidOnline, unpaidCash, unpaidOnline, loading, refresh } = useShopWallet(
    token,
    isOwner,
    showToast
  );

  const [statusIndex, setStatusIndex] = useState(0);
  const [ledgerTab, setLedgerTab] = useState<WalletLedgerTab>("cash");
  const [refreshing, setRefreshing] = useState(false);
  const [menu, setMenu] = useState<WalletMenuState>(null);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchorRect | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [jobCardViewer, setJobCardViewer] = useState<JobCardViewerState>({
    open: false,
    row: null,
    loading: false,
    payload: null,
    error: null,
  });
  const [invoiceViewer, setInvoiceViewer] = useState<InvoiceViewerState>({
    open: false,
    row: null,
    loading: false,
    payload: null,
    error: null,
  });
  const [billingViewer, setBillingViewer] = useState<BillingViewerState>({
    open: false,
    row: null,
    loading: false,
    payload: null,
    error: null,
  });

  const keyboardBottom = useKeyboardBottomInset();
  const keyboardOpen = keyboardBottom > 0;
  const formatAmount = useCallback(
    (amount: number | string | null | undefined, options?: { decimals?: number }) =>
      formatCurrencyAmount(amount, meta?.countryCode, {
        fallback: "—",
        minimumFractionDigits: options?.decimals,
        maximumFractionDigits: options?.decimals,
      }),
    [meta?.countryCode]
  );

  const closeBillingViewer = useCallback(() => {
    if (keyboardOpen) {
      Keyboard.dismiss();
      setTimeout(() => setBillingViewer((s) => ({ ...s, open: false })), 80);
      return;
    }
    setBillingViewer((s) => ({ ...s, open: false }));
  }, [keyboardOpen]);

  const closeInvoiceViewer = useCallback(() => {
    if (keyboardOpen) {
      Keyboard.dismiss();
      setTimeout(() => setInvoiceViewer((s) => ({ ...s, open: false })), 80);
      return;
    }
    setInvoiceViewer((s) => ({ ...s, open: false }));
  }, [keyboardOpen]);

  const closeJobCardViewer = useCallback(() => {
    if (keyboardOpen) {
      Keyboard.dismiss();
      setTimeout(() => setJobCardViewer((s) => ({ ...s, open: false })), 80);
      return;
    }
    setJobCardViewer((s) => ({ ...s, open: false }));
  }, [keyboardOpen]);

  const dismissMenu = useCallback(() => {
    setMenu(null);
    setMenuAnchor(null);
  }, []);
  const dismissMenuRef = useRef(dismissMenu);
  dismissMenuRef.current = dismissMenu;

  const statusLabel: WalletStatusLabel = STATUS_ORDER[statusIndex % STATUS_ORDER.length];
  const isPaidView = statusLabel === "Paid";

  const visibleRows = useMemo(() => {
    if (isPaidView) {
      return ledgerTab === "cash" ? paidCash : paidOnline;
    }
    return ledgerTab === "cash" ? unpaidCash : unpaidOnline;
  }, [isPaidView, ledgerTab, paidCash, paidOnline, unpaidCash, unpaidOnline]);

  useFocusEffect(
    useCallback(() => {
      if (fromQuickAction) {
        setStatusIndex(0);
        setLedgerTab("cash");
        dismissMenu();
        router.setParams({ qa: undefined });
      }
      void refresh();
      return undefined;
    }, [dismissMenu, fromQuickAction, refresh])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    InteractionManager.runAfterInteractions(() => {
      void refresh().finally(() => setRefreshing(false));
    });
  }, [refresh]);

  const stepStatus = useCallback((dir: -1 | 1) => {
    setStatusIndex((i) => (i + dir + STATUS_ORDER.length) % STATUS_ORDER.length);
  }, []);

  const openJobCard = useOncePress((row: JobCardListRow) => {
    dismissMenuRef.current();
    router.push({
      pathname: "/(shop-owner)/job-cards/add",
      params: {
        mode: "edit",
        jobCard: encodeURIComponent(JSON.stringify(row.raw)),
        backTo: "/(shop-owner)/wallet",
      },
    });
  });

  const openJobCardPopup = useOncePress(async (row: JobCardListRow) => {
    if (!token) {
      showToast("Sign in to view job card.", { type: "error" });
      return;
    }
    // Android can fail to show a second Modal if we open it while the menu Modal is still visible.
    // Close menu first, then open the viewer on the next tick.
    dismissMenuRef.current();
    await new Promise<void>((r) => setTimeout(r, 50));

    setJobCardViewer({ open: true, row, loading: true, payload: null, error: null });

    const res = await fetchJobCardById(token, row.id);
    if (!res.ok) {
      setJobCardViewer({ open: true, row, loading: false, payload: null, error: "Could not load job card." });
      return;
    }
    setJobCardViewer({ open: true, row, loading: false, payload: res.data, error: null });
  });

  const markPaid = useCallback(
    async (row: JobCardListRow) => {
      if (!token) {
        showToast("Sign in to update payment.", { type: "error" });
        return;
      }
      dismissMenu();
      setMarkingId(row.id);
      try {
        const res = await markJobCardPaymentStatus(token, row.id, { paymentStatus: "Paid" });
        const msg =
          res.data && typeof res.data === "object" && "message" in res.data
            ? String((res.data as { message?: string }).message ?? "")
            : "";
        if (!res.ok) {
          showToast(msg || "Could not update payment.", { type: "error" });
          return;
        }
        showToast(msg || "Marked as paid.", { type: "success" });
        await refresh();
      } catch {
        showToast("Network error.", { type: "error" });
      } finally {
        setMarkingId(null);
      }
    },
    [dismissMenu, refresh, showToast, token]
  );

  const confirmMarkPaid = useCallback(
    (row: JobCardListRow) => {
      Alert.alert("Update payment?", "Mark this job card as paid?", [
        { text: "Cancel", style: "cancel" },
        { text: "Mark paid", onPress: () => void markPaid(row) },
      ]);
    },
    [markPaid]
  );

  const openInvoicePopup = useOncePress(async (row: JobCardListRow) => {
    if (!token) {
      showToast("Sign in to view invoice.", { type: "error" });
      return;
    }
    // Close menu first; Android can drop a second modal otherwise.
    dismissMenuRef.current();
    await new Promise<void>((r) => setTimeout(r, 50));
    setInvoiceViewer({ open: true, row, loading: true, payload: null, error: null });
    const res = await fetchJobCardById(token, row.id);
    if (!res.ok) {
      setInvoiceViewer({ open: true, row, loading: false, payload: null, error: "Could not load invoice." });
      return;
    }
    setInvoiceViewer({ open: true, row, loading: false, payload: res.data, error: null });
  });

  const openBillingPopup = useOncePress(async (row: JobCardListRow) => {
    if (!token) {
      showToast("Sign in to update billing.", { type: "error" });
      return;
    }
    dismissMenuRef.current();
    await new Promise<void>((r) => setTimeout(r, 50));
    setBillingViewer({ open: true, row, loading: true, payload: null, error: null });
    const res = await fetchJobCardById(token, row.id);
    if (!res.ok) {
      setBillingViewer({ open: true, row, loading: false, payload: null, error: "Could not load billing details." });
      return;
    }
    setBillingViewer({ open: true, row, loading: false, payload: res.data, error: null });
  });

  const updateBillingAndMarkPaid = useOncePress(async (row: JobCardListRow, method: "Cash" | "Online") => {
    if (!token) {
      showToast("Sign in to update billing.", { type: "error" });
      return;
    }
    // Use latest fetched payload if available to pick the correct amount.
    const raw = pickJobCardFromPayload(billingViewer.payload) ?? obj(row.raw) ?? null;
    const payable = getNested(raw, "payableAmounts");
    const invoiceTotal = Number(s(payable?.invoiceTotal ?? (raw as any)?.totalPayableAmount ?? row.total) || "0");
    const cashAmt = Number(s(payable?.cash ?? invoiceTotal) || "0");
    const onlineAmt = Number(s(payable?.online ?? invoiceTotal) || "0");
    const amount = method === "Cash" ? cashAmt : onlineAmt;

    setBillingViewer((s) => ({ ...s, open: false }));
    setMarkingId(row.id);
    try {
      const res = await collectJobCardPayment(token, {
        jobCardId: row.id,
        paymentMethod: method === "Cash" ? "Cash" : "Online",
        remark: "",
        amount: Number.isFinite(amount) ? amount : 0,
      });
      if (!res.ok) {
        showToast("Could not update payment method.", { type: "error" });
        return;
      }
      showToast("Payment collected.", { type: "success" });
      await refresh();
    } catch {
      showToast("Network error.", { type: "error" });
    } finally {
      setMarkingId(null);
    }
  });

  const convertToInvoice = useOncePress(async (row: JobCardListRow) => {
    if (!token) {
      showToast("Sign in to update billing.", { type: "error" });
      return;
    }
    dismissMenuRef.current();
    setMarkingId(row.id);
    try {
      const res = await markJobCardPaymentInvoice(token, row.id);
      const payload = res.data as unknown;
      const msg =
        payload && typeof payload === "object" && "message" in payload
          ? String((payload as { message?: string }).message ?? "")
          : "";
      if (!res.ok) {
        showToast(msg || "Could not convert to invoice.", { type: "error" });
        return;
      }
      showToast(msg || "Converted to invoice.", { type: "success" });
      await refresh();
    } catch {
      showToast("Network error.", { type: "error" });
    } finally {
      setMarkingId(null);
    }
  });

  const menuCardLayoutStyle = useMemo(() => {
    if (!menu) {
      return null;
    }
    if (menuAnchor) {
      return getAnchoredMenuStyle(menuAnchor);
    }
    return {
      position: "absolute" as const,
      top: "30%" as const,
      left: Math.max(8, (windowWidth - 228) / 2),
      minWidth: 228,
      zIndex: 2,
    };
  }, [menu, menuAnchor, windowWidth]);

  const headerGradient = [colors.tabBarBg, "#EEF6FF", colors.white] as const;

  const emptyPrimary = "No Data Yet";
  const emptySecondary = isPaidView
    ? ledgerTab === "cash"
      ? "No paid cash transactions available"
      : "No paid invoice transactions available"
    : ledgerTab === "cash"
      ? "No unpaid cash transactions available"
      : "No unpaid invoice transactions available";

  return (
    <StackScreenFrame
      title="Wallet"
      backgroundColor={colors.bgProfile}
      headerGradient={headerGradient}
      scroll={false}
    >
      <View style={styles.page}>
        <View style={styles.statusStrip}>
          <Pressable style={styles.statusChevron} onPress={() => stepStatus(-1)} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={colors.successDark} />
          </Pressable>
          <Text style={styles.statusStripText}>{statusLabel}</Text>
          <Pressable style={styles.statusChevron} onPress={() => stepStatus(1)} hitSlop={10}>
            <Ionicons name="chevron-forward" size={22} color={colors.successDark} />
          </Pressable>
        </View>

        <View style={styles.ledgerTabs}>
          <Pressable
            style={[styles.ledgerTab, ledgerTab === "cash" && styles.ledgerTabActive]}
            onPress={() => setLedgerTab("cash")}
          >
            <Text
              style={[styles.ledgerTabText, ledgerTab === "cash" && styles.ledgerTabTextOnPrimary]}
            >
              💰 Cash
            </Text>
          </Pressable>
          <Pressable
            style={[styles.ledgerTab, ledgerTab === "invoice" && styles.ledgerTabActiveInvoice]}
            onPress={() => setLedgerTab("invoice")}
          >
            <Ionicons
              name="document-text"
              size={18}
              color={ledgerTab === "invoice" ? colors.white : colors.tabInactive}
            />
            <Text
              style={[
                styles.ledgerTabTextInvoice,
                ledgerTab === "invoice" && styles.ledgerTabTextOnPrimary,
              ]}
            >
              Invoice
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
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
          {loading && visibleRows.length === 0 ? <WalletSkeletonList /> : null}

          {!loading && visibleRows.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Ionicons name="document-text-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyTitle}>{emptyPrimary}</Text>
              <Text style={styles.emptySub}>{emptySecondary}</Text>
            </View>
          ) : null}

          {visibleRows.map((row) => {
            const { time, dateLabel } = pickWalletWhen(row, row.raw);
            const badge = shortJobBadgeCode(row.jobNo);
            const amountStr = formatWalletAmount(row.total, isPaidView, meta?.countryCode);
            const amountColor = isPaidView ? colors.success : colors.danger;
            const badgeBg = isPaidView ? colors.success : colors.danger;
            const busy = markingId === row.id;

            return (
              <SurfaceCard key={row.id} shadow="card" style={styles.txCard}>
                <View style={styles.txRow}>
                  <View style={[styles.jobBadge, { backgroundColor: badgeBg }]}>
                    <Text style={styles.jobBadgeLine1}>JobCard</Text>
                    <Text style={styles.jobBadgeLine2}>{badge}</Text>
                    <View style={styles.jobBadgePlus}>
                      <Ionicons name="add" size={10} color={colors.white} />
                    </View>
                  </View>

                  <View style={styles.txMain}>
                    <Text style={styles.txName} numberOfLines={1}>
                      {row.customerName ?? "Customer"}
                    </Text>
                    <View style={styles.phonePill}>
                      <Ionicons name="call-outline" size={14} color={colors.primary} />
                      <Text style={styles.phonePillText} numberOfLines={1}>
                        {row.phone?.trim() ? row.phone : "—"}
                      </Text>
                    </View>
                    <View style={styles.txMeta}>
                      <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.txMetaText}>{time}</Text>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={colors.textMuted}
                        style={styles.metaCal}
                      />
                      <Text style={styles.txMetaText}>{dateLabel}</Text>
                    </View>
                  </View>

                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: amountColor }]}>{amountStr}</Text>
                    <View
                      collapsable={false}
                      ref={(el) => {
                        menuBtnRefs.current[row.id] = el;
                      }}
                    >
                      <Pressable
                        style={styles.txMenuBtn}
                        hitSlop={6}
                        disabled={busy}
                        onPress={() => {
                          const node = menuBtnRefs.current[row.id];
                          const open = () => {
                            setMenu({ row, isPaid: isPaidView, ledger: ledgerTab });
                            setMenuAnchor(null);
                          };
                          if (node && "measureInWindow" in node && typeof node.measureInWindow === "function") {
                            node.measureInWindow((x, y, w, h) => {
                              setMenuAnchor({ x, y, w, h });
                              setMenu({ row, isPaid: isPaidView, ledger: ledgerTab });
                            });
                          } else {
                            open();
                          }
                        }}
                      >
                        <Ionicons
                          name={busy ? "time-outline" : "ellipsis-vertical"}
                          size={busy ? 18 : 18}
                          color={busy ? colors.textLight : colors.primary}
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </SurfaceCard>
            );
          })}
        </ScrollView>

        <Modal visible={menu != null} transparent animationType="fade" onRequestClose={dismissMenu}>
          <View style={styles.menuModalRoot}>
            <Pressable style={styles.menuBackdrop} onPress={dismissMenu} />
            {menu && menuCardLayoutStyle ? (
              <View style={[styles.menuCard, menuCardLayoutStyle]}>
                {menu.isPaid ? (
                  <>
                    <Pressable style={styles.menuRowBtn} onPress={() => openInvoicePopup?.(menu.row)}>
                      <Text style={styles.menuRowLabel}>View Invoice</Text>
                    </Pressable>
                    <Pressable style={styles.menuRowBtn} onPress={() => openJobCardPopup?.(menu.row)}>
                      <Text style={styles.menuRowLabel}>View Job Card</Text>
                    </Pressable>
                  </>
                ) : null}
                {!menu.isPaid && menu.ledger === "cash" ? (
                  <Pressable
                    style={styles.menuRowBtn}
                    onPress={() => {
                      void openBillingPopup?.(menu.row);
                    }}
                  >
                    <Text style={styles.menuRowLabel}>Update Billing</Text>
                  </Pressable>
                ) : null}
                {!menu.isPaid && menu.ledger === "invoice" ? (
                  <Pressable
                    style={styles.menuRowBtn}
                    onPress={() => {
                      void openBillingPopup?.(menu.row);
                    }}
                  >
                    <Text style={styles.menuRowLabel}>Update Payment</Text>
                  </Pressable>
                ) : null}
                {!menu.isPaid && menu.ledger === "cash" ? (
                  <Pressable style={styles.menuRowBtn} onPress={() => openJobCardPopup?.(menu.row)}>
                    <Text style={styles.menuRowLabel}>View Job Card</Text>
                  </Pressable>
                ) : null}
                {!menu.isPaid && menu.ledger === "cash" ? (
                  <Pressable style={styles.menuRowBtn} onPress={() => convertToInvoice?.(menu.row)}>
                    <Text style={styles.menuRowLabel}>Convert to Invoice</Text>
                  </Pressable>
                ) : null}
                {!menu.isPaid && menu.ledger === "invoice" ? (
                  <Pressable style={styles.menuRowBtn} onPress={() => openJobCardPopup?.(menu.row)}>
                    <Text style={styles.menuRowLabel}>View Job Card</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        </Modal>

        <Modal
          visible={billingViewer.open}
          transparent
          animationType="fade"
          onRequestClose={closeBillingViewer}
        >
          <View style={styles.viewerBackdrop}>
            <Pressable style={styles.viewerBackdropPress} onPress={closeBillingViewer} />
            <View style={styles.billingCard}>
              <View style={styles.invoiceHeader}>
                {(() => {
                  const raw = pickJobCardFromPayload(billingViewer.payload) ?? obj(billingViewer.row?.raw) ?? null;
                  const business = getNested(raw, "business") ?? getNested(raw, "shop");
                  const businessName = s(business?.businessName ?? business?.name) || "Billing";
                  const inv = s((raw as any)?.invoiceNumber ?? "");
                  return (
                    <View style={styles.invoiceHeaderLeft}>
                      <Text style={styles.invoiceHeaderTitle}>{businessName}</Text>
                      <Text style={styles.invoiceHeaderSub}>{inv || "Update Billing"}</Text>
                    </View>
                  );
                })()}
                <Pressable hitSlop={8} onPress={closeBillingViewer} style={styles.invoiceClose}>
                  <Ionicons name="close" size={18} color={colors.white} />
                </Pressable>
              </View>

              <ScrollView style={styles.viewerScroll} contentContainerStyle={styles.invoiceContent} showsVerticalScrollIndicator={false}>
                {billingViewer.loading ? (
                  <View style={styles.viewerLoading}>
                    <LoadingProgress />
                  </View>
                ) : billingViewer.error ? (
                  <Text style={styles.viewerError}>{billingViewer.error}</Text>
                ) : (
                  (() => {
                    const raw = pickJobCardFromPayload(billingViewer.payload) ?? obj(billingViewer.row?.raw) ?? null;
                    const customer = getNested(raw, "customerId") ?? getNested(raw, "customer");
                    const vehicle = getNested(raw, "vehicleId") ?? getNested(raw, "vehicle");
                    const vehicleMake = getNested(vehicle, "make");
                    const payable = getNested(raw, "payableAmounts");
                    const servicesArr = Array.isArray((raw as any)?.services) ? ((raw as any).services as unknown[]) : [];

                    const jobNo = s((raw as any)?.jobNo ?? billingViewer.row?.jobNo);
                    const serviceType = s((raw as any)?.serviceType ?? "");
                    const priority = s((raw as any)?.priorityLevel ?? "");
                    const totalPayable = s((raw as any)?.totalPayableAmount ?? (raw as any)?.total ?? billingViewer.row?.total);

                    const subtotal = s(payable?.invoiceTotal ?? payable?.subtotal ?? "");
                    const gstAmount = s(payable?.gstAmount ?? "");
                    const gstRate = s(payable?.gstRate ?? "");
                    const invoiceTotal = s(payable?.invoiceTotal ?? payable?.total ?? "");
                    const cashAmt = s(payable?.cash ?? "");
                    const onlineAmt = s(payable?.online ?? "");

                    const customerName = s(customer?.name ?? billingViewer.row?.customerName) || "Customer";
                    const customerPhone = s(customer?.phone ?? billingViewer.row?.phone);
                    const customerAddr = s(customer?.address);

                    const plate = s(vehicle?.licensePlateNo ?? billingViewer.row?.vehiclePlate);
                    const make = s(vehicleMake?.name ?? vehicle?.make);
                    const odo = s((raw as any)?.odometerReading ?? billingViewer.row?.odometerCurrent);
                    const due = s((raw as any)?.dueOdometerReading ?? billingViewer.row?.odometerDue);

                    return (
                      <>
                        <View style={styles.invoiceMetaRow}>
                          <View style={styles.invoiceChip}>
                            <Text style={styles.invoiceChipText}>{jobNo ? `Job #${jobNo}` : "Job"}</Text>
                          </View>
                          {priority ? (
                            <View style={styles.invoiceChipMuted}>
                              <Text style={styles.invoiceChipMutedText}>{priority}</Text>
                            </View>
                          ) : null}
                          {serviceType ? (
                            <View style={styles.invoiceChipMuted}>
                              <Text style={styles.invoiceChipMutedText}>{serviceType}</Text>
                            </View>
                          ) : null}
                        </View>

                        <View style={styles.invoiceInfoGrid}>
                          <View style={styles.invoiceInfoCard}>
                            <Text style={styles.invoiceInfoTitle}>CUSTOMER</Text>
                            <Text style={styles.invoiceInfoMain}>{customerName}</Text>
                            {customerPhone ? <Text style={styles.invoiceInfoSub}>{customerPhone}</Text> : null}
                            {customerAddr ? <Text style={styles.invoiceInfoSub} numberOfLines={2}>{customerAddr}</Text> : null}
                          </View>
                          <View style={styles.invoiceInfoCard}>
                            <Text style={styles.invoiceInfoTitle}>VEHICLE</Text>
                            <Text style={styles.invoiceInfoMain}>{make || "—"}</Text>
                            {plate ? <Text style={styles.invoiceInfoSub}>{plate}</Text> : null}
                            <View style={styles.invoiceOdoRow}>
                              <View style={styles.invoiceOdoCol}>
                                <Text style={styles.invoiceOdoLabel}>ODO IN</Text>
                                <Text style={styles.invoiceOdoValue}>{odo ? `${odo} km` : "—"}</Text>
                              </View>
                              <View style={styles.invoiceOdoCol}>
                                <Text style={styles.invoiceOdoLabel}>DUE ODO</Text>
                                <Text style={[styles.invoiceOdoValue, styles.invoiceOdoDue]}>{due ? `${due} km` : "—"}</Text>
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
                            {servicesArr.length === 0 ? (
                              <Text style={styles.viewerHint}>—</Text>
                            ) : (
                              servicesArr.flatMap((svc, i) => {
                                const svcObj = obj(svc);
                                const subs = Array.isArray(svcObj?.subServices) ? (svcObj?.subServices as unknown[]) : [];
                                return subs.map((sub, j) => {
                                  const subObj = obj(sub);
                                  const nm = s(subObj?.name);
                                  const desc = s(subObj?.desc);
                                  const price = s(subObj?.price);
                                  return (
                                    <View key={`bill-line-${i}-${j}`} style={styles.invoiceLine}>
                                      <View style={styles.invoiceLineLeft}>
                                        <Text style={styles.invoiceLineName}>{nm || "—"}</Text>
                                        {desc ? <Text style={styles.invoiceLineDesc}>{desc}</Text> : null}
                                      </View>
                                      <Text style={styles.invoiceLineAmt}>
                                        {price ? formatAmount(price, { decimals: 2 }) : "—"}
                                      </Text>
                                    </View>
                                  );
                                });
                              })
                            )}
                          </View>
                        </View>

                        <View style={styles.invoiceTotals}>
                          <View style={styles.invoiceTotalRow}>
                            <Text style={styles.invoiceTotalLabel}>Subtotal</Text>
                            <Text style={styles.invoiceTotalValue}>
                              {subtotal ? formatAmount(subtotal) : totalPayable ? formatAmount(totalPayable) : "—"}
                            </Text>
                          </View>
                          {(payable?.gstRate || payable?.gstAmount) ? (
                            <View style={styles.invoiceTotalRow}>
                              <Text style={styles.invoiceTotalLabel}>
                                HST {gstRate ? `(${gstRate}%)` : ""} — Invoice only
                              </Text>
                              <Text style={styles.invoiceTotalValue}>{gstAmount ? formatAmount(gstAmount) : "—"}</Text>
                            </View>
                          ) : null}
                          <View style={[styles.invoiceTotalRow, styles.invoiceTotalRowStrong]}>
                            <Text style={styles.invoiceTotalStrongLabel}>Invoice Total</Text>
                            <Text style={styles.invoiceTotalStrongValue}>
                              {invoiceTotal ? formatAmount(invoiceTotal) : totalPayable ? formatAmount(totalPayable) : "—"}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.invoiceFooterHint}>
                          <Text style={styles.invoiceFooterText}>Choose Payment Method</Text>
                        </View>
                        <View style={styles.billingButtonsRow}>
                          <Pressable
                            style={[styles.billingBtn, styles.billingBtnCash, markingId === billingViewer.row?.id && styles.billingBtnDisabled]}
                            disabled={markingId === billingViewer.row?.id}
                            onPress={() => {
                              if (billingViewer.row) {
                                void updateBillingAndMarkPaid?.(billingViewer.row, "Cash");
                              }
                            }}
                          >
                            <Ionicons name="cash-outline" size={18} color={colors.white} />
                            <View>
                              <Text style={styles.billingBtnTitle}>Cash</Text>
                              <Text style={styles.billingBtnSub}>
                                {cashAmt ? formatAmount(cashAmt) : invoiceTotal ? formatAmount(invoiceTotal) : "—"}
                              </Text>
                            </View>
                          </Pressable>
                          <Pressable
                            style={[styles.billingBtn, styles.billingBtnInvoice, markingId === billingViewer.row?.id && styles.billingBtnDisabled]}
                            disabled={markingId === billingViewer.row?.id}
                            onPress={() => {
                              if (billingViewer.row) {
                                void updateBillingAndMarkPaid?.(billingViewer.row, "Online");
                              }
                            }}
                          >
                            <Ionicons name="document-text-outline" size={18} color={colors.white} />
                            <View>
                              <Text style={styles.billingBtnTitle}>Invoice</Text>
                              <Text style={styles.billingBtnSub}>
                                {onlineAmt ? formatAmount(onlineAmt) : invoiceTotal ? formatAmount(invoiceTotal) : "—"}
                              </Text>
                            </View>
                          </Pressable>
                        </View>
                      </>
                    );
                  })()
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={invoiceViewer.open}
          transparent
          animationType="fade"
          onRequestClose={closeInvoiceViewer}
        >
          <View style={styles.viewerBackdrop}>
            <Pressable style={styles.viewerBackdropPress} onPress={closeInvoiceViewer} />
            <View style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                {(() => {
                  const raw = pickJobCardFromPayload(invoiceViewer.payload) ?? obj(invoiceViewer.row?.raw) ?? null;
                  const business = getNested(raw, "business") ?? getNested(raw, "shop");
                  const businessName = s(business?.businessName ?? business?.name) || "Invoice";
                  const inv = s((raw as any)?.invoiceNumber ?? "");
                  return (
                    <View style={styles.invoiceHeaderLeft}>
                      <Text style={styles.invoiceHeaderTitle}>{businessName}</Text>
                      <Text style={styles.invoiceHeaderSub}>{inv || "Invoice"}</Text>
                    </View>
                  );
                })()}
                <Pressable hitSlop={8} onPress={closeInvoiceViewer} style={styles.invoiceClose}>
                  <Ionicons name="close" size={18} color={colors.white} />
                </Pressable>
              </View>

              <ScrollView style={styles.viewerScroll} contentContainerStyle={styles.invoiceContent} showsVerticalScrollIndicator={false}>
                {invoiceViewer.loading ? (
                  <View style={styles.viewerLoading}>
                    <LoadingProgress />
                  </View>
                ) : invoiceViewer.error ? (
                  <Text style={styles.viewerError}>{invoiceViewer.error}</Text>
                ) : (
                  (() => {
                    const raw = pickJobCardFromPayload(invoiceViewer.payload) ?? obj(invoiceViewer.row?.raw) ?? null;
                    const customer = getNested(raw, "customerId") ?? getNested(raw, "customer");
                    const vehicle = getNested(raw, "vehicleId") ?? getNested(raw, "vehicle");
                    const vehicleMake = getNested(vehicle, "make");
                    const payable = getNested(raw, "payableAmounts");
                    const servicesArr = Array.isArray((raw as any)?.services) ? ((raw as any).services as unknown[]) : [];

                    const jobNo = s((raw as any)?.jobNo ?? invoiceViewer.row?.jobNo);
                    const serviceType = s((raw as any)?.serviceType ?? "");
                    const priority = s((raw as any)?.priorityLevel ?? "");
                    const paymentMethod = s((raw as any)?.paymentMethod ?? invoiceViewer.row?.paymentMethod ?? "");
                    const showInvoiceTax = isOnlineInvoicePayment(paymentMethod);
                    const totalPayable = s((raw as any)?.totalPayableAmount ?? (raw as any)?.total ?? invoiceViewer.row?.total);

                    const subtotal = s(payable?.invoiceTotal ?? payable?.subtotal ?? "");
                    const gstAmount = s(payable?.gstAmount ?? "");
                    const gstRate = s(payable?.gstRate ?? "");
                    const cashTotal = s(payable?.cash ?? "");
                    const onlineTotal = s(payable?.online ?? "");
                    const invoiceTotal = showInvoiceTax
                      ? onlineTotal || totalPayable || s(payable?.invoiceTotal ?? payable?.total ?? "")
                      : cashTotal || totalPayable || s(payable?.invoiceTotal ?? payable?.total ?? "");

                    const customerName = s(customer?.name ?? invoiceViewer.row?.customerName) || "Customer";
                    const customerPhone = s(customer?.phone ?? invoiceViewer.row?.phone);
                    const customerAddr = s(customer?.address);

                    const plate = s(vehicle?.licensePlateNo ?? invoiceViewer.row?.vehiclePlate);
                    const make = s(vehicleMake?.name ?? vehicle?.make);
                    const odo = s((raw as any)?.odometerReading ?? invoiceViewer.row?.odometerCurrent);
                    const due = s((raw as any)?.dueOdometerReading ?? invoiceViewer.row?.odometerDue);

                    return (
                      <>
                        <View style={styles.invoiceMetaRow}>
                          <View style={styles.invoiceChip}>
                            <Text style={styles.invoiceChipText}>{jobNo ? `Job #${jobNo}` : "Job"}</Text>
                          </View>
                          {priority ? (
                            <View style={styles.invoiceChipMuted}>
                              <Text style={styles.invoiceChipMutedText}>{priority}</Text>
                            </View>
                          ) : null}
                          {serviceType ? (
                            <View style={styles.invoiceChipMuted}>
                              <Text style={styles.invoiceChipMutedText}>{serviceType}</Text>
                            </View>
                          ) : null}
                        </View>

                        <View style={styles.invoiceInfoGrid}>
                          <View style={styles.invoiceInfoCard}>
                            <Text style={styles.invoiceInfoTitle}>CUSTOMER</Text>
                            <Text style={styles.invoiceInfoMain}>{customerName}</Text>
                            {customerPhone ? <Text style={styles.invoiceInfoSub}>{customerPhone}</Text> : null}
                            {customerAddr ? <Text style={styles.invoiceInfoSub} numberOfLines={2}>{customerAddr}</Text> : null}
                          </View>
                          <View style={styles.invoiceInfoCard}>
                            <Text style={styles.invoiceInfoTitle}>VEHICLE</Text>
                            <Text style={styles.invoiceInfoMain}>{make || "—"}</Text>
                            {plate ? <Text style={styles.invoiceInfoSub}>{plate}</Text> : null}
                            <View style={styles.invoiceOdoRow}>
                              <View style={styles.invoiceOdoCol}>
                                <Text style={styles.invoiceOdoLabel}>ODO IN</Text>
                                <Text style={styles.invoiceOdoValue}>{odo ? `${odo} km` : "—"}</Text>
                              </View>
                              <View style={styles.invoiceOdoCol}>
                                <Text style={styles.invoiceOdoLabel}>DUE ODO</Text>
                                <Text style={[styles.invoiceOdoValue, styles.invoiceOdoDue]}>{due ? `${due} km` : "—"}</Text>
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
                            {servicesArr.length === 0 ? (
                              <Text style={styles.viewerHint}>—</Text>
                            ) : (
                              servicesArr.flatMap((svc, i) => {
                                const svcObj = obj(svc);
                                const subs = Array.isArray(svcObj?.subServices) ? (svcObj?.subServices as unknown[]) : [];
                                return subs.map((sub, j) => {
                                  const subObj = obj(sub);
                                  const nm = s(subObj?.name);
                                  const desc = s(subObj?.desc);
                                  const price = s(subObj?.price);
                                  return (
                                    <View key={`inv-line-${i}-${j}`} style={styles.invoiceLine}>
                                      <View style={styles.invoiceLineLeft}>
                                        <Text style={styles.invoiceLineName}>{nm || "—"}</Text>
                                        {desc ? <Text style={styles.invoiceLineDesc}>{desc}</Text> : null}
                                      </View>
                                      <Text style={styles.invoiceLineAmt}>
                                        {price ? formatAmount(price, { decimals: 2 }) : "—"}
                                      </Text>
                                    </View>
                                  );
                                });
                              })
                            )}
                          </View>
                        </View>

                        <View style={styles.invoiceTotals}>
                          <View style={styles.invoiceTotalRow}>
                            <Text style={styles.invoiceTotalLabel}>Subtotal</Text>
                            <Text style={styles.invoiceTotalValue}>
                              {subtotal ? formatAmount(subtotal) : totalPayable ? formatAmount(totalPayable) : "—"}
                            </Text>
                          </View>
                          {showInvoiceTax && (payable?.gstRate || payable?.gstAmount) ? (
                            <View style={styles.invoiceTotalRow}>
                              <Text style={styles.invoiceTotalLabel}>HST {gstRate ? `(${gstRate}%)` : ""}</Text>
                              <Text style={styles.invoiceTotalValue}>{gstAmount ? formatAmount(gstAmount) : "—"}</Text>
                            </View>
                          ) : null}
                          <View style={[styles.invoiceTotalRow, styles.invoiceTotalRowStrong]}>
                            <Text style={styles.invoiceTotalStrongLabel}>Invoice Total</Text>
                            <Text style={styles.invoiceTotalStrongValue}>
                              {invoiceTotal ? formatAmount(invoiceTotal) : totalPayable ? formatAmount(totalPayable) : "—"}
                            </Text>
                          </View>
                        </View>

                        {/* <View style={styles.invoiceFooterHint}>
                          <Text style={styles.invoiceFooterText}>Choose Payment Method</Text>
                        </View> */}
                      </>
                    );
                  })()
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={jobCardViewer.open}
          transparent
          animationType="fade"
          onRequestClose={closeJobCardViewer}
        >
          <View style={styles.viewerBackdrop}>
            <Pressable style={styles.viewerBackdropPress} onPress={closeJobCardViewer} />
            <View style={styles.viewerCard}>
              <View style={styles.viewerHeader}>
                <View style={styles.viewerHeaderLeft}>
                  <Text style={styles.viewerTitle}>{jobCardViewer.row?.jobNo?.trim() || "Job Card"}</Text>
                  <Text style={styles.viewerSub}>Job Card Details</Text>
                </View>
                <View style={styles.viewerHeaderRight}>
                  {(() => {
                    const raw = pickJobCardFromPayload(jobCardViewer.payload) ?? obj(jobCardViewer.row?.raw) ?? null;
                    const status = s((raw as any)?.status ?? jobCardViewer.row?.status);
                    return status ? (
                      <View style={styles.viewerStatusPill}>
                        <Text style={styles.viewerStatusText}>{status}</Text>
                      </View>
                    ) : null;
                  })()}
                  <Pressable
                    hitSlop={8}
                    onPress={closeJobCardViewer}
                    style={styles.viewerClose}
                  >
                    <Ionicons name="close" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              </View>

              <ScrollView style={styles.viewerScroll} contentContainerStyle={styles.viewerContent} showsVerticalScrollIndicator={false}>
                {jobCardViewer.loading ? (
                  <View style={styles.viewerLoading}>
                    <LoadingProgress />
                  </View>
                ) : jobCardViewer.error ? (
                  <Text style={styles.viewerError}>{jobCardViewer.error}</Text>
                ) : (
                  (() => {
                    const raw =
                      pickJobCardFromPayload(jobCardViewer.payload) ??
                      obj(jobCardViewer.row?.raw) ??
                      null;

                    // Matches your API payload shape:
                    // data.business, data.customerId, data.vehicleId, payableAmounts, services[]
                    const business =
                      getNested(raw, "business") ??
                      getNested(raw, "businessProfile") ??
                      getNested(raw, "shop");
                    const customer =
                      getNested(raw, "customerId") ??
                      getNested(raw, "customer") ??
                      getNested(raw, "carOwner");
                    const vehicle =
                      getNested(raw, "vehicleId") ??
                      getNested(raw, "vehicle");
                    const vehicleMake = getNested(vehicle, "make");
                    const payable = getNested(raw, "payableAmounts");
                    const servicesArr = Array.isArray((raw as any)?.services) ? ((raw as any).services as unknown[]) : [];

                    const jobNo = s((raw as any)?.jobNo ?? (raw as any)?.jobNumber ?? jobCardViewer.row?.jobNo);
                    const invoiceNo = s((raw as any)?.invoiceNumber ?? (raw as any)?.invoiceNo ?? "");
                    const status = s((raw as any)?.status ?? jobCardViewer.row?.status);
                    const paymentStatus = s((raw as any)?.paymentStatus ?? jobCardViewer.row?.paymentStatus);
                    const paymentMethod = s((raw as any)?.paymentMethod ?? "");
                    const priority = s((raw as any)?.priorityLevel ?? (raw as any)?.priority ?? "");
                    const serviceType = s((raw as any)?.serviceType ?? (raw as any)?.type ?? "");
                    const issue = s((raw as any)?.issueDescription ?? jobCardViewer.row?.issueDescription);
                    const totalPayable = s((raw as any)?.totalPayableAmount ?? (raw as any)?.totalPayable ?? (raw as any)?.totalAmount ?? (raw as any)?.total ?? jobCardViewer.row?.total);

                    const payableCash = s(payable?.cash ?? "");
                    const payableOnline = s(payable?.online ?? "");
                    const gstAmount = s(payable?.gstAmount ?? "");
                    const gstRate = s(payable?.gstRate ?? "");
                    const invoiceTotal = s(payable?.invoiceTotal ?? payable?.total ?? "");

                    return (
                      <>
                        <View style={styles.viewerSection}>
                          <View style={styles.viewerSectionHeader}>
                            <Ionicons name="business-outline" size={16} color={colors.primary} />
                            <Text style={styles.viewerSectionTitle}>Business Information</Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Name:</Text>
                            <Text style={styles.viewerValue}>
                              {s(business?.businessName ?? business?.name) || "—"}
                            </Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Address:</Text>
                            <Text style={styles.viewerValue}>
                              {s(business?.businessAddress ?? business?.address) || "—"}
                            </Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Phone:</Text>
                            <Text style={styles.viewerValue}>
                              {s(business?.businessPhone ?? business?.phone) || "—"}
                            </Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Email:</Text>
                            <Text style={styles.viewerValue}>
                              {s(business?.businessEmail ?? business?.email) || "—"}
                            </Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>GST/HST:</Text>
                            <Text style={styles.viewerValue}>
                              {s(business?.businessHSTNumber ?? business?.gstNumber ?? business?.gst) || "—"}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.viewerSection}>
                          <View style={styles.viewerSectionHeader}>
                            <Ionicons name="person-outline" size={16} color={colors.primary} />
                            <Text style={styles.viewerSectionTitle}>Customer Information</Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Name:</Text>
                            <Text style={styles.viewerValue}>
                              {s(customer?.name ?? jobCardViewer.row?.customerName) || "—"}
                            </Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Phone:</Text>
                            <Text style={styles.viewerValue}>
                              {s(customer?.phone ?? jobCardViewer.row?.phone) || "—"}
                            </Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Email:</Text>
                            <Text style={styles.viewerValue}>{s(customer?.email) || "—"}</Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Address:</Text>
                            <Text style={styles.viewerValue}>{s(customer?.address) || "—"}</Text>
                          </View>
                        </View>

                        <View style={styles.viewerSection}>
                          <View style={styles.viewerSectionHeader}>
                            <Ionicons name="car-outline" size={16} color={colors.primary} />
                            <Text style={styles.viewerSectionTitle}>Vehicle Information</Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>License Plate:</Text>
                            <Text style={styles.viewerValue}>
                              {s(vehicle?.licensePlateNo ?? vehicle?.licensePlate ?? jobCardViewer.row?.vehiclePlate) || "—"}
                            </Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Make:</Text>
                            <Text style={styles.viewerValue}>
                              {s(vehicleMake?.name ?? vehicle?.make ?? vehicle?.vehicleName ?? "") || "—"}
                            </Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Current KM:</Text>
                            <Text style={styles.viewerValue}>
                              {s((raw as any)?.odometerReading ?? jobCardViewer.row?.odometerCurrent) || "—"}
                            </Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Due KM:</Text>
                            <Text style={styles.viewerValue}>
                              {s((raw as any)?.dueOdometerReading ?? jobCardViewer.row?.odometerDue) || "—"}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.viewerSection}>
                          <View style={styles.viewerSectionHeader}>
                            <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                            <Text style={styles.viewerSectionTitle}>Job Details</Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Job:</Text>
                            <Text style={styles.viewerValue}>{jobNo || "—"}</Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Invoice:</Text>
                            <Text style={styles.viewerValue}>{invoiceNo || "—"}</Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Status:</Text>
                            <Text style={styles.viewerValue}>{status || "—"}</Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Payment:</Text>
                            <Text style={styles.viewerValue}>
                              {(paymentStatus || "—") + (paymentMethod ? ` (${paymentMethod})` : "")}
                            </Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Type:</Text>
                            <Text style={styles.viewerValue}>{serviceType || "—"}</Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Priority:</Text>
                            <Text style={styles.viewerValue}>{priority || "—"}</Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Issue:</Text>
                            <Text style={styles.viewerValue}>{issue || "—"}</Text>
                          </View>
                        </View>

                        <View style={styles.viewerSection}>
                          <View style={styles.viewerSectionHeader}>
                            <Ionicons name="construct-outline" size={16} color={colors.primary} />
                            <Text style={styles.viewerSectionTitle}>Services</Text>
                          </View>
                          {servicesArr.length === 0 ? (
                            <Text style={styles.viewerHint}>—</Text>
                          ) : (
                            servicesArr.map((svc, i) => {
                              const svcObj = obj(svc);
                              const subs = Array.isArray(svcObj?.subServices) ? (svcObj?.subServices as unknown[]) : [];
                              return (
                                <View key={`svc-${i}`} style={styles.viewerServiceBlock}>
                                  {subs.length === 0 ? (
                                    <Text style={styles.viewerHint}>—</Text>
                                  ) : (
                                    subs.map((sub, j) => {
                                      const subObj = obj(sub);
                                      const nm = s(subObj?.name);
                                      const desc = s(subObj?.desc);
                                      const price = s(subObj?.price);
                                      return (
                                        <View key={`sub-${i}-${j}`} style={styles.viewerServiceRow}>
                                          <View style={styles.viewerServiceLeft}>
                                            <Text style={styles.viewerServiceName}>{nm || "—"}</Text>
                                            {desc ? <Text style={styles.viewerServiceDesc}>{desc}</Text> : null}
                                          </View>
                                          <Text style={styles.viewerServicePrice}>
                                            {price ? formatAmount(price) : "—"}
                                          </Text>
                                        </View>
                                      );
                                    })
                                  )}
                                </View>
                              );
                            })
                          )}
                        </View>

                        <View style={styles.viewerSection}>
                          <View style={styles.viewerSectionHeader}>
                            <Ionicons name="cash-outline" size={16} color={colors.primary} />
                            <Text style={styles.viewerSectionTitle}>Charges and Amount</Text>
                          </View>
                          <View style={styles.viewerRow}>
                            <Text style={styles.viewerLabel}>Total:</Text>
                            <Text style={styles.viewerValue}>{totalPayable ? formatAmount(totalPayable) : "—"}</Text>
                          </View>
                          {invoiceTotal ? (
                            <View style={styles.viewerHintRow}>
                              <Text style={styles.viewerHint}>
                                Invoice Total: {invoiceTotal ? formatAmount(invoiceTotal) : "—"}
                                {isOnlineInvoicePayment(paymentMethod) && (gstRate || gstAmount)
                                  ? `  |  HST: ${gstRate ? `${gstRate}%` : "—"} (${gstAmount ? formatAmount(gstAmount) : "—"})`
                                  : ""}
                              </Text>
                            </View>
                          ) : null}
                          {payableCash || payableOnline ? (
                            <View style={styles.viewerHintRow}>
                              <Text style={styles.viewerHint}>
                                Cash: {payableCash ? formatAmount(payableCash) : "—"}  |  Online:{" "}
                                {payableOnline ? formatAmount(payableOnline) : "—"}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </>
                    );
                  })()
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </StackScreenFrame>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  statusStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.successMuted,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  statusChevron: { padding: spacing.xs },
  statusStripText: {
    fontSize: cardFontSizes.lg,
    fontWeight: "800",
    color: colors.successDark,
  },
  ledgerTabs: {
    flexDirection: "row",
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  ledgerTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ledgerTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ledgerTabActiveInvoice: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ledgerTabText: {
    fontSize: cardFontSizes.md,
    fontWeight: "700",
    color: colors.tabInactive,
  },
  ledgerTabTextInvoice: {
    fontSize: cardFontSizes.md,
    fontWeight: "700",
    color: colors.tabInactive,
  },
  ledgerTabTextOnPrimary: {
    color: colors.white,
  },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },
  loading: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.sm },
  loadingText: { color: colors.textMuted, fontSize: fontSizes.md },
  skeletonList: { gap: spacing.md, paddingTop: spacing.sm },
  skeletonCard: { padding: spacing.md },
  skeletonRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  skeletonBadge: { width: 48, height: 48, borderRadius: radii.md, backgroundColor: "#EDF2F7" },
  skeletonTextCol: { flex: 1, gap: 10, paddingTop: 2 },
  skeletonRight: { alignItems: "flex-end", gap: spacing.sm, paddingTop: 2 },
  skeletonLine: { height: 12, borderRadius: 8, backgroundColor: "#EDF2F7" },
  skeletonDot: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#EDF2F7" },
  emptyBlock: {
    alignItems: "center",
    paddingVertical: spacing.xxl * 2,
    gap: spacing.sm,
  },
  emptyTitle: { ...cardTypography.cardTitle, marginTop: spacing.sm },
  emptySub: { fontSize: cardFontSizes.sm, color: colors.textMuted, textAlign: "center" },
  txCard: { padding: spacing.md },
  txRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  jobBadge: {
    width: 48,
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    position: "relative",
  },
  jobBadgeLine1: {
    fontSize: cardFontSizes.micro + 1,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 0.2,
  },
  jobBadgeLine2: {
    fontSize: cardFontSizes.md,
    fontWeight: "800",
    color: colors.white,
    marginTop: 2,
  },
  jobBadgePlus: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  txMain: { flex: 1, minWidth: 0, gap: 4 },
  txName: { fontSize: cardFontSizes.md, fontWeight: "800", color: colors.text },
  phonePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryMutedBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.round,
    maxWidth: "100%",
  },
  phonePillText: { fontSize: cardFontSizes.sm, fontWeight: "700", color: colors.primary },
  txMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4, marginTop: 2 },
  metaCal: { marginLeft: spacing.xs },
  txMetaText: { fontSize: cardFontSizes.xs, color: colors.textMuted, fontWeight: "600" },
  txRight: { alignItems: "flex-end", gap: spacing.sm },
  txAmount: { fontSize: cardFontSizes.md, fontWeight: "800" },
  txMenuBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryMutedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  menuModalRoot: {
    flex: 1,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingVertical: spacing.xs,
    ...shadows.card,
  },
  menuRowBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuRowLabel: { fontSize: cardFontSizes.md, color: colors.text, fontWeight: "600" },

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
  viewerCard: {
    width: "100%",
    height: "86%",
    minHeight: 260,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.card,
  },
  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#1E5AAE",
    borderBottomWidth: 0,
  },
  viewerHeaderLeft: { flex: 1, minWidth: 0 },
  viewerHeaderRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  viewerTitle: { fontSize: fontSizes.lg, fontWeight: "900", color: colors.white },
  viewerSub: { fontSize: fontSizes.xs, fontWeight: "700", color: "rgba(255,255,255,0.85)", marginTop: 2 },
  viewerStatusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.round,
    backgroundColor: "rgba(245,158,11,0.95)",
  },
  viewerStatusText: { fontSize: fontSizes.xs, fontWeight: "900", color: "#1E293B" },
  viewerClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
  },
  viewerScroll: { flex: 1 },
  viewerContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  viewerLoading: { alignItems: "center", paddingVertical: spacing.lg },
  viewerError: { color: colors.danger, fontSize: fontSizes.md, paddingVertical: spacing.lg, textAlign: "center" },
  viewerSection: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: "#F8FAFF",
    gap: 6,
  },
  viewerSectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: 4 },
  viewerSectionTitle: { fontSize: fontSizes.sm, fontWeight: "900", color: colors.primary },
  viewerRow: { flexDirection: "row", gap: spacing.sm },
  viewerLabel: { width: 92, fontSize: fontSizes.sm, color: colors.textMuted, fontWeight: "700" },
  viewerValue: { flex: 1, fontSize: fontSizes.sm, color: colors.text, fontWeight: "700" },
  viewerHintRow: { marginTop: 4 },
  viewerHint: { fontSize: fontSizes.xs, color: colors.textMuted, fontWeight: "700" },
  viewerServiceBlock: { gap: 6 },
  viewerServiceRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  viewerServiceLeft: { flex: 1, minWidth: 0, gap: 2 },
  viewerServiceName: { fontSize: fontSizes.sm, fontWeight: "800", color: colors.text },
  viewerServiceDesc: { fontSize: fontSizes.xs, fontWeight: "600", color: colors.textMuted },
  viewerServicePrice: { fontSize: fontSizes.sm, fontWeight: "900", color: colors.primary },

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
    backgroundColor: "#1E5AAE",
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
  invoiceContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  invoiceMetaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  invoiceChip: { backgroundColor: "#1E5AAE", paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.round },
  invoiceChipText: { color: colors.white, fontSize: fontSizes.sm, fontWeight: "900" },
  invoiceChipMuted: { backgroundColor: "rgba(15, 23, 42, 0.06)", paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.round },
  invoiceChipMutedText: { color: colors.textMuted, fontSize: fontSizes.sm, fontWeight: "800" },
  invoiceInfoGrid: { flexDirection: "row", gap: spacing.sm },
  invoiceInfoCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  invoiceInfoTitle: { fontSize: 11, fontWeight: "900", color: colors.primary, letterSpacing: 0.5 },
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
    borderColor: colors.border,
    overflow: "hidden",
  },
  invoiceSectionTitle: { padding: spacing.md, paddingBottom: spacing.sm, fontSize: fontSizes.sm, fontWeight: "900", color: colors.textMuted },
  invoiceTableHead: { flexDirection: "row", backgroundColor: "#1E5AAE", paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  invoiceThLeft: { flex: 1, color: colors.white, fontSize: fontSizes.sm, fontWeight: "900" },
  invoiceThRight: { width: 110, textAlign: "right", color: colors.white, fontSize: fontSizes.sm, fontWeight: "900" },
  invoiceTableBody: { padding: spacing.md, gap: spacing.sm },
  invoiceLine: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  invoiceLineLeft: { flex: 1, minWidth: 0, gap: 2 },
  invoiceLineName: { fontSize: fontSizes.sm, fontWeight: "900", color: colors.text },
  invoiceLineDesc: { fontSize: fontSizes.xs, fontWeight: "700", color: colors.textMuted },
  invoiceLineAmt: { width: 110, textAlign: "right", fontSize: fontSizes.sm, fontWeight: "900", color: colors.text },
  invoiceTotals: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 8,
  },
  invoiceTotalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  invoiceTotalLabel: { color: colors.textMuted, fontSize: fontSizes.sm, fontWeight: "800" },
  invoiceTotalValue: { color: colors.text, fontSize: fontSizes.sm, fontWeight: "900" },
  invoiceTotalRowStrong: { paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  invoiceTotalStrongLabel: { color: colors.text, fontSize: fontSizes.md, fontWeight: "900" },
  invoiceTotalStrongValue: { color: colors.primary, fontSize: fontSizes.lg, fontWeight: "900" },
  invoiceFooterHint: { alignItems: "center", paddingTop: spacing.sm },
  invoiceFooterText: { fontSize: fontSizes.sm, fontWeight: "800", color: colors.textMuted },

  billingCard: {
    width: "100%",
    height: "92%",
    minHeight: 320,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    overflow: "hidden",
    ...shadows.card,
  },
  billingButtonsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  billingBtn: {
    flex: 1,
    minHeight: 56,
    borderRadius: radii.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  billingBtnCash: { backgroundColor: "#2E7D32" },
  billingBtnInvoice: { backgroundColor: "#1976D2" },
  billingBtnDisabled: { opacity: 0.6 },
  billingBtnTitle: { color: colors.white, fontSize: fontSizes.md, fontWeight: "900" },
  billingBtnSub: { color: "rgba(255,255,255,0.95)", fontSize: fontSizes.sm, fontWeight: "800", marginTop: 2 },
});
