import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import NotFound from "./pages/AdminPages/OtherPage/NotFound";
import Videos from "./pages/AdminPages/UiElements/Videos";
import Images from "./pages/AdminPages/UiElements/Images";
import Alerts from "./pages/AdminPages/UiElements/Alerts";
import Badges from "./pages/AdminPages/UiElements/Badges";
import Avatars from "./pages/AdminPages/UiElements/Avatars";
import Buttons from "./pages/AdminPages/UiElements/Buttons";
import LineChart from "./pages/AdminPages/Charts/LineChart";
import BarChart from "./pages/AdminPages/Charts/BarChart";
import Calendar from "./pages/AdminPages/Calendar";
import BasicTables from "./pages/AdminPages/Tables/BasicTables";
import FormElements from "./pages/AdminPages/Forms/FormElements";
import Blank from "./pages/AdminPages/Blank";

import { ScrollToTop } from "./components/common/ScrollToTop";

import AdminAppLayout from "./layout/Admin/AppLayout";

// import HomePage from "./pages/HomePage";

import AdminHome from "./pages/AdminPages/Dashboard/Home";
import AdminProfile from "./pages/AdminPages/ProfilePage/AdminProfile";
import LogOutAdmin from "./pages/AdminPages/LogOutAdmin";
import AdminSignInPage from "./pages/AuthPages/AdminSignInPage";

import Tasks from "./pages/AdminPages/Tasks/Tasks";

import CarOwners from "./pages/AdminPages/Users/CarOwners";
import AutoShopOwners from "./pages/AdminPages/Users/AutoShopOwners";


import Services from "./pages/AdminPages/Services/Services";
import AutoShopOwnerOnboarding from "./pages/AutoShopOwnerOnboarding";
import WebsiteTemplates from "./pages/AdminPages/WebsiteTemplates/WebsiteTemplates";
// import DashboardData from "./pages/AdminPages/Dashboarddata/DashboardData";
import CarCompany from "./pages/AdminPages/CarCompany/CarCompany";
import Cities from "./pages/AdminPages/Cities/Cities";
import Ads from "./pages/AdminPages/Ads/Ads";
import RunningDeals from "./pages/AdminPages/Deals/RunningDeals";
import Wallet from "./pages/AdminPages/Wallet/Wallet";
import SubServicesPage from "./pages/AdminPages/Services/Categories";
import Provinces from "./pages/AdminPages/Cities/Provinces";
import Invitehelp from "./pages/AdminPages/InviteHelpSection/Invitehelp";
import SubAdminManagement from "./pages/AdminPages/SubAdminManagement/SubAdminManagement";
// import SubAdminSignInPage from "./pages/AuthPages/SubAdminSignInPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Unauthorized from "./pages/AdminPages/OtherPage/Unauthorized";
import FAQsPage from "./pages/AdminPages/Content/FAQs";
import PrivacyPage from "./pages/AdminPages/Content/Privacy";
import InvoiceTemplatesPage from "./pages/AdminPages/Content/InvoiceTemplates";
import FeaturesPage from "./pages/AdminPages/Content/Features";
import ThoughtOfDayPage from "./pages/AdminPages/Content/ThoughtOfDay";
import ThoughtOfDayNewPage from "./pages/AdminPages/Content/ThoughtOfDayNew";
import ComingSoon from "./components/admin/ComingSoon";
import Reports from "./pages/AdminPages/Reports/Reports";


