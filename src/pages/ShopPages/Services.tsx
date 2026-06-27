import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { FiEdit2, FiPaperclip, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { AdminDataTable, tableCell } from "../../components/admin/AdminDataTable";
import ShopServiceSubDialog from "../../components/shop/forms/ShopServiceSubDialog";
import { ShopReveal, ShopViewTransition } from "../../components/shop/ShopAnimated";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopEmptyPanel,
  ShopErrorPanel,
  ShopLoadingPanel,
} from "../../components/shop/ShopPanels";
import { shopHeroCardBodyClass } from "../../components/shop/shopLayoutStyles";
import { useAuth } from "../../auth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopServices } from "../../hooks/useShopServices";
import { getDummyMyServices } from "../../lib/dummyServices";
import { apiMessage, removeMyServiceSubServices } from "../../lib/shopOwnerMutations";
import type { ShopServiceCategory } from "../../types/shopOwner";

const PAGE_SIZE = 5;

type IndexedSubService = ShopServiceCategory["subServices"][number] & { _index: number };

function formatPrice(price: number): string {
  return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
}

function editingRowStyle(isEditing: boolean): CSSProperties | undefined {
  return isEditing ? { background: "#d4fcd4" } : undefined;
}

function SubServiceTable({
  subs,
  safePage,
  editingIndex,
  deletingIndex,
  onEdit,
  onDelete,
  onPageChange,
}: {
  subs: ShopServiceCategory["subServices"];
  safePage: number;
  editingIndex: number | null;
  deletingIndex: number | null;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onPageChange: (page: number) => void;
}) {
  const indexedSubs = useMemo<IndexedSubService[]>(
    () => subs.map((sub, index) => ({ ...sub, _index: index })),
    [subs],
  );

  const tableColumns = useMemo(
    () => [
      {
        key: "name",
        label: "Sub - Category",
        render: (sub: IndexedSubService) =>
          tableCell(
            <span className="font-semibold text-blue-700">{sub.name}</span>,
            editingRowStyle(editingIndex === sub._index),
            true,
          ),
        exportValue: (sub: IndexedSubService) => sub.name,
      },
      {
        key: "desc",
        label: "Discription",
        render: (sub: IndexedSubService) =>
          tableCell(sub.desc || "—", editingRowStyle(editingIndex === sub._index), true),
        exportValue: (sub: IndexedSubService) => sub.desc || "—",
      },
      {
        key: "price",
        label: "Price",
        render: (sub: IndexedSubService) =>
          tableCell(
            <span style={{ fontWeight: 600 }}>$ {formatPrice(sub.price)}</span>,
            editingRowStyle(editingIndex === sub._index),
            true,
          ),
        exportValue: (sub: IndexedSubService) => formatPrice(sub.price),
      },
    ],
    [editingIndex],
  );

  return (
    <AdminDataTable
      items={indexedSubs}
      columns={tableColumns}
      getRowId={(sub) => sub.id ?? `${sub.name}-${sub._index}`}
      emptyMessage="No sub-services yet."
      pageSize={PAGE_SIZE}
      pageSizeOptions={[5, 10, 25]}
      currentPage={safePage}
      onCurrentPageChange={onPageChange}
      showStandardToolbar={false}
      showColSelector={false}
      showSearch={false}
      compact
      exportFilename="sub-services"
      renderActions={(sub) => {
        const isDeleting = deletingIndex === sub._index;
        return (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
            <button
              type="button"
              title="Attachment"
              aria-label={`View attachment for ${sub.name}`}
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, color: "#555" }}
            >
              <FiPaperclip size={16} />
            </button>
            <button
              type="button"
              title="Edit"
              aria-label={`Edit ${sub.name}`}
              onClick={() => onEdit(sub._index)}
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, color: "#6b21a8" }}
            >
              <FiEdit2 size={16} />
            </button>
            <button
              type="button"
              title="Delete"
              aria-label={`Delete ${sub.name}`}
              disabled={isDeleting}
              onClick={() => onDelete(sub._index)}
              style={{
                border: "none",
                background: "transparent",
                cursor: isDeleting ? "not-allowed" : "pointer",
                padding: 4,
                color: "#dc2626",
                opacity: isDeleting ? 0.5 : 1,
              }}
            >
              <FiX size={18} />
            </button>
          </div>
        );
      }}
    />
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
            <ShopReveal show={formOpen} className="mb-4">
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

            <SubServiceTable
              subs={subs}
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
