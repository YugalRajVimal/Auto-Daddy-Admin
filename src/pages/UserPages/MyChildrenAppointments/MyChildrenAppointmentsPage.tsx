import React, { useEffect, useState } from "react";
import { FiCalendar, FiUser, FiSearch, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import { motion } from "framer-motion";
import dayjs from "dayjs";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// --- TYPES
type TherapistType = {
  _id: string;
  userId: { _id: string; name: string } | string;
  therapistId: string;
};
type SessionType = {
  _id?: string;
  date: string;
  time?: string;
  status?: string;
  notes?: string;
  slotId?: string;
  therapist?: TherapistType;
  isCheckedIn?: boolean; // <-- added
  [key: string]: any;
};
type PackageType = {
  _id: string;
  name: string;
  sessionCount: number;
  costPerSession: number;
  totalCost: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};
type PatientType = {
  _id: string;
  userId: string;
  patientId: string;
  gender: string;
  childDOB: string;
  name: string;
  fatherFullName?: string;
  plannedSessionsPerMonth?: string;
  package?: string;
  motherFullName?: string;
  parentEmail?: string;
  mobile1?: string;
  mobile1Verified?: boolean;
  mobile2?: string;
  address?: string;
  areaName?: string;
  diagnosisInfo?: string;
  childReference?: string;
  parentOccupation?: string;
  remarks?: string;
  otherDocument?: string;
  [key: string]: any;
};
type TherapyType = {
  _id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};
type PaymentType = {
  _id: string;
  paymentId: string;
  totalAmount: number;
  discountInfo: {
    code: string | null;
    percent: number;
    amount: number;
  };
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
  paymentTime?: string;
  [key: string]: any;
};
type DiscountInfoType = {
  coupon?: string;
  time?: string;
  [key: string]: any;
};
type AppointmentType = {
  _id: string;
  appointmentId?: string;
  discountInfo?: DiscountInfoType;
  package?: PackageType;
  patient?: PatientType;
  therapist?: TherapistType;
  sessions: SessionType[];
  therapy?: TherapyType | string;
  payment?: PaymentType;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
};

const SESSION_TIME_OPTIONS = [
  { id: '1000-1045', label: '10:00 to 10:45', limited: false },
  { id: '1045-1130', label: '10:45 to 11:30', limited: false },
  { id: '1130-1215', label: '11:30 to 12:15', limited: false },
  { id: '1215-1300', label: '12:15 to 13:00', limited: false },
  { id: '1300-1345', label: '13:00 to 13:45', limited: false },
  { id: '1415-1500', label: '14:15 to 15:00', limited: false },
  { id: '1500-1545', label: '15:00 to 15:45', limited: false },
  { id: '1545-1630', label: '15:45 to 16:30', limited: false },
  { id: '1630-1715', label: '16:30 to 17:15', limited: false },
  { id: '1715-1800', label: '17:15 to 18:00', limited: false },
  { id: '0830-0915', label: '08:30 to 09:15', limited: true },
  { id: '0915-1000', label: '09:15 to 10:00', limited: true },
  { id: '1800-1845', label: '18:00 to 18:45', limited: true },
  { id: '1845-1930', label: '18:45 to 19:30', limited: true },
  { id: '1930-2015', label: '19:30 to 20:15', limited: true }
];

// --- HELPERS ---
function formatDate(date?: string) {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return dayjs(d).format("DD MMM YYYY");
}
function formatDateTime(dateString?: string) {
  if (!dateString) return "-";
  return dayjs(dateString).format("DD MMM YYYY HH:mm");
}
function displayTherapistName(therapist: TherapistType | undefined) {
  if (!therapist) return "-";
  if (typeof therapist.userId === "string") return therapist.userId;
  return therapist.userId.name;
}

function useDebounce<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(handler);
  }, [value, ms]);
  return debounced;
}

// --- PAGINATION COMPONENT ---
function PaginationNav({
  currentPage,
  pageSize,
  totalCount,
  onPage,
}: {
  currentPage: number,
  pageSize: number,
  totalCount: number,
  onPage: (page: number) => void,
}) {
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);
  return (
    <div className="flex gap-2 items-center justify-center text-xs mt-2">
      <button
        aria-label="First"
        className="p-1"
        disabled={currentPage === 1}
        onClick={() => onPage(1)}
      >
        <FiChevronsLeft />
      </button>
      <button
        aria-label="Prev"
        className="p-1"
        disabled={currentPage === 1}
        onClick={() => onPage(Math.max(1, currentPage - 1))}
      >
        <FiChevronLeft />
      </button>
      <span>Page {currentPage} / {totalPages}</span>
      <button
        aria-label="Next"
        className="p-1"
        disabled={currentPage >= totalPages}
        onClick={() => onPage(Math.min(totalPages, currentPage + 1))}
      >
        <FiChevronRight />
      </button>
      <button
        aria-label="Last"
        className="p-1"
        disabled={currentPage >= totalPages}
        onClick={() => onPage(totalPages)}
      >
        <FiChevronsRight />
      </button>
      <span className="ml-2 text-slate-400">{totalCount} records</span>
    </div>
  );
}

// --- MAIN PAGE ---
export default function MyChildrenAppointmentsPage() {
  // --- Search, Pagination State ---
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const debouncedSearchText = useDebounce(searchText, 500); // Debounce for search

  // --- Data State ---
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Modal Details ---
  const [viewAppointment, setViewAppointment] = useState<AppointmentType | null>(null);

  // --- Fetch appointments list (with search + pagination) ---
  useEffect(() => {
    setLoading(true);
    const patientToken = localStorage.getItem('patient-token');
    const params = new URLSearchParams();
    params.append("page", String(currentPage));
    params.append("limit", String(pageSize));
    if (debouncedSearchText.trim().length > 0) params.append("search", debouncedSearchText.trim());
    fetch(`${API_BASE_URL}/api/parent/appointments?${params.toString()}`, {
      headers: {
        ...(patientToken ? { Authorization: `${patientToken}` } : {}),
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        const raw = await res.json();
        if (raw && raw.success && Array.isArray(raw.data)) {
          setAppointments(raw.data);
          setTotalCount(raw.total || raw.count || raw.data.length);
        } else {
          setAppointments([]);
          setTotalCount(0);
          window.alert("Failed to fetch appointments.");
        }
      })
      .catch(() => {
        setAppointments([]);
        setTotalCount(0);
        window.alert("Error fetching appointments.");
      })
      .finally(() => setLoading(false));
  }, [debouncedSearchText, currentPage, pageSize]);

  // --- Handle pagination controls ---
  function handlePage(newPage: number) {
    setCurrentPage(newPage);
  }
  function handlePageSizeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  }
  // Keep search bar state separate from table data
  function handleSearchInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchText(e.target.value);
    setCurrentPage(1);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-8"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        My Children's Appointments
      </h1>

      {/* --- SEARCH + PAGE SIZE + PAGINATION above table --- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <input
            type="search"
            className="border rounded px-3 py-2 w-full text-sm"
            placeholder="Search by booking, child, therapy, ID, status, slot, coupon etc."
            value={searchText}
            onChange={handleSearchInputChange}
            autoCorrect="off"
            spellCheck={false}
            autoCapitalize="none"
          />
          <FiSearch className="text-slate-400 -ml-7" />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs mr-1 font-medium text-slate-600">Rows:</label>
          <select className="border rounded px-2 py-1 text-xs" value={pageSize} onChange={handlePageSizeChange}>
            {[5, 10, 20, 50].map(n => (<option value={n} key={n}>{n}</option>))}
          </select>
          <PaginationNav
            currentPage={currentPage}
            pageSize={pageSize}
            totalCount={totalCount}
            onPage={handlePage}
          />
        </div>
      </div>

      {/* --- APPOINTMENTS TABLE --- */}
      {loading ? (
        <div className="text-center text-slate-400">Loading...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Booking ID</th>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Patient ID</th>
                <th className="px-4 py-3 text-left">Therapy</th>
                <th className="px-4 py-3 text-left">Package</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-center"># Sessions</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-slate-400 text-center">
                    No appointments found.
                  </td>
                </tr>
              )}
              {appointments.map(a => (
                <tr key={a._id} className="border-t">
                  <td className="px-4 py-4 font-semibold text-slate-700">
                    {a.appointmentId || a._id}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center">
                        <FiUser className="text-sky-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {a.patient?.name || <span className="italic text-slate-400">N/A</span>}
                        </p>
                        <p className="text-xs text-slate-500">{a.patient?.gender ? a.patient.gender.charAt(0).toUpperCase() + a.patient.gender.slice(1) : "-"}</p>
                        {a.patient?.childDOB && (
                          <p className="text-xs text-slate-500">
                            DOB: {formatDate(a.patient.childDOB)}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {a.patient?.patientId ? (
                      <span className="inline-block rounded bg-blue-50 text-blue-700 px-2 py-1 text-xs font-semibold">
                        {a.patient.patientId}
                      </span>
                    ) : (
                      <span className="italic text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {typeof a.therapy === "object"
                      ? (a.therapy as TherapyType)?.name
                      : a.therapy || <span className="italic text-slate-400">N/A</span>}
                  </td>
                  <td className="px-4 py-4">
                    {a.package?.name ?? <span className="italic text-slate-400">N/A</span>}
                  </td>
                  <td className="px-4 py-4">
                    {formatDate(a.createdAt)}
                  </td>
                  <td className="px-4 py-4 text-center font-semibold">
                    {Array.isArray(a.sessions) ? a.sessions.length : 0}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      className="flex items-center gap-1 px-3 py-1 rounded bg-slate-100 hover:bg-blue-50 border border-slate-200 text-blue-700 shadow-sm text-xs"
                      onClick={() => setViewAppointment(a)}
                    >
                      <FiCalendar className="text-blue-500" /> View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- PAGINATION NAV BELOW TABLE (for wide screens) --- */}
      <div className="flex justify-end mt-2">{!loading && (
        <PaginationNav
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={totalCount}
          onPage={handlePage}
        />
      )}</div>

      {/* --- MODAL WITH FULL APPT DETAILS --- */}
      {viewAppointment && (
        <div className="fixed z-50 inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-[fadeIn_0.15s]">
            <button
              className="absolute top-3 right-4 text-xl text-slate-500 hover:text-red-500"
              onClick={() => setViewAppointment(null)}
            >
              &times;
            </button>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FiCalendar className="inline text-blue-500" /> Appointment Details
            </h2>
            {/* --- Main Details --- */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Booking ID</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                  value={viewAppointment.appointmentId || viewAppointment._id}
                  readOnly
                  disabled
                  tabIndex={-1}
                  style={{ opacity: 1 }}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Created At</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                  value={formatDateTime(viewAppointment.createdAt)}
                  readOnly
                  disabled
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Updated At</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                  value={formatDateTime(viewAppointment.updatedAt)}
                  readOnly
                  disabled
                />
              </div>
              {/* Discount Info */}
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Discount Coupon</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                  value={viewAppointment.discountInfo?.coupon ?? ""}
                  readOnly
                  disabled
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Discount Time</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                  value={formatDateTime(viewAppointment.discountInfo?.time)}
                  readOnly
                  disabled
                />
              </div>
            </div>
            {/* --- Child Info --- */}
            <h3 className="font-semibold mb-2 mt-6 text-blue-900">Child Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Name</label>
                <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.patient?.name || ""} readOnly disabled />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Patient ID</label>
                <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.patient?.patientId || ""} readOnly disabled />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Gender</label>
                <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.patient?.gender || ""} readOnly disabled />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">DOB</label>
                <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={formatDate(viewAppointment.patient?.childDOB)} readOnly disabled />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Father Name</label>
                <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.patient?.fatherFullName ?? ""} readOnly disabled />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Mother Name</label>
                <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.patient?.motherFullName ?? ""} readOnly disabled />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Parent Email</label>
                <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.patient?.parentEmail ?? ""} readOnly disabled />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Mobile 1</label>
                <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.patient?.mobile1 ?? ""} readOnly disabled />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Mobile 2</label>
                <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.patient?.mobile2 ?? ""} readOnly disabled />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Address</label>
                <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.patient?.address ?? ""} readOnly disabled />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Area Name</label>
                <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.patient?.areaName ?? ""} readOnly disabled />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Diagnosis Info</label>
                <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.patient?.diagnosisInfo ?? ""} readOnly disabled />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Reference</label>
                <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.patient?.childReference ?? ""} readOnly disabled />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Parent Occupation</label>
                <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.patient?.parentOccupation ?? ""} readOnly disabled />
              </div>
            </div>
            {/* --- Therapy Info --- */}
            <h3 className="font-semibold mb-2 mt-6 text-blue-900">Therapy Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
              <div>
                <label className="block mb-1 text-sm font-medium">Therapy</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                  value={typeof viewAppointment.therapy === "object"
                    ? (viewAppointment.therapy as TherapyType)?.name
                    : viewAppointment.therapy ?? ""}
                  readOnly
                  disabled
                />
              </div>
              {typeof viewAppointment.therapy === "object" && (
                <>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Description</label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 bg-gray-100"
                      value={
                        (viewAppointment.therapy as TherapyType)?.description ?? ""
                      }
                      readOnly
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Is Active</label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 bg-gray-100"
                      value={(viewAppointment.therapy as TherapyType)?.isActive ? "Yes" : "No"}
                      readOnly
                      disabled
                    />
                  </div>
                </>
              )}
            </div>
            {/* --- Therapist Info --- */}
            <h3 className="font-semibold mb-2 mt-6 text-blue-900">Therapist Info</h3>
            {(viewAppointment.therapist || (viewAppointment.sessions || []).some(s => s.therapist)) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                <div>
                  <label className="block mb-1 text-sm font-medium">Therapist Name</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                    value={displayTherapistName(
                      viewAppointment.therapist
                        || ((viewAppointment.sessions || []).find(s => s.therapist)?.therapist)
                    )}
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Therapist ID</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                    value={
                      viewAppointment.therapist?.therapistId ||
                      ((viewAppointment.sessions || []).find(s => s.therapist)?.therapist?.therapistId) ||
                      ""
                    }
                    readOnly
                    disabled
                  />
                </div>
              </div>
            ) : (
              <div className="mb-2 text-slate-400 text-sm">No therapist data available</div>
            )}
            {/* --- Package Info --- */}
            <h3 className="font-semibold mb-2 mt-6 text-blue-900">Package Info</h3>
            {viewAppointment.package ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                <div>
                  <label className="block mb-1 text-sm font-medium">Package Name</label>
                  <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.package?.name} readOnly disabled />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Sessions</label>
                  <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.package?.sessionCount} readOnly disabled />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Cost/Session</label>
                  <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.package?.costPerSession} readOnly disabled />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Total Cost</label>
                  <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.package?.totalCost} readOnly disabled />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Package Created</label>
                  <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={formatDateTime(viewAppointment.package?.createdAt)} readOnly disabled />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Package Updated</label>
                  <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={formatDateTime(viewAppointment.package?.updatedAt)} readOnly disabled />
                </div>
              </div>
            ) : <div className="mb-2 text-slate-400 text-sm">No package data</div>}
            {/* --- Payment Info --- */}
            <h3 className="font-semibold mb-2 mt-6 text-blue-900">Payment Info</h3>
            {viewAppointment.payment ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                <div>
                  <label className="block mb-1 text-sm font-medium">Payment ID</label>
                  <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.payment.paymentId} readOnly disabled />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Status</label>
                  <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.payment.status} readOnly disabled />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Amount</label>
                  <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.payment.amount} readOnly disabled />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Total Amount</label>
                  <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.payment.totalAmount} readOnly disabled />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Payment Method</label>
                  <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.payment.paymentMethod} readOnly disabled />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Payment Time</label>
                  <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={formatDateTime(viewAppointment.payment.paymentTime)} readOnly disabled />
                </div>
                {/* Discount info inside payment */}
                <div>
                  <label className="block mb-1 text-sm font-medium">Discount Code</label>
                  <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.payment.discountInfo?.code ?? ""} readOnly disabled />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Discount %</label>
                  <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.payment.discountInfo?.percent ?? ""} readOnly disabled />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Discount Amount</label>
                  <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={viewAppointment.payment.discountInfo?.amount ?? ""} readOnly disabled />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Payment Created</label>
                  <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={formatDateTime(viewAppointment.payment.createdAt)} readOnly disabled />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Payment Updated</label>
                  <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={formatDateTime(viewAppointment.payment.updatedAt)} readOnly disabled />
                </div>
              </div>
            ) : <div className="mb-2 text-slate-400 text-sm">No payment data</div>}
            {/* --- SESSIONS --- */}
            <h3 className="font-semibold mb-2 mt-6 text-blue-900">Sessions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border mb-2">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Slot</th>
                    <th className="px-3 py-2 text-left">Therapist</th>
                    <th className="px-3 py-2 text-left">Checked In</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(viewAppointment.sessions) && viewAppointment.sessions.length > 0) ? (
                    viewAppointment.sessions.map((s, idx) => (
                      <tr key={s._id || idx} className="border-t">
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2">{s.date ? dayjs(s.date).format("YYYY-MM-DD") : "-"}</td>
                        <td className="px-3 py-2">
                          {SESSION_TIME_OPTIONS.find(opt => opt.id === s.slotId)?.label || s.slotId || "--"}
                        </td>
                        <td className="px-3 py-2">
                          {s.therapist ? (
                            <>
                              {displayTherapistName(s.therapist)}
                              {s.therapist.therapistId ? (
                                <span className="ml-1 text-xs text-blue-800 font-mono">[{s.therapist.therapistId}]</span>
                              ) : null}
                            </>
                          ) : "-"}
                        </td>
                        <td className="px-3 py-2">
                          {s.isCheckedIn === true ? (
                            <span className="inline-block rounded bg-green-50 text-green-700 px-2 py-1 font-semibold">
                              Yes
                            </span>
                          ) : s.isCheckedIn === false ? (
                            <span className="inline-block rounded bg-red-50 text-red-700 px-2 py-1 font-semibold">
                              No
                            </span>
                          ) : (
                            <span className="inline-block rounded bg-gray-50 text-gray-500 px-2 py-1">
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-5 text-center text-slate-400">No session data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="px-5 py-2 rounded border font-semibold"
                onClick={() => setViewAppointment(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
