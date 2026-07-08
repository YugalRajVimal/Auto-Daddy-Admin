import { useCallback, useState } from "react";
import { useAuth } from "../../auth";
import type { ServiceCategory, ServiceSubItem } from "../../hooks/useOwnerPortal";
import OwnerDashboardServicePanel from "../../components/owner/OwnerDashboardServicePanel";
import OwnerHeroPanel from "../../components/owner/OwnerHeroPanel";
import OwnerPageShell, { OwnerPageSidebar } from "../../components/owner/OwnerPageShell";
import OwnerServiceSidebar from "../../components/owner/OwnerServiceSidebar";
import OwnerServiceTilesPanel from "../../components/owner/OwnerServiceTilesPanel";
import { useCarOwnerDashboard, useCarOwnerServiceSidebar } from "../../hooks/useOwnerPortal";

type OwnerHomeView = "dashboard" | "service" | "shops";

export default function OwnerHomePage() {
  const { token } = useAuth();
  const { thoughtOfTheDay, loading } = useCarOwnerDashboard();
  const { indoor, outdoor, loading: servicesLoading } = useCarOwnerServiceSidebar();
  const [view, setView] = useState<OwnerHomeView>("dashboard");
  const [selectedService, setSelectedService] = useState<ServiceCategory | null>(null);
  const [selectedSubServiceId, setSelectedSubServiceId] = useState<string | null>(null);

  const handleServiceSelect = useCallback((service: ServiceCategory) => {
    setSelectedService(service);
    setSelectedSubServiceId(null);
    setView(service.subServices.length > 0 ? "service" : "shops");
  }, []);

  const handleSubServiceSelect = useCallback((sub: ServiceSubItem) => {
    setSelectedSubServiceId(sub.id ?? sub.name);
    setView("shops");
  }, []);

  return (
    <OwnerPageShell
      pageHeading="Dashboard"
      metaTitle="Home | AutoDaddy"
      metaDescription="Car owner home"
      customSidebar={
        <OwnerPageSidebar>
          <OwnerServiceSidebar
            indoor={indoor}
            outdoor={outdoor}
            loading={servicesLoading}
            flat
            selectedServiceId={selectedService?.id ?? null}
            selectedSubServiceId={selectedSubServiceId}
            onServiceSelect={handleServiceSelect}
            onSubServiceSelect={handleSubServiceSelect}
          />
        </OwnerPageSidebar>
      }
      heroCardFlush
      heroBackgroundImage={false}
      contentTopOffset
      contentFillHeight
    >
      {view === "dashboard" || !selectedService ? (
        <OwnerHeroPanel thoughtOfTheDay={thoughtOfTheDay} loading={loading} />
      ) : view === "service" ? (
        <OwnerServiceTilesPanel
          indoor={indoor}
          outdoor={outdoor}
          selectedService={selectedService}
          onServiceSelect={handleServiceSelect}
          onCloseService={() => {
            setSelectedService(null);
            setSelectedSubServiceId(null);
            setView("dashboard");
          }}
          onSubServiceSelect={handleSubServiceSelect}
        />
      ) : (
        <div className="flex h-full min-h-0 flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setView("service")}
              className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedService(null);
                setSelectedSubServiceId(null);
                setView("dashboard");
              }}
              className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <OwnerDashboardServicePanel
              service={selectedService}
              selectedSubServiceId={selectedSubServiceId}
              token={token}
            />
          </div>
        </div>
      )}
    </OwnerPageShell>
  );
}
