import { useState } from "react";
import { toast } from "react-toastify";
import ShopDealFormDialog from "../../components/shop/forms/ShopDealFormDialog";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopEmptyPanel,
  ShopErrorPanel,
  ShopListPanel,
  ShopLoadingPanel,
  ShopRefreshButton,
} from "../../components/shop/ShopPanels";
import useAuth from "../../auth/useAuth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopDeals, type DealFilter } from "../../hooks/useShopDeals";
import { formatCurrencyAmount } from "../../lib/currency";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import { apiMessage, deleteDeal } from "../../lib/shopOwnerMutations";
import { dealId } from "../../lib/shopOwnerParsers";
import type { ShopDeal } from "../../types/shopOwner";

const DEAL_SECTIONS = [
  { id: "all", label: "All deals", variant: "primary" as const },
  { id: "service", label: "Service Deals", variant: "secondary" as const },
  { id: "parts", label: "Parts Deal", variant: "secondary" as const },
];

function toFilter(id: string): DealFilter {
  if (id === "service" || id === "parts") return id;
  return "all";
}

function formatEndDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function dealMode(deal: ShopDeal): "service" | "parts" {
  if (deal.dealType?.toLowerCase() === "parts" || deal.partName) return "parts";
  return "service";
}

export default function ShopDealsPage() {
  const { session, token } = useAuth();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [activeId, setActiveId] = useState("all");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"service" | "parts">("service");
  const [editingDeal, setEditingDeal] = useState<ShopDeal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { deals, loading, error, refresh } = useShopDeals(toFilter(activeId));

  const openCreate = (mode: "service" | "parts") => {
    setEditingDeal(null);
    setDialogMode(mode);
    setDialogOpen(true);
  };

  const openEdit = (deal: ShopDeal) => {
    setEditingDeal(deal);
    setDialogMode(dealMode(deal));
    setDialogOpen(true);
  };

  const handleDelete = async (deal: ShopDeal) => {
    if (!token) return;
    const id = dealId(deal);
    if (!id || !window.confirm("Delete this deal?")) return;
    setDeletingId(id);
    try {
      const res = await deleteDeal(token, id);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not delete deal.");
        return;
      }
      toast.success("Deal deleted.");
      void refresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ShopPageShell
      metaTitle="Deals | AutoDaddy"
      metaDescription="Auto shop deals"
      sidebarItems={DEAL_SECTIONS}
      activeSidebarId={activeId}
      onSidebarSelect={setActiveId}
      headerAction={
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md bg-[#008000] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#006600]"
            onClick={() => openCreate(activeId === "parts" ? "parts" : "service")}
          >
            + Add
          </button>
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
      ) : deals.length === 0 ? (
        <ShopEmptyPanel message="No deals in this category." />
      ) : (
        <ShopListPanel>
          {deals.map((deal) => {
            const id = dealId(deal);
            const imageUri = normalizeMediaUrl(deal.dealImage ?? deal.productImage);
            return (
              <article
                key={id}
                className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm"
              >
                <div className="bg-[#FDE4D0] px-4 py-3">
                  <p className="text-sm font-bold text-ad-purple">{deal.productName ?? deal.partName ?? "Deal"}</p>
                  {deal.description ? <p className="mt-1 text-xs text-gray-600">{deal.description}</p> : null}
                </div>
                <div className="flex gap-4 p-4">
                  {imageUri ? (
                    <img src={imageUri} alt="" className="h-20 w-20 shrink-0 rounded object-cover" />
                  ) : null}
                  <div className="flex flex-1 flex-col justify-center gap-1">
                    <p className="text-sm text-gray-700">
                      <span className="line-through">
                        {formatCurrencyAmount(deal.price, session?.meta?.countryCode)}
                      </span>{" "}
                      <span className="font-bold text-[#006600]">
                        {formatCurrencyAmount(deal.discountedPrice, session?.meta?.countryCode)}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">Ends {formatEndDate(deal.offersEndOnDate)}</p>
                    {deal.dealEnabled === false ? (
                      <p className="text-xs font-semibold text-red-600">Disabled</p>
                    ) : null}
                    <div className="mt-1 flex gap-3">
                      <button
                        type="button"
                        className="text-xs font-semibold text-ad-purple hover:underline"
                        onClick={() => openEdit(deal)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                        disabled={deletingId === id}
                        onClick={() => void handleDelete(deal)}
                      >
                        {deletingId === id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </ShopListPanel>
      )}

      <ShopDealFormDialog
        open={dialogOpen}
        mode={dialogMode}
        deal={editingDeal}
        onClose={() => setDialogOpen(false)}
        onSaved={() => void refresh()}
      />
    </ShopPageShell>
  );
}
