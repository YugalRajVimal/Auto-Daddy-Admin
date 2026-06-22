import type { ReactNode } from "react";

export function ShopLoadingPanel({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex min-h-[420px] flex-1 items-center justify-center rounded-md border border-gray-200 bg-white lg:min-h-[calc(100vh-220px)] ${className}`}
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
    </div>
  );
}

export function ShopEmptyPanel({ message, className = "" }: { message: string; className?: string }) {
  return (
    <div
      className={`flex min-h-[420px] flex-1 items-center justify-center rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-gray-600 lg:min-h-[calc(100vh-220px)] ${className}`}
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
      className={`flex min-h-[420px] flex-1 flex-col items-center justify-center gap-3 rounded-md border border-gray-200 bg-white p-6 text-center lg:min-h-[calc(100vh-220px)] ${className}`}
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

export function ShopListPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-[420px] flex-1 flex-col gap-3 overflow-y-auto lg:min-h-[calc(100vh-220px)] ${className}`}
    >
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
