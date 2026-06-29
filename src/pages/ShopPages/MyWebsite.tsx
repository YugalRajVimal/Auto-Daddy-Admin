import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import {
  CompactField,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
} from "../../components/admin/ContentPanel";
import {
  shopCompactInputClass,
  shopHeroOpaqueSurfaceClass,
  shopProfileFormPanelClass,
  shopProfileFormPanelFooterClass,
} from "../../components/shop/shopLayoutStyles";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopLoadingPanel } from "../../components/shop/ShopPanels";
import { useAuth } from "../../auth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import {
  fetchWebsiteTemplates,
  parseWebsiteTemplatesResponse,
  type WebsiteTemplate,
} from "../../lib/shopOwnerWebsiteApi";

type ShopWebsiteSection = "domain" | "preview" | "subscription";

const WEBSITE_SECTIONS = [
  { id: "domain", label: "Domain Name", variant: "primary" as const },
  { id: "preview", label: "Selected Web - Temp", variant: "primary" as const },
  { id: "subscription", label: "Subscription", variant: "primary" as const },
];

const SECTION_TITLES: Record<ShopWebsiteSection, string> = {
  domain: "Domain Name",
  preview: "Selected Web - Temp",
  subscription: "Subscription",
};

const PROVIDER_OPTIONS = [
  { value: "", label: "Select provider" },
  { value: "godaddy", label: "GoDaddy" },
  { value: "namecheap", label: "Namecheap" },
  { value: "cloudflare", label: "Cloudflare" },
  { value: "google", label: "Google Domains" },
  { value: "other", label: "Other" },
];

type SubscriptionPlanChoice = "yearly" | "biweekly" | "premium";

const FREMIUM_FEATURES: { label: string; note?: string }[] = [
  { label: "Website", note: "for 365 days" },
  { label: "Free Software", note: "for 365 days" },
  { label: "Job Cards", note: "Unlimited" },
  { label: "Promotional Deals", note: "Service deals" },
  { label: "Digital Presence", note: "Local & National" },
];

const PREMIUM_FEATURES: { label: string; note?: string; accent?: boolean }[] = [
  { label: "Fremium +", accent: true },
  {
    label: "Trash to cash",
    note: "Market place for sale of Salvage stocks across Canada",
  },
];

const checkboxBoxClass =
  "inline-block border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs text-gray-800";

const websiteFormSaveButtonClass =
  "inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded bg-ad-form-save px-5 py-1 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60";

function WebsiteFormFooter({
  message,
  saving = false,
  saveLabel,
  onSave,
  onCancel,
  cancelLabel = "Reset",
}: {
  message: string;
  saving?: boolean;
  saveLabel: string;
  onSave: () => void;
  onCancel: () => void;
  cancelLabel?: string;
}) {
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
          disabled={saving}
          className={websiteFormSaveButtonClass}
        >
          {saving ? "Saving…" : saveLabel}
        </button>
        <span className="text-xs text-gray-700">
          or{" "}
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="font-medium text-blue-600 underline hover:text-blue-700 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        </span>
      </div>
    </div>
  );
}

type DomainForm = {
  domainName: string;
  expiryDate: string;
  provider: string;
  existing: boolean;
};

const EMPTY_DOMAIN_FORM: DomainForm = {
  domainName: "",
  expiryDate: "",
  provider: "",
  existing: true,
};

function GoldCoinIcon() {
  return (
    <span
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#D4A017] bg-gradient-to-b from-[#FFE566] to-[#F5C542] text-sm font-black text-[#7C5E10] shadow-sm ring-2 ring-[#D4A017]/20"
      aria-hidden
    >
      $1
    </span>
  );
}

