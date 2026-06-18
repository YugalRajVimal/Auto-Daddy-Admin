

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

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
  licensePlateNo?: string; odometerReading?: number; carImages?: string[];
  licensePlateFrontImagePath?: string; licensePlateBackImagePath?: string;
  createdAt?: string; updatedAt?: string; status?: string; [key: string]: any;
};
type JobCardType = {
  _id: string; business: BusinessProfileType; jobNo?: string | number;
  paymentStatus?: string; totalPayableAmount?: number; services?: any[];
  vehicleId?: { licensePlateNo?: string }; customerId?: any;
  vehiclePhotos?: string[]; createdAt?: string; updatedAt?: string; [key: string]: any;
};
type CarOwnerType = {
  _id: string; name: string; email?: string; countryCode?: string; phone?: string;
  address?: string; pincode?: string; city?: string; status?: string;
  isProfileComplete?: boolean; isDisabled?: boolean; myVehicles?: VehicleType[];
  onboardedBy?: { _id: string; name?: string; email?: string } | null;
  favoriteAutoShops?: BusinessProfileType[];
  autoshopsReceivedServiceFrom?: BusinessProfileType[];
  jobCards?: JobCardType[]; profilePhoto?: string; profileImage?: string;
  createdAt?: string;
};

// ─── Column Config ───────────────────────────────────────────────────────────
const ALL_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "city", label: "City" },
  { key: "date", label: "Date" },
  { key: "vehicle", label: "Vehicle" },
  { key: "autoShops", label: "Auto Shops" },
  { key: "jobCard", label: "Job Card" },
  { key: "invoice", label: "Invoice" },
  { key: "status", label: "Status" },
];
const DEFAULT_VISIBLE = ["name", "phone", "city", "date", "vehicle", "autoShops", "jobCard", "status"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const API = () => import.meta.env.VITE_API_URL || "";
const UPLOADS = () => import.meta.env.VITE_UPLOADS_URL || "";
function mediaUrl(path?: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${UPLOADS()}/${path.replace(/^\/+/, "")}`;
}
function ownerProfileImg(o: CarOwnerType): string {
  return mediaUrl(o.profilePhoto ?? o.profileImage ?? "");
}
function fmtDate(d?: string): string {
  if (!d) return "-";
  return new Date(d).toISOString().slice(0, 10);
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
function getToken(): Record<string, string> {
  const t = localStorage.getItem("admin-token");
  return t ? { Authorization: t } : {};
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

// ─── PROFILE MODAL ─────────────────────────────────────────────────────────────
const ProfileModal: React.FC<{
  owner: CarOwnerType;
  onClose: () => void;
  onEdit: () => void;
  toggleStatus: (id: string, newStatus: string) => Promise<void>;
}> = ({ owner, onClose, onEdit, toggleStatus }) => {
  const vehicles = owner.myVehicles ?? [];
  const shops = owner.autoshopsReceivedServiceFrom ?? [];
  const cards = owner.jobCards ?? [];
  const favIds = new Set((owner.favoriteAutoShops ?? []).map(f => f._id));
  const imgSrc = ownerProfileImg(owner);

  function getStatusDisplay(status: string | undefined): string {
    if (!status || status === "active") return "Active";
    if (status === "suspended" || status === "inactive") return "Inactive";
    if (status === "deleted") return "Deleted";
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  const [statusLoading, setStatusLoading] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState(owner.status ?? "active");

  React.useEffect(() => {
    setCurrentStatus(owner.status ?? "active");
  }, [owner.status]);

  async function handleToggleStatus() {
    if (!owner._id) return;
    setStatusLoading(true);
    try {
      if (currentStatus === "deleted") { setStatusLoading(false); return; }
      const newStatus = currentStatus === "suspended" || currentStatus === "inactive" ? "active" : "suspended";
      await toggleStatus(owner._id, newStatus);
      setCurrentStatus(newStatus);
      setStatusLoading(false);
    } catch (e) {
      setStatusLoading(false);
      alert("Failed to update status.");
    }
  }

  const isDeleted = currentStatus === "deleted";

  return (
    <BaseModal isOpen wide onClose={onClose} title={`Profile — ${owner.name}`} maxW="min(820px,96vw)">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, border: "1px solid #c8e6b0", borderRadius: 14, overflow: "hidden" }}>
        {/* Left */}
        <div style={{ background: "#d4f5c4", padding: "24px 28px", borderRight: "1px solid #c8e6b0" }}>
          <GCRow label="Name" value={owner.name} />
          <GCRow label="E-mail" value={<a href={`mailto:${owner.email}`} style={{ color: "#0073b7" }}>{owner.email}</a>} />
          <GCRow label="Phone" value={`${owner.countryCode ?? ""} ${owner.phone ?? ""}`.trim() || undefined} />
          <GCRow label="City" value={owner.city} />
          <GCRow label="Address" value={owner.address} />
          <GCRow label="Zip Code" value={owner.pincode} />
          <div style={{ margin: "10px 0 4px", display: "flex", gap: 8 }}>
            <span style={GC_LABEL}>Vehicles</span>
            <span style={{ color: "#888", marginRight: 4 }}>:</span>
            <div>
              {vehicles.map((v) => (
                <div key={v._id} style={GC_VAL}>{getMakeName(v)}- {getMakeModel(v)}  - {v.year}</div>
              ))}
              {vehicles.length === 0 && <span style={GC_VAL}>—</span>}
            </div>
          </div>
          <div style={{ margin: "10px 0 4px", display: "flex", gap: 8 }}>
            <span style={GC_LABEL}>Auto Shop</span>
            <span style={{ color: "#888", marginRight: 4 }}>:</span>
            <div>
              {shops.map((s) => (
                <div key={s._id} style={{ ...GC_VAL, display: "flex", gap: 6, alignItems: "center" }}>
                  {s.businessName} - {s.city}
                  {favIds.has(s._id) && <span>❤️</span>}
                </div>
              ))}
              {shops.length === 0 && <span style={GC_VAL}>—</span>}
            </div>
          </div>
          <div style={{ margin: "10px 0 4px", display: "flex", gap: 8 }}>
            <span style={GC_LABEL}>Job Cards</span>
            <span style={{ color: "#888", marginRight: 4 }}>:</span>
            <div>
              {cards.map((c) => (
                <div key={c._id} style={GC_VAL}># {c.jobNo ?? c._id.slice(-5)}</div>
              ))}
              {cards.length === 0 && <span style={GC_VAL}>—</span>}
            </div>
          </div>
        </div>
        {/* Right */}
        <div style={{ background: "#d4f5c4", padding: "24px 28px" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>User account Login with</div>
          <GCRow label="Mobile" value={owner.phone} />
          <GCRow
            label="Status"
            value={
              <span style={{
                color: currentStatus === "active" ? "#1A6E1A" : currentStatus === "suspended" || currentStatus === "inactive" ? "#c77f0d" : currentStatus === "deleted" ? "#b71818" : "#222",
                fontWeight: 600, textTransform: "capitalize",
              }}>
                {getStatusDisplay(currentStatus)}
              </span>
            }
          />
          <GCRow label="Joining Date" value={fmtDate(owner.createdAt)} />
          <GCRow label="URL" value={
            <a 
              href={`https://autodaddy.ca/user`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: "#0073b7", textDecoration: "underline" }}
            >
              https://autodaddy.ca/user
            </a>
          } />
     
          <div style={{ marginTop: 14 }}>
            <span style={GC_LABEL}>Image</span>
            <div style={{ display: "inline-flex", marginLeft: 18, border: "1px solid #bbb", background: "#fff", width: 120, height: 120, borderRadius: 6, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
              {imgSrc ? <img src={imgSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
            </div>
          </div>
          <div style={{ marginTop: 24, display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" onClick={onEdit} style={{ background: "#1a6e1a", color: "#fff", border: "none", borderRadius: 4, padding: "8px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer", marginRight: 10 }} disabled={statusLoading}>
              Update
            </button>
            <button
              type="button"
              onClick={handleToggleStatus}
              style={{
                background: isDeleted ? "#888" : currentStatus === "suspended" || currentStatus === "inactive" ? "#1a6e1a" : "#d32f2f",
                color: "#fff", border: "none", borderRadius: 4, padding: "8px 24px", fontWeight: 700, fontSize: 14,
                cursor: isDeleted ? "not-allowed" : statusLoading ? "not-allowed" : "pointer",
                opacity: statusLoading || isDeleted ? 0.7 : 1,
              }}
              disabled={statusLoading || isDeleted}
            >
              {isDeleted ? "Deleted" : statusLoading ? "Updating..." : currentStatus === "suspended" || currentStatus === "inactive" ? "Set Active" : "Set Inactive"}
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

// ─── PRINT PAGE ───────────────────────────────────────────────────────────────
function printOwner(owner: CarOwnerType) {
  const vehicles = owner.myVehicles ?? [];
  const shops = owner.autoshopsReceivedServiceFrom ?? [];
  const cards = owner.jobCards ?? [];
  const favIds = new Set((owner.favoriteAutoShops ?? []).map(f => f._id));
  const imgSrc = ownerProfileImg(owner);

  const row = (label: string, value: string) =>
    `<tr><td style="font-weight:600;padding:4px 12px 4px 0;width:120px;vertical-align:top">${label}</td><td style="padding:4px 0;color:#333">: ${value || "—"}</td></tr>`;

  const vehicleRows = vehicles.map(v => `<tr><td></td><td style="padding:2px 0">: ${getMakeName(v)}- ${getMakeModel(v)}  - ${v.year ?? ""}</td></tr>`).join("");
  const shopRows = shops.map(s => `<tr><td></td><td style="padding:2px 0">: ${s.businessName} - ${s.city ?? ""}${favIds.has(s._id) ? " ❤️" : ""}</td></tr>`).join("");
  const cardRows = cards.map(c => `<tr><td></td><td style="padding:2px 0">: # ${c.jobNo ?? c._id.slice(-5)}</td></tr>`).join("");

  const html = `<!DOCTYPE html><html><head><title>Print - ${owner.name}</title>
<style>body{font-family:sans-serif;padding:30px}h2{font-weight:700;margin-bottom:16px}
.card{background:#d4f5c4;border-radius:14px;padding:22px 28px;display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #b2e0a0}
.left{border-right:1px solid #b2e0a0;padding-right:24px}.right{padding-left:24px}
table{border-collapse:collapse;font-size:14px}a{color:#0073b7}
.btn{background:#1a6e1a;color:#fff;border:none;border-radius:4px;padding:8px 24px;font-size:14px;font-weight:700;cursor:pointer;margin-right:8px}
.btn-xl{background:#0073b7}img{border:1px solid #ccc;border-radius:4px}
@media print{.noprint{display:none}}
</style></head><body>
<h2>Print Page</h2>
<div class="card">
  <div class="left">
    <table>
      ${row("Name", owner.name)}
      ${row("E-mail", `<a href="mailto:${owner.email}">${owner.email ?? ""}</a>`)}
      ${row("Phone", `${owner.countryCode ?? ""} ${owner.phone ?? ""}`.trim())}
      ${row("City", `${owner.city ?? ""}`)}
      ${row("Address", owner.address ?? "")}
      ${row("Zip Code", owner.pincode ?? "")}
      <tr><td style="font-weight:600;padding:4px 12px 4px 0;vertical-align:top">Vehicles</td><td></td></tr>
      ${vehicleRows}
      <tr><td style="font-weight:600;padding:4px 12px 4px 0;vertical-align:top">Auto Shop</td><td></td></tr>
      ${shopRows}
      <tr><td style="font-weight:600;padding:4px 12px 4px 0;vertical-align:top">Job Cards</td><td></td></tr>
      ${cardRows}
    </table>
  </div>
  <div class="right">
    <div style="font-weight:700;font-size:16px;margin-bottom:14px">User account Login with</div>
    <table>
      ${row("Mobile", owner.phone ?? "")}
      ${row("Status", owner.status ?? "Active")}
      ${row("Joining Date", fmtDate(owner.createdAt))}
      ${row("URL", "https://autodaddy.ca/user/")}
    </table>
    <div style="margin-top:14px;font-weight:600;font-size:13px">Image :</div>
    <div style="margin-top:6px;background:#fff;border:1px solid #ccc;width:140px;height:140px;border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center">
      ${imgSrc ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover" />` : ""}
    </div>
    <div style="margin-top:24px" class="noprint">
      <button class="btn" onclick="window.print()">Print</button>
      <button class="btn btn-xl" onclick="exportXL()">Export XL</button>
    </div>
  </div>
</div>
<script>
function exportXL() {
  const data = ${JSON.stringify({
    Name: owner.name, Email: owner.email, Phone: `${owner.countryCode ?? ""} ${owner.phone ?? ""}`.trim(),
    City: owner.city, Address: owner.address, Pincode: owner.pincode, Status: owner.status ?? "Active",
    Vehicles: vehicles.map(v => `${getMakeName(v)} ${getMakeModel(v)} ${v.year ?? ""}`).join("; "),
    AutoShops: shops.map(s => s.businessName).join("; "),
    JobCards: cards.map(c => `#${c.jobNo ?? c._id.slice(-5)}`).join("; "),
  })};
  const rows = [Object.keys(data), Object.values(data)];
  const csv = rows.map(r => r.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\\n");
  const a = document.createElement("a"); a.href = "data:text/csv," + encodeURIComponent(csv);
  a.download = "carowner-${owner.name.replace(/\s+/g, "-")}.csv"; a.click();
}
</script>
</body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

// ─── ADD/EDIT MODAL ───────────────────────────────────────────────────────────
type VehicleFormRow = {
  _id?: string; licensePlateNo: string; vinNo: string; vehicleName: string;
  model: string; year: string; odometerReading: string;
  vehicleImageFile: File | null; vehicleImagePreview: string;
};
function emptyVehicle(): VehicleFormRow {
  return { licensePlateNo: "", vinNo: "", vehicleName: "", model: "", year: "", odometerReading: "", vehicleImageFile: null, vehicleImagePreview: "" };
}
const CALLING_CODES = [
  { id: "CA", flag: "🇨🇦", code: "+1" }, { id: "US", flag: "🇺🇸", code: "+1" },
  { id: "GB", flag: "🇬🇧", code: "+44" }, { id: "IN", flag: "🇮🇳", code: "+91" }, { id: "AU", flag: "🇦🇺", code: "+61" },
];
function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }
const iStyle: React.CSSProperties = { width: "100%", border: "1px solid #d2d6de", borderRadius: 3, padding: "7px 10px", fontSize: 13, outline: "none", boxSizing: "border-box", color: "#333", background: "#fff" };
const lStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4, color: "#555", textTransform: "uppercase", letterSpacing: "0.04em" };

function VehicleRowForm({ v, i, attempted, onChange, onRemove, canRemove }: {
  v: VehicleFormRow; i: number; attempted: boolean;
  onChange: (p: Partial<VehicleFormRow>) => void; onRemove: () => void; canRemove: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div style={{ border: "1px solid #d2d6de", borderRadius: 4, padding: "12px 14px", background: "#f9fafc", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#9b308d" }}>Vehicle #{i + 1}</span>
        {canRemove && <button type="button" onClick={onRemove} style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✕ Remove</button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px" }}>
        <div>
          <label style={lStyle}>License Plate *</label>
          <input style={iStyle} value={v.licensePlateNo} onChange={e => onChange({ licensePlateNo: e.target.value.slice(0, 14) })} placeholder="e.g. ABC 1234" />
          {attempted && !v.licensePlateNo.trim() && <p style={{ color: "#c0392b", fontSize: 11, margin: "2px 0 0", fontWeight: 600 }}>Required</p>}
        </div>
        <div>
          <label style={lStyle}>VIN (17 chars)</label>
          <input style={iStyle} value={v.vinNo} onChange={e => onChange({ vinNo: e.target.value.slice(0, 17).toUpperCase() })} placeholder="17-char VIN" maxLength={17} />
          {attempted && v.vinNo && v.vinNo.length !== 17 && <p style={{ color: "#c0392b", fontSize: 11, margin: "2px 0 0", fontWeight: 600 }}>Must be 17 chars</p>}
        </div>
        <div>
          <label style={lStyle}>Make *</label>
          <input style={iStyle} value={v.vehicleName} onChange={e => onChange({ vehicleName: e.target.value })} placeholder="e.g. Toyota" />
        </div>
        <div>
          <label style={lStyle}>Model *</label>
          <input style={iStyle} value={v.model} onChange={e => onChange({ model: e.target.value })} placeholder="e.g. Camry" />
        </div>
        <div>
          <label style={lStyle}>Year *</label>
          <input style={iStyle} value={v.year} onChange={e => onChange({ year: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="e.g. 2020" maxLength={4} />
        </div>
        <div>
          <label style={lStyle}>Odometer (km)</label>
          <input style={iStyle} value={v.odometerReading} onChange={e => onChange({ odometerReading: e.target.value.replace(/\D/g, "") })} placeholder="e.g. 45000" />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={lStyle}>Vehicle Image</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {v.vehicleImagePreview && <img src={v.vehicleImagePreview} alt="" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 3, border: "1px solid #d2d6de" }} />}
            <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
              const file = e.target.files?.[0]; if (!file) return;
              if (v.vehicleImagePreview?.startsWith("blob:")) URL.revokeObjectURL(v.vehicleImagePreview);
              onChange({ vehicleImageFile: file, vehicleImagePreview: URL.createObjectURL(file) });
            }} />
            <button type="button" onClick={() => ref.current?.click()} style={{ padding: "6px 14px", border: "1px solid #d2d6de", borderRadius: 3, background: "#fff", color: "#555", fontSize: 12, cursor: "pointer" }}>
              {v.vehicleImagePreview ? "Change" : "Upload"}
            </button>
            {v.vehicleImagePreview && (
              <button type="button" onClick={() => { if (v.vehicleImagePreview?.startsWith("blob:")) URL.revokeObjectURL(v.vehicleImagePreview); onChange({ vehicleImageFile: null, vehicleImagePreview: "" }); if (ref.current) ref.current.value = ""; }} style={{ padding: "6px 10px", border: "1px solid #d2d6de", borderRadius: 3, background: "#fff", color: "#e74c3c", fontSize: 12, cursor: "pointer" }}>Remove</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const AddEditModal: React.FC<{ isOpen: boolean; onClose: () => void; onSaved: () => void; owner?: CarOwnerType | null; mode: "add" | "edit" }> = ({ isOpen, onClose, onSaved, owner, mode }) => {
  const isEdit = mode === "edit";
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [dialCode, setDialCode] = useState("+1"); const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState(""); const [address, setAddress] = useState("");
  const [city, setCity] = useState(""); const [vehicles, setVehicles] = useState<VehicleFormRow[]>([emptyVehicle()]);
  const [profileFile, setProfileFile] = useState<File | null>(null); const [profilePreview, setProfilePreview] = useState("");
  const [submitting, setSubmitting] = useState(false); const [attempted, setAttempted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const pRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setAttempted(false); setApiError(null);
    if (isEdit && owner) {
      setName(owner.name || ""); setEmail(owner.email || ""); setDialCode(owner.countryCode || "+1");
      setPhone(owner.phone || ""); setPincode(owner.pincode || ""); setAddress(owner.address || "");
      setCity(owner.city || ""); setProfileFile(null); setProfilePreview(ownerProfileImg(owner));
      setVehicles((owner.myVehicles ?? []).map(v => ({
        _id: v._id, licensePlateNo: v.licensePlateNo || "", vinNo: v.vinNo || "",
        vehicleName: getMakeName(v) === "-" ? "" : getMakeName(v),
        model: getMakeModel(v) === "-" ? "" : getMakeModel(v),
        year: v.year ? String(v.year) : "", odometerReading: v.odometerReading != null ? String(v.odometerReading) : "",
        vehicleImageFile: null, vehicleImagePreview: Array.isArray(v.carImages) && v.carImages[0] ? mediaUrl(v.carImages[0]) : "",
      })) || [emptyVehicle()]);
    } else {
      setName(""); setEmail(""); setDialCode("+1"); setPhone(""); setPincode(""); setAddress(""); setCity("");
      setProfileFile(null); setProfilePreview(""); setVehicles([emptyVehicle()]);
    }
  }, [isOpen, isEdit, owner]);

  function validate(): string | null {
    if (!name.trim()) return "Name is required.";
    if (!email.trim() || !isValidEmail(email)) return "Valid email required.";
    if (phone.replace(/\D/g, "").length !== 10) return "Phone must be 10 digits.";
    if (!pincode.trim()) return "Zip code required.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setAttempted(true);
    const err = validate(); if (err) { setApiError(err); return; }
    setApiError(null);
    const filled = vehicles.filter(v => v.licensePlateNo.trim() || v.vehicleName.trim());
    const fd = new FormData();
    if (isEdit && owner) fd.append("carOwnerId", owner._id);
    fd.append("name", name.trim()); fd.append("email", email.trim());
    fd.append("countryCode", dialCode); fd.append("phone", phone.replace(/\D/g, ""));
    fd.append("pincode", pincode.trim().replace(/\s/g, "").toUpperCase());
    fd.append("address", address.trim().slice(0, 50));
    if (city.trim()) fd.append("city", city.trim());
    if (!isEdit) fd.append("role", "carowner");
    fd.append("vehicles", JSON.stringify(filled.map(v => ({ ...(v._id ? { _id: v._id } : {}), licensePlateNo: v.licensePlateNo.trim(), vinNo: v.vinNo.trim(), vehicleName: v.vehicleName.trim(), model: v.model.trim(), year: v.year.trim(), odometerReading: v.odometerReading.trim() }))));
    if (profileFile) fd.append("profilePhoto", profileFile, profileFile.name);
    filled.forEach((v, idx) => { if (v.vehicleImageFile) fd.append(`carImage_${idx}`, v.vehicleImageFile, v.vehicleImageFile.name); });
    setSubmitting(true);
    try {
      if (isEdit) await axios.put(`${API()}/api/admin/my-customers`, fd, { headers: getToken() });
      else await axios.post(`${API()}/api/admin/onboard-carowner`, fd, { headers: getToken() });
      onSaved(); onClose();
    } catch (err: any) {
      setApiError(err?.response?.data?.message || (isEdit ? "Could not update." : "Could not add."));
    } finally { setSubmitting(false); }
  }

  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", background: "rgba(0,0,0,0.48)", overflowY: "auto", padding: "30px 12px" }}>
      <div style={{ background: "#fff", borderRadius: 4, width: "min(960px,96vw)", boxShadow: "0 8px 32px rgba(0,0,0,0.22)" }}>
        <div style={{ background: "#9b308d", color: "#fff", padding: "13px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "4px 4px 0 0" }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{isEdit ? "✏️ Edit Car Owner" : "➕ Add New Car Owner"}</span>
          <button onClick={onClose} disabled={submitting} type="button" style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "22px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#9b308d", borderBottom: "2px solid #9b308d", paddingBottom: 6, marginBottom: 16, textTransform: "uppercase" }}>Personal Information</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid #d2d6de", background: "#e3f2fd", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {profilePreview ? <img src={profilePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 20, color: "#90caf9", fontWeight: 700 }}>?</span>}
            </div>
            <div>
              <label style={lStyle}>Profile Photo</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input ref={pRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (!f) return; if (profilePreview?.startsWith("blob:")) URL.revokeObjectURL(profilePreview); setProfileFile(f); setProfilePreview(URL.createObjectURL(f)); }} />
                <button type="button" onClick={() => pRef.current?.click()} style={{ padding: "6px 14px", border: "1px solid #d2d6de", borderRadius: 3, background: "#fff", color: "#555", fontSize: 12, cursor: "pointer" }}>{profilePreview ? "Change" : "Upload"}</button>
                {profilePreview && <button type="button" onClick={() => { if (profilePreview?.startsWith("blob:")) URL.revokeObjectURL(profilePreview); setProfileFile(null); setProfilePreview(""); if (pRef.current) pRef.current.value = ""; }} style={{ padding: "6px 10px", border: "1px solid #d2d6de", borderRadius: 3, background: "#fff", color: "#e74c3c", fontSize: 12, cursor: "pointer" }}>Remove</button>}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", marginBottom: 20 }}>
            <div><label style={lStyle}>Full Name *</label><input style={iStyle} value={name} onChange={e => setName(e.target.value.slice(0, 20))} placeholder="Enter full name" />{attempted && !name.trim() && <p style={{ color: "#c0392b", fontSize: 11, margin: "2px 0 0", fontWeight: 600 }}>Required</p>}</div>
            <div><label style={lStyle}>Email *</label><input style={iStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email" />{attempted && !isValidEmail(email) && <p style={{ color: "#c0392b", fontSize: 11, margin: "2px 0 0", fontWeight: 600 }}>Valid email required</p>}</div>
            <div><label style={lStyle}>Phone *</label><div style={{ display: "flex", gap: 6 }}><select value={dialCode} onChange={e => setDialCode(e.target.value)} style={{ ...iStyle, width: 100, flexShrink: 0 }}>{CALLING_CODES.map(c => <option key={c.id + c.code} value={c.code}>{c.flag} {c.code}</option>)}</select><input style={{ ...iStyle, flex: 1 }} type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" /></div>{attempted && phone.replace(/\D/g, "").length !== 10 && <p style={{ color: "#c0392b", fontSize: 11, margin: "2px 0 0", fontWeight: 600 }}>Must be 10 digits</p>}</div>
            <div><label style={lStyle}>Zip / Postal Code *</label><input style={iStyle} value={pincode} onChange={e => setPincode(e.target.value.slice(0, 10))} placeholder="e.g. A1A 1A1" />{attempted && !pincode.trim() && <p style={{ color: "#c0392b", fontSize: 11, margin: "2px 0 0", fontWeight: 600 }}>Required</p>}</div>
            <div><label style={lStyle}>City</label><input style={iStyle} value={city} onChange={e => setCity(e.target.value)} placeholder="Enter city" /></div>
            <div><label style={lStyle}>Role</label><div style={{ ...iStyle, background: "#f5f6f8", color: "#888", fontWeight: 600, cursor: "default" }}>carowner</div></div>
            <div style={{ gridColumn: "1/-1" }}><label style={lStyle}>Address</label><textarea style={{ ...iStyle, minHeight: 60, resize: "vertical", fontFamily: "inherit" }} value={address} onChange={e => setAddress(e.target.value.slice(0, 50))} placeholder="Max 50 chars" rows={2} /></div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#9b308d", borderBottom: "2px solid #9b308d", paddingBottom: 6, marginBottom: 14, textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Vehicles</span>
            {vehicles.length < 5 && <button type="button" onClick={() => setVehicles(v => [...v, emptyVehicle()])} style={{ fontSize: 12, background: "#9b308d", color: "#fff", border: "none", borderRadius: 3, padding: "4px 12px", cursor: "pointer", fontWeight: 600 }}>+ Add Vehicle</button>}
          </div>
          {vehicles.map((v, i) => (
            <VehicleRowForm key={i} v={v} i={i} attempted={attempted} onChange={patch => setVehicles(prev => { const n = [...prev]; n[i] = { ...n[i], ...patch }; return n; })} onRemove={() => setVehicles(prev => prev.filter((_, idx) => idx !== i))} canRemove={vehicles.length > 1} />
          ))}
          {apiError && <div style={{ marginTop: 10, padding: "9px 14px", background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, color: "#c0392b", fontSize: 13 }}>{apiError}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid #f4f4f4" }}>
            <button type="button" onClick={onClose} disabled={submitting} style={{ padding: "8px 22px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#555", fontSize: 14, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ padding: "8px 26px", borderRadius: 3, border: "none", background: submitting ? "#aaa" : "#00a65a", color: "#fff", fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer" }}>{submitting ? "Saving…" : isEdit ? "Save Changes" : "Add Car Owner"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── SEND NOTIFICATION ────────────────────────────────────────────────────────
const SendNotifModal: React.FC<{ isOpen: boolean; onClose: () => void; ids: string[]; onDone: () => void }> = ({ isOpen, onClose, ids, onDone }) => {
  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [sending, setSending] = useState(false); const [err, setErr] = useState<string | null>(null); const [ok, setOk] = useState<string | null>(null);
  useEffect(() => { if (isOpen) { setTitle(""); setBody(""); setSending(false); setErr(null); setOk(null); } }, [isOpen]);
  if (!isOpen) return null;
  return (
    <BaseModal isOpen onClose={onClose} title="Send Custom Notification">
      <form onSubmit={async e => {
        e.preventDefault(); if (!title.trim() || !body.trim()) { setErr("Title and body required."); return; }
        setSending(true); setErr(null);
        try {
          const res = await axios.post(`${API()}/api/admin/notification/custom/send`, { userType: "carOwner", userIds: ids, title, message: body });
          if (res.data?.success) { setOk("Sent!"); setTimeout(() => { onClose(); onDone(); }, 900); }
          else setErr(res.data?.message || "Failed.");
        } catch (e: any) { setErr(e?.response?.data?.message || "Error."); } finally { setSending(false); }
      }}>
        <div style={{ marginBottom: 12 }}><label style={lStyle}>Title *</label><input style={iStyle} value={title} onChange={e => setTitle(e.target.value)} maxLength={100} disabled={sending} /></div>
        <div style={{ marginBottom: 12 }}><label style={lStyle}>Body *</label><textarea style={{ ...iStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }} value={body} onChange={e => setBody(e.target.value)} rows={3} disabled={sending} /></div>
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
  const colMap: Record<string, (o: CarOwnerType) => string> = {
    name: o => o.name || "-",
    phone: o => o.phone || "-",
    city: o => o.city || "-",
    date: o => fmtDate(o.createdAt),
    vehicle: o => (o.myVehicles ?? []).map(v => `${getMakeName(v)} ${getMakeModel(v)} ${v.year ?? ""}`).join("; ") || "-",
    autoShops: o => (o.autoshopsReceivedServiceFrom ?? []).map(s => s.businessName).join("; ") || "-",
    jobCard: o => (o.jobCards ?? []).map(c => `#${c.jobNo ?? c._id.slice(-5)}`).join("; ") || "-",
    invoice: () => "-",
    status: o => o.status ?? "Active",
  };
  const cols = ALL_COLUMNS.filter(c => visibleCols.includes(c.key));
  const esc = (v: string) => /[,"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  const header = cols.map(c => esc(c.label)).join(",");
  const rows = owners.map(o => cols.map(c => esc(colMap[c.key]?.(o) ?? "-")).join(",")).join("\n");
  const blob = new Blob([header + "\n" + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `car-owners-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ─── STYLE CONSTANTS ──────────────────────────────────────────────────────────
const thS: React.CSSProperties = { border: "1px solid #d2d6de", background: "#f9fafc", padding: "9px 12px", textAlign: "left", fontWeight: 700, fontSize: 13, color: "#333", whiteSpace: "nowrap" };
const tdS: React.CSSProperties = { border: "1px solid #d2d6de", padding: "9px 12px", fontSize: 13, color: "#555", verticalAlign: "middle" };
const linkBtn: React.CSSProperties = { background: "none", border: "none", color: "#0073b7", cursor: "pointer", padding: 0, fontSize: 12, textDecoration: "underline", fontWeight: 500 };
const pageBtn = (active: boolean, disabled: boolean): React.CSSProperties => ({ border: "1px solid", borderColor: active ? "#0073b7" : "#ddd", background: active ? "#0073b7" : "#fff", color: active ? "#fff" : disabled ? "#bbb" : "#777", padding: "6px 13px", fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", marginLeft: -1 });

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const CarOwners: React.FC = () => {
  const [allOwners, setAllOwners] = useState<CarOwnerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_VISIBLE);

  // ── NEW: toggle between active/inactive view and deleted view ──
  const [showDeleted, setShowDeleted] = useState(false);

  // Modal states
  const [vehiclesFor, setVehiclesFor] = useState<CarOwnerType | null>(null);
  const [shopsFor, setShopsFor] = useState<CarOwnerType | null>(null);
  const [jobCardsFor, setJobCardsFor] = useState<CarOwnerType | null>(null);
  const [profileFor, setProfileFor] = useState<CarOwnerType | null>(null);
  const [addEdit, setAddEdit] = useState<{ open: boolean; mode: "add" | "edit"; owner: CarOwnerType | null }>({ open: false, mode: "add", owner: null });
  const [notifOpen, setNotifOpen] = useState(false);

  const fetchOwners = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await axios.get(`${API()}/api/admin/carowners`, { headers: getToken() });
      console.log(res.data.data);
      if (res.data?.success && Array.isArray(res.data.data)) setAllOwners(res.data.data);
      else setError("Failed to fetch car owners");
    } catch (e: any) { setError(e?.response?.data?.message || "Something went wrong"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOwners(); }, [fetchOwners]);

  const activeOwners = allOwners.filter(o => o.status !== "deleted");
  const deletedOwners = allOwners.filter(o => o.status === "deleted");

  // ── Use the right pool based on showDeleted toggle ──
  const displayOwners = showDeleted ? deletedOwners : activeOwners;

  const filtered = displayOwners.filter(o => {
    const q = search.toLowerCase();
    return (o.name || "").toLowerCase().includes(q) || (o.phone || "").toLowerCase().includes(q) || (o.email || "").toLowerCase().includes(q) || (o.city || "").toLowerCase().includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = Array.from(selectedRows);
  const selCount = selected.length;
  const allPageSel = paginated.length > 0 && paginated.every(o => selectedRows.has(o._id));

  function toggleRow(id: string) { setSelectedRows(prev => { const c = new Set(prev); c.has(id) ? c.delete(id) : c.add(id); return c; }); }

  async function toggleStatus(userId: string, status: "active" | "suspended" | "deleted") {
    try {
      await axios.put(
        `${API()}/api/admin/car-owner/${userId}/status/toggle`,
        { status },
        { headers: getToken() }
      );
      await fetchOwners();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Error toggling status.");
    }
  }

  // Column cell renderer
  function renderCell(owner: CarOwnerType, key: string) {
    const shops = owner.autoshopsReceivedServiceFrom ?? [];
    switch (key) {
      case "name": return <td key={key} style={{ ...tdS, fontWeight: 500 }}><button type="button" onClick={() => setProfileFor(owner)} style={{ ...linkBtn, color: "#8a00d4", fontWeight: 600, fontSize: 13 }}>{owner.name || "-"}</button></td>;
      case "phone": return <td key={key} style={tdS}>{owner.phone || "-"}</td>;
      case "city": return <td key={key} style={tdS}>{owner.city || "-"}</td>;
      case "date": return <td key={key} style={tdS}>{fmtDate(owner.createdAt)}</td>;
      case "vehicle": return <td key={key} style={tdS}>{owner.myVehicles && owner.myVehicles.length > 0 ? <button type="button" onClick={() => setVehiclesFor(owner)} style={linkBtn}>{owner.myVehicles.length}</button> : "-"}</td>;
      case "autoShops": return <td key={key} style={tdS}>{shops.length > 0 ? <button type="button" onClick={() => setShopsFor(owner)} style={linkBtn}>{shops.length}</button> : "-"}</td>;
      case "jobCard": return <td key={key} style={tdS}>{owner.jobCards && owner.jobCards.length > 0 ? <button type="button" onClick={() => setJobCardsFor(owner)} style={linkBtn}>{owner.jobCards.length}</button> : "-"}</td>;
      case "invoice": return <td key={key} style={tdS}>{owner.jobCards && owner.jobCards.length > 0 ? <button type="button" style={linkBtn}>{owner.jobCards.length}</button> : "0"}</td>;
      case "status": {
        let status = (owner.status ?? "active").toLowerCase();
        let bg = "#dff0d8", color = "#3c763d", border = "1px solid #d6e9c6", label = "Active";
        if (status === "suspended") {
          bg = "#ffe7ba"; color = "#b97b16"; border = "1px solid #ffe3bb"; label = "Inactive";
        } else if (status === "deleted") {
          bg = "#f2dede"; color = "#a94442"; border = "1px solid #ebcccc"; label = "Deleted";
        }
        return (
          <td key={key} style={tdS}>
            <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 3, fontSize: 12, fontWeight: 600, background: bg, color, border }}>
              {label}
            </span>
          </td>
        );
      }
      default: return <td key={key} style={tdS}>-</td>;
    }
  }

  const toolbarBtn = (label: string, bg: string, onClick: () => void, disabled = false) => (
    <button type="button" onClick={onClick} disabled={disabled} style={{ padding: "6px 14px", borderRadius: 2, border: "1px solid rgba(0,0,0,0.2)", fontSize: 13, background: disabled ? "#bbb" : bg, color: "#fff", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );

  return (
    <>
      {/* ── MODALS ── */}
      {vehiclesFor && <VehiclesModal owner={vehiclesFor} onClose={() => setVehiclesFor(null)} />}
      {shopsFor && <AutoShopsModal owner={shopsFor} onClose={() => setShopsFor(null)} />}
      {jobCardsFor && <JobCardsModal owner={jobCardsFor} onClose={() => setJobCardsFor(null)} />}
      {profileFor && (
        <ProfileModal
          owner={profileFor}
          onClose={() => setProfileFor(null)}
          onEdit={() => { setAddEdit({ open: true, mode: "edit", owner: profileFor }); setProfileFor(null); }}
          toggleStatus={(id, newStatus) =>
            toggleStatus(id, newStatus as "active" | "suspended" | "deleted")
          }
        />
      )}


      <AddEditModal isOpen={addEdit.open} onClose={() => setAddEdit(s => ({ ...s, open: false }))} onSaved={() => { setAddEdit(s => ({ ...s, open: false })); fetchOwners(); }} owner={addEdit.owner} mode={addEdit.mode} />
      <SendNotifModal isOpen={notifOpen} onClose={() => setNotifOpen(false)} ids={selected} onDone={() => {}} />

      {/* ── PAGE ── */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-ad-app-bg py-4 md:py-5 font-sans">

        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2c8c2c", margin: 0 }}>
            {showDeleted ? "Deleted Car Owners" : "Car Owners"}
          </h1>
          {/* Only show Add New button when not in deleted view */}
          {!showDeleted && (
            <button
              onClick={() => setAddEdit({ open: true, mode: "add", owner: null })}
              style={{ background: "#00a65a", color: "#fff", padding: "8px 18px", borderRadius: 4, border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer" }}
            >
              + Add New
            </button>
          )}
        </div>

        <div className="mb-4" style={{ background: "#fff", border: "1px solid #d2d6de", borderRadius: 3, boxShadow: "0 1px 1px rgba(0,0,0,.1)" }}>
          {/* ── Toolbar ── */}
          <div style={{ padding: "8px 14px", background: "#d2d6de", borderBottom: "1px solid #bbb", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {/* Always visible */}
            {toolbarBtn("✉ Send Notification", "#555", () => { if (!selCount) { alert("Select at least one."); return; } setNotifOpen(true); }, false)}
            {toolbarBtn("WhatsApp", "#25d366", () => {}, false)}
            {toolbarBtn("↓ Export XL", "#555", () => { if (!selCount) { alert("Select at least one."); return; } exportCsv(allOwners.filter(o => selectedRows.has(o._id)), visibleCols); }, false)}

            {/* Active/Inactive view actions — hidden in deleted view */}
            {!showDeleted && selCount === 1 && toolbarBtn("Update", "#555", () => { const o = allOwners.find(x => x._id === selected[0]); if (o) setAddEdit({ open: true, mode: "edit", owner: o }); })}
            {!showDeleted && selCount === 1 && toolbarBtn("🗑 Delete", "#e74c3c", async () => {
              const owner = allOwners.find(o => o._id === selected[0]);
              if (!owner) return;
              if (window.confirm(`Delete ${owner.name}?`)) {
                await toggleStatus(selected[0], "deleted");
                setSelectedRows(new Set());
              }
            })}
            {!showDeleted && selCount === 1 && (() => {
              const owner = allOwners.find(o => o._id === selected[0]);
              if (!owner) return null;
              if (owner.status === "suspended") {
                return toolbarBtn("▶ Set Active", "#27ae60", async () => {
                  if (window.confirm(`Set ${owner.name} as Active?`)) {
                    await toggleStatus(selected[0], "active");
                    setSelectedRows(new Set());
                  }
                });
              } else {
                return toolbarBtn("⏸ Set Inactive", "#b97b16", async () => {
                  if (window.confirm(`Set ${owner.name} as Inactive?`)) {
                    await toggleStatus(selected[0], "suspended");
                    setSelectedRows(new Set());
                  }
                });
              }
            })()}
       
            {!showDeleted && selCount === 1 && toolbarBtn("🖨 Print", "#00c0ef", () => { const o = allOwners.find(x => x._id === selected[0]); if (o) printOwner(o); })}

            {/* Deleted view action — restore */}
            {showDeleted && selCount === 1 && toolbarBtn("♻️ Restore Active", "#27ae60", async () => {
              const owner = allOwners.find(o => o._id === selected[0]);
              if (!owner) return;
              if (window.confirm(`Restore ${owner.name} as Active?`)) {
                await toggleStatus(selected[0], "active");
                setSelectedRows(new Set());
              }
            })}

            {/* Live search */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                style={{ height: 30, width: 170, border: "1px solid #bbb", borderRadius: 2, padding: "0 10px", fontSize: 13, outline: "none", backgroundColor: "#fff" }}
                placeholder="Live Search here"
              />
              {selCount > 0 && <span style={{ fontSize: 12, color: "#555", fontWeight: 600, whiteSpace: "nowrap" }}>{selCount} selected</span>}
              <ColSelector visible={visibleCols} onChange={setVisibleCols} />
            </div>
          </div>

          {/* Card Body */}
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#333", marginBottom: 14 }}>
              <span>Show</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ height: 32, border: "1px solid #d2d6de", borderRadius: 3, padding: "0 8px", fontSize: 14, outline: "none" }}>
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>entries</span>
            </div>

            {loading && <div style={{ textAlign: "center", padding: "40px 0", color: "#888" }}>Loading car owners…</div>}
            {error && <div style={{ textAlign: "center", padding: "30px 0", color: "#c0392b" }}>Error: {error}</div>}

            {!loading && !error && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr>
                      <th style={thS}>
                        <input
                          type="checkbox"
                          checked={allPageSel}
                          onChange={e => {
                            setSelectedRows(prev => {
                              const c = new Set(prev);
                              paginated.forEach(o => e.target.checked ? c.add(o._id) : c.delete(o._id));
                              return c;
                            });
                          }}
                        />
                      </th>
                      {ALL_COLUMNS.filter(c => visibleCols.includes(c.key)).map(c => <th key={c.key} style={thS}>{c.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={visibleCols.length + 1} style={{ ...tdS, textAlign: "center", color: "#aaa", padding: "36px 0" }}>
                          {showDeleted ? "No deleted car owners found." : "No car owners found."}
                        </td>
                      </tr>
                    )}
                    {paginated.map(owner => (
                      <tr key={owner._id} style={{ background: selectedRows.has(owner._id) ? "#f0f7ff" : undefined }}>
                        <td style={tdS}><input type="checkbox" checked={selectedRows.has(owner._id)} onChange={() => toggleRow(owner._id)} /></td>
                        {ALL_COLUMNS.filter(c => visibleCols.includes(c.key)).map(c => renderCell(owner, c.key))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !error && (
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <p style={{ margin: 0, fontSize: 14, color: "#333" }}>
                  {filtered.length === 0
                    ? "No entries"
                    : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} entries${search ? ` (filtered from ${displayOwners.length} total)` : ""}`}
                </p>
                <div style={{ display: "flex" }}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={pageBtn(false, currentPage === 1)}>Previous</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(pg => (
                    <button key={pg} onClick={() => setCurrentPage(pg)} style={pageBtn(pg === currentPage, false)}>{pg}</button>
                  ))}
                  {totalPages > 7 && <span style={{ padding: "6px 8px", fontSize: 13 }}>…</span>}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={pageBtn(false, currentPage === totalPages)}>Next</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Toggle View Button (bottom right) ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => {
              setShowDeleted(prev => !prev);
              setCurrentPage(1);
              setSelectedRows(new Set());
              setSearch("");
            }}
            style={{
              padding: "10px 24px",
              borderRadius: 4,
              border: "none",
              background: showDeleted ? "#00a65a" : "#e74c3c",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "background 0.2s",
            }}
          >
            {showDeleted ? (
              <>
                👥 Active / Inactive Users
                <span style={{
                  background: "#fff",
                  color: "#00a65a",
                  borderRadius: "50%",
                  width: 24,
                  height: 24,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                }}>
                  {activeOwners.length}
                </span>
              </>
            ) : (
              <>
                🗑️ Deleted Car Owners
                {deletedOwners.length > 0 && (
                  <span style={{
                    background: "#fff",
                    color: "#e74c3c",
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}>
                    {deletedOwners.length}
                  </span>
                )}
              </>
            )}
          </button>
        </div>

      </div>
    </>
  );
};

export default CarOwners;
