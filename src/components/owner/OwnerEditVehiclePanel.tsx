import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getJson, putFormData, putJson } from "../../api/mobileAuth";
import { useAuth } from "../../auth";
import { getCarBrandName, resolveCarBrandLogo } from "../../lib/dummyCarBrands";
import type { CarOwnerVehicle } from "../../lib/carOwnerVehicles";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import OwnerVehicleDetailCard from "./OwnerVehicleDetailCard";
import {
  type CarCompaniesResponse,
  type CarCompanyCatalogItem,
  cropImageToPreviewFrame,
  isValidVehicleYear,
  ownerVehicleFieldClass,
  ownerVehicleReadOnlyFieldClass,
  ownerVehicleReadOnlySelectClass,
  ownerVehicleSelectClass,
  trimVehicleApiMessage,
  type VehicleApiEnvelope,
} from "./ownerVehicleFormUtils";

function vehicleImageUri(v: CarOwnerVehicle): string | null {
  const path = v.carImage ?? v.carImages?.[0] ?? null;
  return normalizeMediaUrl(path);
}

function vehicleToFormState(vehicle: CarOwnerVehicle) {
  return {
    licensePlateNo: vehicle.licensePlateNo?.trim() ?? "",
    vinNo: vehicle.vinNo?.trim() ?? "",
    name: (vehicle.make?.name ?? "").trim(),
    model: (vehicle.make?.model ?? "").trim(),
    year: vehicle.year != null && String(vehicle.year).trim() ? String(vehicle.year).trim() : "",
    odometerReading:
      vehicle.odometerReading != null && String(vehicle.odometerReading).trim()
        ? String(vehicle.odometerReading).trim()
        : "",
    dueOdometerReading:
      vehicle.dueOdometerReading != null && String(vehicle.dueOdometerReading).trim()
        ? String(vehicle.dueOdometerReading).trim()
        : "",
  };
}

type OwnerEditVehiclePanelProps = {
  vehicle: CarOwnerVehicle;
  onUpdated: () => void;
  onDeleted: () => void;
};

