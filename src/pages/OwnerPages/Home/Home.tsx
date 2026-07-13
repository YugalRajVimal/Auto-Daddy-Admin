import OwnerDashboardGrid from "../../../components/owner/OwnerDashboardGrid";
import OwnerPageShell from "../../../components/owner/OwnerPageShell";

export default function OwnerHomePage() {
  return (
    <OwnerPageShell
      pageHeading=""
      metaTitle="Home | AutoDaddy"
      metaDescription="Car owner dashboard"
      noPanel
    >
      <OwnerDashboardGrid />
    </OwnerPageShell>
  );
}
