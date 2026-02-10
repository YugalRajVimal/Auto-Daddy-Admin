import { useEffect, useState, useRef } from "react";
import {
  FiCalendar,
  FiUser,
  FiEdit2,
  FiCheck,
  FiX,
  FiSave,
  FiChevronDown,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";
import { motion } from "framer-motion";
import dayjs from "dayjs";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// --- TYPE DEFINITIONS (unchanged, omitted for brevity - keep all from the original!) ---
type TherapistType = {
  _id: string;
  userId: {
    _id: string;
    name: string;
  } | string;
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
  [key: string]: any;
};
type PatientType = {
  _id: string;
  userId: string;
  patientId: string;
  gender: string;
  childDOB: string;
  name: string;
  [key: string]: any;
};
type EditRequestSessionEntry = {
  sessionId: string;
  newDate: string;
  newSlotId: string;
};
type EditRequestType = {
  _id: string;
  appointmentId: string;
  patientId: string;
  sessions: EditRequestSessionEntry[];
  status: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};
type AppointmentType = {
  _id: string;
  appointmentId?: string;
  patient?: PatientType;
  sessions: SessionType[];
  createdAt: string;
  updatedAt: string;
  editRequests?: EditRequestType[];
  [key: string]: any;
};
const SESSION_TIME_OPTIONS = [
  { id: "1000-1045", label: "10:00 to 10:45", limited: false },
  { id: "1045-1130", label: "10:45 to 11:30", limited: false },
  { id: "1130-1215", label: "11:30 to 12:15", limited: false },
  { id: "1215-1300", label: "12:15 to 13:00", limited: false },
  { id: "1300-1345", label: "13:00 to 13:45", limited: false },
  { id: "1415-1500", label: "14:15 to 15:00", limited: false },
  { id: "1500-1545", label: "15:00 to 15:45", limited: false },
  { id: "1545-1630", label: "15:45 to 16:30", limited: false },
  { id: "1630-1715", label: "16:30 to 17:15", limited: false },
  { id: "1715-1800", label: "17:15 to 18:00", limited: false },
  { id: "0830-0915", label: "08:30 to 09:15", limited: true },
  { id: "0915-1000", label: "09:15 to 10:00", limited: true },
  { id: "1800-1845", label: "18:00 to 18:45", limited: true },
  { id: "1845-1930", label: "18:45 to 19:30", limited: true },
  { id: "1930-2015", label: "19:30 to 20:15", limited: true },
];
const SLOT_TIME_LOOKUP: Record<string, { start: string; end: string }> = {
  "1000-1045": { start: "10:00", end: "10:45" },
  "1045-1130": { start: "10:45", end: "11:30" },
  "1130-1215": { start: "11:30", end: "12:15" },
  "1215-1300": { start: "12:15", end: "13:00" },
  "1300-1345": { start: "13:00", end: "13:45" },
  "1415-1500": { start: "14:15", end: "15:00" },
  "1500-1545": { start: "15:00", end: "15:45" },
  "1545-1630": { start: "15:45", end: "16:30" },
  "1630-1715": { start: "16:30", end: "17:15" },
  "1715-1800": { start: "17:15", end: "18:00" },
  "0830-0915": { start: "08:30", end: "09:15" },
  "0915-1000": { start: "09:15", end: "10:00" },
  "1800-1845": { start: "18:00", end: "18:45" },
  "1845-1930": { start: "18:45", end: "19:30" },
  "1930-2015": { start: "19:30", end: "20:15" },
};
type SessionEditState = {
  [sessionKey: string]: {
    date: string;
    slotId: string;
    error?: string | null;
    requested?: boolean;
    status?: string;
    therapistName?: string;
    originalDate?: string;
    originalSlotId?: string;
    isEditedSlot?: boolean;
    pendingRequestNewDate?: string | null;
    pendingRequestNewSlotId?: string | null;
  };
};

// --- SEARCH & PAGINATION HOOKS ---

function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- UTILS (original utilities, unchanged) ---
function getSlotDateTime(dateStr: string, slotId?: string) {
  if (!dateStr || !slotId) return null;
  const slot = SLOT_TIME_LOOKUP[slotId];
  if (!slot) return null;
  const dt = dayjs(`${dateStr}T${slot.start}`);
  return dt.isValid() ? dt : null;
}
function isLessThan2Hours(dt: dayjs.Dayjs | null) {
  if (!dt) return false;
  const now = dayjs();
  const diffMinutes = dt.diff(now, "minute");
  return diffMinutes <= 120;
}
function isSessionLocked2Hr(dateStr: string, slotId?: string) {
  const slotDt = getSlotDateTime(dateStr, slotId);
  if (!slotDt) return false;
  return isLessThan2Hours(slotDt);
}
function willSelectionBeLocked2Hr(dateStr: string, slotId: string) {
  if (!dateStr || !slotId) return false;
  return isSessionLocked2Hr(dateStr, slotId);
}

export default function RequestEditInAppointment() {
  // -- Search & Pagination state -- keeps these separated from appointments
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 350);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // -- Table data --
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(false);

  // A ref so that after modal closes we reload or stay at same search/pagination.
  const reloadKey = useRef(0);

  // -- Modal/Edit states --
  const [viewAppointment, setViewAppointment] = useState<AppointmentType | null>(null);
  const [sessionEditState, setSessionEditState] = useState<SessionEditState>({});
  const [requestEditMessage, setRequestEditMessage] = useState<string | null>(
    null
  );
  const [editAllMode, setEditAllMode] = useState(false);
  const [submittingAll, setSubmittingAll] = useState(false);
  const [submitAllError, setSubmitAllError] = useState<string | null>(null);
  const [expandedEditRequests, setExpandedEditRequests] = useState<{
    [editRequestId: string]: boolean;
  }>({});

  // -- Utility/Mapping --
  function getSessionPendingRequestMap(appointment: AppointmentType) {
    const sessionReqMap: Record<
      string,
      { status: string; newDate?: string; newSlotId?: string }
    > = {};
    const validEditRequests = Array.isArray(appointment.editRequests)
      ? appointment.editRequests.filter(
          (er) => er.status === "pending" || er.status === "approved"
        )
      : [];
    validEditRequests.forEach((editReq) => {
      (editReq.sessions || []).forEach((sessionObj) => {
        const sessionIdStr =
          sessionObj.sessionId?.toString?.() || `${sessionObj.sessionId}`;
        sessionReqMap[sessionIdStr] = {
          status: editReq.status,
          newDate: sessionObj.newDate,
          newSlotId: sessionObj.newSlotId,
        };
      });
    });
    return sessionReqMap;
  }
  function appointmentHasPendingRequest(appointment: AppointmentType) {
    if (!appointment || !Array.isArray(appointment.editRequests)) return false;
    return appointment.editRequests.some(
      (er) => er.status === "pending" || er.status === "approved"
    );
  }

  // -- FETCH: Search & paginated table --
  useEffect(() => {
    setLoading(true);
    const patientToken = localStorage.getItem("patient-token");
    // Compose query: search, page, pageSize
    const params = new URLSearchParams();
    params.append("page", String(currentPage));
    params.append("limit", String(pageSize));
    if (debouncedSearchText.length > 0) params.append("search", debouncedSearchText);

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
          setTotalCount(raw.total || raw.count || raw.data.length); // Make sure backend sends total count for pagination! (else fallback)
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
    // Only refetch when these change (not when edit modal is closed)
    // eslint-disable-next-line
  }, [debouncedSearchText, currentPage, pageSize, reloadKey.current]);

  // -- Session edit state per appointment MODAL
  useEffect(() => {
    setEditAllMode(false);
    setSubmittingAll(false);
    setSubmitAllError(null);

    if (!viewAppointment) {
      setSessionEditState({});
      setRequestEditMessage(null);
      setExpandedEditRequests({});
      return;
    }

    setExpandedEditRequests({});
    const pendingMap = getSessionPendingRequestMap(viewAppointment);
    const newState: SessionEditState = {};

    (viewAppointment.sessions || []).forEach((s, idx) => {
      const key = s._id || `idx${idx}`;
      let requested = false;
      let reqStatus: string | undefined = s.status;

      let pendingReqVal =
        pendingMap[s._id ? s._id.toString?.() || `${s._id}` : key];

      if (pendingReqVal) {
        requested = true;
        reqStatus = pendingReqVal.status;
      }

      newState[key] = {
        date: s.date,
        slotId: s.slotId || "",
        originalDate: s.date,
        originalSlotId: s.slotId || "",
        error: null,
        requested,
        status: reqStatus,
        therapistName:
          typeof s.therapist === "object"
            ? typeof s.therapist.userId === "object"
              ? s.therapist.userId.name
              : ""
            : "",
        isEditedSlot: false,
        pendingRequestNewDate: pendingReqVal?.newDate || null,
        pendingRequestNewSlotId: pendingReqVal?.newSlotId || null,
      };
    });
    setSessionEditState(newState);
    setRequestEditMessage(null);
  }, [viewAppointment]);

  // Isn't reloaded after closing modal by default!
  function reloadTableDataAfterEdit() {
    reloadKey.current += 1;
    setViewAppointment(null);
    // triggers refetch by bumping reloadKey
  }

  // --- Search/Pagination UI & HANDLERS ---
  function handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchText(e.target.value);
    setCurrentPage(1);
  }
  function handlePageSizeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  }
  function handlePage(page: number) {
    if (page < 1) return;
    const maxPage = Math.ceil(totalCount / pageSize) || 1;
    if (page > maxPage) return;
    setCurrentPage(page);
  }
  // --- EDIT BULK ACTIONS (unchanged) ---
  const handleEditAllClick = () => {
    setEditAllMode(true);
    setSubmitAllError(null);
    setRequestEditMessage(null);

    setSessionEditState((prev) => {
      const next: SessionEditState = {};
      for (const k in prev) {
        next[k] = {
          ...prev[k],
          isEditedSlot: false,
        };
      }
      return next;
    });
  };
  const handleSessionFieldChange = (
    key: string,
    field: "date" | "slotId",
    value: string
  ) => {
    setSessionEditState((prev) => {
      const prevState = prev[key] || {};
      const originalDate = prevState.originalDate ?? prevState.date;
      const originalSlotId = prevState.originalSlotId ?? prevState.slotId;

      let isEditedSlot = prevState.isEditedSlot ?? false;
      let newDate = field === "date" ? value : prevState.date;
      let newSlotId = field === "slotId" ? value : prevState.slotId;
      isEditedSlot =
        (originalDate !== undefined &&
          newDate !== undefined &&
          newDate !== originalDate) ||
        (originalSlotId !== undefined &&
          newSlotId !== undefined &&
          newSlotId !== originalSlotId);
      return {
        ...prev,
        [key]: {
          ...prevState,
          [field]: value,
          isEditedSlot,
          error: null,
        },
      };
    });
  };
  const handleCancelEditAll = () => {
    setEditAllMode(false);
    setSubmitAllError(null);
    setRequestEditMessage(null);

    setSessionEditState((prev) => {
      const reset: SessionEditState = {};
      for (const key in prev) {
        reset[key] = {
          ...prev[key],
          date: prev[key].originalDate || prev[key].date,
          slotId: prev[key].originalSlotId || prev[key].slotId,
          isEditedSlot: false,
          error: null,
        };
      }
      return reset;
    });
  };
  const handleSubmitAllEdit = async () => {
    setSubmittingAll(true);
    setSubmitAllError(null);
    setRequestEditMessage(null);

    const sessionsToRequest = Object.entries(sessionEditState).filter(
      ([, v]) => !v.requested && v.isEditedSlot
    );

    // Check for 2hr lock for all edited sessions
    for (const [k, v] of sessionsToRequest) {
      if (!v.date || !v.slotId) {
        setSessionEditState((prev) => ({
          ...prev,
          [k]: { ...prev[k], error: "Date and slot are required." },
        }));
        setSubmittingAll(false);
        setSubmitAllError(
          "Please fill date & slot for all edited sessions to request."
        );
        return;
      }
      if (willSelectionBeLocked2Hr(v.date, v.slotId)) {
        setSessionEditState((prev) => ({
          ...prev,
          [k]: {
            ...prev[k],
            error:
              "Cannot request edit for session within 2 hours of its scheduled time.",
          },
        }));
        setSubmittingAll(false);
        setSubmitAllError(
          "One or more sessions cannot be edited less than 2 hours before the scheduled time."
        );
        return;
      }
    }

    const bulkSessionRequests = sessionsToRequest.map(([k, v]) => ({
      sessionId: k.startsWith("idx") ? null : k,
      newDate: v.date,
      newSlotId: v.slotId,
    }));

    let sessionObjMap: Record<string, string | undefined> = {};
    if (viewAppointment && Array.isArray(viewAppointment.sessions)) {
      viewAppointment.sessions.forEach((s, idx) => {
        const key = s._id || `idx${idx}`;
        sessionObjMap[key] = s._id;
      });
    }
    const filteredRequests = bulkSessionRequests
      .map((item, idx) => {
        let sessionKey = sessionsToRequest[idx][0];
        return {
          sessionId: sessionObjMap[sessionKey],
          newDate: item.newDate,
          newSlotId: item.newSlotId,
        };
      })
      .filter((item) => !!item.sessionId);

    if (!filteredRequests.length) {
      setSubmittingAll(false);
      setSubmitAllError(
        "Please modify at least one session's date or slot before submitting."
      );
      return;
    }

    const payload = {
      appointmentId: viewAppointment?._id,
      patientId: viewAppointment?.patient?.patientId,
      sessions: filteredRequests,
    };

    try {
      let resp = await fetch(
        `${API_BASE_URL}/api/parent/session-edit-request-bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!resp.ok) {
        let errText;
        try {
          const err = await resp.json();
          errText = err?.message || "Failed to request edit.";
        } catch {
          errText = "Failed to request edit.";
        }
        throw new Error(errText);
      }
      setSessionEditState((prev) => {
        let next = { ...prev };
        for (const [k] of sessionsToRequest) {
          next[k] = {
            ...next[k],
            requested: true,
            error: null,
            isEditedSlot: false,
          };
        }
        return next;
      });
      setEditAllMode(false);
      setSubmittingAll(false);
      setRequestEditMessage(
        "Edit request(s) sent to admin/center. Please wait for confirmation."
      );
      reloadTableDataAfterEdit();
    } catch (e: any) {
      setSubmittingAll(false);
      setSubmitAllError(e?.message || "Failed to request edit.");
    }
  };

  // EXPAND/COLLAPSE for requested edits in modal
  const toggleEditRequestExpand = (editRequestId: string) => {
    setExpandedEditRequests((prev) => ({
      ...prev,
      [editRequestId]: !prev[editRequestId],
    }));
  };

  function findSessionOldDetails(
    sessionId: string,
    appointment: AppointmentType | null
  ): { oldDate?: string; oldSlotId?: string } {
    if (!appointment || !Array.isArray(appointment.sessions)) return {};

    for (let s of appointment.sessions) {
      if (s._id == sessionId) {
        return {
          oldDate: s.date,
          oldSlotId: s.slotId,
        };
      }
    }
    for (let s of appointment.sessions) {
      if (
        "sessionId" in s &&
        s.sessionId &&
        s.sessionId.toString() === sessionId.toString()
      ) {
        return {
          oldDate: s.date,
          oldSlotId: s.slotId,
        };
      }
    }
    return {};
  }

  // --- UI ---
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-8"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        My Children's Appointments
      </h1>
      {/* Search and Pagination UI (above table, does not get reset on table refresh) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <FiSearch className="text-blue-700 text-xl mr-1" />
          <input
            type="text"
            placeholder="Search by Patient Name, ID, or Appointment ID"
            value={searchText}
            onChange={handleSearchInput}
            className="w-64 md:w-80 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-4 mt-2 md:mt-0">
          <div className="flex items-center gap-2">
            <label className="font-medium mr-1 text-xs text-slate-600">Rows:</label>
            <select
              className="border rounded px-2 py-1 text-xs"
              value={pageSize}
              onChange={handlePageSizeChange}
            >
              {[5, 10, 20, 50].map((num) => (
                <option value={num} key={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
          {/* Pagination nav */}
          <PaginationNav
            currentPage={currentPage}
            pageSize={pageSize}
            totalCount={totalCount}
            onPage={handlePage}
          />
        </div>
      </div>
      {/* Appointment Table */}
      {loading ? (
        <div className="text-center text-slate-400">Loading...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Appointment ID</th>
                <th className="px-4 py-3 text-left">Patient Name</th>
                <th className="px-4 py-3 text-left">Patient ID</th>
                <th className="px-4 py-3 text-center"># Sessions</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-slate-400 text-center">
                    No appointments found.
                  </td>
                </tr>
              )}
              {appointments.map((a) => {
                return (
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
                            {a.patient?.name || (
                              <span className="italic text-slate-400">N/A</span>
                            )}
                          </p>
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
                    <td className="px-4 py-4 text-center font-semibold">
                      {Array.isArray(a.sessions) ? a.sessions.length : 0}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        className="flex items-center gap-1 px-3 py-1 rounded bg-slate-100 hover:bg-blue-50 border border-slate-200 text-blue-700 shadow-sm text-xs"
                        onClick={() => setViewAppointment(a)}
                      >
                        <FiCalendar className="text-blue-500" /> View / Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination nav below table for wide screens */}
      <div className="flex justify-end mt-2">{!loading && (
        <PaginationNav
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={totalCount}
          onPage={handlePage}
        />
      )}</div>

      {/* Modal for appointment details: bulk session edit mode */}
      {viewAppointment && (
        <div className="fixed z-50 inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-[fadeIn_0.15s]">
            <button
              className="absolute top-3 right-4 text-xl text-slate-500 hover:text-red-500"
              onClick={() => setViewAppointment(null)}
            >
              &times;
            </button>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FiCalendar className="inline text-blue-500" /> Appointment Details
            </h2>

            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">
                  Booking ID
                </label>
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
                <label className="block mb-1 text-sm font-medium text-slate-700">
                  Patient Name
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                  value={viewAppointment.patient?.name || ""}
                  readOnly
                  disabled
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">
                  Patient ID
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                  value={viewAppointment.patient?.patientId || ""}
                  readOnly
                  disabled
                />
              </div>
            </div>

            {/* Requested Edit Requests (Show list above the session table) */}
            {Array.isArray(viewAppointment.editRequests) &&
              viewAppointment.editRequests.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-blue-700 text-base flex items-center gap-2">
                      Edit Requests (
                      {viewAppointment.editRequests.length})
                    </h3>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded overflow-hidden text-xs">
                    {viewAppointment.editRequests
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt || "").getTime() -
                          new Date(a.createdAt || "").getTime()
                      )
                      .map((editReq, idx) => {
                        // Expand only for latest/pending by default, others collapsed
                        const isExpanded =
                          expandedEditRequests[editReq._id] ??
                          (idx === 0 || editReq.status === "pending");

                        // Serial number starts from 1 for most recent at top
                        const serialNo = idx + 1;

                        return (
                          <div
                            key={editReq._id}
                            className={`border-b last:border-0`}
                          >
                            <button
                              className={`w-full text-left flex items-center gap-2 py-2 px-3 font-semibold ${
                                editReq.status === "pending"
                                  ? "text-blue-900"
                                  : editReq.status === "approved"
                                  ? "text-green-800"
                                  : "text-gray-600"
                              }`}
                              onClick={() =>
                                toggleEditRequestExpand(editReq._id)
                              }
                              aria-expanded={isExpanded}
                            >
                              <FiChevronDown
                                className={`inline transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                              <span>
                                {/* Show "Request #1", "Request #2", etc. (topmost is 1) */}
                                Request #{serialNo}
                              </span>
                              <span className="ml-2 px-2 py-1 rounded text-xs capitalize font-bold border"
                                style={{
                                  borderColor:
                                    editReq.status === "pending"
                                      ? "#60a5fa"
                                      : editReq.status === "approved"
                                      ? "#10b981"
                                      : "#aaa",
                                  color:
                                    editReq.status === "pending"
                                      ? "#2563eb"
                                      : editReq.status === "approved"
                                      ? "#047857"
                                      : "#666"
                                }}
                              >
                                {editReq.status}
                              </span>
                              <span className="ml-auto text-xs text-slate-500 font-normal">
                                {editReq.createdAt
                                  ? dayjs(editReq.createdAt).format("DD MMM YYYY, h:mm A")
                                  : null}
                              </span>
                            </button>
                            {isExpanded && Array.isArray(editReq.sessions) && (
                              <div className="pb-2 px-6">
                                <table className="w-full text-xs border mb-1 mt-2">
                                  <thead>
                                    <tr>
                                      <th className="py-1 px-2 text-left">S. No.</th>
                                      {/* <th className="py-1 px-2 text-left">Session ID</th> */}
                                      <th className="py-1 px-2 text-left">New Date</th>
                                      <th className="py-1 px-2 text-left">New Slot</th>
                                      <th className="py-1 px-2 text-left">Old Date</th>
                                      <th className="py-1 px-2 text-left">Old Slot</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {editReq.sessions.map((sess, sidx) => {
                                      const slotLabel =
                                        SESSION_TIME_OPTIONS.find(
                                          (opt) => opt.id === sess.newSlotId
                                        )?.label || sess.newSlotId;

                                      const { oldDate, oldSlotId } = findSessionOldDetails(
                                        sess.sessionId,
                                        viewAppointment
                                      );
                                      const oldSlotLabel = oldSlotId
                                        ? (
                                            SESSION_TIME_OPTIONS.find(
                                              (opt) => opt.id === oldSlotId
                                            )?.label || oldSlotId
                                          )
                                        : "";

                                      return (
                                        <tr key={sess.sessionId || sidx}>
                                          <td className="py-1 px-2">{sidx + 1}</td>
                                          {/* <td className="py-1 px-2 font-mono">
                                            {sess.sessionId}
                                          </td> */}
                                          <td className="py-1 px-2">
                                            {sess.newDate}
                                          </td>
                                          <td className="py-1 px-2">
                                            {slotLabel}
                                          </td>
                                          <td className="py-1 px-2">
                                            {oldDate
                                              ? dayjs(oldDate).format("YYYY-MM-DD")
                                              : "--"}
                                          </td>
                                          <td className="py-1 px-2">
                                            {oldSlotLabel || "--"}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            <h3 className="font-semibold mb-2 mt-6 text-blue-900">Sessions</h3>
            {requestEditMessage && (
              <div className="mb-3 px-3 py-2 bg-blue-50 text-blue-900 rounded text-xs">
                {requestEditMessage}
              </div>
            )}
            {submitAllError && (
              <div className="mb-3 px-3 py-2 bg-red-100 text-red-800 rounded text-xs">
                {submitAllError}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs border mb-2">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Slot</th>
                    <th className="px-3 py-2 text-left">Therapist</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(viewAppointment.sessions) &&
                  viewAppointment.sessions.length > 0 ? (
                    viewAppointment.sessions.map((s, idx) => {
                      const key = s._id || `idx${idx}`;
                      const localState =
                        sessionEditState[key] || {
                          date: s.date,
                          slotId: s.slotId || "",
                          status: s.status,
                          therapistName:
                            typeof s.therapist === "object"
                              ? typeof s.therapist.userId === "object"
                                ? s.therapist.userId.name
                                : ""
                              : "",
                        };

                      let alreadyRequested = localState.requested;
                      let alreadyApproved = localState.status === "approved";

                      let requestedNewDate: string | null =
                        localState.pendingRequestNewDate ?? null;
                      let requestedNewSlotId: string | null =
                        localState.pendingRequestNewSlotId ?? null;
                      let requestedNewSlotLabel: string | null = null;
                      if (requestedNewSlotId) {
                        const slotObj = SESSION_TIME_OPTIONS.find(
                          (opt) => opt.id === requestedNewSlotId
                        );
                        requestedNewSlotLabel = slotObj
                          ? slotObj.label
                          : requestedNewSlotId;
                      }

                      const showEditedWarn =
                        editAllMode && !alreadyRequested && localState.isEditedSlot;

                      const locked2hr =
                        isSessionLocked2Hr(
                          localState.originalDate ?? localState.date,
                          localState.originalSlotId ?? localState.slotId
                        );

                      return (
                        <tr key={key} className="border-t">
                          {/* Serial No. cell */}
                          <td className="px-3 py-2">{idx + 1}</td>
                          {/* Date cell */}
                          <td className="px-3 py-2">
                            {editAllMode && !alreadyRequested ? (
                              <input
                                type="date"
                                className={`border rounded px-1 py-1 text-xs ${showEditedWarn ? "border-blue-500" : ""
                                  }`}
                                value={
                                  localState.date
                                    ? dayjs(localState.date).format(
                                      "YYYY-MM-DD"
                                    )
                                    : ""
                                }
                                min={dayjs().format("YYYY-MM-DD")}
                                onChange={(e) =>
                                  handleSessionFieldChange(
                                    key,
                                    "date",
                                    e.target.value
                                  )
                                }
                                disabled={submittingAll || locked2hr}
                              />
                            ) : s.date ? (
                              dayjs(s.date).format("YYYY-MM-DD")
                            ) : (
                              "-"
                            )}
                            {alreadyRequested &&
                              requestedNewDate &&
                              requestedNewDate !==
                              dayjs(s.date).format("YYYY-MM-DD") && (
                                <div className="text-blue-700 text-[11px] mt-1">
                                  <span className="italic">Requested:</span>{" "}
                                  {requestedNewDate}
                                </div>
                              )}
                            {showEditedWarn && (
                              <div className="text-green-800 text-[10px] mt-1 flex items-center gap-1">
                                <FiEdit2 /> Changed
                              </div>
                            )}
                            {locked2hr && (
                              <div className="text-gray-500 text-[11px] mt-1 flex items-center gap-1">
                                <FiX /> Can't edit within 2 hours
                              </div>
                            )}
                          </td>
                          {/* Slot cell */}
                          <td className="px-3 py-2">
                            {editAllMode && !alreadyRequested ? (
                              <select
                                className={`border rounded px-1 py-1 text-xs ${showEditedWarn ? "border-blue-500" : ""
                                  }`}
                                value={localState.slotId}
                                onChange={(e) =>
                                  handleSessionFieldChange(
                                    key,
                                    "slotId",
                                    e.target.value
                                  )
                                }
                                disabled={submittingAll || locked2hr}
                              >
                                <option value="" disabled>
                                  Select Slot
                                </option>
                                {SESSION_TIME_OPTIONS.map((opt) => {
                                  const optionLocked = willSelectionBeLocked2Hr(
                                    localState.date,
                                    opt.id
                                  );
                                  return (
                                    <option
                                      key={opt.id}
                                      value={opt.id}
                                      disabled={optionLocked}
                                      style={
                                        optionLocked
                                          ? { color: "#bbbbbb", background: "#f1f1f1" }
                                          : {}
                                      }
                                    >
                                      {opt.label} {opt.limited ? "(Limited)" : ""}
                                      {optionLocked ? " - Not Available (<2hr)" : ""}
                                    </option>
                                  );
                                })}
                              </select>
                            ) : (
                              SESSION_TIME_OPTIONS.find(
                                (opt) => opt.id === s.slotId
                              )?.label ||
                              s.slotId ||
                              "--"
                            )}
                            {alreadyRequested &&
                              requestedNewSlotLabel &&
                              requestedNewSlotId !== s.slotId && (
                                <div className="text-blue-700 text-[11px] mt-1">
                                  <span className="italic">Requested:</span>{" "}
                                  {requestedNewSlotLabel}
                                </div>
                              )}
                            {showEditedWarn && (
                              <div className="text-green-800 text-[10px] mt-1 flex items-center gap-1">
                                <FiEdit2 /> Changed
                              </div>
                            )}
                            {editAllMode && locked2hr && (
                              <div className="text-gray-500 text-[11px] mt-1 flex items-center gap-1">
                                <FiX /> Can't edit within 2 hours
                              </div>
                            )}
                          </td>
                          {/* Therapist cell */}
                          <td className="px-3 py-2">
                            {localState.therapistName
                              ? localState.therapistName
                              : typeof s.therapist === "object"
                                ? typeof s.therapist.userId === "object"
                                  ? s.therapist.userId.name
                                  : ""
                                : (
                                  <span className="italic text-slate-400">
                                    –
                                  </span>
                                )}
                          </td>
                          {/* Status cell */}
                          <td className="px-3 py-2 capitalize">
                            {localState.status &&
                              typeof localState.status === "string" ? (
                              localState.status
                            ) : (
                              <span className="italic text-slate-400">N/A</span>
                            )}
                            {alreadyRequested && (
                              <span className="ml-2 text-green-600 flex gap-1 items-center text-xs">
                                <FiCheck />
                                {alreadyApproved ? "Edit Approved" : "Requested"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-5 text-center text-slate-400"
                      >
                        No session data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {editAllMode && (
              <div className="mb-2 grid gap-1">
                {Object.entries(sessionEditState).map(([k, v]) =>
                  v.error ? (
                    <div key={k} className="text-red-600 text-xs">
                      Session {k}: {v.error}
                    </div>
                  ) : null
                )}
              </div>
            )}

            <div className="flex items-center gap-2 justify-end mt-2">
              {editAllMode ? (
                <>
                  <button
                    className="flex items-center px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white font-medium text-xs gap-1"
                    disabled={submittingAll}
                    onClick={handleSubmitAllEdit}
                  >
                    {submittingAll ? (
                      <span className="animate-spin">
                        <FiSave />
                      </span>
                    ) : (
                      <>
                        <FiSave />
                        Submit All Requests
                      </>
                    )}
                  </button>
                  <button
                    className="px-4 py-2 rounded border font-semibold text-xs"
                    disabled={submittingAll}
                    onClick={handleCancelEditAll}
                  >
                    <FiX /> Cancel
                  </button>
                </>
              ) : (
                !appointmentHasPendingRequest(viewAppointment) &&
                Object.values(sessionEditState).some((v) => !v.requested) && (
                  <button
                    className="flex items-center px-4 py-2 rounded bg-slate-100 hover:bg-blue-50 border border-slate-200 text-blue-700 font-semibold text-xs gap-1"
                    onClick={handleEditAllClick}
                  >
                    <FiEdit2 /> Request Edit For Multiple Sessions
                  </button>
                )
              )}
              <button
                className="px-5 py-2 rounded border font-semibold"
                onClick={() => setViewAppointment(null)}
                disabled={submittingAll}
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

// --- PaginationNav component (separated for brevity, reusable, and so the search/pagination UI is not reset on table reload) ---
function PaginationNav({
  currentPage,
  pageSize,
  totalCount,
  onPage,
}: {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPage: (page: number) => void;
}) {
  const maxPage = Math.max(1, Math.ceil((totalCount || 0) / pageSize));
  if (maxPage <= 1) return null;
  function quickJump(delta: number) {
    onPage(Math.min(maxPage, Math.max(1, currentPage + delta)));
  }
  return (
    <div className="flex items-center gap-1 select-none">
      <button
        onClick={() => onPage(1)}
        disabled={currentPage === 1}
        className="px-2 py-1 rounded border text-xs disabled:opacity-40"
        tabIndex={0}
        type="button"
        aria-label="First"
      >
        <FiChevronsLeft />
      </button>
      <button
        onClick={() => quickJump(-1)}
        disabled={currentPage === 1}
        className="px-2 py-1 rounded border text-xs disabled:opacity-40"
        tabIndex={0}
        type="button"
        aria-label="Previous"
      >
        <FiChevronLeft />
      </button>
      <span className="mx-2 text-xs font-semibold">
        Page {currentPage} of {maxPage}
      </span>
      <button
        onClick={() => quickJump(1)}
        disabled={currentPage === maxPage}
        className="px-2 py-1 rounded border text-xs disabled:opacity-40"
        tabIndex={0}
        type="button"
        aria-label="Next"
      >
        <FiChevronRight />
      </button>
      <button
        onClick={() => onPage(maxPage)}
        disabled={currentPage === maxPage}
        className="px-2 py-1 rounded border text-xs disabled:opacity-40"
        tabIndex={0}
        type="button"
        aria-label="Last"
      >
        <FiChevronsRight />
      </button>
      <span className="ml-2 text-slate-500 text-xs">
        ({totalCount} total)
      </span>
    </div>
  );
}