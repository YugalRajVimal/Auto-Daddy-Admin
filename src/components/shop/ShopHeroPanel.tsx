import { useEffect } from "react";
import type { PartsDealerCard } from "../../hooks/usePartsDealers";
import type { ThoughtOfTheDayView } from "../../lib/extractThought";
import type { SalvageDeal } from "../../lib/dummySalvageDeals";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import { PORTAL_HOME_HERO_IMAGE } from "../../lib/portalHeroImage";
import { Skeleton } from "../common/Skeleton";
import { ThoughtOfTheDayCard } from "../portal/ThoughtOfTheDayCard";
import ShopAdDetailContent from "./ShopAdDetailContent";
import ShopMenuDetailContent from "./ShopMenuDetailContent";
import { shopHeroOpaqueSurfaceClass, shopMainContentShellClass } from "./shopLayoutStyles";

type ShopHeroPanelProps = {
  thoughtOfTheDay?: ThoughtOfTheDayView | string;
  loading?: boolean;
  className?: string;
  partsDealer?: PartsDealerCard | null;
  salvageDeal?: SalvageDeal | null;
  menuOpen?: boolean;
  onAdClose?: () => void;
  onMenuClose?: () => void;
};

export default function ShopHeroPanel({
  thoughtOfTheDay,
  loading,
  className = "",
  partsDealer,
  salvageDeal,
  menuOpen = false,
  onAdClose,
  onMenuClose,
}: ShopHeroPanelProps) {
  const showingAd = partsDealer != null || salvageDeal != null;
  const showingOverlay = showingAd || menuOpen;
  const handleOverlayClose = showingAd ? onAdClose : onMenuClose;
  const thoughtTitle =
    typeof thoughtOfTheDay === "string" ? "" : thoughtOfTheDay?.title?.trim() || "";
  const thoughtDescription =
    typeof thoughtOfTheDay === "string"
      ? thoughtOfTheDay.trim()
      : thoughtOfTheDay?.description?.trim() || "";
  const hasThought = Boolean(thoughtTitle || thoughtDescription);
  const thoughtImage =
    typeof thoughtOfTheDay === "string"
      ? null
      : normalizeMediaUrl(thoughtOfTheDay?.image ?? null);
  const heroSrc = thoughtImage || PORTAL_HOME_HERO_IMAGE;

  useEffect(() => {
    if (!showingOverlay || !handleOverlayClose) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleOverlayClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showingOverlay, handleOverlayClose]);

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
            src={heroSrc}
            alt="AutoDaddy hero"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {showingOverlay ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
              <div
                className={`${shopHeroOpaqueSurfaceClass} max-h-full w-full max-w-lg overflow-y-auto rounded-lg border border-gray-200 bg-white p-5 shadow-lg`}
              >
                {showingAd ? (
                  <ShopAdDetailContent
                    partsDealer={partsDealer}
                    salvageDeal={salvageDeal}
                    onClose={onAdClose}
                  />
                ) : (
                  <ShopMenuDetailContent onClose={onMenuClose} />
                )}
              </div>
            </div>
          ) : hasThought ? (
            <ThoughtOfTheDayCard title={thoughtTitle} description={thoughtDescription} />
          ) : null}
        </>
      )}
    </div>
  );
}
