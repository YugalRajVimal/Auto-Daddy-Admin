import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router";
import { FiPaperclip, FiVolume2, FiLoader } from "react-icons/fi";
import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
import AdminSearchCard, {
  emptyAdminSearchValues,
  searchEquals,
  searchIncludes,
  type AdminSearchField,
} from "../../../components/admin/AdminSearchCard";
// import ClipImageHover from "../../../components/admin/ClipImageHover";
import {
  CompactAutoGrowTextarea,
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
  // compactReadOnlyMultilineClass,
  compactReadOnlyValueClass,
} from "../../../components/admin/ContentPanel";
import { useAdminDeletedView } from "../../../hooks/useAdminDeletedView";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";

const API_ROOT = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/admin`
  : "/api/admin";

const USER_TYPE_SEARCH_OPTIONS = [
  { value: "carOwner", label: "Car Owner" },
  { value: "shopOwner", label: "Shop Owner" },
];

const SENT_SEARCH_FIELDS: AdminSearchField[] = [
  { key: "date", label: "Date", type: "date" },
  { key: "title", label: "Title" },
  { key: "note", label: "Note" },
  { key: "userType", label: "User Type", type: "select", options: USER_TYPE_SEARCH_OPTIONS },
  { key: "user", label: "User" },
];

const RECEIVED_SEARCH_FIELDS: AdminSearchField[] = [
  { key: "date", label: "Date", type: "date" },
  { key: "userType", label: "User Type", type: "select", options: USER_TYPE_SEARCH_OPTIONS },
  { key: "user", label: "User" },
  { key: "ticketNo", label: "Ticket No." },
  { key: "status", label: "Status", type: "select", options: [
    { value: "resolved", label: "Resolved" },
    { value: "unresolved", label: "Unresolved" }
  ]},
];

interface InviteHelp {
  _id: string;
  date?: string;
  ticketNo?: string;
  title?: string;
  message?: string;
  imageUrl?: string | null;
  userType?: UserType;
  status?: "resolved" | "unresolved";
  audioBlob?: { type: string; data: number[] } | { type: "Buffer"; data: number[] };
  audioUrl?: string;
  createdAt?: string;
  userId?: {
    name?: string;
    email?: string;
    role?: string;
    businessProfile?: {
      businessName?: string;
      businessEmail?: string;
    };
  };
}

type UserType = "carOwner" | "shopOwner";
type UserScope = "all" | "particular";

interface SentNotification {
  _id: string;
  date: string;
  title: string;
  note: string;
  imageUrl?: string | null;
  userType: UserType;
  userScope: UserScope;
  particularUsers?: string[] | null;
}

type MessagesSection = "sent" | "received";

type NavResetLocationState = {
  navReset?: number;
};

type InvitehelpProps = {
  title?: string;
  section?: MessagesSection;
  showAddNew?: boolean;
};

const USER_TYPE_OPTIONS: { value: UserType; label: string }[] = [
  { value: "carOwner", label: "Car Owner" },
  { value: "shopOwner", label: "Shop Owner" },
];

const CAR_OWNER_USERS = [
  "John Smith",
  "Maria Garcia",
  "David Chen",
  "Sarah Johnson",
  "Michael Brown",
  "Emily Wilson",
  "James Taylor",
  "Lisa Anderson",
];

const SHOP_OWNER_USERS = [
  "Northside Auto",
  "Premium Auto Care",
  "Wright Fleet Services",
  "Kim Auto Shop",
  "Allen Motors Garage",
  "City Tire & Brake",
  "Lakeview Auto Repair",
  "Eastside Detailing",
];

function userTypeLabel(userType: UserType) {
  return USER_TYPE_OPTIONS.find((o) => o.value === userType)?.label ?? userType;
}

function userScopeLabel(notification: SentNotification) {
  if (notification.userScope === "all") return "All";
  if (notification.particularUsers?.length) return notification.particularUsers.join(", ");
  return "All";
}

function particularUsersForType(userType: UserType) {
  return userType === "carOwner" ? CAR_OWNER_USERS : SHOP_OWNER_USERS;
}

function arrayBufferToBlobUrl(buffer: number[], mimeType = "audio/webm") {
  const arr = new Uint8Array(buffer);
  const blob = new Blob([arr], { type: mimeType });
  return URL.createObjectURL(blob);
}

function receivedDate(inv: InviteHelp) {
  if (inv.date) return inv.date;
  if (inv.createdAt) return new Date(inv.createdAt).toLocaleDateString();
  return "—";
}

function receivedTicketNo(inv: InviteHelp) {
  if (inv.ticketNo) return inv.ticketNo;
  return inv._id.slice(-8).toUpperCase();
}

function receivedUserType(inv: InviteHelp): UserType {
  if (inv.userType) return inv.userType;
  if (inv.userId?.role?.toLowerCase().includes("shop")) return "shopOwner";
  if (inv.userId?.businessProfile?.businessName) return "shopOwner";
  return "carOwner";
}

function receivedUserName(inv: InviteHelp) {
  const userType = receivedUserType(inv);
  if (userType === "shopOwner") {
    return inv.userId?.businessProfile?.businessName || inv.userId?.name || "—";
  }
  return inv.userId?.name || inv.userId?.businessProfile?.businessName || "—";
}

function receivedImageUrl(inv: InviteHelp) {
  return inv.imageUrl ?? null;
}

// --- Audio blob fetching by id ---
// FIX: Handle Node.js Buffer object shape from backend ("{ type: 'Buffer', data: [...] }")
async function fetchInviteHelpAudioBlob(
  id: string
): Promise<{ data: number[]; type: string } | null> {
  const res = await fetch(`${API_ROOT}/invite-help/audio/${id}`, {
    credentials: "include",
  });
  if (!res.ok) {
    return null;
  }
  const data = await res.json();

  // Supporting possible Buffer object: data.audioBlob may be {type: 'Buffer', data: [...]}
  let audioBlob: { type?: string; data?: any } | undefined = data?.audioBlob;

  if (audioBlob && typeof audioBlob === "object") {
    if (
      audioBlob.type === "Buffer" &&
      Array.isArray(audioBlob.data)
    ) {
      // Return in standard format, fixing type as "audio/webm" for playback if needed
      return {
        data: audioBlob.data,
        type: "audio/webm",
      };
    }
    // If already standard (type + data), return as is
    if (
      typeof audioBlob.type === "string" &&
      Array.isArray(audioBlob.data)
    ) {
      return {
        data: audioBlob.data,
        type: audioBlob.type || "audio/webm",
      };
    }
  }

  // If returned as { data: ... }:
  if (data?.data && Array.isArray(data.data)) {
    return {
      data: data.data,
      type: "audio/webm",
    };
  }

  // Unknown/invalid format
  return null;
}

function isSentNotification(item: InviteHelp | SentNotification): item is SentNotification {
  return "userScope" in item && "note" in item;
}

async function fetchInviteHelps(): Promise<InviteHelp[]> {
  const res = await fetch(`${API_ROOT}/invite-help`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error(`Failed to fetch: ${await res.text()}`);

  const data = await res.json();
  return data.data ?? [];
}

async function updateInviteHelpStatus(id: string, status: "resolved" | "unresolved"): Promise<InviteHelp> {
  const res = await fetch(`${API_ROOT}/invite-help/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Failed to update: ${await res.text()}`);
  return await res.json();
}

export default function Invitehelp({
  title = "Messages",
  section = "received",
  showAddNew = true,
}: InvitehelpProps) {
  const location = useLocation();
  const navResetToken = (location.state as NavResetLocationState | null)?.navReset;
  const [inviteHelps, setInviteHelps] = useState<InviteHelp[]>([]);
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);

  const [audioUrls, setAudioUrls] = useState<Record<string, string | null>>({});
  const [audioLoading, setAudioLoading] = useState<Record<string, boolean>>({});
  const [audioError, setAudioError] = useState<Record<string, string | null>>({});

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [showSearchCard, setShowSearchCard] = useState(false);
  const searchFields = section === "sent" ? SENT_SEARCH_FIELDS : RECEIVED_SEARCH_FIELDS;
  const [searchDraft, setSearchDraft] = useState(() => emptyAdminSearchValues(RECEIVED_SEARCH_FIELDS));
  const [searchFilters, setSearchFilters] = useState(() => emptyAdminSearchValues(RECEIVED_SEARCH_FIELDS));
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const [notifDate, setNotifDate] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifNote, setNotifNote] = useState("");
  const [attachImage, setAttachImage] = useState(false);
  const [notifImage, setNotifImage] = useState<File | null>(null);
  const [userType, setUserType] = useState<UserType>("carOwner");
  const [selectedUser, setSelectedUser] = useState("");

  const [viewingReceived, setViewingReceived] = useState<InviteHelp | null>(null);

  useEffect(() => {
    let ignore = false;
    if (section !== "received") return;
    setLoading(true);
    fetchInviteHelps()
      .then((lst) => {
        if (ignore) return;
        setInviteHelps(lst);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line
  }, [location.pathname, navResetToken, section]);

  const resetTableControls = () => {
    setPage(1);
    setSelected(new Set());
    setSearch("");
    const empty = emptyAdminSearchValues(searchFields);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setShowSearchCard(false);
  };

  const { viewMode, isDeletedView, toggleViewMode, deletedStash, stashDeleted, restoreStashed } =
    useAdminDeletedView<InviteHelp | SentNotification>({
      onToggle: resetTableControls,
      storageKey: "admin_deleted_view:invite-help",
    });

  const closeReceivedView = () => {
    setViewingReceived(null);
    setError("");
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setImagePreview(null);
        closeReceivedView();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (section !== "received") return;
    closeReceivedView();
    setShowForm(false);
    setShowSearchCard(false);
    setImagePreview(null);
    setError("");
  }, [location.pathname, navResetToken, section]);

  useEffect(() => {
    const empty = emptyAdminSearchValues(searchFields);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setShowSearchCard(false);
    setPage(1);
    setSelected(new Set());
    setSearch("");
  }, [section]);

  // Audio - Fetch on demand when needed
  const handleFetchAudio = useCallback(async (id: string) => {
    setAudioLoading((curr) => ({ ...curr, [id]: true }));
    setAudioError((curr) => ({ ...curr, [id]: null }));
    setAudioUrls((urls) => ({ ...urls, [id]: null }));
    try {
      const dataBlob = await fetchInviteHelpAudioBlob(id);
      if (
        dataBlob &&
        Array.isArray(dataBlob.data) &&
        typeof dataBlob.type === "string"
      ) {
        const url = arrayBufferToBlobUrl(dataBlob.data, dataBlob.type);
        setAudioUrls((curr) => ({ ...curr, [id]: url }));
      } else {
        setAudioError((curr) => ({
          ...curr,
          [id]: "No audio available",
        }));
      }
    } catch (e: any) {
      setAudioError((curr) => ({
        ...curr,
        [id]: "Audio fetch failed",
      }));
    } finally {
      setAudioLoading((curr) => ({ ...curr, [id]: false }));
    }
  }, []);

  function hasAudio(inv: InviteHelp): boolean {
    // Handle node Buffer blob (type: "Buffer"), or standard object with data array
    return Boolean(inv.audioUrl || (inv.audioBlob && Array.isArray((inv.audioBlob as any).data) && (inv.audioBlob as any).data.length > 0));
  }

  const filteredReceived = (isDeletedView
    ? deletedStash.filter((item): item is InviteHelp => !isSentNotification(item))
    : inviteHelps
  ).filter((inv) => {
    const q = search.toLowerCase();
    const live =
      !q ||
      receivedDate(inv).toLowerCase().includes(q) ||
      receivedTicketNo(inv).toLowerCase().includes(q) ||
      userTypeLabel(receivedUserType(inv)).toLowerCase().includes(q) ||
      receivedUserName(inv).toLowerCase().includes(q);
    if (!live) return false;
    return (
      searchIncludes(receivedDate(inv), searchFilters.date) &&
      searchEquals(receivedUserType(inv), searchFilters.userType) &&
      searchIncludes(receivedUserName(inv), searchFilters.user) &&
      searchIncludes(receivedTicketNo(inv), searchFilters.ticketNo ?? "") &&
      (
        !searchFilters.status ||
        (searchFilters.status === inv.status)
      )
    );
  });

  const filteredSent = (isDeletedView
    ? deletedStash.filter(isSentNotification)
    : sentNotifications
  ).filter((n) => {
    const q = search.toLowerCase();
    const live =
      !q ||
      n.date.toLowerCase().includes(q) ||
      n.title.toLowerCase().includes(q) ||
      n.note.toLowerCase().includes(q) ||
      userTypeLabel(n.userType).toLowerCase().includes(q) ||
      userScopeLabel(n).toLowerCase().includes(q);
    if (!live) return false;
    return (
      searchIncludes(n.date, searchFilters.date) &&
      searchIncludes(n.title, searchFilters.title) &&
      searchIncludes(n.note, searchFilters.note) &&
      searchEquals(n.userType, searchFilters.userType) &&
      searchIncludes(userScopeLabel(n), searchFilters.user)
    );
  });

  const filtered = section === "sent" ? filteredSent : filteredReceived;
  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
  const paged = filtered.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((n) => n._id)));
  };

  const handleToolbarPrint = () => {
    if (section === "sent") {
      printAdminTable({
        title: isDeletedView ? "Deleted Sent Notifications" : "Sent Notifications",
        headers: ["Date", "Title", "Note", "User Type", "User", "Attachment"],
        rows: filteredSent.map((notification) => [
            notification.date,
            notification.title,
            notification.note,
            userTypeLabel(notification.userType),
            userScopeLabel(notification),
            notification.imageUrl ? "Yes" : "—",
          ]),
      });
      return;
    }

    printAdminTable({
      title: isDeletedView ? "Deleted Messages Received" : "Messages Received",
      headers: ["Date", "Ticket No.", "User Type", "User Name", "Audio", "Status", "Attachment"],
      rows: filteredReceived.map((invite) => [
          receivedDate(invite),
          receivedTicketNo(invite),
          userTypeLabel(receivedUserType(invite)),
          receivedUserName(invite),
          hasAudio(invite) ? "Yes" : "No",
          invite.status ? invite.status.charAt(0).toUpperCase() + invite.status.slice(1) : "—",
          receivedImageUrl(invite) ? "Yes" : "—",
        ]),
    });
  };

  const handleDeleteSelected = () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected item(s)?`)) return;
    if (section === "sent") {
      const toDelete = sentNotifications.filter((n) => selected.has(n._id));
      stashDeleted(toDelete);
      setSentNotifications((prev) => prev.filter((n) => !selected.has(n._id)));
    } else {
      const toDelete = inviteHelps.filter((n) => selected.has(n._id));
      stashDeleted(toDelete);
      setInviteHelps((prev) => prev.filter((n) => !selected.has(n._id)));
    }
    setSelected(new Set());
    adminNotify.success("Deleted.");
  };

  const handleRestore = () => {
    if (selected.size === 0) return;
    const toRestore = deletedStash.filter((item) => selected.has(item._id));
    if (toRestore.length === 0) return;
    if (!window.confirm(`Restore ${toRestore.length} item(s)?`)) return;
    const sent = toRestore.filter(isSentNotification);
    const received = toRestore.filter((item): item is InviteHelp => !isSentNotification(item));
    if (sent.length) {
      setSentNotifications((prev) => [...sent, ...prev.filter((n) => !selected.has(n._id))]);
    }
    if (received.length) {
      setInviteHelps((prev) => [...received, ...prev.filter((n) => !selected.has(n._id))]);
    }
    restoreStashed((item) => selected.has(item._id));
    setSelected(new Set());
    adminNotify.success("Restored.");
  };

  const openReceivedView = (inv: InviteHelp) => {
    setShowForm(false);
    setShowSearchCard(false);
    resetForm();
    setViewingReceived(inv);
    setError("");
  };

  const resetForm = () => {
    setNotifDate("");
    setNotifTitle("");
    setNotifNote("");
    setAttachImage(false);
    setNotifImage(null);
    setUserType("carOwner");
    setSelectedUser("");
  };

  const openSearchCard = () => {
    setShowForm(false);
    closeReceivedView();
    setSearchDraft({ ...searchFilters });
    setShowSearchCard((open) => !open);
  };

  const handleSearchCardSearch = () => {
    setSearchFilters({ ...searchDraft });
    setPage(1);
    setSelected(new Set());
  };

  const handleSearchCardReset = () => {
    const empty = emptyAdminSearchValues(searchFields);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setPage(1);
    setSelected(new Set());
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = () => {
    if (section === "sent") {
      if (!notifDate.trim() || !notifTitle.trim() || !notifNote.trim()) {
        const msg = "Date, title, and note are required.";
        setError(msg);
        adminNotify.error(msg);
        return;
      }
      setError("");
      const userScope: UserScope = selectedUser ? "particular" : "all";
      const entry: SentNotification = {
        _id: `sent-${Date.now()}`,
        date: notifDate.trim(),
        title: notifTitle.trim(),
        note: notifNote.trim(),
        imageUrl: attachImage && notifImage ? URL.createObjectURL(notifImage) : null,
        userType,
        userScope,
        particularUsers: selectedUser ? [selectedUser] : null,
      };
      setSentNotifications((prev) => [entry, ...prev]);
      adminNotify.success("Notification created.");
    }
    resetForm();
    setShowForm(false);
  };

  const handleStatusChange = async (id: string, status: "resolved" | "unresolved") => {
    setLoading(true);
    setError("");
    try {
      const updated = await updateInviteHelpStatus(id, status);
      setInviteHelps((prev) =>
        prev.map((item) => (item._id === id ? { ...item, ...updated } : item))
      );
      if (viewingReceived && viewingReceived._id === id) setViewingReceived({ ...viewingReceived, ...updated });
      adminNotify.success("Status updated.");
    } catch (e: any) {
      setError(e?.message || "Failed to update status.");
      adminNotify.error(e?.message || "Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  const addFormPanel = showForm && section === "sent" ? (
    <CompactFormPanel
      footer={
        <CompactFormFooter
          message="You are creating a 'Notification'"
          messageCenter
          onSave={handleSave}
          onCancel={handleCancel}
        />
      }
    >
      <>
        <CompactFormRow className="w-full items-start">
          <CompactField label="Date" required className={compactFixedFieldWidth}>
            <input
              type="date"
              value={notifDate}
              onChange={(e) => setNotifDate(e.target.value)}
              className={compactInputClass}
            />
          </CompactField>
          <CompactField label="User Type" required className={compactFixedFieldWidth}>
            <select
              value={userType}
              onChange={(e) => {
                const next = e.target.value as UserType;
                setUserType(next);
                setSelectedUser("");
              }}
              className={compactInputClass}
            >
              {USER_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </CompactField>
          <CompactField label="User" className={compactFixedFieldWidth}>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className={compactInputClass}
            >
              <option value="">All</option>
              {particularUsersForType(userType).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </CompactField>
          <CompactField label="Title" required className={compactFixedFieldWidth}>
            <input
              type="text"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              className={compactInputClass}
            />
          </CompactField>
          <CompactField label="Note" required className="min-w-0 flex-1">
            <CompactAutoGrowTextarea
              value={notifNote}
              onChange={(e) => setNotifNote(e.target.value)}
            />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow className="items-start justify-start">
          <AttachImageCheckbox
            checked={attachImage}
            onCheckedChange={setAttachImage}
            file={notifImage}
            onFileChange={setNotifImage}
          />
        </CompactFormRow>
      </>
    </CompactFormPanel>
  ) : undefined;

  const receivedViewPanel =
    section === "received" && viewingReceived ? (
      <CompactFormPanel
        footer={
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-ad-form-border bg-ad-form-required-bg px-3 py-2.5">
            <div />
            <span className="text-center text-xs font-serif italic text-gray-800">
              You are viewing a &apos;Received Notification&apos;
            </span>
            <div className="flex justify-end gap-2">
              {viewingReceived?.status && (
                <button
                  type="button"
                  className={`rounded px-4 py-1 text-sm font-medium ${
                    viewingReceived.status === "resolved"
                      ? "border border-green-700 bg-green-50 text-green-700 hover:bg-green-100"
                      : "border border-gray-600 bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                  disabled={loading}
                  onClick={() =>
                    handleStatusChange(
                      viewingReceived._id,
                      viewingReceived.status === "resolved" ? "unresolved" : "resolved"
                    )
                  }
                >
                  Mark as {viewingReceived.status === "resolved" ? "Unresolved" : "Resolved"}
                </button>
              )}
              <button
                type="button"
                onClick={closeReceivedView}
                className="rounded border border-gray-400 bg-white px-4 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        }
      >
        <CompactFormRow className="w-full items-start">
          <CompactField label="Date">
            <div className={compactReadOnlyValueClass}>{receivedDate(viewingReceived)}</div>
          </CompactField>
          <CompactField label="Ticket No.">
            <div className={compactReadOnlyValueClass}>{receivedTicketNo(viewingReceived)}</div>
          </CompactField>
          <CompactField label="User Type">
            <div className={compactReadOnlyValueClass}>{userTypeLabel(receivedUserType(viewingReceived))}</div>
          </CompactField>
          <CompactField label="User Name">
            <div className={compactReadOnlyValueClass}>{receivedUserName(viewingReceived)}</div>
          </CompactField>
          <CompactField label="Status">
            <div className={compactReadOnlyValueClass}>
              {viewingReceived.status ? viewingReceived.status.charAt(0).toUpperCase() + viewingReceived.status.slice(1) : "—"}
            </div>
          </CompactField>
          <CompactField label="Audio">
            {/* Display: icon -> spinner -> error/text -> playback */}
            {(() => {
              const id = viewingReceived._id;
              if (viewingReceived.audioUrl) {
                return (
                  <audio controls src={viewingReceived.audioUrl} className="h-[30px] w-full accent-blue-600" />
                );
              }
              // Handle Buffer type in audioBlob (Node <Buffer> or { type:..., data:... })
              if (
                viewingReceived.audioBlob &&
                Array.isArray((viewingReceived.audioBlob as any).data) &&
                (viewingReceived.audioBlob as any).data.length > 0
              ) {
                const buffer = (viewingReceived.audioBlob as any).data;
                // try to use type from object, else default to audio/webm
                const bType =
                  typeof (viewingReceived.audioBlob as any).type === "string"
                    ? (viewingReceived.audioBlob as any).type
                    : "audio/webm";
                const url = arrayBufferToBlobUrl(buffer, bType);
                return (
                  <audio controls src={url} className="h-[30px] w-full accent-blue-600" />
                );
              }
              const isLoading = !!audioLoading[id];
              const url = audioUrls[id];
              const err = audioError[id];
              if (isLoading) {
                return (
                  <span className={compactReadOnlyValueClass + " flex gap-1 items-center text-gray-400"}>
                    <FiLoader className="animate-spin" /> Loading...
                  </span>
                );
              }
              if (url) {
                return (
                  <audio controls src={url} className="h-[30px] w-full accent-blue-600" />
                );
              }
              return (
                <>
                  <button
                    type="button"
                    onClick={() => handleFetchAudio(id)}
                    disabled={isLoading}
                    className={"inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border " +
                      (isLoading
                        ? "bg-gray-200 border-gray-300 text-gray-400 cursor-wait"
                        : err
                          ? "border-red-400 text-red-700 bg-red-100"
                          : "bg-white border-blue-400 text-blue-700 hover:bg-blue-50")}
                    aria-label="Fetch and play audio"
                  >
                    <FiVolume2 /> {err ? "Retry Audio" : "Play Audio"}
                  </button>
                  {err && <span className="ml-2 text-xs text-red-600">{err}</span>}
                </>
              );
            })()}
          </CompactField>
        </CompactFormRow>
        <CompactFormRow className="w-full items-start">
          <div className="flex min-w-0 basis-full flex-col items-start gap-1.5">
            <label className="inline-flex items-center gap-1.5 text-xs font-bold text-ad-green-dark">
              <input
                type="checkbox"
                checked={Boolean(receivedImageUrl(viewingReceived))}
                readOnly
                disabled
                className="h-3.5 w-3.5 accent-ad-green"
              />
              Attached Image
            </label>
            {receivedImageUrl(viewingReceived) ? (
              <button
                type="button"
                onClick={() =>
                  setImagePreview({
                    url: receivedImageUrl(viewingReceived)!,
                    title: `${viewingReceived.title || receivedTicketNo(viewingReceived)} — attached image`,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded border border-gray-400 bg-white px-3 py-0.5 text-xs font-medium text-ad-purple hover:bg-ad-purple/10"
              >
                <FiPaperclip size={16} aria-hidden />
                View Image
              </button>
            ) : null}
          </div>
        </CompactFormRow>
      </CompactFormPanel>
    ) : undefined;

  return (
    <AdminPage
      title={isDeletedView ? `Deleted ${title}` : title}
      noPanel
      headerAction={
        showAddNew && !showForm && !showSearchCard && !viewingReceived && !isDeletedView ? (
          <AddNewButton
            onClick={() => {
              setShowSearchCard(false);
              setShowForm(true);
            }}
          />
        ) : undefined
      }
      between={
        showSearchCard ? (
          <AdminSearchCard
            fields={searchFields}
            values={searchDraft}
            onChange={setSearchDraft}
            onSearch={handleSearchCardSearch}
            onReset={handleSearchCardReset}
            onClose={() => setShowSearchCard(false)}
          />
        ) : (
          receivedViewPanel ?? addFormPanel
        )
      }
    >
      {isDeletedView && (
        <AdminDeletedBanner
          count={
            section === "sent"
              ? deletedStash.filter(isSentNotification).length
              : deletedStash.filter((item) => !isSentNotification(item)).length
          }
          entityLabel={section === "sent" ? "sent notifications" : "messages"}
        />
      )}
      {error && (
        <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
          {error}
        </div>
      )}

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {!isDeletedView ? (
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={handleDeleteSelected}
              className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete
            </button>
          ) : (
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={handleRestore}
              className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Restore
            </button>
          )}
          <button
            type="button"
            onClick={handleToolbarPrint}
            className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark"
          >
            Print
          </button>
        </div>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Live Search here"
            className="border border-gray-400 bg-white px-2 py-1 text-xs"
          />
          <button
            type="button"
            onClick={openSearchCard}
            className={`px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 ${
              showSearchCard ? "bg-gray-700" : "bg-gray-500"
            }`}
          >
            Filters
          </button>
        </div>
      </div>

      <div className="mb-2 flex items-center gap-2 text-xs text-gray-700">
        <span>Show</span>
        <select
          value={entriesPerPage}
          onChange={(e) => {
            setEntriesPerPage(Number(e.target.value));
            setPage(1);
          }}
          className="border border-gray-400 px-1 py-0.5"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span>entries</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-ad-purple text-white">
              <th className="border border-ad-purple-dark px-2 py-2 text-center">
                <input
                  type="checkbox"
                  checked={paged.length > 0 && selected.size === paged.length}
                  onChange={toggleSelectAll}
                  className="accent-white"
                />
              </th>
              {section === "sent" ? (
                <>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Date</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Title</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Note</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">User Type</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">User</th>
                </>
              ) : (
                <>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Date</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Ticket No.</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">User Type</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">User Name</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Audio</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Status</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={section === "sent" ? 7 : 7} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={section === "sent" ? 7 : 7} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  {isDeletedView
                    ? section === "sent"
                      ? "No deleted sent notifications found."
                      : "No deleted received notifications found."
                    : section === "sent"
                      ? "No sent notifications found."
                      : "No received notifications found."}
                </td>
              </tr>
            ) : section === "sent" ? (
              paged.map((row, idx) => {
                const notification = row as SentNotification;
                return (
                  <tr key={notification._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(notification._id)}
                        onChange={() => toggleSelect(notification._id)}
                        className="accent-ad-purple"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">{notification.date}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">{notification.title}</td>
                    <td className="border border-gray-300 px-3 py-2 text-left align-top whitespace-normal break-words min-w-[240px]">
                      {notification.note}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">{userTypeLabel(notification.userType)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">{userScopeLabel(notification)}</td>
                  </tr>
                );
              })
            ) : (
              paged.map((row, idx) => {
                const invite = row as InviteHelp;
                // const imageUrl = receivedImageUrl(invite);
                const id = invite._id;
                // Buffer/Node: also handle backward compatible shape for audioBlob
                const isLoading = !!audioLoading[id];
                const url =
                  invite.audioUrl ||
                  (invite.audioBlob &&
                  Array.isArray((invite.audioBlob as any).data) &&
                  (invite.audioBlob as any).data.length > 0
                    ? arrayBufferToBlobUrl(
                        (invite.audioBlob as any).data,
                        typeof (invite.audioBlob as any).type === "string"
                          ? (invite.audioBlob as any).type
                          : "audio/webm",
                      )
                    : audioUrls[id] || null
                  );
                const err = audioError[id];

                return (
                  <tr key={invite._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(invite._id)}
                        onChange={() => toggleSelect(invite._id)}
                        className="accent-ad-purple"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => openReceivedView(invite)}
                        className="text-blue-700 hover:underline"
                      >
                        {receivedDate(invite)}
                      </button>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">{receivedTicketNo(invite)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {userTypeLabel(receivedUserType(invite))}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <span className="text-blue-700">{receivedUserName(invite)}</span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {url ? (
                        <audio controls src={url} className="h-8 w-44 accent-blue-600" />
                      ) : isLoading ? (
                        <span className="text-gray-400 flex items-center gap-1 justify-center"><FiLoader className="animate-spin" /> Loading...</span>
                      ) : (
                        <span className="inline-flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => handleFetchAudio(id)}
                            className={"inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border " +
                              (isLoading
                                ? "bg-gray-200 border-gray-300 text-gray-400 cursor-wait"
                                : err
                                  ? "border-red-400 text-red-700 bg-red-100"
                                  : "bg-white border-blue-400 text-blue-700 hover:bg-blue-50")}
                            aria-label="Fetch and play audio"
                          >
                            <FiVolume2 /> {err ? "Retry" : "Play"}
                          </button>
                          {err && <span className="text-xs text-red-600">{err}</span>}
                        </span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {invite.status ? (
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${invite.status === "resolved"
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                          }`}
                        >
                          {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <TableEntriesSummary total={filtered.length} page={page} pageSize={entriesPerPage} />
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`h-7 w-7 border text-xs font-medium ${
                page === p
                  ? "border-ad-green bg-ad-green text-white"
                  : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <AdminDeletedToggle
          viewMode={viewMode}
          onToggle={toggleViewMode}
          activeLabel="Active Messages"
        />
      </div>

      {imagePreview && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setImagePreview(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[min(90vw,480px)] rounded border border-gray-300 bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-700 text-sm text-white hover:bg-gray-900"
              aria-label="Close"
            >
              ×
            </button>
            <p className="mb-3 text-center text-sm font-semibold text-ad-green-dark">{imagePreview.title}</p>
            <img
              src={imagePreview.url}
              alt={imagePreview.title}
              className="mx-auto max-h-[70vh] max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </AdminPage>
  );
}
