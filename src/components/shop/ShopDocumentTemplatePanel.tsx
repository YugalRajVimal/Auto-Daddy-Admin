import { useMemo, useState } from "react";
import { FiCheck } from "react-icons/fi";
import { toast } from "react-toastify";
import { Modal } from "../ui/modal";
import { ShopEmptyPanel } from "./ShopPanels";
import {
  shopHeroOpaqueSurfaceClass,
  shopProfileFormPanelFooterClass,
} from "./shopLayoutStyles";
import { InvoiceTemplatePreview } from "./invoice-templates/InvoiceTemplatePreview";
import {
  DEFAULT_INVOICE_PREVIEW,
  mergeInvoicePreviewShop,
  type InvoicePreviewShop,
} from "./invoice-templates/sampleInvoiceData";
import {
  DUMMY_INVOICE_TEMPLATES,
  resolveTemplateSlug,
  type ShopDocumentTemplate,
} from "./invoice-templates/invoiceTemplateCatalog";

export type { ShopDocumentTemplate };
export { DUMMY_INVOICE_TEMPLATES, resolveTemplateSlug };

const templateSaveButtonClass =
  "inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded bg-ad-form-save px-5 py-1 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60";

function InvoiceTemplateCard({
  template,
  selected,
  previewData,
  onSelect,
  onPreview,
}: {
  template: ShopDocumentTemplate;
  selected: boolean;
  previewData: ReturnType<typeof mergeInvoicePreviewShop>;
  onSelect: () => void;
  onPreview: () => void;
}) {
  return (
    <article
      className={`flex w-full max-w-[300px] flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow ${
        selected ? "border-ad-purple ring-2 ring-ad-purple/30" : "border-gray-200 hover:shadow-md"
      }`}
    >
      <div className="relative overflow-hidden bg-white">
        <button
          type="button"
          onClick={onPreview}
          className="absolute right-2 top-2 z-10 rounded bg-ad-purple px-2.5 py-0.5 text-xs font-bold text-white hover:bg-ad-purple-dark"
        >
          Preview
        </button>
        {selected ? (
          <div className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-ad-purple text-white shadow">
            <FiCheck className="text-base" strokeWidth={3} aria-hidden />
          </div>
        ) : null}

        {/* Height follows the scaled invoice — no fixed aspect gap. */}
        <InvoiceTemplatePreview
          templateId={template.id}
          data={previewData}
          mode="thumbnail"
        />

        <button
          type="button"
          onClick={onSelect}
          className="absolute inset-0 z-[1] text-left"
          aria-pressed={selected}
          aria-label={`Select ${template.name}`}
        >
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent px-2 pb-1.5 pt-8 text-center text-[10px] font-semibold text-white">
            {selected ? "Selected" : "Click to select"}
          </span>
        </button>
      </div>
      <div className="border-t border-gray-100 px-3 py-2 text-center">
        <p className="text-xs font-bold text-ad-purple">{template.name}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-gray-700">{template.description}</p>
      </div>
    </article>
  );
}

function TemplateFormFooter({
  message,
  saving,
  saveLabel,
  onSave,
  onCancel,
  cancelLabel = "Cancel",
  disabled = false,
}: {
  message: string;
  saving: boolean;
  saveLabel: string;
  onSave: () => void;
  onCancel: () => void;
  cancelLabel?: string;
  disabled?: boolean;
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
          className={templateSaveButtonClass}
        >
          {saving ? "Saving…" : saveLabel}
        </button>
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
      </div>
    </div>
  );
}

type ShopDocumentTemplatePanelProps = {
  templates: ShopDocumentTemplate[];
  selectedId: string;
  onSelect: (id: string) => void;
  savedId: string;
  /** Optional shop details used to personalize the invoice preview. */
  shopPreview?: Partial<InvoicePreviewShop> | null;
  /** Return `true` when save succeeded (panel shows success toast). */
  onSave: (id: string) => boolean | Promise<boolean>;
};

