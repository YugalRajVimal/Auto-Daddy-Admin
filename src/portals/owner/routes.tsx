import { Navigate, Route } from "react-router";
import OwnerPageLayout from "../../layout/Owner/OwnerPageLayout";
import OwnerPanelLayout from "../../layout/Owner/OwnerPanelLayout";
import ShopPanelLayout from "../../layout/Shop/ShopPanelLayout";
import ShopPageLayout from "../../layout/Shop/ShopPageLayout";
import OwnerHomePage from "../../pages/OwnerPages/Home/Home";
import {
  OwnerFaqsPage,
  OwnerFeaturesPage,
  OwnerPrivacyPage,
} from "../../pages/OwnerPages/Home/ContentPages";
import OwnerProfilePage from "../../pages/OwnerPages/Profile/Profile";
import OwnerVehiclesPage from "../../pages/OwnerPages/Profile/Vehicles";
import OwnerDocumentsPage from "../../pages/OwnerPages/Documents/Documents";
import OwnerDealsPage from "../../pages/OwnerPages/Deals/Deals";
import OwnerAutoShopsPage from "../../pages/OwnerPages/AutoShops/AutoShops";
import OwnerInvoicesPage from "../../pages/OwnerPages/Expenses/Invoices";
import OwnerExpensesJobCardsPage from "../../pages/OwnerPages/Expenses/JobCards";
import OwnerReportsPage from "../../pages/OwnerPages/Reports/Reports";
import OwnerJobCardsPage from "../../pages/OwnerPages/JobCards";
import OwnerDigitalDiaryPage from "../../pages/OwnerPages/DigitalDiary/DigitalDiary";
import OwnerMessagesPage from "../../pages/OwnerPages/Messages";
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
      <Route path="/owner/faqs" element={<OwnerFaqsPage />} />
      <Route path="/owner/privacy" element={<OwnerPrivacyPage />} />
      <Route path="/owner/features" element={<OwnerFeaturesPage />} />
      <Route path="/owner/profile" element={<OwnerProfilePage />} />
      <Route path="/owner/profile/vehicles" element={<OwnerVehiclesPage />} />
      <Route path="/owner/vehicles" element={<Navigate to="/owner/profile/vehicles" replace />} />
      <Route path="/owner/documents" element={<OwnerDocumentsPage />} />
      <Route path="/owner/documents/:vehicleId" element={<OwnerDocumentsPage />} />
      <Route path="/owner/auto-shops" element={<OwnerAutoShopsPage />} />
      <Route path="/owner/auto-shops/approvals" element={<OwnerAutoShopsPage />} />
      <Route path="/owner/job-cards" element={<OwnerJobCardsPage />} />
      <Route path="/owner/digital-diary" element={<OwnerDigitalDiaryPage />} />
      <Route path="/owner/reports" element={<Navigate to="/owner/reports/job-cards" replace />} />
      <Route path="/owner/reports/job-cards" element={<OwnerReportsPage />} />
      <Route path="/owner/reports/invoices" element={<OwnerReportsPage />} />
      <Route path="/owner/reports/auto-shops" element={<OwnerReportsPage />} />
      <Route path="/owner/reports/tickets-raised" element={<OwnerReportsPage />} />
      <Route path="/owner/expenses/invoices" element={<OwnerInvoicesPage />} />
      <Route path="/owner/invoices" element={<Navigate to="/owner/expenses/invoices" replace />} />
      <Route path="/owner/expenses/job-cards" element={<OwnerExpensesJobCardsPage />} />
      <Route path="/owner/expenses" element={<Navigate to="/owner/expenses/job-cards" replace />} />
      <Route path="/owner/messages" element={<OwnerMessagesPage />} />
      <Route path="/owner/digital-diary/documents" element={<Navigate to="/owner/documents" replace />} />
      <Route path="/owner/digi-purse" element={<Navigate to="/owner/documents" replace />} />
      <Route path="/owner/deals" element={<Navigate to="/owner/deals/spare-parts" replace />} />
      <Route path="/owner/deals/spare-parts" element={<OwnerDealsPage />} />
      <Route path="/owner/deals/service" element={<OwnerDealsPage />} />
      <Route path="/owner/deals/salvage" element={<OwnerDealsPage />} />
      <Route path="/owner/deals/completed" element={<OwnerDealsPage />} />
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
