import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  FiCheck,
  FiChevronRight,
  FiGift,
  FiGlobe,
  FiLayers,
} from "react-icons/fi";
import { toast } from "react-toastify";
import {
  CompactField,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
} from "../../components/admin/ContentPanel";
import { Modal } from "../../components/ui/modal";
import {
  shopCompactInputClass,
  shopHeroOpaqueSurfaceClass,
  shopProfileFormPanelClass,
  shopProfileFormPanelFooterClass,
} from "../../components/shop/shopLayoutStyles";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopEmptyPanel } from "../../components/shop/ShopPanels";
import { ShopFormSkeleton } from "../../components/shop/ShopListSkeletons";
import { Skeleton } from "../../components/common/Skeleton";
import { useAuth } from "../../auth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { formatCurrencyAmount } from "../../lib/currency";
import {
  addDomainDetails,
  fetchDomainDetails,
  formatDomainApiError,
  parseDomainDetailsResponse,
} from "../../lib/shopOwnerDomainApi";
import {
  fetchWebsiteTemplates,
  parseWebsiteTemplatesResponse,
  selectWebsiteTemplate,
  type WebsiteTemplate,
} from "../../lib/shopOwnerWebsiteApi";
import {
  buildSubscriptionReturnUrls,
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
} from "../../lib/shopOwnerSubscriptionApi";
import { redirectToStripeCheckout } from "../../lib/stripe";
import type { SubscriptionPlanId } from "../../types/websiteSubscription";

type ShopWebsiteSection = "overview" | "domain" | "templates" | "subscription";

const WEBSITE_SECTIONS = [
  { id: "overview", label: "Overview", variant: "primary" as const },
  { id: "domain", label: "Domain Details", variant: "primary" as const },
  { id: "templates", label: "My Website", variant: "primary" as const },
  { id: "subscription", label: "Subscription", variant: "primary" as const },
];

const SECTION_TITLES: Record<ShopWebsiteSection, string> = {
  overview: "Overview",
  domain: "Domain Details",
  templates: "My website",
  subscription: "My website",
};

const YEARLY_FEATURES: { label: string; note: string }[] = [
  { label: "Website", note: "for 365 days" },
  { label: "Free Software", note: "for 365 days" },
  { label: "Job Cards", note: "Unlimited" },
  { label: "Deals Marketplace", note: "Service deals" },
  { label: "Mobile App", note: "For You and Customers" },
];

const FALLBACK_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  yearly: {
    id: "yearly",
    title: "$ 365 Yearly plan",
    amount: 365,
    days: 365,
    hst: 49,
    features: YEARLY_FEATURES,
    invoiceRows: [
      { service: "Website", description: "Website subscription for 365 days", amount: 365 },
    ],
  },
  biweekly: {
    id: "biweekly",
    title: "$ 15 Bi-weekly plan",
    amount: 390,
    days: 14,
    hst: 51,
    description: "26 -Void cheques of CAD 15",
    invoiceRows: [
      {
        service: "Bi-weekly plan",
        description: "26 void cheques of CAD 15 for 26 bi-weekly periods",
        amount: 390,
      },
    ],
  },
};

const websiteFormSaveButtonClass =
  "inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded bg-ad-form-save px-5 py-1 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60";

