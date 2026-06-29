import { Route } from "react-router";
import OwnerPageLayout from "../../layout/Owner/OwnerPageLayout";
import OwnerPanelLayout from "../../layout/Owner/OwnerPanelLayout";
import ShopPanelLayout from "../../layout/Shop/ShopPanelLayout";
import ShopPageLayout from "../../layout/Shop/ShopPageLayout";
import OwnerHomePage from "../../pages/OwnerPages/Home";
import OwnerProfilePage from "../../pages/OwnerPages/Profile";
import OwnerDealsPage from "../../pages/OwnerPages/Deals";
import OwnerAutoShopsPage from "../../pages/OwnerPages/AutoShops";
import OwnerInvoicesPage from "../../pages/OwnerPages/Invoices";
import OwnerReportsPage from "../../pages/OwnerPages/Reports";
import OwnerJobCardsPage from "../../pages/OwnerPages/JobCards";
import OwnerDigiPursePage from "../../pages/OwnerPages/DigiPurse";
import OwnerMessagesPage from "../../pages/OwnerPages/Messages";
import OwnerVehiclesPage from "../../pages/OwnerPages/Vehicles";
import OwnerHelpPage from "../../pages/OwnerPages/Help";
import ShopHomePage from "../../pages/ShopPages/Home";
import ShopProfilePage from "../../pages/ShopPages/Profile";
import ShopPeoplePage from "../../pages/ShopPages/People";
import ShopServicesPage from "../../pages/ShopPages/Services";
import ShopJobCardsPage from "../../pages/ShopPages/JobCards";
import ShopWalletPage from "../../pages/ShopPages/Wallet";
import ShopMessagesPage from "../../pages/ShopPages/Messages";
import ShopMyWebsitePage from "../../pages/ShopPages/MyWebsite";
import ShopReportsPage from "../../pages/ShopPages/Reports";
import ShopDealsPage from "../../pages/ShopPages/Deals";
import ShopCustomerAddPage, { ShopCustomerEditPage } from "../../pages/ShopPages/CustomerFormPage";
import ShopJobCardAddPage, { ShopJobCardEditPage } from "../../pages/ShopPages/JobCardFormPage";
import ShopCarCompaniesPage from "../../pages/ShopPages/CarCompanies";
import ShopServicesSelectionPage from "../../pages/ShopPages/ServicesSelection";
import ShopTeamPage from "../../pages/ShopPages/Team";
import ShopTeamMemberFormPage from "../../pages/ShopPages/TeamMemberFormPage";
import ShopHelpPage from "../../pages/ShopPages/Help";

export const ownerRoutes = (
  <Route element={<OwnerPanelLayout />}>
    <Route element={<OwnerPageLayout />}>
      <Route index path="/owner" element={<OwnerHomePage />} />
      <Route path="/owner/profile" element={<OwnerProfilePage />} />
      <Route path="/owner/vehicles" element={<OwnerVehiclesPage />} />
      <Route path="/owner/auto-shops" element={<OwnerAutoShopsPage />} />
      <Route path="/owner/job-cards" element={<OwnerJobCardsPage />} />
      <Route path="/owner/reports" element={<OwnerReportsPage />} />
      <Route path="/owner/invoices" element={<OwnerInvoicesPage />} />
      <Route path="/owner/messages" element={<OwnerMessagesPage />} />
      <Route path="/owner/digi-purse" element={<OwnerDigiPursePage />} />
      <Route path="/owner/deals" element={<OwnerDealsPage />} />
      <Route path="/owner/help" element={<OwnerHelpPage />} />
    </Route>
  </Route>
);

export const shopRoutes = (
  <Route element={<ShopPanelLayout />}>
    <Route element={<ShopPageLayout />}>
      <Route index path="/shop" element={<ShopHomePage />} />
      <Route path="/shop/profile" element={<ShopProfilePage />} />
      <Route path="/shop/people" element={<ShopPeoplePage />} />
      <Route path="/shop/people/new" element={<ShopCustomerAddPage />} />
      <Route path="/shop/people/:id/edit" element={<ShopCustomerEditPage />} />
      <Route path="/shop/services" element={<ShopServicesPage />} />
      <Route path="/shop/job-cards" element={<ShopJobCardsPage />} />
      <Route path="/shop/job-cards/new" element={<ShopJobCardAddPage />} />
      <Route path="/shop/job-cards/:id/edit" element={<ShopJobCardEditPage />} />
      <Route path="/shop/wallet" element={<ShopWalletPage />} />
      <Route path="/shop/messages" element={<ShopMessagesPage />} />
      <Route path="/shop/my-website" element={<ShopMyWebsitePage />} />
      <Route path="/shop/reports" element={<ShopReportsPage />} />
      <Route path="/shop/deals" element={<ShopDealsPage />} />
      <Route path="/shop/profile/car-companies" element={<ShopCarCompaniesPage />} />
      <Route path="/shop/profile/services-selection" element={<ShopServicesSelectionPage />} />
      <Route path="/shop/team" element={<ShopTeamPage />} />
      <Route path="/shop/team/new" element={<ShopTeamMemberFormPage />} />
      <Route path="/shop/team/:id/edit" element={<ShopTeamMemberFormPage />} />
      <Route path="/shop/help" element={<ShopHelpPage />} />
    </Route>
  </Route>
);
