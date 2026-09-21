import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useCallback, useEffect, useState, type ComponentType } from "react";
import { useNavigate } from "react-router";
import {
  FiArrowLeft,
  FiArrowRight,
  FiAward,
  FiBarChart2,
  FiCpu,
  FiDollarSign,
  FiGlobe,
  FiHeart,
  FiMonitor,
  FiShoppingBag,
  FiSmartphone,
  FiSmile,
  FiTrendingUp,
  FiStar,
  FiUsers,
  FiWifi,
  FiZap,
} from "react-icons/fi";

/**
 * Intro slides shown to auto-shop owners right after they sign in.
 * "Proceed" steps through the slides; the last one lands on the shop home.
 */

const WEBSITE_URL = "https://autodaddy.ca";
const SHOP_HOME = "/shop";

type Feature = { label: string; icon: ComponentType<{ className?: string }> };

type Slide = {
  eyebrow: string;
  headline: string;
  tagline: string;
  visual: "tires" | "mascot";
  features: Feature[];
};

const SLIDES: Slide[] = [
  {
    eyebrow: "Are you winter ready?",
    headline: "Tire change season ahead",
    tagline: "A commitment that matters…",
    visual: "tires",
    features: [
      { label: "A profit-linked system", icon: FiTrendingUp },
      { label: "List your abilities digitally", icon: FiMonitor },
      { label: "Build your own community", icon: FiUsers },
      { label: "Priority over other metrics", icon: FiAward },
      { label: "More value, less stress", icon: FiSmile },
    ],
  },
  {
    eyebrow: "A digital bridge between you and your customers",
    headline: "Full control of your brand",
    tagline: "One tap from job card to invoice",
    visual: "mascot",
    features: [
      { label: "Your own mobile app", icon: FiSmartphone },
      { label: "Your business website", icon: FiGlobe },
      { label: "Your happy customers", icon: FiHeart },
      { label: "AI-powered support desk", icon: FiCpu },
      { label: "Anywhere · Anytime · Any device", icon: FiWifi },
    ],
  },
  {
    eyebrow: "With AutoDaddy you're choosing a standard of excellence",
    headline: "Where possibilities begin…",
    tagline: "A professional interface, just like a dealership",
    visual: "mascot",
    features: [
      { label: "Instant connect with clients", icon: FiZap },
      { label: "National and local marketplace", icon: FiShoppingBag },
      { label: "Turn your salvage into cash", icon: FiDollarSign },
      { label: "Feel the power of your website", icon: FiStar },
      { label: "Instant overview of customers", icon: FiBarChart2 },
    ],
  },
];


const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 80 : -80 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -80 : 80 }),
};

function SlideVisual({ slide }: { slide: Slide }) {
  if (slide.visual === "tires") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
        className="relative w-full overflow-hidden rounded-2xl shadow-[0_20px_40px_-18px_rgba(30,60,90,0.55)] ring-1 ring-white/70"
      >
        <img
          src="/images/shop/welcome/winter-tires.jpg"
          alt="A set of winter tires"
          className="aspect-[2.35/1] w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-sky-900/25 via-transparent to-white/10" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-sky-800 shadow-sm backdrop-blur">
          <span aria-hidden>❄</span> Winter season
        </span>
      </motion.div>
    );
  }

  return (
    <div className="relative flex w-full items-center justify-center">
      <div className="absolute inset-x-8 bottom-2 h-6 rounded-[50%] bg-amber-900/15 blur-md" />
      <motion.img
        src="/images/shop/welcome/mascot.png"
        alt="AutoDaddy mascot holding a phone with the AutoDaddy app"
        className="relative w-[78%] max-w-[340px] drop-shadow-[0_18px_22px_rgba(120,60,10,0.25)]"
        initial={{ opacity: 0, y: 24, rotate: -4 }}
        animate={{ opacity: 1, y: [0, -8, 0], rotate: 0 }}
        transition={{
          opacity: { duration: 0.5 },
          rotate: { duration: 0.6 },
          y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.6 },
        }}
      />
    </div>
  );
}

