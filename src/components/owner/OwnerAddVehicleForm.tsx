import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiTruck, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { getJson, postFormData } from "../../api/mobileAuth";
import { useAuth } from "../../auth";
import {
  type CarCompaniesResponse,
  type CarCompanyCatalogItem,
  isValidVehicleYear,
  ownerVehicleFieldClass,
  ownerVehicleLabelClass,
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

  const [companies, setCompanies] = useState<CarCompanyCatalogItem[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [licensePlateNo, setLicensePlateNo] = useState("");
  const [vinNo, setVinNo] = useState("");
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [odometerReading, setOdometerReading] = useState("");

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

    if (!nextPlate || !nextName || !nextModel || !nextYear) {
      toast.error("Plate, make, model, and year are required.");
      return;
    }
    if (!nextVin || nextVin.length !== 17) {
      toast.error("VIN is required and must be exactly 17 characters.");
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
    <div className="overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br from-sky-50 via-white to-indigo-50 shadow-[0_10px_28px_rgba(15,23,42,0.06)] ring-1 ring-sky-100">
      <div className="border-b border-sky-100/80 bg-white/70 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 shadow-sm ring-1 ring-sky-100">
              <FiTruck size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">Garage</p>
              <h3 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">Add vehicle</h3>
              <p className="mt-1 text-sm text-slate-600">
                Enter plate, make, and odometer to start tracking this car.
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-white/90 px-3 py-2 text-right shadow-sm ring-1 ring-black/5">
            <p className="text-base font-bold tracking-tight text-slate-900">{platePreview}</p>
            <p className="text-xs font-medium text-slate-500">{titlePreview}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <section className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
          <h4 className="mb-3 text-sm font-bold text-slate-900">Identity</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={ownerVehicleLabelClass}>License plate *</span>
              <input
                type="text"
                value={licensePlateNo}
                onChange={(e) => setLicensePlateNo(e.target.value)}
                autoComplete="off"
                placeholder="ABC 1234"
                disabled={submitting}
                className={ownerVehicleFieldClass}
              />
            </label>
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
                className={`${ownerVehicleFieldClass} font-mono tracking-wide`}
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
          <h4 className="mb-3 text-sm font-bold text-slate-900">Vehicle details</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                className={ownerVehicleSelectClass}
              >
                <option value="">{companiesLoading ? "Loading…" : "Select make"}</option>
                {companies.map((c) => (
                  <option key={c.companyName} value={c.companyName}>
                    {c.companyName}
                  </option>
                ))}
              </select>
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
                className={ownerVehicleSelectClass}
              >
                <option value="">Select model</option>
                {modelOptions.map((m) => (
                  <option key={m.modelName} value={m.modelName}>
                    {m.modelName}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={ownerVehicleLabelClass}>Year *</span>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={!model || submitting}
                className={ownerVehicleSelectClass}
              >
                <option value="">Select year</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
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
                className={ownerVehicleFieldClass}
              />
            </label>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sky-100/80 bg-white/80 px-4 py-3 sm:px-5">
        <p className="text-xs text-slate-500 sm:text-sm">Required fields are marked with *</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <FiX size={15} /> Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSave()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiPlus size={15} /> {submitting ? "Saving…" : "Save vehicle"}
          </button>
        </div>
      </div>
    </div>
  );
}
