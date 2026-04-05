import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { auth } from "../../firebaseConfig";

export default function AdminDashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/sign-in");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Panel</Text>
      <Text style={styles.subtitle}>Welcome, Administrator!</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardText}>Admin features are currently under development. You have successfully bypassed the Firestore collections check via Firebase Auth.</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F7F9FC", padding: 20 },
  title: { fontSize: 26, fontWeight: "bold", color: "#2E3A59", marginBottom: 5 },
  subtitle: { fontSize: 16, color: "gray", marginBottom: 40 },
  card: { backgroundColor: "white", padding: 20, borderRadius: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3, marginBottom: 40 },
  cardText: { fontSize: 15, color: "#444", textAlign: "center", lineHeight: 22 },
  button: { backgroundColor: "#FF5E3A", paddingVertical: 14, borderRadius: 8, width: 200, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 }
});
