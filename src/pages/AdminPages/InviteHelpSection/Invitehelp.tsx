

import React, { useEffect, useState } from 'react';
import axios from 'axios';

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

/* ── Shared sub-components ── */
const SortIcon = () => (
  <svg className="w-3 h-3 text-gray-400 flex-shrink-0" viewBox="0 0 10 14" fill="currentColor">
    <path d="M5 0L9 5H1L5 0Z" />
    <path d="M5 14L1 9H9L5 14Z" />
  </svg>
);

const PaginationBtn: React.FC<{
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}> = ({ label, onClick, active, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1 text-sm rounded border transition-colors ${
      active
        ? 'bg-blue-600 text-white border-blue-600'
        : disabled
        ? 'text-gray-400 border-gray-200 cursor-not-allowed bg-white'
        : 'text-gray-600 border-gray-300 bg-white hover:bg-gray-50'
    }`}
  >
    {label}
  </button>
);

function arrayBufferToBlobUrl(buffer: number[], mimeType = 'audio/webm') {
  const arr = new Uint8Array(buffer);
  const blob = new Blob([arr], { type: mimeType });
  return URL.createObjectURL(blob);
}

const Invitehelp: React.FC = () => {
  const [inviteHelps, setInviteHelps] = useState<InviteHelp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Table controls
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchInviteHelp = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/invite-help`);
        if (res.data && res.data.success) {
          setInviteHelps(res.data.data || []);
        } else {
          setError('Failed to fetch invite help requests.');
        }
      } catch {
        setError('Failed to fetch invite help requests.');
      }
      setLoading(false);
    };
    fetchInviteHelp();
  }, []);

  // Filtered + paginated
  const filtered = inviteHelps.filter((inv) => {
    const q = search.toLowerCase();
    return (
      (inv.userId?.name || '').toLowerCase().includes(q) ||
      (inv.userId?.email || '').toLowerCase().includes(q) ||
      (inv.userId?.businessProfile?.businessName || '').toLowerCase().includes(q) ||
      (inv.userId?.businessProfile?.businessEmail || '').toLowerCase().includes(q) ||
      (inv.message || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const showingFrom = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, filtered.length);

  return (
<div
        // You may use Tailwind class if setup, or fallback to CSS below.
        className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-4 md:px-6 md:py-5 font-sans"
      
      >
      {/* Page Header */}
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Invite Help Requests</h1>
        <div className="text-sm text-right">
          <span className="text-blue-600 hover:underline cursor-pointer">Dashboard</span>
          <span className="text-gray-500"> / Invite Help</span>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-3 text-sm rounded bg-red-100 text-red-800 px-3 py-2 border border-red-200">
          {error}
        </div>
      )}

      {/* Card */}
      <div className="mb-10 bg-white rounded shadow-sm">
        {/* Card Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <span className="text-base font-medium text-gray-700">Request List</span>
          <span className="text-sm text-gray-400">
            {!loading && `${inviteHelps.length} total request${inviteHelps.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Table Controls */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            Show
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
            >
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            entries
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            Search:
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400 w-44"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-16 gap-3">
            <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-blue-600 text-sm font-medium">Loading requests...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-12">
                    <span className="flex items-center gap-1">ID <SortIcon /></span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    <span className="flex items-center gap-1">User Name <SortIcon /></span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    <span className="flex items-center gap-1">User Email <SortIcon /></span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    <span className="flex items-center gap-1">Business Name <SortIcon /></span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    <span className="flex items-center gap-1">Business Email <SortIcon /></span>
                  </th>
                  {/* <th className="px-4 py-3 text-left font-semibold text-gray-700 w-52">
                    <span className="flex items-center gap-1">Message <SortIcon /></span>
                  </th> */}
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-48">
                    <span className="flex items-center gap-1">Audio <SortIcon /></span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-40">
                    <span className="flex items-center gap-1">Created At <SortIcon /></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-400">
                      No invite help requests found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((invite, idx) => {
                    let audioUrl: string | null = null;
                    if (
                      invite.audioBlob?.data &&
                      Array.isArray(invite.audioBlob.data) &&
                      invite.audioBlob.type === 'Buffer'
                    ) {
                      audioUrl = arrayBufferToBlobUrl(invite.audioBlob.data);
                    }

                    return (
                      <tr
                        key={invite._id}
                        className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-white' : 'bg-[#f9f9f9]'}`}
                      >
                        <td className="px-4 py-3 text-gray-600">{showingFrom + idx}</td>
                        <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">
                          {invite.userId?.name || (
                            <span className="text-gray-400 italic">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {invite.userId?.email || (
                            <span className="text-gray-400 italic">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {invite.userId?.businessProfile?.businessName || (
                            <span className="text-gray-400 italic">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {invite.userId?.businessProfile?.businessEmail || (
                            <span className="text-gray-400 italic">N/A</span>
                          )}
                        </td>
                        {/* <td className="px-4 py-3 text-gray-700 max-w-[200px]">
                          {invite.message ? (
                            <span className="line-clamp-2 block" title={invite.message}>
                              {invite.message}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">N/A</span>
                          )}
                        </td> */}
                        <td className="px-4 py-3">
                          {audioUrl ? (
                            <audio
                              controls
                              src={audioUrl}
                              className="h-8 w-44 rounded"
                              style={{ accentColor: '#2563eb' }}
                            />
                          ) : (
                            <span className="text-gray-400 italic text-xs">No audio</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                          {invite.createdAt
                            ? new Date(invite.createdAt).toLocaleString()
                            : <span className="text-gray-400 italic">N/A</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 text-sm text-gray-600">
          <span>
            {filtered.length === 0
              ? 'Showing 0 entries'
              : `Showing ${showingFrom} to ${showingTo} of ${filtered.length} entries`}
          </span>
          <div className="flex items-center gap-1">
            <PaginationBtn label="Previous" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationBtn key={p} label={String(p)} active={p === currentPage} onClick={() => setCurrentPage(p)} />
            ))}
            <PaginationBtn label="Next" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invitehelp;