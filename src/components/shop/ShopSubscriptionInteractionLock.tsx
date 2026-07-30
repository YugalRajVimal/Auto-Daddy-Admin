import type { ReactNode, MouseEvent, FormEvent } from "react";
import { useShopSubscriptionGate } from "../../context/ShopSubscriptionGateContext";
import { isShopPathAllowedWithoutSubscription } from "../../lib/shopSubscriptionAccess";

const INTERACTIVE_SELECTOR = [
  "button",
  "a",
  "input",
  "select",
  "textarea",
  "summary",
  '[role="button"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="tab"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="link"]',
  "label",
].join(", ");

function hrefLooksAllowed(href: string | null): boolean {
  if (!href || href === "#" || href.startsWith("javascript:")) return false;
  try {
    if (href.startsWith("http://") || href.startsWith("https://")) {
      const url = new URL(href);
      if (url.origin !== window.location.origin) return true;
      return isShopPathAllowedWithoutSubscription(url.pathname);
    }
  } catch {
    return false;
  }
  if (href.startsWith("/")) {
    const path = href.split("?")[0]?.split("#")[0] ?? href;
    return isShopPathAllowedWithoutSubscription(path);
  }
  return false;
}

type ShopSubscriptionInteractionLockProps = {
  active: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Lets users view locked shop UI, but intercepts clicks / submits so features
 * cannot be used without an active subscription.
 */
export default function ShopSubscriptionInteractionLock({
  active,
  children,
  className,
}: ShopSubscriptionInteractionLockProps) {
  const { promptSubscribe } = useShopSubscriptionGate();

  const onClickCapture = (e: MouseEvent) => {
    if (!active) return;
    const target = e.target;
    if (!(target instanceof Element)) return;
    const interactive = target.closest(INTERACTIVE_SELECTOR);
    if (!interactive) return;

    if (interactive instanceof HTMLAnchorElement || interactive.tagName === "A") {
      const href = interactive.getAttribute("href");
      if (hrefLooksAllowed(href)) return;
    }

    e.preventDefault();
    e.stopPropagation();
    promptSubscribe();
  };

  const onSubmitCapture = (e: FormEvent) => {
    if (!active) return;
    e.preventDefault();
    e.stopPropagation();
    promptSubscribe();
  };

  return (
    <div className={className} onClickCapture={onClickCapture} onSubmitCapture={onSubmitCapture}>
      {children}
    </div>
  );
}
