import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  CompactField,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
} from "../../components/admin/ContentPanel";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopLoadingPanel } from "../../components/shop/ShopPanels";
import ShopWebsiteSidebar, {
  type ShopWebsiteSection,
} from "../../components/shop/ShopWebsiteSidebar";
import { useAuth } from "../../auth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import {
  fetchWebsiteTemplates,
  parseWebsiteTemplatesResponse,
  type WebsiteTemplate,
} from "../../lib/shopOwnerWebsiteApi";

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

const STANDARD_FEATURES = [
  "Professional Website",
  "Software + Mobile App",
  "Unlimited Job Cards",
  "Tab a Job Card to Invoice",
  "Trash to Cash (Salvages)",
  "Promotion Deals Marketplace",
  "Customer Alerts for Next due Service",
  "Digital Presence Local to across Canada",
  "One Website Revision",
];

const PROFESSIONAL_FEATURES = [
  "Professional Website",
  "Professional E-mail",
  "Unlimited Job Cards",
  "Tab a Job Card to Invoice",
  "Software + Mobile App",
  "Expense management",
  "Trash to Cash (Salvages)",
  "Marketplace for Deal Promotion",
  "Customer Alerts for Next due Service",
  "Safety Tips of the day",
  "Digital Presence Local to across Canada",
];

const checkboxBoxClass =
  "inline-block border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs text-gray-800";

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

function WebsiteSectionHeader({ title }: { title: string }) {
  return (
    <div className="relative mb-4 flex min-h-[36px] items-center justify-end">
      <h2 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center text-lg font-bold text-blue-700 md:text-xl">
        {title}
      </h2>
    </div>
  );
}

function GoldCoinIcon() {
  return (
    <span
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#D4A017] bg-[#F5C542] text-sm font-black text-[#7C5E10] shadow-sm"
      aria-hidden
    >
      $1
    </span>
  );
}

function PlanFeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 px-4 py-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm font-semibold text-gray-900">
          <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-[#006600] bg-white text-[10px] font-bold text-[#006600]">
            ✓
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SubscriptionPlanCard({
  title,
  features,
  onSeeInvoice,
}: {
  title: string;
  features: string[];
  onSeeInvoice: () => void;
}) {
  return (
    <article className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#006600]/30 shadow-sm">
      <header className="bg-[#008000] px-4 py-3 text-center text-white">
        <h3 className="text-base font-bold">{title}</h3>
        <p className="text-xs font-semibold opacity-90">Includes</p>
      </header>
      <div className="flex-1 bg-[#d4fcd4]">
        <PlanFeatureList items={features} />
      </div>
      <button
        type="button"
        onClick={onSeeInvoice}
        className="bg-[#cccccc] px-4 py-2.5 text-center text-sm font-bold text-gray-800 hover:bg-[#bdbdbd]"
      >
        See Invoice &gt;&gt;
      </button>
    </article>
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
    <>
      <WebsiteSectionHeader title={SECTION_TITLES.domain} />
      <CompactFormPanel
        footer={
          <div className="flex items-center justify-end gap-2 border-t border-ad-form-border bg-ad-form-required-bg px-3 py-2.5">
            <button
              type="button"
              onClick={onSave}
              className="inline-flex items-center gap-1.5 rounded bg-[#008000] px-4 py-1 text-sm font-bold text-white hover:bg-[#006600]"
            >
              Save
            </button>
            <span className="text-xs text-gray-700">
              or{" "}
              <button
                type="button"
                onClick={onReset}
                className="font-medium text-blue-600 underline hover:text-blue-700"
              >
                Reset
              </button>
            </span>
          </div>
        }
      >
        <CompactFormRow>
          <CompactField label="Domain Name" className={compactFixedFieldWidth}>
            <input
              type="text"
              value={form.domainName}
              onChange={(e) => onChange({ ...form, domainName: e.target.value })}
              className={compactInputClass}
            />
          </CompactField>
          <CompactField label="Expiry Date" className={compactFixedFieldWidth}>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => onChange({ ...form, expiryDate: e.target.value })}
              className={compactInputClass}
            />
          </CompactField>
          <CompactField label="Provider" className={compactFixedFieldWidth}>
            <select
              value={form.provider}
              onChange={(e) => onChange({ ...form, provider: e.target.value })}
              className={compactInputClass}
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
              className="h-3.5 w-3.5 accent-[#008000]"
            />
            Existing
          </label>
        </CompactFormRow>
      </CompactFormPanel>
    </>
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
    <>
      <WebsiteSectionHeader title={SECTION_TITLES.preview} />

      <div className="relative mb-4 rounded border border-ad-form-border bg-ad-form-bg px-4 py-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className={`flex cursor-pointer items-center gap-2 ${checkboxBoxClass}`}>
            <input
              type="checkbox"
              checked={previewEnabled}
              onChange={(e) => onTogglePreview(e.target.checked)}
              className="h-3.5 w-3.5 accent-[#008000]"
            />
            Selected
          </label>
          <select
            value={selectedId}
            onChange={(e) => onSelect(e.target.value)}
            disabled={loading || templates.length === 0}
            className={`min-w-[220px] flex-1 ${compactInputClass}`}
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
            className="rounded bg-[#008000] px-5 py-1.5 text-sm font-bold text-white hover:bg-[#006600] disabled:opacity-50"
          >
            Preview
          </button>
        </div>
      </div>

      <h3 className="mb-3 text-center font-serif text-2xl font-bold text-gray-600">My Website</h3>

      <div className="relative min-h-[420px] overflow-hidden rounded border border-ad-form-border bg-ad-form-bg shadow-sm">
        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
          </div>
        ) : !previewEnabled || !previewUrl ? (
          <div className="flex min-h-[420px] items-center justify-center p-6 text-center text-sm font-semibold text-gray-600">
            Select a website template and click Preview to see your site here.
          </div>
        ) : (
          <iframe
            title="Website preview"
            src={previewUrl}
            className="h-[min(560px,calc(100vh-320px))] w-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        )}
      </div>
    </>
  );
}

