import React, { useState, ChangeEvent, useRef, useEffect } from "react";
import axios from "axios";

/**
 * Parent Complete Profile (one-step form)
 * Implements API as in @parent.routes.js and @parent.controller.js (no OTP, direct sign up)
 * PATCH must use FormData and NOT include Content-Type header, so multer parses req.body correctly.
 */

const API_URL = import.meta.env.VITE_API_URL || "";

// TypeScript interface for our form state (matches backend and RegisterPatient.tsx)
interface ParentFormState {
  email: string;
  childFullName: string;
  gender: string;
  childDOB: string;
  fatherFullName: string;
  motherFullName: string;
  parentEmail: string;
  mobile1: string;
  mobile2: string;
  address: string;
  areaName: string;
  pincode: string;
  diagnosisInfo: string;
  childReference: string;
  parentOccupation: string;
  remarks: string;
  otherDocument?: File;
}

// Initial state for the form (all fields blank)
const initialState: ParentFormState = {
  email: "",
  childFullName: "",
  gender: "",
  childDOB: "",
  fatherFullName: "",
  motherFullName: "",
  parentEmail: "",
  mobile1: "",
  mobile2: "",
  address: "",
  areaName: "",
  pincode: "",
  diagnosisInfo: "",
  childReference: "",
  parentOccupation: "",
  remarks: "",
  otherDocument: undefined,
};

// All required fields, as per backend (except mobile2/remarks/otherDocument)
const mandatoryFields: (keyof Omit<ParentFormState, "mobile2" | "remarks" | "otherDocument">)[] = [
  "email",
  "childFullName",
  "gender",
  "childDOB",
  "fatherFullName",
  "motherFullName",
  "parentEmail",
  "mobile1",
  "address",
  "areaName",
  "pincode",
  "diagnosisInfo",
  "childReference",
  "parentOccupation",
];

// Read name and email from URL or localStorage if possible
function getReceivedUser() {
  const params = new URLSearchParams(window.location.search);
  let displayName = params.get("name") || "";
  let displayEmail = params.get("email") || "";
  if (!displayName) displayName = localStorage.getItem("cdc_signup_name") || "";
  if (!displayEmail) displayEmail = localStorage.getItem("cdc_signup_email") || "";
  return { displayName, displayEmail };
}

