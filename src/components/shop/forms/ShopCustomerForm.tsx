import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AttachImageCheckbox from "../../admin/AttachImageCheckbox";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
} from "../../admin/ContentPanel";
import { shopCompactInputClass } from "../shopLayoutStyles";
import OwnerCityPicker from "../../owner/OwnerCityPicker";
import { getJson } from "../../../api/mobileAuth";
import { useAuth } from "../../../auth";
import { formatPhoneDisplay, phoneDigits } from "../../../lib/phoneFormat";
import { FormFieldError, fieldErrorClass, toastValidationSummary } from "../../../lib/validation/formUi";
import {
  shopCustomerSchema,
  type ShopCustomerFormInput,
  type ShopCustomerValues,
} from "../../../lib/validation/schemas/identity";
import {
  addCarOwnerToMyCustomers,
  apiMessage,
  onboardCarOwner,
  type CustomerVehiclePayload,
  updateMyCustomer,
} from "../../../lib/shopOwnerMutations";
import type { MyCustomer } from "../../../types/shopOwner";
import { ShopFormPage, shopCancelButtonClass } from "./ShopFormPage";

type CarCompanyCatalogItem = {
  companyName: string;
  models: Array<{ modelName: string; years: Array<string | number> }>;
};

type VehicleUiExtra = { vehicleImage?: File | null; attachVehiclePhoto?: boolean };

function emptyVehicle(): ShopCustomerFormInput["vehicles"][number] {
  return {
    licensePlateNo: "",
    vinNo: "",
    vehicleName: "",
    model: "",
    year: "",
    odometerReading: "",
    isNew: true,
  };
}

type ShopCustomerFormProps = {
  mode: "add" | "edit";
  customer?: MyCustomer | null;
  backTo?: string;
};