function AccessFeatureList({
  items,
}: {
  items: { label: string; note?: string; accent?: boolean }[];
}) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="flex gap-2 text-sm leading-snug">
          <span className="mt-0.5 shrink-0 font-semibold text-ad-purple">*</span>
          <span className="min-w-0">
            <span className={`font-semibold ${item.accent ? "text-[#006600]" : "text-gray-900"}`}>
              {item.label}
            </span>
            {item.note ? (
              <span className="ml-1 text-xs font-medium text-blue-600">({item.note})</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PlanRadioOption({
  name,
  value,
  checked,
  onChange,
  children,
  price,
}: {
  name: string;
  value: SubscriptionPlanChoice;
  checked: boolean;
  onChange: (value: SubscriptionPlanChoice) => void;
  children: ReactNode;
  price: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-md border px-3.5 py-3 transition-colors ${
        checked
          ? "border-ad-purple bg-white ring-1 ring-ad-purple/25"
          : "border-gray-200 bg-white/95 hover:border-ad-purple/35 hover:bg-white"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="mt-1 h-4 w-4 shrink-0 accent-ad-purple"
      />
      <div className="min-w-0 flex-1">{children}</div>
      {price ? (
        <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-sm font-bold text-gray-900">
          {price}
        </span>
      ) : null}
    </label>
  );
}

function SubscriptionPlanCard({
  title,
  features,
  featuresMuted,
  children,
}: {
  title: string;
  features: { label: string; note?: string; accent?: boolean }[];
  featuresMuted?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-lg border border-gray-200 ${shopHeroOpaqueSurfaceClass} bg-white`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:divide-x lg:divide-gray-200">
        <div className={`p-4 sm:p-5 ${featuresMuted ? "bg-gray-50/90" : "bg-white"}`}>
          <h3 className="mb-4 border-b border-gray-100 pb-2 text-base font-bold text-ad-purple">
            {title}
          </h3>
          <AccessFeatureList items={features} />
        </div>
        <div className={`flex flex-col gap-3 p-4 sm:p-5 ${shopProfileFormPanelFooterClass}`}>
          {children}
        </div>
      </div>
    </section>
  );
}

function SubscriptionPanel() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanChoice>("yearly");

  return (
    <div className="space-y-3">
      <div
        className={`rounded-lg border border-gray-200 px-4 py-4 sm:px-5 ${shopProfileFormPanelFooterClass}`}
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-sm font-bold text-[#006600]">Current Plan</span>
          <GoldCoinIcon />
          <span className="text-center text-sm font-bold leading-snug text-[#006600] sm:text-left">
            a day payment for 365 accumulative days
          </span>
        </div>
      </div>

      <SubscriptionPlanCard title="Fremium access" features={FREMIUM_FEATURES}>
        <PlanRadioOption
          name="subscription-plan"
          value="yearly"
          checked={selectedPlan === "yearly"}
          onChange={setSelectedPlan}
          price="$ 365"
        >
          <p className="text-sm font-semibold text-blue-600">$ 1/- a day for 365 days</p>
        </PlanRadioOption>
        <PlanRadioOption
          name="subscription-plan"
          value="biweekly"
          checked={selectedPlan === "biweekly"}
          onChange={setSelectedPlan}
          price="$ 115"
        >
          <p className="text-xs font-semibold leading-snug text-blue-600">
            $ 1/- a day for 14 days with 25 void cheques of $ 15 each
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-gray-800">
            + $ 100 (refundable deposit)
          </p>
        </PlanRadioOption>
      </SubscriptionPlanCard>

      <SubscriptionPlanCard
        title="Premium access"
        features={PREMIUM_FEATURES}
        featuresMuted
      >
        <PlanRadioOption
          name="subscription-plan"
          value="premium"
          checked={selectedPlan === "premium"}
          onChange={setSelectedPlan}
          price=""
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-blue-600">Yearly payment plan +</p>
              <span className="shrink-0 text-sm font-bold text-gray-900">$ 365</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium text-gray-800">
                Marketplace access for autodaddy customers
              </p>
              <span className="shrink-0 text-sm font-bold text-gray-900">$ 100</span>
            </div>
          </div>
        </PlanRadioOption>
        <div
          className={`flex items-center justify-between rounded-md border border-gray-200/80 px-3 py-2.5 ${shopProfileFormPanelFooterClass}`}
        >
          <span className="text-sm font-semibold text-gray-800">Total</span>
          <span className="text-base font-bold text-gray-900">$ 465</span>
        </div>
      </SubscriptionPlanCard>
    </div>
  );
}

function DomainPanel({
  form,
  onChange,
  onSave,
  onReset,
}: {
  form: DomainForm;
  onChange: (next: DomainForm) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <CompactFormPanel
      className={shopProfileFormPanelClass}
      showBottomBorder={false}
      footer={
        <WebsiteFormFooter
          message="You are saving your domain details"
          saveLabel="Save"
          onSave={onSave}
          onCancel={onReset}
        />
      }
    >
        <CompactFormRow>
          <CompactField label="Domain Name" className={compactFixedFieldWidth}>
            <input
              type="text"
              value={form.domainName}
              onChange={(e) => onChange({ ...form, domainName: e.target.value })}
              className={shopCompactInputClass}
            />
          </CompactField>
          <CompactField label="Expiry Date" className={compactFixedFieldWidth}>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => onChange({ ...form, expiryDate: e.target.value })}
              className={shopCompactInputClass}
            />
          </CompactField>
          <CompactField label="Provider" className={compactFixedFieldWidth}>
            <select
              value={form.provider}
              onChange={(e) => onChange({ ...form, provider: e.target.value })}
              className={shopCompactInputClass}
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.value || "empty"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </CompactField>
        </CompactFormRow>
        <CompactFormRow>
          <label className={`flex cursor-pointer items-center gap-2 ${checkboxBoxClass}`}>
            <input
              type="checkbox"
              checked={form.existing}
              onChange={(e) => onChange({ ...form, existing: e.target.checked })}
              className="h-3.5 w-3.5 accent-ad-purple"
            />
            Existing
          </label>
        </CompactFormRow>
    </CompactFormPanel>
  );
}

function PreviewPanel({
  templates,
  loading,
  selectedId,
  onSelect,
  selected,
  previewEnabled,
  onTogglePreview,
  onPreview,
}: {
  templates: WebsiteTemplate[];
  loading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  selected: WebsiteTemplate | null;
  previewEnabled: boolean;
  onTogglePreview: (enabled: boolean) => void;
  onPreview: () => void;
}) {
  const previewUrl = (selected?.templateLink ?? "").trim();

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
      <div className="flex min-h-[2rem] shrink-0 flex-wrap items-center justify-end gap-3">
        <label className={`flex cursor-pointer items-center gap-2 ${checkboxBoxClass}`}>
          <input
            type="checkbox"
            checked={previewEnabled}
            onChange={(e) => onTogglePreview(e.target.checked)}
            className="h-3.5 w-3.5 accent-ad-purple"
          />
          Selected
        </label>
        <select
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          disabled={loading || templates.length === 0}
          className={`min-w-[220px] flex-1 ${shopCompactInputClass}`}
        >
          {loading ? (
            <option value="">Loading…</option>
          ) : templates.length === 0 ? (
            <option value="">No templates available</option>
          ) : (
            templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))
          )}
        </select>
        <button
          type="button"
          onClick={onPreview}
          disabled={!previewEnabled || !previewUrl}
          className={`${websiteFormSaveButtonClass} min-w-[9rem]`}
        >
          Preview
        </button>
      </div>

      <div className="relative min-h-0 overflow-hidden rounded border border-gray-200 bg-white">
        {loading ? (
          <ShopLoadingPanel variant="preview-panel" className="h-full" />
        ) : !previewEnabled || !previewUrl ? (
          <p className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-600">
            Select a website template and click Preview to see your site here.
          </p>
        ) : (
          <iframe
            title="Website preview"
            src={previewUrl}
            className="absolute inset-0 h-full w-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        )}
      </div>
    </div>
  );
}

export default function ShopMyWebsitePage() {
  const { token } = useAuth();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [activeSection, setActiveSection] = useState<ShopWebsiteSection>("domain");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [domainForm, setDomainForm] = useState<DomainForm>(EMPTY_DOMAIN_FORM);
  const [savedDomainForm, setSavedDomainForm] = useState<DomainForm>(EMPTY_DOMAIN_FORM);
  const [templates, setTemplates] = useState<WebsiteTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const loadTemplates = useCallback(async () => {
    if (!token) {
      setTemplates([]);
      setSelectedTemplateId("");
      return;
    }
    setTemplatesLoading(true);
    try {
      const res = await fetchWebsiteTemplates(token);
      if (!res.ok) {
        setTemplates([]);
        setSelectedTemplateId("");
        return;
      }
      const { templates: list } = parseWebsiteTemplatesResponse(res.data);
      setTemplates(list);
      setSelectedTemplateId((prev) => {
        if (prev && list.some((t) => t.id === prev)) return prev;
        return list[0]?.id ?? "";
      });
    } finally {
      setTemplatesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeSection === "preview") {
      void loadTemplates();
    }
  }, [activeSection, loadTemplates]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates]
  );

  const handleDomainSave = () => {
    setSavedDomainForm(domainForm);
    toast.success("Domain details saved.");
  };

  const handleDomainReset = () => {
    setDomainForm(savedDomainForm);
  };

  const handlePreview = () => {
    const url = (selectedTemplate?.templateLink ?? "").trim();
    if (!url) {
      toast.error("Preview link not available for this template.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const renderContent = () => {
    switch (activeSection) {
      case "domain":
        return (
          <DomainPanel
            form={domainForm}
            onChange={setDomainForm}
            onSave={handleDomainSave}
            onReset={handleDomainReset}
          />
        );
      case "preview":
        if (templatesLoading && templates.length === 0) {
          return (
            <div className="h-full min-h-0">
              <ShopLoadingPanel variant="preview-panel" className="h-full" />
            </div>
          );
        }
        return (
          <PreviewPanel
            templates={templates}
            loading={templatesLoading}
            selectedId={selectedTemplateId}
            onSelect={setSelectedTemplateId}
            selected={selectedTemplate}
            previewEnabled={previewEnabled}
            onTogglePreview={setPreviewEnabled}
            onPreview={handlePreview}
          />
        );
      case "subscription":
        return <SubscriptionPanel />;
      default:
        return null;
    }
  };

  return (
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
      contentFillHeight={activeSection === "preview"}
      heroCardFlush
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      {renderContent()}
    </ShopPageShell>
  );
}
