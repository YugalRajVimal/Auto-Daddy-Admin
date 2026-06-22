import { useRef, useState } from "react";
import { FiChevronDown, FiExternalLink } from "react-icons/fi";
import { toast } from "react-toastify";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import { AddNewButton } from "../../components/admin/AdminPage";
import { CompactFormPanel } from "../../components/admin/ContentPanel";
import OwnerAddVehicleForm from "../../components/owner/OwnerAddVehicleForm";
import { putFormData } from "../../api/mobileAuth";
import { useAuth } from "../../auth";
import { useCarOwnerVehicles } from "../../hooks/useCarOwnerVehicles";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import { vehicleSidebarLabel, type CarOwnerVehicle } from "../../lib/carOwnerVehicles";

function DetailChip({
  label,
  value,
  placeholder,
  fullWidth,
}: {
  label: string;
  value: string;
  placeholder?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`rounded-md border border-ad-green-dark/20 bg-white/90 px-3 py-2 ${fullWidth ? "col-span-2 sm:col-span-3" : ""}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-ad-green-dark">{label}</p>
      <p className={`truncate text-sm ${placeholder ? "text-gray-400" : "font-semibold text-gray-800"}`}>
        {value || label}
      </p>
    </div>
  );
}

function vehicleImageUri(v: CarOwnerVehicle): string | null {
  const path = v.carImage ?? v.carImages?.[0] ?? null;
  return normalizeMediaUrl(path);
}

function vehicleGalleryItems(v: CarOwnerVehicle): Array<{ label: string; uri: string }> {
  const items: Array<{ label: string; path?: string | null }> = [
    { label: "Plate image", path: v.licensePlateImagePath },
    { label: "Plate front", path: v.licensePlateFrontImagePath },
    { label: "Plate back", path: v.licensePlateBackImagePath },
    { label: "Car image", path: v.carImage },
    ...(v.carImages ?? []).map((path, index) => ({ label: `Car photo ${index + 1}`, path })),
  ];
  const seen = new Set<string>();
  const out: Array<{ label: string; uri: string }> = [];
  for (const item of items) {
    const uri = normalizeMediaUrl(item.path);
    if (uri && !seen.has(uri)) {
      seen.add(uri);
      out.push({ label: item.label, uri });
    }
  }
  return out;
}

function VehicleDetails({
  vehicle,
  uploading,
  onUploadImage,
}: {
  vehicle: CarOwnerVehicle;
  uploading: boolean;
  onUploadImage: (vehicleId: string, file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUri = vehicleImageUri(vehicle);
  const gallery = vehicleGalleryItems(vehicle);

  const plate = vehicle.licensePlateNo?.trim() ?? "";
  const makeName = (vehicle.make?.name ?? "").trim();
  const modelName = (vehicle.make?.model ?? "").trim();
  const year = vehicle.year != null && String(vehicle.year).trim() ? String(vehicle.year).trim() : "";
  const odo =
    vehicle.odometerReading != null && String(vehicle.odometerReading).trim()
      ? `${String(vehicle.odometerReading).trim()} km`
      : "";
  const dueOdo =
    vehicle.dueOdometerReading != null && String(vehicle.dueOdometerReading).trim()
      ? `${String(vehicle.dueOdometerReading).trim()} km`
      : "";
  const vin = vehicle.vinNo?.trim() ?? "";

  return (
    <div className="space-y-4 border-t border-ad-green-dark/15 pt-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex shrink-0 flex-col items-center sm:w-[148px]">
          <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-xl border-2 border-ad-green bg-white shadow-sm">
            {imageUri ? (
              <img src={imageUri} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-gray-400">No image</span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onUploadImage(vehicle.id, file);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 w-36 rounded border border-ad-form-border bg-white px-2 py-1.5 text-xs font-semibold text-ad-green-dark hover:bg-ad-green-light disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload Image"}
          </button>
        </div>

        <div className="min-h-[9rem] flex-1 rounded-xl bg-ad-green-light/80 p-4 ring-1 ring-ad-green-dark/10">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <DetailChip label="Plate" value={plate} placeholder={!plate} />
            <DetailChip label="Make" value={makeName} placeholder={!makeName} />
            <DetailChip label="Model" value={modelName} placeholder={!modelName} />
            <DetailChip label="Year" value={year} placeholder={!year} />
            <DetailChip label="Odometer" value={odo} placeholder={!odo} />
            <DetailChip label="Due odometer" value={dueOdo} placeholder={!dueOdo} />
            <DetailChip label="VIN" value={vin} placeholder={!vin} fullWidth />
          </div>
        </div>
      </div>

      {gallery.length > 0 ? (
        <div className="rounded-xl border border-ad-green-dark/15 bg-white/70 p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ad-green-dark">Photos & documents</p>
          <div className="flex flex-wrap gap-2">
            {gallery.map((item) => (
              <a
                key={`${item.label}-${item.uri}`}
                href={item.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-ad-green-dark/25 bg-ad-green-light/50 px-3 py-1 text-xs font-semibold text-ad-green-dark hover:bg-ad-green-light"
              >
                {item.label}
                <FiExternalLink size={12} aria-hidden />
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function VehicleRow({
  vehicle,
  expanded,
  onToggle,
  uploading,
  onUploadImage,
}: {
  vehicle: CarOwnerVehicle;
  expanded: boolean;
  uploading: boolean;
  onToggle: () => void;
  onUploadImage: (vehicleId: string, file: File) => void;
}) {
  const imageUri = vehicleImageUri(vehicle);
  const title = vehicleSidebarLabel(vehicle);
  const plate = vehicle.licensePlateNo?.trim() || "—";

  return (
    <div className="pb-4">
      <CompactFormPanel
        className={`!mb-0 overflow-hidden transition-all duration-300 ${
          expanded ? "shadow-lg ring-2 ring-ad-purple/35 border-ad-purple/25" : "shadow-sm hover:shadow-md"
        }`}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="group flex w-full items-center gap-4 text-left"
        >
          <div
            className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-all duration-300 ${
              expanded ? "h-16 w-16 border-ad-purple/30" : "h-12 w-12 border-ad-green group-hover:border-ad-green-dark"
            }`}
          >
            {imageUri ? (
              <img src={imageUri} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-ad-green-dark">Car</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`truncate font-bold transition-colors ${
                expanded ? "text-base text-ad-purple" : "text-sm text-gray-900 group-hover:text-ad-green-dark"
              }`}
            >
              {title}
            </p>
            <p className="mt-0.5 truncate text-xs text-gray-600">Plate: {plate}</p>
          </div>

          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
              expanded ? "bg-ad-purple/10 text-ad-purple" : "bg-white/60 text-gray-600 group-hover:bg-white"
            }`}
          >
            <FiChevronDown
              className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              size={18}
              aria-hidden
            />
          </span>
        </button>

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            {expanded ? (
              <VehicleDetails vehicle={vehicle} uploading={uploading} onUploadImage={onUploadImage} />
            ) : null}
          </div>
        </div>
      </CompactFormPanel>
    </div>
  );
}

