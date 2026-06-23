import type { ReactNode } from "react";
import PortalSidebarButton from "../admin/PortalSidebarButton";

export type ShopSidebarItem = {
  id: string;
  label: string;
  variant?: "primary" | "secondary";
};

type ShopSidebarProps = {
  items: ShopSidebarItem[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  heading?: string;
  children?: ReactNode;
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
  children,
  onFaqsClick,
  className = "",
}: ShopSidebarProps) {
  return (
    <aside
      className={`flex w-full shrink-0 flex-col gap-3 lg:w-[220px] xl:w-[260px] lg:min-h-[calc(100vh-220px)] ${className}`}
    >
      {heading ? <h2 className="text-base font-bold text-blue-700">{heading}</h2> : null}

      {searchPlaceholder != null ? (
        <input
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

      {onFaqsClick ? (
        <div className="mt-auto pt-6">
          <button
            type="button"
            onClick={onFaqsClick}
            className="w-full rounded-full border border-blue-600 bg-white/70 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-blue-600 transition-colors hover:bg-white"
          >
            FAQs
          </button>
        </div>
      ) : null}
    </aside>
  );
}
