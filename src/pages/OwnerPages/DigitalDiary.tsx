import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import OwnerPageShell, { OwnerPageSidebar } from "../../components/owner/OwnerPageShell";
import { OwnerVehicleDocumentsTable } from "../../components/owner/OwnerPanelTables";
import OwnerVehiclePlateSidebar from "../../components/owner/OwnerVehiclePlateSidebar";
import { useOwnerNavReset, useOwnerSidebarDefault } from "../../hooks/useOwnerNavReset";
import { useCarOwnerVehicles } from "../../hooks/useCarOwnerVehicles";
import { useCarOwnerDocuments } from "../../hooks/useCarOwnerDocuments";

export default function OwnerDigitalDiaryPage() {
  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useCarOwnerVehicles();
  const { sections, loading, error, mutating, busyField, refresh, uploadDocumentField } = useCarOwnerDocuments();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const reset = useCallback(() => {
    setSelectedVehicleId(vehicles[0]?.id ?? null);
  }, [vehicles]);

  useOwnerSidebarDefault(!vehiclesLoading, reset);
  useOwnerNavReset(reset);

  const selectedSection = useMemo(() => {
    if (!selectedVehicleId) return null;
    return sections.find((s) => s.vehicleId === selectedVehicleId) ?? null;
  }, [sections, selectedVehicleId]);

  const handleUpload = async (vehicleId: string, field: string, file: File) => {
    const res = await uploadDocumentField(vehicleId, field as never, file);
    if (res.ok) toast.success(res.message ?? "Document saved.");
    else toast.error(res.message ?? "Could not upload document.");
  };

  return (
    <OwnerPageShell
      pageHeading="Digital Diary"
      metaTitle="Digital Diary | AutoDaddy"
      metaDescription="Car owner documents"
      customSidebar={
        <OwnerPageSidebar>
          <OwnerVehiclePlateSidebar
            vehicles={vehicles}
            loading={vehiclesLoading}
            selectedVehicleId={selectedVehicleId}
            onSelect={setSelectedVehicleId}
          />
        </OwnerPageSidebar>
      }
      heroCardFlush
      contentTopOffset
    >
      {vehiclesError ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-red-600">
          {vehiclesError}
        </div>
      ) : loading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm font-semibold text-gray-800">{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-md bg-ad-purple px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      ) : !selectedVehicleId ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-600">
          Select a vehicle from the left to view documents.
        </div>
      ) : !selectedSection ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-600">
          No document record found for this vehicle yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded border border-gray-300 bg-white shadow-sm">
            <div className="bg-ad-purple px-4 py-2 text-center font-bold text-white">Documents</div>
            <div className="p-2 sm:p-3">
              <OwnerVehicleDocumentsTable
                vehicleId={selectedSection.vehicleId}
                licensePlate={selectedSection.title}
                vehicleDetails={selectedSection.subtitle}
                fields={selectedSection.fields.map((f) => ({ key: f.key, label: f.label, uri: f.uri }))}
                busyField={busyField}
                mutating={mutating}
                onUpload={(vehicleId, field, file) => void handleUpload(vehicleId, field, file)}
              />
            </div>
          </div>
        </div>
      )}
    </OwnerPageShell>
  );
}

