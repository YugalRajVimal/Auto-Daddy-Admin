import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { FiCheck, FiImage, FiMaximize2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { useAuth } from "../../auth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import {
  fetchInvoicePrefix,
  parseInvoicePrefix,
  updateInvoicePrefix,
  updateTemplateSlugs,
} from "../../lib/autoshopownerApi";
import { apiMessage } from "../../lib/shopOwnerMutations";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import { Modal } from "../ui/modal";
import { InvoiceMiniature } from "./invoice-templates/InvoiceMiniature";
import { InvoiceTemplatePreview } from "./invoice-templates/InvoiceTemplatePreview";
import {
  DUMMY_INVOICE_TEMPLATES,
  resolveTemplateSlug,
} from "./invoice-templates/invoiceTemplateCatalog";
import {
  DEFAULT_INVOICE_PREVIEW,
  mergeInvoicePreviewShop,
} from "./invoice-templates/sampleInvoiceData";
import { ShopFieldRow, ShopSaveBar, shopSoftInputClass } from "./shopUi";

/** Profile → Invoice Templates: template strip, large preview and invoice settings. */
export default function ShopInvoiceTemplateSettings() {
  const { token } = useAuth();
  const { business, refresh } = useShopOwnerPortal();

  const savedTemplateId = useMemo(
    () => resolveTemplateSlug(DUMMY_INVOICE_TEMPLATES, business?.invoiceTemplateSlug),
    [business?.invoiceTemplateSlug],
  );
  const [templateId, setTemplateId] = useState(savedTemplateId);
  const [prefix, setPrefix] = useState("");
  const [savedPrefix, setSavedPrefix] = useState("");
  const [nextNumber, setNextNumber] = useState<number | null>(null);
  const [prefixLoading, setPrefixLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setTemplateId(savedTemplateId);
  }, [savedTemplateId]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setPrefixLoading(true);
    void fetchInvoicePrefix(token)
      .then((res) => {
        if (cancelled || !res.ok) return;
        const { prefix: loaded, invoiceCounter } = parseInvoicePrefix(res.data);
        setPrefix(loaded);
        setSavedPrefix(loaded);
        setNextNumber(invoiceCounter);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load invoice prefix.");
      })
      .finally(() => {
        if (!cancelled) setPrefixLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const previewData = useMemo(
    () =>
      mergeInvoicePreviewShop(DEFAULT_INVOICE_PREVIEW, {
        name: business?.businessName,
        address:
          [business?.businessAddress ?? business?.address, business?.city, business?.pincode]
            .filter(Boolean)
            .join(", ") || undefined,
        phone: business?.businessPhone,
        email: business?.email,
        logoUrl: business?.businessLogo,
      }),
    [business],
  );

  const selectedTemplate =
    DUMMY_INVOICE_TEMPLATES.find((template) => template.id === templateId) ?? DUMMY_INVOICE_TEMPLATES[0];
  const logoSrc = normalizeMediaUrl(business?.businessLogo ?? null);
  const templateChanged = templateId !== savedTemplateId;
  const prefixChanged = prefix.trim() !== savedPrefix.trim();
  const dirty = templateChanged || prefixChanged;

  const handleReset = () => {
    setTemplateId(savedTemplateId);
    setPrefix(savedPrefix);
  };

  const handleSave = async () => {
    if (!token) {
      toast.error("Sign in to save invoice settings.");
      return;
    }
    if (!dirty) {
      toast.info("Nothing to save.");
      return;
    }
    setSaving(true);
    try {
      if (templateChanged) {
        const res = await updateTemplateSlugs(token, { invoiceTemplateSlug: templateId });
        if (!res.ok) {
          toast.error(apiMessage(res.data) || "Could not save invoice template.");
          return;
        }
      }
      if (prefixChanged) {
        const res = await updateInvoicePrefix(token, prefix.trim());
        if (!res.ok) {
          toast.error(apiMessage(res.data) || "Could not update invoice prefix.");
          return;
        }
        setSavedPrefix(prefix.trim());
      }
      toast.success("Invoice settings saved.");
      void refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-[#9fd49f] bg-[#fffbe3] p-3 shadow-inner">
        <ul className="no-scrollbar flex gap-4 overflow-x-auto px-1 py-2">
          {DUMMY_INVOICE_TEMPLATES.map((template) => {
            const selected = template.id === templateId;
            return (
              <li key={template.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setTemplateId(template.id)}
                  aria-pressed={selected}
                  title={template.name}
                  className={`relative block w-[92px] overflow-hidden rounded-md bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    selected ? "ring-2 ring-ad-purple ring-offset-2 ring-offset-[#fffbe3]" : "ring-1 ring-gray-200"
                  }`}
                >
                  <InvoiceMiniature templateId={template.id} data={previewData} width={92} height={120} />
                  {selected ? (
                    <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-ad-purple text-white shadow">
                      <FiCheck className="size-3" strokeWidth={3} aria-hidden />
                    </span>
                  ) : null}
                </button>
                <p className="mt-1.5 w-[92px] truncate text-center text-[11px] font-semibold text-gray-600">
                  {template.name}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <div className="mx-auto w-[300px]">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="group relative block w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
            aria-label={`Open full preview of ${selectedTemplate?.name ?? "template"}`}
          >
            {selectedTemplate ? (
              <InvoiceMiniature templateId={selectedTemplate.id} data={previewData} width={298} height={390} />
            ) : null}
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100">
              <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-ad-purple shadow">
                <FiMaximize2 aria-hidden /> Full preview
              </span>
            </span>
          </button>
          <p className="mt-2 text-center text-sm font-semibold text-ad-purple">{selectedTemplate?.name}</p>
        </div>

        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-6">
            <ShopFieldRow label="Logo">
              <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-100 px-3 py-2">
                <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-gray-200">
                  {logoSrc ? (
                    <img src={logoSrc} alt="Business logo" className="h-full w-full object-contain" />
                  ) : (
                    <FiImage className="size-5 text-gray-400" aria-hidden />
                  )}
                </span>
                <Link
                  to="/shop/profile?section=business"
                  className="text-sm font-medium text-blue-700 underline underline-offset-2 hover:text-ad-purple"
                >
                  {logoSrc ? "Change in Business Info" : "Upload in Business Info"}
                </Link>
              </div>
            </ShopFieldRow>

            <ShopFieldRow label="Invoice Prefix" htmlFor="invoice-prefix">
              <input
                id="invoice-prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder={prefixLoading ? "Loading…" : "e.g. IN-"}
                disabled={prefixLoading}
                className={shopSoftInputClass}
              />
            </ShopFieldRow>

            <ShopFieldRow label="Invoice Start No">
              <div className={`${shopSoftInputClass} text-gray-600`}>
                {prefixLoading ? "Loading…" : `${prefix.trim()}${nextNumber ?? 1}`}
              </div>
            </ShopFieldRow>
          </div>

          <ShopSaveBar
            onSave={() => void handleSave()}
            onReset={handleReset}
            saving={saving}
            disabled={!dirty}
          />
        </div>
      </div>

      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        className="m-4 w-full max-w-3xl rounded-lg bg-white p-0 shadow-xl"
        showCloseButton
      >
        {selectedTemplate ? (
          <div className="max-h-[85vh] overflow-y-auto">
            <div className="border-b border-gray-100 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ad-purple">Invoice Preview</p>
              <h3 className="text-base font-bold text-gray-900">{selectedTemplate.name}</h3>
              <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
            </div>
            <div className="bg-[#f0f0f0] p-4 sm:p-6">
              <div className="mx-auto max-w-[720px] overflow-hidden rounded shadow-md">
                <InvoiceTemplatePreview templateId={selectedTemplate.id} data={previewData} mode="full" />
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
