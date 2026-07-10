import { useEffect, useMemo, useRef, useState } from "react";
import { getJson } from "../../api/mobileAuth";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../../components/admin/ContentPanel";
import OwnerPageShell, { OwnerPageSidebar } from "../../components/owner/OwnerPageShell";
import OwnerProfileSidebarNav from "../../components/owner/OwnerProfileSidebarNav";
import { useAuth } from "../../auth";
import { useCarOwnerProfile } from "../../hooks/useCarOwnerProfile";
import { parseCitiesApiResponse, type UserCity } from "../../lib/carOwnerCities";

const fieldErrorClass = "mt-0.5 text-[11px] text-red-600";
const checkboxBoxClass =
  "inline-block border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs text-gray-800";

export default function OwnerProfilePage() {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUploadImage, setShowUploadImage] = useState(false);
  const [cityOptions, setCityOptions] = useState<UserCity[]>([]);

  const {
    loading,
    saving,
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

  return (
    <OwnerPageShell
      pageHeading="My Profile"
      metaTitle="Profile | AutoDaddy"
      metaDescription="Car owner profile"
      customSidebar={
        <OwnerPageSidebar>
          <OwnerProfileSidebarNav />
        </OwnerPageSidebar>
      }
      heroCardFlush
      contentTopOffset
    >
      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
        </div>
      ) : (
        <>
          <CompactFormPanel
              footer={
                <CompactFormFooter
                  message="You are updating your profile"
                  messageCenter
                  actionLabel={saving ? "Updating..." : "Update"}
                  onSave={() => void saveProfile()}
                  onCancel={cancelEditing}
                  cancelLabel="Reset"
                />
              }
            >
              <div className="space-y-4">
                <CompactFormRow>
                  <CompactField label="Name" required className="min-w-[120px] flex-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        clearFieldError("name");
                      }}
                      maxLength={profileNameMaxLength}
                      placeholder="Your name"
                      disabled={saving}
                      className={compactInputClass}
                    />
                    {fieldErrors.name ? (
                      <p className={fieldErrorClass}>{fieldErrors.name}</p>
                    ) : null}
                  </CompactField>

                  <CompactField label="Phone" className="min-w-[120px] flex-1">
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => {
                        setEditPhone(e.target.value);
                        clearFieldError("phone");
                      }}
                      placeholder="781 708 9765"
                      maxLength={12}
                      disabled={saving}
                      className={compactInputClass}
                    />
                    {fieldErrors.phone ? (
                      <p className={fieldErrorClass}>{fieldErrors.phone}</p>
                    ) : null}
                  </CompactField>

                  <CompactField label="Email" className="min-w-[120px] flex-1">
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => {
                        setEditEmail(e.target.value);
                        clearFieldError("email");
                      }}
                      placeholder="you@example.com"
                      disabled={saving}
                      className={compactInputClass}
                    />
                    {fieldErrors.email ? (
                      <p className={fieldErrorClass}>{fieldErrors.email}</p>
                    ) : null}
                  </CompactField>

                  <CompactField label="City" className="min-w-[120px] flex-1">
                    <select
                      value={citySelectValue}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        const city = citySelectOptions.find((c) => c.id === nextId);
                        setEditCityId(nextId);
                        setEditCityName(city?.name ?? nextId);
                      }}
                      disabled={saving}
                      className={compactInputClass}
                    >
                      <option value="">Select city</option>
                      {citySelectOptions.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </CompactField>
                </CompactFormRow>

                <CompactFormRow className="items-start">
                  <div className="min-w-[120px] flex-1">
                    <div className="flex flex-col items-start gap-2">
                      <div className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="profile-upload-image"
                          checked={showUploadImage}
                          onChange={(e) => setShowUploadImage(e.target.checked)}
                          disabled={saving}
                          className="h-3.5 w-3.5 accent-ad-green"
                        />
                        <label
                          htmlFor="profile-upload-image"
                          className="text-xs font-bold text-ad-green-dark"
                        >
                          Upload Image
                        </label>
                      </div>
                      {showUploadImage ? (
                        <>
                          <button
                            type="button"
                            onClick={openPhotoPicker}
                            disabled={saving}
                            className={`${checkboxBoxClass} hover:bg-gray-200 disabled:opacity-60`}
                          >
                            Choose image
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onPhotoSelected}
                          />
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="min-w-[120px] flex-1" aria-hidden />

                  <CompactField label="Address" className="min-w-[120px] flex-1">
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => {
                        setEditAddress(e.target.value);
                        clearFieldError("address");
                      }}
                      maxLength={profileAddressMaxLength}
                      placeholder="Address"
                      disabled={saving}
                      className={compactInputClass}
                    />
                    {fieldErrors.address ? (
                      <p className={fieldErrorClass}>{fieldErrors.address}</p>
                    ) : null}
                  </CompactField>

                  <CompactField label="Zip" className="min-w-[120px] flex-1">
                    <input
                      type="text"
                      value={editPincode}
                      onChange={(e) => {
                        setEditPincode(e.target.value);
                        clearFieldError("pincode");
                      }}
                      maxLength={pincodeDisplayMaxLength}
                      placeholder="A1A 1A1"
                      disabled={saving}
                      className={compactInputClass}
                    />
                    {fieldErrors.pincode ? (
                      <p className={fieldErrorClass}>{fieldErrors.pincode}</p>
                    ) : null}
                  </CompactField>
                </CompactFormRow>
              </div>
            </CompactFormPanel>

          <footer className="mt-4 text-center font-serif text-lg italic leading-snug text-gray-600 md:text-xl lg:text-2xl">
            <p>With Autodaddy, you are not just choosing a system,</p>
            <p>You are choosing a standard of excellence</p>
          </footer>
        </>
      )}
    </OwnerPageShell>
  );
}
