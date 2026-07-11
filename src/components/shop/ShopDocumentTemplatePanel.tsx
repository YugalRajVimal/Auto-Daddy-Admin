import { useMemo, useState } from "react";
import { FiCheck } from "react-icons/fi";
import { toast } from "react-toastify";
import { Modal } from "../ui/modal";
import { ShopEmptyPanel } from "./ShopPanels";
import {
  shopHeroOpaqueSurfaceClass,
  shopProfileFormPanelFooterClass,
} from "./shopLayoutStyles";

export type ShopDocumentTemplate = {
  id: string;
  name: string;
  description: string;
};

/** Catalog ids must match API `invoiceTemplateSlug` values. */
export const DUMMY_INVOICE_TEMPLATES: ShopDocumentTemplate[] = [
  {
    id: "classic-invoice-v1",
    name: "Invoice Template - 1",
    description: "Classic layout with HST breakdown and payment status chip.",
  },
  {
    id: "modern-invoice-v2",
    name: "Invoice Template - 2",
    description: "Compact single-page invoice with service line items.",
  },
  {
    id: "detailed-invoice-v1",
    name: "Invoice Template - 3",
    description: "Detailed invoice with customer address and round-off row.",
  },
];

export function resolveTemplateSlug(
  templates: ShopDocumentTemplate[],
  slug: string | undefined | null,
  fallback = templates[0]?.id ?? "",
): string {
  const value = typeof slug === "string" ? slug.trim() : "";
  if (value && templates.some((template) => template.id === value)) return value;
  return fallback;
}

const templateSaveButtonClass =
  "inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded bg-ad-form-save px-5 py-1 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60";

function TemplatePreviewMock({ template }: { template: ShopDocumentTemplate }) {
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ad-purple">
            Invoice Preview
          </p>
          <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
          <p className="text-sm text-gray-600">{template.description}</p>
        </div>
        <div className="h-14 w-14 shrink-0 rounded border border-dashed border-gray-300 bg-gray-50" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="h-2.5 w-full rounded bg-gray-200" />
          <div className="h-2.5 w-[80%] rounded bg-gray-200" />
        </div>
        <div className="space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="h-2.5 w-full rounded bg-gray-200" />
          <div className="h-2.5 w-[60%] rounded bg-gray-200" />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 rounded border border-gray-200 bg-white p-3">
        <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-gray-100 pb-2 text-xs font-semibold text-gray-500">
          <span>Service / Part</span>
          <span>Amount</span>
        </div>
        {[1, 2, 3].map((row) => (
          <div key={row} className="grid grid-cols-[1fr_auto] gap-2 text-sm">
            <div className="h-2.5 rounded bg-gray-100" />
            <div className="h-2.5 w-16 rounded bg-gray-100" />
          </div>
        ))}
      </div>

      <div className="flex justify-end border-t border-gray-200 pt-3">
        <div className="space-y-1 text-right">
          <div className="h-2.5 w-28 rounded bg-gray-100" />
          <div className="h-3 w-36 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

function InvoiceTemplateCard({
  template,
  selected,
  onSelect,
  onPreview,
}: {
  template: ShopDocumentTemplate;
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
        <p className="mt-1 text-[11px] leading-snug text-gray-700">{template.description}</p>
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
  /** Return `true` when save succeeded (panel shows success toast). */
  onSave: (id: string) => boolean | Promise<boolean>;
};

export default function ShopDocumentTemplatePanel({
  templates,
  selectedId,
  onSelect,
  savedId,
  onSave,
}: ShopDocumentTemplatePanelProps) {
  const [saving, setSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ShopDocumentTemplate | null>(null);
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
        className={`overflow-hidden rounded border border-gray-200 ${shopHeroOpaqueSurfaceClass} bg-white`}
      >
        <div className="border-b border-gray-100 px-4 py-4 text-center">
          <h2 className="text-base font-bold text-ad-purple sm:text-lg">
            Choose Your Invoice Template
          </h2>
        </div>

        <div className="px-4 py-5">
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
          <TemplateFormFooter
            message="You are selecting your invoice template"
            saving={saving}
            saveLabel="Save"
            onSave={() => void handleSave()}
            onCancel={handleCancel}
            cancelLabel="Cancel"
            disabled={templates.length === 0 || !selectedId}
          />
        ) : null}
      </div>

      <Modal
        isOpen={previewTemplate != null}
        onClose={() => setPreviewTemplate(null)}
        className="m-4 w-full max-w-2xl rounded-lg bg-white p-0 shadow-xl"
        showCloseButton
      >
        {previewTemplate ? (
          <div className="max-h-[80vh] overflow-y-auto">
            <TemplatePreviewMock template={previewTemplate} />
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
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