export default function ShopWelcomeSlidesPage() {
  const navigate = useNavigate();
  const [[index, direction], setPage] = useState<[number, number]>([0, 0]);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const finish = useCallback(() => navigate(SHOP_HOME, { replace: true }), [navigate]);

  const go = useCallback(
    (next: number) => {
      if (next < 0) return;
      if (next >= SLIDES.length) {
        finish();
        return;
      }
      setPage(([cur]) => [next, next > cur ? 1 : -1]);
    },
    [finish]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, finish]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -70) go(index + 1);
    else if (info.offset.x > 70) go(index - 1);
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[radial-gradient(circle_at_12%_8%,#fff7d6_0%,transparent_45%),radial-gradient(circle_at_90%_90%,#dff5dc_0%,transparent_50%),linear-gradient(180deg,#f7f8f3_0%,#eef2ea_100%)] font-outfit text-gray-900">
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-5 sm:px-8 sm:py-8">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4">
          <img src="/logo.png" alt="AutoDaddy" className="h-9 w-auto max-w-[220px] object-contain sm:h-11" />
          <button
            type="button"
            onClick={finish}
            className="rounded-full px-4 py-2 text-sm font-semibold text-gray-500 transition hover:bg-white hover:text-gray-800"
          >
            Skip intro
          </button>
        </header>

        {/* Slide */}
        <main className="relative mt-5 flex flex-1 items-center sm:mt-8">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.section
              key={index}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={onDragEnd}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${SLIDES.length}`}
              className="w-full cursor-grab overflow-hidden rounded-[28px] bg-white shadow-[0_30px_70px_-30px_rgba(20,50,20,0.35)] ring-1 ring-black/5 active:cursor-grabbing"
            >
              {/* Eyebrow banner */}
              <div className="bg-gradient-to-r from-ad-green-dark via-ad-green to-[#3fa23f] px-6 py-4 text-center sm:py-5">
                <h1 className="font-serif text-lg font-bold tracking-wide text-white sm:text-2xl lg:text-[28px]">
                  {slide.eyebrow}
                </h1>
              </div>

              <div className="grid md:grid-cols-[1fr_1.1fr]">
                {/* Visual side */}
                <div className="relative flex flex-col justify-between gap-6 overflow-hidden bg-gradient-to-br from-[#fffbe3] via-[#fff5cc] to-[#ffe9b0] p-6 sm:p-8">
                  <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/50 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-amber-200/40 blur-2xl" />
                  <div className="relative flex flex-1 items-center">
                    <SlideVisual slide={slide} />
                  </div>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    className="relative text-xl font-semibold leading-snug text-[#8a1c1c] sm:text-2xl"
                  >
                    {slide.tagline}
                  </motion.p>
                </div>

                {/* Features side */}
                <div className="p-6 sm:p-8 lg:p-10">
                  <h2 className="text-2xl font-extrabold italic text-ad-green sm:text-3xl lg:text-[34px]">
                    {slide.headline}
                  </h2>
                  <ul className="mt-6 space-y-3">
                    {slide.features.map((f, i) => {
                      const Icon = f.icon;
                      return (
                        <motion.li
                          key={f.label}
                          initial={{ opacity: 0, x: 24 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.12 + i * 0.07, duration: 0.35 }}
                          className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-3.5 transition hover:border-ad-green/30 hover:shadow-md"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ad-bg-green text-ad-green-dark transition group-hover:bg-ad-green group-hover:text-white">
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="text-base font-semibold text-gray-800 sm:text-lg">
                            {f.label}
                          </span>
                        </motion.li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </motion.section>
          </AnimatePresence>
        </main>

        {/* Footer navigation */}
        <footer className="sticky bottom-0 -mx-4 mt-4 flex items-center justify-between gap-3 bg-[#eef2ea]/85 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mt-8 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          {index === 0 ? (
            <a
              href={WEBSITE_URL}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2.5 text-sm font-bold text-ad-green-dark transition hover:bg-white sm:px-4 sm:text-base"
            >
              <FiArrowLeft className="h-4 w-4" />
              <span>
                Back<span className="hidden sm:inline"> to Website</span>
              </span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2.5 text-sm font-bold text-ad-green-dark transition hover:bg-white sm:px-4 sm:text-base"
            >
              <FiArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}

          <div className="flex items-center gap-2" role="tablist" aria-label="Slides">
            {SLIDES.map((s, i) => (
              <button
                key={s.headline}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => go(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-8 bg-ad-green" : "w-2.5 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(index + 1)}
            className="inline-flex items-center gap-2 rounded-full bg-ad-green px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(44,140,44,0.8)] transition hover:bg-ad-green-dark active:scale-[0.97] sm:px-7 sm:py-3 sm:text-base"
          >
            {isLast ? "Go to Dashboard" : "Proceed"}
            <FiArrowRight className="h-4 w-4" />
          </button>
        </footer>
      </div>
    </div>
  );
}
