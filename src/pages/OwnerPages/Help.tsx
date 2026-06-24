import PortalHelpPage from "../../components/portal/PortalHelpPage";
import { useCarOwnerDashboard } from "../../hooks/useOwnerPortal";

const SUBJECT_OPTIONS = [
  { id: "general", name: "General enquiry" },
  { id: "app", name: "App issue" },
  { id: "billing", name: "Billing & payments" },
  { id: "vehicles", name: "Vehicles & documents" },
  { id: "shops", name: "Auto shops & services" },
  { id: "other", name: "Other" },
];

export default function OwnerHelpPage() {
  const { faqsHeading, faqsDescription } = useCarOwnerDashboard();

  return (
    <PortalHelpPage
      metaDescription="Car owner support and help tickets"
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
      services={SUBJECT_OPTIONS}
      servicesLoading={false}
      onSubmit={async () => true}
    />
  );
}
