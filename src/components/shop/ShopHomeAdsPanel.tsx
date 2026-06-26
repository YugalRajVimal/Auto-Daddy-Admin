import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PartsDealerCard } from "../../hooks/usePartsDealers";
import { DUMMY_SALVAGE_DEALS, type SalvageDeal } from "../../lib/dummySalvageDeals";
import ShopAdDetailDialog from "./ShopAdDetailDialog";
import ShopDealerCard from "./ShopDealerCard";
import ShopSalvageCard from "./ShopSalvageCard";

const ROTATE_MS = 5000;
const CURTAIN_MS = 550;

export type ShopAdPhase = "parts" | "salvage";
type SlideDirection = 1 | -1;

type ShopHomeAdsPanelProps = {
  partsDealers: PartsDealerCard[];
  loading?: boolean;
  salvageDeals?: SalvageDeal[];
  onPhaseChange?: (phase: ShopAdPhase) => void;
  onPartsDealerSelect?: (dealer: PartsDealerCard) => void;
  onSalvageDealSelect?: (deal: SalvageDeal) => void;
  /** Pauses carousel rotation while ad detail is shown elsewhere (e.g. hero card). */
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

export default function ShopHomeAdsPanel({
  partsDealers,
  loading,
  salvageDeals = DUMMY_SALVAGE_DEALS,
  onPhaseChange,
  onPartsDealerSelect,
  onSalvageDealSelect,
  detailOpen = false,
}: ShopHomeAdsPanelProps) {
  const useExternalDetail = onPartsDealerSelect != null || onSalvageDealSelect != null;
  const [phase, setPhase] = useState<ShopAdPhase>("parts");
  const [activeIndex, setActiveIndex] = useState(0);
  const [leavingIndex, setLeavingIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<SlideDirection>(1);
  const [timerKey, setTimerKey] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPartsDealer, setSelectedPartsDealer] = useState<PartsDealerCard | null>(null);
  const [selectedSalvageDeal, setSelectedSalvageDeal] = useState<SalvageDeal | null>(null);
  const [visitedParts, setVisitedParts] = useState<Set<number>>(() => new Set());
  const [visitedSalvage, setVisitedSalvage] = useState<Set<number>>(() => new Set());
  const curtainTimerRef = useRef<number | null>(null);
  const transitioningRef = useRef(false);
  const activeIndexRef = useRef(0);
  const visitedPartsRef = useRef(visitedParts);
  const visitedSalvageRef = useRef(visitedSalvage);

  const items = phase === "parts" ? partsDealers : salvageDeals;
  const hasMultiple = items.length > 1;
  const partsDealersKey = useMemo(
    () => partsDealers.map((dealer) => dealer.name).join("\0"),
    [partsDealers],
  );

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    visitedPartsRef.current = visitedParts;
  }, [visitedParts]);

  useEffect(() => {
    visitedSalvageRef.current = visitedSalvage;
  }, [visitedSalvage]);

  const clearCurtainTimer = useCallback(() => {
    if (curtainTimerRef.current !== null) {
      window.clearTimeout(curtainTimerRef.current);
      curtainTimerRef.current = null;
    }
    transitioningRef.current = false;
  }, []);

  const switchToParts = useCallback(() => {
    clearCurtainTimer();
    setLeavingIndex(null);
    setPhase("parts");
    setActiveIndex(0);
    setDirection(1);
    setVisitedParts(new Set());
    setVisitedSalvage(new Set());
    setTimerKey((key) => key + 1);
    onPhaseChange?.("parts");
  }, [clearCurtainTimer, onPhaseChange]);

  const switchToSalvage = useCallback(() => {
    clearCurtainTimer();
    setLeavingIndex(null);
    setPhase("salvage");
    setActiveIndex(0);
    setDirection(1);
    setVisitedSalvage(new Set());
    setTimerKey((key) => key + 1);
    onPhaseChange?.("salvage");
  }, [clearCurtainTimer, onPhaseChange]);

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
    if (items.length === 0 || transitioningRef.current) return;

    const current = activeIndexRef.current;
    const next = (current + 1) % items.length;

    if (phase === "parts" && partsDealers.length > 0) {
      const updated = new Set(visitedPartsRef.current);
      updated.add(current);
      visitedPartsRef.current = updated;
      setVisitedParts(updated);
      if (updated.size >= partsDealers.length && next === 0) {
        switchToSalvage();
        return;
      }
    }

    if (phase === "salvage" && salvageDeals.length > 0) {
      const updated = new Set(visitedSalvageRef.current);
      updated.add(current);
      visitedSalvageRef.current = updated;
      setVisitedSalvage(updated);
      if (updated.size >= salvageDeals.length && next === 0) {
        switchToParts();
        return;
      }
    }

    if (current !== next) {
      startCurtainTransition(current, next, 1);
    }
  }, [items.length, partsDealers.length, phase, salvageDeals.length, startCurtainTransition, switchToParts, switchToSalvage]);

  useEffect(() => {
    clearCurtainTimer();
    setLeavingIndex(null);
    setPhase("parts");
    setActiveIndex(0);
    setDirection(1);
    setVisitedParts(new Set());
    setVisitedSalvage(new Set());
    setTimerKey((key) => key + 1);
    onPhaseChange?.("parts");
  }, [clearCurtainTimer, partsDealersKey, onPhaseChange]);

  useEffect(() => () => clearCurtainTimer(), [clearCurtainTimer]);

  const paused = hovered || dialogOpen || detailOpen || leavingIndex !== null;

  useEffect(() => {
    if (loading || paused || items.length === 0) return;

    const timer = window.setInterval(advance, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [advance, paused, items.length, loading, timerKey]);

  const openPartsDialog = (dealer: PartsDealerCard) => {
    if (onPartsDealerSelect) {
      onPartsDealerSelect(dealer);
      return;
    }
    setSelectedSalvageDeal(null);
    setSelectedPartsDealer(dealer);
    setDialogOpen(true);
  };

  const openSalvageDialog = (deal: SalvageDeal) => {
    if (onSalvageDealSelect) {
      onSalvageDealSelect(deal);
      return;
    }
    setSelectedPartsDealer(null);
    setSelectedSalvageDeal(deal);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedPartsDealer(null);
    setSelectedSalvageDeal(null);
  };

  if (loading) {
    return (
      <div
        className="min-h-[360px] w-full animate-pulse space-y-3 rounded-lg border border-gray-200/80 bg-white p-4 shadow-lg"
        aria-busy="true"
        aria-label="Loading ads"
      >
        <div className="h-40 w-full rounded-lg bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-4 w-1/2 rounded bg-gray-200" />
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <div
          className="relative min-h-[360px] w-full overflow-hidden"
          aria-live="polite"
          aria-atomic="true"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div key={phase} className="relative min-h-[360px] w-full">
            {phase === "parts"
              ? partsDealers.map((dealer, index) => (
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
                      onClick={() => openPartsDialog(dealer)}
                    />
                  </div>
                ))
              : salvageDeals.map((deal, index) => (
                  <div
                    key={deal.id}
                    className={curtainClass(index, activeIndex, leavingIndex, direction)}
                    aria-hidden={index !== activeIndex}
                  >
                    <ShopSalvageCard
                      partName={deal.partName}
                      company={deal.company}
                      price={deal.price}
                      imageUrl={deal.imageUrl}
                      year={deal.year}
                      onClick={() => openSalvageDialog(deal)}
                    />
                  </div>
                ))}
          </div>

          {hasMultiple ? (
            <div className="pointer-events-none absolute left-0 right-0 top-2 z-30 flex justify-center gap-1.5">
              {items.map((item, index) => (
                <span
                  key={
                    phase === "parts"
                      ? `dot-${(item as PartsDealerCard).name}-${index}`
                      : (item as SalvageDeal).id
                  }
                  className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                    index === activeIndex ? "bg-white" : "bg-white/45"
                  }`}
                  aria-hidden
                />
              ))}
            </div>
          ) : null}
      </div>

      {useExternalDetail ? null : (
        <ShopAdDetailDialog
          open={dialogOpen}
          onClose={closeDialog}
          partsDealer={selectedPartsDealer}
          salvageDeal={selectedSalvageDeal}
        />
      )}
    </>
  );
}
