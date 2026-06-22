import type { ReactNode } from "react";

export function PortalPageContent({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`min-h-0 flex-1 overflow-y-auto bg-ad-app-bg px-4 py-4 sm:px-6 md:px-8 md:py-5 lg:px-10 ${className}`}
    >
      {children}
    </div>
  );
}
