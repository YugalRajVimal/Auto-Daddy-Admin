import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { FiEdit2, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { getJson } from "../../../api/mobileAuth";
import {
  CompactField,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
} from "../../admin/ContentPanel";
import { shopCompactInputClass } from "../shopLayoutStyles";
import { useAuth } from "../../../auth";
import { formatPhoneDisplay, phoneDigits } from "../../../lib/phoneFormat";
import {
  addMyCarCompanies,
  apiMessage,
  updateBusinessOpenHours,
  updateBusinessProfileMultipart,
  updatePersonalProfile,
  updateServiceWeWorkWith,
} from "../../../lib/shopOwnerMutations";
import {
  formatOpenHoursTimeDisplay,
  resolvePerDaySchedule,
  serializePerDayOpenHoursForApi,
  shortDayLabel,
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
  CAR_BRAND_LIST_LOGO_CLASS,
  CAR_BRAND_LIST_LOGO_SLOT_CLASS,
} from "../CarBrandLogo";
import { getCarBrandId, getCarBrandName } from "../../../lib/dummyCarBrands";
import { getServiceId, getServiceName } from "../../../lib/dummyServices";
import { parseCitiesApiResponse } from "../../../lib/carOwnerCities";
import { shopSaveButtonClass } from "./ShopFormPage";
import { ShopReveal } from "../ShopAnimated";
import { motion } from "framer-motion";

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
    <div className="flex flex-wrap items-stretch justify-between gap-2 border-t border-ad-form-border bg-ad-form-bg">
      <div className="flex min-w-[180px] flex-1 items-center bg-ad-form-required-bg px-3 py-2.5 text-xs font-serif italic text-gray-800">
        {message}
      </div>
      <div className="flex items-center gap-2 px-3 py-2.5">{actions}</div>
    </div>
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
  const [saving, setSaving] = useState(false);

  const syncFromUser = () => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(phoneDigits(user?.phone ?? ""));
    setAddress(user?.address ?? "");
    setPincode(user?.pincode ?? "");
    setSelectedCity(city ?? "");
    setShowUploadImage(false);
  };

  const reset = () => {
    syncFromUser();
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

  const handleUpdate = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await updatePersonalProfile(token, {
        name: name.trim(),
        email: email.trim(),
        phone: phoneDigits(phone),
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
        <ProfileFormFooter
          message="You are updating your personal profile"
          saving={saving}
          onSave={() => void handleUpdate()}
          onReset={reset}
        />
      }
    >
      <div className="space-y-4">
        <CompactFormRow>
          <CompactField label="Name" className="min-w-[120px] flex-1">
            <input
              className={shopCompactInputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </CompactField>
          <CompactField label="Phone" className="min-w-[120px] flex-1">
            <input
              className={shopCompactInputClass}
              value={formatPhoneDisplay(phone)}
              onChange={(e) => setPhone(phoneDigits(e.target.value))}
              disabled={saving}
            />
          </CompactField>
          <CompactField label="City" className="min-w-[120px] flex-1">
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
          <CompactField label="Email" className="min-w-[120px] flex-1">
            <input
              type="email"
              className={shopCompactInputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
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
                  disabled={saving}
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
                    disabled={saving}
                    className={`${checkboxBoxClass} hover:bg-gray-200 disabled:opacity-60`}
                  >
                    Choose image
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
                </>
              ) : null}
            </div>
          </div>
          <div className="min-w-[120px] flex-1" aria-hidden />
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
  onSaved,
}: {
  business?: ShopProfileBusiness;
  zipCode?: string;
  shopType?: string;
  onSaved: () => void;
}) {
  const { token } = useAuth();
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
  const [saving, setSaving] = useState(false);

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
      toast.success("Business profile updated.");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <CompactFormPanel
      footer={
        <ProfileFormFooter
          message="You are updating your business profile"
          saving={saving}
          onSave={() => void handleUpdate()}
          onReset={reset}
        />
      }
    >
      <div className="space-y-4">
        <CompactFormRow>
          <CompactField label="Business Name" className="min-w-[120px] flex-1">
            <input
              className={shopCompactInputClass}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={saving}
            />
          </CompactField>
          <CompactField label="Business Phone" className="min-w-[120px] flex-1">
            <input
              className={shopCompactInputClass}
              value={formatPhoneDisplay(businessPhone)}
              onChange={(e) => setBusinessPhone(phoneDigits(e.target.value))}
              disabled={saving}
            />
          </CompactField>
          <CompactField label="City" className="min-w-[120px] flex-1">
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
          <CompactField label="Address" className="min-w-[120px] flex-1">
            <input
              className={shopCompactInputClass}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={saving}
            />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow>
          <CompactField label="Zip Code" className="min-w-[120px] flex-1">
            <input
              className={shopCompactInputClass}
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              disabled={saving}
            />
          </CompactField>
          <CompactField label="HST No." className="min-w-[120px] flex-1">
            <input
              className={shopCompactInputClass}
              value={hst}
              onChange={(e) => setHst(e.target.value)}
              disabled={saving}
            />
          </CompactField>
          <CompactField label="Tax %" className="min-w-[120px] flex-1">
            <input
              className={shopCompactInputClass}
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              disabled={saving}
            />
          </CompactField>
          <CompactField label="E mail" className="min-w-[120px] flex-1">
            <input
              type="email"
              className={shopCompactInputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
            />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow className="items-start">
          <div className="min-w-[120px] flex-1">
            <div className="flex flex-col items-start gap-2">
              <div className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shop-business-upload-image"
                  checked={showUploadImage}
                  onChange={(e) => setShowUploadImage(e.target.checked)}
                  disabled={saving}
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
                onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <div className="min-w-[120px] flex-1" aria-hidden />
          <div className="min-w-[120px] flex-1" aria-hidden />
          <div className="min-w-[120px] flex-1" aria-hidden />
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
    resolvePerDaySchedule(perDayOpenHours ? { perDayOpenHours } : null)
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
    setSchedule(resolvePerDaySchedule(perDayOpenHours ? { perDayOpenHours } : null));
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
    if (!token) return;
    const nextSchedule = applyFormToSchedule();
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
            <CompactField label="Day" className={compactFixedFieldWidth}>
              <input
                type="text"
                readOnly
                value={shortDayLabel(formDay)}
                className={`${shopCompactInputClass} bg-gray-50`}
              />
            </CompactField>
            <CompactField label="Status" className={compactFixedFieldWidth}>
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
            <CompactField label="Opening time" className={compactFixedFieldWidth}>
              <OpenHoursTimePicker
                id="shop-hours-opening"
                value={formStart}
                disabled={!formOpen || saving}
                onChange={setFormStart}
              />
            </CompactField>
            <CompactField label="Closing Time" className={compactFixedFieldWidth}>
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
        {WEEK_DAYS.map((day, index) => {
          const entry = schedule[day];
              const isEditingRow = editingDay === day;
          return (
            <div
              key={day}
              className={`grid grid-cols-[4rem_1fr_1fr_auto] items-center gap-3 px-4 py-2.5 text-sm sm:grid-cols-[5rem_1fr_1fr_auto] ${
                isEditingRow
                  ? "bg-ad-form-required-bg"
                  : index % 2 === 0
                    ? "bg-gray-100"
                    : "bg-white"
              }`}
            >
              <span className="font-semibold text-gray-700">{shortDayLabel(day)}</span>
              <span className={`font-semibold ${entry.enabled ? "text-ad-purple" : "text-gray-500"}`}>
                {entry.enabled ? "Open" : "Closed"}
              </span>
              <span className="text-gray-700">
                {entry.enabled ? formatOpenHoursTimeDisplay(entry.start) : "—"}
              </span>
              <button
                type="button"
                title={`Edit ${day}`}
                aria-label={`Edit ${day}`}
                disabled={saving}
                onClick={() => openEditForm(day)}
                className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <FiEdit2 size={14} aria-hidden />
              </button>
            </div>
          );
        })}
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

function ShopCarBrandPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-end gap-1 border-t border-gray-200 bg-white px-3 py-2">
      {Array.from({ length: totalPages }, (_, index) => {
        const pageNumber = index + 1;
        const active = pageNumber === page;
        return (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={`min-w-[1.75rem] rounded border px-2 py-0.5 text-xs font-semibold ${
              active
                ? "border-gray-400 bg-white text-gray-900 shadow-sm"
                : "border-gray-300 bg-gray-50 text-gray-600 hover:bg-white"
            }`}
          >
            {pageNumber}
          </button>
        );
      })}
    </div>
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
  const [page, setPage] = useState(1);

  const sortedBrands = useMemo(
    () =>
      [...brands].sort((a, b) =>
        getCarBrandName(a).localeCompare(getCarBrandName(b), undefined, { sensitivity: "base" })
      ),
    [brands]
  );

  const totalPages = Math.max(1, Math.ceil(sortedBrands.length / CAR_BRANDS_PER_PAGE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageBrands = sortedBrands.slice((page - 1) * CAR_BRANDS_PER_PAGE, page * CAR_BRANDS_PER_PAGE);

  return (
    <div className="overflow-hidden rounded border border-gray-300 bg-white shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border-b border-gray-300 px-4 py-2.5 text-left text-xs font-bold text-gray-800">
              Name of Car Brand
            </th>
            <th className="border-b border-gray-300 px-4 py-2.5 text-right text-xs font-bold text-gray-800">
              Amblem
            </th>
          </tr>
        </thead>
        <tbody>
          {pageBrands.map((company, index) => {
            const id = getCarBrandId(company);
            const name = getCarBrandName(company);

            return (
              <tr key={id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border-b border-gray-200 px-4 py-2.5 font-medium text-gray-900">{name}</td>
                <td className="border-b border-gray-200 px-4 py-2.5">
                  <div className="flex items-center justify-end gap-3">
                    <div className={CAR_BRAND_LIST_LOGO_SLOT_CLASS}>
                      <CarBrandLogo company={company} className={CAR_BRAND_LIST_LOGO_CLASS} alt={`${name} emblem`} />
                    </div>
                    <button
                      type="button"
                      title={`Remove ${name}`}
                      aria-label={`Remove ${name}`}
                      disabled={savingBrandId === id}
                      onClick={() => onRemove(company)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-lg font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      <FiX size={16} aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ShopCarBrandPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
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
        <CompactField label="Name" className="min-w-[180px] flex-1">
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
        <CompactField label="Amblem" className="min-w-[180px] flex-1">
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

  return (
    <div className="overflow-hidden rounded border border-gray-300 bg-white shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border-b border-gray-300 px-4 py-2.5 text-left text-xs font-bold text-gray-800">
              Main Service
            </th>
            <th className="border-b border-gray-300 px-4 py-2.5 text-left text-xs font-bold text-gray-800">
              Match with
            </th>
            <th className="border-b border-gray-300 px-4 py-2.5 text-right text-xs font-bold text-gray-800">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedServices.map((service, index) => {
            const id = getServiceId(service);
            const name = getServiceName(service);
            const vendorLabel = getShopTypeLabel(service.shopType);

            return (
              <tr key={id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border-b border-gray-200 px-4 py-2.5 font-medium text-gray-900">{name}</td>
                <td className="border-b border-gray-200 px-4 py-2.5 text-gray-800">{vendorLabel}</td>
                <td className="border-b border-gray-200 px-4 py-2.5">
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      title={`Remove ${name}`}
                      aria-label={`Remove ${name}`}
                      disabled={savingServiceId === id}
                      onClick={() => onRemove(service)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      <FiX size={16} aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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
        <CompactField label="Main Service" className="min-w-[180px] flex-1">
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
        <CompactField label="Vendor Type" className="min-w-[180px] flex-1">
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
