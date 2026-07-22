import {
  DUMMY_INVOICE_TEMPLATES,
  resolveTemplateSlug,
} from "./invoiceTemplateCatalog";

export type InvoiceThemeId =
  | "classic-invoice-v1"
  | "modern-invoice-v2"
  | "viewer-invoice-v1";

export type InvoiceThemeTokens = {
  id: InvoiceThemeId;
  /** Table header / accent bar / total highlight */
  accent: string;
  accentText: string;
  /** Alternating body row */
  stripe: string;
  /** Document edge bars */
  panel: string;
  title: string;
  border: string;
};

const CLASSIC_THEME: InvoiceThemeTokens = {
  id: "classic-invoice-v1",
  accent: "#2f2f2f",
  accentText: "#ffffff",
  stripe: "#f5f5f5",
  panel: "#2f2f2f",
  title: "#111111",
  border: "#d1d5db",
};

const MODERN_THEME: InvoiceThemeTokens = {
  id: "modern-invoice-v2",
  accent: "#d81b60",
  accentText: "#ffffff",
  stripe: "#f5f5f5",
  panel: "#f7f7f7",
  title: "#d81b60",
  border: "#e5e5e5",
};

/** Blue palette from invoice-job-card-viewer — also used for default job card previews. */
const VIEWER_THEME: InvoiceThemeTokens = {
  id: "viewer-invoice-v1",
  accent: "#1976d2",
  accentText: "#ffffff",
  stripe: "#f6fbff",
  panel: "#e8f4fc",
  title: "#42a5f5",
  border: "#d6ebfb",
};

export const JOB_CARD_PREVIEW_THEME = VIEWER_THEME;

/** Color themes only — all templates keep the same invoice content layout. */
export function resolveInvoiceTheme(
  slug: string | undefined | null,
): InvoiceThemeTokens {
  const id = resolveTemplateSlug(DUMMY_INVOICE_TEMPLATES, slug) as InvoiceThemeId;
  if (id === "modern-invoice-v2") return MODERN_THEME;
  if (id === "viewer-invoice-v1") return VIEWER_THEME;
  return CLASSIC_THEME;
}
