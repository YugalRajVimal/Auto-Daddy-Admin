import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { FiPrinter, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import A4DocumentSheet from "../../../components/common/A4DocumentSheet";
import {
  addDaysToEstimateDate,
  formatEstimateDate,
} from "../../../components/JobCard/shopJobCardEstimate";
import ClassicInvoiceDocument, {
  type InvoiceDocumentModel,
} from "../../../components/shop/invoice-templates/ClassicInvoiceDocument";
import { resolveInvoiceTheme } from "../../../components/shop/invoice-templates/invoiceTheme";
import { printDomElement } from "../../../utils/printDomElement";
import "../../../../invoice-job-card-viewer/invoice-job-card-viewer.css";

const PRINT_ROOT_ID = "admin-invoice-preview-print";
/** Magenta / modern template — same as Shop Wallet and Owner invoice preview. */
const DEFAULT_TEMPLATE_ID = "modern-invoice-v2";

const TOOLBAR_BTN_CLASS =
  "inline-flex items-center gap-1.5 rounded border border-gray-400 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

type InvoiceLineItemApi = {
  Item: string;
  Description: string;
  UnitPrice: number;
  Units: number;
  GSTPercent: number;
  Amount?: number;
};

type InvoiceApiRow = {
  _id?: string;
  invoiceNumber: string;
  dateOfIssue: string;
  client: string;
  clientRemark?: string;
  items: InvoiceLineItemApi[];
  subtotal?: number;
  gst: number;
  roundOff?: number;
  invoiceTotal?: number;
  bankName?: string;
  terms?: string;
  status?: string;
  poNumber?: string;
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopLogoUrl?: string;
};

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function splitNotes(terms: string | undefined): string[] | undefined {
  const text = terms?.trim();
  if (!text) return undefined;
  const parts = text
    .split(/(?<=\.)\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

function mapToInvoiceDocument(row: InvoiceApiRow): InvoiceDocumentModel {
  const items = Array.isArray(row.items) ? row.items : [];
  const taxPercent = items[0]?.GSTPercent ?? 0;
  const subtotal =
    row.subtotal ?? items.reduce((sum, it) => sum + num(it.UnitPrice) * num(it.Units), 0);
  const tax = num(row.gst);
  const total = row.invoiceTotal ?? subtotal + tax + num(row.roundOff);
  const isPaid = (row.status || "").trim().toLowerCase() === "paid";
  const paid = isPaid ? total : 0;
  const companyName = row.shopName?.trim() || "Auto Daddy";

  return {
    badge: isPaid ? "PAID" : null,
    company: {
      name: companyName,
      contactName: companyName,
      address: row.shopAddress,
      phone: row.shopPhone,
      logoUrl: row.shopLogoUrl || null,
    },
    billTo: {
      name: row.client || "—",
      extra: row.clientRemark?.trim() ? [row.clientRemark.trim()] : undefined,
    },
    meta: {
      invoiceNo: row.invoiceNumber,
      date: formatEstimateDate(row.dateOfIssue),
      dueDate: addDaysToEstimateDate(row.dateOfIssue, 30),
      poNumber: row.poNumber?.trim() || undefined,
    },
    items: items.map((it) => {
      const qty = num(it.Units);
      const price = num(it.UnitPrice);
      return {
        description: [it.Item, it.Description].filter(Boolean).join(" — ") || "Item",
        qty,
        price,
        taxLabel: num(it.GSTPercent) > 0 ? `${it.GSTPercent}%` : "—",
        amount: it.Amount != null ? num(it.Amount) : price * qty,
      };
    }),
    totals: {
      subtotal,
      discount: 0,
      taxLabel: `Tax(${taxPercent}%)`,
      tax,
      total,
      paid,
      balanceDue: Math.max(0, total - paid),
    },
    payment: {
      method: row.bankName?.trim() || undefined,
      holderName: companyName,
    },
    notes: splitNotes(row.terms),
    signatureName: companyName,
    currencySign: "$",
  };
}

export default function InvoiceViewModal({
  invoice,
  templateId = DEFAULT_TEMPLATE_ID,
  onClose,
  onEdit,
  onSend,
  sending,
}: {
  invoice: InvoiceApiRow;
  templateId?: string;
  onClose: () => void;
  onEdit?: () => void;
  onSend?: () => void;
  sending?: boolean;
}) {
  const invoiceDocument = useMemo(() => mapToInvoiceDocument(invoice), [invoice]);
  const theme = resolveInvoiceTheme(templateId);
  const sendDisabled = sending || invoice.status === "Sent" || invoice.status === "Paid";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handlePrint = () => {
    const node = document.getElementById(PRINT_ROOT_ID);
    if (!(node instanceof HTMLElement)) {
      toast.error("Nothing to print.");
      return;
    }
    printDomElement(node, "Invoice");
  };

  return createPortal(
    <div className="invoice-viewer-backdrop" onClick={onClose} role="presentation">
      <div
        className="invoice-viewer-panel"
        style={{
          borderColor: "#f5c6d6",
          background: "#cfcfcf",
          boxShadow: "0 18px 48px rgba(216, 27, 96, 0.14), 0 4px 16px rgba(0, 0, 0, 0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Invoice ${invoice.invoiceNumber}`}
      >
        <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-2 border-b border-[#f5c6d6] bg-white/95 px-3 py-2.5 backdrop-blur-sm sm:px-4">
          <p className="text-sm font-bold text-[#d81b60]">
            Invoice {invoice.invoiceNumber}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {onEdit ? (
              <button type="button" onClick={onEdit} className={TOOLBAR_BTN_CLASS}>
                Edit
              </button>
            ) : null}
            {onSend ? (
              <button
                type="button"
                onClick={onSend}
                disabled={sendDisabled}
                className={TOOLBAR_BTN_CLASS}
              >
                {sending ? "Sending..." : invoice.status === "Sent" ? "Sent" : "Send"}
              </button>
            ) : null}
            <button type="button" onClick={handlePrint} className={TOOLBAR_BTN_CLASS}>
              <FiPrinter size={14} aria-hidden />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className={TOOLBAR_BTN_CLASS}
              aria-label="Close invoice preview"
            >
              <FiX size={14} aria-hidden />
              Close
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <A4DocumentSheet
            id={PRINT_ROOT_ID}
            className="p-0 print:p-0"
            stageClassName="!min-h-0 h-auto"
            fit="width"
          >
            <ClassicInvoiceDocument data={invoiceDocument} theme={theme} />
          </A4DocumentSheet>
        </div>
      </div>
    </div>,
    document.body,
  );
}
