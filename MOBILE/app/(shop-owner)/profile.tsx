import {
  ActivityScheduleCard,
  BusinessInformationCard,
  PersonalInformationCard,
  ProfileFooter,
  ProfileHeader,
  TeamMembersCard,
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
import { updateBusinessOpenHours } from "@/lib/auto-shop-owner-api";
import { useLogoutAction } from "@/hooks/use-logout-action";
import { useOncePress } from "@/hooks/use-once-press";
import { useShopOwnerCarCompanies } from "@/hooks/use-shop-owner-car-companies";
import { useShopOwnerServices } from "@/hooks/use-shop-owner-services";
import { API_BASE_URL, getJson, logApiRequest, putJson } from "@/lib/api";
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
  getDialCountryOption,
} from "@/lib/dial-countries";
import { getQuickDeviceCoordinates } from "@/lib/get-quick-device-coordinates";
import { localImageMultipartPart } from "@/lib/local-image-for-form";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import {
  digitsOnly,
  formatPincodeDisplay,
  isValidCanadianPostalCode,
  isValidEmail,
  normalizePostalCodeForStorage,
  POSTAL_CODE_ERROR_MESSAGE,
} from "@/lib/validation";
import type { AutoShopOwnerProfileResponse } from "@/types/auto-shop-owner-profile";
import type { TeamMember } from "@/types/team-member";
import type { UserCity } from "@/types/user-cities";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
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
  address: "",
  pincode: "",
  role: "",
};

