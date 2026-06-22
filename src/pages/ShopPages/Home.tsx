import PageMeta from "../../components/common/PageMeta";
import AdminPage from "../../components/admin/AdminPage";
import { ContentPanel } from "../../components/admin/ContentPanel";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import DashboardPanelCard from "../../components/COMP";
import { useAuth } from "../../auth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";

export default function ShopHomePage() {
  const { profile } = useAuth();
  const { displayName, city, daysLeft, thoughtOfTheDay, loading } = useShopOwnerPortal();

  const name = displayName || profile?.name || "Auto Shop";
  const location = city || profile?.city || "";

  return (
    <PortalPageContent>
      <PageMeta title="Dashboard | AutoDaddy" description="Auto shop owner dashboard" />

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
        </div>
      ) : (
        <div className="space-y-4">
          <AdminPage title={`Welcome, ${name}`} noPanel>
            <ContentPanel title="Thought of the Day">
              <p className="font-serif text-lg italic text-gray-700">{thoughtOfTheDay}</p>
              {location ? (
                <p className="mt-3 text-sm text-gray-500">
                  Location: <span className="font-semibold text-ad-green-dark">{location}</span>
                </p>
              ) : null}
            </ContentPanel>
          </AdminPage>

          <section>
            <h2 className="mb-2 font-serif text-base font-bold text-ad-green-dark">Subscription</h2>
            <div className="flex flex-wrap gap-2">
              <DashboardPanelCard className="min-w-[140px] flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-ad-green-light text-sm font-bold text-ad-green-dark">
                    {daysLeft ?? "—"}
                  </div>
                  <span className="font-serif text-xs font-bold text-ad-green-dark">Days Left</span>
                </div>
              </DashboardPanelCard>
            </div>
          </section>
        </div>
      )}
    </PortalPageContent>
  );
}
