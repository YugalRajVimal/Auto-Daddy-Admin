import { useEffect, useState } from "react";
import { DUMMY_OWNER_SHOP_ADS } from "../../lib/dummyOwnerShopAds";
import { partsDealerDummyImage } from "../../lib/shopAdDummyImages";
import ShopDealerAdCard from "../shop/ShopDealerAdCard";

const ROTATE_MS = 4000;
const FADE_MS = 300;

export default function OwnerShopAdsPanel() {
  const ads = DUMMY_OWNER_SHOP_ADS;
  const [activeIndex, setActiveIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (ads.length <= 1) return;
    const rotate = window.setInterval(() => {
      setFading(true);
      window.setTimeout(() => {
        setActiveIndex((i) => (i + 1) % ads.length);
        setFading(false);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => window.clearInterval(rotate);
  }, [ads.length]);

  const ad = ads[activeIndex];
  if (!ad) return null;

  return (
    <div className="flex w-full max-w-[160px] flex-col 2xsm:max-w-[180px] sm:max-w-[200px] md:sticky md:top-3 md:h-[calc(100vh-14.5rem)] md:min-h-[320px] md:max-w-none">
      <p className="mb-1.5 shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        Sponsored
      </p>
      <div
        className={`min-h-0 flex-1 transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`}
      >
        <ShopDealerAdCard
          imageUrl={ad.imageUrl?.trim() || partsDealerDummyImage(activeIndex)}
          imageAlt={ad.name}
          title={ad.name}
          location={ad.city?.trim() || "Nearby"}
          phone={ad.phone}
          website={ad.website}
          tagline={ad.specialty?.trim() || "Trusted local auto shop"}
          className="h-full"
        />
      </div>
      {ads.length > 1 ? (
        <div className="mt-2 flex shrink-0 justify-center gap-1.5">
          {ads.map((item, index) => (
            <span
              key={item.name}
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                index === activeIndex ? "bg-sky-600" : "bg-slate-300"
              }`}
              aria-hidden
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
