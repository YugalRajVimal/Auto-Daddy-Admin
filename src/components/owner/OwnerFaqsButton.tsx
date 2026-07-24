import { type ComponentPropsWithoutRef } from "react";
import { Link } from "react-router";

export const OWNER_FAQS_BUTTON_CLASSES =
  "w-full rounded-full border border-red-600 bg-red-50 px-4 py-2.5 text-center text-sm font-bold uppercase tracking-wide text-red-600 transition-colors hover:bg-red-100";

export const STICKY_FAQS_BUTTON_CLASSES =
  "fixed bottom-6 right-6 z-40 rounded-full border border-red-600 bg-red-50 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-red-600 shadow-lg transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2";

export const ownerPageSidebarFooterClass = "mt-auto flex flex-col gap-3 pt-6";

type OwnerFaqsButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children" | "type"> & {
  className?: string;
};

export function OwnerFaqsButton({ className = "", ...props }: OwnerFaqsButtonProps) {
  return (
    <button type="button" {...props} className={`${OWNER_FAQS_BUTTON_CLASSES} ${className}`.trim()}>
      FAQs
    </button>
  );
}

type StickyFaqsButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children" | "type"> & {
  className?: string;
};

/** Fixed bottom-right FAQs control for portal layouts. */
export function StickyFaqsButton({ className = "", ...props }: StickyFaqsButtonProps) {
  return (
    <button
      type="button"
      aria-label="Open FAQs"
      {...props}
      className={`${STICKY_FAQS_BUTTON_CLASSES} ${className}`.trim()}
    >
      FAQs
    </button>
  );
}

type StickyFaqsLinkProps = {
  to: string;
  className?: string;
};

/** Fixed bottom-right FAQs link (e.g. owner FAQs page). */
export function StickyFaqsLink({ to, className = "" }: StickyFaqsLinkProps) {
  return (
    <Link
      to={to}
      aria-label="Open FAQs"
      className={`${STICKY_FAQS_BUTTON_CLASSES} ${className}`.trim()}
    >
      FAQs
    </Link>
  );
}

type OwnerSidebarFaqsSlotProps = {
  onClick: () => void;
  className?: string;
  /** When true, stays at the bottom of a fixed-height sidebar (no mt-auto). */
  pinned?: boolean;
};

export function OwnerSidebarFaqsSlot({
  onClick,
  className = "",
  pinned = false,
}: OwnerSidebarFaqsSlotProps) {
  return (
    <div
      className={`${pinned ? "shrink-0" : "mt-auto"} flex flex-col gap-3 pt-6 ${className}`.trim()}
    >
      <OwnerFaqsButton onClick={onClick} />
    </div>
  );
}

export default OwnerFaqsButton;
