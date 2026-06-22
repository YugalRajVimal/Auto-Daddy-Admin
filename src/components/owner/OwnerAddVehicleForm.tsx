import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../admin/ContentPanel";
import { getJson, postFormData } from "../../api/mobileAuth";
import { useAuth } from "../../auth";

type ApiEnvelope = {
  success?: boolean;
  message?: string;
};

type CarCompanyCatalogModel = {
  modelName: string;
  years: Array<string | number>;
};

type CarCompanyCatalogItem = {
  companyName: string;
  models: CarCompanyCatalogModel[];
};

type CarCompaniesResponse = {
  data?: CarCompanyCatalogItem[];
  message?: string;
  success?: boolean;
};

const currentYear = new Date().getFullYear();

function isValidYear(value: string) {
  const year = Number(value);
  return /^\d{4}$/.test(value) && year >= 1900 && year <= currentYear + 1;
}

function trimMessage(payload: ApiEnvelope | null) {
  return typeof payload?.message === "string" ? payload.message.trim() : "";
}

type OwnerAddVehicleFormProps = {
  onCancel: () => void;
  onAdded: () => void;
};

export default function OwnerAddVehicleForm({ onCancel, onAdded }: OwnerAddVehicleFormProps) {
  const { token } = useAuth();

  const [companies, setCompanies] = useState<CarCompanyCatalogItem[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [licensePlateNo, setLicensePlateNo] = useState("");
  const [vinNo, setVinNo] = useState("");
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [odometerReading, setOdometerReading] = useState("");
  const [dueOdometerReading, setDueOdometerReading] = useState("");
  const [attachImage, setAttachImage] = useState(false);
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);

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

  const modelOptions = useMemo(() => {
    const company = companies.find((c) => (c.companyName ?? "").trim() === name.trim());
    return company?.models ?? [];
  }, [companies, name]);

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
    setDueOdometerReading("");
    setAttachImage(false);
    setVehicleImage(null);
  };

  const handleCancel = () => {
    if (submitting) return;
    resetForm();
    onCancel();
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
    const nextDueOdometer = dueOdometerReading.trim();

    if (!nextPlate || !nextName || !nextModel || !nextYear) {
      toast.error("Plate, make, model, and year are required.");
      return;
    }
    if (nextVin && nextVin.length !== 17) {
      toast.error("VIN must be exactly 17 characters.");
      return;
    }
    if (!isValidYear(nextYear)) {
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
      body.append("dueOdometerReading", nextDueOdometer);
      if (vehicleImage) {
        body.append("vehicleImage", vehicleImage, vehicleImage.name || "vehicle.jpg");
      }

      const res = await postFormData<ApiEnvelope>("/api/user/vehicle", body, token);
      const message = trimMessage(res.data);
      if (!res.ok) {
        toast.error(message || "Could not add vehicle.");
        return;
      }

      toast.success(message || "Vehicle added.");
      resetForm();
      onAdded();
      onCancel();
    } catch {
      toast.error("Network error while adding vehicle.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CompactFormPanel
      className="!mb-4"
      footer={
        <CompactFormFooter
          message="You are adding a new vehicle"
          messageCenter
          actionLabel={submitting ? "Saving…" : "Save"}
          onSave={() => void handleSave()}
          onCancel={handleCancel}
        />
      }
    >
      <CompactFormRow className="items-start">
        <CompactField label="License Plate" required>
          <input
            type="text"
            value={licensePlateNo}
            onChange={(e) => setLicensePlateNo(e.target.value)}
            className={compactInputClass}
            autoComplete="off"
          />
        </CompactField>

        <CompactField label="Make" required>
          <select
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setModel("");
              setYear("");
            }}
            disabled={companiesLoading}
            className={compactInputClass}
          >
            <option value="">{companiesLoading ? "Loading…" : "Select make"}</option>
            {companies.map((c) => (
              <option key={c.companyName} value={c.companyName}>
                {c.companyName}
              </option>
            ))}
          </select>
        </CompactField>

        <CompactField label="Model" required>
          <select
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setYear("");
            }}
            disabled={!name}
            className={compactInputClass}
          >
            <option value="">Select model</option>
            {modelOptions.map((m) => (
              <option key={m.modelName} value={m.modelName}>
                {m.modelName}
              </option>
            ))}
          </select>
        </CompactField>

        <CompactField label="Year" required>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            disabled={!model}
            className={compactInputClass}
          >
            <option value="">Select year</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </CompactField>

        <CompactField label="VIN">
          <input
            type="text"
            value={vinNo}
            onChange={(e) => setVinNo(e.target.value)}
            maxLength={17}
            className={compactInputClass}
            autoComplete="off"
          />
        </CompactField>

        <CompactField label="Odometer (km)">
          <input
            type="text"
            value={odometerReading}
            onChange={(e) => setOdometerReading(e.target.value)}
            inputMode="numeric"
            className={compactInputClass}
          />
        </CompactField>

        <CompactField label="Due odometer (km)">
          <input
            type="text"
            value={dueOdometerReading}
            onChange={(e) => setDueOdometerReading(e.target.value)}
            inputMode="numeric"
            className={compactInputClass}
          />
        </CompactField>
      </CompactFormRow>

      <CompactFormRow className="justify-start">
        <div className="flex flex-col items-start gap-1.5">
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
            <input
              type="checkbox"
              checked={attachImage}
              onChange={(e) => {
                setAttachImage(e.target.checked);
                if (!e.target.checked) setVehicleImage(null);
              }}
              className="h-3.5 w-3.5 accent-ad-green"
            />
            Attach vehicle image
          </label>
          {attachImage ? (
            <label className="inline-block cursor-pointer rounded border border-gray-400 bg-gray-200 px-3 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-300">
              Upload File
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  e.target.value = "";
                  setVehicleImage(file);
                }}
              />
            </label>
          ) : null}
          {attachImage && vehicleImage ? (
            <p className="text-xs text-gray-600">{vehicleImage.name}</p>
          ) : null}
        </div>
      </CompactFormRow>
    </CompactFormPanel>
  );
}
