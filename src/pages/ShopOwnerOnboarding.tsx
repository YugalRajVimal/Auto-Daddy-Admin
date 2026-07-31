import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { toast } from "react-toastify";
import { getJson } from "../api/mobileAuth";
import { useAuth } from "../auth";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../components/admin/ContentPanel";
import { parseCitiesApiResponse } from "../lib/carOwnerCities";
import {
  formatPincodeDisplay,
  isValidCanadianPostalCode,
  normalizePostalCodeForStorage,
} from "../lib/carOwnerProfile";
import { getServiceId, parseServiceCatalog } from "../lib/dummyServices";
import { normalizeMediaUrl } from "../lib/normalizeMediaUrl";
import {
  createDefaultPerDaySchedule,
  enabledWeekdaysFromSchedule,
  resolvePerDaySchedule,
  serializePerDayOpenHoursForApi,
  validatePerDaySchedule,
  WEEK_DAYS,
  type PerDaySchedule,
  type WeekDay,
} from "../lib/perDayOpenHours";
import { formatPhoneDisplay, phoneDigits } from "../lib/phoneFormat";
import { resolveShopIncompleteKindFromAuthFlags } from "../lib/shopProfileCompleteness";
import {
  SHOP_TYPE_OPTIONS,
  normalizeShopTypes,
  type ShopType,
} from "../lib/shopTypes";
import {
  completeBusinessProfile,
  fetchAdminServices,
  fetchBusinessProfile,
  type ApiEnvelope,
} from "../lib/autoshopownerApi";
import { FormFieldError } from "../lib/validation/formUi";

type CatalogItem = { id: string; name: string; desc?: string };

function apiMessage(data: ApiEnvelope | null | undefined): string {
  return typeof data?.message === "string" ? data.message.trim() : "";
}

function pickString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

