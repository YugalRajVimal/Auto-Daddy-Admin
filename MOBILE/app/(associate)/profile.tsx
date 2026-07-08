import {
  AssociateProfileField,
  AssociateProfileHeader,
  AssociateScrollScreenFrame,
} from "@/components/associate";
import { associateProfileStyles as styles } from "@/components/associate/associate-profile-styles";
import { useToast } from "@/components/reusables";
import { useAuth } from "@/context/auth-provider";
import { useLogoutAction } from "@/hooks/use-logout-action";
import { DUMMY_ASSOCIATE_PROFILE } from "@/lib/associate-dummy-data";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import { useMemo } from "react";
import { Text, View } from "react-native";

export default function AssociateProfilePage() {
  const { meta } = useAuth();
  const { showToast } = useToast();
  const handleLogout = useLogoutAction();

  const display = useMemo(
    () => ({
      name: meta?.name?.trim() || "Alex Morgan",
      email: DUMMY_ASSOCIATE_PROFILE.email,
      phone: DUMMY_ASSOCIATE_PROFILE.phone,
      city: DUMMY_ASSOCIATE_PROFILE.city,
      address: DUMMY_ASSOCIATE_PROFILE.address,
      pincode: DUMMY_ASSOCIATE_PROFILE.pincode,
      role: DUMMY_ASSOCIATE_PROFILE.role,
      photoUri: normalizeMediaUrl(meta?.profilePhoto ?? null),
    }),
    [meta?.name, meta?.profilePhoto]
  );

  return (
    <AssociateScrollScreenFrame title="Profile">
      <AssociateProfileHeader
        photoUri={display.photoUri}
        onEditPress={() =>
          showToast("Profile editing is coming soon.", { type: "info" })
        }
        onLogoutPress={() => void handleLogout()}
      />

      <View style={styles.card}>
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>Sample profile data</Text>
        </View>

        <AssociateProfileField label="Full name" value={display.name} icon="person-outline" />
        <AssociateProfileField label="Email" value={display.email} icon="mail-outline" />
        <AssociateProfileField label="Phone" value={display.phone} icon="call-outline" />
        <AssociateProfileField label="City" value={display.city} icon="business-outline" />
        <AssociateProfileField
          label="Address"
          value={display.address}
          icon="location-outline"
          multiline
        />
        <AssociateProfileField label="Zip Code" value={display.pincode} icon="map-outline" />
        <AssociateProfileField label="Role" value={display.role} icon="briefcase-outline" />
      </View>
    </AssociateScrollScreenFrame>
  );
}
