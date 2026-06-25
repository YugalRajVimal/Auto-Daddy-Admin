import { type ComponentPropsWithoutRef } from "react";

export const OWNER_FAQS_BUTTON_CLASSES =
  "w-full rounded-full border border-red-600 bg-red-50 px-4 py-2.5 text-center text-sm font-bold uppercase tracking-wide text-red-600 transition-colors hover:bg-red-100";

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
