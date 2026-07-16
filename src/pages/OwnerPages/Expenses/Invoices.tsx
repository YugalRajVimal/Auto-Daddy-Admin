import { useCallback, useMemo, useState, type ReactNode } from "react";
import { FiChevronLeft, FiCreditCard, FiFileText, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { Skeleton } from "../../../components/common/Skeleton";
import OwnerPageShell, { ownerPageIntroClass } from "../../../components/owner/OwnerPageShell";
import { useOwnerNavReset } from "../../../hooks/useOwnerNavReset";
import { useCarOwnerInvoices, type CarOwnerInvoiceRow } from "../../../hooks/useCarOwnerInvoices";
import { formatCurrencyAmount } from "../../../lib/currency";
import {
  OWNER_PANEL_TABLE,
  OWNER_TABLE_BODY_TD_CLASS,
  OWNER_TABLE_HEAD_TH_CLASS,
  OWNER_TABLE_SURFACE_CLASS,
} from "../../../components/owner/ownerPanelTableStyles";
import {
  ownerVehicleFieldClass,
  ownerVehicleLabelClass,
  ownerVehicleSelectClass,
} from "../../../components/owner/ownerVehicleFormUtils";

function formatInvoiceDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function statusLabel(row: CarOwnerInvoiceRow): { label: string; className: string } {
  const payment = (row.paymentStatus || "Unpaid").trim();
  const paid = payment.toLowerCase() === "paid";
  const approval = row.approvalStatus?.trim();
  const label =
    approval && approval !== "—"
      ? paid
        ? `${approval} · Paid`
        : approval.toLowerCase().includes("approve") || approval.toLowerCase().includes("accept")
          ? `${approval} · Unpaid`
          : approval
      : paid
        ? "Paid"
        : "Unpaid";
  return {
    label,
    className: paid
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : approval?.toLowerCase().includes("reject")
        ? "bg-rose-50 text-rose-700 ring-rose-100"
        : "bg-amber-50 text-amber-800 ring-amber-100",
  };
}

function selectedSetFromArray(ids: string[]): Set<string> {
  return new Set(ids);
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ad-purple/20 bg-white/60 px-6 py-14 text-center shadow-sm backdrop-blur-sm">
      <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-ad-bg-purple text-ad-purple">
        <FiFileText size={22} aria-hidden />
      </span>
      <div className="max-w-sm text-sm text-slate-600">{children}</div>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  disabled,
  variant = "muted",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "muted" | "danger" | "primary";
}) {
  const styles =
    variant === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : variant === "primary"
        ? "bg-gradient-to-br from-ad-purple to-ad-purple-dark text-white shadow-[0_6px_14px_rgba(155,48,141,0.22)] hover:brightness-105"
        : "bg-slate-600 text-white hover:bg-slate-700";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition disabled:opacity-40 ${styles}`}
    >
      {children}
    </button>
  );
}

export default function OwnerInvoicesPage() {
  const countryCode = "+1";
  const { loading, error, refresh, invoiceRows } = useCarOwnerInvoices();

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

  return (
    <OwnerPageShell
      pageHeading=""
      metaTitle="Expenses | AutoDaddy"
      metaDescription="Car owner expenses"
      noPanel
    >
      <div className="flex flex-col gap-4">
        <header className={`${ownerPageIntroClass} flex flex-wrap items-end justify-between gap-3`}>
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Track shop invoices and record payments</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {view === "payment" ? "Enter Payment" : "Invoices"}
            </h1>
          </div>
          {!loading && !error && view === "list" && invoiceRows.length > 0 ? (
            <p className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-black/5">
              {invoiceRows.length} invoice{invoiceRows.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </header>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : error ? (
          <EmptyState>
            <span className="mb-3 block font-semibold text-slate-800">{error}</span>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-xl bg-ad-purple px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Try again
            </button>
          </EmptyState>
        ) : invoiceRows.length === 0 ? (
          <EmptyState>No invoices right now.</EmptyState>
        ) : view === "payment" && paymentRow ? (
          <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-ad-purple/95 to-ad-purple-dark px-4 py-3.5 text-white sm:px-5">
              <div>
                <p className="text-xs text-white/70">Job card</p>
                <p className="font-semibold tracking-wide">#{paymentRow.jobNo}</p>
              </div>
              <button
                type="button"
                onClick={cancelPayment}
                className="inline-flex items-center gap-1 rounded-xl bg-white/15 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/25 transition hover:bg-white/25"
                aria-label="Back"
              >
                <FiChevronLeft size={16} />
                Back
              </button>
            </div>

            <div className="space-y-4 bg-gradient-to-b from-emerald-50/50 to-white p-4 sm:p-5">
              <div className="rounded-xl bg-emerald-100/70 px-4 py-2.5 text-center text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200/70">
                {paymentRow.shopName}
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 sm:p-5">
                <div className="text-center">
                  <p className="text-base font-bold text-slate-900">Job Card # {paymentRow.jobNo}</p>
                  <p className="mt-1 text-xs text-slate-500">Record the balance due on this job</p>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className={ownerVehicleLabelClass}>Amount</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className={ownerVehicleFieldClass}
                    />
                  </div>
                  <div>
                    <label className={ownerVehicleLabelClass}>Date</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className={ownerVehicleFieldClass}
                    />
                  </div>
                  <div>
                    <label className={ownerVehicleLabelClass}>Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as "Partial" | "Full")}
                      className={ownerVehicleSelectClass}
                    >
                      <option value="Partial">Partial</option>
                      <option value="Full">Full</option>
                    </select>
                  </div>
                  <div>
                    <label className={ownerVehicleLabelClass}>Note</label>
                    <input
                      type="text"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      className={ownerVehicleFieldClass}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50/80 px-4 py-3 text-sm ring-1 ring-amber-100">
                <p className="italic text-slate-600">You are entering payment for this job card</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={savePayment}
                    className="min-w-[96px] rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelPayment}
                    className="text-sm font-semibold text-sky-700 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <ToolbarButton
                variant="danger"
                disabled={selectedIds.length === 0}
                onClick={() => {
                  if (selectedIds.length === 0) return;
                  toast.success("Deleted.");
                  setSelectedIds([]);
                }}
              >
                <FiTrash2 size={13} aria-hidden />
                Delete
              </ToolbarButton>
              <ToolbarButton
                variant="primary"
                disabled={selectedIds.length !== 1}
                onClick={enterPayment}
              >
                <FiCreditCard size={13} aria-hidden />
                Enter Payment
              </ToolbarButton>
            </div>

            <div className={OWNER_TABLE_SURFACE_CLASS}>
              <div className="overflow-x-auto">
                <table className={OWNER_PANEL_TABLE.table}>
                  <thead>
                    <tr className="bg-gradient-to-r from-ad-purple to-ad-purple-dark text-white">
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
                        <tr
                          key={row.id}
                          className={index % 2 === 0 ? "bg-white/90" : "bg-slate-50/80"}
                        >
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
                              className="font-semibold text-sky-700 hover:underline"
                              onClick={() => {
                                setSelectedIds([row.id]);
                                enterPayment();
                              }}
                            >
                              # {row.jobNo}
                            </button>
                          </td>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>
                            {formatInvoiceDate(row.createdAt)}
                          </td>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>{row.shopName}</td>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>J # {row.jobNo}</td>
                          <td className={`${OWNER_TABLE_BODY_TD_CLASS} font-semibold text-slate-900`}>
                            {amount}
                          </td>
                          <td className={`${OWNER_TABLE_BODY_TD_CLASS} font-semibold text-slate-600`}>
                            $ 0
                          </td>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${status.className}`}
                            >
                              {status.label}
                            </span>
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
