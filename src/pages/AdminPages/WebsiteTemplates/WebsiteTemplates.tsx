import React, { useEffect, useState, useRef } from "react";

// Website Template schema
interface WebsiteTemplate {
  _id: string;
  name: string;
  desc?: string;
  templateLink: string;
  createdAt?: string;
}

const API_URL = `${import.meta.env.VITE_API_URL}/api/admin/website-templates`;

const WebsiteTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<WebsiteTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WebsiteTemplate | null>(null);
  const [formValues, setFormValues] = useState<Omit<WebsiteTemplate, "_id" | "createdAt">>({
    name: "",
    desc: "",
    templateLink: ""
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New: for preview popup
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<WebsiteTemplate | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Helper: get JWT from localStorage
  const getToken = (): string | null => localStorage.getItem("admin-token");

  // Clear error & success messages
  const clearAlerts = () => {
    setError("");
    setSuccessMsg("");
  };

  // Fetch templates
  const fetchTemplates = async () => {
    setLoading(true);
    clearAlerts();
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `${getToken()}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed fetching templates.");
      setTemplates(data.data);
    } catch (err: any) {
      setError(err?.message || "Error fetching templates.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line
  }, []);

  // Add New
  const openAddModal = () => {
    clearAlerts();
    setEditingTemplate(null);
    setFormValues({ name: "", desc: "", templateLink: "" });
    setShowModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 150);
  };

  // Edit Exist
  const openEditModal = (template: WebsiteTemplate) => {
    clearAlerts();
    setEditingTemplate(template);
    setFormValues({
      name: template.name,
      desc: template.desc ?? "",
      templateLink: template.templateLink
    });
    setShowModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 150);
  };

  // Handle input change
  const updateFormField = (
    field: keyof Omit<WebsiteTemplate, "_id" | "createdAt">,
    value: string
  ) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Create & Update handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    try {
      const isEdit = Boolean(editingTemplate);
      const url = isEdit ? `${API_URL}/${editingTemplate?._id}` : API_URL;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `${getToken()}`,
        },
        body: JSON.stringify(formValues),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || (isEdit ? "Update failed" : "Create failed"));
      setSuccessMsg(isEdit ? "Template updated successfully." : "Template added successfully.");
      setShowModal(false);
      fetchTemplates();
    } catch (err: any) {
      setError(
        err?.message ||
        "Something went wrong."
      );
    }
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    setDeletingId(id);
    clearAlerts();
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `${getToken()}`,
        },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Delete failed");
      setSuccessMsg("Template deleted.");
      fetchTemplates();
    } catch (err: any) {
      setError(
        err?.message ||
        "Error deleting template"
      );
    }
    setDeletingId(null);
  };

  // Modal for preview
  const handleOpenPreview = (template: WebsiteTemplate) => {
    setPreviewUrl(template.templateLink);
    setPreviewTemplate(template);
  };
  const handleClosePreview = () => {
    setPreviewUrl(null);
    setPreviewTemplate(null);
  };

  // Component
  return (
    <div className="h-[85vh] overflow-y-auto bg-gray-50 px-2 py-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
        <h2 className="text-2xl font-bold text-gray-700">Website Templates</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md shadow transition-colors duration-150"
          onClick={openAddModal}
        >
          + Add New Template
        </button>
      </div>
      {error && (
        <div className="mb-4 text-sm rounded bg-red-100 text-red-800 px-3 py-2 border border-red-200 shadow">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 text-sm rounded bg-green-100 text-green-800 px-3 py-2 border border-green-200 shadow">{successMsg}</div>
      )}
      {loading ? (
        <div className="mt-12 flex justify-center">
          <svg className="animate-spin h-7 w-7 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="ml-3 text-blue-600 font-medium">Loading templates...</span>
        </div>
      ) : (
        <div className="overflow-x-auto mt-2">
          {templates.length === 0 ? (
            <div className="text-center text-gray-500 text-lg py-8">No templates found.</div>
          ) : (
            <table className="w-full border rounded overflow-hidden bg-white shadow-sm">
              <thead className="bg-gradient-to-br from-gray-100 to-gray-50">
                <tr>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Template Name</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Description</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Link</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Created At</th>
                  <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map(template => (
                  <tr key={template._id} className="transition hover:bg-blue-50 group border-b last:border-b-0">
                    <td className="px-3 py-3 whitespace-nowrap font-medium text-gray-900">
                      {template.name}
                    </td>
                    <td className="px-3 py-3 max-w-[240px] text-gray-700">
                      {template.desc || <span className="italic text-gray-400">No description</span>}
                    </td>
                    <td className="px-3 py-3 break-all">
                      <div className="flex flex-col items-start gap-1">
                        <a
                          href={template.templateLink}
                          className="text-blue-600 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                          tabIndex={0}
                          style={{ wordBreak: "break-all" }}
                        >
                          {template.templateLink}
                        </a>
                        <button
                          type="button"
                          className="mt-1 inline-flex items-center text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                          onClick={() => handleOpenPreview(template)}
                          aria-label={`Preview ${template.name}`}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-8 0c0-3.313 3.134-6 7-6s7 2.687 7 6-3.134 6-7 6-7-2.687-7-6z" />
                          </svg>
                          Preview
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                      {template.createdAt ? new Date(template.createdAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap flex gap-2 items-center">
                      <button
                        onClick={() => openEditModal(template)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3 py-1 rounded transition group-hover:scale-105 shadow-sm"
                        aria-label={`Edit ${template.name}`}
                      >
                        <svg viewBox="0 0 20 20" className="w-4 h-4 mr-1 inline-block" fill="none"><path d="M15.232 5.232l-.464-.464a2 2 0 0 0-2.828 0l-6.036 6.036a1 1 0 0 0-.263.493l-.732 2.928a.5.5 0 0 0 .605.605l2.929-.732a1 1 0 0 0 .492-.263l6.036-6.036a2 2 0 0 0 0-2.828zM17.414 2.586a4 4 0 0 0-5.656 0l-6.036 6.036a3 3 0 0 0-.79 1.477l-.732 2.929a2 2 0 0 0 2.41 2.41l2.928-.732a3 3 0 0 0 1.477-.79l6.036-6.036a4 4 0 0 0 0-5.656z" fill="currentColor"/></svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(template._id)}
                        className={`bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition group-hover:scale-105 shadow-sm disabled:opacity-60`}
                        disabled={!!deletingId}
                        aria-label={`Delete ${template.name}`}
                      >
                        <svg viewBox="0 0 20 20" className="w-4 h-4 mr-1 inline-block" fill="none"><path d="M6.5 4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7H3a1 1 0 1 1 0-2h4V4zm2 0v1h3V4h-3zm-3 3h9v10H5V7zm3 2a1 1 0 0 1 2 0v5a1 1 0 1 1-2 0V9z" fill="currentColor"/></svg>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="fixed left-0 top-0 z-50 w-screen h-screen bg-black/50 flex items-center justify-center backdrop-blur-sm"
          onClick={handleClosePreview}
        >
          <div
            className="rounded-lg shadow-2xl bg-white p-2 sm:p-4 max-w-2xl w-[92vw] max-h-[85vh] flex flex-col animate-fadein"
            onClick={e => e.stopPropagation()}
            style={{ minWidth: 320 }}
          >
            <div className="flex items-center justify-between px-2 pb-2 pt-1">
              <div>
                <span className="font-semibold text-gray-800 text-base sm:text-lg">
                  {previewTemplate?.name || "Preview"}
                </span>
                <span className="ml-2 text-xs text-gray-500 font-mono">{previewUrl}</span>
              </div>
              <button
                type="button"
                aria-label="Close preview"
                onClick={handleClosePreview}
                className="text-gray-400 hover:text-gray-700 transition p-1 rounded"
                tabIndex={0}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 flex overflow-hidden border rounded">
              <iframe
                title={`Preview for ${previewTemplate?.name || "template"}`}
                src={previewUrl}
                className="w-full h-[65vh] min-h-[350px]"
                style={{ border: 0 }}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              ></iframe>
            </div>
            <div className="pt-2 flex gap-4 justify-between items-center px-2">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline text-sm font-medium"
              >
                Open in new tab
              </a>
              <button
                className="bg-gray-200 text-gray-700 px-4 py-1 rounded text-sm hover:bg-gray-300"
                onClick={handleClosePreview}
              >
                Close Preview
              </button>
            </div>
            <div className="text-xs pt-1 text-gray-400 px-2">
              (Some sites may block preview in iframe for security reasons)
            </div>
          </div>
        </div>
      )}

      {/* Animated Modal */}
      {showModal && (
        <div
          className="fixed left-0 top-0 z-50 w-screen h-screen bg-black/35 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="rounded-lg shadow-2xl bg-white p-6 sm:p-9 max-w-lg w-[94vw] animate-fadein"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg sm:text-2xl text-gray-800">
                {editingTemplate ? "Edit Template" : "Add New Template"}
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700 transition p-1 rounded"
                tabIndex={0}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            {error && <div className="mb-2 rounded bg-red-100 text-red-700 px-3 py-2 border border-red-200 shadow text-sm">{error}</div>}
            <form onSubmit={handleFormSubmit} autoComplete="off">
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Template Name</label>
                <input
                  type="text"
                  value={formValues.name}
                  ref={nameInputRef}
                  required
                  autoFocus
                  onChange={e => updateFormField("name", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="Enter template name"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-semibold text-gray-700">Description</label>
                <textarea
                  value={formValues.desc || ""}
                  rows={2}
                  onChange={e => updateFormField("desc", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="Enter template description"
                />
              </div>
              <div className="mb-6">
                <label className="block mb-1 font-semibold text-gray-700">Template Link</label>
                <input
                  type="url"
                  value={formValues.templateLink}
                  required
                  onChange={e => updateFormField("templateLink", e.target.value)}
                  className="w-full px-3 py-2 border rounded shadow-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition placeholder:text-gray-400"
                  placeholder="https://..."
                />
              </div>
              <div className="mt-7 flex gap-4 items-center justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow transition disabled:opacity-70"
                  disabled={loading}
                >
                  {editingTemplate ? "Update" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-200 text-gray-700 font-medium px-5 py-2 rounded hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tailwind Animations */}
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
  );
};

export default WebsiteTemplates;