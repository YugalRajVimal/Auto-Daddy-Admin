import { useLayoutEffect, useState, type RefObject } from "react";

export type PortalSidebarPopupPlacement = "below" | "above";

const POPUP_GAP_PX = 6;
const VIEWPORT_PADDING_PX = 8;

function measurePlacement(
  anchor: HTMLElement,
  popup: HTMLElement
): PortalSidebarPopupPlacement {
  const anchorRect = anchor.getBoundingClientRect();
  const popupHeight = popup.offsetHeight;
  const spaceBelow = window.innerHeight - anchorRect.bottom - POPUP_GAP_PX - VIEWPORT_PADDING_PX;
  const spaceAbove = anchorRect.top - POPUP_GAP_PX - VIEWPORT_PADDING_PX;

  if (spaceBelow >= popupHeight) return "below";
  if (spaceAbove >= popupHeight) return "above";
  return spaceBelow >= spaceAbove ? "below" : "above";
}

export function usePortalSidebarPopupPlacement(
  anchorRef: RefObject<HTMLElement | null>,
  popupRef: RefObject<HTMLElement | null>,
  open: boolean
): PortalSidebarPopupPlacement {
  const [placement, setPlacement] = useState<PortalSidebarPopupPlacement>("below");

  useLayoutEffect(() => {
    if (!open) {
      setPlacement("below");
      return;
    }

    const anchor = anchorRef.current;
    const popup = popupRef.current;
    if (!anchor || !popup) return;

    const update = () => {
      const nextAnchor = anchorRef.current;
      const nextPopup = popupRef.current;
      if (!nextAnchor || !nextPopup) return;
      setPlacement(measurePlacement(nextAnchor, nextPopup));
    };

    update();

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(popup);
    resizeObserver.observe(anchor);

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, popupRef, open]);

  return placement;
}
