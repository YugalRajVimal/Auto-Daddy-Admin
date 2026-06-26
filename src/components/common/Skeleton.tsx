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
    <div className={`animate-pulse space-y-4 p-4 ${className}`}>
      <div className="h-7 w-40 rounded bg-gray-200" />
      <div className="h-36 w-full rounded-lg bg-gray-200" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-5/6 rounded bg-gray-200" />
        <div className="h-4 w-2/3 rounded bg-gray-200" />
      </div>
    </div>
  );
}
