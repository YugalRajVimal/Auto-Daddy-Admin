import React, { useEffect, useState } from "react";
import axios from "axios";

// Badge for credited amount status
const AmountStatusChip = ({ amount }: { amount: number }) => (
  amount > 0 ? (
    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold text-sm">
      ₹{amount}
    </span>
  ) : (
    <span className="inline-block px-4 py-1 bg-gray-100 text-gray-500 rounded-full font-semibold text-sm">
      -
    </span>
  )
);

interface WeekRecord {
  _id: string;
  week: number;
  from: string;
  to: string;
  leftbv: number;
  rightbv: number;
  matchedBV: number;
  leftCarryRem: number;
  rightCarryRem: number;
}

const PromotionalIncomePage: React.FC = () => {
  const [weekRecords, setWeekRecords] = useState<WeekRecord[]>([]);
  const [leftCarry, setLeftCarry] = useState<number>(0);
  const [rightCarry, setRightCarry] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPromotionalIncome = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("user-token");
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user/promotional-income`,
          {
            withCredentials: true,
            headers: token ? { Authorization: `${token}` } : undefined,
          }
        );
        if (res.data && res.data.success) {
          // Expecting: res.data.data.promotionalIncome as array, plus leftCarry/rightCarry
          setWeekRecords(res.data.data.promotionalIncome || []);
          setLeftCarry(res.data.data.leftCarry || 0);
          setRightCarry(res.data.data.rightCarry || 0);
        } else {
          setError(res.data?.message || "Failed to fetch promotional income");
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch promotional income"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPromotionalIncome();
  }, []);

  return (
    <div className=" mx-auto mt-7 p-8 bg-gradient-to-tr from-[#f7fafc] via-[#ecf1fa] to-[#ecf1fa] rounded-xl shadow-[0_5px_24px_rgba(43,73,135,0.11),0_1.5px_7px_rgba(80,70,185,0.07)] font-sans">
      <h2 className="text-3xl font-extrabold mb-5 tracking-tight bg-gradient-to-r from-[#56a5b9] to-[#89e3cd] bg-clip-text text-transparent">
        Promotional Income
      </h2>
      {loading && (
        <div className="my-8 text-center text-blue-600 font-semibold text-lg tracking-wide flex items-center justify-center">
          <span className="inline-block w-6 h-6 border-4 border-blue-100 border-t-4 border-t-blue-500 rounded-full animate-spin mr-3"></span>
          Loading promotional income...
        </div>
      )}
      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 px-5 py-3 rounded-md font-semibold text-base my-5">
          {error}
        </div>
      )}
      {!loading && !error && (
        <>
          <div className="flex flex-wrap items-center mb-7 gap-6">
            <div>
              <span className="font-bold text-base text-slate-800 mr-2">
                Current Left Carry:
              </span>
              <span className="text-indigo-800 font-extrabold text-lg bg-indigo-50 px-4 py-1 rounded-lg border border-indigo-200">
                {leftCarry}
              </span>
            </div>
            <div>
              <span className="font-bold text-base text-slate-800 mr-2">
                Current Right Carry:
              </span>
              <span className="text-pink-800 font-extrabold text-lg bg-pink-50 px-4 py-1 rounded-lg border border-pink-200">
                {rightCarry}
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-blue-700 tracking-tight mb-2">
              Promotional Income Details
            </h3>
            {weekRecords.length === 0 ? (
              <div className="text-slate-400 text-lg font-medium tracking-tight py-8 text-center">
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="block mx-auto mb-4">
                  <rect width="44" height="44" rx="14.5" fill="#f6f7fb" />
                  <path d="M13 22L19.5 28.5L31 17" stroke="#bad0e6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                No promotional income records found.<br /> Keep building your network!
              </div>
            ) : (
              <div className="overflow-x-auto mt-1">
                <table className="min-w-[900px] w-full bg-white rounded-xl shadow-[0_2px_12px_rgba(195,212,236,0.13)] border-separate border-spacing-0 font-sans text-[15px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-cyan-100 via-blue-100 to-slate-50 font-extrabold text-blue-600 text-[15px] tracking-wide">
                      <th className="py-4 px-5 text-left rounded-tl-xl">Week</th>
                      <th className="py-4 px-3 text-left">From</th>
                      <th className="py-4 px-3 text-left">To</th>
                      <th className="py-4 px-3 text-left">Left BV</th>
                      <th className="py-4 px-3 text-left">Right BV</th>
                      <th className="py-4 px-3 text-left">Matched BV</th>
                      <th className="py-4 px-3 text-left">Left Carry Rem</th>
                      <th className="py-4 px-3 text-left">Right Carry Rem</th>
                      <th className="py-4 px-3 text-left rounded-tr-xl">Credited Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weekRecords.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center text-slate-400 py-5">No records found.</td>
                      </tr>
                    ) : (
                      weekRecords.map((rec, idx) => (
                        <tr
                          key={rec._id || idx}
                          className={`transition-colors ${
                            idx % 2 === 0
                              ? 'bg-gradient-to-r from-cyan-50 via-white to-slate-50'
                              : 'bg-gradient-to-r from-slate-100 via-white to-blue-50'
                          }`}
                        >
                          <td className="py-3 px-4 font-bold text-blue-500 border-0 border-b border-slate-100">{rec.week}</td>
                          <td className="py-3 px-3 text-blue-800 border-0 border-b border-slate-100">
                            {rec.from ? new Date(rec.from).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "-"}
                          </td>
                          <td className="py-3 px-3 text-blue-800 border-0 border-b border-slate-100">
                            {rec.to ? new Date(rec.to).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "-"}
                          </td>
                          <td className="py-3 px-3 text-indigo-700 font-semibold border-0 border-b border-slate-100">{rec.leftbv}</td>
                          <td className="py-3 px-3 text-pink-700 font-semibold border-0 border-b border-slate-100">{rec.rightbv}</td>
                          <td className="py-3 px-3 text-green-700 font-semibold border-0 border-b border-slate-100">{rec.matchedBV}</td>
                          <td className="py-3 px-3 text-blue-700 font-medium border-0 border-b border-slate-100">{rec.leftCarryRem}</td>
                          <td className="py-3 px-3 text-blue-700 font-medium border-0 border-b border-slate-100">{rec.rightCarryRem}</td>
                          <td className="py-3 px-3 border-0 border-b border-slate-100">
                            <AmountStatusChip amount={rec.matchedBV > 0 ? rec.matchedBV * 100 : 0} />
                          </td>
                        </tr>
                      ))
                    )}
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

export default PromotionalIncomePage;