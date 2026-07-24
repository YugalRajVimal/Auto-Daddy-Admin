import {
  ActivityScheduleCard,
  BusinessInformationCard,
  DocumentTemplateCard,
  ManageInvoicesModal,
  PersonalInformationCard,
  ProfileFooter,
  ProfileHeader,
} from "@/components/profile";
import { CarCompaniesCard } from "@/components/profile/car-companies-card";
import { ServicesSelectionCard } from "@/components/profile/select-services-card";
import {
  AppBar,
  SurfaceCard,
  TabScreenFrame,
  useToast,
} from "@/components/reusables";
import { ShopOwnerCityPickerModal } from "@/components/shop-owner/shop-owner-city-picker-modal";
import { colors, fontSizes, gradients, radii, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useBusinessProfileEditor } from "@/hooks/profile/use-business-profile-editor";
import { usePersonalProfileEditor } from "@/hooks/profile/use-personal-profile-editor";
import { updatePersonalProfile, updateWeeklyOpenHours } from "@/lib/autoshopowner-api";
import { fetchAndMergeShopOwnerPortal } from "@/lib/shop-owner-portal-bootstrap";
import { useLogoutAction } from "@/hooks/use-logout-action";
import { useOncePress } from "@/hooks/use-once-press";
import { useDocumentTemplatePreference } from "@/hooks/use-document-template-preference";
import { useShopOwnerCarCompanies } from "@/hooks/use-shop-owner-car-companies";
import { useShopOwnerServices } from "@/hooks/use-shop-owner-services";
import { API_BASE_URL, getJson, logApiRequest } from "@/lib/api";
import { saveAutoShopOwnerProfile } from "@/lib/auth";
import {
  createDefaultPerDaySchedule,
  formatPerDayScheduleDisplay,
  perDayOpenHoursFromSchedule,
  resolvePerDaySchedule,
  serializePerDayOpenHoursForApi,
  validatePerDaySchedule,
  type PerDaySchedule,
} from "@/lib/per-day-open-hours";
import { getAutoShopOwnerProfile } from "@/lib/auth";
import {
  defaultDialCallingCode,
  formatStoredNationalPhone,
} from "@/lib/dial-countries";
import { templatesForKind } from "@/lib/document-templates";
import { localImageMultipartPart } from "@/lib/local-image-for-form";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import { SHOP_OWNER_HOME, navigateToAppHome } from "@/lib/shop-owner-navigation";
import { shopOwnerShopTypeLabels } from "@/lib/shop-owner-shop-types";

import {
  digitsOnly,
  formatPincodeDisplay,
  isValidCanadianPostalCode,
  isValidEmail,
  normalizePostalCodeForStorage,
  POSTAL_CODE_ERROR_MESSAGE,
} from "@/lib/validation";
import type { AutoShopOwnerProfileResponse } from "@/types/auto-shop-owner-profile";
import type { UserCity } from "@/types/user-cities";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BackHandler,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const DEFAULT_PROFILE = {
  name: "User",
  email: "",
  countryCode: defaultDialCallingCode(),
  phone: "",
  city: "",
  profilePhoto: null as string | null,
  role: "",
};

type UserProfileData = {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  city?: string;
  profilePhoto?: string | null;
  role: string;
};

type EditProfileResponse = {
  success?: boolean;
  message?: string;
  data?: {
    name?: string;
    email?: string;
    phone?: string;
    countryCode?: string;
    pincode?: string;
    address?: string;
    role?: string;
  };
};

type EditBusinessProfileResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

function ProfileSkeletonBlock({ width, height }: { width: number | `${number}%`; height: number }) {
  return <View style={[styles.skeletonBlock, { width, height }]} />;
}

function ProfileLoadingSkeleton({ showBusiness }: { showBusiness: boolean }) {
  return (
    <>
      <View style={styles.skeletonHero}>
        <View style={styles.skeletonAvatar} />
        <ProfileSkeletonBlock width={180} height={22} />
        <ProfileSkeletonBlock width={120} height={26} />
      </View>

      <View style={styles.scrollContent}>
        <SurfaceCard shadow="card">
          <View style={styles.skeletonCard}>
            <View style={styles.skeletonHeader}>
              <View style={styles.skeletonIcon} />
              <ProfileSkeletonBlock width={170} height={18} />
            </View>
            {[0, 1, 2, 3, 4].map((key) => (
              <View key={key} style={styles.skeletonRow}>
                <View style={styles.skeletonMiniIcon} />
                <View style={styles.skeletonRowText}>
                  <ProfileSkeletonBlock width={90} height={10} />
                  <ProfileSkeletonBlock width="75%" height={14} />
                </View>
              </View>
            ))}
          </View>
        </SurfaceCard>

        {showBusiness ? (
          <>
            <SurfaceCard shadow="card">
              <View style={styles.skeletonCard}>
                <View style={styles.skeletonHeader}>
                  <View style={styles.skeletonIcon} />
                  <ProfileSkeletonBlock width={180} height={18} />
                </View>
                {[0, 1, 2, 3].map((key) => (
                  <View key={key} style={styles.skeletonRow}>
                    <View style={styles.skeletonMiniIcon} />
                    <View style={styles.skeletonRowText}>
                      <ProfileSkeletonBlock width={100} height={10} />
                      <ProfileSkeletonBlock width="70%" height={14} />
                    </View>
                  </View>
                ))}
              </View>
            </SurfaceCard>
            <SurfaceCard shadow="card">
              <View style={styles.skeletonCard}>
                <View style={styles.skeletonHeader}>
                  <View style={styles.skeletonIcon} />
                  <ProfileSkeletonBlock width={140} height={18} />
                </View>
                <ProfileSkeletonBlock width="100%" height={56} />
              </View>
            </SurfaceCard>
          </>
        ) : null}
      </View>
    </>
  );
}

