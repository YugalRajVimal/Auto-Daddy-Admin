// import { useCallback, useEffect, useState } from "react";
// import { useAuth } from "../../auth";
// import {
//   fetchWalletStatus,
//   parseWalletStatus,
//   fetchWalletHistory,
//   parseWalletHistory,
//   rechargeWallet,
//   type WalletStatus,
//   type WalletTransaction,
// } from "../../lib/shopOwnerWalletApi";

// export default function ShopSoftwareWalletPanel() {
//   const { session } = useAuth();
//   const token = session?.token ?? "";

//   const [status, setStatus] = useState<WalletStatus | null>(null);
//   const [history, setHistory] = useState<WalletTransaction[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [amount, setAmount] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);

//   const load = useCallback(async () => {
//     if (!token) return;
//     setLoading(true);
//     try {
//       const [statusRes, historyRes] = await Promise.all([
//         fetchWalletStatus(token),
//         fetchWalletHistory(token, 1, 20),
//       ]);
//       setStatus(parseWalletStatus(statusRes));
//       setHistory(parseWalletHistory(historyRes));
//     } finally {
//       setLoading(false);
//     }
//   }, [token]);

//   useEffect(() => {
//     load();
//   }, [load]);

//   const handleRecharge = async () => {
//     setError(null);
//     setSuccess(null);
//     const numeric = Number(amount);
//     if (!Number.isFinite(numeric) || numeric <= 0) {
//       setError("Enter a valid amount");
//       return;
//     }
//     if (status && numeric < status.minWalletRechargeAmount) {
//       setError(`Minimum recharge is ${status.currency} ${status.minWalletRechargeAmount.toFixed(2)}`);
//       return;
//     }
//     setSubmitting(true);
//     try {
//       await rechargeWallet(token, { amount: numeric, paymentMethod: "Manual" });
//       setSuccess(`Wallet recharged with ${status?.currency ?? "CAD"} ${numeric.toFixed(2)}`);
//       setAmount("");
//       await load();
//     } catch (e) {
//       setError(e instanceof Error ? e.message : "Recharge failed");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="flex flex-col gap-5">
//       <div className="rounded-lg border border-gray-200 bg-white p-5">
//         <h3 className="text-base font-bold text-ad-purple">Software Wallet</h3>
//         <p className="mt-1 text-sm text-gray-600">
//           Wallet and Job card creation is free during your trial. Once it ends, each job card costs{" "}
//           {status ? `${status.currency} ${status.perJobCardCharge.toFixed(2)}` : "CAD 1.00"} from your
//           wallet.
//         </p>

//         {loading ? (
//           <div className="mt-4 text-sm text-gray-400">Loading…</div>
//         ) : status ? (
//           <div className="mt-4 flex flex-wrap items-center gap-6">
//             <div>
//               <div className="text-xs text-gray-500">Wallet balance</div>
//               <div className="text-2xl font-bold text-ad-purple">
//                 {status.currency} {status.balance.toFixed(2)}
//               </div>
//             </div>
//             <div>
//               <div className="text-xs text-gray-500">Trial status</div>
//               <div className={`text-sm font-semibold ${status.trialActive ? "text-[#006600]" : "text-gray-700"}`}>
//                 {status.trialActive
//                   ? `Active — ${status.trialDaysRemaining} day(s) left`
//                   : "Ended — wallet charges apply"}
//               </div>
//             </div>
//           </div>
//         ) : null}

//         <div className="mt-5 flex flex-wrap items-end gap-3">
//           <div>
//             <label className="mb-1 block text-xs font-semibold text-gray-600">Recharge amount</label>
//             <input
//               type="number"
//               min={status?.minWalletRechargeAmount ?? 100}
//               value={amount}
//               onChange={(e) => setAmount(e.target.value)}
//               placeholder={status ? `Min ${status.minWalletRechargeAmount}` : "Min 100"}
//               className="w-40 rounded border border-gray-300 px-3 py-2 text-sm"
//             />
//           </div>
//           <button
//             type="button"
//             disabled={submitting}
//             onClick={handleRecharge}
//             className="inline-flex items-center justify-center rounded bg-ad-form-save px-5 py-2 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
//           >
//             {submitting ? "Recharging…" : "Recharge Wallet"}
//           </button>
//         </div>

//         {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
//         {success && <p className="mt-2 text-sm text-[#006600]">{success}</p>}
//       </div>

//       <div className="rounded-lg border border-gray-200 bg-white p-5">
//         <h4 className="text-sm font-bold text-ad-purple">Transaction history</h4>
//         <div className="mt-3 divide-y divide-gray-100">
//           {history.length === 0 && <p className="py-3 text-sm text-gray-400">No transactions yet.</p>}
//           {history.map((tx) => (
//             <div key={tx._id} className="flex items-center justify-between py-2 text-sm">
//               <div>
//                 <div className="font-medium text-gray-800">{tx.reason || tx.type}</div>
//                 <div className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleString()}</div>
//               </div>
//               <div className={tx.type === "recharge" ? "font-semibold text-[#006600]" : "font-semibold text-red-600"}>
//                 {tx.type === "recharge" ? "+" : "-"}
//                 {tx.amount.toFixed(2)}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth";
import {
  fetchWalletStatus,
  parseWalletStatus,
  fetchWalletHistory,
  parseWalletHistory,
  createWalletCheckout,
  fetchWalletCheckoutStatus,
  extractWalletCheckoutSession,
  parseWalletCheckoutStatus,
  formatWalletApiError,
  buildWalletReturnUrls,
  type WalletStatus,
  type WalletTransaction,
} from "../../lib/shopOwnerWalletApi";
import { redirectToStripeCheckout } from "../../lib/stripe";
import { toast } from "react-toastify";

