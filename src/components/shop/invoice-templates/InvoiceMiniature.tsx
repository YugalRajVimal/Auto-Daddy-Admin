import { InvoiceTemplatePreview } from "./InvoiceTemplatePreview";
import type { mergeInvoicePreviewShop } from "./sampleInvoiceData";

/** Natural render width of an invoice; miniatures scale this down so they keep the page's proportions. */
const INVOICE_RENDER_WIDTH = 720;

/** Scaled-down full invoice, clipped to a fixed box (keeps A4-like proportions at any size). */
export function InvoiceMiniature({
  templateId,
  data,
  width,
  height,
}: {
  templateId: string;
  data: ReturnType<typeof mergeInvoicePreviewShop>;
  width: number;
  height: number;
}) {
  return (
    <div className="pointer-events-none overflow-hidden bg-white" style={{ width, height }} aria-hidden>
      <div style={{ width: INVOICE_RENDER_WIDTH, zoom: width / INVOICE_RENDER_WIDTH }}>
        <InvoiceTemplatePreview templateId={templateId} data={data} mode="full" />
      </div>
    </div>
  );
}
