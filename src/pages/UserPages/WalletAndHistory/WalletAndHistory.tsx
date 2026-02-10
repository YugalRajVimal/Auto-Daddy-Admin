import React, { useEffect, useState } from 'react';
import axios from 'axios';

type Transaction = {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  relatedOrderId?: string | null;
  date: string;
};

type WalletData = {
  walletBalance: number;
  transactions: Transaction[];
};

const WalletAndHistory: React.FC = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWalletHistory() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('user-token');
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user/wallet-history`,
          {
            headers: {
              Authorization: `${token}`,
            },
          }
        );
        if (res.data?.success) {
          setWalletData(res.data.data);
        } else {
          setError(res.data?.message || 'Failed to fetch data.');
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Error fetching wallet history.'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchWalletHistory();
  }, []);

  return (
    <div className="mx-auto mt-7 p-6 bg-gradient-to-tr from-[#f7fafc] via-[#eaf5fa] to-[#f4fcfa] rounded-xl shadow font-sans ">
      <h2 className="text-3xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-[#b393fa] to-[#6bc7ef] bg-clip-text text-transparent">
        My Wallet & Transaction History
      </h2>
      {loading ? (
        <div className="p-6 text-center text-blue-600 font-medium">Loading wallet information...</div>
      ) : error ? (
        <div className="p-6 text-center text-red-600 font-medium">{error}</div>
      ) : walletData ? (
        <>
          <div className="mb-8 flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
            <span className="font-bold text-lg text-violet-800">
              Wallet Balance:
            </span>
            <span className="tracking-widest font-extrabold text-2xl text-blue-700 bg-blue-100 px-6 py-2 rounded-lg border border-blue-200 select-all">
              ₹ {walletData.walletBalance.toFixed(2)}
            </span>
          </div>
          <h3 className="text-lg font-bold mb-3 text-slate-800">Transaction History</h3>
          {walletData.transactions && walletData.transactions.length > 0 ? (
            <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="py-3 px-3 font-semibold text-slate-700">Date</th>
                    <th className="py-3 px-3 font-semibold text-slate-700">Type</th>
                    <th className="py-3 px-3 font-semibold text-slate-700">Amount</th>
                    <th className="py-3 px-3 font-semibold text-slate-700">Description</th>
                    <th className="py-3 px-3 font-semibold text-slate-700">Order ID</th>
                  </tr>
                </thead>
                <tbody>
                  {walletData.transactions
                    .slice()
                    .reverse()
                    .map((txn) => (
                      <tr key={txn._id} className="border-b hover:bg-blue-50/70 transition">
                        <td className="py-2 px-3 whitespace-nowrap">{new Date(txn.date).toLocaleString()}</td>
                        <td className="py-2 px-3">
                          <span
                            className={
                              txn.type === 'credit'
                                ? 'text-green-600 font-semibold'
                                : 'text-red-600 font-semibold'
                            }
                          >
                            {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                        </td>
                        <td className="py-2 px-3">{txn.description || <span className="text-gray-400">—</span>}</td>
                        <td className="py-2 px-3">{txn.relatedOrderId || <span className="text-gray-400">—</span>}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-gray-500 text-center">No transactions found.</div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default WalletAndHistory;