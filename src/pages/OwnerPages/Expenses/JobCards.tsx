import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { FiCheck, FiClipboard, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { Skeleton } from "../../../components/common/Skeleton";
import OwnerInvoiceEstimateView from "../../../components/owner/OwnerInvoiceEstimateView";
import OwnerPageShell, { ownerPageIntroClass } from "../../../components/owner/OwnerPageShell";
import {
  ownerVehicleLabelClass,
  ownerVehicleSelectClass,
} from "../../../components/owner/ownerVehicleFormUtils";
import { useAuth } from "../../../auth";
import { useOwnerNavReset } from "../../../hooks/useOwnerNavReset";
import { useCarOwnerJobCardApprovals } from "../../../hooks/useCarOwnerJobCardApprovals";
import { useCarOwnerJobCards } from "../../../hooks/useCarOwnerJobCards";
import { useCarOwnerVehicles } from "../../../hooks/useCarOwnerVehicles";
import {
  businessName,
  carOwnerJobCardStatusLabel,
  formatBusinessPhone,
  formatJobCardDate,
  formatOwnerJobCardNo,
  isCarOwnerJobCardPendingApproval,
  jobChipLabel,
  resolveJobCardNo,
  resolveJobCardTotal,
} from "../../../lib/carOwnerJobCards";
import { formatCurrencyAmount } from "../../../lib/currency";
import {
  vehicleSidebarLabel,
  type CarOwnerVehicle,
} from "../../../lib/carOwnerVehicles";
import {
  OWNER_PANEL_TABLE,
  OWNER_TABLE_BODY_TD_CLASS,
  OWNER_TABLE_HEAD_TH_CLASS,
  OWNER_TABLE_SURFACE_CLASS,
} from "../../../components/owner/ownerPanelTableStyles";
import type { CarOwnerJobCard } from "../../../types/carOwnerJobCards";

function vehicleOptionLabel(vehicle: CarOwnerVehicle, index: number): string {
  const plate = vehicle.licensePlateNo?.trim().toUpperCase();
  if (plate) return plate;
  const make = vehicleSidebarLabel(vehicle);
  return make || `Vehicle ${index + 1}`;
}

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
  const { vehicles } = useCarOwnerVehicles();
  const [searchParams, setSearchParams] = useSearchParams();
  const vehicleFilter = searchParams.get("vehicleId")?.trim() || "";
  const setVehicleFilter = useCallback(
    (vehicleId: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (vehicleId) next.set("vehicleId", vehicleId);
          else next.delete("vehicleId");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );
  const { items, loading, error, refresh } = useCarOwnerJobCards(vehicleFilter || null);
  const { acting, approveMany, rejectMany } = useCarOwnerJobCardApprovals();
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selected = useMemo(() => selectedSetFromArray(selectedIds), [selectedIds]);
  const [detailJobCardId, setDetailJobCardId] = useState<string | null>(null);

  const detailJobCard = useMemo(
    () => (detailJobCardId ? items.find((jc) => jc._id === detailJobCardId) ?? null : null),
    [items, detailJobCardId],
  );

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
    setDetailJobCardId(null);
    setVehicleFilter("");
  }, [setVehicleFilter]);
  useOwnerNavReset(reset);

  const openJobCardPreview = (jc: CarOwnerJobCard) => {
    setDetailJobCardId(jc._id);
  };

  const closeDetail = () => {
    setDetailJobCardId(null);
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
        {detailJobCardId ? (
          <OwnerInvoiceEstimateView
            key={detailJobCardId}
            jobCardId={detailJobCardId}
            token={token}
            cachedJobCard={detailJobCard}
            jobNoHint={detailJobCard ? resolveJobCardNo(detailJobCard) : null}
            callingCode={countryCode}
            documentKind="jobcard"
            onBack={closeDetail}
          />
        ) : (
          <>
            <header className={`${ownerPageIntroClass} flex flex-wrap items-end justify-between gap-3`}>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">Review and approve shop job cards</p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  Job Cards
                </h1>
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
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
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

                  <div className="flex flex-wrap items-end gap-3">
                    {vehicles.length > 0 ? (
                      <div className="min-w-[11rem] sm:min-w-[14rem]">
                        <label className={ownerVehicleLabelClass} htmlFor="job-cards-vehicle-filter">
                          Vehicle
                        </label>
                        <select
                          id="job-cards-vehicle-filter"
                          value={vehicleFilter}
                          onChange={(e) => {
                            setVehicleFilter(e.target.value);
                            setSelectedIds([]);
                          }}
                          aria-label="Filter by vehicle"
                          className={ownerVehicleSelectClass}
                        >
                          <option value="">All vehicles</option>
                          {vehicles.map((vehicle, index) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicleOptionLabel(vehicle, index)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          vehicleFilter
                            ? `/owner/expenses/invoices?vehicleId=${encodeURIComponent(vehicleFilter)}`
                            : "/owner/expenses/invoices",
                        )
                      }
                      className="inline-flex h-10 items-center gap-1 rounded-xl bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-black/5 transition hover:bg-white"
                    >
                      View invoices
                    </button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <EmptyState>
                    {vehicleFilter ? "No job cards for this vehicle." : "No job cards yet."}
                  </EmptyState>
                ) : (
                  <div className={OWNER_TABLE_SURFACE_CLASS}>
                    <div className="overflow-x-auto">
                      <table className={OWNER_PANEL_TABLE.table}>
                        <thead>
                          <tr className="bg-gradient-to-r from-ad-purple to-ad-purple-dark text-white">
                            <th className={`${OWNER_TABLE_HEAD_TH_CLASS} w-10`}>
                              <input
                                type="checkbox"
                                checked={
                                  selectedIds.length > 0 && selectedIds.length === items.length
                                }
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
                            const amount = formatCurrencyAmount(
                              resolveJobCardTotal(jc),
                              countryCode,
                            );
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
                                    {formatOwnerJobCardNo(jobNo)}
                                  </button>
                                </td>
                                <td className={OWNER_TABLE_BODY_TD_CLASS}>
                                  {formatJobCardDate(jc.createdAt || jc.date || "")}
                                </td>
                                <td className={OWNER_TABLE_BODY_TD_CLASS}>
                                  {businessName(jc.business)}
                                </td>
                                <td className={OWNER_TABLE_BODY_TD_CLASS}>{phone}</td>
                                <td
                                  className={`${OWNER_TABLE_BODY_TD_CLASS} font-semibold text-slate-900`}
                                >
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
                )}
              </div>
            )}
          </>
        )}
      </div>
    </OwnerPageShell>
  );
}
