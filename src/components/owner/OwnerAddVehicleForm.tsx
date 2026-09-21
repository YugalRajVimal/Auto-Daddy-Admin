import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { getJson, postFormData } from "../../api/mobileAuth";
import { useAuth } from "../../auth";
import { FormFieldError, fieldErrorClass } from "../../lib/validation/formUi";
import { ownerVehicleRequireVinSchema } from "../../lib/validation/schemas/vehicle";
import { OwnerFormFooter, ownerFormPanelClass } from "./ownerUi";
import {
  type CarCompaniesResponse,
  type CarCompanyCatalogItem,
  ownerVehicleFieldClass,
  ownerVehicleLabelClass,
  ownerVehicleSelectClass,
  trimVehicleApiMessage,
  type VehicleApiEnvelope,
} from "./ownerVehicleFormUtils";

/** Maps ownerVehicleRequireVinSchema field names to this form's UI field names. */
const SCHEMA_TO_UI_FIELD: Record<string, string> = {
  company: "name",
  model: "model",
  year: "year",
  licensePlate: "licensePlateNo",
  vin: "vinNo",
  odometer: "odometerReading",
};

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
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    setErrors({});
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

    const result = ownerVehicleRequireVinSchema.safeParse({
      company: nextName,
      model: nextModel,
      year: nextYear,
      licensePlate: nextPlate,
      vin: nextVin,
      odometer: nextOdometer,
    });
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const schemaKey = String(issue.path[0] ?? "");
        const uiKey = SCHEMA_TO_UI_FIELD[schemaKey] ?? schemaKey;
        if (!nextErrors[uiKey]) nextErrors[uiKey] = issue.message;
      }
      setErrors(nextErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setErrors({});

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

  const vinLen = vinNo.trim().length;
  const platePreview = licensePlateNo.trim().toUpperCase() || "YOUR PLATE";
  const titlePreview = [name, model].filter(Boolean).join(" ") || "New vehicle";

  return (
    <div className="flex flex-col">
      <div className={ownerFormPanelClass}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="block">
              <span className={ownerVehicleLabelClass}>License plate *</span>
              <input
                type="text"
                value={licensePlateNo}
                onChange={(e) => setLicensePlateNo(e.target.value)}
                autoComplete="off"
                placeholder="ABC 1234"
                disabled={submitting}
                className={fieldErrorClass(!!errors.licensePlateNo, ownerVehicleFieldClass)}
              />
              <FormFieldError message={errors.licensePlateNo} />
            </label>
            <label className="block">
              <span className={ownerVehicleLabelClass}>Make *</span>
              <select
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setModel("");
                  setYear("");
                }}
                disabled={companiesLoading || submitting}
                className={fieldErrorClass(!!errors.name, ownerVehicleSelectClass)}
              >
                <option value="">{companiesLoading ? "Loading…" : "Select make"}</option>
                {companies.map((c) => (
                  <option key={c.companyName} value={c.companyName}>
                    {c.companyName}
                  </option>
                ))}
              </select>
              <FormFieldError message={errors.name} />
            </label>

            <label className="block">
              <span className={ownerVehicleLabelClass}>Model *</span>
              <select
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setYear("");
                }}
                disabled={!name || submitting}
                className={fieldErrorClass(!!errors.model, ownerVehicleSelectClass)}
              >
                <option value="">Select model</option>
                {modelOptions.map((m) => (
                  <option key={m.modelName} value={m.modelName}>
                    {m.modelName}
                  </option>
                ))}
              </select>
              <FormFieldError message={errors.model} />
            </label>

            <label className="block">
              <span className={ownerVehicleLabelClass}>Year *</span>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={!model || submitting}
                className={fieldErrorClass(!!errors.year, ownerVehicleSelectClass)}
              >
                <option value="">Select year</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <FormFieldError message={errors.year} />
            </label>

            <label className="block">
              <span className={ownerVehicleLabelClass}>Odometer (km)</span>
              <input
                type="text"
                value={odometerReading}
                onChange={(e) => setOdometerReading(e.target.value.replace(/[^\d]/g, ""))}
                inputMode="numeric"
                placeholder="e.g. 18450"
                disabled={submitting}
                className={fieldErrorClass(!!errors.odometerReading, ownerVehicleFieldClass)}
              />
              <FormFieldError message={errors.odometerReading} />
            </label>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex items-end">
            <p className="text-sm font-semibold text-gray-700">
              {platePreview} <span className="font-normal text-gray-500">· {titlePreview}</span>
            </p>
          </div>
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block">
              <span className={ownerVehicleLabelClass}>
                VIN *{" "}
                <span className={vinLen === 17 ? "text-emerald-600" : "text-slate-400"}>
                  ({vinLen}/17)
                </span>
              </span>
              <input
                type="text"
                value={vinNo}
                onChange={(e) => setVinNo(e.target.value.toUpperCase())}
                maxLength={17}
                autoComplete="off"
                placeholder="17-character VIN"
                disabled={submitting}
                className={fieldErrorClass(!!errors.vinNo, `${ownerVehicleFieldClass} font-mono tracking-wide`)}
              />
              <FormFieldError message={errors.vinNo} />
            </label>
          </div>
        </div>
      </div>
      <OwnerFormFooter
        note="You are adding a vehicle to your profile. Fields marked * are required."
        onSave={() => void handleSave()}
        saving={submitting}
        onCancel={handleCancel}
      />
    </div>
  );
}
