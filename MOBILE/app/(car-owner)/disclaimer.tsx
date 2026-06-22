import { CarOwnerInfoContentScreen } from "@/components/car-owner/car-owner-info-content-screen";
import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";

export default function CarOwnerDisclaimerPage() {
  return (
    <CarOwnerStackScreenFrame title="Disclaimer">
      <CarOwnerInfoContentScreen
        fallbackHeading="Disclaimer"
        fallbackDesc="All repairs are subject to part availability. Pricing may vary based on model and condition."
        selectContent={(response) => response?.dashboard?.disclaimer}
      />
    </CarOwnerStackScreenFrame>
  );
}

