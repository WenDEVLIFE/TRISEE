import { Stack } from "expo-router";

export default function DriverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f8f8f8" } }}>
      <Stack.Screen name="home" options={{ title: "Driver Dashboard" }} />
      <Stack.Screen name="ride-status" options={{ title: "Active Ride" }} />
    </Stack>
  );
}
