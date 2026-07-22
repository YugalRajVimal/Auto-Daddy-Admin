import type { ReactNode } from "react";
import {
  ShopListSkeleton,
  type ShopLoadingVariant,
} from "./ShopListSkeletons";
import {
  shopHeroCardBodyClass,
  shopHeroFooterTextClass,
  shopHeroOpaqueSurfaceClass,
  shopMainContentFillClass,
} from "./shopLayoutStyles";

export type { ShopLoadingVariant };

/** Inner flex column for page content inside the hero card body. */
export function ShopPageContentShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${shopHeroCardBodyClass} ${className}`.trim()}>{children}</div>;
}

/** Section row inside main content: left heading, right actions. */
export function ShopContentHeader({
  title,
  titleClassName = "text-lg font-bold text-blue-700 md:text-xl",
  action,
  className = "",
}: {
  title?: ReactNode;
  titleClassName?: string;
  action?: ReactNode;
  className?: string;
}) {
  const hasTitle = title != null && title !== "";
  if (!hasTitle && !action) return null;

  return (
    <div
      className={`mb-3 flex items-center justify-between gap-3 ${hasTitle ? "" : "justify-end"} ${className}`}
    >
      {hasTitle ? <h2 className={titleClassName}>{title}</h2> : <span />}
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function ShopLoadingPanel({
  className = "",
  variant = "media-card",
  count = 5,
}: {
  className?: string;
  variant?: ShopLoadingVariant;
  count?: number;
}) {
  return (
    <div className={`${shopMainContentFillClass} ${className}`.trim()}>
      <ShopListSkeleton variant={variant} count={count} className="w-full" />
    </div>
  );
}

export function ShopEmptyPanel({ message, className = "" }: { message: string; className?: string }) {
  return (
    <div
      className={`${shopMainContentFillClass} ${shopHeroOpaqueSurfaceClass} items-center justify-center rounded-md border border-white/70 bg-ad-glass p-6 text-center text-sm text-gray-600 ${className}`}
    >
      {message}
    </div>
  );
}

export function ShopErrorPanel({
  message,
  onRetry,
  className = "",
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`${shopMainContentFillClass} ${shopHeroOpaqueSurfaceClass} items-center justify-center gap-3 rounded-md border border-white/70 bg-ad-glass p-6 text-center ${className}`}
    >
      <p className="text-sm font-semibold text-gray-800">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-ad-purple px-4 py-2 text-sm font-semibold text-white hover:bg-ad-purple-dark"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function ShopListFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <footer
      className={`mt-3 flex items-center justify-between gap-3 pt-2 ${shopHeroFooterTextClass} ${className}`.trim()}
    >
      {children}
    </footer>
  );
}

export function ShopListPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${shopMainContentFillClass} gap-3 ${className}`.trim()}>
      {children}
    </div>
  );
}

export function ShopGreenRow({
  left,
  center,
  right,
}: {
  left?: ReactNode;
  center: ReactNode;
  right?: ReactNode;
}) {
  return (
    <article className="flex overflow-hidden rounded-md shadow-sm">
      {left ? (
        <div className="flex w-[28%] min-w-[100px] max-w-[160px] shrink-0 items-center justify-center bg-[#006600] px-3 py-4 text-center">
          {left}
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 items-center justify-between gap-4 bg-[#CCFFCC] px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">{center}</div>
        {right ? <div className="shrink-0 text-right">{right}</div> : null}
      </div>
    </article>
  );
}

export function ShopRefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-ad-purple hover:bg-gray-50"
    >
      Refresh
    </button>
  );
}
