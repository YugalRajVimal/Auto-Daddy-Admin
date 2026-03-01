import React, { useState } from "react";
import axios from "axios";

/**
 * Onboarding and verification for autoshopowner.
 * Implements flows for:
 *   /api/auth/signUpLogInAndCompleteProfileAutoShopOwner  [sign up/login & profile]
 *   /api/auth/verify-otp                                 [verify OTP]
 *
 * Server source: Auth Controller (signUpLogInAndCompleteProfileAutoShopOwner, verifyAccount)
 */
const API_BASE = import.meta.env.VITE_API_URL || "";

const AutoShopOwnerOnboarding: React.FC = () => {
  const [step, setStep] = useState<"form" | "otp" | "verified" | "error">("form");
  const [form, setForm] = useState({
    countryCode: "+1",
    phone: "",
    email: "",
    name: "",
    pincode: "",
    address: "",
  });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  // Handle input change for form fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Submit the registration/profile form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(
        `${API_BASE}/api/auth/autoshopowner/sign-up-log-in-complete-profile`,
        { ...form }
      );
      if (res.data && res.data.userId) {
        setStep("otp");
      } else {
        setError(res.data.message || "Unknown error. Please try again.");
        setStep("error");
      }
    } catch (err: any) {
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
    try {
      const res = await axios.post(`${API_BASE}/api/auth/verify-otp`, {
        countryCode: form.countryCode,
        phone: form.phone,
        otp,
      });
      if (res.data && res.data.token) {
        setStep("verified");
      } else {
        setError(res.data.message || "OTP verification failed.");
        setStep("error");
      }
    } catch (err: any) {
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

  return (
    <div className="max-w-md mx-auto mt-14 p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* FORM STEP */}
      {step === "form" && (
        <form
          onSubmit={handleFormSubmit}
          autoComplete="off"
          className="space-y-6"
        >
          <h2 className="text-2xl font-semibold mb-4 text-center text-primary-700">
            AutoShop Owner Onboarding
          </h2>
          <div className="flex gap-3">
            <div className="flex flex-col w-1/3">
              <label className="text-sm mb-1 text-gray-600">Country Code</label>
              <input
                name="countryCode"
                value={form.countryCode}
                onChange={handleChange}
                required
                pattern="^\+?\d{1,4}$"
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-400"
                autoComplete="tel-country-code"
              />
            </div>
            <div className="flex flex-col flex-1">
              <label className="text-sm mb-1 text-gray-600">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                type="tel"
                required
                pattern="\d{5,15}"
                placeholder="Phone"
                autoComplete="tel-local"
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1 text-gray-600">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              autoComplete="name"
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1 text-gray-600">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1 text-gray-600">Pincode</label>
            <input
              name="pincode"
              value={form.pincode}
              onChange={handleChange}
              required
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1 text-gray-600">Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <button
            type="submit"
            className="w-full mt-2 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white text-base font-bold rounded-lg shadow transition-all"
          >
            Submit
          </button>
        </form>
      )}

      {/* OTP STEP */}
      {step === "otp" && (
        <form
          onSubmit={handleOtpSubmit}
          autoComplete="off"
          className="space-y-6"
        >
          <h2 className="text-2xl font-semibold mb-4 text-center text-primary-700">
            Verify Your Account
          </h2>
          <div className="flex flex-col items-center">
            <label className="text-sm mb-1 text-gray-600">OTP</label>
            <input
              name="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              pattern="\d{6}"
              maxLength={6}
              placeholder="Enter received OTP"
              className="w-48 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-400 text-center tracking-widest font-mono text-lg"
              autoComplete="one-time-code"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white text-base font-bold rounded-lg shadow transition-all"
          >
            Verify OTP
          </button>
        </form>
      )}

      {/* VERIFIED STEP */}
      {step === "verified" && (
        <div className="text-center px-4 py-8">
          <div className="flex flex-col items-center justify-center">
            <svg className="w-16 h-16 text-green-500 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 48 48">
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
            <h2 className="text-2xl font-semibold mb-2 text-green-700">
              Verification Complete
            </h2>
            <p className="text-lg text-gray-700">
              Your AutoShop Owner account has been verified. Welcome!
            </p>
          </div>
        </div>
      )}

      {/* ERROR STEP */}
      {step === "error" && (
        <div className="text-center px-4 py-8">
          <h3 className="text-xl font-bold text-red-600 mb-2">Error</h3>
          <p className="mb-4 text-gray-700">{error}</p>
          <button
            className="px-4 py-2 rounded-lg shadow bg-red-500 hover:bg-red-600 text-white font-semibold"
            onClick={handleRetry}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default AutoShopOwnerOnboarding;