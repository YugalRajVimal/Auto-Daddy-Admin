import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import ShopDealFormDialog from "../../components/shop/forms/ShopDealFormDialog";
import { shopAddNewButtonClass } from "../../components/shop/forms/ShopFormPage";
import { ShopReveal } from "../../components/shop/ShopAnimated";
import ShopPageShell from "../../components/shop/ShopPageShell";
import ShopDealsBoard, { ShopDealsBoardSkeleton } from "../../components/shop/ShopDealsBoard";
import { ShopErrorPanel } from "../../components/shop/ShopPanels";
import useAuth from "../../auth/useAuth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopDeals, type DealFilter } from "../../hooks/useShopDeals";
import {
  deleteDeal,
  type DealFormFields,
  updateDeal,
} from "../../lib/shopOwnerMutations";
import { dealId } from "../../lib/shopOwnerParsers";
import type { ShopDeal } from "../../types/shopOwner";
import { printAdminTable } from "../../utils/adminPrintTable";

type DealSectionId = "service" | "parts" | "salvage";

const DEAL_SECTIONS: { id: DealSectionId; label: string }[] = [
  { id: "parts", label: "Spare Part Deals" },
  { id: "service", label: "Service Deals" },
  { id: "salvage", label: "Salvages" },
];

const DEAL_TOOLBAR_GRAY_BUTTON_CLASS =
  "bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50";
const DEAL_TOOLBAR_GREEN_BUTTON_CLASS =
  "bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50";

function toFilter(id: DealSectionId): DealFilter {
  if (id === "service" || id === "parts") return id;
  return "all";
}

function formatDealDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
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
    return deal.partName?.trim() || deal.productName?.trim() || "—";
  }
  return deal.service?.name?.trim() || deal.productName?.trim() || deal.description?.trim() || "—";
}

function shopDealDiscountPercent(deal: ShopDeal): string {
  const price = Number(deal.price);
  const discounted = Number(deal.discountedPrice);
  if (!Number.isFinite(price) || !Number.isFinite(discounted) || price <= 0 || discounted <= 0 || discounted >= price) {
    if (Number.isFinite(discounted) && discounted > 0) return `${discounted}%`;
    return "—";
  }
  return `${Math.round((1 - discounted / price) * 100)}%`;
}

function dealStatusLabel(deal: ShopDeal): string {
  return deal.dealEnabled === false ? "Non-Active" : "Active";
}

function dealVehicleLabel(deal: ShopDeal): string {
  const vehicle = deal.selectedVehicle;
  if (!vehicle) return "—";
  const name = vehicle.vehicleName?.trim() || vehicle.name?.trim();
  const model = vehicle.model?.trim();
  if (name && model) return `${name}-${model}`;
  return name || model || "—";
}

function dealVehicleYear(deal: ShopDeal): string {
  return deal.selectedVehicle?.year?.trim() || "—";
}

