import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router";
import OwnerPageShell from "../../components/owner/OwnerPageShell";
import { useAuth } from "../../auth";
import { useOwnerNavReset } from "../../hooks/useOwnerNavReset";
import { useCarOwnerInvoices, type CarOwnerInvoiceRow } from "../../hooks/useCarOwnerInvoices";
import { formatCurrencyAmount } from "../../lib/currency";
import {
  OWNER_PANEL_TABLE,
  OWNER_TABLE_BODY_TD_CLASS,
  OWNER_TABLE_HEAD_TH_CLASS,
  OWNER_TABLE_SURFACE_CLASS,
} from "../../components/owner/ownerPanelTableStyles";

function formatInvoiceDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function statusLabel(row: CarOwnerInvoiceRow): { label: string; className: string } {
  const status = (row.paymentStatus || "Unpaid").trim();
  const paid = status.toLowerCase() === "paid";
  return {
    label: paid ? "Paid" : "Unpaid",
    className: paid ? "text-green-700" : "text-red-600",
  };
}

function selectedSetFromArray(ids: string[]): Set<string> {
  return new Set(ids);
}

export default function OwnerInvoicesPage() {
  const { session } = useAuth();
  const countryCode = session?.meta?.countryCode;
  const { loading, error, refresh, invoiceRows } = useCarOwnerInvoices();
  const navigate = useNavigate();
  const location = useLocation();

  const [view, setView] = useState<"list" | "payment">("list");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selected = useMemo(() => selectedSetFromArray(selectedIds), [selectedIds]);

  const resetSidebar = useCallback(() => {
    setView("list");
    setSelectedIds([]);
  }, []);

  useOwnerNavReset(resetSidebar);

  const paymentRow = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const first = selectedIds[0];
    return invoiceRows.find((r) => r.id === first) ?? null;
  }, [invoiceRows, selectedIds]);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<"Partial" | "Full">("Partial");
  const [paymentNote, setPaymentNote] = useState("");

  const enterPayment = () => {
    if (selectedIds.length === 0) return;
    if (!paymentRow) return;
    setPaymentAmount(String(paymentRow.amount ?? ""));
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod("Partial");
    setPaymentNote("");
    setView("payment");
  };

  const cancelPayment = () => {
    setView("list");
  };

  const savePayment = () => {
    if (!paymentRow) return;
    toast.success("Payment saved.");
    setView("list");
    setSelectedIds([]);
  };

  const activeSidebarId = useMemo(() => {
    if (location.pathname.includes("/owner/expenses/job-cards")) return "job-cards";
    return "invoices";
  }, [location.pathname]);

  return (
    <OwnerPageShell
      pageHeading="Expenses"
      metaTitle="Expenses | AutoDaddy"
      metaDescription="Car owner expenses"
      sidebarItems={[
        { id: "job-cards", label: "Job Cards", variant: "primary" as const },
        { id: "invoices", label: "Invoices", variant: "primary" as const },
      ]}
      activeSidebarId={activeSidebarId}
      onSidebarSelect={(id) => {
        if (id === "job-cards") navigate("/owner/expenses/job-cards");
        if (id === "invoices") navigate("/owner/invoices");
      }}
      heroCardFlush
      contentTopOffset
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
        ) : invoiceRows.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-600">
            No invoices right now.
          </div>
        ) : view === "payment" && paymentRow ? (
          <div className="flex flex-col">
            <div className="rounded border border-gray-300 bg-[#8e2a7c] px-4 py-2 text-center text-sm font-bold text-white">
              Job Card - {paymentRow.jobNo}
            </div>

            <div className="flex items-center justify-between px-1 py-3">
              <div className="text-xl font-bold text-blue-700">Enter Payment</div>
              <button
                type="button"
                onClick={cancelPayment}
                className="text-3xl font-black leading-none text-blue-700"
                aria-label="Back"
              >
                &laquo;
              </button>
            </div>

            <div className="rounded border border-[#b2e0a0] bg-[#CCFFCC] p-6">
              <div className="mb-4 rounded bg-[#d9ead3] px-4 py-2 text-center text-sm font-bold text-gray-700">
                {paymentRow.shopName}
              </div>

              <div className="mx-auto max-w-3xl rounded border border-[#b2e0a0] bg-[#e8ffe8] p-6">
                <div className="text-center">
                  <div className="text-base font-bold text-gray-800">Job Card # {paymentRow.jobNo}</div>
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
                    onClick={cancelPayment}
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
              Invoice
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={() => {
                  if (selectedIds.length === 0) return;
                  toast.success("Deleted.");
                  setSelectedIds([]);
                }}
                className="rounded bg-gray-400 px-6 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                Delete
              </button>
              <button
                type="button"
                disabled={selectedIds.length !== 1}
                onClick={enterPayment}
                className="rounded bg-gray-400 px-6 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                Enter Payment
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
                          checked={selectedIds.length > 0 && selectedIds.length === invoiceRows.length}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds(invoiceRows.map((r) => r.id));
                            else setSelectedIds([]);
                          }}
                          aria-label="Select all"
                        />
                      </th>
                      <th className={OWNER_TABLE_HEAD_TH_CLASS}>Invoice No.</th>
                      <th className={OWNER_TABLE_HEAD_TH_CLASS}>Date</th>
                      <th className={OWNER_TABLE_HEAD_TH_CLASS}>Auto Shop</th>
                      <th className={OWNER_TABLE_HEAD_TH_CLASS}>Job Card No.</th>
                      <th className={OWNER_TABLE_HEAD_TH_CLASS}>Amount</th>
                      <th className={OWNER_TABLE_HEAD_TH_CLASS}>Tax</th>
                      <th className={OWNER_TABLE_HEAD_TH_CLASS}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceRows.map((row, index) => {
                      const isChecked = selected.has(row.id);
                      const status = statusLabel(row);
                      const amount = formatCurrencyAmount(row.amount, countryCode);
                      return (
                        <tr key={row.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                setSelectedIds((cur) => {
                                  const next = new Set(cur);
                                  if (e.target.checked) next.add(row.id);
                                  else next.delete(row.id);
                                  return Array.from(next);
                                });
                              }}
                              aria-label={`Select invoice ${row.jobNo}`}
                            />
                          </td>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>
                            <button
                              type="button"
                              className="font-semibold text-blue-700 hover:underline"
                              onClick={() => {
                                setSelectedIds([row.id]);
                                enterPayment();
                              }}
                            >
                              # {row.jobNo}
                            </button>
                          </td>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>{formatInvoiceDate(row.createdAt)}</td>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>{row.shopName}</td>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>J # {row.jobNo}</td>
                          <td className={`${OWNER_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>{amount}</td>
                          <td className={`${OWNER_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>$ 0</td>
                          <td className={`${OWNER_TABLE_BODY_TD_CLASS} font-bold ${status.className}`}>
                            {status.label}
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
