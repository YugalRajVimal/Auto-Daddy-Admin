import {
  AssociateGreetingCard,
  AssociateQuickActions,
  AssociateTabBar,
  AssociateThoughtOfTheDay,
  ASSOCIATE_TAB_BAR_OFFSET,
} from "@/components/associate";
import { AppBar, NetworkStatusStrip, TabScreenFrame } from "@/components/reusables";
import { associateColors, associateGradients } from "@/constants/associate-theme";
import { spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useAndroidExitOnBack } from "@/hooks/use-android-exit-on-back";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

const PLACEHOLDER_QUOTE =
  "Success is the sum of small efforts, repeated day in and day out.";

export default function AssociateHomePage() {
  const { meta } = useAuth();
  useAndroidExitOnBack();
  const [refreshing, setRefreshing] = useState(false);

  const displayName = meta?.name?.trim() || "Associate";
  const photoUri = normalizeMediaUrl(meta?.profilePhoto);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <View style={styles.shell}>
      <TabScreenFrame
        backgroundColor={associateColors.bg}
        statusBarBackgroundColor={associateColors.tabBarBg}
        headerGradient={[...associateGradients.header]}
        refreshTintColor={associateColors.primary}
        contentContainerStyle={styles.scrollContent}
        bottomInsetExtra={spacing.lg}
        customTabBarHeight={ASSOCIATE_TAB_BAR_OFFSET}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        header={<AppBar title="AutoDaddy" />}
      >
        <NetworkStatusStrip style={styles.networkStrip} />
        <AssociateGreetingCard displayName={displayName} profilePhotoUri={photoUri} />
        <AssociateQuickActions />
        <AssociateThoughtOfTheDay quote={PLACEHOLDER_QUOTE} />
        <View style={styles.bottomSpacer} />
      </TabScreenFrame>
      <AssociateTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.sm,
  },
  networkStrip: { marginBottom: spacing.sm },
  bottomSpacer: { height: spacing.sm },
});
