import { colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import { formatCurrencyAmount } from "@/lib/currency";
import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/shop-owner-subscription-api";
import type { WebsiteTemplate } from "@/lib/shop-owner-website-api";
import type { SubscriptionPlanId } from "@/types/website-subscription-autoshop";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DOMAIN_STATUS_OPTIONS,
  FALLBACK_PLANS,
  YEARLY_FEATURES,
  daysUntilExpiry,
  formatDisplayDate,
  type DomainForm,
  type ShopWebsiteSection,
} from "./website-shared";

function GoldCoinIcon() {
  return (
    <View style={styles.coin}>
      <Text style={styles.coinText}>$</Text>
    </View>
  );
}

export function DomainExpiryProgress({ expiryDate }: { expiryDate: string }) {
  const daysRemaining = daysUntilExpiry(expiryDate);
  const progressPct = useMemo(() => {
    if (daysRemaining == null) return 0;
    const totalWindow = 365;
    const elapsed = Math.max(0, totalWindow - daysRemaining);
    return Math.min(100, Math.max(8, (elapsed / totalWindow) * 100));
  }, [daysRemaining]);

  if (daysRemaining == null) {
    return (
      <Text style={styles.expiryHint}>Enter an expiry date to see remaining days.</Text>
    );
  }

  return (
    <View style={styles.expiryWrap}>
      <Text style={styles.expiryTitle}>{daysRemaining} Remaining days</Text>
      <View style={styles.expiryBarRow}>
        <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
        <View style={styles.expiryTrack}>
          <View style={[styles.expiryFill, { width: `${progressPct}%` }]} />
        </View>
      </View>
    </View>
  );
}

function OverviewStatPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warn" | "muted";
}) {
  const toneStyle =
    tone === "success"
      ? styles.pillSuccess
      : tone === "warn"
        ? styles.pillWarn
        : tone === "muted"
          ? styles.pillMuted
          : styles.pillNeutral;
  return (
    <View style={[styles.pill, toneStyle]}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function OverviewSectionCard({
  icon,
  title,
  subtitle,
  ready,
  onOpen,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  ready: boolean;
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <View style={[styles.overviewCard, ready && styles.overviewCardReady]}>
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [
          styles.overviewCardHeader,
          ready ? styles.overviewCardHeaderReady : null,
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.overviewIcon, ready && styles.overviewIconReady]}>
          <Ionicons
            name={icon}
            size={20}
            color={ready ? colors.successDark : colors.primary}
          />
        </View>
        <View style={styles.overviewHeaderText}>
          <View style={styles.overviewTitleRow}>
            <Text style={styles.overviewTitle} numberOfLines={1}>
              {title}
            </Text>
            <View style={[styles.statusChip, ready ? styles.statusChipReady : styles.statusChipPending]}>
              <Text style={[styles.statusChipText, ready && styles.statusChipTextReady]}>
                {ready ? "Set" : "Pending"}
              </Text>
            </View>
          </View>
          <Text style={styles.overviewSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
      </Pressable>
      <View style={styles.overviewCardBody}>{children}</View>
    </View>
  );
}

export function WebsiteOverviewPanel({
  domain,
  domainLoading,
  domainDaysLeft,
  templateName,
  templateDesc,
  templatesLoading,
  subscriptionStatus,
  subscriptionLoading,
  onOpenSection,
}: {
  domain: DomainForm;
  domainLoading?: boolean;
  domainDaysLeft: number | null;
  templateName: string;
  templateDesc: string;
  templatesLoading?: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionLoading?: boolean;
  onOpenSection: (section: Exclude<ShopWebsiteSection, "overview">) => void;
}) {
  const hasDomain = Boolean(domain.domainName.trim());
  const hasTemplate = Boolean(templateName.trim());
  const hasSubscription = Boolean(subscriptionStatus?.active);
  const completedCount = [hasDomain, hasTemplate, hasSubscription].filter(Boolean).length;
  const progressPct = Math.round((completedCount / 3) * 100);

  const subscriptionLabel =
    subscriptionStatus?.planLabel ||
    (subscriptionStatus?.active ? "Active subscription" : "No active plan");

  const domainHeadline = hasDomain
    ? domain.domainName.replace(/^https?:\/\//i, "")
    : "Add your domain";
  const templateHeadline = hasTemplate ? templateName : "Choose a template";
  const subscriptionHeadline = subscriptionLoading
    ? "Loading…"
    : hasSubscription
      ? subscriptionLabel
      : "Choose a plan";

  return (
    <View style={styles.panelCard}>
      <LinearGradient
        colors={["#1D4ED8", "#2563EB", "#3B82F6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.overviewHero}
      >
        <Text style={styles.overviewEyebrow}>My Website</Text>
        <Text style={styles.overviewHeroTitle}>Your website at a glance</Text>
        <Text style={styles.overviewHeroDesc}>
          Domain, template, and subscription — everything you need to go live, summarized in one
          place.
        </Text>
        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Setup progress</Text>
            <Text style={styles.progressLabel}>
              {completedCount}/3 · {progressPct}%
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.overviewCards}>
        <OverviewSectionCard
          icon="globe-outline"
          title="Domain Details"
          subtitle={domainLoading ? "Loading domain…" : domainHeadline}
          ready={hasDomain}
          onOpen={() => onOpenSection("domain")}
        >
          {domainLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : hasDomain ? (
            <>
              <View style={styles.pillGrid}>
                <OverviewStatPill label="Provider" value={domain.provider.trim() || "—"} />
                <OverviewStatPill label="Status" value={domain.status.trim() || "—"} />
                <OverviewStatPill
                  label="Expiry"
                  value={formatDisplayDate(domain.expiryDate) || "—"}
                  tone={
                    domainDaysLeft != null && domainDaysLeft < 30
                      ? "warn"
                      : domainDaysLeft != null
                        ? "success"
                        : "neutral"
                  }
                />
                <OverviewStatPill
                  label="Days left"
                  value={domainDaysLeft != null ? `${domainDaysLeft}` : "—"}
                  tone={
                    domainDaysLeft != null && domainDaysLeft < 30
                      ? "warn"
                      : domainDaysLeft != null
                        ? "success"
                        : "muted"
                  }
                />
              </View>
              {domain.expiryDate ? <DomainExpiryProgress expiryDate={domain.expiryDate} /> : null}
            </>
          ) : (
            <Text style={styles.emptyCopy}>
              Save your domain name, provider, and expiry so customers can find your shop online.
            </Text>
          )}
        </OverviewSectionCard>

        <OverviewSectionCard
          icon="layers-outline"
          title="My Website"
          subtitle={templatesLoading ? "Loading templates…" : templateHeadline}
          ready={hasTemplate}
          onOpen={() => onOpenSection("templates")}
        >
          {templatesLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : hasTemplate ? (
            <>
              <View style={styles.templatePreviewBox}>
                <Ionicons name="checkmark" size={28} color={colors.primary} />
                <Text style={styles.templatePreviewName}>{templateName}</Text>
              </View>
              <Text style={styles.emptyCopy}>
                {templateDesc.trim() || "Your selected website template is ready."}
              </Text>
            </>
          ) : (
            <Text style={styles.emptyCopy}>
              Pick a website template that speaks for your business — preview and save when you are
              ready.
            </Text>
          )}
        </OverviewSectionCard>

        <OverviewSectionCard
          icon="gift-outline"
          title="Subscription"
          subtitle={subscriptionHeadline}
          ready={hasSubscription}
          onOpen={() => onOpenSection("subscription")}
        >
          {subscriptionLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : hasSubscription ? (
            <>
              <View style={styles.activePlanRow}>
                <GoldCoinIcon />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activePlanLabel}>Current plan</Text>
                  <Text style={styles.activePlanValue} numberOfLines={2}>
                    {subscriptionLabel}
                  </Text>
                </View>
              </View>
              <View style={styles.pillGrid}>
                <OverviewStatPill label="Status" value="Active" tone="success" />
                <OverviewStatPill
                  label="Days left"
                  value={
                    subscriptionStatus?.daysLeft != null
                      ? `${subscriptionStatus.daysLeft}`
                      : "—"
                  }
                  tone={
                    subscriptionStatus?.daysLeft != null && subscriptionStatus.daysLeft < 30
                      ? "warn"
                      : "success"
                  }
                />
              </View>
            </>
          ) : (
            <Text style={styles.emptyCopy}>
              Activate a yearly or bi-weekly plan to keep your website and AutoDaddy tools running.
            </Text>
          )}
        </OverviewSectionCard>
      </View>
    </View>
  );
}

function FormFooter({
  message,
  saveLabel,
  onSave,
  onCancel,
  cancelLabel = "Reset",
  saving,
  disabled,
  hideCancel,
}: {
  message: string;
  saveLabel: string;
  onSave: () => void;
  onCancel?: () => void;
  cancelLabel?: string;
  saving?: boolean;
  disabled?: boolean;
  hideCancel?: boolean;
}) {
  const isDisabled = Boolean(saving || disabled);
  return (
    <View style={styles.formFooter}>
      <Text style={styles.formFooterMessage}>{message}</Text>
      <View style={styles.formFooterActions}>
        <Pressable
          onPress={onSave}
          disabled={isDisabled}
          style={({ pressed }) => [
            styles.saveBtn,
            isDisabled && styles.saveBtnDisabled,
            pressed && !isDisabled && styles.pressed,
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>{saveLabel}</Text>
          )}
        </Pressable>
        {!hideCancel && onCancel ? (
          <Pressable onPress={onCancel} disabled={isDisabled} hitSlop={8}>
            <Text style={styles.cancelLink}>
              or <Text style={styles.cancelLinkStrong}>{cancelLabel}</Text>
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function DomainPanel({
  form,
  onChange,
  onSaveAndNext,
  onNext,
  onReset,
  onPickExpiry,
  saving,
  loading,
  readOnly = false,
}: {
  form: DomainForm;
  onChange: (next: DomainForm) => void;
  onSaveAndNext: () => void;
  onNext: () => void;
  onReset: () => void;
  onPickExpiry: () => void;
  saving?: boolean;
  loading?: boolean;
  readOnly?: boolean;
}) {
  if (loading) {
    return (
      <View style={[styles.panelCard, styles.centeredPad]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.panelCard}>
      <View style={styles.formBody}>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Domain Name</Text>
          <TextInput
            value={form.domainName}
            onChangeText={(domainName) => onChange({ ...form, domainName })}
            placeholder="https://auto27.ca"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!readOnly}
            style={[styles.input, readOnly && styles.inputReadonly]}
            placeholderTextColor={colors.textLight}
          />
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Expiry Date</Text>
          <Pressable
            onPress={readOnly ? undefined : onPickExpiry}
            disabled={readOnly}
            style={[styles.input, styles.dateInput, readOnly && styles.inputReadonly]}
          >
            <Text style={form.expiryDate ? styles.inputText : styles.placeholderText}>
              {form.expiryDate ? formatDisplayDate(form.expiryDate) : "Select expiry date"}
            </Text>
            <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Provider</Text>
          <TextInput
            value={form.provider}
            onChangeText={(provider) => onChange({ ...form, provider })}
            placeholder="Name Silo"
            editable={!readOnly}
            style={[styles.input, readOnly && styles.inputReadonly]}
            placeholderTextColor={colors.textLight}
          />
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Status</Text>
          <View style={styles.statusRow}>
            {DOMAIN_STATUS_OPTIONS.map((option) => {
              const active = form.status === option;
              return (
                <Pressable
                  key={option}
                  disabled={readOnly}
                  onPress={() => onChange({ ...form, status: option })}
                  style={[
                    styles.statusOption,
                    active && styles.statusOptionActive,
                    readOnly && styles.inputReadonly,
                  ]}
                >
                  <Text
                    style={[styles.statusOptionText, active && styles.statusOptionTextActive]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.expiryDivider}>
          <DomainExpiryProgress expiryDate={form.expiryDate} />
        </View>
      </View>
      {readOnly ? (
        <FormFooter
          message="Your domain details are already saved"
          saveLabel="Next"
          onSave={onNext}
          hideCancel
        />
      ) : (
        <FormFooter
          message="You are saving your domain details"
          saveLabel="Save and Next"
          saving={saving}
          onSave={onSaveAndNext}
          onCancel={onReset}
        />
      )}
    </View>
  );
}

function TemplateCard({
  template,
  selected,
  onSelect,
  onPreview,
}: {
  template: WebsiteTemplate;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  return (
    <View style={[styles.templateCard, selected && styles.templateCardSelected]}>
      <View style={styles.templateMedia}>
        <Pressable onPress={onPreview} style={styles.previewChip}>
          <Text style={styles.previewChipText}>Preview</Text>
        </Pressable>
        <Pressable onPress={onSelect} style={styles.templateSelectArea}>
          {selected ? (
            <Ionicons name="checkmark" size={40} color={colors.text} />
          ) : (
            <Text style={styles.selectHint}>Tap to select</Text>
          )}
        </Pressable>
      </View>
      <View style={styles.templateMeta}>
        <Text style={styles.templateName}>{template.name}</Text>
        {template.desc ? (
          <Text style={styles.templateDesc} numberOfLines={3}>
            {template.desc}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function TemplateSelectionPanel({
  templates,
  loading,
  loaded,
  selectedId,
  onSelect,
  onPreview,
  onSaveAndNext,
  saving,
}: {
  templates: WebsiteTemplate[];
  loading: boolean;
  loaded: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onPreview: (template: WebsiteTemplate) => void;
  onSaveAndNext: () => void;
  saving?: boolean;
}) {
  const showSkeleton = loading || !loaded;

  return (
    <View style={styles.panelCard}>
      <View style={styles.templatesHeader}>
        <Text style={styles.templatesHeaderTitle}>
          Let your Business Website Speak for you
        </Text>
      </View>
      <View style={styles.templatesBody}>
        {showSkeleton ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : templates.length === 0 ? (
          <Text style={styles.emptyCopyCenter}>
            No website templates are available right now.
          </Text>
        ) : (
          <View style={styles.templateGrid}>
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                selected={selectedId === template.id}
                onSelect={() => onSelect(template.id)}
                onPreview={() => onPreview(template)}
              />
            ))}
          </View>
        )}
      </View>
      <FormFooter
        message="You are selecting your website template"
        saveLabel="Save and Next"
        saving={saving}
        onSave={onSaveAndNext}
        onCancel={() => onSelect("")}
        cancelLabel="Clear selection"
        disabled={showSkeleton || templates.length === 0}
      />
    </View>
  );
}

function PlanFeatureList({ items }: { items: { label: string; note: string }[] }) {
  return (
    <View style={styles.featureList}>
      {items.map((item) => (
        <View key={item.label} style={styles.featureRow}>
          <Text style={styles.featureStar}>*</Text>
          <Text style={styles.featureText}>
            <Text style={styles.featureLabel}>{item.label}</Text>
            {item.note ? (
              <Text style={styles.featureNote}>{` (${item.note})`}</Text>
            ) : null}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function SubscriptionPanel({
  plans,
  status,
  loading,
  onViewInvoice,
}: {
  plans: Record<SubscriptionPlanId, SubscriptionPlan>;
  status: SubscriptionStatus | null;
  loading?: boolean;
  onViewInvoice: (plan: SubscriptionPlanId) => void;
}) {
  const currentLabel =
    status?.planLabel ||
    (status?.active ? "Active subscription" : "a day payment for 365 accumulative days");
  const yearly = plans.yearly;
  const biweekly = plans.biweekly;

  return (
    <View style={styles.subscriptionWrap}>
      <View style={styles.currentPlanBanner}>
        <Text style={styles.currentPlanTitle}>Current Plan</Text>
        <GoldCoinIcon />
        <Text style={styles.currentPlanValue}>
          {loading ? "Loading…" : currentLabel}
          {!loading && status?.daysLeft != null ? ` (${status.daysLeft} days left)` : ""}
        </Text>
      </View>

      <View style={styles.planCard}>
        <View style={styles.planCardHeader}>
          <Text style={styles.planCardHeaderText}>{yearly.title}</Text>
        </View>
        <View style={styles.planCardBody}>
          <PlanFeatureList
            items={yearly.features?.length ? yearly.features : YEARLY_FEATURES}
          />
        </View>
        <Pressable
          onPress={() => onViewInvoice("yearly")}
          style={({ pressed }) => [styles.saveBtn, styles.planInvoiceBtn, pressed && styles.pressed]}
        >
          <Text style={styles.saveBtnText}>View Invoice</Text>
        </Pressable>
      </View>

      <View style={styles.planCard}>
        <View style={styles.planCardHeader}>
          <Text style={styles.planCardHeaderText}>{biweekly.title}</Text>
        </View>
        <View style={styles.planCardBody}>
          <Text style={styles.biweeklyDesc}>
            {biweekly.description || "26 -Void cheques of CAD 15"}
            <Text style={styles.featureNote}> (for 26 Bi-weekly)</Text>
          </Text>
        </View>
        <Pressable
          onPress={() => onViewInvoice("biweekly")}
          style={({ pressed }) => [styles.saveBtn, styles.planInvoiceBtn, pressed && styles.pressed]}
        >
          <Text style={styles.saveBtnText}>View Invoice</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function WebsiteInvoiceModal({
  open,
  plan,
  planDetails,
  onClose,
  onProceed,
  billToName,
  billToAddress,
  billToHst,
  billToPhone,
  countryCode,
  processing,
}: {
  open: boolean;
  plan: SubscriptionPlanId;
  planDetails: SubscriptionPlan;
  onClose: () => void;
  onProceed: () => void;
  billToName: string;
  billToAddress: string;
  billToHst: string;
  billToPhone: string;
  countryCode: string | null | undefined;
  processing?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const rows =
    planDetails.invoiceRows?.length
      ? planDetails.invoiceRows
      : FALLBACK_PLANS[plan].invoiceRows ?? [];
  const subTotal = rows.reduce((sum, row) => sum + row.amount, 0);
  const hst = planDetails.hst;
  const totalDue = subTotal + hst;
  const invoiceLabel = plan === "yearly" ? "AD 0001" : "AD 0002";
  const planTitle =
    plan === "yearly" ? "Yearly website subscription" : "Bi-weekly website subscription";
  const proceedLabel =
    plan === "biweekly" ? "Submit void cheque purchase" : "Proceed with Payment";

  const formatAmount = (amount: number) =>
    formatCurrencyAmount(amount, countryCode, { fallback: "—" });

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.modalHandle} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
            <View style={styles.invoiceHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.invoiceBrand}>autodaddy</Text>
                <Text style={styles.invoiceTitle}>{planTitle}</Text>
                <Text style={styles.invoiceMeta}>Invoice {invoiceLabel}</Text>
              </View>
              <View style={styles.phonePill}>
                <Text style={styles.phonePillText}>{billToPhone}</Text>
              </View>
            </View>

            <View style={styles.billGrid}>
              <View style={styles.billBox}>
                <Text style={styles.billBoxLabel}>Bill To</Text>
                <Text style={styles.billName}>{billToName}</Text>
                <Text style={styles.billLine}>{billToAddress}</Text>
                <View style={styles.hstChip}>
                  <Text style={styles.hstChipText}>HST {billToHst}</Text>
                </View>
              </View>
              <View style={[styles.billBox, styles.billBoxDue]}>
                <Text style={styles.billBoxLabel}>Amount due</Text>
                <Text style={styles.dueAmount}>{formatAmount(totalDue)}</Text>
                <Text style={styles.billLine}>{new Date().toLocaleDateString()}</Text>
              </View>
            </View>

            <View style={styles.invoiceTable}>
              <View style={styles.invoiceTableHead}>
                <Text style={[styles.th, { flex: 1 }]}>Service</Text>
                <Text style={[styles.th, { flex: 1.4 }]}>Description</Text>
                <Text style={[styles.th, { width: 64, textAlign: "right" }]}>Amount</Text>
              </View>
              {rows.map((row) => (
                <View key={row.service} style={styles.invoiceTableRow}>
                  <Text style={[styles.tdStrong, { flex: 1 }]}>{row.service}</Text>
                  <Text style={[styles.tdMuted, { flex: 1.4 }]}>{row.description}</Text>
                  <Text style={[styles.tdStrong, { width: 64, textAlign: "right" }]}>
                    {formatAmount(row.amount)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.totalsCard}>
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>Sub Total</Text>
                <Text style={styles.totalValue}>{formatAmount(subTotal)}</Text>
              </View>
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>HST</Text>
                <Text style={styles.totalValue}>{formatAmount(hst)}</Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalLine}>
                <Text style={styles.totalDueLabel}>Total Due</Text>
                <Text style={styles.totalDueValue}>{formatAmount(totalDue)}</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Close</Text>
              </Pressable>
              <Pressable
                onPress={onProceed}
                disabled={processing}
                style={({ pressed }) => [
                  styles.saveBtn,
                  styles.proceedBtn,
                  processing && styles.saveBtnDisabled,
                  pressed && !processing && styles.pressed,
                ]}
              >
                {processing ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>{proceedLabel}</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.9 },
  panelCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.card,
  },
  centeredPad: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  coin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5C542",
    borderWidth: 2,
    borderColor: "#D4A017",
    alignItems: "center",
    justifyContent: "center",
  },
  coinText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#7C5E10",
  },
  overviewHero: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  overviewEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.7)",
  },
  overviewHeroTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "900",
    color: colors.white,
  },
  overviewHeroDesc: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 20,
  },
  progressBlock: { marginTop: spacing.md, gap: spacing.sm },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#FFE566",
  },
  overviewCards: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  overviewCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  overviewCardReady: {
    borderColor: "#A7F3D0",
  },
  overviewCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.primaryMutedBg,
  },
  overviewCardHeaderReady: {
    backgroundColor: colors.successMuted,
    borderBottomColor: "#D1FAE5",
  },
  overviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  overviewIconReady: {
    backgroundColor: "#D1FAE5",
  },
  overviewHeaderText: { flex: 1, minWidth: 0 },
  overviewTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  overviewTitle: {
    flexShrink: 1,
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.text,
  },
  overviewSubtitle: {
    marginTop: 2,
    fontSize: fontSizes.xs,
    fontWeight: "600",
    color: colors.textMuted,
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusChipPending: { backgroundColor: colors.trackBg },
  statusChipReady: { backgroundColor: "#BBF7D0" },
  statusChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  statusChipTextReady: { color: colors.successDark },
  overviewCardBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  pillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pill: {
    width: "48%",
    flexGrow: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  pillNeutral: {
    backgroundColor: colors.primaryMutedBg,
    borderColor: "#BFDBFE",
  },
  pillSuccess: {
    backgroundColor: colors.successMuted,
    borderColor: "#A7F3D0",
  },
  pillWarn: {
    backgroundColor: colors.warningMuted,
    borderColor: "#FDE68A",
  },
  pillMuted: {
    backgroundColor: colors.bgAlt,
    borderColor: colors.border,
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.textMuted,
  },
  pillValue: {
    marginTop: 2,
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.text,
  },
  emptyCopy: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
    lineHeight: 20,
  },
  emptyCopyCenter: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.xxl,
  },
  templatePreviewBox: {
    minHeight: 110,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: colors.primaryMutedBg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  templatePreviewName: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.primary,
  },
  activePlanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    backgroundColor: colors.successMuted,
    padding: spacing.md,
  },
  activePlanLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.successDark,
  },
  activePlanValue: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: "#006600",
  },
  expiryWrap: { gap: spacing.sm },
  expiryTitle: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.text,
  },
  expiryHint: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
  },
  expiryBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  expiryTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  expiryFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  formBody: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  fieldBlock: { gap: spacing.xs },
  fieldLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textMuted,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: colors.text,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputText: {
    fontSize: fontSizes.base,
    fontWeight: "600",
    color: colors.text,
  },
  placeholderText: {
    fontSize: fontSizes.base,
    fontWeight: "500",
    color: colors.textLight,
  },
  inputReadonly: {
    backgroundColor: colors.bgAlt,
    color: colors.textMuted,
  },
  statusRow: { flexDirection: "row", gap: spacing.sm },
  statusOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  statusOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusOptionText: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.text,
  },
  statusOptionTextActive: { color: colors.white },
  expiryDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  formFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgAlt,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  formFooterMessage: {
    fontSize: fontSizes.xs,
    fontStyle: "italic",
    fontWeight: "600",
    color: colors.textMuted,
  },
  formFooterActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  saveBtn: {
    minWidth: 120,
    minHeight: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.white,
  },
  cancelLink: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
    color: colors.textMuted,
  },
  cancelLinkStrong: {
    color: colors.primary,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  templatesHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  templatesHeaderTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
  },
  templatesBody: {
    padding: spacing.lg,
    minHeight: 180,
  },
  templateGrid: { gap: spacing.lg },
  templateCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  templateCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  templateMedia: {
    minHeight: 140,
    backgroundColor: colors.bgAlt,
    position: "relative",
  },
  previewChip: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 2,
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  previewChipText: {
    fontSize: fontSizes.xs,
    fontWeight: "800",
    color: colors.white,
  },
  templateSelectArea: {
    flex: 1,
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  selectHint: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
    color: colors.textLight,
  },
  templateMeta: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  templateName: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
  },
  templateDesc: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 15,
  },
  subscriptionWrap: { gap: spacing.lg },
  currentPlanBanner: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  currentPlanTitle: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: "#006600",
  },
  currentPlanValue: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: "#006600",
    textAlign: "center",
  },
  planCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    backgroundColor: colors.white,
    ...shadows.soft,
  },
  planCardHeader: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  planCardHeaderText: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.white,
    textAlign: "center",
  },
  planCardBody: {
    padding: spacing.lg,
    minHeight: 120,
  },
  planInvoiceBtn: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    alignSelf: "stretch",
  },
  featureList: { gap: spacing.sm },
  featureRow: { flexDirection: "row", gap: spacing.sm },
  featureStar: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.primary,
  },
  featureText: { flex: 1, lineHeight: 20 },
  featureLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.text,
  },
  featureNote: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
    color: colors.primary,
  },
  biweeklyDesc: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    maxHeight: "92%",
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: spacing.sm,
  },
  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.trackBg,
    marginBottom: spacing.sm,
  },
  modalContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  invoiceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
  },
  invoiceBrand: {
    fontSize: fontSizes.xs,
    fontWeight: "800",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  invoiceTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "900",
    color: colors.text,
  },
  invoiceMeta: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
  },
  phonePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  phonePillText: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.primaryBlue900,
  },
  billGrid: { flexDirection: "row", gap: spacing.md },
  billBox: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    padding: spacing.md,
    gap: 4,
  },
  billBoxDue: {
    backgroundColor: colors.primaryMutedBg,
  },
  billBoxLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  billName: {
    fontSize: fontSizes.md,
    fontWeight: "900",
    color: colors.text,
  },
  billLine: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
    color: colors.textMuted,
  },
  hstChip: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: colors.white,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  hstChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primaryBlue900,
  },
  dueAmount: {
    fontSize: fontSizes.xl,
    fontWeight: "900",
    color: colors.primary,
  },
  invoiceTable: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  invoiceTableHead: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: "#DBEAFE",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  th: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primaryBlue900,
  },
  invoiceTableRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  tdStrong: {
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: colors.text,
  },
  tdMuted: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
    color: colors.textMuted,
  },
  totalsCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
  totalValue: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.white,
  },
  totalDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginVertical: 2,
  },
  totalDueLabel: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.white,
  },
  totalDueValue: {
    fontSize: fontSizes.lg,
    fontWeight: "900",
    color: colors.white,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  closeBtn: {
    minHeight: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textMuted,
  },
  proceedBtn: {
    minWidth: 160,
  },
});
