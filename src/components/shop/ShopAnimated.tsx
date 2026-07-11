import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";

const ease = [0.4, 0, 0.2, 1] as const;

export const FORM_REVEAL_FOCUS_DELAY_MS = 300;

export function focusFormRevealContainer(container: HTMLElement | null) {
  if (!container) return;
  container.scrollIntoView({ behavior: "smooth", block: "start" });
  const field = container.querySelector<HTMLElement>(
    'input:not([type="hidden"]):not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled])'
  );
  field?.focus({ preventScroll: true });
}

export function useFormRevealFocus(
  active: boolean,
  ref: RefObject<HTMLElement | null>,
  delayMs = FORM_REVEAL_FOCUS_DELAY_MS
) {
  useEffect(() => {
    if (!active) return;

    const timer = window.setTimeout(() => {
      focusFormRevealContainer(ref.current);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [active, delayMs, ref]);
}

/** Smooth expand/collapse for inline panels revealed by Add/Edit actions. */
export function ShopReveal({
  show,
  children,
  className = "",
  clipOverflow = true,
}: {
  show: boolean;
  children: ReactNode;
  className?: string;
  /** When false, child popovers/dropdowns can extend outside the animated shell. */
  clipOverflow?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFormRevealFocus(show, containerRef);

  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.div
          ref={containerRef}
          key="reveal"
          layout
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.28, ease, layout: { duration: 0.28, ease } }}
          className={`${clipOverflow ? "overflow-hidden" : "overflow-visible"} ${className}`}
        >
          <motion.div
            initial={{ y: -6 }}
            animate={{ y: 0 }}
            exit={{ y: -6 }}
            transition={{ duration: 0.28, ease }}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Crossfade + slide when swapping list ↔ form views. */
export function ShopViewTransition({
  viewKey,
  children,
  className = "",
  focusOnReveal = false,
}: {
  viewKey: string;
  children: ReactNode;
  className?: string;
  /** Scroll the new view into focus when it appears (e.g. add/edit form views). */
  focusOnReveal?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFormRevealFocus(focusOnReveal, containerRef);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        ref={containerRef}
        key={viewKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.24, ease }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** Animated modal shell for shop form dialogs. */
export function ShopDialogMotion({
  open,
  onClose,
  children,
  panelClassName = "",
  /** `top` pins the panel near the top of the viewport (FreshKhata-style). */
  placement = "center",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
  placement?: "center" | "top";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFormRevealFocus(open, panelRef, 220);
  const isTop = placement === "top";
  const enterY = isTop ? -10 : 12;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="dialog"
          className={
            isTop
              ? "fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 sm:pt-20 md:pt-24"
              : "fixed inset-0 z-50 flex items-center justify-center p-4"
          }
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={panelRef}
            className={`relative z-10 ${panelClassName}`}
            initial={{ opacity: 0, scale: 0.96, y: enterY }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: enterY }}
            transition={{ duration: 0.22, ease }}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
