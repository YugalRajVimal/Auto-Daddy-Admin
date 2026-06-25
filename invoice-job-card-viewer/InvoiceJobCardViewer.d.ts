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

export default function InvoiceJobCardViewer(props: InvoiceJobCardViewerProps): import("react").ReactPortal | null;

export function InvoiceViewerDialog(props: InvoiceJobCardViewerProps): import("react").ReactPortal | null;

export function JobCardViewerDialog(props: InvoiceJobCardViewerProps): import("react").ReactPortal | null;
