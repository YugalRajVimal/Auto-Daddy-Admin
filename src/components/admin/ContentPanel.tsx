import type { ReactNode, TextareaHTMLAttributes } from "react";
import { useEffect, useRef } from "react";

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

export const compactInputClass =
  "w-full min-h-[36px] border border-gray-400 bg-white px-2.5 py-2 text-sm leading-normal focus:border-blue-500 focus:outline-none";

export const compactFixedFieldWidth = "w-[140px] shrink-0 flex-none sm:w-[180px]";

export function CompactAutoGrowTextarea({
  value,
  onChange,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      rows={1}
      className={`${compactInputClass} resize-none overflow-hidden ${className}`}
      {...props}
    />
  );
}

export const PANEL_BOTTOM_BORDER_HEIGHT = 24;

export function PanelBottomBorder({ fill = "silver" }: { fill?: string }) {
  return (
    <div
      className="pointer-events-none absolute left-0 z-20 mx-auto w-full overflow-hidden"
      style={{ bottom: -PANEL_BOTTOM_BORDER_HEIGHT, height: PANEL_BOTTOM_BORDER_HEIGHT }}
      aria-hidden
    >
      <svg
        width="95%"
        height={PANEL_BOTTOM_BORDER_HEIGHT}
        viewBox="0 0 400 20"
        preserveAspectRatio="none"
        className="mx-auto block"
      >
        <path d="M0,20 Q200,-18 400,20 L400,0 L0,0 Z" fill={fill} />
      </svg>
    </div>
  );
}

export function CompactFormPanel({
  children,
  footer,
  className = "",
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative mb-10 rounded border border-ad-form-border bg-ad-form-bg shadow-sm ${className}`}
    >
      <div className="min-h-[108px] space-y-5 px-4 py-5">{children}</div>
      {footer}
      <PanelBottomBorder />
    </div>
  );
}

export function CompactFormRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end gap-x-4 gap-y-4 ${className}`}>
      {children}
    </div>
  );
}

export function CompactField({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 flex-1 ${className}`}>
      <label className="mb-1.5 block text-xs font-bold text-ad-green-dark">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

export function CompactFormFooter({
  onSave,
  onCancel,
  actionLabel = "Save",
  actionType = "button",
  message,
  messageCenter = false,
}: {
  onSave?: () => void;
  onCancel?: () => void;
  actionLabel?: string;
  actionType?: "button" | "submit";
  message?: ReactNode;
  messageCenter?: boolean;
}) {
  const defaultMessage = (
    <>
      Marks (<span className="text-red-600">*</span>) are required.
    </>
  );
  const footerMessage = message ?? defaultMessage;

  const actions = (
    <div className="flex items-center gap-2">
      <button
        type={actionType}
        onClick={onSave}
        className="inline-flex items-center gap-1.5 rounded bg-ad-form-save px-4 py-1 text-sm font-bold text-white hover:brightness-95"
      >
        {actionLabel}
        <span aria-hidden className="text-base leading-none">
          →
        </span>
      </button>
      {onCancel ? (
        <span className="text-xs text-gray-700">
          or{" "}
          <button
            type="button"
            onClick={onCancel}
            className="font-medium text-blue-600 underline hover:text-blue-700"
          >
            Cancel
          </button>
        </span>
      ) : null}
    </div>
  );

  if (messageCenter) {
    return (
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-ad-form-border bg-ad-form-required-bg px-3 py-2.5">
        <div />
        <span className="text-center text-xs font-serif italic text-gray-800">{footerMessage}</span>
        <div className="flex justify-end">{actions}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-stretch justify-between gap-2 border-t border-ad-form-border bg-ad-form-bg">
      <div className="flex min-w-[180px] flex-1 items-center bg-ad-form-required-bg px-3 py-2.5 text-xs text-gray-800">
        {footerMessage}
      </div>
      <div className="flex items-center gap-2 px-3 py-2.5">{actions}</div>
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