export default function OwnerEditVehiclePanel({ vehicle, onUpdated, onDeleted }: OwnerEditVehiclePanelProps) {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [companies, setCompanies] = useState<CarCompanyCatalogItem[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [licensePlateNo, setLicensePlateNo] = useState("");
  const [vinNo, setVinNo] = useState("");
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [odometerReading, setOdometerReading] = useState("");
  const [dueOdometerReading, setDueOdometerReading] = useState("");

  const resetFromVehicle = (v: CarOwnerVehicle) => {
    const next = vehicleToFormState(v);
    setLicensePlateNo(next.licensePlateNo);
    setVinNo(next.vinNo);
    setName(next.name);
    setModel(next.model);
    setYear(next.year);
    setOdometerReading(next.odometerReading);
    setDueOdometerReading(next.dueOdometerReading);
    setVehicleImage(null);
    setImagePreview(vehicleImageUri(v));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    resetFromVehicle(vehicle);
    setEditing(false);
  }, [vehicle.id]);

  useEffect(() => {
    if (!editing) {
      resetFromVehicle(vehicle);
    }
  }, [vehicle, editing]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function loadCompanies() {
      if (!token) return;
      setCompaniesLoading(true);
      const res = await getJson<CarCompaniesResponse>("/api/user/car-companies", token);
      if (cancelled) return;
      const next = Array.isArray(res.data?.data) ? res.data.data : [];
      setCompanies(next.filter((c) => Boolean(c.companyName?.trim())));
      setCompaniesLoading(false);
    }
    void loadCompanies();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (vehicleImage) {
      const url = URL.createObjectURL(vehicleImage);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setImagePreview(vehicleImageUri(vehicle));
  }, [vehicleImage, vehicle]);

  const selectedCompany = useMemo(
    () => companies.find((c) => (c.companyName ?? "").trim() === name.trim()) ?? null,
    [companies, name]
  );

  const makeLogo = useMemo(
    () =>
      resolveCarBrandLogo(
        selectedCompany
          ? {
              companyName: getCarBrandName(selectedCompany),
              brandLogo: selectedCompany.brandLogo ?? selectedCompany.logoUrl ?? null,
            }
          : name.trim()
            ? { companyName: name.trim(), brandLogo: null }
            : null
      ),
    [selectedCompany, name]
  );

  const modelOptions = useMemo(() => selectedCompany?.models ?? [], [selectedCompany]);

  const yearOptions = useMemo(() => {
    const selectedModel = modelOptions.find((m) => (m.modelName ?? "").trim() === model.trim());
    const out: string[] = [];
    for (const y of selectedModel?.years ?? []) {
      const s = String(y ?? "").trim();
      if (s) out.push(s);
    }
    return Array.from(new Set(out)).sort((a, b) => Number(b) - Number(a));
  }, [model, modelOptions]);

  const handleCancelEdit = () => {
    if (submitting) return;
    resetFromVehicle(vehicle);
    setEditing(false);
  };

  const handleImagePick = async (file: File | null) => {
    if (!file) return;
    setImageProcessing(true);
    try {
      const cropped = await cropImageToPreviewFrame(file);
      setVehicleImage(cropped);
    } catch {
      toast.error("Could not process image. Try another file.");
      setVehicleImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setImageProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!token) {
      toast.error("Please log in again.");
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
      toast.error("Plate, make, model, and year are required.");
      return;
    }
    if (nextVin && nextVin.length !== 17) {
      toast.error("VIN must be exactly 17 characters.");
      return;
    }
    if (!isValidVehicleYear(nextYear)) {
      toast.error("Enter a valid vehicle year.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await putJson<VehicleApiEnvelope>(
        `/api/user/vehicle/${vehicle.id}`,
        {
          licensePlateNo: nextPlate,
          vinNo: nextVin,
          name: nextName,
          model: nextModel,
          year: nextYear,
          odometerReading: nextOdometer,
          dueOdometerReading: nextDueOdometer,
        },
        token
      );
      const message = trimVehicleApiMessage(res.data);
      if (!res.ok) {
        toast.error(message || "Could not update vehicle.");
        return;
      }

      if (vehicleImage) {
        const body = new FormData();
        body.append("vehicleImage", vehicleImage, vehicleImage.name || "vehicle.jpg");
        const imgRes = await putFormData<VehicleApiEnvelope>(`/api/user/vehicle/${vehicle.id}`, body, token);
        const imgMessage = trimVehicleApiMessage(imgRes.data);
        if (!imgRes.ok) {
          toast.error(imgMessage || "Vehicle saved but image upload failed.");
        }
      }

      toast.success(message || "Vehicle updated.");
      setEditing(false);
      setVehicleImage(null);
      onUpdated();
    } catch {
      toast.error("Network error while updating vehicle.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!token) {
      toast.error("Please log in again.");
      return;
    }
    if (!window.confirm("Remove this vehicle from your list?")) return;

    setDeleting(true);
    try {
      const res = await putJson<VehicleApiEnvelope>(`/api/user/vehicle/${vehicle.id}`, { disabled: true }, token);
      const message = trimVehicleApiMessage(res.data);
      if (!res.ok) {
        toast.error(message || "Could not remove vehicle.");
        return;
      }
      toast.success(message || "Vehicle removed.");
      onDeleted();
    } catch {
      toast.error("Network error while removing vehicle.");
    } finally {
      setDeleting(false);
    }
  };

  const fieldsDisabled = !editing || submitting || imageProcessing;
  const fieldClass = editing ? ownerVehicleFieldClass : ownerVehicleReadOnlyFieldClass;
  const selectClass = editing ? ownerVehicleSelectClass : ownerVehicleReadOnlySelectClass;
  const imageNotUploadedLabel = "Image not uploaded";
  const imageFieldLabel = imageProcessing
    ? "Processing image…"
    : vehicleImage?.name || (imagePreview ? "Vehicle image on file" : editing ? "Upload vehicle image" : imageNotUploadedLabel);
  const previewEmptyImageLabel = !editing && !imagePreview ? imageNotUploadedLabel : undefined;

  return (
    <div className="rounded-[18px] bg-ad-green-light px-5 py-5 md:px-6">
      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8">
        <div className="min-w-0 w-full space-y-2.5">
          <input
            type="text"
            value={licensePlateNo}
            onChange={(e) => setLicensePlateNo(e.target.value)}
            placeholder="License Plate"
            disabled={fieldsDisabled}
            autoComplete="off"
            className={fieldClass}
          />

          <div className="flex gap-2">
            <select
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setModel("");
                setYear("");
              }}
              disabled={fieldsDisabled || companiesLoading}
              className={`${selectClass} flex-1`}
            >
              <option value="">{companiesLoading ? "Loading…" : "Make"}</option>
              {companies.map((c) => (
                <option key={c.companyName} value={c.companyName}>
                  {c.companyName}
                </option>
              ))}
              {name && !companies.some((c) => c.companyName === name) ? (
                <option value={name}>{name}</option>
              ) : null}
            </select>
            <div
              className={`flex h-[36px] w-[56px] shrink-0 items-center justify-center overflow-hidden rounded-lg p-1 ${
                editing ? "border border-[#c8c8c8] bg-white" : "border border-[#d4d4d4] bg-[#ececec]"
              }`}
            >
              {name.trim() ? (
                <img src={makeLogo} alt="" className="h-full w-full object-contain" />
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setYear("");
              }}
              disabled={fieldsDisabled || !name}
              className={selectClass}
            >
              <option value="">Model</option>
              {modelOptions.map((m) => (
                <option key={m.modelName} value={m.modelName}>
                  {m.modelName}
                </option>
              ))}
              {model && !modelOptions.some((m) => m.modelName === model) ? (
                <option value={model}>{model}</option>
              ) : null}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={fieldsDisabled || !model}
              className={selectClass}
            >
              <option value="">Year</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
              {year && !yearOptions.includes(year) ? <option value={year}>{year}</option> : null}
            </select>
          </div>

          <input
            type="text"
            value={vinNo}
            onChange={(e) => setVinNo(e.target.value)}
            placeholder="VIN"
            maxLength={17}
            disabled={fieldsDisabled}
            autoComplete="off"
            className={fieldClass}
          />

          <input
            type="text"
            value={odometerReading}
            onChange={(e) => setOdometerReading(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="Current Odometer"
            inputMode="numeric"
            disabled={fieldsDisabled}
            className={fieldClass}
          />

          <button
            type="button"
            disabled={fieldsDisabled}
            onClick={() => editing && fileInputRef.current?.click()}
            className={`${fieldClass} text-left ${editing ? "cursor-pointer" : "cursor-default"}`}
          >
            <span
              className={`block truncate ${
                editing
                  ? vehicleImage || imageProcessing
                    ? "text-gray-800"
                    : "text-[#b0b0b0]"
                  : "text-gray-600"
              }`}
            >
              {imageFieldLabel}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              e.target.value = "";
              void handleImagePick(file);
            }}
          />

          {editing ? (
            <div className="flex flex-col items-center gap-1.5 pt-4">
              <button
                type="button"
                disabled={submitting || imageProcessing}
                onClick={() => void handleUpdate()}
                className="min-w-[128px] rounded-lg bg-[#00a000] px-10 py-2 text-[15px] font-bold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Updating…" : "Update"}
              </button>
              <p className="text-sm text-gray-700">
                or{" "}
                <button
                  type="button"
                  disabled={submitting || imageProcessing}
                  onClick={handleCancelEdit}
                  className="text-[#2563eb] underline hover:text-blue-700 disabled:opacity-50"
                >
                  Cancel
                </button>
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex h-full min-h-0 w-full flex-col">
          <OwnerVehicleDetailCard
            variant="detail"
            plate={licensePlateNo}
            make={name}
            model={model}
            year={year}
            vin={vinNo}
            odometer={odometerReading}
            dueOdometer={dueOdometerReading}
            makeLogo={makeLogo}
            imageUri={imagePreview}
            emptyImageLabel={previewEmptyImageLabel}
            fullHeight
            onEdit={editing ? undefined : () => setEditing(true)}
            onDelete={editing ? undefined : () => void handleDelete()}
            deleting={deleting}
          />
        </div>
      </div>
    </div>
  );
}
