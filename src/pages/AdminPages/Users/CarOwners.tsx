
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
import ClipImageHover from "../../../components/admin/ClipImageHover";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";
import { authHeaders } from "../../../api/client";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import AdminSearchCard, {
  emptyAdminSearchValues,
  searchEquals,
  searchIncludes,
  type AdminSearchField,
} from "../../../components/admin/AdminSearchCard";
import {
  CompactAutoGrowTextarea,
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import { getPostLoginRedirect, useAuth } from "../../../auth";

// ─── Types ───────────────────────────────────────────────────────────────────
type BusinessProfileType = {
  _id: string; businessName: string; businessAddress?: string; pincode?: string;
  businessPhone?: string; businessEmail?: string; openHours?: string; openDays?: string[];
  businessLogo?: string; myServices?: any[]; city?: string; businessWebsite?: string;
  directionsUrl?: string; rating?: number; reviewCount?: number; isFav?: boolean;
  businessMapLocation?: { lat: number; lng: number; _id: string };
  createdAt?: string; updatedAt?: string;
};
type VehicleType = {
  _id: string; make?: { name?: string; model?: string }; year?: number; vinNo?: string;
  licensePlateNo?: string; odometerReading?: number; dueOdometerReading?: number; carImages?: string[];
  licensePlateFrontImagePath?: string; licensePlateBackImagePath?: string;
  createdAt?: string; updatedAt?: string; status?: string;[key: string]: any;
};
type JobCardType = {
  _id: string; business: BusinessProfileType; jobNo?: string | number;
  paymentStatus?: string; totalPayableAmount?: number; services?: any[];
  vehicleId?: { licensePlateNo?: string }; customerId?: any;
  vehiclePhotos?: string[]; createdAt?: string; updatedAt?: string;[key: string]: any;
};
type OwnerDocumentItem = { label: string; url: string };

type CarOwnerType = {
  _id: string; name: string; email?: string; phone?: string;
  address?: string; pincode?: string; city?: string; status?: string;
  isProfileComplete?: boolean; isDisabled?: boolean; myVehicles?: VehicleType[];
  onboardedBy?: { _id: string; name?: string; email?: string } | null;
  favoriteAutoShops?: BusinessProfileType[];
  autoshopsReceivedServiceFrom?: BusinessProfileType[];
  jobCards?: JobCardType[]; profilePhoto?: string; profileImage?: string;
  documents?: unknown;
  thoughtOfTheDayLiked?: boolean;
  thoughtOfTheDayLikes?: number;
  createdAt?: string;
};

// ─── Column Config ───────────────────────────────────────────────────────────
const ALL_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "city", label: "City" },
  { key: "address", label: "Address" },
  { key: "date", label: "Date" },
  { key: "profilePhoto", label: "Profile Image" },
  { key: "documents", label: "Documents" },
  { key: "vin", label: "VIN" },
  { key: "vehicle", label: "Vehicle" },
  { key: "autoShops", label: "Auto Shops" },
  { key: "jobCard", label: "Job Card" },
  { key: "invoice", label: "Invoice" },
  { key: "likes", label: "Likes" },
  { key: "status", label: "Status" },
];
const DEFAULT_VISIBLE = ["name", "phone", "email", "city", "address", "date", "profilePhoto", "documents", "vehicle", "autoShops", "jobCard", "likes", "status"];

const CAR_OWNER_SEARCH_FIELDS: AdminSearchField[] = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "city", label: "City" },
  { key: "address", label: "Address" },
  { key: "date", label: "Date", type: "date" },
  { key: "vin", label: "VIN" },
  { key: "likes", label: "Likes" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" },
      { value: "Deleted", label: "Deleted" },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const API = () => import.meta.env.VITE_API_URL || "";
const UPLOADS = () => import.meta.env.VITE_UPLOADS_URL || "";
function mediaUrl(path?: string): string {
  if (!path || !String(path).trim()) return "";
  const p = String(path).trim();
  if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("blob:") || p.startsWith("data:")) {
    return p;
  }
  const base = (UPLOADS() || API()).replace(/\/+$/, "");
  return `${base}/${p.replace(/^\/+/, "")}`;
}
function ownerProfileImg(o: CarOwnerType): string {
  const raw = o as Record<string, unknown>;
  const candidates = [
    o.profilePhoto,
    o.profileImage,
    typeof raw.avatar === "string" ? raw.avatar : "",
    typeof raw.photo === "string" ? raw.photo : "",
    typeof raw.image === "string" ? raw.image : "",
  ];
  for (const candidate of candidates) {
    const url = mediaUrl(candidate || "");
    if (url) return url;
  }
  return "";
}
function fmtDate(d?: string): string {
  if (!d) return "-";
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toISOString().slice(0, 10);
}
function getMakeName(v: VehicleType): string {
  if (!v.make) return "-";
  if (typeof v.make === "object") return v.make.name || "-";
  return String(v.make);
}
function getMakeModel(v: VehicleType): string {
  if (!v.make) return "-";
  if (typeof v.make === "object") return v.make.model || "-";
  return "-";
}
function primaryVehicle(owner: CarOwnerType): VehicleType | undefined {
  return owner.myVehicles?.[0];
}

const VEHICLE_DOC_FIELDS: { key: string; label: string }[] = [
  { key: "licensePlateFrontImagePath", label: "License plate (front)" },
  { key: "licensePlateBackImagePath", label: "License plate (back)" },
  { key: "carOwnershipCertificate", label: "Ownership certificate" },
  { key: "insuranceCertificate", label: "Insurance certificate" },
  { key: "drivingLicenseFront", label: "Driving license (front)" },
  { key: "drivingLicenseBack", label: "Driving license (back)" },
  { key: "carImage", label: "Vehicle photo" },
];

function pushDoc(docs: OwnerDocumentItem[], label: string, path?: string | null) {
  const url = mediaUrl(path || "");
  if (!url) return;
  if (docs.some((d) => d.url === url)) return;
  docs.push({ label, url });
}

function collectDocsFromRecord(docs: OwnerDocumentItem[], item: unknown, index: number, plateSuffix = "") {
  if (typeof item === "string") {
    pushDoc(docs, `Document ${index + 1}${plateSuffix}`, item);
    return;
  }
  if (!item || typeof item !== "object") return;
  const rec = item as Record<string, unknown>;
  const path =
    (typeof rec.url === "string" && rec.url) ||
    (typeof rec.path === "string" && rec.path) ||
    (typeof rec.document === "string" && rec.document) ||
    (typeof rec.file === "string" && rec.file) ||
    "";
  const label =
    (typeof rec.label === "string" && rec.label) ||
    (typeof rec.name === "string" && rec.name) ||
    (typeof rec.type === "string" && rec.type) ||
    `Document ${index + 1}`;
  pushDoc(docs, `${label}${plateSuffix}`, path);
  for (const field of VEHICLE_DOC_FIELDS) {
    const value = rec[field.key];
    if (typeof value === "string") pushDoc(docs, `${field.label}${plateSuffix}`, value);
  }
}

