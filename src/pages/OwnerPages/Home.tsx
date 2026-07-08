import { useCallback, useState } from "react";
import { useAuth } from "../../auth";
import type { ServiceCategory, ServiceSubItem } from "../../hooks/useOwnerPortal";
import OwnerDashboardServicePanel from "../../components/owner/OwnerDashboardServicePanel";
import OwnerHeroPanel from "../../components/owner/OwnerHeroPanel";
import OwnerPageShell, { OwnerPageSidebar } from "../../components/owner/OwnerPageShell";
import OwnerServiceSidebar from "../../components/owner/OwnerServiceSidebar";
import OwnerUpdateOdometerFooter from "../../components/owner/OwnerUpdateOdometerFooter";
import OwnerUpdateOdometerPanel from "../../components/owner/OwnerUpdateOdometerPanel";
import { useCarOwnerVehicles } from "../../hooks/useCarOwnerVehicles";
import { useCarOwnerDashboard, useCarOwnerServiceSidebar } from "../../hooks/useOwnerPortal";

export default function OwnerHomePage() {
  const { token } = useAuth();
  const { thoughtOfTheDay, loading } = useCarOwnerDashboard();
  const { indoor, outdoor, loading: servicesLoading } = useCarOwnerServiceSidebar();
  const { vehicles, loading: vehiclesLoading, error: vehiclesError, refresh: refreshVehicles } =
    useCarOwnerVehicles();
  const [showOdometer, setShowOdometer] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceCategory | null>(null);
  const [selectedSubServiceId, setSelectedSubServiceId] = useState<string | null>(null);

  const handleServiceSelect = useCallback((service: ServiceCategory) => {
    setShowOdometer(false);
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

  const closeOdometer = useCallback(() => setShowOdometer(false), []);
  const toggleOdometer = useCallback(() => setShowOdometer((open) => !open), []);

  return (
    <OwnerPageShell
      pageHeading="Dashboard"
      metaTitle="Home | AutoDaddy"
      metaDescription="Car owner home"
      customSidebar={
        <OwnerPageSidebar footer={<OwnerUpdateOdometerFooter onClick={toggleOdometer} active={showOdometer} />}>
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
      {showOdometer ? (
        <OwnerUpdateOdometerPanel
          vehicles={vehicles}
          loading={vehiclesLoading}
          error={vehiclesError}
          token={token}
          onBack={closeOdometer}
          onSaved={() => void refreshVehicles()}
        />
      ) : selectedService ? (
        <OwnerDashboardServicePanel
          service={selectedService}
          selectedSubServiceId={selectedSubServiceId}
          token={token}
        />
      ) : (
        <OwnerHeroPanel thoughtOfTheDay={thoughtOfTheDay} loading={loading} />
      )}
    </OwnerPageShell>
  );
}
