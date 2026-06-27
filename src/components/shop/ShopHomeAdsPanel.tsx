import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { PartsDealerCard } from "../../hooks/usePartsDealers";
import { openPartsDealerLink } from "../../lib/shopPartsDealers";
import ShopDealerCard from "./ShopDealerCard";

const ROTATE_MS = 5000;
const CURTAIN_MS = 550;

const AD_MENU_BUTTON_IMAGE =
  "https://download.logo.wine/logo/Windows_7/Windows_7-Logo.wine.png";

const adMenuButtonClass =
  "flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-xl transition-opacity hover:opacity-80";

type SlideDirection = 1 | -1;

type ShopHomeAdsPanelProps = {
  partsDealers: PartsDealerCard[];
  loading?: boolean;
  onMenuClick?: () => void;
  /** Pauses carousel rotation while a hero overlay is shown (e.g. menu). */
  detailOpen?: boolean;
};

function curtainClass(index: number, activeIndex: number, leavingIndex: number | null, direction: SlideDirection): string {
  const base = "absolute inset-0";
  const isActive = index === activeIndex;
  const isLeaving = index === leavingIndex;

  if (isLeaving) {
    return `${base} z-20 ${direction === 1 ? "shop-ad-curtain-exit-up" : "shop-ad-curtain-exit-down"}`;
  }

  if (isActive) {
    if (leavingIndex !== null) {
      return `${base} z-10 ${direction === 1 ? "shop-ad-curtain-enter-up" : "shop-ad-curtain-enter-down"}`;
    }
    return `${base} z-10`;
  }

  return `${base} pointer-events-none z-0 opacity-0`;
}

function ShopAdMenuButton({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" aria-label="Ad menu" className={adMenuButtonClass} onClick={onClick}>
      <img
        src={AD_MENU_BUTTON_IMAGE}
        alt=""
        className="h-14 w-14 object-contain"
        loading="lazy"
        decoding="async"
        aria-hidden
      />
    </button>
  );
}

function ShopAdPanelShell({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-col">{children}</div>;
}

function ShopAdMenuSlot({ children }: { children: ReactNode }) {
  return <div className="flex shrink-0 justify-center py-2">{children}</div>;
}
function ShopAdCardSkeleton() {
  return (
    <div
      className="w-full animate-pulse overflow-hidden rounded-lg border border-gray-200/80 bg-white shadow-lg"
      aria-busy="true"
      aria-label="Loading ads"
    >
      <div className="aspect-[3/4] bg-gray-200" />
      <div className="h-9 bg-[#008000]/70" />
      <div className="space-y-2 px-3 py-3">
        <div className="h-7 rounded bg-[#d4ffd4]" />
        <div className="flex justify-center gap-3">
          <div className="h-5 w-5 rounded-full bg-gray-200" />
          <div className="h-5 w-5 rounded-full bg-gray-200" />
          <div className="h-5 w-5 rounded-full bg-gray-200" />
        </div>
        <div className="h-8 rounded border border-gray-200 bg-gray-100" />
      </div>
    </div>
  );
}

export default function ShopHomeAdsPanel({
  partsDealers,
  loading,
  onMenuClick,
  detailOpen = false,
}: ShopHomeAdsPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [leavingIndex, setLeavingIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<SlideDirection>(1);
  const [timerKey, setTimerKey] = useState(0);
  const [hovered, setHovered] = useState(false);
  const curtainTimerRef = useRef<number | null>(null);
  const transitioningRef = useRef(false);
  const activeIndexRef = useRef(0);

  const hasMultiple = partsDealers.length > 1;
  const activeDealer = partsDealers[activeIndex];
  const partsDealersKey = useMemo(
    () => partsDealers.map((dealer) => dealer.name).join("\0"),
    [partsDealers],
  );

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const clearCurtainTimer = useCallback(() => {
    if (curtainTimerRef.current !== null) {
      window.clearTimeout(curtainTimerRef.current);
      curtainTimerRef.current = null;
    }
    transitioningRef.current = false;
  }, []);

  const startCurtainTransition = useCallback(
    (current: number, next: number, dir: SlideDirection) => {
      if (current === next || transitioningRef.current) return false;

      clearCurtainTimer();
      transitioningRef.current = true;
      setDirection(dir);
      setLeavingIndex(current);
      setActiveIndex(next);
      curtainTimerRef.current = window.setTimeout(() => {
        setLeavingIndex(null);
        transitioningRef.current = false;
        curtainTimerRef.current = null;
      }, CURTAIN_MS);
      setTimerKey((key) => key + 1);
      return true;
    },
    [clearCurtainTimer],
  );

  const advance = useCallback(() => {
    if (partsDealers.length === 0 || transitioningRef.current) return;

    const current = activeIndexRef.current;
    const next = (current + 1) % partsDealers.length;

    if (current !== next) {
      startCurtainTransition(current, next, 1);
    }
  }, [partsDealers.length, startCurtainTransition]);

  useEffect(() => {
    clearCurtainTimer();
    setLeavingIndex(null);
    setActiveIndex(0);
    setDirection(1);
    setTimerKey((key) => key + 1);
  }, [clearCurtainTimer, partsDealersKey]);

  useEffect(() => () => clearCurtainTimer(), [clearCurtainTimer]);

  const paused = hovered || detailOpen || leavingIndex !== null;

  useEffect(() => {
    if (loading || paused || partsDealers.length === 0) return;

    const timer = window.setInterval(advance, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [advance, paused, partsDealers.length, loading, timerKey]);

  const handleAdClick = (dealer: PartsDealerCard) => {
    openPartsDealerLink(dealer);
  };

  if (loading) {
    return (
      <ShopAdPanelShell>
        <ShopAdCardSkeleton />
        <ShopAdMenuSlot>
          <ShopAdMenuButton onClick={onMenuClick} />
        </ShopAdMenuSlot>
      </ShopAdPanelShell>
    );
  }

  if (partsDealers.length === 0 || !activeDealer) {
    return null;
  }

  return (
    <ShopAdPanelShell>
      <div
        className="relative w-full shrink-0"
        aria-live="polite"
        aria-atomic="true"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="pointer-events-none invisible" aria-hidden="true">
          <ShopDealerCard
            name={activeDealer.name}
            phone={activeDealer.phone}
            imageUrl={activeDealer.imageUrl}
            city={activeDealer.city}
            website={activeDealer.website}
            specialty={activeDealer.specialty}
          />
        </div>

        <div className="absolute inset-0 overflow-hidden rounded-lg">
          {partsDealers.map((dealer, index) => (
            <div
              key={`${dealer.name}-${index}`}
              className={curtainClass(index, activeIndex, leavingIndex, direction)}
              aria-hidden={index !== activeIndex}
            >
              <ShopDealerCard
                name={dealer.name}
                phone={dealer.phone}
                imageUrl={dealer.imageUrl}
                city={dealer.city}
                website={dealer.website}
                specialty={dealer.specialty}
                onClick={() => handleAdClick(dealer)}
              />
            </div>
          ))}
        </div>

        {hasMultiple ? (
          <div className="pointer-events-none absolute left-0 right-0 top-2 z-30 flex justify-center gap-1.5">
            {partsDealers.map((dealer, index) => (
              <span
                key={`dot-${dealer.name}-${index}`}
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${index === activeIndex ? "bg-white" : "bg-white/45"
                  }`}
                aria-hidden
              />
            ))}
          </div>
        ) : null}
      </div>

      <ShopAdMenuSlot>
        <ShopAdMenuButton onClick={onMenuClick} />
      </ShopAdMenuSlot>
    </ShopAdPanelShell>
  );
}
