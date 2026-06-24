import { formatSalvagePrice } from "../../lib/dummySalvageDeals";

type ShopSalvageCardProps = {
  partName: string;
  company: string;
  price: number;
  imageUrl?: string;
  className?: string;
  onClick?: () => void;
};

export default function ShopSalvageCard({
  partName,
  company,
  price,
  imageUrl,
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
      className={`flex aspect-square w-full flex-col overflow-hidden rounded-sm border border-[#006600] ${
        onClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""
      } ${className}`}
    >
      <div className="relative min-h-0 flex-1 bg-[#DFFFD6]">
        {hasPhoto ? (
          <img src={imageUrl} alt={partName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center px-3">
            <p className="text-center text-sm font-bold leading-snug text-[#006600]">{partName}</p>
          </div>
        )}
      </div>

      <div className="shrink-0 bg-[#008000] px-2 py-2 text-center">
        <p className="truncate text-sm font-bold text-white">{partName || "—"}</p>
        <p className="mt-0.5 truncate text-xs font-semibold text-white/95">{company || "—"}</p>
        <p className="mt-0.5 text-xs font-bold text-[#DFFFD6]">{formatSalvagePrice(price)}</p>
      </div>
    </article>
  );
}