function WebsiteFormFooter({
  message,
  saving = false,
  saveLabel,
  onSave,
  onCancel,
  cancelLabel = "Reset",
  disabled = false,
  hideCancel = false,
}: {
  message: string;
  saving?: boolean;
  saveLabel: string;
  onSave: () => void;
  onCancel?: () => void;
  cancelLabel?: string;
  disabled?: boolean;
  hideCancel?: boolean;
}) {
  const isDisabled = saving || disabled;
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 px-4 py-1 ${shopProfileFormPanelFooterClass}`}
    >
      <div className="flex min-w-[180px] flex-1 items-center text-xs font-serif italic text-gray-800">
        {message}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isDisabled}
          className={websiteFormSaveButtonClass}
        >
          {saving ? "Saving…" : saveLabel}
        </button>
        {!hideCancel && onCancel ? (
          <span className="text-xs text-gray-700">
            or{" "}
            <button
              type="button"
              onClick={onCancel}
              disabled={isDisabled}
              className="font-medium text-blue-600 underline hover:text-blue-700 disabled:opacity-60"
            >
              {cancelLabel}
            </button>
          </span>
        ) : null}
      </div>
    </div>
  );
}

type DomainForm = {
  domainName: string;
  expiryDate: string;
  provider: string;
  status: string;
};

const DOMAIN_STATUS_OPTIONS = ["Existing", "New"] as const;

const EMPTY_DOMAIN_FORM: DomainForm = {
  domainName: "",
  expiryDate: "",
  provider: "",
  status: "Existing",
};

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Earliest selectable expiry: tomorrow (must be in the future). */
function minExpiryDateInput(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return toDateInputValue(d);
}

function isValidDomainUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname;
    if (!host || !host.includes(".")) return false;
    return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(
      host,
    );
  } catch {
    return false;
  }
}

function isValidFutureExpiryDate(expiryDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) return false;
  const end = new Date(`${expiryDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) return false;
  // Reject invalid calendar dates (e.g. 2026-02-31 → rolls to March).
  if (toDateInputValue(end) !== expiryDate) return false;
  const min = new Date(`${minExpiryDateInput()}T00:00:00`);
  return end.getTime() >= min.getTime();
}

