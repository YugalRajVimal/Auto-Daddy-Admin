import type { ReactNode } from "react";
import PortalSidebarButton from "../admin/PortalSidebarButton";
import { Skeleton } from "../common/Skeleton";
import {
  ownerSidebarButtonClass,
  ownerSidebarButtonStackClass,
  shopSidebarButtonClass,
  shopSidebarButtonStackClass,
  shopSidebarOutdoorButtonClass,
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
  /** Soft glass owner-portal pills (modern theme). */
  ownerStyle?: boolean;
};

export function ShopSidebarButton({
  label,
  active,
  onClick,
  trailing,
  className = "",
  outdoor = false,
  ownerStyle = false,
  "aria-expanded": ariaExpanded,
}: ShopSidebarButtonProps & { outdoor?: boolean }) {
  const toneClass = outdoor
    ? shopSidebarOutdoorButtonClass(active)
    : ownerStyle
      ? ownerSidebarButtonClass(active)
      : shopSidebarButtonClass(active);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      aria-expanded={ariaExpanded}
      className={`${toneClass} ${className}`.trim()}
    >
      <ShopSidebarListIcon />
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {trailing}
    </button>
  );
}

export type ShopSidebarItem = {
  id: string;
  label: string;
  variant?: "primary" | "secondary";
};

export function ShopSidebarButtonSkeleton({
  className = "",
  ownerStyle = false,
}: {
  className?: string;
  ownerStyle?: boolean;
}) {
  const shell = ownerStyle
    ? ownerSidebarButtonClass(false, `pointer-events-none animate-pulse ${className}`)
    : shopSidebarButtonClass(false, `pointer-events-none animate-pulse ${className}`);
  const bone = ownerStyle ? "bg-ad-purple/15" : "bg-[#f5cce8]";
  return (
    <div className={shell} aria-hidden="true">
      <Skeleton className={`h-4 w-4 shrink-0 rounded-full ${bone}`} pulse={false} />
      <Skeleton className={`h-3 min-w-0 flex-1 rounded ${bone}`} pulse={false} />
    </div>
  );
}

export function ShopSidebarButtonsSkeleton({
  count = 4,
  className = "",
  ownerStyle = false,
}: {
  count?: number;
  className?: string;
  ownerStyle?: boolean;
}) {
  const stack = ownerStyle ? ownerSidebarButtonStackClass : shopSidebarButtonStackClass;
  return (
    <div
      className={`${stack} ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading navigation"
    >
      {Array.from({ length: count }, (_, index) => (
        <ShopSidebarButtonSkeleton key={index} ownerStyle={ownerStyle} />
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
  /** Soft glass pills for the modern owner portal. */
  ownerStyle?: boolean;
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
  ownerStyle = false,
  loading = false,
  skeletonCount = 4,
}: ShopSidebarProps) {
  const useOwner = ownerStyle;
  const useShop = shopStyle && !ownerStyle;
  const stackClass = useOwner ? ownerSidebarButtonStackClass : shopSidebarButtonStackClass;

  return (
    <aside
      className={
        useOwner
          ? `flex w-full shrink-0 flex-col ${className}`
          : `${shopSidebarShellClass} ${className}`
      }
    >
      <div
        className={
          useOwner
            ? "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-white/70 bg-white/45 p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-xl lg:pr-2.5"
            : "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto lg:pr-0.5"
        }
      >
        {heading ? (
          <h2 className={useOwner ? `${headingClassName} px-1.5 pt-1 text-slate-500` : headingClassName}>
            {heading}
          </h2>
        ) : null}

        {children ? <div className="min-w-0">{children}</div> : null}

        {loading ? (
          <ShopSidebarButtonsSkeleton count={skeletonCount} ownerStyle={useOwner} />
        ) : (
          <div className={stackClass}>
            {items.map((item) =>
              useOwner || useShop ? (
                <ShopSidebarButton
                  key={item.id}
                  label={item.label}
                  active={activeId === item.id}
                  onClick={() => onSelect?.(item.id)}
                  ownerStyle={useOwner}
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
