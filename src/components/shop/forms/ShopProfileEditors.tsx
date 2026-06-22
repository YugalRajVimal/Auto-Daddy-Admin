import { useState } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../../admin/ContentPanel";
import OwnerCityPicker from "../../owner/OwnerCityPicker";
import { useAuth } from "../../../auth";
import {
  apiMessage,
  updateBusinessOpenHours,
  updateBusinessProfileMultipart,
  updatePersonalProfile,
} from "../../../lib/shopOwnerMutations";
import {
  resolvePerDaySchedule,
  serializePerDayOpenHoursForApi,
  WEEK_DAYS,
  type PerDaySchedule,
} from "../../../lib/perDayOpenHours";
import type { ShopProfileBusiness, ShopProfileUser } from "../../../types/shopOwner";
import { shopCancelButtonClass, shopSaveButtonClass } from "./ShopFormPage";

export function ShopPersonalProfileEditor({
  user,
  onSaved,
}: {
  user?: ShopProfileUser;
  onSaved: () => void;
}) {
  const { token, session } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [pincode, setPincode] = useState(user?.pincode ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await updatePersonalProfile(token, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.replace(/\D/g, ""),
        countryCode: session?.meta?.countryCode ?? user?.countryCode ?? "+1",
        pincode: pincode.trim(),
        address: address.trim(),
      });
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not save.");
        return;
      }
      toast.success("Profile updated.");
      setEditing(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex justify-end">
        <button type="button" className={shopCancelButtonClass} onClick={() => setEditing(true)}>Edit</button>
      </div>
    );
  }

  return (
    <CompactFormPanel
      footer={
        <CompactFormFooter
          actionLabel={saving ? "Saving…" : "Save"}
          onSave={() => void handleSave()}
          onCancel={() => setEditing(false)}
        />
      }
    >
      <CompactFormRow>
        <CompactField label="Name"><input className={compactInputClass} value={name} onChange={(e) => setName(e.target.value)} /></CompactField>
        <CompactField label="Email"><input className={compactInputClass} value={email} onChange={(e) => setEmail(e.target.value)} /></CompactField>
      </CompactFormRow>
      <CompactFormRow>
        <CompactField label="Phone"><input className={compactInputClass} value={phone} onChange={(e) => setPhone(e.target.value)} /></CompactField>
        <CompactField label="Postal Code"><input className={compactInputClass} value={pincode} onChange={(e) => setPincode(e.target.value)} /></CompactField>
      </CompactFormRow>
      <CompactField label="Address"><input className={compactInputClass} value={address} onChange={(e) => setAddress(e.target.value)} /></CompactField>
    </CompactFormPanel>
  );
}

export function ShopBusinessProfileEditor({
  business,
  onSaved,
}: {
  business?: ShopProfileBusiness;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [businessName, setBusinessName] = useState(business?.businessName ?? "");
  const [businessPhone, setBusinessPhone] = useState(business?.businessPhone ?? "");
  const [city, setCity] = useState(business?.city ?? "");
  const [address, setAddress] = useState(business?.address ?? "");
  const [email, setEmail] = useState(business?.email ?? "");
  const [hst, setHst] = useState(business?.hstNumber ?? "");
  const [gst, setGst] = useState(business?.gstPercent != null ? String(business.gstPercent) : "");
  const [logo, setLogo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const fields: Record<string, string | File> = {
        businessName: businessName.trim(),
        businessPhone: businessPhone.replace(/\D/g, ""),
        city: city.trim(),
        businessAddress: address.trim(),
        businessEmail: email.trim(),
        businessHSTNumber: hst.trim(),
        gst: gst.trim() || "0",
      };
      if (logo) fields.businessLogo = logo;
      const res = await updateBusinessProfileMultipart(token, fields);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not save.");
        return;
      }
      toast.success("Business profile updated.");
      setEditing(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex justify-end">
        <button type="button" className={shopCancelButtonClass} onClick={() => setEditing(true)}>Edit</button>
      </div>
    );
  }

  return (
    <>
      <CompactFormPanel
        footer={
          <CompactFormFooter
            actionLabel={saving ? "Saving…" : "Save"}
            onSave={() => void handleSave()}
            onCancel={() => setEditing(false)}
          />
        }
      >
        <CompactFormRow>
          <CompactField label="Business Name"><input className={compactInputClass} value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></CompactField>
          <CompactField label="Phone"><input className={compactInputClass} value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} /></CompactField>
        </CompactFormRow>
        <CompactFormRow>
          <CompactField label="City">
            <div className="flex gap-2">
              <input className={compactInputClass} value={city} readOnly />
              <button type="button" className={shopCancelButtonClass} onClick={() => setCityPickerOpen(true)}>Pick</button>
            </div>
          </CompactField>
          <CompactField label="Email"><input className={compactInputClass} value={email} onChange={(e) => setEmail(e.target.value)} /></CompactField>
        </CompactFormRow>
        <CompactFormRow>
          <CompactField label="Address"><input className={compactInputClass} value={address} onChange={(e) => setAddress(e.target.value)} /></CompactField>
          <CompactField label="HST"><input className={compactInputClass} value={hst} onChange={(e) => setHst(e.target.value)} /></CompactField>
        </CompactFormRow>
        <CompactFormRow>
          <CompactField label="GST %"><input className={compactInputClass} value={gst} onChange={(e) => setGst(e.target.value)} /></CompactField>
          <CompactField label="Logo"><input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} /></CompactField>
        </CompactFormRow>
      </CompactFormPanel>
      <OwnerCityPicker open={cityPickerOpen} onClose={() => setCityPickerOpen(false)} token={token} selectedId={null} onSelect={(c) => { setCity(c.name); setCityPickerOpen(false); }} />
    </>
  );
}

export function ShopOpenHoursEditor({
  perDayOpenHours,
  onSaved,
}: {
  perDayOpenHours?: string;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [schedule, setSchedule] = useState<PerDaySchedule>(() =>
    resolvePerDaySchedule(perDayOpenHours ? { perDayOpenHours } : null)
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await updateBusinessOpenHours(token, serializePerDayOpenHoursForApi(schedule));
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not save hours.");
        return;
      }
      toast.success("Hours updated.");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {WEEK_DAYS.map((day) => (
        <div key={day} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded border border-gray-200 bg-white p-2 text-sm">
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              checked={schedule[day].enabled}
              onChange={(e) => setSchedule((s) => ({ ...s, [day]: { ...s[day], enabled: e.target.checked } }))}
            />
            {day}
          </label>
          <input type="time" className={compactInputClass} value={schedule[day].start} disabled={!schedule[day].enabled} onChange={(e) => setSchedule((s) => ({ ...s, [day]: { ...s[day], start: e.target.value } }))} />
          <input type="time" className={compactInputClass} value={schedule[day].end} disabled={!schedule[day].enabled} onChange={(e) => setSchedule((s) => ({ ...s, [day]: { ...s[day], end: e.target.value } }))} />
        </div>
      ))}
      <button type="button" className={shopSaveButtonClass} disabled={saving} onClick={() => void handleSave()}>
        {saving ? "Saving…" : "Save Hours"}
      </button>
    </div>
  );
}

export function ShopProfileLinks() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link to="/shop/profile/services-selection" className={shopCancelButtonClass}>Manage Services</Link>
      <Link to="/shop/profile/car-companies" className={shopCancelButtonClass}>Car Brands</Link>
      <Link to="/shop/team" className={shopCancelButtonClass}>Team Members</Link>
    </div>
  );
}
