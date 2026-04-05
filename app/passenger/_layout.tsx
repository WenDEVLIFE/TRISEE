import { Stack } from "expo-router";

export default function PassengerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f8f8f8" } }}>
      <Stack.Screen name="sign-in" options={{ title: "Sign In" }} />
      <Stack.Screen name="sign-up" options={{ title: "Sign Up" }} />
      <Stack.Screen name="home" options={{ title: "Home" }} />
      <Stack.Screen name="profile" options={{ title: "Profile", presentation: "modal" }} />
      <Stack.Screen name="ride-status" options={{ title: "Ride Status" }} />
      <Stack.Screen name="history" options={{ title: "Ride History" }} />
      <Stack.Screen name="rating" options={{ title: "Rate Driver", presentation: "modal" }} />
    </Stack>
  );
}
