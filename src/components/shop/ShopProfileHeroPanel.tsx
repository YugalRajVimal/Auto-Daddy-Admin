import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { PORTAL_PROFILE_HERO_IMAGE } from "../../lib/portalHeroImage";
import {
  shopHeroCardFlushPaddingClass,
  shopHeroCardImageClass,
  shopHeroCardPaddingClass,
  shopMainContentShellClass,
} from "./shopLayoutStyles";

const layoutEase = [0.4, 0, 0.2, 1] as const;

type ShopProfileHeroPanelProps = {
  children: ReactNode;
  className?: string;
  /** When false, renders a plain white card without the decorative background image. */
  showBackgroundImage?: boolean;
  /** Plain card without background image; modest padding, transparent fill. */
  flush?: boolean;
  /** Transparent shell fill while keeping border/background image behaviour. */
  transparent?: boolean;
};

export default function ShopProfileHeroPanel({
  children,
  className = "",
  showBackgroundImage = true,
  flush = false,
  transparent = false,
}: ShopProfileHeroPanelProps) {
  const shellClass = flush || transparent
    ? "border border-gray-400 bg-transparent"
    : "border border-gray-300 bg-white";

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: layoutEase } }}
      className={`shop-hero-card relative overflow-hidden ${shellClass} ${shopMainContentShellClass} ${className}`}
    >
      {showBackgroundImage && !flush ? (
        <img
          src={PORTAL_PROFILE_HERO_IMAGE}
          alt=""
          className={shopHeroCardImageClass}
        />
      ) : null}
      <div
        className={`relative z-10 flex h-full min-h-0 flex-col overflow-hidden ${flush ? shopHeroCardFlushPaddingClass : shopHeroCardPaddingClass}`}
      >
        {children}
      </div>
    </motion.div>
  );
}
