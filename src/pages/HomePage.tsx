import { Link } from "react-router";
import {
  FaUsers,
  FaRocket,
} from "react-icons/fa";
import { HiOutlineArrowNarrowRight } from "react-icons/hi";

const HomePage = () => {
  return (
    <div className="min-h-screen w-full bg-[#fafafa]">

      {/* Top Accent */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

      <div className="relative min-h-screen flex items-center justify-center px-6">

        <div className="w-full max-w-5xl text-center">

          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold">
              <FaRocket className="h-4 w-4" />
              AUTODADDY
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-[42px] md:text-[56px] font-extrabold text-slate-900 leading-tight">
            Manage Your Software
            <br />
            With{" "}
            <span className="text-blue-600">AutoDaddy Admin Panel</span>
          </h1>

          {/* Main CTA */}
          <div className="mt-12 flex flex-col items-center gap-4">
            <Link
              to="/admin"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg transition-all"
            >
              <FaUsers className="h-5 w-5" />
              Enter Admin Dashboard
              <HiOutlineArrowNarrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />
            </Link>

            {/* Sub Admin Sign In CTA */}
            <Link
              to="/subadmin/signin"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-blue-700 font-bold text-lg shadow transition-all"
            >
              <FaUsers className="h-5 w-5" />
              Sub Admin Sign In
              <HiOutlineArrowNarrowRight className="h-5 w-5 group-hover:translate-x-1 transition" />
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-6 text-xs text-slate-300">
            © {new Date().getFullYear()} AutoDaddy. All rights reserved.
          </div>

        </div>

      </div>
    </div>
  );
};

export default HomePage;
