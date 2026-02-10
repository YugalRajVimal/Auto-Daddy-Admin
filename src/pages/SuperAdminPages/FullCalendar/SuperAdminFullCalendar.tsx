import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiSearch,
} from "react-icons/fi";
// Do not use Link from react-router-dom due to routing context error
import "react-toastify/dist/ReactToastify.css";

// --- Constants and Types (unchanged) ---
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const SESSION_TIME_OPTIONS = [
  { id: "0830-0915", label: "08:30 to 09:15", limited: true },
  { id: "0915-1000", label: "09:15 to 10:00", limited: true },
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
  { id: "1800-1845", label: "18:00 to 18:45", limited: true },
  { id: "1845-1930", label: "18:45 to 19:30", limited: true },
  { id: "1930-2015", label: "19:30 to 20:15", limited: true },
];

type TherapistUser = {
  _id: string;
  name: string;
};
type Therapist = {
  _id: string;
  therapistId?: string;
  name?: string;
  userId?: TherapistUser;
};
type TherapyType = {
  _id: string;
  name: string;
};
type BackendCalendarRecord = {
  appointmentId: string;
  patient: {
    patientId: string;
    name: string;
  };
  session: {
    date: string;
    slotId: string;
    therapist?: Therapist;
    therapyTypeId?: TherapyType;
    isCheckedIn?: boolean;
    _id?: string;
  };
  therapist?: {
    therapistId: string;
    name?: string;
  };
};
type Session = {
  _id?: string;
  date: string;
  slotId: string;
  isCheckedIn?: boolean;
  appointmentId?: string;
  patient?: { patientId: string; name: string };
  therapist?: Therapist;
  therapyTypeId?: TherapyType;
};
const API_BASE_URL = import.meta.env.VITE_API_URL as string;
// --- Helpers ---

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getStartDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function getPatientDisplayName(patient: any) {
  if (!patient) return "";
  const name = patient.name || "";
  const patientId = patient.patientId || "";
  let resultName = name;
  if (patientId) {
    resultName += ` [${patientId}]`;
  }
  return resultName;
}
function processBackendSessionList(data: BackendCalendarRecord[]): Session[] {
  // Only include: appointmentId, patient (id, name), session date, slotId, therapist, therapyTypeId, isCheckedIn, _id
  return data.map((rec) => {
    const { appointmentId, patient, session } = rec;
    return {
      _id: session._id,
      appointmentId,
      patient: patient && {
        patientId: patient.patientId,
        name: patient.name,
      },
      date: session.date,
      slotId: session.slotId,
      therapist: session.therapist,
      therapyTypeId: session.therapyTypeId,
      isCheckedIn: session.isCheckedIn,
    };
  });
}

// --- UI Atomic Components (using <a> for external routing, like ReceptionDesk) ---

function PatientDetailsBox({ patient }: { patient: { name: string; patientId: string } }) {
  if (!patient) return null;
  return (
    <div className="rounded border px-2 py-2 bg-white mb-1">
      <div className="font-semibold text-indigo-800 text-base">
        {patient.patientId ? (
          <a
            href={`/admin/children?patientId=${encodeURIComponent(patient.patientId)}`}
            className="text-blue-700 hover:underline"
            title="View patient details"
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
          >
            {patient.name}
          </a>
        ) : (
          patient.name
        )}
        {patient.patientId && (
          <span className="text-indigo-600 text-xs ml-1">
            [{patient.patientId}]
          </span>
        )}
      </div>
    </div>
  );
}
function AppointmentIdBox({ appointmentId }: { appointmentId: string }) {
  if (!appointmentId) return null;
  return (
    <div className="mb-1 px-1 rounded-full font-semibold text-[0.98em] bg-teal-100 text-teal-800 inline-block">
      APT ID: {appointmentId}
    </div>
  );
}
function TherapyTypeBox({ therapyType }: { therapyType: TherapyType }) {
  if (!therapyType) return null;
  return (
    <div className="my-1 text-xs text-slate-700 bg-slate-50 rounded px-2 py-1 border border-slate-200">
      <div>
        <b>Therapy Type:</b>{" "}
        <span className="font-semibold text-indigo-700">{therapyType.name}</span>
      </div>
    </div>
  );
}
function TherapistBox({ therapist }: { therapist: Therapist }) {
  if (!therapist) return null;
  let therapistId = therapist.therapistId ;
  let therapistUserId = therapist._id
  const display = therapist.userId?.name || therapist.name || "-";
  return (
    <div className="my-1 text-xs text-slate-700 bg-slate-50 rounded px-2 py-1 border border-slate-200">
      <div>
        <b>Therapist:</b>{" "}
        {therapistId ? (
          <a
            href={`/super-admin/therapists?therapist=${encodeURIComponent(therapistUserId)}`}
            className="text-blue-600 hover:underline"
            title="View therapist details"
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
          >
            {display}
          </a>
        ) : (
          display
        )}
        {therapist.therapistId ? ` (${therapist.therapistId})` : ""}
      </div>
    </div>
  );
}

