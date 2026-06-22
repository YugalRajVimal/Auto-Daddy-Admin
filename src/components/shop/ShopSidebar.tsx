import type { ReactNode } from "react";

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

function SidebarButton({
  label,
  active,
  variant,
  onClick,
}: {
  label: string;
  active: boolean;
  variant: "primary" | "secondary";
  onClick: () => void;
}) {
  if (variant === "primary") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-md px-4 py-3 text-left text-sm font-bold transition-colors ${
          active ? "bg-[#006600] text-white shadow-sm" : "bg-[#008000] text-white hover:bg-[#006600]"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-md border px-4 py-3 text-left text-sm font-bold transition-colors ${
        active
          ? "border-ad-purple bg-[#f5c9a8] text-ad-purple shadow-sm"
          : "border-ad-purple bg-[#FDE4D0] text-ad-purple hover:bg-[#f5c9a8]"
      }`}
    >
      {label}
    </button>
  );
}

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
      className={`flex w-full shrink-0 flex-col gap-2 lg:w-[220px] xl:w-[240px] lg:min-h-[calc(100vh-220px)] ${className}`}
    >
      {heading ? <h2 className="text-base font-bold text-blue-700">{heading}</h2> : null}

      {searchPlaceholder != null ? (
        <input
          type="search"
          value={searchValue ?? ""}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-500 focus:border-ad-purple focus:outline-none focus:ring-1 focus:ring-ad-purple"
        />
      ) : null}

      {children}

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <SidebarButton
            key={item.id}
            label={item.label}
            variant={item.variant ?? "primary"}
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
            className="w-full rounded-md bg-ad-purple px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-ad-purple-dark"
          >
            FAQs
          </button>
        </div>
      ) : null}
    </aside>
  );
}
