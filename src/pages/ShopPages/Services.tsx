import { useEffect, useMemo, useState } from "react";
import ShopServiceSubDialog from "../../components/shop/forms/ShopServiceSubDialog";
import ServiceImage from "../../components/shop/ServiceImage";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopEmptyPanel,
  ShopErrorPanel,
  ShopListPanel,
  ShopListFooter,
  ShopLoadingPanel,
  ShopPageContentShell,
} from "../../components/shop/ShopPanels";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopServices } from "../../hooks/useShopServices";
import { getDummyMyServices } from "../../lib/dummyServices";
import type { ShopServiceCategory } from "../../types/shopOwner";

const PAGE_SIZE = 5;

function SubServiceCard({
  sub,
  onEdit,
}: {
  sub: ShopServiceCategory["subServices"][number];
  onEdit: () => void;
}) {
  const price =
    sub.price % 1 === 0 ? sub.price.toFixed(0) : sub.price.toFixed(2);

  return (
    <article className="flex items-center gap-4 rounded-md border border-[#008000] bg-[#d4fcd4] p-3 sm:px-5 sm:py-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-gray-300 bg-white">
        <ServiceImage
          category={{ id: sub.id ?? sub.name, name: sub.name, subServices: [] }}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold text-[#008000]">{sub.name}</p>
        <p className="text-sm font-semibold text-blue-700">Description :</p>
        {sub.desc ? <p className="text-sm text-gray-700">{sub.desc}</p> : null}
        <button
          type="button"
          className="mt-1 text-xs font-semibold text-ad-purple hover:underline"
          onClick={onEdit}
        >
          Edit
        </button>
      </div>
      <p className="shrink-0 text-base font-bold text-[#008000]">$ {price}</p>
    </article>
  );
}

export default function ShopServicesPage() {
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
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

  const paginatedSubs = useMemo(
    () => subs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [subs, safePage],
  );

  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.id === activeCategoryId)) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  useEffect(() => {
    setPage(1);
  }, [activeCategoryId]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const openAdd = (cat: ShopServiceCategory) => {
    setActiveCategoryId(cat.id);
    setEditIndex(null);
    setDialogOpen(true);
  };

  const openEdit = (cat: ShopServiceCategory, index: number) => {
    setActiveCategoryId(cat.id);
    setEditIndex(index);
    setDialogOpen(true);
  };

  return (
    <ShopPageShell
      pageHeading={activeCategory?.name ?? "My Services"}
      metaTitle="Services | AutoDaddy"
      metaDescription="Auto shop services"
      headerAction={
        activeCategory ? (
          <button
            type="button"
            className="shrink-0 rounded-md bg-[#008000] px-4 py-2 text-sm font-bold text-white hover:bg-[#006600]"
            onClick={() => openAdd(activeCategory)}
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
      <ShopPageContentShell>
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
            {subs.length === 0 ? (
              <ShopEmptyPanel message="No sub-services yet." />
            ) : (
              <>
                <ShopListPanel>
                  {paginatedSubs.map((sub, idx) => {
                    const subIdx = (safePage - 1) * PAGE_SIZE + idx;
                    return (
                      <SubServiceCard
                        key={sub.id ?? sub.name}
                        sub={sub}
                        onEdit={() => openEdit(activeCategory, subIdx)}
                      />
                    );
                  })}
                </ShopListPanel>

                <ShopListFooter>
                  <p>{subs.length} Entries</p>
                  {totalPages > 1 ? (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
                        const isActive = pageNumber === safePage;
                        return (
                          <button
                            key={pageNumber}
                            type="button"
                            onClick={() => setPage(pageNumber)}
                            className={`flex h-8 min-w-8 items-center justify-center rounded-sm px-2 text-sm font-bold ${isActive
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
            )}
          </>
        ) : null}
      </ShopPageContentShell>

      <ShopServiceSubDialog
        open={dialogOpen}
        category={activeCategory}
        editIndex={editIndex}
        hasExistingServices={categories.length > 0 && !usingDummy}
        demoMode={usingDummy}
        onDemoSave={(categoryId, subServices) => {
          setCategories((prev) =>
            prev.map((category) =>
              category.id === categoryId ? { ...category, subServices } : category
            )
          );
        }}
        onClose={() => setDialogOpen(false)}
        onSaved={() => handleRefresh()}
      />
    </ShopPageShell>
  );
}