type UserProfileData = {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  pincode: string;
  address: string;
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

function isActiveTeamMember(member: TeamMember) {
  const raw = member as TeamMember & {
    isActive?: boolean;
    active?: boolean;
    status?: string;
  };
  if (typeof raw.isActive === "boolean") {
    return raw.isActive;
  }
  if (typeof raw.active === "boolean") {
    return raw.active;
  }
  if (typeof raw.status === "string") {
    return raw.status.toLowerCase() === "active";
  }
  return true;
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
    pincode: typeof source.pincode === "string" ? source.pincode : "",
    address: typeof source.address === "string" ? source.address : "",
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

  const displayProfile = {
    name: serverProfile?.name ?? userProfile?.name ?? meta?.name ?? DEFAULT_PROFILE.name,
    email: serverProfile?.email ?? userProfile?.email ?? DEFAULT_PROFILE.email,
    countryCode: serverProfile?.countryCode ?? userProfile?.countryCode ?? DEFAULT_PROFILE.countryCode,
    phone: serverProfile?.phone ?? userProfile?.phone ?? DEFAULT_PROFILE.phone,
    address: serverProfile?.address ?? userProfile?.address ?? DEFAULT_PROFILE.address,
    pincode: serverProfile?.pincode ?? userProfile?.pincode ?? DEFAULT_PROFILE.pincode,
    role: serverProfile?.role ?? userProfile?.role ?? meta?.role ?? DEFAULT_PROFILE.role,
  };
  const isAutoShopOwner =
    typeof displayProfile.role === "string" &&
    displayProfile.role.toLowerCase() === "autoshopowner";
  const {
    isPersonalEditing,
    setIsPersonalEditing,
    editName,
    setEditName,
    editEmail,
    setEditEmail,
    editPhone,
    setEditPhone,
    editDialCountryId,
    setEditDialCountryId,
    editPincode,
    setEditPincode,
    editAddress,
    setEditAddress,
    cancelPersonalEdit,
  } = usePersonalProfileEditor(displayProfile);

  const personalFields = useMemo(
    () => [
      { label: "Full Name", value: displayProfile.name, icon: "person-outline" as const },
      { label: "Email Address", value: displayProfile.email || "Not provided", icon: "mail-outline" as const },
      {
        label: "Mobile Number",
        value: displayProfile.phone
          ? `${displayProfile.countryCode} ${formatStoredNationalPhone(displayProfile.phone)}`.trim()
          : "Not provided",
        icon: "call-outline" as const,
      },
      { label: "Address", value: displayProfile.address || "Not provided", icon: "location-outline" as const },
      { label: "Zip Code", value: formatPincodeDisplay(displayProfile.pincode) || "Not provided", icon: "map-outline" as const },
    ],
    [displayProfile.address, displayProfile.countryCode, displayProfile.email, displayProfile.name, displayProfile.phone, displayProfile.pincode]
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
    editBusinessLat,
    setEditBusinessLat,
    editBusinessLng,
    setEditBusinessLng,
    editBusinessLogoUri,
    editBusinessLogoMime,
    editBusinessLogoFileName,
    businessLogoRemoved,
    clearBusinessLogo,
    editBusinessBannerUri,
    editBusinessBannerMime,
    editBusinessBannerFileName,
    businessBannerRemoved,
    clearBusinessBanner,
    cancelBusinessEdit,
    pickBusinessLogo,
    pickBusinessBanner,
  } = useBusinessProfileEditor(businessProfile, (message) => showToast(message, { type: "error" }));

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

  useFocusEffect(
    useCallback(() => {
      // Reset UI state whenever Profile regains focus (tabs keep screens mounted).
      setPersonalOpen(false);
      setBusinessOpen(false);
      setActivityOpen(false);
      setLogoViewerUri(null);

      // Exit edit modes and revert any unsaved drafts.
      setIsPersonalEditing(false);
      cancelPersonalEdit();
      setIsBusinessEditing(false);
      cancelBusinessEdit();
      setIsActivityEditing(false);
      setActivitySchedule(resolvedActivitySchedule);

      return undefined;
    }, [
      cancelBusinessEdit,
      cancelPersonalEdit,
      resolvedActivitySchedule,
      setIsBusinessEditing,
      setIsPersonalEditing,
    ])
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
        label: "Business Address",
        value: businessProfile?.businessAddress?.trim() || "Not provided",
        icon: "location-outline" as const,
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
        label: "Zip Code",
        value: businessProfile?.pincode?.trim()
          ? formatPincodeDisplay(businessProfile.pincode)
          : "Not provided",
        icon: "map-outline" as const,
      },
      {
        label: "Business Phone",
        value: businessProfile?.businessPhone?.trim()
          ? formatStoredNationalPhone(businessProfile.businessPhone)
          : "Not provided",
        icon: "call-outline" as const,
      },
      {
        label: "Business Email",
        value: businessProfile?.businessEmail?.trim() || "Not provided",
        icon: "mail-outline" as const,
      },
      {
        label: "Business HST Number",
        value: businessProfile?.businessHSTNumber ?? "Not provided",
        icon: "receipt-outline" as const,
      },
      {
        label: "GST %",
        value:
          businessProfile?.gst != null && String(businessProfile.gst).trim().length > 0
            ? `${String(businessProfile.gst).trim()}%`
            : "Not provided",
        icon: "cash-outline" as const,
      },
      {
        label: "Latitude",
        value: String(businessProfile?.businessMapLocation?.lat ?? "Not provided"),
        icon: "navigate-outline" as const,
      },
      {
        label: "Longitude",
        value: String(businessProfile?.businessMapLocation?.lng ?? "Not provided"),
        icon: "compass-outline" as const,
      },
      {
        label: "Business Logo",
        value: businessProfile?.businessLogo ? "Tap to view logo" : "No logo uploaded",
        icon: "image-outline" as const,
      },
    ],
    // Note: we include editBusinessCityName so the value updates while editing.
    [businessProfile, editBusinessCityName]
  );
  const teamMembers = (businessProfile?.teamMembers ?? []) as TeamMember[];
  const activeTeamMembersCount = teamMembers.filter((member) => isActiveTeamMember(member)).length;
  const businessNameLabel = businessProfile?.businessName?.trim() || "Business";
  const openTeamsFromProfile = useOncePress(() => {
    router.push({
      pathname: "/(shop-owner)/teams",
      params: { backTo: "/(shop-owner)/profile", from: "profile" },
    });
  });
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
  const viewableBusinessLogoUri = useMemo(
    () => normalizeMediaUrl(businessProfile?.businessLogo ?? null),
    [businessProfile?.businessLogo]
  );
  const viewableBusinessBannerUri = useMemo(() => {
    if (isBusinessEditing && businessBannerRemoved) {
      return null;
    }
    const draft = editBusinessBannerUri.trim();
    if (draft.length > 0) {
      return draft.startsWith("file://") || draft.startsWith("content://")
        ? draft
        : normalizeMediaUrl(draft);
    }
    return normalizeMediaUrl(businessProfile?.bannerImage ?? null);
  }, [businessBannerRemoved, businessProfile?.bannerImage, editBusinessBannerUri, isBusinessEditing]);

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
    const role = meta?.role?.toLowerCase() ?? "";
    const isAutoShopOwnerRole = role === "autoshopowner";
    const nextName = editName.trim();
    const nextEmail = editEmail.trim();
    const nextPhone = digitsOnly(editPhone).slice(0, 10);
    const nextPincode = normalizePostalCodeForStorage(editPincode);
    const nextAddress = editAddress.trim();
    if (nextName.length > 20) {
      showToast("Name must be at most 20 characters.", { type: "error" });
      return;
    }
    if (nextEmail.length > 0 && !isValidEmail(nextEmail)) {
      showToast("Enter a valid email address.", { type: "error" });
      return;
    }
    if (nextPhone.length > 0 && nextPhone.length !== 10) {
      showToast("Phone number must be 10 digits.", { type: "error" });
      return;
    }
    if (nextPincode.length > 0 && !isValidCanadianPostalCode(editPincode)) {
      showToast(POSTAL_CODE_ERROR_MESSAGE, { type: "error" });
      return;
    }
    if (nextAddress.length > 50) {
      showToast("Address must be at most 50 characters.", { type: "error" });
      return;
    }
    const personalUpdateBody: Record<string, string> = {};
    if (nextName.length > 0) personalUpdateBody.name = nextName;
    if (nextEmail.length > 0) personalUpdateBody.email = nextEmail;
    if (nextPhone.length > 0) {
      personalUpdateBody.phone = nextPhone;
      personalUpdateBody.countryCode = getDialCountryOption(editDialCountryId).callingCode;
    }
    if (nextPincode.length > 0) personalUpdateBody.pincode = nextPincode;
    if (nextAddress.length > 0) personalUpdateBody.address = nextAddress.slice(0, 50);

    // Optimistic UI: close edit instantly and reflect values immediately.
    setIsPersonalEditing(false);
    if (isAutoShopOwnerRole) {
      setServerProfile((prev) => (prev ? {
        ...prev,
        name: nextName || prev.name,
        email: nextEmail || prev.email,
        phone: nextPhone || prev.phone,
        pincode: nextPincode || prev.pincode,
        address: nextAddress || prev.address,
      } : prev));
    } else {
      setUserProfile((prev) => ({
        name: nextName || prev?.name || displayProfile.name,
        email: nextEmail || prev?.email || displayProfile.email,
        phone: nextPhone || prev?.phone || displayProfile.phone,
        pincode: nextPincode || prev?.pincode || displayProfile.pincode,
        address: nextAddress || prev?.address || displayProfile.address,
        role: prev?.role ?? displayProfile.role ?? "",
        countryCode: prev?.countryCode ?? displayProfile.countryCode ?? "",
      }));
    }

    setPersonalSaving(true);
    try {
      const editProfilePath = isAutoShopOwnerRole
        ? "/api/auto-shop-owner/edit-profile"
        : "/api/user/edit-profile";
      const response = await putJson<EditProfileResponse>(
        editProfilePath,
        personalUpdateBody,
        { authToken: token }
      );

      const payload = response.data;
      if (!response.ok || !payload?.success) {
        showToast(payload?.message ?? "Failed to update profile.", { type: "error" });
        await loadProfileFromStore();
        return;
      }

      // Show result immediately; refresh happens after.
      showToast(payload.message ?? "Profile updated successfully.", { type: "success" });

      await refreshSession();
      const updated = parseUserProfilePayload(payload.data ?? payload);
      if (isAutoShopOwnerRole) {
        const freshProfile = await getJson<AutoShopOwnerProfileResponse>("/api/auto-shop-owner/profile", {
          authToken: token,
        });
        if (freshProfile.ok && freshProfile.data?.data?.userProfile) {
          setServerData(freshProfile.data.data);
          setServerProfile(freshProfile.data.data.userProfile);
        }
      } else if (updated) {
        setUserProfile((prev) => ({
          ...prev,
          ...updated,
          role: prev?.role ?? displayProfile.role ?? "",
          countryCode: prev?.countryCode ?? displayProfile.countryCode ?? "",
        }));
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
    const nextBusinessCityId = editBusinessCityId.trim();
    const nextBusinessCityName = editBusinessCityName.trim();
    const nextBusinessCity = nextBusinessCityName;
    const nextBusinessPincode = normalizePostalCodeForStorage(editBusinessPincode);
    const nextBusinessPhone = digitsOnly(editBusinessPhone).slice(0, 10);
    const nextBusinessEmail = editBusinessEmail.trim();
    const nextBusinessHst = editBusinessHstNumber.trim();
    const nextBusinessGstDigits = digitsOnly(editBusinessGstPercent).slice(0, 3);
    const nextBusinessGst =
      nextBusinessGstDigits.length > 0 && Number(nextBusinessGstDigits) <= 100 ? nextBusinessGstDigits : "";
    if (nextBusinessGstDigits.length > 0 && Number(nextBusinessGstDigits) > 100) {
      showToast("GST % must be 0–100.", { type: "error" });
      return;
    }
    if (nextBusinessEmail.length > 0 && !isValidEmail(nextBusinessEmail)) {
      showToast("Enter a valid business email address.", { type: "error" });
      return;
    }
    if (nextBusinessPhone.length > 0 && nextBusinessPhone.length !== 10) {
      showToast("Business phone must be 10 digits.", { type: "error" });
      return;
    }
    if (nextBusinessPincode.length > 0 && !isValidCanadianPostalCode(editBusinessPincode)) {
      showToast(POSTAL_CODE_ERROR_MESSAGE, { type: "error" });
      return;
    }
    const nextBusinessLogo = editBusinessLogoUri.trim();
    const shouldUploadBusinessLogo =
      nextBusinessLogo.length > 0 &&
      (nextBusinessLogo.startsWith("file://") || nextBusinessLogo.startsWith("content://"));
    const nextBusinessBanner = editBusinessBannerUri.trim();
    const shouldUploadBusinessBanner =
      nextBusinessBanner.length > 0 &&
      (nextBusinessBanner.startsWith("file://") || nextBusinessBanner.startsWith("content://"));
    const nextLatText = editBusinessLat.trim();
    const nextLngText = editBusinessLng.trim();
    const nextLat = nextLatText.length > 0 ? Number(nextLatText) : null;
    const nextLng = nextLngText.length > 0 ? Number(nextLngText) : null;
    // Optimistic UI: keep the section expanded, leave edit mode, and reflect edits.
    setBusinessOpen(true);
    setIsBusinessEditing(false);
    setServerData((prev) => {
      if (!prev) {
        return prev;
      }
      const prevBusiness: any = prev.businessProfile as any;
      return {
        ...prev,
        businessProfile: {
          ...prevBusiness,
          businessName: nextBusinessName || prev.businessProfile.businessName,
          businessAddress: nextBusinessAddress || prev.businessProfile.businessAddress,
          ...(nextBusinessCityId.length > 0 ? { cityId: nextBusinessCityId } : null),
          ...(nextBusinessCity.length > 0 ? { city: nextBusinessCity } : null),
          pincode: nextBusinessPincode || prev.businessProfile.pincode,
          businessPhone: nextBusinessPhone || prev.businessProfile.businessPhone,
          businessEmail: nextBusinessEmail || prev.businessProfile.businessEmail,
          businessHSTNumber: nextBusinessHst || prev.businessProfile.businessHSTNumber,
          gst: nextBusinessGst || (prevBusiness as any).gst || prev.businessProfile.gst,
          businessLogo: nextBusinessLogo || null,
          bannerImage: businessBannerRemoved
            ? null
            : (nextBusinessBanner || prevBusiness?.bannerImage) ?? null,
          businessMapLocation: {
            ...prev.businessProfile.businessMapLocation,
            lat: nextLat ?? prev.businessProfile.businessMapLocation.lat,
            lng: nextLng ?? prev.businessProfile.businessMapLocation.lng,
          },
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
      if (nextLatText.length > 0) body.append("lat", nextLatText);
      if (nextLngText.length > 0) body.append("lng", nextLngText);
      if (nextBusinessPhone.length > 0) body.append("businessPhone", nextBusinessPhone);
      if (nextBusinessEmail.length > 0) body.append("businessEmail", nextBusinessEmail);
      if (nextBusinessHst.length > 0) body.append("businessHSTNumber", nextBusinessHst);
      if (nextBusinessGst.length > 0) body.append("gst", nextBusinessGst);

      if (businessLogoRemoved) {
        body.append("removeBusinessLogo", "true");
      }

      if (businessBannerRemoved) {
        body.append("removeBannerImage", "true");
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

      if (shouldUploadBusinessBanner) {
        const bannerPart = localImageMultipartPart(nextBusinessBanner, {
          mimeType: editBusinessBannerMime,
          fileName: editBusinessBannerFileName,
          fallbackBase: "business-banner",
        });
        body.append("bannerImage", {
          uri: bannerPart.uri,
          name: bannerPart.name,
          type: bannerPart.type,
        } as unknown as Blob);
      }

      const normalizedBase = API_BASE_URL.replace(/\/+$/, "");
      if (__DEV__) {
        console.log("[update-business-profile] request", {
          endpoint: `${normalizedBase}/api/auto-shop-owner/edit-business-profile`,
          fields: {
            businessName: nextBusinessName,
            businessAddress: nextBusinessAddress,
            city: nextBusinessCity,
            pincode: nextBusinessPincode,
            lat: nextLatText,
            lng: nextLngText,
            businessPhone: nextBusinessPhone,
            businessEmail: nextBusinessEmail,
            businessHSTNumber: nextBusinessHst,
            gst: nextBusinessGst,
            businessLogo: shouldUploadBusinessLogo ? "attached" : "unchanged",
            bannerImage: shouldUploadBusinessBanner ? "attached" : businessBannerRemoved ? "removed" : "unchanged",
          },
        });
      }
      const businessProfileUrl = `${normalizedBase}/api/auto-shop-owner/edit-business-profile`;
      logApiRequest("PUT", businessProfileUrl, body);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45_000);
      const response = await fetch(businessProfileUrl, {
        method: "PUT",
        headers: {
          // Let React Native set the multipart boundary automatically.
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

      // Show result immediately; refresh happens after.
      showToast(payload.message ?? "Business profile updated successfully.", { type: "success" });

      await refreshSession();

      const freshProfile = await getJson<AutoShopOwnerProfileResponse>("/api/auto-shop-owner/profile", {
        authToken: token,
      });
      if (freshProfile.ok && freshProfile.data?.data?.userProfile) {
        setServerData(freshProfile.data.data);
        setServerProfile(freshProfile.data.data.userProfile);
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
      const response = await updateBusinessOpenHours(token, nextPerDayOpenHoursJson);
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
      const freshProfile = await getJson<AutoShopOwnerProfileResponse>("/api/auto-shop-owner/profile", {
        authToken: token,
      });
      if (freshProfile.ok && freshProfile.data?.data?.userProfile) {
        setServerData(freshProfile.data.data);
        setServerProfile(freshProfile.data.data.userProfile);
      }
    } catch {
      showToast("Network error while updating open hours.", { type: "error" });
      await loadProfileFromStore();
    } finally {
      setActivitySaving(false);
    }
  }

  const requestBusinessGps = useCallback(async () => {
    if (!token) {
      showToast("You are not authenticated. Please log in again.", { type: "error" });
      return;
    }
    try {
      const { lat, lng } = await getQuickDeviceCoordinates();
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        showToast("Could not read GPS coordinates.", { type: "error" });
        return;
      }
      setEditBusinessLat(String(lat));
      setEditBusinessLng(String(lng));
      showToast("GPS coordinates updated.", { type: "success" });
    } catch {
      showToast("Could not fetch GPS coordinates.", { type: "error" });
    }
  }, [setEditBusinessLat, setEditBusinessLng, showToast, token]);

  return (
    <>
      <TabScreenFrame
        backgroundColor={colors.bgProfile}
        header={
          <AppBar title="Profile" leadingMode="back" />
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
                setEditPhone={setEditPhone}
                editPincode={editPincode}
                setEditPincode={setEditPincode}
                editAddress={editAddress}
                setEditAddress={setEditAddress}
                editDialCountryId={editDialCountryId}
                setEditDialCountryId={setEditDialCountryId}
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
                    onRequestDeviceLocation={requestBusinessGps}
                    editBusinessName={editBusinessName}
                    setEditBusinessName={setEditBusinessName}
                    editBusinessEmail={editBusinessEmail}
                    setEditBusinessEmail={setEditBusinessEmail}
                    editBusinessPhone={editBusinessPhone}
                    setEditBusinessPhone={setEditBusinessPhone}
                    editBusinessAddress={editBusinessAddress}
                    setEditBusinessAddress={setEditBusinessAddress}
                    editBusinessCityName={editBusinessCityName}
                    onPickBusinessCity={() => setCityPickerOpen(true)}
                    editBusinessPincode={editBusinessPincode}
                    setEditBusinessPincode={setEditBusinessPincode}
                    editBusinessLat={editBusinessLat}
                    setEditBusinessLat={setEditBusinessLat}
                    editBusinessLng={editBusinessLng}
                    setEditBusinessLng={setEditBusinessLng}
                    editBusinessHstNumber={editBusinessHstNumber}
                    setEditBusinessHstNumber={setEditBusinessHstNumber}
                    editBusinessGstPercent={editBusinessGstPercent}
                    setEditBusinessGstPercent={setEditBusinessGstPercent}
                    editBusinessLogoUri={editBusinessLogoUri}
                    onPickBusinessLogo={handlePickBusinessLogo}
                    onRemoveBusinessLogo={clearBusinessLogo}
                    editBusinessBannerUri={editBusinessBannerUri}
                    onPickBusinessBanner={pickBusinessBanner}
                    onRemoveBusinessBanner={clearBusinessBanner}
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

                  <TeamMembersCard
                    teamMembersCount={activeTeamMembersCount}
                    teamMembers={teamMembers}
                    onPress={() => openTeamsFromProfile?.()}
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
              selectedId={editBusinessCityId || null}
              onSelect={(city: UserCity) => {
                setEditBusinessCityId(city.id);
                setEditBusinessCityName(city.name);
              }}
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
