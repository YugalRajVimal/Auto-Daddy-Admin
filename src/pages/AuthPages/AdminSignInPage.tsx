import { useState } from "react";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiHome } from "react-icons/fi";

const ADMIN_ROLE = "admin";
const ADMIN_TOKEN_KEY = "admin-token";
const ADMIN_HOME = "/admin";
const API_BASE = `${import.meta.env.VITE_API_URL}/api/auth`;
const PRIMARY = "#3d61e7";

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
      // Use the new API endpoint for admin signin
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
    } catch (err) {
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
      // Presume admin OTP verification still uses the same endpoint,
      // if there is a dedicated endpoint for admin, update here as well.
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
    } catch (err) {
      setStatus("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function handleBackToHome() {
    window.location.href = "/";
  }

  // No sign up link for admin - admins are created by super admin
  // You can add logic here if you ever want to allow admin sign ups

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #f7faff 40%, #aac9fe 100%)",
        transition: "background 0.7s",
      }}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-md rounded-3xl p-10 shadow-2xl"
        style={{
          background: "#fff",
          border: `2.5px solid ${PRIMARY}33`,
          boxShadow: "0 8px 40px 0 #3d61e733, 0 1.5px 8px #3d61e710",
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.10, duration: 0.520, ease: "easeOut" }}
          className="text-center mb-7"
        >
          <div className="mb-2 flex justify-center items-center">
            <svg
              width={38}
              height={38}
              viewBox="0 0 38 38"
              fill="none"
              style={{
                filter:
                  "drop-shadow(0 2px 16px #3d61e733) drop-shadow(0 0.5px 2px #3d61e799)",
              }}
            >
              <circle cx="19" cy="19" r="18" fill="#3d61e7" />
              <text
                x="19"
                y="24"
                textAnchor="middle"
                fontWeight="bold"
                fontSize="19"
                fill="#fff"
                fontFamily="Inter, sans-serif"
              >
                PH
              </text>
            </svg>
          </div>
          <h1
            className="text-[2rem] font-extrabold"
            style={{
              color: PRIMARY,
              letterSpacing: "-1px",
              lineHeight: 1.13,
            }}
          >
            Admin Sign In
          </h1>
          <p className="text-base font-medium text-[#6170a9] tracking-wide mt-1">
            Welcome back, Admin!
          </p>
          <p className="text-xs text-slate-400 mt-2 mb-0.5 tracking-wide">
            Sign in with your Admin Email
          </p>
        </motion.div>

        {/* Back to Home Button */}
        <button
          type="button"
          onClick={handleBackToHome}
          className="flex items-center space-x-1 text-xs font-medium text-[#3d61e7] hover:underline mb-3 bg-transparent border-0 p-0 shadow-none"
        >
          <FiHome className="text-base mr-1" />
          <span>Back to Home</span>
        </button>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, type: "spring", damping: 18 }}
          className="space-y-4"
        >
          {/* Status/error message */}
          {status && (
            <motion.div
              className={`block text-sm px-3 py-[6px] mb-1 rounded-xl border
                ${
                  status.includes("successful") || status.includes("sent")
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-red-100 text-red-700 border-red-200"
                }
              `}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.22 }}
            >
              {status}
            </motion.div>
          )}

          {!otpSent ? (
            <>
              <motion.label
                className="text-sm font-semibold text-[#313e66]"
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03, duration: 0.27 }}
              >
                Admin Email Address
              </motion.label>
              <div className="relative">
                <FiMail
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#a2b4e0" }}
                />
                <motion.input
                  type="email"
                  value={email}
                  autoComplete="username"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your admin email"
                  className="w-full rounded-xl border border-[#d3dbf3] pl-11 pr-3 py-2.5 text-[#222d51] placeholder-[#a2b4e0] bg-[#f7f9fc] focus:outline-none focus:ring-2 focus:ring-[#3d61e7] focus:bg-white transition-all font-medium text-base"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.07, duration: 0.31 }}
                  disabled={loading}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.035 }}
                whileTap={{ scale: 0.972 }}
                className="w-full rounded-xl bg-[#3d61e7] py-2.5 font-extrabold text-white text-[1.07rem] shadow-lg hover:bg-[#2445ad] ring-2 ring-[#aac9fe]/40 focus:ring-[#3d61e7] transition-all"
                transition={{ duration: 0.17 }}
                type="button"
                onClick={handleSendOtp}
                disabled={loading || !email.trim()}
              >
                {loading ? "Sending..." : "Send OTP →"}
              </motion.button>
            </>
          ) : (
            <>
              <motion.label
                className="text-sm font-semibold text-[#313e66]"
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03, duration: 0.27 }}
              >
                OTP
              </motion.label>
              <div className="relative mb-2">
                <FiLock
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#a2b4e0" }}
                />
                <motion.input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full rounded-xl border border-[#d3dbf3] pl-11 pr-3 py-2.5 text-[#222d51] placeholder-[#a2b4e0] bg-[#f7f9fc] focus:outline-none focus:ring-2 focus:ring-[#3d61e7] focus:bg-white transition-all font-medium text-base"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06, duration: 0.23 }}
                  disabled={loading}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.035 }}
                whileTap={{ scale: 0.972 }}
                className="w-full rounded-xl bg-[#3d61e7] py-2.5 font-bold text-white text-[1.06rem] shadow-md hover:bg-[#2445ad] ring-2 ring-[#aac9fe]/40 focus:ring-[#3d61e7] transition-all"
                transition={{ duration: 0.17 }}
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || !otp.trim()}
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-full text-xs text-[#3d61e7] mt-2 hover:underline font-medium"
                type="button"
                onClick={() => {
                  setOtp("");
                  setOtpSent(false);
                  setStatus(null);
                }}
                disabled={loading}
              >
                ← Back to Email
              </motion.button>
            </>
          )}
        </motion.div>
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} PromoHatt • All rights reserved
          </p>
        </div>
      </motion.div>
    </div>
  );
}
