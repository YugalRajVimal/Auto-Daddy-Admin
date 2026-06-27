import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiPaperclip, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import ShopServiceSubDialog from "../../components/shop/forms/ShopServiceSubDialog";
import { ShopViewTransition } from "../../components/shop/ShopAnimated";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopEmptyPanel,
  ShopErrorPanel,
  ShopListFooter,
  ShopLoadingPanel,
} from "../../components/shop/ShopPanels";
import { shopHeroCardBodyClass, shopHeroOpaqueSurfaceClass } from "../../components/shop/shopLayoutStyles";
import { useAuth } from "../../auth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopServices } from "../../hooks/useShopServices";
import { getDummyMyServices } from "../../lib/dummyServices";
import { apiMessage, removeMyServiceSubServices } from "../../lib/shopOwnerMutations";
import type { ShopServiceCategory } from "../../types/shopOwner";

const PAGE_SIZE = 5;

const ROW_BG = ["bg-white", "bg-gray-50"] as const;

function formatPrice(price: number): string {
  return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
}

function SubServiceTable({
  subs,
  page,
  totalPages,
  safePage,
  editingIndex,
  deletingIndex,
  onEdit,
  onDelete,
  onPageChange,
}: {
  subs: ShopServiceCategory["subServices"];
  page: number;
  totalPages: number;
  safePage: number;
  editingIndex: number | null;
  deletingIndex: number | null;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onPageChange: (page: number) => void;
}) {
  const paginatedSubs = useMemo(
    () => subs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [subs, safePage],
  );

  return (
    <>
      <div
        className={`${shopHeroOpaqueSurfaceClass} min-h-0 flex-1 overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm`}
      >
        <div className="no-scrollbar max-h-full overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-100">
                <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-800">Sub - Category</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-800">Discription</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-800">Price</th>
                <th className="w-[108px] px-2 py-2.5" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {paginatedSubs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                    No sub-services yet.
                  </td>
                </tr>
              ) : (
                paginatedSubs.map((sub, idx) => {
                  const subIdx = (safePage - 1) * PAGE_SIZE + idx;
                  const isEditing = editingIndex === subIdx;
                  const rowBg = isEditing ? "bg-[#d4fcd4] ring-2 ring-inset ring-[#008000]" : ROW_BG[subIdx % ROW_BG.length];
                  const isDeleting = deletingIndex === subIdx;

                  return (
                    <tr
                      key={sub.id ?? `${sub.name}-${subIdx}`}
                      className={`border-b border-gray-200 ${rowBg}`}
                      aria-selected={isEditing}
                    >
                      <td className="px-4 py-2.5 align-top font-semibold text-gray-900">{sub.name}</td>
                      <td className="px-4 py-2.5 align-top text-gray-700">{sub.desc || "—"}</td>
                      <td className="px-4 py-2.5 align-top font-semibold text-gray-900">$ {formatPrice(sub.price)}</td>
                      <td className="px-2 py-2 align-top">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded text-gray-600 hover:bg-white/70"
                            title="Attachment"
                            aria-label={`View attachment for ${sub.name}`}
                          >
                            <FiPaperclip className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded text-ad-purple hover:bg-white/70"
                            title="Edit"
                            aria-label={`Edit ${sub.name}`}
                            onClick={() => onEdit(subIdx)}
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded text-red-600 hover:bg-white/70 disabled:opacity-50"
                            title="Delete"
                            aria-label={`Delete ${sub.name}`}
                            disabled={isDeleting}
                            onClick={() => onDelete(subIdx)}
                          >
                            <FiX className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ShopListFooter>
        <p>{subs.length} Entries</p>
        {totalPages > 1 ? (
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
              const isActive = pageNumber === page;
              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => onPageChange(pageNumber)}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-sm px-2 text-sm font-bold ${
                    isActive
                      ? "bg-[#008000] text-white"
                      : "border border-[#008000] bg-white text-[#008000] hover:bg-[#d4fcd4]"
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

  const subs = activeCategory?.subServices ?? [];
  const totalPages = Math.max(1, Math.ceil(subs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.id === activeCategoryId)) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  useEffect(() => {
    setPage(1);
    setFormOpen(false);
    setEditIndex(null);
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

  return (
    <ShopPageShell
      pageHeading={activeCategory?.name ?? "My Services"}
      metaTitle="Services | AutoDaddy"
      metaDescription="Auto shop services"
      headerAction={
        activeCategory && !formOpen ? (
          <button
            type="button"
            className="shrink-0 rounded-md bg-[#008000] px-4 py-2 text-sm font-bold text-white hover:bg-[#006600]"
            onClick={openAddForm}
          >
            + Add New
          </button>
        ) : undefined
      }
      sidebarLoading={loading}
      sidebarSkeletonCount={5}
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
      <ShopViewTransition
        viewKey={`${activeCategoryId ?? "none"}-${formOpen ? (editIndex ?? "add") : "list"}`}
        className={`${shopHeroCardBodyClass} gap-4`}
      >
        {loading ? (
          <ShopLoadingPanel variant="media-card" count={5} />
        ) : error && !usingDummy ? (
          <ShopErrorPanel message={error} onRetry={() => void refresh()} />
        ) : categories.length === 0 ? (
          <ShopEmptyPanel
            message="No service categories yet. Select services from Profile → Operational Services."
          />
        ) : activeCategory ? (
          <>
            {formOpen ? (
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
            ) : null}

            <SubServiceTable
              subs={subs}
              page={page}
              totalPages={totalPages}
              safePage={safePage}
              editingIndex={formOpen ? editIndex : null}
              deletingIndex={deletingIndex}
              onEdit={openEditForm}
              onDelete={(index) => void handleDelete(index)}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </ShopViewTransition>
    </ShopPageShell>
  );
}
