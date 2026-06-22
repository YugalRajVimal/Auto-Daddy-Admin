type ShopDealerCardProps = {
  name: string;
  phone: string;
};

export default function ShopDealerCard({ name, phone }: ShopDealerCardProps) {
  return (
    <article className="overflow-hidden rounded-md shadow-sm">
      <div className="bg-[#CCFFCC] px-4 py-3">
        <p className="text-sm font-bold text-[#006600]">{name}</p>
      </div>
      <div className="bg-[#006600] px-4 py-2.5">
        {phone ? (
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="text-sm font-bold text-white hover:underline"
          >
            {phone}
          </a>
        ) : (
          <p className="text-sm font-bold text-white/80">—</p>
        )}
      </div>
    </article>
  );
}
