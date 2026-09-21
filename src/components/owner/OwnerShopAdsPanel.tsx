import { useEffect, useState } from "react";
import ShopDealerAdCard from "../shop/ShopDealerAdCard";

const ROTATE_MS = 4000;
const FADE_MS = 300;

interface ShopAd {
  imageUrl?: string;
  name: string;
  city?: string;
  phone?: string;
  website?: string;
  specialty?: string;
}

export default function OwnerShopAdsPanel({
  ads,
}: {
  ads?: ShopAd[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fading, setFading] = useState(false);

  const count = ads?.length ?? 0;

  useEffect(() => {
    if (count <= 1) return;
    let fadeTimer: number | undefined;
    const rotate = window.setInterval(() => {
      setFading(true);
      fadeTimer = window.setTimeout(() => {
        setActiveIndex((i) => (i + 1) % count);
        setFading(false);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => {
      window.clearInterval(rotate);
      if (fadeTimer) window.clearTimeout(fadeTimer);
    };
  }, [count]);

  // No early return: with no ads we still render the panel, and the card
  // shows its skeleton because every prop is undefined.
  const ad: ShopAd | undefined = ads?.[activeIndex] ?? ads?.[0];

  return (
    <div className="flex w-full max-w-[160px] flex-col 2xsm:max-w-[180px] sm:max-w-[200px] md:sticky md:top-3 md:h-[calc(100vh-14.5rem)] md:min-h-[320px] md:max-w-none">
      <p className="mb-1.5 shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        Sponsored
      </p>
      <div
        className={`min-h-0 flex-1 transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`}
      >
        <ShopDealerAdCard
          imageUrl={ad?.imageUrl?.trim()}
          imageAlt={ad?.name}
          title={ad?.name}
          location={ad ? ad.city?.trim() || "Nearby" : undefined}
          phone={ad?.phone}
          website={ad?.website}
          tagline={ad ? ad.specialty?.trim() || "Trusted local auto shop" : undefined}
          className="h-full"
        />
      </div>
      {count > 1 ? (
        <div className="mt-2 flex shrink-0 justify-center gap-1.5">
          {ads!.map((item, index) => (
            <span
              key={`${item.name}-${index}`}
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