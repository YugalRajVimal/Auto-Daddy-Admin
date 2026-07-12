import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router";
import {
  ADMIN_PANEL_THEAD_ROW_CLASS,
  adminPanelRowClass,
  adminPanelTableClasses,
  type AdminPanelTableClasses,
} from "../../components/admin/adminPanelTableStyles";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopErrorPanel,
  ShopListFooter,
  ShopLoadingPanel,
  ShopRefreshButton,
} from "../../components/shop/ShopPanels";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopNotifications } from "../../hooks/useShopNotifications";
import type { ShopOwnerNotification } from "../../types/shopOwner";

type MessageSection = "notifications" | "received" | "sent";

const MESSAGE_SECTIONS = [
  { id: "notifications", label: "Notifications", variant: "primary" as const },
  { id: "received", label: "Received", variant: "secondary" as const },
  { id: "sent", label: "Sent", variant: "secondary" as const },
];

const SECTION_HEADINGS: Record<MessageSection, string> = {
  notifications: "Notifications",
  received: "Received",
  sent: "Sent",
};

const SHOP_TABLE_BASE = adminPanelTableClasses(true);
const SHOP_TABLE: AdminPanelTableClasses = {
  ...SHOP_TABLE_BASE,
  th: SHOP_TABLE_BASE.th.replace("px-2", "px-4"),
  td: SHOP_TABLE_BASE.td.replace("px-2", "px-4"),
};

const SHOP_TABLE_HEAD_TH_CLASS = `${SHOP_TABLE.th} h-9 py-0 align-middle`;
const SHOP_TABLE_BODY_TD_CLASS = `${SHOP_TABLE.td} h-9 py-0 align-middle`;

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

function isMessageSection(id: string): id is MessageSection {
  return id === "notifications" || id === "received" || id === "sent";
}

function MessagesTable({ rows }: { rows: ShopOwnerNotification[] }) {
  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className="shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className={SHOP_TABLE.table}>
          <thead>
            <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Date</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Message</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, index) => (
              <tr key={item.id} className={adminPanelRowClass(index)}>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} whitespace-nowrap`}>
                  {item.time ? formatTime(item.time) : "—"}
                </td>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} max-w-xl whitespace-normal font-semibold text-gray-800`}>
                  {item.message || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default function ShopMessagesPage() {
  const location = useLocation();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const initialTab = (location.state as { initialTab?: string } | null | undefined)?.initialTab;
  const [activeId, setActiveId] = useState<MessageSection>(
    initialTab && isMessageSection(initialTab) ? initialTab : "notifications",
  );
  const [faqsOpen, setFaqsOpen] = useState(false);
  const { items, loading, loadingMore, hasMore, error, refresh, loadMore } = useShopNotifications();

  const showNotifications = activeId === "notifications" || activeId === "received";

  return (
    <ShopPageShell
      title="Messages"
      pageHeading={SECTION_HEADINGS[activeId]}
      metaTitle="Messages | AutoDaddy"
      metaDescription="Auto shop notifications and messages"
      sidebarVariant="nav"
      sidebarItems={MESSAGE_SECTIONS}
      activeSidebarId={activeId}
      onSidebarSelect={(id) => {
        if (isMessageSection(id)) setActiveId(id);
      }}
      heroBackgroundImage={false}
      contentTopOffset
      heroCardFlush
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <div className="space-y-1">
        <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-end gap-2 py-1.5 sm:gap-3">
          <ShopRefreshButton onClick={() => void refresh()} />
        </div>

        {!showNotifications ? (
          <p className="py-8 text-center text-sm text-gray-600">No sent messages yet.</p>
        ) : loading ? (
          <ShopLoadingPanel variant="profile-table" count={6} />
        ) : error ? (
          <ShopErrorPanel message={error} onRetry={() => void refresh()} />
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-600">No notifications yet.</p>
        ) : (
          <>
            <MessagesTable rows={items} />
            <ShopListFooter>
              <p>{items.length} Entries</p>
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
            </ShopListFooter>
          </>
        )}
      </div>
    </ShopPageShell>
  );
}
