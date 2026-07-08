import { CarOwnerInfoContentScreen } from "@/components/car-owner/car-owner-info-content-screen";
import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";

export default function CarOwnerFaqsPage() {
  return (
    <CarOwnerStackScreenFrame title="FAQs">
      <CarOwnerInfoContentScreen
        fallbackHeading="Frequently Asked Questions"
        fallbackDesc="1. What services do you provide?\n2. What payment methods are accepted?\n3. How do I book a service?"
        selectContent={(response) => response?.dashboard?.FAQs}
      />
    </CarOwnerStackScreenFrame>
  );
}

