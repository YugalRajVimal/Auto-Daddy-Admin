import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import { EyeIcon } from "../../../icons";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import {
  CompactAutoGrowTextarea,
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
} from "../../../components/admin/ContentPanel";

interface InviteHelp {
  _id: string;
  message?: string;
  audioBlob?: { data: number[]; type: string };
  createdAt?: string;
  userId?: {
    name?: string;
    email?: string;
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
  particularUser?: string | null;
}

type MessagesSection = "sent" | "received";

type InvitehelpProps = {
  title?: string;
  section?: MessagesSection;
  showAddNew?: boolean;
};

const USER_TYPE_OPTIONS: { value: UserType; label: string }[] = [
  { value: "carOwner", label: "Car Owner" },
  { value: "shopOwner", label: "Shop Owner" },
];

const USER_SCOPE_OPTIONS: { value: UserScope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "particular", label: "Particular" },
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
  { _id: "sent-2", date: "2026-06-17", title: "New Dealer Partner Alert", note: "A new dealer partner is now available in your area.", imageUrl: notifImageUrl(2), userType: "carOwner", userScope: "particular", particularUser: "John Smith" },
  { _id: "sent-3", date: "2026-06-16", title: "Platform Maintenance", note: "Scheduled maintenance tonight from 11 PM to 1 AM EST.", imageUrl: null, userType: "shopOwner", userScope: "all" },
  { _id: "sent-4", date: "2026-06-15", title: "Invoice Upload Reminder", note: "Please upload pending invoices for May billing cycle.", imageUrl: notifImageUrl(4), userType: "shopOwner", userScope: "particular", particularUser: "Northside Auto" },
  { _id: "sent-5", date: "2026-06-14", title: "Winter Tire Promo", note: "Early-bird discount on winter tire packages — limited slots.", imageUrl: notifImageUrl(5), userType: "carOwner", userScope: "all" },
  { _id: "sent-6", date: "2026-06-13", title: "Profile Completion", note: "Complete your shop profile to appear in local search results.", imageUrl: notifImageUrl(6), userType: "shopOwner", userScope: "particular", particularUser: "Premium Auto Care" },
  { _id: "sent-7", date: "2026-06-12", title: "Referral Bonus Live", note: "Earn credits when you refer a friend to AutoDaddy.", imageUrl: notifImageUrl(7), userType: "carOwner", userScope: "particular", particularUser: "Maria Garcia" },
  { _id: "sent-8", date: "2026-06-11", title: "Lead Assignment Update", note: "New leads are now routed based on your service categories.", imageUrl: null, userType: "shopOwner", userScope: "all" },
  { _id: "sent-9", date: "2026-06-10", title: "Payment Received", note: "Your wallet payment for job card #4821 has been processed.", imageUrl: notifImageUrl(9), userType: "carOwner", userScope: "particular", particularUser: "David Chen" },
  { _id: "sent-10", date: "2026-06-09", title: "Ad Campaign Tips", note: "Boost visibility with these best practices for dealer ads.", imageUrl: notifImageUrl(10), userType: "shopOwner", userScope: "particular", particularUser: "Kim Auto Shop" },
  { _id: "sent-11", date: "2026-06-08", title: "App Update Available", note: "Version 2.4 includes faster booking and push notification fixes.", imageUrl: notifImageUrl(11), userType: "carOwner", userScope: "all" },
  { _id: "sent-12", date: "2026-06-07", title: "Holiday Hours", note: "Support hours will be reduced on the upcoming public holiday.", imageUrl: null, userType: "shopOwner", userScope: "particular", particularUser: "City Tire & Brake" },
];

function userTypeLabel(userType: UserType) {
  return USER_TYPE_OPTIONS.find((o) => o.value === userType)?.label ?? userType;
}

function userScopeLabel(notification: SentNotification) {
  if (notification.userScope === "all") return "All";
  return notification.particularUser || "Particular";
}

function particularUsersForType(userType: UserType) {
  return userType === "carOwner" ? CAR_OWNER_USERS : SHOP_OWNER_USERS;
}

function arrayBufferToBlobUrl(buffer: number[], mimeType = "audio/webm") {
  const arr = new Uint8Array(buffer);
  const blob = new Blob([arr], { type: mimeType });
  return URL.createObjectURL(blob);
}

