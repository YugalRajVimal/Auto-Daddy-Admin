import type { ReactNode } from "react";

export type InvoiceJobCardViewerProps = {
  open: boolean;
  onClose: () => void;
  job?: unknown;
  jobCardId?: string;
  countryCode?: string;
  apiBaseUrl?: string;
  defaultLogoUrl?: string;
  fetchJobCard?: (id: string) => Promise<unknown>;
  fetchBusinessProfile?: () => Promise<unknown>;
  businessProfile?: unknown;
  footer?: ReactNode;
  stickyFooter?: boolean;
  footerClassName?: string;
  actions?: ReactNode;
};

export type InvoiceDocumentViewProps = {
  job: unknown;
  business?: unknown;
  variant?: "invoice" | "jobcard";
  actionsSlot?: ReactNode;
  countryCode?: string | null;
  apiBaseUrl?: string;
  defaultLogoUrl?: string;
};

export default function InvoiceJobCardViewer(props: InvoiceJobCardViewerProps): import("react").ReactPortal | null;

export function InvoiceViewerDialog(props: InvoiceJobCardViewerProps): import("react").ReactPortal | null;

export function JobCardViewerDialog(props: InvoiceJobCardViewerProps): import("react").ReactPortal | null;

export function InvoiceDocumentView(props: InvoiceDocumentViewProps): import("react").JSX.Element;
