import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { FiEdit2, FiPaperclip, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { getJson } from "../../../api/mobileAuth";
import {
  CompactField,
  CompactFormPanel,
  CompactFormRow,
} from "../../admin/ContentPanel";
import {
  ADMIN_PANEL_THEAD_ROW_CLASS,
  adminPanelRowClass,
  adminPanelTableClasses,
  type AdminPanelTableClasses,
} from "../../admin/adminPanelTableStyles";

const SHOP_TABLE_BASE = adminPanelTableClasses(true);
const SHOP_TABLE: AdminPanelTableClasses = {
  ...SHOP_TABLE_BASE,
  th: SHOP_TABLE_BASE.th.replace("px-2", "px-4"),
  thCheckbox: SHOP_TABLE_BASE.thCheckbox.replace("px-2", "px-4"),
  td: SHOP_TABLE_BASE.td.replace("px-2", "px-4"),
  tdCheckbox: SHOP_TABLE_BASE.tdCheckbox.replace("px-2", "px-4"),
};
import { shopCompactInputClass, shopProfileEditingRowClass, shopProfileFormPanelClass, shopProfileFormPanelFooterClass } from "../shopLayoutStyles";
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
  formatOpenHoursTimeTable,
  nextWeekdayDateISO,
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
  CAR_BRAND_EMBLEM_ADD_SLOT_CLASS,
  CAR_BRAND_EMBLEM_LOGO_CLASS,
} from "../CarBrandLogo";
import { getCarBrandId, getCarBrandName } from "../../../lib/dummyCarBrands";
import { getServiceId, getServiceName } from "../../../lib/dummyServices";
import { parseCitiesApiResponse } from "../../../lib/carOwnerCities";
import { normalizeMediaUrl } from "../../../lib/normalizeMediaUrl";
import { shopSaveButtonClass } from "./ShopFormPage";
import { ShopReveal } from "../ShopAnimated";
import { ShopLoadingPanel } from "../ShopPanels";
import { motion } from "framer-motion";

const checkboxBoxClass =
  "inline-block border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs text-gray-800";

const shopHoursBulkButtonClass =
  "rounded border border-ad-purple bg-white px-3 py-1 text-xs font-bold text-ad-purple hover:bg-[#f5cce8] disabled:cursor-not-allowed disabled:opacity-60";

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
    <div className={`flex flex-wrap items-center justify-between gap-2 px-4 py-1 ${shopProfileFormPanelFooterClass}`}>
      <div className="flex min-w-[180px] flex-1 items-center text-xs font-serif italic text-gray-800">
        {message}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
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
            className="inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded bg-ad-form-save px-5 py-1 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
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
      className={shopProfileFormPanelClass}
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
      className={shopProfileFormPanelClass}
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

type ShopHoursFormMode = "add" | "edit";

function ShopHoursFormFooter({
  mode,
  saving,
  onSave,
  onCancel,
}: {
  mode: ShopHoursFormMode;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <ProfileFormFooter
      message={
        mode === "add"
          ? "You are creating the daily working schedule of your Workshop"
          : "You are updating your opening timings"
      }
      saving={saving}
      saveLabel={mode === "add" ? "Save" : "Update"}
      onSave={onSave}
      onReset={onCancel}
    />
  );
}

