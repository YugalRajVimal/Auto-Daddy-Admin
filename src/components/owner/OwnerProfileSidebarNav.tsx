import { useLocation, useNavigate } from "react-router";
import { ShopSidebarButton } from "../shop/ShopSidebar";

export default function OwnerProfileSidebarNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const onVehicles = location.pathname.startsWith("/owner/profile/vehicles");
  const onProfile = location.pathname.startsWith("/owner/profile") && !onVehicles;

  return (
    <div className="flex flex-col gap-2">
      <ShopSidebarButton label="Profile" active={onProfile} onClick={() => navigate("/owner/profile")} />
      <ShopSidebarButton
        label="My Vehicles"
        active={onVehicles}
        onClick={() => navigate("/owner/profile/vehicles")}
      />
    </div>
  );
}

