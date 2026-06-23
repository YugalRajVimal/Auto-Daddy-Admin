import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import PortalSidebarButton from "../../components/admin/PortalSidebarButton";
import OwnerFaqsDialog from "../../components/owner/OwnerFaqsDialog";
import { useCarOwnerDashboard } from "../../hooks/useOwnerPortal";
import { useCarOwnerNotifications } from "../../hooks/useCarOwnerNotifications";
import type { CarOwnerNotification } from "../../types/carOwnerNotifications";

type MessagesTab = "messages" | "notifications";

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

function NotificationRow({ item }: { item: CarOwnerNotification }) {
  const when = formatNotificationTime(item.time);

  return (
    <MessageRow>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-semibold text-gray-900">{item.message}</p>
        {when ? <p className="shrink-0 text-xs font-medium text-gray-600">{when}</p> : null}
      </div>
    </MessageRow>
  );
}

export default function OwnerMessagesPage() {
  const { faqsHeading, faqsDescription } = useCarOwnerDashboard();
  const { items, loading, loadingMore, error, hasMore, loadMore, refresh } = useCarOwnerNotifications();

  const [tab, setTab] = useState<MessagesTab>("messages");
  const [faqsOpen, setFaqsOpen] = useState(false);

  return (
    <PortalPageContent className="flex flex-col px-3 py-3 sm:px-4 md:py-4 lg:px-6">
      <PageMeta title="Messages | AutoDaddy" description="Car owner messages and notifications" />

      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-base font-bold text-blue-700">Messages</h1>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-ad-purple hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch">
        <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-[220px] xl:w-[260px]">
          <PortalSidebarButton
            label="Messages"
            active={tab === "messages"}
            onClick={() => setTab("messages")}
          />
          <PortalSidebarButton
            label="Notifications"
            active={tab === "notifications"}
            onClick={() => setTab("notifications")}
          />
          <button
            type="button"
            onClick={() => setFaqsOpen(true)}
            className="mt-auto rounded-full border border-blue-600 bg-white/70 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-blue-600 transition-colors hover:bg-white"
          >
            FAQs
          </button>
        </aside>

        <div className="flex min-h-[420px] flex-1 flex-col">
          {tab === "messages" ? (
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
                No messages yet.
              </div>
            </div>
          ) : loading ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-white">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
            </div>
          ) : error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-md border border-gray-200 bg-white p-6 text-center">
              <p className="text-sm font-semibold text-gray-800">{error}</p>
              <button
                type="button"
                onClick={() => void refresh()}
                className="rounded-md bg-ad-purple px-4 py-2 text-sm font-semibold text-white"
              >
                Try again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
              No notifications yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
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
            </div>
          )}
        </div>
      </div>

      <OwnerFaqsDialog
        open={faqsOpen}
        onClose={() => setFaqsOpen(false)}
        heading={faqsHeading}
        description={faqsDescription}
      />
    </PortalPageContent>
  );
}
