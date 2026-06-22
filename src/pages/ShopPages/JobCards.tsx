import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopEmptyPanel,
  ShopErrorPanel,
  ShopGreenRow,
  ShopListPanel,
  ShopLoadingPanel,
  ShopRefreshButton,
} from "../../components/shop/ShopPanels";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopJobCards } from "../../hooks/useShopJobCards";
import { formatCurrencyAmount } from "../../lib/currency";
import useAuth from "../../auth/useAuth";
import {
  apiMessage,
  deleteJobCard,
  markJobCardPaymentStatus,
  resendJobCardNotification,
} from "../../lib/shopOwnerMutations";
import { isJobCardPending } from "../../lib/shopOwnerJobCards";

const JOB_CARD_SECTIONS = [{ id: "job-cards", label: "Job Cards", variant: "primary" as const }];

export default function ShopJobCardsPage() {
  const navigate = useNavigate();
  const { session, token } = useAuth();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [search, setSearch] = useState("");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const { cards, loading, error, refresh } = useShopJobCards(search);

  const runAction = async (id: string, fn: () => Promise<void>) => {
    setActionId(id);
    try {
      await fn();
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (!token || !window.confirm("Delete this job card?")) return;
    void runAction(id, async () => {
      const res = await deleteJobCard(token, id);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not delete job card.");
        return;
      }
      toast.success("Job card deleted.");
      void refresh();
    });
  };

  const handleMarkPaid = (id: string) => {
    if (!token) return;
    void runAction(id, async () => {
      const res = await markJobCardPaymentStatus(token, id, "Paid");
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not update payment status.");
        return;
      }
      toast.success("Marked as paid.");
      void refresh();
    });
  };

  const handleResend = (id: string) => {
    if (!token) return;
    void runAction(id, async () => {
      const res = await resendJobCardNotification(token, id);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not resend notification.");
        return;
      }
      toast.success("Notification resent.");
    });
  };

  return (
    <ShopPageShell
      metaTitle="Job Cards | AutoDaddy"
      metaDescription="Auto shop job cards"
      sidebarItems={JOB_CARD_SECTIONS}
      activeSidebarId="job-cards"
      searchPlaceholder="Search customer"
      searchValue={search}
      onSearchChange={setSearch}
      headerAction={
        <div className="flex items-center gap-2">
          <Link
            to="/shop/job-cards/new"
            className="rounded-md bg-[#008000] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#006600]"
          >
            + Add
          </Link>
          <ShopRefreshButton onClick={() => void refresh()} />
        </div>
      }
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      {loading ? (
        <ShopLoadingPanel />
      ) : error ? (
        <ShopErrorPanel message={error} onRetry={() => void refresh()} />
      ) : cards.length === 0 ? (
        <ShopEmptyPanel message="No job cards yet." />
      ) : (
        <ShopListPanel>
          {cards.map((jc) => {
            const pending = isJobCardPending(jc);
            const busy = actionId === jc.id;
            return (
              <ShopGreenRow
                key={jc.id}
                left={
                  <p className="text-sm font-bold leading-tight text-white">
                    {jc.jobNo ?? jc.listBucket ?? "Job"}
                  </p>
                }
                center={
                  <div>
                    <p className="text-sm font-bold text-gray-900">{jc.customerName ?? "—"}</p>
                    {jc.phone ? (
                      <a
                        href={`tel:${jc.phone.replace(/\s/g, "")}`}
                        className="text-sm font-semibold text-blue-700 hover:underline"
                      >
                        {jc.phone}
                      </a>
                    ) : null}
                    {jc.vehiclePlate ? <p className="text-xs text-gray-600">{jc.vehiclePlate}</p> : null}
                    {jc.servicesSummary ? <p className="text-xs text-gray-500">{jc.servicesSummary}</p> : null}
                    <div className="mt-1 flex flex-wrap gap-2">
                      {pending ? (
                        <button
                          type="button"
                          className="text-xs font-semibold text-ad-purple hover:underline disabled:opacity-50"
                          disabled={busy}
                          onClick={() =>
                            navigate(`/shop/job-cards/${jc.id}/edit`, {
                              state: { jobCard: jc.raw as Record<string, unknown> },
                            })
                          }
                        >
                          Edit
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                        disabled={busy}
                        onClick={() => handleDelete(jc.id)}
                      >
                        Delete
                      </button>
                      {jc.unpaid || jc.paymentStatus?.toLowerCase() !== "paid" ? (
                        <button
                          type="button"
                          className="text-xs font-semibold text-[#008000] hover:underline disabled:opacity-50"
                          disabled={busy}
                          onClick={() => handleMarkPaid(jc.id)}
                        >
                          Mark paid
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="text-xs font-semibold text-blue-700 hover:underline disabled:opacity-50"
                        disabled={busy}
                        onClick={() => handleResend(jc.id)}
                      >
                        Resend
                      </button>
                    </div>
                  </div>
                }
                right={
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#008000]">{jc.status ?? jc.paymentStatus ?? "—"}</p>
                    <p className="text-sm font-semibold text-blue-700">{jc.date ?? "—"}</p>
                    {jc.total != null ? (
                      <p className="text-xs font-bold text-gray-800">
                        {formatCurrencyAmount(jc.total, session?.meta?.countryCode)}
                      </p>
                    ) : null}
                  </div>
                }
              />
            );
          })}
        </ShopListPanel>
      )}
    </ShopPageShell>
  );
}
