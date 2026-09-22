import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { FiImage, FiX } from "react-icons/fi";
import OtpInput from "../../components/form/input/OtpInput";
import {
  buildSessionMeta,
  completeShopOwnerSignup,
  isShopOwnerBackendRole,
  sendShopOwnerSignupOtp,
  verifyMobileOtp,
  type VerifyOtpResponse,
} from "../../api/mobileAuth";
import { useAuth } from "../../auth";
import { formatPhoneDisplay, phoneDigits } from "../../lib/phoneFormat";
import { FormFieldError } from "../../lib/validation/formUi";

/**
 * Shop owner sign-up: phone → OTP → business details.
 * Route: /shop/signup — linked from the login page.
 */

const LOGO = "/logo.png";
const RESEND_COOLDOWN_SEC = 5 * 60;

const COUNTRY = { code: "+1", flag: "🇨🇦", label: "Canada" } as const;

type Step = "phone" | "otp" | "details";

const STEP_LABELS: Record<Step, string> = {
  phone: "Create your shop account",
  otp: "Verify your number",
  details: "Tell us about your shop",
};

const inputClass =
  "w-full rounded-md border border-gray-400 bg-white py-2 px-3 text-sm focus:border-ad-green focus:outline-none disabled:opacity-60";
const primaryButtonClass =
  "w-full rounded-md bg-ad-green py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm hover:bg-ad-green-dark disabled:opacity-60";

