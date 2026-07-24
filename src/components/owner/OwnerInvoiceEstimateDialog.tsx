import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FiPrinter, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import OwnerInvoiceEstimateView from "./OwnerInvoiceEstimateView";
import type { CarOwnerJobCard } from "../../types/carOwnerJobCards";
import { printDomElement } from "../../utils/printDomElement";
import "../../../invoice-job-card-viewer/invoice-job-card-viewer.css";

const TOOLBAR_BTN_CLASS =
  "inline-flex items-center gap-1.5 rounded border border-gray-400 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-800 hover:bg-gray-50";

export type OwnerInvoiceEstimateDialogProps = {
  open: boolean;
  onClose: () => void;
  jobCardId: string | null | undefined;
  token: string | null;
  cachedJobCard?: CarOwnerJobCard | null;
  invoiceNoHint?: string | null;
  callingCode?: string;
};

/** Popup shell matching job-card preview; content is the red Wallet-style invoice. */
export default function OwnerInvoiceEstimateDialog({
  open,
  onClose,
  jobCardId,
  token,
  cachedJobCard = null,
  invoiceNoHint = null,
  callingCode = "+1",
}: OwnerInvoiceEstimateDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const handlePrint = () => {
    const node = document.getElementById("owner-invoice-estimate-print");
    if (!(node instanceof HTMLElement)) {
      toast.error("Nothing to print.");
      return;
    }
    printDomElement(node, "Invoice");
  };

  if (!open || !jobCardId) return null;

  return createPortal(
    <div className="invoice-viewer-backdrop" onClick={onClose} role="presentation">
      <div
        className="invoice-viewer-panel"
        style={{
          borderColor: "#f5c6d6",
          boxShadow: "0 18px 48px rgba(216, 27, 96, 0.14), 0 4px 16px rgba(0, 0, 0, 0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Invoice"
      >
        <div className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-[#f5c6d6] bg-white/95 px-3 py-2.5 backdrop-blur-sm sm:px-4">
          <p className="text-sm font-bold text-[#d81b60]">Invoice Preview</p>
          <div className="flex flex-wrap items-center gap-2">
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
        <div className="p-3 sm:p-4">
          <OwnerInvoiceEstimateView
            key={jobCardId}
            jobCardId={jobCardId}
            token={token}
            cachedJobCard={cachedJobCard}
            invoiceNoHint={invoiceNoHint}
            callingCode={callingCode}
            hideToolbar
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