const ParentCompleteProfile: React.FC = () => {
  const { displayName, displayEmail } = getReceivedUser();

  const [formData, setFormData] = useState<ParentFormState>({
    ...initialState,
    email: displayEmail || "",
    // childFullName left blank, not from displayName!
    childFullName: "",
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Card/scroll
  const mainCardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mainCardRef.current) {
      mainCardRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [formError, info, success]);

  // Validation (matches backend expectations, see @parent.controller.js)
  const validate = (): string | null => {
    for (const key of mandatoryFields) {
      if (!formData[key] || (typeof formData[key] === "string" && formData[key].trim() === "")) {
        return "Please fill all the mandatory fields.";
      }
    }
    // Validate email addresses with @ for minimal check
    if (!formData.email.includes("@") || !formData.parentEmail.includes("@")) {
      return "Please enter valid email addresses.";
    }
    if (!/^\d{8,}$/.test(formData.mobile1)) {
      return "Please enter a valid mobile number (min 8 digits).";
    }
    return null;
  };

  // Update form field
  const update = (key: keyof ParentFormState, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  // Submit form (direct parent signup, no OTP)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null); setInfo(null); setSuccess(false);
    const error = validate();
    if (error) { setFormError(error); return; }
    setLoading(true);

    try {
      // Collect all form fields as the backend (completeParentProfile) might extend to use any of them
      const payload: { [key: string]: any } = {};
      Object.entries(formData).forEach(([k, v]) => {
        // Only append defined fields (empty strings are fine if needed by backend)
        if (v !== undefined) payload[k] = v;
      });

      // Get token from localStorage and send in Authorization header
      const token = localStorage.getItem("patient-token");

      let response: any = null;
      let data: any = {};

      try {
        response = await axios.post(
          `${API_URL}/api/parent/complete-profile`,
          payload,
          {
            headers: token
              ? { Authorization: `${token}` }
              : {},
          }
        );
        data = response.data;
      } catch (err: any) {
        // Handle backend errors from completeParentProfile, @parent.controller.js 141-233
        if (err?.response?.data) {
          data = err.response.data;

          // Specific known backend error responses
          if (data && typeof data === "object") {
            // Unauthorized or not found user
            if (typeof data.error === "string") {
              if (
                data.error === "Unauthorized: No user ID found." ||
                data.error === "No parent user found."
              ) {
                setFormError(data.error);
                setLoading(false);
                return;
              }
              // Phone in use by another user
              if (
                data.error.startsWith("This phone number is already used by another user")
              ) {
                setFormError(data.error);
                setLoading(false);
                return;
              }
              // Missing required child name
              if (
                data.error.startsWith("Child name (childName) is required")
              ) {
                setFormError("Please provide your child's name.");
                setLoading(false);
                return;
              }
              // Unable to generate patient id
              if (data.error === "Could not generate patient ID.") {
                setFormError("Could not generate patient ID. Please try again.");
                setLoading(false);
                return;
              }
              // Catch generic backend error string
              setFormError(data.error);
              setLoading(false);
              return;
            }
            if (data.details) {
              setFormError(data.details);
              setLoading(false);
              return;
            }
          }
        }
        // General fallback for network/server error
        setFormError("Server error. Please try again later.");
        setLoading(false);
        return;
      }

      // 200, success!
      if (response && response.status >= 200 && response.status < 300 && data.success) {
        setInfo("Parent account created. You may now login.");
        setSuccess(true);
      } else if (data && typeof data === "object" && (data.message || data.error)) {
        setFormError(data.message || data.error || "Failed to complete signup.");
      } else {
        setFormError("Failed to complete signup.");
      }
    } catch (e: any) {
      setFormError((e && typeof e === "object" && e.message) ? e.message : "Server error. Please try again later.");
    }
    setLoading(false);
  };

  // --- Main Render ---
  return (
    <div
      className="w-full min-h-screen h-screen flex flex-col justify-center items-center px-0 py-0"
      ref={mainCardRef}
      style={{
        background: "linear-gradient(130deg, #f5f7fa 0%, #cfe0fc 36%, #fbc2eb 100%)",
        width: "100vw",
        height: "100vh",
        padding: 0,
        margin: 0,
        overscrollBehavior: "auto",
      }}
    >
      <div className="w-full px-3 sm:px-8 md:px-12 lg:px-14 xl:px-24">
        <h2
          className="text-[2.2rem] md:text-4xl font-black mb-4 text-center bg-gradient-to-r from-blue-700 via-blue-500 to-pink-600 bg-clip-text text-transparent tracking-tight"
          style={{ letterSpacing: "0.01em", lineHeight: 1.15 }}
        >
          Parent Sign Up
        </h2>
        {/* --- Display name received in query if present --- */}
        {displayName && (
          <div className="mb-2 flex flex-col">
            <label className="text-sm md:text-base text-blue-800 font-semibold mb-1">
              Name received (from link or invitation)
            </label>
            <div className="rounded-md bg-blue-50 text-blue-900 px-3 py-2 text-base font-bold">
              {displayName}
            </div>
          </div>
        )}
        {!success && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-2">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 rounded-3xl bg-white/[.18] p-5 md:p-10 shadow-inner border-2 border-blue-50"
            style={{ maxHeight: "52vh", overflowY: "auto" }}
          >
            {/* email readonly if autofilled */}
            <Input
              label="Login Email*"
              value={formData.email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => update("email", e.target.value)}
              type="email"
              autoComplete="email"
              required
              disabled={!!displayEmail}
            />
            <Input
              label="Child Full Name (CAPITAL LETTERS)*"
              value={formData.childFullName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => update("childFullName", e.target.value)}
              required
              // always editable, not disabled - not prefilled from displayName!
            />
            <Input
              label="Gender*"
              value={formData.gender}
              onChange={(e: ChangeEvent<HTMLInputElement>) => update("gender", e.target.value)}
              placeholder="Male / Female / Other"
              required
            />
            <Input
              label="Date of Birth*"
              value={formData.childDOB}
              onChange={(e: ChangeEvent<HTMLInputElement>) => update("childDOB", e.target.value)}
              type="date"
              required
            />
            <Input
              label="Father's Full Name*"
              value={formData.fatherFullName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => update("fatherFullName", e.target.value)}
              required
            />
            <Input
              label="Mother's Full Name*"
              value={formData.motherFullName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => update("motherFullName", e.target.value)}
              required
            />
            <Input
              label="Alternate Parent Email*"
              value={formData.parentEmail}
              onChange={(e: ChangeEvent<HTMLInputElement>) => update("parentEmail", e.target.value)}
              type="email"
              required
            />
            <Input
              label="Mobile Number 1*"
              value={formData.mobile1}
              onChange={(e: ChangeEvent<HTMLInputElement>) => update("mobile1", e.target.value)}
              type="tel"
              required
            />
            <Input
              label="Mobile Number 2 (optional)"
              value={formData.mobile2}
              onChange={(e: ChangeEvent<HTMLInputElement>) => update("mobile2", e.target.value)}
              type="tel"
            />
            <Input
              label="Complete Address*"
              value={formData.address}
              onChange={(e: ChangeEvent<HTMLInputElement>) => update("address", e.target.value)}
              required
            />
            <Input
              label="Area Name*"
              value={formData.areaName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => update("areaName", e.target.value)}
              required
            />
            <Input
              label="Pincode*"
              value={formData.pincode}
              onChange={(e: ChangeEvent<HTMLInputElement>) => update("pincode", e.target.value)}
              required
            />
            <Input
              label="Diagnosis Info*"
              value={formData.diagnosisInfo}
              onChange={(e: ChangeEvent<HTMLInputElement>) => update("diagnosisInfo", e.target.value)}
              required
            />
            <Input
              label="Child Reference*"
              value={formData.childReference}
              onChange={(e: ChangeEvent<HTMLInputElement>) => update("childReference", e.target.value)}
              required
            />
            <Input
              label="Parent Occupation*"
              value={formData.parentOccupation}
              onChange={(e: ChangeEvent<HTMLInputElement>) => update("parentOccupation", e.target.value)}
              required
            />
            <Input
              label="Additional Remarks (optional)"
              value={formData.remarks}
              as="textarea"
              rows={3}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => update("remarks", e.target.value)}
            />
            <div className="flex flex-col sm:col-span-2">
              <File
                label="Upload Other Document (optional)"
                onChange={(file: File) => update("otherDocument", file)}
              />
              {formData.otherDocument && (
                <div className="text-xs text-gray-600 mt-1 italic truncate">
                  File: {formData.otherDocument.name}
                </div>
              )}
            </div>
          </div>
          {formError && (
            <div className="text-red-700 text-[15px] rounded bg-red-100/70 px-3 py-1 mt-2 shadow transition animate-shake">
              {formError}
            </div>
          )}
          {info && (
            <div className="text-green-700 text-[15px] rounded bg-green-100/70 px-3 py-1 mt-2 shadow transition">
              {info}
            </div>
          )}
          <div className="py-3" />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-700 via-blue-500 to-pink-600 hover:from-pink-600 hover:to-blue-700 text-white rounded-2xl font-extrabold text-lg shadow transition-transform hover:-translate-y-1 hover:shadow-xl active:scale-95"
            style={{ letterSpacing: "0.01em" }}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
          <div className="py-1" />
        </form>
        )}
         <div className="mt-10 flex justify-center w-full">
          <button
            className="px-6 py-2 rounded bg-indigo-700 text-white shadow-lg hover:bg-indigo-800 font-semibold transition"
            onClick={() => (window.location.href = "/signin")}
          >
            Back to Sign In
          </button>
        </div>
        {/* ---- SUCCESS ---- */}
        {success && (
          <div className="w-full flex flex-col items-center py-16 bg-white/[.23] rounded-3xl shadow-xl border-2 border-blue-50">
            <div className="text-green-700 text-2xl font-extrabold mb-3 tracking-tight text-center" style={{ letterSpacing: "0.01em" }}>
              Sign Up Successful!
            </div>
            <div className="text-gray-800 mb-7 font-medium text-lg text-center">
              Your parent account has been created.
              <br />
              You may now login.
            </div>
            <a
              href="/user"
              className="mt-2 px-12 py-3 bg-gradient-to-r from-blue-700 via-blue-500 to-pink-600 hover:from-pink-600 hover:to-blue-700 text-white rounded-2xl font-extrabold text-lg shadow transition-transform hover:-translate-y-1 hover:shadow-xl"
              style={{ letterSpacing: "0.01em" }}
            >
              Go to Parent Login
            </a>
          </div>
        )}
      </div>
      <div className="h-6 w-full" />
    </div>
  );
};

