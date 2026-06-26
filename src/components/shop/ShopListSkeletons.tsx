import type { ReactNode } from "react";
import { Skeleton } from "../common/Skeleton";

/** Services sub-service card — image + description block + price. */
export function ShopMediaCardSkeleton() {
  return (
    <article className="flex items-center gap-4 rounded-md border border-[#008000]/30 bg-[#d4fcd4]/60 p-3 sm:px-5 sm:py-4">
      <Skeleton className="h-16 w-16 shrink-0 rounded-sm border border-gray-300/40" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/5 rounded" />
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="h-3.5 w-full rounded" />
        <Skeleton className="h-3 w-10 rounded" />
      </div>
      <Skeleton className="h-4 w-12 shrink-0 rounded" />
    </article>
  );
}

/** Deals card — image + business column + title block + discount. */
export function ShopDealCardSkeleton() {
  return (
    <article className="flex flex-col gap-3 rounded-md border border-[#008000]/30 bg-[#d4fcd4]/60 p-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-4">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Skeleton className="h-16 w-16 shrink-0 rounded-sm border border-gray-300/40" />
        <div className="min-w-0 shrink-0 space-y-2 sm:w-[22%]">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-3.5 w-3/4 rounded" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-4/5 rounded" />
          <Skeleton className="h-3.5 w-1/2 rounded" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 sm:shrink-0 sm:flex-col sm:justify-center">
        <Skeleton className="h-8 w-14 rounded" />
        <Skeleton className="hidden h-3 w-20 rounded sm:block" />
      </div>
    </article>
  );
}

/** People customer card — avatar + name/phone + recent visit. */
export function ShopCustomerCardSkeleton() {
  return (
    <article className="flex items-center gap-4 rounded-md border border-[#008000]/30 bg-[#d4fcd4]/60 p-3 sm:px-5 sm:py-4">
      <Skeleton className="h-16 w-16 shrink-0 rounded-sm border border-gray-300/40" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/5 rounded" />
        <Skeleton className="h-3.5 w-28 rounded" />
      </div>
      <div className="shrink-0 space-y-2 text-right">
        <Skeleton className="ml-auto h-3.5 w-20 rounded" />
        <Skeleton className="ml-auto h-3.5 w-16 rounded" />
      </div>
    </article>
  );
}

/** Job cards and wallet invoice rows — badge column + green body. */
export function ShopSplitRowSkeleton() {
  return (
    <article className="flex items-stretch overflow-hidden rounded-sm">
      <div className="flex w-[76px] shrink-0 flex-col items-center justify-center gap-1 border border-gray-300 bg-white px-2 py-3 sm:w-[88px]">
        <Skeleton className="h-2.5 w-10 rounded" />
        <Skeleton className="h-4 w-12 rounded" />
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 bg-[#d4ffd4]/70 px-3 py-3 sm:gap-4 sm:px-5">
        <div className="min-w-0 shrink-0 space-y-2 sm:max-w-[34%]">
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-3.5 w-20 rounded" />
        </div>
        <Skeleton className="h-5 min-w-0 flex-1 rounded" />
        <div className="shrink-0 space-y-2 sm:max-w-[28%]">
          <Skeleton className="ml-auto h-3.5 w-16 rounded" />
          <Skeleton className="ml-auto h-3.5 w-14 rounded" />
        </div>
      </div>
    </article>
  );
}

/** Messages notification row. */
export function ShopMessageRowSkeleton() {
  return (
    <article className="rounded-md bg-[#CCFFCC]/70 px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Skeleton className="h-3.5 min-w-0 flex-1 rounded" />
        <Skeleton className="h-3 w-24 shrink-0 rounded" />
      </div>
    </article>
  );
}

/** Team member row. */
export function ShopTeamRowSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-md bg-[#CCFFCC]/70 px-4 py-3">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="h-3.5 w-28 rounded" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-3 w-8 rounded" />
        <Skeleton className="h-3 w-10 rounded" />
      </div>
    </div>
  );
}

/** Checkbox list rows (car companies, service selection). */
export function ShopCheckboxRowSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3">
      <Skeleton className="h-4 w-40 rounded" />
      <Skeleton className="h-4 w-4 shrink-0 rounded" />
    </div>
  );
}

