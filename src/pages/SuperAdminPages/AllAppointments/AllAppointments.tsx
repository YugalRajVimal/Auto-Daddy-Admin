import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  FiHash,
  FiUser,
  FiPackage,
  FiChevronDown,
  FiMail,
  FiPhone,
  FiCheckCircle,
  FiCalendar,
  FiDollarSign,
  FiGift,
  FiUserCheck,
  FiChevronRight,
  FiSearch,
  FiRefreshCcw
} from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_URL;

// Helpful utility functions for formatting
function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}
function formatShortDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}
function maskPhone(phone?: string) {
  if (!phone) return "-";
  return phone.length >= 10 ? phone.replace(/.(?=.{4})/g, "•") : phone;
}
function humanGender(val?: string) {
  if (!val) return "-";
  if (val === "M" || val === "Male") return "Male";
  if (val === "F" || val === "Female") return "Female";
  return val;
}
function yearsFromDOB(dob?: string) {
  if (!dob) return "-";
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return "-";
  const diff = Date.now() - birth.getTime();
  const dateDiff = new Date(diff);
  return Math.abs(dateDiff.getUTCFullYear() - 1970) + " yrs";
}

// Collapsable Single Appointment Card Component
const AppointmentCard = ({
  booking,
  isOpen,
  toggleOpen,
}: {
  booking: any;
  isOpen: boolean;
  toggleOpen: () => void;
}) => {
  // Patient name & id
  const patientName = booking.patient?.name || "-";
  const patientId = booking.patient?.patientId || "-";
  // Therapist name & id
  const therapistName = booking.therapist?.userId?.name || "-";
  const therapistId = booking.therapist?.therapistId || "-";
  const therapist_ObjId = booking.therapist?._id || booking.therapist?.userId?._id || booking.therapist?.therapistId || "";

  // Patient "href"
  const patientHref =
    patientId && patientId !== "-"
      ? `/super-admin/children?patientId=${encodeURIComponent(patientId)}`
      : undefined;
  // Therapist "href"
  const therapistHref =
    therapist_ObjId && therapist_ObjId !== "-"
      ? `/super-admin/therapists?therapist=${encodeURIComponent(therapist_ObjId)}`
      : undefined;

  return (
    <div
      className={`rounded-lg border bg-gradient-to-br from-blue-50 to-slate-50 shadow hover:shadow-lg transition-all duration-150 overflow-hidden`}
      key={booking._id}
    >
      {/* Top bar: Appointment Meta - clickable to expand/collapse */}
      <button
        className={`w-full bg-blue-100 px-6 py-4 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-1 outline-none focus:outline-blue-300 cursor-pointer`}
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-controls={`appointment-details-${booking._id}`}
        type="button"
        style={{ textAlign: "left" }}
      >
        <div className="flex flex-col md:flex-row justify-between  md:items-center gap-1 md:gap-6 text-base font-mono w-full">
          <div className="flex items-center gap-3">
            {isOpen ? (
              <FiChevronDown className="text-slate-400" />
            ) : (
              <FiChevronRight className="text-slate-400" />
            )}
            <FiHash className="text-blue-400" />
            <span className="font-bold text-blue-900 text-lg">
              {booking.appointmentId || booking._id}
            </span>
            <span className="px-2 text-base text-slate-500 font-sans font-medium">
              ({formatShortDate(booking.createdAt)})
            </span>
            {/* Patient quick info */}
            <span className="flex items-center gap-1 bg-yellow-50 rounded px-2 py-1 text-slate-800 text-base">
              <FiUserCheck className="text-orange-500" />
              {patientHref ? (
                <>
                  <a
                    href={patientHref}
                    className="font-semibold text-blue-700 underline hover:text-blue-900 transition"
                    title={patientName}
                    tabIndex={0}
                    onClick={e => e.stopPropagation()}
                  >
                    {patientName}
                  </a>
                  <a
                    href={patientHref}
                    className="text-sm font-mono text-blue-700 underline hover:text-blue-900 transition"
                    title={patientId}
                    tabIndex={0}
                    onClick={e => e.stopPropagation()}
                  >
                    [{patientId}]
                  </a>
                </>
              ) : (
                <>
                  <span className="font-semibold">{patientName}</span>
                  <span className="text-sm font-mono text-blue-700">[{patientId}]</span>
                </>
              )}
            </span>
            {/* Therapist quick info */}
            <span className="flex items-center gap-1 bg-purple-50 rounded px-2 py-1 text-purple-900 text-base">
              <FiUser className="text-sky-600" />
              {therapistHref ? (
                <>
                  <a
                    href={therapistHref}
                    className="font-semibold text-blue-700 underline hover:text-blue-900 transition"
                    title={therapistName}
                    tabIndex={0}
                    onClick={e => e.stopPropagation()}
                  >
                    {therapistName}
                  </a>
                  <a
                    href={therapistHref}
                    className="text-sm font-mono text-blue-700 underline hover:text-blue-900 transition"
                    title={therapistId}
                    tabIndex={0}
                    onClick={e => e.stopPropagation()}
                  >
                    [{therapistId}]
                  </a>
                </>
              ) : (
                <>
                  <span className="font-semibold">{therapistName}</span>
                  <span className="text-sm font-mono text-blue-700">[{therapistId}]</span>
                </>
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:gap-6 mt-1 md:mt-0"></div>
          <div>
            {booking.payment?.status && (
              <span
                className={`inline-flex items-center px-2 rounded text-base ${
                  booking.payment.status === "completed"
                    ? "bg-green-50 text-green-800"
                    : booking.payment.status === "pending"
                    ? "bg-yellow-50 text-yellow-900"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                <FiDollarSign className="mr-1" /> Payment:{" "}
                {booking.payment.status}
              </span>
            )}
            {booking.discountInfo?.coupon &&
              booking.discountInfo?.coupon?.discountEnabled && (
                <span className="inline-flex items-center px-2 rounded text-base bg-blue-50 text-blue-800 border border-blue-300">
                  <FiGift className="mr-1 text-blue-400" />
                  {booking.discountInfo.coupon.discount}% off (
                  {booking.discountInfo.coupon.couponCode})
                </span>
              )}
          </div>
        </div>
      </button>
      {/* Collapsable details */}
      <div
        className={`transition-all duration-200 ${
          isOpen ? "max-h-[3600px] opacity-100 py-0" : "max-h-0 opacity-0 py-0"
        } overflow-hidden`}
        id={`appointment-details-${booking._id}`}
        aria-hidden={!isOpen}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 px-6 py-6">
          {/* Patient Details (collapsable inner section) */}
          <details open className="mb-4 group">
            <summary className="flex items-center gap-3 mb-2 cursor-pointer select-none">
              <FiUserCheck className="text-orange-500" />
              <span className="font-semibold text-lg text-blue-900 tracking-tight">
                Patient Details
              </span>
              <FiChevronDown className="ml-1 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="text-[15px]">
              {/* Patient name & id PROMINENT */}
              <div className="flex gap-2 mb-1 flex-wrap items-center">
                <span className="font-medium text-slate-700 text-base">
                  Name:{" "}
                  {patientHref ? (
                    <a
                      href={patientHref}
                      className="font-semibold text-blue-700 underline hover:text-blue-900 transition"
                      title={patientName}
                      tabIndex={0}
                    >
                      {patientName}
                    </a>
                  ) : (
                    <span className="font-semibold">{patientName}</span>
                  )}
                </span>
                {patientHref ? (
                  <a
                    href={patientHref}
                    className="text-xs px-2 py-1 rounded bg-slate-100 font-mono text-blue-700 underline hover:text-blue-900 transition"
                    title={patientId}
                    tabIndex={0}
                  >
                    ID: {patientId}
                  </a>
                ) : (
                  <span className="text-xs px-2 py-1 rounded bg-slate-100 font-mono text-blue-700">
                    ID: {patientId}
                  </span>
                )}
                <span className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-700">
                  {yearsFromDOB(booking.patient?.childDOB)} old
                </span>
                <span className="text-xs px-2 py-1 rounded bg-pink-50 text-pink-700">
                  {humanGender(booking.patient?.gender)}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 items-center text-slate-600 mb-2">
                <span className="flex items-center gap-1">
                  <FiMail className="inline" />{" "}
                  {booking.patient?.parentEmail || booking.patient?.userId?.email}
                </span>
                <span className="flex items-center gap-1">
                  <FiPhone className="inline" />{" "}
                  {maskPhone(
                    booking.patient?.mobile1 || booking.patient?.userId?.phone
                  )}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="font-medium text-slate-700">
                    Father's Name
                  </div>
                  <div>{booking.patient?.fatherFullName || "-"}</div>
                </div>
                <div>
                  <div className="font-medium text-slate-700">
                    Mother's Name
                  </div>
                  <div>{booking.patient?.motherFullName || "-"}</div>
                </div>
                <div>
                  <div className="font-medium text-slate-700">Address</div>
                  <div>
                    {booking.patient?.address || "-"},{" "}
                    {booking.patient?.areaName || ""}
                  </div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="font-medium text-slate-700">
                    Diagnosis Info
                  </div>
                  <div className="text-slate-700 text-sm">
                    {booking.patient?.diagnosisInfo || "-"}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-slate-700">
                    Child's DOB
                  </div>
                  <div>{formatShortDate(booking.patient?.childDOB)}</div>
                </div>
              </div>
            </div>
          </details>
          {/* Package, Therapy, Therapist Section (collapsable inner section) */}
          <details open className="group">
            <summary className="flex items-center gap-3 mb-1 cursor-pointer select-none">
              <FiPackage className="text-purple-500" />
              <span className="font-semibold text-lg text-purple-800 tracking-tight">
                Package & Therapy
              </span>
              <FiChevronDown className="ml-1 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div>
              <div className="flex flex-col gap-1 text-slate-700 pl-6">
                <span>
                  <span className="font-semibold">Package: </span>
                  {booking.package?.name || "-"}{" "}
                  {booking.package?.sessionCount && (
                    <span className="text-xs text-orange-500">
                      ({booking.package.sessionCount} sessions)
                    </span>
                  )}{" "}
                  {booking.package?.totalCost && (
                    <span className="font-semibold text-green-700 text-xs">
                      ₹{booking.package.totalCost}
                    </span>
                  )}
                </span>
                <span>
                  <span className="font-semibold">Therapy: </span>
                  {booking.therapy?.name || "-"}
                </span>
              </div>
              {booking.discountInfo?.coupon?.discountEnabled && (
                <div className="mt-2 flex items-center gap-2 text-blue-700 text-xs bg-blue-50 rounded px-2 py-1 w-fit">
                  <FiGift className="mr-1" />
                  <span>{booking.discountInfo?.coupon.couponCode}:</span>
                  <span className="font-bold">
                    {booking.discountInfo?.coupon.discount}% OFF
                  </span>
                  {booking.discountInfo?.coupon?.validityDays && (
                    <span>
                      (valid for {booking.discountInfo.coupon.validityDays} days)
                    </span>
                  )}
                  {booking.discountInfo?.time && (
                    <span className="text-slate-500 ml-2">
                      Availed: {formatShortDate(booking.discountInfo.time)}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="mb-2 mt-4">
              <details open className="group">
                <summary className="flex items-center gap-3 mb-1 cursor-pointer select-none">
                  <FiUser className="text-sky-600" />
                  <span className="font-semibold text-lg text-blue-700 tracking-tight">
                    Therapist
                  </span>
                  <FiChevronDown className="ml-1 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="flex flex-col pl-6 gap-1 text-slate-700">
                  {/* Therapist name & id PROMINENT */}
                  <span className="font-semibold">
                    Name:{" "}
                    {therapistHref ? (
                      <a
                        href={therapistHref}
                        className="text-blue-700 underline hover:text-blue-900 transition font-semibold"
                        title={therapistName}
                        tabIndex={0}
                      >
                        {therapistName}
                      </a>
                    ) : (
                      <span>{therapistName}</span>
                    )}
                    {therapistHref ? (
                      <a
                        href={therapistHref}
                        className="ml-2 text-xs font-mono text-blue-700 underline hover:text-blue-900 transition"
                        title={therapistId}
                        tabIndex={0}
                      >
                        ID: {therapistId}
                      </a>
                    ) : (
                      <span className="ml-2 text-xs font-mono text-blue-700">
                        ID: {therapistId}
                      </span>
                    )}
                  </span>
                  <span className="text-xs flex items-center gap-2">
                    {booking.therapist?.userId?.email && (
                      <span className="flex items-center gap-1">
                        <FiMail />
                        {booking.therapist.userId.email}
                      </span>
                    )}
                    {booking.therapist?.mobile1 && (
                      <span className="flex items-center gap-1">
                        <FiPhone />
                        {maskPhone(booking.therapist.mobile1)}
                      </span>
                    )}
                    {(booking.therapist?.experienceYears ||
                      booking.therapist?.experience) && (
                      <span>
                        {booking.therapist.experienceYears ||
                          booking.therapist.experience}{" "}
                        yrs exp
                      </span>
                    )}
                  </span>
                  <span className="text-xs italic text-slate-500">
                    {booking.therapist?.specializations}
                  </span>
                  <span className="text-xs">
                    {booking.therapist?.address}
                  </span>
                </div>
              </details>
            </div>
            {/* Payment block */}
            {booking.payment && (
              <div className="bg-green-50 border-green-200 rounded p-2 mt-2 text-xs w-fit">
                <span className="font-semibold flex items-center text-green-800 gap-2">
                  <FiDollarSign className="inline" />
                  Payment:&nbsp;{" "}
                  <span className="text-green-700">
                    ₹{booking.payment.amount}
                  </span>
                  <span className="ml-2 text-xs text-gray-600">
                    ({booking.payment.paymentMethod})
                  </span>
                </span>
                <div className="text-xs text-slate-500 font-mono">
                  ID: {booking.payment.paymentId}
                </div>
              </div>
            )}
          </details>
        </div>
        {/* Sessions Table (collapsable inner section) */}
        {Array.isArray(booking.sessions) && booking.sessions.length > 0 && (
          <details className="px-6 pb-5 group" open>
            <summary className="mb-2 mt-2 text-xs text-slate-700 open:bg-slate-50 rounded border border-slate-200 font-semibold cursor-pointer select-none flex items-center py-2">
              <FiCalendar className="mr-2 text-blue-400" />
              <span>
                Session Details ({booking.sessions.length})
              </span>
              <span className="ml-2">
                <FiChevronDown className="inline text-slate-400 group-open:rotate-180 transition-transform" />
              </span>
            </summary>
            <div className="overflow-x-auto mt-2">
              <table className="min-w-[560px] w-fit border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
                      #
                    </th>
                    <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
                      Date
                    </th>
                    <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
                      Time Slot
                    </th>
                    <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
                      Therapist
                    </th>
                    <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
                      Therapy Type
                    </th>
                    <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
                      Checked In
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {booking.sessions.map((s: any, idx: number) => {
                    // Therapist link for each session, use therapist._id or therapist.userId._id or therapist.therapistId
                    const sessionTherapistName = s.therapist?.userId?.name || "-";
                    const sessionTherapistId = s.therapist?.therapistId || "-";
                    const sessionTherapist_ObjId = s.therapist?._id || s.therapist?.userId?._id || s.therapist?.therapistId || "";
                    const sessionTherapistHref =
                      sessionTherapist_ObjId && sessionTherapist_ObjId !== "-"
                        ? `/super-admin/therapists?therapist=${encodeURIComponent(sessionTherapist_ObjId)}`
                        : undefined;
                    return (
                      <tr key={s._id || s.date + s.slotId}>
                        <td className="px-2 py-1 border border-slate-200 text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-2 py-1 border border-slate-200 text-blue-900">
                          {formatShortDate(s.date)}
                        </td>
                        <td className="px-2 py-1 border border-slate-200">
                          <span className="bg-slate-100 rounded px-2 font-mono">
                            {s.slotId || "-"}
                          </span>
                        </td>
                        <td className="px-2 py-1 border border-slate-200">
                          {/* Therapist name & id in session table */}
                          {sessionTherapistHref ? (
                            <>
                              <a
                                href={sessionTherapistHref}
                                className="text-blue-700 underline hover:text-blue-900 font-semibold transition"
                                title={sessionTherapistName}
                                tabIndex={0}
                                onClick={e => e.stopPropagation()}
                              >
                                {sessionTherapistName}
                              </a>
                              {s.therapist?.therapistId && (
                                <a
                                  href={sessionTherapistHref}
                                  className="ml-2 text-xs font-mono text-blue-700 underline hover:text-blue-900 transition"
                                  title={sessionTherapistId}
                                  tabIndex={0}
                                  onClick={e => e.stopPropagation()}
                                >
                                  [{sessionTherapistId}]
                                </a>
                              )}
                            </>
                          ) : (
                            <>
                              {sessionTherapistName}
                              {s.therapist?.therapistId && (
                                <span className="ml-2 text-xs font-mono text-blue-800">
                                  [{sessionTherapistId}]
                                </span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-2 py-1 border border-slate-200">
                          {s.therapyTypeId?.name || "-"}
                        </td>
                        <td className="px-2 py-1 border border-slate-200 text-center">
                          {s.isCheckedIn ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <FiCheckCircle className="inline" /> Yes
                            </span>
                          ) : (
                            <span className="text-slate-400">No</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        )}
        <div className="bg-slate-50 text-xs text-slate-500 px-6 py-1 flex flex-wrap gap-x-6 gap-y-1 border-t border-slate-200">
          <span>Created: {formatDate(booking.createdAt)}</span>
          <span>Updated: {formatDate(booking.updatedAt)}</span>
          {booking.appointmentDate && (
            <span>
              Appointment Date: {formatDate(booking.appointmentDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// --- FILTER & PAGINATION LOGIC ---

interface AppointmentListResponse {
  bookings: any[];
  total: number;
}

const SEARCH_DEBOUNCE = 350;

// Stateless Controls component to keep controls and data separated
const AppointmentFilters: React.FC<{
  search: string;
  setSearch: (v: string) => void;
}> = ({ search, setSearch }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col md:flex-row gap-3 items-start md:items-center mb-6">
      <div className="relative w-full md:w-64">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
          type="text"
          placeholder="Search by Patient, Appointment ID, Email, Phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
};

const PageControls: React.FC<{
  page: number;
  total: number;
  pageSize: number;
  setPage: (p: number) => void;
}> = ({ page, total, pageSize, setPage }) => {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex gap-4 mt-6 justify-center items-center select-none text-sm">
      <button
        className="px-2 py-1 rounded border border-slate-200 bg-white disabled:opacity-70"
        disabled={page <= 1}
        onClick={() => setPage(1)}
        aria-label="First page"
      >
        {"<<"}
      </button>
      <button
        className="px-2 py-1 rounded border border-slate-200 bg-white disabled:opacity-70"
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
        aria-label="Prev page"
      >
        {"<"}
      </button>
      <span>
        Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
      </span>
      <button
        className="px-2 py-1 rounded border border-slate-200 bg-white disabled:opacity-70"
        disabled={page >= totalPages}
        onClick={() => setPage(page + 1)}
        aria-label="Next page"
      >
        {">"}
      </button>
      <button
        className="px-2 py-1 rounded border border-slate-200 bg-white disabled:opacity-70"
        disabled={page >= totalPages}
        onClick={() => setPage(totalPages)}
        aria-label="Last page"
      >
        {">>"}
      </button>
      <span className="ml-2 text-slate-400">
        {total} result{total === 1 ? "" : "s"}
      </span>
    </div>
  );
};

// Main AllAppointments Component
const APPOINTMENTS_PAGE_SIZE = 10;

const AllAppointments: React.FC = () => {
  // UI Controls state
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Data state (decoupled from controls)
  const [appointments, setAppointments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [openIndexes, setOpenIndexes] = useState<{ [key: string]: boolean }>({});

  // Debounced search for efficiency
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch appointments whenever page or search changes
  useEffect(() => {
    setLoading(true);
    setError("");
    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const callTimeout = setTimeout(async () => {
      try {
        // Build params
        const params: any = {
          page,
          limit: APPOINTMENTS_PAGE_SIZE,
        };
        if (search.trim()) params.search = search;
        // No status filter!
        const response = await axios.get<AppointmentListResponse>(
          `${API_BASE}/api/super-admin/all-appointments`,
          { params }
        );
        if (response.data && Array.isArray(response.data.bookings)) {
          setAppointments(response.data.bookings);
          setTotal(response.data.total ?? response.data.bookings.length);
        } else {
          setAppointments([]);
          setTotal(0);
          setError("Failed to fetch appointments.");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Error fetching appointments");
        setAppointments([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE);

    debounceRef.current = callTimeout;

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [page, search]);

  // Keep filter values and table display decoupled
  // Reset page if search changes (but not when paginating)
  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleToggle = (key: string) => {
    setOpenIndexes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleRefresh = () => {
    // Use by clicking refresh button, resets and refetches data
    setError("");
    setLoading(true);
    setSearch("");
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-6">
      <div className="flex flex-row items-center justify-between mb-2">
        <h2 className="text-2xl font-semibold text-blue-800 flex items-center gap-2 mb-0">
          <FiHash className="text-blue-400" /> All Appointments
        </h2>
        <button
          className="ml-2 px-3 py-2 rounded bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-200 flex items-center gap-2 text-sm"
          type="button"
          onClick={handleRefresh}
          title="Reset Filters"
        >
          <FiRefreshCcw />
          Reset Filters
        </button>
      </div>
      {/* Filters/Search Inputs */}
      <AppointmentFilters
        search={search}
        setSearch={setSearch}
      />
      {/* Table Section */}
      {loading ? (
        <div className="py-8 flex items-center text-slate-500">Loading appointments...</div>
      ) : error ? (
        <div className="py-8 text-red-600">{error}</div>
      ) : appointments.length === 0 ? (
        <div className="text-slate-600 py-8">No appointments found.</div>
      ) : (
        <div className="space-y-8">
          {appointments.map((booking) => (
            <AppointmentCard
              booking={booking}
              isOpen={!!openIndexes[booking._id]}
              toggleOpen={() => handleToggle(booking._id)}
              key={booking._id}
            />
          ))}
        </div>
      )}
      {/* PAGINATION CONTROLS */}
      <PageControls
        page={page}
        setPage={setPage}
        pageSize={APPOINTMENTS_PAGE_SIZE}
        total={total}
      />
    </div>
  );
};

export default AllAppointments;