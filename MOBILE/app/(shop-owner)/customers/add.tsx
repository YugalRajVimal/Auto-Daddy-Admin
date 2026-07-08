import { CustomerDetailsView } from "@/components/customers/customer-details-view";
import { CustomerVehicleFields } from "@/components/customers/customer-vehicle-fields";
import { AddVehicleImageButton } from "@/components/car-owner/my-vehicles/add-vehicle-form-fields";
import type { PickedImage } from "@/components/car-owner/my-vehicles/add-vehicle-helpers";
import { StackScreenFrame, useToast } from "@/components/reusables";
import { DialCountrySelector } from "@/components/reusables/forms/dial-country-selector";
import { ShopOwnerCityPickerModal } from "@/components/shop-owner/shop-owner-city-picker-modal";
import { colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useCarCompanyCatalog } from "@/hooks/use-car-company-catalog";
import { useKeyboardBottomInset } from "@/hooks/use-keyboard-bottom-inset";
import {
  addCarOwnerToMyCustomers,
  onboardCarOwner,
  pickCustomerVehicleApiId,
  searchCarOwners,
  toUpdateCustomerVehicleRows,
  updateMyCustomer,
  type CustomerImageUploads,
} from "@/lib/auto-shop-owner-api";
import {
  defaultDialCallingCode,
  defaultDialCountryId,
  type DialCountryId,
  getDialCountryOption,
  resolveDialCountryIdFromStoredCallingCode,
} from "@/lib/dial-countries";
import { NATIONAL_PHONE_DISPLAY_MAX_LENGTH, nationalPhoneDisplayFromKeystrokes } from "@/lib/national-phone-format";
import {
  loadCustomerCityForForm,
  optionalCityField,
  pickCustomerCity,
  userCityFromPick,
} from "@/lib/pick-customer-city";
import {
  formatPincodeDisplay,
  hasCanadianPostalCodeValidationError,
  isValidCanadianPostalCode,
  normalizePostalCodeForStorage,
  PINCODE_DISPLAY_MAX_LENGTH,
  POSTAL_CODE_ERROR_MESSAGE,
} from "@/lib/validation";
import type {
  MyCustomer,
  OnboardVehicle,
  UpdateMyCustomerPayload,
  UpdateMyCustomerProfilePayload,
} from "@/types/auto-shop-owner-endpoints";
import type { UserCity } from "@/types/user-cities";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function isValidEmail(v: string) {
  const s = v.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isValidYear(v: string) {
  const s = v.trim();
  if (!/^\d{4}$/.test(s)) return false;
  const y = Number(s);
  const current = new Date().getFullYear();
  return y >= 1900 && y <= current + 1;
}

type FormVehicle = OnboardVehicle & {
  disabled?: boolean;
  _id?: string;
  vId?: string;
  isNew?: boolean;
  vehicleImage?: PickedImage | null;
};

function emptyVehicle(): FormVehicle {
  return {
    licensePlateNo: "",
    vinNo: "",
    vehicleName: "",
    model: "",
    year: "",
    odometerReading: "",
    vehicleImage: null,
    isNew: true,
  };
}

async function pickImageFromLibrary(): Promise<PickedImage | null | "denied"> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    return "denied";
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.85,
    allowsMultipleSelection: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset?.uri) return null;
  return { uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName };
}

function pickId(obj: Record<string, unknown>): string | null {
  const candidates = [obj.carOwnerId, obj._id, obj.id];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function extractCarOwnerIdFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const root = payload as Record<string, unknown>;
  const direct = pickId(root);
  if (direct) {
    return direct;
  }
  const data = root.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const nestedDirect = pickId(d);
    if (nestedDirect) {
      return nestedDirect;
    }
    const nestedOwner = d.carOwner;
    if (nestedOwner && typeof nestedOwner === "object") {
      const ownerId = pickId(nestedOwner as Record<string, unknown>);
      if (ownerId) {
        return ownerId;
      }
    }
  }
  return null;
}

function extractList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const root = payload as Record<string, unknown>;
  const candidates = [root.data, root.customers, root.carOwners, root.results];
  for (const c of candidates) {
    if (Array.isArray(c)) {
      return c;
    }
    if (c && typeof c === "object") {
      const nested = c as Record<string, unknown>;
      for (const key of ["customers", "carOwners", "results", "items", "rows", "list", "data"]) {
        if (Array.isArray(nested[key])) {
          return nested[key] as unknown[];
        }
      }
    }
  }
  return [];
}

function Field({
  label,
  placeholder,
  icon,
  multiline = false,
  value,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "sentences",
  editable = true,
  maxLength,
  errorText,
}: {
  label: string;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  multiline?: boolean;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  editable?: boolean;
  maxLength?: number;
  errorText?: string | null;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrap, multiline && styles.inputWrapMultiline]}>
        <Ionicons name={icon} size={18} color="#70A8CF" />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          style={[styles.input, multiline && styles.inputMultiline]}
          multiline={multiline}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          maxLength={maxLength}
        />
      </View>
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

export default function AddCustomerPage() {
  const insets = useSafeAreaInsets();
  const keyboardBottom = useKeyboardBottomInset();
  const params = useLocalSearchParams<{
    mode?: string;
    customer?: string;
    backTo?: string;
    vehicleIndex?: string;
    addVehicle?: string;
  }>();
  const vehicleIndexParam = typeof params.vehicleIndex === "string" ? params.vehicleIndex : undefined;
  const appendVehicleParam = params.addVehicle === "1" || params.addVehicle === "true";
  const { token, meta } = useAuth();
  const { showToast } = useToast();
  const isOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";
  const mode = params.mode === "view" || params.mode === "edit" ? params.mode : "add";
  const backTo = typeof params.backTo === "string" ? params.backTo : undefined;
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const encodedCustomer = typeof params.customer === "string" ? params.customer : "";
  const [editCarOwnerId, setEditCarOwnerId] = useState<string | null>(null);
  /** When set, the form shows one vehicle row but save merges into the full customer list at this index. */
  const [editVehicleListSlot, setEditVehicleListSlot] = useState<number | null>(null);
  const [vehiclesBaseline, setVehiclesBaseline] = useState<FormVehicle[] | null>(null);
  /** Save merges `vehicles[0]` onto the end of `vehiclesBaseline` (deep-link from My Customers). */
  const [isAppendingVehicle, setIsAppendingVehicle] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dialCountryId, setDialCountryId] = useState<DialCountryId>(defaultDialCountryId());
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [selectedCity, setSelectedCity] = useState<UserCity | null>(null);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [vehicles, setVehicles] = useState<FormVehicle[]>([emptyVehicle()]);
  const [profileImage, setProfileImage] = useState<PickedImage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const isProfileOnlyEdit = isEditMode && editVehicleListSlot === null && !isAppendingVehicle;
  const isVehicleOnlyForm =
    isEditMode && !isViewMode && (editVehicleListSlot !== null || isAppendingVehicle);
  const showVehicleSection = !isProfileOnlyEdit;
  const carCompanyCatalog = useCarCompanyCatalog(token, showVehicleSection && !isViewMode);

  const resetForm = () => {
    setEditCarOwnerId(null);
    setEditVehicleListSlot(null);
    setVehiclesBaseline(null);
    setIsAppendingVehicle(false);
    setName("");
    setEmail("");
    setDialCountryId(defaultDialCountryId());
    setPhone("");
    setPincode("");
    setAddress("");
    setSelectedCity(null);
    setVehicles([emptyVehicle()]);
    setProfileImage(null);
    setAttemptedSave(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (mode === "add") {
        resetForm();
      }
      return undefined;
    }, [mode])
  );

  useEffect(() => {
    if (mode === "add") {
      return;
    }
    if (!encodedCustomer) {
      return;
    }
    let cancelled = false;
    try {
      const parsed = JSON.parse(decodeURIComponent(encodedCustomer)) as Partial<MyCustomer>;
      setEditCarOwnerId(
        typeof parsed.carOwnerId === "string"
          ? parsed.carOwnerId
          : typeof parsed.id === "string"
            ? parsed.id
            : typeof parsed._id === "string"
              ? parsed._id
              : null
      );
      setName(parsed.name ?? "");
      setEmail(parsed.email ?? "");
      setDialCountryId(resolveDialCountryIdFromStoredCallingCode(parsed.countryCode ?? defaultDialCallingCode()));
      setPhone(nationalPhoneDisplayFromKeystrokes(parsed.phone ?? ""));
      setPincode(formatPincodeDisplay(parsed.pincode ?? ""));
      setAddress(parsed.address ?? "");
      const parsedRecord = parsed as Record<string, unknown>;
      setSelectedCity(userCityFromPick(pickCustomerCity(parsedRecord)));
      void loadCustomerCityForForm(token, parsedRecord).then((city) => {
        if (!cancelled) {
          setSelectedCity(city);
        }
      });
      const mappedVehicles =
        parsed.vehicles?.map((v) => {
          const vehicleId = pickCustomerVehicleApiId(v);
          return {
            licensePlateNo: v.licensePlateNo ?? "",
            vinNo: v.vinNo ?? "",
            vehicleName: v.vehicleName ?? "",
            model: v.model ?? "",
            year: v.year ?? "",
            odometerReading: v.odometerReading ?? "",
            disabled: v.disabled,
            vehicleImage: null,
            ...(vehicleId ? { _id: vehicleId, vId: vehicleId } : {}),
          };
        }) ?? [];
      const slot =
        mode === "edit" && vehicleIndexParam && !appendVehicleParam
          ? (() => {
            const n = Number.parseInt(vehicleIndexParam, 10);
            return Number.isFinite(n) && n >= 0 ? n : null;
          })()
          : null;
      if (mode === "edit" && appendVehicleParam) {
        setIsAppendingVehicle(true);
        setEditVehicleListSlot(null);
        setVehiclesBaseline(mappedVehicles.map((v) => ({ ...v })));
        setVehicles([emptyVehicle()]);
      } else if (slot !== null && mappedVehicles.length > 0 && slot < mappedVehicles.length) {
        setIsAppendingVehicle(false);
        setEditVehicleListSlot(slot);
        setVehiclesBaseline(mappedVehicles.map((v) => ({ ...v })));
        setVehicles([{ ...mappedVehicles[slot] }]);
      } else {
        setIsAppendingVehicle(false);
        setEditVehicleListSlot(null);
        setVehiclesBaseline(null);
        setVehicles(mappedVehicles.length > 0 ? mappedVehicles : [emptyVehicle()]);
      }
    } catch {
      // Ignore malformed params and keep empty state.
    }
    return () => {
      cancelled = true;
    };
  }, [encodedCustomer, mode, vehicleIndexParam, appendVehicleParam, token]);

  async function autoAddToMyList(payload: unknown, fallbackPhone?: string) {
    if (!token) {
      return false;
    }
    let carOwnerId = extractCarOwnerIdFromPayload(payload);
    if (!carOwnerId && fallbackPhone?.trim()) {
      try {
        const lookup = await searchCarOwners(token, fallbackPhone.trim());
        if (lookup.ok) {
          const list = extractList(lookup.data);
          const normalizedPhone = fallbackPhone.trim();
          const match = list.find((item) => {
            if (!item || typeof item !== "object") {
              return false;
            }
            const o = item as Record<string, unknown>;
            return typeof o.phone === "string" && o.phone.trim() === normalizedPhone;
          });
          if (match && typeof match === "object") {
            carOwnerId = pickId(match as Record<string, unknown>);
          }
        }
      } catch {
        // Best-effort fallback; onboarding and verification still succeed.
      }
    }
    if (!carOwnerId) {
      return false;
    }
    const addRes = await addCarOwnerToMyCustomers(token, carOwnerId);
    return addRes.ok;
  }

  function updateVehicle(index: number, patch: Partial<FormVehicle>) {
    setVehicles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  async function saveCustomer() {
    setAttemptedSave(true);
    if (!token || !isOwner) {
      showToast("You must be signed in as a shop owner.", { type: "error" });
      return;
    }
    const vehicleOnlySave =
      isEditMode && ((editVehicleListSlot !== null && vehiclesBaseline != null) || isAppendingVehicle);
    if (!vehicleOnlySave) {
      if (!name.trim() || !email.trim() || !phone.trim() || !pincode.trim()) {
        showToast("Name, email, phone, and pincode are required.", { type: "error" });
        return;
      }
      if (name.trim().length > 20) {
        showToast("Name must be at most 20 characters.", { type: "error" });
        return;
      }
      if (!isValidEmail(email)) {
        showToast("Enter a valid email address.", { type: "error" });
        return;
      }
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (!vehicleOnlySave && phoneDigits.length !== 10) {
      showToast("Phone number must be 10 digits.", { type: "error" });
      return;
    }
    const pinDigits = normalizePostalCodeForStorage(pincode);
    if (!vehicleOnlySave && !isValidCanadianPostalCode(pincode)) {
      showToast(POSTAL_CODE_ERROR_MESSAGE, { type: "error" });
      return;
    }
    if (!vehicleOnlySave && address.trim().length > 50) {
      showToast("Address must be at most 50 characters.", { type: "error" });
      return;
    }
    const profilePayload: UpdateMyCustomerProfilePayload = {
      carOwnerId: editCarOwnerId ?? "",
      name: name.trim(),
      email: email.trim(),
      countryCode: getDialCountryOption(dialCountryId).callingCode,
      phone: phoneDigits,
      pincode: pinDigits,
      address: address.trim().slice(0, 50),
      ...optionalCityField(selectedCity?.name),
    };
    let filledVehicles: UpdateMyCustomerPayload["vehicles"] = [];
    if (!isProfileOnlyEdit) {
      const vehicleRows: FormVehicle[] =
        isEditMode && isAppendingVehicle
          ? [...(vehiclesBaseline ?? []), { ...(vehicles[0] ?? emptyVehicle()), isNew: true }]
          : isEditMode && editVehicleListSlot !== null && vehiclesBaseline
            ? vehiclesBaseline.map((v, i) =>
              i === editVehicleListSlot ? (vehicles[0] ?? emptyVehicle()) : v
            )
            : vehicles;
      filledVehicles = toUpdateCustomerVehicleRows(vehicleRows);
      for (const v of filledVehicles) {
        if (!v.licensePlateNo || !v.vehicleName || !v.model || !v.year) {
          showToast("Each vehicle needs plate, make, model, and year.", { type: "error" });
          return;
        }
        if (v.licensePlateNo.length > 14) {
          showToast("License plate must be at most 14 characters.", { type: "error" });
          return;
        }
        if (v.vinNo && v.vinNo.length !== 17) {
          showToast("VIN number must be exactly 17 characters.", { type: "error" });
          return;
        }
        if (!isValidYear(v.year)) {
          showToast("Enter a valid year (e.g. 2015).", { type: "error" });
          return;
        }
      }
    }
    setSubmitting(true);
    try {
      const imageUploads: CustomerImageUploads = {
        profileImage,
        vehicleImages: vehicles.map((v) => v.vehicleImage ?? null),
      };
      const res = isEditMode && editCarOwnerId
        ? await updateMyCustomer(
          token,
          isProfileOnlyEdit
            ? profilePayload
            : { ...profilePayload, vehicles: filledVehicles },
          imageUploads
        )
        : await onboardCarOwner(token, {
          name: name.trim(),
          email: email.trim(),
          countryCode: getDialCountryOption(dialCountryId).callingCode,
          phone: phoneDigits,
          pincode: pinDigits,
          role: "carowner",
          address: address.trim().slice(0, 50),
          vehicles: filledVehicles,
          ...optionalCityField(selectedCity?.name),
        }, imageUploads);
      const msg =
        res.data && typeof res.data === "object" && "message" in res.data
          ? String((res.data as { message?: string }).message ?? "")
          : "";
      if (!res.ok) {
        showToast(msg || (isEditMode ? "Could not update customer." : "Could not onboard customer."), { type: "error" });
        return;
      }
      showToast(msg || (isEditMode ? "Customer updated." : "Customer onboarded."), { type: "success" });
      if (!isEditMode) {
        const added = await autoAddToMyList(res.data, phoneDigits);
        if (added) {
          showToast("Customer auto-added to My Customers.", { type: "success" });
        }
      }
      if (router.canGoBack()) {
        router.back();
      } else if (backTo) {
        router.replace(backTo as any);
      } else {
        router.replace("/(shop-owner)/customers" as any);
      }
    } catch {
      showToast("Network error.", { type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  // Optional future OTP flow (currently disabled by product decision):
  // Keep this implementation for easy re-enable if verification becomes mandatory again.
  // async function verifyOtp() {
  //   if (!token || !isOwner) {
  //     return;
  //   }
  //   if (!onboardedPhone || !otp.trim()) {
  //     showToast("Enter the OTP sent to the customer.", { type: "error" });
  //     return;
  //   }
  //   setVerifying(true);
  //   try {
  //     const res = await verifyOnboardedCarOwner(token, {
  //       phone: onboardedPhone,
  //       countryCode: countryCode.trim() || "+91",
  //       otp: otp.trim(),
  //     });
  //     const msg =
  //       res.data && typeof res.data === "object" && "message" in res.data
  //         ? String((res.data as { message?: string }).message ?? "")
  //         : "";
  //     if (!res.ok) {
  //       showToast(msg || "Verification failed.", { type: "error" });
  //       return;
  //     }
  //     showToast(msg || "Verified.", { type: "success" });
  //     const added = await autoAddToMyList(res.data, onboardedPhone);
  //     if (added) {
  //       showToast("Customer auto-added to My Customers.", { type: "success" });
  //     }
  //   } catch {
  //     showToast("Network error.", { type: "error" });
  //   } finally {
  //     setVerifying(false);
  //   }
  // }

  const isSingleVehicleEdit = Boolean(isEditMode && editVehicleListSlot !== null && vehiclesBaseline);
  const phoneDisplay = `${getDialCountryOption(dialCountryId).callingCode} ${phone}`.trim();

  const switchToEditMode = useCallback(() => {
    router.setParams({ mode: "edit" });
  }, []);

  return (
    <StackScreenFrame
      title={
        isViewMode
          ? "Customer Details"
          : isEditMode
            ? isAppendingVehicle
              ? "Add Vehicle"
              : isSingleVehicleEdit
                ? "Edit Vehicle"
                : "Edit Customer"
            : "Add Customer"
      }
      backgroundColor={colors.bgProfile}
      scroll={false}
      screenKeyboardAvoiding={false}
      keyboardVerticalOffset={0}
      right={
        isViewMode ? (
          <Pressable
            onPress={switchToEditMode}
            style={({ pressed }) => [styles.headerEditBtn, pressed && styles.headerEditBtnPressed]}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={styles.headerEditBtnText}>Edit</Text>
          </Pressable>
        ) : undefined
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            flexGrow: 1,
            paddingBottom:
              spacing.xxl +
              Math.max(insets.bottom, spacing.md) +
              keyboardBottom +
              (Platform.OS === "android" ? 24 : 16),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        automaticallyAdjustKeyboardInsets={false}
        nestedScrollEnabled
      >
        {isViewMode ? (
          <CustomerDetailsView
            name={name}
            email={email}
            phoneDisplay={phoneDisplay}
            address={address}
            city={selectedCity?.name}
            pincode={pincode}
            vehicles={vehicles}
          />
        ) : (
          <>
            {!isVehicleOnlyForm ? (
              <>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <View style={[styles.card, shadows.soft]}>
                  <Field
                    label="Full Name *"
                    placeholder="Enter full name"
                    icon="person-outline"
                    value={name}
                    onChangeText={(t) => setName(t.slice(0, 20))}
                    maxLength={20}
                    errorText={attemptedSave && !name.trim() ? "Name is required." : null}
                  />
                  <Field
                    label="Email Address *"
                    placeholder="Enter email address"
                    icon="mail-outline"
                    value={email}
                    onChangeText={(t) => setEmail(t.slice(0, 80))}
                    keyboardType="email-address"
                    maxLength={80}
                    errorText={
                      attemptedSave && !email.trim()
                        ? "Email is required."
                        : email.trim() && !isValidEmail(email)
                          ? "Enter a valid email address."
                          : null
                    }
                  />

                  <Text style={styles.fieldLabel}>Phone Number *</Text>
                  <View style={styles.phoneRow}>
                    <DialCountrySelector valueId={dialCountryId} onChange={setDialCountryId} triggerMinWidth={100} />
                    <View style={styles.phoneInput}>
                      <Ionicons name="call-outline" size={18} color="#70A8CF" />
                      <TextInput
                        placeholder="781 708 9765"
                        placeholderTextColor={colors.textLight}
                        style={styles.input}
                        value={phone}
                        onChangeText={(t) => setPhone(nationalPhoneDisplayFromKeystrokes(t))}
                        keyboardType="phone-pad"
                        maxLength={NATIONAL_PHONE_DISPLAY_MAX_LENGTH}
                      />
                    </View>
                  </View>
                  {attemptedSave && phone.replace(/\D/g, "").length !== 10 ? (
                    <Text style={styles.errorText}>Phone number must be 10 digits.</Text>
                  ) : null}

                  <Field
                    label="Zip Code *"
                    placeholder="A1A 1A1"
                    icon="location-outline"
                    value={pincode}
                    onChangeText={(t) => setPincode(formatPincodeDisplay(t))}
                    autoCapitalize="characters"
                    maxLength={PINCODE_DISPLAY_MAX_LENGTH}
                    errorText={
                      attemptedSave && hasCanadianPostalCodeValidationError(pincode)
                        ? POSTAL_CODE_ERROR_MESSAGE
                        : null
                    }
                  />
                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>City</Text>
                    <Pressable
                      style={({ pressed }) => [styles.citySelect, pressed && styles.citySelectPressed]}
                      onPress={() => setCityPickerOpen(true)}
                    >
                      <Ionicons name="business-outline" size={18} color="#70A8CF" />
                      <Text
                        style={[styles.cityValue, !selectedCity?.name?.trim() && styles.cityPlaceholder]}
                        numberOfLines={1}
                      >
                        {selectedCity?.name?.trim() || "Select city…"}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color={colors.textLight} />
                    </Pressable>
                  </View>
                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>Role</Text>
                    <View style={styles.inputWrap}>
                      <Ionicons name="layers-outline" size={18} color="#70A8CF" />
                      <Text style={styles.roleFixed}>carowner</Text>
                    </View>
                  </View>
                  <Field
                    label="Address"
                    placeholder="Enter full address"
                    icon="home-outline"
                    multiline
                    value={address}
                    onChangeText={(t) => setAddress(t.slice(0, 50))}
                    maxLength={50}
                    errorText={address.trim().length > 50 ? "Address must be at most 50 characters." : null}
                  />
                  <AddVehicleImageButton
                    title="Profile photo"
                    image={profileImage}
                    onPress={() => {
                      void (async () => {
                        const picked = await pickImageFromLibrary();
                        if (picked === "denied") {
                          showToast("Photo library permission is required.", { type: "error" });
                          return;
                        }
                        if (picked) setProfileImage(picked);
                      })();
                    }}
                    onRemove={() => setProfileImage(null)}
                  />
                </View>
              </>
            ) : null}

            {showVehicleSection ? (
              <>
                <View style={styles.vehicleHeader}>
                  <Text style={styles.sectionTitle}>
                    {isSingleVehicleEdit || isAppendingVehicle ? "Vehicle" : "Vehicles"}
                  </Text>
                  {!isSingleVehicleEdit && !isAppendingVehicle ? (
                    <Pressable style={styles.addVehicleBtn} onPress={() => setVehicles((v) => [...v, emptyVehicle()])}>
                      <Ionicons name="add" size={14} color={colors.white} />
                      <Text style={styles.addVehicleText}>Add Vehicle</Text>
                    </Pressable>
                  ) : null}
                </View>

                {vehicles.map((v, index) => (
                  <View key={`v-${index}`} style={[styles.card, shadows.soft]}>
                    <Text style={styles.vehicleTitle}>Vehicle {index + 1}</Text>
                    <CustomerVehicleFields
                      vehicle={v}
                      onChange={(patch) => updateVehicle(index, patch)}
                      catalog={carCompanyCatalog}
                      attemptedSave={attemptedSave}
                    />
                    <AddVehicleImageButton
                      title="Vehicle photo"
                      image={v.vehicleImage ?? null}
                      onPress={() => {
                        void (async () => {
                          const picked = await pickImageFromLibrary();
                          if (picked === "denied") {
                            showToast("Photo library permission is required.", { type: "error" });
                            return;
                          }
                          if (picked) updateVehicle(index, { vehicleImage: picked });
                        })();
                      }}
                      onRemove={() => updateVehicle(index, { vehicleImage: null })}
                    />
                    {vehicles.length > 1 ? (
                      <Pressable
                        onPress={() => {
                          Alert.alert("Remove vehicle?", "This vehicle will be removed from the form.", [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Remove",
                              style: "destructive",
                              onPress: () => setVehicles((prev) => prev.filter((_, i) => i !== index)),
                            },
                          ]);
                        }}
                      >
                        <Text style={styles.removeV}>Remove vehicle</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </>
            ) : null}
          </>
        )}

        {!isViewMode ? (
          <Pressable style={styles.saveBtn} disabled={submitting} onPress={() => void saveCustomer()}>
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveText}>
                {isEditMode
                  ? isAppendingVehicle
                    ? "Add Vehicle"
                    : isSingleVehicleEdit
                      ? "Update Vehicle"
                      : "Update Customer"
                  : "Save Customer"}
              </Text>
            )}
          </Pressable>
        ) : null}

        {/* Optional future OTP verification UI intentionally disabled. */}
      </ScrollView>

      <ShopOwnerCityPickerModal
        visible={cityPickerOpen}
        onClose={() => setCityPickerOpen(false)}
        authToken={token}
        selectedId={selectedCity?.id ?? null}
        onSelect={(city) => {
          setSelectedCity(city);
          setCityPickerOpen(false);
        }}
      />
    </StackScreenFrame>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: spacing.screenHorizontal,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: "#356BA3",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  fieldWrap: { gap: spacing.sm - 2 },
  fieldLabel: { fontSize: fontSizes.md, fontWeight: "700", color: colors.text },
  errorText: { marginTop: 4, color: colors.danger, fontSize: fontSizes.xs, fontWeight: "700" },
  inputWrap: {
    minHeight: 40,
    borderRadius: radii.md,
    backgroundColor: "#F1F4FA",
    borderWidth: 1,
    borderColor: "#D9DFEA",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  inputWrapMultiline: { minHeight: 68, alignItems: "flex-start", paddingTop: spacing.sm },
  input: { flex: 1, fontSize: fontSizes.md, color: colors.text, paddingVertical: 0 },
  roleFixed: { flex: 1, fontSize: fontSizes.md, color: colors.textMuted, fontWeight: "600" },
  inputMultiline: { textAlignVertical: "top", minHeight: 48 },
  phoneRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  phoneInput: {
    flex: 1,
    minHeight: 40,
    borderRadius: radii.md,
    backgroundColor: "#F1F4FA",
    borderWidth: 1,
    borderColor: "#D9DFEA",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  citySelect: {
    minHeight: 40,
    borderRadius: radii.md,
    backgroundColor: "#F1F4FA",
    borderWidth: 1,
    borderColor: "#D9DFEA",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  citySelectPressed: { opacity: 0.85 },
  citySelectDisabled: { opacity: 0.55 },
  cityValue: { flex: 1, fontSize: fontSizes.md, fontWeight: "700", color: colors.text },
  cityPlaceholder: { color: colors.textLight, fontWeight: "600" },
  headerEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.lg,
    backgroundColor: colors.overlayWhite,
  },
  headerEditBtnPressed: { opacity: 0.85 },
  headerEditBtnText: { fontSize: fontSizes.sm, fontWeight: "800", color: colors.primary },
  vehicleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addVehicleBtn: {
    height: 34,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  addVehicleText: { color: colors.white, fontSize: fontSizes.sm, fontWeight: "700" },
  vehicleTitle: { fontSize: fontSizes.xl, fontWeight: "800", color: colors.text },
  twoCols: { flexDirection: "row", gap: spacing.sm },
  col: { flex: 1 },
  removeV: { color: colors.danger, fontWeight: "700", fontSize: fontSizes.sm, marginTop: spacing.sm },
  saveBtn: {
    marginTop: spacing.sm,
    minHeight: 44,
    borderRadius: radii.round,
    backgroundColor: "#6B4BB8",
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: colors.white, fontSize: fontSizes.lg, fontWeight: "800" },
});
