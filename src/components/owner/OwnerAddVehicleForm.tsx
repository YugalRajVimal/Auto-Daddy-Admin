import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getJson, postFormData } from "../../api/mobileAuth";
import { useAuth } from "../../auth";
import { getCarBrandName, resolveCarBrandLogo } from "../../lib/dummyCarBrands";
import OwnerVehicleDetailCard from "./OwnerVehicleDetailCard";
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    if (!vehicleImage) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(vehicleImage);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [vehicleImage]);

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
          : null
      ),
    [selectedCompany]
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
    <div className="rounded-[18px] bg-ad-green-light px-5 py-5 md:px-6">
      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8">
        <div className="min-w-0 w-full space-y-2.5">
          <input
            type="text"
            value={licensePlateNo}
            onChange={(e) => setLicensePlateNo(e.target.value)}
            placeholder="License Plate"
            autoComplete="off"
            className={ownerVehicleFieldClass}
          />

          <div className="flex gap-2">
            <select
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setModel("");
                setYear("");
              }}
              disabled={companiesLoading}
              className={`${ownerVehicleSelectClass} flex-1`}
            >
              <option value="">{companiesLoading ? "Loading…" : "Make"}</option>
              {companies.map((c) => (
                <option key={c.companyName} value={c.companyName}>
                  {c.companyName}
                </option>
              ))}
            </select>
            <div className="flex h-[36px] w-[56px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#c8c8c8] bg-white p-1">
              {name.trim() ? (
                <img
                  src={makeLogo}
                  alt=""
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
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
              disabled={!name}
              className={ownerVehicleSelectClass}
            >
              <option value="">Model</option>
              {modelOptions.map((m) => (
                <option key={m.modelName} value={m.modelName}>
                  {m.modelName}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={!model}
              className={ownerVehicleSelectClass}
            >
              <option value="">Year</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            value={vinNo}
            onChange={(e) => setVinNo(e.target.value)}
            placeholder="VIN"
            maxLength={17}
            autoComplete="off"
            className={ownerVehicleFieldClass}
          />

          <input
            type="text"
            value={odometerReading}
            onChange={(e) => setOdometerReading(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="Current Odometer"
            inputMode="numeric"
            className={ownerVehicleFieldClass}
          />

          <button
            type="button"
            disabled={imageProcessing}
            onClick={() => fileInputRef.current?.click()}
            className={`${ownerVehicleFieldClass} cursor-pointer text-left disabled:cursor-wait disabled:opacity-70`}
          >
            <span className={`block truncate ${vehicleImage || imageProcessing ? "text-gray-800" : "text-[#b0b0b0]"}`}>
              {imageProcessing ? "Processing image…" : vehicleImage?.name || "Upload vehicle image"}
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

          <div className="flex flex-col items-center gap-1.5 pt-4">
            <button
              type="button"
              disabled={submitting || imageProcessing}
              onClick={() => void handleSave()}
              className="min-w-[128px] rounded-lg bg-[#00a000] px-10 py-2 text-[15px] font-bold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
            <p className="text-sm text-gray-700">
              or{" "}
              <button
                type="button"
                disabled={submitting || imageProcessing}
                onClick={handleCancel}
                className="text-[#2563eb] underline hover:text-blue-700 disabled:opacity-50"
              >
                Cancel
              </button>
            </p>
          </div>
        </div>

        <div className="flex h-full min-h-0 w-full flex-col">
          <OwnerVehicleDetailCard
            plate={licensePlateNo}
            make={name}
            model={model}
            year={year}
            vin={vinNo}
            odometer={odometerReading}
            imageUri={imagePreview}
            fullHeight
          />
        </div>
      </div>
    </div>
  );
}