function pickServiceIds(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          const o = item as Record<string, unknown>;
          return pickString(o._id, o.id);
        }
        return "";
      })
      .filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return pickServiceIds(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

function unwrapBusinessProfilePayload(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const data = root.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return root;
}

export default function ShopOwnerOnboardingPage() {
  const { token, role, session, login, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const needsBusinessOnboarding =
    resolveShopIncompleteKindFromAuthFlags({
      isAutoShopBusinessProfileComplete: session?.meta?.isAutoShopBusinessProfileComplete,
    }) === "business";

  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState(session?.profile?.email ?? "");
  const [businessHSTNumber, setBusinessHSTNumber] = useState("");
  const [gstPercent, setGstPercent] = useState("");
  const [shopTypes, setShopTypes] = useState<ShopType[]>([]);
  const [schedule, setSchedule] = useState<PerDaySchedule>(createDefaultPerDaySchedule);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [businessErrors, setBusinessErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token || role !== "auto_shop_owner") {
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    void (async () => {
      try {
        const res = await fetchBusinessProfile(token);
        if (cancelled || !res.ok) return;
        const d = unwrapBusinessProfilePayload(res.data);
        if (!d) return;

        setBusinessName(pickString(d.businessName));
        setBusinessAddress(pickString(d.businessAddress, d.address));
        setBusinessCity(pickString(d.city));
        setPincode(formatPincodeDisplay(pickString(d.pincode, d.zipCode, d.zip)));
        setLat(pickString(d.lat, d.latitude));
        setLng(pickString(d.lng, d.longitude));
        setBusinessPhone(phoneDigits(pickString(d.businessPhone)));
        setBusinessEmail(pickString(d.businessEmail, d.email) || session?.profile?.email || "");
        setBusinessHSTNumber(pickString(d.businessHSTNumber, d.hstNumber).toUpperCase());
        const gst = pickString(d.gst, d.gstPercent);
        if (gst) setGstPercent(gst.replace(/[^\d.]/g, "").replace(/\..*$/, "").slice(0, 3));
        const loadedTypes = normalizeShopTypes(
          (d.shopTypes as string | string[] | null | undefined) ??
            (d.shopType as string | string[] | null | undefined)
        );
        // Prefer API values; if API sent none, leave empty so the owner must choose.
        const hadShopTypes =
          d.shopTypes != null || d.shopType != null;
        setShopTypes(hadShopTypes ? loadedTypes : []);
        setSchedule(resolvePerDaySchedule(d));
        setSelectedServiceIds(
          pickServiceIds(d.serviceWeWorkWith ?? d.servicesWeWorkWith ?? d.myServices)
        );
        const logoUrl = normalizeMediaUrl(
          pickString(d.businessLogo, d.logo, d.logoUrl) || null
        );
        if (logoUrl) setExistingLogoUrl(logoUrl);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, role, session?.profile?.email]);

  useEffect(() => {
    if (!token || role !== "auto_shop_owner") return;
    let cancelled = false;
    void (async () => {
      const res = await getJson<unknown>("/api/user/cities?page=1", token);
      if (cancelled || !res.ok) return;
      setCityOptions(parseCitiesApiResponse(res.data).map((c) => c.name));
    })();
    return () => {
      cancelled = true;
    };
  }, [token, role]);

  useEffect(() => {
    if (!token || role !== "auto_shop_owner" || profileLoading) return;
    let cancelled = false;
    setCatalogLoading(true);
    void (async () => {
      try {
        const typesToFetch = shopTypes.length > 0 ? shopTypes : (["autoShop"] as ShopType[]);
        const results = await Promise.all(
          typesToFetch.map((shopType) => fetchAdminServices(token, { shopType }))
        );
        if (cancelled) return;
        const byId = new Map<string, CatalogItem>();
        for (const res of results) {
          if (!res.ok) continue;
          for (const s of parseServiceCatalog(res.data)) {
            const id = getServiceId(s);
            const nameLabel = (s.name ?? "").trim();
            if (id && nameLabel && !byId.has(id)) {
              byId.set(id, { id, name: nameLabel, desc: s.desc });
            }
          }
        }
        const items = [...byId.values()];
        setCatalog(items);
        if (byId.size > 0) {
          setSelectedServiceIds((prev) => prev.filter((id) => byId.has(id)));
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, role, shopTypes, profileLoading]);

  useEffect(() => {
    if (!logo) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logo);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logo]);

  const citySelectOptions = useMemo(() => {
    const names = new Set(cityOptions);
    if (businessCity.trim()) names.add(businessCity.trim());
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [cityOptions, businessCity]);

  const logoImageUrl = logoPreview ?? existingLogoUrl;

  if (isLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
      </div>
    );
  }

  if (!token || role !== "auto_shop_owner") {
    return <Navigate to="/" replace />;
  }

  if (!needsBusinessOnboarding) {
    return <Navigate to="/shop" replace />;
  }

  const updateDay = (
    day: WeekDay,
    patch: Partial<{ enabled: boolean; start: string; end: string }>
  ) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...patch },
    }));
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

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
        setGpsLoading(false);
        toast.success("GPS coordinates updated.");
      },
      () => {
        setGpsLoading(false);
        toast.error("Could not fetch GPS coordinates. Allow location access and try again.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const saveBusiness = async () => {
    if (!token || !session) return;

    const errors: Record<string, string> = {};
    if (!businessName.trim()) errors.businessName = "Business name is required.";
    if (!businessAddress.trim()) errors.businessAddress = "Address is required.";
    if (!businessCity.trim()) errors.businessCity = "City is required.";
    if (!pincode.trim()) errors.pincode = "Zip / postal code is required.";
    else if (!isValidCanadianPostalCode(pincode)) {
      errors.pincode = "Enter a valid Canadian postal code.";
    }
    if (!lat.trim() || !lng.trim()) errors.lat = "Latitude and longitude are required.";
    const phone = phoneDigits(businessPhone);
    if (phone.length !== 10) errors.businessPhone = "Business phone must be 10 digits.";
    if (!businessEmail.trim() || !/^\S+@\S+\.\S+$/.test(businessEmail.trim())) {
      errors.businessEmail = "Enter a valid business email.";
    }
    if (!businessHSTNumber.trim()) errors.businessHSTNumber = "TAX ID / HST number is required.";
    const gstDigits = gstPercent.replace(/\D/g, "").slice(0, 3);
    if (!gstDigits) errors.gst = "GST % is required.";
    else if (Number(gstDigits) > 100) errors.gst = "GST % must be 0–100.";
    if (shopTypes.length === 0) errors.shopTypes = "Select at least one business type.";

    const hoursError = validatePerDaySchedule(schedule);
    if (hoursError) errors.hours = hoursError;
    if (enabledWeekdaysFromSchedule(schedule).length === 0) {
      errors.hours = "Please enable at least one open day.";
    }
    if (catalog.length > 0 && selectedServiceIds.length === 0) {
      errors.services = "Select at least one service your shop offers.";
    }

    setBusinessErrors(errors);
    if (Object.keys(errors).length) {
      toast.error(Object.values(errors)[0] ?? "Please fill all business profile fields.");
      return;
    }

    setSaving(true);
    try {
      const res = await completeBusinessProfile(token, {
        businessName: businessName.trim(),
        businessAddress: businessAddress.trim(),
        city: businessCity.trim(),
        pincode: normalizePostalCodeForStorage(pincode),
        lat: lat.trim(),
        lng: lng.trim(),
        businessPhone: phone,
        businessEmail: businessEmail.trim(),
        businessHSTNumber: businessHSTNumber.trim().toUpperCase(),
        gst: gstDigits,
        shopTypes,
        perDayOpenHours: serializePerDayOpenHoursForApi(schedule),
        serviceWeWorkWith: selectedServiceIds,
        businessLogo: logo,
      });

      if (!res.ok || res.data?.success === false) {
        toast.error(apiMessage(res.data) || "Failed to complete business profile.");
        return;
      }

      login({
        ...session,
        meta: {
          ...session.meta,
          isAutoShopBusinessProfileComplete: true,
        },
      });

      toast.success(apiMessage(res.data) || "Business profile completed successfully.");
      navigate("/shop", { replace: true });
    } catch {
      toast.error("Network error while submitting business profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center py-10">
      <h1 className="mb-2 text-center font-serif text-2xl font-bold text-gray-900">
        Complete your business setup
      </h1>
      <p className="mb-6 text-center text-sm text-gray-600">
        Fill all fields to continue as an auto shop owner.
      </p>

      <CompactFormPanel
        footer={
          <CompactFormFooter
            message="First-time shop business setup"
            messageCenter
            actionLabel={saving ? "Submitting…" : "Complete Business Profile"}
            onSave={() => void saveBusiness()}
            onCancel={() => logout(true)}
            cancelLabel="Sign out"
          />
        }
      >
        <div className="space-y-4">
          <CompactFormRow>
            <CompactField label="Business Name">
              <input
                className={compactInputClass}
                maxLength={50}
                disabled={saving}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
              <FormFieldError message={businessErrors.businessName} />
            </CompactField>
            <CompactField label="Business Address">
              <input
                className={compactInputClass}
                maxLength={80}
                disabled={saving}
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
              />
              <FormFieldError message={businessErrors.businessAddress} />
            </CompactField>
          </CompactFormRow>

          <CompactFormRow>
            <CompactField label="City">
              <select
                className={compactInputClass}
                disabled={saving}
                value={businessCity}
                onChange={(e) => setBusinessCity(e.target.value)}
              >
                <option value="">Select city</option>
                {citySelectOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <FormFieldError message={businessErrors.businessCity} />
            </CompactField>
            <CompactField label="Zip Code">
              <input
                className={compactInputClass}
                disabled={saving}
                value={pincode}
                onChange={(e) => setPincode(formatPincodeDisplay(e.target.value))}
                autoCapitalize="characters"
              />
              <FormFieldError message={businessErrors.pincode} />
            </CompactField>
          </CompactFormRow>

          <CompactFormRow>
            <CompactField label="Latitude">
              <input
                className={compactInputClass}
                disabled={saving}
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
              <FormFieldError message={businessErrors.lat} />
            </CompactField>
            <CompactField label="Longitude">
              <input
                className={compactInputClass}
                disabled={saving}
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </CompactField>
          </CompactFormRow>

          <div>
            <button
              type="button"
              disabled={saving || gpsLoading}
              onClick={handleUseGps}
              className="rounded-md bg-ad-purple px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {gpsLoading ? "Locating…" : "Use device GPS"}
            </button>
          </div>

          <CompactFormRow>
            <CompactField label="Business Phone">
              <input
                className={compactInputClass}
                disabled={saving}
                value={formatPhoneDisplay(businessPhone)}
                onChange={(e) => setBusinessPhone(phoneDigits(e.target.value).slice(0, 10))}
              />
              <FormFieldError message={businessErrors.businessPhone} />
            </CompactField>
            <CompactField label="Business Email">
              <input
                type="email"
                className={compactInputClass}
                disabled={saving}
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
              />
              <FormFieldError message={businessErrors.businessEmail} />
            </CompactField>
          </CompactFormRow>

          <CompactFormRow>
            <CompactField label="Business HST Number">
              <input
                className={compactInputClass}
                disabled={saving}
                maxLength={30}
                value={businessHSTNumber}
                onChange={(e) =>
                  setBusinessHSTNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 30))
                }
              />
              <FormFieldError message={businessErrors.businessHSTNumber} />
            </CompactField>
            <CompactField label="GST %">
              <input
                className={compactInputClass}
                disabled={saving}
                inputMode="numeric"
                maxLength={3}
                value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value.replace(/\D/g, "").slice(0, 3))}
              />
              <FormFieldError message={businessErrors.gst} />
            </CompactField>
          </CompactFormRow>

          <div>
            <p className="mb-1 text-sm font-semibold text-gray-800">Business Types</p>
            <p className="mb-2 text-xs text-gray-600">Select every shop type you operate.</p>
            <div className="space-y-2 rounded-md border border-gray-200 p-3">
              {SHOP_TYPE_OPTIONS.map((option) => {
                const checked = shopTypes.includes(option.value);
                const locked = checked && shopTypes.length === 1;
                return (
                  <label
                    key={option.value}
                    className={`flex items-center gap-2 text-sm text-gray-800 ${
                      locked ? "cursor-default opacity-80" : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-ad-green"
                      checked={checked}
                      disabled={saving || locked}
                      onChange={() => toggleShopType(option.value)}
                    />
                    <span className="font-medium">{option.label}</span>
                  </label>
                );
              })}
            </div>
            <FormFieldError message={businessErrors.shopTypes} />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-gray-800">Open hours</p>
            <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="flex flex-wrap items-center gap-3 text-sm">
                  <label className="flex w-28 items-center gap-2 font-medium text-gray-800">
                    <input
                      type="checkbox"
                      checked={schedule[day].enabled}
                      disabled={saving}
                      onChange={(e) => updateDay(day, { enabled: e.target.checked })}
                    />
                    {day.slice(0, 3)}
                  </label>
                  <input
                    type="time"
                    className={compactInputClass}
                    disabled={saving || !schedule[day].enabled}
                    value={schedule[day].start}
                    onChange={(e) => updateDay(day, { start: e.target.value })}
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    className={compactInputClass}
                    disabled={saving || !schedule[day].enabled}
                    value={schedule[day].end}
                    onChange={(e) => updateDay(day, { end: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <FormFieldError message={businessErrors.hours} />
          </div>

          <div>
            <p className="mb-1 text-sm font-semibold text-gray-800">Services you offer</p>
            <p className="mb-2 text-xs text-gray-600">Select every category your shop can provide.</p>
            {catalogLoading ? (
              <p className="text-sm text-gray-500">Loading services…</p>
            ) : catalog.length === 0 ? (
              <p className="text-sm text-gray-500">
                No services available right now. You can complete your profile and add services later.
              </p>
            ) : (
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-3">
                {catalog.map((item) => {
                  const checked = selectedServiceIds.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className="flex cursor-pointer items-start gap-2 text-sm text-gray-800"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={checked}
                        disabled={saving}
                        onChange={(e) => {
                          setSelectedServiceIds((prev) =>
                            e.target.checked
                              ? prev.includes(item.id)
                                ? prev
                                : [...prev, item.id]
                              : prev.filter((id) => id !== item.id)
                          );
                        }}
                      />
                      <span>
                        <span className="font-medium">{item.name}</span>
                        {item.desc ? (
                          <span className="mt-0.5 block text-xs text-gray-500">{item.desc}</span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
            <FormFieldError message={businessErrors.services} />
          </div>

          <CompactField label="Business logo">
            <div className="flex items-center gap-3">
              {logoImageUrl ? (
                <img
                  src={logoImageUrl}
                  alt="Business logo preview"
                  className="h-14 w-14 rounded-md object-cover border border-gray-200"
                />
              ) : null}
              <button
                type="button"
                disabled={saving}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800"
                onClick={() => logoInputRef.current?.click()}
              >
                {logo || existingLogoUrl ? "Change logo" : "Upload logo"}
              </button>
              {logo ? (
                <button
                  type="button"
                  disabled={saving}
                  className="text-sm font-medium text-red-600"
                  onClick={() => setLogo(null)}
                >
                  Remove
                </button>
              ) : null}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
              />
            </div>
          </CompactField>
        </div>
      </CompactFormPanel>
    </div>
  );
}
