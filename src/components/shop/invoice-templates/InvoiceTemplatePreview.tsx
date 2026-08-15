import ClassicInvoiceDocument, { invoiceDocumentFromPreview } from "./ClassicInvoiceDocument";
import { resolveInvoiceTheme } from "./invoiceTheme";
import { DEFAULT_INVOICE_PREVIEW, type InvoicePreviewData } from "./sampleInvoiceData";

export function InvoiceTemplatePreview({
  templateId,
  data = DEFAULT_INVOICE_PREVIEW,
  mode = "full",
  className = "",
}: {
  templateId: string;
  data?: InvoicePreviewData;
  mode?: "thumbnail" | "full";
  className?: string;
}) {
  const theme = resolveInvoiceTheme(templateId);
  const invoice = (
    <ClassicInvoiceDocument
      data={invoiceDocumentFromPreview(data)}
      theme={theme}
      compact={mode === "thumbnail"}
    />
  );

  if (mode === "thumbnail") {
    /**
     * `zoom` scales layout size (unlike transform), so the card height
     * matches the invoice — no empty gap under the preview.
     */
    const thumbScale = 0.38;
    return (
      <div
        className={`pointer-events-none w-full overflow-hidden bg-white ${className}`}
        aria-hidden
        style={{ zoom: thumbScale }}
      >
        <div style={{ width: `${100 / thumbScale}%` }}>{invoice}</div>
      </div>
    );
  }

  return <div className={className}>{invoice}</div>;
}
