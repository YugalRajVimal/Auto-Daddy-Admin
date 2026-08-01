export type DocumentTemplateKind = "invoice" | "jobcard";

export type DocumentTemplate = {
  id: string;
  name: string;
  description: string;
};

/** Catalog ids must match API `invoiceTemplateSlug` values (same as web). */
export const DUMMY_INVOICE_TEMPLATES: DocumentTemplate[] = [
  {
    id: "classic-invoice-v1",
    name: "Invoice Template - 1",
    description: "Classic charcoal accents on the standard invoice layout.",
  },
  {
    id: "modern-invoice-v2",
    name: "Invoice Template - 2",
    description: "Magenta accents on the standard invoice layout.",
  },
  {
    id: "viewer-invoice-v1",
    name: "Invoice Template - 3",
    description: "Blue viewer accents on the standard invoice layout.",
  },
];

export const DUMMY_JOB_CARD_TEMPLATES: DocumentTemplate[] = [
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

export function templatesForKind(kind: DocumentTemplateKind): DocumentTemplate[] {
  return kind === "invoice" ? DUMMY_INVOICE_TEMPLATES : DUMMY_JOB_CARD_TEMPLATES;
}

export function templateKindLabel(kind: DocumentTemplateKind) {
  return kind === "invoice" ? "Invoice Template" : "Job Card Template";
}

export function templateKindTitle(kind: DocumentTemplateKind) {
  return kind === "invoice" ? "Invoice Templates" : "Job Card Templates";
}

export function resolveTemplateSlug(
  templates: DocumentTemplate[],
  slug: string | undefined | null,
  fallback = templates[0]?.id ?? ""
): string {
  const value = typeof slug === "string" ? slug.trim() : "";
  if (value && templates.some((template) => template.id === value)) return value;
  return fallback;
}
