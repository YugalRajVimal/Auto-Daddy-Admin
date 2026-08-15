import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import OtpInput from "../../components/form/input/OtpInput";
import { useAuth, getPostLoginRedirect } from "../../auth";
import { getPortalForRole } from "../../auth/roleRegistry";
import type { UserRole } from "../../auth/types";
import { formatPhoneDisplay, phoneDigits } from "../../lib/phoneFormat";
import { FormFieldError } from "../../lib/validation/formUi";
import {
  signInPhoneSchema,
  signInOtpSchema,
  type SignInPhoneValues,
  type SignInOtpValues,
} from "../../lib/validation/schemas/identity";

const API_BASE = `${import.meta.env.VITE_API_URL}/api/auth`;
const LOGO = "/logo.png";
const RESEND_COOLDOWN_SEC = 5 * 60;
const DEFAULT_COUNTRY = { id: "CA", flag: "🇨🇦", label: "Canada", code: "+1" } as const;
const ADMIN_PORTAL_ROLES: UserRole[] = [
  "admin",
  "role_admin",
  "sub_admin",
  "associates",
  "subadmin",
];

function formatCooldown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function mapAdminStaffRole(raw: unknown): UserRole {
  const normalized = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (
    normalized === "role_admin" ||
    normalized === "sub_admin" ||
    normalized === "associates" ||
    normalized === "subadmin"
  ) {
    return normalized;
  }
  return "admin";
}

export default function AdminStaffSignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, role } = useAuth();
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    handleSubmit: handleRequestSubmit,
    watch: watchRequest,
    setValue: setRequestValue,
    formState: { errors: requestErrors },
  } = useForm<SignInPhoneValues>({
    resolver: zodResolver(signInPhoneSchema),
    mode: "onSubmit",
    defaultValues: { phone: "" },
  });
  const phone = watchRequest("phone");
  const countryCode = DEFAULT_COUNTRY.code;
  const nationalPhoneDigits = phoneDigits(phone ?? "");

  const {
    handleSubmit: handleOtpSubmit,
    setValue: setOtpValue,
    watch: watchOtp,
    reset: resetOtp,
    formState: { errors: otpErrors },
  } = useForm<SignInOtpValues>({
    resolver: zodResolver(signInOtpSchema),
    mode: "onSubmit",
    defaultValues: { otp: "" },
  });
  const otp = watchOtp("otp");

  useEffect(() => {
    if (!isLoading && isAuthenticated && role && getPortalForRole(role) === "admin") {
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

  function getAuthPayload() {
    return { countryCode, phone: nationalPhoneDigits, role: "admin" as const };
  }

  async function handleSendOtp() {
    setStatus(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getAuthPayload()),
      });
      const data = await res.json();
      if (res.ok) {
        const isResend = otpSent;
        setOtpSent(true);
        setResendCooldown(RESEND_COOLDOWN_SEC);
        if (isResend) setOtpValue("otp", "");
        setStatus("OTP sent! Please check your phone.");
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

  async function handleVerifyOtp(values: SignInOtpValues) {
    setStatus(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/verify-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...getAuthPayload(), otp: values.otp }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        const userRole = mapAdminStaffRole(data.role);
        if (!ADMIN_PORTAL_ROLES.includes(userRole)) {
          setStatus("This account type is not supported on the admin portal.");
          return;
        }

        login({ token: data.token, role: userRole, permissions: data.permissions });
        localStorage.setItem("permission", JSON.stringify(data.permissions ?? null));

        setStatus("Login successful!");
        const rawFrom = (location.state as { from?: unknown } | null)?.from;
        const from =
          typeof rawFrom === "string"
            ? rawFrom
            : rawFrom && typeof rawFrom === "object" && "pathname" in rawFrom
              ? String((rawFrom as { pathname?: string }).pathname ?? "")
              : "";
        const redirect =
          from.startsWith("/admin") && from !== "/admin" && from !== "/admin/"
            ? from
            : getPostLoginRedirect(userRole);
        setTimeout(() => {
          navigate(redirect, { replace: true });
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-ad-login-bg py-8 -mx-4 px-4 md:-mx-10 md:px-10 lg:-mx-14 lg:px-14">
      <div className="w-full max-w-3xl">
        <div className="relative">
          <p className="mb-2 text-right text-sm font-medium text-ad-green-dark md:absolute md:-top-7 md:right-0 md:mb-0">
            Admin &amp; Staff Login
          </p>

          <div className="flex min-h-[320px] overflow-hidden rounded-xl bg-ad-mint shadow-[6px_6px_20px_rgba(0,0,0,0.12)] md:min-h-[360px]">
            <div className="hidden w-1/2 flex-col items-center justify-center border-r border-ad-green-dark/50 px-6 py-8 md:flex lg:px-8">
              <img
                src={LOGO}
                alt="AutoDaddy"
                className="mb-6 block h-auto w-full max-w-[300px] shrink-0 object-contain lg:max-w-[340px]"
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
                  className="block h-auto w-full max-w-[280px] object-contain"
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
                <form
                  className="mx-auto w-full max-w-xs space-y-4"
                  onSubmit={handleRequestSubmit(handleSendOtp)}
                >
                  <div>
                    <label className="mb-1 block text-sm text-gray-500">Mobile Number</label>
                    <div className="flex">
                      <div
                        aria-label="Country code"
                        title="Canada +1"
                        className="flex shrink-0 items-center rounded-l-md border border-r-0 border-gray-400 bg-gray-300 px-2 py-2 text-sm text-gray-700"
                      >
                        {DEFAULT_COUNTRY.flag} {DEFAULT_COUNTRY.code}
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        autoComplete="tel-national"
                        placeholder="781 708 9765"
                        maxLength={12}
                        onChange={(e) =>
                          setRequestValue("phone", formatPhoneDisplay(e.target.value), {
                            shouldValidate: false,
                          })
                        }
                        disabled={loading}
                        className="w-full rounded-r-md border border-gray-400 bg-white py-2 px-3 text-sm focus:border-ad-green focus:outline-none"
                      />
                    </div>
                    <FormFieldError message={requestErrors.phone?.message} />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-md bg-ad-green py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm hover:bg-ad-green-dark disabled:opacity-60"
                  >
                    {loading ? "Sending..." : "Get OTP"}
                  </button>
                </form>
              ) : (
                <form
                  className="mx-auto w-full max-w-xs space-y-4"
                  onSubmit={handleOtpSubmit(handleVerifyOtp)}
                >
                  <label className="block text-sm text-ad-green-dark">OTP</label>
                  <OtpInput
                    value={otp}
                    onChange={(v) => setOtpValue("otp", v, { shouldValidate: false })}
                    disabled={loading}
                    autoFocus
                  />
                  <FormFieldError message={otpErrors.otp?.message} />
                  <button
                    type="submit"
                    disabled={loading}
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
                      resetOtp({ otp: "" });
                      setOtpSent(false);
                      setResendCooldown(0);
                      setStatus(null);
                    }}
                    disabled={loading}
                    className="w-full text-sm text-ad-green-dark hover:underline"
                  >
                    ← Back to Mobile Number
                  </button>
                </form>
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