function parseUserProfilePayload(payload: unknown): UserProfileData | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const direct = payload as Record<string, unknown>;
  const nested =
    "data" in direct && direct.data && typeof direct.data === "object"
      ? (direct.data as Record<string, unknown>)
      : null;
  const source = nested ?? direct;

  if (!source) {
    return null;
  }

  return {
    name: typeof source.name === "string" ? source.name : "",
    email: typeof source.email === "string" ? source.email : "",
    phone: typeof source.phone === "string" ? source.phone : "",
    countryCode: typeof source.countryCode === "string" ? source.countryCode : "",
    city: typeof source.city === "string" ? source.city : "",
    profilePhoto: typeof source.profilePhoto === "string" ? source.profilePhoto : null,
    role: typeof source.role === "string" ? source.role : "",
  };
}

export default function ProfilePage() {
  const { meta, token, refreshSession } = useAuth();
  const { showToast } = useToast();
  const [personalOpen, setPersonalOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [isActivityEditing, setIsActivityEditing] = useState(false);
  const [activitySaving, setActivitySaving] = useState(false);
  const [activitySchedule, setActivitySchedule] = useState<PerDaySchedule>(createDefaultPerDaySchedule);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [cityPickerTarget, setCityPickerTarget] = useState<"personal" | "business">("business");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [personalSaving, setPersonalSaving] = useState(false);
  const [businessSaving, setBusinessSaving] = useState(false);
  const [serverData, setServerData] =
    useState<AutoShopOwnerProfileResponse["data"] | null>(null);
  const [serverProfile, setServerProfile] =
    useState<AutoShopOwnerProfileResponse["data"]["userProfile"] | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [logoViewerUri, setLogoViewerUri] = useState<string | null>(null);
  const [pendingHeroLogoUpload, setPendingHeroLogoUpload] = useState(false);
  const [manageInvoicesOpen, setManageInvoicesOpen] = useState(false);

  // Important: tabs/screens can stay mounted across auth changes.
  // When logging out, aggressively clear any previous user's in-memory profile data.
  useEffect(() => {
    if (token) {
      return;
    }
    setServerData(null);
    setServerProfile(null);
    setUserProfile(null);
    setLogoViewerUri(null);
  }, [token]);

  const loadProfileFromStore = useCallback(async () => {
    const role = meta?.role?.toLowerCase() ?? "";
    if (role === "autoshopowner") {
      const saved = await getAutoShopOwnerProfile<AutoShopOwnerProfileResponse>();
      setServerData(saved?.data ?? null);
      setServerProfile(saved?.data?.userProfile ?? null);
    } else if (token) {
      const response = await getJson<unknown>("/api/user/profile", { authToken: token });
      setUserProfile(parseUserProfilePayload(response.data));
    }
  }, [meta?.role, token]);

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        await loadProfileFromStore();
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [loadProfileFromStore]);
  useFocusEffect(
    useCallback(() => {
      void loadProfileFromStore();
      return undefined;
    }, [loadProfileFromStore])
  );

  const displayProfile = useMemo(
    () => ({
      name: serverProfile?.name ?? userProfile?.name ?? meta?.name ?? DEFAULT_PROFILE.name,
      email: serverProfile?.email ?? userProfile?.email ?? DEFAULT_PROFILE.email,
      countryCode: serverProfile?.countryCode ?? userProfile?.countryCode ?? DEFAULT_PROFILE.countryCode,
      phone: serverProfile?.phone ?? userProfile?.phone ?? DEFAULT_PROFILE.phone,
      city: (serverProfile?.city ?? userProfile?.city ?? DEFAULT_PROFILE.city).trim(),
      profilePhoto:
        serverProfile?.profilePhoto ??
        userProfile?.profilePhoto ??
        meta?.profilePhoto ??
        DEFAULT_PROFILE.profilePhoto,
      role: serverProfile?.role ?? userProfile?.role ?? meta?.role ?? DEFAULT_PROFILE.role,
    }),
    [
      meta?.name,
      meta?.profilePhoto,
      meta?.role,
      serverProfile?.city,
      serverProfile?.countryCode,
      serverProfile?.email,
      serverProfile?.name,
      serverProfile?.phone,
      serverProfile?.profilePhoto,
      serverProfile?.role,
      userProfile?.city,
      userProfile?.countryCode,
      userProfile?.email,
      userProfile?.name,
      userProfile?.phone,
      userProfile?.profilePhoto,
      userProfile?.role,
    ]
  );
  const isAutoShopOwner =
    typeof displayProfile.role === "string" &&
    displayProfile.role.toLowerCase() === "autoshopowner";
  const showProfileErrorToast = useCallback(
    (message: string) => showToast(message, { type: "error" }),
    [showToast]
  );
  const {
    isPersonalEditing,
    setIsPersonalEditing,
    editName,
    setEditName,
    editEmail,
    setEditEmail,
    editPhone,
    editCityId,
    setEditCityId,
    editCityName,
    setEditCityName,
    editProfilePhotoUri,
    editProfilePhotoMime,
    editProfilePhotoFileName,
    clearProfilePhoto,
    pickProfilePhoto,
    cancelPersonalEdit,
  } = usePersonalProfileEditor(displayProfile, showProfileErrorToast);

  const personalFields = useMemo(
    () => [
      { label: "Name", value: displayProfile.name || "Not provided", icon: "person-outline" as const },
      {
        label: "Phone",
        value: displayProfile.phone
          ? formatStoredNationalPhone(displayProfile.phone)
          : "Not provided",
        icon: "call-outline" as const,
      },
      {
        label: "City",
        value: editCityName.trim() || displayProfile.city || "Not provided",
        icon: "business-outline" as const,
      },
      { label: "Email", value: displayProfile.email || "Not provided", icon: "mail-outline" as const },
      {
        label: "Upload Image",
        value: displayProfile.profilePhoto ? "Image uploaded" : "No image uploaded",
        icon: "image-outline" as const,
      },
    ],
    [
      displayProfile.city,
      displayProfile.email,
      displayProfile.name,
      displayProfile.phone,
      displayProfile.profilePhoto,
      editCityName,
    ]
  );
  const businessProfile = serverData?.businessProfile;
  const carCompanies = useShopOwnerCarCompanies({
    showErrorToast: (m) => showToast(m, { type: "error" }),
    showSuccessToast: (m) => showToast(m, { type: "success" }),
    onChanged: async () => {
      await refreshSession();
      await loadProfileFromStore();
    },
  });
  const services = useShopOwnerServices({
    showErrorToast: (m) => showToast(m, { type: "error" }),
    showSuccessToast: (m) => showToast(m, { type: "success" }),
    onChanged: async () => {
      await refreshSession();
      await loadProfileFromStore();
    },
  });
  const {
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
    editBusinessLogoMime,
    editBusinessLogoFileName,
    businessLogoRemoved,
    clearBusinessLogo,
    cancelBusinessEdit,
    pickBusinessLogo,
  } = useBusinessProfileEditor(businessProfile, showProfileErrorToast);

  const resolvedActivitySchedule = useMemo(
    () => resolvePerDaySchedule(businessProfile as unknown as Record<string, unknown> | null | undefined),
    [businessProfile]
  );
  const activityScheduleDisplay = useMemo(
    () => formatPerDayScheduleDisplay(resolvedActivitySchedule),
    [resolvedActivitySchedule]
  );

  useEffect(() => {
    if (isActivityEditing) {
      return;
    }
    setActivitySchedule(resolvedActivitySchedule);
  }, [isActivityEditing, resolvedActivitySchedule]);

  const cancelPersonalEditRef = useRef(cancelPersonalEdit);
  cancelPersonalEditRef.current = cancelPersonalEdit;
  const cancelBusinessEditRef = useRef(cancelBusinessEdit);
  cancelBusinessEditRef.current = cancelBusinessEdit;
  const resolvedActivityScheduleRef = useRef(resolvedActivitySchedule);
  resolvedActivityScheduleRef.current = resolvedActivitySchedule;

  useFocusEffect(
    useCallback(() => {
      // Reset UI state whenever Profile regains focus (tabs keep screens mounted).
      setPersonalOpen(false);
      setBusinessOpen(false);
      setActivityOpen(false);
      setLogoViewerUri(null);

      // Exit edit modes and revert any unsaved drafts.
      cancelPersonalEditRef.current();
      cancelBusinessEditRef.current();
      setIsActivityEditing(false);
      setActivitySchedule(resolvedActivityScheduleRef.current);

      return undefined;
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (!isAutoShopOwner) {
        return undefined;
      }
      void carCompanies.refresh();
      void services.refresh();
      return undefined;
    }, [carCompanies.refresh, isAutoShopOwner, services.refresh])
  );

  const businessFields = useMemo(
    () => [
      {
        label: "Business Name",
        value: businessProfile?.businessName?.trim() || "Not provided",
        icon: "storefront-outline" as const,
      },
      {
        label: "Business Phone",
        value: businessProfile?.businessPhone?.trim()
          ? formatStoredNationalPhone(businessProfile.businessPhone)
          : "Not provided",
        icon: "call-outline" as const,
      },
      {
        label: "City",
        value:
          editBusinessCityName?.trim() ||
          String(
            (businessProfile as unknown as Record<string, unknown> | null)?.city ??
              (businessProfile as unknown as Record<string, unknown> | null)?.cityName ??
              ""
          ) ||
          "Not provided",
        icon: "business-outline" as const,
      },
      {
        label: "Address",
        value: businessProfile?.businessAddress?.trim() || "Not provided",
        icon: "location-outline" as const,
      },
      {
        label: "Zip Code",
        value: businessProfile?.pincode?.trim()
          ? formatPincodeDisplay(businessProfile.pincode)
          : "Not provided",
        icon: "map-outline" as const,
      },
      {
        label: "TAX ID No",
        value: businessProfile?.businessHSTNumber?.trim() || "Not provided",
        icon: "receipt-outline" as const,
      },
      {
        label: "Tax %",
        value:
          businessProfile?.gst != null && String(businessProfile.gst).trim().length > 0
            ? `${String(businessProfile.gst).trim()}%`
            : "Not provided",
        icon: "cash-outline" as const,
      },
      {
        label: "E mail",
        value: businessProfile?.businessEmail?.trim() || "Not provided",
        icon: "mail-outline" as const,
      },
      {
        label: "Upload Logo",
        value: businessProfile?.businessLogo ? "Tap to view logo" : "No logo uploaded",
        icon: "image-outline" as const,
      },
      {
        label: "Business Types",
        value: shopOwnerShopTypeLabels(businessProfile?.shopTypes ?? businessProfile?.shopType),
        icon: "options-outline" as const,
      },
    ],
    [businessProfile, editBusinessCityName]
  );
  const businessNameLabel = businessProfile?.businessName?.trim() || "Business";
  const openCarCompaniesFromProfile = useOncePress(() => {
    router.push({
      pathname: "/(shop-owner)/car-companies",
      params: { backTo: "/(shop-owner)/profile", from: "profile" },
    });
  });
  const openServicesFromProfile = useOncePress(() => {
    router.push({
      pathname: "/(shop-owner)/services-selection",
      params: { backTo: "/(shop-owner)/profile", from: "profile" },
    });
  });
  const openInvoiceTemplatesFromProfile = useOncePress(() => {
    router.push({
      pathname: "/(shop-owner)/invoice-templates",
      params: { backTo: "/(shop-owner)/profile", from: "profile" },
    });
  });
  const openManageInvoicesFromProfile = useOncePress(() => {
    setManageInvoicesOpen(true);
  });
  const invoiceTemplatePreference = useDocumentTemplatePreference("invoice");
  const savedInvoiceTemplateName = useMemo(() => {
    if (!invoiceTemplatePreference.isActive) {
      return "Not selected";
    }
    const template = templatesForKind("invoice").find(
      (item) => item.id === invoiceTemplatePreference.savedId
    );
    return template?.name ?? "Not selected";
  }, [invoiceTemplatePreference.isActive, invoiceTemplatePreference.savedId]);
  const viewableBusinessLogoUri = useMemo(
    () => normalizeMediaUrl(businessProfile?.businessLogo ?? null),
    [businessProfile?.businessLogo]
  );
  const viewableBusinessBannerUri = useMemo(
    () => normalizeMediaUrl(businessProfile?.bannerImage ?? null),
    [businessProfile?.bannerImage]
  );

  // If the user changed logo via the hero avatar pencil, auto-upload it immediately.
  useEffect(() => {
    if (!pendingHeroLogoUpload) {
      return;
    }
    if (!isAutoShopOwner) {
      setPendingHeroLogoUpload(false);
      return;
    }
    const uri = editBusinessLogoUri?.trim();
    if (!uri || !(uri.startsWith("file://") || uri.startsWith("content://"))) {
      return;
    }
    setPendingHeroLogoUpload(false);
    void handleSaveBusinessProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editBusinessLogoUri, isAutoShopOwner, pendingHeroLogoUpload]);

  const handleLogout = useLogoutAction();
  // Prefer dismiss/replace-to-home over router.back(): when isProfileComplete is false,
  // back can land on `/` which immediately Redirects back here and traps the user.
  // dismissTo also clears sibling tab screens so Home ↔ Deals does not loop on Android back.
  const handleBackPress = useOncePress(() => {
    navigateToAppHome(SHOP_OWNER_HOME);
  });
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") {
        return undefined;
      }
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        handleBackPress?.();
        return true;
      });
      return () => sub.remove();
    }, [handleBackPress])
  );
  const handlePrintAuthToken = useCallback(() => {
    if (!__DEV__) {
      return;
    }
    console.log("[profile] auth token", token ?? "no-auth-token");
    showToast("Auth token logged to console.", { type: "info" });
  }, [showToast, token]);
  const handleTogglePersonalSection = () => {
    if (isPersonalEditing && personalOpen) {
      showToast("Save or cancel editing before closing.", { type: "error" });
      return;
    }
    if (isBusinessEditing && businessOpen) {
      showToast("Save or cancel business editing before switching.", { type: "error" });
      return;
    }
    if (isActivityEditing && activityOpen) {
      showToast("Save or cancel activity editing before switching.", { type: "error" });
      return;
    }
    setPersonalOpen((prev) => {
      const next = !prev;
      if (next) {
        setBusinessOpen(false);
        setActivityOpen(false);
        setIsBusinessEditing(false);
        setIsActivityEditing(false);
      }
      return next;
    });
  };
  const handleToggleBusinessSection = () => {
    if (isBusinessEditing && businessOpen) {
      showToast("Save or cancel editing before closing.", { type: "error" });
      return;
    }
    if (isPersonalEditing && personalOpen) {
      showToast("Save or cancel personal editing before switching.", { type: "error" });
      return;
    }
    if (isActivityEditing && activityOpen) {
      showToast("Save or cancel activity editing before switching.", { type: "error" });
      return;
    }
    setBusinessOpen((prev) => {
      const next = !prev;
      if (next) {
        setPersonalOpen(false);
        setActivityOpen(false);
        setIsPersonalEditing(false);
        setIsActivityEditing(false);
      }
      return next;
    });
  };
  const handleToggleActivitySection = () => {
    if (isActivityEditing && activityOpen) {
      showToast("Save or cancel editing before closing.", { type: "error" });
      return;
    }
    if (isPersonalEditing && personalOpen) {
      showToast("Save or cancel personal editing before switching.", { type: "error" });
      return;
    }
    if (isBusinessEditing && businessOpen) {
      showToast("Save or cancel business editing before switching.", { type: "error" });
      return;
    }
    setActivityOpen((prev) => {
      const next = !prev;
      if (next) {
        setPersonalOpen(false);
        setBusinessOpen(false);
        setIsPersonalEditing(false);
        setIsBusinessEditing(false);
      }
      return next;
    });
  };
  const handleStartPersonalEdit = () => {
    if (isBusinessEditing || isActivityEditing) {
      showToast("Finish other editing first.", { type: "error" });
      return;
    }
    setPersonalOpen(true);
    setBusinessOpen(false);
    setIsPersonalEditing(true);
  };
  const handleCancelPersonalEdit = () => {
    cancelPersonalEdit();
  };
  const handleStartBusinessEdit = () => {
    if (isPersonalEditing || isActivityEditing) {
      showToast("Finish other editing first.", { type: "error" });
      return;
    }
    setBusinessOpen(true);
    setPersonalOpen(false);
    setIsBusinessEditing(true);
  };
  const handleCancelBusinessEdit = () => {
    cancelBusinessEdit();
  };
  const handleStartActivityEdit = () => {
    if (isPersonalEditing || isBusinessEditing) {
      showToast("Finish other editing first.", { type: "error" });
      return;
    }
    setActivityOpen(true);
    setPersonalOpen(false);
    setBusinessOpen(false);
    setIsActivityEditing(true);
  };
  const handleCancelActivityEdit = () => {
    setActivitySchedule(resolvedActivitySchedule);
    setIsActivityEditing(false);
  };

  async function handleRefreshProfile() {
    setRefreshing(true);
    try {
      await refreshSession();
      await loadProfileFromStore();
    } finally {
      setRefreshing(false);
    }
  }
  const handlePickBusinessLogo = pickBusinessLogo;
  const handleHeroAvatarEdit = useOncePress(async () => {
    if (!isAutoShopOwner) {
      handleStartPersonalEdit();
      return;
    }
    setPendingHeroLogoUpload(true);
    await pickBusinessLogo();
  });

  async function handleSaveProfile() {
    if (!token) {
      showToast("You are not authenticated. Please log in again.", { type: "error" });
      return;
    }
    if (__DEV__) {
      console.log("[profile] auth token", token);
    }
    const nextName = editName.trim();
    const nextEmail = editEmail.trim();
    const nextCity = editCityName.trim();
    const nextPhotoUri = editProfilePhotoUri.trim();
    const shouldUploadPhoto =
      nextPhotoUri.length > 0 &&
      (nextPhotoUri.startsWith("file://") || nextPhotoUri.startsWith("content://"));

    if (!nextName) {
      showToast("Name is required.", { type: "error" });
      return;
    }
    if (!nextCity) {
      showToast("City is required.", { type: "error" });
      return;
    }
    if (nextEmail.length > 0 && !isValidEmail(nextEmail)) {
      showToast("Enter a valid email address.", { type: "error" });
      return;
    }

    setIsPersonalEditing(false);
    setServerProfile((prev) =>
      prev
        ? {
            ...prev,
            name: nextName || prev.name,
            email: nextEmail || prev.email,
            ...(nextCity ? { city: nextCity } : null),
            ...(shouldUploadPhoto
              ? { profilePhoto: nextPhotoUri }
              : null),
          }
        : prev
    );

    setPersonalSaving(true);
    try {
      const photoPart = shouldUploadPhoto
        ? localImageMultipartPart(nextPhotoUri, {
            mimeType: editProfilePhotoMime,
            fileName: editProfilePhotoFileName,
            fallbackBase: "profile-photo",
          })
        : null;
      const response = await updatePersonalProfile(token, {
        name: nextName,
        city: nextCity,
        profilePhoto: photoPart
          ? { uri: photoPart.uri, name: photoPart.name, type: photoPart.type }
          : null,
      });

      const payload = response.data as EditProfileResponse | null;
      if (!response.ok || (payload && "success" in payload && payload.success === false)) {
        showToast(payload?.message ?? "Failed to update profile.", { type: "error" });
        await loadProfileFromStore();
        return;
      }

      showToast(payload?.message ?? "Profile updated successfully.", { type: "success" });

      await refreshSession();
      const portal = await fetchAndMergeShopOwnerPortal(token);
      if (portal.profile) {
        await saveAutoShopOwnerProfile(portal.profile);
        setServerData(portal.profile.data);
        setServerProfile(portal.profile.data.userProfile);
      }
    } catch {
      showToast("Network error while updating profile.", { type: "error" });
      await loadProfileFromStore();
    } finally {
      setPersonalSaving(false);
    }
  }
  async function handleSaveBusinessProfile() {
    if (!token) {
      showToast("You are not authenticated. Please log in again.", { type: "error" });
      return;
    }
    if (__DEV__) {
      console.log("[update-business-profile] auth token", token);
    }
    if (!businessProfile) {
      showToast("Business profile is not available yet.", { type: "error" });
      return;
    }
    const nextBusinessName = editBusinessName.trim();
    const nextBusinessAddress = editBusinessAddress.trim();
    const nextBusinessCity = editBusinessCityName.trim();
    const nextBusinessPincode = normalizePostalCodeForStorage(editBusinessPincode);
    const nextBusinessPhone = digitsOnly(editBusinessPhone);
    const nextBusinessEmail = editBusinessEmail.trim();
    const nextBusinessHst = editBusinessHstNumber.trim().toUpperCase();
    const nextBusinessGstDigits = digitsOnly(editBusinessGstPercent).slice(0, 3);
    const nextBusinessGst =
      nextBusinessGstDigits.length > 0 && Number(nextBusinessGstDigits) <= 50
        ? nextBusinessGstDigits
        : "";

    if (editShopTypes.length === 0) {
      showToast("Select at least one business type.", { type: "error" });
      return;
    }
    if (!nextBusinessEmail || !isValidEmail(nextBusinessEmail)) {
      showToast("Enter a valid business email address.", { type: "error" });
      return;
    }
    if (nextBusinessPhone.length < 10 || nextBusinessPhone.length > 15) {
      showToast("Enter a valid phone number (10-15 digits).", { type: "error" });
      return;
    }
    if (!nextBusinessPincode || !isValidCanadianPostalCode(editBusinessPincode)) {
      showToast(POSTAL_CODE_ERROR_MESSAGE, { type: "error" });
      return;
    }
    if (nextBusinessHst.length > 0 && nextBusinessHst.length !== 17) {
      showToast("Enter a valid TAX ID No (17 uppercase alphanumeric characters).", { type: "error" });
      return;
    }
    if (nextBusinessGstDigits.length > 0 && Number(nextBusinessGstDigits) > 50) {
      showToast("Enter a valid tax percentage (0 - 50).", { type: "error" });
      return;
    }

    const nextBusinessLogo = editBusinessLogoUri.trim();
    const shouldUploadBusinessLogo =
      nextBusinessLogo.length > 0 &&
      (nextBusinessLogo.startsWith("file://") || nextBusinessLogo.startsWith("content://"));

    setBusinessOpen(true);
    setIsBusinessEditing(false);
    setServerData((prev) => {
      if (!prev) {
        return prev;
      }
      const prevBusiness = prev.businessProfile;
      return {
        ...prev,
        businessProfile: {
          ...prevBusiness,
          businessName: nextBusinessName || prevBusiness.businessName,
          businessAddress: nextBusinessAddress || prevBusiness.businessAddress,
          ...(nextBusinessCity.length > 0 ? { city: nextBusinessCity } : null),
          pincode: nextBusinessPincode || prevBusiness.pincode,
          businessPhone: nextBusinessPhone || prevBusiness.businessPhone,
          businessEmail: nextBusinessEmail || prevBusiness.businessEmail,
          businessHSTNumber: nextBusinessHst || prevBusiness.businessHSTNumber,
          gst: nextBusinessGst || prevBusiness.gst,
          shopTypes: editShopTypes,
          shopType: editShopTypes[0],
          businessLogo: businessLogoRemoved ? null : nextBusinessLogo || prevBusiness.businessLogo,
        },
      };
    });

    setBusinessSaving(true);
    try {
      const body = new FormData();
      if (nextBusinessName.length > 0) body.append("businessName", nextBusinessName);
      if (nextBusinessAddress.length > 0) body.append("businessAddress", nextBusinessAddress);
      if (nextBusinessCity.length > 0) body.append("city", nextBusinessCity);
      if (nextBusinessPincode.length > 0) body.append("pincode", nextBusinessPincode);
      if (nextBusinessPhone.length > 0) body.append("businessPhone", nextBusinessPhone);
      if (nextBusinessEmail.length > 0) body.append("businessEmail", nextBusinessEmail);
      if (nextBusinessHst.length > 0) body.append("businessHSTNumber", nextBusinessHst);
      body.append("gst", nextBusinessGst || "0");
      body.append("shopTypes", JSON.stringify(editShopTypes));

      if (businessLogoRemoved) {
        body.append("removeBusinessLogo", "true");
      }

      if (shouldUploadBusinessLogo) {
        const logoPart = localImageMultipartPart(nextBusinessLogo, {
          mimeType: editBusinessLogoMime,
          fileName: editBusinessLogoFileName,
          fallbackBase: "business-logo",
        });
        body.append("businessLogo", {
          uri: logoPart.uri,
          name: logoPart.name,
          type: logoPart.type,
        } as unknown as Blob);
      }

      const normalizedBase = API_BASE_URL.replace(/\/+$/, "");
      if (__DEV__) {
        console.log("[update-business-profile] request", {
          endpoint: `${normalizedBase}/api/autoshopowner/profile/business`,
          fields: {
            businessName: nextBusinessName,
            businessAddress: nextBusinessAddress,
            city: nextBusinessCity,
            pincode: nextBusinessPincode,
            businessPhone: nextBusinessPhone,
            businessEmail: nextBusinessEmail,
            businessHSTNumber: nextBusinessHst,
            gst: nextBusinessGst || "0",
            shopTypes: editShopTypes,
            businessLogo: shouldUploadBusinessLogo ? "attached" : "unchanged",
          },
        });
      }
      const businessProfileUrl = `${normalizedBase}/api/autoshopowner/profile/business`;
      logApiRequest("PUT", businessProfileUrl, body);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45_000);
      const response = await fetch(businessProfileUrl, {
        method: "PUT",
        headers: {
          Authorization: token,
        },
        body,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
      const payload = (await response.json().catch(() => null)) as EditBusinessProfileResponse | null;
      if (__DEV__) {
        console.log("[update-business-profile] response", {
          ok: response.ok,
          status: response.status,
          payload,
        });
      }

      if (!response.ok || !payload?.success) {
        showToast(payload?.message ?? "Failed to update business profile.", { type: "error" });
        await loadProfileFromStore();
        return;
      }

      showToast(payload.message ?? "Business profile updated successfully.", { type: "success" });

      await refreshSession();

      const portal = await fetchAndMergeShopOwnerPortal(token);
      if (portal.profile) {
        await saveAutoShopOwnerProfile(portal.profile);
        setServerData(portal.profile.data);
        setServerProfile(portal.profile.data.userProfile);
      }
    } catch (err) {
      const message =
        err instanceof Error && err.name === "AbortError"
          ? "Upload timed out. Please try again."
          : "Network error while updating business profile.";
      showToast(message, { type: "error" });
      await loadProfileFromStore();
    } finally {
      setBusinessSaving(false);
    }
  }

  async function handleSaveActivitySchedule() {
    if (!token) {
      showToast("You are not authenticated. Please log in again.", { type: "error" });
      return;
    }
    const scheduleError = validatePerDaySchedule(activitySchedule);
    if (scheduleError) {
      showToast(scheduleError, { type: "error" });
      return;
    }
    const nextPerDayOpenHours = perDayOpenHoursFromSchedule(activitySchedule);
    const nextPerDayOpenHoursJson = serializePerDayOpenHoursForApi(activitySchedule);

    setActivityOpen(true);
    setIsActivityEditing(false);
    setServerData((prev) => {
      if (!prev?.businessProfile) {
        return prev;
      }
      return {
        ...prev,
        businessProfile: {
          ...prev.businessProfile,
          perDayOpenHours: nextPerDayOpenHours,
        },
      };
    });

    setActivitySaving(true);
    try {
      const response = await updateWeeklyOpenHours(
        token,
        nextPerDayOpenHours.map((entry) => ({
          day: entry.day,
          open: entry.open,
          close: entry.close,
          isClosed: entry.isClosed,
        }))
      );
      const payload = response.data;
      if (
        !response.ok ||
        (payload && typeof payload === "object" && "success" in payload && payload.success === false)
      ) {
        const message =
          payload && typeof payload === "object" && "message" in payload
            ? String((payload as { message?: string }).message ?? "")
            : "";
        showToast(message || "Failed to update open hours.", { type: "error" });
        await loadProfileFromStore();
        return;
      }

      showToast(
        (payload && typeof payload === "object" && "message" in payload
          ? String((payload as { message?: string }).message ?? "")
          : "") || "Open hours updated successfully.",
        { type: "success" }
      );
      await refreshSession();
      const portal = await fetchAndMergeShopOwnerPortal(token);
      if (portal.profile) {
        await saveAutoShopOwnerProfile(portal.profile);
        setServerData(portal.profile.data);
        setServerProfile(portal.profile.data.userProfile);
      }
    } catch {
      showToast("Network error while updating open hours.", { type: "error" });
      await loadProfileFromStore();
    } finally {
      setActivitySaving(false);
    }
  }

  return (
    <>
      <TabScreenFrame
        backgroundColor={colors.bgProfile}
        header={
          <AppBar title="Profile" leadingMode="back" onBackPress={() => handleBackPress?.()} />
        }
        bottomInsetExtra={spacing.lg}
        onRefresh={handleRefreshProfile}
        refreshing={refreshing}
      >
        {isLoading || refreshing ? (
          <ProfileLoadingSkeleton showBusiness={isAutoShopOwner} />
        ) : (
          <>
            <ProfileHeader
              name={displayProfile.name}
              isAutoShopOwner={isAutoShopOwner}
              badgeLabel={businessNameLabel}
              onEditPress={() => handleHeroAvatarEdit?.()}
              gradient={gradients.profileHero}
              businessLogoUri={viewableBusinessLogoUri}
              bannerUri={isAutoShopOwner ? viewableBusinessBannerUri : null}
            />

            <View style={styles.scrollContent}>
              <PersonalInformationCard
                expanded={personalOpen}
                editing={isPersonalEditing}
                saving={personalSaving}
                onToggle={handleTogglePersonalSection}
                onEdit={handleStartPersonalEdit}
                onSave={handleSaveProfile}
                onCancel={handleCancelPersonalEdit}
                personalFields={personalFields}
                editName={editName}
                setEditName={setEditName}
                editEmail={editEmail}
                setEditEmail={setEditEmail}
                editPhone={editPhone}
                editCityName={editCityName}
                onPickCity={() => {
                  setCityPickerTarget("personal");
                  setCityPickerOpen(true);
                }}
                editProfilePhotoUri={editProfilePhotoUri}
                onPickProfilePhoto={() => void pickProfilePhoto()}
                onRemoveProfilePhoto={clearProfilePhoto}
              />

              {isAutoShopOwner ? (
                <>
                  <BusinessInformationCard
                    expanded={businessOpen}
                    editing={isBusinessEditing}
                    onToggle={handleToggleBusinessSection}
                    onEdit={handleStartBusinessEdit}
                    onSave={handleSaveBusinessProfile}
                    onCancel={handleCancelBusinessEdit}
                    saving={businessSaving}
                    businessFields={businessFields}
                    viewableBusinessLogoUri={viewableBusinessLogoUri}
                    onViewLogo={setLogoViewerUri}
                    editBusinessName={editBusinessName}
                    setEditBusinessName={setEditBusinessName}
                    editBusinessEmail={editBusinessEmail}
                    setEditBusinessEmail={setEditBusinessEmail}
                    editBusinessPhone={editBusinessPhone}
                    setEditBusinessPhone={setEditBusinessPhone}
                    editBusinessAddress={editBusinessAddress}
                    setEditBusinessAddress={setEditBusinessAddress}
                    editBusinessCityName={editBusinessCityName}
                    onPickBusinessCity={() => {
                      setCityPickerTarget("business");
                      setCityPickerOpen(true);
                    }}
                    editBusinessPincode={editBusinessPincode}
                    setEditBusinessPincode={setEditBusinessPincode}
                    editBusinessHstNumber={editBusinessHstNumber}
                    setEditBusinessHstNumber={setEditBusinessHstNumber}
                    editBusinessGstPercent={editBusinessGstPercent}
                    setEditBusinessGstPercent={setEditBusinessGstPercent}
                    editShopTypes={editShopTypes}
                    onToggleShopType={toggleShopType}
                    editBusinessLogoUri={editBusinessLogoUri}
                    onPickBusinessLogo={handlePickBusinessLogo}
                    onRemoveBusinessLogo={clearBusinessLogo}
                  />

                  <ActivityScheduleCard
                    expanded={activityOpen}
                    editing={isActivityEditing}
                    saving={activitySaving}
                    onToggle={handleToggleActivitySection}
                    onEdit={handleStartActivityEdit}
                    onSave={handleSaveActivitySchedule}
                    onCancel={handleCancelActivityEdit}
                    scheduleDisplay={activityScheduleDisplay}
                    editSchedule={activitySchedule}
                    setEditSchedule={setActivitySchedule}
                  />

                  <CarCompaniesCard
                    totalCount={carCompanies.allCompanies.length}
                    selectedCount={carCompanies.myCompanyIds.length}
                    onPress={() => openCarCompaniesFromProfile?.()}
                  />

                  <ServicesSelectionCard
                    totalCount={services.allServices.length}
                    selectedCount={services.myServiceIds.length}
                    onPress={() => openServicesFromProfile?.()}
                  />

                  <DocumentTemplateCard
                    title="Invoice Templates"
                    icon="receipt-outline"
                    rowIcon="document-text-outline"
                    rowLabel="Active Template"
                    rowValue={savedInvoiceTemplateName}
                    onPress={() => openInvoiceTemplatesFromProfile?.()}
                  />

                  <DocumentTemplateCard
                    title="Manage Invoices"
                    icon="settings-outline"
                    rowIcon="pricetag-outline"
                    rowLabel="Invoice Code & Number"
                    rowValue="Configure"
                    onPress={() => openManageInvoicesFromProfile?.()}
                  />
                </>
              ) : null}

              <ProfileFooter onLogout={handleLogout} showDevTokenButton={__DEV__} onPrintAuthToken={handlePrintAuthToken} />
            </View>
            <Modal visible={Boolean(logoViewerUri)} transparent animationType="fade" onRequestClose={() => setLogoViewerUri(null)}>
              <View style={styles.logoModalBackdrop}>
                <View style={styles.logoModalCard}>
                  <View style={styles.logoModalHeader}>
                    <Text style={styles.logoModalTitle}>Business Logo</Text>
                    <Pressable onPress={() => setLogoViewerUri(null)} hitSlop={8}>
                      <Ionicons name="close" size={18} color={colors.textMuted} />
                    </Pressable>
                  </View>
                  {logoViewerUri ? <Image source={{ uri: logoViewerUri }} style={styles.logoModalImage} resizeMode="contain" /> : null}
                </View>
              </View>
            </Modal>

            <ShopOwnerCityPickerModal
              visible={cityPickerOpen}
              onClose={() => setCityPickerOpen(false)}
              authToken={token}
              selectedId={
                cityPickerTarget === "personal"
                  ? editCityId || null
                  : editBusinessCityId || null
              }
              onSelect={(city: UserCity) => {
                if (cityPickerTarget === "personal") {
                  setEditCityId(city.id);
                  setEditCityName(city.name);
                } else {
                  setEditBusinessCityId(city.id);
                  setEditBusinessCityName(city.name);
                }
              }}
            />

            <ManageInvoicesModal
              visible={manageInvoicesOpen}
              authToken={token}
              onClose={() => setManageInvoicesOpen(false)}
            />
          </>
        )}
      </TabScreenFrame>

    </>
  );
}

