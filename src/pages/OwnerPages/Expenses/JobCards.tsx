import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import OwnerPageShell from "../../../components/owner/OwnerPageShell";
import { useAuth } from "../../../auth";
import { useOwnerNavReset } from "../../../hooks/useOwnerNavReset";
import { useCarOwnerJobCardApprovals } from "../../../hooks/useCarOwnerJobCardApprovals";
import { useCarOwnerJobCards } from "../../../hooks/useCarOwnerJobCards";
import {
  businessName,
  carOwnerJobCardStatusLabel,
  formatBusinessPhone,
  formatJobCardDate,
  isCarOwnerJobCardPendingApproval,
  jobChipLabel,
} from "../../../lib/carOwnerJobCards";
import { formatCurrencyAmount } from "../../../lib/currency";
import {
  OWNER_PANEL_TABLE,
  OWNER_TABLE_BODY_TD_CLASS,
  OWNER_TABLE_HEAD_TH_CLASS,
  OWNER_TABLE_SURFACE_CLASS,
} from "../../../components/owner/ownerPanelTableStyles";

function selectedSetFromArray(ids: string[]): Set<string> {
  return new Set(ids);
}

function statusClassName(label: string): string {
  const norm = label.toLowerCase();
  if (norm.includes("approve") || norm.includes("accept") || norm.includes("paid") || norm.includes("converted")) {
    return "font-bold text-green-700";
  }
  if (norm.includes("reject")) return "font-bold text-red-600";
  if (norm.includes("pending")) return "font-bold text-amber-700";
  return "font-semibold text-gray-700";
}

