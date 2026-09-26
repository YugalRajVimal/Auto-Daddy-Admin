import type { ReactNode, TextareaHTMLAttributes } from "react";
import { Children, isValidElement, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { useFormRevealFocus } from "../shop/ShopAnimated";

type ContentPanelProps = {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
  tone?: "green" | "neutral";
};

export function ContentPanel({
  children,
  title,
  action,
  footer,
  className = "",
  tone = "green",
}: ContentPanelProps) {
  const shellClass =
    tone === "neutral"
      ? "border border-gray-200 bg-white shadow-sm"
      : "border border-ad-green-dark/30 bg-ad-green-light shadow-sm";
  const headerClass =
    tone === "neutral"
      ? "border-b border-gray-200"
      : "border-b border-ad-green-dark/40";
  const titleClass = tone === "neutral" ? "text-lg font-bold text-gray-900" : "text-lg font-bold text-ad-green-dark";

  return (
    <div
      className={`overflow-hidden rounded-t-2xl rounded-b-xl ${shellClass} ${className}`}
    >
      {(title || action) && (
        <div className={`flex items-center justify-between px-5 py-3 ${headerClass}`}>
          {title && <h2 className={titleClass}>{title}</h2>}
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
  "w-full h-[30px] z-50 min-h-[30px] box-border border border-gray-400 bg-white px-2 text-sm leading-[18px] focus:border-blue-500 focus:outline-none";

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
      className="z-0 pointer-events-none absolute left-0 z-0 mx-auto w-full overflow-hidden"
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

/**
 * In the admin panel, create/edit forms open as a centred popup (like the revised admin
 * mockups). The popup title is taken from the footer message ("You are creating a 'City'"
 * becomes "Create City"), so existing pages need no changes. Other portals keep the inline panel.
 */
function isAdminPortal(): boolean {
  return typeof document !== "undefined" && document.body.classList.contains("admin-portal");
}

function deriveAdminModalTitle(footer: ReactNode): string | null {
  if (!isAdminPortal()) return null;
  if (!isValidElement(footer)) return null;
  const message = (footer.props as { message?: unknown }).message;
  if (typeof message !== "string") return null;
  const match = message.match(/^You are (creating|updating|editing) (?:an?\s+|the\s+)?'?(.+?)'?\.?$/i);
  if (!match) return null;
  const verb = match[1].toLowerCase() === "creating" ? "Create" : "Edit";
  return `${verb} ${match[2].replace(/^'+|'+$/g, "")}`;
}

export function CompactFormPanel({
  children,
  footer,
  className = "",
  contentClassName = "min-h-[96px] space-y-4 px-4 py-4",
  focusOnMount = false,
  showBottomBorder = true,
  splitPreview,
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Scroll into view and focus the first field when the panel mounts. */
  focusOnMount?: boolean;
  /** When false, omits the decorative curved bottom border/shadow. */
  showBottomBorder?: boolean;
  /**
   * Admin panel only: render the form as a grey panel on the left with this live preview in a
   * green-bordered panel on the right (instead of a popup). Other portals ignore it.
   */
  splitPreview?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFormRevealFocus(focusOnMount, panelRef);

  if (splitPreview !== undefined && isAdminPortal()) {
    return (
      <div
        ref={panelRef}
        className="mb-10 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(300px,380px)_1fr]"
      >
        <div className="ad-split-left rounded-2xl border border-gray-500 bg-[#f4f4f4] px-6 py-6">
          {children}
          {footer}
        </div>
        <div className="min-h-[560px] overflow-hidden rounded-3xl border border-[#a8d05a] bg-white p-5 sm:p-8">
          {splitPreview}
        </div>
      </div>
    );
  }

  const modalTitle = deriveAdminModalTitle(footer);

  if (modalTitle) {
    return (
      <div
        className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-transparent px-3 py-10 sm:py-24"
        role="dialog"
        aria-modal="true"
        aria-label={modalTitle}
      >
        <div
          ref={panelRef}
          className="ad-modal-card w-max min-w-[min(100%,760px)] max-w-full overflow-hidden rounded-2xl border border-ad-green bg-white shadow-[0_10px_40px_rgba(0,0,0,0.28)] sm:max-w-[920px]"
        >
          <h2 className="px-6 py-6 text-center text-xl font-normal text-ad-green sm:text-[26px]">
            {modalTitle}
          </h2>
          <div className="min-h-[200px] space-y-4 bg-ad-form-bg px-5 py-7 sm:px-8">{children}</div>
          {footer}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className={`relative mb-10 rounded border border-ad-form-border bg-ad-form-bg shadow-sm ${className}`}
    >
      <div className={contentClassName}>{children}</div>
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
  /** When set, lays out fields in a responsive grid with this many columns. */
  columns?: number;
}) {
  const childCount = compactFormRowChildCount(children);

  if (columns != null || compactFormRowHasExplicitGridCols(className)) {
    const columnCount = columns ?? Math.min(Math.max(childCount, 1), 4);
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

  return (
    <div className={twMerge("flex w-full flex-wrap items-end gap-x-4 gap-y-4", className)}>
      {children}
    </div>
  );
}

export function CompactField({
  label,
  required,
  children,
  className = "",
  labelClassName = "",
}: {
  label: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <div className={twMerge("ad-field min-w-0 flex-1", className)}>
      <label className={twMerge("mb-1 block text-xs font-bold text-ad-green-dark", labelClassName)}>
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
  disabled = false,
  message,
  messageCenter = false,
}: {
  onSave?: () => void;
  onCancel?: () => void;
  actionLabel?: string;
  cancelLabel?: string;
  actionType?: "button" | "submit";
  disabled?: boolean;
  message?: ReactNode;
  messageCenter?: boolean;
}) {
  const defaultMessage = (
    <>
      Marks (<span className="text-red-600">*</span>) are required.
    </>
  );
  const footerMessage = message ?? defaultMessage;
  const saveDisabled = disabled || !onSave;

  const actions = (
    <div className="flex items-center gap-2">
      <button
        type={actionType}
        onClick={onSave}
        disabled={saveDisabled}
        className="ad-form-save inline-flex items-center gap-1.5 rounded bg-ad-form-save px-4 py-1 text-sm font-bold text-white hover:brightness-95 disabled:pointer-events-none disabled:opacity-50"
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
      <div className="ad-form-footer grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-ad-form-border bg-ad-form-required-bg px-3 py-2.5">
        <div />
        <span className="ad-form-msg text-center text-xs font-serif italic text-gray-800">{footerMessage}</span>
        <div className="flex justify-end">{actions}</div>
      </div>
    );
  }

  return (
    <div className="ad-form-footer flex flex-wrap items-stretch justify-between gap-2 border-t border-ad-form-border bg-ad-form-bg">
      <div className="ad-form-msg flex min-w-[180px] flex-1 items-center bg-ad-form-required-bg px-3 py-2.5 text-xs text-gray-800">
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
