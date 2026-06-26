import type { ReactNode } from "react";
import {
  type ShopPageChromeConfig,
  useShopPageChrome,
} from "../../context/ShopPageChromeContext";
import type { ShopSidebarItem } from "./ShopSidebar";

type ShopPageShellProps = ShopPageChromeConfig & {
  metaTitle: string;
  metaDescription: string;
  sidebarItems?: ShopSidebarItem[];
  children: ReactNode;
};

/** Registers page chrome with {@link ShopPageLayout}; renders route content only. */
export default function ShopPageShell({ children, ...chrome }: ShopPageShellProps) {
  useShopPageChrome(chrome);
  return <>{children}</>;
}
