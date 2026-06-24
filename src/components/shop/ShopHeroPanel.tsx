import { PORTAL_HOME_HERO_IMAGE } from "../../lib/portalHeroImage";
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
        <div className="flex h-full min-h-[420px] items-center justify-center bg-[#ececec]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
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
