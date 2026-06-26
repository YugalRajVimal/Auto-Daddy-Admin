import type { ReactNode } from "react";
import PortalSidebarButton from "../admin/PortalSidebarButton";
import { Skeleton } from "../common/Skeleton";
import { shopSidebarButtonClass } from "./shopSidebarStyles";

function ShopSidebarListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0">
      {[6, 10, 14].map((y) => (
        <g key={y}>
          <circle cx="4" cy={y} r="1.25" fill="currentColor" />
          <rect x="7" y={y - 0.75} width="9" height="1.5" rx="0.75" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

export type ShopSidebarButtonProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  trailing?: ReactNode;
  className?: string;
};

export function ShopSidebarButton({
  label,
  active,
  onClick,
  trailing,
  className = "",
}: ShopSidebarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={shopSidebarButtonClass(active, className)}
    >
      <ShopSidebarListIcon />
      <span className="min-w-0 flex-1 text-left">{label}</span>
      {trailing}
    </button>
  );
}

export type ShopSidebarItem = {
  id: string;
  label: string;
  variant?: "primary" | "secondary";
};

export function ShopSidebarButtonSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={shopSidebarButtonClass(false, `pointer-events-none animate-pulse ${className}`)}
      aria-hidden="true"
    >
      <Skeleton className="h-5 w-5 shrink-0 rounded-full bg-[#f5cce8]" pulse={false} />
      <Skeleton className="h-3.5 min-w-0 flex-1 rounded bg-[#f5cce8]" pulse={false} />
    </div>
  );
}

export function ShopSidebarButtonsSkeleton({
  count = 4,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading navigation"
    >
      {Array.from({ length: count }, (_, index) => (
        <ShopSidebarButtonSkeleton key={index} />
      ))}
    </div>
  );
}

const SHOP_SIDEBAR_SHELL_CLASS =
  "flex w-full shrink-0 flex-col lg:w-[220px] xl:w-[260px] lg:h-[calc(100vh-220px)] lg:max-h-[calc(100vh-220px)]";

type ShopSidebarProps = {
  items: ShopSidebarItem[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  heading?: string;
  headingClassName?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Purple/peach pill buttons matching shop mockups. */
  shopStyle?: boolean;
  /** Placeholder pills while dynamic nav items load. */
  loading?: boolean;
  skeletonCount?: number;
};

export default function ShopSidebar({
  items,
  activeId,
  onSelect,
  heading,
  headingClassName = "text-sm font-bold text-gray-600",
  children,
  footer,
  className = "",
  shopStyle = false,
  loading = false,
  skeletonCount = 4,
}: ShopSidebarProps) {
  return (
    <aside className={`${SHOP_SIDEBAR_SHELL_CLASS} ${className}`}>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto lg:pr-0.5">
        {heading ? <h2 className={headingClassName}>{heading}</h2> : null}

        {children}

        {loading ? (
          <ShopSidebarButtonsSkeleton count={skeletonCount} />
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) =>
              shopStyle ? (
                <ShopSidebarButton
                  key={item.id}
                  label={item.label}
                  active={activeId === item.id}
                  onClick={() => onSelect?.(item.id)}
                />
              ) : (
                <PortalSidebarButton
                  key={item.id}
                  label={item.label}
                  active={activeId === item.id}
                  onClick={() => onSelect?.(item.id)}
                />
              ),
            )}
          </div>
        )}

        {!loading ? footer : null}
      </div>
    </aside>
  );
}
