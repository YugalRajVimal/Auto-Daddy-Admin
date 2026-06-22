import { AddVehicleField, AddVehicleSelectField } from "@/components/car-owner/my-vehicles/add-vehicle-form-fields";
import { addVehicleFormStyles as fieldStyles } from "@/components/car-owner/my-vehicles/add-vehicle-form-styles";
import { isValidYear } from "@/components/car-owner/my-vehicles/add-vehicle-helpers";
import { ModalKeyboardRoot } from "@/components/reusables";
import { colors } from "@/constants/autodaddy";
import type { useCarCompanyCatalog } from "@/hooks/use-car-company-catalog";
import type { OnboardVehicle } from "@/types/auto-shop-owner-endpoints";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Catalog = ReturnType<typeof useCarCompanyCatalog>;

type Props = {
  vehicle: OnboardVehicle;
  onChange: (patch: Partial<OnboardVehicle>) => void;
  catalog: Catalog;
  readOnly?: boolean;
  attemptedSave?: boolean;
};

export function CustomerVehicleFields({ vehicle, onChange, catalog, readOnly = false, attemptedSave = false }: Props) {
  const [picker, setPicker] = useState<null | "company" | "model" | "year">(null);
  const companyName = vehicle.vehicleName?.trim() ?? "";
  const modelName = vehicle.model?.trim() ?? "";
  const yearValue = vehicle.year?.trim() ?? "";

  const modelOptions = useMemo(() => catalog.modelOptionsFor(companyName), [catalog, companyName]);
  const yearOptions = useMemo(() => catalog.yearOptionsFor(companyName, modelName), [catalog, companyName, modelName]);

  const pickerItems =
    picker === "company"
      ? catalog.companies.map((c) => c.companyName).filter(Boolean)
      : picker === "model"
        ? modelOptions.map((m) => m.modelName).filter(Boolean)
        : yearOptions;

  return (
    <>
      <AddVehicleField
        label="License Plate No *"
        placeholder="e.g. UH12AB1234"
        value={vehicle.licensePlateNo}
        onChangeText={(t) => onChange({ licensePlateNo: t.slice(0, 14) })}
        icon="id-card-outline"
        autoCapitalize="characters"
        maxLength={14}
        errorText={attemptedSave && !vehicle.licensePlateNo.trim() ? "License plate is required." : null}
      />
      <AddVehicleField
        label="VIN Number"
        placeholder="17-character VIN"
        value={vehicle.vinNo ?? ""}
        onChangeText={(t) => onChange({ vinNo: t.slice(0, 17) })}
        icon="barcode-outline"
        autoCapitalize="characters"
        maxLength={17}
        errorText={
          vehicle.vinNo?.trim() && vehicle.vinNo.trim().length !== 17 ? "VIN must be exactly 17 characters." : null
        }
      />
      <View style={fieldStyles.twoCols}>
        <View style={fieldStyles.col}>
          <AddVehicleSelectField
            label="Company *"
            placeholder={catalog.loading ? "Loading..." : "Select company"}
            value={companyName}
            onPress={() => setPicker("company")}
            icon="business-outline"
            disabled={readOnly || catalog.loading || catalog.companies.length === 0}
            errorText={attemptedSave && !companyName ? "Company is required." : null}
          />
        </View>
        <View style={fieldStyles.col}>
          <AddVehicleSelectField
            label="Model *"
            placeholder={!companyName ? "Select company first" : "Select model"}
            value={modelName}
            onPress={() => setPicker("model")}
            icon="car-sport-outline"
            disabled={readOnly || !companyName || modelOptions.length === 0}
            errorText={attemptedSave && !modelName ? "Model is required." : null}
          />
        </View>
      </View>
      <View style={fieldStyles.twoCols}>
        <View style={fieldStyles.col}>
          <AddVehicleSelectField
            label="Year *"
            placeholder={!modelName ? "Select model first" : "Select year"}
            value={yearValue}
            onPress={() => setPicker("year")}
            icon="calendar-outline"
            disabled={readOnly || !modelName || yearOptions.length === 0}
            errorText={
              attemptedSave && !yearValue
                ? "Year is required."
                : yearValue && !isValidYear(yearValue)
                  ? "Enter a valid year."
                  : null
            }
          />
        </View>
        <View style={fieldStyles.col}>
          <AddVehicleField
            label="Odometer (km)"
            placeholder="e.g. 45000"
            value={vehicle.odometerReading ?? ""}
            onChangeText={(t) => onChange({ odometerReading: t.replace(/\D/g, "") })}
            icon="speedometer-outline"
            keyboardType="number-pad"
          />
        </View>
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
              data={pickerItems}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={pickerStyles.listContent}
              renderItem={({ item }) => {
                const selected =
                  picker === "company"
                    ? item === companyName
                    : picker === "model"
                      ? item === modelName
                      : item === yearValue;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      pickerStyles.row,
                      pressed ? pickerStyles.rowPressed : null,
                      selected ? pickerStyles.rowSelected : null,
                    ]}
                    onPress={() => {
                      if (picker === "company") {
                        onChange({ vehicleName: item, model: "", year: "" });
                      } else if (picker === "model") {
                        onChange({ model: item, year: "" });
                      } else {
                        onChange({ year: item });
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
    </>
  );
}

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
  rowSelected: {
    backgroundColor: colors.successMuted,
    marginHorizontal: -4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  rowText: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.text },
  rowTextSelected: { color: colors.successDark },
  empty: { paddingVertical: 22, alignItems: "center", gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: "900", color: colors.text },
  emptySub: { fontSize: 13, fontWeight: "700", color: colors.textMuted, textAlign: "center" },
});
