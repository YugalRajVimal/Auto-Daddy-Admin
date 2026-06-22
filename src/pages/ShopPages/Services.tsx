import { useState } from "react";
import ShopServiceSubDialog from "../../components/shop/forms/ShopServiceSubDialog";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopEmptyPanel,
  ShopErrorPanel,
  ShopListPanel,
  ShopLoadingPanel,
  ShopRefreshButton,
} from "../../components/shop/ShopPanels";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopServices } from "../../hooks/useShopServices";
import type { ShopServiceCategory } from "../../types/shopOwner";

const SERVICE_SECTIONS = [
  { id: "categories", label: "My Service Categories", variant: "primary" as const },
  { id: "add-sub", label: "+ Add Sub-Services", variant: "secondary" as const },
];

export default function ShopServicesPage() {
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [activeId, setActiveId] = useState("categories");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const { categories, loading, error, refresh } = useShopServices();

  const activeCategory: ShopServiceCategory | null =
    categories.find((c) => c.id === activeCategoryId) ?? categories[0] ?? null;

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
      metaTitle="Services | AutoDaddy"
      metaDescription="Auto shop services"
      sidebarItems={SERVICE_SECTIONS}
      activeSidebarId={activeId}
      onSidebarSelect={setActiveId}
      headerAction={<ShopRefreshButton onClick={() => void refresh()} />}
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
      ) : categories.length === 0 ? (
        <ShopEmptyPanel message="No service categories yet. Select services from Profile → Operational Services." />
      ) : (
        <ShopListPanel>
          {activeId === "add-sub" && categories.length > 1 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`rounded-md px-3 py-1 text-xs font-semibold ${
                    activeCategory?.id === cat.id
                      ? "bg-ad-purple text-white"
                      : "border border-ad-purple/40 bg-white text-ad-purple"
                  }`}
                  onClick={() => setActiveCategoryId(cat.id)}
                >
                  {cat.name ?? "Category"}
                </button>
              ))}
            </div>
          ) : null}

          {(activeId === "add-sub" && activeCategory ? [activeCategory] : categories).map((cat) => (
            <div key={cat.id} className="overflow-hidden rounded-md shadow-sm">
              <div className="flex items-center justify-between bg-[#006600] px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-white">{cat.name ?? "Category"}</p>
                  {cat.desc ? <p className="text-xs text-white/80">{cat.desc}</p> : null}
                </div>
                <button
                  type="button"
                  className="rounded bg-white/20 px-2 py-1 text-xs font-bold text-white hover:bg-white/30"
                  onClick={() => openAdd(cat)}
                >
                  + Sub-service
                </button>
              </div>
              <div className="flex flex-col gap-2 bg-white p-3">
                {cat.subServices.length === 0 ? (
                  <p className="text-sm text-gray-500">No sub-services</p>
                ) : (
                  cat.subServices.map((sub, subIdx) => (
                    <div
                      key={sub.id ?? sub.name}
                      className="flex items-center justify-between rounded-md border border-ad-purple/30 bg-[#FDE4D0] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-ad-purple">{sub.name}</p>
                        {sub.desc ? <p className="text-xs text-gray-600">{sub.desc}</p> : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold text-[#006600]">${sub.price.toFixed(2)}</p>
                        <button
                          type="button"
                          className="text-xs font-semibold text-ad-purple hover:underline"
                          onClick={() => openEdit(cat, subIdx)}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </ShopListPanel>
      )}

      <ShopServiceSubDialog
        open={dialogOpen}
        category={activeCategory}
        editIndex={editIndex}
        hasExistingServices={categories.length > 0}
        onClose={() => setDialogOpen(false)}
        onSaved={() => void refresh()}
      />
    </ShopPageShell>
  );
}
