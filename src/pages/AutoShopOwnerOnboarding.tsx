import React, { useState } from "react";
import axios from "axios";

/**
 * Onboarding and verification for autoshopowner.
 * Implements flows for:
 *   /api/auth/signUpLogInAndCompleteProfileAutoShopOwner  [sign up/login & profile]
 *   /api/auth/verify-otp                                 [verify OTP]
 *
 * Server source: Auth Controller (signUpLogInAndCompleteProfileAutoShopOwner, verifyAccount)
 *
 * Country code is fixed to Canada (+1).
 */

const DEFAULT_COUNTRY_CODE = "+1";

const API_BASE = import.meta.env.VITE_API_URL || "";

// All dark text colors
const darkText = "text-gray-900";


// Adapt InputField to all dark
const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <label className={`text-sm font-semibold ${darkText}`}>{label}</label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      className={`px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-700 transition ${darkText} bg-white`}
      {...props}
    />
  </div>
);

const Stepper = ({ step }: { step: number }) => (
  <div className="flex justify-center mb-8 gap-4">
    {["Information", "OTP", "Done"].map((label, idx) => (
      <div key={label} className="flex flex-col items-center">
        <div
          className={`w-8 h-8 flex items-center justify-evenly rounded-full border-2 ${
            step === idx + 1
              ? "bg-green-800 border-green-600 text-white"
              : step > idx + 1
              ? "bg-gray-200 border-gray-400 text-gray-700"
              : "bg-gray-200 border-gray-400 text-gray-700"
          }`}
        >
          {step > idx + 1 ? (
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
              <path d="M5 10.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            idx + 1
          )}
        </div>
        <span
          className={`mt-1 text-xs font-medium ${
            step === idx + 1
              ? "text-primary-900"
              : step > idx + 1
              ? "text-green-900"
              : "text-gray-600"
          }`}
        >
          {label}
        </span>
      </div>
    ))}
  </div>
);

