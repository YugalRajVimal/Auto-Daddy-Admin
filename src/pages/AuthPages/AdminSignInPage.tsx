import { useState } from "react";
import { FiLock } from "react-icons/fi";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#eefbee] px-2 py-4 md:px-3">
      <div className="w-full max-w-md">
        <div className="relative">
          <p className="mb-1 text-right text-xs font-medium text-ad-green-dark md:absolute md:-top-4 md:right-0 md:mb-0">
            Login to your account
          </p>

          <div className="flex overflow-hidden rounded-lg bg-ad-mint shadow-[3px_3px_10px_rgba(0,0,0,0.1)]">
            {/* Left branding */}
            <div className="hidden w-1/2 flex-col items-center justify-center border-r border-ad-green-dark/50 px-3 py-4 md:flex">
              <img
                src={LOGO}
                alt="AutoDaddy"
                className="mb-3 block h-auto w-full max-w-[90px] shrink-0 object-contain"
              />
              <p className="max-w-[110px] text-center font-serif text-[10px] italic leading-snug text-ad-green-dark">
                A Digital Bridge - that connects with
              </p>
              <p className="mt-1 max-w-[110px] text-center text-xs font-bold leading-tight text-black">
                Voice of your &lsquo;Happy Customers&rsquo;
              </p>
            </div>

            {/* Right form */}
            <div className="flex w-full flex-col justify-center px-3 py-4 sm:px-4 md:w-1/2 md:px-4 md:py-5">
              <div className="mb-2 flex justify-center md:hidden">
                <img
                  src={LOGO}
                  alt="AutoDaddy"
                  className="block h-auto w-full max-w-[80px] object-contain"
                />
              </div>

              {status && (
                <div
                  className={`mb-2 rounded border px-2 py-1 text-xs ${
                    status.includes("successful") || status.includes("sent")
                      ? "border-green-300 bg-green-50 text-green-800"
                      : "border-red-300 bg-red-50 text-red-700"
                  }`}
                >
                  {status}
                </div>
              )}

              {!otpSent ? (
                <div className="mx-auto w-full max-w-[200px] space-y-2">
                  <label className="block text-xs text-gray-500">Mobile Number</label>
                  <div className="flex">
                    <div className="flex items-center rounded-l border border-r-0 border-gray-400 bg-gray-300 px-2 py-1 text-xs text-gray-700">
                      <span>+1</span>
                      <span className="ml-1 text-[8px]">v</span>
                    </div>
                    <input
                      type="text"
                      value={email}
                      autoComplete="username"
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-r border border-gray-400 bg-white py-1 px-2 text-xs focus:border-ad-green focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading || !email.trim()}
                    className="w-full rounded bg-ad-green py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm hover:bg-ad-green-dark disabled:opacity-60"
                  >
                    {loading ? "Sending..." : "Get OTP"}
                  </button>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-[200px] space-y-2">
                  <label className="block text-xs text-ad-green-dark">OTP</label>
                  <div className="relative">
                    <FiLock className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-gray-400" />
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      disabled={loading}
                      className="w-full rounded border border-gray-400 bg-white py-1 pl-7 pr-2 text-xs focus:border-ad-green focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading || !otp.trim()}
                    className="w-full rounded bg-ad-green py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm hover:bg-ad-green-dark disabled:opacity-60"
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
                    ← Back to Mobile Number
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <a
          href="https://autodaddy.ca"
          className="mt-2.5 inline-block text-xs font-bold text-ad-green-dark hover:underline"
        >
          &lt;&lt; Back to Website
        </a>
      </div>
    </div>
  );
}
