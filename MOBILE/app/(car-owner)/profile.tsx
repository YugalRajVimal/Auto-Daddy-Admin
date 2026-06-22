import { CarOwnerCityPickerModal } from "@/components/car-owner/car-owner-city-picker-modal";
import { DialCountrySelector } from "@/components/reusables/forms/dial-country-selector";
import { CarOwnerProfileField } from "@/components/car-owner/car-owner-profile-field";
import { CarOwnerProfileHeader } from "@/components/car-owner/car-owner-profile-header";
import { CarOwnerProfileSelectField } from "@/components/car-owner/car-owner-profile-select-field";
import {
  digitsOnly,
  type EditProfileResponse,
  parseUserProfilePayload,
  PROFILE_ADDRESS_MAX_LENGTH,
  PROFILE_NAME_MAX_LENGTH,
  type ProfileFieldErrors,
  type ProfileFieldKey,
  type UserProfile,
  type UserProfileResponse,
  validateProfileEdit,
} from "@/components/car-owner/car-owner-profile-model";
import { carOwnerProfileStyles as styles } from "@/components/car-owner/car-owner-profile-styles";
import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";
import { useToast } from "@/components/reusables";
import { colors } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useLogoutAction } from "@/hooks/use-logout-action";
import { API_BASE_URL, getJson, logApiRequest, logApiResponse, putJson } from "@/lib/api";
import { localImageMultipartPart } from "@/lib/local-image-for-form";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import type { UserCity } from "@/types/user-cities";
import * as ImagePicker from "expo-image-picker";
import {
  defaultDialCallingCode,
  defaultDialCountryId,
  type DialCountryId,
  formatStoredNationalPhone,
  getDialCountryOption,
  resolveDialCountryIdFromStoredCallingCode,
} from "@/lib/dial-countries";
import {
  digitsFromNationalPhoneDisplay,
  formatNationalPhoneDisplay,
  nationalPhoneDisplayFromKeystrokes,
  NATIONAL_PHONE_DISPLAY_MAX_LENGTH,
} from "@/lib/national-phone-format";
import {
  formatPincodeDisplay,
  isValidCanadianPostalCode,
  normalizePostalCodeForStorage,
  PINCODE_DISPLAY_MAX_LENGTH,
} from "@/lib/validation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function CarOwnerProfile() {
  const { token, meta, refreshSession } = useAuth();
  const { showToast } = useToast();
  const handleLogout = useLogoutAction();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await getJson<UserProfileResponse>("/api/user/profile", { authToken: token });
    const parsed = parseUserProfilePayload(res.data);
    setProfile(parsed);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = useCallback(async () => {
    if (isEditing || saving) return;
    setRefreshing(true);
    try {
      await Promise.all([refreshSession(), load()]);
    } finally {
      setRefreshing(false);
    }
  }, [isEditing, load, refreshSession, saving]);

  const display = useMemo(() => {
    const cc = profile?.countryCode ?? defaultDialCallingCode();
    const rawPhone = profile?.phone ?? "";
    const phoneReadOnly =
      rawPhone.trim().length > 0 ? `${cc} ${formatStoredNationalPhone(rawPhone)}`.trim() : "";
    return {
      name: profile?.name ?? meta?.name ?? "",
      email: profile?.email ?? "",
      countryCode: cc,
      phone: rawPhone,
      phoneReadOnly,
      address: profile?.address ?? "",
      pincode: profile?.pincode ?? "",
      city: profile?.city ?? "",
      cityId: profile?.cityId ?? "",
      role: profile?.role ?? meta?.role ?? "carowner",
      photoUri: normalizeMediaUrl(profile?.profilePhoto ?? meta?.profilePhoto ?? null),
    };
  }, [meta?.name, meta?.profilePhoto, meta?.role, profile]);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [editCityId, setEditCityId] = useState("");
  const [editCityName, setEditCityName] = useState("");
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [editDialCountryId, setEditDialCountryId] = useState<DialCountryId>(defaultDialCountryId());
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});

  const clearFieldError = useCallback((key: ProfileFieldKey) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    setEditName(display.name);
    setEditEmail(display.email);
    setEditPhone(formatNationalPhoneDisplay(digitsFromNationalPhoneDisplay(display.phone)));
    setEditDialCountryId(resolveDialCountryIdFromStoredCallingCode(display.countryCode));
    setEditAddress(display.address);
    setEditPincode(formatPincodeDisplay(display.pincode));
    setEditCityId(display.cityId);
    setEditCityName(display.city);
  }, [
    display.address,
    display.city,
    display.cityId,
    display.countryCode,
    display.email,
    display.name,
    display.phone,
    display.pincode,
    isEditing,
  ]);

  const onCancel = () => {
    setIsEditing(false);
    setFieldErrors({});
    setEditName(display.name);
    setEditEmail(display.email);
    setEditPhone(formatNationalPhoneDisplay(digitsFromNationalPhoneDisplay(display.phone)));
    setEditDialCountryId(resolveDialCountryIdFromStoredCallingCode(display.countryCode));
    setEditAddress(display.address);
    setEditPincode(formatPincodeDisplay(display.pincode));
    setEditCityId(display.cityId);
    setEditCityName(display.city);
  };

  const onSave = async () => {
    if (!token) {
      showToast("You are not authenticated. Please log in again.", { type: "error" });
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
      showToast("Please fix the errors below.", { type: "error" });
      return;
    }
    setFieldErrors({});

    const nextName = editName.trim();
    const nextEmail = editEmail.trim();
    const nextPhone = digitsOnly(editPhone).slice(0, 10);
    const nextPincode = normalizePostalCodeForStorage(editPincode);
    const nextAddress = editAddress.trim().slice(0, PROFILE_ADDRESS_MAX_LENGTH);

    const body: Record<string, string> = {
      name: nextName,
      ...(nextEmail ? { email: nextEmail } : {}),
      ...(nextPhone ? { phone: nextPhone, countryCode: getDialCountryOption(editDialCountryId).callingCode } : {}),
      ...(nextAddress ? { address: nextAddress } : {}),
      ...(nextPincode ? { pincode: nextPincode } : {}),
      ...(editCityId.trim() ? { cityId: editCityId.trim() } : {}),
      ...(editCityName.trim() ? { city: editCityName.trim() } : {}),
    };

    setIsEditing(false);
    setSaving(true);
    setProfile((prev) => ({
      ...(prev ?? { role: display.role }),
      name: nextName,
      email: nextEmail,
      phone: nextPhone,
      countryCode: getDialCountryOption(editDialCountryId).callingCode,
      address: nextAddress,
      pincode: nextPincode,
      city: editCityName.trim() || undefined,
      cityId: editCityId.trim() || undefined,
      profilePhoto: prev?.profilePhoto ?? profile?.profilePhoto ?? meta?.profilePhoto ?? null,
      role: prev?.role ?? display.role,
    }));

    try {
      const res = await putJson<EditProfileResponse>("/api/user/edit-profile", body, { authToken: token });
      if (!res.ok || !res.data?.success) {
        showToast(res.data?.message ?? "Failed to update profile.", { type: "error" });
        await load();
        return;
      }
      showToast(res.data?.message ?? "Profile updated.", { type: "success" });
      await refreshSession();
      const updated = parseUserProfilePayload(res.data?.data ?? res.data);
      if (updated) setProfile((prev) => ({ ...(prev ?? { role: display.role }), ...updated, role: updated.role ?? display.role }));
    } catch {
      showToast("Network error while updating profile.", { type: "error" });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const uploadProfilePhotoFromLibrary = useCallback(async () => {
    if (!token) {
      showToast("You are not authenticated. Please log in again.", { type: "error" });
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast("Photo library permission is required.", { type: "error" });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    const asset = result.assets[0];

    setSaving(true);
    try {
      const body = new FormData();
      const nameSrc = isEditing ? editName : display.name;
      const emailSrc = isEditing ? editEmail : display.email;
      const phoneSrc = isEditing ? editPhone : display.phone;
      const addrSrc = isEditing ? editAddress : display.address;
      const pinSrc = isEditing ? editPincode : display.pincode;

      const name = (nameSrc || meta?.name || "User").trim();
      body.append("name", name || "User");
      const email = emailSrc?.trim();
      if (email) body.append("email", email);
      const phoneDigits = digitsOnly(phoneSrc);
      if (phoneDigits.length === 10) {
        body.append("phone", phoneDigits);
        body.append(
          "countryCode",
          isEditing ? getDialCountryOption(editDialCountryId).callingCode : display.countryCode || defaultDialCallingCode()
        );
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

      const part = localImageMultipartPart(asset.uri, {
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        fallbackBase: "profile-photo",
      });
      body.append("profilePhoto", { uri: part.uri, name: part.name, type: part.type } as never);

      const url = `${API_BASE_URL.replace(/\/+$/, "")}/api/user/edit-profile`;
      logApiRequest("PUT", url, body);
      const response = await fetch(url, {
        method: "PUT",
        headers: { Authorization: token },
        body,
      });
      const data = (await response.json().catch(() => null)) as EditProfileResponse | null;
      logApiResponse("PUT", url, response.status, response.ok, data);
      if (!response.ok || !data?.success) {
        showToast(data?.message ?? "Could not update profile photo.", { type: "error" });
        await load();
        return;
      }
      showToast(data?.message ?? "Profile photo updated.", { type: "success" });
      await refreshSession();
      await load();
    } catch {
      showToast("Network error while uploading photo.", { type: "error" });
      await load();
    } finally {
      setSaving(false);
    }
  }, [
    token,
    display.address,
    display.city,
    display.countryCode,
    display.email,
    display.name,
    display.phone,
    display.pincode,
    display.cityId,
    editAddress,
    editCityId,
    editCityName,
    editEmail,
    editName,
    editDialCountryId,
    editPhone,
    editPincode,
    isEditing,
    load,
    meta?.name,
    refreshSession,
    showToast,
  ]);

  return (
    <CarOwnerStackScreenFrame
      title="Profile"
      onRefresh={isEditing || saving ? undefined : handleRefresh}
      refreshing={refreshing}
    >
      <CarOwnerProfileHeader
        photoUri={display.photoUri}
        onAvatarPhotoPress={() => void uploadProfilePhotoFromLibrary()}
        isEditing={isEditing}
        actionsDisabled={loading || saving}
        saving={saving}
        onEditPress={() => {
          if (loading || saving) return;
          setFieldErrors({});
          setIsEditing(true);
        }}
        onCancelPress={onCancel}
        onSavePress={() => void onSave()}
        onLogoutPress={() => void handleLogout()}
      />

      <View style={styles.card}>
        {saving ? (
          <View style={styles.cardSavingRow}>
            <ActivityIndicator size="small" color={colors.successDark} />
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.successDark} />
          </View>
        ) : (
          <>
            <CarOwnerProfileField
              label="Full name"
              value={isEditing ? editName : display.name}
              editable={isEditing}
              onChangeText={(t) => {
                setEditName(t);
                clearFieldError("name");
              }}
              icon="person-outline"
              placeholder="Your name"
              errorText={isEditing ? fieldErrors.name : null}
              maxLength={PROFILE_NAME_MAX_LENGTH}
            />
            <CarOwnerProfileField
              label="Email"
              value={isEditing ? editEmail : display.email}
              editable={isEditing}
              onChangeText={(t) => {
                setEditEmail(t);
                clearFieldError("email");
              }}
              icon="mail-outline"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              errorText={isEditing ? fieldErrors.email : null}
            />
            <CarOwnerProfileField
              label="Phone"
              value={isEditing ? editPhone : display.phoneReadOnly || "—"}
              editable={isEditing}
              onChangeText={(t) => {
                setEditPhone(nationalPhoneDisplayFromKeystrokes(t));
                clearFieldError("phone");
              }}
              icon="call-outline"
              placeholder="781 708 9765"
              keyboardType="phone-pad"
              errorText={isEditing ? fieldErrors.phone : null}
              maxLength={NATIONAL_PHONE_DISPLAY_MAX_LENGTH}
              leadingSlot={
                isEditing ? (
                  <DialCountrySelector
                    valueId={editDialCountryId}
                    onChange={setEditDialCountryId}
                    compact
                  />
                ) : undefined
              }
            />
            <CarOwnerProfileSelectField
              label="City"
              value={isEditing ? editCityName : display.city}
              placeholder="Tap to choose your city"
              editable={isEditing}
              disabled={loading || saving}
              onPress={() => setCityPickerOpen(true)}
              icon="business-outline"
            />
            <CarOwnerProfileField
              label="Address"
              value={isEditing ? editAddress : display.address}
              editable={isEditing}
              onChangeText={(t) => {
                setEditAddress(t);
                clearFieldError("address");
              }}
              icon="location-outline"
              placeholder="Address"
              multiline
              errorText={isEditing ? fieldErrors.address : null}
              maxLength={PROFILE_ADDRESS_MAX_LENGTH}
            />
            <CarOwnerProfileField
              label="Zip Code"
              value={isEditing ? editPincode : formatPincodeDisplay(display.pincode)}
              editable={isEditing}
              onChangeText={(t) => {
                setEditPincode(formatPincodeDisplay(t));
                clearFieldError("pincode");
              }}
              icon="map-outline"
              placeholder="A1A 1A1"
              autoCapitalize="characters"
              errorText={isEditing ? fieldErrors.pincode : null}
              maxLength={PINCODE_DISPLAY_MAX_LENGTH}
            />

          </>
        )}
      </View>

      <CarOwnerCityPickerModal
        visible={cityPickerOpen}
        onClose={() => setCityPickerOpen(false)}
        authToken={token}
        selectedId={editCityId.trim() || null}
        onSelect={(city: UserCity) => {
          setEditCityId(city.id);
          setEditCityName(city.name);
        }}
      />
    </CarOwnerStackScreenFrame>
  );
}
