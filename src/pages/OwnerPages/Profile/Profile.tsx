import { useEffect, useMemo, useRef, useState } from "react";
import { FiUser } from "react-icons/fi";
import { getJson } from "../../../api/mobileAuth";
import OwnerPageShell from "../../../components/owner/OwnerPageShell";
import {
  OwnerFormFooter,
  OwnerUploadChip,
  ownerFormInputClass,
  ownerFormLabelClass,
  ownerFormPanelClass,
} from "../../../components/owner/ownerUi";
import { Skeleton } from "../../../components/common/Skeleton";
import { useAuth } from "../../../auth";
import { useCarOwnerProfile } from "../../../hooks/useCarOwnerProfile";
import { parseCitiesApiResponse, type UserCity } from "../../../lib/carOwnerCities";
import { DUMMY_OWNER_PROFILE } from "../../../lib/dummyOwnerHomeProfile";
import { FormFieldError, fieldErrorClass } from "../../../lib/validation/formUi";

const labelClass = ownerFormLabelClass;
const inputClass = ownerFormInputClass;

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

  return (
    <OwnerPageShell
      pageHeading="Personal Profile"
      metaTitle="Profile | AutoDaddy"
      metaDescription="Car owner profile"
      noPanel
    >
      <div className="p-3 sm:p-5">
        {usingDummy ? (
          <p className="mb-3 inline-block rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-100">
            Demo preview
          </p>
        ) : null}
        {loading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <>
            <div className={ownerFormPanelClass}>
              <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-[1fr_0.8fr_0.8fr_1.4fr]">
                <label className="block">
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
                    className={fieldErrorClass(!!fieldErrors.name, inputClass)}
                  />
                  <FormFieldError message={fieldErrors.name} />
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
                    className={fieldErrorClass(!!fieldErrors.phone, inputClass)}
                  />
                  <FormFieldError message={fieldErrors.phone} />
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
                <label className="block">
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
                    className={fieldErrorClass(!!fieldErrors.address, inputClass)}
                  />
                  <FormFieldError message={fieldErrors.address} />
                </label>
                <div className="flex items-center gap-4 sm:col-span-2">
                  <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-gray-300 shadow-sm ring-1 ring-green-200">
                    {photoUri ? (
                      <img src={photoUri} alt="Profile photo" className="h-full w-full object-cover" />
                    ) : (
                      <FiUser size={26} strokeWidth={1.5} aria-hidden />
                    )}
                  </span>
                  <OwnerUploadChip
                    checked={showUploadImage}
                    onToggle={setShowUploadImage}
                    onPick={() => {
                      setShowUploadImage(true);
                      openPhotoPicker();
                    }}
                    disabled={saving}
                  />
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoSelected} />
                </div>
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
                    className={fieldErrorClass(!!fieldErrors.pincode, inputClass)}
                  />
                  <FormFieldError message={fieldErrors.pincode} />
                </label>
                <label className="block">
                  <span className={labelClass}>E-mail</span>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => {
                      setEditEmail(e.target.value);
                      clearFieldError("email");
                    }}
                    placeholder={usingDummy ? DUMMY_OWNER_PROFILE.email : "you@example.com"}
                    disabled={saving}
                    className={fieldErrorClass(!!fieldErrors.email, inputClass)}
                  />
                  <FormFieldError message={fieldErrors.email} />
                </label>
              </div>
            </div>
            <OwnerFormFooter
              note={display.name.trim() ? `You are editing the profile of ${previewName}` : "You are creating your Profile page"}
              onSave={() => void saveProfile()}
              saving={saving}
              saveLabel={saving ? "Updating…" : "Save"}
              onCancel={cancelEditing}
            />
          </>
        )}

        <p className="mt-8 text-center font-serif text-lg italic text-gray-500">
          With AutoDaddy, you are not just choosing a system — you are choosing a standard of excellence.
        </p>
      </div>
    </OwnerPageShell>
  );
}
