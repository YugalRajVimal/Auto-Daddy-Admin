import { useState } from "react";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopContentHeader,
  ShopEmptyPanel,
  ShopErrorPanel,
  ShopGreenRow,
  ShopListPanel,
  ShopLoadingPanel,
  ShopRefreshButton,
} from "../../components/shop/ShopPanels";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopPayments } from "../../hooks/useShopPayments";

const REPORT_SECTIONS = [
  { id: "ticket-raised", label: "Ticket Raised", variant: "primary" as const },
  { id: "resolved", label: "Resolved", variant: "secondary" as const },
];

function pickField(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "—";
}

export default function ShopReportsPage() {
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [activeId, setActiveId] = useState("ticket-raised");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const { rows, loading, error, refresh } = useShopPayments();

  const filtered = rows.filter((row) => {
    const status = pickField(row, ["status", "paymentStatus", "state"]).toLowerCase();
    if (activeId === "resolved") {
      return status.includes("paid") || status.includes("complete") || status.includes("resolved");
    }
    return !status.includes("paid") && !status.includes("complete") && !status.includes("resolved");
  });

  return (
    <ShopPageShell
      metaTitle="Reports | AutoDaddy"
      metaDescription="Auto shop reports and payments"
      sidebarHeading="Reports"
      sidebarHeadingClassName="font-serif text-2xl font-bold text-gray-600 md:text-3xl"
      sidebarItems={REPORT_SECTIONS}
      activeSidebarId={activeId}
      onSidebarSelect={setActiveId}
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <div className="flex min-h-[420px] flex-1 flex-col lg:min-h-[calc(100vh-220px)]">
        <ShopContentHeader action={<ShopRefreshButton onClick={() => void refresh()} />} />

        {loading ? (
          <ShopLoadingPanel className="min-h-0 flex-1" />
        ) : error ? (
          <ShopErrorPanel className="min-h-0 flex-1" message={error} onRetry={() => void refresh()} />
        ) : filtered.length === 0 ? (
          <ShopEmptyPanel className="min-h-0 flex-1" message={`No ${activeId === "resolved" ? "resolved" : "open"} payment records.`} />
        ) : (
          <ShopListPanel className="min-h-0 flex-1">
            {filtered.map((row, idx) => (
              <ShopGreenRow
                key={pickField(row, ["_id", "id"]) !== "—" ? pickField(row, ["_id", "id"]) : String(idx)}
                left={
                  <p className="text-sm font-bold text-white">
                    {pickField(row, ["type", "category", "paymentMethod"])}
                  </p>
                }
                center={
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {pickField(row, ["description", "title", "customerName", "name"])}
                    </p>
                    <p className="text-xs text-gray-600">{pickField(row, ["date", "createdAt", "paymentDate"])}</p>
                  </div>
                }
                right={
                  <p className="text-sm font-bold text-[#008000]">
                    {pickField(row, ["amount", "total", "price"])}
                  </p>
                }
              />
            ))}
          </ShopListPanel>
        )}
      </div>
    </ShopPageShell>
  );
}
