import { BrowserRouter as Router, Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// import SignIn from "./pages/SuperAdminPages/AuthPages/SignIn";

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
// import Home from "./pages/SuperAdminPages/Dashboard/Home";
// import SubAdminSignIn from "./pages/SuperAdminPages/AuthPages/SubAdmin/SignIn";

import SubAdminAppLayout from "./layout/Admin/AppLayout";

// import UploadedExcelSheets from "./pages/SubAdminPages/UploadedExcelSheets/UploadedExcelSheets";

import HomePage from "./pages/HomePage";

import SubAdminHome from "./pages/AdminPages/Dashboard/Home";



import AdminProfile from "./pages/AdminPages/ProfilePage/AdminProfile";
import LogOutAdmin from "./pages/AdminPages/LogOutAdmin";
import AdminSignInPage from "./pages/AuthPages/AdminSignInPage";

import Tasks from "./pages/AdminPages/Tasks/Tasks";

import CarOwners from "./pages/AdminPages/Users/CarOwners";
import AutoShopOwners from "./pages/AdminPages/Users/AutoShopOwners";


import Services from "./pages/AdminPages/Services/Services";
import AutoShopOwnerOnboarding from "./pages/AutoShopOwnerOnboarding";
import WebsiteTemplates from "./pages/AdminPages/WebsiteTemplates/WebsiteTemplates";
import DashboardData from "./pages/AdminPages/Dashboarddata/DashboardData";
import CarCompany from "./pages/AdminPages/CarCompany/CarCompany";
import Cities from "./pages/AdminPages/Cities/Cities";
import Ads from "./pages/AdminPages/Ads/Ads";
import RunningDeals from "./pages/AdminPages/Deals/RunningDeals";
import Wallet from "./pages/AdminPages/Wallet/Wallet";
import SubServicesPage from "./pages/AdminPages/Services/Categories";
import Provinces from "./pages/AdminPages/Cities/Provinces";
import Invitehelp from "./pages/AdminPages/InviteHelpSection/Invitehelp";


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
          <Route index path="/" element={<HomePage />} />
          {/* Dashboard Layout */}
          {/* <Route element={<AppLayout />}>
         
            <Route index path="/super-admin" element={<SubAdminHome />} />
            <Route path="/super-admin/all-users" element={<AllUsers />} />
            <Route path="/super-admin/all-appointments" element={<AllAppointments />} />
            <Route path="/super-admin/onboard-sub-admin" element={<OnboardSubAdmin />} />
            <Route path="/super-admin/therapy-types" element={<TherapyTypesPage />} />
            <Route path="/super-admin/packages" element={<PackagesPage />} />
            <Route path="/super-admin/discount-coupons" element={<ManageDiscounts />} />
            <Route path="/super-admin/audit-logs" element={<AllLogs/>} />
            <Route path="/super-admin/finances" element={<FinancesSuperAdminPage/>} />
            <Route path="/super-admin/full-calendar" element={<SuperAdminFullCalendar/>} />
            <Route path="/super-admin/therapists" element={<SuperAdminTherapistsPage/>} />




            <Route path="/super-admin/profile" element={<SuperAdminProfile />} />
            <Route path="/super-admin/logout" element={<LogOutSuperAdmin />} />
       
          </Route> */}

          <Route element={<SubAdminAppLayout />}>
            <Route index path="/admin" element={<SubAdminHome />} />
            {/* <Route path="/admin/all-users" element={<AllUsers/>} /> */}
            <Route path="/admin/car-owners" element={<CarOwners/>} />
            <Route path="/admin/auto-shop-owners" element={<AutoShopOwners/>} />
            
            <Route path="/admin/services" element={<Services />} />
            <Route path="/admin/categories" element={<SubServicesPage />} />

            <Route path="/admin/provinces" element={<Provinces />} />
            <Route path="/admin/cities" element={<Cities />} />

            <Route path="/admin/invite-help" element={<Invitehelp />} />


            <Route path="/admin/ads" element={<Ads />} />
            <Route path="/admin/running-deals" element={<RunningDeals />} />
            <Route path="/admin/wallet" element={<Wallet />} />





            <Route path="/admin/manage-task" element={<Tasks />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
            <Route path="/admin/logout" element={<LogOutAdmin />} />
            {/* <Route path="/admin/vehicle-types" element={<VehicleType />} /> */}
            <Route path="/admin/website-templates" element={<WebsiteTemplates />} />
            <Route path="/admin/dashboard-data" element={<DashboardData />} />
            <Route path="/admin/car-companies" element={<CarCompany />} />
          </Route>


          <Route path="/admin/signin" element={<AdminSignInPage />} />
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
