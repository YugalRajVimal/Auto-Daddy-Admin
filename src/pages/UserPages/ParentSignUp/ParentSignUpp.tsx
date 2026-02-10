import React, { useState, useEffect } from "react";

/**
 * Parent Sign Up (OTP-based)
 * Stage 1: Enter parent name & email, request OTP
 * Stage 2: Enter OTP to verify
 * 
 * API endpoints:
 *  POST /api/parent/signup  {name, email}
 *  POST /api/parent/verify-otp {email, otp}
 *  Success message on completion.
 */

// NOTE: Use /api/parent/signup and /api/parent/verify-otp as per backend
const API_URL = import.meta.env.VITE_API_URL || "";

const ParentSignUp: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(2); // seconds

  // On step 3, redirect to /parent after short delay, using window.location as fallback
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 3) {
      setRedirectCountdown(2);
      timer = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            window.location.href = "/user";
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step]);

  // Handle request OTP (Stage 1)
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setInfo(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Please enter your name.");
      return;
    }
    if (!email || !email.includes("@")) {
      setFormError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      // API: POST /api/parent/signup
      const res = await fetch(`${API_URL}/api/parent/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInfo("OTP sent to your email address.");
        setStep(2);
      } else {
        setFormError(data.message || "Failed to send OTP.");
      }
    } catch (e: any) {
      setFormError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle verify OTP (Stage 2)
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setInfo(null);

    if (!otp || otp.length < 4) {
      setFormError("Please enter the OTP sent to your email.");
      return;
    }

    setLoading(true);
    try {
      // API: POST /api/parent/verify-otp
      const res = await fetch(`${API_URL}/api/parent/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInfo("Parent account created. Redirecting to your dashboard...");
        setStep(3);
      } else {
        setFormError(data.message || "Invalid OTP.");
      }
    } catch (e: any) {
      setFormError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-3 py-10">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold mb-5 text-center text-blue-700">
          Parent Sign Up
        </h2>

        {/* Step 1: Request OTP */}
        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Parent Name
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your Name"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={loading}
                required
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
              <input
                type="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </label>
            {formError && (
              <div className="text-red-600 text-sm">{formError}</div>
            )}
            {info && <div className="text-green-600 text-sm">{info}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              {loading ? "Sending OTP..." : "Request OTP"}
            </button>
          </form>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <div className="text-gray-700 mb-2">
                Please enter the OTP sent to{" "}
                <span className="font-semibold">{email}</span>
              </div>
              <input
                type="text"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                maxLength={6}
                autoComplete="one-time-code"
                pattern="[0-9]*"
                inputMode="numeric"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                disabled={loading}
                required
                placeholder="Enter OTP"
              />
            </div>
            {formError && (
              <div className="text-red-600 text-sm">{formError}</div>
            )}
            {info && <div className="text-green-600 text-sm">{info}</div>}
            <div className="flex justify-between">
              <button
                type="button"
                className="text-blue-600 underline text-sm"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Change Email/Name
              </button>
              <button
                type="submit"
                disabled={loading}
                className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Success & redirect */}
        {step === 3 && (
          <div className="text-center">
            <div className="text-green-700 text-lg font-semibold mb-2">
              Sign Up Successful!
            </div>
            <div className="text-gray-600 mb-4">
              Your parent account has been created.
              <br />
              Redirecting to your dashboard... ({redirectCountdown})
            </div>
            <div className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold opacity-60 cursor-not-allowed transition">
              Go to Parent Dashboard
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentSignUp;