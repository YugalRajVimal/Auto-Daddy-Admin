import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

interface SectionData {
  heading?: string;
  desc?: string;
}
interface DashboardDataType {
  thoughtOfTheDay?: string;
  aboutUs?: SectionData;
  privacyPolicy?: SectionData;
  FAQs?: SectionData;
  documents?: SectionData;
  disclaimer?: SectionData;
}

// API Root
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/admin`
  : "/api/admin";

const SECTION_DEFS: {
  key: keyof DashboardDataType,
  label: string,
  fields?: { subkey: keyof SectionData, label: string, type?: "text"|"textarea" }[]
  type?: "text"|"textarea"
}[] = [
  { key: "thoughtOfTheDay", label: "Thought of the Day", type: "textarea" },
  { key: "aboutUs", label: "About Us", fields: [
    { subkey: "heading", label: "Heading" }, { subkey: "desc", label: "Description", type: "textarea" }
  ]},
  { key: "privacyPolicy", label: "Privacy Policy", fields: [
    { subkey: "heading", label: "Heading" }, { subkey: "desc", label: "Description", type: "textarea" }
  ]},
  { key: "FAQs", label: "FAQs", fields: [
    { subkey: "heading", label: "Heading" }, { subkey: "desc", label: "Description", type: "textarea" }
  ]},
  { key: "documents", label: "Documents", fields: [
    { subkey: "heading", label: "Heading" }, { subkey: "desc", label: "Description", type: "textarea" }
  ]},
  { key: "disclaimer", label: "Disclaimer", fields: [
    { subkey: "heading", label: "Heading" }, { subkey: "desc", label: "Description", type: "textarea" }
  ]},
];

const DashboardData: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardDataType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Modal and form state
  const [showModal, setShowModal] = useState(false);
  const [modalSection, setModalSection] = useState<keyof DashboardDataType | null>(null);
  const [editData, setEditData] = useState<DashboardDataType>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Backend lower/upper fix
  function apiToState(data: any): DashboardDataType {
    return {
      thoughtOfTheDay: data.thoughtOfTheDay ?? data.thoughtoftheday,
      aboutUs: data.aboutUs ?? data.aboutus,
      privacyPolicy: data.privacyPolicy ?? data.privacypolicy,
      FAQs: data.FAQs ?? data.faqs,
      documents: data.Documents ?? data.documents,
      disclaimer: data.Disclaimer ?? data.disclaimer,
    };
  }

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${API_BASE}/dashboard-data`);
      setDashboardData(apiToState(data.data));
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // For expansion modal reset focus
  useEffect(() => {
    if (showModal && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [showModal, modalSection]);

  const clearAlerts = () => {
    setError("");
    setSuccessMsg("");
  };

  // Modal open for edit
  const openModal = (section: keyof DashboardDataType | "all", existing?: DashboardDataType | null) => {
    if (section === "all") {
      setEditData(existing ? { ...(existing as DashboardDataType) } : {});
      setModalSection(null);
    } else {
      setEditData(existing
        ? { [section]: existing[section] ?? (section === "thoughtOfTheDay" ? "" : {}) }
        : { [section]: section === "thoughtOfTheDay" ? "" : {} }
      );
      setModalSection(section);
    }
    setShowModal(true);
    setTimeout(() => {
      if (firstInputRef.current) firstInputRef.current.focus();
    }, 50);
    clearAlerts();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditData({});
    setModalSection(null);
    clearAlerts();
  };

  // Save/Update dashboard data (PATCH or POST)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearAlerts();
    try {
      let body: any = {};
      if (modalSection === null) {
        // "all" mode: send all changes from editData
        if (typeof editData.thoughtOfTheDay !== "undefined") body.thoughtOfTheDay = editData.thoughtOfTheDay;
        if (typeof editData.aboutUs !== "undefined") body.aboutUs = editData.aboutUs;
        if (typeof editData.privacyPolicy !== "undefined") body.privacyPolicy = editData.privacyPolicy;
        if (typeof editData.FAQs !== "undefined") body.FAQs = editData.FAQs;
        if (typeof editData.documents !== "undefined") body.Documents = editData.documents;
        if (typeof editData.disclaimer !== "undefined") body.Disclaimer = editData.disclaimer;
      } else {
        // single section edit
        const sec = modalSection;
        if (sec === "thoughtOfTheDay") {
          body.thoughtOfTheDay = editData.thoughtOfTheDay;
        } else if (sec === "aboutUs") {
          body.aboutUs = editData.aboutUs;
        } else if (sec === "privacyPolicy") {
          body.privacyPolicy = editData.privacyPolicy;
        } else if (sec === "FAQs") {
          body.FAQs = editData.FAQs;
        } else if (sec === "documents") {
          body.Documents = editData.documents;
        } else if (sec === "disclaimer") {
          body.Disclaimer = editData.disclaimer;
        }
      }
      const method = dashboardData ? axios.patch : axios.post;
      const { data } = await method(`${API_BASE}/dashboard-data`, body);
      setDashboardData(apiToState(data.data));
      setSuccessMsg(dashboardData ? "Dashboard data updated." : "Dashboard data created.");
      setShowModal(false);
      setEditData({});
      setModalSection(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to save dashboard data");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete dashboard data
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete all dashboard data? This cannot be undone.")) return;
    setDeleting(true);
    clearAlerts();
    try {
      await axios.delete(`${API_BASE}/dashboard-data`);
      setDashboardData(null);
      setSuccessMsg("Dashboard data deleted.");
      setShowModal(false);
      setEditData({});
      setModalSection(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to delete dashboard data");
    } finally {
      setDeleting(false);
    }
  };

  // Form field change
  function updateEditField(
    section: keyof DashboardDataType, 
    field: keyof SectionData | undefined, 
    value: string
  ) {
    setEditData(prev => {
      if (section === "thoughtOfTheDay") return { ...prev, thoughtOfTheDay: value };
      if (
        section === "aboutUs" ||
        section === "privacyPolicy" ||
        section === "FAQs" ||
        section === "documents" ||
        section === "disclaimer"
      ) {
        const prior: SectionData = prev[section] ? { ...(prev[section] as SectionData) } : {};
        return {
          ...prev,
          [section]: {
            ...prior,
            [field!]: value,
          }
        };
      }
      return prev;
    });
  }

  // Render modal contents according to the section/all
  const renderModalFields = () => {
    if (modalSection) {
      // Single section edit
      const def = SECTION_DEFS.find(d => d.key === modalSection)!;
      return (
        <div>
          {def.type ? (
            <div>
              <label className="block font-medium mb-1">{def.label}</label>
              <textarea
                ref={
                  def.key === "thoughtOfTheDay"
                    ? (firstInputRef as unknown as React.RefObject<HTMLTextAreaElement>)
                    : undefined
                }
                value={editData[def.key] as string || ""}
                rows={2}
                onChange={e => updateEditField(def.key, undefined, e.target.value)}
                required={def.key === "thoughtOfTheDay"}
                className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                placeholder={`Enter ${def.label.toLowerCase()}`}
              />
        
            </div>
          ) : (
            <>
              <div className="font-semibold mb-1">{def.label}</div>
              {def.fields?.map(f => (
                <div key={f.subkey} className="mb-3">
                  <label className="block text-gray-600 font-medium mb-0.5">{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea
                      ref={
                        def.key === "aboutUs" && f.subkey === "heading"
                          ? (firstInputRef as unknown as React.RefObject<HTMLTextAreaElement>)
                          : undefined
                      }
                      value={(editData[def.key] as SectionData)?.[f.subkey] || ""}
                      rows={2}
                      onChange={e => updateEditField(def.key, f.subkey, e.target.value)}
                      className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                      placeholder={`Enter ${f.label.toLowerCase()}`}
                    />
              
                  ) : (
                    <input
                      ref={def.key === "aboutUs" && f.subkey === "heading" ? firstInputRef : undefined}
                      type="text"
                      value={(editData[def.key] as SectionData)?.[f.subkey] || ""}
                      onChange={e => updateEditField(def.key, f.subkey, e.target.value)}
                      className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                      placeholder={`Enter ${f.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      );
    } else {
      // Edit all sections
      return SECTION_DEFS.map((def) => (
        <div key={def.key as string} className="mb-7">
          {def.type ? (
            <div>
              <label className="block font-medium mb-1">{def.label}</label>
              <textarea
                ref={def.key === "thoughtOfTheDay" ? (firstInputRef as unknown as React.RefObject<HTMLTextAreaElement>) : undefined}
                value={editData[def.key] as string || ""}
                rows={2}
                onChange={e => updateEditField(def.key, undefined, e.target.value)}
                required={def.key === "thoughtOfTheDay"}
                className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                placeholder={`Enter ${def.label.toLowerCase()}`}
              />
        
        
            </div>
          ) : (
            <>
              <div className="font-semibold mb-1">{def.label}</div>
              {def.fields?.map(f => (
                <div key={f.subkey} className="mb-3">
                  <label className="block text-gray-600 font-medium mb-0.5">{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea
                      ref={
                        def.key === "aboutUs" && f.subkey === "heading"
                          ? (firstInputRef as unknown as React.RefObject<HTMLTextAreaElement>)
                          : undefined
                      }
                      value={(editData[def.key] as SectionData)?.[f.subkey] || ""}
                      rows={2}
                      onChange={e => updateEditField(def.key, f.subkey, e.target.value)}
                      className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                      placeholder={`Enter ${f.label.toLowerCase()}`}
                    />
              
              
                  ) : (
                    <input
                      ref={def.key === "aboutUs" && f.subkey === "heading" ? firstInputRef : undefined}
                      type="text"
                      value={(editData[def.key] as SectionData)?.[f.subkey] || ""}
                      onChange={e => updateEditField(def.key, f.subkey, e.target.value)}
                      className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                      placeholder={`Enter ${f.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      ));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-5 py-8 h-[85vh] overflow-y-auto bg-gray-50 px-2 py-6 sm:px-8">
      <div className="mb-7 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard Data</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded shadow font-semibold text-sm transition"
          onClick={() => openModal("all", dashboardData)}
        >
          {dashboardData ? "Edit All" : "Create"}
        </button>
      </div>
      {loading && (
        <div className="text-gray-500 mb-4">Loading dashboard data...</div>
      )}
      {error && (
        <div className="mb-4 text-red-600 bg-red-50 rounded px-3 py-2">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 text-green-700 bg-green-50 rounded px-3 py-2">{successMsg}</div>
      )}

      {!loading && !dashboardData && (
        <div className="p-5 rounded bg-gray-50 text-gray-500 shadow mb-10">
          No dashboard data configured in backend.
        </div>
      )}

      {dashboardData && (
        <div className="bg-white rounded shadow px-5 py-6">
          {SECTION_DEFS.map(def => (
            <div key={def.key as string} className="mb-6 border-b border-gray-100 pb-6">
              {def.key === "thoughtOfTheDay" ? (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium text-gray-700">{def.label}</div>
                    <button
                      className="bg-blue-200 hover:bg-blue-300 text-blue-900 px-3 py-1 rounded text-xs font-semibold"
                      onClick={() => openModal(def.key, dashboardData)}
                    >
                      Edit
                    </button>
                  </div>
                  <blockquote className="italic text-gray-900 min-h-[1.7em] mt-1">
                    {dashboardData.thoughtOfTheDay || (
                      <span className="text-gray-400">Not set</span>
                    )}
                  </blockquote>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold">{def.label}</div>
                    <button
                      className="bg-blue-200 hover:bg-blue-300 text-blue-900 px-3 py-1 rounded text-xs font-semibold"
                      onClick={() => openModal(def.key, dashboardData)}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="mt-1 ml-2">
                    <div className="text-gray-900 font-medium">
                      {dashboardData[def.key]?.heading || (
                        <span className="text-gray-400">No heading</span>
                      )}
                    </div>
                    <div className="text-gray-700 whitespace-pre-line min-h-[1.7em] mt-0.5">
                      {dashboardData[def.key]?.desc || (
                        <span className="text-gray-400">No description set.</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => openModal("all", dashboardData)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition"
            >
              Edit All
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-100 text-red-700 font-medium px-5 py-2 rounded hover:bg-red-200 transition"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm transition">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full px-8 py-8 animate-fadein relative">
            <div className="mb-7 flex items-center justify-between">
              <div className="text-xl font-bold">
                {(modalSection
                  ? `Edit ${SECTION_DEFS.find(d => d.key === modalSection)!.label}`
                  : dashboardData ? "Edit All Dashboard Data" : "Create Dashboard Data"
                )}
              </div>
            </div>
            {error && (
              <div className="mb-4 text-red-600 bg-red-50 rounded px-3 py-2">{error}</div>
            )}
            <form onSubmit={handleSubmit} autoComplete="off">
              {/* Fields */}
              {renderModalFields()}
              <div className="mt-7 flex gap-4 items-center justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition disabled:opacity-70"
                  disabled={submitting}
                >
                  {submitting
                    ? dashboardData
                      ? (modalSection ? "Saving..." : "Saving All...")
                      : (modalSection ? "Creating..." : "Creating All...")
                    : dashboardData
                      ? (modalSection ? "Save" : "Save All")
                      : (modalSection ? "Create" : "Create All")}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-200 text-gray-700 font-medium px-5 py-2 rounded hover:bg-gray-300 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
          <style>
            {`
              @keyframes fadein {
                from { opacity: 0; transform: translateY(30px) scale(0.97); }
                to   { opacity: 1; transform: none; }
              }
              .animate-fadein { animation: fadein .24s cubic-bezier(.4,1,.6,1) both; }
            `}
          </style>
        </div>
      )}
    </div>
  );
};

export default DashboardData;