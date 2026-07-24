import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  ADMIN_PANEL_THEAD_ROW_CLASS,
  adminPanelRowClass,
  adminPanelTableClasses,
  type AdminPanelTableClasses,
} from "../../components/admin/adminPanelTableStyles";
import ShopDealFormDialog from "../../components/shop/forms/ShopDealFormDialog";
import { shopAddNewButtonClass } from "../../components/shop/forms/ShopFormPage";
import { ShopReveal } from "../../components/shop/ShopAnimated";
import ShopPageShell from "../../components/shop/ShopPageShell";
import ShopDealsBoard, { ShopDealsBoardSkeleton } from "../../components/shop/ShopDealsBoard";
import { ShopListSkeleton } from "../../components/shop/ShopListSkeletons";
import { ShopErrorPanel } from "../../components/shop/ShopPanels";
import { shopTableToolbarCompactClass } from "../../components/shop/shopLayoutStyles";
import useAuth from "../../auth/useAuth";
import { useShopCustomers } from "../../hooks/useShopCustomers";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopDeals, type DealFilter } from "../../hooks/useShopDeals";
import {
  deleteAutoshopDeal,
  type AutoshopDealFormFields,
  type AutoshopDealType,
  updateAutoshopDeal,
} from "../../lib/autoshopownerDealsApi";
import {
  applyDealSales,
  isDealSold,
  removeDealSale,
  writeDealSale,
} from "../../lib/shopDealSales";
import { dealId, isSalvagesDeal, shopDealDiscountLabel } from "../../lib/shopOwnerParsers";
import type { MyCustomer, ShopDeal } from "../../types/shopOwner";
import { printAdminTable } from "../../utils/adminPrintTable";
import { formatDisplayDate } from "../AdminPages/Accounts/accountData";

type DealSectionId = "service" | "parts" | "salvage" | "completed";
type DealBoardSectionId = "service" | "parts" | "salvage";
type DealView = "list" | "detail";

const DEAL_SECTIONS: { id: DealSectionId; label: string }[] = [
  { id: "parts", label: "Spare Part Deals" },
  { id: "service", label: "Service Deals" },
  { id: "salvage", label: "Salvages" },
  { id: "completed", label: "Completed" },
];

const DEAL_TOOLBAR_GRAY_BUTTON_CLASS =
  "bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50";
const DEAL_TOOLBAR_GREEN_BUTTON_CLASS =
  "bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50";
const DEAL_SELL_BUTTON_CLASS =
  "bg-ad-green px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50";
const DEAL_SOLD_TO_SELECT_CLASS =
  "h-7 min-w-[8.5rem] max-w-[11rem] border border-gray-400 bg-white px-1.5 text-xs text-gray-800 focus:border-blue-500 focus:outline-none";

const SHOP_TABLE_BASE = adminPanelTableClasses(true);
const SHOP_TABLE: AdminPanelTableClasses = {
  ...SHOP_TABLE_BASE,
  th: SHOP_TABLE_BASE.th.replace("px-2", "px-4"),
  thCheckbox: SHOP_TABLE_BASE.thCheckbox.replace("px-2", "px-4"),
  td: SHOP_TABLE_BASE.td.replace("px-2", "px-4"),
  tdCheckbox: SHOP_TABLE_BASE.tdCheckbox.replace("px-2", "px-4"),
};
const SHOP_TABLE_HEAD_TH_CLASS = `${SHOP_TABLE.th} h-9 py-0 align-middle`;
const SHOP_TABLE_HEAD_TH_CHECKBOX_CLASS = `${SHOP_TABLE.thCheckbox} h-9 py-0 align-middle`;
const SHOP_TABLE_BODY_TD_CLASS = `${SHOP_TABLE.td} h-9 py-0 align-middle whitespace-nowrap`;
const SHOP_TABLE_BODY_TD_CHECKBOX_CLASS = `${SHOP_TABLE.tdCheckbox} h-9 py-0 align-middle`;
const SHOP_TABLE_CHECKBOX_CLASS = "h-3.5 w-3.5 accent-ad-purple";

function toFilter(id: DealSectionId): DealFilter {
  if (id === "service" || id === "parts") return id;
  return "all";
}

