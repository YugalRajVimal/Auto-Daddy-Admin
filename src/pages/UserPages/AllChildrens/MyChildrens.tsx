import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  FiUser,
  FiPhone,
  FiUsers,
  FiMail,
  FiMapPin,
  FiInfo,
  FiHash,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

type ChildType = {
  _id: string;
  patientId?: string;
  name: string;
  gender?: string;
  childDOB?: string;
  fatherFullName?: string;
  motherFullName?: string;
  parentEmail?: string;
  mobile1?: string;
  mobile2?: string;
  address?: string;
  areaName?: string;
  diagnosisInfo?: string;
  plannedSessionsPerMonth?: string;
  remarks?: string;
  // Add more fields if any based on backend
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const DEFAULT_PAGE_SIZE = 10;

const MyChildrens: React.FC = () => {
  // --- Search, Pagination, Data States ---
  const [search, setSearch] = useState(""); // For the user's search field, persists unless manually changed
  const [appliedSearch, setAppliedSearch] = useState(""); // Search term used for the actual fetch
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [children, setChildren] = useState<ChildType[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);


  // Use ref to keep input focus after search/pagination
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Only fetch data when search submitted (appliedSearch changes), or page/limit changes
  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("patient-token");
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("limit", String(limit));
    if (appliedSearch.trim()) params.append("search", appliedSearch.trim());

    fetch(`${API_BASE_URL}/api/parent/childrens?` + params.toString(), {
      headers: token ? { Authorization: token } : {},
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        setChildren(Array.isArray(data?.data) ? data.data : []);
        setTotal(Number(data?.total || 0));
        setTotalPages(Number(data?.totalPages || 1));
        setHasNextPage(!!data?.hasNextPage);
      })
      .catch(() => {
        setChildren([]);
        setTotal(0);
        setTotalPages(1);
        setHasNextPage(false);

      })
      .finally(() => setLoading(false));
  }, [appliedSearch, page, limit]);

  // Ensure that if search or limit changes, page resets to 1
  useEffect(() => {
    setPage(1);
  }, [appliedSearch, limit]);

  // Handlers
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearch("");
    setAppliedSearch("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handlePageChange = (delta: number) => {
    setPage((p) => Math.max(1, Math.min(totalPages, p + delta)));
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  // UI
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-8"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <FiUsers className="text-blue-600 text-2xl" /> My Children
      </h1>

      {/* Search & Pagination block, separated from the table */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7">
        {/* Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 w-full md:w-fit"
        >
          <label htmlFor="children-search" className="sr-only">
            Search child name/ID/parent
          </label>
          <input
            ref={searchInputRef}
            id="children-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, patient ID or parent..."
            className="border border-slate-300 rounded px-3 py-2 text-sm focus:outline-blue-400 bg-white min-w-[200px]"
            autoComplete="off"
            maxLength={120}
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded shadow flex items-center gap-1 text-sm font-medium"
            aria-label="Search"
          >
            <FiSearch />
          </button>
          {!!appliedSearch && (
            <button type="button" onClick={handleClearSearch} className="ml-2 px-2 py-2 rounded text-blue-400 hover:bg-blue-50 transition" aria-label="Clear search">
              ✕
            </button>
          )}
        </form>
        {/* Pagination Controls */}
        <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
          <span>
            {total > 0
              ? `Showing ${children.length > 0 ? (page - 1) * limit + 1 : 0}-${(page - 1) * limit + children.length} of ${total}`
              : "No records"}
          </span>
          <span className="hidden md:inline">|</span>
          <span>
            Rows per page:{" "}
            <select
              value={limit}
              onChange={handleLimitChange}
              className="border border-slate-300 rounded px-1 py-1 text-xs bg-white"
            >
              {[5, 10, 25, 50, 100].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </span>
          <button
            onClick={() => handlePageChange(-1)}
            disabled={page <= 1 || loading}
            className="mx-1 px-2 h-8 rounded border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50"
            aria-label="Previous Page"
            type="button"
          >
            <FiChevronLeft />
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(1)}
            disabled={page >= totalPages || !hasNextPage || loading}
            className="mx-1 px-2 h-8 rounded border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50"
            aria-label="Next Page"
            type="button"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-400">Loading...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[950px]">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-1">
                    <FiUser /> Name
                  </div>
                </th>

                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-1">
                    <FiHash /> Patient ID
                  </div>
                </th>
                <th className="px-4 py-3 text-left">Gender</th>
                <th className="px-4 py-3 text-left">DOB</th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-1">
                    <FiUsers /> Parents
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-1">
                    <FiPhone /> Mobile
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-1">
                    <FiMail /> Email
                  </div>
                </th>
                <th className="px-4 py-3 text-left">
                  <div className="flex items-center gap-1">
                    <FiMapPin /> Address
                  </div>
                </th>
                <th className="px-4 py-3 text-left">Diagnosis/Concern</th>
              </tr>
            </thead>
            <tbody>
              {children.map((child) => (
                <tr
                  key={child._id}
                  className="border-t hover:bg-blue-50/50 transition-all duration-100 text-slate-800"
                >
                  {/* Name */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                        <FiUser className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {child.name || (
                            <span className="italic text-slate-400">N/A</span>
                          )}
                        </p>
                        {child.childDOB && (
                          <p className="text-xs text-slate-500">
                            DOB: {formatDate(child.childDOB)}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  {/* Patient ID column */}
                  <td className="px-4 py-4 font-semibold text-slate-700">
                    {child.patientId || (
                      <span className="italic text-slate-400">N/A</span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {child.gender || (
                      <span className="italic text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {formatDate(child.childDOB)}
                  </td>
                  {/* Parents: Father & Mother */}
                  <td className="px-4 py-4 text-slate-600">
                    <div>
                      {child.fatherFullName || child.motherFullName ? (
                        <>
                          {child.fatherFullName && (
                            <span className="block">
                              Father: {child.fatherFullName}
                            </span>
                          )}
                          {child.motherFullName && (
                            <span className="block">
                              Mother: {child.motherFullName}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="italic text-slate-400">N/A</span>
                      )}
                    </div>
                  </td>
                  {/* Mobile numbers */}
                  <td className="px-4 py-4 text-slate-600 flex items-center gap-2">
                    <FiPhone />
                    {child.mobile1 ||
                      child.mobile2 ||
                      <span className="italic text-slate-400">N/A</span>}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-4 text-slate-600">
                    {child.parentEmail ? (
                      <span className="underline decoration-dashed text-blue-800">
                        {child.parentEmail}
                      </span>
                    ) : (
                      <span className="italic text-slate-400">N/A</span>
                    )}
                  </td>
                  {/* Address + areaName fallback */}
                  <td className="px-4 py-4 text-slate-600">
                    {child.address ||
                      child.areaName ||
                      <span className="italic text-slate-400">N/A</span>}
                  </td>
                  {/* Diagnosis/Concern */}
                  <td className="px-4 py-4 text-slate-600">
                    {child.diagnosisInfo || (
                      <span className="italic text-slate-400">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
              {children.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center p-6 text-slate-400">
                    No children found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-8 text-xs text-slate-500 flex items-center gap-2">
        <FiInfo className="inline" />
        For any issue or to update a child's details, please contact the clinic directly.
      </div>
    </motion.div>
  );
};

export default MyChildrens;
