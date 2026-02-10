import React, { useMemo, useState, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Helper: parse query params from window.location
function getQueryParams() {
  const params: Record<string, string> = {};
  const search = window.location.search;
  if (search && search.length > 1) {
    const pairs = search.substring(1).split("&");
    for (const pair of pairs) {
      const [key, val] = pair.split("=");
      params[decodeURIComponent(key)] = val ? decodeURIComponent(val) : "";
    }
  }
  return params;
}

// Helper validation functions
function isEmail(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}
function isPhone(str: string): boolean {
  return /^(?:\+91|0)?[6-9]\d{9}$/.test(str.trim());
}
function isURL(str: string): boolean {
  if (!str) return true;
  try {
    new URL(str.startsWith("http") ? str : "http://" + str);
    return /\./.test(str) && !/\s/.test(str);
  } catch {
    return false;
  }
}
function isValidUploadedFile(val: any): boolean {
  return (
    val &&
    typeof val === "object" &&
    typeof val.name === "string" &&
    typeof val.size === "number" &&
    val.size > 0
  );
}

type DocumentsState = {
  aadhaarFront: File | null;
  aadhaarBack: File | null;
  photo: File | null;
  resume: File | null;
  certificate: File | null;
};

const initialDocs: DocumentsState = {
  aadhaarFront: null,
  aadhaarBack: null,
  photo: null,
  resume: null,
  certificate: null,
};
const FILE_FIELDS: (keyof DocumentsState)[] = [
  "aadhaarFront",
  "aadhaarBack",
  "photo",
  "resume",
  "certificate",
];

const formSchema = z.object({
  fullName: z.string().min(2, "Full Name is required"),
  email: z.string().min(1, "Email is required").refine(isEmail, "Invalid email address"),
  fathersName: z.string().min(1, "Father's Name is required"),
  mobile1: z.string().min(1, "Mobile Number 1 is required").refine(isPhone, "Invalid mobile number"),
  mobile2: z.string().optional().refine((v) => !v || isPhone(v), "Invalid mobile number"),
  address: z.string().min(5, "Address is required"),
  reference: z.string().min(1, "Reference is required"),
  specializations: z.string().min(2, "Specializations are required"),
  experienceYears: z
    .string()
    .min(1, "Experience is required")
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100,
      "Experience must be 0-100"
    ),
  accountHolder: z.string().min(1, "Account Holder is required"),
  bankName: z.string().min(1, "Bank Name is required"),
  ifsc: z.string().min(1, "IFSC is required").regex(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, "Invalid IFSC"),
  accountNumber: z.string().min(1, "Account Number is required"),
  upi: z.string().min(1, "UPI is required"),
  linkedin: z.string().optional().refine((v) => isURL(v || ""), "Invalid URL"),
  twitter: z.string().optional().refine((v) => isURL(v || ""), "Invalid URL"),
  facebook: z.string().optional().refine((v) => isURL(v || ""), "Invalid URL"),
  instagram: z.string().optional().refine((v) => isURL(v || ""), "Invalid URL"),
  youtube: z.string().optional().refine((v) => isURL(v || ""), "Invalid URL"),
  website: z.string().optional().refine((v) => isURL(v || ""), "Invalid URL"),
  portfolio: z.string().optional().refine((v) => isURL(v || ""), "Invalid URL"),
  blog: z.string().optional().refine((v) => isURL(v || ""), "Invalid URL"),
  // remarks removed
});

type FormFields = z.infer<typeof formSchema>;

const steps = ["Personal", "Documents", "Banking", "Review"] as const;
const API_BASE_URL = import.meta.env.VITE_API_URL;

const stepFields: Record<number, (keyof FormFields)[]> = {
  1: [
    "fullName",
    "email",
    "fathersName",
    "mobile1",
    "address",
    "reference",
    "specializations",
    "experienceYears",
  ],
  3: ["accountHolder", "bankName", "ifsc", "accountNumber", "upi"],
};

