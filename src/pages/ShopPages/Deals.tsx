import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import ShopDealFormDialog from "../../components/shop/forms/ShopDealFormDialog";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopEmptyPanel,
  ShopErrorPanel,
  ShopListPanel,
  ShopLoadingPanel,
  ShopPageContentShell,
} from "../../components/shop/ShopPanels";
import useAuth from "../../auth/useAuth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopDeals, type DealFilter } from "../../hooks/useShopDeals";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import { apiMessage, deleteDeal } from "../../lib/shopOwnerMutations";
import { dealId } from "../../lib/shopOwnerParsers";
import type { ShopDeal } from "../../types/shopOwner";

type DealSectionId = "all" | "service" | "parts" | "salvage";

const DEAL_SECTIONS: { id: DealSectionId; label: string }[] = [
  { id: "all", label: "All deals" },
  { id: "service", label: "Service Deals" },
  { id: "parts", label: "Parts Deal" },
  { id: "salvage", label: "Salvages" },
];

const SECTION_HEADINGS: Record<DealSectionId, string> = {
  all: "All Deals",
  service: "Deals on Service",
  parts: "Parts Deal",
  salvage: "Salvages",
};

function toFilter(id: DealSectionId): DealFilter {
  if (id === "service" || id === "parts") return id;
  return "all";
}

function displayPhone(phone: string | undefined): string {
  const p = (phone ?? "").trim();
  if (!p) return "—";
  const digits = p.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return p;
}

function formatEndDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dealMode(deal: ShopDeal): "service" | "parts" {
  if (deal.dealType?.toLowerCase() === "parts" || deal.partName) return "parts";
  return "service";
}

function shopDealTitle(deal: ShopDeal): string {
  if (dealMode(deal) === "parts") {
    return deal.partName?.trim() || deal.productName?.trim() || "Parts deal";
  }
  return deal.service?.name?.trim() || deal.productName?.trim() || deal.description?.trim() || "Service deal";
}

function shopDealDiscountPercent(deal: ShopDeal): number | null {
  const price = Number(deal.price);
  const discounted = Number(deal.discountedPrice);
  if (!Number.isFinite(price) || !Number.isFinite(discounted) || price <= 0 || discounted <= 0 || discounted >= price) {
    return null;
  }
  return Math.round((1 - discounted / price) * 100);
}

function isSalvageDeal(deal: ShopDeal): boolean {
  const haystack = [deal.productName, deal.partName, deal.description, deal.dealType, deal.service?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\bsalvage/i.test(haystack);
}

function DealCard({
  deal,
  businessName,
  businessPhone,
  deletingId,
  onEdit,
  onDelete,
}: {
  deal: ShopDeal;
  businessName: string;
  businessPhone: string;
  deletingId: string | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const id = dealId(deal);
  const imageUri = normalizeMediaUrl(deal.dealImage ?? deal.productImage);
  const discount = shopDealDiscountPercent(deal);
  const phoneHref = businessPhone ? `tel:${businessPhone.replace(/\s/g, "")}` : undefined;

  return (
    <article className="flex flex-col gap-3 rounded-md border border-[#008000] bg-[#d4fcd4] p-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-4">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-gray-300 bg-white">
          {imageUri ? <img src={imageUri} alt="" className="h-full w-full object-cover" /> : null}
        </div>

        <div className="min-w-0 shrink-0 sm:w-[22%]">
          <p className="truncate text-base font-bold text-[#008000]">{businessName || "—"}</p>
          {phoneHref ? (
            <a href={phoneHref} className="text-sm font-semibold text-blue-700 hover:underline">
              {displayPhone(businessPhone)}
            </a>
          ) : (
            <p className="text-sm font-semibold text-blue-700">{displayPhone(businessPhone)}</p>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-gray-900">{shopDealTitle(deal)}</p>
          <p className="text-sm font-semibold text-blue-700">Ends on : {formatEndDate(deal.offersEndOnDate)}</p>
          {deal.dealEnabled === false ? (
            <p className="mt-0.5 text-xs font-semibold text-red-600">Disabled</p>
          ) : null}
          <div className="mt-1 flex gap-3 sm:hidden">
            <button
              type="button"
              className="text-xs font-semibold text-ad-purple hover:underline"
              onClick={onEdit}
            >
              Edit
            </button>
            <button
              type="button"
              className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
              disabled={deletingId === id}
              onClick={onDelete}
            >
              {deletingId === id ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:shrink-0 sm:flex-col sm:justify-center sm:text-center">
        <div>
          <p className="text-2xl font-bold leading-none text-[#008000]">{discount != null ? `${discount} %` : "—"}</p>
          <p className="mt-1 text-sm font-semibold text-blue-700">Discount</p>
        </div>
        <div className="hidden gap-3 sm:flex">
          <button
            type="button"
            className="text-xs font-semibold text-ad-purple hover:underline"
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            type="button"
            className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
            disabled={deletingId === id}
            onClick={onDelete}
          >
            {deletingId === id ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ShopDealsPage() {
  const { token } = useAuth();
  const { faqsHeading, faqsDescription, displayName, businessPhone } = useShopOwnerPortal();
  const [activeId, setActiveId] = useState<DealSectionId>("service");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"service" | "parts">("service");
  const [editingDeal, setEditingDeal] = useState<ShopDeal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { deals: rawDeals, loading, error, refresh } = useShopDeals(toFilter(activeId));

  const deals = useMemo(() => {
    if (activeId === "salvage") return rawDeals.filter(isSalvageDeal);
    return rawDeals;
  }, [activeId, rawDeals]);

  const openCreate = () => {
    setEditingDeal(null);
    setDialogMode(activeId === "parts" ? "parts" : "service");
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
      pageHeading={SECTION_HEADINGS[activeId]}
      metaTitle="Deals | AutoDaddy"
      metaDescription="Auto shop deals"
      headerAction={
        <button
          type="button"
          className="shrink-0 rounded-md bg-[#008000] px-4 py-2 text-sm font-bold text-white hover:bg-[#006600]"
          onClick={openCreate}
        >
          + Add New
        </button>
      }
      sidebarItems={DEAL_SECTIONS.map((section) => ({
        id: section.id,
        label: section.label,
        variant: "primary" as const,
      }))}
      activeSidebarId={activeId}
      onSidebarSelect={(id) => setActiveId(id as DealSectionId)}
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <ShopPageContentShell>
        {loading ? (
          <ShopLoadingPanel variant="deal-card" count={4} />
        ) : error ? (
          <ShopErrorPanel message={error} onRetry={() => void refresh()} />
        ) : deals.length === 0 ? (
          <ShopEmptyPanel message="No deals in this category." />
        ) : (
          <ShopListPanel>
            {deals.map((deal) => (
              <DealCard
                key={dealId(deal)}
                deal={deal}
                businessName={displayName}
                businessPhone={businessPhone}
                deletingId={deletingId}
                onEdit={() => openEdit(deal)}
                onDelete={() => void handleDelete(deal)}
              />
            ))}
          </ShopListPanel>
        )}
      </ShopPageContentShell>

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
