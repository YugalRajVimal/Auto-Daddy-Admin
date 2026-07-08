import { useCallback, useMemo, useState } from "react";
import OwnerPageShell, { OwnerPageRefreshButton } from "../../components/owner/OwnerPageShell";
import {
  OwnerNotificationsTable,
  OwnerServiceRequestsTable,
} from "../../components/owner/OwnerPanelTables";
import { useLocation } from "react-router";
import { useOwnerNavReset } from "../../hooks/useOwnerNavReset";
import { useCarOwnerNotifications } from "../../hooks/useCarOwnerNotifications";
import {
  DUMMY_OWNER_NOTIFICATIONS,
  DUMMY_OWNER_SERVICE_REQUESTS,
} from "../../lib/dummyOwnerMessages";
import type { CarOwnerNotification } from "../../types/carOwnerNotifications";
import type { DummyOwnerServiceRequest } from "../../lib/dummyOwnerMessages";

type MessagesTab = "messages" | "notifications";

const MESSAGE_SECTIONS = [
  { id: "messages", label: "Message Sent" },
  { id: "notifications", label: "Notification Received" },
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

function normalizedHaystack(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matchesQuery(haystack: string, query: string): boolean {
  const q = normalizedHaystack(query).trim();
  if (!q) return true;
  return normalizedHaystack(haystack).includes(q);
}

function plateKey(row: DummyOwnerServiceRequest): string {
  return row.plate.trim().toUpperCase();
}

export default function OwnerMessagesPage() {
  const location = useLocation();
  const { items, loading, loadingMore, error, hasMore, loadMore, refresh } = useCarOwnerNotifications();

  const initialTab =
    (location.state as { initialTab?: MessagesTab } | null | undefined)?.initialTab ?? MESSAGE_SECTIONS[0].id;
  const [tab, setTab] = useState<MessagesTab>(initialTab);

  const resetSidebar = useCallback(() => {
    setTab(MESSAGE_SECTIONS[0].id);
  }, []);

  useOwnerNavReset(resetSidebar);

  const notifications = useMemo(() => mergeNotifications(DUMMY_OWNER_NOTIFICATIONS, items), [items]);
  const sectionLabel = tab === "messages" ? "Request Messages Sent" : "Notifications";

  const [searchQuery, setSearchQuery] = useState("");
  const [messagePlate, setMessagePlate] = useState<string>("All");
  const [notificationField, setNotificationField] = useState<"Title" | "Description" | "All">("Title");

  const plateOptions = useMemo(() => {
    const seen = new Set<string>();
    const plates = DUMMY_OWNER_SERVICE_REQUESTS.map(plateKey).filter((p) => {
      if (!p) return false;
      if (seen.has(p)) return false;
      seen.add(p);
      return true;
    });
    return ["All", ...plates];
  }, []);

  const filteredServiceRequests = useMemo(() => {
    const rows = DUMMY_OWNER_SERVICE_REQUESTS;
    const byPlate =
      messagePlate === "All"
        ? rows
        : rows.filter((row) => plateKey(row) === messagePlate.trim().toUpperCase());

    if (!searchQuery.trim()) return byPlate;
    return byPlate.filter((row) =>
      matchesQuery(
        [row.service, row.shopName, row.shopCity, row.status, row.plate].filter(Boolean).join(" "),
        searchQuery
      )
    );
  }, [messagePlate, searchQuery]);

  const filteredNotifications = useMemo(() => {
    if (!searchQuery.trim()) return notifications;
    return notifications.filter((n) => {
      const title = n.title ?? "";
      const desc = n.message ?? "";
      const haystack =
        notificationField === "Title"
          ? title
          : notificationField === "Description"
            ? desc
            : [title, desc].filter(Boolean).join(" ");
      return matchesQuery(haystack, searchQuery);
    });
  }, [notificationField, notifications, searchQuery]);

  return (
    <OwnerPageShell
      pageHeading={sectionLabel}
      metaTitle="Messages | AutoDaddy"
      metaDescription="Car owner messages and notifications"
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
      <div className="overflow-hidden rounded border border-gray-300 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 bg-ad-purple px-3 py-2">
          <h2 className="flex-1 text-center text-sm font-bold text-white sm:text-base">{sectionLabel}</h2>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <OwnerPageRefreshButton onClick={() => void refresh()} label="Refresh" />
            {tab === "messages" ? (
              <select
                value={messagePlate}
                onChange={(e) => setMessagePlate(e.target.value)}
                className="h-8 rounded border border-gray-300 bg-white px-2 text-sm text-gray-800"
                aria-label="Plate filter"
              >
                {plateOptions.map((plate) => (
                  <option key={plate} value={plate}>
                    {plate}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={notificationField}
                onChange={(e) => setNotificationField(e.target.value as typeof notificationField)}
                className="h-8 rounded border border-gray-300 bg-white px-2 text-sm text-gray-800"
                aria-label="Notification field"
              >
                <option value="Title">Title</option>
                <option value="Description">Description</option>
                <option value="All">All</option>
              </select>
            )}

            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search"
              className="h-8 w-[170px] rounded border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 sm:w-[220px]"
            />

            <button
              type="button"
              onClick={() => {
                // Keep behavior purely visual (as in legacy UI); search is already live.
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ad-green text-white shadow-sm hover:bg-ad-green-dark"
              aria-label="Search"
              title="Search"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M8.5 3a5.5 5.5 0 1 0 3.455 9.79l3.128 3.129a1 1 0 0 0 1.414-1.414l-3.129-3.128A5.5 5.5 0 0 0 8.5 3ZM5 8.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-2 sm:p-3">
      {tab === "messages" ? (
        filteredServiceRequests.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-600">No messages sent yet.</p>
        ) : (
          <OwnerServiceRequestsTable rows={filteredServiceRequests} />
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
      ) : filteredNotifications.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-600">No notifications yet.</p>
      ) : (
        <div className="space-y-3">
          <OwnerNotificationsTable rows={filteredNotifications} />
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
    </OwnerPageShell>
  );
}
