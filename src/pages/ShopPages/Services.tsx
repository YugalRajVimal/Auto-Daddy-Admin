import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiPaperclip, FiX } from "react-icons/fi";
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
import { getDummyMyServices } from "../../lib/dummyServices";
import { apiMessage, removeMyServiceSubServices } from "../../lib/shopOwnerMutations";
import type { ShopServiceCategory } from "../../types/shopOwner";

const PAGE_SIZE = 10;
const SERVICES_SEARCH_INPUT_ID = "shop-services-sub-search";

const SHOP_TABLE_BASE = adminPanelTableClasses(true);
const SHOP_TABLE: AdminPanelTableClasses = {
  ...SHOP_TABLE_BASE,
  th: SHOP_TABLE_BASE.th.replace("px-2", "px-4"),
  thCheckbox: SHOP_TABLE_BASE.thCheckbox.replace("px-2", "px-4"),
  td: SHOP_TABLE_BASE.td.replace("px-2", "px-4"),
  tdCheckbox: SHOP_TABLE_BASE.tdCheckbox.replace("px-2", "px-4"),
};

type SubService = ShopServiceCategory["subServices"][number];

function formatPrice(price: number): string {
  return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
}

function AddNewButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={shopAddNewButtonClass}>
      + Add New
    </button>
  );
}

