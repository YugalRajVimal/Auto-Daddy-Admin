import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
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

const currentYear = new Date().getFullYear();

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isValidYear(v: string) {
  const y = Number(v);
  return /^\d{4}$/.test(v) && y >= 1900 && y <= currentYear + 1;
}

type VehicleDraft = CustomerVehiclePayload & {
  vehicleImage?: File | null;
  attachVehiclePhoto?: boolean;
  isNew?: boolean;
};

function emptyVehicle(): VehicleDraft {
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
  const { token, session } = useAuth();
  const countryCode = session?.meta?.countryCode ?? "+1";

  const [name, setName] = useState(customer?.name ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(phoneDigits(customer?.phone ?? ""));
  const [pincode, setPincode] = useState(customer?.pincode ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [city, setCity] = useState(customer?.city ?? "");
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [attachProfilePhoto, setAttachProfilePhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [vehicles, setVehicles] = useState<VehicleDraft[]>(
    customer?.vehicles?.length
      ? customer.vehicles.map((v) => ({
          vId: v.vId ?? v._id,
          licensePlateNo: v.licensePlateNo ?? "",
          vinNo: v.vinNo ?? "",
          vehicleName: v.vehicleName ?? "",
          model: v.model ?? "",
          year: v.year ?? "",
          odometerReading: v.odometerReading ?? "",
        }))
      : [emptyVehicle()]
  );
  const [companies, setCompanies] = useState<CarCompanyCatalogItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    void getJson<{ data?: CarCompanyCatalogItem[] }>("/api/user/car-companies", token).then((res) => {
      if (res.ok && Array.isArray(res.data?.data)) setCompanies(res.data.data);
    });
  }, [token]);

  const updateVehicle = (index: number, patch: Partial<VehicleDraft>) => {
    setVehicles((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  };

  const modelOptions = (vehicleName: string) => {
    const company = companies.find((c) => c.companyName === vehicleName);
    return company?.models ?? [];
  };

  const yearOptions = (vehicleName: string, model: string) => {
    const m = modelOptions(vehicleName).find((x) => x.modelName === model);
    return (m?.years ?? []).map(String);
  };

  const validate = (): string | null => {
    if (!name.trim()) return "Name is required.";
    if (!email.trim() || !isValidEmail(email)) return "Valid email is required.";
    if (phoneDigits(phone).length !== 10) return "Phone must be 10 digits.";
    if (!pincode.trim()) return "Postal code is required.";
    for (const v of vehicles) {
      if (!v.licensePlateNo.trim() || !v.vehicleName.trim() || !v.model.trim() || !v.year.trim()) {
        return "Each vehicle needs plate, make, model, and year.";
      }
      if (!isValidYear(v.year)) return "Enter a valid vehicle year.";
      if (v.vinNo && v.vinNo.length !== 17) return "VIN must be exactly 17 characters when provided.";
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!token) return;
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      const vehiclePayloads: CustomerVehiclePayload[] = vehicles.map((v) => ({
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
        vehicleImages: vehicles.map((v) => (v.attachVehiclePhoto ? v.vehicleImage ?? null : null)),
      };

      if (mode === "add") {
        const res = await onboardCarOwner(
          token,
          {
            name: name.trim(),
            email: email.trim(),
            countryCode,
            phone: phoneDigits(phone),
            pincode: pincode.trim(),
            address: address.trim(),
            city: city.trim(),
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
            name: name.trim(),
            email: email.trim(),
            countryCode,
            phone: phoneDigits(phone),
            pincode: pincode.trim(),
            address: address.trim(),
            city: city.trim(),
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

  const title = mode === "add" ? "Add Customer" : "Edit Customer";

  return (
    <ShopFormPage title={title} metaTitle={`${title} | AutoDaddy`} backTo={backTo}>
      <CompactFormPanel
        focusOnMount
        footer={
          <CompactFormFooter
            actionLabel={submitting ? "Saving…" : "Save"}
            onSave={() => void handleSubmit()}
            onCancel={() => navigate(backTo)}
          />
        }
      >
        <CompactFormRow>
          <CompactField label="Full Name" required>
            <input className={shopCompactInputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={20} />
          </CompactField>
          <CompactField label="Email" required>
            <input className={shopCompactInputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow>
          <CompactField label="Phone" required>
            <input className={shopCompactInputClass} value={formatPhoneDisplay(phone)} onChange={(e) => setPhone(phoneDigits(e.target.value))} />
          </CompactField>
          <CompactField label="Postal Code" required>
            <input className={shopCompactInputClass} value={pincode} onChange={(e) => setPincode(e.target.value)} />
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
            <input className={shopCompactInputClass} value={address} onChange={(e) => setAddress(e.target.value)} maxLength={50} />
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
              onClick={() => setVehicles((v) => [...v, emptyVehicle()])}
            >
              + Add vehicle
            </button>
          </div>
          {vehicles.map((v, index) => (
            <div key={index} className="space-y-3 rounded border border-gray-300 bg-white p-3">
              <CompactFormRow>
                <CompactField label="License Plate" required>
                  <input
                    className={shopCompactInputClass}
                    value={v.licensePlateNo}
                    onChange={(e) => updateVehicle(index, { licensePlateNo: e.target.value })}
                    maxLength={14}
                  />
                </CompactField>
                <CompactField label="VIN">
                  <input
                    className={shopCompactInputClass}
                    value={v.vinNo ?? ""}
                    onChange={(e) => updateVehicle(index, { vinNo: e.target.value })}
                    maxLength={17}
                  />
                </CompactField>
              </CompactFormRow>
              <CompactFormRow>
                <CompactField label="Make" required>
                  <select
                    className={shopCompactInputClass}
                    value={v.vehicleName}
                    onChange={(e) => updateVehicle(index, { vehicleName: e.target.value, model: "", year: "" })}
                  >
                    <option value="">Select make</option>
                    {companies.map((c) => (
                      <option key={c.companyName} value={c.companyName}>
                        {c.companyName}
                      </option>
                    ))}
                  </select>
                </CompactField>
                <CompactField label="Model" required>
                  <select
                    className={shopCompactInputClass}
                    value={v.model}
                    onChange={(e) => updateVehicle(index, { model: e.target.value, year: "" })}
                  >
                    <option value="">Select model</option>
                    {modelOptions(v.vehicleName).map((m) => (
                      <option key={m.modelName} value={m.modelName}>
                        {m.modelName}
                      </option>
                    ))}
                  </select>
                </CompactField>
                <CompactField label="Year" required>
                  <select
                    className={shopCompactInputClass}
                    value={v.year}
                    onChange={(e) => updateVehicle(index, { year: e.target.value })}
                  >
                    <option value="">Year</option>
                    {yearOptions(v.vehicleName, v.model).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </CompactField>
              </CompactFormRow>
              <CompactFormRow>
                <CompactField label="Odometer">
                  <input
                    className={shopCompactInputClass}
                    value={v.odometerReading ?? ""}
                    onChange={(e) => updateVehicle(index, { odometerReading: e.target.value })}
                  />
                </CompactField>
              </CompactFormRow>
              <CompactFormRow className="items-start">
                <AttachImageCheckbox
                  label="Attach Image"
                  checked={Boolean(v.attachVehiclePhoto)}
                  onCheckedChange={(checked) =>
                    updateVehicle(index, {
                      attachVehiclePhoto: checked,
                      ...(checked ? {} : { vehicleImage: null }),
                    })
                  }
                  file={v.vehicleImage ?? null}
                  onFileChange={(file) => updateVehicle(index, { vehicleImage: file, attachVehiclePhoto: true })}
                />
              </CompactFormRow>
            </div>
          ))}
        </div>
      </CompactFormPanel>

      <OwnerCityPicker
        open={cityPickerOpen}
        onClose={() => setCityPickerOpen(false)}
        token={token}
        selectedId={null}
        onSelect={(c) => {
          setCity(c.name);
          setCityPickerOpen(false);
        }}
      />
    </ShopFormPage>
  );
}
