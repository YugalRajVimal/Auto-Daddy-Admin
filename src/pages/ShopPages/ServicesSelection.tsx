import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopListPanel, ShopLoadingPanel, ShopPageContentShell } from "../../components/shop/ShopPanels";
import { shopSaveButtonClass } from "../../components/shop/forms/ShopFormPage";
import { useAuth } from "../../auth";
import { apiMessage, fetchServiceCatalog, updateServiceWeWorkWith } from "../../lib/shopOwnerMutations";
import { useShopServices } from "../../hooks/useShopServices";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";

type CatalogItem = { id: string; name: string };

function parseCatalog(payload: unknown): CatalogItem[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const raw = root.services ?? (root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>).services : null);
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const id = String(o._id ?? o.id ?? "");
      const name = String(o.name ?? "");
      return id && name ? { id, name } : null;
    })
    .filter(Boolean) as CatalogItem[];
}

export default function ShopServicesSelectionPage() {
  const { token } = useAuth();
  const { categories, refresh: refreshMine } = useShopServices();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [faqsOpen, setFaqsOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    void fetchServiceCatalog(token).then((res) => {
      if (res.ok) setCatalog(parseCatalog(res.data));
      setLoading(false);
    });
  }, [token]);

  useEffect(() => {
    setSelected(new Set(categories.map((c) => c.id)));
  }, [categories]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await updateServiceWeWorkWith(token, [...selected]);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not save.");
        return;
      }
      toast.success("Services updated.");
      void refreshMine();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ShopPageShell
      title="Operational Services"
      metaTitle="Services Selection | AutoDaddy"
      metaDescription="Select shop services"
      headerAction={
        <button type="button" className={shopSaveButtonClass} disabled={saving} onClick={() => void handleSave()}>
          {saving ? "Saving…" : "Save"}
        </button>
      }
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <ShopPageContentShell>
        {loading ? (
          <ShopLoadingPanel variant="checkbox-row" count={8} />
        ) : (
          <ShopListPanel>
          {catalog.map((item) => (
            <label key={item.id} className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3">
              <span className="text-sm font-semibold text-gray-900">{item.name}</span>
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggle(item.id)}
                className="h-4 w-4 accent-ad-purple"
              />
            </label>
          ))}
        </ShopListPanel>
        )}
      </ShopPageContentShell>
    </ShopPageShell>
  );
}
