import { useEffect } from "react";
import { FiPrinter, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { JobCardViewerDialog } from "../../../invoice-job-card-viewer/InvoiceJobCardViewer.jsx";
import { printDomElement } from "../../utils/printDomElement";

const TOOLBAR_BTN_CLASS =
  "inline-flex items-center gap-1.5 rounded border border-gray-400 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-800 hover:bg-gray-50";

export type OwnerJobCardViewerDialogProps = {
  open: boolean;
  onClose: () => void;
  jobCardId?: string;
  countryCode?: string;
  apiBaseUrl?: string;
  fetchJobCard?: (id: string) => Promise<unknown>;
};

/** Job card preview popup with the same Print + Close chrome as invoice preview. */
export default function OwnerJobCardViewerDialog({
  open,
  onClose,
  jobCardId,
  countryCode,
  apiBaseUrl,
  fetchJobCard,
}: OwnerJobCardViewerDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handlePrint = () => {
    const node = document.querySelector(".invoice-viewer-panel .invoice-viewer-document");
    if (!(node instanceof HTMLElement)) {
      toast.error("Nothing to print.");
      return;
    }
    printDomElement(node, "Job Card");
  };

  return (
    <JobCardViewerDialog
      open={open}
      onClose={onClose}
      jobCardId={jobCardId}
      fetchJobCard={fetchJobCard}
      countryCode={countryCode}
      apiBaseUrl={apiBaseUrl}
      header={
        <>
          <p className="text-sm font-bold text-[#1976d2]">Job Card Preview</p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handlePrint} className={TOOLBAR_BTN_CLASS}>
              <FiPrinter size={14} aria-hidden />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className={TOOLBAR_BTN_CLASS}
              aria-label="Close job card preview"
            >
              <FiX size={14} aria-hidden />
              Close
            </button>
          </div>
        </>
      }
    />
  );
}
