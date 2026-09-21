import { useEffect, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { useAuth } from "../../auth";
import {
  fetchCarOwnerProductFeatures,
  parseCarOwnerProductFeatures,
} from "../../lib/carOwnerHomeApi";

type FeatureItem = ReturnType<typeof parseCarOwnerProductFeatures>[number];

/** Admin "Product Features" saves `shop-owner`; FAQs use `shop_owner` — try both. */
const SHOP_FEATURE_ROLES = ["shop-owner", "shop_owner"] as const;

/** Home → What's New: admin-published product features as an accordion. */
export default function ShopWhatsNewPanel() {
  const { token } = useAuth();
  const [items, setItems] = useState<FeatureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        for (const role of SHOP_FEATURE_ROLES) {
          const res = await fetchCarOwnerProductFeatures(token, { role });
          const parsed = res.ok ? parseCarOwnerProductFeatures(res.data) : [];
          if (cancelled) return;
          if (parsed.length > 0) {
            setItems(parsed);
            return;
          }
        }
        setItems([]);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        {[0, 1].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-[#e3fbe3]" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 text-center">
        <p className="text-lg font-semibold text-gray-700">You're all caught up</p>
        <p className="text-sm text-gray-500">New features and promotions will show up here.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-6">
      {items.map((item, index) => {
        const open = openIndex === index;
        const panelId = `whats-new-${index}`;
        return (
          <li
            key={item._id ?? `${item.heading}-${index}`}
            className="overflow-hidden rounded-xl border border-[#bdeebd] bg-gradient-to-r from-[#d6fcd6] to-[#e9fde9] shadow-sm"
          >
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenIndex(open ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-6 py-6 text-left sm:px-10"
            >
              <span className="text-xl font-bold text-[#0a7a0a] underline decoration-2 underline-offset-4 sm:text-2xl">
                {item.heading}
              </span>
              <FiChevronDown
                aria-hidden
                className={`size-6 shrink-0 text-[#0a7a0a] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                strokeWidth={3}
              />
            </button>
            {open && item.desc ? (
              <div id={panelId} className="whitespace-pre-line border-t border-[#bdeebd] bg-white/70 px-6 py-4 text-base leading-relaxed text-gray-700 sm:px-10">
                {item.desc}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