function isSalvageDeal(deal: ShopDeal): boolean {
  const haystack = [deal.productName, deal.partName, deal.description, deal.dealType, deal.service?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\bsalvage/i.test(haystack);
}

function dealToFormFields(deal: ShopDeal, overrides?: Partial<DealFormFields>): DealFormFields {
  const mode = dealMode(deal);
  const fields: DealFormFields = {
    dealType: mode === "parts" ? "Parts" : "Service",
    discountedPrice: deal.discountedPrice != null ? String(deal.discountedPrice) : "",
    description: deal.description ?? "",
    offersEndOnDate: deal.offersEndOnDate?.slice(0, 10) ?? "",
    dealEnabled: deal.dealEnabled === false ? "false" : "true",
    ...overrides,
  };
  if (mode === "parts") {
    fields.partName = deal.partName ?? deal.productName ?? "";
    fields.vehicleId = deal.vehicleId;
    fields.vehicleName = deal.selectedVehicle?.vehicleName ?? deal.selectedVehicle?.name;
    fields.vehicleModel = deal.selectedVehicle?.model;
    fields.vehicleYear = deal.selectedVehicle?.year;
  } else {
    fields.serviceId = deal.serviceId;
    fields.productName = deal.productName ?? deal.service?.name ?? "";
    fields.price = deal.price != null ? String(deal.price) : fields.discountedPrice;
  }
  return fields;
}

function dealsMatchingSelection(selectedIds: Set<string>, deals: ShopDeal[]): ShopDeal[] {
  return deals.filter((deal) => selectedIds.has(dealId(deal)));
}

function DealsToolbar({
  canDelete,
  canDeactivate,
  canPrint,
  bulkBusy,
  onDelete,
  onDeactivate,
  onPrint,
  onAddNew,
}: {
  canDelete: boolean;
  canDeactivate: boolean;
  canPrint: boolean;
  bulkBusy: boolean;
  onDelete: () => void;
  onDeactivate: () => void;
  onPrint: () => void;
  onAddNew: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete || bulkBusy}
          className={DEAL_TOOLBAR_GRAY_BUTTON_CLASS}
        >
          Delete
        </button>
        <button
          type="button"
          onClick={onDeactivate}
          disabled={!canDeactivate || bulkBusy}
          className={DEAL_TOOLBAR_GRAY_BUTTON_CLASS}
        >
          Non-Active
        </button>
        <button
          type="button"
          onClick={onPrint}
          disabled={!canPrint}
          className={DEAL_TOOLBAR_GREEN_BUTTON_CLASS}
        >
          Print
        </button>
      </div>
      <button type="button" onClick={onAddNew} className={shopAddNewButtonClass}>
        + Add New
      </button>
    </div>
  );
}

