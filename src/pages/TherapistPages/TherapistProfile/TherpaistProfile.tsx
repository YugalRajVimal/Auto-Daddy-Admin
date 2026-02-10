import { useEffect, useState, Fragment } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL as string;
const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL as string;

// Utility for formatting dates
function formatDate(dateStr?: string, opts: Intl.DateTimeFormatOptions = {}) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      ...opts,
    });
  } catch {
    return dateStr;
  }
}

// Utility for formatting currency safely
function formatCurrency(amount?: number | null) {
  if (typeof amount === "number" && !isNaN(amount)) {
    try {
      return amount.toLocaleString("en-IN");
    } catch {
      return `${amount}`;
    }
  }
  return "—";
}

type UserType = {
  _id: string;
  role: string;
  name: string;
  email?: string;
  phone?: string;
  authProvider?: string;
  otpAttempts?: number;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  isDisabled?: boolean;
};

type SlotType = {
  slotId?: string;
  label?: string;
  _id?: string;
};

type HolidayType = {
  date: string;
  reason: string;
  isFullDay: boolean;
  slots: SlotType[];
  _id?: string;
};

type EarningType = {
  amount: number;
  type: string;
  fromDate: string;
  toDate: string;
  remark?: string;
  paidOn?: string;
  _id?: string;
};

type TherapistProfileType = {
  _id: string;
  userId: UserType;
  therapistId: string;
  fathersName?: string;
  mobile1?: string;
  mobile2?: string;
  address?: string;
  reference?: string;
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
  specializations?: string;
  experienceYears?: number;
  holidays?: HolidayType[];
  isPanelAccessible?: boolean;
  earnings?: EarningType[];
  // Include other docs if schema allows
  [key: string]: any;
};

type ProfileDataType = {
  user: UserType;
  therapistProfile: TherapistProfileType;
};

// Mapping of known/standard doc keys to labels
const DOCUMENT_FIELD_LABELS: { [key: string]: string } = {
  aadhaarFront: "Aadhaar Front",
  aadhaarBack: "Aadhaar Back",
  photo: "Photo",
  resume: "Resume",
  certificate: "Certificate",
};

function isImageFile(url?: string) {
  if (!url) return false;
  return /\.(jpe?g|png|gif|bmp|webp)$/i.test(url);
}

function isPdfFile(url?: string) {
  if (!url) return false;
  return /\.pdf$/i.test(url);
}

// Document Modal State
type ModalDocType =
  | {
      url: string;
      label: string;
      type: "image" | "pdf" | "other";
    }
  | null;