const AutoShopOwnerOnboarding: React.FC = () => {
  const [step, setStep] = useState<"form" | "otp" | "verified" | "error">("form");
  const [form, setForm] = useState({
    phone: "",
    email: "",
    name: "",
    pincode: "",
    address: "",
  });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Handle input change for form fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Submit the registration/profile form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE}/api/auth/autoshopowner/sign-up-log-in-complete-profile`,
        { ...form, countryCode: DEFAULT_COUNTRY_CODE }
      );
      setLoading(false);
      if (res.data && res.data.userId) {
        setStep("otp");
        setOtpSent(true);
      } else {
        setError(res.data.message || "Unknown error. Please try again.");
        setStep("error");
      }
    } catch (err: any) {
      setLoading(false);
      setError(
        err?.response?.data?.message ||
          "Error during onboarding. Please try again."
      );
      setStep("error");
    }
  };

  // Submit the OTP for verification
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/verify-otp`, {
        countryCode: DEFAULT_COUNTRY_CODE,
        phone: form.phone,
        otp,
      });
      setLoading(false);
      if (res.data && res.data.token) {
        setStep("verified");
      } else {
        setError(res.data.message || "OTP verification failed.");
        setStep("error");
      }
    } catch (err: any) {
      setLoading(false);
      setError(
        err?.response?.data?.message ||
          "OTP verification failed. Please try again."
      );
      setStep("error");
    }
  };

  // Retry from the start if there was an error
  const handleRetry = () => {
    setStep("form");
    setOtp("");
    setError("");
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setResendLoading(true);
    setError("");
    try {
      await axios.post(
        `${API_BASE}/api/auth/autoshopowner/sign-up-log-in-complete-profile`,
        { ...form, countryCode: DEFAULT_COUNTRY_CODE }
      );
      setOtpSent(true);
      setResendLoading(false);
    } catch (err: any) {
      setResendLoading(false);
      setError("Failed to resend OTP. Please try again.");
    }
  };

  // For Stepper: step = 1 (form), 2 (otp), 3 (verified)
  const currentStepNum = step === "form" ? 1 : step === "otp" ? 2 : 3;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-lg w-full mx-auto bg-white rounded-3xl shadow-2xl border border-gray-200 p-0 overflow-hidden">
        {/* Header with logo and title */}
        <div className="bg-primary-700 py-7 px-8 flex flex-col items-center">
          <img src="/logo.png" alt="AutoDaddy" className="mb-3 h-12 w-auto object-contain" />
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            AutoShop Owner Onboarding
          </h1>
          <p className="mt-2 text-gray-800 text-sm text-center">
            Create your garage account and verify your phone number
          </p>
        </div>
        <div className="px-8 pb-10 pt-7">

          <Stepper step={currentStepNum} />

          {/* FORM STEP */}
          {step === "form" && (
            <form
              onSubmit={handleFormSubmit}
              autoComplete="off"
              className="space-y-6"
            >
              <InputField
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                type="tel"
                required
                pattern="\d{5,15}"
                placeholder="Phone number"
                autoComplete="tel-local"
              />
              <InputField
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
                placeholder="Full Name"
              />
              <InputField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="your@email.com"
              />
              <div className="flex gap-4">
                <div className="w-1/2">
                  <InputField
                    label="Pincode"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    required
                    placeholder="Postal Code"
                  />
                </div>
                <div className="flex-1">
                  <InputField
                    label="Address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    placeholder="Shop Address"
                  />
                </div>
              </div>
              {error && (
                <div className="bg-red-100 text-red-900 border border-red-300 rounded px-3 py-2 text-sm text-center">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-3 py-3 px-4 bg-blue-400 hover:bg-blue-200 text-black text-base font-bold rounded-xl shadow transition-all flex items-center justify-center ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit"
                )}
              </button>
            </form>
          )}

          {/* OTP STEP */}
          {step === "otp" && (
            <form
              onSubmit={handleOtpSubmit}
              autoComplete="off"
              className="space-y-7 flex flex-col items-center"
            >
              <div className="flex flex-col items-center mb-2">
                <svg className="w-12 h-12 mb-2 text-primary-900" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="3" fill="none" />
                  <path
                    d="M28 16l-9 9-4-4"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Verify Your Account</h2>
                <p className="text-gray-900 text-sm mb-2">
                  We sent a 6-digit OTP to <span className="font-semibold">{DEFAULT_COUNTRY_CODE} {form.phone}</span>
                </p>
                {otpSent && (
                  <span className="text-xs text-green-900 mb-1">OTP sent!</span>
                )}
              </div>
              <div className="flex flex-col items-center w-full">
                <label className={`text-sm mb-2 ${darkText} font-medium`}>Enter OTP</label>
                <input
                  name="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  pattern="\d{6}"
                  maxLength={6}
                  minLength={6}
                  inputMode="numeric"
                  placeholder="______"
                  className={`w-48 px-6 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-800 text-center tracking-widest font-mono text-2xl bg-white ${darkText}`}
                  autoComplete="one-time-code"
                  style={{ letterSpacing: "0.7em" }}
                />
              </div>
              {error && (
                <div className="bg-red-100 text-red-900 border border-red-300 rounded px-3 py-2 text-sm text-center w-full">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 bg-primary-900 hover:bg-primary-950 text-white text-base font-bold rounded-xl shadow transition-all flex items-center justify-center ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Verify OTP"
                )}
              </button>
              <div className="mt-2 text-xs text-center text-gray-900 w-full">
                Didn't get the code?
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className={`ml-2 inline text-primary-900 font-semibold hover:underline transition ${resendLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {resendLoading ? "Resending..." : "Resend"}
                </button>
              </div>
            </form>
          )}

          {/* VERIFIED STEP */}
          {step === "verified" && (
            <div className="text-center px-4 py-10 flex flex-col items-center">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-20 h-20 text-green-900" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path
                    d="M14 26l7 7 13-13"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-1 text-green-900">
                Verification Complete!
              </h2>
              <p className="text-lg text-gray-900 mb-2">
                Your AutoShop Owner account has been verified. Welcome aboard!
              </p>
              <div className="mt-4 bg-green-100 border border-green-200 rounded-lg px-4 py-3 mx-auto text-green-900 text-sm max-w-xs">
                You will now be redirected to your dashboard, or you can close this page.
              </div>
            </div>
          )}

          {/* ERROR STEP */}
          {step === "error" && (
            <div className="text-center px-4 py-10 flex flex-col items-center">
              <svg className="w-16 h-16 text-red-800 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="4" fill="none" />
                <path
                  d="M18 18L30 30M30 18L18 30"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h3 className="text-2xl font-bold text-red-800 mb-2">Something went wrong</h3>
              <p className={`mb-4 ${darkText}`}>{error}</p>
              <button
                className="px-7 py-3 rounded-xl shadow bg-red-800 hover:bg-red-900 text-white font-semibold text-base transition"
                onClick={handleRetry}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoShopOwnerOnboarding;