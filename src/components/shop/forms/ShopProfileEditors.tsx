import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import {
  CompactField,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../../admin/ContentPanel";
import OwnerCityPicker from "../../owner/OwnerCityPicker";
import { useAuth } from "../../../auth";
import {
  addMyCarCompanies,
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
import OpenHoursTimePicker from "./OpenHoursTimePicker";
import CarBrandLogo from "../CarBrandLogo";
import { shopSaveButtonClass } from "./ShopFormPage";

const checkboxBoxClass =
  "inline-block border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs text-gray-800";

function ProfileFormFooter({
  saving,
  onSave,
  onReset,
}: {
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-ad-form-border bg-ad-form-required-bg px-3 py-2.5">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded bg-ad-form-save px-4 py-1 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      <span className="text-xs text-gray-700">
        or{" "}
        <button
          type="button"
          onClick={onReset}
          disabled={saving}
          className="font-medium text-blue-600 underline hover:text-blue-700 disabled:opacity-60"
        >
          Reset
        </button>
      </span>
    </div>
  );
}

export function ShopPersonalProfileEditor({
  user,
  city,
  onSaved,
}: {
  user?: ShopProfileUser;
  city?: string;
  onSaved: () => void;
}) {
  const { token, session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [pincode, setPincode] = useState(user?.pincode ?? "");
  const [showUploadImage, setShowUploadImage] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setAddress(user?.address ?? "");
    setPincode(user?.pincode ?? "");
    setShowEmail(false);
    setShowUploadImage(false);
  };

  useEffect(() => {
    reset();
  }, [user?.name, user?.email, user?.phone, user?.address, user?.pincode]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await updatePersonalProfile(token, {
        name: name.trim(),
        email: showEmail ? email.trim() : "",
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
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <CompactFormPanel
      footer={<ProfileFormFooter saving={saving} onSave={() => void handleSave()} onReset={reset} />}
    >
      <div className="space-y-4">
        <CompactFormRow>
          <CompactField label="Name" className="min-w-[120px] flex-1">
            <input className={compactInputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </CompactField>
          <CompactField label="Phone" className="min-w-[120px] flex-1">
            <input className={compactInputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </CompactField>
          <CompactField label="City" className="min-w-[120px] flex-1">
            <input className={compactInputClass} value={city ?? pincode} readOnly />
          </CompactField>
          <CompactField label="Address" className="min-w-[120px] flex-1">
            <input className={compactInputClass} value={address} onChange={(e) => setAddress(e.target.value)} />
          </CompactField>
        </CompactFormRow>

        <CompactFormRow className="items-start">
          <div className="min-w-[120px] flex-1">
            <div className="flex flex-col items-start gap-2">
              <div className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shop-personal-upload-image"
                  checked={showUploadImage}
                  onChange={(e) => setShowUploadImage(e.target.checked)}
                  className="h-3.5 w-3.5 accent-ad-green"
                />
                <label htmlFor="shop-personal-upload-image" className="text-xs font-bold text-ad-green-dark">
                  Upload Image
                </label>
              </div>
              {showUploadImage ? (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`${checkboxBoxClass} hover:bg-gray-200`}
                  >
                    Choose image
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
                </>
              ) : null}
            </div>
          </div>
          <div className="min-w-[120px] flex-1">
            <div className="flex flex-col items-start gap-2">
              <div className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shop-personal-show-email"
                  checked={showEmail}
                  onChange={(e) => setShowEmail(e.target.checked)}
                  className="h-3.5 w-3.5 accent-ad-green"
                />
                <label htmlFor="shop-personal-show-email" className="text-xs font-bold text-ad-green-dark">
                  Email
                </label>
              </div>
              {showEmail ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${compactInputClass} w-full`}
                />
              ) : null}
            </div>
          </div>
          <div className="min-w-[120px] flex-1" aria-hidden />
          <div className="min-w-[120px] flex-1" aria-hidden />
        </CompactFormRow>
      </div>
    </CompactFormPanel>
  );
}

export function ShopBusinessProfileEditor({
  business,
  zipCode,
  onSaved,
}: {
  business?: ShopProfileBusiness;
  zipCode?: string;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [businessName, setBusinessName] = useState(business?.businessName ?? "");
  const [businessPhone, setBusinessPhone] = useState(business?.businessPhone ?? "");
  const [city, setCity] = useState(business?.city ?? "");
  const [zip, setZip] = useState(zipCode ?? "");
  const [address, setAddress] = useState(business?.address ?? "");
  const [email, setEmail] = useState(business?.email ?? "");
  const [hst, setHst] = useState(business?.hstNumber ?? "");
  const [tax, setTax] = useState(business?.gstPercent != null ? String(business.gstPercent) : "");
  const [showUploadImage, setShowUploadImage] = useState(false);
  const [showUploadBanner, setShowUploadBanner] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setBusinessName(business?.businessName ?? "");
    setBusinessPhone(business?.businessPhone ?? "");
    setCity(business?.city ?? "");
    setZip(zipCode ?? "");
    setAddress(business?.address ?? "");
    setEmail(business?.email ?? "");
    setHst(business?.hstNumber ?? "");
    setTax(business?.gstPercent != null ? String(business.gstPercent) : "");
    setShowUploadImage(false);
    setShowUploadBanner(false);
    setLogo(null);
    setBanner(null);
  };

  useEffect(() => {
    reset();
  }, [
    business?.businessName,
    business?.businessPhone,
    business?.city,
    business?.address,
    business?.email,
    business?.hstNumber,
    business?.gstPercent,
    zipCode,
  ]);

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
        gst: tax.trim() || "0",
      };
      if (logo) fields.businessLogo = logo;
      if (banner) fields.bannerImage = banner;
      const res = await updateBusinessProfileMultipart(token, fields);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not save.");
        return;
      }
      toast.success("Business profile updated.");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CompactFormPanel
        footer={<ProfileFormFooter saving={saving} onSave={() => void handleSave()} onReset={reset} />}
      >
        <CompactFormRow>
          <CompactField label="Business Name">
            <input className={compactInputClass} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </CompactField>
          <CompactField label="Phone">
            <input className={compactInputClass} value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} />
          </CompactField>
          <CompactField label="City">
            <div className="flex gap-2">
              <input className={compactInputClass} value={city} readOnly />
              <button type="button" className={checkboxBoxClass} onClick={() => setCityPickerOpen(true)}>
                Pick
              </button>
            </div>
          </CompactField>
          <CompactField label="Zip Code">
            <input className={compactInputClass} value={zip} onChange={(e) => setZip(e.target.value)} />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow>
          <CompactField label="Address">
            <input className={compactInputClass} value={address} onChange={(e) => setAddress(e.target.value)} />
          </CompactField>
          <CompactField label="Business Email">
            <input className={compactInputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </CompactField>
          <CompactField label="HST Number">
            <input className={compactInputClass} value={hst} onChange={(e) => setHst(e.target.value)} />
          </CompactField>
          <CompactField label="Tax %">
            <input className={compactInputClass} value={tax} onChange={(e) => setTax(e.target.value)} />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow className="items-start pt-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col items-start gap-2">
              <div className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shop-business-upload-image"
                  checked={showUploadImage}
                  onChange={(e) => setShowUploadImage(e.target.checked)}
                  className="h-3.5 w-3.5 accent-ad-green"
                />
                <label htmlFor="shop-business-upload-image" className="text-xs font-bold text-ad-green-dark">
                  Upload Logo
                </label>
              </div>
              {showUploadImage ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`${checkboxBoxClass} hover:bg-gray-200`}
                >
                  Choose image
                </button>
              ) : null}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col items-start gap-2">
              <div className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shop-business-upload-banner"
                  checked={showUploadBanner}
                  onChange={(e) => setShowUploadBanner(e.target.checked)}
                  className="h-3.5 w-3.5 accent-ad-green"
                />
                <label htmlFor="shop-business-upload-banner" className="text-xs font-bold text-ad-green-dark">
                  Upload Banner Image
                </label>
              </div>
              {showUploadBanner ? (
                <button
                  type="button"
                  onClick={() => bannerFileInputRef.current?.click()}
                  className={`${checkboxBoxClass} hover:bg-gray-200`}
                >
                  Choose image
                </button>
              ) : null}
              <input
                ref={bannerFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setBanner(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <div className="min-w-0 flex-1" aria-hidden />
          <div className="min-w-0 flex-1" aria-hidden />
        </CompactFormRow>
      </CompactFormPanel>
      <OwnerCityPicker
        open={cityPickerOpen}
        onClose={() => setCityPickerOpen(false)}
        token={token}
        selectedId={null}
        onSelect={(c) => {
          setCity(c.name);
          setCityPickerOpen(false);
        }}
      />
    </>
  );
}

export function ShopOpenHoursEditor({
  perDayOpenHours,
  isBusinessActive,
  updatingActive,
  onActiveChange,
  onSaved,
}: {
  perDayOpenHours?: string;
  isBusinessActive?: boolean | null;
  updatingActive?: boolean;
  onActiveChange?: (next: boolean) => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [schedule, setSchedule] = useState<PerDaySchedule>(() =>
    resolvePerDaySchedule(perDayOpenHours ? { perDayOpenHours } : null)
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSchedule(resolvePerDaySchedule(perDayOpenHours ? { perDayOpenHours } : null));
  }, [perDayOpenHours]);

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
    <CompactFormPanel
      footer={
        <ProfileFormFooter
          saving={saving}
          onSave={() => void handleSave()}
          onReset={() => setSchedule(resolvePerDaySchedule(perDayOpenHours ? { perDayOpenHours } : null))}
        />
      }
    >
      {isBusinessActive != null ? (
        <label className="mb-4 flex items-center gap-3 text-sm font-semibold text-ad-purple">
          <input
            type="checkbox"
            checked={isBusinessActive}
            disabled={updatingActive}
            onChange={(e) => onActiveChange?.(e.target.checked)}
            className="h-5 w-5 accent-ad-purple"
          />
          {isBusinessActive ? "Your shop is currently open" : "Your shop is currently closed"}
        </label>
      ) : null}
      <div className="w-full space-y-4">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="grid w-full grid-cols-1 items-center gap-5 rounded border border-gray-200 bg-white px-4 py-3 text-sm sm:grid-cols-3 sm:justify-items-start sm:gap-x-8"
          >
            <label className="flex w-full items-center justify-start gap-3 font-semibold">
              <input
                type="checkbox"
                checked={schedule[day].enabled}
                onChange={(e) =>
                  setSchedule((s) => ({ ...s, [day]: { ...s[day], enabled: e.target.checked } }))
                }
                className="h-5 w-5 shrink-0 accent-ad-purple"
              />
              <span className="inline-block min-w-[5.75rem] text-left">{day}</span>
            </label>
            <div className="flex w-full items-center justify-start gap-2">
              <span className="w-14 shrink-0 text-xs font-bold text-ad-green-dark">Opening</span>
              <OpenHoursTimePicker
                id={`${day}-opening`}
                value={schedule[day].start}
                disabled={!schedule[day].enabled}
                className="w-[88px]"
                onChange={(start) => setSchedule((s) => ({ ...s, [day]: { ...s[day], start } }))}
              />
            </div>
            <div className="flex w-full items-center justify-start gap-2">
              <span className="w-14 shrink-0 text-xs font-bold text-ad-green-dark">Closing</span>
              <OpenHoursTimePicker
                id={`${day}-closing`}
                value={schedule[day].end}
                disabled={!schedule[day].enabled}
                className="w-[88px]"
                onChange={(end) => setSchedule((s) => ({ ...s, [day]: { ...s[day], end } }))}
              />
            </div>
          </div>
        ))}
      </div>
    </CompactFormPanel>
  );
}

export type ShopCarCompany = {
  _id?: string;
  id?: string;
  name?: string;
  companyName?: string;
  brandLogo?: string | null;
  logoUrl?: string | null;
};

export function ShopCarBrandAddEditor({
  companies,
  selectedIds,
  onSaved,
  onClose,
  onSaveBrand,
}: {
  companies: ShopCarCompany[];
  selectedIds: Set<string>;
  onSaved: (id: string) => void;
  onClose?: () => void;
  /** When set, handles save locally. Return true if handled, false to fall through to API. */
  onSaveBrand?: (id: string) => Promise<boolean> | boolean;
}) {
  const { token } = useAuth();
  const available = companies.filter((c) => {
    const id = String(c._id ?? c.id ?? "");
    return id && !selectedIds.has(id);
  });
  const [brandId, setBrandId] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = companies.find((c) => String(c._id ?? c.id ?? "") === brandId);

  const reset = () => {
    setBrandId("");
    onClose?.();
  };

  const handleSave = async () => {
    if (!brandId) {
      toast.error("Please select a brand.");
      return;
    }
    setSaving(true);
    try {
      if (onSaveBrand) {
        const handled = await onSaveBrand(brandId);
        if (handled) {
          toast.success("Car brand added.");
          setBrandId("");
          onSaved(brandId);
          return;
        }
      }
      if (!token) return;
      const res = await addMyCarCompanies(token, [brandId]);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not save.");
        return;
      }
      toast.success("Car brand added.");
      setBrandId("");
      onSaved(brandId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <CompactFormPanel
      className="mb-4"
      footer={<ProfileFormFooter saving={saving} onSave={() => void handleSave()} onReset={reset} />}
    >
      <CompactFormRow className="items-end">
        <CompactField label="Select Brand Name" className="min-w-[180px] flex-1">
          <select
            className={compactInputClass}
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            disabled={available.length === 0}
          >
            <option value="">
              {available.length === 0 ? "All brands already added" : "Select brand"}
            </option>
            {available.map((company) => {
              const id = String(company._id ?? company.id ?? "");
              const name = company.name ?? company.companyName ?? "—";
              return (
                <option key={id} value={id}>
                  {name}
                </option>
              );
            })}
          </select>
        </CompactField>
        <CompactField label="Emblem" className="min-w-[180px] flex-1">
          <div className="flex h-20 w-full items-center justify-center rounded border border-gray-300 bg-white px-3">
            {brandId ? (
              <CarBrandLogo company={selected} className="max-h-16 max-w-full object-contain" />
            ) : (
              <span className="text-xs text-gray-400">Select a brand</span>
            )}
          </div>
        </CompactField>
      </CompactFormRow>
    </CompactFormPanel>
  );
}

export function ShopProfileLinks() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link to="/shop/profile/services-selection" className={shopSaveButtonClass}>
        Manage Services
      </Link>
      <Link to="/shop/profile/car-companies" className={shopSaveButtonClass}>
        Car Brands
      </Link>
      <Link to="/shop/team" className={shopSaveButtonClass}>
        Team Members
      </Link>
    </div>
  );
}
