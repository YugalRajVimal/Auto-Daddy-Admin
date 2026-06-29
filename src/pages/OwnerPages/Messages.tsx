import { useCallback, useMemo, useState } from "react";
import OwnerPageShell, { OwnerPageRefreshButton } from "../../components/owner/OwnerPageShell";
import { useOwnerNavReset } from "../../hooks/useOwnerNavReset";
import { useCarOwnerNotifications } from "../../hooks/useCarOwnerNotifications";
import {
  DUMMY_OWNER_NOTIFICATIONS,
  DUMMY_OWNER_SERVICE_REQUESTS,
  type DummyOwnerServiceRequest,
} from "../../lib/dummyOwnerMessages";
import { notificationDisplay, type CarOwnerNotification } from "../../types/carOwnerNotifications";

type MessagesTab = "messages" | "notifications";

const MESSAGE_SECTIONS = [
  { id: "messages", label: "Messages" },
  { id: "notifications", label: "Notifications" },
] as const;

function formatNotificationTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MessageRow({ children }: { children?: React.ReactNode }) {
  return (
    <article className="min-h-[52px] rounded-md bg-[#CCFFCC] px-4 py-3 shadow-sm sm:min-h-[56px]">
      {children}
    </article>
  );
}

const REQUEST_STATUS_STYLES: Record<DummyOwnerServiceRequest["status"], string> = {
  Pending: "bg-amber-100 text-amber-800",
  Accepted: "bg-emerald-100 text-emerald-800",
  Declined: "bg-red-100 text-red-800",
};

function ServiceRequestRow({ item }: { item: DummyOwnerServiceRequest }) {
  const when = formatNotificationTime(item.sentAt);

  return (
    <MessageRow>
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-x-2 gap-y-1">
        <div className="min-w-0 text-left">
          <p className="text-sm font-semibold text-gray-900">{item.service}</p>
          <p className="mt-0.5 text-xs font-medium text-gray-600">Vehicle {item.plate}</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">{item.shopName}</p>
          <p className="mt-0.5 text-xs font-medium text-gray-600">{item.shopCity}</p>
        </div>
        <div className="flex flex-col items-end gap-1 justify-self-end">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${REQUEST_STATUS_STYLES[item.status]}`}
          >
            {item.status}
          </span>
          {when ? <p className="text-xs font-medium text-gray-600">{when}</p> : null}
        </div>
      </div>
    </MessageRow>
  );
}

function NotificationRow({ item }: { item: CarOwnerNotification }) {
  const when = formatNotificationTime(item.time);
  const { title, description } = notificationDisplay(item);

  return (
    <MessageRow>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {description ? (
            <p className="mt-0.5 text-xs font-medium text-gray-600">{description}</p>
          ) : null}
        </div>
        {when ? <p className="shrink-0 text-xs font-medium text-gray-600">{when}</p> : null}
      </div>
    </MessageRow>
  );
}

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
      <div className="flex flex-col gap-3">
        {tab === "messages" ? (
          DUMMY_OWNER_SERVICE_REQUESTS.map((item) => (
            <ServiceRequestRow key={item.id} item={item} />
          ))
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
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-600">
            No notifications yet.
          </div>
        ) : (
          <>
            {notifications.map((item) => (
              <NotificationRow key={item.id} item={item} />
            ))}
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
          </>
        )}
      </div>
    </OwnerPageShell>
  );
}
