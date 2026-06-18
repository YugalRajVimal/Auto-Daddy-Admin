import { Link } from "react-router";

const LOGO = "/logo.png";

const HomePage = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-ad-login-bg px-4 py-10 -mx-4 md:-mx-[160px] md:px-[160px]">
      <p className="absolute right-6 top-6 text-sm font-medium text-ad-green-dark md:text-base">
        Welcome to AutoDaddy
      </p>

      <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-ad-green/30 bg-ad-mint shadow-[8px_8px_24px_rgba(0,0,0,0.12)] md:flex-row">
        {/* Branding */}
        <div className="flex flex-col items-center justify-center border-b border-ad-green/40 p-8 md:w-1/2 md:border-b-0 md:border-r">
          <img src={LOGO} alt="AutoDaddy" className="mb-6 h-24 w-auto" />
          <p className="text-center font-serif italic text-ad-green-dark">
            A Digital Bridge - that connects with
          </p>
          <p className="mt-2 text-center text-lg font-bold text-black">
            Voice of your &lsquo;Happy Customers&rsquo;
          </p>
        </div>

        {/* Sign-in choices */}
        <div className="flex w-full flex-col justify-center gap-4 p-8 md:w-1/2">
          <h1 className="text-center text-xl font-bold text-ad-green-dark md:text-left">
            Sign in to continue
          </h1>
          <p className="text-center text-sm text-gray-600 md:text-left">
            Choose your account type to access the admin panel.
          </p>

          <Link
            to="/admin/signin"
            className="w-full rounded-lg bg-ad-green py-3 text-center text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-ad-green-dark"
          >
            Admin Login
          </Link>

          <Link
            to="/subadmin/signin"
            className="w-full rounded-lg border-2 border-ad-purple bg-white py-3 text-center text-sm font-bold uppercase tracking-wide text-ad-purple transition-colors hover:bg-ad-purple hover:text-white"
          >
            Sub Admin Login
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} AutoDaddy. All rights reserved.
      </p>
    </div>
  );
};

export default HomePage;
