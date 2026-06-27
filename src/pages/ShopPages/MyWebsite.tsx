import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import {
  CompactField,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
} from "../../components/admin/ContentPanel";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopLoadingPanel, ShopPageContentShell } from "../../components/shop/ShopPanels";
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
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#D4A017] bg-[#F5C542] text-sm font-black text-[#7C5E10] shadow-sm"
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
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.label} className="text-sm font-semibold text-gray-900">
          <span className="text-gray-800">* </span>
          <span className={item.accent ? "text-[#006600]" : "text-gray-900"}>{item.label}</span>
          {item.note ? (
            <span className="ml-1 text-xs font-medium text-blue-600">({item.note})</span>
          ) : null}
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
      className={`flex cursor-pointer items-start gap-3 rounded-lg border bg-white px-3 py-2.5 shadow-sm transition-colors ${
        checked ? "border-ad-purple ring-1 ring-ad-purple/30" : "border-gray-200 hover:border-gray-300"
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
      {price ? <span className="shrink-0 text-sm font-bold text-gray-900">{price}</span> : null}
    </label>
  );
}

function SubscriptionPanel() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanChoice>("yearly");

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center shadow-sm">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm font-bold text-[#006600]">Current Plan</span>
          <GoldCoinIcon />
          <span className="text-sm font-bold text-[#006600]">
            a day payment for 365 accumulative days
          </span>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-gray-300 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          <div className="flex-1 bg-white px-4 py-4 lg:min-w-[45%]">
            <h3 className="mb-3 text-base font-bold text-ad-purple">Fremium access</h3>
            <AccessFeatureList items={FREMIUM_FEATURES} />
          </div>
          <div className="flex flex-1 flex-col gap-3 bg-[#d4fcd4] px-4 py-4">
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
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-gray-300 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          <div className="flex-1 bg-[#ececec] px-4 py-4 lg:min-w-[45%]">
            <h3 className="mb-3 text-base font-bold text-ad-purple">Premium access</h3>
            <AccessFeatureList items={PREMIUM_FEATURES} />
          </div>
          <div className="flex flex-1 flex-col bg-[#fde8d8] px-4 py-4">
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
            <div className="mt-3 flex items-center justify-between rounded-md bg-[#cccccc] px-3 py-2">
              <span className="text-sm font-semibold text-gray-800">Total</span>
              <span className="text-base font-bold text-gray-900">$ 465</span>
            </div>
          </div>
        </div>
      </section>
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
    <>
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

  return (
    <ShopPageShell
      pageHeading={SECTION_TITLES[activeSection]}
      metaTitle="My Website | AutoDaddy"
      metaDescription="Manage your auto shop website, domain, and subscription"
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
      <ShopPageContentShell className="min-w-0">
        {activeSection === "domain" ? (
          <DomainPanel
            form={domainForm}
            onChange={setDomainForm}
            onSave={handleDomainSave}
            onReset={handleDomainReset}
          />
        ) : activeSection === "preview" ? (
          templatesLoading && templates.length === 0 ? (
            <ShopLoadingPanel variant="preview-panel" />
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
          <SubscriptionPanel />
        )}
      </ShopPageContentShell>
    </ShopPageShell>
  );
}
