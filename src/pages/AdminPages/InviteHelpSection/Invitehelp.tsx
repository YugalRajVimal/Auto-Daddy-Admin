import { useEffect, useState } from "react";
import { Link } from "react-router";
import axios from "axios";
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

interface SentNotification {
  _id: string;
  title?: string;
  message?: string;
  userType?: string;
  recipientCount?: number;
  createdAt?: string;
}

type MessagesSection = "sent" | "received";

type InvitehelpProps = {
  title?: string;
  section?: MessagesSection;
  showAddNew?: boolean;
};

const USER_TYPE_OPTIONS = [
  { value: "carOwner", label: "Car Owner" },
  { value: "autoshopowner", label: "Auto Shop Owner" },
  { value: "dealer", label: "Dealer" },
];

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
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [userType, setUserType] = useState(USER_TYPE_OPTIONS[0].value);

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [receivedMessage, setReceivedMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        if (section === "received") {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/invite-help`);
          if (res.data?.success) {
            setInviteHelps(res.data.data || []);
          } else {
            setError("Failed to fetch invite help requests.");
          }
        } else {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/notification/sent`);
          if (res.data?.success) {
            setSentNotifications(res.data.data || []);
          } else {
            setSentNotifications([]);
          }
        }
      } catch {
        if (section === "received") {
          setError("Failed to fetch invite help requests.");
        } else {
          setSentNotifications([]);
        }
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
      (n.title || "").toLowerCase().includes(q) ||
      (n.message || "").toLowerCase().includes(q) ||
      (n.userType || "").toLowerCase().includes(q)
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
    setNotifTitle("");
    setNotifMessage("");
    setUserType(USER_TYPE_OPTIONS[0].value);
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
      if (!notifTitle.trim() || !notifMessage.trim()) {
        setError("Title and message are required.");
        return;
      }
      setError("");
      const entry: SentNotification = {
        _id: `sent-${Date.now()}`,
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        userType: USER_TYPE_OPTIONS.find((o) => o.value === userType)?.label ?? userType,
        recipientCount: 0,
        createdAt: new Date().toISOString(),
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
            <CompactField label="User Type" required className={compactFixedFieldWidth}>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className={compactInputClass}
              >
                {USER_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </CompactField>
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
            <CompactField label="Message" required className="min-w-0 flex-1">
              <CompactAutoGrowTextarea
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
              />
            </CompactField>
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
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Title</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Message</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">User Type</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Recipients</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Sent At</th>
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
                <td colSpan={section === "sent" ? 6 : 8} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={section === "sent" ? 6 : 8} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
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
                    <td className="border border-gray-300 px-3 py-2">{notification.title || "N/A"}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      {notification.message ? (
                        <span className="line-clamp-2 block max-w-[200px]" title={notification.message}>
                          {notification.message}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{notification.userType || "N/A"}</td>
                    <td className="border border-gray-300 px-3 py-2">{notification.recipientCount ?? "N/A"}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : "N/A"}
                    </td>
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
    </AdminPage>
  );
}