function daysUntilExpiry(expiryDate: string): number | null {
  if (!expiryDate) return null;
  const end = new Date(`${expiryDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function GoldCoinIcon() {
  return (
    <span
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#D4A017] bg-gradient-to-b from-[#FFE566] to-[#F5C542] text-sm font-black text-[#7C5E10] shadow-sm ring-2 ring-[#D4A017]/20"
      aria-hidden
    >
      $
    </span>
  );
}

function DomainExpiryProgress({ expiryDate }: { expiryDate: string }) {
  const daysRemaining = daysUntilExpiry(expiryDate);
  const progressPct = useMemo(() => {
    if (daysRemaining == null) return 0;
    const totalWindow = 365;
    const elapsed = Math.max(0, totalWindow - daysRemaining);
    return Math.min(100, Math.max(8, (elapsed / totalWindow) * 100));
  }, [daysRemaining]);

  if (daysRemaining == null) {
    return (
      <p className="text-sm font-semibold text-gray-700">
        Enter an expiry date to see remaining days.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-gray-900">{daysRemaining} Remaining days</p>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked
          readOnly
          aria-hidden
          className="h-4 w-4 shrink-0 accent-ad-purple"
        />
        <div className="relative h-3 min-w-0 flex-1 overflow-hidden rounded-full border border-gray-300 bg-white">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-ad-purple"
            style={{ width: `${progressPct}%` }}
          />
          <div
            className="absolute inset-y-0 rounded-full border-t-2 border-dashed border-[#82c91e]"
            style={{ left: `${progressPct}%`, right: 0 }}
          />
        </div>
      </div>
    </div>
  );
}

function DomainPanel({
  form,
  onChange,
  onSaveAndNext,
  onNext,
  onReset,
  saving,
  loading,
  readOnly = false,
}: {
  form: DomainForm;
  onChange: (next: DomainForm) => void;
  onSaveAndNext: () => void;
  onNext: () => void;
  onReset: () => void;
  saving?: boolean;
  loading?: boolean;
  readOnly?: boolean;
}) {
  if (loading) {
    return (
      <CompactFormPanel className={shopProfileFormPanelClass} showBottomBorder={false}>
        <ShopFormSkeleton />
      </CompactFormPanel>
    );
  }

  const inputClass = readOnly
    ? `${shopCompactInputClass} cursor-default bg-gray-50 text-gray-700`
    : shopCompactInputClass;

  return (
    <CompactFormPanel
      className={shopProfileFormPanelClass}
      showBottomBorder={false}
      footer={
        readOnly ? (
          <WebsiteFormFooter
            message="Your domain details are already saved"
            saveLabel="Next"
            onSave={onNext}
            hideCancel
          />
        ) : (
          <WebsiteFormFooter
            message="You are saving your domain details"
            saveLabel="Save and Next"
            saving={saving}
            onSave={onSaveAndNext}
            onCancel={onReset}
          />
        )
      }
    >
      <CompactFormRow>
        <CompactField label="Domain Name" className={compactFixedFieldWidth}>
          <input
            type="text"
            value={form.domainName}
            onChange={(e) => onChange({ ...form, domainName: e.target.value })}
            placeholder="https://auto27.ca"
            inputMode="url"
            autoComplete="url"
            readOnly={readOnly}
            className={inputClass}
          />
        </CompactField>
        <CompactField label="Expiry Date" className={compactFixedFieldWidth}>
          <input
            type="date"
            value={form.expiryDate}
            min={readOnly ? undefined : minExpiryDateInput()}
            onChange={(e) => onChange({ ...form, expiryDate: e.target.value })}
            readOnly={readOnly}
            disabled={readOnly}
            className={inputClass}
          />
        </CompactField>
        <CompactField label="Provider" className={compactFixedFieldWidth}>
          <input
            type="text"
            value={form.provider}
            onChange={(e) => onChange({ ...form, provider: e.target.value })}
            placeholder="Name Silo"
            readOnly={readOnly}
            className={inputClass}
          />
        </CompactField>
        <CompactField label="Status" className={compactFixedFieldWidth}>
          <select
            value={form.status}
            onChange={(e) => onChange({ ...form, status: e.target.value })}
            disabled={readOnly}
            className={inputClass}
          >
            {DOMAIN_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </CompactField>
      </CompactFormRow>
      <div className="mt-4 border-t border-ad-form-border/60 pt-3">
        <DomainExpiryProgress expiryDate={form.expiryDate} />
      </div>
    </CompactFormPanel>
  );
}

function WebsiteTemplateCardSkeleton() {
  return (
    <article className="flex w-full max-w-[260px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 border-t border-gray-100 px-3 py-2.5 text-center">
        <Skeleton className="mx-auto h-3 w-24 rounded" />
        <Skeleton className="mx-auto h-3 w-full rounded" />
      </div>
    </article>
  );
}

function WebsiteTemplateGridSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-center gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <WebsiteTemplateCardSkeleton key={`top-${index}`} />
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {Array.from({ length: 2 }, (_, index) => (
          <WebsiteTemplateCardSkeleton key={`bottom-${index}`} />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  tagline,
  selected,
  onSelect,
  onPreview,
}: {
  template: WebsiteTemplate;
  tagline: string;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  return (
    <article
      className={`flex w-full max-w-[260px] flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow ${
        selected ? "border-ad-purple ring-2 ring-ad-purple/30" : "border-gray-200 hover:shadow-md"
      }`}
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        <button
          type="button"
          onClick={onPreview}
          className="absolute right-2 top-2 z-10 rounded bg-ad-purple px-2.5 py-0.5 text-xs font-bold text-white hover:bg-ad-purple-dark"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={onSelect}
          className="flex h-full w-full items-center justify-center"
          aria-pressed={selected}
        >
          {selected ? (
            <FiCheck className="text-5xl text-gray-900" strokeWidth={3} aria-hidden />
          ) : (
            <span className="text-xs font-medium text-gray-400">Click to select</span>
          )}
        </button>
      </div>
      <div className="border-t border-gray-100 px-3 py-2.5 text-center">
        <p className="text-xs font-bold text-ad-purple">{template.name}</p>
        <p className="mt-1 text-[11px] leading-snug text-gray-700">{tagline}</p>
      </div>
    </article>
  );
}

function TemplateSelectionPanel({
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
  const topRow = templates.slice(0, 3);
  const bottomRow = templates.slice(3, 5);
  const showSkeleton = loading || !loaded;

  return (
    <div
      className={`overflow-hidden rounded border border-gray-200 ${shopHeroOpaqueSurfaceClass} bg-white`}
    >
      <div className="border-b border-gray-100 px-4 py-4 text-center">
        <h2 className="text-base font-bold text-ad-purple sm:text-lg">
          Let you Business Website Speaks for you
        </h2>
      </div>

      <div className="px-4 py-5">
        {showSkeleton ? (
          <WebsiteTemplateGridSkeleton />
        ) : templates.length === 0 ? (
          <ShopEmptyPanel message="No website templates are available right now." className="min-h-[280px]" />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap justify-center gap-4">
              {topRow.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  tagline={template.desc ?? ""}
                  selected={selectedId === template.id}
                  onSelect={() => onSelect(template.id)}
                  onPreview={() => onPreview(template)}
                />
              ))}
            </div>
            {bottomRow.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-4">
                {bottomRow.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    tagline={template.desc ?? ""}
                    selected={selectedId === template.id}
                    onSelect={() => onSelect(template.id)}
                    onPreview={() => onPreview(template)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <WebsiteFormFooter
        message="You are selecting your website template"
        saveLabel="Save and Next"
        saving={saving}
        onSave={onSaveAndNext}
        onCancel={() => onSelect("")}
        cancelLabel="Clear selection"
        disabled={showSkeleton || templates.length === 0}
      />
    </div>
  );
}

function PlanFeatureList({ items }: { items: { label: string; note: string }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.label} className="flex gap-2 text-sm leading-snug">
          <span className="mt-0.5 shrink-0 font-semibold text-ad-purple">*</span>
          <span className="min-w-0">
            <span className="font-semibold text-gray-900">{item.label}</span>
            <span className="ml-1 text-xs font-medium text-blue-600">({item.note})</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function SubscriptionPlanCard({
  title,
  children,
  onViewInvoice,
}: {
  title: string;
  children: ReactNode;
  onViewInvoice: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <section
        className={`flex min-h-[220px] flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 ${shopHeroOpaqueSurfaceClass} bg-white`}
      >
        <div className="bg-ad-purple px-4 py-2.5 text-center text-sm font-bold text-white">
          {title}
        </div>
        <div className="flex flex-1 flex-col p-4">{children}</div>
      </section>
      <button
        type="button"
        onClick={onViewInvoice}
        className={`${websiteFormSaveButtonClass} mt-3 w-full`}
      >
        View Invoice
      </button>
    </div>
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
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : tone === "warn"
        ? "bg-amber-50 text-amber-900 ring-amber-200"
        : tone === "muted"
          ? "bg-gray-50 text-gray-600 ring-gray-200"
          : "bg-ad-purple/8 text-ad-purple ring-ad-purple/20";
  return (
    <div className={`rounded-lg px-3 py-2 ring-1 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold">{value}</p>
    </div>
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
  icon: ReactNode;
  title: string;
  subtitle: string;
  ready: boolean;
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <article
      className={`flex w-full flex-col overflow-hidden rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        ready
          ? "border-emerald-200/80 bg-white shadow-sm"
          : "border-gray-200 bg-white/95 shadow-sm"
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ad-purple/40 ${
          ready
            ? "border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-white"
            : "border-gray-100 bg-gradient-to-r from-[#f8f0fa] to-white"
        }`}
      >
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
            ready ? "bg-emerald-100 text-emerald-700" : "bg-ad-purple/10 text-ad-purple"
          }`}
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-bold text-gray-900">{title}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                ready ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
              }`}
            >
              {ready ? "Set" : "Pending"}
            </span>
          </div>
          <p className="truncate text-xs text-gray-600">{subtitle}</p>
        </div>
        <FiChevronRight
          className="shrink-0 text-gray-400"
          aria-hidden
        />
      </button>
      <div className="flex flex-1 flex-col gap-3 p-4">{children}</div>
    </article>
  );
}

