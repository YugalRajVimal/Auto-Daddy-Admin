import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { authHeaders } from "../../api/client";
import { getJson } from "../../api/mobileAuth";
import { useAuth } from "../../auth";
import { parseCitiesApiResponse } from "../../lib/carOwnerCities";
import {
  addCarOwnerToMyCustomers,
  apiMessage,
  onboardCarOwner,
  updateMyCustomer,
  type CustomerVehiclePayload,
} from "../../lib/shopOwnerMutations";
import {
  CompactAutoGrowTextarea,
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  compactFixedFieldWidth,
  compactInputClass,
} from "./ContentPanel";

const API = () => import.meta.env.VITE_API_URL || "";
const UPLOADS = () => import.meta.env.VITE_UPLOADS_URL || "";

function mediaUrl(path?: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${UPLOADS()}/${path.replace(/^\/+/, "")}`;
}

function fmtDate(d?: string): string {
  if (!d) return "-";
  return new Date(d).toISOString().slice(0, 10);
}

function getMakeName(v: CarOwnerFormVehicle): string {
  if (!v.make) return "-";
  if (typeof v.make === "object") return v.make.name || "-";
  return String(v.make);
}

function getMakeModel(v: CarOwnerFormVehicle): string {
  if (!v.make) return "-";
  if (typeof v.make === "object") return v.make.model || "-";
  return "-";
}

function ownerProfileImg(o: CarOwnerFormRecord): string {
  return mediaUrl(o.profilePhoto ?? o.profileImage ?? "");
}

function getToken(): Record<string, string> {
  return authHeaders();
}

type CarCatalogModel = { modelName: string; years: (number | string)[] };
type CarCatalogItem = { _id: string; companyName: string; models: CarCatalogModel[] };

function normalizeYearOptions(years: (number | string)[]): string[] {
  const out: string[] = [];
  for (const y of years) {
    if (typeof y === "number") out.push(String(y));
    else if (typeof y === "string") {
      y.split(",").forEach((part) => {
        const t = part.trim();
        if (t) out.push(t);
      });
    }
  }
  return [...new Set(out)].sort((a, b) => Number(b) - Number(a));
}

type VehicleFormRow = {
  _id?: string;
  licensePlateNo: string;
  vinNo: string;
  vehicleName: string;
  model: string;
  year: string;
  odometerReading: string;
  nextDueService: string;
  attachNextDueService: boolean;
  attachVehiclePhoto: boolean;
  vehicleImageFile: File | null;
  vehicleImagePreview: string;
};

function emptyVehicle(): VehicleFormRow {
  return {
    licensePlateNo: "",
    vinNo: "",
    vehicleName: "",
    model: "",
    year: "",
    odometerReading: "",
    nextDueService: "",
    attachNextDueService: false,
    attachVehiclePhoto: false,
    vehicleImageFile: null,
    vehicleImagePreview: "",
  };
}

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

const fieldErrorClass = "mt-0.5 text-[11px] font-semibold text-red-700";
const uploadBtnClass =
  "rounded border border-gray-400 bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-300";
const carOwnerAddressFieldWidth = "min-w-[220px] flex-1 sm:min-w-[300px]";
const vehicleGridClass = "grid w-full grid-cols-6 gap-x-4 gap-y-3 items-start";
const vehicleFieldClass = "!flex-none min-w-0 w-full";

type ProvinceCityOption = { name: string; status?: string };
type ProvinceWithCities = { cities?: ProvinceCityOption[] };

export type CarOwnerFormVehicle = {
  _id: string;
  licensePlateNo?: string;
  vinNo?: string;
  year?: number | string;
  odometerReading?: number | string;
  dueOdometerReading?: number | string;
  carImages?: string[];
  make?: { name?: string; model?: string } | string;
};

export type CarOwnerFormRecord = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  pincode?: string;
  address?: string;
  city?: string;
  createdAt?: string;
  profilePhoto?: string;
  profileImage?: string;
  myVehicles?: CarOwnerFormVehicle[];
};

type CarOwnerAddEditFormProps = {
  owner?: CarOwnerFormRecord | null;
  onCancel: () => void;
  onSaved: () => void;
  apiVariant?: "admin" | "shop";
};

function VehicleRowForm({
  v,
  i,
  attempted,
  carCatalog,
  onChange,
  onRemove,
  canRemove,
}: {
  v: VehicleFormRow;
  i: number;
  attempted: boolean;
  carCatalog: CarCatalogItem[];
  onChange: (p: Partial<VehicleFormRow>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const makeOptions = useMemo(
    () => [...new Set(carCatalog.map((c) => c.companyName))].sort((a, b) => a.localeCompare(b)),
    [carCatalog],
  );
  const modelOptions = useMemo(() => {
    if (!v.vehicleName) return [];
    const company = carCatalog.find((c) => c.companyName === v.vehicleName);
    return (company?.models ?? []).map((m) => m.modelName).sort((a, b) => a.localeCompare(b));
  }, [carCatalog, v.vehicleName]);
  const yearOptions = useMemo(() => {
    if (!v.vehicleName || !v.model) return [];
    const company = carCatalog.find((c) => c.companyName === v.vehicleName);
    const model = company?.models.find((m) => m.modelName === v.model);
    return model ? normalizeYearOptions(model.years) : [];
  }, [carCatalog, v.vehicleName, v.model]);

  return (
    <div className="mb-2 w-full rounded border border-gray-300 bg-white px-6 py-3 shadow-sm last:mb-0">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold text-ad-green-dark">Vehicle #{i + 1}</span>
        {canRemove ? (
          <button type="button" onClick={onRemove} className="text-xs font-semibold text-red-600 hover:underline">
            Remove
          </button>
        ) : null}
      </div>
      <div className={vehicleGridClass}>
        <CompactField label="Make" required className={vehicleFieldClass}>
          <select
            value={v.vehicleName}
            onChange={(e) => onChange({ vehicleName: e.target.value, model: "", year: "" })}
            className={compactInputClass}
          >
            <option value="">Select make</option>
            {makeOptions.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
            {v.vehicleName && !makeOptions.includes(v.vehicleName) ? (
              <option value={v.vehicleName}>{v.vehicleName}</option>
            ) : null}
          </select>
        </CompactField>
        <CompactField label="Model" required className={vehicleFieldClass}>
          <select
            value={v.model}
            onChange={(e) => onChange({ model: e.target.value, year: "" })}
            disabled={!v.vehicleName}
            className={`${compactInputClass} disabled:cursor-not-allowed disabled:bg-gray-100`}
          >
            <option value="">Select model</option>
            {modelOptions.map((modelName) => (
              <option key={modelName} value={modelName}>
                {modelName}
              </option>
            ))}
            {v.model && !modelOptions.includes(v.model) ? (
              <option value={v.model}>{v.model}</option>
            ) : null}
          </select>
        </CompactField>
        <CompactField label="Year" required className={vehicleFieldClass}>
          <select
            value={v.year}
            onChange={(e) => onChange({ year: e.target.value })}
            disabled={!v.vehicleName || !v.model}
            className={`${compactInputClass} disabled:cursor-not-allowed disabled:bg-gray-100`}
          >
            <option value="">Select year</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
            {v.year && !yearOptions.includes(v.year) ? <option value={v.year}>{v.year}</option> : null}
          </select>
        </CompactField>
        <CompactField label="License Plate" required className={vehicleFieldClass}>
          <input
            type="text"
            value={v.licensePlateNo}
            onChange={(e) => onChange({ licensePlateNo: e.target.value.slice(0, 14) })}
            placeholder="ABC 1234"
            className={compactInputClass}
          />
          {attempted && !v.licensePlateNo.trim() ? <p className={fieldErrorClass}>Required</p> : null}
        </CompactField>
        <CompactField label="VIN" className={vehicleFieldClass}>
          <input
            type="text"
            value={v.vinNo}
            onChange={(e) => onChange({ vinNo: e.target.value.slice(0, 17).toUpperCase() })}
            placeholder="17-char VIN"
            maxLength={17}
            className={compactInputClass}
          />
          {attempted && v.vinNo && v.vinNo.length !== 17 ? (
            <p className={fieldErrorClass}>Must be 17 chars</p>
          ) : null}
        </CompactField>
        <div className="min-w-0 w-full">
          <label className="mb-1 block text-xs font-bold text-ad-green-dark">Odometer</label>
          <input
            type="text"
            value={v.odometerReading}
            onChange={(e) => onChange({ odometerReading: e.target.value.replace(/\D/g, "") })}
            placeholder="km"
            className={compactInputClass}
          />
        </div>
        <div className="col-start-1 min-w-0 w-full">
          <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
            <input
              type="checkbox"
              checked={v.attachVehiclePhoto}
              onChange={(e) => {
                const checked = e.target.checked;
                if (!checked) {
                  if (v.vehicleImagePreview?.startsWith("blob:")) URL.revokeObjectURL(v.vehicleImagePreview);
                  onChange({
                    attachVehiclePhoto: false,
                    vehicleImageFile: null,
                    vehicleImagePreview: "",
                  });
                  if (ref.current) ref.current.value = "";
                } else {
                  onChange({ attachVehiclePhoto: true });
                }
              }}
              className="h-3.5 w-3.5 accent-ad-green"
            />
            Photo
          </label>
          {v.attachVehiclePhoto ? (
            <div className="flex w-full min-w-0 items-center gap-1.5">
              {v.vehicleImagePreview ? (
                <img
                  src={v.vehicleImagePreview}
                  alt=""
                  className="h-[30px] w-[30px] shrink-0 rounded border border-gray-300 object-cover"
                />
              ) : null}
              <input
                readOnly
                value={v.vehicleImageFile?.name ?? ""}
                placeholder="No file chosen"
                tabIndex={-1}
                className={`${compactInputClass} min-w-0 flex-1 cursor-default`}
              />
              <button type="button" onClick={() => ref.current?.click()} className={`${uploadBtnClass} shrink-0`}>
                Upload
              </button>
              <input
                ref={ref}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (v.vehicleImagePreview?.startsWith("blob:")) URL.revokeObjectURL(v.vehicleImagePreview);
                  onChange({ vehicleImageFile: file, vehicleImagePreview: URL.createObjectURL(file) });
                }}
              />
            </div>
          ) : null}
        </div>
        <div className="col-start-6 min-w-0 w-full">
          <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
            <input
              type="checkbox"
              checked={v.attachNextDueService}
              onChange={(e) => {
                const checked = e.target.checked;
                onChange({
                  attachNextDueService: checked,
                  ...(!checked ? { nextDueService: "" } : {}),
                });
              }}
              className="h-3.5 w-3.5 accent-ad-green"
            />
            Next Due Service
          </label>
          {v.attachNextDueService ? (
            <input
              type="text"
              value={v.nextDueService}
              onChange={(e) => onChange({ nextDueService: e.target.value.replace(/\D/g, "") })}
              placeholder="km"
              className={compactInputClass}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function buildVehiclePayloads(filled: VehicleFormRow[]): CustomerVehiclePayload[] {
  return filled.map((v) => ({
    ...(v._id ? { vId: v._id } : {}),
    licensePlateNo: v.licensePlateNo.trim().slice(0, 14),
    vinNo: v.vinNo.trim() || undefined,
    vehicleName: v.vehicleName.trim(),
    model: v.model.trim(),
    year: v.year.trim(),
    odometerReading: v.odometerReading.trim() || undefined,
    ...(v.attachNextDueService && v.nextDueService.trim()
      ? { dueOdometerReading: v.nextDueService.trim() }
      : {}),
  })) as CustomerVehiclePayload[];
}

export default function CarOwnerAddEditForm({
  owner,
  onCancel,
  onSaved,
  apiVariant = "admin",
}: CarOwnerAddEditFormProps) {
  const { token, session } = useAuth();
  const isShop = apiVariant === "shop";
  const isEdit = !!owner;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [vehicles, setVehicles] = useState<VehicleFormRow[]>([emptyVehicle()]);
  const [attachEmail, setAttachEmail] = useState(false);
  const [attachProfilePhoto, setAttachProfilePhoto] = useState(false);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [carCatalog, setCarCatalog] = useState<CarCatalogItem[]>([]);
  const pRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (isShop) {
          if (!token) return;
          const res = await getJson<unknown>("/api/user/cities?page=1", token);
          if (cancelled) return;
          if (res.ok) {
            setCityOptions(parseCitiesApiResponse(res.data).map((c) => c.name));
          } else {
            setCityOptions([]);
          }
          return;
        }
        const res = await axios.get(`${API()}/api/admin/provinces`, { headers: getToken() });
        if (cancelled) return;
        const provinces: ProvinceWithCities[] = res.data?.data || [];
        const names = new Set<string>();
        for (const province of provinces) {
          for (const c of province.cities || []) {
            if (!c.status || c.status === "Active") names.add(c.name);
          }
        }
        setCityOptions([...names].sort((a, b) => a.localeCompare(b)));
      } catch {
        if (!cancelled) setCityOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isShop, token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const headers = isShop && token ? { Authorization: `Bearer ${token}` } : getToken();
        const res = await axios.get(`${API()}/api/auto-shop-owner/car-details`, { headers });
        if (cancelled) return;
        if (res.data?.success && Array.isArray(res.data.data)) {
          setCarCatalog(res.data.data);
        } else {
          setCarCatalog([]);
        }
      } catch {
        if (!cancelled) setCarCatalog([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isShop, token]);

  const citySelectOptions = useMemo(() => {
    const names = new Set(cityOptions);
    if (city.trim()) names.add(city.trim());
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [cityOptions, city]);

  useEffect(() => {
    setAttempted(false);
    setApiError(null);
    if (isEdit && owner) {
      setName(owner.name || "");
      setEmail(owner.email || "");
      setPhone(owner.phone || "");
      setPincode(owner.pincode || "");
      setAddress(owner.address || "");
      setCity(owner.city || "");
      setJoiningDate(fmtDate(owner.createdAt) !== "-" ? fmtDate(owner.createdAt) : "");
      const existingProfileImg = ownerProfileImg(owner);
      setAttachEmail(!!owner.email?.trim());
      setAttachProfilePhoto(!!existingProfileImg);
      setProfileFile(null);
      setProfilePreview(existingProfileImg);
      setVehicles(
        (owner.myVehicles ?? []).map((v) => ({
          _id: v._id,
          licensePlateNo: v.licensePlateNo || "",
          vinNo: v.vinNo || "",
          vehicleName: getMakeName(v) === "-" ? "" : getMakeName(v),
          model: getMakeModel(v) === "-" ? "" : getMakeModel(v),
          year: v.year ? String(v.year) : "",
          odometerReading: v.odometerReading != null ? String(v.odometerReading) : "",
          nextDueService: v.dueOdometerReading != null ? String(v.dueOdometerReading) : "",
          attachNextDueService: false,
          attachVehiclePhoto: false,
          vehicleImageFile: null,
          vehicleImagePreview: Array.isArray(v.carImages) && v.carImages[0] ? mediaUrl(v.carImages[0]) : "",
        })) || [emptyVehicle()],
      );
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setPincode("");
      setAddress("");
      setCity("");
      setJoiningDate(new Date().toISOString().slice(0, 10));
      setAttachEmail(false);
      setAttachProfilePhoto(false);
      setProfileFile(null);
      setProfilePreview("");
      setVehicles([emptyVehicle()]);
    }
  }, [isEdit, owner]);

  function validate(): string | null {
    if (!name.trim()) return "Name is required.";
    if (attachEmail && (!email.trim() || !isValidEmail(email))) {
      return "Valid email required.";
    }
    if (phone.replace(/\D/g, "").length !== 10) return "Phone must be 10 digits.";
    if (!pincode.trim()) return "Zip code required.";
    return null;
  }

  async function saveShop(filled: VehicleFormRow[]) {
    if (!token) {
      setApiError("Not signed in.");
      return;
    }
    const countryCode = session?.meta?.countryCode ?? "+1";
    const vehiclePayloads = buildVehiclePayloads(filled);
    const uploads = {
      profilePhoto: profileFile,
      vehicleImages: filled.map((v) => (v.attachVehiclePhoto ? v.vehicleImageFile : null)),
    };

    if (isEdit && owner) {
      const res = await updateMyCustomer(
        token,
        {
          carOwnerId: owner._id,
          name: name.trim(),
          email: attachEmail ? email.trim() : "",
          countryCode,
          phone: phone.replace(/\D/g, ""),
          pincode: pincode.trim().replace(/\s/g, "").toUpperCase(),
          address: address.trim(),
          city: city.trim(),
          vehicles: vehiclePayloads,
        },
        uploads,
      );
      if (!res.ok) {
        setApiError(apiMessage(res.data) || "Could not update.");
        return;
      }
      onSaved();
      return;
    }

    const res = await onboardCarOwner(
      token,
      {
        name: name.trim(),
        email: attachEmail ? email.trim() : "",
        countryCode,
        phone: phone.replace(/\D/g, ""),
        pincode: pincode.trim().replace(/\s/g, "").toUpperCase(),
        address: address.trim(),
        city: city.trim(),
        role: "carowner",
        vehicles: vehiclePayloads,
      },
      uploads,
    );
    if (!res.ok) {
      setApiError(apiMessage(res.data) || "Could not add customer.");
      return;
    }
    const data = res.data as { data?: { carOwnerId?: string; _id?: string }; carOwnerId?: string; _id?: string } | null;
    const carOwnerId = data?.carOwnerId ?? data?.data?.carOwnerId ?? data?._id ?? data?.data?._id;
    if (carOwnerId) {
      await addCarOwnerToMyCustomers(token, carOwnerId);
    }
    onSaved();
  }

  async function saveAdmin(filled: VehicleFormRow[]) {
    const fd = new FormData();
    if (isEdit && owner) fd.append("carOwnerId", owner._id);
    fd.append("name", name.trim());
    if (attachEmail && email.trim()) fd.append("email", email.trim());
    fd.append("phone", phone.replace(/\D/g, ""));
    fd.append("pincode", pincode.trim().replace(/\s/g, "").toUpperCase());
    fd.append("address", address.trim().slice(0, 50));
    if (city.trim()) fd.append("city", city.trim());
    if (joiningDate.trim()) fd.append("createdAt", joiningDate.trim());
    if (!isEdit) fd.append("role", "carowner");
    fd.append(
      "vehicles",
      JSON.stringify(
        filled.map((v) => ({
          ...(v._id ? { _id: v._id } : {}),
          licensePlateNo: v.licensePlateNo.trim(),
          vinNo: v.vinNo.trim(),
          vehicleName: v.vehicleName.trim(),
          model: v.model.trim(),
          year: v.year.trim(),
          odometerReading: v.odometerReading.trim(),
          ...(v.attachNextDueService && v.nextDueService.trim()
            ? { dueOdometerReading: v.nextDueService.trim() }
            : {}),
        })),
      ),
    );
    if (profileFile) fd.append("profilePhoto", profileFile, profileFile.name);
    filled.forEach((v, idx) => {
      if (v.attachVehiclePhoto && v.vehicleImageFile) {
        fd.append(`carImage_${idx}`, v.vehicleImageFile, v.vehicleImageFile.name);
      }
    });
    if (isEdit) await axios.put(`${API()}/api/admin/my-customers`, fd, { headers: getToken() });
    else await axios.post(`${API()}/api/admin/onboard-carowner`, fd, { headers: getToken() });
    onSaved();
  }

  async function handleSave() {
    setAttempted(true);
    const err = validate();
    if (err) {
      setApiError(err);
      return;
    }
    setApiError(null);
    const filled = vehicles.filter((v) => v.licensePlateNo.trim() || v.vehicleName.trim());
    setSubmitting(true);
    try {
      if (isShop) await saveShop(filled);
      else await saveAdmin(filled);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (isEdit ? "Could not update." : "Could not add.");
      setApiError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const formMessage = isEdit
    ? isShop
      ? "You are updating a customer"
      : "You are updating a 'Car Owner'"
    : isShop
      ? "You are adding a new customer"
      : "You are creating a 'Car Owner'";

  return (
    <CompactFormPanel
      footer={
        <CompactFormFooter
          message={formMessage}
          messageCenter
          actionLabel={submitting ? "Saving..." : "Save"}
          onSave={() => void handleSave()}
          onCancel={onCancel}
        />
      }
    >
      {apiError ? (
        <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
          {apiError}
        </div>
      ) : null}
      <div className="grid w-full grid-cols-1 items-start gap-x-4 gap-y-4 sm:grid-cols-5">
        <CompactField label="Date" className="!flex-none w-full sm:col-span-1">
          <input
            type="date"
            value={joiningDate}
            onChange={(e) => setJoiningDate(e.target.value)}
            className={compactInputClass}
          />
        </CompactField>
        <CompactField label="Phone" required className="!flex-none w-full sm:col-span-1">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            className={compactInputClass}
          />
          {attempted && phone.replace(/\D/g, "").length !== 10 ? (
            <p className={fieldErrorClass}>Must be 10 digits</p>
          ) : null}
        </CompactField>
        <CompactField label="Full Name" required className="!flex-none w-full sm:col-span-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            className={compactInputClass}
          />
          {attempted && !name.trim() ? <p className={fieldErrorClass}>Required</p> : null}
        </CompactField>
        <CompactField label="City" className="!flex-none w-full sm:col-span-1">
          <select value={city} onChange={(e) => setCity(e.target.value)} className={compactInputClass}>
            <option value="">Select city</option>
            {citySelectOptions.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
        </CompactField>
        <CompactField label="Zip / Postal Code" required className="!flex-none w-full sm:col-span-1">
          <input
            type="text"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.slice(0, 10))}
            placeholder="A1A 1A1"
            className={compactInputClass}
          />
          {attempted && !pincode.trim() ? <p className={fieldErrorClass}>Required</p> : null}
        </CompactField>

        <div className={`min-w-0 w-full sm:col-span-1 ${compactFixedFieldWidth}`}>
          <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
            <input
              type="checkbox"
              checked={attachProfilePhoto}
              onChange={(e) => {
                const checked = e.target.checked;
                setAttachProfilePhoto(checked);
                if (!checked) {
                  if (profilePreview?.startsWith("blob:")) URL.revokeObjectURL(profilePreview);
                  setProfileFile(null);
                  setProfilePreview(isEdit && owner ? ownerProfileImg(owner) : "");
                  if (pRef.current) pRef.current.value = "";
                }
              }}
              className="h-3.5 w-3.5 accent-ad-green"
            />
            Profile Photo
          </label>
          {attachProfilePhoto ? (
            <div className="flex items-center gap-1.5">
              {profilePreview ? (
                <img
                  src={profilePreview}
                  alt=""
                  className="h-[30px] w-[30px] shrink-0 rounded border border-gray-300 object-cover"
                />
              ) : null}
              <input
                readOnly
                value={profileFile?.name ?? ""}
                placeholder="No file chosen"
                tabIndex={-1}
                className={`${compactInputClass} min-w-0 flex-1 cursor-default`}
              />
              <button type="button" onClick={() => pRef.current?.click()} className={`${uploadBtnClass} shrink-0`}>
                Upload
              </button>
              <input
                ref={pRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (profilePreview?.startsWith("blob:")) URL.revokeObjectURL(profilePreview);
                  setProfileFile(f);
                  setProfilePreview(URL.createObjectURL(f));
                }}
              />
            </div>
          ) : null}
        </div>
        <div className={`min-w-0 w-full sm:col-span-1 ${compactFixedFieldWidth}`}>
          <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
            <input
              type="checkbox"
              checked={attachEmail}
              onChange={(e) => {
                const checked = e.target.checked;
                setAttachEmail(checked);
                if (!checked) {
                  setEmail(isEdit && owner ? owner.email || "" : "");
                }
              }}
              className="h-3.5 w-3.5 accent-ad-green"
            />
            Email
          </label>
          {attachEmail ? (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={compactInputClass}
              />
              {attempted && !isValidEmail(email) ? (
                <p className={fieldErrorClass}>Valid email required</p>
              ) : null}
            </>
          ) : null}
        </div>
        <div className={`min-w-0 w-full sm:col-span-3 ${carOwnerAddressFieldWidth}`}>
          <label className="mb-1 block text-xs font-bold text-ad-green-dark">Address</label>
          <CompactAutoGrowTextarea
            value={address}
            onChange={(e) => setAddress(e.target.value.slice(0, 50))}
            placeholder="Max 50 chars"
          />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-gray-300 pt-3">
        <span className="text-xs font-bold text-ad-green-dark">Vehicles</span>
        {vehicles.length < 5 ? (
          <button
            type="button"
            onClick={() => setVehicles((v) => [...v, emptyVehicle()])}
            className="rounded bg-ad-green px-2.5 py-0.5 text-xs font-semibold text-white hover:brightness-95"
          >
            + Add Vehicle
          </button>
        ) : null}
      </div>
      <div className="mt-2 w-full space-y-0 px-2 sm:px-3">
        {vehicles.map((v, i) => (
          <VehicleRowForm
            key={i}
            v={v}
            i={i}
            attempted={attempted}
            carCatalog={carCatalog}
            onChange={(patch) =>
              setVehicles((prev) => {
                const n = [...prev];
                n[i] = { ...n[i], ...patch };
                return n;
              })
            }
            onRemove={() => setVehicles((prev) => prev.filter((_, idx) => idx !== i))}
            canRemove={vehicles.length > 1}
          />
        ))}
      </div>
    </CompactFormPanel>
  );
}
