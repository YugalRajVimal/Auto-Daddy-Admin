import { BrowserRouter as Router, Routes, Route } from "react-router";
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
import AdminSignInPage from "./pages/AuthPages/AdminSignInPage";
import AutoShopOwnerOnboarding from "./pages/AutoShopOwnerOnboarding";
import { adminRoutes } from "./portals/admin/routes";
import { ownerRoutes, shopRoutes } from "./portals/owner/routes";

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
      <div className="min-h-screen bg-ad-app-bg px-4 md:px-10 lg:px-14">
        <Router>
          <ScrollToTop />

          <Routes>
            <Route index path="/" element={<AdminSignInPage />} />

            {adminRoutes}
            {ownerRoutes}
            {shopRoutes}

            {/* Sub-admin login flow not needed for now
            <Route path="/subadmin/signin" element={<SubAdminSignInPage />} />
            */}

            <Route path="/auto-shop-owner/onboarding" element={<AutoShopOwnerOnboarding />} />

            {/* Template / demo routes */}
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

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </div>
    </>
  );
}
