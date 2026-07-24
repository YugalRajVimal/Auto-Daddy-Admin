import { digitsFromNationalPhoneDisplay, formatNationalPhoneDisplay } from "@/lib/national-phone-format";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import {
  normalizeShopOwnerShopTypes,
  type ShopOwnerShopType,
} from "@/lib/shop-owner-shop-types";
import { formatPincodeDisplay } from "@/lib/validation";
import type { AutoShopOwnerProfileResponse } from "@/types/auto-shop-owner-profile";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";

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
  const [editShopTypes, setEditShopTypes] = useState<ShopOwnerShopType[]>(["autoShop"]);
  const [editBusinessLogoUri, setEditBusinessLogoUri] = useState("");
  const [editBusinessLogoMime, setEditBusinessLogoMime] = useState<string | null>(null);
  const [editBusinessLogoFileName, setEditBusinessLogoFileName] = useState<string | null>(null);
  const [businessLogoRemoved, setBusinessLogoRemoved] = useState(false);

  const applyBusinessProfileDraft = useCallback((profile: BusinessProfile) => {
    const city = pickBusinessCity(profile);
    const types = normalizeShopOwnerShopTypes(profile?.shopTypes ?? profile?.shopType ?? null);
    setEditBusinessName(profile?.businessName ?? "");
    setEditBusinessEmail(profile?.businessEmail ?? "");
    setEditBusinessPhone(
      formatNationalPhoneDisplay(digitsFromNationalPhoneDisplay(profile?.businessPhone ?? ""))
    );
    setEditBusinessAddress(profile?.businessAddress ?? "");
    setEditBusinessCityId(city?.id ?? "");
    setEditBusinessCityName(city?.name ?? "");
    setEditBusinessPincode(formatPincodeDisplay(profile?.pincode ?? ""));
    setEditBusinessHstNumber((profile?.businessHSTNumber ?? "").toUpperCase());
    setEditBusinessGstPercent(
      profile?.gst != null && String(profile.gst).trim().length > 0 ? String(profile.gst) : ""
    );
    setEditShopTypes(types.length > 0 ? types : ["autoShop"]);
    setEditBusinessLogoUri(normalizeMediaUrl(profile?.businessLogo ?? null) ?? "");
    setEditBusinessLogoMime(null);
    setEditBusinessLogoFileName(null);
    setBusinessLogoRemoved(false);
  }, []);

  useEffect(() => {
    if (isBusinessEditing) {
      return;
    }
    applyBusinessProfileDraft(businessProfile);
  }, [applyBusinessProfileDraft, businessProfile, isBusinessEditing]);

  const resetBusinessDrafts = useCallback(() => {
    applyBusinessProfileDraft(businessProfile);
  }, [applyBusinessProfileDraft, businessProfile]);

  const cancelBusinessEdit = useCallback(() => {
    applyBusinessProfileDraft(businessProfile);
    setIsBusinessEditing(false);
  }, [applyBusinessProfileDraft, businessProfile]);

  const toggleShopType = useCallback((value: ShopOwnerShopType) => {
    setEditShopTypes((prev) => {
      if (prev.includes(value)) {
        if (prev.length === 1) return prev;
        return prev.filter((type) => type !== value);
      }
      return [...prev, value];
    });
  }, []);

  const clearBusinessLogo = useCallback(() => {
    setEditBusinessLogoUri("");
    setEditBusinessLogoMime(null);
    setEditBusinessLogoFileName(null);
    setBusinessLogoRemoved(true);
  }, []);

  const pickBusinessLogo = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showErrorToast("Please allow gallery access to select a logo.");
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
    setEditBusinessLogoUri(picked.uri);
    setEditBusinessLogoMime(picked.mimeType ?? null);
    setEditBusinessLogoFileName(picked.fileName ?? null);
    setBusinessLogoRemoved(false);
  }, [showErrorToast]);

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
    editShopTypes,
    toggleShopType,
    editBusinessLogoUri,
    setEditBusinessLogoUri,
    editBusinessLogoMime,
    editBusinessLogoFileName,
    businessLogoRemoved,
    clearBusinessLogo,
    resetBusinessDrafts,
    cancelBusinessEdit,
    pickBusinessLogo,
  };
}
