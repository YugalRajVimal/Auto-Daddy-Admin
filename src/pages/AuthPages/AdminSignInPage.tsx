import { useState } from "react";
import { Link } from "react-router";
import { FiMail, FiLock } from "react-icons/fi";

const ADMIN_ROLE = "admin";
const ADMIN_TOKEN_KEY = "admin-token";
const ADMIN_HOME = "/admin";
const API_BASE = `${import.meta.env.VITE_API_URL}/api/auth`;
const LOGO = "/autodaddy-logo.png";

export default function AdminSignInPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSendOtp() {
    setStatus(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role: ADMIN_ROLE }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setStatus("OTP sent! Please check your email.");
      } else {
        setOtpSent(false);
        setStatus(data?.message || "Failed to send OTP");
      }
    } catch {
      setStatus("An error occurred.");
      setOtpSent(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setStatus(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/verify-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role: ADMIN_ROLE,
          otp,
        }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        setStatus("Login successful!");
        setTimeout(() => {
          window.location.href = ADMIN_HOME;
        }, 800);
      } else {
        setStatus(data?.message || "OTP verification failed");
      }
    } catch {
      setStatus("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-white px-4 py-10">
      <p className="absolute right-6 top-6 text-sm font-medium text-ad-green-dark md:text-base">
        Login to your account
      </p>

      <div className="flex w-full max-w-3xl overflow-hidden rounded-3xl border border-ad-green/30 bg-ad-mint shadow-[8px_8px_24px_rgba(0,0,0,0.12)]">
        {/* Left branding */}
        <div className="hidden w-1/2 flex-col items-center justify-center border-r border-ad-green/40 p-8 md:flex">
          <img src={LOGO} alt="AutoDaddy" className="mb-6 h-24 w-auto" />
          <p className="text-center font-serif italic text-ad-green-dark">
            A Digital Bridge - that connects with
          </p>
          <p className="mt-2 text-center text-lg font-bold text-black">
            Voice of your &lsquo;Happy Customers&rsquo;
          </p>
        </div>

        {/* Right form */}
        <div className="flex w-full flex-col justify-center p-8 md:w-1/2">
          <div className="mb-6 flex justify-center md:hidden">
            <img src={LOGO} alt="AutoDaddy" className="h-16 w-auto" />
          </div>

          {status && (
            <div
              className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                status.includes("successful") || status.includes("sent")
                  ? "border-green-300 bg-green-50 text-green-800"
                  : "border-red-300 bg-red-50 text-red-700"
              }`}
            >
              {status}
            </div>
          )}

          {!otpSent ? (
            <div className="space-y-4">
              <label className="block text-sm text-ad-green-dark">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  autoComplete="username"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your admin email"
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 focus:border-ad-green focus:outline-none focus:ring-1 focus:ring-ad-green"
                />
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || !email.trim()}
                className="w-full rounded-lg bg-ad-green py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-ad-green-dark disabled:opacity-60"
              >
                {loading ? "Sending..." : "Get OTP"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm text-ad-green-dark">OTP</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP from email"
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 focus:border-ad-green focus:outline-none focus:ring-1 focus:ring-ad-green"
                />
              </div>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || !otp.trim()}
                className="w-full rounded-lg bg-ad-green py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-ad-green-dark disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOtp("");
                  setOtpSent(false);
                  setStatus(null);
                }}
                disabled={loading}
                className="w-full text-xs text-ad-green-dark hover:underline"
              >
                ← Back to Email
              </button>
            </div>
          )}
        </div>
      </div>

      <Link
        to="/"
        className="mt-6 text-sm font-bold text-ad-green-dark hover:underline"
      >
        &lt;&lt; Back to Website
      </Link>
    </div>
  );
}
