import { useEffect, useState } from "react";
import OtpInput from "../../components/form/input/OtpInput";

const ADMIN_ROLE = "admin";
const ADMIN_TOKEN_KEY = "admin-token";
const ADMIN_HOME = "/admin";
const API_BASE = `${import.meta.env.VITE_API_URL}/api/auth`;
const LOGO = "/logo.png";
const RESEND_COOLDOWN_SEC = 5 * 60;

function formatCooldown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export default function AdminSignInPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!otpSent || resendCooldown <= 0) return;
    const timer = window.setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [otpSent, resendCooldown]);

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
        const isResend = otpSent;
        setOtpSent(true);
        setResendCooldown(RESEND_COOLDOWN_SEC);
        if (isResend) setOtp("");
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

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    await handleSendOtp();
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-ad-login-bg py-8 -mx-4 px-4 md:-mx-[160px] md:px-[160px]">
      <div className="w-full max-w-3xl">
        <div className="relative">
          <p className="mb-2 text-right text-sm font-medium text-ad-green-dark md:absolute md:-top-7 md:right-0 md:mb-0">
            Login to your account
          </p>

          <div className="flex min-h-[320px] overflow-hidden rounded-xl bg-ad-mint shadow-[6px_6px_20px_rgba(0,0,0,0.12)] md:min-h-[360px]">
            {/* Left branding */}
            <div className="hidden w-1/2 flex-col items-center justify-center border-r border-ad-green-dark/50 px-6 py-8 md:flex lg:px-8">
              <img
                src={LOGO}
                alt="AutoDaddy"
                className="mb-6 block h-auto w-full max-w-[180px] shrink-0 object-contain lg:max-w-[200px]"
              />
              <p className="max-w-[220px] text-center font-serif text-sm italic leading-relaxed text-ad-green-dark">
                A Digital Bridge - that connects with
              </p>
              <p className="mt-2 whitespace-nowrap text-center text-base font-bold leading-snug text-black">
                Voice of your &lsquo;Happy Customers&rsquo;
              </p>
            </div>

            {/* Right form */}
            <div className="flex w-full flex-col justify-center px-6 py-8 sm:px-8 md:w-1/2 md:px-8 md:py-10">
              <div className="mb-5 flex justify-center md:hidden">
                <img
                  src={LOGO}
                  alt="AutoDaddy"
                  className="block h-auto w-full max-w-[160px] object-contain"
                />
              </div>

              {status && (
                <div
                  className={`mb-4 rounded-lg border px-3 py-1.5 text-sm ${status.includes("successful") || status.includes("sent")
                    ? "border-green-300 bg-green-50 text-green-800"
                    : "border-red-300 bg-red-50 text-red-700"
                    }`}
                >
                  {status}
                </div>
              )}

              {!otpSent ? (
                <div className="mx-auto w-full max-w-xs space-y-4">
                  <label className="block text-sm text-gray-500">Mobile Number</label>
                  <div className="flex">
                    <div className="flex items-center rounded-l-md border border-r-0 border-gray-400 bg-gray-300 px-3 py-2 text-sm text-gray-700">
                      <span>+1</span>
                      <span className="ml-1.5 text-[10px]">v</span>
                    </div>
                    <input
                      type="text"
                      value={email}
                      autoComplete="username"
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-r-md border border-gray-400 bg-white py-2 px-3 text-sm focus:border-ad-green focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading || !email.trim()}
                    className="w-full rounded-md bg-ad-green py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm hover:bg-ad-green-dark disabled:opacity-60"
                  >
                    {loading ? "Sending..." : "Get OTP"}
                  </button>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-xs space-y-4">
                  <label className="block text-sm text-ad-green-dark">OTP</label>
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length !== 6}
                    className="w-full rounded-md bg-ad-green py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm hover:bg-ad-green-dark disabled:opacity-60"
                  >
                    {loading ? "Verifying..." : "Verify & Login"}
                  </button>
                  <p className="text-center text-sm text-gray-500">
                    Didn&apos;t receive the code?{" "}
                    {resendCooldown > 0 ? (
                      <span className="font-medium text-ad-green-dark">
                        Resend in {formatCooldown(resendCooldown)}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="font-semibold text-ad-green-dark hover:underline disabled:opacity-60"
                      >
                        {loading ? "Sending..." : "Resend OTP"}
                      </button>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOtp("");
                      setOtpSent(false);
                      setResendCooldown(0);
                      setStatus(null);
                    }}
                    disabled={loading}
                    className="w-full text-sm text-ad-green-dark hover:underline"
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
          className="mt-5 inline-block text-sm font-bold text-ad-green-dark hover:underline"
        >
          &lt;&lt; Back to Website
        </a>
      </div>
    </div>
  );
}
