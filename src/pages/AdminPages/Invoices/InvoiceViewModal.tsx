

import { useEffect, useState } from "react";
import { InvoicePreviewData } from "../../../components/shop/invoice-templates/sampleInvoiceData";
import { InvoiceTemplatePreview } from "../../../components/shop/invoice-templates/InvoiceTemplatePreview";
// import type { InvoicePreviewData } from "./sampleInvoiceData";

// Shape of a single invoice row as returned by your invoices list/detail API.
// Adjust field names here if your backend uses different keys.
type InvoiceLineItemApi = {
  Item: string;
  Description: string;
  UnitPrice: number;
  Units: number;
  GSTPercent: number;
};

type InvoiceApiRow = {
  _id?: string;
  invoiceNumber: string;
  dateOfIssue: string;
  client: string;
  clientRemark?: string;
  items: InvoiceLineItemApi[];
  gst: number;
  status?: string;
  // shop/business info — adjust to wherever your admin panel stores this
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopLogoUrl?: string;
  accountId?: string;
  currency?: string;
};

/**
 * Maps a raw invoice row (as used elsewhere in InvoicesPage) into the
 * InvoicePreviewData shape expected by InvoiceTemplatePreview.
 */
function mapToInvoicePreviewData(row: InvoiceApiRow): InvoicePreviewData {
  const taxPercent =
    row.items.length > 0 ? row.items[0].GSTPercent ?? 0 : 0;

  return {
    invoiceNo: row.invoiceNumber,
    invoiceDate: new Date(row.dateOfIssue).toLocaleDateString("en-CA"),
    accountId: row.accountId || "",
    taxPercent,
    currency: row.currency || "CAD",
    shop: {
      name: row.shopName || "",
      address: row.shopAddress || "",
      phone: row.shopPhone || "",
      logoUrl: row.shopLogoUrl || "",
    },
    customer: {
      name: row.client,
      title: row.clientRemark || "",
      address: "",
    },
    items: row.items.map((it, idx) => ({
      id: String(idx),
      name: it.Item,
      description: it.Description,
      price: it.UnitPrice,
      quantity: it.Units,
    })),
  } as InvoicePreviewData;
}

export default function InvoiceViewModal({
  invoice,
  templateId,
  onClose,
  onEdit,
  onSend,
  sending,
}: {
  invoice: InvoiceApiRow;
  templateId: string;
  onClose: () => void;
  onEdit?: () => void;
  onSend?: () => void;
  sending?: boolean;
}) {
  const [data, setData] = useState<InvoicePreviewData | null>(null);

  useEffect(() => {
    console.log(invoice);
    setData(mapToInvoicePreviewData(invoice));
  }, [invoice]);

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!data) return null;

  const sendDisabled = sending || invoice.status === "Sent" || invoice.status === "Paid";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
          <span className="text-sm font-semibold text-gray-700">
            Invoice {invoice.invoiceNumber}
          </span>
          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
              >
                Edit
              </button>
            )}
            {onSend && (
              <button
                type="button"
                onClick={onSend}
                disabled={sendDisabled}
                className="rounded bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? "Sending..." : invoice.status === "Sent" ? "Sent" : "Send"}
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
            >
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-lg font-bold text-gray-500 hover:text-gray-800"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="max-h-[80vh] overflow-y-auto">
          <InvoiceTemplatePreview templateId={templateId} data={data} mode="full" />
        </div>
      </div>
    </div>
  );
}