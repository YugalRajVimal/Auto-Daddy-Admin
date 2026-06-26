import type { ReactNode } from "react";
import { shopHeroCardSearchClass } from "./shopLayoutStyles";

type ShopHeroCardToolbarProps = {
  searchInputId?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  headerAction?: ReactNode;
};

/** Right-aligned search and actions row inside the profile hero card. */
export default function ShopHeroCardToolbar({
  searchInputId,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  headerAction,
}: ShopHeroCardToolbarProps) {
  const showSearch = searchPlaceholder != null;

  if (!showSearch && !headerAction) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center justify-end gap-2 sm:gap-3">
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
