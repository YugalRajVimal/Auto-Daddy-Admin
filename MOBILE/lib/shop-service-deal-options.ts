import type { MyShopServiceCategory } from "@/hooks/use-my-shop-services";

export type ShopServiceDealOption = {
  label: string;
  value: string;
  /** Parent or sub-service id sent as `serviceId` to the deals API. */
  serviceId: string;
  /** Sub-service display name sent as `productName` / `subServiceName`. */
  subName: string;
};

/** Options for service deals — mirrors web ShopDealFormDialog (sub-services first). */
export function buildShopServiceDealOptions(
  categories: Pick<MyShopServiceCategory, "id" | "name" | "subServices">[]
): ShopServiceDealOption[] {
  const opts: ShopServiceDealOption[] = [];
  for (const cat of categories) {
    const catId = cat.id?.trim() ?? "";
    if (!catId) continue;
    const catLabel = cat.name?.trim() || "Service";
    const subs = cat.subServices ?? [];
    let added = 0;
    subs.forEach((sub, index) => {
      const subLabel = sub.name?.trim();
      if (!subLabel) return;
      const subId = sub.id?.trim() ?? "";
      opts.push({
        value: subId || `${catId}::${index}`,
        serviceId: subId || catId,
        label: cat.name?.trim() ? `${catLabel} — ${subLabel}` : subLabel,
        subName: subLabel,
      });
      added += 1;
    });
    if (added === 0) {
      opts.push({
        value: catId,
        serviceId: catId,
        label: catLabel,
        subName: catLabel,
      });
    }
  }
  return opts;
}
