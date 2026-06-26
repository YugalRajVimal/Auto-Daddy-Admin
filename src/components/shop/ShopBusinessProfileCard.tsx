import { Link } from "react-router";
import { FiImage } from "react-icons/fi";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { getShopTypeLabel } from "../../lib/shopTypes";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";

const CARD_CLASS =
  "flex w-full shrink-0 flex-col overflow-hidden rounded-lg border border-white/70 bg-ad-glass shadow-md lg:w-[220px] xl:w-[260px]";

export default function ShopBusinessProfileCard() {
  const { business, user, displayName, city, businessPhone } = useShopOwnerPortal();

  const businessName =
    business?.businessName?.trim() || displayName || "Your Business";
  const location = business?.city?.trim() || city || "—";
  const phone =
    business?.businessPhone?.trim() || businessPhone?.trim() || user?.phone?.trim();
  const shopTypeLabel = getShopTypeLabel(user?.shopType ?? business?.shopType);
  const bannerSrc = normalizeMediaUrl(business?.bannerImage ?? business?.businessLogo ?? null);
  const website = (business as { businessWebsite?: string })?.businessWebsite?.trim();
  const mapLoc = (business as { businessMapLocation?: { lat: number; lng: number } })
    ?.businessMapLocation;
  const directionsUrl = mapLoc
    ? `https://www.google.com/maps/search/?api=1&query=${mapLoc.lat},${mapLoc.lng}`
    : business?.address?.trim()
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`
      : null;

  return (
    <aside className={CARD_CLASS} aria-label="Business profile">
      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {bannerSrc ? (
          <img src={bannerSrc} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full min-h-[140px] flex-col items-center justify-center text-gray-400">
            <FiImage size={32} strokeWidth={1.5} aria-hidden />
            <span className="mt-1 text-xs">Business photo</span>
          </div>
        )}
      </div>

      <div className="bg-[#008000] px-3 py-2.5 text-center text-sm font-bold text-white">
        {businessName}
      </div>

      <div className="flex flex-col items-center gap-3 px-3 py-4">
        <span className="rounded-full bg-[#d4ffd4] px-5 py-1.5 text-sm font-bold text-[#008000]">
          {location}
        </span>

        <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-gray-800">
          {phone ? (
            <a href={`tel:${phone.replace(/\D/g, "")}`} className="hover:text-ad-purple hover:underline">
              Call
            </a>
          ) : (
            <span className="text-gray-400">Call</span>
          )}
          {website ? (
            <a
              href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#008000] underline hover:text-ad-purple"
            >
              Website
            </a>
          ) : (
            <Link to="/shop/my-website" className="text-[#008000] underline hover:text-ad-purple">
              Website
            </Link>
          )}
          {directionsUrl ? (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ad-purple hover:underline"
            >
              Directions
            </a>
          ) : (
            <span className="text-gray-400">Directions</span>
          )}
        </div>

        <span className="w-full rounded-full border border-gray-300 bg-white px-3 py-2 text-center text-xs font-semibold text-[#008000]">
          {shopTypeLabel}
        </span>
      </div>
    </aside>
  );
}
