import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiMenu } from "react-icons/fi";
import { toast } from "react-toastify";
import OwnerPageShell from "../../components/owner/OwnerPageShell";
import { useOwnerNavReset } from "../../hooks/useOwnerNavReset";

type DiaryNote = {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string;
  urgent: boolean;
  completed: boolean;
  attachmentName?: string;
};

type NoteFormState = {
  date: string;
  time: string;
  title: string;
  description: string;
  urgent: boolean;
  attachmentName: string;
};

type ModalMode = "create" | "edit" | null;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const TIME_OPTIONS = [
  "",
  "06:00 AM",
  "07:00 AM",
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
];

const INITIAL_NOTES: DiaryNote[] = [
  {
    id: "1",
    title: "hijoijo",
    description: "igihoo",
    date: "2026-07-12",
    time: "",
    urgent: false,
    completed: false,
  },
  {
    id: "2",
    title: "Oil change reminder",
    description: "Book service for Swift before 20k km",
    date: "2026-07-15",
    time: "10:00 AM",
    urgent: true,
    completed: false,
  },
  {
    id: "3",
    title: "Insurance renewal",
    description: "Check policy expiry and gather docs",
    date: "2026-07-18",
    time: "02:00 PM",
    urgent: false,
    completed: false,
  },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseIsoDate(iso: string) {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, day || 1);
}

function formatDisplayDate(iso: string) {
  const d = parseIsoDate(iso);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function parseDisplayDate(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return toIsoDate(d);
}

function addDays(iso: string, delta: number) {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + delta);
  return toIsoDate(d);
}

function monthLabel(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function buildCalendarCells(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  // Monday-first: Sun=0 → 6, Mon=1 → 0, …
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<{ day: number | null; iso: string | null }> = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push({ day: null, iso: null });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      day,
      iso: `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`,
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, iso: null });
  }
  return cells;
}

function emptyForm(dateIso: string): NoteFormState {
  return {
    date: formatDisplayDate(dateIso),
    time: "",
    title: "",
    description: "",
    urgent: false,
    attachmentName: "",
  };
}

function formFromNote(note: DiaryNote): NoteFormState {
  return {
    date: formatDisplayDate(note.date),
    time: note.time,
    title: note.title,
    description: note.description,
    urgent: note.urgent,
    attachmentName: note.attachmentName ?? "",
  };
}

const GREEN_BTN = "bg-[#8dc63f] hover:bg-[#7cb342]";
/** Pale lime card — matches FreshKhata diary note dialog */
const NOTE_CARD_BG = "#e2ffb1";
const NOTE_FOOTER_BG = "#f0f7a8";