export default function ShopDealsPage() {
  const { token } = useAuth();
  const { faqsHeading, faqsDescription, displayName, businessPhone, business } = useShopOwnerPortal();
  const [activeId, setActiveId] = useState<DealSectionId>("parts");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"service" | "parts">("parts");
  const [editingDeal, setEditingDeal] = useState<ShopDeal | null>(null);
  const [selectedDealIds, setSelectedDealIds] = useState<Set<string>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const { deals: rawDeals, loading, error, refresh } = useShopDeals(toFilter(activeId));

  const deals = useMemo(() => {
    if (activeId === "salvage") return rawDeals.filter(isSalvageDeal);
    return rawDeals;
  }, [activeId, rawDeals]);

  const selectedDeals = useMemo(
    () => dealsMatchingSelection(selectedDealIds, deals),
    [selectedDealIds, deals],
  );

  const hasBulkSelection = selectedDeals.length > 0;
  const canBulkDelete = hasBulkSelection && !bulkBusy;
  const canBulkDeactivate =
    hasBulkSelection && !bulkBusy && selectedDeals.some((deal) => deal.dealEnabled !== false);
  const canPrint = hasBulkSelection;

  useEffect(() => {
    setFormOpen(false);
    setEditingDeal(null);
    setSelectedDealIds(new Set());
  }, [activeId]);

  const closeForm = () => {
    setFormOpen(false);
    setEditingDeal(null);
  };

  const openCreate = () => {
    setEditingDeal(null);
    setFormMode(activeId === "parts" || activeId === "salvage" ? "parts" : "service");
    setFormOpen(true);
  };

  const openEdit = (deal: ShopDeal) => {
    setEditingDeal(deal);
    setFormMode(dealMode(deal));
    setFormOpen(true);
  };

  const toggleDealSelection = (id: string) => {
    setSelectedDealIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const businessName = business?.businessName?.trim() || displayName || "Your Business";
  const website = (business as { businessWebsite?: string } | undefined)?.businessWebsite?.trim();

  const handleBulkDelete = async () => {
    if (!canBulkDelete || !token) return;
    const rows = selectedDeals;
    const count = rows.length;
    if (!window.confirm(`Delete ${count} selected deal${count === 1 ? "" : "s"}?`)) return;

    setBulkBusy(true);
    let failed = 0;
    try {
      for (const deal of rows) {
        const id = dealId(deal);
        const res = await deleteDeal(token, id);
        if (!res.ok) failed += 1;
      }
      await refresh();
      setSelectedDealIds(new Set());
      if (failed > 0) {
        toast.error(`Delete failed for ${failed} deal${failed === 1 ? "" : "s"}.`);
      } else {
        toast.success(`Deleted ${count} deal${count === 1 ? "" : "s"}.`);
      }
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (!canBulkDeactivate || !token) return;
    const rows = selectedDeals.filter((deal) => deal.dealEnabled !== false);
    const count = rows.length;
    if (count === 0) {
      toast.info("Selected deals are already non-active.");
      return;
    }
    if (!window.confirm(`Mark ${count} selected deal${count === 1 ? "" : "s"} as non-active?`)) return;

    setBulkBusy(true);
    let failed = 0;
    try {
      for (const deal of rows) {
        const id = dealId(deal);
        const res = await updateDeal(token, id, dealToFormFields(deal, { dealEnabled: "false" }));
        if (!res.ok) failed += 1;
      }
      await refresh();
      setSelectedDealIds(new Set());
      if (failed > 0) {
        toast.error(`Non-active update failed for ${failed} deal${failed === 1 ? "" : "s"}.`);
      } else {
        toast.success(`Marked ${count} deal${count === 1 ? "" : "s"} as non-active.`);
      }
    } finally {
      setBulkBusy(false);
    }
  };

  const handlePrint = () => {
    if (!canPrint) return;
    const showVehicleColumns = activeId !== "service";
    const headers = [
      "Opening Date",
      "Closing Date",
      activeId === "service" ? "Service Name" : "Part Name",
      ...(showVehicleColumns ? ["Vehicle", "Year"] : []),
      "Discount",
      "Status",
    ];
    const rows = selectedDeals.map((deal) => {
      const base = [
        formatDealDate(deal.createdAt),
        formatDealDate(deal.offersEndOnDate),
        shopDealTitle(deal),
      ];
      if (showVehicleColumns) {
        base.push(dealVehicleLabel(deal), dealVehicleYear(deal));
      }
      base.push(shopDealDiscountPercent(deal), dealStatusLabel(deal));
      return base;
    });
    printAdminTable({ title: "Deals On Board", headers, rows });
  };

  return (
    <ShopPageShell
      pageHeading="Deals On Board"
      metaTitle="Deals | AutoDaddy"
      metaDescription="Auto shop deals"
      sidebarItems={DEAL_SECTIONS.map((section) => ({
        id: section.id,
        label: section.label,
        variant: "primary" as const,
      }))}
      activeSidebarId={activeId}
      onSidebarSelect={(id) => setActiveId(id as DealSectionId)}
      heroCardFlush
      heroBackgroundImage={false}
      contentTopOffset
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <div className="space-y-3">
        <ShopReveal show={formOpen}>
          <ShopDealFormDialog
            mode={formMode}
            deal={editingDeal}
            onCancel={closeForm}
            onSaved={() => void refresh()}
          />
        </ShopReveal>

        {loading ? (
          <div className="shop-hero-surface rounded border border-gray-300 bg-white p-5 shadow-sm">
            <ShopDealsBoardSkeleton />
          </div>
        ) : error ? (
          <ShopErrorPanel message={error} onRetry={() => void refresh()} />
        ) : (
          <ShopDealsBoard
            deals={deals}
            section={activeId}
            selectedIds={selectedDealIds}
            businessName={businessName}
            businessPhone={businessPhone}
            website={website}
            toolbar={
              <DealsToolbar
                canDelete={canBulkDelete}
                canDeactivate={canBulkDeactivate}
                canPrint={canPrint}
                bulkBusy={bulkBusy}
                onDelete={() => void handleBulkDelete()}
                onDeactivate={() => void handleBulkDeactivate()}
                onPrint={handlePrint}
                onAddNew={openCreate}
              />
            }
            onToggleRow={toggleDealSelection}
            onEdit={openEdit}
          />
        )}
      </div>
    </ShopPageShell>
  );
}