export default function ShopCustomerForm({
  mode,
  customer,
  backTo = "/shop/people",
}: ShopCustomerFormProps) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const countryCode = "+1";

  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [attachProfilePhoto, setAttachProfilePhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [vehicleUiExtras, setVehicleUiExtras] = useState<Record<number, VehicleUiExtra>>({});
  const [companies, setCompanies] = useState<CarCompanyCatalogItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ShopCustomerFormInput, unknown, ShopCustomerValues>({
    resolver: zodResolver(shopCustomerSchema),
    mode: "onSubmit",
    defaultValues: {
      name: customer?.name ?? "",
      email: customer?.email ?? "",
      phone: phoneDigits(customer?.phone ?? ""),
      pincode: customer?.pincode ?? "",
      address: customer?.address ?? "",
      city: customer?.city ?? "",
      vehicles: customer?.vehicles?.length
        ? customer.vehicles.map((v) => ({
            vId: v.vId ?? v._id,
            licensePlateNo: v.licensePlateNo ?? "",
            vinNo: v.vinNo ?? "",
            vehicleName: v.vehicleName ?? "",
            model: v.model ?? "",
            year: v.year ?? "",
            odometerReading: v.odometerReading ?? "",
          }))
        : [emptyVehicle()],
    },
  });

  const { fields: vehicleFields, append: appendVehicle } = useFieldArray({
    control,
    name: "vehicles",
  });

  useEffect(() => {
    if (!token) return;
    void getJson<{ data?: CarCompanyCatalogItem[] }>("/api/user/car-companies", token).then((res) => {
      if (res.ok && Array.isArray(res.data?.data)) setCompanies(res.data.data);
    });
  }, [token]);

  const patchVehicleExtra = (index: number, patch: Partial<VehicleUiExtra>) => {
    setVehicleUiExtras((prev) => ({ ...prev, [index]: { ...prev[index], ...patch } }));
  };

  const modelOptions = (vehicleName: string) => {
    const company = companies.find((c) => c.companyName === vehicleName);
    return company?.models ?? [];
  };

  const yearOptions = (vehicleName: string, model: string) => {
    const m = modelOptions(vehicleName).find((x) => x.modelName === model);
    return (m?.years ?? []).map(String);
  };

  const phone = watch("phone");
  const city = watch("city");

  const onValid = async (values: ShopCustomerValues) => {
    if (!token) return;
    setSubmitting(true);
    try {
      const vehiclePayloads: CustomerVehiclePayload[] = values.vehicles.map((v) => ({
        ...(v.vId && !v.isNew ? { vId: v.vId } : {}),
        licensePlateNo: v.licensePlateNo.trim().slice(0, 14),
        vinNo: v.vinNo?.trim() || undefined,
        vehicleName: v.vehicleName.trim(),
        model: v.model.trim(),
        year: v.year.trim(),
        odometerReading: v.odometerReading?.trim() || undefined,
      }));

      const uploads = {
        profilePhoto: attachProfilePhoto ? profilePhoto : null,
        vehicleImages: values.vehicles.map((_, index) =>
          vehicleUiExtras[index]?.attachVehiclePhoto ? vehicleUiExtras[index]?.vehicleImage ?? null : null,
        ),
      };

      if (mode === "add") {
        const res = await onboardCarOwner(
          token,
          {
            name: values.name.trim(),
            email: values.email.trim(),
            countryCode,
            phone: values.phone,
            pincode: values.pincode.trim(),
            address: values.address.trim(),
            city: values.city.trim(),
            role: "carowner",
            vehicles: vehiclePayloads,
          },
          uploads
        );
        if (!res.ok) {
          toast.error(apiMessage(res.data) || "Could not create customer.");
          return;
        }
        const data = res.data as { data?: { carOwnerId?: string; _id?: string } } | null;
        const carOwnerId =
          (data as { carOwnerId?: string })?.carOwnerId ??
          data?.data?.carOwnerId ??
          (data as { _id?: string })?._id;
        if (carOwnerId) {
          await addCarOwnerToMyCustomers(token, carOwnerId);
        }
        toast.success(apiMessage(res.data) || "Customer created.");
      } else {
        const carOwnerId = customer?.carOwnerId ?? customer?.id ?? customer?._id;
        if (!carOwnerId) {
          toast.error("Missing customer id.");
          return;
        }
        const res = await updateMyCustomer(
          token,
          {
            carOwnerId,
            name: values.name.trim(),
            email: values.email.trim(),
            countryCode,
            phone: values.phone,
            pincode: values.pincode.trim(),
            address: values.address.trim(),
            city: values.city.trim(),
            vehicles: vehiclePayloads,
          },
          uploads
        );
        if (!res.ok) {
          toast.error(apiMessage(res.data) || "Could not update customer.");
          return;
        }
        toast.success(apiMessage(res.data) || "Customer updated.");
      }
      navigate(backTo);
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalid = (formErrors: typeof errors) => {
    toastValidationSummary(toast.error, formErrors);
  };

  const nameField = register("name");
  const phoneField = register("phone");

  const title = mode === "add" ? "Add Customer" : "Edit Customer";
  const vehicleErrors = errors.vehicles;

  return (
    <ShopFormPage title={title} metaTitle={`${title} | AutoDaddy`} backTo={backTo}>
      <CompactFormPanel
        focusOnMount
        footer={
          <CompactFormFooter
            actionLabel={
              submitting
                ? mode === "edit"
                  ? "Updating…"
                  : "Saving…"
                : mode === "edit"
                  ? "Update"
                  : "Save"
            }
            onSave={() => void handleSubmit(onValid, onInvalid)()}
            onCancel={() => navigate(backTo)}
          />
        }
      >
        <CompactFormRow>
          <CompactField label="Full Name" required>
            <input
              className={fieldErrorClass(!!errors.name, shopCompactInputClass)}
              {...nameField}
              maxLength={20}
            />
            <FormFieldError message={errors.name?.message} />
          </CompactField>
          <CompactField label="Email" required>
            <input
              className={fieldErrorClass(!!errors.email, shopCompactInputClass)}
              type="email"
              {...register("email")}
            />
            <FormFieldError message={errors.email?.message} />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow>
          <CompactField label="Phone" required>
            <input
              className={fieldErrorClass(!!errors.phone, shopCompactInputClass)}
              value={formatPhoneDisplay(phone)}
              onChange={(e) => setValue("phone", phoneDigits(e.target.value), { shouldValidate: false })}
              onBlur={phoneField.onBlur}
              name={phoneField.name}
              ref={phoneField.ref}
            />
            <FormFieldError message={errors.phone?.message} />
          </CompactField>
          <CompactField label="Postal Code" required>
            <input
              className={fieldErrorClass(!!errors.pincode, shopCompactInputClass)}
              {...register("pincode")}
            />
            <FormFieldError message={errors.pincode?.message} />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow>
          <CompactField label="City">
            <div className="flex gap-2">
              <input className={shopCompactInputClass} value={city} readOnly placeholder="Choose city" />
              <button type="button" className={shopCancelButtonClass} onClick={() => setCityPickerOpen(true)}>
                Pick
              </button>
            </div>
          </CompactField>
          <CompactField label="Address">
            <input className={shopCompactInputClass} {...register("address")} maxLength={50} />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow className="items-start">
          <AttachImageCheckbox
            label="Attach Image"
            checked={attachProfilePhoto}
            onCheckedChange={setAttachProfilePhoto}
            file={profilePhoto}
            onFileChange={setProfilePhoto}
          />
        </CompactFormRow>

        <div className="space-y-4 border-t border-gray-300 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ad-purple">Vehicles</h3>
            <button
              type="button"
              className="text-xs font-semibold text-ad-purple hover:underline"
              onClick={() => appendVehicle(emptyVehicle())}
            >
              + Add vehicle
            </button>
          </div>
          {typeof vehicleErrors?.message === "string" ? (
            <FormFieldError message={vehicleErrors.message} />
          ) : null}
          {vehicleFields.map((field, index) => {
            const vVehicleName = watch(`vehicles.${index}.vehicleName`);
            const vModel = watch(`vehicles.${index}.model`);
            const rowErrors = vehicleErrors?.[index];
            const extra = vehicleUiExtras[index];
            return (
              <div key={field.id} className="space-y-3 rounded border border-gray-300 bg-white p-3">
                <CompactFormRow>
                  <CompactField label="License Plate" required>
                    <input
                      className={fieldErrorClass(!!rowErrors?.licensePlateNo, shopCompactInputClass)}
                      {...register(`vehicles.${index}.licensePlateNo`)}
                      maxLength={14}
                    />
                    <FormFieldError message={rowErrors?.licensePlateNo?.message} />
                  </CompactField>
                  <CompactField label="VIN">
                    <input
                      className={fieldErrorClass(!!rowErrors?.vinNo, shopCompactInputClass)}
                      {...register(`vehicles.${index}.vinNo`)}
                      maxLength={17}
                    />
                    <FormFieldError message={rowErrors?.vinNo?.message} />
                  </CompactField>
                </CompactFormRow>
                <CompactFormRow>
                  <CompactField label="Make" required>
                    <select
                      className={fieldErrorClass(!!rowErrors?.vehicleName, shopCompactInputClass)}
                      {...register(`vehicles.${index}.vehicleName`)}
                      onChange={(e) => {
                        setValue(`vehicles.${index}.vehicleName`, e.target.value);
                        setValue(`vehicles.${index}.model`, "");
                        setValue(`vehicles.${index}.year`, "");
                      }}
                    >
                      <option value="">Select make</option>
                      {companies.map((c) => (
                        <option key={c.companyName} value={c.companyName}>
                          {c.companyName}
                        </option>
                      ))}
                    </select>
                    <FormFieldError message={rowErrors?.vehicleName?.message} />
                  </CompactField>
                  <CompactField label="Model" required>
                    <select
                      className={fieldErrorClass(!!rowErrors?.model, shopCompactInputClass)}
                      {...register(`vehicles.${index}.model`)}
                      onChange={(e) => {
                        setValue(`vehicles.${index}.model`, e.target.value);
                        setValue(`vehicles.${index}.year`, "");
                      }}
                    >
                      <option value="">Select model</option>
                      {modelOptions(vVehicleName).map((m) => (
                        <option key={m.modelName} value={m.modelName}>
                          {m.modelName}
                        </option>
                      ))}
                    </select>
                    <FormFieldError message={rowErrors?.model?.message} />
                  </CompactField>
                  <CompactField label="Year" required>
                    <select
                      className={fieldErrorClass(!!rowErrors?.year, shopCompactInputClass)}
                      {...register(`vehicles.${index}.year`)}
                    >
                      <option value="">Year</option>
                      {yearOptions(vVehicleName, vModel).map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                    <FormFieldError message={rowErrors?.year?.message} />
                  </CompactField>
                </CompactFormRow>
                <CompactFormRow>
                  <CompactField label="Odometer">
                    <input
                      className={shopCompactInputClass}
                      {...register(`vehicles.${index}.odometerReading`)}
                    />
                  </CompactField>
                </CompactFormRow>
                <CompactFormRow className="items-start">
                  <AttachImageCheckbox
                    label="Attach Image"
                    checked={Boolean(extra?.attachVehiclePhoto)}
                    onCheckedChange={(checked) =>
                      patchVehicleExtra(index, {
                        attachVehiclePhoto: checked,
                        ...(checked ? {} : { vehicleImage: null }),
                      })
                    }
                    file={extra?.vehicleImage ?? null}
                    onFileChange={(file) => patchVehicleExtra(index, { vehicleImage: file, attachVehiclePhoto: true })}
                  />
                </CompactFormRow>
              </div>
            );
          })}
        </div>
      </CompactFormPanel>

      <OwnerCityPicker
        open={cityPickerOpen}
        onClose={() => setCityPickerOpen(false)}
        token={token}
        selectedId={null}
        onSelect={(c) => {
          setValue("city", c.name);
          setCityPickerOpen(false);
        }}
      />
    </ShopFormPage>
  );
}
