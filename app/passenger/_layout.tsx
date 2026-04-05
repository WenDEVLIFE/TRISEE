import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function PassengerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#005EFF",
        tabBarInactiveTintColor: "#8E99B3",
        tabBarStyle: {
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ride-status"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="rating"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="sign-up"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
