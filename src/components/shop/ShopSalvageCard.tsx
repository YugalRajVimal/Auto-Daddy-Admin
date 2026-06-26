import { formatSalvagePrice } from "../../lib/dummySalvageDeals";

type ShopSalvageCardProps = {
  partName: string;
  company: string;
  price: number;
  imageUrl?: string;
  year?: string;
  className?: string;
  onClick?: () => void;
};

const CARD_CLASS =
  "flex w-full flex-col overflow-hidden rounded-lg border border-gray-200/80 bg-white shadow-md";

export default function ShopSalvageCard({
  partName,
  company,
  price,
  imageUrl,
  year,
  className = "",
  onClick,
}: ShopSalvageCardProps) {
  const hasPhoto = Boolean(imageUrl?.trim());

  return (
    <article
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`${CARD_CLASS} ${onClick ? "cursor-pointer transition-shadow hover:shadow-lg" : ""} ${className}`}
    >
      <div className="relative h-28 w-full overflow-hidden bg-gray-100">
        {hasPhoto ? (
          <img src={imageUrl} alt={partName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center px-3">
            <p className="text-center text-xs font-bold leading-snug text-[#008000]">{partName}</p>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-ad-purple/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Salvage
        </span>
      </div>

      <div className="bg-[#008000] px-2.5 py-2 text-center text-xs font-bold leading-snug text-white">
        {partName || "—"}
      </div>

      <div className="flex flex-col items-center gap-2 px-2.5 py-2.5">
        <div className="flex w-full items-center justify-between gap-2 text-xs">
          <span className="min-w-0 truncate font-semibold text-gray-700">{company || "—"}</span>
          {year ? <span className="shrink-0 text-[10px] font-medium text-gray-500">{year}</span> : null}
        </div>

        <span className="w-full rounded-full bg-[#d4ffd4] px-3 py-1.5 text-center text-sm font-bold text-[#008000]">
          {formatSalvagePrice(price)}
        </span>

        <p className="text-center text-[10px] font-semibold text-ad-purple">Tap for details</p>
      </div>
    </article>
  );
}
