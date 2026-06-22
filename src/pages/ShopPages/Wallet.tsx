import { useMemo, useState } from "react";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopEmptyPanel,
  ShopErrorPanel,
  ShopGreenRow,
  ShopListPanel,
  ShopLoadingPanel,
  ShopRefreshButton,
} from "../../components/shop/ShopPanels";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopWallet } from "../../hooks/useShopWallet";
import { formatWalletAmount, shortJobBadgeCode } from "../../lib/shopOwnerWallet";
import useAuth from "../../auth/useAuth";

const WALLET_SECTIONS = [
  { id: "all", label: "All Invoices", variant: "primary" as const },
  { id: "paid", label: "Paid Invoices", variant: "secondary" as const },
  { id: "unpaid", label: "Unpaid Invoices", variant: "secondary" as const },
  { id: "expenses", label: "Expenses", variant: "primary" as const },
];

export default function ShopWalletPage() {
  const { session } = useAuth();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [activeId, setActiveId] = useState("all");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const { paid, unpaid, loading, error, refresh } = useShopWallet();

  const list = useMemo(() => {
    if (activeId === "paid") return paid;
    if (activeId === "unpaid") return unpaid;
    if (activeId === "expenses") return [];
    return [...paid, ...unpaid];
  }, [activeId, paid, unpaid]);

  return (
    <ShopPageShell
      metaTitle="Wallet | AutoDaddy"
      metaDescription="Auto shop wallet and invoices"
      sidebarItems={WALLET_SECTIONS}
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
      ) : activeId === "expenses" ? (
        <ShopEmptyPanel message="Expenses are not available via API yet." />
      ) : list.length === 0 ? (
        <ShopEmptyPanel message="No invoices in this category." />
      ) : (
        <ShopListPanel>
          {list.map((row) => {
            const isPaid = paid.some((p) => p.id === row.id);
            return (
              <ShopGreenRow
                key={row.id}
                left={
                  <p className="text-sm font-bold text-white">{shortJobBadgeCode(row.jobNo)}</p>
                }
                center={
                  <div>
                    <p className="text-sm font-bold text-gray-900">{row.customerName ?? "—"}</p>
                    {row.vehiclePlate ? <p className="text-xs text-gray-600">{row.vehiclePlate}</p> : null}
                  </div>
                }
                right={
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isPaid ? "text-[#006600]" : "text-red-700"}`}>
                      {formatWalletAmount(row.total, isPaid, session?.meta?.countryCode)}
                    </p>
                    <p className="text-xs text-gray-600">{row.date ?? "—"}</p>
                    <p className="text-xs font-semibold text-ad-purple">{row.paymentStatus ?? (isPaid ? "Paid" : "Unpaid")}</p>
                  </div>
                }
              />
            );
          })}
        </ShopListPanel>
      )}
    </ShopPageShell>
  );
}