export function ShopOpenHoursEditor({
  perDayOpenHours,
  onSaved,
  showAddForm = false,
  onAddFormClose,
  headerAction,
}: {
  perDayOpenHours?: string;
  onSaved: () => void;
  showAddForm?: boolean;
  onAddFormClose?: () => void;
  headerAction?: ReactNode;
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
  const [selectedDays, setSelectedDays] = useState<Set<WeekDay>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  const allDaysSelected = WEEK_DAYS.every((day) => selectedDays.has(day));
  const someDaysSelected = selectedDays.size > 0 && !allDaysSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someDaysSelected;
    }
  }, [someDaysSelected]);

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

  useEffect(() => {
    if (!showAddForm) return;
    setEditingDay(null);
    resetFormFields("Monday");
    setFormMode("add");
  }, [showAddForm]);

  const openEditForm = (day: WeekDay) => {
    setEditingDay(day);
    resetFormFields(day);
    setFormMode("edit");
  };

  const closeForm = () => {
    const wasAdd = formMode === "add";
    setEditingDay(null);
    setFormMode(null);
    if (wasAdd) onAddFormClose?.();
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

  const toggleDaySelection = (day: WeekDay) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const toggleAllDays = () => {
    setSelectedDays(allDaysSelected ? new Set() : new Set(WEEK_DAYS));
  };

  const applyBulkStatus = async (open: boolean) => {
    if (selectedDays.size === 0) return;

    const nextSchedule = { ...schedule };
    for (const day of selectedDays) {
      nextSchedule[day] = { ...nextSchedule[day], enabled: open };
    }

    if (USE_DUMMY_SHOP_OPEN_HOURS) {
      setSchedule(nextSchedule);
      toast.success(open ? "Selected days opened." : "Selected days closed.");
      setSelectedDays(new Set());
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
      toast.success(open ? "Selected days opened." : "Selected days closed.");
      onSaved();
      setSelectedDays(new Set());
    } finally {
      setSaving(false);
    }
  };

  const showForm = formMode === "add" || formMode === "edit";
  const hasBulkSelection = selectedDays.size > 0;

  return (
    <div className="space-y-1">
      {!showForm ? (
        <div className="flex min-h-[2rem] items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void applyBulkStatus(true)}
              disabled={!hasBulkSelection || saving}
              className={shopHoursBulkButtonClass}
            >
              Open All
            </button>
            <button
              type="button"
              onClick={() => void applyBulkStatus(false)}
              disabled={!hasBulkSelection || saving}
              className={shopHoursBulkButtonClass}
            >
              Close All
            </button>
          </div>
          {headerAction ? <div className="flex shrink-0 items-center">{headerAction}</div> : null}
        </div>
      ) : null}
      <ShopReveal show={showForm}>
        <CompactFormPanel
          className={shopProfileFormPanelClass}
          showBottomBorder={false}
          footer={
            <ShopHoursFormFooter
              mode={formMode === "edit" ? "edit" : "add"}
              saving={saving}
              onSave={() => void handleSave()}
              onCancel={closeForm}
            />
          }
        >
          <CompactFormRow>
            <CompactField label="Day">
              {formMode === "edit" ? (
                <input
                  type="text"
                  readOnly
                  value={shortDayLabel(formDay)}
                  className={`${shopCompactInputClass} bg-gray-50`}
                />
              ) : (
                <select
                  value={formDay}
                  disabled={saving}
                  onChange={(e) => {
                    const day = e.target.value as WeekDay;
                    setFormDay(day);
                    resetFormFields(day);
                  }}
                  className={shopCompactInputClass}
                >
                  {WEEK_DAYS.map((day) => (
                    <option key={day} value={day}>
                      {shortDayLabel(day)}
                    </option>
                  ))}
                </select>
              )}
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
                <th className={SHOP_TABLE.thCheckbox}>
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allDaysSelected}
                    onChange={toggleAllDays}
                    aria-label="Select all days"
                    className="h-3.5 w-3.5 accent-ad-purple"
                  />
                </th>
                <th className={SHOP_TABLE.th}>Date</th>
                <th className={SHOP_TABLE.th}>Day</th>
                <th className={SHOP_TABLE.th}>Open</th>
                <th className={SHOP_TABLE.th}>Close</th>
                <th className={SHOP_TABLE.th}>Status</th>
                <th className={`${SHOP_TABLE.th} text-center`}>Edit</th>
              </tr>
            </thead>
            <tbody>
              {WEEK_DAYS.map((day, index) => {
                const entry = schedule[day];
                const isEditingRow = editingDay === day;
                const isClosed = !entry.enabled;
                return (
                  <tr
                    key={day}
                    className={
                      isEditingRow ? shopProfileEditingRowClass : adminPanelRowClass(index)
                    }
                  >
                    <td className={SHOP_TABLE.tdCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedDays.has(day)}
                        onChange={() => toggleDaySelection(day)}
                        aria-label={`Select ${day}`}
                        className="h-3.5 w-3.5 accent-ad-purple"
                      />
                    </td>
                    <td
                      className={`${SHOP_TABLE.td} font-semibold ${isClosed ? "text-ad-purple" : "text-blue-700"}`}
                    >
                      {nextWeekdayDateISO(day)}
                    </td>
                    <td
                      className={`${SHOP_TABLE.td} font-semibold ${isClosed ? "text-ad-purple" : "text-gray-800"}`}
                    >
                      {shortDayLabel(day)}
                    </td>
                    <td className={`${SHOP_TABLE.td} ${isClosed ? "text-ad-purple" : ""}`}>
                      {entry.enabled ? formatOpenHoursTimeTable(entry.start) : "—"}
                    </td>
                    <td className={`${SHOP_TABLE.td} ${isClosed ? "text-ad-purple" : ""}`}>
                      {entry.enabled ? formatOpenHoursTimeTable(entry.end) : "—"}
                    </td>
                    <td className={`${SHOP_TABLE.td} font-semibold ${isClosed ? "text-ad-purple" : ""}`}>
                      {entry.enabled ? "Open" : "Closed"}
                    </td>
                    <td className={`${SHOP_TABLE.td} text-center`}>
                      <button
                        type="button"
                        title={`Edit ${day}`}
                        aria-label={`Edit ${day}`}
                        disabled={saving}
                        onClick={() => openEditForm(day)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded text-blue-600 hover:text-ad-purple disabled:opacity-60"
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

const CAR_BRAND_EMBLEM_TOOLTIP_HEIGHT_PX = 50;
const CAR_BRAND_EMBLEM_TOOLTIP_WIDTH_PX = 75;
const CAR_BRAND_EMBLEM_TOOLTIP_GAP_PX = 4;

function CarBrandEmblemTooltip({ company }: { company: ShopCarCompany }) {
  const name = getCarBrandName(company);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setCoords({
      top: Math.max(
        8,
        rect.top - CAR_BRAND_EMBLEM_TOOLTIP_HEIGHT_PX - CAR_BRAND_EMBLEM_TOOLTIP_GAP_PX
      ),
      left: rect.left + rect.width / 2,
    });
  }, []);

  const showTooltip = () => {
    updatePosition();
    setOpen(true);
  };

  const hideTooltip = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-flex h-7 w-7 cursor-default items-center justify-center rounded text-blue-600 hover:text-ad-purple"
        aria-label={`${name} emblem`}
        tabIndex={0}
      >
        <FiPaperclip size={13} aria-hidden />
      </span>
      {open
        ? createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[10000] -translate-x-1/2"
            style={{ top: coords.top, left: coords.left }}
          >
            <div
              className="flex items-center justify-center overflow-hidden rounded border border-gray-300 bg-white shadow-lg"
              style={{
                height: CAR_BRAND_EMBLEM_TOOLTIP_HEIGHT_PX,
                width: CAR_BRAND_EMBLEM_TOOLTIP_WIDTH_PX,
              }}
            >
              <CarBrandLogo
                company={company}
                className="h-full w-full object-contain"
                alt={`${name} emblem`}
              />
            </div>
          </div>,
          document.body
        )
        : null}
    </>
  );
}

export function ShopCarBrandList({
  brands,
  savingBrandId,
  onRemove,
}: {
  brands: ShopCarCompany[];
  savingBrandId?: string | null;
  onRemove: (company: ShopCarCompany) => void;
}) {
  const sortedBrands = useMemo(
    () =>
      [...brands].sort((a, b) =>
        getCarBrandName(a).localeCompare(getCarBrandName(b), undefined, { sensitivity: "base" })
      ),
    [brands]
  );
  const actionHeadClass = SHOP_TABLE.th.replace("text-left", "text-center");

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className="shop-hero-surface rounded border border-gray-300 bg-white shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className={SHOP_TABLE.table}>
          <thead>
            <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
              <th className={SHOP_TABLE.th}>Name of Car Brand</th>
              <th className={actionHeadClass}>Amblem</th>
              <th className={actionHeadClass}>Remove</th>
            </tr>
          </thead>
          <tbody>
            {sortedBrands.map((company, index) => {
              const id = getCarBrandId(company);
              const name = getCarBrandName(company);
              const isSaving = savingBrandId === id;
              return (
                <tr key={id} className={adminPanelRowClass(index)}>
                  <td className={`${SHOP_TABLE.td} font-semibold text-blue-700`}>{name}</td>
                  <td className={SHOP_TABLE.td}>
                    <div className="flex justify-center">
                      <CarBrandEmblemTooltip company={company} />
                    </div>
                  </td>
                  <td className={SHOP_TABLE.td}>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        title={`Delete ${name}`}
                        aria-label={`Delete ${name}`}
                        disabled={isSaving}
                        onClick={() => onRemove(company)}
                        className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-semibold text-ad-purple-dark hover:text-ad-purple disabled:opacity-60"
                      >
                        <FiTrash2 size={13} aria-hidden />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
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
      className={shopProfileFormPanelClass}
      showBottomBorder={false}
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
      <CompactFormRow className="grid-cols-3 items-stretch">
        <div className="flex min-w-0 items-center justify-center">
          <img
            src="/logo.png"
            alt="AutoDaddy"
            className="h-14 w-auto object-contain"
          />
        </div>
        <div className="flex min-w-0 items-start justify-center">
          <CompactField label="Name" className="w-40 sm:w-48">
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
        </div>
        <div className="flex min-w-0 items-start justify-center">
          <CompactField label="Amblem" className="w-auto shrink-0">
            <div className={CAR_BRAND_EMBLEM_ADD_SLOT_CLASS}>
              {brandId ? (
                <CarBrandLogo company={selected} className={CAR_BRAND_EMBLEM_LOGO_CLASS} />
              ) : (
                <span className="text-xs text-gray-400" aria-hidden>
                  —
                </span>
              )}
            </div>
          </CompactField>
        </div>
      </CompactFormRow>
    </CompactFormPanel>
  );
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatServiceTableDate(service: ShopServiceCategory): string {
  const raw = service.createdAt ?? service.updatedAt;
  if (raw && raw.length >= 10) return raw.slice(0, 10);
  return todayISODate();
}

function getServiceStatusLabel(service: ShopServiceCategory): string {
  return service.isActive === false ? "Inactive" : "Active";
}

export type ShopServiceFormMeta = {
  createdAt: string;
  isActive: boolean;
};

export function ShopServiceList({
  services,
  checkedIds,
  savingServiceId,
  editingServiceId,
  onToggleChecked,
  onToggleAllChecked,
  onEdit,
}: {
  services: ShopServiceCategory[];
  checkedIds: Set<string>;
  savingServiceId?: string | null;
  editingServiceId?: string | null;
  onToggleChecked: (id: string) => void;
  onToggleAllChecked: () => void;
  onEdit: (service: ShopServiceCategory) => void;
}) {
  const sortedServices = useMemo(
    () =>
      [...services].sort((a, b) =>
        getServiceName(a).localeCompare(getServiceName(b), undefined, { sensitivity: "base" })
      ),
    [services]
  );
  const editHeadClass = `${SHOP_TABLE.th} text-center`;
  const selectAllRef = useRef<HTMLInputElement>(null);
  const visibleIds = useMemo(
    () => sortedServices.map((service) => getServiceId(service)),
    [sortedServices]
  );
  const allServicesChecked =
    visibleIds.length > 0 && visibleIds.every((id) => checkedIds.has(id));
  const someServicesChecked = checkedIds.size > 0 && !allServicesChecked;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someServicesChecked;
    }
  }, [someServicesChecked]);

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className="shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className={SHOP_TABLE.table}>
          <thead>
            <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
              <th className={SHOP_TABLE.thCheckbox}>
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allServicesChecked}
                  onChange={onToggleAllChecked}
                  aria-label="Select all services"
                  className="h-3.5 w-3.5 accent-ad-purple"
                />
              </th>
              <th className={SHOP_TABLE.th}>Name of Service</th>
              <th className={SHOP_TABLE.th}>Vendor Type</th>
              <th className={SHOP_TABLE.th}>Date</th>
              <th className={SHOP_TABLE.th}>Status</th>
              <th className={editHeadClass}>Edit</th>
            </tr>
          </thead>
          <tbody>
            {sortedServices.map((service, index) => {
              const id = getServiceId(service);
              const name = getServiceName(service);
              const isEditingRow = editingServiceId === id;
              const isInactive = service.isActive === false;
              const isSaving = savingServiceId === id;
              return (
                <tr
                  key={id}
                  className={
                    isEditingRow ? shopProfileEditingRowClass : adminPanelRowClass(index)
                  }
                >
                  <td className={SHOP_TABLE.tdCheckbox}>
                    <input
                      type="checkbox"
                      checked={checkedIds.has(id)}
                      onChange={() => onToggleChecked(id)}
                      aria-label={`Select ${name}`}
                      disabled={isSaving}
                      className="h-3.5 w-3.5 accent-ad-purple disabled:opacity-60"
                    />
                  </td>
                  <td
                    className={`${SHOP_TABLE.td} font-semibold ${isInactive ? "text-ad-purple" : "text-blue-700"}`}
                  >
                    {name}
                  </td>
                  <td
                    className={`${SHOP_TABLE.td} font-semibold ${isInactive ? "text-ad-purple" : "text-gray-800"}`}
                  >
                    {getShopTypeLabel(service.shopType)}
                  </td>
                  <td className={`${SHOP_TABLE.td} ${isInactive ? "text-ad-purple" : ""}`}>
                    {formatServiceTableDate(service)}
                  </td>
                  <td
                    className={`${SHOP_TABLE.td} font-semibold ${isInactive ? "text-ad-purple" : ""}`}
                  >
                    {getServiceStatusLabel(service)}
                  </td>
                  <td className={`${SHOP_TABLE.td} text-center`}>
                    <button
                      type="button"
                      title={`Edit ${name}`}
                      aria-label={`Edit ${name}`}
                      disabled={isSaving}
                      onClick={() => onEdit(service)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded text-blue-600 hover:text-ad-purple disabled:opacity-60"
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
  );
}

export function ShopServiceAddEditor({
  services,
  selectedIds,
  selectedServices,
  shopType,
  editingId,
  onSaved,
  onClose,
  onSaveService,
}: {
  services: ShopServiceCategory[];
  selectedIds: Set<string>;
  selectedServices?: ShopServiceCategory[];
  shopType?: string | null;
  editingId?: string | null;
  onSaved: (id: string) => void;
  onClose?: () => void;
  /** When set, handles save locally. Return true if handled, false to fall through to API. */
  onSaveService?: (
    id: string,
    replacesId?: string,
    meta?: ShopServiceFormMeta
  ) => Promise<boolean> | boolean;
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
  const [serviceDate, setServiceDate] = useState(todayISODate());
  const [serviceActive, setServiceActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(editingId);

  const resetFormFields = (nextServiceId = "", nextDate = todayISODate(), nextActive = true) => {
    setServiceId(nextServiceId);
    setServiceDate(nextDate);
    setServiceActive(nextActive);
  };

  useEffect(() => {
    if (editingId) {
      const editing =
        selectedServices?.find((service) => getServiceId(service) === editingId) ??
        services.find((service) => getServiceId(service) === editingId);
      setVendorType(normalizeShopType(editing?.shopType ?? shopType));
      resetFormFields(
        editingId,
        formatServiceTableDate(editing ?? { id: editingId, subServices: [] }),
        editing?.isActive !== false
      );
      return;
    }
    setVendorType(defaultVendorType);
    resetFormFields();
  }, [defaultVendorType, editingId, selectedServices, services, shopType]);

  const handleVendorTypeChange = (nextType: ShopType) => {
    setVendorType(nextType);
    const stillAvailable = filterServicesByShopType(services, nextType).some(
      (service) => getServiceId(service) === serviceId
    );
    if (!stillAvailable) setServiceId("");
  };

  const handleCancel = () => {
    resetFormFields();
    setVendorType(defaultVendorType);
    onClose?.();
  };

  const handleSave = async () => {
    if (!serviceId) {
      toast.error("Please select a service.");
      return;
    }

    const meta: ShopServiceFormMeta = {
      createdAt: serviceDate,
      isActive: serviceActive,
    };

    if (isEditing && serviceId === editingId) {
      setSaving(true);
      try {
        if (onSaveService) {
          const handled = await onSaveService(serviceId, undefined, meta);
          if (handled) {
            toast.success("Service updated.");
            onSaved(serviceId);
            return;
          }
        }
        if (!token) return;
        toast.success("Service updated.");
        onSaved(serviceId);
      } finally {
        setSaving(false);
      }
      return;
    }

    const nextIds = isEditing
      ? [...selectedIds].filter((id) => id !== editingId).concat(serviceId)
      : [...selectedIds, serviceId];

    setSaving(true);
    try {
      if (onSaveService) {
        const handled = await onSaveService(serviceId, editingId ?? undefined, meta);
        if (handled) {
          toast.success(isEditing ? "Service updated." : "Service added.");
          resetFormFields();
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
      resetFormFields();
      onSaved(serviceId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <CompactFormPanel
      className={shopProfileFormPanelClass}
      showBottomBorder={false}
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
        <CompactField label="Date">
          <input
            type="date"
            className={shopCompactInputClass}
            value={serviceDate}
            disabled={saving}
            onChange={(e) => setServiceDate(e.target.value)}
          />
        </CompactField>
        <CompactField label="Name of Service">
          <select
            className={shopCompactInputClass}
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            disabled={saving || (!isEditing && available.length === 0)}
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
        <CompactField label="Match Vendor Type">
          <select
            className={shopCompactInputClass}
            value={vendorType}
            disabled={saving}
            onChange={(e) => handleVendorTypeChange(normalizeShopType(e.target.value))}
          >
            {SHOP_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </CompactField>
        <CompactField label="Status">
          <select
            className={shopCompactInputClass}
            value={serviceActive ? "active" : "inactive"}
            disabled={saving}
            onChange={(e) => setServiceActive(e.target.value === "active")}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </CompactField>
      </CompactFormRow>
    </CompactFormPanel>
  );
}

export function ShopOperationalServicesEditor({
  loading = false,
  services,
  fullServiceCatalog,
  selectedIds,
  shopType,
  editingId,
  showAddForm = false,
  onAddFormClose,
  onSaveService,
  onSaved,
  onCloseForm,
  onEdit,
  onRemoveSelected,
  headerAction,
}: {
  loading?: boolean;
  services: ShopServiceCategory[];
  fullServiceCatalog: ShopServiceCategory[];
  selectedIds: Set<string>;
  shopType?: string | null;
  editingId?: string | null;
  showAddForm?: boolean;
  onAddFormClose?: () => void;
  onSaveService?: (
    id: string,
    replacesId?: string,
    meta?: ShopServiceFormMeta
  ) => Promise<boolean> | boolean;
  onSaved: (id: string) => void;
  onCloseForm?: () => void;
  onEdit: (service: ShopServiceCategory) => void;
  onRemoveSelected: (ids: Set<string>) => Promise<boolean>;
  headerAction?: ReactNode;
}) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const showForm = showAddForm || editingId !== null;
  const hasBulkSelection = selectedRows.size > 0;

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllRows = () => {
    setSelectedRows((prev) => {
      const allIds = services.map((service) => getServiceId(service));
      const allChecked = allIds.length > 0 && allIds.every((id) => prev.has(id));
      return allChecked ? new Set() : new Set(allIds);
    });
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return;
    setSaving(true);
    try {
      const removed = await onRemoveSelected(selectedRows);
      if (removed) setSelectedRows(new Set());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1">
      {!showForm ? (
        <div className="flex min-h-[2rem] items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleBulkDelete()}
              disabled={!hasBulkSelection || saving}
              className={shopHoursBulkButtonClass}
            >
              Delete
            </button>
          </div>
          {headerAction ? <div className="flex shrink-0 items-center">{headerAction}</div> : null}
        </div>
      ) : null}
      <ShopReveal show={showForm}>
        <ShopServiceAddEditor
          services={fullServiceCatalog}
          selectedServices={services}
          selectedIds={selectedIds}
          shopType={shopType}
          editingId={editingId}
          onSaveService={onSaveService}
          onSaved={onSaved}
          onClose={() => {
            onCloseForm?.();
            onAddFormClose?.();
          }}
        />
      </ShopReveal>
      {loading ? (
        <ShopLoadingPanel variant="profile-table" className="mt-4" />
      ) : services.length === 0 ? (
        <p className="text-center text-sm text-gray-600">
          No services added yet. Click &ldquo;+ Add New&rdquo; to add one.
        </p>
      ) : (
        <ShopServiceList
          services={services}
          checkedIds={selectedRows}
          editingServiceId={editingId}
          onToggleChecked={toggleRow}
          onToggleAllChecked={toggleAllRows}
          onEdit={onEdit}
        />
      )}
    </div>
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
