import { useCallback, useMemo, useState } from "react";
import OwnerPageShell, { OwnerPageRefreshButton } from "../../components/owner/OwnerPageShell";
import {
  OwnerNotificationsTable,
  OwnerServiceRequestsTable,
} from "../../components/owner/OwnerPanelTables";
import { useOwnerNavReset } from "../../hooks/useOwnerNavReset";
import { useCarOwnerNotifications } from "../../hooks/useCarOwnerNotifications";
import {
  DUMMY_OWNER_NOTIFICATIONS,
  DUMMY_OWNER_SERVICE_REQUESTS,
} from "../../lib/dummyOwnerMessages";
import type { CarOwnerNotification } from "../../types/carOwnerNotifications";

type MessagesTab = "messages" | "notifications";

const MESSAGE_SECTIONS = [
  { id: "messages", label: "Messages" },
  { id: "notifications", label: "Notifications" },
] as const;

function mergeNotifications(
  dummy: CarOwnerNotification[],
  api: CarOwnerNotification[],
): CarOwnerNotification[] {
  const seen = new Set<string>();
  const merged: CarOwnerNotification[] = [];

  for (const item of [...dummy, ...api]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }

  return merged.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

export default function OwnerMessagesPage() {
  const { items, loading, loadingMore, error, hasMore, loadMore, refresh } = useCarOwnerNotifications();

  const [tab, setTab] = useState<MessagesTab>(MESSAGE_SECTIONS[0].id);

  const resetSidebar = useCallback(() => {
    setTab(MESSAGE_SECTIONS[0].id);
  }, []);

  useOwnerNavReset(resetSidebar);

  const notifications = useMemo(() => mergeNotifications(DUMMY_OWNER_NOTIFICATIONS, items), [items]);
  const sectionLabel = tab === "messages" ? "Messages Sent" : "Notifications Received";

  return (
    <OwnerPageShell
      pageHeading={sectionLabel}
      metaTitle="Messages | AutoDaddy"
      metaDescription="Car owner messages and notifications"
      headerAction={<OwnerPageRefreshButton onClick={() => void refresh()} />}
      sidebarItems={MESSAGE_SECTIONS.map((item) => ({
        id: item.id,
        label: item.label,
        variant: "primary" as const,
      }))}
      activeSidebarId={tab}
      onSidebarSelect={(id) => setTab(id as MessagesTab)}
      heroCardFlush
      contentTopOffset
    >
      {tab === "messages" ? (
        DUMMY_OWNER_SERVICE_REQUESTS.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-600">No messages sent yet.</p>
        ) : (
          <OwnerServiceRequestsTable rows={DUMMY_OWNER_SERVICE_REQUESTS} />
        )
      ) : loading && notifications.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
        </div>
      ) : error && notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm font-semibold text-gray-800">{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-md bg-ad-purple px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-600">No notifications yet.</p>
      ) : (
        <div className="space-y-3">
          <OwnerNotificationsTable rows={notifications} />
          {hasMore ? (
            <button
              type="button"
              onClick={() => loadMore()}
              disabled={loadingMore}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-ad-purple hover:bg-gray-50 disabled:opacity-60"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          ) : null}
        </div>
      )}
    </OwnerPageShell>
  );
}