// --- Modal Wrapper ---
function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 250, damping: 30 }}
          className="bg-white rounded-lg shadow-xl p-6 relative min-w-[320px] max-w-lg w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-black"
            onClick={onClose}
            tabIndex={-1}
          >
            <FiX size={20} />
          </button>
          {title && (
            <h2 className="mb-4 text-lg font-bold text-gray-800 border-b pb-2">
              {title}
            </h2>
          )}
          <div className="overflow-y-auto max-h-[60vh] pr-1">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// --- Session Visual ---
function CalendarSessionItem({
  session,
  showAllDetails = false,
}: {
  session: Session;
  showAllDetails?: boolean;
}) {
  const slot = SESSION_TIME_OPTIONS.find((opt) => opt.id === session.slotId);
  const patient = session.patient;
  const appointmentId = session.appointmentId;
  const therapist = session.therapist;
  const therapyType = session.therapyTypeId;
  const isCheckedIn = !!session.isCheckedIn;

  if (!showAllDetails) {
    return (
      <div
        className={`rounded border flex flex-col justify-end border-sky-300 px-1 py-0.5 bg-sky-50 text-xs mb-1
        ${slot && slot.limited ? "border-orange-400 bg-orange-50" : ""}`}
      >
        <span className="font-bold text-indigo-900">
          {patient && patient.patientId ? (
            <a
              href={`/super-admin/children?patientId=${encodeURIComponent(patient.patientId)}`}
              className="text-blue-700 hover:underline"
              title="View patient details"
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
            >
              {getPatientDisplayName(patient)}
            </a>
          ) : (
            getPatientDisplayName(patient)
          )}
        </span>
        <span>
          <span className="text-sky-700">
            {slot ? slot.label : session.slotId}
          </span>
          {slot && slot.limited && (
            <span className="ml-1 text-amber-600 font-semibold">(Limited)</span>
          )}
        </span>
      </div>
    );
  } else {
    return (
      <div className="mb-3 p-2 rounded border border-indigo-300 bg-slate-50 flex flex-col">
        {appointmentId && <AppointmentIdBox appointmentId={appointmentId} />}
        <div className="mb-1 flex items-center gap-3">
          <span className="text-xs text-slate-700">{session.date}</span>
          <span
            className={`inline-block rounded px-2 py-0.5 mr-1 text-xs font-semibold ${
              slot && slot.limited
                ? "bg-amber-100 text-amber-700 border border-amber-300"
                : "bg-sky-100 text-sky-800"
            }`}
          >
            {slot ? slot.label : session.slotId}
          </span>
          {isCheckedIn && (
            <span className="bg-green-200 px-2 py-0.5 rounded text-green-900 text-xs font-semibold">
              Checked In
            </span>
          )}
        </div>
        {patient && <PatientDetailsBox patient={patient} />}
        {therapyType && <TherapyTypeBox therapyType={therapyType} />}
        {therapist && <TherapistBox therapist={therapist} />}
      </div>
    );
  }
}