const styles = StyleSheet.create({
  skeletonBlock: {
    backgroundColor: colors.border,
    borderRadius: radii.md,
  },
  skeletonHero: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    alignItems: "center",
    backgroundColor: colors.bgAlt,
    gap: spacing.md,
  },
  skeletonAvatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  skeletonCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  skeletonMiniIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.bgAlt,
  },
  skeletonRowText: {
    flex: 1,
    gap: spacing.xs,
  },
  heroBody: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    alignItems: "center",
  },
  avatarWrap: { alignItems: "center", marginBottom: spacing.md },
  avatarContainer: {
    width: 112,
    height: 112,
    position: "relative",
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: colors.white,
    backgroundColor: colors.primaryMutedBg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  patternRow: { flexDirection: "row" },
  patternCell: {
    width: 28,
    height: 28,
    borderWidth: 0.5,
    borderColor: "rgba(37,99,235,0.18)",
  },
  avatarIcon: { position: "absolute" },
  editAvatar: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.orangeAccent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
  },
  editAvatarPressed: {
    opacity: 0.78,
  },
  name: { fontSize: fontSizes.hero, fontWeight: "800", color: colors.primaryBlue900, marginBottom: spacing.sm },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radii.round,
  },
  roleText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: fontSizes.xs,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.sm,
    marginTop: -spacing.md,
    gap: spacing.md + 2,
  },
  businessEditBlock: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  businessEditLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textMuted,
  },
  openDaysValue: {
    fontSize: fontSizes.xs,
    color: colors.primaryBlue900,
    fontWeight: "700",
  },
  devTokenBtn: {
    marginTop: spacing.sm,
    height: 44,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  devTokenBtnPressed: {
    opacity: 0.8,
  },
  devTokenBtnText: {
    color: colors.primaryDark,
    fontSize: fontSizes.sm,
    fontWeight: "700",
  },
  logoModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  logoModalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  logoModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoModalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.text,
  },
  logoModalImage: {
    width: "100%",
    height: 220,
    borderRadius: radii.lg,
    backgroundColor: colors.bgAlt,
  },
  modalLabel: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalInputMultiline: {
    height: 82,
    paddingTop: spacing.sm,
    textAlignVertical: "top",
  },
  phoneInputRow: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    flexDirection: "row",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  phoneInputRowDisabled: {
    backgroundColor: colors.bgAlt,
    borderColor: colors.border,
  },
  countryCodePill: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    fontWeight: "700",
    backgroundColor: colors.bgAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
  },
  countryCodePillDisabled: {
    backgroundColor: colors.white,
    color: colors.textLight,
  },
  phoneInput: {
    flex: 1,
    color: colors.text,
    height: "100%",
  },
  phoneInputDisabled: {
    color: colors.textLight,
  },
  modalSaveDisabled: {
    opacity: 0.55,
  },
});
