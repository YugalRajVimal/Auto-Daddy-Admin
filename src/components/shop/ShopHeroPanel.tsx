import { useEffect } from "react";
import type { PartsDealerCard } from "../../hooks/usePartsDealers";
import type { SalvageDeal } from "../../lib/dummySalvageDeals";
import { PORTAL_HOME_HERO_IMAGE } from "../../lib/portalHeroImage";
import { Skeleton } from "../common/Skeleton";
import { ThoughtOfTheDayCard } from "../portal/ThoughtOfTheDayCard";
import ShopAdDetailContent from "./ShopAdDetailContent";
import { shopHeroOpaqueSurfaceClass, shopMainContentShellClass } from "./shopLayoutStyles";

type ShopHeroPanelProps = {
  thoughtOfTheDay?: string;
  loading?: boolean;
  className?: string;
  partsDealer?: PartsDealerCard | null;
  salvageDeal?: SalvageDeal | null;
  onAdClose?: () => void;
};

export default function ShopHeroPanel({
  thoughtOfTheDay,
  loading,
  className = "",
  partsDealer,
  salvageDeal,
  onAdClose,
}: ShopHeroPanelProps) {
  const showingAd = partsDealer != null || salvageDeal != null;

  useEffect(() => {
    if (!showingAd || !onAdClose) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onAdClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showingAd, onAdClose]);

  return (
    <div className={`relative overflow-hidden ${shopMainContentShellClass} ${className}`}>
      {loading ? (
        <div className="absolute inset-0 animate-pulse">
          <Skeleton className="h-full w-full rounded-none" pulse={false} />
          <div className="absolute bottom-8 right-4 max-w-xs space-y-2 sm:right-8">
            <div className="h-4 w-48 rounded bg-gray-300" />
            <div className="h-4 w-36 rounded bg-gray-300" />
            <div className="h-4 w-44 rounded bg-gray-300" />
          </div>
        </div>
      ) : (
        <>
          <img
            src={PORTAL_HOME_HERO_IMAGE}
            alt="AutoDaddy hero"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {showingAd ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
              <div
                className={`${shopHeroOpaqueSurfaceClass} max-h-full w-full max-w-lg overflow-y-auto rounded-lg border border-white/70 bg-ad-glass p-5 shadow-lg`}
              >
                <ShopAdDetailContent
                  partsDealer={partsDealer}
                  salvageDeal={salvageDeal}
                  onClose={onAdClose}
                />
              </div>
            </div>
          ) : thoughtOfTheDay ? (
            <ThoughtOfTheDayCard text={thoughtOfTheDay} />
          ) : null}
        </>
      )}
    </div>
  );
}
