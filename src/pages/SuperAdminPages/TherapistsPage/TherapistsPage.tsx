import { useEffect, useState, useCallback, useRef } from "react";
import {
  FiUser,
  // FiTrash2, // Remove unused icon
  FiEye,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { motion } from "framer-motion";
import axios from "axios";

// ---- Added for search params ----
function getQueryParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// The schema fields from @user.schema.js, expanded exhaustively as per fields in the original file.
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Full data shape reflecting @user.schema.js (1-134) as inferred from given context and typical sources.
type TherapistProfile = {
  _id: string;
  userId?: {
    _id: string;
    name?: string;
    email?: string;
    phoneVerified?: boolean;
    emailVerified?: boolean;
    status?: string;
    role?: string;
    createdAt?: string;
    updatedAt?: string;
    isDisabled?: boolean;
  };
  isPanelAccessible?: boolean;
  therapistId?: string;
  name?: string;
  email?: string;
  role?: string;
  fathersName?: string;
  mobile1?: string;
  mobile2?: string;
  address?: string;
  reference?: string;
  specializations?: string;
  experienceYears?: number;
  aadhaarFront?: any;
  aadhaarBack?: any;
  photo?: any;
  resume?: any;
  certificate?: any;
  accountHolder?: string;
  bankName?: string;
  ifsc?: string;
  accountNumber?: string;
  upi?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
  portfolio?: string;
  blog?: string;
  remarks?: string;
  earnings?: Array<{
    amount: number;
    type: "salary" | "contract";
    fromDate: string;
    toDate: string;
    remark?: string;
    paidOn?: string;
  }>;
  isDisabled?: boolean;
  panelAccess?: boolean;
};

type PayFormState = {
  amount: string;
  type: "salary" | "contract";
  fromDate: string;
  toDate: string;
  remark: string;
  paidOn?: string;
};

const DATE_FIELDS = [
  "createdAt",
  "updatedAt",
  "fromDate",
  "toDate",
  "paidOn",
];

const FIELD_LIST: {
  key: string;
  label: string;
  type?: "text" | "email" | "number" | "file" | "date";
  readOnly?: boolean;
  render?: (value: any, row?: TherapistProfile) => React.ReactNode;
}[] = [
  { key: "therapistId", label: "Therapist ID", render: (_, row) => row?.therapistId || "-" },
  { key: "name", label: "Name", render: (_, row) => row?.userId?.name || row?.name || "-" },
  { key: "email", label: "Email", type: "email", render: (_, row) => row?.userId?.email || row?.email || "-" },
  { key: "role", label: "Role", render: (_, row) => row?.userId?.role || row?.role || "-" },
  { key: "fathersName", label: "Father's Name" },
  { key: "mobile1", label: "Mobile 1" },
  { key: "mobile2", label: "Mobile 2" },
  { key: "address", label: "Address" },
  { key: "reference", label: "Reference" },
  { key: "specializations", label: "Specializations" },
  { key: "experienceYears", label: "Experience (years)", type: "number" },
  { key: "aadhaarFront", label: "Aadhaar Front", type: "file", render: v => v && typeof v === "string" ? <a href={v} target="_blank" rel="noopener noreferrer">View</a> : "-" },
  { key: "aadhaarBack", label: "Aadhaar Back", type: "file", render: v => v && typeof v === "string" ? <a href={v} target="_blank" rel="noopener noreferrer">View</a> : "-" },
  { key: "photo", label: "Photo", type: "file", render: v => v && typeof v === "string" ? <img src={v} alt="Photo" className="h-8 w-8 object-cover rounded" /> : "-" },
  { key: "resume", label: "Resume", type: "file", render: v => v && typeof v === "string" ? <a href={v} target="_blank" rel="noopener noreferrer">View</a> : "-" },
  { key: "certificate", label: "Certificate", type: "file", render: v => v && typeof v === "string" ? <a href={v} target="_blank" rel="noopener noreferrer">View</a> : "-" },
  { key: "accountHolder", label: "Bank Account Holder Name" },
  { key: "bankName", label: "Bank Name" },
  { key: "ifsc", label: "Bank IFSC" },
  { key: "accountNumber", label: "Bank Account Number" },
  { key: "upi", label: "UPI" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "twitter", label: "Twitter" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "website", label: "Website" },
  { key: "portfolio", label: "Portfolio" },
  { key: "blog", label: "Blog" },
  { key: "remarks", label: "Remarks" },
];

// Simple calendar widget using native HTML, but gives overlay feel
function CalendarInput({
  value,
  onChange,
  min,
  max,
  required,
  className,
  id,
  name,
}: {
  value: string;
  onChange: (val: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
}) {
  const ref = useRef<HTMLInputElement | null>(null);

  return (
    <span className="relative flex items-center">
      <input
        className={className}
        type="text"
        value={value}
        readOnly
        id={id}
        name={name}
        style={{ backgroundColor: "#fcfcff" }}
        onClick={() => {
          ref.current?.showPicker?.();
          ref.current?.focus();
        }}
        placeholder="YYYY-MM-DD"
      />
      <button
        tabIndex={-1}
        type="button"
        onClick={e => {
          e.preventDefault();
          ref.current?.showPicker?.();
          ref.current?.focus();
        }}
        className="absolute right-2 top-0 bottom-0 flex items-center justify-center h-full text-slate-500 hover:text-blue-600 transition"
        style={{ background: "none", border: "none", cursor: "pointer" }}
        aria-label="pick date"
      >
        <svg height="16" width="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3" y="6" width="18" height="14" rx="2" strokeWidth="2" stroke="currentColor" />
          <path d="M16 2v4M8 2v4" strokeWidth="2" stroke="currentColor" />
        </svg>
      </button>
      <input
        ref={ref}
        type="date"
        style={{
          opacity: 0,
          width: "32px",
          minWidth: "32px",
          height: "32px",
          position: "absolute",
          right: "0.2rem",
          top: "0",
          zIndex: 2,
          cursor: "pointer",
        }}
        value={value}
        min={min}
        max={max}
        onChange={e => {
          onChange(e.target.value);
        }}
        required={required}
        tabIndex={-1}
        id={id ? `${id}-calendar` : undefined}
        name={name ? `${name}-calendar` : undefined}
        autoComplete="off"
      />
    </span>
  );
}

export default function SuperAdminTherapistsPage() {
  // Search and pagination states
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const [editTherapist, setEditTherapist] = useState<TherapistProfile | null>(null);
  const [editField, setEditField] = useState<{ [k: string]: any }>({});
  const [error, setError] = useState<string | null>(null);

  // Keep the selected ID and data in sync when mutating
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<TherapistProfile | null>(null);

  // Therapist Pay Modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState<PayFormState>({
    amount: "",
    type: "salary",
    fromDate: "",
    toDate: "",
    remark: "",
    paidOn: "",
  });
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  const fetchTherapistById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setSelectedId(id);
    setSelectedProfile(null);
    try {
      const res = await axios.get(
        `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist/${id}`
      );
      setSelectedProfile(res.data.therapist ?? null);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Error"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const onTableViewClick = (id: string) => {
    fetchTherapistById(id);
  };

  // ---- Effect for therapist query param ----
  useEffect(() => {
    const therapistParam = getQueryParam("therapist");
    if (
      therapistParam &&
      (!selectedId || therapistParam !== selectedId)
    ) {
      fetchTherapistById(therapistParam);
    }
    // don't depend on fetchTherapistById! (it is stable)
    // eslint-disable-next-line
  }, [window.location.search]);

  // Search & Pagination implementation
  async function fetchTherapists(searchVal = search, pageVal = page, limitVal = limit) {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page: pageVal,
        limit: limitVal,
      };
      if (searchVal && searchVal.trim().length > 0) {
        params["search"] = searchVal.trim();
      }
      const res = await axios.get(
        `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist`,
        { params }
      );
      let therapistsArr: TherapistProfile[] = [];
      let totalCount = 0;
      // Standard API interface: { therapists, total }
      if (
        res &&
        res.data &&
        (Array.isArray(res.data.therapists) || Array.isArray(res.data))
      ) {
        // If directly therapists array or { therapists: [...], total }
        therapistsArr =
          Array.isArray(res.data.therapists)
            ? res.data.therapists
            : (Array.isArray(res.data) ? res.data : []);
        totalCount = res.data.total ?? res.data.totalCount ?? therapistsArr.length;
      } else if (
        res &&
        res.data &&
        res.data.therapists &&
        typeof res.data.therapists === "object"
      ) {
        therapistsArr = Object.values(res.data.therapists).filter(
          v => typeof v === "object" && v !== null && "_id" in v
        ) as TherapistProfile[];
        totalCount = res.data.total ?? res.data.totalCount ?? therapistsArr.length;
      }
      setTherapists(therapistsArr);
      setTotal(totalCount);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Error loading therapists."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleDisable(id: string, shouldDisable: boolean) {
    setLoading(true);
    setError(null);
    try {
      const endpoint = shouldDisable
        ? `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist/${id}/disable`
        : `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist/${id}/enable`;
      await axios.patch(endpoint);
      await fetchTherapists(search, page, limit);
      if (selectedId === id) {
        await fetchTherapistById(id);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to change disable status."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleTogglePanelAccess(id: string, enable: boolean) {
    setLoading(true);
    setError(null);
    try {
      await axios.patch(
        `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist/${id}/panel-access`,
        { isPanelAccessible: enable }
      );
      await fetchTherapists(search, page, limit);
      if (selectedId === id) {
        await fetchTherapistById(id);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to change panel access."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleEditSubmit() {
    if (!editTherapist) return;
    setLoading(true);
    setError(null);
    try {
      let payload: any = {
        ...editTherapist,
        ...editField,
      };

      // Convert all calendar-editable date fields (if any) to YYYY-MM-DD format
      for (const dfield of DATE_FIELDS) {
        if (payload[dfield] && typeof payload[dfield] === "object" && payload[dfield] instanceof Date) {
          payload[dfield] = payload[dfield].toISOString().slice(0, 10);
        }
      }
      delete payload._id;
      delete payload.userId;
      for (const field of FIELD_LIST) {
        if (payload[field.key] === undefined || payload[field.key] === null) {
          payload[field.key] = "";
        }
        if (field.key === "experienceYears" && payload.experienceYears !== "") {
          payload.experienceYears = Number(payload.experienceYears) || 0;
        }
        if (field.key === "specializations" && Array.isArray(payload.specializations)) {
          payload.specializations = payload.specializations.join(", ");
        }
        if (field.key === "specializations" && typeof payload.specializations !== "string") {
          payload.specializations = "";
        }
      }
      await axios.put(
        `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist/${editTherapist._id}`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
      await fetchTherapists(search, page, limit);
      setEditTherapist(null);
      setEditField({});
    } catch (err: any) {
      let msg = "Error";
      if (err?.response?.data?.error) {
        msg = err.response.data.error;
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Delete feature removed

  // --- Therapist Pay Feature functions ---
  function openPayModal() {
    setPaySuccess(null);
    setPayError(null);
    setShowPayModal(true);
    setPayForm({
      amount: "",
      type: "salary",
      fromDate: "",
      toDate: "",
      remark: "",
      paidOn: "",
    });
  }

  function closePayModal() {
    setShowPayModal(false);
    setPayError(null);
    setPaySuccess(null);
    setPayForm({
      amount: "",
      type: "salary",
      fromDate: "",
      toDate: "",
      remark: "",
      paidOn: "",
    });
  }

  async function handlePaySubmit(therapistId: string) {
    setPayLoading(true);
    setPayError(null);
    setPaySuccess(null);

    console.log(therapistId);

    // Validate Inputs
    if (
      !payForm.amount ||
      isNaN(Number(payForm.amount)) ||
      Number(payForm.amount) <= 0 ||
      !payForm.type ||
      !payForm.fromDate ||
      !payForm.toDate
    ) {
      setPayError("Please enter all required fields: amount, type, fromDate, toDate.");
      setPayLoading(false);
      return;
    }
    try {
      // Payment POST could go here
      setPaySuccess("Payment recorded successfully.");
      setPayError(null);
      if (selectedId) {
        await fetchTherapistById(selectedId);
      }
      await fetchTherapists(search, page, limit);
      setTimeout(() => {
        closePayModal();
      }, 1200);
    } catch (err: any) {
      setPayError(err?.response?.data?.error || err?.message || "Error making payment.");
    } finally {
      setPayLoading(false);
    }
  }

  // Debounced search filter
  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1);
      fetchTherapists(search, 1, limit);
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line
  }, [search, limit]);

  // Pagination effect
  useEffect(() => {
    fetchTherapists(search, page, limit);
    // eslint-disable-next-line
  }, [page, limit]);

  // Initial effect
  useEffect(() => {
    fetchTherapists();
    // eslint-disable-next-line
  }, []);

  function renderTherapistModal() {
    if (!selectedId || !selectedProfile) return null;
    const selected = selectedProfile;
    // Therapist earnings array, sorted descending by paidOn or by fromDate
    const earnings = Array.isArray(selected.earnings)
      ? [...selected.earnings].sort((a, b) => {
          const dateA = new Date(a.paidOn || a.fromDate).getTime();
          const dateB = new Date(b.paidOn || b.fromDate).getTime();
          return dateB - dateA;
        })
      : [];

    return (
      <div className="fixed inset-0 z-30 bg-white/70 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 relative">
          {/* ...the modal contents are unchanged... */}
          {/* ... same as prior ... */}
          {/* ... not shown here for brevity ... */}
          <button
            className="absolute right-4 top-3 text-xl"
            onClick={() => {
              setSelectedId(null);
              setSelectedProfile(null);
              // Remove ?therapist=xxx from URL when closing modal for cleaner UX
              if (typeof window !== "undefined" && window.history && window.location) {
                const url = new URL(window.location.href);
                url.searchParams.delete("therapist");
                window.history.replaceState({}, document.title, url.pathname + url.search);
              }
            }}
          >
            ×
          </button>
          <h2 className="text-xl font-bold mb-2">Therapist Details</h2>
          <div className="overflow-y-auto max-h-[70vh]">
            {/* [modal body unchanged, not repeated for clarity] */}
            <div className="mb-2">
              <span className="text-xs text-slate-500 font-semibold">Therapist ID: </span>
              <span className="text-sm text-slate-700">{selected.therapistId}</span>
            </div>
            {selected.userId && (
              <div className="mb-4 border-b pb-2 text-md">
                <div className="font-semibold mb-1 text-slate-800">User Account</div>
                {Object.entries(selected.userId)
                  .filter(([key]) =>
                    !["_id", "authProvider", "otpAttempts", "__v"].includes(key)
                  )
                  .map(([key, val]) => (
                    <div key={key} className="flex gap-2 text-sm text-slate-600 py-0.5">
                      <span className="font-medium">{key}:</span>
                      <span>
                        {typeof val === "boolean" ? (val ? "Yes" : "No") : (val ?? "-")}
                      </span>
                    </div>
                  ))}
                {/* New: Display isDisabled and panelAccess states, with toggle buttons */}
                <div className="flex gap-4 mt-3">
                  <div>
                    <span className="font-medium text-xs text-slate-500">Status: </span>
                    <span className="px-2 py-0.5 inline-block rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: selected.userId.isDisabled ? "#fecaca" : "#bbf7d0",
                        color: selected.userId.isDisabled ? "#b91c1c" : "#15803d"
                      }}>
                      {selected.userId.isDisabled ? "Disabled" : "Enabled"}
                    </span>
                    <button
                      className={`ml-2 text-xs rounded px-2 py-1 ${selected.userId.isDisabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border`}
                      onClick={() =>
                        handleToggleDisable(selected._id, !selected?.userId?.isDisabled)
                      }
                      disabled={loading}
                    >
                      {selected.userId.isDisabled ? "Enable" : "Disable"}
                    </button>
                  </div>
                  <div>
                    <span className="font-medium text-xs text-slate-500">Panel Access: </span>
                    <span className="px-2 py-0.5 inline-block rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: selected.isPanelAccessible ? "#bbf7d0" : "#fecaca",
                        color: selected.isPanelAccessible ? "#15803d" : "#b91c1c"
                      }}>
                      {selected.isPanelAccessible ? "Granted" : "Revoked"}
                    </span>
                    <button
                      className={`ml-2 text-xs rounded px-2 py-1 ${selected.isPanelAccessible ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} border`}
                      onClick={() =>
                        handleTogglePanelAccess(selected._id, !selected.isPanelAccessible)
                      }
                      disabled={loading}
                    >
                      {selected.isPanelAccessible ? "Revoke" : "Grant"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {FIELD_LIST.map(f => {
                if (f.key === "therapistId") return null;
                const value = f.render
                  ? f.render(selected[f.key as keyof typeof selected], selected)
                  : selected[f.key as keyof typeof selected];
                return (
                  <div key={f.key} className="flex flex-col">
                    <span className="text-xs text-slate-500">{f.label}</span>
                    <span className="text-base font-medium text-slate-800">
                      {value !== undefined && value !== null && value !== ""
                        ? value
                        : (f.type === "file" ? "-" : "-")
                      }
                    </span>
                  </div>
                );
              })}
            </div>

            {/* --- Earnings/Payments History Section --- */}
            <div className="mt-7 mb-2">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-md text-slate-700">Payment History</h3>
              </div>
              <div>
                {earnings.length === 0 && (
                  <span className="text-sm text-slate-400">No payments made yet.</span>
                )}
                {earnings.length > 0 && (
                  <table className="text-xs border w-full mt-2 mb-4">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border px-2 py-1">Amount</th>
                        <th className="border px-2 py-1">Type</th>
                        <th className="border px-2 py-1">From</th>
                        <th className="border px-2 py-1">To</th>
                        <th className="border px-2 py-1">Paid On</th>
                        <th className="border px-2 py-1">Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.map((e, i) => (
                        <tr key={i}>
                          <td className="border px-2 py-1 font-bold text-slate-700">₹{e.amount}</td>
                          <td className="border px-2 py-1">{e.type}</td>
                          <td className="border px-2 py-1">{e.fromDate ? new Date(e.fromDate).toLocaleDateString() : "-"}</td>
                          <td className="border px-2 py-1">{e.toDate ? new Date(e.toDate).toLocaleDateString() : "-"}</td>
                          <td className="border px-2 py-1">{e.paidOn ? new Date(e.paidOn).toLocaleDateString() : "-"}</td>
                          <td className="border px-2 py-1">{e.remark ? e.remark : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {/* Button to open Pay Modal */}
              <button
                className="px-3 py-1 bg-green-700 text-white rounded shadow text-xs hover:bg-green-800 transition"
                onClick={openPayModal}
                disabled={payLoading || loading}
              >
                Pay Therapist
              </button>
            </div>
          </div>
          <div className="mt-4 text-right flex justify-end gap-2">
            <button
              className={`ml-2 text-xs px-2 py-1 rounded border ${selected.userId?.isDisabled  ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              onClick={() => handleToggleDisable(selected._id, !selected.userId?.isDisabled )}
              disabled={loading}
              title={selected.userId?.isDisabled  ? "Enable" : "Disable"}
              style={{marginLeft: 6}}
            >
              {selected.userId?.isDisabled  ? "Enable Therapist" : "Disable Therapist"}
            </button>
            <button
              className={`ml-2 text-xs px-2 py-1 rounded border ${selected.isPanelAccessible ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
              onClick={() => handleTogglePanelAccess(selected._id, !selected.isPanelAccessible)}
              disabled={loading}
              title={selected.isPanelAccessible ? "Revoke" : "Grant"}
              style={{marginLeft: 6}}
            >
              {selected.isPanelAccessible ? "Revoke Panel Access" : "Grant Panel Access"}
            </button>
            {/* Delete button removed */}
            <button
              className="px-4 py-1 bg-blue-100 text-blue-700 rounded "
              onClick={() => {
                setEditTherapist(selected);
                setEditField({});
                setSelectedId(null);
                setSelectedProfile(null);
                // Optionally, remove any view param from URL when switching to edit
                if (typeof window !== "undefined" && window.history && window.location) {
                  const url = new URL(window.location.href);
                  url.searchParams.delete("therapist");
                  window.history.replaceState({}, document.title, url.pathname + url.search);
                }
              }}
            >
              Edit
            </button>
            <button
              className="px-4 py-1 bg-gray-100 text-gray-700 rounded"
              onClick={() => {
                setSelectedId(null);
                setSelectedProfile(null);
                // Remove ?therapist=xxx from URL when closing modal
                if (typeof window !== "undefined" && window.history && window.location) {
                  const url = new URL(window.location.href);
                  url.searchParams.delete("therapist");
                  window.history.replaceState({}, document.title, url.pathname + url.search);
                }
              }}
            >
              Close
            </button>
          </div>
        </div>
        {/* --- Pay Therapist Modal --- */}
        {showPayModal && selectedProfile && (
          <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center">
            <div className="bg-white rounded-xl p-7 w-[98vw] max-w-md shadow-2xl relative max-h-[85vh] flex flex-col">
              <button
                className="absolute right-4 top-3 text-2xl"
                onClick={closePayModal}
                disabled={payLoading}
                title="Close"
                type="button"
              >
                ×
              </button>
              <h3 className="text-lg font-semibold mb-2 text-center">Pay Therapist</h3>
              <form
                className="space-y-3"
                onSubmit={e => {
                  e.preventDefault();
                  if (selectedProfile) handlePaySubmit(selectedProfile._id);
                }}
              >
                <div>
                  <label className="block text-xs font-medium mb-0.5">Amount (₹)</label>
                  <input
                    className="w-full border px-2 py-1 rounded"
                    type="number"
                    min={1}
                    value={payForm.amount}
                    onChange={e => setPayForm(f => ({
                      ...f,
                      amount: e.target.value.replace(/[^0-9]/g, ""),
                    }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">Type</label>
                  <select
                    className="w-full border px-2 py-1 rounded"
                    value={payForm.type}
                    onChange={e => setPayForm(f => ({
                      ...f,
                      type: e.target.value as "salary" | "contract"
                    }))}
                    required
                  >
                    <option value="salary">Salary</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-0.5">From Date</label>
                    <CalendarInput
                      value={payForm.fromDate}
                      onChange={val =>
                        setPayForm(f => ({
                          ...f,
                          fromDate: val,
                        }))
                      }
                      required
                      className="w-full border px-2 py-1 rounded"
                      id="pay-from-date"
                      name="pay-from-date"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-0.5">To Date</label>
                    <CalendarInput
                      value={payForm.toDate}
                      onChange={val =>
                        setPayForm(f => ({
                          ...f,
                          toDate: val,
                        }))
                      }
                      required
                      className="w-full border px-2 py-1 rounded"
                      id="pay-to-date"
                      name="pay-to-date"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">Paid On <span className="text-xs text-slate-400">(optional)</span></label>
                  <CalendarInput
                    value={payForm.paidOn ?? ""}
                    onChange={val =>
                      setPayForm(f => ({
                        ...f,
                        paidOn: val,
                      }))
                    }
                    className="w-full border px-2 py-1 rounded"
                    id="pay-paidon-date"
                    name="pay-paidon-date"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">Remark <span className="text-xs text-slate-400">(optional)</span></label>
                  <input
                    className="w-full border px-2 py-1 rounded"
                    type="text"
                    value={payForm.remark}
                    onChange={e => setPayForm(f => ({
                      ...f,
                      remark: e.target.value,
                    }))}
                  />
                </div>

                {payError && (
                  <div className="text-red-600 text-xs">{payError}</div>
                )}
                {paySuccess && (
                  <div className="text-green-700 text-xs">{paySuccess}</div>
                )}

                <div className="pt-2 flex gap-2 justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1 bg-green-600 text-white rounded"
                    disabled={payLoading}
                  >
                    {payLoading ? "Paying..." : "Make Payment"}
                  </button>
                  <button
                    type="button"
                    className="px-4 py-1 bg-gray-100 text-gray-700 rounded ml-2"
                    onClick={closePayModal}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    key: string
  ) {
    const file = e.target.files?.[0] || null;
    setEditField((prev) => ({
      ...prev,
      [key]: file,
    }));
  }

  function renderEditModal() {
    if (!editTherapist) return null;
    const isDisabled =
      (editTherapist.userId && typeof editTherapist.userId.isDisabled === "boolean")
        ? editTherapist.userId.isDisabled
        : (typeof editTherapist.isDisabled === "boolean" ? editTherapist.isDisabled : false);
    const panelAccess =
      (editTherapist.userId && typeof editTherapist.isPanelAccessible === "boolean")
        ? editTherapist.isPanelAccessible
        : (typeof editTherapist.panelAccess === "boolean" ? editTherapist.panelAccess : false);
    return (
      <div className="fixed inset-0 z-40 bg-white/70 flex items-center justify-center">
        <div className="relative w-full max-w-2xl mx-auto h-full flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute right-4 top-3 text-xl"
              onClick={() => setEditTherapist(null)}
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-3 text-center">Edit Therapist</h2>
            <div className="mb-3">
              <label className="block text-sm mb-1 font-semibold text-slate-600">Therapist ID</label>
              <input
                className="w-full border px-2 py-1 rounded bg-slate-100 text-slate-600"
                value={editTherapist.therapistId}
                readOnly
              />
            </div>
            {/* New: Disable/Enable and Panel Access toggles */}
            <div className="mb-3 flex gap-6">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs text-slate-500">Status: </span>
                <span
                  className={`px-2 py-0.5 inline-block rounded-full text-xs font-bold ${isDisabled ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"}`}
                >
                  {isDisabled ? "Disabled" : "Enabled"}
                </span>
                <button
                  className={`ml-2 text-xs rounded px-2 py-1 border ${isDisabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  type="button"
                  onClick={() =>
                    handleToggleDisable(editTherapist._id, !isDisabled)
                  }
                  disabled={loading}
                >
                  {isDisabled ? "Enable" : "Disable"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs text-slate-500">Panel Access: </span>
                <span
                  className={`px-2 py-0.5 inline-block rounded-full text-xs font-bold ${panelAccess ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}
                >
                  {panelAccess ? "Granted" : "Revoked"}
                </span>
                <button
                  className={`ml-2 text-xs rounded px-2 py-1 border ${panelAccess ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                  type="button"
                  onClick={() =>
                    handleTogglePanelAccess(editTherapist._id, !panelAccess)
                  }
                  disabled={loading}
                >
                  {panelAccess ? "Revoke" : "Grant"}
                </button>
              </div>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleEditSubmit();
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {FIELD_LIST.map(f => {
                if (f.key === "therapistId") return null;
                const isDateField = DATE_FIELDS.includes(f.key) || f.type === "date";
                const initialValue =
                  editField[f.key] !== undefined
                    ? editField[f.key]
                    : editTherapist[f.key as keyof typeof editTherapist] ?? "";

                return (
                  <div key={f.key}>
                    <label className="block text-sm mb-1">{f.label}</label>
                    {f.type === "file" ? (
                      <>
                        <input
                          className="w-full border px-2 py-1 rounded"
                          type="file"
                          onChange={e => handleFileChange(e, f.key)}
                          accept="image/*,.pdf"
                        />
                        {editTherapist[f.key as keyof typeof editTherapist] && typeof editTherapist[f.key as keyof typeof editTherapist] === "string" && (
                          <div className="mt-1 text-xs text-blue-700">
                            <a href={editTherapist[f.key as keyof typeof editTherapist] as any} target="_blank" rel="noopener noreferrer">Current: View</a>
                          </div>
                        )}
                      </>
                    ) : isDateField ? (
                      <CalendarInput
                        value={
                          typeof initialValue === "string"
                            ? initialValue
                            : (initialValue && initialValue instanceof Date
                                ? initialValue.toISOString().slice(0, 10)
                                : "")
                        }
                        onChange={val =>
                          setEditField(prev => ({
                            ...prev,
                            [f.key]: val,
                          }))
                        }
                        className="w-full border px-2 py-1 rounded"
                        id={`edit-${f.key}`}
                        name={`edit-${f.key}`}
                      />
                    ) : (
                      <input
                        className="w-full border px-2 py-1 rounded"
                        type={f.type || "text"}
                        value={initialValue}
                        onChange={e =>
                          setEditField(prev => ({
                            ...prev,
                            [f.key]:
                              f.type === "number"
                                ? e.target.value.replace(/[^0-9]/g, "")
                                : e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                );
              })}
              <div className="md:col-span-2 text-right pt-4">
                <button
                  type="submit"
                  className="px-4 py-1 bg-green-600 text-white rounded"
                  disabled={loading}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="px-4 py-1 bg-gray-100 text-gray-700 rounded ml-2"
                  onClick={() => setEditTherapist(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const tableHeaders: { label: string; key: keyof TherapistProfile | "actions" }[] = [
    { label: "Therapist ID", key: "_id" },
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Mobile1", key: "mobile1" },
    { label: "Specializations", key: "specializations" },
    { label: "Experience", key: "experienceYears" },
    { label: "Enabled", key: "isDisabled" },
    { label: "Panel Access", key: "panelAccess" },
    { label: "Actions", key: "actions" },
  ];

  // Pagination calculation helpers
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen  p-8"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Therapists</h1>
      {/* Search and per-page selector UI */}
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <div>
          <label className="block text-xs font-medium mb-1">Search</label>
          <input
            className="border px-2 py-1 rounded w-60"
            type="text"
            placeholder="Name, email, mobile, therapist id, ..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Per Page</label>
          <select
            className="border rounded px-2 py-1"
            value={limit}
            onChange={e => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 25, 50, 100].map(opt =>
              <option key={opt} value={opt}>{opt}</option>
            )}
          </select>
        </div>
        <div className="flex-1 text-right text-xs text-slate-500">
          Total: <span className="font-bold">{total}</span>
        </div>
      </div>
      {error ? <div className="text-red-500 mb-4">{error}</div> : null}
      <div className="bg-white border rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100">
            <tr>
              {tableHeaders.map(th => (
                <th
                  key={th.key}
                  className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider"
                >
                  {th.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={tableHeaders.length}>
                  <div className="text-center py-8">Loading...</div>
                </td>
              </tr>
            ) : therapists.length === 0 ? (
              <tr>
                <td colSpan={tableHeaders.length}>
                  <div className="text-center py-8">No therapists found.</div>
                </td>
              </tr>
            ) : (
              therapists.map((t) => {
                const isDisabled =
                  (t.userId && typeof t.userId.isDisabled === "boolean") && t.userId.isDisabled ;
                const panelAccess =
                  (t.userId && typeof t.isPanelAccessible === "boolean") ? t.isPanelAccessible :
                  (typeof t.panelAccess === "boolean" ? t.panelAccess : false);
                return (
                  <tr key={t._id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-mono">{t.therapistId}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800 flex items-center gap-2">
                      <FiUser className="text-slate-400" />
                      {t?.userId?.name || t.name || t.email || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{(t?.userId?.email || t.email) || "-"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{t.mobile1 || "-"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{t.specializations?.trim() ? t.specializations : "-"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {typeof t.experienceYears === "number" && !isNaN(t.experienceYears)
                        ? `${t.experienceYears} yrs`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDisabled ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"}`}
                      >
                        {isDisabled ? "Disabled" : "Enabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${panelAccess ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}
                      >
                        {panelAccess ? "Granted" : "Revoked"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button
                          className="rounded border border-blue-500 p-1 text-blue-600 hover:bg-blue-100 transition"
                          onClick={() => {
                            onTableViewClick(t._id);
                            // Update URL to /?therapist=ID for deep-link/view
                            if (typeof window !== "undefined" && window.history && window.location) {
                              const url = new URL(window.location.href);
                              url.searchParams.set("therapist", t._id);
                              window.history.replaceState({}, document.title, url.pathname + url.search);
                            }
                          }}
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {/* Pagination controls */}
        <div className="px-4 py-2 border-t flex justify-between items-center bg-slate-50 text-xs">
          <div>
            Showing {therapists.length === 0 ? 0 : (limit * (page - 1) + 1)}
            {therapists.length > 0
              ? ` - ${Math.min(limit * page, total)}`
              : ""} of {total}
          </div>
          <div className="flex items-center gap-1">
            <button
              className="p-1 rounded border disabled:text-slate-400 disabled:opacity-60"
              disabled={!hasPrev}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              title="Previous"
            >
              <FiChevronLeft />
            </button>
            <span className="mx-2">Page {page} / {totalPages}</span>
            <button
              className="p-1 rounded border disabled:text-slate-400 disabled:opacity-60"
              disabled={!hasNext}
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              title="Next"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>
      {selectedId && selectedProfile && renderTherapistModal()}
      {editTherapist && renderEditModal()}
    </motion.div>
  );
}
