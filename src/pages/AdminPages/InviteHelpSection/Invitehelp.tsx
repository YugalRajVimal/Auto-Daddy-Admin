
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AdminDataTable, tableCell } from "../../../components/admin/AdminDataTable";

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

const Invitehelp: React.FC = () => {
  const [inviteHelps, setInviteHelps] = useState<InviteHelp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCols, setVisibleCols] = useState([
    "id",
    "userName",
    "userEmail",
    "businessName",
    "businessEmail",
    "audio",
    "createdAt",
  ]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchInviteHelp = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/invite-help`);
        if (res.data && res.data.success) {
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

  const tableColumns = useMemo(
    () => [
      {
        key: "id",
        label: "ID",
        render: (_inv: InviteHelp, index: number) =>
          tableCell((currentPage - 1) * pageSize + index + 1),
        exportValue: (inv: InviteHelp) => {
          const idx = filtered.findIndex((i) => i._id === inv._id);
          return String(idx >= 0 ? idx + 1 : "");
        },
      },
      {
        key: "userName",
        label: "User Name",
        render: (inv: InviteHelp) =>
          tableCell(
            inv.userId?.name || <span style={{ color: "#aaa", fontStyle: "italic" }}>N/A</span>
          ),
        exportValue: (inv: InviteHelp) => inv.userId?.name || "N/A",
      },
      {
        key: "userEmail",
        label: "User Email",
        render: (inv: InviteHelp) =>
          tableCell(
            inv.userId?.email || <span style={{ color: "#aaa", fontStyle: "italic" }}>N/A</span>
          ),
        exportValue: (inv: InviteHelp) => inv.userId?.email || "N/A",
      },
      {
        key: "businessName",
        label: "Business Name",
        render: (inv: InviteHelp) =>
          tableCell(
            inv.userId?.businessProfile?.businessName || (
              <span style={{ color: "#aaa", fontStyle: "italic" }}>N/A</span>
            )
          ),
        exportValue: (inv: InviteHelp) => inv.userId?.businessProfile?.businessName || "N/A",
      },
      {
        key: "businessEmail",
        label: "Business Email",
        render: (inv: InviteHelp) =>
          tableCell(
            inv.userId?.businessProfile?.businessEmail || (
              <span style={{ color: "#aaa", fontStyle: "italic" }}>N/A</span>
            )
          ),
        exportValue: (inv: InviteHelp) => inv.userId?.businessProfile?.businessEmail || "N/A",
      },
      {
        key: "audio",
        label: "Audio",
        render: (inv: InviteHelp) => {
          let audioUrl: string | null = null;
          if (
            inv.audioBlob?.data &&
            Array.isArray(inv.audioBlob.data) &&
            inv.audioBlob.type === "Buffer"
          ) {
            audioUrl = arrayBufferToBlobUrl(inv.audioBlob.data);
          }
          return tableCell(
            audioUrl ? (
              <audio controls src={audioUrl} style={{ height: 32, width: 176, accentColor: "#2563eb" }} />
            ) : (
              <span style={{ color: "#aaa", fontStyle: "italic", fontSize: 12 }}>No audio</span>
            )
          );
        },
        exportValue: (inv: InviteHelp) =>
          inv.audioBlob?.data && inv.audioBlob.type === "Buffer" ? "Has audio" : "No audio",
      },
      {
        key: "createdAt",
        label: "Created At",
        render: (inv: InviteHelp) =>
          tableCell(
            inv.createdAt ? (
              new Date(inv.createdAt).toLocaleString()
            ) : (
              <span style={{ color: "#aaa", fontStyle: "italic" }}>N/A</span>
            )
          ),
        exportValue: (inv: InviteHelp) =>
          inv.createdAt ? new Date(inv.createdAt).toLocaleString() : "N/A",
      },
    ],
    [currentPage, pageSize, filtered]
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-4 md:px-6 md:py-5 font-sans">
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Invite Help Requests</h1>
        <div className="text-sm text-right">
          <span className="text-blue-600 hover:underline cursor-pointer">Dashboard</span>
          <span className="text-gray-500"> / Invite Help</span>
        </div>
      </div>

      {error && (
        <div className="mb-3 text-sm rounded bg-red-100 text-red-800 px-3 py-2 border border-red-200">
          {error}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <span className="text-base font-medium text-gray-700">Request List</span>
        <span className="text-sm text-gray-400">
          {!loading && `${inviteHelps.length} total request${inviteHelps.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="mb-10">
        <AdminDataTable
          items={filtered}
          columns={tableColumns}
          getRowId={(inv) => inv._id}
          loading={loading}
          emptyMessage="No invite help requests found."
          search={search}
          onSearchChange={setSearch}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          currentPage={currentPage}
          onCurrentPageChange={setCurrentPage}
          visibleColumnKeys={visibleCols}
          onVisibleColumnKeysChange={setVisibleCols}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          exportFilename="invite-help"
          totalBeforeFilter={inviteHelps.length}
        />
      </div>
    </div>
  );
};

export default Invitehelp;
