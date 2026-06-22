import { DrawerInfoStackShell } from "@/components/reusables/layout/drawer-info-stack-shell";
import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

/** @deprecated Use `DrawerInfoStackShell` — kept for existing imports. */
export function ShopOwnerInfoStackShell({ title, children }: Props) {
  return <DrawerInfoStackShell title={title}>{children}</DrawerInfoStackShell>;
}
