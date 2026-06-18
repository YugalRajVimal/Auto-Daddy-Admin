import { useEffect, useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import AdminPage from "../../../components/admin/AdminPage";

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

function arrayBufferToBlobUrl(buffer: number[], mimeType = "audio/webm") {
  const arr = new Uint8Array(buffer);
  const blob = new Blob([arr], { type: mimeType });
  return URL.createObjectURL(blob);
}

export default function Invitehelp() {
  const [inviteHelps, setInviteHelps] = useState<InviteHelp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  useEffect(() => {
    const fetchInviteHelp = async () => {
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
    fetchInviteHelp();
  }, []);

  const filtered = inviteHelps.filter((inv) => {
    const q = search.toLowerCase();
    return (
      (inv.userId?.name || "").toLowerCase().includes(q) ||
      (inv.userId?.email || "").toLowerCase().includes(q) ||
      (inv.userId?.businessProfile?.businessName || "").toLowerCase().includes(q) ||
      (inv.userId?.businessProfile?.businessEmail || "").toLowerCase().includes(q) ||
      (inv.message || "").toLowerCase().includes(q)
    );
  });

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

  return (
    <AdminPage title="Messages" noPanel>
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
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">User Name</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">User Email</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Business Name</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Business Email</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Message</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Audio</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Created At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  No invite help requests found.
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => {
                let audioUrl: string | null = null;
                if (
                  row.audioBlob?.data &&
                  Array.isArray(row.audioBlob.data) &&
                  row.audioBlob.type === "Buffer"
                ) {
                  audioUrl = arrayBufferToBlobUrl(row.audioBlob.data);
                }

                return (
                  <tr key={row._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                    <td className="border border-gray-300 px-2 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(row._id)}
                        onChange={() => toggleSelect(row._id)}
                        className="accent-ad-purple"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <span className="text-blue-700">{row.userId?.name || "N/A"}</span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{row.userId?.email || "N/A"}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      {row.userId?.businessProfile?.businessName || "N/A"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {row.userId?.businessProfile?.businessEmail || "N/A"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {row.message ? (
                        <span className="line-clamp-2 block max-w-[200px]" title={row.message}>
                          {row.message}
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
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : "N/A"}
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
