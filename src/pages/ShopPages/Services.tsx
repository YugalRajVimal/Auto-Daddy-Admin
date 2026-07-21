import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  ADMIN_PANEL_THEAD_ROW_CLASS,
  adminPanelRowClass,
  adminPanelTableClasses,
  type AdminPanelTableClasses,
} from "../../components/admin/adminPanelTableStyles";
import ShopServiceSubDialog from "../../components/shop/forms/ShopServiceSubDialog";
import { shopAddNewButtonClass } from "../../components/shop/forms/ShopFormPage";
import { ShopReveal } from "../../components/shop/ShopAnimated";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopListSkeleton } from "../../components/shop/ShopListSkeletons";
import { ShopErrorPanel, ShopListFooter } from "../../components/shop/ShopPanels";
import { useAuth } from "../../auth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopServices } from "../../hooks/useShopServices";
import { deleteSubService } from "../../lib/autoshopownerApi";
import { apiMessage } from "../../lib/shopOwnerMutations";
import type { ShopServiceCategory } from "../../types/shopOwner";

const PAGE_SIZE = 10;

const SHOP_TABLE_BASE = adminPanelTableClasses(true);
const SHOP_TABLE: AdminPanelTableClasses = {
  ...SHOP_TABLE_BASE,
  th: SHOP_TABLE_BASE.th.replace("px-2", "px-4"),
  thCheckbox: SHOP_TABLE_BASE.thCheckbox.replace("px-2", "px-4"),
  td: SHOP_TABLE_BASE.td.replace("px-2", "px-4"),
  tdCheckbox: SHOP_TABLE_BASE.tdCheckbox.replace("px-2", "px-4"),
};

const shopHoursBulkButtonClass =
  "rounded border border-ad-purple bg-white px-3 py-1 text-xs font-bold text-ad-purple hover:bg-[#f5cce8] disabled:cursor-not-allowed disabled:opacity-60";

const shopFilterSelectClass =
  "shop-compact-input h-[26px] w-[9rem] shrink-0 box-border border border-gray-400 bg-white px-2 py-0 text-sm leading-tight text-gray-800 focus:border-blue-500 focus:outline-none";

type SubService = ShopServiceCategory["subServices"][number];

function formatUnitCost(price: number): string {
  return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
}

function getSubQty(sub: SubService): number {
  return sub.qty != null && sub.qty > 0 ? sub.qty : 1;
}

function getSubAmount(sub: SubService): number {
  return sub.price * getSubQty(sub) + (sub.labourCost ?? 0);
}

function formatQuantityType(value: SubService["quantityType"]): string {
  return value === "days" ? "Days" : "Unit";
}

function formatAmount(amount: number): string {
  return amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
}

function getSubRowId(sub: SubService, index: number): string {
  return sub.id ?? `${sub.name}-${index}`;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function AddNewButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={shopAddNewButtonClass}>
      + Add New
    </button>
  );
}

