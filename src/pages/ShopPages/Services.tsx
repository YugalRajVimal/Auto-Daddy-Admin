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

type SubService = ShopServiceCategory["subServices"][number];

function formatUnitCost(price: number): string {
  return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
}

function getSubQty(sub: SubService): number {
  return sub.qty != null && sub.qty > 0 ? sub.qty : 1;
}

function getSubAmount(sub: SubService): number {
  return sub.price * getSubQty(sub);
}

function formatAmount(amount: number): string {
  return amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
}

function getSubRowId(sub: SubService, index: number): string {
  return sub.id ?? `${sub.name}-${index}`;
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
  const { categories: apiCategories, loading, error, refresh } = useShopServices();
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

  const allSubs = activeCategory?.subServices ?? [];

  const allRowIds = useMemo(
    () => allSubs.map((sub, index) => getSubRowId(sub, index)),
    [allSubs],
  );

  const totalPages = Math.max(1, Math.ceil(allSubs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedSubs = useMemo(
    () => allSubs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [allSubs, safePage],
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
  }, [activeCategoryId]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
    setPage(Math.floor(index / PAGE_SIZE) + 1);
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
    if (!activeCategory || selectedRows.size === 0) return;
    if (!window.confirm(`Delete ${selectedRows.size} selected sub-service(s)?`)) return;

    if (!token) return;
    setBulkDeleting(true);
    try {
      const indicesToDelete = activeCategory.subServices
        .map((sub, index) => ({ index, rowId: getSubRowId(sub, index) }))
        .filter(({ rowId }) => selectedRows.has(rowId))
        .map(({ index }) => index)
        .sort((a, b) => b - a);

      for (const subServiceIndex of indicesToDelete) {
        const res = await deleteSubService(token, {
          serviceId: activeCategory.id,
          subServiceIndex,
        });
        if (!res.ok) {
          toast.error(apiMessage(res.data) || "Could not delete.");
          handleRefresh();
          return;
        }
      }
      toast.success("Deleted.");
      if (editIndex != null && selectedRows.has(getSubRowId(activeCategory.subServices[editIndex], editIndex))) {
        closeForm();
      }
      setSelectedRows(new Set());
      handleRefresh();
    } finally {
      setBulkDeleting(false);
    }
  };

  const paginatedRows = useMemo(
    () =>
      paginatedSubs.map((sub) => ({
        sub,
        originalIndex: allSubs.findIndex(
          (candidate) => candidate.id === sub.id && candidate.name === sub.name,
        ),
      })),
    [paginatedSubs, allSubs],
  );

  const hasBulkSelection = selectedRows.size > 0;
  const showToolbar = activeCategory != null && !formOpen;

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
          <p className="text-center text-sm text-gray-600">
            No service categories yet. Select services from Profile → Operational Services.
          </p>
        ) : activeCategory ? (
          <>
            {showToolbar ? (
              <div className="flex min-h-[2rem] items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleBulkDelete()}
                    disabled={!hasBulkSelection || bulkDeleting}
                    className={`${shopHoursBulkButtonClass}${hasBulkSelection ? "" : " invisible"}`}
                  >
                    Delete
                  </button>
                </div>
                <AddNewButton onClick={openAddForm} />
              </div>
            ) : null}

            <ShopReveal show={formOpen} clipOverflow={false}>
              <ShopServiceSubDialog
                category={activeCategory}
                editIndex={editIndex}
                suggestionCategories={categories}
                onCancel={closeForm}
                onSaved={() => handleRefresh()}
              />
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
                  <p>{allSubs.length} Entries</p>
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
