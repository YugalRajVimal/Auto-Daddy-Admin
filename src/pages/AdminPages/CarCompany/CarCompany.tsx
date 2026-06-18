

import React, { useState, useEffect, useRef, ChangeEvent, useMemo } from "react";
import axios from "axios";
import { AdminDataTable, tableCell } from "../../../components/admin/AdminDataTable";

// --- Types ---
interface CarModel { modelName: string; } // years REMOVED
interface CarCompanyType { _id: string; companyName: string; models: CarModel[]; brandLogo?: string | null }
type CarCompanyFormState = {
  companyName: string;
  models: { modelName: string }[]; // years REMOVED
  brandLogoFile: File | null;
  brandLogoPreviewUrl: string | null;
};
const EMPTY_FORM: CarCompanyFormState = { companyName: "", models: [{ modelName: "" }], brandLogoFile: null, brandLogoPreviewUrl: null };

// ─── STYLE HELPERS ─────────────────────────────────────────────────────────────
const CarCompany: React.FC = () => {
  const [companies, setCompanies] = useState<CarCompanyType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CarCompanyType | null>(null);
  const [form, setForm] = useState<CarCompanyFormState>(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCols, setVisibleCols] = useState(["companyName", "models", "brandLogo"]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const nameInputRef = useRef<HTMLInputElement>(null);

  const clearAlerts = () => { setError(""); setSuccessMsg(""); };

  const fetchCompanies = async (q: string = "") => {
    setLoading(true); clearAlerts();
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/admin/car-company`;
      if (q) url += `?companyName=${encodeURIComponent(q)}`;
      const res = await axios.get(url);
      setCompanies(res.data?.data ?? []);
    } catch (err: any) { setError(err?.response?.data?.message || "Error fetching companies"); }
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, []);

  function getBackendImageUrl(path: string) {
    if (/^https?:\/\//.test(path)) return path;
    const base = import.meta.env.VITE_API_URL || "";
    return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  }

  const openAddModal = () => {
    clearAlerts();
    setEditingCompany(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 150);
  };

  const openEditModal = (company: CarCompanyType) => {
    clearAlerts();
    setEditingCompany(company);
    setForm({
      companyName: company.companyName,
      models: company.models.map((m) => ({
        modelName: m.modelName
      })),
      brandLogoFile: null,
      brandLogoPreviewUrl: company.brandLogo ? getBackendImageUrl(company.brandLogo) : null
    });
    setShowModal(true);
    setTimeout(() => nameInputRef.current?.focus(), 150);
  };

  const updateFormField = (field: keyof CarCompanyFormState, value: any) =>
    setForm((curr) => ({ ...curr, [field]: value }));
  const updateModelName = (idx: number, value: string) =>
    setForm((curr) => {
      const models = [...curr.models];
      models[idx].modelName = value;
      return { ...curr, models };
    });
  const addModel = () =>
    setForm((curr) => ({
      ...curr,
      models: [...curr.models, { modelName: "" }]
    }));
  const removeModel = (idx: number) =>
    setForm((curr) => {
      const m = [...curr.models];
      m.splice(idx, 1);
      return { ...curr, models: m.length ? m : [{ modelName: "" }] };
    });

  const handleBrandLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    const file = e.target.files[0];
    setForm((curr) => {
      if (curr.brandLogoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(curr.brandLogoPreviewUrl);
      return { ...curr, brandLogoFile: file, brandLogoPreviewUrl: URL.createObjectURL(file) };
    });
  };
  const handleRemoveBrandLogo = () =>
    setForm((curr) => {
      if (curr.brandLogoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(curr.brandLogoPreviewUrl);
      return { ...curr, brandLogoFile: null, brandLogoPreviewUrl: null };
    });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    if (!form.companyName.trim() || !form.models.length || form.models.some((m) => !m.modelName.trim())) {
      setError("Company name and model names are required.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("companyName", form.companyName.trim());
      formData.append(
        "models",
        JSON.stringify(form.models.map((m) => ({
          modelName: m.modelName.trim()
        })))
      );
      if (form.brandLogoFile) formData.append("brandLogo", form.brandLogoFile);
      if (editingCompany) {
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/api/admin/car-company/${editingCompany._id}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setSuccessMsg("Car company updated successfully.");
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/admin/car-company`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setSuccessMsg("Car company added successfully.");
      }
      setShowModal(false);
      setForm({ ...EMPTY_FORM });
      setEditingCompany(null);
      fetchCompanies();
    } catch (err: any) {
      setError(err?.response?.data?.message || (editingCompany ? "Failed to update" : "Failed to add") + " car company");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this car company?")) return;
    setDeletingId(id);
    setError("");
    setSuccessMsg("");
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/car-company/${id}`);
      setSuccessMsg("Car company deleted.");
      fetchCompanies();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete car company");
    }
    setDeletingId(null);
  };

  useEffect(() => {
    return () => {
      if (form.brandLogoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(form.brandLogoPreviewUrl);
    };
  }, [showModal]);

  const filtered = companies.filter((c) =>
    c.companyName.toLowerCase().includes(query.toLowerCase()) ||
    c.models.some((m) => m.modelName.toLowerCase().includes(query.toLowerCase()))
  );

  const tableColumns = useMemo(
    () => [
      {
        key: "companyName",
        label: "Company Name",
        render: (company: CarCompanyType) =>
          tableCell(<span style={{ fontWeight: 600 }}>{company.companyName}</span>),
        exportValue: (company: CarCompanyType) => company.companyName,
      },
      {
        key: "models",
        label: "Models",
        render: (company: CarCompanyType) =>
          tableCell(
            <>
              {company.models.map((m, idx) => (
                <div key={idx} style={{ lineHeight: 1.7 }}>
                  <span style={{ fontWeight: 700 }}>{m.modelName}</span>
                </div>
              ))}
            </>
          ),
        exportValue: (company: CarCompanyType) => company.models.map((m) => m.modelName).join("; "),
      },
      {
        key: "brandLogo",
        label: "Brand Logo",
        render: (company: CarCompanyType) =>
          tableCell(
            company.brandLogo ? (
              <img
                src={getBackendImageUrl(company.brandLogo)}
                alt="Brand Logo"
                style={{ height: 56, maxWidth: 94, objectFit: "contain", border: "1px solid #d2d6de", borderRadius: 3, background: "#fafafa" }}
                loading="lazy"
              />
            ) : (
              <span style={{ color: "#aaa", fontStyle: "italic" }}>No logo</span>
            )
          ),
        exportValue: (company: CarCompanyType) => (company.brandLogo ? "Yes" : "No logo"),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companies]
  );

  return (
    <>
      {/* ── Add/Edit Modal ────────────────────────────────────────────────── */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 4, width: "min(560px, 96vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 5px 15px rgba(0,0,0,.5)" }}
          >
            {/* Modal Header */}
            <div style={{ background: "#9b308d", color: "#fff", padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "4px 4px 0 0", flexShrink: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 22 }}>{editingCompany ? "Edit Car Company" : "Add New Car Company"}</span>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 28, lineHeight: 1, cursor: "pointer" }} type="button">×</button>
            </div>
            {/* Modal Body */}
            <div style={{ padding: "28px 34px", overflowY: "auto", flex: 1 }}>
              {error && <div style={{ marginBottom: 18, padding: "12px 16px", background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, color: "#c0392b", fontSize: 18 }}>{error}</div>}
              <form onSubmit={handleFormSubmit} autoComplete="off" encType="multipart/form-data">

                {/* Company Name */}
                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 18, marginBottom: 7 }}>Company Name <span style={{ color: "#e73d3d" }}>*</span></label>
                  <input ref={nameInputRef} type="text" value={form.companyName} required autoFocus
                    onChange={(e) => updateFormField("companyName", e.target.value)}
                    style={{ width: "100%", border: "1px solid #d2d6de", borderRadius: 3, padding: "12px 13px", fontSize: 19, outline: "none", boxSizing: "border-box" }}
                    placeholder="Enter company name" />
                </div>

                {/* Brand Logo */}
                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 17, marginBottom: 7 }}>Brand Logo <span style={{ color: "#888", fontWeight: 400 }}>(optional)</span></label>
                  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    {form.brandLogoPreviewUrl ? (
                      <div style={{ position: "relative", width: 84, height: 64 }}>
                        <img src={form.brandLogoPreviewUrl} alt="Logo Preview" style={{ width: 84, height: 64, objectFit: "contain", border: "1px solid #d2d6de", borderRadius: 3, background: "#fafafa" }} />
                        <button type="button" onClick={handleRemoveBrandLogo}
                          style={{ position: "absolute", top: -9, right: -9, width: 24, height: 24, borderRadius: "50%", background: "#555", color: "#fff", border: "none", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 15, color: "#aaa", fontStyle: "italic" }}>No logo selected</span>
                    )}
                    <label style={{ padding: "7px 16px", border: "1px solid #0073b7", borderRadius: 3, color: "#0073b7", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleBrandLogoChange} />
                      {form.brandLogoPreviewUrl ? "Change" : "Upload"}
                    </label>
                  </div>
                </div>

                {/* Models */}
                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 18, marginBottom: 12 }}>Car Models <span style={{ color: "#e73d3d" }}>*</span></label>
                  {form.models.map((model, modelIdx) => (
                    <div key={modelIdx} style={{ border: "1px solid #d2d6de", borderRadius: 3, padding: "14px 19px", marginBottom: 14, background: "#f9fafc" }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 0 }}>
                        <input type="text" value={model.modelName} placeholder="Model Name" required
                          onChange={(e) => updateModelName(modelIdx, e.target.value)}
                          style={{ flex: 1, border: "1px solid #d2d6de", borderRadius: 3, padding: "9px 13px", fontSize: 17, outline: "none" }} />
                        <button type="button" onClick={() => removeModel(modelIdx)} disabled={form.models.length === 1}
                          style={{ padding: "8px 15px", border: "1px solid #d2d6de", borderRadius: 3, background: form.models.length === 1 ? "#f4f4f4" : "#f2dede", color: form.models.length === 1 ? "#aaa" : "#a94442", fontSize: 15, cursor: form.models.length === 1 ? "not-allowed" : "pointer" }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addModel}
                    style={{ padding: "8px 18px", border: "1px solid #0073b7", borderRadius: 3, color: "#0073b7", fontSize: 16, fontWeight: 600, cursor: "pointer", background: "#fff" }}>Add Model</button>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 14 }}>
                  <button type="button" onClick={() => setShowModal(false)}
                    style={{ padding: "10px 26px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#444", fontSize: 16, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" disabled={loading}
                    style={{ padding: "10px 28px", borderRadius: 3, border: "none", background: loading ? "#aaa" : "#0073b7", color: "#fff", fontSize: 18, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                    {editingCompany ? "Update" : "Add Company"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Page ──────────────────────────────────────────────────────────── */}
      <div
        // You may use Tailwind class if setup, or fallback to CSS below.
        className="min-h-0 flex-1 overflow-y-auto bg-ad-app-bg py-4 md:py-5 font-sans"
      >

        {/* Heading */}
        <h1 style={{ fontSize: 46, fontWeight: 300, color: "#333", marginBottom: 28, marginTop: 0 }}>Car Companies</h1>

        {/* Card */}
        <div className="mb-10" style={{ background: "#fff", border: "1px solid #d2d6de", borderRadius: 3, boxShadow: "0 1px 1px rgba(0,0,0,.1)" }}>

          {/* Card Header */}
          <div style={{ padding: "14px 22px", borderBottom: "1px solid #f4f4f4", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: 23, fontWeight: 400, color: "#444" }}>Company List</h3>
            <button type="button" onClick={openAddModal}
              style={{ padding: "8px 20px", borderRadius: 3, border: "none", background: "#0073b7", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              Add New
            </button>
          </div>

          {/* Alerts */}
          <div style={{ padding: "0 30px", paddingTop: 30 }}>
            {error && <div style={{ marginBottom: 18, padding: "12px 18px", background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, color: "#c0392b", fontSize: 18 }}>{error}</div>}
            {successMsg && <div style={{ marginBottom: 18, padding: "12px 18px", background: "#f0fff4", border: "1px solid #c3e6cb", borderRadius: 3, color: "#27ae60", fontSize: 18 }}>{successMsg}</div>}
          </div>

          <div style={{ padding: "0 30px 30px" }}>
            <AdminDataTable
              items={filtered}
              columns={tableColumns}
              getRowId={(c) => c._id}
              loading={loading}
              emptyMessage="No car companies found."
              search={query}
              onSearchChange={setQuery}
              searchPlaceholder="Search by company or model…"
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              currentPage={currentPage}
              onCurrentPageChange={setCurrentPage}
              visibleColumnKeys={visibleCols}
              onVisibleColumnKeysChange={setVisibleCols}
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
              exportFilename="car-companies"
              totalBeforeFilter={companies.length}
              extraToolbarActions={[
                {
                  label: "✏️ Update",
                  color: "#0073b7",
                  minSelected: 1,
                  maxSelected: 1,
                  onClick: (ids) => {
                    const company = companies.find((c) => c._id === ids[0]);
                    if (company) openEditModal(company);
                  },
                },
              ]}
              renderActions={(company) => (
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" onClick={() => openEditModal(company)}
                    style={{ padding: "7px 19px", borderRadius: 3, border: "1px solid #0073b7", background: "#fff", color: "#0073b7", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                    Edit
                  </button>
                  <button type="button" disabled={deletingId === company._id} onClick={() => handleDelete(company._id)}
                    style={{ padding: "7px 19px", borderRadius: 3, border: "1px solid #d2d6de", background: deletingId === company._id ? "#f4f4f4" : "#f2dede", color: deletingId === company._id ? "#aaa" : "#a94442", fontSize: 16, fontWeight: 700, cursor: deletingId === company._id ? "not-allowed" : "pointer" }}>
                    {deletingId === company._id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default CarCompany;