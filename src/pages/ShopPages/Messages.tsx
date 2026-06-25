import { useState } from "react";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopEmptyPanel,
  ShopErrorPanel,
  ShopListPanel,
  ShopLoadingPanel,
  ShopRefreshButton,
} from "../../components/shop/ShopPanels";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopNotifications } from "../../hooks/useShopNotifications";

const MESSAGE_SECTIONS = [
  { id: "notifications", label: "Notifications", variant: "primary" as const },
  { id: "received", label: "Received", variant: "secondary" as const },
  { id: "sent", label: "Sent", variant: "secondary" as const },
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ShopMessagesPage() {
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [activeId, setActiveId] = useState("notifications");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const { items, loading, loadingMore, hasMore, error, refresh, loadMore } = useShopNotifications();

  const showNotifications = activeId === "notifications" || activeId === "received";

  return (
    <ShopPageShell
      title="Messages"
      metaTitle="Messages | AutoDaddy"
      metaDescription="Auto shop notifications and messages"
      headerAction={<ShopRefreshButton onClick={() => void refresh()} />}
      sidebarItems={MESSAGE_SECTIONS}
      activeSidebarId={activeId}
      onSidebarSelect={setActiveId}
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <div className="flex min-h-[420px] flex-1 flex-col lg:min-h-[calc(100vh-220px)]">
        {!showNotifications ? (
          <ShopEmptyPanel className="min-h-0 flex-1" message="No sent messages yet." />
        ) : loading ? (
          <ShopLoadingPanel className="min-h-0 flex-1" />
        ) : error ? (
          <ShopErrorPanel className="min-h-0 flex-1" message={error} onRetry={() => void refresh()} />
        ) : items.length === 0 ? (
          <ShopEmptyPanel className="min-h-0 flex-1" message="No notifications yet." />
        ) : (
          <ShopListPanel className="min-h-0 flex-1">
            {items.map((item) => (
              <article key={item.id} className="rounded-md bg-[#CCFFCC] px-4 py-3 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-sm font-semibold text-gray-900">{item.message}</p>
                  {item.time ? (
                    <p className="shrink-0 text-xs font-medium text-gray-600">{formatTime(item.time)}</p>
                  ) : null}
                </div>
              </article>
            ))}
            {hasMore ? (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-ad-purple hover:bg-gray-50 disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            ) : null}
          </ShopListPanel>
        )}
      </div>
    </ShopPageShell>
  );
}
