import { AppBar, StackScreenFrame, TabScreenFrame } from "@/components/reusables";
import { CarOwnerStackScreenFrame } from "@/components/car-owner/car-owner-stack-screen-frame";
import { associateColors, associateGradients } from "@/constants/associate-theme";
import { colors, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { isAssociateRole } from "@/lib/associate-roles";
import { isCarOwnerRole } from "@/lib/car-owner-notification-read-state";
import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

const drawerInfoContentStyle = {
  paddingTop: spacing.lg,
  paddingHorizontal: spacing.screenHorizontal,
};

/** Stack chrome + safe area for info routes opened from the app drawer (all roles). */
export function DrawerInfoStackShell({ title, children }: Props) {
  const { meta } = useAuth();
  const role = meta?.role ?? null;

  if (isCarOwnerRole(role)) {
    return (
      <CarOwnerStackScreenFrame title={title} backTo="/(car-owner)/(tabs)/home">
        {children}
      </CarOwnerStackScreenFrame>
    );
  }

  if (isAssociateRole(role)) {
    return (
      <TabScreenFrame
        backgroundColor={associateColors.bg}
        statusBarBackgroundColor={associateColors.tabBarBg}
        headerGradient={[...associateGradients.header]}
        refreshTintColor={associateColors.primary}
        customTabBarHeight={0}
        contentContainerStyle={drawerInfoContentStyle}
        header={
          <AppBar title={title} leadingMode="back" />
        }
      >
        {children}
      </TabScreenFrame>
    );
  }

  const isShopOwner = (role ?? "").toLowerCase() === "autoshopowner";
  return (
    <StackScreenFrame
      title={title}
      backTo={isShopOwner ? "/(shop-owner)/(tabs)/home" : undefined}
      contentContainerStyle={drawerInfoContentStyle}
    >
      {children}
    </StackScreenFrame>
  );
}
