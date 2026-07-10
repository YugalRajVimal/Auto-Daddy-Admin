import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { getJson, putJson } from "../api/mobileAuth";
import { useAuth } from "../auth";
import {
  digitsOnly,
  formatNationalPhoneDisplay,
  formatPincodeDisplay,
  isValidCanadianPostalCode,
  nationalPhoneDisplayFromKeystrokes,
  normalizePostalCodeForStorage,
  parseUserProfilePayload,
  PROFILE_ADDRESS_MAX_LENGTH,
  PROFILE_NAME_MAX_LENGTH,
  PINCODE_DISPLAY_MAX_LENGTH,
  type CarOwnerUserProfile,
  type EditProfileResponse,
  type ProfileFieldErrors,
  type ProfileFieldKey,
  type UserProfileResponse,
  validateProfileEdit,
} from "../lib/carOwnerProfile";
import { normalizeMediaUrl } from "../lib/normalizeMediaUrl";

const API_BASE = (import.meta.env.VITE_API_URL as string).replace(/\/+$/, "");
const DEFAULT_CALLING_CODE = "+1";

function formatStoredNationalPhone(phone: string): string {
  return formatNationalPhoneDisplay(digitsOnly(phone));
}

export function useCarOwnerProfile() {
  const { token, profile: authProfile, setProfile, refreshSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [profile, setLocalProfile] = useState<CarOwnerUserProfile | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [editCityId, setEditCityId] = useState("");
  const [editCityName, setEditCityName] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      setLocalProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getJson<UserProfileResponse>("/api/user/profile", token);
      const parsed = parseUserProfilePayload(res.data);
      setLocalProfile(parsed);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const display = useMemo(() => {
    const cc = profile?.countryCode ?? DEFAULT_CALLING_CODE;
    const rawPhone = profile?.phone ?? authProfile?.phone ?? "";
    const phoneReadOnly =
      rawPhone.trim().length > 0 ? `${cc} ${formatStoredNationalPhone(rawPhone)}`.trim() : "";
    return {
      name: profile?.name ?? authProfile?.name ?? "",
      email: profile?.email ?? authProfile?.email ?? "",
      countryCode: cc,
      phone: rawPhone,
      phoneReadOnly,
      address: profile?.address ?? "",
      pincode: profile?.pincode ?? "",
      city: profile?.city ?? authProfile?.city ?? "",
      cityId: profile?.cityId ?? "",
      role: profile?.role ?? "carowner",
      photoUri: normalizeMediaUrl(profile?.profilePhoto ?? authProfile?.profilePhoto ?? null),
    };
  }, [authProfile, profile]);

  useEffect(() => {
    if (!isEditing) return;
    setEditName(display.name);
    setEditEmail(display.email);
    setEditPhone(formatNationalPhoneDisplay(digitsOnly(display.phone)));
    setEditAddress(display.address);
    setEditPincode(formatPincodeDisplay(display.pincode));
    // Profile API stores city as a name string (no cityId). City options use name as id.
    setEditCityId(display.cityId.trim() || display.city.trim());
    setEditCityName(display.city);
  }, [
    display.address,
    display.city,
    display.cityId,
    display.email,
    display.name,
    display.phone,
    display.pincode,
    isEditing,
  ]);

  const clearFieldError = useCallback((key: ProfileFieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const startEditing = useCallback(() => {
    if (loading || saving) return;
    setFieldErrors({});
    setIsEditing(true);
  }, [loading, saving]);

  const cancelEditing = useCallback(() => {
    setFieldErrors({});
    setEditName(display.name);
    setEditEmail(display.email);
    setEditPhone(formatNationalPhoneDisplay(digitsOnly(display.phone)));
    setEditAddress(display.address);
    setEditPincode(formatPincodeDisplay(display.pincode));
    setEditCityId(display.cityId.trim() || display.city.trim());
    setEditCityName(display.city);
  }, [display]);

  const saveProfile = useCallback(async () => {
    if (!token) {
      toast.error("You are not authenticated. Please log in again.");
      return;
    }

    const validation = validateProfileEdit({
      name: editName,
      email: editEmail,
      phone: editPhone,
      address: editAddress,
      pincode: editPincode,
    });
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      toast.error("Please fix the errors below.");
      return;
    }
    setFieldErrors({});

    const nextName = editName.trim();
    const nextEmail = editEmail.trim();
    const nextPhone = digitsOnly(editPhone).slice(0, 10);
    const nextPincode = normalizePostalCodeForStorage(editPincode);
    const nextAddress = editAddress.trim().slice(0, PROFILE_ADDRESS_MAX_LENGTH);

    // Backend `edit-profile` only accepts: name, email, countryCode, pincode, address, city (+ profilePhoto).
    const body: Record<string, string> = {
      name: nextName,
      ...(nextEmail ? { email: nextEmail } : {}),
      countryCode: display.countryCode || DEFAULT_CALLING_CODE,
      ...(nextAddress ? { address: nextAddress } : {}),
      ...(nextPincode ? { pincode: nextPincode } : {}),
      ...(editCityName.trim() ? { city: editCityName.trim() } : {}),
    };

    setSaving(true);
    setLocalProfile((prev) => ({
      ...(prev ?? { role: display.role }),
      name: nextName,
      email: nextEmail,
      phone: nextPhone,
      countryCode: display.countryCode || DEFAULT_CALLING_CODE,
      address: nextAddress,
      pincode: nextPincode,
      city: editCityName.trim() || undefined,
      cityId: editCityId.trim() || undefined,
      profilePhoto: prev?.profilePhoto ?? profile?.profilePhoto ?? authProfile?.profilePhoto ?? null,
      role: prev?.role ?? display.role,
    }));

    try {
      const res = await putJson<EditProfileResponse>("/api/user/edit-profile", body, token);
      if (!res.ok || !res.data?.success) {
        toast.error(res.data?.message ?? "Failed to update profile.");
        await load();
        return;
      }
      toast.success(res.data?.message ?? "Profile updated.");
      refreshSession();
      const updated = parseUserProfilePayload(res.data?.data ?? res.data);
      if (updated) {
        setLocalProfile((prev) => ({ ...(prev ?? { role: display.role }), ...updated }));
        setProfile({
          name: updated.name ?? nextName,
          email: updated.email ?? nextEmail,
          phone: updated.phone ?? nextPhone,
          city: updated.city ?? editCityName,
          profilePhoto: updated.profilePhoto ?? authProfile?.profilePhoto ?? null,
        });
      }
    } catch {
      toast.error("Network error while updating profile.");
      await load();
    } finally {
      setSaving(false);
    }
  }, [
    authProfile?.profilePhoto,
    display.countryCode,
    display.role,
    editAddress,
    editCityId,
    editCityName,
    editEmail,
    editName,
    editPhone,
    editPincode,
    load,
    profile?.profilePhoto,
    refreshSession,
    setProfile,
    token,
  ]);

  const uploadProfilePhoto = useCallback(
    async (file: File) => {
      if (!token) {
        toast.error("You are not authenticated. Please log in again.");
        return;
      }

      setSaving(true);
      try {
        const body = new FormData();
        const nameSrc = isEditing ? editName : display.name;
        const emailSrc = isEditing ? editEmail : display.email;
        const phoneSrc = isEditing ? editPhone : display.phone;
        const addrSrc = isEditing ? editAddress : display.address;
        const pinSrc = isEditing ? editPincode : display.pincode;

        const name = (nameSrc || authProfile?.name || "User").trim();
        body.append("name", name || "User");
        const email = emailSrc?.trim();
        if (email) body.append("email", email);
        const phoneDigits = digitsOnly(phoneSrc);
        if (phoneDigits.length === 10) {
          body.append("phone", phoneDigits);
          body.append("countryCode", display.countryCode || DEFAULT_CALLING_CODE);
        }
        const addr = addrSrc?.trim();
        if (addr) body.append("address", addr.slice(0, PROFILE_ADDRESS_MAX_LENGTH));
        if (pinSrc?.trim() && isValidCanadianPostalCode(pinSrc)) {
          body.append("pincode", normalizePostalCodeForStorage(pinSrc));
        }
        const cityIdSrc = isEditing ? editCityId : display.cityId;
        if (cityIdSrc?.trim()) body.append("cityId", cityIdSrc.trim());
        const cityNameSrc = isEditing ? editCityName : display.city;
        if (cityNameSrc?.trim()) body.append("city", cityNameSrc.trim());
        body.append("profilePhoto", file, file.name || "profile-photo.jpg");

        const url = `${API_BASE}/api/user/edit-profile`;
        const response = await fetch(url, {
          method: "PUT",
          headers: { Authorization: token },
          body,
        });
        const data = (await response.json().catch(() => null)) as EditProfileResponse | null;
        if (!response.ok || !data?.success) {
          toast.error(data?.message ?? "Could not update profile photo.");
          await load();
          return;
        }
        toast.success(data?.message ?? "Profile photo updated.");
        refreshSession();
        await load();
      } catch {
        toast.error("Network error while uploading photo.");
        await load();
      } finally {
        setSaving(false);
      }
    },
    [
      authProfile?.name,
      display.address,
      display.city,
      display.cityId,
      display.countryCode,
      display.email,
      display.name,
      display.phone,
      display.pincode,
      editAddress,
      editCityId,
      editCityName,
      editEmail,
      editName,
      editPhone,
      editPincode,
      isEditing,
      load,
      refreshSession,
      token,
    ]
  );

  return {
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
    setEditPhone: (value: string) => setEditPhone(nationalPhoneDisplayFromKeystrokes(value)),
    setEditAddress,
    setEditPincode: (value: string) => setEditPincode(formatPincodeDisplay(value)),
    setEditCityId,
    setEditCityName,
    clearFieldError,
    startEditing,
    cancelEditing,
    saveProfile,
    uploadProfilePhoto,
    profileNameMaxLength: PROFILE_NAME_MAX_LENGTH,
    profileAddressMaxLength: PROFILE_ADDRESS_MAX_LENGTH,
    pincodeDisplayMaxLength: PINCODE_DISPLAY_MAX_LENGTH,
  };
}
