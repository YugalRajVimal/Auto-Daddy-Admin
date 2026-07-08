import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getJson, putFormData, putJson } from "../../api/mobileAuth";
import { useAuth } from "../../auth";
import type { CarOwnerVehicle } from "../../lib/carOwnerVehicles";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
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
  startEditing?: boolean;
  onBack?: () => void;
};

export default function OwnerEditVehiclePanel({
  vehicle,
  onUpdated,
  onDeleted: _onDeleted,
  startEditing = false,
  onBack,
}: OwnerEditVehiclePanelProps) {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [companies, setCompanies] = useState<CarCompanyCatalogItem[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadImage, setUploadImage] = useState(false);

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
    setUploadImage(false);
    setVehicleImage(null);
    setImagePreview(vehicleImageUri(v));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    resetFromVehicle(vehicle);
    setEditing(startEditing);
  }, [vehicle.id]);

  useEffect(() => {
    if (startEditing) setEditing(true);
  }, [startEditing]);

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
    onBack?.();
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

  const fieldsDisabled = !editing || submitting || imageProcessing;
  const fieldClass = editing ? ownerVehicleFieldClass : ownerVehicleReadOnlyFieldClass;
  const selectClass = editing ? ownerVehicleSelectClass : ownerVehicleReadOnlySelectClass;
  // imagePreview is used to show "Replace image" when present.

  return (
    <div className="overflow-hidden rounded-[18px] bg-ad-green-light">
      <div className="px-5 py-4 md:px-6">
        <div className="mb-3 flex justify-end">
          {!editing && !startEditing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded border border-gray-400 bg-white px-3 py-1 text-xs font-semibold text-ad-purple hover:bg-gray-50"
            >
              Edit
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-4">
          <label className="text-xs font-semibold text-gray-700">
            License Plate
            <input
              type="text"
              value={licensePlateNo}
              onChange={(e) => setLicensePlateNo(e.target.value)}
              disabled={fieldsDisabled}
              autoComplete="off"
              className={`${fieldClass} mt-1`}
            />
          </label>

          <label className="text-xs font-semibold text-gray-700">
            Make
            <select
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setModel("");
                setYear("");
              }}
              disabled={fieldsDisabled || companiesLoading}
              className={`${selectClass} mt-1`}
            >
              <option value="">{companiesLoading ? "Loading…" : "Make"}</option>
              {companies.map((c) => (
                <option key={c.companyName} value={c.companyName}>
                  {c.companyName}
                </option>
              ))}
              {name && !companies.some((c) => c.companyName === name) ? <option value={name}>{name}</option> : null}
            </select>
          </label>

          <label className="text-xs font-semibold text-gray-700">
            Model
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setYear("");
              }}
              disabled={fieldsDisabled || !name}
              className={`${selectClass} mt-1`}
            >
              <option value="">Model</option>
              {modelOptions.map((m) => (
                <option key={m.modelName} value={m.modelName}>
                  {m.modelName}
                </option>
              ))}
              {model && !modelOptions.some((m) => m.modelName === model) ? <option value={model}>{model}</option> : null}
            </select>
          </label>

          <label className="text-xs font-semibold text-gray-700">
            Year
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={fieldsDisabled || !model}
              className={`${selectClass} mt-1`}
            >
              <option value="">Year</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
              {year && !yearOptions.includes(year) ? <option value={year}>{year}</option> : null}
            </select>
          </label>

          <label className="text-xs font-semibold text-gray-700">
            Odometer
            <input
              type="text"
              value={odometerReading}
              onChange={(e) => setOdometerReading(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              disabled={fieldsDisabled}
              className={`${fieldClass} mt-1`}
            />
          </label>

          {/* VIN below Model (same width) */}
          <div className="hidden md:block" aria-hidden />
          <div className="hidden md:block" aria-hidden />
          <label className="text-xs font-semibold text-gray-700 md:col-start-3">
            VIN
            <input
              type="text"
              value={vinNo}
              onChange={(e) => setVinNo(e.target.value)}
              maxLength={17}
              disabled={fieldsDisabled}
              autoComplete="off"
              className={`${fieldClass} mt-1`}
            />
          </label>

          <div className="flex flex-wrap items-end gap-3 md:col-span-2">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={uploadImage}
                disabled={!editing}
                onChange={(e) => {
                  const next = e.target.checked;
                  setUploadImage(next);
                  if (!next) {
                    setVehicleImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }
                }}
                className="h-4 w-4 accent-ad-green disabled:opacity-60"
              />
              Upload Image
            </label>

            {uploadImage ? (
              vehicleImage ? (
                <span className="text-xs font-semibold text-gray-700">{vehicleImage.name}</span>
              ) : (
                <button
                  type="button"
                  disabled={!editing || imageProcessing}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded border border-gray-400 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {imageProcessing ? "Processing…" : imagePreview ? "Replace image" : "Choose image"}
                </button>
              )
            ) : null}

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
          </div>
        </div>
      </div>

      {editing ? (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f4ddc7] px-5 py-2 md:px-6">
          <p className="text-sm italic text-gray-700">You are creating your Profile page</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={submitting || imageProcessing}
              onClick={() => void handleUpdate()}
              className="min-w-[120px] rounded bg-[#0a7a0a] px-10 py-1.5 text-sm font-bold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Updating…" : "Update"}
            </button>
            <span className="text-sm text-gray-700">or</span>
            <button
              type="button"
              disabled={submitting || imageProcessing}
              onClick={handleCancelEdit}
              className="text-sm font-semibold text-blue-700 underline hover:text-blue-800 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