// --- Search and Filter Component ---
type FilterQuery = {
  patientName: string;
  therapistName: string;
  therapyType: string;
  onlyLimited: boolean;
  checkedIn: string; // 'yes', 'no', '' (all)
};
function CalendarSearchFilter({
  filters,
  setFilters,
  therapyTypes,
}: {
  filters: FilterQuery;
  setFilters: (f: FilterQuery) => void;
  therapyTypes: TherapyType[];
}) {
  return (
    <div className="p-4 flex flex-wrap gap-4 items-center border-b bg-slate-50">
      <div className="relative">
        <FiSearch className="absolute left-2 top-2.5 text-slate-400" />
        <input
          type="text"
          className="pl-8 pr-2 py-1 border rounded focus:outline-sky-400 bg-white text-sm"
          placeholder="Search Children or Id"
          value={filters.patientName}
          onChange={e => setFilters({ ...filters, patientName: e.target.value })}
        />
      </div>
      <div className="relative">
        <FiSearch className="absolute left-2 top-2.5 text-slate-400" />
        <input
          type="text"
          className="pl-8 pr-2 py-1 border rounded focus:outline-sky-400 bg-white text-sm"
          placeholder="Therapist name or Id"
          value={filters.therapistName}
          onChange={e => setFilters({ ...filters, therapistName: e.target.value })}
        />
      </div>
      <select
        className="py-1 px-2 border rounded bg-white text-sm"
        value={filters.therapyType}
        onChange={e => setFilters({ ...filters, therapyType: e.target.value })}
      >
        <option value="">All Therapy Types</option>
        {therapyTypes.map(tt => (
          <option value={tt._id} key={tt._id}>{tt.name}</option>
        ))}
      </select>
      <label className="flex items-center gap-1 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={filters.onlyLimited}
          onChange={e => setFilters({ ...filters, onlyLimited: e.target.checked })}
        />
        Limited slots
      </label>
      <select
        className="py-1 px-2 border rounded bg-white text-sm"
        value={filters.checkedIn}
        onChange={e => setFilters({ ...filters, checkedIn: e.target.value })}
      >
        <option value="">All Check-ins</option>
        <option value="yes">Checked In</option>
        <option value="no">Not Checked In</option>
      </select>
    </div>
  );
}

// --- Main Calendar Grid Display ---
function CalendarMonthGrid({
  today,
  year,
  month,
  daysInMonth,
  startDay,
  getCalendarWeeks,
  getSessionsForDay,
  setModalDay,
  setModalSessions,
}: {
  today: Date;
  year: number;
  month: number;
  daysInMonth: number;
  startDay: number;
  getCalendarWeeks: () => number;
  getSessionsForDay: (day: number) => Session[];
  setModalDay: (d: number | null) => void;
  setModalSessions: (s: Session[] | null) => void;
}) {
  return (
    <div
      className={`grid grid-cols-7 w-full flex-1`}
      style={{
        height: "calc(100vh - 231px)",
        minHeight: "0",
        maxHeight: "100%",
        gridTemplateRows: `repeat(${getCalendarWeeks()}, minmax(0, 1fr))`,
        fontSize: "0.91rem",
      }}
    >
      {/* Fill empty days at start */}
      {Array.from({ length: startDay }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="border h-full bg-slate-50"
          style={{
            minHeight: 0,
            minWidth: 0,
            boxSizing: "border-box",
          }}
        />
      ))}
      {/* Actual days */}
      {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
        const day = dayIdx + 1;
        const sessionsForDay = getSessionsForDay(day);
        const isToday =
          day === today.getDate() &&
          month === today.getMonth() &&
          year === today.getFullYear();

        const showCount = 2;
        const sessionsToDisplay = sessionsForDay.slice(0, showCount);
        const moreSessionsCount = sessionsForDay.length - showCount;
        return (
          <div
            key={`day-${day}`}
            onClick={() => {
              setModalDay(day);
              setModalSessions(sessionsForDay);
            }}
            className={`relative border flex flex-col p-1 transition min-h-0 min-w-0
            ${isToday ? "bg-sky-50 border-sky-400" : "bg-white hover:bg-slate-50"}`}
            style={{
              boxSizing: "border-box",
              overflow: "hidden",
              minHeight: "60px",
              height: "100%",
            }}
          >
            {/* Day header */}
            <div
              className="font-semibold text-center select-none mb-1"
              style={{
                color: isToday ? "#0ea5e9" : undefined,
                background: isToday ? "#e0f2fe" : undefined,
                borderRadius: "5px",
                padding: "1px 0",
                width: "1.3rem",
                fontSize: "0.93rem",
                lineHeight: "1.3rem",
                margin: "0 auto",
              }}
            >
              {day}
            </div>
            {sessionsForDay.length > 0 && (
              <div className="flex flex-col w-full flex-1">
                {sessionsToDisplay.map((session, idx) => (
                  <CalendarSessionItem
                    session={session}
                    key={session._id || `${session.date}-${session.slotId}-${idx}`}
                  />
                ))}
                {moreSessionsCount > 0 && (
                  <button
                    className="px-1 py-0.5 mt-1 text-sky-700 rounded hover:bg-sky-100 text-[0.70rem] font-semibold border border-sky-200 flex items-center justify-center"
                    style={{ minHeight: "22px" }}
                    onClick={e => {
                      e.stopPropagation();
                      setModalDay(day);
                      setModalSessions(sessionsForDay);
                    }}
                    tabIndex={0}
                  >
                    +{moreSessionsCount}
                  </button>
                )}
              </div>
            )}
            {sessionsForDay.length === 0 && <div className="flex-1"></div>}
          </div>
        );
      })}
      {/* Fill trailing days for grid */}
      {(() => {
        const totalCells = startDay + daysInMonth;
        const fullGridCells = getCalendarWeeks() * 7;
        const trailing = fullGridCells - totalCells;
        return Array.from({ length: trailing }).map((_, i) => (
          <div
            key={`trailing-${i}`}
            className="border h-full bg-slate-50"
            style={{
              minHeight: 0,
              minWidth: 0,
              boxSizing: "border-box",
            }}
          />
        ));
      })()}
    </div>
  );
}

