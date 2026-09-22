import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { usePartsDealers } from "../../hooks/usePartsDealers";
import { useShopDeals } from "../../hooks/useShopDeals";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import { isDealSold } from "../../lib/shopDealSales";
import { dealId, shopDealDiscountLabel } from "../../lib/shopOwnerParsers";
import { openPartsDealerLink } from "../../lib/shopPartsDealers";
import type { ShopDeal } from "../../types/shopOwner";
import ShopDealerAdCard from "./ShopDealerAdCard";
import { ShopDealerAdCardSkeleton } from "./ShopDealerSkeletons";
import { shopPanelShellClass } from "./shopLayoutStyles";

const ROTATE_MS = 5000;
const CURTAIN_MS = 550;

type SlideDirection = 1 | -1;

type AdsTab = "ads" | "onboard";

const ADS_TABS: { id: AdsTab; label: string }[] = [
  { id: "ads", label: "Ads" },
  { id: "onboard", label: "Onboard" },
];

/** One card in the rotating ad column — a dealer ad or one of the shop's own deals. */
type AdSlide = {
  key: string;
  imageUrl?: string;
  title: string;
  location: string;
  phone?: string;
  website?: string;
  tagline: string;
  onClick: () => void;
};

type ShopHomeAdsPanelProps = {
  /** Pauses carousel rotation while a hero overlay is shown (e.g. menu). */
  detailOpen?: boolean;
};

function shopDealTitle(deal: ShopDeal): string {
  return (
    deal.partName?.trim() ||
    deal.subServiceName?.trim() ||
    deal.productName?.trim() ||
    deal.service?.name?.trim() ||
    "Deal"
  );
}

function shopDealImage(deal: ShopDeal): string | undefined {
  const first = deal.dealImages?.find(Boolean) ?? deal.dealImage ?? deal.productImage;
  return normalizeMediaUrl(first ?? null) ?? undefined;
}

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