function ownerDocuments(owner: CarOwnerType): OwnerDocumentItem[] {
  const docs: OwnerDocumentItem[] = [];
  const raw = owner.documents;
  if (Array.isArray(raw)) {
    raw.forEach((item, i) => collectDocsFromRecord(docs, item, i));
  } else if (raw && typeof raw === "object") {
    collectDocsFromRecord(docs, raw, 0);
  }
  for (const v of owner.myVehicles ?? []) {
    const plate = v.licensePlateNo ? ` (${v.licensePlateNo})` : "";
    for (const field of VEHICLE_DOC_FIELDS) {
      const value = v[field.key];
      if (typeof value === "string") pushDoc(docs, `${field.label}${plate}`, value);
    }
    const nested = (v as Record<string, unknown>).documents;
    if (Array.isArray(nested)) {
      nested.forEach((item, i) => collectDocsFromRecord(docs, item, i, plate));
    } else if (nested && typeof nested === "object") {
      collectDocsFromRecord(docs, nested, 0, plate);
    }
  }
  return docs;
}
function getToken(): Record<string, string> {
  return authHeaders();
}
/** Thought-of-the-day likes given by this car owner (API may send a count or a liked flag). */
function getOwnerThoughtLikes(owner: CarOwnerType): number {
  const raw = owner as Record<string, unknown>;
  const numericKeys = [
    "thoughtOfTheDayLikes",
    "thoughtOfTheDayLikeCount",
    "thoughtOfDayLikes",
    "thoughtOfDayLikeCount",
    "totdLikes",
    "noOfLikes",
  ] as const;
  for (const key of numericKeys) {
    const v = raw[key];
    if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, Math.floor(v));
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
      return Math.max(0, Math.floor(Number(v)));
    }
  }
  if (owner.thoughtOfTheDayLikes != null && Number.isFinite(owner.thoughtOfTheDayLikes)) {
    return Math.max(0, Math.floor(owner.thoughtOfTheDayLikes));
  }
  return owner.thoughtOfTheDayLiked ? 1 : 0;
}

// ─── Green Card Styles ───────────────────────────────────────────────────────
const GREEN_CARD: React.CSSProperties = {
  background: "#d4f5c4", border: "1px solid #b2e0a0", borderRadius: 14,
  padding: "18px 22px", marginBottom: 18, boxShadow: "3px 4px 0 #c0d8b0",
  position: "relative",
};
const GC_LABEL: React.CSSProperties = { color: "#555", fontWeight: 600, fontSize: 13, minWidth: 110 };
const GC_VAL: React.CSSProperties = { color: "#222", fontSize: 13 };
function GCRow({ label, value }: { label: string; value?: any }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
      <span style={GC_LABEL}>{label}</span>
      <span style={{ color: "#888", marginRight: 4 }}>:</span>
      <span style={GC_VAL}>{value ?? "-"}</span>
    </div>
  );
}

