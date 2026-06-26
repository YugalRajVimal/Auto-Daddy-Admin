import type { ReactNode } from "react";
import { PORTAL_PROFILE_HERO_IMAGE } from "../../lib/portalHeroImage";

type ShopProfileHeroPanelProps = {
  children: ReactNode;
  className?: string;
};

export default function ShopProfileHeroPanel({ children, className = "" }: ShopProfileHeroPanelProps) {
  return (
    <div
      className={`relative min-h-[420px] flex-1 overflow-hidden lg:min-h-[calc(100vh-220px)] ${className}`}
    >
      <img
        src={PORTAL_PROFILE_HERO_IMAGE}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="relative z-10 flex min-h-full flex-col justify-center p-3 sm:p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}
