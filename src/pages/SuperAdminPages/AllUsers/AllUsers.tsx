import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiTag,
  FiHash,
  FiLogIn,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

type FlattenedUser = {
  _id: string;
  shortId: string;
  name: string;
  email: string;
  role: string;
  fromCollection: 'therapists' | 'patients' | 'admin' | 'unknown';
  phone?: string;
  [key: string]: any;
};

type FamilyGroupPatient = {
  _id: string;
  shortId: string;
  name: string;
  parentEmail: string;
  familyPatients: any[];
  displayNames: string;
  role: string;
  fromCollection: 'patients';
  phone?: string;
  userEmail: string;
  fatherFullName?: string;
  motherFullName?: string;
  address?: string;
  areaName?: string;
};

const extractShortId = (user: any, type: string): string => {
  if (type === 'therapists' && user.therapistId) return user.therapistId;
  if (type === 'patients' && user.patientId) return user.patientId;
  if (type === 'admin' && (user.subAdminId || user.adminId)) return user.subAdminId || user.adminId;
  if (user.userId && type !== 'admin') {
    if (type === 'therapists' && user.userId.therapistId) return user.userId.therapistId;
    if (type === 'patients' && user.userId.patientId) return user.userId.patientId;
    if (type === 'admin' && (user.userId.subAdminId || user.userId.adminId)) return user.userId.subAdminId || user.userId.adminId;
  }
  return user._id || '';
};

const groupPatientsByParentEmail = (patients: any[]): FamilyGroupPatient[] => {
  const familyGroups: { [key: string]: FamilyGroupPatient } = {};

  for (const patient of patients) {
    if (!patient.userId) continue;
    const parentEmail = patient.parentEmail || patient.userId.email;
    const userId = patient.userId._id || patient._id;
    const userEmail = patient.userId.email || patient.parentEmail || '';
    if (!parentEmail) continue;

    if (!familyGroups[parentEmail]) {
      let displayParentName = 'N/A';
      if (patient.fatherFullName || patient.motherFullName) {
        displayParentName =
          (patient.fatherFullName ?? '') +
          (patient.fatherFullName && patient.motherFullName ? ' / ' : '') +
          (patient.motherFullName ?? '');
      } else if (patient.userId && patient.userId.name) {
        displayParentName = patient.userId.name;
      } else if (patient.name) {
        displayParentName = patient.name;
      }
      familyGroups[parentEmail] = {
        _id: userId,
        shortId: extractShortId(patient, 'patients'),
        name: displayParentName,
        parentEmail: parentEmail,
        displayNames: '',
        familyPatients: [],
        role: patient.userId.role || 'patient',
        fromCollection: 'patients',
        phone: patient.userId.phone || patient.mobile1 || '',
        userEmail: userEmail,
        fatherFullName: patient.fatherFullName,
        motherFullName: patient.motherFullName,
        address: patient.address,
        areaName: patient.areaName,
      };
    }
    familyGroups[parentEmail].familyPatients.push(patient);
  }

  Object.values(familyGroups).forEach(family => {
    // REPLACE displayNames WITH linked children names/id
    family.displayNames = family.familyPatients.map(p => {
      const name = p.name || '-';
      const pid = p.patientId || '-';
      return (
        `<a href="/super-admin/children?patientId=${encodeURIComponent(pid)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">${name} (${pid})</a>`
      );
    }).join(', ');
  });
  Object.values(familyGroups).forEach(family => {
    family.shortId =
      family.familyPatients.map(p => p.patientId || '-').join(', ') ||
      family.familyPatients.map(p => p._id).join(', ') ||
      family._id;
  });

  return Object.values(familyGroups);
};

