import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { FiPaperclip } from "react-icons/fi";
import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
import AdminSearchCard, {
  emptyAdminSearchValues,
  searchEquals,
  searchIncludes,
  type AdminSearchField,
} from "../../../components/admin/AdminSearchCard";
import ClipImageHover from "../../../components/admin/ClipImageHover";
import {
  CompactAutoGrowTextarea,
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
  compactReadOnlyMultilineClass,
  compactReadOnlyValueClass,
} from "../../../components/admin/ContentPanel";
import { useAdminDeletedView } from "../../../hooks/useAdminDeletedView";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";

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
  { key: "title", label: "Title" },
  { key: "note", label: "Message" },
  { key: "userType", label: "User Type", type: "select", options: USER_TYPE_SEARCH_OPTIONS },
  { key: "user", label: "User" },
  { key: "ticketNo", label: "Ticket No." },
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
  audioBlob?: { data: number[]; type: string };
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

const notifImageUrl = (id: number) => `https://picsum.photos/seed/notif-${id}/480/320`;

const DUMMY_SENT_NOTIFICATIONS: SentNotification[] = [
  { _id: "sent-1", date: "2026-06-18", title: "Summer Service Reminder", note: "Book your seasonal oil change and tire rotation before July.", imageUrl: notifImageUrl(1), userType: "carOwner", userScope: "all" },
  { _id: "sent-2", date: "2026-06-17", title: "New Dealer Partner Alert", note: "A new dealer partner is now available in your area.", imageUrl: notifImageUrl(2), userType: "carOwner", userScope: "particular", particularUsers: ["John Smith"] },
  { _id: "sent-3", date: "2026-06-16", title: "Platform Maintenance", note: "Scheduled maintenance tonight from 11 PM to 1 AM EST.", imageUrl: null, userType: "shopOwner", userScope: "all" },
  { _id: "sent-4", date: "2026-06-15", title: "Invoice Upload Reminder", note: "Please upload pending invoices for May billing cycle.", imageUrl: notifImageUrl(4), userType: "shopOwner", userScope: "particular", particularUsers: ["Northside Auto"] },
  { _id: "sent-5", date: "2026-06-14", title: "Winter Tire Promo", note: "Early-bird discount on winter tire packages — limited slots.", imageUrl: notifImageUrl(5), userType: "carOwner", userScope: "all" },
  { _id: "sent-6", date: "2026-06-13", title: "Profile Completion", note: "Complete your shop profile to appear in local search results.", imageUrl: notifImageUrl(6), userType: "shopOwner", userScope: "particular", particularUsers: ["Premium Auto Care"] },
  { _id: "sent-7", date: "2026-06-12", title: "Referral Bonus Live", note: "Earn credits when you refer a friend to AutoDaddy.", imageUrl: notifImageUrl(7), userType: "carOwner", userScope: "particular", particularUsers: ["Maria Garcia"] },
  { _id: "sent-8", date: "2026-06-11", title: "Lead Assignment Update", note: "New leads are now routed based on your service categories.", imageUrl: null, userType: "shopOwner", userScope: "all" },
  { _id: "sent-9", date: "2026-06-10", title: "Payment Received", note: "Your wallet payment for job card #4821 has been processed.", imageUrl: notifImageUrl(9), userType: "carOwner", userScope: "particular", particularUsers: ["David Chen"] },
  { _id: "sent-10", date: "2026-06-09", title: "Ad Campaign Tips", note: "Boost visibility with these best practices for dealer ads.", imageUrl: notifImageUrl(10), userType: "shopOwner", userScope: "particular", particularUsers: ["Kim Auto Shop"] },
  { _id: "sent-11", date: "2026-06-08", title: "App Update Available", note: "Version 2.4 includes faster booking and push notification fixes.", imageUrl: notifImageUrl(11), userType: "carOwner", userScope: "all" },
  { _id: "sent-12", date: "2026-06-07", title: "Holiday Hours", note: "Support hours will be reduced on the upcoming public holiday.", imageUrl: null, userType: "shopOwner", userScope: "particular", particularUsers: ["City Tire & Brake"] },
];

const DUMMY_AUDIO_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3";

