import { useCallback, useMemo, useState, type ReactNode } from "react";
import { FiBell, FiMessageSquare, FiRefreshCw, FiSearch } from "react-icons/fi";
import { useLocation } from "react-router";
import { Skeleton } from "../../components/common/Skeleton";
import OwnerPageShell from "../../components/owner/OwnerPageShell";
import {
  OwnerNotificationsTable,
  OwnerServiceRequestsTable,
} from "../../components/owner/OwnerPanelTables";
import {
  ownerVehicleFieldClass,
  ownerVehicleSelectClass,
} from "../../components/owner/ownerVehicleFormUtils";
import { useOwnerNavReset } from "../../hooks/useOwnerNavReset";
import { useCarOwnerNotifications } from "../../hooks/useCarOwnerNotifications";
import {
  DUMMY_OWNER_NOTIFICATIONS,
  DUMMY_OWNER_SERVICE_REQUESTS,
  type DummyOwnerServiceRequest,
} from "../../lib/dummyOwnerMessages";
import type { CarOwnerNotification } from "../../types/carOwnerNotifications";

type MessagesTab = "messages" | "notifications";

const MESSAGE_SECTIONS = [
  { id: "messages", label: "Message Sent" },
  { id: "notifications", label: "Notification Received" },
] as const;

const TAB_META: Record<MessagesTab, { title: string; subtitle: string }> = {
  messages: {
    title: "Request Messages Sent",
    subtitle: "Service requests you’ve sent to auto shops",
  },
  notifications: {
    title: "Notifications",
    subtitle: "Alerts and updates from shops and AutoDaddy",
  },
};

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

function EmptyState({
  children,
  icon: Icon = FiBell,
}: {
  children: ReactNode;
  icon?: typeof FiBell;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ad-purple/20 bg-white/60 px-6 py-14 text-center shadow-sm backdrop-blur-sm">
      <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-ad-bg-purple text-ad-purple">
        <Icon size={22} aria-hidden />
      </span>
      <div className="max-w-sm text-sm text-slate-600">{children}</div>
    </div>
  );
}

export default function OwnerMessagesPage() {
  const location = useLocation();
  const { items, loading, loadingMore, error, hasMore, loadMore, refresh } =
    useCarOwnerNotifications();

  const initialTab =
    (location.state as { initialTab?: MessagesTab } | null | undefined)?.initialTab ??
    MESSAGE_SECTIONS[0].id;
  const [tab, setTab] = useState<MessagesTab>(initialTab);

  const resetSidebar = useCallback(() => {
    setTab(MESSAGE_SECTIONS[0].id);
    setSearchQuery("");
    setMessagePlate("All");
    setNotificationField("Title");
  }, []);

  useOwnerNavReset(resetSidebar);

  const notifications = useMemo(
    () => mergeNotifications(DUMMY_OWNER_NOTIFICATIONS, items),
    [items],
  );
  const meta = TAB_META[tab];

  const [searchQuery, setSearchQuery] = useState("");
  const [messagePlate, setMessagePlate] = useState<string>("All");
  const [notificationField, setNotificationField] = useState<"Title" | "Description" | "All">(
    "Title",
  );

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
        [row.service, row.shopName, row.shopCity, row.status, row.plate]
          .filter(Boolean)
          .join(" "),
        searchQuery,
      ),
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

  const resultCount =
    tab === "messages" ? filteredServiceRequests.length : filteredNotifications.length;

  return (
    <OwnerPageShell
      pageHeading=""
      metaTitle="Messages | AutoDaddy"
      metaDescription="Car owner messages and notifications"
      noPanel
      sidebarItems={MESSAGE_SECTIONS.map((item) => ({
        id: item.id,
        label: item.label,
        variant: "primary" as const,
      }))}
      activeSidebarId={tab}
      onSidebarSelect={(id) => {
        setTab(id as MessagesTab);
        setSearchQuery("");
      }}
    >
      <div className="flex flex-col gap-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm text-slate-500">{meta.subtitle}</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {meta.title}
            </h1>
          </div>
          {!loading && resultCount > 0 ? (
            <p className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-black/5">
              {resultCount} {tab === "messages" ? "message" : "notification"}
              {resultCount === 1 ? "" : "s"}
            </p>
          ) : null}
        </header>

        <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                Filter & search
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {tab === "messages"
                  ? "Narrow by plate or search any field"
                  : "Search by title, description, or both"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/80 transition hover:bg-slate-200/70"
              >
                <FiRefreshCw size={13} aria-hidden />
                Refresh
              </button>

              {tab === "messages" ? (
                <select
                  value={messagePlate}
                  onChange={(e) => setMessagePlate(e.target.value)}
                  className={`${ownerVehicleSelectClass} min-w-[7.5rem] flex-1 sm:max-w-[10rem]`}
                  aria-label="Plate filter"
                >
                  {plateOptions.map((plate) => (
                    <option key={plate} value={plate}>
                      {plate === "All" ? "All plates" : plate}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={notificationField}
                  onChange={(e) =>
                    setNotificationField(e.target.value as typeof notificationField)
                  }
                  className={`${ownerVehicleSelectClass} min-w-[7.5rem] flex-1 sm:max-w-[10rem]`}
                  aria-label="Notification field"
                >
                  <option value="Title">Title</option>
                  <option value="Description">Description</option>
                  <option value="All">All fields</option>
                </select>
              )}

              <div className="relative min-w-[10rem] flex-1 sm:max-w-[16rem]">
                <FiSearch
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  aria-label="Search"
                  className={`${ownerVehicleFieldClass} pl-9`}
                />
              </div>
            </div>
          </div>
        </div>

        {tab === "messages" ? (
          filteredServiceRequests.length === 0 ? (
            <EmptyState icon={FiMessageSquare}>No messages sent yet.</EmptyState>
          ) : (
            <OwnerServiceRequestsTable rows={filteredServiceRequests} />
          )
        ) : loading && notifications.length === 0 ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        ) : error && notifications.length === 0 ? (
          <EmptyState>
            <span className="mb-3 block font-semibold text-slate-800">{error}</span>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-xl bg-ad-purple px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Try again
            </button>
          </EmptyState>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState>No notifications yet.</EmptyState>
        ) : (
          <div className="space-y-3">
            <OwnerNotificationsTable rows={filteredNotifications} />
            {hasMore ? (
              <button
                type="button"
                onClick={() => loadMore()}
                disabled={loadingMore}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-ad-purple shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </OwnerPageShell>
  );
}