const extractUsersFromResponse = (data: any): FlattenedUser[] => {
  const users: FlattenedUser[] = [];

  if (!data) return users;

  if (Array.isArray(data.therapists)) {
    data.therapists.forEach((therapist: any) => {
      if (therapist.userId) {
        users.push({
          _id: therapist.userId._id || therapist._id,
          shortId: extractShortId(therapist, 'therapists'),
          name: therapist.userId.name || 'N/A',
          email: therapist.userId.email || 'N/A',
          role: therapist.userId.role || 'therapist',
          fromCollection: 'therapists',
          phone: therapist.userId.phone || therapist.mobile1 || '',
          therapistRaw: therapist, // Pass full therapist object for linking
        });
      }
    });
  }

  if (Array.isArray(data.patients)) {
    const families = groupPatientsByParentEmail(data.patients);
    for (const family of families) {
      users.push({
        _id: family._id,
        shortId: family.shortId,
        name: family.name,
        email: family.userEmail || family.parentEmail,
        parentEmail: family.parentEmail,
        displayNames: family.displayNames,
        role: family.role,
        fromCollection: 'patients',
        phone: family.phone,
        familyPatients: family.familyPatients,
        fatherFullName: family.fatherFullName,
        motherFullName: family.motherFullName,
        address: family.address,
        areaName: family.areaName,
      });
    }
  }

  if (Array.isArray(data.admins)) {
    data.admins.forEach((admin: any) => {
      users.push({
        _id: admin._id,
        shortId: extractShortId(admin, 'admin'),
        name: admin.name || 'N/A',
        email: admin.email || 'N/A',
        role: admin.role || 'admin',
        fromCollection: 'admin',
        phone: admin.phone || '',
      });
    });
  }
  return users;
};

// Here, map UI role switches to api role
const ROLE_OPTIONS = [
  { label: "All Users", value: "all", apiRole: "all" },
  { label: "All Patients", value: "patients", apiRole: "patients" },
  { label: "All Therapist", value: "therapists", apiRole: "therapists" },
  { label: "All Admin", value: "admin", apiRole: "admin" },
];

const TableHeadCell = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <th className="py-3 px-4 text-sm font-semibold text-slate-600 bg-slate-100 border-b border-slate-200 whitespace-nowrap">
    {children}
  </th>
);

const TableCell = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <td
    className={
      "py-2.5 px-4 border-b border-slate-100 text-sm " + className
    }
  >
    {children}
  </td>
);

type UserRowProps = {
  user: FlattenedUser;
  onLoginAsUser: (_user: FlattenedUser) => void;
  loggingInUserId?: string | null;
};

