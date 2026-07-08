import { CarOwnerInfoContentScreen } from "@/components/car-owner/car-owner-info-content-screen";
import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";

export default function CarOwnerAboutPage() {
  return (
    <CarOwnerStackScreenFrame title="About Us">
      <CarOwnerInfoContentScreen
        fallbackHeading="About Our Auto Shop"
        fallbackDesc="We are committed to providing top-notch automobile services for all makes and models. Customer satisfaction is our priority."
        selectContent={(response) => response?.dashboard?.aboutUs}
      />
    </CarOwnerStackScreenFrame>
  );
}

