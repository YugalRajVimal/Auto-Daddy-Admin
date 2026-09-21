import OwnerDashboardGrid from "../../../components/owner/OwnerDashboardGrid";
import OwnerPageShell from "../../../components/owner/OwnerPageShell";

/** Home → Garage Overview: the stats dashboard (moved off the Home landing page). */
export default function OwnerDashboardPage() {
  return (
    <OwnerPageShell
      pageHeading="Garage Overview"
      metaTitle="Garage Overview | AutoDaddy"
      metaDescription="Car owner dashboard"
    >
      <OwnerDashboardGrid />
    </OwnerPageShell>
  );
}
