import { useMemo } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../auth";
import PortalHelpPage from "../../components/portal/PortalHelpPage";
import { useCarOwnerServiceSidebar } from "../../hooks/useOwnerPortal";
import {
  apiMessage,
  audioBlobToFile,
  inviteHelpAdminCarOwner,
} from "../../lib/inviteHelpApi";

export default function OwnerHelpPage() {
  const { token } = useAuth();
  const { indoor, outdoor, loading: servicesLoading } = useCarOwnerServiceSidebar();

  const services = useMemo(
    () =>
      [...indoor, ...outdoor]
        .map((c) => ({ id: c.id?.trim() || "", name: c.name?.trim() || "" }))
        .filter((s) => s.id && s.name),
    [indoor, outdoor],
  );

  return (
    <PortalHelpPage
      metaDescription="Car owner support and help tickets"
      services={services}
      servicesLoading={servicesLoading}
      onSubmit={async (service, audioBlob) => {
        if (!token) {
          toast.error("Please sign in again.");
          return false;
        }
        const file = audioBlobToFile(audioBlob);
        const res = await inviteHelpAdminCarOwner(token, service.id, service.name, file);
        if (!res.ok) {
          toast.error(apiMessage(res.data) || "Could not submit your help request.");
          return false;
        }
        return true;
      }}
    />
  );
}
