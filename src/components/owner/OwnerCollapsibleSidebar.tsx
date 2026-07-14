import type { ReactNode } from "react";
import { FiChevronDown } from "react-icons/fi";
import { ShopSidebarButton } from "../shop/ShopSidebar";

type OwnerCollapsibleSidebarItemProps = {
  label: string;
  expanded: boolean;
  active?: boolean;
  onToggle: () => void;
  children?: ReactNode;
  /** When false, omits the chevron (leaf items with no nested list). */
  collapsible?: boolean;
};

export function OwnerCollapsibleSidebarChildren({ children }: { children: ReactNode }) {
  return (
    <div
      className="ml-2 flex flex-col gap-2 border-l-2 border-ad-purple/25 pl-2"
      role="group"
    >
      {children}
    </div>
  );
}

export function OwnerCollapsibleSidebarItem({
  label,
  expanded,
  active = false,
  onToggle,
  children,
  collapsible = true,
}: OwnerCollapsibleSidebarItemProps) {
  const showChildren = expanded && children != null;

  return (
    <div className="flex flex-col gap-2">
      <ShopSidebarButton
        label={label}
        active={active || (collapsible && expanded)}
        onClick={onToggle}
        ownerStyle
        aria-expanded={collapsible ? expanded : undefined}
        trailing={
          collapsible ? (
            <FiChevronDown
              className={`shrink-0 text-base transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              aria-hidden
            />
          ) : undefined
        }
      />
      {showChildren ? <OwnerCollapsibleSidebarChildren>{children}</OwnerCollapsibleSidebarChildren> : null}
    </div>
  );
}

export function OwnerCollapsibleSidebarList({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-col gap-3 ${className}`.trim()}>{children}</div>;
}