export default function OwnerExpensesJobCardsPage() {
  const { session } = useAuth();
  const countryCode = session?.meta?.countryCode;
  const {
    items,
    loading,
    error,
    refresh,
  } = useCarOwnerJobCards();
  const { acting, approveMany, rejectMany } = useCarOwnerJobCardApprovals();
  const navigate = useNavigate();

  const [view, setView] = useState<"list" | "payment">("list");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selected = useMemo(() => selectedSetFromArray(selectedIds), [selectedIds]);

  const selectedJobCard = useMemo(() => {
    if (selectedIds.length !== 1) return null;
    const id = selectedIds[0];
    return items.find((jc) => jc._id === id) ?? null;
  }, [items, selectedIds]);

  const pendingSelectedIds = useMemo(
    () =>
      selectedIds.filter((id) => {
        const jc = items.find((row) => row._id === id);
        return jc ? isCarOwnerJobCardPendingApproval(jc) : false;
      }),
    [items, selectedIds],
  );

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<"Partial" | "Full">("Partial");
  const [paymentNote, setPaymentNote] = useState("");

  const reset = useCallback(() => {
    setSelectedIds([]);
    setView("list");
  }, []);
  useOwnerNavReset(reset);

  const openPayment = () => {
    if (selectedIds.length !== 1 || !selectedJobCard) {
      toast.info("Select 1 job card to enter payment.");
      return;
    }
    const total = selectedJobCard.totalPayableAmount ?? 0;
    setPaymentAmount(String(total || ""));
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod("Partial");
    setPaymentNote("");
    setView("payment");
  };

  const savePayment = () => {
    if (!selectedJobCard) return;
    toast.success("Payment saved.");
    setView("list");
    setSelectedIds([]);
  };

  const handleApprove = async () => {
    if (pendingSelectedIds.length === 0 || acting) {
      if (selectedIds.length > 0 && pendingSelectedIds.length === 0) {
        toast.info("Selected job cards are already accepted or closed.");
      }
      return;
    }
    const result = await approveMany(pendingSelectedIds);
    if (result.ok) {
      toast.success(result.message);
      setSelectedIds([]);
      await refresh();
    } else {
      toast.error(result.message);
    }
  };

  const handleDiscard = async () => {
    if (pendingSelectedIds.length === 0 || acting) {
      if (selectedIds.length > 0 && pendingSelectedIds.length === 0) {
        toast.info("Selected job cards are already accepted or closed.");
      }
      return;
    }
    const result = await rejectMany(pendingSelectedIds);
    if (result.ok) {
      toast.success(result.message);
      setSelectedIds([]);
      await refresh();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <OwnerPageShell
      pageHeading="Expenses"
      metaTitle="Expenses | Job Cards | AutoDaddy"
      metaDescription="Car owner job cards for expenses"
    >
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm font-semibold text-gray-800">{error}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-md bg-ad-purple px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-600">
            No job cards yet.
          </div>
        ) : view === "payment" && selectedJobCard ? (
          <div className="flex flex-col">
            <div className="rounded border border-gray-300 bg-[#8e2a7c] px-4 py-2 text-center text-sm font-bold text-white">
              Job Card - {selectedJobCard.jobNo?.trim() || "—"}
            </div>

            <div className="flex items-center justify-between px-1 py-3">
              <div className="text-xl font-bold text-blue-700">Enter Payment</div>
              <button
                type="button"
                onClick={() => setView("list")}
                className="text-3xl font-black leading-none text-blue-700"
                aria-label="Back"
              >
                &laquo;
              </button>
            </div>

            <div className="rounded border border-[#b2e0a0] bg-[#CCFFCC] p-6">
              <div className="mb-4 rounded bg-[#d9ead3] px-4 py-2 text-center text-sm font-bold text-gray-700">
                {businessName(selectedJobCard.business)}
              </div>

              <div className="mx-auto max-w-3xl rounded border border-[#b2e0a0] bg-[#e8ffe8] p-6">
                <div className="text-center">
                  <div className="text-base font-bold text-gray-800">
                    Job Card # {selectedJobCard.jobNo?.trim() || "—"}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">The balance due on this job is paid</div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Amount</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as "Partial" | "Full")}
                      className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="Partial">Partial</option>
                      <option value="Full">Full</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Note</label>
                    <input
                      type="text"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded bg-[#f7e1cc] px-6 py-3 text-sm">
                <div className="text-gray-700 italic">You are entering Payment of Job Card</div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={savePayment}
                    className="min-w-[96px] rounded bg-[#b6f2b6] px-6 py-1.5 text-sm font-bold text-[#006600] shadow-sm hover:brightness-95"
                  >
                    Save
                  </button>
                  <span className="text-gray-700">or</span>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className="text-sm font-semibold text-blue-700 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="rounded border border-gray-300 bg-[#8e2a7c] px-4 py-2 text-center text-sm font-bold text-white">
              Job Cards
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pendingSelectedIds.length === 0 || acting}
                  onClick={() => void handleApprove()}
                  className="rounded bg-gray-400 px-5 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={pendingSelectedIds.length === 0 || acting}
                  onClick={() => void handleDiscard()}
                  className="rounded bg-red-600 px-5 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  type="button"
                  disabled={selectedIds.length !== 1 || acting}
                  onClick={openPayment}
                  className="rounded bg-gray-400 px-5 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  Payment
                </button>
                <button
                  type="button"
                  disabled={selectedIds.length !== 1 || acting}
                  onClick={() => {
                    if (selectedIds.length !== 1) return;
                    toast.success("Converted to invoice.");
                    setSelectedIds([]);
                    navigate("/owner/expenses/invoices");
                  }}
                  className="rounded bg-gray-400 px-5 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  Convert to Invoice
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate("/owner/expenses/invoices")}
                className="text-3xl font-black leading-none text-blue-700"
                aria-label="Back"
              >
                &laquo;
              </button>
            </div>

            <div className={OWNER_TABLE_SURFACE_CLASS}>
              <div className="overflow-x-auto">
                <table className={OWNER_PANEL_TABLE.table}>
                  <thead>
                    <tr className="bg-[#b55aa8] text-white">
                      <th className={`${OWNER_TABLE_HEAD_TH_CLASS} w-10`}>
                        <input
                          type="checkbox"
                          checked={selectedIds.length > 0 && selectedIds.length === items.length}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds(items.map((jc) => jc._id));
                            else setSelectedIds([]);
                          }}
                          aria-label="Select all"
                        />
                      </th>
                      <th className={OWNER_TABLE_HEAD_TH_CLASS}>Job No.</th>
                      <th className={OWNER_TABLE_HEAD_TH_CLASS}>Date</th>
                      <th className={OWNER_TABLE_HEAD_TH_CLASS}>Auto Shop</th>
                      <th className={OWNER_TABLE_HEAD_TH_CLASS}>Phone</th>
                      <th className={OWNER_TABLE_HEAD_TH_CLASS}>Amount</th>
                      <th className={OWNER_TABLE_HEAD_TH_CLASS}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((jc, index) => {
                      const isChecked = selected.has(jc._id);
                      const phone = formatBusinessPhone(jc.business) || "—";
                      const amount = formatCurrencyAmount(jc.totalPayableAmount ?? 0, countryCode);
                      const status = carOwnerJobCardStatusLabel(jc);
                      return (
                        <tr key={jc._id} className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                setSelectedIds((cur) => {
                                  const next = new Set(cur);
                                  if (e.target.checked) next.add(jc._id);
                                  else next.delete(jc._id);
                                  return Array.from(next);
                                });
                              }}
                              aria-label={`Select ${jobChipLabel(jc)}`}
                            />
                          </td>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>
                            <button type="button" className="font-semibold text-blue-700 hover:underline">
                              {jobChipLabel(jc).replace("Job # ", "J # ")}
                            </button>
                          </td>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>{formatJobCardDate(jc.createdAt ?? "")}</td>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>{businessName(jc.business)}</td>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>{phone}</td>
                          <td className={`${OWNER_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>{amount}</td>
                          <td className={`${OWNER_TABLE_BODY_TD_CLASS} ${statusClassName(status)}`}>
                            {status}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </OwnerPageShell>
  );
}
