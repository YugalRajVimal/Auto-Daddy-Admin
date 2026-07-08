import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";
import {
  AddVehicleExistingImageTile,
  AddVehicleField,
  AddVehicleImageButton,
  AddVehicleSelectField,
} from "@/components/car-owner/my-vehicles/add-vehicle-form-fields";
import { addVehicleFormStyles as styles } from "@/components/car-owner/my-vehicles/add-vehicle-form-styles";
import {
  type ApiEnvelope,
  buildAddVehicleFormData,
  buildVehicleImageFormData,
  type EditableVehicle,
  existingImageItems,
  extractEditableVehicleList,
  isValidYear,
  type PickedImage,
  parseVehicleParam,
  textValue,
  trimMessage,
  type UserVehiclesEditableResponse,
} from "@/components/car-owner/my-vehicles/add-vehicle-helpers";
import { LoadingProgress, ModalKeyboardRoot, useToast } from "@/components/reusables";
import { colors, shadows, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { getJson, postFormData, putFormData, putJson } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";

type CarCompanyApiModel = {
  modelName: string;
  years: Array<string | number>;
};

type CarCompanyApiItem = {
  _id: string;
  companyName: string;
  models: CarCompanyApiModel[];
};

type CarCompaniesResponse = {
  data?: CarCompanyApiItem[];
  message?: string;
  success?: boolean;
};

export default function AddVehicle() {
  const params = useLocalSearchParams<{ mode?: string; vehicleId?: string; vehicle?: string }>();
  const vehicleFromParams = parseVehicleParam(typeof params.vehicle === "string" ? params.vehicle : undefined);
  const editId = typeof params.vehicleId === "string" && params.vehicleId.trim() ? params.vehicleId.trim() : vehicleFromParams?.id;
  const isEditMode = params.mode === "edit" && Boolean(editId);
  const { token } = useAuth();
  const { showToast } = useToast();
  const [loadedVehicle, setLoadedVehicle] = useState<EditableVehicle | null>(vehicleFromParams);
  const [licensePlateNo, setLicensePlateNo] = useState(textValue(vehicleFromParams?.licensePlateNo));
  const [vinNo, setVinNo] = useState(textValue(vehicleFromParams?.vinNo));
  const [name, setName] = useState(textValue(vehicleFromParams?.make?.name));
  const [model, setModel] = useState(textValue(vehicleFromParams?.make?.model));
  const [year, setYear] = useState(textValue(vehicleFromParams?.year));
  const [odometerReading, setOdometerReading] = useState(textValue(vehicleFromParams?.odometerReading));
  const [dueOdometerReading, setDueOdometerReading] = useState(textValue(vehicleFromParams?.dueOdometerReading));
  const [vehicleImage, setVehicleImage] = useState<PickedImage | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [companyOptions, setCompanyOptions] = useState<CarCompanyApiItem[]>([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [vehicleHydrating, setVehicleHydrating] = useState(false);
  const [picker, setPicker] = useState<null | "company" | "model" | "year">(null);
  const needsRemoteVehicle = isEditMode && Boolean(editId) && !vehicleFromParams;

  function applyVehicle(vehicle: EditableVehicle) {
    setLoadedVehicle(vehicle);
    setLicensePlateNo(textValue(vehicle.licensePlateNo));
    setVinNo(textValue(vehicle.vinNo));
    setName(textValue(vehicle.make?.name));
    setModel(textValue(vehicle.make?.model));
    setYear(textValue(vehicle.year));
    setOdometerReading(textValue(vehicle.odometerReading));
    setDueOdometerReading(textValue(vehicle.dueOdometerReading));
  }

  const resetAddVehicleForm = useCallback(() => {
    setLoadedVehicle(null);
    setLicensePlateNo("");
    setVinNo("");
    setName("");
    setModel("");
    setYear("");
    setOdometerReading("");
    setDueOdometerReading("");
    setVehicleImage(null);
    setAttemptedSave(false);
    setPicker(null);
  }, []);

  const existingImages = useMemo(() => existingImageItems(loadedVehicle), [loadedVehicle]);

  const uploadVehicleImage = useCallback(
    async (image: PickedImage, vehicleId: string): Promise<boolean> => {
      if (!token) {
        showToast("Please login again.", { type: "error" });
        return false;
      }
      setUploadingImage(true);
      try {
        const body = buildVehicleImageFormData(image);
        const res = await putFormData<ApiEnvelope>(`/api/user/vehicle/${vehicleId}`, body, { authToken: token });
        const message = trimMessage(res.data);
        if (!res.ok) {
          showToast(message || "Could not upload vehicle photo.", { type: "error" });
          return false;
        }
        showToast(message || "Vehicle photo updated.", { type: "success" });
        return true;
      } catch {
        showToast("Network error while uploading photo.", { type: "error" });
        return false;
      } finally {
        setUploadingImage(false);
      }
    },
    [showToast, token]
  );

  const pickVehicleImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast("Photo library permission is required.", { type: "error" });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsMultipleSelection: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset?.uri) return;
    const picked: PickedImage = { uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName };
    if (isEditMode && editId) {
      const ok = await uploadVehicleImage(picked, editId);
      if (ok) {
        setVehicleImage(null);
        const res = await getJson<UserVehiclesEditableResponse>("/api/user/vehicles", { authToken: token! });
        if (res.ok) {
          const found = extractEditableVehicleList(res.data).find((vehicle) => vehicle.id === editId);
          if (found) applyVehicle(found);
        }
      }
      return;
    }
    setVehicleImage(picked);
  }, [editId, isEditMode, token, uploadVehicleImage]);

  useFocusEffect(
    useCallback(() => {
      if (!isEditMode) {
        resetAddVehicleForm();
      }
      return undefined;
    }, [isEditMode, resetAddVehicleForm])
  );

  useEffect(() => {
    if (isEditMode && vehicleFromParams) {
      applyVehicle(vehicleFromParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, params.vehicle]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const authToken = token;
    async function loadCompanies() {
      setCompanyLoading(true);
      try {
        const res = await getJson<CarCompaniesResponse>("/api/user/car-companies", { authToken });
        if (cancelled) return;
        if (!res.ok) {
          showToast("Could not load vehicle companies.", { type: "error" });
          return;
        }
        const next = Array.isArray(res.data?.data) ? res.data?.data ?? [] : [];
        setCompanyOptions(next);
      } catch {
        if (!cancelled) showToast("Network error while loading companies.", { type: "error" });
      } finally {
        if (!cancelled) setCompanyLoading(false);
      }
    }
    void loadCompanies();
    return () => {
      cancelled = true;
    };
  }, [showToast, token]);

  useEffect(() => {
    if (!needsRemoteVehicle || !editId || loadedVehicle || !token) {
      setVehicleHydrating(false);
      return;
    }
    let cancelled = false;
    const authToken = token;
    setVehicleHydrating(true);
    async function loadVehicleForEdit() {
      try {
        const res = await getJson<UserVehiclesEditableResponse>("/api/user/vehicles", { authToken });
        if (!res.ok || cancelled) return;
        const found = extractEditableVehicleList(res.data).find((vehicle) => vehicle.id === editId);
        if (found && !cancelled) {
          applyVehicle(found);
        }
      } finally {
        if (!cancelled) {
          setVehicleHydrating(false);
        }
      }
    }
    void loadVehicleForEdit();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, needsRemoteVehicle, loadedVehicle, token]);

  const selectedCompany = useMemo(() => {
    const n = name.trim();
    if (!n) return null;
    return companyOptions.find((c) => (c.companyName ?? "").trim() === n) ?? null;
  }, [companyOptions, name]);

  const modelOptions = useMemo(() => {
    return selectedCompany?.models ?? [];
  }, [selectedCompany]);

  const selectedModel = useMemo(() => {
    const m = model.trim();
    if (!m) return null;
    return modelOptions.find((x) => (x.modelName ?? "").trim() === m) ?? null;
  }, [model, modelOptions]);

  const yearOptions = useMemo(() => {
    const ys = selectedModel?.years ?? [];
    const out: string[] = [];
    for (const v of ys) {
      const s = String(v ?? "").trim();
      if (s) out.push(s);
    }
    return Array.from(new Set(out)).sort((a, b) => Number(b) - Number(a));
  }, [selectedModel]);

  function goBackToVehicles() {
    router.replace("/(car-owner)/my-vehicles" as never);
  }

  async function submit() {
    setAttemptedSave(true);
    if (!token) {
      showToast("Please login again.", { type: "error" });
      return;
    }
    const nextPlate = licensePlateNo.trim().toUpperCase();
    const nextVin = vinNo.trim().toUpperCase();
    const nextName = name.trim();
    const nextModel = model.trim();
    const nextYear = year.trim();
    const nextOdometer = odometerReading.trim();
    const nextDueOdometer = dueOdometerReading.trim();

    if (!nextPlate || !nextName || !nextModel || !nextYear) {
      showToast("Plate, vehicle name, model, and year are required.", { type: "error" });
      return;
    }
    if (nextVin && nextVin.length !== 17) {
      showToast("VIN number must be exactly 17 characters.", { type: "error" });
      return;
    }
    if (!isValidYear(nextYear)) {
      showToast("Enter a valid vehicle year.", { type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode && editId) {
        const body: Record<string, unknown> = {
          licensePlateNo: nextPlate,
          vinNo: nextVin,
          name: nextName,
          model: nextModel,
          year: nextYear,
          odometerReading: nextOdometer,
          dueOdometerReading: nextDueOdometer,
        };
        const res = await putJson<ApiEnvelope>(`/api/user/vehicle/${editId}`, body, { authToken: token });
        const message = trimMessage(res.data);
        if (!res.ok) {
          showToast(message || "Could not update vehicle.", { type: "error" });
          return;
        }
        showToast(message || "Vehicle updated.", { type: "success" });
        goBackToVehicles();
        return;
      }

      const body = buildAddVehicleFormData({
        licensePlateNo: nextPlate,
        vinNo: nextVin,
        name: nextName,
        model: nextModel,
        year: nextYear,
        odometerReading: nextOdometer,
        dueOdometerReading: nextDueOdometer,
        vehicleImage,
      });
      const res = await postFormData<ApiEnvelope>("/api/user/vehicle", body, { authToken: token });
      const message = trimMessage(res.data);
      if (!res.ok) {
        showToast(message || "Could not add vehicle.", { type: "error" });
        return;
      }
      showToast(message || "Vehicle added.", { type: "success" });
      goBackToVehicles();
    } catch {
      showToast("Network error while adding vehicle.", { type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CarOwnerStackScreenFrame title={isEditMode ? "Edit Vehicle" : "Add Vehicle"} backTo="/(car-owner)/my-vehicles" onBack={goBackToVehicles}>
      <View style={styles.content}>
        {vehicleHydrating ? (
          <View style={hydrateStyles.wrap}>
            <LoadingProgress />
          </View>
        ) : (
        <>
        {/* <View style={[styles.heroCard, shadows.soft]}>
          <View style={styles.heroIcon}>
            <Ionicons name="car-sport-outline" size={22} color={colors.successDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{isEditMode ? "Edit vehicle details" : "Vehicle details"}</Text>
            <Text style={styles.heroSub}>
              {isEditMode
                ? "Update the vehicle information used for bookings and service history."
                : "Add the vehicle you want to use for bookings and service history."}
            </Text>
          </View>
        </View> */}

        <View style={[styles.card, shadows.soft]}>
          <AddVehicleField
            label="License Plate No *"
            placeholder="e.g. UK12VD2323"
            value={licensePlateNo}
            onChangeText={(text) => setLicensePlateNo(text.slice(0, 14))}
            icon="id-card-outline"
            autoCapitalize="characters"
            maxLength={14}
            errorText={attemptedSave && !licensePlateNo.trim() ? "License plate is required." : null}
          />
          <AddVehicleField
            label="VIN Number"
            placeholder="17-character VIN"
            value={vinNo}
            onChangeText={(text) => setVinNo(text.slice(0, 17))}
            icon="barcode-outline"
            autoCapitalize="characters"
            maxLength={17}
            errorText={vinNo.trim() && vinNo.trim().length !== 17 ? "VIN must be exactly 17 characters." : null}
          />
          <AddVehicleSelectField
            label="Make *"
            placeholder={companyLoading ? "Loading..." : "Select company"}
            value={name}
            onPress={() => setPicker("company")}
            icon="business-outline"
            disabled={companyLoading || companyOptions.length === 0}
            errorText={attemptedSave && !name.trim() ? "Company is required." : null}
          />
          <AddVehicleSelectField
            label="Model *"
            placeholder={!name.trim() ? "Select company first" : "Select model"}
            value={model}
            onPress={() => setPicker("model")}
            icon="car-sport-outline"
            disabled={!name.trim() || modelOptions.length === 0}
            errorText={attemptedSave && !model.trim() ? "Model is required." : null}
          />
          <AddVehicleSelectField
            label="Year *"
            placeholder={!model.trim() ? "Select model first" : "Select year"}
            value={year}
            onPress={() => setPicker("year")}
            icon="calendar-outline"
            disabled={!model.trim() || yearOptions.length === 0}
            errorText={
              attemptedSave && !year.trim()
                ? "Year is required."
                : year.trim() && !isValidYear(year.trim())
                  ? "Enter a valid year."
                  : null
            }
          />
          <AddVehicleField
            label="Odometer (km)"
            placeholder="e.g. 45000"
            value={odometerReading}
            onChangeText={(text) => setOdometerReading(text.replace(/\D/g, ""))}
            icon="speedometer-outline"
            keyboardType="number-pad"
          />
          <AddVehicleField
            label="Next due service (km)"
            placeholder="e.g. 50000"
            value={dueOdometerReading}
            onChangeText={(text) => setDueOdometerReading(text.replace(/\D/g, ""))}
            icon="construct-outline"
            keyboardType="number-pad"
          />
        </View>

        <View style={[styles.card, shadows.soft]}>
          <Text style={styles.sectionTitle}>{isEditMode ? "Vehicle photo" : "Vehicle photo"}</Text>
          {isEditMode && existingImages.length > 0 ? (
            <View style={styles.existingImagesGrid}>
              {existingImages.map((item) => (
                <AddVehicleExistingImageTile key={`${item.label}-${item.uri}`} label={item.label} uri={item.uri} />
              ))}
            </View>
          ) : isEditMode ? (
            <Text style={styles.editPhotoHint}>No vehicle photo yet. Pick one below to upload.</Text>
          ) : null}
          <AddVehicleImageButton
            title={isEditMode ? "Change vehicle photo" : "Vehicle image"}
            image={vehicleImage}
            onPress={() => void pickVehicleImage()}
            onRemove={() => setVehicleImage(null)}
            disabled={uploadingImage || submitting}
          />
          {isEditMode && uploadingImage ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color={colors.successDark} />
              <Text style={styles.editPhotoHint}>Uploading photo…</Text>
            </View>
          ) : null}
        </View>

        <Pressable
          style={[styles.saveBtn, (submitting || uploadingImage) && styles.saveBtnDisabled]}
          disabled={submitting || uploadingImage}
          onPress={() => void submit()}
        >
          {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>{isEditMode ? "Update Vehicle" : "Add Vehicle"}</Text>}
        </Pressable>
        </>
        )}
      </View>

      <Modal transparent visible={picker != null} animationType="slide" onRequestClose={() => setPicker(null)}>
        <ModalKeyboardRoot onBackdropPress={() => setPicker(null)} scrimColor="rgba(0,0,0,0.42)">
          <View style={pickerStyles.sheet}>
            <View style={pickerStyles.headerRow}>
              <Text style={pickerStyles.title}>
                {picker === "company" ? "Select company" : picker === "model" ? "Select model" : "Select year"}
              </Text>
              <Pressable onPress={() => setPicker(null)} hitSlop={10} accessibilityLabel="Close picker">
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <FlatList
              data={
                picker === "company"
                  ? companyOptions.map((c) => c.companyName).filter(Boolean)
                  : picker === "model"
                    ? modelOptions.map((m) => m.modelName).filter(Boolean)
                    : yearOptions
              }
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={pickerStyles.listContent}
              renderItem={({ item }) => {
                const selected = picker === "company" ? item === name.trim() : picker === "model" ? item === model.trim() : item === year.trim();
                return (
                  <Pressable
                    style={({ pressed }) => [
                      pickerStyles.row,
                      pressed ? pickerStyles.rowPressed : null,
                      selected ? pickerStyles.rowSelected : null,
                    ]}
                    onPress={() => {
                      if (picker === "company") {
                        setName(item);
                        setModel("");
                        setYear("");
                      } else if (picker === "model") {
                        setModel(item);
                        setYear("");
                      } else {
                        setYear(item);
                      }
                      setPicker(null);
                    }}
                  >
                    <Text style={[pickerStyles.rowText, selected ? pickerStyles.rowTextSelected : null]} numberOfLines={2}>
                      {item}
                    </Text>
                    {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.successDark} /> : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={pickerStyles.empty}>
                  <Text style={pickerStyles.emptyTitle}>No options</Text>
                  <Text style={pickerStyles.emptySub}>Try selecting the previous field first.</Text>
                </View>
              }
            />
          </View>
        </ModalKeyboardRoot>
      </Modal>
    </CarOwnerStackScreenFrame>
  );
}

const hydrateStyles = StyleSheet.create({
  wrap: { paddingVertical: spacing.xxl * 2, alignItems: "center" },
});

const pickerStyles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    maxHeight: "80%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  title: { fontSize: 18, fontWeight: "900", color: colors.text },
  listContent: { paddingBottom: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
  },
  rowPressed: { opacity: 0.85 },
  rowSelected: { backgroundColor: colors.successMuted, marginHorizontal: -4, paddingHorizontal: 8, borderRadius: 12 },
  rowText: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.text },
  rowTextSelected: { color: colors.successDark },
  empty: { paddingVertical: 22, alignItems: "center", gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: "900", color: colors.text },
  emptySub: { fontSize: 13, fontWeight: "700", color: colors.textMuted, textAlign: "center" },
});
