import { useRef, useState } from "react";
import { FiUser } from "react-icons/fi";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import {
  CompactAutoGrowTextarea,
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../../components/admin/ContentPanel";
import OwnerCityPicker from "../../components/owner/OwnerCityPicker";
import { useAuth } from "../../auth";
import { useCarOwnerProfile } from "../../hooks/useCarOwnerProfile";
import { formatPincodeDisplay } from "../../lib/carOwnerProfile";

const fieldErrorClass = "mt-0.5 text-[11px] text-red-600";

export default function OwnerProfilePage() {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  const {
    loading,
    saving,
    isEditing,
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
    startEditing,
    cancelEditing,
    saveProfile,
    uploadProfilePhoto,
    profileNameMaxLength,
    profileAddressMaxLength,
    pincodeDisplayMaxLength,
  } = useCarOwnerProfile();

  const onPhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void uploadProfilePhoto(file);
  };

  return (
    <PortalPageContent>
      <PageMeta title="Profile | AutoDaddy" description="Car owner profile" />

      <h1 className="mb-4 text-base font-bold text-blue-700">Profile Photo</h1>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-5 md:flex-row md:items-start">
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="relative flex h-44 w-44 items-center justify-center overflow-hidden border-2 border-ad-green bg-white shadow-sm disabled:opacity-60 md:h-48 md:w-48"
                aria-label="Upload profile photo"
              >
                {display.photoUri ? (
                  <img src={display.photoUri} alt="" className="h-full w-full object-cover" />
                ) : (
                  <FiUser size={64} className="text-gray-300" />
                )}
                {saving ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-semibold text-ad-purple">
                    Saving…
                  </span>
                ) : null}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPhotoSelected}
              />
              <p className="mt-2 max-w-[12rem] text-center text-xs text-gray-500">Click photo to upload</p>
            </div>

            <div className="min-w-0 flex-1">
              <CompactFormPanel
                footer={
                  <CompactFormFooter
                    message={
                      isEditing
                        ? "You are updating your profile"
                        : "You are viewing your profile"
                    }
                    messageCenter
                    actionLabel={
                      saving ? "Saving..." : isEditing ? "Save" : "Edit Profile"
                    }
                    onSave={
                      isEditing
                        ? () => void saveProfile()
                        : startEditing
                    }
                    onCancel={isEditing ? cancelEditing : undefined}
                    cancelLabel={isEditing ? "Cancel" : undefined}
                  />
                }
              >
                <CompactFormRow>
                  <CompactField label="Full name" required className="min-w-[180px] flex-1">
                    <input
                      type="text"
                      value={isEditing ? editName : display.name}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        clearFieldError("name");
                      }}
                      maxLength={profileNameMaxLength}
                      placeholder="Your name"
                      disabled={!isEditing || saving}
                      className={compactInputClass}
                    />
                    {isEditing && fieldErrors.name ? (
                      <p className={fieldErrorClass}>{fieldErrors.name}</p>
                    ) : null}
                  </CompactField>

                  <CompactField label="Email" className="min-w-[180px] flex-1">
                    <input
                      type="email"
                      value={isEditing ? editEmail : display.email}
                      onChange={(e) => {
                        setEditEmail(e.target.value);
                        clearFieldError("email");
                      }}
                      placeholder="you@example.com"
                      disabled={!isEditing || saving}
                      className={compactInputClass}
                    />
                    {isEditing && fieldErrors.email ? (
                      <p className={fieldErrorClass}>{fieldErrors.email}</p>
                    ) : null}
                  </CompactField>
                </CompactFormRow>

                <CompactFormRow>
                  <CompactField label="Phone" className="min-w-[180px] flex-1">
                    <input
                      type="tel"
                      value={isEditing ? editPhone : display.phoneReadOnly || "—"}
                      onChange={(e) => {
                        setEditPhone(e.target.value);
                        clearFieldError("phone");
                      }}
                      placeholder="781 708 9765"
                      maxLength={12}
                      disabled={!isEditing || saving}
                      className={compactInputClass}
                    />
                    {isEditing && fieldErrors.phone ? (
                      <p className={fieldErrorClass}>{fieldErrors.phone}</p>
                    ) : null}
                  </CompactField>

                  <CompactField label="City" className="min-w-[180px] flex-1">
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={() => setCityPickerOpen(true)}
                        disabled={saving}
                        className={`${compactInputClass} text-left hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-50`}
                      >
                        {editCityName || "Tap to choose your city"}
                      </button>
                    ) : (
                      <input
                        type="text"
                        value={display.city || "—"}
                        disabled
                        className={compactInputClass}
                      />
                    )}
                  </CompactField>
                </CompactFormRow>

                <CompactFormRow className="items-start">
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-xs font-bold text-ad-green-dark">Address</label>
                    {isEditing ? (
                      <CompactAutoGrowTextarea
                        value={editAddress}
                        onChange={(e) => {
                          setEditAddress(e.target.value);
                          clearFieldError("address");
                        }}
                        maxLength={profileAddressMaxLength}
                        placeholder="Address"
                        disabled={saving}
                      />
                    ) : (
                      <textarea
                        value={display.address || "—"}
                        disabled
                        rows={2}
                        className={`${compactInputClass} resize-none`}
                      />
                    )}
                    {isEditing && fieldErrors.address ? (
                      <p className={fieldErrorClass}>{fieldErrors.address}</p>
                    ) : null}
                  </div>

                  <CompactField label="Zip Code" className="min-w-[140px] shrink-0 sm:w-[180px]">
                    <input
                      type="text"
                      value={isEditing ? editPincode : formatPincodeDisplay(display.pincode)}
                      onChange={(e) => {
                        setEditPincode(e.target.value);
                        clearFieldError("pincode");
                      }}
                      placeholder="A1A 1A1"
                      maxLength={pincodeDisplayMaxLength}
                      disabled={!isEditing || saving}
                      className={compactInputClass}
                    />
                    {isEditing && fieldErrors.pincode ? (
                      <p className={fieldErrorClass}>{fieldErrors.pincode}</p>
                    ) : null}
                  </CompactField>
                </CompactFormRow>
              </CompactFormPanel>
            </div>
          </div>

          <footer className="mt-10 pb-4 text-center font-serif text-sm italic text-gray-600">
            With Autodaddy, you are not just choosing a system- you are choosing a standard of excellence
          </footer>
        </>
      )}

      <OwnerCityPicker
        open={cityPickerOpen}
        onClose={() => setCityPickerOpen(false)}
        token={token}
        selectedId={editCityId.trim() || null}
        onSelect={(city) => {
          setEditCityId(city.id);
          setEditCityName(city.name);
        }}
      />
    </PortalPageContent>
  );
}
