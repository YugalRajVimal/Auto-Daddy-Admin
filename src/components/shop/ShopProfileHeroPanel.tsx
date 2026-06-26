import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { PORTAL_PROFILE_HERO_IMAGE } from "../../lib/portalHeroImage";
import { shopHeroCardPaddingClass, shopMainContentShellClass } from "./shopLayoutStyles";

const layoutEase = [0.4, 0, 0.2, 1] as const;

type ShopProfileHeroPanelProps = {
  children: ReactNode;
  className?: string;
};

export default function ShopProfileHeroPanel({ children, className = "" }: ShopProfileHeroPanelProps) {
  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: layoutEase } }}
      className={`shop-hero-card relative overflow-hidden ${shopMainContentShellClass} ${className}`}
    >
      <img
        src={PORTAL_PROFILE_HERO_IMAGE}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className={`relative z-10 flex h-full min-h-0 flex-col overflow-hidden ${shopHeroCardPaddingClass}`}>
        {children}
      </div>
    </motion.div>
  );
}
