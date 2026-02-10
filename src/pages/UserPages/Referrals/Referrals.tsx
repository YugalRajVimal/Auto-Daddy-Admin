import React, { useEffect, useState } from "react";
import axios from "axios";

// StatusChip for referral package purchase
const PackageStatusChip = ({ purchased }: { purchased: boolean }) => (
  purchased ? (
    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold text-sm">
      Yes
    </span>
  ) : (
    <span className="inline-block px-4 py-1 bg-yellow-100 text-yellow-600 rounded-full font-semibold text-sm">
      No
    </span>
  )
);

// Show referred side chip
const ReferredOnChip = ({ referredOn }: { referredOn?: string }) => {
  if (!referredOn) return <span>-</span>;
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full font-semibold text-sm ${
        referredOn === "left"
          ? "bg-indigo-100 text-indigo-700"
          : referredOn === "right"
          ? "bg-pink-100 text-pink-700"
          : "bg-gray-100 text-gray-500"
      }`}
    >
      {referredOn.charAt(0).toUpperCase() + referredOn.slice(1)}
    </span>
  );
};

interface ReferredUser {
  name: string;
  email: string;
  createdAt: string;
  package?: string;
  isAnyPackagePurchased?: boolean;
  _id?: string;
  referredOn?: string;
}

interface ReferralData {
  myReferralCode: string;
  totalSuccessfulReferrals: number;
  referredUsers: ReferredUser[];
}

const Referrals: React.FC = () => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [sideFilter, setSideFilter] = useState<string>("all");

  useEffect(() => {
    const fetchReferralPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("user-token");
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user/referral-page`,
          {
            withCredentials: true,
            headers: token ? { Authorization: `${token}` } : undefined,
          }
        );
        if (res.data && res.data.success) {
          setReferralData(res.data.data);
          console.log(res.data.data);
        } else {
          setError(res.data?.message || "Failed to fetch referral data");
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch referral data"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchReferralPage();
  }, []);

  const handleCopy = () => {
    if (!referralData?.myReferralCode) return;
    navigator.clipboard.writeText(referralData.myReferralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Filter users based on the selected side
  const filteredUsers = referralData?.referredUsers
    ? referralData.referredUsers.filter(user => {
        if (sideFilter === "all") return true;
        return user.referredOn === sideFilter;
      })
    : [];

  return (
    <div className=" mx-auto mt-7 p-8 bg-gradient-to-tr from-[#f7fafc] via-[#ecf1fa] to-[#ecf1fa] rounded-xl shadow-[0_5px_24px_rgba(43,73,135,0.11),0_1.5px_7px_rgba(80,70,185,0.07)] font-sans">
      <h2 className="text-3xl font-extrabold mb-5 tracking-tight bg-gradient-to-r from-[#5fa8e1] to-[#9fcfd6] bg-clip-text text-transparent">
        Referral Details
      </h2>

      {loading && (
        <div className="my-8 text-center text-blue-600 font-semibold text-lg tracking-wide flex items-center justify-center">
          <span className="inline-block w-6 h-6 border-4 border-blue-100 border-t-4 border-t-blue-500 rounded-full animate-spin mr-3"></span>
          Loading referral info...
        </div>
      )}

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 px-5 py-3 rounded-md font-semibold text-base my-5">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="flex flex-wrap items-center mb-7 gap-3">
            <span className="font-bold text-base text-slate-800 mr-2">
              Your Referral Code:
            </span>
            <span className="tracking-widest font-extrabold text-lg text-blue-800 bg-blue-50 px-4 py-1 rounded-lg border border-blue-200 select-all">
              {referralData?.myReferralCode || "(none)"}
            </span>
            <button
              onClick={handleCopy}
              className={`ml-2 px-4 py-1 font-semibold rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-all text-sm focus:outline-none ${
                !referralData?.myReferralCode && "opacity-50 cursor-not-allowed"
              }`}
              disabled={!referralData?.myReferralCode}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="mb-8">
            <span className="font-bold text-base text-slate-800 mr-2">
              Total Successful Referrals:
            </span>
            <span className="text-green-800 font-extrabold text-lg bg-green-50 px-4 py-1 rounded-lg border border-green-200">
              {referralData?.totalSuccessfulReferrals ?? 0}
            </span>
          </div>
          <div>
            <div className="flex items-center mb-1 gap-2">
              <h3 className="text-xl font-bold text-blue-700 tracking-tight mr-4">
                Referred Users
              </h3>
              {/* Filter control */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="font-medium text-slate-700">Filter Side:</span>
                <select
                  value={sideFilter}
                  onChange={e => setSideFilter(e.target.value)}
                  className="rounded-md border px-3 py-1 text-base font-semibold text-blue-700 bg-white shadow hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-all"
                >
                  <option value="all">All</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
            {(filteredUsers.length === 0) ? (
              <div className="text-slate-400 text-lg font-medium tracking-tight py-9 text-center">
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="block mx-auto mb-4">
                  <rect width="44" height="44" rx="14.5" fill="#f6f7fb" />
                  <path d="M13 22L19.5 28.5L31 17" stroke="#bad0e6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                No one has used your code yet.<br /> Share and invite friends!
              </div>
            ) : (
              <div className="overflow-x-auto mt-2">
                <table className="min-w-[930px] w-full bg-white rounded-xl shadow-[0_2px_12px_rgba(195,212,236,0.15)] border-separate border-spacing-0 font-sans text-[15px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-100 via-blue-50 to-blue-50 font-extrabold text-blue-600 text-[15px] tracking-wide">
                      <th className="py-4 px-5 text-left rounded-tl-xl">#</th>
                      <th className="py-4 px-3 text-left">Name</th>
                      <th className="py-4 px-3 text-left">Email</th>
                      <th className="py-4 px-3 text-left min-w-[100px]">Side</th>
                      <th className="py-4 px-3 text-left min-w-[160px]">Joined On</th>
                      <th className="py-4 px-3 text-left min-w-[120px]">Purchased Package?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, idx) => (
                      <tr
                        key={user._id || idx}
                        className={`transition-colors ${
                          idx % 2 === 0
                            ? 'bg-gradient-to-r from-blue-50 via-white to-slate-50'
                            : 'bg-gradient-to-r from-slate-100 via-blue-50 to-white'
                        }`}
                      >
                        <td className="py-3 pl-5 pr-3 font-bold text-blue-500 border-0 border-b border-slate-100">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-slate-800 border-0 border-b border-slate-100">{user.name}</td>
                        <td className="py-3 px-3 text-blue-gray-500 break-words border-0 border-b border-slate-100">{user.email}</td>
                        <td className="py-3 px-3 border-0 border-b border-slate-100">
                          <ReferredOnChip referredOn={user.referredOn} />
                        </td>
                        <td className="py-3 px-3 text-blue-900 font-medium border-0 border-b border-slate-100">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : "-"}
                        </td>
                        <td className="py-3 px-3 border-0 border-b border-slate-100">
                          <PackageStatusChip purchased={!!user.isAnyPackagePurchased} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Referrals;