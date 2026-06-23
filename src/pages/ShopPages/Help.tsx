import { useMemo } from "react";
import { toast } from "react-toastify";
import PortalHelpPage from "../../components/portal/PortalHelpPage";
import useAuth from "../../auth/useAuth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopServices } from "../../hooks/useShopServices";
import { apiMessage, submitEnquiry } from "../../lib/shopOwnerMutations";

export default function ShopHelpPage() {
  const { token } = useAuth();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const { categories, loading: servicesLoading } = useShopServices();

  const services = useMemo(
    () =>
      categories
        .map((c) => ({ id: c.id, name: c.name?.trim() || "" }))
        .filter((s) => s.id && s.name),
    [categories]
  );

  const handleSubmit = async (service: { id: string; name: string }, audioBlob: Blob) => {
    if (!token) {
      toast.error("Please sign in again.");
      return false;
    }
    const ext = audioBlob.type.includes("webm") ? "webm" : "m4a";
    const file = new File([audioBlob], `enquiry.${ext}`, { type: audioBlob.type });
    const res = await submitEnquiry(token, service.id, service.name, file);
    if (!res.ok) {
      toast.error(apiMessage(res.data) || "Could not submit your enquiry.");
      return false;
    }
    return true;
  };

  return (
    <PortalHelpPage
      metaDescription="Auto shop support and help tickets"
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
      services={services}
      servicesLoading={servicesLoading}
      onSubmit={handleSubmit}
    />
  );
}
