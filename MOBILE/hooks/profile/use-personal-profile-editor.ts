import { digitsFromNationalPhoneDisplay, formatNationalPhoneDisplay } from "@/lib/national-phone-format";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";

type DisplayProfile = {
  name: string;
  email: string;
  phone: string;
  city?: string;
  profilePhoto?: string | null;
};

export function usePersonalProfileEditor(
  displayProfile: DisplayProfile,
  showErrorToast?: (message: string) => void
) {
  const [isPersonalEditing, setIsPersonalEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCityId, setEditCityId] = useState("");
  const [editCityName, setEditCityName] = useState("");
  const [editProfilePhotoUri, setEditProfilePhotoUri] = useState("");
  const [editProfilePhotoMime, setEditProfilePhotoMime] = useState<string | null>(null);
  const [editProfilePhotoFileName, setEditProfilePhotoFileName] = useState<string | null>(null);
  const [profilePhotoRemoved, setProfilePhotoRemoved] = useState(false);

  const applyPersonalDraft = useCallback((profile: DisplayProfile) => {
    setEditName(profile.name || "");
    setEditEmail(profile.email || "");
    setEditPhone(formatNationalPhoneDisplay(digitsFromNationalPhoneDisplay(profile.phone || "")));
    setEditCityId(profile.city?.trim() || "");
    setEditCityName(profile.city?.trim() || "");
    setEditProfilePhotoUri(normalizeMediaUrl(profile.profilePhoto ?? null) ?? "");
    setEditProfilePhotoMime(null);
    setEditProfilePhotoFileName(null);
    setProfilePhotoRemoved(false);
  }, []);

  useEffect(() => {
    if (isPersonalEditing) {
      return;
    }
    applyPersonalDraft(displayProfile);
  }, [
    applyPersonalDraft,
    displayProfile.city,
    displayProfile.email,
    displayProfile.name,
    displayProfile.phone,
    displayProfile.profilePhoto,
    isPersonalEditing,
  ]);

  const resetPersonalDrafts = useCallback(() => {
    applyPersonalDraft(displayProfile);
  }, [applyPersonalDraft, displayProfile]);

  const cancelPersonalEdit = useCallback(() => {
    applyPersonalDraft(displayProfile);
    setIsPersonalEditing(false);
  }, [applyPersonalDraft, displayProfile]);

  const clearProfilePhoto = useCallback(() => {
    setEditProfilePhotoUri("");
    setEditProfilePhotoMime(null);
    setEditProfilePhotoFileName(null);
    setProfilePhotoRemoved(true);
  }, []);

  const pickProfilePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showErrorToast?.("Please allow gallery access to select a photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const picked = result.assets[0];
    setEditProfilePhotoUri(picked.uri);
    setEditProfilePhotoMime(picked.mimeType ?? null);
    setEditProfilePhotoFileName(picked.fileName ?? null);
    setProfilePhotoRemoved(false);
  }, [showErrorToast]);

  return {
    isPersonalEditing,
    setIsPersonalEditing,
    editName,
    setEditName,
    editEmail,
    setEditEmail,
    editPhone,
    setEditPhone,
    editCityId,
    setEditCityId,
    editCityName,
    setEditCityName,
    editProfilePhotoUri,
    editProfilePhotoMime,
    editProfilePhotoFileName,
    profilePhotoRemoved,
    clearProfilePhoto,
    pickProfilePhoto,
    resetPersonalDrafts,
    cancelPersonalEdit,
  };
}