function SubscriptionPanel({ onSeeInvoice }: { onSeeInvoice: (plan: string) => void }) {
  return (
    <>
      <WebsiteSectionHeader title={SECTION_TITLES.subscription} />

      <div className="mb-5 flex flex-wrap items-center justify-center gap-3 rounded border border-ad-form-border bg-ad-form-bg px-4 py-4 text-center shadow-sm">
        <span className="text-sm font-bold text-[#006600]">Current Plan costs</span>
        <GoldCoinIcon />
        <span className="text-sm font-bold text-[#006600]">a day for Yearly Plan</span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <SubscriptionPlanCard
          title="Standard Plan"
          features={STANDARD_FEATURES}
          onSeeInvoice={() => onSeeInvoice("Standard Plan")}
        />
        <SubscriptionPlanCard
          title="Professional Plan"
          features={PROFESSIONAL_FEATURES}
          onSeeInvoice={() => onSeeInvoice("Professional Plan")}
        />
      </div>
    </>
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

  const handleSeeInvoice = (plan: string) => {
    toast.info(`${plan} invoice details coming soon.`);
  };

  return (
    <ShopPageShell
      metaTitle="My Website | AutoDaddy"
      metaDescription="Manage your auto shop website, domain, and subscription"
      sidebarHeading="My Website"
      sidebarHeadingClassName="font-serif text-2xl text-gray-600 md:text-3xl"
      sidebarExtra={
        <ShopWebsiteSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      }
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <div className="min-w-0 flex-1 lg:min-h-[calc(100vh-220px)]">
        {activeSection === "domain" ? (
          <DomainPanel
            form={domainForm}
            onChange={setDomainForm}
            onSave={handleDomainSave}
            onReset={handleDomainReset}
          />
        ) : activeSection === "preview" ? (
          templatesLoading && templates.length === 0 ? (
            <ShopLoadingPanel />
          ) : (
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
          )
        ) : (
          <SubscriptionPanel onSeeInvoice={handleSeeInvoice} />
        )}
      </div>
    </ShopPageShell>
  );
}
