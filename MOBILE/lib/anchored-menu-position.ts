import { Dimensions } from "react-native";

export type MenuAnchorRect = { x: number; y: number; w: number; h: number };

const MENU_MIN_W = 228;
const GAP = 6;
const EDGE = 8;
const ESTIMATED_MENU_HEIGHT = 300;

/** Positions a popover so its top-right sits near the anchor button (below, or above if needed). */
export function getAnchoredMenuStyle(anchor: MenuAnchorRect) {
  const { width: winW, height: winH } = Dimensions.get("window");
  let top = anchor.y + anchor.h + GAP;
  if (top + ESTIMATED_MENU_HEIGHT > winH - EDGE) {
    top = Math.max(EDGE, anchor.y - ESTIMATED_MENU_HEIGHT - GAP);
  }
  let left = anchor.x + anchor.w - MENU_MIN_W;
  left = Math.max(EDGE, Math.min(left, winW - MENU_MIN_W - EDGE));
  return {
    position: "absolute" as const,
    top,
    left,
    minWidth: MENU_MIN_W,
    zIndex: 2,
  };
}
