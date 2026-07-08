import { LogoPickerField, PerDayOpenHoursEditor, StackScreenFrame, SurfaceCard, useToast } from "@/components/reusables";
import { ShopOwnerCityPickerModal } from "@/components/shop-owner/shop-owner-city-picker-modal";
import { colors, fontSizes, radii, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useAutoShopServicesCatalog } from "@/hooks/use-auto-shop-services-catalog";
import { useLogoutAction } from "@/hooks/use-logout-action";
import { useOncePress } from "@/hooks/use-once-press";
import { useShopOwnerCarCompanies } from "@/hooks/use-shop-owner-car-companies";
import { API_BASE_URL, logApiRequest } from "@/lib/api";
import { getQuickDeviceCoordinates } from "@/lib/get-quick-device-coordinates";
import { localImageMultipartPart } from "@/lib/local-image-for-form";
import {
  createDefaultPerDaySchedule,
  enabledWeekdaysFromSchedule,
  serializePerDayOpenHoursForApi,
  validatePerDaySchedule,
  type PerDaySchedule,
} from "@/lib/per-day-open-hours";
import {
  clampDigits,
  clampText,
  digitsOnly,
  formatPincodeDisplay,
  hasCanadianPostalCodeValidationError,
  isValidCanadianPostalCode,
  isValidEmail,
  normalizePostalCodeForStorage,
  PINCODE_DISPLAY_MAX_LENGTH,
  POSTAL_CODE_ERROR_MESSAGE,
} from "@/lib/validation";
import type { UserCity } from "@/types/user-cities";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

type CompleteBusinessProfileResponse = {
    success?: boolean;
    message?: string;
};

const SAMPLE_LOGO_URI = "";

