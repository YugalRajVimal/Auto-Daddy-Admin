import { AppBar, TabScreenFrame } from "@/components/reusables";
import {
  ASSOCIATE_TAB_BAR_OFFSET,
  AssociateTabBar,
} from "@/components/associate/associate-tab-bar";
import { associateColors, associateGradients } from "@/constants/associate-theme";
import { fontSizes, spacing, typography } from "@/constants/autodaddy";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  subtitle?: string;
  showTabBar?: boolean;
  leadingMode?: "menu" | "back";
  onBackPress?: () => void;
};

export function AssociatePlaceholderScreen({
  title,
  subtitle = "Coming soon",
  showTabBar = true,
  leadingMode = "menu",
  onBackPress,
}: Props) {
  return (
    <View style={styles.shell}>
      <TabScreenFrame
        backgroundColor={associateColors.bg}
        statusBarBackgroundColor={associateColors.tabBarBg}
        headerGradient={[...associateGradients.header]}
        refreshTintColor={associateColors.primary}
        customTabBarHeight={showTabBar ? ASSOCIATE_TAB_BAR_OFFSET : 0}
        bottomInsetExtra={spacing.lg}
        header={
          <AppBar
            title={title}
            leadingMode={leadingMode}
            onBackPress={onBackPress}
          />
        }
      >
        <View style={styles.body}>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </TabScreenFrame>
      {showTabBar ? <AssociateTabBar /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  body: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },
  subtitle: {
    ...typography.bodyMuted,
    fontSize: fontSizes.lg,
    textAlign: "center",
  },
});
