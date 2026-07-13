import { useEffect, useMemo, useRef, useState } from "react";
import { FiCamera, FiMail, FiMapPin, FiPhone, FiUser } from "react-icons/fi";
import { getJson } from "../../../api/mobileAuth";
import OwnerPageShell from "../../../components/owner/OwnerPageShell";
import { Skeleton } from "../../../components/common/Skeleton";
import { useAuth } from "../../../auth";
import { useCarOwnerProfile } from "../../../hooks/useCarOwnerProfile";
import { parseCitiesApiResponse, type UserCity } from "../../../lib/carOwnerCities";
import { DUMMY_OWNER_PROFILE } from "../../../lib/dummyOwnerHomeProfile";

const fieldErrorClass = "mt-1 text-[11px] font-medium text-rose-600";
const labelClass = "mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500";
const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:opacity-70";

export default function OwnerProfilePage() {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUploadImage, setShowUploadImage] = useState(false);
  const [cityOptions, setCityOptions] = useState<UserCity[]>([]);

  const {
    loading,
    saving,
    display,
    fieldErrors,
    editName,
    editEmail,
    editPhone,
    editAddress,
    editPincode,
    editCityId,
    editCityName,
    setEditName,
    setEditEmail,
    setEditPhone,
    setEditAddress,
    setEditPincode,
    setEditCityId,
    setEditCityName,
    clearFieldError,
    cancelEditing,
    saveProfile,
    uploadProfilePhoto,
    profileNameMaxLength,
    profileAddressMaxLength,
    pincodeDisplayMaxLength,
  } = useCarOwnerProfile();

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      const res = await getJson<unknown>("/api/user/cities?page=1", token);
      if (cancelled) return;
      if (res.ok) {
        setCityOptions(parseCitiesApiResponse(res.data));
      } else {
        setCityOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const citySelectValue = editCityId.trim() || editCityName.trim();

  const citySelectOptions = useMemo(() => {
    const cities = [...cityOptions];
    const selectedId = citySelectValue;
    const selectedName = editCityName.trim() || selectedId;
    if (selectedId && !cities.some((c) => c.id === selectedId || c.name === selectedName)) {
      cities.push({ id: selectedId, name: selectedName });
    }
    return cities.sort((a, b) => a.name.localeCompare(b.name));
  }, [cityOptions, citySelectValue, editCityName]);

  const onPhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void uploadProfilePhoto(file);
  };

  const openPhotoPicker = () => {
    if (!saving) fileInputRef.current?.click();
  };

  const photoUri = display.photoUri;
  const usingDummy =
    !loading && !display.name.trim() && !display.email.trim() && !display.address.trim();
  const previewName =
    editName.trim() || display.name || (usingDummy ? DUMMY_OWNER_PROFILE.name : "Car owner");
  const previewCity =
    editCityName.trim() || display.city || (usingDummy ? DUMMY_OWNER_PROFILE.city : "Add your city");
  const previewPhone =
    editPhone || display.phoneReadOnly || (usingDummy ? DUMMY_OWNER_PROFILE.phone : "No phone");
  const previewEmail =
    editEmail || display.email || (usingDummy ? DUMMY_OWNER_PROFILE.email : "No email");
  const previewAddress =
    editAddress || display.address || (usingDummy ? DUMMY_OWNER_PROFILE.address : "No address");
  const initials =
    previewName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?";

  return (
    <OwnerPageShell
      pageHeading=""
      metaTitle="Profile | AutoDaddy"
      metaDescription="Car owner profile"
      noPanel
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-slate-500">Account</p>
              {usingDummy ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-100">
                  Demo preview
                </span>
              ) : null}
            </div>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
              My profile
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Keep your contact details current for shops and invoices.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-sky-100">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  {photoUri ? (
                    <img
                      src={photoUri}
                      alt=""
                      className="size-24 rounded-2xl object-cover ring-4 ring-white shadow-md"
                    />
                  ) : (
                    <div className="flex size-24 items-center justify-center rounded-2xl bg-sky-100 text-2xl font-bold text-sky-800 ring-4 ring-white shadow-md">
                      {initials}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadImage(true);
                      openPhotoPicker();
                    }}
                    disabled={saving}
                    className="absolute -bottom-2 -right-2 flex size-9 items-center justify-center rounded-full bg-sky-600 text-white shadow-md hover:bg-sky-700 disabled:opacity-50"
                    aria-label="Upload profile photo"
                  >
                    <FiCamera size={16} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPhotoSelected}
                  />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{previewName}</h3>
                <p className="mt-1 text-sm text-slate-600">{previewCity}</p>
              </div>

              <ul className="mt-5 space-y-2.5 text-left text-sm text-slate-600">
                <li className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2">
                  <FiPhone className="shrink-0 text-sky-600" size={14} />
                  <span className="truncate">{previewPhone}</span>
                </li>
                <li className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2">
                  <FiMail className="shrink-0 text-indigo-600" size={14} />
                  <span className="truncate">{previewEmail}</span>
                </li>
                <li className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2">
                  <FiMapPin className="shrink-0 text-emerald-600" size={14} />
                  <span className="truncate">{previewAddress}</span>
                </li>
              </ul>
            </aside>

            <section className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5 md:p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                  <FiUser size={16} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit details</h3>
                  <p className="text-xs text-slate-500">Changes save to your car-owner account</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-1">
                  <span className={labelClass}>Name *</span>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => {
                      setEditName(e.target.value);
                      clearFieldError("name");
                    }}
                    maxLength={profileNameMaxLength}
                    placeholder={usingDummy ? DUMMY_OWNER_PROFILE.name : "Your name"}
                    disabled={saving}
                    className={inputClass}
                  />
                  {fieldErrors.name ? <p className={fieldErrorClass}>{fieldErrors.name}</p> : null}
                </label>

                <label className="block">
                  <span className={labelClass}>Phone</span>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => {
                      setEditPhone(e.target.value);
                      clearFieldError("phone");
                    }}
                    placeholder={usingDummy ? DUMMY_OWNER_PROFILE.phone : "781 708 9765"}
                    maxLength={12}
                    disabled={saving}
                    className={inputClass}
                  />
                  {fieldErrors.phone ? <p className={fieldErrorClass}>{fieldErrors.phone}</p> : null}
                </label>

                <label className="block">
                  <span className={labelClass}>Email</span>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => {
                      setEditEmail(e.target.value);
                      clearFieldError("email");
                    }}
                    placeholder={usingDummy ? DUMMY_OWNER_PROFILE.email : "you@example.com"}
                    disabled={saving}
                    className={inputClass}
                  />
                  {fieldErrors.email ? <p className={fieldErrorClass}>{fieldErrors.email}</p> : null}
                </label>

                <label className="block">
                  <span className={labelClass}>City</span>
                  <select
                    value={citySelectValue}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      const city = citySelectOptions.find((c) => c.id === nextId);
                      setEditCityId(nextId);
                      setEditCityName(city?.name ?? nextId);
                    }}
                    disabled={saving}
                    className={inputClass}
                  >
                    <option value="">Select city</option>
                    {citySelectOptions.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block sm:col-span-1">
                  <span className={labelClass}>Address</span>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => {
                      setEditAddress(e.target.value);
                      clearFieldError("address");
                    }}
                    maxLength={profileAddressMaxLength}
                    placeholder={usingDummy ? DUMMY_OWNER_PROFILE.address : "Street address"}
                    disabled={saving}
                    className={inputClass}
                  />
                  {fieldErrors.address ? (
                    <p className={fieldErrorClass}>{fieldErrors.address}</p>
                  ) : null}
                </label>

                <label className="block">
                  <span className={labelClass}>Zip</span>
                  <input
                    type="text"
                    value={editPincode}
                    onChange={(e) => {
                      setEditPincode(e.target.value);
                      clearFieldError("pincode");
                    }}
                    maxLength={pincodeDisplayMaxLength}
                    placeholder={usingDummy ? DUMMY_OWNER_PROFILE.pincode : "A1A 1A1"}
                    disabled={saving}
                    className={inputClass}
                  />
                  {fieldErrors.pincode ? (
                    <p className={fieldErrorClass}>{fieldErrors.pincode}</p>
                  ) : null}
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={showUploadImage}
                    onChange={(e) => setShowUploadImage(e.target.checked)}
                    disabled={saving}
                    className="h-3.5 w-3.5 accent-sky-600"
                  />
                  Show photo upload
                </label>
                {showUploadImage ? (
                  <button
                    type="button"
                    onClick={openPhotoPicker}
                    disabled={saving}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Choose image
                  </button>
                ) : null}
                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveProfile()}
                    disabled={saving}
                    className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    {saving ? "Updating…" : "Save changes"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        <p className="text-center text-sm italic text-slate-500">
          With AutoDaddy, you are not just choosing a system — you are choosing a standard of excellence.
        </p>
      </div>
    </OwnerPageShell>
  );
}
