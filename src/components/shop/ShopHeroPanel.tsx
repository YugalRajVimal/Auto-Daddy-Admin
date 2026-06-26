import { PORTAL_HOME_HERO_IMAGE } from "../../lib/portalHeroImage";
import { Skeleton } from "../common/Skeleton";
import { ThoughtOfTheDayCard } from "../portal/ThoughtOfTheDayCard";

type ShopHeroPanelProps = {
  thoughtOfTheDay?: string;
  loading?: boolean;
  className?: string;
};

export default function ShopHeroPanel({ thoughtOfTheDay, loading, className = "" }: ShopHeroPanelProps) {
  return (
    <div
      className={`relative min-h-[420px] flex-1 overflow-hidden lg:min-h-[calc(100vh-220px)] ${className}`}
    >
      {loading ? (
        <div className="absolute inset-0 min-h-[420px] animate-pulse">
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

          {thoughtOfTheDay ? <ThoughtOfTheDayCard text={thoughtOfTheDay} /> : null}
        </>
      )}
    </div>
  );
}
