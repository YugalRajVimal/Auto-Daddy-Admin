import { useState } from "react";
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
      sidebarItems={REPORT_SECTIONS}
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
      ) : filtered.length === 0 ? (
        <ShopEmptyPanel message={`No ${activeId === "resolved" ? "resolved" : "open"} payment records.`} />
      ) : (
        <ShopListPanel>
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
    </ShopPageShell>
  );
}
