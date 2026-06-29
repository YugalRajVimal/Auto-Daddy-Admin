export function JobCardFormSkeleton() {
  return (
    <div className="animate-pulse space-y-4 py-2">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-x-12">
        <div className="grid w-fit grid-cols-[8.5rem_14rem] gap-x-3 gap-y-2">
          <div className="h-4 w-20 rounded bg-gray-200" />
          <div className="h-[26px] w-[14rem] rounded bg-gray-200" />
          <div />
          <div className="space-y-1">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-4 w-16 rounded bg-gray-200" />
          </div>
        </div>
        <div className="grid w-fit grid-cols-[8.5rem_14rem] gap-x-3 gap-y-2 lg:justify-self-end">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="contents">
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-[26px] w-[14rem] rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
      <div className="h-36 rounded border border-gray-200 bg-gray-100" />
      <div className="flex justify-between gap-4">
        <div className="h-16 flex-1 rounded bg-gray-200" />
        <div className="h-28 w-48 rounded bg-gray-200" />
      </div>
    </div>
  );
}
