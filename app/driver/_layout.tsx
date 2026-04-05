import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function DriverLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF5E3A",
        tabBarInactiveTintColor: "#8E99B3",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#EDF1F7",
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ride-status"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
