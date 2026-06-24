type ShopDealerCardProps = {
  name: string;
  phone: string;
  imageUrl?: string;
  className?: string;
};

export default function ShopDealerCard({ name, phone, imageUrl, className = "" }: ShopDealerCardProps) {
  const hasPhoto = Boolean(imageUrl?.trim());
  const phoneHref = phone ? `tel:${phone.replace(/\s/g, "")}` : undefined;

  return (
    <article
      className={`flex aspect-square w-full flex-col overflow-hidden rounded-sm border border-[#006600] ${className}`}
    >
      <div className="relative min-h-0 flex-1 bg-[#DFFFD6]">
        {hasPhoto ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center px-3">
            <p className="text-center text-sm font-bold leading-snug text-[#006600]">{name}</p>
          </div>
        )}
      </div>

      <div className="shrink-0 bg-[#008000] px-2 py-2 text-center">
        <p className="truncate text-sm font-bold text-white">{name || "—"}</p>
        {phoneHref ? (
          <a href={phoneHref} className="mt-0.5 block truncate text-xs font-semibold text-white/95 hover:underline">
            {phone}
          </a>
        ) : (
          <p className="mt-0.5 truncate text-xs font-semibold text-white/95">—</p>
        )}
      </div>
    </article>
  );
}
