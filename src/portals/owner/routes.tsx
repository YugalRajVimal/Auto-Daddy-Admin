import { Route } from "react-router";
import OwnerPanelLayout from "../../layout/Owner/OwnerPanelLayout";
import ShopPanelLayout from "../../layout/Shop/ShopPanelLayout";
import PortalPlaceholder from "../../components/admin/PortalPlaceholder";
import OwnerHomePage from "../../pages/OwnerPages/Home";
import OwnerProfilePage from "../../pages/OwnerPages/Profile";
import OwnerDealsPage from "../../pages/OwnerPages/Deals";
import OwnerAutoShopsPage from "../../pages/OwnerPages/AutoShops";
import OwnerInvoicesPage from "../../pages/OwnerPages/Invoices";
import OwnerJobCardsPage from "../../pages/OwnerPages/JobCards";
import OwnerDigiPursePage from "../../pages/OwnerPages/DigiPurse";
import OwnerMessagesPage from "../../pages/OwnerPages/Messages";
import OwnerVehiclesPage from "../../pages/OwnerPages/Vehicles";
import ShopHomePage from "../../pages/ShopPages/Home";

export const ownerRoutes = (
  <Route element={<OwnerPanelLayout />}>
    <Route index path="/owner" element={<OwnerHomePage />} />
    <Route path="/owner/profile" element={<OwnerProfilePage />} />
    <Route path="/owner/vehicles" element={<OwnerVehiclesPage />} />
    <Route path="/owner/auto-shops" element={<OwnerAutoShopsPage />} />
    <Route path="/owner/job-cards" element={<OwnerJobCardsPage />} />
    <Route path="/owner/invoices" element={<OwnerInvoicesPage />} />
    <Route path="/owner/messages" element={<OwnerMessagesPage />} />
    <Route path="/owner/digi-purse" element={<OwnerDigiPursePage />} />
    <Route path="/owner/deals" element={<OwnerDealsPage />} />
  </Route>
);

export const shopRoutes = (
  <Route element={<ShopPanelLayout />}>
    <Route index path="/shop" element={<ShopHomePage />} />
    <Route path="/shop/profile" element={<PortalPlaceholder title="Profile" />} />
    <Route path="/shop/people" element={<PortalPlaceholder title="People" />} />
    <Route path="/shop/services" element={<PortalPlaceholder title="Services" />} />
    <Route path="/shop/job-cards" element={<PortalPlaceholder title="Job Cards" />} />
    <Route path="/shop/wallet" element={<PortalPlaceholder title="Wallet" />} />
    <Route path="/shop/messages" element={<PortalPlaceholder title="Messages" />} />
    <Route path="/shop/reports" element={<PortalPlaceholder title="Reports" />} />
    <Route path="/shop/deals" element={<PortalPlaceholder title="Deals" />} />
  </Route>
);
