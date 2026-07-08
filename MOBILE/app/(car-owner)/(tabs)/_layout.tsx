import { Tabs } from "expo-router";

export default function CarOwnerTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none", height: 0 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
    </Tabs>
  );
}

