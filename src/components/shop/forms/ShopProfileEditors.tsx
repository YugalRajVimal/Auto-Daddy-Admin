import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Link } from "react-router";
import { FiEdit2, FiPaperclip, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { getJson } from "../../../api/mobileAuth";
import {
  CompactField,
  CompactFormPanel,
  CompactFormRow,
} from "../../admin/ContentPanel";
import { AdminDataTable, tableCell } from "../../admin/AdminDataTable";
import {
  ADMIN_PANEL_THEAD_ROW_CLASS,
  adminPanelRowClass,
  adminPanelTableClasses,
} from "../../admin/adminPanelTableStyles";

const SHOP_TABLE = adminPanelTableClasses(true);
import { shopCompactInputClass } from "../shopLayoutStyles";
import { useAuth } from "../../../auth";
import { formatPhoneDisplay, phoneDigits } from "../../../lib/phoneFormat";
import {
  addMyCarCompanies,
  apiMessage,
  updateBusinessOpenHours,
  updateBusinessProfileMultipart,
  updatePersonalProfile,
  updatePersonalProfileMultipart,
  updateServiceWeWorkWith,
} from "../../../lib/shopOwnerMutations";
import {
  formatOpenHoursRangeDisplay,
  resolveShopOpenHoursSchedule,
  serializePerDayOpenHoursForApi,
  shortDayLabel,
  USE_DUMMY_SHOP_OPEN_HOURS,
  WEEK_DAYS,
  type PerDaySchedule,
  type WeekDay,
} from "../../../lib/perDayOpenHours";
import {
  filterServicesByShopType,
  getShopTypeLabel,
  normalizeShopType,
  SHOP_TYPE_OPTIONS,
  type ShopType,
} from "../../../lib/shopTypes";
import type { ShopProfileBusiness, ShopProfileUser, ShopServiceCategory } from "../../../types/shopOwner";
import OpenHoursTimePicker from "./OpenHoursTimePicker";
import CarBrandLogo, {
  CAR_BRAND_EMBLEM_LOGO_CLASS,
  CAR_BRAND_EMBLEM_SLOT_CLASS,
} from "../CarBrandLogo";
import { getCarBrandId, getCarBrandName, resolveCarBrandLogo } from "../../../lib/dummyCarBrands";
import { getServiceId, getServiceName } from "../../../lib/dummyServices";
import { parseCitiesApiResponse } from "../../../lib/carOwnerCities";
import { normalizeMediaUrl } from "../../../lib/normalizeMediaUrl";
import { shopSaveButtonClass } from "./ShopFormPage";
import { ShopReveal } from "../ShopAnimated";
import { motion } from "framer-motion";

const checkboxBoxClass =
  "inline-block border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs text-gray-800";

function ProfileImagePreviewModal({
  open,
  title,
  imageUrl,
  onClose,
}: {
  open: boolean;
  title: string;
  imageUrl: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-[min(90vw,480px)] rounded border border-gray-300 bg-white p-4 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-700 text-sm text-white hover:bg-gray-900"
          aria-label="Close"
        >
          ×
        </button>
        <p className="mb-3 text-center text-sm font-semibold text-ad-green-dark">{title}</p>
        <img src={imageUrl} alt={title} className="mx-auto max-h-[70vh] max-w-full object-contain" />
      </div>
    </div>
  );
}

function ProfileImageUploadField({
  id,
  label,
  imageUrl,
  saving,
  showUploadImage,
  onToggleUpload,
  onChooseClick,
  fileInputRef,
  onFileChange,
  previewTitle,
}: {
  id: string;
  label: string;
  imageUrl: string | null;
  saving: boolean;
  showUploadImage: boolean;
  onToggleUpload: (next: boolean) => void;
  onChooseClick: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (file: File | null) => void;
  previewTitle: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const hasImage = Boolean(imageUrl);

  return (
    <>
      <div className="flex flex-col items-start gap-2">
        {hasImage ? (
          <>
            <p className="text-xs font-bold text-ad-green-dark">{label}</p>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              disabled={saving}
              className="h-14 w-14 overflow-hidden rounded border border-gray-300 bg-gray-100 hover:opacity-90 disabled:opacity-60"
              title={`View ${previewTitle}`}
              aria-label={`View ${previewTitle}`}
            >
              <img src={imageUrl!} alt={label} className="h-full w-full object-cover" />
            </button>
            <button
              type="button"
              onClick={onChooseClick}
              disabled={saving}
              className="text-xs font-medium text-blue-600 underline hover:text-blue-700 disabled:opacity-60"
            >
              Change image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            />
          </>
        ) : (
          <>
            <div className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                id={id}
                checked={showUploadImage}
                onChange={(event) => onToggleUpload(event.target.checked)}
                disabled={saving}
                className="h-3.5 w-3.5 accent-ad-green"
              />
              <label htmlFor={id} className="text-xs font-bold text-ad-green-dark">
                {label}
              </label>
            </div>
            {showUploadImage ? (
              <button
                type="button"
                onClick={onChooseClick}
                disabled={saving}
                className={`${checkboxBoxClass} hover:bg-gray-200 disabled:opacity-60`}
              >
                Choose image
              </button>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            />
          </>
        )}
      </div>
      {imageUrl ? (
        <ProfileImagePreviewModal
          open={previewOpen}
          title={previewTitle}
          imageUrl={imageUrl}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </>
  );
}

function ProfileStatusFooter({
  message,
  actions,
}: {
  message: string;
  actions: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-stretch justify-between gap-2 border-t border-ad-form-border bg-ad-form-bg">
      <div className="flex min-w-[180px] flex-1 items-center bg-ad-form-required-bg px-3 py-2.5 text-xs font-serif italic text-gray-800">
        {message}
      </div>
      <div className="flex items-center gap-2 px-3 py-2.5">{actions}</div>
    </div>
  );
}

function hasEstablishedPersonalProfile(user?: ShopProfileUser, city?: string): boolean {
  const phone = phoneDigits(user?.phone ?? "");
  return Boolean(
    user?.email?.trim() && phone.length >= 10 && (city?.trim() || user?.pincode?.trim())
  );
}

function hasEstablishedBusinessProfile(business?: ShopProfileBusiness, zipCode?: string): boolean {
  const phone = phoneDigits(business?.businessPhone ?? "");
  return Boolean(
    business?.businessName?.trim() &&
    business?.address?.trim() &&
    business?.city?.trim() &&
    phone.length >= 10 &&
    (zipCode?.trim() || business?.email?.trim())
  );
}

function ProfileFormFooter({
  message,
  saving,
  onSave,
  onReset,
  cancelLabel = "Cancel",
  saveLabel = "Update",
}: {
  message: string;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
  cancelLabel?: string;
  saveLabel?: string;
}) {
  const savingLabel = saveLabel === "Save" ? "Saving…" : "Updating…";
  return (
    <ProfileStatusFooter
      message={message}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded bg-ad-form-save px-6 py-1.5 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
          >
            {saving ? savingLabel : saveLabel}
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
  const [phone, setPhone] = useState(phoneDigits(user?.phone ?? ""));
  const [address, setAddress] = useState(user?.address ?? "");
  const [pincode, setPincode] = useState(user?.pincode ?? "");
  const [selectedCity, setSelectedCity] = useState(city ?? "");
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [showUploadImage, setShowUploadImage] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);

  const savedProfilePhotoUrl = useMemo(
    () => normalizeMediaUrl(user?.profilePhoto ?? null),
    [user?.profilePhoto]
  );

  const profileImageUrl = profilePhotoPreview ?? savedProfilePhotoUrl;

  useEffect(() => {
    if (!profilePhoto) {
      setProfilePhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(profilePhoto);
    setProfilePhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profilePhoto]);

  const isUpdating = useMemo(() => {
    if (savedOnce) return true;
    if (session?.meta?.isProfileComplete === true) return true;
    return hasEstablishedPersonalProfile(user, city);
  }, [savedOnce, session?.meta?.isProfileComplete, user, city]);

  const syncFromUser = () => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(phoneDigits(user?.phone ?? ""));
    setAddress(user?.address ?? "");
    setPincode(user?.pincode ?? "");
    setSelectedCity(city ?? "");
    setShowUploadImage(false);
    setProfilePhoto(null);
  };

  const reset = () => {
    syncFromUser();
  };

  useEffect(() => {
    syncFromUser();
  }, [user?.name, user?.email, user?.phone, user?.address, user?.pincode, user?.profilePhoto, city]);

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

  const handleUpdate = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const fields = {
        name: name.trim(),
        email: email.trim(),
        phone: phoneDigits(phone),
        countryCode: session?.meta?.countryCode ?? user?.countryCode ?? "+1",
        pincode: pincode.trim(),
        address: address.trim(),
        city: selectedCity.trim(),
      };
      const res = profilePhoto
        ? await updatePersonalProfileMultipart(token, { ...fields, profilePhoto })
        : await updatePersonalProfile(token, fields);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not save.");
        return;
      }
      setProfilePhoto(null);
      if (!isUpdating) setSavedOnce(true);
      toast.success(isUpdating ? "Profile updated." : "Profile saved.");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <CompactFormPanel
      footer={
        <ProfileFormFooter
          message={
            isUpdating
              ? "You are updating your personal profile"
              : "You are saving your personal profile"
          }
          saving={saving}
          saveLabel={isUpdating ? "Update" : "Save"}
          onSave={() => void handleUpdate()}
          onReset={reset}
        />
      }
    >
      <div className="space-y-4">
        <CompactFormRow>
          <CompactField label="Name">
            <input
              className={shopCompactInputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </CompactField>
          <CompactField label="Phone">
            <input
              className={shopCompactInputClass}
              value={formatPhoneDisplay(phone)}
              onChange={(e) => setPhone(phoneDigits(e.target.value))}
              disabled={saving}
            />
          </CompactField>
          <CompactField label="City">
            <select
              className={shopCompactInputClass}
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
          </CompactField>
          <CompactField label="Email">
            <input
              type="email"
              className={shopCompactInputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
            />
          </CompactField>
        </CompactFormRow>

        <CompactFormRow className="items-start" columns={4}>
          <div className="min-w-0 w-full">
            <ProfileImageUploadField
              id="shop-personal-upload-image"
              label="Upload Image"
              previewTitle="Profile image"
              imageUrl={profileImageUrl}
              saving={saving}
              showUploadImage={showUploadImage}
              onToggleUpload={setShowUploadImage}
              onChooseClick={() => fileInputRef.current?.click()}
              fileInputRef={fileInputRef}
              onFileChange={(file) => {
                setProfilePhoto(file);
                if (file) setShowUploadImage(true);
              }}
            />
          </div>
        </CompactFormRow>
      </div>
    </CompactFormPanel>
  );
}

export function ShopBusinessProfileEditor({
  business,
  zipCode,
  shopType: initialShopType,
  onSaved,
}: {
  business?: ShopProfileBusiness;
  zipCode?: string;
  shopType?: string;
  onSaved: () => void;
}) {
  const { token, session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [businessName, setBusinessName] = useState(business?.businessName ?? "");
  const [businessPhone, setBusinessPhone] = useState(phoneDigits(business?.businessPhone ?? ""));
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
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);

  const savedLogoUrl = useMemo(
    () => normalizeMediaUrl(business?.businessLogo ?? null),
    [business?.businessLogo]
  );

  const logoImageUrl = logoPreview ?? savedLogoUrl;

  useEffect(() => {
    if (!logo) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logo);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logo]);

  const isUpdating = useMemo(() => {
    if (savedOnce) return true;
    if (session?.meta?.isAutoShopBusinessProfileComplete === true) return true;
    return hasEstablishedBusinessProfile(business, zipCode);
  }, [savedOnce, session?.meta?.isAutoShopBusinessProfileComplete, business, zipCode]);

  const syncFromBusiness = () => {
    setBusinessName(business?.businessName ?? "");
    setBusinessPhone(phoneDigits(business?.businessPhone ?? ""));
    setCity(business?.city ?? "");
    setZip(zipCode ?? "");
    setAddress(business?.address ?? "");
    setEmail(business?.email ?? "");
    setHst(business?.hstNumber ?? "");
    setTax(business?.gstPercent != null ? String(business.gstPercent) : "");
    setShopType(normalizeShopType(initialShopType ?? business?.shopType));
    setShowUploadImage(false);
    setLogo(null);
  };

  const reset = () => {
    syncFromBusiness();
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
    business?.businessLogo,
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

  const handleUpdate = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const fields: Record<string, string | File> = {
        businessName: businessName.trim(),
        businessPhone: phoneDigits(businessPhone),
        city: city.trim(),
        businessAddress: address.trim(),
        businessEmail: email.trim(),
        businessHSTNumber: hst.trim(),
        gst: tax.trim() || "0",
        shopType,
      };
      if (logo) fields.businessLogo = logo;
      const res = await updateBusinessProfileMultipart(token, fields);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not save.");
        return;
      }
      setLogo(null);
      if (!isUpdating) setSavedOnce(true);
      toast.success(isUpdating ? "Business profile updated." : "Business profile saved.");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <CompactFormPanel
      footer={
        <ProfileFormFooter
          message={
            isUpdating
              ? "You are updating your business profile"
              : "You are saving your business profile"
          }
          saving={saving}
          saveLabel={isUpdating ? "Update" : "Save"}
          onSave={() => void handleUpdate()}
          onReset={reset}
        />
      }
    >
      <div className="space-y-4">
        <CompactFormRow>
          <CompactField label="Business Name">
            <input
              className={shopCompactInputClass}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={saving}
            />
          </CompactField>
          <CompactField label="Business Phone">
            <input
              className={shopCompactInputClass}
              value={formatPhoneDisplay(businessPhone)}
              onChange={(e) => setBusinessPhone(phoneDigits(e.target.value))}
              disabled={saving}
            />
          </CompactField>
          <CompactField label="City">
            <select
              className={shopCompactInputClass}
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
          </CompactField>
          <CompactField label="Address">
            <input
              className={shopCompactInputClass}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={saving}
            />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow>
          <CompactField label="Zip Code">
            <input
              className={shopCompactInputClass}
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              disabled={saving}
            />
          </CompactField>
          <CompactField label="HST No.">
            <input
              className={shopCompactInputClass}
              value={hst}
              onChange={(e) => setHst(e.target.value)}
              disabled={saving}
            />
          </CompactField>
          <CompactField label="Tax %">
            <input
              className={shopCompactInputClass}
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              disabled={saving}
            />
          </CompactField>
          <CompactField label="E mail">
            <input
              type="email"
              className={shopCompactInputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
            />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow className="items-start" columns={4}>
          <div className="min-w-0 w-full">
            <ProfileImageUploadField
              id="shop-business-upload-image"
              label="Upload Logo"
              previewTitle="Business logo"
              imageUrl={logoImageUrl}
              saving={saving}
              showUploadImage={showUploadImage}
              onToggleUpload={setShowUploadImage}
              onChooseClick={() => fileInputRef.current?.click()}
              fileInputRef={fileInputRef}
              onFileChange={(file) => {
                setLogo(file);
                if (file) setShowUploadImage(true);
              }}
            />
          </div>
        </CompactFormRow>
      </div>
    </CompactFormPanel>
  );
}

type ShopHoursFormMode = "edit";

function ShopHoursFormFooter({
  saving,
  onSave,
  onCancel,
}: {
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <ProfileFormFooter
      message="You are updating your opening timings"
      saving={saving}
      saveLabel="Update"
      onSave={onSave}
      onReset={onCancel}
    />
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
    resolveShopOpenHoursSchedule(perDayOpenHours)
  );
  const [formMode, setFormMode] = useState<ShopHoursFormMode | null>(null);
  const [editingDay, setEditingDay] = useState<WeekDay | null>(null);
  const [formDay, setFormDay] = useState<WeekDay>("Monday");
  const [formOpen, setFormOpen] = useState(true);
  const [formStart, setFormStart] = useState("09:00");
  const [formEnd, setFormEnd] = useState("20:00");
  const [saving, setSaving] = useState(false);

  const resetFormFields = (day: WeekDay = "Monday") => {
    const entry = schedule[day];
    setFormDay(day);
    setFormOpen(entry.enabled);
    setFormStart(entry.start);
    setFormEnd(entry.end);
  };

  useEffect(() => {
    if (USE_DUMMY_SHOP_OPEN_HOURS) return;
    setSchedule(resolveShopOpenHoursSchedule(perDayOpenHours));
  }, [perDayOpenHours]);

  const openEditForm = (day: WeekDay) => {
    setEditingDay(day);
    resetFormFields(day);
    setFormMode("edit");
  };

  const closeForm = () => {
    setEditingDay(null);
    setFormMode(null);
  };

  const applyFormToSchedule = (): PerDaySchedule => ({
    ...schedule,
    [formDay]: {
      enabled: formOpen,
      start: formStart,
      end: formEnd,
    },
  });

  const handleSave = async () => {
    const nextSchedule = applyFormToSchedule();
    if (USE_DUMMY_SHOP_OPEN_HOURS) {
      setSchedule(nextSchedule);
      toast.success("Hours updated.");
      closeForm();
      return;
    }
    if (!token) return;
    setSaving(true);
    try {
      const res = await updateBusinessOpenHours(token, serializePerDayOpenHoursForApi(nextSchedule));
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not save hours.");
        return;
      }
      setSchedule(nextSchedule);
      toast.success("Hours updated.");
      onSaved();
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const showForm = formMode === "edit";

  return (
    <div className="space-y-4">
      <ShopReveal show={showForm}>
        <CompactFormPanel
          footer={
            <ShopHoursFormFooter
              saving={saving}
              onSave={() => void handleSave()}
              onCancel={closeForm}
            />
          }
        >
          <CompactFormRow>
            <CompactField label="Day">
              <input
                type="text"
                readOnly
                value={shortDayLabel(formDay)}
                className={`${shopCompactInputClass} bg-gray-50`}
              />
            </CompactField>
            <CompactField label="Status">
              <select
                value={formOpen ? "open" : "closed"}
                disabled={saving}
                onChange={(e) => setFormOpen(e.target.value === "open")}
                className={shopCompactInputClass}
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </CompactField>
            <CompactField label="Opening time">
              <OpenHoursTimePicker
                id="shop-hours-opening"
                value={formStart}
                disabled={!formOpen || saving}
                onChange={setFormStart}
              />
            </CompactField>
            <CompactField label="Closing Time">
              <OpenHoursTimePicker
                id="shop-hours-closing"
                value={formEnd}
                disabled={!formOpen || saving}
                onChange={setFormEnd}
              />
            </CompactField>
          </CompactFormRow>
        </CompactFormPanel>
      </ShopReveal>

      <motion.div
        layout
        transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
        className="shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className={SHOP_TABLE.table}>
            <thead>
              <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
                <th className={SHOP_TABLE.th}>Day</th>
                <th className={SHOP_TABLE.th}>Status</th>
                <th className={SHOP_TABLE.th}>Timing</th>
                <th className={`${SHOP_TABLE.th} text-center`}>Edit</th>
              </tr>
            </thead>
            <tbody>
              {WEEK_DAYS.map((day, index) => {
                const entry = schedule[day];
                const isEditingRow = editingDay === day;
                return (
                  <tr
                    key={day}
                    className={
                      isEditingRow ? "bg-ad-form-required-bg" : adminPanelRowClass(index)
                    }
                  >
                    <td className={`${SHOP_TABLE.td} font-semibold text-blue-700`}>
                      {shortDayLabel(day)}
                    </td>
                    <td
                      className={`${SHOP_TABLE.td} font-semibold ${entry.enabled ? "text-ad-purple" : "text-gray-500"}`}
                    >
                      {entry.enabled ? "Open" : "Closed"}
                    </td>
                    <td className={SHOP_TABLE.td}>
                      {entry.enabled ? formatOpenHoursRangeDisplay(entry.start, entry.end) : "—"}
                    </td>
                    <td className={`${SHOP_TABLE.td} text-center`}>
                      <button
                        type="button"
                        title={`Edit ${day}`}
                        aria-label={`Edit ${day}`}
                        disabled={saving}
                        onClick={() => openEditForm(day)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded text-black hover:text-ad-purple disabled:opacity-60"
                      >
                        <FiEdit2 size={13} aria-hidden />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
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

const CAR_BRANDS_PER_PAGE = 10;

export function ShopCarBrandList({
  brands,
  savingBrandId,
  onRemove,
}: {
  brands: ShopCarCompany[];
  savingBrandId?: string | null;
  onRemove: (company: ShopCarCompany) => void;
}) {
  const [previewBrand, setPreviewBrand] = useState<ShopCarCompany | null>(null);
  const sortedBrands = useMemo(
    () =>
      [...brands].sort((a, b) =>
        getCarBrandName(a).localeCompare(getCarBrandName(b), undefined, { sensitivity: "base" })
      ),
    [brands]
  );

  const tableColumns = useMemo(
    () => [
      {
        key: "name",
        label: "Name of Car Brand",
        render: (company: ShopCarCompany) =>
          tableCell(
            <span className="font-medium text-blue-700">{getCarBrandName(company)}</span>,
            undefined,
            true,
          ),
        exportValue: (company: ShopCarCompany) => getCarBrandName(company),
      },
      {
        key: "emblem",
        label: "Amblem",
        render: (company: ShopCarCompany) => {
          const name = getCarBrandName(company);
          return tableCell(
            <button
              type="button"
              title={`View ${name} emblem`}
              aria-label={`View ${name} emblem`}
              onClick={() => setPreviewBrand(company)}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 0,
                color: "#2563eb",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <FiPaperclip size={16} aria-hidden />
            </button>,
            undefined,
            true,
          );
        },
        exportValue: () => "",
      },
    ],
    []
  );

  return (
    <>
      <AdminDataTable
        items={sortedBrands}
        columns={tableColumns}
        getRowId={(company) => getCarBrandId(company)}
        pageSize={CAR_BRANDS_PER_PAGE}
        pageSizeOptions={[10, 25, 50]}
        showStandardToolbar={false}
        showColSelector={false}
        showSearch={false}
        compact
        exportFilename="car-brands"
        renderActions={(company) => {
          const id = getCarBrandId(company);
          const name = getCarBrandName(company);
          return (
            <button
              type="button"
              title={`Remove ${name}`}
              aria-label={`Remove ${name}`}
              disabled={savingBrandId === id}
              onClick={() => onRemove(company)}
              style={{
                border: "none",
                background: "transparent",
                cursor: savingBrandId === id ? "not-allowed" : "pointer",
                color: "#dc2626",
                opacity: savingBrandId === id ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 4,
              }}
            >
              <FiX size={16} aria-hidden />
            </button>
          );
        }}
      />
      {previewBrand ? (
        <ProfileImagePreviewModal
          open
          title={`${getCarBrandName(previewBrand)} emblem`}
          imageUrl={resolveCarBrandLogo(previewBrand)}
          onClose={() => setPreviewBrand(null)}
        />
      ) : null}
    </>
  );
}

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
          saveLabel="Save"
          onSave={() => void handleSave()}
          onReset={reset}
          cancelLabel="Cancel"
        />
      }
    >
      <CompactFormRow className="items-start">
        <CompactField label="Name">
          <select
            className={shopCompactInputClass}
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
        <CompactField label="Amblem">
          <div className={CAR_BRAND_EMBLEM_SLOT_CLASS}>
            {brandId ? (
              <CarBrandLogo company={selected} className={CAR_BRAND_EMBLEM_LOGO_CLASS} />
            ) : (
              <span className="text-xs text-gray-400">Select a brand</span>
            )}
          </div>
        </CompactField>
      </CompactFormRow>
    </CompactFormPanel>
  );
}

export function ShopServiceList({
  services,
  savingServiceId,
  onRemove,
}: {
  services: ShopServiceCategory[];
  savingServiceId?: string | null;
  onRemove: (service: ShopServiceCategory) => void;
}) {
  const sortedServices = useMemo(
    () =>
      [...services].sort((a, b) =>
        getServiceName(a).localeCompare(getServiceName(b), undefined, { sensitivity: "base" })
      ),
    [services]
  );

  const tableColumns = useMemo(
    () => [
      {
        key: "name",
        label: "Main Service",
        render: (service: ShopServiceCategory) =>
          tableCell(
            <span className="font-medium text-blue-700">{getServiceName(service)}</span>,
            undefined,
            true,
          ),
        exportValue: (service: ShopServiceCategory) => getServiceName(service),
      },
      {
        key: "shopType",
        label: "Match with",
        render: (service: ShopServiceCategory) =>
          tableCell(getShopTypeLabel(service.shopType), undefined, true),
        exportValue: (service: ShopServiceCategory) => getShopTypeLabel(service.shopType),
      },
    ],
    []
  );

  return (
    <AdminDataTable
      items={sortedServices}
      columns={tableColumns}
      getRowId={(service) => getServiceId(service)}
      showStandardToolbar={false}
      showColSelector={false}
      showSearch={false}
      compact
      exportFilename="operational-services"
      renderActions={(service) => {
        const id = getServiceId(service);
        const name = getServiceName(service);
        return (
          <button
            type="button"
            title={`Remove ${name}`}
            aria-label={`Remove ${name}`}
            disabled={savingServiceId === id}
            onClick={() => onRemove(service)}
            style={{
              border: "none",
              background: "transparent",
              cursor: savingServiceId === id ? "not-allowed" : "pointer",
              color: "#dc2626",
              opacity: savingServiceId === id ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 4,
            }}
          >
            <FiX size={16} aria-hidden />
          </button>
        );
      }}
    />
  );
}

export function ShopServiceAddEditor({
  services,
  selectedIds,
  shopType,
  editingId,
  onSaved,
  onClose,
  onSaveService,
}: {
  services: ShopServiceCategory[];
  selectedIds: Set<string>;
  shopType?: string | null;
  editingId?: string | null;
  onSaved: (id: string) => void;
  onClose?: () => void;
  /** When set, handles save locally. Return true if handled, false to fall through to API. */
  onSaveService?: (id: string, replacesId?: string) => Promise<boolean> | boolean;
}) {
  const { token } = useAuth();
  const defaultVendorType = normalizeShopType(shopType);
  const [vendorType, setVendorType] = useState<ShopType>(defaultVendorType);
  const shopTypeFiltered = filterServicesByShopType(services, vendorType);
  const available = shopTypeFiltered.filter((service) => {
    const id = getServiceId(service);
    return id && (!selectedIds.has(id) || id === editingId);
  });
  const [serviceId, setServiceId] = useState(editingId ?? "");
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(editingId);

  useEffect(() => {
    if (editingId) {
      const editing = services.find((service) => getServiceId(service) === editingId);
      setVendorType(normalizeShopType(editing?.shopType ?? shopType));
      setServiceId(editingId);
      return;
    }
    setVendorType(defaultVendorType);
    setServiceId("");
  }, [defaultVendorType, editingId, services, shopType]);

  const handleVendorTypeChange = (nextType: ShopType) => {
    setVendorType(nextType);
    const stillAvailable = filterServicesByShopType(services, nextType).some(
      (service) => getServiceId(service) === serviceId
    );
    if (!stillAvailable) setServiceId("");
  };

  const handleCancel = () => {
    setServiceId("");
    setVendorType(defaultVendorType);
    onClose?.();
  };

  const handleSave = async () => {
    if (!serviceId) {
      toast.error("Please select a service.");
      return;
    }
    if (isEditing && serviceId === editingId) {
      handleCancel();
      return;
    }

    const nextIds = isEditing
      ? [...selectedIds].filter((id) => id !== editingId).concat(serviceId)
      : [...selectedIds, serviceId];

    setSaving(true);
    try {
      if (onSaveService) {
        const handled = await onSaveService(serviceId, editingId ?? undefined);
        if (handled) {
          toast.success(isEditing ? "Service updated." : "Service added.");
          setServiceId("");
          onSaved(serviceId);
          return;
        }
      }
      if (!token) return;
      const res = await updateServiceWeWorkWith(token, nextIds);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not save.");
        return;
      }
      toast.success(isEditing ? "Service updated." : "Service added.");
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
          message={isEditing ? "You are updating a service" : "You are adding a service"}
          saving={saving}
          saveLabel={isEditing ? "Update" : "Save"}
          onSave={() => void handleSave()}
          onReset={handleCancel}
          cancelLabel="Cancel"
        />
      }
    >
      <CompactFormRow className="items-end">
        <CompactField label="Main Service">
          <select
            className={shopCompactInputClass}
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            disabled={!isEditing && available.length === 0}
          >
            <option value="">
              {!isEditing && available.length === 0
                ? "All services already added"
                : "Select service"}
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
        <CompactField label="Vendor Type">
          <select
            className={shopCompactInputClass}
            value={vendorType}
            onChange={(e) => handleVendorTypeChange(normalizeShopType(e.target.value))}
          >
            {SHOP_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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
