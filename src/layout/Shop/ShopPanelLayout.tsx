import { Outlet } from "react-router";
import PortalShell from "../../components/admin/PortalShell";
import { RequirePortal } from "../../auth/guards/RequirePortal";
import { shopPrimaryNav } from "../../config/shopNav";

function ShopLayoutContent() {
  return (
    <PortalShell homePath="/shop" profilePath="/shop/profile" primaryNav={shopPrimaryNav}>
      <Outlet />
    </PortalShell>
  );
}

export default function ShopPanelLayout() {
  return (
    <RequirePortal portal="shop" signInPath="/" unauthorizedPath="/">
      <ShopLayoutContent />
    </RequirePortal>
  );
}
