import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { FiCheck } from "react-icons/fi";
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
import { ShopLoadingPanel } from "../../components/shop/ShopPanels";
import { useAuth } from "../../auth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { formatCurrencyAmount } from "../../lib/currency";
import {
  fetchWebsiteTemplates,
  parseWebsiteTemplatesResponse,
  type WebsiteTemplate,
} from "../../lib/shopOwnerWebsiteApi";

type ShopWebsiteSection = "domain" | "templates" | "subscription";
type SubscriptionPlanId = "yearly" | "biweekly";

const WEBSITE_SECTIONS = [
  { id: "domain", label: "Domain Details", variant: "primary" as const },
  { id: "templates", label: "My Website", variant: "primary" as const },
  { id: "subscription", label: "Subscription", variant: "primary" as const },
];

const SECTION_TITLES: Record<ShopWebsiteSection, string> = {
  domain: "Domain Details",
  templates: "My website",
  subscription: "My website",
};

const TEMPLATE_TAGLINES = [
  "Business Website means : A digital way to organize your customers",
  "Website Automation means : Less Stress - More Values",
  "Business with Website : Tells a whole story with one image",
  "Business without Website : has no voice in market",
  "Website pays itself : Never underestimate the power of website",
];

const FALLBACK_TEMPLATES: WebsiteTemplate[] = TEMPLATE_TAGLINES.map((desc, index) => ({
  id: `fallback-${index + 1}`,
  name: `Templet-${index + 1}`,
  desc,
}));

const YEARLY_FEATURES: { label: string; note: string }[] = [
  { label: "Website", note: "for 365 days" },
  { label: "Free Software", note: "for 365 days" },
  { label: "Job Cards", note: "Unlimited" },
  { label: "Deals Marketplace", note: "Service deals" },
  { label: "Mobile App", note: "For You and Customers" },
];

const INVOICE_ROWS = {
  yearly: [
    { service: "Website", description: "Website subscription for 365 days", amount: 365 },
  ],
  biweekly: [
    {
      service: "Bi-weekly plan",
      description: "26 void cheques of CAD 15 for 26 bi-weekly periods",
      amount: 390,
    },
  ],
} as const;

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
  status: string;
};

