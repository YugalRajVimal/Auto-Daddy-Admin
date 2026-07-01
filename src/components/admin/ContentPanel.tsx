import type { ReactNode, TextareaHTMLAttributes } from "react";
import { Children, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { useFormRevealFocus } from "../shop/ShopAnimated";

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

/** Shared single-line control height (inputs, selects, date, combo triggers, read-only values). */
export const COMPACT_FIELD_HEIGHT_PX = 30;

export const compactInputClass =
  "w-full h-[30px] min-h-[30px] box-border border border-gray-400 bg-white px-2 text-sm leading-[18px] focus:border-blue-500 focus:outline-none";

export const compactTextareaClass =
  "w-full min-h-[30px] box-border border border-gray-400 bg-white px-2 py-1 text-sm leading-snug focus:border-blue-500 focus:outline-none resize-none overflow-hidden";

export const compactReadOnlyValueClass =
  `${compactInputClass} flex items-center overflow-hidden bg-gray-50 text-gray-800`;

export const compactReadOnlyMultilineClass =
  "w-full min-h-[30px] box-border border border-gray-400 bg-gray-50 px-2 py-1 text-sm leading-snug text-gray-800";

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
    el.style.height = `${Math.max(COMPACT_FIELD_HEIGHT_PX, el.scrollHeight)}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      rows={1}
      className={`${compactTextareaClass} ${className}`}
      {...props}
    />
  );
}

export const PANEL_BOTTOM_BORDER_HEIGHT = 24;

export function PanelBottomBorder({
  fill = "silver",
  height = PANEL_BOTTOM_BORDER_HEIGHT,
}: {
  fill?: string;
  height?: number;
}) {
  return (
    <div
      className="pointer-events-none absolute left-0 z-20 mx-auto w-full overflow-hidden"
      style={{ bottom: -height, height }}
      aria-hidden
    >
      <svg
        width="95%"
        height={height}
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
  focusOnMount = false,
  showBottomBorder = true,
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Scroll into view and focus the first field when the panel mounts. */
  focusOnMount?: boolean;
  /** When false, omits the decorative curved bottom border/shadow. */
  showBottomBorder?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFormRevealFocus(focusOnMount, panelRef);

  return (
    <div
      ref={panelRef}
      className={`relative mb-10 rounded border border-ad-form-border bg-ad-form-bg shadow-sm ${className}`}
    >
      <div className="min-h-[96px] space-y-4 px-4 py-4">{children}</div>
      {footer}
      {showBottomBorder ? <PanelBottomBorder /> : null}
    </div>
  );
}

function compactFormRowChildCount(children: ReactNode) {
  return Children.toArray(children).filter((child) => {
    if (child == null) return false;
    return typeof child !== "boolean";
  }).length;
}

function compactFormRowGridCols(childCount: number) {
  const columns = childCount >= 4 ? 4 : Math.max(childCount, 1);
  if (columns === 1) return "grid-cols-1";
  if (columns === 2) return "grid-cols-1 sm:grid-cols-2";
  if (columns === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
}

function compactFormRowUsesFlexLayout(className: string) {
  return /\bflex-nowrap\b/.test(className) || /\boverflow-x-auto\b/.test(className);
}

function compactFormRowHasExplicitGridCols(className: string) {
  return /\bgrid-cols-/.test(className);
}

export function CompactFormRow({
  children,
  className = "",
  columns,
}: {
  children: ReactNode;
  className?: string;
  /** When set, fixes the row to this many equal-width columns (fields share full row width). */
  columns?: number;
}) {
  const childCount = compactFormRowChildCount(children);

  if (compactFormRowUsesFlexLayout(className)) {
    return (
      <div className={twMerge("flex w-full flex-wrap items-end gap-x-4 gap-y-4", className)}>
        {children}
      </div>
    );
  }

  if (compactFormRowHasExplicitGridCols(className)) {
    return (
      <div className={twMerge("grid w-full gap-x-4 gap-y-4 items-end", className)}>
        {children}
      </div>
    );
  }

  const columnCount =
    columns ?? (childCount >= 4 ? 4 : Math.max(childCount, 1));

  return (
    <div
      className={twMerge(
        "grid w-full items-end gap-x-4 gap-y-4",
        compactFormRowGridCols(columnCount),
        className
      )}
    >
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
      <label className="mb-1 block text-xs font-bold text-ad-green-dark">
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
  cancelLabel = "Cancel",
  actionType = "button",
  message,
  messageCenter = false,
}: {
  onSave?: () => void;
  onCancel?: () => void;
  actionLabel?: string;
  cancelLabel?: string;
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
            {cancelLabel}
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
