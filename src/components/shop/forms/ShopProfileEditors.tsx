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
  shopTableToolbarCompactClass,
} from "../shopLayoutStyles";
import { useAuth } from "../../../auth";
import { formatPhoneDisplay, phoneDigits } from "../../../lib/phoneFormat";
import {
  fetchOpenHours,
  updateBusinessProfile,
  updatePersonalProfile,
  updateWeeklyOpenHours,
  upsertSpecialOpenHours,
} from "../../../lib/autoshopownerApi";
import {
  addMyCarCompanies,
  apiMessage,
  updateServiceWeWorkWith,
} from "../../../lib/shopOwnerMutations";
import {
  WEEK_DAYS,
  buildOpenHoursTableRows,
  formatLocalDateISO,
  formatOpenHoursTimeTable,
  hasWeeklyScheduleInPayload,
  parseSpecialOpenHours,
  parseWeeklyOpenHoursFromPayload,
  perDayOpenHoursFromSchedule,
  resolveShopOpenHoursSchedule,
  shortDayLabel,
  type PerDaySchedule,
  type ShopOpenHoursHistoryRow,
  type WeekDay,
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
import CarBrandLogo from "../CarBrandLogo";
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

/** Business profile — phone/city/TAX ID/tax equal; address/email equal (wider); full row width. */
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
      email !== (user?.email ?? "") ||
      profilePhoto !== null
    );
  }, [name, selectedCity, email, profilePhoto, user?.name, user?.email, city]);

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
    const trimmedName = name.trim();
    const trimmedCity = selectedCity.trim();
    if (!trimmedName) {
      toast.error("Name is required.");
      return;
    }
    if (!trimmedCity) {
      toast.error("City is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await updatePersonalProfile(token, {
        name: trimmedName,
        city: trimmedCity,
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
              maxLength={60}
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
  const [hst, setHst] = useState((business?.hstNumber ?? "").toUpperCase());
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

  // Validation error states
  const [errors, setErrors] = useState<{
    businessPhone?: string;
    zip?: string;
    email?: string;
    hst?: string;
    tax?: string;
  }>({});

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
    setZip(business?.pincode ?? "");
    setAddress(business?.address ?? "");
    setEmail(business?.email ?? "");
    setHst((business?.hstNumber ?? "").toUpperCase());
    setTax(business?.gstPercent != null ? String(business.gstPercent) : "");
    setShopTypes(savedShopTypes);
    setShopTypesOpen(false);
    setShowUploadImage(false);
    setLogo(null);
    setErrors({});
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

  // --- VALIDATION HELPERS ---
  function isValidUSZip(zip: string) {
    // 12345 or 12345-6789
    return /^\d{5}(-\d{4})?$/.test(zip);
  }
  function isValidCanadaPostalCode(zip: string) {
    // K1A 0B1 or K1A-0B1 or K1A0B1, case insensitive
    return /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i.test(zip);
  }
  function isValidIndiaPincode(pin: string) {
    return /^\d{6}$/.test(pin);
  }
  // function detectZipCountry(zip: string): "IN" | "US" | "CA" | "unknown" {
  //   if (isValidIndiaPincode(zip)) return "IN";
  //   if (isValidUSZip(zip)) return "US";
  //   if (isValidCanadaPostalCode(zip)) return "CA";
  //   return "unknown";
  // }

  function isValidEmail(email: string) {
    // RFC 5322 Official Standard (relaxed)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  function isValidPhone(phone: string) {
    // US/Canada/India mobile and landline (basic: 10-15 digits)
    return /^[0-9]{10,15}$/.test(phone);
  }
  function isValidTaxPercentage(tax: string) {
    const value = Number(tax);
    return !isNaN(value) && value >= 0 && value <= 50;
  }

  function isValidTaxId(taxId: string) {
    return /^[A-Z0-9]{17}$/.test(taxId.replace(/\s/g, ""));
  }

  function validateAllFields() {
    let fieldErrors: typeof errors = {};

    // Business Phone
    if (!businessPhone || !isValidPhone(businessPhone)) {
      fieldErrors.businessPhone =
        "Enter a valid phone number (10-15 digits, digits only).";
    }

    // Email
    if (!email.trim() || !isValidEmail(email.trim())) {
      fieldErrors.email = "Enter a valid email address.";
    }

    // Zip/Postal/Pin Code
    if (!zip.trim()) {
      fieldErrors.zip = "Enter a zip/postal/pincode.";
    } else {
      if (
        !(
          isValidUSZip(zip.trim()) ||
          isValidCanadaPostalCode(zip.trim()) ||
          isValidIndiaPincode(zip.trim())
        )
      ) {
        fieldErrors.zip = "Enter a valid US zip, Canada postal code, or India PIN code.";
      }
    }

    // TAX ID No
    if (hst.trim()) {
      if (!isValidTaxId(hst.trim())) {
        fieldErrors.hst = "Enter a valid TAX ID No (17 uppercase alphanumeric characters).";
      }
    }

    // Tax %
    if (tax.trim()) {
      if (!isValidTaxPercentage(tax.trim())) {
        fieldErrors.tax = "Enter a valid tax percentage (0 - 50).";
      }
    }

    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  }

  const handleUpdate = async () => {
    if (!token) return;
    if (shopTypes.length === 0) {
      toast.error("Select at least one business type.");
      return;
    }

    if (!validateAllFields()) {
      toast.error("Please fix validation errors.");
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
        businessHSTNumber: hst.trim().toUpperCase(),
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
          <CompactField label="Business Phone" >
            <input
              className={shopCompactInputClass + (errors.businessPhone ? " border-red-500" : "")}
              value={formatPhoneDisplay(businessPhone)}
              onChange={(e) => setBusinessPhone(phoneDigits(e.target.value))}
              disabled={saving}
            />
            {errors.businessPhone && (
              <div className="text-xs text-red-600">{errors.businessPhone}</div>
            )}
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
              className={shopCompactInputClass + (errors.zip ? " border-red-500" : "")}
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              disabled={saving}
            />
            {errors.zip && (
              <div className="text-xs text-red-600">{errors.zip}</div>
            )}
          </CompactField>
          <CompactField label="TAX ID No">
            <input
              className={shopCompactInputClass + (errors.hst ? " border-red-500" : "")}
              value={hst}
              onChange={(e) =>
                setHst(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 17))
              }
              maxLength={17}
              disabled={saving}
            />
            {errors.hst && (
              <div className="text-xs text-red-600">{errors.hst}</div>
            )}
          </CompactField>
          <CompactField label="Tax %">
            <input
              className={shopCompactInputClass + (errors.tax ? " border-red-500" : "")}
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              disabled={saving}
            />
            {errors.tax && (
              <div className="text-xs text-red-600">{errors.tax}</div>
            )}
          </CompactField>
          <CompactField label="E mail">
            <input
              type="email"
              className={shopCompactInputClass + (errors.email ? " border-red-500" : "")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
            />
            {errors.email && (
              <div className="text-xs text-red-600">{errors.email}</div>
            )}
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
          ? "You are setting the default weekly working schedule for your Workshop"
          : "You are updating opening timings for this specific date"
      }
      saving={saving}
      saveLabel={mode === "add" ? "Save" : "Update"}
      onSave={onSave}
      onReset={onCancel}
    />
  );
}

function clonePerDaySchedule(schedule: PerDaySchedule): PerDaySchedule {
  return WEEK_DAYS.reduce((acc, day) => {
    acc[day] = { ...schedule[day] };
    return acc;
  }, {} as PerDaySchedule);
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
  const [formSchedule, setFormSchedule] = useState<PerDaySchedule>(() =>
    resolveShopOpenHoursSchedule(perDayOpenHours)
  );
  const [tableRows, setTableRows] = useState<ShopOpenHoursHistoryRow[]>([]);
  const [loadingHours, setLoadingHours] = useState(true);
  const [formMode, setFormMode] = useState<ShopHoursFormMode | null>(null);
  const [editingDateISO, setEditingDateISO] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(() => formatLocalDateISO(new Date()));
  const [formOpen, setFormOpen] = useState(true);
  const [formStart, setFormStart] = useState("09:00");
  const [formEnd, setFormEnd] = useState("20:00");
  const [saving, setSaving] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);
  const todayISO = formatLocalDateISO(new Date());

  const allDatesSelected =
    tableRows.length > 0 && tableRows.every((row) => selectedDates.has(row.dateISO));
  const someDatesSelected = selectedDates.size > 0 && !allDatesSelected;

  const applyPayload = useCallback(
    (payload: unknown | null) => {
      const profileSchedule = resolveShopOpenHoursSchedule(perDayOpenHours);
      const finalSchedule =
        payload && hasWeeklyScheduleInPayload(payload)
          ? parseWeeklyOpenHoursFromPayload(payload)
          : profileSchedule;
      const specials = payload ? parseSpecialOpenHours(payload) : [];
      setSchedule(finalSchedule);
      setTableRows(buildOpenHoursTableRows(finalSchedule, specials));
    },
    [perDayOpenHours]
  );

  const reloadHours = useCallback(async () => {
    if (!token) {
      applyPayload(null);
      setLoadingHours(false);
      return;
    }
    setLoadingHours(true);
    try {
      const res = await fetchOpenHours(token);
      if (res.ok) applyPayload(res.data);
      else applyPayload(null);
    } catch {
      applyPayload(null);
    } finally {
      setLoadingHours(false);
    }
  }, [token, applyPayload]);

  useEffect(() => {
    void reloadHours();
  }, [reloadHours]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someDatesSelected;
    }
  }, [someDatesSelected]);

  const updateFormDay = (
    day: WeekDay,
    patch: Partial<{ enabled: boolean; start: string; end: string }>
  ) => {
    setFormSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...patch },
    }));
  };

  const resetEditFormFields = (row: ShopOpenHoursHistoryRow) => {
    setFormDate(row.dateISO);
    setFormOpen(row.enabled);
    setFormStart(row.start);
    setFormEnd(row.end);
  };

  useEffect(() => {
    if (!showAddForm) return;
    setEditingDateISO(null);
    setFormSchedule(clonePerDaySchedule(schedule));
    setFormMode("add");
    // Only seed when Add New opens — don't reset while editing if schedule refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddForm]);

  const openEditForm = (row: ShopOpenHoursHistoryRow) => {
    setEditingDateISO(row.dateISO);
    resetEditFormFields(row);
    setFormMode("edit");
  };

  const closeForm = () => {
    const wasAdd = formMode === "add";
    setEditingDateISO(null);
    setFormMode(null);
    if (wasAdd) onAddFormClose?.();
  };

  const handleSave = async () => {
    if (!token) {
      toast.error("Sign in to save open hours.");
      return;
    }

    setSaving(true);
    try {
      if (formMode === "add") {
        const res = await updateWeeklyOpenHours(
          token,
          perDayOpenHoursFromSchedule(formSchedule)
        );
        if (!res.ok) {
          toast.error(apiMessage(res.data) || "Could not save weekly hours.");
          return;
        }
        setSchedule(clonePerDaySchedule(formSchedule));
        toast.success(apiMessage(res.data) || "Weekly default hours saved.");
        onSaved();
        await reloadHours();
        closeForm();
        return;
      }

      if (!formDate.trim()) {
        toast.error("Select a date.");
        return;
      }

      const res = await upsertSpecialOpenHours(token, {
        date: formDate,
        isClosed: !formOpen,
        open: formStart,
        close: formEnd,
      });
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not update hours for this date.");
        return;
      }
      toast.success(apiMessage(res.data) || "Hours updated for this date.");
      onSaved();
      await reloadHours();
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
      allDatesSelected ? new Set() : new Set(tableRows.map((row) => row.dateISO))
    );
  };

  const applyBulkStatus = async (open: boolean) => {
    if (selectedDates.size === 0 || !token) return;
    setSaving(true);
    try {
      const dates = [...selectedDates];
      const results = await Promise.all(
        dates.map((dateISO) => {
          const row = tableRows.find((r) => r.dateISO === dateISO);
          return upsertSpecialOpenHours(token, {
            date: dateISO,
            isClosed: !open,
            open: row?.start ?? "09:00",
            close: row?.end ?? "20:00",
          });
        })
      );
      const failed = results.find((r) => !r.ok);
      if (failed) {
        toast.error(apiMessage(failed.data) || "Could not update selected dates.");
        return;
      }
      toast.success(open ? "Selected dates opened." : "Selected dates closed.");
      setSelectedDates(new Set());
      onSaved();
      await reloadHours();
    } finally {
      setSaving(false);
    }
  };

  const showForm = formMode === "add" || formMode === "edit";
  const hasBulkSelection = selectedDates.size > 0;

  if (loadingHours) {
    return <ShopLoadingPanel variant="form" />;
  }

  return (
    <div className="space-y-1">
      {!showForm ? (
        <div className={shopTableToolbarCompactClass}>
          <div className="flex items-center gap-2">
            {hasBulkSelection ? (
              <>
                <button
                  type="button"
                  onClick={() => void applyBulkStatus(true)}
                  disabled={saving}
                  className={shopHoursBulkButtonClass}
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => void applyBulkStatus(false)}
                  disabled={saving}
                  className={shopHoursBulkButtonClass}
                >
                  Close
                </button>
              </>
            ) : null}
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
          {formMode === "edit" ? (
            <CompactFormRow>
              <CompactField label="Date">
                <input
                  type="date"
                  readOnly
                  value={formDate}
                  className={`${shopCompactInputClass} bg-gray-50`}
                />
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
          ) : (
            <div className="space-y-2">
              {WEEK_DAYS.map((day) => {
                const entry = formSchedule[day];
                return (
                  <CompactFormRow key={day}>
                    <CompactField label="Day">
                      <input
                        type="text"
                        readOnly
                        value={day}
                        className={`${shopCompactInputClass} bg-gray-50 font-semibold`}
                      />
                    </CompactField>
                    <CompactField label="Opening time">
                      <OpenHoursTimePicker
                        id={`shop-hours-opening-${day}`}
                        value={entry.start}
                        disabled={!entry.enabled || saving}
                        onChange={(start) => updateFormDay(day, { start })}
                      />
                    </CompactField>
                    <CompactField label="Closing Time">
                      <OpenHoursTimePicker
                        id={`shop-hours-closing-${day}`}
                        value={entry.end}
                        disabled={!entry.enabled || saving}
                        onChange={(end) => updateFormDay(day, { end })}
                      />
                    </CompactField>
                    <CompactField label="Status">
                      <select
                        value={entry.enabled ? "open" : "closed"}
                        disabled={saving}
                        onChange={(e) =>
                          updateFormDay(day, { enabled: e.target.value === "open" })
                        }
                        className={shopCompactInputClass}
                      >
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                      </select>
                    </CompactField>
                  </CompactFormRow>
                );
              })}
            </div>
          )}
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
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`${SHOP_TABLE.td} text-center text-gray-500`}>
                    No open hours yet. Click &ldquo;+ Add New&rdquo; to set weekly defaults.
                  </td>
                </tr>
              ) : (
                tableRows.map((row, index) => {
                  const isEditingRow = editingDateISO === row.dateISO;
                  const isClosed = !row.enabled;
                  const isToday = row.dateISO === todayISO;
                  return (
                    <tr
                      key={row.dateISO}
                      className={
                        isEditingRow
                          ? shopProfileEditingRowClass
                          : isToday
                            ? `${adminPanelRowClass(index)} bg-ad-purple/5`
                            : adminPanelRowClass(index)
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
                          {isToday ? " (Today)" : ""}
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
                      <td
                        className={`${SHOP_TABLE.td} font-semibold ${isClosed ? "text-ad-purple" : ""}`}
                      >
                        {row.enabled ? "Open" : "Closed"}
                      </td>
                    </tr>
                  );
                })
              )}
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

export function ShopCarBrandCheckboxList({
  brands,
  selectedIds,
  savingBrandId,
  onToggle,
  emptyMessage = "No car brands available.",
}: {
  brands: ShopCarCompany[];
  selectedIds: Set<string>;
  savingBrandId?: string | null;
  onToggle: (id: string, next: boolean) => void;
  emptyMessage?: string;
}) {
  const sortedBrands = useMemo(
    () =>
      [...brands].sort((a, b) =>
        getCarBrandName(a).localeCompare(getCarBrandName(b), undefined, { sensitivity: "base" })
      ),
    [brands]
  );

  return sortedBrands.length === 0 ? (
    <p className="py-4 text-center text-sm text-gray-500">{emptyMessage}</p>
  ) : (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {sortedBrands.map((company) => {
        const id = getCarBrandId(company);
        const name = getCarBrandName(company);
        const isSaving = savingBrandId === id;
        const isSelected = selectedIds.has(id);
        return (
          <label
            key={id}
            className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border bg-white px-2 py-3 shadow-sm transition-all hover:border-ad-purple/40 hover:shadow-md ${
              isSelected ? "border-ad-purple ring-1 ring-ad-purple/30" : "border-gray-200"
            } ${isSaving ? "opacity-60" : ""}`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              disabled={isSaving}
              onChange={(e) => onToggle(id, e.target.checked)}
              aria-label={`Select ${name}`}
              className="absolute right-2 top-2 h-3.5 w-3.5 accent-ad-purple disabled:opacity-60"
            />
            <div className="flex h-14 w-full items-center justify-center pt-2">
              <CarBrandLogo company={company} className="max-h-12 max-w-full object-contain" />
            </div>
            <span className="text-center text-[11px] font-bold uppercase tracking-wide text-gray-800">
              {name}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function ShopCarBrandAddCheckboxPanel({
  brands,
  selectedIds,
  savingBrandId,
  onToggle,
  onClose,
  emptyMessage = "All car brands have been added.",
}: {
  brands: ShopCarCompany[];
  selectedIds: Set<string>;
  savingBrandId?: string | null;
  onToggle: (id: string, next: boolean) => void;
  onClose: () => void;
  emptyMessage?: string;
}) {
  return (
    <CompactFormPanel
      className={shopProfileFormPanelClass}
      showBottomBorder={false}
      footer={
        <ProfileStatusFooter
          message="You are adding a car brand"
          actions={
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-blue-600 underline hover:text-blue-700"
            >
              Cancel
            </button>
          }
        />
      }
    >
      <ShopCarBrandCheckboxList
        brands={brands}
        selectedIds={selectedIds}
        savingBrandId={savingBrandId}
        onToggle={onToggle}
        emptyMessage={emptyMessage}
      />
    </CompactFormPanel>
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
      <CompactFormRow>
        <CompactField label="Name" className="w-full max-w-xs">
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
    id: string | string[],
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
  const available = useMemo(
    () =>
      filterServicesByShopType(services, vendorType)
        .filter((service) => {
          const id = getServiceId(service);
          return id && (!selectedIds.has(id) || id === editingId);
        })
        .sort((a, b) =>
          getServiceName(a).localeCompare(getServiceName(b), undefined, { sensitivity: "base" })
        ),
    [editingId, selectedIds, services, vendorType]
  );
  const availableIds = useMemo(
    () => available.map((service) => getServiceId(service)),
    [available]
  );
  const [serviceId, setServiceId] = useState(editingId ?? "");
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const [serviceDate, setServiceDate] = useState(todayISODate());
  const [serviceActive, setServiceActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const isEditing = Boolean(editingId);
  const servicePickerRef = useRef<HTMLDivElement>(null);
  const pickAllRef = useRef<HTMLInputElement>(null);
  const allAvailablePicked =
    availableIds.length > 0 && availableIds.every((id) => pickedIds.has(id));
  const someAvailablePicked = availableIds.some((id) => pickedIds.has(id)) && !allAvailablePicked;

  const servicePickerLabel = useMemo(() => {
    if (available.length === 0) return "All services already added";
    if (pickedIds.size === 0) return "Select service";
    if (pickedIds.size === 1) {
      const onlyId = [...pickedIds][0];
      const match = available.find((service) => getServiceId(service) === onlyId);
      return match ? getServiceName(match) : "1 service selected";
    }
    return `${pickedIds.size} services selected`;
  }, [available, pickedIds]);

  const resetFormFields = (nextServiceId = "", nextDate = todayISODate(), nextActive = true) => {
    setServiceId(nextServiceId);
    setPickedIds(new Set());
    setServicePickerOpen(false);
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

  useEffect(() => {
    if (pickAllRef.current) {
      pickAllRef.current.indeterminate = someAvailablePicked;
    }
  }, [someAvailablePicked]);

  useEffect(() => {
    if (!servicePickerOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!servicePickerRef.current?.contains(event.target as Node)) {
        setServicePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [servicePickerOpen]);

  const handleVendorTypeChange = (nextType: ShopType) => {
    setVendorType(nextType);
    setServicePickerOpen(false);
    const nextAvailableIds = new Set(
      filterServicesByShopType(services, nextType)
        .filter((service) => {
          const id = getServiceId(service);
          return id && (!selectedIds.has(id) || id === editingId);
        })
        .map((service) => getServiceId(service))
    );
    if (isEditing) {
      if (!nextAvailableIds.has(serviceId)) setServiceId("");
      return;
    }
    setPickedIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (nextAvailableIds.has(id)) next.add(id);
      }
      return next;
    });
  };

  const togglePicked = (id: string) => {
    setPickedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePickAll = () => {
    setPickedIds((prev) => {
      const allChecked =
        availableIds.length > 0 && availableIds.every((id) => prev.has(id));
      return allChecked ? new Set() : new Set(availableIds);
    });
  };

  const handleCancel = () => {
    resetFormFields();
    setVendorType(defaultVendorType);
    onClose?.();
  };

  const handleSave = async () => {
    const meta: ShopServiceFormMeta = {
      createdAt: serviceDate,
      isActive: serviceActive,
    };

    if (isEditing) {
      if (!serviceId) {
        toast.error("Please select a service.");
        return;
      }

      if (serviceId === editingId) {
        setSaving(true);
        try {
          if (onSaveService) {
            const handled = await onSaveService(serviceId, undefined, meta);
            if (handled) {
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

      const nextIds = [...selectedIds].filter((id) => id !== editingId).concat(serviceId);
      setSaving(true);
      try {
        if (onSaveService) {
          const handled = await onSaveService(serviceId, editingId ?? undefined, meta);
          if (handled) {
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
        toast.success("Service updated.");
        resetFormFields();
        onSaved(serviceId);
      } finally {
        setSaving(false);
      }
      return;
    }

    const idsToAdd = availableIds.filter((id) => pickedIds.has(id));
    if (idsToAdd.length === 0) {
      toast.error("Please select at least one service.");
      return;
    }

    const nextIds = [...selectedIds, ...idsToAdd];
    setSaving(true);
    try {
      if (onSaveService) {
        const handled = await onSaveService(idsToAdd, undefined, meta);
        if (handled) {
          resetFormFields();
          onSaved(idsToAdd[0] ?? "");
          return;
        }
      }
      if (!token) return;
      const res = await updateServiceWeWorkWith(token, nextIds);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not save.");
        return;
      }
      toast.success(idsToAdd.length === 1 ? "Service added." : "Services added.");
      resetFormFields();
      onSaved(idsToAdd[0] ?? "");
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
          message={
            isEditing
              ? "You are updating a service"
              : pickedIds.size > 1
                ? "You are adding services"
                : "You are adding a service"
          }
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
        <CompactField label="Name of Service">
          {isEditing ? (
            <select
              className={shopCompactInputClass}
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              disabled={saving || available.length === 0}
            >
              <option value="">Select service</option>
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
          ) : (
            <div ref={servicePickerRef} className="relative min-w-0 w-full">
              <button
                type="button"
                disabled={saving || available.length === 0}
                onClick={() => setServicePickerOpen((open) => !open)}
                className={`${shopCompactInputClass} flex w-full items-center justify-between text-left disabled:cursor-not-allowed disabled:bg-gray-100`}
                aria-expanded={servicePickerOpen}
                aria-haspopup="listbox"
              >
                <span className="truncate">{servicePickerLabel}</span>
                <span className="ml-2 shrink-0 text-[10px] text-gray-500">
                  {servicePickerOpen ? "▲" : "▼"}
                </span>
              </button>
              {servicePickerOpen && !saving && available.length > 0 ? (
                <div
                  role="listbox"
                  aria-multiselectable="true"
                  className="absolute left-0 right-0 z-50 mt-0.5 max-h-56 overflow-y-auto rounded border border-gray-400 bg-white shadow-lg"
                >
                  <label className="flex sticky top-0 z-10 cursor-pointer items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2 text-xs font-bold text-ad-green-dark">
                    <input
                      ref={pickAllRef}
                      type="checkbox"
                      checked={allAvailablePicked}
                      onChange={togglePickAll}
                      className="h-3.5 w-3.5 accent-ad-green"
                      aria-label="Select all services"
                    />
                    Select all
                  </label>
                  {available.map((service) => {
                    const id = getServiceId(service);
                    const name = getServiceName(service);
                    const checked = pickedIds.has(id);
                    const inputId = `shop-add-service-${id}`;
                    return (
                      <label
                        key={id}
                        htmlFor={inputId}
                        className="flex cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-2 text-xs font-bold text-ad-green-dark last:border-b-0 hover:bg-gray-50"
                      >
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePicked(id)}
                          className="h-3.5 w-3.5 shrink-0 accent-ad-green"
                        />
                        <span className="min-w-0 truncate">{name}</span>
                      </label>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}
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
    id: string | string[],
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
        <div className={shopTableToolbarCompactClass}>
          <div className="flex items-center gap-2">
            {hasBulkSelection ? (
              <button
                type="button"
                onClick={() => void handleBulkDelete()}
                disabled={saving}
                className={shopHoursBulkButtonClass}
              >
                Delete
              </button>
            ) : null}
          </div>
          {headerAction ? <div className="flex shrink-0 items-center">{headerAction}</div> : null}
        </div>
      ) : null}
      <ShopReveal show={showForm} clipOverflow={false}>
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
