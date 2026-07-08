import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getJson, postFormData } from "../../api/mobileAuth";
import { useAuth } from "../../auth";
import {
  type CarCompaniesResponse,
  type CarCompanyCatalogItem,
  cropImageToPreviewFrame,
  isValidVehicleYear,
  ownerVehicleFieldClass,
  ownerVehicleSelectClass,
  trimVehicleApiMessage,
  type VehicleApiEnvelope,
} from "./ownerVehicleFormUtils";

type OwnerAddVehicleFormProps = {
  onCancel: () => void;
  onAdded: () => void;
};

export default function OwnerAddVehicleForm({ onCancel, onAdded }: OwnerAddVehicleFormProps) {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companies, setCompanies] = useState<CarCompanyCatalogItem[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);

  const [licensePlateNo, setLicensePlateNo] = useState("");
  const [vinNo, setVinNo] = useState("");
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [odometerReading, setOdometerReading] = useState("");
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);
  const [uploadImage, setUploadImage] = useState(false);

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

  const resetForm = () => {
    setLicensePlateNo("");
    setVinNo("");
    setName("");
    setModel("");
    setYear("");
    setOdometerReading("");
    setUploadImage(false);
    setVehicleImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancel = () => {
    if (submitting || imageProcessing) return;
    resetForm();
    onCancel();
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

  const handleSave = async () => {
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
      const body = new FormData();
      body.append("licensePlateNo", nextPlate);
      body.append("vinNo", nextVin);
      body.append("name", nextName);
      body.append("model", nextModel);
      body.append("year", nextYear);
      body.append("odometerReading", nextOdometer);
      body.append("dueOdometerReading", "");
      if (vehicleImage) {
        body.append("vehicleImage", vehicleImage, vehicleImage.name || "vehicle.jpg");
      }

      const res = await postFormData<VehicleApiEnvelope>("/api/user/vehicle", body, token);
      const message = trimVehicleApiMessage(res.data);
      if (!res.ok) {
        toast.error(message || "Could not add vehicle.");
        return;
      }

      toast.success(message || "Vehicle added.");
      resetForm();
      onAdded();
    } catch {
      toast.error("Network error while adding vehicle.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-[18px] bg-ad-green-light">
      <div className="px-5 py-4 md:px-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5 md:gap-4">
          <label className="text-xs font-semibold text-gray-700">
            License Plate
            <input
              type="text"
              value={licensePlateNo}
              onChange={(e) => setLicensePlateNo(e.target.value)}
              autoComplete="off"
              className={`${ownerVehicleFieldClass} mt-1`}
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
              disabled={companiesLoading}
              className={`${ownerVehicleSelectClass} mt-1`}
            >
              <option value="">{companiesLoading ? "Loading…" : "Make"}</option>
              {companies.map((c) => (
                <option key={c.companyName} value={c.companyName}>
                  {c.companyName}
                </option>
              ))}
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
              disabled={!name}
              className={`${ownerVehicleSelectClass} mt-1`}
            >
              <option value="">Model</option>
              {modelOptions.map((m) => (
                <option key={m.modelName} value={m.modelName}>
                  {m.modelName}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold text-gray-700">
            Year
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={!model}
              className={`${ownerVehicleSelectClass} mt-1`}
            >
              <option value="">Year</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold text-gray-700">
            Odometer
            <input
              type="text"
              value={odometerReading}
              onChange={(e) => setOdometerReading(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              className={`${ownerVehicleFieldClass} mt-1`}
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
              autoComplete="off"
              className={`${ownerVehicleFieldClass} mt-1`}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={uploadImage}
              onChange={(e) => {
                const next = e.target.checked;
                setUploadImage(next);
                if (!next) {
                  setVehicleImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }
              }}
              className="h-4 w-4 accent-ad-green"
            />
            Upload Image
          </label>

          {uploadImage ? (
            vehicleImage ? (
              <span className="text-xs font-semibold text-gray-700">{vehicleImage.name}</span>
            ) : (
              <button
                type="button"
                disabled={imageProcessing}
                onClick={() => fileInputRef.current?.click()}
                className="rounded border border-gray-400 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {imageProcessing ? "Processing…" : "Choose image"}
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

      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f4ddc7] px-5 py-2 md:px-6">
        <p className="text-sm italic text-gray-700">You are creating your Profile page</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={submitting || imageProcessing}
            onClick={() => void handleSave()}
            className="min-w-[120px] rounded bg-[#0a7a0a] px-10 py-1.5 text-sm font-bold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
          <span className="text-sm text-gray-700">or</span>
          <button
            type="button"
            disabled={submitting || imageProcessing}
            onClick={handleCancel}
            className="text-sm font-semibold text-blue-700 underline hover:text-blue-800 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
