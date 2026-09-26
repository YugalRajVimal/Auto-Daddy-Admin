// FIX for TS1261: Ensure the filename casing and default export match "WebsiteMessages" in import/call sites
import { useCallback, useEffect, useState } from "react";
import AdminPage from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import AdminSearchCard, {
  emptyAdminSearchValues,
  type AdminSearchField,
} from "../../../components/admin/AdminSearchCard";
import { CompactFormFooter, CompactFormPanel } from "../../../components/admin/ContentPanel";
import { adminNotify } from "../../../utils/adminNotify";
import {
  CONTACT_MESSAGE_STATUS_OPTIONS,
  deleteContactMessage,
  fetchContactMessageById,
  fetchContactMessages,
  updateContactMessageStatus,
  type ContactMessageApiRow,
  type ContactMessageStatus,
} from "./ContactMessagesapi";

const SEARCH_FIELDS: AdminSearchField[] = [
  { key: "search", label: "Search (name, email, subject, message)" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: CONTACT_MESSAGE_STATUS_OPTIONS.map((s) => ({ value: s, label: s })),
  },
];

const STATUS_STYLES: Record<ContactMessageStatus, string> = {
  New: "bg-blue-100 text-blue-800 border border-blue-300",
  Read: "bg-gray-100 text-gray-700 border border-gray-300",
  Replied: "bg-green-100 text-green-800 border border-green-300",
  Archived: "bg-amber-100 text-amber-800 border border-amber-300",
};

function StatusBadge({ status }: { status: ContactMessageStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// NOTE: The default export name is 'WebsiteMessages' (casing matches what other files import!)
export default function WebsiteMessages() {
  const [rows, setRows] = useState<ContactMessageApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchDraft, setSearchDraft] = useState(() => emptyAdminSearchValues(SEARCH_FIELDS));
  const [searchFilters, setSearchFilters] = useState(() => emptyAdminSearchValues(SEARCH_FIELDS));
  const [viewing, setViewing] = useState<ContactMessageApiRow | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchContactMessages({
        page,
        limit: 25,
        status: (searchFilters.status as ContactMessageStatus) || undefined,
        search: (searchFilters.search as string) || undefined,
      });
      setRows(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch (err: any) {
      adminNotify.error(err.message || "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }, [page, searchFilters]);

  useEffect(() => {
    load();
  }, [load]);

  const openMessage = async (row: ContactMessageApiRow) => {
    try {
      const full = await fetchContactMessageById(row._id);
      setViewing(full);
      // The GET call already flipped New -> Read server-side; reflect that in the list.
      setRows((prev) => prev.map((r) => (r._id === full._id ? full : r)));
    } catch (err: any) {
      adminNotify.error(err.message || "Failed to open message.");
    }
  };

  const changeStatus = async (status: ContactMessageStatus) => {
    if (!viewing) return;
    setSavingStatus(true);
    try {
      const updated = await updateContactMessageStatus(viewing._id, status);
      setViewing(updated);
      setRows((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      adminNotify.success(`Marked as ${status}.`);
    } catch (err: any) {
      adminNotify.error(err.message || "Failed to update status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const removeMessage = async (row: ContactMessageApiRow) => {
    if (!window.confirm("Delete this message? This can't be undone.")) return;
    try {
      await deleteContactMessage(row._id);
      adminNotify.success("Message deleted.");
      if (viewing?._id === row._id) setViewing(null);
      load();
    } catch (err: any) {
      adminNotify.error(err.message || "Failed to delete message.");
    }
  };

  return (
    <AdminPage title="Website Messages">
      <AdminSearchCard
        fields={SEARCH_FIELDS}
        values={searchDraft}
        onChange={setSearchDraft}
        onSearch={() => {
          setPage(1);
          setSearchFilters(searchDraft);
        }}
        onReset={() => {
          const empty = emptyAdminSearchValues(SEARCH_FIELDS);
          setSearchDraft(empty);
          setSearchFilters(empty);
          setPage(1);
        }}
      />

      <TableEntriesSummary total={total} page={page} pageSize={25} />

      <div className="overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-ad-purple text-white ad-thead">
              <th className="w-[1%] whitespace-nowrap border border-ad-purple-dark px-2 py-2 text-left font-medium">Date</th>
              <th className="w-[1%] whitespace-nowrap border border-ad-purple-dark px-2 py-2 text-left font-medium">Name</th>
              <th className="w-[1%] whitespace-nowrap border border-ad-purple-dark px-2 py-2 text-left font-medium">Email</th>
              <th className="w-[1%] whitespace-nowrap border border-ad-purple-dark px-2 py-2 text-left font-medium">Subject</th>
              <th className="w-full border border-ad-purple-dark px-3 py-2 text-left font-medium">Message</th>
              <th className="w-[1%] whitespace-nowrap border border-ad-purple-dark px-2 py-2 text-left font-medium">Status</th>
              <th className="w-[1%] whitespace-nowrap border border-ad-purple-dark px-2 py-2 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="ad-td border border-gray-300 px-3 py-4 text-left text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="ad-td border border-gray-300 px-3 py-4 text-left text-gray-500">
                  No messages yet.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={row._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-left">{formatDate(row.createdAt)}</td>
                  <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-left">
                    <button type="button" onClick={() => openMessage(row)} className="text-blue-700 hover:underline">
                      {[row.firstName, row.lastName].filter(Boolean).join(" ") || "-"}
                    </button>
                  </td>
                  <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-left">{row.email}</td>
                  <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-left">{row.subject || "-"}</td>
                  <td className="ad-td border border-gray-300 px-3 py-2 text-left align-top whitespace-normal break-words">
                    {row.message.length > 140 ? `${row.message.slice(0, 140)}…` : row.message}
                  </td>
                  <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-left">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-left">
                    <button type="button" onClick={() => openMessage(row)} className="mr-3 text-blue-700 hover:underline">
                      View
                    </button>
                    <button type="button" onClick={() => removeMessage(row)} className="text-red-700 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {viewing && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setViewing(null)}
        >
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CompactFormPanel
              footer={
                <CompactFormFooter
                  actionLabel="Close"
                  onSave={() => setViewing(null)}
                  onCancel={() => setViewing(null)}
                />
              }
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-bold text-ad-green-dark">
                  {[viewing.firstName, viewing.lastName].filter(Boolean).join(" ")}
                </div>
                <StatusBadge status={viewing.status} />
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Email: </span>
                  <a href={`mailto:${viewing.email}`} className="text-blue-700 hover:underline">
                    {viewing.email}
                  </a>
                </div>
                {viewing.subject && (
                  <div>
                    <span className="font-semibold text-gray-700">Subject: </span>
                    {viewing.subject}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-gray-700">Received: </span>
                  {formatDate(viewing.createdAt)}
                </div>
                <div className="whitespace-pre-wrap rounded bg-gray-100 p-3 text-gray-800">{viewing.message}</div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-xs font-semibold text-gray-600">Mark as:</span>
                  {CONTACT_MESSAGE_STATUS_OPTIONS.filter((s) => s !== viewing.status).map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={savingStatus}
                      onClick={() => changeStatus(s)}
                      className="rounded border border-gray-300 px-2.5 py-1 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </CompactFormPanel>
          </div>
        </div>
      )}
    </AdminPage>
  );
}