// --- Main FullCalendar Page ---
export default function SuperAdminFullCalendar() {
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [modalDay, setModalDay] = useState<number | null>(null);
  const [modalSessions, setModalSessions] = useState<Session[] | null>(null);

  // Search and filter local state
  const [filters, setFilters] = useState<FilterQuery>({
    patientName: "",
    therapistName: "",
    therapyType: "",
    onlyLimited: false,
    checkedIn: "",
  });

  const [therapyTypeList, setTherapyTypeList] = useState<TherapyType[]>([]);

  // Fetch session data
  const fetchSessions = useCallback(async () => {
    try {
      const token = localStorage.getItem("therapist-token");
      const res = await fetch(
        `${API_BASE_URL}/api/admin/bookings/full-calendar`,
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      );
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setSessions(processBackendSessionList(json.data));
        setTherapyTypeList(json.therapyTypes)
      } else {
        setSessions([]);
      }
    } catch (e) {
      setSessions([]);
    }
  }, []);

  // Fetch therapy types if needed (for select)
  const fetchTherapyTypes = useCallback(async () => {
    try {
      const token = localStorage.getItem("therapist-token");
      const res = await fetch(`${API_BASE_URL}/api/admin/therapytypes`, {
        headers: {
          Authorization: `${token}`,
        },
      });
      const json = await res.json();
      if (json && Array.isArray(json.data)) {
        setTherapyTypeList(json.data);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (!dataLoading && !loading) {
      fetchSessions();
      fetchTherapyTypes();
    }
  }, [dataLoading, loading, fetchSessions, fetchTherapyTypes]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // Calendar related calculation
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDay(year, month);

  // =========================
  // FILTERED sessions logic
  // =========================
  const filteredSessions = useMemo(() => {
    let result = sessions;
    if (filters.patientName.trim() !== "") {
      const term = filters.patientName.trim().toLowerCase();
      result = result.filter(
        s =>
          (s.patient?.name?.toLowerCase().includes(term) ?? false) ||
          (s.patient?.patientId?.toLowerCase().includes(term) ?? false)
      );
    }
    if (filters.therapistName.trim() !== "") {
      const term = filters.therapistName.trim().toLowerCase();
      result = result.filter(
        s =>
          (s.therapist?.userId?.name?.toLowerCase().includes(term) ?? false) ||
          (s.therapist?.name?.toLowerCase().includes(term) ?? false) ||
          (s.therapist?.therapistId?.toLowerCase().includes(term) ?? false)
      );
    }
    if (filters.therapyType.trim() !== "") {
      result = result.filter(
        s => s.therapyTypeId?._id === filters.therapyType
      );
    }
    if (filters.onlyLimited) {
      result = result.filter(s =>
        SESSION_TIME_OPTIONS.find(opt => opt.id === s.slotId)?.limited
      );
    }
    if (filters.checkedIn === "yes") {
      result = result.filter(s => s.isCheckedIn);
    } else if (filters.checkedIn === "no") {
      result = result.filter(s => !s.isCheckedIn);
    }
    return result;
  }, [sessions, filters]);

  // Map filtered sessions by date
  const sessionMap: { [date: string]: Session[] } = useMemo(() => {
    const m: { [date: string]: Session[] } = {};
    filteredSessions.forEach((session) => {
      if (!session.date) return;
      if (!m[session.date]) m[session.date] = [];
      m[session.date].push(session);
    });
    return m;
  }, [filteredSessions]);

  function getSessionsForDay(day: number) {
    const mth = month + 1;
    const pad = (n: number) => `${n}`.padStart(2, "0");
    const dateStr = `${year}-${pad(mth)}-${pad(day)}`;
    return sessionMap[dateStr] || [];
  }

  // calendar rendering helpers
  const changeMonth = (dir: "prev" | "next") => {
    if (dir === "prev") {
      if (month === 0) {
        setMonth(11);
        setYear((y) => y - 1);
      } else setMonth((m) => m - 1);
    } else {
      if (month === 11) {
        setMonth(0);
        setYear((y) => y + 1);
      } else setMonth((m) => m + 1);
    }
    setModalDay(null);
    setModalSessions(null);
  };
  function getCalendarWeeks() {
    const calendarCells = startDay + daysInMonth;
    return Math.ceil(calendarCells / 7);
  }

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen min-w-screen h-screen w-screen flex items-center justify-center bg-slate-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-slate-600 font-semibold"
        >
          Loading Sessions…
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full w-full max-w-full bg-slate-50"
    >
      {/* Search and Filter */}
      <CalendarSearchFilter
        filters={filters}
        setFilters={setFilters}
        therapyTypes={therapyTypeList}
      />

      <div className="flex flex-col w-full h-full flex-1">
        <div className="bg-white border rounded-lg flex flex-col shadow h-full w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b bg-slate-50">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <FiCalendar />
              {new Date(year, month).toLocaleString("default", {
                month: "long",
              })}{" "}
              {year}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => changeMonth("prev")}
                className="p-2 border rounded bg-white hover:bg-slate-100"
              >
                <FiChevronLeft />
              </button>
              <button
                onClick={() => changeMonth("next")}
                className="p-2 border rounded bg-white hover:bg-slate-100"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
          {/* Days header */}
          <div className="grid grid-cols-7 text-xs text-slate-500 border-b bg-slate-100">
            {DAYS.map((d) => (
              <div key={d} className="p-2 text-center font-medium select-none">
                {d}
              </div>
            ))}
          </div>
          {/* Calendar body */}
          <CalendarMonthGrid
            today={today}
            year={year}
            month={month}
            daysInMonth={daysInMonth}
            startDay={startDay}
            getCalendarWeeks={getCalendarWeeks}
            getSessionsForDay={getSessionsForDay}
            setModalDay={setModalDay}
            setModalSessions={setModalSessions}
          />
        </div>
      </div>
      {/* Modal for all session details */}
      <Modal
        open={modalDay !== null}
        onClose={() => {
          setModalDay(null);
          setModalSessions(null);
        }}
        title={
          modalDay
            ? `All Sessions on ${year}-${String(month + 1).padStart(2, "0")}-${String(
                modalDay
              ).padStart(2, "0")}`
            : undefined
        }
      >
        {modalDay && modalSessions && modalSessions.length > 0 ? (
          <div className="flex flex-col gap-2">
            {modalSessions.map((session, idx) => (
              <div key={session._id || `${session.date}-${session.slotId}-${idx}`}>
                <CalendarSessionItem session={session} showAllDetails={true} />
              </div>
            ))}
          </div>
        ) : (
          <div>No sessions</div>
        )}
      </Modal>
    </motion.div>
  );
}
