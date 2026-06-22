import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import OtpInput from "../../components/form/input/OtpInput";
import {
  buildSessionMeta,
  getJson,
  mapBackendRoleToUserRole,
  normalizePhoneDigits,
  sendMobileOtp,
  verifyMobileOtp,
} from "../../api/mobileAuth";
import { useAuth, getPostLoginRedirect } from "../../auth";
import type { UserRole } from "../../auth/types";

const ADMIN_ROLE = "admin" as const;
const API_BASE = `${import.meta.env.VITE_API_URL}/api/auth`;
const LOGO = "/logo.png";
const RESEND_COOLDOWN_SEC = 5 * 60;

const CALLING_CODES = [
  { id: "CA", flag: "🇨🇦", label: "Canada", code: "+1" },
  { id: "US", flag: "🇺🇸", label: "United States", code: "+1" },
  { id: "IN", flag: "🇮🇳", label: "India", code: "+91" },
  { id: "GB", flag: "🇬🇧", label: "United Kingdom", code: "+44" },
  { id: "AU", flag: "🇦🇺", label: "Australia", code: "+61" },
];

function formatCooldown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function AdminSignInPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, role } = useAuth();
  const [countryId, setCountryId] = useState("CA");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loginWithEmail, setLoginWithEmail] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      navigate(getPostLoginRedirect(role), { replace: true });
    }
  }, [isLoading, isAuthenticated, role, navigate]);

  useEffect(() => {
    if (!otpSent || resendCooldown <= 0) return;
    const timer = window.setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [otpSent, resendCooldown]);

  const countryCode = CALLING_CODES.find((c) => c.id === countryId)?.code ?? "+1";
  const phoneDigits = normalizePhoneDigits(phone);

  function getAdminAuthPayload() {
    if (loginWithEmail) {
      return { email: email.trim().toLowerCase(), role: ADMIN_ROLE };
    }
    return { countryCode, phone: phoneDigits, role: ADMIN_ROLE };
  }

  function canRequestOtp() {
    if (loginWithEmail) return isValidEmail(email);
    return phoneDigits.length === 10;
  }

  async function handleSendOtp() {
    setStatus(null);
    setLoading(true);
    try {
      if (loginWithEmail) {
        const res = await fetch(`${API_BASE}/admin/signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(getAdminAuthPayload()),
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
        return;
      }

      const res = await sendMobileOtp(phoneDigits, countryCode);
      if (res.ok) {
        const isResend = otpSent;
        setOtpSent(true);
        setResendCooldown(RESEND_COOLDOWN_SEC);
        if (isResend) setOtp("");
        setStatus("OTP sent! Please check your phone.");
      } else {
        setOtpSent(false);
        setStatus(res.data?.message || "Failed to send OTP");
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

  async function enrichMobileProfile(
    token: string,
    userRole: UserRole,
    verifyData: Parameters<typeof buildSessionMeta>[0],
    phone: string,
    code: string
  ) {
    const session = {
      token,
      role: userRole,
      meta: buildSessionMeta(verifyData, phone, code),
      profile: {
        name: verifyData.name,
        phone,
        profilePhoto: verifyData.profilePhoto ?? null,
      },
    };
    login(session);

    try {
      const profileRes = await getJson<{
        success?: boolean;
        data?: { name?: string; city?: string; phone?: string; profilePhoto?: string | null };
      }>("/api/user/profile", token);
      const p = profileRes.data?.data;
      if (profileRes.ok && p) {
        login({
          ...session,
          profile: {
            name: p.name ?? verifyData.name,
            phone: p.phone ?? phone,
            city: p.city,
            profilePhoto: p.profilePhoto ?? verifyData.profilePhoto ?? null,
          },
        });
      }
    } catch {
      // optional enrichment
    }
  }

  async function handleVerifyOtp() {
    setStatus(null);
    setLoading(true);
    try {
      if (loginWithEmail) {
        const res = await fetch(`${API_BASE}/admin/verify-account`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...getAdminAuthPayload(), otp }),
        });
        const data = await res.json();
        if (res.ok && data.token) {
          login({ token: data.token, role: ADMIN_ROLE });
          setStatus("Login successful!");
          setTimeout(() => {
            navigate(getPostLoginRedirect(ADMIN_ROLE), { replace: true });
          }, 800);
        } else {
          setStatus(data?.message || "OTP verification failed");
        }
        return;
      }

      const res = await verifyMobileOtp(phoneDigits, countryCode, otp);
      const data = res.data;
      if (!res.ok || !data?.token) {
        setStatus(data?.message || "OTP verification failed");
        return;
      }

      const userRole = mapBackendRoleToUserRole(data.role);
      if (!userRole) {
        setStatus("This account type is not supported on the web app.");
        return;
      }

      await enrichMobileProfile(data.token, userRole, data, phoneDigits, countryCode);
      setStatus("Login successful!");
      setTimeout(() => {
        navigate(getPostLoginRedirect(userRole), { replace: true });
      }, 800);
    } catch {
      setStatus("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ad-login-bg py-8 -mx-4 px-4 md:-mx-10 md:px-10 lg:-mx-14 lg:px-14">
      <div className="w-full max-w-3xl">
        <div className="relative">
          <p className="mb-2 text-right text-sm font-medium text-ad-green-dark md:absolute md:-top-7 md:right-0 md:mb-0">
            Login to your account
          </p>

          <div className="flex min-h-[320px] overflow-hidden rounded-xl bg-ad-mint shadow-[6px_6px_20px_rgba(0,0,0,0.12)] md:min-h-[360px]">
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
                  className={`mb-4 rounded-lg border px-3 py-1.5 text-sm ${
                    status.includes("successful") || status.includes("sent")
                      ? "border-green-300 bg-green-50 text-green-800"
                      : "border-red-300 bg-red-50 text-red-700"
                  }`}
                >
                  {status}
                </div>
              )}

              {!otpSent ? (
                <div className="mx-auto w-full max-w-xs space-y-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={loginWithEmail}
                      onChange={(e) => {
                        setLoginWithEmail(e.target.checked);
                        setStatus(null);
                      }}
                      disabled={loading}
                      className="h-4 w-4 rounded border-gray-400 text-ad-green focus:ring-ad-green"
                    />
                    Login using email
                  </label>

                  {loginWithEmail ? (
                    <div>
                      <label className="mb-1 block text-sm text-gray-500">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        autoComplete="email"
                        placeholder="Enter your email"
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="w-full rounded-md border border-gray-400 bg-white py-2 px-3 text-sm focus:border-ad-green focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-sm text-gray-500">Mobile Number</label>
                      <div className="flex">
                        <div className="relative shrink-0">
                          <select
                            value={countryId}
                            onChange={(e) => setCountryId(e.target.value)}
                            disabled={loading}
                            aria-label="Country code"
                            className="appearance-none rounded-l-md border border-r-0 border-gray-400 bg-gray-300 py-2 pl-2 pr-7 text-sm text-gray-700 focus:border-ad-green focus:outline-none"
                          >
                            {CALLING_CODES.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.flag} {c.code}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">
                            ▼
                          </span>
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          autoComplete="tel-national"
                          placeholder="10-digit number"
                          onChange={(e) =>
                            setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                          }
                          disabled={loading}
                          className="w-full rounded-r-md border border-gray-400 bg-white py-2 px-3 text-sm focus:border-ad-green focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading || !canRequestOtp()}
                    className="w-full rounded-md bg-ad-green py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm hover:bg-ad-green-dark disabled:opacity-60"
                  >
                    {loading ? "Sending..." : "Get OTP"}
                  </button>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-xs space-y-4">
                  <label className="block text-sm text-ad-green-dark">OTP</label>
                  <OtpInput value={otp} onChange={setOtp} disabled={loading} autoFocus />
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
                    ← Back to {loginWithEmail ? "Email" : "Mobile Number"}
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