function ShopAdsTabs({ active, onSelect }: { active: AdsTab; onSelect: (tab: AdsTab) => void }) {
  return (
    <div role="tablist" aria-label="Ads" className="mb-2 grid shrink-0 grid-cols-2 gap-1.5 rounded-lg bg-gray-100 p-1">
      {ADS_TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(tab.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-bold transition-colors ${
              selected ? "bg-ad-purple text-white shadow-sm" : "text-ad-purple hover:bg-white"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function ShopAdPanelShell({ children, tabs }: { children: ReactNode; tabs: ReactNode }) {
  return (
    <div className={`${shopPanelShellClass} min-h-0 border border-gray-200 bg-white/85 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)]`}>
      {tabs}
      {children}
    </div>
  );
}

function ShopAdPanelPlaceholder({ loading, tab }: { loading: boolean; tab: AdsTab }) {
  const what = tab === "ads" ? "dealer ads" : "deals";
  return (
    <div
      className="relative min-h-0 flex-1 overflow-hidden"
      aria-busy={loading}
      aria-label={loading ? `Loading ${what}` : `No ${what} yet`}
    >
      <ShopDealerAdCardSkeleton pulse={loading} className="h-full min-h-0" />
      {!loading && tab === "onboard" ? (
        <p className="absolute inset-x-3 top-1/3 rounded-lg bg-white/90 px-3 py-2 text-center text-sm font-semibold text-gray-600 shadow-sm">
          No deals onboarded yet.
        </p>
      ) : null}
    </div>
  );
}

/** Left column on shop pages: rotating dealer ads ("Ads") or the shop's own deals ("Onboard"). */
export default function ShopHomeAdsPanel({ detailOpen = false }: ShopHomeAdsPanelProps) {
  const navigate = useNavigate();
  const { business } = useShopOwnerPortal();
  const { dealers, loading: dealersLoading } = usePartsDealers();
  const { allDeals, loading: dealsLoading } = useShopDeals();
  const [tab, setTab] = useState<AdsTab>("ads");

  const slides = useMemo<AdSlide[]>(() => {
    if (tab === "ads") {
      return dealers.map((dealer, index) => ({
        key: `dealer-${dealer.name}-${index}`,
        imageUrl: dealer.imageUrl,
        title: dealer.name || "—",
        location: dealer.city?.trim() || "Mississauga",
        phone: dealer.phone,
        website: dealer.website,
        tagline: dealer.specialty?.trim() || "Aftermarket Spares Specialist",
        onClick: () => openPartsDealerLink(dealer),
      }));
    }
    return allDeals
      .filter((deal) => deal.dealEnabled !== false && !isDealSold(deal))
      .map((deal, index) => ({
        key: `deal-${dealId(deal) || index}`,
        imageUrl: shopDealImage(deal),
        title: shopDealTitle(deal),
        location: business?.city?.trim() || business?.businessName?.trim() || "",
        phone: business?.businessPhone,
        tagline: deal.description?.trim() || shopDealDiscountLabel(deal, "") || "Special offer",
        onClick: () => navigate("/shop/deals"),
      }));
  }, [tab, dealers, allDeals, business, navigate]);
  const loading = tab === "ads" ? dealersLoading : dealsLoading;
  const [activeIndex, setActiveIndex] = useState(0);
  const [leavingIndex, setLeavingIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<SlideDirection>(1);
  const [timerKey, setTimerKey] = useState(0);
  const [hovered, setHovered] = useState(false);
  const curtainTimerRef = useRef<number | null>(null);
  const transitioningRef = useRef(false);
  const activeIndexRef = useRef(0);

  const hasMultiple = slides.length > 1;
  const activeSlide = slides[activeIndex];
  const slidesKey = useMemo(() => slides.map((slide) => slide.key).join("\0"), [slides]);

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
    if (slides.length === 0 || transitioningRef.current) return;

    const current = activeIndexRef.current;
    const next = (current + 1) % slides.length;

    if (current !== next) {
      startCurtainTransition(current, next, 1);
    }
  }, [slides.length, startCurtainTransition]);

  useEffect(() => {
    clearCurtainTimer();
    setLeavingIndex(null);
    setActiveIndex(0);
    setDirection(1);
    setTimerKey((key) => key + 1);
  }, [clearCurtainTimer, slidesKey]);

  useEffect(() => () => clearCurtainTimer(), [clearCurtainTimer]);

  const paused = hovered || detailOpen || leavingIndex !== null;

  useEffect(() => {
    if (loading || paused || slides.length === 0) return;

    const timer = window.setInterval(advance, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [advance, paused, slides.length, loading, timerKey]);

  const tabs = <ShopAdsTabs active={tab} onSelect={setTab} />;

  if (loading || slides.length === 0 || !activeSlide) {
    return (
      <ShopAdPanelShell tabs={tabs}>
        <ShopAdPanelPlaceholder loading={Boolean(loading)} tab={tab} />
      </ShopAdPanelShell>
    );
  }

  return (
    <ShopAdPanelShell tabs={tabs}>
      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        aria-live="polite"
        aria-atomic="true"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative h-full w-full">
          {slides.map((slide, index) => (
            <div
              key={slide.key}
              className={curtainClass(index, activeIndex, leavingIndex, direction)}
              aria-hidden={index !== activeIndex}
            >
              <ShopDealerAdCard
                imageUrl={slide.imageUrl}
                imageAlt={slide.title}
                title={slide.title}
                location={slide.location}
                phone={slide.phone}
                website={slide.website}
                tagline={slide.tagline}
                className="h-full"
                onClick={slide.onClick}
              />
            </div>
          ))}
        </div>

        {hasMultiple ? (
          <div className="pointer-events-none absolute left-0 right-0 top-2 z-30 flex justify-center gap-1.5">
            {slides.map((slide, index) => (
              <span
                key={`dot-${slide.key}`}
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                  index === activeIndex ? "bg-white" : "bg-white/45"
                }`}
                aria-hidden
              />
            ))}
          </div>
        ) : null}
      </div>
    </ShopAdPanelShell>
  );
}