// ─── BASE MODAL ───────────────────────────────────────────────────────────────
const BaseModal: React.FC<{
  isOpen: boolean; onClose: () => void; title: string;
  children: React.ReactNode; wide?: boolean; maxW?: string;
}> = ({ isOpen, onClose, title, children, wide, maxW }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "30px 10px" }}>
      <div style={{ background: "#fff", borderRadius: 4, width: maxW ?? (wide ? "min(920px,96vw)" : "min(720px,95vw)"), boxShadow: "0 5px 24px rgba(0,0,0,.35)", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#9b308d", color: "#fff", padding: "11px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "4px 4px 0 0", flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
          <button onClick={onClose} type="button" style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
};

// ─── VEHICLES MODAL ──────────────────────────────────────────────────────────
const VehiclesModal: React.FC<{ owner: CarOwnerType; onClose: () => void }> = ({ owner, onClose }) => {
  const vehicles = owner.myVehicles ?? [];
  return (
    <BaseModal isOpen wide onClose={onClose} title={`Vehicles — ${owner.name}`}>
      {vehicles.length === 0
        ? <p style={{ textAlign: "center", color: "#aaa" }}>No vehicles found.</p>
        : vehicles.map((v) => (
          <div key={v._id}>
            <h3 style={{ fontFamily: "serif", fontWeight: 700, fontSize: 18, marginBottom: 10 }}>
              {getMakeName(v)} - {getMakeModel(v)}
            </h3>
            <div style={GREEN_CARD}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(150px,220px) 1fr", gap: 16 }}>
                <div>
                  <div style={{ background: "#fff", border: "1px solid #ccc", borderRadius: 6, width: "100%", paddingBottom: "75%", position: "relative", overflow: "hidden", marginBottom: 6 }}>
                    {Array.isArray(v.carImages) && v.carImages[0]
                      ? <img src={mediaUrl(v.carImages[0])} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      : null}
                  </div>
                  <div style={{ background: "#1a6e1a", color: "#fff", fontWeight: 700, fontSize: 14, textAlign: "center", borderRadius: 4, padding: "4px 8px", letterSpacing: 1 }}>
                    {v.licensePlateNo || "—"}
                  </div>
                </div>
                <div style={{ paddingTop: 8 }}>
                  <GCRow label="VIN" value={v.vinNo} />
                  <GCRow label="Year" value={v.year} />
                  <GCRow label="Odo" value={v.odometerReading !== undefined ? `${v.odometerReading}` : undefined} />
                  <GCRow label="Created on" value={fmtDate(v.createdAt)} />
                  <GCRow label="Updated" value={fmtDate(v.updatedAt)} />
                  <GCRow label="Status" value={v.status ?? "Active"} />
                </div>
              </div>
            </div>
          </div>
        ))}
    </BaseModal>
  );
};

// ─── DOCUMENTS MODAL ──────────────────────────────────────────────────────────
const DocumentsModal: React.FC<{ owner: CarOwnerType; onClose: () => void }> = ({ owner, onClose }) => {
  const docs = ownerDocuments(owner);
  return (
    <BaseModal isOpen wide onClose={onClose} title={`Documents — ${owner.name}`}>
      {docs.length === 0 ? (
        <p style={{ textAlign: "center", color: "#aaa" }}>No documents found.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {docs.map((doc) => (
            <div key={`${doc.label}-${doc.url}`} style={GREEN_CARD}>
              <div style={{ background: "#fff", border: "1px solid #ccc", borderRadius: 6, width: "100%", paddingBottom: "75%", position: "relative", overflow: "hidden", marginBottom: 8 }}>
                <img src={doc.url} alt={doc.label} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#333", textAlign: "center" }}>{doc.label}</p>
            </div>
          ))}
        </div>
      )}
    </BaseModal>
  );
};

// ─── AUTO SHOPS MODAL ─────────────────────────────────────────────────────────
const AutoShopsModal: React.FC<{ owner: CarOwnerType; onClose: () => void }> = ({ owner, onClose }) => {
  const shops = owner.autoshopsReceivedServiceFrom ?? [];
  const favIds = new Set((owner.favoriteAutoShops ?? []).map(f => f._id));
  return (
    <BaseModal isOpen wide onClose={onClose} title={`Auto Shops — ${owner.name}`}>
      {shops.length === 0
        ? <p style={{ textAlign: "center", color: "#aaa" }}>No auto shops found.</p>
        : shops.map((s) => {
          const services = (s.myServices ?? []).map((sv: any) =>
            typeof sv === "string" ? sv : (sv.serviceName || sv.name || "Service")
          );
          return (
            <div key={s._id}>
              <h3 style={{ fontFamily: "serif", fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{s.businessName}</h3>
              <div style={GREEN_CARD}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(150px,200px) 1fr auto", gap: 16, alignItems: "start" }}>
                  <div>
                    <div style={{ background: "#fff", border: "1px solid #ccc", borderRadius: 6, width: "100%", paddingBottom: "75%", position: "relative", overflow: "hidden", marginBottom: 6 }}>
                      {s.businessLogo
                        ? <img src={mediaUrl(s.businessLogo)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                        : null}
                    </div>
                    <div style={{ background: "#1a6e1a", color: "#fff", fontWeight: 700, fontSize: 12, textAlign: "center", borderRadius: 4, padding: "4px 8px" }}>
                      {s.businessPhone || "—"}
                    </div>
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <GCRow label="Address" value={s.businessAddress} />
                    <GCRow label="City" value={s.city} />
                    <GCRow label="Zip Code" value={s.pincode} />
                    <GCRow label="Updated" value={fmtDate(s.updatedAt)} />
                    <GCRow label="Service" value={services[0]} />
                    {services.slice(1).map((sv: string, i: number) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                        <span style={{ minWidth: 110 }}></span>
                        <span style={{ color: "#888", marginRight: 4 }}>:</span>
                        <span style={GC_VAL}>{sv}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 4 }}>
                    {favIds.has(s._id) && <span style={{ fontSize: 22 }}>❤️</span>}
                    {s.directionsUrl || s.businessMapLocation
                      ? <a href={s.directionsUrl || (s.businessMapLocation ? `https://maps.google.com?q=${s.businessMapLocation.lat},${s.businessMapLocation.lng}` : "#")} target="_blank" rel="noreferrer" style={{ color: "#0073b7", fontSize: 13, fontWeight: 600 }}>Directions</a>
                      : null}
                    {s.businessWebsite && <a href={s.businessWebsite} target="_blank" rel="noreferrer" style={{ color: "#0073b7", fontSize: 13, fontWeight: 600 }}>Website</a>}
                    {s.businessEmail && <a href={`mailto:${s.businessEmail}`} style={{ color: "#0073b7", fontSize: 13, fontWeight: 600 }}>Email</a>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </BaseModal>
  );
};

// ─── JOB CARDS MODAL ──────────────────────────────────────────────────────────
const JobCardsModal: React.FC<{ owner: CarOwnerType; onClose: () => void }> = ({ owner, onClose }) => {
  const cards = owner.jobCards ?? [];
  const grouped: Record<string, JobCardType[]> = {};
  for (const c of cards) {
    const plate = c.vehicleId?.licensePlateNo ?? "Unknown";
    if (!grouped[plate]) grouped[plate] = [];
    grouped[plate].push(c);
  }
  return (
    <BaseModal isOpen wide onClose={onClose} title={`Job Cards — ${owner.name}`}>
      {cards.length === 0
        ? <p style={{ textAlign: "center", color: "#aaa" }}>No job cards found.</p>
        : Object.entries(grouped).map(([plate, groupCards]) => (
          <div key={plate}>
            <h3 style={{ fontFamily: "serif", fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{plate}</h3>
            {groupCards.map((c) => {
              const services = (c.services ?? []).map((s: any) =>
                s?.id?.name ?? s?.name ?? "Service"
              );
              return (
                <div key={c._id} style={GREEN_CARD}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                    <GCRow label="Job Card No" value={c.jobNo ? `#${c.jobNo}` : undefined} />
                    <GCRow label="Service type" value={services[0]} />
                    <GCRow label="Created on" value={fmtDate(c.createdAt)} />
                    <GCRow label="Auto Shop" value={c.business?.businessName} />
                  </div>
                  <button
                    type="button"
                    style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", fontSize: 26, color: "#1a8a1a", cursor: "pointer", lineHeight: 1 }}
                    title="View details"
                  >+</button>
                </div>
              );
            })}
          </div>
        ))}
    </BaseModal>
  );
};

type CarCatalogModel = { modelName: string; years: (number | string)[] };
type CarCatalogItem = { _id: string; companyName: string; models: CarCatalogModel[] };

function normalizeYearOptions(years: (number | string)[]): string[] {
  const out: string[] = [];
  for (const y of years) {
    if (typeof y === "number") out.push(String(y));
    else if (typeof y === "string") {
      y.split(",").forEach((part) => {
        const t = part.trim();
        if (t) out.push(t);
      });
    }
  }
  return [...new Set(out)].sort((a, b) => Number(b) - Number(a));
}

// ─── ADD/EDIT MODAL ───────────────────────────────────────────────────────────
type VehicleFormRow = {
  _id?: string;
  licensePlateNo: string;
  vinNo: string;
  vehicleName: string;
  model: string;
  year: string;
  odometerReading: string;
  nextDueService: string;
  attachNextDueService: boolean;
  attachVehiclePhoto: boolean;
  vehicleImageFile: File | null;
  vehicleImagePreview: string;
};
function emptyVehicle(): VehicleFormRow {
  return {
    licensePlateNo: "",
    vinNo: "",
    vehicleName: "",
    model: "",
    year: "",
    odometerReading: "",
    nextDueService: "",
    attachNextDueService: false,
    attachVehiclePhoto: false,
    vehicleImageFile: null,
    vehicleImagePreview: "",
  };
}
function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }
const fieldErrorClass = "mt-0.5 text-[11px] font-semibold text-red-700";
const carOwnerRowFieldWidth = compactFixedFieldWidth;
const carOwnerAddressFieldWidth = "min-w-0 flex-1";
const vehicleGridClass = "grid w-full grid-cols-6 gap-x-4 gap-y-3 items-start";
const vehicleFieldClass = "!flex-none min-w-0 w-full";

type ProvinceCityOption = { name: string; status?: string };
type ProvinceWithCities = { cities?: ProvinceCityOption[] };

function VehicleRowForm({ v, i, attempted, carCatalog, onChange, onRemove, canRemove }: {
  v: VehicleFormRow; i: number; attempted: boolean; carCatalog: CarCatalogItem[];
  onChange: (p: Partial<VehicleFormRow>) => void; onRemove: () => void; canRemove: boolean;
}) {
  const makeOptions = React.useMemo(
    () => [...new Set(carCatalog.map((c) => c.companyName))].sort((a, b) => a.localeCompare(b)),
    [carCatalog],
  );
  const modelOptions = React.useMemo(() => {
    if (!v.vehicleName) return [];
    const company = carCatalog.find((c) => c.companyName === v.vehicleName);
    return (company?.models ?? []).map((m) => m.modelName).sort((a, b) => a.localeCompare(b));
  }, [carCatalog, v.vehicleName]);
  const yearOptions = React.useMemo(() => {
    if (!v.vehicleName || !v.model) return [];
    const company = carCatalog.find((c) => c.companyName === v.vehicleName);
    const model = company?.models.find((m) => m.modelName === v.model);
    return model ? normalizeYearOptions(model.years) : [];
  }, [carCatalog, v.vehicleName, v.model]);

  return (
    <div className="mb-2 w-full rounded border border-gray-300 bg-white px-6 py-3 shadow-sm last:mb-0">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold text-ad-green-dark">Vehicle #{i + 1}</span>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-xs font-semibold text-red-600 hover:underline">
            Remove
          </button>
        )}
      </div>
      <div className={vehicleGridClass}>
        <CompactField label="Make" required className={vehicleFieldClass}>
          <select
            value={v.vehicleName}
            onChange={(e) => onChange({ vehicleName: e.target.value, model: "", year: "" })}
            className={compactInputClass}
          >
            <option value="">Select make</option>
            {makeOptions.map((make) => (
              <option key={make} value={make}>{make}</option>
            ))}
            {v.vehicleName && !makeOptions.includes(v.vehicleName) && (
              <option value={v.vehicleName}>{v.vehicleName}</option>
            )}
          </select>
        </CompactField>
        <CompactField label="Model" required className={vehicleFieldClass}>
          <select
            value={v.model}
            onChange={(e) => onChange({ model: e.target.value, year: "" })}
            disabled={!v.vehicleName}
            className={`${compactInputClass} disabled:cursor-not-allowed disabled:bg-gray-100`}
          >
            <option value="">Select model</option>
            {modelOptions.map((modelName) => (
              <option key={modelName} value={modelName}>{modelName}</option>
            ))}
            {v.model && !modelOptions.includes(v.model) && (
              <option value={v.model}>{v.model}</option>
            )}
          </select>
        </CompactField>
        <CompactField label="Year" required className={vehicleFieldClass}>
          <select
            value={v.year}
            onChange={(e) => onChange({ year: e.target.value })}
            disabled={!v.vehicleName || !v.model}
            className={`${compactInputClass} disabled:cursor-not-allowed disabled:bg-gray-100`}
          >
            <option value="">Select year</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
            {v.year && !yearOptions.includes(v.year) && (
              <option value={v.year}>{v.year}</option>
            )}
          </select>
        </CompactField>
        <CompactField label="License Plate" required className={vehicleFieldClass}>
          <input
            type="text"
            value={v.licensePlateNo}
            onChange={(e) => onChange({ licensePlateNo: e.target.value.slice(0, 14) })}
            placeholder="ABC 1234"
            className={compactInputClass}
          />
          {attempted && !v.licensePlateNo.trim() && <p className={fieldErrorClass}>Required</p>}
        </CompactField>
        <CompactField label="VIN" className={vehicleFieldClass}>
          <input
            type="text"
            value={v.vinNo}
            onChange={(e) => onChange({ vinNo: e.target.value.slice(0, 17).toUpperCase() })}
            placeholder="17-char VIN"
            maxLength={17}
            className={compactInputClass}
          />
          {attempted && v.vinNo && v.vinNo.length !== 17 && <p className={fieldErrorClass}>Must be 17 chars</p>}
        </CompactField>
        <div className="min-w-0 w-full">
          <label className="mb-1 block text-xs font-bold text-ad-green-dark">Odometer</label>
          <input
            type="text"
            value={v.odometerReading}
            onChange={(e) => onChange({ odometerReading: e.target.value.replace(/\D/g, "") })}
            placeholder="km"
            className={compactInputClass}
          />
        </div>
        <div className="col-start-1 min-w-0 w-full">
          <AttachImageCheckbox
            label="Attach Image"
            checked={v.attachVehiclePhoto}
            onCheckedChange={(checked) => {
              if (!checked) {
                if (v.vehicleImagePreview?.startsWith("blob:")) URL.revokeObjectURL(v.vehicleImagePreview);
                onChange({
                  attachVehiclePhoto: false,
                  vehicleImageFile: null,
                  vehicleImagePreview: "",
                });
              } else {
                onChange({ attachVehiclePhoto: true });
              }
            }}
            file={v.vehicleImageFile}
            onFileChange={(file) => {
              if (!file) return;
              if (v.vehicleImagePreview?.startsWith("blob:")) URL.revokeObjectURL(v.vehicleImagePreview);
              onChange({ vehicleImageFile: file, vehicleImagePreview: URL.createObjectURL(file) });
            }}
          />
        </div>
        <div className="col-start-6 min-w-0 w-full">
          <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
            <input
              type="checkbox"
              checked={v.attachNextDueService}
              onChange={(e) => {
                const checked = e.target.checked;
                onChange({
                  attachNextDueService: checked,
                  ...(!checked ? { nextDueService: "" } : {}),
                });
              }}
              className="h-3.5 w-3.5 accent-ad-green"
            />
            Next Due Service
          </label>
          {v.attachNextDueService ? (
            <input
              type="text"
              value={v.nextDueService}
              onChange={(e) => onChange({ nextDueService: e.target.value.replace(/\D/g, "") })}
              placeholder="km"
              className={compactInputClass}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

const CarOwnerAddEditForm: React.FC<{ owner?: CarOwnerType | null; onCancel: () => void; onSaved: () => void }> = ({ owner, onCancel, onSaved }) => {
  const isEdit = !!owner;
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState(""); const [joiningDate, setJoiningDate] = useState("");
  const [vehicles, setVehicles] = useState<VehicleFormRow[]>([emptyVehicle()]);
  const [attachEmail, setAttachEmail] = useState(false);
  const [attachProfilePhoto, setAttachProfilePhoto] = useState(false);
  const [profileFile, setProfileFile] = useState<File | null>(null); const [profilePreview, setProfilePreview] = useState("");
  const [submitting, setSubmitting] = useState(false); const [attempted, setAttempted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [carCatalog, setCarCatalog] = useState<CarCatalogItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API()}/api/admin/provinces`, { headers: getToken() });
        if (cancelled) return;
        const provinces: ProvinceWithCities[] = res.data?.data || [];
        const names = new Set<string>();
        for (const province of provinces) {
          for (const c of province.cities || []) {
            if (!c.status || c.status === "Active") names.add(c.name);
          }
        }
        setCityOptions([...names].sort((a, b) => a.localeCompare(b)));
      } catch {
        if (!cancelled) setCityOptions([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API()}/api/admin/car-company`, { headers: getToken() });
        if (cancelled) return;
        if (res.data?.success && Array.isArray(res.data.data)) {

          setCarCatalog(res.data.data);
        } else {
          setCarCatalog([]);
        }
      } catch {
        if (!cancelled) setCarCatalog([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const citySelectOptions = React.useMemo(() => {
    const names = new Set(cityOptions);
    if (city.trim()) names.add(city.trim());
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [cityOptions, city]);

  useEffect(() => {
    setAttempted(false); setApiError(null);
    if (isEdit && owner) {
      setName(owner.name || ""); setEmail(owner.email || "");
      setPhone(owner.phone || ""); setAddress(owner.address || "");
      setCity(owner.city || ""); setJoiningDate(fmtDate(owner.createdAt) !== "-" ? fmtDate(owner.createdAt) : "");
      const existingProfileImg = ownerProfileImg(owner);
      setAttachEmail(!!owner.email?.trim());
      setAttachProfilePhoto(!!existingProfileImg);
      setProfileFile(null);
      setProfilePreview(existingProfileImg);
      setVehicles((owner.myVehicles ?? []).map(v => ({
        _id: v._id, licensePlateNo: v.licensePlateNo || "", vinNo: v.vinNo || "",
        vehicleName: getMakeName(v) === "-" ? "" : getMakeName(v),
        model: getMakeModel(v) === "-" ? "" : getMakeModel(v),
        year: v.year ? String(v.year) : "",
        odometerReading: v.odometerReading != null ? String(v.odometerReading) : "",
        nextDueService: v.dueOdometerReading != null ? String(v.dueOdometerReading) : "",
        attachNextDueService: false,
        attachVehiclePhoto: false,
        vehicleImageFile: null,
        vehicleImagePreview: Array.isArray(v.carImages) && v.carImages[0] ? mediaUrl(v.carImages[0]) : "",
      })) || [emptyVehicle()]);
    } else {
      setName(""); setEmail(""); setPhone(""); setAddress(""); setCity("");
      setJoiningDate(new Date().toISOString().slice(0, 10));
      setAttachEmail(false); setAttachProfilePhoto(false); setProfileFile(null); setProfilePreview(""); setVehicles([emptyVehicle()]);
    }
  }, [isEdit, owner]);

  function validate(): string | null {
    if (!name.trim()) return "Name is required.";
    if (attachEmail && (!email.trim() || !isValidEmail(email))) return "Valid email required.";
    if (phone.replace(/\D/g, "").length !== 10) return "Phone must be 10 digits.";
    if (!address.trim()) return "Address is required.";
    return null;
  }

  async function handleSave() {
    setAttempted(true);
    const err = validate();
    if (err) {
      setApiError(err);
      adminNotify.error(err);
      return;
    }
    setApiError(null);
    const filled = vehicles.filter(v => v.licensePlateNo.trim() || v.vehicleName.trim());
    const fd = new FormData();
    if (isEdit && owner) fd.append("carOwnerId", owner._id);
    fd.append("name", name.trim());
    if (attachEmail && email.trim()) fd.append("email", email.trim());
    fd.append("phone", phone.replace(/\D/g, ""));
    fd.append("address", address.trim().slice(0, 50));
    if (city.trim()) fd.append("city", city.trim());
    if (joiningDate.trim()) fd.append("createdAt", joiningDate.trim());
    if (!isEdit) fd.append("role", "carowner");
    fd.append("vehicles", JSON.stringify(filled.map(v => ({
      ...(v._id ? { _id: v._id } : {}),
      licensePlateNo: v.licensePlateNo.trim(),
      vinNo: v.vinNo.trim(),
      vehicleName: v.vehicleName.trim(),
      model: v.model.trim(),
      year: v.year.trim(),
      odometerReading: v.odometerReading.trim(),
      ...(v.attachNextDueService && v.nextDueService.trim() ? { dueOdometerReading: v.nextDueService.trim() } : {}),
    }))));
    if (profileFile) fd.append("profilePhoto", profileFile, profileFile.name);
    filled.forEach((v, idx) => {
      if (v.attachVehiclePhoto && v.vehicleImageFile) {
        fd.append(`carImage_${idx}`, v.vehicleImageFile, v.vehicleImageFile.name);
      }
    });
    setSubmitting(true);
    try {
      if (isEdit) await axios.put(`${API()}/api/admin/carowners/edit`, fd, { headers: getToken() });
      else await axios.post(`${API()}/api/admin/carowners/onboard`, fd, { headers: getToken() });
      adminNotify.success(isEdit ? "Car owner updated." : "Car owner added.");
      onSaved();
    } catch (err: any) {
      const msg = err?.response?.data?.message || (isEdit ? "Could not update." : "Could not add.");
      setApiError(msg);
      adminNotify.error(msg);
    } finally { setSubmitting(false); }
  }

  const formMessage = isEdit
    ? "You are updating a 'Car Owner'"
    : "You are creating a 'Car Owner'";

  return (
    <CompactFormPanel
      footer={
        <CompactFormFooter
          message={formMessage}
          messageCenter
          actionLabel={submitting ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update" : "Save")}
          onSave={handleSave}
          onCancel={onCancel}
        />
      }
    >
      {apiError && (
        <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
          {apiError}
        </div>
      )}
      <CompactFormRow className="items-start">
        <CompactField label="Date" className={carOwnerRowFieldWidth}>
          <input
            type="date"
            value={joiningDate}
            onChange={(e) => setJoiningDate(e.target.value)}
            className={compactInputClass}
          />
        </CompactField>
        <CompactField label="Phone" required className={carOwnerRowFieldWidth}>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            className={compactInputClass}
          />
          {attempted && phone.replace(/\D/g, "").length !== 10 && (
            <p className={fieldErrorClass}>Must be 10 digits</p>
          )}
        </CompactField>
        <CompactField label="Full Name" required className={carOwnerRowFieldWidth}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            className={compactInputClass}
          />
          {attempted && !name.trim() && <p className={fieldErrorClass}>Required</p>}
        </CompactField>
        <CompactField label="City" className={carOwnerRowFieldWidth}>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={compactInputClass}
          >
            <option value="">Select city</option>
            {citySelectOptions.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
        </CompactField>
        <CompactField label="Address" required className={carOwnerAddressFieldWidth}>
          <CompactAutoGrowTextarea
            value={address}
            onChange={(e) => setAddress(e.target.value.slice(0, 50))}
            placeholder="Max 50 chars"
          />
          {attempted && !address.trim() && <p className={fieldErrorClass}>Required</p>}
        </CompactField>
      </CompactFormRow>
      <CompactFormRow className="items-start justify-start gap-6">
        <div className={`min-w-0 shrink-0 flex-none ${compactFixedFieldWidth}`}>
          <AttachImageCheckbox
            label="Attach Image"
            checked={attachProfilePhoto}
            onCheckedChange={(checked) => {
              setAttachProfilePhoto(checked);
              if (!checked) {
                if (profilePreview?.startsWith("blob:")) URL.revokeObjectURL(profilePreview);
                setProfileFile(null);
                setProfilePreview(isEdit && owner ? ownerProfileImg(owner) : "");
              }
            }}
            file={profileFile}
            onFileChange={(file) => {
              if (!file) return;
              if (profilePreview?.startsWith("blob:")) URL.revokeObjectURL(profilePreview);
              setProfileFile(file);
              setProfilePreview(URL.createObjectURL(file));
            }}
          />
        </div>
        <div className={`min-w-0 shrink-0 flex-none ${compactFixedFieldWidth}`}>
          <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
            <input
              type="checkbox"
              checked={attachEmail}
              onChange={(e) => {
                const checked = e.target.checked;
                setAttachEmail(checked);
                if (!checked) {
                  setEmail(isEdit && owner ? (owner.email || "") : "");
                }
              }}
              className="h-3.5 w-3.5 accent-ad-green"
            />
            Email
          </label>
          {attachEmail ? (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={compactInputClass}
              />
              {attempted && !isValidEmail(email) && (
                <p className={fieldErrorClass}>Valid email required</p>
              )}
            </>
          ) : null}
        </div>
      </CompactFormRow>
      <div className="flex items-center justify-between border-t border-gray-300 pt-3">
        <span className="text-xs font-bold text-ad-green-dark">Vehicles</span>
        {vehicles.length < 5 && (
          <button
            type="button"
            onClick={() => setVehicles((v) => [...v, emptyVehicle()])}
            className="rounded bg-ad-green px-2.5 py-0.5 text-xs font-semibold text-white hover:brightness-95"
          >
            + Add Vehicle
          </button>
        )}
      </div>
      <div className="mt-2 w-full space-y-0 px-2 sm:px-3">
        {vehicles.map((v, i) => (
          <VehicleRowForm
            key={i}
            v={v}
            i={i}
            attempted={attempted}
            carCatalog={carCatalog}
            onChange={(patch) =>
              setVehicles((prev) => {
                const n = [...prev];
                n[i] = { ...n[i], ...patch };
                return n;
              })
            }
            onRemove={() => setVehicles((prev) => prev.filter((_, idx) => idx !== i))}
            canRemove={vehicles.length > 1}
          />
        ))}
      </div>
    </CompactFormPanel>
  );
};

// ─── SEND NOTIFICATION ────────────────────────────────────────────────────────
const notifLabelClass = "mb-1 block text-xs font-bold text-gray-600";
const SendNotifModal: React.FC<{ isOpen: boolean; onClose: () => void; ids: string[]; onDone: () => void }> = ({ isOpen, onClose, ids, onDone }) => {
  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [sending, setSending] = useState(false); const [err, setErr] = useState<string | null>(null); const [ok, setOk] = useState<string | null>(null);
  useEffect(() => { if (isOpen) { setTitle(""); setBody(""); setSending(false); setErr(null); setOk(null); } }, [isOpen]);
  if (!isOpen) return null;
  return (
    <BaseModal isOpen onClose={onClose} title="Send Custom Notification">
      <form onSubmit={async e => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) {
          const msg = "Title and body required.";
          setErr(msg);
          adminNotify.error(msg);
          return;
        }
        setSending(true); setErr(null);
        try {
          const res = await axios.post(`${API()}/api/admin/notification/custom/send`, { userType: "carOwner", userIds: ids, title, message: body });
          if (res.data?.success) {
            adminNotify.success("Notification sent.");
            setOk("Sent!");
            setTimeout(() => { onClose(); onDone(); }, 900);
          } else {
            const msg = res.data?.message || "Failed.";
            setErr(msg);
            adminNotify.error(msg);
          }
        } catch (e: any) {
          const msg = e?.response?.data?.message || "Error.";
          setErr(msg);
          adminNotify.error(msg);
        } finally { setSending(false); }
      }}>
        <div className="mb-3">
          <label className={notifLabelClass}>Title *</label>
          <input className={compactInputClass} value={title} onChange={e => setTitle(e.target.value)} maxLength={100} disabled={sending} />
        </div>
        <div className="mb-3">
          <label className={notifLabelClass}>Body *</label>
          <textarea className={`${compactInputClass} min-h-[80px] resize-y`} value={body} onChange={e => setBody(e.target.value)} rows={3} disabled={sending} />
        </div>
        <p style={{ fontSize: 13, color: "#2575c4", marginBottom: 10 }}>To: <strong>{ids.length} owner{ids.length !== 1 ? "s" : ""}</strong></p>
        {err && <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 8, background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, padding: "7px 10px" }}>{err}</div>}
        {ok && <div style={{ color: "#27ae60", fontSize: 13, marginBottom: 8, background: "#f0fff4", border: "1px solid #c3e6cb", borderRadius: 3, padding: "7px 10px" }}>{ok}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} disabled={sending} style={{ padding: "7px 18px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#444", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button type="submit" disabled={sending} style={{ padding: "7px 20px", borderRadius: 3, border: "none", background: sending ? "#aaa" : "#00a65a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: sending ? "not-allowed" : "pointer" }}>{sending ? "Sending…" : "Send"}</button>
        </div>
      </form>
    </BaseModal>
  );
};

// ─── COLUMN SELECTOR DROPDOWN ─────────────────────────────────────────────────
const ColSelector: React.FC<{ visible: string[]; onChange: (v: string[]) => void }> = ({ visible, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = (key: string) => onChange(visible.includes(key) ? visible.filter(k => k !== key) : [...visible, key]);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{ padding: "6px 14px", background: "#555", color: "#fff", border: "none", borderRadius: 3, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
        Select Heading <span style={{ fontSize: 10 }}>▼</span>
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "110%", background: "#fff", border: "1px solid #d2d6de", borderRadius: 3, boxShadow: "0 3px 10px rgba(0,0,0,.15)", zIndex: 200, minWidth: 160, padding: "6px 0" }}>
          {ALL_COLUMNS.map(col => (
            <label key={col.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, color: "#333", userSelect: "none" }}>
              <input type="checkbox" checked={visible.includes(col.key)} onChange={() => toggle(col.key)} style={{ accentColor: "#0073b7", width: 14, height: 14, cursor: "pointer" }} />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── EXPORT CSV ──────────────────────────────────────────────────────────────
function exportCsv(owners: CarOwnerType[], visibleCols: string[]) {
  const colMap = ownerPrintColMap();
  const cols = ALL_COLUMNS.filter(c => visibleCols.includes(c.key));
  const esc = (v: string) => /[,"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  const header = cols.map(c => esc(c.label)).join(",");
  const rows = owners.map(o => cols.map(c => esc(colMap[c.key]?.(o) ?? "-")).join(",")).join("\n");
  const blob = new Blob([header + "\n" + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `car-owners-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function ownerPrintColMap(): Record<string, (o: CarOwnerType) => string> {
  return {
    name: o => o.name || "-",
    phone: o => o.phone || "-",
    email: o => o.email || "-",
    city: o => o.city || "-",
    address: o => o.address || "-",
    date: o => fmtDate(o.createdAt),
    profilePhoto: o => (ownerProfileImg(o) ? "Yes" : "-"),
    documents: o => {
      const n = ownerDocuments(o).length;
      return n > 0 ? String(n) : "-";
    },
    vin: o => primaryVehicle(o)?.vinNo || "-",
    vehicle: o => (o.myVehicles ?? []).map(v => `${getMakeName(v)} ${getMakeModel(v)} ${v.year ?? ""}`).join("; ") || "-",
    autoShops: o => (o.autoshopsReceivedServiceFrom ?? []).map(s => s.businessName).join("; ") || "-",
    jobCard: o => (o.jobCards ?? []).map(c => `#${c.jobNo ?? c._id.slice(-5)}`).join("; ") || "-",
    invoice: () => "-",
    likes: o => String(getOwnerThoughtLikes(o)),
    status: o => o.status ?? "Active",
  };
}

function printOwnersTable(owners: CarOwnerType[], visibleCols: string[], title: string) {
  const colMap = ownerPrintColMap();
  const cols = ALL_COLUMNS.filter((c) => visibleCols.includes(c.key));
  printAdminTable({
    title,
    headers: cols.map((c) => c.label),
    rows: owners.map((o) => cols.map((c) => colMap[c.key]?.(o) ?? "-")),
  });
}

// ─── STYLE CONSTANTS ──────────────────────────────────────────────────────────
const tdClass = "border border-gray-300 px-3 py-2 text-center text-sm text-gray-700";
const thClass = "border border-ad-purple-dark px-3 py-2 text-center font-medium whitespace-nowrap";
const linkClass = "text-blue-700 hover:underline bg-transparent border-0 p-0 text-sm cursor-pointer font-medium";

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const CarOwners: React.FC = () => {
  const [allOwners, setAllOwners] = useState<CarOwnerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showSearchCard, setShowSearchCard] = useState(false);
  const [searchDraft, setSearchDraft] = useState(() => emptyAdminSearchValues(CAR_OWNER_SEARCH_FIELDS));
  const [searchFilters, setSearchFilters] = useState(() => emptyAdminSearchValues(CAR_OWNER_SEARCH_FIELDS));
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_VISIBLE);

  // ── NEW: toggle between active/inactive view and deleted view ──
  const [showDeleted, setShowDeleted] = useState(false);

  // Modal states
  const [vehiclesFor, setVehiclesFor] = useState<CarOwnerType | null>(null);
  const [documentsFor, setDocumentsFor] = useState<CarOwnerType | null>(null);
  const [shopsFor, setShopsFor] = useState<CarOwnerType | null>(null);
  const [jobCardsFor, setJobCardsFor] = useState<CarOwnerType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOwner, setEditingOwner] = useState<CarOwnerType | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);

  const openAdd = () => {
    setEditingOwner(null);
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openEdit = (owner: CarOwnerType) => {
    setEditingOwner(owner);
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openSearchCard = () => {
    setShowForm(false);
    setEditingOwner(null);
    setSearchDraft({ ...searchFilters });
    setShowSearchCard((open) => !open);
  };

  const handleSearchCardSearch = () => {
    setSearchFilters({ ...searchDraft });
    setCurrentPage(1);
    setSelectedRows(new Set());
  };

  const handleSearchCardReset = () => {
    const empty = emptyAdminSearchValues(CAR_OWNER_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setCurrentPage(1);
    setSelectedRows(new Set());
  };

  const handleFormCancel = () => {
    setEditingOwner(null);
    setShowForm(false);
  };

  const handleFormSaved = () => {
    setEditingOwner(null);
    setShowForm(false);
    fetchOwners();
  };

  const fetchOwners = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await axios.get(`${API()}/api/admin/carowners`, { headers: getToken() });
      if (res.data?.success && Array.isArray(res.data.data)) setAllOwners(res.data.data);
      else {
        const msg = "Failed to fetch car owners";
        setError(msg);
        adminNotify.error(msg);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Something went wrong";
      setError(msg);
      adminNotify.error(msg);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOwners(); }, [fetchOwners]);

  const isOwnerDeleted = (o: CarOwnerType): boolean => {
    const status = String((o as any).status ?? "").toLowerCase();
    return status === "deleted" || Boolean((o as any).isDeleted) || Boolean((o as any).deleted);
  };
  const activeOwners = allOwners.filter((o) => !isOwnerDeleted(o));
  const deletedOwners = allOwners.filter((o) => isOwnerDeleted(o));

  // ── Use the right pool based on showDeleted toggle ──
  const displayOwners = showDeleted ? deletedOwners : activeOwners;

  const filtered = displayOwners.filter(o => {
    const q = search.toLowerCase();
    const statusRaw = (o.status ?? "active").toLowerCase();
    const statusLabel =
      statusRaw === "suspended" ? "Inactive" : statusRaw === "deleted" ? "Deleted" : "Active";
    const live =
      !q ||
      (o.name || "").toLowerCase().includes(q) ||
      (o.phone || "").toLowerCase().includes(q) ||
      (o.email || "").toLowerCase().includes(q) ||
      (o.city || "").toLowerCase().includes(q) ||
      String(getOwnerThoughtLikes(o)).includes(q);
    if (!live) return false;
    return (
      searchIncludes(o.name || "", searchFilters.name) &&
      searchIncludes(o.phone || "", searchFilters.phone) &&
      searchIncludes(o.email || "", searchFilters.email) &&
      searchIncludes(o.city || "", searchFilters.city) &&
      searchIncludes(o.address || "", searchFilters.address) &&
      searchIncludes(fmtDate(o.createdAt), searchFilters.date) &&
      searchIncludes(primaryVehicle(o)?.vinNo || "", searchFilters.vin) &&
      searchIncludes(String(getOwnerThoughtLikes(o)), searchFilters.likes) &&
      searchEquals(statusLabel, searchFilters.status)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = Array.from(selectedRows);
  const selCount = selected.length;
  const allPageSel = paginated.length > 0 && paginated.every(o => selectedRows.has(o._id));

  const handleToolbarPrint = () => {
    printOwnersTable(
      filtered,
      visibleCols,
      showDeleted ? "Deleted Car Owners" : "Car Owners"
    );
  };

  function toggleRow(id: string) { setSelectedRows(prev => { const c = new Set(prev); c.has(id) ? c.delete(id) : c.add(id); return c; }); }


  const [loginAsBusy, setLoginAsBusy] = useState(false);


  const { login} = useAuth();

  async function loginAsOwner(userId: string) {
    setLoginAsBusy(true);
    try {
      const res = await axios.post(
        `${API()}/api/auth/admin/loginas`,
        { userId },
        { headers: getToken() }
      );
      console.log("loginAsOwner response:", res);
      const { token } = res.data || {};
      if (!token) {
        console.log("No token returned from server. Response data:", res.data);
        adminNotify.error("No token returned from server.");
        return;
      }

      const backToSuperAdminToken = localStorage.getItem("admin-token");
      if (backToSuperAdminToken !== null) {
        localStorage.setItem("back-to-admin-token", backToSuperAdminToken);
      } else {
        localStorage.removeItem("back-to-admin-token");
      }
 

      login({ token:token, role: 'car_owner' });

         setTimeout(() => {
      window.location.href = getPostLoginRedirect('car_owner');
 
      }, 800);

      adminNotify.success("Opened owner session in a new tab.");
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Could not login as this car owner.";
      console.log("Error in loginAsOwner:", e, "Message:", msg);
      adminNotify.error(msg);
    } finally {
      setLoginAsBusy(false);
    }
  }

  async function toggleStatus(userId: string, status: "active" | "suspended" | "deleted") {
    try {
      await axios.put(
        `${API()}/api/admin/car-owner/${userId}/status/toggle`,
        { status },
        { headers: getToken() }
      );
      await fetchOwners();
      const labels: Record<string, string> = {
        active: "Car owner activated.",
        suspended: "Car owner set to inactive.",
        deleted: "Car owner deleted.",
      };
      adminNotify.success(labels[status] ?? "Status updated.");
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Error toggling status.";
      adminNotify.error(msg);
    }
  }

  // Column cell renderer
  function renderCell(owner: CarOwnerType, key: string) {
    const shops = owner.autoshopsReceivedServiceFrom ?? [];
    switch (key) {
      case "name": return <td key={key} className={`${tdClass} text-center font-medium`}><button type="button" onClick={() => openEdit(owner)} className="text-blue-700 hover:underline bg-transparent border-0 p-0 text-sm cursor-pointer font-semibold">{owner.name || "-"}</button></td>;
      case "phone": return <td key={key} className={tdClass}>{owner.phone || "-"}</td>;
      case "email": return <td key={key} className={tdClass}>{owner.email || "-"}</td>;
      case "city": return <td key={key} className={tdClass}>{owner.city || "-"}</td>;
      case "address": return <td key={key} className={`${tdClass} whitespace-normal break-words text-left align-top min-w-[240px]`}>{owner.address || "-"}</td>;
      case "date":
        return (
          <td key={key} className={`${tdClass} whitespace-nowrap`}>
            {fmtDate(owner.createdAt)}
          </td>
        );
      case "profilePhoto": {
        const img = ownerProfileImg(owner);
        console.log("profilePhoto image URL:", img);
        return (
          <td key={key} className={tdClass}>
            {img ? (
              <ClipImageHover
                imageUrl={`${API()}/${img}`}
                alt={`Profile image for ${owner.name}`}
                size={20}
                iconClassName="text-ad-purple"
              />
            ) : (
              "-"
            )}
          </td>
        );
      }
  
      
      case "documents": {
        const docs = ownerDocuments(owner);
        return (
          <td key={key} className={tdClass}>
            {docs.length > 0 ? (
              <button type="button" onClick={() => setDocumentsFor(owner)} className={linkClass}>
                {docs.length}
              </button>
            ) : (
              "-"
            )}
          </td>
        );
      }
      case "vin": return <td key={key} className={tdClass}>{primaryVehicle(owner)?.vinNo || "-"}</td>;
      case "vehicle": return <td key={key} className={tdClass}>{owner.myVehicles && owner.myVehicles.length > 0 ? <button type="button" onClick={() => setVehiclesFor(owner)} className={linkClass}>{owner.myVehicles.length}</button> : "-"}</td>;
      case "autoShops": return <td key={key} className={tdClass}>{shops.length > 0 ? <button type="button" onClick={() => setShopsFor(owner)} className={linkClass}>{shops.length}</button> : "-"}</td>;
      case "jobCard": return <td key={key} className={tdClass}>{owner.jobCards && owner.jobCards.length > 0 ? <button type="button" onClick={() => setJobCardsFor(owner)} className={linkClass}>{owner.jobCards.length}</button> : "-"}</td>;
      case "invoice": return <td key={key} className={tdClass}>{owner.jobCards && owner.jobCards.length > 0 ? <button type="button" className={linkClass}>{owner.jobCards.length}</button> : "0"}</td>;
      case "likes": return <td key={key} className={tdClass}>{getOwnerThoughtLikes(owner)}</td>;
      case "status": {
        let status = (owner.status ?? "active").toLowerCase();
        let bg = "#dff0d8", color = "#3c763d", border = "1px solid #d6e9c6", label = "Active";
        if (status === "suspended") {
          bg = "#ffe7ba"; color = "#b97b16"; border = "1px solid #ffe3bb"; label = "Inactive";
        } else if (status === "deleted") {
          bg = "#f2dede"; color = "#a94442"; border = "1px solid #ebcccc"; label = "Deleted";
        }
        return (
          <td key={key} className={tdClass}>
            <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 3, fontSize: 12, fontWeight: 600, background: bg, color, border }}>
              {label}
            </span>
          </td>
        );
      }
      default: return <td key={key} className={tdClass}>-</td>;
    }
  }

  const toolbarBtnClass = (disabled = false) =>
    `px-3 py-1 text-xs font-medium text-white whitespace-nowrap ${disabled ? "bg-gray-400 cursor-not-allowed" : "bg-gray-600 hover:bg-gray-700"}`;

  return (
    <>
      {/* ── MODALS ── */}
      {vehiclesFor && <VehiclesModal owner={vehiclesFor} onClose={() => setVehiclesFor(null)} />}
      {documentsFor && <DocumentsModal owner={documentsFor} onClose={() => setDocumentsFor(null)} />}
      {shopsFor && <AutoShopsModal owner={shopsFor} onClose={() => setShopsFor(null)} />}
      {jobCardsFor && <JobCardsModal owner={jobCardsFor} onClose={() => setJobCardsFor(null)} />}

      <SendNotifModal isOpen={notifOpen} onClose={() => setNotifOpen(false)} ids={selected} onDone={() => { }} />

      <AdminPage
        title={showDeleted ? "Deleted Car Owners" : "Car Owners"}
        headerAction={
          !showDeleted && !showForm && !showSearchCard ? (
            <AddNewButton onClick={openAdd} />
          ) : undefined
        }
        between={
          showSearchCard ? (
            <AdminSearchCard
              fields={CAR_OWNER_SEARCH_FIELDS}
              values={searchDraft}
              onChange={setSearchDraft}
              onSearch={handleSearchCardSearch}
              onReset={handleSearchCardReset}
              onClose={() => setShowSearchCard(false)}
            />
          ) : showForm ? (
            <CarOwnerAddEditForm
              key={editingOwner?._id ?? "new"}
              owner={editingOwner}
              onCancel={handleFormCancel}
              onSaved={handleFormSaved}
            />
          ) : undefined
        }
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
          <div className="flex flex-wrap gap-1">
            <button type="button" disabled={selCount === 0} onClick={() => setNotifOpen(true)} className={toolbarBtnClass(selCount === 0)}>
              Send Notification
            </button>
            <button type="button" disabled={selCount === 0} className={`bg-[#25d366] px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50`}>
              WhatsApp
            </button>
            <button type="button" disabled={selCount === 0} onClick={() => exportCsv(allOwners.filter(o => selectedRows.has(o._id)), visibleCols)} className={toolbarBtnClass(selCount === 0)}>
              Export
            </button>
            {!showDeleted && (
              <button
                type="button"
                disabled={selCount === 0}
                onClick={async () => {
                  const owner = allOwners.find(o => o._id === selected[0]);
                  if (!owner) return;
                  if (window.confirm(`Delete ${owner.name}?`)) {
                    await toggleStatus(selected[0], "deleted");
                    setSelectedRows(new Set());
                  }
                }}
                className={toolbarBtnClass(selCount === 0)}
              >
                Delete
              </button>
            )}
            {!showDeleted && (
  <button
    type="button"
    disabled={selCount !== 1 || loginAsBusy}
    onClick={() => {
      const owner = allOwners.find(o => o._id === selected[0]);
      if (!owner) return;
      if (window.confirm(`Login as ${owner.name}? This opens their account in a new tab.`)) {
        loginAsOwner(selected[0]);
      }
    }}
    className={toolbarBtnClass(selCount !== 1 || loginAsBusy)}
  >
    {loginAsBusy ? "Opening…" : "Login As"}
  </button>
)}
            {!showDeleted && (() => {
              const owner = selCount > 0 ? allOwners.find(o => o._id === selected[0]) : null;
              const isSuspended = owner?.status === "suspended";
              return (
                <button
                  type="button"
                  disabled={selCount === 0}
                  onClick={async () => {
                    if (!owner) return;
                    if (window.confirm(`Set ${owner.name} as ${isSuspended ? "Active" : "Inactive"}?`)) {
                      await toggleStatus(selected[0], isSuspended ? "active" : "suspended");
                      setSelectedRows(new Set());
                    }
                  }}
                  className={toolbarBtnClass(selCount === 0)}
                >
                  {isSuspended ? "Set Active" : "Set Inactive"}
                </button>
              );
            })()}
            {showDeleted && (
              <button
                type="button"
                disabled={selCount === 0}
                onClick={async () => {
                  const owner = allOwners.find(o => o._id === selected[0]);
                  if (!owner) return;
                  if (window.confirm(`Restore ${owner.name} as Active?`)) {
                    await toggleStatus(selected[0], "active");
                    setSelectedRows(new Set());
                  }
                }}
                className={toolbarBtnClass(selCount === 0)}
              >
                Restore
              </button>
            )}
            <button
              type="button"
              onClick={handleToolbarPrint}
              className="bg-ad-green px-3 py-1 text-xs font-medium text-white whitespace-nowrap hover:bg-ad-green-dark"
            >
              Print
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Live Search here"
              className="border border-gray-400 bg-white px-2 py-1 text-xs"
            />
            {selCount > 0 && <span className="text-xs font-semibold text-gray-600">{selCount} selected</span>}
            <ColSelector visible={visibleCols} onChange={setVisibleCols} />
            <button
              type="button"
              onClick={openSearchCard}
              className={`px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 ${
                showSearchCard ? "bg-gray-700" : "bg-gray-500"
              }`}
            >
              Filters
            </button>
          </div>
        </div>

        <div className="mb-2 flex items-center gap-2 text-xs text-gray-700">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="border border-gray-400 px-1 py-0.5"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span>entries</span>
        </div>

        {error && <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">Error: {error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-ad-purple text-white">
                <th className="border border-ad-purple-dark px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={allPageSel}
                    onChange={(e) => {
                      setSelectedRows((prev) => {
                        const c = new Set(prev);
                        paginated.forEach((o) => (e.target.checked ? c.add(o._id) : c.delete(o._id)));
                        return c;
                      });
                    }}
                    className="accent-white"
                  />
                </th>
                {ALL_COLUMNS.filter((c) => visibleCols.includes(c.key)).map((c) => (
                  <th key={c.key} className={thClass}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleCols.length + 1} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                    Loading car owners…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={visibleCols.length + 1} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                    Unable to load car owners.
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={visibleCols.length + 1} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                    {showDeleted ? "No deleted car owners found." : "No car owners found."}
                  </td>
                </tr>
              ) : (
                paginated.map((owner, idx) => (
                  <tr key={owner._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(owner._id)}
                        onChange={() => toggleRow(owner._id)}
                        className="accent-ad-purple"
                      />
                    </td>
                    {ALL_COLUMNS.filter((c) => visibleCols.includes(c.key)).map((c) => renderCell(owner, c.key))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
            <TableEntriesSummary total={filtered.length} page={currentPage} pageSize={pageSize} />
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`h-7 w-7 border text-xs font-medium ${currentPage === p
                      ? "border-ad-green bg-ad-green text-white"
                      : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowDeleted((prev) => !prev);
                setCurrentPage(1);
                setSelectedRows(new Set());
                setSearch("");
                const empty = emptyAdminSearchValues(CAR_OWNER_SEARCH_FIELDS);
                setSearchDraft(empty);
                setSearchFilters(empty);
                setShowSearchCard(false);
              }}
              className="text-sm text-blue-700 hover:underline"
            >
              {showDeleted ? "Active / Inactive Users" : "Deleted"}
            </button>
          </div>
      </AdminPage>
    </>
  );
};

export default CarOwners;
