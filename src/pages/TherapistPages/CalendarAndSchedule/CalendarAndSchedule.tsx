import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

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

type Session = {
  date: string;
  slotId: string;
  _id?: string;
  patient?: {
    id?: string;
    _id?: string;
    name?: string;
    patientId?: string;
    phoneNo?: string;
    userId?: {
      name?: string;
    } | string;
    mobile1?: string;
    email?: string;
    [key: string]: any;
  };
  therapist?: string;
  therapyTypeId?: string;
  isCheckedIn?: boolean;
  appointmentId?: string;
  therapyType?: {
    _id?: string;
    name?: string;
  };
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getStartDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

// Modified display name to always show [patientId] after name if exists
// function getPatientDisplayName(patient: any) {
//   if (!patient) return "";
//   if (typeof patient === "string") return patient;

//   const name =
//     (patient.userId && typeof patient.userId === "object" && patient.userId.name) ||
//     patient.name ||
//     "";
//   const patientId =
//     patient.patientId || patient.id || patient._id || ""; // best-effort fallback for patientId

//   const phone = patient.phoneNo || patient.mobile1 || "";

//   // show: name [patientId] (phone) <= id is always in [brackets] after name if exists
//   let resultName = name;
//   if (patientId) {
//     resultName += ` [${patientId}]`;
//   }
//   if (phone) {
//     resultName += ` (${phone})`;
//   }
//   return resultName;
// }

function CalendarSessionItem({ session }: { session: Session }) {
  const slot = SESSION_TIME_OPTIONS.find((opt) => opt.id === session.slotId);

  // For "isCheckedIn", we color patient info and show appointmentId
  const isCheckedIn = !!session.isCheckedIn;

  // Fetch safe id for patientId display below
  const patient = session.patient;
  // const patientId =
  //   (patient && (patient.patientId || patient.id || patient._id)) || "";

  // Display
  return (
    <div
      className={`rounded border flex flex-col justify-end border-sky-300 px-1 py-0.5 bg-sky-50 text-xs mb-1
        ${slot && slot.limited ? "border-orange-400 bg-orange-50" : ""}`}
    >
      {/* Patient name and id */}
      <span
        className={`font-bold ${
          isCheckedIn ? "text-green-700" : "text-indigo-900"
        }`}
      >
        {/* Render name, patientId, phone, with color, and add appointmentId if checked in */}
        {(() => {
          if (!patient) return "";
          // name
          const name =
            (patient.userId && typeof patient.userId === "object" && patient.userId.name) ||
            patient.name ||
            "";
          // patientId in brackets if exists
          const pid =
            patient.patientId || patient.id || patient._id || "";
          // phone (not required in main display)
          const phone = patient.phoneNo || patient.mobile1 || "";

          return (
            <>
              {name}
              {pid && (
                <span className={isCheckedIn ? "text-green-600" : "text-sky-700"}>
                  {" "}
                  [{pid}]
                </span>
              )}
              {/* Show phone if you wish */}
              {phone && (
                <span className="text-slate-500"> ({phone})</span>
              )}
              {/* Show appointmentId if checked in */}
              {isCheckedIn && session.appointmentId && (
                <span className="ml-1 px-1 rounded text-xs font-semibold bg-green-200 text-green-800">
                  {session.appointmentId}
                </span>
              )}
            </>
          );
        })()}
      </span>
      <span>
        <span className="text-sky-700">
          {slot ? slot.label : session.slotId}
        </span>
        {slot && slot.limited && (
          <span className="ml-1 text-amber-600 font-semibold"> (Limited)</span>
        )}
      </span>
      {session.therapyType && session.therapyType.name && (
        <span className="text-xs text-gray-500">{session.therapyType.name}</span>
      )}
    </div>
  );
}

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
          className="bg-white rounded-lg shadow-xl p-6 relative min-w-[320px] max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-black"
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
          {title && (
            <h2 className="mb-4 text-lg font-bold text-gray-800 border-b pb-2">{title}</h2>
          )}
          <div className="overflow-y-auto max-h-[60vh] pr-1">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function CalendarAndSchedule() {
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [sessions, setSessions] = useState<Session[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  // Modal state for "more sessions"
  const [modalDay, setModalDay] = useState<number | null>(null);
  const [modalSessions, setModalSessions] = useState<Session[] | null>(null);

  // Calendar
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDay(year, month);

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    try {
      const token = localStorage.getItem("therapist-token");
      const res = await fetch(`${API_BASE_URL}/api/therapist/schedule-calendar`, {
        headers: {
          Authorization: `${token}`,
        },
      });
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setSessions(json.data);
        console.log("All sessions:", json.data);
      } else {
        setSessions([]);
        // console.log("All sessions: []");
      }
    } catch (e) {
      setSessions([]);
      // console.log("Failed to fetch all sessions.");
    }
  }, []);

  useEffect(() => {
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (!dataLoading && !loading) {
      fetchSessions();
    }
  }, [dataLoading, loading, fetchSessions]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // Map sessions by date (string)
  const sessionMap: { [date: string]: Session[] } = {};
  sessions.forEach((session) => {
    if (!session.date) return;
    if (!sessionMap[session.date]) sessionMap[session.date] = [];
    sessionMap[session.date].push(session);
  });

  // Helper: get session list for the displayed calendar month
  function getSessionsForDay(day: number) {
    const mth = month + 1;
    const pad = (n: number) => `${n}`.padStart(2, "0");
    const dateStr = `${year}-${pad(mth)}-${pad(day)}`;
    return sessionMap[dateStr] || [];
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
    // Close modal if month changed
    setModalDay(null);
    setModalSessions(null);
  };

  // Calculate number of calendar rows (weeks)
  function getCalendarWeeks() {
    const calendarCells = startDay + daysInMonth;
    return Math.ceil(calendarCells / 7);
  }

  // Fullsize calendar layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full w-full max-w-full bg-slate-50"
    >
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
          <div
            className={`grid grid-cols-7 w-full flex-1`}
            style={{
              height: "calc(100vh - 179px)", // Subtract header+days+padding
              minHeight: "0",
              maxHeight: "100%",
              gridTemplateRows: `repeat(${getCalendarWeeks()}, minmax(0, 1fr))`,
              // shrink font size for cells on the whole calendar
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
            {/* Render actual days in month */}
            {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
              const day = dayIdx + 1;
              const sessionsForDay = getSessionsForDay(day);
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();

              // Up to 2 session items shown directly, more trigger a "show more" modal
              const showCount = 2;
              const sessionsToDisplay = sessionsForDay.slice(0, showCount);
              const moreSessionsCount = sessionsForDay.length - showCount;
              return (
                <div
                  key={`day-${day}`}
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
                        <CalendarSessionItem session={session} key={session._id || `${session.date}-${session.slotId}-${idx}`} />
                      ))}
                      {moreSessionsCount > 0 && (
                        <button
                          className="px-1 py-0.5 mt-1 text-sky-700 rounded hover:bg-sky-100 text-[0.70rem] font-semibold border border-sky-200 flex items-center justify-center"
                          style={{minHeight: "22px"}}
                          onClick={() => {
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
                  {/* Empty space stub if no sessions */}
                  {sessionsForDay.length === 0 && <div className="flex-1"></div>}
                </div>
              );
            })}
            {/* Fill trailing days to cover for grid, so final row finishes */}
            {(() => {
              const totalCells = startDay + daysInMonth;
              const fullGridCells = getCalendarWeeks() * 7;
              const trailing = fullGridCells - totalCells;
              return Array.from({ length: trailing }).map((_, i) => (
                <div
                  key={`trailing-${i}`}
                  className="border h-full bg-slate-50"
                  style={{ minHeight: 0, minWidth: 0, boxSizing: "border-box" }}
                />
              ));
            })()}
          </div>
        </div>
      </div>
      {/* Modal for showing all sessions for a day */}
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
        {modalDay && modalSessions ? (
          <div className="flex flex-col gap-2">
            {modalSessions.map((session, idx) => (
              <div key={session._id || `${session.date}-${session.slotId}-${idx}`}>
                <CalendarSessionItem session={session} />
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
