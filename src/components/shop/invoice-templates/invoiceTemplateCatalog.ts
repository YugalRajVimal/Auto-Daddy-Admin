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

export function resolveTemplateSlug(
  templates: ShopDocumentTemplate[],
  slug: string | undefined | null,
  fallback = templates[0]?.id ?? "",
): string {
  const value = typeof slug === "string" ? slug.trim() : "";
  if (value && templates.some((template) => template.id === value)) return value;
  return fallback;
}
