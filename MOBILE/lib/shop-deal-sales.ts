import type { ShopDeal } from "@/types/shop-owner";
import { dealId } from "@/lib/shop-owner-parsers";

export type DealSaleRecord = {
  customerId: string;
  customerName: string;
  soldAt: string;
};

/** Session-local fallback when sell API lags or fails (mirrors web localStorage). */
const sales: Record<string, DealSaleRecord> = {};

export function readDealSales(): Record<string, DealSaleRecord> {
  return { ...sales };
}

export function writeDealSale(id: string, record: DealSaleRecord) {
  if (!id.trim()) return;
  sales[id] = record;
}

export function removeDealSale(id: string) {
  if (!id.trim()) return;
  delete sales[id];
}

export function isDealSold(deal: ShopDeal): boolean {
  return Boolean(deal.soldToCustomerId?.trim() || deal.soldToCustomerName?.trim());
}

export function applyDealSales(deals: ShopDeal[], localSales = readDealSales()): ShopDeal[] {
  return deals.map((deal) => {
    const id = dealId(deal);
    const sale = id ? localSales[id] : undefined;
    if (!sale) return deal;
    if (deal.soldToCustomerId || deal.soldToCustomerName) return deal;
    return {
      ...deal,
      soldToCustomerId: sale.customerId,
      soldToCustomerName: sale.customerName,
      soldAt: sale.soldAt,
    };
  });
}
