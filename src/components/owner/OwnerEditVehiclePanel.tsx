import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiSave, FiTruck, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { getJson, putJson } from "../../api/mobileAuth";
import { useAuth } from "../../auth";
import type { CarOwnerVehicle } from "../../lib/carOwnerVehicles";
import {
  type CarCompaniesResponse,
  type CarCompanyCatalogItem,
  isValidVehicleYear,
  ownerVehicleFieldClass,
  ownerVehicleLabelClass,
  ownerVehicleReadOnlyFieldClass,
  ownerVehicleReadOnlySelectClass,
  ownerVehicleSelectClass,
  trimVehicleApiMessage,
  type VehicleApiEnvelope,
} from "./ownerVehicleFormUtils";

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

  const [editing, setEditing] = useState(false);
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

  const resetFromVehicle = (v: CarOwnerVehicle) => {
    const next = vehicleToFormState(v);
    setLicensePlateNo(next.licensePlateNo);
    setVinNo(next.vinNo);
    setName(next.name);
    setModel(next.model);
    setYear(next.year);
    setOdometerReading(next.odometerReading);
    setDueOdometerReading(next.dueOdometerReading);
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

      toast.success(message || "Vehicle updated.");
      setEditing(false);
      onUpdated();
    } catch {
      toast.error("Network error while updating vehicle.");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldsDisabled = !editing || submitting;
  const fieldClass = editing ? ownerVehicleFieldClass : ownerVehicleReadOnlyFieldClass;
  const selectClass = editing ? ownerVehicleSelectClass : ownerVehicleReadOnlySelectClass;
  const vinLen = vinNo.trim().length;
  const platePreview = licensePlateNo.trim().toUpperCase() || "—";
  const titlePreview = [name, model, year].filter(Boolean).join(" · ") || "Vehicle details";

  return (
    <div className="overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-[0_10px_28px_rgba(15,23,42,0.06)] ring-1 ring-emerald-100">
      <div className="border-b border-emerald-100/80 bg-white/70 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm ring-1 ring-emerald-100">
              <FiTruck size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
                {editing ? "Editing" : "Details"}
              </p>
              <h3 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">{platePreview}</h3>
              <p className="mt-1 text-sm text-slate-600">{titlePreview}</p>
            </div>
          </div>
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <FiEdit2 size={15} /> Edit
            </button>
          ) : null}
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
                disabled={fieldsDisabled}
                autoComplete="off"
                placeholder="ABC 1234"
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className={ownerVehicleLabelClass}>
                VIN{" "}
                {editing ? (
                  <span className={vinLen === 17 || vinLen === 0 ? "text-emerald-600" : "text-amber-600"}>
                    ({vinLen}/17)
                  </span>
                ) : null}
              </span>
              <input
                type="text"
                value={vinNo}
                onChange={(e) => setVinNo(e.target.value.toUpperCase())}
                maxLength={17}
                disabled={fieldsDisabled}
                autoComplete="off"
                placeholder="17-character VIN"
                className={`${fieldClass} font-mono tracking-wide`}
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
          <h4 className="mb-3 text-sm font-bold text-slate-900">Vehicle details</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className={ownerVehicleLabelClass}>Make *</span>
              <select
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setModel("");
                  setYear("");
                }}
                disabled={fieldsDisabled || companiesLoading}
                className={selectClass}
              >
                <option value="">{companiesLoading ? "Loading…" : "Select make"}</option>
                {companies.map((c) => (
                  <option key={c.companyName} value={c.companyName}>
                    {c.companyName}
                  </option>
                ))}
                {name && !companies.some((c) => c.companyName === name) ? (
                  <option value={name}>{name}</option>
                ) : null}
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
                disabled={fieldsDisabled || !name}
                className={selectClass}
              >
                <option value="">Select model</option>
                {modelOptions.map((m) => (
                  <option key={m.modelName} value={m.modelName}>
                    {m.modelName}
                  </option>
                ))}
                {model && !modelOptions.some((m) => m.modelName === model) ? (
                  <option value={model}>{model}</option>
                ) : null}
              </select>
            </label>

            <label className="block">
              <span className={ownerVehicleLabelClass}>Year *</span>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={fieldsDisabled || !model}
                className={selectClass}
              >
                <option value="">Select year</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
                {year && !yearOptions.includes(year) ? <option value={year}>{year}</option> : null}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
          <h4 className="mb-3 text-sm font-bold text-slate-900">Odometer</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={ownerVehicleLabelClass}>Current reading (km)</span>
              <input
                type="text"
                value={odometerReading}
                onChange={(e) => setOdometerReading(e.target.value.replace(/[^\d]/g, ""))}
                inputMode="numeric"
                disabled={fieldsDisabled}
                placeholder="e.g. 18450"
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className={ownerVehicleLabelClass}>Service due (km)</span>
              <input
                type="text"
                value={dueOdometerReading}
                onChange={(e) => setDueOdometerReading(e.target.value.replace(/[^\d]/g, ""))}
                inputMode="numeric"
                disabled={fieldsDisabled}
                placeholder="e.g. 20000"
                className={fieldClass}
              />
            </label>
          </div>
        </section>
      </div>

      {editing ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-100/80 bg-white/80 px-4 py-3 sm:px-5">
          <p className="text-xs text-slate-500 sm:text-sm">Changes save to this vehicle in your garage.</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={handleCancelEdit}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <FiX size={15} /> Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleUpdate()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiSave size={15} /> {submitting ? "Updating…" : "Save changes"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
