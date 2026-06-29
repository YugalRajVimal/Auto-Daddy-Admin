import type { ReactNode } from "react";
import { shopHeroCardInlineToolbarClass } from "../shop/shopLayoutStyles";

type OwnerHeroCardInlineToolbarProps = {
  children?: ReactNode;
};

/** Thin right-aligned actions row inside owner hero cards (matches My Website). */
export function OwnerHeroCardInlineToolbar({ children }: OwnerHeroCardInlineToolbarProps) {
  if (!children) return null;

  return <div className={shopHeroCardInlineToolbarClass}>{children}</div>;
}
