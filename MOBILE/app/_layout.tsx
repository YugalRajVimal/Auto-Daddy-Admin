import { AppDrawerContent } from "@/components/home";
import { ToastProvider } from "@/components/reusables";
import { colors } from "@/constants/autodaddy";
import { AuthProvider } from "@/context/auth-provider";
import { CarOwnerNotificationsProvider } from "@/context/car-owner-notifications-provider";
import { ShopOwnerNotificationsProvider } from "@/context/shop-owner-notifications-provider";
import { registerFcmShopOwnerBadgeHandlers } from "@/lib/fcm-shop-owner-badge";
import {
  configureForegroundNotificationPresentation,
  subscribeFcmForegroundMessages,
} from "@/lib/fcm-foreground-notifications";
import { ensureAppPermissions } from "@/lib/app-permissions";
import { Drawer } from "expo-router/drawer";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useMemo, useState } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Keep native splash up until the first React tree mounts.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [showBootSplash, setShowBootSplash] = useState(true);
  const splashBg = colors.successMuted;
  const logoSource = useMemo(() => require("../assets/images/logo-rectangle.png"), []);

  useEffect(() => {
    let unsubscribeFcm = () => undefined;

    try {
      registerFcmShopOwnerBadgeHandlers();
      configureForegroundNotificationPresentation();
      unsubscribeFcm = subscribeFcmForegroundMessages();
    } catch (error) {
      console.warn("[startup] notification bootstrap skipped", error);
    }

    void ensureAppPermissions().catch((error) => {
      console.warn("[startup] permission bootstrap skipped", error);
    });

    return () => unsubscribeFcm();
  }, []);

  useEffect(() => {
    // Hide native splash and keep a short in-app splash to avoid Android 12 icon-masked cropping.
    let cancelled = false;
    void (async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // ignore
      }
      setTimeout(() => {
        if (!cancelled) setShowBootSplash(false);
      }, 450);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ShopOwnerNotificationsProvider>
          <CarOwnerNotificationsProvider>
          <ToastProvider>
            <View style={styles.root}>
              <Drawer
                drawerContent={(props) => <AppDrawerContent {...props} />}
                // Don't pop drawer sibling history on Android back — home screens exit the app,
                // and stack frames handle their own back. Prevents Home ↔ prior-screen loops.
                backBehavior="none"
                screenOptions={{
                  headerShown: false,
                  // iOS back-swipe uses the left edge; drawer swipe interferes with it.
                  // Keep the sidebar accessible via the menu button instead.
                  swipeEnabled: Platform.OS !== "ios",
                }}
              >
                <Drawer.Screen name="index" options={{ swipeEnabled: false, drawerItemStyle: { display: "none" } }} />
                <Drawer.Screen name="login" options={{ swipeEnabled: false, drawerItemStyle: { display: "none" } }} />
                {/* Route groups themselves are not navigable screens; register their tab roots instead. */}
                <Drawer.Screen name="(shop-owner)/(tabs)" options={{ drawerItemStyle: { display: "none" } }} />
                <Drawer.Screen name="(car-owner)/(tabs)" options={{ drawerItemStyle: { display: "none" } }} />
                <Drawer.Screen name="(associate)/(tabs)" options={{ drawerItemStyle: { display: "none" } }} />

                {/* Standalone info screens */}
                <Drawer.Screen name="about" options={{ drawerItemStyle: { display: "none" } }} />
                <Drawer.Screen name="privacypolicy" options={{ drawerItemStyle: { display: "none" } }} />
                <Drawer.Screen name="faqs" options={{ drawerItemStyle: { display: "none" } }} />
                <Drawer.Screen name="documents" options={{ drawerItemStyle: { display: "none" } }} />
                <Drawer.Screen name="disclaimer" options={{ drawerItemStyle: { display: "none" } }} />
              </Drawer>

              {showBootSplash ? (
                <View style={[styles.bootSplash, { backgroundColor: splashBg }]} pointerEvents="none">
                  <Image source={logoSource} style={styles.bootLogo} resizeMode="contain" />
                </View>
              ) : null}
            </View>
          </ToastProvider>
          </CarOwnerNotificationsProvider>
          </ShopOwnerNotificationsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bootSplash: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  bootLogo: {
    width: "100%",
    // Match the native Android splash icon scale (avoid a noticeable jump).
    maxWidth: 260,
    height: 70,
  },
});
