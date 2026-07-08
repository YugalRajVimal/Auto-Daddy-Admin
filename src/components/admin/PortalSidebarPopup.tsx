import { useRef, type ReactNode, type RefObject } from "react";
import { usePortalSidebarPopupPlacement } from "../../hooks/usePortalSidebarPopupPlacement";
import { portalSidebarPopupClass } from "./portalSidebarStyles";

type PortalSidebarPopupProps = {
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
  role?: string;
};

export default function PortalSidebarPopup({
  anchorRef,
  children,
  className = "",
  role = "menu",
}: PortalSidebarPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const placement = usePortalSidebarPopupPlacement(anchorRef, popupRef, true);

  return (
    <div ref={popupRef} className={portalSidebarPopupClass(placement, className)} role={role}>
      {children}
    </div>
  );
}