function ServicesSearchBar({
  value,
  onChange,
  inputId,
}: {
  value: string;
  onChange: (value: string) => void;
  inputId: string;
}) {
  return (
    <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-end gap-2 border-b border-gray-300 bg-[#d1d5db] px-2 py-1.5 sm:gap-3">
      <label htmlFor={inputId} className="text-sm font-semibold text-gray-700">
        Search
      </label>
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[26px] w-full max-w-xs border border-gray-400 bg-white px-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none sm:max-w-sm"
      />
    </div>
  );
}

function matchesSubServiceSearch(sub: SubService, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [sub.name, sub.desc, formatPrice(sub.price)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function SubServiceTable({
  rows,
  deletingIndex,
  onEdit,
  onDelete,
}: {
  rows: { sub: SubService; originalIndex: number }[];
  deletingIndex: number | null;
  onEdit: (originalIndex: number) => void;
  onDelete: (originalIndex: number) => void;
}) {
  const actionHeadClass = `${SHOP_TABLE.th} text-center`;

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
              <th className={SHOP_TABLE.th}>Sub - Category</th>
              <th className={SHOP_TABLE.th}>Description</th>
              <th className={SHOP_TABLE.th}>Price</th>
              <th className={actionHeadClass}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ sub, originalIndex }, index) => {
              const isDeleting = deletingIndex === originalIndex;
              return (
                <tr key={sub.id ?? `${sub.name}-${originalIndex}`} className={adminPanelRowClass(index)}>
                  <td className={`${SHOP_TABLE.td} font-semibold text-blue-700`}>{sub.name}</td>
                  <td className={SHOP_TABLE.td}>{sub.desc?.trim() || "—"}</td>
                  <td className={`${SHOP_TABLE.td} font-semibold text-gray-800`}>
                    $ {formatPrice(sub.price)}
                  </td>
                  <td className={`${SHOP_TABLE.td} text-center`}>
                    <div className="inline-flex items-center justify-center gap-0.5">
                      <button
                        type="button"
                        title={`View attachment for ${sub.name}`}
                        aria-label={`View attachment for ${sub.name}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded text-blue-600 hover:text-ad-purple"
                      >
                        <FiPaperclip size={13} aria-hidden />
                      </button>
                      <button
                        type="button"
                        title={`Edit ${sub.name}`}
                        aria-label={`Edit ${sub.name}`}
                        onClick={() => onEdit(originalIndex)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded text-blue-600 hover:text-ad-purple"
                      >
                        <FiEdit2 size={13} aria-hidden />
                      </button>
                      <button
                        type="button"
                        title={`Delete ${sub.name}`}
                        aria-label={`Delete ${sub.name}`}
                        disabled={isDeleting}
                        onClick={() => onDelete(originalIndex)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        <FiX size={14} aria-hidden />
                      </button>
                    </div>
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
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { categories: apiCategories, loading, error, refresh } = useShopServices();
  const [categories, setCategories] = useState<ShopServiceCategory[]>([]);
  const [usingDummy, setUsingDummy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (apiCategories.length > 0) {
      setUsingDummy(false);
      setCategories(apiCategories);
      return;
    }
    setUsingDummy(true);
    setCategories(getDummyMyServices());
  }, [apiCategories, loading]);

  const handleRefresh = () => {
    if (usingDummy) {
      setCategories(getDummyMyServices());
      return;
    }
    void refresh();
  };

  const activeCategory: ShopServiceCategory | null =
    categories.find((c) => c.id === activeCategoryId) ?? categories[0] ?? null;

  const allSubs = activeCategory?.subServices ?? [];

  const filteredSubs = useMemo(() => {
    const q = search.trim();
    if (!q) return allSubs;
    return allSubs.filter((sub) => matchesSubServiceSearch(sub, q));
  }, [allSubs, search]);

  const totalPages = Math.max(1, Math.ceil(filteredSubs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedSubs = useMemo(
    () => filteredSubs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredSubs, safePage],
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
    setSearch("");
  }, [activeCategoryId]);

  useEffect(() => {
    setPage(1);
  }, [search]);

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
    const filteredIndex = filteredSubs.findIndex(
      (sub) => sub === allSubs[index],
    );
    if (filteredIndex >= 0) {
      setPage(Math.floor(filteredIndex / PAGE_SIZE) + 1);
    }
  };

  const handleDelete = async (index: number) => {
    if (!activeCategory) return;
    const sub = activeCategory.subServices[index];
    if (!sub) return;
    if (!window.confirm(`Delete "${sub.name}"?`)) return;

    if (usingDummy) {
      setCategories((prev) =>
        prev.map((category) =>
          category.id === activeCategory.id
            ? { ...category, subServices: category.subServices.filter((_, i) => i !== index) }
            : category,
        ),
      );
      toast.success("Deleted.");
      if (editIndex === index) closeForm();
      return;
    }

    if (!token) return;
    setDeletingIndex(index);
    try {
      const res = await removeMyServiceSubServices(token, activeCategory.id, sub.name);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not delete.");
        return;
      }
      toast.success("Deleted.");
      if (editIndex === index) closeForm();
      handleRefresh();
    } finally {
      setDeletingIndex(null);
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

  const emptyMessage =
    allSubs.length === 0
      ? "No sub-services yet."
      : search.trim()
        ? "No sub-services match your search."
        : "No sub-services yet.";

  const showAddNewAction = activeCategory != null && !formOpen;

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
        ) : error && !usingDummy ? (
          <ShopErrorPanel message={error} onRetry={() => void refresh()} />
        ) : categories.length === 0 ? (
          <p className="text-center text-sm text-gray-600">
            No service categories yet. Select services from Profile → Operational Services.
          </p>
        ) : activeCategory ? (
          <>
            <ServicesSearchBar
              value={search}
              onChange={setSearch}
              inputId={SERVICES_SEARCH_INPUT_ID}
            />

            {showAddNewAction ? (
              <div className="flex min-h-[2rem] items-center justify-end gap-2">
                <AddNewButton onClick={openAddForm} />
              </div>
            ) : null}

            <ShopReveal show={formOpen}>
              <ShopServiceSubDialog
                category={activeCategory}
                editIndex={editIndex}
                hasExistingServices={categories.length > 0 && !usingDummy}
                demoMode={usingDummy}
                onDemoSave={(categoryId, subServices) => {
                  setCategories((prev) =>
                    prev.map((category) =>
                      category.id === categoryId ? { ...category, subServices } : category,
                    ),
                  );
                }}
                onCancel={closeForm}
                onSaved={() => handleRefresh()}
              />
            </ShopReveal>

            {filteredSubs.length === 0 && !formOpen ? (
              <p className="text-center text-sm text-gray-600">{emptyMessage}</p>
            ) : filteredSubs.length > 0 ? (
              <>
                <SubServiceTable
                  rows={paginatedRows}
                  deletingIndex={deletingIndex}
                  onEdit={openEditForm}
                  onDelete={(index) => void handleDelete(index)}
                />

                <ShopListFooter className="text-sm font-semibold text-gray-600">
                  <p>{filteredSubs.length} Entries</p>
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
