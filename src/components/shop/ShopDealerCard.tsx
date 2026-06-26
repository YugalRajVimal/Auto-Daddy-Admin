import ShopDealerAdCard from "./ShopDealerAdCard";

type ShopDealerCardProps = {
  name: string;
  phone: string;
  imageUrl?: string;
  city?: string;
  website?: string;
  specialty?: string;
  className?: string;
  onClick?: () => void;
};

export default function ShopDealerCard({
  name,
  phone,
  imageUrl,
  city,
  website,
  specialty,
  className = "",
  onClick,
}: ShopDealerCardProps) {
  return (
    <ShopDealerAdCard
      imageUrl={imageUrl}
      imageAlt={name}
      title={name || "—"}
      location={city?.trim() || "Mississauga"}
      phone={phone}
      website={website}
      tagline={specialty?.trim() || "Aftermarket Spares Specialist"}
      className={className}
      onClick={onClick}
    />
  );
}
