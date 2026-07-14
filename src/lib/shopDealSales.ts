import type { ShopDeal } from "../types/shopOwner";
import { dealId } from "./shopOwnerParsers";

export type DealSaleRecord = {
  customerId: string;
  customerName: string;
  soldAt: string;
};

const STORAGE_KEY = "autodaddy.shop.dealSales";

function readRawSales(): Record<string, DealSaleRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<DealSaleRecord>>;
    if (!parsed || typeof parsed !== "object") return {};
    const next: Record<string, DealSaleRecord> = {};
    for (const [id, value] of Object.entries(parsed)) {
      const customerId = value?.customerId?.trim();
      const customerName = value?.customerName?.trim();
      if (!id || !customerId || !customerName) continue;
      next[id] = {
        customerId,
        customerName,
        soldAt: value.soldAt?.trim() || new Date().toISOString(),
      };
    }
    return next;
  } catch {
    return {};
  }
}

export function readDealSales(): Record<string, DealSaleRecord> {
  return readRawSales();
}

export function writeDealSale(id: string, record: DealSaleRecord) {
  if (!id.trim()) return;
  const all = readRawSales();
  all[id] = record;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / private mode
  }
}

export function removeDealSale(id: string) {
  if (!id.trim()) return;
  const all = readRawSales();
  if (!(id in all)) return;
  delete all[id];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore quota / private mode
  }
}

export function isDealSold(deal: ShopDeal): boolean {
  return Boolean(deal.soldToCustomerId?.trim() || deal.soldToCustomerName?.trim());
}

export function applyDealSales(deals: ShopDeal[], sales = readDealSales()): ShopDeal[] {
  return deals.map((deal) => {
    const id = dealId(deal);
    const sale = id ? sales[id] : undefined;
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
