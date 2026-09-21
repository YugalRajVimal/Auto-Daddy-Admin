import { createContext, useContext } from "react";
import type { NavSubItem } from "../config/adminNav";

export type OwnerNavContextValue = {
  /** Left-panel sections of the active primary tab (or Help). */
  subItems: NavSubItem[];
  activeSubPath: string | null;
  onSubNavClick: (path: string, e: React.MouseEvent<HTMLAnchorElement>) => void;
};

export const OwnerNavContext = createContext<OwnerNavContextValue>({
  subItems: [],
  activeSubPath: null,
  onSubNavClick: () => {},
});

export function useOwnerNav() {
  return useContext(OwnerNavContext);
}
