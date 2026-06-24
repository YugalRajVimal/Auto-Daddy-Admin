type ShopDealerCardProps = {
  name: string;
  phone: string;
  imageUrl?: string;
};

export default function ShopDealerCard({ name, phone, imageUrl }: ShopDealerCardProps) {
  const hasPhoto = Boolean(imageUrl?.trim());
  const footerText = hasPhoto ? name : phone;
  const footerHref = !hasPhoto && phone ? `tel:${phone.replace(/\s/g, "")}` : undefined;

  return (
    <article className="overflow-hidden rounded-sm border border-[#006600]">
      <div className="flex min-h-[88px] items-center justify-center bg-[#DFFFD6] px-3 py-4">
        {hasPhoto ? (
          <img src={imageUrl} alt={name} className="max-h-[72px] w-full object-contain" />
        ) : (
          <p className="text-center text-sm font-bold text-[#006600]">{name}</p>
        )}
      </div>
      <div className="bg-[#008000] px-3 py-2 text-center">
        {footerHref ? (
          <a href={footerHref} className="text-sm font-bold text-white hover:underline">
            {footerText || "—"}
          </a>
        ) : (
          <p className="text-sm font-bold text-white">{footerText || "—"}</p>
        )}
      </div>
    </article>
  );
}
