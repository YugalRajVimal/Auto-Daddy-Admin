import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopListPanel, ShopLoadingPanel, ShopPageContentShell } from "../../components/shop/ShopPanels";
import { useAuth } from "../../auth";
import { addMyCarCompanies, fetchMainCarCompanies, removeMyCarCompanies } from "../../lib/shopOwnerMutations";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";

type CarCompany = { _id?: string; id?: string; name?: string; companyName?: string };

function parseCompanies(payload: unknown): CarCompany[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = root.data;
  const arr = Array.isArray(data) ? data : Array.isArray(root.companies) ? root.companies : [];
  return arr as CarCompany[];
}

export default function ShopCarCompaniesPage() {
  const { token } = useAuth();
  const { refresh: refreshProfile, faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [all, setAll] = useState<CarCompany[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [faqsOpen, setFaqsOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    void fetchMainCarCompanies(token).then((res) => {
      if (res.ok) {
        const list = parseCompanies(res.data);
        setAll(list);
        const ids = list.filter((c) => (c as { selected?: boolean }).selected).map((c) => String(c._id ?? c.id ?? ""));
        setSelected(new Set(ids.filter(Boolean)));
      }
      setLoading(false);
    });
  }, [token]);

  const toggle = async (id: string, next: boolean) => {
    if (!token) return;
    setSaving(id);
    try {
      const res = next
        ? await addMyCarCompanies(token, [id])
        : await removeMyCarCompanies(token, [id]);
      if (!res.ok) {
        toast.error("Could not update.");
        return;
      }
      setSelected((prev) => {
        const copy = new Set(prev);
        if (next) copy.add(id);
        else copy.delete(id);
        return copy;
      });
      void refreshProfile();
    } finally {
      setSaving(null);
    }
  };

  return (
    <ShopPageShell
      title="Car Brands Specialist"
      metaTitle="Car Companies | AutoDaddy"
      metaDescription="Car brands"
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
          {all.map((c) => {
            const id = String(c._id ?? c.id ?? "");
            const name = c.name ?? c.companyName ?? "—";
            const on = selected.has(id);
            return (
              <label key={id} className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-3">
                <span className="text-sm font-semibold text-gray-900">{name}</span>
                <input
                  type="checkbox"
                  checked={on}
                  disabled={saving === id}
                  onChange={(e) => void toggle(id, e.target.checked)}
                  className="h-4 w-4 accent-ad-purple"
                />
              </label>
            );
          })}
        </ShopListPanel>
        )}
      </ShopPageContentShell>
    </ShopPageShell>
  );
}