export default function EditBusinessProfile() {
    const { token, refreshSession } = useAuth();
    const { showToast } = useToast();
    const handleLogout = useLogoutAction();

    const catalogToast = useCallback(
        (message: string, options?: { type?: "error" | "success" | "info" }) => {
            showToast(message, { type: options?.type ?? "error" });
        },
        [showToast]
    );
    const { categories: serviceCatalog, isLoading: serviceCatalogLoading, fetchCatalog } = useAutoShopServicesCatalog(
        token,
        Boolean(token),
        catalogToast
    );

    useEffect(() => {
        void fetchCatalog();
    }, [fetchCatalog]);

    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

    const selectableServiceCount = useMemo(
        () => serviceCatalog.filter((c) => Boolean(c.id?.trim())).length,
        [serviceCatalog]
    );

    const onToggleService = useOncePress((id: string, next: boolean) => {
        const sid = id.trim();
        if (!sid) return;
        setSelectedServiceIds((prev) => {
            if (next) {
                return prev.includes(sid) ? prev : [...prev, sid];
            }
            return prev.filter((x) => x !== sid);
        });
    });

    const carCompanies = useShopOwnerCarCompanies({
        showErrorToast: (m) => showToast(m, { type: "error" }),
        showSuccessToast: (m) => showToast(m, { type: "success" }),
        onChanged: async () => {
            await refreshSession();
        },
    });

    const [businessName, setBusinessName] = useState("");
    const [businessAddress, setBusinessAddress] = useState("");
    const [selectedCity, setSelectedCity] = useState<UserCity | null>(null);
    const [cityPickerOpen, setCityPickerOpen] = useState(false);
    const [pincode, setPincode] = useState("");
    const [lat, setLat] = useState("");
    const [lng, setLng] = useState("");
    const [businessPhone, setBusinessPhone] = useState("");
    const [businessEmail, setBusinessEmail] = useState("");
    const [businessHSTNumber, setBusinessHSTNumber] = useState("");
    const [gstPercent, setGstPercent] = useState("");
    const [businessDaySchedule, setBusinessDaySchedule] = useState<PerDaySchedule>(createDefaultPerDaySchedule);
    const [businessLogoUri, setBusinessLogoUri] = useState(SAMPLE_LOGO_URI);
    const [businessLogoMime, setBusinessLogoMime] = useState<string | null>(null);
    const [businessLogoFileName, setBusinessLogoFileName] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const enabledOpenDays = enabledWeekdaysFromSchedule(businessDaySchedule);
    const perDayOpenHoursJson = serializePerDayOpenHoursForApi(businessDaySchedule);
    const hasValidOpenHours = validatePerDaySchedule(businessDaySchedule) == null;
    const gstDigits = digitsOnly(gstPercent).slice(0, 3);
    const gstValue = gstDigits.length > 0 && Number(gstDigits) <= 100 ? gstDigits : "";

    const canSubmit = useMemo(() => {
        const servicesOk = selectableServiceCount === 0 || selectedServiceIds.length > 0;
        return (
            businessName.trim().length > 0 &&
            businessAddress.trim().length > 0 &&
            Boolean(selectedCity?.name?.trim()) &&
            pincode.trim().length > 0 &&
            lat.trim().length > 0 &&
            lng.trim().length > 0 &&
            businessPhone.trim().length > 0 &&
            businessEmail.trim().length > 0 &&
            businessHSTNumber.trim().length > 0 &&
            gstValue.trim().length > 0 &&
            hasValidOpenHours &&
            enabledOpenDays.length > 0 &&
            servicesOk
        );
    }, [
        businessAddress,
        businessEmail,
        businessHSTNumber,
        businessName,
        businessPhone,
        gstValue,
        lat,
        lng,
        hasValidOpenHours,
        enabledOpenDays.length,
        selectedCity?.name,
        pincode,
        selectableServiceCount,
        selectedServiceIds.length,
    ]);

    async function handleSubmit() {
        if (!token) {
            showToast("You are not authenticated. Please log in again.", { type: "error" });
            return;
        }
        if (!canSubmit) {
            showToast("Please fill all business profile fields.", { type: "error" });
            return;
        }
        if (!hasValidOpenHours) {
            showToast(validatePerDaySchedule(businessDaySchedule) ?? "Please set valid business hours.", { type: "error" });
            return;
        }
        if (!isValidCanadianPostalCode(pincode)) {
            showToast(POSTAL_CODE_ERROR_MESSAGE, { type: "error" });
            return;
        }
        const pinDigits = normalizePostalCodeForStorage(pincode);
        const phoneDigits = digitsOnly(businessPhone);
        if (phoneDigits.length !== 10) {
            showToast("Business phone must be 10 digits.", { type: "error" });
            return;
        }
        if (!isValidEmail(businessEmail)) {
            showToast("Enter a valid business email address.", { type: "error" });
            return;
        }
        if (gstDigits.length === 0) {
            showToast("GST % is required.", { type: "error" });
            return;
        }
        if (Number(gstDigits) > 100) {
            showToast("GST % must be 0–100.", { type: "error" });
            return;
        }
        if (selectableServiceCount > 0 && selectedServiceIds.length === 0) {
            showToast("Select at least one service your shop offers.", { type: "error" });
            return;
        }

        setSubmitting(true);
        try {
            const body = new FormData();
            const serviceWeWorkWithJson = JSON.stringify(selectedServiceIds);
            const formDataFields = {
                businessName: businessName.trim(),
                businessAddress: businessAddress.trim(),
                city: selectedCity?.name ?? "",
                pincode: pinDigits,
                lat: lat.trim(),
                lng: lng.trim(),
                businessPhone: phoneDigits,
                businessEmail: businessEmail.trim(),
                businessHSTNumber: businessHSTNumber.trim(),
                gst: gstValue,
                perDayOpenHours: perDayOpenHoursJson,
                serviceWeWorkWith: serviceWeWorkWithJson,
            };

            Object.entries(formDataFields).forEach(([key, value]) => {
                body.append(key, value);
            });

            const shouldUploadBusinessLogo =
                businessLogoUri.trim().length > 0 &&
                (businessLogoUri.startsWith("file://") || businessLogoUri.startsWith("content://"));
            const logoPart = localImageMultipartPart(businessLogoUri, {
                mimeType: businessLogoMime,
                fileName: businessLogoFileName,
                fallbackBase: "business-logo",
            });
            if (shouldUploadBusinessLogo) {
                body.append("businessLogo", {
                    uri: logoPart.uri,
                    name: logoPart.name,
                    type: logoPart.type,
                } as unknown as Blob);
            }

            const baseUrl = API_BASE_URL.replace(/\/+$/, "");
            if (__DEV__) {
                console.log("[complete-business-profile] request form-data", {
                    endpoint: `${baseUrl}/api/auto-shop-owner/complete-business-profile`,
                    fields: formDataFields,
                    businessLogo: shouldUploadBusinessLogo ? logoPart : "unchanged",
                });
            }
            const completeProfileUrl = `${baseUrl}/api/auto-shop-owner/complete-business-profile`;
            logApiRequest("PUT", completeProfileUrl, body);
            const response = await fetch(completeProfileUrl, {
                method: "PUT",
                headers: {
                    Authorization: token,
                },
                body,
            });

            const payload = (await response.json().catch(() => null)) as CompleteBusinessProfileResponse | null;
            if (__DEV__) {
                console.log("[complete-business-profile] response", {
                    ok: response.ok,
                    status: response.status,
                    payload,
                });
            }

            if (!response.ok || !payload?.success) {
                showToast(payload?.message ?? "Failed to complete business profile.", { type: "error" });
                return;
            }

            showToast(payload.message ?? "Business profile completed successfully.", { type: "success" });
            await refreshSession();
            await carCompanies.refresh();
            router.replace("/(shop-owner)/(tabs)/home");
        } catch {
            showToast("Network error while submitting business profile.", { type: "error" });
        } finally {
            setSubmitting(false);
        }
    }

    async function handlePickBusinessLogo() {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            showToast("Please allow gallery access to select a logo.", { type: "error" });
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
        setBusinessLogoUri(picked.uri);
        setBusinessLogoMime(picked.mimeType ?? null);
        setBusinessLogoFileName(picked.fileName ?? null);
    }

    async function handleUseGps() {
        if (gpsLoading) {
            return;
        }
        try {
            setGpsLoading(true);
            const { lat: nextLat, lng: nextLng } = await getQuickDeviceCoordinates();
            if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
                showToast("Could not read GPS coordinates.", { type: "error" });
                return;
            }
            setLat(String(nextLat));
            setLng(String(nextLng));
            showToast("GPS coordinates updated.", { type: "success" });
        } catch (e) {
            const message = e instanceof Error ? e.message : "";
            if (message === "permission-denied") {
                showToast("Please allow location permission to use GPS.", { type: "error" });
            } else if (message === "timeout") {
                showToast("GPS is taking too long. Please ensure Location is ON and try again.", { type: "error" });
            } else {
                showToast("Could not fetch GPS coordinates.", { type: "error" });
            }
        } finally {
            setGpsLoading(false);
        }
    }

    const headerRight = (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log out"
            style={({ pressed }) => [styles.headerLogoutBtn, pressed && styles.headerLogoutBtnPressed]}
            onPress={() => void handleLogout()}
        >
            <Ionicons name="log-out-outline" size={22} color={colors.danger} />
        </Pressable>
    );

    return (
        <StackScreenFrame
            title="Business Profile"
            backgroundColor={colors.bg}
            contentContainerStyle={styles.scrollContent}
            showBackButton={false}
            right={headerRight}
        >
            <View style={styles.content}>
                <SurfaceCard shadow="card" style={styles.card}>
                    <View style={styles.header}>
                        <Ionicons name="storefront-outline" size={34} color={colors.primary} />
                        <Text style={styles.title}>Complete your business setup</Text>
                        <Text style={styles.desc}>Fill all fields to continue as an auto shop owner.</Text>
                    </View>

                    <Input
                        label="Business Name"
                        value={businessName}
                        onChangeText={(t) => setBusinessName(clampText(t, 50))}
                        maxLength={50}
                    />
                    <Input
                        label="Business Address"
                        value={businessAddress}
                        onChangeText={(t) => setBusinessAddress(clampText(t, 80))}
                        multiline
                        maxLength={80}
                    />
                    <SelectField
                        label="City"
                        value={selectedCity?.name ?? ""}
                        placeholder="Select city…"
                        onPress={() => setCityPickerOpen(true)}
                    />
                    <Input
                        label="Zip Code"
                        value={pincode}
                        onChangeText={(t) => setPincode(formatPincodeDisplay(t))}
                        autoCapitalize="characters"
                        maxLength={PINCODE_DISPLAY_MAX_LENGTH}
                        errorText={
                          pincode.trim().length > 0 && hasCanadianPostalCodeValidationError(pincode)
                            ? POSTAL_CODE_ERROR_MESSAGE
                            : null
                        }
                    />
                    <Input label="Latitude" value={lat} onChangeText={setLat} />
                    <Input label="Longitude" value={lng} onChangeText={setLng} />
                    <Pressable
                        style={({ pressed }) => [
                            styles.gpsBtn,
                            (pressed && !gpsLoading) && styles.gpsBtnPressed,
                            gpsLoading && styles.gpsBtnDisabled,
                        ]}
                        onPress={handleUseGps}
                        disabled={gpsLoading}
                    >
                        <Ionicons name="locate-outline" size={18} color={colors.white} />
                        <Text style={styles.gpsBtnText}>{gpsLoading ? "Locating…" : "Use device GPS"}</Text>
                    </Pressable>
                    <Input
                        label="Business Phone"
                        value={businessPhone}
                        onChangeText={(t) => setBusinessPhone(clampDigits(t, 10))}
                        keyboardType="phone-pad"
                        maxLength={10}
                        errorText={businessPhone.trim().length > 0 && businessPhone.trim().length !== 10 ? "Phone must be 10 digits." : null}
                    />
                    <Input
                        label="Business Email"
                        value={businessEmail}
                        onChangeText={(t) => setBusinessEmail(clampText(t, 80))}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        maxLength={80}
                        errorText={businessEmail.trim().length > 0 && !isValidEmail(businessEmail) ? "Enter a valid email." : null}
                    />
                    <Input
                        label="Business HST Number"
                        value={businessHSTNumber}
                        onChangeText={(t) => setBusinessHSTNumber(clampText(t, 30))}
                        maxLength={30}
                    />
                    <Input
                        label="GST %"
                        value={gstPercent}
                        onChangeText={(t) => setGstPercent(clampDigits(t, 3))}
                        keyboardType="number-pad"
                        maxLength={3}
                        errorText={gstDigits.trim().length > 0 && Number(gstDigits) > 100 ? "GST % must be 0–100." : null}
                    />
                    <PerDayOpenHoursEditor schedule={businessDaySchedule} onChange={setBusinessDaySchedule} />

                    <View style={styles.servicesSection}>
                        <Text style={styles.servicesSectionTitle}>Services you offer</Text>
                        <Text style={styles.servicesSectionDesc}>Select every category your shop can provide.</Text>
                        {serviceCatalogLoading && serviceCatalog.length === 0 ? (
                            <View style={styles.servicesLoading}>
                                <ActivityIndicator size="small" color={colors.primary} />
                                <Text style={styles.servicesLoadingText}>Loading services…</Text>
                            </View>
                        ) : serviceCatalog.length === 0 ? (
                            <Text style={styles.servicesEmpty}>No services available right now. You can complete your profile and add services later.</Text>
                        ) : (
                            <View style={styles.serviceRows}>
                                {serviceCatalog.map((c) => {
                                    const id = c.id?.trim() ?? "";
                                    if (!id) {
                                        return null;
                                    }
                                    const selected = selectedServiceIds.includes(id);
                                    return (
                                        <SurfaceCard key={id} shadow="soft" style={styles.serviceRow}>
                                            <View style={styles.serviceRowLeft}>
                                                <View style={styles.serviceRowIcon}>
                                                    <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
                                                </View>
                                                <View style={styles.serviceRowText}>
                                                    <Text style={styles.serviceRowTitle} numberOfLines={2}>
                                                        {c.name}
                                                    </Text>
                                                    {c.desc?.trim() ? (
                                                        <Text style={styles.serviceRowSub} numberOfLines={2}>
                                                            {c.desc}
                                                        </Text>
                                                    ) : null}
                                                </View>
                                            </View>
                                            <Switch
                                                value={selected}
                                                onValueChange={(next) => onToggleService?.(id, next)}
                                                trackColor={{ false: colors.border, true: colors.primaryMutedBg }}
                                                thumbColor={selected ? colors.primary : colors.textMuted}
                                                ios_backgroundColor={colors.border}
                                            />
                                        </SurfaceCard>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    <LogoPickerField
                        logoUri={businessLogoUri}
                        onPick={handlePickBusinessLogo}
                        onRemove={() => {
                            setBusinessLogoUri("");
                            setBusinessLogoMime(null);
                            setBusinessLogoFileName(null);
                        }}
                    />

                    <Pressable
                        style={[styles.submitBtn, (!canSubmit || submitting) && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={!canSubmit || submitting}
                    >
                        <Text style={styles.submitLabel}>{submitting ? "Submitting..." : "Complete Business Profile"}</Text>
                    </Pressable>
                </SurfaceCard>
            </View>

            <ShopOwnerCityPickerModal
                visible={cityPickerOpen}
                onClose={() => setCityPickerOpen(false)}
                authToken={token}
                selectedId={selectedCity?.id ?? null}
                onSelect={(city) => setSelectedCity(city)}
            />
        </StackScreenFrame>
    );
}

type InputProps = {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    multiline?: boolean;
    maxLength?: number;
    errorText?: string | null;
};

function Input({
    label,
    value,
    onChangeText,
    keyboardType = "default",
    autoCapitalize = "sentences",
    multiline = false,
    maxLength,
    errorText,
}: InputProps) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                style={[styles.input, multiline && styles.inputMultiline]}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                multiline={multiline}
                maxLength={maxLength}
            />
            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
        </View>
    );
}

function SelectField({
    label,
    value,
    placeholder,
    onPress,
}: {
    label: string;
    value: string;
    placeholder?: string;
    onPress: () => void;
}) {
    const showPlaceholder = !value.trim();
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <Pressable style={({ pressed }) => [styles.selectRow, pressed && styles.selectRowPressed]} onPress={onPress}>
                <Text style={[styles.selectText, showPlaceholder && styles.selectPlaceholder]} numberOfLines={1}>
                    {value.trim() || placeholder || "Select…"}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        paddingBottom: spacing.xxl,
    },
    content: {
        padding: spacing.screenHorizontal,
        paddingTop: spacing.sm,
    },
    card: {
        padding: spacing.lg,
        borderRadius: radii.xxl,
        gap: spacing.sm,
    },
    header: {
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    title: {
        ...typography.cardTitle,
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
    },
    desc: {
        ...typography.bodyMuted,
        textAlign: "center",
    },
    field: {
        marginBottom: spacing.sm,
    },
    label: {
        fontSize: fontSizes.sm,
        fontWeight: "700",
        color: colors.textMuted,
        marginBottom: spacing.xs,
    },
    errorText: { marginTop: 4, color: colors.danger, fontSize: fontSizes.xs, fontWeight: "700" },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.lg,
        minHeight: 44,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.bgProfile,
        color: colors.text,
        fontSize: fontSizes.md,
    },
    inputMultiline: {
        minHeight: 72,
        textAlignVertical: "top",
    },
    selectRow: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.lg,
        minHeight: 44,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.bgProfile,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.sm,
    },
    selectRowPressed: { opacity: 0.85 },
    selectText: {
        flex: 1,
        color: colors.text,
        fontSize: fontSizes.md,
        fontWeight: "700",
    },
    selectPlaceholder: { color: colors.textLight },
    openDaysPreview: {
        marginTop: -spacing.xs,
        marginBottom: spacing.sm,
        color: colors.textMuted,
        fontSize: fontSizes.xs,
    },
    servicesSection: {
        marginTop: spacing.sm,
        gap: spacing.xs,
    },
    servicesSectionTitle: {
        fontSize: fontSizes.md,
        fontWeight: "900",
        color: colors.text,
    },
    servicesSectionDesc: {
        ...typography.bodyMuted,
        marginBottom: spacing.xs,
    },
    servicesLoading: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingVertical: spacing.sm,
    },
    servicesLoadingText: {
        fontSize: fontSizes.sm,
        fontWeight: "600",
        color: colors.textMuted,
    },
    servicesEmpty: {
        fontSize: fontSizes.sm,
        fontWeight: "600",
        color: colors.textMuted,
        paddingVertical: spacing.xs,
    },
    serviceRows: { gap: spacing.sm },
    serviceRow: {
        borderRadius: radii.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
    },
    serviceRowLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1, minWidth: 0 },
    serviceRowIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primaryMutedBg,
        alignItems: "center",
        justifyContent: "center",
    },
    serviceRowText: { flex: 1, minWidth: 0 },
    serviceRowTitle: { fontSize: fontSizes.md, fontWeight: "800", color: colors.text },
    serviceRowSub: { fontSize: fontSizes.xs, fontWeight: "700", color: colors.textMuted, marginTop: 2 },
    submitBtn: {
        marginTop: spacing.sm,
        backgroundColor: colors.primary,
        minHeight: 48,
        borderRadius: radii.round,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.lg,
    },
    submitBtnDisabled: {
        opacity: 0.5,
    },
    submitLabel: {
        color: colors.white,
        fontSize: fontSizes.lg,
        fontWeight: "700",
    },
    section: { marginTop: spacing.sm, gap: spacing.xs },
    sectionTitle: { fontSize: fontSizes.md, fontWeight: "900", color: colors.text },
    sectionDesc: { ...typography.bodyMuted },
    sectionMuted: { color: colors.textMuted, fontSize: fontSizes.sm, fontWeight: "600" },
    companyList: { marginTop: spacing.xs, gap: spacing.xs },
    companyRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: radii.lg,
        backgroundColor: colors.bgProfile,
        borderWidth: 1,
        borderColor: colors.border,
    },
    companyRowPressed: { opacity: 0.85 },
    companyRowDisabled: { opacity: 0.55 },
    companyName: { fontSize: fontSizes.md, fontWeight: "800", color: colors.text },
    gpsBtn: {
        marginTop: -spacing.xs,
        marginBottom: spacing.sm,
        backgroundColor: colors.primary,
        minHeight: 44,
        borderRadius: radii.round,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: spacing.xs + 2,
        paddingHorizontal: spacing.lg,
    },
    gpsBtnPressed: { opacity: 0.85 },
    gpsBtnDisabled: { opacity: 0.6 },
    gpsBtnText: { color: colors.white, fontSize: fontSizes.md, fontWeight: "800" },
    headerLogoutBtn: {
        width: 40,
        padding: spacing.xs,
        alignItems: "center",
        justifyContent: "center",
    },
    headerLogoutBtnPressed: { opacity: 0.7 },
});