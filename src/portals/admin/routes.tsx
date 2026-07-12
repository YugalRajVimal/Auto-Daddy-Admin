import { Route, Navigate } from "react-router";
import AdminAppLayout from "../../layout/Admin/AppLayout";
import RequirePermission from "../../auth/guards/RequirePermission";

import AdminHome from "../../pages/AdminPages/Dashboard/Home";
import AdminProfile from "../../pages/AdminPages/ProfilePage/AdminProfile";
import LogOutAdmin from "../../pages/AdminPages/LogOutAdmin";
import Tasks from "../../pages/AdminPages/Tasks/Tasks";
import CarOwners from "../../pages/AdminPages/Users/CarOwners";
import AutoShopOwners from "../../pages/AdminPages/Users/AutoShopOwners";
import Associates from "../../pages/AdminPages/Users/Associates";
import Dealers from "../../pages/AdminPages/Users/Dealers";
import Services from "../../pages/AdminPages/Services/Services";
import WebsiteTemplates from "../../pages/AdminPages/WebsiteTemplates/WebsiteTemplates";
import CarCompany from "../../pages/AdminPages/CarCompany/CarCompany";
import Cities from "../../pages/AdminPages/Cities/Cities";
import Domain from "../../pages/AdminPages/Domain/Domain";
import RunningDeals from "../../pages/AdminPages/Deals/RunningDeals";
import Wallet from "../../pages/AdminPages/Wallet/Wallet";
import SubServicesPage from "../../pages/AdminPages/Services/SubServices";
import CarBrandsPage from "../../pages/AdminPages/Services/CarBrands";
import CarBrandsNewPage from "../../pages/AdminPages/Services/CarBrandsNew";
import Provinces from "../../pages/AdminPages/Cities/Provinces";
import Invitehelp from "../../pages/AdminPages/InviteHelpSection/Invitehelp";
import SubAdminManagement from "../../pages/AdminPages/SubAdminManagement/SubAdminManagement";
import RoleManager from "../../pages/AdminPages/RoleManager/RoleManager";
import Unauthorized from "../../pages/AdminPages/OtherPage/Unauthorized";
import FAQsPage from "../../pages/AdminPages/Content/FAQs";
import PrivacyPage from "../../pages/AdminPages/Content/Privacy";
import InvoiceTemplatesPage from "../../pages/AdminPages/Content/InvoiceTemplates";
import FeaturesPage from "../../pages/AdminPages/Content/Features";
import ThoughtOfDayPage from "../../pages/AdminPages/Content/ThoughtOfDay";
import ThoughtOfDayNewPage from "../../pages/AdminPages/Content/ThoughtOfDayNew";
import Reports from "../../pages/AdminPages/Reports/Reports";
import LeadsPage from "../../pages/AdminPages/Leads/Leads";
import AccountsPage from "../../pages/AdminPages/Accounts/Accounts";

/** Permission-guarded route helper — keeps route definitions concise. */
function P({
  module,
  action = "view" as const,
  children,
}: {
  module: string;
  action?: "view" | "add" | "edit" | "delete";
  children: React.ReactNode;
}) {
  return (
    <RequirePermission module={module} action={action}>
      {children}
    </RequirePermission>
  );
}

