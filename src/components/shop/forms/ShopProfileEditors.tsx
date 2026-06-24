import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import { getJson } from "../../../api/mobileAuth";
import {
  CompactField,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../../admin/ContentPanel";
import { useAuth } from "../../../auth";
import {
  addMyCarCompanies,
  apiMessage,
  updateBusinessOpenHours,
  updateBusinessProfileMultipart,
  updatePersonalProfile,
  updateServiceWeWorkWith,
} from "../../../lib/shopOwnerMutations";
import {
  resolvePerDaySchedule,
  serializePerDayOpenHoursForApi,
  WEEK_DAYS,
  type PerDaySchedule,
} from "../../../lib/perDayOpenHours";
import { filterServicesByShopType, getShopTypeLabel, normalizeShopType, SHOP_TYPE_OPTIONS, type ShopType } from "../../../lib/shopTypes";
import type { ShopProfileBusiness, ShopProfileUser, ShopServiceCategory } from "../../../types/shopOwner";
import OpenHoursTimePicker from "./OpenHoursTimePicker";
import CarBrandLogo from "../CarBrandLogo";
import { getServiceId, getServiceName } from "../../../lib/dummyServices";
import { parseCitiesApiResponse } from "../../../lib/carOwnerCities";
import { shopSaveButtonClass } from "./ShopFormPage";

const checkboxBoxClass =
  "inline-block border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs text-gray-800";

function ProfileStatusFooter({
  message,
  actions,
}: {
  message: string;
  actions: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-ad-form-border bg-ad-form-required-bg px-3 py-2.5">
      <div />
      <span className="text-center text-xs font-serif italic text-gray-800">{message}</span>
      <div className="flex justify-end">{actions}</div>
    </div>
  );
}

function ProfileFormFooter({
  message,
  saving,
  onSave,
  onReset,
  cancelLabel = "Cancel",
}: {
  message: string;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
  cancelLabel?: string;
}) {
  return (
    <ProfileStatusFooter
      message={message}
      actions={
        <div className="flex items-center gap-2">
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
              {cancelLabel}
            </button>
          </span>
        </div>
      }
    />
  );
}

function ProfileViewFooter({ message, onUpdate }: { message: string; onUpdate: () => void }) {
  return (
    <ProfileStatusFooter
      message={message}
      actions={
        <button
          type="button"
          onClick={onUpdate}
          className="inline-flex items-center gap-1.5 rounded bg-ad-purple px-4 py-1 text-sm font-bold text-white hover:bg-ad-purple-dark"
        >
          Update
        </button>
      }
    />
  );
}

export function ShopPersonalProfileEditor({
  user,
  city,
  isEditing = false,
  onStartEdit,
  onCancelEdit,
  onSaved,
}: {
  user?: ShopProfileUser;
  city?: string;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onSaved: () => void;
}) {
  const { token, session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [pincode, setPincode] = useState(user?.pincode ?? "");
  const [selectedCity, setSelectedCity] = useState(city ?? "");
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [showUploadImage, setShowUploadImage] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [saving, setSaving] = useState(false);

  const syncFromUser = () => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setAddress(user?.address ?? "");
    setPincode(user?.pincode ?? "");
    setSelectedCity(city ?? "");
    setShowEmail(Boolean(user?.email?.trim()));
    setShowUploadImage(false);
  };

  const reset = () => {
    syncFromUser();
    onCancelEdit?.();
  };

  useEffect(() => {
    syncFromUser();
  }, [user?.name, user?.email, user?.phone, user?.address, user?.pincode, city]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      const res = await getJson<unknown>("/api/user/cities?page=1", token);
      if (cancelled) return;
      if (res.ok) {
        setCityOptions(parseCitiesApiResponse(res.data).map((c) => c.name));
      } else {
        setCityOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const citySelectOptions = useMemo(() => {
    const names = new Set(cityOptions);
    if (selectedCity.trim()) names.add(selectedCity.trim());
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [cityOptions, selectedCity]);

  useEffect(() => {
    if (user?.email?.trim()) setShowEmail(true);
  }, [user?.email]);

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
        city: selectedCity.trim(),
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
      footer={
        isEditing ? (
          <ProfileFormFooter
            message="You are updating your personal profile"
            saving={saving}
            onSave={() => void handleSave()}
            onReset={reset}
          />
        ) : (
          <ProfileViewFooter
            message="You are viewing your personal profile"
            onUpdate={() => onStartEdit?.()}
          />
        )
      }
    >
      <div className="space-y-4">
        <CompactFormRow>
          <CompactField label="Name" className="min-w-[120px] flex-1">
            <input
              className={compactInputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing || saving}
            />
          </CompactField>
          <CompactField label="Phone" className="min-w-[120px] flex-1">
            <input
              className={compactInputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!isEditing || saving}
            />
          </CompactField>
          <CompactField label="City" className="min-w-[120px] flex-1">
            {isEditing ? (
              <select
                className={compactInputClass}
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={saving}
              >
                <option value="">Select city</option>
                {citySelectOptions.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </select>
            ) : (
              <input className={compactInputClass} value={selectedCity} readOnly />
            )}
          </CompactField>
          <CompactField label="Address" className="min-w-[120px] flex-1">
            <input
              className={compactInputClass}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!isEditing || saving}
            />
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
                  disabled={!isEditing || saving}
                  className="h-3.5 w-3.5 accent-ad-green"
                />
                <label htmlFor="shop-personal-upload-image" className="text-xs font-bold text-ad-green-dark">
                  Upload Image
                </label>
              </div>
              {showUploadImage && isEditing ? (
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
                  disabled={!isEditing || saving}
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
                  disabled={!isEditing || saving}
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
  shopType: initialShopType,
  isEditing = false,
  onStartEdit,
  onCancelEdit,
  onSaved,
}: {
  business?: ShopProfileBusiness;
  zipCode?: string;
  shopType?: string;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [businessName, setBusinessName] = useState(business?.businessName ?? "");
  const [businessPhone, setBusinessPhone] = useState(business?.businessPhone ?? "");
  const [city, setCity] = useState(business?.city ?? "");
  const [zip, setZip] = useState(zipCode ?? "");
  const [address, setAddress] = useState(business?.address ?? "");
  const [email, setEmail] = useState(business?.email ?? "");
  const [hst, setHst] = useState(business?.hstNumber ?? "");
  const [tax, setTax] = useState(business?.gstPercent != null ? String(business.gstPercent) : "");
  const [shopType, setShopType] = useState<ShopType>(() =>
    normalizeShopType(initialShopType ?? business?.shopType)
  );
  const [showUploadImage, setShowUploadImage] = useState(false);
  const [showUploadBanner, setShowUploadBanner] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const syncFromBusiness = () => {
    setBusinessName(business?.businessName ?? "");
    setBusinessPhone(business?.businessPhone ?? "");
    setCity(business?.city ?? "");
    setZip(zipCode ?? "");
    setAddress(business?.address ?? "");
    setEmail(business?.email ?? "");
    setHst(business?.hstNumber ?? "");
    setTax(business?.gstPercent != null ? String(business.gstPercent) : "");
    setShopType(normalizeShopType(initialShopType ?? business?.shopType));
    setShowUploadImage(false);
    setShowUploadBanner(false);
    setLogo(null);
    setBanner(null);
  };

  const reset = () => {
    syncFromBusiness();
    onCancelEdit?.();
  };

  useEffect(() => {
    syncFromBusiness();
  }, [
    business?.businessName,
    business?.businessPhone,
    business?.city,
    business?.address,
    business?.email,
    business?.hstNumber,
    business?.gstPercent,
    business?.shopType,
    initialShopType,
    zipCode,
  ]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      const res = await getJson<unknown>("/api/user/cities?page=1", token);
      if (cancelled) return;
      if (res.ok) {
        setCityOptions(parseCitiesApiResponse(res.data).map((c) => c.name));
      } else {
        setCityOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const citySelectOptions = useMemo(() => {
    const names = new Set(cityOptions);
    if (city.trim()) names.add(city.trim());
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [cityOptions, city]);

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
        shopType,
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

  const shopTypeRadios = (
    <>
      <span className="text-xs font-bold text-gray-800">Shop Type:</span>
      {SHOP_TYPE_OPTIONS.map((option) => (
        <label key={option.value} className="flex items-center gap-1.5 text-xs font-bold text-ad-green-dark">
          <input
            type="radio"
            name="shop-business-type"
            value={option.value}
            checked={shopType === option.value}
            onChange={() => setShopType(option.value)}
            disabled={!isEditing || saving}
            className="h-3.5 w-3.5 accent-ad-green"
          />
          {option.label}
        </label>
      ))}
    </>
  );

  return (
    <>
      <CompactFormPanel
        footer={
          isEditing ? (
            <ProfileFormFooter
              message="You are updating your business profile"
              saving={saving}
              onSave={() => void handleSave()}
              onReset={reset}
            />
          ) : (
            <ProfileViewFooter
              message="You are viewing your business profile"
              onUpdate={() => onStartEdit?.()}
            />
          )
        }
      >
        <CompactFormRow>
          <CompactField label="Business Name">
            <input
              className={compactInputClass}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={!isEditing || saving}
            />
          </CompactField>
          <CompactField label="Phone">
            <input
              className={compactInputClass}
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              disabled={!isEditing || saving}
            />
          </CompactField>
          <CompactField label="City">
            {isEditing ? (
              <select
                className={compactInputClass}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={saving}
              >
                <option value="">Select city</option>
                {citySelectOptions.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </select>
            ) : (
              <input className={compactInputClass} value={city} readOnly />
            )}
          </CompactField>
          <CompactField label="Zip Code">
            <input
              className={compactInputClass}
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              disabled={!isEditing || saving}
            />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow>
          <CompactField label="Address">
            <input
              className={compactInputClass}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!isEditing || saving}
            />
          </CompactField>
          <CompactField label="Business Email">
            <input
              className={compactInputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isEditing || saving}
            />
          </CompactField>
          <CompactField label="HST Number">
            <input
              className={compactInputClass}
              value={hst}
              onChange={(e) => setHst(e.target.value)}
              disabled={!isEditing || saving}
            />
          </CompactField>
          <CompactField label="Tax %">
            <input
              className={compactInputClass}
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              disabled={!isEditing || saving}
            />
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
                  disabled={!isEditing || saving}
                  className="h-3.5 w-3.5 accent-ad-green"
                />
                <label htmlFor="shop-business-upload-image" className="text-xs font-bold text-ad-green-dark">
                  Upload Logo
                </label>
              </div>
              {showUploadImage && isEditing ? (
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
                  disabled={!isEditing || saving}
                  className="h-3.5 w-3.5 accent-ad-green"
                />
                <label htmlFor="shop-business-upload-banner" className="text-xs font-bold text-ad-green-dark">
                  Upload Banner Image
                </label>
              </div>
              {showUploadBanner && isEditing ? (
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
        {isEditing ? (
          <CompactFormRow className="items-center pt-1">
            <div className="flex flex-wrap items-center gap-4">{shopTypeRadios}</div>
          </CompactFormRow>
        ) : (
          <p className="pt-1 text-xs font-bold text-gray-800">
            Shop Type: <span className="text-ad-green-dark">{getShopTypeLabel(shopType)}</span>
          </p>
        )}
      </CompactFormPanel>
    </>
  );
}

export function ShopOpenHoursEditor({
  perDayOpenHours,
  isBusinessActive,
  updatingActive,
  isEditing = false,
  onStartEdit,
  onCancelEdit,
  onActiveChange,
  onSaved,
}: {
  perDayOpenHours?: string;
  isBusinessActive?: boolean | null;
  updatingActive?: boolean;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
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
        isEditing ? (
          <ProfileFormFooter
            message="You are updating your opening timings"
            saving={saving}
            onSave={() => void handleSave()}
            onReset={() => {
              setSchedule(resolvePerDaySchedule(perDayOpenHours ? { perDayOpenHours } : null));
              onCancelEdit?.();
            }}
          />
        ) : (
          <ProfileViewFooter
            message="You are viewing your opening timings"
            onUpdate={() => onStartEdit?.()}
          />
        )
      }
    >
      {isBusinessActive != null ? (
        <label className="mb-4 flex items-center gap-3 text-sm font-semibold text-ad-purple">
          <input
            type="checkbox"
            checked={isBusinessActive}
            disabled={!isEditing || updatingActive}
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
                disabled={!isEditing || saving}
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
                disabled={!isEditing || !schedule[day].enabled || saving}
                className="w-[88px]"
                onChange={(start) => setSchedule((s) => ({ ...s, [day]: { ...s[day], start } }))}
              />
            </div>
            <div className="flex w-full items-center justify-start gap-2">
              <span className="w-14 shrink-0 text-xs font-bold text-ad-green-dark">Closing</span>
              <OpenHoursTimePicker
                id={`${day}-closing`}
                value={schedule[day].end}
                disabled={!isEditing || !schedule[day].enabled || saving}
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
      footer={
        <ProfileFormFooter
          message="You are adding a car brand"
          saving={saving}
          onSave={() => void handleSave()}
          onReset={reset}
          cancelLabel="Cancel"
        />
      }
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
          {brandId ? (
            <CarBrandLogo company={selected} className="h-20 w-full object-contain" />
          ) : (
            <span className="text-xs text-gray-400">Select a brand</span>
          )}
        </CompactField>
      </CompactFormRow>
    </CompactFormPanel>
  );
}

export function ShopServiceAddEditor({
  services,
  selectedIds,
  shopType,
  onSaved,
  onClose,
  onSaveService,
}: {
  services: ShopServiceCategory[];
  selectedIds: Set<string>;
  shopType?: string | null;
  onSaved: (id: string) => void;
  onClose?: () => void;
  /** When set, handles save locally. Return true if handled, false to fall through to API. */
  onSaveService?: (id: string) => Promise<boolean> | boolean;
}) {
  const { token } = useAuth();
  const shopTypeFiltered = filterServicesByShopType(services, normalizeShopType(shopType));
  const available = shopTypeFiltered.filter((service) => {
    const id = getServiceId(service);
    return id && !selectedIds.has(id);
  });
  const [serviceId, setServiceId] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCancel = () => {
    setServiceId("");
    onClose?.();
  };

  const handleSave = async () => {
    if (!serviceId) {
      toast.error("Please select a service.");
      return;
    }
    setSaving(true);
    try {
      if (onSaveService) {
        const handled = await onSaveService(serviceId);
        if (handled) {
          toast.success("Service added.");
          setServiceId("");
          onSaved(serviceId);
          return;
        }
      }
      if (!token) return;
      const res = await updateServiceWeWorkWith(token, [...selectedIds, serviceId]);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not save.");
        return;
      }
      toast.success("Service added.");
      setServiceId("");
      onSaved(serviceId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <CompactFormPanel
      className="mb-4"
      footer={
        <ProfileFormFooter
          message="You are adding a service"
          saving={saving}
          onSave={() => void handleSave()}
          onReset={handleCancel}
          cancelLabel="Cancel"
        />
      }
    >
      <CompactFormRow className="items-end">
        <CompactField label="Select Service Name" className="min-w-[180px] flex-1">
          <select
            className={compactInputClass}
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            disabled={available.length === 0}
          >
            <option value="">
              {available.length === 0 ? "All services already added" : "Select service"}
            </option>
            {available.map((service) => {
              const id = getServiceId(service);
              const name = getServiceName(service);
              return (
                <option key={id} value={id}>
                  {name}
                </option>
              );
            })}
          </select>
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
