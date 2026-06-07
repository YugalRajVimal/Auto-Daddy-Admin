import { BrowserRouter as Router, Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// import SignIn from "./pages/SuperAdminPages/AuthPages/SignIn";

import NotFound from "./pages/SuperAdminPages/OtherPage/NotFound";
import Videos from "./pages/SuperAdminPages/UiElements/Videos";
import Images from "./pages/SuperAdminPages/UiElements/Images";
import Alerts from "./pages/SuperAdminPages/UiElements/Alerts";
import Badges from "./pages/SuperAdminPages/UiElements/Badges";
import Avatars from "./pages/SuperAdminPages/UiElements/Avatars";
import Buttons from "./pages/SuperAdminPages/UiElements/Buttons";
import LineChart from "./pages/SuperAdminPages/Charts/LineChart";
import BarChart from "./pages/SuperAdminPages/Charts/BarChart";
import Calendar from "./pages/SuperAdminPages/Calendar";
import BasicTables from "./pages/SuperAdminPages/Tables/BasicTables";
import FormElements from "./pages/SuperAdminPages/Forms/FormElements";
import Blank from "./pages/SuperAdminPages/Blank";


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
import Payments from "./pages/AdminPages/Payments/Payments";
import PackagesPage from "./pages/AdminPages/Packages/Packages";
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
            <Route path="/admin/cities" element={<Cities />} />
            <Route path="/admin/ads" element={<Ads />} />
            <Route path="/admin/running-deals" element={<RunningDeals />} />



            <Route path="/admin/manage-packages" element={<PackagesPage/>} />
            <Route path="/admin/manage-task" element={<Tasks />} />
            <Route path="/admin/manage-rewards" element={<div>Manage Rewards (HTML placeholder)</div>} />
            <Route path="/admin/profile" element={<AdminProfile />} />
            <Route path="/admin/finances" element={<Payments />} />
            <Route path="/admin/logout" element={<LogOutAdmin />} />

            {/* <Route path="/admin/vehicle-types" element={<VehicleType />} /> */}
            <Route path="/admin/website-templates" element={<WebsiteTemplates />} />
            <Route path="/admin/dashboard-data" element={<DashboardData />} />
            <Route path="/admin/car-companies" element={<CarCompany />} />
     
     
     
          </Route>


          <Route path="/admin/signin" element={<AdminSignInPage />} />

          <Route path="/auto-shop-owner/onboarding" element={<AutoShopOwnerOnboarding />} />

         
    




         {/*  <Route element={<SupervisorAppLayout />}>
            <Route index path="/therapist" element={<SupervisorHome />} />
            <Route path="/therapist/appointments" element={<TherapistMyAppointments />} />
            <Route path="/therapist/calendar" element={<CalendarAndSchedule />} />
            <Route path="/therapist/earnings" element={<MyEarningsTherapist/>} />
            <Route path="/therapist/profile" element={<TherpaistProfile />} />
            <Route path="/therapist/earnings" element={<MyEarningsTherapist/>} />
          

          </Route> */}

          {/* <Route path="/therapist/signup" element={<TherapistSignUp />} />
          <Route path="/therapist/complete-profile" element={<CompleteProfilePage />} />
          <Route path="/therapist/pending-approval" element={<ApprovalPending/>} />
          <Route path="/therapist/logout" element={<LogOutTherapist/>} /> */}


          {/* <Route  element={<ParentAppLayout />}>
            <Route index path="/user" element={<ParentDashboard />} />
            <Route index path="/tasks" element={<AllTasks />} />
            <Route index path="/referral" element={<Referrals />} />
            <Route index path="/promotional-page" element={<PromotionalIncomePage />} />
            <Route index path="/rewards" element={<Rewards />} />

            <Route path="/user/profile" element={<ParentProfile />} />
            <Route path="/wallet-history" element={<WalletAndHistory />} />
          





            <Route path="/user/children" element={<MyChildrens />} />
            <Route path="/user/appointments" element={<MyChildrenAppointmentsPage  />} />
            <Route path="/user/invoices-payments" element={<InvoiveAndPaymentsPage/>} />
            <Route path="/user/request-appointment" element={<RequestAppointment />} />
            <Route path="/user/request-edit-appointment" element={<RequestEditAppointments />} />


          </Route>        */}
{/* 
          <Route path="/user/signup" element={<ParentSignUp />} />
          <Route path="/user/complete-parent-profile" element={<ParentCompleteProfile />} />
          <Route path="/user/logout" element={<LogOutParent />} /> */}



          {/* <Route path="/signin" element={<AuthPage />} />
          <Route path="/signup" element={<SignUpPage/>} />
          <Route path="/complete-kyc" element={<CompleteKYC />} />
          <Route path="/kyc-pending" element={<KycApprovalPending />} />
          <Route path="/purchase-package" element={<PurchasePackage />} /> */}
        
          {/* <Route path="/privacy-policy" element={<PrivacyPolicy />} /> */}

          {/* <Route path="/sub-admin/signup" element={<SubAdminSignUpForm />} /> */}

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