export default function ShopDocumentTemplatePanel({
  templates,
  selectedId,
  onSelect,
  savedId,
  shopPreview,
  onSave,
}: ShopDocumentTemplatePanelProps) {
  const [saving, setSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ShopDocumentTemplate | null>(null);
  const previewData = useMemo(
    () => mergeInvoicePreviewShop(DEFAULT_INVOICE_PREVIEW, shopPreview),
    [shopPreview],
  );
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? null,
    [selectedId, templates],
  );
  const hasChanges = selectedId !== savedId;
  const topRow = templates.slice(0, 3);
  const bottomRow = templates.slice(3);

  const handleSave = async () => {
    if (!selectedId) {
      toast.error("Select an invoice template first.");
      return;
    }
    setSaving(true);
    try {
      const ok = await onSave(selectedId);
      if (ok) toast.success("Invoice template saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onSelect(savedId);
  };

  return (
    <>
      <div
        className={`flex h-full min-h-0 flex-col overflow-hidden rounded border border-gray-200 ${shopHeroOpaqueSurfaceClass} bg-white`}
      >
        <div className="shrink-0 border-b border-gray-100 px-4 py-4 text-center">
          <h2 className="text-base font-bold text-ad-purple sm:text-lg">
            Choose Your Invoice Template
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Preview a theme, then select and save the template for your shop invoices.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-5">
          {templates.length === 0 ? (
            <ShopEmptyPanel
              message="No invoice templates are available right now."
              className="min-h-[280px]"
            />
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap justify-center gap-4">
                {topRow.map((template) => (
                  <InvoiceTemplateCard
                    key={template.id}
                    template={template}
                    selected={selectedId === template.id}
                    previewData={previewData}
                    onSelect={() => onSelect(template.id)}
                    onPreview={() => setPreviewTemplate(template)}
                  />
                ))}
              </div>
              {bottomRow.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-4">
                  {bottomRow.map((template) => (
                    <InvoiceTemplateCard
                      key={template.id}
                      template={template}
                      selected={selectedId === template.id}
                      previewData={previewData}
                      onSelect={() => onSelect(template.id)}
                      onPreview={() => setPreviewTemplate(template)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {hasChanges ? (
          <div className="shrink-0">
            <TemplateFormFooter
              message="You are selecting your invoice template"
              saving={saving}
              saveLabel="Save"
              onSave={() => void handleSave()}
              onCancel={handleCancel}
              cancelLabel="Cancel"
              disabled={templates.length === 0 || !selectedId}
            />
          </div>
        ) : null}
      </div>

      <Modal
        isOpen={previewTemplate != null}
        onClose={() => setPreviewTemplate(null)}
        className="m-4 w-full max-w-3xl rounded-lg bg-white p-0 shadow-xl"
        showCloseButton
      >
        {previewTemplate ? (
          <div className="max-h-[85vh] overflow-y-auto">
            <div className="border-b border-gray-100 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ad-purple">
                Invoice Preview
              </p>
              <h3 className="text-base font-bold text-gray-900">{previewTemplate.name}</h3>
              <p className="text-sm text-gray-600">{previewTemplate.description}</p>
            </div>
            <div className="bg-[#f0f0f0] p-4 sm:p-6">
              <div className="mx-auto max-w-[720px] overflow-hidden rounded shadow-md">
                <InvoiceTemplatePreview
                  templateId={previewTemplate.id}
                  data={previewData}
                  mode="full"
                />
              </div>
            </div>
            {selectedTemplate?.id !== previewTemplate.id ? (
              <div className="border-t border-gray-100 px-5 py-3 text-right">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(previewTemplate.id);
                    setPreviewTemplate(null);
                  }}
                  className={templateSaveButtonClass}
                >
                  Select this template
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-100 px-5 py-3 text-right text-xs font-medium text-gray-500">
                This template is currently selected
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