export default function Invitehelp({
  title = "Messages",
  section = "received",
  showAddNew = true,
}: InvitehelpProps) {
  const [inviteHelps, setInviteHelps] = useState<InviteHelp[]>([]);
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>(DUMMY_SENT_NOTIFICATIONS);
  const [loading, setLoading] = useState(section !== "sent");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const [notifDate, setNotifDate] = useState("2026-06-18");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifNote, setNotifNote] = useState("");
  const [attachImage, setAttachImage] = useState(false);
  const [notifImage, setNotifImage] = useState<File | null>(null);
  const [userType, setUserType] = useState<UserType>("carOwner");
  const [userScope, setUserScope] = useState<UserScope>("all");
  const [particularUser, setParticularUser] = useState("");

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [receivedMessage, setReceivedMessage] = useState("");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setImagePreview(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (section === "sent") {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/invite-help`);
        if (res.data?.success) {
          setInviteHelps(res.data.data || []);
        } else {
          setError("Failed to fetch invite help requests.");
        }
      } catch {
        setError("Failed to fetch invite help requests.");
      }
      setLoading(false);
    };
    fetchData();
  }, [section]);

  const filteredReceived = inviteHelps.filter((inv) => {
    const q = search.toLowerCase();
    return (
      (inv.userId?.name || "").toLowerCase().includes(q) ||
      (inv.userId?.email || "").toLowerCase().includes(q) ||
      (inv.userId?.businessProfile?.businessName || "").toLowerCase().includes(q) ||
      (inv.userId?.businessProfile?.businessEmail || "").toLowerCase().includes(q) ||
      (inv.message || "").toLowerCase().includes(q)
    );
  });

  const filteredSent = sentNotifications.filter((n) => {
    const q = search.toLowerCase();
    return (
      n.date.toLowerCase().includes(q) ||
      n.title.toLowerCase().includes(q) ||
      n.note.toLowerCase().includes(q) ||
      userTypeLabel(n.userType).toLowerCase().includes(q) ||
      userScopeLabel(n).toLowerCase().includes(q)
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

  const resetForm = () => {
    setNotifDate("2026-06-18");
    setNotifTitle("");
    setNotifNote("");
    setAttachImage(false);
    setNotifImage(null);
    setUserType("carOwner");
    setUserScope("all");
    setParticularUser("");
    if (imageInputRef.current) imageInputRef.current.value = "";
    setUserName("");
    setUserEmail("");
    setBusinessName("");
    setBusinessEmail("");
    setReceivedMessage("");
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = () => {
    if (section === "sent") {
      if (!notifDate.trim() || !notifTitle.trim() || !notifNote.trim()) {
        setError("Date, title, and note are required.");
        return;
      }
      if (userScope === "particular" && !particularUser.trim()) {
        setError("Please select a user when sending to a particular user.");
        return;
      }
      setError("");
      const entry: SentNotification = {
        _id: `sent-${Date.now()}`,
        date: notifDate.trim(),
        title: notifTitle.trim(),
        note: notifNote.trim(),
        imageUrl: attachImage && notifImage ? URL.createObjectURL(notifImage) : null,
        userType,
        userScope,
        particularUser: userScope === "particular" ? particularUser.trim() : null,
      };
      setSentNotifications((prev) => [entry, ...prev]);
    } else {
      if (!userName.trim() || !receivedMessage.trim()) {
        setError("User name and message are required.");
        return;
      }
      setError("");
      const entry: InviteHelp = {
        _id: `received-${Date.now()}`,
        message: receivedMessage.trim(),
        createdAt: new Date().toISOString(),
        userId: {
          name: userName.trim(),
          email: userEmail.trim() || undefined,
          businessProfile: {
            businessName: businessName.trim() || undefined,
            businessEmail: businessEmail.trim() || undefined,
          },
        },
      };
      setInviteHelps((prev) => [entry, ...prev]);
    }
    resetForm();
    setShowForm(false);
  };

  const addFormPanel = showForm ? (
    <CompactFormPanel
      footer={
        <CompactFormFooter
          message={
            section === "sent"
              ? "You are creating a 'Notification'"
              : "You are creating a 'Received Notification'"
          }
          messageCenter
          onSave={handleSave}
          onCancel={handleCancel}
        />
      }
    >
      {section === "sent" ? (
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
                  setParticularUser("");
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
            <CompactField label="User" required className={compactFixedFieldWidth}>
              <select
                value={userScope}
                onChange={(e) => {
                  const next = e.target.value as UserScope;
                  setUserScope(next);
                  if (next === "all") setParticularUser("");
                }}
                className={compactInputClass}
              >
                {USER_SCOPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </CompactField>
            {userScope === "particular" && (
              <CompactField label="Select User" required className={compactFixedFieldWidth}>
                <select
                  value={particularUser}
                  onChange={(e) => setParticularUser(e.target.value)}
                  className={compactInputClass}
                >
                  <option value="">-</option>
                  {particularUsersForType(userType).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </CompactField>
            )}
            <CompactField label="Title" required className="min-w-0 flex-1">
              <input
                type="text"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                className={compactInputClass}
              />
            </CompactField>
          </CompactFormRow>
          <CompactFormRow className="w-full items-start">
            <CompactField label="Note" required className="min-w-0 flex-1">
              <CompactAutoGrowTextarea
                value={notifNote}
                onChange={(e) => setNotifNote(e.target.value)}
              />
            </CompactField>
          </CompactFormRow>
          <CompactFormRow className="items-start justify-start">
            <div className="flex flex-col items-start gap-1.5">
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
                <input
                  type="checkbox"
                  checked={attachImage}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAttachImage(checked);
                    if (!checked) {
                      setNotifImage(null);
                      if (imageInputRef.current) imageInputRef.current.value = "";
                    }
                  }}
                  className="h-3.5 w-3.5 accent-ad-green"
                />
                Attach Image
              </label>
              {attachImage ? (
                <label className="inline-block cursor-pointer rounded border border-gray-400 bg-gray-200 px-3 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-300">
                  {notifImage?.name || "Upload File"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNotifImage(e.target.files?.[0] ?? null)}
                    ref={imageInputRef}
                    className="hidden"
                  />
                </label>
              ) : null}
            </div>
          </CompactFormRow>
        </>
      ) : (
        <>
          <CompactFormRow className="w-full items-start">
            <CompactField label="User Name" required className={compactFixedFieldWidth}>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className={compactInputClass}
              />
            </CompactField>
            <CompactField label="User Email" className={compactFixedFieldWidth}>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className={compactInputClass}
              />
            </CompactField>
            <CompactField label="Business Name" className={compactFixedFieldWidth}>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={compactInputClass}
              />
            </CompactField>
            <CompactField label="Business Email" className={compactFixedFieldWidth}>
              <input
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                className={compactInputClass}
              />
            </CompactField>
          </CompactFormRow>
          <CompactFormRow className="w-full items-start">
            <CompactField label="Message" required className="min-w-0 flex-1">
              <CompactAutoGrowTextarea
                value={receivedMessage}
                onChange={(e) => setReceivedMessage(e.target.value)}
              />
            </CompactField>
          </CompactFormRow>
        </>
      )}
    </CompactFormPanel>
  ) : undefined;

  return (
    <AdminPage
      title={title}
      noPanel
      headerAction={showAddNew && !showForm ? <AddNewButton onClick={() => setShowForm(true)} /> : undefined}
      between={addFormPanel}
    >
      {error && (
        <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
          {error}
        </div>
      )}

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
            Update
          </button>
          <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
            Shoot
          </button>
          <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
            Delete
          </button>
          <button type="button" className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark">
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
          <button type="button" className="bg-gray-500 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600">
            Search
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
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-ad-purple text-white">
              <th className="border border-ad-purple-dark px-2 py-2 text-left">
                <input
                  type="checkbox"
                  checked={paged.length > 0 && selected.size === paged.length}
                  onChange={toggleSelectAll}
                  className="accent-white"
                />
              </th>
              {section === "sent" ? (
                <>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Date</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Title</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Note</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">View Image</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">User Type</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">User</th>
                </>
              ) : (
                <>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">User Name</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">User Email</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Business Name</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Business Email</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Message</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Audio</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Created At</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={section === "sent" ? 7 : 8} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={section === "sent" ? 7 : 8} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  {section === "sent" ? "No sent notifications found." : "No invite help requests found."}
                </td>
              </tr>
            ) : section === "sent" ? (
              paged.map((row, idx) => {
                const notification = row as SentNotification;
                return (
                  <tr key={notification._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                    <td className="border border-gray-300 px-2 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(notification._id)}
                        onChange={() => toggleSelect(notification._id)}
                        className="accent-ad-purple"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{notification.date}</td>
                    <td className="border border-gray-300 px-3 py-2">{notification.title}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <span className="line-clamp-2 block max-w-[200px]" title={notification.note}>
                        {notification.note}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {notification.imageUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            setImagePreview({
                              url: notification.imageUrl!,
                              title: `${notification.title} — notification image`,
                            })
                          }
                          className="inline-flex items-center justify-center rounded p-1 text-ad-purple hover:bg-ad-purple/10 hover:text-ad-purple-dark"
                          aria-label={`View image for ${notification.title}`}
                          title="View image"
                        >
                          <EyeIcon className="size-5 fill-current" />
                        </button>
                      ) : (
                        <span className="text-gray-500">--</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{userTypeLabel(notification.userType)}</td>
                    <td className="border border-gray-300 px-3 py-2">{userScopeLabel(notification)}</td>
                  </tr>
                );
              })
            ) : (
              paged.map((row, idx) => {
                const invite = row as InviteHelp;
                let audioUrl: string | null = null;
                if (
                  invite.audioBlob?.data &&
                  Array.isArray(invite.audioBlob.data) &&
                  invite.audioBlob.type === "Buffer"
                ) {
                  audioUrl = arrayBufferToBlobUrl(invite.audioBlob.data);
                }

                return (
                  <tr key={invite._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                    <td className="border border-gray-300 px-2 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(invite._id)}
                        onChange={() => toggleSelect(invite._id)}
                        className="accent-ad-purple"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <span className="text-blue-700">{invite.userId?.name || "N/A"}</span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{invite.userId?.email || "N/A"}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      {invite.userId?.businessProfile?.businessName || "N/A"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {invite.userId?.businessProfile?.businessEmail || "N/A"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {invite.message ? (
                        <span className="line-clamp-2 block max-w-[200px]" title={invite.message}>
                          {invite.message}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {audioUrl ? (
                        <audio controls src={audioUrl} className="h-8 w-44 accent-blue-600" />
                      ) : (
                        <span className="text-xs italic text-gray-400">No audio</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {invite.createdAt ? new Date(invite.createdAt).toLocaleString() : "N/A"}
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
        <Link to="#" className="text-sm text-blue-700 hover:underline">
          Deleted
        </Link>
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
