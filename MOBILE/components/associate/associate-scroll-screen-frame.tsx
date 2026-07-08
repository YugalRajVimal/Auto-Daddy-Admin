import { AppBar, TabScreenFrame } from "@/components/reusables";
import {
  ASSOCIATE_TAB_BAR_OFFSET,
  AssociateTabBar,
} from "@/components/associate/associate-tab-bar";
import { associateColors, associateGradients } from "@/constants/associate-theme";
import { spacing } from "@/constants/autodaddy";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  title: string;
  children: ReactNode;
  showTabBar?: boolean;
  leadingMode?: "menu" | "back";
  onBackPress?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
};

export function AssociateScrollScreenFrame({
  title,
  children,
  showTabBar = true,
  leadingMode = "menu",
  onBackPress,
  onRefresh,
  refreshing = false,
}: Props) {
  return (
    <View style={styles.shell}>
      <TabScreenFrame
        backgroundColor={associateColors.bg}
        statusBarBackgroundColor={associateColors.tabBarBg}
        headerGradient={[...associateGradients.header]}
        refreshTintColor={associateColors.primary}
        contentContainerStyle={styles.scrollContent}
        bottomInsetExtra={spacing.lg}
        customTabBarHeight={showTabBar ? ASSOCIATE_TAB_BAR_OFFSET : 0}
        onRefresh={onRefresh}
        refreshing={refreshing}
        header={
          <AppBar title={title} leadingMode={leadingMode} onBackPress={onBackPress} />
        }
      >
        {children}
      </TabScreenFrame>
      {showTabBar ? <AssociateTabBar /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
});
