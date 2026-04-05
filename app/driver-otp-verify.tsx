import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../firebaseConfig";
import {
  sendEmailOtpCode,
  verifyEmailOtpCode,
} from "./service/gmail_smtp_service";

export default function DriverOtpVerify() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const driverDataStr = params.driverData as string | undefined;
  const driverData = driverDataStr ? JSON.parse(driverDataStr) : null;

  const [otpCode, setOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpRequestId, setOtpRequestId] = useState("");
  const [otpDevFallback, setOtpDevFallback] = useState("");

  useEffect(() => {
    if (driverData?.email) {
      handleSendOtp();
    }
  }, []);

  const handleSendOtp = async () => {
    if (!driverData?.email || !driverData?.fullName) {
      Alert.alert("Error", "Missing email or name data.");
      return;
    }

    try {
      setIsSendingOtp(true);
      console.log("[DriverOTPVerify] Sending OTP to:", driverData.email);
      
      const result = await sendEmailOtpCode({
        email: driverData.email,
        fullName: driverData.fullName,
      });

      setOtpSent(true);
      setOtpRequestId(result.requestId || "");
      setOtpDevFallback(result.otpForDevFallback || "");
      console.log("[DriverOTPVerify] OTP sent, dev fallback:", result.otpForDevFallback ? "Yes" : "No");

      if (result.otpForDevFallback) {
        Alert.alert(
          "OTP Sent (Dev Mode)",
          `Use this code for testing: ${result.otpForDevFallback}`
        );
      } else {
        Alert.alert("OTP Sent", `Verification code sent to ${driverData.email}`);
      }
    } catch (error) {
      console.error("[DriverOTPVerify] OTP send error:", error);
      if (error instanceof Error) {
        Alert.alert("OTP Error", error.message);
      } else {
        Alert.alert("OTP Error", "Failed to send verification code.");
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(otpCode.trim())) {
      Alert.alert("Invalid", "Enter a 6-digit code.");
      return;
    }

    try {
      setIsVerifying(true);
      console.log("[DriverOTPVerify] Verifying OTP code...");
      
      const verified = await verifyEmailOtpCode({
        email: driverData.email,
        code: otpCode.trim(),
        requestId: otpRequestId,
        otpForDevFallback: otpDevFallback,
      });

      if (!verified) {
        console.log("[DriverOTPVerify] OTP verification failed - invalid code");
        Alert.alert("Verification Failed", "Invalid OTP code.");
        return;
      }

      console.log("[DriverOTPVerify] OTP verified successfully");
      setOtpVerified(true);
      Alert.alert("Success", "Email verified. Creating account...");
      handleCreateAccountAndNavigate();
    } catch (error) {
      console.error("[DriverOTPVerify] OTP verify error:", error);
      let errorMessage = "Unable to verify OTP.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      Alert.alert("Verification Error", errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreateAccountAndNavigate = async () => {
    if (!driverData) {
      Alert.alert("Error", "Driver data is missing.");
      return;
    }

    try {
      setIsCreatingAccount(true);
      console.log("[DriverOTPVerify] Creating auth account for:", driverData.email);

      let user;
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        driverData.email,
        driverData.password
      );
      user = userCredential.user;
      console.log("[DriverOTPVerify] Auth account created:", user.uid);

      console.log("[DriverOTPVerify] Saving driver profile to Firestore...");
      try {
        await setDoc(doc(db, "drivers", user.uid), {
          uid: user.uid,
          fullName: driverData.fullName,
          email: driverData.email,
          phone: driverData.phone,
          gender: driverData.gender,
          nationality: driverData.nationality,
          pwd: driverData.pwd,
          profileImage: driverData.profileImage,
          accountStatus: "active",
          isDisabled: false,
          approvalStatus: "pending",
          emailVerified: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log("[DriverOTPVerify] Driver profile saved successfully:", user.uid);

        await AsyncStorage.setItem(
          "driver-core-info",
          JSON.stringify({
            ...driverData,
            uid: user.uid,
          })
        );
        await AsyncStorage.setItem("driver-registration-uid", user.uid);
      } catch (firestoreError) {
        console.error("[DriverOTPVerify] Firestore write error:", firestoreError);
        throw firestoreError;
      }

      await AsyncStorage.removeItem("driver-personal-info");

      console.log("[DriverOTPVerify] Navigating to personal-info-one...");
      router.replace("/personal-info-one");
    } catch (error: any) {
      console.error("[DriverOTPVerify] Account creation error:", error);
      let errorMessage = error.message || "An error occurred.";
      console.log("[DriverOTPVerify] Error type:", error.name);
      console.log("[DriverOTPVerify] Error code:", error.code);
      
      // Detect security rule errors
      if (errorMessage.includes("Permission denied") || errorMessage.includes("permission-denied")) {
        errorMessage = "❌ Firestore Security Rules blocking write. Admin must fix rules in Firebase Console.";
      } else if (errorMessage.includes("PERMISSION_DENIED")) {
        errorMessage = "❌ Database permission denied. Firestore rules must allow driver writes.";
      } else if (errorMessage.includes("email-already-in-use")) {
        errorMessage = "This email is already registered as a driver.";
      } else if (errorMessage.includes("wrong-password")) {
        errorMessage = "Incorrect password. Please try again.";
      } else if (errorMessage.includes("weak-password")) {
        errorMessage = "Password is too weak. Use at least 6 characters.";
      } else if (errorMessage.includes("user-not-found")) {
        errorMessage = "This email is not registered.";
      }
      
      Alert.alert("Account Creation Failed", errorMessage);
      setOtpVerified(false);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Verify Email</Text>
        </View>

        <Text style={styles.subtitle}>
          We've sent a 6-digit verification code to {driverData?.email}
        </Text>

        {!otpSent ? (
          <TouchableOpacity
            style={[styles.button, isSendingOtp && styles.buttonDisabled]}
            disabled={isSendingOtp}
            onPress={handleSendOtp}
          >
            <Text style={styles.buttonText}>
              {isSendingOtp ? "Sending..." : "Send OTP"}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.label}>Enter OTP Code</Text>
            <TextInput
              style={styles.input}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              value={otpCode}
              onChangeText={(text) =>
                setOtpCode(text.replace(/[^0-9]/g, "").slice(0, 6))
              }
              editable={!isVerifying && !isCreatingAccount}
            />

            <TouchableOpacity
              style={[
                styles.button,
                (isVerifying || isCreatingAccount || otpVerified) &&
                  styles.buttonDisabled,
              ]}
              disabled={isVerifying || isCreatingAccount || otpVerified}
              onPress={handleVerifyOtp}
            >
              {isVerifying ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.buttonText}>Verifying...</Text>
                </View>
              ) : isCreatingAccount ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.buttonText}>Creating Account...</Text>
                </View>
              ) : otpVerified ? (
                <Text style={styles.buttonText}>Email Verified ✓</Text>
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSendOtp} disabled={isSendingOtp}>
              <Text style={styles.resendLink}>
                {isSendingOtp ? "Sending..." : "Resend Code"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
  backText: { fontSize: 24, color: "#2E3A59" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E3A59",
    marginLeft: 10,
  },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 24, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#2E3A59", marginBottom: 8 },
  input: {
    height: 50,
    backgroundColor: "#F7F9FC",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EDF1F7",
    fontSize: 16,
    letterSpacing: 4,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#FF5E3A",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  resendLink: {
    color: "#FF5E3A",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 16,
  },
});
