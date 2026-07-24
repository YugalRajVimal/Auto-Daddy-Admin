import {
  DomainPanel,
  SubscriptionPanel,
  TemplateSelectionPanel,
  WebsiteInvoiceModal,
  WebsiteOverviewPanel,
} from "@/components/shop-owner/website/website-panels";
import {
  EMPTY_DOMAIN_FORM,
  FALLBACK_PLANS,
  MOBILE_SUBSCRIPTION_RETURN_URLS,
  SECTION_TITLES,
  WEBSITE_SECTIONS,
  daysUntilExpiry,
  isValidDomainUrl,
  isValidFutureExpiryDate,
  minExpiryDateInput,
  toDateInputValue,
  ymdToDate,
  type DomainForm,
  type ShopWebsiteSection,
} from "@/components/shop-owner/website/website-shared";
import { StripeCheckoutModal } from "@/components/shop-owner/stripe-checkout-modal";
import { AppBar, ModalKeyboardRoot, TabScreenFrame, useToast } from "@/components/reusables";
import { colors, fontSizes, gradients, radii, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { getJson } from "@/lib/api";
import { getAutoShopOwnerProfile } from "@/lib/auth";
import { formatStoredNationalPhone } from "@/lib/dial-countries";
import {
  addDomainDetails,
  fetchDomainDetails,
  formatDomainApiError,
  parseDomainDetailsResponse,
} from "@/lib/shop-owner-domain-api";
import {
  createSubscriptionCheckout,
  extractCheckoutSession,
  fetchSubscriptionInvoiceStatus,
  fetchSubscriptionPlans,
  fetchSubscriptionStatus,
  formatSubscriptionApiError,
  parseInvoicePaymentStatus,
  parseSubscriptionPlans,
  parseSubscriptionStatus,
  purchaseSubscriptionOffline,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "@/lib/shop-owner-subscription-api";
import {
  fetchWebsiteTemplates,
  parseWebsiteTemplatesResponse,
  selectWebsiteTemplate,
  type WebsiteTemplate,
} from "@/lib/shop-owner-website-api";
import { canOpenStripeCheckout } from "@/lib/stripe-payment";
import type { AutoShopOwnerProfileResponse } from "@/types/auto-shop-owner-profile";
import type {
  SubscriptionCheckoutSession,
  SubscriptionPlanId,
} from "@/types/website-subscription-autoshop";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
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

export default function WebsitePage() {
  const insets = useSafeAreaInsets();
  const { token, meta } = useAuth();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState<ShopWebsiteSection>("overview");
  const [refreshing, setRefreshing] = useState(false);

  const [domainForm, setDomainForm] = useState<DomainForm>(EMPTY_DOMAIN_FORM);
  const [savedDomainForm, setSavedDomainForm] = useState<DomainForm>(EMPTY_DOMAIN_FORM);
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainSaving, setDomainSaving] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const [templates, setTemplates] = useState<WebsiteTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [savedTemplateId, setSavedTemplateId] = useState("");
  const [templateSaving, setTemplateSaving] = useState(false);

  const [subscriptionPlans, setSubscriptionPlans] =
    useState<Record<SubscriptionPlanId, SubscriptionPlan>>(FALLBACK_PLANS);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const [invoicePlan, setInvoicePlan] = useState<SubscriptionPlanId>("yearly");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [checkout, setCheckout] = useState<SubscriptionCheckoutSession | null>(null);

  const [profileData, setProfileData] = useState<AutoShopOwnerProfileResponse["data"] | null>(
    null
  );

  const isOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";

  const displayTemplates = useMemo(
    () =>
      templates.slice(0, 5).map((template, index) => ({
        ...template,
        name: template.name || `Template-${index + 1}`,
        desc: template.desc ?? "",
      })),
    [templates]
  );

  const invoicePlanDetails = subscriptionPlans[invoicePlan] ?? FALLBACK_PLANS[invoicePlan];
  const hasExistingDomain = Boolean(savedDomainForm.domainName.trim());

  const selectedTemplate = useMemo(
    () => displayTemplates.find((t) => t.id === selectedTemplateId) ?? null,
    [displayTemplates, selectedTemplateId]
  );

  const overviewTemplate = useMemo(() => {
    const saved = savedTemplateId
      ? displayTemplates.find((t) => t.id === savedTemplateId)
      : undefined;
    return saved ?? selectedTemplate;
  }, [displayTemplates, savedTemplateId, selectedTemplate]);

  const domainDaysLeft = useMemo(
    () => daysUntilExpiry(savedDomainForm.expiryDate || domainForm.expiryDate),
    [domainForm.expiryDate, savedDomainForm.expiryDate]
  );

  const billTo = useMemo(() => {
    const biz = profileData?.businessProfile;
    const user = profileData?.userProfile;
    const name =
      biz?.businessName?.trim() || user?.name?.trim() || meta?.name?.trim() || "—";
    const street = biz?.businessAddress?.trim() || user?.address?.trim() || "";
    const pincode = biz?.pincode?.trim() || user?.pincode?.trim() || "";
    const addressLine = [street, pincode].filter(Boolean).join(", ") || "—";
    const hst = biz?.businessHSTNumber?.trim() || "—";
    const phoneRaw = biz?.businessPhone?.trim() || user?.phone?.trim() || "";
    const phone = phoneRaw ? formatStoredNationalPhone(phoneRaw) || phoneRaw : "—";
    return { name, addressLine, hst, phone };
  }, [meta?.name, profileData]);

  const loadProfile = useCallback(async () => {
    if (!token || !isOwner) return;
    try {
      const cached = await getAutoShopOwnerProfile<AutoShopOwnerProfileResponse>();
      if (cached?.data) setProfileData(cached.data);
      const res = await getJson<AutoShopOwnerProfileResponse>("/api/auto-shop-owner/profile", {
        authToken: token,
      });
      if (res.ok && res.data?.data) {
        setProfileData(res.data.data);
        const templateId = res.data.data.businessProfile?.websiteTemplateId?.trim();
        if (templateId) {
          setSelectedTemplateId((prev) => prev || templateId);
          setSavedTemplateId((prev) => prev || templateId);
        }
      }
    } catch {
      // Non-blocking for overview.
    }
  }, [isOwner, token]);

  const loadDomainDetails = useCallback(async () => {
    if (!token) {
      setDomainForm(EMPTY_DOMAIN_FORM);
      setSavedDomainForm(EMPTY_DOMAIN_FORM);
      return;
    }
    setDomainLoading(true);
    try {
      const res = await fetchDomainDetails(token);
      if (!res.ok) {
        setDomainForm(EMPTY_DOMAIN_FORM);
        setSavedDomainForm(EMPTY_DOMAIN_FORM);
        return;
      }
      const saved = parseDomainDetailsResponse(res.data);
      const next = saved ?? EMPTY_DOMAIN_FORM;
      setDomainForm(next);
      setSavedDomainForm(next);
    } catch {
      setDomainForm(EMPTY_DOMAIN_FORM);
      setSavedDomainForm(EMPTY_DOMAIN_FORM);
    } finally {
      setDomainLoading(false);
    }
  }, [token]);

  const loadTemplates = useCallback(async () => {
    if (!token) {
      setTemplates([]);
      setTemplatesLoaded(true);
      return;
    }
    setTemplatesLoading(true);
    try {
      const res = await fetchWebsiteTemplates(token);
      if (!res.ok) {
        setTemplates([]);
        return;
      }
      const { templates: list } = parseWebsiteTemplatesResponse(res.data);
      const next = list.slice(0, 5);
      setTemplates(next);
      setSelectedTemplateId((prev) => {
        if (prev && next.some((t) => t.id === prev)) return prev;
        if (savedTemplateId && next.some((t) => t.id === savedTemplateId)) return savedTemplateId;
        return next[0]?.id ?? "";
      });
    } catch {
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
      setTemplatesLoaded(true);
    }
  }, [savedTemplateId, token]);

  const loadSubscription = useCallback(async () => {
    if (!token) {
      setSubscriptionPlans(FALLBACK_PLANS);
      setSubscriptionStatus(null);
      return;
    }
    setSubscriptionLoading(true);
    try {
      const [plansRes, statusRes] = await Promise.all([
        fetchSubscriptionPlans(token),
        fetchSubscriptionStatus(token),
      ]);

      if (plansRes.ok) {
        const parsed = parseSubscriptionPlans(plansRes.data);
        if (parsed.length > 0) {
          const next: Record<SubscriptionPlanId, SubscriptionPlan> = { ...FALLBACK_PLANS };
          for (const plan of parsed) {
            next[plan.id] = {
              ...FALLBACK_PLANS[plan.id],
              ...plan,
              features: plan.features?.length ? plan.features : FALLBACK_PLANS[plan.id].features,
              invoiceRows: plan.invoiceRows?.length
                ? plan.invoiceRows
                : FALLBACK_PLANS[plan.id].invoiceRows,
            };
          }
          setSubscriptionPlans(next);
        }
      }

      if (statusRes.ok) {
        setSubscriptionStatus(parseSubscriptionStatus(statusRes.data));
      }
    } catch {
      // Keep fallbacks.
    } finally {
      setSubscriptionLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
      void loadDomainDetails();
      void loadTemplates();
      void loadSubscription();
      return undefined;
    }, [loadDomainDetails, loadProfile, loadSubscription, loadTemplates])
  );

  useEffect(() => {
    const templateId = profileData?.businessProfile?.websiteTemplateId?.trim();
    if (!templateId) return;
    setSelectedTemplateId((prev) => prev || templateId);
    setSavedTemplateId((prev) => prev || templateId);
  }, [profileData?.businessProfile?.websiteTemplateId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadProfile(),
        loadDomainDetails(),
        loadTemplates(),
        loadSubscription(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadDomainDetails, loadProfile, loadSubscription, loadTemplates]);

  const handleDomainSaveAndNext = useCallback(async () => {
    if (!domainForm.domainName.trim()) {
      showToast("Please enter the domain name.", { type: "error" });
      return;
    }
    if (!isValidDomainUrl(domainForm.domainName)) {
      showToast("Please enter a valid domain URL (e.g. https://auto27.ca).", { type: "error" });
      return;
    }
    if (!domainForm.expiryDate.trim()) {
      showToast("Please select the domain expiry date.", { type: "error" });
      return;
    }
    if (!isValidFutureExpiryDate(domainForm.expiryDate)) {
      showToast("Please select a valid expiry date in the future.", { type: "error" });
      return;
    }
    if (!token) {
      showToast("Please sign in to continue.", { type: "error" });
      return;
    }

    setDomainSaving(true);
    try {
      const payload = {
        domainName: domainForm.domainName.trim(),
        expiryDate: domainForm.expiryDate.trim(),
        provider: domainForm.provider.trim(),
        status: domainForm.status.trim() || "Existing",
      };
      const res = await addDomainDetails(token, payload);
      if (!res.ok || res.data?.success === false) {
        showToast(formatDomainApiError(res.data, "Could not save domain details."), {
          type: "error",
        });
        return;
      }
      setSavedDomainForm(domainForm);
      showToast(res.data?.message?.trim() || "Domain details saved.", { type: "success" });
      await loadDomainDetails();
      setActiveSection("templates");
      void loadTemplates();
    } catch {
      showToast("Network error saving domain details.", { type: "error" });
    } finally {
      setDomainSaving(false);
    }
  }, [domainForm, loadDomainDetails, loadTemplates, showToast, token]);

  const handleTemplatePreview = useCallback(
    (template: WebsiteTemplate) => {
      const url = (template.templateLink ?? "").trim();
      if (!url) {
        showToast(`Preview for ${template.name} is not available yet.`, { type: "info" });
        return;
      }
      Linking.openURL(url).catch(() => {
        showToast("Could not open template preview.", { type: "error" });
      });
    },
    [showToast]
  );

  const handleTemplateSaveAndNext = useCallback(async () => {
    if (!selectedTemplateId) {
      showToast("Please select a website template.", { type: "error" });
      return;
    }
    if (!token) {
      showToast("Please sign in to continue.", { type: "error" });
      return;
    }

    setTemplateSaving(true);
    try {
      const res = await selectWebsiteTemplate(token, selectedTemplateId);
      if (!res.ok || res.data?.success === false) {
        showToast(res.data?.message?.trim() || "Could not save website template selection.", {
          type: "error",
        });
        return;
      }
      setSavedTemplateId(selectedTemplateId);
      showToast(
        res.data?.message?.trim() ||
          `Template "${selectedTemplate?.name ?? "selected"}" saved.`,
        { type: "success" }
      );
      await loadProfile();
      setActiveSection("subscription");
      void loadSubscription();
    } catch {
      showToast("Network error saving website template.", { type: "error" });
    } finally {
      setTemplateSaving(false);
    }
  }, [
    loadProfile,
    loadSubscription,
    selectedTemplate?.name,
    selectedTemplateId,
    showToast,
    token,
  ]);

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

  const confirmSubscriptionPayment = useCallback(
    async (invoiceNo: string) => {
      if (!token || !invoiceNo) return;
      const pollDelaysMs = [0, 2000, 4000, 6000];
      for (const delayMs of pollDelaysMs) {
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        try {
          const statusRes = await fetchSubscriptionInvoiceStatus(token, invoiceNo);
          const parsed = parseInvoicePaymentStatus(statusRes.data);
          if (parsed?.paid) {
            showToast(`Payment successful (${invoiceNo}).`, { type: "success" });
            await loadSubscription();
            return;
          }
        } catch {
          // Retry.
        }
      }
      showToast(
        "Payment not confirmed yet. Complete payment in Stripe, then pull to refresh.",
        { type: "info" }
      );
      await loadSubscription();
    },
    [loadSubscription, showToast, token]
  );

  const handleProceedPayment = useCallback(async () => {
    if (!token) {
      showToast("Please sign in to continue.", { type: "error" });
      return;
    }

    setPaymentProcessing(true);
    try {
      if (invoicePlan === "biweekly") {
        const res = await purchaseSubscriptionOffline(token, {
          planId: "biweekly",
          paymentMethod: "Void Cheque",
          remarks: "26 void cheques of CAD 15",
        });
        const data = res.data;
        const succeeded = res.ok && data?.success !== false;
        if (!succeeded) {
          showToast(
            formatSubscriptionApiError(data, "Could not submit void cheque purchase."),
            { type: "error" }
          );
          return;
        }
        const invoiceNo = data?.invoiceNo?.trim() || data?.data?.invoiceNo?.trim() || "";
        showToast(
          data?.message?.trim() ||
            (invoiceNo
              ? `Void cheque purchase submitted (${invoiceNo}).`
              : "Void cheque purchase submitted."),
          { type: "success" }
        );
        setInvoiceOpen(false);
        await loadSubscription();
        return;
      }

      const res = await createSubscriptionCheckout(token, {
        planId: "yearly",
        successUrl: `${MOBILE_SUBSCRIPTION_RETURN_URLS.successUrl}&plan=yearly`,
        cancelUrl: `${MOBILE_SUBSCRIPTION_RETURN_URLS.cancelUrl}&plan=yearly`,
      });
      const data = res.data;
      const succeeded = res.ok && data?.success !== false;
      if (!succeeded) {
        showToast(formatSubscriptionApiError(data), { type: "error" });
        return;
      }

      const session = extractCheckoutSession(data);
      if (!session?.checkoutUrl && !session?.stripeSessionId) {
        showToast(data?.message?.trim() || "Checkout URL not returned.", { type: "error" });
        return;
      }
      if (data?.message?.trim()) {
        showToast(data.message.trim(), { type: "info" });
      }
      setInvoiceOpen(false);
      openSubscriptionCheckout(session!);
    } catch {
      showToast("Network error starting payment.", { type: "error" });
    } finally {
      setPaymentProcessing(false);
    }
  }, [invoicePlan, loadSubscription, openSubscriptionCheckout, showToast, token]);

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <WebsiteOverviewPanel
            domain={hasExistingDomain ? savedDomainForm : domainForm}
            domainLoading={domainLoading}
            domainDaysLeft={domainDaysLeft}
            templateName={overviewTemplate?.name ?? ""}
            templateDesc={overviewTemplate?.desc ?? ""}
            templatesLoading={templatesLoading && !templatesLoaded}
            subscriptionStatus={subscriptionStatus}
            subscriptionLoading={subscriptionLoading}
            onOpenSection={setActiveSection}
          />
        );
      case "domain":
        return (
          <DomainPanel
            form={domainForm}
            onChange={setDomainForm}
            onSaveAndNext={() => {
              void handleDomainSaveAndNext();
            }}
            onNext={() => {
              setActiveSection("templates");
              void loadTemplates();
            }}
            onReset={() => setDomainForm(savedDomainForm)}
            onPickExpiry={() => setDatePickerOpen(true)}
            saving={domainSaving}
            loading={domainLoading}
            readOnly={hasExistingDomain}
          />
        );
      case "templates":
        return (
          <TemplateSelectionPanel
            templates={displayTemplates}
            loading={templatesLoading}
            loaded={templatesLoaded}
            selectedId={selectedTemplateId}
            onSelect={setSelectedTemplateId}
            onPreview={handleTemplatePreview}
            onSaveAndNext={() => {
              void handleTemplateSaveAndNext();
            }}
            saving={templateSaving}
          />
        );
      case "subscription":
        return (
          <SubscriptionPanel
            plans={subscriptionPlans}
            status={subscriptionStatus}
            loading={subscriptionLoading}
            onViewInvoice={(plan) => {
              setInvoicePlan(plan);
              setInvoiceOpen(true);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <TabScreenFrame
      backgroundColor={colors.bgProfile}
      headerGradient={gradients.websiteHeader}
      bottomInsetExtra={spacing.lg}
      header={<AppBar title={SECTION_TITLES[activeSection]} leadingMode="back" />}
      scroll={false}
    >
      <View style={styles.page}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionTabs}
          style={styles.sectionTabsScroll}
        >
          {WEBSITE_SECTIONS.map((tab) => {
            const active = activeSection === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveSection(tab.id)}
                style={[styles.sectionTab, active && styles.sectionTabActive]}
              >
                <Text style={[styles.sectionTabText, active && styles.sectionTabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

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
              onRefresh={() => {
                void handleRefresh();
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {renderContent()}
        </ScrollView>
      </View>

      {datePickerOpen ? (
        Platform.OS === "ios" ? (
          <Modal transparent animationType="slide" onRequestClose={() => setDatePickerOpen(false)}>
            <ModalKeyboardRoot
              onBackdropPress={() => setDatePickerOpen(false)}
              scrimColor="rgba(0,0,0,0.42)"
            >
              <View
                style={[
                  styles.dateSheet,
                  { paddingBottom: Math.max(insets.bottom, spacing.md) },
                ]}
              >
                <View style={styles.dateSheetHeader}>
                  <Text style={styles.dateSheetTitle}>Expiry Date</Text>
                  <Pressable onPress={() => setDatePickerOpen(false)} hitSlop={8}>
                    <Text style={styles.dateSheetDone}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={ymdToDate(domainForm.expiryDate || minExpiryDateInput())}
                  mode="date"
                  display="spinner"
                  minimumDate={ymdToDate(minExpiryDateInput())}
                  onChange={(_, d) => {
                    if (d) {
                      setDomainForm((prev) => ({
                        ...prev,
                        expiryDate: toDateInputValue(d),
                      }));
                    }
                  }}
                />
              </View>
            </ModalKeyboardRoot>
          </Modal>
        ) : (
          <DateTimePicker
            value={ymdToDate(domainForm.expiryDate || minExpiryDateInput())}
            mode="date"
            display="default"
            minimumDate={ymdToDate(minExpiryDateInput())}
            onChange={(_, d) => {
              setDatePickerOpen(false);
              if (d) {
                setDomainForm((prev) => ({
                  ...prev,
                  expiryDate: toDateInputValue(d),
                }));
              }
            }}
          />
        )
      ) : null}

      <WebsiteInvoiceModal
        open={invoiceOpen}
        plan={invoicePlan}
        planDetails={invoicePlanDetails}
        onClose={() => setInvoiceOpen(false)}
        onProceed={() => {
          void handleProceedPayment();
        }}
        billToName={billTo.name}
        billToAddress={billTo.addressLine}
        billToHst={billTo.hst}
        billToPhone={billTo.phone}
        countryCode={meta?.countryCode}
        processing={paymentProcessing}
      />

      <StripeCheckoutModal
        visible={Boolean(checkout)}
        session={checkout}
        onClose={() => {
          const orderId = checkout?.orderId;
          setCheckout(null);
          if (orderId) void confirmSubscriptionPayment(orderId);
        }}
        onComplete={() => {
          const orderId = checkout?.orderId;
          setCheckout(null);
          if (orderId) void confirmSubscriptionPayment(orderId);
        }}
        onError={(msg) => showToast(msg, { type: "error" })}
      />
    </TabScreenFrame>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  sectionTabsScroll: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  sectionTabs: {
    paddingHorizontal: spacing.screenHorizontal,
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  sectionTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  sectionTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sectionTabText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: fontSizes.sm,
  },
  sectionTabTextActive: { color: colors.white },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    gap: spacing.lg,
    flexGrow: 1,
  },
  dateSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  dateSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  dateSheetTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.text,
  },
  dateSheetDone: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.primary,
  },
});
