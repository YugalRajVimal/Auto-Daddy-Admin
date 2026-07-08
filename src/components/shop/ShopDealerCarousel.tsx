import { useCallback, useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { PartsDealerCard } from "../../hooks/usePartsDealers";
import ShopDealerCard from "./ShopDealerCard";

const ROTATE_MS = 5000;

type ShopDealerCarouselProps = {
  dealers: PartsDealerCard[];
  loading?: boolean;
};

const navButtonClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#006600] bg-white text-[#006600] transition-colors hover:bg-[#DFFFD6] disabled:cursor-not-allowed disabled:opacity-40";

export default function ShopDealerCarousel({ dealers, loading }: ShopDealerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [timerKey, setTimerKey] = useState(0);

  const hasMultiple = dealers.length > 1;

  const goPrevious = useCallback(() => {
    setActiveIndex((current) => (current - 1 + dealers.length) % dealers.length);
    setTimerKey((key) => key + 1);
  }, [dealers.length]);

  const goNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % dealers.length);
    setTimerKey((key) => key + 1);
  }, [dealers.length]);

  useEffect(() => {
    setActiveIndex(0);
    setTimerKey((key) => key + 1);
  }, [dealers]);

  useEffect(() => {
    if (!hasMultiple) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % dealers.length);
    }, ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [dealers.length, hasMultiple, timerKey]);

  if (loading) {
    return <p className="text-xs text-gray-500">Loading…</p>;
  }

  if (dealers.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="relative aspect-square w-full" aria-live="polite" aria-atomic="true">
        {dealers.map((dealer, index) => {
          const visible = index === activeIndex;

          return (
            <div
              key={`${dealer.name}-${index}`}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                visible ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
              }`}
              aria-hidden={!visible}
            >
              <ShopDealerCard name={dealer.name} phone={dealer.phone} imageUrl={dealer.imageUrl} />
            </div>
          );
        })}

        {hasMultiple ? (
          <div className="pointer-events-none absolute left-0 right-0 top-2 z-20 flex justify-center gap-1.5">
            {dealers.map((dealer, index) => (
              <span
                key={`dot-${dealer.name}-${index}`}
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                  index === activeIndex ? "bg-white" : "bg-white/45"
                }`}
                aria-hidden
              />
            ))}
          </div>
        ) : null}
      </div>

      {hasMultiple ? (
        <div className="flex items-center justify-center gap-3">
          <button type="button" onClick={goPrevious} aria-label="Previous ad" className={navButtonClass}>
            <FiChevronLeft className="text-xl" aria-hidden />
          </button>
          <span className="min-w-[3rem] text-center text-xs font-semibold text-[#006600]">
            {activeIndex + 1} / {dealers.length}
          </span>
          <button type="button" onClick={goNext} aria-label="Next ad" className={navButtonClass}>
            <FiChevronRight className="text-xl" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