/** All routes under /admin — mounted inside App.tsx Routes. */
export const adminRoutes = (
  <Route element={<AdminAppLayout />}>
    <Route index path="/admin" element={<P module="dashboard"><AdminHome /></P>} />
    <Route path="/admin/thought-of-day" element={<P module="dashboardData"><ThoughtOfDayPage /></P>} />
    <Route path="/admin/thought-of-day/new" element={<P module="dashboardData"><ThoughtOfDayNewPage /></P>} />
    <Route path="/admin/features" element={<P module="dashboardData"><FeaturesPage /></P>} />
    <Route path="/admin/leads" element={<P module="dashboard"><LeadsPage section="all" /></P>} />
    <Route path="/admin/leads/visited" element={<P module="dashboard"><LeadsPage title="Visited" section="visited" showAddNew={false} readOnly /></P>} />
    <Route path="/admin/leads/completed" element={<P module="dashboard"><LeadsPage title="Completed" section="completed" showAddNew={false} /></P>} />
    <Route path="/admin/accounts" element={<Navigate to="/admin/accounts/expenses" replace />} />
    <Route path="/admin/accounts/expenses" element={<P module="dashboard"><AccountsPage title="Expenses" variant="expenses" /></P>} />
    <Route path="/admin/accounts/income" element={<P module="dashboard"><AccountsPage title="Income" variant="income" /></P>} />
    <Route path="/admin/accounts/bank" element={<P module="dashboard"><AccountsPage title="Manage Banks" /></P>} />
    <Route path="/admin/messages" element={<Navigate to="/admin/messages/sent" replace />} />
    <Route path="/admin/messages/sent" element={<P module="inviteHelp"><Invitehelp title="Notifications Sent" section="sent" /></P>} />
    <Route path="/admin/messages/received" element={<P module="inviteHelp"><Invitehelp title="Messages Received" section="received" showAddNew={false} /></P>} />
    <Route path="/admin/reports" element={<P module="dashboard"><Reports /></P>} />
    <Route path="/admin/reports/:reportType" element={<P module="dashboard"><Reports /></P>} />
    <Route path="/admin/car-owners" element={<P module="users"><CarOwners /></P>} />
    <Route path="/admin/auto-shop-owners" element={<P module="users"><AutoShopOwners /></P>} />
    <Route path="/admin/categories" element={<P module="services"><Services /></P>} />
    <Route path="/admin/services" element={<P module="categories"><SubServicesPage /></P>} />
    <Route path="/admin/car-brands" element={<P module="carCompanies"><CarBrandsPage /></P>} />
    <Route path="/admin/car-brands/new" element={<P module="carCompanies"><CarBrandsNewPage /></P>} />
    <Route path="/admin/provinces" element={<P module="provinces"><Provinces /></P>} />
    <Route path="/admin/cities" element={<P module="cities"><Cities /></P>} />
    <Route path="/admin/invite-help" element={<Navigate to="/admin/messages/received" replace />} />
    <Route path="/admin/ads" element={<Navigate to="/admin/domain/manager" replace />} />
    <Route path="/admin/ads/dealer" element={<Navigate to="/admin/domain/manager" replace />} />
    <Route path="/admin/ads/adds" element={<Navigate to="/admin/domain/manager" replace />} />
    <Route path="/admin/ads/invoices" element={<Navigate to="/admin/domain/manager" replace />} />
    <Route path="/admin/ads/payment" element={<Navigate to="/admin/domain/manager" replace />} />
    <Route path="/admin/domain" element={<Navigate to="/admin/domain/manager" replace />} />
    <Route path="/admin/domain/dealer" element={<Navigate to="/admin/domain/manager" replace />} />
    <Route path="/admin/domain/adds" element={<Navigate to="/admin/domain/manager" replace />} />
    <Route path="/admin/domain/invoices" element={<Navigate to="/admin/domain/manager" replace />} />
    <Route path="/admin/domain/payment" element={<Navigate to="/admin/domain/manager" replace />} />
    <Route path="/admin/domain/manager" element={<P module="domain"><Domain /></P>} />
    <Route path="/admin/running-deals" element={<P module="runningDeals"><RunningDeals /></P>} />
    <Route path="/admin/wallet" element={<P module="wallet"><Wallet /></P>} />
    <Route path="/admin/manage-task" element={<P module="tasks"><Tasks /></P>} />
    <Route path="/admin/profile" element={<P module="dashboard"><AdminProfile /></P>} />
    <Route path="/admin/logout" element={<LogOutAdmin />} />
    <Route path="/admin/website-templates" element={<P module="websiteTemplates"><WebsiteTemplates /></P>} />
    <Route path="/admin/invoice-templates" element={<P module="websiteTemplates"><InvoiceTemplatesPage /></P>} />
    <Route path="/admin/faqs" element={<P module="dashboardData"><FAQsPage /></P>} />
    <Route path="/admin/privacy" element={<P module="dashboardData"><PrivacyPage /></P>} />
    <Route path="/admin/car-companies" element={<P module="carCompanies"><CarCompany /></P>} />
    <Route path="/admin/roles" element={<P module="subAdminManagement"><RoleManager /></P>} />
    <Route path="/admin/subadmins" element={<P module="subAdminManagement"><SubAdminManagement /></P>} />
    <Route path="/admin/associates" element={<P module="users"><Associates /></P>} />
    <Route path="/admin/dealers" element={<P module="users"><Dealers /></P>} />
    <Route path="/admin/unauthorized" element={<Unauthorized />} />
  </Route>
);

export default adminRoutes;
