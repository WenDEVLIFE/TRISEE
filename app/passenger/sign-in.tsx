import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PassengerSignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // Navigating directly to home for the UI preview
    router.replace("/passenger/home");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to TRISEE</Text>
          <Text style={styles.subtitle}>Passenger App</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to TRISEE? </Text>
            <TouchableOpacity onPress={() => router.push("/passenger/sign-up")}>
              <Text style={styles.link}>Create Passenger Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  header: { marginBottom: 40, alignItems: "center" },
  title: { fontSize: 32, fontWeight: "bold", color: "#2E3A59" },
  subtitle: { fontSize: 18, color: "#8E99B3", marginTop: 8 },
  form: { width: "100%" },
  label: { fontSize: 14, fontWeight: "600", color: "#2E3A59", marginBottom: 8 },
  input: {
    height: 50, backgroundColor: "#F7F9FC", borderRadius: 8, paddingHorizontal: 16,
    marginBottom: 20, borderWidth: 1, borderColor: "#EDF1F7", fontSize: 16
  },
  button: {
    backgroundColor: "#FF5E3A", height: 50, borderRadius: 8,
    justifyContent: "center", alignItems: "center", marginTop: 10
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { color: "#8E99B3", fontSize: 14 },
  link: { color: "#FF5E3A", fontSize: 14, fontWeight: "bold" },
});
