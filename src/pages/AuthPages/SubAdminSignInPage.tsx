import { useState } from "react";
import { Link } from "react-router";
import { FiMail, FiLock } from "react-icons/fi";
import { useAuth, getPostLoginRedirect } from "../../auth";

const API_BASE = `${import.meta.env.VITE_API_URL}/api/auth`;
const LOGO = "/logo.png";

export default function SubAdminSignInPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleLogin() {
    setStatus(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/subadmin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        login({
          token: data.token,
          role: "subadmin",
          permissions: data.user?.permissions || {},
        });
        setStatus("Login successful!");
        setTimeout(() => {
          window.location.href = getPostLoginRedirect("subadmin");
        }, 600);
      } else {
        setStatus(data?.message || "Login failed");
      }
    } catch {
      setStatus("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-ad-login-bg py-10 -mx-4 px-4 md:-mx-10 md:px-10 lg:-mx-14 lg:px-14">
      <p className="absolute right-6 top-6 text-sm font-medium text-ad-green-dark md:text-base">
        Sub Admin Sign In
      </p>

      <div className="flex w-full max-w-3xl overflow-hidden rounded-3xl border border-ad-green/30 bg-ad-mint shadow-[8px_8px_24px_rgba(0,0,0,0.12)]">
        <div className="hidden w-1/2 flex-col items-center justify-center border-r border-ad-green/40 p-8 md:flex">
          <img src={LOGO} alt="AutoDaddy" className="mb-6 h-24 w-auto" />
          <p className="text-center font-serif italic text-ad-green-dark">
            A Digital Bridge - that connects with
          </p>
          <p className="mt-2 text-center text-lg font-bold text-black">
            Voice of your &lsquo;Happy Customers&rsquo;
          </p>
        </div>

        <div className="flex w-full flex-col justify-center p-8 md:w-1/2">
          <div className="mb-6 flex justify-center md:hidden">
            <img src={LOGO} alt="AutoDaddy" className="h-16 w-auto" />
          </div>

          {status && (
            <div
              className={`mb-4 rounded-lg border px-3 py-2 text-sm ${status.includes("successful")
                  ? "border-green-300 bg-green-50 text-green-800"
                  : "border-red-300 bg-red-50 text-red-700"
                }`}
            >
              {status}
            </div>
          )}

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!loading && email.trim() && password) void handleLogin();
            }}
          >
            <label className="block text-sm text-ad-green-dark">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 focus:border-ad-green focus:outline-none focus:ring-1 focus:ring-ad-green"
              />
            </div>
            <label className="block text-sm text-ad-green-dark">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 focus:border-ad-green focus:outline-none focus:ring-1 focus:ring-ad-green"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full rounded-lg bg-ad-green py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-ad-green-dark disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>

      <Link to="/" className="mt-6 text-sm font-bold text-ad-green-dark hover:underline">
        &lt;&lt; Back to Website
      </Link>
    </div>
  );
}
