import type { ReactNode } from "react";

type ContentPanelProps = {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function ContentPanel({ children, title, action, footer, className = "" }: ContentPanelProps) {
  return (
    <div
      className={`overflow-hidden rounded-t-2xl rounded-b-xl border border-ad-green-dark/30 bg-ad-green-light shadow-sm ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-ad-green-dark/40 px-5 py-3">
          {title && <h2 className="text-lg font-bold text-ad-green-dark">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-4 md:p-5">{children}</div>
      {footer}
    </div>
  );
}

export function PanelFooter({
  message,
  actionLabel = "Save",
  onAction,
  cancelLabel,
  onCancel,
  actionType = "button",
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  cancelLabel?: string;
  onCancel?: () => void;
  actionType?: "button" | "submit";
}) {
  return (
    <div className="flex items-center justify-between bg-ad-purple px-5 py-2.5 text-sm text-white">
      <span className="font-serif italic">{message}</span>
      <div className="flex items-center gap-4">
        {onCancel && cancelLabel ? (
          <button
            type="button"
            onClick={onCancel}
            className="font-bold underline hover:opacity-90"
          >
            {cancelLabel}
          </button>
        ) : null}
        {onAction || actionLabel ? (
          <button
            type={actionType}
            onClick={onAction}
            className="font-bold underline hover:opacity-90"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function PanelCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mb-3 flex items-center justify-between rounded border border-gray-200 bg-white px-4 py-3 shadow-md last:mb-0 ${className}`}
    >
      {children}
    </div>
  );
}
