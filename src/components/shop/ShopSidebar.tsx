import type { ReactNode } from "react";
import PortalSidebarButton from "../admin/PortalSidebarButton";
import { Skeleton } from "../common/Skeleton";
import {
  shopSidebarButtonClass,
  shopSidebarButtonStackClass,
  shopSidebarShellClass,
} from "./shopSidebarStyles";

function ShopSidebarListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0">
      {[5, 9, 13, 17].map((y) => (
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
  "aria-expanded"?: boolean;
};

export function ShopSidebarButton({
  label,
  active,
  onClick,
  trailing,
  className = "",
  "aria-expanded": ariaExpanded,
}: ShopSidebarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      aria-expanded={ariaExpanded}
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
      <Skeleton className="h-4 w-4 shrink-0 rounded-full bg-[#f5cce8]" pulse={false} />
      <Skeleton className="h-3 min-w-0 flex-1 rounded bg-[#f5cce8]" pulse={false} />
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
      className={`${shopSidebarButtonStackClass} ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading navigation"
    >
      {Array.from({ length: count }, (_, index) => (
        <ShopSidebarButtonSkeleton key={index} />
      ))}
    </div>
  );
}

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
    <aside className={`${shopSidebarShellClass} ${className}`}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto lg:pr-0.5">
        {heading ? <h2 className={headingClassName}>{heading}</h2> : null}

        {children ? <div className="min-w-0">{children}</div> : null}

        {loading ? (
          <ShopSidebarButtonsSkeleton count={skeletonCount} />
        ) : (
          <div className={shopSidebarButtonStackClass}>
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