function WebsiteOverviewPanel({
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
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 ${shopHeroOpaqueSurfaceClass} bg-white`}
    >
      <div className="relative overflow-hidden border-b border-ad-purple/15 bg-gradient-to-br from-[#4b145c] via-ad-purple to-[#7a2f8f] px-5 py-6 text-white sm:px-7 sm:py-7">
        <div
          className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 left-1/3 h-36 w-36 rounded-full bg-[#f5cce8]/25 blur-2xl"
          aria-hidden
        />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              My Website
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
              Your website at a glance
            </h2>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-white/80">
              Domain, template, and subscription — everything you need to go live, summarized in one
              place.
            </p>
          </div>
          <div className="w-full shrink-0 sm:w-44">
            <div className="flex items-baseline justify-between gap-2 text-xs font-semibold text-white/85">
              <span>Setup progress</span>
              <span>
                {completedCount}/3 · {progressPct}%
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FFE566] to-[#f5cce8] transition-[width] duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-3">
        <OverviewSectionCard
          icon={<FiGlobe />}
          title="Domain Details"
          subtitle={domainLoading ? "Loading domain…" : domainHeadline}
          ready={hasDomain}
          onOpen={() => onOpenSection("domain")}
        >
          {domainLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : hasDomain ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <OverviewStatPill label="Provider" value={domain.provider.trim() || "—"} />
                <OverviewStatPill label="Status" value={domain.status.trim() || "—"} />
                <OverviewStatPill
                  label="Expiry"
                  value={domain.expiryDate || "—"}
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
              </div>
              {domain.expiryDate ? (
                <div className="pt-1">
                  <DomainExpiryProgress expiryDate={domain.expiryDate} />
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm leading-relaxed text-gray-600">
              Save your domain name, provider, and expiry so customers can find your shop online.
            </p>
          )}
        </OverviewSectionCard>

        <OverviewSectionCard
          icon={<FiLayers />}
          title="My Website"
          subtitle={templatesLoading ? "Loading templates…" : templateHeadline}
          ready={hasTemplate}
          onOpen={() => onOpenSection("templates")}
        >
          {templatesLoading ? (
            <div className="space-y-2">
              <Skeleton className="aspect-[16/10] w-full rounded-lg" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
          ) : hasTemplate ? (
            <>
              <div className="flex aspect-[16/10] items-center justify-center rounded-lg border border-ad-purple/15 bg-gradient-to-br from-[#f8f0fa] via-white to-[#fde8f4]">
                <div className="text-center">
                  <FiCheck className="mx-auto text-3xl text-ad-purple" strokeWidth={3} aria-hidden />
                  <p className="mt-2 text-xs font-bold text-ad-purple">{templateName}</p>
                </div>
              </div>
              <p className="text-xs leading-snug text-gray-600">
                {templateDesc.trim() || "Your selected website template is ready."}
              </p>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-gray-600">
              Pick a website template that speaks for your business — preview and save when you are
              ready.
            </p>
          )}
        </OverviewSectionCard>

        <OverviewSectionCard
          icon={<FiGift />}
          title="Subscription"
          subtitle={subscriptionHeadline}
          ready={hasSubscription}
          onOpen={() => onOpenSection("subscription")}
        >
          {subscriptionLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : hasSubscription ? (
            <>
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-3">
                <GoldCoinIcon />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800/80">
                    Current plan
                  </p>
                  <p className="truncate text-sm font-bold text-[#006600]">{subscriptionLabel}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <OverviewStatPill
                  label="Status"
                  value="Active"
                  tone="success"
                />
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
              </div>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-gray-600">
              Activate a yearly or bi-weekly plan to keep your website and AutoDaddy tools running.
            </p>
          )}
        </OverviewSectionCard>
      </div>
    </div>
  );
}

function SubscriptionPanel({
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
    <div className="space-y-4">
      <div
        className={`rounded-lg border border-gray-200 px-4 py-4 sm:px-5 ${shopProfileFormPanelFooterClass}`}
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-sm font-bold text-[#006600]">Current Plan</span>
          <GoldCoinIcon />
          <span className="text-center text-sm font-bold leading-snug text-[#006600] sm:text-left">
            {loading ? "Loading…" : currentLabel}
            {!loading && status?.daysLeft != null ? (
              <span className="ml-1 font-semibold text-[#006600]">
                ({status.daysLeft} days left)
              </span>
            ) : null}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SubscriptionPlanCard
          title={yearly.title}
          onViewInvoice={() => onViewInvoice("yearly")}
        >
          <PlanFeatureList items={yearly.features?.length ? yearly.features : YEARLY_FEATURES} />
        </SubscriptionPlanCard>

        <SubscriptionPlanCard
          title={biweekly.title}
          onViewInvoice={() => onViewInvoice("biweekly")}
        >
          <p className="text-sm font-semibold text-gray-900">
            {biweekly.description || "26 -Void cheques of CAD 15"}
            <span className="ml-1 text-xs font-medium text-blue-600">(for 26 Bi-weekly)</span>
          </p>
        </SubscriptionPlanCard>
      </div>
    </div>
  );
}

function WebsiteInvoiceModal({
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
    <Modal isOpen={open} onClose={onClose} className="max-w-3xl p-0">
      <div className="max-h-[90vh] overflow-y-auto p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ad-purple">autodaddy</p>
            <h2 className="text-lg font-bold text-gray-900">{planTitle}</h2>
            <p className="text-sm text-gray-600">Invoice {invoiceLabel}</p>
          </div>
          <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700">
            {billToPhone}
          </div>
        </div>

        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Bill To</p>
            <p className="font-bold text-gray-900">{billToName}</p>
            <p className="mt-1 text-sm text-gray-700">{billToAddress}</p>
            <p className="mt-2 inline-block rounded bg-white px-2 py-0.5 text-xs font-semibold text-gray-700">
              HST {billToHst}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Amount due</p>
            <p className="text-2xl font-bold text-ad-purple">{formatAmount(totalDue)}</p>
            <p className="mt-1 text-sm text-gray-600">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-2 bg-blue-100 px-3 py-2 text-xs font-bold text-blue-900">
            <span>Service</span>
            <span>Description</span>
            <span className="text-right">Amount</span>
          </div>
          {rows.map((row) => (
            <div
              key={row.service}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-2 border-t border-gray-100 px-3 py-2.5 text-sm"
            >
              <span className="font-semibold text-gray-900">{row.service}</span>
              <span className="text-gray-700">{row.description}</span>
              <span className="text-right font-semibold text-gray-900">{formatAmount(row.amount)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-ad-purple px-4 py-3 text-white">
          <div className="flex justify-between text-sm">
            <span>Sub Total</span>
            <span>{formatAmount(subTotal)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span>HST</span>
            <span>{formatAmount(hst)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-white/25 pt-2 text-base font-bold">
            <span>Total Due</span>
            <span>{formatAmount(totalDue)}</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 bg-white px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onProceed}
            disabled={processing}
            className={websiteFormSaveButtonClass}
          >
            {processing ? "Processing…" : proceedLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function ShopMyWebsitePage() {
  const { token, profile, session } = useAuth();
  const { faqsHeading, faqsDescription, business, user, refresh } = useShopOwnerPortal();
  const [activeSection, setActiveSection] = useState<ShopWebsiteSection>("overview");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [domainForm, setDomainForm] = useState<DomainForm>(EMPTY_DOMAIN_FORM);
  const [savedDomainForm, setSavedDomainForm] = useState<DomainForm>(EMPTY_DOMAIN_FORM);
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainSaving, setDomainSaving] = useState(false);
  const [templates, setTemplates] = useState<WebsiteTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [savedTemplateId, setSavedTemplateId] = useState("");
  const [templateSaving, setTemplateSaving] = useState(false);
  const [invoicePlan, setInvoicePlan] = useState<SubscriptionPlanId>("yearly");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] =
    useState<Record<SubscriptionPlanId, SubscriptionPlan>>(FALLBACK_PLANS);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const displayTemplates = useMemo(
    () =>
      templates.slice(0, 5).map((template, index) => ({
        ...template,
        name: template.name || `Template-${index + 1}`,
        desc: template.desc ?? "",
      })),
    [templates],
  );

  const invoicePlanDetails = subscriptionPlans[invoicePlan] ?? FALLBACK_PLANS[invoicePlan];

  useEffect(() => {
    const templateId = business?.websiteTemplateId?.trim();
    if (!templateId) return;
    setSelectedTemplateId((prev) => prev || templateId);
    setSavedTemplateId((prev) => prev || templateId);
  }, [business?.websiteTemplateId]);

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

  useEffect(() => {
    void loadDomainDetails();
  }, [loadDomainDetails]);

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

  useEffect(() => {
    if (token) {
      void loadTemplates();
    }
  }, [token, loadTemplates]);

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
      // Keep fallbacks; toast only when user is on subscription tab via refresh.
    } finally {
      setSubscriptionLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && (activeSection === "subscription" || activeSection === "overview")) {
      void loadSubscription();
    }
  }, [token, activeSection, loadSubscription]);

  const selectedTemplate = useMemo(
    () => displayTemplates.find((t) => t.id === selectedTemplateId) ?? null,
    [displayTemplates, selectedTemplateId],
  );

  const overviewTemplate = useMemo(() => {
    const saved =
      savedTemplateId
        ? displayTemplates.find((t) => t.id === savedTemplateId)
        : undefined;
    return saved ?? selectedTemplate;
  }, [displayTemplates, savedTemplateId, selectedTemplate]);

  const domainDaysLeft = useMemo(
    () => daysUntilExpiry(savedDomainForm.expiryDate || domainForm.expiryDate),
    [domainForm.expiryDate, savedDomainForm.expiryDate],
  );

  const billTo = useMemo(() => {
    const name =
      business?.businessName?.trim() || user?.name?.trim() || profile?.name?.trim() || "—";
    const street =
      business?.businessAddress?.trim() ||
      business?.address?.trim() ||
      user?.address?.trim() ||
      "";
    const pincode = business?.pincode?.trim() || user?.pincode?.trim() || "";
    const addressLine = [street, pincode].filter(Boolean).join(", ") || "—";
    const hst = business?.businessHSTNumber?.trim() || business?.hstNumber?.trim() || "—";
    const phone = business?.businessPhone?.trim() || user?.phone?.trim() || "—";
    return { name, addressLine, hst, phone };
  }, [business, profile?.name, user]);

  const handleDomainSaveAndNext = async () => {
    if (!domainForm.domainName.trim()) {
      toast.error("Please enter the domain name.");
      return;
    }
    if (!isValidDomainUrl(domainForm.domainName)) {
      toast.error("Please enter a valid domain URL (e.g. https://auto27.ca).");
      return;
    }
    if (!domainForm.expiryDate.trim()) {
      toast.error("Please select the domain expiry date.");
      return;
    }
    if (!isValidFutureExpiryDate(domainForm.expiryDate)) {
      toast.error("Please select a valid expiry date in the future.");
      return;
    }
    if (!token) {
      toast.error("Please sign in to continue.");
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
        toast.error(formatDomainApiError(res.data, "Could not save domain details."));
        return;
      }

      setSavedDomainForm(domainForm);
      if (res.data?.message?.trim()) {
        toast.success(res.data.message.trim());
      } else {
        toast.success("Domain details saved.");
      }
      await loadDomainDetails();
      setActiveSection("templates");
      void loadTemplates();
    } catch {
      toast.error("Network error saving domain details.");
    } finally {
      setDomainSaving(false);
    }
  };

  const handleDomainReset = () => {
    setDomainForm(savedDomainForm);
  };

  const hasExistingDomain = Boolean(savedDomainForm.domainName.trim());

  const handleDomainNext = () => {
    setActiveSection("templates");
    void loadTemplates();
  };

  const handleTemplatePreview = (template: WebsiteTemplate) => {
    const url = (template.templateLink ?? "").trim();
    if (!url) {
      toast.info(`Preview for ${template.name} is not available yet.`);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleTemplateSaveAndNext = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a website template.");
      return;
    }
    if (!token) {
      toast.error("Please sign in to continue.");
      return;
    }

    setTemplateSaving(true);
    try {
      const res = await selectWebsiteTemplate(token, selectedTemplateId);
      if (!res.ok || res.data?.success === false) {
        const msg =
          res.data?.message?.trim() || "Could not save website template selection.";
        toast.error(msg);
        return;
      }

      setSavedTemplateId(selectedTemplateId);
      if (res.data?.message?.trim()) {
        toast.success(res.data.message.trim());
      } else {
        toast.success(`Template "${selectedTemplate?.name ?? "selected"}" saved.`);
      }
      await refresh();
      setActiveSection("subscription");
    } catch {
      toast.error("Network error saving website template.");
    } finally {
      setTemplateSaving(false);
    }
  };

  const handleViewInvoice = (plan: SubscriptionPlanId) => {
    setInvoicePlan(plan);
    setInvoiceOpen(true);
  };

  const handleProceedPayment = async () => {
    if (!token) {
      toast.error("Please sign in to continue.");
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
          toast.error(formatSubscriptionApiError(data, "Could not submit void cheque purchase."));
          return;
        }
        const invoiceNo =
          data?.invoiceNo?.trim() || data?.data?.invoiceNo?.trim() || "";
        toast.success(
          data?.message?.trim() ||
            (invoiceNo
              ? `Void cheque purchase submitted (${invoiceNo}).`
              : "Void cheque purchase submitted."),
        );
        setInvoiceOpen(false);
        await loadSubscription();
        return;
      }

      const { successUrl, cancelUrl } = buildSubscriptionReturnUrls("yearly");
      const res = await createSubscriptionCheckout(token, {
        planId: "yearly",
        successUrl,
        cancelUrl,
      });

      const data = res.data;
      const succeeded = res.ok && data?.success !== false;
      if (!succeeded) {
        toast.error(formatSubscriptionApiError(data));
        return;
      }

      const session = extractCheckoutSession(data);
      if (!session?.checkoutUrl && !session?.stripeSessionId) {
        toast.error(data?.message?.trim() || "Checkout URL not returned.");
        return;
      }

      if (data?.message?.trim()) {
        toast.info(data.message.trim());
      }

      const { error } = await redirectToStripeCheckout(session!);
      if (error) {
        toast.error(error);
        return;
      }

      setInvoiceOpen(false);
    } catch {
      toast.error("Network error starting payment.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment")?.toLowerCase();
    const invoiceNo =
      params.get("invoiceNo")?.trim() ||
      params.get("invoice_no")?.trim() ||
      params.get("order_id")?.trim() ||
      "";

    if (payment !== "success" && payment !== "cancel") return;

    setActiveSection("subscription");

    const clearPaymentParams = () => {
      params.delete("payment");
      params.delete("plan");
      params.delete("invoiceNo");
      params.delete("invoice_no");
      params.delete("order_id");
      params.delete("session_id");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", next);
    };

    if (payment === "cancel") {
      toast.info(
        invoiceNo
          ? `Payment was cancelled (${invoiceNo}).`
          : "Payment was cancelled.",
      );
      clearPaymentParams();
      return;
    }

    if (!invoiceNo) {
      toast.info("Payment returned, but invoice number was missing. Refresh subscription status shortly.");
      clearPaymentParams();
      void loadSubscription();
      return;
    }

    void (async () => {
      const pollDelaysMs = [0, 2000, 4000, 6000];
      for (const delayMs of pollDelaysMs) {
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        try {
          const statusRes = await fetchSubscriptionInvoiceStatus(token, invoiceNo);
          const parsed = parseInvoicePaymentStatus(statusRes.data);
          if (parsed?.paid) {
            toast.success(`Payment successful (${invoiceNo}).`);
            clearPaymentParams();
            await loadSubscription();
            return;
          }
        } catch {
          // Retry on next poll.
        }
      }
      toast.info(
        "Payment not confirmed yet. Your backend must receive the Stripe webhook to mark the invoice Paid.",
      );
      clearPaymentParams();
      await loadSubscription();
    })();
  }, [token, loadSubscription]);

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
            onSaveAndNext={handleDomainSaveAndNext}
            onNext={handleDomainNext}
            onReset={handleDomainReset}
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
            onSaveAndNext={handleTemplateSaveAndNext}
            saving={templateSaving}
          />
        );
      case "subscription":
        return (
          <SubscriptionPanel
            plans={subscriptionPlans}
            status={subscriptionStatus}
            loading={subscriptionLoading}
            onViewInvoice={handleViewInvoice}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <ShopPageShell
        pageHeading={SECTION_TITLES[activeSection]}
        metaTitle="My Website | AutoDaddy"
        metaDescription="Manage your auto shop website, domain, and subscription"
        sidebarVariant="nav"
        sidebarItems={WEBSITE_SECTIONS}
        activeSidebarId={activeSection}
        onSidebarSelect={(id) => setActiveSection(id as ShopWebsiteSection)}
        heroBackgroundImage={false}
        contentTopOffset
        heroCardFlush
        onFaqsOpen={() => setFaqsOpen(true)}
        onFaqsClose={() => setFaqsOpen(false)}
        faqsOpen={faqsOpen}
        faqsHeading={faqsHeading}
        faqsDescription={faqsDescription}
      >
        {renderContent()}
      </ShopPageShell>

      <WebsiteInvoiceModal
        open={invoiceOpen}
        plan={invoicePlan}
        planDetails={invoicePlanDetails}
        onClose={() => setInvoiceOpen(false)}
        onProceed={handleProceedPayment}
        billToName={billTo.name}
        billToAddress={billTo.addressLine}
        billToHst={billTo.hst}
        billToPhone={billTo.phone}
        countryCode={session?.meta?.countryCode}
        processing={paymentProcessing}
      />
    </>
  );
}