export default function App() {
  return (
    <>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Router >
        <ScrollToTop />
        
        <Routes>
          {/* Login is the first page — no public homepage */}
          <Route index path="/" element={<AdminSignInPage />} />
          {/* <Route index path="/" element={<HomePage />} /> */}

          <Route element={<AdminAppLayout />}>
            <Route index path="/admin" element={
              <ProtectedRoute module="dashboard" action="view">
                <AdminHome />
              </ProtectedRoute>
            } />
            <Route path="/admin/thought-of-day" element={
              <ProtectedRoute module="dashboardData" action="view">
                <ThoughtOfDayPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/thought-of-day/new" element={
              <ProtectedRoute module="dashboardData" action="view">
                <ThoughtOfDayNewPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/features" element={
              <ProtectedRoute module="dashboardData" action="view">
                <FeaturesPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/leads" element={
              <ProtectedRoute module="dashboard" action="view">
                <ComingSoon title="Leads" />
              </ProtectedRoute>
            } />
            <Route path="/admin/accounts" element={
              <ProtectedRoute module="dashboard" action="view">
                <ComingSoon title="Accounts" />
              </ProtectedRoute>
            } />
            <Route path="/admin/messages" element={
              <ProtectedRoute module="inviteHelp" action="view">
                <Invitehelp />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute module="dashboard" action="view">
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/admin/car-owners" element={
              <ProtectedRoute module="users" action="view">
                <CarOwners />
              </ProtectedRoute>
            } />
            <Route path="/admin/auto-shop-owners" element={
              <ProtectedRoute module="users" action="view">
                <AutoShopOwners />
              </ProtectedRoute>
            } />
            <Route path="/admin/categories" element={
              <ProtectedRoute module="services" action="view">
                <Services />
              </ProtectedRoute>
            } />
            <Route path="/admin/services" element={
              <ProtectedRoute module="categories" action="view">
                <SubServicesPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/provinces" element={
              <ProtectedRoute module="provinces" action="view">
                <Provinces />
              </ProtectedRoute>
            } />
            <Route path="/admin/cities" element={
              <ProtectedRoute module="cities" action="view">
                <Cities />
              </ProtectedRoute>
            } />
            <Route path="/admin/invite-help" element={<Navigate to="/admin/messages" replace />} />
            <Route path="/admin/ads" element={
              <ProtectedRoute module="ads" action="view">
                <Ads />
              </ProtectedRoute>
            } />
            <Route path="/admin/running-deals" element={
              <ProtectedRoute module="runningDeals" action="view">
                <RunningDeals />
              </ProtectedRoute>
            } />
            <Route path="/admin/wallet" element={
              <ProtectedRoute module="wallet" action="view">
                <Wallet />
              </ProtectedRoute>
            } />
            <Route path="/admin/manage-task" element={
              <ProtectedRoute module="tasks" action="view">
                <Tasks />
              </ProtectedRoute>
            } />
            <Route path="/admin/profile" element={
              <ProtectedRoute module="dashboard" action="view">
                <AdminProfile />
              </ProtectedRoute>
            } />
            <Route path="/admin/logout" element={

                <LogOutAdmin />

            } />
            <Route path="/admin/website-templates" element={
              <ProtectedRoute module="websiteTemplates" action="view">
                <WebsiteTemplates />
              </ProtectedRoute>
            } />
            <Route path="/admin/invoice-templates" element={
              <ProtectedRoute module="websiteTemplates" action="view">
                <InvoiceTemplatesPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/faqs" element={
              <ProtectedRoute module="dashboardData" action="view">
                <FAQsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/privacy" element={
              <ProtectedRoute module="dashboardData" action="view">
                <PrivacyPage />
              </ProtectedRoute>
            } />
            {/* Dashboard Data route commented out — functionality split into Thought of Day + Features
            <Route path="/admin/dashboard-data" element={
              <ProtectedRoute module="dashboardData" action="view">
                <DashboardData />
              </ProtectedRoute>
            } />
            */}
            <Route path="/admin/car-companies" element={
              <ProtectedRoute module="carCompanies" action="view">
                <CarCompany />
              </ProtectedRoute>
            } />
            <Route path="/admin/subadmins" element={
              <ProtectedRoute module="subAdminManagement" action="view">
                <SubAdminManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/associates" element={
              <div className="flex min-h-[40vh] flex-1 items-center justify-center bg-white px-6">
                <div className="rounded-t-2xl rounded-b-xl border border-ad-green-dark/30 bg-ad-green-light px-12 py-10 text-center shadow-sm">
                  <p className="text-xl font-bold text-ad-green-dark">Associates — Coming Soon</p>
                </div>
              </div>
            } />
            <Route path="/admin/dealers" element={
              <div className="flex min-h-[40vh] flex-1 items-center justify-center bg-white px-6">
                <div className="rounded-t-2xl rounded-b-xl border border-ad-green-dark/30 bg-ad-green-light px-12 py-10 text-center shadow-sm">
                  <p className="text-xl font-bold text-ad-green-dark">Dealers — Coming Soon</p>
                </div>
              </div>
            } />
       
            <Route path="/admin/unauthorized" element={<Unauthorized />} />
          </Route>
     


          <Route path="/admin/signin" element={<AdminSignInPage />} />

          {/* Sub-admin login flow not needed for now
          <Route path="/subadmin/signin" element={<SubAdminSignInPage />} />
          */}
     


          <Route path="/auto-shop-owner/onboarding" element={<AutoShopOwnerOnboarding />} />



          <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />
            <Route path="/form-elements" element={<FormElements />} />
            <Route path="/basic-tables" element={<BasicTables />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
