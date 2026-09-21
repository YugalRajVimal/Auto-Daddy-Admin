import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../../auth";
import OwnerDashboardServicePanel from "../../../components/owner/OwnerDashboardServicePanel";
import OwnerHeroPanel from "../../../components/owner/OwnerHeroPanel";
import OwnerPageShell from "../../../components/owner/OwnerPageShell";
import OwnerServiceTilesPanel from "../../../components/owner/OwnerServiceTilesPanel";
import { OwnerSideButton, ownerSideListClass } from "../../../components/owner/ownerUi";
import { Skeleton } from "../../../components/common/Skeleton";
import type { ServiceCategory, ServiceSubItem } from "../../../hooks/useOwnerPortal";
import { useCarOwnerDashboard, useCarOwnerServiceSidebar } from "../../../hooks/useOwnerPortal";
import { isOutdoorServiceCategory } from "../../../lib/serviceCatalog";

type OwnerHomeView = "thought" | "service" | "shops";

const serviceKey = (service: ServiceCategory) => service.id ?? service.name;

/**
 * Home (mockup): service categories in the left panel; Thought of the Day by default,
 * then sub-service tiles → vehicle make → nearby shops for the chosen category.
 */
export default function OwnerHomePage() {
  const { token } = useAuth();
  const { thoughtOfTheDay, thoughtOfTheDayLiked, thoughtLikeBusy, toggleThoughtLike, loading } =
    useCarOwnerDashboard();
  const { indoor, outdoor, loading: servicesLoading } = useCarOwnerServiceSidebar();
  const [view, setView] = useState<OwnerHomeView>("thought");
  const [selectedService, setSelectedService] = useState<ServiceCategory | null>(null);
  const [selectedSubServiceId, setSelectedSubServiceId] = useState<string | null>(null);

  const allServices = useMemo(() => [...indoor, ...outdoor], [indoor, outdoor]);

  const selectService = useCallback((service: ServiceCategory) => {
    setSelectedService(service);
    setSelectedSubServiceId(null);
    setView(service.subServices.length > 0 ? "service" : "shops");
  }, []);

  const selectSubService = useCallback((sub: ServiceSubItem) => {
    setSelectedSubServiceId(sub.id ?? sub.name);
    setView("shops");
  }, []);

  const goHome = useCallback(() => {
    setSelectedService(null);
    setSelectedSubServiceId(null);
    setView("thought");
  }, []);

  const serviceSidebar = (
    <div className={ownerSideListClass}>
      {servicesLoading ? (
        Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-11 w-40 shrink-0 rounded-xl lg:w-full" />)
      ) : allServices.length === 0 ? (
        <p className="px-1 text-sm text-gray-500">No services available</p>
      ) : (
        allServices.map((service) => (
          <OwnerSideButton
            key={serviceKey(service)}
            label={service.name}
            tone={isOutdoorServiceCategory(service) ? "grey" : "purple"}
            active={selectedService != null && serviceKey(selectedService) === serviceKey(service)}
            onClick={() => selectService(service)}
          />
        ))
      )}
    </div>
  );

  return (
    <OwnerPageShell
      pageHeading=""
      metaTitle="Home | AutoDaddy"
      metaDescription="Car owner home"
      customSidebar={serviceSidebar}
      subNavPlacement="after"
      noPanel
    >
      {view === "thought" || !selectedService ? (
        <OwnerHeroPanel
          className="!h-full min-h-[480px] !rounded-none !border-0 lg:min-h-[calc(100vh-200px)]"
          thoughtOfTheDay={thoughtOfTheDay}
          thoughtOfTheDayLiked={thoughtOfTheDayLiked}
          thoughtLikeBusy={thoughtLikeBusy}
          onToggleThoughtLike={() => void toggleThoughtLike()}
          loading={loading}
        />
      ) : view === "service" ? (
        <OwnerServiceTilesPanel
          indoor={indoor}
          outdoor={outdoor}
          selectedService={selectedService}
          onServiceSelect={selectService}
          onCloseService={goHome}
          onSubServiceSelect={selectSubService}
        />
      ) : (
        <OwnerDashboardServicePanel
          service={selectedService}
          selectedSubServiceId={selectedSubServiceId}
          token={token}
          onExit={() => (selectedService.subServices.length > 0 ? setView("service") : goHome())}
        />
      )}
    </OwnerPageShell>
  );
}