const CompleteProfilePage: React.FC = () => {
  const params = getQueryParams();
  const name = params.name || "";
  const emailParam = params.email || "";

  const [step, setStep] = useState<number>(1);
  const [docs, setDocs] = useState<DocumentsState>(initialDocs);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    getValues,
    trigger,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: name,
      email: emailParam,
      fathersName: "",
      mobile1: "",
      mobile2: "",
      address: "",
      reference: "",
      specializations: "",
      experienceYears: "",
      accountHolder: "",
      bankName: "",
      ifsc: "",
      accountNumber: "",
      upi: "",
      linkedin: "",
      twitter: "",
      facebook: "",
      instagram: "",
      youtube: "",
      website: "",
      portfolio: "",
      blog: "",
      // remarks removed
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    if (name) setValue("fullName", name);
    if (emailParam) setValue("email", emailParam);
    // eslint-disable-next-line
  }, [name, emailParam]);

  const docErrors = useMemo(() => {
    const errs: Partial<Record<keyof DocumentsState, string>> = {};
    FILE_FIELDS.forEach((f) => {
      if (!isValidUploadedFile(docs[f])) errs[f] = "Required";
    });
    return errs;
  }, [docs]);

  function updateDoc(key: keyof DocumentsState, file: File | null) {
    setDocs((prev) => ({ ...prev, [key]: file }));
  }
  async function next() {
    if (step === 1) {
      const ok = await trigger(stepFields[1]);
      if (!ok) {
        toast.error("Please fix the personal details errors.", { position: "top-center" });
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      const anyMissing = FILE_FIELDS.some((f) => !isValidUploadedFile(docs[f]));
      if (anyMissing) {
        toast.error("Please upload all required documents.", { position: "top-center" });
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      const ok = await trigger(stepFields[3]);
      if (!ok) {
        toast.error("Please fix the bank details errors.", { position: "top-center" });
        return;
      }
      setStep(4);
      return;
    }
  }
  function previous() {
    setStep((s) => Math.max(1, s - 1));
  }
  async function submit() {
    const ok = await trigger();
    if (!ok) {
      toast.error("Please correct the form errors before submitting.", { position: "top-center" });
      return;
    }
    const anyMissing = FILE_FIELDS.some((f) => !isValidUploadedFile(docs[f]));
    if (anyMissing) {
      toast.error("Please upload all required documents.", { position: "top-center" });
      return;
    }
    const values = getValues();
    const payload = new FormData();
    Object.entries(values).forEach(([k, v]) => payload.append(k, v ?? ""));
    FILE_FIELDS.forEach((k) => {
      const file = docs[k];
      if (file) payload.append(k, file);
    });
    const apiUrl =
      (API_BASE_URL ? API_BASE_URL.replace(/\/$/, "") : "") + "/api/therapist/complete-profile";
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("therapist-token");
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: token ? { Authorization: token } : undefined,
        body: payload,
      });
      if (res.status === 200 || res.status === 201) {
        toast.success("Profile completed successfully! Redirecting...", {
          position: "top-center",
          autoClose: 1500,
        });
        reset();
        setDocs(initialDocs);
        setStep(1);
        setTimeout(() => {
          window.location.href = "/therapist";
        }, 1600);
        return;
      }
      let data: any = {};
      try {
        data = await res.json();
      } catch {}
      toast.error(
        `Failed to complete profile.${data?.error ? ` Error: ${data.error}` : ""}`,
        { position: "top-center", autoClose: 4000 }
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Styling
  // background: Full screen, subtle gradient overlay, add curves and more vibrant accents
  // stepper: glassmorphism, colors updated, more modern
  // container: remove white background, use min-h-screen + p-4 always

  return (
    <div className="min-h-screen min-w-screen w-full h-full fixed top-0 left-0 flex flex-col justify-center items-center bg-gradient-to-tr from-violet-200 via-indigo-200 to-amber-100 overflow-auto">
      <ToastContainer />
      <div className="w-full max-w-5xl flex flex-col items-center justify-center py-12 px-3 sm:px-8" style={{minHeight: "90vh"}}>
        <h1 className="text-4xl font-extrabold leading-tight text-center mb-10 text-indigo-900 drop-shadow-md tracking-tight">
          Therapist Profile Completion
        </h1>
        {/* Stepper */}
        <div className="flex w-full max-w-3xl mx-auto items-center justify-between mb-10">
          {steps.map((label, i) => (
            <div key={label} className="flex-1 flex items-center">
              <div
                className={`h-12 w-12 shadow-lg bg-white/60 backdrop-blur border-2 transition flex items-center justify-center text-xl font-bold ${
                  step >= i + 1 ? "border-blue-600 text-blue-700 ring-2 ring-blue-400" : "border-slate-300 text-gray-300"
                } rounded-full`}
              >
                {i + 1}
              </div>
              <span
                className={`ml-4 text-base font-semibold ${
                  step >= i + 1 ? "text-indigo-900" : "text-gray-400"
                }`}
              >
                {label}
              </span>
              {i < steps.length - 1 && <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-200 to-indigo-300 mx-3 opacity-80" />}
            </div>
          ))}
        </div>

        <div className="w-full flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              {step === 1 && (
                <Section title="Personal Information">
                  <Input
                    label="Full Name *"
                    error={errors.fullName?.message}
                    {...register("fullName")}
                    disabled
                  />
                  <Input
                    label="Email *"
                    error={errors.email?.message}
                    {...register("email")}
                    disabled
                  />
                  <Input label="Father's Name *" error={errors.fathersName?.message} {...register("fathersName")} />
                  <Input label="Mobile Number 1 *" error={errors.mobile1?.message} {...register("mobile1")} />
                  <Input label="Mobile Number 2" error={errors.mobile2?.message} {...register("mobile2")} />
                  <Input label="Full Address *" error={errors.address?.message} {...register("address")} />
                  <Input label="Reference *" error={errors.reference?.message} {...register("reference")} />
                  <Input label="Specializations *" error={errors.specializations?.message} {...register("specializations")} />
                  <Input label="Years of Experience *" error={errors.experienceYears?.message} {...register("experienceYears")} />
                </Section>
              )}

              {step === 2 && (
                <Section title="Document Upload">
                  <FilePicker
                    label="Aadhaar Card (Front) *"
                    file={docs.aadhaarFront}
                    error={docErrors.aadhaarFront}
                    onChange={(f) => updateDoc("aadhaarFront", f)}
                  />
                  <FilePicker
                    label="Aadhaar Card (Back) *"
                    file={docs.aadhaarBack}
                    error={docErrors.aadhaarBack}
                    onChange={(f) => updateDoc("aadhaarBack", f)}
                  />
                  <FilePicker
                    label="Current Photo *"
                    file={docs.photo}
                    error={docErrors.photo}
                    onChange={(f) => updateDoc("photo", f)}
                  />
                  <FilePicker
                    label="Latest Resume *"
                    file={docs.resume}
                    error={docErrors.resume}
                    onChange={(f) => updateDoc("resume", f)}
                  />
                  <FilePicker
                    label="RCI / OT / PT Certificate *"
                    file={docs.certificate}
                    error={docErrors.certificate}
                    onChange={(f) => updateDoc("certificate", f)}
                  />
                </Section>
              )}

              {step === 3 && (
                <>
                  <Section title="Bank Details">
                    <Input label="Account Holder Name *" error={errors.accountHolder?.message} {...register("accountHolder")} />
                    <Input label="Bank Name *" error={errors.bankName?.message} {...register("bankName")} />
                    <Input label="IFSC Code *" error={errors.ifsc?.message} {...register("ifsc")} />
                    <Input label="Account Number *" error={errors.accountNumber?.message} {...register("accountNumber")} />
                    <Input label="UPI Address *" error={errors.upi?.message} {...register("upi")} />
                  </Section>
                  <div className="mt-10" />
                  <Section title="Web Links (Optional)">
                    <Input label="LinkedIn URL" error={errors.linkedin?.message} {...register("linkedin")} />
                    <Input label="Twitter URL" error={errors.twitter?.message} {...register("twitter")} />
                    <Input label="Facebook URL" error={errors.facebook?.message} {...register("facebook")} />
                    <Input label="Instagram URL" error={errors.instagram?.message} {...register("instagram")} />
                    <Input label="YouTube URL" error={errors.youtube?.message} {...register("youtube")} />
                    <Input label="Website URL" error={errors.website?.message} {...register("website")} />
                    <Input label="Portfolio URL" error={errors.portfolio?.message} {...register("portfolio")} />
                    <Input label="Blog URL" error={errors.blog?.message} {...register("blog")} />
                  </Section>
                </>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <Section2 title="Review & Submit">
                    <div className="bg-white/40 backdrop-blur-lg p-6 rounded-2xl border border-indigo-200 grid grid-cols-1 md:grid-cols-2 gap-6 text-base transition drop-shadow">
                      <div>
                        <h3 className="font-semibold text-indigo-900 mb-2 border-b border-indigo-200 pb-1">Personal</h3>
                        <Detail label="Full Name" value={getValues("fullName")} />
                        <Detail label="Email" value={getValues("email")} />
                        <Detail label="Father's Name" value={getValues("fathersName")} />
                        <Detail label="Mobile 1" value={getValues("mobile1")} />
                        <Detail label="Mobile 2" value={getValues("mobile2") || "-"} />
                        <Detail label="Address" value={getValues("address")} />
                        <Detail label="Reference" value={getValues("reference")} />
                        <Detail label="Specializations" value={getValues("specializations")} />
                        <Detail label="Experience" value={getValues("experienceYears")} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-indigo-900 mb-2 border-b border-indigo-200 pb-1">Bank</h3>
                        <Detail label="Account Holder" value={getValues("accountHolder")} />
                        <Detail label="Bank Name" value={getValues("bankName")} />
                        <Detail label="IFSC" value={getValues("ifsc")} />
                        <Detail label="Account No." value={getValues("accountNumber")} />
                        <Detail label="UPI" value={getValues("upi")} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-indigo-900 mb-2 border-b border-indigo-200 pb-1">Documents</h3>
                        <Detail label="Aadhaar Front" value={docs.aadhaarFront?.name || "Not uploaded"} />
                        <Detail label="Aadhaar Back" value={docs.aadhaarBack?.name || "Not uploaded"} />
                        <Detail label="Photo" value={docs.photo?.name || "Not uploaded"} />
                        <Detail label="Resume" value={docs.resume?.name || "Not uploaded"} />
                        <Detail label="Certificate" value={docs.certificate?.name || "Not uploaded"} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-indigo-900 mb-2 border-b border-indigo-200 pb-1">Links</h3>
                        <Detail label="LinkedIn" value={getValues("linkedin") || "-"} />
                        <Detail label="Twitter" value={getValues("twitter") || "-"} />
                        <Detail label="Facebook" value={getValues("facebook") || "-"} />
                        <Detail label="Instagram" value={getValues("instagram") || "-"} />
                        <Detail label="YouTube" value={getValues("youtube") || "-"} />
                        <Detail label="Website" value={getValues("website") || "-"} />
                        <Detail label="Portfolio" value={getValues("portfolio") || "-"} />
                        <Detail label="Blog" value={getValues("blog") || "-"} />
                      </div>
                    </div>
                    {/* Internal Remarks removed */}
                  </Section2>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Buttons */}
        <div className="flex flex-row justify-between items-center w-full max-w-xl mx-auto mt-12 gap-4">
          <button
            disabled={step === 1 || isSubmitting}
            onClick={previous}
            className={`px-6 py-2 rounded-lg bg-white/40 border border-indigo-300 shadow hover:bg-blue-100 transition font-semibold text-indigo-900 disabled:opacity-40`}
          >
            Previous
          </button>
          {step < 4 ? (
            <button
              onClick={next}
              disabled={isSubmitting}
              className="px-8 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg font-semibold hover:scale-105 transform transition disabled:opacity-40"
            >
              Next
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={isSubmitting}
              className="px-8 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg shadow-lg font-semibold hover:scale-105 transform transition disabled:opacity-40"
            >
              {isSubmitting ? "Submitting..." : "Submit Profile"}
            </button>
          )}
        </div>
        <div className="mt-10 flex justify-center w-full">
          <button
            className="px-6 py-2 rounded bg-indigo-700 text-white shadow-lg hover:bg-indigo-800 font-semibold transition"
            onClick={() => (window.location.href = "/signin")}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

/** -------------------------------------------
 * UI Components
 * ------------------------------------------*/
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10 w-full">
      <h2 className="text-2xl font-bold mb-6 text-indigo-800 tracking-tight">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/30 rounded-2xl p-6 shadow transition border border-indigo-100">
        {children}
      </div>
    </div>
  );
}
function Section2({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-indigo-800 tracking-tight">{title}</h2>
      <div className="grid grid-cols-1 gap-4">{children}</div>
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => (
    <div className="flex flex-col mb-1 relative">
      <label className="text-sm text-indigo-700 font-semibold mb-1">{label}</label>
      <input
        ref={ref}
        {...props}
        className={`p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none bg-white/70 font-medium placeholder-gray-400 ${
          error ? "border-red-500" : "border-indigo-200"
        } transition`}
      />
      {error && <span className="text-xs mt-1 text-red-600">{error}</span>}
    </div>
  )
);
Input.displayName = "Input";

function FilePicker({
  label,
  file,
  error,
  onChange,
}: {
  label: string;
  file: File | null;
  error?: string;
  onChange: (file: File | null) => void;
}) {
  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    onChange(f);
    e.currentTarget.value = "";
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-bold text-indigo-800">{label}</label>
      <div
        className={`border-2 border-dashed rounded-xl p-4 bg-white/40 shadow transition ${
          error ? "border-red-500 ring-2 ring-red-200" : "border-indigo-200 hover:border-blue-400"
        }`}
      >
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handle}
          className="text-sm bg-transparent"
          style={{ background: "transparent" }}
        />
        {file ? (
          <div className="mt-3 text-xs text-indigo-700 flex items-center justify-between bg-indigo-50/80 rounded-lg px-3 py-2">
            <span className="truncate max-w-[75%]">{file.name}</span>
            <button
              type="button"
              className="text-red-600 font-semibold hover:underline"
              onClick={() => onChange(null)}
            >
              Remove
            </button>
          </div>
        ) : (
          <p className="mt-2 text-xs text-indigo-500 italic">No file selected</p>
        )}
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center mb-2">
      <span className="font-medium text-indigo-900 w-40">{label}:</span>
      <span className="text-indigo-950">{value}</span>
    </div>
  );
}

export default CompleteProfilePage;