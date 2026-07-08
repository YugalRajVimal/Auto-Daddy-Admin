import { CarOwnerInfoContentScreen } from "@/components/car-owner/car-owner-info-content-screen";
import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";

export default function CarOwnerPrivacyPolicyPage() {
  return (
    <CarOwnerStackScreenFrame title="Privacy Policy">
      <CarOwnerInfoContentScreen
        fallbackHeading="Privacy Policy"
        fallbackDesc="Your privacy is important to us. All your data is handled securely and never shared with third parties without consent."
        selectContent={(response) => response?.dashboard?.privacyPolicy}
      />
    </CarOwnerStackScreenFrame>
  );
}

