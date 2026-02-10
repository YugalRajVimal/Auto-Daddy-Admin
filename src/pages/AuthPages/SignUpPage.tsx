import { useState } from "react";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiHome, FiUser, FiPhone, FiMapPin } from "react-icons/fi";

const USER_ROLE = "user";
const USER_TOKEN_KEY = "promohatt-user-token";
const USER_HOME = "/user";
const API_BASE = `${import.meta.env.VITE_API_URL}/api/auth`;
const PRIMARY = "#3d61e7";

// Enum options for refferedOn
const REFERRED_ON_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "auto", label: "Auto" },
];

export default function SignUpPage() {
  // Sign up form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  // Optional referral fields
  const [referralCode, setReferralCode] = useState("");
  const [referredOn, setReferredOn] = useState(""); // Will hold "left"|"right"|"auto" or ""

  // OTP flow
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Form validation:
  // If referralCode is present, referredOn should also be selected.
  const canSubmitSignUp =
    name.trim() &&
    email.trim() &&
    phone.trim() &&
    address.street.trim() &&
    address.city.trim() &&
    address.state.trim() &&
    address.postalCode.trim() &&
    address.country.trim() &&
    (
      !referralCode.trim() || 
      (referralCode.trim() && ["left", "right", "auto"].includes(referredOn))
    );

  async function handleSignUp() {
    setStatus(null);
    setLoading(true);
    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: {
          street: address.street.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
          postalCode: address.postalCode.trim(),
          country: address.country.trim(),
        },
        role: USER_ROLE,
      };

      if (referralCode.trim()) {
        payload.referralCode = referralCode.trim();
        payload.referredOn = referredOn; // Always set referredOn if referralCode set
      }

      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true); // advance UI to OTP step
        setStatus("Signup successful. OTP sent to your email/phone!");
      } else {
        setOtpSent(false);
        setStatus(data?.message || "Signup failed");
      }
    } catch (error) {
      setStatus("An error occurred during signup.");
      setOtpSent(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setStatus(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/verify-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role: USER_ROLE,
          otp: otp.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem(USER_TOKEN_KEY, data.token);
        setStatus("Account verified & logged in!");
        setTimeout(() => {
          window.location.href = USER_HOME;
        }, 900);
      } else {
        setStatus(data?.message || "OTP verification failed");
      }
    } catch (err) {
      setStatus("An error occurred while verifying OTP.");
    } finally {
      setLoading(false);
    }
  }

  function handleBackToHome() {
    window.location.href = "/";
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-3 md:px-8 lg:px-16"
      style={{
        background: "linear-gradient(135deg, #f7faff 40%, #aac9fe 100%)",
        transition: "background 0.7s",
      }}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        className="
          w-full 
          max-w-xl
          md:max-w-2xl
          lg:max-w-3xl
          xl:max-w-4xl
          rounded-3xl 
          p-4
          md:p-10 
          shadow-2xl
          mx-auto
        "
        style={{
          background: "#fff",
          border: `2.5px solid ${PRIMARY}33`,
          boxShadow: "0 8px 40px 0 #3d61e733, 0 1.5px 8px #3d61e710",
        }}
      >
        <div className="w-full">
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
              className="text-[2rem] md:text-[2.4rem] font-extrabold"
              style={{
                color: PRIMARY,
                letterSpacing: "-1px",
                lineHeight: 1.13,
              }}
            >
              Sign Up for PromoHatt
            </h1>
            <p className="text-base font-medium text-[#6170a9] tracking-wide mt-1">
              Create your account and unlock earning opportunities
            </p>
          </motion.div>
        </div>

        {/* Back to Home Button */}
        <button
          type="button"
          onClick={handleBackToHome}
          className="flex items-center space-x-1 text-xs font-medium text-[#3d61e7] hover:underline mb-3 bg-transparent border-0 p-0 shadow-none"
        >
          <FiHome className="text-base mr-1" />
          <span>Back to Home</span>
        </button>

        {/* Signup Card */}
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
                  status.toLowerCase().includes("success")
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
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-6">
              {/* COLUMN ONE */}
              <div className="flex flex-col space-y-4">
                {/* Name */}
                <motion.label
                  className="text-sm font-semibold text-[#313e66]"
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03, duration: 0.27 }}
                >
                  Name
                </motion.label>
                <div className="relative">
                  <FiUser
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#a2b4e0" }}
                  />
                  <motion.input
                    type="text"
                    value={name}
                    autoComplete="name"
                    onChange={e => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-xl border border-[#d3dbf3] pl-11 pr-3 py-2.5  text-[#222d51] placeholder-[#a2b4e0] bg-[#f7f9fc] focus:outline-none focus:ring-2 focus:ring-[#3d61e7] focus:bg-white transition-all font-medium text-base mb-2"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05, duration: 0.19 }}
                    disabled={loading}
                  />
                </div>
                {/* Email */}
                <motion.label
                  className="text-sm font-semibold text-[#313e66]"
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06, duration: 0.23 }}
                >
                  Email Address
                </motion.label>
                <div className="relative">
                  <FiMail
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#a2b4e0" }}
                  />
                  <motion.input
                    type="email"
                    value={email}
                    autoComplete="email"
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-[#d3dbf3] pl-11 pr-3 py-2.5  text-[#222d51] placeholder-[#a2b4e0] bg-[#f7f9fc] focus:outline-none focus:ring-2 focus:ring-[#3d61e7] focus:bg-white transition-all font-medium text-base mb-2"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.09, duration: 0.22 }}
                    disabled={loading}
                  />
                </div>
                {/* Phone */}
                <motion.label
                  className="text-sm font-semibold text-[#313e66]"
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.09, duration: 0.18 }}
                >
                  Phone Number
                </motion.label>
                <div className="relative">
                  <FiPhone
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#a2b4e0" }}
                  />
                  <motion.input
                    type="text"
                    value={phone}
                    autoComplete="tel"
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full rounded-xl border border-[#d3dbf3] pl-11 pr-3 py-2.5  text-[#222d51] placeholder-[#a2b4e0] bg-[#f7f9fc] focus:outline-none focus:ring-2 focus:ring-[#3d61e7] focus:bg-white transition-all font-medium text-base mb-2"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.13, duration: 0.18 }}
                    disabled={loading}
                  />
                </div>
                {/* Referral Code */}
                <motion.label
                  className="text-sm font-semibold text-[#313e66]"
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.13, duration: 0.18 }}
                >
                  Referral Code <span className="font-normal text-xs text-[#8090c0]">(optional)</span>
                </motion.label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={e => {
                      setReferralCode(e.target.value);
                      // If cleared, also clear referredOn
                      if (!e.target.value.trim()) setReferredOn("");
                    }}
                    placeholder="Enter referral code"
                    className="w-full rounded-xl border border-[#d3dbf3] px-3 py-2 text-[#222d51] placeholder-[#b5c6eb] bg-[#f7f9fc] focus:outline-none focus:ring-2 focus:ring-[#3d61e7] focus:bg-white text-base"
                    disabled={loading}
                  />
                  {/* If referralCode is set, show refferedOn dropdown (required) */}
                  {referralCode.trim() ? (
                    <select
                      value={referredOn}
                      onChange={e => setReferredOn(e.target.value)}
                      className="rounded-xl border border-[#d3dbf3] bg-[#f7f9fc] px-2 py-2.5 text-[#3d61e7] font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#3d61e7]"
                      required
                      disabled={loading}
                    >
                      <option value="">Referred On…</option>
                      {REFERRED_ON_OPTIONS.map(opt => (
                        <option value={opt.value} key={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
                {/* If referralCode given but referredOn not selected, show inline warning */}
                {referralCode.trim() && !["left","right","auto"].includes(referredOn) && (
                  <div className="text-xs text-red-500 font-medium mt-0.5 mb-1">
                    Please select how you were referred (left, right, or auto)
                  </div>
                )}
              </div>

              {/* COLUMN TWO */}
              <div className="flex flex-col space-y-4 md:pl-6 mt-7 md:mt-0">
                <motion.label
                  className="text-sm font-semibold text-[#313e66]"
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.10, duration: 0.20 }}
                >
                  Address
                </motion.label>
                <div className="space-y-2">
                  <div className="relative">
                    <FiMapPin
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: "#a2b4e0" }}
                    />
                    <input
                      type="text"
                      value={address.street}
                      onChange={e =>
                        setAddress(addr => ({ ...addr, street: e.target.value }))
                      }
                      placeholder="Street"
                      className="w-full rounded-xl border border-[#d3dbf3] pl-11 pr-3 py-2 text-[#222d51] placeholder-[#a2b4e0] bg-[#f7f9fc] focus:outline-none focus:ring-2 focus:ring-[#3d61e7] focus:bg-white font-medium text-base"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={address.city}
                      onChange={e =>
                        setAddress(addr => ({ ...addr, city: e.target.value }))
                      }
                      placeholder="City"
                      className="w-full rounded-xl border border-[#d3dbf3] px-3 py-2 text-[#222d51] placeholder-[#a2b4e0] bg-[#f7f9fc] focus:outline-none focus:ring-2 focus:ring-[#3d61e7] focus:bg-white font-medium text-base"
                      disabled={loading}
                    />
                    <input
                      type="text"
                      value={address.state}
                      onChange={e =>
                        setAddress(addr => ({ ...addr, state: e.target.value }))
                      }
                      placeholder="State"
                      className="w-full rounded-xl border border-[#d3dbf3] px-3 py-2 text-[#222d51] placeholder-[#a2b4e0] bg-[#f7f9fc] focus:outline-none focus:ring-2 focus:ring-[#3d61e7] focus:bg-white font-medium text-base"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={address.postalCode}
                      onChange={e =>
                        setAddress(addr => ({
                          ...addr,
                          postalCode: e.target.value,
                        }))
                      }
                      placeholder="Postal Code"
                      className="w-full rounded-xl border border-[#d3dbf3] px-3 py-2 text-[#222d51] placeholder-[#a2b4e0] bg-[#f7f9fc] focus:outline-none focus:ring-2 focus:ring-[#3d61e7] focus:bg-white font-medium text-base"
                      disabled={loading}
                    />
                    <input
                      type="text"
                      value={address.country}
                      onChange={e =>
                        setAddress(addr => ({ ...addr, country: e.target.value }))
                      }
                      placeholder="Country"
                      className="w-full rounded-xl border border-[#d3dbf3] px-3 py-2 text-[#222d51] placeholder-[#a2b4e0] bg-[#f7f9fc] focus:outline-none focus:ring-2 focus:ring-[#3d61e7] focus:bg-white font-medium text-base"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="flex-1" />
                <motion.button
                  whileHover={{ scale: 1.035 }}
                  whileTap={{ scale: 0.972 }}
                  className="w-full rounded-xl bg-[#3d61e7] py-2.5 font-extrabold text-white text-[1.07rem] shadow-lg hover:bg-[#2445ad] ring-2 ring-[#aac9fe]/40 focus:ring-[#3d61e7] transition-all mt-2"
                  transition={{ duration: 0.17 }}
                  type="button"
                  onClick={handleSignUp}
                  disabled={loading || !canSubmitSignUp}
                >
                  {loading ? "Signing Up..." : "Sign Up"}
                </motion.button>
              </div>
            </div>
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
                  onChange={e => setOtp(e.target.value)}
                  placeholder="Enter the OTP"
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
                {loading ? "Verifying OTP..." : "Verify & Continue"}
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
                ← Back to Sign Up
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