function formatCooldown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export default function ShopOwnerSignUpPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [verified, setVerified] = useState<VerifyOtpResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const countryCode = COUNTRY.code;
  const digits = phoneDigits(phone);

  useEffect(() => {
    if (step !== "otp" || resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, resendCooldown]);

  useEffect(() => {
    if (!logo) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logo);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logo]);

  function signIn(data: VerifyOtpResponse, profileName?: string, businessComplete?: boolean) {
    const meta = buildSessionMeta(data, digits, countryCode);
    login({
      token: data.token!,
      role: "auto_shop_owner",
      meta: businessComplete
        ? { ...meta, isProfileComplete: true, isAutoShopBusinessProfileComplete: true }
        : meta,
      profile: { name: profileName ?? data.name, phone: digits, profilePhoto: data.profilePhoto ?? null },
    });
  }

  async function sendOtp() {
    if (digits.length !== 10) {
      setErrors({ phone: "Enter a valid 10-digit mobile number." });
      return;
    }
    setErrors({});
    setStatus(null);
    setLoading(true);
    try {
      const res = await sendShopOwnerSignupOtp(digits, countryCode);
      if (!res.ok || res.data?.success === false) {
        setStatus({ text: res.data?.message || "Failed to send OTP.", ok: false });
        return;
      }
      setOtp("");
      setStep("otp");
      setResendCooldown(RESEND_COOLDOWN_SEC);
      setStatus({ text: res.data?.message || "OTP sent! Please check your phone.", ok: true });
    } catch {
      setStatus({ text: "An error occurred.", ok: false });
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setErrors({ otp: "Enter the 6-digit OTP." });
      return;
    }
    setErrors({});
    setStatus(null);
    setLoading(true);
    try {
      const res = await verifyMobileOtp(digits, countryCode, otp.trim());
      const data = res.data;
      if (!res.ok || !data?.token) {
        setStatus({ text: data?.message || "OTP verification failed.", ok: false });
        return;
      }
      if (!isShopOwnerBackendRole(data.role)) {
        setStatus({ text: "This number is registered as a car owner, not a shop.", ok: false });
        return;
      }
      if (data.isAutoShopBusinessProfileComplete) {
        // Existing shop — nothing left to fill in, just sign in.
        signIn(data);
        setStatus({ text: "Welcome back! Signing you in…", ok: true });
        window.setTimeout(() => navigate("/shop/welcome", { replace: true }), 800);
        return;
      }
      setVerified(data);
      if (data.name) setName(data.name);
      setStep("details");
      setStatus({ text: "Number verified. Just a few shop details left.", ok: true });
    } catch {
      setStatus({ text: "An error occurred.", ok: false });
    } finally {
      setLoading(false);
    }
  }

  async function completeSignup(e: FormEvent) {
    e.preventDefault();
    if (!verified?.token) return;
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Your name is required.";
    if (!businessName.trim()) nextErrors.businessName = "Business name is required.";
    if (!city.trim()) nextErrors.city = "City is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStatus(null);
    setLoading(true);
    try {
      const res = await completeShopOwnerSignup(verified.token, { name, businessName, city, businessLogo: logo });
      if (!res.ok || res.data?.success === false) {
        setStatus({ text: res.data?.message || "Could not complete sign-up.", ok: false });
        return;
      }
      signIn(verified, res.data?.data?.name ?? name.trim(), true);
      setStatus({ text: "Sign-up complete! Taking you to your shop…", ok: true });
      window.setTimeout(() => navigate("/shop/welcome", { replace: true }), 800);
    } catch {
      setStatus({ text: "An error occurred.", ok: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ad-login-bg py-8 -mx-4 px-4 md:-mx-10 md:px-10 lg:-mx-14 lg:px-14">
      <div className="w-full max-w-3xl">
        <div className="relative">
          <p className="mb-2 text-right text-sm font-medium text-ad-green-dark md:absolute md:-top-7 md:right-0 md:mb-0">
            {STEP_LABELS[step]}
          </p>

          <div className="flex min-h-[320px] overflow-hidden rounded-xl bg-ad-mint shadow-[6px_6px_20px_rgba(0,0,0,0.12)] md:min-h-[400px]">
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
                <img src={LOGO} alt="AutoDaddy" className="block h-auto w-full max-w-[280px] object-contain" />
              </div>

              <ol className="mx-auto mb-5 flex w-full max-w-xs items-center gap-2" aria-label="Sign-up progress">
                {(["phone", "otp", "details"] as Step[]).map((s, i) => {
                  const current = ["phone", "otp", "details"].indexOf(step);
                  return (
                    <li
                      key={s}
                      className={`h-1.5 flex-1 rounded-full ${i <= current ? "bg-ad-green" : "bg-gray-300"}`}
                      aria-current={i === current ? "step" : undefined}
                    />
                  );
                })}
              </ol>

              {status && (
                <div
                  className={`mx-auto mb-4 w-full max-w-xs rounded-lg border px-3 py-1.5 text-sm ${
                    status.ok
                      ? "border-green-300 bg-green-50 text-green-800"
                      : "border-red-300 bg-red-50 text-red-700"
                  }`}
                >
                  {status.text}
                </div>
              )}

              {step === "phone" && (
                <form
                  className="mx-auto w-full max-w-xs space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendOtp();
                  }}
                >
                  <div>
                    <label className="mb-1 block text-sm text-gray-500">Mobile Number</label>
                    <div className="flex">
                      <div
                        aria-label="Country code"
                        title="Canada +1"
                        className="flex shrink-0 items-center rounded-l-md border border-r-0 border-gray-400 bg-gray-300 px-2 py-2 text-sm text-gray-700"
                      >
                        {COUNTRY.flag} {COUNTRY.code}
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        autoComplete="tel-national"
                        placeholder="781 708 9765"
                        maxLength={12}
                        onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
                        disabled={loading}
                        className="w-full rounded-r-md border border-gray-400 bg-white py-2 px-3 text-sm focus:border-ad-green focus:outline-none"
                      />
                    </div>
                    <FormFieldError message={errors.phone} />
                  </div>

                  <button type="submit" disabled={loading} className={primaryButtonClass}>
                    {loading ? "Sending..." : "Get OTP"}
                  </button>
                  <p className="text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link to="/" className="font-semibold text-ad-green-dark hover:underline">
                      Log in
                    </Link>
                  </p>
                </form>
              )}

              {step === "otp" && (
                <form className="mx-auto w-full max-w-xs space-y-4" onSubmit={verifyOtp}>
                  <label className="block text-sm text-ad-green-dark">
                    OTP sent to {COUNTRY.code} {phone}
                  </label>
                  <OtpInput value={otp} onChange={setOtp} disabled={loading} autoFocus />
                  <FormFieldError message={errors.otp} />
                  <button type="submit" disabled={loading} className={primaryButtonClass}>
                    {loading ? "Verifying..." : "Verify"}
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
                        onClick={() => void sendOtp()}
                        disabled={loading}
                        className="font-semibold text-ad-green-dark hover:underline disabled:opacity-60"
                      >
                        Resend OTP
                      </button>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOtp("");
                      setStep("phone");
                      setResendCooldown(0);
                      setStatus(null);
                      setErrors({});
                    }}
                    disabled={loading}
                    className="w-full text-sm text-ad-green-dark hover:underline"
                  >
                    ← Change Mobile Number
                  </button>
                </form>
              )}

              {step === "details" && (
                <form className="mx-auto w-full max-w-xs space-y-3" onSubmit={completeSignup} noValidate>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={loading}
                      className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-400 bg-white text-gray-400 hover:border-ad-green hover:text-ad-green"
                      aria-label="Upload business logo"
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Business logo preview" className="size-full object-cover" />
                      ) : (
                        <FiImage size={22} />
                      )}
                    </button>
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold text-gray-700">Business logo</p>
                      <p className="text-xs text-gray-500">Optional · PNG or JPG</p>
                      {logo ? (
                        <button
                          type="button"
                          onClick={() => {
                            setLogo(null);
                            if (logoInputRef.current) logoInputRef.current.value = "";
                          }}
                          className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                        >
                          <FiX size={12} /> Remove
                        </button>
                      ) : null}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-500">Your Name *</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Sagar Sharma"
                      autoComplete="name"
                      disabled={loading}
                      className={inputClass}
                    />
                    <FormFieldError message={errors.name} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-500">Business Name *</label>
                    <input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Sagar Auto Works"
                      autoComplete="organization"
                      disabled={loading}
                      className={inputClass}
                    />
                    <FormFieldError message={errors.businessName} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-500">City *</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Mississauga"
                      autoComplete="address-level2"
                      disabled={loading}
                      className={inputClass}
                    />
                    <FormFieldError message={errors.city} />
                  </div>

                  <button type="submit" disabled={loading} className={`${primaryButtonClass} !mt-4`}>
                    {loading ? "Creating account..." : "Complete Sign-Up"}
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
