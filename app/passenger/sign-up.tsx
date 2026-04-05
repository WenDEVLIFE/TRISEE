import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  sendEmailOtpCode,
  verifyEmailOtpCode,
} from "../service/gmail_smtp_service";
import { registerPassengerWithEmailOtp } from "../service/registration";

export default function PassengerSignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // Kept standard input for phone per user request
  const [password, setPassword] = useState("");

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [emailOtpRequestId, setEmailOtpRequestId] = useState("");
  const [emailDevOtpFallback, setEmailDevOtpFallback] = useState("");

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSendEmailOtp = name.trim().length > 1 && isEmailValid && phone.trim().length > 5 && !emailOtpVerified;
  const canEmailRegister = name.trim().length > 1 && isEmailValid && password.length >= 6 && emailOtpVerified && phone.trim().length > 5;

  const handleSendEmailOtp = async () => {
    if (!canSendEmailOtp) {
      Alert.alert("Incomplete", "Enter full name, valid phone number, and valid email first.");
      return;
    }

    try {
      setIsSendingOtp(true);
      const result = await sendEmailOtpCode({
        email: email.trim(),
        fullName: name.trim(),
      });

      setEmailOtpSent(true);
      setEmailOtpVerified(false);
      setEmailOtpRequestId(result.requestId || "");
      setEmailDevOtpFallback(result.otpForDevFallback || "");

      // 🧪 DEV: shows OTP in alert — remove before production
      Alert.alert(
        "OTP sent ✅",
        `Code sent to ${email.trim()}\n\n[TEST] OTP: ${result.otpForDevFallback}`
      );
    } catch (error) {
      if (error instanceof Error) Alert.alert("Email OTP error", error.message);
      else Alert.alert("Email OTP error", "Failed to send OTP code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtpSent || !/^\d{6}$/.test(emailOtpCode)) {
      Alert.alert("Incomplete", "Enter the 6-digit email OTP code.");
      return;
    }
    try {
      setIsSubmitting(true);
      const verified = await verifyEmailOtpCode({
        email: email.trim(),
        code: emailOtpCode.trim(),
        requestId: emailOtpRequestId,
        otpForDevFallback: emailDevOtpFallback,
      });

      if (!verified) {
        Alert.alert("Verification failed", "Invalid OTP code.");
        return;
      }
      setEmailOtpVerified(true);
      Alert.alert("Verified", "Email OTP verification completed.");
    } catch (error) {
      if (error instanceof Error) Alert.alert("Verification failed", error.message);
      else Alert.alert("Verification failed", "Unable to verify OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailRegistration = async () => {
    if (!canEmailRegister) return;
    if (!emailOtpVerified) {
      Alert.alert("Verify email", "Please verify email OTP before creating account.");
      return;
    }

    try {
      setIsSubmitting(true);

      await registerPassengerWithEmailOtp({
        fullName: name.trim(),
        email: email.trim(),
        phoneNumber: phone.trim(),
        password: password.trim(),
      });

      Alert.alert("Success", "Passenger account created successfully.");
      router.replace("/passenger/home");
    } catch (error) {
      let errorMessage = "Unable to create account.";
      if (error instanceof Error) {
        const code = (error as any).code || "";
        if (code === "auth/email-already-in-use") {
          errorMessage = "This email is already registered. Please sign in or use a different email.";
        } else if (code === "auth/weak-password") {
          errorMessage = "Password is too weak. Use at least 6 characters.";
        } else if (code === "auth/invalid-email") {
          errorMessage = "Invalid email address format.";
        } else if (code === "permission-denied" || errorMessage.includes("Permission denied")) {
          errorMessage = "❌ Firestore rules blocking write. Enable writes for the users collection in Firebase Console.";
        } else {
          errorMessage = error.message;
        }
      }
      Alert.alert("Sign up failed", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Register as Passenger</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} placeholder="Juan Dela Cruz" value={name} onChangeText={setName} />

          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneRow}>
            <View style={styles.prefixBox}><Text style={styles.prefixText}>+63</Text></View>
            <TextInput
              style={styles.phoneInput}
              placeholder="9XXXXXXXXX"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, "").slice(0, 10))}
            />
          </View>

          <Text style={styles.label}>Email Address</Text>
          <TextInput style={styles.input} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

          <TouchableOpacity
            style={[styles.secondaryButton, (!canSendEmailOtp) && styles.buttonDisabled]}
            disabled={!canSendEmailOtp || isSendingOtp || isSubmitting}
            onPress={handleSendEmailOtp}
          >
            <Text style={styles.secondaryButtonText}>{isSendingOtp ? "Sending Email OTP..." : "Send Email OTP"}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Email OTP Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit code"
            keyboardType="number-pad"
            maxLength={6}
            value={emailOtpCode}
            onChangeText={(text) => setEmailOtpCode(text.replace(/[^0-9]/g, "").slice(0, 6))}
          />
          <TouchableOpacity
            style={[styles.secondaryButton, emailOtpVerified && styles.buttonDisabled]}
            disabled={emailOtpVerified || isSubmitting}
            onPress={handleVerifyEmailOtp}
          >
            <Text style={styles.secondaryButtonText}>{emailOtpVerified ? "Email OTP Verified" : "Verify Email OTP"}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="Create a password" secureTextEntry value={password} onChangeText={setPassword} />

          <TouchableOpacity
            style={[styles.button, !canEmailRegister && styles.buttonDisabled]}
            onPress={handleEmailRegistration}
            disabled={!canEmailRegister || isSubmitting}
          >
            <Text style={styles.buttonText}>{isSubmitting ? "Creating..." : "Create Account"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 24, paddingVertical: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  backText: { fontSize: 24, color: "#2E3A59" },
  title: { fontSize: 24, fontWeight: "bold", color: "#2E3A59", marginLeft: 10 },
  form: { width: "100%" },
  label: { fontSize: 14, fontWeight: "600", color: "#2E3A59", marginBottom: 8 },
  input: {
    height: 50, backgroundColor: "#F7F9FC", borderRadius: 8, paddingHorizontal: 16,
    marginBottom: 20, borderWidth: 1, borderColor: "#EDF1F7", fontSize: 16
  },
  phoneRow: {
    flexDirection: "row", height: 50, marginBottom: 16, borderWidth: 1,
    borderColor: "#EDF1F7", borderRadius: 8, backgroundColor: "#F7F9FC", overflow: "hidden",
  },
  prefixBox: { width: 56, justifyContent: "center", alignItems: "center", borderRightWidth: 1, borderRightColor: "#E5E7EB" },
  prefixText: { fontWeight: "700", color: "#2E3A59" },
  phoneInput: { flex: 1, paddingHorizontal: 12, fontSize: 16 },
  secondaryButton: {
    height: 46, borderRadius: 8, justifyContent: "center", alignItems: "center",
    marginBottom: 20, borderWidth: 1, borderColor: "#FF5E3A",
  },
  secondaryButtonText: { color: "#FF5E3A", fontSize: 15, fontWeight: "700" },
  button: {
    backgroundColor: "#FF5E3A", height: 50, borderRadius: 8,
    justifyContent: "center", alignItems: "center", marginTop: 20
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