export default function ShopSoftwareWalletPanel() {
  const { session } = useAuth();
  const token = session?.token ?? "";

  const [status, setStatus] = useState<WalletStatus | null>(null);
  const [history, setHistory] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statusRes, historyRes] = await Promise.all([
        fetchWalletStatus(token),
        fetchWalletHistory(token, 1, 20),
      ]);
      setStatus(parseWalletStatus(statusRes));
      setHistory(parseWalletHistory(historyRes));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // Kicks off Stripe Checkout for a top-up — replaces the old direct-credit
  // recharge call. The wallet balance only ever changes after Stripe
  // confirms payment (via webhook, or the poll below as a self-heal
  // fallback), never from this request itself.
  const handleRecharge = async () => {
    setError(null);
    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (status && numeric < status.minWalletRechargeAmount) {
      setError(`Minimum recharge is ${status.currency} ${status.minWalletRechargeAmount.toFixed(2)}`);
      return;
    }

    setSubmitting(true);
    try {
      const { successUrl, cancelUrl } = buildWalletReturnUrls();
      const res = await createWalletCheckout(token, { amount: numeric, successUrl, cancelUrl });

      const data = res.data;
      const succeeded = res.ok && data?.success !== false;
      if (!succeeded) {
        toast.error(formatWalletApiError(data));
        return;
      }

      const session = extractWalletCheckoutSession(data);
      if (!session?.checkoutUrl && !session?.stripeSessionId) {
        toast.error(data?.message?.trim() || "Checkout URL not returned.");
        return;
      }

      if (data?.message?.trim()) {
        toast.info(data.message.trim());
      }

      const { error: redirectError } = await redirectToStripeCheckout(session!);
      if (redirectError) {
        toast.error(redirectError);
        return;
      }
      // Browser is navigating to Stripe now — nothing else to do here.
    } catch {
      toast.error("Network error starting payment.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handles the redirect back from Stripe Checkout — mirrors the
  // payment=success/cancel handling in MyWebsite.tsx, but keyed off
  // session_id (this flow has no invoice number, just the Stripe session).
  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams(window.location.search);
    const walletPayment = params.get("walletPayment")?.toLowerCase();
    const sessionId = params.get("session_id")?.trim() || "";

    if (walletPayment !== "success" && walletPayment !== "cancel") return;

    const clearPaymentParams = () => {
      params.delete("walletPayment");
      params.delete("session_id");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", next);
    };

    if (walletPayment === "cancel") {
      toast.info("Wallet recharge was cancelled.");
      clearPaymentParams();
      return;
    }

    if (!sessionId) {
      toast.info("Payment returned, but the checkout session was missing. Refresh your balance shortly.");
      clearPaymentParams();
      void load();
      return;
    }

    void (async () => {
      const pollDelaysMs = [0, 2000, 4000, 6000];
      for (const delayMs of pollDelaysMs) {
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        try {
          const statusRes = await fetchWalletCheckoutStatus(token, sessionId);
          const parsed = parseWalletCheckoutStatus(statusRes.data);
          if (parsed?.paid) {
            toast.success("Wallet recharged successfully.");
            clearPaymentParams();
            await load();
            return;
          }
        } catch {
          // Retry on next poll.
        }
      }
      toast.info(
        "Payment not confirmed yet. Your backend must receive the Stripe webhook to credit your wallet.",
      );
      clearPaymentParams();
      await load();
    })();
  }, [token, load]);

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-base font-bold text-ad-purple">Software Wallet</h3>
        <p className="mt-1 text-sm text-gray-600">
          Wallet and Job card creation is free during your trial. Once it ends, each job card costs{" "}
          {status ? `${status.currency} ${status.perJobCardCharge.toFixed(2)}` : "CAD 1.00"} from your
          wallet.
        </p>

        {loading ? (
          <div className="mt-4 text-sm text-gray-400">Loading…</div>
        ) : status ? (
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <div>
              <div className="text-xs text-gray-500">Wallet balance</div>
              <div className="text-2xl font-bold text-ad-purple">
                {status.currency} {status.balance.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Trial status</div>
              <div className={`text-sm font-semibold ${status.trialActive ? "text-[#006600]" : "text-gray-700"}`}>
                {status.trialActive
                  ? `Active — ${status.trialDaysRemaining} day(s) left`
                  : "Ended — wallet charges apply"}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Recharge amount</label>
            <input
              type="number"
              min={status?.minWalletRechargeAmount ?? 100}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={status ? `Min ${status.minWalletRechargeAmount}` : "Min 100"}
              className="w-40 rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={handleRecharge}
            className="inline-flex items-center justify-center rounded bg-ad-form-save px-5 py-2 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
          >
            {submitting ? "Redirecting to payment…" : "Recharge Wallet"}
          </button>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h4 className="text-sm font-bold text-ad-purple">Transaction history</h4>
        <div className="mt-3 divide-y divide-gray-100">
          {history.length === 0 && <p className="py-3 text-sm text-gray-400">No transactions yet.</p>}
          {history.map((tx) => (
            <div key={tx._id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="font-medium text-gray-800">
                  {tx.reason || tx.type}
                  {tx.paymentStatus === "Pending" && (
                    <span className="ml-2 rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-semibold text-yellow-700">
                      Pending
                    </span>
                  )}
                  {tx.paymentStatus === "Failed" && (
                    <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">
                      Failed
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleString()}</div>
              </div>
              <div className={tx.type === "recharge" ? "font-semibold text-[#006600]" : "font-semibold text-red-600"}>
                {tx.type === "recharge" ? "+" : "-"}
                {tx.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}