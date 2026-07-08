import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

type NavResetLocationState = {
  navReset?: number;
};

/** Re-runs when the user re-clicks the active top-nav item (ShopPrimaryNav navReset state). */
export function useOwnerNavReset(onReset: () => void) {
  const location = useLocation();
  const navResetToken = (location.state as NavResetLocationState | null)?.navReset;
  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;

  useEffect(() => {
    if (!navResetToken) return;
    onResetRef.current();
  }, [navResetToken]);
}

/** Applies the default sidebar selection once when `ready` becomes true (e.g. after data load). */
export function useOwnerSidebarDefault(ready: boolean, onDefault: () => void) {
  const applied = useRef(false);
  const onDefaultRef = useRef(onDefault);
  onDefaultRef.current = onDefault;

  useEffect(() => {
    if (!ready || applied.current) return;
    applied.current = true;
    onDefaultRef.current();
  }, [ready]);
}
