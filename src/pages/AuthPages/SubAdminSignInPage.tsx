// pages/AuthPages/SubAdminSignInPage.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiHome } from "react-icons/fi";

const SUBADMIN_TOKEN_KEY = "admin-token";
const SUBADMIN_ROLE_KEY  = "admin-role";
const ADMIN_HOME         = "/admin";
const API_BASE           = `${import.meta.env.VITE_API_URL}/api/auth`;
const PRIMARY            = "#3d61e7";

export default function SubAdminSignInPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [status,   setStatus]   = useState<string | null>(null);

  async function handleLogin() {
    setStatus(null);
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/subadmin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem(SUBADMIN_TOKEN_KEY, data.token);
        localStorage.setItem(SUBADMIN_ROLE_KEY, "subadmin");
        localStorage.setItem("subadmin-permissions", JSON.stringify(data.user?.permissions || {}));
        setStatus("Login successful!");
        setTimeout(() => { window.location.href = ADMIN_HOME; }, 600);
      } else {
        setStatus(data?.message || "Login failed");
      }
    } catch {
      setStatus("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #f7faff 40%, #aac9fe 100%)" }}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl p-10 shadow-2xl"
        style={{ background: "#fff", border: `2.5px solid ${PRIMARY}33`, boxShadow: "0 8px 40px 0 #3d61e733" }}>

        <div className="text-center mb-7">
          <div className="mb-2 flex justify-center">
            <svg width={38} height={38} viewBox="0 0 38 38" fill="none"
              style={{ filter: "drop-shadow(0 2px 16px #3d61e733)" }}>
              <circle cx="19" cy="19" r="18" fill="#3d61e7" />
              <text x="19" y="24" textAnchor="middle" fontWeight="bold" fontSize="14" fill="#fff" fontFamily="Inter, sans-serif">SA</text>
            </svg>
          </div>
          <h1 className="text-[1.9rem] font-extrabold" style={{ color: PRIMARY, letterSpacing: "-1px" }}>
            Sub Admin Sign In
          </h1>
          <p className="text-sm font-medium text-[#6170a9] mt-1">Sign in with your Sub Admin credentials</p>
        </div>

        <button type="button" onClick={() => window.location.href = "/"}
          className="flex items-center text-xs font-medium text-[#3d61e7] hover:underline mb-4 bg-transparent border-0 p-0">
          <FiHome className="mr-1" /> Back to Home
        </button>

        <div className="space-y-4">
          {status && (
            <div className={`text-sm px-3 py-[6px] rounded-xl border ${status.includes("successful") ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-700 border-red-200"}`}>
              {status}
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-[#313e66]">Email Address</label>
            <div className="relative mt-1">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a2b4e0]" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="subadmin@company.com" disabled={loading}
                className="w-full rounded-xl border border-[#d3dbf3] pl-10 pr-3 py-2.5 text-[#222d51] bg-[#f7f9fc] focus:outline-none focus:ring-2 focus:ring-[#3d61e7] text-sm" />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-[#313e66]">Password</label>
            <div className="relative mt-1">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a2b4e0]" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password" disabled={loading}
                className="w-full rounded-xl border border-[#d3dbf3] pl-10 pr-3 py-2.5 text-[#222d51] bg-[#f7f9fc] focus:outline-none focus:ring-2 focus:ring-[#3d61e7] text-sm" />
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            type="button" onClick={handleLogin} disabled={loading || !email || !password}
            className="w-full rounded-xl bg-[#3d61e7] py-2.5 font-extrabold text-white text-base shadow-lg hover:bg-[#2445ad] transition-all">
            {loading ? "Signing in..." : "Sign In →"}
          </motion.button>

          <p className="text-xs text-center text-[#6170a9] mt-2">
            Are you the main admin?{" "}
            <a href="/admin/signin" className="text-[#3d61e7] hover:underline font-semibold">Sign in here</a>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} AutoDaddy • All rights reserved
        </p>
      </motion.div>
    </div>
  );
}