export default function OwnerDigitalDiaryPage() {
  const [notes, setNotes] = useState<DiaryNote[]>(INITIAL_NOTES);
  const [selectedDate, setSelectedDate] = useState("2026-07-12");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = parseIsoDate("2026-07-12");
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NoteFormState>(() => emptyForm("2026-07-12"));
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignDateValue, setAssignDateValue] = useState("");

  const menuRef = useRef<HTMLDivElement | null>(null);

  const reset = () => {
    setSelectedDate("2026-07-12");
    setCalendarMonth({ year: 2026, month: 6 });
    setOpenMenuId(null);
    setModalMode(null);
    setEditingId(null);
    setAssigningId(null);
  };
  useOwnerNavReset(reset);

  useEffect(() => {
    if (!openMenuId) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [openMenuId]);

  const dialogOpen = modalMode !== null || assigningId !== null;
  useEffect(() => {
    if (!dialogOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [dialogOpen]);

  const datesWithNotes = useMemo(() => {
    const set = new Set<string>();
    for (const note of notes) {
      if (!note.completed) set.add(note.date);
    }
    return set;
  }, [notes]);

  const notesForSelectedDate = useMemo(
    () => notes.filter((n) => n.date === selectedDate && !n.completed),
    [notes, selectedDate],
  );

  const calendarCells = useMemo(
    () => buildCalendarCells(calendarMonth.year, calendarMonth.month),
    [calendarMonth],
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(selectedDate));
    setModalMode("create");
    setOpenMenuId(null);
  };

  const openEdit = (note: DiaryNote) => {
    setEditingId(note.id);
    setForm(formFromNote(note));
    setModalMode("edit");
    setOpenMenuId(null);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingId(null);
  };

  const shiftSelectedDate = (delta: number) => {
    const next = addDays(selectedDate, delta);
    setSelectedDate(next);
    const d = parseIsoDate(next);
    setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() });
  };

  const selectCalendarDate = (iso: string) => {
    setSelectedDate(iso);
    const d = parseIsoDate(iso);
    setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() });
  };

  const shiftCalendarMonth = (delta: number) => {
    setCalendarMonth((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const iso = parseDisplayDate(form.date);
    if (!iso) {
      toast.error("Enter a valid date as DD/MM/YYYY.");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }

    if (modalMode === "edit" && editingId) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingId
            ? {
                ...n,
                title: form.title.trim(),
                description: form.description.trim(),
                date: iso,
                time: form.time,
                urgent: form.urgent,
                attachmentName: form.attachmentName || undefined,
              }
            : n,
        ),
      );
      setSelectedDate(iso);
      toast.success("Note updated.");
    } else {
      const newNote: DiaryNote = {
        id: `note-${Date.now()}`,
        title: form.title.trim(),
        description: form.description.trim(),
        date: iso,
        time: form.time,
        urgent: form.urgent,
        completed: false,
        attachmentName: form.attachmentName || undefined,
      };
      setNotes((prev) => [...prev, newNote]);
      setSelectedDate(iso);
      toast.success("Note saved.");
    }
    closeModal();
  };

  const markComplete = (id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, completed: true } : n)));
    setOpenMenuId(null);
    toast.success("Note marked complete.");
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setOpenMenuId(null);
    toast.success("Note deleted.");
  };

  const openAssignDate = (note: DiaryNote) => {
    setAssigningId(note.id);
    setAssignDateValue(note.date);
    setOpenMenuId(null);
  };

  const applyAssignDate = () => {
    if (!assigningId || !assignDateValue) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === assigningId ? { ...n, date: assignDateValue } : n)),
    );
    setSelectedDate(assignDateValue);
    const d = parseIsoDate(assignDateValue);
    setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() });
    setAssigningId(null);
    toast.success("Date assigned.");
  };

  return (
    <OwnerPageShell
      pageHeading="Digital Diary"
      metaTitle="Digital Diary | AutoDaddy"
      metaDescription="Car owner digital diary notes"
      heroCardFlush
      contentTopOffset
    >
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={openCreate}
          className={`rounded-md ${GREEN_BTN} px-4 py-2 text-sm font-bold text-white shadow-sm`}
        >
          + New Note
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Notes column */}
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between rounded-md bg-gray-100 px-3 py-2.5 text-gray-800">
            <button
              type="button"
              onClick={() => shiftSelectedDate(-1)}
              className="rounded p-1 hover:bg-gray-200"
              aria-label="Previous day"
            >
              <FiChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold tracking-wide">{selectedDate}</span>
            <button
              type="button"
              onClick={() => shiftSelectedDate(1)}
              className="rounded p-1 hover:bg-gray-200"
              aria-label="Next day"
            >
              <FiChevronRight size={18} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {notesForSelectedDate.length === 0 ? (
              <p className="rounded-md bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                No notes for this date. Click + New Note to add one.
              </p>
            ) : (
              notesForSelectedDate.map((note) => (
                <div
                  key={note.id}
                  className="relative flex items-start gap-3 rounded-md bg-gray-100 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">
                      {note.urgent ? (
                        <span className="mr-1.5 text-xs font-semibold text-red-600">URGENT</span>
                      ) : null}
                      {note.title}
                    </p>
                    {note.description ? (
                      <p className="mt-0.5 truncate text-sm text-gray-600">{note.description}</p>
                    ) : null}
                    {note.time ? (
                      <p className="mt-0.5 text-xs text-gray-500">{note.time}</p>
                    ) : null}
                  </div>

                  <div className="relative shrink-0" ref={openMenuId === note.id ? menuRef : undefined}>
                    <button
                      type="button"
                      onClick={() => setOpenMenuId((cur) => (cur === note.id ? null : note.id))}
                      className="rounded p-1 text-blue-600 hover:bg-blue-50"
                      aria-label="Note actions"
                    >
                      <FiMenu size={18} />
                    </button>

                    {openMenuId === note.id ? (
                      <div className="absolute right-0 z-20 mt-1 min-w-[140px] overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => openEdit(note)}
                          className="block w-full px-4 py-1.5 text-left text-sm text-gray-800 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openAssignDate(note)}
                          className="block w-full px-4 py-1.5 text-left text-sm text-gray-800 hover:bg-gray-50"
                        >
                          Assign Date
                        </button>
                        <button
                          type="button"
                          onClick={() => markComplete(note.id)}
                          className="block w-full px-4 py-1.5 text-left text-sm font-medium text-green-600 hover:bg-gray-50"
                        >
                          Mark Complete
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteNote(note.id)}
                          className="block w-full px-4 py-1.5 text-left text-sm font-medium text-red-600 hover:bg-gray-50"
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Calendar column */}
        <div className="w-full shrink-0 rounded-md border border-gray-200 bg-white p-3 shadow-sm lg:w-[280px]">
          <div className="mb-3 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => shiftCalendarMonth(-1)}
              className="rounded-full p-1 text-gray-700 hover:bg-gray-100"
              aria-label="Previous month"
            >
              <FiChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-gray-800">
              {monthLabel(calendarMonth.year, calendarMonth.month)}
            </span>
            <button
              type="button"
              onClick={() => shiftCalendarMonth(1)}
              className="rounded-full p-1 text-gray-700 hover:bg-gray-100"
              aria-label="Next month"
            >
              <FiChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1 text-[11px] font-medium text-gray-500">
                {d}
              </div>
            ))}
            {calendarCells.map((cell, idx) => {
              if (!cell.day || !cell.iso) {
                return <div key={`empty-${idx}`} className="h-9" />;
              }
              const isSelected = cell.iso === selectedDate;
              const hasNote = datesWithNotes.has(cell.iso);
              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => selectCalendarDate(cell.iso!)}
                  className="relative flex h-9 flex-col items-center justify-center"
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                      isSelected
                        ? "bg-blue-600 font-semibold text-white"
                        : "text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    {cell.day}
                  </span>
                  {hasNote ? (
                    <span
                      className={`absolute bottom-0.5 h-1 w-1 rounded-full ${
                        isSelected ? "bg-red-400" : "bg-red-500"
                      }`}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* New / Edit Note card — centered overlay matching reference */}
      {modalMode !== null ? (
        <div className="fixed inset-0 z-[100000] flex items-start justify-center overflow-y-auto px-4 pt-[8vh] pb-10 sm:pt-[12vh]">
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 bg-black/35"
            onClick={closeModal}
          />
          <form
            onSubmit={handleSave}
            className="relative z-10 w-full max-w-[520px] overflow-hidden rounded-lg shadow-[0_8px_28px_rgba(0,0,0,0.25)]"
            style={{ backgroundColor: NOTE_CARD_BG }}
          >
            <div className="px-6 pt-5 pb-2">
              <h2 className="text-[17px] font-bold text-black">
                {modalMode === "edit" ? "Edit Note" : "New Note"}
              </h2>
            </div>

            <div className="space-y-3.5 px-6 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-[13px]">
                  <span className="mb-1 block font-bold text-gray-900">
                    Date <span className="text-red-600">*</span>
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      placeholder="DD/MM/YYYY"
                      className="w-full rounded border border-gray-300 bg-white py-2 pr-9 pl-2.5 text-sm text-gray-800 outline-none focus:border-blue-500"
                      required
                    />
                    <FiCalendar
                      className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-500"
                      size={15}
                    />
                  </div>
                </label>

                <label className="block text-[13px]">
                  <span className="mb-1 block font-bold text-gray-900">Time</span>
                  <select
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className="w-full rounded border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none focus:border-blue-500"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t || "none"} value={t}>
                        {t || ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-[13px]">
                <span className="mb-1 block font-bold text-gray-900">
                  Title <span className="text-red-600">*</span>
                </span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none focus:border-blue-500"
                  required
                />
              </label>

              <label className="block text-[13px]">
                <span className="mb-1 block font-bold text-gray-900">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={5}
                  className="w-full resize-y rounded border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none focus:border-blue-500"
                />
              </label>

              <div className="flex flex-wrap items-end justify-between gap-4 pt-1">
                <label className="inline-flex cursor-pointer items-center gap-2 pb-1 text-[13px]">
                  <input
                    type="checkbox"
                    checked={form.urgent}
                    onChange={(e) => setForm((f) => ({ ...f, urgent: e.target.checked }))}
                    className="h-4 w-4 accent-red-600"
                  />
                  <span className="font-bold text-red-600">Mark Urgent</span>
                </label>

                <label className="block min-w-[200px] flex-1 text-[13px] sm:max-w-[240px]">
                  <span className="mb-1 block font-bold text-gray-900">Attachment</span>
                  <input
                    type="file"
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        attachmentName: e.target.files?.[0]?.name ?? "",
                      }))
                    }
                    className="block w-full text-xs text-gray-700 file:mr-2 file:rounded file:border file:border-gray-300 file:bg-gray-100 file:px-2 file:py-1 file:text-xs"
                  />
                </label>
              </div>
            </div>

            <div
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
              style={{ backgroundColor: NOTE_FOOTER_BG }}
            >
              <p className="text-[13px] text-gray-800">
                {modalMode === "edit" ? "You are edit this note" : "You are creating a new note"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className={`rounded ${GREEN_BTN} px-5 py-1.5 text-sm font-bold text-white`}
                >
                  {modalMode === "edit" ? "Update" : "Save"}
                </button>
                <span className="text-sm text-gray-700">or</span>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-sm font-semibold text-[#1a73e8] hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      {/* Assign Date card */}
      {assigningId !== null ? (
        <div className="fixed inset-0 z-[100000] flex items-start justify-center overflow-y-auto px-4 pt-[12vh] pb-10">
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 bg-black/35"
            onClick={() => setAssigningId(null)}
          />
          <div
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-lg shadow-[0_8px_28px_rgba(0,0,0,0.25)]"
            style={{ backgroundColor: NOTE_CARD_BG }}
          >
            <div className="px-6 pt-5 pb-2">
              <h2 className="text-[17px] font-bold text-black">Assign Date</h2>
            </div>
            <div className="px-6 pb-4">
              <label className="block text-[13px]">
                <span className="mb-1 block font-bold text-gray-900">Date</span>
                <input
                  type="date"
                  value={assignDateValue}
                  onChange={(e) => setAssignDateValue(e.target.value)}
                  className="w-full rounded border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none focus:border-blue-500"
                />
              </label>
            </div>
            <div
              className="flex items-center justify-end gap-2 px-6 py-3"
              style={{ backgroundColor: NOTE_FOOTER_BG }}
            >
              <button
                type="button"
                onClick={applyAssignDate}
                className={`rounded ${GREEN_BTN} px-5 py-1.5 text-sm font-bold text-white`}
              >
                Update
              </button>
              <span className="text-sm text-gray-700">or</span>
              <button
                type="button"
                onClick={() => setAssigningId(null)}
                className="text-sm font-semibold text-[#1a73e8] hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </OwnerPageShell>
  );
}
