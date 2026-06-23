import { useEffect, useRef, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import PortalSidebarButton from "../../components/admin/PortalSidebarButton";
import {
  CompactAutoGrowTextarea,
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../../components/admin/ContentPanel";
import OwnerCityPicker from "../../components/owner/OwnerCityPicker";
import OwnerFaqsDialog from "../../components/owner/OwnerFaqsDialog";
import { OwnerFaqsButton } from "../../components/owner/OwnerFaqsButton";
import { useAuth } from "../../auth";
import { useCarOwnerProfile } from "../../hooks/useCarOwnerProfile";
import { useCarOwnerDashboard } from "../../hooks/useOwnerPortal";

const fieldErrorClass = "mt-0.5 text-[11px] text-red-600";
const checkboxBoxClass =
  "inline-block border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs text-gray-800";

export default function OwnerProfilePage() {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [showUploadImage, setShowUploadImage] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const { faqsHeading, faqsDescription } = useCarOwnerDashboard();

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
    editCityId,
    editCityName,
    setEditName,
    setEditEmail,
    setEditPhone,
    setEditAddress,
    setEditCityId,
    setEditCityName,
    clearFieldError,
    startEditing,
    cancelEditing,
    saveProfile,
    uploadProfilePhoto,
    profileNameMaxLength,
    profileAddressMaxLength,
  } = useCarOwnerProfile();

  useEffect(() => {
    if (display.email?.trim()) setShowEmail(true);
  }, [display.email]);

  const onPhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void uploadProfilePhoto(file);
  };

  const openPhotoPicker = () => {
    if (!saving) fileInputRef.current?.click();
  };

  return (
    <PortalPageContent className="flex flex-col px-3 py-3 sm:px-4 md:py-4 lg:px-6">
      <PageMeta title="Profile | AutoDaddy" description="Car owner profile" />

      <h1 className="mb-4 font-serif text-2xl text-gray-600 md:text-3xl">My Profile</h1>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
            <aside className="relative flex w-full shrink-0 flex-col gap-3 overflow-visible lg:w-[220px] xl:w-[260px] lg:min-h-[calc(100vh-220px)]">
              <PortalSidebarButton label="Personal Profile" active />
              <div className="mt-auto mb-10 flex flex-col gap-3 pt-6 lg:mb-14">
                <OwnerFaqsButton onClick={() => setFaqsOpen(true)} />
              </div>
            </aside>

            <div className="min-w-0 flex-1 lg:min-h-[calc(100vh-220px)]">
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
                    cancelLabel={isEditing ? "Reset" : undefined}
                  />
                }
              >
                <CompactFormRow>
                  <CompactField label="Name" required className="min-w-[120px] flex-1">
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

                  <CompactField label="Phone" className="min-w-[120px] flex-1">
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

                  <CompactField label="City" className="min-w-[120px] flex-1">
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

                  <CompactField label="Address" className="min-w-[120px] flex-1">
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
                      <input
                        type="text"
                        value={display.address || "—"}
                        disabled
                        className={compactInputClass}
                      />
                    )}
                    {isEditing && fieldErrors.address ? (
                      <p className={fieldErrorClass}>{fieldErrors.address}</p>
                    ) : null}
                  </CompactField>
                </CompactFormRow>

                <CompactFormRow className="items-center">
                  <div className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="profile-upload-image"
                      checked={showUploadImage}
                      onChange={(e) => setShowUploadImage(e.target.checked)}
                      disabled={saving}
                      className="h-3.5 w-3.5 accent-ad-green"
                    />
                    <label htmlFor="profile-upload-image" className="text-xs font-bold text-ad-green-dark">
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

                  <div className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="profile-show-email"
                      checked={showEmail}
                      onChange={(e) => setShowEmail(e.target.checked)}
                      disabled={saving}
                      className="h-3.5 w-3.5 accent-ad-green"
                    />
                    <label htmlFor="profile-show-email" className="sr-only">
                      Email
                    </label>
                  </div>
                  {showEmail ? (
                    isEditing ? (
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => {
                          setEditEmail(e.target.value);
                          clearFieldError("email");
                        }}
                        placeholder="you@example.com"
                        disabled={saving}
                        className={`${compactInputClass} max-w-[240px]`}
                      />
                    ) : (
                      <span className={checkboxBoxClass}>{display.email?.trim() || "—"}</span>
                    )
                  ) : null}
                  {showEmail && isEditing && fieldErrors.email ? (
                    <p className={fieldErrorClass}>{fieldErrors.email}</p>
                  ) : null}
                </CompactFormRow>
              </CompactFormPanel>

              <footer className="mt-4 text-center font-serif text-lg italic leading-snug text-gray-600 md:text-xl lg:text-2xl">
                <p>With Autodaddy, you are not just choosing a system,</p>
                <p>You are choosing a standard of excellence</p>
              </footer>
            </div>
          </div>
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

      <OwnerFaqsDialog
        open={faqsOpen}
        onClose={() => setFaqsOpen(false)}
        heading={faqsHeading}
        description={faqsDescription}
      />
    </PortalPageContent>
  );
}
