import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRootNavigationState, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { auth, db } from "../firebaseConfig";

export default function Index() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If no valid auth session, prompt login
      if (!user) {
        router.replace("/sign-in");
        return;
      }

      // Check if user is an admin by email
      const emailInfo = user.email?.toLowerCase() || "";
      if (emailInfo.includes("admin")) {
        router.replace("/admin/dashboard");
        return;
      }

      try {
        // Check if Passenger
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data()?.role === "user") {
          router.replace("/passenger/home");
          return;
        }

        // Check if Driver
        const driverDoc = await getDoc(doc(db, "drivers", user.uid));
        if (driverDoc.exists()) {
          const driverData = driverDoc.data() || {};
          const hasUploadedIdDocs = Boolean(
            driverData.idType && driverData.idFrontImage && driverData.idBackImage
          );

          if (!hasUploadedIdDocs) {
            await AsyncStorage.setItem("driver-registration-uid", user.uid);
            await AsyncStorage.setItem(
              "driver-core-info",
              JSON.stringify({
                uid: user.uid,
                fullName: driverData.fullName || "Driver",
                email: driverData.email || user.email || "",
                phone: driverData.phone || "",
                gender: driverData.gender || "",
                nationality: driverData.nationality || "",
                pwd: driverData.pwd || "",
                profileImage: driverData.profileImage || null,
              })
            );
            router.replace("/personal-info-one");
            return;
          }

          router.replace("/driver/home");
          return;
        }

        // If neither doc exists but they have auth, fall back to creation/setup
        router.replace("/create-account");
      } catch (err) {
        console.error("Session check error", err);
        router.replace("/sign-in");
      }
    });

    return () => unsubscribe();
  }, [rootNavigationState?.key]);

  // Display a loading spinner while session initializes
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
      <ActivityIndicator size="large" color="#005eff" />
    </View>
  );
}