/** Reports and help ticket rows. */
export function ShopGreenRowSkeleton() {
  return (
    <article className="flex overflow-hidden rounded-md shadow-sm">
      <div className="flex w-[28%] min-w-[100px] max-w-[160px] shrink-0 items-center justify-center bg-[#006600]/80 px-3 py-4">
        <Skeleton className="h-4 w-12 rounded bg-white/40" pulse={false} />
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-4 bg-[#CCFFCC]/70 px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3.5 w-32 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <Skeleton className="h-4 w-14 shrink-0 rounded" />
      </div>
    </article>
  );
}

/** Wallet expense row. */
export function ShopExpenseRowSkeleton() {
  return (
    <article className="flex items-center justify-between gap-4 rounded-md bg-[#d9ffd9]/70 px-4 py-3 sm:px-6">
      <Skeleton className="h-3.5 w-20 shrink-0 rounded" />
      <Skeleton className="h-3.5 min-w-0 flex-1 rounded" />
      <Skeleton className="hidden h-3.5 w-24 rounded sm:block" />
      <Skeleton className="h-3.5 w-16 shrink-0 rounded" />
    </article>
  );
}

/** Wallet bank row. */
export function ShopBankRowSkeleton() {
  return (
    <article className="flex items-center justify-between gap-4 rounded-md border border-[#008000]/30 bg-[#d4ffd4]/70 px-4 py-3 sm:px-6">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-32 rounded" />
        <Skeleton className="h-3 w-40 rounded" />
        <Skeleton className="h-3 w-28 rounded" />
      </div>
      <Skeleton className="h-4 w-20 shrink-0 rounded" />
    </article>
  );
}

/** Profile services grid tile. */
export function ShopServiceTileSkeleton() {
  return (
    <div className="relative flex aspect-square w-full flex-col rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm">
      <Skeleton className="mx-auto h-3 w-3/4 rounded" />
      <Skeleton className="mt-2 min-h-0 flex-1 rounded border border-gray-100" />
    </div>
  );
}

/** Profile car brand list block. */
export function ShopBrandGridSkeleton() {
  return (
    <div className="overflow-hidden rounded border border-gray-300 bg-white/90 shadow-sm">
      <div className="grid grid-cols-1 bg-gray-100/80 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex items-center gap-2 px-3 py-2.5">
            <Skeleton className="h-8 w-12 shrink-0 rounded" />
            <Skeleton className="h-3.5 min-w-0 flex-1 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Profile editor form fields. */
export function ShopFormSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <Skeleton className="h-10 w-28 rounded-md" />
    </div>
  );
}

/** My Website preview panel — toolbar + iframe area. */
export function ShopPreviewPanelSkeleton() {
  return (
    <>
      <div className="relative mb-4 rounded border border-ad-form-border bg-ad-form-bg px-4 py-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-5 w-20 rounded" />
          <Skeleton className="h-9 min-w-[220px] flex-1 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
        </div>
      </div>
      <Skeleton className="min-h-[420px] w-full rounded border border-ad-form-border" />
    </>
  );
}

export type ShopLoadingVariant =
  | "media-card"
  | "deal-card"
  | "customer-card"
  | "split-row"
  | "message-row"
  | "team-row"
  | "checkbox-row"
  | "green-row"
  | "expense-row"
  | "bank-row"
  | "service-tile"
  | "brand-grid"
  | "form"
  | "preview-panel";

type ShopListSkeletonProps = {
  variant?: ShopLoadingVariant;
  count?: number;
  className?: string;
};

function renderSkeletonItem(variant: ShopLoadingVariant): ReactNode {
  switch (variant) {
    case "deal-card":
      return <ShopDealCardSkeleton />;
    case "customer-card":
      return <ShopCustomerCardSkeleton />;
    case "split-row":
      return <ShopSplitRowSkeleton />;
    case "message-row":
      return <ShopMessageRowSkeleton />;
    case "team-row":
      return <ShopTeamRowSkeleton />;
    case "checkbox-row":
      return <ShopCheckboxRowSkeleton />;
    case "green-row":
      return <ShopGreenRowSkeleton />;
    case "expense-row":
      return <ShopExpenseRowSkeleton />;
    case "bank-row":
      return <ShopBankRowSkeleton />;
    case "brand-grid":
      return <ShopBrandGridSkeleton />;
    case "form":
      return <ShopFormSkeleton />;
    case "preview-panel":
      return <ShopPreviewPanelSkeleton />;
    case "media-card":
    default:
      return <ShopMediaCardSkeleton />;
  }
}

export function ShopListSkeleton({
  variant = "media-card",
  count = 5,
  className = "",
}: ShopListSkeletonProps) {
  if (variant === "service-tile") {
    return (
      <div
        className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 ${className}`.trim()}
        aria-busy="true"
        aria-label="Loading"
      >
        {Array.from({ length: count }, (_, index) => (
          <ShopServiceTileSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (variant === "form" || variant === "brand-grid" || variant === "preview-panel") {
    return (
      <div className={className} aria-busy="true" aria-label="Loading">
        {renderSkeletonItem(variant)}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`.trim()} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>{renderSkeletonItem(variant)}</div>
      ))}
    </div>
  );
}
