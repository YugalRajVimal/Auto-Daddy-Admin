import { CarOwnerInfoContentScreen } from "@/components/car-owner/car-owner-info-content-screen";
import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";

export default function CarOwnerDocumentsPage() {
  return (
    <CarOwnerStackScreenFrame title="Documents">
      <CarOwnerInfoContentScreen
        fallbackHeading="Important Documents"
        fallbackDesc="Here you'll find warranty, registration, and insurance documents required for various services."
        selectContent={(response) => response?.dashboard?.documents}
      />
    </CarOwnerStackScreenFrame>
  );
}
