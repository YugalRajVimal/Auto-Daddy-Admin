import { useCallback, useState } from "react";
import type { ServiceCategory, ServiceSubItem } from "../../hooks/useOwnerPortal";
import OwnerHeroPanel from "../../components/owner/OwnerHeroPanel";
import OwnerPageShell, { OwnerPageSidebar } from "../../components/owner/OwnerPageShell";
import OwnerServiceSidebar from "../../components/owner/OwnerServiceSidebar";
import { shopSidebarButtonClass } from "../../components/shop/shopSidebarStyles";
import { useCarOwnerVehicles } from "../../hooks/useCarOwnerVehicles";
import { useCarOwnerDashboard, useCarOwnerServiceSidebar } from "../../hooks/useOwnerPortal";

export default function OwnerHomePage() {
  const { thoughtOfTheDay, loading } = useCarOwnerDashboard();
  const { indoor, outdoor, loading: servicesLoading } = useCarOwnerServiceSidebar();
  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useCarOwnerVehicles();
  const [showDueService, setShowDueService] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceCategory | null>(null);
  const [selectedSubServiceId, setSelectedSubServiceId] = useState<string | null>(null);

  const handleServiceSelect = useCallback((service: ServiceCategory) => {
    setShowDueService(false);
    setSelectedService(service);
    if (service.subServices.length === 0) {
      setSelectedSubServiceId(null);
    } else {
      const first = service.subServices[0];
      setSelectedSubServiceId(first.id ?? first.name);
    }
  }, []);

  const handleSubServiceSelect = useCallback((sub: ServiceSubItem) => {
    setSelectedSubServiceId(sub.id ?? sub.name);
  }, []);

  const pageHeading = showDueService ? "Next Due Service" : "Dashboard";

  return (
    <OwnerPageShell
      pageHeading={pageHeading}
      metaTitle="Home | AutoDaddy"
      metaDescription="Car owner home"
      headerAction={
        showDueService ? (
          <button
            type="button"
            onClick={() => setShowDueService(false)}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-ad-purple hover:bg-gray-50"
          >
            Back
          </button>
        ) : undefined
      }
      customSidebar={
        <OwnerPageSidebar
          footer={
            <button
              type="button"
              onClick={() => {
                setSelectedService(null);
                setSelectedSubServiceId(null);
                setShowDueService((open) => !open);
              }}
              className={shopSidebarButtonClass(showDueService, "w-full justify-center")}
            >
              Next Due Service
            </button>
          }
        >
          <OwnerServiceSidebar
            indoor={indoor}
            outdoor={outdoor}
            loading={servicesLoading}
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
      <OwnerHeroPanel
        thoughtOfTheDay={thoughtOfTheDay}
        loading={loading}
        showDueService={showDueService}
        vehicles={vehicles}
        vehiclesLoading={vehiclesLoading}
        vehiclesError={vehiclesError}
        onDueServiceClose={() => setShowDueService(false)}
      />
    </OwnerPageShell>
  );
}
