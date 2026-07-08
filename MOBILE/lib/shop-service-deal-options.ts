import type { MyShopServiceCategory } from "@/hooks/use-my-shop-services";

export type ShopServiceDealOption = { label: string; value: string };

/** Options for service deals: sub-services when present, otherwise the shop category from Profile. */
export function buildShopServiceDealOptions(
  categories: Pick<MyShopServiceCategory, "id" | "name" | "subServices">[]
): ShopServiceDealOption[] {
  const opts: ShopServiceDealOption[] = [];
  for (const cat of categories) {
    const catId = cat.id?.trim() ?? "";
    if (!catId) {
      continue;
    }
    const catLabel = cat.name?.trim() || "Service";
    const subsWithId = cat.subServices
      .map((sub) => ({ sub, id: sub.id?.trim() ?? "" }))
      .filter((x) => x.id);

    if (subsWithId.length > 0) {
      for (const { sub, id } of subsWithId) {
        const subLabel = sub.name?.trim() || "Service";
        opts.push({
          value: id,
          label: cat.name?.trim() ? `${catLabel} — ${subLabel}` : subLabel,
        });
      }
      continue;
    }

    opts.push({ value: catId, label: catLabel });
  }
  return opts;
}
