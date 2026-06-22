import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import OwnerFaqsDialog from "../../components/owner/OwnerFaqsDialog";
import OwnerServiceSidebar from "../../components/owner/OwnerServiceSidebar";
import { useCarOwnerDashboard, useCarOwnerServiceSidebar } from "../../hooks/useOwnerPortal";

const HERO_IMAGE =
  "https://cdn.prod.website-files.com/682bafcf9a7a236122010f96/684aaaa7513a914ea33079fb_67b4a931485b522bb83b2779_Brief%25207b%2520Cars%2520(1).gif";

export default function OwnerHomePage() {
  const { thoughtOfTheDay, faqsHeading, faqsDescription, loading } = useCarOwnerDashboard();
  const { indoor, outdoor, loading: servicesLoading } = useCarOwnerServiceSidebar();
  const [faqsOpen, setFaqsOpen] = useState(false);

  return (
    <PortalPageContent className="flex flex-col px-3 py-3 sm:px-4 md:py-4 lg:px-6">
      <PageMeta title="Home | AutoDaddy" description="Car owner home" />

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
        <OwnerServiceSidebar
          indoor={indoor}
          outdoor={outdoor}
          loading={servicesLoading}
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
                src={HERO_IMAGE}
                alt="AutoDaddy hero"
                className="absolute inset-0 h-full w-full object-cover"
              />

              {thoughtOfTheDay ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-[16%] z-10 flex justify-center px-6 sm:bottom-[18%]">
                  <div
                    className="max-w-lg rotate-[-1.5deg] border border-gray-200/80 bg-white/95 px-8 py-5 shadow-lg"
                    style={{
                      clipPath:
                        "polygon(0% 4%, 3% 0%, 8% 3%, 14% 0%, 22% 4%, 30% 1%, 38% 4%, 46% 0%, 54% 3%, 62% 0%, 70% 4%, 78% 1%, 86% 4%, 94% 0%, 100% 3%, 100% 96%, 97% 100%, 90% 97%, 82% 100%, 74% 96%, 66% 100%, 58% 97%, 50% 100%, 42% 96%, 34% 100%, 26% 97%, 18% 100%, 10% 96%, 4% 100%, 0% 97%)",
                    }}
                  >
                    <p className="text-center font-serif text-lg italic leading-relaxed text-gray-800 md:text-xl">
                      {thoughtOfTheDay}
                    </p>
                  </div>
                </div>
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
