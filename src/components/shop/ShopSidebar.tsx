import type { ReactNode } from "react";
import PortalSidebarButton from "../admin/PortalSidebarButton";
import { OwnerSidebarFaqsSlot } from "../owner/OwnerFaqsButton";

export type ShopSidebarItem = {
  id: string;
  label: string;
  variant?: "primary" | "secondary";
};

const SHOP_SIDEBAR_SHELL_CLASS =
  "flex w-full shrink-0 flex-col lg:w-[220px] xl:w-[260px] lg:h-[calc(100vh-220px)] lg:max-h-[calc(100vh-220px)]";

type ShopSidebarProps = {
  items: ShopSidebarItem[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  heading?: string;
  headingClassName?: string;
  children?: ReactNode;
  footer?: ReactNode;
  searchInputId?: string;
  onFaqsClick?: () => void;
  className?: string;
};

export default function ShopSidebar({
  items,
  activeId,
  onSelect,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  heading,
  headingClassName = "text-sm font-bold text-gray-600",
  children,
  footer,
  searchInputId,
  onFaqsClick,
  className = "",
}: ShopSidebarProps) {
  return (
    <aside className={`${SHOP_SIDEBAR_SHELL_CLASS} ${className}`}>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto lg:pr-0.5">
        {heading ? <h2 className={headingClassName}>{heading}</h2> : null}

        {searchPlaceholder != null ? (
          <input
            id={searchInputId}
            type="search"
            value={searchValue ?? ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-full border border-gray-300 bg-gray-100 px-4 py-2 text-sm text-gray-800 placeholder:text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        ) : null}

        {children}

        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <PortalSidebarButton
              key={item.id}
              label={item.label}
              active={activeId === item.id}
              onClick={() => onSelect?.(item.id)}
            />
          ))}
        </div>

        {footer}
      </div>

      {onFaqsClick ? <OwnerSidebarFaqsSlot pinned onClick={onFaqsClick} /> : null}
    </aside>
  );
}
