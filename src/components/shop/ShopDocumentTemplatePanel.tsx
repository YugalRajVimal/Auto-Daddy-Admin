import { useMemo } from "react";
import { toast } from "react-toastify";
import {
  shopCompactInputClass,
  shopProfileFormPanelFooterClass,
} from "./shopLayoutStyles";

export type ShopDocumentTemplate = {
  id: string;
  name: string;
  description: string;
};

export const DUMMY_INVOICE_TEMPLATES: ShopDocumentTemplate[] = [
  {
    id: "inv-1",
    name: "Invoice Template - 1",
    description: "Classic layout with HST breakdown and payment status chip.",
  },
  {
    id: "inv-2",
    name: "Invoice Template - 2",
    description: "Compact single-page invoice with service line items.",
  },
  {
    id: "inv-3",
    name: "Invoice Template - 3",
    description: "Detailed invoice with customer address and round-off row.",
  },
];

export const DUMMY_JOB_CARD_TEMPLATES: ShopDocumentTemplate[] = [
  {
    id: "jc-1",
    name: "Job Card Template - 1",
    description: "Standard work order with vehicle details and labour rows.",
  },
  {
    id: "jc-2",
    name: "Job Card Template - 2",
    description: "Compact job card with service checklist layout.",
  },
  {
    id: "jc-3",
    name: "Job Card Template - 3",
    description: "Job card with vehicle photo strip and terms block.",
  },
];

const checkboxBoxClass =
  "inline-block border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs text-gray-800";

const templateSaveButtonClass =
  "inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded bg-ad-form-save px-5 py-1 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60";

function TemplatePreviewMock({
  template,
  kind,
}: {
  template: ShopDocumentTemplate | null;
  kind: "invoice" | "jobcard";
}) {
  const isInvoice = kind === "invoice";

  if (!template) {
    return (
      <p className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-600">
        Select a template to preview it here.
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ad-purple">
            {isInvoice ? "Invoice Preview" : "Job Card Preview"}
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
          <span>{isInvoice ? "Service / Part" : "Service"}</span>
          <span>Amount</span>
        </div>
        {[1, 2, 3].map((row) => (
          <div key={row} className="grid grid-cols-[1fr_auto] gap-2 text-sm">
            <div className="h-2.5 rounded bg-gray-100" />
            <div className="h-2.5 w-16 rounded bg-gray-100" />
          </div>
        ))}
      </div>

      {!isInvoice ? (
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((slot) => (
            <div
              key={slot}
              className="aspect-[4/3] rounded border border-dashed border-gray-300 bg-gray-50"
            />
          ))}
        </div>
      ) : null}

      <div className="flex justify-end border-t border-gray-200 pt-3">
        <div className="space-y-1 text-right">
          <div className="h-2.5 w-28 rounded bg-gray-100" />
          <div className="h-3 w-36 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

type ShopDocumentTemplatePanelProps = {
  kind: "invoice" | "jobcard";
  templates: ShopDocumentTemplate[];
  selectedId: string;
  onSelect: (id: string) => void;
  isActive: boolean;
  onToggleActive: (active: boolean) => void;
  savedId: string;
  onSave: (id: string) => void;
};

export default function ShopDocumentTemplatePanel({
  kind,
  templates,
  selectedId,
  onSelect,
  isActive,
  onToggleActive,
  savedId,
  onSave,
}: ShopDocumentTemplatePanelProps) {
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? null,
    [selectedId, templates],
  );
  const label = kind === "invoice" ? "Invoice Template" : "Job Card Template";
  const hasChanges = selectedId !== savedId;

  const handleSave = () => {
    if (!selectedId) {
      toast.error(`Select a ${label.toLowerCase()} first.`);
      return;
    }
    onSave(selectedId);
    toast.success(`${label} saved.`);
  };

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3">
      <div className="flex min-h-[2rem] shrink-0 flex-wrap items-center justify-end gap-3">
        <label className={`flex cursor-pointer items-center gap-2 ${checkboxBoxClass}`}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => onToggleActive(e.target.checked)}
            className="h-3.5 w-3.5 accent-ad-purple"
          />
          Selected
        </label>
        <select
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          disabled={templates.length === 0}
          className={`min-w-[220px] flex-1 ${shopCompactInputClass}`}
        >
          {templates.length === 0 ? (
            <option value="">No templates available</option>
          ) : (
            templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="relative min-h-0 overflow-hidden rounded border border-gray-200 bg-white">
        {!isActive || !selectedTemplate ? (
          <p className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-600">
            {isActive
              ? "Select a template to preview it here."
              : `Check Selected to preview your ${label.toLowerCase()}.`}
          </p>
        ) : (
          <TemplatePreviewMock template={selectedTemplate} kind={kind} />
        )}
      </div>

      <div
        className={`flex flex-wrap items-center justify-between gap-2 rounded px-4 py-1 ${shopProfileFormPanelFooterClass}`}
      >
        <div className="flex min-w-[180px] flex-1 items-center text-xs font-serif italic text-gray-800">
          You are selecting a &lsquo;{label}&rsquo;
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || !selectedId}
          className={templateSaveButtonClass}
        >
          Save
        </button>
      </div>
    </div>
  );
}
