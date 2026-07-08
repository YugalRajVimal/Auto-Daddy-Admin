import { digitsFromNationalPhoneDisplay, formatNationalPhoneDisplay } from "@/lib/national-phone-format";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import { formatPincodeDisplay } from "@/lib/validation";
import type { AutoShopOwnerProfileResponse } from "@/types/auto-shop-owner-profile";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";

type BusinessProfile = AutoShopOwnerProfileResponse["data"]["businessProfile"] | null | undefined;

function pickBusinessCity(profile: BusinessProfile): { id: string; name: string } | null {
  const p = profile as unknown as Record<string, unknown> | null | undefined;
  if (!p) return null;
  const id = typeof p.cityId === "string" ? p.cityId : typeof p.city === "string" ? p.city : "";
  const name =
    typeof p.cityName === "string"
      ? p.cityName
      : p.city && typeof p.city === "object" && typeof (p.city as Record<string, unknown>).name === "string"
        ? String((p.city as Record<string, unknown>).name)
        : typeof p.city === "string"
          ? p.city
          : "";
  const safeName = name.trim();
  const safeId = String(id ?? "").trim();
  if (!safeName && !safeId) return null;
  return { id: safeId || safeName, name: safeName || safeId };
}

export function useBusinessProfileEditor(
  businessProfile: BusinessProfile,
  showErrorToast: (message: string) => void
) {
  const [isBusinessEditing, setIsBusinessEditing] = useState(false);
  const [editBusinessName, setEditBusinessName] = useState("");
  const [editBusinessEmail, setEditBusinessEmail] = useState("");
  const [editBusinessPhone, setEditBusinessPhone] = useState("");
  const [editBusinessAddress, setEditBusinessAddress] = useState("");
  const [editBusinessCityId, setEditBusinessCityId] = useState("");
  const [editBusinessCityName, setEditBusinessCityName] = useState("");
  const [editBusinessPincode, setEditBusinessPincode] = useState("");
  const [editBusinessHstNumber, setEditBusinessHstNumber] = useState("");
  const [editBusinessGstPercent, setEditBusinessGstPercent] = useState("");
  const [editBusinessLat, setEditBusinessLat] = useState("");
  const [editBusinessLng, setEditBusinessLng] = useState("");
  const [editBusinessLogoUri, setEditBusinessLogoUri] = useState("");
  const [editBusinessLogoMime, setEditBusinessLogoMime] = useState<string | null>(null);
  const [editBusinessLogoFileName, setEditBusinessLogoFileName] = useState<string | null>(null);
  const [businessLogoRemoved, setBusinessLogoRemoved] = useState(false);
  const [editBusinessBannerUri, setEditBusinessBannerUri] = useState("");
  const [editBusinessBannerMime, setEditBusinessBannerMime] = useState<string | null>(null);
  const [editBusinessBannerFileName, setEditBusinessBannerFileName] = useState<string | null>(null);
  const [businessBannerRemoved, setBusinessBannerRemoved] = useState(false);

  function applyBusinessProfileDraft(profile: BusinessProfile) {
    const city = pickBusinessCity(profile);
    setEditBusinessName(profile?.businessName ?? "");
    setEditBusinessEmail(profile?.businessEmail ?? "");
    setEditBusinessPhone(
      formatNationalPhoneDisplay(digitsFromNationalPhoneDisplay(profile?.businessPhone ?? ""))
    );
    setEditBusinessAddress(profile?.businessAddress ?? "");
    setEditBusinessCityId(city?.id ?? "");
    setEditBusinessCityName(city?.name ?? "");
    setEditBusinessPincode(formatPincodeDisplay(profile?.pincode ?? ""));
    setEditBusinessHstNumber(profile?.businessHSTNumber ?? "");
    setEditBusinessGstPercent(
      profile?.gst != null && String(profile.gst).trim().length > 0 ? String(profile.gst) : ""
    );
    setEditBusinessLat(String(profile?.businessMapLocation?.lat ?? ""));
    setEditBusinessLng(String(profile?.businessMapLocation?.lng ?? ""));
    setEditBusinessLogoUri(normalizeMediaUrl(profile?.businessLogo ?? null) ?? "");
    setEditBusinessLogoMime(null);
    setEditBusinessLogoFileName(null);
    setBusinessLogoRemoved(false);
    setEditBusinessBannerUri(normalizeMediaUrl(profile?.bannerImage ?? null) ?? "");
    setEditBusinessBannerMime(null);
    setEditBusinessBannerFileName(null);
    setBusinessBannerRemoved(false);
  }

  useEffect(() => {
    if (isBusinessEditing) {
      return;
    }
    applyBusinessProfileDraft(businessProfile);
  }, [businessProfile, isBusinessEditing]);

  function resetBusinessDrafts() {
    applyBusinessProfileDraft(businessProfile);
  }

  function cancelBusinessEdit() {
    resetBusinessDrafts();
    setIsBusinessEditing(false);
  }

  function clearBusinessLogo() {
    setEditBusinessLogoUri("");
    setEditBusinessLogoMime(null);
    setEditBusinessLogoFileName(null);
    setBusinessLogoRemoved(true);
  }

  async function pickBusinessLogo() {
    await pickBusinessImage({
      aspect: [1, 1],
      onPicked: (asset) => {
        setEditBusinessLogoUri(asset.uri);
        setEditBusinessLogoMime(asset.mimeType);
        setEditBusinessLogoFileName(asset.fileName);
        setBusinessLogoRemoved(false);
      },
      deniedMessage: "Please allow gallery access to select a logo.",
    });
  }

  function clearBusinessBanner() {
    setEditBusinessBannerUri("");
    setEditBusinessBannerMime(null);
    setEditBusinessBannerFileName(null);
    setBusinessBannerRemoved(true);
  }

  async function pickBusinessBanner() {
    await pickBusinessImage({
      aspect: [16, 9],
      onPicked: (asset) => {
        setEditBusinessBannerUri(asset.uri);
        setEditBusinessBannerMime(asset.mimeType);
        setEditBusinessBannerFileName(asset.fileName);
        setBusinessBannerRemoved(false);
      },
      deniedMessage: "Please allow gallery access to select a banner.",
    });
  }

  async function pickBusinessImage({
    aspect,
    onPicked,
    deniedMessage,
  }: {
    aspect: [number, number];
    onPicked: (asset: { uri: string; mimeType: string | null; fileName: string | null }) => void;
    deniedMessage: string;
  }) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showErrorToast(deniedMessage);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const picked = result.assets[0];
    onPicked({
      uri: picked.uri,
      mimeType: picked.mimeType ?? null,
      fileName: picked.fileName ?? null,
    });
  }

  return {
    isBusinessEditing,
    setIsBusinessEditing,
    editBusinessName,
    setEditBusinessName,
    editBusinessEmail,
    setEditBusinessEmail,
    editBusinessPhone,
    setEditBusinessPhone,
    editBusinessAddress,
    setEditBusinessAddress,
    editBusinessCityId,
    setEditBusinessCityId,
    editBusinessCityName,
    setEditBusinessCityName,
    editBusinessPincode,
    setEditBusinessPincode,
    editBusinessHstNumber,
    setEditBusinessHstNumber,
    editBusinessGstPercent,
    setEditBusinessGstPercent,
    editBusinessLat,
    setEditBusinessLat,
    editBusinessLng,
    setEditBusinessLng,
    editBusinessLogoUri,
    setEditBusinessLogoUri,
    editBusinessLogoMime,
    editBusinessLogoFileName,
    businessLogoRemoved,
    clearBusinessLogo,
    editBusinessBannerUri,
    editBusinessBannerMime,
    editBusinessBannerFileName,
    businessBannerRemoved,
    clearBusinessBanner,
    resetBusinessDrafts,
    cancelBusinessEdit,
    pickBusinessLogo,
    pickBusinessBanner,
  };
}
