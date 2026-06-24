export function JobCardFormSkeleton() {
  return (
    <div className="animate-pulse space-y-4 py-2">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 rounded bg-gray-200" />
        ))}
      </div>
      <div className="h-40 rounded bg-gray-200" />
      <div className="h-24 rounded bg-gray-200" />
    </div>
  );
}