const UserRow = ({
  user,
  onLoginAsUser,
  loggingInUserId,
}: UserRowProps) => {
  // Determines if family children should be shown
  const showFamilyChildren = user.fromCollection === 'patients' && user.displayNames;

  // Generate links for patient family children
  function renderChildrenDisplayNames(htmlString: string) {
    // Return <span dangerouslySetInnerHTML ...> to interpret string as html links
    return (
      <span dangerouslySetInnerHTML={{ __html: htmlString }} />
    );
  }

  // For therapists, if available, link name/id
  function renderTherapistName(name: string, user: FlattenedUser) {
    // Try to find therapistId and therapist _id
    // const therapistId = user.shortId || '';
    // therapistRaw._id most reliable for therapist document id
    const therapistRaw = user.therapistRaw || {};
    const therapistObjId = therapistRaw._id || user._id || '';

    if (therapistObjId) {
      return (
        <a
          href={`/super-admin/therapists?therapist=${encodeURIComponent(therapistObjId)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 underline hover:text-blue-900"
          style={{ textDecoration: 'underline' }}
        >
          {name}
        </a>
      );
    }
    return name;
  }

  // For therapists, link id
  function renderTherapistShortId(shortId: string, user: FlattenedUser) {
    const therapistRaw = user.therapistRaw || {};
    const therapistObjId = therapistRaw._id || user._id || '';

    if (therapistObjId && shortId) {
      return (
        <a
          href={`/super-admin/therapists?therapist=${encodeURIComponent(therapistObjId)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 underline hover:text-blue-900"
          style={{ textDecoration: 'underline' }}
        >
          {shortId}
        </a>
      );
    }
    return shortId;
  }

  // For patients (families), link children id
  function renderPatientShortId(shortId: string, user: FlattenedUser) {
    // Maybe multiple IDs, comma separated
    if (!shortId) return null;
    if (user.fromCollection !== "patients") return shortId;
    // familyPatients: [{ patientId }]
    const ids = shortId.split(/\s*,\s*/);
    const familyPatients = Array.isArray(user.familyPatients) ? user.familyPatients : [];

    return (
      <>
        {ids.map((id, idx) => {
          // Find actual patient object for this id, fallback just link with id
          let patientObj = familyPatients.find((p: any) => ('' + p.patientId) === ('' + id));
          if (!patientObj && familyPatients.length === 1) patientObj = familyPatients[0];
          // Could be "-" if missing id
          if (!id || id === "-") {
            return <span key={id + idx}>-</span>;
          }
          return (
            <a
              key={id + idx}
              href={`/super-admin/children?patientId=${encodeURIComponent(id)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 underline hover:text-blue-900"
              style={{ textDecoration: 'underline', marginRight: '0.25em' }}
            >
              {id}
            </a>
          );
        }).reduce<React.ReactNode[]>((acc, curr, i) => {
          if (acc.length > 0) {
            acc.push(<span key={`comma-${i}`}>, </span>);
          }
          acc.push(curr);
          return acc;
        }, [])}
      </>
    );
  }

  return (
    <tr
      className="hover:bg-blue-50 transition"
      key={`${user._id}-${user.fromCollection}`}
    >
      <TableCell className="font-mono text-blue-900 font-bold">
        <div className="flex items-center gap-2">
          <FiHash className="text-blue-400" />
          {/* User ID - LINK if patient/therapist */}
          {user.fromCollection === "patients"
            ? renderPatientShortId(user.shortId, user)
            : user.fromCollection === "therapists"
            ? renderTherapistShortId(user.shortId, user)
            : <span>{user.shortId || user._id}</span>
          }
        </div>
      </TableCell>
      <TableCell className="font-semibold text-slate-700">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <FiUser className="text-blue-600" />
            {/* Name - link if therapist, for family just text */}
            {user.fromCollection === "therapists"
              ? renderTherapistName(user.name, user)
              : user.name
            }
          </div>
          {showFamilyChildren && (
            <div className="text-xs mt-1 text-blue-500 font-mono">
              <span>
                Children:&nbsp;
                {renderChildrenDisplayNames(user.displayNames)}
              </span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <FiMail className="text-slate-500" />
            <span className="font-mono text-xs">{user.email}</span>
          </div>
          {user.fromCollection === "patients" && user.parentEmail && (
            <div className="text-xs text-purple-600 mt-0.5">
              Parent Email: {user.parentEmail}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="
          inline-flex items-center gap-2 
          px-2 rounded-full text-xs font-medium
          " 
          style={{
            background:
              user.role === "admin"
                ? "#f3e8ff"
                : user.role === "therapist"
                ? "#e0f2fe"
                : "#fef9c3",
            color:
              user.role === "admin"
                ? "#7c3aed"
                : user.role === "therapist"
                ? "#0ea5e9"
                : "#eab308",
          }}
        >
          <FiTag />
          {user.role}
        </span>
      </TableCell>
      <TableCell>
        <span
          className={
            "capitalize px-2 py-1 rounded text-xs font-semibold " +
            (user.fromCollection === "therapists"
              ? "bg-blue-100 text-blue-700"
              : user.fromCollection === "patients"
              ? "bg-yellow-100 text-yellow-700"
              : user.fromCollection === "admin"
              ? "bg-purple-100 text-purple-700"
              : "bg-slate-100 text-slate-600")
          }
        >
          {user.fromCollection}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <FiPhone className="text-green-600" />
            <span className="font-mono">{user.phone || '-'}</span>
          </div>
          {user.fromCollection === "patients" && user.address && (
            <div className="text-xs text-slate-500 mt-0.5">
              Address: {user.address}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <button
          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 hover:text-blue-900 text-xs font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={() => onLoginAsUser(user)}
          disabled={loggingInUserId === user._id}
          title="Log In As This User"
          aria-label="Log In As User"
        >
          <FiLogIn className="text-base" />
          {loggingInUserId === user._id ? "Logging in..." : "Log In As"}
        </button>
      </TableCell>
    </tr>
  );
};

type AllUsersProps = {
  navigate?: ReturnType<typeof useNavigate>;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const AllUsers: React.FC<AllUsersProps> = () => {
  const [users, setUsers] = useState<FlattenedUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<'all' | 'patients' | 'therapists' | 'admin'>('all');
  const [loggingInUserId, setLoggingInUserId] = useState<string | null>(null);

  // Pagination & search states
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const searchTimeout = useRef<any>(null);

  // Fetch users from server with role, search, pagination
  useEffect(() => {
    let controller = new AbortController();
    setLoading(true);
    setError(null);

    async function fetchUsers() {
      try {
        const params: any = {
          page,
          limit: pageSize,
        };
        // ALWAYS send type for filtering, "all" as "all"
        params.role = activeRole; // here, send patients, therapist, admin or all as role, per controller convention
        if (search) params.search = search;

        const res = await axios.get(`${API_BASE}/api/admin/users`, {
          params,
          signal: controller.signal,
        });

        const { data } = res;

        let extractedUsers: FlattenedUser[] = [];
        let totalUsers: number =
          typeof data.total === 'number'
            ? data.total
            : Array.isArray(data.therapists)
            ? data.therapistsTotal ?? data.therapists.length
            : Array.isArray(data.patients)
            ? data.patientsTotal ?? data.patients.length
            : Array.isArray(data.admins)
            ? data.adminsTotal ?? data.admins.length
            : Array.isArray(data.users)
            ? data.total ?? data.users.length
            : Array.isArray(data)
            ? data.length
            : 0;

        if (
          typeof data === 'object' &&
          (Array.isArray(data.therapists) ||
            Array.isArray(data.patients) ||
            Array.isArray(data.admins))
        ) {
          extractedUsers = extractUsersFromResponse(data);
        } else if (Array.isArray(data.users)) {
          extractedUsers = data.users.map((u: any) => ({
            ...u,
            fromCollection: u.fromCollection || 'unknown',
            shortId: u.shortId || u._id,
          }));
        } else if (Array.isArray(data)) {
          extractedUsers = data.map(u => ({
            ...u,
            fromCollection: 'unknown',
            shortId: u._id,
          }));
        }

        setUsers(extractedUsers);
        setTotal(totalUsers);
      } catch (err: unknown) {
        let errMessage = 'Failed to fetch users';
        if (axios.isAxiosError(err)) {
          if (err.code === "ERR_CANCELED") {
            return;
          }
          if (err.response) {
            errMessage =
              (typeof err.response.data === 'string'
                ? err.response.data
                : err.response.data?.message) ||
              `Server responded with status ${err.response.status}`;
          } else if (err.request) {
            errMessage = 'No response received from server. Check your connection.';
          } else if (err.message) {
            errMessage = err.message;
          }
        } else if (err instanceof Error) {
          errMessage = err.message;
        }
        setError(errMessage);
        setUsers([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
    return () => controller.abort();
  }, [activeRole, page, pageSize, search]);

  // Debounced search input -> search param
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
    // eslint-disable-next-line
  }, [searchInput]);

  const handleLoginAsUser = async (user: FlattenedUser) => {
    if (!user || !user._id) return;
    setLoggingInUserId(user._id);
    setError(null);

    try {
      const res = await axios.post(
        `${API_BASE}/api/super-admin/users/login-as-user`,
        { userId: user._id },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const { token, role, user: userData } = res.data;

      localStorage.setItem("isLogInViaSuperAdmin", "true");

      if (role === "patient") {
        localStorage.setItem("patient-token", token);
        window.location.href = "/user";
      } else if (role === "therapist") {
        localStorage.setItem("therapist-token", token);
        window.location.href = "/therapist";
      } else if (role === "admin") {
        localStorage.setItem("admin-token", token);
        window.location.href = "/admin";
      } else {
        localStorage.setItem("authToken", token);
        window.location.href = "/";
      }
      localStorage.setItem("userRole", role);
      localStorage.setItem("userData", JSON.stringify(userData));
    } catch (err: any) {
      let errMessage = "Failed to log in as user.";
      if (axios.isAxiosError(err)) {
        if (err.response?.data?.error) {
          errMessage = err.response.data.error;
        } else if (err.response?.data?.message) {
          errMessage = err.response.data.message;
        } else if (typeof err.response?.data === "string") {
          errMessage = err.response.data;
        }
      } else if (err instanceof Error) {
        errMessage = err.message;
      }
      setError(errMessage);
    } finally {
      setLoggingInUserId(null);
    }
  };

  // pagination etc
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Defensive: invalidate page if exceeding
  useEffect(() => {
    if (page > totalPages) setPage(1);
    // eslint-disable-next-line
  }, [totalPages]);

  // Reset to first page on search/role/pageSize change
  useEffect(() => {
    setPage(1);
  }, [activeRole, pageSize, search]);

  return (
    <div className="w-full px-5 py-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-blue-900">
          All Users
        </h1>
        <form
          onSubmit={e => {
            e.preventDefault();
            setSearch(searchInput.trim());
            setPage(1);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex items-center">
            <span className="absolute left-3 text-slate-400">
              <FiSearch />
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by name, email, phone, id..."
              className="pl-9 pr-3 py-2 text-sm w-64 rounded-md border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          {search && (
            <button
              type="button"
              title="Clear search"
              className="ml-1 px-2 h-9 rounded bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setPage(1);
              }}
            >
              ×
            </button>
          )}
        </form>
      </div>

      {/* Tab Switches */}
      <div className="flex gap-2 flex-wrap mb-3">
        {ROLE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => {
              setActiveRole(opt.apiRole as 'all' | 'patients' | 'therapists' | 'admin');
              setPage(1);
            }}
            className={
              "text-sm font-semibold px-4 py-2 rounded-full transition border border-blue-300" +
              (activeRole === opt.apiRole
                ? " bg-blue-600 text-white border-blue-700 shadow"
                : " bg-white text-blue-700 hover:bg-blue-50")
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
        <table className="min-w-[800px] w-full">
          <thead>
            <tr>
              <TableHeadCell>User ID</TableHeadCell>
              <TableHeadCell>
                {activeRole === 'patients'
                  ? 'Parent / Family Name'
                  : 'Name'}
              </TableHeadCell>
              <TableHeadCell>
                {activeRole === 'patients'
                  ? 'Parent/Child Email'
                  : 'Email'}
              </TableHeadCell>
              <TableHeadCell>Role</TableHeadCell>
              <TableHeadCell>Type</TableHeadCell>
              <TableHeadCell>Phone</TableHeadCell>
              <TableHeadCell>
                <span className="flex items-center gap-1 justify-center">
                  <FiLogIn className="mb-0.5" />
                  Log In As
                </span>
              </TableHeadCell>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-blue-600 font-medium">
                  Loading users...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-red-600 font-semibold">
                  {error}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-500">
                  No{" "}
                  {activeRole === "all"
                    ? "users"
                    : activeRole === "patients"
                    ? "families"
                    : activeRole === "therapists"
                    ? "therapists"
                    : "admins"}{" "}
                  found.
                </td>
              </tr>
            ) : (
              users.map(user => (
                <UserRow
                  key={`${user._id}-${user.fromCollection}`}
                  user={user}
                  onLoginAsUser={handleLoginAsUser}
                  loggingInUserId={loggingInUserId}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <label htmlFor="pageSize-select">Rows per page:</label>
          <select
            id="pageSize-select"
            className="py-1 px-2 rounded border border-slate-300 focus:border-blue-400"
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {PAGE_SIZE_OPTIONS.map(sz => (
              <option key={sz} value={sz}>
                {sz}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1 text-sm text-slate-500">
          <button
            className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-blue-50 transition disabled:opacity-50"
            title="Previous Page"
            disabled={page === 1 || loading}
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            aria-label="Previous Page"
          >
            <FiChevronLeft />
          </button>
          <span className="px-2 select-none">
            Page{" "}
            <input
              type="number"
              min={1}
              max={totalPages}
              value={page}
              onChange={e => {
                let val = Number(e.target.value);
                if (Number.isNaN(val) || val < 1) val = 1;
                if (val > totalPages) val = totalPages;
                setPage(val);
              }}
              className="w-12 text-center border border-gray-300 rounded mx-1 py-0.5 px-1 text-sm"
              style={{ width: 44 }}
              disabled={loading || totalPages <= 1}
            />{" "}
            of {totalPages}
          </span>
          <button
            className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-blue-50 transition disabled:opacity-50"
            title="Next Page"
            disabled={page === totalPages || loading || totalPages <= 1}
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            aria-label="Next Page"
          >
            <FiChevronRight />
          </button>
          <span className="pl-3">
            {total > 0 && (
              <>
                {(page - 1) * pageSize + 1}-{Math.min(total, page * pageSize)} of {total} users
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AllUsers;