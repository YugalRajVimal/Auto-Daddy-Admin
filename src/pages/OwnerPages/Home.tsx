import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import { ThoughtOfTheDayCard } from "../../components/portal/ThoughtOfTheDayCard";
import { PORTAL_HOME_HERO_IMAGE } from "../../lib/portalHeroImage";
import OwnerDueServiceHero from "../../components/owner/OwnerDueServiceHero";
import OwnerFaqsDialog from "../../components/owner/OwnerFaqsDialog";
import OwnerServiceSidebar from "../../components/owner/OwnerServiceSidebar";
import { useCarOwnerVehicles } from "../../hooks/useCarOwnerVehicles";
import { useCarOwnerDashboard, useCarOwnerServiceSidebar } from "../../hooks/useOwnerPortal";

export default function OwnerHomePage() {
  const { thoughtOfTheDay, faqsHeading, faqsDescription, loading } = useCarOwnerDashboard();
  const { indoor, outdoor, loading: servicesLoading } = useCarOwnerServiceSidebar();
  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useCarOwnerVehicles();
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [showDueService, setShowDueService] = useState(false);

  return (
    <PortalPageContent className="flex flex-col px-3 py-3 sm:px-4 md:py-4 lg:px-6">
      <PageMeta title="Home | AutoDaddy" description="Car owner home" />

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
        <OwnerServiceSidebar
          indoor={indoor}
          outdoor={outdoor}
          loading={servicesLoading}
          onNextDueServiceClick={() => setShowDueService((open) => !open)}
          nextDueServiceActive={showDueService}
          onFaqsClick={() => setFaqsOpen(true)}
        />

        <div className="relative min-h-[420px] flex-1 overflow-hidden lg:min-h-[calc(100vh-220px)]">
          {loading ? (
            <div className="flex h-full min-h-[420px] items-center justify-center bg-[#ececec]">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
            </div>
          ) : (
            <>
              <img
                src={PORTAL_HOME_HERO_IMAGE}
                alt="AutoDaddy hero"
                className="absolute inset-0 h-full w-full object-cover"
              />

              {showDueService ? (
                <OwnerDueServiceHero
                  vehicles={vehicles}
                  loading={vehiclesLoading}
                  error={vehiclesError}
                />
              ) : thoughtOfTheDay ? (
                <ThoughtOfTheDayCard text={thoughtOfTheDay} />
              ) : null}
            </>
          )}

        </div>
      </div>

      <OwnerFaqsDialog
        open={faqsOpen}
        onClose={() => setFaqsOpen(false)}
        heading={faqsHeading}
        description={faqsDescription}
      />
    </PortalPageContent>
  );
}