// Modal overlay for embedded document preview -- HOIST this function to BEFORE any conditional return
function DocumentModal({ modalDoc, onClose }: { modalDoc: ModalDocType; onClose: () => void }) {
  if (!modalDoc) return null;
  return (
    <div
      className="fixed z-[200] inset-0 bg-white/50 bg-opacity-60 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg shadow-lg p-3 flex flex-col items-center max-w-full"
        style={{ maxWidth: "90vw", maxHeight: "95vh", minWidth: "320px" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-red-500 focus:outline-none text-2xl p-1"
          aria-label="Close"
        >
          &#x2715;
        </button>

        <div className="mb-2 mt-5 text-lg font-semibold text-purple-900 text-center">{modalDoc.label}</div>
        <div className="max-w-full max-h-[80vh] flex items-center justify-center">
          {modalDoc.type === "image" && (
            <img
              src={modalDoc.url}
              alt={modalDoc.label}
              className="max-w-full max-h-[75vh] rounded shadow"
              style={{ border: "1px solid #ddd", background: "#fafafa" }}
            />
          )}
          {modalDoc.type === "pdf" && (
            <iframe
              src={modalDoc.url}
              title={modalDoc.label}
              className="min-h-[400px] max-h-[75vh] max-w-full"
              style={{
                width: "calc(80vw)",
                height: "70vh",
                border: "1px solid #dedede",
                background: "#fafafa"
              }}
            ></iframe>
          )}
          {modalDoc.type === "other" && (
            <a
              href={modalDoc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 underline text-[16px]"
            >
              Open {modalDoc.label}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TherpaistProfile() {
  const [profile, setProfile] = useState<ProfileDataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalDoc, setModalDoc] = useState<ModalDocType>(null);

  // Keyboard ESC close handler for modal - always call in top-level, regardless of render phase
  useEffect(() => {
    if (!modalDoc) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setModalDoc(null);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalDoc]);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const token = localStorage.getItem("therapist-token");
        const res = await fetch(`${API_BASE_URL}/api/therapist/profile`, {
          headers: {
            Authorization: token ? `${token}` : "",
          },
        });

        const json = await res.json();
        if (json.success && json.data) {
          setProfile(json.data);
        } else {
          setError(json.message || "Failed to load profile");
        }
      } catch (e: any) {
        setError(e?.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-gray-600 text-lg">Loading profile...</div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  if (!profile) {
    return <div className="p-6 text-gray-500">No profile found.</div>;
  }

  const { therapistProfile } = profile;

  // Helper views for sections
  const infoRow = (label: string, value?: string | number | null, extraClass?: string) =>
    value !== undefined && value !== null && value !== "" ? (
      <div className={`flex flex-col md:flex-row md:items-center ${extraClass}`}>
        <span className="font-semibold text-gray-700 md:w-44">{label}</span>
        <span className="text-gray-900">{value}</span>
      </div>
    ) : null;

  // Document URL resolver: Handles both string and object types
  const docUrl = (fileVal?: any) => {
    if (!fileVal) return null;
    if (typeof fileVal === "object" && fileVal.url) {
      return `${UPLOADS_URL}${fileVal.url.startsWith("/") ? "" : "/"}${fileVal.url}`;
    }
    if (typeof fileVal === "string" && fileVal.trim() !== "") {
      return `${UPLOADS_URL}${fileVal.startsWith("/") ? "" : "/"}${fileVal}`;
    }
    return null;
  };

  // Get all standard and extra document fields
  function getAllDocuments(profileObj: TherapistProfileType) {
    const knownDocKeys = Object.keys(DOCUMENT_FIELD_LABELS);

    // Standard documents first
    const documents: { field: string; label: string; file: any }[] = [];
    for (const key of knownDocKeys) {
      if (profileObj[key] && (typeof profileObj[key] === "string" ? profileObj[key].trim() !== "" : true)) {
        documents.push({
          field: key,
          label: DOCUMENT_FIELD_LABELS[key] || key,
          file: profileObj[key],
        });
      }
    }

    // Find extra document-looking keys (objects with "url", or strings that look like paths)
    const candidateDocKeys = Object.keys(profileObj)
      .filter(
        (key) =>
          !knownDocKeys.includes(key) &&
          profileObj[key] &&
          (
            (typeof profileObj[key] === "object" && profileObj[key].url) ||
            (typeof profileObj[key] === "string" && profileObj[key].trim() && (
              profileObj[key].includes("/") ||
              profileObj[key].includes(".pdf") ||
              profileObj[key].includes(".jpg") ||
              profileObj[key].includes(".jpeg") ||
              profileObj[key].includes(".png")
            ))
          )
      );

    for (const key of candidateDocKeys) {
      documents.push({
        field: key,
        label: key
          .replace(/([A-Z])/g, " $1")
          .replace(/^\w/, (c) => c.toUpperCase())
          .replace(/_/g, " "),
        file: profileObj[key],
      });
    }

    return documents;
  }

  const allDocuments = getAllDocuments(therapistProfile);

  return (
    <Fragment>
      {/* Modal for viewing document in big size */}
      <DocumentModal modalDoc={modalDoc} onClose={() => setModalDoc(null)} />

      <div className="max-w-3xl mx-auto p-6 md:p-10 bg-white rounded-xl shadow-lg mt-4 mb-10 text-[15px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-center mb-6 pb-5 border-b">
          {/* Icon/avatar */}
          <div className="flex-shrink-0 flex items-center w-18 h-18 rounded-full bg-purple-50 justify-center text-purple-700 text-2xl font-bold">
            <span>
              {therapistProfile.userId?.name
                ? therapistProfile.userId.name
                    .split(" ")
                    .map((s: string) => s[0])
                    .join("")
                    .toUpperCase()
                : "T"}
            </span>
          </div>
          {/* Name + Role */}
          <div>
            <div className="text-2xl font-bold text-purple-800 leading-tight">
              {therapistProfile.userId?.name}
            </div>
            <div className="text-gray-500 font-medium">
              ID: <span className="font-mono">{therapistProfile.therapistId}</span>
            </div>
          </div>
        </div>

        {/* Personal/Contact Details */}
        <div className="mb-8">
          <h3 className="text-lg text-purple-700 font-semibold mb-3">Personal Information</h3>
          <div className="space-y-2">
            {infoRow("Email", therapistProfile.userId?.email)}
            {infoRow("Mobile", therapistProfile.mobile1)}
            {infoRow("Alt. Mobile", therapistProfile.mobile2)}
            {infoRow("Phone (Account)", therapistProfile.userId?.phone)}
            {infoRow("Father's Name", therapistProfile.fathersName)}
            {/* {infoRow("Status", (
              therapistProfile.userId?.status ? (
                <span
                  className={
                    therapistProfile.userId?.status === "active"
                      ? "text-green-600 font-semibold"
                      : "text-orange-600"
                  }
                >
                  {therapistProfile.userId?.status}
                </span>
              ) : ""
            ))} */}
            <div>
              {infoRow("Phone Verified", therapistProfile.userId?.phoneVerified ? "Yes" : "No")}
              {infoRow("Email Verified", therapistProfile.userId?.emailVerified ? "Yes" : "No")}
            </div>
          </div>
        </div>

        {/* Address and About */}
        <div className="mb-8">
          <h3 className="text-lg text-purple-700 font-semibold mb-3">Address & Reference</h3>
          <div className="space-y-2">
            {infoRow("Address", therapistProfile.address)}
            {infoRow("Reference", therapistProfile.reference)}
            {infoRow("Remarks", therapistProfile.remarks)}
          </div>
        </div>

        {/* Specializations and Experience */}
        <div className="mb-8">
          <h3 className="text-lg text-purple-700 font-semibold mb-3">Specializations & Experience</h3>
          <div className="space-y-2">
            {infoRow("Specializations", therapistProfile.specializations)}
            {infoRow("Experience (years)", therapistProfile.experienceYears)}
            {infoRow("Panel Access", therapistProfile.isPanelAccessible ? "Yes" : "No")}
          </div>
        </div>

        {/* Social Links, Show Only the ones present */}
        <div className="mb-8">
          <h3 className="text-lg text-purple-700 font-semibold mb-3">Social/Professional Links</h3>
          <div className="flex flex-wrap gap-3 text-[15px]">
            {therapistProfile.linkedin && (
              <a href={therapistProfile.linkedin} target="_blank" className="text-blue-700 hover:underline">
                LinkedIn
              </a>
            )}
            {therapistProfile.twitter && (
              <a href={therapistProfile.twitter} target="_blank" className="text-sky-500 hover:underline">
                Twitter
              </a>
            )}
            {therapistProfile.facebook && (
              <a href={therapistProfile.facebook} target="_blank" className="text-blue-600 hover:underline">
                Facebook
              </a>
            )}
            {therapistProfile.instagram && (
              <a href={therapistProfile.instagram} target="_blank" className="text-pink-700 hover:underline">
                Instagram
              </a>
            )}
            {therapistProfile.youtube && (
              <a href={therapistProfile.youtube} target="_blank" className="text-red-700 hover:underline">
                YouTube
              </a>
            )}
            {therapistProfile.website && (
              <a href={therapistProfile.website} target="_blank" className="text-purple-900 hover:underline">
                Website
              </a>
            )}
            {therapistProfile.blog && (
              <a href={therapistProfile.blog} target="_blank" className="text-green-700 hover:underline">
                Blog
              </a>
            )}
            {therapistProfile.portfolio && (
              <a href={therapistProfile.portfolio} target="_blank" className="text-indigo-800 hover:underline">
                Portfolio
              </a>
            )}
            {![
              therapistProfile.linkedin,
              therapistProfile.twitter,
              therapistProfile.facebook,
              therapistProfile.instagram,
              therapistProfile.youtube,
              therapistProfile.website,
              therapistProfile.blog,
              therapistProfile.portfolio,
            ].some(Boolean) && <span className="text-gray-400">Not Provided</span>}
          </div>
        </div>

        {/* Bank & Payment Info */}
        <div className="mb-8">
          <h3 className="text-lg text-purple-700 font-semibold mb-3">Bank / Payment Information</h3>
          <div className="space-y-2">
            {infoRow("Account Holder", therapistProfile.accountHolder)}
            {infoRow("Bank Name", therapistProfile.bankName)}
            {infoRow("IFSC", therapistProfile.ifsc)}
            {infoRow("Account Number", therapistProfile.accountNumber)}
            {infoRow("UPI", therapistProfile.upi)}
            {!therapistProfile.accountHolder &&
              !therapistProfile.bankName &&
              !therapistProfile.ifsc &&
              !therapistProfile.accountNumber &&
              !therapistProfile.upi && (
                <span className="text-gray-400">Not Provided</span>
              )}
          </div>
        </div>

        {/* Document Attachments */}
        <div className="mb-8">
          <h3 className="text-lg text-purple-700 font-semibold mb-3">Documents</h3>
          <div className="flex flex-col md:flex-row flex-wrap gap-4 text-[15px]">
            {allDocuments.length > 0 ? (
              allDocuments.map((doc) => {
                const url = docUrl(doc.file);
                if (!url) {
                  return (
                    <div key={doc.field}>
                      <span className="text-gray-400">
                        {doc.label} not uploaded
                      </span>
                    </div>
                  );
                }

                // Decide type for preview
                let type: "image" | "pdf" | "other" = "other";
                if (isImageFile(url)) type = "image";
                else if (isPdfFile(url)) type = "pdf";
                // Thumbnail style for image/pdf/other
                return (
                  <div key={doc.field} className="flex flex-col items-center w-40">
                    <div
                      className="w-full flex flex-col items-center cursor-pointer group"
                      onClick={() =>
                        setModalDoc({ url, label: doc.label, type })
                      }
                      title="Click to view"
                      tabIndex={0}
                      style={{ outline: "none" }}
                    >
                      {type === "image" ? (
                        <img
                          src={url}
                          alt={doc.label}
                          className="h-24 w-28 object-cover object-center border border-gray-300 rounded-md shadow group-hover:ring-2 ring-purple-400"
                          loading="lazy"
                        />
                      ) : type === "pdf" ? (
                        <div className="flex flex-col items-center justify-center h-24 w-28 bg-gray-100 border border-gray-300 rounded-md group-hover:ring-2 ring-purple-400">
                          <span className="text-[3rem] text-red-600">&#128462;</span>
                          <span className="text-xs text-gray-700">PDF</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-24 w-28 bg-gray-100 border border-gray-300 rounded-md group-hover:ring-2 ring-purple-400">
                          <span className="text-[2.25rem] text-gray-600">&#128196;</span>
                          <span className="text-xs text-gray-700">Document</span>
                        </div>
                      )}
                      <div className="text-center mt-2 truncate max-w-[8rem]">
                        <span className="text-purple-700 font-semibold text-sm">{doc.label}</span>
                      </div>
                    </div>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs mt-1 text-blue-800 underline"
                      onClick={e => e.stopPropagation()}
                    >
                      Open in new tab
                    </a>
                  </div>
                );
              })
            ) : (
              <span className="text-gray-400">No documents uploaded</span>
            )}
          </div>
        </div>

        {/* Holidays/Leaves */}
        <div className="mb-8">
          <h3 className="text-lg text-purple-700 font-semibold mb-3">Holidays / Leaves</h3>
          <div className="overflow-auto">
            <table className="min-w-[340px] w-full text-sm border">
              <thead>
                <tr className="bg-purple-50 text-gray-700 border-b">
                  <th className="py-2 px-2 font-semibold text-left">Date</th>
                  <th className="py-2 px-2 font-semibold text-left">Type</th>
                  <th className="py-2 px-2 font-semibold text-left">Reason</th>
                  <th className="py-2 px-2 font-semibold text-left">Slots</th>
                </tr>
              </thead>
              <tbody>
                {therapistProfile.holidays && therapistProfile.holidays.length > 0 ? (
                  therapistProfile.holidays
                    .sort((a, b) => (a.date < b.date ? 1 : -1))
                    .map((holiday) => (
                      <tr key={holiday._id || holiday.date} className="border-b hover:bg-purple-50">
                        <td className="py-1 px-2">{formatDate(holiday.date)}</td>
                        <td className="py-1 px-2">
                          {holiday.isFullDay ? (
                            <span className="text-green-800 font-semibold">Full Day</span>
                          ) : (
                            <span className="text-yellow-700 font-semibold">Partial</span>
                          )}
                        </td>
                        <td className="py-1 px-2">
                          {holiday.reason ? holiday.reason : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="py-1 px-2">
                          {holiday.isFullDay ? (
                            <span className="text-gray-400">—</span>
                          ) : holiday.slots && holiday.slots.length > 0 ? (
                            <ul className="list-disc pl-3">
                              {holiday.slots.map((slot) => (
                                <li key={slot._id || slot.slotId}>{slot.label || slot.slotId}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-2 text-gray-400">
                      No holidays found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Earnings */}
        <div>
          <h3 className="text-lg text-purple-700 font-semibold mb-3">Earnings</h3>
          {therapistProfile.earnings && therapistProfile.earnings.length > 0 ? (
            <div className="overflow-auto">
              <table className="min-w-[380px] w-full text-sm border">
                <thead>
                  <tr className="bg-purple-50 text-gray-700 border-b">
                    <th className="py-2 px-2 font-semibold text-left">Paid Date</th>
                    <th className="py-2 px-2 font-semibold text-left">Amount (₹)</th>
                    <th className="py-2 px-2 font-semibold text-left">Type</th>
                    <th className="py-2 px-2 font-semibold text-left">Period</th>
                    <th className="py-2 px-2 font-semibold text-left">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {therapistProfile.earnings
                    .sort((a, b) =>
                      a.paidOn && b.paidOn
                        ? new Date(b.paidOn).getTime() - new Date(a.paidOn).getTime()
                        : b.toDate && a.toDate
                          ? new Date(b.toDate).getTime() - new Date(a.toDate).getTime()
                          : 0
                    )
                    .map((e) => (
                      <tr key={e._id || `${e.fromDate}-${e.amount}`}>
                        <td className="py-1 px-2">{formatDate(e.paidOn || e.toDate)}</td>
                        <td className="py-1 px-2 font-mono text-purple-900 font-semibold">
                          ₹{formatCurrency(e.amount)}
                        </td>
                        <td className="py-1 px-2 capitalize">{e.type}</td>
                        <td className="py-1 px-2">
                          {formatDate(e.fromDate)} - {formatDate(e.toDate)}
                        </td>
                        <td className="py-1 px-2">
                          {e.remark || <span className="text-gray-400">—</span>}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-400">No earnings recorded yet.</div>
          )}
        </div>
      </div>
    </Fragment>
  );
}
