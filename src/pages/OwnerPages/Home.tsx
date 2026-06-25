import { useState } from "react";
import { ThoughtOfTheDayCard } from "../../components/portal/ThoughtOfTheDayCard";
import { PORTAL_HOME_HERO_IMAGE } from "../../lib/portalHeroImage";
import OwnerDueServiceHero from "../../components/owner/OwnerDueServiceHero";
import OwnerPageShell, { ownerPageLayoutClass } from "../../components/owner/OwnerPageShell";
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
    <OwnerPageShell
      metaTitle="Home | AutoDaddy"
      metaDescription="Car owner home"
      faqsOpen={faqsOpen}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <div className={ownerPageLayoutClass}>
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
                  onClose={() => setShowDueService(false)}
                />
              ) : thoughtOfTheDay ? (
                <ThoughtOfTheDayCard text={thoughtOfTheDay} />
              ) : null}
            </>
          )}

        </div>
      </div>
    </OwnerPageShell>
  );
}