function SubServiceTable({
  rows,
  allRowIds,
  checkedIds,
  onToggleChecked,
  onToggleAllChecked,
  onEdit,
}: {
  rows: { sub: SubService; originalIndex: number }[];
  allRowIds: string[];
  checkedIds: Set<string>;
  onToggleChecked: (id: string) => void;
  onToggleAllChecked: () => void;
  onEdit: (originalIndex: number) => void;
}) {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const allRowsChecked = allRowIds.length > 0 && allRowIds.every((id) => checkedIds.has(id));
  const someRowsChecked = checkedIds.size > 0 && !allRowsChecked;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someRowsChecked;
    }
  }, [someRowsChecked]);

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className="shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className={SHOP_TABLE.table}>
          <thead>
            <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
              <th className={SHOP_TABLE.thCheckbox}>
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allRowsChecked}
                  onChange={onToggleAllChecked}
                  aria-label="Select all sub-services"
                  className="h-3.5 w-3.5 accent-ad-purple"
                />
              </th>
              <th className={SHOP_TABLE.th}>Make</th>
              <th className={SHOP_TABLE.th}>Model</th>
              <th className={SHOP_TABLE.th}>Category</th>
              <th className={SHOP_TABLE.th}>Description</th>
              <th className={SHOP_TABLE.th}>Unit Cost</th>
              <th className={SHOP_TABLE.th}>Qty</th>
              <th className={SHOP_TABLE.th}>Qty Type</th>
              <th className={SHOP_TABLE.th}>Labor Cost</th>
              <th className={SHOP_TABLE.th}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ sub, originalIndex }, index) => {
              const rowId = getSubRowId(sub, originalIndex);
              const qty = getSubQty(sub);
              const amount = getSubAmount(sub);
              return (
                <tr key={rowId} className={adminPanelRowClass(index)}>
                  <td className={SHOP_TABLE.tdCheckbox}>
                    <input
                      type="checkbox"
                      checked={checkedIds.has(rowId)}
                      onChange={() => onToggleChecked(rowId)}
                      aria-label={`Select ${sub.name}`}
                      className="h-3.5 w-3.5 accent-ad-purple"
                    />
                  </td>
                  <td className={SHOP_TABLE.td}>{sub.make?.trim() || "—"}</td>
                  <td className={SHOP_TABLE.td}>{sub.model?.trim() || "—"}</td>
                  <td className={SHOP_TABLE.td}>
                    <button
                      type="button"
                      title={`Edit ${sub.name}`}
                      aria-label={`Edit ${sub.name}`}
                      onClick={() => onEdit(originalIndex)}
                      className="font-semibold text-blue-700 underline hover:text-blue-800"
                    >
                      {sub.name}
                    </button>
                  </td>
                  <td className={SHOP_TABLE.td}>{sub.desc?.trim() || "—"}</td>
                  <td className={`${SHOP_TABLE.td} font-semibold text-gray-800`}>
                    {formatUnitCost(sub.price)}
                  </td>
                  <td className={SHOP_TABLE.td}>{qty}</td>
                  <td className={SHOP_TABLE.td}>{formatQuantityType(sub.quantityType)}</td>
                  <td className={`${SHOP_TABLE.td} font-semibold text-gray-800`}>
                    {formatUnitCost(sub.labourCost ?? 0)}
                  </td>
                  <td className={`${SHOP_TABLE.td} font-semibold text-blue-700`}>
                    {formatAmount(amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default function ShopServicesPage() {
  const { token } = useAuth();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [makeFilter, setMakeFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const {
    categories: apiCategories,
    allCategories,
    loading,
    error,
    refresh,
  } = useShopServices({
    make: makeFilter || undefined,
    model: modelFilter || undefined,
  });
  const [categories, setCategories] = useState<ShopServiceCategory[]>([]);

  useEffect(() => {
    if (loading) return;
    setCategories(apiCategories);
  }, [apiCategories, loading]);

  const handleRefresh = () => {
    void refresh();
  };

  const activeCategory: ShopServiceCategory | null =
    categories.find((c) => c.id === activeCategoryId) ?? categories[0] ?? null;

  const unfilteredCategory: ShopServiceCategory | null =
    allCategories.find((c) => c.id === (activeCategory?.id ?? activeCategoryId)) ??
    allCategories[0] ??
    null;

  const optionSubs = unfilteredCategory?.subServices ?? [];
  const allSubs = activeCategory?.subServices ?? [];

  const makeOptions = useMemo(
    () => uniqueSorted(optionSubs.map((sub) => sub.make?.trim() ?? "").filter(Boolean)),
    [optionSubs],
  );

  const modelOptions = useMemo(() => {
    const scoped = makeFilter
      ? optionSubs.filter((sub) => (sub.make?.trim() ?? "") === makeFilter)
      : optionSubs;
    return uniqueSorted(scoped.map((sub) => sub.model?.trim() ?? "").filter(Boolean));
  }, [optionSubs, makeFilter]);

  const tableRows = useMemo(() => {
    const pool = unfilteredCategory?.subServices ?? [];
    return allSubs.map((sub, filteredIndex) => {
      let originalIndex = filteredIndex;
      if (pool.length > 0) {
        if (sub.id) {
          const byId = pool.findIndex((candidate) => candidate.id === sub.id);
          if (byId >= 0) originalIndex = byId;
        } else {
          const byFields = pool.findIndex(
            (candidate) =>
              candidate.name === sub.name &&
              (candidate.make?.trim() ?? "") === (sub.make?.trim() ?? "") &&
              (candidate.model?.trim() ?? "") === (sub.model?.trim() ?? "") &&
              candidate.price === sub.price,
          );
          if (byFields >= 0) originalIndex = byFields;
        }
      }
      return { sub, originalIndex };
    });
  }, [allSubs, unfilteredCategory]);

  const allRowIds = useMemo(
    () => tableRows.map(({ sub, originalIndex }) => getSubRowId(sub, originalIndex)),
    [tableRows],
  );

  const totalPages = Math.max(1, Math.ceil(tableRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = useMemo(
    () => tableRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [tableRows, safePage],
  );

  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.id === activeCategoryId)) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  useEffect(() => {
    setPage(1);
    setFormOpen(false);
    setEditIndex(null);
    setSelectedRows(new Set());
    setMakeFilter("");
    setModelFilter("");
  }, [activeCategoryId]);

  useEffect(() => {
    setPage(1);
    setSelectedRows(new Set());
  }, [makeFilter, modelFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (modelFilter && !modelOptions.includes(modelFilter)) {
      setModelFilter("");
    }
  }, [modelFilter, modelOptions]);

  const closeForm = () => {
    setFormOpen(false);
    setEditIndex(null);
  };

  const openAddForm = () => {
    setEditIndex(null);
    setFormOpen(true);
  };

  const openEditForm = (index: number) => {
    setEditIndex(index);
    setFormOpen(true);
    const tableIndex = tableRows.findIndex((row) => row.originalIndex === index);
    if (tableIndex >= 0) {
      setPage(Math.floor(tableIndex / PAGE_SIZE) + 1);
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllRows = () => {
    setSelectedRows((prev) => {
      const allChecked = allRowIds.length > 0 && allRowIds.every((id) => prev.has(id));
      return allChecked ? new Set() : new Set(allRowIds);
    });
  };

  const handleBulkDelete = async () => {
    const categoryForDelete = unfilteredCategory ?? activeCategory;
    if (!categoryForDelete || selectedRows.size === 0) return;
    if (!window.confirm(`Delete ${selectedRows.size} selected sub-service(s)?`)) return;

    if (!token) return;
    setBulkDeleting(true);
    try {
      const indicesToDelete = tableRows
        .filter(({ sub, originalIndex }) => selectedRows.has(getSubRowId(sub, originalIndex)))
        .map(({ originalIndex }) => originalIndex)
        .sort((a, b) => b - a);

      for (const subServiceIndex of indicesToDelete) {
        const res = await deleteSubService(token, {
          serviceId: categoryForDelete.id,
          subServiceIndex,
        });
        if (!res.ok) {
          toast.error(apiMessage(res.data) || "Could not delete.");
          handleRefresh();
          return;
        }
      }
      toast.success("Deleted.");
      if (
        editIndex != null &&
        selectedRows.has(getSubRowId(categoryForDelete.subServices[editIndex], editIndex))
      ) {
        closeForm();
      }
      setSelectedRows(new Set());
      handleRefresh();
    } finally {
      setBulkDeleting(false);
    }
  };

  const hasBulkSelection = selectedRows.size > 0;
  const showToolbar = activeCategory != null && !formOpen;
  const formCategory = unfilteredCategory ?? activeCategory;

  return (
    <ShopPageShell
      title="Services"
      pageHeading={activeCategory?.name ?? "My Services"}
      metaTitle="Services | AutoDaddy"
      metaDescription="Auto shop services"
      sidebarVariant="nav"
      heroBackgroundImage={false}
      contentTopOffset
      heroCardFlush
      sidebarItems={categories.map((cat) => ({
        id: cat.id,
        label: cat.name ?? "Category",
        variant: "primary" as const,
      }))}
      activeSidebarId={activeCategoryId}
      onSidebarSelect={setActiveCategoryId}
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <div className="space-y-1">
        {loading ? (
          <ShopListSkeleton variant="profile-table" className="w-full" />
        ) : error ? (
          <ShopErrorPanel message={error} onRetry={() => void refresh()} />
        ) : categories.length === 0 ? (
          <>
            <SubServiceTable
              rows={[]}
              allRowIds={[]}
              checkedIds={selectedRows}
              onToggleChecked={toggleRow}
              onToggleAllChecked={toggleAllRows}
              onEdit={openEditForm}
            />
            <ShopListFooter>
              <p>0 Entries</p>
            </ShopListFooter>
          </>
        ) : activeCategory ? (
          <>
            {showToolbar ? (
              <div className="flex min-h-[2rem] items-center gap-2 overflow-x-auto whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => void handleBulkDelete()}
                  disabled={!hasBulkSelection || bulkDeleting}
                  className={`${shopHoursBulkButtonClass} shrink-0${hasBulkSelection ? "" : " invisible"}`}
                >
                  Delete
                </button>
                <select
                  className={shopFilterSelectClass}
                  value={makeFilter}
                  onChange={(e) => {
                    setMakeFilter(e.target.value);
                    setModelFilter("");
                  }}
                  aria-label="Filter by make"
                >
                  <option value="">All makes</option>
                  {makeOptions.map((make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  ))}
                </select>
                <select
                  className={shopFilterSelectClass}
                  value={modelFilter}
                  onChange={(e) => setModelFilter(e.target.value)}
                  aria-label="Filter by model"
                >
                  <option value="">All models</option>
                  {modelOptions.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <div className="ml-auto shrink-0">
                  <AddNewButton onClick={openAddForm} />
                </div>
              </div>
            ) : null}

            <ShopReveal show={formOpen} clipOverflow={false}>
              {formCategory ? (
                <ShopServiceSubDialog
                  category={formCategory}
                  editIndex={editIndex}
                  suggestionCategories={allCategories.length > 0 ? allCategories : categories}
                  onCancel={closeForm}
                  onSaved={() => handleRefresh()}
                />
              ) : null}
            </ShopReveal>

            {!formOpen ? (
              <>
                <SubServiceTable
                  rows={paginatedRows}
                  allRowIds={allRowIds}
                  checkedIds={selectedRows}
                  onToggleChecked={toggleRow}
                  onToggleAllChecked={toggleAllRows}
                  onEdit={openEditForm}
                />

                <ShopListFooter>
                  <p>{tableRows.length} Entries</p>
                  {totalPages > 1 ? (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
                        const isActive = pageNumber === safePage;
                        return (
                          <button
                            key={pageNumber}
                            type="button"
                            onClick={() => setPage(pageNumber)}
                            className={`flex h-8 min-w-8 items-center justify-center rounded-sm px-2 text-sm font-bold ${
                              isActive
                                ? "bg-gray-500 text-white"
                                : "border border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                            aria-current={isActive ? "page" : undefined}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </ShopListFooter>
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </ShopPageShell>
  );
}
