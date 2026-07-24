import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { FiCheck, FiClipboard, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { Skeleton } from "../../../components/common/Skeleton";
import OwnerJobCardViewerDialog from "../../../components/owner/OwnerJobCardViewerDialog";
import OwnerPageShell, { ownerPageIntroClass } from "../../../components/owner/OwnerPageShell";
import { useAuth } from "../../../auth";
import { useOwnerNavReset } from "../../../hooks/useOwnerNavReset";
import { useCarOwnerJobCardApprovals } from "../../../hooks/useCarOwnerJobCardApprovals";
import { useCarOwnerJobCards } from "../../../hooks/useCarOwnerJobCards";
import {
  businessName,
  carOwnerJobCardStatusLabel,
  fetchCarOwnerJobCardById,
  formatBusinessPhone,
  formatJobCardDate,
  isCarOwnerJobCardPendingApproval,
  jobChipLabel,
  resolveCarOwnerJobCardForViewer,
  resolveJobCardNo,
  resolveJobCardTotal,
} from "../../../lib/carOwnerJobCards";
import { formatCurrencyAmount } from "../../../lib/currency";
import {
  OWNER_PANEL_TABLE,
  OWNER_TABLE_BODY_TD_CLASS,
  OWNER_TABLE_HEAD_TH_CLASS,
  OWNER_TABLE_SURFACE_CLASS,
} from "../../../components/owner/ownerPanelTableStyles";
import type { CarOwnerJobCard } from "../../../types/carOwnerJobCards";

const API_BASE_URL = (import.meta.env.VITE_API_URL as string).replace(/\/+$/, "");

type ViewerKind = "jobcard";

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
  variant?: "muted" | "danger" | "success";
}) {
  const styles =
    variant === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : variant === "success"
        ? "bg-emerald-600 text-white hover:bg-emerald-700"
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
  const { token } = useAuth();
  const { items, loading, error, refresh } = useCarOwnerJobCards();
  const { acting, approveMany, rejectMany } = useCarOwnerJobCardApprovals();
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selected = useMemo(() => selectedSetFromArray(selectedIds), [selectedIds]);
  const [viewerKind, setViewerKind] = useState<ViewerKind | null>(null);
  const [selectedJobCardId, setSelectedJobCardId] = useState<string | null>(null);

  const pendingSelectedIds = useMemo(
    () =>
      selectedIds.filter((id) => {
        const jc = items.find((row) => row._id === id);
        return jc ? isCarOwnerJobCardPendingApproval(jc) : false;
      }),
    [items, selectedIds],
  );

  const showPendingActions = pendingSelectedIds.length > 0;

  const reset = useCallback(() => {
    setSelectedIds([]);
    setViewerKind(null);
    setSelectedJobCardId(null);
  }, []);
  useOwnerNavReset(reset);

  const fetchJobCardForViewer = useCallback(
    async (id: string) => {
      if (!token) {
        throw new Error("Please log in again.");
      }
      const res = await fetchCarOwnerJobCardById(token, id);
      if (res.ok && res.data) {
        const resolved = resolveCarOwnerJobCardForViewer(res.data);
        if (resolved) return resolved;
      }
      const cached = items.find((jc) => jc._id === id);
      if (cached) return cached;
      throw new Error("Could not load job card.");
    },
    [token, items],
  );

  const openJobCardPreview = (jc: CarOwnerJobCard) => {
    setSelectedJobCardId(jc._id);
    setViewerKind("jobcard");
  };

  const closeViewer = () => {
    setViewerKind(null);
    setSelectedJobCardId(null);
  };

  const handleApprove = async () => {
    if (pendingSelectedIds.length === 0 || acting) return;
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
    if (pendingSelectedIds.length === 0 || acting) return;
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
            <p className="text-sm text-slate-500">Review and approve shop job cards</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Job Cards</h1>
          </div>
          {!loading && !error && items.length > 0 ? (
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
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {showPendingActions ? (
                  <>
                    <ToolbarButton
                      variant="success"
                      disabled={acting}
                      onClick={() => void handleApprove()}
                    >
                      <FiCheck size={13} aria-hidden />
                      Approve
                    </ToolbarButton>
                    <ToolbarButton
                      variant="danger"
                      disabled={acting}
                      onClick={() => void handleDiscard()}
                    >
                      <FiX size={13} aria-hidden />
                      Discard
                    </ToolbarButton>
                  </>
                ) : null}
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
                      const amount = formatCurrencyAmount(resolveJobCardTotal(jc), countryCode);
                      const status = carOwnerJobCardStatusLabel(jc);
                      const jobNo = resolveJobCardNo(jc);
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
                            <button
                              type="button"
                              className="font-semibold text-sky-700 hover:underline"
                              onClick={() => openJobCardPreview(jc)}
                            >
                              {jobNo ? `J # ${jobNo}` : "—"}
                            </button>
                          </td>
                          <td className={OWNER_TABLE_BODY_TD_CLASS}>
                            {formatJobCardDate(jc.createdAt || jc.date || "")}
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

      <OwnerJobCardViewerDialog
        open={viewerKind === "jobcard"}
        onClose={closeViewer}
        jobCardId={selectedJobCardId ?? undefined}
        fetchJobCard={fetchJobCardForViewer}
        countryCode={countryCode}
        apiBaseUrl={API_BASE_URL}
      />
    </OwnerPageShell>
  );
}