function formatDealDate(iso?: string): string {
  if (!iso?.trim()) return "—";
  return formatDisplayDate(iso.trim());
}

function dealMode(deal: ShopDeal): "service" | "parts" {
  if (deal.dealType?.toLowerCase() === "parts" || deal.partName) return "parts";
  return "service";
}

function shopDealTitle(deal: ShopDeal): string {
  if (dealMode(deal) === "parts") {
    return deal.partName?.trim() || deal.productName?.trim() || "—";
  }
  return (
    deal.subServiceName?.trim() ||
    deal.productName?.trim() ||
    deal.description?.trim() ||
    deal.service?.name?.trim() ||
    "—"
  );
}

function dealStatusLabel(deal: ShopDeal): string {
  if (isDealSold(deal)) return "Sold";
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
  if (isSalvagesDeal(deal)) return true;
  const haystack = [deal.productName, deal.partName, deal.description, deal.dealType, deal.service?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\bsalvage/i.test(haystack);
}

function customerRecordId(customer: MyCustomer): string {
  return customer.carOwnerId ?? customer.id ?? customer._id ?? "";
}

function customerDisplayName(customer: MyCustomer): string {
  return customer.name?.trim() || customer.phone?.trim() || "Customer";
}

function dealSoldToLabel(deal: ShopDeal): string {
  return deal.soldToCustomerName?.trim() || "—";
}

function boardSectionForDeal(deal: ShopDeal, activeId: DealSectionId): DealBoardSectionId {
  if (activeId === "parts" || activeId === "service" || activeId === "salvage") return activeId;
  if (isSalvageDeal(deal)) return "salvage";
  return dealMode(deal) === "parts" ? "parts" : "service";
}

function dealToFormFields(deal: ShopDeal, overrides?: Partial<AutoshopDealFormFields>): AutoshopDealFormFields {
  const mode = dealMode(deal);
  const dealType: AutoshopDealType = isSalvagesDeal(deal)
    ? "Salvages"
    : mode === "parts"
      ? "Parts"
      : "Service";
  const fields: AutoshopDealFormFields = {
    dealType,
    discountedPrice: deal.discountedPrice != null ? String(deal.discountedPrice) : "",
    description: deal.description ?? "",
    offersEndOnDate: deal.offersEndOnDate?.slice(0, 10) ?? "",
    dealEnabled: deal.dealEnabled === false ? "false" : "true",
    soldToCustomerId: deal.soldToCustomerId,
    soldToCustomerName: deal.soldToCustomerName,
    ...overrides,
  };
  if (mode === "parts" || dealType === "Salvages") {
    fields.partName = deal.partName ?? deal.productName ?? "";
    fields.vehicleId = deal.vehicleId;
    fields.vehicleName = deal.selectedVehicle?.vehicleName ?? deal.selectedVehicle?.name;
    fields.vehicleModel = deal.selectedVehicle?.model;
    fields.vehicleYear = deal.selectedVehicle?.year;
    fields.originalPrice =
      deal.price != null ? String(deal.price) : fields.discountedPrice;
  } else {
    fields.serviceId = deal.serviceId ?? deal.service?.id;
    fields.productName = deal.subServiceName ?? deal.productName ?? deal.service?.name;
    fields.subServiceName = deal.subServiceName ?? deal.productName;
    if (deal.price != null) fields.originalPrice = String(deal.price);
    // Service API expects discountedPrice as a percent (or discountPercentage on read).
    if (deal.discountPercentage != null && String(deal.discountPercentage).trim() !== "") {
      fields.discountedPrice = String(deal.discountPercentage);
    } else {
      const original = Number(deal.price);
      const discounted = Number(deal.discountedPrice);
      if (
        Number.isFinite(original) &&
        original > 0 &&
        Number.isFinite(discounted) &&
        discounted >= 0 &&
        discounted < original
      ) {
        fields.discountedPrice = String(Math.round((1 - discounted / original) * 100));
      }
    }
  }
  return fields;
}

function dealsMatchingSelection(selectedIds: Set<string>, deals: ShopDeal[]): ShopDeal[] {
  return deals.filter((deal) => selectedIds.has(dealId(deal)));
}

function DealsToolbar({
  showDelete,
  showDeactivate,
  hasSelection,
  canDelete,
  canDeactivate,
  canEdit,
  canAddNew,
  bulkBusy,
  onDelete,
  onDeactivate,
  onEdit,
  onPrint,
  onAddNew,
}: {
  showDelete: boolean;
  showDeactivate: boolean;
  hasSelection: boolean;
  canDelete: boolean;
  canDeactivate: boolean;
  canEdit: boolean;
  canAddNew: boolean;
  bulkBusy: boolean;
  onDelete: () => void;
  onDeactivate: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onAddNew: () => void;
}) {
  return (
    <div className={`${shopTableToolbarCompactClass} bg-gray-300 py-2`}>
      <div className="flex flex-wrap gap-1">
        {hasSelection ? (
          <>
            {canEdit ? (
              <button
                type="button"
                onClick={onEdit}
                disabled={bulkBusy}
                className={DEAL_TOOLBAR_GRAY_BUTTON_CLASS}
              >
                Edit
              </button>
            ) : null}
            {showDelete ? (
              <button
                type="button"
                onClick={onDelete}
                disabled={!canDelete || bulkBusy}
                className={DEAL_TOOLBAR_GRAY_BUTTON_CLASS}
              >
                Delete
              </button>
            ) : null}
            {showDeactivate ? (
              <button
                type="button"
                onClick={onDeactivate}
                disabled={!canDeactivate || bulkBusy}
                className={DEAL_TOOLBAR_GRAY_BUTTON_CLASS}
              >
                Non-Active
              </button>
            ) : null}
            <button
              type="button"
              onClick={onPrint}
              className={DEAL_TOOLBAR_GREEN_BUTTON_CLASS}
            >
              Print
            </button>
          </>
        ) : null}
      </div>
      {canAddNew ? (
        <button type="button" onClick={onAddNew} className={shopAddNewButtonClass}>
          + Add New
        </button>
      ) : null}
    </div>
  );
}

function DealsListTable({
  deals,
  section,
  customers,
  selectedIds,
  soldDraftIds,
  sellingDealId,
  onToggleRow,
  onTogglePage,
  onView,
  onSoldDraftChange,
  onSell,
}: {
  deals: ShopDeal[];
  section: DealSectionId;
  customers: MyCustomer[];
  selectedIds: Set<string>;
  soldDraftIds: Record<string, string>;
  sellingDealId: string | null;
  onToggleRow: (id: string) => void;
  onTogglePage: (ids: string[], checked: boolean) => void;
  onView: (deal: ShopDeal) => void;
  onSoldDraftChange: (dealId: string, customerId: string) => void;
  onSell: (deal: ShopDeal) => void;
}) {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const isCompleted = section === "completed";
  const showVehicleColumns = section !== "service";
  const showSoldTo = section !== "service";
  const nameHeader = section === "service" ? "Subservice" : "Part Name";
  const discountHeader = section === "service" ? "Discount (%)" : "Discounted Price";
  const pageRowIds = deals.map((deal) => dealId(deal));
  const allPageSelected = deals.length > 0 && pageRowIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageRowIds.some((id) => selectedIds.has(id));

  useEffect(() => {

    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  return (
    <div className="overflow-x-auto">
      <table className={SHOP_TABLE.table}>
        <thead>
          <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
            <th className={SHOP_TABLE_HEAD_TH_CHECKBOX_CLASS}>
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allPageSelected}
                onChange={(e) => onTogglePage(pageRowIds, e.target.checked)}
                aria-label="Select all deals"
                className={SHOP_TABLE_CHECKBOX_CLASS}
              />
            </th>
            <th className={SHOP_TABLE_HEAD_TH_CLASS}>Opening Date</th>
            <th className={SHOP_TABLE_HEAD_TH_CLASS}>Closing Date</th>
            <th className={SHOP_TABLE_HEAD_TH_CLASS}>{nameHeader}</th>
            {showVehicleColumns ? (
              <>
                <th className={SHOP_TABLE_HEAD_TH_CLASS}>Vehicle</th>
                <th className={SHOP_TABLE_HEAD_TH_CLASS}>Year</th>
              </>
            ) : null}
            <th className={SHOP_TABLE_HEAD_TH_CLASS}>{discountHeader}</th>
            <th className={SHOP_TABLE_HEAD_TH_CLASS}>Status</th>
            {showSoldTo ? <th className={SHOP_TABLE_HEAD_TH_CLASS}>Sold To</th> : null}
          </tr>
        </thead>
        <tbody>
          {deals.map((deal, index) => {
            const id = dealId(deal);
            const title = shopDealTitle(deal);
            const sold = isDealSold(deal);
            const draftCustomerId = soldDraftIds[id] ?? "";
            const canSell = !sold && Boolean(draftCustomerId) && sellingDealId !== id;
            return (
              <tr
                key={id}
                className={`${adminPanelRowClass(index)} cursor-pointer`}
                onClick={() => onView(deal)}
              >
                <td
                  className={SHOP_TABLE_BODY_TD_CHECKBOX_CLASS}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(id)}
                    onChange={() => onToggleRow(id)}
                    aria-label={`Select ${title}`}
                    className={SHOP_TABLE_CHECKBOX_CLASS}
                  />
                </td>
                <td className={SHOP_TABLE_BODY_TD_CLASS}>{formatDealDate(deal.createdAt)}</td>
                <td className={SHOP_TABLE_BODY_TD_CLASS}>{formatDealDate(deal.offersEndOnDate)}</td>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(deal);
                    }}
                    className="font-semibold text-blue-700 underline hover:text-blue-800"
                    title={`View ${title}`}
                    aria-label={`View ${title}`}
                  >
                    {title}
                  </button>
                </td>
                {showVehicleColumns ? (
                  <>
                    <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                      {dealVehicleLabel(deal)}
                    </td>
                    <td className={SHOP_TABLE_BODY_TD_CLASS}>{dealVehicleYear(deal)}</td>
                  </>
                ) : null}
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                  {shopDealDiscountLabel(deal)}
                </td>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>
                  {dealStatusLabel(deal)}
                </td>
                {showSoldTo ? (
                  <td
                    className={SHOP_TABLE_BODY_TD_CLASS}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {sold || isCompleted ? (
                      <span className="font-semibold text-gray-800">{dealSoldToLabel(deal)}</span>
                    ) : (
                      <div className="inline-flex items-center gap-1.5">
                        <select
                          value={draftCustomerId}
                          onChange={(e) => onSoldDraftChange(id, e.target.value)}
                          aria-label={`Sold to for ${title}`}
                          className={DEAL_SOLD_TO_SELECT_CLASS}
                        >
                          <option value="">None</option>
                          {customers.map((customer) => {
                            const cid = customerRecordId(customer);
                            if (!cid) return null;
                            return (
                              <option key={cid} value={cid}>
                                {customerDisplayName(customer)}
                              </option>
                            );
                          })}
                        </select>
                        <button
                          type="button"
                          disabled={!canSell}
                          onClick={() => onSell(deal)}
                          className={DEAL_SELL_BUTTON_CLASS}
                        >
                          {sellingDealId === id ? "…" : "Sell"}
                        </button>
                      </div>
                    )}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ShopDealsPage() {
  const { token } = useAuth();
  const { faqsHeading, faqsDescription, displayName, businessPhone, business } = useShopOwnerPortal();
  const { customers } = useShopCustomers();
  const [activeId, setActiveId] = useState<DealSectionId>("parts");
  const [view, setView] = useState<DealView>("list");
  const [detailDeal, setDetailDeal] = useState<ShopDeal | null>(null);
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"service" | "parts">("parts");
  const [editingDeal, setEditingDeal] = useState<ShopDeal | null>(null);
  const [selectedDealIds, setSelectedDealIds] = useState<Set<string>>(() => new Set());
  const [soldDraftIds, setSoldDraftIds] = useState<Record<string, string>>({});
  const [sellingDealId, setSellingDealId] = useState<string | null>(null);
  const [salesRevision, setSalesRevision] = useState(0);
  const [bulkBusy, setBulkBusy] = useState(false);
  const { deals: rawDeals, loading, error, refresh } = useShopDeals(toFilter(activeId));

  const dealsWithSales = useMemo(
    () => applyDealSales(rawDeals),
    [rawDeals, salesRevision],
  );

  const deals = useMemo(() => {
    if (activeId === "completed") return dealsWithSales.filter(isDealSold);
    const activeDeals = dealsWithSales.filter((deal) => !isDealSold(deal));
    if (activeId === "salvage") return activeDeals.filter(isSalvageDeal);
    return activeDeals;
  }, [activeId, dealsWithSales]);

  const selectedDeals = useMemo(
    () => dealsMatchingSelection(selectedDealIds, deals),
    [selectedDealIds, deals],
  );

  const detailDeals = useMemo(() => {
    if (!detailDeal) return [];
    const id = dealId(detailDeal);
    const fromList = dealsWithSales.find((deal) => dealId(deal) === id);
    return [fromList ?? detailDeal];
  }, [detailDeal, dealsWithSales]);

  const detailBoardSection = useMemo(() => {
    if (!detailDeal) return "parts" as DealBoardSectionId;
    return boardSectionForDeal(detailDeal, activeId);
  }, [detailDeal, activeId]);

  const hasBulkSelection = selectedDeals.length > 0;
  const canBulkDelete = hasBulkSelection && !bulkBusy;
  const canBulkDeactivate =
    activeId !== "completed" &&
    hasBulkSelection &&
    !bulkBusy &&
    selectedDeals.some((deal) => deal.dealEnabled !== false);
  const canPrint = hasBulkSelection;
  const canAddNew = activeId !== "completed";
  const canEditSelected =
    activeId !== "completed" && !bulkBusy && selectedDeals.length === 1;

  useEffect(() => {
    setFormOpen(false);
    setEditingDeal(null);
    setSelectedDealIds(new Set());
    setSoldDraftIds({});
    setView("list");
    setDetailDeal(null);
  }, [activeId]);

  const closeForm = () => {
    setFormOpen(false);
    setEditingDeal(null);
  };

  const showList = () => {
    setView("list");
    setDetailDeal(null);
    setFormOpen(false);
    setEditingDeal(null);
  };

  const openCreate = () => {
    if (activeId === "completed") return;
    setEditingDeal(null);
    setFormMode(activeId === "parts" || activeId === "salvage" ? "parts" : "service");
    setFormOpen(true);
  };

  const openEdit = (deal: ShopDeal) => {
    setEditingDeal(deal);
    setFormMode(dealMode(deal));
    setFormOpen(true);
  };

  const openEditSelected = () => {
    if (selectedDeals.length !== 1) return;
    openEdit(selectedDeals[0]);
  };

  const openDealDetail = (deal: ShopDeal) => {
    setDetailDeal(deal);
    setFormOpen(false);
    setEditingDeal(null);
    setView("detail");
  };

  const toggleDealSelection = (id: string) => {
    setSelectedDealIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleDealPageSelection = (ids: string[], checked: boolean) => {
    setSelectedDealIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const businessName = business?.businessName?.trim() || displayName || "Your Business";
  const website = (business as { businessWebsite?: string } | undefined)?.businessWebsite?.trim();

  const handleSoldDraftChange = (id: string, customerId: string) => {
    setSoldDraftIds((prev) => {
      const next = { ...prev };
      if (!customerId) delete next[id];
      else next[id] = customerId;
      return next;
    });
  };

  const handleSellDeal = async (deal: ShopDeal) => {
    if (!token) return;
    const id = dealId(deal);
    const customerId = soldDraftIds[id]?.trim();
    if (!id || !customerId) {
      toast.info("Select a customer before selling.");
      return;
    }
    const customer = customers.find((row) => customerRecordId(row) === customerId);
    if (!customer) {
      toast.error("Selected customer was not found.");
      return;
    }
    const customerName = customerDisplayName(customer);
    if (!window.confirm(`Mark this deal as sold to ${customerName}?`)) return;

    setSellingDealId(id);
    try {
      const soldAt = new Date().toISOString();
      await updateAutoshopDeal(
        token,
        id,
        dealToFormFields(deal, {
          dealEnabled: "false",
          soldToCustomerId: customerId,
          soldToCustomerName: customerName,
        }),
      );
      writeDealSale(id, { customerId, customerName, soldAt });
      setSalesRevision((n) => n + 1);
      setSoldDraftIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await refresh();
      toast.success(`Sold to ${customerName}.`);
    } catch {
      writeDealSale(id, {
        customerId,
        customerName,
        soldAt: new Date().toISOString(),
      });
      setSalesRevision((n) => n + 1);
      setSoldDraftIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await refresh();
      toast.success(`Sold to ${customerName}.`);
    } finally {
      setSellingDealId(null);
    }
  };

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
        const res = await deleteAutoshopDeal(token, id);
        if (!res.ok) failed += 1;
        else removeDealSale(id);
      }
      setSalesRevision((n) => n + 1);
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
        const res = await updateAutoshopDeal(token, id, dealToFormFields(deal, { dealEnabled: "false" }));
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
    const showSoldTo = activeId !== "service";
    const headers = [
      "Opening Date",
      "Closing Date",
      activeId === "service" ? "Subservice" : "Part Name",
      ...(showVehicleColumns ? ["Vehicle", "Year"] : []),
      activeId === "service" ? "Discount (%)" : "Discounted Price",
      "Status",
      ...(showSoldTo ? ["Sold To"] : []),
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
      base.push(shopDealDiscountLabel(deal), dealStatusLabel(deal));
      if (showSoldTo) base.push(dealSoldToLabel(deal));
      return base;
    });
    printAdminTable({ title: "Deals On Board", headers, rows });
  };

  const formSection: DealBoardSectionId =
    activeId === "completed" ? detailBoardSection : activeId === "salvage" ? "salvage" : activeId === "service" ? "service" : "parts";

  return (
    <ShopPageShell
      pageHeading={activeId === "completed" ? "Completed Deals" : "Deals On Board"}
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
            section={formSection}
            deal={editingDeal}
            onCancel={closeForm}
            onSaved={() => {
              closeForm();
              void refresh();
            }}
          />
        </ShopReveal>

        <ShopReveal show={view === "detail" && detailDeal != null && !formOpen}>
          {detailDeal ? (
            <div className="space-y-2">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={showList}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                  aria-label="Back to deals list"
                >
                  {"<<"}
                </button>
              </div>
              {loading ? (
                <div className="shop-hero-surface rounded border border-gray-300 bg-white p-5 shadow-sm">
                  <ShopDealsBoardSkeleton />
                </div>
              ) : (
                <ShopDealsBoard
                  deals={detailDeals}
                  section={detailBoardSection}
                  selectedIds={selectedDealIds}
                  businessName={businessName}
                  businessPhone={businessPhone}
                  website={website}
                  onToggleRow={toggleDealSelection}
                  onEdit={openEdit}
                />
              )}
            </div>
          ) : null}
        </ShopReveal>

        {view === "list" && !formOpen ? (
          <div className="space-y-0">
            <div className="shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white shadow-sm">
              <DealsToolbar
                showDelete={activeId !== "completed"}
                showDeactivate={activeId !== "completed"}
                hasSelection={hasBulkSelection}
                canDelete={canBulkDelete}
                canDeactivate={canBulkDeactivate}
                canEdit={canEditSelected}
                canAddNew={canAddNew}
                bulkBusy={bulkBusy}
                onDelete={() => void handleBulkDelete()}
                onDeactivate={() => void handleBulkDeactivate()}
                onEdit={openEditSelected}
                onPrint={handlePrint}
                onAddNew={openCreate}
              />
              {loading ? (
                <div className="p-3">
                  <ShopListSkeleton variant="profile-table" className="w-full" />
                </div>
              ) : error ? (
                <div className="p-4">
                  <ShopErrorPanel message={error} onRetry={() => void refresh()} />
                </div>
              ) : (
                <DealsListTable
                  deals={deals}
                  section={activeId}
                  customers={customers}
                  selectedIds={selectedDealIds}
                  soldDraftIds={soldDraftIds}
                  sellingDealId={sellingDealId}
                  onToggleRow={toggleDealSelection}
                  onTogglePage={toggleDealPageSelection}
                  onView={openDealDetail}
                  onSoldDraftChange={handleSoldDraftChange}
                  onSell={(deal) => void handleSellDeal(deal)}
                />
              )}
            </div>
          </div>
        ) : null}
      </div>
    </ShopPageShell>
  );
}
