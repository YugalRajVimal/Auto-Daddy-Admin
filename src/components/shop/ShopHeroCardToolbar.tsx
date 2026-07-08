import type { ReactNode } from "react";
import { shopHeroCardSearchClass } from "./shopLayoutStyles";

type ShopHeroCardToolbarProps = {
  searchInputId?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  headerAction?: ReactNode;
  /** Renders the grey action bar even when search and headerAction are empty. */
  alwaysShow?: boolean;
  className?: string;
};

/** Right-aligned search and actions row inside the profile hero card. */
export default function ShopHeroCardToolbar({
  searchInputId,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  headerAction,
  alwaysShow = false,
  className = "",
}: ShopHeroCardToolbarProps) {
  const showSearch = searchPlaceholder != null;

  if (!showSearch && !headerAction && !alwaysShow) return null;

  return (
    <div
      className={`flex min-h-9 shrink-0 flex-wrap items-center justify-end gap-2 rounded-t border-b border-gray-300 bg-[#d1d5db] px-2 py-1.5 sm:gap-3 ${className}`.trim()}
    >
      {showSearch ? (
        <input
          id={searchInputId}
          type="search"
          value={searchValue ?? ""}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={searchPlaceholder}
          className={shopHeroCardSearchClass}
        />
      ) : null}
      {headerAction ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{headerAction}</div>
      ) : null}
    </div>
  );
}
