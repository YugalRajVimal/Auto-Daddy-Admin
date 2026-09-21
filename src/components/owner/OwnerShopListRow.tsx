import type { ReactNode } from "react";
import { FiHeart, FiPlus, FiTool } from "react-icons/fi";
import { isCarOwnerShopOpenToday } from "../../lib/carOwnerAutoShops";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import type { CarOwnerAutoShopListItem } from "../../types/carOwnerAutoShops";
import { ownerGreenRowClass } from "./ownerUi";

/**
 * Mockup shop row: logo box, name + blue phone, green "Shop is Open" pill and a purple "+".
 * The whole row opens the shop; `trailing` replaces the "+" (e.g. favourite / sent icons).
 */
export function OwnerShopListRow({
  shop,
  onExpand,
  statusLabel,
  showFavorite = false,
  trailing,
  meta,
}: {
  shop: CarOwnerAutoShopListItem;
  onExpand: () => void;
  /** Override the open/closed pill text (e.g. "Available", "Book Service"). */
  statusLabel?: string;
  showFavorite?: boolean;
  trailing?: ReactNode;
  meta?: ReactNode;
}) {
  const openToday = isCarOwnerShopOpenToday(shop);
  const logoUri = normalizeMediaUrl(shop.logoUrl);
  const phone = shop.phone.trim() || "Phone not listed";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onExpand}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onExpand();
        }
      }}
      aria-label={`View ${shop.name}`}
      className={`group grid cursor-pointer grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-xl ${ownerGreenRowClass} pr-3 ring-1 ring-green-200/80 transition-all hover:-translate-y-px hover:shadow-md hover:ring-green-300 sm:grid-cols-[128px_minmax(0,1fr)_auto_auto] sm:gap-5 sm:pr-5`}
    >
      <div className="flex h-16 items-center justify-center overflow-hidden border-r border-green-300/70 bg-white text-gray-300">
        {logoUri ? (
          <img src={logoUri} alt="" className="h-full w-full object-cover" />
        ) : (
          <FiTool className="size-7" strokeWidth={1.5} aria-hidden />
        )}
      </div>
      <div className="min-w-0 py-2 sm:text-center">
        <p className="flex items-center gap-1.5 truncate text-base font-bold text-gray-900 sm:justify-center sm:text-lg">
          {showFavorite && shop.isFavorite ? (
            <FiHeart className="size-4 shrink-0 fill-red-500 text-red-500" aria-label="Favourite" />
          ) : null}
          <span className="truncate">{shop.name}</span>
        </p>
        <p className="truncate text-sm font-bold tracking-wide text-blue-700">{phone}</p>
        {meta ? <div className="truncate text-xs text-gray-600">{meta}</div> : null}
      </div>
      <span
        className={`hidden min-w-[9.5rem] rounded-md px-4 py-1.5 text-center text-sm font-bold text-white shadow-sm sm:inline-block ${
          openToday ? "bg-gradient-to-b from-[#0d8a0d] to-[#007000]" : "bg-gray-400"
        }`}
      >
        {statusLabel ?? (openToday ? "Shop is Open" : "Shop is Closed")}
      </span>
      {trailing ?? (
        <span className="flex size-9 items-center justify-center rounded-lg text-ad-purple transition-colors group-hover:bg-white/70" aria-hidden>
          <FiPlus className="size-7" strokeWidth={2.5} />
        </span>
      )}
    </div>
  );
}
