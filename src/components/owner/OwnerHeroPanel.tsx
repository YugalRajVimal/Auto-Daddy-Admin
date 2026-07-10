import { useEffect } from "react";
import { PORTAL_HOME_HERO_IMAGE } from "../../lib/portalHeroImage";
import type { CarOwnerVehicle } from "../../lib/carOwnerVehicles";
import { Skeleton } from "../common/Skeleton";
import { ThoughtOfTheDayCard } from "../portal/ThoughtOfTheDayCard";
import OwnerDueServiceHero from "./OwnerDueServiceHero";
import { shopMainContentFillClass, shopMainContentShellClass } from "../shop/shopLayoutStyles";

type OwnerHeroPanelProps = {
  thoughtOfTheDay?: string;
  thoughtOfTheDayLiked?: boolean;
  thoughtLikeBusy?: boolean;
  onToggleThoughtLike?: () => void;
  loading?: boolean;
  className?: string;
  showDueService?: boolean;
  vehicles?: CarOwnerVehicle[];
  vehiclesLoading?: boolean;
  vehiclesError?: string | null;
  onDueServiceClose?: () => void;
};

export default function OwnerHeroPanel({
  thoughtOfTheDay,
  thoughtOfTheDayLiked,
  thoughtLikeBusy,
  onToggleThoughtLike,
  loading,
  className = "",
  showDueService = false,
  vehicles = [],
  vehiclesLoading,
  vehiclesError,
  onDueServiceClose,
}: OwnerHeroPanelProps) {
  useEffect(() => {
    if (!showDueService || !onDueServiceClose) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDueServiceClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showDueService, onDueServiceClose]);

  return (
    <div
      className={`relative overflow-hidden ${shopMainContentShellClass} ${shopMainContentFillClass} ${className}`}
    >
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

          {showDueService ? (
            <OwnerDueServiceHero
              vehicles={vehicles}
              loading={vehiclesLoading}
              error={vehiclesError}
              onClose={onDueServiceClose}
            />
          ) : thoughtOfTheDay ? (
            <ThoughtOfTheDayCard
              text={thoughtOfTheDay}
              liked={thoughtOfTheDayLiked}
              likeBusy={thoughtLikeBusy}
              onToggleLike={onToggleThoughtLike}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
