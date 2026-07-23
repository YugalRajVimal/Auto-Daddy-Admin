import { StripeCheckoutModal } from "@/components/shop-owner/stripe-checkout-modal";
import { AppBar, ModalKeyboardRoot, TabScreenFrame, useToast } from "@/components/reusables";
import { colors, fontSizes, gradients, radii, shadows, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { getJson } from "@/lib/api";
import { getAutoShopOwnerProfile } from "@/lib/auth";
import {
  extractPendingSubscriptionCheckout,
  findSubscriptionByOrderId,
  isSubscriptionPaymentPaid,
} from "@/lib/auto-shop-owner-api";
import {
  fetchWebsiteTemplates as fetchAutoshopWebsiteTemplates,
  selectWebsiteTemplate,
} from "@/lib/shop-owner-website-api";
import {
  createSubscriptionCheckout,
  extractCheckoutSession,
  formatSubscriptionApiError,
} from "@/lib/shop-owner-subscription-api";
import type { SubscriptionCheckoutSession } from "@/types/website-subscription";
import { canOpenStripeCheckout } from "@/lib/stripe-payment";
import { formatCurrencyAmount, getCurrencyCode } from "@/lib/currency";
import { formatStoredNationalPhone } from "@/lib/dial-countries";
import type { AutoShopOwnerProfileResponse } from "@/types/auto-shop-owner-profile";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  LayoutAnimation,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

type WebsiteTemplate = {
  id: string;
  name: string;
  desc?: string;
  templateLink?: string;
};

const WINDOW_H = Dimensions.get("window").height;

const BLUE = {
  card: "#E8F2FF",
  cardDeep: "#D7E7FF",
  bar: "#1D4ED8",
  barDark: "#1E3A8A",
  accent: "#2563EB",
  text: "#1E3A8A",
  tableHead: "#BFDBFE",
} as const;

const INVOICE_SERVICES = [
  {
    id: "domain",
    service: "Domain",
    description: "Domain cost for the current subscription period",
    amount: 18,
  },
  {
    id: "website",
    service: "Website",
    description: "Website subscription for 365 days",
    amount: 365,
  },
] as const;

const WEBSITE_SUBSCRIPTION_DAYS = 365;
const WEBSITE_SUBSCRIPTION_AMOUNT =
  INVOICE_SERVICES.find((row) => row.id === "website")?.amount ?? 365;

function buildSubscriptionReferenceId() {
  return `web-sub-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

function animateLayout() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

type InvoiceBillTo = {
  name: string;
  addressLine: string;
  hst: string;
  phone: string;
};

function buildInvoiceBillTo(
  data: AutoShopOwnerProfileResponse["data"] | null,
  metaName: string | null | undefined
): InvoiceBillTo {
  const biz = data?.businessProfile;
  const user = data?.userProfile;

  const name =
    biz?.businessName?.trim() || user?.name?.trim() || metaName?.trim() || "—";

  const street = biz?.businessAddress?.trim() || user?.address?.trim() || "";
  const pincode = biz?.pincode?.trim() || user?.pincode?.trim() || "";
  const addressLine = [street, pincode].filter(Boolean).join(", ") || "—";

  const hst = biz?.businessHSTNumber?.trim() || "—";

  const phoneRaw = biz?.businessPhone?.trim() || user?.phone?.trim() || "";
  const phone = phoneRaw ? formatStoredNationalPhone(phoneRaw) || phoneRaw : "—";

  return { name, addressLine, hst, phone };
}

const HERO_FEATURES = [
  "Make your business visible as desire",
  "Marketplace for current offerings",
  "Connect with regular clients",
  "Control your brand identity",
  "One business e-mail",
] as const;

function obj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function toTemplate(raw: unknown): WebsiteTemplate | null {
  const o = obj(raw);
  if (!o) return null;
  const id =
    typeof o._id === "string"
      ? o._id
      : typeof o.id === "string"
        ? o.id
        : "";
  const name =
    typeof o.name === "string"
      ? o.name
      : typeof o.templateName === "string"
        ? o.templateName
        : "Template";
  const templateLink =
    typeof o.templateLink === "string"
      ? o.templateLink
      : typeof o.previewUrl === "string"
        ? o.previewUrl
        : undefined;
  const desc =
    typeof o.desc === "string"
      ? o.desc
      : typeof o.description === "string"
        ? o.description
        : undefined;
  if (!id && !name) return null;
  return { id: id || name, name, desc, templateLink };
}

const TEMPLATE_LIST_KEYS = ["templates", "websiteTemplates", "data", "items", "rows"] as const;

function extractTemplateList(source: Record<string, unknown>): unknown[] {
  for (const key of TEMPLATE_LIST_KEYS) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
}

function parseWebsiteTemplatesResponse(payload: unknown): {
  hasPurchasedTemplate: boolean | null;
  templates: WebsiteTemplate[];
} {
  const envelope = obj(payload);
  if (!envelope) {
    return { hasPurchasedTemplate: null, templates: [] };
  }

  const hasPurchasedTemplate =
    typeof envelope.hasPurchasedTemplate === "boolean" ? envelope.hasPurchasedTemplate : null;

  let rawList: unknown[] = [];
  const nested = envelope.data;
  if (Array.isArray(nested)) {
    rawList = nested;
  } else if (nested && typeof nested === "object") {
    rawList = extractTemplateList(nested as Record<string, unknown>);
  }
  if (rawList.length === 0) {
    rawList = extractTemplateList(envelope);
  }

  const selected = toTemplate(envelope.selectedTemplate ?? envelope.template);
  const parsedList = rawList.map(toTemplate).filter(Boolean) as WebsiteTemplate[];
  const templates = selected
    ? [selected, ...parsedList.filter((t) => t.id !== selected.id)]
    : parsedList;

  return { hasPurchasedTemplate, templates };
}

function GoldCoinIcon() {
  const { meta } = useAuth();
  return (
    <View style={styles.coin}>
      <Text style={styles.coinText}>{formatCurrencyAmount(1, meta?.countryCode, { fallback: "1" })}</Text>
    </View>
  );
}

type UpgradeAccountPanelProps = {
  billTo: InvoiceBillTo;
  profileLoading: boolean;
  invoiceExpanded: boolean;
  onToggleInvoice: () => void;
};

function UpgradeAccountPanel({
  billTo,
  profileLoading,
  invoiceExpanded,
  onToggleInvoice,
}: UpgradeAccountPanelProps) {
  const { meta } = useAuth();
  const subTotal = INVOICE_SERVICES.reduce((s, r) => s + r.amount, 0);
  const hst = 49;
  const totalDue = subTotal + hst;
  const daysFilled = 0.62;
  const currencyCode = getCurrencyCode(meta?.countryCode);
  const formatAmount = (amount: number, decimals = 0) =>
    formatCurrencyAmount(amount, meta?.countryCode, {
      fallback: "—",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  return (
    <View style={upgradeStyles.wrap}>
      <LinearGradient
        colors={["#FFFFFF", BLUE.cardDeep, BLUE.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={upgradeStyles.planCard}
      >
        <View style={upgradeStyles.planTopRow}>
          <View style={upgradeStyles.planTitleBlock}>
            <View style={upgradeStyles.planIconWrap}>
              <Ionicons name="globe-outline" size={20} color={colors.white} />
            </View>
            <Text style={upgradeStyles.planLabel}>Your Website Plan</Text>
          </View>
          <View style={upgradeStyles.openingPill}>
            <Ionicons name="calendar-outline" size={12} color={BLUE.accent} />
            <Text style={upgradeStyles.planOpening}>18 May 2026</Text>
          </View>
        </View>

        <View style={upgradeStyles.priceBlock}>
          <Text style={upgradeStyles.planPrice}>{formatAmount(1)}</Text>
          <Text style={upgradeStyles.planPriceUnit}>/ per day</Text>
        </View>

        <LinearGradient
          colors={[BLUE.barDark, BLUE.bar, "#3B82F6"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={upgradeStyles.walletBar}
        >
          <View style={upgradeStyles.walletIcon}>
            <Ionicons name="wallet-outline" size={16} color={colors.white} />
          </View>
          <Text style={upgradeStyles.walletLabel}>Wallet Balance</Text>
          <View style={upgradeStyles.walletDash} />
          <Text style={upgradeStyles.walletAmount}>{`${formatAmount(275)} ${currencyCode}`}</Text>
        </LinearGradient>

        <View style={upgradeStyles.daysRow}>
          <View style={upgradeStyles.daysHeader}>
            <Text style={upgradeStyles.daysLabel}>Days Remaining</Text>
            <Text style={upgradeStyles.daysHint}>~228 days</Text>
          </View>
          <View style={upgradeStyles.progressOuter}>
            <View style={upgradeStyles.progressTrack}>
              <View style={[upgradeStyles.progressSeg, upgradeStyles.progressBlue, { flex: daysFilled }]} />
              <View style={[upgradeStyles.progressSeg, upgradeStyles.progressTeal, { flex: 0.22 }]} />
              <View style={[upgradeStyles.progressSeg, upgradeStyles.progressWarn, { flex: Math.max(0.08, 1 - daysFilled - 0.22) }]} />
            </View>
          </View>
        </View>
      </LinearGradient>

      <Pressable
        onPress={invoiceExpanded ? onToggleInvoice : undefined}
        disabled={!invoiceExpanded}
        style={upgradeStyles.sectionTitleRow}
      >
        <View style={upgradeStyles.sectionTitleLeft}>
          <View style={upgradeStyles.sectionIcon}>
            <Ionicons name="receipt-outline" size={16} color={BLUE.accent} />
          </View>
          <Text style={upgradeStyles.sectionTitle}>Subscription Invoice</Text>
        </View>
        {invoiceExpanded ? (
          <View style={upgradeStyles.collapseChip}>
            <Text style={upgradeStyles.collapseChipText}>Collapse</Text>
            <Ionicons name="chevron-up" size={14} color={BLUE.accent} />
          </View>
        ) : null}
      </Pressable>

      {!invoiceExpanded ? (
        <Pressable
          onPress={() => {
            animateLayout();
            onToggleInvoice();
          }}
          style={({ pressed }) => [upgradeStyles.collapsedRow, pressed && upgradeStyles.pressed]}
        >
          <View style={upgradeStyles.collapsedLeft}>
            <View style={upgradeStyles.collapsedIcon}>
              <Ionicons name="document-text-outline" size={20} color={BLUE.accent} />
            </View>
            <View style={upgradeStyles.collapsedTextBlock}>
              <Text style={upgradeStyles.collapsedInvoice}>Invoice #0002</Text>
              <Text style={upgradeStyles.collapsedDue}>Tap to view breakdown</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </View>
          <LinearGradient
            colors={[BLUE.barDark, BLUE.bar]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={upgradeStyles.collapsedAmount}
          >
            <Text style={upgradeStyles.collapsedDueLabel}>Due</Text>
            <Text style={upgradeStyles.collapsedAmountText}>{formatAmount(totalDue)}</Text>
          </LinearGradient>
        </Pressable>
      ) : (
        <View style={upgradeStyles.expandedCard}>
          <LinearGradient
            colors={["#EFF6FF", "#FFFFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={upgradeStyles.invoiceHeader}
          >
            <View>
              <Text style={upgradeStyles.brand}>autodaddy</Text>
              <Text style={upgradeStyles.brandTagline}>Website subscription</Text>
            </View>
            {profileLoading ? (
              <ActivityIndicator size="small" color={BLUE.accent} />
            ) : (
              <View style={upgradeStyles.phonePill}>
                <Ionicons name="call-outline" size={13} color={BLUE.accent} />
                <Text style={upgradeStyles.phone}>{billTo.phone}</Text>
              </View>
            )}
          </LinearGradient>

          <View style={upgradeStyles.billGrid}>
            <View style={upgradeStyles.billBox}>
              <Text style={upgradeStyles.billBoxLabel}>Bill To</Text>
              {profileLoading ? (
                <Text style={upgradeStyles.billLine}>Loading…</Text>
              ) : (
                <>
                  <Text style={upgradeStyles.billName} numberOfLines={2}>
                    {billTo.name}
                  </Text>
                  <Text style={upgradeStyles.billLine} numberOfLines={3}>
                    {billTo.addressLine}
                  </Text>
                  <View style={upgradeStyles.hstChip}>
                    <Text style={upgradeStyles.hstChipText}>HST {billTo.hst}</Text>
                  </View>
                </>
              )}
            </View>
            <View style={[upgradeStyles.billBox, upgradeStyles.billBoxMeta]}>
              <Text style={upgradeStyles.billBoxLabel}>Invoice</Text>
              <Text style={upgradeStyles.metaLine}>AD 0002</Text>
              <Text style={upgradeStyles.metaMuted}>18 May 2026</Text>
              <View style={upgradeStyles.dueHighlight}>
                <Text style={upgradeStyles.dueHighlightLabel}>Amount due</Text>
                <Text style={upgradeStyles.dueHighlightValue}>{formatAmount(totalDue, 2)}</Text>
              </View>
            </View>
          </View>

          <View style={upgradeStyles.table}>
            <LinearGradient
              colors={[BLUE.tableHead, "#DBEAFE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={upgradeStyles.tableHead}
            >
              <Text style={[upgradeStyles.th, upgradeStyles.thService]}>Service</Text>
              <Text style={[upgradeStyles.th, upgradeStyles.thDesc]}>Description</Text>
              <Text style={[upgradeStyles.th, upgradeStyles.thAmt]}>Amount</Text>
            </LinearGradient>

            {INVOICE_SERVICES.map((row, index) => (
              <View
                key={row.id}
                style={[upgradeStyles.tableRow, index % 2 === 1 && upgradeStyles.tableRowAlt]}
              >
                <View style={upgradeStyles.serviceBadge}>
                  <Text style={upgradeStyles.serviceBadgeText}>{row.service}</Text>
                </View>
                <Text style={[upgradeStyles.td, upgradeStyles.tdDescCol]}>{row.description}</Text>
                <Text style={[upgradeStyles.td, upgradeStyles.tdAmtCol]}>{formatAmount(row.amount)}</Text>
              </View>
            ))}
          </View>

          <LinearGradient
            colors={[BLUE.barDark, BLUE.bar]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={upgradeStyles.totalsCard}
          >
            <View style={upgradeStyles.totalLine}>
              <Text style={upgradeStyles.totalLabelLight}>Sub Total</Text>
              <Text style={upgradeStyles.totalValueLight}>{formatAmount(subTotal)}</Text>
            </View>
            <View style={upgradeStyles.totalLine}>
              <Text style={upgradeStyles.totalLabelLight}>HST</Text>
              <Text style={upgradeStyles.totalValueLight}>{formatAmount(hst)}</Text>
            </View>
            <View style={upgradeStyles.totalDivider} />
            <View style={upgradeStyles.totalLine}>
              <Text style={upgradeStyles.totalDueLabelLight}>Total Due</Text>
              <Text style={upgradeStyles.totalDueValueLight}>{`${formatAmount(totalDue)} ${currencyCode}`}</Text>
            </View>
          </LinearGradient>

          {/* <View style={upgradeStyles.readOnlyBadge}>
            <Ionicons name="lock-closed-outline" size={12} color={colors.textMuted} />
            <Text style={upgradeStyles.readOnlyNote}>Read-only invoice</Text>
          </View> */}
        </View>
      )}
    </View>
  );
}

export default function WebsitePage() {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { token, meta } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [templates, setTemplates] = useState<WebsiteTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [webLoading, setWebLoading] = useState(false);
  const [webError, setWebError] = useState(false);
  const [upgradeView, setUpgradeView] = useState(false);
  const [invoiceExpanded, setInvoiceExpanded] = useState(false);
  const [profileData, setProfileData] = useState<AutoShopOwnerProfileResponse["data"] | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [checkout, setCheckout] = useState<SubscriptionCheckoutSession | null>(null);

  const isOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";

  const invoiceBillTo = useMemo(
    () => buildInvoiceBillTo(profileData, meta?.name),
    [meta?.name, profileData]
  );

  const loadProfile = useCallback(async () => {
    if (!token || !isOwner) {
      return;
    }
    setProfileLoading(true);
    try {
      const cached = await getAutoShopOwnerProfile<AutoShopOwnerProfileResponse>();
      if (cached?.data) {
        setProfileData(cached.data);
      }
      const res = await getJson<AutoShopOwnerProfileResponse>("/api/auto-shop-owner/profile", {
        authToken: token,
      });
      if (res.ok && res.data?.data) {
        setProfileData(res.data.data);
      }
    } catch {
      showToast("Could not load profile for invoice.", { type: "error" });
    } finally {
      setProfileLoading(false);
    }
  }, [isOwner, showToast, token]);

  const confirmSubscriptionPayment = useCallback(
    async (orderId: string) => {
      if (!token || !isOwner) return;
      const pollDelaysMs = [0, 2000, 4000, 6000];
      for (const delayMs of pollDelaysMs) {
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        try {
          const res = await getJson<AutoShopOwnerProfileResponse>(
            "/api/auto-shop-owner/profile",
            { authToken: token }
          );
          if (res.ok && res.data?.data) {
            setProfileData(res.data.data);
            const sub = findSubscriptionByOrderId(
              res.data.data.businessProfile?.subscriptions,
              orderId
            );
            if (sub && isSubscriptionPaymentPaid(sub.paymentStatus)) {
              setCheckout(null);
              showToast(`Payment successful (${orderId}).`, { type: "success" });
              return;
            }
          }
        } catch {
          // Retry on next poll.
        }
      }
      showToast(
        "Payment not confirmed yet. Complete payment in Stripe, then pull to refresh. Your shop backend must receive the Stripe webhook to mark the order Paid.",
        { type: "info" }
      );
    },
    [isOwner, showToast, token]
  );

  const openSubscriptionCheckout = useCallback(
    (session: SubscriptionCheckoutSession) => {
      if (canOpenStripeCheckout(session)) {
        setCheckout(session);
        return;
      }
      showToast(
        "Stripe checkout URL not returned. The backend must create a Stripe Checkout Session and return stripeCheckoutUrl.",
        { type: "error" }
      );
    },
    [showToast]
  );

  const loadTemplate = useCallback(async () => {
    if (!token || !isOwner) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetchAutoshopWebsiteTemplates(token);
      if (!res.ok) {
        const msg =
          res.data && typeof res.data === "object" && "message" in res.data
            ? String((res.data as { message?: string }).message ?? "")
            : "";
        showToast(msg || "Could not load website template.", { type: "error" });
        setTemplates([]);
        setSelectedTemplateId(null);
        return;
      }

      const { templates: merged } = parseWebsiteTemplatesResponse(res.data);
      setTemplates(merged);
      setSelectedTemplateId((prev) => {
        if (prev && merged.some((t) => t.id === prev)) {
          return prev;
        }
        return null;
      });
    } catch {
      showToast("Network error loading website template.", { type: "error" });
      setTemplates([]);
      setSelectedTemplateId(null);
    } finally {
      setLoading(false);
    }
  }, [isOwner, showToast, token]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates]
  );

  useFocusEffect(
    useCallback(() => {
      void loadTemplate();
      if (isOwner) {
        void loadProfile();
      }
      return undefined;
    }, [isOwner, loadProfile, loadTemplate])
  );

  useEffect(() => {
    if (upgradeView && isOwner) {
      void loadProfile();
    }
  }, [isOwner, loadProfile, upgradeView]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadTemplate(), upgradeView && isOwner ? loadProfile() : Promise.resolve()]);
    } finally {
      setRefreshing(false);
    }
  }, [isOwner, loadProfile, loadTemplate, upgradeView]);

  useEffect(() => {
    setWebError(false);
    setWebLoading(false);
  }, [selectedTemplate?.templateLink]);

  const handleOpenPreview = useCallback(() => {
    if (!selectedTemplate?.templateLink) {
      showToast("Template link not available.", { type: "error" });
      return;
    }
    Linking.openURL(selectedTemplate.templateLink).catch(() => {
      showToast("Could not open template link.", { type: "error" });
    });
  }, [selectedTemplate?.templateLink, showToast]);

  const handleMakePayment = useCallback(async () => {
    if (!token) {
      showToast("Please sign in to continue.", { type: "error" });
      return;
    }

    const pending = extractPendingSubscriptionCheckout(profileData?.businessProfile);
    if (pending) {
      showToast("Opening pending payment…", { type: "info" });
      openSubscriptionCheckout(pending);
      return;
    }

    const websiteTemplateId =
      selectedTemplateId?.trim() ||
      profileData?.businessProfile?.websiteTemplateId?.trim() ||
      "";
    if (!websiteTemplateId) {
      showToast("Please select a website template before payment.", { type: "error" });
      return;
    }

    setPaymentLoading(true);
    try {
      if (websiteTemplateId) {
        await selectWebsiteTemplate(token, websiteTemplateId);
      }
      const successUrl = "https://app.autodaddy.ca/shop/my-website?checkout=success";
      const cancelUrl = "https://app.autodaddy.ca/shop/my-website?checkout=cancel";
      const res = await createSubscriptionCheckout(token, {
        planId: "yearly",
        successUrl,
        cancelUrl,
      });
      const data = res.data;
      const succeeded = res.ok && data?.success !== false;
      if (!succeeded) {
        showToast(formatSubscriptionApiError(data), { type: "error" });
        return;
      }
      const checkoutSession = extractCheckoutSession(data);
      if (!checkoutSession) {
        showToast(data?.message || "Payment session not returned.", { type: "error" });
        return;
      }
      if (data?.message) {
        showToast(data.message, { type: "info" });
      }
      openSubscriptionCheckout(checkoutSession);
    } catch {
      showToast("Network error starting payment.", { type: "error" });
    } finally {
      setPaymentLoading(false);
    }
  }, [openSubscriptionCheckout, profileData?.businessProfile, selectedTemplateId, showToast, token]);

  const handleProceed = useCallback(() => {
    if (!selectedTemplate) {
      showToast("Please select a website template.", { type: "error" });
      return;
    }
    if (!upgradeView) {
      animateLayout();
      setUpgradeView(true);
      setInvoiceExpanded(false);
      return;
    }
    if (!invoiceExpanded) {
      animateLayout();
      setInvoiceExpanded(true);
      return;
    }
    void handleMakePayment();
  }, [handleMakePayment, invoiceExpanded, selectedTemplate, showToast, upgradeView]);

  const handleBackFromUpgrade = useCallback(() => {
    if (upgradeView) {
      animateLayout();
      setUpgradeView(false);
      setInvoiceExpanded(false);
      return;
    }
    router.back();
  }, [upgradeView]);

  const handleToggleInvoice = useCallback(() => {
    animateLayout();
    setInvoiceExpanded((v) => !v);
  }, []);

  const webUrl = (selectedTemplate?.templateLink ?? "").trim();
  const canPreview = Boolean(webUrl);
  const previewHeight = Math.round(Math.min(Math.max(windowHeight * 0.38, 280), 420));
  const proceedLabel = !upgradeView
    ? "Proceed"
    : invoiceExpanded
      ? "Make Payment"
      : "View invoice";

  const templateLabel = selectedTemplate?.name ?? "-select-";
  const screenTitle = upgradeView ? "Upgrade Account" : "Website";

  return (
    <TabScreenFrame
      backgroundColor={colors.bgProfile}
      headerGradient={gradients.websiteHeader}
      bottomInsetExtra={spacing.lg}
      header={
        <AppBar
          title={screenTitle}
          leadingMode="back"
          onBackPress={handleBackFromUpgrade}
        />
      }
      scroll={false}
    >
      <View style={styles.body}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.md },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {upgradeView ? (
            <>
              <UpgradeAccountPanel
                billTo={invoiceBillTo}
                profileLoading={profileLoading}
                invoiceExpanded={invoiceExpanded}
                onToggleInvoice={handleToggleInvoice}
              />
              <Pressable
                style={[styles.proceedButton, styles.proceedButtonFlush]}
                onPress={handleProceed}
                disabled={paymentLoading}
              >
                <LinearGradient
                  colors={[colors.primaryDark, colors.primary, "#4F8CFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.proceedButtonGradient,
                    paymentLoading && styles.proceedButtonDisabled,
                  ]}
                >
                  {paymentLoading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Ionicons
                      name={invoiceExpanded ? "card-outline" : "document-text-outline"}
                      size={20}
                      color={colors.white}
                    />
                  )}
                  <Text style={styles.proceedButtonText}>
                    {paymentLoading ? "Starting payment…" : proceedLabel}
                  </Text>
                </LinearGradient>
              </Pressable>
            </>
          ) : (
            <>
              <LinearGradient
                colors={["#FFFFFF", "#E8F4FF", "#DDF4FF"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.hero}
              >
                <Text style={styles.heroTitle}>
                  Everything you need for{"\n"}dream of your Business website
                </Text>

                <View style={styles.pricingRow}>
                  <Text style={styles.pricingText}>with cost of </Text>
                  <GoldCoinIcon />
                  <Text style={styles.pricingText}> a day</Text>
                </View>

                <Text style={styles.visionLine}>
                  <Text style={styles.visionBold}>Have a clear vision of </Text>
                  leadership look like
                </Text>
                <Text style={styles.visionAccent}>more values-less stress</Text>

                <View style={styles.automationPill}>
                  <Text style={styles.automationPillText}>a successful website automation</Text>
                </View>

                <View style={styles.featureList}>
                  {HERO_FEATURES.map((line) => (
                    <Text key={line} style={styles.featureItem}>
                      * {line}
                    </Text>
                  ))}
                </View>
              </LinearGradient>

              <Text style={styles.previewSectionTitle}>Select Your Website Preview</Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Website Template</Text>
                <Pressable
                  style={({ pressed }) => [styles.selectRow, pressed && styles.selectRowPressed]}
                  onPress={() => setPickerOpen(true)}
                  disabled={loading || templates.length === 0}
                >
                  <Text
                    style={[
                      styles.selectText,
                      !selectedTemplate && styles.selectPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {loading ? "Loading…" : templateLabel}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                </Pressable>
              </View>

              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <View style={styles.previewHeaderSpacer} />
                  <Pressable
                    style={[styles.livePreviewBtn, !canPreview && styles.livePreviewBtnDisabled]}
                    onPress={handleOpenPreview}
                    disabled={!canPreview}
                  >
                    <Text style={styles.livePreviewText}>Live Preview</Text>
                  </Pressable>
                </View>

                <View style={[styles.previewWrap, { minHeight: previewHeight }]}>
                  {loading ? (
                    <View style={styles.centerBox}>
                      <ActivityIndicator color={colors.primary} />
                    </View>
                  ) : !selectedTemplate ? (
                    <View style={styles.placeholderBanner}>
                      <Text style={styles.placeholderBannerText}>
                        Please select a template from the dropdown to see preview.
                      </Text>
                    </View>
                  ) : !canPreview ? (
                    <View style={styles.placeholderBanner}>
                      <Text style={styles.placeholderBannerText}>
                        This template doesn’t have a preview link.
                      </Text>
                    </View>
                  ) : webError ? (
                    <View style={styles.placeholderBanner}>
                      <Text style={styles.placeholderBannerText}>
                        Could not load preview. Try “Live Preview” instead.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.webWrap}>
                      <WebView
                        source={{ uri: webUrl }}
                        originWhitelist={["*"]}
                        javaScriptEnabled
                        domStorageEnabled
                        setSupportMultipleWindows={false}
                        mixedContentMode="always"
                        onLoadStart={() => {
                          setWebError(false);
                          setWebLoading(true);
                        }}
                        onLoadEnd={() => setWebLoading(false)}
                        onError={() => {
                          setWebLoading(false);
                          setWebError(true);
                          showToast("Could not load website preview.", { type: "error" });
                        }}
                        onHttpError={() => {
                          setWebLoading(false);
                          setWebError(true);
                          showToast("Preview blocked or unavailable.", { type: "error" });
                        }}
                        style={styles.webView}
                      />
                      {webLoading ? (
                        <View pointerEvents="none" style={styles.webLoadingOverlay}>
                          <ActivityIndicator color={colors.primary} />
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              </View>

              <Pressable style={styles.proceedButton} onPress={handleProceed}>
                <Text style={styles.proceedButtonText}>{proceedLabel}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>

      <Modal
        transparent
        visible={pickerOpen}
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <ModalKeyboardRoot onBackdropPress={() => setPickerOpen(false)} scrimColor="rgba(0,0,0,0.42)">
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Website Template</Text>
              <Pressable
                onPress={() => setPickerOpen(false)}
                hitSlop={10}
                accessibilityLabel="Close template picker"
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>
            {templates.length === 0 ? (
              <View style={styles.modalEmptyWrap}>
                <Text style={styles.modalEmpty}>No templates available.</Text>
              </View>
            ) : (
              <FlatList
                data={templates}
                keyExtractor={(t) => t.id}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                style={[styles.modalList, { maxHeight: WINDOW_H * 0.5 }]}
                contentContainerStyle={styles.modalListContent}
                renderItem={({ item: t }) => {
                  const selected = t.id === selectedTemplateId;
                  return (
                    <Pressable
                      style={({ pressed }) => [
                        styles.modalRow,
                        pressed && styles.modalRowPressed,
                        selected && styles.modalRowSelected,
                      ]}
                      onPress={() => {
                        setSelectedTemplateId(t.id);
                        setPickerOpen(false);
                      }}
                    >
                      <Text
                        style={[styles.modalRowText, selected && styles.modalRowTextSelected]}
                        numberOfLines={2}
                      >
                        {t.name}
                      </Text>
                      {selected ? (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      ) : null}
                    </Pressable>
                  );
                }}
              />
            )}
          </View>
        </ModalKeyboardRoot>
      </Modal>

      <StripeCheckoutModal
        visible={Boolean(checkout)}
        session={checkout}
        onClose={() => {
          const orderId = checkout?.orderId;
          setCheckout(null);
          if (orderId) {
            void confirmSubscriptionPayment(orderId);
          }
        }}
        onComplete={() => {
          const orderId = checkout?.orderId;
          setCheckout(null);
          if (orderId) {
            void confirmSubscriptionPayment(orderId);
          }
        }}
        onError={(msg) => showToast(msg, { type: "error" })}
      />
    </TabScreenFrame>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.sm,
    backgroundColor: colors.bgProfile,
    position: "relative",
  },
  scroll: { flex: 1 },
  content: {
    gap: spacing.lg,
    flexGrow: 1,
  },
  hero: {
    borderRadius: radii.hero,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: "center",
    overflow: "hidden",
  },
  heroTitle: {
    fontSize: fontSizes.display,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
    lineHeight: 30,
    marginBottom: spacing.md,
  },
  pricingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: spacing.md,
  },
  pricingText: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.danger,
  },
  coin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F5C542",
    borderWidth: 2,
    borderColor: "#D4A017",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  coinText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#7C5E10",
  },
  visionLine: {
    fontSize: fontSizes.md,
    color: colors.text,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  visionBold: {
    fontWeight: "800",
    color: colors.text,
  },
  visionAccent: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  automationPill: {
    backgroundColor: colors.primary,
    borderRadius: radii.round,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    maxWidth: "100%",
  },
  automationPillText: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.white,
    textAlign: "center",
  },
  featureList: {
    alignSelf: "stretch",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  featureItem: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 20,
  },
  previewSectionTitle: {
    ...typography.cardTitle,
    color: colors.primary,
    fontWeight: "900",
    textAlign: "center",
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textMuted,
  },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  selectRowPressed: { opacity: 0.9 },
  selectText: {
    flex: 1,
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: colors.text,
    marginRight: spacing.sm,
  },
  selectPlaceholder: {
    color: colors.textLight,
    fontWeight: "500",
  },
  previewCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.hero,
    backgroundColor: colors.white,
    overflow: "hidden",
    padding: spacing.md,
    gap: spacing.sm,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  previewHeaderSpacer: { flex: 1 },
  livePreviewBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
    backgroundColor: colors.primary,
  },
  livePreviewBtnDisabled: { opacity: 0.45 },
  livePreviewText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.white,
  },
  previewWrap: {
    borderRadius: radii.xxl,
    overflow: "hidden",
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  centerBox: {
    flex: 1,
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
  },
  placeholderBanner: {
    flex: 1,
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  placeholderBannerText: {
    fontSize: fontSizes.base,
    fontWeight: "700",
    color: colors.primaryBlue900,
    textAlign: "center",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  mutedText: {
    ...typography.bodyMuted,
  },
  webWrap: { flex: 1, minHeight: 200 },
  webView: { flex: 1, backgroundColor: colors.white },
  webLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(238,244,255,0.75)",
  },
  proceedButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.xxl,
    overflow: "hidden",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    ...shadows.card,
  },
  proceedButtonFlush: {
    backgroundColor: "transparent",
    padding: 0,
  },
  proceedButtonGradient: {
    width: "100%",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.xxl,
  },
  proceedButtonDisabled: {
    opacity: 0.75,
  },
  proceedButtonText: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.white,
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "88%",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    ...shadows.card,
  },
  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.trackBg,
    marginBottom: spacing.sm,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "900",
    color: colors.primary,
  },
  modalList: { flexGrow: 0 },
  modalListContent: { paddingBottom: spacing.md },
  modalEmptyWrap: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  modalEmpty: {
    ...typography.bodyMuted,
    textAlign: "center",
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalRowPressed: { opacity: 0.85 },
  modalRowSelected: {
    backgroundColor: colors.primaryMutedBg,
    marginHorizontal: -4,
    paddingHorizontal: 8,
    borderRadius: radii.lg,
    borderBottomWidth: 0,
  },
  modalRowText: {
    flex: 1,
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: colors.text,
  },
  modalRowTextSelected: {
    fontWeight: "800",
    color: colors.primary,
  },
});

const upgradeStyles = StyleSheet.create({
  wrap: {
    gap: spacing.xl,
    paddingTop: spacing.sm,
  },
  planCard: {
    borderRadius: radii.hero,
    padding: spacing.xl,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.1)",
    ...shadows.card,
  },
  planTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  planTitleBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  planIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: BLUE.bar,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  planLabel: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: BLUE.text,
    flexShrink: 1,
  },
  openingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.round,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.12)",
  },
  planOpening: {
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: BLUE.barDark,
  },
  priceBlock: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  planPrice: {
    fontSize: 40,
    fontWeight: "900",
    color: BLUE.barDark,
    letterSpacing: -1,
    lineHeight: 42,
  },
  planPriceUnit: {
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 6,
  },
  walletBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  walletIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  walletLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    flexShrink: 1,
  },
  walletDash: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
    marginHorizontal: spacing.xs,
  },
  walletAmount: {
    fontSize: fontSizes.md,
    fontWeight: "900",
    color: colors.white,
  },
  daysRow: {
    gap: spacing.sm,
  },
  daysHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  daysLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: BLUE.accent,
  },
  daysHint: {
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: colors.textMuted,
  },
  progressOuter: {
    backgroundColor: colors.white,
    borderRadius: radii.round,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.08)",
  },
  progressTrack: {
    flexDirection: "row",
    height: 10,
    borderRadius: radii.round,
    overflow: "hidden",
  },
  progressSeg: {
    height: "100%",
  },
  progressBlue: { backgroundColor: "#2563EB" },
  progressTeal: { backgroundColor: "#14B8A6" },
  progressWarn: { backgroundColor: "#F97316" },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryMutedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.text,
  },
  collapseChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.round,
    backgroundColor: colors.primaryMutedBg,
  },
  collapseChipText: {
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: BLUE.accent,
  },
  collapsedRow: {
    flexDirection: "row",
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.12)",
    backgroundColor: colors.white,
    ...shadows.card,
  },
  collapsedLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  collapsedIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryMutedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  collapsedTextBlock: {
    flex: 1,
    gap: 2,
  },
  collapsedInvoice: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.text,
  },
  collapsedDue: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
    color: colors.textMuted,
  },
  collapsedAmount: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 88,
  },
  collapsedDueLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  collapsedAmountText: {
    fontSize: fontSizes.xl,
    fontWeight: "900",
    color: colors.white,
    marginTop: 2,
  },
  expandedCard: {
    backgroundColor: colors.white,
    borderRadius: radii.hero,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    gap: spacing.lg,
    ...shadows.card,
  },
  invoiceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  brand: {
    fontSize: fontSizes.xl,
    fontWeight: "900",
    color: BLUE.barDark,
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: 2,
  },
  phonePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.round,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phone: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: BLUE.barDark,
  },
  billGrid: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  billBox: {
    flex: 1,
    backgroundColor: colors.bgProfile,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  billBoxMeta: {
    backgroundColor: colors.primaryMutedBg,
    borderColor: "rgba(37,99,235,0.12)",
  },
  billBoxLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  billName: {
    fontSize: fontSizes.md,
    fontWeight: "900",
    color: colors.text,
    lineHeight: 20,
  },
  billLine: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
    color: colors.textMuted,
    lineHeight: 16,
  },
  hstChip: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hstChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: BLUE.barDark,
  },
  metaLine: {
    fontSize: fontSizes.md,
    fontWeight: "900",
    color: BLUE.barDark,
  },
  metaMuted: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
    color: colors.textMuted,
  },
  dueHighlight: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(37,99,235,0.15)",
  },
  dueHighlightLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  dueHighlightValue: {
    fontSize: fontSizes.lg,
    fontWeight: "900",
    color: BLUE.barDark,
    marginTop: 2,
  },
  table: {
    marginHorizontal: spacing.lg,
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableHead: {
    flexDirection: "row",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  th: {
    fontSize: fontSizes.xs,
    fontWeight: "900",
    color: BLUE.barDark,
    letterSpacing: 0.3,
  },
  thService: { width: "24%" },
  thDesc: { flex: 1 },
  thAmt: { width: "18%", textAlign: "right" },
  tableRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  tableRowAlt: {
    backgroundColor: "#F8FAFC",
  },
  serviceBadge: {
    width: "24%",
    alignSelf: "flex-start",
    backgroundColor: colors.primaryMutedBg,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  serviceBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: BLUE.barDark,
  },
  td: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
    lineHeight: 16,
  },
  tdDescCol: {
    flex: 1,
    color: colors.textMuted,
  },
  tdAmtCol: {
    width: "18%",
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  totalsCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabelLight: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
  totalValueLight: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.white,
  },
  totalDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginVertical: 2,
  },
  totalDueLabelLight: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.white,
  },
  totalDueValueLight: {
    fontSize: fontSizes.xl,
    fontWeight: "900",
    color: colors.white,
  },
  readOnlyBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingBottom: spacing.lg,
  },
  readOnlyNote: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
    color: colors.textMuted,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
});