const DUMMY_RECEIVED_NOTIFICATIONS: InviteHelp[] = [
  {
    _id: "recv-1",
    date: "2026-06-18",
    ticketNo: "TK-240618",
    title: "Brake Noise Complaint",
    message: "Hearing a grinding sound when braking at low speeds. Can someone advise?",
    imageUrl: notifImageUrl(101),
    userType: "carOwner",
    status: "unresolved",
    audioUrl: DUMMY_AUDIO_URL,
    userId: { name: "John Smith", email: "john.smith@email.com" },
  },
  {
    _id: "recv-2",
    date: "2026-06-17",
    ticketNo: "TK-240617",
    title: "Invoice Dispute",
    message: "The last job card total does not match the invoice uploaded to wallet.",
    imageUrl: notifImageUrl(102),
    userType: "shopOwner",
    userId: { businessProfile: { businessName: "Northside Auto", businessEmail: "billing@northsideauto.com" } },
  },
  {
    _id: "recv-3",
    date: "2026-06-16",
    ticketNo: "TK-240616",
    title: "App Login Issue",
    message: "Unable to sign in after password reset — getting session expired error.",
    imageUrl: null,
    userType: "carOwner",
    status: "unresolved",
    audioUrl: DUMMY_AUDIO_URL,
    userId: { name: "Maria Garcia", email: "maria.g@email.com" },
  },
  {
    _id: "recv-4",
    date: "2026-06-15",
    ticketNo: "TK-240615",
    title: "Lead Not Received",
    message: "We did not receive the oil change lead assigned yesterday afternoon.",
    imageUrl: null,
    userType: "shopOwner",
    userId: { businessProfile: { businessName: "Premium Auto Care" } },
  },
  {
    _id: "recv-5",
    date: "2026-06-14",
    ticketNo: "TK-240614",
    title: "Referral Credit Missing",
    message: "Referred a friend last week but referral bonus has not appeared in wallet.",
    imageUrl: notifImageUrl(105),
    userType: "carOwner",
    userId: { name: "David Chen", email: "david.chen@email.com" },
  },
  {
    _id: "recv-6",
    date: "2026-06-13",
    ticketNo: "TK-240613",
    title: "Shop Profile Photo",
    message: "Uploaded new shop photos but they are still not showing on our listing.",
    imageUrl: notifImageUrl(106),
    userType: "shopOwner",
    audioUrl: DUMMY_AUDIO_URL,
    userId: { businessProfile: { businessName: "Kim Auto Shop" } },
  },
  {
    _id: "recv-7",
    date: "2026-06-12",
    ticketNo: "TK-240612",
    title: "Booking Cancellation",
    message: "Need to cancel tomorrow's appointment and rebook for next Monday.",
    imageUrl: null,
    userType: "carOwner",
    userId: { name: "Sarah Johnson", email: "sarah.j@email.com" },
  },
  {
    _id: "recv-8",
    date: "2026-06-11",
    ticketNo: "TK-240611",
    title: "Ad Performance Query",
    message: "Dealer ad impressions dropped sharply this week — please review campaign settings.",
    imageUrl: notifImageUrl(108),
    userType: "shopOwner",
    userId: { businessProfile: { businessName: "City Tire & Brake" } },
  },
  {
    _id: "recv-9",
    date: "2026-06-10",
    ticketNo: "TK-240610",
    title: "Payment Not Reflected",
    message: "Customer payment for job #4821 was processed but wallet balance unchanged.",
    imageUrl: notifImageUrl(109),
    userType: "carOwner",
    status: "unresolved",
    audioUrl: DUMMY_AUDIO_URL,
    userId: { name: "Michael Brown", email: "m.brown@email.com" },
  },
  {
    _id: "recv-10",
    date: "2026-06-09",
    ticketNo: "TK-240609",
    title: "Service Category Update",
    message: "Please add EV battery diagnostics to our shop service categories.",
    imageUrl: null,
    userType: "shopOwner",
    userId: { businessProfile: { businessName: "Lakeview Auto Repair" } },
  },
  {
    _id: "recv-11",
    date: "2026-06-08",
    ticketNo: "TK-240608",
    title: "Voice Message Follow-up",
    message: "Following up on my earlier voice note about the transmission slipping issue.",
    imageUrl: notifImageUrl(111),
    userType: "carOwner",
    status: "unresolved",
    audioUrl: DUMMY_AUDIO_URL,
    userId: { name: "Emily Wilson", email: "emily.w@email.com" },
  },
  {
    _id: "recv-12",
    date: "2026-06-07",
    ticketNo: "TK-240607",
    title: "Detailing Package Inquiry",
    message: "Looking for pricing on full interior and exterior detailing for fleet vehicles.",
    imageUrl: notifImageUrl(112),
    userType: "shopOwner",
    userId: { businessProfile: { businessName: "Eastside Detailing" } },
  },
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

function receivedAudioUrl(inv: InviteHelp) {
  if (inv.audioUrl) return inv.audioUrl;
  if (
    inv.audioBlob?.data &&
    Array.isArray(inv.audioBlob.data) &&
    inv.audioBlob.type === "Buffer"
  ) {
    return arrayBufferToBlobUrl(inv.audioBlob.data);
  }
  return null;
}

function isSentNotification(item: InviteHelp | SentNotification): item is SentNotification {
  return "userScope" in item && "note" in item;
}

export default function Invitehelp({
  title = "Messages",
  section = "received",
  showAddNew = true,
}: InvitehelpProps) {
  const location = useLocation();
  const navResetToken = (location.state as NavResetLocationState | null)?.navReset;
  const [inviteHelps, setInviteHelps] = useState<InviteHelp[]>(DUMMY_RECEIVED_NOTIFICATIONS);
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>(DUMMY_SENT_NOTIFICATIONS);
  const [loading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [showSearchCard, setShowSearchCard] = useState(false);
  const searchFields = section === "sent" ? SENT_SEARCH_FIELDS : RECEIVED_SEARCH_FIELDS;
  const [searchDraft, setSearchDraft] = useState(() => emptyAdminSearchValues(RECEIVED_SEARCH_FIELDS));
  const [searchFilters, setSearchFilters] = useState(() => emptyAdminSearchValues(RECEIVED_SEARCH_FIELDS));
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const [notifDate, setNotifDate] = useState("2026-06-18");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifNote, setNotifNote] = useState("");
  const [attachImage, setAttachImage] = useState(false);
  const [notifImage, setNotifImage] = useState<File | null>(null);
  const [userType, setUserType] = useState<UserType>("carOwner");
  const [selectedUser, setSelectedUser] = useState("");

  const [viewingReceived, setViewingReceived] = useState<InviteHelp | null>(null);

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
      receivedUserName(inv).toLowerCase().includes(q) ||
      (inv.title || "").toLowerCase().includes(q) ||
      (inv.message || "").toLowerCase().includes(q);
    if (!live) return false;
    return (
      searchIncludes(receivedDate(inv), searchFilters.date) &&
      searchIncludes(inv.title || "", searchFilters.title) &&
      searchIncludes(inv.message || "", searchFilters.note) &&
      searchEquals(receivedUserType(inv), searchFilters.userType) &&
      searchIncludes(receivedUserName(inv), searchFilters.user) &&
      searchIncludes(receivedTicketNo(inv), searchFilters.ticketNo ?? "")
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
      headers: ["Date", "Ticket No.", "User Type", "User Name", "Title", "Audio", "Message", "Attachment"],
      rows: filteredReceived.map((invite) => [
          receivedDate(invite),
          receivedTicketNo(invite),
          userTypeLabel(receivedUserType(invite)),
          receivedUserName(invite),
          invite.title || "—",
          receivedAudioUrl(invite) ? "Yes" : "No",
          invite.message || "—",
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
    setNotifDate("2026-06-18");
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
          <div className="flex justify-end">
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
        <CompactField label="Title">
          <div className={compactReadOnlyValueClass}>{viewingReceived.title || "—"}</div>
        </CompactField>
        <CompactField label="Audio">
          {receivedAudioUrl(viewingReceived) ? (
            <audio controls src={receivedAudioUrl(viewingReceived)!} className="h-[30px] w-full accent-blue-600" />
          ) : (
            <div className={`${compactReadOnlyValueClass} text-gray-500`}>No audio</div>
          )}
        </CompactField>
      </CompactFormRow>
      <CompactFormRow className="w-full items-start">
        <CompactField label="Message" className="min-w-0 basis-full">
          <div className={`${compactReadOnlyMultilineClass} whitespace-pre-wrap`}>
            {viewingReceived.message || "—"}
          </div>
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
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium" aria-label="Attachment"></th>
                </>
              ) : (
                <>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Date</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Ticket No.</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">User Type</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">User Name</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Title</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Audio</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Message</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium" aria-label="Attachment"></th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={section === "sent" ? 7 : 9} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={section === "sent" ? 7 : 9} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
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
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {notification.imageUrl ? (
                        <ClipImageHover
                          imageUrl={notification.imageUrl}
                          alt={`Attached image for ${notification.title}`}
                          iconClassName="text-blue-600"
                        />
                      ) : (
                        <span className="text-gray-500">--</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              paged.map((row, idx) => {
                const invite = row as InviteHelp;
                const imageUrl = receivedImageUrl(invite);
                const audioUrl = receivedAudioUrl(invite);

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
                    <td className="border border-gray-300 px-3 py-2 text-center">{invite.title || "—"}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {audioUrl ? (
                        <audio controls src={audioUrl} className="h-8 w-44 accent-blue-600" />
                      ) : (
                        <span className="text-xs italic text-gray-400">No audio</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-left align-top whitespace-normal break-words min-w-[240px]">
                      {invite.message || "—"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {imageUrl ? (
                        <ClipImageHover
                          imageUrl={imageUrl}
                          alt={`Attached image for ${invite.title || receivedTicketNo(invite)}`}
                          iconClassName="text-blue-600"
                        />
                      ) : (
                        <span className="text-gray-500">--</span>
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
