import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  FiCheck,
  FiChevronLeft,
  FiClipboard,
  FiCreditCard,
  FiFileText,
  FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { Skeleton } from "../../../components/common/Skeleton";
import OwnerPageShell, { ownerPageIntroClass } from "../../../components/owner/OwnerPageShell";
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
import {
  ownerVehicleFieldClass,
  ownerVehicleLabelClass,
  ownerVehicleSelectClass,
} from "../../../components/owner/ownerVehicleFormUtils";

function selectedSetFromArray(ids: string[]): Set<string> {
  return new Set(ids);
}

function statusPillClass(label: string): string {
  const norm = label.toLowerCase();
  if (
    norm.includes("approve") ||
    norm.includes("accept") ||
    norm.includes("paid") ||
    norm.includes("converted")
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }
  if (norm.includes("reject")) return "bg-rose-50 text-rose-700 ring-rose-100";
  if (norm.includes("pending")) return "bg-amber-50 text-amber-800 ring-amber-100";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ad-purple/20 bg-white/60 px-6 py-14 text-center shadow-sm backdrop-blur-sm">
      <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-ad-bg-purple text-ad-purple">
        <FiClipboard size={22} aria-hidden />
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
  variant?: "muted" | "danger" | "primary" | "success";
}) {
  const styles =
    variant === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : variant === "success"
        ? "bg-emerald-600 text-white hover:bg-emerald-700"
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

export default function OwnerExpensesJobCardsPage() {
  const countryCode = "+1";
  const { items, loading, error, refresh } = useCarOwnerJobCards();
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
      pageHeading=""
      metaTitle="Expenses | Job Cards | AutoDaddy"
      metaDescription="Car owner job cards for expenses"
      noPanel
    >
      <div className="flex flex-col gap-4">
        <header className={`${ownerPageIntroClass} flex flex-wrap items-end justify-between gap-3`}>
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Approve work, pay shops, and convert to invoices</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {view === "payment" ? "Enter Payment" : "Job Cards"}
            </h1>
          </div>
          {!loading && !error && view === "list" && items.length > 0 ? (
            <p className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-black/5">
              {items.length} job card{items.length === 1 ? "" : "s"}
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
        ) : items.length === 0 ? (
          <EmptyState>No job cards yet.</EmptyState>
        ) : view === "payment" && selectedJobCard ? (
          <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-ad-purple/95 to-ad-purple-dark px-4 py-3.5 text-white sm:px-5">
              <div>
                <p className="text-xs text-white/70">Job card</p>
                <p className="font-semibold tracking-wide">
                  #{selectedJobCard.jobNo?.trim() || "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setView("list")}
                className="inline-flex items-center gap-1 rounded-xl bg-white/15 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/25 transition hover:bg-white/25"
                aria-label="Back"
              >
                <FiChevronLeft size={16} />
                Back
              </button>
            </div>

            <div className="space-y-4 bg-gradient-to-b from-emerald-50/50 to-white p-4 sm:p-5">
              <div className="rounded-xl bg-emerald-100/70 px-4 py-2.5 text-center text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200/70">
                {businessName(selectedJobCard.business)}
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 sm:p-5">
                <div className="text-center">
                  <p className="text-base font-bold text-slate-900">
                    Job Card # {selectedJobCard.jobNo?.trim() || "—"}
                  </p>
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
                    onClick={() => setView("list")}
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <ToolbarButton
                  variant="success"
                  disabled={pendingSelectedIds.length === 0 || acting}
                  onClick={() => void handleApprove()}
                >
                  <FiCheck size={13} aria-hidden />
                  Approve
                </ToolbarButton>
                <ToolbarButton
                  variant="danger"
                  disabled={pendingSelectedIds.length === 0 || acting}
                  onClick={() => void handleDiscard()}
                >
                  <FiX size={13} aria-hidden />
                  Discard
                </ToolbarButton>
                <ToolbarButton
                  variant="primary"
                  disabled={selectedIds.length !== 1 || acting}
                  onClick={openPayment}
                >
                  <FiCreditCard size={13} aria-hidden />
                  Payment
                </ToolbarButton>
                <ToolbarButton
                  disabled={selectedIds.length !== 1 || acting}
                  onClick={() => {
                    if (selectedIds.length !== 1) return;
                    toast.success("Converted to invoice.");
                    setSelectedIds([]);
                    navigate("/owner/expenses/invoices");
                  }}
                >
                  <FiFileText size={13} aria-hidden />
                  Convert to Invoice
                </ToolbarButton>
              </div>

              <button
                type="button"
                onClick={() => navigate("/owner/expenses/invoices")}
                className="inline-flex items-center gap-1 rounded-xl bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-black/5 transition hover:bg-white"
              >
                View invoices
              </button>
            </div>

            <div className={OWNER_TABLE_SURFACE_CLASS}>
              <div className="overflow-x-auto">
                <table className={OWNER_PANEL_TABLE.table}>
                  <thead>
                    <tr className="bg-gradient-to-r from-ad-purple to-ad-purple-dark text-white">
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
                        <tr
                          key={jc._id}
                          className={index % 2 === 0 ? "bg-white/90" : "bg-slate-50/80"}
                        >
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
                            <span className="font-semibold text-sky-700">
                              {jobChipLabel(jc).replace("Job # ", "J # ")}
                            </span>
                          </td>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>
                            {formatJobCardDate(jc.createdAt ?? "")}
                          </td>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>{businessName(jc.business)}</td>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>{phone}</td>
                          <td className={`${OWNER_TABLE_BODY_TD_CLASS} font-semibold text-slate-900`}>
                            {amount}
                          </td>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusPillClass(status)}`}
                            >
                              {status}
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
