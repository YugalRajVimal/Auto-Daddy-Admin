import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { shopHeroCardPaddingClass, shopPanelShellClass } from "./shopLayoutStyles";

const layoutEase = [0.4, 0, 0.2, 1] as const;

type ShopProfileHeroPanelProps = {
  children: ReactNode;
  className?: string;
  /** Tighter inner padding for table / list sections. */
  flush?: boolean;
};

/** White main content card on shop pages. */
export default function ShopProfileHeroPanel({
  children,
  className = "",
  flush = false,
}: ShopProfileHeroPanelProps) {
  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: layoutEase } }}
      className={`shop-hero-card relative border border-gray-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.07)] ${shopPanelShellClass} ${className}`}
    >
      <div
        className={`relative z-10 flex h-full min-h-0 flex-col overflow-hidden ${flush ? "p-3 sm:p-4" : shopHeroCardPaddingClass}`}
      >
        {children}
      </div>
    </motion.div>
  );
}
