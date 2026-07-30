import { useEffect, useMemo, useState } from "react";
import OwnerPageShell, {
  OwnerPageSearchInput,
} from "../../components/owner/OwnerPageShell";
import { OwnerJobCardsTable } from "../../components/owner/OwnerPanelTables";
import {
  ownerVehicleLabelClass,
  ownerVehicleSelectClass,
} from "../../components/owner/ownerVehicleFormUtils";
import { useCarOwnerJobCards } from "../../hooks/useCarOwnerJobCards";
import { useCarOwnerVehicles } from "../../hooks/useCarOwnerVehicles";
import {
  businessName,
  jobCardLicensePlate,
  jobChipLabel,
  serviceTypeLabel,
} from "../../lib/carOwnerJobCards";
import {
  vehicleSidebarLabel,
  type CarOwnerVehicle,
} from "../../lib/carOwnerVehicles";

const PAGE_SIZE = 10;

function vehicleOptionLabel(vehicle: CarOwnerVehicle, index: number): string {
  const plate = vehicle.licensePlateNo?.trim().toUpperCase();
  if (plate) return plate;
  const make = vehicleSidebarLabel(vehicle);
  return make || `Vehicle ${index + 1}`;
}

export default function OwnerJobCardsPage() {
  const countryCode = "+1";
  const { vehicles } = useCarOwnerVehicles();
  const [vehicleFilter, setVehicleFilter] = useState("");
  const { items, loading, error, refresh } = useCarOwnerJobCards(vehicleFilter || null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((jc) => {
      const hay = [
        jobChipLabel(jc),
        businessName(jc.business),
        jobCardLicensePlate(jc),
        serviceTypeLabel(jc),
        jc.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search, vehicleFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <OwnerPageShell
      pageHeading="Job Cards"
      metaTitle="Job Cards | AutoDaddy"
      metaDescription="Car owner job cards"
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <p className="text-sm font-semibold text-gray-800">{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-md bg-ad-purple px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-end gap-2">
            {vehicles.length > 0 ? (
              <div className="min-w-[11rem] sm:min-w-[14rem]">
                <label className={ownerVehicleLabelClass} htmlFor="owner-job-cards-vehicle-filter">
                  Vehicle
                </label>
                <select
                  id="owner-job-cards-vehicle-filter"
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  aria-label="Filter by vehicle"
                  className={ownerVehicleSelectClass}
                >
                  <option value="">All vehicles</option>
                  {vehicles.map((vehicle, index) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicleOptionLabel(vehicle, index)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <OwnerPageSearchInput value={search} onChange={setSearch} placeholder="Search job cards…" />
          </div>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-600">
              {search.trim() || vehicleFilter
                ? "No job cards match your filters."
                : "No job cards yet."}
            </p>
          ) : (
            <>
              <OwnerJobCardsTable rows={pageRows} countryCode={countryCode} />
              {totalPages > 1 ? (
                <div className="flex items-center justify-between gap-2 border-t border-gray-200 pt-3 text-xs text-gray-800">
                  <span>
                    Page {page} of {totalPages} ({filtered.length} total)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded border border-gray-300 bg-white px-2 py-1 font-semibold text-ad-purple disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="rounded border border-gray-300 bg-white px-2 py-1 font-semibold text-ad-purple disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </OwnerPageShell>
  );
}
