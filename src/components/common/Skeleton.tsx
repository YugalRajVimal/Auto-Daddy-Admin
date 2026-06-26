type SkeletonProps = {
  className?: string;
  pulse?: boolean;
};

export function Skeleton({ className = "", pulse = true }: SkeletonProps) {
  return (
    <div
      className={`bg-gray-200 ${pulse ? "animate-pulse" : ""} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

export function ShopContentSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`flex min-h-full flex-1 animate-pulse flex-col gap-4 px-1 py-3 sm:px-2 ${className}`}>
      <div className="h-7 w-40 shrink-0 rounded bg-gray-200" />
      <div className="min-h-[8rem] flex-1 rounded-lg bg-gray-200" />
      <div className="shrink-0 space-y-2">
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-5/6 rounded bg-gray-200" />
        <div className="h-4 w-2/3 rounded bg-gray-200" />
      </div>
    </div>
  );
}
