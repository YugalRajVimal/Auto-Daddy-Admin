import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { FiPaperclip, FiTrash2 } from "react-icons/fi";
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
import {
  shopCompactInputClass,
  shopProfileEditingRowClass,
  shopProfileFormPanelClass,
  shopProfileFormPanelFooterClass,
} from "../shopLayoutStyles";
import { useAuth } from "../../../auth";
import { formatPhoneDisplay, phoneDigits } from "../../../lib/phoneFormat";
import { updateBusinessProfile, updatePersonalProfile } from "../../../lib/autoshopownerApi";
import {
  addMyCarCompanies,
  apiMessage,
  updateServiceWeWorkWith,
} from "../../../lib/shopOwnerMutations";
import {
  createDummyShopOpenHoursHistory,
  formatLocalDateISO,
  formatOpenHoursTimeTable,
  shortDayLabel,
  sortOpenHoursHistoryDesc,
  weekDayFromDateISO,
  type ShopOpenHoursHistoryRow,
} from "../../../lib/perDayOpenHours";
import {
  filterServicesByShopType,
  getShopTypeLabel,
  getShopTypeLabels,
  normalizeShopType,
  normalizeShopTypes,
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

/** Business profile — phone/city/HST/tax equal; address/email equal (wider); full row width. */
const BUSINESS_PROFILE_FIELD_GRID =
  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,2.2fr)]";

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
    user?.name?.trim() &&
      user?.email?.trim() &&
      phone.length >= 10 &&
      (city?.trim() || user?.city?.trim())
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

  const isDirty = useMemo(() => {
    return (
      name !== (user?.name ?? "") ||
      selectedCity !== (city ?? "") ||
      profilePhoto !== null
    );
  }, [name, selectedCity, profilePhoto, user?.name, city]);

  const syncFromUser = () => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(phoneDigits(user?.phone ?? ""));
    setSelectedCity(city ?? "");
    setShowUploadImage(false);
    setProfilePhoto(null);
  };

  const reset = () => {
    syncFromUser();
  };

  useEffect(() => {
    syncFromUser();
  }, [user?.name, user?.email, user?.phone, user?.profilePhoto, city]);

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
      // PUT /api/autoshopowner/profile/personal — name, city, profilePhoto only (phone & email locked).
      const res = await updatePersonalProfile(token, {
        name: name.trim(),
        city: selectedCity.trim(),
        profilePhoto,
      });
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not save.");
        return;
      }

      setProfilePhoto(null);
      if (!isUpdating) setSavedOnce(true);
      toast.success(apiMessage(res.data) || (isUpdating ? "Profile updated." : "Profile saved."));
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <CompactFormPanel
      className={shopProfileFormPanelClass}
      showBottomBorder={false}
      footer={
        isDirty ? (
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
        ) : undefined
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
              disabled
              readOnly
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
              disabled
              readOnly
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
  shopTypes: initialShopTypes,
  onSaved,
}: {
  business?: ShopProfileBusiness;
  zipCode?: string;
  shopType?: string;
  shopTypes?: string[];
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
  const [shopTypes, setShopTypes] = useState<ShopType[]>(() =>
    normalizeShopTypes(initialShopTypes ?? business?.shopTypes ?? initialShopType ?? business?.shopType)
  );
  const [shopTypesOpen, setShopTypesOpen] = useState(false);
  const shopTypesRef = useRef<HTMLDivElement>(null);
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

  const savedShopTypes = useMemo(
    () =>
      normalizeShopTypes(
        initialShopTypes ?? business?.shopTypes ?? initialShopType ?? business?.shopType
      ),
    [initialShopTypes, business?.shopTypes, initialShopType, business?.shopType]
  );

  const isDirty = useMemo(() => {
    const savedTax = business?.gstPercent != null ? String(business.gstPercent) : "";
    const shopTypesChanged =
      shopTypes.length !== savedShopTypes.length ||
      shopTypes.some((type) => !savedShopTypes.includes(type));
    return (
      businessName !== (business?.businessName ?? "") ||
      businessPhone !== phoneDigits(business?.businessPhone ?? "") ||
      city !== (business?.city ?? "") ||
      zip !== (zipCode ?? "") ||
      address !== (business?.address ?? "") ||
      email !== (business?.email ?? "") ||
      hst !== (business?.hstNumber ?? "") ||
      tax !== savedTax ||
      shopTypesChanged ||
      logo !== null
    );
  }, [
    businessName,
    businessPhone,
    city,
    zip,
    address,
    email,
    hst,
    tax,
    shopTypes,
    logo,
    business?.businessName,
    business?.businessPhone,
    business?.city,
    business?.address,
    business?.email,
    business?.hstNumber,
    business?.gstPercent,
    zipCode,
    savedShopTypes,
  ]);

  const syncFromBusiness = () => {
    setBusinessName(business?.businessName ?? "");
    setBusinessPhone(phoneDigits(business?.businessPhone ?? ""));
    setCity(business?.city ?? "");
    setZip(zipCode ?? "");
    setAddress(business?.address ?? "");
    setEmail(business?.email ?? "");
    setHst(business?.hstNumber ?? "");
    setTax(business?.gstPercent != null ? String(business.gstPercent) : "");
    setShopTypes(savedShopTypes);
    setShopTypesOpen(false);
    setShowUploadImage(false);
    setLogo(null);
  };

  const reset = () => {
    syncFromBusiness();
  };

  const toggleShopType = (value: ShopType) => {
    setShopTypes((prev) => {
      if (prev.includes(value)) {
        if (prev.length === 1) return prev;
        return prev.filter((type) => type !== value);
      }
      return [...prev, value];
    });
  };

  useEffect(() => {
    if (!shopTypesOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!shopTypesRef.current?.contains(event.target as Node)) {
        setShopTypesOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShopTypesOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [shopTypesOpen]);

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
    business?.shopTypes,
    business?.businessLogo,
    initialShopType,
    initialShopTypes,
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
    if (shopTypes.length === 0) {
      toast.error("Select at least one business type.");
      return;
    }
    setSaving(true);
    try {
      const res = await updateBusinessProfile(token, {
        businessName: businessName.trim(),
        businessPhone: phoneDigits(businessPhone),
        city: city.trim(),
        businessAddress: address.trim(),
        pincode: zip.trim(),
        businessEmail: email.trim(),
        businessHSTNumber: hst.trim(),
        gst: tax.trim() || "0",
        shopTypes,
        businessLogo: logo,
      });
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
      showBottomBorder={false}
      footer={
        isDirty ? (
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
        ) : undefined
      }
    >
      <div className="space-y-4">
        <CompactFormRow className={BUSINESS_PROFILE_FIELD_GRID}>
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
        <CompactFormRow className={BUSINESS_PROFILE_FIELD_GRID}>
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
        <CompactFormRow className={`${BUSINESS_PROFILE_FIELD_GRID} items-start`}>
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
          <div className="hidden lg:block" aria-hidden />
          <div className="hidden lg:block" aria-hidden />
          <CompactField label="Business Types">
            <div ref={shopTypesRef} className="relative min-w-0 w-full">
              <button
                type="button"
                disabled={saving}
                onClick={() => setShopTypesOpen((open) => !open)}
                className={`${shopCompactInputClass} flex w-full items-center justify-between text-left disabled:cursor-not-allowed disabled:bg-gray-100`}
                aria-expanded={shopTypesOpen}
                aria-haspopup="listbox"
              >
                <span className="truncate">{getShopTypeLabels(shopTypes)}</span>
                <span className="ml-2 shrink-0 text-[10px] text-gray-500">
                  {shopTypesOpen ? "▲" : "▼"}
                </span>
              </button>
              {shopTypesOpen && !saving ? (
                <div className="absolute left-0 right-0 z-50 mt-0.5 overflow-hidden rounded border border-gray-400 bg-white shadow-lg">
                  {SHOP_TYPE_OPTIONS.map((option) => {
                    const checked = shopTypes.includes(option.value);
                    const inputId = `shop-business-type-${option.value}`;
                    return (
                      <label
                        key={option.value}
                        htmlFor={inputId}
                        className="flex cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-2 text-xs font-bold text-ad-green-dark last:border-b-0 hover:bg-gray-50"
                      >
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={checked}
                          disabled={checked && shopTypes.length === 1}
                          onChange={() => toggleShopType(option.value)}
                          className="h-3.5 w-3.5 accent-ad-green"
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </CompactField>
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
  perDayOpenHours: _perDayOpenHours,
  onSaved: _onSaved,
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
  const [historyRows, setHistoryRows] = useState<ShopOpenHoursHistoryRow[]>(() =>
    createDummyShopOpenHoursHistory()
  );
  const [formMode, setFormMode] = useState<ShopHoursFormMode | null>(null);
  const [editingDateISO, setEditingDateISO] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(() => formatLocalDateISO(new Date()));
  const [formOpen, setFormOpen] = useState(true);
  const [formStart, setFormStart] = useState("09:00");
  const [formEnd, setFormEnd] = useState("20:00");
  const [saving, setSaving] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  const sortedRows = useMemo(() => sortOpenHoursHistoryDesc(historyRows), [historyRows]);
  const allDatesSelected =
    sortedRows.length > 0 && sortedRows.every((row) => selectedDates.has(row.dateISO));
  const someDatesSelected = selectedDates.size > 0 && !allDatesSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someDatesSelected;
    }
  }, [someDatesSelected]);

  const resetFormFields = (dateISO: string) => {
    const existing = historyRows.find((row) => row.dateISO === dateISO);
    setFormDate(dateISO);
    setFormOpen(existing?.enabled ?? true);
    setFormStart(existing?.start ?? "09:00");
    setFormEnd(existing?.end ?? "20:00");
  };

  useEffect(() => {
    if (!showAddForm) return;
    setEditingDateISO(null);
    resetFormFields(formatLocalDateISO(new Date()));
    setFormMode("add");
  }, [showAddForm]);

  const openEditForm = (row: ShopOpenHoursHistoryRow) => {
    setEditingDateISO(row.dateISO);
    resetFormFields(row.dateISO);
    setFormMode("edit");
  };

  const closeForm = () => {
    const wasAdd = formMode === "add";
    setEditingDateISO(null);
    setFormMode(null);
    if (wasAdd) onAddFormClose?.();
  };

  const handleSave = async () => {
    if (!formDate.trim()) {
      toast.error("Select a date.");
      return;
    }

    setSaving(true);
    try {
      const nextRow: ShopOpenHoursHistoryRow = {
        dateISO: formDate,
        day: weekDayFromDateISO(formDate),
        enabled: formOpen,
        start: formStart,
        end: formEnd,
      };

      setHistoryRows((prev) => {
        const withoutTarget =
          formMode === "edit" && editingDateISO
            ? prev.filter((row) => row.dateISO !== editingDateISO)
            : prev.filter((row) => row.dateISO !== formDate);
        return sortOpenHoursHistoryDesc([...withoutTarget, nextRow]);
      });
      toast.success(formMode === "edit" ? "Hours updated." : "Hours added.");
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const toggleDateSelection = (dateISO: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateISO)) next.delete(dateISO);
      else next.add(dateISO);
      return next;
    });
  };

  const toggleAllDates = () => {
    setSelectedDates(
      allDatesSelected ? new Set() : new Set(sortedRows.map((row) => row.dateISO))
    );
  };

  const applyBulkStatus = (open: boolean) => {
    if (selectedDates.size === 0) return;
    setHistoryRows((prev) =>
      sortOpenHoursHistoryDesc(
        prev.map((row) =>
          selectedDates.has(row.dateISO) ? { ...row, enabled: open } : row
        )
      )
    );
    toast.success(open ? "Selected dates opened." : "Selected dates closed.");
    setSelectedDates(new Set());
  };

  const showForm = formMode === "add" || formMode === "edit";
  const hasBulkSelection = selectedDates.size > 0;

  return (
    <div className="space-y-1">
      {!showForm ? (
        <div className="flex min-h-[2rem] items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => applyBulkStatus(true)}
              disabled={!hasBulkSelection || saving}
              className={shopHoursBulkButtonClass}
            >
              Open All
            </button>
            <button
              type="button"
              onClick={() => applyBulkStatus(false)}
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
            <CompactField label="Date">
              {formMode === "edit" ? (
                <input
                  type="date"
                  readOnly
                  value={formDate}
                  className={`${shopCompactInputClass} bg-gray-50`}
                />
              ) : (
                <input
                  type="date"
                  value={formDate}
                  disabled={saving}
                  onChange={(e) => resetFormFields(e.target.value)}
                  className={shopCompactInputClass}
                />
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
                    checked={allDatesSelected}
                    onChange={toggleAllDates}
                    aria-label="Select all dates"
                    className="h-3.5 w-3.5 accent-ad-purple"
                  />
                </th>
                <th className={SHOP_TABLE.th}>Date</th>
                <th className={SHOP_TABLE.th}>Day</th>
                <th className={SHOP_TABLE.th}>Open</th>
                <th className={SHOP_TABLE.th}>Close</th>
                <th className={SHOP_TABLE.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, index) => {
                const isEditingRow = editingDateISO === row.dateISO;
                const isClosed = !row.enabled;
                return (
                  <tr
                    key={row.dateISO}
                    className={
                      isEditingRow ? shopProfileEditingRowClass : adminPanelRowClass(index)
                    }
                  >
                    <td className={SHOP_TABLE.tdCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedDates.has(row.dateISO)}
                        onChange={() => toggleDateSelection(row.dateISO)}
                        aria-label={`Select ${row.dateISO}`}
                        className="h-3.5 w-3.5 accent-ad-purple"
                      />
                    </td>
                    <td className={SHOP_TABLE.td}>
                      <button
                        type="button"
                        title={`Edit ${row.dateISO}`}
                        aria-label={`Edit ${row.dateISO}`}
                        disabled={saving}
                        onClick={() => openEditForm(row)}
                        className={`font-semibold underline disabled:opacity-60 ${
                          isClosed
                            ? "text-ad-purple hover:text-ad-purple-dark"
                            : "text-blue-700 hover:text-blue-800"
                        }`}
                      >
                        {row.dateISO}
                      </button>
                    </td>
                    <td
                      className={`${SHOP_TABLE.td} font-semibold ${isClosed ? "text-ad-purple" : "text-gray-800"}`}
                    >
                      {shortDayLabel(row.day)}
                    </td>
                    <td className={`${SHOP_TABLE.td} ${isClosed ? "text-ad-purple" : ""}`}>
                      {row.enabled ? formatOpenHoursTimeTable(row.start) : "—"}
                    </td>
                    <td className={`${SHOP_TABLE.td} ${isClosed ? "text-ad-purple" : ""}`}>
                      {row.enabled ? formatOpenHoursTimeTable(row.end) : "—"}
                    </td>
                    <td className={`${SHOP_TABLE.td} font-semibold ${isClosed ? "text-ad-purple" : ""}`}>
                      {row.enabled ? "Open" : "Closed"}
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
                  <td className={SHOP_TABLE.td}>
                    <button
                      type="button"
                      title={`Edit ${name}`}
                      aria-label={`Edit ${name}`}
                      disabled={isSaving}
                      onClick={() => onEdit(service)}
                      className={`font-semibold underline disabled:opacity-60 ${
                        isInactive
                          ? "text-ad-purple hover:text-ad-purple-dark"
                          : "text-blue-700 hover:text-blue-800"
                      }`}
                    >
                      {name}
                    </button>
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
  shopTypes: shopTypesProp,
  editingId,
  onSaved,
  onClose,
  onSaveService,
}: {
  services: ShopServiceCategory[];
  selectedIds: Set<string>;
  selectedServices?: ShopServiceCategory[];
  shopType?: string | null;
  /** Shop types selected on the business profile — vendor dropdown is limited to these. */
  shopTypes?: string[] | null;
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
  const allowedVendorTypes = useMemo(() => {
    const selected = normalizeShopTypes(shopTypesProp ?? shopType);
    return SHOP_TYPE_OPTIONS.filter((option) => selected.includes(option.value));
  }, [shopType, shopTypesProp]);
  const defaultVendorType =
    allowedVendorTypes.find((option) => option.value === normalizeShopType(shopType))?.value ??
    allowedVendorTypes[0]?.value ??
    normalizeShopType(shopType);
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
      const editingType = normalizeShopType(editing?.shopType ?? shopType);
      setVendorType(
        allowedVendorTypes.some((option) => option.value === editingType)
          ? editingType
          : defaultVendorType
      );
      resetFormFields(
        editingId,
        formatServiceTableDate(editing ?? { id: editingId, subServices: [] }),
        editing?.isActive !== false
      );
      return;
    }
    setVendorType(defaultVendorType);
    resetFormFields();
  }, [allowedVendorTypes, defaultVendorType, editingId, selectedServices, services, shopType]);

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
            disabled={saving || allowedVendorTypes.length === 0}
            onChange={(e) => handleVendorTypeChange(normalizeShopType(e.target.value))}
          >
            {allowedVendorTypes.map((option) => (
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
  shopTypes,
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
  /** Shop types selected on the business profile — vendor dropdown is limited to these. */
  shopTypes?: string[] | null;
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
          shopTypes={shopTypes}
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