export default function OwnerVehiclesPage() {
  const { token } = useAuth();
  const { vehicles, loading, error, refresh } = useCarOwnerVehicles();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleToggle = (vehicleId: string) => {
    setExpandedId((current) => (current === vehicleId ? null : vehicleId));
  };

  const handleUploadImage = async (vehicleId: string, file: File) => {
    if (!token) {
      toast.error("Please log in again.");
      return;
    }

    setUploadingId(vehicleId);
    try {
      const body = new FormData();
      body.append("vehicleImage", file, file.name || "vehicle.jpg");
      const res = await putFormData<{ message?: string }>(`/api/user/vehicle/${vehicleId}`, body, token);
      const message = typeof res.data?.message === "string" ? res.data.message.trim() : "";
      if (!res.ok) {
        toast.error(message || "Could not upload image.");
        return;
      }
      toast.success(message || "Image uploaded.");
      void refresh();
    } catch {
      toast.error("Network error while uploading image.");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <PortalPageContent>
      <PageMeta title="Vehicles | AutoDaddy" description="Car owner vehicles" />

      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ad-green md:text-2xl">Vehicles</h1>
        {!showForm ? <AddNewButton onClick={() => setShowForm(true)} /> : null}
      </div>

      {showForm ? (
        <OwnerAddVehicleForm
          onCancel={() => setShowForm(false)}
          onAdded={() => void refresh()}
        />
      ) : null}

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
        </div>
      ) : error ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm font-semibold text-gray-800">{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-md bg-ad-purple px-4 py-2 text-sm font-semibold text-white hover:bg-ad-purple-dark"
          >
            Try again
          </button>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-gray-600">No vehicles added yet.</p>
          {!showForm ? <AddNewButton onClick={() => setShowForm(true)} /> : null}
        </div>
      ) : (
        <div className="flex flex-col">
          {vehicles.map((vehicle) => (
            <VehicleRow
              key={vehicle.id}
              vehicle={vehicle}
              expanded={expandedId === vehicle.id}
              onToggle={() => handleToggle(vehicle.id)}
              uploading={uploadingId === vehicle.id}
              onUploadImage={handleUploadImage}
            />
          ))}
        </div>
      )}
    </PortalPageContent>
  );
}