const EMPTY_DOMAIN_FORM: DomainForm = {
  domainName: "",
  expiryDate: "",
  provider: "",
  status: "Existing",
};

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
  onReset,
  saving,
}: {
  form: DomainForm;
  onChange: (next: DomainForm) => void;
  onSaveAndNext: () => void;
  onReset: () => void;
  saving?: boolean;
}) {
  return (
    <CompactFormPanel
      className={shopProfileFormPanelClass}
      showBottomBorder={false}
      footer={
        <WebsiteFormFooter
          message="You are saving your domain details"
          saveLabel="Save and Next"
          saving={saving}
          onSave={onSaveAndNext}
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
            placeholder="Auto27.ca"
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
          <input
            type="text"
            value={form.provider}
            onChange={(e) => onChange({ ...form, provider: e.target.value })}
            placeholder="Name Silo"
            className={shopCompactInputClass}
          />
        </CompactField>
        <CompactField label="Status" className={compactFixedFieldWidth}>
          <input
            type="text"
            value={form.status}
            onChange={(e) => onChange({ ...form, status: e.target.value })}
            className={shopCompactInputClass}
          />
        </CompactField>
      </CompactFormRow>
      <div className="mt-4 border-t border-ad-form-border/60 pt-3">
        <DomainExpiryProgress expiryDate={form.expiryDate} />
      </div>
    </CompactFormPanel>
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
  selectedId,
  onSelect,
  onPreview,
  onSaveAndNext,
  saving,
}: {
  templates: WebsiteTemplate[];
  loading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onPreview: (template: WebsiteTemplate) => void;
  onSaveAndNext: () => void;
  saving?: boolean;
}) {
  const topRow = templates.slice(0, 3);
  const bottomRow = templates.slice(3, 5);

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
        {loading && templates.length === 0 ? (
          <ShopLoadingPanel variant="preview-panel" className="min-h-[280px]" />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap justify-center gap-4">
              {topRow.map((template, index) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  tagline={template.desc ?? TEMPLATE_TAGLINES[index] ?? ""}
                  selected={selectedId === template.id}
                  onSelect={() => onSelect(template.id)}
                  onPreview={() => onPreview(template)}
                />
              ))}
            </div>
            {bottomRow.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-4">
                {bottomRow.map((template, index) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    tagline={template.desc ?? TEMPLATE_TAGLINES[index + 3] ?? ""}
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

function SubscriptionPanel({ onViewInvoice }: { onViewInvoice: (plan: SubscriptionPlanId) => void }) {
  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SubscriptionPlanCard
          title="$ 365 Yearly plan"
          onViewInvoice={() => onViewInvoice("yearly")}
        >
          <PlanFeatureList items={YEARLY_FEATURES} />
        </SubscriptionPlanCard>

        <SubscriptionPlanCard
          title="$ 15 Bi-weekly plan"
          onViewInvoice={() => onViewInvoice("biweekly")}
        >
          <p className="text-sm font-semibold text-gray-900">
            26 -Void cheques of CAD 15
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
  onClose: () => void;
  onProceed: () => void;
  billToName: string;
  billToAddress: string;
  billToHst: string;
  billToPhone: string;
  countryCode: string | null | undefined;
  processing?: boolean;
}) {
  const rows = INVOICE_ROWS[plan];
  const subTotal = rows.reduce((sum, row) => sum + row.amount, 0);
  const hst = plan === "yearly" ? 49 : 51;
  const totalDue = subTotal + hst;
  const invoiceLabel = plan === "yearly" ? "AD 0001" : "AD 0002";
  const planTitle = plan === "yearly" ? "Yearly website subscription" : "Bi-weekly website subscription";

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
            {processing ? "Processing…" : "Proceed with Payment"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function ShopMyWebsitePage() {
  const { token, meta } = useAuth();
  const { faqsHeading, faqsDescription, business, user } = useShopOwnerPortal();
  const [activeSection, setActiveSection] = useState<ShopWebsiteSection>("domain");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [domainForm, setDomainForm] = useState<DomainForm>(EMPTY_DOMAIN_FORM);
  const [savedDomainForm, setSavedDomainForm] = useState<DomainForm>(EMPTY_DOMAIN_FORM);
  const [domainSaving, setDomainSaving] = useState(false);
  const [templates, setTemplates] = useState<WebsiteTemplate[]>(FALLBACK_TEMPLATES);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [savedTemplateId, setSavedTemplateId] = useState("");
  const [templateSaving, setTemplateSaving] = useState(false);
  const [invoicePlan, setInvoicePlan] = useState<SubscriptionPlanId>("yearly");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const displayTemplates = useMemo(() => {
    const merged = templates.length > 0 ? templates : FALLBACK_TEMPLATES;
    return merged.slice(0, 5).map((template, index) => ({
      ...template,
      name: template.name || `Templet-${index + 1}`,
      desc: template.desc ?? TEMPLATE_TAGLINES[index] ?? "",
    }));
  }, [templates]);

  const loadTemplates = useCallback(async () => {
    if (!token) {
      setTemplates(FALLBACK_TEMPLATES);
      setSelectedTemplateId((prev) => prev || FALLBACK_TEMPLATES[0]?.id || "");
      return;
    }
    setTemplatesLoading(true);
    try {
      const res = await fetchWebsiteTemplates(token);
      if (!res.ok) {
        setTemplates(FALLBACK_TEMPLATES);
        return;
      }
      const { templates: list } = parseWebsiteTemplatesResponse(res.data);
      const next = list.length > 0 ? list : FALLBACK_TEMPLATES;
      setTemplates(next);
      setSelectedTemplateId((prev) => {
        if (prev && next.some((t) => t.id === prev)) return prev;
        if (savedTemplateId && next.some((t) => t.id === savedTemplateId)) return savedTemplateId;
        return next[0]?.id ?? "";
      });
    } finally {
      setTemplatesLoading(false);
    }
  }, [savedTemplateId, token]);

  useEffect(() => {
    if (activeSection === "templates") {
      void loadTemplates();
    }
  }, [activeSection, loadTemplates]);

  const selectedTemplate = useMemo(
    () => displayTemplates.find((t) => t.id === selectedTemplateId) ?? null,
    [displayTemplates, selectedTemplateId],
  );

  const billTo = useMemo(() => {
    const name =
      business?.businessName?.trim() || user?.name?.trim() || meta?.name?.trim() || "—";
    const street = business?.businessAddress?.trim() || user?.address?.trim() || "";
    const pincode = business?.pincode?.trim() || user?.pincode?.trim() || "";
    const addressLine = [street, pincode].filter(Boolean).join(", ") || "—";
    const hst = business?.businessHSTNumber?.trim() || "—";
    const phone = business?.businessPhone?.trim() || user?.phone?.trim() || "—";
    return { name, addressLine, hst, phone };
  }, [business, meta?.name, user]);

  const handleDomainSaveAndNext = async () => {
    if (!domainForm.expiryDate.trim()) {
      toast.error("Please enter the domain expiry date.");
      return;
    }
    if (daysUntilExpiry(domainForm.expiryDate) == null) {
      toast.error("Please enter a valid expiry date.");
      return;
    }
    setDomainSaving(true);
    try {
      setSavedDomainForm(domainForm);
      toast.success("Domain details saved.");
      setActiveSection("templates");
      void loadTemplates();
    } finally {
      setDomainSaving(false);
    }
  };

  const handleDomainReset = () => {
    setDomainForm(savedDomainForm);
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
    setTemplateSaving(true);
    try {
      setSavedTemplateId(selectedTemplateId);
      toast.success(`Template "${selectedTemplate?.name ?? "selected"}" saved.`);
      setActiveSection("subscription");
    } finally {
      setTemplateSaving(false);
    }
  };

  const handleViewInvoice = (plan: SubscriptionPlanId) => {
    setInvoicePlan(plan);
    setInvoiceOpen(true);
  };

  const handleProceedPayment = async () => {
    setPaymentProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.info("Payment checkout will open here once connected to the billing API.");
      setInvoiceOpen(false);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "domain":
        return (
          <DomainPanel
            form={domainForm}
            onChange={setDomainForm}
            onSaveAndNext={handleDomainSaveAndNext}
            onReset={handleDomainReset}
            saving={domainSaving}
          />
        );
      case "templates":
        return (
          <TemplateSelectionPanel
            templates={displayTemplates}
            loading={templatesLoading}
            selectedId={selectedTemplateId}
            onSelect={setSelectedTemplateId}
            onPreview={handleTemplatePreview}
            onSaveAndNext={handleTemplateSaveAndNext}
            saving={templateSaving}
          />
        );
      case "subscription":
        return <SubscriptionPanel onViewInvoice={handleViewInvoice} />;
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
        onClose={() => setInvoiceOpen(false)}
        onProceed={handleProceedPayment}
        billToName={billTo.name}
        billToAddress={billTo.addressLine}
        billToHst={billTo.hst}
        billToPhone={billTo.phone}
        countryCode={meta?.countryCode}
        processing={paymentProcessing}
      />
    </>
  );
}