// Generic input and file components

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  as?: "input" | "textarea";
  rows?: number;
  required?: boolean;
}

function Input({
  label,
  as = "input",
  rows,
  required,
  style,
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col min-w-0">
      <label className="text-sm md:text-base text-blue-800 font-semibold mb-1">
        {label}
        {required && !label.includes("*") && (
          <span className="text-red-600 ml-0.5">*</span>
        )}
      </label>
      {as === "textarea" ? (
        <textarea
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          rows={rows}
          required={required}
          style={{
            ...style,
            resize: "vertical",
            minHeight: 48,
            fontSize: "1rem",
            background:
              "linear-gradient(120deg,rgba(245,247,250,0.14),rgba(210,220,255,0.15))",
          }}
          className="p-3 border-2 border-blue-50 rounded-lg bg-white/[.62] focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition text-[1rem]"
          disabled={props.disabled}
        />
      ) : (
        <input
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          required={required}
          style={{
            ...style,
            background:
              "linear-gradient(120deg,rgba(245,247,250,0.17),rgba(210,220,255,0.16))",
            fontSize: "1rem",
          }}
          className="p-3 border-2 border-blue-50 rounded-lg bg-white/[.65] focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition text-[1rem]"
        />
      )}
    </div>
  );
}

interface FileProps {
  label: string;
  onChange: (file: File) => void;
  required?: boolean;
}
function File({ label, onChange }: FileProps) {
  return (
    <div>
      <label className="text-sm md:text-base font-semibold text-blue-700 block mb-2">
        {label}
      </label>
      <div className="border-2 border-dashed border-blue-100 rounded-xl bg-white/[.23] text-center hover:border-pink-300 transition flex items-center justify-center h-16">
        <input
          type="file"
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              onChange(e.target.files[0]);
            }
          }}
          className="text-sm px-4 py-2 cursor-pointer w-full opacity-90"
          style={{
            background: "transparent",
            border: "none",
          }}
        />
      </div>
    </div>
  );
}

// Animate-shake for errors (CSS-injected)
const style = document.createElement('style');
style.innerHTML = `
@keyframes shake {
  0% { transform: translateX(0);}
  15% { transform: translateX(-7px);}
  30% { transform: translateX(7px);}
  45% { transform: translateX(-5px);}
  60% { transform: translateX(5px);}
  75% { transform: translateX(-3px);}
  100% { transform: translateX(0);}
}
.animate-shake {
  animation: shake 0.38s cubic-bezier(.36,.07,.19,.97) 1;
}
`;
if (typeof window !== "undefined" && !document.querySelector("#parent-signup-anim-style")) {
  style.id = "parent-signup-anim-style";
  document.head.appendChild(style);
}

export default ParentCompleteProfile;